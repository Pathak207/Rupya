const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const JWT_SECRET = 'your_secret_key';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

var admin = require("firebase-admin");

const fs = require('fs');
const path = require('path');

const firebaseFilePath = path.join(__dirname, '../firebase_service_account.json');

if (!fs.existsSync(firebaseFilePath)) {
  const base64 = process.env.FIREBASE_CONFIG_BASE64;
  if (!base64) {
    throw new Error("FIREBASE_CONFIG_BASE64 not set in environment variables");
  }
  const jsonContent = Buffer.from(base64, 'base64').toString('utf-8');
  fs.writeFileSync(firebaseFilePath, jsonContent);
}

const serviceAccount = require(firebaseFilePath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function sendPushNotification(fcmToken, title, body) {
  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}


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
  const { userId, pin, confirmPin,fcmToken} = req.body;

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
    
    if (fcmToken) {
      user.fcm_token = fcmToken;
      await user.save();
      sendPushNotification(user.fcm_token, 'Welcome!', 'PIN set successfully. Enjoy using Rupay.');
    }


    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    
    res.status(200).json({
      message: 'PIN set successfully',
      pin,
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
  const { userId, pin, fcmToken } = req.body;

  if (!userId || !pin)
    return res.status(400).json({ message: 'User ID and PIN are required' });

  try {
    const user = await User.findById(userId);

    if (!user || !user.pin)
      return res.status(400).json({ message: 'User not found Please Sign Up first' });

    const isMatch = await bcrypt.compare(pin, user.pin);

    if (!isMatch)
      return res.status(400).json({ message: 'PIN is incorrect' });

    if (fcmToken) {
      user.fcm_token = fcmToken;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    
   if (user.fcm_token) {
    sendPushNotification(
      user.fcm_token,
      'Welcome!',
      'Login successful. Enjoy using Rupay.'
    );
  }

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
