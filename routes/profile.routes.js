const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware'); 


router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({      
      phone: user.phone,
      name: user.name || '',
      email: user.email || '',
      dob: user.dob || '',
      age: user.age || '',      
    });
  } catch (err) {
    console.error("❌ GET /profile error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});



// ✅ UPDATE Profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, dob, age } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (dob) user.dob = dob;
    if (age) user.age = age;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        dob: user.dob,
        age: user.age,
      }
    });
  } catch (err) {
    console.error("❌ PUT /profile error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
