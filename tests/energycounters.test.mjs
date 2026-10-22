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

test('the counters found go into the meters, else the power sensor itself, never a second meter of a kind', () => {
  const found = { solar: [{ power: 'sensor.pv1', stats: true, counter: { entity_id: 'sensor.pv_gesamt' } }, { power: 'sensor.pv2', stats: true, counter: null }],
    from: [{ power: 'sensor.netz_bezug_w', stats: true, counter: null }], batIn: [{ power: 'sensor.laden', stats: false, counter: null }],
    batOut: [{ power: 'sensor.entladen', stats: true, counter: null }], to: [{ power: 'sensor.netz', stats: true, counter: null }] };
  const r = C.takeCounters({ from: ['sensor.strom_bezug_kwh'] }, found, ['sensor.netz']);
  assert.deepEqual(r.meters.solar, ['sensor.pv_gesamt', 'sensor.pv2']);                 // the counter; the second inverter without one: its power
  assert.deepEqual(r.meters.from, ['sensor.strom_bezug_kwh']);                        // already counted in kWh: the power is not added (twice)
  assert.deepEqual(r.meters.batIn, []);                                               // no statistics in Home Assistant: nothing to count with
  assert.deepEqual(r.meters.batOut, ['sensor.entladen']);
  assert.deepEqual(r.meters.to, []);                                                  // one sensor for both ways: not as a meter
  assert.deepEqual(r.added, [{ kind: 'solar', id: 'sensor.pv_gesamt', how: 'counter' }, { kind: 'solar', id: 'sensor.pv2', how: 'power' },
    { kind: 'batOut', id: 'sensor.entladen', how: 'power' }]);
  assert.deepEqual(r.kept, ['from']);
  const again = C.takeCounters(r.meters, found, ['sensor.netz']);
  assert.deepEqual(again.added, []); assert.deepEqual(again.had.map((x) => x.id), ['sensor.pv_gesamt', 'sensor.pv2', 'sensor.entladen']);
});

test('a power sensor can be a meter (the page counts its mean as kWh)', async () => {
  const H = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energyhistory.js`);
  assert.equal(H.meterKind({ unit: 'W' }), 'power'); assert.equal(H.meterKind({ unit: 'kWh' }), 'energy'); assert.equal(H.meterKind({ unit: '°C' }), null);
  assert.ok(H.KIND_SORT.solar.includes('power') && H.KIND_SORT.batOut.includes('power') && !H.KIND_SORT.water.includes('power'));
});
