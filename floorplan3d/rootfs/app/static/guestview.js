/* 👥 Gäste-Zugang, the guest's own screen (5.21.0): the user "gast" sees only the card of their room (the room panel, kept open, in the
 * middle; the rest of the page hidden, guestview in style.css) with a bar "👥 Willkommen · Gästezimmer · bis So., 23.11., 12:00". Over
 * (or the room gone): "Der Gäste-Zugang ist beendet". The server decides who is the guest and enforces it (guest.py); this only shows it. */
import { untilText } from './guestaccess.js';

/** ctx: t, lang(), roomPanel ({ open(id), current(), full(), tab(), show(tab) }), findRoomByName(name) -> { floor, room }, switchFloor(i), focusRoom(id) */
export function initGuestView(ctx) {
  const { t } = ctx;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function over() {
    const box = make('div', 'guOver');
    box.append(make('div', 'guOverIcon', '👋'), make('h2', '', t('gu.overTitle')), make('p', '', t('gu.overText')));
    document.body.append(box);
  }
  /** me: api/me. True when this is the guest's screen */
  function start(me) {
    const g = me?.guest;
    if (!g) return false;
    document.body.classList.add('guestview');
    const hit = g.room && ctx.findRoomByName(g.room);
    if (!g.active || !hit) { over(); return true; }
    const bar = make('div', 'guBar');
    bar.append(make('b', '', `👥 ${t('gu.welcome')}`), make('span', '', g.room), ...(g.until ? [make('span', 'guUntil', t('gu.barUntil', { until: untilText(g.until, ctx.lang()) }))] : []));
    document.body.append(bar);
    const show = () => {
      if (ctx.roomPanel.current() === hit.room.id && !document.getElementById('roomPanel')?.hidden) return;
      ctx.switchFloor(hit.floor); ctx.focusRoom(hit.room.id); ctx.roomPanel.open(hit.room.id);
      if (!ctx.roomPanel.full()) ctx.roomPanel.show(ctx.roomPanel.tab());   // on a phone the whole card at once, not the small one
    };
    show();
    setInterval(show, 1500);                              // the card stays open: a tap beside it or ✕ does not leave the guest with nothing
    const end = g.until ? new Date(g.until) - Date.now() : 0;
    if (end > 0 && end < 2 ** 31) setTimeout(() => location.reload(), end + 2000);   // at the end the server says "over"
    return true;
  }
  return { start };
}
