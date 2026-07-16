/**
 * Free long-term order mail: Gmail SMTP via Supabase Edge Function.
 *
 * Secrets (supabase secrets set …):
 *   SMTP_USER   = newyeardiaries@gmail.com
 *   SMTP_PASS   = Google App Password (16 chars)
 *   SMTP_FROM   = optional, default "New Year Diaries <SMTP_USER>"
 *   ORDER_ADMIN_EMAIL = optional, default newyeardiaries@gmail.com
 *
 * Deploy:
 *   supabase functions deploy send-order-email --no-verify-jwt
 */
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AttachmentIn = {
  name?: string;
  type?: string;
  contentBase64?: string; // raw base64, no data: prefix
  dataUrl?: string;       // optional full data URL
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

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseBase64(att: AttachmentIn): { filename: string; content: Uint8Array; contentType: string } | null {
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
    return { filename, content: bytes, contentType };
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
  attachments: { filename: string; content: Uint8Array; contentType: string }[],
) {
  await client.send({
    from,
    to,
    subject,
    html,
    content: 'auto',
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  if (!user || !pass) {
    return json(503, {
      error: 'SMTP not configured',
      hint: 'Set SMTP_USER and SMTP_PASS secrets (Gmail App Password), then redeploy.',
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const html = body.html;
  if (!html || typeof html !== 'string') {
    return json(400, { error: 'html is required' });
  }

  const adminEmail = (body.adminEmail || Deno.env.get('ORDER_ADMIN_EMAIL') || 'newyeardiaries@gmail.com').trim();
  const customerEmail = (body.customerEmail || '').trim();
  const subjectAdmin = body.subjectAdmin || `New Order # ${body.orderNumber || ''}`;
  const subjectCustomer = body.subjectCustomer || `Order Confirmed # ${body.orderNumber || ''} — New Year Diaries`;
  const from = Deno.env.get('SMTP_FROM') || `New Year Diaries <${user}>`;

  const attachments = (body.attachments || [])
    .map(parseBase64)
    .filter((a): a is NonNullable<typeof a> => !!a)
    .slice(0, 5);

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  try {
    // Admin always
    await sendOne(client, from, adminEmail, subjectAdmin, html, attachments);

    // Customer if different
    if (customerEmail && customerEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      await sendOne(client, from, customerEmail, subjectCustomer, html, attachments);
    }

    await client.close();
    return json(200, {
      ok: true,
      sent: {
        admin: adminEmail,
        customer: customerEmail || null,
        attachmentCount: attachments.length,
      },
    });
  } catch (e) {
    try { await client.close(); } catch { /* ignore */ }
    console.error('[send-order-email]', e);
    return json(500, {
      error: 'Failed to send email',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
});
