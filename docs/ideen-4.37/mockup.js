// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of the owner's wish of 2026-10-27: a second house drawn into the same plan stands on a raised plateau (as big as the house,
// a wall round it, steps up to the front door), and a room whose floor lies higher than the rest of its floor (steps at the door).
// The demo's neighbour house has been brought into the plan as a building of its own (🏘 Gebäude, make_pictures.py) before this runs.
window.mk437 = (() => {
  const fp = () => window.__fp;
  let K = null;
  /** the three.js classes, taken from what the scene already has (the demo bundles three.js, it is not on window) */
  function kit() {
    if (K) return K;
    let mesh = null, tex = null;
    fp().scene.traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const a = o.geometry?.attributes?.position;
      if (!mesh && o.material.type === 'MeshStandardMaterial' && a && !a.isInterleavedBufferAttribute) mesh = o;
      if (!tex && o.material.map?.image) tex = o.material.map;
    });
    mesh.geometry.computeBoundingBox();
    K = { Mesh: mesh.constructor, Geo: mesh.geometry.constructor, Attr: mesh.geometry.attributes.position.constructor, Std: mesh.material.constructor,
      Tex: tex.constructor, Box3: mesh.geometry.boundingBox.constructor, V3: mesh.position.constructor, colorSpace: tex.colorSpace };
    return K;
  }
  /** a box from x0..x1, y0..y1, z0..z1 with uv in metres / uvs */
  function boxGeo(x0, x1, y0, y1, z0, z1, uvs = 1) {
    const P = [], N = [], U = [], I = [];
    const face = (cs, n, w, h) => { const b = P.length / 3; cs.forEach((c) => P.push(...c)); for (let i = 0; i < 4; i++) N.push(...n); U.push(0, 0, w / uvs, 0, w / uvs, h / uvs, 0, h / uvs); I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
    face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], z1 - z0, y1 - y0);
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], z1 - z0, y1 - y0);
    face([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], x1 - x0, z1 - z0);
    face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], x1 - x0, z1 - z0);
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], x1 - x0, y1 - y0);
    face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], x1 - x0, y1 - y0);
    const g = new K.Geo();
    g.setAttribute('position', new K.Attr(new Float32Array(P), 3));
    g.setAttribute('normal', new K.Attr(new Float32Array(N), 3));
    g.setAttribute('uv', new K.Attr(new Float32Array(U), 2));
    g.setIndex(I); g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
  const mesh = (geo, mat) => { const m = new K.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.userData.mk = true; return m; };
  /** a natural stone wall (Bruchsteinmauer): rows of stones of different sizes and shades with dark joints; 1 texture = 1.2 m */
  function stoneTex() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    g.fillStyle = '#5b554d'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512;) {
      const h = 52 + rnd() * 40, hh = Math.min(h, 512 - y);
      for (let x = -rnd() * 60; x < 512;) {
        const w = 70 + rnd() * 110, l = 52 + rnd() * 22, hue = 30 + rnd() * 16, sat = 8 + rnd() * 10;
        g.fillStyle = `hsl(${hue} ${sat}% ${l}%)`;
        const r = 9, x0 = x + 4, y0 = y + 4, x1 = x + w - 4, y1 = y + hh - 4;
        g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, r); g.fill();
        g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x0 + 4, y0 + 2, x1 - x0 - 8, 5);
        g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(x0 + 4, y1 - 6, x1 - x0 - 8, 5);
        for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},.06)`; g.fillRect(x0 + rnd() * (x1 - x0 - 8), y0 + rnd() * (y1 - y0 - 8), 4 + rnd() * 10, 3 + rnd() * 6); }
        x += w;
      }
      y += h;
    }
    const t = new K.Tex(c); t.wrapS = t.wrapT = 1000; t.anisotropy = 4; if (K.colorSpace) t.colorSpace = K.colorSpace; t.needsUpdate = true;
    return t;
  }
  const stoneMat = () => new K.Std({ map: stoneTex(), roughness: 0.95, metalness: 0 });
  const capMat = () => new K.Std({ color: 0xc9c2b6, roughness: 0.8, metalness: 0 });
  const metalMat = () => new K.Std({ color: 0x3a3d42, roughness: 0.45, metalness: 0.6 });

  /** a thin bar from p0 to p1 (railing) */
  function bar(p0, p1, r, mat) {
    const [ax, ay, az] = p0, [bx, by, bz] = p1, L = Math.hypot(bx - ax, by - ay, bz - az);
    const m = mesh(boxGeo(-r, r, -r, r, -L / 2, L / 2), mat);
    m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
    m.lookAt(bx, by, bz);
    return m;
  }

  /** lift everything that lies inside the box { x0, x1, z0, z1 } by h (the top-most part that lies inside as a whole) */
  function lift(area, h, keep = () => false) {
    kit();
    if (fp().unbatchAll) fp().unbatchAll();                 // the furniture of a floor is drawn together; take it apart first
    const box = new K.Box3(), sc = new K.V3(), inside = (b) => b.min.x >= area.x0 && b.max.x <= area.x1 && b.min.z >= area.z0 && b.max.z <= area.z1;
    const over = (b) => b.max.x > area.x0 && b.min.x < area.x1 && b.max.z > area.z0 && b.min.z < area.z1;
    let n = 0;
    const walk = (o) => {
      [...o.children].forEach((c) => {
        if (c.userData.mk || c.isLight || c.isCamera) return;
        box.setFromObject(c);
        if (box.isEmpty() || !over(box)) return;
        if (inside(box) && !keep(c, box)) {
          c.parent.updateMatrixWorld(true); sc.setFromMatrixScale(c.parent.matrixWorld);
          c.position.y += h / (sc.y || 1); c.updateMatrixWorld(true); n++;
          return;
        }
        walk(c);
      });
    };
    walk(fp().scene);
    shadows();
    return n;
  }
  function shadows() { const r = fp().renderer; if (r?.shadowMap) r.shadowMap.needsUpdate = true; }

  /** the plateau under the second house: a natural stone wall round it, the house on top; steps with a landing and a hand rail up to the
   *  front door at door = [x, z] on the front side (towards -z) */
  function plateau({ x0, x1, z0, z1, h, door, lip = 0.2 }) {
    kit();
    const stone = stoneMat(), cap = capMat(), metal = metalMat(), g = [];
    g.push(mesh(boxGeo(x0 - lip, x1 + lip, -0.06, h - 0.05, z0 - lip, z1 + lip, 1.2), stone));
    g.push(mesh(boxGeo(x0 - lip - 0.03, x1 + lip + 0.03, h - 0.05, h, z0 - lip - 0.03, z1 + lip + 0.03, 1), cap));   // the cover stones on top
    // the landing in front of the door, then the steps down to the lawn
    const [dx] = door, fz = z0 - lip, lw = 1.9, ld = 1.2, sw = 1.5, n = 5, rise = h / n, tread = 0.32;
    g.push(mesh(boxGeo(dx - lw / 2, dx + lw / 2, -0.06, h - 0.05, fz - ld, fz, 1.2), stone));
    g.push(mesh(boxGeo(dx - lw / 2 - 0.03, dx + lw / 2 + 0.03, h - 0.05, h, fz - ld - 0.03, fz, 1), cap));
    for (let k = 1; k < n; k++) {
      const za = fz - ld - k * tread, zb = za + tread, top = h - k * rise;
      g.push(mesh(boxGeo(dx - sw / 2, dx + sw / 2, -0.06, top, za, zb, 1), cap));
    }
    // a hand rail on both sides: posts at the bottom step, the top of the steps and the far end of the landing
    const zBot = fz - ld - (n - 1) * tread + 0.12, zTop = fz - ld + 0.05, RH = 0.9;
    [-1, 1].forEach((s) => {
      const x = dx + s * (sw / 2 - 0.06), yb = rise, yt = h;
      g.push(bar([x, yb, zBot], [x, yb + RH, zBot], 0.025, metal));
      g.push(bar([x, yt, zTop], [x, yt + RH, zTop], 0.025, metal));
      g.push(bar([x, yb + RH, zBot], [x, yt + RH, zTop], 0.022, metal));
      const xl = dx + s * (lw / 2 - 0.06);
      g.push(bar([xl, yt, zTop - 0.05], [xl, yt, fz - 0.1], 0.001, metal));
      g.push(bar([xl, yt, fz - 0.15], [xl, yt + RH, fz - 0.15], 0.025, metal));
      g.push(bar([x, yt + RH, zTop], [xl, yt + RH, zTop], 0.022, metal));
      g.push(bar([xl, yt + RH, zTop], [xl, yt + RH, fz - 0.15], 0.022, metal));
    });
    g.forEach((m) => fp().scene.add(m));
    shadows();
  }

  /** a room whose floor lies `h` higher: lift what lies in it, show the edge of the raised floor, steps at a door in the room next to it
   *  (door = { x, z, dir: [dx, dz] towards the lower room, w }) */
  function raiseRoom({ x0, x1, z0, z1, h, door, floorY = 0 }) {
    kit();
    const n = lift({ x0: x0 + 0.02, x1: x1 - 0.02, z0: z0 + 0.02, z1: z1 - 0.02 }, h, (c, b) => b.max.y - b.min.y > 2.4);
    const cap = new K.Std({ color: 0xcdbfa8, roughness: 0.7 }), side = new K.Std({ color: 0x9a948c, roughness: 0.9 }), g = [];
    g.push(mesh(boxGeo(x0, x1, floorY, floorY + h - 0.005, z0, z1, 1), side));   // the raised floor itself (seen in the door and the cut)
    const steps = Math.round(h / 0.15), rise = h / steps, tread = 0.3, [ux, uz] = door.dir, w = door.w || 1.0;
    for (let k = 1; k < steps; k++) {
      const top = floorY + h - k * rise, a = 0.12 + (k - 1) * tread, b = a + tread;
      const xs = ux ? [door.x + ux * a, door.x + ux * b].sort((p, q) => p - q) : [door.x - w / 2, door.x + w / 2];
      const zs = uz ? [door.z + uz * a, door.z + uz * b].sort((p, q) => p - q) : [door.z - w / 2, door.z + w / 2];
      g.push(mesh(boxGeo(xs[0], xs[1], floorY, top, zs[0], zs[1], 1), cap));
    }
    const xs = ux ? [door.x - 0.13, door.x + 0.13].sort((p, q) => p - q) : [door.x - w / 2, door.x + w / 2];
    const zs = uz ? [door.z - 0.13, door.z + 0.13] : [door.z - w / 2, door.z + w / 2];
    g.push(mesh(boxGeo(xs[0], xs[1], floorY, floorY + h, zs[0], zs[1], 1), cap));   // the threshold in the door
    g.forEach((m) => fp().scene.add(m));
    shadows();
    return n;
  }

  /** hide the walls with these ids (a cut through the house, like a section drawing) and the orange boxes round the selected room's things */
  function cut(ids) {
    let n = 0;
    fp().scene.traverse((o) => {
      if (ids.includes(o.userData?.id) && o.userData.kind !== 'device') { o.visible = false; n++; }
      const c = o.material?.color;
      if ((o.isLineSegments || o.isLine) && c && c.r > 0.8 && c.g > 0.35 && c.g < 0.75 && c.b < 0.35) o.visible = false;
    });
    shadows();
    return n;
  }

  /* ---------- the parts on the page (notes, the side panel, the 2D plan) ---------- */
  const css = `
  .mkNote { position: fixed; z-index: 120; max-width: 330px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14.5px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  .mkNew { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px; background: #46a758; color: #fff; font-size: 11.5px; font-weight: 800; vertical-align: 2px; }
  .mkBox { margin: 10px 0 12px; padding: 12px 12px 6px; border-radius: 12px; border: 2px solid #46a758; background: rgba(70,167,88,.08); }
  .mkBox h5 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #8be09c; }
  .mkRow { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 14px; }
  .mkRow > span:first-child { flex: 1; color: var(--muted, #9aa4ae); }
  .mkIn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--line, #3a4350); background: var(--field, #1c232c);
    font-weight: 700; min-width: 86px; justify-content: space-between; }
  .mkIn small { color: var(--muted, #9aa4ae); font-weight: 600; }
  .mkSeg { display: inline-flex; gap: 4px; padding: 3px; border-radius: 10px; background: var(--field, #1c232c); border: 1px solid var(--line, #3a4350); }
  .mkSeg span { padding: 5px 10px; border-radius: 7px; font-weight: 700; font-size: 13px; color: var(--muted, #9aa4ae); }
  .mkSeg span.on { background: var(--accent, #3fa9f5); color: #fff; }
  .mkChk { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; margin-bottom: 10px; line-height: 1.35; }
  .mkChk b.c { flex: none; width: 18px; height: 18px; border-radius: 5px; background: #46a758; color: #fff; display: grid; place-items: center; font-size: 12px; }
  .mkBtn { display: block; width: 100%; margin: 2px 0 8px; padding: 8px 10px; border-radius: 10px; border: 1px dashed #46a758; color: #8be09c; font-weight: 700;
    background: transparent; text-align: left; font-size: 13.5px; }
  .mkSub { font-size: 12.5px; color: var(--muted, #9aa4ae); margin: -4px 0 10px; line-height: 1.35; }
  .mkTag { position: fixed; z-index: 110; transform: translate(-50%, -50%); padding: 4px 10px; border-radius: 999px; background: #2f7d3b; color: #fff;
    font-weight: 800; font-size: 13px; box-shadow: 0 4px 14px rgba(0,0,0,.35); white-space: nowrap; pointer-events: none; }
  .mkTag.big { font-size: 15px; padding: 6px 14px; background: #46a758; }
  .mkTag.dark { background: rgba(20,26,33,.86); }
  svg.mkSvg { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 105; pointer-events: none; }`;
  function style() { if (!document.getElementById('mkCss')) { const s = document.createElement('style'); s.id = 'mkCss'; s.textContent = css; document.head.append(s); } }
  function note(text, x, y, w) { style(); const d = document.createElement('div'); d.className = 'mkNote'; d.innerHTML = text; Object.assign(d.style, { left: `${x}px`, top: `${y}px` }); if (w) d.style.maxWidth = `${w}px`; document.body.append(d); return d; }
  function tag(text, x, y, cls = '') { style(); const d = document.createElement('div'); d.className = `mkTag ${cls}`; d.innerHTML = text; Object.assign(d.style, { left: `${x}px`, top: `${y}px` }); document.body.append(d); return d; }
  /** the side panel of the area "Plateau": its height, its edge and what stands on it */
  function plateauPanel() {
    style();
    const body = document.querySelector('#propsBody') || document.querySelector('#props .body') || document.querySelector('#props');
    const box = document.createElement('div'); box.className = 'mkBox';
    box.innerHTML = `<h5>▲ Plateau <span class="mkNew">NEU</span></h5>
      <div class="mkRow"><span>Höhe über dem Rasen</span><span class="mkIn">90 <small>cm</small></span></div>
      <div class="mkRow"><span>Rand</span><span class="mkSeg"><span class="on">🧱 Mauer</span><span>▲ Böschung</span></span></div>
      <div class="mkRow"><span>Mauer aus</span><span class="mkIn" style="min-width:150px">🪨 Naturstein <small>▾</small></span></div>
      <div class="mkRow"><span>Mauer steht vor dem Haus</span><span class="mkIn">20 <small>cm</small></span></div>
      <div class="mkChk"><b class="c">✓</b><span>Was darauf steht, steht mit oben:<br><b>🏘 Nachbarhaus</b> · 5 Räume, Wände, Türen, Geräte, Treppe, Dach</span></div>
      <button class="mkBtn">＋ Außentreppe an die Haustür (90 cm = 5 Stufen)</button>`;
    const sizeLine = body.querySelector('#yardSize');
    if (sizeLine) sizeLine.before(box); else body.prepend(box);
    box.scrollIntoView({ block: 'end' });
    return !!body;
  }
  /** the side panel of a room: its floor lies higher */
  function roomPanel() {
    style();
    const body = document.querySelector('#propsBody') || document.querySelector('#props');
    const box = document.createElement('div'); box.className = 'mkBox';
    box.innerHTML = `<h5>📏 Boden des Raums <span class="mkNew">NEU</span></h5>
      <div class="mkRow"><span>Boden höher als die Etage</span><span class="mkIn">45 <small>cm</small></span></div>
      <p class="mkSub">Minus = tiefer, z. B. ein abgesenktes Wohnzimmer. Möbel, Geräte und Lampen stehen mit oben, die Decke bleibt.</p>
      <div class="mkRow"><span>Stufen an den Türen</span><span class="mkSeg"><span class="on">automatisch</span><span>keine</span></span></div>
      <div class="mkChk"><b class="c">✓</b><span>3 Stufen à 15 cm zur <b>Küche</b> (Tür)</span></div>`;
    const first = body.querySelector('.field, label, .row');
    (first?.parentElement === body ? first.nextElementSibling || first : body.firstElementChild)?.after(box);
    if (!box.isConnected) body.prepend(box);
    box.scrollIntoView({ block: 'end' });
    return true;
  }

  /** the 2D plan: the steps in front of the front door, "+90 cm" on the rooms on the plateau, the edge of the plateau as a wall */
  function plan2d({ x0, x1, z0, z1, lip, door, h, rooms }) {
    style();
    const P = fp().plan(), at = (x, z) => P.toClient(x, z);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'mkSvg');
    const poly = (pts, attrs) => { const e = document.createElementNS(svg.namespaceURI, 'polygon'); e.setAttribute('points', pts.map((p) => at(...p).join(',')).join(' ')); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    const line = (a, b, attrs) => { const e = document.createElementNS(svg.namespaceURI, 'line'); const [ax, ay] = at(...a), [bx, by] = at(...b); Object.entries({ x1: ax, y1: ay, x2: bx, y2: by, ...attrs }).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); return e; };
    // the wall round the plateau: a band of stone between the house and its outer edge
    const o = [[x0 - lip, z0 - lip], [x1 + lip, z0 - lip], [x1 + lip, z1 + lip], [x0 - lip, z1 + lip]];
    const defs = document.createElementNS(svg.namespaceURI, 'defs');
    defs.innerHTML = `<pattern id="mkStone" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#7a6f60"/><line x1="0" y1="0" x2="0" y2="10" stroke="#b9ad99" stroke-width="4"/></pattern>`;
    svg.append(defs);
    const ring = document.createElementNS(svg.namespaceURI, 'path');
    const d = (pts) => `M${pts.map((p) => at(...p).join(',')).join('L')}Z`;
    ring.setAttribute('d', d(o) + d([[x0, z0], [x0, z1], [x1, z1], [x1, z0]]));
    ring.setAttribute('fill', 'url(#mkStone)'); ring.setAttribute('fill-rule', 'evenodd'); ring.setAttribute('stroke', '#3d352b'); ring.setAttribute('stroke-width', '1.5');
    svg.append(ring);
    // the landing and the steps
    const [dx] = door, fz = z0 - lip, lw = 1.9, ld = 1.2, sw = 1.5, n = 5, tread = 0.32;
    poly([[dx - lw / 2, fz - ld], [dx + lw / 2, fz - ld], [dx + lw / 2, fz], [dx - lw / 2, fz]], { fill: 'url(#mkStone)', stroke: '#3d352b', 'stroke-width': 1.5 });
    poly([[dx - sw / 2, fz - ld - (n - 1) * tread], [dx + sw / 2, fz - ld - (n - 1) * tread], [dx + sw / 2, fz - ld], [dx - sw / 2, fz - ld]], { fill: '#d9d2c5', stroke: '#3d352b', 'stroke-width': 1.5 });
    for (let k = 1; k < n - 1; k++) line([dx - sw / 2, fz - ld - k * tread], [dx + sw / 2, fz - ld - k * tread], { stroke: '#3d352b', 'stroke-width': 1.2 });
    line([dx, fz - ld - (n - 1) * tread + 0.12], [dx, fz - 0.2], { stroke: '#e0582c', 'stroke-width': 2.2 });
    const [ax, ay] = at(dx, fz - 0.2), arrow = document.createElementNS(svg.namespaceURI, 'polygon');
    arrow.setAttribute('points', `${ax - 7},${ay + 9} ${ax + 7},${ay + 9} ${ax},${ay - 3}`); arrow.setAttribute('fill', '#e0582c'); svg.append(arrow);
    document.body.append(svg);
    const [sx, sy] = at(dx - sw / 2 - 0.25, fz - ld - (n - 1) * tread / 2);
    tag('🪜 Außentreppe · 5 Stufen', sx, sy, 'dark').style.transform = 'translate(-100%, -50%)';
    rooms.forEach(([x, z]) => { const [px, py] = at(x, z); tag(`▲ +${Math.round(h * 100)} cm`, px, py + 26); });
    const [qx, qy] = at(x1 + lip, z1 + lip);
    tag('🧱 Mauer 90 cm', qx - 70, qy + 16, 'dark');
    return true;
  }

  return { kit, lift, plateau, raiseRoom, cut, note, tag, plateauPanel, roomPanel, plan2d, shadows };
})();
