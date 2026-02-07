const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

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

// Encrypt Password if modified
routerSchema.pre('save', function(next) {
  if (this.isModified('password') && this.password) {
      this.password = encrypt(this.password);
  }
  next();
});

// Helper to get decrypted password
routerSchema.methods.getDecryptedPassword = function() {
    return decrypt(this.password);
};

module.exports = mongoose.model('Router', routerSchema);
