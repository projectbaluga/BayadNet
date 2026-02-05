import React, { useRef } from 'react';
import { Send, Image, Loader2, XCircle } from 'lucide-react';

const ReportForm = ({
  reportMessage,
  setReportMessage,
  attachment,
  setAttachment,
  isSubmitting,
  handleSendReport,
  handleFileChange
}) => {
  const fileInputRef = useRef(null);

  return (
    <form onSubmit={handleSendReport} className="space-y-3 mt-4">
      {attachment && (
        <div className="relative inline-block">
          <img src={attachment} className="h-20 w-auto rounded-xl shadow-md border-2 border-indigo-200" alt="Preview" />
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder="Type your report..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-5 pr-28 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
          value={reportMessage}
          onChange={(e) => setReportMessage(e.target.value)}
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Attach Image"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={(!reportMessage.trim() && !attachment) || isSubmitting}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-indigo-100"
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
      </div>
    </form>
  );
};

export default ReportForm;
