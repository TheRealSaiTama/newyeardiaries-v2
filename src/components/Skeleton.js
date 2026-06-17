// ===== Skeleton Loading Component =====
export function renderProductCardSkeleton(count = 6) {
  return `
    <div class="product-grid">
      ${Array(count).fill('').map(() => `
        <div class="product-card">
          <div class="product-card-image">
            <div class="skeleton" style="width:100%;height:100%;"></div>
          </div>
          <div class="product-card-body">
            <div class="skeleton" style="width:60%;height:12px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:80%;height:16px;margin-bottom:8px;"></div>
            <div class="skeleton" style="width:50%;height:12px;margin-bottom:12px;"></div>
            <div class="skeleton" style="width:30%;height:18px;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderPDPSkeleton() {
  return `
    <div class="pdp-layout">
      <div class="pdp-gallery">
        <div class="pdp-main-image"><div class="skeleton" style="width:100%;height:100%;"></div></div>
        <div class="pdp-thumbnails">
          ${Array(4).fill('').map(() => '<div class="skeleton" style="width:72px;height:72px;border-radius:8px;"></div>').join('')}
        </div>
      </div>
      <div class="pdp-info">
        <div class="skeleton" style="width:40%;height:14px;"></div>
        <div class="skeleton" style="width:70%;height:32px;"></div>
        <div class="skeleton" style="width:25%;height:24px;"></div>
        <div class="skeleton" style="width:100%;height:60px;"></div>
        <div class="skeleton" style="width:100%;height:100px;"></div>
        <div style="display:flex;gap:16px;">
          <div class="skeleton" style="flex:1;height:48px;"></div>
          <div class="skeleton" style="flex:1;height:48px;"></div>
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
  const productCard = (variant) => `
    <div class="product-card">
      <div class="product-card-image"><div class="skeleton" style="width:100%;height:100%;"></div></div>
      <div class="product-card-body">
        <div class="skeleton" style="width:50%;height:11px;margin-bottom:10px;"></div>
        <div class="skeleton" style="width:${variant === 1 ? 85 : 70}%;height:14px;margin-bottom:8px;"></div>
        <div class="skeleton" style="width:40%;height:11px;margin-bottom:14px;"></div>
        <div class="skeleton" style="width:30%;height:18px;"></div>
      </div>
    </div>`;
  const productRow = (n) => `
    <div class="product-grid">
      ${Array(n).fill('').map((_, i) => productCard(i % 3)).join('')}
    </div>`;

  return `
    <div class="page-content">
      <!-- Hero banner skeleton -->
      <section class="hero-section">
        <div class="hero-slider" id="hero-slider">
          <div class="hero-slide active" style="height:420px;">
            <div class="skeleton" style="width:100%;height:100%;border-radius:0;"></div>
          </div>
        </div>
      </section>

      <!-- Category strip skeleton -->
      <section class="category-strip-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:160px;height:14px;margin:0 auto 20px;"></div>
          <div class="skeleton" style="width:60%;height:24px;margin:0 auto 24px;"></div>
          <div style="display:flex;gap:18px;overflow:hidden;">
            ${Array(6).fill('').map(() => '<div class="skeleton" style="flex:0 0 150px;height:120px;border-radius:12px;"></div>').join('')}
          </div>
        </div>
      </section>

      <!-- Product section 1 -->
      <section class="product-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:220px;height:24px;margin-bottom:8px;"></div>
          <div class="skeleton" style="width:60%;height:14px;margin-bottom:24px;"></div>
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
                  <div class="skeleton" style="width:70%;height:12px;margin-bottom:6px;"></div>
                  <div class="skeleton" style="width:50%;height:10px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Product section 2 -->
      <section class="product-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:260px;height:24px;margin-bottom:8px;"></div>
          <div class="skeleton" style="width:55%;height:14px;margin-bottom:24px;"></div>
          ${productRow(4)}
        </div>
      </section>

      <!-- Product section 3 -->
      <section class="product-section" style="padding:32px 0;">
        <div class="container">
          <div class="skeleton" style="width:200px;height:24px;margin-bottom:8px;"></div>
          <div class="skeleton" style="width:50%;height:14px;margin-bottom:24px;"></div>
          ${productRow(3)}
        </div>
      </section>
    </div>
  `;
}

