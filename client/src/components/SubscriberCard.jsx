import React from 'react';

const SubscriberCard = ({ subscriber, onPay, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Overdue': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'Due Today': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const isPaid = subscriber.status === 'Paid';

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col gap-6 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="max-w-[70%]">
          <h3 className="font-black text-2xl text-slate-900 truncate leading-none mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">
            {subscriber.name}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-0.5">
            Billing Cycle: {subscriber.cycle}th
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(subscriber.status)} shadow-sm`}>
            {subscriber.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Next Due</p>
          <p className="text-sm font-black text-slate-700 tracking-tight">{subscriber.dueDate}</p>
        </div>
        <div className="bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100/50 group-hover:bg-indigo-50/50 transition-colors">
          <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest mb-1.5">Amount</p>
          <p className="text-xl font-black text-indigo-600 leading-none">₱{subscriber.amountDue.toLocaleString()}</p>
        </div>
      </div>

      {subscriber.creditType !== 'None' && (
        <div className="bg-amber-50/50 px-4 py-3 rounded-2xl border border-amber-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
          <p className="text-[10px] text-amber-700 font-black flex items-center gap-2">
            <span className="text-xs">✨</span>
            <span className="uppercase tracking-widest">{subscriber.creditType} Credit</span>
            {subscriber.creditPreference && subscriber.creditPreference !== 'None' && (
              <span className="opacity-50 font-bold italic lowercase">({subscriber.creditPreference})</span>
            )}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto relative z-10">
        {!isPaid ? (
          <button
            onClick={() => onPay(subscriber._id)}
            className="flex-1 bg-slate-900 text-white text-[11px] font-black py-4 rounded-2xl hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 uppercase tracking-[0.15em]"
          >
            Confirm Payment
          </button>
        ) : (
          <div className="flex-1 bg-emerald-50 text-emerald-600 text-[10px] font-black py-4 rounded-2xl text-center border border-emerald-100 uppercase tracking-widest shadow-inner">
            ✓ Account Settled
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(subscriber)}
            className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all border border-slate-100"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(subscriber._id)}
            className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all border border-slate-100"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriberCard;
