import { getContent, getAnnouncementContent } from '../lib/content.js';
import { fetchCategories, seedCategoriesIfEmpty, getCategoriesByGroup, CATEGORY_GROUPS } from '../lib/categories.js';
import { getProducts } from '../lib/products.js';
import { renderProductCard } from './ProductCard.js';

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
    { label: 'Bespoke', path: '/bulk-quote' },
    { label: 'Branding', path: '/branding' },
  ];

  const exploreGroups = Object.keys(CATEGORY_GROUPS);

  const annParts = fallback.split('|').map(s => s.trim()).filter(Boolean);
  const annItems = annParts.map((text, i) => {
    const [main] = text.split('|').map(s => s.trim()).filter(Boolean);
    return { text: main || text, link: i === annParts.length - 1 ? link : null };
  });

  const groupedCats = getCategoriesByGroup(_cachedCategories || []);

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
              Explore
              <span class="material-symbols-outlined" style="font-size:16px;">expand_more</span>
            </button>
            <div class="explore-mega-menu" id="explore-mega-menu">
              <div class="explore-mega-inner">
                ${exploreGroups.map(groupName => {
                  const cats = groupedCats[groupName] || [];
                  if (!cats.length) return '';
                  return `
                    <div class="explore-mega-group">
                      <div class="explore-mega-group-title">${groupName}</div>
                      ${cats.map(cat => `
                        <a href="/shop?cat=${cat.slug}" class="explore-mega-link">${cat.name}</a>
                      `).join('')}
                    </div>
                  `;
                }).join('')}
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
          <a href="/quote-list" class="header-action-btn" aria-label="Quote List" title="Quote List">
            <span class="material-symbols-outlined">request_quote</span>
            <span class="badge-count" id="quote-count">0</span>
          </a>
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
      <a href="/quote-list">Quote List</a>
      <a href="/cart">Cart</a>
    </nav>
  `;
}

export function initHeaderEvents() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-nav-close');
  const overlay = document.getElementById('mobile-overlay');
  const nav = document.getElementById('mobile-nav');

  function openMenu() {
    overlay?.classList.add('active');
    nav?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay?.classList.remove('active');
    nav?.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuBtn?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);

  nav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  const exploreWrapper = document.getElementById('nav-explore-wrapper');
  const exploreBtn = document.getElementById('nav-explore-btn');
  const exploreMenu = document.getElementById('explore-mega-menu');
  let exploreTimeout;

  if (exploreWrapper && exploreMenu) {
    exploreWrapper.addEventListener('mouseenter', () => {
      clearTimeout(exploreTimeout);
      exploreWrapper.classList.add('show-explore-menu');
    });

    exploreWrapper.addEventListener('mouseleave', () => {
      exploreTimeout = setTimeout(() => {
        exploreWrapper.classList.remove('show-explore-menu');
      }, 150);
    });

    exploreBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      exploreWrapper.classList.toggle('show-explore-menu');
    });

    document.addEventListener('click', (e) => {
      if (!exploreWrapper.contains(e.target)) {
        exploreWrapper.classList.remove('show-explore-menu');
      }
    });
  }

  const mobileExploreToggle = document.getElementById('mobile-explore-toggle');
  const mobileExploreGroups = document.getElementById('mobile-explore-groups');
  mobileExploreToggle?.addEventListener('click', () => {
    mobileExploreGroups.classList.toggle('open');
    mobileExploreToggle.classList.toggle('open');
  });
}

export function updateHeaderCounts() {
  const quoteCount = document.getElementById('quote-count');
  const cartCount = document.getElementById('cart-count');
  const quoteItems = JSON.parse(localStorage.getItem('quoteList') || '[]');
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

  if (quoteCount) {
    quoteCount.textContent = quoteItems.length;
    quoteCount.style.display = quoteItems.length > 0 ? 'flex' : 'none';
  }
  if (cartCount) {
    cartCount.textContent = cartItems.length;
    cartCount.style.display = cartItems.length > 0 ? 'flex' : 'none';
  }
}

export function renderSearchModal() {
  return `
    <div class="search-overlay" id="search-overlay">
      <div class="search-modal">
        <div class="search-input-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="text" id="search-input" class="search-input" placeholder="Search for diaries, planners, gifts..." autocomplete="off" autofocus>
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

  let allProducts = [];
  let debounceTimer;

  async function loadProducts() {
    if (!allProducts.length) {
      allProducts = await getProducts({ limit: 200 });
    }
    return allProducts;
  }

  function openSearch() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input?.focus(), 50);
    loadProducts();
  }

  function closeSearch() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (resultsEl) resultsEl.innerHTML = '<p class="search-hint">Start typing to search...</p>';
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

  input?.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    clearTimeout(debounceTimer);

    if (!q) {
      resultsEl.innerHTML = '<p class="search-hint">Start typing to search...</p>';
      return;
    }

    resultsEl.innerHTML = '<p class="search-loading">Searching...</p>';

    debounceTimer = setTimeout(async () => {
      const products = await loadProducts();
      const matched = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.shortDescription || '').toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q) ||
        (p.badge || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      ).slice(0, 8);

      if (!matched.length) {
        resultsEl.innerHTML = `
          <div class="search-empty">
            <span class="material-symbols-outlined">search_off</span>
            <p>No results for "<strong>${q}</strong>"</p>
            <a href="/shop" class="btn btn--secondary btn--sm" onclick="document.getElementById('search-overlay').classList.remove('active');document.body.style.overflow=''">Browse All Products</a>
          </div>
        `;
        return;
      }

      resultsEl.innerHTML = `
        <div class="search-result-header">${matched.length} result${matched.length > 1 ? 's' : ''}</div>
        <div class="search-result-list">
          ${matched.map(p => `
            <a href="/product/${p.slug}" class="search-result-item" data-slug="${p.slug}">
              <div class="search-result-img">
                ${p.image ? `<img src="${p.image}" alt="${p.name}">` : '<div class="search-result-img-placeholder"><span class="material-symbols-outlined">image</span></div>'}
              </div>
              <div class="search-result-info">
                <div class="search-result-name">${p.name}</div>
                <div class="search-result-meta">
                  ${p.categoryName ? `<span>${p.categoryName}</span>` : ''}
                  <span class="search-result-price">₹${Number(p.price).toLocaleString()}</span>
                  ${p.badge ? `<span class="badge badge-new">${p.badge}</span>` : ''}
                </div>
              </div>
            </a>
          `).join('')}
        </div>
        <div class="search-result-footer">
          <a href="/shop" class="search-view-all" onclick="document.getElementById('search-overlay').classList.remove('active');document.body.style.overflow=''">
            View all results for "${q}"
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      `;

      resultsEl.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          closeSearch();
          navigateTo(item.dataset.slug ? `/product/${item.dataset.slug}` : '/shop');
        });
      });
    }, 250);
  });
}