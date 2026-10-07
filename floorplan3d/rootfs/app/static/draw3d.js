/* Drawing and dragging in the 3D view (step 20 of the split, part 4, #137): click to select (Shift / Ctrl adds), drag a device or a door /
 * window, draw walls and rooms point by point, place doors, windows and devices, the cable and erase tools, double click to finish a
 * drawing or switch a device. Where a door / window goes on a wall and when two clicks are the same point are pure (unit test:
 * tests/draw3d.test.mjs); the drawing state (points, cursor, preview, the pointer press) lives here. */
import * as THREE from './vendor/three.module.min.js';
import { OPENING_DEFAULTS, wallLength, projectOnWall, clampOpeningPos, openingOverlaps, fitOpeningWidth } from './walls.js';
import { dragStep } from './roofmove.js';

/** two clicks on (nearly) the same point (1 cm): the drawing ends there */
export const samePoint = (p, q) => !!p && !!q && Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.01;

/** where a door / window of `defWidth` goes on `wall` for a pointer at `point` ([x, z]): 5 cm steps, made narrower when the wall is short,
 *  kept on the wall; { wall, pos, width, valid (no overlap with another opening than ignoreId) } or null when it does not fit */
export function openingSpot(wall, point, defWidth, ignoreId = null) {
  const raw = Math.round(projectOnWall(wall, point) / 0.05) * 0.05;
  const width = fitOpeningWidth(wall, defWidth);
  if (width === null) return null;
  const pos = clampOpeningPos(wall, width, raw);
  if (pos === null) return null;
  return { wall, pos, width, valid: !openingOverlaps(wall, pos, width, ignoreId) };
}

/** ctx: canvas, controls, temp (the group for the drawing preview), t, setStatus(txt), fmtLen(m), clearGroup(g), elev(), tool(), openingType(),
 *  isLive(), houseMode(), lockedSel(), selection(), setSelection(s), refreshSelection(), floor(), settings(), uid(), findOpening(id),
 *  findWall(id), pick(e), pickHit(e), groundPoint(e), snap(p, fine), snapshot(), changed(rebuild), build(), moveDeviceTo(d, x, z),
 *  multi ({ toggle(h), clear() }), liveTap(e), cableClick(id), deleteItem(sel), newDevice(x, z), holdPlaced(), editNano(d), switchDevice(d),
 *  roofBox(id) (the base box of a roof on the open floor), moveRoof(id, dx, dz) (#255) */
