import { renderTrustBadges } from '../components/TrustBadges.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';

import { openQuickView } from '../components/QuickViewModal.js';
import { supabase } from '../lib/supabase.js';
import { getContent, getHeroContent, getCtaContent, getTrustBadges, getHomepageSliders } from '../lib/content.js';
import { getProducts, getCategories, normalizeProduct } from '../lib/products.js';

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

  // Prefer DB-driven slider sections; fall back to the original category-based
  // queries if the table is empty / not migrated yet.
  const sliderConfigs = getHomepageSliders(content);

  let sliderLists;
  if (sliderConfigs.length > 0) {
    // Resolve each section's product IDs to full product objects
    const productIdSets = sliderConfigs.map(s => s.productIds);
    const allIds = [...new Set(productIdSets.flat())];
    let productMap = new Map();
    if (allIds.length > 0) {
      // Chunk to avoid 1000-row URL cap; 50 per chunk is safe
      const CHUNK = 50;
      const chunks = [];
      for (let i = 0; i < allIds.length; i += CHUNK) chunks.push(allIds.slice(i, i + CHUNK));
      const fetched = await Promise.all(
        chunks.map(ids => supabase
          .from('products')
          .select('*, category:categories!products_category_id_fkey(name)')
          .in('id', ids))
      );
      (fetched || []).forEach(({ data }) => {
        (data || []).forEach(p => productMap.set(p.id, normalizeProduct(p)));
      });
    }
    sliderLists = sliderConfigs.map(sec => {
      const products = sec.productIds.map(id => productMap.get(id)).filter(Boolean).slice(0, 10);
      return { ...sec, products };
    });
  } else {
    // FALLBACK: original category-based queries
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
    sliderLists = [
      { key: 'leather_diary_2026',  title: 'Leather Diary 2026',       view_all_link: '/shop?cat=leather-diaries',     bg: '#FAF8F5', products: leatherDiary2026 },
      { key: 'combo_gifts',         title: 'Latest Combo Gift Sets',   view_all_link: '/shop?cat=diary-with-pen-gift-set', bg: '#fff',    products: latestComboGiftSets },
      { key: 'trending',            title: 'Trending items',           view_all_link: '/shop',                        bg: '#FAF8F5', products: trendingItems },
      { key: 'best_selling_2026',   title: 'Best Selling 2026 Diary',  view_all_link: '/shop',                        bg: '#fff',    products: bestSelling2026Diary },
      { key: 'premium_diary_2026',  title: 'Premium diary 2026',       view_all_link: '/shop?cat=premium-diary',       bg: '#FAF8F5', products: premiumDiary2026 },
    ];
  }

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
          <button class="hero-arrow hero-arrow--prev" id="heroPrev" aria-label="Previous slide">&#8249;</button>
          <button class="hero-arrow hero-arrow--next" id="heroNext" aria-label="Next slide">&#8250;</button>
          <div class="hero-dots" id="heroDots"></div>
        </div>
      </section>

      ${renderAnnouncementMarquee(content.announcements || [])}

      <section class="section--sm">
        <div class="container">
          ${renderTrustBadges(getTrustBadges(content))}
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

      ${sliderLists.map((s, i) => renderProductSliderSection(s.title, s.key + '-slider', s.products, 's' + i, s.bg, s.view_all_link)).join('')}

      ${renderCtaSection(getCtaContent(content))}
    </div>
  `;

  initProductCardEvents();
  initHeroSlider();
  initProductCardSlideshows();

  // Cache the rendered HTML so re-navigating to / is instant. The router
  // re-runs __reinitPage when it paints from cache.
  try {
    const html = document.getElementById('app').innerHTML;
    if (html && html.length < 800_000) {
      const prefix = window.__nydPageCachePrefix || '__nyd_page_cache:';
      const path = window.location.pathname || '/';
      const search = window.location.search || '';
      sessionStorage.setItem(prefix + path + search, JSON.stringify({ html, t: Date.now() }));
    }
  } catch { /* quota or disabled — ignore */ }
}

// Re-initialise the homepage's interactive bits after a cache-paint.
// The router calls this via window.__reinitPage.
function reinitHomePage() {
  try { initProductCardEvents(); } catch (e) { console.warn('[home] product events init failed:', e); }
  try { initHeroSlider(); } catch (e) { console.warn('[home] hero init failed:', e); }
  try { initProductCardSlideshows(); } catch (e) { console.warn('[home] slideshow init failed:', e); }
}

// Register the reinit hook at module load so the router can find it on
// the first cache hit (before renderHomePage has run).
window.__reinitPage = reinitHomePage;
window.__reinitHomePage = reinitHomePage;

function renderAnnouncementMarquee(announcements) {
  if (!Array.isArray(announcements) || announcements.length === 0) return '';
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

function renderProductSliderSection(title, slug, products, idSuffix, bg, viewAllLink) {
  if (!products || !products.length) return '';
  const sliderId = `ap-slider-${idSuffix}`;
  const viewAllHref = viewAllLink || `/shop?cat=${slug}`;
  return `
    <section class="ap-catalogue-section" style="background: ${bg};">
      <div class="ap-catalogue-inner">
        <div class="ap-catalogue-header">
          <h2 class="ap-catalogue-title">${title}</h2>
          <a href="${viewAllHref}" class="ap-catalogue-viewall">View All →</a>
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
  const slider = document.getElementById('hero-slider');
  // Array.from() so .map/.filter always work (NodeList.map is not in every
  // browser — notably some embedded WebViews on Android).
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const dotsContainer = document.getElementById('heroDots');

  // Tear down any previous instance — store timer in a STABLE object so
  // resetTimer() mutates the same reference cleanup reads. (Old bug stored
  // the timer variable by value, so cleanup cleared a stale/initial ref
  // and intervals stacked up → glitch on re-navigation.)
  if (window.__heroSlider) {
    clearInterval(window.__heroSlider.timer);
    window.__heroSlider = null;
  }

  // Nothing to slide (0 or 1 slide) → hide nav, exit clean
  if (!slider || slides.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (dotsContainer) dotsContainer.style.display = 'none';
    return;
  }

  const SLIDE_MS = 5000;
  const TRANSITION_MS = 800;
  const state = { current: 0, timer: null, animating: false };

  // Build dots
  if (dotsContainer) {
    dotsContainer.style.display = '';
    dotsContainer.innerHTML = slides.map((_, i) =>
      `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="Go to slide ${i + 1}"></button>`
    ).join('');
  }

  // Init positions: slide 0 visible, rest off-screen right
  slides.forEach((slide, i) => {
    slide.style.transition = `transform ${TRANSITION_MS}ms ease`;
    slide.style.transform = i === 0 ? 'translateX(0)' : 'translateX(100%)';
    slide.classList.toggle('active', i === 0);
  });

  function goTo(nextIdx, direction) {
    if (state.animating || nextIdx === state.current) return;
    state.animating = true;

    const prev = state.current;
    const dir = direction || (nextIdx > state.current ? 1 : -1);
    const incoming = slides[nextIdx];

    // Snap incoming to the side it enters from (no transition)
    incoming.style.transition = 'none';
    incoming.style.transform = dir > 0 ? 'translateX(100%)' : 'translateX(-100%)';
    void incoming.offsetWidth; // force reflow so the snap applies

    // Animate: incoming slides in, outgoing slides out
    incoming.style.transition = `transform ${TRANSITION_MS}ms ease`;
    slides[prev].classList.remove('active');
    slides[prev].style.transform = dir > 0 ? 'translateX(-100%)' : 'translateX(100%)';
    incoming.classList.add('active');
    incoming.style.transform = 'translateX(0)';

    document.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === nextIdx);
    });

    state.current = nextIdx;
    setTimeout(() => { state.animating = false; }, TRANSITION_MS + 20);
    resetTimer();
  }

  const next = () => goTo((state.current + 1) % slides.length, 1);
  const prev = () => goTo((state.current - 1 + slides.length) % slides.length, -1);

  function resetTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(next, SLIDE_MS);
    // Tiny console signal so it's obvious auto-slide is running.
    // (Comment out if too chatty.)
    if (!window.__heroSliderLogged) {
      window.__heroSliderLogged = true;
      console.log('[hero] auto-slide started,', slides.length, 'slides @', SLIDE_MS, 'ms');
    }
  }

  function stopTimer() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  // Wire manual controls
  if (prevBtn) {
    prevBtn.style.display = '';
    prevBtn.onclick = prev;
  }
  if (nextBtn) {
    nextBtn.style.display = '';
    nextBtn.onclick = next;
  }
  document.querySelectorAll('.hero-dot').forEach(d => {
    d.onclick = () => goTo(parseInt(d.dataset.idx));
  });

  // Pause auto-slide on hover/touch (resume on leave) — better UX
  slider.addEventListener('mouseenter', stopTimer);
  slider.addEventListener('mouseleave', resetTimer);

  resetTimer();

  // Stable handle: cleanup reads state.timer (live), not a snapshot
  window.__heroSlider = state;
}

