const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const TransactionModel = require('../models/transactionModel');
const { db } = require('../models/db');

// Check if deposits are enabled
async function isDepositEnabled() {
  return new Promise((resolve) => {
    db.get('SELECT value FROM admin_settings WHERE key = "deposit_enabled"', (err, row) => {
      if (err || !row) resolve(true);
      else resolve(row.value === 'true');
    });
  });
}

// Create a deposit request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum deposit amount is ₹100' });
    }

    const depositEnabled = await isDepositEnabled();
    if (!depositEnabled) {
      return res.status(400).json({ error: 'Deposits are currently disabled by admin' });
    }

    // Generate QR code URL (using free API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Deposit_${userId}_${Date.now()}_${amount}`;

    const deposit = await TransactionModel.createDeposit(userId, amount, qrCodeUrl);

    res.json({
      success: true,
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        qrCode: qrCodeUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's deposit history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deposits = await TransactionModel.getDeposits(userId);
    res.json({ deposits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get deposit status by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const depositId = req.params.id;
    const userId = req.user.userId;
    const deposits = await TransactionModel.getDeposits(userId);
    const deposit = deposits.find(d => d.id == depositId);
    
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    
    res.json({ deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;