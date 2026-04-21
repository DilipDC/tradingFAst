// Advanced Admin Panel - TradingFast Nexus
const API_URL = window.location.origin + '/api';
let adminToken = localStorage.getItem('adminToken');
let currentSection = 'dashboard';

// Preloader removal
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => preloader.remove(), 800);
    }
  }, 1500);
  
  if (adminToken) {
    verifyTokenAndStart();
  } else {
    showLoginForm();
  }
});

async function verifyTokenAndStart() {
  try {
    await fetchWithAuth(`${API_URL}/admin/settings`);
    initAdminPanel();
  } catch (err) {
    console.error('Token verification failed:', err);
    localStorage.removeItem('adminToken');
    showLoginForm('Session expired. Please login again.');
  }
}

async function fetchWithAuth(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${adminToken}`
    }
  });
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    throw new Error('Unauthorized');
  }
  return res;
}

function showLoginForm(errorMsg = '') {
  const root = document.getElementById('admin-root');
  root.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h2 style="text-align:center; margin-bottom:25px; color:#00ff88;">⚡ ADMIN NEXUS</h2>
        ${errorMsg ? `<div class="error-msg" style="color:#ff6680; text-align:center; margin-bottom:15px;">${errorMsg}</div>` : ''}
        <input type="text" id="admin-username" placeholder="Username" autocomplete="off">
        <input type="password" id="admin-password" placeholder="Password">
        <button id="admin-login-btn">🚀 Access Panel</button>
      </div>
    </div>
  `;
  document.getElementById('admin-login-btn').onclick = async () => {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    if (!username || !password) {
      showLoginForm('Fill all fields');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.user.username === 'admin') {
        adminToken = data.token;
        localStorage.setItem('adminToken', adminToken);
        initAdminPanel();
      } else {
        showLoginForm('Invalid admin credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      showLoginForm('Network error – backend unreachable');
    }
  };
}

async function initAdminPanel() {
  const root = document.getElementById('admin-root');
  root.innerHTML = `
    <div class="admin-container" id="adminContainer">
      <aside class="sidebar">
        <div class="logo"><h2>Trading<span>Fast</span></h2></div>
        <nav class="admin-nav">
          <div class="nav-link active" data-section="dashboard"><i class="fas fa-tachometer-alt"></i><span> Dashboard</span></div>
          <div class="nav-link" data-section="users"><i class="fas fa-users"></i><span> Users</span></div>
          <div class="nav-link" data-section="trades"><i class="fas fa-chart-line"></i><span> Trades</span></div>
          <div class="nav-link" data-section="deposits"><i class="fas fa-download"></i><span> Deposits</span></div>
          <div class="nav-link" data-section="withdrawals"><i class="fas fa-upload"></i><span> Withdrawals</span></div>
          <div class="nav-link" data-section="assets"><i class="fas fa-coins"></i><span> Assets</span></div>
          <div class="nav-link" data-section="settings"><i class="fas fa-sliders-h"></i><span> Settings</span></div>
        </nav>
      </aside>
      <main class="main-content">
        <div class="top-bar">
          <div class="admin-info">
            <span><i class="fas fa-crown" style="color:#00ff88;"></i> Admin</span>
            <button class="logout-btn" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Exit</button>
          </div>
        </div>
        <div id="section-content" class="section-content">Loading...</div>
      </main>
    </div>
  `;
  
  // FIXED LOGOUT: Clear token and reload the login form
  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('adminToken');
    adminToken = null;
    showLoginForm(); // This replaces the entire DOM with login form
  };
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentSection = link.dataset.section;
      loadSection(currentSection);
    };
  });
  await loadSection('dashboard');
  const container = document.querySelector('.admin-container');
  if (container) container.classList.add('loaded');
}

async function loadSection(section) {
  const container = document.getElementById('section-content');
  container.innerHTML = '<div style="text-align:center; padding:60px;"><div class="spinner-glow" style="margin:0 auto;"></div></div>';
  switch(section) {
    case 'dashboard': await loadDashboard(container); break;
    case 'users': await loadUsers(container); break;
    case 'trades': await loadTrades(container); break;
    case 'deposits': await loadDeposits(container); break;
    case 'withdrawals': await loadWithdrawals(container); break;
    case 'assets': await loadAssets(container); break;
    case 'settings': await loadSettings(container); break;
  }
}

