function isHttpSrc(src) {
  return typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'));
}

function isDataSrc(src) {
  return typeof src === 'string' && src.startsWith('data:image');
}

export function renderProductCard(product) {
  const rawImages = (product.images && product.images.length)
    ? product.images
    : (product.image ? [product.image] : []);
  const httpImages = rawImages.filter(isHttpSrc);
  // Prefer remote URLs for grid weight; if product only has base64, still show one so cards aren't blank
  const images = httpImages.length
    ? httpImages
    : rawImages.filter(isDataSrc).slice(0, 1);
  const hasMultiple = images.length > 1;

  let img;
  if (hasMultiple) {
    // H3.4: first image eager; rest lazy
    img = images.map((src, i) => {
      const isFirst = i === 0;
      const loading = isFirst ? 'eager' : 'lazy';
      const fetchpriority = isFirst ? 'high' : 'auto';
      return `<img src="${src}" alt="${product.title || product.name}" class="ap-product-img ${isFirst ? 'ap-product-img--active' : ''}" loading="${loading}" fetchpriority="${fetchpriority}" decoding="async" draggable="false" />`;
    }).join('');
  } else if (images[0]) {
    img = `<img src="${images[0]}" alt="${product.title || product.name}" loading="eager" fetchpriority="high" decoding="async" draggable="false" />`;
  } else {
    img = `<div class="ap-product-icon"><span class="material-symbols-outlined">menu_book</span></div>`;
  }

  const badgeMap = { New: 'ap-badge--new', Sale: 'ap-badge--sale', Bestseller: 'ap-badge--bestseller' };
  const badge = product.badge ? `<span class="ap-badge ${badgeMap[product.badge] || 'ap-badge--new'}">${product.badge}</span>` : '';

  const outOfStock = !product.inStock;

  return `
    <a href="/${product.slug || product.id}" class="ap-product-card" data-product-id="${product.id}" ${hasMultiple ? 'data-has-slideshow="true"' : ''} draggable="false">
      <div class="ap-product-image-wrapper">
        ${badge}
        ${img}
        ${outOfStock ? '<div class="ap-sold-out-overlay"><span>Sold Out</span></div>' : ''}
      </div>
      <div class="ap-product-body">
        <div class="ap-product-price">
          ${product.originalPrice && product.originalPrice > product.price
            ? `<span class="ap-price-sale">₹${product.originalPrice}</span>`
            : ''}
          <span class="ap-price-current ${product.originalPrice && product.originalPrice > product.price ? 'ap-price--discounted' : ''}">₹${product.price}</span>
        </div>
        <h3 class="ap-product-title">${product.name || product.title}</h3>
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

    imgs.forEach((img, i) => {
      if (i === 0) img.classList.add('ap-product-img--active');
      else img.style.transform = 'translateX(100%)';
    });

    const advance = () => {
      const prev = current;
      imgs[prev].classList.remove('ap-product-img--active');
      imgs[prev].classList.add('ap-product-img--prev');

      current = (current + 1) % imgs.length;
      imgs[current].classList.remove('ap-product-img--prev');
      imgs[current].classList.add('ap-product-img--active');

      // Clear prev class after transition without leaving dangling timers
      const prevEl = imgs[prev];
      window.setTimeout(() => {
        prevEl.classList.remove('ap-product-img--prev');
        prevEl.style.transform = 'translateX(100%)';
      }, 400);
    };

    const start = () => {
      if (interval) return;
      interval = setInterval(advance, 2000);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      imgs.forEach((img, i) => {
        img.classList.remove('ap-product-img--active', 'ap-product-img--prev');
        if (i === 0) {
          img.style.transform = 'translateX(0)';
          img.classList.add('ap-product-img--active');
        } else {
          img.style.transform = 'translateX(100%)';
        }
      });
      current = 0;
    };

    // Desktop hover
    card.addEventListener('mouseenter', start);
    card.addEventListener('mouseleave', stop);

    // H3.12: touch — brief slideshow on tap/focus without blocking navigation
    let touchTimer = null;
    card.addEventListener('touchstart', () => {
      start();
      clearTimeout(touchTimer);
      touchTimer = setTimeout(stop, 4000);
    }, { passive: true });
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', (e) => {
      if (!card.contains(e.relatedTarget)) stop();
    });
  });
}
