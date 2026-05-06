// ===== Breadcrumbs Component =====
export function renderBreadcrumbs(items) {
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      ${items.map((item, i) => {
        const isLast = i === items.length - 1;
        if (isLast) {
          return `<span class="current">${item.label}</span>`;
        }
        return `
          <a href="${item.path}">${item.label}</a>
          <span class="separator material-symbols-outlined" aria-hidden="true">chevron_right</span>
        `;
      }).join('')}
    </nav>
  `;
}
