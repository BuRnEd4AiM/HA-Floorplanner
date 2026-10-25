// Unit tests for devicelist.js (the device overview with battery levels, #376; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const D = await import(`${dir}/devicelist.js`);
const G = await import(`${dir}/rooms.js`);

const t = (k, p) => (p ? `${k}:${Object.values(p).join(',')}` : k);
const on = new Set(['on', 'open']);
const pointInPoly = (x, z, pts) => {
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return x >= Math.min(...xs) && x <= Math.max(...xs) && z >= Math.min(...zs) && z <= Math.max(...zs);
};

test('battery: the device\'s own level, its device\'s battery sensor, or a "battery low" sensor', () => {
  const states = {
    'sensor.door_battery': { state: '85', dc: 'battery', unit: '%' }, 'binary_sensor.door': { state: 'off' },
    'sensor.low_battery': { state: '12.4', dc: 'battery' }, 'climate.bad': { state: 'heat' },
    'binary_sensor.trv_low': { state: 'on', dc: 'battery' }, 'climate.wz': { state: 'heat' },
    'vacuum.robbi': { state: 'docked', bat: 64 }, 'sensor.gone_bat': { state: 'unavailable', dc: 'battery' }, 'light.x': { state: 'on' },
  };
  const of = { 'binary_sensor.door': 'sensor.door_battery', 'climate.bad': 'sensor.low_battery', 'climate.wz': 'binary_sensor.trv_low', 'light.x': 'sensor.gone_bat' };
  assert.deepEqual(D.batteryInfo('binary_sensor.door', states, of), { level: 85, low: false });
  assert.deepEqual(D.batteryInfo('climate.bad', states, of), { level: 12, low: true });
  assert.deepEqual(D.batteryInfo('climate.wz', states, of), { level: null, low: true });
  assert.deepEqual(D.batteryInfo('vacuum.robbi', states, of), { level: 64, low: false });
  assert.deepEqual(D.batteryInfo('sensor.door_battery', states, of), { level: 85, low: false });   // a battery sensor placed itself
  assert.equal(D.batteryInfo('light.x', states, of), null);                                       // its battery does not report
  assert.equal(D.batteryInfo('light.x', states, {}), null);
  assert.equal(D.batteryInfo('', states, of), null);
  assert.deepEqual(D.batteryInfo('sensor.b', { 'sensor.b': { state: '20', dc: 'battery' } }), { level: 20, low: true });   // 20 % is low
  assert.equal(D.batteryText({ level: 85, low: false }, t), '🔋 85 %');
  assert.equal(D.batteryText({ level: 9, low: true }, t), '🪫 9 %');
  assert.equal(D.batteryText({ level: null, low: true }, t), '🪫 dl.low');
  assert.equal(D.batteryText({ level: null, low: false }, t), '🔋 dl.ok');
  assert.equal(D.batteryText(null, t), '');
});

const layout = {
  floors: [
    { name: 'EG', rooms: [{ id: 'k', name: 'Küche', points: [[0, 0], [4, 0], [4, 4], [0, 4]] }, { id: 'b', name: 'Bad', points: [[4, 0], [8, 0], [8, 4], [4, 4]] }],
      walls: [{ id: 'w1', a: [0, 0], b: [8, 0], openings: [
        { id: 'o1', type: 'window', pos: 2, entity: 'binary_sensor.fenster', name: 'Fenster Küche' },
        { id: 'o2', type: 'door', pos: 6 },                                                    // no sensor: not listed
        { id: 'o3', type: 'window', pos: 7, shutter: true, shutterEntity: 'cover.rollo' }] }],
      devices: [
        { id: 'd1', type: 'light', x: 1, z: 1, entity: 'light.kueche', name: 'Deckenlicht' },
        { id: 'd2', type: 'thermostat', x: 5, z: 1, entity: 'climate.bad' },
        { id: 'd3', type: 'sofa', x: 2, z: 2 },                                                  // linked to nothing: not listed
        { id: 'd4', type: 'sensor', x: 20, z: 20, entity: 'sensor.garten' },                     // in no room
        { id: 'd5', type: 'switch', x: 2, z: 3, entity: 'switch.relais', name: 'Relais' },
      ] },
    { name: 'OG', rooms: [], walls: [], devices: [] },
  ],
};
const states = {
  'light.kueche': { state: 'on', brightness: 70 }, 'climate.bad': { state: 'heat', ct: 21.46 }, 'sensor.garten': { state: '12.3', unit: '°C', dc: 'temperature' },
  'switch.relais': { state: 'off' }, 'binary_sensor.fenster': { state: 'on' }, 'cover.rollo': { state: 'open', position: 60 },
  'sensor.bad_bat': { state: '9', dc: 'battery' }, 'sensor.fenster_bat': { state: '77', dc: 'battery' },
};
const env = { layout, states, t, pointInPoly, distToPoly: G.distToPoly, onStates: on, batteryOf: { 'climate.bad': 'sensor.bad_bat', 'binary_sensor.fenster': 'sensor.fenster_bat' },
  offline: new Map([['d5', 'unavailable']]), nameOf: (e) => ({ 'climate.bad': 'Heizung Bad' }[e] || '') };

