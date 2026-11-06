/* ⛰ The terrain in the tool "Grundstück" (#629): the mode "Gelände" of its palette. A tap in the plan sets a spot height (at the height the
 * ground has there; then type in its height), a spot height can be dragged; "A slope in one step": the ground falls by one storey (or as
 * much as typed in) from the far face of the house to the side tapped next (the street); the list of the spot heights with their heights;
 * the contour lines of the plan (every 0.25, 0.5, 1 m or none); "remove the terrain". Stored in layout.plot.terrain ({ points, contours });
 * the rules are in terrain.js (tested), the plan draws it with terrain2d.js, 3D with terrain3d.js. */
import { cleanTerrain, heightField, slopePoints, mainAxis, TERRAIN } from './terrain.js';
import { houseFootprint } from './earth.js';
import { terrainSvg, hitPoint, fmtH, pointNo } from './terrain2d.js';
import { houseBox } from './yard.js';

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const groundIdx = (L) => Math.max(0, (L.floors || []).findIndex((f) => f.kind !== 'basement'));
const r2 = (v) => Math.round(v * 100) / 100;

/** ctx: t, layout(), snapshot(), changed(), setStatus(txt), uid(), fmtLen(m), toDisp(m), fromDisp(v), imperial(), fields: { field, lenInput },
 *  floorH() (the height of a storey, #671), hint(txt), render() (the palette again) */
