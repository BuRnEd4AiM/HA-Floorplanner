/* „Oberfläche 2“ for a selected object, second part (5.0.0; the owner's choice of 2026-11-09, pictures 5, 12 and 13 in docs/ideen-5.0/):
 * - 🔍 a search for a setting under the head: type a word („kipp“), only the fields that have it stay, their sections open; it also says
 *   how many settings in ⚙ have it and opens them there;
 * - „Noppel“: the sections hang as tabs on the left edge of the panel; a tap pulls that section out into a drawer beside the panel (the
 *   panel itself stays short), a tap again puts it back; it stays out for the next object that has it (wide screens only); every tab
 *   shows its name (upright, or across under its sign when there are too many for the height, see place());
 * - „⇉ Übernehmen“: the same settings for other windows / doors / rooms / devices of the same kind, in the room, on the floor or in the
 *   whole house, and which groups (panes, size, floor …). One undo step; a window that does not fit its wall is left as it was.
 * The rules are in uiv2more.js (tested); uiv2ui.js calls decorate() once it has built the sections. */
import { matches, COPY_GROUPS, copyDefaults, copyGroups, sameKind } from './uiv2more.js';
import { clampOpeningPos, openingOverlaps } from './walls.js';
import { roomOpenings } from './roompanel.js';
import { pointInPoly } from './rooms.js';

const WIDE = '(min-width: 1000px)';
const GROUP_LABEL = {
  window: { size: 'v2.sec.size', panes: 'v2.sec.panes', fixed: 'v2.sec.fixed', shutter: 'v2.sec.shutter' },
  door: { size: 'v2.sec.size', style: 'v2.sec.style' },
  room: { floor: 'v2.tab.floor', level: 'v2.level.title', walls: 'v2.tab.walls' },
  device: { dsize: 'v2.sec.dsize', look: 'v2.sec.look', tilt: 'v2.sec.tilt' },
};

