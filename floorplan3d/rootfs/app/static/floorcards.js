/* Floor cards (whole-house view): a small card floats beside every floor (rooms, lights on, windows open); a tap opens that floor.
 * The numbers and the placement on the screen are pure functions (tested); initFloorCards creates the cards and moves them. */
import * as THREE from './vendor/three.module.min.js';
import { openingWalls } from './dormerwin.js';

/** the floors that get a card: no roofs, nothing empty. Returns [{ f, i }] */
export const cardFloors = (layout) => layout.floors.map((f, i) => ({ f, i })).filter(({ f }) => f.kind !== 'roof' && (f.walls.length || f.rooms.length));

/** outline and middle of a floor in plan metres: { x0, x1, z0, z1 } */
export function floorBounds(f) {
  const pts = [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points)];
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}

/** lights on and windows open on a floor. env: { states, onStates, isOpen(entity) } */
export function floorCounts(f, env) {
  const lights = f.devices.filter((d) => /^light\./.test(d.entity || '') && env.onStates.has(env.states[d.entity]?.state)).length;
  const windows = openingWalls(f).reduce((a, w) => a + (w.openings || []).filter((o) => o.type === 'window' && env.isOpen(o.entity)).length, 0);
  return { lights, windows };
}

/** the short line of a card on phones held upright (#290): icons instead of words, lights and windows only when there are any */
export function compactParts({ rooms, lights, windows }) {
  return [`▦ ${rooms}`, lights ? `💡 ${lights}` : '', windows ? `🪟 ${windows}` : ''].filter(Boolean);
}

/** estimated width (px) of the short card on phones (name above, the icons below; smaller text) */
export const compactWidth = (name, parts) => 18 + Math.max(name.length * 6.6, parts.join('  ').length * 6.4);

/** phones held upright (#292): the house is drawn a little to the left and smaller, so a free column on the right holds the cards
 *  and they never cover the house. Width of that column in px (0 = no column: not a phone, no cards) */
export function cardColumn({ w, phone, cards }) {
  if (!phone || !cards || !(w > 0)) return 0;
  return Math.round(Math.min(150, Math.max(118, w * 0.32)));
}

/** how much further back the camera stands so the house fits into the part left of the column */
export const columnZoom = (w, col) => (col > 0 && w > col ? w / (w - col) : 1);

/** estimated widths (px) of a card, so the layout never flickers between the wide and the narrow form */
export function cardWidths(name, parts) {
  return { natW: 26 + Math.max(name.length * 7.6, parts.join(' · ').length * 6.3), narrowW: 26 + Math.max(name.length * 7.6, ...parts.map((x) => x.length * 6.3)) };
}

/** Where the cards stand: beside the house (right of its outline, or left when there is no room; never on top of it, even if that is off screen), pushed apart vertically and kept clear of
 *  the bottom buttons. view: { w, h, ox, minX, maxX }, cards: [{ y, height, natW, narrowW }]; returns { narrow, x, ys } (ys: top-middle y per card, same order) */
export function arrangeCards(cards, view) {
  const { w, h, ox, minX, maxX } = view;
  const vis = cards.map((c, k) => ({ k, y: c.y, h: c.height || 44, natW: c.natW || 260, narrowW: c.narrowW || 150 }));
  const wide = Math.max(0, ...vis.map((v) => v.natW)), slim = Math.max(0, ...vis.map((v) => v.narrowW));
  const leftEdge = ox > 0 ? 8 : 150;                       // 150: keep clear of the floor rail
  const fitsRight = maxX + 16 + wide <= w - 8, fitsLeft = minX - 16 - wide >= leftEdge;
  const narrow = !fitsRight && !fitsLeft;                  // no room beside the house: shorter cards, one value per line
  const wmax = narrow ? slim : wide;
  const roomR = w - 8 - (maxX + 16), roomL = minX - 16 - leftEdge;
  // zoomed in, no room on either side (#294): the cards stay beside the house on the side with more room, even when they leave the screen,
  // and never lie on top of the house
  const right = wmax <= roomR || (wmax > roomL && roomR >= roomL);
  const x = right ? maxX + 16 : minX - 16 - wmax;
  const sorted = [...vis].sort((p, q) => p.y - q.y);
  let free = -Infinity;                                  // floors lie close above each other on screen: push the cards apart
  sorted.forEach((v) => { v.y = Math.max(v.y, free); free = v.y + v.h + 6; });
  const last = sorted[sorted.length - 1];
  const over = last ? last.y + last.h / 2 - (h - 64) : 0;   // keep clear of the buttons at the bottom
  const lift = over > 0 ? Math.min(over, Math.max(0, sorted[0].y - sorted[0].h / 2 - 56)) : 0;
  const ys = new Array(cards.length);
  sorted.forEach((v) => { ys[v.k] = v.y - lift - v.h / 2; });
  return { narrow, x, ys };
}

/** whether the cards show at all: only in the whole-house view with a 3D view, and not while one room is opened (a tap on a room
 *  zooms into it, the cards of the floors would then float in the empty space beside it) */
