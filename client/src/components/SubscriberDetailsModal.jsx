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
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 animate-in zoom-in duration-300 border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Subscriber Details</h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
            aria-label="Close Details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md ${getStatusColor(subscriber.status)}`}>
              {subscriber.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
                <div className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{item.label}</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Due</p>
                <p className="text-base font-black text-indigo-600">{subscriber.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                <p className="text-lg font-black text-slate-900">
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
