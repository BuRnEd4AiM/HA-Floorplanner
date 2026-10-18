/* Finishes in the properties panel (#448): the floor of a room (pattern, colour with a row of colours to tap, joints or second colour, size
 * of a tile or plank, angle), its walls (paint, woodchip, plaster, wallpaper, tiles, brick, wood ...; below a height something else, e.g.
 * tiles up to 1.20 m; the same for every room of the floor with one tap) and the two sides of one wall (an accent wall). The finish of the
 * facade is a setting (facadeui in settings.js). The rules are in finishes.js. */
import { choices, PATTERNS, PALETTES, cleanLook, cleanFinish, cleanBelow, cleanFaces, BELOW, SIDES, sideSpans } from './finishes.js';
import { cleanCovering } from './floorcover.js';

/** the name of a pattern in the texts: floors under cover.*, the others under fin.* */
export const patternName = (k) => (PATTERNS[k]?.on.includes('floor') ? `cover.${k}` : `fin.${k}`);
/** the label of the second colour of a pattern (grout, motif, gaps ...) */
export const secondLabel = (k) => `fin.c2.${PATTERNS[k]?.c2 || 'second'}`;
/** an element size in metres as shown: cm (metric) or inches, rounded */
export const sizeShown = (m, imperial) => Math.round(m * (imperial ? 39.3701 : 100) * 10) / 10;
export const sizeStored = (v, imperial) => v / (imperial ? 39.3701 : 100);

