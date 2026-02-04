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
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-10 bg-gray-50">
      <header className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-gray-900 leading-tight">Subscriber MGMT</h1>
          <p className="text-xs text-gray-500 font-medium">Feb 2026 • Billing Dashboard</p>
        </div>
        <button onClick={handleLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          LOGOUT
        </button>
      </header>

      <section className="p-6 grid grid-cols-2 gap-4">
        <div className="bg-red-500 p-4 rounded-3xl text-white shadow-lg shadow-red-100">
          <p className="text-xs font-bold opacity-80 uppercase">Overdue</p>
          <p className="text-3xl font-black">{stats.overdue}</p>
        </div>
        <div className="bg-yellow-400 p-4 rounded-3xl text-white shadow-lg shadow-yellow-100">
          <p className="text-xs font-bold opacity-80 uppercase">Due Today</p>
          <p className="text-3xl font-black">{stats.dueToday}</p>
        </div>
        <div className="bg-indigo-600 col-span-2 p-5 rounded-3xl text-white shadow-lg shadow-indigo-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold opacity-80 uppercase">Total Collections</p>
            <p className="text-3xl font-black">₱{stats.totalCollections.toLocaleString()}</p>
          </div>
          <div className="bg-white/20 p-2 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </section>

      <main className="px-6 flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Subscribers
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{subscribers.length}</span>
          </h2>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            + ADD NEW
          </button>
        </div>
        {subscribers.map(sub => (
          <SubscriberCard
            key={sub._id}
            subscriber={sub}
            onPay={handlePay}
            onEdit={handleOpenModal}
            onDelete={handleDelete}
          />
        ))}
      </main>

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
