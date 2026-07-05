import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderFilterSidebar, initFilterEvents } from '../components/FilterSidebar.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';
import { renderProductCardSkeleton } from '../components/Skeleton.js';
import { getProducts } from '../data/products.js';
import { CATEGORY_GROUPS, fetchCategories, getCategorySlugsByGroupName } from '../lib/categories.js';

const PRODUCTS_PER_PAGE = 12;
const MAX_VISIBLE_PAGES = 5; // pages to show around current

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items = [];
  items.push(1);
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) items.push('...');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 1) items.push('...');
  items.push(totalPages);
  return items;
}

function renderPaginationButtons(currentPage, totalPages) {
  const items = getPaginationItems(currentPage, totalPages);
  return items.map(p => {
    if (p === '...') return `<span class="shop-pag-ellipsis">…</span>`;
    return `<button class="shop-pag-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }).join('');
}
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
  let pageTitle = 'The 2026 Diary Collection';
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

  // Replace pagination block (or insert it if it doesn't exist yet).
  const mainEl = document.querySelector('.shop-main');
  const existingPag = mainEl?.querySelector('.shop-pagination');
  if (existingPag) existingPag.remove();
  if (totalPages > 1 && mainEl) {
    const pagDiv = document.createElement('div');
    pagDiv.className = 'shop-pagination';
    pagDiv.innerHTML = `
      <button class="shop-pag-btn" id="pag-prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      ${renderPaginationButtons(currentPage, totalPages)}
      <button class="shop-pag-btn" id="pag-next" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    `;
    mainEl.appendChild(pagDiv);
  }

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

// Re-initialise the shop page's interactive bits after a cache-paint.
function reinitShopPage() {
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
    const mainEl = document.querySelector('.shop-main');
    const existingPag = mainEl?.querySelector('.shop-pagination');
    if (existingPag) existingPag.remove();
    if (totalPages > 1 && mainEl) {
      const pagDiv = document.createElement('div');
      pagDiv.className = 'shop-pagination';
      pagDiv.innerHTML = `
        <button class="shop-pag-btn" id="pag-prev" ${currentPage <= 1 ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_left</span></button>
        ${renderPaginationButtons(currentPage, totalPages)}
        <button class="shop-pag-btn" id="pag-next" ${currentPage >= totalPages ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_right</span></button>
      `;
      mainEl.appendChild(pagDiv);
    }
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

function buildPageUrl(page) {
  const params = new URLSearchParams(window.location.search);
  params.set('page', String(page));
  return `/shop?${params.toString()}`;
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

function keywordMatch(product, keyword) {
  const kw = keyword.toLowerCase();
  const searchable = [
    product.name,
    product.material,
    product.size,
    product.shortDescription,
    product.description,
    product.longDescription,
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

function initShopEvents(products, currentPage, totalPages, searchQ, usePerCategoryFeatured, featuredSlugs) {
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    document.getElementById('filter-sidebar')?.classList.toggle('mobile-active');
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    const sorted = applyFilters(products);
    const val = e.target.value;
    if (val.includes('Low to High')) sorted.sort((a, b) => a.price - b.price);
    else if (val.includes('High to Low')) sorted.sort((a, b) => b.price - a.price);
    else if (val.includes('Newest')) {
      sorted.sort((a, b) => {
        if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
        return (b.sortOrder || 0) - (a.sortOrder || 0);
      });
    }
    else if (usePerCategoryFeatured) sorted.sort(categoryFeaturedSort(featuredSlugs));
    else sorted.sort(globalFeaturedSort);
    renderFilteredGrid(sorted, 1, Math.max(1, Math.ceil(sorted.length / PRODUCTS_PER_PAGE)), searchQ);
  });

  document.querySelectorAll('.filter-sidebar input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const filtered = applyFilters(products);
      const sortVal = document.getElementById('sort-select')?.value || '';
      if (sortVal.includes('Low to High')) filtered.sort((a, b) => a.price - b.price);
      else if (sortVal.includes('High to Low')) filtered.sort((a, b) => b.price - a.price);
      else if (sortVal.includes('Newest')) {
        filtered.sort((a, b) => {
          if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
          return (b.sortOrder || 0) - (a.sortOrder || 0);
        });
      }
      else if (usePerCategoryFeatured) filtered.sort(categoryFeaturedSort(featuredSlugs));
      else filtered.sort(globalFeaturedSort);
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
      ${renderPaginationButtons(currentPage, totalPages)}
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