const API_URL = window.location.origin + '/api';

// Check if admin is logged in
let adminToken = localStorage.getItem('adminToken');
let adminUser = null;

// Login page for admin
function showAdminLogin() {
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a0a; padding: 20px;">
      <div style="background: #111118; border-radius: 24px; padding: 40px; width: 100%; max-width: 400px; border: 1px solid rgba(0,255,136,0.2);">
        <h2 style="text-align: center; margin-bottom: 30px; color: #00ff88;">Admin Login</h2>
        <input type="text" id="admin-username" placeholder="Username" style="width: 100%; margin-bottom: 15px;">
        <input type="password" id="admin-password" placeholder="Password" style="width: 100%; margin-bottom: 20px;">
        <button id="admin-login-btn" class="btn-approve" style="width: 100%; padding: 12px;">Login</button>
        <div id="login-error" style="color: #ff6680; margin-top: 15px; text-align: center;"></div>
      </div>
    </div>
  `;
  document.getElementById('admin-login-btn').onclick = async () => {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    if (!username || !password) {
      document.getElementById('login-error').textContent = 'Fill all fields';
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Check if user is admin (username 'admin')
        if (data.user.username !== 'admin') {
          document.getElementById('login-error').textContent = 'Not an admin account';
          return;
        }
        adminToken = data.token;
        adminUser = data.user;
        localStorage.setItem('adminToken', adminToken);
        initAdminPanel();
      } else {
        document.getElementById('login-error').textContent = data.error || 'Login failed';
      }
    } catch(err) {
      document.getElementById('login-error').textContent = 'Network error';
    }
  };
}

// Initialize admin panel after login
async function initAdminPanel() {
  // Restore original HTML structure
  document.body.innerHTML = `
    <div class="admin-container">
      <aside class="sidebar">
        <div class="logo"><h2>Trading<span>Admin</span></h2></div>
        <nav class="admin-nav">
          <a href="#" class="nav-link active" data-section="dashboard"><i class="fas fa-tachometer-alt"></i><span> Dashboard</span></a>
          <a href="#" class="nav-link" data-section="users"><i class="fas fa-users"></i><span> Users</span></a>
          <a href="#" class="nav-link" data-section="trades"><i class="fas fa-chart-line"></i><span> Trades</span></a>
          <a href="#" class="nav-link" data-section="deposits"><i class="fas fa-download"></i><span> Deposits</span></a>
          <a href="#" class="nav-link" data-section="withdrawals"><i class="fas fa-upload"></i><span> Withdrawals</span></a>
          <a href="#" class="nav-link" data-section="assets"><i class="fas fa-coins"></i><span> Assets</span></a>
          <a href="#" class="nav-link" data-section="settings"><i class="fas fa-sliders-h"></i><span> Settings</span></a>
        </nav>
      </aside>
      <main class="main-content">
        <div class="top-bar">
          <div class="admin-info">
            <span>Welcome, ${adminUser.username}</span>
            <button id="logout-btn" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
          </div>
        </div>
        <div id="section-content" class="section-content">Loading...</div>
      </main>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('adminToken');
    location.reload();
  };

  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const section = link.dataset.section;
      loadSection(section);
    };
  });

  // Load dashboard by default
  loadSection('dashboard');
}

