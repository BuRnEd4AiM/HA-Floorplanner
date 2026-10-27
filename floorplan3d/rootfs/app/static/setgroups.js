/* Settings dialog in groups that fold open and shut (wish of the owner: "übersichtlicher … zum Ein- und Ausklappen"). The groups are
 * <details class="setGroup"> in index.html; this part remembers which ones are open (per browser), opens and shuts all of them, and searches:
 * a word typed at the top shows only the groups that have it, opened, with the matching rows marked (unless the group's own name fits).
 * On a wide screen (4.35.0, the owner: "fast über den ganzen Bildschirm … nicht ewig scrollen … professionelle Einstellung") the dialog fills
 * the screen: the groups are a list on the left (#sgNav), the chosen one stands on the right (#sgPane) with its settings as tiles in two or
 * three columns (a row with its hint is one tile, .sgTile); a search shows every group it finds there, one under the other. Phones and narrow
 * windows keep the groups that fold. Matching, the remembered state and the tiles are pure (unit test: tests/setgroups.test.mjs); initSetGroups
 * wires them to the dialog. */

const STORE = 'fp3d.setGroups';
const SIDE_STORE = 'fp3d.setGroup';
/** wide and high enough for the list of groups on the left and one group on the right */
export const SIDE_QUERY = '(min-width: 900px) and (min-height: 520px)';

/** the group to show on the right: the remembered one while it is there, else the first one there */
export const pickGroup = (stored, ids) => (ids.includes(stored) ? stored : ids[0] ?? null);

/** which children of a group go into one tile: kinds ('row', 'hint' or anything else) -> [[first, last], …]; a row is a tile, with the
 *  hints right after it (the grey line that explains it); headings, lists and boxes stay as they are */
export function tileRuns(kinds) {
  const out = [];
  kinds.forEach((k, i) => {
    const last = out[out.length - 1];
    if (k === 'row') out.push([i, i]);
    else if (k === 'hint' && last && last[1] === i - 1) last[1] = i;
  });
  return out;
}

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

/** a group's settings as tiles (see tileRuns); done again each time the dialog opens, for rows added later */
function tile(body) {
  const kids = [...body.children];
  const kind = (el) => (el.classList.contains('row') ? 'row' : el.matches('p.sub, p.hint') ? 'hint' : 'other');
  tileRuns(kids.map(kind)).forEach(([a, b]) => {
    const box = document.createElement('div');
    box.className = 'sgTile';
    kids[a].before(box);
    box.append(...kids.slice(a, b + 1));
  });
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
  if (!g) return;
  g.open = true;
  g.closest('dialog').dispatchEvent(new CustomEvent('sg-show', { detail: group }));   // wide: on the right at once, so it can be scrolled to
  reveal(g);
}

