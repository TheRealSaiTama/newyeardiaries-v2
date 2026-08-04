import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function src(rel) {
  return readFileSync(path.resolve(rel), 'utf8');
}

describe('critical imports present in shipped entrypoints', () => {
  it('main.js imports navigateTo for /product/:slug redirect', () => {
    const text = src('src/main.js');
    assert.match(text, /import\s*\{[^}]*navigateTo[^}]*\}\s*from\s*['"]\.\/router\.js['"]/);
    assert.match(text, /navigateTo\('\/' \+ params\.slug\)/);
    assert.match(text, /addRoute\('\/404'/);
  });

  it('Header.js imports navigateTo for search result clicks', () => {
    const text = src('src/components/Header.js');
    assert.match(text, /import\s*\{[^}]*navigateTo[^}]*\}\s*from\s*['"]\.\.\/router\.js['"]/);
    assert.match(text, /navigateTo\(item\.dataset\.slug/);
  });

  it('ShopPage.js imports navigateTo and shopPagination helpers', () => {
    const text = src('src/pages/ShopPage.js');
    assert.match(text, /import\s*\{[^}]*navigateTo[^}]*\}\s*from\s*['"]\.\.\/router\.js['"]/);
    assert.match(text, /buildShopPageUrl/);
    assert.match(text, /ensurePaginationDelegation/);
  });

  it('products.js rejects blank-image localStorage cache', () => {
    const text = src('src/data/products.js');
    assert.match(text, /list\.some\(\(p\) => p && p\.image\)/);
  });

  it('content.js does not persist empty shopCategories/banners as usable visuals', () => {
    const text = src('src/lib/content.js');
    assert.match(text, /shopCategories:\s*\[\]/);
    assert.match(text, /banners:\s*\[\]/);
    assert.match(text, /CONTENT_CACHE_VERSION/);
  });
});
