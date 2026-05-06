import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { navigateTo } from '../router.js';

export function renderBulkQuotePage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Request a Bulk Quote' }])}

        <div class="bulk-quote-layout">
          <div class="bulk-quote-info">
            <h1>Request a Bulk Quote</h1>
            <p class="text-body" style="font-size:var(--fs-md);">Elevate your corporate gifting with our handcrafted, premium stationery. From blind debossing to exquisite gold foiling, we offer extensive customization.</p>

            <div class="bulk-quote-trust">
              <div class="bulk-quote-trust-item">
                <span class="material-symbols-outlined">palette</span>
                <div><strong>Artisan Craftsmanship</strong><br><span class="text-sm">Each piece is meticulously crafted in our workshops.</span></div>
              </div>
              <div class="bulk-quote-trust-item">
                <span class="material-symbols-outlined">schedule</span>
                <div><strong>Dedicated Lead Times</strong><br><span class="text-sm">Standard production: 14-21 days. Rush orders available.</span></div>
              </div>
              <div class="bulk-quote-trust-item">
                <span class="material-symbols-outlined">brush</span>
                <div><strong>Bespoke Customization</strong><br><span class="text-sm">Deep blind debossing, gold/silver foiling, custom end-papers.</span></div>
              </div>
            </div>
          </div>

          <div class="bulk-quote-form">
            <h2 class="heading-3" style="margin-bottom:var(--space-6);">Tell Us About Your Needs</h2>
            <form id="bulk-quote-form" class="auth-form">
              <div class="form-row">
                <div class="input-group"><label>Full Name *</label><input type="text" class="input-field" required></div>
                <div class="input-group"><label>Company Name *</label><input type="text" class="input-field" required></div>
              </div>
              <div class="form-row">
                <div class="input-group"><label>Email *</label><input type="email" class="input-field" required></div>
                <div class="input-group"><label>Phone *</label><input type="tel" class="input-field" required></div>
              </div>
              <div class="input-group">
                <label>Product Interest</label>
                <select class="input-field select-field">
                  <option>Select a category</option>
                  <option>2026 Diaries</option>
                  <option>Executive Planners</option>
                  <option>Corporate Gift Sets</option>
                  <option>Custom / Bespoke</option>
                </select>
              </div>
              <div class="form-row">
                <div class="input-group"><label>Estimated Quantity</label><input type="number" class="input-field" placeholder="Min. 25 units" min="25"></div>
                <div class="input-group"><label>Required By</label><input type="date" class="input-field"></div>
              </div>
              <div class="input-group">
                <label>Customization Details</label>
                <textarea class="input-field textarea-field" placeholder="Tell us about branding requirements, colors, special finishes..."></textarea>
              </div>
              <button type="submit" class="btn btn--accent btn--lg btn--full">Submit Enquiry</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('bulk-quote-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    navigateTo('/enquiry-success');
  });
}
