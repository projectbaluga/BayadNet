import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Search, Loader2, Check, Wifi, Globe, Phone, MapPin, Mail, MessageCircle, Rocket, Shield, Users, Menu, X, Power, Plug, AlertTriangle, Smartphone, Download } from 'lucide-react';
import PublicChatModal from '../components/PublicChatModal';
import SubscriptionModal from '../components/SubscriptionModal';
import { isValidEmail } from '../utils/validators';

// Connect to socket
const socketURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

const Home = () => {
  // --- Check Status Logic ---
  const [accountId, setAccountId] = useState('');
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'plans', 'status', 'contact', 'no-connection'];
      const scrollPosition = window.scrollY + 100; // Offset for navbar

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= scrollPosition && (element.offsetTop + element.offsetHeight) > scrollPosition) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const newSocket = io(socketURL, {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket || !subscriber) return;

    const handleReportAdded = ({ subscriberId, report }) => {
      if (subscriberId === subscriber._id) {
        setSubscriber(prev => ({
           ...prev,
           reports: [...(prev.reports || []), report]
        }));
      }
    };

    socket.on('report-added', handleReportAdded);
    return () => socket.off('report-added', handleReportAdded);
  }, [socket, subscriber]);

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

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No payment records') return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // --- Subscription Modal Logic ---
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setIsApplyModalOpen(true);
  };

  // --- Contact Form Logic ---
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle'); // idle, sending, success, error

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(contactForm.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    setContactStatus('sending');
    try {
      await axios.post('/api/public/contact', contactForm);
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setContactStatus('error');
      setTimeout(() => setContactStatus('idle'), 5000);
    }
  };

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth">

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                <Wifi className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">BOJEX<span className="text-red-600">.ONLINE</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className={`text-sm font-bold uppercase tracking-wide transition-colors ${activeSection === 'home' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}>Home</a>
              <a href="#plans" className={`text-sm font-bold uppercase tracking-wide transition-colors ${activeSection === 'plans' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}>Plans</a>
              <a href="#contact" className={`text-sm font-bold uppercase tracking-wide transition-colors ${activeSection === 'contact' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}>Contact</a>
              <a href="#no-connection" className={`text-sm font-bold uppercase tracking-wide transition-colors ${activeSection === 'no-connection' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}>No Connection?</a>
            </div>

            <div className="flex items-center gap-4">
              <button className="hidden md:block bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                Client Portal
              </button>
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-slate-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 absolute w-full left-0 top-20 shadow-xl animate-in slide-in-from-top-5 duration-200">
            <div className="px-4 py-6 space-y-4 flex flex-col items-center">
              <a
                href="#home"
                className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#plans"
                className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Plans
              </a>
              <a
                href="#contact"
                className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </a>
              <a
                href="#no-connection"
                className="text-sm font-bold uppercase tracking-wide text-slate-500 hover:text-red-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                No Connection?
              </a>
              <button className="w-full bg-slate-900 text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                Client Portal
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative bg-white overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-red-50 rounded-full blur-3xl opacity-50"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-red-100 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest mb-6 border border-red-100">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                Now Serving Camarines Sur
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Internet na <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">Hataw sa Bilis!</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Fiber-fast internet para sa work, study, at gaming. Dito ka na sa subok at maasahan sa Bicol!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#plans" className="px-8 py-4 bg-red-600 text-white rounded-full font-bold text-sm uppercase tracking-wider shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all">
                  View Plans
                </a>
                <a href="#contact" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all">
                  Contact Us
                </a>
              </div>
            </div>

            {/* Right Content - Status Checker (Hero Feature) */}
            <div id="status" className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-[2rem] blur opacity-20"></div>
                <div className="relative bg-white rounded-[1.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8">

                    <div className="mb-8">
                       <h3 className="text-2xl font-black text-slate-900 mb-2">My Account</h3>
                       <p className="text-slate-500 text-sm font-medium">Enter your Account ID to view your billing status instantly.</p>
                    </div>

                    <form onSubmit={handleSearch} className="mb-6 relative">
                        <input
                            type="text"
                            placeholder="Enter Account ID (e.g., BN-1001)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-5 pr-14 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value.toUpperCase())}
                        />
                         <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </form>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6 text-sm font-bold">
                            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">!</div>
                            {error}
                        </div>
                    )}

                    {subscriber ? (
                         <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
                             <div className="bg-slate-900 p-6 flex justify-between items-center">
                                 <div>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Account Status</p>
                                     <h4 className="text-white font-bold text-lg">{subscriber.name}</h4>
                                 </div>
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                     subscriber.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                 }`}>
                                     {subscriber.status}
                                 </span>
                             </div>
                             <div className="p-6">
                                 <div className="flex justify-between items-center mb-6">
                                     <div>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Current Balance</p>
                                         <p className="text-3xl font-black text-red-600">₱{subscriber.currentBalance.toLocaleString()}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Due Date</p>
                                         <p className="font-bold text-slate-700">{formatDate(subscriber.nextDueDate)}</p>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4 mb-6">
                                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Plan</p>
                                          <p className="font-bold text-slate-800 text-xs">{subscriber.planName}</p>
                                      </div>
                                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Bandwidth</p>
                                          <p className="font-bold text-red-600 text-xs">{subscriber.bandwidth}</p>
                                      </div>
                                 </div>

                                 <div className="pt-4 border-t border-slate-200 flex justify-center">
                                    <button
                                        onClick={() => setIsChatOpen(true)}
                                        className="text-xs font-bold text-slate-500 hover:text-red-600 uppercase tracking-wider flex items-center gap-2 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4" /> Need Help? Chat with Us
                                    </button>
                                 </div>
                             </div>
                         </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search className="w-8 h-8" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No Active Search</p>
                            <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto px-4">
                                Enter your Account ID to view your status. Once verified, you can <span className="text-red-600 font-bold">chat with our support team</span>.
                            </p>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Sulit na Internet Plans</h2>
                  <p className="text-slate-500 font-medium">Piliin ang swak na speed para sa iyong lifestyle. Walang hidden charges!</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  {/* Plan 1: SIMPLENG SURF */}
                  <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                          <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">SIMPLENG SURF</h3>
                      <p className="text-slate-500 text-sm font-medium mb-6">Ang pinakamurang paraan para magka-fiber.</p>
                      <div className="flex items-baseline gap-1 mb-8">
                          <span className="text-4xl font-black text-slate-900">₱799</span>
                          <span className="text-slate-400 font-bold text-sm">/mo</span>
                      </div>
                      <ul className="space-y-4 mb-8">
                           {/* Speed */}
                          <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              Up to 30 Mbps
                          </li>
                           {/* Best For */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-slate-800">Best for:</span> Facebook, TikTok, Chat, & Browsing.</span>
                          </li>
                           {/* The Truth */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-slate-800">The Truth:</span> Mabilis sa cellphone, sakto sa budget.</span>
                          </li>
                           {/* Feature */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-slate-800">Feature:</span> No Lock-in Period & Direct Website Support.</span>
                          </li>
                      </ul>
                      <button
                        onClick={() => handleSubscribe('SIMPLENG SURF')}
                        className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-900 font-bold text-sm uppercase tracking-wide hover:border-red-600 hover:text-red-600 transition-colors"
                      >
                          Subscribe Now
                      </button>
                  </div>

                  {/* Plan 2: PAMILYANG CONNECT - Featured */}
                  <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-red-500/20 border border-slate-800 relative transform md:-translate-y-4">
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                          Best Value
                      </div>
                      <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-6">
                          <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-2">PAMILYANG CONNECT</h3>
                      <p className="text-slate-400 text-sm font-medium mb-6">Mas maluwag na bandwidth para sa maraming gadgets.</p>
                      <div className="flex items-baseline gap-1 mb-8">
                          <span className="text-4xl font-black text-white">₱1,249</span>
                          <span className="text-slate-500 font-bold text-sm">/mo</span>
                      </div>
                      <ul className="space-y-4 mb-8">
                           {/* Speed */}
                          <li className="flex items-center gap-3 text-sm font-bold text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              Up to 65 Mbps
                          </li>
                           {/* Best For */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-white">Best for:</span> Sabay-sabay na YouTube, Netflix, at Zoom.</span>
                          </li>
                           {/* The Truth */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-white">The Truth:</span> Mas madaming device ang pwedeng kumonekta nang hindi bumabagal.</span>
                          </li>
                           {/* Feature */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-white">Feature:</span> No Lock-in Period & Direct Website Support.</span>
                          </li>
                      </ul>
                      <button
                        onClick={() => handleSubscribe('PAMILYANG CONNECT')}
                        className="w-full py-4 rounded-xl bg-red-600 text-white font-bold text-sm uppercase tracking-wide hover:bg-red-700 transition-colors shadow-lg shadow-red-900/50"
                      >
                          Subscribe Now
                      </button>
                  </div>

                  {/* Plan 3: BABAD MAX */}
                  <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                          <Download className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">BABAD MAX</h3>
                      <p className="text-slate-500 text-sm font-medium mb-6">Para sa mga ayaw maghintay ng matagal sa download.</p>
                      <div className="flex items-baseline gap-1 mb-8">
                          <span className="text-4xl font-black text-slate-900">₱1,499</span>
                          <span className="text-slate-400 font-bold text-sm">/mo</span>
                      </div>
                      <ul className="space-y-4 mb-8">
                           {/* Speed */}
                          <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              Up to 100 Mbps
                          </li>
                           {/* Best For */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-slate-800">Best for:</span> Heavy Downloading (Game Updates/Files) via LAN Cable.</span>
                          </li>
                           {/* The Truth */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-slate-800">The Truth:</span> Ito ang kuhanin mo kung gusto mong matapos agad ang download mo.</span>
                          </li>
                           {/* Feature */}
                          <li className="flex items-start gap-3 text-sm font-bold text-slate-600">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 stroke-[4]" />
                              </div>
                              <span><span className="text-slate-800">Feature:</span> No Lock-in Period & Direct Website Support.</span>
                          </li>
                      </ul>
                      <button
                        onClick={() => handleSubscribe('BABAD MAX')}
                        className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-900 font-bold text-sm uppercase tracking-wide hover:border-red-600 hover:text-red-600 transition-colors"
                      >
                          Subscribe Now
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
             <div className="bg-slate-900 rounded-[2.5rem] p-12 lg:p-20 overflow-hidden relative">
                 {/* Decorative circles */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-[100px] opacity-30 -mr-16 -mt-16"></div>
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -ml-16 -mb-16"></div>

                 <div className="grid lg:grid-cols-2 gap-16 relative z-10">
                     <div>
                         <h2 className="text-3xl lg:text-4xl font-black text-white mb-6">Ready to get started?</h2>
                         <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                             Upgrade your home internet experience today. Contact us for inquiries, coverage checks, or support.
                         </p>
                         <div className="space-y-6">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                     <Rocket className="w-5 h-5" />
                                 </div>
                                 <div>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mabilis na Kabit</p>
                                     <p className="text-white font-bold">Installation within 3-5 days</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                     <Shield className="w-5 h-5" />
                                 </div>
                                 <div>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Stable na Connection</p>
                                     <p className="text-white font-bold">Tuloy-tuloy ang saya, walang putol!</p>
                                 </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                     <Users className="w-5 h-5" />
                                 </div>
                                 <div>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Support na Aasahan</p>
                                     <p className="text-white font-bold">May technicians kami sa iyong area</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                         <form onSubmit={handleContactSubmit} className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Name</label>
                                 <input
                                    type="text"
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors"
                                    placeholder="Your Name"
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                    required
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                                 <input
                                    type="email"
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors"
                                    placeholder="email@example.com"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                    required
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Message</label>
                                 <textarea
                                    rows="4"
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors"
                                    placeholder="How can we help?"
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    required
                                 ></textarea>
                             </div>
                             <button
                                type="submit"
                                disabled={contactStatus === 'sending'}
                                className={`w-full font-bold py-4 rounded-xl uppercase tracking-wide transition-colors ${
                                    contactStatus === 'sending' ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                                    contactStatus === 'success' ? 'bg-emerald-600 text-white' :
                                    contactStatus === 'error' ? 'bg-rose-600 text-white' :
                                    'bg-red-600 text-white hover:bg-red-700'
                                }`}
                             >
                                 {contactStatus === 'sending' ? 'Sending...' :
                                  contactStatus === 'success' ? 'Message Sent!' :
                                  contactStatus === 'error' ? 'Error Sending' : 'Send Message'}
                             </button>
                         </form>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* No Connection Section */}
      <section id="no-connection" className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest mb-4 border border-red-100">
                      <AlertTriangle className="w-3 h-3" />
                      Troubleshoot
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">No Connection?</h2>
                  <p className="text-slate-500 font-medium">Subukan muna ang mga steps na ito para bumilis ulit ang net mo!</p>
              </div>

              <div className="grid md:grid-cols-4 gap-8">
                  {/* Step 1 */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-red-200 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                          <Power className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">1. Restart Modem</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                          Hugutin ang power adapter sa saksakan. Maghintay ng 1-2 minutes bago isaksak ulit.
                      </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-red-200 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                          <Plug className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">2. Check Cables</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                          Siguraduhin na mahigpit ang yellow patch cord. Iwasan maipit o mabaluktot ang fiber cable.
                      </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-red-200 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                          <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">3. Check LOS</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                          Kung may <span className="text-red-600 font-bold">pulang ilaw</span> sa 'LOS', putol ang linya o walang signal. I-report na agad.
                      </p>
                  </div>

                   {/* Step 4 */}
                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center hover:border-red-200 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                          <Smartphone className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">4. Check Device</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                          Subukan mag-connect gamit ang ibang cellphone o laptop. Baka sa gadget lang ang issue.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                      <Wifi className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black text-white tracking-tighter">BOJEX<span className="text-red-600">.ONLINE</span></span>
              </div>
              <div className="flex flex-col items-center md:items-end gap-1">
                 <p className="text-slate-500 text-sm font-medium">© 2024 Bojex Internet Services. All rights reserved.</p>
                 <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Camarines Sur, Bicol</p>
              </div>

              <div className="flex gap-6">
                  <a href="#" className="text-slate-400 hover:text-white transition-colors"><Globe className="w-5 h-5"/></a>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors"><MessageCircle className="w-5 h-5"/></a>
              </div>
          </div>
      </footer>

      <PublicChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        subscriber={subscriber}
        socket={socket}
      />

      <SubscriptionModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        planName={selectedPlan}
      />
    </div>
  );
};

export default Home;
