const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
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
  return sendEnquiryEmail('bulk_quote', data);
}

export function sendContactEmail(data) {
  return sendEnquiryEmail('contact', data);
}

// ---------------------------------------------------------------------------
// Enquiry (contact + bulk quote) mail — same Edge Function as orders.
// Subject: [NYD-Query-{shortCode}] {Customer Name}
// Sends to BOTH admin (newyeardiaries@gmail.com) and customer with NYD
// Team signature. Customer gets a confirmation copy.
// ---------------------------------------------------------------------------

/** Pull a short 4-char code from the full enquiry code (NYD-XX-YYYYMMDD-XXXX). */
function shortCode(enquiryCode) {
  if (!enquiryCode) return Math.random().toString(36).slice(2, 6).toUpperCase();
  const parts = String(enquiryCode).split('-');
  return (parts[parts.length - 1] || 'XXXX').toUpperCase();
}

async function sendEnquiryEmail(type, data) {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return { ok: false, skipped: true, reason: 'Supabase env not configured' };
  }

  const code = shortCode(data.enquiry_code);
  const name = (data.name || data.firstName || 'Customer').toString().trim() || 'Customer';
  const subjectAdmin = `[NYD-Query-${code}] New ${type === 'bulk_quote' ? 'Bulk Quote' : 'Contact'} — ${name}`;
  const subjectCustomer = `[NYD-Query-${code}] We received your message, ${name}`;

  const html = buildEnquiryHtml(type, data, code);

  // Build attachments list for the Edge Function. Each item needs
  // {name, type, dataUrl} — the Edge Function parses base64 from the
  // dataUrl and attaches it as a paperclip (4.5MB per file cap).
  const attachments = (data.attachments || []).filter(a => a && a.dataUrl).map(a => ({
    name: a.name,
    type: a.type || 'application/octet-stream',
    dataUrl: a.dataUrl,
  }));

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({
      adminEmail: ORDER_ADMIN_EMAIL,
      customerEmail: data.email,
      subjectAdmin,
      subjectCustomer,
      html,
      attachments,
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.ok) {
    const err = new Error(payload.error || `Edge function ${res.status}`);
    err.payload = payload;
    throw err;
  }
  return { ok: true, via: 'smtp', ...payload };
}

function buildEnquiryHtml(type, data, code) {
  const isQuote = type === 'bulk_quote';
  const title = isQuote ? 'New Bulk Quote Enquiry' : 'New Contact Enquiry';
  const subLine = `[NYD-Query-${code}]`;

  const rows = [];
  const addRow = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    rows.push({ label, value });
  };

  addRow('Enquiry Code', data.enquiry_code || `NYD-Query-${code}`);
  addRow('Name', data.name);
  addRow('Company', data.company);
  addRow('Email', data.email);
  addRow(isQuote ? 'Phone' : 'Mobile', data.phone || data.mobile);
  addRow('Address', data.address);
  addRow('State', data.state);
  addRow('Product Interest', data.product_type);
  addRow('Estimated Quantity', data.quantity ? `${data.quantity} units` : null);
  addRow('Required By', data.required_by);
  addRow('Subject', data.subject);
  addRow('Message', data.message);
  addRow('Customization / Requirements', data.custom_requirements);
  if (data.product_names) {
    addRow('Products from Quote List', data.product_names);
  }
  if (Array.isArray(data.attachments) && data.attachments.length) {
    const list = data.attachments
      .map(a => `${esc(a.name)} (${Math.round((a.size || 0) / 1024)} KB)`)
      .join('\n');
    addRow('Attached Files', list);
  }

  const border = '1px solid #c8d0dc';
  const td = `padding:12px 10px;border:${border};vertical-align:top;background:#ffffff;color:#1a2744;font-size:13px;`;
  const labelTd = `${td}color:#1a4a8a;font-weight:600;width:180px;background:#f8fafc;`;

  const rowsHtml = rows.map((r) => {
    const v = String(r.value);
    const isMulti = v.includes('\n');
    const valueHtml = isMulti
      ? v.split('\n').filter(Boolean).map(line => `<div style="margin:2px 0;">${esc(line)}</div>`).join('')
      : esc(v);
    return `<tr><td style="${labelTd}">${esc(r.label)} :</td><td style="${td}">${valueHtml}</td></tr>`;
  }).join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1a2744;font-size:14px;line-height:1.5;border-collapse:collapse;background:#ffffff;">

  <tr>
    <td style="background:#003366;color:#ffffff;padding:16px 20px;font-size:22px;font-weight:bold;">
      ${esc(title)}
    </td>
  </tr>

  <tr>
    <td style="padding:14px 4px 16px;font-size:14px;color:#1a4a8a;font-weight:600;background:#ffffff;">
      ${esc(subLine)}
    </td>
  </tr>

  <tr>
    <td style="padding:0 8px;background:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;background:#ffffff;">
        <tbody>
          ${rowsHtml || `<tr><td colspan="2" style="${td}">No details provided.</td></tr>`}
        </tbody>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding:24px 20px;background:#fdf9f3;border-top:2px solid #a0522d;">
      <div style="font-size:14px;font-weight:bold;color:#a0522d;margin-bottom:6px;">NYD Team</div>
      <div style="font-size:12px;color:#444;line-height:1.7;">
        Cell &nbsp;: + 91 93111 35190<br>
        Off. &nbsp;&nbsp;: 011 2394 7088, 3333 1586<br>
        Web &nbsp;: <a href="https://www.newyeardiaries.in" style="color:#1a56db;text-decoration:none;">www.newyeardiaries.in</a>
      </div>
      <div style="font-size:11px;color:#888;margin-top:10px;line-height:1.5;">New Year Diaries &mdash; Premium Diaries, Planners &amp; Corporate Gifts<br>174 D, Bawana Industrial Area, Delhi 110039, India</div>
    </td>
  </tr>