/** ctx: $, t */
export function initSetGroups(ctx) {
  const { $, t } = ctx;
  const dlg = $('#settingsDialog'), search = $('#setSearch'), allBtn = $('#sgAll'), none = $('#sgNone');
  if (!dlg || !search) return { open() {}, refresh() {} };
  const groups = () => [...dlg.querySelectorAll('details.setGroup')];
  /** a group's rows, hints and boxes, also those in a tile (the search marks the row itself) */
  const items = (g) => [...g.querySelector('.sgBody').children].flatMap((el) => (el.classList.contains('sgTile') ? [...el.children] : [el]))
    .filter((el) => el.tagName !== 'DATALIST');
  /** what an item says: its text and the tooltips in it (a hint like "follows the sun" finds the sky) */
  const textOf = (el) => [el.textContent, el.title, ...[...el.querySelectorAll('[title]')].map((x) => x.title)].join(' ');
  let searching = false, side = false, current = null;

  /* the list on the left and the place on the right; on a narrow screen the list is hidden and the place is just the groups */
  const nav = document.createElement('nav'), pane = document.createElement('div');
  nav.id = 'sgNav'; nav.setAttribute('aria-label', t('settings'));
  pane.id = 'sgPane';
  groups()[0].before(nav);
  nav.after(pane);
  pane.append(none, ...groups());
  groups().forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.group = g.dataset.group;
    b.className = [...g.classList].filter((c) => c !== 'setGroup').join(' ');    // admin-only stays admin-only
    b.innerHTML = g.querySelector('summary').innerHTML;
    b.addEventListener('click', () => { search.value = ''; searching = false; show(b.dataset.group, true); });
    nav.append(b);
  });
  const navBtns = () => [...nav.children];
  const shownIds = () => navBtns().filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.dataset.group);

  const stored = () => { try { return readOpen(localStorage.getItem(STORE)); } catch { return []; } };
  const storedSide = () => { try { return localStorage.getItem(SIDE_STORE); } catch { return null; } };
  function remember() {
    if (searching || side) return;                                // groups opened by a search are not what the user chose; wide: one at a time
    try { localStorage.setItem(STORE, JSON.stringify(groups().filter((g) => g.open).map((g) => g.dataset.group))); } catch { /* no storage */ }
  }
  /** wide: this group on the right, the others away (focus: from the list, the first field of it gets the keyboard next) */
  function show(id, focus) {
    current = id;
    try { localStorage.setItem(SIDE_STORE, id); } catch { /* not kept */ }
    dlg.querySelectorAll('.sgHit').forEach((el) => el.classList.remove('sgHit'));
    groups().forEach((g) => { g.hidden = false; g.open = g.dataset.group === id; });
    navBtns().forEach((b) => { b.hidden = false; b.classList.toggle('on', b.dataset.group === id); if (b.dataset.group === id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    none.hidden = true;
    dlg.classList.remove('sgSearching');
    pane.scrollTop = 0;
    if (focus) navBtns().find((b) => b.dataset.group === id)?.focus();
  }
  function label() { allBtn.textContent = t(groups().some((g) => !g.open && !g.hidden) ? 'sg.openAll' : 'sg.closeAll'); }
  function clear() {
    searching = false;
    dlg.querySelectorAll('.sgHit').forEach((el) => el.classList.remove('sgHit'));
    if (side) { show(pickGroup(current ?? storedSide(), shownIds())); return; }
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
    navBtns().forEach((b) => { b.hidden = !found[b.dataset.group]; b.classList.remove('on'); });   // wide: the list shows where it was found
    dlg.classList.add('sgSearching');
    pane.scrollTop = 0;
    none.hidden = Object.keys(found).length > 0;
    label();
  }
  /** wide or narrow: as the screen is now (a phone never gets the list) */
  function layout() {
    const was = side;
    side = matchMedia(SIDE_QUERY).matches && !document.body.classList.contains('phoneview');
    dlg.classList.toggle('sgSide', side);
    if (side !== was) { if (search.value) run(); else clear(); label(); }
  }
  /** the night times only matter when dimming goes by the clock */
  function refresh() {
    const by = $('#setNightDim')?.value === 'time';
    ['#setNightFrom', '#setNightTo'].forEach((s) => { const row = $(s)?.closest('.row'); if (row) row.hidden = !by; });
    label();
  }
  groups().forEach((g) => {
    g.addEventListener('toggle', () => {
      if (side && g.open && !searching && current !== g.dataset.group) show(g.dataset.group);   // opened by a link or a test: that group on the right
      remember(); label();
    });
    g.querySelector('summary').addEventListener('click', (e) => {    // wide: the head of a group does not fold it; in a search it goes there
      if (!side) return;
      e.preventDefault();
      if (searching) { search.value = ''; searching = false; show(g.dataset.group); }
    });
  });
  nav.addEventListener('keydown', (e) => {                           // ↑ / ↓ walk through the list
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const ids = shownIds().filter((id) => !navBtns().find((b) => b.dataset.group === id).hidden), i = ids.indexOf(current);
    const next = ids[Math.max(0, Math.min(ids.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) { search.value = ''; searching = false; show(next, true); }
  });
  dlg.addEventListener('sg-show', (e) => { if (side) { search.value = ''; searching = false; show(e.detail); } });
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
  $('#settingsBtn')?.addEventListener('click', () => {                            // each time it opens: the groups as left, no search
    groups().forEach((g) => tile(g.querySelector('.sgBody')));
    layout(); search.value = ''; clear(); refresh();
  });
  matchMedia(SIDE_QUERY).addEventListener?.('change', layout);
  groups().forEach((g) => tile(g.querySelector('.sgBody')));
  layout(); clear(); refresh();
  return {
    /** open the group with this id (and keep it open next time; wide: show it on the right) */
    open(id) { const g = groups().find((x) => x.dataset.group === id); if (!g) return; g.open = true; if (side) show(id); },
    refresh,
  };
}
