// API Base URL
const API_URL = window.location.origin + '/api';

// Global state
let currentUser = null;
let currentAsset = null;
let priceChart = null;
let chartData = [];
let priceInterval = null;
let countdownInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await fetch(`${API_URL}/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        currentUser = await res.json();
        currentUser.token = token;
        showMainApp();
      } else {
        localStorage.removeItem('token');
        showLogin();
      }
    } catch(e) { showLogin(); }
  } else {
    showLogin();
  }
});

// ---------- AUTH ----------
function showLogin() {
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px;">
      <div class="glass-card" style="width:100%; max-width:400px; padding:30px;">
        <h1 style="text-align:center; margin-bottom:30px; background:linear-gradient(135deg,#00ff88,#00aa55); -webkit-background-clip:text; background-clip:text; color:transparent;">TradingFast</h1>
        <input type="text" id="auth-username" placeholder="Username">
        <input type="password" id="auth-password" placeholder="Password">
        <button class="btn btn-primary" id="auth-login-btn" style="width:100%; margin-bottom:10px;">Login</button>
        <button class="btn btn-secondary" id="auth-register-btn" style="width:100%;">Register</button>
        <div id="auth-error" style="color:#ff3355; margin-top:15px; text-align:center;"></div>
      </div>
    </div>
  `;
  document.getElementById('auth-login-btn').onclick = () => handleAuth('login');
  document.getElementById('auth-register-btn').onclick = () => handleAuth('register');
}

