/* Texts for the value badges over devices and for state lines: "21.4 °C", "95 W", "70 %" (cover), the app on a TV, a meter reading with
 * its own sign (water, gas, heat, #136). Pure functions: `s` is the stored state of an entity ({ state, unit, dc, ... }), `t` translates. */

/** a sign in front of a sensor value, by its device class */
export const DC_ICON = { temperature: '🌡 ', humidity: '💧 ', power: '⚡ ', carbon_dioxide: 'CO₂ ', illuminance: '☀ ', battery: '🔋 ', water: '🚰 ', gas: '🔥 ', energy: '⚡ ' };
/** meters show their own sign whatever the sensor says (a heat meter reports "energy" too) */
export const TYPE_ICON = { watermeter: '🚰 ', gasmeter: '🔥 ', heatmeter: '♨ ' };

/** the key of the words for a state (#492): on / off for anything, at home / away for a person or a phone, the state of a robot
 *  vacuum or an alarm panel (dc.st.*) and of a player or a camera (mp.st.*: "bereit") by the domain of entity `id`; null for a state
 *  Home Assistant's words are kept for (a zone, a mode ...) */
function wordKey(state, id = '') {
  if (state === 'on' || state === 'off') return `live.${state}`;
  const dom = String(id).split('.')[0];
  if (dom === 'person' || dom === 'device_tracker') return state === 'home' ? 'fm.home' : state === 'not_home' ? 'fm.away' : null;
  if (dom === 'vacuum' || dom === 'alarm_control_panel') return `dc.st.${state}`;
  if (dom === 'media_player' || dom === 'camera') return `mp.st.${state}`;
  return null;
}

/** the state with its unit; in the page's language where it has the words ("An", "An der Station", "läuft", #492), else as it is.
 *  id: the entity (its domain picks the words) */
export function stateText(s, t, id = '') {
  if (!s) return '—';
  if (s.state === 'unavailable') return t('off.unavailable');
  if (s.unit) return `${s.state} ${s.unit}`;
  const k = wordKey(s.state, id), w = k ? t(k) : null;
  return w && w !== k ? w : s.state;
}

/** short text for the badge on a device of type `type` linked to entityId */
export function badgeText(s, entityId, t, type) {
  if (!s) return '—';
  if (s.state === 'unavailable') return t('off.unavailable');
  const dom = entityId.split('.')[0], num = parseFloat(s.state);
  const icon = TYPE_ICON[type] || DC_ICON[s.dc] || (s.unit === 'W' ? '⚡ ' : '');
  if (dom === 'climate') return typeof s.ct === 'number' ? `🌡 ${Math.round(s.ct * 10) / 10} °C` : s.state;
  if (dom === 'cover') return typeof s.position === 'number' ? `↕ ${s.position} %` : s.state;
  if (dom === 'light') return s.state !== 'on' ? t('live.off') : s.brightness != null ? `💡 ${s.brightness} %` : t('live.on');
  if (dom === 'media_player') {                                   // the app on a TV, else the state in words ("läuft", not "playing")
    if (s.state === 'off') return t('live.off');
    const sign = s.state === 'playing' ? '▶ ' : s.state === 'paused' ? '⏸ ' : '';
    return s.app ? `▶ ${s.app}` : `${sign}${stateText(s, t, entityId)}`;
  }
  if (dom === 'sensor' && !isNaN(num) && /^-?[\d.]+$/.test(s.state)) return `${icon}${Math.round(num * 10) / 10}${s.unit ? ' ' + s.unit : ''}`;
  return stateText(s, t, entityId);
}
