const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || 'wc-product-export-2-8-2026-1785685087657.csv';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') {
        row.push(cur);
        cur = '';
      } else if (c === '\n' || (c === '\r' && n === '\n')) {
        if (c === '\r') i++;
        row.push(cur);
        cur = '';
        if (row.some((x) => x.trim())) rows.push(row);
        row = [];
      } else if (c !== '\r') cur += c;
    }
  }
  if (cur || row.length) {
    row.push(cur);
    if (row.some((x) => x.trim())) rows.push(row);
  }
  return rows;
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function col(headers, row, name) {
  const i = headers.indexOf(name);
  return i < 0 ? '' : row[i] || '';
}

async function sb(table, query) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  const rows = parseCSV(fs.readFileSync(path.resolve(CSV_PATH), 'utf8'));
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, ''));

  const published = [];
  const drafts = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const type = col(headers, r, 'Type').toLowerCase().trim();
    if (type === 'variation') continue;
    const name = col(headers, r, 'Name').trim();
    if (!name) continue;
    const item = {
      name,
      sku: col(headers, r, 'SKU').trim(),
      slug: slugify(name),
      published: col(headers, r, 'Published') === '1',
      hasImages: !!col(headers, r, 'Images').trim(),
      price: col(headers, r, 'Regular price') || col(headers, r, 'Sale price'),
    };
    if (item.published) published.push(item);
    else drafts.push(item);
  }

  const products = await sb('products', { select: 'id,name,slug,sku,images,price,active', limit: '5000' });
  const bySlug = new Map(products.map((p) => [String(p.slug || '').toLowerCase(), p]));
  const bySku = new Map(
    products.filter((p) => p.sku).map((p) => [String(p.sku).toLowerCase(), p])
  );
  const byName = new Map(products.map((p) => [String(p.name || '').toLowerCase(), p]));

  const missing = [];
  const presentNoImage = [];
  const presentZeroPrice = [];
  let matched = 0;

  for (const item of published) {
    const hit =
      bySlug.get(item.slug) ||
      (item.sku && bySku.get(item.sku.toLowerCase())) ||
      byName.get(item.name.toLowerCase());
    if (!hit) {
      missing.push(item);
      continue;
    }
    matched++;
    const imgs = hit.images || [];
    if (!imgs.length) presentNoImage.push({ name: item.name, slug: hit.slug });
    if (!Number(hit.price)) presentZeroPrice.push({ name: item.name, slug: hit.slug });
  }

  const links = await sb('product_categories', { select: 'product_id,category_id', limit: '10000' });
  const cats = await sb('categories', { select: 'id,name,slug', limit: '2000' });

  console.log('=== PRODUCT TRANSFER AUDIT ===');
  console.log('Woo published (simple):', published.length);
  console.log('Woo drafts/unpublished:', drafts.length);
  console.log('Supabase total products:', products.length);
  console.log('Published Woo matched in Supabase:', matched);
  console.log('Published Woo STILL MISSING:', missing.length);
  if (missing.length) {
    missing.forEach((m) => console.log('  MISSING', m.name, m.sku || '', m.slug));
  }
  console.log('Matched but no images[]:', presentNoImage.length);
  if (presentNoImage.length && presentNoImage.length <= 15) {
    presentNoImage.forEach((m) => console.log('  NOIMG', m.name));
  }
  console.log('Matched but price 0:', presentZeroPrice.length);
  console.log('Category rows in Supabase:', cats.length);
  console.log('Product-category links:', links.length);
  console.log('=== END ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
