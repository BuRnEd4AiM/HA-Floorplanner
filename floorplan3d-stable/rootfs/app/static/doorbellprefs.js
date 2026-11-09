/* The settings of the doorbell (🔔, ⚙ → 📱 Wandtablet): on or off, the gong, and up to four bells, each with its camera, its door opener and
 * a name (empty: found by itself, see findBells in doorbell.js), and "🔔 Ausprobieren" for this screen. A part of the settings form
 * (settings.js parts: fill / read); the server keeps them in settings.doorbell (pages.clean_doorbell). */
import { cleanBells, findBells, MAX_BELLS } from './doorbell.js';

const BELL = /^(event|binary_sensor)\./, OPENER = /^(lock|button|input_button|switch|script)\./;

/** ctx: $, t, entities() (Home Assistant's entities [{ entity_id, name }]), test() (rings on this screen) */
export function initDoorbellPrefs(ctx) {
  const { $, t } = ctx;
  const on = $('#setBellOn'), sound = $('#setBellSound'), box = $('#setBells'), found = $('#bellFound');
  const make = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const byName = (a, b) => (a.name || a.entity_id).localeCompare(b.name || b.entity_id);
  const label = (e) => (e.name && e.name !== e.entity_id ? `${e.name} (${e.entity_id})` : e.entity_id);

  /** a drop-down of entities matching `re`, `first` on top (empty: "automatisch" or "keiner"); a value Home Assistant does not know stays */
  function pick(role, value, re, first) {
    const sel = make('select'); sel.dataset.role = role;
    const opts = ctx.entities().filter((e) => re.test(e.entity_id)).sort(byName);
    sel.append(...(first ? [new Option(first, '')] : []), ...opts.map((e) => new Option(label(e), e.entity_id)));
    if (value && !opts.some((e) => e.entity_id === value)) sel.add(new Option(value, value));
    sel.value = value || '';
    return sel;
  }
  function row(b) {
    const r = make('div', 'bellPref');
    const name = make('input'); name.type = 'text'; name.maxLength = 40; name.placeholder = t('bell.namePh'); name.value = b.name || ''; name.dataset.role = 'name';
    const del = make('button'); del.type = 'button'; del.textContent = '×'; del.title = t('bell.remove');
    del.addEventListener('click', () => { const parent = r.parentNode; r.remove(); parent?.dispatchEvent(new Event('change', { bubbles: true })); });   // the dialog saves on a change
    const field = (text, el) => { const l = make('label'); l.append(document.createTextNode(text), el); return l; };
    r.append(field(t('bell.entity'), pick('entity', b.entity, BELL, '')), field(t('bell.camera'), pick('camera', b.camera, /^camera\./, t('bell.auto'))),
      field(t('bell.opener'), pick('open', b.open, OPENER, t('bell.none'))), field(t('bell.name'), name), del);
    return r;
  }
  const typed = () => [...box.querySelectorAll('.bellPref')].map((r) => ({
    entity: r.querySelector('[data-role=entity]').value, camera: r.querySelector('[data-role=camera]').value,
    open: r.querySelector('[data-role=open]').value, name: r.querySelector('[data-role=name]').value }));
  $('#addBell').addEventListener('click', () => {
    if (box.childElementCount >= MAX_BELLS) return;
    const have = new Set(typed().map((b) => b.entity));
    const next = findBells(ctx.entities(), []).find((b) => !have.has(b.entity))?.entity
      || ctx.entities().filter((e) => BELL.test(e.entity_id) && !have.has(e.entity_id)).sort(byName)[0]?.entity_id;
    if (!next) { found.textContent = t('bell.noneToAdd'); return; }
    box.append(row({ entity: next }));
    box.dispatchEvent(new Event('change', { bubbles: true }));
  });
  $('#bellTest').addEventListener('click', () => ctx.test());

  function foundText(chosen) {
    if (chosen.length) return '';
    const list = findBells(ctx.entities(), []);
    return list.length ? `${t('bell.found')} ${list.map((b) => `${b.name}${b.camera ? ` → ${b.camera}` : ''}`).join(' · ')}` : t('bell.notFound');
  }
  return {
    fill(settings) {
      const d = settings.doorbell || {}, chosen = cleanBells(d.bells);
      on.checked = d.on !== false;
      sound.checked = d.sound !== false;
      // the dialog saves on every change and fills itself again: rows that already say this stay (and the cursor in them)
      if (JSON.stringify(cleanBells(typed())) !== JSON.stringify(chosen)) box.replaceChildren(...chosen.map(row));
      found.textContent = foundText(chosen);
      if (!ctx.entities().length) setTimeout(() => { found.textContent = foundText(cleanBells(typed())); }, 2000);   // the entities are still on their way
    },
    read(next) {
      next.doorbell = { on: on.checked, sound: sound.checked, bells: cleanBells(typed()) };
    },
  };
}
