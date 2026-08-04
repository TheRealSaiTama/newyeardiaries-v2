import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { supabase } from '../lib/supabase.js';
import { sendContactEmail } from '../lib/notify.js';
import { generateEnquiryCode } from '../lib/enquiry-code.js';

export function renderContactPage(params, appContent) {
  const get = (key, fallback = '') => appContent?.siteSettings?.[key] || appContent?.siteContent?.[`footer.${key}`] || fallback;
  const phone = get('contact_phone', '+91 93111 35190');
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
            </div>
          </div>
          <div class="bulk-quote-form">
            <h2 class="heading-3" style="margin-bottom:var(--space-6);">Send Us a Message</h2>
            <form id="contact-form" class="auth-form">
              <div class="input-group"><label>Name *</label><input name="name" type="text" class="input-field" required></div>
              <div class="input-group"><label>Address *</label><input name="address" type="text" class="input-field" required placeholder="Street, City, PIN"></div>
              <div class="form-row">
                <div class="input-group"><label>State *</label><input name="state" type="text" class="input-field" required placeholder="e.g. Delhi"></div>
                <div class="input-group"><label>Mobile Number *</label><input name="mobile" type="tel" class="input-field" required pattern="[0-9+\-\s()]{7,15}" placeholder="+91 93111 35190"></div>
              </div>
              <div class="input-group"><label>Email *</label><input name="email" type="email" class="input-field" required></div>
              <div class="input-group"><label>Description *</label><textarea name="message" class="input-field textarea-field" placeholder="Tell us what you're looking for" required></textarea></div>
              <div class="input-group">
                <label>Attach Files <small style="color:var(--color-text-tertiary);font-weight:400">(optional — logos, briefs, references)</small></label>
                <input name="attachments" type="file" multiple accept="image/*,.pdf,.ai,.eps,.svg,.doc,.docx" id="contact-files" class="input-field" style="padding:8px">
                <small id="contact-files-hint" style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">Max 5 files, 5 MB each. Files come in the email as attachments.</small>
              </div>
              <button type="submit" class="btn btn--accent btn--lg btn--full" id="contact-submit-btn">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const contactForm = document.getElementById('contact-form');
  if (contactForm && contactForm.dataset.bound === '1') return;
  if (contactForm) contactForm.dataset.bound = '1';
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('contact-submit-btn');
    if (btn.disabled) return;

    const fileInput = document.getElementById('contact-files');
    const fileList = fileInput ? Array.from(fileInput.files || []) : [];
    if (fileList.length > 5) {
      alert('Please attach at most 5 files.');
      return;
    }
    for (const f of fileList) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`"${f.name}" is larger than 5 MB. Please compress and try again.`);
        return;
      }
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';

    // Read each file as a data URL for the email attachment
    const attachments = [];
    for (const f of fileList) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(f);
        });
        attachments.push({ name: f.name, type: f.type, size: f.size, dataUrl });
      } catch (err) {
        console.error('File read failed:', err);
      }
    }

    const data = {
      name: form.name.value.trim(),
      address: form.address.value.trim(),
      state: form.state.value.trim(),
      mobile: form.mobile.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim() || '',
      attachments,
      enquiry_code: generateEnquiryCode('CT'),
    };

    const { error } = await supabase.from('contact_submissions').insert([{
      name: data.name,
      email: data.email,
      address: data.address,
      state: data.state,
      mobile: data.mobile,
      message: data.message,
      // M18 fix: persist the generated enquiry code so admin can search
      // by code in the panel and reply to the right ticket.
      enquiry_code: data.enquiry_code,
    }]);

    if (error) {
      console.error('Contact form error:', error);
      btn.disabled = false;
      btn.textContent = 'Send Message';
      alert('Something went wrong. Please try again or contact us directly.');
      return;
    }

    sendContactEmail(data).catch((err) => console.error('Contact email failed:', err));
    form.reset();
    document.getElementById('contact-files-hint').textContent = 'Max 5 files, 5 MB each. Files come in the email as attachments.';
    btn.classList.add('btn--success');
    btn.textContent = attachments.length ? `✓ Sent with ${attachments.length} file(s)!` : '✓ Message Sent!';
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('btn--success');
      btn.textContent = 'Send Message';
    }, 3500);
  });
}
