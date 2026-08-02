import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderFilterSidebar, initFilterEvents } from '../components/FilterSidebar.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';
import { getProducts, formatPrice } from '../data/products.js';


export async function renderCorporatePage() {
  const products = await getProducts();
  const corporateProducts = products.filter(p => p.category === 'Corporate Gifting' || p.minBulkOrder > 1);

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
          { label: 'Diaries', path: '/shop' },
          { label: 'Corporate Collection' },
        ])}
        <div class="shop-layout">
          ${renderFilterSidebar()}
          <div class="shop-main">
            <div class="product-grid">
              ${corporateProducts.map(p => renderProductCard(p)).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initFilterEvents();
  initProductCardSlideshows();
  document.querySelectorAll('.quick-view-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openQuickView(btn.dataset.productId); });
  });

}
