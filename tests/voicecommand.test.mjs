// Unit tests for voicecommand.js (🗣 switching by voice, #532: an order or a question, what to do, which entities; run like offline.test.mjs,
// see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const C = await import(`${dir}/voicecommand.js`);
const Q = await import(`${dir}/voicequery.js`);

const env = {
  lang: 'de', house: 'h', floor: 'eg', houses: [{ id: 'h', name: 'Haus' }],
  floors: [{ house: 'h', id: 'eg', name: 'Erdgeschoss', kind: 'floor' }, { house: 'h', id: 'og', name: 'Obergeschoss', kind: 'floor' }],
  rooms: [{ house: 'h', floor: 'eg', id: 'wz', name: 'Wohnzimmer' }, { house: 'h', floor: 'eg', id: 'ku', name: 'Küche' }, { house: 'h', floor: 'og', id: 'bad', name: 'Bad' }],
};
const say = (text, lang = 'de') => { const q = Q.understand(text, { ...env, lang }); return { q, c: C.command(text, q, lang) }; };

test('an order: lights on and off, shutters up and down, the TV off; with or without a verb', () => {
  assert.deepEqual(say('Licht im Wohnzimmer aus').c, { act: 'off', what: 'lights' });
  assert.deepEqual(say('Mach im Bad das Licht an').c, { act: 'on', what: 'lights' });
  assert.deepEqual(say('Schalte oben alle Lampen aus').c, { act: 'off', what: 'lights' });
  assert.deepEqual(say('Rollläden in der Küche runter').c, { act: 'close', what: 'covers' });
  assert.deepEqual(say('Fahr die Rollos hoch').c, { act: 'open', what: 'covers' });
  assert.deepEqual(say('Fernseher aus').c, { act: 'off', what: 'media' });
  assert.deepEqual(say('Turn off the lights in the kitchen', 'en').c, { act: 'off', what: 'lights' });
  assert.deepEqual(say('Close the blinds', 'en').c, { act: 'close', what: 'covers' });
  assert.deepEqual(say('Éteins la lumière', 'fr').c, { act: 'off', what: 'lights' });
});

test('a question stays a question; windows, devices or a sentence without an action are no order', () => {
  for (const s of ['Ist das Licht im Bad aus?', 'Ist das Licht im Bad aus', 'Welche Lichter sind an', 'Brennt im Bad Licht', 'Sind die Rollläden unten',
    'Welche Fenster sind offen', 'Wie warm ist es im Bad', 'Licht im Wohnzimmer', 'Was ist alles an']) assert.equal(say(s).c, null, s);
  assert.equal(say('Are the lights on', 'en').c, null);
  assert.equal(say('Fenster zu').c, null);                       // a window cannot be shut from here
});

const items = [
  { kind: 'device', id: 'l1', name: 'Deckenlampe', entity: 'light.wz', floor: 0, room: 'wz', on: true },
  { kind: 'device', id: 'l2', name: 'Stehlampe', entity: 'light.steh', floor: 0, room: 'wz', on: false },
  { kind: 'device', id: 'l3', name: 'Spiegel', entity: 'light.bad', floor: 1, room: 'bad', on: true },
  { kind: 'device', id: 'l4', name: 'Küchenlicht', entity: 'light.kueche', floor: 0, room: 'ku', on: true },
  { kind: 'device', id: 'l5', name: 'Flur', entity: 'light.flur', floor: 0, room: '', on: true },
  { kind: 'device', id: 'l6', name: 'Weg', entity: 'light.weg', floor: 0, room: '', on: true, off: 'unavailable' },
  { kind: 'opening', id: 'w1', name: 'Fenster Küche', type: 'window', floor: 0, room: 'ku', shutter: 'cover.kueche' },
  { kind: 'device', id: 'g1', name: 'Garagentor', entity: 'cover.garage', floor: 0, room: '' },
  { kind: 'device', id: 'tv', name: 'Fernseher', entity: 'media_player.tv', floor: 0, room: 'wz', on: true },
];
const states = { 'light.wz': { state: 'on' }, 'light.steh': { state: 'off' }, 'light.bad': { state: 'on' }, 'light.kueche': { state: 'on' },
  'light.flur': { state: 'on' }, 'cover.kueche': { state: 'open' }, 'cover.garage': { state: 'open' }, 'media_player.tv': { state: 'on' } };

test('the things it switches: in the room said, only those not yet so; the whole house asks first when it is many', () => {
  const t1 = C.targets({ act: 'off', what: 'lights' }, { rest: '' }, items, states, { floor: null, rooms: ['wz'] });
  assert.deepEqual(t1.calls.map((c) => [c.entity, c.service]), [['light.wz', 'turn_off']]);   // the floor lamp is off already
  assert.equal(t1.all, false);
  assert.equal(C.needsConfirm(t1), false);
  const t2 = C.targets({ act: 'off', what: 'lights' }, { rest: '' }, items, states, {});
  assert.deepEqual(t2.calls.map((c) => c.entity), ['light.wz', 'light.bad', 'light.kueche', 'light.flur']);   // not the one offline
  assert.equal(C.needsConfirm(t2), true);
  const t3 = C.targets({ act: 'off', what: 'lights' }, { rest: '' }, items, states, { floor: 1, rooms: [] });
  assert.deepEqual(t3.calls.map((c) => c.entity), ['light.bad']);
  const t4 = C.targets({ act: 'on', what: 'lights' }, { rest: 'stehlampe' }, items, states, {});
  assert.deepEqual(t4.calls.map((c) => [c.entity, c.service]), [['light.steh', 'turn_on']]);
  assert.equal(t4.all, false);                                   // asked by its name: no question first
});

test('shutters: the roller shutter of a window is closed, never the garage door', () => {
  const t = C.targets({ act: 'close', what: 'covers' }, { rest: '' }, items, states, {});
  assert.deepEqual(t.calls.map((c) => [c.entity, c.service]), [['cover.kueche', 'close_cover']]);
  const tv = C.targets({ act: 'off', what: 'media' }, { rest: '' }, items, states, { rooms: ['wz'] });
  assert.deepEqual(tv.calls.map((c) => [c.entity, c.service]), [['media_player.tv', 'turn_off']]);
});
