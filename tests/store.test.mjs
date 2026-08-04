import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseStorageList,
  addLineItem,
  removeLineItem,
  setLineQty,
  cartItemCount,
} from '../src/lib/cartStorage.js';

describe('cartStorage (shipped pure helpers used by store.js)', () => {
  it('parseStorageList handles empty, corrupt, and non-array JSON', () => {
    assert.deepEqual(parseStorageList(null), []);
    assert.deepEqual(parseStorageList(''), []);
    assert.deepEqual(parseStorageList('{bad'), []);
    assert.deepEqual(parseStorageList('{"nope":true}'), []);
    assert.deepEqual(parseStorageList('[{"productId":"a","qty":2}]'), [{ productId: 'a', qty: 2 }]);
  });

  it('addLineItem increments qty for the same product', () => {
    let list = addLineItem([], 'p1', 2, 1);
    list = addLineItem(list, 'p1', 3, 1);
    assert.equal(list.length, 1);
    assert.equal(list[0].qty, 5);
    assert.equal(cartItemCount(list), 5);
  });

  it('setLineQty respects minimum', () => {
    const list = setLineQty([{ productId: 'p2', qty: 10 }], 'p2', 1, 5);
    assert.equal(list[0].qty, 5);
  });

  it('removeLineItem drops only the matching id', () => {
    const list = removeLineItem(
      [{ productId: 'a', qty: 1 }, { productId: 'b', qty: 2 }],
      'a'
    );
    assert.deepEqual(list.map((i) => i.productId), ['b']);
  });

  it('addLineItem default qty for quote-style calls', () => {
    const list = addLineItem([], 'q1', undefined, 100);
    assert.equal(list[0].qty, 100);
  });
});
