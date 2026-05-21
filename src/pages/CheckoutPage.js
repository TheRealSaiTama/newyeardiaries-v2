import { getCart, updateCartQty, clearCart } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';
import { navigateTo } from '../router.js';

function showToast(message, type = 'success') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; background: #1A1A1A; color: white;
      padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;
      z-index: 7000; transform: translateY(80px); opacity: 0; transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
  }
  if (type === 'error') toast.style.background = '#c0392b';
  else toast.style.background = '#1A1A1A';
  toast.textContent = message;
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.transform = 'translateY(80px)'; toast.style.opacity = '0'; }, 3000);
}

function getCheckoutData() {
  try { return JSON.parse(sessionStorage.getItem('checkoutData') || '{}'); } catch { return {}; }
}
function setCheckoutData(data) {
  sessionStorage.setItem('checkoutData', JSON.stringify(data));
}
function getCheckoutStep() {
  return sessionStorage.getItem('checkoutStep') || 'shipping';
}
function setCheckoutStep(step) {
  sessionStorage.setItem('checkoutStep', step);
}

function required(label) {
  return `${label}<span style="color:var(--color-error);margin-left:2px;">*</span>`;
}

export async function renderCheckoutPage() {
  const app = document.getElementById('app');
  const cart = getCart();

  if (cart.length === 0) {
    app.innerHTML = `
      <div class="page-content">
        <div class="container section" style="text-align:center;padding:var(--space-24) 0;">
          <span class="material-symbols-outlined" style="font-size:64px;color:var(--color-text-tertiary);">shopping_bag</span>
          <h1 class="heading-2" style="margin-top:var(--space-6);">Your cart is empty</h1>
          <p class="text-body" style="margin:var(--space-4) 0;">Add some products before proceeding to checkout.</p>
          <a href="/shop" class="btn btn--accent btn--lg">Browse Collection</a>
        </div>
      </div>
    `;
    return;
  }

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

  const step = getCheckoutStep();
  const checkoutData = getCheckoutData();

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const gstRate = 0.18;
  const cgst = subtotal * (gstRate / 2);
  const sgst = subtotal * (gstRate / 2);
  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + (subtotal * gstRate);

  const isShipping = step === 'shipping';
  const isPayment = step === 'payment';

  const stepperHtml = `
    <div class="checkout-stepper">
      <div class="step completed"><span class="step-indicator"><span class="material-symbols-outlined" style="font-size:16px;">check</span></span><span class="step-label">Cart</span></div>
      <div class="step-connector ${isPayment ? 'completed' : (isShipping ? 'completed' : '')}"></div>
      <div class="step ${isShipping ? 'active' : (isPayment ? 'completed' : '')}"><span class="step-indicator">${isPayment ? '<span class="material-symbols-outlined" style="font-size:16px;">check</span>' : '2'}</span><span class="step-label">Shipping</span></div>
      <div class="step-connector ${isPayment ? 'active' : ''}"></div>
      <div class="step ${isPayment ? 'active' : ''}"><span class="step-indicator">3</span><span class="step-label">Payment</span></div>
      <div class="step-connector"></div>
      <div class="step"><span class="step-indicator">4</span><span class="step-label">Review</span></div>
    </div>
  `;

  const orderSummaryHtml = `
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
                ${isShipping ? `
                <div class="qty-stepper checkout-qty-stepper">
                  <button class="qty-step-btn checkout-qty-minus" data-id="${item.product.id}" data-moq="${moq}">−</button>
                  <input type="number" class="qty-step-input checkout-qty-input" data-id="${item.product.id}" data-moq="${moq}" value="${item.qty}" min="${moq}" step="1">
                  <button class="qty-step-btn checkout-qty-plus" data-id="${item.product.id}" data-moq="${moq}">+</button>
                </div>
                ` : `<div style="font-size:var(--fs-sm);color:var(--color-text-secondary);">Qty: ${item.qty}</div>`}
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
      <div class="order-summary-total"><span>Total (incl. GST)</span><span id="checkout-total">${formatPrice(total)}</span></div>
    </div>
  `;

  let formHtml;
  if (isShipping) {
    formHtml = `
      <div class="checkout-form-section">
        <div class="checkout-form-group">
          <h2>Contact Information</h2>
          <div class="input-group"><label>${required('Email Address')}</label><input type="email" id="chk-email" class="input-field" placeholder="your@email.com" value="${checkoutData.email || ''}"></div>
          <div class="input-group"><label>${required('Phone Number')}</label><input type="tel" id="chk-phone" class="input-field" placeholder="+91 98765 43210" value="${checkoutData.phone || ''}"></div>
        </div>
        <div class="checkout-form-group">
          <h2>Shipping Address</h2>
          <div class="form-row">
            <div class="input-group"><label>${required('First Name')}</label><input type="text" id="chk-firstname" class="input-field" value="${checkoutData.firstName || ''}"></div>
            <div class="input-group"><label>${required('Last Name')}</label><input type="text" id="chk-lastname" class="input-field" value="${checkoutData.lastName || ''}"></div>
          </div>
          <div class="input-group"><label>Company (Optional)</label><input type="text" id="chk-company" class="input-field" value="${checkoutData.company || ''}"></div>
          <div class="input-group"><label>${required('Address')}</label><input type="text" id="chk-address" class="input-field" value="${checkoutData.address || ''}"></div>
          <div class="form-row">
            <div class="input-group"><label>${required('City')}</label><input type="text" id="chk-city" class="input-field" value="${checkoutData.city || ''}"></div>
            <div class="input-group"><label>${required('PIN Code')}</label><input type="text" id="chk-pin" class="input-field" value="${checkoutData.pin || ''}"></div>
          </div>
          <div class="input-group"><label>${required('State')}</label>
            <select id="chk-state" class="input-field select-field">
              <option value="" ${!checkoutData.state ? 'selected' : ''}>Select State</option>
              <option value="Delhi" ${checkoutData.state === 'Delhi' ? 'selected' : ''}>Delhi</option>
              <option value="Maharashtra" ${checkoutData.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
              <option value="Karnataka" ${checkoutData.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
              <option value="Tamil Nadu" ${checkoutData.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
              <option value="Telangana" ${checkoutData.state === 'Telangana' ? 'selected' : ''}>Telangana</option>
              <option value="Gujarat" ${checkoutData.state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
              <option value="Rajasthan" ${checkoutData.state === 'Rajasthan' ? 'selected' : ''}>Rajasthan</option>
              <option value="Uttar Pradesh" ${checkoutData.state === 'Uttar Pradesh' ? 'selected' : ''}>Uttar Pradesh</option>
              <option value="West Bengal" ${checkoutData.state === 'West Bengal' ? 'selected' : ''}>West Bengal</option>
              <option value="Punjab" ${checkoutData.state === 'Punjab' ? 'selected' : ''}>Punjab</option>
              <option value="Haryana" ${checkoutData.state === 'Haryana' ? 'selected' : ''}>Haryana</option>
              <option value="Madhya Pradesh" ${checkoutData.state === 'Madhya Pradesh' ? 'selected' : ''}>Madhya Pradesh</option>
              <option value="Bihar" ${checkoutData.state === 'Bihar' ? 'selected' : ''}>Bihar</option>
              <option value="Odisha" ${checkoutData.state === 'Odisha' ? 'selected' : ''}>Odisha</option>
              <option value="Kerala" ${checkoutData.state === 'Kerala' ? 'selected' : ''}>Kerala</option>
              <option value="Assam" ${checkoutData.state === 'Assam' ? 'selected' : ''}>Assam</option>
              <option value="Jharkhand" ${checkoutData.state === 'Jharkhand' ? 'selected' : ''}>Jharkhand</option>
              <option value="Chhattisgarh" ${checkoutData.state === 'Chhattisgarh' ? 'selected' : ''}>Chhattisgarh</option>
              <option value="Goa" ${checkoutData.state === 'Goa' ? 'selected' : ''}>Goa</option>
              <option value="Uttarakhand" ${checkoutData.state === 'Uttarakhand' ? 'selected' : ''}>Uttarakhand</option>
              <option value="Himachal Pradesh" ${checkoutData.state === 'Himachal Pradesh' ? 'selected' : ''}>Himachal Pradesh</option>
              <option value="Other" ${checkoutData.state === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="checkout-form-group">
          <h2>Tax Information (Optional)</h2>
          <div class="input-group"><label>GST Number</label><input type="text" id="chk-gst" class="input-field" placeholder="22AAAAA0000A1Z5" value="${checkoutData.gst || ''}"></div>
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
          <button class="btn btn--accent btn--lg" id="btn-continue-payment">Continue to Payment</button>
        </div>
      </div>
    `;
  } else {
    // Payment step
    formHtml = `
      <div class="checkout-form-section">
        <div class="checkout-form-group">
          <h2>Payment Method</h2>
          <div class="card" style="padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3);">
            <label style="display:flex;align-items:center;gap:var(--space-3);cursor:pointer;padding:var(--space-3);border:1px solid var(--color-border-light);border-radius:var(--radius-md);transition:all 0.2s;" class="payment-option active">
              <input type="radio" name="payment" value="cod" checked style="accent-color:var(--color-primary);">
              <div style="flex:1;">
                <strong>Cash on Delivery</strong>
                <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">Pay when your order is delivered</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:var(--space-3);cursor:pointer;padding:var(--space-3);border:1px solid var(--color-border-light);border-radius:var(--radius-md);transition:all 0.2s;" class="payment-option">
              <input type="radio" name="payment" value="upi" style="accent-color:var(--color-primary);">
              <div style="flex:1;">
                <strong>UPI / QR Code</strong>
                <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">Google Pay, PhonePe, Paytm, etc.</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:var(--space-3);cursor:pointer;padding:var(--space-3);border:1px solid var(--color-border-light);border-radius:var(--radius-md);transition:all 0.2s;" class="payment-option">
              <input type="radio" name="payment" value="bank" style="accent-color:var(--color-primary);">
              <div style="flex:1;">
                <strong>Bank Transfer / NEFT</strong>
                <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">Transfer directly to our account</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:var(--space-3);cursor:pointer;padding:var(--space-3);border:1px solid var(--color-border-light);border-radius:var(--radius-md);transition:all 0.2s;" class="payment-option">
              <input type="radio" name="payment" value="card" style="accent-color:var(--color-primary);">
              <div style="flex:1;">
                <strong>Credit / Debit Card</strong>
                <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);">Visa, Mastercard, RuPay</div>
              </div>
            </label>
          </div>
        </div>

        <div class="checkout-form-group">
          <h2>Shipping To</h2>
          <div class="card" style="padding:var(--space-4);background:var(--color-surface-alt);">
            <div style="font-weight:var(--fw-semibold);">${checkoutData.firstName || ''} ${checkoutData.lastName || ''}</div>
            <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);margin-top:var(--space-1);">${checkoutData.address || ''}</div>
            <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);">${checkoutData.city || ''}, ${checkoutData.state || ''} — ${checkoutData.pin || ''}</div>
            <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);margin-top:var(--space-1);">${checkoutData.phone || ''}</div>
            ${checkoutData.gst ? `<div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);">GST: ${checkoutData.gst}</div>` : ''}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-4);">
          <button class="btn btn--ghost" id="btn-back-shipping"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Back to Shipping</button>
          <button class="btn btn--accent btn--lg" id="btn-place-order">Place Order</button>
        </div>
      </div>
    `;
  }

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        <a href="/" style="font-family:var(--font-family-heading);font-size:var(--fs-xl);font-weight:var(--fw-bold);color:var(--color-text-primary);display:block;margin-bottom:var(--space-6);">New Year Diaries</a>
        ${stepperHtml}
        <div class="checkout-layout">
          ${formHtml}
          ${orderSummaryHtml}
        </div>
      </div>
    </div>
  `;

  // Quantity handlers (only on shipping step)
  if (isShipping) {
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
      const newTotal = newSub + newGst;

      document.getElementById('checkout-subtotal').textContent = formatPrice(newSub);
      document.getElementById('checkout-cgst').textContent = formatPrice(newCgst);
      document.getElementById('checkout-sgst').textContent = formatPrice(newSgst);
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

    // Continue to Payment
    document.getElementById('btn-continue-payment')?.addEventListener('click', () => {
      const email = document.getElementById('chk-email')?.value.trim();
      const phone = document.getElementById('chk-phone')?.value.trim();
      const firstName = document.getElementById('chk-firstname')?.value.trim();
      const lastName = document.getElementById('chk-lastname')?.value.trim();
      const address = document.getElementById('chk-address')?.value.trim();
      const city = document.getElementById('chk-city')?.value.trim();
      const pin = document.getElementById('chk-pin')?.value.trim();
      const state = document.getElementById('chk-state')?.value;

      const required = { email, phone, firstName, lastName, address, city, pin, state };
      const empty = Object.entries(required).filter(([k, v]) => !v);
      if (empty.length) {
        const labels = { email: 'Email', phone: 'Phone', firstName: 'First Name', lastName: 'Last Name', address: 'Address', city: 'City', pin: 'PIN Code', state: 'State' };
        showToast(`Please fill in: ${empty.map(([k]) => labels[k]).join(', ')}`, 'error');
        const firstEmpty = document.getElementById(`chk-${empty[0][0]}`);
        firstEmpty?.focus();
        return;
      }

      setCheckoutData({
        email, phone, firstName, lastName,
        company: document.getElementById('chk-company')?.value.trim() || '',
        address, city, pin, state,
        gst: document.getElementById('chk-gst')?.value.trim() || ''
      });
      setCheckoutStep('payment');
      renderCheckoutPage();
    });
  }

  // Payment step handlers
  if (isPayment) {
    document.getElementById('btn-back-shipping')?.addEventListener('click', () => {
      setCheckoutStep('shipping');
      renderCheckoutPage();
    });

    document.getElementById('btn-place-order')?.addEventListener('click', () => {
      clearCart();
      sessionStorage.removeItem('checkoutStep');
      sessionStorage.removeItem('checkoutData');
      navigateTo('/order-success');
    });

    // Payment option styling
    document.querySelectorAll('.payment-option').forEach(opt => {
      const radio = opt.querySelector('input[type="radio"]');
      radio?.addEventListener('change', () => {
        document.querySelectorAll('.payment-option').forEach(o => {
          o.style.borderColor = 'var(--color-border-light)';
          o.style.background = '';
        });
        opt.style.borderColor = 'var(--color-primary)';
        opt.style.background = 'rgba(160,82,45,0.04)';
      });
    });
    // Set initial active style
    const checked = document.querySelector('.payment-option input:checked');
    if (checked) {
      const parent = checked.closest('.payment-option');
      parent.style.borderColor = 'var(--color-primary)';
      parent.style.background = 'rgba(160,82,45,0.04)';
    }
  }
}
