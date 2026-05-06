import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { getCart, removeFromCart, updateCartQty } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';

export async function renderCartPage() {
  const app = document.getElementById('app');
  const cart = getCart();

  const cartItems = (await Promise.all(
    cart.map(async item => {
      const product = await getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
  )).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Your Cart' }])}
        <h1 class="heading-2" style="margin-bottom:var(--space-8);">Your Curated Selection</h1>

        ${cartItems.length === 0 ? `
          <div class="cart-empty">
            <span class="material-symbols-outlined">shopping_bag</span>
            <h2 class="heading-3" style="margin-bottom:var(--space-3);">Your cart is empty</h2>
            <p class="text-body" style="margin-bottom:var(--space-6);">Browse our collection to find the perfect diary or planner.</p>
            <a href="/shop" class="btn btn--accent">Browse Collection</a>
          </div>
        ` : `
          <div class="cart-layout">
            <div>
              ${cartItems.map(item => `
                <div class="cart-item" data-product-id="${item.product.id}">
                  <div class="cart-item-image">
                    ${item.product.image
                      ? `<img src="${item.product.image}" alt="${item.product.title}">`
                      : `<div style="width:100%;height:100%;background:var(--color-surface-alt);display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="color:var(--color-accent);opacity:0.3;">menu_book</span></div>`}
                  </div>
                  <div class="cart-item-details">
                    <div class="cart-item-title">${item.product.title}</div>
                    <div class="cart-item-variant">${item.product.material} ${item.product.size ? '• ' + item.product.size : ''}</div>
                    <div class="qty-selector">
                      <button class="qty-minus" data-id="${item.product.id}">−</button>
                      <span class="qty-value">${item.qty}</span>
                      <button class="qty-plus" data-id="${item.product.id}">+</button>
                    </div>
                    <button class="btn btn--ghost btn--sm remove-cart-item" data-id="${item.product.id}" style="align-self:flex-start;color:var(--color-error);padding-left:0;">Remove</button>
                  </div>
                  <div class="cart-item-price">${formatPrice(item.product.price * item.qty)}</div>
                </div>
              `).join('')}
              <div style="margin-top:var(--space-6);">
                <a href="/shop" class="btn btn--secondary"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Continue Curating</a>
              </div>
            </div>
            <div class="order-summary">
              <h3>Order Summary</h3>
              <div class="order-summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
              <div class="order-summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div class="order-summary-total"><span>Total</span><span>${formatPrice(subtotal)}</span></div>
              <a href="/checkout" class="btn btn--accent btn--lg btn--full" style="margin-top:var(--space-4);">Proceed to Checkout</a>
              <div style="text-align:center;margin-top:var(--space-3);">
                <span style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">Secure, encrypted payment processing.</span>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  document.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = cart.find(i => i.productId === id);
      if (item && item.qty > 1) { updateCartQty(id, item.qty - 1); renderCartPage(); }
    });
  });
  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = cart.find(i => i.productId === id);
      if (item) { updateCartQty(id, item.qty + 1); renderCartPage(); }
    });
  });
  document.querySelectorAll('.remove-cart-item').forEach(btn => {
    btn.addEventListener('click', () => { removeFromCart(parseInt(btn.dataset.id)); renderCartPage(); });
  });
}
