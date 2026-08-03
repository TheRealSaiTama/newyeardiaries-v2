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
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
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
  const gstAmount = subtotal * gstRate;
  const shipping = subtotal >= 5000 ? 0 : 250;
  const total = subtotal + gstAmount;

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
      <div class="order-summary-row gst-row"><span>GST (18%)</span><span id="checkout-gst">${formatPrice(gstAmount)}</span></div>
      <div class="order-summary-total"><span>Total (incl. GST)</span><span id="checkout-total">${formatPrice(total)}</span></div>
    </div>
  `;

  // Step 1 — all form fields live here (contact, shipping, tax, branding, files)
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
        <div class="checkout-form-group">
          <h2>Tax Information (Optional)</h2>
          <div class="input-group"><label>GST Number</label><input type="text" id="chk-gst" class="input-field" placeholder="22AAAAA0000A1Z5" value="${checkoutData.gst || ''}"></div>
        </div>
        <div class="checkout-form-group">
          <h2>Additional Information</h2>
          <div class="input-group"><textarea id="chk-additional-info" class="input-field textarea-field" rows="3" placeholder="Any special requests, delivery preferences, or notes for our team...">${checkoutData.additionalInfo || ''}</textarea></div>
        </div>
        <div class="checkout-form-group">
          <h2>Attach your logo and text / pdf file here</h2>
          <p class="checkout-logo-hint">Upload logo, text, or PDF files for printing on your products. Images are converted to JPG.</p>
          <div class="checkout-logo-upload-area" id="logo-upload-area">
            <span class="material-symbols-outlined checkout-logo-upload-icon">cloud_upload</span>
            <span class="checkout-logo-upload-text">Drag &amp; drop files here or <label for="logo-file-input" class="checkout-logo-browse-link">browse files</label></span>
            <input type="file" id="logo-file-input" accept="image/*,.pdf,.txt,.doc,.docx,application/pdf,text/plain" multiple hidden>
          </div>
          <div id="logo-previews" class="checkout-logo-previews"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-4);">
          <a href="/cart" class="btn btn--ghost"><span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span> Return to cart</a>
          <button class="btn btn--accent btn--lg" id="btn-save-proceed">Save and Proceed</button>
        </div>
      </div>
    `;

  // Step 2 — review box only (read-only) + payment notices + place order
  const reviewHtml = `
    <div class="checkout-form-section">
      <div class="checkout-form-group">
        <h2>Review Your Information</h2>
        <p style="color:var(--color-text-secondary);font-size:var(--fs-sm);margin-bottom:var(--space-4);">
          Please confirm your details below before placing the order.
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
            ['GST Number', checkoutData.gst],
            ['Additional Info', checkoutData.additionalInfo],
            ['Attachments', uploadedLogos.length ? uploadedLogos.map(l => l.name).join(', ') : ''],
          ].filter(([, v]) => v).map(([k, v]) => `
            <div class="checkout-review-field">
              <span class="checkout-review-field__label">${k}</span>
              <span class="checkout-review-field__value">${v}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <!-- PDF copy inside colored cards (shipping / payment / no-pay) -->
      <div class="checkout-notice checkout-notice--warning" style="margin-top:var(--space-6);">
        <span class="material-symbols-outlined checkout-notice__icon">campaign</span>
        <div class="checkout-notice__body">
          <div class="checkout-notice__title">Please Note:</div>
          <p>We are delivering goods PAN India by following options :</p>
          <p class="checkout-notice__methods" style="color:#1a56db;">ROAD TRANSPORT / BUS CARGO / RAIL CARGO / AIR COURIER / PORTER IN DELHI NCR</p>
          <p>You may mention any of them as per your choice.</p>
          <p style="margin-top:var(--space-3);"><strong>SHIPPING IS NOT FREE.</strong> Please continue with your order by mentioning your preferred shipping choice, we will get back to you soon to give you the exact amount for shipping according to your location and shipping choice.</p>
          <p class="checkout-notice__highlight">Cash on Delivery (COD) is not available on this order.</p>
        </div>
      </div>
      <div class="checkout-notice checkout-notice--info" style="margin-top:var(--space-4);">
        <span class="material-symbols-outlined checkout-notice__icon">payments</span>
        <div class="checkout-notice__body">
          <div class="checkout-notice__title">Payment Options:</div>
          <p>You can use any following payment option to make advance or full payment for this order:</p>
          <p class="checkout-notice__methods">Debit Card / Credit Card / Online Bank Transfer / NEFT / RTGS / IMPS / Cheque</p>
          <p class="checkout-notice__highlight">Please Note : Your order will not be shipped until we receive your payment.</p>
        </div>
      </div>
      <div class="checkout-notice checkout-notice--important" style="margin-top:var(--space-4); margin-bottom:var(--space-6);">
        <span class="material-symbols-outlined checkout-notice__icon">block</span>
        <div class="checkout-notice__body">
          <div class="checkout-notice__title">No need to make payment at this step !</div>
          <p>No payment will be collected at checkout. Placing this order does not require any payment for now.</p>
          <p>Our team will contact you shortly with the final total estimate (including packing &amp; shipping) and payment instructions.</p>
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
    const newTotal = newSub + newGst;

    document.getElementById('checkout-subtotal').textContent = formatPrice(newSub);
    const gstEl = document.getElementById('checkout-gst');
    if (gstEl) gstEl.textContent = formatPrice(newGst);
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
    container.innerHTML = uploadedLogos.map((logo, i) => {
      const isImg = logo.dataUrl && String(logo.dataUrl).startsWith('data:image/');
      const preview = isImg
        ? `<img src="${logo.dataUrl}" alt="${logo.name}">`
        : `<span class="material-symbols-outlined" style="font-size:28px;color:var(--color-primary);">description</span>`;
      return `
      <div class="checkout-logo-thumb" data-index="${i}">
        ${preview}
        <button type="button" class="checkout-logo-remove" data-index="${i}" title="Remove">
          <span class="material-symbols-outlined" style="font-size:14px;">close</span>
        </button>
        <span class="checkout-logo-filename">${logo.name}</span>
      </div>`;
    }).join('');
    container.querySelectorAll('.checkout-logo-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedLogos.splice(parseInt(btn.dataset.index), 1);
        renderLogoPreviews();
      });
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // H2.5 fix: max 10 MB per file, 20 MB total — prevents tab crash on
  // 500MB uploads and the resulting 20MB JSONB row from choking Supabase.
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  async function handleLogoFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const existingSize = uploadedLogos.reduce((s, l) => s + (l.dataUrl?.length || 0), 0);
    let runningSize = existingSize;
    for (const f of list) {
      if (f.size > MAX_FILE_BYTES) {
        alert(`"${f.name}" is larger than 10 MB. Please compress and try again.`);
        continue;
      }
      if (runningSize + f.size > MAX_TOTAL_BYTES) {
        alert(`Total upload size limit (20 MB) reached. Skipped "${f.name}".`);
        continue;
      }
      runningSize += f.size;
      if (f.type.startsWith('image/')) {
        const dataUrl = await convertToJpg(f);
        if (dataUrl) {
          uploadedLogos.push({ name: f.name.replace(/\.[^.]+$/, '') + '.jpg', dataUrl });
          showToast('File added');
        } else {
          alert(`Failed to process "${f.name}". File may be corrupt or unsupported.`);
        }
      } else if (
        f.type === 'application/pdf' ||
        f.type.startsWith('text/') ||
        f.type === 'application/msword' ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        /\.(pdf|txt|doc|docx)$/i.test(f.name)
      ) {
        const dataUrl = await readFileAsDataURL(f);
        if (dataUrl) {
          uploadedLogos.push({ name: f.name, dataUrl });
          showToast('File added');
        }
      } else {
        alert(`"${f.name}" — unsupported file type.`);
      }
    }
    renderLogoPreviews();
    persistLogos();
  }

  // M1 fix: persist uploaded logos in sessionStorage so a refresh or
  // accidental F5 doesn't wipe 5 minutes of work.
  const LOGO_STORAGE_KEY = '__nyd_checkout_logos';
  function persistLogos() {
    try { sessionStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(uploadedLogos)); } catch { /* quota */ }
  }
  function restoreLogos() {
    // Only restore when module list is empty — re-renders must not double-append
    if (uploadedLogos.length) return false;
    try {
      const raw = sessionStorage.getItem(LOGO_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) {
          uploadedLogos = arr.slice();
          return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  }
  const restored = restoreLogos();

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

  // Render any previously uploaded logos (when step 1 is re-rendered, or
  // when logos were persisted from a previous session/page load).
  renderLogoPreviews();
  if (restored && uploadedLogos.length) {
    showToast(`Restored ${uploadedLogos.length} previously uploaded file(s)`);
  }

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
        customisation: '',
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

  // Step 2 → Step 1: edit (all fields already in sessionStorage)
  document.getElementById('btn-edit-info')?.addEventListener('click', () => {
    setCheckoutStep('shipping');
    renderCheckoutPage();
    window.scrollTo(0, 0);
  });

  // Place Order (step 2) — uses data saved on Save and Proceed
  document.getElementById('btn-place-order')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-place-order');
    const data = getCheckoutData();

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

    // Email/preview line items use client display prices; DB totals come from
    // place_order RPC (server-side product prices — H2.3).
    const displayItems = cartItems.map(item => {
      const rawImg = item.product.image || item.product.images?.[0] || null;
      return {
        product_id: item.product.id,
        product_name: item.product.title || item.product.name,
        product_image: rawImg || null,
        product_sku: item.product.sku || '',
        material: item.product.material || null,
        size: item.product.size || null,
        quantity: item.qty,
        unit_price: Number(item.product.price),
        line_total: Number((item.product.price * item.qty).toFixed(2)),
      };
    });

    if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }
    showToast('Processing your order…', 'success');

    // H2.1: single atomic RPC (order + items). H2.3: server recomputes prices.
    // Fallback: dual insert if RPC not deployed yet.
    let orderNumber = null;
    let orderId = null;
    let serverSubtotal = Number(subtotal.toFixed(2));
    let serverGst = Number((subtotal * gstRate).toFixed(2));
    let serverShipping = Number(shipping.toFixed(2));
    let serverTotal = Number((subtotal + subtotal * gstRate + (shipping > 0 ? shipping : 0)).toFixed(2));

    // M3 mitigation: store only file names + sizes in DB (not multi-MB base64).
    // Full binaries still go out on the order email attachments.
    const logoPayload = uploadedLogos.length
      ? uploadedLogos.map(l => ({
          name: l.name,
          size: l.dataUrl?.length || 0,
          type: (l.dataUrl || '').startsWith('data:') ? String(l.dataUrl).slice(5, String(l.dataUrl).indexOf(';')) : null,
        }))
      : [];

    const rpcItems = cartItems.map(item => ({
      product_id: String(item.product.id),
      quantity: Number(item.qty) || 1,
    }));

    let placed = false;
    const { data: rpcData, error: rpcErr } = await supabase.rpc('place_order', {
      p_first_name: data.firstName,
      p_last_name: data.lastName,
      p_email: data.email,
      p_phone: data.phone,
      p_address_line_1: data.address,
      p_city: data.city,
      p_state: data.state,
      p_postcode: data.pin,
      p_items: rpcItems,
      p_company: data.company || null,
      p_gst: data.gst || null,
      p_address_line_2: null,
      p_country: 'India',
      p_special_instructions: null,
      p_customisation: data.customisation || null,
      p_additional_info: data.additionalInfo || null,
      p_logo_images: logoPayload,
      p_payment_method: paymentMethod,
      p_privacy_agreed: true,
    });

    if (!rpcErr && rpcData?.ok) {
      placed = true;
      orderNumber = rpcData.order_number;
      orderId = rpcData.order_id;
      serverSubtotal = Number(rpcData.subtotal);
      serverGst = Number(rpcData.gst_amount);
      serverShipping = Number(rpcData.shipping);
      serverTotal = Number(rpcData.total);
    } else {
      const rpcMsg = rpcErr?.message || rpcData?.message || '';
      if (/MOQ|out of stock|not found or inactive|quantity/i.test(rpcMsg)) {
        showToast(rpcMsg, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
        return;
      }
      console.warn('[checkout] place_order RPC unavailable, using fallback insert', rpcErr);

      const _now = new Date();
      const _datePart = `${_now.getFullYear()}${String(_now.getMonth() + 1).padStart(2, '0')}${String(_now.getDate()).padStart(2, '0')}`;
      // 4-digit numeric suffix to match the family's preferred order-number
      // format (NYD-YYYYMMDD-1006 style). 10,000 values per day is enough
      // for current volume; the DB has a UNIQUE constraint that catches
      // any rare collision and surfaces a retry-able error to the user.
      const _rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      orderNumber = `NYD-${_datePart}-${_rand}`;
      serverSubtotal = Number(subtotal.toFixed(2));
      serverGst = Number((subtotal * gstRate).toFixed(2));
      serverShipping = Number(shipping.toFixed(2));
      serverTotal = Number((serverSubtotal + serverGst + (serverShipping > 0 ? serverShipping : 0)).toFixed(2));

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
        logo_images: logoPayload,
        payment_method: paymentMethod,
        privacy_agreed: true,
        subtotal: serverSubtotal,
        gst_amount: serverGst,
        shipping: serverShipping,
        total: serverTotal,
        status: 'pending',
      };

      let orderRow = null;
      let orderErr = null;
      const res = await supabase.from('orders').insert(insertPayload).select().single();
      orderRow = res.data;
      orderErr = res.error;

      if (orderErr && (orderErr.code === 'PGRST204' || orderErr.code === '42703' || orderErr.message?.includes('column'))) {
        const serializedInstructions = [
          data.customisation ? `[Customisation Requirements]\n${data.customisation}` : null,
          data.additionalInfo ? `[Additional Info]\n${data.additionalInfo}` : null,
          uploadedLogos.length ? `[Uploaded Logos]\n${uploadedLogos.map(l => l.name).join(', ')}` : null,
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
          subtotal: serverSubtotal,
          gst_amount: serverGst,
          shipping: serverShipping,
          total: serverTotal,
          status: 'pending',
        };
        const fallbackRes = await supabase.from('orders').insert(fallbackPayload).select().single();
        orderRow = fallbackRes.data;
        orderErr = fallbackRes.error;
      }

      if (orderErr || !orderRow) {
        console.error('Order insert failed:', orderErr || rpcErr);
        showToast(rpcErr?.message || orderErr?.message || 'Could not place order. Please try again.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
        return;
      }

      orderId = orderRow.id;
      const { error: itemsErr } = await supabase.from('order_items').insert(
        displayItems.map(({ product_sku, product_image, product_id, ...it }) => ({
          ...it,
          product_id: product_id != null ? String(product_id) : null,
          order_id: orderRow.id,
          product_image: product_image && !String(product_image).startsWith('data:')
            ? product_image
            : null,
        }))
      );
      if (itemsErr) {
        // H2.1 partial: order without items — surface error, keep order for support
        console.error('Order items insert failed:', itemsErr);
        showToast('Order saved but items failed to save. Contact support with your order number.', 'error');
      }
      placed = true;
    }

    if (!placed || !orderNumber) {
      showToast(rpcErr?.message || 'Could not place order. Please try again.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
      return;
    }

    const emailPayload = {
      orderNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      gst: data.gst,
      addressLine1: data.address,
      city: data.city,
      state: data.state,
      postcode: data.pin,
      phone: data.phone,
      email: data.email,
      items: displayItems.map(it => ({
        name: it.product_name,
        sku: it.product_sku,
        qty: it.quantity,
        unitPrice: it.unit_price,
        image: it.product_image,
        lineTotal: it.line_total,
      })),
      subtotal: serverSubtotal,
      gstAmount: serverGst,
      shipping: serverShipping,
      total: serverTotal,
      specialInstructions: data.additionalInfo || data.customisation || '',
      customisation: data.customisation || '',
      additionalInfo: data.additionalInfo || '',
      logos: uploadedLogos.map(l => ({ name: l.name, dataUrl: l.dataUrl })),
      paymentMethod,
      tAndCAgreed: true,
    };

    // H2.2: wait for email before navigating (with soft timeout so user isn't stuck)
    if (btn) btn.textContent = 'Sending confirmation…';
    let emailOk = false;
    let emailWarn = '';
    try {
      const emailResult = await Promise.race([
        sendOrderEmail(emailPayload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('email-timeout')), 20000)),
      ]);
      emailOk = !!(emailResult && emailResult.ok !== false);
      if (emailResult?.sent?.droppedOversized?.length) {
        emailWarn = ` Some files were too large for email (${emailResult.sent.droppedOversized.join(', ')}).`;
      }
    } catch (e) {
      console.error('Order email failed:', e);
      emailOk = false;
    }

    // H2.4: success page uses session snapshot only — no anon order SELECT by number
    const orderSnapshot = {
      ...emailPayload,
      orderId,
      logos: uploadedLogos.map(l => ({ name: l.name, dataUrl: null })),
    };
    sessionStorage.setItem('lastOrderNumber', orderNumber);
    try {
      sessionStorage.setItem('lastOrderSnapshot', JSON.stringify(orderSnapshot));
    } catch (_) {
      try {
        orderSnapshot.items = orderSnapshot.items.map(it => ({ ...it, image: null }));
        sessionStorage.setItem('lastOrderSnapshot', JSON.stringify(orderSnapshot));
      } catch (e2) {
        console.error('Could not save order snapshot', e2);
      }
    }

    clearCart();
    cachedCartItems = null;
    lastCartJson = '';
    sessionStorage.removeItem('checkoutStep');
    sessionStorage.removeItem('checkoutData');
    try { sessionStorage.removeItem('__nyd_checkout_logos'); } catch { /* ignore */ }
    uploadedLogos = [];

    if (!emailOk) {
      showToast('Order placed — confirmation email may be delayed. We have your order.' + emailWarn, 'error');
    } else if (emailWarn) {
      showToast('Order placed!' + emailWarn, 'success');
    }

    navigateTo('/order-success');
  });
}
