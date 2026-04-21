const { db } = require('./db');

const TradeModel = {
  create: (userId, assetId, amount, direction, duration, startPrice) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO trades (user_id, asset_id, amount, direction, duration, start_price, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, assetId, amount, direction, duration, startPrice],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, assetId, amount, direction, duration, startPrice, status: 'pending' });
        }
      );
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trades WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findByUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.*, a.name as asset_name, a.symbol 
         FROM trades t 
         JOIN assets a ON t.asset_id = a.id 
         WHERE t.user_id = ? 
         ORDER BY t.created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  updateTradeResult: (tradeId, endPrice, result, profit) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE trades 
         SET end_price = ?, status = 'closed', result = ?, profit = ?, closed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [endPrice, result, profit, tradeId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  getPendingTrades: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM trades WHERE status = "pending"', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getAllTrades: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT t.*, u.username, a.name as asset_name, a.symbol
         FROM trades t
         JOIN users u ON t.user_id = u.id
         JOIN assets a ON t.asset_id = a.id
         ORDER BY t.created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
};

module.exports = TradeModel;