export function initDraw3d(ctx) {
  let drawPts = [], cursor = null, down = null, preview = null;   // preview: { wall, pos, width, valid } of a door / window to place

  /** the drawing preview: the door / window under the pointer, or the line drawn so far with its points and the length to the cursor */
  function updateTemp() {
    ctx.clearGroup(ctx.temp);
    const elev = ctx.elev();
    if (ctx.tool() === 'opening' && preview) {
      const { wall: w, pos, valid } = preview;
      const def = OPENING_DEFAULTS[ctx.openingType()];
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(preview.width ?? def.width, def.height, w.thickness + 0.06),
        new THREE.MeshBasicMaterial({ color: valid ? 0x3fa9f5 : 0xff5555, transparent: true, opacity: 0.45, depthTest: false }),
      );
      m.renderOrder = 5;
      m.position.set(pos - wallLength(w) / 2, def.sill + def.height / 2, 0);
      const g = new THREE.Group();
      g.add(m);
      g.position.set((w.a[0] + w.b[0]) / 2, elev, (w.a[1] + w.b[1]) / 2);
      g.rotation.y = -Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
      ctx.temp.add(g);
      return;
    }
    if (!drawPts.length) return;
    const pts = [...drawPts, ...(cursor ? [cursor] : [])].map(([x, z]) => new THREE.Vector3(x, elev + 0.05, z));
    if (ctx.tool() === 'room' && pts.length > 2) pts.push(pts[0]);
    ctx.temp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3fa9f5 })));
    drawPts.forEach(([x, z]) => {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0x3fa9f5 }));
      d.position.set(x, elev + 0.05, z);
      ctx.temp.add(d);
    });
    if (cursor) {
      const last = drawPts[drawPts.length - 1];
      ctx.setStatus(`${ctx.t('length')}: ${ctx.fmtLen(Math.hypot(cursor[0] - last[0], cursor[1] - last[1]))}`);
    }
  }
  function endDrawing() { drawPts = []; cursor = null; preview = null; ctx.clearGroup(ctx.temp); }
  function finishRoom() {
    if (drawPts.length >= 3) {
      const f = ctx.floor();
      ctx.snapshot();
      f.rooms.push({ id: ctx.uid(), name: `${ctx.t('prop.room')} ${f.rooms.length + 1}`, color: '#8a7f70', points: drawPts.map((p) => [...p]) });
      ctx.changed();
    }
    endDrawing();
  }
  /** where a door / window would go: on the wall under the pointer, or (while dragging one) on its own wall */
  function openingTarget(e, ignoreId = null, def = OPENING_DEFAULTS[ctx.openingType()], forcedWall = null) {
    let wall = forcedWall, point = null;
    if (!wall) {
      const h = ctx.pickHit(e);
      if (h?.data.kind !== 'wall') return null;
      wall = ctx.findWall(h.data.id);
      point = [h.point.x, h.point.z];
    } else point = ctx.groundPoint(e);
    if (!wall || !point) return null;
    return openingSpot(wall, point, def.width, ignoreId);
  }
  const { canvas, controls } = ctx;
  const select = (h) => { ctx.setSelection(h); ctx.refreshSelection(); };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, hit: null, drag: false, dev: null, op: null };
    if (ctx.isLive() || ctx.tool() !== 'select' || ctx.houseMode()) return;
    const sel = ctx.selection();
    if (ctx.lockedSel() && sel) {                     // locked: drag moves only the selected object, from anywhere
      down.hit = null;
      if (sel.kind === 'device') {
        const d = ctx.floor().devices.find((v) => v.id === sel.id), gp = ctx.groundPoint(e);
        if (d && gp) { down.dev = { d, dx: d.x - gp[0], dz: d.z - gp[1], moved: false }; controls.enabled = false; }
      } else if (sel.kind === 'opening') {
        const f = ctx.findOpening(sel.id);
        if (f) { down.op = { ...f, moved: false }; controls.enabled = false; }
      }
      return;
    }
    const h = ctx.pick(e);
    down.hit = h;
    if (e.shiftKey || e.ctrlKey || e.metaKey) { down.multi = true; return; }   // Shift / Ctrl + click: add to / take out of the selection, never drag (#211, #247)
    if (h?.kind === 'device') {
      const d = ctx.floor().devices.find((v) => v.id === h.id);
      const gp = ctx.groundPoint(e);
      if (d && gp) {
        select(h);
        down.dev = { d, dx: d.x - gp[0], dz: d.z - gp[1], moved: false };
        controls.enabled = false;
      }
    } else if (h?.kind === 'opening') {
      const f = ctx.findOpening(h.id);
      if (f) {
        const wasSelected = sel?.kind === 'opening' && sel.id === h.id;
        select(h);
        if (wasSelected) { down.op = { ...f, moved: false }; controls.enabled = false; }   // first click only selects, so a stray click never drags it
      }
    } else if (h?.kind === 'roof') {                // a roof (#255): the first click selects it, a press on the selected roof drags it
      const box = ctx.roofBox(h.id), gp = ctx.groundPoint(e), wasSelected = sel?.kind === 'roof' && sel.id === h.id;
      select(h);
      if (wasSelected && box && gp) { down.roof = { id: h.id, gp, start: { ...box }, moved: false }; controls.enabled = false; }
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.drag = true;
    if (ctx.isLive()) return;
    const gp = ctx.groundPoint(e), tool = ctx.tool();
    if (down?.dev && gp) {
      if (down.dev.d.locked) return;
      if (!down.dev.moved) { ctx.snapshot(); down.dev.moved = true; }
      const [x, z] = ctx.snap([gp[0] + down.dev.dx, gp[1] + down.dev.dz], true);
      ctx.moveDeviceTo(down.dev.d, x, z);
      return;
    }
    if (down?.roof && down.drag && gp) {
      const r = down.roof, now = ctx.roofBox(r.id);
      if (!now) return;
      const { dx, dz } = dragStep(r.start, now, gp[0] - r.gp[0], gp[1] - r.gp[1], 0.05);   // 5 cm steps
      if (dx || dz) {
        if (!r.moved) { ctx.snapshot(); r.moved = true; }
        ctx.moveRoof(r.id, dx, dz);
        ctx.build();
      }
      return;
    }
    if (down?.op && down.drag) {
      const { wall, opening } = down.op;
      if (opening.locked) return;
      const tgt = openingTarget(e, opening.id, opening, wall);
      if (tgt?.valid && Math.abs(tgt.pos - opening.pos) > 1e-6) {
        if (!down.op.moved) { ctx.snapshot(); down.op.moved = true; }
        opening.pos = tgt.pos;
        ctx.build();
      }
      return;
    }
    if (tool === 'opening') {
      preview = openingTarget(e);
      updateTemp();
    } else if ((tool === 'wall' || tool === 'room') && gp) {
      cursor = ctx.snap(gp);
      updateTemp();
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.button !== 0 || !down) return;
    const st = down;
    down = null;
    controls.enabled = true;
    if (st.dev?.moved) { ctx.changed(false); ctx.refreshSelection(); return; }
    if (st.op?.moved) { ctx.changed(false); ctx.refreshSelection(); return; }
    if (st.roof?.moved) { ctx.changed(false); ctx.refreshSelection(); return; }
    if (st.drag) return;                         // camera drag, not a click
    if (ctx.isLive()) { ctx.liveTap(e); return; }

    const gp = ctx.groundPoint(e), tool = ctx.tool(), f = ctx.floor(), settings = ctx.settings();
    if (tool === 'select') {
      if (ctx.lockedSel()) return;               // locked selection stays until released
      if (st.multi) { ctx.multi.toggle(st.hit); return; }
      ctx.multi.clear(); select(st.hit);
    } else if (tool === 'cable') {
      const h = ctx.pickHit(e);
      if (h?.data.kind === 'device') ctx.cableClick(h.data.id);
    } else if (tool === 'erase') {
      const h = ctx.pick(e);
      if (h) { ctx.snapshot(); ctx.deleteItem(h); }
    } else if (tool === 'wall' && gp) {
      const p = ctx.snap(gp), last = drawPts[drawPts.length - 1];
      if (samePoint(p, last)) { endDrawing(); return; }
      if (last) {
        ctx.snapshot();
        f.walls.push({ id: ctx.uid(), a: [...last], b: [...p], thickness: settings.wallThickness, height: settings.wallHeight, openings: [] });
        ctx.changed();
      }
      drawPts.push(p);
      updateTemp();
    } else if (tool === 'room' && gp) {
      const p = ctx.snap(gp);
      if (drawPts.length >= 3 && samePoint(p, drawPts[0])) { finishRoom(); return; }
      drawPts.push(p);
      updateTemp();
    } else if (tool === 'opening') {
      const tgt = openingTarget(e);
      if (tgt?.valid) {
        ctx.snapshot();
        const type = ctx.openingType(), def = OPENING_DEFAULTS[type];
        const o = { id: ctx.uid(), type, pos: tgt.pos, ...def, width: tgt.width ?? def.width };
        (tgt.wall.openings ||= []).push(o);
        ctx.setSelection({ kind: 'opening', id: o.id });
        preview = null; ctx.clearGroup(ctx.temp);
        ctx.changed();
      }
    } else if (tool === 'device' && gp) {
      ctx.snapshot();
      const [x, z] = ctx.snap(gp, true);
      const d = ctx.newDevice(x, z);
      f.devices.push(d);
      ctx.setSelection({ kind: 'device', id: d.id });
      ctx.changed();
      ctx.holdPlaced();
      if (d.type === 'nanoleaf') ctx.editNano(d);
    }
  });

  canvas.addEventListener('pointerleave', () => { if (ctx.tool() === 'opening') { preview = null; ctx.clearGroup(ctx.temp); } });

  canvas.addEventListener('dblclick', (e) => {
    if (ctx.isLive()) return;
    const tool = ctx.tool();
    if (tool === 'wall') { endDrawing(); return; }
    if (tool === 'room') { finishRoom(); return; }
    if (tool === 'select') {
      const h = ctx.pick(e);
      if (h?.kind !== 'device') return;
      ctx.switchDevice(ctx.floor().devices.find((v) => v.id === h.id));
    }
  });
  return { endDrawing, finishRoom };
}
