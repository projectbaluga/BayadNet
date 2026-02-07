import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus, Wifi, WifiOff, RefreshCw, UploadCloud } from 'lucide-react';

const API_BASE = '/api';

const RouterSettings = ({ token }) => {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: ''
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE}/routers`, config);
      setRouters(res.data);
    } catch (err) {
      console.error('Error fetching routers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_BASE}/routers/${id}/test`, {}, config);
      alert(`Connection Test: ${res.data.connected ? 'SUCCESS' : 'FAILED'}\nMessage: ${res.data.message}`);
      fetchRouters(); // Refresh status
    } catch (err) {
      alert(`Error testing connection: ${err.message}`);
    }
  };

  const handlePushConfig = async (id) => {
    const serverIp = prompt("Please confirm the Server Address (IP or Domain) for the landing page:", window.location.hostname);
    if (!serverIp) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_BASE}/routers/${id}/push-config`, { serverIp }, config);
      alert(`Success: ${res.data.message}`);
    } catch (err) {
      alert(`Error pushing config: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? Subscribers linked to this router will lose connectivity management.')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/routers/${id}`, config);
      fetchRouters();
    } catch (err) {
      console.error('Error deleting router:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingRouter) {
        await axios.put(`${API_BASE}/routers/${editingRouter._id}`, formData, config);
      } else {
        await axios.post(`${API_BASE}/routers`, formData, config);
      }
      setIsFormOpen(false);
      setEditingRouter(null);
      setFormData({ name: '', host: '', port: 8728, username: '', password: '' });
      fetchRouters();
    } catch (err) {
      console.error('Error saving router:', err);
      alert('Failed to save router.');
    }
  };

  const handleEdit = (router) => {
    setEditingRouter(router);
    setFormData({
      name: router.name,
      host: router.host,
      port: router.port,
      username: router.username,
      password: router.password
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Mikrotik Routers</h3>
        <button
          onClick={() => { setIsFormOpen(true); setEditingRouter(null); setFormData({ name: '', host: '', port: 8728, username: '', password: '' }); }}
          className="flex items-center gap-1 bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-3 h-3" /> Add Router
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 mb-4">
           <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">{editingRouter ? 'Edit Router' : 'New Router'}</h4>
           <div className="grid grid-cols-2 gap-3">
              <input
                type="text" placeholder="Name (e.g. Main Router)"
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
              />
              <input
                type="text" placeholder="Host / IP"
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs"
                value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} required
              />
              <input
                type="number" placeholder="Port (8728)"
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs"
                value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} required
              />
              <input
                type="text" placeholder="Username"
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs"
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required
              />
              <input
                type="password" placeholder="Password"
                className="w-full px-3 py-2 rounded border border-gray-300 text-xs"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
              />
           </div>
           <div className="flex gap-2 justify-end mt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs text-gray-500 font-bold uppercase hover:underline">Cancel</button>
              <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase hover:bg-indigo-700">Save</button>
           </div>
        </form>
      )}

      <div className="space-y-2">
        {routers.map(router => (
          <div key={router._id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:border-indigo-200 transition-all">
            <div>
               <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${router.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <p className="text-xs font-bold text-gray-900">{router.name}</p>
               </div>
               <p className="text-[10px] text-gray-400 font-medium ml-4">{router.host}:{router.port}</p>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => handlePushConfig(router._id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Push Configuration">
                  <UploadCloud className="w-3 h-3" />
               </button>
               <button onClick={() => handleTestConnection(router._id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Test Connection">
                  <RefreshCw className="w-3 h-3" />
               </button>
               <button onClick={() => handleEdit(router)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                  <Edit className="w-3 h-3" />
               </button>
               <button onClick={() => handleDelete(router._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-3 h-3" />
               </button>
            </div>
          </div>
        ))}
        {routers.length === 0 && !loading && (
            <p className="text-center text-xs text-gray-400 py-4 italic">No routers configured.</p>
        )}
      </div>
    </div>
  );
};

export default RouterSettings;
