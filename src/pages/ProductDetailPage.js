import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderTrustBadges } from '../components/TrustBadges.js';
import { renderProductCard } from '../components/ProductCard.js';
import { renderPDPSkeleton } from '../components/Skeleton.js';
import { getProductBySlug, getProducts, formatPrice } from '../data/products.js';
import { addToQuoteList, addToCart } from '../data/store.js';

function renderProductMedia(src, alt) {
  if (!src) return `<span class="placeholder-icon material-symbols-outlined">menu_book</span>`;
  if (src.includes('video/mp4') || src.toLowerCase().split('?')[0].endsWith('.mp4')) {
    return `<video src="${src}" controls muted playsinline></video>`;
  }
  return `<img src="${src}" alt="${alt}">`;
}

function renderProductThumb(src, alt) {
  if (src.includes('video/mp4') || src.toLowerCase().split('?')[0].endsWith('.mp4')) {
    return `<video src="${src}" muted playsinline></video>`;
  }
  return `<img src="${src}" alt="${alt}">`;
}

export async function renderProductDetailPage(params) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-content"><div class="container section">${renderPDPSkeleton()}</div></div>`;

  const [product, allProducts] = await Promise.all([
    getProductBySlug(params.slug),
    getProducts(),
  ]);

  if (!product) {
    app.innerHTML = `<div class="container section" style="text-align:center;padding:var(--space-24) 0;"><h1 class="heading-2">Product Not Found</h1><p class="text-body" style="margin:var(--space-4) 0;">The product you're looking for doesn't exist.</p><a href="/shop" class="btn btn--accent">Browse Collection</a></div>`;
    return;
  }

  const related = allProducts.filter(p => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 3);

  app.innerHTML = `
    <div class="page-content">
      <div class="container section">
        ${renderBreadcrumbs([
          { label: 'Home', path: '/' },
          { label: product.category || 'Shop', path: '/shop' },
          { label: product.title },
        ])}

          <div class="pdp-layout">
          <div class="pdp-gallery">
            <div class="pdp-main-image" data-images='${JSON.stringify(product.images)}' data-alt="${product.title.replace(/'/g, "&#39;")}" data-current="0">
              <div class="pdp-slide pdp-slide--active">${renderProductMedia(product.image, product.title)}</div>
            </div>
            <div class="pdp-thumbnails">
              ${product.images.slice(0, 8).map((img, i) => `
                <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                  ${renderProductThumb(img, product.title)}
                </div>
              `).join('') || Array(4).fill('').map((_, i) => `
                <div class="pdp-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                  <span class="material-symbols-outlined" style="font-size:20px;color:var(--color-accent);opacity:0.4;">menu_book</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="pdp-info">
            <div class="label">${product.category} ${product.sku ? '• ' + product.sku : ''}</div>
            <h1 class="pdp-title">${product.title}</h1>
            <div class="pdp-price">
              ${formatPrice(product.price)}
              ${product.originalPrice ? `<span style="font-size:var(--fs-md);color:var(--color-text-tertiary);text-decoration:line-through;margin-left:var(--space-3);">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>
            <p class="pdp-description">${product.description}</p>
            ${product.longDescription && product.longDescription !== product.description ? `<p class="pdp-description">${product.longDescription}</p>` : ''}

            <div style="font-size:var(--fs-sm);color:var(--color-text-secondary);">
              ${product.material ? `<strong>Material:</strong> ${product.material} &nbsp;|&nbsp;` : ''}
              ${product.size ? `<strong>Size:</strong> ${product.size} &nbsp;|&nbsp;` : ''}
              ${product.pages ? `<strong>Pages:</strong> ${product.pages}` : ''}
            </div>

            ${product.colors?.length ? `
              <div>
                <div style="font-size:var(--fs-sm);font-weight:var(--fw-semibold);margin-bottom:var(--space-2);">Available Colors</div>
                <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
                  ${product.colors.map(c => `<span class="badge">${c}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            ${product.features?.length ? `
              <div class="pdp-features">
                <h3 class="heading-4">Features</h3>
                ${product.features.map(f => `
                  <div class="pdp-feature">
                    <span class="material-symbols-outlined">check_circle</span>
                    <div><h4>${f.title || f}</h4><p>${f.desc || ''}</p></div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="pdp-actions">
              <div class="pdp-qty-wrap">
                <label style="font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--color-text-secondary);margin-bottom:var(--space-2);display:block;">Quantity</label>
                <div class="qty-stepper">
                  <button class="qty-step-btn" id="qty-minus" aria-label="Decrease">−</button>
                  <input type="number" class="qty-step-input" id="pdp-qty" value="${product.minBulkOrder}" min="${product.minBulkOrder}" step="1">
                  <button class="qty-step-btn" id="qty-plus" aria-label="Increase">+</button>
                </div>
                <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);">Min. order: ${product.minBulkOrder} units</div>
              </div>
              <div class="pdp-actions-btns">
                <button class="btn btn--accent btn--lg" id="pdp-add-quote">
                  <span class="material-symbols-outlined" style="font-size:18px;">request_quote</span>
                  Add to Quote List
                </button>
                <button class="btn btn--secondary btn--lg" id="pdp-add-cart">
                  <span class="material-symbols-outlined" style="font-size:18px;">shopping_bag</span>
                  Add to Cart
                </button>
              </div>
            </div>

            <div style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin-top:var(--space-2);">
              Min. bulk order: ${product.minBulkOrder} units &nbsp;•&nbsp; <a href="/bulk-quote" style="color:var(--color-accent);font-weight:var(--fw-medium);">Request custom pricing →</a>
            </div>
          </div>
        </div>

        ${renderTrustBadges()}
      </div>

      ${related.length ? `
        <section class="section" style="background:var(--color-surface-alt);">
          <div class="container">
            <h2 class="heading-3" style="margin-bottom:var(--space-6);">You May Also Like</h2>
            <div class="product-grid">
              ${related.map(p => renderProductCard(p)).join('')}
            </div>
          </div>
        </section>
      ` : ''}
    </div>
  `;

  document.getElementById('pdp-add-quote')?.addEventListener('click', () => addToQuoteList(product.id, pdpMOQ));
  document.getElementById('pdp-add-cart')?.addEventListener('click', () => addToCart(product.id, pdpMOQ));

  let pdpMOQ = product.minBulkOrder;
  const qtyInput = document.getElementById('pdp-qty');
  const minusBtn = document.getElementById('qty-minus');
  const plusBtn = document.getElementById('qty-plus');

  function clampQty(val) {
    return Math.max(pdpMOQ, val);
  }

  minusBtn?.addEventListener('click', () => {
    const current = parseInt(qtyInput.value) || pdpMOQ;
    qtyInput.value = clampQty(current - 1);
  });
  plusBtn?.addEventListener('click', () => {
    const current = parseInt(qtyInput.value) || pdpMOQ;
    qtyInput.value = current + 1;
  });
  qtyInput?.addEventListener('change', () => {
    qtyInput.value = clampQty(parseInt(qtyInput.value) || pdpMOQ);
  });
  qtyInput?.addEventListener('input', () => {
    pdpMOQ = clampQty(parseInt(qtyInput.value) || product.minBulkOrder);
  });

  const mainImageEl = document.querySelector('.pdp-main-image');
  const thumbs = document.querySelectorAll('.pdp-thumb');
  const images = product.images;
  let currentIdx = 0;
  let slideshowInterval = null;
  let slideshowActive = false;

  function switchImage(idx) {
    if (idx < 0 || idx >= images.length || idx === currentIdx) return;
    const currentSlide = mainImageEl.querySelector('.pdp-slide--active');
    const src = images[idx];
    const alt = mainImageEl.dataset.alt;
    const isVideo = src && (src.includes('video/mp4') || src.toLowerCase().split('?')[0].endsWith('.mp4'));
    const media = isVideo
      ? `<video src="${src}" controls muted playsinline></video>`
      : `<img src="${src}" alt="${alt}">`;

    const nextSlide = document.createElement('div');
    nextSlide.className = 'pdp-slide pdp-slide--next';
    nextSlide.innerHTML = media;
    mainImageEl.appendChild(nextSlide);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextSlide.classList.remove('pdp-slide--next');
        nextSlide.classList.add('pdp-slide--active');
        if (currentSlide) {
          currentSlide.classList.remove('pdp-slide--active');
          currentSlide.classList.add('pdp-slide--prev');
        }
        setTimeout(() => currentSlide?.remove(), 400);
      });
    });

    thumbs.forEach(t => t.classList.toggle('active', parseInt(t.dataset.index) === idx));
    currentIdx = idx;
  }

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index);
      switchImage(idx);
    });
  });

  if (images.length > 1) {
    mainImageEl.addEventListener('mouseenter', () => {
      slideshowActive = true;
      slideshowInterval = setInterval(() => {
        if (!slideshowActive) return;
        const nextIdx = (currentIdx + 1) % images.length;
        switchImage(nextIdx);
      }, 1500);
    });

    mainImageEl.addEventListener('mouseleave', () => {
      slideshowActive = false;
      clearInterval(slideshowInterval);
      slideshowInterval = null;
      switchImage(0);
    });
  }
}
