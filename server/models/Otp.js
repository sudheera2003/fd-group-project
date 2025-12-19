const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  // This field controls the expiration
  createdAt: { type: Date, default: Date.now, expires: 300 } // 300 seconds = 5 minutes
});

module.exports = mongoose.model('Otp', OtpSchema);