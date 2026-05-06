import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

const faqData = [
  { q: 'What is the minimum order quantity for bulk orders?', a: 'Our minimum order quantity varies by product. Most diaries and planners start at 25 units for corporate orders. For custom-branded products, the minimum is typically 50 units. Contact our sales team for specific product minimums.' },
  { q: 'What customization options are available?', a: 'We offer deep blind debossing, gold and silver foil stamping, custom end-papers, ribbon markers in brand colors, custom packaging, and bespoke page layouts. Our design team can work with your brand guidelines to create the perfect corporate gift.' },
  { q: 'What are the lead times for bulk orders?', a: 'Standard production takes 14-21 business days depending on customization complexity. Rush orders can be accommodated for an additional charge. We recommend placing orders at least 4 weeks before your required delivery date.' },
  { q: 'Do you ship outside India?', a: 'Yes, we ship internationally. We have secure, insured logistics networks capable of fulfilling international bulk orders to over 40 countries. Contact us for international shipping quotes.' },
  { q: 'Can I request a sample before placing a bulk order?', a: 'Absolutely. We provide sample kits for corporate customers evaluating our products. Sample kits include material swatches, paper quality samples, and a selection of our bestselling products. Request a catalog through our contact page.' },
  { q: 'What payment methods do you accept?', a: 'For retail orders, we accept all major credit/debit cards, UPI, net banking, and popular wallets. For bulk/corporate orders, we offer bank transfer, cheque, and credit terms for established accounts.' },
  { q: 'What is your return and exchange policy?', a: 'We accept returns within 7 days of delivery for unused products in original packaging. Custom-branded products cannot be returned. Please refer to our Shipping & Returns page for detailed terms.' },
  { q: 'Are your products eco-friendly?', a: 'We are committed to sustainability. Our paper is FSC-certified, we use vegetable-based inks, and our leather alternatives are derived from organic waste materials. Read more on our About page.' },
];

export function renderFaqPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'FAQ' }])}
      </div>
      <div class="static-hero">
        <div class="container">
          <h1>Frequently Asked Questions</h1>
          <p>Everything you need to know about our products, ordering, and services.</p>
        </div>
      </div>
      <div class="static-content">
        ${faqData.map((item, i) => `
          <div class="faq-item" id="faq-${i}">
            <button class="faq-question" data-faq="${i}">
              <span>${item.q}</span>
              <span class="material-symbols-outlined">expand_more</span>
            </button>
            <div class="faq-answer"><p>${item.a}</p></div>
          </div>
        `).join('')}

        <div style="text-align:center;margin-top:var(--space-12);padding:var(--space-8);background:var(--color-surface-alt);border-radius:var(--radius-lg);">
          <h3 class="heading-3" style="margin-bottom:var(--space-3);">Still have questions?</h3>
          <p class="text-body" style="margin-bottom:var(--space-6);">Our team is here to help.</p>
          <a href="/contact" class="btn btn--accent">Contact Us</a>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
}
