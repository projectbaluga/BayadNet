import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertTriangle, CreditCard, HelpCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import PublicChatModal from '../components/PublicChatModal';

// Connect to socket
const socketURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

const PaymentReminder = () => {
  const [accountId, setAccountId] = useState('');
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(socketURL, {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const id = accountId.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setSubscriber(null);

    try {
      const res = await axios.get(`/api/public/subscriber/${id}`);
      setSubscriber(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Account not found. Please check your ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tighter">BOJEX<span className="text-red-600">.ONLINE</span></span>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                Service Suspended
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">

            <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Internet Service Suspended</h1>
                <p className="text-slate-500 font-medium">
                    Please settle your outstanding balance to restore your internet connection immediately.
                </p>
            </div>

            {/* Account Checker */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Check Account Status</h2>

                <form onSubmit={handleSearch} className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Enter Account ID (e.g., BN-1001)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 text-sm"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value.toUpperCase())}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                </form>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {subscriber && (
                    <div className="animate-in zoom-in duration-300">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Account Name</p>
                                    <p className="font-bold text-slate-900">{subscriber.name}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                    subscriber.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {subscriber.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-end border-t border-slate-200 pt-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Due</p>
                                    <p className="text-2xl font-black text-red-600">₱{subscriber.currentBalance.toLocaleString()}</p>
                                </div>
                                {subscriber.status !== 'Paid' && (
                                    <a
                                      href="#payment-methods"
                                      className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                    >
                                        How to Pay <ArrowRight className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {subscriber.status === 'Paid' ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-emerald-700 text-sm font-bold">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p>Thank you! Account is fully paid.</p>
                                    <p className="text-xs font-medium opacity-80">Reconnection may take up to 5 minutes.</p>
                                </div>
                            </div>
                        ) : (
                             <button
                                onClick={() => setIsChatOpen(true)}
                                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                Report Payment / Chat Support
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Methods */}
            <div id="payment-methods" className="space-y-4">
                 <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Channels</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-blue-400 transition-colors cursor-pointer group">
                         <div className="w-10 h-10 bg-blue-50 rounded-lg mx-auto mb-3 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                             <CreditCard className="w-5 h-5" />
                         </div>
                         <p className="font-bold text-slate-900 text-sm">GCash</p>
                         <p className="text-xs text-slate-500 mt-1">0912-345-6789</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Juan Dela Cruz</p>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-emerald-400 transition-colors cursor-pointer group">
                         <div className="w-10 h-10 bg-emerald-50 rounded-lg mx-auto mb-3 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                             <CreditCard className="w-5 h-5" />
                         </div>
                         <p className="font-bold text-slate-900 text-sm">BDO Unibank</p>
                         <p className="text-xs text-slate-500 mt-1">0012-3456-7890</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Bojex Internet</p>
                     </div>
                 </div>
            </div>

            <p className="text-center text-xs font-medium text-slate-400 max-w-xs mx-auto">
                After payment, please send a screenshot of your receipt via the Chat button above or to our Facebook Page for faster posting.
            </p>

        </div>
      </main>

      <footer className="py-6 text-center border-t border-slate-200 bg-white">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2024 Bojex Internet Services</p>
      </footer>

      <PublicChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        subscriber={subscriber}
        socket={socket}
      />
    </div>
  );
};

export default PaymentReminder;
