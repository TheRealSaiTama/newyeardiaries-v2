import { supabase } from '../lib/supabase.js';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export async function renderOrderSuccessPage() {
  const app = document.getElementById('app');
  const orderNumber = sessionStorage.getItem('lastOrderNumber') || '';

  // Render the header/chrome immediately so the page isn't blank during fetch.
  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        <div class="checkout-stepper">
          <div class="step completed"><span class="step-indicator"><span class="material-symbols-outlined" style="font-size:16px;">check</span></span><span class="step-label">Contact Info</span></div>
          <div class="step-connector completed"></div>
          <div class="step completed"><span class="step-indicator"><span class="material-symbols-outlined" style="font-size:16px;">check</span></span><span class="step-label">Review</span></div>
          <div class="step-connector completed"></div>
          <div class="step active"><span class="step-indicator">3</span><span class="step-label">Order Confirmation</span></div>
        </div>
      </div>
      <div class="success-page">
        <div class="success-icon"><span class="material-symbols-outlined">check_circle</span></div>
        <h1>Congratulations!</h1>
        <p class="success-lede">Thanks for your order.</p>
        <p class="success-received">We have successfully received your order${orderNumber ? ` <strong>#${orderNumber}</strong>` : ''}.</p>
        <p class="success-status" style="margin-bottom: var(--space-6);">Order Confirmed.</p>
        
        <div class="order-payment-notice" style="
          background: var(--color-error-bg);
          border: 1px solid var(--color-border);
          border-left: 4px solid var(--color-error);
          border-radius: var(--radius-md);
          padding: var(--space-6);
          margin: 0 auto var(--space-8);
          max-width: 560px;
          text-align: left;
          color: var(--color-text-primary);
          box-shadow: var(--shadow-sm);
        ">
          <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);color:var(--color-error);">
            <span class="material-symbols-outlined" style="font-size:24px;">warning</span>
            <strong style="font-size:var(--fs-lg);text-transform:uppercase;letter-spacing:var(--ls-wide);">PLEASE NOTE</strong>
          </div>
          <p style="font-size:var(--fs-base);line-height:var(--lh-normal);margin-bottom:var(--space-4);color:var(--color-text-primary); max-width: 100%; text-align: left;">
            Amount showing below is the basic cost of your purchased items, there will be <strong>SHIPPING OR CUSTOMIZATION CHARGES</strong> to be included in this amount.
          </p>
          <div style="
            background: var(--color-surface);
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-sm);
            margin-bottom: var(--space-4);
            border: 1px solid var(--color-border);
          ">
            <span style="color:var(--color-error);font-weight:var(--fw-bold);font-size:var(--fs-sm);display:block;margin-bottom:var(--space-1);text-transform:uppercase;">⚠️ Critical Instructions</span>
            <span style="font-size:var(--fs-sm);font-weight:var(--fw-semibold);color:var(--color-text-primary);line-height:var(--lh-normal);">PLEASE DO NOT PROCEED WITH PAYMENT AT THIS STAGE,</span>
          </div>
          <p style="font-size:var(--fs-sm);color:var(--color-text-secondary);line-height:var(--lh-normal);margin-bottom:0; max-width: 100%; text-align: left;">
            Our sales executive will call you shortly to discuss and give detailed proforma invoice for your order and payment.<br><br>
            If you have any query, you can contact to our customer care at <a href="tel:+919899223130" style="color:var(--color-primary);font-weight:var(--fw-semibold);text-decoration:none;">+91 98992 23130</a>.<br><br>
            <strong>Thanks...!!<br>New Year Diaries</strong>
          </p>
        </div>

        <div id="order-overview" class="order-overview"><span class="material-symbols-outlined spin" style="font-size:22px;color:var(--color-text-tertiary)">progress_activity</span></div>
        <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
          <a href="/shop" class="btn btn--accent btn--lg">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;

  // ponytail: was just a static "Order Confirmed" message. Fetch the order +
  // its items by the saved order number and render a real overview so the user
  // sees exactly what they ordered (items, qty, totals) instead of boilerplate.
  const overviewEl = document.getElementById('order-overview');
  if (!orderNumber || !overviewEl) return;

  try {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, first_name, last_name, email, phone, address_line_1, city, state, postcode, subtotal, gst_amount, shipping, total')
      .eq('order_number', orderNumber)
      .maybeSingle();
    if (orderErr || !order) { overviewEl.innerHTML = ''; return; }

    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, product_image, quantity, unit_price, line_total')
      .eq('order_id', order.id);

    const rows = (items || []).map(it => `
      <div class="order-overview-item">
        <div class="order-overview-item__img">
          ${it.product_image
            ? `<img src="${it.product_image}" alt="${it.product_name}">`
            : '<span class="material-symbols-outlined" style="color:var(--color-text-tertiary);opacity:.4">menu_book</span>'}
        </div>
        <div class="order-overview-item__main">
          <div class="order-overview-item__name">${it.product_name}</div>
          <div class="order-overview-item__meta">${it.quantity} × ${fmt(it.unit_price)}</div>
        </div>
        <div class="order-overview-item__total">${fmt(it.line_total)}</div>
      </div>`).join('');

    overviewEl.innerHTML = `
      <div class="order-overview__card">
        <div class="order-overview__head">
          <h2>Order Overview</h2>
          <span class="order-overview__num">#${orderNumber}</span>
        </div>
        <div class="order-overview__items">${rows || '<p style="color:var(--color-text-tertiary)">Item details unavailable.</p>'}</div>
        <div class="order-overview__totals">
          <div class="order-overview__row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
          ${Number(order.gst_amount) ? `<div class="order-overview__row"><span>GST</span><span>${fmt(order.gst_amount)}</span></div>` : ''}
          <div class="order-overview__row"><span>Shipping</span><span>${Number(order.shipping) ? fmt(order.shipping) : 'Calculated later'}</span></div>
          <div class="order-overview__row order-overview__row--total"><span>Total</span><span>${fmt(order.total)}</span></div>
        </div>
        <div class="order-overview__ship">
          <strong>Shipping to:</strong>
          ${order.first_name || ''} ${order.last_name || ''},
          ${order.address_line_1 || ''}${order.city ? ', ' + order.city : ''}${order.state ? ', ' + order.state : ''} ${order.postcode || ''}
          ${order.phone ? ` &middot; ${order.phone}` : ''}
        </div>
      </div>`;
  } catch {
    overviewEl.innerHTML = '';
  }
}
