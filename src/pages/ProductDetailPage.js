import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderTrustBadges } from '../components/TrustBadges.js';
import { renderProductCard } from '../components/ProductCard.js';
import { renderPDPSkeleton } from '../components/Skeleton.js';
import { getProductBySlug, getProducts, formatPrice, getReviewsByProduct, addReview, getCategories } from '../data/products.js';
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

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="material-symbols-outlined star ${i < rating ? 'filled' : ''}">star</span>`
  ).join('');
}

export async function renderProductDetailPage(params) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-content"><div class="container section">${renderPDPSkeleton()}</div></div>`;

  const [[product, allProducts, categories], reviews] = await Promise.all([
    Promise.all([getProductBySlug(params.slug), getProducts()]),
    getReviewsByProduct(params.slug),
  ]);

  if (!product) {
    app.innerHTML = `<div class="container section" style="text-align:center;padding:var(--space-24) 0;"><h1 class="heading-2">Product Not Found</h1><p class="text-body" style="margin:var(--space-4) 0;">The product you're looking for doesn't exist.</p><a href="/shop" class="btn btn--accent">Browse Collection</a></div>`;
    return;
  }

  const productCategories = (categories || []).filter(c =>
    c.id === product.category || (product.categoryName && c.name === product.categoryName)
  ).map(c => c.name);

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
            ${productCategories.length ? `<div class="label">${productCategories.join(', ')} ${product.sku ? '• ' + product.sku : ''}</div>` : ''}
            <h1 class="pdp-title">${product.title}</h1>
            <div class="pdp-price">
              ${formatPrice(product.price)}
              ${product.originalPrice ? `<span style="font-size:var(--fs-md);color:var(--color-text-tertiary);text-decoration:line-through;margin-left:var(--space-3);">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>

            ${product.hasShippingBadge || product.hasWarrantyBadge ? `
              <div class="pdp-highlights">
                ${product.hasShippingBadge ? `<span class="highlight-badge highlight-shipping">🚚 Free Shipping</span>` : ''}
                ${product.hasWarrantyBadge ? `<span class="highlight-badge highlight-warranty">🛡️ 1-Year Warranty</span>` : ''}
              </div>
            ` : ''}

            ${product.shortDescription ? `
              <div class="pdp-short-desc">
                <span>${product.shortDescription}</span>
              </div>
            ` : ''}

            <p class="pdp-description">${product.description}</p>

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

            ${product.tags ? `
              <div class="pdp-tags-wrap">
                <span style="font-size:var(--fs-xs);font-weight:var(--fw-semibold);color:var(--color-text-tertiary);margin-right:var(--space-2);">Tags:</span>
                <div class="pdp-tags">${product.tags.split(',').map(t => `<span class="pdp-tag">${t.trim()}</span>`).filter(t => t).join('')}</div>
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

        ${product.longDescription && product.longDescription !== product.description ? `
          <div class="pdp-long-desc">
            <h3 class="heading-3">Product Details</h3>
            <p>${product.longDescription}</p>
          </div>
        ` : ''}

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

      <section class="pdp-reviews-section">
        <div class="container">
          <h2 class="heading-3" style="margin-bottom:var(--space-6);">Customer Reviews</h2>

          <div class="pdp-review-form-wrap">
            <h3 style="font-size:var(--fs-lg);margin-bottom:var(--space-4);">Write a Review</h3>
            <form id="review-form" class="pdp-review-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Your Name *</label>
                  <input type="text" name="reviewer_name" required placeholder="Rajesh Sharma">
                </div>
                <div class="form-group">
                  <label>Rating *</label>
                  <div class="rating-input-wrap" id="rating-input-wrap">
                    ${[1,2,3,4,5].map(n => `<button type="button" class="rating-star-btn" data-rating="${n}"><span class="material-symbols-outlined">star</span></button>`).join('')}
                    <input type="hidden" name="rating" id="review-rating-val" value="0">
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Your Review *</label>
                <textarea name="review_text" required placeholder="Share your experience with this product..." rows="4"></textarea>
              </div>
              <button type="submit" class="btn btn--accent">Submit Review</button>
            </form>
          </div>

          <div id="pdp-reviews-list">
            ${reviews.length ? reviews.map(r => `
              <div class="pdp-review-item">
                <div class="pdp-review-header">
                  <div class="pdp-reviewer-info">
                    <strong>${r.reviewer_name}</strong>
                    <div class="pdp-review-stars">${renderStars(r.rating)}</div>
                  </div>
                  <span class="pdp-review-date">${new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                ${r.review_text ? `<p class="pdp-review-text">${r.review_text}</p>` : ''}
                ${r.verified_purchase ? `<span class="badge badge-reviewed" style="margin-top:var(--space-2);">Verified Purchase</span>` : ''}
              </div>
            `).join('') : '<p style="color:var(--color-text-tertiary);">No reviews yet. Be the first to review this product!</p>'}
          </div>
        </div>
      </section>
    </div>
  `;

  // Qty stepper
  let pdpMOQ = product.minBulkOrder;
  const qtyInput = document.getElementById('pdp-qty');
  const minusBtn = document.getElementById('qty-minus');
  const plusBtn = document.getElementById('qty-plus');
  function clampQty(val) { return Math.max(pdpMOQ, val); }
  minusBtn?.addEventListener('click', () => { qtyInput.value = clampQty((parseInt(qtyInput.value) || pdpMOQ) - 1); });
  plusBtn?.addEventListener('click', () => { qtyInput.value = (parseInt(qtyInput.value) || pdpMOQ) + 1; });
  qtyInput?.addEventListener('change', () => { qtyInput.value = clampQty(parseInt(qtyInput.value) || pdpMOQ); });

  document.getElementById('pdp-add-quote')?.addEventListener('click', () => addToQuoteList(product.id, pdpMOQ));
  document.getElementById('pdp-add-cart')?.addEventListener('click', () => addToCart(product.id, pdpMOQ));

  // Rating stars
  let selectedRating = 0;
  document.querySelectorAll('.rating-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating);
      document.getElementById('review-rating-val').value = selectedRating;
      document.querySelectorAll('.rating-star-btn').forEach(b => {
        const idx = parseInt(b.dataset.rating);
        b.querySelector('.material-symbols-outlined').classList.toggle('filled', idx <= selectedRating);
      });
    });
  });

  // Review form
  document.getElementById('review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const rating = parseInt(fd.get('rating')) || selectedRating;
    if (!rating) { showToast('Please select a star rating.', 'error'); return; }
    try {
      await addReview(product.id, fd.get('reviewer_name'), rating, fd.get('review_text'));
      showToast('Review submitted!');
      e.target.reset();
      selectedRating = 0;
      document.getElementById('review-rating-val').value = 0;
      document.querySelectorAll('.rating-star-btn .material-symbols-outlined').forEach(s => s.classList.remove('filled'));
      // Reload reviews
      const newReviews = await getReviewsByProduct(product.id);
      const list = document.getElementById('pdp-reviews-list');
      if (list) {
        list.innerHTML = newReviews.length ? newReviews.map(r => `
          <div class="pdp-review-item">
            <div class="pdp-review-header">
              <div class="pdp-reviewer-info">
                <strong>${r.reviewer_name}</strong>
                <div class="pdp-review-stars">${renderStars(r.rating)}</div>
              </div>
              <span class="pdp-review-date">${new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            ${r.review_text ? `<p class="pdp-review-text">${r.review_text}</p>` : ''}
            ${r.verified_purchase ? `<span class="badge badge-reviewed" style="margin-top:var(--space-2);">Verified Purchase</span>` : ''}
          </div>
        `).join('') : '<p style="color:var(--color-text-tertiary);">No reviews yet. Be the first to review this product!</p>';
      }
    } catch (err) {
      showToast('Failed to submit review.', 'error');
    }
  });

  // Image gallery
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
    const media = isVideo ? `<video src="${src}" controls muted playsinline></video>` : `<img src="${src}" alt="${alt}">`;
    const nextSlide = document.createElement('div');
    nextSlide.className = 'pdp-slide pdp-slide--next';
    nextSlide.innerHTML = media;
    mainImageEl.appendChild(nextSlide);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextSlide.classList.remove('pdp-slide--next');
        nextSlide.classList.add('pdp-slide--active');
        if (currentSlide) { currentSlide.classList.remove('pdp-slide--active'); currentSlide.classList.add('pdp-slide--prev'); }
        setTimeout(() => currentSlide?.remove(), 400);
      });
    });
    thumbs.forEach(t => t.classList.toggle('active', parseInt(t.dataset.index) === idx));
    currentIdx = idx;
  }

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => switchImage(parseInt(thumb.dataset.index)));
  });

  if (images.length > 1) {
    mainImageEl.addEventListener('mouseenter', () => {
      slideshowActive = true;
      slideshowInterval = setInterval(() => {
        if (!slideshowActive) return;
        switchImage((currentIdx + 1) % images.length);
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

function showToast(message, type = 'success') {
  let existing = document.getElementById('toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1A1A1A;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;z-index:7000;transform:translateY(80px);opacity:0;transition:all 0.3s ease;';
  if (type === 'error') toast.style.background = '#c0392b';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.transform = 'translateY(80px)'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 350); }, 2500);
}