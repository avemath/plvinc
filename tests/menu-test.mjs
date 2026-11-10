// Menu test: checks the header menu in a real browser against a running copy of the site.
//
// What it checks:
//   - Services is split in two: the word is a link to /services and a separate arrow
//     button (aria-expanded, aria-controls, "Show Services menu") opens the list. The
//     other groups (Who we help, About) keep their plain button.
//   - Keyboard: Tab reaches the word then the arrow; Enter on the word goes to /services;
//     Enter/Space on the arrow opens and closes the list; arrow keys, Home/End and Escape
//     inside the list; left/right between the top items.
//   - Mouse hover still opens the list on a desktop; clicking the word goes to /services.
//   - Touch: tapping the word goes to /services, tapping the arrow opens the list, on a
//     tablet-width desktop menu and in the phone menu.
//   - Services stays highlighted on /services and on every service page, and not elsewhere.
//   - From 375 to 1440 pixels wide: the arrow's tap area is at least 44x44, the header
//     stays 77px tall on one line, and the page never scrolls sideways.
//
// How to run it: build the site and start the preview (npm run build, then npm run preview
// -- --port 4322), then in a second terminal:
//   npm run test:menu                              (tests http://localhost:4322)
//   npm run test:menu -- http://localhost:4321     (or any other address)
// It needs Playwright's Chromium once per computer: npx playwright-core install chromium-headless-shell
// Exits with 0 when every check passes and 1 when any fails, listing each failure.
import { chromium } from 'playwright-core';

const base = (process.argv[2] || 'http://localhost:4322').replace(/\/$/, '');
const browser = await chromium.launch();
let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra); } };
const open = async (opts, path = '/') => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...opts });
  await ctx.route(/tradingview/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { ctx, page, errs };
};
const path = (p) => new URL(p.url()).pathname.replace(/\.html$/, '');
const active = (p) => p.evaluate(() => { const a = document.activeElement; return a.getAttribute('aria-label') || a.textContent.trim(); });
const expanded = (p, sel = '.nav-chevron') => p.getAttribute(sel, 'aria-expanded');

