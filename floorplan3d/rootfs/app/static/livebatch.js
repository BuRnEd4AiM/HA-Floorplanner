/* Fewer draw calls in the live mode (#138): the models of a floor are drawn together there (batchModels in meshmerge.js), in the editor every
 * piece is whole again (it can be moved). This file keeps which floors and models there are and watches the models: one that is hidden,
 * shown or moved after the merge (a person who comes home, a car that leaves) would stay in the merged picture, so it is taken out for
 * good (until the house is built again) and the rest is merged anew. No three.js here (unit test: tests/livebatch.test.mjs).
 * initLiveBatch({ isLive(), batch(group, models) -> what unbatch needs or null, unbatch(b) }) */

/** what the merge depends on in model m: is it drawn, where it hangs, its place, turn and size */
export const poseOf = (m) => [m.visible, m.parent, m.position.x, m.position.y, m.position.z,
  m.quaternion.x, m.quaternion.y, m.quaternion.z, m.quaternion.w, m.scale.x, m.scale.y, m.scale.z];
const same = (a, b) => a.every((v, i) => v === b[i]);

export function initLiveBatch({ isLive, batch, unbatch }) {
  let floors = [], batched = [], watch = [], restless = new WeakSet();

  /** live: the calm models of every floor merged, editor: every piece on its own */
  function apply() {
    batched.forEach(unbatch);
    batched = []; watch = [];
    if (!isLive()) return;
    floors.forEach(({ g, models }) => {
      const calm = models.filter((m) => !restless.has(m));
      const b = batch(g, calm);
      if (b) batched.push(b);
      calm.forEach((m) => watch.push({ m, pose: poseOf(m) }));
    });
  }
  return {
    /** the house is built anew: nothing merged, no floors (the parts are back in their models before the scene is cleared) */
    reset() { batched.forEach(unbatch); batched = []; floors = []; watch = []; restless = new WeakSet(); },
    /** a floor's group and its models */
    add(g, models) { floors.push({ g, models }); },
    apply,
    /** before a picture is drawn: a model changed since the merge → it stays out, the others are merged again. true when that happened */
    check() {
      const moved = watch.filter((w) => !same(w.pose, poseOf(w.m)));
      if (!moved.length) return false;
      moved.forEach((w) => restless.add(w.m));
      apply();
      return true;
    },
    /** every piece on its own until the next apply() (the browser test compares the two pictures) */
    undo() { batched.forEach(unbatch); batched = []; watch = []; },
    parts: () => batched.reduce((n, b) => n + b.parts.length, 0),
    meshes: () => batched.reduce((n, b) => n + b.meshes.length, 0),
    restless: (m) => restless.has(m),
  };
}