async function loadDashboard(container) {
  try {
    const [usersRes, tradesRes, depositsRes, withdrawalsRes] = await Promise.all([
      fetchWithAuth(`${API_URL}/admin/users`),
      fetchWithAuth(`${API_URL}/admin/trades`),
      fetchWithAuth(`${API_URL}/admin/deposits`),
      fetchWithAuth(`${API_URL}/admin/withdrawals`)
    ]);
    const users = (await usersRes.json()).users || [];
    const trades = (await tradesRes.json()).trades || [];
    const deposits = (await depositsRes.json()).deposits || [];
    const withdrawals = (await withdrawalsRes.json()).withdrawals || [];
    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
    const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><h3>👥 Total Users</h3><div class="stat-number">${users.length}</div></div>
        <div class="stat-card"><h3>💰 Total Balance</h3><div class="stat-number">₹${totalBalance.toFixed(2)}</div></div>
        <div class="stat-card"><h3>📊 Total Trades</h3><div class="stat-number">${trades.length}</div></div>
        <div class="stat-card"><h3>⏳ Pending Deposits</h3><div class="stat-number">${pendingDeposits}</div></div>
        <div class="stat-card"><h3>⌛ Pending Withdrawals</h3><div class="stat-number">${pendingWithdrawals}</div></div>
      </div>
      <div class="data-table"><h3>📜 Recent Trades</h3>
        <table><thead><tr><th>User</th><th>Asset</th><th>Amount</th><th>Direction</th><th>Result</th><th>Profit</th><th>Date</th></tr></thead>
        <tbody>${trades.slice(0,10).map(t => `
          <tr>
            <td>${t.username || '?'}</td>
            <td>${t.asset_name || t.symbol || '?'}</td>
            <td>₹${t.amount}</td>
            <td>${t.direction}</td>
            <td><span class="badge ${t.result === 'win' ? 'badge-approved' : (t.result === 'loss' ? 'badge-rejected' : 'badge-pending')}">${t.result || 'pending'}</span></td>
            <td style="color:${t.profit>0?'#00ff88':'#ff6680'}">${t.profit>0?'+':''}₹${t.profit||0}</td>
            <td>${new Date(t.created_at).toLocaleString()}</td>
          </tr>
        `).join('')}</tbody></table>
      </div>
    `;
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading dashboard</div>'; }
}

async function loadUsers(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/users`);
    const data = await res.json();
    const users = data.users || [];
    container.innerHTML = `
      <div class="data-table"><h2><i class="fas fa-users"></i> User Registry</h2>
        <table><thead><tr><th>ID</th><th>Username</th><th>Balance</th><th>Level</th><th>Time Joined</th></tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td>₹${(u.balance||0).toFixed(2)}</td>
            <td>${u.level||1}</td>
            <td>${new Date(u.created_at).toLocaleString()}</td>
          </tr>
        `).join('')}</tbody></table>
      </div>
    `;
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading users</div>'; }
}

async function loadTrades(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/trades`);
    const data = await res.json();
    const trades = data.trades || [];
    container.innerHTML = `
      <div class="data-table"><h2><i class="fas fa-chart-line"></i> All Trades</h2>
        <table><thead><tr><th>User</th><th>Asset</th><th>Amount</th><th>Direction</th><th>Duration</th><th>Start</th><th>End</th><th>Result</th><th>Profit</th><th>Date</th></tr></thead>
        <tbody>${trades.map(t => `
          <tr>
            <td>${t.username||'?'}</td>
            <td>${t.asset_name||t.symbol||'?'}</td>
            <td>₹${t.amount}</td>
            <td>${t.direction}</td>
            <td>${t.duration}s</td>
            <td>₹${t.start_price}</td>
            <td>${t.end_price ? '₹'+t.end_price : '-'}</td>
            <td><span class="badge ${t.result==='win'?'badge-approved':(t.result==='loss'?'badge-rejected':'badge-pending')}">${t.result||'pending'}</span></td>
            <td style="color:${t.profit>0?'#00ff88':'#ff6680'}">${t.profit>0?'+':''}₹${t.profit||0}</td>
            <td>${new Date(t.created_at).toLocaleString()}</td>
          </tr>
        `).join('')}</tbody></table>
      </div>
    `;
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading trades</div>'; }
}

