/* Heaters in the 3D view: a radiator, a towel radiator or a thermostat shows nothing but its temperature, on a pill that is red while it
 * heats and blue while it does not (no tap ball: the pill itself is the tap target); the radiator itself turns red while it heats and a
 * cool blue while it does not. Pure rules (unit test: tests/heating.test.mjs); paintHeat sets the colours on the model's materials. */

/** device types that are heaters */
export const HEATER_TYPES = new Set(['thermostat', 'radiator', 'towelrad']);

/** is device d a heater: linked to a thermostat (climate.*), or a radiator / towel radiator / thermostat linked to anything */
export function isHeater(d) {
  const e = d?.entity || '';
  return e.startsWith('climate.') || (!!e && HEATER_TYPES.has(d.type));
}

/** what a heater does now: 'heating' | 'cooling' | 'idle' | 'off', null when that is not known (no state, unavailable, a sensor).
 *  A thermostat says it with its hvac_action (s.hvac); one that does not report it counts as heating while it is set to heat.
 *  on: whether anything else (a radiator on a switch) is on */
export function heatMode(entityId, s, on = false) {
  if (!entityId || !s || s.state === 'unavailable' || s.state === 'unknown') return null;
  const dom = entityId.split('.')[0];
  if (dom === 'climate') {
    if (s.state === 'off') return 'off';
    if (s.hvac) return ['heating', 'cooling', 'off'].includes(s.hvac) ? s.hvac : 'idle';
    return s.state === 'heat' ? 'heating' : s.state === 'cool' ? 'cooling' : 'idle';
  }
  if (dom === 'sensor' || dom === 'binary_sensor') return null;
  return on ? 'heating' : 'off';
}

/** the colour of a heater's temperature pill: 'heat' (red) while it heats, 'cold' (blue) while it does not, null for the usual dark pill
 *  (not a heater, or nothing known) */
export function pillTone(d, s, on = false) {
  if (!isHeater(d)) return null;
  const m = heatMode(d.entity, s, on);
  return m === 'heating' ? 'heat' : m ? 'cold' : null;
}

/** the look of a radiator by what it does: tint (multiplies the metal's own colour, so slats stay a shade darker), glow colour and strength */
export const HEAT_LOOK = {
  heating: { tint: 0xff4a2a, emissive: 0xff2a0a, intensity: 0.85 },
  cooling: { tint: 0x7fb0ff, emissive: 0x1f6fff, intensity: 0.5 },
  idle: { tint: 0xc2dcff, emissive: 0x000000, intensity: 0 },
  off: { tint: 0xc2dcff, emissive: 0x000000, intensity: 0 },
};
/** the look for heatMode m, null: the radiator's own colour */
export const heatLook = (m) => HEAT_LOOK[m] || null;

/** puts look (heatLook) on a radiator; ud: its model's userData with heat (the three.js standard materials of its metal) and holoHeat (the
 *  same parts in the hologram theme, basic materials without a glow: they take the tint as their colour). Each material's own colour is
 *  kept in its userData.baseColor; look null brings it back */
export function paintHeat(ud, look) {
  [...(ud?.heat || []), ...(ud?.holoHeat || [])].forEach((m) => {
    if (m.userData.baseColor == null) m.userData.baseColor = m.color.getHex();
    m.color.setHex(m.userData.baseColor);
    if (!m.emissive) { if (look) m.color.setHex(look.tint); return; }
    if (look) m.color.multiply(m.color.clone().setHex(look.tint));
    m.emissive.setHex(look ? look.emissive : 0x000000);
    m.emissiveIntensity = look ? look.intensity : 0;
  });
}
