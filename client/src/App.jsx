import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubscriberCard from './components/SubscriberCard';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ dueToday: 0, overdue: 0, totalCollections: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [subsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/subscribers`),
        axios.get(`${API_BASE}/stats`)
      ]);
      setSubscribers(subsRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePay = async (id) => {
    try {
      await axios.patch(`${API_BASE}/subscribers/${id}/pay`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error paying:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-10">
      {/* Header */}
      <header className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 leading-tight">Subscriber Management</h1>
        <p className="text-sm text-gray-500 font-medium">February 2026 • 🏠 Billing Dashboard</p>
      </header>

      {/* Stats Dashboard */}
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

      {/* Subscriber List */}
      <main className="px-6 flex-grow">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Subscribers
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{subscribers.length}</span>
        </h2>
        {subscribers.map(sub => (
          <SubscriberCard key={sub._id} subscriber={sub} onPay={handlePay} />
        ))}
      </main>
    </div>
  );
}

export default App;
