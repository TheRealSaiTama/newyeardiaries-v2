import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/components.css';
import './styles/pages.css';

import { addRoute, initRouter, resolveRoute } from './router.js';
import { renderHeader, initHeaderEvents, updateHeaderCounts, loadHeaderCategories, initSearchModal, renderSearchModal } from './components/Header.js';
import { initFaqChatbot } from './components/FaqChatbot.js';
import { renderFooter } from './components/Footer.js';
import { renderAboutSection } from './components/AboutSection.js';
import { renderQuickViewModal, initQuickViewEvents } from './components/QuickViewModal.js';
import { renderHomeSkeleton } from './components/Skeleton.js';
import { getContent } from './lib/content.js';

import { renderHomePage } from './pages/HomePage.js';
import { renderShopPage } from './pages/ShopPage.js';
import { renderCorporatePage } from './pages/CorporatePage.js';
import { renderProductDetailPage } from './pages/ProductDetailPage.js';
import { renderNotFoundPage } from './pages/NotFoundPage.js';
import { renderCartPage } from './pages/CartPage.js';
import { renderCheckoutPage } from './pages/CheckoutPage.js';
import { renderBulkQuotePage } from './pages/BulkQuotePage.js';
import { renderQuoteListPage } from './pages/QuoteListPage.js';

import { renderEnquirySuccessPage } from './pages/EnquirySuccessPage.js';
import { renderOrderSuccessPage } from './pages/OrderSuccessPage.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderAccountPage } from './pages/AccountPage.js';
import { renderAboutPage } from './pages/AboutPage.js';
import { renderContactPage } from './pages/ContactPage.js';
import { renderFaqPage } from './pages/FaqPage.js';
import { renderPrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';
import { renderTermsPage } from './pages/TermsPage.js';
import { renderShippingReturnsPage } from './pages/ShippingReturnsPage.js';
import { renderBrandingPage } from './pages/BrandingPage.js';
import { renderAdminPage, initAdminPage } from './pages/AdminPage.js';

let appContent = null;

if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => {
    console.error('[nyd:uncaught]', ev.error || ev.message, ev.filename, ev.lineno);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    console.error('[nyd:unhandledrejection]', ev.reason);
  });
}

function setMeta(selector, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const m = selector.match(/\[(name|property)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function ensureCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function ensureOrgJsonLd(s) {
  let el = document.getElementById('org-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'org-jsonld';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: s?.site_title || 'New Year Diaries',
    url: s?.og_url || 'https://newyeardiaries.in',
    logo: s?.og_image || 'https://newyeardiaries.in/logo-big-transparent.png',
    email: s?.contact_email || 'support@newyeardiaries.in',
    telephone: s?.contact_phone || '+91-9311135190',
    address: {
      '@type': 'PostalAddress',
      streetAddress: s?.contact_address || '174 D, Bawana Industrial Area',
      addressLocality: 'Delhi',
      postalCode: '110039',
      addressCountry: 'IN',
    },
  });
}

function applyMetaTags(s) {
  if (!s) return;
  if (s.site_title)        document.title = s.site_title;
  if (s.meta_description)  setMeta('meta[name="description"]',  'content',    s.meta_description);
  if (s.meta_keywords)     setMeta('meta[name="keywords"]',     'content',    s.meta_keywords);
  if (s.og_title)          setMeta('meta[property="og:title"]',       'content', s.og_title);
  if (s.og_description)    setMeta('meta[property="og:description"]', 'content', s.og_description);
  if (s.og_image)          setMeta('meta[property="og:image"]',       'content', s.og_image);
  if (s.og_url)            setMeta('meta[property="og:url"]',         'content', s.og_url);
  if (s.og_type)           setMeta('meta[property="og:type"]',        'content', s.og_type);
  if (s.twitter_card)      setMeta('meta[name="twitter:card"]',       'content', s.twitter_card);
  if (s.twitter_title)     setMeta('meta[name="twitter:title"]',      'content', s.twitter_title);
  if (s.twitter_description) setMeta('meta[name="twitter:description"]', 'content', s.twitter_description);
  if (s.twitter_image)     setMeta('meta[name="twitter:image"]',      'content', s.twitter_image);
  const canon = s.og_url || (typeof location !== 'undefined' ? location.origin + '/' : 'https://newyeardiaries.in/');
  ensureCanonical(canon);
  ensureOrgJsonLd(s);
}

async function loadContent() {
  try {
    appContent = await getContent();
    const siteTitle = appContent?.siteSettings?.site_title || 'New Year Diaries | Premium Diaries & Corporate Planners | Manufacturer Direct';
    document.title = siteTitle;
    applyMetaTags(appContent?.siteSettings);
  } catch (e) {
    console.warn('Failed to load content, using defaults', e);
  }
}

async function preloadCategories() {
  try {
    await loadHeaderCategories();
  } catch (e) {
  }
}

function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    loader.classList.add('is-gone');
    setTimeout(() => loader.remove(), 360);
  }
  const shell = document.getElementById('shell');
  if (shell && shell.style.opacity !== '1') {
    shell.style.opacity = '0';
    requestAnimationFrame(() => {
      shell.style.transition = 'opacity 0.22s ease';
      shell.style.opacity = '1';
    });
  }
}

