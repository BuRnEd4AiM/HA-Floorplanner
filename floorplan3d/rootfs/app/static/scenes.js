/* Scenes made in the dashboard as real scenes of Home Assistant (#549, the owner: "dass auch die Szenen von LED-Streifen und LEDs auch
 * verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant"): the scene as the editor keeps it ({ name, ents:
 * { entity: { on, pct, rgb, kelvin, fx, pos } } }, the same model as scenes.py), taken from the states now ("📸 Wie jetzt"), in words,
 * and the list of Home Assistant's scenes. Pure (unit test: tests/scenes.test.mjs); the editor is sceneedit.js, the card scenesui.js. */
import { ours } from './rules.js';

export const SCENE_DOMAINS = ['light', 'switch', 'fan', 'input_boolean', 'cover'];
export const SWATCHES = [[255, 40, 30], [255, 130, 20], [255, 214, 40], [40, 220, 90], [35, 224, 255], [30, 110, 255], [170, 80, 255], [255, 60, 160], [255, 255, 255]];
export const WHITES = [['warm', 2700], ['neutral', 4000], ['cold', 6500]];

export const hex = (rgb) => `#${(rgb || [255, 255, 255]).map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
export const fromHex = (h) => (/^#[0-9a-f]{6}$/i.test(h || '') ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : null);
/** a white tone (Kelvin) as a colour to show */
export function kelvinRgb(k) {
  const t = Math.max(0, Math.min(1, (k - 2000) / 4500));
  return [255, Math.round(170 + 75 * t), Math.round(80 + 175 * t)];
}

/** one device as it is now (the page's state: brightness in %, rgb, fxc, position) */
export function deviceNow(entity, st) {
  const dom = entity.split('.')[0], s = st || {};
  if (dom === 'cover') {
    const pos = typeof s.position === 'number' ? s.position : s.state === 'open' ? 100 : 0;
    return { on: pos > 0, pos };
  }
  const x = { on: s.state === 'on' };
  if (dom === 'light' && x.on) {
    if (typeof s.brightness === 'number' && s.brightness > 0) x.pct = Math.round(s.brightness);
    const rgb = s.rgbRaw || s.rgb;
    if (Array.isArray(rgb) && rgb.length === 3) x.rgb = rgb.map((v) => Math.round(v));
    if (s.fxc && !/^(none|off|aus|keine?r?)$/i.test(s.fxc)) x.fx = s.fxc;
  }
  return x;
}

/** "📸 Wie jetzt": every device of the scene as it is now */
export function fromStates(ents, states) {
  return Object.fromEntries(Object.keys(ents || {}).map((e) => [e, deviceNow(e, states?.[e])]));
}

/** a device of a scene in a few words ("an · 30 % · Rainbow", "aus", "20 %") */
export function deviceWords(entity, x, t) {
  const dom = entity.split('.')[0];
  if (dom === 'cover') return x.pos != null ? `${x.pos} %` : x.on ? t('sc.open') : t('sc.closed');
  if (!x.on) return t('sc.off');
  const parts = [t('sc.on')];
  if (x.pct != null) parts.push(`${x.pct} %`);
  if (x.kelvin) parts.push(`${x.kelvin} K`);
  if (x.fx) parts.push(x.fx);
  return parts.join(' · ');
}

/** the scenes of Home Assistant for the card: [{ entity, name, cid, ours, members }], the dashboard's own first */
export function sceneList(states, nameOf) {
  return Object.keys(states || {}).filter((e) => e.startsWith('scene.'))
    .map((e) => ({ entity: e, name: nameOf(e) || e, cid: states[e]?.cid || null, ours: ours(states[e]?.cid), members: states[e]?.members || [] }))
    .sort((a, b) => (b.ours - a.ours) || a.name.localeCompare(b.name));
}

/** can it be saved: a name and at least one device */
export const sceneReady = (m) => !!(m && m.name && m.name.trim() && Object.keys(m.ents || {}).length);

/** the devices a scene may hold, for the picker: lights first, then the others, each matching the search */
export function pickable(entities, chosen, search) {
  const q = (search || '').trim().toLowerCase(), order = (e) => SCENE_DOMAINS.indexOf(e.entity_id.split('.')[0]);
  return (entities || []).filter((e) => order(e) >= 0 && !(e.entity_id in (chosen || {}))
    && (!q || `${e.name || ''} ${e.entity_id}`.toLowerCase().includes(q)))
    .sort((a, b) => order(a) - order(b) || (a.name || a.entity_id).localeCompare(b.name || b.entity_id));
}
