/* Example pictures for the settings over (almost) the whole screen (wish of the owner, 2026-10-27: "dass diese fast über den ganzen
 * Bildschirm geht, so muss man nicht ewig scrollen … professionelle Einstellung … schön und übersichtlich"). Injected into the demo by
 * make_pictures.py; it only rearranges the settings dialog that is there:
 *   mkSet.sidebar(group)  the groups as a list on the left, one group on the right, its settings as tiles in two or three columns
 *   mkSet.cards()         all groups open at once as cards in three columns */
window.mkSet = (() => {
  const css = `
#settingsDialog.mkSide, #settingsDialog.mkGrid { width: min(1480px, calc(100vw - 48px)); height: calc(100vh - 48px); max-height: none; padding: 0; overflow: hidden; }
#settingsDialog.mkSide > form, #settingsDialog.mkGrid > form { display: grid; height: 100%; min-height: 0; grid-template-rows: auto minmax(0, 1fr) auto; }
#settingsDialog.mkSide > form { grid-template-columns: 300px minmax(0, 1fr); }
#settingsDialog.mkSide .dlgHead, #settingsDialog.mkGrid .dlgHead { grid-column: 1 / -1; display: flex; flex-wrap: nowrap; align-items: center; gap: 18px; padding: 14px 22px; margin: 0; border-bottom: 1px solid var(--line); position: static; }
.mkSide .dlgHead h2, .mkGrid .dlgHead h2 { margin: 0; font-size: 20px; white-space: nowrap; }
#settingsDialog.mkSide .sgBar, #settingsDialog.mkGrid .sgBar { flex: 0 1 560px; margin: 0 auto; }
.mkSide #sgAll, .mkSide #sgNone, .mkGrid #sgNone { display: none; }
.mkSide .dlgClose, .mkGrid .dlgClose { order: 3; position: static; }
.mkNav { grid-column: 1; grid-row: 2; overflow-y: auto; padding: 12px 10px; border-right: 1px solid var(--line); background: color-mix(in srgb, var(--field) 30%, transparent); }
.mkNav button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 12px; margin: 2px 0; border: 0; border-radius: 10px; background: none; color: var(--text); text-align: left; cursor: pointer; font: inherit; }
.mkNav button:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
.mkNav button.on { background: color-mix(in srgb, var(--accent) 22%, transparent); box-shadow: inset 3px 0 0 var(--accent); }
.mkNav .sgIcon { font-size: 20px; width: 26px; text-align: center; flex: none; }
.mkNav .sgText { display: flex; flex-direction: column; min-width: 0; }
.mkNav .sgText small { color: var(--muted); font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mkSide .mkMain { grid-column: 2; grid-row: 2; overflow-y: auto; padding: 22px 28px; }
.mkSide .setGroup { display: none; border: 0; background: none; margin: 0; }
.mkSide .setGroup.mkOn { display: block; }
.mkSide .setGroup > summary { pointer-events: none; padding: 0 0 18px; border: 0 !important; background: none !important; }
.mkSide .setGroup > summary::after { display: none; }
.mkSide .setGroup > summary .sgIcon { font-size: 30px; width: 40px; }
.mkSide .setGroup > summary b { font-size: 22px; }
.mkSide .setGroup > summary small { font-size: 13px; white-space: normal; }
.mkSide .sgBody { padding: 0; }
.mkItems { display: grid; grid-template-columns: repeat(auto-fill, minmax(430px, 1fr)); gap: 12px; align-items: stretch; }
.mkItem { border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; background: color-mix(in srgb, var(--field) 45%, transparent); min-width: 0; }
.mkItem .row { margin: 0; }
.mkItem .row select { width: min(340px, 58%); }
.mkItem .row input[type=number], .mkItem .row input[type=text] { width: 220px; }
.mkItem p.sub { margin: 6px 0 0 !important; }
.mkWide { grid-column: 1 / -1; }
.mkSec { grid-column: 1 / -1; margin: 12px 0 0 !important; }
.mkSide menu, .mkGrid menu { grid-column: 1 / -1; margin: 0; padding: 12px 22px; border-top: 1px solid var(--line); }
.mkGrid .mkMain { overflow-y: auto; padding: 18px 22px; columns: 3 400px; column-gap: 16px; }
.mkGrid .setGroup { break-inside: avoid; margin: 0 0 16px; display: inline-block; width: 100%; }
.mkGrid .setGroup > summary::after { display: none; }
.mkGrid .setGroup > summary { pointer-events: none; }
`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.append(st);
  const dlg = () => document.querySelector('#settingsDialog');
  const groups = () => [...dlg().querySelectorAll('details.setGroup')];
  function open() { if (!dlg().open) document.querySelector('#settingsBtn').click(); }
  function main() {
    let m = dlg().querySelector('.mkMain');
    if (!m) { m = document.createElement('div'); m.className = 'mkMain'; const g = groups(); g[0].before(m); m.append(...g); }
    return m;
  }
  /** a group's settings as tiles: a row with its hint below is one tile, a heading spans the width, anything bigger (lists) too */
  function itemize(body) {
    if (body.dataset.mk) return;
    body.dataset.mk = '1';
    const grid = document.createElement('div');
    grid.className = 'mkItems';
    let cur = null;
    for (const el of [...body.children]) {
      if (el.tagName === 'DATALIST') { grid.append(el); continue; }
      if (el.tagName === 'H4') { el.classList.add('mkSec'); grid.append(el); cur = null; continue; }
      if (cur && el.matches('p.sub, p.hint')) { cur.append(el); continue; }
      const tile = document.createElement('div');
      tile.className = el.matches('.row') ? 'mkItem' : 'mkItem mkWide';
      tile.append(el);
      grid.append(tile);
      cur = el.matches('.row') ? tile : null;
    }
    body.append(grid);
  }
  function show(id) {
    groups().forEach((g) => { const on = g.dataset.group === id; g.classList.toggle('mkOn', on); g.open = on; if (on) itemize(g.querySelector('.sgBody')); });
    dlg().querySelectorAll('.mkNav button').forEach((b) => b.classList.toggle('on', b.dataset.g === id));
  }
  function sidebar(id) {
    open();
    dlg().classList.add('mkSide');
    const m = main();
    if (!dlg().querySelector('.mkNav')) {
      const nav = document.createElement('nav');
      nav.className = 'mkNav';
      m.before(nav);
      for (const g of groups()) {
        if (g.hidden) continue;
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.g = g.dataset.group;
        b.innerHTML = g.querySelector('summary').innerHTML;
        b.onclick = () => show(g.dataset.group);
        nav.append(b);
      }
    }
    show(id);
  }
  function cards() {
    open();
    dlg().classList.add('mkGrid');
    main();
    groups().forEach((g) => { g.open = true; });
  }
  /** as it is today, with one group open */
  function today(id) {
    open();
    groups().forEach((g) => { g.open = g.dataset.group === id; });
  }
  return { sidebar, cards, today };
})();
