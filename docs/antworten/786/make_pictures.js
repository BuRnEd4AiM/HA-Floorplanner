/* The pictures of the answer to #786 (the house 65 cm above the lawn: a plateau under the house with outdoor steps at the front door, the
 * garden behind lower with "⛰ Gelände"), in German: the demo (demo/floorplan3d-demo.html) with a terraced house 6 × 10 m put in its place.
 *   NODE_PATH=$(npm root -g) node docs/antworten/786/make_pictures.js <output folder>      (Playwright; PNG, made into JPG afterwards) */
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || __dirname;
const DEMO = 'file://' + path.resolve(__dirname, '../../../demo/floorplan3d-demo.html') + '?debug=1&skytime=13:00';
const CLEAN = '&mode=live&card=1&labels=none&alerts=0&tabs=0';      // the 3D pictures: the house alone, no buttons
const FRONT = [-6.5, 1.4, -8.5, 4, 3], BACK = [12, 1.6, 19, 2.5, 8];

// a terraced house 6 m wide, 10 m deep: the street in front (z < 0), the garden behind (z > 10); no basement, so the earth is not cut open
function ring(p, x1, z1, ops = {}) {
  const s = [[[0, 0], [x1, 0]], [[x1, 0], [x1, z1]], [[x1, z1], [0, z1]], [[0, z1], [0, 0]]];
  return s.map(([a, b], i) => ({ id: p + i, a, b, thickness: 0.3, height: 2.5, openings: ops[i] || [] }));
}
const win = (id, pos) => ({ id, type: 'window', pos, width: 1.2, height: 1.3, sill: 0.9 });
const HOUSE = { version: 1,
  plot: { boundary: [[-4, -7], [10, -7], [10, 18], [-4, 18]], areas: [{ id: 'weg', name: 'Weg', surface: 'paving', points: [[1.1, -7], [2.5, -7], [2.5, -0.2], [1.1, -0.2]] }] },
  neighbors: [],
  floors: [
    { id: 'eg', name: 'Erdgeschoss', kind: 'floor', devices: [], blocks: [], stairs: [], holes: [],
      walls: ring('e', 6, 10, { 0: [{ id: 'hd', type: 'door', name: 'Haustür', pos: 1.8, width: 1.0, height: 2.1, sill: 0 }, { ...win('ew1', 4.3), width: 1.4 }],
        2: [{ id: 'ew2', type: 'window', style: 'double', pos: 3.0, width: 2.4, height: 2.1, sill: 0 }] }),
      rooms: [{ id: 'e1', name: 'Flur', points: [[0, 0], [6, 0], [6, 4], [0, 4]] }, { id: 'e2', name: 'Wohnen', points: [[0, 4], [6, 4], [6, 10], [0, 10]] }] },
    { id: 'og', name: 'Obergeschoss', kind: 'floor', devices: [], blocks: [], stairs: [], holes: [],
      walls: ring('o', 6, 10, { 0: [win('ow1', 1.6), win('ow2', 4.4)], 2: [win('ow3', 1.6), win('ow4', 4.4)] }),
      rooms: [{ id: 'o1', name: '', points: [[0, 0], [6, 0], [6, 5], [0, 5]] }, { id: 'o2', name: '', points: [[0, 5], [6, 5], [6, 10], [0, 10]] }] },
    { id: 'dach', name: 'Dach', kind: 'roof', walls: [], rooms: [], devices: [], blocks: [], stairs: [], holes: [],
      roof: { type: 'gable', pitch: 40, overhang: 0.4, knee: 2.5, ridge: 'x' } },
  ] };

const MARK = `(() => { window.mark = (sel, n, up) => { let e = document.querySelector(sel); if (!e) return false; for (let i = 0; i < (up || 0); i++) e = e.parentElement;
  e.scrollIntoView({ block: 'nearest' });
  const r = e.getBoundingClientRect(), o = document.createElement('div'), b = document.createElement('div');
  o.className = b.className = 'shotMark';
  Object.assign(o.style, { position: 'fixed', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px',
    border: '4px solid #ff3b6b', borderRadius: '10px', zIndex: 2147483646, pointerEvents: 'none', boxShadow: '0 0 0 3px rgba(0,0,0,.35)' });
  b.textContent = n;
  Object.assign(b.style, { position: 'fixed', left: r.left - 22 + 'px', top: r.top - 22 + 'px', width: '34px', height: '34px', borderRadius: '50%',
    display: 'grid', placeItems: 'center', background: '#ff3b6b', color: '#fff', font: '800 20px system-ui, sans-serif', zIndex: 2147483647,
    border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,.5)' });
  document.body.append(o, b); return true; }; window.unmark = () => document.querySelectorAll('.shotMark').forEach((e) => e.remove()); })()`;

