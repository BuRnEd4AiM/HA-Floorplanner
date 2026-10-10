/* Roller shutters (Rollläden, #331): every window, also the window of a dormer, can have a roller shutter (a tick in its properties) with a
 * cover entity of its own (o.shutter, o.shutterEntity), independent of the window's contact sensor: an open shutter is no open window. In 3D
 * the curtain comes down in front of the glass as far as the cover is closed (walls.js builds it, openings.js moves it) and a label over
 * the window says how far it is open; in the live mode a tap ball at the window opens its controls (up, stop, down, position) and the room
 * panel lists it under "Covers". The rules are pure functions here (no three.js, no DOM; unit test: tests/shutters.test.mjs). */
import { openingWalls } from './dormerwin.js';
import { pointInPoly } from './rooms.js';

export const SHUTTER_UP = 0.05;            // what is left of the curtain when it is rolled up (the bottom bar under the lintel), share of its height

/** does opening o have a roller shutter (windows only) */
export const hasShutter = (o) => o?.type === 'window' && !!o.shutter;
/** the cover entity of o's shutter, '' when there is none */
export const shutterEntity = (o) => (hasShutter(o) && typeof o.shutterEntity === 'string' ? o.shutterEntity : '');
/** every entity linked to door / window o: its contact sensors (as openingEntities in openings.js, which imports this file) and its
 *  shutter, each once */
export const linkedEntities = (o) => [...new Set([o.entity, ...(o.paneEntities || []), shutterEntity(o)].filter(Boolean))];
/** the shutter entities of the doors / windows of floor f (also of the dormer windows that belong to it) */
export const floorShutters = (f) => openingWalls(f).flatMap((w) => (w.openings || []).map(shutterEntity)).filter(Boolean);

/** the tick in the properties: on gives window o a shutter, off takes it away together with its entity */
export function setShutter(o, on) {
  if (on && o.type === 'window') o.shutter = true;
  else { delete o.shutter; delete o.shutterEntity; }
  return o;
}
/** the entity picker of the shutter: '' removes the entity */
export function setShutterEntity(o, e) {
  if (e) o.shutterEntity = e; else delete o.shutterEntity;
  return o;
}
/** the entities offered for a shutter: Home Assistant's covers, every entity when there is none */
export function shutterChoices(entities) {
  const covers = entities.filter((e) => e.domain === 'cover' || String(e.entity_id || '').startsWith('cover.'));
  return covers.length ? covers : entities;
}

/** how far the shutter is down, 0 = rolled up, 1 = closed: from the cover's position (100 = open), else from open / closed (on its way
 *  counts as where it goes); null when it is not known (no state, unavailable) */
export function shutterClosed(st) {
  if (!st) return null;
  if (typeof st.position === 'number' && Number.isFinite(st.position)) return Math.min(1, Math.max(0, 1 - st.position / 100));
  if (st.state === 'closed' || st.state === 'closing') return 1;
  if (st.state === 'open' || st.state === 'opening') return 0;
  return null;
}
/** the state of a cover in words: open, closed, "60 % open", on its way up / down (st: its stored state, t translates) */
export function shutterText(st, t) {
  if (!st) return '—';
  if (st.state === 'unavailable' || st.state === 'unknown') return t('off.unavailable');
  if (st.state === 'opening') return t('shutter.opening');
  if (st.state === 'closing') return t('shutter.closing');
  const p = typeof st.position === 'number' && Number.isFinite(st.position) ? Math.round(st.position) : null;
  if (p === null) return st.state === 'open' ? t('state.open') : st.state === 'closed' ? t('state.closed') : st.state;
  return p >= 100 ? t('state.open') : p <= 0 ? t('state.closed') : t('shutter.partly', { n: p });
}
/** the label over a window with a roller shutter in 3D, like the value label of a device: "↕ 60 % open" */
export const shutterLabel = (st, t) => `↕ ${shutterText(st, t)}`;
/** the height of that label over the floor: just over the window's lintel */
export const shutterLabelY = (o) => (o.sill || 0) + (o.height || 1) + 0.22;
/** the height of the curtain as a share of the window (the scale of its pivot): the rolled-up rest at least, all of it when closed;
 *  not known: rolled up, the window stays visible */
export const curtainScale = (closed) => SHUTTER_UP + (1 - SHUTTER_UP) * Math.min(1, Math.max(0, closed ?? 0));
/** how fast the curtain moves in 3D: share of the window's height per second (all the way in about 3 s), at an even speed like a motor */
export const SHUTTER_SPEED = 0.32;
/** the curtain's height after dt seconds on its way from cur to target (never past it) */
export function curtainStep(cur, target, dt, speed = SHUTTER_SPEED) {
  const d = target - cur, step = speed * Math.max(0, dt);
  return Math.abs(d) <= step ? target : cur + Math.sign(d) * step;
}
/** the slats of a curtain of height h: how many (about `pitch` m each, at least 3) and the height of one */
export function shutterSlats(h, pitch = 0.07) {
  const n = Math.max(3, Math.round(h / pitch));
  return { n, sh: h / n };
}
/** how far from the middle of the wall the curtain hangs: between the glass and the face of a wall of thickness t, never outside it */
export const curtainDepth = (t) => Math.max(0.015, Math.min(0.06, t / 2 - 0.015));
/** which side of wall w the roller shutter of window o hangs on, in the wall's local z (+1: the side of the normal (-dz, dx), as in the
 *  2D plan; -1: the other one): outside, where there is no room of the floor (rooms) while there is one on the other side; the front wall
 *  of a dormer knows its outside (w.outside, dormerwin.js); else +1. The panes of the window then tilt to the other side, inwards. */
export function shutterSide(w, o, rooms = []) {
  if (w.outside === 1 || w.outside === -1) return w.outside;
  const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
  const cx = w.a[0] + ux * (o.pos || 0), cz = w.a[1] + uz * (o.pos || 0), d = (w.thickness || 0.2) / 2 + 0.25;
  const room = (k) => rooms.some((r) => (r.points || []).length >= 3 && pointInPoly(cx - uz * d * k, cz + ux * d * k, r.points));
  return room(1) && !room(-1) ? -1 : 1;
}
