const API_URL = window.location.origin + '/api';
let adminToken = localStorage.getItem('adminToken');
let currentSection = 'dashboard';
let refreshInterval;

// Silent Data Fetcher (No Loading Screens)
async function fetchWithAuth(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...options.headers, 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status === 401) {
        localStorage.removeItem('adminToken');
        location.reload();
    }
    return res;
}

// Global Time Update
function updateLiveTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString();
    const timerEl = document.getElementById('live-clock');
    if (timerEl) timerEl.innerHTML = `<i class="far fa-clock"></i> ${dateStr} | ${timeStr}`;
}

// Preloader Removal
setTimeout(() => {
    const loader = document.querySelector('.preloader');
    if(loader) loader.style.opacity = '0';
    setTimeout(() => loader ? loader.style.display = 'none' : null, 500);
}, 1000);

function showLoginForm(errorMsg = '') {
    const root = document.getElementById('admin-root');
    root.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <h1 style="color:var(--primary); margin-bottom:10px;">NEXUS</h1>
                <p style="margin-bottom:30px; opacity:0.7;">Secure Administration Portal</p>
                ${errorMsg ? `<p style="color:#ff4757; margin-bottom:15px;">${errorMsg}</p>` : ''}
                <input type="text" id="admin-user" placeholder="Admin Username">
                <input type="password" id="admin-pass" placeholder="Password">
                <button id="login-btn">INITIALIZE SESSION</button>
            </div>
        </div>`;
    
    document.getElementById('login-btn').onclick = async () => {
        const username = document.getElementById('admin-user').value;
        const password = document.getElementById('admin-pass').value;
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
                alert("Access Denied");
            }
        } catch (e) { alert("Backend Connection Failed"); }
    };
}

async function initAdminPanel() {
    const root = document.getElementById('admin-root');
    root.innerHTML = `
        <div class="admin-container">
            <aside class="sidebar">
                <div style="padding:30px; text-align:center;">
                    <h2 style="color:#fff; font-weight:800; font-size:22px;">T-<span style="color:var(--primary)">FAST</span></h2>
                </div>
                <nav class="admin-nav" style="display:flex; flex-direction:column; padding:10px;">
                    <div class="nav-link active" data-section="dashboard" onclick="loadSection('dashboard')"><i class="fas fa-th-large"></i> <span>Dashboard</span></div>
                    <div class="nav-link" data-section="users" onclick="loadSection('users')"><i class="fas fa-user-shield"></i> <span>Users</span></div>
                    <div class="nav-link" data-section="assets" onclick="loadSection('assets')"><i class="fas fa-chart-pie"></i> <span>Market Assets</span></div>
                    <div class="nav-link" data-section="deposits" onclick="loadSection('deposits')"><i class="fas fa-wallet"></i> <span>Deposits</span></div>
                    <div class="nav-link" data-section="withdrawals" onclick="loadSection('withdrawals')"><i class="fas fa-hand-holding-usd"></i> <span>Withdrawals</span></div>
                    <div class="nav-link" data-section="settings" onclick="loadSection('settings')"><i class="fas fa-cog"></i> <span>System</span></div>
                    <div class="nav-link" style="color:#ff4757; margin-top:50px;" onclick="logout()"><i class="fas fa-power-off"></i> <span>Logout</span></div>
                </nav>
            </aside>
            <main class="main-content">
                <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                    <div><h1 id="page-title">Dashboard Overview</h1><p id="live-clock" style="opacity:0.6; font-size:13px;"></p></div>
                    <div style="background:rgba(255,255,255,0.05); padding:10px 20px; border-radius:15px; border:1px solid var(--border)">
                        <span style="color:var(--primary)">●</span> Systems Operational
                    </div>
                </header>
                <div id="section-content"></div>
            </main>
        </div>`;

    setInterval(updateLiveTime, 1000);
    loadSection('dashboard');
    
    // Auto-Refresh Loop (Every 10 Seconds)
    if(refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        silentReload(currentSection);
    }, 10000);
}

// Reload without "Loading..." spinners
async function silentReload(section) {
    const container = document.getElementById('section-content');
    if(section === 'dashboard') await loadDashboard(container, true);
    if(section === 'users') await loadUsers(container, true);
}

async function loadSection(section) {
    currentSection = section;
    const container = document.getElementById('section-content');
    container.innerHTML = `<div class="spinner-glow"></div>`; // Only show once
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    if(section === 'dashboard') await loadDashboard(container);
    if(section === 'users') await loadUsers(container);
    if(section === 'assets') await loadAssets(container);
}

// DASHBOARD WITH GRAPH
async function loadDashboard(container, silent = false) {
    const res = await fetchWithAuth(`${API_URL}/admin/users`);
    const users = (await res.json()).users || [];
    
    const html = `
        <div class="stats-grid">
            <div class="stat-card"><h4>Active Investors</h4><div class="stat-number">${users.length}</div></div>
            <div class="stat-card"><h4>Market Volume</h4><div class="stat-number">₹${users.reduce((a,b)=>a+(b.balance||0),0).toLocaleString()}</div></div>
            <div class="stat-card"><h4>System Health</h4><div class="stat-number" style="color:var(--primary)">99.9%</div></div>
        </div>
        <div class="graph-container">
            <canvas id="marketChart"></canvas>
        </div>
    `;
    if(!silent) container.innerHTML = html;
    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('marketChart')?.getContext('2d');
    if(!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
            datasets: [{
                label: 'Platform Activity',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#00ffa3',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 255, 163, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// ASSETS WITH NAME EDITING
async function loadAssets(container) {
    const res = await fetchWithAuth(`${API_URL}/admin/assets`);
    const data = await res.json();
    const assets = data.assets || [];
    
    container.innerHTML = `
        <div class="data-table">
            <table>
                <thead>
                    <tr><th>Symbol</th><th>Display Name</th><th>Price</th><th>Control Range</th><th>Action</th></tr>
                </thead>
                <tbody>
                    ${assets.map(a => `
                        <tr>
                            <td><input type="text" id="sym-${a.id}" value="${a.symbol}" class="edit-input"></td>
                            <td><input type="text" id="name-${a.id}" value="${a.name}" class="edit-input"></td>
                            <td>₹${a.price}</td>
                            <td>
                                <input type="number" id="min-${a.id}" value="${a.min_price}" style="width:70px"> - 
                                <input type="number" id="max-${a.id}" value="${a.max_price}" style="width:70px">
                            </td>
                            <td><button onclick="updateAssetFull(${a.id})" class="btn-approve">Update</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

async function updateAssetFull(id) {
    const name = document.getElementById(`name-${id}`).value;
    const symbol = document.getElementById(`sym-${id}`).value;
    const min_price = document.getElementById(`min-${id}`).value;
    const max_price = document.getElementById(`max-${id}`).value;

    await fetchWithAuth(`${API_URL}/admin/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, symbol, min_price, max_price })
    });
    alert("Asset Configured!");
}

