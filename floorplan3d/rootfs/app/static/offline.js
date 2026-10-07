/* Offline devices: every placed entity that Home Assistant reports as unavailable (or unknown), or that does not exist any more (renamed / deleted),
 * in one list that is always one tap away. The decisions are pure functions (tested); the pill and the dialog are drawn by initOffline. */
import { ringEntities } from './ledring.js';
import { openingWalls } from './dormerwin.js';

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
 * LED ring section, TV backlight and door / window contact that is offline.
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
    f.devices.forEach((d) => {
      const name = d.name || entities.find((e) => e.entity_id === d.entity)?.name || t(`dev.${d.type}`);
      const smart = SMART_CATS.has(env.catOf(d.type)) && !NOT_SMART.has(d.type);
      if (smart && !d.entity && !(d.type === 'ledring' && ringEntities(d).length)) {   // a lamp or sensor without its Home Assistant entity
        const room = f.rooms.find((r) => env.pointInPoly(d.x, d.z, r.points));
        out.push({ entity: '', reason: 'unlinked', since: null, floor: fi, kind: 'device', id: d.id, name, room: room?.name || '' });
      }
      add(d.entity, fi, 'device', d.id, name, d.x, d.z, f);
      add(d.ledEntity, fi, 'device', d.id, name, d.x, d.z, f);
      if (d.type === 'ledring') ringEntities(d).forEach((e) => add(e, fi, 'device', d.id, name, d.x, d.z, f));
    });
    openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
      add(o.entity, fi, 'opening', o.id, o.name || t(`prop.${o.type}`), (w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, f);
    }));
  });
  return out.sort((a, b) => a.floor - b.floor || a.room.localeCompare(b.room) || a.name.localeCompare(b.name));
}

/** ctx: $, t, layout(), entities(), states(), catOf, pointInPoly, currentLanguage(), houseMode(), floorIdx(), switchFloor(i), isLive(), liveSelect(h), selectLocked(sel),
 *  jump(target) (optional: fly there like the search, true when done) */
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
  }
  function sinceText(iso) {
    const ms = Date.parse(iso || '');
    if (!ms) return '';
    const sec = Math.round((ms - Date.now()) / 1000), rtf = new Intl.RelativeTimeFormat(ctx.currentLanguage(), { numeric: 'auto' });
    for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(sec) >= n) return rtf.format(Math.round(sec / n), u);
    return rtf.format(sec, 'second');
  }
  function renderList() {
    const ul = $('#offlineList'), list = devices();
    ul.replaceChildren();
    $('#offlineNone').hidden = !!list.length;
    list.forEach((x) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      const name = document.createElement('strong'); name.textContent = x.name;
      const why = document.createElement('span'); why.className = `offWhy ${x.reason}`; why.textContent = t(`off.${x.reason}`);
      const meta = document.createElement('small');
      meta.textContent = [ctx.layout().floors[x.floor]?.name, x.room, x.entity, x.since ? t('off.since', { t: sinceText(x.since) }) : ''].filter(Boolean).join(' · ');
      b.append(name, why, meta);
      b.addEventListener('click', () => { $('#offlineDialog').close(); show(x); });
      li.append(b); ul.append(li);
    });
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
