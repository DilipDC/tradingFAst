-- Trading App Database Schema
-- SQLite

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  price REAL NOT NULL,
  min_price REAL NOT NULL,
  max_price REAL NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  direction TEXT NOT NULL,
  duration INTEGER NOT NULL,
  start_price REAL NOT NULL,
  end_price REAL,
  status TEXT DEFAULT 'pending',
  result TEXT,
  profit REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(asset_id) REFERENCES assets(id)
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  qr_code TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  upi_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default assets
INSERT OR IGNORE INTO assets (name, symbol, price, min_price, max_price) VALUES
('Apple Inc.', 'AAPL', 175.50, 150.00, 200.00),
('Microsoft', 'MSFT', 330.25, 300.00, 360.00),
('Amazon', 'AMZN', 145.80, 120.00, 170.00),
('Google', 'GOOGL', 140.20, 120.00, 160.00),
('Tesla', 'TSLA', 240.30, 200.00, 280.00),
('Meta', 'META', 310.15, 280.00, 350.00),
('Netflix', 'NFLX', 480.50, 400.00, 550.00),
('NVIDIA', 'NVDA', 890.75, 700.00, 1000.00),
('AMD', 'AMD', 160.40, 140.00, 190.00),
('PayPal', 'PYPL', 65.20, 55.00, 80.00);

-- Insert default admin settings
INSERT OR IGNORE INTO admin_settings (key, value) VALUES
('deposit_enabled', 'true'),
('withdraw_enabled', 'true'),
('profit_percentage', '80');

-- Insert default admin user (username: admin, password: admin123)
-- Password hash is bcrypt of 'admin123'
INSERT OR IGNORE INTO users (username, password, balance) VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqIqD8qXqKJqZqXqKqJqZqXqKqJq', 0);