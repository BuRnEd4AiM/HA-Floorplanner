/* Open, tilted or closed (#624, asked by biggilottecassi): a window can have a second contact, "Kontakt gekippt", beside its contact. Two
 * sensors on one tilt-and-turn pane say three things: the contact "offen" (the pane turned open) and the contact "gekippt" (the pane
 * tilted). The window is open as soon as a contact other than the tilt contact is open, tilted when only the tilt contact is (also with a
 * sensor at the top that is open in both cases: then "offen" wins), else closed. A handle sensor that says it itself (state "tilted", or the
 * attribute window_state "TILTED", e.g. Homematic IP HmIP-SRH) makes the window tilted with one contact. A tilted window counts as open for
 * the alarm, the heating and the rain warning (it is not shut); only its word, its colour and its pane in 3D differ.
 * How far a tilted pane leans in is set per window (o.tiltDeg, 5° to 45°, 14° when not set; tiltui.js is the field).
 * Pure functions (no three.js, no DOM; unit test: tests/windowtilt.test.mjs). openings.js, walls.js, props.js and tiltui.js use them. */

export const TILT_DEG = 14;                         // how far a tilted pane leans into the room in 3D, in degrees (more than a real one, so it shows)
export const TILT_DEG_MIN = 5, TILT_DEG_MAX = 45;   // what the field "Kippwinkel" allows (o.tiltDeg, biggilottecassi in #624: "noch ein bisschen mehr")
export const TILT_ANGLE = (TILT_DEG * Math.PI) / 180;
export const TILT_HEX = 0xffd23a;                   // the colour of a tilted window (an open one is red, a shut one has a green frame)

/** the tilt contact of window o ('' for a door, fixed glazing or none) */
export const tiltEntity = (o) => (o?.type === 'window' && o.style !== 'fixed' && typeof o.tiltEntity === 'string' ? o.tiltEntity : '');

/** does state st say "tilted" by itself (a handle sensor: state "tilted", or the attribute window_state "TILTED")? */
export const saysTilted = (st) => !!st && (String(st.state ?? '').toLowerCase() === 'tilted'
  || String(st.attributes?.window_state ?? '').toLowerCase() === 'tilted');

/** the panes of window o (n of them) that the tilt contact tilts: those without a contact of their own (they follow the main contact),
 *  else the first pane that opens; none without a tilt contact. fixed(i): pane i is fixed; own(i): pane i has a contact of its own */
export function tiltPanes(o, n, fixed = () => false, own = () => false) {
  if (!tiltEntity(o) || n < 1) return [];
  const all = Array.from({ length: n }, (_, i) => i).filter((i) => !fixed(i));
  const follow = all.filter((i) => !own(i));
  return follow.length ? follow : all.slice(0, 1);
}

/** what contact e of window o says: 'open', 'tilted' (the tilt contact is open, or a handle sensor says "tilted") or 'closed'.
 *  isOpen(e): the contact reports open; stateOf(e): its state */
export function contactWord(o, e, isOpen, stateOf = () => null) {
  if (!e) return 'closed';
  const st = stateOf(e);
  if (saysTilted(st)) return 'tilted';
  if (!isOpen(e)) return 'closed';
  return e === tiltEntity(o) ? 'tilted' : 'open';
}

/** the whole window: 'open' when a contact says open, else 'tilted' when one says tilted, else 'closed'. ents: its contacts
 *  (openings.js openingEntities, the tilt contact among them) */
export function windowWord(o, ents, isOpen, stateOf = () => null) {
  const words = ents.map((e) => contactWord(o, e, isOpen, stateOf));
  return words.includes('open') ? 'open' : words.includes('tilted') ? 'tilted' : 'closed';
}

/** pane i of window o in 3D: 'open' (it swings round its hinge), 'tilted' (it leans in round its bottom edge) or 'closed'.
 *  paneEnt: the contact of the pane (openings.js paneEntity); tilts: the pane is one of tiltPanes */
export function paneWord(o, paneEnt, tilts, isOpen, stateOf = () => null) {
  const w = contactWord(o, paneEnt, isOpen, stateOf);
  if (w === 'open') return 'open';
  if (w === 'tilted') return 'tilted';
  const te = tilts ? tiltEntity(o) : '';
  return te && contactWord(o, te, isOpen, stateOf) === 'tilted' ? 'tilted' : 'closed';
}

/** can window o tilt (a window that opens: not a door, not fixed glazing)? */
export const canTilt = (o) => o?.type === 'window' && o.style !== 'fixed';
/** how far window o leans in when it is tilted, in whole degrees: its own o.tiltDeg (5 to 45) or TILT_DEG */
export function tiltDeg(o) {
  const v = Number(o?.tiltDeg);
  return Number.isFinite(v) && v > 0 ? Math.min(TILT_DEG_MAX, Math.max(TILT_DEG_MIN, Math.round(v))) : TILT_DEG;
}
/** the same in radians (walls.js: the angle of the tilt joint) */
export const tiltAngle = (o) => (tiltDeg(o) * Math.PI) / 180;
/** set the tilt angle v (typed in: a number or a text) on window o; TILT_DEG is not stored. Returns the degrees it got */
export function setTiltDeg(o, v) {
  const d = tiltDeg({ tiltDeg: v });
  if (d === TILT_DEG) delete o.tiltDeg; else o.tiltDeg = d;
  return d;
}
/** "Für alle Fenster": tilt angle deg for every window in openings that can tilt; returns how many they are */
export function tiltAll(openings, deg) {
  const wins = openings.filter(canTilt);
  wins.forEach((o) => setTiltDeg(o, deg));
  return wins.length;
}
