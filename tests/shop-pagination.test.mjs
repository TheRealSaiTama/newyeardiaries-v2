import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPaginationItems,
  buildShopPageUrl,
  renderPaginationButtonsHtml,
} from '../src/lib/shopPagination.js';

describe('getPaginationItems', () => {
  it('returns all pages when total <= 7', () => {
    assert.deepEqual(getPaginationItems(1, 5), [1, 2, 3, 4, 5]);
  });

  it('includes page 2 when on page 1 with many pages', () => {
    const items = getPaginationItems(1, 17);
    assert.ok(items.includes(2), `expected 2 in ${JSON.stringify(items)}`);
    assert.equal(items[0], 1);
    assert.equal(items[items.length - 1], 17);
  });

  it('keeps ellipsis between windows on middle pages', () => {
    const items = getPaginationItems(10, 17);
    assert.ok(items.includes(1));
    assert.ok(items.includes(10));
    assert.ok(items.includes(17));
    assert.ok(items.includes('...'));
  });
});

describe('buildShopPageUrl', () => {
  it('sets page param for page 2', () => {
    assert.equal(buildShopPageUrl(2, ''), '/shop?page=2');
  });

  it('preserves existing filters when changing page', () => {
    assert.equal(
      buildShopPageUrl(3, '?cat=premium-diary&page=1'),
      '/shop?cat=premium-diary&page=3'
    );
  });

  it('accepts search with leading ?', () => {
    assert.equal(buildShopPageUrl(2, '?group=Calendars'), '/shop?group=Calendars&page=2');
  });
});

describe('renderPaginationButtonsHtml', () => {
  it('emits data-page buttons for page 2 click target', () => {
    const html = renderPaginationButtonsHtml(1, 17);
    assert.match(html, /data-page="2"/);
    assert.match(html, /data-page="1"/);
    assert.match(html, /class="shop-pag-btn active"/);
    assert.match(html, /type="button"/);
  });

  it('marks the current page active only', () => {
    const html = renderPaginationButtonsHtml(2, 10);
    assert.match(html, /shop-pag-btn active" data-page="2"/);
    assert.doesNotMatch(html, /shop-pag-btn active" data-page="1"/);
  });
});
