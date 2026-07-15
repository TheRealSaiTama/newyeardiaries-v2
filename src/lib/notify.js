const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
// Order receipts land here per business requirement
const ORDER_TO_EMAIL = 'newyeardiaries@gmail.com';

function sendEmail(templateParams, { toEmail } = {}) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return Promise.resolve();
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: toEmail || 'iamravi11@gmail.com',
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
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * Order receipt — PDF layout.
 * EmailJS templates typically use {{message}} which ESCAPES HTML → raw tags in inbox.
 * So `message` is always plain text. Optional `html_message` for templates with {{{html_message}}}.
 */
export function sendOrderEmail(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
  const orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // PDF: "New Order # 12259 (Ramdurga International Pvt. Ltd.)"
  const subject = `New Order # ${orderNo} (${buyerName})`;
  const fromLine = `[Order # ${orderNo}] FROM ${buyerName} (${orderDate})`;
  const specialNote = data.specialInstructions || data.customisation || data.additionalInfo || '';

  // ---- Plain text (what actually shows with current EmailJS {{message}} template) ----
  const itemLines = (data.items || []).map((it, i) => {
    const sku = it.sku ? `  SKU: ${it.sku}` : '';
    return [
      `${i + 1}. ${it.name || 'Item'}`,
      sku,
      `  Qty: ${it.qty}  ×  ₹${fmtINR(it.unitPrice ?? it.price)}  =  ₹${fmtINR(it.lineTotal)}`,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const plainMessage = [
    `New Order: #${orderNo}`,
    fromLine,
    ``,
    `========== ITEMS ==========`,
    itemLines || '(no items)',
    ``,
    `Subtotal :  ₹${fmtINR(data.subtotal)}`,
    `GST      :  ₹${fmtINR(data.gstAmount)}`,
    `Total    :  ₹${fmtINR(data.total)}`,
    ``,
    `Payment Methods: NEFT / RTGS / UPI / QR Code / Net Banking / Debit Card`,
    ``,
    `========== BILLING ADDRESS ==========`,
    data.company ? data.company : null,
    [data.addressLine1, data.addressLine2].filter(Boolean).join(', '),
    [data.city, data.state, data.postcode].filter(Boolean).join(', '),
    `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    data.phone ? `Ph. ${data.phone}` : null,
    data.email || null,
    data.gst || null,
    ``,
    `T & C : I have read & agreed to your privacy statement. I am agree with all Terms and Conditions. : Yes`,
    ``,
    `Special Instructions or Comments about your order:`,
    specialNote || '—',
    data.logos?.length ? `\nUploaded logos: ${data.logos.map(l => l.name).join(', ')}` : null,
  ].filter(line => line !== null).join('\n');

  // ---- HTML (only used if template has {{{html_message}}} unescaped) ----
  // Skip base64 data-URL images — they bloat/break EmailJS.
  const rowsHtml = (data.items || []).map(item => {
    const img = item.image && !String(item.image).startsWith('data:')
      ? `<img src="${esc(item.image)}" alt="" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:4px;display:block;margin:0 auto;">`
      : `<div style="width:56px;height:56px;background:#e8eef5;border-radius:4px;margin:0 auto;"></div>`;
    return `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #d0d7e2;text-align:center;">${img}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #d0d7e2;text-align:center;font-size:13px;">${esc(item.sku || '—')}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #d0d7e2;font-size:13px;">${esc(item.name)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #d0d7e2;text-align:center;font-size:13px;">${esc(item.qty)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #d0d7e2;text-align:right;font-size:13px;">${fmtINR(item.unitPrice ?? item.price)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #d0d7e2;text-align:right;font-size:13px;font-weight:600;">${fmtINR(item.lineTotal)}</td>
      </tr>`;
  }).join('');

  const htmlMessage = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;color:#1a2744;font-size:14px;line-height:1.5;">
  <div style="background:#003366;color:#fff;padding:14px 20px;font-size:20px;font-weight:bold;">New Order: #${esc(orderNo)}</div>
  <div style="padding:14px 4px 18px;font-size:14px;color:#1a4a8a;">${esc(fromLine)}</div>
  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#003366;color:#fff;">
        <th style="padding:10px 8px;">Image</th>
        <th style="padding:10px 8px;">SKU</th>
        <th style="padding:10px 8px;text-align:left;">Product</th>
        <th style="padding:10px 8px;">Quantity</th>
        <th style="padding:10px 8px;text-align:right;">Price</th>
        <th style="padding:10px 8px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || '<tr><td colspan="6" style="padding:16px;text-align:center;">No items</td></tr>'}</tbody>
  </table>
  <table cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0 20px;font-size:13px;">
    <tr><td style="padding:6px 0;text-align:right;padding-right:24px;">Subtotal :</td><td style="text-align:right;width:120px;font-weight:600;">${fmtINR(data.subtotal)}</td></tr>
    <tr><td style="padding:6px 0;text-align:right;padding-right:24px;">GST :</td><td style="text-align:right;font-weight:600;">${fmtINR(data.gstAmount)}</td></tr>
    <tr><td style="padding:8px 0;text-align:right;padding-right:24px;font-weight:bold;color:#003366;">Total :</td><td style="text-align:right;font-weight:bold;color:#003366;">${fmtINR(data.total)}</td></tr>
    <tr><td style="padding:10px 0 0;text-align:right;padding-right:24px;vertical-align:top;">Payment Methods:</td><td style="text-align:right;font-size:12px;">NEFT / RTGS / UPI /<br>QR Code / Net Banking /<br>Debit Card</td></tr>
  </table>
  <div style="margin:24px 0 16px;">
    <div style="font-size:16px;font-weight:bold;color:#1a4a8a;margin-bottom:10px;">Billing Address :</div>
    <div style="padding-left:8px;line-height:1.55;">
      ${data.company ? `<div>${esc(data.company)}</div>` : ''}
      <div>${esc(data.addressLine1)}${data.addressLine2 ? ', ' + esc(data.addressLine2) : ''}</div>
      <div>${esc(data.city)}${data.state ? ', ' + esc(data.state) : ''}${data.postcode ? ', ' + esc(data.postcode) : ''}</div>
      <div style="margin-top:10px;">${esc(data.firstName)} ${esc(data.lastName)}</div>
      <div>Ph. ${esc(data.phone)}</div>
      <div>${esc(data.email)}</div>
      ${data.gst ? `<div style="margin-top:8px;">${esc(data.gst)}</div>` : ''}
    </div>
  </div>
  <div style="margin:16px 0;font-size:13px;color:#555;">T &amp; C : I have read &amp; agreed to your privacy statement. I am agree with all Terms and Conditions. : <span style="color:#1a4a8a;">Yes</span></div>
  <div style="background:#003366;color:#fff;padding:14px 20px;text-align:center;font-size:13px;margin-top:20px;">${esc(specialNote || 'Special Instructions or Comments about your order')}</div>
</div>`;

  return sendEmail({
    title: subject,
    subject,
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || buyerName,
    email: data.email,
    // plain text → readable with current {{message}} template
    message: plainMessage,
    // for templates that use {{{html_message}}}
    html_message: htmlMessage,
  }, { toEmail: ORDER_TO_EMAIL });
}
