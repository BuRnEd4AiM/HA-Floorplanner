// Unit tests for heatdiag.js (🌡 Klima → 🩺 Protokoll, #579: who controls what; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(`${process.env.STATIC_DIR || '/tmp/static'}/heatdiag.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');
const deg = (v) => `${String(v).replace('.', ',')}°`;
const now = new Date(2026, 9, 28, 18, 40, 12).getTime() / 1000;
const at = (h, m, s = 0) => new Date(2026, 9, 28, h, m, s).getTime() / 1000;

const diag = {
  ha: true, running: true, since: at(17, 2), version: '4.39.0', houses: { main: 'Haus' }, loose: ['climate.keller'],
  rooms: [
    { key: 'main/wz', house: 'main', name: 'Wohnzimmer', floor: 0, climates: ['climate.wz'], windows: ['binary_sensor.fenster'], outer: ['binary_sensor.terrasse'], inner: ['binary_sensor.flur'] },
    { key: 'main/flur', house: 'main', name: 'Flur', floor: 0, climates: [], windows: [], outer: [], inner: ['binary_sensor.flur'] },
  ],
  states: {
    'climate.wz': { s: 'heat', n: 'Heizung WZ', t: 21, c: 24.5, m: ['off', 'heat'] }, 'binary_sensor.fenster': { s: 'on', n: 'Fenster WZ' },
    'binary_sensor.terrasse': { s: 'unavailable', n: 'Terrassentür' }, 'binary_sensor.flur': { s: 'off', n: 'Flurtür' }, 'climate.keller': { s: 'off', n: 'Keller' },
  },
  trace: [
    { t: at(17, 2), k: 'start', v: '4.39.0' },
    { t: at(17, 2), k: 'link', on: true },
    { t: at(17, 2), k: 'room', room: 'main/wz', why: 'schedule', level: 'comfort', temp: 21, first: true },
    { t: at(18, 0), k: 'rule', ent: 'climate.wz', act: 'temp', v: 21, why: 'schedule', room: 'main/wz' },
    { t: at(18, 0), k: 'call', ent: 'climate.wz', dom: 'climate', svc: 'set_temperature', v: 21, ok: true, src: 'heat' },
    { t: at(18, 0, 40), k: 'climate', ent: 'climate.wz', room: 'main/wz', mode: null, temp: [19, 21], by: 'addon', ago: 40 },
    { t: at(18, 30), k: 'contact', ent: 'binary_sensor.flur', s: 'on', was: 'off', rooms: [['main/wz', 'inner', 'inner'], ['main/flur', 'inner', 'inner']] },
    { t: at(18, 35), k: 'contact', ent: 'binary_sensor.fenster', s: 'on', was: 'off', rooms: [['main/wz', 'window', null]] },
    { t: at(18, 35), k: 'room', room: 'main/wz', why: null, waiting: true, level: null, temp: null },
    { t: at(18, 37), k: 'room', room: 'main/wz', why: 'window', was: 'schedule' },
    { t: at(18, 37), k: 'rule', ent: 'climate.wz', act: 'off', v: 'off', why: 'window', room: 'main/wz' },
    { t: at(18, 37), k: 'call', ent: 'climate.wz', dom: 'climate', svc: 'set_hvac_mode', v: 'off', ok: false, src: 'heat' },
    { t: at(18, 38), k: 'climate', ent: 'climate.wz', room: 'main/wz', mode: null, temp: [21, 25], by: 'device' },
    { t: at(18, 39), k: 'link', on: false, err: 'ConnectionError: closed', n: 3, t2: at(18, 40) },
    { t: at(18, 39), k: 'call', ent: 'number.wz_offset', dom: 'number', svc: 'set_value', v: -2.5, ok: true, src: 'sensor' },
  ],
};
const rules = { heat: { window: { on: true, delay: 2, doors: true, skip: [] }, schedule: { on: true, hand: 10 } },
  status: { rooms: { 'main/wz': { why: 'window', since: at(18, 37), back: 21, climates: ['climate.wz'] } }, sensors: { 'climate.wz': { way: 'shift', v: 20.5, wish: 21, set: 23.5 } } }, active: true };
