import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, User, Phone, MessageSquare, CreditCard, Calendar, AlertTriangle, ShieldCheck, Wifi, Power, Activity, Upload, Download, Clock } from 'lucide-react';

const SubscriberDetailsModal = ({ isOpen, onClose, subscriber }) => {
  const [traffic, setTraffic] = useState(null);
  const [loadingTraffic, setLoadingTraffic] = useState(false);

  useEffect(() => {
      if (isOpen && subscriber && subscriber.pppoeUsername) {
          setLoadingTraffic(true);
          setTraffic(null);
          const token = localStorage.getItem('token');
          axios.get(`/api/subscribers/${subscriber._id}/traffic`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => setTraffic(res.data))
          .catch(err => console.error('Failed to fetch traffic:', err))
          .finally(() => setLoadingTraffic(false));
      }
  }, [isOpen, subscriber]);

  if (!isOpen || !subscriber) return null;

  const formatBytes = (bytes, decimals = 2) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const detailItems = [
    { icon: <User className="w-4 h-4" />, label: 'Full Name', value: subscriber.name },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Account ID', value: subscriber.accountId || 'N/A' },
    { icon: <Wifi className="w-4 h-4" />, label: 'PPPoE User', value: subscriber.pppoeUsername || 'Not Configured' },
    { icon: <Power className="w-4 h-4" />, label: 'Router', value: subscriber.router ? (subscriber.router.name || 'Unknown') : 'Not Assigned' },
    { icon: <Phone className="w-4 h-4" />, label: 'Contact No.', value: subscriber.contactNo || 'N/A' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Messenger ID', value: subscriber.messengerId || 'N/A' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'Monthly Rate', value: `₱${subscriber.rate?.toLocaleString()}` },
    { icon: <Calendar className="w-4 h-4" />, label: 'Billing Cycle', value: `Cycle ${subscriber.cycle}` },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Rebate', value: `₱${subscriber.rebate?.toLocaleString()} (${subscriber.daysDown}d)` },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Overdue': return 'bg-red-50 text-red-700 border-red-100';
      case 'Due Today': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Partial': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6 animate-in zoom-in duration-200 border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Subscriber Details</h2>
          <button
            onClick={onClose}
            className="p-2 bg-white text-gray-400 rounded-md hover:bg-gray-50 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
            aria-label="Close Details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center flex-col items-center gap-2">
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusStyle(subscriber.status)}`}>
              {subscriber.status}
            </span>

            {/* Traffic Status Section */}
            {subscriber.pppoeUsername && (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Traffic Status</span>
                        </div>
                        {loadingTraffic ? (
                            <span className="text-[10px] text-slate-400 animate-pulse">Checking...</span>
                        ) : traffic?.online ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Offline
                            </span>
                        )}
                    </div>

                    {traffic?.online && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-white p-2 rounded border border-slate-100 flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Uptime
                                </span>
                                <span className="text-xs font-bold text-slate-700">{traffic.uptime}</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                                    <Download className="w-3 h-3 text-indigo-500" /> Download
                                </span>
                                <span className="text-xs font-bold text-slate-700">{formatBytes(traffic.download)}</span>
                            </div>
                            <div className="bg-white p-2 rounded border border-slate-100 flex flex-col items-center">
                                <span className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                                    <Upload className="w-3 h-3 text-emerald-500" /> Upload
                                </span>
                                <span className="text-xs font-bold text-slate-700">{formatBytes(traffic.upload)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-white hover:shadow-sm hover:border-gray-200 group">
                <div className="p-2 bg-white text-gray-400 rounded-md shadow-sm border border-gray-100 group-hover:text-indigo-600 transition-all">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>


          <div className="pt-5 border-t border-dashed border-gray-200">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Next Due</p>
                <p className="text-base font-bold text-indigo-600">{subscriber.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Balance</p>
                <p className="text-xl font-bold text-gray-900">
                  ₱{(subscriber.status === 'Partial' ? subscriber.remainingBalance : (subscriber.status === 'Paid' ? 0 : subscriber.amountDue)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriberDetailsModal;
