import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import SubscriberCard from './components/SubscriberCard';
import SettingsModal from './components/SettingsModal';
import UserManagement from './components/UserManagement';
import EmailInbox from './components/EmailInbox';
import IssueChatModal from './components/IssueChatModal';
import SubscriberDetailsModal from './components/SubscriberDetailsModal';
import AddressSelector from './components/AddressSelector';
import Home from './pages/Home';
import { convertToBase64, compressImage } from './utils/image';

const API_BASE = '/api';

// Connect to socket. If localhost:3000, point to 5000. Otherwise, use same origin (proxied by Nginx)
const socketURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

const socket = io(socketURL, {
  transports: ['polling', 'websocket'], // Matching backend
  withCredentials: true
});

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
const notificationSound = new Audio(NOTIFICATION_SOUND_URL);

const Dashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ dueToday: 0, overdue: 0, totalCollections: 0 });
  const [analytics, setAnalytics] = useState({ totalExpected: 0, totalCollected: 0, currentProfit: 0, providerCost: 0, groupCounts: {} });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'users', 'emails'
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [receiptToView, setReceiptToView] = useState(null);
  const [activeSubscriber, setActiveSubscriber] = useState(null);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    street: '',
    geoAddress: '',
    address: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    regionCode: '',
    provinceCode: '',
    cityCode: '',
    psgc: '',
    planName: 'Residential Plan',
    bandwidth: '50Mbps',
    rate: 0,
    cycle: 1,
    messengerId: '',
    contactNo: '',
    daysDown: 0,
    startDate: new Date().toISOString().split('T')[0],
    initialPayment: false
  });
  const [paymentData, setPaymentData] = useState({
    amountPaid: 0,
    referenceNo: '',
    receiptImage: '',
    month: ''
  });

  const getLatestSubscriberData = (sub) => {
    if (!sub) return null;
    return subscribers.find(s => s._id === sub._id) || sub;
  };

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleReportAdded = ({ subscriberId, report, issueStatus }) => {
      setSubscribers(prev => prev.map(s =>
        s._id === subscriberId ? { ...s, reports: [...(s.reports || []), report], issueStatus: issueStatus || 'Open' } : s
      ));

      // Notification sound
      try {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        if (report.reporterName !== (currentUser.name || currentUser.username)) {
          notificationSound.play().catch(() => {});
        }
      } catch (e) {}
    };

    const handleReportsRead = ({ subscriberId, reports }) => {
      setSubscribers(prev => prev.map(s =>
        s._id === subscriberId ? { ...s, reports } : s
      ));
    };

    const handleIssueResolved = ({ subscriberId, status }) => {
      setSubscribers(prev => prev.map(s =>
        s._id === subscriberId ? { ...s, issueStatus: status } : s
      ));
    };

    const handleNewMessage = (message) => {
      notificationSound.play().catch(() => {});
      // Ideally we'd show a toast here or increment a counter
    };

    socket.on('report-added', handleReportAdded);
    socket.on('reports-read', handleReportsRead);
    socket.on('issue-resolved', handleIssueResolved);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('report-added', handleReportAdded);
      socket.off('reports-read', handleReportsRead);
      socket.off('issue-resolved', handleIssueResolved);
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  const [isFetching, setIsFetching] = useState(false);
  const fetchData = async () => {
    if (isFetching) return;
    try {
      setIsFetching(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [subsRes, statsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/subscribers`, config),
        axios.get(`${API_BASE}/stats`, config),
        axios.get(`${API_BASE}/analytics`, config)
      ]);
      setSubscribers(subsRes.data);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
      setLoading(false);
    } finally {
      setIsFetching(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, credentials);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUserRole(res.data.role);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
      month: subscriber.currentMonthName || 'February 2026'
    });
    setIsPaymentModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(base64);
          setPaymentData({ ...paymentData, receiptImage: compressed });
        } else {
          setPaymentData({ ...paymentData, receiptImage: base64 });
        }
      } catch (error) {
        console.error("Error converting file:", error);
      }
    }
  };

  const handleOpenHistoryModal = (subscriber) => {
    setActiveSubscriber(subscriber);
    setIsHistoryModalOpen(true);
  };

  const handleOpenChatModal = (subscriber) => {
    setActiveSubscriber(subscriber);
    setIsChatModalOpen(true);
  };

  const handleOpenDetailsModal = (subscriber) => {
    setActiveSubscriber(subscriber);
    setIsDetailsModalOpen(true);
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
    if (!window.confirm('Are you sure you want to Archive this subscriber? Their history will be preserved but they will no longer appear in the active list.')) return;
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
        accountId: subscriber.accountId || '',
        street: subscriber.street || '',
        geoAddress: '', // Will be populated by selector or we don't care initially if address is full string
        address: subscriber.address || '',
        region: subscriber.region || '',
        province: subscriber.province || '',
        city: subscriber.city || '',
        barangay: subscriber.barangay || '',
        regionCode: subscriber.regionCode || '',
        provinceCode: subscriber.provinceCode || '',
        cityCode: subscriber.cityCode || '',
        psgc: subscriber.psgc || '',
        planName: subscriber.planName || 'Residential Plan',
        bandwidth: subscriber.bandwidth || '50Mbps',
        rate: subscriber.rate,
        cycle: subscriber.cycle,
        messengerId: subscriber.messengerId || '',
        contactNo: subscriber.contactNo || '',
        daysDown: subscriber.daysDown || 0,
        startDate: subscriber.startDate ? new Date(subscriber.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingSubscriber(null);
      setFormData({
        name: '',
        accountId: '',
        street: '',
        geoAddress: '',
        address: '',
        region: '',
        province: '',
        city: '',
        barangay: '',
        regionCode: '',
        provinceCode: '',
        cityCode: '',
        psgc: '',
        planName: 'Residential Plan',
        bandwidth: '50Mbps',
        rate: 0,
        cycle: 1,
        messengerId: '',
        contactNo: '',
        daysDown: 0,
        startDate: new Date().toISOString().split('T')[0],
        initialPayment: false
      });
    }
    setIsModalOpen(true);
  };

  const handleAddressChange = (addrData) => {
    setFormData(prev => {
        const newData = {
            ...prev,
            geoAddress: addrData.address,
            address: `${prev.street ? prev.street + ', ' : ''}${addrData.address}`,
            region: addrData.region,
            province: addrData.province,
            city: addrData.city,
            barangay: addrData.barangay,
            psgc: addrData.psgc,
            regionCode: addrData.regionCode,
            provinceCode: addrData.provinceCode,
            cityCode: addrData.cityCode
        };

        // Auto-generate ID logic
        if (addrData.psgc && (addrData.psgc !== prev.psgc || !prev.accountId)) {
             const random3 = Math.floor(Math.random() * 900) + 100; // 100-999
             newData.accountId = `${addrData.psgc}${random3}`;
        }
        return newData;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingSubscriber) {
        // Exclude initialPayment from update to avoid re-triggering logic if we had it
        const { initialPayment, ...updateData } = formData;
        await axios.put(`${API_BASE}/subscribers/${editingSubscriber._id}`, updateData, config);
      } else {
        // Prepare payload
        const payload = { ...formData };
        if (payload.initialPayment) {
           payload.initialPayment = { amountPaid: parseFloat(payload.rate) };
        }
        await axios.post(`${API_BASE}/subscribers`, payload, config);
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
    withIssues: filteredSubscribers.filter(sub => sub.issueStatus === 'Open'),
    overdue: filteredSubscribers.filter(sub => (sub.status === 'Overdue' || sub.status === 'Due Today' || sub.status === 'Partial') && sub.issueStatus !== 'Open'),
    upcoming: filteredSubscribers.filter(sub => sub.status === 'Upcoming' && sub.issueStatus !== 'Open'),
    paid: filteredSubscribers.filter(sub => sub.status === 'Paid' && sub.issueStatus !== 'Open')
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 mb-6">Login to manage subscribers</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const efficiency = Math.round((analytics.totalCollected / (analytics.totalExpected || 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">BAYADNET PRO</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Management & Analytics</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 ml-12 mr-auto">
            <button
              onClick={() => setView('dashboard')}
              className={`text-xs font-semibold uppercase tracking-wide transition-all ${view === 'dashboard' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dashboard
            </button>
            {(userRole === 'admin' || userRole === 'staff') && (
               <button
                 onClick={() => setView('emails')}
                 className={`text-xs font-semibold uppercase tracking-wide transition-all ${view === 'emails' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Email
               </button>
            )}
            {userRole === 'admin' && (
              <button
                onClick={() => setView('users')}
                className={`text-xs font-semibold uppercase tracking-wide transition-all ${view === 'users' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Users
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-2.5 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-indigo-600 transition-all border border-gray-200 shadow-sm"
                  title="Admin Settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  + Add Subscriber
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:bg-red-50 px-4 py-2.5 rounded-md transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'users' && userRole === 'admin' ? (
          <UserManagement token={token} />
        ) : view === 'emails' && (userRole === 'admin' || userRole === 'staff') ? (
           <EmailInbox token={token} />
        ) : (
          <>
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Collection Efficiency Chart */}
          <div className="lg:col-span-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg className="h-20 w-20 transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                <circle
                  cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - (analytics.totalCollected / (analytics.totalExpected || 1)))}
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">{efficiency}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Efficiency</p>
              <h3 className="text-2xl font-bold text-gray-900 leading-none">₱{analytics.totalCollected.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">of ₱{analytics.totalExpected.toLocaleString()} expected</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Net Profit</p>
                <p className={`text-xl font-bold ${analytics.currentProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  ₱{analytics.currentProfit.toLocaleString()}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-2">After ₱{analytics.providerCost?.toLocaleString()} Cost</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden border-l-4 border-l-red-500">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.groupCounts['Overdue'] || 0}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Accounts</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden border-l-4 border-l-amber-400">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Partial</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.groupCounts['Partial'] || 0}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Accounts</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden border-l-4 border-l-emerald-500">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Paid</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.groupCounts['Paid'] || 0}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Accounts</p>
            </div>
          </div>
        </section>

        {/* Search Bar - Professional */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search accounts by name or cycle date..."
            className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <main className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">With Issues</h2>
                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {groups.withIssues.length}
                </span>
              </div>
            </div>
            {groups.withIssues.length > 0 ? (
              <div className="flex flex-col gap-3">
                {groups.withIssues.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onOpenChat={handleOpenChatModal}
                    onViewReceipt={(img) => setReceiptToView(img)}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onViewDetails={handleOpenDetailsModal}
                    userRole={userRole}
                    token={token}
                    socket={socket}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 font-medium text-sm">No active issues found</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Overdue & Partial</h2>
                <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {groups.overdue.length}
                </span>
              </div>
            </div>
            {groups.overdue.length > 0 ? (
              <div className="flex flex-col gap-3">
                {groups.overdue.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onOpenChat={handleOpenChatModal}
                    onViewReceipt={(img) => setReceiptToView(img)}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onViewDetails={handleOpenDetailsModal}
                    userRole={userRole}
                    token={token}
                    socket={socket}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 font-medium text-sm">No overdue accounts found</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Upcoming</h2>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {groups.upcoming.length}
                </span>
              </div>
            </div>
            {groups.upcoming.length > 0 ? (
              <div className="flex flex-col gap-3">
                {groups.upcoming.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onOpenChat={handleOpenChatModal}
                    onViewReceipt={(img) => setReceiptToView(img)}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onViewDetails={handleOpenDetailsModal}
                    userRole={userRole}
                    token={token}
                    socket={socket}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 font-medium text-sm">No upcoming bills found</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Settled</h2>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {groups.paid.length}
                </span>
              </div>
            </div>
            {groups.paid.length > 0 ? (
              <div className="flex flex-col gap-3 opacity-75 hover:opacity-100 transition-all duration-200">
                {groups.paid.map(sub => (
                  <SubscriberCard
                    key={sub._id}
                    subscriber={sub}
                    onPay={handleOpenPaymentModal}
                    onHistory={handleOpenHistoryModal}
                    onOpenChat={handleOpenChatModal}
                    onViewReceipt={(img) => setReceiptToView(img)}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onViewDetails={handleOpenDetailsModal}
                    userRole={userRole}
                    token={token}
                    socket={socket}
                    onRefresh={fetchData}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 font-medium text-sm">No settled accounts found</p>
              </div>
            )}
          </section>
        </main>
        </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-6 animate-in zoom-in duration-200 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSubscriber ? 'Edit Account' : 'New Subscriber'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">

              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Account Info</h3>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Street / House No.</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                    value={formData.street}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        street: e.target.value,
                        address: `${e.target.value}, ${prev.geoAddress}`
                    }))}
                  />
                </div>

                <AddressSelector
                    value={formData}
                    onChange={handleAddressChange}
                    className="pt-1"
                />

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Account ID</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                    value={formData.accountId}
                    onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Plan Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                        value={formData.planName}
                        onChange={(e) => setFormData({...formData, planName: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bandwidth</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                        value={formData.bandwidth}
                        onChange={(e) => setFormData({...formData, bandwidth: e.target.value})}
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Billing & Contact</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Rate (₱)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                      value={formData.rate}
                      onChange={(e) => setFormData({...formData, rate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Cycle Day</label>
                    <input
                      type="number"
                      min="1" max="31"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                      value={formData.cycle}
                      onChange={(e) => setFormData({...formData, cycle: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Messenger</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                      placeholder="ID/User"
                      value={formData.messengerId}
                      onChange={(e) => setFormData({...formData, messengerId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contact No.</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                      placeholder="0912..."
                      value={formData.contactNo}
                      onChange={(e) => setFormData({...formData, contactNo: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Days Without Internet</label>
                  <input
                    type="number"
                    min="0" max="30"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                    value={formData.daysDown}
                    onChange={(e) => setFormData({...formData, daysDown: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>

                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Start Date</label>
                   <input
                     type="date"
                     className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                     value={formData.startDate}
                     onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                   />
                </div>

                {!editingSubscriber && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="initialPayment"
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            checked={formData.initialPayment}
                            onChange={(e) => setFormData({...formData, initialPayment: e.target.checked})}
                        />
                        <label htmlFor="initialPayment" className="text-sm font-bold text-indigo-900 cursor-pointer select-none">
                            Mark Initial Month as Paid (Advance Payment)
                        </label>
                    </div>
                )}
              </div>

              {editingSubscriber && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2">Status Overview</h3>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Status</p>
                        <p className={`text-xs font-black uppercase ${
                             editingSubscriber.status === 'Paid' ? 'text-emerald-600' :
                             editingSubscriber.status === 'Overdue' ? 'text-rose-600' : 'text-orange-500'
                        }`}>
                            {editingSubscriber.status}
                        </p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-xs font-black text-slate-700">₱{editingSubscriber.remainingBalance !== undefined ? editingSubscriber.remainingBalance.toLocaleString() : editingSubscriber.amountDue.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Due Date</p>
                        <p className="text-xs font-black text-slate-700">{editingSubscriber.dueDate}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Payment</p>
                        <p className="text-xs font-black text-slate-700">
                            {editingSubscriber.payments && editingSubscriber.payments.length > 0
                                ? new Date(editingSubscriber.payments[editingSubscriber.payments.length - 1].date).toLocaleDateString()
                                : 'No records'}
                        </p>
                     </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-md hover:bg-gray-50 transition-all text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-md shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all text-xs uppercase"
                >
                  {editingSubscriber ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-xl p-6 animate-in zoom-in duration-200 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm Payment</h2>
            <p className="text-gray-500 text-xs font-semibold mb-6 uppercase tracking-wide">
              {getLatestSubscriberData(activeSubscriber)?.name}
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Total Remaining</span>
                  <span className="text-xl font-bold text-indigo-700">
                    ₱{(getLatestSubscriberData(activeSubscriber)?.remainingBalance !== undefined
                      ? getLatestSubscriberData(activeSubscriber).remainingBalance
                      : getLatestSubscriberData(activeSubscriber)?.amountDue)?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Amount to Pay</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={paymentData.amountPaid}
                  onChange={(e) => setPaymentData({...paymentData, amountPaid: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Reference No.</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                  placeholder="Optional"
                  value={paymentData.referenceNo}
                  onChange={(e) => setPaymentData({...paymentData, referenceNo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Proof of Payment</label>
                <div className="space-y-2">
                  <label className={`flex flex-col items-center justify-center w-full h-24 rounded-md border-2 border-dashed transition-all cursor-pointer ${paymentData.receiptImage ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                    <div className="flex flex-col items-center justify-center">
                      {!paymentData.receiptImage ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Upload Receipt</p>
                        </>
                      ) : (
                        <div className="relative group">
                          <img src={paymentData.receiptImage} className="h-16 w-auto rounded-md shadow-sm object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  {paymentData.receiptImage && (
                    <button
                      type="button"
                      onClick={() => setPaymentData({...paymentData, receiptImage: ''})}
                      className="text-[10px] font-bold text-red-600 uppercase tracking-wide hover:underline block mx-auto"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-2.5 rounded-md hover:bg-gray-50 transition-all text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-md shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all text-xs uppercase"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-8 animate-in zoom-in duration-200 border border-gray-200 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
                  {getLatestSubscriberData(activeSubscriber)?.name}
                </p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {getLatestSubscriberData(activeSubscriber)?.payments?.length > 0 ? (
                getLatestSubscriberData(activeSubscriber).payments.slice().reverse().map((p, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center hover:bg-white hover:border-gray-300 transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-base font-bold text-gray-900">₱{p.amountPaid.toLocaleString()}</span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{p.month}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-500">
                        {new Date(p.date).toLocaleDateString()} • Ref: {p.referenceNo || 'N/A'}
                      </p>
                    </div>
                    {p.receiptImage && (
                      <button
                        onClick={() => setReceiptToView(p.receiptImage)}
                        className="bg-emerald-50 p-2 rounded-md text-emerald-600 hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-100"
                        title="View Receipt"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide text-sm">No payment records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onRefresh={fetchData}
      />

      <IssueChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        subscriber={getLatestSubscriberData(activeSubscriber)}
        token={token}
        socket={socket}
        userRole={userRole}
        onRefresh={fetchData}
      />

      <SubscriberDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        subscriber={getLatestSubscriberData(activeSubscriber)}
      />

      {receiptToView && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-900/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full flex flex-col items-center animate-in zoom-in duration-200">
            <button
              onClick={() => setReceiptToView(null)}
              className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white p-2 rounded-lg shadow-2xl overflow-hidden max-h-[80vh]">
              <img src={receiptToView} className="max-w-full h-auto object-contain rounded" alt="Receipt" />
            </div>
            <p className="mt-4 text-white/70 text-xs font-bold uppercase tracking-wide">Digital Proof of Payment</p>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/team" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
