import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Send, User, ShieldCheck, Loader2, Image, XCircle, Eye, Camera } from 'lucide-react';
import { convertToBase64, compressImage } from '../utils/image';

const IssueChatModal = ({ isOpen, onClose, subscriber, token, socket, userRole, onRefresh }) => {
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
      // Emit mark-as-read
      if (socket) {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        if (currentUser.name) {
          socket.emit('mark-as-read', { subscriberId: subscriber._id, user: currentUser });
        }
      }
    }
  }, [reports, isOpen, socket, subscriber]);

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
      // No longer need a full dashboard refresh because of socket sync
    } catch (error) {
      console.error('Error sending report:', error);
      alert('Failed to send report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-orange-500';
      case 'staff': return 'bg-red-500';
      case 'technician': return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  if (!isOpen || !subscriber) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-4 sm:p-6 animate-in zoom-in duration-200 border border-gray-200 h-[85vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Issue Reports</h2>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{subscriber.name} • {subscriber.accountId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-gray-400 rounded-md hover:bg-gray-50 transition-all z-10 border border-transparent hover:border-gray-200"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar scroll-smooth min-h-0 mb-6"
        >
          {reports.length > 0 ? (
            reports.map((report, idx) => {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const isMe = report.reporterName === (currentUser.name || currentUser.username);
              const isTech = report.reporterRole === 'technician';

              return (
                <div key={idx} className={`flex flex-col ${!isMe ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                  <div className={`max-w-[90%] sm:max-w-[80%] rounded-lg px-4 py-3 text-sm shadow-sm border ${
                    !isMe
                      ? 'bg-gray-50 text-gray-800 border-gray-100'
                      : 'bg-indigo-600 text-white border-indigo-600'
                  }`}>
                    {report.attachmentUrl && (
                      <div className="mb-2 overflow-hidden rounded-md max-w-full">
                        <img
                          src={report.attachmentUrl}
                          alt="Attachment"
                          className="w-full h-auto max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(report.attachmentUrl, '_blank')}
                        />
                      </div>
                    )}
                    <p className="font-medium leading-snug whitespace-pre-wrap">{report.message}</p>
                    <div className={`flex items-center gap-1.5 mt-2 pt-2 border-t text-[10px] font-bold uppercase tracking-wide ${
                      isTech ? 'border-gray-200 text-gray-400' : 'border-white/20 text-indigo-100'
                    }`}>
                      {isTech ? <User className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      {report.reporterName} • {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Metadata Outside */}
                  <div className={`flex items-center gap-1.5 mt-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getRoleColor(report.reporterRole)} shadow-sm`}></div>
                    <span className={isMe ? 'text-indigo-600/50' : ''}>{report.reporterRole}</span>
                    <span className="opacity-40">•</span>
                    <span>{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</span>
                  </div>

                  {idx === reports.length - 1 && report.readBy && report.readBy.length > 1 && (
                    <div className="flex items-center gap-1 mt-1 px-1 opacity-60">
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Seen by {report.readBy.filter(r => r.name !== report.reporterName).map(r => r.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
              <AlertCircle className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">No issues reported yet</p>
            </div>
          )}
        </div>

        {/* Footer / Input */}
        <div className="mt-auto bg-white pt-2">
          {attachment && (
            <div className="relative inline-block animate-in zoom-in duration-200 mb-2 ml-1">
              <img src={attachment} className="h-16 w-auto rounded-md shadow-md border border-gray-200" alt="Preview" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-all hover:scale-110"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendReport} className="relative group">
            <textarea
              placeholder="Type a message..."
              className="w-full bg-gray-50 border border-gray-300 rounded-md py-3 pl-4 pr-28 text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 resize-none min-h-[50px]"
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
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                title="Take Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                title="Attach Image"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={(!reportMessage.trim() && !attachment) || isSubmitting}
                className="ml-1 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={(!reportMessage.trim() && !attachment) || isSubmitting}
              className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-indigo-100"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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

export default IssueChatModal;
