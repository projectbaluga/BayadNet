const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema({
  monthYear: { type: String, required: true }, // e.g. "February 2026"
  totalExpected: Number,
  totalCollected: Number,
  totalProfit: Number,
  subscriberCount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MonthlyReport', monthlyReportSchema);
