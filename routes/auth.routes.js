const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const JWT_SECRET = 'your_secret_key';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number required' });
  }

  try {
    const existingUser = await User.findOne({ phone });

    
    if (existingUser && existingUser.pin) {
      return res.status(409).json({
        message: 'User already exists. Please sign in or use a different number.'
      });
    }


    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    let user;

    if (!existingUser) {
      user = new User({ phone, otp, otpExpiresAt: expiry });
    } else {
      
      user = existingUser;
      user.otp = otp;
      user.otpExpiresAt = expiry;
    }

    await user.save();

    console.log(`OTP for ${phone}: ${otp}`);
    console.log(`User ID: ${user._id}`);

    res.status(200).json({
      message: 'OTP sent successfully',
      otp,
      userId: user._id,
      phone: user.phone
    });

  } catch (err) {
    console.error("❌ send-otp error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp)
    return res.status(400).json({ message: 'OTP is required' });

  try {
    const user = await User.findById(userId);

    if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully. Please set your PIN.', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



const bcrypt = require('bcryptjs');

router.post('/set-pin', async (req, res) => {
  const { userId, pin, confirmPin } = req.body;

  if (!userId || !pin || !confirmPin)
    return res.status(400).json({ message: 'All fields are required' });

  if (pin !== confirmPin)
    return res.status(400).json({ message: 'PINs do not match' });

  if (!/^\d{6}$/.test(pin))
    return res.status(400).json({ message: 'PIN must be 6 digits' });

  try {
    const user = await User.findById(userId);

    if (!user || !user.isVerified)
      return res.status(400).json({ message: 'User not verified or not found' });

    user.pin = await bcrypt.hash(pin, 10);
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'PIN set successfully',
      token,
    });

  } catch (err) {
    console.error('❌ set-pin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.post('/check-user', async (req, res) => {
  const {phone } = req.body;

  if (!phone)
    return res.status(400).json({ message: 'Phone number is required' });

  try {
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }

    return res.status(200).json({ message: 'User found', userId: user._id });
  } catch (err) {
    console.error('❌ check-user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.post('/login', async (req, res) => {
  const { userId, pin } = req.body;

  if (!userId || !pin)
    return res.status(400).json({ message: 'User ID and PIN are required' });

  try {
    const user = await User.findById(userId);

    if (!user || !user.pin)
      return res.status(400).json({ message: 'User not found Please Sign Up first' });

    const isMatch = await bcrypt.compare(pin, user.pin);

    if (!isMatch)
      return res.status(400).json({ message: 'PIN is incorrect' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
