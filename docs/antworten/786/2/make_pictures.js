/* The pictures of the second answer to #786 (5.32.0, Mario's terraced house): the walls not lowered ("Ansicht"), the ground lowered
 * instead of a plateau, the outdoor steps (3 steps, the rail on the left, stainless), the canopy over the front door, the balcony under the
 * roof, the lived-in attic (Kniestock), the whole house on a narrow plot. In German, numbered marks, the demo with his house put in.
 *   NODE_PATH=$(npm root -g) node docs/antworten/786/2/make_pictures.js <output folder>      (PNG; made into JPG afterwards) */
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || __dirname;
const DEMO = 'file://' + path.resolve(__dirname, '../../../../demo/floorplan3d-demo.html') + '?debug=1&skytime=13:00&mode=edit';

function ring(p, z1, ops = {}, h = 2.6) {
  const s = [[[0, 0], [6, 0]], [[6, 0], [6, z1]], [[6, z1], [0, z1]], [[0, z1], [0, 0]]];
  return s.map(([a, b], i) => ({ id: p + i, a, b, thickness: 0.3, height: h, openings: ops[i] || [] }));
}
const win = (id, pos, o = {}) => ({ id, type: 'window', style: 'double', pos, width: 1.2, height: 1.3, sill: 0.9, ...o });
const kw = (id, pos) => win(id, pos, { width: 1.0, height: 0.5, sill: 1.9 });
const room = (id, name, z0, z1) => ({ id, name, points: [[0, z0], [6, z0], [6, z1], [0, z1]] });
const fl = (id, name, kind, walls, rooms) => ({ id, name, kind, walls, rooms, devices: [], blocks: [], stairs: [], holes: [] });
const HOUSE = (o = {}) => ({ version: 1,
  plot: { boundary: [[0, -7], [6, -7], [6, 20], [0, 20]], areas: [{ id: 'weg', name: 'Weg', surface: 'paving', points: [[1.7, -7], [3.1, -7], [3.1, -2], [1.7, -2]] }],
    ...(o.plateau ? {} : { terrain: { points: [{ id: 't1', x: 3, z: -1, h: -0.65 }, { id: 't2', x: 3, z: 15, h: -0.95 }], contours: 0.5 } }) },
  neighbors: [],
  floors: [
    fl('kg', 'Kellergeschoss', 'basement', ring('k', 11, { 0: [kw('kw1', 1), kw('kw2', 4.6)], 2: [kw('kw3', 3)] }), [room('k1', 'Technikraum', 0, 5), room('k2', 'Hobbyraum', 5, 11)]),
    fl('eg', 'Erdgeschoss', 'floor', ring('e', 11, { 0: [{ id: 'hd', type: 'door', name: 'Haustür', pos: 2.4, width: 1.2, height: 2.1, sill: 0 }, win('ew1', 0.8, { width: 0.6 }), win('ew2', 4.6)],
      2: [{ id: 'ew3', type: 'window', style: 'double', pos: 3, width: 2.4, height: 2.1, sill: 0 }] }), [room('e1', 'Flur', 0, 4), room('e2', 'Wohnzimmer', 4, 11)]),
    { ...fl('og', 'Obergeschoss', 'floor', ring('o', 11, { 0: [win('ow1', 1.6), win('ow2', 4.4)], 2: [win('ow3', 1.6, { height: 2.1, sill: 0 }), win('ow4', 4.4, { height: 2.1, sill: 0 })] }), []),
      rooms: [room('o1', 'Bad', 0, 5), room('o2', 'Schlafzimmer', 5, 11), { id: 'bal', name: 'Balkon', terrace: true, rail: 'wood', ...(o.roofOver ? { roofOver: true } : {}), points: [[0, 11.15], [6, 11.15], [6, 12.5], [0, 12.5]] }] },
    fl('dg', 'Dachgeschoss', 'floor', ring('d', 11), [room('d1', 'Büro', 0, 5), room('d2', 'Spielzimmer', 5, 11)]),
    { ...fl('dach', 'Dachstuhl', 'roof', [], []), roof: { type: 'gable', pitch: 40, overhang: 0.4, ridge: 'x', ...(o.knee != null ? { knee: o.knee } : {}) } },
  ] });

