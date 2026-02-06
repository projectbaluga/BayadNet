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

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'staff': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'technician': return 'bg-gray-50 text-gray-700 border-gray-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-1">Control access for staff & technicians</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-md shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-wide"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-md flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-bold text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">User</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="group hover:bg-gray-50/80 transition-colors text-sm">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{user.name || 'No Name'}</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-1">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-600">
                    {user.email || '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all border border-transparent hover:border-indigo-100"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all border border-transparent hover:border-red-100"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-xl p-6 animate-in zoom-in duration-200 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'New User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-md transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Role</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 appearance-none bg-white text-sm"
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  {editingUser ? 'New Password' : 'Password'}
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-md hover:bg-gray-50 transition-all uppercase text-[10px] tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-md shadow-sm hover:bg-indigo-700 active:scale-95 transition-all uppercase text-[10px] tracking-wide"
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-xl p-8 animate-in zoom-in duration-200 border border-gray-200 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-900">@{userToDelete?.username}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-md hover:bg-gray-50 transition-all uppercase text-[10px] tracking-wide"
              >
                No, Keep
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-md shadow-sm hover:bg-red-700 active:scale-95 transition-all uppercase text-[10px] tracking-wide"
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
