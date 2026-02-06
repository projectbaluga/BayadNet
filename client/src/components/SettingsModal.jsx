import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const API_BASE = '/api';

const SettingsModal = ({ isOpen, onClose, onRefresh }) => {
  const [settings, setSettings] = useState({ defaultRate: 500, rebateValue: 30, providerCost: 0 });
  const [analytics, setAnalytics] = useState({ totalExpected: 0, totalCollected: 0, providerCost: 0, currentProfit: 0 });
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl p-6 animate-in zoom-in duration-300 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Settings</h2>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Constants & Bulk Actions</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Settings Form */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5">Constants</h3>
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Default Rate</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                  value={settings.defaultRate}
                  onChange={(e) => setSettings({...settings, defaultRate: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Rebate Divisor</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                  value={settings.rebateValue}
                  onChange={(e) => setSettings({...settings, rebateValue: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Provider Cost</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm"
                  value={settings.providerCost}
                  onChange={(e) => setSettings({...settings, providerCost: parseInt(e.target.value) || 0})}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-indigo-600 transition-all tracking-widest uppercase text-[9px]"
              >
                Save
              </button>
            </form>
          </section>

          {/* Analytics Summary */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5">Analytics</h3>
            <div className="space-y-2">
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Expected</p>
                <p className="text-base font-black text-indigo-600">₱{analytics.totalExpected.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Collected</p>
                <p className="text-base font-black text-emerald-600">₱{analytics.totalCollected.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <p className="text-[7px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Net Profit</p>
                <p className="text-base font-black text-amber-600">₱{analytics.currentProfit.toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Bulk Action */}
        <section className="pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Monthly Billing Reset</h3>
              <p className="text-[9px] text-slate-400 font-medium leading-tight">Resets all statuses and outage records.</p>
            </div>
            <button
              onClick={handleStartNewMonth}
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all tracking-widest uppercase text-[9px]"
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