function initProductCardEvents() {
  document.getElementById('apCatLeft')?.addEventListener('click', () => apCatScroll('apCatGrid', -1));
  document.getElementById('apCatRight')?.addEventListener('click', () => apCatScroll('apCatGrid', 1));

  document.querySelectorAll('.ap-product-slider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      apCatScroll(btn.dataset.slider, parseInt(btn.dataset.dir));
    });
  });

  // Keep catalogue slider arrow enabled/disabled state in sync with scroll.
  document.querySelectorAll('.ap-catalogue-section .ap-cat-grid').forEach(grid => {
    grid.addEventListener('scroll', () => requestAnimationFrame(syncSliderArrows), { passive: true });
  });
  // Initial sync after layout settles.
  requestAnimationFrame(() => requestAnimationFrame(syncSliderArrows));
}

function apCatScroll(gridId, dir) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const cards = grid.children;
  if (!cards.length) return;
  // Scroll by ~5 cards worth (the visible viewport) so the user advances a
  // full "page" of the slider. Fall back to 2 cards if width measurement
  // isn't ready yet.
  const cardW = (cards[0].offsetWidth || 200) + 20;
  const visible = Math.max(2, Math.floor(grid.clientWidth / cardW));
  grid.scrollBy({ left: dir * cardW * visible, behavior: 'smooth' });
}

