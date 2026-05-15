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
  initShopEvents(products);
}

function getActiveFilters() {
  const checked = document.querySelectorAll('.filter-sidebar input[type=checkbox]:checked');
  const active = { material: [], size: [], price: [] };
  checked.forEach(cb => {
    const name = cb.getAttribute('name');
    if (name === 'material') active.material.push(cb.value);
    else if (name === 'size') active.size.push(cb.value);
    else if (name === 'price') active.price.push(cb.value);
  });
  return active;
}

function applyFilters(allProducts) {
  const { material, size, price } = getActiveFilters();

  let filtered = allProducts;

  if (material.length > 0) {
    filtered = filtered.filter(p =>
      material.some(m => (p.material || '').toLowerCase().includes(m.toLowerCase()))
    );
  }

  if (size.length > 0) {
    filtered = filtered.filter(p =>
      size.some(s => (p.size || '').toUpperCase().includes(s.toUpperCase()))
    );
  }

  if (price.length > 0) {
    filtered = filtered.filter(p => {
      const pPrice = Number(p.price) || 0;
      return price.some(range => {
        const [min, max] = range.split('-').map(Number);
        return pPrice >= min && pPrice < max;
      });
    });
  }

  return filtered;
}

function initShopEvents(products) {
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    document.getElementById('filter-sidebar')?.classList.toggle('mobile-active');
  });

  // Sort handler
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const sorted = applyFilters(products);
    const val = e.target.value;
    if (val.includes('Low to High')) sorted.sort((a, b) => a.price - b.price);
    else if (val.includes('High to Low')) sorted.sort((a, b) => b.price - a.price);
    else if (val.includes('Newest')) sorted.sort((a, b) => b.sortOrder - a.sortOrder);
    renderFilteredGrid(sorted);
  });

  // Filter checkbox handler
  document.querySelectorAll('.filter-sidebar input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const filtered = applyFilters(products);
      // Re-apply current sort
      const sortVal = document.getElementById('sort-select')?.value || '';
      if (sortVal.includes('Low to High')) filtered.sort((a, b) => a.price - b.price);
      else if (sortVal.includes('High to Low')) filtered.sort((a, b) => b.price - a.price);
      else if (sortVal.includes('Newest')) filtered.sort((a, b) => b.sortOrder - a.sortOrder);
      renderFilteredGrid(filtered);
    });
  });
}

function renderFilteredGrid(filteredProducts) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1;text-align:center;padding:var(--space-12) var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);">search_off</span>
        <p style="margin-top:var(--space-4);color:var(--color-text-secondary);">No products match your filters. Try adjusting your selection.</p>
      </div>
    `;
  } else {
    grid.innerHTML = filteredProducts.map(p => renderProductCard(p)).join('');
  }
}