async function loadDeposits(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/deposits`);
    const data = await res.json();
    const deposits = data.deposits || [];
    container.innerHTML = `
      <div class="data-table"><h2><i class="fas fa-download"></i> Deposit Requests</h2>
        <table><thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th><th>Accept</th></tr></thead>
        <tbody>${deposits.map(d => `
          <tr>
            <td>${d.username}</td>
            <td>₹${d.amount}</td>
            <td><span class="badge ${d.status==='approved'?'badge-approved':(d.status==='rejected'?'badge-rejected':'badge-pending')}">${d.status}</span></td>
            <td>${new Date(d.created_at).toLocaleString()}</td>
            <td>${d.status === 'pending' ? `<button class="btn-approve" onclick="window.showDepositModal(${d.id}, ${d.amount}, '${d.username}')">✅ Accept</button>` : '✔️ Completed'}</td>
          </tr>
        `).join('')}</tbody></table>
      </div>
    `;
    window.showDepositModal = (id, amount, username) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <h3 style="color:#00ff88;">💎 Approve Deposit</h3>
          <p><strong>User:</strong> ${username}</p>
          <p><strong>Amount:</strong> ₹${amount}</p>
          <label>📎 Transaction Proof (QR / UTR):</label>
          <input type="text" id="proof-text" placeholder="Enter reference or upload ID" style="width:100%; margin:15px 0;">
          <div style="display:flex; gap:12px;">
            <button class="btn-approve" id="confirm-deposit" style="flex:1;">✅ Confirm & Add Balance</button>
            <button class="btn-reject" id="cancel-modal" style="flex:1;">❌ Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('confirm-deposit').onclick = async () => {
        const proof = document.getElementById('proof-text').value.trim() || 'No proof provided';
        await fetchWithAuth(`${API_URL}/admin/deposits/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proof_text: proof })
        });
        modal.remove();
        loadSection('deposits');
      };
      document.getElementById('cancel-modal').onclick = () => modal.remove();
    };
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading deposits</div>'; }
}

