import React, { useState } from 'react';
import axios from 'axios';
import {
  Search,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  Edit,
  MessageCircle,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  PhoneCall,
  XCircle
} from 'lucide-react';

const CheckStatus = () => {
  const [accountId, setAccountId] = useState('');
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

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

  const isPaid = subscriber?.billingStatus === 'Paid';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-violet-100 selection:text-violet-700 p-6 flex flex-col items-center">
      {/* Header / Logo */}
      <div className="mt-8 mb-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-[1.2rem] bg-violet-600 flex items-center justify-center text-white shadow-2xl shadow-violet-400/50 mb-4 border-4 border-white/20">
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <Check className="w-5 h-5 stroke-[4]" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-[#1a1a3a] tracking-tight mb-1">BAYADNET</h1>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">Subscriber Portal</p>
      </div>

      <div className="w-full max-w-md px-2">
        {/* Search Section */}
        <form onSubmit={handleSearch} className="relative mb-8 group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-violet-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Enter Account ID"
            className="w-full bg-white border border-slate-100 rounded-3xl py-5 pl-14 pr-28 focus:ring-8 focus:ring-violet-500/5 focus:border-violet-500/30 outline-none transition-all font-bold text-[#1a1a3a] placeholder:text-slate-200 shadow-xl shadow-slate-200/50 text-lg"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute inset-y-2 right-2 px-6 bg-[#7c3aed] text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-[#6d28d9] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CHECK'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-[#fff1f1] border border-rose-100 text-[#e11d48] p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 mb-8 shadow-sm">
            <div className="w-8 h-8 rounded-full border-2 border-[#e11d48] flex items-center justify-center flex-shrink-0">
              <span className="font-black text-sm">!</span>
            </div>
            <p className="font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        {/* Result UI - Compact Design */}
        {subscriber && (
          <div className="animate-in zoom-in duration-500 space-y-6 pb-12">
            {/* Name & Cycle Section */}
            <div className="flex justify-between items-center px-4">
              <div>
                <h2 className="text-3xl font-black text-[#1a1a3a] tracking-tight truncate max-w-[200px]">
                  {subscriber.name.split(' ')[0]} {subscriber.name.split(' ')[1] ? subscriber.name.split(' ')[1].charAt(0) + '.' : ''}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Cycle: {subscriber.cycle}th
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-full border ${
                subscriber.billingStatus === 'Paid'
                  ? 'bg-emerald-50 text-emerald-500 border-emerald-100'
                  : 'bg-orange-50 text-orange-500 border-orange-100'
              }`}>
                {!isPaid && <AlertCircle className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {subscriber.billingStatus === 'Paid' ? 'SETTLED' : 'DUE TODAY'}
                </span>
              </div>
            </div>

            {/* Main Billing Card */}
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-300/40 p-8 border border-slate-50 space-y-6">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Monthly Rate</span>
                <span className="text-lg font-black text-slate-900 font-mono">₱{subscriber.monthlyRate || subscriber.currentBalance}</span>
              </div>

              <div className="flex justify-between items-end pt-2">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Due</p>
                  <p className="text-5xl font-black text-violet-600 tracking-tighter">
                    ₱{subscriber.currentBalance.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-black text-violet-600">₱</span>
                </div>
              </div>
            </div>

            {/* Status Grid */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-6 border border-slate-50 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Next Due Date</p>
                <p className="text-lg font-black text-[#1a1a3a] tracking-tight">
                  {formatDate(subscriber.nextDueDate)}
                </p>
              </div>
              <div className="bg-amber-50 text-amber-600 px-4 py-3 rounded-2xl border border-amber-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {subscriber.issuesCount} {subscriber.issuesCount === 1 ? 'Issue' : 'Issues'}
                </span>
              </div>
            </div>

            {/* Confirm Payment Button */}
            <button className="w-full bg-violet-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-violet-200 hover:bg-violet-700 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-[0.2em]">
              Confirm Payment
            </button>

            {/* Bottom Nav Icons */}
            <div className="flex justify-between gap-4 px-2 pt-4">
              <button
                className="flex-1 aspect-square bg-white rounded-3xl border border-slate-50 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                title="History"
              >
                <Clock className="w-6 h-6" />
              </button>
              <button
                className="flex-1 aspect-square bg-white rounded-3xl border border-slate-50 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                title="Profile"
              >
                <Edit className="w-6 h-6" />
              </button>
              <a
                href="https://m.me/bojex.official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 aspect-square bg-white rounded-3xl border border-slate-50 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                title="Chat with Support"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
              <button
                className="flex-1 aspect-square bg-white rounded-3xl border border-slate-50 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                title="SOA"
              >
                <FileText className="w-6 h-6" />
              </button>
              <button
                className="flex-1 aspect-square bg-white rounded-3xl border border-slate-50 shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all opacity-20 cursor-not-allowed"
                title="Archive"
                disabled
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info when no subscriber loaded */}
        {!subscriber && !loading && (
          <div className="mt-16 text-center space-y-6">
            <p className="text-[#a0a0c0] text-[10px] font-black uppercase tracking-[0.3em] px-10 leading-relaxed opacity-60">
              Enter your account id to view billing status and payment history.
            </p>
            <a
              href="https://m.me/bojex.official"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] font-black text-violet-400 uppercase tracking-widest hover:text-violet-600 transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              Contact Support
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckStatus;
