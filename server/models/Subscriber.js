const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true },
  cycle: { type: Number, required: true },
  daysDown: { type: Number, default: 0 },
  isPaidFeb2026: { type: Boolean, default: false }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
