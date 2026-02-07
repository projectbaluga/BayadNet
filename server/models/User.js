const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { DEFAULT_PERMISSIONS, PERMISSIONS } = require('../config/permissions');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'technician'], default: 'admin' },
  permissions: { type: Map, of: Boolean, default: {} }
});

userSchema.set('toJSON', { flattenMaps: true });
userSchema.set('toObject', { flattenMaps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getEffectivePermissions = function() {
  const roleDefaults = DEFAULT_PERMISSIONS[this.role] || {};
  const effective = { ...roleDefaults };

  if (this.permissions) {
    // If flattened, this.permissions might be an object?
    // Mongoose maps act like Maps in JS.
    if (this.permissions instanceof Map) {
        this.permissions.forEach((value, key) => {
            effective[key] = value;
        });
    } else if (typeof this.permissions === 'object') {
        Object.keys(this.permissions).forEach(key => {
            effective[key] = this.permissions[key];
        });
    }
  }
  return effective;
};

userSchema.methods.hasPermission = function(permissionName) {
  const effective = this.getEffectivePermissions();
  return effective[permissionName] === true;
};

module.exports = mongoose.model('User', userSchema);
