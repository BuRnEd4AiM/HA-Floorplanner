/* Light groups (#471): the button "💡 n an" at the top (only while lights are on), its list (the whole house and the groups, each with
 * "Off", a first tap asks "Sure?") and the group editor in ⚙ → "Quick access" (a name and the rooms of the plan, by floor). The rules
 * live in lightgroups.js (tested). The list is registered as one of the drop-downs of the top bar in app.js (only one open at a time). */
import { cleanGroups, lightRows, lightsOn, confirmTap, roomChoices, newGroupId, HOUSE, CONFIRM_MS } from './lightgroups.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** ctx: $, t, layout() (the building shown), plan() (the whole plan: the rooms the editor offers), settings(), placed(f), areaEntities(room),
 *  isOn(entity), occupied(room, f), callService(entity, service), canEdit(), openSettings() (⚙ at "Quick access"), setStatus(txt), commit()
 *  (save the settings after a group was added or deleted), isOpen() (the list is open: app.js toggleMenu), close() */
export function initLightGroups(ctx) {
  const { $, t } = ctx;
  const pill = $('#lightsPill'), menu = $('#lightsMenu');
  let armed = null, timer = 0, sig = '';
  const groups = () => cleanGroups(ctx.settings().lightGroups, (i) => t('lg.groupN', { n: i }));
  /** the rows; who is in the rooms (👤) only for the open list, it costs a little at every state update */
  const rows = (who = true) => lightRows({ floors: ctx.layout().floors, groups: groups(), placed: ctx.placed, areaEntities: ctx.areaEntities, isOn: ctx.isOn,
    occupied: who ? ctx.occupied : undefined });

  /** the list (drawn anew only when something in it changed, so "Sure?" stays under the finger) */
  function render(list = rows()) {
    const now = Date.now(), live = armed && now - armed.at <= CONFIRM_MS ? armed.id : null;
    const key = JSON.stringify([list.map((r) => [r.id, r.name, r.on.length, r.lights.length, r.occupied]), live, ctx.canEdit(), t('lg.title')]);
    if (key === sig && menu.firstChild) return;
    sig = key;
    menu.replaceChildren(el('div', 'lgHead', t('lg.title')));
    list.forEach((r) => {
      const row = el('div', 'lgRow' + (r.id === HOUSE ? ' house' : '') + (r.on.length ? ' lit' : ''));
      row.dataset.id = r.id;
      const name = el('span', 'lgName', r.id === HOUSE ? `🏠 ${t('lg.house')}` : r.name);
      if (r.occupied) name.append(el('i', 'lgWho', ' 👤'));
      if (r.occupied) name.title = t('lg.occupied');
      const n = el('span', 'lgOn', r.on.length ? t('lg.on', { n: r.on.length }) : r.lights.length ? t('lg.allOff') : t('lg.none'));
      row.append(name, n);
      if (r.on.length) {
        const off = el('button', 'lgOff' + (live === r.id ? ' armed' : ''), live === r.id ? t('lg.sure') : t('lg.off'));
        off.type = 'button';
        off.title = live === r.id ? t('lg.sureTip', { n: r.on.length }) : t('lg.offTip');
        off.addEventListener('click', (e) => { e.stopPropagation(); tapOff(r.id); });
        row.append(off);
      }
      menu.append(row);
    });
    if (ctx.canEdit()) {
      if (list.length < 2) menu.append(el('p', 'sub lgHint', t('lg.hint')));
      const set = el('button', 'lgSetup', t('lg.setup'));
      set.type = 'button';
      set.addEventListener('click', () => { ctx.close(); ctx.openSettings(); });
      menu.append(set);
    }
  }
  /** "Off": the first tap asks, the second (within CONFIRM_MS) switches every light of the row that is on */
  function tapOff(id) {
    const r = rows(false).find((x) => x.id === id);
    if (!r) return;
    const step = confirmTap(armed, id, Date.now());
    armed = step.armed;
    clearTimeout(timer);
    if (step.fire) {
      r.on.forEach((e) => ctx.callService(e, 'turn_off'));
      ctx.setStatus(t('lg.done', { n: r.on.length, g: id === HOUSE ? t('lg.house') : r.name }));
    } else timer = setTimeout(() => { armed = null; sig = ''; if (ctx.isOpen()) render(); }, CONFIRM_MS + 50);
    sig = ''; render();
  }
  /** after every state update: the button, and the list while it is open */
  function update() {
    const open = ctx.isOpen(), list = rows(open), n = lightsOn(list);
    pill.hidden = !n && !open;
    pill.textContent = t('lg.pill', { n });
    pill.title = t('lg.tip');
    pill.classList.toggle('lit', n > 0);
    if (open) render(list);
  }
  /** the list was opened (app.js toggleMenu) */
  function opened() { armed = null; sig = ''; render(); }

  /* ---- the editor in ⚙ → "Quick access" ---- */
  const box = $('#lgGroups');
  let edited = '';
  function groupBox(g, choices) {
    const wrap = el('div', 'lgEdit');
    wrap.dataset.id = g.id;
    const offered = new Set(choices.flatMap((c) => c.rooms.map((r) => r.id)));
    wrap.dataset.keep = JSON.stringify(g.rooms.filter((id) => !offered.has(id)));   // rooms of another house: kept as they are
    const head = el('div', 'lgEditHead');
    const name = el('input');
    name.type = 'text'; name.maxLength = 40; name.value = g.name; name.dataset.role = 'name'; name.placeholder = t('lg.namePh');
    name.setAttribute('aria-label', t('lg.name'));
    const del = el('button', 'lgDel', '×');
    del.type = 'button'; del.title = t('lg.delete');
    del.addEventListener('click', () => { wrap.remove(); ctx.commit(); });
    head.append(name, del);
    wrap.append(head);
    const have = new Set(g.rooms);
    choices.forEach((c) => {
      const fl = el('div', 'lgFloor');
      fl.append(el('small', '', c.floor));
      c.rooms.forEach((r) => {
        const lab = el('label', 'lgRoom'), cb = el('input');
        cb.type = 'checkbox'; cb.dataset.room = r.id; cb.checked = have.has(r.id);
        lab.append(cb, document.createTextNode(` ${r.name}`));
        fl.append(lab);
      });
      wrap.append(fl);
    });
    if (!choices.length) wrap.append(el('p', 'sub', t('lg.noRooms')));
    return wrap;
  }
  /** fill: the groups as stored (drawn anew only when they or the rooms changed: a box being typed in stays) */
  function fill(settings) {
    const choices = roomChoices(ctx.plan().floors, t('lg.unnamed'));
    const list = cleanGroups(settings.lightGroups, (i) => t('lg.groupN', { n: i }));
    const key = JSON.stringify([list, choices]);
    if (key === edited && box.childElementCount === list.length) return;
    edited = key;
    box.replaceChildren(...list.map((g) => groupBox(g, choices)));
  }
  /** read: the groups as the editor has them */
  function read(next) {
    next.lightGroups = [...box.querySelectorAll('.lgEdit')].map((w) => {
      let keep = [];
      try { keep = JSON.parse(w.dataset.keep || '[]'); } catch { keep = []; }
      return { id: w.dataset.id, name: w.querySelector('[data-role=name]').value.trim(),
        rooms: [...keep, ...[...w.querySelectorAll('[data-room]:checked')].map((c) => c.dataset.room)] };
    });
    next.lightGroups = cleanGroups(next.lightGroups, (i) => t('lg.groupN', { n: i }));
  }
  $('#lgAdd').addEventListener('click', () => {
    const list = groups();
    const g = { id: newGroupId([...list, ...[...box.querySelectorAll('.lgEdit')].map((w) => ({ id: w.dataset.id }))]), name: t('lg.groupN', { n: box.childElementCount + 1 }), rooms: [] };
    box.append(groupBox(g, roomChoices(ctx.plan().floors, t('lg.unnamed'))));
    ctx.commit();
    [...box.querySelectorAll('.lgEdit')].find((w) => w.dataset.id === g.id)?.querySelector('input')?.select();   // saving may have drawn the boxes anew
  });
  return { update, render: opened, fill, read };
}
