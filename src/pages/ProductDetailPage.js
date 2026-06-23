import { renderBreadcrumbs } from '../components/Breadcrumbs.js';
import { renderProductCard, initProductCardSlideshows } from '../components/ProductCard.js';
import { renderPDPSkeleton } from '../components/Skeleton.js';
import { getProductBySlug, getProducts, formatPrice, getReviewsByProduct, addReview, getCategories } from '../data/products.js';
import { addToCart } from '../data/store.js';
import { supabase } from '../lib/supabase.js';

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

function reviewItemHtml(r) {
  const initials = r.reviewer_name.trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase();
  const date = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `
    <article class="pdp-review-card">
      <div class="pdp-review-card__head">
        <span class="pdp-review-avatar">${initials || 'A'}</span>
        <div class="pdp-review-card__who">
          <div class="pdp-review-card__namerow">
            <strong>${r.reviewer_name}</strong>
            ${r.verified_purchase ? `<span class="pdp-review-verified"><span class="material-symbols-outlined">verified</span> Verified Purchase</span>` : ''}
          </div>
          <div class="pdp-review-card__sub">
            <span class="pdp-review-stars">${renderStars(r.rating)}</span>
            <span class="pdp-review-date">${date}</span>
          </div>
        </div>
      </div>
      ${r.review_text ? `<p class="pdp-review-text">${r.review_text}</p>` : ''}
    </article>`;
}

