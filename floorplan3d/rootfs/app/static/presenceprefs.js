/* The settings of "wer ist wirklich zu Hause" (#495) in ⚙ → "Reiter unten": when a person counts as at home (as Home Assistant's person
 * says, when one source says so, when two do) and the names of the home Wi-Fi (the phone's network from the companion app counts as home
 * only with one of them). A part of the settings form (settings.js parts: fill / read); the server keeps them in settings.presence
 * (pages.clean_presence). */
import { PRESENCE_RULES } from './family.js';

/** "Zuhause-5G, Zuhause" -> ["Zuhause-5G", "Zuhause"] (each once, at most 6) */
export const parseSsids = (text) => [...new Set(String(text || '').split(',').map((x) => x.trim().slice(0, 64)).filter(Boolean))].slice(0, 6);

/** ctx: $ */
export function initPresencePrefs(ctx) {
  const rule = ctx.$('#setPresenceRule'), ssids = ctx.$('#setPresenceSsids');
  return {
    fill(settings) {
      const p = settings.presence || {};
      rule.value = PRESENCE_RULES.includes(p.rule) ? p.rule : 'ha';
      if (document.activeElement !== ssids) ssids.value = (Array.isArray(p.ssids) ? p.ssids : []).join(', ');
    },
    read(next) { next.presence = { rule: PRESENCE_RULES.includes(rule.value) ? rule.value : 'ha', ssids: parseSsids(ssids.value) }; },
  };
}
