import { getCart } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';

export async function renderCheckoutPage() {
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
                <span style="font-weight:var(--fw-semibold);">₹250</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-4);">
              <a href="/cart" class="btn btn--ghost"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Return to cart</a>
              <button class="btn btn--accent btn--lg">Continue to Payment</button>
            </div>
          </div>

          <div class="order-summary">
            <h3>Order Summary</h3>
            ${cartItems.map(item => `
              <div style="display:flex;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light);align-items:center;">
                <div style="width:50px;height:50px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  ${item.product.image
                    ? `<img src="${item.product.image}" alt="${item.product.title}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-md);">`
                    : `<span class="material-symbols-outlined" style="font-size:18px;color:var(--color-accent);opacity:0.4);">menu_book</span>`}
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:var(--fs-sm);font-weight:var(--fw-semibold);">${item.product.title}</div>
                  <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">${item.product.material || ''} ${item.product.size ? '• Qty ' + item.qty : 'Qty ' + item.qty}</div>
                </div>
                <div style="font-weight:var(--fw-semibold);font-size:var(--fs-sm);">${formatPrice(item.product.price * item.qty)}</div>
              </div>
            `).join('')}
            <div class="order-summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
            <div class="order-summary-row"><span>Shipping</span><span>${subtotal >= 5000 ? 'Free' : '₹250'}</span></div>
            <div class="order-summary-total"><span>Total</span><span>${formatPrice(subtotal >= 5000 ? subtotal : subtotal + 250)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
