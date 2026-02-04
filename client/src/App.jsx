import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubscriberCard from './components/SubscriberCard';

const API_BASE = '/api';

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ dueToday: 0, overdue: 0, totalCollections: 0 });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeSubscriber, setActiveSubscriber] = useState(null);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    cycle: 1,
    daysDown: 0
  });
  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    referenceNo: '',
    receiptImage: '',
    month: 'February 2026'
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

  const handleOpenPaymentModal = (subscriber) => {
    setActiveSubscriber(subscriber);
    setPaymentData({
      amountPaid: subscriber.remainingBalance !== undefined ? subscriber.remainingBalance : subscriber.amountDue,
      referenceNo: '',
      receiptImage: '',
      month: 'February 2026'
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenHistoryModal = (subscriber) => {
    setActiveSubscriber(subscriber);
    setIsHistoryModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/subscribers/${activeSubscriber._id}/payments`, paymentData, config);
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };

  const handleQuickPay = async (id) => {
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
        daysDown: subscriber.daysDown || 0
      });
    } else {
      setEditingSubscriber(null);
      setFormData({
        name: '',
        rate: 0,
        cycle: 1,
        daysDown: 0
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

  const filteredSubscribers = subscribers.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.cycle.toString().includes(searchTerm)
  );

  const groups = {
    overdue: filteredSubscribers.filter(sub => sub.status === 'Overdue' || sub.status === 'Due Today'),
    upcoming: filteredSubscribers.filter(sub => sub.status === 'Upcoming'),
    paid: filteredSubscribers.filter(sub => sub.status === 'Paid')
  };

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
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-white/20">
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
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Subscribers</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalSubscribers || subscribers.length}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/30 relative overflow-hidden border-t-4 border-t-indigo-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Revenue</p>
            <p className="text-3xl font-black text-indigo-600">₱{(stats.totalMonthlyRevenue || 0).toLocaleString()}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/30 relative overflow-hidden border-t-4 border-t-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Collected</p>
            <p className="text-3xl font-black text-emerald-600">₱{stats.totalCollections.toLocaleString()}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/30 relative overflow-hidden border-t-4 border-t-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overdue</p>
                <p className="text-3xl font-black text-red-500">{stats.overdue}</p>
              </div>
              <div className="bg-red-50/50 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/30 relative overflow-hidden border-t-4 border-t-amber-400">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Today</p>
                <p className="text-3xl font-black text-amber-500">{stats.dueToday}</p>
              </div>
              <div className="bg-amber-50/50 p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar - Glassmorphism */}
        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or billing cycle (e.g. 'Bonete' or '7')..."
            className="w-full bg-white/50 backdrop-blur-md border border-white/40 rounded-[2.5rem] py-6 pl-16 pr-8 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 shadow-xl shadow-slate-200/20 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Responsive Grouped Grid */}
        <main className="space-y-16">
          {/* Overdue / Due Today Section */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Overdue & Due Today</h2>
                <span className="bg-rose-100 text-rose-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {groups.overdue.length} Accounts
                </span>
              </div>
            </div>
            {groups.overdue.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {groups.overdue.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No overdue accounts found</p>
              </div>
            )}
          </section>

          {/* Upcoming Section */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Upcoming Bills</h2>
                <span className="bg-indigo-100 text-indigo-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {groups.upcoming.length} Accounts
                </span>
              </div>
            </div>
            {groups.upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {groups.upcoming.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No upcoming bills found</p>
              </div>
            )}
          </section>

          {/* Paid Section */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Settled Accounts</h2>
                <span className="bg-emerald-100 text-emerald-600 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {groups.paid.length} Accounts
                </span>
              </div>
            </div>
            {groups.paid.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                {groups.paid.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No settled accounts found</p>
              </div>
            )}
          </section>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Days Without Internet</label>
                <input
                  type="number"
                  min="0" max="30"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  value={formData.daysDown}
                  onChange={(e) => setFormData({...formData, daysDown: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
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

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Confirm Payment</h2>
            <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">{activeSubscriber?.name}</p>

            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Remaining</span>
                  <span className="text-xl font-black text-indigo-600">₱{(activeSubscriber?.remainingBalance !== undefined ? activeSubscriber.remainingBalance : activeSubscriber?.amountDue).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount to Pay (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  value={paymentData.amountPaid}
                  onChange={(e) => setPaymentData({...paymentData, amountPaid: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference No. (e.g. GCash)</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  placeholder="Optional reference number"
                  value={paymentData.referenceNo}
                  onChange={(e) => setPaymentData({...paymentData, referenceNo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Image (Simulated)</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentData({...paymentData, receiptImage: 'receipt_' + Date.now() + '.png'})}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed transition-all font-bold text-xs uppercase tracking-widest ${paymentData.receiptImage ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {paymentData.receiptImage ? 'Receipt Captured' : 'Upload Receipt'}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all tracking-widest uppercase text-[11px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all tracking-widest uppercase text-[11px]"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-slate-100 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment History</h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{activeSubscriber?.name}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {activeSubscriber?.payments?.length > 0 ? (
                activeSubscriber.payments.slice().reverse().map((p, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black text-slate-900">₱{p.amountPaid.toLocaleString()}</span>
                        <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{p.month}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(p.date).toLocaleDateString()} • Ref: {p.referenceNo || 'N/A'}
                      </p>
                    </div>
                    {p.receiptImage && (
                      <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-500 cursor-help" title="View Receipt (Simulated)">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-300 font-black uppercase tracking-widest">No payment records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
