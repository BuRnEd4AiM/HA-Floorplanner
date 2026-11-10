/* „Oberfläche 2“ (4.73.0, the owner's wish of 2026-11-08, the pictures in docs/ideen-5.0/): the switch between the classic panel and the
 * new one (in the top bar of the edit mode and in ⚙ → Allgemein, per device; ?ui=2 in the address), and the new panel itself: props.js
 * draws its fields as always, with invisible marks where they belong; here they are moved into sections that fold in and out, each with a
 * line that says what is set, under a path (house › floor › room › object) and a head with the buttons that were at the bottom. A window
 * is drawn half open, its panes to tap; its kinds are pictures; a room has tabs, its floors are small pictures, its floor height is seen
 * from the side. The rules are in uiv2.js (tested). Nothing new is stored: the same fields, only ordered. */
import { UI_KEY, OPEN_KEY, cleanUi, uiFromQuery, panelKind, groupMarked, sectionOrder, isOpen, cleanOpen, ROOM_TABS, PANE_KINDS, paneKinds,
  setPaneKind, setPaneCount, paneCaption, windowSvg, windowKind, applyWindowKind, summary, sayLine, levelSvg, headIcon, crumbs } from './uiv2.js';
import { windowPanes } from './windowpanes.js';
import { OPENING_DEFAULTS, clampOpeningPos, openingOverlaps } from './walls.js';
import { roomOpenings } from './roompanel.js';
import { polyArea } from './rooms.js';
import { fmtArea } from './i18n.js';
import { drawPattern } from './patterns.js';
import { resolve } from './finishes.js';
import { initUiV2Tools } from './uiv2tools.js';
import { initUiV2Home } from './uiv2homeui.js';

const KIND_KEYS = ['window', 'window2', 'window3', 'windowTall', 'windowFloor', 'windowBath', 'windowFixed'];   // the window kinds shown
const PANE_ICON = { left: '⇤', right: '⇥', bottom: '⤓', top: '⤒', fixed: '▭' };

/** ctx: $, t, selection(), select(sel) (null: nothing), floor(), houseName(), findOpening(id), roomAt(x, z), catOf(type), stateText(e),
 *  entityName(e), fmtLen(m), imperial(), snapshot(), changed(), renderProps(), setStatus(txt), propsTitle(kind, it); for the tree and the
 *  tools (5.0.0): layout(), floorIdx(), isLive(), tool(), switchFloor(i), houses(), houseId(), switchHouse(id), addFloorOf(kind),
 *  moveFloorTo(from, to), renderFloorPanel(), storeyText(), fmtArea(m2) */
