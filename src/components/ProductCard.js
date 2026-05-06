import { formatPrice } from '../data/products.js';

export function renderProductCard(product) {
  const img = product.image
    ? `<img src="${product.image}" alt="${product.title}" loading="lazy" />`
    : `<div class="ap-product-icon"><span class="material-symbols-outlined">menu_book</span></div>`;

  const badgeMap = { New: 'ap-badge--new', Sale: 'ap-badge--sale', Bestseller: 'ap-badge--bestseller' };
  const badge = product.badge ? `<span class="ap-badge ${badgeMap[product.badge] || 'ap-badge--new'}">${product.badge}</span>` : '';

  const outOfStock = !product.inStock;

  return `
    <a href="/product/${product.id}" class="ap-product-card" data-product-id="${product.id}">
      <div class="ap-product-image-wrapper">
        ${badge}
        ${img}
        ${outOfStock ? '<div class="ap-sold-out-overlay"><span>Sold Out</span></div>' : ''}
      </div>
      <div class="ap-product-body">
        <h3 class="ap-product-title">${product.name || product.title}</h3>
        <div class="ap-product-price">
          ${product.originalPrice && product.originalPrice > product.price
            ? `<span class="ap-price-sale">₹${product.originalPrice}</span>`
            : ''}
          <span class="ap-price-current">₹${product.price}</span>
        </div>
      </div>
    </a>
  `;
}

export function renderProductGrid(products) {
  return `<div class="ap-product-grid">${products.map(p => renderProductCard(p)).join('')}</div>`;
}
