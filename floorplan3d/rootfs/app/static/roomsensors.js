/* 🌡 Raumfühler (#573, the owner: "jedem Thermostat einfach einen Temperatursensor gebe … wie bei Better Thermostat"; pictures
 * docs/ideen-4.38/): a thermostat on the radiator gets a sensor in the room. The add-on regulates by it (roomsensors.py); the page shows the
 * sensor's temperature wherever it shows the thermostat's (applySensors: the circle, the cards, the badges, the room tiles), and for a
 * thermostat whose target the add-on moves (↕) the wish instead of the moved target. Here also what the card in 📋 Heiz-Regeln says of a
 * thermostat, which sensors to offer (the room's first) and the lines of the log. Pure (unit test: tests/roomsensors.test.mjs);
 * roomsensorsui.js draws. */

export const WAYS = ['auto', 'cal', 'shift', 'show'];
export const WAY_ICON = { auto: '✨', cal: '🎯', shift: '↕', show: '👁' };

/** the integrations of Home Assistant a thermostat comes from, as people know them */
const PLATFORMS = {
  mqtt: 'Zigbee2MQTT / MQTT', zha: 'Zigbee (ZHA)', deconz: 'deCONZ', matter: 'Matter', homematicip_cloud: 'Homematic IP', homematicip_local: 'Homematic IP',
  homematic: 'Homematic', tado: 'tado', fritzbox: 'FRITZ!DECT', netatmo: 'Netatmo', tuya: 'Tuya', shelly: 'Shelly', zwave_js: 'Z-Wave', evohome: 'evohome',
  nest: 'Nest', ecobee: 'ecobee', homekit_controller: 'HomeKit', bosch_shc: 'Bosch Smart Home', switchbot: 'SwitchBot', esphome: 'ESPHome', knx: 'KNX',
  generic_thermostat: 'Generic Thermostat', better_thermostat: 'Better Thermostat', versatile_thermostat: 'Versatile Thermostat', eq3btsmart: 'eQ-3',
};
/** the name of an integration ("mqtt" → "Zigbee2MQTT / MQTT"), '' for none */
export const platformName = (p) => (typeof p === 'string' && p ? PLATFORMS[p] || p : '');

const num = (v) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && v !== '' ? n : null;
};

/** a temperature sensor of Home Assistant (state of the page, entitystate.js) */
export const isTempSensor = (e, s) => typeof e === 'string' && e.startsWith('sensor.') && !!s && (s.dc === 'temperature' || /°\s?[CF]$/.test(s.unit || ''));

/** the temperature of a sensor now, null while it does not report */
export function sensorValue(states, e) {
  const s = states?.[e];
  if (!s || ['unavailable', 'unknown'].includes(s.state)) return null;
  const v = num(s.state);
  return v !== null && v >= -40 && v <= 80 ? v : null;
}

/** the card's settings as the add-on keeps them (roomsensors.clean): { on, every, min, map: { thermostat: { s, way } } } */
export function sensorCfg(heat) {
  const c = heat?.sensors;
  return { on: c?.on !== false, every: c?.every ?? 10, min: c?.min ?? 0.5, map: c?.map && typeof c.map === 'object' ? c.map : {} };
}

/**
 * The states as the page shows them, changed in place: a thermostat with a sensor has the sensor's temperature as its own (ct; its own
 * one kept in ct0, its target in tt0, rs = the sensor) and, while the add-on moves its target (↕), the wish as its target. A thermostat
 * whose sensor was taken away gets its own values back. Called after every change of the states and of what the add-on says.
 * cfg: sensorCfg; status: { thermostat: what the add-on says } (api/rules status.sensors). Returns how many thermostats have a sensor.
 */
export function applySensors(states, cfg, status) {
  if (!states) return 0;
  const map = cfg?.on ? cfg.map || {} : {};
  let n = 0;
  Object.entries(states).forEach(([e, s]) => {
    if (s && 'rs' in s && !map[e]) { s.ct = s.ct0; s.tt = s.tt0; delete s.rs; delete s.ct0; delete s.tt0; }
  });
  Object.entries(map).forEach(([e, x]) => {
    const s = states[e];
    if (!s || !x?.s) return;
    if (!('rs' in s)) { s.ct0 = s.ct; s.tt0 = s.tt; }
    const v = sensorValue(states, x.s), st = status?.[e];
    s.rs = x.s;
    s.ct = v ?? s.ct0;
    s.tt = st?.way === 'shift' && typeof st.wish === 'number' && s.state !== 'off' ? st.wish : s.tt0;
    n += 1;
  });
  return n;
}

/**
 * The sensors to offer for a thermostat: { room (its room or null), same: [sensors of its room], other: [the others, by room and name],
 * suggest: the first of its room or null }. A sensor of a thermostat's own device (it measures at the radiator too) is never offered.
 * rooms: [{ id, name, ids (its entities) }]; partOf: { entity: its thermostat } (roomtiles.thermostatParts); name(entity)
 */
