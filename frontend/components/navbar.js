// Reusable Bottom Navigation Bar Component
class BottomNavBar {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      items: [
        { id: 'terminal', icon: 'fas fa-chart-line', label: 'Terminal' },
        { id: 'trades', icon: 'fas fa-exchange-alt', label: 'Trades' },
        { id: 'market', icon: 'fas fa-store', label: 'Market' },
        { id: 'rewards', icon: 'fas fa-gift', label: 'Rewards' },
        { id: 'help', icon: 'fas fa-question-circle', label: 'Help' }
      ],
      activeItem: 'terminal',
      onItemClick: null,
      ...options
    };
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'bottom-nav';
    
    this.options.items.forEach(item => {
      const navItem = document.createElement('div');
      navItem.className = 'nav-item';
      if (this.options.activeItem === item.id) {
        navItem.classList.add('active');
      }
      navItem.dataset.page = item.id;
      navItem.innerHTML = `
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
      `;
      
      navItem.addEventListener('click', () => {
        this.setActive(item.id);
        if (this.options.onItemClick) {
          this.options.onItemClick(item.id);
        }
      });
      
      this.element.appendChild(navItem);
    });
    
    this.container.appendChild(this.element);
  }

  setActive(itemId) {
    const items = this.element.querySelectorAll('.nav-item');
    items.forEach(item => {
      if (item.dataset.page === itemId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    this.options.activeItem = itemId;
  }

  getActive() {
    return this.options.activeItem;
  }

  updateItems(items) {
    this.options.items = items;
    this.element.innerHTML = '';
    this.render();
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BottomNavBar;
}