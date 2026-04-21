require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trade');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const depositRoutes = require('./routes/deposit');
const withdrawRoutes = require('./routes/withdraw');

const { initDatabase } = require('./models/db');
const { startPriceEngine } = require('./services/priceEngine');
const { startTradeEngine } = require('./services/tradeEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdraw', withdrawRoutes);

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Initialize database and start engines
initDatabase().then(() => {
  startPriceEngine();
  startTradeEngine();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
