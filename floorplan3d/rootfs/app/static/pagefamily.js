/* The page 👨‍👩‍👧 Familie of the tab bar (#483): every person of Home Assistant with a picture (or a coloured letter), where (at home, a
 * zone, away), since when and the battery of the phone; beside it the pinboard with "Neue Notiz" (pinboardui.js). The add-on finds the
 * pictures and the phones (api/family, asked again every few minutes and when somebody moves); the rules are in family.js (tested). */
import { familyRows, avatarHue, whenOf, hasFamily, LOW_PHONE } from './family.js';

const AGAIN = 5 * 60000, MOVED = 30000;

/** ctx: t, el (the page), lang(), states(), names() ({ entity: name }), pinboard (initPinboard), board (pageboard.js, #484: keys
 *  p:<person>, pinboard) */
export function initFamilyPage(ctx) {
  const { t, el } = ctx;
  let people = [], at = 0, asking = null, seen = '', drawn = '', box = null, notesBox = null, form = null, board = null, later = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const lang = () => ctx.lang() || 'de';
  const whereSig = () => JSON.stringify(Object.entries(ctx.states()).filter(([e]) => e.startsWith('person.')).map(([e, s]) => [e, s?.state]));

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
    const where = p.where.key === 'home' ? `🏠 ${t('fm.home')}` : p.where.key === 'zone' ? `📍 ${p.where.zone}` : p.where.key === 'away' ? `🚗 ${t('fm.away')}` : `❔ ${t('fm.unknown')}`;
    txt.append(make('b', 'fmName', p.name), make('div', 'fmWhere', where));
    const s = since(p.since); if (s) txt.append(make('small', 'tpSub', s));
    const side = make('div', 'fmSide');
    side.append(make('span', `tpChip${p.where.key === 'home' ? ' green' : ''}`, t(`fm.chip.${p.where.key}`)));
    if (p.battery !== null) side.append(make('small', `fmBat${p.battery < LOW_PHONE && !p.charging ? ' low' : ''}`, `${p.charging ? '🔌' : '📱'} ${p.battery} %`));
    c.append(avatar(p), txt, side);
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
    if (board.contains(document.activeElement) && !force) { later = true; return; }      // typing a note: the cards move after it
    const rows = familyRows(people, ctx.states(), ctx.names());
    const sig = JSON.stringify([rows, ctx.pinboard.rev(), lang()]);
    if (sig === drawn && !force) return;
    drawn = sig;
    notesBox.replaceChildren(ctx.pinboard.list({ del: true }));
    form.refresh();
    const items = rows.map((p) => ({ key: `p:${p.id}`, el: personCard(p), width: 1 }));
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