export function initUiV2(ctx) {
  const { $, t } = ctx;
  let mode = 'classic';
  try { mode = cleanUi(localStorage.getItem(UI_KEY)); } catch { /* no storage: classic */ }
  const asked = uiFromQuery(location.search);
  if (asked) { mode = asked; store(); }
  let opened = {};
  try { opened = cleanOpen(JSON.parse(localStorage.getItem(OPEN_KEY) || '{}')); } catch { opened = {}; }
  let paneSel = { id: null, i: -1 };                       // the pane tapped in the picture (its menu is open)
  let roomTab = 'general', floorGroup = null;              // the tab of a room, the group of floors shown
  const thumbs = new Map();                                // pattern -> picture (data URL)
  /** the new panel is shown: chosen, and not on a phone (the owner decides the phone later, 2026-11-09: the classic sheet stays there) */
  const active = () => mode === 'v2' && !document.body.classList.contains('phoneview');
  const tools = initUiV2Tools(ctx);                        // 🔍 search, „Noppel“, „⇉ Übernehmen“ (uiv2tools.js)
  const home = initUiV2Home({ ...ctx, mode: () => (active() ? 'v2' : 'classic') });  // nothing selected: the house as a tree, a floor (uiv2homeui.js)

  function store() { try { localStorage.setItem(UI_KEY, mode); } catch { /* a private window: for now */ } }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = el('button', cls, text); b.type = 'button'; if (on) b.addEventListener('click', on); return b; };
  const edit = (fn) => { ctx.snapshot(); fn(); ctx.changed(); ctx.renderProps(); };

  /* ---- the switch ---- */
  const bar = el('div', 'group edit-only'); bar.id = 'uiSwitch'; bar.title = t('v2.switch.tip');
  const bClassic = btn('', t('v2.switch.classic'), () => setMode('classic')); bClassic.dataset.ui = 'classic';
  const bNew = btn('', t('v2.switch.new'), () => setMode('v2')); bNew.dataset.ui = 'v2';
  bar.append(bClassic, bNew);
  $('#settingsBtn')?.closest('.group')?.before(bar);
  const row = el('div', 'row'); row.id = 'setUiRow';
  const lab = el('label', '', t('v2.set.label')); lab.htmlFor = 'setUi';
  const pick = el('select'); pick.id = 'setUi';
  pick.add(new Option(t('v2.set.classic'), 'classic')); pick.add(new Option(t('v2.set.v2'), 'v2'));
  pick.addEventListener('change', () => setMode(pick.value));
  const hint = el('p', 'sub', t('v2.set.hint')); hint.id = 'setUiHint';
  row.append(lab, pick);
  const gen = $('details.setGroup[data-group=general] .sgBody');
  gen?.append(row, hint);                                  // last: language and design stay the first tiles side by side (28_settings)

  function setMode(m) {
    mode = cleanUi(m); store(); show(); tools.reset(); ctx.renderProps(); home.sync();
  }
  function show() {
    document.body.classList.toggle('uiV2', mode === 'v2');
    bClassic.classList.toggle('active', mode !== 'v2'); bNew.classList.toggle('active', mode === 'v2');
    pick.value = mode;
  }
  show();

  /* ---- the new panel ---- */
  /** props.js has drawn the fields of selection sel (object it) into body: order them (nothing for several things or other kinds) */
  function decorate(body, sel, it, multi) {
    if (!active() || multi || !sel || !it) return;
    const pk = panelKind(sel.kind, it);
    if (!['window', 'door', 'room', 'device', 'wall'].includes(pk)) return;
    const kids = [...body.children];
    const groups = groupMarked(kids, (e) => (e.classList?.contains('v2mark') ? e.dataset.sec : null));
    body.textContent = '';
    $('#props').classList.add('v2');
    const [path, hd] = head(pk, sel, it);
    body.append(path, hd);
    const top = groups.get('top') || [];
    if (top.length) { const box = el('div', 'v2Top'); box.append(...top); body.append(box); }
    const secs = pk === 'room' ? roomTabs(body, groups, it) : sections(body, pk, groups, it);
    const hidden = el('div', 'v2Hidden'); hidden.hidden = true;           // the classic delete button and pane fields: kept, not shown
    hidden.append(...(groups.get('del') || []), ...(groups.get('panesList') || []));
    body.append(hidden);
    tools.decorate(body, hd, pk, sel, it, secs, pk === 'room' ? secs.map((s) => s.bd) : null);   // search, tabs on the panel, „Übernehmen“
  }

  /** the path and the head: sign, name, what it is, a few chips, the buttons */
  function head(pk, sel, it) {
    const f = ctx.floor(), room = roomOf(sel, it, f);
    const name = it.name || ctx.propsTitle(sel.kind, it);
    const path = el('nav', 'v2Crumbs'); path.id = 'v2Crumbs';
    crumbs({ house: ctx.houseName(), floor: f?.name, room, name, kind: sel.kind }).forEach((c, i, all) => {
      if (i) path.append(el('i', '', '›'));
      const last = i === all.length - 1, b = btn(last ? 'last' : 'c', c.text, last ? null : () => ctx.select(c.sel));
      if (last) b.disabled = true;
      path.append(b);
    });
    const h = el('div', 'v2Head'); h.id = 'v2Head';
    h.append(el('div', 'ic', headIcon(pk, it, pk === 'device' ? ctx.catOf(it.type) : '')));
    const nm = el('b', '', name);
    const sub = el('small', '', subLine(pk, sel, it, room));
    h.append(nm, sub);
    const chips = el('div', 'chips');
    for (const [text, cls] of chipList(pk, it, sel.kind)) chips.append(el('span', `v2Chip ${cls}`, text));
    if (chips.childElementCount) h.append(chips);
    const acts = el('div', 'acts');
    const act = (id, icon, label, on, cls = '') => { const b = btn(cls, null, on); b.id = id; b.append(el('span', '', icon), el('small', '', label)); acts.append(b); return b; };
    if (pk === 'device') {
      act('v2Bring', '🎯', t('v2.act.bring'), () => $('#devBring')?.click());
      act('v2Lock', it.locked ? '🔒' : '🔓', t(it.locked ? 'v2.act.locked' : 'v2.act.lock'), () => $('#devLock')?.click(), it.locked ? 'on' : '');
    }
    if (pk === 'room' && ctx.roomLock) {                     // 🔒 a room (5.1.0): locked at once, „Was bleibt fest?“ opens (roomlockui.js)
      act('v2Lock', it.locked ? '🔒' : '🔓', t(it.locked ? 'v2.act.locked' : 'v2.act.lock'), (e) => ctx.roomLock.roomButton(e.currentTarget, it), it.locked ? 'on' : '');
    }
    if (['window', 'door', 'room', 'device'].includes(pk)) act('v2CopyBtn', '⇉', t('v2.act.copy'), () => tools.toggleCopy(sel), tools.copyOpen(sel.id) ? 'on' : '');
    act('v2Delete', '🗑', t('panel.delete'), () => $('#propsDelete')?.click(), 'del');
    h.append(acts);
    return [path, h];
  }
  function roomOf(sel, it, f) {
    if (!f) return null;
    if (sel.kind === 'room') return it;
    if (sel.kind === 'device') return ctx.roomAt(it.x, it.z) || null;
    if (sel.kind === 'opening') return f.rooms.find((r) => roomOpenings(r, f).some((o) => o.id === it.id)) || null;
    return null;
  }
  function subLine(pk, sel, it, room) {
    if (pk === 'room') return `${fmtArea(polyArea(it.points || []), ctx.imperial())} · ${ctx.floor()?.name || ''}`;
    const what = ctx.propsTitle(sel.kind, it);
    return room && pk !== 'wall' ? `${what} · ${room.name || ''}` : what;
  }
  function chipList(pk, it, kind) {
    const out = [];
    const lw = ctx.roomLock?.why(kind, it.id);              // locked by its room or the plan (5.1.0): say so on top
    if (lw && !lw.own && pk !== 'room') out.push([lw.plan ? `🔒 ${t('rlock.chipPlan')}` : `🔒 ${t('rlock.chipRoom', { n: lw.room || t('prop.room') })}`, 'lock']);
    if (pk === 'window' || pk === 'door') {
      out.push([`↔ ${ctx.fmtLen(it.width)} × ${ctx.fmtLen(it.height)}`, '']);
      if (it.entity) out.push([`🔗 ${t('v2.chip.contact')}`, 'ok']); else out.push([t('v2.sum.noContact'), '']);
    } else if (pk === 'device') {
      if (it.entity) out.push([`🔗 ${ctx.stateText(it.entity)}`, 'ok']);
      if (it.locked) out.push([`🔒 ${t('v2.act.locked')}`, 'warn']);
    } else if (pk === 'room') {
      if (it.locked || lw?.plan) out.push([`🔒 ${t(lw?.plan ? 'rlock.chipPlan' : 'v2.act.locked')}`, 'lock']);
      if (it.area) out.push([`🔗 ${t('v2.chip.area')}`, 'ok']);
    }
    return out;
  }

  /** the sections of a window, door, device or wall */
  function sections(body, pk, groups, it) {
    const out = [];
    const dormer = pk === 'window' && !!ctx.findOpening(it.id)?.wall?.dormer;
    const drawn = pk === 'window' ? (dormer ? ['panes'] : ['kind', 'panes']) : [];
    for (const [key, icon, def] of sectionOrder(pk, groups, drawn)) {
      const open = isOpen(pk, key, def, opened);
      const sec = el('section', `v2Sec${open ? ' open' : ''}`); sec.dataset.sec = key;
      const hd = btn('hd'); hd.setAttribute('aria-expanded', String(open));
      const line = key === 'kind' ? kindLine(it) : sayLine(t, summary(pk, key, it, { len: (m) => ctx.fmtLen(m), name: (e) => ctx.entityName(e) }));
      hd.append(el('span', 'i', icon), el('b', '', t(`v2.sec.${key}`)), el('span', 'sum', line || ''), el('span', 'chev', open ? '▴' : '▾'));
      const bd = el('div', 'bd'); bd.hidden = !open;
      hd.addEventListener('click', () => {
        const now = bd.hidden;
        bd.hidden = !now; sec.classList.toggle('open', now); hd.setAttribute('aria-expanded', String(now)); hd.lastChild.textContent = now ? '▴' : '▾';
        opened[`${pk}.${key}`] = now;
        try { localStorage.setItem(OPEN_KEY, JSON.stringify(opened)); } catch { /* for now */ }
      });
      if (pk === 'window' && key === 'panes') panesUi(bd, it);
      else if (key === 'kind') kindsUi(bd, it);
      bd.append(...(groups.get(key) || []));
      sec.append(hd, bd);
      body.append(sec);
      out.push({ key, icon, title: t(`v2.sec.${key}`), sec, hd, bd, rows: [...bd.children] });
    }
    return out;
  }

  /** the panes of a window as a picture: tap a pane, choose what it does; how many, which way they open */
  function panesUi(bd, it) {
    const kinds = paneKinds(it), sel = paneSel.id === it.id && paneSel.i < kinds.length ? paneSel.i : -1;
    const pic = el('div', 'v2WinBox'); pic.id = 'v2Window';
    pic.innerHTML = windowSvg(it, { sel, px: 150, maxW: 300, captions: kinds.map((k) => t(paneCaption(it, k))) });
    pic.querySelectorAll('[data-pane]').forEach((g) => g.addEventListener('click', () => {
      const i = +g.dataset.pane;
      paneSel = paneSel.id === it.id && paneSel.i === i ? { id: null, i: -1 } : { id: it.id, i };
      ctx.renderProps();
    }));
    bd.append(pic);
    if (sel >= 0) {
      const menu = el('div', 'v2PaneMenu'); menu.id = 'v2PaneMenu';
      menu.append(el('h5', '', kinds.length > 1 ? t('v2.pane.n', { n: sel + 1 }) : t('v2.pane.one')));
      PANE_KINDS.forEach((k) => {
        const b = btn(`v2Opt${kinds[sel] === k ? ' on' : ''}`, null, () => { edit(() => setPaneKind(it, sel, k)); });
        b.dataset.kind = k;
        b.append(el('span', 'ico', PANE_ICON[k]), el('span', '', t(`v2.pane.${k}`)));
        menu.append(b);
      });
      bd.append(menu);
    } else bd.append(el('p', 'v2Hint', t('v2.pane.hint')));
    if (it.style !== 'fixed') {
      const n = windowPanes(it), counts = [1, 2, 3, 4];
      if (n > 4) counts.push(n);
      const segN = el('div', 'v2Seg'); segN.id = 'v2PaneCount';
      counts.forEach((c) => { const b = btn(c === n ? 'on' : '', String(c), () => edit(() => setPaneCount(it, c))); b.dataset.n = c; segN.append(b); });
      const segD = el('div', 'v2Seg'); segD.id = 'v2OpenDir';
      [['in', 'v2.in'], ['out', 'v2.out']].forEach(([v, k]) => {
        const b = btn((it.openOutward ? 'out' : 'in') === v ? 'on' : '', t(k), () => edit(() => { if (v === 'out') it.openOutward = true; else delete it.openOutward; }));
        b.dataset.dir = v; segD.append(b);
      });
      bd.append(fieldRow(t('v2.panes'), segN), fieldRow(t('v2.opens'), segD));
    }
  }
  const fieldRow = (label, ctl) => { const r = el('div', 'v2F'); r.append(el('label', '', label), ctl); return r; };

  /** the name of the kind a window was made as, or "own sizes" */
  const kindLine = (it) => { const k = windowKind(it, OPENING_DEFAULTS); return k ? t(`op.${k}`) : t('v2.kinds.own'); };
  /** the kinds of window as pictures: a tap makes this window that kind (if it fits into its wall) */
  function kindsUi(bd, it) {
    const cur = windowKind(it, OPENING_DEFAULTS);
    const grid = el('div', 'v2Grid'); grid.id = 'v2Kinds';
    KIND_KEYS.forEach((k) => {
      const p = OPENING_DEFAULTS[k];
      const tile = btn(`v2Tile${k === cur ? ' on' : ''}`, null, () => {
        const { wall } = ctx.findOpening(it.id) || {};
        if (!wall) return;
        const pos = clampOpeningPos(wall, p.width, it.pos);
        if (pos === null || openingOverlaps(wall, pos, p.width, it.id, p)) { ctx.setStatus(t('v2.kinds.noFit')); return; }
        edit(() => { applyWindowKind(it, p); it.pos = pos; });
      });
      tile.dataset.kind = k;
      const pv = el('div', 'pv'); pv.innerHTML = windowSvg({ type: 'window', ...p }, { px: 50, maxW: 80 });
      tile.append(pv, el('span', 'nm', t(`op.${k}`)));
      grid.append(tile);
    });
    bd.append(grid, el('p', 'v2Hint', t('v2.kinds.hint')));
  }

  /** a room: tabs (general, floor, walls, devices); the floors as small pictures, the floor height from the side */
  function roomTabs(body, groups, it) {
    const tabs = el('div', 'v2Tabs'); tabs.id = 'v2RoomTabs';
    const panes = [];
    for (const [key, marks] of ROOM_TABS) {
      const els = marks.flatMap((m) => groups.get(m) || []);
      if (!els.length) continue;
      const b = btn(key === roomTab ? 'on' : '', t(`v2.tab.${key}`), () => { roomTab = key; tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); panes.forEach(([k, p]) => { p.hidden = k !== key; }); });
      b.dataset.tab = key;
      tabs.append(b);
      const pane = el('div', 'v2TabBody'); pane.dataset.tab = key; pane.hidden = key !== roomTab;
      pane.append(...els);
      panes.push([key, pane]);
    }
    if (!panes.some(([k]) => k === roomTab) && panes.length) { roomTab = panes[0][0]; panes[0][1].hidden = false; tabs.firstChild.classList.add('on'); }
    body.append(tabs, ...panes.map(([, p]) => p));
    floorTiles(it);
    levelPicture(it);
    return panes.map(([key, p]) => ({ key, icon: '', title: t(`v2.tab.${key}`), sec: null, hd: null, bd: p, rows: [...p.children] }));
  }
  function thumb(key) {
    if (!thumbs.has(key)) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 72;
      try { drawPattern(cv.getContext('2d'), 72, resolve({ pattern: key })); thumbs.set(key, cv.toDataURL()); } catch { thumbs.set(key, ''); }
    }
    return thumbs.get(key);
  }
  /** the list of floors (#roomCovering, finishui.js) as small pictures under their groups; a tap chooses it like the list */
  function floorTiles(it) {
    const s = $('#roomCovering');
    if (!s) return;
    const rowEl = s.closest('.prop');
    const groups = [...s.querySelectorAll('optgroup')].map((og) => ({ label: og.label, opts: [...og.querySelectorAll('option')] }));
    const now = groups.find((g) => g.opts.some((o) => o.value === s.value));
    if (!floorGroup || !groups.some((g) => g.label === floorGroup)) floorGroup = now?.label || groups[0]?.label;
    const box = el('div', 'v2Floors'); box.id = 'v2Floors';
    const chips = el('div', 'v2Seg wide'); chips.id = 'v2FloorGroups';
    const grid = el('div', 'v2Grid');
    const fill = () => {
      grid.textContent = '';
      const plain = btn(`v2Tile${s.value === '' ? ' on' : ''}`, null, () => choose(''));
      plain.dataset.cover = '';
      const pv = el('div', 'pv'); pv.style.background = it.color || '#8a7f70';
      plain.append(pv, el('span', 'nm', s.options[0]?.text || ''));
      grid.append(plain);
      (groups.find((g) => g.label === floorGroup)?.opts || []).forEach((o) => {
        const tile = btn(`v2Tile${o.value === s.value ? ' on' : ''}`, null, () => choose(o.value));
        tile.dataset.cover = o.value;
        const p = el('div', 'pv'), src = thumb(o.value);
        if (src) p.style.backgroundImage = `url(${src})`;
        tile.append(p, el('span', 'nm', o.text));
        grid.append(tile);
      });
    };
    groups.forEach((g) => {
      const b = btn(g.label === floorGroup ? 'on' : '', g.label, () => { floorGroup = g.label; chips.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); fill(); });
      chips.append(b);
    });
    function choose(v) { s.value = v; s.dispatchEvent(new Event('change')); }
    fill();
    box.append(chips, grid);
    rowEl.after(box);
    rowEl.classList.add('v2Gone');
  }
  /** the floor of the room higher or lower than its storey, seen from the side, over its field */
  function levelPicture(it) {
    const inp = $('#roomRaise');
    if (!inp) return;
    const box = el('div', 'v2LevelBox'); box.id = 'v2Level';
    const draw = () => { box.innerHTML = levelSvg(it.raise || 0, { storey: t('v2.level.storey'), room: it.name || '' }); };
    draw();
    inp.addEventListener('change', () => setTimeout(draw, 0));
    const r = inp.closest('.prop');
    r.before(el('h4', 'finHead', t('v2.level.title')), box);
  }

  /** props.js draws the panel anew: what we put beside it goes until decorate puts it back */
  function reset() { tools.reset(); }
  return { decorate, reset, homeSync: () => home.sync(), mode: () => mode, setMode };
}
