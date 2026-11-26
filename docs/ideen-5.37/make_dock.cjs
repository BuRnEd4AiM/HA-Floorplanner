/* Beispielbilder für docs/ideen-5.37, Teil 3 (2026-11-26): im Glas-Design die Leisten unten (Szenen und Reiter) nicht mehr als Streifen,
 * der das 3D-Bild kleiner macht, sondern als schwebende, leicht durchsichtige Kapseln, nur so breit wie ihre Knöpfe; das 3D-Bild läuft
 * bis ganz nach unten darunter (der Besitzer: „dass dieser Balken sich als Hintergrund an die Icons schmiegt … kleiner Überstand … leicht
 * durchsichtig“). Nur fürs Foto in die echte Demo (5.37.0) gemalt.
 *   node docs/ideen-5.37/make_dock.cjs <ordner> && python3 docs/ideen-5.37/to_jpg.py <ordner> docs/ideen-5.37 */
const { chromium, devices } = require('playwright');
const path = require('path');
const OUT = process.argv[2];
const demo = 'file://' + path.resolve('demo/floorplan3d-demo.html');

const DOCK = `
  html[data-glass] #stage { overflow: visible; z-index: 0; }
  html[data-glass] main { overflow: visible; }
  html[data-glass] #view { height: calc(100% + var(--dock-h, 0px)) !important; }          /* the 3D picture runs on under the bars */
  html[data-glass] #sceneBar { background: transparent !important; padding: 4px 0 8px !important; display: flex !important; justify-content: center; pointer-events: none; }
  html[data-glass] #sceneBar .sbStrip { pointer-events: auto; width: fit-content; max-width: calc(100% - 24px); padding: 6px; gap: 8px; border-radius: 24px;
    background: var(--dock-bg); border: 1px solid var(--glass-line); -webkit-backdrop-filter: blur(22px) saturate(170%); backdrop-filter: blur(22px) saturate(170%);
    box-shadow: 0 10px 30px rgba(0,0,0,.25), inset 0 1px 0 var(--glass-hi); }
  html[data-glass] #sceneBar .sbStrip > :first-child { margin-left: 0 !important; } html[data-glass] #sceneBar .sbStrip > :last-child { margin-right: 0 !important; }
  html[data-glass] #sceneBar .sbTile { background: rgba(255,255,255,.08); border-color: transparent; box-shadow: none; height: 50px; }
  html[data-glass="light"] #sceneBar .sbTile { background: rgba(255,255,255,.55); }
  html[data-glass] #tabBar { background: var(--dock-bg) !important; -webkit-backdrop-filter: blur(22px) saturate(170%); backdrop-filter: blur(22px) saturate(170%);
    padding: 5px 6px !important; gap: 2px; border-radius: 24px !important; }
  html[data-glass] #tabBar button { padding: 5px 4px; }
  html[data-glass="dark"] { --dock-bg: rgba(24, 26, 36, .48); }
  html[data-glass="light"] { --dock-bg: rgba(255, 255, 255, .5); }
`;

async function shot(b, opts, file, { theme = 'glass', dock = true } = {}) {
  const c = await b.newContext({ locale: 'de-DE', ...opts }); const pg = await c.newPage();
  await pg.addInitScript("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}");
  await pg.goto(demo + '?debug=1&mode=live', { timeout: 180000 });
  await pg.waitForFunction('window.__fp && window.__fp.ready()', null, { timeout: 180000 });
  await pg.waitForTimeout(1500);
  await pg.evaluate((th) => { const s = document.querySelector('#setTheme'); s.value = th; s.dispatchEvent(new Event('change', { bubbles: true })); }, theme);
  await pg.waitForTimeout(2000);
  if (dock) {
    await pg.addStyleTag({ content: DOCK });
    await pg.evaluate(() => {           // how far the picture runs on: the height of the bars below it
      const h = ['#sceneBar', '#tabBar'].map((q) => document.querySelector(q)).filter((e) => e && !e.hidden)
        .reduce((s, e) => s + e.getBoundingClientRect().height + parseFloat(getComputedStyle(e).marginBottom || 0), 0);
      document.documentElement.style.setProperty('--dock-h', `${Math.round(h)}px`);
    });
    await pg.waitForTimeout(2500);
  }
  await pg.screenshot({ path: path.join(OUT, file) });
  await c.close();
}

(async () => {
  const b = await chromium.launch();
  const pc = { viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 };
  await shot(b, pc, '16-leiste-heute.png', { dock: false });
  await shot(b, pc, '17-leiste-neu-dunkel.png');
  await shot(b, pc, '18-leiste-neu-hell.png', { theme: 'glasslight' });
  await shot(b, { ...devices['iPad (gen 7) landscape'] }, '19-leiste-neu-tablet.png');
  await b.close();
})();