</table>`;
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
  let imgIdx = 0;
  for (const logo of logos || []) {
    if (!logo) continue;
    const name = logo.name || 'attachment';
    let dataUrl = logo.dataUrl || logo.data || null;
    if (!dataUrl) continue;

    // Shrink large images so the email payload stays reasonable
    if (dataUrl.startsWith('data:image/') && dataUrl.length > 250_000) {
      dataUrl = (await shrinkDataUrl(dataUrl, 1000)) || dataUrl;
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) continue;

    const isImage = parsed.type.startsWith('image/');
    // Deterministic CID per image so the Edge Function can attach with
    // Content-ID: <logoN@nyd> and the HTML can reference <img src="cid:logoN@nyd">.
    // Non-image files stay as plain paperclips.
    const cid = isImage ? `logo${imgIdx++}@nyd` : null;

    out.push({
      name,
      type: parsed.type,
      data: dataUrl,
      base64: parsed.base64,
      isImage,
      cid,
    });
  }
  return out;
}

async function buildOrderHtml(data, attachments = []) {
  const orderNo = data.orderNumber || 'ORD';
  const orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const noteBody = data.specialInstructions || data.customisation || data.additionalInfo || '';
  const money = (n) => `Rs.&nbsp;${fmtINR(n)}`;

  const itemRows = await Promise.all((data.items || []).map(async (item) => {
    const thumb = await toEmailThumb(item.image || item.product_image || '');
    const imgCell = thumb
      ? `<img src="${esc(thumb)}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #e8e0d5;background:#faf7f2;" />`
      : `<div style="width:64px;height:64px;border-radius:6px;background:#f0ebe3;border:1px solid #e8e0d5;text-align:center;line-height:64px;color:#a0522d;font-size:11px;">NYD</div>`;
    return [
      '<tr>',
      `<td style="padding:14px 10px;border-bottom:1px solid #eee;vertical-align:middle;width:76px;">${imgCell}</td>`,
      `<td style="padding:14px 10px;border-bottom:1px solid #eee;vertical-align:middle;">`,
      `<div style="font-weight:600;color:#1a1a1a;font-size:14px;margin-bottom:4px;">${esc(item.name || 'Item')}</div>`,
      item.sku ? `<div style="font-size:12px;color:#777;">SKU: ${esc(item.sku)}</div>` : '',
      `</td>`,
      `<td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:center;vertical-align:middle;font-size:14px;color:#333;">${esc(item.qty)}</td>`,
      `<td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:right;vertical-align:middle;font-size:14px;color:#333;white-space:nowrap;">${money(item.unitPrice ?? item.price)}</td>`,
      `<td style="padding:14px 10px;border-bottom:1px solid #eee;text-align:right;vertical-align:middle;font-size:14px;font-weight:600;color:#1a1a1a;white-space:nowrap;">${money(item.lineTotal)}</td>`,
      '</tr>',
    ].join('');
  }));

  const logos = data.logos || [];
  let attachBlock = '';
  if (logos.length) {
    const attByName = new Map();
    for (const a of attachments) {
      if (a?.name) attByName.set(a.name, a);
    }
    const previews = logos.map((l) => {
      const du = l.dataUrl || l.data || '';
      const att = attByName.get(l.name);
      const isImg = String(du).startsWith('data:image/');
      if (isImg && att?.cid) {
        return `<td style="padding:6px;text-align:center;vertical-align:top;"><img src="cid:${att.cid}" alt="${esc(l.name)}" width="96" height="96" style="display:block;width:96px;height:96px;object-fit:contain;border:1px solid #e8e0d5;border-radius:8px;background:#fff;" /><div style="font-size:11px;color:#666;margin-top:6px;max-width:96px;word-break:break-word;">${esc(l.name)}</div></td>`;
      }
      return `<td style="padding:6px;text-align:center;vertical-align:top;"><div style="width:96px;height:96px;border:1px solid #e8e0d5;border-radius:8px;background:#f8fafc;line-height:96px;font-size:12px;color:#555;">File</div><div style="font-size:11px;color:#666;margin-top:6px;max-width:96px;word-break:break-word;">${esc(l.name)}</div></td>`;
    }).join('');
    attachBlock = [
      '<tr><td style="padding:20px 24px 8px;background:#ffffff;">',
      `<div style="font-size:15px;font-weight:700;color:#a0522d;margin-bottom:12px;">Uploaded files (${logos.length})</div>`,
      `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${previews}</tr></table>`,
      '<div style="font-size:11px;color:#888;margin-top:10px;">Files are also attached to this email.</div>',
      '</td></tr>',
    ].join('');
  }

  const addrLines = [
    data.company ? esc(data.company) : '',
    esc([data.addressLine1, data.addressLine2].filter(Boolean).join(', ')),
    esc([data.city, data.state, data.postcode].filter(Boolean).join(', ')),
    esc(`${data.firstName || ''} ${data.lastName || ''}`.trim()),
    data.phone ? `Phone: ${esc(data.phone)}` : '',
    data.email ? `Email: ${esc(data.email)}` : '',
    data.gst ? `GST: ${esc(data.gst)}` : '',
  ].filter(Boolean).map((line) => `<div style="margin:0 0 4px 0;line-height:1.5;color:#333;font-size:14px;">${line}</div>`).join('');

  const html = [
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:24px 12px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0d5;">',

    '<tr><td style="background:#a0522d;padding:22px 28px;">',
    '<div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);margin:0 0 6px 0;">New Year Diaries</div>',
    `<div style="font-size:22px;font-weight:700;color:#ffffff;margin:0;">Order #${esc(orderNo)}</div>`,
    `<div style="font-size:13px;color:rgba(255,255,255,0.9);margin:8px 0 0 0;">${esc(orderDate)}</div>`,
    '</td></tr>',

    '<tr><td style="padding:20px 24px 8px;background:#ffffff;">',
    '<div style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 12px 0;">Order items</div>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">',
    '<tr style="background:#faf7f2;">',
    '<th style="padding:10px;text-align:left;font-size:12px;color:#666;font-weight:600;border-bottom:1px solid #e8e0d5;" colspan="2">Product</th>',
    '<th style="padding:10px;text-align:center;font-size:12px;color:#666;font-weight:600;border-bottom:1px solid #e8e0d5;">Qty</th>',
    '<th style="padding:10px;text-align:right;font-size:12px;color:#666;font-weight:600;border-bottom:1px solid #e8e0d5;">Price</th>',
    '<th style="padding:10px;text-align:right;font-size:12px;color:#666;font-weight:600;border-bottom:1px solid #e8e0d5;">Total</th>',
    '</tr>',
    itemRows.join('') || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#888;">No items</td></tr>',
    '</table></td></tr>',

    '<tr><td style="padding:8px 24px 20px;background:#ffffff;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:280px;margin-left:auto;">',
    `<tr><td style="padding:6px 0;font-size:14px;color:#555;">Subtotal</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;white-space:nowrap;">${money(data.subtotal)}</td></tr>`,
    `<tr><td style="padding:6px 0;font-size:14px;color:#555;">GST (18%)</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;white-space:nowrap;">${money(data.gstAmount)}</td></tr>`,
    `<tr><td style="padding:10px 0 0 0;font-size:16px;font-weight:700;color:#a0522d;border-top:2px solid #e8e0d5;">Total</td><td style="padding:10px 0 0 0;font-size:16px;font-weight:700;color:#a0522d;text-align:right;border-top:2px solid #e8e0d5;white-space:nowrap;">${money(data.total)}</td></tr>`,
    '</table>',
    '<div style="margin-top:14px;font-size:12px;color:#777;">Payment: NEFT / RTGS / UPI / Net Banking / Debit Card</div>',
    '</td></tr>',

    '<tr><td style="padding:4px 24px 20px;background:#ffffff;">',
    '<div style="background:#faf7f2;border:1px solid #e8e0d5;border-radius:10px;padding:16px 18px;">',
    '<div style="font-size:14px;font-weight:700;color:#a0522d;margin:0 0 10px 0;">Billing address</div>',
    addrLines,
    '</div></td></tr>',

    noteBody
      ? `<tr><td style="padding:0 24px 20px;background:#ffffff;"><div style="border:1px solid #e8e0d5;border-radius:10px;padding:14px 16px;font-size:13px;color:#333;"><strong style="color:#a0522d;">Special instructions:</strong>&nbsp;${esc(noteBody)}</div></td></tr>`
      : '',

    attachBlock,

    '<tr><td style="padding:12px 24px;font-size:12px;color:#666;background:#ffffff;">Terms accepted: Yes</td></tr>',

    '<tr><td style="padding:22px 24px;background:#fdf9f3;text-align:center;border-top:2px solid #a0522d;">',
    '<div style="font-size:14px;font-weight:700;color:#a0522d;margin:0 0 6px 0;">New Year Diaries</div>',
    '<div style="font-size:12px;color:#666;margin:0 0 4px 0;">174 D, Bawana Industrial Area, Delhi 110039, India</div>',
    '<div style="font-size:12px;color:#666;margin:0;">Phone: +91 93111 35190 | support@newyeardiaries.in | www.newyeardiaries.in</div>',
    '</td></tr>',

    '</table></td></tr></table></body></html>',
  ].join('');

  return html.replace(/\r?\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
}

