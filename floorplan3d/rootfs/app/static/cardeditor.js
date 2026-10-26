/* The windows "＋ Karte hinzufügen" (the thirteen kinds) and "Karte einstellen" (#484): the device from a list that is searched while
 * typing (only devices that fit the kind), several devices for "Mehrere Geräte", a room, the calendars of a calendar card (calcardui.js,
 * #495), a ready card of ☀ Heute or a text; name,
 * width, time span and colour; on the right the card as it will look. Saved through the board (pageboard.js) into settings.pageLayouts.
 * The rules are in cards.js (tested). */
import { CARD_TYPES, TYPE_ICON, BUILTINS, COLORS, COLOR_HEX, HOURS, MAX_ENTITIES, MAX_SERIES, TYPE_DOMAINS, fitsType, cleanCard, defaultWidth, seriesColor } from './cards.js';
import { newCardId } from './pagelayout.js';
import { SIZES } from './thermostat.js';

const SHOW = 40;

/** ctx: t, entities() ([{ entity_id, name }]), rooms() ([{ id, name, floor }]), cards (cardsui.js), board (pageboard.js), calendar (calcardui.js),
 *  train (traincard.js, #550) */
export function initCardEditor(ctx) {
  const { t } = ctx;
  let dlg = null, current = null;                   // current: the preview of the card being set (drawn again when its history came)
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  function open() {
    if (!dlg) {
      dlg = make('dialog', 'ceDlg');
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      document.body.append(dlg);
    }
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  const head = (title, sub) => { const h = make('div', 'ceHead'); h.append(make('h3', '', title)); if (sub) h.append(make('p', 'tpSub', sub)); return h; };

  /** "＋ Karte hinzufügen": a tile per kind */
  function add(page) {
    const d = open();
    const grid = make('div', 'ceTypes');
    CARD_TYPES.forEach((type) => {
      const b = btn('ceType', null, () => edit(page, { id: newCardId(ctx.board.layout(page).cards.map((c) => c.id)), type, width: defaultWidth(type), hours: 24, color: 'blue', size: 'big', cals: [], days: 7, view: 'week', add: true }, true));
      b.dataset.type = type;
      b.append(make('span', 'ceTypeIcon', TYPE_ICON[type]), make('b', '', t(`ct.type.${type}`)), make('small', '', t(`ct.typeSub.${type}`)));
      grid.append(b);
    });
    const bar = make('div', 'ceBtns'); bar.append(btn('bdBtn', t('ce.cancel'), () => d.close()));
    d.replaceChildren(head(`＋ ${t('bd.add')}`, t('ce.addSub')), grid, bar);
  }

  /** "Karte einstellen": card is the card (a new one: isNew) */
  function edit(page, card, isNew = false) {
    const d = open();
    const draft = { ...card };
    const left = make('div', 'ceForm'), prev = make('div', 'cePrev');
    const field = (label, ...nodes) => { const f = make('div', 'ceField'); f.append(make('label', '', label), ...nodes); left.append(f); return f; };
    const seg = (values, text, key) => {
      const row = make('div', 'ceSeg');
      const mark = () => row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(draft[key]) === b.dataset.v));
      values.forEach((v) => { const b = btn('', text(v), () => { draft[key] = v; mark(); preview(); }); b.dataset.v = String(v); row.append(b); });
      mark();
      return row;
    };
    /* the device(s): a search field and the matching devices */
    if (card.type in TYPE_DOMAINS || card.type === 'entities') {
      const multi = card.type === 'entities', series = card.type === 'graph';     // a history card takes several sensors, one line each (#495)
      if (multi) draft.entities = Array.isArray(draft.entities) ? [...draft.entities] : [];
      let picked = series ? [draft.entity, ...(draft.more || [])].filter(Boolean) : [];
      const pickSeries = (e, on) => {
        picked = on ? picked.filter((x) => x !== e) : [...picked, e].slice(0, MAX_SERIES);
        draft.entity = picked[0] || ''; draft.more = picked.slice(1);
      };
      const q = make('input', 'ceSearch'); q.type = 'search'; q.placeholder = t('ce.search'); q.setAttribute('aria-label', t('ce.search'));
      const list = make('div', 'ceList'), count = make('small', 'tpSub');
      const fits = (e) => (multi ? /^[a-z_]+\.[a-z0-9_]+$/.test(e.entity_id) : fitsType(card.type, e.entity_id));
      const draw = () => {
        const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const chosen = multi ? draft.entities : series ? picked : [draft.entity].filter(Boolean);
        const all = ctx.entities().filter(fits).filter((e) => words.every((w) => `${e.name || ''} ${e.entity_id}`.toLowerCase().includes(w)))
          .sort((a, b) => Number(chosen.includes(b.entity_id)) - Number(chosen.includes(a.entity_id)) || (a.name || a.entity_id).localeCompare(b.name || b.entity_id));
        count.textContent = t('ce.found', { n: all.length });
        list.replaceChildren(...all.slice(0, SHOW).map((e) => {
          const on = chosen.includes(e.entity_id);
          const r = btn(`ceItem${on ? ' on' : ''}`, null, () => {
            if (multi) draft.entities = on ? draft.entities.filter((x) => x !== e.entity_id) : [...draft.entities, e.entity_id].slice(0, MAX_ENTITIES);
            else if (series) pickSeries(e.entity_id, on);
            else draft.entity = e.entity_id;
            draw(); preview();
          });
          r.dataset.entity = e.entity_id;
          const tick = make('span', 'ceTick', multi || series ? (on ? '☑' : '☐') : on ? '●' : '○');
          if (series && on) { tick.style.color = seriesColor(draft, picked.indexOf(e.entity_id)); tick.textContent = '■'; }   // the colour of its line
          r.append(tick, make('span', 'ceName', e.name || e.entity_id), make('small', '', e.entity_id));
          return r;
        }));
        if (!all.length) list.append(make('p', 'tpSub', t('ce.none')));
      };
      q.addEventListener('input', draw);
      field(multi ? t('ce.devices', { n: MAX_ENTITIES }) : series ? t('ce.series', { n: MAX_SERIES }) : t('ce.device'), q, count, list);
      draw();
    }
    if (card.type === 'room') {
      const sel = make('select', 'ceSelect');
      sel.append(new Option(t('ce.pickRoom'), ''), ...ctx.rooms().map((r) => new Option(r.floor ? `${r.name} · ${r.floor}` : r.name, r.id)));
      sel.value = draft.room || '';
      sel.addEventListener('change', () => { draft.room = sel.value; preview(); });
      field(t('ce.room'), sel);
    }
    if (card.type === 'calendar') ctx.calendar.fields(draft, { field, seg, preview: () => preview() });   // calendars, days, view (#495)
    if (card.type === 'train') ctx.train.fields(draft, { field, seg, preview: () => preview() });         // station, direction, mein Zug (#550)
    if (card.type === 'button') ctx.cards.buttonFields(draft, { field, seg, preview: () => preview() });  // symbol, colour, shape, tap (#495)
    if (card.type === 'builtin') {
      const sel = make('select', 'ceSelect');
      sel.append(new Option(t('ce.pickBuiltin'), ''), ...BUILTINS.map((k) => new Option(t(`ce.builtin.${k.replace(':', '.')}`), k)));
      sel.value = draft.builtin || '';
      sel.addEventListener('change', () => { draft.builtin = sel.value; preview(); });
      field(t('ce.builtin'), sel);
    }
    const name = make('input', 'ceInput'); name.value = draft.name || ''; name.maxLength = 60; name.placeholder = card.type === 'text' ? t('ce.titlePh') : t('ce.namePh');
    name.addEventListener('input', () => { draft.name = name.value; preview(); });
    field(card.type === 'text' ? t('ce.title') : t('ce.name'), name);
    if (card.type === 'text') {
      const area = make('textarea', 'ceInput'); area.rows = 4; area.maxLength = 500; area.value = draft.text || '';
      area.addEventListener('input', () => { draft.text = area.value; preview(); });
      field(t('ce.text'), area);
    }
    if (card.type === 'graph') field(t('ce.hours'), seg(HOURS, (h) => t(`ce.hours.${h}`), 'hours'));
    if (card.type === 'thermostat') { draft.size = draft.size || 'big'; field(t('th.size'), seg(SIZES, (v) => t(`th.size.${v}`), 'size')); }   // the circle big or small (#495)
    field(t('ce.width'), seg([1, 2, 3, 4], (w) => t(`ce.width.${w}`), 'width'));
    if (card.type === 'graph' || card.type === 'value') {
      const row = seg(COLORS, (c) => t(`ce.color.${c}`), 'color');
      row.querySelectorAll('button').forEach((b) => { const dot = make('i', 'ceDot'); dot.style.background = COLOR_HEX[b.dataset.v]; b.prepend(dot); });
      field(t('ce.color'), row);
    }
    const save = btn('bdBtn primary', `✓ ${isNew ? t('ce.addIt') : t('ce.save')}`, () => {
      const c = cleanCard(draft);
      if (!c) return;
      ctx.board.saveCard(page, c);
      d.close();
    });
    save.dataset.act = 'save';
    function preview() {
      const c = cleanCard(draft);
      save.disabled = !c;
      prev.replaceChildren(make('small', 'cePrevHead', t('ce.preview')));
      if (!c) { prev.append(make('p', 'tpSub', card.type === 'text' ? t('ce.needText') : card.type === 'room' ? t('ce.pickRoom') : card.type === 'builtin' ? t('ce.pickBuiltin') : card.type === 'calendar' ? t('ce.needCal') : card.type === 'train' ? t('tr.needStation') : t('ce.needDevice'))); return; }
      const el = ctx.cards.render(c);
      el.classList.add('cePreviewCard');
      prev.append(el);
    }
    current = preview;
    const cols = make('div', 'ceCols'); cols.append(left, prev);
    const bar = make('div', 'ceBtns');
    if (isNew) bar.append(btn('bdBtn', `‹ ${t('ce.back')}`, () => add(page)));
    bar.append(btn('bdBtn', t('ce.cancel'), () => d.close()), save);
    d.replaceChildren(head(`${TYPE_ICON[card.type]} ${t('ce.editTitle', { type: t(`ct.type.${card.type}`) })}`, t('ce.editSub')), cols, bar);
    preview();
  }
  return { add, edit, close: () => dlg?.close(), refresh: () => { if (dlg?.open && current && dlg.querySelector('.cePrev')) current(); } };
}
