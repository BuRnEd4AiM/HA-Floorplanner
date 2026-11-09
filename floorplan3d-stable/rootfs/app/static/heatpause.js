/* ⏸️ Heizplan aussetzen (the owner, 2026-11-08: "gedrückt halten und dann sagen, Heizplan aussetzen für heute oder für eine halbe,
 * dreiviertel Stunde, und das überschreibt halt alle anderen Sachen, dass man selbst manuell regeln kann … für bestimmte Benutzer oder für
 * bestimmte Dashboards"; pictures docs/ideen-4.71/): which choices a thermostat's button offers and until when, what the line of a paused
 * room says, and who gets the button. The add-on decides the same way (heatrules.py pause_until, next_block); this file only shows it.
 * Pure (no DOM; unit test: tests/heatpause.test.mjs); heatpauseui.js draws. */

/** every choice an admin can offer, in this order: minutes, until the next block of the schedule, until midnight */
export const PAUSE_OPTS = ['15', '30', '45', '60', '90', '120', '180', 'block', 'day'];
/** the choices offered when an admin chose none */
export const DEFAULT_OPTS = ['30', '45', '60', 'block', 'day'];
/** how long the button is held before the choice opens (a tap does nothing: no pause by mistake) */
export const HOLD_MS = 700;
/** "＋15 Min" while paused */
export const MORE_MIN = 15;

/** Monday 0 … Sunday 6, as the add-on counts */
const weekday = (d) => (d.getDay() + 6) % 7;

/** the level of a room's schedule ({ days: [7 days of [[minute, level]]], Monday first }) at a weekday and minute; before the first
 *  block of a day the last one of the days before (heatrules.plan_at) */
export function planAt(plan, wd, minute) {
  const days = plan?.days || [];
  for (let back = 0; back < 8; back++) {
    const day = days[(((wd - back) % 7) + 7) % 7] || [];
    const pts = day.filter((p) => back > 0 || p[0] <= minute);
    if (pts.length) return pts[pts.length - 1][1];
  }
  return null;
}

/** the minutes from date until the schedule changes its level (the next block with another level), null without one */
export function nextBlock(plan, date) {
  if (!plan?.days) return null;
  const m0 = date.getHours() * 60 + date.getMinutes(), wd = weekday(date), now = planAt(plan, wd, m0);
  for (let d = 0; d < 8; d++) {
    for (const [m, lv] of plan.days[(wd + d) % 7] || []) {
      if ((d > 0 || m > m0) && lv !== now) return d * 1440 + m - m0;
    }
  }
  return null;
}

/** the choices of a room's button: [{ k, until (ms) }] in the order of PAUSE_OPTS; "block" only when the room has a schedule.
 *  heat: the heating rules of api/rules; key: the room's key (<house>/<room>) */
export function pauseChoices(heat, key, date = new Date()) {
  const p = heat?.pause;
  if (!p?.on) return [];
  const opts = (Array.isArray(p.opts) && p.opts.length ? p.opts : DEFAULT_OPTS).filter((k) => PAUSE_OPTS.includes(k));
  const t0 = date.getTime() - date.getSeconds() * 1000 - date.getMilliseconds();
  const out = [];
  PAUSE_OPTS.filter((k) => opts.includes(k)).forEach((k) => {
    if (/^\d+$/.test(k)) out.push({ k, until: date.getTime() + Number(k) * 60000 });
    else if (k === 'day') out.push({ k, until: t0 + (1440 - date.getHours() * 60 - date.getMinutes()) * 60000 });
    else {
      const plan = heat?.schedule?.on ? heat.schedule.rooms?.[key] : null, m = nextBlock(plan, date);
      if (m != null) out.push({ k, until: t0 + m * 60000 });
    }
  });
  return out;
}

/** the text of a choice: "45 Min", "1 Std", "Bis zum nächsten Block", "Für heute" */
export function optText(k, t) {
  if (k === 'block') return t('hp.opt.block');
  if (k === 'day') return t('hp.opt.day');
  const n = Number(k);
  return n >= 60 && n % 60 === 0 ? t('fl.hour', { n: n / 60 }) : t('fl.min', { n });
}

/** may the button be shown: the pause is on, the thermostat heats (an air conditioner only gets the window rule), the user may (no lock
 *  "control" or "heatPause"), the card does not hide it (an own card's switch "pause": false) */
export function canPause(heat, { heater = true, locks = [], card = null } = {}) {
  return !!heat?.pause?.on && heater && !locks.includes('control') && !locks.includes('heatPause') && card?.pause !== false;
}

/** a room's state of the pause from its status (api/rules; an open window may act during it): { on, until (ms) } */
export function pauseState(status) {
  return typeof status?.pause === 'number' && status.pause > 0 ? { on: true, until: status.pause * 1000 } : { on: false, until: null };
}

/** "13:15", or "morgen 06:00" when it ends another day than now */
export function untilText(until, t, now = Date.now()) {
  const d = new Date(until), n = new Date(now);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === n.toDateString()) return hm;
  if (d.getHours() === 0 && d.getMinutes() === 0 && d.getTime() - now <= 86400000) return t('hp.midnight');
  return t('hp.tomorrow', { at: hm });
}
