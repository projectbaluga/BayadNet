import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Send, ChevronDown, ChevronUp, User, ShieldCheck, Loader2, Image, Paperclip, Eye, XCircle } from 'lucide-react';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

const SubscriberCard = ({ subscriber, onPay, onHistory, onViewReceipt, onEdit, onDelete, userRole, token, socket, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReports, setLocalReports] = useState(subscriber.reports || []);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const notificationSoundRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  useEffect(() => {
    setLocalReports(subscriber.reports || []);
  }, [subscriber.reports]);

  useEffect(() => {
    if (socket) {
      const handleReportAdded = ({ subscriberId, report }) => {
        if (subscriberId === subscriber._id) {
          setLocalReports(prev => [...prev, report]);

          // Play notification sound if not the sender
          const currentUser = JSON.parse(localStorage.getItem('user')) || {};
          if (report.reporterName !== (currentUser.name || currentUser.username)) {
            notificationSoundRef.current.play().catch(e => console.log('Sound blocked by browser'));
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
    if (isExpanded) {
      scrollToBottom();
      // Emit mark-as-read
      if (socket && (userRole === 'admin' || userRole === 'staff')) {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        socket.emit('mark-as-read', { subscriberId: subscriber._id, user: currentUser });
      }
    }
  }, [localReports, isExpanded, socket, userRole, subscriber._id]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSendReminder = () => {
    const amount = subscriber.status === 'Partial' ? subscriber.remainingBalance : subscriber.amountDue;
    const message = `Hi ${subscriber.name}, your bill for ${subscriber.currentMonthName || 'this month'} is ${subscriber.status}. Total Due: ₱${amount.toLocaleString()} (after ₱${subscriber.rebate.toLocaleString()} rebate). Thank you!`;

    if (subscriber.messengerId) {
      const url = `https://m.me/${subscriber.messengerId}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      // Fallback if no Messenger ID, try SMS or just generic Messenger
      if (subscriber.contactNo) {
        const smsUrl = `sms:${subscriber.contactNo}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
      } else {
        const url = `https://m.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    }
  };

  const handleDownloadSOA = () => {
    const amount = subscriber.status === 'Partial' ? subscriber.remainingBalance : subscriber.amountDue;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SOA - ${subscriber.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .total { font-size: 24px; font-weight: bold; color: #4f46e5; margin-top: 30px; }
            .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Statement of Account</h1>
            <p>Subscriber: <strong>${subscriber.name}</strong></p>
            <p>Billing Period: ${subscriber.currentMonthName || 'Current Month'}</p>
          </div>
          <div class="row"><span>Monthly Rate</span><span>₱${subscriber.rate.toLocaleString()}</span></div>
          <div class="row"><span>Outage Rebate (${subscriber.daysDown} days)</span><span>-₱${subscriber.rebate.toLocaleString()}</span></div>
          <div class="row"><span>Total Amount for Period</span><span>₱${subscriber.amountDue.toLocaleString()}</span></div>
          <div class="row"><span>Payments Made</span><span>₱${(subscriber.amountDue - (subscriber.status === 'Partial' ? subscriber.remainingBalance : (subscriber.status === 'Paid' ? 0 : subscriber.amountDue))).toLocaleString()}</span></div>
          <div class="total flex justify-between"><span>Remaining Balance</span><span>₱${(subscriber.status === 'Paid' ? 0 : amount).toLocaleString()}</span></div>
          <div class="footer">Generated by BayadNet Pro on ${new Date().toLocaleDateString()}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  const isPaid = subscriber.status === 'Paid';

  const latestReport = localReports.length > 0
    ? localReports[localReports.length - 1]
    : null;

  const hasActiveIssue = localReports.length > 0;

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large! Max 5MB.");
        return;
      }
      const base64 = await convertToBase64(file);
      setAttachment(base64);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if ((!reportMessage.trim() && !attachment) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`/api/subscribers/${subscriber._id}/report`, {
        message: reportMessage,
        attachmentUrl: attachment // Directly send base64 image
      }, config);

      setReportMessage('');
      setAttachment(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/20 p-10 flex flex-col gap-8 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 group relative overflow-hidden hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="max-w-[70%]">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-2xl text-slate-900 truncate leading-none group-hover:text-indigo-600 transition-colors tracking-tight">
              {subscriber.name}
            </h3>
            {hasActiveIssue && (
              <button
                onClick={() => setIsExpanded(true)}
                className="bg-amber-100 text-amber-600 p-1 rounded-full hover:bg-amber-200 transition-all animate-pulse"
                title="Active Issue Reported"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
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
      <div className="space-y-4 relative z-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Monthly Rate</span>
          <span className="text-slate-900 font-black text-right">₱{subscriber.rate.toLocaleString()}</span>
        </div>

        {subscriber.daysDown > 0 && (
          <div className="flex justify-between items-center text-sm text-rose-500">
            <span className="font-medium uppercase tracking-wider text-[10px]">Outage ({subscriber.daysDown} days)</span>
            <span className="font-black text-right">-₱{subscriber.rebate.toLocaleString()}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
            {subscriber.status === 'Partial' ? 'Remaining Balance' : 'Total Due'}
          </span>
          <span className="text-2xl font-black text-indigo-600 leading-none text-right">
            ₱{(subscriber.status === 'Partial' ? subscriber.remainingBalance : subscriber.amountDue).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        <div className="bg-slate-50/30 px-5 py-4 rounded-2xl border border-slate-100/50 relative overflow-hidden flex justify-between items-center">
          <div>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Next Due Date</p>
            <p className="text-sm font-black text-slate-700 tracking-tight">{subscriber.dueDate}</p>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              hasActiveIssue ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {localReports.length} {localReports.length === 1 ? 'Issue' : 'Issues'}
            </span>
          </button>
        </div>
      </div>

      {/* Centered Modal for Reports */}
      {isExpanded && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-zoom-in border border-slate-100 max-h-[90vh] flex flex-col relative">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all z-10"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Issue Reports</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{subscriber.name}</p>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar scroll-smooth min-h-[300px]"
            >
              {localReports.length > 0 ? (
                localReports.map((report, idx) => {
                  const isTech = report.reporterRole === 'technician';
                  return (
                    <div key={idx} className={`flex flex-col ${isTech ? 'items-start' : 'items-end'} animate-fade-in`}>
                      <div className={`max-w-[80%] rounded-[2rem] px-6 py-4 text-sm shadow-md ${
                        isTech
                          ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                          : 'bg-indigo-600 text-white rounded-tr-none'
                      }`}>
                        {report.attachmentUrl && (
                          <div className="mb-3 overflow-hidden rounded-2xl">
                            <img
                              src={report.attachmentUrl}
                              alt="Attachment"
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => onViewReceipt(report.attachmentUrl)}
                            />
                          </div>
                        )}
                        <p className="font-bold leading-relaxed text-base">{report.message}</p>
                        <div className={`flex items-center gap-2 mt-3 pt-3 border-t text-[10px] font-black uppercase tracking-widest ${
                          isTech ? 'border-slate-200 text-slate-400' : 'border-white/20 text-indigo-100'
                        }`}>
                          {isTech ? <User className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          {report.reporterName} • {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      {idx === localReports.length - 1 && report.readBy && report.readBy.length > 1 && (
                        <div className="flex items-center gap-1 mt-2 px-2 opacity-60">
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Seen by {report.readBy.filter(r => r.name !== report.reporterName).map(r => r.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <AlertCircle className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">No issues reported yet</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSendReport} className="mt-8 space-y-4">
              {attachment && (
                <div className="relative inline-block animate-zoom-in">
                  <img src={attachment} className="h-32 w-auto rounded-3xl shadow-xl border-4 border-indigo-50" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 shadow-xl hover:bg-rose-600 transition-all hover:scale-110"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Describe the issue or update..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-6 pl-8 pr-32 text-lg font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                />
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                    title="Attach Image"
                  >
                    <Image className="w-6 h-6" />
                  </button>
                  <button
                    type="submit"
                    disabled={(!reportMessage.trim() && !attachment) || isSubmitting}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-indigo-100"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                  </button>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 mt-auto relative z-10">
        {!isPaid ? (
          (userRole === 'admin' || userRole === 'staff') && (
            <button
              onClick={() => onPay(subscriber)}
              className="w-full bg-indigo-600 text-white text-[11px] font-black py-5 rounded-2xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-100 uppercase tracking-[0.2em]"
            >
              {subscriber.status === 'Partial' ? 'Pay Balance' : 'Confirm Payment'}
            </button>
          )
        ) : (
          <div className="w-full bg-emerald-50 text-emerald-600 text-[10px] font-black py-5 rounded-2xl text-center border border-emerald-100 uppercase tracking-widest shadow-inner">
            ✓ Account Settled
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onHistory(subscriber)}
            className="p-4 bg-white text-slate-400 rounded-2xl hover:bg-amber-50 hover:text-amber-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
            title="Payment History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => onEdit(subscriber)}
              className="p-4 bg-white text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {(userRole === 'admin' || userRole === 'staff') && (
            <>
              <button
                onClick={handleSendReminder}
                className="p-4 bg-white text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
                title="Send Reminder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
              <button
                onClick={handleDownloadSOA}
                className="p-4 bg-white text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-slate-900 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
                title="Download SOA"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </>
          )}
          {userRole === 'admin' && (
            <button
              onClick={() => onDelete(subscriber._id)}
              className="p-4 bg-white text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all border border-slate-100 shadow-sm"
              title="Archive Account"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriberCard;
