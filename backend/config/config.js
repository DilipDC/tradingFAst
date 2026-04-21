require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key_change_me',
  dbPath: process.env.DB_PATH || './database/trading.db',
  priceEngineInterval: parseInt(process.env.PRICE_ENGINE_INTERVAL) || 3000,
  tradeSettlementInterval: parseInt(process.env.TRADE_SETTLEMENT_INTERVAL) || 2000,
  defaultProfitPercentage: parseInt(process.env.DEFAULT_PROFIT_PERCENTAGE) || 80,
  minTradeAmount: parseInt(process.env.MIN_TRADE_AMOUNT) || 100,
  minDepositAmount: parseInt(process.env.MIN_DEPOSIT_AMOUNT) || 100,
  minWithdrawAmount: parseInt(process.env.MIN_WITHDRAW_AMOUNT) || 100
};