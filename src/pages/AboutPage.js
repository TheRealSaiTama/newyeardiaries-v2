import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderAboutPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'About Us' }])}
      </div>
      <div class="static-hero">
        <div class="container">
          <h1>The Art of Permanence.</h1>
          <p>Since 1998, we have been crafting premium stationery that stands the test of time. We believe in the power of putting pen to paper.</p>
        </div>
      </div>
      <div class="static-content">
        <h2>Our Heritage</h2>
        <p>Founded in a workshop in the heart of New Delhi, Vani Binders & Diaries began with a singular vision: to create objects that hold memory. In an increasingly digital world, the tangible weight of a well-crafted diary offers a necessary grounding.</p>
        <p>We source only the finest materials — acid-free paper, full-grain leathers, and robust binding threads. Every stage of our manufacturing process honors traditional bookbinding techniques while integrating precision modern tooling to ensure longevity.</p>

        <h2>Manufacturing Excellence</h2>
        <p>Our state-of-the-art facility in Okhla Industrial Estate produces over 500,000 diaries annually. We manage the entire production lifecycle from raw material sourcing to final packaging, ensuring unbeatable quality at manufacturer-direct pricing.</p>

        <h3>Sustainable Craft</h3>
        <p>Our commitment to the environment is as strong as our commitment to quality. We partner exclusively with paper mills that practice responsible forestry and utilize closed-loop water systems.</p>
        <a href="/contact" class="btn btn--accent" style="margin-top:var(--space-4);">Read Our Sustainability Report <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>

        <h2>Visit Our Facility</h2>
        <p>Experience the quality of our collections in person. Factory tours and consultations for bespoke orders are available by appointment.</p>
        <div class="card" style="margin-top:var(--space-4);">
          <div style="display:flex;align-items:flex-start;gap:var(--space-4);">
            <span class="material-symbols-outlined" style="color:var(--color-accent);font-size:24px;">location_on</span>
            <div>
              <strong>Vani Binders & Diaries</strong><br>
              <span class="text-body">Okhla Industrial Estate, Phase II<br>New Delhi, India 110020</span><br>
              <a href="/contact" class="auth-link" style="margin-top:var(--space-2);display:inline-block;">Schedule a Visit →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
