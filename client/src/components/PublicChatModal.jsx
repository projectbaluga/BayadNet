import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Send, Loader2, Image, XCircle, Eye, Camera, Check } from 'lucide-react';
import { convertToBase64, compressImage } from '../utils/image';

const PublicChatModal = ({ isOpen, onClose, subscriber, socket, onRefresh }) => {
  const [reportMessage, setReportMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const reports = subscriber?.reports || [];

  useEffect(() => {
    if (isOpen && subscriber) {
      scrollToBottom();
      // We don't have a user token, so we can't easily mark admin messages as read individually via socket without identifying ourselves securely.
      // But we can perhaps rely on the next refresh or just not track "read by subscriber" for now in the public view.
    }
  }, [reports, isOpen, subscriber]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
         alert('File is too large. Max 5MB.');
         return;
      }
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
      // Optimistic update - create a temp report object
      // Note: In a real app we might want the server response to confirm, but for speed we can append locally
      // actually, let's wait for the server response which gives us the full object, then append it via callback or prop
      const res = await axios.post('/api/public/report', {
        accountId: subscriber.accountId,
        message: reportMessage,
        attachmentUrl: attachment
      });

      setReportMessage('');
      setAttachment(null);

      // If parent doesn't update fast enough via socket, we can force a refresh or rely on socket.
      // But since we fixed the parent socket listener, let's also do a safe check:
      if (onRefresh) onRefresh();

    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColorClass = (role) => {
    if (!role) return 'text-gray-700';
    const r = role.toLowerCase();
    if (r === 'admin') return 'text-red-600';
    if (r === 'staff') return 'text-blue-600';
    if (r === 'technician') return 'text-emerald-600';
    return 'text-gray-700'; // Subscriber usually
  };

  if (!isOpen || !subscriber) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in duration-200 border border-gray-100 h-[85vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shadow-md z-10">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Support Chat
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subscriber.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-md"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-6 px-4 py-6 bg-slate-50 custom-scrollbar scroll-smooth"
        >
          {reports.length > 0 ? (
            reports.map((report, idx) => {
              // In public view, "Me" is the subscriber
              const isMe = report.reporterRole === 'subscriber';
              const roleColor = getRoleColorClass(report.reporterRole);

              return (
                <div key={idx} className={`flex flex-col ${!isMe ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>

                  {/* Name and Time */}
                  <div className={`flex items-center gap-2 mb-1.5 px-1 ${!isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {isMe ? 'You' : report.reporterName}
                    </span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-sm border relative ${
                    !isMe
                      ? 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
                      : 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none'
                  }`}>
                    {report.attachmentUrl && (
                      <div className="mb-3 overflow-hidden rounded-xl bg-black/10">
                        <img
                          src={report.attachmentUrl}
                          alt="Attachment"
                          className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(report.attachmentUrl, '_blank')}
                        />
                      </div>
                    )}
                    <p className="font-medium leading-relaxed whitespace-pre-wrap">{report.message}</p>

                    {/* Seen Indicator for my messages */}
                    {isMe && report.readBy && report.readBy.length > 1 && (
                       <div className="absolute -bottom-4 right-0 flex items-center gap-1">
                          <Check className="w-3 h-3 text-indigo-400" />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Seen</span>
                       </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Start a conversation</p>
              <p className="text-[10px] font-bold text-slate-300 mt-2">Our support team is ready to help</p>
            </div>
          )}
        </div>

        {/* Footer / Input */}
        <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
          {attachment && (
            <div className="relative inline-block animate-in zoom-in duration-200 mb-4 ml-2">
              <img src={attachment} className="h-20 w-auto rounded-xl shadow-lg border-2 border-indigo-100 object-cover" alt="Preview" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all hover:scale-110"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendReport} className="relative flex items-center gap-2">
             <div className="flex items-center gap-1 absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Take Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Attach Image"
              >
                <Image className="w-5 h-5" />
              </button>
            </div>

            <textarea
              placeholder="Type your message here..."
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-3xl py-3.5 pl-24 pr-14 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 resize-none h-[54px] overflow-hidden"
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

            <button
              type="submit"
              disabled={(!reportMessage.trim() && !attachment) || isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-indigo-200"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>

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

export default PublicChatModal;
