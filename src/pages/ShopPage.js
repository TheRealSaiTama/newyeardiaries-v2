import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderFilterSidebar, initFilterEvents } from '../components/FilterSidebar.js';
import { renderProductCard } from '../components/ProductCard.js';
import { getProducts } from '../data/products.js';
import { addToQuoteList } from '../data/store.js';

export async function renderShopPage() {
  const products = await getProducts();

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([
          { label: 'Home', path: '/' },
          { label: 'Collections', path: '/shop' },
          { label: 'All Diaries' },
        ])}

        <div class="shop-header">
          <div>
            <h1>The 2026 Diary Collection</h1>
            <p>Crafted for permanence. Discover our curated selection of premium diaries, designed to capture your thoughts, plans, and legacy.</p>
          </div>
          <div class="shop-controls">
            <button class="btn btn--secondary btn--sm filter-toggle-mobile" id="filter-toggle">
              <span class="material-symbols-outlined" style="font-size:16px;">tune</span>
              Filters
            </button>
            <select class="input-field select-field" style="width:auto;min-width:160px;" id="sort-select">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
            </select>
          </div>
        </div>

        <div class="shop-layout">
          ${renderFilterSidebar()}
          <div class="shop-main">
            <div class="product-grid" id="product-grid">
              ${products.map(p => renderProductCard(p)).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initFilterEvents();
  initShopEvents();
}

function initShopEvents() {
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    document.getElementById('filter-sidebar')?.classList.toggle('mobile-active');
  });
}
