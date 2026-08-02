// ===== Store — Cart (localStorage) =====
import { updateHeaderCounts } from '../components/Header.js';

export function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

export function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => String(item.productId) === String(productId));
  if (existing) {
    // M4 fix: increment instead of replace — adding the same product again
    // should raise the quantity, not silently overwrite it.
    existing.qty = (Number(existing.qty) || 0) + (Number(qty) || 1);
  } else {
    cart.push({ productId, qty: Number(qty) || 1 });
  }
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) { console.warn('[cart] write failed', e); }
  try { updateHeaderCounts(); } catch { /* header not ready yet */ }
  try { showToast('Added to Cart'); } catch { /* toast not ready */ }
}

export function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => String(item.productId) !== String(productId));
  localStorage.setItem('cart', JSON.stringify(cart));
  updateHeaderCounts();
}

export function updateCartQty(productId, qty, minQty = 1) {
  const cart = getCart();
  const item = cart.find(i => String(i.productId) === String(productId));
  if (item) item.qty = Math.max(minQty, qty);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateHeaderCounts();
}

export function clearCart() {
  localStorage.removeItem('cart');
  updateHeaderCounts();
}

// Toast notification
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; background: #1A1A1A; color: white;
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;
      z-index: 700; transform: translateY(80px); opacity: 0; transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
  }
  toast.style.background = '#1A1A1A';
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.transform = 'translateY(80px)';
    toast.style.opacity = '0';
  }, 2500);
}

// Global function for inline onclick handlers
window.__addToCart = (id, qty) => addToCart(id, qty);

// ===== Quote List (localStorage) =====
export function getQuoteList() {
  return JSON.parse(localStorage.getItem('quoteList') || '[]');
}

export function addToQuoteList(productId, qty = 100) {
  const quoteList = getQuoteList();
  const existing = quoteList.find(item => String(item.productId) === String(productId));
  if (existing) {
    // Match cart behaviour: re-adding same product raises qty, not silent replace
    existing.qty = (Number(existing.qty) || 0) + (Number(qty) || 100);
  } else {
    quoteList.push({ productId, qty: Number(qty) || 100 });
  }
  localStorage.setItem('quoteList', JSON.stringify(quoteList));
  updateHeaderCounts();
  showToast('Added to Quote List');
}

export function removeFromQuoteList(productId) {
  let quoteList = getQuoteList();
  quoteList = quoteList.filter(item => String(item.productId) !== String(productId));
  localStorage.setItem('quoteList', JSON.stringify(quoteList));
  updateHeaderCounts();
}

export function updateQuoteQty(productId, qty) {
  const quoteList = getQuoteList();
  const item = quoteList.find(i => String(i.productId) === String(productId));
  if (item) item.qty = Math.max(10, qty);
  localStorage.setItem('quoteList', JSON.stringify(quoteList));
  updateHeaderCounts();
}

export function clearQuoteList() {
  localStorage.removeItem('quoteList');
  updateHeaderCounts();
}

window.__addToQuote = (id, qty) => addToQuoteList(id, qty);
