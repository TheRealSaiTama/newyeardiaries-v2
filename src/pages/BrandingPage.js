import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

const BRANDING_METHODS = [
  {
    icon: 'texture',
    title: 'Thermal Logo Debossing',
    blurb: 'Blind debossing — unobtrusive & tactile.',
    desc: 'Debossing or blind debossing is and will continue to be the undisputed favourite among the logo debossings. It is charmingly unobtrusive, of high quality and pleasant to the touch. Sometimes less is just exactly the right thing. High-quality brass debossing stamps are created for every debossing.',
    color: '#8B4513',
    image: '/images/branding/thermal-debossing.jpg'
  },
  {
    icon: 'palette',
    title: 'Colour Debossing',
    blurb: 'Debossing with a transferred coloured foil.',
    desc: 'A colour debossing functions in a similar way to a blind debossing. The only difference: between the debossing stamp and the book there is a thin coloured foil that is transferred to the cover. We work together with the leading manufacturers of debossing foils that offer a rich choice of colours.',
    color: '#6A1B9A',
    image: '/images/branding/colour-debossing.jpg'
  },
  {
    icon: 'auto_awesome',
    title: 'Metallic Debossing',
    blurb: 'Hot foil embossing in gold or silver.',
    desc: 'Metallic debossing — also called hot foil embossing in gold or silver — uses a heated debossing stamp pressed onto a metallic foil that loosens through the heat and is transferred onto the cover. The motif lies deeper, as with all debossings, forming a beautiful touch with a perfect metallic shine.',
    color: '#B8862F',
    image: '/images/branding/metallic-debossing.jpg'
  },
  {
    icon: 'content_cut',
    title: 'Laser Cut / Punching',
    blurb: 'Digitally controlled precision cutting.',
    desc: 'A good alternative to stamping is the laser cut — a digitally controlled cutting technique. Compared to stamping, the laser cut can realise considerably more delicate motifs, stencil lettering or even grid images. The cover becomes exciting through the interaction of the underlying end leaves, which can be printed in full colour or with a motif. Good to know: with every additional cut, the stability of the cover decreases.',
    color: '#37474F',
    image: '/images/branding/laser-cut.jpg'
  },
  {
    icon: 'lock',
    title: 'Magnetic Flap',
    blurb: 'Metal clasps in various shapes & colours.',
    desc: 'All types of clasps made in metal, available in various shapes, sizes and colours to showcase your company logo.',
    color: '#455A64',
    image: '/images/branding/magnetic-flap.jpg'
  }
];

const HOW_STEPS = [
  { num: 1, title: 'Share Your Artwork', desc: 'Send us your logo, design, or text in AI, EPS, CDR, or high-resolution PNG format.' },
  { num: 2, title: 'We Recommend the Method', desc: 'Our team selects the best branding technique based on your product, design complexity, and quantity.' },
  { num: 3, title: 'Sample Approval', desc: 'We produce a sample for your review and approval before proceeding with the full production run.' },
  { num: 4, title: 'Production & Delivery', desc: 'Your branded products are manufactured, quality-checked, and shipped to your doorstep across India.' }
];

