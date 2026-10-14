// Unit tests for heating.js (a heater shows only its temperature, red while it heats, blue while it does not; the radiator turns red too;
// run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const H = await import(`${dir}/heating.js`);
const THREE = await import(`${dir}/vendor/three.module.min.js`);

test('heaters: anything linked to a thermostat, and radiators / thermostats linked to anything', () => {
  assert.ok(H.isHeater({ type: 'thermostat', entity: 'climate.bad' }));
  assert.ok(H.isHeater({ type: 'radiator', entity: 'climate.bad' }));
  assert.ok(H.isHeater({ type: 'towelrad', entity: 'switch.handtuch' }));
  assert.ok(H.isHeater({ type: 'sensor', entity: 'climate.bad' }));       // whatever it looks like, it is the thermostat
  assert.ok(!H.isHeater({ type: 'radiator', entity: '' }));               // only drawn, linked to nothing
  assert.ok(!H.isHeater({ type: 'radiator' }));
  assert.ok(!H.isHeater({ type: 'sensor', entity: 'sensor.temp' }));
  assert.ok(!H.isHeater({ type: 'light', entity: 'light.a' }));
  assert.ok(!H.isHeater(null));
});

test('what a thermostat does: its hvac_action, else heating while it is set to heat', () => {
  assert.equal(H.heatMode('climate.a', { state: 'heat', hvac: 'heating' }), 'heating');
  assert.equal(H.heatMode('climate.a', { state: 'heat', hvac: 'idle' }), 'idle');          // set to heat, but warm enough: not heating
  assert.equal(H.heatMode('climate.a', { state: 'auto', hvac: 'preheating' }), 'idle');
  assert.equal(H.heatMode('climate.a', { state: 'cool', hvac: 'cooling' }), 'cooling');
  assert.equal(H.heatMode('climate.a', { state: 'heat', hvac: 'off' }), 'off');
  assert.equal(H.heatMode('climate.a', { state: 'off', hvac: 'heating' }), 'off');         // switched off is off
  assert.equal(H.heatMode('climate.a', { state: 'heat' }), 'heating');                     // reports no hvac_action
  assert.equal(H.heatMode('climate.a', { state: 'cool' }), 'cooling');
  assert.equal(H.heatMode('climate.a', { state: 'auto' }), 'idle');
  assert.equal(H.heatMode('climate.a', { state: 'unavailable' }), null);
  assert.equal(H.heatMode('climate.a', { state: 'unknown' }), null);
  assert.equal(H.heatMode('climate.a', null), null);
  assert.equal(H.heatMode('', { state: 'heat' }), null);
});

test('a radiator on a switch heats while it is on; a sensor says nothing about heating', () => {
  assert.equal(H.heatMode('switch.heizstab', { state: 'on' }, true), 'heating');
  assert.equal(H.heatMode('switch.heizstab', { state: 'off' }, false), 'off');
  assert.equal(H.heatMode('sensor.heizkoerper', { state: '33.7', unit: '°C' }, false), null);
  assert.equal(H.heatMode('binary_sensor.x', { state: 'on' }, true), null);
});

test('the temperature pill of a heater: red while it heats, blue while it does not, dark when nothing is known or not a heater', () => {
  const rad = { type: 'thermostat', entity: 'climate.bad' };
  assert.equal(H.pillTone(rad, { state: 'heat', hvac: 'heating', ct: 33.7 }), 'heat');
  assert.equal(H.pillTone(rad, { state: 'heat', hvac: 'idle', ct: 21 }), 'cold');
  assert.equal(H.pillTone(rad, { state: 'off', ct: 18 }), 'cold');
  assert.equal(H.pillTone(rad, { state: 'cool', hvac: 'cooling' }), 'cold');
  assert.equal(H.pillTone(rad, { state: 'unavailable' }), null);
  assert.equal(H.pillTone({ type: 'radiator', entity: 'sensor.vorlauf' }, { state: '40' }), null);
  assert.equal(H.pillTone({ type: 'sensor', entity: 'sensor.temp' }, { state: '21' }), null);
  assert.equal(H.pillTone({ type: 'light', entity: 'light.a' }, { state: 'on' }, true), null);
});

test('the radiator turns red while it heats, a cool blue while not, and back to its own colour', () => {
  const body = new THREE.MeshStandardMaterial({ color: 0xf4f4f4 }), rib = new THREE.MeshStandardMaterial({ color: 0xdcdcdc });
  const ud = { heat: [body, rib] };
  H.paintHeat(ud, H.heatLook('heating'));
  assert.ok(body.color.r > 0.8 && body.color.g < 0.15 && body.color.b < 0.15, body.color.getHexString());   // red
  assert.ok(rib.color.r < body.color.r);                                                                 // the slats stay a shade darker
  assert.equal(body.emissive.getHex(), H.HEAT_LOOK.heating.emissive);
  assert.ok(body.emissiveIntensity > 0.5);
  H.paintHeat(ud, H.heatLook('idle'));
  assert.ok(body.color.b > body.color.r, body.color.getHexString());                                     // bluish
  assert.equal(body.emissiveIntensity, 0);
  H.paintHeat(ud, H.heatLook(null));
  assert.equal(body.color.getHex(), 0xf4f4f4);
  assert.equal(rib.color.getHex(), 0xdcdcdc);
  assert.equal(body.emissive.getHex(), 0);
  H.paintHeat(ud, H.heatLook('heating')); H.paintHeat(ud, H.heatLook('heating'));                        // again and again: no deeper red
  const once = body.color.getHex();
  H.paintHeat(ud, H.heatLook('heating'));
  assert.equal(body.color.getHex(), once);
});

test('in the hologram theme the radiator\'s parts take the colour itself (no glow there)', () => {
  const fill = new THREE.MeshBasicMaterial({ color: 0x2aa7c9 });
  H.paintHeat({ heat: [], holoHeat: [fill] }, H.heatLook('heating'));
  assert.equal(fill.color.getHex(), H.HEAT_LOOK.heating.tint);
  H.paintHeat({ holoHeat: [fill] }, null);
  assert.equal(fill.color.getHex(), 0x2aa7c9);
  H.paintHeat(undefined, H.heatLook('heating'));                     // nothing to paint: no error
});
