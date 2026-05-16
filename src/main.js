import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/components.css';
import './styles/pages.css';

import { addRoute, initRouter } from './router.js';
import { renderHeader, initHeaderEvents, updateHeaderCounts, loadHeaderCategories } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { renderQuickViewModal } from './components/QuickViewModal.js';
import { getContent } from './lib/content.js';

import { renderHomePage } from './pages/HomePage.js';
import { renderShopPage } from './pages/ShopPage.js';
import { renderCorporatePage } from './pages/CorporatePage.js';
import { renderProductDetailPage } from './pages/ProductDetailPage.js';
import { renderCartPage } from './pages/CartPage.js';
import { renderCheckoutPage } from './pages/CheckoutPage.js';
import { renderBulkQuotePage } from './pages/BulkQuotePage.js';
import { renderQuoteListPage } from './pages/QuoteListPage.js';
import { renderEnquirySuccessPage } from './pages/EnquirySuccessPage.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderAccountPage } from './pages/AccountPage.js';
import { renderAboutPage } from './pages/AboutPage.js';
import { renderContactPage } from './pages/ContactPage.js';
import { renderFaqPage } from './pages/FaqPage.js';
import { renderPrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';
import { renderTermsPage } from './pages/TermsPage.js';
import { renderShippingReturnsPage } from './pages/ShippingReturnsPage.js';
import { renderAdminPage, initAdminPage } from './pages/AdminPage.js';
import { initFaqChatbot } from './components/FaqChatbot.js';

let appContent = null;

async function loadContent() {
  try {
    appContent = await getContent();
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
    setTimeout(() => loader.remove(), 300);
  }
}

function setupShell() {
  const shell = document.getElementById('shell');
  shell.innerHTML = `
    <div id="header-area">${renderHeader(appContent)}</div>
    ${renderQuickViewModal()}
    <main id="app"></main>
    <div id="footer-area">${renderFooter(appContent)}</div>
  `;
  initHeaderEvents();
  updateHeaderCounts();
}

function wrapPage(renderFn) {
  return (params) => {
    renderFn(params, appContent);
    document.getElementById('header-area').innerHTML = renderHeader(appContent);
    initHeaderEvents();
    updateHeaderCounts();
  };
}

addRoute('/', wrapPage(renderHomePage));
addRoute('/shop', wrapPage(renderShopPage));
addRoute('/shop/corporate', wrapPage(renderCorporatePage));
addRoute('/product/:slug', wrapPage(renderProductDetailPage));
addRoute('/cart', wrapPage(renderCartPage));
addRoute('/checkout', wrapPage(renderCheckoutPage));
addRoute('/bulk-quote', wrapPage(renderBulkQuotePage));
addRoute('/quote-list', wrapPage(renderQuoteListPage));
addRoute('/enquiry-success', wrapPage(renderEnquirySuccessPage));
addRoute('/login', wrapPage(renderLoginPage));
addRoute('/account', wrapPage(renderAccountPage));
addRoute('/about', wrapPage(renderAboutPage));
addRoute('/contact', wrapPage(renderContactPage));
addRoute('/faq', wrapPage(renderFaqPage));
addRoute('/privacy-policy', wrapPage(renderPrivacyPolicyPage));
addRoute('/terms', wrapPage(renderTermsPage));
addRoute('/shipping-returns', wrapPage(renderShippingReturnsPage));
addRoute('/admin', (params) => {
  document.getElementById('header-area').style.display = 'none';
  document.getElementById('footer-area').style.display = 'none';
  document.getElementById('app').innerHTML = renderAdminPage();
  initAdminPage();
});

loadContent().then(() => {
  preloadCategories().then(() => {
    setupShell();
    initFaqChatbot();
    hideLoader();
    initRouter();
  });
});
