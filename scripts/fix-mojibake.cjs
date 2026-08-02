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

const binReps = [
  [Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x9a, 0xc2, 0xb9]), Buffer.from([0xe2, 0x82, 0xb9])],
  [Buffer.from([0xc3, 0xa2, 0xe2, 0x82, 0xac, 0xe2, 0x80, 0x9d]), Buffer.from([0xe2, 0x80, 0x94])],
  [Buffer.from([0xc3, 0xa2, 0xe2, 0x82, 0xac, 0xe2, 0x80, 0x9c]), Buffer.from([0xe2, 0x80, 0x93])],
  [Buffer.from([0xc3, 0xa2, 0xe2, 0x82, 0xac, 0xc2, 0xa6]), Buffer.from([0xe2, 0x80, 0xa6])],
  [Buffer.from([0xc3, 0xa2, 0xc2, 0x89, 0xc2, 0xa4]), Buffer.from([0xe2, 0x89, 0xa4])],
  [Buffer.from([0xc3, 0x83, 0xc2, 0x97]), Buffer.from([0xc3, 0x97])],
];

function replaceAllBuf(buf, find, rep) {
  let out = Buffer.alloc(0);
  let i = 0;
  while (i < buf.length) {
    const idx = buf.indexOf(find, i);
    if (idx === -1) {
      out = Buffer.concat([out, buf.subarray(i)]);
      break;
    }
    out = Buffer.concat([out, buf.subarray(i, idx), rep]);
    i = idx + find.length;
  }
  return out;
}

let n = 0;
for (const f of files) {
  let buf = fs.readFileSync(f);
  const orig = buf;
  for (const [a, b] of binReps) {
    if (buf.includes(a)) buf = replaceAllBuf(buf, a, b);
  }
  let t = buf.toString('utf8');
  const o = t;
  t = t
    .split('\u00e2\u201a\u00ac').join('\u20b9')
    .split('â‚¹').join('\u20b9')
    .split('â€”').join('\u2014')
    .split('â€“').join('\u2013')
    .split('â€¦').join('\u2026')
    .split('â‰¤').join('\u2264')
    .split('Ã—').join('\u00d7')
    .split('â€”').join('\u2014')
    .split('â€¦').join('\u2026')
    .split('â€”').join('\u2014');
  if (t !== o || !buf.equals(orig)) {
    fs.writeFileSync(f, t, 'utf8');
    n++;
    console.log('fixed', f);
  }
}

const check = fs.readFileSync('src/pages/AdminPage.js');
const i = check.indexOf(Buffer.from([0xe2, 0x82, 0xb9]));
const j = check.toString('utf8').indexOf('Number(p.price)');
console.log('rupee ok?', i >= 0);
console.log('sample', JSON.stringify(check.toString('utf8').slice(j - 25, j + 15)));
console.log('files fixed', n);