const MARK = `(() => { window.mark = (sel, n) => { const e = document.querySelector(sel); if (!e) return false;
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

async function open(b, lay, set = {}) {
  const pg = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: 'de-DE', deviceScaleFactor: 2 });
  pg.on('pageerror', (e) => console.log('PAGEERROR', String(e)));
  await pg.goto(DEMO);
  await pg.waitForFunction('window.__fp && window.__fp.ready()', null, { timeout: 90000 });
  await pg.waitForTimeout(1500);
  await pg.evaluate(([lay, set]) => { const L = window.__fp.layout; for (const k of Object.keys(L)) delete L[k]; Object.assign(L, lay);
    Object.assign(window.__fp.settings(), { seeThrough: false, cutaway: true, houseFloors: 'stacked' }, set); window.__fp.rebuild(); }, [lay, set]);
  await pg.waitForTimeout(800);
  await pg.evaluate(MARK);
  return pg;
}
const shot = (pg, name) => pg.screenshot({ path: `${OUT}/${name}.png` });

(async () => {
  const b = await chromium.launch();
  // 1 + 2: the whole house with the walls lowered ("Auto"), then "Ansicht" → "Auto" off: the walls stay up
  let pg = await open(b, HOUSE());
  await pg.evaluate(() => window.__fp.setHouseMode(true)); await pg.waitForTimeout(1200);
  await pg.evaluate(() => window.__fp.camAt(-9, 7, -13, 3, 4)); await pg.waitForTimeout(2500);
  await shot(pg, '1-waende-abgesenkt');
  await pg.click('#viewMenuBtn'); await pg.waitForTimeout(500);
  await pg.click('#autoToggle'); await pg.waitForTimeout(500);
  await pg.click('#seeToggle'); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => document.querySelector('#seeToggle').classList.contains('active'))) { await pg.click('#seeToggle'); await pg.waitForTimeout(300); }
  await pg.evaluate(() => { window.mark('#viewMenuBtn', '1'); window.mark('#autoToggle', '2'); window.mark('#wallToggle', '3'); });
  await pg.waitForTimeout(2000);
  await shot(pg, '2-waende-oben');
  await pg.close();

  // 3: ⛰ Gelände: the spot heights, „＋ Außentreppe an die Haustür“
  pg = await open(b, HOUSE());
  await pg.evaluate(() => window.__fp.switchFloor(1)); await pg.waitForTimeout(600);
  await pg.click('#view2d'); await pg.waitForTimeout(800);
  await pg.click('#tools [data-tool=plot]'); await pg.waitForTimeout(700);
  await pg.click('#plotMode [data-v=terrain]'); await pg.waitForTimeout(900);
  await pg.evaluate(() => document.querySelector('#terrainSteps').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(400);
  await pg.evaluate(() => { window.mark('#tools [data-tool=plot]', '1'); window.mark('#plotMode [data-v=terrain]', '2'); window.mark('#terrainList', '3'); window.mark('#terrainSteps', '4'); });
  await shot(pg, '3-gelaende-treppe');
  await pg.evaluate(() => window.unmark());
  await pg.click('#terrainSteps'); await pg.waitForTimeout(900);
  // 4: the steps: 3 steps, rail left, stainless
  await pg.evaluate(() => window.__fp.select('device', window.__fp.layout.floors[1].devices.find((d) => d.type === 'steps').id)); await pg.waitForTimeout(700);
  await pg.selectOption('#stepsCount', '3'); await pg.waitForTimeout(700);
  await pg.click('#stepsRail [data-v=left]'); await pg.waitForTimeout(600);
  await pg.click('#stepsRailLook [data-v=steel]'); await pg.waitForTimeout(600);
  await pg.evaluate(() => document.querySelector('#stepsCount').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(300);
  await pg.evaluate(() => { window.mark('#stepsCount', '1'); window.mark('#stepsRail', '2'); window.mark('#stepsRailLook', '3'); });
  await shot(pg, '4-treppe-felder');
  await pg.evaluate(() => window.unmark());
  // 5: the front door: „＋ Vordach über die Tür“
  await pg.click('#tools [data-tool=select]'); await pg.waitForTimeout(400);
  await pg.evaluate(() => window.__fp.select('opening', 'hd')); await pg.waitForTimeout(700);
  await pg.evaluate(() => document.querySelector('#porchAdd').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(300);
  await pg.evaluate(() => window.mark('#porchAdd', '1'));
  await shot(pg, '5-vordach-knopf');
  await pg.evaluate(() => window.unmark());
  await pg.click('#porchAdd'); await pg.waitForTimeout(900);
  await pg.evaluate(() => document.querySelector('#porchW').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(300);
  await pg.evaluate(() => { window.mark('#porchW', '2'); window.mark('#porchPosts', '3'); window.mark('#porchCover', '4'); });
  await shot(pg, '6-vordach-felder');
  await pg.evaluate(() => window.unmark());
  // 7: the entrance in 3D
  await pg.evaluate(() => { window.__fp.select(null, null); Object.assign(window.__fp.settings(), { cutaway: false }); window.__fp.rebuild(); });
  await pg.click('#view3d'); await pg.waitForTimeout(1200);                                  // the ground floor (in "Ganzes Haus" the earth in front is cut open)
  await pg.evaluate(() => window.__fp.camAt(8.5, 2.4, -9.5, 2.4, 0.5, 1.2)); await pg.waitForTimeout(2800);
  await shot(pg, '7-eingang-3d');
  await pg.evaluate(() => window.__fp.setHouseMode(true)); await pg.waitForTimeout(1200);
  // 10: the whole house from the side, cut open (the plot as narrow as the house)
  await pg.evaluate(() => { Object.assign(window.__fp.settings(), { cutaway: true }); window.__fp.rebuild(); }); await pg.waitForTimeout(800);
  await pg.evaluate(() => window.__fp.camAt(24, 9, -7, 3, 5.5)); await pg.waitForTimeout(2800);
  await shot(pg, '10-ganzes-haus-seite');
  await pg.close();

  // 8: the balcony: „Hausdach reicht darüber“, before and after
  for (const on of [false, true]) {
    pg = await open(b, HOUSE({ roofOver: on, knee: 1.0 }), { cutaway: false });
    await pg.evaluate(() => window.__fp.setHouseMode(true)); await pg.waitForTimeout(1200);
    await pg.evaluate(() => window.__fp.camAt(20, 9, 22, 3, 9, 3)); await pg.waitForTimeout(2800);
    await shot(pg, on ? '8b-balkon-mit-dach' : '8a-balkon-ohne-dach');
    if (on) {
      await pg.evaluate(() => window.__fp.switchFloor(2)); await pg.waitForTimeout(700);
      await pg.evaluate(() => window.__fp.select('room', 'bal')); await pg.waitForTimeout(800);
      await pg.evaluate(() => document.querySelector('#roomRoofOver').scrollIntoView({ block: 'center' })); await pg.waitForTimeout(300);
      await pg.evaluate(() => window.mark('#roomRoofOver', '1'));
      await shot(pg, '8c-balkon-haken');
    }
    await pg.close();
  }

  // 9: the lived-in attic: the roof starts on a knee wall in the Dachgeschoss, before and after
  for (const knee of [null, 1.0]) {
    pg = await open(b, HOUSE({ knee }), { cutaway: false });
    await pg.evaluate(() => window.__fp.setHouseMode(true)); await pg.waitForTimeout(1200);
    await pg.evaluate(() => window.__fp.camAt(-12, 9, -14, 3, 5)); await pg.waitForTimeout(2800);
    await shot(pg, knee == null ? '9a-dach-oben-drauf' : '9b-dach-kniestock');
    if (knee != null) {
      await pg.evaluate(() => window.__fp.switchFloor(4)); await pg.waitForTimeout(800);
      if (!(await pg.isVisible('#roofAttic'))) { await pg.click('#floorPanel > summary').catch(() => {}); await pg.waitForTimeout(600); }
      await pg.evaluate(() => document.querySelector('#roofAttic')?.scrollIntoView({ block: 'center' })); await pg.waitForTimeout(400);
      await pg.evaluate(() => { window.mark('#roofAttic', '1'); });
      await shot(pg, '9c-dach-haken');
    }
    await pg.close();
  }
  await b.close();
})();
