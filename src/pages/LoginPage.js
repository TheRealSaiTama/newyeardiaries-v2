import { supabase } from '../lib/supabase.js';
import { navigateTo } from '../router.js';

export function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="auth-layout">
        <div class="auth-panel">
          <h1>Sign In</h1>
          <p>Access your account to manage your orders and bespoke requests.</p>
          <form class="auth-form" id="customer-login-form">
            <div class="input-group">
              <label for="login-email">Email Address</label>
              <input id="login-email" name="email" type="email" class="input-field" placeholder="your@email.com" autocomplete="email" required>
            </div>
            <div class="input-group">
              <label for="login-password">Password</label>
              <input id="login-password" name="password" type="password" class="input-field" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" autocomplete="current-password" required>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label class="filter-option" style="font-size:var(--fs-sm);">
                <input type="checkbox" id="login-remember"> Remember me
              </label>
              <a href="/contact" class="auth-link">Need help?</a>
            </div>
            <p id="login-error" role="alert" aria-live="polite" style="display:none;color:var(--color-error);font-size:var(--fs-sm);margin:0;"></p>
            <button type="submit" class="btn btn--primary btn--lg btn--full" id="login-submit">Sign In</button>
          </form>
          <p style="margin-top:var(--space-6);font-size:var(--fs-sm);color:var(--color-text-secondary);text-align:center;">
            Staff / admin? <a href="/admin" class="auth-link">Admin login</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('customer-login-form');
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Signing inâ€¦'; }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data?.session) throw new Error('No session returned');
      navigateTo('/account');
    } catch (err) {
      if (errEl) {
        errEl.textContent = err?.message || 'Sign-in failed. Check your email and password.';
        errEl.style.display = 'block';
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    }
  });
}
