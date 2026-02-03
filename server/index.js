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

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const createDueDate = (cycleDay) => {
  const year = CURRENT_DATE.getFullYear();
  const monthIndex = CURRENT_DATE.getMonth();
  const maxDay = daysInMonth(year, monthIndex);
  const safeDay = Math.min(cycleDay, maxDay);
  return new Date(Date.UTC(year, monthIndex, safeDay));
};

const applyCreditAdjustment = (subscriber, baseDueDate) => {
  if (subscriber.creditType !== "two_weeks" || subscriber.creditAppliedMonth !== CURRENT_MONTH) {
    return {
      adjustedDueDate: baseDueDate,
      adjustedAmount: subscriber.rate,
      adjustment: "none"
    };
  }

  const dueDay = baseDueDate.getUTCDate();
  if (dueDay <= 14) {
    const adjustedDueDate = new Date(baseDueDate);
    adjustedDueDate.setUTCDate(adjustedDueDate.getUTCDate() + 14);
    return {
      adjustedDueDate,
      adjustedAmount: subscriber.rate,
      adjustment: "extended_due_date"
    };
  }

  return {
    adjustedDueDate: baseDueDate,
    adjustedAmount: subscriber.rate * 0.5,
    adjustment: "half_off"
  };
};

const resolveStatus = (subscriber, adjustedDueDate) => {
  if (subscriber.creditType === "one_month" && subscriber.creditAppliedMonth === CURRENT_MONTH) {
    return "Paid/Skipped";
  }

  const payment = subscriber.payments.find((entry) => entry.month === CURRENT_MONTH);
  if (payment) {
    return "Paid";
  }

  const currentDate = new Date(Date.UTC(
    CURRENT_DATE.getUTCFullYear(),
    CURRENT_DATE.getUTCMonth(),
    CURRENT_DATE.getUTCDate()
  ));
  const dueDate = new Date(Date.UTC(
    adjustedDueDate.getUTCFullYear(),
    adjustedDueDate.getUTCMonth(),
    adjustedDueDate.getUTCDate()
  ));

  if (currentDate.getTime() === dueDate.getTime()) {
    return "Due Today";
  }

  if (currentDate > dueDate) {
    return "Overdue";
  }

  return "Due";
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const mapSubscriber = (subscriber) => {
  const baseDueDate = createDueDate(subscriber.cycleDay);
  const credit = applyCreditAdjustment(subscriber, baseDueDate);
  const status = resolveStatus(subscriber, credit.adjustedDueDate);

  const amount = status === "Paid/Skipped" ? 0 : credit.adjustedAmount;

  return {
    id: subscriber._id,
    name: subscriber.name,
    rate: subscriber.rate,
    cycleDay: subscriber.cycleDay,
    status,
    dueDate: formatDate(credit.adjustedDueDate),
    amount,
    adjustment: credit.adjustment,
    creditType: subscriber.creditType
  };
};

app.get("/api/subscribers", async (req, res) => {
  const subscribers = await Subscriber.find({}).sort({ cycleDay: 1, name: 1 });
  const data = subscribers.map(mapSubscriber);

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
