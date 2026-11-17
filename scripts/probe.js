// Detailne leiuprobe: nähtavad ligipääsetavus- ja paigutusedefektid.
const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'evidence', 'probe');
fs.mkdirSync(OUT, { recursive: true });

const SITES = [
  ['rahvaraamat', 'https://www.rahvaraamat.ee/'],
  ['piletilevi', 'https://www.piletilevi.ee/'],
  ['elisa', 'https://www.elisa.ee/'],
  ['city24', 'https://www.city24.ee/'],
  ['eesti', 'https://www.eesti.ee/'],
];

async function probe(browser, name, url, width) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 500 ? 812 : 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
    locale: 'et-EE',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 250)));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Sulgeme küpsisebänneri, kui nähtav
  for (const sel of [
    'button:has-text("Nõusolek")',
    'button:has-text("Nõustun")',
    'button:has-text("Accept")',
    '#onetrust-accept-btn-handler',
    'button:has-text("Luba kõik")',
  ]) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) {
      await b.click().catch(() => {});
      await page.waitForTimeout(1000);
      break;
    }
  }

  const data = await page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const named = (el) =>
      (el.getAttribute('aria-label') || '').trim() ||
      (el.getAttribute('aria-labelledby') &&
        document.getElementById(el.getAttribute('aria-labelledby'))?.innerText.trim()) ||
      (el.innerText || '').trim() ||
      (el.querySelector('img[alt]:not([alt=""])')?.alt || '').trim() ||
      (el.getAttribute('title') || '').trim();

    const interactive = [...document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]')].filter(vis);
    const unnamed = interactive
      .filter((el) => !named(el))
      .slice(0, 25)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && String(el.className).slice(0, 70)) || '',
        href: el.getAttribute('href')?.slice(0, 60) || '',
        html: el.outerHTML.slice(0, 160).replace(/\s+/g, ' '),
      }));

    const imgsNoAlt = [...document.images]
      .filter((i) => vis(i) && !i.hasAttribute('alt'))
      .slice(0, 20)
      .map((i) => i.currentSrc.slice(-90));

    const ids = [...document.querySelectorAll('[id]')].filter(vis).map((e) => e.id);
    const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

    const overflow = [...document.querySelectorAll('body *')]
      .filter(vis)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, right: r.right };
      })
      .filter((x) => x.right > window.innerWidth + 1)
      .slice(0, 12)
      .map((x) => ({
        tag: x.el.tagName.toLowerCase(),
        cls: (x.el.className && String(x.el.className).slice(0, 60)) || '',
        right: Math.round(x.right),
      }));

    const unlabeledInputs = [...document.querySelectorAll('input, select, textarea')]
      .filter((el) => vis(el) && !['hidden', 'submit', 'button'].includes(el.type))
      .filter((el) => {
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
        if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
        if (el.closest('label')) return false;
        return true;
      })
      .slice(0, 20)
      .map((el) => ({
        type: el.type,
        id: el.id,
        name: el.name,
        placeholder: el.placeholder,
      }));

    return {
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      unnamed,
      imgsNoAlt,
      dupIds,
      overflow,
      unlabeledInputs,
    };
  });

  await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: false }).catch(() => {});
  fs.writeFileSync(path.join(OUT, `${name}-${width}.json`), JSON.stringify({ ...data, errors }, null, 2));
  console.log(`\n===== ${name} @${width} =====`);
  console.log(JSON.stringify(data, null, 1).slice(0, 5000));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [name, url] of SITES) {
    await probe(browser, name, url, 375);
    await probe(browser, name, url, 1440);
  }
  await browser.close();
})();
