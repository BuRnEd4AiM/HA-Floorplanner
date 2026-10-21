/* Own pages and the order of the tab bar (#484): in the edit mode of a page "🗂 Reiter" turns the bar itself into an editor: the tabs
 * are dragged sideways into their order, "＋ Seite" makes an own page (name, icon, start with an empty page, the devices of an area or
 * the cards of ☀ Heute, its place in the bar), a tap on an own page changes its name and icon or deletes it. Stored for everybody in
 * settings.customTabs and settings.tabOrder (tabs.js, tested), the cards of an own page in settings.pageLayouts. */
import { barTabs, cleanCustomTabs, cleanTabOrder, newTabId, HOME } from './tabs.js';
import { suggestCards, BUILTINS, cleanCard } from './cards.js';
import { newCardId } from './pagelayout.js';

export const ICONS = ['🌱', '🏊', '🚗', '🐶', '🎮', '🛏️', '🍳', '🧒', '🏡', '🔧', '🌤️', '🔒', '🎄', '🎉', '📚', '💼', '🧘', '🐔', '🚲', '⭐'];

/** ctx: t, $, settings(), save(), areas() ([{ id, name, entities }]), states(), tabs() (the tabs of the bar now: [{ key, icon, name }]),
 *  tabName(key), changed() (the bar draws again), show(tab), board (pageboard.js) */