function reviewsListHtml(reviews) {
  return reviews.length
    ? reviews.map(reviewItemHtml).join('')
    : `<div class="pdp-reviews-empty"><span class="material-symbols-outlined">rate_review</span><p>No reviews yet. Be the first to share your experience!</p></div>`;
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

  let productCategoryList = [];
  if (product.id) {
    const { data: links } = await supabase.from('product_categories').select('categories(name)').eq('product_id', product.id);
    productCategoryList = (links || []).map(l => l.categories?.name).filter(Boolean);
  }

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const reviewsContent = `
            <div class="pdp-reviews-summary">
              <div class="pdp-reviews-summary__score">
                <span class="pdp-reviews-summary__num">${avgRating.toFixed(1)}</span>
                <div>
                  <span class="pdp-review-stars pdp-review-stars--lg">${renderStars(Math.round(avgRating))}</span>
                  <span class="pdp-reviews-summary__count">Based on ${reviews.length} review${reviews.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <button type="button" class="btn btn--secondary btn--sm" id="pdp-write-review-btn">Write a Review</button>
            </div>
            <div id="pdp-reviews-list" class="pdp-reviews-list">
              ${reviewsListHtml(reviews)}
            </div>
            <div class="pdp-review-form-wrap" id="pdp-review-form-wrap">
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
          `;

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
            ${productCategoryList.length ? `<div class="label">${productCategoryList.join(', ')} ${product.sku ? '• ' + product.sku : ''}</div>` : ''}
            <h1 class="pdp-title">${product.title}</h1>
            <div class="pdp-price">
              ${formatPrice(product.price)}
              ${product.originalPrice ? `<span style="font-size:var(--fs-md);color:var(--color-text-tertiary);text-decoration:line-through;margin-left:var(--space-3);">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>

            <div class="pdp-description">${product.shortDescription || product.description}</div>

            ${product.hasShippingBadge || product.hasWarrantyBadge ? `
              <div style="margin-top:var(--space-4);font-size:var(--fs-sm);line-height:1.6;display:flex;flex-direction:column;gap:var(--space-1);margin-bottom:var(--space-4);">
                ${product.hasWarrantyBadge ? `<div style="color:#1565c0;font-weight:var(--fw-medium);">" COD facility not available for this product "</div>` : ''}
                ${product.hasShippingBadge ? `
                  <div style="color:#e53935;font-weight:var(--fw-medium);">*This product has minimum order quantity restriction.</div>
                  <div style="color:#e53935;font-weight:var(--fw-medium);">** If your order quantity is little less than MOQ then please write us.</div>
                ` : ''}
              </div>
            ` : ''}

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
                <div class="qty-stepper" style="display:flex;align-items:center;gap:var(--space-3);">
                  <div style="display:flex;align-items:center;">
                    <button class="qty-step-btn" id="qty-minus" aria-label="Decrease">−</button>
                    <input type="number" class="qty-step-input" id="pdp-qty" value="${product.minBulkOrder}" min="${product.minBulkOrder}" step="1">
                    <button class="qty-step-btn" id="qty-plus" aria-label="Increase">+</button>
                  </div>
                  <button class="btn btn--accent btn--lg" id="pdp-add-cart">
                    <span class="material-symbols-outlined" style="font-size:18px;">shopping_bag</span>
                    Add to Cart
                  </button>
                </div>
                <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);">Min. order: ${product.minBulkOrder} units</div>
              </div>
            </div>
          </div>
        </div>

        <div class="pdp-detail-tabs">
          <div class="pdp-tab-bar">
            <button type="button" class="pdp-tab active" data-tab="desc">Description</button>
            <button type="button" class="pdp-tab" data-tab="tags">Tags</button>
            <button type="button" class="pdp-tab" data-tab="reviews">Reviews (${reviews.length})</button>
          </div>
          <div id="pdp-tab-desc" class="pdp-tab-panel">
            ${(productCategoryList.length || product.tags) ? `
              <div style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin-bottom:var(--space-4);line-height:1.5;">
                ${productCategoryList.length ? `<div><strong>Categories:</strong> ${productCategoryList.join(', ')}</div>` : ''}
                ${product.tags ? `<div><strong>Tags:</strong> ${product.tags}</div>` : ''}
              </div>
            ` : ''}
            ${product.description ? `<div class="pdp-long-desc" style="margin:0;">${product.description}</div>` : '<p style="color:var(--color-text-tertiary);">No description available.</p>'}
          </div>
          <div id="pdp-tab-tags" class="pdp-tab-panel" style="display:none;">
            ${product.tags ? product.tags.split(',').map(t=>t.trim()).filter(Boolean).join(', ') : 'No tags.'}
          </div>
          <div id="pdp-tab-reviews" class="pdp-tab-panel" style="display:none;">
            ${reviewsContent}
          </div>
        </div>

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

  initProductCardSlideshows();

  // Qty stepper
  let pdpMOQ = product.minBulkOrder;
  const qtyInput = document.getElementById('pdp-qty');
  const minusBtn = document.getElementById('qty-minus');
  const plusBtn = document.getElementById('qty-plus');
  function clampQty(val) { return Math.max(pdpMOQ, val); }
  minusBtn?.addEventListener('click', () => { qtyInput.value = clampQty((parseInt(qtyInput.value) || pdpMOQ) - 1); });
  plusBtn?.addEventListener('click', () => { qtyInput.value = (parseInt(qtyInput.value) || pdpMOQ) + 1; });
  qtyInput?.addEventListener('change', () => { qtyInput.value = clampQty(parseInt(qtyInput.value) || pdpMOQ); });

  document.getElementById('pdp-add-cart')?.addEventListener('click', () => addToCart(product.id, parseInt(qtyInput.value) || pdpMOQ));

  const tabBtns = document.querySelectorAll('.pdp-tab');
  const tabPanels = {desc:document.getElementById('pdp-tab-desc'),tags:document.getElementById('pdp-tab-tags'),reviews:document.getElementById('pdp-tab-reviews')};
  tabBtns.forEach(btn=>{btn.addEventListener('click',()=>{tabBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');Object.values(tabPanels).forEach(p=>{if(p)p.style.display='none';});const tab=btn.dataset.tab;if(tabPanels[tab])tabPanels[tab].style.display='';});});

  // Rating stars
  let selectedRating = 0;
  document.getElementById('pdp-write-review-btn')?.addEventListener('click', () => {
    document.getElementById('pdp-review-form-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('#review-form input[name="reviewer_name"]')?.focus();
  });
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
        list.innerHTML = reviewsListHtml(newReviews);
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
