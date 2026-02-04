import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubscriberCard from './components/SubscriberCard';

const API_BASE = '/api';

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ dueToday: 0, overdue: 0, totalCollections: 0 });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    cycle: 1,
    creditType: 'None',
    creditPreference: 'None'
  });

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [subsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/subscribers`, config),
        axios.get(`${API_BASE}/stats`, config)
      ]);
      setSubscribers(subsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, credentials);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setSubscribers([]);
  };

  const handlePay = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`${API_BASE}/subscribers/${id}/pay`, {}, config);
      fetchData();
    } catch (error) {
      console.error('Error paying:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/subscribers/${id}`, config);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleOpenModal = (subscriber = null) => {
    if (subscriber) {
      setEditingSubscriber(subscriber);
      setFormData({
        name: subscriber.name,
        rate: subscriber.rate,
        cycle: subscriber.cycle,
        creditType: subscriber.creditType,
        creditPreference: subscriber.creditPreference || 'None'
      });
    } else {
      setEditingSubscriber(null);
      setFormData({
        name: '',
        rate: 0,
        cycle: 1,
        creditType: 'None',
        creditPreference: 'None'
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingSubscriber) {
        await axios.put(`${API_BASE}/subscribers/${editingSubscriber._id}`, formData, config);
      } else {
        await axios.post(`${API_BASE}/subscribers`, formData, config);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving subscriber:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 mb-6">Login to manage subscribers</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform">
              SIGN IN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Desktop Header/Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">BAYADNET</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Subscriber Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-black px-6 py-3 rounded-xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 tracking-widest uppercase"
            >
              + Add Subscriber
            </button>
            <button
              onClick={handleLogout}
              className="text-[11px] font-black text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 px-5 py-3 rounded-xl transition-all uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Horizontal Stats Bar - Premium Minimalist */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Subscribers</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalSubscribers || subscribers.length}</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden border-t-4 border-t-indigo-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Revenue</p>
            <p className="text-3xl font-black text-indigo-600">₱{(stats.totalMonthlyRevenue || 0).toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden border-t-4 border-t-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Collected</p>
            <p className="text-3xl font-black text-emerald-600">₱{stats.totalCollections.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden border-t-4 border-t-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overdue</p>
                <p className="text-3xl font-black text-red-500">{stats.overdue}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden border-t-4 border-t-amber-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Today</p>
                <p className="text-3xl font-black text-amber-500">{stats.dueToday}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Responsive Grid */}
        <main>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Active Subscribers</h2>
            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              February 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subscribers.map(sub => (
              <SubscriberCard
                key={sub._id}
                subscriber={sub}
                onPay={handlePay}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </main>
      </div>

      {/* CRUD Modal - Premium Glassmorphism */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">
              {editingSubscriber ? 'Edit Account' : 'New Subscriber'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="e.g. Juan Dela Cruz"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rate (₱)</label>
                  <input
                    type="number"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cycle Day</label>
                  <input
                    type="number"
                    min="1" max="31"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    value={formData.cycle}
                    onChange={(e) => setFormData({...formData, cycle: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Credit Type</label>
                <select
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 appearance-none bg-white"
                  value={formData.creditType}
                  onChange={(e) => setFormData({...formData, creditType: e.target.value})}
                >
                  <option value="None">No Credit</option>
                  <option value="2 Weeks">2 Weeks (Storm Credit)</option>
                  <option value="1 Month">1 Month Free</option>
                </select>
              </div>
              {formData.creditType === '2 Weeks' && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Credit Preference</label>
                  <select
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 appearance-none bg-white"
                    value={formData.creditPreference}
                    onChange={(e) => setFormData({...formData, creditPreference: e.target.value})}
                  >
                    <option value="None">Choose Preference...</option>
                    <option value="Discount">50% Off Discount</option>
                    <option value="Extension">14 Days Extension</option>
                  </select>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all tracking-widest uppercase text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all tracking-widest uppercase text-[11px]"
                >
                  {editingSubscriber ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
