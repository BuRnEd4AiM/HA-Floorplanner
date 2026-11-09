/* ▲ A plateau and a raised floor in the side panels (#566): in the tool "Grundstück" a plateau under a building (its outline + 20 cm), the
 * fields of a plateau (its height over the lawn, its edge: a wall of natural stone, concrete, clinker or gabions, or a bank of lawn) and
 * "＋ Außentreppe" at its front door; the fields of the outdoor steps (device `steps`); a room's floor higher or lower than its storey and
 * whether its doors get steps. The rules are in levels.js (tested). */
import { cleanRise, cleanRaise, EDGES, WALL_KEYS, WALL_LOOKS, LEVELS, plateauRing, stepsAtDoor, stepsSize } from './levels.js';
import { buildingsOf, roomOwners } from './buildings.js';
import { houseFootprint } from './earth.js';
import { inIso } from './roomclip.js';

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
/** a row of buttons, one of them pressed: [[value, text]]; on(value) */
function seg(id, items, value, on) {
  const w = make('div', 'plotSeg'); w.id = id;
  items.forEach(([v, text]) => {
    const b = make('button', v === value ? 'active' : '', text); b.type = 'button'; b.dataset.v = v; b.setAttribute('aria-pressed', String(v === value));
    b.addEventListener('click', () => on(v));
    w.append(b);
  });
  return w;
}
const groundIdx = (L) => Math.max(0, (L.floors || []).findIndex((f) => f.kind !== 'basement'));

/** the fields of a room (props.js): its floor over its storey, steps at its doors. u: { t, field, lenInput, snapshot(), changed(), render() } */
export function roomLevelFields(body, it, u) {
  const { t } = u;
  body.append(u.field(t('room.raise'), Object.assign(u.lenInput(() => cleanRaise(it.raise), (v) => {
    const r = cleanRaise(v);
    if (r) it.raise = r; else delete it.raise;
  }, { min: -LEVELS.maxRaise, step: 0.05 }), { id: 'roomRaise', max: String(LEVELS.maxRaise) })));
  if (cleanRaise(it.raise)) {
    const c = make('input'); c.type = 'checkbox'; c.id = 'roomSteps'; c.checked = it.steps !== false;
    c.addEventListener('change', () => { u.snapshot(); if (c.checked) delete it.steps; else it.steps = false; u.changed(); });
    const l = make('label', 'chk'); l.append(c, document.createTextNode(` ${t('room.steps')}`));
    body.append(l);
  }
  body.append(make('p', 'sub', t('room.raiseHint')));
}

/** the fields of the outdoor steps (props.js). u: as roomLevelFields */
export function stepsFields(body, it, u) {
  const { t } = u, s = stepsSize(it);
  body.append(u.field(t('steps.h'), Object.assign(u.lenInput(() => s.h, (v) => { it.h = stepsSize({ h: v }).h; }, { min: 0.1, step: 0.05 }), { id: 'stepsH' })));
  body.append(u.field(t('steps.w'), u.lenInput(() => s.w, (v) => { it.w = stepsSize({ w: v }).w; }, { min: 0.6, step: 0.1 })));
  body.append(u.field(t('steps.land'), u.lenInput(() => s.land, (v) => { it.land = stepsSize({ land: v }).land; }, { min: 0, step: 0.1 })));
  const rc = make('input'); rc.type = 'checkbox'; rc.checked = !it.noRail; rc.id = 'stepsRail';
  rc.addEventListener('change', () => { u.snapshot(); if (rc.checked) delete it.noRail; else it.noRail = true; u.changed(); });
  body.append(u.field(t('steps.rail'), rc));
  body.append(make('p', 'sub', `${t('steps.count', { n: s.n, rise: u.fmtLen(s.rise) })} · ${t('steps.help')}`));
}

/** ctx: t, layout(), snapshot(), changed(), select(sel), setStatus(txt), uid(), fmtLen(m), fields: { field, lenInput }, maxAreas, render()
 *  (the palette of the tool again), floorIdx() (the floor open) */
