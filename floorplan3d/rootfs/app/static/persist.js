/* Changes, undo and saving (step 22 of the split, part 2, #137): every change can be undone (the last UNDO_LIMIT states of the plan)
 * and done again (redo, #404), and the plan of the open house is saved a moment after the last change (autosave). A save carries the
 * version tag of the plan this screen loaded: when another screen saved the plan meanwhile, the add-on refuses it and the owner is asked
 * whether to load the other version or keep this one (#403). The list rules and the save rules are pure (unit test:
 * tests/persist.test.mjs); initPersist keeps the lists, the tag and the save timer. Applying an undone plan stays in app.js. */
import { oneAtATime } from './settings.js';

export const UNDO_LIMIT = 60;

/** remember one state of the plan (as JSON); the oldest is dropped beyond `limit` */
export function pushUndo(stack, json, limit = UNDO_LIMIT) {
  stack.push(json);
  if (stack.length > limit) stack.shift();
  return stack;
}
/** the headers of a save: with the version tag of the plan as this screen loaded it (none: saved over whatever is there) */
export const saveHeaders = (rev) => ({ 'Content-Type': 'application/json', ...(rev ? { 'If-Match': rev } : {}) });
/** what the answer to a save means: 'ok' | 'conflict' (another screen saved the plan meanwhile) | 'failed' */
export const saveOutcome = (status) => (status >= 200 && status < 300 ? 'ok' : status === 409 ? 'conflict' : 'failed');
/** the version tag after entities were renamed in Home Assistant: the add-on rewrote the stored plan ([before, after] tags) and this
 *  screen did the same with its copy, so the new tag is ours, unless the plan was saved elsewhere before (then the old one stays) */
export const renamedRev = (rev, pair) => (Array.isArray(pair) && rev && rev === pair[0] ? pair[1] : rev);

/** ctx: t, layout(), url() (where the open house is saved), autosaveSeconds(), setStatus(txt),
 *  conflict() -> Promise<'reload' | 'keep'> (the question when another screen saved the plan meanwhile), reopen(layout) (the plan
 *  loaded again from the add-on replaces the one open here) */
export function initPersist(ctx) {
  const stack = [], redoStack = [];
  let timer = null, rev = null;
  const now = () => JSON.stringify(ctx.layout());
  /** before a change: remember the plan as it is; what was undone cannot be done again after a new change */
  const snapshot = () => { pushUndo(stack, now()); redoStack.length = 0; };
  /** the plan before the last change, null when there is nothing to undo; the plan as it is can be brought back with popRedo */
  const popUndo = () => { const s = stack.pop(); if (!s) return null; pushUndo(redoStack, now()); return JSON.parse(s); };
  /** the plan before the last undo, null when there is nothing to do again */
  const popRedo = () => { const s = redoStack.pop(); if (!s) return null; pushUndo(stack, now()); return JSON.parse(s); };
  /** another house was opened: its changes are not ours to undo */
  const clearUndo = () => { stack.length = 0; redoStack.length = 0; };
  /** every remembered state changed by fn(json) -> json (entities renamed in Home Assistant: an undo must not bring the old ids back) */
  const mapUndo = (fn) => { [stack, redoStack].forEach((l) => l.forEach((s, i) => { l[i] = fn(s); })); };
  /** save a moment after the last change */
  function schedule() {
    ctx.setStatus(ctx.t('unsaved'));
    clearTimeout(timer);
    timer = setTimeout(save, (ctx.autosaveSeconds() || 1.5) * 1000);
  }
  /** the plan of the open house from the add-on; its version tag goes with the next save */
  async function load() {
    const r = await fetch(ctx.url());
    const layout = await r.json();
    rev = r.ok ? r.headers.get('ETag') : null;
    return layout;
  }
  const put = (tag) => fetch(ctx.url(), { method: 'PUT', headers: saveHeaders(tag), body: now() });
  /** one save at a time: two at once would carry the same tag, and the second would look like a change made on another screen */
  const save = oneAtATime(async () => {
    clearTimeout(timer);
    try {
      let r = await put(rev);
      if (saveOutcome(r.status) === 'conflict') {
        ctx.setStatus(ctx.t('conf.status'));
        if ((await ctx.conflict()) === 'reload') {
          const layout = await load();
          clearUndo();
          ctx.reopen(layout);
          ctx.setStatus(ctx.t('conf.reloaded'));
          return;
        }
        r = await put(null);                                 // keep the plan of this screen: saved over the other one
      }
      if (r.ok) rev = r.headers.get('ETag');
      ctx.setStatus(r.ok ? ctx.t('saved') : ctx.t('saveFailed'));
    } catch { ctx.setStatus(ctx.t('saveFailed')); }
  });
  /** entities were renamed in Home Assistant: pair = [tag before, tag after] of the open house's plan */
  const renamed = (pair) => { rev = renamedRev(rev, pair); };
  /** something was changed in this session (a save before leaving the house is due) */
  const touched = () => timer !== null;
  return { snapshot, popUndo, popRedo, canUndo: () => stack.length > 0, canRedo: () => redoStack.length > 0, clearUndo, mapUndo, schedule,
    save, load, renamed, touched, rev: () => rev };
}
