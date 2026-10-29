/* The scene bar over the tab bar (#597): a row of tiles (symbol and name) for scenes and scripts, swiped or scrolled sideways when they do
 * not fit (it snaps to a tile, the cut side fades out). A tap starts one (✓ for a moment, a note when it failed), the one that ran last
 * has a dot, a long press opens Home Assistant's own window (outside Home Assistant the add-on's). No tiles on a page: no bar. An editor
 * sets it in the board's edit mode (✎ in the tab bar, then "🎬 Szenen-Leiste" or the tile ✎ at its end): on or off, one list for every
 * page, a page or a version of a page (#507) with its own list or none; per tile name, symbol and colour, the order by dragging. The rules
 * are in scenebar.js (tested). */
import { itemsFor, lastFired, tileOf, cleanSceneBar, barKey, modeOf, listOf, withMode, withItems, fitsBar, BAR_COLORS, MAX_ITEMS } from './scenebar.js';
import { BTN_HEX, BTN_ICONS, HOLD_MS } from './buttonlook.js';
import { routineIcon } from './routines.js';
import { stripEnds } from './roomtiles.js';
import { initDragScroll } from './dragscroll.js';
import { sortable } from './dragsort.js';

const ICONS = [...new Set(['🎨', '🎬', '🛋', '💡', '🌙', '☀️', '🍽', '📺', '🎵', '🛏', '🔥', '❄️', '🏠', '🚪', '🎉', '📖', '🧘', ...BTN_ICONS])];
const SHOW = 40;

/** ctx: $, t, settings(), save(), canEdit(), states(), entities() ([{ entity_id, name }]), callService(entity, service) (-> true when
 *  taken), moreInfo(entity) (Home Assistant's own window: true when it opened), controls(entity) (the add-on's window), locked() (this
 *  user may not switch), version(page) (the version of a page this screen shows, '' = "Für alle"), editing() (the page in the edit mode),
 *  pages() ([{ key, name, icon }]: the tabs of the bar), versions(page) ([{ id, name, icon }]) */