const WHATSAPP_NUMBER = '919311135190';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi Team NYD,\n\nContacting through your website "www.NewYearDiaries.in" regarding order. Please get back asap.\n\nThank you.');

function renderFloatingButtons() {
  return `
    <a class="floating-wa-btn" href="https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}" target="_blank" rel="noopener" aria-label="WhatsApp Enquiry">
      <span class="floating-wa-icon">
        <svg viewBox="0 0 32 32"><path d="M16.033 0a15.938 15.938 0 0 0-13.8 23.945L0 31.989l8.225-2.156A15.93 15.93 0 0 0 16.033 31.99c8.8 0 15.967-7.16 15.967-15.967S24.832 0 16.033 0zm0 29.317c-2.482 0-4.914-.633-7.06-1.831l-.506-.283-5.244 1.374 1.398-5.118-.311-.495A13.262 13.262 0 0 1 2.766 16.02c0-7.323 5.96-13.292 13.268-13.292 7.323 0 13.292 5.969 13.292 13.292s-5.969 13.297-13.293 13.297zm7.262-9.923c-.398-.2-2.355-1.164-2.72-1.298-.364-.132-.63-.2-.895.198-.266.398-1.028 1.298-1.26 1.564-.233.265-.465.298-.863.1-2.223-1.116-3.805-2.261-5.187-4.577-.266-.447.264-.413.644-1.178.132-.265.066-.497-.033-.695-.1-.2-1.026-2.484-1.358-3.361-.413-1.089-.824-.942-1.125-.961-.266-.015-.565-.015-.863-.015-.298 0-.796.116-1.212.646-.414.53-1.593 1.558-1.593 3.797 0 2.239 1.625 4.402 1.858 4.667.232.265 3.178 4.846 7.697 6.793 1.077.464 1.916.742 2.571.95 1.082.343 2.066.294 2.842.178.868-.13 2.355-.96 2.688-1.888.332-.928.332-1.722.232-1.888-.1-.166-.364-.265-.762-.464z"/></svg>
      </span>
      <span class="floating-wa-label">WhatsApp Enquiry</span>
    </a>
  `;
}

function initFloatingButtons() {
  const container = document.getElementById('floating-buttons');
  if (container) container.innerHTML = renderFloatingButtons();
}

function safeRender(label, fn) {
  try { return fn(); }
  catch (e) { console.warn(`[shell] ${label} render failed:`, e); return ''; }
}

function setupShell() {
  const shell = document.getElementById('shell');
  shell.innerHTML = `
    <div id="header-area">${safeRender('Header', () => renderHeader(appContent))}</div>
    ${safeRender('QuickView', renderQuickViewModal)}
    ${safeRender('Search', renderSearchModal)}
    <main id="app"></main>
    <div id="about-section">${safeRender('About', renderAboutSection)}</div>
    <div id="footer-area">${safeRender('Footer', () => renderFooter(appContent))}</div>
    <div id="floating-buttons"></div>
    <div id="faq-chatbot"></div>
  `;
  try { initHeaderEvents(); } catch (e) { console.warn('[shell] initHeaderEvents failed:', e); }
  try { updateHeaderCounts(); } catch (e) { console.warn('[shell] updateHeaderCounts failed:', e); }
  try { initSearchModal(); } catch (e) { console.warn('[shell] initSearchModal failed:', e); }
  try { initQuickViewEvents(); } catch (e) { console.warn('[shell] initQuickViewEvents failed:', e); }
  try { initFaqChatbot(); } catch (e) { console.warn('[shell] initFaqChatbot failed:', e); }
  initFloatingButtons();
}

function syncShellExtras() {
  const path = window.location.pathname || '/';
  const isHome = path === '/' || path === '/index.html';
  const isAdmin = path.startsWith('/admin');

  document.body.classList.toggle('is-admin-route', isAdmin);

  document.querySelectorAll('#about-section, .nyd-about-section')
    .forEach(el => { el.style.display = isHome ? '' : 'none'; });

  document.querySelectorAll('#floating-buttons, #faq-chatbot')
    .forEach(el => { el.style.display = isAdmin ? 'none' : ''; });
}

