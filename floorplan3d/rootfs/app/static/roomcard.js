/* Room card (5.10.0, the owner's choice from docs/ideen-5.10: idea 3 "Reiter" and, on phones, idea 4 "erst kurz"): what the room panel of a
 * tapped room shows. On top the room's values as chips (temperature, humidity, CO₂, power, open windows); below them tabs (💡 Licht,
 * 🪟 Rollo, 🌡 Klima, 📺 Geräte, 🚪 Fenster), only one shown at a time. On phones the card first comes small (the chips and up to four
 * big buttons) and shows everything when pulled up. The decisions are pure functions here (unit test: tests/roomcard.test.mjs);
 * roompanel.js and roomcardui.js draw. */

/** the tabs in their order and the groups of the room panel (RP_GROUPS of roompanel.js) each one lists */
export const TABS = ['light', 'cover', 'climate', 'devices', 'open'];
export const TAB_ICON = { light: '💡', cover: '🪟', climate: '🌡️', values: '📊', devices: '📺', open: '🚪' };
/** the tab a group of the room panel is listed under (scenes and scripts with the lights, sensors with the heating) */
export function tabOf(group) {
  if (group === 'light' || group === 'scene') return 'light';
  if (group === 'cover') return 'cover';
  if (group === 'climate' || group === 'sensor') return 'climate';
  if (group === 'media_player' || group === 'switch' || group === 'camera') return 'devices';
  return null;
}

/**
 * The tabs of a room, in order, only those with something in them: [{ key, icon, badge, alert }].
 * c: { lights, lightsOn, scenes, covers: [position (0-100) or null], thermostats, temp (°C or null), sensors, devices, devicesOn,
 *      openings, open (how many are open), heatIcon (the icon of what the heating rules do now, '' for nothing) }
 * num(v): a temperature as the screen shows it ("21,4°")
 */
export function roomTabs(c, t, num = (v) => `${v}°`) {
  const out = [];
  if (c.lights || c.scenes) out.push({ key: 'light', badge: c.lights ? `${c.lightsOn}/${c.lights}` : `${c.scenes}` });
  if (c.covers?.length) out.push({ key: 'cover', badge: coverBadge(c.covers) });
  if (c.thermostats) out.push({ key: 'climate', badge: `${c.temp == null ? '–' : num(c.temp)}${c.heatIcon ? ` ${c.heatIcon}` : ''}` });
  else if (c.sensors) out.push({ key: 'values', badge: c.temp == null ? `${c.sensors}` : num(c.temp) });
  if (c.devices) out.push({ key: 'devices', badge: c.devicesOn ? t('rp.nOn', { n: c.devicesOn }) : `${c.devices}` });
  if (c.openings) out.push({ key: 'open', badge: c.open ? t('rp.nOpen', { n: c.open }) : t('rp.allShut'), alert: c.open > 0 });
  return out.map((x) => ({ icon: TAB_ICON[x.key], alert: false, ...x }));
}
/** what the tab 🪟 Rollo says: the position of one cover ("60 %"), of several the same position, else how many there are */
export function coverBadge(list) {
  const known = (list || []).filter((p) => typeof p === 'number');
  if (!list?.length) return '';
  if (known.length === list.length && known.every((p) => p === known[0])) return `${Math.round(known[0])} %`;
  return `${list.length}×`;
}
/** the group of a tab: 'values' (a room with sensors but no thermostat) shows what 'climate' shows */
export const tabGroup = (key) => (key === 'values' ? 'climate' : key);
/** the tab to show: the one asked for (the last one chosen) when the room has it, else its first */
export function pickTab(tabs, wanted) {
  const keys = tabs.map((x) => x.key);
  if (wanted && keys.includes(wanted)) return wanted;
  if (wanted === 'climate' && keys.includes('values')) return 'values';
  if (wanted === 'values' && keys.includes('climate')) return 'climate';
  return keys[0] || null;
}

/**
 * The chips on top: [{ key, icon, text, tone ('' | 'good' | 'warn' | 'bad'), tab (the tab a tap opens) }].
 * r: { temp, humid, co2 (or null each), power (W or null), open (open windows and doors), co2Bad (ppm from which to air, climate.js airLimit) }
 * num(v, digits): a number in the screen's language; imperial: °F
 */
export function roomChips(r, num, imperial = false) {
  const out = [];
  if (r.temp != null) out.push({ key: 'temp', icon: '🌡️', text: imperial ? `${num(r.temp * 9 / 5 + 32, 1)} °F` : `${num(r.temp, 1)} °C`, tone: '' });
  if (r.humid != null) out.push({ key: 'humid', icon: '💧', text: `${Math.round(r.humid)} %`, tone: '' });
  if (r.co2 != null) out.push({ key: 'co2', icon: '🫧', text: `${Math.round(r.co2)} ppm`, tone: co2Tone(r.co2, r.co2Bad) });
  if (r.power != null) out.push({ key: 'power', icon: '⚡', text: r.power >= 1000 ? `${num(r.power / 1000, 1)} kW` : `${Math.round(r.power)} W`, tone: '' });
  if (r.open) out.push({ key: 'open', icon: '🪟', text: '', n: r.open, tone: 'bad' });
  const tab = { temp: 'climate', humid: 'climate', co2: 'climate', power: 'climate', open: 'open' };
  return out.map((x) => ({ ...x, tab: tab[x.key] }));
}
/** the colour of the CO₂ chip: green below 800 ppm, yellow up to the value from which a room should be aired (normally 1200), red from it */
export function co2Tone(v, bad = 1200) {
  if (v == null) return '';
  return v >= bad ? 'bad' : v >= Math.min(800, bad - 1) ? 'warn' : 'good';
}
/** the power of a room: the sum of its sensors in W (and kW turned into W); null without one */
export function roomPower(ids, states) {
  let sum = null;
  [...ids].forEach((id) => {
    const s = states?.[id];
    if (!id.startsWith('sensor.') || !s || (s.unit !== 'W' && s.unit !== 'kW')) return;
    const v = parseFloat(s.state);
    if (Number.isFinite(v)) sum = (sum || 0) + (s.unit === 'kW' ? v * 1000 : v);
  });
  return sum;
}

