/* The pinboard (#483): notes for everybody, kept by the add-on (api/pinboard, the same on every screen), on the page 👨‍👩‍👧 Familie with
 * "Neue Notiz" (a colour, "auch aufs Handy" when the messages of "Benachrichtigung bei Alarm" are set up) and ✕ on each note, and as a
 * small card on ☀ Heute (a tap leads to the family page). Other screens see a new note within a minute (asked again while a page with
 * the notes is open). The rules are in family.js (tested). */
import { pinNotes, cleanNote, nextColor, whenOf, NOTE_COLORS, MAX_NOTE } from './family.js';

const POLL = 60000;

/** ctx: t, lang(), changed() (the pages with the notes draw them again) */
export function initPinboard(ctx) {
  const { t } = ctx;
  let notes = [], canSend = false, at = 0, asking = null, rev = 0;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const lang = () => ctx.lang() || 'de';

  function take(x) {
    const next = pinNotes(x?.notes);
    if (JSON.stringify(next) !== JSON.stringify(notes) || !!x?.canSend !== canSend) { notes = next; canSend = !!x?.canSend; rev++; ctx.changed(); }
  }
  /** the notes again (at most once a minute unless forced) */
  function load(force = false) {
    if (asking || (!force && Date.now() - at < POLL)) return asking;
    at = Date.now();
    asking = fetch('api/pinboard').then((r) => (r.ok ? r.json() : null)).then((x) => { if (x) take(x); }).catch(() => {}).finally(() => { asking = null; });
    return asking;
  }
  /** a new note -> { ok, sent (true / false when it was to go to the phones too) } */
  async function add(text, color, send) {
    const clean = cleanNote(text);
    if (!clean) return { ok: false };
    try {
      const r = await fetch('api/pinboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: clean, color, send: !!send }) });
      if (!r.ok) return { ok: false };
      const x = await r.json(); take(x); at = Date.now();
      return { ok: true, sent: x.sent };
    } catch { return { ok: false }; }
  }
  async function remove(id) {
    try {
      const r = await fetch(`api/pinboard/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (r.ok) { take(await r.json()); at = Date.now(); }
    } catch { /* stays; the next load shows the truth */ }
  }
  /** when a note was written, short: 11:48, gestern, Mo, 12.10. */
  function when(d) {
    const w = whenOf(d);
    if (!w) return '';
    const f = (o) => new Intl.DateTimeFormat(lang(), o).format(w.date);
    return w.key === 'time' ? f({ hour: '2-digit', minute: '2-digit' }) : w.key === 'yesterday' ? t('fm.yesterday') : w.key === 'day' ? f({ weekday: 'short' }) : f({ day: 'numeric', month: 'numeric' });
  }
  function noteEl(n, del) {
    const d = make('div', `pbNote ${n.color}`); d.dataset.note = n.id;
    d.append(make('div', 'pbText', n.text), make('small', 'pbMeta', [n.by, when(n.at)].filter(Boolean).join(' · ')));
    if (del) {
      const x = make('button', 'pbDel', '✕'); x.type = 'button'; x.title = t('pb.del'); x.setAttribute('aria-label', t('pb.del'));
      x.addEventListener('click', (e) => { e.stopPropagation(); remove(n.id); });
      d.append(x);
    }
    return d;
  }
  /** the notes: with ✕ (the family page) or at most `max` of them without (☀ Heute) */
  function list({ del = false, max = 0 } = {}) {
    const box = make('div', 'pbNotes');
    (max ? notes.slice(0, max) : notes).forEach((n) => box.append(noteEl(n, del)));
    if (!notes.length) box.append(make('p', 'tpSub pbEmpty', t('pb.empty')));
    else if (max && notes.length > max) box.append(make('p', 'tpSub', t('pb.more', { n: notes.length - max })));
    return box;
  }
  /** the form "Neue Notiz": text, colour, "auch aufs Handy", pin; drawn once, it keeps what is typed while the notes change */
  function form() {
    const f = make('form', 'pbForm');
    const text = make('textarea', 'pbInput'); text.maxLength = MAX_NOTE; text.rows = 2; text.placeholder = t('pb.placeholder'); text.setAttribute('aria-label', t('pb.new'));
    const colors = make('div', 'pbColors');
    let color = nextColor(notes);
    const mark = () => colors.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.color === color));
    NOTE_COLORS.forEach((c) => { const b = make('button', `pbColor ${c}`); b.type = 'button'; b.dataset.color = c; b.title = t(`pb.color.${c}`); b.addEventListener('click', () => { color = c; mark(); }); colors.append(b); });
    mark();
    const sendLab = make('label', 'pbSend'), send = make('input'); send.type = 'checkbox';
    sendLab.append(send, document.createTextNode(` 📲 ${t('pb.send')}`));
    const pin = make('button', 'primary pbPin', `📌 ${t('pb.pin')}`); pin.type = 'submit';
    const say = make('small', 'pbSay');
    const row = make('div', 'pbRow'); row.append(colors, sendLab, pin);
    f.append(text, row, say);
    const refresh = () => { sendLab.hidden = !canSend; };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!cleanNote(text.value)) { text.focus(); return; }
      pin.disabled = true; say.textContent = '';
      const r = await add(text.value, color, send.checked && canSend);
      pin.disabled = false;
      if (!r.ok) { say.textContent = t('pb.failed'); return; }
      text.value = ''; send.checked = false; color = nextColor(notes); mark();
      say.textContent = r.sent === true ? `✓ ${t('pb.sent')}` : r.sent === false ? t('pb.notSent') : '';
    });
    text.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.requestSubmit(); });
    refresh();
    return { el: f, refresh };
  }
  return { load, add, remove, list, form, notes: () => notes, rev: () => rev };
}
