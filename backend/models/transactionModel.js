const { db } = require('./db');

const TransactionModel = {
  // Deposit transactions
  createDeposit: (userId, amount, qrCode) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO deposits (user_id, amount, qr_code, status) VALUES (?, ?, ?, "pending")',
        [userId, amount, qrCode],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, amount, status: 'pending' });
        }
      );
    });
  },

  getDeposits: (userId = null) => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT d.*, u.username 
        FROM deposits d
        JOIN users u ON d.user_id = u.id
      `;
      let params = [];
      if (userId) {
        query += ' WHERE d.user_id = ?';
        params.push(userId);
      }
      query += ' ORDER BY d.created_at DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  updateDepositStatus: (depositId, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE deposits SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, depositId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  // Withdrawal transactions
  createWithdrawal: (userId, amount, upiId, accountName) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO withdrawals (user_id, amount, upi_id, account_name, status) VALUES (?, ?, ?, ?, "pending")',
        [userId, amount, upiId, accountName],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, amount, status: 'pending' });
        }
      );
    });
  },

  getWithdrawals: (userId = null) => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT w.*, u.username 
        FROM withdrawals w
        JOIN users u ON w.user_id = u.id
      `;
      let params = [];
      if (userId) {
        query += ' WHERE w.user_id = ?';
        params.push(userId);
      }
      query += ' ORDER BY w.created_at DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  updateWithdrawalStatus: (withdrawalId, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE withdrawals SET status = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, withdrawalId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
};

module.exports = TransactionModel;