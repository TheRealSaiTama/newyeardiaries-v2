import { renderTrustBadges } from '../components/TrustBadges.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';

import { openQuickView } from '../components/QuickViewModal.js';
import { supabase } from '../lib/supabase.js';
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

  const { data: shopCategories } = await supabase
    .from('shop_categories')
    .select('*')
    .eq('active', true)
    .order('sort_order');

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page-content">
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

      ${renderAnnouncementMarquee(content.announcements || [])}

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
              ${(shopCategories || []).map(sc => `
                <div class="ap-cat-card-wrap">
                  <a href="${sc.link}" class="ap-cat-card">
                    <div class="ap-cat-img-wrapper">
                      <img src="${sc.image_url || '/images/placeholder.jpg'}" alt="${sc.title}" loading="lazy" />
                    </div>
                    <div class="ap-cat-label">${sc.title}</div>
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
  initProductCardSlideshows();
}

function renderAnnouncementMarquee(announcements) {
  if (!announcements.length) return '';
  const items = announcements.map(a =>
    `<span class="announcement-marquee-item">${a.link ? `<a href="${a.link}">${a.text}</a>` : a.text}</span>`
  ).join('<span class="announcement-marquee-dot">•</span>');
  return `
    <section class="announcement-marquee-section">
      <div class="announcement-marquee">
        <div class="announcement-marquee-track">
          ${items}
          <span class="announcement-marquee-dot">•</span>
          ${items}
        </div>
      </div>
    </section>
  `;
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

  // Initialize: first active, others ready from right
  slides.forEach((slide, i) => {
    slide.style.transition = 'none'; // avoid initial jump
    if (i === 0) {
      slide.classList.add('active');
      slide.style.transform = 'translateX(0)';
    } else {
      slide.style.transform = 'translateX(100%)';
    }
  });

  // Force reflow then restore transition
  requestAnimationFrame(() => {
    slides.forEach(s => s.style.transition = 'transform 2s ease');
  });

  setInterval(() => {
    const prevIndex = current;

    // Move current out to the left
    slides[prevIndex].classList.remove('active');
    slides[prevIndex].classList.add('prev');
    slides[prevIndex].style.transform = 'translateX(-100%)';

    // Next slide comes in from right
    current = (current + 1) % slides.length;
    slides[current].classList.remove('prev');
    slides[current].classList.add('active');
    slides[current].style.transform = 'translateX(0)';

    // Clean up after animation
    setTimeout(() => {
      slides[prevIndex].classList.remove('prev');
      slides[prevIndex].style.transform = 'translateX(100%)';
    }, 2000);
  }, 5000);
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
