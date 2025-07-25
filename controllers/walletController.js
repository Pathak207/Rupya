const User = require('../models/User');
const Transaction = require('../models/Transaction');
const sendPushNotification = require('../utils/sendPushNotification');


exports.addMoney = async (req, res) => {
  try {
    const { amount, method, description } = req.body;
    const userId = req.user.id || req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wallet.balance += amount;

    const transaction = await Transaction.create({
      userId: user._id,
      type: 'CREDIT',
      amount,
      method,
      description,
    });

    user.wallet.transactions.push(transaction._id);
    await user.save();

    if (user.fcm_token) {
      sendPushNotification(
        user.fcm_token,
        '💰 Money Added',
        `₹${amount} added via ${method}. Description: ${description}`
      );
    }

    res.status(200).json({
      success: true,
      newBalance: user.wallet.balance,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Add Money Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId; 
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ balance: user.wallet.balance });
  } catch (error) {
    console.error('Get Balance Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
