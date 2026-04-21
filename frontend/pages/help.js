// Help Page Component
class HelpPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSupportClick: null,
      onHelpCenterClick: null,
      onEducationClick: null,
      onTutorialClick: null,
      ...options
    };
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    
    this.element.innerHTML = `
      <h2 style="margin-bottom: 20px;">Help & Support</h2>
      <div class="help-card" data-action="support">
        <i class="fas fa-headset" style="font-size: 24px; margin-right: 12px; color: #00ff88;"></i>
        <div style="flex: 1;">
          <strong>24/7 Support</strong>
          <p style="color: #888; font-size: 13px; margin-top: 4px;">We're here for you</p>
        </div>
        <i class="fas fa-chevron-right" style="color: #666;"></i>
      </div>
      <div class="help-card" data-action="helpcenter">
        <i class="fas fa-book" style="font-size: 24px; margin-right: 12px; color: #00ff88;"></i>
        <div style="flex: 1;">
          <strong>Help Center</strong>
          <p style="color: #888; font-size: 13px; margin-top: 4px;">Get to know the platform</p>
        </div>
        <i class="fas fa-chevron-right" style="color: #666;"></i>
      </div>
      <div class="help-card" data-action="education">
        <i class="fas fa-graduation-cap" style="font-size: 24px; margin-right: 12px; color: #00ff88;"></i>
        <div style="flex: 1;">
          <strong>Education</strong>
          <p style="color: #888; font-size: 13px; margin-top: 4px;">Expand your knowledge</p>
        </div>
        <i class="fas fa-chevron-right" style="color: #666;"></i>
      </div>
      <div class="help-card" data-action="tutorial">
        <i class="fas fa-chart-line" style="font-size: 24px; margin-right: 12px; color: #00ff88;"></i>
        <div style="flex: 1;">
          <strong>Trading Tutorials</strong>
          <p style="color: #888; font-size: 13px; margin-top: 4px;">Learn how to open a trade</p>
        </div>
        <i class="fas fa-chevron-right" style="color: #666;"></i>
      </div>
    `;
    
    // Add click handlers
    const cards = this.element.querySelectorAll('.help-card');
    cards.forEach(card => {
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        const action = card.dataset.action;
        this.handleAction(action);
      });
    });
    
    this.container.appendChild(this.element);
  }
  
  handleAction(action) {
    switch(action) {
      case 'support':
        if (this.options.onSupportClick) {
          this.options.onSupportClick();
        } else {
          alert('Contact support@tradingapp.com or live chat 24/7');
        }
        break;
      case 'helpcenter':
        if (this.options.onHelpCenterClick) {
          this.options.onHelpCenterClick();
        } else {
          alert('Check our FAQ and documentation at help.tradingapp.com');
        }
        break;
      case 'education':
        if (this.options.onEducationClick) {
          this.options.onEducationClick();
        } else {
          alert('Video courses and articles available in the Education section');
        }
        break;
      case 'tutorial':
        if (this.options.onTutorialClick) {
          this.options.onTutorialClick();
        } else {
          alert('Step-by-step guide: Select asset → Choose amount/time → Click UP or DOWN');
        }
        break;
    }
  }
  
  show() {
    if (this.element) {
      this.element.classList.add('active');
    }
  }
  
  hide() {
    if (this.element) {
      this.element.classList.remove('active');
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
  module.exports = HelpPage;
}