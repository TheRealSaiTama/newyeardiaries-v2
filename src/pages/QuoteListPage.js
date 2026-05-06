import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { getQuoteList, removeFromQuoteList, updateQuoteQty } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';

export async function renderQuoteListPage() {
  const app = document.getElementById('app');
  const quoteList = getQuoteList();

  const quoteItems = (await Promise.all(
    quoteList.map(async item => {
      const product = await getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
  )).filter(Boolean);

  const totalUnits = quoteItems.reduce((sum, item) => sum + item.qty, 0);

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Quote List' }])}
        <h1 class="heading-2" style="margin-bottom:var(--space-2);">Quote Request</h1>
        <p class="text-body" style="margin-bottom:var(--space-8);">Review your selected items for a corporate bulk enquiry. Current total: <strong>${totalUnits} units</strong></p>

        ${quoteItems.length === 0 ? `
          <div class="cart-empty">
            <span class="material-symbols-outlined">request_quote</span>
            <h2 class="heading-3" style="margin-bottom:var(--space-3);">Your quote list is empty</h2>
            <p class="text-body" style="margin-bottom:var(--space-6);">Add products to your quote list to request bulk pricing.</p>
            <a href="/shop" class="btn btn--accent">Browse Collection</a>
          </div>
        ` : `
          <div class="quote-list-layout">
            <div>
              ${quoteItems.map(item => `
                <div class="quote-item">
                  <div class="quote-item-image">
                    ${item.product.image
                      ? `<img src="${item.product.image}" alt="${item.product.title}">`
                      : `<span class="material-symbols-outlined" style="color:var(--color-accent);opacity:0.3;font-size:24px;">menu_book</span>`}
                  </div>
                  <div>
                    <div style="font-weight:var(--fw-semibold);margin-bottom:var(--space-1);">${item.product.title}</div>
                    <div class="quote-item-sku">${item.product.sku}</div>
                    <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);margin-top:var(--space-1);">${item.product.material} ${item.product.size ? '• ' + item.product.size : ''}</div>
                  </div>
                  <div style="text-align:right;">
                    <div class="qty-selector" style="margin-bottom:var(--space-2);">
                      <button class="quote-qty-minus" data-id="${item.product.id}">−</button>
                      <span class="qty-value">${item.qty}</span>
                      <button class="quote-qty-plus" data-id="${item.product.id}">+</button>
                    </div>
                    <button class="btn btn--ghost btn--sm remove-quote-item" data-id="${item.product.id}" style="color:var(--color-error);font-size:var(--fs-xs);">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="order-summary">
              <h3>Enquiry Summary</h3>
              <div class="order-summary-row"><span>Total Items</span><span>${quoteItems.length}</span></div>
              <div class="order-summary-row"><span>Total Units</span><span>${totalUnits}</span></div>
              <div class="divider"></div>
              <a href="/bulk-quote" class="btn btn--accent btn--lg btn--full">Proceed to Enquiry</a>
              <a href="/shop" class="btn btn--secondary btn--full" style="margin-top:var(--space-3);">Add More Products</a>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  document.querySelectorAll('.quote-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = quoteList.find(i => i.productId === id);
      if (item && item.qty > 10) { updateQuoteQty(id, item.qty - 10); renderQuoteListPage(); }
    });
  });
  document.querySelectorAll('.quote-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const item = quoteList.find(i => i.productId === id);
      if (item) { updateQuoteQty(id, item.qty + 10); renderQuoteListPage(); }
    });
  });
  document.querySelectorAll('.remove-quote-item').forEach(btn => {
    btn.addEventListener('click', () => { removeFromQuoteList(parseInt(btn.dataset.id)); renderQuoteListPage(); });
  });
}
