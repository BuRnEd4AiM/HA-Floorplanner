/* 🏡 The tool "Grundstück" (#538): its palette and the side panel of the plot and of the areas on it. In the palette: draw the plot or an
 * area (a yard of paving, a terrace, a bed, a pond ...: its surface chosen first), corner by corner or as a rectangle of two clicks; the
 * plot's size, its sides and how long each one is, its width and depth when it is a rectangle, "Rechteck ums Haus" in one tap; the list
 * of the areas (a tap selects one) and how much of every surface there is. The side panel of a selected area: its name, surface, size
 * and the length of each side (typed in: yard.js setEdgeLength); of the plot: the same and its width x depth. The plot and the areas are
 * stored in layout.plot ({ boundary, areas }); plan2d.js draws and edits them like rooms, yard3d.js lays them on the ground. */
import { SURFACES, SURFACE_KEYS, DEFAULT_SURFACE, MAX_AREAS, polyArea, perimeter, edgeList, rectSize, setEdgeLength, setRectSize, rectAround, houseBox,
  surfaceTotals, surfaceColor } from './yard.js';
import { fmtNum, fmtArea } from './i18n.js';

/** ctx: $, t, layout(), snapshot(), changed(), setStatus(txt), select(sel), selection(), uid(), fmtLen(m), imperial(), toDisp(m), fromDisp(v),
 *  fields ({ field, inp, lenInput } of propfields.js), deleteItem(sel), hint(txt) (the line under the tools) */
