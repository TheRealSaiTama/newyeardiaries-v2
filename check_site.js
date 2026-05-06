import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  const prices = await page.$$eval('.ap-product-price', els => els.map(e => e.textContent.trim()));
  console.log('Prices:', prices.slice(0, 5));
  
  const categories = await page.$$eval('.ap-cat-heading', els => els.map(e => e.textContent));
  console.log('Categories Heading:', categories);
  
  await browser.close();
})();
