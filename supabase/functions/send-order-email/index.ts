/**
 * Free long-term order mail: Gmail SMTP via Supabase Edge Function.
 *
 * Secrets (supabase secrets set …):
 *   SMTP_USER   = newyeardiaries@gmail.com
 *   SMTP_PASS   = Google App Password (16 chars)
 *   SMTP_FROM   = optional, default "New Year Diaries <SMTP_USER>"
 *   ORDER_ADMIN_EMAIL = optional, default newyeardiaries@gmail.com
 *   ALLOWED_ORIGINS   = optional, comma-separated origin allowlist
 *                        (default: newyeardiaries.in, newyeardiaries-v2.vercel.app, localhost)
 *
 * Deploy:
 *   supabase functions deploy send-order-email --no-verify-jwt
 *
 * Security (C4 fix): CORS is now restricted to an allowlist. Browsers will
 * block cross-origin POSTs from random websites, so this function can't be
 * used as an open mail relay anymore.
 */
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'https://newyeardiaries.in,https://newyeardiaries-v2.vercel.app,http://localhost:5173,http://localhost:4173')
  .split(',').map((s) => s.trim()).filter(Boolean);

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

type AttachmentIn = {
  name?: string;
  type?: string;
  contentBase64?: string; // raw base64, no data: prefix
  dataUrl?: string;       // optional full data URL
  cid?: string;           // optional Content-ID for inline preview (e.g. "logo0@nyd")
  isImage?: boolean;      // hint: render as inline vs paperclip
};

type Body = {
  orderNumber?: string;
  adminEmail?: string;
  customerEmail?: string;
  subjectAdmin?: string;
  subjectCustomer?: string;
  html?: string;
  attachments?: AttachmentIn[];
};

type ParsedAttachment = {
  filename: string;
  content: Uint8Array;
  contentType: string;
  cid: string | null;
  disposition: 'inline' | 'attachment';
};

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
  });
}

function parseBase64(att: AttachmentIn): ParsedAttachment | null {
  const filename = (att.name || 'attachment').replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 120);
  let b64 = att.contentBase64 || '';
  let contentType = att.type || 'application/octet-stream';

  if (!b64 && att.dataUrl) {
    const m = String(att.dataUrl).match(/^data:([^;]+);base64,(.+)$/s);
    if (!m) return null;
    contentType = m[1] || contentType;
    b64 = m[2];
  }
  if (!b64) return null;

  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    // Cap ~4.5MB per file to stay under typical SMTP limits
    if (bytes.length > 4_500_000) return null;
    // Inline (CID-attached) for images that came with a cid; paperclip for everything else.
    const isImage = att.isImage ?? contentType.startsWith('image/');
    const cid = att.cid && isImage ? att.cid : null;
    return {
      filename,
      content: bytes,
      contentType,
      cid,
      disposition: cid ? 'inline' : 'attachment',
    };
  } catch {
    return null;
  }
}

async function sendOne(
  client: SMTPClient,
  from: string,
  to: string,
  subject: string,
  html: string,
  attachments: ParsedAttachment[],
  replyTo?: string,
) {
  await client.send({
    from,
    to,
    subject,
    html,
    content: 'html',
    replyTo: replyTo || undefined,
    attachments: attachments.map((a) => {
      const out: Record<string, unknown> = {
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      };
      if (a.cid) {
        out.cid = a.cid;
        out.disposition = a.disposition;
      }
      return out;
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(req) });
  }
  if (req.method !== 'POST') {
    return json(req, 405, { error: 'Method not allowed' });
  }

  // C4 hardening: reject non-allowlisted Origin (server-to-server calls and
  // same-origin browser calls don't send Origin; cross-origin browser calls do).
  const origin = req.headers.get('origin') || '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json(req, 403, { error: 'Origin not allowed' });
  }

  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  if (!user || !pass) {
    return json(req, 503, {
      error: 'SMTP not configured',
      hint: 'Set SMTP_USER and SMTP_PASS secrets (Gmail App Password), then redeploy.',
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: 'Invalid JSON' });
  }

  const html = body.html;
  if (!html || typeof html !== 'string') {
    return json(req, 400, { error: 'html is required' });
  }

  const adminEmail = (body.adminEmail || Deno.env.get('ORDER_ADMIN_EMAIL') || 'newyeardiaries@gmail.com').trim();
  const customerEmail = (body.customerEmail || '').trim();
  const subjectAdmin = body.subjectAdmin || `New Order # ${body.orderNumber || ''}`;
  const subjectCustomer = body.subjectCustomer || `Order Confirmed # ${body.orderNumber || ''} — New Year Diaries`;
  const from = Deno.env.get('SMTP_FROM') || `New Year Diaries <${user}>`;

  // H1.7 fix: surface oversized files in the response (instead of silently
  // dropping them) so the caller can warn the user.
  const incomingAttachments = (body.attachments || []).slice(0, 5);
  const droppedOversized = [];
  const parsedAttachments = [];
  for (const att of incomingAttachments) {
    const parsed = parseBase64(att);
    if (parsed) {
      parsedAttachments.push(parsed);
    } else {
      // parseBase64 returns null if file > 4.5MB or invalid base64
      droppedOversized.push(att?.name || 'unknown');
    }
  }
  const attachments = parsedAttachments;

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  try {
    // Admin always — set reply-to so the team can hit Reply and reach the
    // customer without copy-pasting the address.
    await sendOne(client, from, adminEmail, subjectAdmin, html, attachments, customerEmail);

    // Customer if different — set reply-to to admin so customer can reply
    // back to the team easily.
    if (customerEmail && customerEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      await sendOne(client, from, customerEmail, subjectCustomer, html, attachments, adminEmail);
    }

    await client.close();
    return json(req, 200, {
      ok: true,
      sent: {
        admin: adminEmail,
        customer: customerEmail || null,
        attachmentCount: attachments.length,
        // H1.7: report dropped oversized files so the caller can warn user.
        droppedOversized,
      },
    });
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    console.error('[send-order-email]', e);
    return json(req, 500, {
      error: 'Failed to send email',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
});
