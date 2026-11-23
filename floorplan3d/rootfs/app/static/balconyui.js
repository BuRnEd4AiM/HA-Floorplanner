/* 🏗 The balcony / roof terrace fields of a room (#646, before in props.js): the tick "Balkon / Dachterrasse" (an open room: no roof, a
 * railing on every edge without a wall), and when it is set: the railing (metal, glass, wood), the supports down to the ground, "Hausdach
 * reicht darüber" (#786: the roof of the house is not left out over it) and a line
 * that says whether the room hangs free (a balcony with a plate under it), partly (#703) or lies on the house or the ground. The rules:
 * balcony.js. Below them (5.14.0) the railing side by side: each side with a number (the same as in the 2D plan, rail2d.js) can be
 * switched off, made shorter („von … bis“) or get a gate (Geländertür); the rules: railsides.js. */
import { RAILS, cleanRail, railCover } from './balcony.js';
import { listedSides, sideOf, setSide, resetSides, GATE } from './railsides.js';

const OPEN_COLOR = '#a58a63', ROOM_COLOR = '#8a7f70';

/** ui: { t, field, lenInput(get, set, opts), fmtLen(m), floor() (the floor of the room), snapshot(), changed(), render(), free(id) (does the
 *  room hang free: 'all', 'part' or '', balcony3d.js freeness) } */
export function balconyFields(body, it, ui) {
  const { t } = ui;
  const tc = document.createElement('input'); tc.type = 'checkbox'; tc.checked = !!it.terrace; tc.id = 'roomTerrace';
  tc.addEventListener('change', () => {
    ui.snapshot();
    if (tc.checked) { it.terrace = true; if (!it.color || it.color === ROOM_COLOR) it.color = OPEN_COLOR; } else {
      delete it.terrace; delete it.rail; delete it.posts; delete it.roofOver;
      if (it.color === OPEN_COLOR) it.color = ROOM_COLOR;
    }
    ui.changed(); ui.render();
  });
  const tl = document.createElement('label'); tl.className = 'chk'; tl.title = t('prop.terraceHint'); tl.append(tc, document.createTextNode(' ' + t('prop.terrace')));
  body.append(tl);
  if (!it.terrace) return;
  const rail = document.createElement('select'); rail.id = 'roomRail';
  RAILS.forEach((r) => rail.add(new Option(t(`balc.${r}`), r)));
  rail.value = cleanRail(it.rail);
  rail.addEventListener('change', () => {
    ui.snapshot();
    if (rail.value === 'metal') delete it.rail; else it.rail = rail.value;   // metal is the default: not stored
    ui.changed();
  });
  body.append(ui.field(t('balc.rail'), rail));
  const free = ui.free?.(it.id) || '';                                 // 'all', 'part' (a terrace on the garage reaching out beyond it, #703) or ''
  const pc = document.createElement('input'); pc.type = 'checkbox'; pc.checked = !!it.posts; pc.id = 'roomPosts';
  pc.addEventListener('change', () => { ui.snapshot(); if (pc.checked) it.posts = true; else delete it.posts; ui.changed(); });
  const pl = document.createElement('label'); pl.className = 'chk'; pl.title = t('balc.postsHint'); pl.append(pc, document.createTextNode(' ' + t('balc.posts')));
  const rc = document.createElement('input'); rc.type = 'checkbox'; rc.checked = !!it.roofOver; rc.id = 'roomRoofOver';   // under the house's roof (#786)
  rc.addEventListener('change', () => { ui.snapshot(); if (rc.checked) it.roofOver = true; else delete it.roofOver; ui.changed(); });
  const rl = document.createElement('label'); rl.className = 'chk'; rl.title = t('balc.roofOverHint'); rl.append(rc, document.createTextNode(' ' + t('balc.roofOver')));
  const hint = document.createElement('p'); hint.className = 'sub'; hint.id = 'balconyHint'; hint.dataset.free = free === 'part' ? 'part' : free ? '1' : '0';
  hint.textContent = t(free === 'part' ? 'balc.part' : free ? 'balc.free' : 'balc.onTop');
  const rr = document.createElement('div'); rr.className = 'roofOverRow'; rr.append(rl);   // a line of its own (a label alone sits beside the one before)
  body.append(pl, rr, hint);
  sideFields(body, it, ui);
}

