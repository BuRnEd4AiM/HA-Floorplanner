// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of #629 (christinloehner, "Schräges Grundstück"): the plot lies on a slope. The ground falls one storey (3 m) from the back of
// the house (garden at the level of the ground floor) to the street: there the basement stands free with a garage door at street level,
// the path runs down beside the house, the terrace is a flat plateau with a wall, the garage of the ground floor stands on a plinth.
window.mk629 = (() => {
  const fp = () => window.__fp;
  const H = 3.0, ZB = 7.15, ZF = -0.15;                  // the slope: level with the ground floor behind the back wall, one storey lower in front
  const h = (x, z) => (z >= ZB ? 0 : z <= ZF ? -H : -H * (ZB - z) / (ZB - ZF));
  const TERRACE = [[-5.8, 0.3], [-1.9, 0.3], [-1.9, 4.7], [-5.8, 4.7]];   // a plateau at the level of the ground floor
  const inPoly = (x, z, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const ground = (x, z) => (inPoly(x, z, TERRACE) ? 0 : h(x, z));
  let K = null;
  function kit() {
    if (K) return K;
    let mesh = null, tex = null;
    fp().scene.traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const a = o.geometry?.attributes?.position;
      if (!mesh && o.material.type === 'MeshStandardMaterial' && a && !a.isInterleavedBufferAttribute) mesh = o;
      if (!tex && o.material.map?.image) tex = o.material.map;
    });
    K = { Mesh: mesh.constructor, Geo: mesh.geometry.constructor, Attr: mesh.geometry.attributes.position.constructor, Std: mesh.material.constructor };
    return K;
  }

  /* ---------- the plan before it is built: a garage door in the basement, the garden things on the slope, the terrace, the path ---------- */
  function prepare() {
    const L = fp().layout, kg = L.floors.find((f) => f.id === 'kg'), eg = L.floors.find((f) => f.id === 'eg');
    const front = kg.walls.find((w) => w.id === 'k_w1');
    front.openings.push({ id: 'mk_gd', type: 'door', style: 'garage', pos: 7.0, width: 2.5, height: 2.1, sill: 0, name: 'Garagentor' });
    front.openings.push({ id: 'mk_hd', type: 'door', pos: 4.6, width: 1.0, height: 2.05, sill: 0, name: 'Kellertür' });
    const move = { gt4: null, gd1: [-3.0, 1.4], gd2: [-5.1, 3.9] };
    eg.devices = eg.devices.filter((d) => move[d.id] !== null);
    eg.devices.forEach((d) => { if (move[d.id]) [d.x, d.z] = move[d.id]; });
    const inRoom = (d) => eg.rooms.some((r) => inPoly(d.x, d.z, r.points));
    eg.devices.forEach((d) => { if (!inRoom(d) && (+d.y || 0) < 0.5) d.y = Math.round(ground(d.x, d.z) * 100) / 100; });
    eg.devices.push({ id: 'mk_fl', type: 'flowers', x: 16.6, z: 6.4, y: Math.round(h(16.6, 6.4) * 100) / 100, rot: 0, scale: 1, name: 'Blumen', entity: '' });
    L.plot.areas.push({ id: 'mk_ter', name: 'Terrasse', surface: 'deck', points: TERRACE });
    L.plot.areas.push({ id: 'mk_weg', name: 'Weg zur Straße', surface: 'slabs', points: [[-1.7, -6], [-0.7, -6], [-0.7, 8.0], [4, 8.0], [4, 9.0], [-1.7, 9.0]] });
    L.plot.areas.push({ id: 'mk_bed', name: 'Beet am Hang', surface: 'bed', points: [[15.6, 5.0], [17.8, 5.0], [17.8, 9.4], [15.6, 9.4]] });
    L.neighbors = [];
    fp().rebuild();
  }

  /* ---------- the ground on the slope ---------- */
  /** the triangles of a geometry split until no side is longer than `len` (in x/z); attributes position and uv */
  function subdivide(geo, len, groupIdx = null) {
    const pos = geo.attributes.position, uv = geo.attributes.uv, idx = geo.index;
    const vert = (k) => ({ p: [pos.getX(k), pos.getY(k), pos.getZ(k)], t: uv ? [uv.getX(k), uv.getY(k)] : [0, 0] });
    const mid = (a, b) => ({ p: a.p.map((v, i) => (v + b.p[i]) / 2), t: a.t.map((v, i) => (v + b.t[i]) / 2) });
    const d = (a, b) => Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
    const out = [];
    const split = (a, b, c, depth = 0) => {
      const ab = d(a, b), bc = d(b, c), ca = d(c, a), m = Math.max(ab, bc, ca);
      if (m <= len || depth > 14) { [a, b, c].forEach((v) => out.push({ p: [...v.p], t: [...v.t] })); return; }
      if (m === ab) { const q = mid(a, b); split(a, q, c, depth + 1); split(q, b, c, depth + 1); }
      else if (m === bc) { const q = mid(b, c); split(a, b, q, depth + 1); split(a, q, c, depth + 1); }
      else { const q = mid(c, a); split(a, b, q, depth + 1); split(q, b, c, depth + 1); }
    };
    const n = idx ? idx.count : pos.count, at = (i) => (idx ? idx.getX(i) : i);
    const ranges = groupIdx === null || !geo.groups.length ? [[0, n]] : geo.groups.filter((g) => g.materialIndex === groupIdx).map((g) => [g.start, g.start + g.count]);
    ranges.forEach(([s, e]) => { for (let i = s; i + 2 < e; i += 3) split(vert(at(i)), vert(at(i + 1)), vert(at(i + 2))); });
    return out;
  }
  /** an empty geometry (the class found in the scene may be a box or an extrusion that fills itself in) */
  function newGeo() { const g = new K.Geo(); g.setIndex(null); g.clearGroups(); Object.keys(g.attributes).forEach((k) => g.deleteAttribute(k)); return g; }
  function geoOf(verts) {
    const g = newGeo();
    g.setAttribute('position', new K.Attr(new Float32Array(verts.flatMap((v) => v.p)), 3));
    g.setAttribute('uv', new K.Attr(new Float32Array(verts.flatMap((v) => v.t)), 2));
    g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
  /** a wall of stones from the ground up to `top` along a closed outline (the terrace), with cover stones */
  function wallAround(pts, top, color) {
    const P = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 0.2));
      for (let k = 0; k < n; k++) {
        const x0 = ax + ((bx - ax) * k) / n, z0 = az + ((bz - az) * k) / n, x1 = ax + ((bx - ax) * (k + 1)) / n, z1 = az + ((bz - az) * (k + 1)) / n;
        const y0 = h(x0, z0) - 0.05, y1 = h(x1, z1) - 0.05;
        P.push(x0, y0, z0, x1, y1, z1, x1, top, z1, x0, y0, z0, x1, top, z1, x0, top, z0);
      }
    }
    const g = newGeo(); g.setAttribute('position', new K.Attr(new Float32Array(P), 3)); g.computeVertexNormals();
    const m = new K.Mesh(g, new K.Std({ color, roughness: 0.92, side: 2 })); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function box(x0, x1, y0, y1, z0, z1, color) {
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    const f = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7]], P = [];
    f.forEach(([a, b, cc, d]) => P.push(...c[a], ...c[b], ...c[cc], ...c[a], ...c[cc], ...c[d]));
    const g = newGeo(); g.setAttribute('position', new K.Attr(new Float32Array(P), 3)); g.computeVertexNormals();
    const m = new K.Mesh(g, new K.Std({ color, roughness: 0.9, side: 2 })); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  let cap = null;
  function apply() {
    kit();
    const world = fp().scene.children.find((c) => c.children?.some((o) => o.userData?.yard));
    let plane = null, done = { lawn: 0, earth: 0, yards: 0 };
    const meshes = [];
    world.traverse((o) => { if (o.isMesh) meshes.push(o); });
    meshes.forEach((o) => {
      const mats = [].concat(o.material);
      if (!plane) plane = mats.find((m) => m.clippingPlanes?.length)?.clippingPlanes[0] || null;
      if (o.geometry.type === 'ShapeGeometry' && Math.abs(o.position.y + 0.02) < 1e-6 && !o.userData.yard) {         // the lawn
        const v = subdivide(o.geometry, 0.35); v.forEach((q) => { q.p[1] += ground(q.p[0], q.p[2]); });
        o.geometry = geoOf(v);
        o.material = new K.Std({ color: 0x6fa858, roughness: 1, side: 2 }); o.receiveShadow = true;
        done.lawn++;
      } else if (Array.isArray(o.material) && o.geometry.type === 'ExtrudeGeometry') {                                   // the earth's sides
        o.geometry.computeBoundingBox();
        const { min, max } = o.geometry.boundingBox, v = subdivide(o.geometry, 0.35, 1);
        v.forEach((q) => { q.p[1] += h(q.p[0], q.p[2]) * (q.p[1] - min.y) / (max.y - min.y); });
        o.geometry = geoOf(v); o.material = o.material[1];
        o.children.forEach((c) => { c.visible = false; });
        done.earth++;
      } else if (o.userData.yard && o.userData.yard !== 'mk_ter') {                                                     // paths, beds ...
        const v = subdivide(o.geometry, 0.35); v.forEach((q) => { q.p[1] += h(q.p[0], q.p[2]); });
        o.geometry = geoOf(v);
        done.yards++;
      } else if (o.material?.map?.image?.width === 64 && o.material.map.image.height === 256 && !o.material.clippingPlanes?.length) cap = o;   // the face of the earth cut
      if (o.userData.neighbor) o.visible = false;
    });
    meshes.forEach((o) => [].concat(o.material).forEach((m) => { if (plane && m.clippingPlanes?.includes(plane)) { m.clippingPlanes = []; m.needsUpdate = true; } }));
    world.traverse((o) => { if (o.material && !o.isMesh) [].concat(o.material).forEach((m) => { if (plane && m.clippingPlanes?.includes(plane)) { m.clippingPlanes = []; m.needsUpdate = true; } }); });
    const keep = () => { if (cap) cap.visible = false; requestAnimationFrame(keep); };
    keep();
    const add = (m) => { m.userData.mk = true; world.add(m); return m; };
    add(wallAround(TERRACE, -0.05, 0x9c9284));                                       // the wall of the terrace
    const capStone = box(TERRACE[0][0] - 0.03, TERRACE[1][0] + 0.03, -0.05, -0.0, TERRACE[0][1] - 0.03, TERRACE[2][1] + 0.03, 0xc9c2b6);
    capStone.scale.set(1, 1, 1); add(capStone).visible = false;
    add(box(10.15, 15.12, -H, -0.03, -0.12, 6.12, 0xb4b1ab));                        // the plinth of the garage
    const r = fp().renderer; if (r?.shadowMap) r.shadowMap.needsUpdate = true;
    return done;
  }

  /* ---------- the parts on the page (notes, the side panel, the 2D plan) ---------- */
  const css = `
  .mkNote { position: fixed; z-index: 120; max-width: 330px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14.5px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  .mkNew { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px; background: #46a758; color: #fff; font-size: 11.5px; font-weight: 800; vertical-align: 2px; }
  .mkBox { position: fixed; z-index: 115; width: 330px; padding: 12px 12px 6px; border-radius: 12px; border: 2px solid #46a758; background: rgba(22,28,35,.96); color: #e8edf2;
    box-shadow: 0 10px 30px rgba(0,0,0,.45); font-family: system-ui, sans-serif; }
  .mkBox h5 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #8be09c; }
  .mkRow { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 14px; }
  .mkRow > span:first-child { flex: 1; color: #9aa4ae; }
  .mkIn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; border: 1px solid #3a4350; background: #1c232c;
    font-weight: 700; min-width: 86px; justify-content: space-between; }
  .mkIn small { color: #9aa4ae; font-weight: 600; }
  .mkSeg { display: inline-flex; gap: 4px; padding: 3px; border-radius: 10px; background: #1c232c; border: 1px solid #3a4350; }
  .mkSeg span { padding: 5px 10px; border-radius: 7px; font-weight: 700; font-size: 13px; color: #9aa4ae; }
  .mkSeg span.on { background: #3fa9f5; color: #fff; }
  .mkBtn { display: block; width: 100%; margin: 2px 0 8px; padding: 8px 10px; border-radius: 10px; border: 1px dashed #46a758; color: #8be09c; font-weight: 700;
    background: transparent; text-align: left; font-size: 13.5px; }
  .mkSub { font-size: 12.5px; color: #9aa4ae; margin: -4px 0 10px; line-height: 1.35; }
  .mkTag { position: fixed; z-index: 110; transform: translate(-50%, -50%); padding: 4px 10px; border-radius: 999px; background: #2f7d3b; color: #fff;
    font-weight: 800; font-size: 13px; box-shadow: 0 4px 14px rgba(0,0,0,.35); white-space: nowrap; pointer-events: none; font-family: system-ui, sans-serif; }
  .mkTag.dark { background: rgba(20,26,33,.86); }
  .mkTag.pin { background: #e0582c; }
  svg.mkSvg { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 105; pointer-events: none; }`;
  function style() { if (!document.getElementById('mkCss')) { const s = document.createElement('style'); s.id = 'mkCss'; s.textContent = css; document.head.append(s); } }
  function note(text, x, y, w) { style(); const d = document.createElement('div'); d.className = 'mkNote'; d.innerHTML = text; Object.assign(d.style, { left: `${x}px`, top: `${y}px` }); if (w) d.style.maxWidth = `${w}px`; document.body.append(d); return d; }
  function tag(text, x, y, cls = '') { style(); const d = document.createElement('div'); d.className = `mkTag ${cls}`; d.innerHTML = text; Object.assign(d.style, { left: `${x}px`, top: `${y}px` }); document.body.append(d); return d; }
  /** a tag at a point of the 3D scene */
  function tag3d(text, x, y, z, cls = '', dx = 0, dy = 0) {
    const cam = fp().camera || fp().cam?.(), c = fp().canvas || document.querySelector('canvas'), r = c.getBoundingClientRect();
    const v = cam.position.clone().set(x, y, z).project(cam);
    return tag(text, r.left + ((v.x + 1) / 2) * r.width + dx, r.top + ((1 - v.y) / 2) * r.height + dy, cls);
  }
  /** the side panel "⛰ Gelände" of the tool Grundstück */
  function panel(x, y) {
    style();
    const box = document.createElement('div'); box.className = 'mkBox';
    box.innerHTML = `<h5>⛰ Gelände <span class="mkNew">NEU</span></h5>
      <div class="mkSub">Höhenpunkte antippen und die Höhe eintragen. Dazwischen neigt sich der Boden von selbst.</div>
      <div class="mkRow"><span>Höhenpunkt ① hinten (Haustür)</span><span class="mkIn">±0,00 <small>m</small></span></div>
      <div class="mkRow"><span>Höhenpunkt ② vorne (Straße)</span><span class="mkIn">−3,00 <small>m</small></span></div>
      <div class="mkRow"><span>Höhenlinien im Plan</span><span class="mkSeg"><span class="on">alle 0,5 m</span><span>aus</span></span></div>
      <button class="mkBtn">＋ Höhenpunkt setzen</button>
      <button class="mkBtn">↕ Hang in einem Schritt: „Straße ein Geschoss tiefer“</button>`;
    Object.assign(box.style, { left: `${x}px`, top: `${y}px` });
    document.body.append(box);
    return true;
  }
  /** the 2D plan: contour lines every 0.5 m, the two spot heights, an arrow down the slope */
  function plan2d() {
    style();
    const P = fp().plan(), at = (x, z) => P.toClient(x, z);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'mkSvg');
    const el = (tag_, attrs) => { const e = document.createElementNS(svg.namespaceURI, tag_); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    const X0 = -7, X1 = 29;
    for (let k = 1; k < 6; k++) {                                     // the contour lines between the back (0) and the front (-3 m)
      const lv = -k * 0.5, z = ZB - (ZB - ZF) * (-lv / H);
      const [ax, ay] = at(X0, z), [bx, by] = at(X1, z);
      el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#a0612c', 'stroke-width': k % 2 ? 1.4 : 2.2, 'stroke-dasharray': k % 2 ? '6 5' : '', opacity: 0.85 });
      const [lx, ly] = at(-6.3, z);
      tag(`${lv.toFixed(1).replace('.', ',')} m`, lx, ly, 'dark').style.fontSize = '11.5px';
    }
    [[ZB, '#2f7d3b'], [ZF, '#2f7d3b']].forEach(([z, c]) => { const [ax, ay] = at(X0, z), [bx, by] = at(X1, z); el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: c, 'stroke-width': 2.4, opacity: 0.9 }); });
    const pin = (x, z, txt) => { const [px, py] = at(x, z); el('circle', { cx: px, cy: py, r: 9, fill: '#e0582c', stroke: '#fff', 'stroke-width': 2.5 }); tag(txt, px + 14, py, 'pin').style.transform = 'translate(0, -50%)'; };
    pin(5, 9.8, '① ±0,00 m');
    pin(5, -3.2, '② −3,00 m');
    const [ax, ay] = at(18.2, 9.6), [bx, by] = at(18.2, -3.6);       // the arrow down the slope: from the back garden to the street
    el('line', { x1: ax, y1: ay, x2: bx, y2: by + 16, stroke: '#3fa9f5', 'stroke-width': 4 });
    el('polygon', { points: `${bx - 11},${by + 18} ${bx + 11},${by + 18} ${bx},${by - 2}`, fill: '#3fa9f5' });
    document.body.append(svg);
    const [tx, ty] = at(18.2, 11.4);
    tag('↑ fällt 3 m zur Straße', tx, ty, 'dark');
    return true;
  }
  return { prepare, apply, note, tag, tag3d, panel, plan2d, ground };
})();
