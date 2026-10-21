// Unit tests for the dashboard card dist/floorplan3d-card.js (#13): the card file is a plain script for Home Assistant, so it runs here in a
// small stand-in of the browser; its pure parts are static methods of the card class. Run: node --test tests/card.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const file = process.env.CARD_JS || new URL('../dist/floorplan3d-card.js', import.meta.url);
const defined = {};
const window = { customCards: [] };
vm.runInNewContext(readFileSync(file, 'utf8'), {
  window, HTMLElement: class {}, CustomEvent: class {}, URLSearchParams, setInterval, clearInterval, setTimeout, clearTimeout,
  customElements: { get: (n) => defined[n], define: (n, c) => { defined[n] = c; } },
  document: { addEventListener() {}, cookie: '' }, navigator: { language: 'de-DE' }, location: { protocol: 'https:' },
});
const Card = defined['floorplan3d-card'];
// objects made inside the stand-in have its own Object / Array: compare them as plain data
const eq = (actual, expected, msg) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, msg);

test('the card and its editor are defined and listed in the card picker', () => {
  assert.ok(Card); assert.ok(defined['floorplan3d-card-editor']);
  assert.equal(window.customCards.length, 1);
  assert.equal(window.customCards[0].type, 'floorplan3d-card');
  assert.match(window.customCards[0].description, /3D/);
});
test('the usual add-on names: the hash of the repository address, as the Supervisor makes it', () => {
  const hash = (u) => createHash('sha1').update(u.toLowerCase()).digest('hex').slice(0, 8);
  const slugs = Card.slugs({}, null);
  for (const u of ['https://github.com/BuRnEd4AiM/HA-Floorplanner', 'https://github.com/BuRnEd4AiM/HA-Floorplanner/', 'https://github.com/BuRnEd4AiM/HA-Floorplanner.git']) {
    assert.ok(slugs.includes(`${hash(u)}_floorplan3d`), u);
  }
  assert.ok(slugs.includes('local_floorplan3d'));
});
test('the add-on is found by its sidebar panel first; the card option alone when it is set', () => {
  const panels = {
    lovelace: { url_path: 'lovelace', config: { mode: 'storage' } },
    abcd1234_floorplan3d: { url_path: 'abcd1234_floorplan3d', config: { ingress: 'abcd1234_floorplan3d' } },
    other: { url_path: 'x', config: { ingress: 'abcd1234_floorplan3d_old' } },
    nothing: null,
  };
  const s = Card.slugs(panels, '');
  assert.equal(s[0], 'abcd1234_floorplan3d');
  assert.ok(!s.includes('abcd1234_floorplan3d_old'));
  assert.equal(new Set(s).size, s.length);
  eq(Card.slugs(panels, ' my_floorplan3d '), ['my_floorplan3d']);
});
test('Home Assistant 2026.2 and newer names the add-on of a panel in config.addon (#352)', () => {
  const panels = {
    lovelace: { url_path: 'lovelace', config: { mode: 'storage' } },
    '1a2b3c4d_floorplan3d': { component_name: 'app', url_path: '1a2b3c4d_floorplan3d', config: { addon: '1a2b3c4d_floorplan3d' } },
    other: { component_name: 'app', url_path: 'core_ssh', config: { addon: 'core_ssh' } },
  };
  const s = Card.slugs(panels, '');
  assert.equal(s[0], '1a2b3c4d_floorplan3d');
  assert.ok(!s.includes('core_ssh'));
});
test('the list of installed add-ons: only this add-on, under any repository name (#352)', () => {
  eq(Card.slugsFromList({ addons: [{ slug: 'core_ssh' }, { slug: '9f8e7d6c_floorplan3d' }, { slug: 'floorplan3d_x' }, null, {}] }), ['9f8e7d6c_floorplan3d']);
  eq(Card.slugsFromList({ apps: [{ slug: 'local_floorplan3d' }] }), ['local_floorplan3d']);
  eq(Card.slugsFromList(null), []);
  eq(Card.slugsFromList({}), []);
});
test('versions: an older add-on is recognised, an unknown one is not', () => {
  assert.equal(Card.olderThan('3.74.0', '3.75.0'), true);
  assert.equal(Card.olderThan('3.75.0', '3.75.0'), false);
  assert.equal(Card.olderThan('3.80.1', '3.75.0'), false);
  assert.equal(Card.olderThan('4.0.0', '3.75.0'), false);
  assert.equal(Card.olderThan('2.99', '3.75.0'), true);
  assert.equal(Card.olderThan('dev', '3.75.0'), false);
  assert.equal(Card.olderThan(undefined, '3.75.0'), false);
});
const q = (url) => Object.fromEntries(new URL(url, 'http://ha').searchParams);
test('the address of the add-on page: Ingress address, ?card=1 and only the options that are set', () => {
  assert.equal(Card.frameUrl('/api/hassio_ingress/tok/', {}), '/api/hassio_ingress/tok/?card=1');
  assert.equal(Card.frameUrl('/api/hassio_ingress/tok', {}), '/api/hassio_ingress/tok/?card=1');
  const all = q(Card.frameUrl('/api/hassio_ingress/tok/', {
    house: 'Ferienhaus', floor: 'Obergeschoss', room: 'Küche', theme: 'light', quality: 'high', walls: 'see_through', labels: 'none',
    heatmap: 'temp', night: 'sun', alerts: false, room_panel: false, show_nav: false, show_bar: true, idle_return: 5, height: 300, title: 'x',
  }));
  eq(all, { card: '1', house: 'Ferienhaus', floor: 'Obergeschoss', room: 'Küche', theme: 'light', perf: 'high', walls: 'see_through',
    labels: 'none', heatmap: 'temp', night: 'sun', alerts: '0', room_panel: '0', show_nav: '0', show_bar: '1', idle_return: '5' });
});
test('the address: floor numbers, defaults left out, theme like Home Assistant', () => {
  assert.equal(q(Card.frameUrl('/', { floor: 0 })).floor, '0');
  eq(q(Card.frameUrl('/', { theme: 'default', quality: 'auto', walls: 'default', labels: 'default', heatmap: 'off', night: 'default', floor: ' ' })), { card: '1' });
  assert.equal(q(Card.frameUrl('/', { theme: 'auto' }, true)).theme, 'dark');
  assert.equal(q(Card.frameUrl('/', { theme: 'auto' }, false)).theme, 'light');
  assert.equal(q(Card.frameUrl('/', { idle_return: -4 })).idle_return, '0');
  assert.equal(q(Card.frameUrl('/', { idle_return: '' })).idle_return, undefined);
  assert.equal(q(Card.frameUrl('/', { idle_return: 'soon' })).idle_return, undefined);
  assert.equal(q(Card.frameUrl('/', { quality: 'low' })).perf, 'low');
});
test('the view: only the room or only its room panel goes into the address, the 3D view is left out', () => {
  assert.equal(q(Card.frameUrl('/', { room: 'Küche', view: 'room' })).view, 'room');
  assert.equal(q(Card.frameUrl('/', { room: 'Küche', view: 'panel' })).view, 'panel');
  assert.equal(q(Card.frameUrl('/', { view: '3d' })).view, undefined);
  assert.equal(q(Card.frameUrl('/', { view: 'pink' })).view, undefined);
});
test('only the room or only its room panel needs a newer add-on; the 3D view works with the older one', () => {
  assert.equal(Card.needsNewer({ view: 'panel' }, '3.77.1'), true);
  assert.equal(Card.needsNewer({ view: 'room' }, '3.77.1'), true);
  assert.equal(Card.needsNewer({ view: 'panel' }, '3.78.0'), false);
  assert.equal(Card.needsNewer({ view: 'room' }, 'dev'), false);
  assert.equal(Card.needsNewer({}, '3.75.0'), false);
  assert.equal(Card.needsNewer({ view: '3d' }, '3.75.0'), false);
});
test('the height: a number or a CSS length, the screen with fill, the cell of a sections dashboard, the panel view', () => {
  assert.equal(Card.frameHeight({}), '400px');
  assert.equal(Card.frameHeight({ height: 300 }), '300px');
  assert.equal(Card.frameHeight({ height: '250' }), '250px');
  assert.equal(Card.frameHeight({ height: '60vh' }), '60vh');
  assert.equal(Card.frameHeight({ height: 'big; color: red' }), '400px');
  assert.equal(Card.frameHeight({ height: -5 }), '400px');
  assert.match(Card.frameHeight({ fill: true }), /^calc\(100vh/);
  assert.match(Card.frameHeight({ height: 300 }, { panel: true }), /^calc\(100vh/);
  assert.equal(Card.frameHeight({ height: 300 }, { grid: true }), '100%');
  assert.equal(Card.heightPx({ height: '300px' }), 300);
  assert.equal(Card.heightPx({ height: '60vh' }), 400);
});
test('the editor shows the defaults as what they mean and leaves them out of the config again', () => {
  const d = Card.editorData({ type: 'custom:floorplan3d-card', floor: 0, alerts: false, room_panel: false });
  assert.equal(d.theme, 'default'); assert.equal(d.quality, 'auto'); assert.equal(d.heatmap, 'off'); assert.equal(d.floor, '0');
  assert.equal(d.alerts, 'off'); assert.equal(d.room_panel, false); assert.equal(d.show_nav, true); assert.equal(d.show_bar, true);
  eq(Card.editorConfig({ type: 'custom:floorplan3d-card', floor: 0 }, d), { type: 'custom:floorplan3d-card', floor: '0', alerts: false, room_panel: false });
  const c = Card.editorConfig({ type: 'custom:floorplan3d-card', custom: 1 }, { ...Card.editorData({}), theme: 'auto', alerts: 'on', show_bar: false, height: '', fill: false, idle_return: 10, room: '' });
  eq(c, { type: 'custom:floorplan3d-card', custom: 1, theme: 'auto', alerts: true, show_bar: false, idle_return: 10 });
  assert.equal(Card.editorData({}).view, '3d');
  eq(Card.editorConfig({ room: 'Küche' }, { ...Card.editorData({ room: 'Küche' }), view: 'panel' }), { room: 'Küche', view: 'panel' });
  eq(Card.editorConfig({ room: 'Küche', view: 'panel' }, { ...Card.editorData({ room: 'Küche', view: 'panel' }), view: '3d' }), { room: 'Küche' });
});
test('the editor fields: drop-downs from the add-on\'s plan, free text without it', () => {
  const names = (schema) => schema.flatMap((s) => (s.schema ? names(s.schema) : [s.name]));
  const withPlan = Card.editorSchema({ houses: ['Haus'], floors: ['EG', 'OG'], rooms: ['Küche'] });
  assert.ok(!names(withPlan).includes('house'));                       // one house: nothing to choose
  const floor = withPlan.flatMap((s) => s.schema || [s]).find((s) => s.name === 'floor');
  eq(floor.selector.select.options.map((o) => o.value), ['house', 'EG', 'OG']);
  const free = Card.editorSchema(null);
  assert.ok(names(free).includes('house'));
  eq(free.flatMap((s) => s.schema || [s]).find((s) => s.name === 'floor').selector, { text: {} });
  for (const n of ['view', 'theme', 'quality', 'walls', 'labels', 'heatmap', 'night', 'alerts', 'idle_return', 'room_panel', 'show_nav', 'show_bar', 'tabs', 'kiosk', 'addon', 'height', 'fill', 'title', 'room']) {
    assert.ok(names(free).includes(n), n);
  }
});
test('the size for Home Assistant\'s layout follows the height', () => {
  const c = Object.create(Card.prototype);
  c._config = {};
  assert.equal(c.getCardSize(), 8);
  eq(c.getGridOptions(), { columns: 12, rows: 6, min_columns: 4, min_rows: 3 });
  c._config = { height: 200 };
  assert.equal(c.getGridOptions().rows, 3);
});
test('the tab bar and the wall tablet (#479): off unless asked for, the tab bar into the address, the wall tablet never for an admin', () => {
  const q = (u) => Object.fromEntries(new URLSearchParams(u.split('?')[1]));
  assert.equal(q(Card.frameUrl('/', { tabs: true })).tabs, '1');
  assert.equal(q(Card.frameUrl('/', { tabs: false })).tabs, undefined);
  assert.equal(q(Card.frameUrl('/', { kiosk: true })).kiosk, undefined);              // the wall tablet is the card's own business, not the page's
  const d = Card.editorData({});
  assert.ok(!d.tabs && !d.kiosk);
  eq(Card.editorConfig({}, { ...d, tabs: true, kiosk: false }), { tabs: true });
  eq(Card.editorConfig({ tabs: true, kiosk: true }, { ...Card.editorData({ tabs: true, kiosk: true }), tabs: false, kiosk: false }), {});
  const tablet = { name: 'Tablet', is_admin: false }, admin = { name: 'Du', is_admin: true };
  assert.equal(Card.kioskWanted({ kiosk: true }, tablet, ''), true);
  assert.equal(Card.kioskWanted({ kiosk: true }, admin, ''), false);
  assert.equal(Card.kioskWanted({ kiosk: true }, null, ''), false);
  assert.equal(Card.kioskWanted({}, tablet, ''), false);
  assert.equal(Card.kioskWanted({ kiosk: true }, tablet, '?kiosk=off'), false);
  assert.equal(Card.kioskWanted({ kiosk: true }, tablet, '?edit=1&kiosk=0'), false);
  assert.equal(Card.kioskWanted({ kiosk: true }, tablet, '?kiosk=offline'), true);
});