async function handleAuth(mode) {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorDiv = document.getElementById('auth-error');
  if (!username || !password) { errorDiv.textContent = 'Fill all fields'; return; }
  try {
    const res = await fetch(`${API_URL}/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      currentUser.token = data.token;
      showMainApp();
    } else {
      errorDiv.textContent = data.error || 'Authentication failed';
    }
  } catch(e) { errorDiv.textContent = 'Network error'; }
}

// ---------- MAIN APP ----------
function showMainApp() {
  document.getElementById('app').innerHTML = `
    <div id="page-container"></div>
    <div class="bottom-nav">
      <div class="nav-item" data-page="terminal"><i class="fas fa-chart-line"></i><span>Terminal</span></div>
      <div class="nav-item" data-page="trades"><i class="fas fa-exchange-alt"></i><span>Trades</span></div>
      <div class="nav-item" data-page="market"><i class="fas fa-store"></i><span>Market</span></div>
      <div class="nav-item" data-page="rewards"><i class="fas fa-gift"></i><span>Rewards</span></div>
      <div class="nav-item" data-page="help"><i class="fas fa-question-circle"></i><span>Help</span></div>
    </div>
  `;
  loadPage('terminal');
  document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
      const page = item.dataset.page;
      loadPage(page);
      document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    };
  });
  fetchBalance();
}

async function loadPage(pageName) {
  const container = document.getElementById('page-container');
  switch(pageName) {
    case 'terminal': await renderTerminal(container); break;
    case 'trades': await renderTrades(container); break;
    case 'market': await renderMarket(container); break;
    case 'rewards': renderRewards(container); break;
    case 'help': renderHelp(container); break;
    case 'profile': await renderProfile(container); break;
    default: await renderTerminal(container);
  }
}

// ---------- TERMINAL ----------
async function renderTerminal(container) {
  container.innerHTML = `
    <div class="page active">
      <div class="asset-header">
        <div class="asset-name" id="asset-name">Loading...</div>
        <div class="asset-price" id="asset-price">0.00</div>
      </div>
      <div class="glass-card" style="padding:10px;">
        <select id="asset-selector" style="width:100%; background:#0a0a0a; border:1px solid #2a2a3a; border-radius:12px; padding:12px;"></select>
      </div>
      <div class="chart-container">
        <canvas id="price-chart" width="400" height="200"></canvas>
      </div>
      <div class="glass-card" style="padding:20px;">
        <div class="timer-display" id="timer">Select time</div>
        <div><label>Amount (₹)</label><div class="amount-buttons">
          <button class="amount-btn" data-amount="100">100</button>
          <button class="amount-btn" data-amount="500">500</button>
          <button class="amount-btn" data-amount="1000">1000</button>
          <button class="amount-btn" data-amount="5000">5000</button>
        </div><input type="number" id="custom-amount" placeholder="Custom" min="100"></div>
        <div><label>Duration</label><div class="time-buttons">
          <button class="time-btn" data-time="10">10s</button>
          <button class="time-btn" data-time="60">1m</button>
          <button class="time-btn" data-time="120">2m</button>
        </div></div>
        <div class="trade-buttons">
          <button class="btn btn-up" id="trade-up">UP</button>
          <button class="btn btn-down" id="trade-down">DOWN</button>
        </div>
      </div>
    </div>
  `;

  const assets = await fetchAssets();
  const select = document.getElementById('asset-selector');
  if (assets.length) {
    select.innerHTML = assets.map(a => `<option value="${a.id}">${a.name} (${a.symbol}) - ₹${a.price}</option>`).join('');
    currentAsset = assets[0];
    updateAssetDisplay();
    initChart(currentAsset.price);
    startPricePolling(currentAsset.id);
    select.onchange = () => {
      currentAsset = assets.find(a => a.id == select.value);
      updateAssetDisplay();
      initChart(currentAsset.price);
      startPricePolling(currentAsset.id);
    };
  }

  let selectedAmount = 100;
  let selectedTime = 10;
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
      document.getElementById('custom-amount').value = '';
    };
  });
  document.getElementById('custom-amount').oninput = (e) => {
    let val = parseInt(e.target.value);
    if (val >= 100) selectedAmount = val;
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
  };
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTime = parseInt(btn.dataset.time);
    };
  });
  document.querySelector('.time-btn').click();

  document.getElementById('trade-up').onclick = () => placeTrade(currentAsset.id, selectedAmount, 'UP', selectedTime);
  document.getElementById('trade-down').onclick = () => placeTrade(currentAsset.id, selectedAmount, 'DOWN', selectedTime);
}

async function fetchAssets() {
  try {
    const res = await fetch(`${API_URL}/admin/assets`);
    const data = await res.json();
    return data.assets || [];
  } catch(e) { return []; }
}

function updateAssetDisplay() {
  if (currentAsset) {
    document.getElementById('asset-name').innerText = `${currentAsset.name} (${currentAsset.symbol})`;
    document.getElementById('asset-price').innerText = `₹${currentAsset.price.toFixed(2)}`;
  }
}

function initChart(price) {
  const ctx = document.getElementById('price-chart').getContext('2d');
  chartData = Array(20).fill(price);
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {
    type: 'line',
    data: { labels: Array(20).fill(''), datasets: [{ data: chartData, borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)', fill: true, tension: 0.4, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { ticks: { color: '#888' } } } }
  });
}

function updateChart(newPrice) {
  if (!priceChart) return;
  chartData.push(newPrice);
  chartData.shift();
  priceChart.data.datasets[0].data = chartData;
  priceChart.update();
}

function startPricePolling(assetId) {
  if (priceInterval) clearInterval(priceInterval);
  priceInterval = setInterval(async () => {
    const res = await fetch(`${API_URL}/admin/assets`);
    const data = await res.json();
    const updated = data.assets?.find(a => a.id === assetId);
    if (updated && currentAsset) {
      currentAsset.price = updated.price;
      updateAssetDisplay();
      updateChart(updated.price);
    }
  }, 3000);
}

async function placeTrade(assetId, amount, direction, duration) {
  if (!currentUser) { showToast('Please login'); return; }
  if (amount < 100) { showToast('Minimum ₹100'); return; }
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/trade/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ assetId, amount, direction, duration })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Trade placed! ${direction} ₹${amount} for ${duration}s`);
      startCountdown(duration);
      fetchBalance();
    } else {
      showToast(data.error || 'Trade failed');
    }
  } catch(e) { showToast('Network error'); }
}

