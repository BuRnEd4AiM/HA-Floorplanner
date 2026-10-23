/* Own versions of a page per user (#507, the owner's wish of 2026-10-23; the rules are in pagevariants.js, tested; pictures in
 * docs/ideen-4.18/). In the edit mode of a page a strip under the edit strip: a chip per version ("👪 Für alle" and the own ones, a tap
 * edits that one), "＋ Neue Fassung", who sees the version chosen, "⚙ Einstellen" (name, icon, who gets it, delete), "👁 Ansehen als …"
 * (the screen as a user sees it: his versions and his tabs; a bar at the top ends it) and "👥 Wer sieht was" (users × pages: a version,
 * "Für alle" or "aus"; also in ⚙ → 👥 Benutzer, #pvTableBtn). The board (pageboard.js) asks shown(page, edit) which version to draw. */
import { ALL, OFF, MAX_VARIANTS, variantsOf, pickedVariant, entryOf, cellOf, layoutIn, emptyStart, addVariant, renameVariant, dropVariant,
  setPick, withUsers, usersOf, knownUsers, newVariantId } from './pagevariants.js';
import { barTabs, cleanUserTabs, HOME, TAB_LOCK } from './tabs.js';
import { cleanLocks } from './userlocks.js';

export const ICONS = ['👪', '🧒', '📟', '👴', '🛏️', '🏠', '⭐', '🎮', '🧑‍💼', '👵', '🐶', '🌙', '🔧', '🛋️', '🚪', '📱'];

/** ctx: t, $, settings(), save(), me() (api/me), canEdit(), pageName(page), board() (pageboard.js: setEditing(page), keys(page)),
 *  open() (the open tab), redraw(page) (the page draws itself again), changed() (the tab bar again), refill() (the settings dialog shows
 *  the settings again: else it writes its old rows back) */
