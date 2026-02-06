import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Send, User, ShieldCheck, Loader2, Image, XCircle, Eye, Camera } from 'lucide-react';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

const IssueChatModal = ({ isOpen, onClose, subscriber, token, socket, userRole, onRefresh }) => {
  const [reportMessage, setReportMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReports, setLocalReports] = useState([]);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const notificationSoundRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  useEffect(() => {
    if (subscriber) {
      setLocalReports(subscriber.reports || []);
    }
  }, [subscriber]);

  useEffect(() => {
    if (socket && subscriber) {
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
  }, [socket, subscriber]);

  useEffect(() => {
    if (isOpen && subscriber) {
      scrollToBottom();
      // Emit mark-as-read
      if (socket && (userRole === 'admin' || userRole === 'staff')) {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        socket.emit('mark-as-read', { subscriberId: subscriber._id, user: currentUser });
      }
    }
  }, [localReports, isOpen, socket, userRole, subscriber]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

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
      const base64 = await convertToBase64(file);
      setAttachment(base64);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if ((!reportMessage.trim() && !attachment) || isSubmitting || !subscriber) return;

    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`/api/subscribers/${subscriber._id}/report`, {
        message: reportMessage,
        attachmentUrl: attachment
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

  if (!isOpen || !subscriber) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl p-6 sm:p-10 animate-in zoom-in duration-300 border border-slate-100 h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Issue Reports</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{subscriber.name} • {subscriber.accountId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all z-10"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar scroll-smooth min-h-0 mb-6"
        >
          {localReports.length > 0 ? (
            localReports.map((report, idx) => {
              const isTech = report.reporterRole === 'technician';
              return (
                <div key={idx} className={`flex flex-col ${isTech ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-[2rem] px-6 py-4 text-sm shadow-md ${
                    isTech
                      ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    {report.attachmentUrl && (
                      <div className="mb-3 overflow-hidden rounded-2xl max-w-sm">
                        <img
                          src={report.attachmentUrl}
                          alt="Attachment"
                          className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(report.attachmentUrl, '_blank')}
                        />
                      </div>
                    )}
                    <p className="font-bold leading-relaxed text-base whitespace-pre-wrap">{report.message}</p>
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

        {/* Footer / Input */}
        <div className="mt-auto">
          {attachment && (
            <div className="relative inline-block animate-in zoom-in duration-200 mb-4 ml-4">
              <img src={attachment} className="h-24 w-auto rounded-2xl shadow-xl border-4 border-indigo-50" alt="Preview" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-xl hover:bg-rose-600 transition-all hover:scale-110"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendReport} className="relative group">
            <textarea
              placeholder="Describe the issue or update..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-5 pl-8 pr-32 text-lg font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 resize-none min-h-[80px]"
              rows="2"
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReport(e);
                }
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 sm:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                title="Take Photo"
              >
                <Camera className="w-5 h-5 sm:w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                title="Attach Image"
              >
                <Image className="w-5 h-5 sm:w-6 h-6" />
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
            <input
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={handleFileChange}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueChatModal;
