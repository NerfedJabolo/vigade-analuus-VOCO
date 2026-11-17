const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'evidence', 'rahvaraamat');
const logs = [];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'et-EE' });
  const page = await ctx.newPage();
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e}`));
  await page.goto('https://www.rahvaraamat.ee/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: 'Luba kõik' }).click().catch(() => {});
  await page.waitForTimeout(1000);

  const sisene = page.getByText('Sisene', { exact: true }).first();
  console.log('sisene visible', await sisene.isVisible());
  await sisene.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'login-modal.png') });

  const modal = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return {
      url: location.href,
      headings: [...document.querySelectorAll('h1,h2,h3')].filter(vis).map(h => h.innerText.trim()).slice(0, 20),
      inputs: [...document.querySelectorAll('input')].filter(vis).map(i => ({ type: i.type, name: i.name, id: i.id, ph: i.placeholder, aria: i.getAttribute('aria-label') })),
      text: document.body.innerText.slice(0, 1200),
    };
  });
  fs.writeFileSync(path.join(OUT, 'login-modal.json'), JSON.stringify(modal, null, 2));
  console.log(JSON.stringify(modal, null, 1).slice(0, 2500));
  console.log(logs.slice(0, 10));
  await browser.close();
})();
