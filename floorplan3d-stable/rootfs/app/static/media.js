/* 🎵 Musik & TV (#490): the players of Home Assistant as cards (what plays, its picture, the buttons the player can do, its volume and
 * source: controlPlan of devicecontrols.js, like the live card), the rooms playing together, "Alles stopp" and the radio stations of ⚙.
 * Pure rules (unit test: tests/media.test.mjs); pagemedia.js draws. */
import { controlPlan, MEDIA } from './devicecontrols.js';

/** Home Assistant's feature bits of a player (supported_features) this page needs beside those of the live card */
export const F = { ...MEDIA, PLAY_MEDIA: 512, GROUPING: 524288 };
export const MAX_STATIONS = 20;
const OFF = new Set(['off', 'standby', 'unavailable', 'unknown']);
const RANK = { playing: 0, buffering: 0, paused: 1, on: 2, idle: 2, standby: 3, off: 3, unknown: 4, unavailable: 4 };
/** feature f: what Home Assistant reports; without a report (an older integration, the demo) `dflt` */
const has = (sf, f, dflt) => (Number.isInteger(sf) ? (sf & f) === f : dflt);
/** a radio station's address: a stream or one of Home Assistant's media (the same rule as STATION in controls.py) */
export const STATION = /^(https?:\/\/|media-source:\/\/)[^\s"'<>]{1,490}$/;

/**
 * One player for its card: { entity, name, room, state, on, playing, title, sub, plan (controlPlan: buttons, volume, mute, sources),
 * pic, group (the players playing with it, itself among them, or null), canGroup, canPlay (a station), stop (the service of "Alles
 * stopp": pause, else stop, else off, null when it can do none) }.
 * The title is the track, else the app or source (a TV with Netflix), the line under it the artist (or the app beside a track).
 */
export function player(id, s, name, room = '') {
  const c = s?.ctl || {}, st = s?.state || 'unknown', on = !OFF.has(st);
  const title = c.title || (on ? s.app || c.source || '' : '');
  const sub = c.title ? [c.artist, s.app].filter(Boolean).join(' · ') : '';
  const stop = has(c.sf, F.PAUSE, true) ? 'media_pause' : has(c.sf, F.STOP, false) ? 'media_stop' : has(c.sf, F.TURN_OFF, false) ? 'turn_off' : null;
  return { entity: id, name: name || id, room, state: st, on, playing: st === 'playing', title, sub, plan: controlPlan(id, s || { state: st }),
    pic: typeof c.pic === 'string' && c.pic ? c.pic : null, group: Array.isArray(c.grp) && c.grp.length > 1 ? c.grp : null,
    canGroup: has(c.sf, F.GROUPING, false) || Array.isArray(c.grp), canPlay: has(c.sf, F.PLAY_MEDIA, true) && st !== 'unavailable', stop };
}

/** every player of Home Assistant: playing first, then paused, on, off, gone; within that by room and name. names: { entity: name },
 *  roomOf(entity): the room in the plan or Home Assistant's area ('' without) */
export function players(states, { names = {}, roomOf = () => '' } = {}) {
  return Object.entries(states || {}).filter(([id]) => id.startsWith('media_player.'))
    .map(([id, s]) => ({ p: player(id, s, names[id] || s?.name, roomOf(id) || ''), r: RANK[s?.state] ?? 2 }))
    .sort((a, b) => a.r - b.r || a.p.room.localeCompare(b.p.room) || a.p.name.localeCompare(b.p.name)).map(({ p }) => p);
}

export const hasMedia = (states) => Object.keys(states || {}).some((id) => id.startsWith('media_player.'));

/** "Alles stopp": a call for every player that plays now: pause, else stop, else off; [{ entity, service }] */
export const stopCalls = (list) => list.filter((p) => p.playing && p.stop).map((p) => ({ entity: p.entity, service: p.stop }));

/** the groups playing together now: [{ leader, members }] (each once; the first of group_members leads) */
export function groupsOf(list) {
  const seen = new Set(), out = [];
  list.forEach((p) => {
    if (!p.group) return;
    const key = [...p.group].sort().join(',');
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ leader: p.group[0], members: p.group });
  });
  return out;
}

/** the call that puts `members` together with `leader` (Home Assistant: media_player.join on the leader); null with nobody to join */
export function joinCall(leader, members) {
  const others = [...new Set((members || []).filter((m) => m !== leader && /^media_player\.[a-z0-9_]+$/.test(m)))].slice(0, 20);
  return leader && others.length ? { entity: leader, service: 'join', data: { group_members: others } } : null;
}

/** the radio stations of ⚙ made safe: [{ name, url }], each address once, at most MAX_STATIONS (the same as clean_stations in pages.py) */
export function cleanStations(list) {
  const seen = new Set(), out = [];
  (Array.isArray(list) ? list : []).forEach((v) => {
    const url = typeof v?.url === 'string' ? v.url.trim() : '';
    if (!STATION.test(url) || seen.has(url)) return;
    seen.add(url);
    const name = typeof v.name === 'string' ? v.name.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, ' ').trim() : '';
    out.push({ name: (name || url).slice(0, 40), url });
  });
  return out.slice(0, MAX_STATIONS);
}

/** the call that plays a station on a player */
export const stationCall = (entity, station) => ({ entity, service: 'play_media', data: { media_content_id: station.url, media_content_type: 'music' } });

/** the address of a player's picture: one on the internet as it is, Home Assistant's own through the add-on; null without one */
export function picUrl(entity, pic) {
  if (!pic) return null;
  if (pic.startsWith('https://')) return pic;
  return `api/media/${encodeURIComponent(entity)}/picture?v=${encodeURIComponent(pic)}`;
}

/** a colour for the ♪ of a player without a picture: one of five, always the same for a player */
export function tone(entity) {
  let h = 0;
  for (const ch of String(entity)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 5;
}
