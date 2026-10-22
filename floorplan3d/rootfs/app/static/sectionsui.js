/* Sections on a page of the tab bar (#495, sections.js has the rules): the frame of a page with sections (the cards in no section above,
 * then a grid of sections, each with its heading and its own grid of cards), the tools of a section in the edit mode (‹ › move, ✏️, 🗑) and
 * the window to name a section (title, symbol, wide). pageboard.js puts the cards in and saves what changed. */
import { MAX_TITLE } from './sections.js';

export const ICONS = ['🛋', '🛏', '🍳', '🛁', '🧒', '💻', '🚪', '🌱', '🚗', '⚡', '☀️', '🔥', '❄️', '💡', '🔒', '📷', '🎵', '📺', '🧺', '📅', '🏠', '🌡️', '💧', '⭐'];

/** ctx: t, edit: { move(page, id, by), drop(page, id), save(page, id, { title, icon, wide }) } */
export function initSectionsUi(ctx) {
  const { t } = ctx;
  const frames = new WeakMap();                      // root -> { sig, free, grids: Map(section id -> grid) }
  let dlg = null;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', (e) => { e.stopPropagation(); on(e); }); return b; };

  /**
   * The frame of a page with sections in root: { free (the grid of the cards in no section), grids: Map(id -> grid) }. Made again only
   * when the sections, their names or the edit mode changed (the cards keep their place otherwise).
   */
  function frame(page, root, sections, edit, min) {
    const sig = JSON.stringify([sections.map((s) => [s.id, s.title, s.icon, s.wide]), edit, min]);
    const was = frames.get(root);
    if (was && was.sig === sig && root.contains(was.free)) return { ...was, fresh: false };
    const free = make('div', 'bdGrid bdFree'); free.style.setProperty('--bdMin', `${min}px`);
    const wrap = make('div', 'bdSecs'), grids = new Map();
    wrap.style.setProperty('--secMin', `${min}px`);                // a section is a column of cards as wide as the page's, a wide one two
    sections.forEach((s, i) => {
      const sec = make('section', `bdSection${s.wide ? ' wide' : ''}${edit ? ' bdEdit' : ''}`); sec.dataset.section = s.id;
      const h = make('h3', 'bdSecHead');
      h.append(make('span', 'bdSecTitle', `${s.icon ? `${s.icon} ` : ''}${s.title || t('sec.untitled')}`));
      if (edit) {
        const tools = make('span', 'bdSecTools');
        const left = btn('bdTool', '‹', () => ctx.edit.move(page, s.id, -1), t('sec.earlier')); left.disabled = i === 0; left.dataset.act = 'secLeft';
        const right = btn('bdTool', '›', () => ctx.edit.move(page, s.id, 1), t('sec.later')); right.disabled = i === sections.length - 1; right.dataset.act = 'secRight';
        const ed = btn('bdTool', '✏️', () => open(page, s), t('sec.edit')); ed.dataset.act = 'secEdit';
        const del = btn('bdTool', '🗑', () => { if (window.confirm(t('sec.delAsk'))) ctx.edit.drop(page, s.id); }, t('sec.del')); del.dataset.act = 'secDel';
        tools.append(left, right, ed, del);
        h.append(tools);
      }
      const g = make('div', 'bdGrid bdSecGrid'); g.dataset.section = s.id; g.style.setProperty('--bdMin', `${min}px`);
      if (edit) g.dataset.empty = t('sec.dropHere');
      sec.append(h, g); wrap.append(sec); grids.set(s.id, g);
    });
    root.replaceChildren(free, wrap);
    const f = { sig, free, grids };
    frames.set(root, f);
    return { ...f, fresh: true };
  }

  /** the window to name a section: title, symbol, wide (two columns) */
  function open(page, s) {
    if (!dlg) { dlg = make('dialog', 'ceDlg secDlg'); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); document.body.append(dlg); }
    let icon = s.icon || '', wide = !!s.wide;
    const title = make('input', 'ceInput'); title.value = s.title || ''; title.maxLength = MAX_TITLE; title.placeholder = t('sec.titlePh'); title.dataset.act = 'secTitle';
    const icons = make('div', 'secIcons');
    const mark = () => icons.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.icon === icon));
    ['', ...ICONS].forEach((x) => { const b = btn('', x || '∅', () => { icon = x; mark(); }); b.dataset.icon = x; icons.append(b); });
    mark();
    const wideRow = make('div', 'ceSeg');
    const markW = () => wideRow.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(wide)));
    [[false, t('sec.normal')], [true, t('sec.wide')]].forEach(([v, txt]) => { const b = btn('', txt, () => { wide = v; markW(); }); b.dataset.v = String(v); wideRow.append(b); });
    markW();
    const field = (label, node) => { const f = make('div', 'ceField'); f.append(make('label', '', label), node); return f; };
    const save = btn('bdBtn primary', `✓ ${t('ce.save')}`, () => { ctx.edit.save(page, s.id, { title: title.value, icon, wide }); dlg.close(); }); save.dataset.act = 'save';
    const bar = make('div', 'ceBtns'); bar.append(btn('bdBtn', t('ce.cancel'), () => dlg.close()), save);
    const head = make('div', 'ceHead'); head.append(make('h3', '', `🗂 ${t('sec.edit')}`), make('p', 'tpSub', t('sec.editSub')));
    dlg.replaceChildren(head, field(t('sec.title'), title), field(t('sec.icon'), icons), field(t('sec.width'), wideRow), bar);
    if (!dlg.open) dlg.showModal();
    title.focus();
  }
  return { frame, open };
}
