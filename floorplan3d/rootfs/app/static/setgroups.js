/* Settings dialog in groups that fold open and shut (wish of the owner: "übersichtlicher … zum Ein- und Ausklappen"). The groups are
 * <details class="setGroup"> in index.html; this part remembers which ones are open (per browser), opens and shuts all of them, and searches:
 * a word typed at the top shows only the groups that have it, opened, with the matching rows marked (unless the group's own name fits). Matching and the remembered state are
 * pure (unit test: tests/setgroups.test.mjs); initSetGroups wires them to the dialog. */

const STORE = 'fp3d.setGroups';

/** text for matching: lower case, without accents ("Küche" -> "kuche", "Ç" -> "c") */
export const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** groups: [{ id, title, items: [text] }]; query: what is typed. null when nothing is typed, else { id: { all, hits } } for the groups that
 *  match: all = the title has every word (the whole group fits), hits = the items that have every word */
export function searchGroups(groups, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const has = (txt) => { const f = fold(txt); return words.every((w) => f.includes(w)); };
  const out = {};
  (groups || []).forEach((g) => {
    const all = has(g.title), hits = [];
    (g.items || []).forEach((x, i) => { if (has(x)) hits.push(i); });
    if (all || hits.length) out[g.id] = { all, hits };
  });
  return out;
}

/** the open groups as stored (a JSON list of ids); junk -> [] */
export function readOpen(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x.length <= 40))].slice(0, 40) : [];
  } catch { return []; }
}

/** scrolls el of a dialog into view below the dialog's sticky head, which would cover its top (the 🩺 microphone test, a group) */
export function reveal(el) {
  const dlg = el?.closest('dialog');
  if (!dlg) return;
  el.scrollIntoView({ block: 'start' });
  const head = dlg.querySelector('.dlgHead'), over = head ? head.getBoundingClientRect().bottom - el.getBoundingClientRect().top + 8 : 0;
  if (over > 0) dlg.scrollTop -= over;
}

/** the settings with one group open and shown (the light list's "Set up groups", 🎤's "🩺 Mikrofon-Test öffnen") */
export function openSettingsAt($, group) {
  $('#settingsBtn').click();
  const g = $(`#settingsDialog details[data-group="${group}"]`);
  if (g) { g.open = true; reveal(g); }
}

/** ctx: $, t */
export function initSetGroups(ctx) {
  const { $, t } = ctx;
  const dlg = $('#settingsDialog'), search = $('#setSearch'), allBtn = $('#sgAll'), none = $('#sgNone');
  if (!dlg || !search) return { open() {}, refresh() {} };
  const groups = () => [...dlg.querySelectorAll('details.setGroup')];
  const items = (g) => [...g.querySelector('.sgBody').children].filter((el) => el.tagName !== 'DATALIST');
  /** what an item says: its text and the tooltips in it (a hint like "follows the sun" finds the sky) */
  const textOf = (el) => [el.textContent, el.title, ...[...el.querySelectorAll('[title]')].map((x) => x.title)].join(' ');
  let searching = false;

  const stored = () => { try { return readOpen(localStorage.getItem(STORE)); } catch { return []; } };
  function remember() {
    if (searching) return;                                       // groups opened by a search are not what the user chose
    try { localStorage.setItem(STORE, JSON.stringify(groups().filter((g) => g.open).map((g) => g.dataset.group))); } catch { /* no storage */ }
  }
  function label() { allBtn.textContent = t(groups().some((g) => !g.open && !g.hidden) ? 'sg.openAll' : 'sg.closeAll'); }
  function clear() {
    searching = false;
    dlg.querySelectorAll('.sgHit').forEach((el) => el.classList.remove('sgHit'));
    const open = new Set(stored());
    groups().forEach((g) => { g.hidden = false; g.open = open.has(g.dataset.group); });
    none.hidden = true;
  }
  function run() {
    const found = searchGroups(groups().map((g) => ({ id: g.dataset.group, title: g.querySelector('summary').textContent, items: items(g).map(textOf) })), search.value);
    if (!found) { clear(); label(); return; }
    searching = true;
    dlg.querySelectorAll('.sgHit').forEach((el) => el.classList.remove('sgHit'));
    groups().forEach((g) => {
      const f = found[g.dataset.group];
      g.hidden = !f; g.open = !!f;
      if (f && !f.all) { const its = items(g); f.hits.forEach((i) => its[i].classList.add('sgHit')); }   // the whole group fits: no marks all over it
    });
    none.hidden = Object.keys(found).length > 0;
    label();
  }
  /** the night times only matter when dimming goes by the clock */
  function refresh() {
    const by = $('#setNightDim')?.value === 'time';
    ['#setNightFrom', '#setNightTo'].forEach((s) => { const row = $(s)?.closest('.row'); if (row) row.hidden = !by; });
    label();
  }
  groups().forEach((g) => g.addEventListener('toggle', () => { remember(); label(); }));
  search.addEventListener('input', run);
  search.addEventListener('change', (e) => e.stopPropagation());                  // not a setting: the dialog saves on every change
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();                                     // Enter would send the form and close the dialog
    if (e.key === 'Escape' && search.value) { e.preventDefault(); search.value = ''; run(); }
  });
  allBtn.addEventListener('click', () => {
    const open = groups().some((g) => !g.open && !g.hidden);
    groups().forEach((g) => { if (!g.hidden) g.open = open; });
    label();
  });
  dlg.addEventListener('change', refresh);
  $('#settingsBtn')?.addEventListener('click', () => { search.value = ''; clear(); refresh(); });   // each time it opens: the groups as left, no search
  clear(); refresh();
  return {
    /** open the group with this id (and keep it open next time) */
    open(id) { const g = groups().find((x) => x.dataset.group === id); if (g) g.open = true; },
    refresh,
  };
}
