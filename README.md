# TradingFast – Real-Time Trading Platform

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![SQLite](https://img.shields.io/badge/SQLite-3-blue)
![License](https://img.shields.io/badge/license-ISC-blue)

**TradingFast** is a complete, production-ready trading web application with real-time price engine, wallet system, deposit/withdrawal management, and an admin panel. Built with Node.js, Express, SQLite, and vanilla JavaScript.

![TradingFast Demo](https://via.placeholder.com/800x400?text=TradingFast+Demo)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based login & registration |
| 📈 **Real‑Time Trading** | UP/DOWN trades on 10+ assets |
| 🤖 **Price Engine** | Automatic price movements (every 3s) within min/max bounds |
| 💰 **Wallet System** | Balance tracking, win/loss recording |
| 🏦 **Deposits** | Request deposit with QR code, admin approval |
| 💸 **Withdrawals** | Request withdrawal with UPI details, admin approval |
| 📜 **Trade History** | Full history with win/loss indicators |
| 🛠️ **Admin Panel** | Manage users, trades, deposits, withdrawals, assets, settings |
| 📱 **Responsive** | Mobile‑first dark theme with neon accents |

---

## 🚀 Live Demo

- **Frontend App:** `https://your-app.onrender.com`
- **Admin Panel:** `https://your-app.onrender.com/admin`
- **Default Admin:** `admin` / `admin123`

---

## 📦 Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (lightweight, file‑based)
- **Frontend:** HTML5, CSS3, Vanilla JS
- **Charts:** Chart.js
- **Authentication:** JWT + bcrypt
- **Icons:** Font Awesome 6

---

## 📁 Project Structure
radingfast/
├── backend/
│ ├── server.js
│ ├── package.json
│ ├── routes/ (auth, trade, wallet, admin, deposit, withdraw)
│ ├── models/ (db, user, trade, asset, transaction)
│ ├── services/ (priceEngine, tradeEngine)
│ ├── middleware/ (authMiddleware)
│ └── config/
├── frontend/
│ ├── index.html
│ ├── style.css
│ ├── app.js
│ └── pages/ (terminal, trades, market, rewards, help, profile)
├── admin/
│ ├── index.html
│ ├── admin.css
│ └── admin.js
├── database/ (trading.db auto-created)
├── .env
├── render.yaml
├── requirements.txt
└── README.md

---

## 🛠️ Installation (Local)

### Prerequisites
- Node.js v14+ and npm

### Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/tradingfast.git
cd tradingfast

# Install backend dependencies
cd backend
npm install

# Create .env file (optional, defaults work)
cp ../.env.example .env   # or manually create

# Start the server
npm start

# For development with auto-reload
npm run dev