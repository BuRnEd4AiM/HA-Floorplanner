/* 🖼 Bildkarten fürs Handy (5.33.0, the owner's choice of docs/ideen-5.33: idea 1 "Bausteine untereinander", a new card starts from a
 * template): the pure part of the editor (piccardsui.js): the building blocks and their defaults, the templates, a new card's id, moving a
 * block, a block's line in the list, where a card is used. The card is checked and drawn by the add-on (piccard.py: the same kinds, rows
 * and defaults); the demo draws it itself (demo/piccard.js). Unit test: tests/piccards.test.mjs. */

export const KINDS = ['head', 'plan', 'camera', 'clock', 'info', 'values', 'text', 'line', 'foot'];
export const NO_HALF = ['head', 'line', 'foot'];                  // always the whole width
export const ROWS = ['sensor', 'since', 'room', 'temp', 'hum', 'open', 'lights', 'who', 'weather', 'alarm'];
export const ICON = { head: '🔠', plan: '🗺️', camera: '📷', clock: '🕒', info: 'ℹ️', values: '📈', text: '📝', line: '➖', foot: '🔻' };
export const COLORS = ['#d63c31', '#e8812f', '#2e9b5f', '#3a7bd5', '#2d3f7a', '#7b4bc4', '#ffffff'];
export const ALARM_KINDS = ['alarm', 'smoke', 'gas', 'co', 'water'];
export const MAX_CARDS = 20, MAX_BLOCKS = 12;
const ID = /^[a-z0-9_-]{1,24}$/;

/** the placeholders of a card's texts with a button each (piccard.fill; 5.34.0, the owner's choice of docs/ideen-5.34: idea 2, green boxes) */
export const PH = ['room', 'floor', 'name', 'time', 'kind', 'house', 'text'];
const PH_ALIAS = { art: 'kind', melder: 'name', raum: 'room', etage: 'floor', haus: 'house', zeit: 'time' };   // German, as piccard.fill
/** a text cut into plain pieces and placeholders: "Wasser in {raum}!" → [{ s: 'Wasser in ' }, { ph: 'room' }, { s: '!' }];
 * an unknown {word} stays text */
export function phParts(text) {
  const str = String(text ?? ''), out = [];
  let last = 0;
  for (const m of str.matchAll(/\{(\w+)\}/g)) {
    const k = PH.includes(m[1]) ? m[1] : PH_ALIAS[m[1]];
    if (!k) continue;
    if (m.index > last) out.push({ s: str.slice(last, m.index) });
    out.push({ ph: k });
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push({ s: str.slice(last) });
  return out;
}
/** the pieces as the text that is kept ({room} …) */
export const phText = (parts) => parts.map((p) => (p.ph ? `{${p.ph}}` : p.s)).join('');
/** a text as people read it: the placeholders by their names in brackets ("Wasser in [Raum]"); t: the texts */
export const phRead = (text, t) => phParts(text).map((p) => (p.ph ? `[${t(`pc.ph.${p.ph}`)}]` : p.s)).join('');

/** a new block of a kind with its defaults (as piccard.clean_block) */
export function newBlock(k) {
  switch (k) {
    case 'head': return { k, text: '{kind}', clock: true };
    case 'plan': return { k, show: 'floor', marks: false };
    case 'camera': return { k, ent: '' };
    case 'clock': return { k, date: true };
    case 'info': return { k, rows: ['sensor', 'since', 'temp', 'hum'] };
    case 'values': return { k, ents: [] };
    case 'text': return { k, text: '{text}', big: false };
    default: return { k };
  }
}

/** the templates of "＋ Neue Bildkarte" (picture 5 of docs/ideen-5.33): what a card starts with */
export const TEMPLATES = [
  { key: 'alarm', icon: '🚨', color: '#d63c31', theme: 'light', blocks: [newBlock('head'), newBlock('plan'), { ...newBlock('camera'), half: true }, newBlock('info'), newBlock('foot')] },
  { key: 'camera', icon: '📷', color: '#d63c31', theme: 'dark', blocks: [newBlock('camera'), newBlock('clock'), { k: 'text', text: '{text}', big: true },
    { ...newBlock('plan'), half: true }, { k: 'info', rows: ['who', 'weather', 'alarm'] }, newBlock('foot')] },
  { key: 'floor', icon: '🗺️', color: '#2d3f7a', theme: 'dark', blocks: [newBlock('head'), { k: 'plan', show: 'floor', marks: true },
    { k: 'info', rows: ['open', 'lights', 'temp', 'alarm'] }, newBlock('foot')] },
  { key: 'clock', icon: '🕒', color: '#3a7bd5', theme: 'dark', blocks: [newBlock('clock'), { k: 'text', text: '{text}', big: true }, newBlock('foot')] },
  { key: 'text', icon: '📝', color: '#2e9b5f', theme: 'light', blocks: [newBlock('head'), { k: 'text', text: '{text}', big: false }, newBlock('foot')] },
  { key: 'empty', icon: '⬜', color: '#3a7bd5', theme: 'light', blocks: [newBlock('head')] },
];

/** an id for a new card from its name ("Test 1" → "test-1"), not one of ids */
export function uniqueId(name, ids = []) {
  const base = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 18) || 'karte';
  let id = base, n = 2;
  while (ids.includes(id)) id = `${base}-${n++}`.slice(0, 24);
  return id;
}

