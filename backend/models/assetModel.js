const { db } = require('./db');

const AssetModel = {
  getAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM assets ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM assets WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findBySymbol: (symbol) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM assets WHERE symbol = ?', [symbol], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updatePrice: (assetId, newPrice) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE assets SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPrice, assetId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  updateMinMax: (assetId, minPrice, maxPrice) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE assets SET min_price = ?, max_price = ? WHERE id = ?',
        [minPrice, maxPrice, assetId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  getPrice: (assetId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT price FROM assets WHERE id = ?', [assetId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.price : null);
      });
    });
  }
};

module.exports = AssetModel;