import { getContent, getAnnouncementContent } from '../lib/content.js';
import { fetchCategories, seedCategoriesIfEmpty, getCategoriesByGroup, CATEGORY_GROUPS } from '../lib/categories.js';
import { getProducts } from '../lib/products.js';
import { renderProductCard } from './ProductCard.js';
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock.js';
import { navigateTo } from '../router.js';

let _cachedContent = null;
let _cachedCategories = null;

export function setHeaderContent(content) {
  _cachedContent = content;
}

export async function loadHeaderCategories() {
  try {
    await seedCategoriesIfEmpty();
    _cachedCategories = await fetchCategories();
  } catch (e) {
    _cachedCategories = [];
  }
}

export function renderHeader(content) {
  const c = content || _cachedContent;
  const { fallback, link } = c ? getAnnouncementContent(c) : { fallback: '', link: '' };
  const currentPath = window.location.pathname;

  const mainNavItems = [
    { label: 'Shop', path: '/shop' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Branding', path: '/branding' },
  ];

  // Build the explore-group list from the categories the cache actually has,
  // ordered by the DB's sort_order. Falls back to the hardcoded map if the
  // cache is cold (e.g. server-side render or before boot completes).
  const groupedCats = getCategoriesByGroup(_cachedCategories || []);
  const exploreGroups = Object.keys(groupedCats).length
    ? Object.keys(groupedCats)
    : Object.keys(CATEGORY_GROUPS);

  const annParts = fallback.split('|').map(s => s.trim()).filter(Boolean);
  const annItems = annParts.map((text, i) => {
    const [main] = text.split('|').map(s => s.trim()).filter(Boolean);
    return { text: main || text, link: i === annParts.length - 1 ? link : null };
  });


  const firstGroup = exploreGroups[0];
  const firstCats = groupedCats[firstGroup] || [];

  return `
    <div class="announcement-bar" id="announcement-bar">
      ${annItems.map(item => item.link
        ? `<a href="${item.link}">${item.text}</a>`
        : `<span>${item.text}</span>`
      ).join('<span class="ann-divider">|</span>')}
    </div>
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <a href="/" class="header-logo" aria-label="New Year Diaries Home">
          <img src="/logo-big.jpg" alt="New Year Diaries" class="logo-img" />
        </a>
        <nav class="header-nav" aria-label="Main navigation">
          <div class="nav-explore-wrapper" id="nav-explore-wrapper">
            <button class="nav-explore-btn" id="nav-explore-btn">
              All Categories
              <span class="material-symbols-outlined" style="font-size:16px;">expand_more</span>
            </button>
            <div class="explore-mega-menu" id="explore-mega-menu">
              <div class="explore-mega-inner">
                <div class="explore-mega-sidebar">
                  ${exploreGroups.map((groupName, i) => {
                    const cats = groupedCats[groupName] || [];
                    return `
                      <a href="/shop?group=${encodeURIComponent(groupName)}"
                         class="explore-mega-cat-btn ${i === 0 ? 'active' : ''}"
                         data-group="${groupName}">
                        ${groupName}
                        ${cats.length > 0 ? '<span class="material-symbols-outlined" style="font-size:16px;">chevron_right</span>' : ''}
                      </a>
                    `;
                  }).join('')}
                </div>
                <div class="explore-mega-panels">
                  ${exploreGroups.map((groupName, i) => {
                    const cats = groupedCats[groupName] || [];
                    return `
                      <div class="explore-mega-panel ${i === 0 ? 'active' : ''}" data-panel="${groupName}">
                        <div class="explore-mega-panel-title">
                          ${groupName}
                          <a href="/shop?group=${encodeURIComponent(groupName)}" class="explore-mega-viewall">View all</a>
                        </div>
                        <div class="explore-mega-panel-grid">
                          ${cats.map(cat => `
                            <a href="/shop?cat=${cat.slug}" class="explore-mega-link">${cat.name}</a>
                          `).join('')}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>
          ${mainNavItems.map(link => {
            const isActive = currentPath === link.path;
            return `
              <div class="nav-item-wrapper">
                <a href="${link.path}" class="${isActive ? 'active' : ''}">${link.label}</a>
              </div>
            `;
          }).join('')}
        </nav>
        <div class="header-actions">
          <button class="header-action-btn" aria-label="Search" id="search-btn" title="Search">
            <span class="material-symbols-outlined">search</span>
          </button>
          <a href="/cart" class="header-action-btn" aria-label="Cart" title="Cart">
            <span class="material-symbols-outlined">shopping_bag</span>
            <span class="badge-count" id="cart-count">0</span>
          </a>
          <button class="mobile-menu-toggle" aria-label="Open menu" id="mobile-menu-btn">
            <span class="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-nav-overlay" id="mobile-overlay"></div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
      <button class="mobile-nav-close header-action-btn" id="mobile-nav-close" aria-label="Close menu">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="mobile-explore-section" id="mobile-explore-section">
        <button class="mobile-explore-toggle" id="mobile-explore-toggle">
          Explore Categories
          <span class="material-symbols-outlined">expand_more</span>
        </button>
        <div class="mobile-explore-groups" id="mobile-explore-groups">
          ${exploreGroups.map(groupName => {
            const cats = groupedCats[groupName] || [];
            if (!cats.length) return '';
            return `
              <div class="mobile-explore-group">
                <div class="mobile-explore-group-title">${groupName}</div>
                ${cats.map(cat => `
                  <a href="/shop?cat=${cat.slug}" class="mobile-explore-link">${cat.name}</a>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ${mainNavItems.map(link => `
        <a href="${link.path}" class="${currentPath === link.path ? 'active' : ''}">${link.label}</a>
      `).join('')}
      <hr class="divider">
      <a href="/cart">Cart</a>
    </nav>
  `;
}

// Module-level so document-level listeners aren't re-bound on every wrapPage()
let _headerDocWired = false;
let _exploreTimeout = null;

function wireHeaderDomOnce() {
  // Called after every header re-render — binds element listeners with clone-safe approach
  const menuBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-nav-close');
  const overlay = document.getElementById('mobile-overlay');
  const nav = document.getElementById('mobile-nav');

  function openMenu() {
    overlay?.classList.add('active');
    nav?.classList.add('active');
    lockBodyScroll();
  }

  function closeMenu() {
    if (!nav?.classList.contains('active')) return;
    overlay?.classList.remove('active');
    nav?.classList.remove('active');
    unlockBodyScroll();
  }

  // Re-bind fresh nodes (header HTML is replaced each nav)
  if (menuBtn && menuBtn.dataset.bound !== '1') {
    menuBtn.dataset.bound = '1';
    menuBtn.addEventListener('click', openMenu);
  }
  if (closeBtn && closeBtn.dataset.bound !== '1') {
    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', closeMenu);
  }
  if (overlay && overlay.dataset.bound !== '1') {
    overlay.dataset.bound = '1';
    overlay.addEventListener('click', closeMenu);
  }
  nav?.querySelectorAll('a').forEach(link => {
    if (link.dataset.bound === '1') return;
    link.dataset.bound = '1';
    link.addEventListener('click', closeMenu);
  });

  if (!_headerDocWired) {
    _headerDocWired = true;
    // H3.15: Esc closes mobile nav (once on document)
    document.addEventListener('keydown', (e) => {
      const n = document.getElementById('mobile-nav');
      if (e.key === 'Escape' && n?.classList.contains('active')) {
        document.getElementById('mobile-overlay')?.classList.remove('active');
        n.classList.remove('active');
        unlockBodyScroll();
      }
    });
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('nav-explore-wrapper');
      if (wrap && !wrap.contains(e.target)) {
        wrap.classList.remove('show-explore-menu');
      }
    });
  }

  const exploreWrapper = document.getElementById('nav-explore-wrapper');
  const exploreBtn = document.getElementById('nav-explore-btn');
  const exploreMenu = document.getElementById('explore-mega-menu');

  if (exploreWrapper && exploreMenu && exploreWrapper.dataset.bound !== '1') {
    exploreWrapper.dataset.bound = '1';
    exploreWrapper.addEventListener('mouseenter', () => {
      clearTimeout(_exploreTimeout);
      exploreWrapper.classList.add('show-explore-menu');
    });
    exploreWrapper.addEventListener('mouseleave', () => {
      _exploreTimeout = setTimeout(() => {
        exploreWrapper.classList.remove('show-explore-menu');
      }, 150);
    });
    exploreBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      exploreWrapper.classList.toggle('show-explore-menu');
    });

    const sidebarBtns = exploreMenu.querySelectorAll('.explore-mega-cat-btn');
    const activateSidebar = (btn) => {
      sidebarBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const group = btn.dataset.group;
      exploreMenu.querySelectorAll('.explore-mega-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.panel === group);
      });
    };
    sidebarBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => activateSidebar(btn));
      btn.addEventListener('focusin', () => activateSidebar(btn));
      btn.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        e.preventDefault();
        activateSidebar(btn);
      });
    });
  }

  const mobileExploreToggle = document.getElementById('mobile-explore-toggle');
  const mobileExploreGroups = document.getElementById('mobile-explore-groups');
  if (mobileExploreToggle && mobileExploreToggle.dataset.bound !== '1') {
    mobileExploreToggle.dataset.bound = '1';
    mobileExploreToggle.addEventListener('click', () => {
      mobileExploreGroups?.classList.toggle('open');
      mobileExploreToggle.classList.toggle('open');
    });
  }
}

export function initHeaderEvents() {
  wireHeaderDomOnce();
}

export function updateHeaderCounts() {
  const cartCount = document.getElementById('cart-count');
  let cartItems = [];
  try {
    const raw = localStorage.getItem('cart');
    const parsed = raw ? JSON.parse(raw) : [];
    cartItems = Array.isArray(parsed) ? parsed : [];
  } catch { cartItems = []; }
  const totalItems = cartItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    cartCount.setAttribute('aria-label', `${totalItems} item${totalItems === 1 ? '' : 's'} in cart`);
    // H3.17: announce cart badge changes to screen readers
    if (!cartCount.hasAttribute('aria-live')) {
      cartCount.setAttribute('aria-live', 'polite');
      cartCount.setAttribute('aria-atomic', 'true');
    }
  }
}

export function renderSearchModal() {
  return `
    <div class="search-overlay" id="search-overlay">
      <div class="search-modal">
        <div class="search-input-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="search" id="search-input" class="search-input" placeholder="Search for diaries, planners, gifts..." autocomplete="off" autofocus aria-label="Search products">
          <button class="search-close" id="search-close" aria-label="Close search">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="search-results" id="search-results">
          <p class="search-hint">Start typing to search...</p>
        </div>
      </div>
    </div>
  `;
}

export function initSearchModal() {
  const searchBtn = document.getElementById('search-btn');
  const overlay = document.getElementById('search-overlay');
  const closeBtn = document.getElementById('search-close');
  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');

  if (!searchBtn || !overlay) return;

  // Idempotency guard — wrapPage() re-runs this on every navigation.
  // Without it, input/keydown listeners stack up and race each other,
  // causing the "shows results then reverts" glitch.
  if (searchBtn.dataset.bound === '1') return;
  searchBtn.dataset.bound = '1';

  let allProducts = [];
  let debounceTimer;
  let searchToken = 0; // monotonically increasing token; stale renders bail out

  let productsLoading = null;
  async function loadProducts() {
    if (allProducts.length) return allProducts;
    // H2.13: share one in-flight fetch so typing while loading waits correctly
    if (!productsLoading) {
      productsLoading = getProducts({ limit: 200 })
        .then((list) => {
          allProducts = list || [];
          return allProducts;
        })
        .finally(() => { productsLoading = null; });
    }
    return productsLoading;
  }

  function openSearch() {
    overlay.classList.add('active');
    lockBodyScroll();
    setTimeout(() => input?.focus(), 50);
    loadProducts();
  }

  function closeSearch() {
    if (!overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    unlockBodyScroll();
    if (input) input.value = '';
    if (resultsEl) resultsEl.innerHTML = '<p class="search-hint">Start typing to search...</p>';
    searchToken++; // invalidate any in-flight search
  }

  searchBtn.addEventListener('click', openSearch);
  closeBtn?.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeSearch();
    }
  });

  input?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    clearTimeout(debounceTimer);

    if (!q) {
      searchToken++;
      resultsEl.innerHTML = '<p class="search-hint">Start typing to search...</p>';
      return;
    }

    resultsEl.innerHTML = '<p class="search-loading">Searching...</p>';
    const myToken = ++searchToken;

    debounceTimer = setTimeout(async () => {
      const products = await loadProducts();
      // Stale guard: bail if a newer keystroke/close superseded this one
      if (myToken !== searchToken) return;
      const matched = products.filter(p => {
        const cat = (p.category || p.categoryName || '').toLowerCase();
        const name = (p.name || p.title || '').toLowerCase();
        return name.includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.shortDescription || '').toLowerCase().includes(q) ||
          cat.includes(q) ||
          (p.badge || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q);
      }).slice(0, 8);

      if (!matched.length) {
        resultsEl.innerHTML = `
          <div class="search-empty">
            <span class="material-symbols-outlined">search_off</span>
            <p>No results for "<strong>${q}</strong>"</p>
            <a href="/shop" class="btn btn--secondary btn--sm" data-close-search>Browse All Products</a>
          </div>
        `;
        return;
      }

      resultsEl.innerHTML = `
        <div class="search-result-header">${matched.length} result${matched.length > 1 ? 's' : ''}</div>
        <div class="search-result-list">
          ${matched.map(p => `
            <a href="/${p.slug}" class="search-result-item" data-slug="${p.slug}">
              <div class="search-result-img">
                ${p.image ? `<img src="${p.image}" alt="${p.name}">` : '<div class="search-result-img-placeholder"><span class="material-symbols-outlined">image</span></div>'}
              </div>
              <div class="search-result-info">
                <div class="search-result-name">${p.name || p.title || ''}</div>
                <div class="search-result-meta">
                  ${(p.category || p.categoryName) ? `<span>${p.category || p.categoryName}</span>` : ''}
                  <span class="search-result-price">₹${Number(p.price).toLocaleString()}</span>
                  ${p.badge ? `<span class="badge badge-new">${p.badge}</span>` : ''}
                </div>
              </div>
            </a>
          `).join('')}
        </div>
        <div class="search-result-footer">
          <a href="/shop?q=${encodeURIComponent(q)}" class="search-view-all" data-close-search>
            View all results for "${q.replace(/"/g, '&quot;')}"
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      `;

      resultsEl.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          closeSearch();
          navigateTo(item.dataset.slug ? `/${item.dataset.slug}` : '/shop');
        });
      });
      resultsEl.querySelectorAll('[data-close-search]').forEach(el => {
        el.addEventListener('click', () => { closeSearch(); });
      });
    }, 250);
  });
}