// Admin panel – with better error reporting
const API_URL = window.location.origin + '/api';

let adminToken = localStorage.getItem('adminToken');

// Show login screen
function showLoginForm(errorMsg = '') {
  document.body.innerHTML = `
    <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0a; padding:20px;">
      <div style="background:#111118; border-radius:24px; padding:40px; width:100%; max-width:400px;">
        <h2 style="text-align:center; color:#00ff88;">Admin Login</h2>
        ${errorMsg ? `<p style="color:#ff6680; text-align:center;">${errorMsg}</p>` : ''}
        <input type="text" id="admin-username" placeholder="Username" style="width:100%; margin:10px 0; padding:12px;">
        <input type="password" id="admin-password" placeholder="Password" style="width:100%; margin:10px 0; padding:12px;">
        <button id="admin-login-btn" style="background:#00ff88; color:#000; width:100%; padding:12px; border:none; border-radius:30px;">Login</button>
        <div id="login-error" style="color:#ff6680; margin-top:15px;"></div>
      </div>
    </div>
  `;
  document.getElementById('admin-login-btn').onclick = async () => {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.user.username === 'admin') {
        localStorage.setItem('adminToken', data.token);
        location.reload();
      } else {
        document.getElementById('login-error').innerText = 'Invalid admin credentials';
      }
    } catch(e) {
      document.getElementById('login-error').innerText = 'Network error – backend not reachable?';
    }
  };
}

// After login, load admin panel
async function loadAdminPanel() {
  document.body.innerHTML = `<div style="text-align:center; padding:50px;">Loading admin panel...</div>`;
  try {
    // Test API connection
    const testRes = await fetch(`${API_URL}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!testRes.ok) throw new Error(`HTTP ${testRes.status}`);
    
    // If we get here, token is valid – load the full admin interface
    // (You can reuse your original admin rendering code here, or I can provide a simplified version)
    // For brevity, I'll show a simple working dashboard.
    const data = await testRes.json();
    document.body.innerHTML = `
      <div style="padding:20px; background:#0a0a0a; color:white;">
        <h1 style="color:#00ff88;">Admin Dashboard</h1>
        <p>Settings: ${JSON.stringify(data.settings)}</p>
        <button onclick="localStorage.clear(); location.reload();">Logout</button>
      </div>
    `;
  } catch(err) {
    document.body.innerHTML = `<div style="color:#ff6680; padding:20px;">Error loading admin: ${err.message}<br><button onclick="localStorage.clear(); location.reload();">Retry Login</button></div>`;
  }
}

// Start
if (adminToken) {
  loadAdminPanel();
} else {
  showLoginForm();
}