const names = (e) => diag.states[e]?.n || e;
const ctx = { t, deg, name: names, roomName: (k) => diag.rooms.find((r) => r.key === k)?.name || k, roomOf: (e) => (e === 'climate.wz' ? 'main/wz' : ''), now,
  sensorLog: (x) => ({ icon: '↕', text: `wish ${x.v}`, sub: '' }), version: '4.39.0' };

test('whether the window rule counts a contact, and its state in a word', () => {
  const byKey = Object.fromEntries(diag.rooms.map((r) => [r.key, r])), w = rules.heat.window;
  assert.equal(D.whyNot('main/wz', 'window', byKey, w), null);
  assert.equal(D.whyNot('main/wz', 'inner', byKey, w), 'inner');
  assert.equal(D.whyNot('main/wz', 'outer', byKey, { ...w, doors: false }), 'doors');
  assert.equal(D.whyNot('main/wz', 'window', byKey, { ...w, on: false }), 'off');
  assert.equal(D.whyNot('main/wz', 'window', byKey, { ...w, skip: ['main/wz'] }), 'skip');
  assert.equal(D.whyNot('main/flur', 'window', byKey, w), 'noclimate');
  assert.equal(D.whyNot('main/wz', 'counted', byKey, { ...w, doors: false }), null);   // a door with "Zählt für die Heizung"
  assert.deepEqual(['on', 'off', 'unavailable', 'unknown', 'open'].map((s) => D.contactState({ s })), ['open', 'closed', 'gone', 'unknown', 'open']);
  assert.equal(D.contactState(null), 'none');
  assert.equal(D.clock(at(17, 2, 5), now), '17:02:05');
  assert.equal(D.clock(at(17, 2, 5) - 86400, now), '27.10. 17:02:05');
  assert.equal(D.stamp(now), '28.10.2026 18:40:12');
});

test('who changed a thermostat in words', () => {
  assert.equal(D.byWords({ by: 'addon', ago: 40 }, t), 'hd.by.addonAgo{"n":40}');
  assert.equal(D.byWords({ by: 'addon', ago: 300 }, t), 'hd.by.addonMin{"n":5}');
  assert.equal(D.byWords({ by: 'addon' }, t), 'hd.by.addon');
  assert.equal(D.byWords({ by: 'user', who: 'Anna' }, t), 'hd.by.user{"who":"Anna"}');
  assert.equal(D.byWords({ by: 'user' }, t), 'hd.by.userAnon');
  assert.equal(D.byWords({ by: 'auto' }, t), 'hd.by.auto');
  assert.equal(D.byWords({ by: 'device' }, t), 'hd.by.device');
});

