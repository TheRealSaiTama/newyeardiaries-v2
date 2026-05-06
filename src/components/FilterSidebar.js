// ===== FilterSidebar Component =====
import { filters } from '../data/products.js';

export function renderFilterSidebar() {
  return `
    <aside class="filter-sidebar" id="filter-sidebar">
      <h2 style="font-size:var(--fs-md);font-weight:var(--fw-semibold);margin-bottom:var(--space-4);">Filters</h2>
      <p style="font-size:var(--fs-sm);color:var(--color-text-secondary);margin-bottom:var(--space-4);">Refine your selection</p>
      
      <div class="filter-section">
        <div class="filter-section-title" data-filter="material">
          <span>Cover Material</span>
          <span class="material-symbols-outlined">expand_more</span>
        </div>
        <div class="filter-options">
          ${filters.material.map(m => `
            <label class="filter-option">
              <input type="checkbox" value="${m}" name="material">
              <span>${m}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-section-title" data-filter="size">
          <span>Size</span>
          <span class="material-symbols-outlined">expand_more</span>
        </div>
        <div class="filter-options">
          ${filters.size.map(s => `
            <label class="filter-option">
              <input type="checkbox" value="${s}" name="size">
              <span>${s}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-section-title" data-filter="price">
          <span>Price Range</span>
          <span class="material-symbols-outlined">expand_more</span>
        </div>
        <div class="filter-options">
          ${filters.priceRange.map(r => `
            <label class="filter-option">
              <input type="checkbox" value="${r.min}-${r.max}" name="price">
              <span>${r.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </aside>
  `;
}

export function initFilterEvents() {
  document.querySelectorAll('.filter-section-title').forEach(title => {
    title.addEventListener('click', () => {
      title.closest('.filter-section')?.classList.toggle('collapsed');
    });
  });
}
