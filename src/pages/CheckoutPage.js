import { getCart, updateCartQty } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';

export async function renderCheckoutPage() {
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

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const gstRate = 0.18;
  const cgst = subtotal * (gstRate / 2);
  const sgst = subtotal * (gstRate / 2);
  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + (subtotal * gstRate) + shipping;

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        <a href="/" style="font-family:var(--font-family-heading);font-size:var(--fs-xl);font-weight:var(--fw-bold);color:var(--color-text-primary);display:block;margin-bottom:var(--space-6);">New Year Diaries</a>
        <div class="checkout-stepper">
          <div class="step completed"><span class="step-indicator"><span class="material-symbols-outlined" style="font-size:16px;">check</span></span><span class="step-label">Cart</span></div>
          <div class="step-connector completed"></div>
          <div class="step active"><span class="step-indicator">2</span><span class="step-label">Shipping</span></div>
          <div class="step-connector"></div>
          <div class="step"><span class="step-indicator">3</span><span class="step-label">Payment</span></div>
          <div class="step-connector"></div>
          <div class="step"><span class="step-indicator">4</span><span class="step-label">Review</span></div>
        </div>

        <div class="checkout-layout">
          <div class="checkout-form-section">
            <div class="checkout-form-group">
              <h2>Contact Information</h2>
              <div class="input-group"><label>Email Address</label><input type="email" class="input-field" placeholder="your@email.com"></div>
              <div class="input-group"><label>Phone Number</label><input type="tel" class="input-field" placeholder="+91 98765 43210"></div>
            </div>
            <div class="checkout-form-group">
              <h2>Shipping Address</h2>
              <div class="form-row">
                <div class="input-group"><label>First Name</label><input type="text" class="input-field"></div>
                <div class="input-group"><label>Last Name</label><input type="text" class="input-field"></div>
              </div>
              <div class="input-group"><label>Company (Optional)</label><input type="text" class="input-field"></div>
              <div class="input-group"><label>Address</label><input type="text" class="input-field"></div>
              <div class="form-row">
                <div class="input-group"><label>City</label><input type="text" class="input-field"></div>
                <div class="input-group"><label>PIN Code</label><input type="text" class="input-field"></div>
              </div>
              <div class="input-group"><label>State</label><select class="input-field select-field"><option>Select State</option></select></div>
            </div>
            <div class="checkout-form-group">
              <h2>Shipping Method</h2>
              <div class="card" style="padding:var(--space-4);display:flex;align-items:center;gap:var(--space-3);">
                <input type="radio" checked name="shipping" id="standard">
                <label for="standard" style="flex:1;"><strong>Standard Shipping</strong><br><span class="text-sm">5-7 business days • Free on orders above ₹5,000</span></label>
                <span style="font-weight:var(--fw-semibold);">${shipping > 0 ? '₹' + shipping : 'Free'}</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-4);">
              <a href="/cart" class="btn btn--ghost"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Return to cart</a>
              <button class="btn btn--accent btn--lg">Continue to Payment</button>
            </div>
          </div>

          <div class="order-summary">
            <h3>Order Summary</h3>
            <div id="checkout-items">
              ${cartItems.map(item => {
                const moq = item.product.minBulkOrder || 1;
                return `
                  <div class="checkout-item" data-product-id="${item.product.id}" style="display:flex;gap:var(--space-3);padding:var(--space-4) 0;border-bottom:1px solid var(--color-border-light);align-items:flex-start;">
                    <div style="width:56px;height:56px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      ${item.product.image
                        ? `<img src="${item.product.image}" alt="${item.product.title}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);">`
                        : `<span class="material-symbols-outlined" style="font-size:18px;color:var(--color-accent);opacity:0.4;">menu_book</span>`}
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:var(--fs-sm);font-weight:var(--fw-semibold);">${item.product.title}</div>
                      <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin-bottom:var(--space-2);">${item.product.material || ''} ${item.product.size ? '• ' + item.product.size : ''} • Min. ${moq} units</div>
                      <div class="qty-stepper checkout-qty-stepper">
                        <button class="qty-step-btn checkout-qty-minus" data-id="${item.product.id}" data-moq="${moq}">−</button>
                        <input type="number" class="qty-step-input checkout-qty-input" data-id="${item.product.id}" data-moq="${moq}" value="${item.qty}" min="${moq}" step="1">
                        <button class="qty-step-btn checkout-qty-plus" data-id="${item.product.id}" data-moq="${moq}">+</button>
                      </div>
                    </div>
                    <div style="font-weight:var(--fw-semibold);font-size:var(--fs-sm);text-align:right;">
                      <div class="checkout-item-subtotal">${formatPrice(item.product.price * item.qty)}</div>
                      <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">₹${Number(item.product.price).toLocaleString()} × ${item.qty}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="order-summary-row"><span>Subtotal</span><span id="checkout-subtotal">${formatPrice(subtotal)}</span></div>
            <div class="order-summary-row gst-row"><span>CGST (9%)</span><span id="checkout-cgst">${formatPrice(cgst)}</span></div>
            <div class="order-summary-row gst-row"><span>SGST (9%)</span><span id="checkout-sgst">${formatPrice(sgst)}</span></div>
            <div class="order-summary-row"><span>Shipping</span><span id="checkout-shipping">${shipping > 0 ? '₹' + shipping : 'Free'}</span></div>
            <div class="order-summary-total"><span>Total (incl. GST)</span><span id="checkout-total">${formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  function recalcCheckout() {
    const cart = getCart();
    let newSub = 0;
    cart.forEach(item => {
      const el = document.querySelector(`.checkout-item[data-product-id="${item.productId}"]`);
      if (!el) return;
      const price = cartItems.find(c => c.product.id === item.productId)?.product.price || 0;
      const lineTotal = price * item.qty;
      newSub += lineTotal;
      const subtotalEl = el.querySelector('.checkout-item-subtotal');
      if (subtotalEl) subtotalEl.textContent = formatPrice(lineTotal);
      const detailEl = el.querySelector('.checkout-item-subtotal + div');
      if (detailEl) detailEl.textContent = `₹${Number(price).toLocaleString()} × ${item.qty}`;
    });

    const newGst = newSub * gstRate;
    const newCgst = newGst / 2;
    const newSgst = newGst / 2;
    const newShipping = newSub >= 5000 ? 0 : 250;
    const newTotal = newSub + newGst + newShipping;

    document.getElementById('checkout-subtotal').textContent = formatPrice(newSub);
    document.getElementById('checkout-cgst').textContent = formatPrice(newCgst);
    document.getElementById('checkout-sgst').textContent = formatPrice(newSgst);
    document.getElementById('checkout-shipping').textContent = newShipping > 0 ? '₹' + newShipping : 'Free';
    document.getElementById('checkout-total').textContent = formatPrice(newTotal);
  }

  document.querySelectorAll('.checkout-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const moq = parseInt(btn.dataset.moq);
      const input = document.querySelector(`.checkout-qty-input[data-id="${id}"]`);
      const newQty = Math.max(moq, (parseInt(input.value) || moq) - 1);
      input.value = newQty;
      updateCartQty(id, newQty, moq);
      recalcCheckout();
    });
  });

  document.querySelectorAll('.checkout-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const input = document.querySelector(`.checkout-qty-input[data-id="${id}"]`);
      const newQty = (parseInt(input.value) || 1) + 1;
      input.value = newQty;
      updateCartQty(id, newQty);
      recalcCheckout();
    });
  });

  document.querySelectorAll('.checkout-qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const id = parseInt(input.dataset.id);
      const moq = parseInt(input.dataset.moq);
      const newQty = Math.max(moq, parseInt(input.value) || moq);
      input.value = newQty;
      updateCartQty(id, newQty, moq);
      recalcCheckout();
    });
  });
}