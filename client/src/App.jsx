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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header/Navbar */}
      <header className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">BayadNet</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Subscriber MGMT System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="text-lg">+</span> ADD SUBSCRIBER
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Horizontal Stats Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Subscribers</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalSubscribers || subscribers.length}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Monthly Revenue</p>
            <p className="text-2xl font-black text-indigo-600">₱{(stats.totalMonthlyRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Collected</p>
            <p className="text-2xl font-black text-green-600">₱{stats.totalCollections.toLocaleString()}</p>
          </div>
          <div className="bg-red-500 p-5 rounded-3xl shadow-lg shadow-red-100 text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">Overdue Accounts</p>
            <p className="text-2xl font-black">{stats.overdue}</p>
          </div>
          <div className="bg-yellow-400 p-5 rounded-3xl shadow-lg shadow-yellow-100 text-white">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">Due Today</p>
            <p className="text-2xl font-black">{stats.dueToday}</p>
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

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {editingSubscriber ? 'Edit Subscriber' : 'Add Subscriber'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rate (₱)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cycle Day</label>
                  <input
                    type="number"
                    min="1" max="31"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.cycle}
                    onChange={(e) => setFormData({...formData, cycle: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Credit Type</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.creditType}
                  onChange={(e) => setFormData({...formData, creditType: e.target.value})}
                >
                  <option value="None">None</option>
                  <option value="2 Weeks">2 Weeks (Storm Credit)</option>
                  <option value="1 Month">1 Month Free</option>
                </select>
              </div>
              {formData.creditType === '2 Weeks' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Credit Preference</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.creditPreference}
                    onChange={(e) => setFormData({...formData, creditPreference: e.target.value})}
                  >
                    <option value="None">Choose Preference...</option>
                    <option value="Discount">50% Off Discount</option>
                    <option value="Extension">14 Days Extension</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
                >
                  {editingSubscriber ? 'UPDATE' : 'SAVE'}
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
