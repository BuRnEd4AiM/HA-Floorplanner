/* Own pages of the tab bar (#484): an admin makes one with "＋ Seite" (tabedit.js); it holds only own cards (pageboard.js, cardsui.js).
 * One page object per own page, made when it first appears ({ el, render, update, has, reset } like the built-in pages of tabsui.js). */
import { cleanCustomTabs } from './tabs.js';

/** ctx: t, host (#tabPages), settings(), board, canEdit() */
export function initCustomPages(ctx) {
  const { t } = ctx;
  const pages = new Map();                           // id -> page
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function page(id) {
    let el = ctx.host.querySelector(`.tabPage[data-page="${id}"]`);
    if (!el) { el = make('section', 'tabPage'); el.dataset.page = id; el.hidden = true; ctx.host.append(el); }
    const info = () => cleanCustomTabs(ctx.settings().customTabs).find((x) => x.id === id);
    let grid = null;
    function render() {
      const p = info();
      if (!p) return;
      const head = make('div', 'tpHead');
      head.append(make('h2', '', `${p.icon} ${p.name}`));
      grid = make('div');
      el.replaceChildren(head, grid);
      ctx.board.fill(id, grid, [], { min: 300 });
      if (!ctx.board.layout(id).cards.length) el.append(make('p', 'tpSub cpEmpty', ctx.canEdit() ? t('cp.emptyEdit') : t('cp.empty')));
    }
    return { el, render, update: () => ctx.board.refresh(id), has: () => !!info(), reset: () => {} };
  }
  /** the page objects of the own pages that exist now (the section of a deleted one is removed) */
  function all() {
    const ids = cleanCustomTabs(ctx.settings().customTabs).map((x) => x.id);
    [...pages.keys()].filter((id) => !ids.includes(id)).forEach((id) => { pages.get(id).el.remove(); pages.delete(id); });
    ids.forEach((id) => { if (!pages.has(id)) pages.set(id, page(id)); });
    return Object.fromEntries(pages);
  }
  return { all };
}
