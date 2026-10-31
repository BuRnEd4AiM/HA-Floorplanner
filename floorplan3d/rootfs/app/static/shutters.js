/* Covers on windows (Rollläden and curtains, #331): every window, also the window of a dormer, can have a cover of its own (a tick in its
 * properties) with a Home Assistant entity (o.shutter, o.shutterEntity), independent of the window's contact sensor: an open cover is no
 * open window. o.shutterStyle picks how it opens: 'roller' (up and down, the default), 'left' / 'right' (a curtain pulled to one side) or
 * 'split' (two panels that part in the middle). In 3D a roller shutter comes down in front of the glass as far as the cover is closed, a
 * cloth curtain is scaled sideways to the side(s) where it gathers (walls.js builds them, openings.js moves them), and a label over the
 * window says how far it is open; in the live mode a tap ball on top of the window opens its card (shuttercard.js: a tall slider, up, stop,
 * down, quick positions; only the cover, not the window's contact, #335) and the room panel lists it under "Covers". The rules are pure
 * functions here (no three.js, no DOM; unit test: tests/shutters.test.mjs). */
import { openingWalls } from './dormerwin.js';
import { pointInPoly } from './rooms.js';

export const SHUTTER_UP = 0.05;            // what is left of the curtain when it is rolled up (the bottom bar under the lintel), share of its height
export const CURTAIN_GATHER = 0.12;        // what is left of a cloth curtain when it is pulled aside, share of its width
export const SHUTTER_STYLES = ['roller', 'left', 'right', 'split'];

/** does opening o have a cover (windows only) */
export const hasShutter = (o) => o?.type === 'window' && !!o.shutter;
/** how the cover of o opens: 'roller' (up/down, also the default of older windows), 'left', 'right' or 'split'; null without one */
export const curtainStyle = (o) => (hasShutter(o) ? (SHUTTER_STYLES.includes(o.shutterStyle) ? o.shutterStyle : 'roller') : null);
/** the style of a cover: 'roller' is the default and is not stored (older layouts stay as they are) */
export function setShutterStyle(o, s) {
  if (!hasShutter(o)) return o;
  if (s && s !== 'roller' && SHUTTER_STYLES.includes(s)) o.shutterStyle = s; else delete o.shutterStyle;
  return o;
}
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
  else { delete o.shutter; delete o.shutterEntity; delete o.shutterStyle; }
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
export function shutterText(st, t, o) {
  if (!st) return '—';
  if (st.state === 'unavailable' || st.state === 'unknown') return t('off.unavailable');
  const roller = !o || curtainStyle(o) === 'roller';     // a cloth curtain opens / closes, it does not go up / down
  if (st.state === 'opening') return t(roller ? 'shutter.opening' : 'curtain.opening');
  if (st.state === 'closing') return t(roller ? 'shutter.closing' : 'curtain.closing');
  const p = typeof st.position === 'number' && Number.isFinite(st.position) ? Math.round(st.position) : null;
  if (p === null) return st.state === 'open' ? t('state.open') : st.state === 'closed' ? t('state.closed') : st.state;
  return p >= 100 ? t('state.open') : p <= 0 ? t('state.closed') : t('shutter.partly', { n: p });
}
/** the arrow of a window's cover: up/down for a roller shutter, the way a cloth curtain is pulled aside */
export const shutterIcon = (o) => { const s = curtainStyle(o); return s === 'left' ? '←' : s === 'right' ? '→' : s === 'split' ? '⇔' : '↕'; };
/** the label over a window with a cover in 3D, like the value label of a device: "↕ 60 % open", "← 60 % open" */
export const shutterLabel = (st, t, o) => `${shutterIcon(o)} ${shutterText(st, t, o)}`;
/** the ball of a shutter sits on top of its window, where the shutter rolls up (#335), never under it: its middle this far over the
 *  window's top (the ball's radius, BALL.r = 0.3 in tapballs.js, and a small gap) */
export const SHUTTER_BALL_LIFT = 0.34;
/** the height of the shutter's ball over the floor */
export const shutterBallY = (o) => (o.sill || 0) + (o.height || 1) + SHUTTER_BALL_LIFT;
/** the height of the label over the floor: over the ball (its radius, a gap and half the label's height) */
export const shutterLabelY = (o) => shutterBallY(o) + 0.55;

