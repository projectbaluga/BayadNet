const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  defaultRate: { type: Number, default: 500 },
  rebateValue: { type: Number, default: 30 } // Default to 30 days divisor
});

module.exports = mongoose.model('Setting', settingSchema);
