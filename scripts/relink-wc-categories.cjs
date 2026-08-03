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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function col(headers, row, name) {
  const i = headers.indexOf(name);
  if (i < 0) return '';
  return row[i] || '';
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
      Prefer: prefer || (method === 'POST' ? 'resolution=ignore-duplicates,return=minimal' : 'return=minimal'),
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
  if (!res.ok) {
    throw new Error(typeof data === 'object' ? JSON.stringify(data) : String(data));
  }
  return data;
}

async function main() {
  const rows = parseCSV(fs.readFileSync(path.resolve(CSV_PATH), 'utf8'));
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, ''));

  const products = await sb('GET', 'products', {
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

  const cats = await sb('GET', 'categories', {
    query: { select: 'id,name,slug', limit: '2000' },
  });
  const catByName = new Map();
  const catBySlug = new Map();
  for (const c of cats || []) {
    if (c.name) catByName.set(String(c.name).toLowerCase(), c);
    if (c.slug) catBySlug.set(String(c.slug).toLowerCase(), c);
  }

  const links = [];
  let unmatchedProducts = 0;
  let unmatchedCats = 0;

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

    const leaves = leafCategories(col(headers, r, 'Categories'));
    for (const leaf of leaves) {
      const cat =
        catByName.get(leaf.toLowerCase()) ||
        catBySlug.get(slugify(leaf));
      if (!cat) {
        unmatchedCats++;
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

  console.log('Unique product-category links from CSV:', uniq.length);
  console.log('CSV products not found in Supabase:', unmatchedProducts);
  console.log('Category names not found in Supabase:', unmatchedCats);

  let ok = 0;
  for (let i = 0; i < uniq.length; i += 40) {
    const batch = uniq.slice(i, i + 40);
    try {
      await sb('POST', 'product_categories', {
        body: batch,
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
      ok += batch.length;
      console.log('linked batch', i / 40 + 1, batch.length);
    } catch (e) {
      console.error('batch fail', e.message);
      for (const item of batch) {
        try {
          await sb('POST', 'product_categories', {
            body: item,
            prefer: 'resolution=ignore-duplicates,return=minimal',
          });
          ok++;
        } catch (e2) {
          console.error('  fail', item.product_id, e2.message);
        }
      }
    }
  }

  const four = catBySlug.get('4-in-1-gift-sets') || catByName.get('4 in 1 gift sets');
  if (four) {
    const linked = await sb('GET', 'product_categories', {
      query: {
        select: 'product_id,products(name,slug)',
        category_id: `eq.${four.id}`,
      },
    });
    console.log('4-in-1-gift-sets now has', Array.isArray(linked) ? linked.length : linked, 'products:');
    if (Array.isArray(linked)) {
      linked.forEach((l) => console.log(' -', l.products?.name));
    }
  }

  console.log('DONE links written ~', ok);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
