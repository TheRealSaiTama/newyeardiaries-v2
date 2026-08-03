const fs = require('fs');
const path = require('path');

const CSV_PATH = process.argv[2] || 'wc-product-export-2-8-2026-1785685087657.csv';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
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
      } else if (c === '"') {
        inQ = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') {
        row.push(cur);
        cur = '';
      } else if (c === '\n' || (c === '\r' && n === '\n')) {
        if (c === '\r') i++;
        row.push(cur);
        cur = '';
        if (row.some((x) => x.trim() !== '')) rows.push(row);
        row = [];
      } else if (c !== '\r') {
        cur += c;
      }
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    if (row.some((x) => x.trim() !== '')) rows.push(row);
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
    .slice(0, 120) || 'product';
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseImages(cell) {
  if (!cell) return [];
  return cell
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

function parseCategories(cell) {
  if (!cell) return [];
  return cell
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((path) => {
      const parts = path.split('>').map((p) => p.trim());
      return parts[parts.length - 1];
    });
}

function col(headers, row, name) {
  const i = headers.indexOf(name);
  if (i < 0) {
    const bom = headers.findIndex((h) => h.replace(/^\uFEFF/, '') === name);
    return bom >= 0 ? row[bom] || '' : '';
  }
  return row[i] || '';
}

async function sb(method, tablePath, { query, body } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${tablePath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
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
    const err = new Error(typeof data === 'object' ? JSON.stringify(data) : String(data));
    err.status = res.status;
    throw err;
  }
  return data;
}

async function main() {
  const raw = fs.readFileSync(path.resolve(CSV_PATH), 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) {
    console.error('No data rows');
    process.exit(1);
  }
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, ''));
  console.log('CSV rows:', rows.length - 1, 'cols:', headers.length);

  const existing = await sb('GET', 'products', {
    query: { select: 'slug,sku', limit: '10000' },
  });
  const existingSlugs = new Set((existing || []).map((p) => String(p.slug || '').toLowerCase()));
  const existingSkus = new Set(
    (existing || []).map((p) => String(p.sku || '').toLowerCase()).filter(Boolean)
  );
  console.log('Existing products in Supabase:', existingSlugs.size);

  const cats = await sb('GET', 'categories', {
    query: { select: 'id,name,slug', limit: '1000' },
  });
  const catByName = new Map();
  const catBySlug = new Map();
  for (const c of cats || []) {
    if (c.name) catByName.set(String(c.name).toLowerCase(), c);
    if (c.slug) catBySlug.set(String(c.slug).toLowerCase(), c);
  }

  const toInsert = [];
  const usedSlugs = new Set(existingSlugs);
  let skippedPublished = 0;
  let skippedDup = 0;
  let skippedType = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 5) continue;
    const type = col(headers, r, 'Type').toLowerCase().trim();
    if (type && type !== 'simple' && type !== 'variable' && type !== 'variation') {
      if (!col(headers, r, 'Name')) {
        skippedType++;
        continue;
      }
    }
    if (type === 'variation') {
      skippedType++;
      continue;
    }

    const published = col(headers, r, 'Published');
    if (published !== '' && published !== '1') {
      skippedPublished++;
      continue;
    }

    const name = col(headers, r, 'Name').trim();
    if (!name) continue;

    const sku = col(headers, r, 'SKU').trim() || null;
    let slug = slugify(name);
    if (usedSlugs.has(slug)) {
      if (sku && existingSkus.has(sku.toLowerCase())) {
        skippedDup++;
        continue;
      }
      if (existingSlugs.has(slug)) {
        skippedDup++;
        continue;
      }
      let n = 2;
      while (usedSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }

    if (sku && existingSkus.has(sku.toLowerCase())) {
      skippedDup++;
      continue;
    }

    const regular = parseFloat(col(headers, r, 'Regular price')) || 0;
    const sale = parseFloat(col(headers, r, 'Sale price')) || 0;
    let price = regular || sale || 0;
    let original = null;
    if (sale > 0 && regular > sale) {
      price = sale;
      original = regular;
    } else if (regular > 0) {
      price = regular;
    }

    const images = parseImages(col(headers, r, 'Images'));
    const shortDesc = stripHtml(col(headers, r, 'Short description'));
    const desc = col(headers, r, 'Description') || null;
    const tags = col(headers, r, 'Tags') || null;
    const inStock = col(headers, r, 'In stock?') !== '0';
    const stockQty = parseInt(col(headers, r, 'Stock'), 10);
    const minQty = parseInt(col(headers, r, 'Meta: _wcmmq_min_qty'), 10);
    const catNames = parseCategories(col(headers, r, 'Categories'));

    let categoryId = null;
    for (const cn of catNames) {
      const hit =
        catByName.get(cn.toLowerCase()) ||
        catBySlug.get(slugify(cn));
      if (hit) {
        categoryId = hit.id;
        break;
      }
    }

    usedSlugs.add(slug);
    if (sku) existingSkus.add(sku.toLowerCase());

    toInsert.push({
      name,
      slug,
      sku,
      price,
      original_price: original,
      short_description: shortDesc || null,
      description: desc,
      tags,
      images,
      category_id: categoryId,
      in_stock: inStock,
      stock_quantity: Number.isFinite(stockQty) ? stockQty : 0,
      min_bulk_order: Number.isFinite(minQty) && minQty > 0 ? minQty : 100,
      active: true,
      sort_order: 0,
      _catNames: catNames,
    });
  }

  console.log('To insert:', toInsert.length);
  console.log('Skipped dups:', skippedDup, 'unpublished:', skippedPublished, 'bad type/rows:', skippedType);

  if (!toInsert.length) {
    console.log('Nothing to import.');
    return;
  }

  const batchSize = 25;
  let inserted = 0;
  let failed = 0;
  const junctions = [];

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize).map(({ _catNames, ...p }) => p);
    const meta = toInsert.slice(i, i + batchSize);
    try {
      const data = await sb('POST', 'products', { body: batch });
      const list = Array.isArray(data) ? data : data ? [data] : [];
      inserted += list.length;
      for (let j = 0; j < list.length; j++) {
        const prod = list[j];
        const names = meta[j]?._catNames || [];
        for (const cn of names) {
          const hit = catByName.get(cn.toLowerCase()) || catBySlug.get(slugify(cn));
          if (hit && prod.id) {
            junctions.push({ product_id: prod.id, category_id: hit.id });
          }
        }
      }
      console.log(`Batch ${i / batchSize + 1}: inserted ${list.length}`);
    } catch (e) {
      failed += batch.length;
      console.error(`Batch ${i / batchSize + 1} failed:`, e.message);
      for (const item of batch) {
        try {
          const data = await sb('POST', 'products', { body: item });
          const prod = Array.isArray(data) ? data[0] : data;
          inserted++;
          failed--;
          const names = meta[batch.indexOf(item)]?._catNames || [];
          for (const cn of names) {
            const hit = catByName.get(cn.toLowerCase()) || catBySlug.get(slugify(cn));
            if (hit && prod?.id) {
              junctions.push({ product_id: prod.id, category_id: hit.id });
            }
          }
          console.log('  ok single', item.slug);
        } catch (e2) {
          console.error('  fail', item.slug, e2.message);
        }
      }
    }
  }

  if (junctions.length) {
    const uniq = [];
    const seen = new Set();
    for (const j of junctions) {
      const k = `${j.product_id}|${j.category_id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(j);
    }
    for (let i = 0; i < uniq.length; i += 50) {
      const batch = uniq.slice(i, i + 50);
      try {
        await sb('POST', 'product_categories', { body: batch });
      } catch (e) {
        console.warn('junction batch error', e.message);
      }
    }
    console.log('Category links written:', uniq.length);
  }

  console.log('DONE inserted:', inserted, 'failed:', failed, 'skipped existing:', skippedDup);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
