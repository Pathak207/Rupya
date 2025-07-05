const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const JWT_SECRET = 'your_secret_key';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: 'Phone number required' });

  try {
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, otp, otpExpiresAt: expiry });
    } else {
      user.otp = otp;
      user.otpExpiresAt = expiry;
    }

    await user.save();

    console.log(`✅ OTP for ${phone}: ${otp}`);
    console.log(`✅ User ID: ${user._id}`);

    res.status(200).json({
      message: 'OTP sent successfully',
      otp,
      userId: user._id
    });

  } catch (err) {
    console.error("❌ send-otp error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});





// ✅ Step 2: Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  const { userId, otp, phone } = req.body;

  if (!userId || !otp || !phone)
    return res.status(400).json({ message: 'userId, OTP and phone are required' });

  try {
    const user = await User.findById(userId);

    if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

   
    user.phone = phone;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
