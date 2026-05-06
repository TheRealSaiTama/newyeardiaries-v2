export function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="auth-layout">
        <div class="auth-panel">
          <h1>Sign In</h1>
          <p>Access your account to manage your orders and bespoke requests.</p>
          <form class="auth-form" onsubmit="event.preventDefault();">
            <div class="input-group"><label>Email Address</label><input type="email" class="input-field" placeholder="your@email.com"></div>
            <div class="input-group"><label>Password</label><input type="password" class="input-field" placeholder="••••••••"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label class="filter-option" style="font-size:var(--fs-sm);"><input type="checkbox"> Remember me</label>
              <a href="#" class="auth-link">Forgot Password?</a>
            </div>
            <button type="submit" class="btn btn--primary btn--lg btn--full">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  `;
}
