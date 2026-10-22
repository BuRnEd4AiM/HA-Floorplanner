/* The settings of the pages 🎵 Musik & TV and 🧺 Haushalt (#490), in ⚙ → "Reiter unten": the radio stations (a name and the address of a
 * stream or of one of Home Assistant's media), the to-do list that is the shopping list, and the machines when finding them by their
 * names is not enough (a power sensor, a status). A part of the settings form (settings.js parts: fill / read); the rules are in media.js
 * and household.py (tested). */
import { cleanStations, MAX_STATIONS, STATION } from './media.js';
import { KINDS } from './household.js';

/** ctx: $, t, entities() (Home Assistant's entities [{ entity_id, name, unit, dc, state }]) */
export function initMediaPrefs(ctx) {
  const { $, t } = ctx;
  const box = $('#setStations'), list = $('#setShoppingList'), machines = $('#setAppliances');
  let cur = { radioStations: [], shoppingList: '', appliances: {} };
  let drafts = [];                                     // stations being typed (no address yet): they stay while the dialog saves the others
  const make = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const byName = (a, b) => (a.name || a.entity_id).localeCompare(b.name || b.entity_id);

  function stationRow(s = { name: '', url: '' }) {
    const row = make('div', 'stop mpStationEdit');
    const name = make('input'); name.type = 'text'; name.maxLength = 40; name.placeholder = t('mp.stationName'); name.value = s.name; name.dataset.role = 'name';
    const url = make('input'); url.type = 'url'; url.maxLength = 500; url.placeholder = 'https://…'; url.value = s.url; url.dataset.role = 'url';
    const del = make('button'); del.type = 'button'; del.textContent = '×'; del.title = t('mp.removeStation');
    del.addEventListener('click', () => { const parent = row.parentNode; row.remove(); parent?.dispatchEvent(new Event('change', { bubbles: true })); });   // the dialog saves on a change
    row.append(name, url, del);
    return row;
  }
  $('#addStation')?.addEventListener('click', () => {
    if (box.childElementCount >= MAX_STATIONS) return;
    const r = stationRow(); box.append(r); r.querySelector('input').focus();
  });
  /** a drop-down of entities, "automatisch" first; one chosen that Home Assistant does not know (any more) stays */
  function pick(sel, value, options) {
    sel.replaceChildren(new Option(t('hh.auto'), ''), ...options.map((e) => new Option(e.name ? `${e.name} (${e.entity_id})` : e.entity_id, e.entity_id)));
    if (value && !options.some((e) => e.entity_id === value)) sel.add(new Option(value, value));
    sel.value = value || '';
  }
  const typed = () => [...box.querySelectorAll('.mpStationEdit')].map((r) => ({ name: r.querySelector('[data-role=name]').value, url: r.querySelector('[data-role=url]').value.trim() }));
  const same = (a, b) => JSON.stringify(a.map((x) => [x.name.trim(), x.url])) === JSON.stringify(b.map((x) => [x.name.trim(), x.url]));
  function draw() {
    const want = [...cur.radioStations, ...drafts].slice(0, MAX_STATIONS);
    // the dialog saves on every change and fills itself again: rows that already say this stay, and so does the cursor in them
    if (!same(typed().filter((r) => r.name.trim() || r.url), want)) box.replaceChildren(...want.map(stationRow));
    const all = ctx.entities();
    pick(list, cur.shoppingList, all.filter((e) => e.entity_id.startsWith('todo.')).sort(byName));
    list.options[0].textContent = t('hh.autoList');
    const power = all.filter((e) => e.entity_id.startsWith('sensor.') && (e.dc === 'power' || e.unit === 'W' || e.unit === 'kW')).sort(byName);
    const status = all.filter((e) => e.entity_id.startsWith('binary_sensor.') || (e.entity_id.startsWith('sensor.') && !e.unit && Number.isNaN(Number(e.state)))).sort(byName);
    machines.replaceChildren(...KINDS.map((kind) => {
      const c = cur.appliances[kind] || {}, row = make('div', 'hhPref');
      row.dataset.kind = kind;
      const head = make('b'); head.textContent = t(`hh.kind.${kind}`);
      const p = make('select'); p.dataset.role = 'power'; p.title = t('hh.prefPower'); pick(p, c.power, power);
      const s = make('select'); s.dataset.role = 'status'; s.title = t('hh.prefStatus'); pick(s, c.status, status);
      const lp = make('label'), ls = make('label');
      lp.append(document.createTextNode(t('hh.prefPower')), p); ls.append(document.createTextNode(t('hh.prefStatus')), s);
      row.append(head, lp, ls);
      return row;
    }));
  }
  return {
    fill(settings) {
      cur = { radioStations: cleanStations(settings.radioStations), shoppingList: typeof settings.shoppingList === 'string' ? settings.shoppingList : '',
        appliances: settings.appliances && typeof settings.appliances === 'object' ? settings.appliances : {} };
      draw();
    },
    read(next) {
      const rows = [...box.querySelectorAll('.mpStationEdit')].map((r) => ({ name: r.querySelector('[data-role=name]').value, url: r.querySelector('[data-role=url]').value.trim() }));
      next.radioStations = cleanStations(rows);
      drafts = rows.filter((r) => !STATION.test(r.url) && (r.name.trim() || r.url));
      next.shoppingList = list.value || '';
      const app = {};
      machines.querySelectorAll('.hhPref').forEach((r) => {
        const power = r.querySelector('[data-role=power]').value, status = r.querySelector('[data-role=status]').value;
        if (power || status) app[r.dataset.kind] = { ...(power ? { power } : {}), ...(status ? { status } : {}) };
      });
      next.appliances = app;
      cur = { radioStations: next.radioStations, shoppingList: next.shoppingList, appliances: app };
    },
  };
}
