/* The "⋯" menu of the top bar in the editor (5.25.0, the owner's choice docs/ideen-5.8 picture 16, docs/ideen-5.21: "Erste Schritte (mit der
 * Kopfleiste)"): 🎬 Anleitung, 🗄️ Backup and 🛡️ Sicherheit move from the bar into one menu with a line each on what they do, and
 * 🧭 Erste Schritte is there too, so the editor's top bar fits in two rows. A small "neu" until the menu was opened once. In the live view
 * the three buttons stay in the bar (style.css hides them only in the editor); the menu just clicks them. */
const SEEN = 'fp3d.topMoreSeen';

/** ctx: $, t, firstSteps() (opens 🧭 Erste Schritte) */
export function initTopMore(ctx) {
  const { $, t } = ctx;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const wrap = make('span', 'edit-only'); wrap.id = 'topMoreWrap';
  const btn = make('button', 'icon', '⋯'); btn.id = 'topMoreBtn'; btn.type = 'button'; btn.title = t('tm.tip'); btn.setAttribute('aria-haspopup', 'true');
  const badge = make('span', 'tmNew', t('tm.new'));
  const menu = make('div'); menu.id = 'topMore'; menu.hidden = true;
  let seen = false;
  try { seen = localStorage.getItem(SEEN) === '1'; } catch { /* shown */ }
  badge.hidden = seen;
  wrap.append(btn, badge, menu);
  $('#undoBtn')?.before(wrap);

  /** the rows: [act, icon, title key, line key, the button it clicks or null] */
  const ROWS = [['first', '🧭', 'fs.title', 'tm.firstSub', null], ['guide', '🎬', 'tm.guide', 'tm.guideSub', '#guideBtn'],
    ['backup', '🗄️', 'tm.backup', 'tm.backupSub', '#backupBtn'], ['timeline', '🛡️', 'tm.timeline', 'tm.timelineSub', '#timelineBtn']];
  const usable = (sel) => {
    if (!sel) return true;
    const el = $(sel);
    if (!el || el.hidden) return false;
    return !(el.classList.contains('admin-only') && (document.body.classList.contains('readonly') || document.body.classList.contains('kiosk')));
  };
  function fill() {
    menu.replaceChildren(...ROWS.filter(([, , , , sel]) => usable(sel)).map(([act, icon, title, sub, sel]) => {
      const b = make('button', 'tmRow'); b.type = 'button'; b.dataset.act = act;
      b.append(make('b', '', `${icon} ${t(title)}`), make('span', 'sub', t(sub)));
      b.addEventListener('click', () => { close(); if (sel) $(sel)?.click(); else ctx.firstSteps(); });
      return b;
    }));
  }
  function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!menu.hidden) { close(); return; }
    fill(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (!seen) { seen = true; badge.hidden = true; try { localStorage.setItem(SEEN, '1'); } catch { /* not stored */ } }
  });
  document.addEventListener('click', (e) => { if (!menu.hidden && !wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return { close };
}
