import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Send, ChevronDown, ChevronUp, User, ShieldCheck, Loader2, Image, XCircle, Eye } from 'lucide-react';

// RECOVERY: Local notification sound path
const NOTIFICATION_SOUND_URL = '/pop.mp3';

const SubscriberCard = ({ subscriber, onPay, onHistory, onViewReceipt, onEdit, onDelete, userRole, token, socket, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [attachment, setAttachment] = useState(null); // Base64 for preview
  const [attachmentFile, setAttachmentFile] = useState(null); // File for FormData
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReports, setLocalReports] = useState(subscriber.reports || []);
  const chatContainerRef = useRef(null);
  const notificationSoundRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  useEffect(() => {
    setLocalReports(subscriber.reports || []);
  }, [subscriber.reports]);

  useEffect(() => {
    if (socket) {
      const handleReportAdded = ({ subscriberId, report }) => {
        if (subscriberId === subscriber._id) {
          setLocalReports(prev => [...prev, report]);

          // NOTIFICATION RECOVERY: Play catchy pop sound
          const currentUser = JSON.parse(localStorage.getItem('user')) || {};
          if (report.reporterName !== (currentUser.name || currentUser.username)) {
            notificationSoundRef.current.play().catch(e => console.log('Sound blocked'));
          }
        }
      };

      const handleReportsRead = ({ subscriberId, reports }) => {
        if (subscriberId === subscriber._id) {
          setLocalReports(reports);
        }
      };

      socket.on('report-added', handleReportAdded);
      socket.on('reports-read', handleReportsRead);
      return () => {
        socket.off('report-added', handleReportAdded);
        socket.off('reports-read', handleReportsRead);
      };
    }
  }, [socket, subscriber._id]);

  useEffect(() => {
    if (isExpanded && socket && (userRole === 'admin' || userRole === 'staff')) {
      scrollToBottom();
      // SEEN SYSTEM RECOVERY: Pass explicit adminName
      const currentUser = JSON.parse(localStorage.getItem('user')) || {};
      if (currentUser.name) {
        socket.emit('mark-as-read', {
          subscriberId: subscriber._id,
          adminName: currentUser.name,
          role: currentUser.role
        });
      }
    }
  }, [localReports, isExpanded, socket, userRole, subscriber._id]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large (Max 10MB)");
        return;
      }
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAttachment(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if ((!reportMessage.trim() && !attachmentFile) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let attachmentUrl = '';

      // LOCAL STORAGE RECOVERY: Upload to local server instead of Cloudinary
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('reportImage', attachmentFile);
        const uploadRes = await axios.post('/api/reports/upload', formData, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = uploadRes.data.url;
      }

      await axios.post(`/api/subscribers/${subscriber._id}/report`, {
        message: reportMessage,
        attachmentUrl
      }, config);

      setReportMessage('');
      setAttachment(null);
      setAttachmentFile(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('[Recovery] Report submission failed:', error);
      alert(error.response?.data?.message || 'Failed to send report. Check server logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Overdue': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'Due Today': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'Partial': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/20 p-10 flex flex-col gap-8 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1">
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
        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(subscriber.status)} shadow-sm`}>
          {subscriber.status}
        </span>
      </div>

      <div className="space-y-4 relative z-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Monthly Rate</span>
          <span className="text-slate-900 font-black">₱{subscriber.rate.toLocaleString()}</span>
        </div>
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
            {subscriber.status === 'Partial' ? 'Remaining Balance' : 'Total Due'}
          </span>
          <span className="text-2xl font-black text-indigo-600 leading-none">
            ₱{(subscriber.status === 'Partial' ? subscriber.remainingBalance : subscriber.amountDue).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-50/30 px-5 py-4 rounded-2xl border border-slate-100/50">
          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Next Due Date</p>
          <p className="text-sm font-black text-slate-700 tracking-tight">{subscriber.dueDate}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex flex-col items-start justify-center px-5 py-4 rounded-2xl border transition-all ${
            localReports.length > 0 ? 'bg-amber-50/50 border-amber-100 text-amber-700' : 'bg-slate-50/30 border-slate-100/50 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <p className="text-[9px] uppercase font-black tracking-widest">Issues</p>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </div>
          <div className="flex items-center gap-2 overflow-hidden w-full">
            <AlertCircle className={`w-3 h-3 flex-shrink-0 ${localReports.length > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
            <p className="text-[10px] font-bold truncate">
              {localReports.length > 0 ? localReports[localReports.length-1].message : 'No issues'}
            </p>
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="relative z-10 -mt-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 space-y-6">
            <div ref={chatContainerRef} className="max-h-60 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {localReports.map((report, idx) => {
                const isTech = report.reporterRole === 'technician';
                return (
                  <div key={idx} className={`flex flex-col ${isTech ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isTech ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-violet-600 text-white rounded-tr-none'
                    }`}>
                      {report.attachmentUrl && (
                        <img src={report.attachmentUrl} alt="Report" className="mb-2 rounded-lg max-w-full h-auto cursor-pointer" onClick={() => onViewReceipt(report.attachmentUrl)} />
                      )}
                      <p className="font-medium leading-relaxed">{report.message}</p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20 text-[9px] font-black uppercase opacity-70">
                        {isTech ? <User className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                        {report.reporterName} • {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                    {/* SEEN SYSTEM RECOVERY: Dynamic rendering */}
                    {idx === localReports.length - 1 && report.readBy && report.readBy.length > 1 && (
                      <div className="flex items-center gap-1 mt-1 px-1 opacity-60">
                        <Eye className="w-2.5 h-2.5 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          Seen by {report.readBy
                            .filter(r => r.name !== report.reporterName)
                            .map(r => r.name === JSON.parse(localStorage.getItem('user'))?.name ? 'You' : r.name)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendReport} className="space-y-3 mt-4">
              {attachment && (
                <div className="relative inline-block">
                  <img src={attachment} className="h-20 w-auto rounded-xl border-2 border-indigo-200" alt="Preview" />
                  <button type="button" onClick={() => { setAttachment(null); setAttachmentFile(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"><XCircle className="w-4 h-4" /></button>
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type report..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-5 pr-28 text-sm font-bold text-slate-700"
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  {/* UI RECOVERY: Label-based input for image uploads */}
                  <label className="p-3 text-slate-400 hover:text-indigo-600 cursor-pointer transition-all" title="Attach Image">
                    <Image className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <button type="submit" disabled={isSubmitting} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 mt-auto relative z-10">
        {subscriber.status !== 'Paid' ? (
          (userRole === 'admin' || userRole === 'staff') && (
            <button onClick={() => onPay(subscriber)} className="w-full bg-indigo-600 text-white text-[11px] font-black py-5 rounded-2xl shadow-xl shadow-red-100 uppercase tracking-[0.2em] hover:scale-[1.02] transition-all">
              {subscriber.status === 'Partial' ? 'Pay Balance' : 'Confirm Payment'}
            </button>
          )
        ) : (
          <div className="w-full bg-emerald-50 text-emerald-600 text-[10px] font-black py-5 rounded-2xl text-center border border-emerald-100 uppercase tracking-widest">
            ✓ Account Settled
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => onHistory(subscriber)} className="p-4 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:scale-110 transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          {userRole === 'admin' && (
            <button onClick={() => onEdit(subscriber)} className="p-4 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:scale-110 transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          )}
          {userRole === 'admin' && (
            <button onClick={() => onDelete(subscriber._id)} className="p-4 bg-white text-slate-400 rounded-2xl border border-slate-100 hover:text-rose-600 hover:scale-110 transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriberCard;
