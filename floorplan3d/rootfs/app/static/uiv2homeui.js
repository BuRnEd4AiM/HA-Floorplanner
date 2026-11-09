/* „Oberfläche 2“, nothing selected (5.0.0; the owner's choice of 2026-11-09, pictures 9 and 10 in docs/ideen-5.0/): instead of the hint,
 * „Häuser“, „Gebäude“, „Etage verwalten“, „Hintergrundbild“ and the object list one under the other, three buttons on top (🗂 Haus,
 * 🔍 Objekte, ❔ Hilfe). „Haus“ is a tree like a file explorer: the houses, the floors of the open one from the top down (drag ⠿ to put a
 * floor elsewhere), the rooms of a floor (a tap selects the room). A tap on a floor opens it: its name, its kind as three buttons, the
 * storey height with the house seen from the side, the roof of a roof floor, „Etage löschen“ folded away. The fields are the very ones of
 * floorpanel.js (moved here while shown, drawn anew there when they change). The houses, buildings and the background picture stay as
 * sections below. The rules are in uiv2more.js (tested). */
import { treeRows, FLOOR_ICON, storeySvg } from './uiv2more.js';

/** ctx: $, t, mode() ('v2' / 'classic'), isLive(), selection(), tool(), layout(), floorIdx(), switchFloor(i), select(sel), houses() [{ id,
 *  name }], houseId(), switchHouse(id), addFloorOf(kind), moveFloorTo(from, to), renderFloorPanel(), storeyText() (the storey height as
 *  shown), fmtArea(m2) */
