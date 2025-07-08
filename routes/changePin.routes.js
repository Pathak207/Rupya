const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const JWT_SECRET = 'your_secret_key';
 

router.post('/', authMiddleware, async (req, res) => {
  const { oldPin, newPin, confirmPin } = req.body;
  const userId = req.user.userId;

  if (!oldPin || !newPin || !confirmPin)
    return res.status(400).json({ message: 'All fields are required' });

  if (newPin !== confirmPin)
    return res.status(400).json({ message: 'New PINs do not match' });

  if (!/^\d{4}$/.test(newPin))
    return res.status(400).json({ message: 'New PIN must be 4 digits' });

  try {
    const user = await User.findById(userId);

    if (!user || !user.pin) {
      return res.status(404).json({ message: 'User not found or PIN not set' });
    }

    const isMatch = await bcrypt.compare(oldPin, user.pin);

    if (!isMatch) {
      return res.status(400).json({ message: 'Old PIN is incorrect' });
    }

    user.pin = await bcrypt.hash(newPin, 10);
    await user.save();

    return res.status(200).json({ message: 'PIN changed successfully' });

  } catch (err) {
    console.error('❌ change-pin error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