/** „Geländer je Seite“ (5.14.0): one block per side that has (or could have) a railing: on or off, from … to, a gate with its place and
 *  width */
function sideFields(body, it, ui) {
  const { t } = ui, f = ui.floor?.();
  const box = document.createElement('div'); box.className = 'railSides'; box.id = 'railSides';
  const h = document.createElement('h5'); h.textContent = t('rails.title');
  const hint = document.createElement('p'); hint.className = 'sub'; hint.textContent = t('rails.hint');
  box.append(h, hint);
  const sides = listedSides(it, railCover(it, f));
  if (!sides.length) { const p = document.createElement('p'); p.className = 'sub'; p.id = 'railSidesNone'; p.textContent = t('rails.none'); box.append(p); }
  const edit = (fn, again = false) => { ui.snapshot(); fn(); ui.changed(); if (again) ui.render(); };
  const len = (get, set, id, min = 0) => Object.assign(ui.lenInput(get, set, { min }), { id });
  sides.forEach(({ k, n, len: L }) => {
    const s = sideOf(it, k), row = document.createElement('div');
    row.className = `railSide${s.off ? ' off' : ''}`; row.dataset.side = String(k); row.dataset.n = String(n);
    const on = document.createElement('input'); on.type = 'checkbox'; on.checked = !s.off; on.id = `railSideOn${k}`;
    on.addEventListener('change', () => edit(() => setSide(it, k, { off: !on.checked }), true));
    const lab = document.createElement('label'); lab.className = 'chk railSideHead';
    const num = document.createElement('span'); num.className = 'railNum'; num.textContent = String(n);
    lab.append(on, ' ', num, document.createTextNode(` ${t('rails.side', { n, len: ui.fmtLen(L) })}`));
    row.append(lab);
    if (!s.off) {
      const range = document.createElement('div'); range.className = 'splitRow railRange';
      const dash = document.createElement('span'); dash.textContent = '–';
      range.append(len(() => sideOf(it, k).from, (v) => setSide(it, k, { from: v }), `railFrom${k}`),
        dash, len(() => sideOf(it, k).to, (v) => setSide(it, k, { to: v }), `railTo${k}`));
      row.append(ui.field(t('rails.range'), range));
      const gc = document.createElement('input'); gc.type = 'checkbox'; gc.checked = !!s.gate; gc.id = `railGate${k}`;
      gc.addEventListener('change', () => edit(() => setSide(it, k, { gate: gc.checked ? { at: L / 2, w: Math.min(GATE.w, L) } : null }), true));
      const gl = document.createElement('label'); gl.className = 'chk'; gl.title = t('rails.gateHint'); gl.append(gc, ` ${t('rails.gate')}`);
      row.append(gl);
      if (s.gate) {
        row.append(ui.field(t('rails.gateAt'), len(() => sideOf(it, k).gate?.at ?? L / 2, (v) => setSide(it, k, { gate: { at: v, w: sideOf(it, k).gate?.w ?? GATE.w } }), `railGateAt${k}`)),
          ui.field(t('rails.gateW'), len(() => sideOf(it, k).gate?.w ?? GATE.w, (v) => setSide(it, k, { gate: { at: sideOf(it, k).gate?.at ?? L / 2, w: v } }), `railGateW${k}`, GATE.min)));
      }
    }
    box.append(row);
  });
  if (it.railSides) {
    const rs = document.createElement('button'); rs.type = 'button'; rs.className = 'railReset'; rs.id = 'railSidesReset'; rs.textContent = t('rails.reset');
    rs.addEventListener('click', () => edit(() => resetSides(it), true));
    box.append(rs);
  }
  body.append(box);
}
