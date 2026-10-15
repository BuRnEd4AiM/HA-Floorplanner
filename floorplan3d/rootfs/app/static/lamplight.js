/* The light of the lamps on the floor (#367): which lit devices light their room, how far, in which colour. A lamp that is only switched on and
 * off (a lamp on a relay, a switch entity) shines like any lamp, and a lamp that does not report a colour (the relay, a white-only light)
 * can have a colour of its own (lightColor, e.g. cool white). Pure rules (unit test: tests/lamplight.test.mjs); the shaders that draw the
 * light are in roomlight.js. */
import { deviceInIso } from './roomclip.js';

export const MAX_LIGHTS = 8;
/** how far (r, relative to the setting) and how strongly (k) a kind of lamp lights the room */
export const LIGHT_PROFILE = {
  light: { r: 0.85, k: 0.8 }, lamp: { r: 0.6, k: 0.6 }, orb: { r: 0.3, k: 0.4 }, strip: { r: 0.4, k: 0.4 },
  panel_tri: { r: 0.35, k: 0.4 }, panel_hex: { r: 0.35, k: 0.4 }, panel_sq: { r: 0.35, k: 0.4 }, panel_bar: { r: 0.4, k: 0.4 }, nanoleaf: { r: 0.45, k: 0.5 }, tv_led: { r: 0.55, k: 0.55 },
  ledseg: { r: 0.5, k: 0.45 },
  lamp_paper: { r: 0.6, k: 0.6 }, lamp_arc: { r: 0.65, k: 0.6 }, lamp_table: { r: 0.45, k: 0.5 },
};
/** the device types that are lamps (the palette's lighting group, models.js) */
export const LAMP_TYPES = ['light', 'pendant', 'spot', 'walllamp', 'lamp', 'orb', 'strip', 'ledring', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led',
  'pendant_paper', 'pendant_dome', 'lamp_paper', 'lamp_arc', 'lamp_table'];       // the last ones: lamps in Scandinavian style (scandi.js)
/** is device d a lamp (also a section of an LED ring, 'ledseg') */
export const isLamp = (d) => !!d && (LAMP_TYPES.includes(d.type) || d.type === 'ledseg');

/** '#rrggbb' -> [r, g, b] (0..255), null for anything else */
export function hexRgb(s) {
  const m = /^#([0-9a-f]{6})$/i.exec(s || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** the colour a lit lamp shines in ([r, g, b] 0..255): the colour Home Assistant reports, else the one set on the lamp, else null (the
 *  default light colour of the settings). st: the state of its entity */
export function lampRgb(d, st) {
  if (Array.isArray(st?.rgb)) return st.rgb;
  return hexRgb(d?.lightColor);
}
/** how far a lit device lights its room (a factor of its reach, 0: not at all): a light entity fully, a lamp switched by a relay (a switch
 *  entity on a lamp) too (#367); any other switch (a wall switch, a plug) a little */
export function lampReach(d, entity) {
  if (!/^(light|switch)\./.test(entity || '')) return 0;
  return entity.startsWith('light.') || isLamp(d) ? 1 : 0.6;
}
/** does device d get the field for its own light colour (side panel): a lamp (not an LED ring: its sections are lights of their own) or
 *  anything with a light entity */
export const wantsLightColor = (d) => !!d && d.type !== 'ledring' && (isLamp(d) || /^light\./.test(d.entity || ''));

/** the lamps that light `room` now: devs (every placed entity as a device of its own: a TV's backlight, the sections of an LED ring), the
 *  ones lit (states, onStates) in the room or just outside its edge (a lamp on its wall, not one in the next room; rooms: the floor's rooms).
 *  settings: glowRadius, defaultLightColor. Returns at most MAX_LIGHTS [{ x, y, z, r, c: [r, g, b] (0..1, times the brightness) }]. */
export function lampLights(devs, room, { states, onStates, rooms = [], settings }) {
  const def = hexRgb(settings.defaultLightColor) || [255, 200, 97];
  return devs
    .filter((d) => lampReach(d, d.entity) > 0 && onStates.has(states[d.entity]?.state) && deviceInIso(room, d.x, d.z, rooms))
    .flatMap((d) => {
      const st = states[d.entity];
      const br = st.brightness != null ? 0.12 + 0.88 * st.brightness / 100 : 1;
      const c = (lampRgb(d, st) || def).map((v) => v / 255);
      const prof = LIGHT_PROFILE[d.type] || LIGHT_PROFILE.light;      // an LED strip or a panel does not light the whole room like a ceiling lamp
      const r = settings.glowRadius * (0.7 + 0.5 * br) * lampReach(d, d.entity) * prof.r * (d.type === 'ledseg' ? Math.min(1.6, Math.max(0.7, d.len / 2.5)) : 1);   // a long section lights more of the wall
      if (d.type === 'nanoleaf' && d.panels?.length) {                 // a layout shines from where its panels really are, a little off the wall
        const n = Math.min(4, d.panels.length), a = ((d.rot || 0) * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a), k2 = d.scale || 1, k = br * prof.k * 1.1 / Math.sqrt(n);
        return Array.from({ length: n }, (_, i) => d.panels[Math.floor((i * d.panels.length) / n)]).map((p) => ({
          x: d.x + (p.x * cs * (d.mirror ? -1 : 1) * (d.sx || 1) + 0.12 * sn) * k2, y: (d.y || 0) + p.y * k2 * (d.sy || 1), z: d.z + (-p.x * sn * (d.mirror ? -1 : 1) * (d.sx || 1) + 0.12 * cs) * k2,
          r: r * 0.75, c: c.map((v) => v * k),
        }));
      }
      return [{ x: d.x, y: d.y || 0, z: d.z, r, c: c.map((v) => v * br * prof.k) }];
    })
    .slice(0, MAX_LIGHTS);
}
