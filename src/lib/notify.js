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

/** Professional HTML order receipt (giftvibes / PDF table style). */
function buildOrderHtml(data, { forCustomer = false } = {}) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
  const orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const fromLine = `[Order # ${orderNo}] FROM ${buyerName} (${orderDate})`;
  const specialNote = data.specialInstructions || data.customisation || data.additionalInfo || '';

  const rowsHtml = (data.items || []).map(item => {
    const imgOk = item.image && !String(item.image).startsWith('data:');
    const img = imgOk
      ? `<img src="${esc(item.image)}" width="52" height="52" alt="" style="display:block;width:52px;height:52px;object-fit:cover;border-radius:4px;border:1px solid #d0d7e2;">`
      : `<div style="width:52px;height:52px;background:#eef2f7;border-radius:4px;border:1px solid #d0d7e2;"></div>`;
    return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #dce3ee;text-align:center;vertical-align:middle;">${img}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #dce3ee;text-align:center;vertical-align:middle;font-size:12px;color:#334;">${esc(item.sku || '—')}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #dce3ee;vertical-align:middle;font-size:13px;color:#1a2744;font-weight:600;">${esc(item.name || 'Item')}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #dce3ee;text-align:center;vertical-align:middle;font-size:13px;">${esc(item.qty)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #dce3ee;text-align:right;vertical-align:middle;font-size:13px;">₹${fmtINR(item.unitPrice ?? item.price)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #dce3ee;text-align:right;vertical-align:middle;font-size:13px;font-weight:700;">₹${fmtINR(item.lineTotal)}</td>
      </tr>`;
  }).join('');

  const intro = forCustomer
    ? `<p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.55;">Thank you for your order with <strong>New Year Diaries</strong>. We have received it and our team will contact you shortly with the proforma invoice. <strong>Please do not make any payment yet.</strong></p>`
    : `<p style="margin:0 0 16px;font-size:14px;color:#333;line-height:1.55;">New order received. Customer: <strong>${esc(data.firstName || '')} ${esc(data.lastName || '')}</strong> &lt;${esc(data.email || '')}&gt;</p>`;

  return `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f0f2f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;background:#ffffff;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#1a2744;font-size:14px;line-height:1.5;border:1px solid #d0d7e2;">

  <tr>
    <td style="background:#003366;color:#ffffff;padding:16px 22px;font-size:20px;font-weight:bold;">
      New Order: #${esc(orderNo)}
    </td>
  </tr>

  <tr>
    <td style="padding:14px 22px;background:#f5f8fc;border-bottom:1px solid #d0d7e2;font-size:14px;color:#1a4a8a;font-weight:600;">
      ${esc(fromLine)}
    </td>
  </tr>

  <tr>
    <td style="padding:20px 22px 8px;">
      ${intro}
    </td>
  </tr>

  <tr>
    <td style="padding:0 22px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead>
          <tr style="background:#003366;color:#ffffff;">
            <th style="padding:10px 8px;text-align:center;font-weight:600;width:64px;">Image</th>
            <th style="padding:10px 8px;text-align:center;font-weight:600;">SKU</th>
            <th style="padding:10px 8px;text-align:left;font-weight:600;">Product</th>
            <th style="padding:10px 8px;text-align:center;font-weight:600;">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-weight:600;">Price</th>
            <th style="padding:10px 8px;text-align:right;font-weight:600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" style="padding:16px;text-align:center;color:#888;">No items</td></tr>'}
        </tbody>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:12px 22px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
        <tr>
          <td style="padding:5px 0;text-align:right;color:#555;padding-right:16px;">Subtotal :</td>
          <td style="padding:5px 0;text-align:right;width:110px;font-weight:600;">₹${fmtINR(data.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;text-align:right;color:#555;padding-right:16px;">GST (18%) :</td>
          <td style="padding:5px 0;text-align:right;font-weight:600;">₹${fmtINR(data.gstAmount)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;text-align:right;padding-right:16px;font-size:15px;font-weight:bold;color:#003366;border-top:2px solid #003366;">Total :</td>
          <td style="padding:8px 0;text-align:right;font-size:15px;font-weight:bold;color:#003366;border-top:2px solid #003366;">₹${fmtINR(data.total)}</td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;text-align:right;color:#555;padding-right:16px;vertical-align:top;">Payment Methods:</td>
          <td style="padding:12px 0 0;text-align:right;font-size:12px;color:#333;line-height:1.45;">NEFT / RTGS / UPI /<br>QR Code / Net Banking /<br>Debit Card</td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:20px 22px 8px;">
      <div style="font-size:15px;font-weight:bold;color:#1a4a8a;margin-bottom:8px;">Billing Address :</div>
      <div style="padding-left:4px;line-height:1.55;color:#1a2744;">
        ${data.company ? `<div style="font-weight:600;">${esc(data.company)}</div>` : ''}
        <div>${esc(data.addressLine1)}${data.addressLine2 ? ', ' + esc(data.addressLine2) : ''}</div>
        <div>${esc(data.city)}${data.state ? ', ' + esc(data.state) : ''}${data.postcode ? ' ' + esc(data.postcode) : ''}</div>
        <div style="margin-top:8px;">${esc(data.firstName)} ${esc(data.lastName)}</div>
        <div>Ph. ${esc(data.phone)}</div>
        <div><a href="mailto:${esc(data.email)}" style="color:#0066cc;">${esc(data.email)}</a></div>
        ${data.gst ? `<div style="margin-top:6px;">${esc(data.gst)}</div>` : ''}
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding:12px 22px 16px;font-size:12px;color:#555;">
      T &amp; C : I have read &amp; agreed to your privacy statement. I am agree with all Terms and Conditions. : <span style="color:#1a4a8a;font-weight:600;">Yes</span>
    </td>
  </tr>

  <tr>
    <td style="background:#003366;color:#ffffff;padding:14px 22px;text-align:center;font-size:13px;">
      ${esc(specialNote || 'Special Instructions or Comments about your order')}
    </td>
  </tr>

  ${data.logos?.length ? `
  <tr>
    <td style="padding:16px 22px;background:#faf7f2;border-top:1px solid #e5e0d6;">
      <div style="font-size:12px;font-weight:bold;color:#A0522D;margin-bottom:8px;">ATTACHMENTS (${data.logos.length})</div>
      <div style="font-size:12px;color:#444;">${data.logos.map(l => esc(l.name)).join(' · ')}</div>
    </td>
  </tr>` : ''}

  <tr>
    <td style="padding:14px 22px;background:#f8f9fb;border-top:1px solid #e5e0d6;font-size:11px;color:#888;text-align:center;">
      New Year Diaries · newyeardiaries@gmail.com · +91 98992 23130
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`;
}

/**
 * Send TWO emails: admin (newyeardiaries@gmail.com) + customer (order email).
 * HTML body requires EmailJS template variable as unescaped: {{{message}}}
 * (single braces {{message}} will show raw HTML tags).
 */
export function sendOrderEmail(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';
  const subjectAdmin = `New Order # ${orderNo} (${buyerName})`;
  const subjectCustomer = `Order Confirmed # ${orderNo} — New Year Diaries`;

  const htmlAdmin = buildOrderHtml(data, { forCustomer: false });
  const htmlCustomer = buildOrderHtml(data, { forCustomer: true });

  const base = {
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || buyerName,
    email: data.email,
  };

  // Admin copy
  const pAdmin = sendEmail({
    ...base,
    title: subjectAdmin,
    subject: subjectAdmin,
    message: htmlAdmin,
    html_message: htmlAdmin,
  }, { toEmail: ORDER_ADMIN_EMAIL });

  // Customer copy (only if different from admin)
  const customerTo = (data.email || '').trim().toLowerCase();
  const adminTo = ORDER_ADMIN_EMAIL.toLowerCase();
  const pCustomer = customerTo && customerTo !== adminTo
    ? sendEmail({
        ...base,
        title: subjectCustomer,
        subject: subjectCustomer,
        message: htmlCustomer,
        html_message: htmlCustomer,
      }, { toEmail: data.email.trim() })
    : Promise.resolve({ skipped: true });

  return Promise.all([pAdmin, pCustomer]);
}
