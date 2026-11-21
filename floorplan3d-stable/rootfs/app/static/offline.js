/* Offline devices: every placed entity that Home Assistant reports as unavailable (or unknown), or that does not exist any more (renamed / deleted),
 * in one list that is always one tap away. The decisions are pure functions (tested); the pill and the dialog are drawn by initOffline. */
import { ringEntities } from './ledring.js';
import { openingWalls } from './dormerwin.js';
import { shutterEntities } from './shutters.js';
import { unwatched, floorsToLeaveOut, unwatchedSummary } from './nowatch.js';

const SMART_CATS = new Set(['lighting', 'smart']);   // devices that belong to an entity (furniture, garden and pictures do not)
const NOT_SMART = new Set(['tv_led', 'radiator', 'boiler']);   // a radiator or a hot-water tank is often just drawn, without an entity
const UNKNOWN_IS_FINE = new Set(['scene', 'script', 'automation', 'button', 'input_button', 'event', 'input_text', 'text', 'notify', 'tts', 'conversation']);

/** why an entity counts as offline: 'unavailable' | 'unknown' | 'missing', or null when it is fine */
export function offlineReason(states, id) {
  const s = states[id];
  if (!s) return 'missing';
  if (s.state === 'unavailable') return 'unavailable';
  if (s.state === 'unknown' && !UNKNOWN_IS_FINE.has(id.split('.')[0])) return 'unknown';
  return null;
}
/**
 * [{ entity, reason, since, floor, kind, id, name, room }] of every placed lamp or smart device without an entity (reason 'unlinked') and every placed device,
 * LED ring section, TV backlight, door / window contact and roller shutter (also of a door, each part, #779) that is offline. What is not watched
 * (its own tick or its floor's, nowatch.js, #780) is never listed.
 * `env`: { layout, entities, states, t, catOf(type), pointInPoly(x, z, pts) }
 */
export function offlineDevices(env) {
  const { layout, entities, states, t } = env;
  if (!entities.length) return [];                     // states not loaded yet: nothing is known to be offline
  const out = [], seen = new Set();
  const add = (entity, floor, kind, id, name, x, z, f) => {
    if (!entity || seen.has(`${id}|${entity}`)) return;
    seen.add(`${id}|${entity}`);
    const reason = offlineReason(states, entity);
    if (!reason) return;
    const room = x == null ? null : f.rooms.find((r) => env.pointInPoly(x, z, r.points));
    out.push({ entity, reason, since: states[entity]?.since || null, floor, kind, id, name, room: room?.name || '' });
  };
  layout.floors.forEach((f, fi) => {
    if (unwatched(f)) return;                          // the flat upstairs that belongs to someone else (#780)
    f.devices.forEach((d) => {
      if (unwatched(f, d)) return;
      const name = d.name || entities.find((e) => e.entity_id === d.entity)?.name || t(`dev.${d.type}`);
      const smart = SMART_CATS.has(env.catOf(d.type)) && !NOT_SMART.has(d.type);
      if (smart && !d.entity && !(d.type === 'ledring' && ringEntities(d).length)) {   // a lamp or sensor without its Home Assistant entity
        const room = f.rooms.find((r) => env.pointInPoly(d.x, d.z, r.points));
        out.push({ entity: '', reason: 'unlinked', since: null, floor: fi, kind: 'device', id: d.id, name, room: room?.name || '' });
      }
      add(d.entity, fi, 'device', d.id, name, d.x, d.z, f);
      add(d.ledEntity, fi, 'device', d.id, name, d.x, d.z, f);
      (d.leds || []).forEach((e) => add(e, fi, 'device', d.id, name, d.x, d.z, f));   // the LED zones of a piece with entities of their own (ledzones.js)
      if (d.type === 'ledring') ringEntities(d).forEach((e) => add(e, fi, 'device', d.id, name, d.x, d.z, f));
    });
    openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
      if (unwatched(f, o)) return;
      add(o.entity, fi, 'opening', o.id, o.name || t(`prop.${o.type}`), (w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, f);
      shutterEntities(o).forEach((e) => add(e, fi, 'opening', o.id, o.name || t('curtain.title'), (w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, f));   // its cover(s) (#331, #779)
    }));
  });
  return out.sort((a, b) => a.floor - b.floor || a.room.localeCompare(b.room) || a.name.localeCompare(b.name));
}

/** ctx: $, t, layout(), entities(), states(), catOf, pointInPoly, currentLanguage(), houseMode(), floorIdx(), switchFloor(i), isLive(), liveSelect(h), selectLocked(sel),
 *  jump(target) (optional: fly there like the search, true when done), canEdit() and leaveOut(x | { floor }) (optional, #780: "🔕 Nicht
 *  überwachen" on a row, or for a whole floor: the tick is set and saved) */
