import React from 'react';
import { X, User, Phone, MessageSquare, CreditCard, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

const SubscriberDetailsModal = ({ isOpen, onClose, subscriber }) => {
  if (!isOpen || !subscriber) return null;

  const detailItems = [
    { icon: <User className="w-4 h-4" />, label: 'Full Name', value: subscriber.name },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Account ID', value: subscriber.accountId || 'N/A' },
    { icon: <Phone className="w-4 h-4" />, label: 'Contact No.', value: subscriber.contactNo || 'N/A' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Messenger ID', value: subscriber.messengerId || 'N/A' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'Monthly Rate', value: `₱${subscriber.rate?.toLocaleString()}` },
    { icon: <Calendar className="w-4 h-4" />, label: 'Billing Cycle', value: `Cycle ${subscriber.cycle}` },
    { icon: <AlertTriangle className="w-4 h-4" />, label: 'Rebate', value: `₱${subscriber.rebate?.toLocaleString()} (${subscriber.daysDown}d)` },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500 text-white';
      case 'Overdue': return 'bg-rose-500 text-white';
      case 'Due Today': return 'bg-orange-500 text-white';
      case 'Partial': return 'bg-amber-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300 border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscriber Details</h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all border border-slate-100"
            aria-label="Close Details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <span className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-current/10 ${getStatusColor(subscriber.status)}`}>
              {subscriber.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                <div className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.label}</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center px-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Due Date</p>
                <p className="text-lg font-bold text-indigo-600">{subscriber.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-slate-900">
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
