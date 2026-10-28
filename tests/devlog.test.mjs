// Unit tests for devlog.js (📜 Protokoll: who switched what; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(`${process.env.STATIC_DIR || '/tmp/static'}/devlog.js`);
const t = (k, p = {}) => (k.startsWith('hr.why.') ? `why:${k.slice(7)}` : k + (Object.keys(p).length ? JSON.stringify(p) : ''));   // the rules' reasons are known
const deg = (v) => `${String(v).replace('.', ',')}°`;
const at = (h, m, s = 0) => new Date(2026, 9, 28, h, m, s).getTime() / 1000;
const names = { 'light.flur': 'Flurlicht', 'climate.wz': 'Heizung WZ', 'binary_sensor.fenster': 'Fenster WZ', 'cover.k': 'Rollladen Küche', 'sensor.bew': 'Bewegung' };
const rooms = { 'light.flur': 'Flur', 'climate.wz': 'Wohnzimmer', 'binary_sensor.fenster': 'Wohnzimmer', 'cover.k': 'Küche' };
const ctx = { t, deg, name: (e) => names[e] || e, roomOf: (e) => rooms[e] || '', dc: (e) => (e === 'binary_sensor.fenster' ? 'window' : null), openings: new Set(['binary_sensor.fenster']) };
const ev = [
  { t: at(6, 0, 38), k: 's', e: 'climate.wz', a: { state: 'heat', tt: 17 }, b: { state: 'heat', tt: 21 }, w: { k: 'addon', src: 'heat', n: 'schedule', ago: 38 } },
  { t: at(17, 0), k: 's', e: 'light.flur', a: { state: 'off' }, b: { state: 'on', brightness: 20 }, w: { k: 'auto', n: 'Flurlicht nachts' } },
  { t: at(17, 30), k: 's', e: 'binary_sensor.fenster', a: { state: 'off' }, b: { state: 'on' }, w: { k: 'dev' } },
  { t: at(18, 0), k: 'c', src: 'flow', n: 'Abend', e: ['cover.k'], sv: 'cover.close_cover', v: {}, ok: false, err: '500 nicht verfügbar', u: null },
  { t: at(18, 5), k: 's', e: 'sensor.bew', a: { state: 'off' }, b: { state: 'unavailable' }, w: { k: 'off' } },
  { t: at(18, 10), k: 'c', src: 'page', n: null, e: ['light.flur'], sv: 'light.turn_on', v: { brightness_pct: 80 }, ok: true, err: null, u: 'Anna' },
  { t: at(18, 10, 1), k: 's', e: 'light.flur', a: { state: 'on', brightness: 20 }, b: { state: 'on', brightness: 80 }, w: { k: 'addon', src: 'page', n: 'Anna', ago: 1 } },
  { t: at(18, 20), k: 'x', err: 'ConnectionError: closed' },
  { t: at(18, 30), k: 's', e: 'light.flur', a: { state: 'on', brightness: 80 }, b: { state: 'off' }, w: { k: 'user', n: 'Max' } },
];

test('kinds, faults and who for the filters', () => {
  assert.equal(D.kindOf('light.x'), 'light');
  assert.equal(D.kindOf('climate.x'), 'heating');
  assert.equal(D.kindOf('binary_sensor.fenster', ctx), 'openings');
  assert.equal(D.kindOf('binary_sensor.tuer', { dc: () => 'door' }), 'openings');
  assert.equal(D.kindOf('binary_sensor.bew', { dc: () => 'motion' }), 'other');
  assert.deepEqual(ev.map(D.isError), [false, false, false, true, true, false, false, true, false]);
  assert.deepEqual(ev.map(D.whoKind), ['addon', 'auto', 'dev', 'addon', 'dev', 'addon', 'addon', '', 'user']);
});

test('the filters and the numbers', () => {
  const all = D.filterEvents(ev, {}, ctx);
  assert.equal(all[0].t, at(18, 30));                                              // newest first
  assert.equal(D.filterEvents(ev, { kind: 'light' }, ctx).length, 4);             // the command to the light too
  assert.equal(D.filterEvents(ev, { kind: 'commands' }, ctx).length, 2);
  assert.equal(D.filterEvents(ev, { kind: 'errors' }, ctx).length, 3);
  assert.equal(D.filterEvents(ev, { who: 'auto' }, ctx).length, 1);
  assert.equal(D.filterEvents(ev, { room: 'Wohnzimmer' }, ctx).length, 2);
  assert.equal(D.filterEvents(ev, { q: 'küche' }, ctx).length, 1);                 // by the room
  assert.equal(D.filterEvents(ev, { q: 'anna' }, ctx).length, 2);                  // by who
  assert.equal(D.filterEvents(ev, { device: 'light.flur' }, ctx).length, 4);
  assert.deepEqual(D.tiles(ev), { events: 6, devices: 4, commands: 2, ok: 1, errors: 3 });
});

