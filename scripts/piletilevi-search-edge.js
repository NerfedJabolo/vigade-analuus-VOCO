const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'evidence', 'piletilevi', 'cases');
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  { id: 'search-percent', q: '%' },
  { id: 'search-quote', q: '"' },
  { id: 'search-amp', q: '&' },
  { id: 'search-xss', q: '<script>alert(1)</script>' },
  { id: 'search-emoji', q: '🎫' },
  { id: 'search-long', q: 'a'.repeat(300) },
  { id: 'search-spaces', q: '   ' },
];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const c of cases) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'et-EE' });
    const page = await ctx.newPage();
    const logs = [];
    page.on('console', (m) => m.type() === 'error' && logs.push(m.text().slice(0, 250)));
    page.on('pageerror', (e) => logs.push('PAGEERROR ' + e));
    page.on('response', (r) => {
      if (r.url().includes('/search')) logs.push(`RESP ${r.status()} ${r.url()}`);
    });
    try {
      await page.goto('https://www.piletilevi.ee/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      await page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll').click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(800);
      const input = page.locator('input[name="searchInput"]').first();
      await input.fill(c.q);
      await input.press('Enter');
      await page.waitForTimeout(6000);
      const info = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 900),
        resultLine: document.body.innerText.match(/Tulemused:[\s\S]{0,200}/)?.[0].replace(/\s+/g, ' '),
        alert: [...document.querySelectorAll('[role=alert]')].map((e) => e.innerText.trim()).slice(0, 5),
      }));
      await page.screenshot({ path: path.join(OUT, `${c.id}.png`) });
      fs.writeFileSync(path.join(OUT, `${c.id}.json`), JSON.stringify({ q: c.q.slice(0, 80), info, logs }, null, 2));
      console.log(`\n### ${c.id} -> ${info.url}\n${(info.resultLine || '').slice(0, 180)}\n${info.text.slice(0, 220)}\n${logs.filter(l=>l.startsWith('RESP')||l.startsWith('PAGEERROR')).slice(0,4)}`);
    } catch (e) {
      console.log(`### ${c.id} FAIL ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }
  await browser.close();
})();
