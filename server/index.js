require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Subscriber = require("./models/Subscriber");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bayadnet";
const CURRENT_DATE = new Date(process.env.CURRENT_DATE || "2026-02-15");
const CURRENT_MONTH = "2026-02";

const { formatDate, mapSubscriber } = require("./lib/billing");

app.get("/api/subscribers", async (req, res) => {
  const subscribers = await Subscriber.find({}).sort({ cycleDay: 1, name: 1 });
  const data = subscribers.map((subscriber) => mapSubscriber(subscriber, CURRENT_DATE, CURRENT_MONTH));

  const totals = data.reduce(
    (acc, item) => {
      if (item.status === "Due Today") acc.dueToday += 1;
      if (item.status === "Overdue") acc.overdue += 1;
      if (["Due", "Due Today", "Overdue"].includes(item.status)) {
        acc.totalCollections += item.amount;
      }
      return acc;
    },
    { dueToday: 0, overdue: 0, totalCollections: 0 }
  );

  res.json({ currentDate: formatDate(CURRENT_DATE), totals, subscribers: data });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/subscribers/:id/pay", async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);
  if (!subscriber) {
    return res.status(404).json({ error: "Subscriber not found" });
  }

  if (!subscriber.payments.find((entry) => entry.month === CURRENT_MONTH)) {
    subscriber.payments.push({ month: CURRENT_MONTH, paidAt: new Date() });
    await subscriber.save();
  }

  return res.json({ message: "Payment recorded" });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
