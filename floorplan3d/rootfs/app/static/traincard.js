/* 🚆 The card "Zug" (#550; trains.js has the rules): asks the add-on for the departures of the card's station towards "via" (api/train:
 * Deutsche Bahn through the service of DB Infoscreen, or a sensor of the integration "DB Infoscreen"), again after a minute; on top "mein
 * Zug" big (pünktlich in green, "+5 Min" in yellow, from 6 minutes in red, "fällt aus", the platform and a changed one, "in 11 Min", what
 * the railway says), below the next departures. Also the part of the window "Karte einstellen" for this kind (cardeditor.js): station,
 * direction, mein Zug, how many departures, a sensor of DB Infoscreen instead. */
import { statusOf, minutesTo, platformChanged, mineOf, nextRows, inWords } from './trains.js';

const KEEP = 60000;                                   // the departures of a card are asked again after a minute
const SENSOR = /(^|_)(db|bahn|zug|train|departure|abfahrt|infoscreen)/;

/** ctx: t, entities() ([{ entity_id, name }]), changed() (departures arrived: draw the open page again) */
export function initTrainCard(ctx) {
  const { t } = ctx;
  const got = new Map();                              // "station|via" or "s|sensor" -> { at, rows, error, asking, stamp }
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const keyOf = (c) => (c.sensor ? `s|${c.sensor}` : `${c.station}|${c.via || ''}`);
  function load(c) {
    const key = keyOf(c), h = got.get(key);
    if (h && (h.asking || Date.now() - h.at < KEEP)) return h;
    const next = { at: Date.now(), rows: h?.rows || null, error: h?.error || '', asking: true, stamp: h?.stamp || 0, source: h?.source || '' };
    got.set(key, next);
    const q = new URLSearchParams(c.sensor ? { sensor: c.sensor } : { station: c.station, ...(c.via ? { via: c.via } : {}) });
    fetch(`api/train?${q}`).then((r) => r.json().catch(() => ({}))).then((x) => {
      next.rows = Array.isArray(x.rows) ? x.rows : next.rows || [];
      next.error = x.error || ''; next.stamp = x.at || 0; next.source = x.source || '';
    }).catch(() => { next.rows = next.rows || []; next.error = 'offline'; })
      .finally(() => { next.asking = false; next.at = Date.now(); ctx.changed(); });
    return next;
  }
  const delayText = (s) => (s.kind === 'gone' ? t('tr.gone') : s.kind === 'ok' ? t('tr.onTime') : s.kind === 'unknown' ? t('tr.unknown') : `+${s.delay} ${t('tr.min')}`);

  function mineBlock(c, row, now) {
    const box = make('div', 'trMine'); box.dataset.mine = c.mine;
    if (!row) {
      box.classList.add('trK-unknown');
      box.append(make('div', 'trMineH', t('tr.mineGone', { at: c.mine })));
      return box;
    }
    const s = statusOf(row);
    box.classList.add(`trK-${s.kind}`); box.dataset.kind = s.kind;
    const head = make('div', 'trMineH'); head.append(make('span', '', `🚆 ${t('tr.mine')}`), make('b', '', `${row.train}${row.dest ? ` → ${row.dest}` : ''}`));
    const big = make('div', 'trBig');
    const time = make('span', 'trTime', row.at);
    if (s.kind === 'late' || s.kind === 'bad') { time.classList.add('trOld'); big.append(time, make('span', 'trReal', s.real)); } else big.append(time);
    const chip = make('span', `trChip ${s.kind}`, delayText(s)); chip.dataset.delay = s.kind;
    big.append(chip);
    const facts = make('div', 'trFacts');
    if (row.platform) {
      const p = make('span', `trPlat${platformChanged(row) ? ' moved' : ''}`, `${t('tr.platform')} ${row.platform}`);
      if (platformChanged(row)) p.append(make('small', '', ` ${t('tr.instead', { p: row.planned })}`));
      facts.append(p);
    }
    if (s.kind !== 'gone') facts.append(make('span', 'trIn', inWords(minutesTo(row, now), t)));
    box.append(head, big, facts);
    if (row.notes?.length) box.append(make('p', 'trNote', `ℹ️ ${row.notes[0]}`));
    return box;
  }

  /** the card's body into box (cardsui.js put its heading above) */
  function render(c, box) {
    const now = new Date(), h = load(c);
    if (!h.rows) { box.append(make('p', 'tpSub', t('tp.today.loading'))); return; }
    if (h.error && !h.rows.length) {
      box.append(make('p', 'tpSub trErr', h.error === 'nohass' ? t('tr.nohass') : /^(300|404)$|unknown|unbekannt|ambiguous/i.test(h.error) ? t('tr.noStation', { s: c.station }) : t('tr.error', { why: h.error })));
      return;
    }
    const mine = c.mine ? mineOf(h.rows, c.mine) : null;
    if (c.mine) box.append(mineBlock(c, mine, now));
    const list = make('div', 'trList');
    nextRows(h.rows, now, c.count, mine).forEach((row) => {
      const s = statusOf(row), r = make('div', `trRow trK-${s.kind}`); r.dataset.train = row.train;
      const tm = make('span', 'trT', row.at);
      if (s.kind === 'late' || s.kind === 'bad') tm.append(make('small', `trD ${s.kind}`, ` +${s.delay}`));
      r.append(tm, make('b', 'trN', row.train), make('span', 'trDest', row.dest || ''),
        make('span', `trP${platformChanged(row) ? ' moved' : ''}`, s.kind === 'gone' ? t('tr.gone') : row.platform ? `${t('tr.pl')} ${row.platform}` : ''));
      list.append(r);
    });
    if (!list.childNodes.length && !c.mine) list.append(make('p', 'tpSub', t('tr.none')));
    box.append(list);
    const at = h.stamp ? new Date(h.stamp * 1000) : null;
    const foot = make('small', 'trFoot', [c.sensor ? t('tr.fromSensor') : `${c.station}${c.via ? ` → ${c.via}` : ''}`,
      at ? t('tr.stamp', { at: `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}` }) : ''].filter(Boolean).join(' · '));
    box.append(foot);
  }
  /** what the card shows depends on: its departures and the minute (the countdown) */
  function sig(c) {
    const h = got.get(keyOf(c));
    return [h?.at, h?.asking, h?.rows?.length ?? -1, h?.error, Math.floor(Date.now() / 60000)];
  }

  /**
   * The part of "Karte einstellen" (cardeditor.js) for a train card: draft is the card being set; ui: { field(label, ...nodes),
   * seg(values, text, key), preview() }. The texts are taken when a field is left (not every letter asks the railway).
   */
  function fields(draft, ui) {
    draft.count = draft.count || 4;
    const input = (key, ph, type = 'text') => {
      const i = make('input', 'ceInput'); i.type = type; i.value = draft[key] || ''; i.placeholder = ph; i.dataset.field = key; i.maxLength = 60;
      i.addEventListener('change', () => { draft[key] = i.value.trim(); ui.preview(); });
      return i;
    };
    ui.field(t('tr.station'), input('station', t('tr.stationPh')));
    ui.field(t('tr.via'), input('via', t('tr.viaPh')));
    ui.field(t('tr.mineField'), input('mine', '07:12', 'time'), make('small', 'tpSub', t('tr.mineHelp')));
    ui.field(t('tr.count'), ui.seg([3, 4, 6, 8], (n) => String(n), 'count'));
    const sensors = (ctx.entities() || []).filter((e) => e.entity_id.startsWith('sensor.') && SENSOR.test(e.entity_id.slice(7)));
    if (sensors.length || draft.sensor) {
      const sel = make('select', 'ceSelect'); sel.dataset.field = 'sensor';
      sel.append(new Option(t('tr.noSensor'), ''), ...sensors.map((e) => new Option(e.name || e.entity_id, e.entity_id)));
      if (draft.sensor && !sensors.some((e) => e.entity_id === draft.sensor)) sel.append(new Option(draft.sensor, draft.sensor));
      sel.value = draft.sensor || '';
      sel.addEventListener('change', () => { draft.sensor = sel.value; ui.preview(); });
      ui.field(t('tr.sensor'), sel, make('small', 'tpSub', t('tr.sensorHelp')));
    }
  }
  return { render, sig, fields };
}