/** a new card from a template */
export function fromTemplate(key, name, ids = []) {
  const tpl = TEMPLATES.find((x) => x.key === key) || TEMPLATES[0];
  return { id: uniqueId(name, ids), name: String(name || '').slice(0, 40), color: tpl.color, theme: tpl.theme, width: 'tall',
    blocks: JSON.parse(JSON.stringify(tpl.blocks)) };
}

/** a block moved up (d = -1) or down (d = 1); a new array, the same when it cannot move */
export function moveBlock(blocks, i, d) {
  const j = i + d;
  if (i < 0 || j < 0 || i >= blocks.length || j >= blocks.length) return blocks.slice();
  const out = blocks.slice();
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

/** a block taken from `from` and put in front of `to` (dragging in the list); a new array */
export function dragBlock(blocks, from, to) {
  if (from === to || from < 0 || from >= blocks.length) return blocks.slice();
  const out = blocks.slice(), [b] = out.splice(from, 1);
  out.splice(Math.max(0, Math.min(out.length, to > from ? to - 1 : to)), 0, b);
  return out;
}

/** the rows of a card: a block with "half" shares its row with the next one (as piccard.rows_of) → [[i], [i, j], …] */
export function rowsOf(blocks) {
  const out = [];
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].half && i + 1 < blocks.length && !NO_HALF.includes(blocks[i + 1].k)) { out.push([i, i + 1]); i += 1; } else out.push([i]);
  }
  return out;
}

/** the second line of a block in the list ("„WASSER“ · mit Uhrzeit", "ganze Etage · halbe Breite" …); t: the texts; floors: [{ id, name }]
 * of the house (a plan's chosen floor by its name) */
export function blockSub(b, t, names = {}, floors = []) {
  const half = b.half ? [t('pc.halfShort')] : [];
  switch (b.k) {
    case 'head': return [`„${phRead(b.text || '{kind}', t)}“`, ...(b.clock ? [t('pc.o.clock')] : [])].join(' · ');
    case 'plan': return [...(b.floor ? [floors.find((f) => f.id === b.floor)?.name || t('pc.o.floorGone')] : []),
      t(b.show === 'room' ? 'pc.o.room' : 'pc.o.floor'), ...(b.marks ? [t('pc.o.marksShort')] : []), ...half].join(' · ');
    case 'camera': return [b.ent ? names[b.ent] || b.ent : t('pc.o.camAuto'), ...half].join(' · ');
    case 'clock': return [b.date ? t('pc.o.date') : t('pc.o.timeOnly'), ...half].join(' · ');
    case 'info': return [(b.rows || []).map((r) => t(`pc.r.${r}`)).join(', ') || '–', ...half].join(' · ');
    case 'values': return [(b.ents || []).map((e) => names[e] || e).join(', ') || t('pc.o.entsNone'), ...half].join(' · ');
    case 'text': return [`„${phRead(b.text || '', t)}“`, ...(b.big ? [t('pc.o.big')] : []), ...half].join(' · ');
    case 'line': return t('pc.s.line');
    case 'foot': return t('pc.s.foot');
    default: return '';
  }
}

/** where a card is used: { kinds: the alarms it is chosen for, flows: the names of the routines that send it } */
export function usedBy(id, notify, flows) {
  const kinds = ALARM_KINDS.filter((k) => notify?.cards?.[k] === id);
  const names = (flows || []).filter((f) => (f.lanes || []).some((l) => (l.blocks || []).some((b) => b.k === 'notify' && b.card === id))).map((f) => f.name);
  return { kinds, flows: names };
}

/** a card as the page keeps it until it is saved (the add-on checks it again, piccard.clean_card) */
export function cleanCard(c) {
  const blocks = (Array.isArray(c?.blocks) ? c.blocks : []).filter((b) => KINDS.includes(b?.k)).slice(0, MAX_BLOCKS)
    .map((b) => { const x = { ...b }; if (NO_HALF.includes(x.k) || !x.half) delete x.half; return x; });
  return { id: ID.test(c?.id || '') ? c.id : uniqueId(c?.name), name: String(c?.name || '').trim().slice(0, 40), color: /^#[0-9a-f]{6}$/i.test(c?.color || '') ? c.color.toLowerCase() : '#d63c31',
    theme: c?.theme === 'dark' ? 'dark' : 'light', width: c?.width === 'wide' ? 'wide' : 'tall', blocks };
}

/** how picture cards reach the phone with the messages' settings (5.35.0, alarmnotify.pictures): 'ok' (the own Telegram bot, or Home
 * Assistant's notify services with the Companion app), 'haNoApp' (Home Assistant's services without the app: text only), 'text' (WhatsApp,
 * Telegram through CallMeBot: text only), 'off' (messages off or not loaded) */
export function cardWay(n) {
  if (!n || !n.on) return 'off';
  if (n.via === 'tgbot') return 'ok';
  if (n.via === 'ha') return (n.services || []).some((s) => String(s).startsWith('mobile_app_')) ? 'ok' : 'haNoApp';
  return 'text';
}

/** the help's sentence (5.35.0, piccardshelp.js): the keys of the sentence's boxes in order and the words between them */
export const HELP_SENTENCE = ['kind', ': ', 'name', ' · ', 'room', ' (', 'floor', ') · ', 'time'];
/** the sentence filled with sample values ('kind|name|room|floor|time', an empty one stays a gap): [{ s } | { v } | { gap: key }] */
export function helpFilled(vals) {
  const [kind, name, room, floor, time] = String(vals || '').split('|');
  const v = { kind, name, room, floor, time };
  return HELP_SENTENCE.map((p) => (PH.includes(p) ? (v[p] ? { v: v[p] } : { gap: p }) : { s: p }));
}
