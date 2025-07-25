const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  otp: String,
  otpExpiresAt: Date,
  fcm_token: String,
  isVerified: { type: Boolean, default: false },
  pin: String,
  email: String,
  dob: String,
  age: String,

  wallet: {
    balance: { type: Number, default: 0 }, 
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
  }
});

module.exports = mongoose.model('User', userSchema);