export const cardsShown = ({ house, mode, focused }) => !!house && mode !== '2d' && !focused;

/** ctx: $, t, camera, canvas, layout(), states(), onStates, settings(), isOpen(entity), houseMode(), layoutMode(), roomFocused(), elev(i), floorH, switchFloor(i) */
export function initFloorCards(ctx) {
  const { $, t } = ctx;
  const cards = [];                                  // { el, key, pos: Vector3, corners, natW, narrowW }
  const v3 = new THREE.Vector3();
  function update() {
    const box = $('#floorCards');
    if (!box) return;
    if (!ctx.houseMode()) { if (cards.length) { cards.length = 0; box.replaceChildren(); } return; }
    const layout = ctx.layout(), shown = cardFloors(layout);
    if (cards.length !== shown.length) { cards.length = 0; box.replaceChildren(); }
    shown.forEach(({ f, i }, n) => {
      let c = cards[n];
      if (!c) {
        const el = document.createElement('button'); el.type = 'button'; el.className = 'floorCard';
        el.addEventListener('click', () => ctx.switchFloor(+el.dataset.floor));
        box.append(el);
        c = cards[n] = { el, key: '', pos: new THREE.Vector3(), corners: [] };
      }
      const { x0, x1, z0, z1 } = floorBounds(f), y = ctx.elev(i) + ctx.floorH / 2;
      c.pos.set((x0 + x1) / 2, y, (z0 + z1) / 2);                     // the card points at the middle of the floor ...
      c.corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => new THREE.Vector3(x, y, z));   // ... and keeps clear of its outline
      const { lights, windows } = floorCounts(f, { states: ctx.states(), onStates: ctx.onStates, isOpen: ctx.isOpen });
      const key = JSON.stringify([i, f.name, f.rooms.length, lights, windows, ctx.settings().language]);
      c.el.dataset.floor = i;
      if (key === c.key) return;
      c.key = key;
      c.el.replaceChildren();
      const h = document.createElement('b'); h.textContent = f.name; c.el.append(h);
      const parts = [t('fc.rooms', { n: f.rooms.length }), t('fc.lights', { n: lights }), t('fc.windows', { n: windows })];
      const sp = document.createElement('span'); sp.className = 'fcm';
      parts.forEach((txt) => { const m = document.createElement('em'); m.textContent = txt; sp.append(m); });
      c.el.append(sp);
      const short = compactParts({ rooms: f.rooms.length, lights, windows });   // phones: shown instead of the words (style.css)
      const ss = document.createElement('span'); ss.className = 'fcs'; ss.textContent = short.join('  '); c.el.append(ss);
      Object.assign(c, cardWidths(f.name, parts), { compactW: compactWidth(f.name, short) });
      c.el.title = t('fc.tip', { name: f.name });
    });
  }
  function place() {
    if (!ctx.houseMode() || !cards.length) return;
    const { canvas, camera } = ctx, w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 10 || !cardsShown({ house: true, mode: ctx.layoutMode(), focused: ctx.roomFocused?.() })) { cards.forEach((c) => { c.el.style.display = 'none'; }); return; }   // 2D only or a room opened: no cards
    const cr = canvas.getBoundingClientRect(), br = $('#floorCards').getBoundingClientRect();
    const ox = cr.left - br.left, oy = cr.top - br.top;                                             // 2D + 3D: the 3D view is only part of the stage
    const toScreen = (v) => { v3.copy(v).project(camera); return { x: (v3.x + 1) / 2 * w, y: (1 - v3.y) / 2 * h, ok: v3.z < 1 }; };
    let minX = Infinity, maxX = -Infinity;
    cards.forEach((c) => c.corners.forEach((p) => { const q = toScreen(p); if (q.ok) { minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); } }));
    const vis = [], phone = window.matchMedia?.('(max-width: 760px)').matches;   // phones show the short card (style.css)
    cards.forEach((c) => {
      const q = toScreen(c.pos);
      const on = q.ok && q.y > -40 && q.y < h + 40 && isFinite(maxX);
      c.el.style.display = on ? '' : 'none';
      if (on) vis.push({ c, y: q.y, height: c.el.offsetHeight, natW: phone ? c.compactW : c.natW, narrowW: phone ? c.compactW : c.narrowW });
    });
    const r = arrangeCards(vis, { w, h, ox, minX, maxX });
    cards.forEach((c) => c.el.classList.toggle('narrow', r.narrow));
    vis.forEach((v, k) => { v.c.el.style.transform = `translate(${(r.x + ox).toFixed(0)}px, ${(r.ys[k] + oy).toFixed(0)}px)`; });
  }
  /** the free column on the right for the cards on phones (0 elsewhere); the picture is shifted by half of it (sheetview.js) */
  function column() {
    if (!cardsShown({ house: ctx.houseMode(), mode: ctx.layoutMode(), focused: ctx.roomFocused?.() })) return 0;
    return cardColumn({ w: ctx.canvas.clientWidth, phone: window.matchMedia?.('(max-width: 760px)').matches, cards: cardFloors(ctx.layout()).length });
  }
  return { update, place, column, cards };
}
