const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'evidence', 'piletilevi', 'flows');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'et-EE' });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => m.type() === 'error' && logs.push(m.text().slice(0, 250)));
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e));
  await page.goto('https://www.piletilevi.ee/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll').click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // 1. Newsletter form inspection
  const footer = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[name="email"]')];
    return inputs.map((i) => {
      const form = i.closest('form');
      return {
        outer: i.outerHTML.slice(0, 250),
        form: form ? form.outerHTML.slice(0, 900) : null,
        labels: i.labels ? [...i.labels].map((l) => l.innerText.trim()) : [],
      };
    });
  });
  fs.writeFileSync(path.join(OUT, 'newsletter-form.json'), JSON.stringify(footer, null, 2));
  console.log('NEWSLETTER FORMS', JSON.stringify(footer, null, 1).slice(0, 2500));

  // 2. Newsletter invalid email
  const email = page.locator('input[name="email"]').first();
  if (await email.isVisible().catch(() => false)) {
    await email.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'newsletter-before.png') });
    await email.fill('abc');
    const btn = page.locator('button:has-text("Liitu")').first();
    console.log('liitu visible', await btn.isVisible().catch(() => false));
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(2500);
    } else {
      await email.press('Enter');
      await page.waitForTimeout(2500);
    }
    const after = await page.evaluate(() => ({
      url: location.href,
      alerts: [...document.querySelectorAll('[role=alert], .error, [class*=error]')].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 8),
      text: document.body.innerText.replace(/\s+/g, ' ').slice(-700),
      emailValid: document.querySelector('input[name="email"]')?.checkValidity(),
      validationMessage: document.querySelector('input[name="email"]')?.validationMessage,
    }));
    fs.writeFileSync(path.join(OUT, 'newsletter-invalid.json'), JSON.stringify(after, null, 2));
    await page.screenshot({ path: path.join(OUT, 'newsletter-invalid.png') });
    console.log('NEWSLETTER AFTER', JSON.stringify(after, null, 1).slice(0, 1200));
  }
  await browser.close();
})();
