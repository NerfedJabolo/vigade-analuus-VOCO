// Lõplik tõendite kogumine veaaruande jaoks (17.11.2026).
// Käivitab iga defekti taastootmise ning salvestab ekraanipildi + JSON/logi.
const { chromium } = require('/home/sten/Documents/workspace/apollo-playwright-tests/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const EV = path.join(__dirname, '..', 'evidence', 'final');
fs.mkdirSync(EV, { recursive: true });

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

function save(id, data) {
  fs.writeFileSync(path.join(EV, `${id}.json`), JSON.stringify(data, null, 2));
}

async function newPage(browser, width = 1440) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 500 ? 812 : 900 },
    locale: 'et-EE',
    userAgent: UA,
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => m.type() === 'error' && logs.push(`CONSOLE ${m.text().slice(0, 300)}`));
  page.on('pageerror', (e) => logs.push(`PAGEERROR ${String(e).slice(0, 300)}`));
  page.on('response', (r) => {
    if (r.status() >= 400) logs.push(`HTTP ${r.status()} ${r.url()}`);
  });
  return { ctx, page, logs };
}

async function plConsent(page) {
  await page
    .locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')
    .click({ timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
}

async function elConsent(page) {
  await page.getByText('Luban kõik', { exact: true }).first().click({ force: true, timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function axNodes(ctx, page) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  return nodes;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  /* ===================== PILETILEVI ===================== */
  {
    const { ctx, page, logs } = await newPage(browser);
    await page.goto('https://www.piletilevi.ee/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await plConsent(page);

    // PL-01: nimeta ikoonlingid/nupud
    const nodes = await axNodes(ctx, page);
    const unnamed = nodes
      .filter((n) => ['button', 'link'].includes(n.role?.value) && !(n.name?.value || '').trim() && !n.ignored)
      .map((n) => ({
        role: n.role.value,
        url: (n.properties || []).find((p) => p.name === 'url')?.value?.value || '',
        disabled: (n.properties || []).find((p) => p.name === 'disabled')?.value?.value,
      }))
      .slice(0, 40);
    const headerCart = await page.evaluate(() => {
      const a = document.querySelector('a[data-cy="shopping-cart"], a[href="/checkout"]');
      return a ? { html: a.outerHTML.slice(0, 400), aria: a.getAttribute('aria-label'), text: a.innerText.trim() } : null;
    });
    // tõstame esile headeri ostukorvi ja karusselli nooled
    await page.evaluate(() => {
      const mark = (el, color) => {
        if (!el) return;
        el.style.outline = `4px solid ${color}`;
        el.style.outlineOffset = '2px';
      };
      const cart = document.querySelector('a[data-cy="shopping-cart"], a[href="/checkout"]');
      mark(cart, '#ff0000');
      document.querySelectorAll('button[id^="button-prev"], button[id^="button-next"]').forEach((b) => mark(b, '#ff0000'));
    });
    await page.screenshot({ path: path.join(EV, 'PL-01.png') });
    save('PL-01', { defect: 'Ikoon-nuppudel/lingidel puudub ligipääsetav nimi', url: page.url(), unnamedCount: unnamed.length, unnamed: unnamed.slice(0, 20), headerCart, logs });
    console.log('PL-01 done', unnamed.length, headerCart?.aria);

    // PL-02: uudiskiri, vale e-post
    const email = page.locator('input[name="email"]').first();
    await email.scrollIntoViewIfNeeded();
    await email.fill('abc');
    await page.getByRole('button', { name: 'Liitu', exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(2500);
    const news = await page.evaluate(() => {
      const i = document.querySelector('input[name="email"]');
      const err = [...document.querySelectorAll('[role="alert"], [aria-live], [class*="error"]')]
        .map((e) => ({
          tag: e.tagName,
          role: e.getAttribute('role'),
          live: e.getAttribute('aria-live'),
          text: (e.innerText || '').trim().slice(0, 160),
          html: e.outerHTML.slice(0, 300),
        }))
        .filter((e) => e.text);
      return {
        input: {
          type: i?.type,
          ariaInvalid: i?.getAttribute('aria-invalid'),
          ariaDescribedby: i?.getAttribute('aria-describedby'),
          labels: i?.labels?.length,
          placeholder: i?.placeholder,
        },
        errors: err.slice(0, 6),
      };
    });
    await page.screenshot({ path: path.join(EV, 'PL-02.png') });
    save('PL-02', { defect: 'Uudiskirja e-posti väli ja veateade ei ole programmiliselt seotud', url: page.url(), ...news, logs });
    console.log('PL-02 done', JSON.stringify(news.input));

    // PL-03: ühemärgiline otsing
    await page.goto('https://www.piletilevi.ee/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await plConsent(page);
    const si = page.locator('input[name="searchInput"]').first();
    await si.fill('a');
    await si.press('Enter');
    await page.waitForTimeout(2500);
    const oneChar = await page.evaluate(() => ({
      url: location.href,
      body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
      alerts: [...document.querySelectorAll('[role="alert"]')].map((e) => e.innerText.trim()).slice(0, 4),
    }));
    await page.screenshot({ path: path.join(EV, 'PL-03.png') });
    save('PL-03', { defect: 'Ühemärgiline otsing ei anna tagasisidet', input: 'a', ...oneChar, logs });
    console.log('PL-03 done', oneChar.url);

    // PL-04: koguse miinus 0 juures
    await page.goto('https://www.piletilevi.ee/piletid/3LPYQWSSXS/tonis-magi-kontsert-jaljed', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await plConsent(page);
    const row = page.locator('[data-cy="ticket-type"]').first();
    await row.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const dec = row.locator('[data-cy="decrement-button"]');
    const beforeQty = (await row.innerText()).replace(/\s+/g, ' ');
    const decDisabled = await dec.isDisabled();
    await dec.click({ force: true });
    await page.waitForTimeout(700);
    const afterQty = (await row.innerText()).replace(/\s+/g, ' ');
    await page.screenshot({ path: path.join(EV, 'PL-04.png') });
    save('PL-04', { defect: 'Koguse miinusnupp on 0 juures aktiivne, kuid ei tee midagi', decDisabled, beforeQty, afterQty, logs });
    console.log('PL-04 done', decDisabled, '|', beforeQty, '|', afterQty);

    // PL-05: duplikaatne date parameeter
    await page.goto('https://www.piletilevi.ee/search?query=kontsert', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await plConsent(page);
    await page.getByRole('button', { name: /Toimumise aeg/ }).click();
    await page.waitForTimeout(700);
    await page.getByRole('radio', { name: 'Täna', exact: true }).click({ force: true });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Näita', exact: true }).click();
    await page.waitForTimeout(3500);
    const filterUrl = page.url();
    await page.screenshot({ path: path.join(EV, 'PL-05.png') });
    save('PL-05', { defect: 'Filtri rakendamisel tekib URL-i duplikaatne date parameeter', url: filterUrl, logs });
    console.log('PL-05 done', filterUrl);

    await ctx.close();
  }

  /* ===================== ELISA ===================== */
  {
    const { ctx, page, logs } = await newPage(browser);
    await page.goto('https://www.elisa.ee/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await elConsent(page);

    // EL-01: Enter ei käivita otsingut
    const input = page.locator('#eds-input-native-0').first();
    await input.click({ force: true });
    await input.fill('iphone');
    await page.waitForTimeout(2200);
    const beforeUrl = page.url();
    const overlayVisible = await page.evaluate(() => {
      const el = [...document.querySelectorAll('a')].find((a) => /Veel tulemusi/.test(a.innerText || ''));
      return !!(el && el.getBoundingClientRect().width > 0);
    });
    await input.press('Enter');
    await page.waitForTimeout(2200);
    const afterUrl = page.url();
    const afterEnter = await page.evaluate(() => ({
      url: location.href,
      overlay: !![...document.querySelectorAll('a')].find((a) => /Veel tulemusi/.test(a.innerText || '') && a.getBoundingClientRect().width > 0),
      active: document.activeElement.tagName,
      value: document.querySelector('#eds-input-native-0')?.value,
    }));
    await page.screenshot({ path: path.join(EV, 'EL-01.png') });
    // Tõestame, et "Veel tulemusi..." viib tulemuste lehele
    const more = page.getByText('Veel tulemusi', { exact: false }).first();
    await more.click({ force: true }).catch(() => {});
    await page.waitForTimeout(3500);
    const clickUrl = page.url();
    save('EL-01', { defect: 'Otsinguväljal Enter ei käivita otsingut', beforeUrl, afterUrl, overlayVisible, afterEnter, clickMoreUrl: clickUrl, logs });
    console.log('EL-01 done', beforeUrl, afterUrl, clickUrl);

    // EL-02: skip-link
    await page.goto('https://www.elisa.ee/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await elConsent(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      id: document.activeElement.id,
      text: (document.activeElement.innerText || '').slice(0, 60),
      href: document.activeElement.getAttribute('href'),
      scrollY,
    }));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    const afterFirst = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      id: document.activeElement.id,
      text: (document.activeElement.innerText || '').slice(0, 60),
      href: document.activeElement.getAttribute('href'),
      hash: location.hash,
      scrollY,
    }));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    const afterSecond = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      id: document.activeElement.id,
      href: document.activeElement.getAttribute('href'),
      hash: location.hash,
      scrollY,
    }));
    await page.screenshot({ path: path.join(EV, 'EL-02.png') });
    save('EL-02', { defect: 'Skip-link ei vii põhisisu juurde', firstFocus, afterFirst, afterSecond, logs });
    console.log('EL-02 done', firstFocus, afterFirst, afterSecond);

    // EL-03: tootelehel puudub H1 + üldine title
    await page.goto('https://www.elisa.ee/et/seadmed/eraklient/nutitelefonid/apple/iphone-duo-512gb', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);
    await elConsent(page);
    const product = await page.evaluate(() => ({
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map((h) => h.innerText.trim()),
      h1Count: document.querySelectorAll('h1').length,
      productNameVisible: /Apple iPhone Duo 512GB/.test(document.body.innerText),
      mainStart: (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
    }));
    await page.screenshot({ path: path.join(EV, 'EL-03.png') });
    save('EL-03', { defect: 'Tootelehel puudub H1 ja title on üldine', ...product, logs });
    console.log('EL-03 done', JSON.stringify(product));

    // EL-04: duplikaatsed ID-d
    await page.goto('https://www.elisa.ee/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await elConsent(page);
    const dup = await page.evaluate(() => {
      const count = (id) => document.querySelectorAll('#' + CSS.escape(id)).length;
      return {
        content: count('content'),
        skip: count('skip-to-main-content'),
        contentHtml: [...document.querySelectorAll('#content')].map((e) => e.outerHTML.slice(0, 160)),
        skipHtml: [...document.querySelectorAll('#skip-to-main-content')].map((e) => e.outerHTML.slice(0, 160)),
      };
    });
    await page.screenshot({ path: path.join(EV, 'EL-04.png') });
    save('EL-04', { defect: 'Duplikaatsed ID-d content ja skip-to-main-content', ...dup, logs });
    console.log('EL-04 done', dup.content, dup.skip);

    // EL-05: ostukorvi nupp on ingliskeelse nimega
    const nodes = await axNodes(ctx, page);
    const cart = nodes.find((n) => n.role?.value === 'button' && /Shopping cart/i.test(n.name?.value || ''));
    const cartDom = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button, a')].find((e) => /Shopping cart/i.test(e.getAttribute('aria-label') || ''));
      return b ? { tag: b.tagName, aria: b.getAttribute('aria-label'), html: b.outerHTML.slice(0, 300) } : null;
    });
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button, a')].find((e) => /Shopping cart/i.test(e.getAttribute('aria-label') || ''));
      if (b) {
        b.style.outline = '4px solid #ff0000';
        b.style.outlineOffset = '2px';
      }
    });
    await page.screenshot({ path: path.join(EV, 'EL-05.png') });
    save('EL-05', { defect: 'Ostukorvi nupu aria-label on ingliskeelne', axName: cart?.name?.value, cartDom, logs });
    console.log('EL-05 done', cart?.name?.value, cartDom?.aria);

    // EL-06: otsingu combobox-semantika puudub
    const si = page.locator('#eds-input-native-0').first();
    await si.click({ force: true });
    await si.fill('iphone');
    await page.waitForTimeout(2200);
    const combo = await page.evaluate(() => {
      const i = document.querySelector('#eds-input-native-0');
      const list = [...document.querySelectorAll('[role="listbox"], [role="option"]')].length;
      const popup = [...document.querySelectorAll('div')].find((d) => /Sisulehed/.test(d.innerText || '') && d.getBoundingClientRect().width > 0);
      return {
        role: i?.getAttribute('role'),
        ariaExpanded: i?.getAttribute('aria-expanded'),
        ariaControls: i?.getAttribute('aria-controls'),
        ariaAutocomplete: i?.getAttribute('aria-autocomplete'),
        ariaActivedescendant: i?.getAttribute('aria-activedescendant'),
        ariaLabel: i?.getAttribute('aria-label'),
        placeholder: i?.placeholder,
        listboxOrOptionCount: list,
        popupRole: popup?.getAttribute('role') || null,
      };
    });
    const ax = nodes.filter((n) => /textbox|combobox|listbox|option/.test(n.role?.value || '') && !n.ignored).slice(0, 15).map((n) => ({ role: n.role.value, name: n.name?.value, props: (n.properties || []).map((p) => p.name) }));
    await page.screenshot({ path: path.join(EV, 'EL-06.png') });
    save('EL-06', { defect: 'Otsingu autocomplete puudub combobox-semantika', ...combo, ax, logs });
    console.log('EL-06 done', JSON.stringify(combo));

    await ctx.close();
  }

  await browser.close();
})();
