const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const TradeModel = require('../models/tradeModel');
const AssetModel = require('../models/assetModel');
const UserModel = require('../models/userModel');

// Create a new trade
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { assetId, amount, direction, duration } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!assetId || !amount || !direction || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum trade amount is ₹100' });
    }

    if (!['UP', 'DOWN'].includes(direction)) {
      return res.status(400).json({ error: 'Direction must be UP or DOWN' });
    }

    const validDurations = [10, 60, 120];
    if (!validDurations.includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    const asset = await AssetModel.findById(assetId);
    if (!asset) {
      return res.status(400).json({ error: 'Invalid asset' });
    }

    const user = await UserModel.findById(userId);
    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const deducted = await UserModel.deductBalance(userId, amount);
    if (deducted === 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const startPrice = asset.price;
    const trade = await TradeModel.create(userId, assetId, amount, direction, duration, startPrice);

    res.json({
      success: true,
      trade: {
        id: trade.id,
        assetId,
        amount,
        direction,
        duration,
        startPrice,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's trade history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trades = await TradeModel.findByUser(userId);
    res.json({ trades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single trade details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const userId = req.user.userId;
    
    const trade = await TradeModel.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    if (trade.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const asset = await AssetModel.findById(trade.asset_id);
    trade.asset_name = asset ? asset.name : null;
    trade.asset_symbol = asset ? asset.symbol : null;
    
    res.json({ trade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;