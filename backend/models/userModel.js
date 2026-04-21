const { db } = require('./db');
const bcrypt = require('bcryptjs');

const UserModel = {
  create: (username, password) => {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.run(
        'INSERT INTO users (username, password, balance) VALUES (?, ?, ?)',
        [username, hashedPassword, 0],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, balance: 0 });
        }
      );
    });
  },

  findByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, balance, level, xp, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updateBalance: (userId, newBalance) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  addBalance: (userId, amount) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  deductBalance: (userId, amount) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?', [amount, userId, amount], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  getAllUsers: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, balance, level, xp, created_at FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = UserModel;