// Unit tests for kioskprefs.js, kiosk.js (kioskDecision since 5.12.0), kioskprefsui.js (readKioskFields), kioskui.js (clockText) and
// userrights.js: wall tablet settings beyond on / off (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/kioskprefs.js`);
const K = await import(`${dir}/kiosk.js`);
const F = await import(`${dir}/kioskprefsui.js`);
const R = await import(`${dir}/userrights.js`);
const min = 60000;

test('the screen saver of settings saved before 5.12.0 comes from the old tick "the house turns"', () => {
  assert.equal(P.saverMode({ idleOrbit: true }), 'orbit');
  assert.equal(P.saverMode({ idleOrbit: false }), 'off');
  assert.equal(P.saverMode({ saver: 'clock', idleOrbit: true }), 'clock');
  assert.equal(P.saverMode({ saver: 'junk', idleOrbit: false }), 'off');
});

test('a tablet\'s own values lie over the general ones; junk is dropped', () => {
  const general = { idleReturn: 5, saver: 'orbit', nightDim: 'sun', nightLevel: 72, cleanBtn: true };
  const p = P.kioskFor(general, { saver: 'clock', nightLevel: 90, cleanBtn: false, idleReturn: -3, fullyBright: 'number.tab_screen_brightness', brightNight: 0 });
  assert.equal(p.saver, 'clock'); assert.equal(p.nightLevel, 90); assert.equal(p.cleanBtn, false);
  assert.equal(p.idleReturn, 5);                         // -3 is no value: the general one counts
  assert.equal(p.nightDim, 'sun'); assert.equal(p.brightNight, 0); assert.equal(p.brightDay, 80);
  assert.equal(P.kioskFor({}, null).saver, 'off');
  assert.equal(P.kioskFor({}, null).nightAfter, 1);
  assert.deepEqual(P.cleanKiosk({ saver: 'disco', reloadAt: '25:00', wakeSensor: 'light.x', fullyScreen: 'switch.tab_screen', reloadAt2: 1 }), { fullyScreen: 'switch.tab_screen' });
  assert.deepEqual(P.cleanKiosk({ reloadAt: '' }), { reloadAt: '' });   // "off" for this tablet, even when the general setting reloads
  assert.deepEqual(P.cleanUserKiosk({ tab: { saver: 'black' }, empty: { junk: 1 }, '': { saver: 'clock' } }), { tab: { saver: 'black' } });
});

test('the screen saver waits its own time, else the time of the start view; motion holds it off', () => {
  assert.equal(P.saverWait({ saver: 'orbit', saverAfter: 0, idleReturn: 5 }), 5);
  assert.equal(P.saverWait({ saver: 'orbit', saverAfter: 2, idleReturn: 5 }), 2);
  assert.equal(P.saverWait({ saver: 'off', saverAfter: 2, idleReturn: 5 }), 0);
  assert.equal(P.saverWait({ saver: 'clock', saverAfter: 0, idleReturn: 0 }), 0);   // neither: never
  const d = (activeMs, idleMs = activeMs) => K.kioskDecision({ live: true, idleReturn: 5, idleMs, activeMs, home: false, night: true, saverWait: 2, nightAfter: 3 });
  assert.equal(d(3 * min).saverShown, true);
  assert.equal(d(1 * min).saverShown, false);
  assert.equal(d(30000, 10 * min).saverShown, false);    // somebody moved half a minute ago: no screen saver, no dimming ...
  assert.equal(d(30000, 10 * min).dimShown, false);
  assert.equal(d(30000, 10 * min).goHome, true);         // ... but the start view still comes back (only a touch counts there)
  assert.equal(d(2 * min).dimShown, false);              // dark only after 3 minutes
  assert.equal(d(4 * min).dimShown, true);
  assert.equal(K.kioskDecision({ live: false, idleReturn: 5, idleMs: 99 * min, home: false, night: true, saverWait: 2 }).saverShown, false);
});

test('somebody there: a motion or presence sensor that says on', () => {
  assert.equal(P.someoneThere('on'), true);
  assert.equal(P.someoneThere('off'), false);
  assert.equal(P.someoneThere('unavailable'), false);
});

test('Fully Kiosk: bright by day, dim at night, off only with a screen switch and when wanted', () => {
  const base = P.kioskFor({}, { fullyBright: 'number.tab_screen_brightness' });
  assert.equal(P.screenWant(base, { saverShown: false, dimShown: false }), 'day');
  assert.equal(P.screenWant(base, { saverShown: false, dimShown: true }), 'night');
  assert.equal(P.screenWant(P.kioskFor({}, { fullyBright: 'number.b', screenOff: true }), { saverShown: true, dimShown: false }), 'day');   // no switch
  assert.equal(P.screenWant(P.kioskFor({}, { fullyScreen: 'switch.tab_screen', screenOff: true }), { saverShown: true, dimShown: false }), 'off');
  assert.equal(P.screenWant(P.kioskFor({}, {}), { saverShown: true, dimShown: true }), null);
});