export function initTabEdit(ctx) {
  const { t, $ } = ctx;
  const bar = $('#tabBar'), help = $('#tabEditBar');
  let on = false, dlg = null;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, fn) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const custom = () => cleanCustomTabs(ctx.settings().customTabs);

  function setOn(v) {
    on = !!v;
    document.body.classList.toggle('tabEditing', on);
    help.hidden = !on;
    if (on) {
      help.replaceChildren(make('b', '', `🗂 ${t('te.title')}`), make('span', 'bdSub', t('te.help')),
        Object.assign(btn('bdBtn', `＋ ${t('te.newShort')}`, () => newPage()), { title: t('te.new') }), btn('bdBtn primary', `✓ ${t('bd.done')}`, () => setOn(false)));
    }
    ctx.changed();
  }

  /* ---- dragging a tab sideways; a tap on an own page opens its window ---- */
  bar.addEventListener('pointerdown', (e) => {
    if (!on) return;
    const tab = e.target.closest('[data-tab]');
    if (!tab || tab.dataset.tab === HOME) return;
    e.preventDefault();
    const x0 = e.clientX, left0 = tab.offsetLeft;
    let moved = false;
    tab.setPointerCapture?.(e.pointerId);
    const move = (ev) => {
      if (Math.abs(ev.clientX - x0) > 6) moved = true;
      if (!moved) return;
      tab.classList.add('teDragging');
      tab.style.transform = `translateX(${ev.clientX - x0 - (tab.offsetLeft - left0)}px)`;
      tab.style.pointerEvents = 'none';
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#tabBar [data-tab]');
      tab.style.pointerEvents = '';
      if (!over || over === tab || over.dataset.tab === HOME) return;
      const r = over.getBoundingClientRect();
      if (ev.clientX > r.left + r.width / 2) over.after(tab); else over.before(tab);
      tab.style.transform = `translateX(${ev.clientX - x0 - (tab.offsetLeft - left0)}px)`;
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      tab.style.transform = ''; tab.classList.remove('teDragging');
      if (moved) {
        ctx.settings().tabOrder = cleanTabOrder([...bar.querySelectorAll('[data-tab]')].map((b) => b.dataset.tab));
        ctx.save(); ctx.changed();
      } else if (/^p_/.test(tab.dataset.tab)) ownPage(tab.dataset.tab);
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });

  function open() {
    if (!dlg) { dlg = make('dialog', 'ceDlg teDlg'); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); document.body.append(dlg); }
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  function form(page) {
    const f = make('div', 'ceForm');
    const field = (label, ...nodes) => { const x = make('div', 'ceField'); x.append(make('label', '', label), ...nodes); f.append(x); return x; };
    const name = make('input', 'ceInput'); name.maxLength = 30; name.value = page?.name || ''; name.placeholder = t('te.namePh'); name.dataset.role = 'name';
    field(t('te.name'), name);
    let icon = page?.icon || ICONS[0];
    const grid = make('div', 'teIcons');
    const mark = () => grid.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === icon));
    ICONS.forEach((i) => grid.append(btn('', i, () => { icon = i; mark(); })));
    mark();
    field(t('te.icon'), grid);
    return { f, field, name, icon: () => icon };
  }
  /** "＋ Seite": a new own page */
  function newPage() {
    const d = open(), { f, field, name, icon } = form(null);
    let start = 'empty';
    const area = make('select', 'ceSelect'); area.dataset.role = 'area';
    const areas = ctx.areas().filter((a) => a.entities?.length);
    areas.forEach((a) => area.add(new Option(a.name || a.id, a.id)));
    area.hidden = true;
    const seg = make('div', 'ceSeg');
    [['empty', t('te.start.empty')], ['area', t('te.start.area')], ['today', t('te.start.today')]].forEach(([k, label]) => {
      if (k === 'area' && !areas.length) return;
      const b = btn(k === start ? 'on' : '', label, () => { start = k; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); area.hidden = k !== 'area'; });
      b.dataset.start = k; seg.append(b);
    });
    field(t('te.start'), seg, area);
    const after = make('select', 'ceSelect'); after.dataset.role = 'after';
    const tabs = ctx.tabs();
    tabs.forEach((x) => after.add(new Option(t('te.after', { tab: x.name || ctx.tabName(x.key) }), x.key)));
    after.value = tabs[tabs.length - 1]?.key || HOME;
    field(t('te.place'), after);
    const ok = btn('bdBtn primary', `✓ ${t('te.create')}`, () => {
      const n = name.value.trim();
      if (!n) { name.focus(); return; }
      const s = ctx.settings(), list = custom(), id = newTabId(list.map((x) => x.id));
      s.customTabs = cleanCustomTabs([...list, { id, name: n, icon: icon() }]);
      const keys = tabs.map((x) => x.key).filter((k) => k !== HOME), at = keys.indexOf(after.value);
      keys.splice(at < 0 ? keys.length : at + 1, 0, id);
      s.tabOrder = cleanTabOrder(keys);
      const taken = [], mkId = (tk) => { const x = newCardId([...taken, ...tk]); taken.push(x); return x; };
      let cards = [];
      if (start === 'area') cards = suggestCards(areas.find((a) => a.id === area.value)?.entities || [], ctx.states(), mkId);
      if (start === 'today') cards = BUILTINS.map((b) => cleanCard({ id: mkId([]), type: 'builtin', builtin: b, width: 1 })).filter(Boolean);
      if (cards.length) s.pageLayouts = { ...(s.pageLayouts || {}), [id]: { order: [], hidden: [], cards } };
      ctx.save(); d.close(); setOn(false);
      ctx.changed(); ctx.show(id); ctx.board.setEditing(id);
    });
    ok.dataset.act = 'create';
    const bar2 = make('div', 'ceBtns'); bar2.append(btn('bdBtn', t('ce.cancel'), () => d.close()), ok);
    const head = make('div', 'ceHead'); head.append(make('h3', '', `＋ ${t('te.new')}`), make('p', 'tpSub', t('te.newSub')));
    d.replaceChildren(head, f, bar2);
    name.focus();
  }
  /** an own page: its name and icon, or away with it */
  function ownPage(id) {
    const page = custom().find((x) => x.id === id);
    if (!page) return;
    const d = open(), { f, name, icon } = form(page);
    const save = btn('bdBtn primary', `✓ ${t('ce.save')}`, () => {
      const n = name.value.trim();
      if (!n) { name.focus(); return; }
      ctx.settings().customTabs = custom().map((x) => (x.id === id ? { ...x, name: n, icon: icon() } : x));
      ctx.save(); d.close(); ctx.changed();
    });
    const del = btn('bdBtn danger', `🗑 ${t('te.delete')}`, () => {
      if (!window.confirm(t('te.deleteAsk', { name: page.name }))) return;
      const s = ctx.settings();
      s.customTabs = custom().filter((x) => x.id !== id);
      s.tabOrder = cleanTabOrder(s.tabOrder).filter((k) => k !== id);
      const lay = { ...(s.pageLayouts || {}) }; delete lay[id]; s.pageLayouts = lay;
      if (ctx.board.editing() === id) ctx.board.setEditing(null);
      ctx.save(); d.close(); ctx.changed(); ctx.show(HOME);
    });
    del.dataset.act = 'delete';
    const bar2 = make('div', 'ceBtns'); bar2.append(del, btn('bdBtn', t('ce.cancel'), () => d.close()), save);
    const head = make('div', 'ceHead'); head.append(make('h3', '', `${page.icon} ${page.name}`), make('p', 'tpSub', t('te.ownSub')));
    d.replaceChildren(head, f, bar2);
  }
  return { on: () => on, start: () => setOn(true), stop: () => setOn(false), newPage, ownPage };
}

/** the bar's tabs as tabsui draws them (for ctx.tabs()): the house and the others in their order */
export const tabsOf = (settings) => barTabs(settings.customTabs, settings.tabOrder);
