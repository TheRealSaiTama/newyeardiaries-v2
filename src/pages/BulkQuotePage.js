import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { navigateTo } from '../router.js';
import { supabase } from '../lib/supabase.js';

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
                <div class="input-group"><label>Full Name *</label><input name="name" type="text" class="input-field" required></div>
                <div class="input-group"><label>Company Name *</label><input name="company" type="text" class="input-field" required></div>
              </div>
              <div class="form-row">
                <div class="input-group"><label>Email *</label><input name="email" type="email" class="input-field" required></div>
                <div class="input-group"><label>Phone *</label><input name="phone" type="tel" class="input-field" required></div>
              </div>
              <div class="input-group">
                <label>Product Interest</label>
                <select name="product_type" class="input-field select-field">
                  <option value="">Select a category</option>
                  <option>2026 Diaries</option>
                  <option>Executive Planners</option>
                  <option>Corporate Gift Sets</option>
                  <option>Custom / Bespoke</option>
                </select>
              </div>
              <div class="form-row">
                <div class="input-group"><label>Estimated Quantity</label><input name="quantity" type="number" class="input-field" placeholder="Min. 25 units" min="25"></div>
                <div class="input-group"><label>Required By</label><input name="required_by" type="date" class="input-field"></div>
              </div>
              <div class="input-group">
                <label>Customization Details</label>
                <textarea name="custom_requirements" class="input-field textarea-field" placeholder="Tell us about branding requirements, colors, special finishes..."></textarea>
              </div>
              <button type="submit" class="btn btn--accent btn--lg btn--full" id="submit-btn">Submit Enquiry</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('bulk-quote-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('submit-btn');

    if (btn.disabled) return;

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      company: form.company.value.trim(),
      product_type: form.product_type.value || null,
      quantity: form.quantity.value ? Number(form.quantity.value) : null,
      custom_requirements: [
        form.custom_requirements.value.trim(),
        form.required_by.value ? `Required by: ${form.required_by.value}` : '',
      ].filter(Boolean).join('\n') || null,
    };

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const { error } = await supabase.from('quote_requests').insert([data]);

    if (error) {
      console.error(error);
      btn.disabled = false;
      btn.textContent = 'Submit Enquiry';
      alert('Something went wrong. Please try again or contact us directly.');
      return;
    }

    navigateTo('/enquiry-success');
  });
}
