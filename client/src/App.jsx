import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Loader2, ShieldCheck } from 'lucide-react';
import SubscriberCard from './components/SubscriberCard';
import SettingsModal from './components/SettingsModal';
import UserManagement from './components/UserManagement';
import CheckStatus from './pages/CheckStatus';

const API_BASE = '/api';

// INFRASTRUCTURE RECOVERY: Ensure Socket respects HTTPS origin for WSS compatibility
const socketURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

const socket = io(socketURL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

const Dashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [analytics, setAnalytics] = useState({ totalExpected: 0, totalCollected: 0, currentProfit: 0, providerCost: 0, groupCounts: {} });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [receiptToView, setReceiptToView] = useState(null);
  const [activeSubscriber, setActiveSubscriber] = useState(null);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({ name: '', rate: 0, cycle: 1, messengerId: '', contactNo: '', daysDown: 0 });
  const [paymentData, setPaymentData] = useState({ amountPaid: 0, referenceNo: '', receiptImage: '', month: 'February 2026' });

  useEffect(() => {
    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [subsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/subscribers`, config),
        axios.get(`${API_BASE}/analytics`, config)
      ]);
      setSubscribers(subsRes.data);
      setAnalytics(analyticsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('[Recovery] Data fetch failed:', error);
      if (error.response?.status === 401 || error.response?.status === 403) handleLogout();
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, credentials);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      // RECOVERY: Store name for Seen system
      localStorage.setItem('user', JSON.stringify({ name: res.data.name, role: res.data.role }));
      setToken(res.data.token);
      setUserRole(res.data.role);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setToken(null);
    setUserRole(null);
    setSubscribers([]);
    setView('dashboard');
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/subscribers/${activeSubscriber._id}/payments`, paymentData, config);
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this subscriber?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE}/subscribers/${id}`, config);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleOpenModal = (subscriber = null) => {
    if (subscriber) {
      setEditingSubscriber(subscriber);
      setFormData({ name: subscriber.name, rate: subscriber.rate, cycle: subscriber.cycle, messengerId: subscriber.messengerId || '', contactNo: subscriber.contactNo || '', daysDown: subscriber.daysDown || 0 });
    } else {
      setEditingSubscriber(null);
      setFormData({ name: '', rate: 0, cycle: 1, messengerId: '', contactNo: '', daysDown: 0 });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingSubscriber) await axios.put(`${API_BASE}/subscribers/${editingSubscriber._id}`, formData, config);
      else await axios.post(`${API_BASE}/subscribers`, formData, config);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-indigo-600" /></div>;

  if (!token) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-black mb-6">BAYADNET PRO</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" className="w-full px-4 py-3 rounded-xl border" placeholder="Username" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})} required />
          <input type="password" className="w-full px-4 py-3 rounded-xl border" placeholder="Password" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all">SIGN IN</button>
        </form>
      </div>
    </div>
  );

  const filteredSubscribers = subscribers.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.cycle.toString().includes(searchTerm));
  const groups = {
    overdue: filteredSubscribers.filter(sub => sub.status === 'Overdue' || sub.status === 'Due Today' || sub.status === 'Partial'),
    upcoming: filteredSubscribers.filter(sub => sub.status === 'Upcoming'),
    paid: filteredSubscribers.filter(sub => sub.status === 'Paid')
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><ShieldCheck /></div>
          <h1 className="text-xl font-black">BAYADNET PRO</h1>
        </div>
        <nav className="flex gap-6">
          <button onClick={() => setView('dashboard')} className={`font-black uppercase text-[11px] ${view==='dashboard'?'text-indigo-600':'text-slate-400'}`}>Dashboard</button>
          {userRole === 'admin' && <button onClick={() => setView('users')} className={`font-black uppercase text-[11px] ${view==='users'?'text-indigo-600':'text-slate-400'}`}>Users</button>}
        </nav>
        <div className="flex items-center gap-4">
          {userRole === 'admin' && <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">+ Subscriber</button>}
          <button onClick={handleLogout} className="text-[10px] font-black uppercase text-slate-400">Logout</button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-10">
        {view === 'users' ? <UserManagement token={token} /> : (
          <div className="space-y-10">
            <input type="text" placeholder="Search..." className="w-full p-6 rounded-[2rem] border shadow-xl outline-none focus:ring-2 focus:ring-indigo-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {groups.overdue.map(sub => <SubscriberCard key={sub._id} subscriber={sub} onPay={handleOpenPaymentModal} onHistory={() => setIsHistoryModalOpen(true)} onViewReceipt={setReceiptToView} onEdit={handleOpenModal} onDelete={handleDelete} userRole={userRole} token={token} socket={socket} onRefresh={fetchData} />)}
              {groups.upcoming.map(sub => <SubscriberCard key={sub._id} subscriber={sub} onPay={handleOpenPaymentModal} onHistory={() => setIsHistoryModalOpen(true)} onViewReceipt={setReceiptToView} onEdit={handleOpenModal} onDelete={handleDelete} userRole={userRole} token={token} socket={socket} onRefresh={fetchData} />)}
              {groups.paid.map(sub => <SubscriberCard key={sub._id} subscriber={sub} onPay={handleOpenPaymentModal} onHistory={() => setIsHistoryModalOpen(true)} onViewReceipt={setReceiptToView} onEdit={handleOpenModal} onDelete={handleDelete} userRole={userRole} token={token} socket={socket} onRefresh={fetchData} />)}
            </section>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">{editingSubscriber ? 'Edit' : 'New'} Subscriber</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <input type="text" className="w-full p-4 rounded-xl border" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full p-4 rounded-xl border" placeholder="Rate" value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} required />
                <input type="number" className="w-full p-4 rounded-xl border" placeholder="Cycle" value={formData.cycle} onChange={(e) => setFormData({...formData, cycle: e.target.value})} required />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 bg-slate-100 rounded-xl font-black uppercase text-[11px]">Cancel</button>
                <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[11px]">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-black mb-6">Confirm Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <input type="number" step="0.01" className="w-full p-4 rounded-xl border" value={paymentData.amountPaid} onChange={(e) => setPaymentData({...paymentData, amountPaid: e.target.value})} required />
              <input type="text" className="w-full p-4 rounded-xl border" placeholder="Ref No." value={paymentData.referenceNo} onChange={(e) => setPaymentData({...paymentData, referenceNo: e.target.value})} />
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 p-4 bg-slate-100 rounded-xl font-black uppercase text-[11px]">Cancel</button>
                <button type="submit" className="flex-1 p-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[11px]">Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptToView && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-6" onClick={() => setReceiptToView(null)}>
          <img src={receiptToView} className="max-w-full max-h-[90vh] rounded-2xl" alt="Receipt" />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/check-status" element={<CheckStatus />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
