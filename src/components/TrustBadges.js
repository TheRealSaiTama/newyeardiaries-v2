// ===== TrustBadges Component =====
export function renderTrustBadges() {
  const badges = [
    { icon: 'draw', title: 'Customized Diaries', desc: 'Your Brand Logo Embossed' },
    { icon: 'factory', title: 'Direct Manufacturer', desc: 'Unbeatable Wholesale Prices' },
    { icon: 'workspace_premium', title: 'Premium Quality', desc: 'Imported PU & FSC Paper' },
    { icon: 'local_shipping', title: 'Pan India Delivery', desc: 'Fast & Insured Shipping' },
  ];

  return `
    <div class="trust-badges">
      ${badges.map(b => `
        <div class="trust-badge">
          <div class="trust-badge-icon">
            <span class="material-symbols-outlined">${b.icon}</span>
          </div>
          <h4 class="trust-badge-title">${b.title}</h4>
          <p class="trust-badge-desc">${b.desc}</p>
        </div>
      `).join('')}
    </div>
  `;
}
