// Terminal (Trading) Page Component (TradingFast)
class TerminalPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onTradePlaced: null,
      ...options
    };
    this.element = null;
    this.assets = [];
    this.currentAsset = null;
    this.selectedAmount = 100;
    this.selectedDuration = 10;
    this.priceChart = null;
    this.chartData = [];
    this.priceInterval = null;
    this.countdownInterval = null;
    this.API_URL = window.location.origin + '/api';
    this.render();
    this.init();
  }

  async init() {
    await this.loadAssets();
    this.setupEventListeners();
    this.startPricePolling();
  }

  async loadAssets() {
    try {
      const res = await fetch(`${this.API_URL}/admin/assets`);
      const data = await res.json();
      this.assets = data.assets || [];
      if (this.assets.length > 0) {
        this.currentAsset = this.assets[0];
        this.updateAssetSelector();
        this.updateAssetDisplay();
        this.initChart(this.currentAsset.price);
      }
    } catch (err) {
      console.error('Failed to load assets', err);
    }
  }

  updateAssetSelector() {
    const selectEl = this.element.querySelector('#asset-selector');
    if (!selectEl) return;
    selectEl.innerHTML = this.assets.map(a => 
      `<option value="${a.id}">${a.name} (${a.symbol}) - ₹${a.price.toFixed(2)}</option>`
    ).join('');
    selectEl.onchange = (e) => {
      const assetId = parseInt(e.target.value);
      this.currentAsset = this.assets.find(a => a.id === assetId);
      this.updateAssetDisplay();
      this.initChart(this.currentAsset.price);
    };
  }

  updateAssetDisplay() {
    if (!this.currentAsset) return;
    const nameEl = this.element.querySelector('#asset-name');
    const priceEl = this.element.querySelector('#asset-price');
    if (nameEl) nameEl.textContent = `${this.currentAsset.name} (${this.currentAsset.symbol})`;
    if (priceEl) priceEl.textContent = `₹${this.currentAsset.price.toFixed(2)}`;
  }

  initChart(initialPrice) {
    const ctx = this.element.querySelector('#price-chart')?.getContext('2d');
    if (!ctx) return;
    this.chartData = Array(20).fill(initialPrice);
    if (this.priceChart) this.priceChart.destroy();
    this.priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(20).fill(''),
        datasets: [{
          label: 'Price',
          data: this.chartData,
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { ticks: { color: '#888' } } }
      }
    });
  }

  updateChart(newPrice) {
    if (!this.priceChart) return;
    this.chartData.push(newPrice);
    this.chartData.shift();
    this.priceChart.data.datasets[0].data = this.chartData;
    this.priceChart.update();
  }

  startPricePolling() {
    if (this.priceInterval) clearInterval(this.priceInterval);
    this.priceInterval = setInterval(async () => {
      if (!this.currentAsset) return;
      try {
        const res = await fetch(`${this.API_URL}/admin/assets`);
        const data = await res.json();
        const updatedAsset = data.assets?.find(a => a.id === this.currentAsset.id);
        if (updatedAsset) {
          this.currentAsset.price = updatedAsset.price;
          this.updateAssetDisplay();
          this.updateChart(updatedAsset.price);
        }
      } catch (err) {}
    }, 3000);
  }

  setupEventListeners() {
    // Amount buttons
    const amountBtns = this.element.querySelectorAll('.amount-btn');
    amountBtns.forEach(btn => {
      btn.onclick = () => {
        amountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedAmount = parseInt(btn.dataset.amount);
        const customInput = this.element.querySelector('#custom-amount');
        if (customInput) customInput.value = '';
      };
    });
    // Custom amount
    const customInput = this.element.querySelector('#custom-amount');
    if (customInput) {
      customInput.oninput = (e) => {
        const val = parseInt(e.target.value);
        if (val >= 100) this.selectedAmount = val;
        amountBtns.forEach(b => b.classList.remove('active'));
      };
    }
    // Duration buttons
    const timeBtns = this.element.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
      btn.onclick = () => {
        timeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDuration = parseInt(btn.dataset.time);
      };
    });
    // Trade buttons
    const upBtn = this.element.querySelector('#trade-up');
    const downBtn = this.element.querySelector('#trade-down');
    if (upBtn) upBtn.onclick = () => this.placeTrade('UP');
    if (downBtn) downBtn.onclick = () => this.placeTrade('DOWN');
  }

  async placeTrade(direction) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showToast('Please login first');
      return;
    }
    if (this.selectedAmount < 100) {
      this.showToast('Minimum trade amount ₹100');
      return;
    }
    if (!this.currentAsset) {
      this.showToast('No asset selected');
      return;
    }
    try {
      const res = await fetch(`${this.API_URL}/trade/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          assetId: this.currentAsset.id,
          amount: this.selectedAmount,
          direction,
          duration: this.selectedDuration
        })
      });
      const data = await res.json();
      if (res.ok) {
        this.showToast(`Trade placed! ${direction} ₹${this.selectedAmount} for ${this.selectedDuration}s`);
        this.startCountdown(this.selectedDuration);
        if (this.options.onTradePlaced) this.options.onTradePlaced();
      } else {
        this.showToast(data.error || 'Trade failed');
      }
    } catch (err) {
      this.showToast('Network error');
    }
  }

  startCountdown(seconds) {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    let remaining = seconds;
    const timerEl = this.element.querySelector('#timer');
    const updateTimer = () => {
      if (timerEl) timerEl.textContent = `${remaining}s`;
      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
        if (timerEl) timerEl.textContent = 'Ready';
      }
      remaining--;
    };
    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    this.element.innerHTML = `
      <div class="asset-header">
        <div class="asset-name" id="asset-name">Loading...</div>
        <div class="asset-price" id="asset-price">0.00</div>
        <div class="price-change" id="price-change"></div>
      </div>
      <div class="glass-card" style="padding: 10px;">
        <select id="asset-selector" class="asset-select" style="width: 100%; background: #0a0a0a; border: 1px solid #2a2a3a; border-radius: 12px; padding: 12px;">
          <option>Loading assets...</option>
        </select>
      </div>
      <div class="chart-container">
        <canvas id="price-chart" width="400" height="200"></canvas>
      </div>
      <div class="glass-card" style="padding: 20px;">
        <div class="timer-display" id="timer">Select time</div>
        <div class="amount-selector">
          <label>Amount (₹)</label>
          <div class="amount-buttons">
            <button class="amount-btn" data-amount="100">100</button>
            <button class="amount-btn" data-amount="500">500</button>
            <button class="amount-btn" data-amount="1000">1000</button>
            <button class="amount-btn" data-amount="5000">5000</button>
          </div>
          <input type="number" id="custom-amount" placeholder="Custom amount" min="100" step="100">
        </div>
        <div class="time-selector">
          <label>Duration</label>
          <div class="amount-buttons">
            <button class="time-btn" data-time="10">10s</button>
            <button class="time-btn" data-time="60">1m</button>
            <button class="time-btn" data-time="120">2m</button>
          </div>
        </div>
        <div class="trade-buttons">
          <button class="btn btn-up" id="trade-up">UP</button>
          <button class="btn btn-down" id="trade-down">DOWN</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);
  }

  show() {
    if (this.element) this.element.classList.add('active');
  }

  hide() {
    if (this.element) this.element.classList.remove('active');
  }

  destroy() {
    if (this.priceInterval) clearInterval(this.priceInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.element && this.element.parentNode) this.element.remove();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerminalPage;
}