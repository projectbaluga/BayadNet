import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailInbox = ({ token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, [token]);

  const fetchMessages = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/messages', config);
      setMessages(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const handleExpand = async (id, status) => {
    setExpandedId(expandedId === id ? null : id);

    if (status === 'Unread') {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.patch(`/api/messages/${id}/read`, {}, config);

        // Update local state
        setMessages(prev => prev.map(msg =>
          msg._id === id ? { ...msg, status: 'Read' } : msg
        ));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
       <div className="flex items-center justify-between mb-6">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Inbox</h2>
            <p className="text-gray-500 text-sm font-medium">Manage inquiries from the website contact form.</p>
         </div>
         <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mr-2">Total Messages</span>
            <span className="text-lg font-black text-indigo-600">{messages.length}</span>
         </div>
       </div>

       {messages.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
             </div>
             <p className="text-gray-500 font-medium">No messages yet.</p>
          </div>
       ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="divide-y divide-gray-100">
                {messages.map((msg) => (
                   <div key={msg._id} className={`group transition-colors ${msg.status === 'Unread' ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}>
                      <div
                        onClick={() => handleExpand(msg._id, msg.status)}
                        className="p-4 sm:px-6 cursor-pointer flex items-center justify-between gap-4"
                      >
                         <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${msg.status === 'Unread' ? 'bg-indigo-600' : 'bg-transparent'}`}></div>
                            <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-2 mb-0.5">
                                  <p className={`text-sm truncate ${msg.status === 'Unread' ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                    {msg.name}
                                  </p>
                                  <span className="text-xs text-gray-400 font-normal">&lt;{msg.email}&gt;</span>
                               </div>
                               <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 text-xs text-gray-400 font-medium whitespace-nowrap">
                            <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 transition-transform ${expandedId === msg._id ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                         </div>
                      </div>

                      {expandedId === msg._id && (
                         <div className="px-6 pb-6 pt-2 pl-12 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                               <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                                  <div>
                                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">From</p>
                                     <p className="text-sm font-bold text-gray-900">{msg.name}</p>
                                     <p className="text-sm text-indigo-600 font-medium">{msg.email}</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Received</p>
                                     <p className="text-sm font-medium text-gray-900">{new Date(msg.createdAt).toLocaleString()}</p>
                                  </div>
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</p>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
       )}
    </div>
  );
};

export default EmailInbox;
