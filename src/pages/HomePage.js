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
const WHATSAPP_NUMBER = '919311135190';
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
        <span>WhatsApp Enquiry</span>
      </a>
      <section class="hero-section">
        <div class="hero-slider" id="hero-slider">
          <div class="hero-slide active" style="background-image:url('/images/banner2.jpg')"></div>
          <div class="hero-slide" style="background-image:url('/images/banner1.jpg')"></div>
          <div class="hero-slide" style="background-image:url('/images/banner3.jpg')"></div>
          <div class="hero-slide" style="background-image:url('/images/banner4.jpg')"></div>
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
                <a href="/shop?cat=${cat.slug}" class="ap-cat-card">
                  <div class="ap-cat-img-wrapper">
                    <img src="${cat.image_url || '/images/placeholder.jpg'}" alt="${cat.name}" loading="lazy" />
                  </div>
                  <div class="ap-cat-label">${cat.name}</div>
                </a>
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
