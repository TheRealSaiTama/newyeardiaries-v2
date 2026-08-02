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

// H3.24: global error surface — avoid silent white screens
if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => {
    console.error('[nyd:uncaught]', ev.error || ev.message, ev.filename, ev.lineno);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    console.error('[nyd:unhandledrejection]', ev.reason);
  });
}

// Helpers to upsert <meta> tags in document.head. Upsert by name/property so
// re-calls (e.g. after a settings change) replace the old value rather than
// stacking duplicates. Defaults in index.html are kept as the SSR-ish fallback
// for crawlers that don't execute JS — these values override them on load.
function setMeta(selector, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    // selector like 'meta[name="description"]' — pull the attr out
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
  // H3.30 / H3.32
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
    // The diary-loader CSS uses `transition: opacity .35s ease`, so setting
    // opacity:0 here triggers the fade. .is-gone is the macOS-spinner
    // variant — both classes are safe to apply.
    loader.style.opacity = '0';
    loader.classList.add('is-gone');
    setTimeout(() => loader.remove(), 360);
  }
  // Snappier shell reveal — was 0.4s, now 0.22s.
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
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
          <path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </span>
      <span class="floating-wa-label">WhatsApp Enquiry</span>
    </a>
  `;
}

function initFloatingButtons() {
  const container = document.getElementById('floating-buttons');
  if (container) container.innerHTML = renderFloatingButtons();
}

// Render one part of the shell, falling back to an empty string if it throws.
// Without this, a single broken component (e.g. Footer when content hasn't
// loaded yet) can take down the whole shell and leave a white page.
function safeRender(label, fn) {
  try { return fn(); }
  catch (e) { console.warn(`[shell] ${label} render failed:`, e); return ''; }
}

function setupShell() {
  const shell = document.getElementById('shell');
  // appContent may be null here on first paint (we run setupShell BEFORE
  // loadContent resolves). Each component must accept null safely — use
  // safeRender as a second line of defense.
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

// Show/hide the About section, floating WhatsApp button, and FAQ chatbot
// based on the current route. They're part of the main website shell and
// should not appear in the admin dashboard. The About section (SEO content)
// is home-only.
function syncShellExtras() {
  const path = window.location.pathname || '/';
  const isHome = path === '/' || path === '/index.html';
  const isAdmin = path.startsWith('/admin');

  document.body.classList.toggle('is-admin-route', isAdmin);

  // Show the About section only on the homepage
  document.querySelectorAll('#about-section, .nyd-about-section')
    .forEach(el => { el.style.display = isHome ? '' : 'none'; });

  // Show floating buttons and FAQ chatbot everywhere except admin route
  document.querySelectorAll('#floating-buttons, #faq-chatbot')
    .forEach(el => { el.style.display = isAdmin ? 'none' : ''; });
}

// Per-page sessionStorage cache. Keyed by the page's base path. The value
// is the last-rendered HTML for that page, so re-navigation can paint
// instantly while a background re-fetch refreshes the data.
//
// Capacity: sessionStorage is limited (~5MB). The cap here is 3 pages, with
// per-HTML size check. We don't store anything >1MB so a single huge page
// can't blow the budget.
const PAGE_CACHE_PREFIX = '__nyd_page_cache:';
const PAGE_CACHE_MAX_ENTRIES = 8;
const PAGE_CACHE_MAX_HTML_BYTES = 800_000; // ~800KB
const HOME_CACHE_KEY = PAGE_CACHE_PREFIX + 'persistent:/';

function pageCacheKey(params) {
  // Include search params so distinct category/group/q filters cache
  // separately. We deliberately don't include the hash.
  const path = window.location.pathname || '/';
  const search = window.location.search || '';
  return PAGE_CACHE_PREFIX + path + search;
}

function isPageCacheable(path) {
  const normalized = path.endsWith('/') ? path.slice(0, -1) : path;
  // Only cache homepage (which normalizes to empty string) and shop page
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
    // Enforce max entries — evict oldest.
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
  } catch { /* quota or disabled — silently ignore */ }
}

function clearPageCache() {
  try {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(PAGE_CACHE_PREFIX));
    keys.forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem(HOME_CACHE_KEY);
    window.__nydHomeHtmlCache = null;
  } catch { /* ignore */ }
}

// Expose for the admin "bust cache" actions
window.__clearPageCache = clearPageCache;
window.__nydPageCachePrefix = PAGE_CACHE_PREFIX;

function wrapPage(renderFn) {
  return (params) => {
    const app = document.getElementById('app');
    const cached = getCachedPage(params);

    // H3.33 fix: noindex on private / non-content routes so search engines
    // don't index /admin, /cart, /checkout, /account, /login, /order-success
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

    // H3.30: per-route canonical (PDP overwrites with product URL when rendered)
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

    // FAST PATH: paint cached HTML immediately. The original code re-ran
    // renderFn() in the background which rewrote app.innerHTML with a fresh
    // shell+skeleton — users saw a flash and felt the click was ignored.
    // Skip the re-render; the cache is good enough until next nav. If a page
    // wants in-place data refresh, it can register window.__nydCacheRefresh.
    if (cached && cached.html && app) {
      app.innerHTML = cached.html;
      if (typeof window.__reinitPage === 'function') {
        try { window.__reinitPage(); } catch (e) { console.warn('[cache] reinit failed:', e); }
      }
      // Quiet background data refresh — only swaps the grid in place, never
      // the whole shell. Failures are silent.
      if (typeof window.__nydCacheRefresh === 'function') {
        Promise.resolve()
          .then(() => window.__nydCacheRefresh(params, appContent))
          .catch(e => console.warn('[cache] in-place refresh failed:', e));
      }
      return Promise.resolve();
    }

    // COLD PATH: full render. May be async — return the promise so first
    // paint waits for content.
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
addRoute('/corporate', wrapPage(renderCorporatePage));
// Backward-compat: /product/:slug still works (redirects to /:slug)
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

// Catch-all short URL: /<slug> renders the product directly. Must be added
// LAST so specific routes (/cart, /about, /admin, etc.) win.
addRoute('/:slug', async (params) => {
  // Ignore obvious asset paths and known prefixes that should never reach here.
  const reservedPrefixes = ['assets', 'images', 'logo', 'favicon', 'robots.txt', 'sitemap.xml'];
  if (reservedPrefixes.some(p => params.slug.startsWith(p))) {
    return wrapPage(renderNotFoundPage)(params);
  }
  try {
    const { getProductBySlug } = await import('./data/products.js');
    const product = await getProductBySlug(params.slug);
    if (product) return wrapPage(renderProductDetailPage)({ slug: params.slug });
  } catch (e) { /* fall through */ }
  // Unknown slug → render a proper 404 page (H3.34 fix)
  return wrapPage(renderNotFoundPage)(params);
});

// Boot strategy
// --------------
// 1. Show the shell + render the first route ASAP so the user sees something.
// 2. Fire-and-forget the slow Supabase fetches; they re-render in place when they resolve.
// 3. Hard cap on the splash — never block the user on a slow backend.
let loaderHidden = false;
function hideLoaderOnce() {
  if (loaderHidden) return;
  loaderHidden = true;
  hideLoader();
}
// Hard safety: hide loader no matter what after 3s.
// Hard cap: hide the splash after 1.2s no matter what. The new spinner
// is paint-cheap so 1.2s is plenty even on slow Supabase cold starts.
setTimeout(hideLoaderOnce, 1200);
// Soft safety: a second cap at 4s in case the first timer was lost
// (tab throttled in background, devtools open, etc.).
setTimeout(hideLoaderOnce, 4000);

function raceWithTimeout(promise, ms, label) {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      console.warn(`[boot] ${label} timed out after ${ms}ms — continuing`);
      resolve(null);
    }, ms);
    promise.then(
      (v) => { if (!done) { done = true; clearTimeout(t); resolve(v); } },
      (e) => { if (!done) { done = true; clearTimeout(t); console.warn(`[boot] ${label} failed:`, e); resolve(null); } }
    );
  });
}

// Listen for background cache updates and refresh the UI when they occur
window.addEventListener('nyd-content-updated', (e) => {
  appContent = e.detail;
  // Re-apply meta tags immediately so admin edits show up without a reload
  try { applyMetaTags(appContent?.siteSettings); } catch (err) {
    console.warn('[main] applyMetaTags after content update failed:', err);
  }
  try {
    // Page HTML cache is now stale — clear it so the next render is fresh.
    // Without this, wrapPage() serves the cached HTML and admin edits are
    // invisible until a full reload. Reported 2026-07-31.
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
  // Step 1: bring up the empty shell + a HOMEPAGE SKELETON IMMEDIATELY so
  // the main area is never empty (which would expose the About section
  // from the shell as the apparent page content while the route loads).
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

  // Step 2: kick off the first route. wrapPage() returns the (possibly Promise)
  // result of the page render — do NOT await it indefinitely.
  let firstRender;
  try {
    firstRender = initRouter();
  } catch (e) {
    console.error('[boot] initRouter failed:', e);
  }

  // Step 3: race the first render against a 3s cap. If it doesn't finish, hide
  // the loader anyway — the page will continue rendering in place when its
  // Supabase queries resolve.
  if (firstRender && typeof firstRender.then === 'function') {
    await raceWithTimeout(firstRender, 1000, 'firstRender');
  }

  hideLoaderOnce();

  // Step 4: still load content + categories in the background so any subsequent
  // re-render has fresh data. Failures here are non-fatal.
  Promise.allSettled([
    loadContent().then(() => preloadCategories()),
  ]).then(() => {
    // Once content is in, refresh the page render so DB-driven sections
    // (banners, products, etc.) populate. Re-resolve the current route.
    try {
      resolveRoute();
    } catch (e) {
      console.warn('[boot] post-load resolveRoute failed:', e);
    }
  });
})();
