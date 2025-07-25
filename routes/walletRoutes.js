const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth.middleware');


router.get('/balance', auth, walletController.getBalance);
router.post('/add', auth, walletController.addMoney);
router.get('/transactions', auth, walletController.getTransactions);

module.exports = router;