// Load different sections
async function loadSection(section) {
  const container = document.getElementById('section-content');
  container.innerHTML = '<div class="loading">Loading...</div>';
  
  switch(section) {
    case 'dashboard':
      await loadDashboard(container);
      break;
    case 'users':
      await loadUsers(container);
      break;
    case 'trades':
      await loadTrades(container);
      break;
    case 'deposits':
      await loadDeposits(container);
      break;
    case 'withdrawals':
      await loadWithdrawals(container);
      break;
    case 'assets':
      await loadAssets(container);
      break;
    case 'settings':
      await loadSettings(container);
      break;
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
    location.reload();
    throw new Error('Unauthorized');
  }
  return res;
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
        <div class="stat-card"><h3>Total Users</h3><div class="stat-number">${users.length}</div></div>
        <div class="stat-card"><h3>Total Balance</h3><div class="stat-number">₹${totalBalance.toFixed(2)}</div></div>
        <div class="stat-card"><h3>Total Trades</h3><div class="stat-number">${trades.length}</div></div>
        <div class="stat-card"><h3>Pending Deposits</h3><div class="stat-number">${pendingDeposits}</div></div>
        <div class="stat-card"><h3>Pending Withdrawals</h3><div class="stat-number">${pendingWithdrawals}</div></div>
      </div>
      <div class="data-table">
        <h3 style="margin-bottom: 15px;">Recent Trades</h3>
        <table>
          <thead><tr><th>User</th><th>Asset</th><th>Amount</th><th>Direction</th><th>Result</th><th>Profit</th><th>Date</th></tr></thead>
          <tbody>
            ${trades.slice(0, 10).map(t => `
              <tr>
                <td>${t.username || '?'}</td>
                <td>${t.asset_name || t.symbol || '?'}</td>
                <td>₹${t.amount}</td>
                <td>${t.direction}</td>
                <td><span class="badge ${t.result === 'win' ? 'badge-approved' : (t.result === 'loss' ? 'badge-rejected' : 'badge-pending')}">${t.result || 'pending'}</span></td>
                <td style="color: ${t.profit > 0 ? '#00ff88' : '#ff6680'}">${t.profit > 0 ? '+' : ''}₹${t.profit || 0}</td>
                <td>${new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading dashboard</div>';
  }
}

async function loadUsers(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/users`);
    const data = await res.json();
    const users = data.users || [];
    container.innerHTML = `
      <div class="data-table">
        <h2>Users</h2>
        <table>
          <thead><tr><th>ID</th><th>Username</th><th>Balance</th><th>Level</th><th>Joined</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>₹${(u.balance || 0).toFixed(2)}</td>
                <td>${u.level || 1}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading users</div>';
  }
}

async function loadTrades(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/trades`);
    const data = await res.json();
    const trades = data.trades || [];
    container.innerHTML = `
      <div class="data-table">
        <h2>All Trades</h2>
        <table>
          <thead><tr><th>User</th><th>Asset</th><th>Amount</th><th>Direction</th><th>Duration</th><th>Start Price</th><th>End Price</th><th>Result</th><th>Profit</th><th>Date</th></tr></thead>
          <tbody>
            ${trades.map(t => `
              <tr>
                <td>${t.username || '?'}</td>
                <td>${t.asset_name || t.symbol || '?'}</td>
                <td>₹${t.amount}</td>
                <td>${t.direction}</td>
                <td>${t.duration}s</td>
                <td>₹${t.start_price}</td>
                <td>${t.end_price ? '₹'+t.end_price : '-'}</td>
                <td><span class="badge ${t.result === 'win' ? 'badge-approved' : (t.result === 'loss' ? 'badge-rejected' : 'badge-pending')}">${t.result || 'pending'}</span></td>
                <td style="color: ${t.profit > 0 ? '#00ff88' : '#ff6680'}">${t.profit > 0 ? '+' : ''}₹${t.profit || 0}</td>
                <td>${new Date(t.created_at).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading trades</div>';
  }
}

async function loadDeposits(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/deposits`);
    const data = await res.json();
    const deposits = data.deposits || [];
    container.innerHTML = `
      <div class="data-table">
        <h2>Deposit Requests</h2>
        <table>
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${deposits.map(d => `
              <tr>
                <td>${d.username}</td>
                <td>₹${d.amount}</td>
                <td><span class="badge ${d.status === 'approved' ? 'badge-approved' : (d.status === 'rejected' ? 'badge-rejected' : 'badge-pending')}">${d.status}</span></td>
                <td>${new Date(d.created_at).toLocaleString()}</td>
                <td>
                  ${d.status === 'pending' ? `
                    <button class="btn-approve" onclick="approveDeposit(${d.id})">Approve</button>
                    <button class="btn-reject" onclick="rejectDeposit(${d.id})">Reject</button>
                  ` : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    window.approveDeposit = async (id) => {
      await fetchWithAuth(`${API_URL}/admin/deposits/${id}/approve`, { method: 'POST' });
      loadSection('deposits');
    };
    window.rejectDeposit = async (id) => {
      await fetchWithAuth(`${API_URL}/admin/deposits/${id}/reject`, { method: 'POST' });
      loadSection('deposits');
    };
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading deposits</div>';
  }
}

async function loadWithdrawals(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/withdrawals`);
    const data = await res.json();
    const withdrawals = data.withdrawals || [];
    container.innerHTML = `
      <div class="data-table">
        <h2>Withdrawal Requests</h2>
        <table>
          <thead><tr><th>User</th><th>Amount</th><th>UPI ID</th><th>Account Name</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${withdrawals.map(w => `
              <tr>
                <td>${w.username}</td>
                <td>₹${w.amount}</td>
                <td>${w.upi_id}</td>
                <td>${w.account_name}</td>
                <td><span class="badge ${w.status === 'approved' ? 'badge-approved' : (w.status === 'rejected' ? 'badge-rejected' : 'badge-pending')}">${w.status}</span></td>
                <td>${new Date(w.created_at).toLocaleString()}</td>
                <td>
                  ${w.status === 'pending' ? `
                    <button class="btn-approve" onclick="approveWithdrawal(${w.id})">Approve</button>
                    <button class="btn-reject" onclick="rejectWithdrawal(${w.id})">Reject</button>
                  ` : '-'}
                 </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    window.approveWithdrawal = async (id) => {
      await fetchWithAuth(`${API_URL}/admin/withdrawals/${id}/approve`, { method: 'POST' });
      loadSection('withdrawals');
    };
    window.rejectWithdrawal = async (id) => {
      await fetchWithAuth(`${API_URL}/admin/withdrawals/${id}/reject`, { method: 'POST' });
      loadSection('withdrawals');
    };
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading withdrawals</div>';
  }
}

