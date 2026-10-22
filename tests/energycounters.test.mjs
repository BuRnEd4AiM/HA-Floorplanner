/* energycounters.js: the power sensors per kind of meter and the meters after the counters were taken ("⤵ Von oben übernehmen") */
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energycounters.js`);
const E = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energycalc.js`);

test('the power sensors set above per kind of meter', () => {
  const split = E.energySources({ grid: { split: true, imp: 'sensor.bezug_w', exp: 'sensor.einsp_w' }, solar: { entities: ['sensor.pv1', 'sensor.pv2'] },
    battery: { split: true, level: 'sensor.soc', charge: 'sensor.laden', discharge: 'sensor.entladen' } });
  assert.deepEqual(C.powerSources(split), { kinds: { from: ['sensor.bezug_w'], to: ['sensor.einsp_w'], solar: ['sensor.pv1', 'sensor.pv2'],
    batIn: ['sensor.laden'], batOut: ['sensor.entladen'] }, signed: [] });
  const one = E.energySources({ grid: { entity: 'sensor.netz' }, battery: { entity: 'sensor.akku', invert: true } });
  assert.deepEqual(C.powerSources(one), { kinds: { from: ['sensor.netz'], to: ['sensor.netz'], batIn: ['sensor.akku'], batOut: ['sensor.akku'] },
    signed: ['sensor.netz', 'sensor.akku'] });
  assert.deepEqual(C.powerSources(E.energySources({})), { kinds: {}, signed: [] });
  assert.equal(C.counterQuery({ solar: ['sensor.a', 'sensor.b'], from: ['sensor.c'] }), 'solar=sensor.a%2Csensor.b&from=sensor.c');
});

test('the counters found go into the meters, those already there stay', () => {
  const found = { solar: [{ power: 'sensor.pv1', counter: { entity_id: 'sensor.pv_gesamt' } }, { power: 'sensor.pv2', counter: null }],
    from: [{ power: 'sensor.netz', counter: { entity_id: 'sensor.bezug' } }], batIn: [{ counter: { entity_id: 'Kaputt' } }] };
  const r = C.takeCounters({ from: ['sensor.bezug'] }, found);
  assert.deepEqual(r.meters.solar, ['sensor.pv_gesamt']); assert.deepEqual(r.meters.from, ['sensor.bezug']); assert.deepEqual(r.meters.batIn, []);
  assert.deepEqual(r.added, [{ kind: 'solar', id: 'sensor.pv_gesamt' }]); assert.deepEqual(r.had, [{ kind: 'from', id: 'sensor.bezug' }]);
});
