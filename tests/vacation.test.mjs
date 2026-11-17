// Unit tests for vacationui.js (🏠 Urlaubs-Licht in the holiday alarm's settings, 5.18.0): the times and bars of tonight's plan, the
// choices of lamps and shutters (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const V = await import(`${process.env.STATIC_DIR || '/tmp/static'}/vacationui.js`);

test('evening minutes as times of day and as bars from 17:00 to 02:30', () => {
  assert.equal(V.clock(390), '18:30');
  assert.equal(V.clock(795), '01:15');
  assert.equal(V.clock(0), '12:00');
  assert.deepEqual(V.bar([300, 870]), { left: 0, width: 100 });
  assert.deepEqual(V.bar([585, 870]), { left: 50, width: 50 });
  assert.deepEqual(V.bar([200, 320]), { left: 0, width: 3.51 });          // cut to the evening drawn
});

test('the lamps and shutters to choose from, the chosen ones kept', () => {
  const ents = [{ entity_id: 'light.b', name: 'Bad' }, { entity_id: 'switch.a', name: 'Aquarium' }, { entity_id: 'cover.wz', name: 'Rollo' }, { entity_id: 'sensor.x' },
    { entity_id: 'cover.garage', name: 'Garagentor', dc: 'garage' }, { entity_id: 'cover.hof', name: 'Hof Tor' }, { entity_id: 'cover.einfahrt', name: 'Garagentor Einfahrt' }];   // never a garage door or gate
  assert.deepEqual(V.vacChoices(ents, ['light', 'switch'], ['light.weg']).map((x) => x.entity), ['switch.a', 'light.b', 'light.weg']);
  assert.deepEqual(V.vacChoices(ents, ['cover']), [{ entity: 'cover.wz', name: 'Rollo' }]);
});