// ── Markup ──
{
  const { ctx, page, errs } = await open({ viewport: { width: 1280, height: 800 } });
  const m = await page.evaluate(() => {
    const li = document.querySelector('.nav-item.is-split');
    const a = li?.querySelector(':scope > a.nav-parent-link'); const b = li?.querySelector(':scope > button.nav-chevron');
    return {
      splits: document.querySelectorAll('.nav-item.is-split').length,
      href: a?.getAttribute('href'), text: a?.textContent.trim(),
      bType: b?.type, label: b?.getAttribute('aria-label'), exp: b?.getAttribute('aria-expanded'),
      controls: b?.getAttribute('aria-controls'), target: !!document.getElementById(b?.getAttribute('aria-controls') || 'x'),
      plain: [...document.querySelectorAll('.nav-item.has-sub:not(.is-split) > .nav-trigger')].map((t) => t.textContent.trim()),
      plainLinks: document.querySelectorAll('.nav-item.has-sub:not(.is-split) > a').length,
    };
  });
  ok(m.splits === 1, 'exactly one split item', m.splits);
  ok(m.href === '/services' && m.text === 'Services', 'Services word is a link to /services', JSON.stringify(m));
  ok(m.bType === 'button' && m.label === 'Show Services menu' && m.exp === 'false', 'arrow is a labelled collapsed button', JSON.stringify(m));
  ok(m.controls === 'nav-sub-services' && m.target, 'arrow aria-controls points at the list');
  ok(m.plain.join('|') === 'Who we help|About' && m.plainLinks === 0, 'other groups keep their plain button', JSON.stringify(m.plain));

  // Keyboard: Tab order
  await page.focus('.nav-logo');
  const seq = [];
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); seq.push(await active(page)); }
  ok(seq.join('|') === 'Services|Show Services menu|Who we help|Sample work|About', 'Tab: link, then arrow, then the rest', seq.join('|'));

  // Enter / Space on the arrow
  await page.focus('.nav-chevron');
  await page.keyboard.press('Enter');
  ok(await expanded(page) === 'true' && await page.isVisible('#nav-sub-services'), 'Enter on arrow opens');
  await page.keyboard.press('Space');
  ok(await expanded(page) === 'false' && !(await page.isVisible('#nav-sub-services')), 'Space on arrow closes');
  await page.keyboard.press('Space');
  ok(await expanded(page) === 'true', 'Space on arrow opens');
  ok(path(page) === '/', 'arrow does not navigate');

  // Arrow keys and Escape inside the list
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  const first = await active(page);
  ok(first === 'Title Research & Curative' && await expanded(page) === 'true', 'ArrowDown on arrow opens and focuses first link', first);
  await page.keyboard.press('ArrowDown');
  ok(await active(page) === 'Lease Acquisition & Negotiation', 'ArrowDown moves down');
  await page.keyboard.press('End');
  ok((await active(page)).startsWith('All services'), 'End goes to last link');
  await page.keyboard.press('ArrowDown');
  ok(await active(page) === 'Title Research & Curative', 'ArrowDown wraps');
  await page.keyboard.press('ArrowUp');
  ok((await active(page)).startsWith('All services'), 'ArrowUp wraps');
  await page.keyboard.press('Home');
  ok(await active(page) === 'Title Research & Curative', 'Home goes to first link');
  await page.keyboard.press('Escape');
  ok(await expanded(page) === 'false' && await active(page) === 'Show Services menu', 'Escape closes and returns to the arrow');

  // Left / right between top items
  await page.focus('.nav-parent-link');
  await page.keyboard.press('ArrowRight');
  ok(await active(page) === 'Who we help', 'ArrowRight from the word goes to the next item');
  await page.keyboard.press('ArrowLeft');
  ok(await active(page) === 'Services', 'ArrowLeft lands on the Services word');
  await page.focus('.nav-chevron');
  await page.keyboard.press('ArrowRight');
  ok(await active(page) === 'Who we help', 'ArrowRight from the arrow goes to the next item');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  ok(await active(page) === 'Contact' || (await active(page)) === 'About', 'ArrowLeft wraps to the last item', await active(page));

  // A plain group still works by keyboard
  await page.focus('#nav-trigger-group-0');
  await page.keyboard.press('Enter');
  ok(await expanded(page, '#nav-trigger-group-0') === 'true', 'Who we help button still opens with Enter');
  await page.keyboard.press('Escape');

  // Hover still opens on desktop
  await page.hover('.nav-parent-link');
  await page.waitForTimeout(100);
  ok(await expanded(page) === 'true', 'hover over the word opens the list');
  await page.mouse.move(640, 600); await page.waitForTimeout(400);
  ok(await expanded(page) === 'false', 'leaving closes the list');
  await page.hover('.nav-chevron'); await page.click('.nav-chevron');
  ok(await expanded(page) === 'true', 'click on arrow after hover keeps it open');

  // Enter on the link navigates
  await page.focus('.nav-parent-link');
  await Promise.all([page.waitForURL(/\/services(\.html)?$/), page.keyboard.press('Enter')]);
  ok(path(page) === '/services', 'Enter on the word goes to /services');

  // Mouse click on the word navigates
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  await Promise.all([page.waitForURL(/\/services(\.html)?$/), page.click('.nav-parent-link')]);
  ok(path(page) === '/services', 'click on the word goes to /services');
  ok(errs.length === 0, 'no page errors (desktop)', errs.join(';'));
  await ctx.close();
}

// ── Current-page highlighting ──
{
  const { ctx, page } = await open({ viewport: { width: 1280, height: 800 } }, '/services');
  const svc = await page.$$eval('.nav-sub a[href^="/services/"]', (as) => as.map((a) => a.getAttribute('href')));
  const st = () => page.evaluate(() => ({ cur: document.querySelector('.nav-item.is-split').classList.contains('is-current'), ac: document.querySelector('.nav-parent-link').getAttribute('aria-current'), u: getComputedStyle(document.querySelector('.nav-parent-link'), '::after').transform }));
  let s = await st();
  ok(s.cur && s.ac === 'page' && s.u !== 'matrix(0, 0, 0, 1, 0, 0)', 'on /services: highlighted, aria-current=page', JSON.stringify(s));
  for (const h of svc) {
    await page.goto(base + h, { waitUntil: 'networkidle' });
    s = await st();
    const sub = await page.getAttribute(`.nav-sub a[href="${h}"]`, 'aria-current');
    ok(s.cur && s.ac === 'true' && sub === 'page', `on ${h}: Services highlighted`, JSON.stringify(s));
  }
  for (const p of ['/', '/about', '/contact']) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    s = await st();
    ok(!s.cur && !s.ac, `on ${p}: Services not highlighted`);
  }
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  ok(await page.evaluate(() => document.querySelector('#nav-trigger-group-2').closest('.nav-item').classList.contains('is-current')), 'About group still highlights on /about');
  await ctx.close();
}

