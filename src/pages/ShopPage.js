import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderFilterSidebar, initFilterEvents } from '../components/FilterSidebar.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';
import { getProducts } from '../data/products.js';
import { CATEGORY_GROUPS } from '../lib/categories.js';

const PRODUCTS_PER_PAGE = 12;
const PAGE_TITLES = {
  'Corporate Gift Sets': { title: 'Corporate Gift Sets', desc: 'Premium corporate gifting solutions — curated sets and gift packages that leave a lasting impression.' },
  'Business Gifts': { title: 'Business Gifts', desc: 'Professional business gifting — eco-friendly, practical, and memorable.' },
  'New Year Diary': { title: 'New Year Diary', desc: 'Discover our curated selection of premium diaries, designed to capture your thoughts, plans, and legacy.' },
  'Premium Diary': { title: 'Premium Diary', desc: 'Luxury diaries crafted from the finest materials — leather, PU, and more.' },
  Calendars: { title: 'Calendars', desc: 'Premium calendars for the new year — desk and table designs.' },
  'Customized Note Books': { title: 'Customized Note Books', desc: 'Personalized notebooks for every need — custom covers, pen included options.' },
  'Leather Gifts': { title: 'Leather Gifts', desc: 'Handcrafted leather gifts — certificate folders, wallets, and accessories.' },
  'Leather Planners': { title: 'Leather Planners', desc: 'Premium leather planners — crafted for focus, productivity, and style.' },
  'Promotional Gifts': { title: 'Promotional Gifts', desc: 'Promotional products for brand visibility — pens, mugs, bags, and more.' },
};

