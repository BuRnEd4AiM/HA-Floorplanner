/* 🧺 Haushalt (#490): what a card of the page says about a machine (the add-on found it and says what it does: household.py), the robot
 * vacuums and the shopping list. Pure rules (unit test: tests/household.test.mjs); pagehousehold.js draws. */

export const KINDS = ['washer', 'dryer', 'dishwasher'];
export const KIND_ICON = { washer: '🫧', dryer: '🌀', dishwasher: '🍽️' };
const ms = (iso) => { const t = Date.parse(iso || ''); return Number.isFinite(t) ? t : null; };

/** minutes until `endsAt` (rounded up), null without one or when it is past */
export function minutesLeft(endsAt, now) {
  const e = ms(endsAt);
  return e != null && e > now ? Math.ceil((e - now) / 60000) : null;
}

/** how far a run is, 0 to 100: what the machine says, else from its start and its expected end; null when unknown */
export function progressOf(a, now) {
  if (a?.phase !== 'running') return null;
  if (Number.isFinite(a.progress)) return Math.max(0, Math.min(100, a.progress));
  const s = ms(a.since), e = ms(a.endsAt);
  return s != null && e != null && e > s ? Math.max(0, Math.min(100, Math.round(((now - s) / (e - s)) * 100))) : null;
}

/** 'today' | 'yesterday' | 'date' for a time shown as "heute 19:40", "gestern 19:40" or "Mo, 20.10." */
export function dayOf(iso, now) {
  const t = ms(iso);
  if (t == null) return null;
  const d = new Date(t), n = new Date(now), y = new Date(now); y.setDate(n.getDate() - 1);
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  return same(d, n) ? 'today' : same(d, y) ? 'yesterday' : 'date';
}

/**
 * What the card of a machine shows: { kind, tone (running | done | off | error), line: [{ key, vars }] (the small line, parts joined by
 * " · "), right: { key, vars } | null (big on the right: the minutes left, "aus" ...), badge: key | null, bar (0 to 100, null: none),
 * ack (the button "✓ Ausgeräumt") }. Texts are keys of i18n.js (hh.*), times stay ISO for the page to write.
 */
export function applianceView(a, now) {
  const line = [], left = minutesLeft(a.endsAt, now);
  if (a.program) line.push({ key: 'hh.program', vars: { p: a.program } });
  let tone = 'off', right = null, badge = null;
  if (a.phase === 'running') {
    tone = 'running';
    if (a.endsAt) line.push({ key: 'hh.endsAt', vars: { at: a.endsAt } });
    else if (a.since) line.push({ key: 'hh.since', vars: { at: a.since } });
    else line.push({ key: 'hh.running' });
    right = left != null ? { key: 'hh.left', vars: { n: left } } : { key: 'hh.runningShort' };
  } else if (a.phase === 'waiting') {
    tone = 'running';
    line.push(a.state ? { key: 'hh.state', vars: { s: a.state } } : { key: 'hh.waiting' });
    right = { key: 'hh.waitingShort' };
  } else if (a.phase === 'done') {
    tone = 'done';
    line.push(a.since ? { key: 'hh.doneSince', vars: { at: a.since } } : { key: 'hh.doneNow' }, { key: 'hh.empty' });
    badge = 'hh.badgeDone';
  } else if (a.phase === 'error') {
    tone = 'error';
    line.push(a.state ? { key: 'hh.state', vars: { s: a.state } } : { key: 'hh.error' });
    badge = 'hh.badgeError';
  } else if (a.phase === 'gone') {
    line.push({ key: 'hh.gone' });
  } else {
    if (a.since) line.push({ key: 'hh.last', vars: { at: a.since } });
    else if (a.phase === 'unknown' && a.state) line.push({ key: 'hh.state', vars: { s: a.state } });
    right = { key: 'hh.off' };
  }
  return { kind: a.kind, tone, line, right, badge, bar: progressOf(a, now), ack: a.phase === 'done' };
}

/** the number on the tab: machines that are done and wait to be emptied */
export const doneCount = (appliances) => (Array.isArray(appliances) ? appliances.filter((a) => a?.phase === 'done').length : 0);

/** the robot vacuums of Home Assistant: [{ entity, name, state, battery }] by name */
export function vacuums(states, names = {}) {
  return Object.entries(states || {}).filter(([id]) => id.startsWith('vacuum.'))
    .map(([id, s]) => ({ entity: id, name: names[id] || s?.name || id, state: s?.state || 'unknown', battery: Number.isFinite(s?.bat) ? Math.round(s.bat) : null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** the page has something: a machine the add-on found, a robot vacuum or a to-do list of Home Assistant */
export const hasHousehold = (states, appliances) => (Array.isArray(appliances) && appliances.length > 0)
  || Object.keys(states || {}).some((id) => id.startsWith('vacuum.') || id.startsWith('todo.'));

/** a new item of the shopping list as typed: trimmed, one line, at most 200 characters; '' for nothing */
export const cleanItem = (v) => (typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f\s]+/g, ' ').trim().slice(0, 200) : '');
