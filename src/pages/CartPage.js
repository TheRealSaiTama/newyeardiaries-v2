import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { getCart, removeFromCart, updateCartQty } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';
import { supabase } from '../lib/supabase.js';

// ponytail: getProductById reads from the active-only 30s cache, so an
// inactive/just-edited product returns null and the cart silently drops the
// item (badge counts it, bill doesn't). Fallback to a direct single-row
// Supabase fetch with no active filter so every item the user added renders.
async function resolveCartItem(item) {
  const cached = await getProductById(item.productId);
  if (cached) return { ...item, product: cached };
  const { data } = await supabase
    .from('products')
    .select('*, category:categories!products_category_id_fkey(name, slug)')
    .eq('id', item.productId)
    .maybeSingle();
  if (!data) return null;
  return {
    ...item,
    product: {
      id: data.id,
      slug: data.slug,
      name: data.name,
      title: data.name,
      material: data.material || '',
      size: data.size || '',
      price: Number(data.price) || 0,
      image: (data.images && data.images[0]) || '',
      images: data.images || [],
      minBulkOrder: data.min_bulk_order ?? 1,
      inStock: data.in_stock !== false,
      active: data.active !== false,
    },
  };
}

export async function renderCartPage() {
  const app = document.getElementById('app');
  const cart = getCart();

  let cartItems = (await Promise.all(
    cart.map(async item => resolveCartItem(item))
  )).filter(Boolean);

  // ponytail: if a product was deleted entirely, drop the orphan so the bill
  // never carries a phantom line. Keeps cart + badge in sync.
  if (cartItems.length !== cart.length) {
    const validIds = new Set(cartItems.map(i => i.productId));
    cart.filter(i => !validIds.has(i.productId)).forEach(i => removeFromCart(i.productId));
  }

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
                    <div class="qty-stepper" style="align-self:flex-start;">
                      <button class="qty-step-btn qty-minus" data-id="${item.product.id}" data-moq="${moq}">−</button>
                      <input type="number" class="qty-step-input qty-input" data-id="${item.product.id}" data-moq="${moq}" value="${item.qty}" min="${moq}">
                      <button class="qty-step-btn qty-plus" data-id="${item.product.id}">+</button>
                    </div>
                    <button class="btn btn--accent btn--sm update-cart-item-btn" data-id="${item.product.id}" data-original-qty="${item.qty}" style="display:none;align-self:flex-start;margin-top:var(--space-1);">Update Cart</button>
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

  function checkQtyChange(id) {
    const input = document.querySelector(`.qty-input[data-id="${id}"]`);
    const btn = document.querySelector(`.update-cart-item-btn[data-id="${id}"]`);
    if (!input || !btn) return;
    
    const originalQty = parseInt(btn.dataset.originalQty) || 0;
    const moq = parseInt(input.dataset.moq) || 1;
    let currentVal = parseInt(input.value);
    
    if (isNaN(currentVal)) {
      btn.style.display = 'none';
      return;
    }
    
    if (currentVal !== originalQty && currentVal >= moq) {
      btn.style.display = 'block';
    } else {
      btn.style.display = 'none';
    }
  }

  document.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const moq = parseInt(btn.dataset.moq) || 1;
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (!input) return;
      const currentVal = parseInt(input.value) || moq;
      const newQty = Math.max(moq, currentVal - 1);
      input.value = newQty;
      checkQtyChange(id);
    });
  });

  document.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (!input) return;
      const currentVal = parseInt(input.value) || 1;
      const newQty = currentVal + 1;
      input.value = newQty;
      checkQtyChange(id);
    });
  });

  document.querySelectorAll('.qty-input').forEach(input => {
    const id = input.dataset.id;
    const check = () => checkQtyChange(id);
    
    input.addEventListener('input', check);
    input.addEventListener('change', () => {
      const moq = parseInt(input.dataset.moq) || 1;
      let val = parseInt(input.value);
      if (isNaN(val) || val < moq) {
        val = moq;
      }
      input.value = val;
      check();
    });
  });

  document.querySelectorAll('.update-cart-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const input = document.querySelector(`.qty-input[data-id="${id}"]`);
      if (!input) return;
      const moq = parseInt(input.dataset.moq) || 1;
      const newQty = Math.max(moq, parseInt(input.value) || moq);
      
      updateCartQty(id, newQty, moq);
      renderCartPage();
    });
  });

  document.querySelectorAll('.remove-cart-item').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.id);
      renderCartPage();
    });
  });
}
