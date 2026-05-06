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