export function renderBrandingPage() {
  document.getElementById('app').innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Branding' }])}
      </div>

      <section class="b-hero">
        <div class="container b-hero__inner">
          <span class="b-hero__eyebrow b-anim" style="--d:0s">Custom Branding Studio</span>
          <h1 class="b-anim" style="--d:.15s">Your Brand,<br>Our Craft.</h1>
          <p class="b-anim" style="--d:.3s">From classic debossing to full-colour digital printing, every branding method is executed in-house at our Delhi facility — for quality you can see and feel.</p>
        </div>
      </section>

      <section class="b-methods">
        <div class="container">
          <div class="b-methods__header b-reveal">
            <div>
              <span class="b-head__eyebrow">WHAT WE OFFER</span>
              <h2 class="b-methods__title">Discover Our Main Branding Services</h2>
            </div>
            <a href="/contact" class="b-methods__btn">
              Consult Expert <span class="material-symbols-outlined" style="font-size:18px">arrow_outward</span>
            </a>
          </div>

          <div class="b-note b-reveal">
            <span class="material-symbols-outlined">info</span>
            <p><strong>Please note:</strong> All trademarks, logos and brand names are the property of their respective owners. All company, product and service names used on this website are for identification purposes only. Use of these names, trademarks and brands does not imply endorsement.</p>
          </div>

          <div class="b-bento-grid">
            <!-- Card 1: Featured / Large Bento Card -->
            <div class="b-bento-card b-bento-card--featured b-reveal">
              <img class="b-bento-card__img" src="/images/branding/thermal-debossing.jpg" alt="Thermal Logo Debossing">
              <div class="b-bento-card__overlay"></div>
              <div class="b-bento-card__top">
                <span class="b-bento-card__pill">Blind Debossing</span>
                <span class="b-bento-card__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
              </div>
              <div class="b-bento-card__content">
                <h3>Thermal Logo Debossing</h3>
                <p>The undisputed favourite among logo debossings. Charming, unobtrusive, high quality and pleasant to the touch. High-quality brass stamps created for precision.</p>
              </div>
            </div>

            <!-- Card 2: Colour Debossing -->
            <div class="b-bento-card b-reveal" data-delay="100">
              <img class="b-bento-card__img" src="/images/branding/colour-debossing.jpg" alt="Colour Debossing">
              <div class="b-bento-card__overlay"></div>
              <div class="b-bento-card__top">
                <span class="b-bento-card__pill">Colour Foil</span>
                <span class="b-bento-card__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
              </div>
              <div class="b-bento-card__content">
                <h3>Colour Debossing</h3>
                <p>Transfers coloured foil into debossed contours for a vibrant, rich accent.</p>
              </div>
            </div>

            <!-- Card 3: Metallic Debossing -->
            <div class="b-bento-card b-reveal" data-delay="150">
              <img class="b-bento-card__img" src="/images/branding/metallic-debossing.jpg" alt="Metallic Debossing">
              <div class="b-bento-card__overlay"></div>
              <div class="b-bento-card__top">
                <span class="b-bento-card__pill">Gold & Silver Hot Foil</span>
                <span class="b-bento-card__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
              </div>
              <div class="b-bento-card__content">
                <h3>Metallic Debossing</h3>
                <p>Hot foil embossing forming a luxury touch with perfect metallic shine.</p>
              </div>
            </div>

            <!-- Card 4: Laser Cut / Punching -->
            <div class="b-bento-card b-reveal" data-delay="200">
              <img class="b-bento-card__img" src="/images/branding/laser-cut.jpg" alt="Laser Cut / Punching">
              <div class="b-bento-card__overlay"></div>
              <div class="b-bento-card__top">
                <span class="b-bento-card__pill">Precision Cut</span>
                <span class="b-bento-card__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
              </div>
              <div class="b-bento-card__content">
                <h3>Laser Cut / Punching</h3>
                <p>Digitally controlled precision cutting for delicate motifs and stencil lettering.</p>
              </div>
            </div>

            <!-- Card 5: Magnetic Flap -->
            <div class="b-bento-card b-reveal" data-delay="250">
              <img class="b-bento-card__img" src="/images/branding/magnetic-flap.jpg" alt="Magnetic Flap">
              <div class="b-bento-card__overlay"></div>
              <div class="b-bento-card__top">
                <span class="b-bento-card__pill">Metal Clasps</span>
                <span class="b-bento-card__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
              </div>
              <div class="b-bento-card__content">
                <h3>Magnetic Flap & Clasps</h3>
                <p>Metal clasps in various shapes, sizes, and colours to showcase your company logo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="b-process-section" id="b-how">
        <div class="container">
          <div class="b-process-card b-reveal">
            <div class="b-process-header">
              <div class="b-process-header__left">
                <span class="b-head__eyebrow">THE PROCESS</span>
                <h2>How Our Ordering Process Works</h2>
                <p>Transform digital designs into premium products through our professional four-step system.</p>
              </div>
              <a href="/contact" class="b-process-header__btn">
                Learn More <span class="material-symbols-outlined" style="font-size:18px">arrow_outward</span>
              </a>
            </div>

            <div class="b-process-grid">
              <div class="b-process-step b-process-step--active">
                <div class="b-process-step__top">
                  <span class="b-process-step__num">01</span>
                  <span class="b-process-step__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
                </div>
                <h3>Share Your Artwork</h3>
                <p>Upload your high-resolution files and select premium materials through our interface.</p>
              </div>

              <div class="b-process-step">
                <div class="b-process-step__top">
                  <span class="b-process-step__num">02</span>
                  <span class="b-process-step__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
                </div>
                <h3>We Recommend Method</h3>
                <p>Our team selects the best branding technique based on your product, design complexity, and quantity.</p>
              </div>

              <div class="b-process-step">
                <div class="b-process-step__top">
                  <span class="b-process-step__num">03</span>
                  <span class="b-process-step__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
                </div>
                <h3>Sample Approval</h3>
                <p>We produce a sample for your review and approval before proceeding with full production run.</p>
              </div>

              <div class="b-process-step">
                <div class="b-process-step__top">
                  <span class="b-process-step__num">04</span>
                  <span class="b-process-step__arrow"><span class="material-symbols-outlined">arrow_outward</span></span>
                </div>
                <h3>Secure Delivery</h3>
                <p>Every order is rigorously inspected and securely packaged for a safe arrival across India.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="b-cta">
        <div class="container">
          <div class="b-cta__inner b-reveal">
            <div class="b-cta__text">
              <span class="b-cta__eyebrow">Ready to brand?</span>
              <h2>Let's put your logo on something worth keeping.</h2>
              <p>Browse our catalogue of diaries, planners, and corporate gifts — then tell us how you'd like them branded.</p>
              <div class="b-cta__btns">
                <a href="/shop" class="btn btn--primary btn--lg">
                  <span class="material-symbols-outlined" style="font-size:20px">storefront</span>
                  Explore Products
                </a>
                <a href="/contact" class="btn btn--secondary btn--lg">
                  <span class="material-symbols-outlined" style="font-size:20px">forum</span>
                  Talk to Us
                </a>
              </div>
            </div>
            <div class="b-cta__media">
              <img class="b-cta__media-img" src="/images/branding/cta-diary-handoff.png" alt="Premium branded diary handoff" loading="lazy">
              <span class="b-cta__chip"><span class="material-symbols-outlined">verified</span> In-house production</span>
              <span class="b-cta__chip b-cta__chip--2"><span class="material-symbols-outlined">factory</span> Delhi facility</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  setupBrandingInteractions();
}

