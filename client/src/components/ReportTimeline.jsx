import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, ShieldCheck, Eye } from 'lucide-react';

const ReportTimeline = ({ reports, onViewReceipt }) => {
  return (
    <div className="max-h-60 overflow-y-auto space-y-4 pr-2 custom-scrollbar scroll-smooth">
      {reports.length > 0 ? (
        reports.map((report, idx) => {
          const isTech = report.reporterRole === 'technician';
          return (
            <div key={idx} className={`flex flex-col ${isTech ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                isTech
                  ? 'bg-blue-600 text-white rounded-tl-none'
                  : 'bg-violet-600 text-white rounded-tr-none'
              }`}>
                {report.attachmentUrl && (
                  <div className="mb-2 overflow-hidden rounded-lg">
                    <img
                      src={report.attachmentUrl}
                      alt="Attachment"
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => onViewReceipt(report.attachmentUrl)}
                    />
                  </div>
                )}
                <p className="font-medium leading-relaxed">{report.message}</p>
                <div className={`flex items-center gap-2 mt-2 pt-2 border-t border-white/20 text-[9px] font-black uppercase tracking-widest ${
                  isTech ? 'text-blue-100' : 'text-violet-100'
                }`}>
                  {isTech ? <User className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                  {report.reporterName} • {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                </div>
              </div>
              {/* Seen Indicator */}
              {idx === reports.length - 1 && report.readBy && report.readBy.length > 1 && (
                <div className="flex items-center gap-1 mt-1 px-1 opacity-60">
                  <Eye className="w-2.5 h-2.5 text-slate-400" />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    Seen by {report.readBy.filter(r => r.name !== report.reporterName).map(r => r.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No reports yet</p>
        </div>
      )}
    </div>
  );
};

export default ReportTimeline;
