/* The colours of doors and windows (#754, Miicki: "Die Farbe von Türblatt und Zarge einstellen können, pro Türe und als Standard für das
 * ganze Haus"): a door's leaf and frame, a window's frame. Each door or window can have its own (opening.look = { leaf, frame }); else the
 * house's for its inner doors and for its doors to the outside (the front door, a terrace door: settings doorLeaf / doorFrame and
 * outerDoorLeaf / outerDoorFrame, '' = as the inner doors), else as always: a wooden leaf, a white frame; window frames as the setting
 * "Fensterrahmen" says (facade.js). The tint of a contact (red open, yellow tilted, green shut) still goes over it (openings.js partHex).
 * Pure (unit test: tests/doorlook.test.mjs); floorbuild.js / walls.js draw it. */
import { cleanHex } from './finishes.js';
import { pointInPoly } from './rooms.js';

export const LEAF_HEX = '#8a6a48';
export const FRAME_HEX = '#f4f4f4';
/** colours to tap: [key, colour] (names under look.c.<key>) */
export const LEAF_COLORS = [['wood', LEAF_HEX], ['oak', '#c49a6c'], ['walnut', '#5e4330'], ['white', '#f4f4f4'], ['lightgrey', '#c9c9c6'], ['anthracite', '#3a3e43'], ['black', '#1f2022'], ['red', '#8c2f2a']];
export const FRAME_COLORS = [['white', FRAME_HEX], ['oak', '#c49a6c'], ['wood', LEAF_HEX], ['lightgrey', '#c9c9c6'], ['anthracite', '#2e3338'], ['black', '#1f2022']];
/** the settings of the house (server.py DEFAULT_SETTINGS) */
export const DOOR_SETTINGS = ['doorLeaf', 'doorFrame', 'outerDoorLeaf', 'outerDoorFrame'];

/** what a door or window keeps as its own colours: { leaf, frame } (a window has no leaf), undefined without any */
export function cleanOpeningLook(v, type = 'door') {
  if (!v || typeof v !== 'object') return undefined;
  const o = {}, leaf = cleanHex(v.leaf), frame = cleanHex(v.frame);
  if (leaf && type === 'door') o.leaf = leaf;
  if (frame) o.frame = frame;
  return Object.keys(o).length ? o : undefined;
}
/** set one colour of opening o (part: leaf or frame; hex null: the house's again); returns o */
export function setOpeningLook(o, part, hex) {
  const look = { ...(cleanOpeningLook(o.look, o.type) || {}) };
  const c = cleanHex(hex);
  if (c) look[part] = c; else delete look[part];
  const clean = cleanOpeningLook(look, o.type);
  if (clean) o.look = clean; else delete o.look;
  return o;
}

/** does door op of wall w lead outside: inside on one side only. Inside is a room (not a balcony or terrace), or, with outline (the rings
 *  of the house's outline, earth.js houseFootprint), anywhere within it: a corridor that is no room of its own. rooms: the floor's rooms */
export function leadsOut(w, op, rooms, outline = null) {
  const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  const cx = w.a[0] + ux * (+op.pos || 0), cz = w.a[1] + uz * (+op.pos || 0), t = (+w.thickness || 0.2) / 2 + 0.08;
  const inside = (x, z) => {
    const r = (rooms || []).find((q) => (q.points || []).length >= 3 && pointInPoly(x, z, q.points));
    if (r) return !r.terrace;
    return !!outline && outline.some((ring) => ring.length >= 3 && pointInPoly(x, z, ring));
  };
  return inside(cx - uz * t, cz + ux * t) !== inside(cx + uz * t, cz - ux * t);
}

/** the house's colours of its doors (settings): { inner: { leaf, frame }, outer: { leaf, frame } }; outer takes inner's where not set */
export function houseDoors(settings) {
  const s = settings || {}, leaf = cleanHex(s.doorLeaf) || LEAF_HEX, frame = cleanHex(s.doorFrame) || FRAME_HEX;
  return { inner: { leaf, frame }, outer: { leaf: cleanHex(s.outerDoorLeaf) || leaf, frame: cleanHex(s.outerDoorFrame) || frame } };
}
/** the colours opening o is drawn with: { leaf, frame }. A door: its own, else the house's (outer: it leads outside); a window: its own
 *  frame, else windowFrame (the setting "Fensterrahmen", facade.js); leaf of a window: the door leaf colour (not used) */
export function openingColors(o, { settings, outer = false, windowFrame = FRAME_HEX } = {}) {
  const own = cleanOpeningLook(o?.look, o?.type) || {};
  if (o?.type === 'window') return { leaf: LEAF_HEX, frame: own.frame || cleanHex(windowFrame) || FRAME_HEX };
  const h = houseDoors(settings)[outer ? 'outer' : 'inner'];
  return { leaf: own.leaf || h.leaf, frame: own.frame || h.frame };
}
