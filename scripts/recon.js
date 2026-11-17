// Kiire luure: laeb kandidaatlehed, kogub konsooli-/võrguvigu ja põhimõõdikud.
const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'evidence', 'recon');
fs.mkdirSync(OUT, { recursive: true });

const SITES = [
  ['automationexercise', 'https://automationexercise.com/'],
  ['demoqa', 'https://demoqa.com/'],
  ['rahvaraamat', 'https://www.rahvaraamat.ee/'],
  ['piletilevi', 'https://www.piletilevi.ee/'],
  ['elisa', 'https://www.elisa.ee/'],
  ['city24', 'https://www.city24.ee/'],
  ['eesti', 'https://www.eesti.ee/'],
];

async function audit(browser, name, url) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
    locale: 'et-EE',
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failed = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
  page.on('requestfailed', (r) =>
    failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 200)}`)
  );

  const started = Date.now();
  let status = null;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = resp ? resp.status() : null;
    await page.waitForTimeout(6000);
  } catch (e) {
    console.log(`${name}: GOTO FAIL ${e.message.split('\n')[0]}`);
    await ctx.close();
    return { name, url, gotoError: e.message.split('\n')[0] };
  }
  const loadMs = Date.now() - started;

  let metrics;
  try {
    metrics = await page.evaluate(() => {
      const all = [...document.querySelectorAll('*')];
      const inputs = [...document.querySelectorAll('input, select, textarea')];
      const unlabeled = inputs.filter((el) => {
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return false;
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
        if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
        if (el.closest('label')) return false;
        return true;
      }).length;
      const imgsNoAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
      const emptyLinks = [...document.querySelectorAll('a')].filter(
        (a) => !a.textContent.trim() && !a.querySelector('img[alt]:not([alt=""])') && !a.getAttribute('aria-label')
      ).length;
      const emptyButtons = [...document.querySelectorAll('button')].filter(
        (b) => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.querySelector('img[alt]:not([alt=""])')
      ).length;
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
      return {
        title: document.title,
        lang: document.documentElement.lang,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
        images: document.images.length,
        imgsNoAlt,
        inputs: inputs.length,
        unlabeled,
        emptyLinks,
        emptyButtons,
        dupIds: dupIds.slice(0, 10),
        bodyText: document.body.innerText.slice(0, 200).replace(/\s+/g, ' '),
      };
    });
  } catch (e) {
    metrics = { error: e.message.split('\n')[0] };
  }

  await page.screenshot({ path: path.join(OUT, `${name}-375.png`), fullPage: false }).catch(() => {});
  const result = { name, url, status, loadMs, metrics, consoleErrors, pageErrors, failed: failed.slice(0, 15) };
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(result, null, 2));
  console.log(
    `\n=== ${name} ${status} ${loadMs}ms ===\n` +
      JSON.stringify(metrics, null, 1) +
      `\nconsoleErrors(${consoleErrors.length}): ${consoleErrors.slice(0, 4).join(' | ')}` +
      `\npageErrors(${pageErrors.length}): ${pageErrors.slice(0, 3).join(' | ')}`
  );
  await ctx.close();
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const out = [];
  for (const [name, url] of SITES) {
    out.push(await audit(browser, name, url));
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(out, null, 2));
})();