export function initPlotUi(ctx) {
  const { $, t } = ctx;
  const body = $('#plotBody');
  let mode = null, shape = 'free', surface = DEFAULT_SURFACE;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const plot = () => ctx.layout().plot || null;
  const boundary = () => (plot()?.boundary?.length >= 3 ? plot().boundary : null);
  /** the areas as they are (plan2d.js moves their corners in place), only those with corners */
  const areas = () => (Array.isArray(plot()?.areas) ? plot().areas.filter((a) => Array.isArray(a?.points) && a.points.length >= 3) : []);
  const m2 = (pts) => fmtArea(polyArea(pts), ctx.imperial());
  const surfName = (k) => t(`yard.s.${k}`);
  const nameOf = (a) => a.name || surfName(a.surface);
  const curMode = () => mode || (boundary() ? 'area' : 'plot');
  /** a segmented choice: [[value, text]]; mark(el, value) marks the one chosen */
  function seg(id, items, on) {
    const w = make('div', 'plotSeg'); w.id = id;
    items.forEach(([v, text]) => { const b = btn('', text, () => on(v)); b.dataset.v = v; w.append(b); });
    return w;
  }
  const mark = (el, value, key = 'v') => el.querySelectorAll('button').forEach((b) => { const on = b.dataset[key] === value; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  const swatch = (k) => { const s = make('i', 'yardSw'); s.style.background = surfaceColor(k); return s; };

  /* ---------- the palette: built once when the tool is chosen, then only marked and filled in (a button never changes under the pointer) ---------- */
  let ui = null;
  function build() {
    const modeSeg = seg('plotMode', [['plot', t('plot.mode.plot')], ['area', t('plot.mode.area')]], (v) => { mode = v; ctx.cancelDraft?.(); render(); hint(); });
    const surfHead = make('p', 'plotHead', t('plot.surface')), grid = make('div', 'yardGrid'); grid.id = 'yardSurfaces';
    SURFACE_KEYS.forEach((k) => {
      const b = btn('', '', () => { surface = k; render(); });
      b.dataset.surface = k; b.title = surfName(k);
      b.append(swatch(k), make('span', '', `${SURFACES[k].icon} ${surfName(k)}`));
      grid.append(b);
    });
    const shapeSeg = seg('plotShape', [['free', t('plot.shape.free')], ['rect', t('plot.shape.rect')]], (v) => { shape = v; ctx.cancelDraft?.(); render(); hint(); });
    const how = make('p', 'sub');
    /* the plot: its size, width and depth when it is a rectangle, a rectangle round the house in one tap */
    const info = make('div', 'plotInfo'); info.id = 'plotInfo';
    const size = make('p', 'plotSize'), none = make('p', 'sub', t('plot.none'));
    const wd = sizeRow([0, 0], (w, d) => { const b = boundary(); if (b) setPlotPoints(setRectSize(b, w, d)); }, 'plot');
    const row = make('div', 'plotAround'), margin = make('input');
    margin.type = 'number'; margin.id = 'plotMargin'; margin.min = '0'; margin.step = '0.5'; margin.value = String(+ctx.toDisp(5).toFixed(1));
    const go = btn('', `▭ ${t('plot.around')}`, () => {
      const r = rectAround(houseBox(ctx.layout().floors), ctx.fromDisp(+margin.value));
      if (r) { setPlotPoints(r); ctx.setStatus(t('plot.set')); } else ctx.setStatus(t('plot.noHouse'));
    });
    go.id = 'plotAround';
    const lab = make('label', '', `${t('plot.margin')} `); lab.append(margin);
    row.append(go, lab);
    info.append(make('p', 'plotHead', t('plot.title')), size, none, wd.row, row);
    const list = make('div', 'yardList'); list.id = 'yardList';
    body.replaceChildren(modeSeg, surfHead, grid, shapeSeg, how, info, list);
    ui = { modeSeg, surfHead, grid, shapeSeg, how, size, none, wd, list };
  }
  function render() {
    if (!body || body.closest('[hidden]')) return;
    if (!ui) build();
    const m = curMode(), b = boundary(), rs = b ? rectSize(b) : null;
    mark(ui.modeSeg, m); mark(ui.shapeSeg, shape); mark(ui.grid, surface, 'surface');
    ui.surfHead.hidden = ui.grid.hidden = m !== 'area';
    ui.how.textContent = t(shape === 'rect' ? 'plot.howRect' : 'plot.howFree');
    ui.size.hidden = !b; ui.none.hidden = !!b;
    if (b) ui.size.textContent = t('plot.size', { area: m2(b), len: ctx.fmtLen(perimeter(b)) });
    ui.wd.row.hidden = !rs;
    if (rs) ui.wd.set(rs);
    ui.list.replaceChildren(...areaList());
    $('#plotHelp').hidden = m !== 'plot';
  }
  /** a number field for a length in the unit shown; set(m) shows a new value (not while it is being typed in) */
  function lenField(v, id, on) {
    const i = make('input'); i.type = 'number'; i.id = id; i.min = '0.1'; i.step = ctx.imperial() ? '0.5' : '0.05';
    i.addEventListener('change', () => { const m = ctx.fromDisp(+i.value); if (m > 0.05) on(m); });
    i.set = (m) => { if (document.activeElement !== i) i.value = String(+ctx.toDisp(m).toFixed(2)); };
    i.set(v);
    return i;
  }
  /** width and depth of a rectangle: two rows "Breite", "Tiefe"; { row, set([w, d]) } */
  function sizeRow([w, d], apply, pre) {
    const { field } = ctx.fields, row = make('div', 'plotWD'), cur = [w, d];
    const wi = lenField(w, `${pre}W`, (W) => apply(W, cur[1])), di = lenField(d, `${pre}D`, (D) => apply(cur[0], D));
    row.append(field(t('plot.width'), wi), field(t('plot.depth'), di));
    return { row, set([W, D]) { cur[0] = W; cur[1] = D; wi.set(W); di.set(D); } };
  }
  /** the list of the areas (a tap selects one) and how much of every surface there is */
  function areaList() {
    const list = areas(), sel = ctx.selection(), out = [make('p', 'plotHead', t('plot.areas', { n: list.length }))];
    if (!list.length) return [...out, make('p', 'sub', t('plot.noAreas'))];
    list.forEach((a) => {
      const b = btn(sel?.kind === 'yard' && sel.id === a.id ? 'active' : '', '', () => ctx.select({ kind: 'yard', id: a.id }));
      b.dataset.yard = a.id;
      b.append(swatch(a.surface), make('span', 'yardName', `${SURFACES[a.surface]?.icon || ''} ${nameOf(a)}`), make('span', 'yardM2', m2(a.points)));
      out.push(b);
    });
    const tot = surfaceTotals(list);
    if (tot.length > 1) out.push(make('p', 'sub yardTotals', t('plot.total', { list: tot.map((x) => `${surfName(x.surface)} ${fmtNum(x.m2, 0)} m²`).join(' · ') })));
    return out;
  }
  function hint() { ctx.hint?.(t(curMode() === 'area' ? (shape === 'rect' ? 'hint.yardRect' : 'hint.yard') : (shape === 'rect' ? 'hint.plotRect' : 'hint.plot'))); }

  /* ---------- changes ---------- */
  function setPlotPoints(points) {
    ctx.snapshot();
    const L = ctx.layout();
    L.plot = { ...(L.plot || {}), boundary: points };
    ctx.changed(); render();
  }
  /** a shape finished in the plan with the tool "Grundstück": the plot (replaces the old one) or a new area of the chosen surface */
  function drawn(points) {
    if (curMode() === 'plot') { setPlotPoints(points); ctx.setStatus(t('plot.set')); mode = 'area'; render(); hint(); return; }   // next: the areas on it
    if (areas().length >= MAX_AREAS) { ctx.setStatus(t('yard.tooMany', { n: MAX_AREAS })); return; }
    ctx.snapshot();
    const L = ctx.layout(), a = { id: ctx.uid(), name: '', surface, points };
    L.plot = L.plot || {};
    (L.plot.areas ||= []).push(a);
    ctx.select({ kind: 'yard', id: a.id });
    ctx.changed();
    ctx.setStatus(t('yard.added', { name: surfName(surface), area: m2(points) }));
    render();
  }
  function clearPlot() {
    const L = ctx.layout();
    if (!L.plot?.boundary) return;
    ctx.snapshot();
    delete L.plot.boundary;
    if (!Object.keys(L.plot).length) delete L.plot;
    if (ctx.selection()?.kind === 'plot') ctx.select(null);
    ctx.changed(); render();
  }
  /** take an area or the plot away (Entf, the eraser, the side panel) */
  function remove(kind, id) {
    const L = ctx.layout();
    if (kind === 'plot') { clearPlot(); return true; }
    if (kind !== 'yard' || !Array.isArray(L.plot?.areas)) return false;
    L.plot.areas = L.plot.areas.filter((a) => a.id !== id);
    if (!L.plot.areas.length) delete L.plot.areas;
    if (!Object.keys(L.plot).length) delete L.plot;
    return true;
  }
  /** the corners of a selected area or of the plot (the arrow keys move them) */
  const pointsOf = (kind, id) => (kind === 'plot' ? boundary() : kind === 'yard' ? areas().find((a) => a.id === id)?.points || null : null);
  $('#plotClear')?.addEventListener('click', clearPlot);

  /* ---------- the side panel of a selected area or the plot ---------- */
  function props(pbody, box, sel) {
    const { field, inp } = ctx.fields, a = sel.kind === 'yard' ? areas().find((q) => q.id === sel.id) : null, pts = a ? a.points : boundary();
    if (!pts) { box.hidden = true; return; }
    box.hidden = false;
    $('#propsTitle').textContent = a ? `${SURFACES[a.surface]?.icon || ''} ${nameOf(a)}` : `🏡 ${t('plot.title')}`;
    if (a) {
      pbody.append(field(t('prop.name'), inp('text', a.name || '', (v) => { a.name = v.trim().slice(0, 40); }, { placeholder: surfName(a.surface), id: 'yardNameIn' })));
      const s = make('select'); s.id = 'yardSurface';
      SURFACE_KEYS.forEach((k) => s.add(new Option(`${SURFACES[k].icon} ${surfName(k)}`, k)));
      s.value = a.surface;
      s.addEventListener('change', () => { ctx.snapshot(); a.surface = s.value; ctx.changed(); });
      pbody.append(field(t('plot.surface'), s));
    }
    const size = make('p', 'plotSize', t('plot.size', { area: m2(pts), len: ctx.fmtLen(perimeter(pts)) })); size.id = 'yardSize';
    pbody.append(size);
    const apply = (next) => { ctx.snapshot(); pts.splice(0, pts.length, ...next); ctx.changed(); };
    const rs = rectSize(pts);
    if (rs) pbody.append(sizeRow(rs, (w, d) => apply(setRectSize(pts, w, d)), 'prop').row);
    const sides = make('div', 'plotSides'); sides.id = 'plotSides';
    edgeList(pts).forEach((e) => {
      const i = lenField(e.len, `plotSide${e.i}`, (L) => apply(setEdgeLength(pts, e.i, L)));
      i.dataset.side = String(e.i);
      sides.append(field(t('plot.side', { n: e.i + 1 }), i));
    });
    pbody.append(make('p', 'plotHead', t('plot.sides')), sides, make('p', 'sub', t('plot.editHint')));
    const del = btn('', t('panel.delete'), () => { ctx.snapshot(); ctx.deleteItem(ctx.selection()); });
    del.id = 'yardDelete';
    pbody.append(del);
  }

  return {
    render, drawn, remove, pointsOf, props, areas, hint,
    /** rectangle drawing (two clicks) is chosen */
    rect: () => shape === 'rect',
    /** the palette opens: the plot first when there is none, else the areas */
    open() { mode = null; ui = null; render(); hint(); },             // built again: the language may have changed
  };
}
