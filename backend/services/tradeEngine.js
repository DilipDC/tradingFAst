const TradeModel = require('../models/tradeModel');
const AssetModel = require('../models/assetModel');
const UserModel = require('../models/userModel');
const { db } = require('../models/db');

async function getProfitPercentage() {
  return new Promise((resolve) => {
    db.get('SELECT value FROM admin_settings WHERE key = "profit_percentage"', (err, row) => {
      if (err || !row) resolve(80);
      else resolve(parseInt(row.value));
    });
  });
}

async function settleTrade(trade) {
  try {
    const asset = await AssetModel.findById(trade.asset_id);
    if (!asset) return;

    const endPrice = asset.price;
    let result = null;
    let profit = 0;

    // Determine win/loss
    if (trade.direction === 'UP') {
      result = endPrice > trade.start_price ? 'win' : 'loss';
    } else if (trade.direction === 'DOWN') {
      result = endPrice < trade.start_price ? 'win' : 'loss';
    }

    if (result === 'win') {
      const profitPercent = await getProfitPercentage();
      profit = trade.amount * (profitPercent / 100);
      // Add stake + profit to user balance
      await UserModel.addBalance(trade.user_id, trade.amount + profit);
    } else if (result === 'loss') {
      profit = -trade.amount;
      // Amount already deducted at trade creation, no further action
    }

    await TradeModel.updateTradeResult(trade.id, endPrice, result, profit);
    console.log(`[TradeEngine] Trade ${trade.id} settled: ${result}, profit: ${profit}`);
  } catch (err) {
    console.error(`[TradeEngine] Error settling trade ${trade.id}:`, err);
  }
}

async function checkAndSettlePendingTrades() {
  try {
    const trades = await TradeModel.getPendingTrades();
    const now = Date.now();
    
    for (const trade of trades) {
      const tradeTime = new Date(trade.created_at).getTime();
      const elapsed = (now - tradeTime) / 1000; // seconds
      
      if (elapsed >= trade.duration) {
        await settleTrade(trade);
      }
    }
  } catch (err) {
    console.error('[TradeEngine] Error checking pending trades:', err);
  }
}

let settlementInterval = null;

function startTradeEngine() {
  if (settlementInterval) clearInterval(settlementInterval);
  settlementInterval = setInterval(checkAndSettlePendingTrades, 2000);
  console.log('[TradeEngine] Started');
}

function stopTradeEngine() {
  if (settlementInterval) {
    clearInterval(settlementInterval);
    settlementInterval = null;
    console.log('[TradeEngine] Stopped');
  }
}

module.exports = { startTradeEngine, stopTradeEngine, settleTrade };