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
  address: String,
  aadhar: String,
  profileImage: { type: String },

  deviceInfo: {
    deviceId: String,
    model: String,
    manufacturer: String,
  },
  
  wallet: {
    balance: { type: Number, default: 0 }, 
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
  },

  savedPaymentMethods: [
    {
      method: { type: String, enum: ['UPI', 'BANK', 'CARD'], required: true },
      label: { type: String },
      details: {}
    }
  ]

});

module.exports = mongoose.model('User', userSchema);