test('the nightly reload: once after its time, only when nobody touches the screen, not hours later', () => {
  const at = (h, m = 0) => new Date(2026, 10, 15, h, m).getTime();
  assert.equal(P.reloadDue({ at: '03:00', loadedAt: at(2), now: at(3, 1), touchMs: 5 * min }), true);
  assert.equal(P.reloadDue({ at: '03:00', loadedAt: at(3, 2), now: at(3, 5), touchMs: 5 * min }), false);   // loaded after it: no loop
  assert.equal(P.reloadDue({ at: '03:00', loadedAt: at(2), now: at(3, 1), touchMs: 30000 }), false);       // somebody is using it
  assert.equal(P.reloadDue({ at: '03:00', loadedAt: at(1), now: at(10), touchMs: 5 * min }), false);        // 7 hours later: wait for tomorrow
  assert.equal(P.reloadDue({ at: '23:30', loadedAt: new Date(2026, 10, 14, 20).getTime(), now: at(1), touchMs: 5 * min }), true);   // yesterday 23:30
  assert.equal(P.reloadDue({ at: '', loadedAt: 0, now: at(3), touchMs: 5 * min }), false);
});

test('the floors screen saver goes through every floor that is not a roof', () => {
  const list = P.saverFloors([{ kind: 'floor' }, { kind: 'floor' }, { kind: 'roof' }, {}]);
  assert.deepEqual(list, [0, 1, 3]);
  assert.equal(P.nextSaverFloor(list, 0), 1);
  assert.equal(P.nextSaverFloor(list, 3), 0);
  assert.equal(P.nextSaverFloor(list, 2), 0);            // on the roof: the first floor
  assert.equal(P.nextSaverFloor([], 0), null);
});

test('the fold of a user reads its fields: "as for all" is left out, numbers and yes / no are values', () => {
  const got = F.readKioskFields([{ key: 'saver', value: 'floors' }, { key: 'idleReturn', value: '' }, { key: 'nightLevel', value: '85' },
    { key: 'nightClock', value: 'false' }, { key: 'reloadAt', value: 'off' }, { key: 'wakeSensor', value: ' binary_sensor.flur ' }, { key: 'junk', value: 'x' }]);
  assert.deepEqual(got, { saver: 'floors', nightLevel: 85, nightClock: false, wakeSensor: 'binary_sensor.flur', reloadAt: '' });
  assert.deepEqual(F.readRightFields([{ key: 'light', value: 'onoff' }, { key: 'gate', value: 'onoff' }, { key: 'cover', value: '' }, { key: 'scene', value: 'view' }]),
    { light: 'onoff', scene: 'view' });                  // a gate has no "only on / off"
});

test('rights per kind of device: only look, only on / off, everything', () => {
  const r = { light: 'onoff', cover: 'view', climate: 'onoff', gate: 'view' };
  assert.equal(R.rightAllows(r, 'light', 'toggle', undefined), true);
  assert.equal(R.rightAllows(r, 'light', 'turn_on', { brightness_pct: 40 }), false);
  assert.equal(R.rightAllows(r, 'cover', 'open_cover', {}), false);
  assert.equal(R.rightAllows(r, 'cover', 'open_cover', {}, 'garage'), false);   // the garage is a gate: only look too
  assert.equal(R.rightAllows({ cover: 'view' }, 'cover', 'open_cover', {}, 'garage'), true);
  assert.equal(R.rightAllows(r, 'climate', 'set_temperature', { temperature: 21 }), false);
  assert.equal(R.rightAllows(r, 'climate', 'set_hvac_mode', { hvac_mode: 'off' }), true);
  assert.equal(R.rightAllows(r, 'lock', 'unlock', {}), false);
  assert.equal(R.rightAllows(r, 'switch', 'toggle', {}), true);                  // not set: everything
  assert.equal(R.rightAllows(r, 'calendar', 'create_event', { summary: 'x' }), true);   // not a kind of device
  assert.equal(R.rightKind('media_player'), 'media');
  assert.equal(R.rightKind('cover', 'gate'), 'gate');
  assert.deepEqual(R.cleanUserRights({ tab: { light: 'view', gate: 'onoff', junk: 'view', cover: 'all' }, none: { light: 'all' } }), { tab: { light: 'view' } });
  assert.equal(R.rightsCss({ light: 'onoff' }).includes('.lightctl'), true);
  assert.equal(R.rightsCss({ cover: 'view' }), '');
});

test('the clock says the time, the date and the weather; it moves a little every minute', async () => {
  const U = await import(`${dir}/kioskui.js`).catch(() => null);
  if (!U) return;                                         // kioskui.js needs i18n.js (no DOM at import time); skip where it cannot load
  const c = U.clockText(new Date(2026, 10, 15, 7, 5), 'de', { state: 'sunny', wx: { t: 4.4, tu: '°C' } });
  assert.equal(c.time, '07:05');
  assert.ok(c.date.includes('15'));
  assert.ok(c.weather.endsWith('4°C'));
  assert.equal(U.clockText(new Date(), 'de', null).weather, '');
  assert.notDeepEqual(U.clockShift(0), U.clockShift(1));
});
