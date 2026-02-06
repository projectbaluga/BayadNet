import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check, Wifi, MapPin, Phone, Mail, User } from 'lucide-react';
import { isValidEmail, isValidPHPhoneNumber } from '../utils/validators';

const SubscriptionModal = ({ isOpen, onClose, planName }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNo: '',
    email: '',
    plan: ''
  });
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && planName) {
      setFormData(prev => ({ ...prev, plan: planName }));
      setErrorMsg('');
    }
  }, [isOpen, planName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isValidPHPhoneNumber(formData.contactNo)) {
      setErrorMsg('Please enter a valid PH mobile number (e.g. 09123456789).');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('sending');
    try {
      // We will reuse the contact endpoint but send type='Application'
      await axios.post('/api/public/contact', {
        ...formData,
        type: 'Application',
        message: `New Application for ${formData.plan} Plan. Address: ${formData.address}. Contact: ${formData.contactNo}`
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFormData({ name: '', address: '', contactNo: '', email: '', plan: '' });
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-zoom-in relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
           <div className="relative z-10">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-red-900/50">
                 <Wifi className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Join the Network</h2>
              <p className="text-slate-400 text-sm font-medium">Apply for <span className="text-red-500 font-bold">{formData.plan || 'Internet'}</span> Service</p>
           </div>
        </div>

        {/* Form */}
        <div className="p-8">
           {errorMsg && (
             <div className="mb-4 bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">!</div>
                {errorMsg}
             </div>
           )}
           {status === 'success' ? (
              <div className="text-center py-8 animate-in zoom-in duration-300">
                 <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <Check className="w-10 h-10 stroke-[3]" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-2">Application Sent!</h3>
                 <p className="text-slate-500 text-sm font-medium">We have received your application. Our team will contact you shortly for installation schedule.</p>
              </div>
           ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                    <div className="relative">
                       <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                       <input
                          type="text"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                          placeholder="Juan Dela Cruz"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contact No.</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                           <input
                              type="tel"
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                              placeholder="0912..."
                              value={formData.contactNo}
                              onChange={e => setFormData({...formData, contactNo: e.target.value})}
                           />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                           <input
                              type="email"
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                              placeholder="email@..."
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                           />
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Installation Address</label>
                    <div className="relative">
                       <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                       <input
                          type="text"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                          placeholder="Complete address (Street, Brgy, City)"
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Selected Plan</label>
                    <div className="relative">
                       <Wifi className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                       <input
                          type="text"
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                          value={formData.plan}
                          readOnly
                       />
                    </div>
                 </div>

                 <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-red-600 text-white font-bold py-4 rounded-xl uppercase tracking-wide hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200 mt-4 flex items-center justify-center gap-2"
                 >
                    {status === 'sending' ? (
                        <>Processing...</>
                    ) : (
                        <>Submit Application</>
                    )}
                 </button>
              </form>
           )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
