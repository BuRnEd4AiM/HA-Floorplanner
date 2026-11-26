/* Beispielbilder für docs/ideen-5.37 (2026-11-26): die Seite ⚡ Energie fotorealistischer und moderner.
 *   cd demo && npm ci && node build.mjs && cd ..
 *   node docs/ideen-5.37/make_pictures.cjs <ordner>        (braucht <ordner>/house.jpg: das Haus aus der Demo, siehe README)
 *   python3 docs/ideen-5.37/to_jpg.py <ordner> docs/ideen-5.37 */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];
const demo = 'file://' + path.resolve('demo/floorplan3d-demo.html');
const house = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(OUT, 'house.jpg')).toString('base64');
const mock = fs.readFileSync(path.join(__dirname, 'mockup.js'), 'utf8');

async function shot(b, opts, idea, file) {
  const c = await b.newContext({ locale: 'de-DE', ...opts }); const pg = await c.newPage();
  await pg.addInitScript("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}");
  await pg.goto(demo + '?debug=1&mode=live', { timeout: 180000 });
  await pg.waitForFunction('window.__fp && window.__fp.ready()', null, { timeout: 180000 });
  await pg.waitForTimeout(2000);
  await pg.click('#tabBar [data-tab=energy]'); await pg.waitForTimeout(3000);
  if (idea) { await pg.addScriptTag({ content: mock }); await pg.evaluate(([i, h]) => window.__mk(i, h), [idea, house]); await pg.waitForTimeout(1200); }
  await pg.screenshot({ path: path.join(OUT, file) });
  await c.close();
}

(async () => {
  const b = await chromium.launch();
  const pc = { viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 };
  await shot(b, pc, 0, '1-heute.png');
  await shot(b, pc, 1, '2-idee1.png');
  await shot(b, pc, 2, '3-idee2.png');
  await shot(b, { ...devices['iPhone 13'] }, 0, '4-handy-heute.png');
  await shot(b, { ...devices['iPhone 13'] }, 3, '5-idee3.png');
  await b.close();
})();
