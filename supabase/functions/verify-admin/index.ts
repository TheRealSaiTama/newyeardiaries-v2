import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ||
  'https://newyeardiaries.in,https://www.newyeardiaries.in,https://newyeardiaries-v2.vercel.app,http://localhost:5173,http://localhost:4173')
  .split(',').map((s) => s.trim()).filter(Boolean);

function isAllowedOrigin(origin: string) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }
  return false;
}

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? (origin || '*') : '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY =
  Deno.env.get('SERVICE_ROLE_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  '';
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') ?? '';
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@newyeardiaries.in';

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(req) });
  }
  if (req.method !== 'POST') {
    return json(req, 405, { error: 'Method not allowed' });
  }

  const origin = req.headers.get('origin') || '';
  if (origin && !isAllowedOrigin(origin)) {
    return json(req, 403, { error: 'Origin not allowed' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(req, 503, {
      error: 'Server not configured',
      hint: 'SUPABASE_URL / service role key missing. Redeploy the function; service role is auto-injected as SUPABASE_SERVICE_ROLE_KEY.',
    });
  }
  if (!ADMIN_PASSWORD) {
    return json(req, 503, {
      error: 'Admin password not configured',
      hint: 'Run: supabase secrets set ADMIN_PASSWORD=your-password',
    });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return json(req, 400, { error: 'Invalid JSON' });
  }

  const { password } = body;
  if (!password || typeof password !== 'string') {
    return json(req, 400, { error: 'password is required' });
  }

  if (password !== ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 250));
    return json(req, 401, { error: 'Invalid password' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let signIn = await admin.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (signIn.error) {
    const msg = signIn.error.message || '';
    const isInvalidLogin =
      msg.toLowerCase().includes('invalid') ||
      msg.toLowerCase().includes('credentials') ||
      signIn.error.status === 400;

    if (isInvalidLogin) {
      const created = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (created.error) {
        return json(req, 500, { error: 'Failed to create admin user: ' + created.error.message });
      }
      signIn = await admin.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      if (signIn.error) {
        return json(req, 500, { error: 'Failed to sign in after create: ' + signIn.error.message });
      }
    } else {
      return json(req, 500, { error: 'Sign-in failed: ' + msg });
    }
  }

  const session = signIn.data?.session;
  const user = signIn.data?.user;
  if (!session || !user) {
    return json(req, 500, { error: 'No session returned' });
  }

  return json(req, 200, {
    ok: true,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: { id: user.id, email: user.email },
  });
});
