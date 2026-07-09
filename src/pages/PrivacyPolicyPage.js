import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderPrivacyPolicyPage(params, appContent) {
  const email = appContent?.siteSettings?.contact_email || 'newyeardiaries@gmail.com';
  const address = appContent?.siteSettings?.contact_address || '174 D, Bawana Industrial Area, Delhi, India 110039';

  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Privacy Policy' }])}
      </div>
      <div class="static-content">
        <h1 class="heading-1" style="margin-bottom:var(--space-6);">Privacy Policy</h1>
        <p class="text-xs" style="margin-bottom:var(--space-8);">Last updated: January 2026</p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide directly, such as when you create an account, place an order, submit an enquiry, or contact us. This includes your name, email, phone number, shipping address, and payment information.</p>

        <h2>How We Use Your Information</h2>
        <p>We use the information to process orders, respond to enquiries, send order updates, improve our products and services, and communicate promotional offers (with your consent).</p>

        <h2>Information Sharing</h2>
        <p>We do not sell your personal information. We share information only with service providers who assist in order fulfillment, payment processing, and shipping logistics.</p>

        <h2>Data Security</h2>
        <p>We implement industry-standard security measures including SSL encryption, secure payment gateways, and regular security audits to protect your personal information.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications at any time by contacting us at ${email}.</p>

        <h2>Contact</h2>
        <p>For privacy-related queries, contact us at <strong>${email}</strong> or write to our registered office at ${address.replace(/\n/g, ', ')}.</p>
      </div>
    </div>
  `;
}
