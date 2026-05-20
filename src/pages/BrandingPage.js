import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

const BRANDING_METHODS = [
  {
    icon: 'draw',
    title: 'Debossing / Embossing',
    desc: 'A die is pressed into the cover material to create a raised (embossed) or recessed (debossed) impression of your logo or company name. This method delivers a refined, tactile finish that looks premium and lasts the lifetime of the product.',
    best: 'Leather diaries, PU leather covers, executive folders',
    color: '#8B4513'
  },
  {
    icon: 'print',
    title: 'Screen Printing',
    desc: 'Ink is pushed through a mesh stencil onto the product surface. Ideal for bold, single or multi-color logos. Screen printing offers excellent color opacity and durability on flat surfaces.',
    best: 'Diary covers, t-shirts, carry bags, mouse pads',
    color: '#2E7D32'
  },
  {
    icon: 'stadia_controller',
    title: 'Hot Foil Stamping',
    desc: 'A heated die presses metallic or colored foil onto the surface, transferring a brilliant foil imprint. Available in gold, silver, copper, and custom colors. The most popular choice for corporate gifting.',
    best: 'Leather diaries, PU covers, certificate folders, wallets',
    color: '#C4956A'
  },
  {
    icon: 'full_coverage',
    title: 'UV Printing',
    desc: 'Ultra-violet cured ink is printed directly onto the product for full-color, photo-quality results. UV printing can reproduce gradients, fine details, and complex artwork with precision.',
    best: 'Diary covers, pens, water bottles, tech accessories',
    color: '#1565C0'
  },
  {
    icon: 'roller_shades',
    title: 'Laser Engraving',
    desc: 'A precision laser beam etches your design into the material surface. The result is a permanent, elegant mark with a natural tonal contrast. No inks or foils involved — just clean, permanent engraving.',
    best: 'Metal pens, wooden items, leather products, key chains',
    color: '#424242'
  },
  {
    icon: 'palette',
    title: 'Digital / Full Color Print',
    desc: 'Full-color digital printing for complex artwork, photographs, and gradient designs. Uses advanced inkjet or toner technology for vibrant, high-resolution output on compatible surfaces.',
    best: 'T-shirts, coffee mugs, notebooks, promotional items',
    color: '#E65100'
  },
  {
    icon: 'draft',
    title: 'Pad Printing',
    desc: 'A silicone pad transfers ink from an etched plate onto curved or irregular surfaces. Perfect for small logos and text on items that cannot be screen printed due to their shape.',
    best: 'Pens, pen stands, key chains, small promotional items',
    color: '#6A1B9A'
  },
  {
    icon: 'brush',
    title: 'Embroidery',
    desc: 'Your logo is stitched directly into fabric using high-thread-count embroidery machines. Delivers a premium, textured finish that elevates the perceived value of any textile product.',
    best: 'T-shirts, bags, caps, uniforms, corporate apparel',
    color: '#00838F'
  }
];

export function renderBrandingPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Branding' }])}
      </div>

      <div class="static-hero">
        <div class="container">
          <h1>Your Brand, Our Craft.</h1>
          <p>We offer a comprehensive range of branding and customization methods to ensure your company name, logo, and message are perfectly represented on every product.</p>
        </div>
      </div>

      <div class="static-content">
        <h2>Branding Methods We Offer</h2>
        <p>From classic debossing to full-color digital printing, we have the right technique to match your brand identity, budget, and timeline. Every method is executed in-house at our Delhi facility for quality control and fast turnaround.</p>

        <div class="branding-grid">
          ${BRANDING_METHODS.map(m => `
            <div class="branding-card">
              <div class="branding-card-icon" style="background:${m.color}15;color:${m.color};">
                <span class="material-symbols-outlined">${m.icon}</span>
              </div>
              <div class="branding-card-body">
                <h3>${m.title}</h3>
                <p>${m.desc}</p>
                <div class="branding-card-best">
                  <span class="material-symbols-outlined" style="font-size:14px;color:var(--color-accent);">check_circle</span>
                  <span><strong>Best for:</strong> ${m.best}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <h2>How It Works</h2>
        <div class="branding-steps">
          <div class="branding-step">
            <div class="branding-step-num">1</div>
            <h4>Share Your Artwork</h4>
            <p>Send us your logo, design, or text in AI, EPS, CDR, or high-resolution PNG format.</p>
          </div>
          <div class="branding-step">
            <div class="branding-step-num">2</div>
            <h4>We Recommend the Method</h4>
            <p>Our team selects the best branding technique based on your product, design complexity, and quantity.</p>
          </div>
          <div class="branding-step">
            <div class="branding-step-num">3</div>
            <h4>Sample Approval</h4>
            <p>We produce a sample for your review and approval before proceeding with the full production run.</p>
          </div>
          <div class="branding-step">
            <div class="branding-step-num">4</div>
            <h4>Production & Delivery</h4>
            <p>Your branded products are manufactured, quality-checked, and shipped to your doorstep across India.</p>
          </div>
        </div>

        <div class="branding-cta">
          <h2>Ready to Brand Your Products?</h2>
          <p>Get a custom quote for bulk branded products. Minimum order of 50 units applies for custom branding.</p>
          <div style="display:flex;gap:var(--space-4);flex-wrap:wrap;margin-top:var(--space-4);">
            <a href="/bulk-quote" class="btn btn--accent btn--lg">
              <span class="material-symbols-outlined" style="font-size:18px;">request_quote</span>
              Request a Quote
            </a>
            <a href="/contact" class="btn btn--secondary btn--lg">
              <span class="material-symbols-outlined" style="font-size:18px;">phone</span>
              Talk to Us
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}
