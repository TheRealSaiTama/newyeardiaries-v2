import { navigateTo } from '../router.js';
import { getContent, getAnnouncementContent } from '../lib/content.js';
import { fetchCategories, seedCategoriesIfEmpty, getCategoriesByGroup, CATEGORY_GROUPS } from '../lib/categories.js';

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
    { label: 'Diaries', path: '/shop', group: 'Diaries' },
    { label: 'Corporate', path: '/shop/corporate', group: 'Corporate Gifts' },
    { label: 'Planners', path: '/shop?cat=planners', group: 'Planners' },
    { label: 'Shop', path: '/shop', group: null },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Bespoke', path: '/bulk-quote' },
  ];

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
          ${mainNavItems.map(link => {
            const groupName = link.group;
            const hasGroup = groupName && CATEGORY_GROUPS[groupName] && groupedCats[groupName]?.length > 0;
            return `
              <div class="nav-item-wrapper${hasGroup ? ' has-mega-menu' : ''}" data-group="${groupName || ''}">
                <a href="${link.path}" class="${currentPath === link.path ? 'active' : ''}">${link.label}</a>
                ${hasGroup ? `
                  <div class="mega-menu" data-group="${groupName}">
                    <div class="mega-menu-inner">
                      ${groupedCats[groupName].map(cat => `
                        <a href="/shop?cat=${cat.slug}" class="mega-menu-link">${cat.name}</a>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
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

  const navWrappers = document.querySelectorAll('.nav-item-wrapper.has-mega-menu');
  navWrappers.forEach(wrapper => {
    let hoverTimeout;

    wrapper.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      wrapper.classList.add('show-mega-menu');
    });

    wrapper.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        wrapper.classList.remove('show-mega-menu');
      }, 150);
    });

    const link = wrapper.querySelector('a');
    link?.addEventListener('click', (e) => {
      if (wrapper.classList.contains('show-mega-menu')) {
        e.preventDefault();
        wrapper.classList.remove('show-mega-menu');
        navigateTo(link.getAttribute('href'));
      }
    });
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