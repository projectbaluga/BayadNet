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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-xl p-6 animate-in zoom-in duration-200 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Settings</h2>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-1">Constants & Bulk Actions</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white text-gray-400 rounded-md hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Settings Form */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Constants</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Default Rate</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={settings.defaultRate}
                  onChange={(e) => setSettings({...settings, defaultRate: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Rebate Divisor</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={settings.rebateValue}
                  onChange={(e) => setSettings({...settings, rebateValue: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Provider Cost</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 text-sm"
                  value={settings.providerCost}
                  onChange={(e) => setSettings({...settings, providerCost: parseInt(e.target.value) || 0})}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-md hover:bg-indigo-600 transition-all uppercase text-[10px] tracking-wide shadow-sm"
              >
                Save
              </button>
            </form>
          </section>

          {/* Analytics Summary */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Analytics</h3>
            <div className="space-y-3">
              <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">Expected</p>
                <p className="text-xl font-bold text-indigo-700">₱{analytics.totalExpected.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-md border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1">Collected</p>
                <p className="text-xl font-bold text-emerald-700">₱{analytics.totalCollected.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1">Net Profit</p>
                <p className="text-xl font-bold text-amber-700">₱{analytics.currentProfit.toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Bulk Action */}
        <section className="pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Monthly Billing Reset</h3>
              <p className="text-[10px] text-gray-500 font-medium">Resets all statuses and outage records.</p>
            </div>
            <button
              onClick={handleStartNewMonth}
              disabled={loading}
              className="w-full sm:w-auto bg-red-600 text-white font-bold px-6 py-2.5 rounded-md shadow-sm hover:bg-red-700 active:scale-95 transition-all uppercase text-[10px] tracking-wide"
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
