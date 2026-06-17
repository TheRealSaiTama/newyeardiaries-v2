// ===== Skeleton Loading Component =====
// All skeletons use the SAME classes as the real components they stand in for
// (e.g. .ap-product-card, .ap-product-image-wrapper) so the layout matches
// exactly. Only the inner elements use .skeleton for the shimmer effect.

// Returns skeleton card fragments ONLY (no grid wrapper). The caller drops
// these directly into the existing grid container (#product-grid or
// .ap-product-grid). Adding a wrapper here would double-nest the grid and
// collapse the cards into a single column — see ShopPage usage.
export function renderProductCardSkeleton(count = 6) {
  return Array(count).fill('').map(() => renderProductCardSkeletonItem()).join('');
}

// One skeleton card. Uses .ap-product-card + .ap-product-image-wrapper so it
// has the EXACT same dimensions and shape as a real product card. Only the
// image and text rows are replaced with .skeleton shimmer placeholders.
function renderProductCardSkeletonItem() {
  return `
    <div class="ap-product-card ap-product-card--skeleton" aria-hidden="true">
      <div class="ap-product-image-wrapper">
        <div class="skeleton" style="position:absolute;inset:0;width:100%;height:100%;border-radius:0;"></div>
      </div>
      <div class="ap-product-body">
        <div class="skeleton" style="width:50%;height:11px;margin-bottom:10px;border-radius:4px;"></div>
        <div class="skeleton" style="width:80%;height:14px;margin-bottom:8px;border-radius:4px;"></div>
        <div class="skeleton" style="width:40%;height:11px;margin-bottom:14px;border-radius:4px;"></div>
        <div class="skeleton" style="width:30%;height:18px;border-radius:4px;"></div>
      </div>
    </div>
  `;
}

export function renderPDPSkeleton() {
  return `
    <div class="pdp-layout">
      <div class="pdp-gallery">
        <div class="pdp-main-image">
          <div class="skeleton" style="position:absolute;inset:0;width:100%;height:100%;border-radius:8px;"></div>
        </div>
        <div class="pdp-thumbnails">
          ${Array(4).fill('').map(() => '<div class="skeleton" style="width:72px;height:72px;border-radius:8px;flex-shrink:0;"></div>').join('')}
        </div>
      </div>
      <div class="pdp-info">
        <div class="skeleton" style="width:40%;height:14px;border-radius:4px;"></div>
        <div class="skeleton" style="width:70%;height:32px;margin:12px 0;border-radius:4px;"></div>
        <div class="skeleton" style="width:25%;height:24px;margin-bottom:24px;border-radius:4px;"></div>
        <div class="skeleton" style="width:100%;height:60px;margin-bottom:16px;border-radius:6px;"></div>
        <div class="skeleton" style="width:100%;height:100px;margin-bottom:16px;border-radius:6px;"></div>
        <div style="display:flex;gap:16px;">
          <div class="skeleton" style="flex:1;height:48px;border-radius:6px;"></div>
          <div class="skeleton" style="flex:1;height:48px;border-radius:6px;"></div>
        </div>
      </div>
    </div>
  `;
}

// Homepage skeleton — hero, category strip, and three product sections.
// Painted in #app synchronously during boot so the user never sees an
// empty main area (and the about-section from the shell doesn't look
// like the actual page).
export function renderHomeSkeleton() {
  const productRow = (n) => `
    <div class="ap-product-grid">
      ${Array(n).fill('').map(() => renderProductCardSkeletonItem()).join('')}
    </div>`;

  return `
    <div class="page-content">
      <!-- Hero banner skeleton -->
      <section class="hero-section">
        <div class="hero-slider" id="hero-slider">
          <div class="hero-slide active" style="height:420px;position:relative;">
            <div class="skeleton" style="position:absolute;inset:0;width:100%;height:100%;border-radius:0;"></div>
          </div>
        </div>
      </section>

      <!-- Category strip skeleton -->
      <section class="category-strip-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:160px;height:14px;margin:0 auto 20px;border-radius:4px;"></div>
          <div class="skeleton" style="width:60%;height:24px;margin:0 auto 24px;border-radius:4px;"></div>
          <div style="display:flex;gap:18px;overflow:hidden;">
            ${Array(6).fill('').map(() => '<div class="skeleton" style="flex:0 0 150px;height:120px;border-radius:12px;"></div>').join('')}
          </div>
        </div>
      </section>

      <!-- Product section 1 -->
      <section class="product-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:220px;height:24px;margin-bottom:8px;border-radius:4px;"></div>
          <div class="skeleton" style="width:60%;height:14px;margin-bottom:24px;border-radius:4px;"></div>
          ${productRow(4)}
        </div>
      </section>

      <!-- Trust badges / features skeleton -->
      <section style="padding:24px 0;">
        <div class="container">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
            ${Array(4).fill('').map(() => `
              <div style="display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #eee;border-radius:12px;">
                <div class="skeleton" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;"></div>
                <div style="flex:1;">
                  <div class="skeleton" style="width:70%;height:12px;margin-bottom:6px;border-radius:4px;"></div>
                  <div class="skeleton" style="width:50%;height:10px;border-radius:4px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Product section 2 -->
      <section class="product-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:260px;height:24px;margin-bottom:8px;border-radius:4px;"></div>
          <div class="skeleton" style="width:55%;height:14px;margin-bottom:24px;border-radius:4px;"></div>
          ${productRow(4)}
        </div>
      </section>

      <!-- Product section 3 -->
      <section class="product-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:200px;height:24px;margin-bottom:8px;border-radius:4px;"></div>
          <div class="skeleton" style="width:50%;height:14px;margin-bottom:24px;border-radius:4px;"></div>
          ${productRow(3)}
        </div>
      </section>
    </div>
  `;
}
