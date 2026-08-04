import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderFilterSidebar, initFilterEvents } from '../components/FilterSidebar.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';
import { renderProductCardSkeleton } from '../components/Skeleton.js';
import { getProducts } from '../data/products.js';
import { CATEGORY_GROUPS, fetchCategories, getCategorySlugsByGroupName } from '../lib/categories.js';
import { navigateTo } from '../router.js';
import { buildShopPageUrl, renderPaginationButtonsHtml } from '../lib/shopPagination.js';

const PRODUCTS_PER_PAGE = 12;

function buildPageUrl(page) {
  return buildShopPageUrl(page, window.location.search || '');
}

function getCurrentShopPage() {
  return parseInt(new URLSearchParams(window.location.search).get('page'), 10) || 1;
}

function getTotalPagesFromDom() {
  const root = document.querySelector('.shop-pagination');
  if (root?.dataset.total) {
    const t = parseInt(root.dataset.total, 10);
    if (!Number.isNaN(t) && t > 0) return t;
  }
  const pages = [...document.querySelectorAll('.shop-pagination .shop-pag-btn[data-page]')]
    .map((b) => parseInt(b.dataset.page, 10))
    .filter((n) => !Number.isNaN(n));
  return pages.length ? Math.max(...pages) : 1;
}

function mountPagination(container, currentPage, totalPages, insertAfterEl) {
  if (!container && !insertAfterEl) return;
  const existing = (container || insertAfterEl.parentElement)?.querySelector?.('.shop-pagination')
    || document.querySelector('.shop-pagination');
  if (existing) existing.remove();
  if (totalPages <= 1) return;
  const pagDiv = document.createElement('div');
  pagDiv.className = 'shop-pagination';
  pagDiv.dataset.total = String(totalPages);
  pagDiv.innerHTML = `
    <button type="button" class="shop-pag-btn" id="pag-prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
      <span class="material-symbols-outlined">chevron_left</span>
    </button>
    ${renderPaginationButtonsHtml(currentPage, totalPages)}
    <button type="button" class="shop-pag-btn" id="pag-next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
  `;
  if (insertAfterEl) insertAfterEl.after(pagDiv);
  else if (container) container.appendChild(pagDiv);
  ensurePaginationDelegation();
}

function ensurePaginationDelegation() {
  if (window.__shopPagBound) return;
  window.__shopPagBound = true;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.shop-pag-btn');
    if (!btn || !btn.closest('.shop-pagination')) return;
    if (btn.disabled || btn.getAttribute('disabled') != null) return;
    e.preventDefault();
    if (btn.id === 'pag-prev') {
      const current = getCurrentShopPage();
      if (current > 1) navigateTo(buildPageUrl(current - 1));
      return;
    }
    if (btn.id === 'pag-next') {
      const current = getCurrentShopPage();
      const total = getTotalPagesFromDom();
      if (current < total) navigateTo(buildPageUrl(current + 1));
      return;
    }
    if (btn.dataset.page) {
      const page = parseInt(btn.dataset.page, 10);
      if (!Number.isNaN(page)) navigateTo(buildPageUrl(page));
    }
  });
}

