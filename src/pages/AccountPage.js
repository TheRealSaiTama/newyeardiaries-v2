import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { supabase } from '../lib/supabase.js';
import { navigateTo } from '../router.js';

// Real session-backed account page (H2.14 companion). Placeholder copy removed.
export async function renderAccountPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-content">
      <div class="container section" style="text-align:center;padding:var(--space-16) 0;">
        <span class="material-symbols-outlined" style="font-size:40px;color:var(--color-text-tertiary)">progress_activity</span>
        <p class="text-body" style="margin-top:var(--space-4)">Loading account…</p>
      </div>
    </div>
  `;

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    app.innerHTML = `
      <div class="page-content">
        <div class="container section" style="max-width:480px;margin:0 auto;text-align:center;padding:var(--space-16) 0;">
          ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'My Account' }])}
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);margin:var(--space-6) 0">person</span>
          <h1 class="heading-2">Sign in required</h1>
          <p class="text-body" style="margin:var(--space-4) 0 var(--space-8)">
            Log in to view your account. Customer accounts use the same secure sign-in as our order system.
          </p>
          <a href="/login" class="btn btn--accent btn--lg">Sign In</a>
          <p style="margin-top:var(--space-6);font-size:var(--fs-sm);color:var(--color-text-secondary)">
            Looking for order help? <a href="/contact">Contact us</a> or call +91 93111 35190.
          </p>
        </div>
      </div>
    `;
    return;
  }

  const user = session.user;
  const email = user.email || 'Account';
  const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'My Account' }])}
        <div class="account-layout">
          <aside class="account-sidebar">
            <nav>
              <a href="/account" class="active"><span class="material-symbols-outlined">dashboard</span> Dashboard</a>
              <a href="/contact"><span class="material-symbols-outlined">support_agent</span> Support</a>
              <a href="/shop"><span class="material-symbols-outlined">storefront</span> Shop</a>
            </nav>
          </aside>
          <div class="account-main">
            <div class="account-welcome">
              <div>
                <h2 class="heading-3">${escapeHtml(name)}</h2>
                <p class="text-sm">${escapeHtml(email)}</p>
              </div>
              <button type="button" class="btn btn--ghost btn--sm" id="account-signout">Sign out</button>
            </div>
            <p class="text-body" style="margin-bottom:var(--space-6);">
              You're signed in. Full order history for customer accounts will appear here as we expand self-serve features.
              For existing bulk orders, our team will contact you with proforma invoices.
            </p>
            <div class="account-stats">
              <div class="account-stat"><div class="stat-value">—</div><div class="stat-label">Orders online</div></div>
              <div class="account-stat"><div class="stat-value">—</div><div class="stat-label">Wishlist</div></div>
              <div class="account-stat"><div class="stat-value">1</div><div class="stat-label">Session</div></div>
            </div>
            <div class="card" style="margin-top:var(--space-6);padding:var(--space-5)">
              <h3 class="heading-4" style="margin-bottom:var(--space-3)">Need help with an order?</h3>
              <p class="text-sm" style="margin-bottom:var(--space-4)">Call customer care or send an enquiry — we respond during business hours.</p>
              <div style="display:flex;gap:var(--space-3);flex-wrap:wrap">
                <a href="tel:+919311135190" class="btn btn--secondary btn--sm">+91 93111 35190</a>
                <a href="/contact" class="btn btn--accent btn--sm">Contact form</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('account-signout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    navigateTo('/login');
  });
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
