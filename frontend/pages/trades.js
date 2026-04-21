// Trades History Page Component (TradingFast)
class TradesPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onTradeClick: null,
      ...options
    };
    this.element = null;
    this.trades = [];
    this.API_URL = window.location.origin + '/api';
    this.render();
    this.loadTrades();
    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => this.loadTrades(), 10000);
  }

  async loadTrades() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${this.API_URL}/trade/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      this.trades = data.trades || [];
      this.updateList();
    } catch (err) {
      console.error('Failed to load trades', err);
      const listContainer = this.element.querySelector('#trades-list');
      if (listContainer) listContainer.innerHTML = '<p style="text-align:center; color:#888;">Error loading trades</p>';
    }
  }

  updateList() {
    const listContainer = this.element.querySelector('#trades-list');
    if (!listContainer) return;
    if (this.trades.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#888; padding: 40px;">No trades yet</p>';
      return;
    }
    listContainer.innerHTML = this.trades.map(trade => `
      <div class="trade-card ${trade.result || 'pending'}" data-id="${trade.id}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 16px;">${trade.asset_name || 'Asset'}</strong>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">${trade.symbol || ''}</span>
          </div>
          <span style="font-weight: 700;">₹${trade.amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <span>${trade.direction} • ${trade.duration}s</span>
          <span class="${trade.result === 'win' ? 'win' : (trade.result === 'loss' ? 'loss' : 'pending')}" style="font-weight: 600;">
            ${trade.result === 'win' ? `+₹${trade.profit}` : (trade.result === 'loss' ? `-₹${trade.amount}` : 'Pending')}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #666;">
          <span>Start: ₹${trade.start_price}</span>
          ${trade.end_price ? `<span>End: ₹${trade.end_price}</span>` : ''}
          <span>${new Date(trade.created_at).toLocaleString()}</span>
        </div>
      </div>
    `).join('');
    // Add click handlers
    const cards = listContainer.querySelectorAll('.trade-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const trade = this.trades.find(t => t.id === id);
        if (this.options.onTradeClick) this.options.onTradeClick(trade);
      });
    });
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    this.element.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="background: linear-gradient(135deg, #fff, #00ff88); -webkit-background-clip: text; background-clip: text; color: transparent;">Trade History</h2>
        <button id="refresh-trades-btn" style="background: none; border: none; color: #00ff88; font-size: 18px; cursor: pointer;"><i class="fas fa-sync-alt"></i></button>
      </div>
      <div id="trades-list" class="trade-list">Loading trades...</div>
    `;
    const refreshBtn = this.element.querySelector('#refresh-trades-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => this.loadTrades();
    }
    this.container.appendChild(this.element);
  }

  refresh() {
    this.loadTrades();
  }

  show() {
    if (this.element) this.element.classList.add('active');
    this.refresh();
  }

  hide() {
    if (this.element) this.element.classList.remove('active');
  }

  destroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.element && this.element.parentNode) this.element.remove();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TradesPage;
}