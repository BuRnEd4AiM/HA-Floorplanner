// Unit tests for cards.js (own cards on the pages of the tab bar, #484; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/cards.js`);
const card = (c) => C.cleanCard({ id: 'c_abc123', ...c });

test('fourteen kinds (the calendar since #495, the train since #550), each with an icon', () => {
  assert.equal(C.CARD_TYPES.length, 14);
  for (const t of C.CARD_TYPES) assert.ok(C.TYPE_ICON[t], t);
});
test('a card takes only an entity of a fitting kind', () => {
  assert.equal(C.fitsType('switch', 'switch.pumpe'), true); assert.equal(C.fitsType('switch', 'sensor.x'), false);
  assert.equal(C.fitsType('value', 'binary_sensor.tuer'), true); assert.equal(C.fitsType('graph', 'sensor.t'), true); assert.equal(C.fitsType('graph', 'light.a'), false);
  assert.equal(C.fitsType('thermostat', 'water_heater.wp'), true); assert.equal(C.fitsType('text', 'light.a'), false); assert.equal(C.fitsType('value', 'Bad Id'), false);
});
test('cards made safe by their kind', () => {
  assert.deepEqual(card({ type: 'switch', entity: 'switch.pumpe', name: ' Pumpe ', width: 9 }), { id: 'c_abc123', type: 'switch', name: 'Pumpe', width: 1, entity: 'switch.pumpe' });
  assert.equal(card({ type: 'switch', entity: 'sensor.x' }), null);
  assert.deepEqual([card({ type: 'graph', entity: 'sensor.t' }).hours, card({ type: 'graph', entity: 'sensor.t' }).width, card({ type: 'graph', entity: 'sensor.t', hours: 168, color: 'red' }).color], [24, 2, 'red']);
  assert.equal(card({ type: 'value', entity: 'sensor.t', color: 'pink' }).color, 'blue');
  assert.deepEqual(card({ type: 'entities', entities: ['light.a', 'light.a', 'bad', 'sensor.b'] }).entities, ['light.a', 'sensor.b']);
  assert.equal(card({ type: 'entities', entities: [] }), null);
  assert.equal(card({ type: 'room', room: 'r1' }).room, 'r1'); assert.equal(card({ type: 'room' }), null);
  assert.equal(card({ type: 'text', text: 'Hallo\u0007' }).text, 'Hallo'); assert.equal(card({ type: 'text' }), null);
  assert.equal(card({ type: 'text', name: 'Nur Titel' }).name, 'Nur Titel');
  assert.equal(card({ type: 'builtin', builtin: 'today:weather' }).builtin, 'today:weather'); assert.equal(card({ type: 'builtin', builtin: 'x' }), null);
  assert.equal(C.cleanCard({ id: 'bad', type: 'text', text: 'x' }), null); assert.equal(C.cleanCard({ id: 'c_abc', type: 'nope' }), null);
  assert.deepEqual(C.cardEntities(card({ type: 'entities', entities: ['light.a'] })), ['light.a']); assert.deepEqual(C.cardEntities(card({ type: 'text', text: 'x' })), []);
});
test('what a tap does, the kind that suits an entity, cards for an area', () => {
  assert.equal(C.tapService('scene.kino'), 'turn_on'); assert.equal(C.tapService('light.a'), 'toggle'); assert.equal(C.tapService('sensor.t'), null);
  assert.equal(C.suggestType('light.a'), 'light'); assert.equal(C.suggestType('climate.wz'), 'thermostat'); assert.equal(C.suggestType('sensor.t', '21'), 'value');
  assert.equal(C.suggestType('sensor.t'), null); assert.equal(C.suggestType('zone.home'), null);
  let n = 0;
  const cards = C.suggestCards(['sensor.t', 'light.a', 'zone.x', 'switch.p'], { 'sensor.t': { state: '3' } }, () => `c_s${n++}xx`);
  assert.deepEqual(cards.map((c) => [c.type, c.entity]), [['light', 'light.a'], ['switch', 'switch.p'], ['value', 'sensor.t']]);
  assert.equal(new Set(cards.map((c) => c.id)).size, 3);
});
test('a value to show: one decimal, big numbers without, other states as they are', () => {
  assert.deepEqual(C.valueOf({ state: '21.456', unit: '°C' }, 'de'), { v: '21,5', unit: '°C', num: 21.456 });
  assert.deepEqual(C.valueOf({ state: '1234.5', unit: 'W' }, 'de'), { v: '1.235', unit: 'W', num: 1234.5 });
  assert.deepEqual(C.valueOf({ state: '42', unit: '%' }, 'en'), { v: '42', unit: '%', num: 42 });
  assert.deepEqual(C.valueOf({ state: 'on' }), { v: 'on', unit: '', num: null });
  assert.deepEqual(C.valueOf({ state: '12abc' }), { v: '12abc', unit: '', num: null });
  assert.deepEqual(C.valueOf(null), { v: '–', unit: '', num: null });
});
test('a history as a line: min, max, the last value, grid lines; nothing with fewer than two points', () => {
  const p = C.chartPaths([[0, 1], [1000, 5], [2000, 3]], 100, 50, { l: 0, r: 0, t: 0, b: 0 });
  assert.equal(p.min, 1); assert.equal(p.max, 5); assert.equal(p.last, 3);
  assert.equal(p.line, 'M0.0,50.0 L50.0,0.0 L100.0,25.0');
  assert.ok(p.area.endsWith('Z')); assert.deepEqual(p.ticks, [2, 4]);
  assert.equal(C.chartPaths([[0, 1]]), null); assert.equal(C.chartPaths(null), null);
  assert.ok(C.chartPaths([[0, 2], [1, 2]]).ticks.length >= 1);                         // a flat line still has a scale
});
test('a history card with several sensors (#495): each once, at most six, one scale, a colour each', () => {
  const c = C.cleanCard({ id: 'c_abc', type: 'graph', entity: 'sensor.a', more: ['sensor.b', 'sensor.a', 'sensor.b', 'light.x', 'sensor.c', 'sensor.d', 'sensor.e', 'sensor.f', 'sensor.g'] });
  assert.deepEqual(c.more, ['sensor.b', 'sensor.c', 'sensor.d', 'sensor.e', 'sensor.f']);
  assert.deepEqual(C.cardEntities(c), ['sensor.a', 'sensor.b', 'sensor.c', 'sensor.d', 'sensor.e', 'sensor.f']);
  assert.equal(C.cleanCard({ id: 'c_abc', type: 'graph', entity: 'sensor.a', more: [] }).more, undefined);
  assert.equal(C.seriesColor({ color: 'orange' }, 0), C.COLOR_HEX.orange);
  assert.notEqual(C.seriesColor({ color: 'orange' }, 1), C.COLOR_HEX.orange);       // the others never repeat the first
  const m = C.chartMany([[[0, 0], [10, 100]], [[5, 50], [10, 0]], [[1, 1]]], 100, 100, { l: 0, r: 0, t: 0, b: 0 });
  assert.equal(m.lines[0], 'M0.0,100.0 L100.0,0.0'); assert.equal(m.lines[1], 'M50.0,50.0 L100.0,100.0'); assert.equal(m.lines[2], null);
  assert.equal(m.min, 0); assert.equal(m.max, 100);
  assert.equal(C.chartMany([[[0, 1]]]), null); assert.equal(C.chartMany(null), null);
});

test('a train card: a station or a sensor of DB Infoscreen, "mein Zug" as HH:MM, 2 to 8 departures (#550)', () => {
  assert.deepEqual(C.cleanCard({ id: 'c_zug1', type: 'train', station: ' Fulda ', via: 'Hanau Hbf', mine: '07:12', count: 6 }),
    { id: 'c_zug1', type: 'train', name: '', width: 2, station: 'Fulda', via: 'Hanau Hbf', mine: '07:12', count: 6, sensor: '' });
  assert.deepEqual(C.cleanCard({ id: 'c_zug2', type: 'train', sensor: 'sensor.fulda_departures', mine: '7:12', count: 40 }),
    { id: 'c_zug2', type: 'train', name: '', width: 2, station: '', via: '', mine: '', count: 4, sensor: 'sensor.fulda_departures' });
  assert.equal(C.cleanCard({ id: 'c_zug3', type: 'train', sensor: 'light.x' }), null);
});
