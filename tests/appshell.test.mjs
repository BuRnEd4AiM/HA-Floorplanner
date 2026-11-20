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
