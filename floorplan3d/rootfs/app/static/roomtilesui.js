/* Room tiles (#421): live mode, a strip at the bottom over the view buttons with a card per room of the floor shown (the whole house: every
 * floor, the top one first): its name, the temperature, the lights that are on (the card's edge in their colour), open windows and 👤 when
 * somebody is there. A tap flies to the room and opens its room card. On phones the strip is smaller and is swiped sideways. Redrawn only
 * when a card changed; what a card shows comes from roomtiles.js (tested). "Room tiles" in the View menu and in the settings switch it off.
 * More tiles than fit (the whole house): arrows at the ends, the cut side fades out, the mouse wheel scrolls the strip sideways (3.99.2), a
 * finger swipes it on every device, the iPhone too (dragscroll.js, #438). */
import { roomSummary, tileTexts, stripEnds } from './roomtiles.js';
import { navEntries } from './nav.js';
import { initDragScroll } from './dragscroll.js';

const hex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** ctx: $, t, layout(), floorIdx(), houseMode(), focusedRoom(), settings(), states(), isLive(), placed(floor) (its devices with entities),
 *  areaEntities(room), isOn(entity), isOpen(entity), openingEntities(opening), openRoom(floorIndex, roomId), commitSettings(), lang(), imperial() */
export function initRoomTiles(ctx) {
  const { $, t } = ctx;
  const box = $('#roomTiles');
  let last = '';
  box.addEventListener('click', (e) => { const b = e.target.closest('[data-room]'); if (b) ctx.openRoom(+b.dataset.floor, b.dataset.room); });
  $('#tilesToggle').addEventListener('click', () => { $('#setRoomTiles').checked = ctx.settings().roomTiles === false; ctx.commitSettings(); });
  const left = $('#tilesLeft'), right = $('#tilesRight');
  /** the arrows and the fading edges where there is more to see */
  function ends() {
    const e = box.hidden ? { left: false, right: false } : stripEnds(box.scrollLeft, box.scrollWidth, box.clientWidth);
    left.hidden = !e.left; right.hidden = !e.right;
    box.classList.toggle('moreL', e.left); box.classList.toggle('moreR', e.right);
    if (e.left || e.right) { const h = `${box.clientHeight - 12}px`; left.style.height = h; right.style.height = h; }   // as tall as the tiles
  }
  box.addEventListener('scroll', ends, { passive: true });
  new ResizeObserver(ends).observe(box);
  left.addEventListener('click', () => box.scrollBy({ left: -box.clientWidth * 0.7, behavior: 'smooth' }));
  right.addEventListener('click', () => box.scrollBy({ left: box.clientWidth * 0.7, behavior: 'smooth' }));
  box.addEventListener('wheel', (e) => {                          // a mouse has no sideways swipe: its wheel scrolls the strip
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft += e.deltaY; e.preventDefault();
  }, { passive: false });
  initDragScroll(box);                                             // a finger (dragscroll.js)
  function tile({ r, fl, fi }, fmt, house) {
    const s = roomSummary(r, fl, { placed: ctx.placed(fl), areaEntities: ctx.areaEntities(r), states: ctx.states(), isOn: ctx.isOn, isOpen: ctx.isOpen, openingEntities: ctx.openingEntities });
    const tx = tileTexts(s, t, (v) => fmt.format(v), ctx.imperial());
    const col = s.lights ? (s.rgb ? hex(s.rgb) : '#ffcf70') : '';
    return `<button type="button" class="rtTile${col ? ' lit' : ''}${r.id === ctx.focusedRoom() ? ' active' : ''}" data-room="${esc(r.id)}" data-floor="${fi}"${col ? ` style="--lc:${col}"` : ''}>`
      + `<span class="rtHead"><b>${esc(r.name)}</b>${s.occupied ? `<i title="${esc(t('nav.occupied'))}">👤</i>` : ''}</span>`
      + (house ? `<span class="rtFloor">${esc(fl.name || '')}</span>` : '')
      + `<span class="rtTemp">${esc(tx.temp)}</span>`
      + `<span class="rtTags"><span class="rtLight">${esc(tx.lights)}</span>${tx.open ? `<span class="rtOpen">${esc(tx.open)}</span>` : ''}</span></button>`;
  }
  function update() {
    const on = ctx.settings().roomTiles !== false;
    $('#tilesToggle').classList.toggle('active', on);
    const layout = ctx.layout(), fi = ctx.floorIdx(), house = ctx.houseMode();
    const entries = on && ctx.isLive() && layout.floors[fi] ? navEntries(layout.floors, fi, house) : [];
    box.hidden = !entries.length;
    if (!entries.length) { last = ''; ends(); return; }
    let fmt;
    try { fmt = new Intl.NumberFormat(ctx.lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); } catch { fmt = new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
    const html = entries.map((e) => tile(e, fmt, house)).join('');
    if (html !== last) { box.innerHTML = html; last = html; }
    ends();
  }
  return { update };
}
