/* The new roof editor (5.1.0, the owner's choice of 2026-11-09: all six roof pictures in docs/ideen-5.1/, „der Editor sieht echt mega
 * aus“). A click on the roof opens it (the properties of the selected roof), and the roof floor in the tree of the new panel shows it:
 * a head that says what the roof has, and four tabs instead of one long list: „Form“ (the shape as pictures, the roof seen from the side
 * with points to drag, ⤢ big; size, ridge, attic and steps folded away), „Auf dem Dach“ (the roof seen from above: dormers and roof
 * windows dragged where they go; one card open at a time, the kind of a dormer as pictures), „Mehr Dächer“ (further roofs) and
 * „Vorlagen“ (ready-made roofs, also an L and a „+“ roof; own roofs kept in the settings). The fields are the very ones of the classic
 * panel (floorpanel.js roofInto, tagged by group): nothing is stored twice. The rules are in roofedit.js and rooftemplates.js (tested). */
import { profileOf, pitchAt, kneeAt, overAt, pitchForRise, roofMap, solarOn, alongAcross, dragDormer, dragSkylight, roofSummary } from './roofedit.js';
import { TEMPLATES, applyTemplate, ownRoof, applyOwn, cleanOwn, MAX_OWN } from './rooftemplates.js';
import { clampPitch, setDormerType } from './floorpanel.js';
import { DORMER_TYPES } from './dormer.js';

