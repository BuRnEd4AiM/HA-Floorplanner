// Unit tests for appshell.js (📱 the phone as an app; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(`${process.env.STATIC_DIR || '/tmp/static'}/appshell.js`);

test('when the app view is on: a phone in the live view, not the card, a guest, a room tablet or "classic"', () => {
  const base = { phone: true, live: true, card: false, guest: false, roomTablet: false, pref: 'app' };
  assert.ok(A.appMode(base)); assert.ok(A.appMode({ ...base, pref: null }));
  for (const k of ['card', 'guest', 'roomTablet']) assert.ok(!A.appMode({ ...base, [k]: true }), k);
  assert.ok(!A.appMode({ ...base, phone: false })); assert.ok(!A.appMode({ ...base, live: false })); assert.ok(!A.appMode({ ...base, pref: 'classic' }));
});

test('the bar: Start, Räume, 3D-Haus, Energie (when there), Mehr; the rest under Mehr, which lights up for them', () => {
  const tabs = ['start', 'rooms', 'house', 'today', 'energy', 'climate', 'p_abc123'];
  assert.deepEqual(A.barItems(tabs), ['start', 'rooms', 'house', 'energy', 'more']);
  assert.deepEqual(A.barItems(['start', 'rooms', 'house', 'today']), ['start', 'rooms', 'house', 'more']);
  assert.deepEqual(A.moreItems(tabs), ['today', 'climate', 'p_abc123']);
  assert.equal(A.activeItem('climate', tabs), 'more'); assert.equal(A.activeItem('rooms', tabs), 'rooms');
});

test('greeting by the hour', () => {
  assert.deepEqual([6, 12, 19, 23, 3].map(A.greeting), ['morning', 'day', 'evening', 'night', 'night']);
});

test('rooms: lights on first, then somebody there; by floor with the ground floor first; nameless rooms left out', () => {
  const rooms = [{ fi: 1, floor: 'EG', id: 'a', name: 'Küche', lights: 0 }, { fi: 1, floor: 'EG', id: 'b', name: 'Bad', lights: 2 },
    { fi: 2, floor: 'OG', id: 'c', name: 'Büro', lights: 0, occupied: true }, { fi: 0, floor: 'Keller', id: 'd', name: 'Hobby', lights: 0 }, { fi: 1, id: 'e', name: '' }];
  assert.deepEqual(A.roomTiles(rooms).map((r) => r.id), ['b', 'c', 'd', 'a']);
  assert.deepEqual(A.roomTiles(rooms, 2).map((r) => r.id), ['b', 'c']);
  assert.deepEqual(A.byFloor(rooms, 1).map((g) => [g.floor, g.rooms.map((r) => r.name)]), [['EG', ['Bad', 'Küche']], ['OG', ['Büro']], ['Keller', ['Hobby']]]);
});

test('the chips: lights, alarm, open, offline, batteries, outside temperature; only what there is', () => {
  const t = (k, p = {}) => k + (p.n != null ? `:${p.n}` : '');
  assert.deepEqual(A.statusChips({ lightsOn: 3, alarm: 'disarmed', open: 0, offline: 2, low: 0, temp: 14.2 }, t, (v) => v.toFixed(1)).map((c) => [c.key, c.text, c.tone]),
    [['lights', 'app.lightsOn:3', 'on'], ['alarm', 'app.disarmed', 'ok'], ['offline', 'app.offline:2', 'warn'], ['temp', '14.2°', '']]);
  assert.deepEqual(A.statusChips({ lightsOn: 0, alarm: null, temp: null }, t).map((c) => c.key), ['lights']);
});

test('Start (5.36.0): pinned rooms first in their order, then every lit room (never cut off), then the rest up to six', () => {
  const R = (key, lights = 0, extra = {}) => ({ fi: 0, floor: 'EG', id: key, key: `f1/${key}`, name: key.toUpperCase(), lights, ...extra });
  const rooms = [R('a'), R('b', 1), R('c', 2), R('d'), R('e', 1), R('f'), R('g', 1), R('h', 1), R('i', 1), R('j', 1), R('k', 1), R('l', 0, { occupied: true })];
  const ids = (l) => l.map((r) => r.id + (r.pin ? '*' : ''));
  assert.deepEqual(ids(A.startRooms(rooms, [])), ['b', 'c', 'e', 'g', 'h', 'i', 'j', 'k']);            // eight rooms lit: all eight, none missing
  assert.deepEqual(ids(A.startRooms(rooms.map((r) => ({ ...r, lights: 0 })), [])), ['l', 'a', 'b', 'c', 'd', 'e']);   // nothing lit: six, somebody there first
  assert.deepEqual(ids(A.startRooms(rooms, ['f1/d', 'f1/c', 'f1/gone'])), ['d*', 'c*', 'b', 'e', 'g', 'h', 'i', 'j', 'k']);
  assert.deepEqual(ids(A.startRooms([R('a'), R('b'), R('c', 1)], ['f1/b'], 6)), ['b*', 'c', 'a']);
});

test('pins: toggled, kept per house, made safe', () => {
  assert.deepEqual(A.togglePin(['x'], 'y'), ['x', 'y']);
  assert.deepEqual(A.togglePin(['x', 'y'], 'x'), ['y']);
  assert.deepEqual(A.togglePin(undefined, 'x'), ['x']);
  const kept = A.withPins({ main: ['a'] }, 'nachbar', ['b']);
  assert.deepEqual(A.pinsOf(kept, 'main'), ['a']); assert.deepEqual(A.pinsOf(kept, 'nachbar'), ['b']); assert.deepEqual(A.pinsOf(kept, ''), ['a']);
  assert.deepEqual(A.pinsOf({ main: ['a', 'a', 3, '', null, 'b'] }, 'main'), ['a', 'b']);
  assert.deepEqual(A.pinsOf(null, 'main'), []); assert.deepEqual(A.pinsOf('x', 'main'), []); assert.deepEqual(A.withPins([1], 'main', ['a']), { main: ['a'] });
  assert.equal(A.togglePin(Array.from({ length: 30 }, (_, i) => `r${i}`), 'new').length, A.MAX_PINS);
});

test('the round button of a room: all on while one is off, all off while one is on, its scenes, pin, open', () => {
  const keys = (l) => l.map((a) => a.key + (a.n != null ? `:${a.n}` : '') + (a.on ? '!' : ''));
  assert.deepEqual(keys(A.roomActions({ lights: 0, all: 3 })), ['on:3', 'pin', 'open']);
  assert.deepEqual(keys(A.roomActions({ lights: 1, all: 3, pin: true }, [{ id: 'scene.a', name: 'A' }])), ['on:3', 'off:1', 'scene', 'pin!', 'open']);
  assert.deepEqual(keys(A.roomActions({ lights: 2, all: 2 })), ['off:2', 'pin', 'open']);
  assert.deepEqual(keys(A.roomActions({ lights: 0, all: 0 }, [{ id: 'scene.b', name: 'B' }])), ['scene', 'pin', 'open']);
});

test('the chip 📷 (5.36.0): the cameras while the page is there, red with movement', () => {
  const t = (k, p = {}) => k + (p.n != null ? `:${p.n}` : '');
  const c = (s) => A.statusChips({ lightsOn: 0, ...s }, t).filter((x) => x.key === 'cams').map((x) => [x.text, x.tone]);
  assert.deepEqual(c({ cams: 2, motion: 0 }), [['app.cams:2', '']]);
  assert.deepEqual(c({ cams: 2, motion: 1 }), [['app.motion:1', 'warn']]);
  assert.deepEqual(c({ cams: 0, motion: 3 }), []);
});
