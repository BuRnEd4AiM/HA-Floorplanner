/* Neighbour house (#220): another house of the house list shown next to this one, e.g. the house a metal bridge (#189) leads over to.
 * It stays a plan of its own; here it is only drawn (walls, floors, roofs, the railing of a roof terrace), not edited. In the 2D plan its
 * outline on the same level shows dashed, so a bridge can be placed to meet it. The geometry is pure (unit test: tests/neighbor.test.mjs). */
import * as THREE from './vendor/three.module.min.js';
import { buildWall } from './walls.js';
import { initRoofs } from './roofs.js';
import { layoutUrl } from './houses.js';

/** where a point [x, z] of the neighbour's plan lies in this plan: turned by nb.rot degrees (like a device), moved by nb.x / nb.z */
export function placePoint([x, z], nb) {
  const t = ((nb.rot || 0) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return [(nb.x || 0) + x * c + z * s, (nb.z || 0) - x * s + z * c];
}
/** height of floor i of a plan above its ground floor (basements below 0), like the app's own floors */
export function floorElev(floors, i, floorH) {
  const g = Math.max(0, floors.findIndex((f) => f.kind !== 'basement'));
  return (i - g) * floorH;
}
/** the floors of the neighbour that show: all in the whole-house view, else those up to the height `upTo` (this plan's open floor) */
export function shownFloors(floors, nb, floorH, upTo = Infinity) {
  return floors.map((f, i) => i).filter((i) => floorElev(floors, i, floorH) + (nb.y || 0) <= upTo + 0.1);
}
/** the outline of the neighbour's floor at height y (walls and room edges) as segments [[x, z], [x, z]] in this plan; none when no floor is there */
export function outlineAt(floors, nb, floorH, y) {
  const i = floors.findIndex((f, k) => Math.abs(floorElev(floors, k, floorH) + (nb.y || 0) - y) < 0.5);
  if (i < 0) return [];
  const f = floors[i], segs = [];
  f.walls.forEach((w) => segs.push([placePoint(w.a, nb), placePoint(w.b, nb)]));
  f.rooms.forEach((r) => r.points.forEach((p, k) => segs.push([placePoint(p, nb), placePoint(r.points[(k + 1) % r.points.length], nb)])));
  return segs;
}
/** a neighbour entry with its numbers in range: { house, x, z, rot, y } */
export function cleanNeighbor(nb) {
  const n = (v, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(+v) ? +v : 0));
  return { house: String(nb?.house || ''), x: n(nb?.x, -1000, 1000), z: n(nb?.z, -1000, 1000), rot: ((n(nb?.rot, -3600, 3600) % 360) + 360) % 360, y: n(nb?.y, -50, 50) };
}

/** ctx: $, t, houses() ([{ id, name }]), houseId(), label(house), layout(), floorH, mat(color, ghost, extra), HOLO, camera(), settings(), wallSee,
 *  snapshot(), changed(), build(), fields: { field, lenInput, inp } */
