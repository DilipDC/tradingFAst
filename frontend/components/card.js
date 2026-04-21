/* Card Component Styles */
.trading-card {
  background: #111118;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.trading-card-glass {
  background: rgba(20, 20, 30, 0.7);
  backdrop-filter: blur(10px);
}

.trading-card-gradient {
  background: linear-gradient(135deg, #1a1a2a, #0f0f18);
}

.trading-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 255, 136, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.card-icon {
  margin-bottom: 12px;
}

.card-icon i {
  font-size: 24px;
  color: #00ff88;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #fff;
}

.card-subtitle {
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
}

.card-body {
  margin-top: 8px;
}