/** ctx: t, snapshot(), changed(), render() (the panel again), floor(), imperial(), setStatus(txt) */
export function initFinishUi(ctx) {
  const { t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const row = (label, ...inputs) => { const w = el('div', 'prop'), l = el('label', '', label); w.append(l, ...inputs); return w; };
  /** a change: one undo step, saved, the panel drawn again */
  const edit = (fn) => { ctx.snapshot(); fn(); ctx.changed(); ctx.render(); };

  /** the list of patterns for `where` under their headings, with a first entry `none` ('' = no pattern) */
  function patternSelect(id, where, value, none) {
    const s = el('select'); s.id = id;
    s.add(new Option(none, ''));
    choices(where).forEach(([g, keys]) => {
      const og = el('optgroup'); og.label = t(`fin.g.${g}`);
      keys.forEach((k) => og.append(new Option(t(patternName(k)), k)));
      s.append(og);
    });
    s.value = value || '';
    return s;
  }

  /** colour, second colour, size and angle of the finish that acc holds ({ get() -> stored finish or null, set(finish or null) }) */
  function lookFields(box, acc, id) {
    const spec = acc.get(), d = PATTERNS[spec.pattern], look = cleanLook(spec) || {};
    const put = (patch) => edit(() => { const next = { ...spec, ...patch }; Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]); acc.set(next); });
    const color = look.color || d.color;
    const sw = el('div', 'swatches'); sw.id = `${id}Swatches`;
    PALETTES[d.pal].forEach((c) => {
      const b = el('button', c === color ? 'sw on' : 'sw'); b.type = 'button'; b.style.background = c; b.title = c; b.dataset.color = c;
      b.addEventListener('click', () => put({ color: c === d.color ? undefined : c }));
      sw.append(b);
    });
    const ci = el('input'); ci.type = 'color'; ci.id = `${id}Color`; ci.value = color;
    ci.addEventListener('change', () => put({ color: ci.value === d.color ? undefined : ci.value }));
    box.append(row(t('fin.color'), ci), sw);
    if (d.color2) {
      const c2 = el('input'); c2.type = 'color'; c2.id = `${id}Color2`; c2.value = look.color2 || d.color2;
      c2.addEventListener('change', () => put({ color2: c2.value === d.color2 ? undefined : c2.value }));
      box.append(row(t(secondLabel(spec.pattern)), c2));
    }
    if (d.kind !== 'plain') {
      const imp = ctx.imperial(), si = el('input'); si.type = 'number'; si.id = `${id}Size`; si.min = sizeShown(0.01, imp); si.step = imp ? 0.5 : 1;
      si.value = sizeShown(look.size ?? d.size, imp); si.title = t('fin.sizeHint');
      si.addEventListener('change', () => { const v = parseFloat(si.value); if (v > 0) put({ size: sizeStored(v, imp) }); });
      const unit = el('span', 'unit', imp ? 'in' : 'cm');
      box.append(row(t('fin.size'), si, unit));
      const an = el('input'); an.type = 'number'; an.id = `${id}Angle`; an.step = 15; an.min = 0; an.max = 359; an.value = look.angle ?? d.angle ?? 0; an.title = t('fin.angleHint');
      an.addEventListener('change', () => { const v = parseFloat(an.value); if (Number.isFinite(v)) put({ angle: v }); });
      const quick = el('div', 'quickAngles'); quick.id = `${id}Angles`;
      [0, 45, 90, 135].forEach((a) => { const b = el('button', 'angleBtn', `${a}°`); b.type = 'button'; b.dataset.angle = a; b.addEventListener('click', () => put({ angle: a })); quick.append(b); });
      box.append(row(t('fin.angle'), an, el('span', 'unit', '°')), quick);
    }
    if (Object.keys(look).length) {
      const reset = el('button', 'linkBtn', `↺ ${t('fin.reset')}`); reset.type = 'button'; reset.id = `${id}Reset`;
      reset.addEventListener('click', () => edit(() => acc.set({ pattern: spec.pattern })));
      box.append(reset);
    }
  }

  /** the floor of room it: its covering and how it looks; without a covering its colour (colorField) */
  function floorFields(body, it, colorField) {
    const acc = {
      get: () => (cleanCovering(it.covering) ? { pattern: it.covering, ...cleanLook(it.floorLook) } : null),
      set: (spec) => {
        if (!spec) { delete it.covering; delete it.floorLook; return; }
        it.covering = spec.pattern;
        const l = cleanLook(spec);
        if (l) it.floorLook = l; else delete it.floorLook;
      },
    };
    const s = patternSelect('roomCovering', 'floor', acc.get()?.pattern, t('cover.none')); s.title = t('cover.hint');
    s.addEventListener('change', () => edit(() => acc.set(s.value ? { pattern: s.value } : null)));
    body.append(row(t('cover.label'), s));
    if (acc.get()) lookFields(body, acc, 'floor'); else body.append(colorField());
  }

  /** the walls of room it: their finish, something else below a height, the same for every room of the floor */
  function wallFields(body, it) {
    body.append(el('h4', 'finHead', t('fin.walls')));
    const acc = { get: () => cleanFinish(it.wallLook, 'wall') || null, set: (spec) => { const f = cleanFinish(spec, 'wall'); if (f) it.wallLook = f; else delete it.wallLook; } };
    const s = patternSelect('roomWalls', 'wall', acc.get()?.pattern, t('fin.wallsNone')); s.title = t('fin.hint');
    s.addEventListener('change', () => edit(() => acc.set(s.value ? { pattern: s.value } : null)));
    body.append(row(t('fin.wall'), s));
    if (acc.get()) lookFields(body, acc, 'wall');
    const below = { get: () => cleanBelow(it.wallBelow) || null, set: (spec) => { const f = spec && cleanBelow({ height: it.wallBelow?.height, ...spec }); if (f) it.wallBelow = f; else delete it.wallBelow; } };
    const cb = el('input'); cb.type = 'checkbox'; cb.id = 'roomBelow'; cb.checked = !!below.get();
    cb.addEventListener('change', () => edit(() => below.set(cb.checked ? { pattern: 'wTiles', height: BELOW.def } : null)));
    const lb = el('label', 'chk'); lb.append(cb, document.createTextNode(` ${t('fin.below')}`)); lb.title = t('fin.belowHint');
    body.append(lb);
    if (below.get()) {
      const b = below.get(), bs = patternSelect('roomBelowPattern', 'wall', b.pattern, t('fin.wallsNone'));
      bs.addEventListener('change', () => edit(() => below.set(bs.value ? { ...b, pattern: bs.value, color: undefined, color2: undefined, size: undefined, angle: undefined } : null)));
      const imp = ctx.imperial(), hi = el('input'); hi.type = 'number'; hi.id = 'roomBelowHeight'; hi.step = imp ? 0.25 : 0.05; hi.min = 0.05;
      hi.value = imp ? Math.round(b.height * 3.28084 * 100) / 100 : b.height;
      hi.addEventListener('change', () => { const v = parseFloat(hi.value); if (v > 0) edit(() => below.set({ ...b, height: imp ? v / 3.28084 : v })); });
      body.append(row(t('fin.belowPattern'), bs), row(t('fin.belowHeight'), hi, el('span', 'unit', imp ? 'ft' : 'm')));
      lookFields(body, { get: () => below.get(), set: (spec) => below.set({ ...spec, height: b.height }) }, 'below');
    }
    if (it.wallLook || it.wallBelow) {
      const all = el('button', '', t('fin.allRooms')); all.type = 'button'; all.id = 'roomWallsAll';
      all.addEventListener('click', () => {
        const others = ctx.floor().rooms.filter((r) => r !== it);
        edit(() => others.forEach((r) => {
          if (it.wallLook) r.wallLook = { ...it.wallLook }; else delete r.wallLook;
          if (it.wallBelow) r.wallBelow = { ...it.wallBelow }; else delete r.wallBelow;
        }));
        ctx.setStatus?.(t('fin.allDone', { n: others.length }));
      });
      body.append(all);
    }
  }

  /** the two sides of wall w: as its room (or the facade outside) or a finish of its own over the whole height (an accent wall) */
  function faceFields(body, w) {
    const f = ctx.floor();
    body.append(el('h4', 'finHead', t('fin.faces')));
    const hint = el('p', 'sub', t('fin.faceHint')); body.append(hint);
    for (const [name, side] of Object.entries(SIDES)) {
      const room = sideSpans(w, f.rooms, side).filter((sp) => sp.room).sort((a, b) => (b.to - b.from) - (a.to - a.from))[0]?.room;
      const acc = {
        get: () => cleanFaces(w.faces)?.[name] || null,
        set: (spec) => { const faces = { ...cleanFaces(w.faces), [name]: cleanFinish(spec, 'side') }; const c = cleanFaces(faces); if (c) w.faces = c; else delete w.faces; },
      };
      const id = `face${name[0].toUpperCase()}${name.slice(1)}`;
      const s = patternSelect(id, 'side', acc.get()?.pattern, room ? t('fin.faceNone') : t('fin.faceNoneOut'));
      s.addEventListener('change', () => edit(() => acc.set(s.value ? { pattern: s.value } : null)));
      body.append(row(room ? t('fin.faceRoom', { room: room.name || t('prop.room') }) : t('fin.faceOut'), s));
      if (acc.get()) lookFields(body, acc, id);
    }
  }

  return { floorFields, wallFields, faceFields, patternSelect };
}

