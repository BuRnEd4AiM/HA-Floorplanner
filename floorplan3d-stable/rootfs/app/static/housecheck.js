/* 🩺 Haus-Check mit 🔧 Wartung (5.24.0, the owner's choice docs/ideen-5.21 picture 1, docs/ideen-5.15 picture 9): everything that needs a
 * look in one place, urgent first (empty batteries, devices offline, maintenance that is due), then soon (weak radio, an update of Home
 * Assistant, maintenance in the next two weeks), then the rest of the maintenance. A reminder is { id, name, icon, every (days), last
 * ('YYYY-MM-DD' or ''), device (an id of the plan or '') }, kept in settings.maintenance (maintenance.py checks it on the server);
 * "✓ Erledigt" sets last to today. Suggestions come from the devices of the plan (smoke detector: test once a year …).
 * Pure (unit test: tests/housecheck.test.mjs); pagecheck.js draws the page. */

export const SOON_DAYS = 14;
export const MAX_REMINDERS = 60;
const ID = /^m_[a-z0-9]{3,16}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** what the plan's devices suggest: [match(device) → bool, key of the name, icon, every (days)] */
export const SUGGEST = [
  [(d) => /rauch|smoke/i.test(`${d.name} ${d.entity}`) || d.dc === 'smoke', 'mt.smoke', '🚨', 365],
  [(d) => d.type === 'aircon' || /klima|aircon|air_?condition/i.test(`${d.name} ${d.entity}`), 'mt.filter', '❄️', 90],
  [(d) => d.type === 'vacuum' || /saug|vacuum|roborock|roomba/i.test(`${d.name} ${d.entity}`), 'mt.brush', '🧹', 60],
  [(d) => d.type === 'radiator', 'mt.bleed', '🔥', 365],
  [(d) => d.type === 'washer' || /waschmaschine|trockner|washer|washing|dryer/i.test(d.name || ''), 'mt.lint', '🫧', 90],
  [(d) => d.type === 'dishwasher' || /spülmaschine|geschirrspül|dishwash/i.test(d.name || ''), 'mt.sieve', '🍽️', 30],
  [(d) => d.type === 'boiler', 'mt.boiler', '♨️', 365],
];

const pad = (n) => String(n).padStart(2, '0');
/** a Date as 'YYYY-MM-DD' (the browser's day) */
export const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/** the reminders made safe (the same rules as maintenance.clean_reminders on the server) */
export function cleanReminders(list) {
  const ids = new Set();
  return (Array.isArray(list) ? list : []).filter((r) => r && typeof r === 'object' && ID.test(r.id) && !ids.has(r.id) && ids.add(r.id))
    .slice(0, MAX_REMINDERS).map((r) => ({
      id: r.id, name: (typeof r.name === 'string' && r.name.trim() ? r.name.trim() : '?').slice(0, 60),
      icon: typeof r.icon === 'string' && r.icon.trim() && [...r.icon.trim()].length <= 4 ? r.icon.trim() : '🔧',
      every: Number.isInteger(r.every) && r.every >= 1 && r.every <= 3650 ? r.every : 90,
      last: typeof r.last === 'string' && DAY.test(r.last) ? r.last : '',
      device: typeof r.device === 'string' && r.device.length <= 40 ? r.device : '',
    }));
}

/** days until a reminder is due (0 or less: due now); never done: due now */
export function daysLeft(r, today) {
  if (!r.last) return 0;
  const due = toDate(r.last); due.setDate(due.getDate() + r.every);
  return Math.round((due - toDate(today)) / 86400000);
}

/** reminders to suggest for the devices of the plan: [{ key, name, icon, every, device }], each kind once per device, none that a reminder
 *  for the same device and name already has; t: the texts */
export function suggestions(devices, reminders, t) {
  const have = new Set((reminders || []).map((r) => `${r.device}|${r.name}`));
  const out = [];
  (devices || []).forEach((d) => SUGGEST.forEach(([fits, key, icon, every]) => {
    if (!fits(d)) return;
    const name = t(key, { name: d.name || '' }).trim();
    if (!have.has(`${d.id}|${name}`) && !out.some((x) => x.device === d.id && x.key === key)) out.push({ key, name, icon, every, device: d.id });
  }));
  return out.slice(0, 12);
}

/**
 * The check: { urgent: [], soon: [], later: [] }, each [{ kind, id, icon, text, right, q }]:
 * kind 'battery' | 'offline' | 'radio' | 'update' | 'care'; s: { batteries: [{ id, name, level }], offline: [{ id, name, room }],
 * radio: [{ id, name, text, q }], updates: [{ id, name, version }], reminders, today: 'YYYY-MM-DD' }; t: the texts
 */
export function check(s, t) {
  const urgent = [], soon = [], later = [];
  (s.batteries || []).forEach((b) => urgent.push({ kind: 'battery', id: b.id, icon: '🔋', text: t('hc.battery', { name: b.name }), right: b.level == null ? '' : `${b.level} %` }));
  (s.offline || []).forEach((o) => urgent.push({ kind: 'offline', id: o.id, icon: '📴', text: t('hc.offline', { name: o.name }), right: o.room || '' }));
  (s.radio || []).filter((r) => r.q === 'bad').forEach((r) => soon.push({ kind: 'radio', id: r.id, icon: '📡', text: t('hc.radio', { name: r.name }), right: r.text }));
  (s.updates || []).forEach((u) => soon.push({ kind: 'update', id: u.id, icon: '⬆️', text: t('hc.update', { name: u.name }), right: u.version || '' }));
  cleanReminders(s.reminders).map((r) => ({ r, left: daysLeft(r, s.today) })).sort((a, b) => a.left - b.left).forEach(({ r, left }) => {
    const row = { kind: 'care', id: r.id, icon: r.icon, text: r.name, right: left <= 0 ? t('hc.due') : t('hc.inDays', { n: left }), left };
    (left <= 0 ? urgent : left <= SOON_DAYS ? soon : later).push(row);
  });
  return { urgent, soon, later };
}

/** the reminders after "✓ Erledigt" on one of them (done today) */
export const markDone = (list, id, today) => cleanReminders(list).map((r) => (r.id === id ? { ...r, last: today } : r));
/** a new reminder's id that none of `list` has */
export function newId(list, rnd = Math.random) {
  const taken = new Set((list || []).map((r) => r.id));
  for (let i = 0; i < 50; i++) { const id = `m_${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0')}`; if (!taken.has(id)) return id; }
  return `m_${Date.now().toString(36)}`;
}
