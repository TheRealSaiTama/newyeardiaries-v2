const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(js|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = [...walk('src'), ...walk('supabase/functions')];
let n = 0;
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const o = t;
  t = t.replaceAll('\u00e2\u20ac\u00a2', '\u00b7');
  t = t.replaceAll('â€¢', '\u00b7');
  t = t.replaceAll('â†’', '\u2192');
  t = t.replace(/ðŸ[\u0080-\u00ff\u2010-\u202f\u00a0-\u00bf]*/g, '');
  t = t.replace(/â­[\u0080-\u00ff]*/g, '');
  t = t.replace(/ï¸[\u0080-\u00ff]*/g, '');
  t = t.replace(/>\s{2,}/g, '>');
  t = t.replace(/\s{2,}SEO/g, ' SEO');
  t = t.replace(/\s{2,}Tip:/g, ' Tip:');
  t = t.replace(/>\s+Hero Banner/g, '>Hero Banner');
  t = t.replace(/>\s+CTA Section/g, '>CTA Section');
  t = t.replace(/>\s+Trust Badges/g, '>Trust Badges');
  t = t.replace(/>\s+Slider Sect/g, '>Slider Sect');
  t = t.replace(/>\s+Shop by /g, '>Shop by ');
  if (t !== o) {
    fs.writeFileSync(f, t, 'utf8');
    n++;
    console.log('cleaned', f);
  }
}
const s = fs.readFileSync('src/pages/AdminPage.js', 'utf8');
console.log('seo', JSON.stringify(s.match(/.{0,8}SEO.{0,12}/)?.[0]));
console.log('hero', JSON.stringify(s.match(/.{0,8}Hero Banner/)?.[0]));
console.log('price', JSON.stringify(s.match(/<strong>.{1,4}\$\{Number\(p\.price\)/)?.[0]));
console.log('files', n);
