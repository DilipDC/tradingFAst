// Rewards Page Component (TradingFast)
class RewardsPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onPromoCodeClick: null,
      ...options
    };
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    
    this.element.innerHTML = `
      <h2 style="margin-bottom: 20px;">TradingFast Rewards</h2>
      
      <div class="reward-card">
        <h3>🎉 Welcome Bonus</h3>
        <p>Use code: <strong>WELCOME</strong> on first deposit</p>
        <div class="promo-code">UP TO 100%</div>
      </div>
      
      <div class="reward-card">
        <h3>💎 Special Promo</h3>
        <p>Use code: <strong>ONAPA</strong> when depositing USD</p>
        <div class="promo-code">EXTRA 50%</div>
      </div>
      
      <div class="reward-card">
        <h3>🏆 Referral Program</h3>
        <p>Invite friends and earn ₹500 per referral</p>
        <div class="promo-code" id="referral-code" style="cursor: pointer;">TRADINGFAST_${Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
      </div>
      
      <div class="glass-card" style="padding: 20px; margin-top: 20px;">
        <h3>Leaderboard</h3>
        <div style="margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <span>🥇 #1 Trader</span>
            <span style="color: #00ff88;">+₹12,450</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <span>🥈 #2 Trader</span>
            <span style="color: #00ff88;">+₹8,230</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>🥉 #3 Trader</span>
            <span style="color: #00ff88;">+₹5,670</span>
          </div>
        </div>
      </div>
      
      <div class="glass-card" style="padding: 20px; margin-top: 20px;">
        <h3>Events</h3>
        <p style="color: #888; text-align: center; padding: 15px;">No active events right now.<br>Check back periodically!</p>
      </div>
    `;
    
    // Copy referral code on click
    const referralEl = this.element.querySelector('#referral-code');
    if (referralEl) {
      referralEl.addEventListener('click', () => {
        const code = referralEl.textContent;
        navigator.clipboard.writeText(code);
        this.showToast('Referral code copied!');
      });
    }
    
    this.container.appendChild(this.element);
  }
  
  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
  
  show() {
    if (this.element) {
      this.element.classList.add('active');
    }
  }
  
  hide() {
    if (this.element) {
      this.element.classList.remove('active');
    }
  }
  
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RewardsPage;
}