/* The card of a shutter (#335, shuttercard.js): a tall slider that shows the curtain, quick positions under it */
/** the quick positions of the card, 0 = closed, 100 = open */
export const SHUTTER_PRESETS = [0, 25, 50, 75, 100];
/** the position (100 = open) for a finger at y on the slider (top, h: its top and height in pixels): the curtain reaches down to the finger,
 *  at the top it is open, at the bottom closed; rest: the part at the top that always shows (the rolled-up curtain); whole percent, the
 *  last SLIDER_SNAP percent at both ends snap to closed / open (a finger at the bottom means closed, not 1 % open) */
export const SLIDER_SNAP = 2;
export function sliderPosition(y, top, h, rest = 0) {
  const span = h - rest, down = span > 0 ? (y - top - rest) / span : 0;
  const p = Math.round(100 * (1 - Math.min(1, Math.max(0, down))));
  return p <= SLIDER_SNAP ? 0 : p >= 100 - SLIDER_SNAP ? 100 : p;
}
/** how long a position just chosen on the card shows before the cover answers (ms), and at most while the cover is on its way there */
export const PENDING_MS = 3000, PENDING_MOVING_MS = 120000;
/** the position the card shows: the one just chosen (pending: { pos, at }, at: Date.now() then) for a moment and while the cover is on its
 *  way, else the cover's own; null when it has none (a cover that only opens and closes) */
export function shownPosition(st, pending, now) {
  const own = typeof st?.position === 'number' && Number.isFinite(st.position) ? Math.round(st.position) : null;
  if (!pending || own === null || own === pending.pos) return own;
  const age = now - pending.at, moving = st?.state === 'opening' || st?.state === 'closing';
  return age < PENDING_MS || (moving && age < PENDING_MOVING_MS) ? pending.pos : own;
}
/** the big line of the card: how far it is open at pos (the position shown), on its way while it moves (up / down for a roller shutter,
 *  opening / closing for a cloth curtain) */
export function shutterCardText(st, pos, t, o) {
  const moving = st?.state === 'opening' || st?.state === 'closing';
  if (pos == null || st?.state === 'unavailable' || st?.state === 'unknown') return shutterText(st, t, o);
  if (moving) return `${shutterText(st, t, o)} · ${pos} %`;
  return shutterText({ state: pos > 0 ? 'open' : 'closed', position: pos }, t);
}
/** the height of a roller shutter as a share of the window (the scale of its pivot): the rolled-up rest at least, all of it when closed;
 *  not known: rolled up, the window stays visible */
export const curtainScale = (closed) => SHUTTER_UP + (1 - SHUTTER_UP) * Math.min(1, Math.max(0, closed ?? 0));
/** the width of a cloth curtain as a share of the window (the scale of its pivot): the gathered rest at least, all of it when closed;
 *  not known: gathered, the window stays visible */
export const curtainWidth = (closed) => CURTAIN_GATHER + (1 - CURTAIN_GATHER) * Math.min(1, Math.max(0, closed ?? 0));
/** how much of a window the cover of style covers: its height (roller) or its width (a cloth curtain) */
export const curtainTarget = (style, closed) => (style === 'roller' ? curtainScale(closed) : curtainWidth(closed));
/** how fast the curtain moves in 3D: share of the window's height per second (all the way in about 3 s), at an even speed like a motor */
export const SHUTTER_SPEED = 0.32;
/** how fast a cloth curtain is pulled aside: share of the window's width per second (all the way in about 1.5 s) */
export const CURTAIN_SPEED = 0.6;
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
/** how far from the middle of the wall a roller shutter hangs: between the glass and the face of a wall of thickness t, never outside it */
export const curtainDepth = (t) => Math.max(0.015, Math.min(0.06, t / 2 - 0.015));
/** how far from the middle of the wall a cloth curtain hangs on the inside: past the face of the wall, into the room */
export const curtainHangDepth = (t) => Math.max(0.06, t / 2 + 0.06);
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