test('the overview: linked devices and doors / windows with a sensor, by floor and room, with state, battery and offline', () => {
  const rows = D.deviceRows(env);
  assert.equal(rows.length, 1);                                    // the empty upper floor is left out
  assert.equal(rows[0].name, 'EG');
  assert.deepEqual(rows[0].rooms.map((r) => r.name), ['Bad', 'Küche', 'dl.noRoom']);   // by name, no room last
  const kitchen = rows[0].rooms[1].items;
  assert.deepEqual(kitchen.map((i) => i.name), ['Deckenlicht', 'Fenster Küche', 'Relais']);
  const win = kitchen[1];
  assert.equal(win.kind, 'opening'); assert.equal(win.icon, '🪟'); assert.equal(win.value, 'state.open');
  assert.deepEqual(win.battery, { level: 77, low: false });
  assert.equal(kitchen[0].icon, '💡'); assert.equal(kitchen[2].icon, '⏻');   // a light bulb, the drawn switch as ⏻
  assert.equal(kitchen[2].off, 'unavailable');
  const bath = rows[0].rooms[0].items;
  assert.deepEqual(bath.map((i) => [i.id, i.name, i.value, i.battery]), [
    ['d2', 'Heizung Bad', '🌡 21,5 °C', { level: 9, low: true }],          // the name from Home Assistant, its device's battery
    ['o3', 'prop.window', '↕ shutter.partly:60', null]]);                  // a window with only a roller shutter: its text
  assert.equal(rows[0].rooms[2].items[0].id, 'd4');
});

test('filters: with a battery (the emptiest first), offline; empty rooms go', () => {
  const rows = D.deviceRows(env);
  const bat = D.filterRows(rows, 'battery');
  assert.deepEqual(bat[0].rooms.map((r) => [r.name, r.items.map((i) => i.id)]), [['Bad', ['d2']], ['Küche', ['o1']]]);
  const off = D.filterRows(rows, 'offline');
  assert.deepEqual(off[0].rooms.map((r) => [r.name, r.items.map((i) => i.id)]), [['Küche', ['d5']]]);
  assert.deepEqual(D.filterRows(rows, 'all'), rows);
  assert.deepEqual(D.filterRows(D.deviceRows({ ...env, offline: new Map() }), 'offline'), []);
  const order = D.filterRows([{ rooms: [{ name: 'R', items: [
    { name: 'a', battery: { level: 80, low: false } }, { name: 'b', battery: { level: 15, low: true } }, { name: 'c', battery: { level: null, low: true } }, { name: 'd', battery: { level: 40, low: false } }] }] }], 'battery');
  assert.deepEqual(order[0].rooms[0].items.map((i) => i.name), ['b', 'c', 'd', 'a']);
});

test('summary: how many, on / open, with a battery, low, offline', () => {
  assert.deepEqual(D.summary(D.deviceRows(env)), { n: 6, on: 2, battery: 2, low: 1, off: 1 });
  assert.deepEqual(D.summary([]), { n: 0, on: 0, battery: 0, low: 0, off: 0 });
});

test('"what is still on?" (#471): lights and other things that run, open doors and windows; not a heating thermostat, not offline', () => {
  const rows = D.deviceRows(env);
  const on = D.filterRows(rows, 'on');
  assert.deepEqual(on[0].rooms.map((r) => [r.name, r.items.map((i) => i.id)]), [['Küche', ['d1', 'o1']]]);   // the lamp and the open window
  assert.deepEqual(D.filterRows(D.deviceRows({ ...env, states: { ...states, 'light.kueche': { state: 'off' }, 'binary_sensor.fenster': { state: 'off' } } }), 'on'), []);
  const st = { 'light.a': { state: 'on' }, 'media_player.tv': { state: 'playing' }, 'media_player.idle': { state: 'idle' }, 'vacuum.r': { state: 'cleaning' },
    'climate.c': { state: 'heat' }, 'person.p': { state: 'home' }, 'lock.l': { state: 'unlocked' }, 'binary_sensor.m': { state: 'on' }, 'switch.s': { state: 'unavailable' } };
  assert.deepEqual(Object.keys(st).filter((e) => D.isRunning(e, st)), ['light.a', 'media_player.tv', 'vacuum.r']);
  assert.equal(D.isRunning('', st), false);
  assert.equal(D.isRunning('light.gone', st), false);
  const ring = { floors: [{ name: 'EG', rooms: [], walls: [], devices: [{ id: 'tv', type: 'tv', x: 0, z: 0, entity: 'media_player.idle', ledEntity: 'light.a' }] }] };
  assert.equal(D.deviceRows({ ...env, layout: ring, states: st })[0].rooms[0].items[0].on, true);   // the TV is off, its backlight is on
  assert.ok(D.FILTERS.includes('on'));
});

test('the button with low batteries opens the list at "Battery" (#471), a filter chosen before stays', () => {
  assert.equal(D.openFilter('all', 2), 'battery');
  assert.equal(D.openFilter('all', 0), 'all');
  assert.equal(D.openFilter('offline', 2), 'offline');
  assert.equal(D.openFilter('on', 0), 'on');
});

test('a door on the edge of a room belongs to the nearest room; a sensor that never reported shows a dash', () => {
  const lay = { floors: [{ name: 'EG', rooms: [{ id: 'k', name: 'Küche', points: [[0, 0.1], [4, 0.1], [4, 4], [0, 4]] }],
    walls: [{ id: 'w', a: [0, 0], b: [4, 0], openings: [{ id: 'od', type: 'door', pos: 2, entity: 'binary_sensor.tuer' }] }], devices: [] }] };
  const rows = D.deviceRows({ ...env, layout: lay, states: {} });
  assert.deepEqual(rows[0].rooms.map((r) => [r.name, r.items[0].icon, r.items[0].value]), [['Küche', '🚪', '—']]);
});
