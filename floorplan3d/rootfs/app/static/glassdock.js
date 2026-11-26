/* 🍏 Glas: the scenes and the tab bar float over the 3D picture as one capsule (5.37.2, the owner after 5.37.0: the strip at the bottom
 * „verkleinert komplett das Bild … dass dieser Balken sich als Hintergrund an die Icons schmiegt … leicht durchsichtig“, his choice in
 * docs/ideen-5.37, pictures 20–23: „Szenen und Reiter in eine Kapsel“). Only in the glass designs and on a wider screen (a tablet, a PC;
 * the phone app has its own bar): the bars keep their place below the stage, but their background goes (style.css, „Glas-Kapsel“), the 3D
 * picture and the pages run on under them (--dock-h: how far below the stage the screen goes on) and one capsule of glass (#glassDock)
 * lies behind both, as wide as the wider of the two rows. dockBox is pure (tests/glassdock.test.mjs). */

/** the capsule around the rows: rects [{ left, top, right, bottom }] (the ones with no width are left out), pad around them; null for none */
export function dockBox(rects, pad = 6) {
  const rs = (rects || []).filter((r) => r && r.right - r.left > 0 && r.bottom - r.top > 0);
  if (!rs.length) return null;
  const left = Math.min(...rs.map((r) => r.left)) - pad, top = Math.min(...rs.map((r) => r.top)) - pad;
  const right = Math.max(...rs.map((r) => r.right)) + pad, bottom = Math.max(...rs.map((r) => r.bottom)) + pad;
  return { left: Math.round(left), top: Math.round(top), width: Math.round(right - left), height: Math.round(bottom - top) };
}
/** how far the 3D picture and the pages run on below the stage: the screen below it, never less than 0 */
export const dockHeight = (screenH, stageBottom) => Math.max(0, Math.round((Number(screenH) || 0) - (Number(stageBottom) || 0)));
/** the capsule is wanted: a glass design, a screen wider than a phone, not while the tabs are being edited */
export const dockWanted = ({ glass, wide, tabEditing }) => !!glass && !!wide && !tabEditing;

/** ctx: app (#app), stage (#stage), scene (#sceneBar), tabs (#tabBar). Returns { update() } */
export function initGlassDock({ app, stage, scene, tabs }) {
  const root = document.documentElement;
  const wideQ = window.matchMedia?.('(min-width: 761px)');
  const dock = document.createElement('div');
  dock.id = 'glassDock'; dock.hidden = true; dock.setAttribute('aria-hidden', 'true');
  app?.append(dock);
  let queued = false;
  function update() {
    queued = false;
    const on = dockWanted({ glass: !!root.dataset.glass, wide: wideQ ? wideQ.matches : true, tabEditing: document.body.classList.contains('tabEditing') });
    root.classList.toggle('glassDock', on);
    if (!on) { dock.hidden = true; root.style.removeProperty('--dock-h'); return; }
    const shown = (e) => e && !e.hidden && e.offsetParent !== null;
    const strip = shown(scene) ? scene.querySelector('.sbStrip') : null;
    const box = dockBox([strip?.getBoundingClientRect(), shown(tabs) ? tabs.getBoundingClientRect() : null]);
    const h = stage ? dockHeight(window.innerHeight, stage.getBoundingClientRect().bottom) : 0;
    root.style.setProperty('--dock-h', `${h}px`);
    if (!box) { dock.hidden = true; return; }
    Object.assign(dock.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    dock.hidden = false;
  }
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(later); [stage, scene, tabs].forEach((e) => e && ro.observe(e)); }
  const mo = new MutationObserver(later);
  [scene, tabs].forEach((e) => e && mo.observe(e, { attributes: true, attributeFilter: ['hidden', 'class'], childList: true, subtree: true }));
  mo.observe(root, { attributes: true, attributeFilter: ['data-glass'] });
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  wideQ?.addEventListener?.('change', later);
  window.addEventListener('resize', later);
  later();
  return { update };
}
