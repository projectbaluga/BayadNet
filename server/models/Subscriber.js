const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true }, // Base monthly rate
  cycle: { type: Number, required: true },
  daysDown: { type: Number, default: 0 },
  remainingBalance: { type: Number }, // Amount left to pay for the current month
  isPaidFeb2026: { type: Boolean, default: false },
  payments: [{
    amountPaid: Number,
    date: { type: Date, default: Date.now },
    referenceNo: String,
    receiptImage: String,
    month: { type: String, default: 'February 2026' }
  }]
});

// Default remainingBalance to rate if not provided (pre-save hook or manual)
subscriberSchema.pre('save', function(next) {
  if (this.isNew && this.remainingBalance === undefined) {
    this.remainingBalance = this.rate;
  }
  next();
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
