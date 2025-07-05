const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  otp: String,
  otpExpiresAt: Date,
});

module.exports = mongoose.model('User', userSchema);

