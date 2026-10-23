/* The voice search (#509) on the screen: the 🎤 beside the 🔍 (and in the search box), what was heard in the box, the answer as a line
 * and a list, and the view going there: another house, the floor, the room, the whole house with a ring on every thing of the answer,
 * the colours of temperature / humidity / CO₂. Understanding is voicequery.js, listening voiceinput.js. A typed question in the search box
 * is answered the same way (search.js asks question / ask). */
import { understand, answer, flatRows, headline, isQuestion, ICONS, LANGS } from './voicequery.js';
import { initVoiceInput, Recognizer, canMic } from './voiceinput.js';

const PLACES_TTL = 10 * 60 * 1000;                    // the rooms of the other houses are asked for again after 10 minutes

/** ctx: $, t, search (search.js), lang(), settings(), user() (Home Assistant user name), locks() (Set), layout() (the open house's plan),
 *  shown() (what of it is shown: buildings), houseId(), houses() ([{ id, name }]), switchHouse(id) (async), switchFloor(i), houseMode(),
 *  setHouseMode(on), floorIdx(), focusRoom(id), openRoomPanel(id), isLive(), rows() (devicelist.js deviceRows of what is shown), states(),
 *  reading(roomId, mode) (temp / humid / co2 of a room or null), colorMode(mode) (the colours of the rooms), imperial() */
