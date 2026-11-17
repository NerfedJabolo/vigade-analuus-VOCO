const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'evidence', 'piletilevi');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'et-EE',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e}`));
  page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.failure()?.errorText} ${r.url()}`));

  await page.goto('https://www.piletilevi.ee/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  for (const t of ['Nõusolek', 'Nõustun', 'Luba kõik', 'Accept']) {
    const b = page.getByRole('button', { name: t, exact: false }).first();
    if (await b.isVisible().catch(() => false)) {
      await b.click().catch(() => {});
      await page.waitForTimeout(1500);
      console.log('clicked cookie', t);
      break;
    }
  }

  const dump = await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    return {
      inputs: [...document.querySelectorAll('input, select, textarea')]
        .filter(visible)
        .map((e) => ({
          type: e.type,
          id: e.id,
          name: e.name,
          placeholder: e.placeholder,
          aria: e.getAttribute('aria-label'),
          cls: String(e.className).slice(0, 70),
        })),
      buttons: [...document.querySelectorAll('button')]
        .filter(visible)
        .map((b) => ({
          text: (b.innerText || '').trim().slice(0, 30),
          aria: b.getAttribute('aria-label'),
          cls: String(b.className).slice(0, 50),
          html: b.outerHTML.slice(0, 130).replace(/\s+/g, ' '),
        })),
      links: [...document.querySelectorAll('a')]
        .filter(visible)
        .slice(0, 60)
        .map((a) => ({ text: (a.innerText || '').trim().slice(0, 40), href: a.getAttribute('href'), aria: a.getAttribute('aria-label') })),
    };
  });
  fs.writeFileSync(path.join(OUT, 'dom-home.json'), JSON.stringify(dump, null, 2));
  fs.writeFileSync(path.join(OUT, 'console-home.log'), logs.join('\n'));
  await page.screenshot({ path: path.join(OUT, 'home-1440.png') });
  console.log('INPUTS', JSON.stringify(dump.inputs, null, 1));
  console.log('BUTTONS', JSON.stringify(dump.buttons, null, 1).slice(0, 3000));
  await browser.close();
})();
