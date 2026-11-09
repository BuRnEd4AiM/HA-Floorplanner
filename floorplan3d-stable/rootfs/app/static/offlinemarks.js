/* Offline in 3D (#375): a small ball with a crossed-out lightning bolt over every device, door or window that the offline list names
 * (offline.js: its Home Assistant entity is unavailable, unknown or gone: red; a smart device that is linked to nothing: amber). In the
 * live mode a device with a tap ball shows the sign on its ball instead (tapballs.js), so nothing covers it twice. Which marks there are
 * and where a mark sits over what it belongs to are pure (unit test: tests/offlinemarks.test.mjs); the marks are three.js sprites in the
 * floor group of their thing, placed anew with every state update. */
import * as THREE from './vendor/three.module.min.js';

/** size (radius, m) of a mark and the gap between it and what it sits on; PILL_HALF: half the height of a value pill (labels.js) */
export const MARK = { r: 0.16, gap: 0.04 };
export const PILL_HALF = 0.13;
/** rim and slash colour by why it is offline */
export const MARK_COLOR = { unlinked: '#ffb020', offline: '#ff4f45' };

/** one mark per thing of the offline list ([{ kind, id, reason }]): Map id -> { kind, reason }, reason 'offline' or 'unlinked'
 *  (a thing with one entity offline and another one missing is offline) */
export function offlineMarks(list) {
  const out = new Map();
  (list || []).forEach((x) => {
    if (!x?.id) return;
    const reason = x.reason === 'unlinked' ? 'unlinked' : 'offline';
    if (out.get(x.id)?.reason !== 'offline') out.set(x.id, { kind: x.kind, reason });
  });
  return out;
}

/** the sprite's anchor height (sprite.center.y) so that the mark sits just above what it is on: `below` m of it reach up from the mark's
 *  place (half a value pill when it sits on the pill, 0 on the top of a model). Done with the anchor, so it stays above it from every
 *  side, also looking straight down. A door or a window has its mark in the middle (center 0.5) */
export const markCenterY = (below = 0) => 0.5 - (below + MARK.r + MARK.gap) / (2 * MARK.r);
/** a floor under another one (the floors stacked, housefloors.js): does a mark over y (below: as markCenterY) stay under the ceiling; when
 *  not it hangs under its place instead (anchor 1 - markCenterY), so it stays inside the room */
export const markFits = (y, below, ceiling) => y + below + MARK.gap + 2 * MARK.r <= ceiling + 1e-9;

/** draw the sign on a canvas (2D context g, size s): a dark grey ball with a coloured rim, a lightning bolt, crossed out */
export function drawOffline(g, s, reason = 'offline') {
  const c = MARK_COLOR[reason] || MARK_COLOR.offline;
  g.clearRect(0, 0, s, s);
  g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2);
  g.fillStyle = '#3d434c'; g.fill();
  g.lineWidth = 7; g.strokeStyle = c; g.stroke();
  g.font = `${Math.round(s * 0.5)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffd23f';
  g.fillText('⚡', s / 2, s / 2 + s * 0.03);
  g.beginPath(); g.moveTo(s * 0.26, s * 0.26); g.lineTo(s * 0.74, s * 0.74);
  g.lineCap = 'round'; g.lineWidth = s * 0.08; g.strokeStyle = c; g.stroke();
}

/** ctx: registry (id -> 3D object), labelSprites (Map: value pills by id), ballShown(id) (its tap ball shows: the ball carries the sign),
 *  floorShown(fi) (the floor is shown, not one dimmed below) */
export function initOfflineMarks(ctx) {
  const marks = new Map();                 // id -> { sprite, reason, obj }
  const box = new THREE.Box3(), tmp = new THREE.Box3(), inv = new THREE.Matrix4(), v = new THREE.Vector3();
  function make(reason) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    drawOffline(canvas.getContext('2d'), 128, reason);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(MARK.r * 2, MARK.r * 2, 1);
    sp.renderOrder = 11;                   // over the value pills and the tap balls
    sp.userData.offlineMark = reason;
    return sp;
  }
  function drop(id) {
    const m = marks.get(id);
    if (!m) return;
    m.sprite.removeFromParent(); m.sprite.material.map.dispose(); m.sprite.material.dispose();
    marks.delete(id);
  }
  /** where the mark of obj goes in its floor group: a door / window in its middle, a device on its value pill or on its top */
  function place(m, id, kind) {
    const obj = m.obj, group = kind === 'opening' ? obj.parent?.parent : obj.parent;
    if (!group) return false;
    if (m.sprite.parent !== group) group.add(m.sprite);
    const ceil = group.userData.covered ? group.userData.ceiling : null;   // stacked: seen only inside its floor, under its ceiling
    m.sprite.material.depthTest = !!ceil;
    const anchor = (y, below) => (ceil && !markFits(y, below, ceil) ? 1 - markCenterY(below) : markCenterY(below));
    group.updateWorldMatrix(true, true);
    inv.copy(group.matrixWorld).invert();
    const pill = kind === 'device' ? ctx.labelSprites.get(id) : null;
    if (pill?.visible && pill.parent === group) {
      m.sprite.position.copy(pill.position);
      m.sprite.center.set(0.5, anchor(pill.position.y, PILL_HALF));
      return true;
    }
    box.makeEmpty();
    obj.traverse((o) => {
      if (!o.isMesh || !o.geometry || (kind === 'device' && o.userData.proxy)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      box.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(inv));
    });
    if (box.isEmpty()) return false;
    box.getCenter(v);
    if (kind === 'opening') { m.sprite.position.copy(v); m.sprite.center.set(0.5, 0.5); }
    else if (ceil && !markFits(box.max.y, 0, ceil)) { m.sprite.position.set(v.x, box.min.y, v.z); m.sprite.center.set(0.5, 1 - markCenterY(0)); }   // under a ceiling lamp
    else { m.sprite.position.set(v.x, box.max.y, v.z); m.sprite.center.set(0.5, markCenterY(0)); }
    return true;
  }
  /** show the marks of `want` (offlineMarks, with the floor of each thing in floors: id -> floor index) and drop the others */
  let last = { want: new Map(), floors: new Map() };
  function update(want, floors = new Map()) {
    last = { want, floors };
    marks.forEach((m, id) => { if (!want.has(id) || ctx.registry.get(id) !== m.obj || m.reason !== want.get(id).reason) drop(id); });
    want.forEach((w, id) => {
      const obj = ctx.registry.get(id);
      if (!obj) return;
      let m = marks.get(id);
      if (!m) { m = { sprite: make(w.reason), reason: w.reason, obj }; marks.set(id, m); }
      const placed = place(m, id, w.kind);
      m.sprite.visible = placed && obj.visible && (ctx.floorShown?.(floors.get(id)) ?? true) && !(w.kind === 'device' && ctx.ballShown?.(id));
    });
  }
  /** the scene was built anew: the old marks went with it */
  function clear() { [...marks.keys()].forEach(drop); }
  /** something was moved (dragged in the editor): the marks go along */
  const refresh = () => update(last.want, last.floors);
  return { update, refresh, clear, shown: (id) => !!marks.get(id)?.sprite.visible, reason: (id) => marks.get(id)?.reason ?? null, sprite: (id) => marks.get(id)?.sprite ?? null };
}
