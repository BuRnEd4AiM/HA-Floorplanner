/* The page 👨‍👩‍👧 Familie of the tab bar (#483): every person of Home Assistant with a picture (or a coloured letter), where (at home, a
 * zone, away), since when and the battery of the phone; beside it the pinboard with "Neue Notiz" (pinboardui.js). Since #495 who is really
 * at home: per person what says so (Wi-Fi, GPS, the phone's network, its room), "n Personen zu Hause" on top and "Wer ist wo im Haus"
 * (the rooms with somebody in them). The add-on finds the pictures, phones and sources (api/family, asked again every few minutes and when
 * somebody moves); the rules are in family.js (tested). */
import { familyRows, avatarHue, whenOf, hasFamily, LOW_PHONE } from './family.js';

const AGAIN = 5 * 60000, MOVED = 30000;

/** ctx: t, el (the page), lang(), states(), names() ({ entity: name }), pinboard (initPinboard), board (pageboard.js, #484: keys
 *  p:<person>, pinboard, home, rooms), presence() (settings.presence, #495), rooms() ([{ name, occupied }]: the rooms of the house shown) */
export function initFamilyPage(ctx) {
  const { t, el } = ctx;
  let people = [], at = 0, asking = null, seen = '', drawn = '', box = null, notesBox = null, form = null, board = null, later = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const lang = () => ctx.lang() || 'de';
  const whereSig = () => JSON.stringify(Object.entries(ctx.states()).filter(([e]) => e.startsWith('person.')).map(([e, s]) => [e, s?.state]));
  const clock = (d) => (d ? new Intl.DateTimeFormat(lang(), { hour: '2-digit', minute: '2-digit' }).format(d) : '');
  const SRC_ICON = { wifi: '📶', gps: '📍', bluetooth: '🔵', other: '📡', ssid: '📶', room: '🛋' };
  /** what a source says in words (#495) */
  function sourceText(x) {
    const v = x.home === true ? t('fm.s.home') : x.text === 'not_home' ? t('fm.s.away') : x.text;
    if (x.kind === 'wifi') return x.home ? t('fm.s.wifiIn') : t('fm.s.wifiOut');
    if (x.kind === 'ssid') return x.text && !/^<?not.connected>?$/i.test(x.text) && x.text !== 'unavailable' && x.text !== 'unknown' ? t('fm.s.ssid', { v: x.text }) : t('fm.s.noSsid');
    if (x.kind === 'room') return x.home ? t('fm.s.room', { v: x.text }) : t('fm.s.noRoom');
    return t(x.kind === 'gps' ? 'fm.s.gps' : x.kind === 'bluetooth' ? 'fm.s.bt' : 'fm.s.other', { v });
  }

  /** the add-on's people (pictures, phones, since when): every few minutes, sooner when somebody moved */
  function load() {
    const sig = whereSig(), due = Date.now() - at > AGAIN || (sig !== seen && Date.now() - at > MOVED);
    if (asking || !due) return;
    at = Date.now(); seen = sig;
    asking = fetch('api/family').then((r) => (r.ok ? r.json() : null)).then((x) => { if (x && Array.isArray(x.people)) { people = x.people; draw(); } })
      .catch(() => {}).finally(() => { asking = null; });
  }
  function since(d) {
    const w = whenOf(d);
    if (!w) return '';
    const f = (o) => new Intl.DateTimeFormat(lang(), o).format(w.date), hm = { hour: '2-digit', minute: '2-digit' };
    return t('fm.since', { when: w.key === 'time' ? f(hm) : w.key === 'yesterday' ? `${t('fm.yesterday')} ${f(hm)}` : w.key === 'day' ? f({ weekday: 'short' }) : f({ day: 'numeric', month: 'numeric' }) });
  }
  function avatar(p) {
    const a = make('span', 'fmAva', p.initial); a.style.background = `hsl(${avatarHue(p.name)} 55% 45%)`;
    if (p.picture) {
      const img = make('img'); img.alt = ''; img.loading = 'lazy'; img.src = `api/family/${encodeURIComponent(p.id)}/picture`;
      img.addEventListener('error', () => img.remove());                 // the letter stays
      a.append(img);
    }
    return a;
  }
  function personCard(p) {
    const c = make('div', `tpCard fmPerson ${p.where.key}`); c.dataset.person = p.id;
    const txt = make('div', 'fmText');
    const room = p.presence?.room;
    const where = p.where.key === 'home' ? `🏠 ${t('fm.home')}${room ? ` · ${room}` : ''}` : p.where.key === 'zone' ? `📍 ${p.where.zone}` : p.where.key === 'away' ? `🚗 ${t('fm.away')}` : `❔ ${t('fm.unknown')}`;
    txt.append(make('b', 'fmName', p.name), make('div', 'fmWhere', where));
    const s = since(p.since); if (s) txt.append(make('small', 'tpSub', s));
    const side = make('div', 'fmSide');
    side.append(make('span', `tpChip${p.where.key === 'home' ? ' green' : ''}`, t(`fm.chip.${p.where.key}`)));
    if (p.battery !== null) side.append(make('small', `fmBat${p.battery < LOW_PHONE && !p.charging ? ' low' : ''}`, `${p.charging ? '🔌' : '📱'} ${p.battery} %`));
    c.append(avatar(p), txt, side);
    const says = p.presence?.says || [];
    if (says.length) {                                 // what says where the person is (#495)
      const list = make('div', 'fmSrc');
      says.forEach((x) => {
        const r = make('div', x.home === true ? 'yes' : x.home === false ? 'no' : '');
        r.dataset.kind = x.kind;
        r.append(make('span', '', SRC_ICON[x.kind] || '•'), make('span', 'fmSrcText', sourceText(x)));
        if (x.since) r.append(make('small', '', clock(x.since)));
        list.append(r);
      });
      c.append(list);
    }
    return c;
  }
  /** "n Personen zu Hause" with their names and rooms (#495) */
  function homeCard(rows) {
    const home = rows.filter((p) => p.where.key === 'home');
    const c = make('div', `tpCard fmHome${home.length ? '' : ' none'}`);
    c.append(make('span', 'fmHomeIcon', home.length ? '🏠' : '🚪'));
    const txt = make('div');
    txt.append(make('b', '', home.length === 0 ? t('fm.home0') : home.length === 1 ? t('fm.home1') : t('fm.homeN', { n: home.length })));
    if (home.length) txt.append(make('div', 'tpSub', home.map((p) => (p.presence?.room ? `${p.name} (${p.presence.room})` : p.name)).join(' · ')));
    c.append(txt);
    return c;
  }
  /** the rooms with somebody in them: a person's phone there, or the room's presence sensor (#495) */
  function roomsCard(rows, rooms) {
    const byRoom = new Map();
    rows.forEach((p) => { if (p.where.key === 'home' && p.presence?.room) byRoom.set(p.presence.room, [...(byRoom.get(p.presence.room) || []), p.name]); });
    rooms.forEach((name) => { if (!byRoom.has(name)) byRoom.set(name, []); });
    if (!byRoom.size) return null;
    const c = make('div', 'tpCard fmRooms');
    c.append(make('h3', 'peH', t('fm.rooms')));
    [...byRoom].forEach(([room, who]) => {
      const r = make('div', 'tdRow');
      r.append(make('span', 'tdWhat', room), make('small', 'tpSub', who.length ? who.join(', ') : t('fm.roomMotion')));
      c.append(r);
    });
    return c;
  }
  /** the skeleton once (the pinboard's form keeps what is typed), the people and the notes again when they changed */
  function build() {
    const head = make('div', 'tpHead'); head.append(make('h2', '', `👨‍👩‍👧 ${t('tab.family')}`));
    box = make('div', 'fmGrid');
    board = make('div', 'tpCard pbBoard'); board.append(make('h3', 'peH', `📌 ${t('pb.title')}`));
    notesBox = make('div'); form = ctx.pinboard.form();
    board.append(notesBox, form.el);
    board.addEventListener('focusout', () => { if (later) { later = false; setTimeout(draw); } });
    el.replaceChildren(head, box);
    drawn = '';
  }
  function draw(force = false) {
    if (!box || !el.contains(box)) return;
    const rows = familyRows(people, ctx.states(), ctx.names(), ctx.presence?.() || {});
    const rooms = (ctx.rooms?.() || []).filter((r) => r.occupied).map((r) => r.name);   // once per draw: every room's summary
    const sig = JSON.stringify([rows, rooms, ctx.pinboard.rev(), lang()]);
    if (sig === drawn && !force) return;
    notesBox.replaceChildren(ctx.pinboard.list({ del: true }));
    form.refresh();
    if (document.activeElement?.tagName === 'TEXTAREA' && board.contains(document.activeElement) && !force) { later = true; return; }   // typing a note: the cards move after it
    drawn = sig;
    const items = rows.length ? [{ key: 'home', el: homeCard(rows), width: 4 }] : [];
    items.push(...rows.map((p) => ({ key: `p:${p.id}`, name: p.name, el: personCard(p), width: 1 })));
    const where = roomsCard(rows, rooms);
    if (where) items.push({ key: 'rooms', el: where, width: 2 });
    if (!rows.length) items.push({ key: 'nobody', el: make('p', 'tpSub', t('fm.nobody')), width: 2 });
    items.push({ key: 'pinboard', el: board, width: 2 });
    ctx.board.fill('family', box, items, { min: 320 });
  }
  return {
    render: () => { build(); draw(true); load(); ctx.pinboard.load(); },
    update: () => { draw(); load(); ctx.pinboard.load(); },
    has: () => hasFamily(ctx.states()),
    reset: () => { drawn = ''; },
    changed: () => draw(),                             // the pinboard changed (pinboardui.js)
  };
}
