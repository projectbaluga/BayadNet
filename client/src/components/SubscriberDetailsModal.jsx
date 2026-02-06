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
          <div className="flex justify-center">
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusStyle(subscriber.status)}`}>
              {subscriber.status}
            </span>
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