async function open(b, q, lay) {
  const pg = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: 'de-DE', deviceScaleFactor: 2 });
  pg.on('pageerror', (e) => console.log('PAGEERROR', String(e)));
  await pg.goto(DEMO + q);
  await pg.waitForFunction('window.__fp && window.__fp.ready()', null, { timeout: 90000 });
  await pg.waitForTimeout(1500);
  await pg.evaluate((lay) => { const L = window.__fp.layout; for (const k of Object.keys(L)) delete L[k]; Object.assign(L, lay);
    const s = window.__fp.settings(); s.seeThrough = false; s.cutaway = false; window.__fp.rebuild(); }, lay);
  await pg.waitForTimeout(800);
  await pg.evaluate(MARK);
  return pg;
}
async function photo(b, lay, file, cam) {
  const pg = await open(b, CLEAN, lay);
  await pg.addStyleTag({ content: '#stage > :not(canvas#view) { display: none !important }' });
  await pg.evaluate(() => window.__fp.setHouseMode(true));
  await pg.waitForTimeout(1200);
  await pg.evaluate((c) => window.__fp.camAt(...c), cam);
  await pg.waitForTimeout(2500);
  await pg.screenshot({ path: file });
  await pg.close();
}
const tap = async (pg, x, z) => { const [px, py] = await pg.evaluate(([x, z]) => window.__fp.plan().toClient(x, z), [x, z]); await pg.mouse.click(px, py); await pg.waitForTimeout(900); };
const type = async (pg, loc, v) => { await loc.fill(v); await loc.dispatchEvent('change'); await loc.blur(); await pg.waitForTimeout(900); };

(async () => {
  const b = await chromium.launch();
  const pg = await open(b, '&mode=edit', HOUSE);
  await pg.evaluate(() => window.__fp.switchFloor(0));
  await pg.waitForTimeout(800);
  await pg.click('#view2d'); await pg.waitForTimeout(800);
  // 1: "Grundstück" → "▲ Plateau unter [das ganze Haus] [Anlegen]"
  await pg.click('#tools [data-tool=plot]'); await pg.waitForTimeout(800);
  await pg.evaluate(() => document.querySelector('#plateauMake').scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { window.mark('#tools [data-tool=plot]', '1'); window.mark('#plateauMake', '2'); });
  await pg.screenshot({ path: `${OUT}/1-plateau-anlegen.png` });
  await pg.evaluate(() => window.unmark());
  // 2: its height 0.65 m, then "＋ Außentreppe an die Haustür"
  await pg.click('#plateauMake'); await pg.waitForTimeout(1000);
  await type(pg, pg.locator('#plateauRise'), '0.65');
  await pg.evaluate(() => document.querySelector('#plateauBox').scrollIntoView({ block: 'center' }));
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { window.mark('#plateauRise', '3', 1); window.mark('#plateauSteps', '4'); });
  await pg.screenshot({ path: `${OUT}/2-hoehe-treppe.png` });
  await pg.evaluate(() => window.unmark());
  await pg.click('#plateauSteps'); await pg.waitForTimeout(1200);
  console.log('steps:', await pg.evaluate(() => document.querySelector('#status')?.textContent));
  const plateau = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__fp.layout)));
  // 4: the garden behind 30 cm lower: "⛰ Gelände", a spot height in front (0) and one behind (−0.30)
  await pg.click('#plotMode [data-v=terrain]'); await pg.waitForTimeout(800);
  await tap(pg, 3, -4);
  await type(pg, pg.locator('#terrainList input[id^=terrainH_]').nth(0), '0');
  await tap(pg, 3, 14);
  await type(pg, pg.locator('#terrainList input[id^=terrainH_]').nth(1), '-0.3');
  console.log('terrain:', await pg.evaluate(() => [window.__fp.terrainAt(3, -5), window.__fp.terrainAt(3, 15)]));
  await pg.evaluate(() => { window.mark('#plotMode [data-v=terrain]', '5'); window.mark('#terrainList', '6'); });
  await pg.screenshot({ path: `${OUT}/4-gelaende.png` });
  const slope = await pg.evaluate(() => JSON.parse(JSON.stringify(window.__fp.layout)));
  await pg.close();
  // 3: before and after in 3D; 5: from the garden
  await photo(b, HOUSE, `${OUT}/vorher.png`, FRONT);
  await photo(b, plateau, `${OUT}/nachher.png`, FRONT);
  await photo(b, slope, `${OUT}/5-garten.png`, BACK);
  await b.close();
})();
