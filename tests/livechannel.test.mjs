// Unit tests for livechannel.js (the live channel, split step 22 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/livechannel.js`);
const toState = (e) => ({ state: e.state });

test('a pushed change updates the entity in its place, adds new ones at the end, removes the gone ones', () => {
  const ents = [{ entity_id: 'a', state: 'on' }, { entity_id: 'b', state: '1' }, { entity_id: 'c', state: 'x' }];
  const st = { a: { state: 'on' }, b: { state: '1' }, c: { state: 'x' } };
  const r = L.mergeLive(ents, st, { list: [{ entity_id: 'b', state: '2' }, { entity_id: 'd', state: 'new' }], removed: ['c'] }, toState);
  assert.deepEqual(r.entities.map((e) => `${e.entity_id}=${e.state}`), ['a=on', 'b=2', 'd=new']);
  assert.deepEqual(r.states, { a: { state: 'on' }, b: { state: '2' }, d: { state: 'new' } });
});
test('without removals the lists are changed in place (no copy of a long list for every change)', () => {
  const ents = [{ entity_id: 'a', state: 'on' }], st = { a: { state: 'on' } };
  const r = L.mergeLive(ents, st, { list: [{ entity_id: 'a', state: 'off' }] }, toState);
  assert.equal(r.entities, ents); assert.equal(r.states, st); assert.equal(st.a.state, 'off');
  assert.equal(L.mergeLive(ents, st, {}, toState).entities, ents);                     // an empty message changes nothing
});
test('the fingerprint changes with what is drawn, not with the order of other fields', () => {
  const a = [{ entity_id: 'l', state: 'on', brightness: 100, name: 'Lampe' }];
  assert.equal(L.stateSig(a), L.stateSig([{ name: 'Andere', brightness: 100, state: 'on', entity_id: 'l' }]));
  assert.notEqual(L.stateSig(a), L.stateSig([{ ...a[0], brightness: 120 }]));
  assert.notEqual(L.stateSig(a), L.stateSig([{ ...a[0], rgb: [1, 2, 3] }]));
});
test('polling: always while the channel is down, else once a minute', () => {
  assert.equal(L.pollDue(false, 1000, 1001), true);
  assert.equal(L.pollDue(true, 1000, 1000 + L.FULL_MS - 1), false);
  assert.equal(L.pollDue(true, 1000, 1000 + L.FULL_MS + 1), true);
});
test('areas: which entity lies in which Home Assistant area; junk gives none', () => {
  const r = L.areaIndex([{ id: 'kueche', name: 'Küche', entities: ['light.a', 'sensor.t'] }, { id: 'bad', name: 'Bad', entities: ['light.b'] }, { id: 'leer' }]);
  assert.deepEqual(r.areaOf, { 'light.a': 'kueche', 'sensor.t': 'kueche', 'light.b': 'bad' });
  assert.equal(r.areas.length, 3);
  assert.deepEqual(L.areaIndex({ error: 'x' }), { areas: [], areaOf: {} });
});
