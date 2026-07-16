const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ORDER_ADMIN_EMAIL = 'newyeardiaries@gmail.com';
// Public site origin for product images in email (must be reachable by Gmail’s servers)
const SITE_ORIGIN = (import.meta.env.VITE_SITE_URL || 'https://newyeardiaries-v2.vercel.app').replace(/\/$/, '');

function sendEmail(templateParams, { toEmail, attachments } = {}) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return Promise.resolve({ ok: false, skipped: true });

  // EmailJS Variable Attachments: pass base64 (or data URL) under param names
  // configured in template → Attachments tab as “Variable Attachment”.
  // Also pass file1..file5 so one-time dashboard setup works for up to 5 files.
  const attachParams = {};
  (attachments || []).slice(0, 5).forEach((a, i) => {
    const n = i + 1;
    attachParams[`file${n}`] = a.data;           // base64 or data URL
    attachParams[`file${n}_name`] = a.name;
    attachParams[`file${n}_type`] = a.type || 'application/octet-stream';
  });

  const body = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      to_email: toEmail || ORDER_ADMIN_EMAIL,
      reply_to: templateParams.email || '',
      ...templateParams,
      ...attachParams,
    },
  };

  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

/** Absolute https URL for a product image path. */
function absoluteUrl(src) {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (s.startsWith('data:')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  return `${SITE_ORIGIN}${s.startsWith('/') ? s : `/${s}`}`;
}

/**
 * Gmail-friendly product thumb:
 * - .webp (and other formats) → public JPEG via images.weserv.nl proxy
 * - data:image → shrink to small JPEG data URL (inline)
 */
async function toEmailThumb(src) {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;

  // Already a small jpeg/png data URL
  if (s.startsWith('data:image/jpeg') || s.startsWith('data:image/png') || s.startsWith('data:image/gif')) {
    return s.length <= 200_000 ? s : await shrinkDataUrl(s, 120);
  }
  if (s.startsWith('data:image/')) {
    return shrinkDataUrl(s, 120);
  }

  const abs = absoluteUrl(s);
  if (!abs) return null;

  // Proxy to JPEG — Gmail often fails on .webp
  const hostPath = abs.replace(/^https?:\/\//i, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(hostPath)}&w=128&h=128&fit=cover&output=jpg&q=75`;
}

function shrinkDataUrl(dataUrl, maxSide = 120) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return null;
  return { type: m[1], base64: m[2], dataUrl };
}

async function prepareAttachments(logos = []) {
  const out = [];
  for (const logo of logos || []) {
    if (!logo) continue;
    const name = logo.name || 'attachment';
    let dataUrl = logo.dataUrl || logo.data || null;
    if (!dataUrl) continue;

    // Shrink large images so EmailJS accepts them
    if (dataUrl.startsWith('data:image/') && dataUrl.length > 250_000) {
      dataUrl = (await shrinkDataUrl(dataUrl, 1000)) || dataUrl;
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) continue;

    // EmailJS Variable Attachment accepts full data URL or raw base64
    out.push({
      name,
      type: parsed.type,
      data: dataUrl,
      base64: parsed.base64,
    });
  }
  return out;
}

async function buildOrderHtml(data) {
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

  // Resolve thumbs in parallel (webp → jpeg proxy, data → shrink)
  const thumbs = await Promise.all(
    (data.items || []).map(it => toEmailThumb(it.image || it.product_image))
  );

  const rowsHtml = (data.items || []).map((item, idx) => {
    const src = thumbs[idx];
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

  // Inline previews for image uploads + list of all attachment names
  const logos = data.logos || [];
  let attachHtml = '';
  if (logos.length) {
    const previews = logos.map(l => {
      const du = l.dataUrl || l.data || '';
      const isImg = du.startsWith('data:image/');
      if (isImg) {
        return `
          <div style="display:inline-block;margin:6px 10px 6px 0;text-align:center;vertical-align:top;">
            <img src="${du.replace(/"/g, '&quot;')}" alt="${esc(l.name)}" width="100" height="100" style="width:100px;height:100px;object-fit:contain;border:1px solid #c8d0dc;border-radius:6px;background:#fff;">
            <div style="font-size:11px;color:#555;margin-top:4px;max-width:100px;word-break:break-all;">${esc(l.name)}</div>
          </div>`;
      }
      return `
        <div style="display:inline-block;margin:6px 10px 6px 0;padding:12px;border:1px solid #c8d0dc;border-radius:6px;font-size:12px;color:#1a2744;background:#f8fafc;">
          📎 ${esc(l.name)}
          ${du ? `<div style="margin-top:6px;"><a href="${du.replace(/"/g, '&quot;')}" download="${esc(l.name)}" style="color:#1a56db;font-size:11px;">Open / Download</a></div>` : ''}
        </div>`;
    }).join('');

    attachHtml = `
  <tr>
    <td style="padding:16px 8px;background:#ffffff;">
      <div style="font-size:14px;font-weight:bold;color:#1a4a8a;margin-bottom:10px;">Attachments (${logos.length})</div>
      <div>${previews}</div>
      <div style="font-size:11px;color:#888;margin-top:8px;">Image files are shown above. PDF/docs are also sent as email attachments when EmailJS Variable Attachments (file1…file5) are configured.</div>
    </td>
  </tr>`;
  }

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

  ${attachHtml}

</table>`;
}

/** Admin + customer emails (needs EmailJS To = {{to_email}}, body = {{{message}}}) */
export async function sendOrderEmail(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';

  const subjectAdmin = `New Order # ${orderNo} (${buyerName})`;
  const subjectCustomer = `Order Confirmed # ${orderNo} — New Year Diaries`;

  // Prepare file attachments + HTML (async: product thumbs + file packing)
  const [html, attachments] = await Promise.all([
    buildOrderHtml(data),
    prepareAttachments(data.logos),
  ]);

  const base = {
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || buyerName,
    email: data.email,
  };

  // Prefer full files on admin mail; customer gets HTML previews (lighter)
  const pAdmin = sendEmail({
    ...base,
    title: subjectAdmin,
    subject: subjectAdmin,
    message: html,
    html_message: html,
  }, { toEmail: ORDER_ADMIN_EMAIL, attachments });

  const customerTo = (data.email || '').trim().toLowerCase();
  const pCustomer = customerTo && customerTo !== ORDER_ADMIN_EMAIL.toLowerCase()
    ? sendEmail({
        ...base,
        title: subjectCustomer,
        subject: subjectCustomer,
        message: html,
        html_message: html,
      }, { toEmail: data.email.trim(), attachments })
    : Promise.resolve({ skipped: true });

  return Promise.all([pAdmin, pCustomer]);
}