// USER EDIT WITH PREVIOUS PASSWORD VIEW
window.editUser = async (userId) => {
    const res = await fetchWithAuth(`${API_URL}/admin/users`);
    const users = (await res.json()).users || [];
    const user = users.find(u => u.id === userId);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="background:#0a0a0f; border:1px solid var(--primary); padding:30px; border-radius:30px;">
            <h2 style="color:var(--primary)">Modify Account #${userId}</h2>
            <p style="font-size:12px; margin-bottom:20px;">Reviewing: ${user.username}</p>
            
            <label>Username</label>
            <input type="text" id="edit-un" value="${user.username}" class="login-card input" style="background:rgba(255,255,255,0.05); width:100%; margin:10px 0;">
            
            <label>Current Wallet Balance (₹)</label>
            <input type="number" id="edit-bal" value="${user.balance}" class="login-card input" style="background:rgba(255,255,255,0.05); width:100%; margin:10px 0;">
            
            <label>Update Password (leave blank to keep)</label>
            <input type="text" id="edit-pass" placeholder="Enter new password" class="login-card input" style="background:rgba(255,255,255,0.05); width:100%; margin:10px 0;">
            
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button onclick="saveUser(${userId})" style="flex:1; background:var(--primary); padding:10px; border-radius:10px; border:none; cursor:pointer;">Save</button>
                <button onclick="this.closest('.modal-overlay').remove()" style="flex:1; background:#ff4757; color:#fff; border-radius:10px; border:none;">Cancel</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

function logout() {
    localStorage.removeItem('adminToken');
    location.reload();
}

// Initial Run
if (adminToken) initAdminPanel(); else showLoginForm();
