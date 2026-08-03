const fs = require('fs');
const path = process.argv[2] || 'wc-product-export-2-8-2026-1785685087657.csv';
const t = fs.readFileSync(path, 'utf8');
const lines = t.split(/\r?\n/).filter(Boolean);
console.log('lines', lines.length);

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const headers = parseCSVLine(lines[0]);
console.log('cols', headers.length);
headers.forEach((h, i) => console.log(i, h));

const row1 = parseCSVLine(lines[1]);
const sample = {};
['ID', 'Type', 'SKU', 'Name', 'Published', 'Short description', 'Description', 'Regular price', 'Sale price', 'Categories', 'Tags', 'Images', 'In stock?', 'Stock', 'Slug'].forEach((k) => {
  const i = headers.indexOf(k);
  if (i >= 0) sample[k] = (row1[i] || '').slice(0, 120);
});
console.log('sample row1', sample);

const types = {};
for (let i = 1; i < lines.length; i++) {
  const r = parseCSVLine(lines[i]);
  const ti = headers.indexOf('Type');
  const t = r[ti] || '?';
  types[t] = (types[t] || 0) + 1;
}
console.log('types', types);
