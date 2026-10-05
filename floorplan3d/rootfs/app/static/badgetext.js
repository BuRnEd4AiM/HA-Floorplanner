/* Texts for the value badges over devices and for state lines: "21.4 °C", "95 W", "70 %" (cover), the app on a TV, a meter reading with
 * its own sign (water, gas, heat, #136). Pure functions: `s` is the stored state of an entity ({ state, unit, dc, ... }), `t` translates. */

/** a sign in front of a sensor value, by its device class */
export const DC_ICON = { temperature: '🌡 ', humidity: '💧 ', power: '⚡ ', carbon_dioxide: 'CO₂ ', illuminance: '☀ ', battery: '🔋 ', water: '🚰 ', gas: '🔥 ', energy: '⚡ ' };
/** meters show their own sign whatever the sensor says (a heat meter reports "energy" too) */
export const TYPE_ICON = { watermeter: '🚰 ', gasmeter: '🔥 ', heatmeter: '♨ ' };

/** the state as it is, with its unit */
export function stateText(s, t) {
  if (!s) return '—';
  if (s.state === 'unavailable') return t('off.unavailable');
  return s.unit ? `${s.state} ${s.unit}` : s.state;
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
  if (dom === 'media_player') return s.state === 'off' ? t('live.off') : `▶ ${s.app || s.state}`;
  if (dom === 'sensor' && !isNaN(num) && /^-?[\d.]+$/.test(s.state)) return `${icon}${Math.round(num * 10) / 10}${s.unit ? ' ' + s.unit : ''}`;
  return stateText(s, t);
}
