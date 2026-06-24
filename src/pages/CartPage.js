import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { getCart, removeFromCart, updateCartQty } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';

export async function renderCartPage() {
  const app = document.getElementById('app');
  const cart = getCart();

  let cartItems = (await Promise.all(
    cart.map(async item => {
      const product = await getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
  )).filter(Boolean);

  // Enforce MOQ on existing cart items
  cartItems.forEach(item => {
    const moq = item.product.minBulkOrder || 1;
    if (item.qty < moq) {
      updateCartQty(item.productId, moq, moq);
      item.qty = moq;
    }
  });

  // ponytail: cache the resolved items (product + qty) on window so the
  // confirm modal can compute the revised totals without re-fetching.
  window.__cartItemsCache = cartItems;

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
              ${cartItems.map(item => {
                const moq = item.product.minBulkOrder || 1;
                return `
                <div class="cart-item" data-product-id="${item.product.id}">
                  <div class="cart-item-image">
                    ${item.product.image
                      ? `<img src="${item.product.image}" alt="${item.product.title}">`
                      : `<div style="width:100%;height:100%;background:var(--color-surface-alt);display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="color:var(--color-accent);opacity:0.3;">menu_book</span></div>`}
                  </div>
                  <div class="cart-item-details">
                    <div class="cart-item-title">${item.product.title}</div>
                    <div class="cart-item-variant">${item.product.material} ${item.product.size ? '• ' + item.product.size : ''} • Min. ${moq} units</div>
                    <div class="qty-selector">
                      <button class="qty-minus" data-id="${item.product.id}" data-moq="${moq}">−</button>
                      <span class="qty-value">${item.qty}</span>
                      <button class="qty-plus" data-id="${item.product.id}">+</button>
                    </div>
                    <button class="btn btn--ghost btn--sm remove-cart-item" data-id="${item.product.id}" style="align-self:flex-start;color:var(--color-error);padding-left:0;">Remove</button>
                  </div>
                  <div class="cart-item-price">${formatPrice(item.product.price * item.qty)}</div>
                </div>
              `;
              }).join('')}
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
      const id = btn.dataset.id; // UUID string — parseInt corrupts it, leaving +/- dead
      const moq = parseInt(btn.dataset.moq) || 1;
      const item = cart.find(i => i.productId === id);
      if (item && item.qty > moq) { updateCartQty(id, item.qty - 1, moq); renderCartPage(); }
    });
  });
  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = cart.find(i => i.productId === id);
      if (!item) return;
      const newQty = item.qty + 1;
      const lineItem = cartItems.find(ci => ci.productId === id);
      confirmQtyChange(lineItem, newQty, (confirmed) => {
        if (confirmed) { updateCartQty(id, newQty, parseInt(btn.dataset.moq) || 1); renderCartPage(); }
      });
    });
  });
  document.querySelectorAll('.remove-cart-item').forEach(btn => {
    btn.addEventListener('click', () => { removeFromCart(btn.dataset.id); renderCartPage(); });
  });
}

// ponytail: self-contained confirm modal (no admin cross-import). Shows the
// proposed new quantity and the revised line + cart totals; user must hit OK
// before the cart is revised. Decreases apply directly; this gates increases
// where the bill goes up and a misclick is costly.
function confirmQtyChange(lineItem, newQty, cb) {
  const price = lineItem.product.price;
  const newLineTotal = price * newQty;

  // Revised cart total = current subtotal − this line's current total + new line total
  const cart = getCart();
  const allItems = window.__cartItemsCache || [];
  const curLineTotal = price * (cart.find(i => i.productId === lineItem.productId)?.qty || 0);
  const curSubtotal = allItems.reduce((s, it) => s + it.product.price * (cart.find(c => c.productId === it.productId)?.qty || 0), 0);
  const revisedTotal = curSubtotal - curLineTotal + newLineTotal;

  const overlay = document.createElement('div');
  overlay.className = 'cart-qty-confirm-overlay';
  overlay.innerHTML = `
    <div class="cart-qty-confirm" role="dialog" aria-modal="true">
      <div class="cart-qty-confirm__head">
        <h3>Update quantity?</h3>
        <button class="cart-qty-confirm__x" aria-label="Close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="cart-qty-confirm__body">
        <p class="cart-qty-confirm__product">${lineItem.product.title}</p>
        <p class="cart-qty-confirm__line">Change quantity from <strong>${cart.find(i => i.productId === lineItem.productId)?.qty || 0}</strong> to <strong>${newQty}</strong> units?</p>
        <div class="cart-qty-confirm__rows">
          <div class="cart-qty-confirm__row"><span>Item total</span><strong>${formatPrice(newLineTotal)}</strong></div>
          <div class="cart-qty-confirm__row cart-qty-confirm__row--total"><span>Revised cart total</span><strong>${formatPrice(revisedTotal)}</strong></div>
        </div>
      </div>
      <div class="cart-qty-confirm__actions">
        <button type="button" class="btn btn--ghost cart-qty-confirm__cancel">Cancel</button>
        <button type="button" class="btn btn--accent cart-qty-confirm__ok">Update to ${newQty}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = (result) => { overlay.remove(); cb(result); };
  overlay.querySelector('.cart-qty-confirm__ok').addEventListener('click', () => close(true));
  overlay.querySelector('.cart-qty-confirm__cancel').addEventListener('click', () => close(false));
  overlay.querySelector('.cart-qty-confirm__x').addEventListener('click', () => close(false));
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(false); });
}
