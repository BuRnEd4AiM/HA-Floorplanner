/* Entities renamed in Home Assistant: the add-on rewrites the stored plans (renames.py) and tells every open view, which does the same
 * with the plan it holds and with its undo list, so an autosave cannot bring the old ids back. The rules are the ones of renames.py:
 * exact strings (also keys) are replaced, and an object whose `name` is still Home Assistant's old name of its `entity` gets the new
 * name (a name typed by hand stays). Pure (unit test: tests/renames.test.mjs). */

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** ids: { old id: new id }, names: { entity id: [old name, new name] }; obj changed in place, returns the number of changes */
export function rewriteIds(obj, ids = {}, names = {}) {
  let count = 0;
  const walk = (o) => {
    if (Array.isArray(o)) {
      o.forEach((v, i) => {
        if (typeof v === 'string') { if (has(ids, v)) { o[i] = ids[v]; count++; } } else walk(v);
      });
    } else if (o && typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string') { if (has(ids, v)) { o[k] = ids[v]; count++; } } else walk(v);
      }
      const hits = Object.keys(o).filter((k) => has(ids, k));
      if (hits.length) {
        const items = Object.entries(o).map(([k, v]) => [has(ids, k) ? ids[k] : k, v]);
        Object.keys(o).forEach((k) => { delete o[k]; });
        items.forEach(([k, v]) => { o[k] = v; });
        count += hits.length;
      }
      const ent = o.entity;
      if (typeof ent === 'string' && has(names, ent) && o.name === names[ent][0]) { o.name = names[ent][1]; count++; }
    }
  };
  walk(obj);
  return count;
}

/** the same for a plan kept as JSON text (the undo list); the text itself when nothing changes */
export function rewriteJson(text, ids, names) {
  const o = JSON.parse(text);
  return rewriteIds(o, ids, names) ? JSON.stringify(o) : text;
}

/** ctx: layout(), mapUndo(fn), refresh() (the plan drawn again: 3D, object list, properties), refetchSettings(), poll() (entity list);
 *  returns what the live channel calls with { ids, names, settings } */
export function initRenames(ctx) {
  return function renamed({ ids = {}, names = {}, settings = false } = {}) {
    ctx.mapUndo((s) => rewriteJson(s, ids, names));
    const layout = ctx.layout();
    if (layout && rewriteIds(layout, ids, names)) ctx.refresh();
    if (settings) ctx.refetchSettings();
    ctx.poll();                                          // the entity list with the new ids and names at once
  };
}
