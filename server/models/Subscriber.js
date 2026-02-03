const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true },
  cycle: { type: Number, required: true },
  creditType: {
    type: String,
    enum: ['1 Month', '2 Weeks', 'None'],
    default: 'None'
  },
  isPaidFeb2026: { type: Boolean, default: false }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