// Sync prev/next arrow disabled state with current scroll position. Called
// on init and on the strip's scroll event.
function syncSliderArrows() {
  document.querySelectorAll('.ap-catalogue-section').forEach(sec => {
    const grid = sec.querySelector('.ap-cat-grid');
    if (!grid) return;
    const left = sec.querySelector('.ap-cat-arrow--left');
    const right = sec.querySelector('.ap-cat-arrow--right');
    const max = grid.scrollWidth - grid.clientWidth - 1;
    if (left) left.classList.toggle('is-disabled', grid.scrollLeft <= 0);
    if (right) right.classList.toggle('is-disabled', grid.scrollLeft >= max);
  });
}

function renderCtaSection(cta) {
  const title    = cta?.title    || 'Ready for Corporate Orders?';
  const subtitle = cta?.subtitle || 'Get manufacturer-direct pricing on bulk orders of 25+ units. Custom branding with debossing, foil stamping, and bespoke packaging.';
  const ctaText  = cta?.cta_text || 'Contact Us';
  const ctaLink  = cta?.cta_link || '/contact';

  return `
      <section class="section">
        <div class="container" style="text-align:center;">
          <h2 class="heading-2" style="margin-bottom:var(--space-4);">${title}</h2>
          <p class="text-body" style="max-width:500px;margin:0 auto var(--space-8);font-size:var(--fs-md);">${subtitle}</p>
          <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
            <a href="${ctaLink}" class="btn btn--accent btn--lg">${ctaText}</a>
          </div>
        </div>
      </section>
  `;
}