// ── Sizes: arrow tap target and header row at each width ──
for (const w of [375, 414, 600, 768, 860, 861, 880, 900, 941, 1000, 1100, 1120, 1121, 1280, 1440]) {
  const { ctx, page } = await open({ viewport: { width: w, height: 800 } }, '/services');
  if (w <= 860) { await page.click('.nav-toggle'); }
  const r = await page.evaluate(() => {
    const b = document.querySelector('.nav-chevron').getBoundingClientRect();
    const a = document.querySelector('.nav-parent-link').getBoundingClientRect();
    const row = [...document.querySelectorAll('.nav-logo, .nav-actions, .nav-list > li')].filter((e) => e.offsetParent && getComputedStyle(document.querySelector('.nav-menu')).position !== 'absolute');
    return { bw: b.width, bh: b.height, overlap: a.right > b.left + 0.5, sameRow: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) < 1, header: document.querySelector('.site-header').getBoundingClientRect().height, tops: new Set(row.map((e) => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2))).size, sw: document.documentElement.scrollWidth };
  });
  ok(r.bw >= 44 && r.bh >= 44, `${w}: arrow tap target ≥ 44×44`, JSON.stringify(r));
  ok(!r.overlap && r.sameRow, `${w}: word and arrow side by side, not overlapping`, JSON.stringify(r));
  ok(r.header === 77, `${w}: header height unchanged (77)`, r.header);
  ok(r.tops <= 1, `${w}: header row on one line`, JSON.stringify(r));
  ok(r.sw <= w, `${w}: no sideways scroll`, r.sw);
  await ctx.close();
}

// ── Touch: tablet-width desktop menu ──
{
  const { ctx, page } = await open({ viewport: { width: 1000, height: 800 }, hasTouch: true, isMobile: false });
  await page.tap('.nav-chevron');
  ok(await expanded(page) === 'true' && path(page) === '/', 'tablet: tap arrow opens');
  await page.tap('.nav-chevron');
  ok(await expanded(page) === 'false', 'tablet: tap arrow again closes');
  await Promise.all([page.waitForURL(/\/services(\.html)?$/), page.tap('.nav-parent-link')]);
  ok(path(page) === '/services', 'tablet: tap word goes to /services');
  await ctx.close();
}

// ── Phone menu ──
{
  const { ctx, page, errs } = await open({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true }, '/about');
  await page.tap('.nav-toggle');
  ok(await page.getAttribute('.nav-toggle', 'aria-expanded') === 'true', 'phone: menu opens');
  ok(await active(page) === 'Services', 'phone: focus moves to the Services link');
  ok(await expanded(page) === 'false', 'phone: Services group starts closed off its section');
  ok(await expanded(page, '#nav-trigger-group-2') === 'true', 'phone: current group (About) starts open');
  await page.tap('.nav-chevron');
  ok(await expanded(page) === 'true' && await page.isVisible('#nav-sub-services'), 'phone: tap arrow opens the Services group');
  ok(path(page) === '/about', 'phone: arrow does not navigate');
  await page.tap('.nav-chevron');
  ok(await expanded(page) === 'false' && !(await page.isVisible('#nav-sub-services')), 'phone: tap arrow again closes it');
  await page.tap('#nav-trigger-group-0');
  ok(await expanded(page, '#nav-trigger-group-0') === 'true', 'phone: Who we help still a plain toggle');
  await page.keyboard.press('Escape');
  ok(await expanded(page, '#nav-trigger-group-0') === 'false' && await page.getAttribute('.nav-toggle', 'aria-expanded') === 'true', 'phone: Escape in an open group closes the group first');
  await page.keyboard.press('Escape');
  ok(await page.getAttribute('.nav-toggle', 'aria-expanded') === 'false', 'phone: a second Escape closes the menu');
  await page.tap('.nav-toggle');
  await Promise.all([page.waitForURL(/\/services(\.html)?$/), page.tap('.nav-parent-link')]);
  ok(path(page) === '/services', 'phone: tap the Services heading goes to /services');
  await page.tap('.nav-toggle');
  ok(await expanded(page) === 'true', 'phone: on /services the Services group opens with the menu');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.nav-parent-link')).boxShadow.includes('inset')), 'phone: current bar on the Services heading');
  ok(errs.length === 0, 'no page errors (phone)', errs.join(';'));
  await ctx.close();
}

await browser.close();
console.log(`menu test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
