const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Subscriber = require('../models/Subscriber');
const { processSubscriber } = require('../utils/logic');
const { getCurrentDate } = require('../config/time');

// Rate limiter: max 5 requests per minute per IP
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many requests, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Utility to mask middle name: "Juan Dela Cruz" -> "Juan D. Cruz"
const maskName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  if (parts.length === 2) return fullName; // Or "J. Cruz"? Let's stick to Juan Cruz

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleInitial = parts[1][0].toUpperCase();

  return `${firstName} ${middleInitial}. ${lastName}`;
};

router.get('/subscriber/:accountId', publicLimiter, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Strictly select only necessary fields
    const subscriber = await Subscriber.findOne({ accountId })
      .select('accountId name planName bandwidth isArchived payments remainingBalance cycle rate daysDown');

    if (!subscriber) {
      return res.status(404).json({ message: 'Account ID not found' });
    }

    // Use internal logic to get billing info
    const now = getCurrentDate();
    const processed = processSubscriber(subscriber, now);

    const lastPayment = subscriber.payments && subscriber.payments.length > 0
      ? subscriber.payments[subscriber.payments.length - 1]
      : null;

    const publicData = {
      accountId: subscriber.accountId,
      name: maskName(subscriber.name),
      planName: subscriber.planName,
      bandwidth: subscriber.bandwidth,
      status: subscriber.isArchived ? 'Disconnected' : 'Active',
      billingStatus: processed.status, // Extra useful info
      currentBalance: processed.remainingBalance,
      lastPaymentDate: lastPayment ? lastPayment.date : 'No payment records',
      nextDueDate: processed.dueDate
    };

    res.json(publicData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
