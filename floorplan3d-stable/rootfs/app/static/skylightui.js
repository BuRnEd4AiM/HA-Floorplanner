/* The roof windows in the panel of the roof floor (Dachfenster, #643): one card per roof window, of the main roof and of the further roofs
 * (not on a flat roof): which roof, which side, where along the ridge (slider and metres from the gable), a usual size or width / height,
 * how far from the eave; "+ Roof window". The window itself (contact, name, roller shutter) is set like any window: tap it in 3D. The
 * geometry is in skylight.js; floorpanel.js calls render(box, f, r). */
import { SKYLIGHT_DEFAULT, SKYLIGHT_SIZES, MAX_SKYLIGHTS, fitSkylight, skylightStart, posForStart, newSkylight, setSkylightWidth, skylightsAllowed } from './skylight.js';
import { fmtNum } from './i18n.js';

/** the base box of a further roof (as partBox in roofs.js), null without one */
const partBox = (p) => {
  const b = p?.box;
  return b && [b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) && b.x1 > b.x0 && b.z1 > b.z0 ? { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 } : null;
};

/** the roofs of a roof floor that can have roof windows: [{ spec, bb, key, name }] (the main roof first, key 'main', then the further
 *  roofs by their id); mainBox: the base box of the main roof */
export function skylightRoofs(r, mainBox, t = (k) => k) {
  const out = [];
  if (skylightsAllowed(r)) out.push({ spec: r, bb: mainBox, key: 'main', name: t('skylight.mainRoof') });
  (r?.parts || []).forEach((p, i) => { if (skylightsAllowed(p)) out.push({ spec: p, bb: partBox(p), key: p.id || `part${i}`, name: p.name || `${t('roof.partOne')} ${i + 1}` }); });
  return out;
}
/** move roof window s from roof `from` to roof `to` (their specs): it keeps its values, the new roof fits it */
export function moveSkylight(s, from, to) {
  if (from === to) return;
  const list = from.skylights || [], i = list.indexOf(s);
  if (i >= 0) list.splice(i, 1);
  if (!list.length) delete from.skylights;
  (to.skylights ||= []).push(s);
}
/** the usual size a roof window has ('w x h' in cm), '' for its own size */
export const sizeKey = (s) => {
  const w = s.w ?? SKYLIGHT_DEFAULT.w, h = s.h ?? SKYLIGHT_DEFAULT.h;
  const hit = SKYLIGHT_SIZES.find(([a, b]) => Math.abs(a - w) < 0.005 && Math.abs(b - h) < 0.005);
  return hit ? `${Math.round(hit[0] * 100)}x${Math.round(hit[1] * 100)}` : '';
};

/** ctx: t, field, inp, lenInput, select(opts, value, set) (a select that takes a snapshot and redraws), snapshot(), redo(), render(),
 *  roofBox() (the base box of the main roof of the open roof floor), uid(), knee() (the knee wall the main roof sits on) */
