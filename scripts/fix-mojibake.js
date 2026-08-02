const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(js|ts|css|html)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = [...walk('src'), ...walk('supabase/functions')];
if (fs.existsSync('vite.config.js')) files.push('vite.config.js');

const reps = [
  ['\u00e2\u20ac\u00b9', '\u20b9'],
  ['â‚¹', '\u20b9'],
  ['â€”', '\u2014'],
  ['â€“', '\u2013'],
  ['â€¦', '\u2026'],
  ['â‰¤', '\u2264'],
  ['â‰¥', '\u2265'],
  ['Ã—', '\u00d7'],
  ['Ã·', '\u00f7'],
  ['ðŸ”', '\ud83d\udd0d'],
  ['â€™', '\u2019'],
  ['â€˜', '\u2018'],
  ['â€œ', '\u201c'],
  ['â€\u009d', '\u201d'],
  ['â€', '\u201d'],
  ['Â·', '\u00b7'],
  ['Â', ''],
];

let n = 0;
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const o = t;
  for (const [a, b] of reps) {
    if (t.includes(a)) t = t.split(a).join(b);
  }
  if (t.includes('\u00e2\u201a\u00ac')) {
    t = t.split('\u00e2\u201a\u00ac').join('\u20b9');
  }
  if (t !== o) {
    fs.writeFileSync(f, t, 'utf8');
    n++;
    console.log('fixed', f);
  }
}

const s = fs.readFileSync('src/pages/AdminPage.js', 'utf8');
const m = s.match(/.{0,20}toLocaleString\(\).{0,10}/);
console.log('sample:', m ? JSON.stringify(m[0]) : 'no match');
console.log('files fixed', n);
