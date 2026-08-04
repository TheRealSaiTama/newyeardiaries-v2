import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const footerSrc = readFileSync(path.resolve('src/components/Footer.js'), 'utf8');

describe('Footer safeMapEmbed (shipped source)', () => {
  it('rejects javascript: map embeds', () => {
    assert.match(footerSrc, /javascript\|data\|vbscript/i);
    assert.match(footerSrc, /function safeMapEmbed/);
  });

  it('links product groups with shop query params not dead /shop only', () => {
    assert.match(footerSrc, /\/shop\?group=Premium%20Diary/);
    assert.match(footerSrc, /\/shop\?group=New%20Year%20Diary/);
    assert.match(footerSrc, /href="\/corporate"/);
  });
});
