const mongoose = require('mongoose');

const routerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, default: 8728 },
  username: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastChecked: { type: Date },
  status: { type: String, enum: ['Online', 'Offline', 'Unknown'], default: 'Unknown' }
});

module.exports = mongoose.model('Router', routerSchema);
