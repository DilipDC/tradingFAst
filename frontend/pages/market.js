// Market Page Component (TradingFast)
class MarketPage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onAssetSelect: null,
      ...options
    };
    this.element = null;
    this.assets = [];
    this.render();
    this.loadAssets();
  }

  async loadAssets() {
    const API_URL = window.location.origin + '/api';
    try {
      const res = await fetch(`${API_URL}/admin/assets`);
      const data = await res.json();
      this.assets = data.assets || [];
      this.updateAssetList();
    } catch (err) {
      const listContainer = this.element.querySelector('#market-assets');
      if (listContainer) {
        listContainer.innerHTML = '<p style="text-align:center; color:#888;">Error loading assets</p>';
      }
    }
  }

  updateAssetList() {
    const listContainer = this.element.querySelector('#market-assets');
    if (!listContainer) return;
    
    if (this.assets.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:#888;">No assets available</p>';
      return;
    }
    
    listContainer.innerHTML = this.assets.map(asset => `
      <div class="asset-item" data-id="${asset.id}">
        <div class="asset-info">
          <h4>${asset.name}</h4>
          <p>${asset.symbol} | Min: ₹${asset.min_price} Max: ₹${asset.max_price}</p>
        </div>
        <div class="asset-current-price">₹${asset.price.toFixed(2)}</div>
      </div>
    `).join('');
    
    // Add click handlers
    const items = listContainer.querySelectorAll('.asset-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const assetId = parseInt(item.dataset.id);
        const selectedAsset = this.assets.find(a => a.id === assetId);
        if (this.options.onAssetSelect) {
          this.options.onAssetSelect(selectedAsset);
        }
      });
    });
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page active';
    this.element.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="background: linear-gradient(135deg, #fff, #00ff88); -webkit-background-clip: text; background-clip: text; color: transparent;">TradingFast Market</h2>
        <i class="fas fa-search" style="color: #888; font-size: 20px;"></i>
      </div>
      <div id="market-assets" class="asset-list">Loading assets...</div>
    `;
    this.container.appendChild(this.element);
  }

  refresh() {
    this.loadAssets();
  }

  show() {
    if (this.element) {
      this.element.classList.add('active');
      this.refresh();
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
  module.exports = MarketPage;
}