const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const TransactionModel = require('../models/transactionModel');
const UserModel = require('../models/userModel');
const { db } = require('../models/db');

// Check if withdrawals are enabled
async function isWithdrawEnabled() {
  return new Promise((resolve) => {
    db.get('SELECT value FROM admin_settings WHERE key = "withdraw_enabled"', (err, row) => {
      if (err || !row) resolve(true);
      else resolve(row.value === 'true');
    });
  });
}

// Create a withdrawal request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { amount, upiId, accountName } = req.body;
    const userId = req.user.userId;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
    }

    if (!upiId || !accountName) {
      return res.status(400).json({ error: 'UPI ID and account name are required' });
    }

    const withdrawEnabled = await isWithdrawEnabled();
    if (!withdrawEnabled) {
      return res.status(400).json({ error: 'Withdrawals are currently disabled by admin' });
    }

    const user = await UserModel.findById(userId);
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal request (balance will be deducted upon admin approval)
    const withdrawal = await TransactionModel.createWithdrawal(userId, amount, upiId, accountName);

    res.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        upiId,
        accountName,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's withdrawal history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const withdrawals = await TransactionModel.getWithdrawals(userId);
    res.json({ withdrawals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get withdrawal status by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    const userId = req.user.userId;
    const withdrawals = await TransactionModel.getWithdrawals(userId);
    const withdrawal = withdrawals.find(w => w.id == withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    res.json({ withdrawal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;