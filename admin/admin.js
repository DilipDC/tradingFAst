// Complete Admin Panel v2 — Premium Light UI + Real-time + Excel Export
const API_URL = window.location.origin + '/api';

// ======================== GLOBALS ========================
let adminToken = localStorage.getItem('adminToken');
let currentSection = 'dashboard';
let autoRefreshInterval = null;
let chartInstance = null;          // Chart.js instance
let currentUsersData = [];         // store for export/pagination
let currentTradesData = [];
let currentDepositsData = [];
let currentWithdrawalsData = [];
let currentAssetsData = [];

// pagination state
let usersCurrentPage = 1;
const USERS_PER_PAGE = 10;

// Helper: show toast message
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notify');
    if(existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notify';
    toast.style.background = type === 'error' ? '#c62828' : '#2e7d32';
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Authenticated fetcher
async function fetchWithAuth(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { ...options.headers, 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status === 401) {
        localStorage.removeItem('adminToken');
        throw new Error('Unauthorized');
    }
    return res;
}

// Silent refresh (no loading overlay disturbance)
async function silentRefresh() {
    if (!adminToken || currentSection === 'login') return;
    try {
        const container = document.getElementById('section-content');
        if (!container) return;
        // capture current scroll
        const scrollPos = window.scrollY;
        await loadSection(currentSection, true); // silent param = true
        window.scrollTo(0, scrollPos);
    } catch(e) { console.warn("silent refresh error", e); }
}

// Start/stop auto refresh
function startAutoRefresh() {
    if(autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => silentRefresh(), 10000);
}
function stopAutoRefresh() {
    if(autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
}

// ======================== LOGIN PAGE (3D particles) ========================
function showLoginForm(errorMsg = '') {
    stopAutoRefresh();
    const root = document.getElementById('admin-root');
    root.innerHTML = `
        <div class="login-container">
            <div class="floating-shapes" id="particles-bg"></div>
            <div class="login-card" data-aos="fade-up">
                <h2 style="text-align:center; margin-bottom:25px; color:#2e7d32;">⚡ ADMIN NEXUS</h2>
                ${errorMsg ? `<div class="error-msg" style="color:#c62828; text-align:center;">${errorMsg}</div>` : ''}
                <div class="input-group">
                    <input type="text" id="admin-username" placeholder="Username" autocomplete="off">
                </div>
                <div class="input-group">
                    <input type="password" id="admin-password" placeholder="Password">
                </div>
                <button id="admin-login-btn">🚀 Access Panel</button>
            </div>
        </div>
    `;
    // Floating particles effect (simple)
    const containerBg = document.getElementById('particles-bg');
    for(let i=0;i<45;i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = `${Math.random() * 8 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.background = `rgba(76, 175, 80, ${Math.random() * 0.3})`;
        particle.style.borderRadius = '50%';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animation = `floatParticle ${Math.random() * 15 + 8}s infinite linear`;
        containerBg.appendChild(particle);
    }
    const style = document.createElement('style');
    style.textContent = `@keyframes floatParticle { 0% { transform: translateY(0px) rotate(0deg); opacity:0; } 50% { opacity:0.6; } 100% { transform: translateY(-80px) rotate(360deg); opacity:0; } }`;
    document.head.appendChild(style);
    
    document.getElementById('admin-login-btn').onclick = async () => {
        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;
        if (!username || !password) return showLoginForm('Fill all fields');
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
            showLoginForm('Network error – backend unreachable');
        }
    };
}

// ======================== INIT PANEL ========================
async function initAdminPanel() {
    const root = document.getElementById('admin-root');
    root.innerHTML = `
        <div class="admin-container" id="adminContainer">
            <aside class="sidebar" id="adminSidebar">
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
                    <button class="sidebar-toggle" id="sidebarToggleBtn"><i class="fas fa-bars"></i></button>
                    <div class="admin-info"><span><i class="fas fa-crown"></i> Admin</span><button class="logout-btn" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Exit</button></div>
                </div>
                <div id="section-content">Loading dashboard...</div>
            </main>
        </div>
    `;
    // Sidebar toggle
    const sidebar = document.getElementById('adminSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('collapsed');
    };
    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('adminToken');
        if(autoRefreshInterval) clearInterval(autoRefreshInterval);
        showLoginForm();
    };
    document.querySelectorAll('.nav-link').forEach(link => {
        link.onclick = () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentSection = link.dataset.section;
            usersCurrentPage = 1;
            loadSection(currentSection, false);
        };
    });
    await loadSection('dashboard', false);
    document.querySelector('.admin-container')?.classList.add('loaded');
    startAutoRefresh();
}

// ======================== LOAD SECTION (with skeleton prevention) ========================
async function loadSection(section, silent = false) {
    const container = document.getElementById('section-content');
    if(!silent) container.innerHTML = '<div style="text-align:center; padding:60px;"><div class="loader-spinner-light" style="margin:0 auto;"></div></div>';
    switch(section) {
        case 'dashboard': await loadDashboard(container, silent); break;
        case 'users': await loadUsers(container, silent); break;
        case 'trades': await loadTrades(container, silent); break;
        case 'deposits': await loadDeposits(container, silent); break;
        case 'withdrawals': await loadWithdrawals(container, silent); break;
        case 'assets': await loadAssets(container, silent); break;
        case 'settings': await loadSettings(container, silent); break;
    }
}

// ========== DASHBOARD + CHART.JS ==========
async function loadDashboard(container, silent) {
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

        // Prepare chart data (trades over time & profit)
        const last7Days = [...Array(7)].map((_,i) => {
            const d = new Date(); d.setDate(d.getDate()-i); return d.toISOString().slice(0,10);
        }).reverse();
        const dailyProfit = last7Days.map(day => {
            return trades.filter(t => t.created_at?.startsWith(day)).reduce((sum, t) => sum + (t.profit || 0), 0);
        });
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><h3>👥 Total Users</h3><div class="stat-number">${users.length}</div></div>
                <div class="stat-card"><h3>💰 Total Balance</h3><div class="stat-number">₹${totalBalance.toFixed(2)}</div></div>
                <div class="stat-card"><h3>📊 Total Trades</h3><div class="stat-number">${trades.length}</div></div>
                <div class="stat-card"><h3>⏳ Pending Deposits</h3><div class="stat-number">${pendingDeposits}</div></div>
                <div class="stat-card"><h3>⌛ Pending Withdrawals</h3><div class="stat-number">${pendingWithdrawals}</div></div>
            </div>
            <div class="chart-container"><canvas id="profitChart" width="400" height="200"></canvas></div>
            <div class="data-table"><h3>📜 Recent Trades <button class="export-excel-btn" id="exportTradesExcelBtn" style="float:right;"><i class="fas fa-download"></i> Excel</button></h3>
                <table><thead><tr><th>User</th><th>Asset</th><th>Amount</th><th>Direction</th><th>Result</th><th>Profit</th><th>Date</th></tr></thead>
                <tbody>${trades.slice(0,10).map(t => `<tr><td>${t.username || '?'}</td><td>${t.asset_name || t.symbol || '?'}</td><td>₹${t.amount}</td><td>${t.direction}</td><td><span class="badge ${t.result === 'win' ? 'badge-approved' : (t.result === 'loss' ? 'badge-rejected' : 'badge-pending')}">${t.result || 'pending'}</span></td><td style="color:${t.profit>0?'#2e7d32':'#c62828'}">${t.profit>0?'+':''}₹${t.profit||0}</td><td>${new Date(t.created_at).toLocaleString()}</td></tr>`).join('')}</tbody>
                </table>
            </div>
        `;
        // Render chart
        const ctx = document.getElementById('profitChart').getContext('2d');
        if(chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: last7Days, datasets: [{ label: 'Daily P&L (₹)', data: dailyProfit, borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true, tension: 0.3 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
        });
        document.getElementById('exportTradesExcelBtn')?.addEventListener('click', () => exportToExcel('trades', trades.slice(0,500)));
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error loading dashboard</div>'; showToast('Dashboard error', 'error'); }
}

// ========== USERS (Search + Pagination + Excel) ==========
async function loadUsers(container, silent) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/users`);
        const data = await res.json();
        currentUsersData = data.users || [];
        renderUsersTable(container);
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error loading users</div>'; }
}

function renderUsersTable(container, searchTerm = '') {
    let filtered = currentUsersData.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filtered.length / USERS_PER_PAGE);
    const start = (usersCurrentPage-1)*USERS_PER_PAGE;
    const paginated = filtered.slice(start, start+USERS_PER_PAGE);
    container.innerHTML = `
        <div class="data-table"><h2><i class="fas fa-users"></i> User Registry <button class="export-excel-btn" id="exportUsersExcelBtn" style="float:right; margin-left:12px;"><i class="fas fa-download"></i> Excel</button></h2>
        <div class="search-filter"><input type="text" id="userSearchInput" placeholder="🔍 Search username..." value="${searchTerm}"> <span>Total: ${filtered.length} users</span></div>
        <table><thead><tr><th>ID</th><th>Username</th><th>Balance</th><th>Level</th><th>Total Trades</th><th>Win/Loss</th><th>Profit</th><th>Join Date</th><th>Actions</th></tr></thead>
        <tbody id="users-tbody">${paginated.map(u => `<tr id="user-row-${u.id}"><td>${u.id}</td><td>${u.username}</td><td>₹${(u.balance||0).toFixed(2)}</td><td>${u.level||1}</td><td class="stats-loading" data-userid="${u.id}">---</td><td class="stats-loading" data-userid="${u.id}">---</td><td class="stats-loading" data-userid="${u.id}">---</td><td>${new Date(u.created_at).toLocaleString()}</td><td><button class="btn-approve" onclick="window.editUser(${u.id})">✏️ Edit</button> <button class="btn-reject" onclick="window.deleteUser(${u.id})">🗑️ Delete</button></td></tr>`).join('')}</tbody></table>
        <div class="pagination" id="usersPagination"></div></div>
    `;
    // Pagination controls
    const paginationDiv = document.getElementById('usersPagination');
    if(totalPages > 1) {
        let btns = '';
        for(let i=1;i<=totalPages;i++) btns += `<button class="${i===usersCurrentPage?'active-page':''}" data-page="${i}">${i}</button>`;
        paginationDiv.innerHTML = btns;
        paginationDiv.querySelectorAll('button').forEach(btn => btn.onclick = (e) => { usersCurrentPage = parseInt(btn.dataset.page); renderUsersTable(container, document.getElementById('userSearchInput')?.value || ''); });
    }
    document.getElementById('userSearchInput')?.addEventListener('input', (e) => { usersCurrentPage = 1; renderUsersTable(container, e.target.value); });
    document.getElementById('exportUsersExcelBtn')?.addEventListener('click', () => exportToExcel('users', currentUsersData));
    // fetch stats for each user
    for(let u of paginated) loadUserStats(u.id);
}

async function loadUserStats(userId) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/users/${userId}/stats`);
        const stats = await res.json();
        const row = document.querySelector(`#user-row-${userId}`);
        if(row) {
            const cells = row.querySelectorAll('.stats-loading');
            if(cells[0]) cells[0].innerHTML = stats.totalTrades || 0;
            if(cells[1]) cells[1].innerHTML = `${stats.wins || 0}/${stats.losses || 0}`;
            if(cells[2]) cells[2].innerHTML = `₹${(stats.totalProfit || 0).toFixed(2)}`;
            cells.forEach(c => c.classList.remove('stats-loading'));
        }
    } catch(e) {}
}

window.editUser = async (userId) => {
    const user = currentUsersData.find(u => u.id === userId);
    if (!user) return;
    const statsRes = await fetchWithAuth(`${API_URL}/admin/users/${userId}/stats`);
    const stats = await statsRes.json();
    const modal = document.createElement('div'); modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-content"><h3 style="color:#2e7d32;">✏️ Edit User #${userId}</h3><div class="user-stats-grid"><div class="user-stat-card"><div class="stat-label">Total Trades</div><div class="stat-value">${stats.totalTrades||0}</div></div><div class="user-stat-card"><div class="stat-label">Wins/Losses</div><div class="stat-value">${stats.wins||0}/${stats.losses||0}</div></div><div class="user-stat-card"><div class="stat-label">Profit</div><div class="stat-value">₹${(stats.totalProfit||0).toFixed(2)}</div></div></div><label>Username</label><input type="text" id="edit-username" class="edit-user-input" value="${user.username}"><label>New Password (leave blank)</label><input type="password" id="edit-password" class="edit-user-input" placeholder="******"><label>Balance (₹)</label><input type="number" id="edit-balance" class="edit-user-input" value="${user.balance}" step="100"><div style="display: flex; gap: 10px; margin-top: 15px;"><button id="save-user-changes" class="btn-approve">💾 Save</button><button id="cancel-edit" class="btn-reject">Cancel</button></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('save-user-changes').onclick = async () => {
        const newUsername = document.getElementById('edit-username').value.trim();
        const newPassword = document.getElementById('edit-password').value;
        const newBalance = parseFloat(document.getElementById('edit-balance').value);
        if (!newUsername) return alert('Username required');
        const payload = { username: newUsername, balance: newBalance };
        if (newPassword) payload.password = newPassword;
        await fetchWithAuth(`${API_URL}/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        modal.remove(); loadSection('users', false);
        showToast('User updated');
    };
    document.getElementById('cancel-edit').onclick = () => modal.remove();
};

window.deleteUser = async (userId) => {
    if (!confirm('⚠️ Delete permanently?')) return;
    await fetchWithAuth(`${API_URL}/admin/users/${userId}`, { method: 'DELETE' });
    loadSection('users', false);
    showToast('User deleted');
};

// ========== TRADES EXCEL ==========
async function loadTrades(container, silent) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/trades`);
        const data = await res.json();
        currentTradesData = data.trades || [];
        container.innerHTML = `<div class="data-table"><h2><i class="fas fa-chart-line"></i> All Trades <button class="export-excel-btn" id="exportTradesAllExcel" style="float:right;"><i class="fas fa-download"></i> Excel</button></h2><table><thead><tr><th>User</th><th>Asset</th><th>Amount</th><th>Direction</th><th>Duration</th><th>Result</th><th>Profit</th><th>Date</th></tr></thead><tbody>${currentTradesData.map(t => `<tr><td>${t.username||'?'}</td><td>${t.asset_name||t.symbol}</td><td>₹${t.amount}</td><td>${t.direction}</td><td>${t.duration}s</td><td><span class="badge ${t.result==='win'?'badge-approved':'badge-rejected'}">${t.result||'pending'}</span></td><td style="color:${t.profit>0?'green':'red'}">₹${t.profit||0}</td><td>${new Date(t.created_at).toLocaleString()}</td></tr>`).join('')}</tbody></table></div>`;
        document.getElementById('exportTradesAllExcel')?.addEventListener('click', () => exportToExcel('trades', currentTradesData));
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error</div>'; }
}

async function loadDeposits(container, silent) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/deposits`);
        const data = await res.json();
        currentDepositsData = data.deposits || [];
        container.innerHTML = `<div class="data-table"><h2>Deposits <button class="export-excel-btn" id="exportDepositsExcel" style="float:right;">Excel</button></h2><table><thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>${currentDepositsData.map(d => `<tr><td>${d.username}</td><td>₹${d.amount}</td><td><span class="badge ${d.status==='approved'?'badge-approved':'badge-pending'}">${d.status}</span></td><td>${new Date(d.created_at).toLocaleString()}</td><td>${d.status === 'pending' ? `<button class="btn-approve" onclick="window.showDepositModal(${d.id}, ${d.amount}, '${d.username}')">Accept</button>` : '✔️'}</td></tr>`).join('')}</tbody></table></div>`;
        document.getElementById('exportDepositsExcel')?.addEventListener('click', () => exportToExcel('deposits', currentDepositsData));
        window.showDepositModal = (id, amount, username) => { /* keep same logic as original but modern */ 
            const modal = document.createElement('div'); modal.className = 'modal-overlay';
            modal.innerHTML = `<div class="modal-content"><h3>Approve Deposit</h3><p>${username} | ₹${amount}</p><input id="proof-text" placeholder="Transaction proof"><div style="display:flex;gap:12px;margin-top:16px;"><button id="confirm-deposit" class="btn-approve">Confirm</button><button id="cancel-modal" class="btn-reject">Cancel</button></div></div>`;
            document.body.appendChild(modal);
            document.getElementById('confirm-deposit').onclick = async () => { await fetchWithAuth(`${API_URL}/admin/deposits/${id}/approve`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ proof_text: document.getElementById('proof-text').value || 'approved' }) }); modal.remove(); loadSection('deposits'); showToast('Deposit approved'); };
            document.getElementById('cancel-modal').onclick = () => modal.remove();
        };
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error</div>'; }
}

async function loadWithdrawals(container, silent) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/withdrawals`);
        const data = await res.json();
        currentWithdrawalsData = data.withdrawals || [];
        container.innerHTML = `<div class="data-table"><h2>Withdrawals <button class="export-excel-btn" id="exportWithdrawalsExcel" style="float:right;">Excel</button></h2><table><thead><tr><th>User</th><th>Amount</th><th>UPI</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>${currentWithdrawalsData.map(w => `<tr><td>${w.username}</td><td>₹${w.amount}</td><td>${w.upi_id}</td><td><span class="badge">${w.status}</span></td><td>${new Date(w.created_at).toLocaleString()}</td><td>${w.status === 'pending' ? `<button class="btn-approve" onclick="window.approveWithdraw(${w.id}, ${w.amount})">Approve</button>` : 'Done'}</td></tr>`).join('')}</tbody></table></div>`;
        document.getElementById('exportWithdrawalsExcel')?.addEventListener('click', () => exportToExcel('withdrawals', currentWithdrawalsData));
        window.approveWithdraw = async (id, amount) => { await fetchWithAuth(`${API_URL}/admin/withdrawals/${id}/approve`, { method: 'POST' }); loadSection('withdrawals'); showToast('Withdrawal approved'); };
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error</div>'; }
}

