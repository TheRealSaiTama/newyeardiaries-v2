const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function sendEmail(templateParams) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return Promise.resolve();
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: 'iamravi11@gmail.com',
        ...templateParams,
      },
    }),
  });
}

export function sendQuoteEmail(data) {
  return sendEmail({
    title: `[${data.enquiry_code || 'BQ'}] Bulk Quote - ${data.company}`,
    name: data.name,
    email: data.email,
    message: [
      `Enquiry Code: ${data.enquiry_code || 'N/A'}`,
      ``,
      `--- CONTACT ---`,
      `Name: ${data.name}`,
      `Company: ${data.company}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      ``,
      `--- ORDER DETAILS ---`,
      `Product Interest: ${data.product_type || 'Not specified'}`,
      `Quantity: ${data.quantity || 'Not specified'}`,
      `${data.product_names ? `Products from Quote List:\n${data.product_names}` : ''}`,
      ``,
      `--- REQUIREMENTS ---`,
      `Requirements: ${data.custom_requirements || 'None'}`,
    ].join('\n'),
  });
}

export function sendContactEmail(data) {
  return sendEmail({
    title: `[${data.enquiry_code || 'CT'}] Contact: ${data.subject}`,
    name: data.name,
    email: data.email,
    message: [
      `Enquiry Code: ${data.enquiry_code || 'N/A'}`,
      ``,
      `--- CONTACT ---`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      ``,
      `--- MESSAGE ---`,
      `Subject: ${data.subject}`,
      `Message: ${data.message || 'No message'}`,
    ].join('\n'),
  });
}

function fmtINR(n) {
  const num = Number(n || 0);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const PAYMENT_LABELS = {
  cod: 'Cash on Delivery (COD)',
  upi: 'UPI / QR Code',
  bank: 'NEFT / RTGS / Bank Transfer',
  card: 'Credit / Debit Card',
};

export function sendOrderEmail(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
  const orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Subject + title line exactly per the order-page format
  const subject = `[Order # ${orderNo}] FROM (${orderDate}) ${buyerName}`;
  const titleLine = `New Order # ${orderNo} (${buyerName})`;

  const rowsHtml = data.items.map(item => {
    const imgCell = item.image
      ? `<img src="${esc(item.image)}" alt="" width="60" height="60" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #eee;">`
      : `<div style="width:60px;height:60px;background:#f5f0e8;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#A0522D;font-size:11px;">No img</div>`;
    const skuLine = item.sku ? `<div style="font-size:11px;color:#888;font-weight:normal;">SKU: ${esc(item.sku)}</div>` : '';
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;vertical-align:middle;">${imgCell}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:600;color:#3a2a1a;vertical-align:middle;">
          ${esc(item.name)}${skuLine}
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;vertical-align:middle;">${esc(item.qty)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;vertical-align:middle;">${fmtINR(item.unitPrice ?? item.price)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:600;vertical-align:middle;">${fmtINR(item.lineTotal)}</td>
      </tr>`;
  }).join('');

  const paymentLabel = PAYMENT_LABELS[data.paymentMethod] || esc(data.paymentMethod || 'Not specified');

  const htmlMessage = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#3a2a1a;font-size:14px;line-height:1.5;border:1px solid #e5e0d6;border-radius:8px;overflow:hidden;">

  <!-- Header bar -->
  <div style="background:#003366;color:#ffffff;padding:16px 24px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:0.5px;">
    New Order: #${esc(orderNo)}
  </div>

  <!-- Title line -->
  <div style="padding:14px 24px;background:#f5f7fb;border-bottom:1px solid #e5e0d6;font-size:15px;font-weight:bold;color:#1a2744;">
    ${esc(titleLine)}
  </div>

  <div style="padding:24px;">

    <!-- Billing Address -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:16px;">
          <div style="font-size:13px;font-weight:bold;color:#003366;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Billing Address</div>
          <div style="font-weight:bold;">${esc(buyerName)}</div>
          <div>${esc(data.addressLine1)}${data.addressLine2 ? ', ' + esc(data.addressLine2) : ''}</div>
          <div>${esc(data.city)}${data.state ? ', ' + esc(data.state) : ''} — ${esc(data.postcode)}</div>
          <div>${esc(data.country || 'India')}</div>
          <div style="margin-top:6px;">${esc(data.firstName)} ${esc(data.lastName)}</div>
          <div>Ph. ${esc(data.phone)}</div>
          <div style="color:#0066cc;">${esc(data.email)}</div>
          ${data.gst ? `<div style="margin-top:4px;font-size:12px;color:#666;">GST: ${esc(data.gst)}</div>` : ''}
        </td>
        <td style="width:50%;vertical-align:top;padding-left:16px;border-left:1px solid #eee;">
          <div style="font-size:13px;font-weight:bold;color:#003366;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Payment Methods</div>
          <div style="font-size:13px;color:#444;">
            ${esc(paymentLabel)}<br>
            <span style="color:#888;">(To be confirmed)</span>
          </div>
          ${data.tAndCAgreed ? `<div style="margin-top:10px;font-size:12px;color:#666;">T &amp; C: Yes</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- Product table -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:13px;">
      <thead>
        <tr style="background:#003366;color:#fff;">
          <th style="padding:10px;text-align:center;width:72px;">Image</th>
          <th style="padding:10px;text-align:left;">Product</th>
          <th style="padding:10px;text-align:center;">Quantity</th>
          <th style="padding:10px;text-align:right;">Price</th>
          <th style="padding:10px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;font-size:13px;">
      <tr>
        <td style="padding:6px 0;text-align:right;color:#555;">Subtotal :</td>
        <td style="padding:6px 0 6px 12px;text-align:right;width:130px;font-weight:600;">${fmtINR(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;text-align:right;color:#555;">GST (18%) :</td>
        <td style="padding:6px 0 6px 12px;text-align:right;width:130px;font-weight:600;">${fmtINR(data.gstAmount)}</td>
      </tr>
      ${Number(data.shipping) > 0 ? `
      <tr>
        <td style="padding:6px 0;text-align:right;color:#555;">Shipping :</td>
        <td style="padding:6px 0 6px 12px;text-align:right;width:130px;font-weight:600;">${fmtINR(data.shipping)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:10px 0;text-align:right;border-top:2px solid #003366;font-size:15px;font-weight:bold;color:#003366;">Total :</td>
        <td style="padding:10px 0 10px 12px;text-align:right;border-top:2px solid #003366;width:130px;font-size:15px;font-weight:bold;color:#003366;">${fmtINR(data.total)}</td>
      </tr>
    </table>

    <!-- Special Instructions -->
    <div style="margin-top:24px;padding:14px 16px;background:#fdf9f3;border:1px solid #e5e0d6;border-radius:6px;">
      <div style="font-size:12px;font-weight:bold;color:#A0522D;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Special Instructions or Comments about your order</div>
      <div style="font-size:13px;color:#3a2a1a;white-space:pre-wrap;">${esc(data.specialInstructions) || '— None —'}</div>
    </div>

  </div>
</div>`;

  return sendEmail({
    title: subject,
    subject,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    message: htmlMessage,
    html_message: htmlMessage,
  });
}
