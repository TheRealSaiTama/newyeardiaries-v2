// ===== Store — Cart (localStorage) =====
import { updateHeaderCounts } from '../components/Header.js';

export function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

export function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => String(item.productId) === String(productId));
  if (existing) {
    existing.qty = qty;
  } else {
    cart.push({ productId, qty });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateHeaderCounts();
  showToast('Added to Cart');
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
