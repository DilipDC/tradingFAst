// Reusable Modal Component
class TradingModal {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancel: true,
      onConfirm: null,
      onCancel: null,
      onClose: null,
      ...options
    };
    this.overlay = null;
    this.modal = null;
    this.isOpen = false;
  }

  render() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    
    // Create modal content
    this.modal = document.createElement('div');
    this.modal.className = 'modal-content';
    
    // Build modal HTML
    let buttonsHtml = `
      <button class="btn btn-primary" id="modal-confirm-btn">${this.options.confirmText}</button>
    `;
    if (this.options.showCancel) {
      buttonsHtml = `
        <button class="btn btn-secondary" id="modal-cancel-btn">${this.options.cancelText}</button>
        ${buttonsHtml}
      `;
    }
    
    this.modal.innerHTML = `
      ${this.options.title ? `<h3 style="margin-bottom: 15px;">${this.options.title}</h3>` : ''}
      <div id="modal-body">${this.options.content}</div>
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        ${buttonsHtml}
      </div>
    `;
    
    this.overlay.appendChild(this.modal);
    
    // Bind events
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    const confirmBtn = this.modal.querySelector('#modal-confirm-btn');
    if (confirmBtn && this.options.onConfirm) {
      confirmBtn.addEventListener('click', () => {
        this.options.onConfirm();
        this.close();
      });
    }
    
    if (this.options.showCancel) {
      const cancelBtn = this.modal.querySelector('#modal-cancel-btn');
      if (cancelBtn && this.options.onCancel) {
        cancelBtn.addEventListener('click', () => {
          this.options.onCancel();
          this.close();
        });
      } else if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.close());
      }
    }
  }
  
  open() {
    if (this.isOpen) return;
    this.render();
    document.body.appendChild(this.overlay);
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    if (!this.isOpen) return;
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
    this.isOpen = false;
    document.body.style.overflow = '';
    if (this.options.onClose) {
      this.options.onClose();
    }
  }
  
  setContent(content) {
    const bodyDiv = this.modal?.querySelector('#modal-body');
    if (bodyDiv) {
      if (typeof content === 'string') {
        bodyDiv.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        bodyDiv.innerHTML = '';
        bodyDiv.appendChild(content);
      }
    }
    this.options.content = content;
  }
  
  setTitle(title) {
    const titleEl = this.modal?.querySelector('h3');
    if (titleEl) {
      titleEl.textContent = title;
    } else if (title && this.modal) {
      const newTitle = document.createElement('h3');
      newTitle.style.marginBottom = '15px';
      newTitle.textContent = title;
      this.modal.insertBefore(newTitle, this.modal.firstChild);
    }
    this.options.title = title;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TradingModal;
}