const PAGE_CACHE_PREFIX = '__nyd_page_cache:';
const PAGE_CACHE_MAX_ENTRIES = 8;
const PAGE_CACHE_MAX_HTML_BYTES = 800_000; // ~800KB
const HOME_CACHE_KEY = PAGE_CACHE_PREFIX + 'persistent:/';

function pageCacheKey(params) {
  const path = window.location.pathname || '/';
  const search = window.location.search || '';
  return PAGE_CACHE_PREFIX + path + search;
}

function isPageCacheable(path) {
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
  return normalized === '' || normalized === '/shop';
}

function getCachedPage(params) {
  try {
    const path = window.location.pathname || '/';
    if (!isPageCacheable(path)) return null;

    const key = pageCacheKey(params);
    if (key === PAGE_CACHE_PREFIX + '/' && window.__nydHomeHtmlCache?.html) return window.__nydHomeHtmlCache;
    const raw = sessionStorage.getItem(key) || (key === PAGE_CACHE_PREFIX + '/' ? localStorage.getItem(HOME_CACHE_KEY) : null);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setCachedPage(params, html) {
  if (!html) return;
  const path = window.location.pathname || '/';
  if (!isPageCacheable(path)) return;

  const key = pageCacheKey(params);
  if (key === PAGE_CACHE_PREFIX + '/') window.__nydHomeHtmlCache = { html, t: Date.now() };
  if (html.length > PAGE_CACHE_MAX_HTML_BYTES) return;
  try {
    const payload = JSON.stringify({ html, t: Date.now() });
    sessionStorage.setItem(key, payload);
    if (key === PAGE_CACHE_PREFIX + '/') localStorage.setItem(HOME_CACHE_KEY, payload);
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(PAGE_CACHE_PREFIX));
    if (keys.length > PAGE_CACHE_MAX_ENTRIES) {
      const entries = keys.map(k => {
        try { return { k, t: JSON.parse(sessionStorage.getItem(k)).t || 0 }; }
        catch { return { k, t: 0 }; }
      }).sort((a, b) => a.t - b.t);
      for (let i = 0; i < entries.length - PAGE_CACHE_MAX_ENTRIES; i++) {
        sessionStorage.removeItem(entries[i].k);
      }
    }
  } catch { /* quota or disabled â€” silently ignore */ }
}

function clearPageCache() {
  try {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(PAGE_CACHE_PREFIX));
    keys.forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem(HOME_CACHE_KEY);
    window.__nydHomeHtmlCache = null;
  } catch { /* ignore */ }
}

window.__clearPageCache = clearPageCache;
window.__nydPageCachePrefix = PAGE_CACHE_PREFIX;

function wrapPage(renderFn) {
  return (params) => {
    const app = document.getElementById('app');
    const cached = getCachedPage(params);

    const path = window.location.pathname;
    let robots = document.querySelector('meta[name="robots"]');
    if (/^\/(admin|cart|checkout|account|login|order-success|enquiry-success|bulk-quote|quote-list)(\/|$)/.test(path)) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', 'noindex, nofollow');
    } else if (robots) {
      robots.setAttribute('content', 'index, follow');
    }

    try {
      const origin = window.location.origin || 'https://newyeardiaries.in';
      ensureCanonical(origin + path + (window.location.search || ''));
    } catch { /* ignore */ }

    document.getElementById('header-area').innerHTML = renderHeader(appContent);
    document.getElementById('footer-area').style.display = '';
    initHeaderEvents();
    updateHeaderCounts();
    initSearchModal();
    syncShellExtras();

    if (cached && cached.html && app) {
      app.innerHTML = cached.html;
      if (typeof window.__reinitPage === 'function') {
        try { window.__reinitPage(); } catch (e) { console.warn('[cache] reinit failed:', e); }
      }
      if (typeof window.__nydCacheRefresh === 'function') {
        Promise.resolve()
          .then(() => window.__nydCacheRefresh(params, appContent))
          .catch(e => console.warn('[cache] in-place refresh failed:', e));
      }
      return Promise.resolve();
    }

    const targetPath = window.location.pathname + window.location.search;
    if (targetPath === '/' && app) app.innerHTML = renderHomeSkeleton();
    return Promise.resolve(renderFn(params, appContent)).then(() => {
      if (window.location.pathname + window.location.search !== targetPath) {
        resolveRoute();
        return;
      }
      if (app) setCachedPage(params, app.innerHTML);
    });
  };
}

