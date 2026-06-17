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
import { renderQuickViewModal } from './components/QuickViewModal.js';
import { getContent } from './lib/content.js';

import { renderHomePage } from './pages/HomePage.js';
import { renderShopPage } from './pages/ShopPage.js';
import { renderCorporatePage } from './pages/CorporatePage.js';
import { renderProductDetailPage } from './pages/ProductDetailPage.js';
import { renderCartPage } from './pages/CartPage.js';
import { renderCheckoutPage } from './pages/CheckoutPage.js';
import { renderBulkQuotePage } from './pages/BulkQuotePage.js';

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

async function loadContent() {
  try {
    appContent = await getContent();
    const siteTitle = appContent?.siteSettings?.site_title || 'New Year Diaries | Premium Diaries & Corporate Planners | Manufacturer Direct';
    document.title = siteTitle;
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

const WHATSAPP_NUMBER = '919899223130';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi New Year Diaries, I want to enquire about diaries and corporate gifting.');

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

function setupShell() {
  const shell = document.getElementById('shell');
  shell.innerHTML = `
    <div id="header-area">${renderHeader(appContent)}</div>
    ${renderQuickViewModal()}
    ${renderSearchModal()}
    <main id="app"></main>
    ${renderAboutSection()}
    <div id="footer-area">${renderFooter(appContent)}</div>
    <div id="floating-buttons"></div>
    <div id="faq-chatbot"></div>
  `;
  initHeaderEvents();
  updateHeaderCounts();
  initSearchModal();
  initFaqChatbot();
  initFloatingButtons();
}

function wrapPage(renderFn) {
  return (params) => {
    const result = renderFn(params, appContent);
    document.getElementById('header-area').innerHTML = renderHeader(appContent);
    initHeaderEvents();
    updateHeaderCounts();
    initSearchModal();
    return result; // may be a Promise (async page) — awaited on first load
  };
}

addRoute('/', wrapPage(renderHomePage));
addRoute('/shop', wrapPage(renderShopPage));
addRoute('/shop/corporate', wrapPage(renderCorporatePage));
addRoute('/product/:slug', wrapPage(renderProductDetailPage));
addRoute('/cart', wrapPage(renderCartPage));
addRoute('/checkout', wrapPage(renderCheckoutPage));
addRoute('/bulk-quote', wrapPage(renderBulkQuotePage));
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
  document.getElementById('app').innerHTML = renderAdminPage();
  initAdminPage();
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

(async () => {
  // Step 1: bring up the empty shell + a fallback homepage IMMEDIATELY so the
  // user is never staring at a splash while Supabase warms up.
  try {
    setupShell();
  } catch (e) {
    console.error('[boot] setupShell failed:', e);
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
