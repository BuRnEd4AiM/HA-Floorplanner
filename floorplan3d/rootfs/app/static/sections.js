/* Sections on the pages of the tab bar (#495, like the "Sections" of a Home Assistant dashboard; picture docs/ideen-4.9/3-abschnitte.jpg):
 * an admin groups the cards of a page under headings ("🛋 Wohnzimmer", "⚡ Strom"), moves cards between them and sets how wide a card is.
 * Stored in the page's layout (settings.pageLayouts, pagelayout.js): sections [{ id, title, icon, wide, keys }] and widths { key: 1..4 }.
 * A card in no section stays above the sections, in the order of the page. Pure (unit test: tests/sections.test.mjs; boards.py has the
 * same rules); pageboard.js draws them. */

export const MAX_SECTIONS = 12;
export const MAX_TITLE = 40;
export const SECTION_ID = /^s_[a-z0-9]{3,16}$/;
const KEY = /^[a-z0-9_:.-]{1,80}$/;
const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '');

/** the sections made safe: ids each once, a key in one section only (the first), at most MAX_SECTIONS */
export function cleanSections(v) {
  const ids = new Set(), seen = new Set(), out = [];
  (Array.isArray(v) ? v : []).forEach((s) => {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !SECTION_ID.test(s.id) || ids.has(s.id) || out.length >= MAX_SECTIONS) return;
    ids.add(s.id);
    const keys = [];
    (Array.isArray(s.keys) ? s.keys : []).forEach((k) => { if (typeof k === 'string' && KEY.test(k) && !seen.has(k) && keys.length < 120) { seen.add(k); keys.push(k); } });
    const icon = text(s.icon, 8);
    out.push({ id: s.id, title: text(s.title, MAX_TITLE), icon, wide: s.wide === true, keys });
  });
  return out;
}
/** the width an admin gave a card (1..4), per key */
export function cleanWidths(v) {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  return Object.fromEntries(Object.entries(o).filter(([k, w]) => KEY.test(k) && Number.isInteger(w) && w >= 1 && w <= 4).slice(0, 120));
}

/**
 * The cards of a page in their sections: entries (pagelayout.js arrange, in the page's order) -> { free: [entries in no section], sections:
 * [{ id, title, icon, wide, entries }] }; in a section the cards come in the order of its keys.
 */
export function groupEntries(entries, sections) {
  const where = new Map();
  cleanSections(sections).forEach((s) => s.keys.forEach((k, i) => where.set(k, [s.id, i])));
  const out = { free: [], sections: cleanSections(sections).map((s) => ({ ...s, entries: [] })) };
  const byId = new Map(out.sections.map((s) => [s.id, s]));
  (entries || []).forEach((e) => { const w = where.get(e.key); if (w) byId.get(w[0]).entries.push({ ...e, at: w[1] }); else out.free.push(e); });
  out.sections.forEach((s) => s.entries.sort((a, b) => a.at - b.at));
  return out;
}

/** a new section at the end (title and icon as typed) */
export function addSection(sections, id, title = '', icon = '') {
  const l = cleanSections(sections);
  if (!SECTION_ID.test(id) || l.length >= MAX_SECTIONS || l.some((s) => s.id === id)) return l;
  return [...l, { id, title: text(title, MAX_TITLE), icon: text(icon, 8), wide: false, keys: [] }];
}
/** a section's title, icon or width changed */
export function editSection(sections, id, { title, icon, wide } = {}) {
  return cleanSections(sections).map((s) => (s.id !== id ? s : {
    ...s, title: title === undefined ? s.title : text(title, MAX_TITLE), icon: icon === undefined ? s.icon : text(icon, 8), wide: wide === undefined ? s.wide : wide === true }));
}
/** a section taken away: its cards go back above the sections */
export const dropSection = (sections, id) => cleanSections(sections).filter((s) => s.id !== id);
/** a section moved one place earlier (-1) or later (+1) */
export function moveSection(sections, id, by) {
  const l = cleanSections(sections), i = l.findIndex((s) => s.id === id), j = i + by;
  if (i < 0 || j < 0 || j >= l.length) return l;
  const out = [...l]; [out[i], out[j]] = [out[j], out[i]];
  return out;
}
/**
 * The sections after cards were dragged: what the screen shows now, { free: [keys], sections: { id: [keys] } }, becomes the keys of each
 * section (a section the screen does not name keeps its keys, minus those now elsewhere)
 */
export function fromScreen(sections, screen) {
  const placed = new Set([...(screen?.free || []), ...Object.values(screen?.sections || {}).flat()]);
  return cleanSections(cleanSections(sections).map((s) => ({ ...s,
    keys: Array.isArray(screen?.sections?.[s.id]) ? screen.sections[s.id] : s.keys.filter((k) => !placed.has(k)) })));
}
/** the width of a card set (1..4); null takes the card's own width again */
export function withWidth(widths, key, w) {
  const o = { ...cleanWidths(widths) };
  if (Number.isInteger(w) && w >= 1 && w <= 4 && KEY.test(key)) o[key] = w; else delete o[key];
  return o;
}
/** the width a dragged corner stands for: x px from the card's left edge, columns of colW px with gap px between them, at most `cols` */
export const spanAt = (x, colW, gap, cols = 4) => Math.max(1, Math.min(cols, 4, Math.round((x + gap) / (colW + gap))));
/** a new id for a section that none of `taken` has */
export function newSectionId(taken = [], rnd = Math.random) {
  for (let i = 0; i < 50; i++) {
    const id = `s_${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0')}`;
    if (!taken.includes(id)) return id;
  }
  return `s_${Date.now().toString(36)}`;
}
