const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  otp: String,
  otpExpiresAt: Date,
  isVerified: { type: Boolean, default: false },
  pin: String,
  email: String,     
  dob: String,       
  age: String
});

module.exports = mongoose.model('User', userSchema);

