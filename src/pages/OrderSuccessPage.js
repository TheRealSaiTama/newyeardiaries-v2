import { supabase } from '../lib/supabase.js';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const CARE_PHONE = '+91 9311135190';
const CARE_TEL = '+919311135190';

function itemsRows(items) {
  return (items || []).map(it => `
    <div class="order-overview-item">
      <div class="order-overview-item__img">
        ${it.image || it.product_image
          ? `<img src="${it.image || it.product_image}" alt="${it.name || it.product_name || ''}">`
          : '<span class="material-symbols-outlined" style="color:var(--color-text-tertiary);opacity:.4">menu_book</span>'}
      </div>
      <div class="order-overview-item__main">
        <div class="order-overview-item__name">${it.name || it.product_name || 'Item'}</div>
        <div class="order-overview-item__meta">${it.qty || it.quantity || 1} × ${fmt(it.unitPrice ?? it.unit_price)}</div>
      </div>
      <div class="order-overview-item__total">${fmt(it.lineTotal ?? it.line_total)}</div>
    </div>`).join('');
}

function overviewCard({ orderNumber, items, subtotal, gstAmount, shipping, total, shipHtml }) {
  const rows = itemsRows(items);
  return `
    <div class="order-overview__card">
      <div class="order-overview__head">
        <h2>Order Overview</h2>
        <span class="order-overview__num">#${orderNumber || ''}</span>
      </div>
      <div class="order-overview__items">${rows || '<p style="color:var(--color-text-tertiary)">No items recorded.</p>'}</div>
      <div class="order-overview__totals">
        <div class="order-overview__row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${Number(gstAmount) ? `<div class="order-overview__row"><span>GST (18%)</span><span>${fmt(gstAmount)}</span></div>` : ''}
        <div class="order-overview__row"><span>Shipping</span><span>${Number(shipping) ? fmt(shipping) : 'Calculated later'}</span></div>
        <div class="order-overview__row order-overview__row--total"><span>Total</span><span>${fmt(total)}</span></div>
      </div>
      ${shipHtml || ''}
    </div>`;
}

export async function renderOrderSuccessPage() {
  const app = document.getElementById('app');
  const orderNumber = sessionStorage.getItem('lastOrderNumber') || '';

  let snap = null;
  try { snap = JSON.parse(sessionStorage.getItem('lastOrderSnapshot') || 'null'); } catch (_) {}

  // Prefer snapshot; if missing/empty items, re-fetch from DB
  let items = snap?.items || [];
  let subtotal = snap?.subtotal;
  let gstAmount = snap?.gstAmount;
  let shipping = snap?.shipping;
  let total = snap?.total;
  let shipHtml = '';

  if (snap) {
    shipHtml = `
      <div class="order-overview__ship">
        <strong>Shipping to:</strong>
        ${snap.firstName || ''} ${snap.lastName || ''},
        ${snap.addressLine1 || ''}${snap.city ? ', ' + snap.city : ''}${snap.state ? ', ' + snap.state : ''} ${snap.postcode || ''}
        ${snap.phone ? ` &middot; ${snap.phone}` : ''}
      </div>`;
  }

  if ((!items.length || !snap) && orderNumber) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('id, first_name, last_name, phone, address_line_1, city, state, postcode, subtotal, gst_amount, shipping, total')
        .eq('order_number', orderNumber)
        .maybeSingle();
      if (order) {
        const { data: dbItems } = await supabase
          .from('order_items')
          .select('product_name, product_image, quantity, unit_price, line_total')
          .eq('order_id', order.id);
        if (dbItems?.length) {
          items = dbItems.map(it => ({
            name: it.product_name,
            image: it.product_image,
            qty: it.quantity,
            unitPrice: it.unit_price,
            lineTotal: it.line_total,
          }));
        }
        subtotal = order.subtotal;
        gstAmount = order.gst_amount;
        shipping = order.shipping;
        total = order.total;
        shipHtml = `
          <div class="order-overview__ship">
            <strong>Shipping to:</strong>
            ${order.first_name || ''} ${order.last_name || ''},
            ${order.address_line_1 || ''}${order.city ? ', ' + order.city : ''}${order.state ? ', ' + order.state : ''} ${order.postcode || ''}
            ${order.phone ? ` &middot; ${order.phone}` : ''}
          </div>`;
      }
    } catch (e) {
      console.warn('[order-success] DB fallback failed', e);
    }
  }

  const hasOverview = orderNumber && (items.length || subtotal != null || snap);
  const overviewHtml = hasOverview
    ? overviewCard({
        orderNumber: orderNumber || snap?.orderNumber,
        items,
        subtotal: subtotal ?? snap?.subtotal,
        gstAmount: gstAmount ?? snap?.gstAmount,
        shipping: shipping ?? snap?.shipping,
        total: total ?? snap?.total,
        shipHtml,
      })
    : '';

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
          background: #FDF9F3;
          border: 1px solid #E5D5C0;
          border-left: 4px solid #C4956A;
          border-radius: var(--radius-md);
          padding: var(--space-6);
          margin: 0 auto var(--space-8);
          max-width: 560px;
          text-align: left;
          color: var(--color-text-primary);
        ">
          <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);color:#A0522D;">
            <span class="material-symbols-outlined" style="font-size:22px;">info</span>
            <strong style="font-size:var(--fs-base);letter-spacing:0.02em;">Please note</strong>
          </div>
          <p style="font-size:var(--fs-base);line-height:var(--lh-normal);margin-bottom:var(--space-4);color:var(--color-text-primary);">
            Amount below is the basic cost of your items. <strong>Shipping or customisation charges</strong> (if any) will be added later.
          </p>
          <div style="
            background: #fff;
            padding: var(--space-3) var(--space-4);
            border-radius: var(--radius-sm);
            margin-bottom: var(--space-4);
            border: 1px solid #E5D5C0;
          ">
            <span style="color:#A0522D;font-weight:var(--fw-semibold);font-size:var(--fs-sm);display:block;margin-bottom:var(--space-1);">Next step</span>
            <span style="font-size:var(--fs-sm);color:var(--color-text-primary);line-height:var(--lh-normal);">Please do not make any payment yet.</span>
          </div>
          <p style="font-size:var(--fs-sm);color:var(--color-text-secondary);line-height:var(--lh-normal);margin-bottom:0;">
            Our sales executive will call you shortly with a detailed proforma invoice for payment.<br><br>
            Questions? Call customer care at <a href="tel:${CARE_TEL}" style="color:var(--color-primary);font-weight:var(--fw-semibold);text-decoration:none;">${CARE_PHONE}</a>.<br><br>
            <strong style="color:var(--color-text-primary);">Thanks…!!<br>New Year Diaries</strong>
          </p>
        </div>

        <div id="order-overview" class="order-overview">${overviewHtml}</div>
        <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
          <a href="/shop" class="btn btn--accent btn--lg">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;
}
