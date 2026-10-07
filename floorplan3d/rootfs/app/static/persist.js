/* Changes, undo and saving (step 22 of the split, part 2, #137): every change can be undone (the last UNDO_LIMIT states of the plan),
 * and the plan of the open house is saved a moment after the last change (autosave). The undo list rule is pure (unit test:
 * tests/persist.test.mjs); initPersist keeps the list and the save timer. Applying an undone plan stays in app.js. */

export const UNDO_LIMIT = 60;

/** remember one state of the plan (as JSON); the oldest is dropped beyond `limit` */
export function pushUndo(stack, json, limit = UNDO_LIMIT) {
  stack.push(json);
  if (stack.length > limit) stack.shift();
  return stack;
}

/** ctx: t, layout(), url() (where the open house is saved), autosaveSeconds(), setStatus(txt) */
export function initPersist(ctx) {
  const stack = [];
  let timer = null;
  /** before a change: remember the plan as it is */
  const snapshot = () => { pushUndo(stack, JSON.stringify(ctx.layout())); };
  /** the plan before the last change, null when there is nothing to undo */
  const popUndo = () => { const s = stack.pop(); return s ? JSON.parse(s) : null; };
  /** another house was opened: its changes are not ours to undo */
  const clearUndo = () => { stack.length = 0; };
  /** save a moment after the last change */
  function schedule() {
    ctx.setStatus(ctx.t('unsaved'));
    clearTimeout(timer);
    timer = setTimeout(save, (ctx.autosaveSeconds() || 1.5) * 1000);
  }
  async function save() {
    clearTimeout(timer);
    try {
      const r = await fetch(ctx.url(), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ctx.layout()) });
      ctx.setStatus(r.ok ? ctx.t('saved') : ctx.t('saveFailed'));
    } catch { ctx.setStatus(ctx.t('saveFailed')); }
  }
  /** something was changed in this session (a save before leaving the house is due) */
  const touched = () => timer !== null;
  return { snapshot, popUndo, clearUndo, schedule, save, touched };
}
