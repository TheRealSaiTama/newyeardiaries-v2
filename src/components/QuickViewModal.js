import { formatPrice, getProductById } from '../data/products.js';
import { addToCart, getCart } from '../data/store.js';

export function renderQuickViewModal() {
  return `
    <div class="overlay" id="quick-view-overlay"></div>
    <div class="quick-view-modal" id="quick-view-modal" role="dialog" aria-modal="true" aria-label="Product Quick View">
      <button class="quick-view-close" id="quick-view-close" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="quick-view-content" id="quick-view-content"></div>
    </div>
  `;
}

export async function openQuickView(productId) {
  const product = await getProductById(productId);
  if (!product) return;

  const cart = getCart();
  const isInCart = cart.some(item => String(item.productId) === String(product.id));

  const content = document.getElementById('quick-view-content');
  const modal = document.getElementById('quick-view-modal');
  const overlay = document.getElementById('quick-view-overlay');
  const moq = product.minBulkOrder || 1;

  if (content) {
    content.innerHTML = `
      <div class="quick-view-image">
        ${product.image
          ? `<img src="${product.image}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;">`
          : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,var(--color-surface-alt),var(--color-border-light));"><span class="material-symbols-outlined" style="font-size:64px;color:var(--color-accent);opacity:0.3;">menu_book</span></div>`}
      </div>
      <div class="quick-view-details">
        <div class="label">${product.category}</div>
        <h2 class="heading-3">${product.title}</h2>
        <div class="pdp-price">${formatPrice(product.price)}</div>
        <div class="text-body">${product.description}</div>
        <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);">
          ${[product.material, product.size, product.pages ? product.pages + ' pages' : null].filter(Boolean).join(' • ')}
        </div>
        <div style="margin-top:var(--space-2);">
          <label style="font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--color-text-secondary);display:block;margin-bottom:var(--space-1);">Quantity</label>
          <div class="qty-stepper">
            <button class="qty-step-btn" id="qv-qty-minus" aria-label="Decrease">−</button>
            <input type="number" class="qty-step-input" id="qv-qty" value="${moq}" min="${moq}" step="1">
            <button class="qty-step-btn" id="qv-qty-plus" aria-label="Increase">+</button>
          </div>
          <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);">Min. order: ${moq} units</div>
        </div>
        <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:auto;width:100%;">
          <button class="btn btn--accent btn--lg${isInCart ? ' btn--added' : ''}" style="width:100%;" id="qv-add-cart"${isInCart ? ' disabled' : ''}>
            ${isInCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
        </div>
        <a href="/product/${product.slug}" class="btn btn--ghost" style="text-align:center;" id="qv-view-details">View Full Details →</a>
      </div>
    `;
  }

  modal?.classList.add('active');
  overlay?.classList.add('active');

  const qvQty = document.getElementById('qv-qty');
  const qvMinus = document.getElementById('qv-qty-minus');
  const qvPlus = document.getElementById('qv-qty-plus');

  function clampQv(val) { return Math.max(moq, val); }
  qvMinus?.addEventListener('click', () => { if (qvQty) qvQty.value = clampQv((parseInt(qvQty.value) || moq) - 1); });
  qvPlus?.addEventListener('click', () => { if (qvQty) qvQty.value = (parseInt(qvQty.value) || moq) + 1; });
  qvQty?.addEventListener('change', () => { qvQty.value = clampQv(parseInt(qvQty.value) || moq); });

  document.getElementById('qv-add-cart')?.addEventListener('click', () => {
    try {
      const qty = parseInt(qvQty?.value) || moq;
      addToCart(product.id, qty);

      const btn = document.getElementById('qv-add-cart');
      if (btn) {
        btn.classList.add('btn--added');
        btn.disabled = true;
        btn.innerHTML = 'Added to Cart';
      }
    } catch (err) {
      console.error('Quick view add to cart failed:', err);
    }
  });
}
