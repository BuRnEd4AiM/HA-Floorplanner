/* How the floors stand in the whole-house view (setting houseFloors): 'normal' (one storey of FLOOR_H per floor: the walls are lower,
 * so a small gap shows between them and the floor above), 'apart' (pulled apart, every floor lifted off the one below) or 'stacked' (like a
 * real house: a ceiling fills the gap between the walls and the floor above, the walls under a roof reach up to it, and the balls, value
 * labels and names of a floor under another one stay inside its rooms instead of showing through the floors above).
 * The rules are pure (no three.js; unit test: tests/housefloors.test.mjs); floorbuild.js builds the ceilings, initHouseFloors wires the two
 * buttons of the view menu ("Auseinander", "Aufeinander"; neither pressed: as built). */

export const HOUSE_FLOORS = ['normal', 'apart', 'stacked'];
export const APART_GAP = 2.5;              // extra space between every two floors when pulled apart (m)

/** the way the floors stand: only the whole-house view pulls them apart or stacks them; anything unknown is 'normal' */
export function floorsMode(settings, houseMode) {
  const m = settings?.houseFloors;
  return houseMode && HOUSE_FLOORS.includes(m) ? m : 'normal';
}

/** the button of the view menu for 'apart' / 'stacked': a tap switches it on, a second tap back to 'normal' */
export const toggleMode = (cur, mode) => (cur === mode ? 'normal' : mode);

/** the height of floor i: the ground floor (groundIdx) at 0, one storey (floorH) per floor; pulled apart the lowest floor stays and every
 *  floor above lifts APART_GAP more than the one below */
export function floorElev(i, groundIdx, floorH, mode) {
  return (i - groundIdx) * floorH + (mode === 'apart' ? i * APART_GAP : 0);
}

/** stacked: how thick the ceiling between two floors is: the storey height minus the height of the walls (none when the walls reach) */
export function slabDepth(floorH, wallHeight) {
  const d = floorH - (+wallHeight || 0);
  return d > 0.02 ? +d.toFixed(3) : 0;
}

const hasArea = (list) => (list || []).some((x) => (x.points || []).length >= 3);

/** stacked: does floor i stand on a ceiling: there is a floor below it and it has something (rooms, blocks, walls) */
export function hasSlab(floors, i) {
  const f = floors[i];
  return i > 0 && !!f && (hasArea(f.rooms) || hasArea(f.blocks) || (f.walls || []).length > 0);
}

/** stacked: floor i lies under a floor with rooms (or blocks): looking from above, that floor hides it; its balls, labels and names are
 *  then seen only where you can look into it (a wall sunk or see-through), not through the floors above */
export function isCovered(floors, i) {
  return floors.slice(i + 1).some((f) => hasArea(f.rooms) || hasArea(f.blocks));
}

/** stacked: the storey right under a roof floor: its walls reach up to the roof (no gap between them and the eaves); a wall lower than the
 *  others (a parapet, a half wall) keeps its height */
export function wallUpTo(h, wallHeight, floorH) {
  const w = +h || +wallHeight || 0;
  return w >= (+wallHeight || 0) - 0.05 && w < floorH ? floorH : w;
}
/** stacked: is floor i the storey under a roof floor (the next floor up is the roof floor) */
export const underRoof = (floors, i) => floors[i]?.kind !== 'roof' && floors[i + 1]?.kind === 'roof';
/** stacked: does wall w stand under the roof box { x0, x1, z0, z1 } (its middle, `margin` m around): only those reach up to the roof, not
 *  the walls of a garage beside the house */
export function wallUnder(w, box, margin = 0.3) {
  if (!box || !w?.a || !w?.b) return false;
  const x = (w.a[0] + w.b[0]) / 2, z = (w.a[1] + w.b[1]) / 2;
  return x >= box.x0 - margin && x <= box.x1 + margin && z >= box.z0 - margin && z <= box.z1 + margin;
}

/** stacked: the height (over the floor) of a ball or label of a covered floor: inside its room, `half` (half its size) under the ceiling */
export function inRoom(y, ceiling, half) {
  return Math.min(y, ceiling - half);
}
/** stacked: the label over a window's roller shutter stays in the room too; when that puts it onto the ball, it goes under the ball */
export function shutterLabelIn(labelY, ballY, ceiling, half, gap = 0.55) {
  const y = inRoom(labelY, ceiling, half);
  return y - ballY < gap - 1e-6 ? ballY - gap : y;
}

/** the floors whose devices show their state (colour, ball, value label): in the whole-house view every floor (#392), else the open one and the
 *  floors below it (dimmed) */
export function liveFloors(count, floorIdx, houseMode) {
  return Array.from({ length: houseMode ? count : Math.max(0, Math.min(count, floorIdx + 1)) }, (_, i) => i);
}

/** the buttons of the view menu, shown in the whole-house view with two floors or more. ctx: $, settings(), houseMode(), floorCount(),
 *  choose(mode) (sets the setting houseFloors and applies it) */
export function initHouseFloors(ctx) {
  const buttons = [['#explodeToggle', 'apart'], ['#stackToggle', 'stacked']];
  function update() {
    const show = ctx.houseMode() && ctx.floorCount() >= 2, cur = floorsMode(ctx.settings(), true);
    buttons.forEach(([sel, mode]) => { const b = ctx.$(sel); b.hidden = !show; b.classList.toggle('active', cur === mode); });
  }
  buttons.forEach(([sel, mode]) => ctx.$(sel).addEventListener('click', () => ctx.choose(toggleMode(floorsMode(ctx.settings(), true), mode))));
  return { update };
}
