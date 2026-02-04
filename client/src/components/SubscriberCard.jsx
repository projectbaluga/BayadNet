import React from 'react';

const SubscriberCard = ({ subscriber, onPay, onHistory, onViewReceipt, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Overdue': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'Due Today': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Partial': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const isPaid = subscriber.status === 'Paid';

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/20 p-8 flex flex-col gap-6 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="max-w-[70%]">
          <h3 className="font-bold text-2xl text-slate-900 truncate leading-none mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">
            {subscriber.name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-0.5">
            Cycle: {subscriber.cycle}th
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(subscriber.status)} shadow-sm`}>
            {subscriber.status}
          </span>
          {subscriber.hasReceipt && (
            <button
              onClick={() => {
                const latestReceipt = subscriber.payments
                  .filter(p => p.month === 'February 2026' && p.receiptImage)
                  .pop();
                if (latestReceipt) onViewReceipt(latestReceipt.receiptImage);
              }}
              className="bg-emerald-50 text-emerald-500 p-1.5 rounded-lg border border-emerald-100 animate-bounce hover:bg-emerald-100 transition-all"
              title="View Latest Receipt"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="space-y-3 relative z-10 bg-slate-50/50 p-5 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-500 font-medium">Monthly Rate</span>
          <span className="text-slate-700 font-bold">₱{subscriber.rate.toLocaleString()}</span>
        </div>

        {subscriber.daysDown > 0 && (
          <div className="flex justify-between items-center text-[11px] text-rose-500">
            <span className="font-medium">Outage ({subscriber.daysDown} days)</span>
            <span className="font-bold">-₱{subscriber.rebate.toLocaleString()}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200/50 flex justify-between items-end">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
            {subscriber.status === 'Partial' ? 'Remaining Balance' : 'Total Due'}
          </span>
          <span className="text-xl font-black text-indigo-600 leading-none">
            ₱{(subscriber.status === 'Partial' ? subscriber.remainingBalance : subscriber.amountDue).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-slate-50/30 px-5 py-4 rounded-2xl border border-slate-100/50 relative overflow-hidden z-10">
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Next Due Date</p>
        <p className="text-sm font-black text-slate-700 tracking-tight">{subscriber.dueDate}</p>
      </div>

      <div className="flex items-center gap-3 mt-auto relative z-10">
        {!isPaid ? (
          <button
            onClick={() => onPay(subscriber)}
            className="flex-1 bg-slate-900 text-white text-[11px] font-black py-4 rounded-2xl hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 uppercase tracking-[0.15em]"
          >
            {subscriber.status === 'Partial' ? 'Pay Balance' : 'Confirm Payment'}
          </button>
        ) : (
          <div className="flex-1 bg-emerald-50 text-emerald-600 text-[10px] font-black py-4 rounded-2xl text-center border border-emerald-100 uppercase tracking-widest shadow-inner">
            ✓ Account Settled
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onHistory(subscriber)}
            className="p-3.5 bg-white text-slate-400 rounded-2xl hover:bg-amber-50 hover:text-amber-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
            title="History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(subscriber)}
            className="p-3.5 bg-white text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(subscriber._id)}
            className="p-3.5 bg-white text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
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
