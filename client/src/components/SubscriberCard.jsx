import React from "react";

const statusStyles = {
  Paid: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  "Paid/Skipped": "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  Overdue: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  "Due Today": "bg-amber-500/15 text-amber-200 border-amber-500/30",
  Due: "bg-sky-500/15 text-sky-200 border-sky-500/30"
};

const adjustmentLabels = {
  extended_due_date: "Storm Credit: Due date +14 days",
  half_off: "Storm Credit: 50% off",
  none: null
};

export default function SubscriberCard({ subscriber, onPay }) {
  const badgeStyle = statusStyles[subscriber.status] || statusStyles.Due;
  const adjustmentLabel = adjustmentLabels[subscriber.adjustment];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{subscriber.name}</h3>
          <p className="text-sm text-slate-400">Billing cycle: {subscriber.cycleDay}th</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeStyle}`}
        >
          {subscriber.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Due Date</span>
          <span className="font-semibold">{subscriber.dueDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Amount</span>
          <span className="text-lg font-semibold">₱{subscriber.amount.toFixed(0)}</span>
        </div>
        {adjustmentLabel && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            {adjustmentLabel}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPay(subscriber.id)}
        disabled={["Paid", "Paid/Skipped"].includes(subscriber.status)}
        className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        Mark as Paid
      </button>
    </div>
  );
}