function startCountdown(sec) {
  if (countdownInterval) clearInterval(countdownInterval);
  let remaining = sec;
  const timerEl = document.getElementById('timer');
  const update = () => {
    timerEl.textContent = `${remaining}s`;
    if (remaining <= 0) { clearInterval(countdownInterval); timerEl.textContent = 'Ready'; fetchBalance(); }
    remaining--;
  };
  update();
  countdownInterval = setInterval(update, 1000);
}

// ---------- TRADES PAGE ----------
async function renderTrades(container) {
  container.innerHTML = `<div class="page active"><h2>Trade History</h2><div id="trades-list">Loading...</div></div>`;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/trade/history`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const trades = data.trades || [];
    if (!trades.length) { document.getElementById('trades-list').innerHTML = '<p style="text-align:center; color:#888;">No trades yet</p>'; return; }
    document.getElementById('trades-list').innerHTML = trades.map(t => `
      <div class="trade-card ${t.result || 'pending'}">
        <div style="display:flex; justify-content:space-between;"><strong>${t.asset_name}</strong><span>₹${t.amount}</span></div>
        <div style="display:flex; justify-content:space-between; margin-top:8px;"><span>${t.direction} • ${t.duration}s</span><span>${t.result === 'win' ? `+₹${t.profit}` : (t.result === 'loss' ? `-₹${t.amount}` : 'Pending')}</span></div>
        <div style="font-size:12px; color:#888;">${new Date(t.created_at).toLocaleString()}</div>
      </div>
    `).join('');
  } catch(e) { document.getElementById('trades-list').innerHTML = '<p>Error loading trades</p>'; }
}

// ---------- MARKET PAGE ----------
async function renderMarket(container) {
  container.innerHTML = `<div class="page active"><h2>Market</h2><div id="market-assets">Loading...</div></div>`;
  const assets = await fetchAssets();
  document.getElementById('market-assets').innerHTML = assets.map(a => `
    <div class="asset-item" data-id="${a.id}">
      <div><h4>${a.name}</h4><p>${a.symbol} | Min: ₹${a.min_price} Max: ₹${a.max_price}</p></div>
      <div class="asset-current-price">₹${a.price.toFixed(2)}</div>
    </div>
  `).join('');
  document.querySelectorAll('.asset-item').forEach(el => {
    el.onclick = () => {
      loadPage('terminal');
      setTimeout(() => {
        const select = document.getElementById('asset-selector');
        if (select) select.value = el.dataset.id;
        select?.dispatchEvent(new Event('change'));
      }, 100);
    };
  });
}

// ---------- REWARDS PAGE ----------
function renderRewards(container) {
  container.innerHTML = `
    <div class="page active">
      <h2>Rewards</h2>
      <div class="reward-card"><h3>🎁 Welcome Bonus</h3><p>Use code <strong>WELCOME</strong> on first deposit</p><div class="promo-code">UP TO 100%</div></div>
      <div class="reward-card"><h3>💰 Special Promo</h3><p>Use code <strong>ONAPA</strong> when depositing USD</p></div>
      <div class="reward-card"><h3>🏆 Referral Program</h3><p>Invite friends – earn ₹500 each</p><div class="promo-code" id="refCode" style="cursor:pointer;">Copy your link</div></div>
      <div class="glass-card" style="padding:20px;"><h3>Leaderboard</h3><p>Coming soon...</p></div>
    </div>
  `;
  document.getElementById('refCode')?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href + '?ref=' + (currentUser?.id || ''));
    showToast('Referral link copied!');
  });
}

// ---------- HELP PAGE ----------
function renderHelp(container) {
  container.innerHTML = `
    <div class="page active">
      <h2>Help & Support</h2>
      <div class="help-card" onclick="alert('24/7 Support: support@tradingfast.com')"><i class="fas fa-headset"></i> <strong>Support</strong><br>We're here for you 24/7</div>
      <div class="help-card" onclick="alert('Visit our Help Center at docs.tradingfast.com')"><i class="fas fa-book"></i> <strong>Help Center</strong><br>Get to know the platform</div>
      <div class="help-card" onclick="alert('Watch video tutorials on YouTube')"><i class="fas fa-graduation-cap"></i> <strong>Education</strong><br>Expand your knowledge</div>
      <div class="help-card" onclick="alert('Step-by-step: Choose asset → amount → duration → UP/DOWN')"><i class="fas fa-chart-line"></i> <strong>Trading Tutorials</strong><br>Learn how to open a trade</div>
    </div>
  `;
}

// ---------- PROFILE (Settings) ----------
async function renderProfile(container) {
  const token = localStorage.getItem('token');
  let user = { balance:0, username:'', level:1, xp:0, id:'' };
  try {
    const res = await fetch(`${API_URL}/wallet/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) user = await res.json();
  } catch(e) {}
  container.innerHTML = `
    <div class="page active">
      <div class="profile-header"><div class="avatar">${(user.username?.[0]||'U').toUpperCase()}</div><h2>${user.username}</h2><p>ID ${user.id}</p></div>
      <div class="stat-grid"><div class="stat-card"><div class="stat-value">₹${user.balance.toFixed(2)}</div><div>Balance</div></div>
      <div class="stat-card"><div class="stat-value">Level ${user.level}</div><div>XP ${user.xp}/50</div></div></div>
      <div class="glass-card" style="padding:20px;"><h3>Quick Actions</h3>
        <button class="btn btn-primary" id="profile-deposit" style="width:100%; margin-top:10px;">Deposit</button>
        <button class="btn btn-secondary" id="profile-withdraw" style="width:100%; margin-top:10px;">Withdraw</button>
        <button class="btn btn-secondary" id="profile-logout" style="width:100%; margin-top:10px;">Log Out</button>
      </div>
    </div>
  `;
  document.getElementById('profile-deposit').onclick = showDepositModal;
  document.getElementById('profile-withdraw').onclick = showWithdrawModal;
  document.getElementById('profile-logout').onclick = () => { localStorage.clear(); location.reload(); };
}

