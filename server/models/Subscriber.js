const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  accountId: { type: String, required: true, unique: true },
  router: { type: mongoose.Schema.Types.ObjectId, ref: 'Router', default: null },
  pppoeUsername: { type: String, default: '' },
  street: { type: String, default: '' },
  address: { type: String, default: '' },
  region: { type: String, default: '' },
  province: { type: String, default: '' },
  city: { type: String, default: '' },
  barangay: { type: String, default: '' },
  regionCode: { type: String, default: '' },
  provinceCode: { type: String, default: '' },
  cityCode: { type: String, default: '' },
  psgc: { type: String, default: '' },
  planName: { type: String, default: 'Residential Plan' },
  bandwidth: { type: String, default: '50Mbps' },
  rate: { type: Number, required: true }, // Base monthly rate
  cycle: { type: Number, required: true },
  messengerId: { type: String, default: '' },
  contactNo: { type: String, default: '' },
  startDate: { type: Date, default: Date.now },
  daysDown: { type: Number, default: 0 },
  remainingBalance: { type: Number }, // Amount left to pay for the current month
  isArchived: { type: Boolean, default: false },
  issueStatus: { type: String, enum: ['Open', 'Resolved'], default: 'Resolved' },
  payments: [{
    amountPaid: Number,
    date: { type: Date, default: Date.now },
    referenceNo: String,
    receiptImage: String,
    month: { type: String }
  }],
  reports: [{
    reporterName: String,
    reporterRole: String,
    message: String,
    attachmentUrl: String,
    timestamp: { type: Date, default: Date.now },
    readBy: [{
      name: String,
      role: String,
      timestamp: { type: Date, default: Date.now }
    }]
  }]
}, { strict: false });

// Default remainingBalance to rate if not provided (pre-save hook or manual)
subscriberSchema.pre('save', function(next) {
  if (this.isNew && this.remainingBalance === undefined) {
    this.remainingBalance = this.rate;
  }
  next();
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