async function loadWithdrawals(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/withdrawals`);
    const data = await res.json();
    const withdrawals = data.withdrawals || [];
    container.innerHTML = `
      <div class="data-table"><h2><i class="fas fa-upload"></i> Withdrawal Requests</h2>
        <table><thead><tr><th>User</th><th>Amount</th><th>UPI ID</th><th>Name</th><th>Status</th><th>Date</th><th>Accept</th></tr></thead>
        <tbody>${withdrawals.map(w => `
          <tr>
            <td>${w.username}</td>
            <td>₹${w.amount}</td>
            <td>${w.upi_id}</td>
            <td>${w.account_name}</td>
            <td><span class="badge ${w.status==='approved'?'badge-approved':(w.status==='rejected'?'badge-rejected':'badge-pending')}">${w.status}</span></td>
            <td>${new Date(w.created_at).toLocaleString()}</td>
            <td>${w.status === 'pending' ? `<button class="btn-approve" onclick="window.showWithdrawModal(${w.id}, ${w.amount}, '${w.username}')">✅ Accept</button>` : '✔️ Done'}</td>
          </tr>
        `).join('')}</tbody></table>
      </div>
    `;
    window.showWithdrawModal = (id, amount, username) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <h3 style="color:#ffaa00;">⚠️ Approve Withdrawal</h3>
          <p><strong>User:</strong> ${username}</p>
          <p><strong>Amount:</strong> ₹${amount}</p>
          <p>This will deduct ₹${amount} from user's balance.</p>
          <div style="display:flex; gap:12px; margin-top:20px;">
            <button class="btn-approve" id="confirm-withdraw" style="flex:1;">✅ Confirm & Deduct</button>
            <button class="btn-reject" id="cancel-modal" style="flex:1;">❌ Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('confirm-withdraw').onclick = async () => {
        await fetchWithAuth(`${API_URL}/admin/withdrawals/${id}/approve`, { method: 'POST' });
        modal.remove();
        loadSection('withdrawals');
      };
      document.getElementById('cancel-modal').onclick = () => modal.remove();
    };
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading withdrawals</div>'; }
}

async function loadAssets(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/assets`);
    const data = await res.json();
    const assets = data.assets || [];
    container.innerHTML = `
      <div class="data-table"><h2><i class="fas fa-coins"></i> Asset Management</h2>
        <table><thead><tr><th>ID</th><th>Name</th><th>Symbol</th><th>Price</th><th>Min</th><th>Max</th><th>Actions</th></tr></thead>
        <tbody>${assets.map(a => `
          <tr id="asset-row-${a.id}">
            <td>${a.id}</td><td>${a.name}</td><td>${a.symbol}</td><td>₹${a.price.toFixed(2)}</td>
            <td><input type="number" id="min-${a.id}" value="${a.min_price}" step="1" style="width:80px; background:#0a0a0a; border:1px solid #2a2a3a; color:white; padding:6px; border-radius:12px;"></td>
            <td><input type="number" id="max-${a.id}" value="${a.max_price}" step="1" style="width:80px; background:#0a0a0a; border:1px solid #2a2a3a; color:white; padding:6px; border-radius:12px;"></td>
            <td><button class="btn-approve" onclick="window.updateAsset(${a.id})">💾 Update</button></td>
          </tr>
        `).join('')}</tbody></table>
      </div>
    `;
    window.updateAsset = async (id) => {
      const minPrice = parseFloat(document.getElementById(`min-${id}`).value);
      const maxPrice = parseFloat(document.getElementById(`max-${id}`).value);
      if (minPrice >= maxPrice) { alert('Min must be less than Max'); return; }
      await fetchWithAuth(`${API_URL}/admin/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_price: minPrice, max_price: maxPrice })
      });
      loadSection('assets');
    };
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading assets</div>'; }
}

async function loadSettings(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/settings`);
    const data = await res.json();
    const settings = data.settings || {};
    container.innerHTML = `
      <div class="data-table"><h2><i class="fas fa-sliders-h"></i> System Configuration</h2>
        <div class="setting-item"><label>🏦 Deposits Enabled:</label><select id="deposit-enabled"><option value="true" ${settings.deposit_enabled===true?'selected':''}>Yes</option><option value="false" ${settings.deposit_enabled===false?'selected':''}>No</option></select></div>
        <div class="setting-item"><label>⏰ Deposit Time Window:</label><input type="time" id="deposit-start" value="${settings.deposit_start_time||'00:00'}"> to <input type="time" id="deposit-end" value="${settings.deposit_end_time||'23:59'}"></div>
        <div class="setting-item"><label>💸 Withdrawals Enabled:</label><select id="withdraw-enabled"><option value="true" ${settings.withdraw_enabled===true?'selected':''}>Yes</option><option value="false" ${settings.withdraw_enabled===false?'selected':''}>No</option></select></div>
        <div class="setting-item"><label>⏰ Withdrawal Time Window:</label><input type="time" id="withdraw-start" value="${settings.withdraw_start_time||'00:00'}"> to <input type="time" id="withdraw-end" value="${settings.withdraw_end_time||'23:59'}"></div>
        <div class="setting-item"><label>📈 Profit Percentage (%):</label><input type="number" id="profit-percent" value="${settings.profit_percentage||80}" min="10" max="200"><br><small>Profit paid to user on winning trade (e.g., 80% = ₹80 profit on ₹100 stake)</small></div>
        <button id="save-settings" class="btn-save">💾 Save All Settings</button>
      </div>
    `;
    document.getElementById('save-settings').onclick = async () => {
      const depositEnabled = document.getElementById('deposit-enabled').value === 'true';
      const withdrawEnabled = document.getElementById('withdraw-enabled').value === 'true';
      const profitPercentage = parseInt(document.getElementById('profit-percent').value);
      const depositStart = document.getElementById('deposit-start').value;
      const depositEnd = document.getElementById('deposit-end').value;
      const withdrawStart = document.getElementById('withdraw-start').value;
      const withdrawEnd = document.getElementById('withdraw-end').value;
      await fetchWithAuth(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_enabled: depositEnabled,
          withdraw_enabled: withdrawEnabled,
          profit_percentage: profitPercentage,
          deposit_start_time: depositStart,
          deposit_end_time: depositEnd,
          withdraw_start_time: withdrawStart,
          withdraw_end_time: withdrawEnd
        })
      });
      alert('✅ Settings saved successfully!');
    };
  } catch(err) { container.innerHTML = '<div class="error-msg">Error loading settings</div>'; }
}