function setupBrandingInteractions() {
  if (window.__bHowCleanup) {
    window.__bHowCleanup();
    window.__bHowCleanup = null;
  }

  // ===== Fade-in on scroll (IntersectionObserver) =====
  const revealEls = document.querySelectorAll('.b-reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0');
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  const tiles = document.querySelectorAll('.b-tile');
  const howSection = document.querySelector('.b-how');
  const howTiles = document.querySelectorAll('.b-how__tile');

  if (window.matchMedia('(hover: none)').matches) {
    tiles.forEach(t => {
      t.addEventListener('click', () => t.classList.toggle('is-open'));
    });
  }

  if (howSection && howTiles.length) {
    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = howSection.getBoundingClientRect();
      const winH = window.innerHeight;
      const start = winH * 0.72;
      const end = winH * 0.38;
      const range = start - end;
      const passed = start - rect.top;
      let progress = range > 0 ? passed / range : 0;
      progress = Math.max(0, Math.min(1, progress));

      const count = howTiles.length;
      const activeCount = Math.round(progress * count);
      howTiles.forEach((tile, i) => {
        tile.classList.toggle('is-active', i < activeCount);
        tile.classList.toggle('is-current', i === activeCount - 1 && progress < 0.98);
      });
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    window.__bHowCleanup = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }
}
