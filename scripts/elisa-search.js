const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'evidence', 'elisa');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'et-EE' });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => m.type() === 'error' && logs.push(m.text().slice(0, 250)));
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e));
  await page.goto('https://www.elisa.ee/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const input = page.locator('#eds-input-native-0').first();
  console.log('search visible', await input.isVisible().catch(() => false));
  await input.click();
  await input.fill('iphone');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, 'search-suggest.png') });
  const sug = await page.evaluate(() => ({
    text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500),
    links: [...document.querySelectorAll('a')].filter((a) => /iphone/i.test(a.innerText)).slice(0, 10).map((a) => ({ t: a.innerText.trim().slice(0, 60), h: a.getAttribute('href') })),
  }));
  console.log('SUGGEST', JSON.stringify(sug, null, 1).slice(0, 2000));

  await input.press('Enter');
  await page.waitForTimeout(6000);
  const res = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.trim()),
    text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1200),
  }));
  fs.writeFileSync(path.join(OUT, 'search-result.json'), JSON.stringify({ res, logs }, null, 2));
  await page.screenshot({ path: path.join(OUT, 'search-result.png') });
  console.log('RESULT', JSON.stringify(res, null, 1).slice(0, 2000));
  console.log('LOGS', logs.slice(0, 6));
  await browser.close();
})();