test('what a room does in a line of the journal', () => {
  assert.equal(D.roomWords({ why: 'window' }, t, deg), '⏸️ hd.r.window');
  assert.equal(D.roomWords({ why: 'window', stuck: true }, t, deg), '⚠️ hd.r.stuck');
  assert.equal(D.roomWords({ why: null, waiting: true }, t, deg), '🪟 hd.r.waiting');
  assert.equal(D.roomWords({ why: 'schedule', level: 'comfort', temp: 21 }, t, deg), 'hr.line.schedule{"v":"21°","level":"hr.level.comfort"}');
  assert.match(D.roomWords({ why: 'schedule', level: 'comfort', temp: 21, hand: at(18, 10) }, t, deg), /^✋ hr\.line\.hand\{"at":"18:10"/);
  assert.equal(D.roomWords({ why: 'schedule', level: 'eco', temp: 19, sent: 19 }, t, deg), 'hr.line.schedule{"v":"19°","level":"hr.level.eco"} · ⏳ hd.sent{"v":"19°"}');
  assert.equal(D.roomWords({ why: null }, t, deg), 'hd.r.none');
  assert.equal(D.nowWords(null, now, t, deg).text, 'hd.noClimate');
  assert.equal(D.nowWords(null, now, t, deg, true).text, 'hd.noStatus');
  assert.equal(D.nowWords({ why: null }, now, t, deg).text, 'hd.nobody');
  assert.match(D.nowWords(rules.status.rooms['main/wz'], now, t, deg).text, /^hr\.line\.window\{"n":3/);
});

test('every room as the add-on sees it', () => {
  const [wz, flur] = D.roomViews(diag, rules, ctx);
  assert.equal(wz.name, 'Wohnzimmer');
  assert.equal(wz.climates[0].text, 'heat · hd.th.target{"v":"21°"} · hd.th.meas{"v":"24,5°"}');
  assert.equal(wz.climates[0].sensor, 'hd.th.shift{"v":"20,5°","wish":"21°","set":"23,5°"}');
  assert.equal(wz.climates[0].last, 'hd.th.last{"at":"18:38:00","by":"hd.by.device"}');
  assert.deepEqual(wz.contacts.map((c) => [c.e, c.use, c.state, c.why]), [['binary_sensor.fenster', 'window', 'open', null],
    ['binary_sensor.terrasse', 'outer', 'gone', null], ['binary_sensor.flur', 'inner', 'closed', 'inner']]);
  assert.equal(D.contactWords(wz.contacts[2], t), 'Flurtür: hd.s.closed · hd.use.inner · hd.not.inner');
  assert.equal(flur.now.text, 'hd.noClimate');
  assert.equal(D.roomViews(diag, rules, { ...ctx, house: 'other' }).length, 0);
  const two = { ...diag, houses: { main: 'Haus', h2: 'Werkstatt' }, rooms: [...diag.rooms, { key: 'h2/w', house: 'h2', name: 'Halle', climates: [], windows: [], outer: [], inner: [] }] };
  assert.equal(D.roomViews(two, rules, ctx)[2].name, 'Halle (Werkstatt)');
});

test('the journal as lines, newest first, a rule with the answer of Home Assistant', () => {
  const rows = D.journalRows(diag.trace, ctx);
  assert.equal(rows.length, diag.trace.length - 2);                      // the two calls of the rules are in their lines
  assert.equal(rows[0].icon, '🌡');
  assert.equal(rows[0].sub, 'rs.log.sub · ✓ hd.ok');
  assert.equal(rows[1].text, 'hd.e.off');
  assert.equal(rows[1].sub, 'ConnectionError: closed · hd.e.times{"n":3,"at":"18:40:00"}');
  assert.equal(rows[2].icon, '✋');
  assert.equal(rows[2].text, 'Wohnzimmer: Heizung WZ hd.e.temp{"a":"21°","b":"25°"}');
  assert.equal(rows[2].sub, 'hd.by.device');
  assert.equal(rows[3].text, 'Wohnzimmer: hr.why.window → Heizung WZ fl.heat.off');
  assert.equal(rows[3].sub, '✗ hd.fail');
  assert.equal(rows[3].tone, 'warn');
  const win = rows.find((r) => r.text.includes('Fenster WZ'));
  assert.equal(win.text, 'Wohnzimmer: Fenster WZ hd.s.open');
  assert.equal(win.sub, 'hd.use.window · hd.counts');
  assert.equal(win.tone, 'open');
  const door = rows.find((r) => r.text.includes('Flurtür'));
  assert.equal(door.sub, 'hd.use.inner · Wohnzimmer: hd.not.inner · Flur: hd.not.inner');
  const own = rows.find((r) => r.icon === '🤖');
  assert.equal(own.sub, 'hd.by.addonAgo{"n":40}');
  const plan = rows.find((r) => r.text.includes('hr.why.schedule'));
  assert.equal(plan.sub, '✓ hd.ok');
  assert.equal(rows[rows.length - 1].text, 'hd.e.start{"v":"4.39.0"}');
  assert.equal(rows.find((r) => r.sub === 'hd.e.first').text, 'Wohnzimmer: hr.line.schedule{"v":"21°","level":"hr.level.comfort"}');
  const flur = D.journalRows(diag.trace, { ...ctx, room: 'main/flur' });
  assert.deepEqual(flur.map((r) => r.icon), ['⚠️', '🪟', '🔗', '▶']);    // its door, and the lines of the connection
  const wish = D.journalRows([{ t: now, k: 'rule', ent: 'climate.wz', act: 'temp', v: 21, why: 'schedule', room: 'main/wz' }], ctx);
  assert.equal(wish[0].sub, 'hd.wish');                                   // no call: a wish for the room sensor
  const again = D.journalRows([{ t: now, k: 'rule', ent: 'climate.wz', act: 'temp', v: 21, why: 'schedule', room: 'main/wz', again: true },
    { t: now, k: 'call', ent: 'climate.wz', svc: 'set_temperature', v: 21, ok: true, src: 'heat' }], ctx);
  assert.equal(again[0].sub, 'hd.again · ✓ hd.ok');
});

test('contacts in no room, the head and the report', () => {
  const floors = [{ walls: [{ openings: [{ entity: 'binary_sensor.fenster' }, { entity: 'binary_sensor.garage', paneEntities: ['binary_sensor.garage', 'binary_sensor.g2'] },
    { type: 'door', style: 'garage', entity: 'cover.tor' }] }],
    dormerWalls: [{ openings: [{ entity: 'binary_sensor.dach' }] }] }];
  assert.deepEqual(D.loneContacts(floors, diag), ['binary_sensor.garage', 'binary_sensor.g2', 'binary_sensor.dach']);
  assert.deepEqual(D.headLines(diag, rules, ctx), ['🔗 hd.link.on{"at":"17:02:00"}', '🪟 hd.cfg.window{"on":"hd.on","n":2,"doors":"hd.yes"}',
    '📅 hd.cfg.plan{"on":"hd.on","hand":"fl.min{\\"n\\":10}"}']);
  assert.equal(D.headLines({ ...diag, running: false }, rules, ctx)[0], '⚠️ hd.link.off');
  assert.equal(D.headLines({ ...diag, running: false }, { ...rules, active: false }, ctx)[0], 'hd.link.idle');
  assert.equal(D.headLines({ ...diag, ha: false }, rules, ctx)[0], 'hd.noHa');
  const text = D.report(diag, rules, { ...ctx, lone: ['binary_sensor.dach'] });
  const lines = text.split('\n');
  assert.equal(lines[0], '🩺 hd.title · 3D Floorplan 4.39.0 · 28.10.2026 18:40:12');
  assert.ok(lines.includes('== Wohnzimmer (main/wz) =='));
  assert.ok(lines.includes('🪟 Fenster WZ (binary_sensor.fenster): hd.s.open · hd.use.window · hd.counts'));
  assert.ok(lines.some((l) => l.startsWith('🌡️ Heizung WZ (climate.wz): heat · ')));
  assert.ok(lines.some((l) => l.startsWith('⚠️ hd.loose') && l.includes('Keller (climate.keller)')));
  assert.ok(lines.some((l) => l.startsWith('⚠️ hd.lone')));
  const i = lines.indexOf('== hd.log ==');
  assert.ok(i > 0 && lines[i + 1].startsWith('18:39:00 🌡 '));
  assert.equal(D.report(diag, rules, { ...ctx, lone: ['binary_sensor.dach'] }, 2).split('\n').length, i + 3);   // only the newest lines of the journal
  assert.ok(D.report({ ...diag, trace: [] }, rules, ctx).endsWith('hd.empty'));
});
