import { renderTrustBadges } from '../components/TrustBadges.js';
import { renderProductCard } from '../components/ProductCard.js';
import { addToQuoteList } from '../data/store.js';
import { openQuickView } from '../components/QuickViewModal.js';
import { getContent, getHeroContent } from '../lib/content.js';
import { getProducts, getCategories } from '../lib/products.js';

const SECTION_CATS = {
  leather: 'leather-diary',
  combo: 'diary-with-pen-gift-set',
  premium: 'premium-diary',
};
const WHATSAPP_NUMBER = '919899223130';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi New Year Diaries, I want to enquire about diaries and corporate gifting.');

export async function renderHomePage() {
  const [content, allCategories] = await Promise.all([
    getContent(),
    getCategories(),
  ]);

  const catMap = Object.fromEntries(allCategories.map(c => [c.slug, c]));

  const [
    leatherDiary2026,
    latestComboGiftSets,
    trendingItems,
    artCoverDiaries2026,
    bestSelling2026Diary,
    premiumDiary2026,
  ] = await Promise.all([
    getProducts({ categoryId: catMap[SECTION_CATS.leather]?.id, limit: 8 }),
    getProducts({ categoryId: catMap[SECTION_CATS.combo]?.id, limit: 8 }),
    getProducts({ limit: 6 }),
    getProducts({ categoryId: catMap[SECTION_CATS.premium]?.id, limit: 8 }),
    getProducts({ limit: 6 }),
    getProducts({ categoryId: catMap[SECTION_CATS.premium]?.id, limit: 8 }),
  ]);

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page-content">
      <a class="home-whatsapp-btn" href="https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}" target="_blank" rel="noopener" aria-label="Enquire on WhatsApp">
        <span class="whatsapp-icon">
          <svg viewBox="0 0 32 32"><path d="M16.033 0a15.938 15.938 0 0 0-13.8 23.945L0 31.989l8.225-2.156A15.93 15.93 0 0 0 16.033 31.99c8.8 0 15.967-7.16 15.967-15.967S24.832 0 16.033 0zm0 29.317c-2.482 0-4.914-.633-7.06-1.831l-.506-.283-5.244 1.374 1.398-5.118-.311-.495A13.262 13.262 0 0 1 2.766 16.02c0-7.323 5.96-13.292 13.268-13.292 7.323 0 13.292 5.969 13.292 13.292s-5.969 13.297-13.293 13.297zm7.262-9.923c-.398-.2-2.355-1.164-2.72-1.298-.364-.132-.63-.2-.895.198-.266.398-1.028 1.298-1.26 1.564-.233.265-.465.298-.863.1-2.223-1.116-3.805-2.261-5.187-4.577-.266-.447.264-.413.644-1.178.132-.265.066-.497-.033-.695-.1-.2-1.026-2.484-1.358-3.361-.413-1.089-.824-.942-1.125-.961-.266-.015-.565-.015-.863-.015-.298 0-.796.116-1.212.646-.414.53-1.593 1.558-1.593 3.797 0 2.239 1.625 4.402 1.858 4.667.232.265 3.178 4.846 7.697 6.793 1.077.464 1.916.742 2.571.95 1.082.343 2.066.294 2.842.178.868-.13 2.355-.96 2.688-1.888.332-.928.332-1.722.232-1.888-.1-.166-.364-.265-.762-.464z"/></svg>
        </span>
        <span class="whatsapp-label">WhatsApp Enquiry</span>
      </a>
      <section class="hero-section">
        <div class="hero-slider" id="hero-slider">
          ${(content.banners && content.banners.length > 0) ? content.banners.map((b, i) => `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image:url('${b.image_url}')">
              ${(b.title || b.subtitle || b.cta_text) ? `
              <div class="hero-slide-content" style="position:absolute; bottom:20%; left:10%; color:#fff; background:rgba(0,0,0,0.5); padding:2rem; border-radius:8px;">
                ${b.title ? `<h2 style="font-size:2rem; margin-bottom:0.5rem;">${b.title}</h2>` : ''}
                ${b.subtitle ? `<p style="font-size:1.2rem; margin-bottom:1rem;">${b.subtitle}</p>` : ''}
                ${b.cta_text ? `<a href="${b.cta_link || '/shop'}" class="btn btn--primary">${b.cta_text}</a>` : ''}
              </div>
              ` : ''}
            </div>
          `).join('') : `
          <div class="hero-slide active" style="background-image:url('/images/banner2.jpg')"></div>
          <div class="hero-slide" style="background-image:url('/images/banner1.jpg')"></div>
          <div class="hero-slide" style="background-image:url('/images/banner3.jpg')"></div>
          <div class="hero-slide" style="background-image:url('/images/banner4.jpg')"></div>
          `}
        </div>
      </section>

      <section class="section--sm">
        <div class="container">
          ${renderTrustBadges()}
        </div>
      </section>

      <section class="ap-cat-section">
        <div class="ap-cat-inner">
          <div class="ap-cat-header">
            <h2 class="ap-cat-heading">SHOP BY CATEGORY</h2>
          </div>
          <div class="ap-cat-wrapper">
            <div class="ap-cat-grid" id="apCatGrid">
              ${allCategories.map(cat => `
                <div class="ap-cat-card-wrap">
                  <a href="/shop?cat=${cat.slug}" class="ap-cat-card">
                    <div class="ap-cat-img-wrapper">
                      <img src="${cat.image_url || '/images/placeholder.jpg'}" alt="${cat.name}" loading="lazy" />
                    </div>
                    <div class="ap-cat-label">${cat.name}</div>
                  </a>
                </div>
              `).join('')}
            </div>
            <button class="ap-cat-arrow ap-cat-arrow--left" id="apCatLeft">&#8249;</button>
            <button class="ap-cat-arrow ap-cat-arrow--right" id="apCatRight">&#8250;</button>
          </div>
        </div>
      </section>

      ${renderProductSliderSection('Leather Diary 2026', 'leather-diaries', leatherDiary2026, 'leather', '#FAF8F5')}
      ${renderProductSliderSection('Latest Combo Gift Sets', 'combo-gifts', latestComboGiftSets, 'combo', '#fff')}
      ${renderProductSliderSection('Trending items', 'trending', trendingItems, 'trending', '#FAF8F5')}
      ${renderProductSliderSection('Best Selling 2026 Diary', 'best-selling', bestSelling2026Diary, 'bestselling', '#fff')}
      ${renderProductSliderSection('Premium diary 2026', 'premium-diary', premiumDiary2026, 'premium', '#FAF8F5')}

      <section class="section">
        <div class="container" style="text-align:center;">
          <h2 class="heading-2" style="margin-bottom:var(--space-4);">Ready for Corporate Orders?</h2>
          <p class="text-body" style="max-width:500px;margin:0 auto var(--space-8);font-size:var(--fs-md);">
            Get manufacturer-direct pricing on bulk orders of 25+ units. Custom branding with debossing, foil stamping, and bespoke packaging.
          </p>
          <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
            <a href="/bulk-quote" class="btn btn--accent btn--lg">Request a Bulk Quote</a>
            <a href="/contact" class="btn btn--secondary btn--lg">Contact Sales Team</a>
          </div>
        </div>
      </section>
    </div>
  `;

  initProductCardEvents();
  initHeroSlider();
}

function renderProductSliderSection(title, slug, products, idSuffix, bg) {
  if (!products || !products.length) return '';
  const sliderId = `ap-slider-${idSuffix}`;
  return `
    <section class="ap-catalogue-section" style="background: ${bg};">
      <div class="ap-catalogue-inner">
        <div class="ap-catalogue-header">
          <h2 class="ap-catalogue-title">${title}</h2>
          <a href="/shop?cat=${slug}" class="ap-catalogue-viewall">View All →</a>
        </div>
        <div class="ap-cat-wrapper">
          <div class="ap-cat-grid" id="${sliderId}">
            ${products.map(p => renderProductCard(p)).join('')}
          </div>
          <button class="ap-cat-arrow ap-cat-arrow--left ap-product-slider-btn" data-slider="${sliderId}" data-dir="-1">&#8249;</button>
          <button class="ap-cat-arrow ap-cat-arrow--right ap-product-slider-btn" data-slider="${sliderId}" data-dir="1">&#8250;</button>
        </div>
      </div>
    </section>
  `;
}

function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4000);
}

function initProductCardEvents() {
  document.getElementById('apCatLeft')?.addEventListener('click', () => apCatScroll('apCatGrid', -1));
  document.getElementById('apCatRight')?.addEventListener('click', () => apCatScroll('apCatGrid', 1));

  document.querySelectorAll('.ap-product-slider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      apCatScroll(btn.dataset.slider, parseInt(btn.dataset.dir));
    });
  });
}

function apCatScroll(gridId, dir) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const cards = grid.children;
  if (!cards.length) return;
  const cardWidth = cards[0].offsetWidth + 16;
  grid.scrollBy({ left: dir * cardWidth * 2, behavior: 'smooth' });
}