export function initTerrainUi(ctx) {
  const { t } = ctx;
  let sel = null, pending = null, drop = ctx.floorH?.() || 3, key = null;
  const stored = () => ctx.layout().plot?.terrain || null;
  const points = () => cleanTerrain(stored())?.points || [];
  /** the stored list of points (made when there is none yet) */
  function writable() {
    const L = ctx.layout();
    L.plot = L.plot || {};
    L.plot.terrain = L.plot.terrain || { points: [] };
    L.plot.terrain.points = Array.isArray(L.plot.terrain.points) ? L.plot.terrain.points : [];
    return L.plot.terrain;
  }
  function dropEmpty() {
    const L = ctx.layout();
    if (L.plot?.terrain && !cleanTerrain(L.plot.terrain)) { delete L.plot.terrain; if (!Object.keys(L.plot).length) delete L.plot; }
  }
  const rings = () => { const L = ctx.layout(); return houseFootprint(L.floors || [], groundIdx(L)); };
  const corners = () => rings().flat();

  /* ---------- in the plan ---------- */
  /** a tap in the plan in this mode: the low side of a slope in one step, else a new spot height there */
  function click(x, z) {
    if (pending === 'slope') {
      pending = null;
      const two = slopePoints(corners(), [x, z], drop, mainAxis(rings()));   // square to the house
      if (!two) { ctx.setStatus(t(corners().length ? 'terrain.slopeFar' : 'plot.noHouse')); ctx.render(); hint(); return; }
      ctx.snapshot();
      const ter = writable();
      ter.points = two.map((p) => ({ id: ctx.uid(), ...p }));
      sel = ter.points[1].id;
      ctx.changed();
      ctx.setStatus(t('terrain.slopeDone', { h: ctx.fmtLen(Math.abs(two[1].h)) }));
      ctx.render(); hint();
      return;
    }
    if (points().length >= TERRAIN.maxPoints) { ctx.setStatus(t('terrain.tooMany', { n: TERRAIN.maxPoints })); return; }
    ctx.snapshot();
    const p = { id: ctx.uid(), x: r2(x), z: r2(z), h: r2(heightField(stored())(x, z)) };   // at the height the ground has there: nothing changes yet
    writable().points.push(p);
    sel = p.id;
    ctx.changed();
    ctx.setStatus(t('terrain.added', { n: pointNo(points().length - 1) }));
    ctx.render();
    setTimeout(() => document.getElementById(`terrainH_${p.id}`)?.focus(), 0);   // type in its height right away
  }
  const hit = (x, z, tol) => hitPoint(stored(), x, z, tol);
  /** a spot height dragged in the plan (plan2d.js takes the undo step) */
  function move(id, x, z) {
    const p = (stored()?.points || []).find((q) => q.id === id);
    if (p) { p.x = r2(x); p.z = r2(z); }
  }
  function pick(id) { sel = id; ctx.render(); ctx.planRender?.(); }
  /** where the contour lines are drawn: the plot, else the house with 8 m round it */
  function boxOf() {
    const L = ctx.layout(), b = L.plot?.boundary;
    if (b?.length >= 3) return [Math.min(...b.map((p) => p[0])), Math.max(...b.map((p) => p[0])), Math.min(...b.map((p) => p[1])), Math.max(...b.map((p) => p[1]))];
    const h = houseBox(L.floors) || { x0: 0, x1: 10, z0: 0, z1: 10 };
    return [h.x0 - 8, h.x1 + 8, h.z0 - 8, h.z1 + 8];
  }
  /** the SVG for plan2d.js: o = { clip, sx, sy, s, live, edit } */
  const svg = (o) => (stored() ? terrainSvg({ ...o, box: boxOf(), terrain: stored(), sel, fmtLen: ctx.fmtLen }) : '');

  /* ---------- the palette ---------- */
  function hint() { ctx.hint?.(t(pending === 'slope' ? 'hint.terrainSlope' : 'hint.terrain')); }
  function remove(id) {
    ctx.snapshot();
    const ter = writable();
    ter.points = ter.points.filter((p) => p.id !== id);
    if (sel === id) sel = null;
    dropEmpty();
    ctx.changed(); ctx.render();
  }
  function clear() {
    if (!stored()) return;
    ctx.snapshot();
    delete ctx.layout().plot.terrain;
    dropEmpty();
    sel = null; pending = null;
    ctx.changed(); ctx.render(); hint();
    ctx.setStatus(t('terrain.cleared'));
  }
  /** the elements of the mode "Gelände" (built again only when something changed: a field being typed in keeps its place) */
  function palette(holder) {
    const now = JSON.stringify([stored(), sel, pending, ctx.imperial(), t('terrain.title')]);
    if (now === key && holder.childElementCount) return;
    key = now;
    const { field, lenInput } = ctx.fields, list = points(), c = cleanTerrain(stored());
    const out = [make('p', 'plotHead', `⛰ ${t('terrain.title')}`), make('p', 'sub', t('terrain.help'))];
    /* a slope in one step */
    const one = make('div', 'terrainSlope'); one.id = 'terrainSlope';
    const dropIn = make('input'); dropIn.type = 'number'; dropIn.id = 'terrainDrop'; dropIn.min = '0.1'; dropIn.step = ctx.imperial() ? '0.5' : '0.1';
    dropIn.value = String(+ctx.toDisp(drop).toFixed(2));                 // not part of the plan: no undo step, nothing to save
    dropIn.addEventListener('change', () => { const m = ctx.fromDisp(+dropIn.value); if (m > 0) drop = Math.max(0.1, Math.min(TERRAIN.maxH, m)); });
    const go = make('button', pending === 'slope' ? 'active' : '', `↘ ${t('terrain.slopeGo')}`); go.type = 'button'; go.id = 'terrainSlopeGo';
    go.addEventListener('click', () => { pending = pending === 'slope' ? null : 'slope'; key = null; palette(holder); hint(); });
    one.append(make('p', 'plotHead', t('terrain.slope')), field(t('terrain.drop'), dropIn), go, make('p', 'sub', t(pending === 'slope' ? 'hint.terrainSlope' : 'terrain.slopeHelp')));
    out.push(one);
    /* the spot heights */
    out.push(make('p', 'plotHead', t('terrain.points', { n: list.length })));
    if (!list.length) out.push(make('p', 'sub', t('terrain.none')));
    const rows = make('div', 'terrainList'); rows.id = 'terrainList';
    list.forEach((p, i) => {
      const row = make('div', `terrainRow${p.id === sel ? ' active' : ''}`); row.dataset.tpoint = p.id;
      const name = make('button', 'terrainNo', pointNo(i)); name.type = 'button'; name.title = t('terrain.pick');
      name.addEventListener('click', () => pick(p.id));
      const h = lenInput(() => p.h, (v) => { const q = (stored()?.points || []).find((x) => x.id === p.id); if (q) q.h = r2(Math.max(-TERRAIN.maxH, Math.min(TERRAIN.maxH, v))); }, { min: -TERRAIN.maxH, step: 0.05 });
      h.id = `terrainH_${p.id}`; h.title = t('terrain.height');
      h.addEventListener('focus', () => { if (sel !== p.id) { sel = p.id; ctx.planRender?.(); } });
      const del = make('button', 'terrainDel', '✕'); del.type = 'button'; del.title = t('terrain.remove');
      del.addEventListener('click', () => remove(p.id));
      row.append(name, h, make('span', 'terrainUnit', ctx.imperial() ? 'ft' : 'm'), del);
      rows.append(row);
    });
    out.push(rows);
    if (list.length) out.push(make('p', 'sub', t('terrain.heightHelp', { list: list.map((p, i) => `${pointNo(i)} ${fmtH(p.h, ctx.fmtLen)}`).join(' · ') })));
    /* the contour lines */
    const cur = c ? c.contours : TERRAIN.contour, seg = make('div', 'plotSeg'); seg.id = 'terrainContours';
    [[0.25, ctx.fmtLen(0.25)], [0.5, ctx.fmtLen(0.5)], [1, ctx.fmtLen(1)], [0, t('terrain.off')]].forEach(([v, text]) => {
      const b = make('button', v === cur ? 'active' : '', text); b.type = 'button'; b.dataset.v = String(v); b.setAttribute('aria-pressed', String(v === cur));
      b.disabled = !c;
      b.addEventListener('click', () => { if (!stored()) return; ctx.snapshot(); writable().contours = v; ctx.changed(); ctx.render(); });
      seg.append(b);
    });
    out.push(field(t('terrain.lines'), seg));
    const clr = make('button', '', t('terrain.clear')); clr.type = 'button'; clr.id = 'terrainClear'; clr.disabled = !c;
    clr.addEventListener('click', clear);
    out.push(clr, make('p', 'sub', t('terrain.houseStays')));
    holder.replaceChildren(...out);
  }
  /** the mode was left: no slope waits for its tap */
  function leave() { pending = null; key = null; }

  return { click, hit, move, pick, svg, palette, hint, leave, selected: () => sel, waiting: () => pending };
}
