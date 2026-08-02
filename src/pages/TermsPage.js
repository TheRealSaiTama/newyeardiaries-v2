import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderTermsPage(params, appContent) {
  const siteName = appContent?.siteSettings?.site_name || 'New Year Diaries';

  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Terms & Conditions' }])}
      </div>
      <div class="static-content">
        <h1 class="heading-1" style="margin-bottom:var(--space-6);">Terms & Conditions</h1>
        <p class="text-xs" style="margin-bottom:var(--space-8);">Last updated: January 2026</p>

        <h2>General</h2>
        <p>By accessing and using this website, you accept and agree to be bound by these terms. ${siteName} reserves the right to modify these terms at any time.</p>

        <h2>Products & Pricing</h2>
        <p>All product descriptions and prices are as accurate as possible. We reserve the right to correct errors and update information without prior notice. Bulk order pricing is provided on a quote basis and may vary based on quantity, customization, and delivery requirements.</p>

        <h2>Orders & Payment</h2>
        <p>All orders are subject to acceptance and availability. For bulk/corporate orders, a 50% advance payment is required to begin production. Balance payment is due before dispatch.</p>

        <h2>Custom Orders</h2>
        <p>Custom-branded products are manufactured to your specifications. Once production begins, custom orders cannot be cancelled. Please ensure all branding details are confirmed before approval.</p>

        <h2>Intellectual Property</h2>
        <p>All content on this website, including designs, logos, text, and images, is the property of ${siteName} and is protected under applicable intellectual property laws.</p>

        <h2>Limitation of Liability</h2>
        <p>${siteName} shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>

        <h2>Governing Law</h2>
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in New Delhi.</p>
      </div>
    </div>
  `;
}