async function loadAssets(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/assets`);
    const data = await res.json();
    const assets = data.assets || [];
    container.innerHTML = `
      <div class="data-table">
        <h2>Manage Assets</h2>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Symbol</th><th>Current Price</th><th>Min Price</th><th>Max Price</th><th>Actions</th></tr></thead>
          <tbody>
            ${assets.map(a => `
              <tr id="asset-row-${a.id}">
                <td>${a.id}</td>
                <td>${a.name}</td>
                <td>${a.symbol}</td>
                <td>₹${a.price.toFixed(2)}</td>
                <td><input type="number" id="min-${a.id}" value="${a.min_price}" step="1" style="width:80px; background:#0a0a0a; border:1px solid #2a2a3a; color:white; padding:4px;"></td>
                <td><input type="number" id="max-${a.id}" value="${a.max_price}" step="1" style="width:80px; background:#0a0a0a; border:1px solid #2a2a3a; color:white; padding:4px;"></td>
                <td><button class="btn-approve" onclick="updateAsset(${a.id})">Update</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    window.updateAsset = async (id) => {
      const minPrice = parseFloat(document.getElementById(`min-${id}`).value);
      const maxPrice = parseFloat(document.getElementById(`max-${id}`).value);
      if (minPrice >= maxPrice) {
        alert('Min price must be less than max price');
        return;
      }
      await fetchWithAuth(`${API_URL}/admin/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_price: minPrice, max_price: maxPrice })
      });
      loadSection('assets');
    };
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading assets</div>';
  }
}

async function loadSettings(container) {
  try {
    const res = await fetchWithAuth(`${API_URL}/admin/settings`);
    const data = await res.json();
    const settings = data.settings || {};
    container.innerHTML = `
      <div class="data-table">
        <h2>Admin Settings</h2>
        <div class="setting-item">
          <label>Deposits Enabled:</label>
          <select id="deposit-enabled">
            <option value="true" ${settings.deposit_enabled === true ? 'selected' : ''}>Yes</option>
            <option value="false" ${settings.deposit_enabled === false ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Withdrawals Enabled:</label>
          <select id="withdraw-enabled">
            <option value="true" ${settings.withdraw_enabled === true ? 'selected' : ''}>Yes</option>
            <option value="false" ${settings.withdraw_enabled === false ? 'selected' : ''}>No</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Profit Percentage (%):</label>
          <input type="number" id="profit-percent" value="${settings.profit_percentage || 80}" min="10" max="200">
        </div>
        <button id="save-settings" class="btn-save">Save Settings</button>
      </div>
    `;
    document.getElementById('save-settings').onclick = async () => {
      const depositEnabled = document.getElementById('deposit-enabled').value === 'true';
      const withdrawEnabled = document.getElementById('withdraw-enabled').value === 'true';
      const profitPercentage = parseInt(document.getElementById('profit-percent').value);
      await fetchWithAuth(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_enabled: depositEnabled, withdraw_enabled: withdrawEnabled, profit_percentage: profitPercentage })
      });
      alert('Settings saved');
    };
  } catch(err) {
    container.innerHTML = '<div class="loading">Error loading settings</div>';
  }
}

// Start
if (adminToken) {
  // Verify token by fetching something
  fetchWithAuth(`${API_URL}/admin/settings`).then(() => {
    // Need to get user info? We'll just assume token valid and set dummy adminUser
    adminUser = { username: 'admin' };
    initAdminPanel();
  }).catch(() => {
    localStorage.removeItem('adminToken');
    showAdminLogin();
  });
} else {
  showAdminLogin();
}