ensurePaginationDelegation();

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

  // Resolve title/breadcrumb synchronously so the skeleton renders with the
  // right heading from the very first paint.
  let pageTitle = 'The 2027 Diary Collection';
  let pageDesc = 'Crafted for permanence. Discover our curated selection of premium diaries, designed to capture your thoughts, plans, and legacy.';
  let breadcrumbLabel = 'All Diaries';
  if (searchQ) {
    pageTitle = `Search: "${searchQ}"`;
    breadcrumbLabel = `Search: "${searchQ}"`;
  } else if (catSlug) {
    pageTitle = catSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    breadcrumbLabel = pageTitle;
  } else if (groupName) {
    const meta = PAGE_TITLES[groupName];
    if (meta) { pageTitle = meta.title; pageDesc = meta.desc; }
    else { pageTitle = groupName; }
    breadcrumbLabel = groupName;
  }

  // ===== Step 1: paint the page shell + skeleton grid SYNCHRONOUSLY =====
  // This prevents the white-screen gap before Supabase returns products.
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
            <select class="input-field select-field" style="width:auto;min-width:160px;" id="sort-select" aria-label="Sort products">
              <option value="featured">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
        <div class="shop-layout">
          ${renderFilterSidebar()}
          <div class="shop-main">
            <div class="product-grid" id="product-grid">
              ${renderProductCardSkeleton(8)}
            </div>
          </div>
        </div>
      </div>
    </div>
    <button id="go-top-btn" class="go-top-btn" aria-label="Go to top">
      <span class="material-symbols-outlined">keyboard_arrow_up</span>
    </button>
  `;
  initFilterEvents();
  initGoTopButton();

  // ===== Step 2: fetch products and re-render the grid in place =====
  // Warm the categories cache so the group filter can resolve slugs from
  // the DB (admin changes propagate within the cache TTL).
  const allCategories = await fetchCategories();
  // Expose for downstream consumers (mega menu in Header re-uses the same).
  window.__cachedCategories = allCategories;

  // H3.5 fix: use the 30s product cache instead of bypassing it on every
  // render. The cache is invalidated on `nyd-products-updated` after admin
  // edits, so deleted products still drop out within a few seconds.
  const allProducts = await getProducts();

  // A product matches a category slug if it's the primary category OR it appears
  // in the product_categories junction for that slug. The junction lets us
  // correctly surface products tagged in subcategories when a parent group is
  // selected from the navbar.
  function productInCategory(p, slug) {
    if (!slug) return false;
    const s = slug.toLowerCase();
    if ((p.categorySlug || '').toLowerCase() === s) return true;
    if ((p.category || '').toLowerCase() === s) return true;
    return (p.categorySlugs || []).some(x => (x || '').toLowerCase() === s);
  }
  function productInGroup(p, slugs) {
    if (!slugs || !slugs.length) return false;
    return slugs.some(s => productInCategory(p, s));
  }

  let products;
  if (searchQ) {
    const q = searchQ.toLowerCase();
    products = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.shortDescription || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.badge || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.tags || '').toLowerCase().includes(q)
    );
  } else if (catSlug) {
    products = allProducts.filter(p => productInCategory(p, catSlug));
  } else if (groupName) {
    // Resolve the group's slugs from the DB cache (warmed by Header on boot,
    // refreshed by the post-load background fetcher). Falls back to the
    // hardcoded map only if the cache is empty AND the group is known.
    let slugs = getCategorySlugsByGroupName(groupName);
    if (!slugs.length && CATEGORY_GROUPS[groupName]) slugs = CATEGORY_GROUPS[groupName];
    products = slugs.length
      ? allProducts.filter(p => productInGroup(p, slugs))
      : [];
  } else {
    products = allProducts;
  }

  // Compute per-category featured slugs once, used for both initial render
  // and the sort/filter event handlers.
  const featuredSlugs = resolveFeaturedSlugs(products, { cat: catSlug, group: groupName, _groupSlugs: (groupName ? (getCategorySlugsByGroupName(groupName).length ? getCategorySlugsByGroupName(groupName) : (CATEGORY_GROUPS[groupName] || [])) : []) });
  const usePerCategoryFeatured = featuredSlugs.length > 0;

  // Apply default sorting (Featured is the default option) before slicing
  if (usePerCategoryFeatured) {
    products = products.slice().sort(categoryFeaturedSort(featuredSlugs));
  } else {
    products = products.slice().sort(globalFeaturedSort);
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(pageParam, totalPages);
  const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = products.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);

  // In-place update: replace skeleton with real grid, refresh pagination.
  const grid = document.getElementById('product-grid');
  if (grid) {
    grid.innerHTML = pageProducts.length > 0
      ? pageProducts.map(p => renderProductCard(p)).join('')
      : `
        <div class="no-results" style="grid-column:1/-1;text-align:center;padding:var(--space-12) var(--space-4);">
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);">search_off</span>
          <p style="margin-top:var(--space-4);color:var(--color-text-secondary);">No products found${searchQ ? ` for "${searchQ}"` : ''}. Try adjusting your filters.</p>
        </div>
      `;
    initProductCardSlideshows(grid);
  }

  const mainEl = document.querySelector('.shop-main');
  mountPagination(mainEl, currentPage, totalPages);

  initShopEvents(products, currentPage, totalPages, searchQ, usePerCategoryFeatured, featuredSlugs);
  initGoTopButton();

  // Cache the rendered HTML for this filter state so re-navigating to
  // the same /shop URL is instant. The router re-runs __reinitPage.
  try {
    const appEl = document.getElementById('app');
    const html = appEl ? appEl.innerHTML : '';
    if (html && html.length < 800_000) {
      const prefix = window.__nydPageCachePrefix || '__nyd_page_cache:';
      const path = window.location.pathname || '/';
      const search = window.location.search || '';
      sessionStorage.setItem(prefix + path + search, JSON.stringify({ html, t: Date.now() }));
    }
  } catch { /* quota or disabled — ignore */ }
}

function reinitShopPage() {
  try { ensurePaginationDelegation(); } catch (e) { console.warn('[shop] pagination init failed:', e); }
  try { initFilterEvents(); } catch (e) { console.warn('[shop] filter events init failed:', e); }
  try { initGoTopButton(); } catch (e) { console.warn('[shop] go-top init failed:', e); }
  try { initProductCardSlideshows(); } catch (e) { console.warn('[shop] slideshow init failed:', e); }
}

// Hook for the router: dispatch by pathname so the homepage and shop can
// each provide their own reinit without clobbering each other.
const existingReinit = window.__reinitPage;
window.__reinitPage = function reinitPageDispatch() {
  const path = window.location.pathname || '/';
  if (path === '/shop' || path.startsWith('/shop')) {
    if (typeof reinitShopPage === 'function') reinitShopPage();
  } else {
    if (typeof existingReinit === 'function') existingReinit();
  }
};
window.__reinitShopPage = reinitShopPage;

// In-place data refresh for cache-paint navigations. Re-fetches products and
// swaps the grid + pagination in place — never re-paints the shell, so the
// user never sees a skeleton flash after the instant cache paint.
window.__nydCacheRefresh = async function nydCacheRefreshShop() {
  if (!window.location.pathname.startsWith('/shop')) return;
  const grid = document.getElementById('product-grid');
  if (!grid) return; // shop page hasn't mounted yet
  try {
    const allProducts = await getProducts();
    const params = new URLSearchParams(window.location.search);
    const catSlug = params.get('cat');
    const groupName = params.get('group');
    const searchQ = params.get('q');
    function productInCategory(p, slug) {
      if (!slug) return false;
      const s = slug.toLowerCase();
      if ((p.categorySlug || '').toLowerCase() === s) return true;
      if ((p.category || '').toLowerCase() === s) return true;
      return (p.categorySlugs || []).some(x => (x || '').toLowerCase() === s);
    }
    function productInGroup(p, slugs) {
      if (!slugs || !slugs.length) return false;
      return slugs.some(s => productInCategory(p, s));
    }
    let products;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      products = allProducts.filter(p => (p.name || '').toLowerCase().includes(q));
    } else if (catSlug) {
      products = allProducts.filter(p => productInCategory(p, catSlug));
    } else if (groupName) {
      let slugs = getCategorySlugsByGroupName(groupName);
      if (!slugs.length && CATEGORY_GROUPS[groupName]) slugs = CATEGORY_GROUPS[groupName];
      products = slugs.length ? allProducts.filter(p => productInGroup(p, slugs)) : [];
    } else {
      products = allProducts;
    }
    // Apply sorting before pagination
    const sortSelect = document.getElementById('sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'Sort by: Featured';

    const featuredSlugs = resolveFeaturedSlugs(products, { cat: catSlug, group: groupName, _groupSlugs: (groupName ? (getCategorySlugsByGroupName(groupName).length ? getCategorySlugsByGroupName(groupName) : (CATEGORY_GROUPS[groupName] || [])) : []) });
    const usePerCategoryFeatured = featuredSlugs.length > 0;

    if (sortVal.includes('Low to High')) {
      products = products.slice().sort((a, b) => a.price - b.price);
    } else if (sortVal.includes('High to Low')) {
      products = products.slice().sort((a, b) => b.price - a.price);
    } else if (sortVal.includes('Newest')) {
      products = products.slice().sort((a, b) => {
        if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
        return (b.sortOrder || 0) - (a.sortOrder || 0);
      });
    } else if (usePerCategoryFeatured) {
      products = products.slice().sort(categoryFeaturedSort(featuredSlugs));
    } else {
      products = products.slice().sort(globalFeaturedSort);
    }

    const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
    const pageParam = parseInt(params.get('page')) || 1;
    const currentPage = Math.min(pageParam, totalPages);
    const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const pageProducts = products.slice(startIdx, startIdx + PRODUCTS_PER_PAGE);
    grid.innerHTML = pageProducts.length > 0
      ? pageProducts.map(p => renderProductCard(p)).join('')
      : `<div class="no-results" style="grid-column:1/-1;text-align:center;padding:var(--space-12) var(--space-4);"><span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);">search_off</span><p style="margin-top:var(--space-4);color:var(--color-text-secondary);">No products found${searchQ ? ` for "${searchQ}"` : ''}.</p></div>`;
    initProductCardSlideshows(grid);
    mountPagination(document.querySelector('.shop-main'), currentPage, totalPages);
    window.__shopProducts = products;
    window.__shopFeaturedSlugs = featuredSlugs;
    window.__shopUsePerCategoryFeatured = usePerCategoryFeatured;
    window.__shopSearchQ = searchQ || '';
    initShopEvents(products, currentPage, totalPages, searchQ, usePerCategoryFeatured, featuredSlugs);
  } catch (e) { console.warn('[shop] in-place refresh failed:', e); }
};