const COL = { wall: '#ece5d8', side: '#cbc1b0', roof: '#c2583e', roofD: '#8f3b28', flat: '#7d8996', flatD: '#5b6672', edge: 'rgba(0,0,0,.3)' };
const P = (pts, fill, extra = '') => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${COL.edge}" stroke-width="1" stroke-linejoin="round" ${extra}/>`;
/** a little house from the front and the side with a roof: gable, hip, shed, flat, dormers, lshape, cross, canopy */
export function roofIcon(kind, w = 104) {
  const A = [16, 36], B = [66, 36], C = [88, 24], A0 = [16, 60], B0 = [66, 60], C0 = [88, 48];
  const win = (top = 0) => `<rect x="23" y="${44 - top / 2}" width="9" height="8" fill="#8fc8ef" stroke="#6d7c88" stroke-width=".8"/><rect x="50" y="${44 - top / 2}" width="9" height="8" fill="#8fc8ef" stroke="#6d7c88" stroke-width=".8"/>
    <rect x="36" y="${47 - top / 4}" width="8" height="${13 + top / 4}" fill="#8a6a4f" stroke="#5d4634" stroke-width=".8"/>`;
  const box = (top = 0) => P([A0, B0, [B[0], B[1] - top], [A[0], A[1] - top]], COL.wall) + P([B0, C0, [C[0], C[1] - top], [B[0], B[1] - top]], COL.side) + win(top);
  let s = '';
  if (kind === 'flat') {
    s += box(-4) + P([[A[0] - 1, A[1] + 4], [B[0] + 1, B[1] + 4], [C[0] + 1, C[1] + 4], [C[0] - 49, C[1] + 4]], COL.flat)
      + P([[A[0] - 1, A[1] + 4], [B[0] + 1, B[1] + 4], [B[0] + 1, B[1] + 1], [A[0] - 1, A[1] + 1]], COL.flatD) + P([[B[0] + 1, B[1] + 4], [C[0] + 1, C[1] + 4], [C[0] + 1, C[1] + 1], [B[0] + 1, B[1] + 1]], COL.flatD);
  } else if (kind === 'shed') {
    const Ch = [C[0], 6];
    s += P([A0, B0, B, A], COL.wall) + P([B0, C0, Ch, B], COL.side) + win() + P([[A[0] - 3, A[1] + 1], [B[0] + 3, B[1] + 1], [Ch[0] + 3, Ch[1] - 1], [Ch[0] - 47, Ch[1] - 1]], COL.roof);
  } else if (kind === 'hip') {
    const R1 = [40, 12], R2 = [64, 12];
    s += box() + P([[B[0] + 2, B[1] + 1], [C[0] + 3, C[1] + 1], R2], COL.roofD) + P([[A[0] - 4, A[1] + 1], [B[0] + 2, B[1] + 1], R2, R1], COL.roof);
  } else {
    const R1 = [26, 11], R2 = [78, 11];
    s += box() + P([B, C, R2], COL.side) + `<polyline points="${B[0] + 2},${B[1] + 2} ${R2[0]},${R2[1] - 1} ${C[0] + 3},${C[1] + 2}" fill="none" stroke="${COL.roofD}" stroke-width="3.5" stroke-linejoin="round"/>`
      + P([[A[0] - 4, A[1] + 1], [B[0] + 2, B[1] + 1], R2, R1], COL.roof);
    if (kind === 'dormers') [[24, 24], [48, 24]].forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="11" height="9" fill="${COL.wall}" stroke="${COL.edge}"/><rect x="${x + 2.5}" y="${y + 2.5}" width="6" height="5" fill="#8fc8ef"/>` + P([[x - 2, y + 1], [x + 5.5, y - 6], [x + 13, y + 1]], COL.roofD); });
    if (kind === 'lshape') s += P([[52, 37], [66, 37], [66, 21], [59, 13]], COL.wall) + P([[49, 38], [59, 12], [69, 38]], COL.roofD) + P([[49, 38], [59, 12], [62, 12], [52, 38]], COL.roof);
    if (kind === 'cross') s += P([[33, 37], [49, 37], [49, 21], [41, 12]], COL.wall) + P([[30, 38], [41, 10], [52, 38]], COL.roofD) + P([[30, 38], [41, 10], [44, 10], [33, 38]], COL.roof);
    if (kind === 'canopy') s += P([[16, 46], [66, 46], [60, 54], [10, 54]], '#6e7a86') + `<line x1="12" y1="54" x2="12" y2="62" stroke="#6e7a86" stroke-width="2"/><line x1="60" y1="54" x2="60" y2="62" stroke="#6e7a86" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 104 66" width="${w}" style="display:block;height:auto" aria-hidden="true">${s}</svg>`;
}
/** a dormer on a piece of roof, from the front: gable, flat, shed */
export function dormerIcon(kind, w = 90) {
  let s = `<rect x="0" y="8" width="104" height="58" fill="${COL.roof}"/>${[18, 28, 38, 48, 58].map((y) => `<path d="M0 ${y} H104" stroke="${COL.roofD}" stroke-width="1"/>`).join('')}`;
  const win = (x, y, w2, h2) => `<rect x="${x}" y="${y}" width="${w2}" height="${h2}" fill="#8fc8ef" stroke="#55626e" stroke-width="1.2"/><line x1="${x + w2 / 2}" y1="${y}" x2="${x + w2 / 2}" y2="${y + h2}" stroke="#55626e"/>`;
  if (kind === 'gable') s += `<rect x="32" y="30" width="40" height="28" fill="${COL.wall}" stroke="${COL.edge}"/>${win(40, 35, 24, 17)}` + P([[27, 31], [52, 10], [77, 31]], COL.roofD);
  if (kind === 'flat') s += `<rect x="26" y="28" width="52" height="30" fill="${COL.wall}" stroke="${COL.edge}"/>${win(34, 33, 36, 18)}<rect x="22" y="22" width="60" height="7" fill="${COL.flatD}" stroke="${COL.edge}"/>`;
  if (kind === 'shed') s += `<rect x="10" y="32" width="84" height="26" fill="${COL.wall}" stroke="${COL.edge}"/>${win(18, 37, 28, 15)}${win(58, 37, 28, 15)}` + P([[6, 33], [98, 33], [92, 20], [12, 20]], COL.roofD);
  return `<svg viewBox="0 0 104 66" width="${w}" style="display:block;height:auto" aria-hidden="true">${s}</svg>`;
}

/** ctx: t, layout(), floorIdx(), roofBox(i), roofInto(box, f, r) (floorpanel.js), fields ({ inp, lenInput }), snapshot(), changed() (build,
 *  save), preview() (build only, while dragging), settings(), saveSettings(), uid(), fmtLen(m), select(sel), houseName(), setStatus(txt) */
export function initRoofEdit(ctx) {
  const { t } = ctx;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const btn = (cls, txt, on) => { const b = el('button', cls, txt); b.type = 'button'; if (on) b.addEventListener('click', on); return b; };
  let cur = null;                                       // { host, opts }: where the editor is drawn
  let lastPart = null;                                  // the further roof clicked last (its tab opens once)
  let tab = 'form', open = null;                        // the tab, the part opened on „Auf dem Dach“ ({ kind: 'dormer' | 'sky' | 'solar', i })
  const folded = { size: true, ridge: true, attic: true, steps: true };
  let lastPreview = 0, previewTimer = null;
  /** while dragging: the 3D roof follows, at most five times a second */
  function preview() {
    const now = performance.now();
    if (now - lastPreview > 200) { lastPreview = now; ctx.preview(); return; }
    clearTimeout(previewTimer); previewTimer = setTimeout(() => { lastPreview = performance.now(); ctx.preview(); }, 200);
  }
  const rerender = () => { if (cur?.host?.isConnected) render(cur.host, cur.opts); };
  /** a change of ours: undo step, the change, the house built again and saved, the editor drawn again */
  const edit = (fn) => { ctx.snapshot(); fn(); ctx.changed(); rerender(); };

  function render(host, opts = {}) {
    cur = { host, opts };
    const lay = ctx.layout(), fi = opts.fi ?? ctx.floorIdx(), f = lay?.floors?.[fi];
    host.textContent = '';
    if (!f || f.kind !== 'roof') return;
    const r = (f.roof ||= { type: 'gable', pitch: 35, overhang: 0.4 });
    if (opts.part && opts.part !== lastPart) { tab = 'parts'; open = { kind: 'part', id: opts.part }; }   // a further roof was clicked
    lastPart = opts.part || null;
    const bb = ctx.roofBox(fi), sum = roofSummary(bb, r, f.devices);
    const root = el('div', 'roofEd'); root.id = 'roofEd';
    // the classic fields, tagged by group (floorpanel.js), taken from here into the tabs
    const fieldsBox = el('div');
    ctx.roofInto(fieldsBox, f, r);
    fieldsBox.querySelectorAll('[id]').forEach((e) => { e.dataset.cid = e.id; e.id = `re-${e.id}`; });   // the classic panel has the same fields: no id twice
    const grp = (g) => [...fieldsBox.children].filter((c) => c.dataset.rg === g);
    if (opts.head !== false) root.append(...head(lay, f, r, bb, sum));
    const tabs = el('div', 'mk2Tabs v2Tabs'); tabs.id = 'roofTabs';
    const can = { top: r.type !== 'flat', parts: true };
    [['form', t('rf.tab.form')], ['top', t('rf.tab.top'), sum.dormers + sum.skylights], ['parts', t('rf.tab.parts'), sum.parts], ['tpl', t('rf.tab.tpl')]].forEach(([k, label, n]) => {
      if (k === 'top' && !can.top) return;
      const b = btn(k === tab ? 'on' : '', label, () => { tab = k; rerender(); });
      if (n) b.append(el('em', '', String(n)));
      b.dataset.tab = k; tabs.append(b);
    });
    if (tab === 'top' && !can.top) tab = 'form';
    root.append(tabs);
    const body = el('div', 'roofTab'); body.dataset.tab = tab;
    if (tab === 'form') formTab(body, f, r, bb, grp, fi);
    else if (tab === 'top') topTab(body, f, r, bb, grp);
    else if (tab === 'parts') partsTab(body, grp);
    else tplTab(body, f, r, bb);
    root.append(body);
    host.append(root);
    // a classic field changed or one of its buttons was used (add, remove, „auf die Wand“ …): draw the editor again
    root.addEventListener('change', (e) => { if (e.target.closest('.rgBox')) setTimeout(rerender, 0); });
    root.addEventListener('click', (e) => { if (e.target.closest('.rgBox button')) setTimeout(rerender, 0); });
  }

  /** the path and the head: the roof, its shape, its size and what it has */
  function head(lay, f, r, bb, sum) {
    const path = el('nav', 'v2Crumbs');
    [`🏠 ${ctx.houseName() || ''}`, f.name || '', `🔺 ${t('rf.roof')}`].forEach((c, i) => { if (i) path.append(el('i', '', '›')); const b = btn(i === 2 ? 'last' : 'c', c); b.disabled = true; path.append(b); });
    const h = el('div', 'v2Head roofHead'); h.id = 'roofHead';
    const ic = el('div', 'ic'); ic.innerHTML = roofIcon(r.type === 'hip' || r.type === 'flat' || r.type === 'shed' ? r.type : 'gable', 38);
    const sub = el('small', '', `${t(`roof.${sum.type}`)}${sum.type !== 'flat' ? ` · ${Math.round(sum.pitch)}°` : ''}${bb ? ` · ${ctx.fmtLen(sum.w)} × ${ctx.fmtLen(sum.d)}` : ''}`);
    h.append(ic, el('b', '', t('rf.roof')), sub);
    const chips = el('div', 'chips');
    const chip = (txt, cls = '') => chips.append(el('span', `v2Chip ${cls}`, txt));
    if (sum.dormers) chip(`🏠 ${t('rf.chip.dormers', { n: sum.dormers })}`);
    if (sum.skylights) chip(`🪟 ${t('rf.chip.skylights', { n: sum.skylights })}`);
    if (sum.solar) chip(`☀ ${t('rf.chip.solar', { n: sum.solar })}`);
    if (sum.parts) chip(`➕ ${t('rf.chip.parts', { n: sum.parts })}`);
    if (sum.attic) chip(`🛏 ${t('rf.chip.attic')}`, 'ok');
    if (chips.childElementCount) h.append(chips);
    const where = el('p', 'sub roofWhere'); where.id = 'roofWhere';
    if (bb) where.textContent = t('roof.where', { x: ctx.fmtLen(bb.x0), z: ctx.fmtLen(bb.z0), w: ctx.fmtLen(bb.x1 - bb.x0), d: ctx.fmtLen(bb.z1 - bb.z0) });
    return [path, h, where];
  }

  /** a section that folds in and out: its head says what is set; help texts become an ⓘ */
  function section(key, icon, title, line, els) {
    const sec = el('section', `v2Sec${folded[key] ? '' : ' open'}`); sec.dataset.sec = key;
    const hd = btn('hd', null, () => { folded[key] = !folded[key]; sec.classList.toggle('open', !folded[key]); bd.hidden = folded[key]; hd.lastChild.textContent = folded[key] ? '▾' : '▴'; });
    hd.append(el('span', 'i', icon), el('b', '', title), el('span', 'sum', line || ''), el('span', 'chev', folded[key] ? '▾' : '▴'));
    const bd = el('div', 'bd rgBox'); bd.hidden = !!folded[key];
    bd.append(...withHelp(els));
    sec.append(hd, bd);
    return sec;
  }
  /** long help texts (p.sub) go behind a small „ⓘ“ */
  function withHelp(els) {
    const help = els.filter((e) => e.matches?.('p.sub') && !e.matches('.warn'));
    if (!help.length) return els;
    const box = el('div', 'rfHelp'); box.hidden = true; box.append(...help);
    const i = btn('rfInfo', `ⓘ ${t('rf.help')}`, () => { box.hidden = !box.hidden; });
    return [...els.filter((e) => !help.includes(e)), i, box];
  }

  /* ---------------- Form: the shape, the roof from the side, the rest folded ---------------- */
  function formTab(body, f, r, bb, grp, fi) {
    const tiles = el('div', 'rfTiles'); tiles.id = 'roofShapes';
    ['gable', 'hip', 'shed', 'flat'].forEach((k) => {
      const b = btn(`rfTile${(r.type || 'gable') === k ? ' on' : ''}`, null, () => {
        if ((r.type || 'gable') === k) return;
        const sel = grp('shape').map((e) => e.querySelector('[data-cid=roofType]')).find(Boolean);
        if (sel) { sel.value = k; sel.dispatchEvent(new Event('change')); setTimeout(rerender, 0); }
      });
      b.dataset.type = k; b.innerHTML = roofIcon(k, 70); b.append(el('span', 'nm', t(`roof.${k}`)));
      tiles.append(b);
    });
    body.append(tiles);
    const shape = grp('shape').filter((e) => !e.querySelector('[data-cid=roofType]'));   // the high side of a shed roof
    if (shape.length) { const sb = el('div', 'rgBox'); sb.append(...shape); body.append(sb); }
    body.append(profileCard(f, r, bb, fi, false));
    const sizeLine = `${r.box ? t('rf.size.own') : t('rf.size.auto')} · ${ctx.fmtLen(r.overhang ?? 0.4)}`;
    body.append(section('size', '📏', t('rf.sec.size'), sizeLine, grp('size')));
    if (r.type !== 'shed' && r.type !== 'flat') body.append(section('ridge', '🧭', t('roof.ridge'), t(r.ridge === 'x' ? 'roof.ridge0' : r.ridge === 'z' ? 'roof.ridge90' : 'roof.auto'), grp('ridge')));
    body.append(section('attic', '🛏', t('rf.sec.attic'), r.knee != null ? t('rf.attic.yes', { k: ctx.fmtLen(r.knee) }) : t('rf.attic.no'), grp('attic')));
    if (r.type !== 'flat') body.append(section('steps', '↔', t('rf.sec.steps'), (r.steps || []).length ? String(r.steps.length) : t('rf.none'), grp('steps')));
  }

  /** the roof from the side, small in the panel or big over the picture (⤢); its points are dragged, its numbers typed */
  function profileCard(f, r, bb, fi, big) {
    const card = el('div', `rfCard rfProfile${big ? ' big' : ''}`); card.id = big ? 'roofProfileBig' : 'roofProfile';
    const p = profileOf(bb, r);
    if (!p) { card.append(el('p', 'sub', t('rf.noBox'))); return card; }
    const pic = el('div', 'rfPic');
    const live = () => document.getElementById(card.id)?.querySelector('.rfPic') || pic;   // the panel may be drawn anew while dragging
    const draw = (frame) => { live().innerHTML = profileSvg(profileOf(bb, r), big, frame); };   // frame: kept while dragging (the picture would grow)
    draw();
    card.append(pic);
    // dragging a point: pitch (on the slope), ridge (at the top), knee wall (right), overhang (left eave)
    pic.addEventListener('pointerdown', (e) => {
      const hd = e.target.closest('[data-h]');
      if (!hd) return;
      e.preventDefault();
      const which = hd.dataset.h, geo = JSON.parse(live().querySelector('svg').dataset.geo);
      ctx.snapshot();
      let moved = false;
      const at = (ev) => {                                             // the picture is drawn anew while dragging: measure the one shown now
        const b = live().querySelector('svg').getBoundingClientRect(), k = geo.W / b.width;
        return [((ev.clientX - b.left) * k - geo.ox) / geo.s, (geo.oy - (ev.clientY - b.top) * k) / geo.s];
      };
      const move = (ev) => {
        const [x, y] = at(ev), kn = r.knee != null ? r.knee : 0;
        if (which === 'pitch') r.pitch = pitchAt(x, y - kn);
        else if (which === 'ridge') r.pitch = pitchForRise(bb, r, y - kn);
        else if (which === 'knee') r.knee = kneeAt(y);
        else if (which === 'over') r.overhang = overAt(-x);
        moved = true; draw(geo); preview();
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (moved) { ctx.changed(); rerender(); } };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    const vals = el('div', 'rfVals');
    const { inp, lenInput } = ctx.fields;
    const val = (label, input, key) => { const d = el('label', 'rfVal'); d.dataset.v = key; d.append(el('small', '', label), input); vals.append(d); };
    function values() {
      vals.textContent = '';
      if (r.type !== 'flat') {
        const pi = inp('number', Math.round(r.pitch ?? 35), (v) => { r.pitch = clampPitch(v); queueMicrotask(rerender); }, { step: 1, min: 5, max: 70 });
        pi.id = big ? 'roofPitchBig' : 'roofPitchEd';
        val(t('roof.pitch'), pi, 'pitch');
        const rh = lenInput(() => profileOf(bb, r).rise, (v) => { r.pitch = pitchForRise(bb, r, v); queueMicrotask(rerender); }, { min: 0.3, step: 0.1 });
        val(t(r.type === 'shed' ? 'rf.v.high' : 'rf.v.ridge'), rh, 'ridge');
      }
      if (r.knee != null) val(t('rf.v.knee'), lenInput(() => r.knee, (v) => { r.knee = kneeAt(v); queueMicrotask(rerender); }, { min: 0, step: 0.05 }), 'knee');
      val(t('rf.v.over'), lenInput(() => r.overhang ?? 0.4, (v) => { r.overhang = overAt(v); queueMicrotask(rerender); }, { min: 0, step: 0.05 }), 'over');
    }
    values();
    card.append(vals);
    const foot = el('div', 'rfFoot');
    foot.append(el('span', 'v2Hint', `✋ ${t('rf.drag')}`));
    if (!big) { const bigBtn = btn('v2Btn', `⤢ ${t('rf.big')}`, () => openBig(f, r, bb, fi)); bigBtn.id = 'roofProfileBigBtn'; foot.append(bigBtn); }
    if (r.knee == null && r.type !== 'flat') foot.append(btn('v2Btn', `🛏 ${t('rf.atticOn')}`, () => edit(() => { r.knee = 1; })));
    card.append(foot);
    return card;
  }
  let bigBox = null;
  function openBig(f, r, bb, fi) {
    bigBox?.remove();
    bigBox = el('div', 'rfBig'); bigBox.id = 'roofBig';
    const top = el('div', 'rfBigHead');
    top.append(el('b', '', `📐 ${t('rf.side')}`), el('small', '', t('rf.sideSub')), btn('v2Btn', '✕', () => { bigBox.remove(); bigBox = null; }));
    bigBox.append(top, profileCard(f, r, bb, fi, true));
    document.body.append(bigBox);
    const st = document.getElementById('stage')?.getBoundingClientRect();
    if (st) Object.assign(bigBox.style, { left: `${st.left + 20}px`, top: `${st.top + 70}px`, maxWidth: `${Math.max(320, st.width - 40)}px` });
  }

  /** the side view as SVG: data-geo carries the scale and the origin (the top of the floor at the left wall) for dragging */
  function profileSvg(p, big, frame = null) {
    const s = big ? 54 : 27, wt = 0.3, kn = p.knee ?? 0, tan = Math.tan((p.pitch * Math.PI) / 180);
    const shed = p.type === 'shed', flat = p.type === 'flat', o = p.over;
    const rt = 0.22, k = rt / Math.cos(Math.atan(tan));
    const top = flat ? kn + 0.4 : kn + p.rise + k, low = 0.45;
    const padL = big ? 130 : 46, padR = big ? 140 : 52, padT = big ? 34 : 18, padB = big ? 40 : 22;
    let W = Math.round((p.depth + 2 * o) * s + padL + padR), H = Math.round((top + low + 0.3) * s + padT + padB);
    let ox = padL + o * s, oy = padT + (top + 0.15) * s;             // x 0 = the outer face of the left wall, y 0 = the floor under the roof
    if (frame) ({ W, H, ox, oy } = frame);                              // while dragging: the same frame (the roof may stick out over the top)
    const X = (m) => +(ox + m * s).toFixed(1), Y = (m) => +(oy - m * s).toFixed(1), pt = (x, y) => `${X(x)},${Y(y)}`;
    const HI = '#ffd45c', acc = 'var(--accent)', fs = big ? 13 : 10.5;
    const handle = (x, y, h, glyph) => `<g data-h="${h}" class="rfH" transform="translate(${x} ${y})"><circle r="${big ? 12 : 8}" fill="#fff" stroke="${acc}" stroke-width="${big ? 3.5 : 2.5}"/>${big ? `<text y="4.5" text-anchor="middle" font-size="12" font-weight="900" fill="#1d3550">${glyph}</text>` : ''}<circle r="${big ? 22 : 15}" fill="transparent"/></g>`;
    const pill = (x, y, txt) => { const w2 = txt.length * (big ? 7.3 : 5.9) + 14; return `<g transform="translate(${x} ${y})"><rect x="${-w2 / 2}" y="${big ? -12 : -9}" width="${w2}" height="${big ? 24 : 18}" rx="${big ? 12 : 9}" fill="#1d2733" stroke="rgba(255,255,255,.25)"/><text y="${big ? 4.5 : 3.5}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#e8eef5">${txt}</text></g>`; };
    const D = p.depth;
    let g = `<rect x="${X(0)}" y="${Y(0)}" width="${D * s}" height="${low * s}" fill="rgba(255,255,255,.06)"/><rect x="${X(0)}" y="${Y(0)}" width="${D * s}" height="${0.2 * s}" fill="#8995a2"/>`;
    g += `<rect x="${X(0)}" y="${Y(kn)}" width="${wt * s}" height="${kn * s}" fill="${COL.wall}" stroke="${COL.edge}"/><rect x="${X(D - wt)}" y="${Y(kn)}" width="${wt * s}" height="${kn * s}" fill="${COL.wall}" stroke="${COL.edge}"/>`;
    if (flat) {
      g += `<rect x="${X(-o)}" y="${Y(kn + 0.3)}" width="${(D + 2 * o) * s}" height="${0.3 * s}" fill="${COL.flat}" stroke="${COL.flatD}"/>`;
      g += handle(X(-o), Y(kn + 0.15), 'over', '↔') + pill(X(-o) - (big ? 60 : 30), Y(kn + 0.15) + (big ? 26 : 18), ctx.fmtLen(o));
      if (p.knee != null) g += handle(X(D) + (big ? 20 : 12), Y(kn), 'knee', '↕');
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" data-geo='${JSON.stringify({ W, H, s, ox, oy })}' style="max-width:100%;height:auto;display:block;margin:0 auto;touch-action:none">${g}</svg>`;
    }
    const eaveY = kn - o * tan, ridgeX = shed ? D : D / 2, ridgeY = kn + p.rise;
    if (p.stand > 0) {                                                // where one can stand upright (over 2 m): green
      const d0 = Math.max(0, (2 - kn) / (tan || 1));
      const pts = shed ? [[d0, 0], [d0, 2], [D, ridgeY], [D, 0]] : [[d0, 0], [d0, 2], [ridgeX, ridgeY], [D - d0, 2], [D - d0, 0]];
      g += `<polygon points="${pts.map(([x, y]) => pt(x, Math.min(y, ridgeY))).join(' ')}" fill="rgba(70,167,88,.2)" stroke="#6fcf86" stroke-dasharray="5 4" stroke-width="1.4"/>`;
      if (big) g += `<text x="${X(shed ? (d0 + D) / 2 : D / 2)}" y="${Y(0.45)}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#9be3a8">${t('rf.stand', { w: ctx.fmtLen(p.stand) })}</text>`;
      const px = X(shed ? d0 + 0.6 : Math.max(d0 + 0.5, D / 2 - 1.1)), ph = 1.8 * s;    // somebody standing, 1.80 m
      g += `<g fill="#d7e0ea" opacity=".8"><circle cx="${px}" cy="${Y(0) - ph * 0.93}" r="${ph * 0.07}"/><rect x="${px - ph * 0.09}" y="${Y(0) - ph * 0.84}" width="${ph * 0.18}" height="${ph * 0.42}" rx="${ph * 0.05}"/><rect x="${px - ph * 0.085}" y="${Y(0) - ph * 0.45}" width="${ph * 0.075}" height="${ph * 0.45}"/><rect x="${px + ph * 0.01}" y="${Y(0) - ph * 0.45}" width="${ph * 0.075}" height="${ph * 0.45}"/></g>`;
    }
    g += `<polygon points="${pt(-o, eaveY)} ${pt(ridgeX, ridgeY)} ${pt(ridgeX, ridgeY + k)} ${pt(-o, eaveY + k)}" fill="${COL.roof}" stroke="${COL.roofD}"/>`;
    if (!shed) g += `<polygon points="${pt(D + o, eaveY)} ${pt(ridgeX, ridgeY)} ${pt(ridgeX, ridgeY + k)} ${pt(D + o, eaveY + k)}" fill="${COL.roofD}" stroke="${COL.roofD}"/>`;
    else g += `<rect x="${X(D - wt)}" y="${Y(ridgeY)}" width="${wt * s}" height="${(ridgeY - kn) * s}" fill="${COL.side}" stroke="${COL.edge}"/>`;
    // the pitch: an arc at the top of the left wall
    const ra = (big ? 1.3 : 1.05) * s, a = Math.atan(tan), ax = X(0), ay = Y(kn);
    g += `<path d="M ${ax + ra} ${ay} A ${ra} ${ra} 0 0 0 ${(ax + ra * Math.cos(a)).toFixed(1)} ${(ay - ra * Math.sin(a)).toFixed(1)}" fill="none" stroke="${HI}" stroke-width="${big ? 3 : 2}"/>`;
    g += `<line x1="${ax}" y1="${ay}" x2="${ax + ra * 1.2}" y2="${ay}" stroke="${HI}" stroke-dasharray="4 3"/>`;
    g += pill(ax + ra * 1.55, ay - ra * 0.3, `${Math.round(p.pitch)}°`) + handle((ax + ra * Math.cos(a)).toFixed(1), (ay - ra * Math.sin(a)).toFixed(1), 'pitch', '⤾');
    // the ridge (a shed roof: its high side)
    g += `<line x1="${X(ridgeX)}" y1="${Y(kn)}" x2="${X(ridgeX)}" y2="${Y(ridgeY)}" stroke="${acc}" stroke-width="2" stroke-dasharray="5 4"/>`;
    g += pill(X(ridgeX) + (shed ? -(big ? 70 : 40) : (big ? 64 : 40)), Y(kn + p.rise * 0.55), big ? `${t(shed ? 'rf.v.high' : 'rf.v.ridge')} ${ctx.fmtLen(p.rise)}` : ctx.fmtLen(p.rise));
    g += handle(X(ridgeX), Y(ridgeY + k) - (big ? 16 : 10), 'ridge', '↕');
    if (p.knee != null) {                                              // the knee wall
      const kx = X(D) + (big ? 26 : 16);
      g += `<line x1="${kx}" y1="${Y(0)}" x2="${kx}" y2="${Y(kn)}" stroke="${acc}" stroke-width="2"/>`;
      g += pill(kx + (big ? 70 : 30), Y(kn / 2), big ? `${t('rf.v.knee')} ${ctx.fmtLen(kn)}` : ctx.fmtLen(kn)) + handle(kx, Y(kn), 'knee', '↕');
    }
    const oyy = Y(eaveY) + (big ? 30 : 18);                            // the overhang
    g += `<line x1="${X(-o)}" y1="${oyy}" x2="${X(0)}" y2="${oyy}" stroke="${acc}" stroke-width="2"/>`;
    g += pill(X(-o) - (big ? 84 : 30), oyy, big ? `${t('rf.v.over')} ${ctx.fmtLen(o)}` : ctx.fmtLen(o)) + handle(X(-o), oyy, 'over', '↔');
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" data-geo='${JSON.stringify({ W, H, s, ox, oy })}' style="max-width:100%;height:auto;display:block;margin:0 auto;overflow:visible;touch-action:none">${g}</svg>`;
  }

  /* ---------------- Auf dem Dach: the map from above, the parts ---------------- */
  function topTab(body, f, r, bb, grp) {
    const m = bb ? roofMap(bb, r) : null;
    if (!m) { body.append(el('p', 'sub', t('rf.noBox'))); return; }
    const sol = solarOn(f.devices, m.outline);
    const pic = el('div', 'rfMap'); pic.id = 'roofMap';
    const draw = () => { (document.getElementById('roofMap') || pic).innerHTML = mapSvg(roofMap(bb, r), sol); };   // the one shown now
    draw();
    body.append(pic);
    pic.addEventListener('pointerdown', (e) => {
      const hit = e.target.closest('[data-part]');
      if (!hit) return;
      e.preventDefault();
      const [kind, i] = [hit.dataset.part, +hit.dataset.i];
      if (kind === 'solar') { open = { kind, i }; rerender(); return; }
      const was = open?.kind === kind && open.i === i;
      open = { kind, i };
      const svg = pic.querySelector('svg'), geo = JSON.parse(svg.dataset.geo);
      const m0 = roofMap(bb, r), start = kind === 'dormer' ? m0.dormers[i] : m0.skylights[i];
      if (!start || start.fit === false) { rerender(); return; }
      const b0 = svg.getBoundingClientRect(), k = geo.W / b0.width, x0 = e.clientX, y0 = e.clientY;
      let moved = false;
      if (!was) draw();
      const move = (ev) => {
        const dx = ((ev.clientX - x0) * k) / geo.s, dz = ((ev.clientY - y0) * k) / geo.s;
        if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
        if (!moved) ctx.snapshot();
        moved = true;
        const { da, db } = alongAcross(m0.alongX, dx, dz);
        if (kind === 'dormer') dragDormer(bb, r, r.dormers[i], start, da, db); else dragSkylight(bb, r, r.skylights[i], start, da, db);
        draw(); preview();
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (moved) ctx.changed(); rerender(); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
    // add: a dormer, a roof window (the buttons of the classic panel)
    const add = el('div', 'rfAdd');
    const dorm = grp('dormers'), sky = grp('skylights');
    const addBtn = (list, cid, icon, label, kind, key) => {
      const real = list.find((x) => x.dataset?.cid === cid);
      if (!real) return;
      const b = btn('', null, () => { real.click(); open = { kind, i: Math.max(0, (r[key] || []).length - 1) }; setTimeout(rerender, 0); });   // the new one opens
      b.append(el('i', '', icon), el('span', '', label)); b.dataset.add = cid; add.append(b);
    };
    if (r.type !== 'shed') addBtn(dorm, 'addDormer', '🏠', `＋ ${t('rf.add.dormer')}`, 'dormer', 'dormers');
    addBtn(sky, 'addSkylight', '🪟', `＋ ${t('rf.add.skylight')}`, 'sky', 'skylights');
    body.append(add);
    const hidden = el('div', 'rgBox rfHidden'); hidden.hidden = true;  // the classic add buttons and headings: kept for their clicks
    const list = el('div', 'rfParts rgBox');
    const dCards = dorm.filter((x) => x.classList.contains('dormerCard'));
    dCards.forEach((card, i) => list.append(partRow('dormer', i, card, r, m)));
    const sCards = sky.filter((x) => x.classList.contains('skylightCard')).slice(0, (r.skylights || []).length);
    sCards.forEach((card, i) => list.append(partRow('sky', i, card, r, m)));
    sol.forEach((s, i) => {
      const row = btn(`rfPart${open?.kind === 'solar' && open.i === i ? ' hi' : ''}`, null, () => ctx.select({ kind: 'device', id: s.id }));
      row.dataset.part = 'solar';
      row.append(el('span', 'ic', '☀'), el('b', '', f.devices.find((d) => d.id === s.id)?.name || t('rf.solar')), el('span', 'sum', t('rf.chip.solar', { n: s.n })), el('span', 'eye', '›'));
      list.append(row);
    });
    if (!list.childElementCount) list.append(el('p', 'sub', t('rf.emptyTop')));
    body.append(list);
    hidden.append(...dorm.filter((x) => !dCards.includes(x)), ...sky.filter((x) => !sCards.includes(x)));
    body.append(hidden);
  }
  /** one dormer or roof window: a line; open: its kind as pictures (a dormer) and its fields */
  function partRow(kind, i, card, r, m) {
    const isOpen = open?.kind === kind && open.i === i;
    const wrap = el('div', `rfPartBox${isOpen ? ' open' : ''}`); wrap.dataset.part = kind; wrap.dataset.i = i;
    const d = kind === 'dormer' ? r.dormers[i] : r.skylights[i], mm = kind === 'dormer' ? m.dormers[i] : m.skylights[i];
    const name = card.querySelector('.dormerCap')?.textContent || '';
    const line = kind === 'dormer'
      ? `${t(`dormer.${DORMER_TYPES.includes(d?.type) ? d.type : 'gable'}`)} · ${ctx.fmtLen(mm?.w ?? d?.w ?? 1.6)} · ${t(mm?.side === 1 ? 'dormer.sideB' : 'dormer.sideA')}`
      : `${Math.round((d?.w ?? 0.78) * 100)} × ${Math.round((d?.h ?? 1.18) * 100)} cm · ${t(mm?.side === 1 ? 'dormer.sideB' : 'dormer.sideA')}`;
    const row = btn(`rfPart${isOpen ? ' hi' : ''}`, null, () => { open = isOpen ? null : { kind, i }; rerender(); });
    row.append(el('span', 'ic', kind === 'dormer' ? '🏠' : '🪟'), el('b', '', name), el('span', 'sum', mm?.fit === false ? `⚠ ${t('rf.noFit')}` : line), el('span', 'eye', isOpen ? '▴' : '▾'));
    wrap.append(row);
    if (isOpen) {
      const bd = el('div', 'rfPartBody');
      if (kind === 'dormer') {
        const tiles = el('div', 'rfTiles three'); tiles.id = 'dormerKinds';
        DORMER_TYPES.forEach((k) => {
          const b = btn(`rfTile${(d.type || 'gable') === k ? ' on' : ''}`, null, () => edit(() => setDormerType(d, k, r)));
          b.dataset.type = k; b.innerHTML = dormerIcon(k, 64); b.append(el('span', 'nm', t(`dormer.${k}`)));
          tiles.append(b);
        });
        bd.append(tiles);
        card.querySelector('.dormerType')?.closest('.prop')?.classList.add('rfGone');   // the pictures above set it
      }
      card.querySelector('.dormerCap')?.classList.add('rfGone');
      bd.append(...withHelp([card]));
      wrap.append(bd);
    } else {
      const keep = el('div', 'rfHidden'); keep.hidden = true; keep.append(card); wrap.append(keep);
    }
    return wrap;
  }
  /** the map: plan x / z (z down, as the 2D plan), scaled to the panel */
  function mapSvg(m, sol) {
    const o = m.outline, Wm = o.x1 - o.x0, Hm = o.z1 - o.z0, pad = 26;
    const s = Math.min(330 / Wm, 250 / Hm), W = Math.round(Wm * s + pad * 2), H = Math.round(Hm * s + pad * 2);
    const X = (x) => +(pad + (x - o.x0) * s).toFixed(1), Z = (z) => +(pad + (z - o.z0) * s).toFixed(1);
    const HI = '#ffd45c', R = (q, extra) => `<rect x="${X(q.x0)}" y="${Z(q.z0)}" width="${((q.x1 - q.x0) * s).toFixed(1)}" height="${((q.z1 - q.z0) * s).toFixed(1)}" ${extra}/>`;
    let g = `<defs><pattern id="rfTiles" width="9" height="7" patternUnits="userSpaceOnUse"${m.alongX ? '' : ' patternTransform="rotate(90)"'}><rect width="9" height="7" fill="${m.flat ? COL.flat : '#bf5a40'}"/><path d="M0 6.5 H9" stroke="${m.flat ? COL.flatD : '#9b432f'}" stroke-width="1"/></pattern></defs>`;
    g += R(o, `fill="url(#rfTiles)" stroke="#5a2418" stroke-width="2" rx="2"`);
    g += R(m.house, `fill="none" stroke="rgba(255,255,255,.55)" stroke-dasharray="5 4" stroke-width="1.3"`);
    if (m.ridge) {
      g += `<line x1="${X(m.ridge[0][0])}" y1="${Z(m.ridge[0][1])}" x2="${X(m.ridge[1][0])}" y2="${Z(m.ridge[1][1])}" stroke="#4a1b11" stroke-width="${m.shed ? 6 : 4.5}" stroke-linecap="round"/>`;
      if (m.hip) {                                                     // a hip roof: from the corners to the ends of the ridge
        const c = [[o.x0, o.z0], [o.x1, o.z0], [o.x1, o.z1], [o.x0, o.z1]], [e0, e1] = m.ridge;
        c.forEach((q) => { const e = Math.hypot(q[0] - e0[0], q[1] - e0[1]) < Math.hypot(q[0] - e1[0], q[1] - e1[1]) ? e0 : e1; g += `<line x1="${X(q[0])}" y1="${Z(q[1])}" x2="${X(e[0])}" y2="${Z(e[1])}" stroke="#4a1b11" stroke-width="2"/>`; });
      }
    }
    m.sides.forEach((sd) => { g += `<text x="${X(sd.at[0])}" y="${Z(sd.at[1]) + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="rgba(255,240,230,.85)" stroke="rgba(60,20,10,.6)" stroke-width="3" paint-order="stroke">${t(sd.side === 1 ? 'dormer.sideB' : 'dormer.sideA')}</text>`; });
    sol.forEach((p, i) => {
      const hw = p.w / 2, hd = p.d / 2, on = open?.kind === 'solar' && open.i === i;
      let cells = '';                                                  // one line between each column and row of panels
      for (let c = 1; c < p.cols; c++) cells += `<line x1="${((-hw + (c * p.w) / p.cols) * s).toFixed(1)}" y1="${(-hd * s).toFixed(1)}" x2="${((-hw + (c * p.w) / p.cols) * s).toFixed(1)}" y2="${(hd * s).toFixed(1)}" stroke="#9fb3c8" stroke-width=".8"/>`;
      for (let k = 1; k < p.rows; k++) cells += `<line x1="${(-hw * s).toFixed(1)}" y1="${((-hd + (k * p.d) / p.rows) * s).toFixed(1)}" x2="${(hw * s).toFixed(1)}" y2="${((-hd + (k * p.d) / p.rows) * s).toFixed(1)}" stroke="#9fb3c8" stroke-width=".8"/>`;
      g += `<g data-part="solar" data-i="${i}" transform="translate(${X(p.x)} ${Z(p.z)}) rotate(${p.rot})" style="cursor:pointer"><rect x="${(-hw * s).toFixed(1)}" y="${(-hd * s).toFixed(1)}" width="${(p.w * s).toFixed(1)}" height="${(p.d * s).toFixed(1)}" fill="#16233f" stroke="${on ? HI : '#9fb3c8'}" stroke-width="${on ? 3 : 1}"/>${cells}</g>`;
    });
    m.skylights.forEach((q) => {
      if (q.fit === false) return;
      const on = open?.kind === 'sky' && open.i === q.i;
      g += `<g data-part="sky" data-i="${q.i}" style="cursor:grab">${R(q.rect, `fill="#9fd3ff" stroke="${on ? HI : '#2f3d4b'}" stroke-width="${on ? 3.5 : 2.5}"`)}</g>`;
    });
    m.dormers.forEach((q) => {
      if (q.fit === false) return;
      const on = open?.kind === 'dormer' && open.i === q.i, fill = q.type === 'flat' ? COL.flat : q.type === 'shed' ? '#7b3322' : '#9b3f2b';
      g += `<g data-part="dormer" data-i="${q.i}" style="cursor:grab">${R(q.rect, `fill="${fill}" stroke="${on ? HI : 'rgba(0,0,0,.35)'}" stroke-width="${on ? 3.5 : 1}"`)}`;
      if (q.type === 'gable') { const c = m.alongX ? [[(q.rect.x0 + q.rect.x1) / 2, q.rect.z0], [(q.rect.x0 + q.rect.x1) / 2, q.rect.z1]] : [[q.rect.x0, (q.rect.z0 + q.rect.z1) / 2], [q.rect.x1, (q.rect.z0 + q.rect.z1) / 2]]; g += `<line x1="${X(c[0][0])}" y1="${Z(c[0][1])}" x2="${X(c[1][0])}" y2="${Z(c[1][1])}" stroke="#4a1b11" stroke-width="2"/>`; }
      g += `<line x1="${X(q.front[0][0])}" y1="${Z(q.front[0][1])}" x2="${X(q.front[1][0])}" y2="${Z(q.front[1][1])}" stroke="#9fd3ff" stroke-width="4"/></g>`;
    });
    const sel = open?.kind === 'dormer' ? m.dormers[open.i] : open?.kind === 'sky' ? m.skylights[open.i] : null;
    if (sel && sel.fit !== false) {                                     // the open one: how far from the gable
      const q = sel.rect, y = m.alongX ? Math.min(o.z1, q.z1 + 0.6) : null, a0 = m.alongX ? m.house.x0 : m.house.z0, a1 = m.alongX ? q.x0 : q.z0;
      const dist = ctx.fmtLen(Math.max(0, a1 - a0));
      if (m.alongX) g += `<line x1="${X(a0)}" y1="${Z(y)}" x2="${X(a1)}" y2="${Z(y)}" stroke="${HI}" stroke-width="2"/><text x="${(X(a0) + X(a1)) / 2}" y="${Z(y) - 5}" text-anchor="middle" font-size="11.5" font-weight="900" fill="${HI}" stroke="rgba(0,0,0,.6)" stroke-width="3" paint-order="stroke">${t('rf.fromGable', { d: dist })}</text>`;
      else { const x = Math.min(o.x1, q.x1 + 0.6); g += `<line x1="${X(x)}" y1="${Z(a0)}" x2="${X(x)}" y2="${Z(a1)}" stroke="${HI}" stroke-width="2"/><text x="${X(x) + 5}" y="${(Z(a0) + Z(a1)) / 2}" font-size="11.5" font-weight="900" fill="${HI}" stroke="rgba(0,0,0,.6)" stroke-width="3" paint-order="stroke">${t('rf.fromGable', { d: dist })}</text>`; }
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" data-geo='${JSON.stringify({ W, s })}' style="max-width:100%;height:auto;display:block;margin:0 auto;touch-action:none">${g}</svg>`;
  }

  /* ---------------- Mehr Dächer: the further roofs (the classic cards) ---------------- */
  function partsTab(body, grp) {
    const box = el('div', 'rgBox rfMore');
    box.append(...withHelp(grp('parts').filter((x) => !x.matches('h4'))));
    body.append(box);
    if (open?.kind === 'part') {                                       // a further roof was clicked: its card
      const r = ctx.layout().floors[cur.opts.fi ?? ctx.floorIdx()]?.roof, i = (r?.parts || []).findIndex((p, k) => (p.id || `part${k}`) === open.id);
      const card = box.querySelectorAll('.roofPartCard')[i];
      if (card) { card.classList.add('hi'); queueMicrotask(() => card.scrollIntoView({ block: 'nearest' })); }
    }
  }

  /* ---------------- Vorlagen: ready-made roofs, own roofs ---------------- */
  function tplTab(body, f, r, bb) {
    body.append(el('p', 'v2Hint', t('rf.tplHint')));
    const grid = el('div', 'rfTiles tpl'); grid.id = 'roofTemplates';
    TEMPLATES.forEach((T) => {
      const b = btn('rfTile', null, () => {
        edit(() => applyTemplate(r, T.key, bb, () => ctx.uid(), (k) => t(`rf.tpl.${k}`)));
        ctx.setStatus?.(t('rf.tplDone', { n: t(`rf.tpl.${T.key}`) }));
      });
      b.dataset.tpl = T.key; b.innerHTML = roofIcon(T.pic, 92);
      b.append(el('span', 'nm', t(`rf.tpl.${T.key}`)), el('small', '', t(`rf.tplSub.${T.key}`)));
      grid.append(b);
    });
    const own = cleanOwn(ctx.settings()?.roofTemplates);
    own.forEach((o, i) => {
      const b = btn('rfTile own', null, () => { edit(() => applyOwn(r, o.roof, () => ctx.uid())); ctx.setStatus?.(t('rf.tplDone', { n: o.name })); });
      b.dataset.own = i; b.innerHTML = roofIcon(o.roof.dormers?.length ? 'dormers' : o.roof.type, 92);
      b.append(el('span', 'nm', `⭐ ${o.name}`));
      const del = btn('rfDel', '×', (e) => { e.stopPropagation(); if (!confirm(t('rf.ownDel', { n: o.name }))) return; ctx.settings().roofTemplates = own.filter((_, k) => k !== i); ctx.saveSettings(); rerender(); });
      del.title = t('rf.ownDel', { n: o.name });
      b.append(del);
      grid.append(b);
    });
    const keep = btn('rfTile keep', null, () => {
      const name = prompt(t('rf.ownName'), t('rf.ownDefault'));
      if (!name || !name.trim()) return;
      const s = ctx.settings();
      s.roofTemplates = [...cleanOwn(s.roofTemplates), { name: name.trim().slice(0, 40), roof: ownRoof(r) }].slice(-MAX_OWN);
      ctx.saveSettings(); rerender();
      ctx.setStatus?.(t('rf.ownKept', { n: name.trim() }));
    });
    keep.id = 'roofKeep'; keep.append(el('span', 'big', '⭐'), el('span', 'nm', t('rf.own')), el('small', '', t('rf.ownSub')));
    grid.append(keep);
    body.append(grid);
  }

  return { render, refresh: rerender, open: (o) => { if (o?.tab) tab = o.tab; if ('part' in (o || {})) open = o.part; } };
}
