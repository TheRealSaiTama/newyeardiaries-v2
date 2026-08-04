import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderProductCard } from '../src/components/ProductCard.js';

describe('renderProductCard (shipped ProductCard.js)', () => {
  it('renders http images in the card', () => {
    const html = renderProductCard({
      id: '1',
      slug: 'leather-diary',
      name: 'Leather Diary',
      title: 'Leather Diary',
      price: 199,
      inStock: true,
      images: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'],
    });
    assert.match(html, /href="\/leather-diary"/);
    assert.match(html, /https:\/\/cdn\.example\.com\/a\.jpg/);
    assert.match(html, /data-has-slideshow="true"/);
    assert.match(html, /₹199/);
  });

  it('falls back to a single base64 image so cards are not blank', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const html = renderProductCard({
      id: '2',
      slug: 'base64-only',
      name: 'Base64 Product',
      price: 50,
      inStock: true,
      image: dataUrl,
      images: [dataUrl],
    });
    assert.match(html, /src="data:image\/png;base64,iVBORw0KGgo="/);
    assert.doesNotMatch(html, /menu_book/);
  });

  it('shows sold out overlay when out of stock', () => {
    const html = renderProductCard({
      id: '3',
      slug: 'oos',
      name: 'OOS',
      price: 10,
      inStock: false,
      image: 'https://cdn.example.com/x.jpg',
    });
    assert.match(html, /Sold Out/);
  });
});
