/* Open, tilted or closed (#624, asked by biggilottecassi): a window can have a second contact, "Kontakt gekippt", beside its contact. Two
 * sensors on one tilt-and-turn pane say three things: the contact "offen" (the pane turned open) and the contact "gekippt" (the pane
 * tilted). The window is open as soon as a contact other than the tilt contact is open, tilted when only the tilt contact is (also with a
 * sensor at the top that is open in both cases: then "offen" wins), else closed. A handle sensor that says it itself (state "tilted", or the
 * attribute window_state "TILTED", e.g. Homematic IP HmIP-SRH) makes the window tilted with one contact. A tilted window counts as open for
 * the alarm, the heating and the rain warning (it is not shut); only its word, its colour and its pane in 3D differ.
 * Pure functions (no three.js, no DOM; unit test: tests/windowtilt.test.mjs). openings.js, walls.js and props.js use them. */

export const TILT_ANGLE = 0.24;                     // how far a tilted pane leans into the room in 3D (about 14°, so it shows)
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
