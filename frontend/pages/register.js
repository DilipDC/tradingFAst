// Register Page Component (TradingFast)
class RegisterPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onRegisterSuccess: null,
      onLoginClick: null,
      ...options
    };
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    this.element.style.cssText = 'min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    this.element.innerHTML = `
      <div class="glass-card" style="width: 100%; max-width: 400px; padding: 30px;">
        <h2 style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #00ff88, #00aa55); -webkit-background-clip: text; background-clip: text; color: transparent;">TradingFast</h2>
        <div id="register-form">
          <input type="text" id="reg-username" placeholder="Username" autocomplete="off">
          <input type="password" id="reg-password" placeholder="Password (min 4 chars)">
          <input type="password" id="reg-confirm" placeholder="Confirm Password">
          <button class="btn btn-primary" id="reg-submit-btn" style="width: 100%; margin-bottom: 10px;">Create Account</button>
          <button class="btn btn-secondary" id="reg-login-btn" style="width: 100%;">Back to Login</button>
        </div>
        <div id="reg-error" style="color: #ff3355; margin-top: 15px; text-align: center;"></div>
      </div>
    `;
    
    // Bind events
    const submitBtn = this.element.querySelector('#reg-submit-btn');
    const loginBtn = this.element.querySelector('#reg-login-btn');
    const usernameInput = this.element.querySelector('#reg-username');
    const passwordInput = this.element.querySelector('#reg-password');
    const confirmInput = this.element.querySelector('#reg-confirm');
    const errorDiv = this.element.querySelector('#reg-error');
    
    submitBtn.onclick = async () => {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;
      
      if (!username || !password) {
        errorDiv.textContent = 'Please fill all fields';
        return;
      }
      if (password.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters';
        return;
      }
      if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
      }
      
      const API_URL = window.location.origin + '/api';
      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          if (this.options.onRegisterSuccess) {
            this.options.onRegisterSuccess(data.user);
          }
        } else {
          errorDiv.textContent = data.error || 'Registration failed';
        }
      } catch (err) {
        errorDiv.textContent = 'Network error';
      }
    };
    
    loginBtn.onclick = () => {
      if (this.options.onLoginClick) {
        this.options.onLoginClick();
      }
    };
    
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
  module.exports = RegisterPage;
}