export function initPlateauUi(ctx) {
  const { t } = ctx;
  /** the outline of the plateau under building b (null: the whole house) on the ground floor, its outline moved out by 20 cm */
  function ringOf(b) {
    const L = ctx.layout(), gi = groundIdx(L), f = L.floors?.[gi];
    if (!f) return null;
    if (!b) return plateauRing(houseFootprint([f], 0));
    const rooms = (roomOwners(L)[gi] || []).filter((x) => x.b === b).map((x) => x.room);
    const walls = (f.walls || []).filter((w) => rooms.some((r) => inIso(r, (w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2)));
    return rooms.length ? plateauRing(houseFootprint([{ walls, rooms, blocks: [] }], 0)) : null;
  }
  /** "▲ Plateau unter [Gebäude] [Anlegen]" for the palette of the tool "Grundstück" */
  function palette() {
    const L = ctx.layout(), list = buildingsOf(L), row = make('div', 'plotAround plateauRow');
    const pick = make('select'); pick.id = 'plateauBuilding';
    if (list.length) list.forEach((b) => pick.add(new Option(b.name || t('bld.unnamed'), b.id)));
    else pick.add(new Option(t('plat.house'), ''));
    const go = make('button', '', `▲ ${t('plat.make')}`); go.type = 'button'; go.id = 'plateauMake';
    go.addEventListener('click', () => {
      const ring = ringOf(pick.value || null), areas = ctx.layout().plot?.areas || [];
      if (!ring) { ctx.setStatus(t('plat.noOutline')); return; }
      if (areas.length >= ctx.maxAreas) { ctx.setStatus(t('yard.tooMany', { n: ctx.maxAreas })); return; }
      ctx.snapshot();
      const lay = ctx.layout(), a = { id: ctx.uid(), name: t('plat.name'), surface: 'slabs', points: ring, rise: 0.6, edge: 'wall', wall: 'stone' };
      lay.plot = lay.plot || {};
      (lay.plot.areas ||= []).push(a);
      ctx.select({ kind: 'yard', id: a.id });
      ctx.changed();
      ctx.setStatus(t('plat.made', { name: pick.selectedOptions[0]?.textContent || '' }));
      ctx.render();
    });
    const lab = make('label', '', `${t('plat.under')} `); lab.append(pick);
    row.append(lab, go);
    return [make('p', 'plotHead', `▲ ${t('plat.title')}`), row, make('p', 'sub', t('plat.paletteHint'))];
  }
  /** the fields of a plateau in the side panel of an area (plotui.js) */
  function areaFields(body, a) {
    const { field, lenInput } = ctx.fields, rise = cleanRise(a.rise), box = make('div', 'plateauBox'); box.id = 'plateauBox';
    box.append(make('p', 'plotHead', `▲ ${t('plat.title')}`));
    box.append(field(t('plat.rise'), Object.assign(lenInput(() => rise, (v) => {
      const r = cleanRise(v);
      if (r) { a.rise = r; a.edge = EDGES.includes(a.edge) ? a.edge : 'wall'; a.wall = WALL_KEYS.includes(a.wall) ? a.wall : 'stone'; } else { delete a.rise; delete a.edge; delete a.wall; }
    }, { min: 0, step: 0.05 }), { id: 'plateauRise' })));
    if (rise) {
      const set = (k, v) => { ctx.snapshot(); a[k] = v; ctx.changed(); };
      box.append(field(t('plat.edge'), seg('plateauEdge', EDGES.map((k) => [k, t(`plat.edge.${k}`)]), a.edge || 'wall', (v) => set('edge', v))));
      if (a.edge !== 'slope') {
        const s = make('select'); s.id = 'plateauWall';
        WALL_KEYS.forEach((k) => s.add(new Option(`${WALL_LOOKS[k].icon} ${t(`plat.wall.${k}`)}`, k)));
        s.value = a.wall || 'stone';
        s.addEventListener('change', () => set('wall', s.value));
        box.append(field(t('plat.wall'), s));
      }
      const st = make('button', '', t('plat.steps')); st.type = 'button'; st.id = 'plateauSteps';
      st.addEventListener('click', () => addSteps(a));
      box.append(st);
    }
    box.append(make('p', 'sub', t('plat.riseHint')));
    body.append(box);
  }
  /** the outdoor steps at the front door on the plateau (ground floor), selected afterwards */
  function addSteps(a) {
    const L = ctx.layout(), f = L.floors?.[groundIdx(L)], at = f ? stepsAtDoor(f, a) : null;
    if (!at) { ctx.setStatus(t('plat.noDoor')); return; }
    ctx.snapshot();
    const d = { id: ctx.uid(), type: 'steps', name: t('dev.steps'), x: at.x, z: at.z, y: 0, rot: at.rot, scale: 1, h: at.h, w: 1.4, land: 1, entity: '' };
    f.devices.push(d);
    const s = stepsSize(d);
    if ((ctx.floorIdx?.() ?? groundIdx(L)) === groundIdx(L)) ctx.select({ kind: 'device', id: d.id });   // they stand on the ground floor
    ctx.changed();
    ctx.setStatus(t('plat.stepsDone', { n: s.n, rise: ctx.fmtLen(s.rise) }));
  }
  return { palette, areaFields, ringOf };
}
