/* Favourites (#471): their buttons at the start of the strip at the bottom of the live mode (roomtilesui.js puts them in front of the room
 * tiles), ☆ / ★ on a device's card in live mode (editors) and the list in ⚙ → "Quick access" (add by name or id, ↑ ↓, ×). The rules live
 * in favorites.js (tested). */
import { cleanFavorites, toggleFavorite, moveFavorite, isFavorite, canFavorite, favTile, favValue, shownFavorites, MAX_FAVORITES } from './favorites.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** ctx: $, t, settings(), states(), ready() (states loaded), entities(), nameOf(entity), callService(entity, service),
 *  canEdit(), save() (store the settings as they are), changed() (draw the strip again), commit() (the settings form changed) */
export function initFavorites(ctx) {
  const { $, t } = ctx;
  const list = () => cleanFavorites(ctx.settings().favorites);

  /** the buttons for the strip (HTML), '' without favourites */
  function html() {
    const states = ctx.states();
    return shownFavorites(list(), states, ctx.ready()).map((id) => {
      const f = favTile(id, states[id], ctx.nameOf(id));
      const col = f.on ? (f.rgb ? hex(f.rgb) : '#ffcf70') : '';
      const value = favValue(f, states[id], t);
      return `<button type="button" class="rtTile fav${col ? ' lit' : ''}${f.off ? ' gone' : ''}" data-fav="${esc(id)}" title="${esc(`${f.name} · ${id}`)}"${col ? ` style="--lc:${col}"` : ''}>`
        + `<span class="rtHead"><b>${esc(f.name)}</b></span>`
        + `<span class="rtTags"><span class="rtLight">${esc(f.icon)} ${esc(value)}</span></span></button>`;
    }).join('');
  }
  /** a tap on a favourite: switch it or start it */
  function tap(id, btn) {
    const f = favTile(id, ctx.states()[id], ctx.nameOf(id));
    if (!f.svc || f.off) return;
    ctx.callService(id, f.svc);
    if (btn) { btn.classList.add('tapped'); setTimeout(() => btn.classList.remove('tapped'), 600); }
  }
  /** ☆ / ★ for the card of a device in live mode (editors only), null when it cannot be a favourite */
  function star(entity) {
    if (!ctx.canEdit() || !canFavorite(entity)) return null;
    const b = el('button', 'favStar');
    b.type = 'button';
    const look = () => {
      const on = isFavorite(list(), entity);
      b.textContent = on ? '★' : '☆';
      b.classList.toggle('on', on);
      b.title = on ? t('fav.remove') : list().length >= MAX_FAVORITES ? t('fav.full', { n: MAX_FAVORITES }) : t('fav.add');
    };
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      ctx.settings().favorites = toggleFavorite(list(), entity);
      fill(ctx.settings());                    // the list in ⚙ too: the next save of the settings form reads it back
      look(); ctx.changed(); ctx.save();
    });
    look();
    return b;
  }

  /* ---- the list in ⚙ → "Quick access" ---- */
  const box = $('#favList'), input = $('#favAdd'), msg = $('#favMsg');
  function row(id) {
    const f = favTile(id, ctx.states()[id], ctx.nameOf(id));
    const r = el('div', 'favRow');
    r.dataset.id = id;
    r.append(el('span', 'favName', `${f.icon} ${f.name}`), el('small', 'sub', id));
    [['↑', -1, 'fav.up'], ['↓', 1, 'fav.down']].forEach(([txt, by, key]) => {
      const b = el('button', '', txt);
      b.type = 'button'; b.title = t(key);
      b.addEventListener('click', () => { ctx.settings().favorites = moveFavorite(list(), id, by); fill(ctx.settings()); ctx.commit(); });
      r.append(b);
    });
    const del = el('button', 'favDel', '×');
    del.type = 'button'; del.title = t('fav.remove');
    del.addEventListener('click', () => { r.remove(); ctx.commit(); });
    r.append(del);
    return r;
  }
  function fill(settings) {
    const now = cleanFavorites(settings.favorites);
    box.replaceChildren(...now.map(row));
    $('#favNone').hidden = now.length > 0;
    $('#favChoices').replaceChildren(...ctx.entities().filter((e) => canFavorite(e.entity_id)).map((e) => { const o = el('option'); o.value = e.entity_id; o.label = e.name; return o; }));
  }
  function read(next) {
    next.favorites = cleanFavorites([...box.querySelectorAll('.favRow')].map((r) => r.dataset.id));
  }
  /** what was typed: an entity id, or the name of one (any case) */
  function resolve(text) {
    const v = text.trim(), low = v.toLowerCase();
    if (!v) return '';
    const ents = ctx.entities();
    return ents.find((e) => e.entity_id === v)?.entity_id || ents.find((e) => (e.name || '').toLowerCase() === low && canFavorite(e.entity_id))?.entity_id || v;
  }
  function add() {
    const id = resolve(input.value);
    msg.textContent = '';
    if (!id) return;
    if (!canFavorite(id)) { msg.textContent = t('fav.cannot'); return; }
    const now = list();
    if (now.includes(id)) { msg.textContent = t('fav.already'); return; }
    if (now.length >= MAX_FAVORITES) { msg.textContent = t('fav.full', { n: MAX_FAVORITES }); return; }
    box.append(row(id));
    input.value = '';
    ctx.commit();
  }
  $('#favAddBtn').addEventListener('click', add);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });   // Enter would send the form and close the dialog
  input.addEventListener('change', (e) => e.stopPropagation());                                         // typing is not a setting yet
  return { html, tap, star, fill, read };
}