export function sensorChoices(climate, rooms, states, partOf = {}, name = (e) => e) {
  const list = Object.keys(states || {}).filter((e) => isTempSensor(e, states[e]) && !partOf[e]);
  const roomOf = (e) => (rooms || []).find((r) => (r.ids || []).includes(e)) || null;
  const room = roomOf(climate);
  const byName = (a, b) => String(name(a) || a).localeCompare(String(name(b) || b));
  const same = room ? list.filter((e) => room.ids.includes(e)).sort(byName) : [];
  const other = list.filter((e) => !same.includes(e)).sort((a, b) => String(roomOf(a)?.name || '￿').localeCompare(String(roomOf(b)?.name || '￿')) || byName(a, b));
  return { room, same, other, suggest: same[0] || null, roomOf };
}

/** a difference of temperature with its sign: −4,6° (fmt: a number as the page writes it) */
export const signed = (v, fmt) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmt(Math.abs(v))}`;

/**
 * What the card says of a thermostat with a sensor: { way (cal | shift | show), tone (ok | wait | warn | off), text }.
 * st: what the add-on says (status.sensors[thermostat]) or null (it has not looked yet / does not run); way: the way chosen in the card;
 * deg(°C) and delta(° of difference) write a number as the page does.
 */
export function sensorLine(st, way, t, deg, delta) {
  if (!st) return { way: way === 'auto' ? null : way, tone: 'off', text: t('rs.notYet') };
  if (st.gone) return { way: st.way, tone: 'warn', text: `⚠️ ${t('rs.gone')}` };
  if (st.nocal) return { way: 'show', tone: 'warn', text: `⚠️ ${t('rs.nocal')}` };
  if (st.lost) return { way: st.way, tone: 'warn', text: `⚠️ ${t('rs.lost')}` };
  if (st.way === 'cal' && st.kind === 'ext') {
    return typeof st.sent === 'number' ? { way: 'cal', tone: 'ok', text: `✓ ${t('rs.sent', { v: deg(st.sent) })}` } : { way: 'cal', tone: 'wait', text: `⏳ ${t('rs.sending')}` };
  }
  if (st.way === 'cal') {
    const v = typeof st.want === 'number' ? st.want : st.off;
    if (typeof v !== 'number') return { way: 'cal', tone: 'wait', text: `⏳ ${t('rs.sending')}` };
    const text = st.wait ? `⏳ ${t('rs.calWait', { v: signed(v, delta) })}` : `✓ ${t('rs.calOk', { v: signed(typeof st.off === 'number' ? st.off : v, delta) })}`;
    return { way: 'cal', tone: st.wait ? 'wait' : 'ok', text: st.edge ? `${text} · ${t('rs.edge')}` : text };
  }
  if (st.way === 'shift') {
    if (typeof st.wish !== 'number') return { way: 'shift', tone: 'off', text: t('rs.off') };
    const at = typeof st.want === 'number' ? st.want : st.set;
    if (typeof at !== 'number') return { way: 'shift', tone: 'off', text: t('rs.off') };
    return { way: 'shift', tone: st.wait ? 'wait' : 'ok', text: `${st.wait ? '⏳ ' : ''}${t('rs.shiftText', { wish: deg(st.wish), at: deg(at) })}` };
  }
  return { way: 'show', tone: 'ok', text: t('rs.showText') };
}

/** a short line under a thermostat on 🌡 Klima: "🌡 Raumfühler 20,5° · am Heizkörper 25,1°" and the way as a chip, or null */
export function roomSensorChip(st, s, t, deg, delta) {
  if (!s?.rs) return null;
  const parts = [`🌡 ${t('rs.chipSensor', { v: deg(typeof s.ct === 'number' ? s.ct : null) })}`];
  const own = typeof st?.raw === 'number' ? st.raw : s.ct0;           // with an offset the thermostat reports the room: raw is without it
  if (typeof own === 'number') parts.push(t('rs.chipOwn', { v: deg(own) }));
  let chip = null;
  if (st?.lost) chip = { cls: 'warn', text: `⚠️ ${t('rs.lostShort')}` };
  else if (st?.way === 'cal' && st.kind !== 'ext' && typeof st.off === 'number') chip = { cls: 'cal', text: `🎯 ${t('rs.chipCal', { v: signed(st.off, delta) })}` };
  else if (st?.way === 'cal') chip = { cls: 'cal', text: `🎯 ${t('rs.chipExt')}` };
  else if (st?.way === 'shift' && typeof (st.want ?? st.set) === 'number') chip = { cls: 'shift', text: `↕ ${t('rs.chipAt', { v: deg(st.want ?? st.set) })}` };
  return { text: parts.join(' · '), chip };
}

/** a line of the log (src "sensor"): { icon, text, sub } */
export function sensorLog(x, t, name, fmt) {
  const v = typeof x.v === 'number' ? fmt(x.v) : x.v;
  if (x.act === 'cal') return { icon: '🎯', text: t('rs.log.cal', { name, v }), sub: t('rs.log.sub') };
  if (x.act === 'sel') return { icon: '🎯', text: t('rs.log.sel', { name, v }), sub: x.why === 'lost' ? t('rs.lostShort') : t('rs.log.sub') };
  if (x.act === 'temp') return { icon: '↕', text: t('rs.log.temp', { name, v }), sub: t('rs.log.sub') };
  if (x.act === 'wish') return { icon: '↕', text: t('rs.log.wish', { name, v }), sub: t('rs.log.wishSub') };
  return { icon: '↩', text: t('rs.log.back', { name }), sub: t('rs.log.sub') };
}
