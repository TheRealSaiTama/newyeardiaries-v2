import { getCart, updateCartQty, clearCart } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';
import { navigateTo } from '../router.js';
import { supabase } from '../lib/supabase.js';
import { sendOrderEmail } from '../lib/notify.js';
import { renderCheckoutSkeleton } from '../components/Skeleton.js';

// Module-level storage for logo uploads (too large for sessionStorage).
let uploadedLogos = []; // Array of { name, dataUrl (image/jpeg;base64,...) }

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

// Module-level cache to keep cart item data and avoid redundant Supabase requests on step change
let cachedCartItems = null;
let lastCartJson = '';

function required(label) {
  return `${label}<span style="color:var(--color-error);margin-left:2px;">*</span>`;
}

export async function renderCheckoutPage() {
  const app = document.getElementById('app');
  const cart = getCart();

  if (cart.length === 0) {
    cachedCartItems = null;
    lastCartJson = '';
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

  const currentCartJson = JSON.stringify(cart);
  let cartItems;

  if (cachedCartItems && currentCartJson === lastCartJson) {
    cartItems = cachedCartItems;
  } else {
    // Show a clean skeleton loader instantly while fetching from Supabase
    app.innerHTML = renderCheckoutSkeleton();

    cartItems = (await Promise.all(
      cart.map(async item => {
        const product = await getProductById(item.productId);
        return product ? { ...item, product } : null;
      })
    )).filter(Boolean);

    cachedCartItems = cartItems;
    lastCartJson = currentCartJson;
  }

  // Enforce MOQ on existing cart items
  cartItems.forEach(item => {
    const moq = item.product.minBulkOrder || 1;
    if (item.qty < moq) {
      updateCartQty(item.productId, moq, moq);
      item.qty = moq;
    }
  });

  const checkoutData = getCheckoutData();
  const currentStep = getCheckoutStep(); // 'shipping' (step 1) | 'review' (step 2)

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const gstRate = 0.18;
  const cgst = subtotal * (gstRate / 2);
  const sgst = subtotal * (gstRate / 2);
  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + (subtotal * gstRate);

  // Stepper reflects the active step.
  const stepState = (n) => n < (currentStep === 'review' ? 2 : 1) ? 'completed'
    : n === (currentStep === 'review' ? 2 : 1) ? 'active' : '';
  const stepperHtml = `
    <div class="checkout-stepper">
      <div class="step ${stepState(1)}"><span class="step-indicator">${stepState(1) === 'completed' ? '<span class="material-symbols-outlined" style="font-size:16px;">check</span>' : '1'}</span><span class="step-label">Contact Info</span></div>
      <div class="step-connector ${stepState(1) === 'completed' ? 'completed' : ''}"></div>
      <div class="step ${stepState(2)}"><span class="step-indicator">${stepState(2) === 'completed' ? '<span class="material-symbols-outlined" style="font-size:16px;">check</span>' : '2'}</span><span class="step-label">Review</span></div>
      <div class="step-connector"></div>
      <div class="step"><span class="step-indicator">3</span><span class="step-label">Order Confirmation</span></div>
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
      <div class="order-summary-total"><span>Total (incl. GST)</span><span id="checkout-total">${formatPrice(total)}</span></div>
    </div>
  `;

  const formHtml = `
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-4);">
          <a href="/cart" class="btn btn--ghost"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Return to cart</a>
          <button class="btn btn--accent btn--lg" id="btn-save-proceed">Save and Proceed</button>
        </div>
      </div>
    `;

  // Step 2 — read-only review of the saved shipping/contact info, and interactive inputs for GST, Customisation, Additional Info, and Logo.
  const reviewHtml = `
    <div class="checkout-form-section">
      <div class="checkout-form-group">
        <h2>Review Your Information</h2>
        <p style="color:var(--color-text-secondary);font-size:var(--fs-sm);margin-bottom:var(--space-4);">
          Please confirm your contact and shipping details below, and fill in any branding or customisation requests.
        </p>
        <div class="checkout-review-card">
          ${[
            ['Name', `${checkoutData.firstName || ''} ${checkoutData.lastName || ''}`.trim()],
            ['Email', checkoutData.email],
            ['Phone', checkoutData.phone],
            ['Company', checkoutData.company],
            ['Address', checkoutData.address],
            ['City', checkoutData.city],
            ['PIN Code', checkoutData.pin],
            ['State', checkoutData.state],
          ].filter(([, v]) => v).map(([k, v]) => `
            <div class="checkout-review-field">
              <span class="checkout-review-field__label">${k}</span>
              <span class="checkout-review-field__value">${v}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="checkout-form-group">
        <h2>Tax Information (Optional)</h2>
        <div class="input-group"><label>GST Number</label><input type="text" id="chk-gst" class="input-field" placeholder="22AAAAA0000A1Z5" value="${checkoutData.gst || ''}"></div>
      </div>
      <div class="checkout-form-group">
        <h2>Customisation <a href="/branding" target="_blank" rel="noopener" class="checkout-form-link">Our customisation options →</a></h2>
        <div class="input-group"><textarea id="chk-customisation" class="input-field textarea-field" rows="3" placeholder="E.g. emboss company name on front cover, add custom date range inside...">${checkoutData.customisation || ''}</textarea></div>
      </div>
      <div class="checkout-form-group">
        <h2>Additional Information</h2>
        <div class="input-group"><textarea id="chk-additional-info" class="input-field textarea-field" rows="3" placeholder="Any special requests, delivery preferences, or notes for our team...">${checkoutData.additionalInfo || ''}</textarea></div>
      </div>
      <div class="checkout-form-group">
        <h2>Your Logo to be Printed</h2>
        <p class="checkout-logo-hint">Upload logo files you'd like printed on your products. Images will be converted to JPG.</p>
        <div class="checkout-logo-upload-area" id="logo-upload-area">
          <span class="material-symbols-outlined checkout-logo-upload-icon">cloud_upload</span>
          <span class="checkout-logo-upload-text">Drag &amp; drop images here or <label for="logo-file-input" class="checkout-logo-browse-link">browse files</label></span>
          <input type="file" id="logo-file-input" accept="image/*" multiple hidden>
        </div>
        <div id="logo-previews" class="checkout-logo-previews">${uploadedLogos.map((logo, i) => `
          <div class="checkout-logo-thumb" data-index="${i}">
            <img src="${logo.dataUrl}" alt="${logo.name}">
            <button type="button" class="checkout-logo-remove" data-index="${i}" title="Remove">
              <span class="material-symbols-outlined" style="font-size:14px;">close</span>
            </button>
            <span class="checkout-logo-filename">${logo.name}</span>
          </div>
        `).join('')}</div>
      </div>
      <div class="checkout-notice checkout-notice--warning" style="margin-top:var(--space-6);">
        <span class="material-symbols-outlined checkout-notice__icon">campaign</span>
        <div class="checkout-notice__body">
          <div class="checkout-notice__title">Please Note:</div>
          <p><strong>SHIPPING IS NOT FREE.</strong> Please continue with your order by selecting your preferred shipping choice, we will get back to you soon to give you the exact amount for shipping according to your location and shipping choice.</p>
          <p>Cash on Delivery (COD) is <strong>not</strong> available on this order.</p>
        </div>
      </div>
      <div class="checkout-notice checkout-notice--info" style="margin-top:var(--space-4);">
        <span class="material-symbols-outlined checkout-notice__icon">payments</span>
        <div class="checkout-notice__body">
          <div class="checkout-notice__title">Payment Options:</div>
          <p>You can use any payment option for this order:</p>
          <p class="checkout-notice__methods">Debit Card / Credit Card / Online Bank Transfer / NEFT / RTGS / IMPS / Cheque</p>
          <p class="checkout-notice__highlight">Your order will not be shipped until we receive your payment.</p>
        </div>
      </div>
      <div class="checkout-notice checkout-notice--important" style="margin-top:var(--space-4); margin-bottom:var(--space-6);">
        <span class="material-symbols-outlined checkout-notice__icon">block</span>
        <div class="checkout-notice__body">
          <div class="checkout-notice__title">No Payment Will Be Made Now</div>
          <p class="checkout-notice__highlight">No payment will be collected at checkout.</p>
          <p>Placing this order does <strong>not</strong> require any payment. Our team will contact you shortly with the final total (including shipping) and payment instructions.</p>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-4);gap:var(--space-3);">
        <button class="btn btn--ghost btn--lg" id="btn-edit-info"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Edit Info</button>
        <button class="btn btn--accent btn--lg" id="btn-place-order">Place Order</button>
      </div>
    </div>
  `;

  const mainContent = currentStep === 'review' ? reviewHtml : formHtml;

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        <a href="/" style="font-family:var(--font-family-heading);font-size:var(--fs-xl);font-weight:var(--fw-bold);color:var(--color-text-primary);display:block;margin-bottom:var(--space-6);">New Year Diaries</a>
        ${stepperHtml}
        <div class="checkout-layout">
          ${mainContent}
          ${orderSummaryHtml}
        </div>
      </div>
    </div>
  `;

  // Quantity handlers
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
      const id = btn.dataset.id; // UUID string — parseInt corrupts it
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
      const id = btn.dataset.id;
      const input = document.querySelector(`.checkout-qty-input[data-id="${id}"]`);
      const newQty = (parseInt(input.value) || 1) + 1;
      input.value = newQty;
      updateCartQty(id, newQty);
      recalcCheckout();
    });
  });

  document.querySelectorAll('.checkout-qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.id;
      const moq = parseInt(input.dataset.moq);
      const newQty = Math.max(moq, parseInt(input.value) || moq);
      input.value = newQty;
      updateCartQty(id, newQty, moq);
      recalcCheckout();
    });
  });

  // ---- Logo upload handling ----
  function convertToJpg(file, maxWidth = 1200) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(1, maxWidth / img.width);
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  function renderLogoPreviews() {
    const container = document.getElementById('logo-previews');
    if (!container) return;
    container.innerHTML = uploadedLogos.map((logo, i) => `
      <div class="checkout-logo-thumb" data-index="${i}">
        <img src="${logo.dataUrl}" alt="${logo.name}">
        <button type="button" class="checkout-logo-remove" data-index="${i}" title="Remove">
          <span class="material-symbols-outlined" style="font-size:14px;">close</span>
        </button>
        <span class="checkout-logo-filename">${logo.name}</span>
      </div>
    `).join('');
    container.querySelectorAll('.checkout-logo-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedLogos.splice(parseInt(btn.dataset.index), 1);
        renderLogoPreviews();
      });
    });
  }

  async function handleLogoFiles(files) {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;
    const results = await Promise.all(
      validFiles.map(async f => {
        const dataUrl = await convertToJpg(f);
        if (!dataUrl) return null;
        const name = f.name.replace(/\.[^.]+$/, '') + '.jpg';
        return { name, dataUrl };
      })
    );
    results.filter(Boolean).forEach(r => uploadedLogos.push(r));
    renderLogoPreviews();
  }

  const uploadArea = document.getElementById('logo-upload-area');
  const fileInput = document.getElementById('logo-file-input');

  if (uploadArea) {
    uploadArea.addEventListener('click', (e) => {
      if (e.target.closest('.checkout-logo-browse-link')) return;
      fileInput?.click();
    });
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      handleLogoFiles(e.dataTransfer.files);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) handleLogoFiles(fileInput.files);
      fileInput.value = '';
    });
  }

  // Render any previously uploaded logos (when step 1 is re-rendered)
  renderLogoPreviews();

  // Step 1 → Step 2: validate the form, persist the data, advance to review.
  // ponytail: validation + collection shared with submit via collectCheckoutData().
  function collectCheckoutData() {
    const email = document.getElementById('chk-email')?.value.trim();
    const phone = document.getElementById('chk-phone')?.value.trim();
    const firstName = document.getElementById('chk-firstname')?.value.trim();
    const lastName = document.getElementById('chk-lastname')?.value.trim();
    const address = document.getElementById('chk-address')?.value.trim();
    const city = document.getElementById('chk-city')?.value.trim();
    const pin = document.getElementById('chk-pin')?.value.trim();
    const state = document.getElementById('chk-state')?.value;
    const requiredFields = { email, phone, firstName, lastName, address, city, pin, state };
    const empty = Object.entries(requiredFields).filter(([, v]) => !v);

    const existing = getCheckoutData();

    return {
      data: {
        email, phone, firstName, lastName,
        company: document.getElementById('chk-company')?.value.trim() || '',
        address, city, pin, state,
        gst: document.getElementById('chk-gst') ? document.getElementById('chk-gst').value.trim() : (existing.gst || ''),
        customisation: document.getElementById('chk-customisation') ? document.getElementById('chk-customisation').value.trim() : (existing.customisation || ''),
        additionalInfo: document.getElementById('chk-additional-info') ? document.getElementById('chk-additional-info').value.trim() : (existing.additionalInfo || ''),
      },
      empty,
    };
  }

  document.getElementById('btn-save-proceed')?.addEventListener('click', () => {
    const { data, empty } = collectCheckoutData();
    if (empty.length) {
      const labels = { email: 'Email', phone: 'Phone', firstName: 'First Name', lastName: 'Last Name', address: 'Address', city: 'City', pin: 'PIN Code', state: 'State' };
      showToast(`Please fill in: ${empty.map(([k]) => labels[k]).join(', ')}`, 'error');
      document.getElementById(`chk-${empty[0][0]}`)?.focus();
      return;
    }
    setCheckoutData(data);
    setCheckoutStep('review');
    renderCheckoutPage();
    window.scrollTo(0, 0);
  });

  // Step 2 → Step 1: go back to edit (data already persisted, so the form
  // stays populated — user doesn't rewrite anything).
  document.getElementById('btn-edit-info')?.addEventListener('click', () => {
    const gstVal = document.getElementById('chk-gst')?.value.trim() || '';
    const customisationVal = document.getElementById('chk-customisation')?.value.trim() || '';
    const additionalInfoVal = document.getElementById('chk-additional-info')?.value.trim() || '';

    const data = getCheckoutData();
    data.gst = gstVal;
    data.customisation = customisationVal;
    data.additionalInfo = additionalInfoVal;
    setCheckoutData(data);

    setCheckoutStep('shipping');
    renderCheckoutPage();
    window.scrollTo(0, 0);
  });

  // Place Order (step 2) — reads the persisted data and submits.
  document.getElementById('btn-place-order')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-place-order');

    // On step 2 the form is interactive. Read the values directly from the DOM!
    const gstVal = document.getElementById('chk-gst')?.value.trim() || '';
    const customisationVal = document.getElementById('chk-customisation')?.value.trim() || '';
    const additionalInfoVal = document.getElementById('chk-additional-info')?.value.trim() || '';

    const data = getCheckoutData();
    data.gst = gstVal;
    data.customisation = customisationVal;
    data.additionalInfo = additionalInfoVal;
    setCheckoutData(data);

    const requiredFields = {
      email: data.email, phone: data.phone, firstName: data.firstName,
      lastName: data.lastName, address: data.address, city: data.city,
      pin: data.pin, state: data.state,
    };
    const empty = Object.entries(requiredFields).filter(([, v]) => !v);
    if (empty.length) {
      const labels = { email: 'Email', phone: 'Phone', firstName: 'First Name', lastName: 'Last Name', address: 'Address', city: 'City', pin: 'PIN Code', state: 'State' };
      showToast(`Missing info: ${empty.map(([k]) => labels[k]).join(', ')}. Please go back and fill it in.`, 'error');
      return;
    }

    // ponytail: no payment UI now → default to bank transfer (offline confirmation).
    const paymentMethod = 'bank';

    // Generate a human-readable order number
    const orderNumber = 'NYD' + Date.now().toString().slice(-8);
    const gstAmount = subtotal * gstRate;
    const finalTotal = shipping > 0 ? total + shipping : total;

    // Build order items
    const items = cartItems.map(item => ({
      product_id: item.productId,
      product_name: item.product.title || item.product.name,
      product_image: item.product.image || item.product.images?.[0] || null,
      material: item.product.material || null,
      size: item.product.size || null,
      quantity: item.qty,
      unit_price: Number(item.product.price),
      line_total: Number((item.product.price * item.qty).toFixed(2)),
    }));

    // Disable button + show progress while we save + email
    if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }
    showToast('Processing your order…', 'success');

    // 1. Insert order row
    let orderRow = null;
    let orderErr = null;

    const insertPayload = {
      order_number: orderNumber,
      first_name: data.firstName,
      last_name: data.lastName,
      company: data.company || null,
      gst: data.gst || null,
      country: 'India',
      address_line_1: data.address,
      address_line_2: null,
      city: data.city,
      state: data.state,
      postcode: data.pin,
      phone: data.phone,
      email: data.email,
      special_instructions: null,
      customisation: data.customisation || null,
      additional_info: data.additionalInfo || null,
      logo_images: uploadedLogos.length ? uploadedLogos.map(l => ({ name: l.name, data: l.dataUrl })) : [],
      payment_method: paymentMethod,
      privacy_agreed: true,
      subtotal: Number(subtotal.toFixed(2)),
      gst_amount: Number(gstAmount.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      status: 'pending',
    };

    const res = await supabase.from('orders').insert(insertPayload).select().single();
    orderRow = res.data;
    orderErr = res.error;

    // Fallback: If new columns are missing in remote schema, serialize them into special_instructions
    if (orderErr && (orderErr.code === 'PGRST204' || orderErr.code === '42703' || orderErr.message?.includes('column'))) {
      console.warn('New columns not found in database schema, falling back to special_instructions serialization');
      
      const serializedInstructions = [
        data.customisation ? `[Customisation Requirements]\n${data.customisation}` : null,
        data.additionalInfo ? `[Additional Info]\n${data.additionalInfo}` : null,
        uploadedLogos.length ? `[Uploaded Logos]\n${uploadedLogos.map(l => l.name).join(', ')}` : null
      ].filter(Boolean).join('\n\n');

      const fallbackPayload = {
        order_number: orderNumber,
        first_name: data.firstName,
        last_name: data.lastName,
        company: data.company || null,
        gst: data.gst || null,
        country: 'India',
        address_line_1: data.address,
        address_line_2: null,
        city: data.city,
        state: data.state,
        postcode: data.pin,
        phone: data.phone,
        email: data.email,
        special_instructions: serializedInstructions || null,
        payment_method: paymentMethod,
        privacy_agreed: true,
        subtotal: Number(subtotal.toFixed(2)),
        gst_amount: Number(gstAmount.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
        status: 'pending',
      };

      const fallbackRes = await supabase.from('orders').insert(fallbackPayload).select().single();
      orderRow = fallbackRes.data;
      orderErr = fallbackRes.error;
    }

    if (orderErr) {
      console.error('Order insert failed:', orderErr);
      showToast('Could not place order. Please try again.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
      return;
    }

    // 2. Insert order items (linked to the new order)
    const { error: itemsErr } = await supabase.from('order_items').insert(
      items.map(it => ({ ...it, order_id: orderRow.id }))
    );
    if (itemsErr) console.error('Order items insert failed:', itemsErr);

    // 3. Send notification email (fire-and-forget; don't block success)
    sendOrderEmail({
      orderNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      gst: data.gst,
      addressLine1: data.address,
      city: data.city,
      state: data.state,
      postcode: data.pin,
      country: 'India',
      phone: data.phone,
      email: data.email,
      items: items.map(it => ({
        name: it.product_name,
        sku: it.product_id,
        qty: it.quantity,
        unitPrice: it.unit_price,
        image: it.product_image,
        lineTotal: it.line_total,
      })),
      paymentMethod,
      tAndCAgreed: true,
      subtotal: Number(subtotal.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(finalTotal.toFixed(2)),
      customisation: data.customisation || '',
      additionalInfo: data.additionalInfo || '',
      logos: uploadedLogos,
    }).catch(e => console.error('Order email failed:', e));

    // 4. Clear cart + redirect to success
    clearCart();
    cachedCartItems = null;
    lastCartJson = '';
    sessionStorage.removeItem('checkoutStep');
    sessionStorage.removeItem('checkoutData');
    sessionStorage.setItem('lastOrderNumber', orderNumber);
    uploadedLogos = [];
    navigateTo('/order-success');
  });
}
