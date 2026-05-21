import { formatPrice } from '../data/products.js';

export function renderProductCard(product) {
  const images = product.images || [];
  const hasMultiple = images.length > 1;

  let img;
  if (hasMultiple) {
    img = images.map((src, i) =>
      `<img src="${src}" alt="${product.title || product.name}" class="ap-product-img ${i === 0 ? 'ap-product-img--active' : ''}" loading="lazy" />`
    ).join('');
  } else {
    img = product.image
      ? `<img src="${product.image}" alt="${product.title || product.name}" loading="lazy" />`
      : `<div class="ap-product-icon"><span class="material-symbols-outlined">menu_book</span></div>`;
  }

  const badgeMap = { New: 'ap-badge--new', Sale: 'ap-badge--sale', Bestseller: 'ap-badge--bestseller' };
  const badge = product.badge ? `<span class="ap-badge ${badgeMap[product.badge] || 'ap-badge--new'}">${product.badge}</span>` : '';

  const outOfStock = !product.inStock;

  return `
    <a href="/product/${product.slug || product.id}" class="ap-product-card" data-product-id="${product.id}" ${hasMultiple ? 'data-has-slideshow="true"' : ''}>
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

export function initProductCardSlideshows(container = document) {
  container.querySelectorAll('.ap-product-card[data-has-slideshow="true"]').forEach(card => {
    if (card._slideshowInitialized) return;
    card._slideshowInitialized = true;

    const wrapper = card.querySelector('.ap-product-image-wrapper');
    const imgs = wrapper.querySelectorAll('.ap-product-img');
    if (imgs.length <= 1) return;

    let interval = null;
    let current = 0;

    card.addEventListener('mouseenter', () => {
      if (interval) return;
      interval = setInterval(() => {
        imgs[current].classList.remove('ap-product-img--active');
        current = (current + 1) % imgs.length;
        imgs[current].classList.add('ap-product-img--active');
      }, 1200);
    });

    card.addEventListener('mouseleave', () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      imgs[current].classList.remove('ap-product-img--active');
      current = 0;
      imgs[0].classList.add('ap-product-img--active');
    });
  });
}
