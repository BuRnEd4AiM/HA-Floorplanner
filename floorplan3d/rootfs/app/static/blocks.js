/* Floor cut-outs and placeholder blocks: the shape of a floor minus its stairwells and floor openings, and adding a plot (Grundstück), a floor opening
 * (Bodenöffnung) or a placeholder block (a house part you do not draw in detail). floorShapes and blockTarget are pure (tested). */
import * as THREE from './vendor/three.module.min.js';
import polygonClipping from './vendor/polygon-clipping.js';
import { holesForFloor } from './stairs.js';

/** everything cut out of floor i: stairwell openings plus the floor openings drawn by hand. floors: the floor list, H: floor height */
export function floorOpenings(floors, i, H) {
  return [...holesForFloor(floors, i, H), ...(floors[i]?.holes || []).filter((h) => h.points.length >= 3).map((h) => h.points)];
}

/** THREE shapes of a floor polygon with openings cut out (polygon boolean, so partial overlaps work too) */
export function floorShapes(points, holes) {
  const v = (p) => new THREE.Vector2(p[0], -p[1]);
  const plain = () => [new THREE.Shape(points.map(v))];
  if (!holes.length) return plain();
  let mp;
  try { mp = polygonClipping.difference([points.map((p) => [p[0], p[1]])], ...holes.map((h) => [h.map((p) => [p[0], p[1]])])); } catch { return plain(); }
  return mp.map((poly) => {
    const sh = new THREE.Shape(poly[0].slice(0, -1).map(v));
    poly.slice(1).forEach((ring) => sh.holes.push(new THREE.Path(ring.slice(0, -1).map(v))));
    return sh;
  });
}

/** Which floor a new block goes to. choice: 'below' | 'this'. Returns { target, createBelow }: target is the floor index (0 when a new floor
 *  has to be created below the lowest one: the caller does that and the current floor moves up one) */
export function blockTarget(choice, floorIdx) {
  if (choice === 'this') return { target: floorIdx, createBelow: false };
  if (floorIdx > 0) return { target: floorIdx - 1, createBelow: false };
  return { target: 0, createBelow: true };
}

/** ctx: $, t, layout(), floor(), floorIdx(), setFloorIdx(i), snapshot(), changed(), setStatus(txt), select(sel), uid(), plan(), fillFloorSelect() */
export function initBlocks(ctx) {
  const { $, t } = ctx;
  /** the plot drawn in the 2D plan: the lawn and the earth take its shape; replaces an earlier one */
  function setPlot(points) {
    ctx.snapshot();
    const layout = ctx.layout();
    layout.plot = { ...(layout.plot || {}), boundary: points };
    ctx.changed();
    ctx.setStatus(t('plot.set'));
  }
  $('#plotClear').addEventListener('click', () => {
    const layout = ctx.layout();
    if (!layout.plot?.boundary) return;
    ctx.snapshot();
    delete layout.plot.boundary;
    if (!Object.keys(layout.plot).length) delete layout.plot;
    ctx.changed(); ctx.plan()?.render();
  });
  function addHole(points) {
    ctx.snapshot();
    const f = ctx.floor();
    (f.holes ||= []).push({ id: ctx.uid(), points });
    ctx.select({ kind: 'hole', id: f.holes[f.holes.length - 1].id });
    ctx.changed();
    ctx.setStatus(t('hole.added'));
  }
  function addBlock(points) {
    const target = blockTargetFloor();
    ctx.snapshot();
    const f = ctx.layout().floors[target];
    (f.blocks ||= []).push({ id: ctx.uid(), name: f.name, points });
    ctx.changed();
    if (target !== ctx.floorIdx()) ctx.setStatus(t('block.addedTo').replace('{floor}', f.name));
  }
  /** where a new block goes: the floor below (created when missing) or the current one */
  function blockTargetFloor() {
    const { target, createBelow } = blockTarget($('#blockFloor')?.value ?? 'below', ctx.floorIdx());
    if (!createBelow) return target;
    const layout = ctx.layout();
    if (layout.floors[0].name === t('floor.default')) layout.floors[0].name = t('floor.firstUpper');   // the default name now belongs to the new floor below
    layout.floors.unshift({ id: ctx.uid(), name: t('floor.blockName'), walls: [], rooms: [], devices: [], blocks: [], stairs: [] });
    ctx.setFloorIdx(ctx.floorIdx() + 1);                              // the current floor moved up one
    ctx.fillFloorSelect();
    return 0;
  }
  return { setPlot, addHole, addBlock };
}