export function initNeighbors(ctx) {
  const { $, t } = ctx;
  const cache = new Map(), loading = new Set(), roofsOf = new Map();
  const list = () => (ctx.layout().neighbors || []).filter((nb) => nb.house && nb.house !== ctx.houseId());
  /** the plan of a house, loaded once (a reload of the page loads it fresh); null while it loads */
  function planOf(id) {
    if (cache.has(id)) return cache.get(id);
    if (!loading.has(id)) {
      loading.add(id);
      fetch(layoutUrl(id)).then((r) => r.json()).then((l) => { cache.set(id, Array.isArray(l?.floors) ? l : { floors: [] }); }).catch(() => cache.set(id, { floors: [] }))
        .finally(() => { loading.delete(id); ctx.build(); });
    }
    return null;
  }
  function roofs(id, L) {
    if (!roofsOf.has(id)) roofsOf.set(id, initRoofs({ layout: () => cache.get(id) || L, elev: (i) => floorElev((cache.get(id) || L).floors, i, ctx.floorH), mat: ctx.mat, HOLO: ctx.HOLO, camera: ctx.camera, settings: ctx.settings, wallSee: ctx.wallSee, editingRoof: () => false }));
    return roofsOf.get(id);
  }
  /** draw the neighbours into `world`: upTo = height of the open floor (Infinity in the whole-house view) */
  function build(world, { upTo = Infinity, holo = false } = {}) {
    roofsOf.forEach((r) => r.reset());                              // their fade lists start empty with every new scene
    list().forEach((raw) => {
      const nb = cleanNeighbor(raw), L = planOf(nb.house);
      if (!L) return;
      const root = new THREE.Group();
      root.position.set(nb.x, nb.y, nb.z); root.rotation.y = (nb.rot * Math.PI) / 180;
      root.userData.neighbor = nb.house;
      const R = roofs(nb.house, L);
      shownFloors(L.floors, nb, ctx.floorH, upTo).forEach((i) => {
        const f = L.floors[i], g = new THREE.Group();
        g.position.y = floorElev(L.floors, i, ctx.floorH);
        (f.walls || []).forEach((w) => g.add(buildWall({ ...w, openings: w.openings || [] }, { material: ctx.mat('#cfc9bf', false), makeMat: ctx.mat, holo })));
        (f.rooms || []).forEach((r) => {
          if ((r.points || []).length < 3) return;
          const geo = new THREE.ShapeGeometry(new THREE.Shape(r.points.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
          const m = new THREE.Mesh(geo, ctx.mat(r.color || '#8a7f70', false, { side: THREE.DoubleSide }));
          m.position.y = 0.01; m.receiveShadow = true; g.add(m);
          if (r.terrace) R.railing(g, r, f, holo, false);               // the roof terrace the bridge leads to keeps its railing
        });
        if (f.kind === 'roof') R.build(g, i, f, holo, false);
        root.add(g);
      });
      world.add(root);
    });
  }
  /** dashed outline of the neighbours at height y, for the 2D plan */
  function outlines(y) {
    return list().flatMap((raw) => { const nb = cleanNeighbor(raw), L = planOf(nb.house); return L ? outlineAt(L.floors, nb, ctx.floorH, y) : []; });
  }

  /** the settings in "Houses & backup": which house stands where */
  function renderUi() {
    const box = $('#neighborBody');
    if (!box) return;
    box.replaceChildren();
    const others = ctx.houses().filter((h) => h.id !== ctx.houseId());
    const p = document.createElement('p'); p.className = 'sub'; p.textContent = t(others.length ? 'nb.help' : 'nb.none'); box.append(p);
    const layout = ctx.layout();
    (layout.neighbors || []).forEach((nb, k) => {
      const card = document.createElement('div'); card.className = 'nbCard';
      const sel = document.createElement('select'); sel.className = 'nbHouse';
      others.forEach((h) => sel.add(new Option(ctx.label(h), h.id)));
      sel.value = nb.house;
      sel.addEventListener('change', () => { ctx.snapshot(); nb.house = sel.value; ctx.changed(); renderUi(); });
      card.append(ctx.fields.field(t('nb.house'), sel));
      const num = (key, label, opts) => card.append(ctx.fields.field(label, ctx.fields.lenInput(() => nb[key] || 0, (v) => (nb[key] = +(+v).toFixed(3)), opts)));
      num('x', t('nb.x'), { min: -1000, step: 0.1 }); num('z', t('nb.z'), { min: -1000, step: 0.1 });
      card.append(ctx.fields.field(t('nb.rot'), ctx.fields.inp('number', nb.rot || 0, (v) => (nb.rot = (((+v || 0) % 360) + 360) % 360), { step: 15, className: 'nbRot' })));
      num('y', t('nb.y'), { min: -50, step: 0.1 });
      const del = document.createElement('button'); del.type = 'button'; del.textContent = t('nb.remove');
      del.addEventListener('click', () => { ctx.snapshot(); layout.neighbors.splice(k, 1); if (!layout.neighbors.length) delete layout.neighbors; ctx.changed(); renderUi(); });
      card.append(del);
      box.append(card);
    });
    if (others.length) {
      const add = document.createElement('button'); add.type = 'button'; add.id = 'nbAdd'; add.textContent = t('nb.add');
      add.addEventListener('click', () => { ctx.snapshot(); (layout.neighbors ||= []).push({ house: others[0].id, x: 0, z: 0, rot: 0, y: 0 }); ctx.changed(); renderUi(); });
      box.append(add);
    }
  }
  return { build, outlines, renderUi, list, loaded: (id) => cache.has(id) };
}