export function initOffline(ctx) {
  const { $, t } = ctx;
  const env = () => ({ layout: ctx.layout(), entities: ctx.entities(), states: ctx.states(), t, catOf: ctx.catOf, pointInPoly: ctx.pointInPoly });
  const devices = () => offlineDevices(env());
  let offlineSig = '';
  function update() {
    const list = devices(), pill = $('#offlinePill');
    pill.hidden = !ctx.entities().length;                     // always there once the states are known, also with nothing offline
    pill.classList.toggle('warn', list.length > 0);
    pill.classList.toggle('ok', !list.length);
    pill.textContent = list.length ? t('off.pill', { n: list.length }) : t('off.pillOk');
    const sig = JSON.stringify(list.map((x) => [x.id, x.entity, x.reason]));
    if (sig !== offlineSig) { offlineSig = sig; if ($('#offlineDialog').open) renderList(); }
    return list;
  }
  function sinceText(iso) {
    const ms = Date.parse(iso || '');
    if (!ms) return '';
    const sec = Math.round((ms - Date.now()) / 1000), rtf = new Intl.RelativeTimeFormat(ctx.currentLanguage(), { numeric: 'auto' });
    for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(sec) >= n) return rtf.format(Math.round(sec / n), u);
    return rtf.format(sec, 'second');
  }
  const canLeave = () => !!ctx.leaveOut && ctx.canEdit?.() !== false;
  /** "🔕 Nicht überwachen" (#780): the tick on x (a row) or on its floor ({ floor }), then the list again */
  function leave(x) { ctx.leaveOut(x); update(); renderList(); }
  function renderList() {
    const ul = $('#offlineList'), list = devices(), lay = ctx.layout();
    ul.replaceChildren();
    $('#offlineNone').hidden = !!list.length;
    list.forEach((x) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      const name = document.createElement('strong'); name.textContent = x.name;
      const why = document.createElement('span'); why.className = `offWhy ${x.reason}`; why.textContent = t(`off.${x.reason}`);
      const meta = document.createElement('small');
      meta.textContent = [lay.floors[x.floor]?.name, x.room, x.entity, x.since ? t('off.since', { t: sinceText(x.since) }) : ''].filter(Boolean).join(' · ');
      b.append(name, why, meta);
      b.addEventListener('click', () => { $('#offlineDialog').close(); show(x); });
      li.append(b);
      if (canLeave()) {
        const nw = document.createElement('button'); nw.type = 'button'; nw.className = 'offLeave'; nw.textContent = '🔕';
        nw.title = t('nw.row'); nw.setAttribute('aria-label', t('nw.row'));
        nw.addEventListener('click', () => leave(x));
        li.classList.add('withLeave'); li.append(nw);
      }
      ul.append(li);
    });
    const foot = $('#offlineFoot');
    if (!foot) return;
    foot.replaceChildren();
    if (canLeave()) floorsToLeaveOut(list, lay).forEach((g) => {     // the flat upstairs that belongs to someone else: the whole floor at once
      const fb = document.createElement('button'); fb.type = 'button'; fb.className = 'offLeaveFloor'; fb.dataset.floor = g.floor;
      fb.textContent = `🔕 ${t('nw.floorBtn', { name: g.name, n: g.n })}`;
      fb.addEventListener('click', () => leave({ floor: g.floor }));
      foot.append(fb);
    });
    const sum = unwatchedSummary(lay);                               // what is left out, so that nobody wonders where it went
    if (sum.floors.length || sum.things) {
      const p = document.createElement('p'); p.className = 'sub'; p.id = 'offlineLeft';
      p.textContent = `🔕 ${[sum.floors.length ? t('nw.leftFloors', { names: sum.floors.join(', ') }) : '', sum.things ? t('nw.leftThings', { n: sum.things }) : ''].filter(Boolean).join(' · ')} ${t('nw.leftHow')}`;
      foot.append(p);
    }
  }
  /** go to the floor of an offline device and point it out */
  function show(x) {
    if (ctx.jump?.(x)) return;                                   // like the search: the camera flies there, a ring marks it (#215)
    if (ctx.houseMode() || ctx.floorIdx() !== x.floor) ctx.switchFloor(x.floor);
    if (ctx.isLive()) ctx.liveSelect({ kind: x.kind, id: x.id });
    else ctx.selectLocked({ kind: x.kind, id: x.id });
  }
  $('#offlinePill').addEventListener('click', () => { renderList(); $('#offlineDialog').showModal(); });
  return { update, show, devices };
}
