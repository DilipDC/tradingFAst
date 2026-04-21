// Profile/Settings Page Component (TradingFast)
class ProfilePage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onLogout: null,
      onDeposit: null,
      onWithdraw: null,
      ...options
    };
    this.element = null;
    this.userData = { balance: 0, username: '', level: 1, xp: 0, id: null };
    this.render();
    this.loadProfile();
  }

  async loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const API_URL = window.location.origin + '/api';
    try {
      const res = await fetch(`${API_URL}/wallet/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        this.userData = await res.json();
        this.updateUI();
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  }

  updateUI() {
    if (!this.element) return;
    const avatarEl = this.element.querySelector('.avatar');
    if (avatarEl) {
      avatarEl.textContent = (this.userData.username?.[0] || 'U').toUpperCase();
    }
    const nameEl = this.element.querySelector('.profile-name');
    if (nameEl) nameEl.textContent = this.userData.username || 'User';
    const idEl = this.element.querySelector('.profile-id');
    if (idEl) idEl.textContent = `ID: ${this.userData.id || '---'}`;
    const balanceEl = this.element.querySelector('.stat-balance');
    if (balanceEl) balanceEl.textContent = `₹${(this.userData.balance || 0).toFixed(2)}`;
    const levelEl = this.element.querySelector('.stat-level');
    if (levelEl) levelEl.textContent = `Level ${this.userData.level || 1}`;
    const xpEl = this.element.querySelector('.stat-xp');
    if (xpEl) xpEl.textContent = `XP: ${this.userData.xp || 0}/50`;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    this.element.innerHTML = `
      <h2 style="margin-bottom: 20px;">TradingFast Profile</h2>
      <div class="profile-header">
        <div class="avatar">U</div>
        <h2 class="profile-name">Loading...</h2>
        <p class="profile-id">ID: ---</p>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value stat-balance">₹0</div><div>Balance</div></div>
        <div class="stat-card"><div class="stat-value stat-level">Level 1</div><div class="stat-xp">XP: 0/50</div></div>
      </div>
      <div class="glass-card" style="padding: 20px;">
        <h3>Quick Actions</h3>
        <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" id="profile-deposit-btn">Deposit</button>
        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" id="profile-withdraw-btn">Withdraw</button>
        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" id="profile-logout-btn">Log Out</button>
      </div>
    `;

    // Bind buttons
    const depositBtn = this.element.querySelector('#profile-deposit-btn');
    const withdrawBtn = this.element.querySelector('#profile-withdraw-btn');
    const logoutBtn = this.element.querySelector('#profile-logout-btn');

    if (depositBtn) {
      depositBtn.onclick = () => {
        if (this.options.onDeposit) this.options.onDeposit();
        else alert('Deposit feature: Request funds with QR code');
      };
    }
    if (withdrawBtn) {
      withdrawBtn.onclick = () => {
        if (this.options.onWithdraw) this.options.onWithdraw();
        else alert('Withdraw feature: Request withdrawal with UPI');
      };
    }
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        localStorage.removeItem('token');
        if (this.options.onLogout) this.options.onLogout();
        else location.reload();
      };
    }

    this.container.appendChild(this.element);
  }

  refresh() {
    this.loadProfile();
  }

  show() {
    if (this.element) {
      this.element.classList.add('active');
      this.refresh();
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
  module.exports = ProfilePage;
}