/** ctx: $, t, layout(), floorIdx(), snapshot(), changed(), renderProps(), setStatus(txt) */
export function initUiV2Tools(ctx) {
  const { $, t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = el('button', cls, text); b.type = 'button'; if (on) b.addEventListener('click', on); return b; };
  let query = '', drawerKey = null, copyFor = null, copyScope = 'floor', copyPicked = null;
  const tabs = el('div', 'v2Nops'); tabs.id = 'v2Nops'; tabs.hidden = true;
  const drawer = el('aside', 'v2Drawer'); drawer.id = 'v2Drawer'; drawer.hidden = true;
  document.body.append(tabs, drawer);
  const wide = () => (typeof matchMedia === 'function' ? matchMedia(WIDE).matches : true);

  /** nothing of ours shows (no new panel for this selection) */
  function reset() { tabs.hidden = true; drawer.hidden = true; drawer.textContent = ''; }

  /** the sections are built (secs: [{ key, icon, title, sec, hd, bd }], in order); head: the head of the panel, body: #propsBody */
  function decorate(body, head, pk, sel, it, secs, tabsOf = null) {
    searchBox(body, head, secs, tabsOf);
    if (copyFor === sel.id && COPY_GROUPS[pk]) copyBox(head, pk, sel, it);
    nops(pk, secs);
  }

  /* ---- 🔍 the search ---- */
  function searchBox(body, head, secs, tabsOf) {
    const row = el('div', 'v2SearchRow');
    const inp = el('input', 'v2Search'); inp.type = 'search'; inp.id = 'v2Search'; inp.placeholder = t('v2.search.ph'); inp.value = query; inp.autocomplete = 'off';
    const res = el('div', 'v2SearchRes'); res.id = 'v2SearchRes';
    row.append(inp); head.after(row, res);
    const apply = () => {
      res.textContent = ''; res.hidden = !query;
      body.querySelectorAll('.v2Miss').forEach((x) => x.classList.remove('v2Miss'));
      if (!query) return;
      if (tabsOf) tabsOf.forEach((p) => { p.hidden = false; p.classList.add('v2Searching'); });
      let n = 0;
      for (const s of secs) {
        const all = matches(query, `${s.title} ${s.hd?.querySelector('.sum')?.textContent || ''}`);   // the name of the section or its line
        let hit = all;
        for (const r of s.rows) {
          const ok = all || matches(query, rowText(r));
          r.classList.toggle('v2Miss', !ok);
          if (ok && !all) { hit = true; n++; }
        }
        if (all) n++;
        if (s.sec) { s.sec.classList.toggle('v2Miss', !hit); if (hit) { s.bd.hidden = false; s.sec.classList.add('open'); } }
      }
      const inSettings = settingsHits();
      res.append(el('span', '', n ? t('v2.search.hits', { n }) : t('v2.search.none')));
      if (inSettings) {
        const go = btn('linkBtn', t('v2.search.settings', { n: inSettings }), () => openSettings(query));
        go.id = 'v2SearchSettings'; res.append(go);
      }
    };
    let timer = null;
    inp.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const was = query; query = inp.value.trim();
        if (!query && was) { ctx.renderProps(); focusSearch(); return; }   // back to the panel as it was
        apply();
      }, 150);
    });
    if (query) apply();
  }
  const focusSearch = () => queueMicrotask(() => { const i = $('#v2Search'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  /** the words of a field: its label, headings, hints, buttons; not the choices of a list */
  function rowText(r) {
    const parts = [r.title || ''];
    if (r.matches?.('label, p, h4, h5, button, b')) parts.push(r.textContent);
    r.querySelectorAll?.('label, p, h4, h5, b, small, button, .nm, span:not(.v2Opt span)').forEach((x) => parts.push(x.textContent, x.title || ''));
    return parts.join(' ');
  }
  function settingsHits() {
    let n = 0;
    document.querySelectorAll('#settingsDialog .sgBody > *').forEach((x) => { if (matches(query, rowText(x))) n++; });
    return n;
  }
  function openSettings(q) {
    $('#settingsBtn')?.click();
    const s = $('#setSearch');
    if (s) { s.value = q; s.dispatchEvent(new Event('input')); }
  }

  /* ---- „Noppel“: the sections as tabs on the panel, one pulled out into a drawer ---- */
  function nops(pk, secs) {
    const list = secs.filter((s) => s.sec);
    if (!wide() || list.length < 2) { reset(); return; }
    if (drawerKey && !list.some((s) => s.key === drawerKey)) drawerKey = null;
    tabs.textContent = ''; drawer.textContent = '';
    for (const s of list) {
      const b = btn(`v2Nop${s.key === drawerKey ? ' on' : ''}`, null, () => { drawerKey = drawerKey === s.key ? null : s.key; ctx.renderProps(); });
      b.dataset.sec = s.key; b.title = s.title;
      b.append(el('span', 'i', s.icon), el('span', 'tx', s.title));
      tabs.append(b);
    }
    tabs.hidden = false;
    const s = list.find((x) => x.key === drawerKey);
    if (s) {
      const hd = el('div', 'dh');
      hd.append(el('span', 'i', s.icon), el('b', '', s.title), btn('x', '✕', () => { drawerKey = null; ctx.renderProps(); }));
      drawer.append(hd, el('p', 'v2Hint', t('v2.nop.hint')));
      s.bd.hidden = false;
      drawer.append(s.bd);                                            // the very fields, pulled out of the panel
      s.sec.classList.add('out'); s.sec.classList.remove('open');
      s.sec.querySelector('.sum').textContent = t('v2.nop.out');
      s.sec.querySelector('.chev').textContent = '↗';
      drawer.hidden = false;
    } else drawer.hidden = true;
    place();
  }
  /** the tabs (and the drawer) at the left edge of the panel */
  function place() {
    const p = $('#panel')?.getBoundingClientRect();
    if (!p || tabs.hidden) return;
    const right = Math.round(innerWidth - p.left);
    drawer.style.right = `${right}px`; drawer.style.top = `${Math.round(p.top + 8)}px`; drawer.style.maxHeight = `${Math.round(p.height - 16)}px`;
    const dw = drawer.hidden ? 0 : drawer.getBoundingClientRect().width;
    const top = Math.round(p.top + 56);
    tabs.style.right = `${right + dw}px`; tabs.style.top = `${top}px`; tabs.style.maxHeight = '';
    tabs.classList.remove('flat', 'scroll');
    /* every tab keeps its name (the owner, 2026-11-09, a window with 8 tabs showed only signs: „die sollte bitte dann doch beschrieben
     * sein“): written upright beside the panel as chosen (picture 5); too many to fit: the name across under its sign (like the tool
     * bar on top); still too many: the tabs scroll */
    const over = () => tabs.getBoundingClientRect().bottom > innerHeight - 8;
    if (over()) tabs.classList.add('flat');
    if (over()) { tabs.classList.add('scroll'); tabs.style.maxHeight = `${Math.max(120, innerHeight - top - 8)}px`; }
  }
  addEventListener('resize', place);
  if (typeof ResizeObserver === 'function' && $('#panel')) new ResizeObserver(place).observe($('#panel'));

  /* ---- „⇉ Übernehmen“ ---- */
  /** the head's button: open / close the box for this object */
  function toggleCopy(sel) { copyFor = copyFor === sel.id ? null : sel.id; copyPicked = null; ctx.renderProps(); }
  /** every other thing of the same kind, with where it is: [{ it, fi, wall, room }] */
  function others(pk, src) {
    const out = [];
    (ctx.layout()?.floors || []).forEach((f, fi) => {
      if (pk === 'window' || pk === 'door') {
        for (const w of f.walls || []) for (const o of w.openings || []) if (sameKind(pk, src, o)) out.push({ it: o, fi, wall: w, f });
      } else if (pk === 'room') {
        for (const r of f.rooms || []) if (sameKind(pk, src, r)) out.push({ it: r, fi, f });
      } else if (pk === 'device') {
        for (const d of f.devices || []) if (sameKind(pk, src, d)) out.push({ it: d, fi, f });
      }
    });
    return out;
  }
  /** where the source is (its floor, its room) and the targets of every scope */
  function scopes(pk, it) {
    const all = others(pk, it), fi = ctx.floorIdx(), f = ctx.layout().floors[fi];
    let room = null;
    if (pk === 'window' || pk === 'door') room = f.rooms.find((r) => roomOpenings(r, f).some((o) => o.id === it.id)) || null;
    if (pk === 'device') room = f.rooms.find((r) => pointInPoly(it.x, it.z, r.points)) || null;
    const inRoom = (x) => {
      if (!room || x.fi !== fi) return false;
      if (x.wall) return roomOpenings(room, f).some((o) => o.id === x.it.id);
      return pointInPoly(x.it.x, x.it.z, room.points);
    };
    const out = [];
    if (room) out.push(['room', all.filter(inRoom), room.name]);
    out.push(['floor', all.filter((x) => x.fi === fi), f.name], ['house', all, '']);
    return out.filter(([, list]) => list.length);
  }
  function copyBox(head, pk, sel, it) {
    const box = el('div', 'v2CopyBox'); box.id = 'v2CopyBox';
    const sc = scopes(pk, it);
    box.append(el('h5', '', t('v2.copy.title')));
    if (!sc.length) { box.append(el('p', 'v2Hint', t('v2.copy.nobody'))); head.after(box); return; }
    if (!sc.some(([k]) => k === copyScope)) copyScope = sc.some(([k]) => k === 'floor') ? 'floor' : sc[0][0];
    if (!copyPicked) copyPicked = new Set(copyDefaults(pk));
    box.append(el('div', 'lbl', t('v2.copy.where')));
    for (const [k, list, name] of sc) {
      const b = btn(`v2Opt${k === copyScope ? ' on' : ''}`, null, () => { copyScope = k; ctx.renderProps(); });
      b.dataset.scope = k;
      b.append(el('span', 'rd', ''), el('span', '', t(`v2.copy.${pk}.${k}`, { name })), el('small', '', String(list.length)));
      box.append(b);
    }
    box.append(el('div', 'lbl', t('v2.copy.what')));
    for (const g of Object.keys(COPY_GROUPS[pk])) {
      const lab = el('label', 'v2Check'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = copyPicked.has(g); cb.dataset.group = g;
      cb.addEventListener('change', () => { if (cb.checked) copyPicked.add(g); else copyPicked.delete(g); go.disabled = !copyPicked.size; });
      lab.append(cb, el('span', '', t(GROUP_LABEL[pk][g])));
      box.append(lab);
    }
    const targets = sc.find(([k]) => k === copyScope)[1];
    const row = el('div', 'v2Row');
    const no = btn('v2Btn', t('v2.copy.cancel'), () => { copyFor = null; ctx.renderProps(); });
    const go = btn('v2Btn pri', t('v2.copy.go', { n: targets.length }), () => apply(pk, it, targets));
    go.id = 'v2CopyGo'; go.disabled = !copyPicked.size;
    row.append(no, go); box.append(row);
    head.after(box);
  }
  function apply(pk, src, targets) {
    const groups = [...copyPicked];
    if (!groups.length) return;
    ctx.snapshot();
    let done = 0, skipped = 0;
    for (const x of targets) {
      const before = JSON.parse(JSON.stringify(x.it));
      copyGroups(pk, src, x.it, groups);
      if (x.wall && (x.it.width !== before.width)) {                 // a wider window must still fit its wall
        const p = clampOpeningPos(x.wall, x.it.width, x.it.pos);
        if (p === null || openingOverlaps(x.wall, p, x.it.width, x.it.id)) { Object.keys(x.it).forEach((k) => delete x.it[k]); Object.assign(x.it, before); skipped++; continue; }
        x.it.pos = p;
      }
      done++;
    }
    copyFor = null;
    ctx.changed();
    ctx.renderProps();
    ctx.setStatus(skipped ? t('v2.copy.doneSkipped', { n: done, k: skipped }) : t('v2.copy.done', { n: done }));
  }

  return { decorate, reset, toggleCopy, copyOpen: (id) => copyFor === id };
}
