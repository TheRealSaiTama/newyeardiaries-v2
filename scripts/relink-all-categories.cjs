const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || 'wc-product-export-2-8-2026-1785685087657.csv';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

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

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function col(headers, row, name) {
  const i = headers.indexOf(name);
  return i < 0 ? '' : row[i] || '';
}

function leafCategories(cell) {
  if (!cell) return [];
  return cell
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((path) => path.split('>').map((p) => p.trim()).pop())
    .filter(Boolean);
}

async function sb(method, tablePath, { query, body, prefer } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tablePath}`);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer || (method === 'POST' ? 'return=representation' : 'return=minimal'),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(typeof data === 'object' ? JSON.stringify(data) : String(data));
  return data;
}

function resolveCat(leaf, catByName, catBySlug, catByNorm) {
  const n = leaf.toLowerCase();
  const s = slugify(leaf);
  const nn = norm(leaf);
  return (
    catByName.get(n) ||
    catBySlug.get(s) ||
    catByNorm.get(nn) ||
    catByName.get(n.replace(/\s+/g, ' ')) ||
    null
  );
}

async function main() {
  const rows = parseCSV(fs.readFileSync(path.resolve(CSV_PATH), 'utf8'));
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, ''));

  let products = await sb('GET', 'products', {
    query: { select: 'id,name,slug,sku', limit: '5000' },
  });
  const bySlug = new Map();
  const bySku = new Map();
  const byName = new Map();
  for (const p of products || []) {
    if (p.slug) bySlug.set(String(p.slug).toLowerCase(), p);
    if (p.sku) bySku.set(String(p.sku).toLowerCase(), p);
    if (p.name) byName.set(String(p.name).toLowerCase(), p);
  }

  let cats = await sb('GET', 'categories', {
    query: { select: 'id,name,slug,group_id', limit: '2000' },
  });
  let catByName = new Map();
  let catBySlug = new Map();
  let catByNorm = new Map();
  function rebuildCatMaps() {
    catByName = new Map();
    catBySlug = new Map();
    catByNorm = new Map();
    for (const c of cats || []) {
      if (c.name) {
        catByName.set(String(c.name).toLowerCase(), c);
        catByNorm.set(norm(c.name), c);
      }
      if (c.slug) catBySlug.set(String(c.slug).toLowerCase(), c);
    }
  }
  rebuildCatMaps();

  const groups = await sb('GET', 'category_groups', {
    query: { select: 'id,name,slug', limit: '200' },
  });
  const groupByNorm = new Map();
  for (const g of groups || []) {
    if (g.name) groupByNorm.set(norm(g.name), g);
  }

  const missingLeafCounts = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const type = col(headers, r, 'Type').toLowerCase().trim();
    if (type === 'variation') continue;
    const published = col(headers, r, 'Published');
    if (published !== '' && published !== '1') continue;
    if (!col(headers, r, 'Name').trim()) continue;
    for (const leaf of leafCategories(col(headers, r, 'Categories'))) {
      if (!resolveCat(leaf, catByName, catBySlug, catByNorm)) {
        missingLeafCounts.set(leaf, (missingLeafCounts.get(leaf) || 0) + 1);
      }
    }
  }

  console.log('Missing category names in Supabase:', missingLeafCounts.size);
  const created = [];
  for (const [leaf, count] of [...missingLeafCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const slug = slugify(leaf);
    if (!slug) continue;
    if (catBySlug.has(slug)) continue;
    try {
      const inserted = await sb('POST', 'categories', {
        body: {
          name: leaf,
          slug,
          active: true,
          sort_order: 0,
        },
        prefer: 'return=representation',
      });
      const cat = Array.isArray(inserted) ? inserted[0] : inserted;
      if (cat?.id) {
        cats.push(cat);
        created.push({ name: leaf, slug, products: count });
        console.log('created category', leaf, '→', slug, `(${count} products)`);
      }
    } catch (e) {
      console.warn('could not create', leaf, e.message);
    }
  }
  rebuildCatMaps();

  const links = [];
  let unmatchedProducts = 0;
  let unmatchedCats = 0;
  const stillMissing = new Map();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const type = col(headers, r, 'Type').toLowerCase().trim();
    if (type === 'variation') continue;
    const published = col(headers, r, 'Published');
    if (published !== '' && published !== '1') continue;

    const name = col(headers, r, 'Name').trim();
    if (!name) continue;
    const sku = col(headers, r, 'SKU').trim();
    const slug = slugify(name);

    const prod =
      bySlug.get(slug) ||
      (sku && bySku.get(sku.toLowerCase())) ||
      byName.get(name.toLowerCase());

    if (!prod) {
      unmatchedProducts++;
      continue;
    }

    for (const leaf of leafCategories(col(headers, r, 'Categories'))) {
      const cat = resolveCat(leaf, catByName, catBySlug, catByNorm);
      if (!cat) {
        unmatchedCats++;
        stillMissing.set(leaf, (stillMissing.get(leaf) || 0) + 1);
        continue;
      }
      links.push({ product_id: prod.id, category_id: cat.id });
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const l of links) {
    const k = l.product_id + '|' + l.category_id;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(l);
  }

  console.log('Unique links to write:', uniq.length);
  console.log('Products not found:', unmatchedProducts);
  console.log('Still missing category names:', stillMissing.size);
  if (stillMissing.size) {
    console.log([...stillMissing.entries()].slice(0, 20));
  }

  let ok = 0;
  for (let i = 0; i < uniq.length; i += 40) {
    const batch = uniq.slice(i, i + 40);
    try {
      await sb('POST', 'product_categories', {
        body: batch,
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
      ok += batch.length;
    } catch (e) {
      for (const item of batch) {
        try {
          await sb('POST', 'product_categories', {
            body: item,
            prefer: 'resolution=ignore-duplicates,return=minimal',
          });
          ok++;
        } catch (_) {}
      }
    }
  }
  console.log('Links upserted ~', ok);

  const counts = await sb('GET', 'product_categories', {
    query: { select: 'category_id', limit: '10000' },
  });
  const byCat = new Map();
  for (const row of counts || []) {
    byCat.set(row.category_id, (byCat.get(row.category_id) || 0) + 1);
  }

  const report = (cats || [])
    .map((c) => ({ name: c.name, slug: c.slug, n: byCat.get(c.id) || 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  console.log('\nCategories with products:');
  for (const r of report) {
    console.log(String(r.n).padStart(3), r.slug, '|', r.name);
  }
  console.log('\nCreated new categories:', created.length);
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
