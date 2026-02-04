import React from 'react';

const SubscriberCard = ({ subscriber, onPay, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Due Today': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const isPaid = subscriber.status === 'Paid';

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col gap-6 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="max-w-[65%]">
          <h3 className="font-black text-2xl text-gray-900 truncate leading-none mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">
            {subscriber.name}
          </h3>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Billing Cycle: {subscriber.cycle}th
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border-2 ${getStatusColor(subscriber.status)}`}>
            {subscriber.status}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(subscriber)}
              className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(subscriber._id)}
              className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Next Due</p>
          <p className="text-base font-black text-gray-800">{subscriber.dueDate}</p>
        </div>
        <div className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100">
          <p className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-1">Amount</p>
          <p className="text-xl font-black text-indigo-600 leading-none">₱{subscriber.amountDue.toLocaleString()}</p>
        </div>
      </div>

      {subscriber.creditType !== 'None' && (
        <div className="bg-yellow-50 px-3 py-2 rounded-xl border border-yellow-100">
          <p className="text-[10px] text-yellow-700 font-bold flex items-center gap-1">
            <span className="text-xs">✨</span>
            <span className="uppercase">Credit:</span> {subscriber.creditType}
            {subscriber.creditPreference !== 'None' && (
              <span className="opacity-60 italic"> - {subscriber.creditPreference}</span>
            )}
          </p>
        </div>
      )}

      {!isPaid && (
        <button
          onClick={() => onPay(subscriber._id)}
          className="w-full bg-gray-900 text-white text-xs font-black py-4 rounded-2xl mt-auto hover:bg-indigo-600 active:scale-95 transition-all shadow-lg shadow-gray-200 uppercase tracking-widest"
        >
          Confirm Payment
        </button>
      )}
      {isPaid && (
        <div className="w-full bg-green-50 text-green-600 text-[10px] font-black py-4 rounded-2xl mt-auto text-center border-2 border-green-100 uppercase tracking-widest">
          ✓ Account Settled
        </div>
      )}
    </div>
  );
};

export default SubscriberCard;
