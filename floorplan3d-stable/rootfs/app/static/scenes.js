/* Scenes made in the dashboard as real scenes of Home Assistant (#549, the owner: "dass auch die Szenen von LED-Streifen und LEDs auch
 * verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant"): the scene as the editor keeps it ({ name, ents:
 * { entity: { on, pct, rgb, kelvin, fx, pos } } }, the same model as scenes.py), taken from the states now ("📸 Wie jetzt"), in words,
 * and the list of Home Assistant's scenes; "⇉ Auf alle anwenden" and the kinds of devices to pick from (#564). Pure (unit test:
 * tests/scenes.test.mjs); the editor is sceneedit.js, the card scenesui.js. */
import { ours } from './rules.js';
import { kelvinRgb, kelvinNow } from './kelvin.js';

export { kelvinRgb };

export const SCENE_DOMAINS = ['light', 'switch', 'fan', 'input_boolean', 'cover'];
export const SWATCHES = [[255, 40, 30], [255, 130, 20], [255, 214, 40], [40, 220, 90], [35, 224, 255], [30, 110, 255], [170, 80, 255], [255, 60, 160], [255, 255, 255]];
export const WHITES = [['warm', 2700], ['neutral', 4000], ['cold', 6500]];
export const MAX_ENTS = 100;                        // as many devices as scenes.py keeps
/** the kinds of devices the picker filters by (#564) */
export const KINDS = { all: SCENE_DOMAINS, light: ['light'], switch: ['switch', 'fan', 'input_boolean'], cover: ['cover'] };

export const hex = (rgb) => `#${(rgb || [255, 255, 255]).map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
export const fromHex = (h) => (/^#[0-9a-f]{6}$/i.test(h || '') ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : null);
/** one device as it is now (the page's state: brightness in %, rgb, the white tone kel, fxc, position) */
export function deviceNow(entity, st) {
  const dom = entity.split('.')[0], s = st || {};
  if (dom === 'cover') {
    const pos = typeof s.position === 'number' ? s.position : s.state === 'open' ? 100 : 0;
    return { on: pos > 0, pos };
  }
  const x = { on: s.state === 'on' };
  if (dom === 'light' && x.on) {
    if (typeof s.brightness === 'number' && s.brightness > 0) x.pct = Math.round(s.brightness);
    const rgb = s.rgbRaw || s.rgb, kel = kelvinNow(s);
    if (kel) x.kelvin = kel;                        // in its white mode: the white tone, not the colour Home Assistant works out from it
    else if (Array.isArray(rgb) && rgb.length === 3) x.rgb = rgb.map((v) => Math.round(v));
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

/** the devices a scene may hold, for the picker: lights first, then the others, each matching the search and the kind (KINDS) */
export function pickable(entities, chosen, search, kind = 'all') {
  const q = (search || '').trim().toLowerCase(), doms = KINDS[kind] || SCENE_DOMAINS, order = (e) => SCENE_DOMAINS.indexOf(e.entity_id.split('.')[0]);
  return (entities || []).filter((e) => order(e) >= 0 && doms.includes(e.entity_id.split('.')[0]) && !(e.entity_id in (chosen || {}))
    && (!q || `${e.name || ''} ${e.entity_id}`.toLowerCase().includes(q)))
    .sort((a, b) => order(a) - order(b) || (a.name || a.entity_id).localeCompare(b.name || b.entity_id));
}

const domOf = (e) => e.split('.')[0];
/** may device b take the settings of device a ("⇉ Auf alle anwenden"): a roller shutter only those of a roller shutter, the others each
 *  other's (a light the brightness, colour and white tone of a light, else on / off) */
const takes = (a, b) => (domOf(a) === 'cover') === (domOf(b) === 'cover');

/** how many other devices of the scene can take the settings of this one */
export const allTargets = (ents, from) => Object.keys(ents || {}).filter((e) => e !== from && takes(from, e)).length;

/** "⇉ Auf alle anwenden" (#564, the owner: "den Knopf … für egal welches Gerät auf alle anwenden in der Szene"): the settings of one device
 *  for every other device of the scene that can take them. A light gives the other lights on / off, brightness, colour or white tone and its
 *  effect (only to a light that has it: fxOf(entity) -> its effects); switches get on / off (a light that stays on keeps its colour); a
 *  roller shutter gives the others its position. -> { ents (new), n (devices changed) } */
export function applyToAll(ents, from, fxOf = () => []) {
  const src = ents?.[from];
  if (!src) return { ents, n: 0 };
  const sd = domOf(from);
  let n = 0;
  const out = Object.fromEntries(Object.entries(ents).map(([e, x]) => {
    let y = x;
    if (e !== from && takes(from, e)) {
      const d = domOf(e);
      if (d === 'cover') y = { on: src.on, ...(src.pos != null ? { pos: src.pos } : {}) };
      else if (d === 'light' && sd === 'light') {
        y = { on: !!src.on };
        if (src.on) {
          ['pct', 'kelvin'].forEach((k) => { if (src[k] != null) y[k] = src[k]; });
          if (Array.isArray(src.rgb) && src.kelvin == null) y.rgb = [...src.rgb];
          if (src.fx && (fxOf(e) || []).includes(src.fx)) y.fx = src.fx;
        }
      } else y = src.on ? (x.on ? x : { on: true }) : { on: false };
    }
    if (JSON.stringify(y) !== JSON.stringify(x)) n += 1;
    return [e, y];
  }));
  return { ents: out, n };
}
