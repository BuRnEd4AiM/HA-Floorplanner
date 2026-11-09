/* The part of "Karte einstellen" for the card "Lichtsteuerung" (#597): the bars (⠿ symbol name ✕, below them their lamps), a search for
 * lamps, groups and switches, "Alle aus", groups to open, in the grid or as a window (and then from "💡 n Lichter an"). A bar can hold
 * several lamps (the owner's wish: "pro Kachel einfach mehrere Lampen verknüpfen"): "＋ Lampe dazu" under a bar opens a search just for it,
 * each lamp of a bar has its ✕. The rules are in lightslider.js (tested); lightcardui.js draws the card. */
import { rowLamps, rowKey, membersOf, cleanRows, fitsRow, MAX_ROWS, MAX_LAMPS } from './lightslider.js';
import { BTN_ICONS } from './buttonlook.js';
import { sortable } from './dragsort.js';

const ICONS = [...new Set(['💡', '🛋', '🛏', '🍳', '🚪', '🛁', '📺', '🖥', '🌙', '✨', '🔆', '🏮', '🕯', '🌳', '⏻', ...BTN_ICONS])];
const SHOW = 40;
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** ctx: t, states(), nameOf(entity), entities() ([{ entity_id, name }]); draft: the card being set; ui: { field(label, ...nodes), preview() } */
export function lightCardFields(ctx, draft, ui) {
  const { t } = ctx;
  const st = (e) => ctx.states()[e];
  const groupOf = (e) => membersOf(e, st(e)).length;
  const symbol = (e) => (e.startsWith('switch.') ? '⏻' : groupOf(e) ? '💡💡' : '💡');
  draft.rows = cleanRows(draft.rows);
  let adding = null, findText = '';                 // the bar (rowKey) whose own search is open, what is typed in it
  /** the lamps, groups and switches that match `query`, without `skip`: buttons that call pick(entity) */
  function results(query, skip, pick, full) {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const all = ctx.entities().filter((e) => fitsRow(e.entity_id) && !skip.has(e.entity_id))
      .filter((e) => words.every((w) => `${e.name || ''} ${e.entity_id}`.toLowerCase().includes(w)))
      .sort((a, b) => Number(groupOf(b.entity_id) > 0) - Number(groupOf(a.entity_id) > 0) || (a.name || a.entity_id).localeCompare(b.name || b.entity_id));
    const out = all.slice(0, SHOW).map((e) => {
      const n = groupOf(e.entity_id);
      const b = make('button', 'ceItem'); b.type = 'button'; b.dataset.entity = e.entity_id; b.disabled = full;
      b.append(make('span', 'ceTick', '＋'), make('span', 'ceName', `${symbol(e.entity_id)} ${e.name || e.entity_id}`),
        make('small', '', n ? `${t('lc.group', { n })} · ${e.entity_id}` : e.entity_id));
      b.addEventListener('click', () => pick(e.entity_id));
      return b;
    });
    return out.length ? out : [make('p', 'tpSub', t('ce.none'))];
  }
  /** a bar changed: its new lamps (lampsTo), name or symbol */
  function change(key, next) {
    draft.rows = cleanRows(draft.rows.map((x) => (rowKey(x) === key ? { ...x, ...next } : x)));
  }
  const lampsTo = (lamps) => ({ e: lamps[0], more: lamps.slice(1) });

  const rows = make('div', 'sbRows lcEdRows');
  const draw = () => {
    rows.replaceChildren(...draft.rows.map((r) => {
      const key = rowKey(r), lamps = rowLamps(r), el = make('div', 'sbRow'); el.dataset.key = key;
      const grip = make('span', 'dsGrip', '⠿'); grip.title = t('bd.drag');
      const icon = make('select', 'sbIconSel'); icon.setAttribute('aria-label', t('ob.icon'));
      icon.append(new Option(`${lamps.every((x) => x.startsWith('switch.')) ? '⏻' : '💡'} ${t('ob.iconAuto')}`, ''), ...[...new Set([...(r.icon && !ICONS.includes(r.icon) ? [r.icon] : []), ...ICONS])].map((x) => new Option(x, x)));
      icon.value = r.icon;
      icon.addEventListener('change', () => { change(key, { icon: icon.value }); ui.preview(); });
      const name = make('input', 'ceInput sbNameIn'); name.value = r.name; name.maxLength = 30; name.placeholder = `${ctx.nameOf(r.e) || r.e}${lamps.length > 1 ? ` +${lamps.length - 1}` : ''}`;
      name.setAttribute('aria-label', t('ce.name'));
      name.addEventListener('input', () => { change(key, { name: name.value }); ui.preview(); });
      const del = make('button', 'sbDel', '✕'); del.type = 'button'; del.title = t('sb.remove'); del.setAttribute('aria-label', del.title);
      del.addEventListener('click', () => { draft.rows = draft.rows.filter((x) => rowKey(x) !== key); if (adding === key) adding = null; draw(); found(); ui.preview(); });
      el.append(grip, icon, name, del);
      const plus = make('button', `lcLampAdd${adding === key ? ' on' : ''}`, `＋ ${t('lc.addLamp')}`); plus.type = 'button'; plus.dataset.act = 'lcLampAdd';
      plus.title = t('lc.addLampHint'); plus.disabled = lamps.length >= MAX_LAMPS; plus.setAttribute('aria-expanded', String(adding === key));
      plus.addEventListener('click', () => {
        adding = adding === key ? null : key; findText = ''; draw();
        if (adding && matchMedia('(pointer: fine)').matches) rows.querySelector('.lcLampFind .ceSearch')?.focus();   // no keyboard popping up on a tablet
      });
      if (lamps.length > 1) {                        // the lamps of the bar, each with its ✕, then "＋ Lampe dazu"
        const list = make('div', 'lcLamps');
        list.append(...lamps.map((x) => {
          const chip = make('span', 'lcLamp'); chip.dataset.entity = x; chip.title = x;
          const out = make('button', 'lcLampDel', '✕'); out.type = 'button'; out.title = t('lc.lampOut', { name: ctx.nameOf(x) || x }); out.setAttribute('aria-label', out.title);
          out.addEventListener('click', () => {
            const next = lampsTo(lamps.filter((y) => y !== x));
            if (adding === key) adding = rowKey(next);
            change(key, next); draw(); found(); ui.preview();
          });
          chip.append(make('span', '', `${symbol(x)} ${ctx.nameOf(x) || x}`), out);
          return chip;
        }), plus);
        el.append(list);
      } else {                                       // one lamp: its id and "＋ Lampe dazu" on one line
        const n = groupOf(r.e), foot = make('div', 'lcEdFoot');
        if (n) el.append(make('small', 'lcGroupTag', `▸ ${t('lc.group', { n })}`));
        foot.append(make('small', 'sbId', r.e), plus);
        el.append(foot);
      }
      if (adding === key) {                          // the search just for this bar
        const box = make('div', 'lcLampFind');
        const q = make('input', 'ceSearch'); q.type = 'search'; q.value = findText; q.placeholder = t('lc.findLamp', { name: r.name || ctx.nameOf(r.e) || r.e });
        q.setAttribute('aria-label', q.placeholder);
        const hits = make('div', 'ceList');
        const done = make('button', 'lcLampDone', t('bd.done')); done.type = 'button'; done.dataset.act = 'lcLampDone';
        done.addEventListener('click', () => { adding = null; draw(); });
        const fill = () => hits.replaceChildren(...results(q.value, new Set(lamps), (x) => {
          const next = lampsTo([...lamps, x]);
          adding = rowKey(next); change(key, next); draw(); found(); ui.preview();
        }, lamps.length >= MAX_LAMPS));
        q.addEventListener('input', () => { findText = q.value; fill(); });
        fill();
        box.append(q, hits, done);
        el.append(box);
      }
      return el;
    }));
    if (!draft.rows.length) rows.append(make('p', 'tpSub', t('lc.empty')));
  };
  sortable(rows, '.dsGrip', (keys) => { const by = new Map(draft.rows.map((x) => [rowKey(x), x])); draft.rows = keys.map((k) => by.get(k)).filter(Boolean); ui.preview(); });
  const q = make('input', 'ceSearch'); q.type = 'search'; q.placeholder = t('lc.search'); q.setAttribute('aria-label', t('lc.search'));
  const list = make('div', 'ceList');
  /** the search for a new bar: what is not a bar of its own yet */
  function found() {
    const have = new Set(draft.rows.filter((x) => rowLamps(x).length === 1).map((x) => x.e));
    list.replaceChildren(...results(q.value, have, (e) => { draft.rows = [...draft.rows, { e, name: '', icon: '' }]; draw(); found(); ui.preview(); }, draft.rows.length >= MAX_ROWS));
  }
  q.addEventListener('input', found);
  draw(); found();
  ui.field(t('lc.rows', { n: MAX_ROWS }), rows);
  ui.field(t('lc.add'), q, list);
  const check = (key, label, then) => {
    const lab = make('label', 'sbOn'); const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!draft[key]; cb.dataset.act = `lc-${key}`;
    cb.addEventListener('change', () => { draft[key] = cb.checked; then?.(); ui.preview(); });
    lab.append(cb, make('span', '', label));
    return lab;
  };
  ui.field(t('lc.options'), check('allOff', t('lc.optAllOff')), check('expand', t('lc.optExpand')));
  const hook = check('hook', t('lc.optHook')), hint = make('p', 'tpSub', t('lc.popupHint'));
  const showHook = () => { hook.hidden = !draft.popup; hint.hidden = !draft.popup; };
  const seg = make('div', 'ceSeg');
  [false, true].forEach((v) => {
    const b = make('button', draft.popup === v ? 'on' : '', t(v ? 'lc.asWindow' : 'lc.inGrid')); b.type = 'button'; b.dataset.popup = String(v);
    b.addEventListener('click', () => { draft.popup = v; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); showHook(); ui.preview(); });
    seg.append(b);
  });
  draft.popup = draft.popup === true;
  showHook();
  ui.field(t('lc.display'), seg, hook, hint);
}
