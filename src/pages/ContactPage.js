import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderContactPage() {
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
                <div><strong>Phone</strong><br><span class="text-sm">+91 11 2345 6789</span><br><span class="text-xs">Mon–Sat, 9am–6pm IST</span></div>
              </div>
              <div class="contact-info-card">
                <span class="material-symbols-outlined">mail</span>
                <div><strong>Email</strong><br><span class="text-sm">sales@vanidiaries.com</span><br><span class="text-xs">Response within 24 hours</span></div>
              </div>
              <div class="contact-info-card">
                <span class="material-symbols-outlined">location_on</span>
                <div><strong>Address</strong><br><span class="text-sm">Okhla Industrial Estate, Phase II<br>New Delhi, India 110020</span></div>
              </div>
              <div class="contact-info-card">
                <span class="material-symbols-outlined">factory</span>
                <div><strong>Factory Tours</strong><br><span class="text-sm">Available by appointment.<br>See our manufacturing process firsthand.</span></div>
              </div>
            </div>
          </div>
          <div class="bulk-quote-form">
            <h2 class="heading-3" style="margin-bottom:var(--space-6);">Send Us a Message</h2>
            <form class="auth-form" onsubmit="event.preventDefault();">
              <div class="form-row">
                <div class="input-group"><label>Full Name</label><input type="text" class="input-field"></div>
                <div class="input-group"><label>Email</label><input type="email" class="input-field"></div>
              </div>
              <div class="input-group"><label>Subject</label><input type="text" class="input-field"></div>
              <div class="input-group"><label>Message</label><textarea class="input-field textarea-field" placeholder="How can we help you?"></textarea></div>
              <button type="submit" class="btn btn--accent btn--lg btn--full">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}
