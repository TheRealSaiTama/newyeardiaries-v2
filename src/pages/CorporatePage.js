import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderFilterSidebar, initFilterEvents } from '../components/FilterSidebar.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';
import { getProducts } from '../data/products.js';
import { openQuickView } from '../components/QuickViewModal.js';

function isCorporateProduct(p) {
  const cat = `${p.category || ''} ${(p.categorySlugs || []).join(' ')} ${(p.tags || '')} ${p.name || ''}`.toLowerCase();
  return (
    cat.includes('corporate') ||
    cat.includes('gift set') ||
    cat.includes('gift-set') ||
    cat.includes('employee joining') ||
    cat.includes('give away') ||
    cat.includes('promotional') ||
    (Number(p.minBulkOrder) || 0) > 1
  );
}

export async function renderCorporatePage() {
  const products = await getProducts();
  const corporateProducts = products.filter(isCorporateProduct);

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page-content">
      <div class="static-hero">
        <div class="container">
          <div class="label" style="margin-bottom:var(--space-3);color:var(--color-accent);">Manufacturer Direct Pricing</div>
          <h1>Corporate Bulk Collections</h1>
          <p>Elevate your brand with meticulously crafted leather diaries. Designed for executives, personalized for your organization.</p>
        </div>
      </div>
      <div class="container section">
        ${renderBreadcrumbs([
          { label: 'Home', path: '/' },
          { label: 'Shop', path: '/shop' },
          { label: 'Corporate Collection' },
        ])}
        <div class="shop-layout">
          ${renderFilterSidebar()}
          <div class="shop-main">
            <div class="product-grid">
              ${corporateProducts.length
                ? corporateProducts.map(p => renderProductCard(p)).join('')
                : '<p class="text-body">No corporate products found. <a href="/shop">Browse all products</a>.</p>'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initFilterEvents();
  initProductCardSlideshows();
  document.querySelectorAll('.quick-view-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(btn.dataset.productId);
    });
  });
}
