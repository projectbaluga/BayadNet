import React, { useEffect, useMemo, useState } from "react";
import SubscriberCard from "./components/SubscriberCard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/subscribers`);
      if (!response.ok) {
        throw new Error("Failed to load subscribers");
      }
      const payload = await response.json();
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handlePay = async (id) => {
    try {
      await fetch(`${API_URL}/api/subscribers/${id}/pay`, { method: "POST" });
      await fetchSubscribers();
    } catch (err) {
      setError("Unable to mark payment");
    }
  };

  const summaryCards = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Due Today", value: data.totals.dueToday, accent: "bg-amber-500" },
      { label: "Overdue", value: data.totals.overdue, accent: "bg-rose-500" },
      {
        label: "Total Collections",
        value: `₱${data.totals.totalCollections.toFixed(0)}`,
        accent: "bg-emerald-500"
      }
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <header className="px-6 pb-6 pt-10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">BayadNet</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Internet Subscriber Management
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Current period: {data?.currentDate || "2026-02"}
        </p>
      </header>

      <section className="px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{card.label}</span>
                <span className={`h-2 w-2 rounded-full ${card.accent}`} />
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Subscribers</h2>
          <button
            type="button"
            onClick={fetchSubscribers}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
            Loading subscribers...
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {data?.subscribers?.map((subscriber) => (
            <SubscriberCard
              key={subscriber.id}
              subscriber={subscriber}
              onPay={handlePay}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
