import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, Trash2, X, Shield, Mail, User as UserIcon, Loader2, AlertTriangle } from 'lucide-react';

const API_BASE = '/api';

const UserManagement = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'staff'
  });

  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`, config);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username,
        password: '', // Don't show password
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'staff'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`${API_BASE}/users/${editingUser._id}`, formData, config);
      } else {
        await axios.post(`${API_BASE}/users`, formData, config);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`${API_BASE}/users/${userToDelete._id}`, config);
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
      setIsDeleteConfirmOpen(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'staff': return 'bg-red-100 text-red-700 border-red-200';
      case 'technician': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Control access for staff & technicians</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 tracking-widest uppercase"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-bold text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user._id} className="group hover:bg-slate-50/50 transition-colors text-xs">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-none">{user.name || 'No Name'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-600">
                    {user.email || '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in duration-300 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {editingUser ? 'Edit User' : 'New User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 appearance-none bg-white text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="technician">Technician</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  {editingUser ? 'New Password' : 'Password'}
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-400 font-bold py-3 rounded-xl hover:bg-slate-100 transition-all tracking-widest uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all tracking-widest uppercase text-[10px]"
                >
                  {editingUser ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-slate-100 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete User?</h3>
            <p className="text-slate-500 font-medium mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-900">@{userToDelete?.username}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-slate-50 text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all uppercase text-[11px] tracking-widest"
              >
                No, Keep
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all uppercase text-[11px] tracking-widest"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