export function initVoiceUi(ctx) {
  const { $, t } = ctx;
  let assist = null;                                   // api/voice: { assist, pipeline, name, language, locked }; null: not asked, undefined: asking
  const input = initVoiceInput({ lang: () => ctx.lang(), engine: () => ctx.settings().voice?.engine || 'auto', assist: () => !!assist?.assist });
  const locked = (k) => ctx.locks().has(k);

  /* ---- the places of every house (code words may name a room of another house) ---- */
  const others = new Map();                            // house id -> { at, floors, rooms }
  const placesOf = (house, layout) => {
    const floors = (layout?.floors || []).map((f, i) => ({ house, id: f.id || `#${i}`, name: f.name || '', kind: f.kind || 'floor', rooms: f.rooms || [] }))
      .filter((f) => f.kind !== 'roof');
    return { floors: floors.map(({ rooms, ...f }) => f), rooms: floors.flatMap((f) => f.rooms.map((r) => ({ house, floor: f.id, id: r.id, name: r.name || '' }))) };
  };
  async function loadOthers() {
    const now = Date.now();
    await Promise.all(ctx.houses().filter((h) => h.id !== ctx.houseId() && !(others.get(h.id)?.at > now - PLACES_TTL)).map(async (h) => {
      try {
        const r = await fetch(`api/layout?house=${encodeURIComponent(h.id)}`);
        if (r.ok) others.set(h.id, { at: now, ...placesOf(h.id, await r.json()) });
      } catch { /* a house that cannot be read is left out */ }
    }));
  }
  /** everything understand() needs; the other houses as far as they are loaded */
  function env() {
    const own = placesOf(ctx.houseId(), ctx.layout());
    const rest = ctx.houses().filter((h) => h.id !== ctx.houseId()).map((h) => others.get(h.id)).filter(Boolean);
    return {
      lang: ctx.lang(), house: ctx.houseId(), floor: ctx.layout()?.floors?.[ctx.floorIdx()]?.id || null, user: ctx.user(),
      aliases: ctx.settings().voice?.aliases || [], houses: ctx.houses(),
      floors: [...own.floors, ...rest.flatMap((p) => p.floors)], rooms: [...own.rooms, ...rest.flatMap((p) => p.rooms)],
    };
  }

  /** understood in the add-on's language; when nothing is known that way, in the browser's language or another one (a German sentence
   *  on an English screen) */
  function understandAny(text) {
    const e = env(), q = understand(text, e);
    if (q.known) return q;
    const nav = String(navigator.language || '').slice(0, 2);
    for (const l of [nav, ...LANGS].filter((x, i, a) => x && x !== e.lang && LANGS.includes(x) && a.indexOf(x) === i)) {
      const o = understand(text, { ...e, lang: l });
      if (o.known) return o;
    }
    return q;
  }

  /* ---- the answer on the screen ---- */
  const floorName = (i) => ctx.shown()?.floors?.[i]?.name || '';
  const roomIn = (id) => {
    const floors = ctx.layout()?.floors || [];
    for (let i = 0; i < floors.length; i++) { const r = floors[i].rooms?.find((x) => x.id === id); if (r) return { room: r, floor: i }; }
    return null;
  };
  /** to floor i (out of the whole-house view), only when it is not shown already */
  const toFloor = (i) => { if (i >= 0 && (ctx.houseMode() || ctx.floorIdx() !== i)) ctx.switchFloor(i); };
  const toRoom = (id, panel) => { const at = roomIn(id); if (!at) return null; toFloor(at.floor); ctx.focusRoom(id); if (panel && ctx.isLive()) ctx.openRoomPanel(id); return at.room; };
  const unit = { temp: () => (ctx.imperial() ? '°F' : '°C'), humid: () => '%', co2: () => 'ppm' };
  const value = (v, mode) => {
    if (v == null) return t('vq.noValue');
    const n = mode === 'temp' && ctx.imperial() ? v * 9 / 5 + 32 : v;
    return `${new Intl.NumberFormat(ctx.lang(), { maximumFractionDigits: mode === 'co2' ? 0 : 1 }).format(n)} ${unit[mode]()}`;
  };
  const itemRow = (it) => ({ label: `${it.icon || '•'} ${it.name}`, sub: [floorName(it.floor), it.roomName, it.value].filter(Boolean).join(' · '),
    go: () => ctx.search.goTo({ floor: it.floor, kind: it.kind, id: it.id }) });

  /** answer a sentence (spoken or typed) */
  async function ask(text) {
    if (!String(text || '').trim()) return;
    await loadOthers();
    const q = understandAny(text);
    if (q.house) {
      if (locked('houses')) { ctx.search.show({ text, head: `🔒 ${t('vq.houseLocked')}` }); return; }
      await ctx.switchHouse(q.house);
    }
    const L = ctx.layout(), fi = q.floor ? L.floors.findIndex((f, i) => (f.id || `#${i}`) === q.floor) : -1;
    const a = answer(q, flatRows(ctx.rows()), ctx.states(), { floor: fi >= 0 ? fi : null, rooms: q.rooms });
    const house = ctx.houses().find((h) => h.id === ctx.houseId())?.name || '';
    if (a.mode === 'list') {
      const floors = [...new Set(a.items.map((i) => i.floor))];
      if (q.rooms.length === 1) toRoom(q.rooms[0], false);
      else if (fi >= 0) toFloor(fi);
      else if (floors.length === 1) toFloor(floors[0]);
      else if (floors.length > 1 && !ctx.houseMode()) ctx.setHouseMode(true);
      ctx.search.show({ text, head: headline(a, t, q.place || (q.house ? house : '')), rows: a.items.slice(0, 40).map(itemRow) });
      ctx.search.mark(a.items.slice(0, 24).map((i) => ({ floor: i.floor, kind: i.kind, id: i.id })));
      return;
    }
    if (a.mode === 'reading') {
      const icon = ICONS[a.what], what = t(`vq.w.${a.what}`);
      if (q.rooms.length) {
        const room = toRoom(q.rooms[0], true);
        const rows = q.rooms.map((id) => roomIn(id)).filter(Boolean).map((at) => ({ label: `${icon} ${at.room.name}`, sub: `${floorName(at.floor)} · ${value(ctx.reading(at.room.id, a.what), a.what)}`,
          go: () => toRoom(at.room.id, true) }));
        ctx.search.show({ text, head: `${icon} ${room?.name || q.place}: ${value(ctx.reading(q.rooms[0], a.what), a.what)}`, rows: rows.length > 1 ? rows : [] });
      } else {
        if (fi >= 0) toFloor(fi);
        const coloured = !locked('colorModes') && ctx.colorMode(a.what);
        const floors = fi >= 0 ? [fi] : (ctx.layout()?.floors || []).map((_, i) => i);
        const rows = floors.flatMap((i) => (ctx.layout().floors[i].rooms || []).map((r) => ({ r, i, v: ctx.reading(r.id, a.what) }))).filter((x) => x.v != null)
          .sort((p, q2) => q2.v - p.v).map((x) => ({ label: `${icon} ${x.r.name || '—'}`, sub: `${floorName(x.i)} · ${value(x.v, a.what)}`, go: () => toRoom(x.r.id, true) }));
        ctx.search.show({ text, head: `${icon} ${what}${coloured ? ` · ${t('vq.colors')}` : ''}`, rows, none: rows.length ? '' : t('vq.noValue') });
      }
      return;
    }
    if (a.mode === 'rooms') {
      if (q.rooms.length === 1) {
        const room = toRoom(q.rooms[0], true);
        ctx.search.show({ text, head: `🏠 ${room?.name || q.place}` });
      } else {
        const rows = q.rooms.map((id) => roomIn(id)).filter(Boolean).map((at) => ({ label: `🏠 ${at.room.name}`, sub: floorName(at.floor), go: () => toRoom(at.room.id, true) }));
        const first = roomIn(q.rooms[0]);
        if (first) toFloor(first.floor);
        ctx.search.show({ text, head: `🏠 ${q.place}`, rows });
      }
      return;
    }
    if (a.mode === 'floor') { toFloor(fi); ctx.search.show({ text, head: `🏢 ${floorName(fi) || q.place}` }); return; }
    if (a.mode === 'house') { ctx.search.show({ text, head: `🏠 ${house}` }); return; }
    if (a.mode === 'find') {
      const hits = ctx.search.findItems(q.rest);
      if (hits.length) { ctx.search.goTo(hits[0]); return; }
    }
    ctx.search.show({ text, head: `🤔 ${t('vq.unknown')}`, none: t('vq.examples') });
  }

  /* ---- the 🎤 ---- */
  const mics = () => [$('#voiceBtn'), $('#findMic')];
  const setMic = (state) => mics().forEach((b) => { b.classList.toggle('listening', state === 'listening'); b.classList.toggle('thinking', state === 'thinking'); });
  const ERR = { 'no-speech': 'noSpeech', 'not-allowed': 'mic', 'service-not-allowed': 'mic', 'audio-capture': 'mic', network: 'net', no_assist: 'noAssist', none: 'none' };
  function listen(fresh) {
    if (fresh || !ctx.search.isOpen()) ctx.search.show({ text: '' });
    input.listen({
      partial: (txt) => { $('#findInput').value = txt; },
      final: (txt) => { setMic(''); ask(txt); },
      error: (code) => {
        setMic('');
        if (code === 'cancel') return;
        ctx.search.show({ head: `⚠ ${t(`vq.err.${ERR[code] || 'other'}`, { code })}` });
      },
      state: (s) => {
        setMic(s);
        if (s === 'listening') ctx.search.show({ head: `🎤 ${t('vq.listening')}` });
        if (s === 'thinking') ctx.search.show({ head: `⏳ ${t('vq.thinking')}` });
      },
    });
  }
  $('#voiceBtn').addEventListener('click', () => listen(!input.busy()));
  $('#findMic').addEventListener('click', () => listen(false));
  /** the 🎤 shows where this browser can listen (and the user may); Home Assistant is asked once whether its Assist can, when it may be
   *  needed (no recognition in the browser, or Assist chosen) */
  function update() {
    if (assist === null && canMic() && (!Recognizer() || ctx.settings().voice?.engine === 'assist')) { assist = undefined; refresh(); }
    const e = input.engine();
    const off = !e || locked('voice') || locked('search');
    mics().forEach((b) => { b.hidden = off; b.title = t(e === 'assist' ? 'vq.micAssist' : 'vq.mic'); });
  }
  async function refresh() {
    try { assist = await (await fetch('api/voice')).json(); } catch { assist = { assist: false }; }
    update();
    return assist;
  }
  update();
  ctx.search.setVoice({
    question: (text) => {
      const q = understandAny(text), what = q.what || (q.state ? 'devices' : null);
      return isQuestion(q) ? [what && t(`vq.w.${what}`), q.state && t(`vq.s.${q.state}`), q.place].filter(Boolean).join(' · ') : null;
    },
    ask,
  });
  return { ask, listen: () => listen(true), update, refresh, status: () => ({ ...input.can(), engine: input.engine(), assist }), loadOthers, places: () => env(),
    cancel: () => input.cancel() };
}