export function initSceneBar(ctx) {
  const { $, t } = ctx;
  const box = $('#sceneBar');
  const strip = document.createElement('div'); strip.className = 'sbStrip'; strip.setAttribute('role', 'toolbar'); strip.setAttribute('aria-label', t('sb.title'));
  const toast = document.createElement('div'); toast.className = 'sbToast'; toast.hidden = true; toast.setAttribute('role', 'status');
  box.append(strip, toast);
  const flash = new Map();                           // entity -> 'ok' | 'bad' for a moment after a tap
  let drawn = '', last = { tab: 'house', shown: false }, toastTimer = 0;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  let named = { list: null, n: 0, map: {} };        // { entity: name }, made again when the list of entities is a new one (each full list) or grew
  const names = () => {
    const l = ctx.entities();
    if (named.list !== l || named.n !== l.length) named = { list: l, n: l.length, map: Object.fromEntries(l.map((e) => [e.entity_id, e.name])) };
    return named.map;
  };
  const bar = () => cleanSceneBar(ctx.settings().sceneBar);

  /* ---- the strip: the fading ends, the mouse wheel, a finger (dragscroll.js) ---- */
  const ends = () => {
    const e = box.hidden ? { left: false, right: false } : stripEnds(strip.scrollLeft, strip.scrollWidth, strip.clientWidth);
    strip.classList.toggle('moreL', e.left); strip.classList.toggle('moreR', e.right);
  };
  strip.addEventListener('scroll', ends, { passive: true });
  new ResizeObserver(ends).observe(strip);
  strip.addEventListener('wheel', (e) => {                        // a mouse has no sideways swipe: its wheel scrolls the strip
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft += e.deltaY; e.preventDefault();
  }, { passive: false });
  initDragScroll(strip);

  function note(text) {
    toast.textContent = text; toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
  }
  async function run(tile) {
    const ok = await ctx.callService(tile.e, 'turn_on');
    flash.set(tile.e, ok ? 'ok' : 'bad');
    if (!ok) note(`⚠ ${t('sb.failed', { name: tile.name })}`);
    redraw();
    setTimeout(() => { flash.delete(tile.e); redraw(); }, 1800);
  }
  /** a tap starts it, a long press opens its window; a swipe of the strip is neither (pointercancel, dragscroll.js swallows the click) */
  function presses(b, tile) {
    let timer = 0, long = false, x0 = 0;
    const stop = () => { clearTimeout(timer); timer = 0; };
    b.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      long = false; x0 = e.clientX; stop();
      timer = setTimeout(() => { long = true; timer = 0; if (!ctx.moreInfo(tile.e)) ctx.controls(tile.e); }, HOLD_MS);
    });
    b.addEventListener('pointermove', (e) => { if (timer && Math.abs(e.clientX - x0) > 8) stop(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => b.addEventListener(n, stop));
    b.addEventListener('contextmenu', (e) => e.preventDefault());   // a long touch: no menu of the browser
    b.addEventListener('click', (e) => { e.stopPropagation(); if (long) { long = false; return; } run(tile); });
  }
  function tileEl(tile, lastOne) {
    const f = flash.get(tile.e);
    const b = make('button', `sbTile${lastOne ? ' last' : ''}${f ? ` ${f}` : ''}${tile.color ? ' tinted' : ''}`); b.type = 'button'; b.dataset.e = tile.e;
    if (tile.color) b.style.setProperty('--sbc', BTN_HEX[tile.color]);
    b.append(make('span', 'sbIcon', f === 'ok' ? '✓' : f === 'bad' ? '⚠' : tile.icon), make('span', 'sbName', tile.name));
    b.title = lastOne ? `${tile.name} · ${t('sb.last')}` : tile.name; b.setAttribute('aria-label', b.title);
    presses(b, tile);
    return b;
  }

  /** after a change (the states, the tab, the settings, the edit mode): the tiles of the page shown, only drawn again when they changed */
  function update(tab = last.tab, shown = last.shown) {
    last = { tab, shown };
    const st = ctx.states(), edit = !!shown && ctx.canEdit() && ctx.editing() === tab;
    const items = shown && !ctx.locked() ? itemsFor(ctx.settings().sceneBar, tab, ctx.version(tab)).filter((i) => edit || st[i.e]) : [];
    const nm = names(), tiles = items.map((i) => tileOf(i, nm, routineIcon)), lastOne = lastFired(items, st);
    const sig = JSON.stringify([tiles, lastOne, [...flash], edit, t('sb.title')]);
    box.hidden = !tiles.length && !edit;
    document.body.classList.toggle('hasScenes', !box.hidden);
    if (sig === drawn) { ends(); return; }
    drawn = sig;
    strip.replaceChildren(...tiles.map((x) => tileEl(x, x.e === lastOne)));
    if (edit) {                                                   // the edit mode: a tile to set the bar
      const e = make('button', 'sbTile sbEdit'); e.type = 'button'; e.dataset.act = 'sceneBar';
      e.append(make('span', 'sbIcon', tiles.length ? '✎' : '＋'), make('span', 'sbName', tiles.length ? t('sb.edit') : t('sb.setUp')));
      e.addEventListener('click', () => open(tab));
      strip.append(e);
    }
    ends();
  }
  const redraw = () => { drawn = ''; update(); };

  /* ---- the window: on or off, which list, the tiles ---- */
  let dlg = null;
  function open(page) {
    if (!ctx.canEdit()) return;
    if (!dlg) {
      dlg = make('dialog', 'ceDlg sbDlg');
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      document.body.append(dlg);
    }
    let draft = bar();
    const here = barKey(page, ctx.version(page));
    let key = modeOf(draft, here) !== 'all' ? here : modeOf(draft, page) !== 'all' ? page : '';
    const head = make('div', 'ceHead');
    head.append(make('h3', '', `🎬 ${t('sb.title')}`), make('p', 'tpSub', t('sb.sub')));
    const onRow = make('label', 'sbOn'); const on = make('input'); on.type = 'checkbox'; on.checked = draft.on; on.dataset.act = 'sbOn';
    on.addEventListener('change', () => { draft = { ...draft, on: on.checked }; });
    onRow.append(on, make('span', '', t('sb.show')));
    const target = make('select', 'ceSelect'); target.dataset.act = 'sbTarget';
    const fill = () => {
      const opts = [new Option(`🌐 ${t('sb.allPages')}`, '')];
      ctx.pages().forEach((p) => {
        const mark = (k) => ({ own: ` · ${t('sb.mode.own')}`, off: ` · ${t('sb.mode.off')}` }[modeOf(draft, k)] || '');
        opts.push(new Option(`${p.icon} ${p.name}${mark(p.key)}`, p.key));
        ctx.versions(p.key).forEach((v) => opts.push(new Option(`   ${p.icon} ${p.name} · ${v.icon} ${v.name}${mark(barKey(p.key, v.id))}`, barKey(p.key, v.id))));
      });
      target.replaceChildren(...opts);
      target.value = key;
    };
    target.addEventListener('change', () => { key = target.value; body(); });
    const area = make('div', 'sbArea');
    function body() {
      fill();
      area.replaceChildren();
      if (key) {
        const mode = modeOf(draft, key), seg = make('div', 'ceSeg');
        ['all', 'own', 'off'].forEach((m) => {
          const b = make('button', mode === m ? 'on' : '', t(`sb.mode.${m}`)); b.type = 'button'; b.dataset.mode = m;
          b.addEventListener('click', () => { draft = withMode(draft, key, m); body(); });
          seg.append(b);
        });
        area.append(field(t('sb.here'), seg));
        if (mode === 'all') { area.append(make('p', 'tpSub', t('sb.usesAll'))); return; }
        if (mode === 'off') { area.append(make('p', 'tpSub', t('sb.noneHere'))); return; }
      }
      area.append(listEditor());
    }
    const field = (label, ...nodes) => { const f = make('div', 'ceField'); f.append(make('label', '', label), ...nodes); return f; };
    /** the tiles of the list being set: ⠿ symbol name colour ✕, then a search to add scenes and scripts */
    function listEditor() {
      const wrap = make('div', 'sbEditor'), items = () => listOf(draft, key), nm = names();
      const set = (list) => { draft = withItems(draft, key, list); };
      const rows = make('div', 'sbRows');
      const drawRows = () => {
        rows.replaceChildren(...items().map((it) => {
          const r = make('div', 'sbRow'); r.dataset.key = it.e;
          const grip = make('span', 'dsGrip', '⠿'); grip.title = t('bd.drag');
          const icon = make('select', 'sbIconSel'); icon.setAttribute('aria-label', t('ob.icon'));
          const auto = routineIcon(it.name || nm[it.e] || it.e, it.e);
          icon.append(new Option(`${auto} ${t('ob.iconAuto')}`, ''), ...[...new Set([...(it.icon && !ICONS.includes(it.icon) ? [it.icon] : []), ...ICONS])].map((x) => new Option(x, x)));
          icon.value = it.icon;
          icon.addEventListener('change', () => set(items().map((x) => (x.e === it.e ? { ...x, icon: icon.value } : x))));
          const name = make('input', 'ceInput sbNameIn'); name.value = it.name; name.maxLength = 30; name.placeholder = nm[it.e] || it.e; name.setAttribute('aria-label', t('ce.name'));
          name.addEventListener('input', () => set(items().map((x) => (x.e === it.e ? { ...x, name: name.value } : x))));
          const colors = make('div', 'sbColors');
          ['', ...BAR_COLORS].forEach((c) => {
            const d = make('button', `sbDot${it.color === c ? ' on' : ''}`); d.type = 'button'; d.dataset.color = c;
            d.title = c ? t(`ob.color.${c}`) : t('sb.noColor'); d.setAttribute('aria-label', d.title);
            if (c) d.style.setProperty('--dot', BTN_HEX[c]);
            d.addEventListener('click', () => { set(items().map((x) => (x.e === it.e ? { ...x, color: c } : x))); drawRows(); });
            colors.append(d);
          });
          const del = make('button', 'sbDel', '✕'); del.type = 'button'; del.title = t('sb.remove'); del.setAttribute('aria-label', del.title);
          del.addEventListener('click', () => { set(items().filter((x) => x.e !== it.e)); drawRows(); drawFound(); });
          const missing = !ctx.states()[it.e] ? make('small', 'sbMissing', `⚠ ${t('sb.missing')}`) : null;
          r.append(grip, icon, name, colors, del, ...(missing ? [missing] : []), make('small', 'sbId', it.e));
          return r;
        }));
        if (!items().length) rows.append(make('p', 'tpSub', t('sb.empty')));
      };
      sortable(rows, '.dsGrip', (keys) => { const by = new Map(items().map((x) => [x.e, x])); set(keys.map((k) => by.get(k)).filter(Boolean)); });
      const q = make('input', 'ceSearch'); q.type = 'search'; q.placeholder = t('sb.search'); q.setAttribute('aria-label', t('sb.search'));
      const found = make('div', 'ceList');
      const drawFound = () => {
        const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean), have = new Set(items().map((x) => x.e));
        const all = ctx.entities().filter((e) => fitsBar(e.entity_id) && !have.has(e.entity_id))
          .filter((e) => words.every((w) => `${e.name || ''} ${e.entity_id}`.toLowerCase().includes(w)))
          .sort((a, b) => (a.name || a.entity_id).localeCompare(b.name || b.entity_id));
        const full = items().length >= MAX_ITEMS;
        found.replaceChildren(...all.slice(0, SHOW).map((e) => {
          const b = make('button', 'ceItem'); b.type = 'button'; b.dataset.entity = e.entity_id; b.disabled = full;
          b.append(make('span', 'ceTick', '＋'), make('span', 'ceName', `${routineIcon(e.name || e.entity_id, e.entity_id)} ${e.name || e.entity_id}`), make('small', '', e.entity_id));
          b.addEventListener('click', () => { set([...items(), { e: e.entity_id }]); drawRows(); drawFound(); });
          return b;
        }));
        if (!all.length) found.append(make('p', 'tpSub', t('ce.none')));
      };
      q.addEventListener('input', drawFound);
      drawRows(); drawFound();
      wrap.append(field(t('sb.tiles', { n: MAX_ITEMS }), rows), field(t('sb.add'), q, found));
      return wrap;
    }
    const btns = make('div', 'ceBtns');
    const cancel = make('button', 'bdBtn', t('ce.cancel')); cancel.type = 'button'; cancel.addEventListener('click', () => dlg.close());
    const save = make('button', 'bdBtn primary', `✓ ${t('ce.save')}`); save.type = 'button'; save.dataset.act = 'save';
    save.addEventListener('click', () => { ctx.settings().sceneBar = cleanSceneBar(draft); ctx.save(); dlg.close(); redraw(); });
    btns.append(cancel, save);
    dlg.replaceChildren(head, onRow, field(t('sb.for'), target), area, btns);
    body();
    if (!dlg.open) dlg.showModal();
  }
  return { update, open, redraw };
}
