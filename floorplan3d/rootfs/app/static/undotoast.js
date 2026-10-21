/* "Gelöscht · ↶ Rückgängig" (#471): a short note at the bottom for a few seconds after something was deleted in the editor, with a
 * button that undoes it; handy on a tablet without Ctrl+Z. Several things deleted in one go (a selection of many) make one note. The note
 * goes as soon as anything else is changed or undone, so its button only ever undoes the deletion it names. The text is pure (unit test:
 * tests/undotoast.test.mjs). */

export const TOAST_MS = 6000;

/** the text of the note: one thing or n things deleted */
export const deletedText = (n, t) => (n > 1 ? t('undo.deletedN', { n }) : t('undo.deleted'));

/** ctx: $, t, undo() */
export function initUndoToast(ctx) {
  const { $, t } = ctx;
  const box = $('#undoToast'), text = box.querySelector('span'), btn = box.querySelector('button');
  let timer = 0, count = 0, pending = false, at = 0;
  function hide() { box.hidden = true; clearTimeout(timer); }
  function show(n) {
    text.textContent = deletedText(n, t);
    btn.textContent = `↶ ${t('undo.btn')}`;
    box.hidden = false; at = Date.now();
    clearTimeout(timer); timer = setTimeout(hide, TOAST_MS);
  }
  /** something was deleted (edititems.js): deletions in the same moment are counted together */
  function deleted() {
    if (!pending) { pending = true; count = 0; queueMicrotask(() => { pending = false; show(count); }); }
    count++;
  }
  /** the plan changed otherwise (a new step to undo, an undo, a redo): the note would undo the wrong thing now */
  function changed() { if (!box.hidden && !pending && Date.now() - at > 50) hide(); }
  btn.addEventListener('click', () => { hide(); ctx.undo(); });
  return { deleted, changed, hide };
}