async function fetchBalance() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/wallet/balance`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (currentUser) currentUser.balance = data.balance;
  } catch(e) {}
}

function showDepositModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-content"><h3>Deposit</h3><input type="number" id="deposit-amount" placeholder="Amount (min ₹100)"><button class="btn btn-primary" id="confirm-deposit">Request</button><button class="btn btn-secondary" id="close-modal">Cancel</button><div id="qr-area"></div></div>`;
  document.body.appendChild(modal);
  document.getElementById('confirm-deposit').onclick = async () => {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    if (amount<100) { showToast('Min ₹100'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/deposit/request`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` }, body:JSON.stringify({amount}) });
    const data = await res.json();
    if(res.ok) {
      document.getElementById('qr-area').innerHTML = `<img src="${data.deposit.qrCode}" width="150"><p>Amount: ₹${amount}<br>Status: pending approval</p>`;
      showToast('Request sent to admin');
    } else { showToast(data.error); }
  };
  document.getElementById('close-modal').onclick = () => modal.remove();
}

function showWithdrawModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-content"><h3>Withdraw</h3><input id="withdraw-name" placeholder="Full Name"><input id="withdraw-upi" placeholder="UPI ID"><input type="number" id="withdraw-amount" placeholder="Amount"><button class="btn btn-primary" id="confirm-withdraw">Request</button><button class="btn btn-secondary" id="close-modal">Cancel</button></div>`;
  document.body.appendChild(modal);
  document.getElementById('confirm-withdraw').onclick = async () => {
    const name = document.getElementById('withdraw-name').value.trim();
    const upi = document.getElementById('withdraw-upi').value.trim();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (!name||!upi||amount<100) { showToast('Invalid details'); return; }
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/withdraw/request`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` }, body:JSON.stringify({ amount, upiId:upi, accountName:name }) });
    if(res.ok) { showToast('Withdrawal request submitted'); modal.remove(); }
    else { showToast('Failed'); }
  };
  document.getElementById('close-modal').onclick = () => modal.remove();
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