// Go-to-top button wiring, factored out so the page works whether the button
// is in the initial skeleton render or only added after products resolve.
function initGoTopButton() {
  const goTopBtn = document.getElementById('go-top-btn');
  if (!goTopBtn || goTopBtn.dataset.bound === '1') return;
  goTopBtn.dataset.bound = '1';
  goTopBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  window.addEventListener('scroll', () => {
    goTopBtn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  }, { passive: true });
  goTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Per-category "Featured" sort. The first matching slug (from the page's
 * category param or the active group) wins. A to Z diary collection always
 * sorts alphabetically regardless of sort_order.
 */
function categoryFeaturedSort(slugs) {
  const isAZ = (slugs || []).some(s => s === 'a-to-z-diary-collection');
  if (isAZ) {
    return (a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
  }
  return (a, b) => {
    let sa = null, sb = null;
    for (const s of slugs) {
      if (sa == null && a.categorySortOrders && a.categorySortOrders[s] != null) sa = a.categorySortOrders[s];
      if (sb == null && b.categorySortOrders && b.categorySortOrders[s] != null) sb = b.categorySortOrders[s];
      if (sa != null && sb != null) break;
    }
    const valA = (sa != null && sa > 0) ? sa : ((a.sortOrder && a.sortOrder > 0) ? a.sortOrder : 999999);
    const valB = (sb != null && sb > 0) ? sb : ((b.sortOrder && b.sortOrder > 0) ? b.sortOrder : 999999);
    if (valA !== valB) return valA - valB;
    if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
    return (a.name || '').localeCompare(b.name || '');
  };
}

function globalFeaturedSort(a, b) {
  const sa = a.sortOrder || 0;
  const sb = b.sortOrder || 0;
  const valA = sa <= 0 ? 999999 : sa;
  const valB = sb <= 0 ? 999999 : sb;
  if (valA !== valB) return valA - valB;
  if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
  return (a.name || '').localeCompare(b.name || '');
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

function keywordMatch(product, keyword, field) {
  // Prefer exact field match for material/size filters (avoids "A5" matching random text)
  const kw = keyword.toLowerCase();
  if (field === 'material') {
    return String(product.material || '').toLowerCase().includes(kw)
      || String(product.tags || '').toLowerCase().includes(kw);
  }
  if (field === 'size') {
    return String(product.size || '').toLowerCase() === kw
      || String(product.size || '').toLowerCase().includes(kw);
  }
  const searchable = [
    product.name,
    product.material,
    product.size,
    product.shortDescription,
    product.description,
    product.tagline,
    product.tags,
    product.category,
  ].filter(Boolean).join(' ').toLowerCase();
  return searchable.includes(kw);
}


function resolveFeaturedSlugs(products, params) {
  // Picks the slugs to use for per-category featured sort.
  // Priority: ?cat= override > ?group= override > first product's categorySlugs.
  if (params && params.cat) return [params.cat];
  if (params && params.group) {
    // The page may already have the slugs from the group lookup
    return (params._groupSlugs) || [];
  }
  // Fallback: use any product's primary categorySlugs (rare)
  return [];
}
function applyFilters(allProducts) {
  const { material, size, price } = getActiveFilters();
  let filtered = allProducts;
  if (material.length > 0) filtered = filtered.filter(p => material.some(m => keywordMatch(p, m, 'material')));
  if (size.length > 0) filtered = filtered.filter(p => size.some(s => keywordMatch(p, s, 'size')));
  if (price.length > 0) filtered = filtered.filter(p => {
    const pPrice = Number(p.price) || 0;
    return price.some(range => {
      const [min, max] = range.split('-').map(Number);
      return pPrice >= min && pPrice < max;
    });
  });
  return filtered;
}

function initShopEvents(products, currentPage, totalPages, searchQ, usePerCategoryFeatured, featuredSlugs) {
  window.__shopProducts = products;
  window.__shopFeaturedSlugs = featuredSlugs;
  window.__shopUsePerCategoryFeatured = usePerCategoryFeatured;
  window.__shopSearchQ = searchQ;

  function applySort(list, val) {
    const sorted = list.slice();
    const useFeat = window.__shopUsePerCategoryFeatured;
    const featSlugs = window.__shopFeaturedSlugs || [];
    if (val === 'price-asc' || val.includes('Low to High')) sorted.sort((a, b) => a.price - b.price);
    else if (val === 'price-desc' || val.includes('High to Low')) sorted.sort((a, b) => b.price - a.price);
    else if (val === 'newest' || val.includes('Newest')) {
      sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
        return (b.sortOrder || 0) - (a.sortOrder || 0);
      });
    } else if (useFeat) sorted.sort(categoryFeaturedSort(featSlugs));
    else sorted.sort(globalFeaturedSort);
    return sorted;
  }

  function rerenderFromFilters() {
    const productsNow = window.__shopProducts || [];
    const sortVal = document.getElementById('sort-select')?.value || 'featured';
    const filtered = applySort(applyFilters(productsNow), sortVal);
    renderFilteredGrid(filtered, 1, Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE)), window.__shopSearchQ || '');
  }

  const filterToggle = document.getElementById('filter-toggle');
  if (filterToggle && filterToggle.dataset.bound !== '1') {
    filterToggle.dataset.bound = '1';
    filterToggle.addEventListener('click', () => {
      document.getElementById('filter-sidebar')?.classList.toggle('mobile-active');
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect && sortSelect.dataset.bound !== '1') {
    sortSelect.dataset.bound = '1';
    sortSelect.addEventListener('change', () => rerenderFromFilters());
  }

  document.querySelectorAll('.filter-sidebar input[type=checkbox]').forEach(cb => {
    if (cb.dataset.bound === '1') return;
    cb.dataset.bound = '1';
    cb.addEventListener('change', () => rerenderFromFilters());
  });

  ensurePaginationDelegation();
  initGoTopButton();
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
  mountPagination(null, currentPage, totalPages, grid);
}