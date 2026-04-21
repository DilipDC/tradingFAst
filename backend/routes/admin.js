const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const UserModel = require('../models/userModel');
const TradeModel = require('../models/tradeModel');
const AssetModel = require('../models/assetModel');
const TransactionModel = require('../models/transactionModel');
const { db } = require('../models/db');

// Admin middleware - check if user is admin (username 'admin')
router.use(authMiddleware);
router.use(async (req, res, next) => {
  const user = await UserModel.findById(req.user.userId);
  if (user && user.username === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all trades
router.get('/trades', async (req, res) => {
  try {
    const trades = await TradeModel.getAllTrades();
    res.json({ trades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all deposits
router.get('/deposits', async (req, res) => {
  try {
    const deposits = await TransactionModel.getDeposits();
    res.json({ deposits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve deposit
router.post('/deposits/:id/approve', async (req, res) => {
  try {
    const depositId = req.params.id;
    const deposits = await TransactionModel.getDeposits();
    const deposit = deposits.find(d => d.id == depositId);
    
    if (!deposit || deposit.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid deposit' });
    }
    
    await TransactionModel.updateDepositStatus(depositId, 'approved');
    await UserModel.addBalance(deposit.user_id, deposit.amount);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject deposit
router.post('/deposits/:id/reject', async (req, res) => {
  try {
    const depositId = req.params.id;
    await TransactionModel.updateDepositStatus(depositId, 'rejected');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await TransactionModel.getWithdrawals();
    res.json({ withdrawals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve withdrawal
router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    const withdrawals = await TransactionModel.getWithdrawals();
    const withdrawal = withdrawals.find(w => w.id == withdrawalId);
    
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid withdrawal' });
    }
    
    // Deduct balance if not already deducted
    await UserModel.deductBalance(withdrawal.user_id, withdrawal.amount);
    await TransactionModel.updateWithdrawalStatus(withdrawalId, 'approved');
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject withdrawal
router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    await TransactionModel.updateWithdrawalStatus(withdrawalId, 'rejected');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update asset min/max prices
router.put('/assets/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const { min_price, max_price } = req.body;
    
    if (min_price >= max_price) {
      return res.status(400).json({ error: 'Min price must be less than max price' });
    }
    
    await AssetModel.updateMinMax(assetId, min_price, max_price);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all assets
router.get('/assets', async (req, res) => {
  try {
    const assets = await AssetModel.getAll();
    res.json({ assets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin settings
router.post('/settings', async (req, res) => {
  try {
    const { deposit_enabled, withdraw_enabled, profit_percentage } = req.body;
    
    if (deposit_enabled !== undefined) {
      await db.run('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)', ['deposit_enabled', deposit_enabled.toString()]);
    }
    if (withdraw_enabled !== undefined) {
      await db.run('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)', ['withdraw_enabled', withdraw_enabled.toString()]);
    }
    if (profit_percentage !== undefined) {
      await db.run('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)', ['profit_percentage', profit_percentage.toString()]);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get admin settings
router.get('/settings', async (req, res) => {
  try {
    const settings = {};
    const rows = await new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM admin_settings', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    rows.forEach(row => {
      if (row.value === 'true') settings[row.key] = true;
      else if (row.value === 'false') settings[row.key] = false;
      else settings[row.key] = row.value;
    });
    res.json({ settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;