addRoute('/', wrapPage(renderHomePage));
addRoute('/shop', wrapPage(renderShopPage));
addRoute('/shop/corporate', wrapPage(renderCorporatePage));
addRoute('/product/:slug', (params) => { navigateTo('/' + params.slug); return; });
addRoute('/cart', wrapPage(renderCartPage));
addRoute('/checkout', wrapPage(renderCheckoutPage));
addRoute('/bulk-quote', wrapPage(renderBulkQuotePage));
addRoute('/quote-list', wrapPage(renderQuoteListPage));
addRoute('/enquiry-success', wrapPage(renderEnquirySuccessPage));
addRoute('/order-success', wrapPage(renderOrderSuccessPage));
addRoute('/login', wrapPage(renderLoginPage));
addRoute('/account', wrapPage(renderAccountPage));
addRoute('/about', wrapPage(renderAboutPage));
addRoute('/contact', wrapPage(renderContactPage));
addRoute('/faq', wrapPage(renderFaqPage));
addRoute('/privacy-policy', wrapPage(renderPrivacyPolicyPage));
addRoute('/terms', wrapPage(renderTermsPage));
addRoute('/shipping-returns', wrapPage(renderShippingReturnsPage));
addRoute('/branding', wrapPage(renderBrandingPage));
addRoute('/admin', (params) => {
  document.getElementById('header-area').style.display = 'none';
  document.getElementById('footer-area').style.display = 'none';
  syncShellExtras();
  document.getElementById('app').innerHTML = renderAdminPage();
  initAdminPage();
});

addRoute('/:slug', async (params) => {
  const reservedPrefixes = ['assets', 'images', 'logo', 'favicon', 'robots.txt', 'sitemap.xml'];
  if (reservedPrefixes.some(p => params.slug.startsWith(p))) {
    return wrapPage(renderNotFoundPage)(params);
  }
  try {
    const { getProductBySlug } = await import('./data/products.js');
    const product = await getProductBySlug(params.slug);
    if (product) return wrapPage(renderProductDetailPage)({ slug: params.slug });
  } catch (e) { /* fall through */ }
  return wrapPage(renderNotFoundPage)(params);
});

let loaderHidden = false;
function hideLoaderOnce() {
  if (loaderHidden) return;
  loaderHidden = true;
  hideLoader();
}
setTimeout(hideLoaderOnce, 1200);
setTimeout(hideLoaderOnce, 4000);

function raceWithTimeout(promise, ms, label) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      console.warn(`[boot] ${label} timed out after ${ms}ms â€” continuing`);
      resolve(null);
    }, ms);
    promise.then(
      (v) => { if (!done) { done = true; clearTimeout(t); resolve(v); } },
      (e) => { if (!done) { done = true; clearTimeout(t); console.warn(`[boot] ${label} failed:`, e); resolve(null); } }
    );
  });
}

window.addEventListener('nyd-content-updated', (e) => {
  appContent = e.detail;
  try { applyMetaTags(appContent?.siteSettings); } catch (err) {
    console.warn('[main] applyMetaTags after content update failed:', err);
  }
  try {
    clearPageCache();
    resolveRoute();
  } catch (err) {
    console.warn('[main] resolveRoute after content update failed:', err);
  }
});

window.addEventListener('nyd-products-updated', () => {
  try {
    clearPageCache();
    resolveRoute();
  } catch (err) {
    console.warn('[main] resolveRoute after products update failed:', err);
  }
});

window.addEventListener('nyd-categories-updated', () => {
  try {
    clearPageCache();
    resolveRoute();
  } catch (err) {
    console.warn('[main] resolveRoute after categories update failed:', err);
  }
});

(async () => {
  try {
    setupShell();
    syncShellExtras();
  } catch (e) {
    console.error('[boot] setupShell failed:', e);
  }
  try {
    const path = window.location.pathname || '/';
    if (path === '/' || path === '/index.html') {
      const app = document.getElementById('app');
      if (app) app.innerHTML = renderHomeSkeleton();
    }
  } catch (e) {
    console.warn('[boot] home skeleton failed:', e);
  }

  let firstRender;
  try {
    firstRender = initRouter();
  } catch (e) {
    console.error('[boot] initRouter failed:', e);
  }

  if (firstRender && typeof firstRender.then === 'function') {
    await raceWithTimeout(firstRender, 1000, 'firstRender');
  }

  hideLoaderOnce();

  Promise.allSettled([
    loadContent().then(() => preloadCategories()),
  ]).then(() => {
    try {
      resolveRoute();
    } catch (e) {
      console.warn('[boot] post-load resolveRoute failed:', e);
    }
  });
})();
