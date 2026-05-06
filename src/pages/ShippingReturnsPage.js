import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderShippingReturnsPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Shipping & Returns' }])}
      </div>
      <div class="static-content">
        <h1 class="heading-1" style="margin-bottom:var(--space-6);">Shipping & Returns</h1>

        <h2>Shipping</h2>
        <h3>Domestic Shipping (India)</h3>
        <p>Standard delivery: 5-7 business days. Free shipping on orders above ₹5,000. Express delivery available for an additional charge of ₹500 (2-3 business days).</p>

        <h3>Bulk / Corporate Orders</h3>
        <p>Shipping for bulk orders is calculated based on weight, volume, and destination. We use insured logistics partners for all corporate shipments. Delivery timelines are confirmed at the time of order placement.</p>

        <h3>International Shipping</h3>
        <p>We ship to over 40 countries. International shipping costs and delivery times vary by destination. Contact our sales team for a shipping quote.</p>

        <h2>Returns & Exchanges</h2>
        <h3>Standard Products</h3>
        <p>We accept returns within 7 days of delivery for unused products in original packaging. Return shipping costs are borne by the customer unless the product is defective.</p>

        <h3>Custom / Branded Products</h3>
        <p>Custom-branded products are made to your exact specifications and cannot be returned or exchanged. We send digital proofs for approval before production begins.</p>

        <h3>Defective Products</h3>
        <p>If you receive a defective product, please contact us within 48 hours of delivery with photos of the defect. We will arrange a replacement or full refund at no additional cost.</p>

        <h2>How to Initiate a Return</h2>
        <p>Email us at <strong>returns@vanidiaries.com</strong> with your order number and reason for return. Our team will process your request within 2 business days.</p>
      </div>
    </div>
  `;
}