// ========== ASSETS (live price simulation) ==========
async function loadAssets(container, silent) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/assets`);
        const data = await res.json();
        currentAssetsData = data.assets || [];
        container.innerHTML = `<div class="data-table"><h2>Assets <button class="export-excel-btn" id="exportAssetsExcel">Excel</button></h2><table><thead><tr><th>ID</th><th>Name</th><th>Symbol</th><th>Price</th><th>Min</th><th>Max</th><th>Actions</th></tr></thead><tbody>${currentAssetsData.map(a => `<tr><td>${a.id}</td><td><input type="text" id="name-${a.id}" value="${a.name}" style="width:100px;"></td><td><input type="text" id="sym-${a.id}" value="${a.symbol}" style="width:80px;"></td><td>₹<span id="live-price-${a.id}">${a.price.toFixed(2)}</span> <button class="btn-approve" onclick="window.updateAssetPrice(${a.id})">🔄 Refresh</button></td><td><input type="number" id="min-${a.id}" value="${a.min_price}" step="1"></td><td><input type="number" id="max-${a.id}" value="${a.max_price}" step="1"></td><td><button class="btn-approve" onclick="window.updateAssetFull(${a.id})">💾 Save</button></td></tr>`).join('')}</tbody></table></div>`;
        document.getElementById('exportAssetsExcel')?.addEventListener('click', () => exportToExcel('assets', currentAssetsData));
        window.updateAssetPrice = async (id) => { 
            const newPrice = (Math.random() * 500 + 50).toFixed(2);
            document.getElementById(`live-price-${id}`).innerText = newPrice;
            await fetchWithAuth(`${API_URL}/admin/assets/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ price: parseFloat(newPrice) }) });
            showToast(`Asset price updated to ₹${newPrice}`);
        };
        window.updateAssetFull = async (id) => {
            const minPrice = parseFloat(document.getElementById(`min-${id}`).value);
            const maxPrice = parseFloat(document.getElementById(`max-${id}`).value);
            const name = document.getElementById(`name-${id}`).value;
            const symbol = document.getElementById(`sym-${id}`).value;
            await fetchWithAuth(`${API_URL}/admin/assets/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ min_price: minPrice, max_price: maxPrice, name, symbol }) });
            loadSection('assets'); showToast('Asset updated');
        };
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error</div>'; }
}

async function loadSettings(container, silent) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/settings`);
        const settings = (await res.json()).settings || {};
        container.innerHTML = `<div class="data-table"><h2>System Config</h2><div class="setting-item"><label>Deposits Enabled:</label><select id="deposit-enabled"><option value="true" ${settings.deposit_enabled===true?'selected':''}>Yes</option><option value="false" ${settings.deposit_enabled===false?'selected':''}>No</option></select></div><div class="setting-item"><label>Withdrawals Enabled:</label><select id="withdraw-enabled"><option value="true" ${settings.withdraw_enabled===true?'selected':''}>Yes</option><option value="false" ${settings.withdraw_enabled===false?'selected':''}>No</option></select></div><div class="setting-item"><label>Profit %:</label><input id="profit-percent" value="${settings.profit_percentage||80}" type="number"></div><button id="save-settings" class="btn-save">Save Settings</button></div>`;
        document.getElementById('save-settings').onclick = async () => {
            await fetchWithAuth(`${API_URL}/admin/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deposit_enabled: document.getElementById('deposit-enabled').value === 'true', withdraw_enabled: document.getElementById('withdraw-enabled').value === 'true', profit_percentage: parseInt(document.getElementById('profit-percent').value) }) });
            showToast('Settings saved');
        };
    } catch(err) { if(!silent) container.innerHTML = '<div class="error-msg">Error loading settings</div>'; }
}

// ========== EXCEL EXPORT (SheetJS) ==========
function exportToExcel(type, data) {
    if(!data || data.length === 0) { showToast('No data to export', 'error'); return; }
    let sheetData = [];
    if(type === 'users') sheetData = data.map(u => ({ ID: u.id, Username: u.username, Balance: u.balance, Level: u.level, "Join Date": new Date(u.created_at).toLocaleString() }));
    else if(type === 'trades') sheetData = data.map(t => ({ User: t.username, Asset: t.asset_name, Amount: t.amount, Direction: t.direction, Result: t.result, Profit: t.profit, Date: new Date(t.created_at).toLocaleString() }));
    else if(type === 'deposits') sheetData = data.map(d => ({ User: d.username, Amount: d.amount, Status: d.status, Date: new Date(d.created_at).toLocaleString() }));
    else if(type === 'withdrawals') sheetData = data.map(w => ({ User: w.username, Amount: w.amount, UPI: w.upi_id, Status: w.status, Date: new Date(w.created_at).toLocaleString() }));
    else if(type === 'assets') sheetData = data.map(a => ({ ID: a.id, Name: a.name, Symbol: a.symbol, Price: a.price, Min: a.min_price, Max: a.max_price }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.toUpperCase());
    XLSX.writeFile(wb, `${type}_export.xlsx`);
    showToast(`Excel downloaded (${data.length} records)`);
}

// Start
if (adminToken) {
    initAdminPanel().catch(() => showLoginForm('Session expired. Please login again.'));
} else {
    showLoginForm();
}
