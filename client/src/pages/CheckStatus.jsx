import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertCircle, Check, XCircle, Info, PhoneCall } from 'lucide-react';

const CheckStatus = () => {
  const [accountId, setAccountId] = useState('');
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!accountId.trim()) return;

    setLoading(true);
    setError('');
    setSubscriber(null);

    try {
      const res = await axios.get(`/api/public/subscriber/${accountId}`);
      setSubscriber(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No payment records') return dateString;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-violet-100 selection:text-violet-700 p-6 flex flex-col items-center justify-center">
      {/* Header / Logo */}
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-[1.5rem] bg-violet-600 flex items-center justify-center text-white shadow-2xl shadow-violet-400/50 mb-6 border-4 border-white/20">
          <div className="w-10 h-10 rounded-full border-4 border-white flex items-center justify-center">
            <Check className="w-6 h-6 stroke-[4]" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-[#1a1a3a] tracking-tight mb-2">BAYADNET</h1>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.4em]">Subscriber Portal</p>
      </div>

      <div className="w-full max-w-md px-2">
        {/* Search Section */}
        <form onSubmit={handleSearch} className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-300 group-focus-within:text-violet-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="ACC-102"
            className="w-full bg-white border border-slate-100 rounded-full py-6 pl-16 pr-32 focus:ring-8 focus:ring-violet-500/5 focus:border-violet-500/30 outline-none transition-all font-bold text-[#1a1a3a] placeholder:text-slate-200 shadow-2xl shadow-slate-200/50 text-xl"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute inset-y-2.5 right-2.5 px-8 bg-[#7c3aed] text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#6d28d9] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-violet-200"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CHECK'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-[#fff1f1] border border-rose-100 text-[#e11d48] p-6 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 mb-8 shadow-sm">
            <div className="w-10 h-10 rounded-full border-2 border-[#e11d48] flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-xl">!</span>
            </div>
            <p className="font-bold text-lg tracking-tight">{error}</p>
          </div>
        )}

        {/* Result Card */}
        {subscriber && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/50 border border-slate-100 overflow-hidden animate-in zoom-in duration-500">
            {/* Card Header */}
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Statement of Account</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {subscriber.accountId}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                  subscriber.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {subscriber.status}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-8 space-y-8">
              {/* Name & Plan */}
              <div className="flex justify-between items-end border-b border-dashed border-slate-200 pb-6">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subscriber Name</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{subscriber.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plan / Bandwidth</p>
                  <p className="font-bold text-slate-700">{subscriber.planName}</p>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">{subscriber.bandwidth}</p>
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing Status</p>
                  <p className={`text-sm font-bold uppercase tracking-tighter ${
                    subscriber.billingStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-500'
                  }`}>
                    {subscriber.billingStatus}
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Due Date</p>
                  <p className="text-sm font-bold text-slate-700 tracking-tight">
                    {formatDate(subscriber.nextDueDate)}
                  </p>
                </div>
              </div>

              {/* Amount Due Section */}
              <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-0.5">Current Balance</p>
                  <p className="text-xs font-bold text-violet-500 italic">as of today</p>
                </div>
                <p className="text-3xl font-bold text-violet-600">₱{subscriber.currentBalance.toLocaleString()}</p>
              </div>

              {/* Last Payment Info */}
              <div className="flex items-center gap-3 px-2">
                <Info className="w-4 h-4 text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Last Payment: {formatDate(subscriber.lastPaymentDate)}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-center">
              <a
                href="https://m.me/bojex.official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-violet-600 transition-colors"
              >
                <PhoneCall className="w-3 h-3" />
                Contact Support
              </a>
            </div>
          </div>
        )}

        {/* Footer info when no subscriber loaded */}
        {!subscriber && !loading && (
          <p className="text-center text-[#a0a0c0] text-[11px] font-bold uppercase tracking-[0.2em] mt-16 px-10 leading-relaxed opacity-60">
            Please enter your account id provided during installation to view your current billing status and payment history.
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckStatus;
