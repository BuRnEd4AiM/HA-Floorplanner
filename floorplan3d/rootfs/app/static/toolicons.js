/* Tool bar with icons and groups (#422): every tool of the edit mode gets a line icon with its name under it, and the tools stand in groups
 * with a small caption (select | DRAW | PLACE | TOOLS). The buttons stay where toolbar.js puts them (it can hide, move and fold them), so
 * the groups are worked out from the order shown: a caption on the first button of each run of the same group. Which group comes when is
 * pure (`groupStarts`, unit test: tests/toolicons.test.mjs); decorate() and markGroups() touch the page. */

/** the icons, 24×24 line drawings (stroke: the text colour) */
export const ICONS = {
  select: '<path d="M5 3l13 7.5-5.5 1.6L10 18z"/>',
  wall: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 12h18M9 5v7M15 12v7"/>',
  room: '<path d="M4 4h16v16H4z"/><path d="M4 13h7v7M13 4v5h7"/>',
  autoRooms: '<path d="M4 20L15 9"/><path d="M15 3v3M19.5 5.5l-2 2M21 10h-3M11 5.5l2 2"/>',
  block: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  plot: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  hole: '<rect x="4" y="4" width="16" height="16" rx="1.5" stroke-dasharray="3 2.5"/>',
  opening: '<path d="M6 21V4h12v17"/><path d="M3 21h18"/><circle cx="15" cy="13" r="1"/>',
  device: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  measure: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7.5 12.5l2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>',
  erase: '<path d="M8 20h12"/><path d="M4.5 15.5l9-9.5 5.5 5.5-8.5 8.5H8.5z"/><path d="M9 11l5 5"/>',
  power: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  cable: '<path d="M4 20c4 0 4-8 8-8s4 8 8 8"/><circle cx="4" cy="20" r="1.6"/><circle cx="20" cy="20" r="1.6"/><path d="M12 12V4"/>',
  energy: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3"/>',
  dormer: '<path d="M3 12l9-7.5L21 12"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  import: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
};

/** the group of each tool (ids of toolbar.js); the selection tool stands alone */
export const TOOL_GROUP = {
  select: '', wall: 'draw', room: 'draw', autoRooms: 'draw', block: 'draw', plot: 'draw', stairs: 'draw', hole: 'draw', dormer: 'draw',
  opening: 'place', device: 'place',
  measure: 'tools', erase: 'tools', power: 'tools', cable: 'tools', energy: 'tools', import: 'tools',
};

/** the tools shown in the bar in their order -> [{ id, cap }]: cap is the group whose caption the button carries (null: none, '' the
 *  selection tool, which starts a group of its own but has no caption) */
export function groupStarts(ids) {
  let prev;
  return ids.map((id) => {
    const g = TOOL_GROUP[id] ?? 'tools';
    const cap = g !== prev ? g : null;
    prev = g;
    return { id, cap };
  });
}

const svg = (k) => `<svg class="tIcon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;

/** put the icons into the buttons (once): btnOf(id) finds a tool's button, `more` is the More button */
export function decorate(ids, btnOf, more) {
  [...ids.map((id) => [id, btnOf(id)]), ['more', more]].forEach(([id, b]) => {
    if (!b || b.querySelector('.tIcon')) return;
    b.classList.add('tBtn');
    b.insertAdjacentHTML('afterbegin', svg(id));
  });
}

/** mark the start of each group among the buttons shown (in bar order): data-cap with the caption, class tgStart for the line before it */
export function markGroups(shown, t) {
  const starts = groupStarts(shown.map(([id]) => id));
  shown.forEach(([, b], i) => {
    const cap = starts[i].cap;
    b.classList.toggle('tgStart', cap !== null && i > 0);
    if (cap) b.dataset.cap = t(`tg.${cap}`); else delete b.dataset.cap;
  });
}