export async function renderShopPage() {
  const params = new URLSearchParams(window.location.search);
  const catSlug = params.get('cat');
  const groupName = params.get('group');
  const searchQ = params.get('q');
  const pageParam = parseInt(params.get('page')) || 1;
  const allProducts = await getProducts();

  let products;
  let pageTitle = 'The 2026 Diary Collection';
  let pageDesc = 'Crafted for permanence. Discover our curated selection of premium diaries, designed to capture your thoughts, plans, and legacy.';
  let breadcrumbLabel = 'All Diaries';

  if (searchQ) {
    const q = searchQ.toLowerCase();
    products = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.shortDescription || '').toLowerCase().includes(q) ||
      (p.categoryName || '').toLowerCase().includes(q) ||
      (p.badge || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.tags || '').toLowerCase().includes(q)
    );
    pageTitle = `Search: "${searchQ}"`;
    pageDesc = `${products.length} result${products.length !== 1 ? 's' : ''} found`;
    breadcrumbLabel = `Search: "${searchQ}"`;
  } else if (catSlug) {
    products = allProducts.filter(p => (p.category || '').toLowerCase() === catSlug.toLowerCase());
    pageTitle = catSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    pageDesc = '';
    breadcrumbLabel = pageTitle;
  } else if (groupName && CATEGORY_GROUPS[groupName]) {
    const slugs = CATEGORY_GROUPS[groupName];
    products = allProducts.filter(p => slugs.includes(p.category));
    const meta = PAGE_TITLES[groupName];
    if (meta) { pageTitle = meta.title; pageDesc = meta.desc; }
    breadcrumbLabel = groupName;
  } else {
    products = allProducts;
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(pageParam, totalPages);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = products.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([
          { label: 'Home', path: '/' },
          { label: 'Collections', path: '/shop' },
          { label: breadcrumbLabel },
        ])}

        <div class="shop-header">
          <div>
            <h1>${pageTitle}</h1>
            ${pageDesc ? `<p>${pageDesc}</p>` : ''}
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
              ${pageProducts.length > 0 ? pageProducts.map(p => renderProductCard(p)).join('') : `
                <div class="no-results" style="grid-column:1/-1;text-align:center;padding:var(--space-12) var(--space-4);">
                  <span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);">search_off</span>
                  <p style="margin-top:var(--space-4);color:var(--color-text-secondary);">No products found${searchQ ? ` for "${searchQ}"` : ''}. Try adjusting your filters.</p>
                </div>
              `}
            </div>

            ${totalPages > 1 ? `
              <div class="shop-pagination">
                <button class="shop-pag-btn" id="pag-prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
                  <span class="material-symbols-outlined">chevron_left</span>
                </button>
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                  <button class="shop-pag-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
                `).join('')}
                <button class="shop-pag-btn" id="pag-next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <button id="go-top-btn" class="go-top-btn" aria-label="Go to top">
      <span class="material-symbols-outlined">keyboard_arrow_up</span>
    </button>
  `;

  initFilterEvents();
  initShopEvents(products, currentPage, totalPages, searchQ);
  initProductCardSlideshows();
}

function buildPageUrl(page) {
  const params = new URLSearchParams(window.location.search);
  params.set('page', String(page));
  return `/shop?${params.toString()}`;
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

function keywordMatch(product, keyword) {
  const kw = keyword.toLowerCase();
  const searchable = [
    product.name,
    product.material,
    product.size,
    product.description,
    product.longDescription,
    product.tagline,
    product.tags,
    product.category,
  ].filter(Boolean).join(' ').toLowerCase();
  return searchable.includes(kw);
}

function applyFilters(allProducts) {
  const { material, size, price } = getActiveFilters();
  let filtered = allProducts;
  if (material.length > 0) filtered = filtered.filter(p => material.some(m => keywordMatch(p, m)));
  if (size.length > 0) filtered = filtered.filter(p => size.some(s => keywordMatch(p, s)));
  if (price.length > 0) filtered = filtered.filter(p => {
    const pPrice = Number(p.price) || 0;
    return price.some(range => {
      const [min, max] = range.split('-').map(Number);
      return pPrice >= min && pPrice < max;
    });
  });
  return filtered;
}

function initShopEvents(products, currentPage, totalPages, searchQ) {
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    document.getElementById('filter-sidebar')?.classList.toggle('mobile-active');
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const sorted = applyFilters(products);
    const val = e.target.value;
    if (val.includes('Low to High')) sorted.sort((a, b) => a.price - b.price);
    else if (val.includes('High to Low')) sorted.sort((a, b) => b.price - a.price);
    else if (val.includes('Newest')) sorted.sort((a, b) => b.sortOrder - a.sortOrder);
    renderFilteredGrid(sorted, 1, Math.max(1, Math.ceil(sorted.length / PRODUCTS_PER_PAGE)), searchQ);
  });

  document.querySelectorAll('.filter-sidebar input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const filtered = applyFilters(products);
      const sortVal = document.getElementById('sort-select')?.value || '';
      if (sortVal.includes('Low to High')) filtered.sort((a, b) => a.price - b.price);
      else if (sortVal.includes('High to Low')) filtered.sort((a, b) => b.price - a.price);
      else if (sortVal.includes('Newest')) filtered.sort((a, b) => b.sortOrder - a.sortOrder);
      renderFilteredGrid(filtered, 1, Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE)), searchQ);
    });
  });

  document.getElementById('pag-prev')?.addEventListener('click', () => {
    if (currentPage > 1) window.location.href = buildPageUrl(currentPage - 1);
  });
  document.getElementById('pag-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) window.location.href = buildPageUrl(currentPage + 1);
  });
  document.querySelectorAll('.shop-pag-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = buildPageUrl(parseInt(btn.dataset.page));
    });
  });

  const goTopBtn = document.getElementById('go-top-btn');
  window.addEventListener('scroll', () => {
    if (goTopBtn) goTopBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  }, { passive: true });
  goTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function renderFilteredGrid(filteredProducts, currentPage, totalPages, searchQ) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const PRODUCTS_PER_PAGE = 12;
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = filteredProducts.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

  if (pageProducts.length === 0) {
    grid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1;text-align:center;padding:var(--space-12) var(--space-4);">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);">search_off</span>
        <p style="margin-top:var(--space-4);color:var(--color-text-secondary);">No products match your filters. Try adjusting your selection.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = pageProducts.map(p => renderProductCard(p)).join('');
  initProductCardSlideshows(grid);

  const mainEl = document.querySelector('.shop-main');
  const existingPag = mainEl?.querySelector('.shop-pagination');
  if (existingPag) existingPag.remove();

  if (totalPages > 1) {
    const pagDiv = document.createElement('div');
    pagDiv.className = 'shop-pagination';
    pagDiv.innerHTML = `
      <button class="shop-pag-btn" id="pag-prev" ${currentPage <= 1 ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_left</span></button>
      ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
        <button class="shop-pag-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
      `).join('')}
      <button class="shop-pag-btn" id="pag-next" ${currentPage >= totalPages ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_right</span></button>
    `;
    grid.after(pagDiv);

    document.getElementById('pag-prev')?.addEventListener('click', () => {
      if (currentPage > 1) window.location.href = buildPageUrl(currentPage - 1);
    });
    document.getElementById('pag-next')?.addEventListener('click', () => {
      if (currentPage < totalPages) window.location.href = buildPageUrl(currentPage + 1);
    });
    document.querySelectorAll('.shop-pag-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = buildPageUrl(parseInt(btn.dataset.page));
      });
    });
  }
}