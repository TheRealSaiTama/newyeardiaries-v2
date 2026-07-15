const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ORDER_ADMIN_EMAIL = 'newyeardiaries@gmail.com';

function sendEmail(templateParams, { toEmail } = {}) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return Promise.resolve({ ok: false, skipped: true });
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_email: toEmail || ORDER_ADMIN_EMAIL,
        reply_to: templateParams.email || '',
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
  return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * PDF "New Order page" sequence:
 * 1. Blue header New Order: #…
 * 2. [Order # …] (date)
 * 3. Table Image | SKU | Product | Quantity | Price | Total
 * 4. Subtotal / GST / Total
 * 5. Payment Methods
 * 6. Billing Address
 * 7. T & C : Yes
 * 8. Special instructions blue bar
 */
function buildOrderHtml(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
  const orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  // PDF uses: [Order # 12259] (5 June, 2026)
  const subLine = `[Order # ${orderNo}] (${orderDate})`;
  const specialNote = data.specialInstructions || data.customisation || data.additionalInfo
    || 'Special Instructions or Comments about your order';

  const rowsHtml = (data.items || []).map(item => {
    const imgOk = item.image && !String(item.image).startsWith('data:');
    const img = imgOk
      ? `<img src="${esc(item.image)}" width="56" height="56" alt="" style="display:block;margin:0 auto;width:56px;height:56px;object-fit:cover;border:1px solid #c5d0e0;">`
      : `<div style="width:56px;height:56px;margin:0 auto;background:#0a3d6b;"></div>`;
    return `
      <tr style="background:#0a3d6b;color:#ffffff;">
        <td style="padding:12px 8px;border:1px solid #062a4a;text-align:center;vertical-align:middle;width:72px;">${img}</td>
        <td style="padding:12px 8px;border:1px solid #062a4a;text-align:center;vertical-align:middle;font-size:13px;">${esc(item.sku || '—')}</td>
        <td style="padding:12px 8px;border:1px solid #062a4a;vertical-align:middle;font-size:13px;">${esc(item.name || 'Item')}</td>
        <td style="padding:12px 8px;border:1px solid #062a4a;text-align:center;vertical-align:middle;font-size:13px;">${esc(item.qty)}</td>
        <td style="padding:12px 8px;border:1px solid #062a4a;text-align:right;vertical-align:middle;font-size:13px;">${fmtINR(item.unitPrice ?? item.price)}</td>
        <td style="padding:12px 8px;border:1px solid #062a4a;text-align:right;vertical-align:middle;font-size:13px;font-weight:700;">${fmtINR(item.lineTotal)}</td>
      </tr>`;
  }).join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1a2744;font-size:14px;line-height:1.5;border-collapse:collapse;">

  <!-- 1. Header bar -->
  <tr>
    <td style="background:#003366;color:#ffffff;padding:16px 20px;font-size:22px;font-weight:bold;">
      New Order: #${esc(orderNo)}
    </td>
  </tr>

  <!-- 2. Subtitle -->
  <tr>
    <td style="padding:14px 4px 16px;font-size:14px;color:#1a4a8a;font-weight:600;">
      ${esc(subLine)}
    </td>
  </tr>

  <!-- 3. Product table -->
  <tr>
    <td style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#003366;color:#ffffff;">
            <th style="padding:10px 8px;border:1px solid #002244;text-align:center;font-weight:600;">Image</th>
            <th style="padding:10px 8px;border:1px solid #002244;text-align:center;font-weight:600;">SKU</th>
            <th style="padding:10px 8px;border:1px solid #002244;text-align:left;font-weight:600;">Product</th>
            <th style="padding:10px 8px;border:1px solid #002244;text-align:center;font-weight:600;">Quantity</th>
            <th style="padding:10px 8px;border:1px solid #002244;text-align:right;font-weight:600;">Price</th>
            <th style="padding:10px 8px;border:1px solid #002244;text-align:right;font-weight:600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr style="background:#0a3d6b;color:#fff;"><td colspan="6" style="padding:16px;text-align:center;border:1px solid #062a4a;">No items</td></tr>`}
          <!-- 4. Totals (aligned right like PDF) -->
          <tr style="background:#0a3d6b;color:#ffffff;">
            <td colspan="4" style="padding:10px 8px;border:1px solid #062a4a;"></td>
            <td style="padding:10px 8px;border:1px solid #062a4a;text-align:right;">Subtotal :</td>
            <td style="padding:10px 8px;border:1px solid #062a4a;text-align:right;font-weight:600;">${fmtINR(data.subtotal)}</td>
          </tr>
          <tr style="background:#0a3d6b;color:#ffffff;">
            <td colspan="4" style="padding:10px 8px;border:1px solid #062a4a;"></td>
            <td style="padding:10px 8px;border:1px solid #062a4a;text-align:right;">GST :</td>
            <td style="padding:10px 8px;border:1px solid #062a4a;text-align:right;font-weight:600;">${fmtINR(data.gstAmount)}</td>
          </tr>
          <tr style="background:#0a3d6b;color:#ffffff;">
            <td colspan="4" style="padding:10px 8px;border:1px solid #062a4a;"></td>
            <td style="padding:10px 8px;border:1px solid #062a4a;text-align:right;font-weight:bold;">Total :</td>
            <td style="padding:10px 8px;border:1px solid #062a4a;text-align:right;font-weight:bold;">${fmtINR(data.total)}</td>
          </tr>
          <!-- 5. Payment methods -->
          <tr style="background:#0a3d6b;color:#ffffff;">
            <td colspan="4" style="padding:12px 8px;border:1px solid #062a4a;"></td>
            <td style="padding:12px 8px;border:1px solid #062a4a;text-align:right;vertical-align:top;">Payment Methods:</td>
            <td style="padding:12px 8px;border:1px solid #062a4a;text-align:right;font-size:12px;line-height:1.45;">
              NEFT / RTGS / UPI /<br>QR Code / Net Banking /<br>Debit Card
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <!-- 6. Billing Address -->
  <tr>
    <td style="padding:28px 8px 8px;">
      <div style="font-size:16px;font-weight:bold;color:#1a4a8a;margin-bottom:10px;">Billing Address :</div>
      <div style="padding-left:12px;line-height:1.55;color:#1a2744;">
        ${data.company ? `<div>${esc(data.company)}</div>` : ''}
        <div>${esc(data.addressLine1)}${data.addressLine2 ? ', ' + esc(data.addressLine2) : ''}</div>
        <div>${esc(data.city)}${data.state ? ', ' + esc(data.state) : ''}${data.postcode ? ', ' + esc(data.postcode) : ''}</div>
        <div style="margin-top:12px;">${esc(data.firstName)} ${esc(data.lastName)}</div>
        <div>Ph. ${esc(data.phone)}</div>
        <div>${esc(data.email)}</div>
        ${data.gst ? `<div style="margin-top:8px;">${esc(data.gst)}</div>` : ''}
      </div>
    </td>
  </tr>

  <!-- 7. T & C -->
  <tr>
    <td style="padding:16px 8px;font-size:12px;color:#555;">
      T &amp; C : I have read &amp; agreed to your privacy statement. I am agree with all Terms and Conditions. : <span style="color:#1a4a8a;">Yes</span>
    </td>
  </tr>

  <!-- 8. Special instructions bar -->
  <tr>
    <td style="background:#003366;color:#ffffff;padding:14px 20px;text-align:center;font-size:13px;">
      ${esc(specialNote)}
    </td>
  </tr>

  ${data.logos?.some(l => l.name) ? `
  <tr>
    <td style="padding:14px 8px;font-size:12px;color:#555;">
      <strong>Attachments:</strong> ${data.logos.map(l => esc(l.name)).filter(Boolean).join(', ')}
    </td>
  </tr>` : ''}

</table>`;
}

/** Admin + customer emails (needs EmailJS To = {{to_email}}, body = {{{message}}}) */
export function sendOrderEmail(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';

  const subjectAdmin = `New Order # ${orderNo} (${buyerName})`;
  const subjectCustomer = `Order Confirmed # ${orderNo} — New Year Diaries`;
  const html = buildOrderHtml(data);

  const base = {
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || buyerName,
    email: data.email,
  };

  const pAdmin = sendEmail({
    ...base,
    title: subjectAdmin,
    subject: subjectAdmin,
    message: html,
    html_message: html,
  }, { toEmail: ORDER_ADMIN_EMAIL });

  const customerTo = (data.email || '').trim().toLowerCase();
  const pCustomer = customerTo && customerTo !== ORDER_ADMIN_EMAIL.toLowerCase()
    ? sendEmail({
        ...base,
        title: subjectCustomer,
        subject: subjectCustomer,
        message: html,
        html_message: html,
      }, { toEmail: data.email.trim() })
    : Promise.resolve({ skipped: true });

  return Promise.all([pAdmin, pCustomer]);
}
