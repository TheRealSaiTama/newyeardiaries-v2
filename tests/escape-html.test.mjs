import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../src/lib/escapeHtml.js';

describe('escapeHtml (shipped)', () => {
  it('escapes HTML special characters used in shop search XSS path', () => {
    assert.equal(
      escapeHtml(`"><img src=x onerror=alert(1)>`),
      '&quot;&gt;&lt;img src=x onerror=alert(1)&gt;'
    );
  });

  it('handles nullish values', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
  });
});
