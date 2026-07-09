import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { supabase } from '../lib/supabase.js';
import { sendContactEmail } from '../lib/notify.js';
import { generateEnquiryCode } from '../lib/enquiry-code.js';

export function renderContactPage(params, appContent) {
  const get = (key, fallback = '') => appContent?.siteSettings?.[key] || appContent?.siteContent?.[`footer.${key}`] || fallback;
  const phone = get('contact_phone', '+91 9899223130');
  const phone2 = get('contact_phone2');
  const email = get('contact_email', 'newyeardiaries@gmail.com');
  const rawAddress = get('contact_address', '174 D, Bawana Industrial Area, Delhi, India 110039');
  const address = rawAddress.replace(/\n/g, '<br>');

  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Contact Us' }])}
        <div style="text-align:center;margin-bottom:var(--space-10);">
          <h1 class="heading-1">Get in Touch</h1>
          <p class="text-body" style="font-size:var(--fs-md);max-width:500px;margin:var(--space-3) auto 0;">We'd love to hear from you. Whether you have a question about our products, pricing, or anything else.</p>
        </div>

        <div class="contact-layout">
          <div>
            <div class="contact-info-cards">
              <div class="contact-info-card">
                <span class="material-symbols-outlined">call</span>
                <div><strong>Phone</strong><br><span class="text-sm">${phone}${phone2 ? ' | ' + phone2 : ''}</span><br><span class="text-xs">Mon–Sat, 9am–6pm IST</span></div>
              </div>
              <div class="contact-info-card">
                <span class="material-symbols-outlined">mail</span>
                <div><strong>Email</strong><br><span class="text-sm">${email}</span><br><span class="text-xs">Response within 24 hours</span></div>
              </div>
              <div class="contact-info-card">
                <span class="material-symbols-outlined">location_on</span>
                <div><strong>Address</strong><br><span class="text-sm">${address}</span></div>
              </div>
              <div class="contact-info-card">
                <span class="material-symbols-outlined">factory</span>
                <div><strong>Factory Tours</strong><br><span class="text-sm">Available by appointment.<br>See our manufacturing process firsthand.</span></div>
              </div>
            </div>
          </div>
          <div class="bulk-quote-form">
            <h2 class="heading-3" style="margin-bottom:var(--space-6);">Send Us a Message</h2>
            <form id="contact-form" class="auth-form">
              <div class="input-group"><label>Name *</label><input name="name" type="text" class="input-field" required></div>
              <div class="input-group"><label>Address *</label><input name="address" type="text" class="input-field" required placeholder="Street, City, PIN"></div>
              <div class="form-row">
                <div class="input-group"><label>State *</label><input name="state" type="text" class="input-field" required placeholder="e.g. Delhi"></div>
                <div class="input-group"><label>Mobile Number *</label><input name="mobile" type="tel" class="input-field" required pattern="[0-9+\-\s()]{7,15}" placeholder="+91 9899223130"></div>
              </div>
              <div class="input-group"><label>Email *</label><input name="email" type="email" class="input-field" required></div>
              <div class="input-group"><label>Description *</label><textarea name="message" class="input-field textarea-field" placeholder="Tell us what you're looking for" required></textarea></div>
              <button type="submit" class="btn btn--accent btn--lg btn--full" id="contact-submit-btn">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('contact-submit-btn');
    if (btn.disabled) return;

    const data = {
      name: form.name.value.trim(),
      address: form.address.value.trim(),
      state: form.state.value.trim(),
      mobile: form.mobile.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim() || '',
      enquiry_code: generateEnquiryCode('CT'),
    };

    btn.disabled = true;
    btn.textContent = 'Sending...';

    const { error } = await supabase.from('contact_submissions').insert([data]);

    if (error) {
      console.error('Contact form error:', error);
      btn.disabled = false;
      btn.textContent = 'Send Message';
      alert('Something went wrong. Please try again or contact us directly.');
      return;
    }

    sendContactEmail(data).catch(() => {});
    form.reset();
    btn.textContent = 'Message Sent!';
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Send Message'; }, 3000);
  });
}