test('the rows in words', () => {
  const r = (i) => D.rowOf(ev[i], ctx);
  assert.equal(r(0).what, 'log.target{"a":"17°","b":"21°"}');
  assert.deepEqual(r(0).who, { k: 'addon', text: '🤖 log.who.addon', sub: '📋 why:schedule, log.ago{"n":38}' });
  assert.equal(r(1).what, 'off → on 20 %');                                  // (the stub has no state words)
  assert.equal(r(1).who.sub, '„Flurlicht nachts“ log.inHa');
  assert.equal(r(2).what, 'log.st.closed → log.st.open');
  assert.equal(r(2).who.text, '📶 log.who.sensor');                                   // a contact reports it itself
  assert.equal(r(2).icon, '🪟');
  assert.equal(D.rowOf({ t: 1, k: 's', e: 'person.anna', a: { state: 'not_home' }, b: { state: 'home' }, w: { k: 'dev' } }, ctx).who.text, '📍 log.who.place');
  assert.equal(D.rowOf({ t: 1, k: 's', e: 'light.flur', a: { state: 'on' }, b: { state: 'off' }, w: { k: 'dev' } }, ctx).who.text, '✋ log.who.dev');
  assert.equal(r(3).dev, 'log.cmdTo{"name":"Rollladen Küche"}');
  assert.equal(r(3).what, '„fl.cover.close“ ✗ log.notTaken');
  assert.deepEqual(r(3).who, { k: 'err', text: '⚠️ log.who.err', sub: '▶ „Abend“: 500 nicht verfügbar' });
  assert.equal(r(4).what, 'off → unavailable');
  assert.equal(r(4).who.text, '⚠️ log.who.off');
  assert.equal(r(5).what, '„fl.do.on, 80 %“ ✓ log.taken');
  assert.equal(r(5).who.sub, '👆 Anna');
  assert.equal(r(6).what, 'on 20 % → 80 %');
  assert.equal(r(7).dev, 'log.link');
  assert.equal(r(8).who.text, '👤 Max');
  assert.equal(D.commandWords({ sv: 'climate.set_temperature', v: { temperature: 21.5 } }, t, deg), 'log.target1{"v":"21,5°"}');
  assert.equal(D.commandWords({ sv: 'cover.set_cover_position', v: { position: 30 } }, t, deg), '30 %');
  assert.equal(D.commandWords({ sv: 'climate.set_hvac_mode', v: { hvac_mode: 'off' } }, t, deg), 'off');
  assert.equal(D.whoWords({ k: 's', w: { k: 'addon', src: 'heat', n: 'window', ago: 300 } }, t).sub, '📋 why:window, log.agoMin{"n":5}');
  assert.equal(D.whoWords({ k: 's', w: { k: 'addon', src: 'page', n: 'wish' } }, t).sub, '👆 log.src.wish');
  assert.equal(D.whoWords({ k: 's', w: { k: 'gap' } }, t).text, '❔ log.who.gap');
});

test("a device's day", () => {
  const start = at(0, 0), d = D.deviceDay(ev, 'light.flur', start, start + 86400, at(19, 0));
  assert.equal(d.changes, 3);
  assert.equal(d.addon, 1);
  assert.equal(d.commands, 1);
  assert.equal(d.ok, 1);
  assert.deepEqual(d.bar.map((b) => b[2]), [false, true, true, false]);           // off until 17:00, on, on brighter, off from 18:30
  assert.ok(Math.abs(d.bar[0][1] - 17 / 24) < 1e-9 && Math.abs(d.bar[3][1] - 19 / 24) < 1e-9);
});

test('the table and the report', () => {
  const csv = D.toCsv(D.filterEvents(ev, { kind: 'commands' }, ctx), ctx);
  const rows = csv.replace('﻿', '').trim().split('\r\n');
  assert.equal(rows.length, 3);
  assert.equal(rows[0], 'log.col.date;log.col.time;log.col.device;log.col.entity;log.col.room;log.col.what;log.col.who;log.col.details');
  assert.equal(rows[1], '28.10.2026;18:10:00;"log.cmdTo{""name"":""Flurlicht""}";light.flur;Flur;„fl.do.on, 80 %“ ✓ log.taken;log.who.addon;👆 Anna');
  const text = D.report(D.filterEvents(ev, {}, ctx), ctx, { version: '4.40.0', now: at(19, 0), from: '28.10.2026', to: '28.10.2026', filters: '', recording: true });
  const lines = text.split('\n');
  assert.equal(lines[0], '📜 tab.log · 3D Floorplan 4.40.0 · 28.10.2026 19:00:00');
  assert.equal(lines[1], 'log.rep.days: 28.10.2026');
  assert.equal(lines[2], 'log.rep.count{"n":6,"d":4,"c":2,"ok":1,"err":3}');
  assert.ok(lines.includes('== 28.10.2026 =='));
  assert.ok(lines.includes('18:00:00 📤 log.cmdTo{"name":"Rollladen Küche"} (Küche) [cover.k]: „fl.cover.close“ ✗ log.notTaken — ⚠️ log.who.err, ▶ „Abend“: 500 nicht verfügbar'));
  assert.ok(D.report([], ctx, { now: at(19, 0), recording: false }).includes('⚠️ log.off'));
});
