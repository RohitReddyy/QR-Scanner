const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const frontdeskUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'frontdesk',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Compare a plain-text password against the stored hash.
 */
frontdeskUserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('FrontdeskUser', frontdeskUserSchema);