/** the facade in the settings dialog (#448): the pattern of the outside (none: the walls' colour as always) and its colour. $: query,
 *  t: texts. fill(settings) shows them, read(next) puts them into the settings to save */
export function initFacadeUi({ $, t }) {
  const sel = $('#setFacade'), col = $('#setFacadeColor');
  const def = (k) => PATTERNS[k]?.color || '#d9d4cc';
  function options() {
    sel.replaceChildren(new Option(t('set.facade.none'), ''));
    choices('facade').forEach(([g, keys]) => {
      const og = document.createElement('optgroup'); og.label = t(`fin.g.${g}`);
      keys.forEach((k) => og.append(new Option(t(patternName(k)), k)));
      sel.append(og);
    });
  }
  sel.addEventListener('change', () => { col.value = def(sel.value); col.disabled = !sel.value; });   // another pattern: its own colour first
  return {
    fill(settings) {
      options();
      const k = cleanFinish({ pattern: settings.facade }, 'facade')?.pattern || '';
      sel.value = k; col.value = settings.facadeColor || def(k); col.disabled = !k;
    },
    read(next) {
      next.facade = sel.value;
      next.facadeColor = sel.value && col.value.toLowerCase() !== def(sel.value) ? col.value.toLowerCase() : '';
    },
  };
}
