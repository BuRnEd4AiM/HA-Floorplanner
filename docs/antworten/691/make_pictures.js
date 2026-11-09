/* The pictures of the answer to #691 (a basement half out of the ground: one spot height in "Plot" → "⛰ Terrain"), in English as the
 * question: the demo (demo/floorplan3d-demo.html) with the issue's numbers: storey height 2.75 m, one spot height at −1.50 m.
 *   NODE_PATH=$(npm root -g) node docs/antworten/691/make_pictures.js <output folder>      (Playwright) */
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || __dirname;
const DEMO = 'file://' + path.resolve(__dirname, '../../../demo/floorplan3d-demo.html') + '?debug=1&skytime=12:30&mode=edit';
const CAM = [-19, -0.6, -15, 6, 1.5];                // from the front left corner, a little under the ground floor
const MARK = `(() => { window.mark = (sel, n) => { const e = document.querySelector(sel); if (!e) return false; e.scrollIntoView({ block: 'nearest' });
  const r = e.getBoundingClientRect(), o = document.createElement('div'), b = document.createElement('div');
  Object.assign(o.style, { position: 'fixed', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px',
    border: '4px solid #ff3b6b', borderRadius: '10px', zIndex: 2147483646, pointerEvents: 'none', boxShadow: '0 0 0 3px rgba(0,0,0,.35)' });
  b.textContent = n;
  Object.assign(b.style, { position: 'fixed', left: r.left - 22 + 'px', top: r.top - 22 + 'px', width: '34px', height: '34px', borderRadius: '50%',
    display: 'grid', placeItems: 'center', background: '#ff3b6b', color: '#fff', font: '800 20px system-ui, sans-serif', zIndex: 2147483647,
    border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,.5)' });
  document.body.append(o, b); return true; }; })()`;

async function page(b, prep) {
  const pg = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: 'en-US', deviceScaleFactor: 1.5 });
  pg.on('pageerror', (e) => console.log('PAGEERROR', String(e)));
  await pg.goto(DEMO);
  await pg.waitForFunction('window.__fp && window.__fp.ready()', null, { timeout: 90000 });
  await pg.waitForTimeout(1500);
  await pg.evaluate((pts) => { const L = window.__fp.layout; L.storeyHeight = 2.75; L.plot.areas = []; L.neighbors = [];
    if (pts) L.plot.terrain = { points: pts, contours: 0.5 }; else delete L.plot.terrain; window.__fp.rebuild(); }, prep);
  await pg.evaluate(MARK);
  return pg;
}
async function house(pg, file) {
  await pg.evaluate(() => window.__fp.setHouseMode(true));
  await pg.addStyleTag({ content: '.floorCard, #floorCards, .houseCards { display: none !important }' });
  await pg.waitForTimeout(1200);
  await pg.evaluate((c) => window.__fp.camAt(...c), CAM);
  await pg.waitForTimeout(2000);
  await pg.screenshot({ path: file, clip: { x: 150, y: 290, width: 940, height: 560 } });
}

(async () => {
  const b = await chromium.launch();
  // 1: the storey height, floor to floor (2.50 m wall + 0.25 m ceiling)
  let pg = await page(b, null);
  await pg.evaluate(() => window.__fp.switchFloor(0));
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { const d = document.querySelector('#floorPanel'); if (d) d.open = true; });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => { document.querySelector('#storeyHeight').scrollIntoView({ block: 'center' }); });
  await pg.waitForTimeout(400);
  console.log('storey', await pg.evaluate(() => window.mark('#storeyHeight', '1')));
  await pg.screenshot({ path: `${OUT}/1-storey-height.png` });
  await pg.close();
  // 2: "Plot" → "⛰ Terrain", one tap in the plan, its height −1.50 m
  pg = await page(b, null);
  await pg.evaluate(() => window.__fp.switchFloor(1));
  await pg.click('#view2d'); await pg.waitForTimeout(800);
  await pg.click('#tools [data-tool=plot]'); await pg.waitForTimeout(600);
  await pg.click('#plotMode [data-v=terrain]'); await pg.waitForTimeout(600);
  const [px, py] = await pg.evaluate(() => window.__fp.plan().toClient(5, -3));
  await pg.mouse.click(px, py); await pg.waitForTimeout(800);
  const inp = pg.locator('#terrainList input[id^=terrainH_]').first();
  await inp.fill('-1.5'); await inp.dispatchEvent('change'); await inp.blur();
  await pg.waitForTimeout(1200);
  console.log('terrain', await pg.evaluate(() => [window.__fp.terrainAt(0, 0), window.__fp.terrainAt(20, 10)]));
  await pg.evaluate(() => { window.mark('#tools [data-tool=plot]', '2'); window.mark('#plotMode [data-v=terrain]', '3'); window.mark('#terrainList input[id^=terrainH_]', '4'); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: `${OUT}/2-terrain-one-point.png` });
  await pg.close();
  // 3: before and after in 3D
  pg = await page(b, null); await house(pg, `${OUT}/before.png`); await pg.close();
  pg = await page(b, [{ id: 'tp1', x: 5, z: -3, h: -1.5 }]); await house(pg, `${OUT}/after.png`); await pg.close();
  await b.close();
})();
