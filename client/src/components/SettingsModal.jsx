import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

const SettingsModal = ({ isOpen, onClose, onRefresh }) => {
  const [settings, setSettings] = useState({ defaultRate: 500, rebateValue: 30 });
  const [analytics, setAnalytics] = useState({ totalExpected: 0, totalCollected: 0 });
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE}/settings`, config);
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE}/analytics`, config);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_BASE}/settings`, settings, config);
      alert('Settings saved successfully.');
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewMonth = async () => {
    if (!window.confirm('Are you sure you want to Start a New Month? This will reset all unpaid statuses and outage days.')) return;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE}/bulk/reset`, {}, config);
      alert('System reset for new month successfully.');
      onRefresh();
      fetchAnalytics();
    } catch (err) {
      console.error('Error resetting month:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Settings</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure system constants and bulk actions</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Settings Form */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">System Constants</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Default Rate (₱)</label>
                <input
                  type="number"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  value={settings.defaultRate}
                  onChange={(e) => setSettings({...settings, defaultRate: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rebate Divisor (Days)</label>
                <input
                  type="number"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  value={settings.rebateValue}
                  onChange={(e) => setSettings({...settings, rebateValue: parseInt(e.target.value) || 0})}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-indigo-600 active:scale-95 transition-all tracking-widest uppercase text-[11px]"
              >
                Save Constants
              </button>
            </form>
          </section>

          {/* Analytics Summary */}
          <section className="space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Revenue Analytics</h3>
            <div className="space-y-4">
              <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Expected Revenue</p>
                <p className="text-2xl font-black text-indigo-600">₱{analytics.totalExpected.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Actually Collected</p>
                <p className="text-2xl font-black text-emerald-600">₱{analytics.totalCollected.toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Bulk Action */}
        <section className="pt-8 border-t border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Monthly Billing Reset</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Starting a new month will reset all subscribers' statuses and outage records. This action cannot be undone.</p>
            </div>
            <button
              onClick={handleStartNewMonth}
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black px-10 py-5 rounded-2xl shadow-2xl shadow-rose-100 hover:scale-105 active:scale-95 transition-all tracking-widest uppercase text-[11px]"
            >
              Start New Month
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsModal;
