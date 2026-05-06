import { formatPrice, getProductById } from '../data/products.js';
import { addToQuoteList, addToCart } from '../data/store.js';

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

  const content = document.getElementById('quick-view-content');
  const modal = document.getElementById('quick-view-modal');
  const overlay = document.getElementById('quick-view-overlay');

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
        <p class="text-body">${product.description}</p>
        <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);">
          ${[product.material, product.size, product.pages ? product.pages + ' pages' : null].filter(Boolean).join(' • ')}
        </div>
        <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:auto;">
          <button class="btn btn--accent btn--lg" style="flex:1;" id="qv-add-quote">Add to Quote</button>
          <button class="btn btn--secondary btn--lg" style="flex:1;" id="qv-add-cart">Add to Cart</button>
        </div>
        <a href="/product/${product.slug}" class="btn btn--ghost" style="text-align:center;" id="qv-view-details">View Full Details →</a>
      </div>
    `;
  }

  modal?.classList.add('active');
  overlay?.classList.add('active');

  document.getElementById('qv-add-quote')?.addEventListener('click', () => addToQuoteList(product.id));
  document.getElementById('qv-add-cart')?.addEventListener('click', () => addToCart(product.id));
}