export function initVariantsUi(ctx) {
  const { t } = ctx;
  const edit = new Map();                 // page -> the version edited in its edit mode
  let asUser = '', haUsers = null, dlg = null, asBar = null;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, fn, act) => { const b = make('button', cls, text); b.type = 'button'; if (act) b.dataset.act = act; b.addEventListener('click', (e) => { e.stopPropagation(); fn(e); }); return b; };
  const S = () => ctx.settings();
  const users = () => knownUsers(haUsers || [], S());
  /** a user's name as Home Assistant shows it (its user name when that is all there is) */
  const label = (u) => haUsers?.find((x) => String(x?.username || '').toLowerCase() === u.toLowerCase())?.name || u;
  async function loadUsers() {
    if (haUsers) return;
    try { const r = await fetch('api/users'); haUsers = r.ok ? await r.json() : []; } catch { haUsers = []; }
    if (!Array.isArray(haUsers)) haUsers = [];
  }
  const locksOf = (user) => { const l = S().userLocks || {}, k = Object.keys(l).find((x) => x.trim().toLowerCase() === user.trim().toLowerCase()); return cleanLocks(k ? l[k] : []); };
  const nameOf = (page, id) => (id === ALL ? t('pv.all') : variantsOf(S(), page).find((v) => v.id === id)?.name || '?');
  const redrawOpen = () => { ctx.changed(); const o = ctx.open(); if (o && o !== HOME) ctx.redraw(o); };

  /* ---- which version: who is looking (or "Ansehen als"), the one edited ---- */
  const entry = () => (asUser ? entryOf(S().userTabs, asUser) : ctx.me()?.tabs) || null;
  const seen = (page) => pickedVariant(S(), entry(), page);
  function editing(page) {
    const id = edit.get(page);
    return id === ALL || (id && variantsOf(S(), page).some((v) => v.id === id)) ? id : seen(page);
  }
  const shown = (page, inEdit) => (inEdit ? editing(page) : seen(page));

  /* ---- the strip in the edit mode ---- */
  function bar(page) {
    const s = S(), list = variantsOf(s, page), cur = editing(page);
    const el = make('div', 'pvBar');
    el.append(make('b', 'pvLbl', `🗂 ${t('pv.title')}`));
    const chip = (id, icon, name, sub) => {
      const b = btn(`pvChip${id === cur ? ' on' : ''}`, `${icon} ${name}`, () => { edit.set(page, id); ctx.redraw(page); });
      b.dataset.variant = id || 'all';
      if (sub) b.append(make('small', '', ` ${sub}`));
      return b;
    };
    el.append(chip(ALL, '👪', t('pv.all'), t('pv.allSub')));
    list.forEach((v) => el.append(chip(v.id, v.icon, v.name)));
    if (list.length < MAX_VARIANTS) el.append(btn('pvChip add', `＋ ${t('pv.new')}`, () => form(page, null), 'newVariant'));
    const who = make('span', 'pvWho'), names = usersOf(s, users(), page, cur);
    who.append(make('span', '', t('pv.seenBy')));
    names.slice(0, 5).forEach((n) => who.append(make('b', 'pvUser', label(n))));
    if (names.length > 5) who.append(make('span', '', `+${names.length - 5}`));
    if (cur === ALL) who.append(make('span', '', names.length ? t('pv.andOthers') : t('pv.everybody')));
    else if (!names.length) who.append(make('i', '', t('pv.nobody')));
    if (cur !== ALL) who.append(btn('bdBtn', `⚙ ${t('pv.set')}`, () => form(page, cur), 'variantSet'));
    who.append(btn('bdBtn', `👁 ${t('pv.viewAs')}`, () => pickUser(), 'viewAs'), btn('bdBtn', `👥 ${t('pv.table')}`, () => table(), 'whoSees'));
    el.append(who);
    if (!haUsers) loadUsers().then(() => { if (el.isConnected && users().length) ctx.redraw(page); });
    return el;
  }

  function open(wide = false) {
    if (!dlg) { dlg = make('dialog', 'ceDlg pvDlg'); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); document.body.append(dlg); }
    dlg.classList.toggle('wide', !!wide);
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  const head = (title, sub) => { const h = make('div', 'ceHead'); h.append(make('h3', '', title), make('p', 'tpSub', sub)); return h; };
  const saved = () => { ctx.save(); ctx.refill(); };

  /* ---- "＋ Neue Fassung" and "⚙ Einstellen": name, icon, (what it starts with), who gets it, delete ---- */
  async function form(page, id) {
    await loadUsers();
    const d = open(), s = S(), v = id ? variantsOf(s, page).find((x) => x.id === id) : null, list = variantsOf(s, page), us = users();
    const f = make('div', 'ceForm pvForm');
    const field = (label, ...nodes) => { const x = make('div', 'ceField'); x.append(make('label', '', label), ...nodes); f.append(x); return x; };
    const name = make('input', 'ceInput'); name.maxLength = 30; name.value = v?.name || ''; name.placeholder = t('pv.namePh'); name.dataset.role = 'name';
    field(t('pv.name'), name);
    let icon = v?.icon || ICONS[1];
    const grid = make('div', 'teIcons');
    const mark = () => grid.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === icon));
    ICONS.forEach((i) => grid.append(btn('', i, () => { icon = i; mark(); })));
    mark();
    field(t('pv.icon'), grid);
    let start = ALL;
    if (!v) {
      const seg = make('div', 'ceSeg');
      [[ALL, t('pv.copyOf', { name: t('pv.all') })], ...list.map((x) => [x.id, t('pv.copyOf', { name: x.name })]), ['empty', t('pv.empty')]].forEach(([k, label]) => {
        const b = btn(k === start ? 'on' : '', label, () => { start = k; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); });
        b.dataset.start = k || 'all'; seg.append(b);
      });
      field(t('pv.start'), seg);
    }
    const box = make('div', 'pvUsers');
    us.forEach((u) => {
      const cell = cellOf(s, entryOf(s.userTabs, u), page);
      const lab = make('label', `pvUserRow${v && cell === v.id ? ' on' : ''}`);
      const cb = make('input'); cb.type = 'checkbox'; cb.dataset.user = u; cb.checked = !!v && cell === v.id;
      cb.addEventListener('change', () => lab.classList.toggle('on', cb.checked));
      const now = cell === OFF ? t('pv.hasOff') : v && cell === v.id ? '' : t('pv.has', { name: nameOf(page, cell) });
      lab.append(cb, make('b', '', label(u)), make('small', '', now));
      box.append(lab);
    });
    if (!us.length) box.append(make('p', 'hint', t('pv.noUsers')));
    field(t('pv.who'), box).append(make('p', 'hint', t('pv.hint')));
    const chosen = () => [...box.querySelectorAll('[data-user]:checked')].map((x) => x.dataset.user);
    const ok = btn('bdBtn primary', `✓ ${v ? t('ce.save') : t('pv.create')}`, () => {
      const n = name.value.trim();
      if (!n) { name.focus(); return; }
      let vid = id;
      if (v) Object.assign(s, renameVariant(s, page, id, { name: n, icon }));
      else {
        vid = newVariantId(Object.values(s.pageVariants || {}).flat().map((x) => x.id));
        const add = addVariant(s, page, { id: vid, name: n, icon }, start === 'empty' ? emptyStart(ctx.board().keys(page)) : layoutIn(s, page, start));
        if (!add) return;
        Object.assign(s, add);
        edit.set(page, vid);                                       // "Anlegen und bearbeiten": the new one is edited now
      }
      s.userTabs = withUsers(s, us, page, vid, chosen());
      saved(); d.close(); ctx.redraw(page);
    }, v ? 'variantSave' : 'variantCreate');
    const btns = make('div', 'ceBtns');
    if (v) {
      btns.append(btn('bdBtn danger', `🗑 ${t('pv.delete')}`, () => {
        if (!window.confirm(t('pv.deleteAsk', { name: v.name }))) return;
        Object.assign(s, dropVariant(s, page, id));
        edit.set(page, ALL);
        saved(); d.close(); ctx.redraw(page);
      }, 'variantDelete'));
    }
    btns.append(btn('bdBtn', t('ce.cancel'), () => d.close()), ok);
    d.replaceChildren(head(v ? `${v.icon} ${v.name}` : `🗂 ${t('pv.newTitle', { page: ctx.pageName(page) })}`, t('pv.newSub')), f, btns);
    if (!v) name.focus();
  }

  /* ---- "👁 Ansehen als …": the screen as a user sees it (his versions, his tabs) until "Zurück" ---- */
  async function pickUser() {
    await loadUsers();
    const d = open(), list = make('div', 'pvPick'), us = users();
    us.forEach((u) => { const b = btn('bdBtn', `👤 ${label(u)}`, () => { d.close(); viewAs(u); }); b.dataset.user = u; list.append(b); });
    if (!us.length) list.append(make('p', 'hint', t('pv.noUsers')));
    const btns = make('div', 'ceBtns'); btns.append(btn('bdBtn', t('ce.cancel'), () => d.close()));
    d.replaceChildren(head(`👁 ${t('pv.viewAs')}`, t('pv.viewAsSub')), list, btns);
  }
  function viewAs(user) {
    asUser = String(user || '').trim();
    ctx.board().setEditing(null);
    asBar?.remove(); asBar = null;
    if (asUser) {
      asBar = make('div', 'pvAs'); asBar.id = 'pvAsBar';
      asBar.append(make('span', '', '👁'), make('b', '', t('pv.asBar', { user: label(asUser) })), btn('bdBtn', `✕ ${t('pv.back')}`, () => viewAs(''), 'viewAsEnd'));
      document.body.append(asBar);
    }
    redrawOpen();
  }

  /* ---- "👥 Wer sieht was": users × pages ---- */
  async function table() {
    await loadUsers();
    const d = open(true), s = S(), us = users(), pages = barTabs(s.customTabs, s.tabOrder).filter((x) => x.key !== HOME);
    let tabs = cleanUserTabs(s.userTabs);
    const wrap = make('div', 'pvTableWrap'), tbl = make('table', 'pvTable'), hr = make('tr');
    hr.append(make('th', '', t('pv.user')), ...pages.map((x) => make('th', '', `${x.icon} ${x.name || t(`tab.${x.key}`)}`)));
    tbl.append(hr);
    us.forEach((u) => {
      const tr = make('tr'), name = make('td', '', label(u));
      if (label(u) !== u) name.title = u;
      tr.append(name);
      const locks = locksOf(u);
      pages.forEach((x) => {
        const td = make('td');
        if (TAB_LOCK[x.key] && locks.includes(TAB_LOCK[x.key])) { const l = make('span', 'pvLocked', '🔒'); l.title = t('pv.locked'); td.append(l); tr.append(td); return; }
        const sel = make('select', 'pvSel'); sel.dataset.user = u; sel.dataset.page = x.key;
        sel.add(new Option(t('pv.all'), ALL));
        variantsOf(s, x.key).forEach((v) => sel.add(new Option(`${v.icon} ${v.name}`, v.id)));
        sel.add(new Option(t('pv.off'), OFF));
        const paint = () => { sel.classList.toggle('v', sel.value !== ALL && sel.value !== OFF); sel.classList.toggle('off', sel.value === OFF); };
        sel.value = cellOf({ ...s, userTabs: tabs }, entryOf(tabs, u), x.key);
        paint();
        sel.addEventListener('change', () => { tabs = setPick(tabs, u, x.key, sel.value); paint(); });
        td.append(sel); tr.append(td);
      });
      tbl.append(tr);
    });
    wrap.append(tbl);
    const legend = make('p', 'hint', us.length ? t('pv.legend') : t('pv.noUsers'));
    const ok = btn('bdBtn primary', `✓ ${t('ce.save')}`, () => { s.userTabs = tabs; saved(); d.close(); redrawOpen(); }, 'whoSave');
    const btns = make('div', 'ceBtns'); btns.append(btn('bdBtn', t('pv.close'), () => d.close()), ok);
    d.replaceChildren(head(`👥 ${t('pv.table')}`, t('pv.tableSub')), wrap, legend, btns);
  }
  ctx.$('#pvTableBtn')?.addEventListener('click', () => table());

  return {
    shown, bar, table, viewAs,
    done: (page) => edit.delete(page),
    viewing: () => asUser,
    /** api/me as the tab bar sees it: while "Ansehen als" runs, the tabs and the locks of that user */
    me: (me) => (asUser ? { ...me, tabs: entryOf(S().userTabs, asUser) || {}, locks: locksOf(asUser) } : me),
  };
}