/**
 * Production order mail via Supabase Edge Function + Gmail SMTP.
 * Real PDF/JPG attachments, full HTML, dual delivery (admin + customer).
 * Requires the `send-order-email` Edge Function deployed and the
 * SMTP_USER / SMTP_PASS / SMTP_FROM / ORDER_ADMIN_EMAIL secrets set
 * in the Supabase project.
 */
export async function sendOrderEmail(data) {
  const orderNo = data.orderNumber || 'ORD';
  const buyerName = (data.company && data.company.trim())
    ? data.company.trim()
    : `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Customer';

  const subjectAdmin = `New Order # ${orderNo} (${buyerName})`;
  const subjectCustomer = `Order Confirmed # ${orderNo} — New Year Diaries`;

  // Build attachments first so each image gets a deterministic CID,
  // then build HTML that references those CIDs via <img src="cid:...">
  // (proper MIME inline part — survives Gmail's data-URL stripping).
  const attachments = await prepareAttachments(data.logos);
  const html = await buildOrderHtml(data, attachments);

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return { ok: false, skipped: true, reason: 'Supabase env not configured' };
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON}`,
      apikey: SUPABASE_ANON,
    },
    body: JSON.stringify({
      orderNumber: orderNo,
      adminEmail: ORDER_ADMIN_EMAIL,
      customerEmail: data.email,
      subjectAdmin,
      subjectCustomer,
      html,
      attachments: attachments.map(a => ({
        name: a.name,
        type: a.type,
        contentBase64: a.base64,
        dataUrl: a.data,
        cid: a.cid,
        isImage: a.isImage,
      })),
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.ok) {
    const err = new Error(payload.error || `Edge function ${res.status}`);
    err.payload = payload;
    throw err;
  }
  return { ok: true, via: 'smtp', ...payload };
}
