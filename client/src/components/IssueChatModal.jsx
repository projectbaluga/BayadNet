import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Send, User, ShieldCheck, Loader2, Image, XCircle, Eye, Camera } from 'lucide-react';
import { convertToBase64, compressImage } from '../utils/image';

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        // Compress if it's an image
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(base64);
          setAttachment(compressed);
        } else {
          setAttachment(base64);
        }
      } catch (err) {
        console.error('Error processing file:', err);
        alert('Error processing image');
      }
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl p-4 sm:p-6 animate-in zoom-in duration-300 border border-slate-100 h-[85vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Issue Reports</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subscriber.name} • {subscriber.accountId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all z-10"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar scroll-smooth min-h-0 mb-4"
        >
          {localReports.length > 0 ? (
            localReports.map((report, idx) => {
              const isTech = report.reporterRole === 'technician';
              return (
                <div key={idx} className={`flex flex-col ${isTech ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] rounded-[1.5rem] px-4 py-3 text-xs shadow-sm ${
                    isTech
                      ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    {report.attachmentUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl max-w-full">
                        <img
                          src={report.attachmentUrl}
                          alt="Attachment"
                          className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(report.attachmentUrl, '_blank')}
                        />
                      </div>
                    )}
                    <p className="font-bold leading-snug whitespace-pre-wrap">{report.message}</p>
                    <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t text-[8px] font-black uppercase tracking-widest ${
                      isTech ? 'border-slate-200 text-slate-400' : 'border-white/20 text-indigo-100'
                    }`}>
                      {isTech ? <User className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
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
            <div className="relative inline-block animate-in zoom-in duration-200 mb-2 ml-2">
              <img src={attachment} className="h-20 w-auto rounded-xl shadow-lg border-2 border-indigo-50" alt="Preview" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-all hover:scale-110"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendReport} className="relative group">
            <textarea
              placeholder="Type a message..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-3 pl-5 pr-28 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 resize-none min-h-[50px]"
              rows="1"
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReport(e);
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Take Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Attach Image"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={(!reportMessage.trim() && !attachment) || isSubmitting}
                className="ml-1 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-indigo-100"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
