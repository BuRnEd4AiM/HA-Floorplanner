/* Beispielbilder für docs/ideen-5.37, Teil 2: das Design „Glas (Apple-Stil)“ für die ganze App (theme.js).
 *   node docs/ideen-5.37/make_theme.cjs <ordner>     (braucht <ordner>/house.jpg wie make_pictures.cjs)
 *   python3 docs/ideen-5.37/to_jpg.py <ordner> docs/ideen-5.37 */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];
const demo = 'file://' + path.resolve('demo/floorplan3d-demo.html');
const house = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(OUT, 'house.jpg')).toString('base64');
const theme = fs.readFileSync(path.join(__dirname, 'theme.js'), 'utf8');
const mock = fs.readFileSync(path.join(__dirname, 'mockup.js'), 'utf8');

async function shot(b, opts, file, { tab = null, dark = true, glass = true, energy = false, settings = false, scroll = 0 } = {}) {
  const c = await b.newContext({ locale: 'de-DE', ...opts }); const pg = await c.newPage();
  await pg.addInitScript("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}");
  await pg.goto(demo + '?debug=1&mode=live', { timeout: 180000 });
  await pg.waitForFunction('window.__fp && window.__fp.ready()', null, { timeout: 180000 });
  await pg.waitForTimeout(2000);
  if (tab) { await pg.click(`#tabBar [data-tab=${tab}]`); await pg.waitForTimeout(2500); }
  if (energy) { await pg.addScriptTag({ content: mock }); await pg.evaluate(([h]) => window.__mk(2, h), [house]); }
  if (settings) {
    await pg.click('#settingsBtn'); await pg.waitForTimeout(800);
    await pg.evaluate(() => {
      const sel = document.querySelector('#setTheme'), det = sel.closest('details'); if (det) det.open = true;
      const names = [['holo', 'Hologramm', 'linear-gradient(135deg,#050d1c,#0b3a5c)', false], ['dark', 'Dunkel', '#182028', false], ['light', 'Hell', '#eef1f4', false],
        ['glassd', '🍏 Glas dunkel', 'radial-gradient(60% 70% at 20% 20%,#4b2a8a,transparent 60%),radial-gradient(60% 60% at 80% 80%,#b2456e,transparent 60%),radial-gradient(60% 60% at 85% 15%,#0b5c8f,transparent 60%),#0b0d1a', true],
        ['glassh', '🍏 Glas hell', 'radial-gradient(60% 70% at 20% 20%,#c9b8ff,transparent 60%),radial-gradient(60% 60% at 80% 80%,#ffc2d4,transparent 60%),radial-gradient(60% 60% at 85% 15%,#9fd8ff,transparent 60%),#eef0f7', true]];
      const box = document.createElement('div');
      box.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 4px';
      box.innerHTML = names.map(([k, n, bg, neu]) => `<div style="width:118px;text-align:center;font-size:13px">
        <div style="height:74px;border-radius:14px;background:${bg};border:${k === 'glassd' ? '3px solid #0a84ff' : '1px solid #8886'};position:relative;overflow:hidden;${neu ? 'outline:3px solid #2ea057;outline-offset:3px;' : ''}">
        <div style="position:absolute;left:10px;right:10px;bottom:10px;height:22px;border-radius:8px;background:${k.startsWith('glass') ? (k === 'glassh' ? '#ffffff99' : '#ffffff22') : (k === 'light' ? '#fff' : '#ffffff14')};${k.startsWith('glass') ? 'backdrop-filter:blur(6px);border:1px solid #ffffff55' : ''}"></div></div>
        <div style="margin-top:6px;${k === 'glassd' ? 'font-weight:700' : ''}">${n}${neu ? ' <b style="color:#2ea057">NEU</b>' : ''}</div></div>`).join('');
      sel.style.display = 'none'; sel.after(box);
      for (const e of sel.closest('.row')?.parentElement?.querySelectorAll('*') || []) {   // the second chooser of the same setting: only the new one in the picture
        if (e !== box && !box.contains(e) && !e.contains(box) && e.querySelectorAll('button').length >= 3 && /Hologramm/.test(e.textContent)) e.style.display = 'none';
      }
      const hint = document.createElement('div'); hint.style.cssText = 'font-size:12px;opacity:.75;margin-bottom:8px';
      hint.textContent = 'Glas: Karten und Leisten wie Milchglas, darunter ein ruhiges Farbbild (wie bei Apple). Gilt für die ganze App, Klassisch bleibt wählbar.';
      box.after(hint);
      sel.closest('.row')?.scrollIntoView({ block: 'center' });
    });
  }
  if (glass) {
    await pg.addScriptTag({ content: theme });
    await pg.evaluate((d) => window.__glass(d), dark);
    if (scroll) await pg.evaluate((s) => { const p = document.querySelector('[data-page].on, [data-page]:not([hidden])'); let x = p; while (x && x.scrollHeight <= x.clientHeight + 5) x = x.parentElement; if (x) x.scrollTop = s; }, scroll);
  }
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => window.__mkMark?.()); await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(OUT, file) });
  await c.close();
}

(async () => {
  const b = await chromium.launch();
  const pc = { viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 };
  const only = process.argv[3];
  const jobs = [
    ['6-einstellung', pc, { settings: true, glass: false }],
    ['7-haus-glas', pc, {}],
    ['8-heute-glas', pc, { tab: 'today' }],
    ['9-energie-glas', pc, { tab: 'energy', energy: true }],
    ['10-heute-glas-hell', pc, { tab: 'today', dark: false }],
    ['11-handy-glas', { ...devices['iPhone 13'] }, {}],
    ['12-handy-glas-hell', { ...devices['iPhone 13'] }, { dark: false }],
  ];
  for (const [f, o, x] of jobs) if (!only || f.startsWith(only)) await shot(b, o, f + '.png', x);
  await b.close();
})();
