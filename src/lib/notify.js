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

/** Email clients need absolute https:// URLs; relative /images/… never load. */
function emailImageSrc(src) {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  // data: works in some clients; Gmail often strips — still send if small enough
  if (s.startsWith('data:image/')) {
    return s.length <= 180_000 ? s : null;
  }
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  const origin = (typeof window !== 'undefined' && window.location?.origin)
    || import.meta.env.VITE_SITE_URL
    || 'https://newyeardiaries-v2.vercel.app';
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${String(origin).replace(/\/$/, '')}${path}`;
}

/**
 * Clean table email (reference PDF / Image #2):
 * navy header only; white body cells; light borders; blue labels.
 */
function buildOrderHtml(data) {
  const orderNo = data.orderNumber || 'ORD';
  const orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const subLine = `[Order # ${orderNo}] (${orderDate})`;
  const noteBody = data.specialInstructions || data.customisation || data.additionalInfo || '';
  const border = '1px solid #c8d0dc';
  const td = `padding:12px 10px;border:${border};vertical-align:middle;background:#ffffff;color:#1a2744;font-size:13px;`;
  const tdR = `${td}text-align:right;`;
  const tdC = `${td}text-align:center;`;
  const labelTd = `padding:12px 10px;border:${border};vertical-align:middle;background:#ffffff;color:#1a4a8a;font-size:13px;font-weight:600;text-align:right;`;

  const rowsHtml = (data.items || []).map(item => {
    const src = emailImageSrc(item.image || item.product_image);
    // Don't HTML-escape data: URLs (would break the image). http(s) paths still safe after esc of quotes only via attribute.
    const img = src
      ? `<img src="${src.replace(/"/g, '&quot;')}" width="64" height="64" alt="" style="display:block;margin:0 auto;width:64px;height:64px;object-fit:cover;border:1px solid #e2e8f0;border-radius:4px;">`
      : `<div style="width:64px;height:64px;margin:0 auto;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;"></div>`;
    return `
      <tr>
        <td style="${tdC}width:80px;">${img}</td>
        <td style="${tdC}">${esc(item.sku || '—')}</td>
        <td style="${td}">${esc(item.name || 'Item')}</td>
        <td style="${tdC}">${esc(item.qty)}</td>
        <td style="${tdR}">${fmtINR(item.unitPrice ?? item.price)}</td>
        <td style="${tdR}">${fmtINR(item.lineTotal)}</td>
      </tr>`;
  }).join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1a2744;font-size:14px;line-height:1.5;border-collapse:collapse;background:#ffffff;">

  <tr>
    <td style="background:#003366;color:#ffffff;padding:16px 20px;font-size:22px;font-weight:bold;">
      New Order: #${esc(orderNo)}
    </td>
  </tr>

  <tr>
    <td style="padding:14px 4px 16px;font-size:14px;color:#1a4a8a;font-weight:600;background:#ffffff;">
      ${esc(subLine)}
    </td>
  </tr>

  <tr>
    <td style="padding:0;background:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;background:#ffffff;">
        <thead>
          <tr style="background:#003366;color:#ffffff;">
            <th style="padding:12px 10px;border:1px solid #002244;text-align:center;font-weight:600;color:#ffffff;">Image</th>
            <th style="padding:12px 10px;border:1px solid #002244;text-align:center;font-weight:600;color:#ffffff;">SKU</th>
            <th style="padding:12px 10px;border:1px solid #002244;text-align:left;font-weight:600;color:#ffffff;">Product</th>
            <th style="padding:12px 10px;border:1px solid #002244;text-align:center;font-weight:600;color:#ffffff;">Quantity</th>
            <th style="padding:12px 10px;border:1px solid #002244;text-align:right;font-weight:600;color:#ffffff;">Price</th>
            <th style="padding:12px 10px;border:1px solid #002244;text-align:right;font-weight:600;color:#ffffff;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="6" style="${tdC}">No items</td></tr>`}
          <tr>
            <td colspan="4" style="padding:12px 10px;border:${border};background:#ffffff;"></td>
            <td style="${labelTd}">Subtotal :</td>
            <td style="${tdR}">${fmtINR(data.subtotal)}</td>
          </tr>
          <tr>
            <td colspan="4" style="padding:12px 10px;border:${border};background:#ffffff;"></td>
            <td style="${labelTd}">GST :</td>
            <td style="${tdR}">${fmtINR(data.gstAmount)}</td>
          </tr>
          <tr>
            <td colspan="4" style="padding:12px 10px;border:${border};background:#ffffff;"></td>
            <td style="${labelTd}">Total :</td>
            <td style="${tdR}font-weight:700;">${fmtINR(data.total)}</td>
          </tr>
          <tr>
            <td colspan="4" style="padding:12px 10px;border:${border};background:#ffffff;"></td>
            <td style="${labelTd}vertical-align:top;">Payment Methods:</td>
            <td style="${tdR}font-size:12px;line-height:1.45;">
              NEFT / RTGS / UPI /<br>QR Code / Net Banking /<br>Debit Card
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:28px 8px 8px;background:#ffffff;">
      <div style="font-size:16px;font-weight:bold;color:#1a4a8a;margin-bottom:10px;">Billing Address :</div>
      <div style="padding-left:12px;line-height:1.55;color:#1a2744;">
        ${data.company ? `<div>${esc(data.company)}</div>` : ''}
        <div>${esc(data.addressLine1)}${data.addressLine2 ? ', ' + esc(data.addressLine2) : ''}</div>
        <div>${esc(data.city)}${data.state ? ', ' + esc(data.state) : ''}${data.postcode ? ', ' + esc(data.postcode) : ''}</div>
        <div style="margin-top:12px;">${esc(data.firstName)} ${esc(data.lastName)}</div>
        <div>Ph. ${esc(data.phone)}</div>
        <div style="color:#1a56db;">${esc(data.email)}</div>
        ${data.gst ? `<div style="margin-top:8px;">${esc(data.gst)}</div>` : ''}
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding:16px 8px;font-size:12px;color:#555;background:#ffffff;">
      T &amp; C : I have read &amp; agreed to your privacy statement. I am agree with all Terms and Conditions. : <span style="color:#1a4a8a;font-weight:600;">Yes</span>
    </td>
  </tr>

  <tr>
    <td style="padding:8px;background:#ffffff;">
      <div style="border:1px solid #c8d0dc;padding:12px 14px;font-size:13px;color:#1a4a8a;line-height:1.5;">
        <strong>Special Instructions or Comments about your order:</strong> ${esc(noteBody || '—')}
      </div>
    </td>
  </tr>

  ${data.logos?.some(l => l.name) ? `
  <tr>
    <td style="padding:14px 8px;font-size:12px;color:#555;background:#ffffff;">
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
