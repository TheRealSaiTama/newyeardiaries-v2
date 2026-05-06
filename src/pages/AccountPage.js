import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderAccountPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'My Account' }])}
        <div class="account-layout">
          <aside class="account-sidebar">
            <nav>
              <a href="#" class="active"><span class="material-symbols-outlined">dashboard</span> Dashboard</a>
              <a href="#"><span class="material-symbols-outlined">inventory_2</span> My Orders</a>
              <a href="#"><span class="material-symbols-outlined">favorite</span> Wishlist</a>
              <a href="#"><span class="material-symbols-outlined">manage_accounts</span> Account Details</a>
              <a href="#"><span class="material-symbols-outlined">location_on</span> Saved Addresses</a>
            </nav>
          </aside>
          <div class="account-main">
            <div class="account-welcome">
              <div>
                <h2 class="heading-3">Eleanor Vance</h2>
                <p class="text-sm">eleanor.vance@example.com</p>
              </div>
              <a href="#" class="btn btn--ghost btn--sm">Edit Details <span class="material-symbols-outlined" style="font-size:14px;">arrow_forward</span></a>
            </div>
            <p class="text-body" style="margin-bottom:var(--space-6);">Here is an overview of your recent acquisitions and curated selections.</p>
            <div class="account-stats">
              <div class="account-stat"><div class="stat-value">3</div><div class="stat-label">Orders</div></div>
              <div class="account-stat"><div class="stat-value">2</div><div class="stat-label">Wishlist</div></div>
              <div class="account-stat"><div class="stat-value">1</div><div class="stat-label">Addresses</div></div>
            </div>

            <h3 class="heading-4" style="margin-bottom:var(--space-4);">Recent Order</h3>
            <div class="card" style="margin-bottom:var(--space-6);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--space-4);">
                <div>
                  <h4 style="font-weight:var(--fw-semibold);margin-bottom:var(--space-1);">Bespoke Leather Folio</h4>
                  <p class="text-sm">Your custom embossed folio in deep espresso is currently en route. Expected delivery tomorrow.</p>
                </div>
                <span class="badge badge--success">In Transit</span>
              </div>
            </div>

            <h3 class="heading-4" style="margin-bottom:var(--space-4);">
              <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">draw</span>
              Saved Drafts & Configurations
            </h3>
            <div style="display:flex;flex-direction:column;gap:var(--space-3);">
              <div class="card" style="padding:var(--space-4);display:flex;justify-content:space-between;align-items:center;">
                <div><strong>Corporate Gifting Set - Q4</strong><br><span class="text-xs">Last modified: 2 days ago</span></div>
                <a href="#" class="btn btn--ghost btn--sm">Edit</a>
              </div>
              <div class="card" style="padding:var(--space-4);display:flex;justify-content:space-between;align-items:center;">
                <div><strong>Personal 2025 Planner Layout</strong><br><span class="text-xs">Last modified: 1 week ago</span></div>
                <a href="#" class="btn btn--ghost btn--sm">Edit</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
