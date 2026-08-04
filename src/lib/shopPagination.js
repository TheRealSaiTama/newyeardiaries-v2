export function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items = [];
  items.push(1);
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) items.push('...');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 1) items.push('...');
  items.push(totalPages);
  return items;
}

export function buildShopPageUrl(page, search = '') {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.set('page', String(page));
  return `/shop?${params.toString()}`;
}

export function renderPaginationButtonsHtml(currentPage, totalPages) {
  const items = getPaginationItems(currentPage, totalPages);
  return items.map((p) => {
    if (p === '...') return `<span class="shop-pag-ellipsis">…</span>`;
    return `<button type="button" class="shop-pag-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }).join('');
}
