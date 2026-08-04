import { updateHeaderCounts } from '../components/Header.js';
import {
  parseStorageList,
  addLineItem,
  removeLineItem,
  setLineQty,
} from '../lib/cartStorage.js';

export function getCart() {
  return parseStorageList(localStorage.getItem('cart'));
}

function saveCart(cart) {
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) { console.warn('[cart] write failed', e); }
}

export function addToCart(productId, qty = 1) {
  const cart = addLineItem(getCart(), productId, qty, 1);
  saveCart(cart);
  try { updateHeaderCounts(); } catch { /* header not ready yet */ }
  try { showToast('Added to Cart'); } catch { /* toast not ready */ }
}

export function removeFromCart(productId) {
  saveCart(removeLineItem(getCart(), productId));
  try { updateHeaderCounts(); } catch { /* header not ready */ }
}

export function updateCartQty(productId, qty, minQty = 1) {
  saveCart(setLineQty(getCart(), productId, qty, minQty));
  try { updateHeaderCounts(); } catch { /* header not ready */ }
}

export function clearCart() {
  try { localStorage.removeItem('cart'); } catch { /* ignore */ }
  try { updateHeaderCounts(); } catch { /* header not ready */ }
}

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

window.__addToCart = (id, qty) => addToCart(id, qty);

export function getQuoteList() {
  return parseStorageList(localStorage.getItem('quoteList'));
}

function saveQuote(list) {
  try { localStorage.setItem('quoteList', JSON.stringify(list)); } catch (e) { console.warn('[quote] write failed', e); }
}

export function addToQuoteList(productId, qty = 100) {
  const quoteList = addLineItem(getQuoteList(), productId, qty, 100);
  saveQuote(quoteList);
  try { updateHeaderCounts(); } catch { /* header not ready */ }
  try { showToast('Added to Quote List'); } catch { /* toast not ready */ }
}

export function removeFromQuoteList(productId) {
  saveQuote(removeLineItem(getQuoteList(), productId));
  try { updateHeaderCounts(); } catch { /* header not ready */ }
}

export function updateQuoteQty(productId, qty) {
  saveQuote(setLineQty(getQuoteList(), productId, qty, 10));
  try { updateHeaderCounts(); } catch { /* header not ready */ }
}

export function clearQuoteList() {
  try { localStorage.removeItem('quoteList'); } catch { /* ignore */ }
  try { updateHeaderCounts(); } catch { /* header not ready */ }
}

window.__addToQuote = (id, qty) => addToQuoteList(id, qty);