export function initSkylightUi(ctx) {
  const { t, field, inp, lenInput, select } = ctx;
  /** the knee wall under roof R: the main roof's, also for a further roof as high as the main roof (#621); else none */
  const kneeOf = (R) => (R.key === 'main' || R.spec.level === 'main' ? +ctx.knee?.() || 0 : 0);
  function render(box, f, r) {
    const head = document.createElement('h4'); head.id = 'skylightHead'; head.textContent = t('skylight.title'); box.append(head);
    const help = document.createElement('p'); help.className = 'sub'; help.id = 'skylightHelp'; box.append(help);
    const roofs = skylightRoofs(r, ctx.roofBox(), t);
    if (!roofs.length) { help.textContent = t('skylight.noFlat'); return; }
    help.textContent = t('skylight.help');
    let n = 0;
    roofs.forEach((R) => (R.spec.skylights || []).forEach((s) => {
      const card = document.createElement('div'); card.className = 'dormerCard skylightCard';
      const bb = R.bb, fit = bb ? fitSkylight(bb, R.spec, s) : null;
      const cap = document.createElement('b'); cap.className = 'dormerCap'; cap.textContent = s.window?.name || `${t('skylight.one')} ${++n}`; card.append(cap);
      if (roofs.length > 1) {                                       // on which roof (an L-shaped house, a shed roof over an annex)
        const rs = select(roofs.map((q) => [q.key, q.name]), R.key, (v) => moveSkylight(s, R.spec, (roofs.find((q) => q.key === v) || R).spec));
        rs.className = 'skylightRoof';
        card.append(field(t('skylight.roof'), rs));
      }
      if (R.spec.type !== 'shed') {                                 // a shed roof has one slope
        const sd = select([[0, t('dormer.sideA')], [1, t('dormer.sideB')]], s.side === 1 ? 1 : 0, (v) => { s.side = +v; });
        sd.className = 'skylightSide';
        card.append(field(t('dormer.side'), sd));
      }
      const pos = inp('range', Math.round((s.pos ?? 0.5) * 100), (v) => { s.pos = Math.max(0, Math.min(1, +v / 100)); queueMicrotask(ctx.render); }, { min: 0, max: 100, step: 1 });
      pos.classList.add('skylightPos');
      card.append(field(t('dormer.pos'), pos));
      if (fit) {                                                    // where it begins, in metres from the gable
        const st = lenInput(() => skylightStart(bb, R.spec, s), (v) => { s.pos = posForStart(bb, R.spec, s, v); queueMicrotask(ctx.render); }, { min: 0 });
        st.className = 'skylightStart'; st.title = t('skylight.startTip');
        card.append(field(t('dormer.start'), st));
      }
      const sz = select([['', t('skylight.ownSize')], ...SKYLIGHT_SIZES.map(([w, h]) => [`${Math.round(w * 100)}x${Math.round(h * 100)}`, `${Math.round(w * 100)} × ${Math.round(h * 100)} cm`])], sizeKey(s), (v) => {
        const hit = SKYLIGHT_SIZES.find(([w, h]) => `${Math.round(w * 100)}x${Math.round(h * 100)}` === v);
        if (hit) { setSkylightWidth(bb, R.spec, s, hit[0]); s.h = hit[1]; }
      });
      sz.className = 'skylightSize';
      card.append(field(t('skylight.size'), sz));
      const wd = lenInput(() => s.w ?? SKYLIGHT_DEFAULT.w, (v) => { setSkylightWidth(bb, R.spec, s, v); queueMicrotask(ctx.render); }, { min: 0.3 });
      wd.className = 'skylightWidth';
      card.append(field(t('dormer.width'), wd));
      const ht = lenInput(() => s.h ?? SKYLIGHT_DEFAULT.h, (v) => { s.h = Math.max(0.3, Math.min(3, v)); queueMicrotask(ctx.render); }, { min: 0.3 });
      ht.className = 'skylightHeight'; ht.title = t('skylight.heightTip');
      card.append(field(t('skylight.height'), ht));
      const ev = lenInput(() => (fit ? fit.eave : s.eave ?? 1), (v) => { s.eave = Math.max(0, v); }, { min: 0 });
      ev.className = 'skylightEave'; ev.title = t('skylight.eaveTip');
      card.append(field(t('dormer.eave'), ev));
      if (fit) {                                                    // how high its lower edge is over the base of the roof (the top of the walls / the knee wall)
        const hint = document.createElement('p'); hint.className = 'sub skylightLow';
        hint.textContent = t('skylight.low', { y: fmtNum(fit.y0 + kneeOf(R), 2, 2) });
        card.append(hint);
      }
      const del = document.createElement('button'); del.type = 'button'; del.className = 'skylightDel'; del.textContent = '×'; del.title = t('skylight.remove');
      del.addEventListener('click', () => {
        ctx.snapshot();
        const list = R.spec.skylights || [];
        list.splice(list.indexOf(s), 1);
        if (!list.length) delete R.spec.skylights;
        ctx.redo();
      });
      card.append(del);
      if (!fit) { const w = document.createElement('p'); w.className = 'sub warn'; w.textContent = t('skylight.noFit'); card.append(w); }
      box.append(card);
    }));
    const count = roofs.reduce((a, R) => a + (R.spec.skylights || []).length, 0);
    const add = document.createElement('button'); add.type = 'button'; add.id = 'addSkylight'; add.textContent = t('skylight.add');
    add.disabled = count >= MAX_SKYLIGHTS;
    add.addEventListener('click', () => {                           // on the main roof (or the first further roof that can have one)
      ctx.snapshot();
      const R = roofs[0];
      (R.spec.skylights ||= []).push(newSkylight(R.bb, R.spec, (R.spec.skylights || []).length, ctx.uid(), kneeOf(R)));
      ctx.redo();
    });
    box.append(add);
    const tip = document.createElement('p'); tip.className = 'sub'; tip.id = 'skylightTip'; tip.textContent = t('skylight.tip'); box.append(tip);
  }
  return { render };
}
