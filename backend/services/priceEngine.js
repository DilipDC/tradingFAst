const AssetModel = require('../models/assetModel');

let priceInterval = null;

// Generate random movement between -0.5% and +0.5%
function getPriceChange(currentPrice, minPrice, maxPrice) {
  // Random factor between -0.005 and 0.005 (-0.5% to +0.5%)
  const changePercent = (Math.random() - 0.5) * 0.01;
  let newPrice = currentPrice * (1 + changePercent);
  
  // Clamp to min/max bounds
  newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
  
  // Add small random walk tendency
  const randomWalk = (Math.random() - 0.5) * 0.002 * currentPrice;
  newPrice += randomWalk;
  newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
  
  return parseFloat(newPrice.toFixed(4));
}

async function updateAllPrices() {
  try {
    const assets = await AssetModel.getAll();
    
    for (const asset of assets) {
      const newPrice = getPriceChange(asset.price, asset.min_price, asset.max_price);
      await AssetModel.updatePrice(asset.id, newPrice);
    }
    
    console.log(`[PriceEngine] Prices updated at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error('[PriceEngine] Error updating prices:', err);
  }
}

function startPriceEngine(intervalMs = 3000) {
  if (priceInterval) {
    clearInterval(priceInterval);
  }
  priceInterval = setInterval(updateAllPrices, intervalMs);
  console.log(`[PriceEngine] Started with interval ${intervalMs}ms`);
}

function stopPriceEngine() {
  if (priceInterval) {
    clearInterval(priceInterval);
    priceInterval = null;
    console.log('[PriceEngine] Stopped');
  }
}

module.exports = { startPriceEngine, stopPriceEngine, updateAllPrices };