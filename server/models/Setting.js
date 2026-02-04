const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  defaultRate: { type: Number, default: 500 },
  rebateValue: { type: Number, default: 30 }, // Default to 30 days divisor
  providerCost: { type: Number, default: 0 }
});

module.exports = mongoose.model('Setting', settingSchema);
