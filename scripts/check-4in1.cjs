const fs = require('fs');
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
const rows = parseCSV(fs.readFileSync('wc-product-export-2-8-2026-1785685087657.csv', 'utf8'));
const h = rows[0].map((x) => x.replace(/^\uFEFF/, ''));
const ci = h.indexOf('Categories');
const ni = h.indexOf('Name');
const pi = h.indexOf('Published');
const only4 = [];
for (let i = 1; i < rows.length; i++) {
  const cats = rows[i][ci] || '';
  if (/4\s*in\s*1/i.test(cats)) {
    only4.push({ name: rows[i][ni], pub: rows[i][pi], cats });
  }
}
console.log('WooCommerce products with 4 in 1 in categories:', only4.length);
only4.forEach((x) => console.log('-', x.pub === '1' ? 'PUB' : 'OFF', x.name));
console.log('---');
console.log(only4.map((x) => x.cats).join('\n---\n'));