export function initUiV2Home(ctx) {
  const { $, t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = el('button', cls, text); b.type = 'button'; if (on) b.addEventListener('click', on); return b; };
  const panel = $('#panel'), box = el('div', 'v2'); box.id = 'v2Home'; box.hidden = true;
  panel.prepend(box);
  let seg = 'house', floorOpen = false, on = false;
  const openFloors = new Set();                          // floors whose rooms show in the tree (the open floor always does)
  let dragFrom = -1;
  let scrollTo = false;                                    // a floor was just opened: show its card

  /** show the tree instead of the classic panel: the new panel, the edit mode, nothing selected, the select tool */
  function sync() {
    const now = ctx.mode() === 'v2' && !ctx.isLive() && !ctx.selection() && ctx.tool() === 'select';
    if (!now && on && floorOpen) giveBack();
    on = now;
    panel.classList.toggle('v2home', on);
    panel.dataset.v2seg = seg;
    box.hidden = !on;
    if (on) render();
  }
  /** the fields of the floor go back to „Etage verwalten“ (drawn anew there) */
  function giveBack() { if (!$('#floorBody')?.childElementCount) ctx.renderFloorPanel(); }

  function render() {
    box.textContent = '';
    const segs = el('div', 'v2Seg wide'); segs.id = 'v2HomeSeg';
    [['house', `🗂 ${t('v2.home.house')}`], ['objects', `🔍 ${t('v2.home.objects')}`], ['help', `❔ ${t('v2.home.help')}`]].forEach(([k, label]) => {
      const b = btn(k === seg ? 'on' : '', label, () => { seg = k; if (k !== 'house' && floorOpen) { floorOpen = false; giveBack(); } panel.dataset.v2seg = seg; render(); });
      b.dataset.seg = k; segs.append(b);
    });
    box.append(segs);
    if (seg !== 'house') return;
    box.append(tree());
    const add = el('div', 'v2Adds'); add.id = 'v2Adds';
    add.append(btn('v2Btn', `＋ ${t('v2.home.addFloor')}`, () => ctx.addFloorOf('floor')), btn('v2Btn', `＋ ${t('v2.home.addBasement')}`, () => ctx.addFloorOf('basement')),
      btn('v2Btn', `＋ ${t('v2.home.addRoof')}`, () => ctx.addFloorOf('roof')), btn('v2Btn', `＋ ${t('v2.home.addHouse')}`, () => $('#houseNew')?.click()));
    box.append(add);
    if (floorOpen) floorCard();
  }

  /** the houses, the floors of the open house from the top down, the rooms of the open floors */
  function tree() {
    const wrap = el('div', 'v2Tree'); wrap.id = 'v2Tree';
    const cur = ctx.houseId(), houses = ctx.houses().length ? ctx.houses() : [{ id: cur, name: '' }];
    const fi = ctx.floorIdx(), lay = ctx.layout(), curFloor = lay?.floors?.[fi]?.id;
    for (const h of houses) {
      const mine = h.id === cur || houses.length === 1;
      const row = el('div', `n h${mine ? ' cur' : ''}`); row.dataset.house = h.id || '';
      row.append(el('span', 'ar', mine ? '▾' : '▸'), el('span', 'ic', '🏠'), el('span', 'nm', h.name || t('house.default')));
      if (!mine) { row.classList.add('tap'); row.addEventListener('click', () => ctx.switchHouse(h.id)); }
      wrap.append(row);
      if (!mine) continue;
      for (const r of treeRows(lay, [...openFloors, curFloor])) {
        if (r.type === 'floor') wrap.append(floorRow(r, r.i === fi));
        else {
          const rr = el('div', 'n room tap'); rr.dataset.room = r.id;
          rr.append(el('span', 'ar', ''), el('span', 'ic', '▢'), el('span', 'nm', r.name || t('prop.room')), el('small', '', ctx.fmtArea(r.area)));
          rr.addEventListener('click', () => { if (r.i !== ctx.floorIdx()) ctx.switchFloor(r.i); ctx.select({ kind: 'room', id: r.id }); });
          wrap.append(rr);
        }
      }
    }
    return wrap;
  }
  function floorRow(r, current) {
    const row = el('div', `n floor tap${current ? ' on' : ''}`); row.dataset.floor = r.id; row.dataset.i = r.i;
    const ar = btn('ar', r.open || current ? '▾' : '▸', (e) => { e.stopPropagation(); if (openFloors.has(r.id)) openFloors.delete(r.id); else openFloors.add(r.id); render(); });
    if (current) ar.disabled = true;
    const grip = el('span', 'grip', '⠿'); grip.title = t('v2.home.drag');
    row.append(ar, grip, el('span', 'ic', FLOOR_ICON[r.kind] || '▤'), el('span', 'nm', r.name), el('small', '', t('v2.home.rooms', { n: r.rooms })));
    row.addEventListener('click', () => { if (r.i !== ctx.floorIdx()) ctx.switchFloor(r.i); floorOpen = true; scrollTo = true; render(); });
    row.draggable = true;
    row.addEventListener('dragstart', (e) => { dragFrom = r.i; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(r.i)); });
    row.addEventListener('dragover', (e) => { if (dragFrom < 0) return; e.preventDefault(); row.classList.add('drop'); });
    row.addEventListener('dragleave', () => row.classList.remove('drop'));
    row.addEventListener('drop', (e) => { e.preventDefault(); row.classList.remove('drop'); const from = dragFrom; dragFrom = -1; if (from >= 0 && from !== r.i) ctx.moveFloorTo(from, r.i); });
    row.addEventListener('dragend', () => { dragFrom = -1; });
    return row;
  }

  /** the open floor: the fields of floorpanel.js (#floorBody) in the new order */
  let watch = null;
  function floorCard() {
    const fb = $('#floorBody');
    if (!fb) return;
    if (!fb.childElementCount) ctx.renderFloorPanel();
    watch?.takeRecords();
    const lay = ctx.layout(), fi = ctx.floorIdx(), f = lay.floors[fi];
    if (!f) return;
    const kids = [...fb.children];
    const pick = (sel) => { const x = fb.querySelector(sel); return x ? x.closest('#floorBody > *') : null; };
    const name = kids[0], kind = pick('#floorKind'), order = pick('#floorUp'), adds = pick('#addBasement'), storey = pick('#storeyHeight'), help = pick('#storeyHelp');
    const taken = new Set([name, kind, order, adds, storey, help]);
    const rest = kids.filter((k) => !taken.has(k));
    const card = el('section', 'v2FloorCard'); card.id = 'v2Floor';
    const head = el('div', 'v2Head');
    head.append(el('div', 'ic', FLOOR_ICON[f.kind || 'floor'] || '▤'), el('b', '', f.name || ''),
      el('small', '', t('v2.floor.sub', { n: fi + 1, of: lay.floors.length, r: (f.rooms || []).length })));
    card.append(head);
    if (name) card.append(name);
    const ksel = $('#floorKind');
    if (ksel) {
      const seg = el('div', 'v2Seg wide big'); seg.id = 'v2FloorKind';
      [['basement', '⬇'], ['floor', '▤'], ['roof', '⌂']].forEach(([k, ic]) => {
        const b = btn(ksel.value === k ? 'on' : '', null, () => { if (ksel.value === k) return; ksel.value = k; ksel.dispatchEvent(new Event('change')); });
        b.dataset.kind = k; b.append(el('i', '', ic), el('span', '', t(`floor.kind.${k}`)));
        seg.append(b);
      });
      card.append(el('h4', 'finHead', t('floor.kind')), seg);
    }
    if (storey) {
      const hbox = el('div', 'v2StoreyBox'); hbox.id = 'v2Storeys';
      const pic = el('div', 'pic'); pic.innerHTML = storeySvg(lay.floors, fi, ctx.storeyText());
      const side = el('div', 'side'); side.append(storey, ...(help ? [help] : []));
      hbox.append(pic, side);
      card.append(el('h4', 'finHead', t('v2.floor.height')), hbox);
    }
    if (order) card.append(order);
    const fold = (key, icon, title, els, open) => {
      if (!els.length) return;
      const sec = el('section', `v2Sec${open ? ' open' : ''}`); sec.dataset.sec = key;
      const hd = btn('hd'); hd.append(el('span', 'i', icon), el('b', '', title), el('span', 'sum', ''), el('span', 'chev', open ? '▴' : '▾'));
      const bd = el('div', 'bd'); bd.hidden = !open; bd.append(...els);
      hd.addEventListener('click', () => { bd.hidden = !bd.hidden; sec.classList.toggle('open', !bd.hidden); hd.lastChild.textContent = bd.hidden ? '▾' : '▴'; });
      sec.append(hd, bd); card.append(sec);
    };
    fold('roof', '⌂', t('v2.floor.roof'), rest, true);
    const del = $('#delFloor');
    if (adds) adds.hidden = true;
    if (del) { const keep = el('div', 'stopTools'); keep.append(del); fold('delete', '🗑', t('floor.delete'), [keep], false); }
    const hiddenBox = el('div', 'v2Hidden'); hiddenBox.hidden = true;   // the list of kinds (the buttons above set it) and „+ Keller / + Dach“ (in the tree)
    hiddenBox.append(...[kind, adds].filter(Boolean));
    card.append(hiddenBox);
    box.append(card);
    if (scrollTo) { scrollTo = false; queueMicrotask(() => card.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
    watch?.takeRecords();                                          // our own moving out of #floorBody is no change of the floor
  }
  // floorpanel.js draws its fields anew after a change (the kind, the storey height, the roof): put them in the card again
  const fb = $('#floorBody');
  if (fb && typeof MutationObserver === 'function') {
    watch = new MutationObserver(() => { if (on && floorOpen && seg === 'house' && fb.childElementCount) render(); });
    watch.observe(fb, { childList: true });
  }

  return { sync, closeFloor: () => { if (floorOpen) { floorOpen = false; giveBack(); if (on) render(); } } };
}
