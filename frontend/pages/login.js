// Login/Register Page Component
class AuthPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onLoginSuccess: null,
      onRegisterSuccess: null,
      ...options
    };
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'auth-container';
    this.element.style.cssText = 'min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    this.element.innerHTML = `
      <div class="glass-card" style="width: 100%; max-width: 400px; padding: 30px;">
        <h1 style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #00ff88, #00aa55); -webkit-background-clip: text; background-clip: text; color: transparent;">Trading App</h1>
        <div id="auth-form">
          <input type="text" id="auth-username" placeholder="Username" autocomplete="off">
          <input type="password" id="auth-password" placeholder="Password">
          <button class="btn btn-primary" id="auth-login-btn" style="width: 100%; margin-bottom: 10px;">Login</button>
          <button class="btn btn-secondary" id="auth-register-btn" style="width: 100%;">Register</button>
        </div>
        <div id="auth-error" style="color: #ff3355; margin-top: 15px; text-align: center;"></div>
      </div>
    `;
    
    // Bind events
    const loginBtn = this.element.querySelector('#auth-login-btn');
    const registerBtn = this.element.querySelector('#auth-register-btn');
    const usernameInput = this.element.querySelector('#auth-username');
    const passwordInput = this.element.querySelector('#auth-password');
    const errorDiv = this.element.querySelector('#auth-error');
    
    const handleAuth = async (mode) => {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      if (!username || !password) {
        errorDiv.textContent = 'Please fill all fields';
        return;
      }
      
      const API_URL = window.location.origin + '/api';
      try {
        const res = await fetch(`${API_URL}/auth/${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          if (mode === 'login' && this.options.onLoginSuccess) {
            this.options.onLoginSuccess(data.user);
          } else if (mode === 'register' && this.options.onRegisterSuccess) {
            this.options.onRegisterSuccess(data.user);
          }
        } else {
          errorDiv.textContent = data.error || 'Authentication failed';
        }
      } catch (err) {
        errorDiv.textContent = 'Network error';
      }
    };
    
    loginBtn.onclick = () => handleAuth('login');
    registerBtn.onclick = () => handleAuth('register');
    
    this.container.appendChild(this.element);
  }
  
  show() {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }
  
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
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
  module.exports = AuthPage;
}