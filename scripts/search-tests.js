const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'evidence', 'search');
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  { site: 'rahvaraamat', url: 'https://www.rahvaraamat.ee/', sel: '#search', q: 'raamat' },
  { site: 'rahvaraamat', url: 'https://www.rahvaraamat.ee/', sel: '#search', q: 'zxqwq' },
  { site: 'rahvaraamat', url: 'https://www.rahvaraamat.ee/', sel: '#search', q: '' },
  { site: 'piletilevi', url: 'https://www.piletilevi.ee/', sel: 'input[name="searchInput"]', q: 'kontsert' },
  { site: 'piletilevi', url: 'https://www.piletilevi.ee/', sel: 'input[name="searchInput"]', q: 'zxqwq' },
  { site: 'piletilevi', url: 'https://www.piletilevi.ee/', sel: 'input[name="searchInput"]', q: '' },
];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const c of cases) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'et-EE' });
    const page = await ctx.newPage();
    const logs = [];
    page.on('console', (m) => m.type() === 'error' && logs.push(m.text().slice(0, 200)));
    page.on('pageerror', (e) => logs.push(`PAGEERROR ${e}`));
    const name = `${c.site}-q-${c.q || 'empty'}`;
    try {
      await page.goto(c.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2500);
      // cookies
      if (c.site === 'rahvaraamat') {
        await page.getByRole('button', { name: 'Luba kõik' }).click({ timeout: 3000 }).catch(() => {});
      } else {
        await page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll').click({ timeout: 3000 }).catch(() => {});
      }
      await page.waitForTimeout(1000);
      await page.locator(c.sel).first().fill(c.q);
      await page.locator(c.sel).first().press('Enter');
      await page.waitForTimeout(5000);
      const info = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 700),
        h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.trim()),
        countText: [...document.querySelectorAll('*')]
          .filter((e) => e.children.length === 0 && /\d+\s*(toodet|tulemust|üritust|result)/i.test(e.innerText || ''))
          .slice(0, 5)
          .map((e) => e.innerText.trim()),
      }));
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ info, logs }, null, 2));
      console.log(`\n### ${name}\n${info.url}\n${info.title}\nH1: ${info.h1}\n${info.body.slice(0, 300)}\nlogs: ${logs.slice(0, 3)}`);
    } catch (e) {
      console.log(`\n### ${name} FAILED: ${e.message.split('\n')[0]}`);
    }
    await ctx.close();
  }
  await browser.close();
})();
