import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertCircle, CheckCircle2, XCircle, Info, PhoneCall } from 'lucide-react';

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
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200 mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">BAYADNET</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Subscriber Portal</p>
      </div>

      <div className="w-full max-w-md">
        {/* Search Section */}
        <form onSubmit={handleSearch} className="relative mb-8 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Enter Account ID (e.g. ACC-101)"
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-xl shadow-slate-200/40 text-lg"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute inset-y-2 right-2 px-6 bg-violet-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-3xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold text-sm">{error}</p>
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
                  <h2 className="text-xl font-black tracking-tight mb-1">Statement of Account</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {subscriber.accountId}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
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
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Subscriber Name</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{subscriber.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan / Bandwidth</p>
                  <p className="font-black text-slate-700">{subscriber.planName}</p>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">{subscriber.bandwidth}</p>
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Status</p>
                  <p className={`text-sm font-black uppercase tracking-tighter ${
                    subscriber.billingStatus === 'Paid' ? 'text-emerald-600' : 'text-orange-500'
                  }`}>
                    {subscriber.billingStatus}
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Due Date</p>
                  <p className="text-sm font-black text-slate-700 tracking-tight">
                    {formatDate(subscriber.nextDueDate)}
                  </p>
                </div>
              </div>

              {/* Amount Due Section */}
              <div className="bg-violet-50 p-6 rounded-3xl border border-violet-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-0.5">Current Balance</p>
                  <p className="text-xs font-bold text-violet-500 italic">as of today</p>
                </div>
                <p className="text-3xl font-black text-violet-600">₱{subscriber.currentBalance.toLocaleString()}</p>
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
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-violet-600 transition-colors"
              >
                <PhoneCall className="w-3 h-3" />
                Contact Support
              </a>
            </div>
          </div>
        )}

        {/* Footer info when no subscriber loaded */}
        {!subscriber && !loading && (
          <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-12 px-6 leading-loose">
            Please enter your Account ID provided during installation to view your current billing status and payment history.
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckStatus;