/** the big buttons of the small card on phones: up to four of light, scenes, cover, climate (then devices, openings to fill up) */
export function quickKeys(tabs, scenes = 0) {
  const keys = tabs.map((x) => x.key), out = [];
  if (keys.includes('light')) out.push('light');
  if (scenes) out.push('scenes');
  ['cover', 'climate', 'values', 'devices', 'open'].forEach((k) => { if (keys.includes(k) && out.length < 4) out.push(k); });
  return out.slice(0, 4);
}
/** the tab a big button opens */
export const quickTab = (key) => (key === 'scenes' ? 'light' : key);

/** what a drag on the grip of the sheet does: 'full' (pulled up), 'peek' (pushed down), 'toggle' (a tap), null (too little) */
export function sheetMove(dy, full) {
  if (Math.abs(dy) < 6) return 'toggle';
  if (dy <= -24) return 'full';
  if (dy >= 24) return full ? 'peek' : 'close';
  return null;
}

/** a symbol for a room by its name (a few words in the languages of the add-on), else 🏠 */
const ROOM_ICONS = [
  [/wohn|living|lounge|salon|soggiorno|woonkamer|salón|pokój dzienny|salotto|客厅/i, '🛋️'],
  [/schlaf|bed|chambre|camera da letto|dormitorio|slaapkamer|sypial|卧室/i, '🛏️'],
  [/küche|kitchen|cuisine|cucina|cocina|keuken|kuchnia|厨房/i, '🍳'],
  [/bad|bath|wc|toilet|salle de bain|bagno|baño|badkamer|łazienk|浴室|卫生间/i, '🛁'],
  [/büro|arbeit|office|study|bureau|ufficio|oficina|kantoor|biuro|书房|办公/i, '💻'],
  [/kind|child|kid|enfant|bambin|niño|kinder|dzieci|儿童/i, '🧸'],
  [/flur|diele|hall|couloir|corridoio|pasillo|gang|korytarz|走廊/i, '🚪'],
  [/garage|garaż|车库/i, '🚗'],
  [/keller|basement|cellar|cave|cantina|sótano|kelder|piwnic|地下室/i, '📦'],
  [/terrasse|balkon|terrace|balcon|balcone|balcón|terras|taras|阳台/i, '🌿'],
  [/garten|garden|jardin|giardino|jardín|tuin|ogród|花园/i, '🌳'],
  [/gäste|guest|invité|ospiti|invitad|gasten|gość|客房/i, '🛎️'],
  [/hobby|werk|atelier|studio|laborator|taller|warsztat/i, '🎨'],
  [/wasch|laundry|buanderie|lavanderia|lavander|wasruimte|pralni|洗衣/i, '🧺'],
  [/esszimmer|dining|salle à manger|sala da pranzo|comedor|eetkamer|jadalni|餐厅/i, '🍽️'],
];
export function roomIcon(name) {
  const hit = ROOM_ICONS.find(([rx]) => rx.test(name || ''));
  return hit ? hit[1] : '🏠';
}

/** an icon for a scene or script by its name (a few words in the languages of the add-on), else ✨ (▶️ for a script) */
const SCENE_ICONS = [
  [/gemütlich|cozy|cosy|gezellig|accogliente|acogedor|confort|przytul|温馨/i, '🛋️'],
  [/film|kino|movie|cinema|tv|fernseh|télé|电影/i, '🎬'],
  [/nacht|night|nuit|notte|noche|nacht|noc|晚安|夜/i, '🌙'],
  [/morgen|morning|matin|mattin|mañana|ochtend|rano|早/i, '☀️'],
  [/lesen|read|lire|leggere|leer|lezen|czyt|阅读/i, '📖'],
  [/essen|dinner|dîner|cena|eten|obiad|晚餐/i, '🍽️'],
  [/party|feier|fête|festa|fiesta|feest|impreza|派对/i, '🎉'],
  [/hell|bright|clair|chiaro|brillante|helder|jasn|明亮/i, '🔆'],
  [/\b(aus|off|éteint|spento|apagad|uit|wył)\b|关/i, '⏻'],
];
export function sceneIcon(name, script = false) {
  const hit = SCENE_ICONS.find(([rx]) => rx.test(name || ''));
  return hit ? hit[1] : script ? '▶️' : '✨';
}
/** the name of a scene without the room's name in front ("Wohnzimmer Gemütlich" in the Wohnzimmer -> "Gemütlich") */
export function shortName(name, room) {
  const n = String(name || ''), r = String(room || '').trim();
  return r && n.length > r.length + 1 && n.toLowerCase().startsWith(`${r.toLowerCase()} `) ? n.slice(r.length + 1) : n;
}
