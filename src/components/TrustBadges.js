// ===== TrustBadges Component =====
// Accepts an optional list of badge objects (from DB). Falls back to the
// original 4 hardcoded badges so the page still renders even before the
// trust_badges table is populated.
const DEFAULT_BADGES = [
  { icon: 'draw',                title: 'Customized Diaries',    desc: 'Your Brand Logo Embossed' },
  { icon: 'factory',             title: 'Direct Manufacturer',   desc: 'Unbeatable Wholesale Prices' },
  { icon: 'workspace_premium',   title: 'Premium Quality',       desc: 'Imported PU & FSC Paper' },
  { icon: 'local_shipping',      title: 'Pan India Delivery',    desc: 'Fast & Insured Shipping' },
];

export function renderTrustBadges(badges) {
  const list = (Array.isArray(badges) && badges.length > 0) ? badges : DEFAULT_BADGES;

  return `
    <div class="trust-badges">
      ${list.map(b => `
        <div class="trust-badge">
          <div class="trust-badge-icon">
            <span class="material-symbols-outlined">${b.icon || 'verified'}</span>
          </div>
          <h4 class="trust-badge-title">${b.title || ''}</h4>
          <p class="trust-badge-desc">${b.description || b.desc || ''}</p>
        </div>
      `).join('')}
    </div>
  `;
}
