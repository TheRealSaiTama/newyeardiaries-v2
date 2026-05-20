import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { navigateTo } from '../router.js';
import { supabase } from '../lib/supabase.js';
import { sendQuoteEmail } from '../lib/notify.js';
import { generateEnquiryCode } from '../lib/enquiry-code.js';
import { getQuoteList, clearQuoteList } from '../data/store.js';
import { getProductById, formatPrice } from '../data/products.js';

export async function renderBulkQuotePage() {
  const app = document.getElementById('app');
  const today = new Date().toISOString().slice(0, 10);

  const quoteList = getQuoteList();
  const quoteItems = (await Promise.all(
    quoteList.map(async item => {
      const product = await getProductById(item.productId);
      return product ? { ...item, product } : null;
    })
  )).filter(Boolean);

  const totalUnits = quoteItems.reduce((sum, item) => sum + item.qty, 0);

  const productsHtml = quoteItems.length > 0 ? `
    <div class="bulk-quote-products">
      <h3>Products in Your Enquiry (${quoteItems.length} items, ${totalUnits} units)</h3>
      <div class="quote-list-items" style="margin-bottom:var(--space-6);">
        ${quoteItems.map(item => `
          <div class="quote-item" style="padding:var(--space-3) 0;border-bottom:1px solid var(--color-border-light);">
            <div style="display:flex;align-items:center;gap:var(--space-3);">
              ${item.product.image ? `<img src="${item.product.image}" alt="${item.product.title}" style="width:48px;height:48px;object-fit:cover;border-radius:var(--radius-sm);">` : ''}
              <div style="flex:1;">
                <div style="font-weight:var(--fw-semibold);">${item.product.title}</div>
                <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);">${item.product.sku || ''} ${item.product.material ? '• ' + item.product.material : ''}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:var(--fw-semibold);">${item.qty} units</div>
                <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);">${formatPrice(item.product.price)}/ea</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

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
            ${productsHtml}
            <h2 class="heading-3" style="margin-bottom:var(--space-6);">Tell Us About Your Needs</h2>
            <form id="bulk-quote-form" class="auth-form">
              <div class="form-row">
                <div class="input-group"><label>Full Name *</label><input name="name" type="text" class="input-field" autocomplete="name" minlength="2" pattern="[A-Za-z][A-Za-z .'-]{1,}" required></div>
                <div class="input-group"><label>Company Name *</label><input name="company" type="text" class="input-field" minlength="2" required></div>
              </div>
              <div class="form-row">
                <div class="input-group"><label>Email *</label><input name="email" type="email" class="input-field" autocomplete="email" required></div>
                <div class="input-group"><label>Phone *</label><input name="phone" type="tel" class="input-field" autocomplete="tel" inputmode="tel" pattern="(?:\\+91[- ]?)?[6-9][0-9]{9}" required></div>
              </div>
              <div class="input-group">
                <label>Product Interest *</label>
                <select name="product_type" class="input-field select-field" required>
                  <option value="">Select a category</option>
                  <option>2026 Diaries</option>
                  <option>Executive Planners</option>
                  <option>Corporate Gift Sets</option>
                  <option>Custom / Bespoke</option>
                </select>
              </div>
              <div class="form-row">
                <div class="input-group"><label>Estimated Quantity *${quoteItems.length > 0 ? ` (${totalUnits} units from quote list)` : ''}</label><input name="quantity" type="number" class="input-field" placeholder="Min. 25 units" min="25" step="1" value="${totalUnits >= 25 ? totalUnits : ''}" required></div>
                <div class="input-group"><label>Required By *</label><input name="required_by" type="date" class="input-field" min="${today}" required></div>
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

    const name = form.name.value.trim().replace(/\s+/g, ' ');
    const company = form.company.value.trim().replace(/\s+/g, ' ');
    const phone = form.phone.value.trim().replace(/[\s-]/g, '');
    const quantity = Number(form.quantity.value);

    form.name.value = name;
    form.company.value = company;
    form.phone.value = phone;

    form.name.setCustomValidity(/^[A-Za-z][A-Za-z .'-]{1,}$/.test(name) ? '' : 'Please enter a valid name.');
    form.company.setCustomValidity(company.length >= 2 ? '' : 'Please enter your company name.');
    form.phone.setCustomValidity(/^(?:\+91)?[6-9][0-9]{9}$/.test(phone) ? '' : 'Please enter a valid 10-digit Indian mobile number.');
    form.quantity.setCustomValidity(Number.isInteger(quantity) && quantity >= 25 ? '' : 'Minimum quantity is 25.');
    form.required_by.setCustomValidity(form.required_by.value && form.required_by.value >= today ? '' : 'Please select today or a future date.');

    if (!form.reportValidity()) return;

    const enquiryCode = generateEnquiryCode('BQ');
    const productSummary = quoteItems.map(item =>
      `${item.product.title} (SKU: ${item.product.sku || 'N/A'}) × ${item.qty} units @ ${formatPrice(item.product.price)}/ea`
    ).join('\n');

    const data = {
      name,
      email: form.email.value.trim(),
      phone,
      company,
      product_type: form.product_type.value,
      quantity,
      custom_requirements: [
        form.custom_requirements.value.trim(),
        form.required_by.value ? `Required by: ${form.required_by.value}` : '',
        quoteItems.length > 0 ? `\n--- Products from Quote List ---\n${productSummary}` : '',
      ].filter(Boolean).join('\n') || null,
      enquiry_code: enquiryCode,
      product_names: quoteItems.map(i => `${i.product.title} ×${i.qty}`).join(', ') || null,
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

    sendQuoteEmail(data).catch(() => {});
    clearQuoteList();
    navigateTo('/enquiry-success');
  });
}
