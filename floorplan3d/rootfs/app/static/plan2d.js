/* 2D blueprint editor. Works directly on the shared layout object, so everything drawn here is the same
   data the 3D view builds from (and vice versa). Rendering is plain SVG in screen coordinates. */

const NS = 'http://www.w3.org/2000/svg';
const C = {
  wall: '#9fdcff', wallGhost: 'rgba(159,220,255,.25)', line: '#e8f6ff', sel: '#ffb04a', accent: '#23e0ff',
  grid1: 'rgba(160,215,255,.10)', grid2: 'rgba(160,215,255,.22)', text: '#eaf7ff', warn: '#ff4a3d',
};

/* footprint (m) of every device type: [w, d] or radius for round ones */
const FOOT = {
  light: { r: 0.2 }, lamp: { r: 0.2 }, orb: { r: 0.11 }, strip: { w: 1, d: 0.06 }, switch: { w: 0.14, d: 0.14 }, sensor: { r: 0.09 }, thermostat: { w: 0.9, d: 0.16 },
  tv: { w: 1.2, d: 0.45 }, sofa: { w: 2.0, d: 0.9 }, bed: { w: 1.6, d: 2.0 }, table: { w: 1.4, d: 0.8 }, plant: { r: 0.3 },
  chair: { w: 0.42, d: 0.42 }, armchair: { w: 0.9, d: 0.85 }, desk: { w: 1.4, d: 0.7 }, diningtable: { w: 1.8, d: 0.95 },
  coffeetable: { w: 1.0, d: 0.55 }, wardrobe: { w: 1.5, d: 0.6 }, shelf: { w: 0.9, d: 0.34 }, sideboard: { w: 1.6, d: 0.42 },
  kitchen: { w: 2.4, d: 0.6 }, fridge: { w: 0.6, d: 0.65 }, washer: { w: 0.6, d: 0.6 }, bathtub: { w: 1.7, d: 0.75 },
  toilet: { w: 0.38, d: 0.5 }, basin: { w: 0.6, d: 0.45 }, shower: { w: 0.9, d: 0.9 }, carpet: { w: 2.0, d: 1.4 }, car: { w: 1.8, d: 4.2 },
  door: { w: 0.95, d: 0.1 }, window: { w: 1.2, d: 0.1 },
};
const GLYPH = { light: '✦', lamp: '✦', orb: '●', strip: '', switch: '◧', sensor: '◉', thermostat: '≋', tv: '▭', plant: '❀', bed: '', sofa: '' };
const DEFAULT_FOOT = { w: 0.8, d: 0.8 };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export function createPlan(ctx) {
  const root = document.createElement('div');
  root.id = 'plan2d';
  root.hidden = true;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'plan-svg');
  root.append(svg);
  ctx.stage.insertBefore(root, ctx.stage.firstChild);

  let visible = false;
  let s = 60, tx = 0, ty = 0;                 // px per metre + offset
  let W = 800, H = 600;
  let drawPts = [], cursor = null, shift = false;
  let hover = null, opPreview = null;
  let drag = null;                            // active pointer interaction
  let raf = 0, rebuildRaf = 0;
  let lastTap = null;
  let bgMode = null;                          // null | 'move' | 'calib' (background image tools)
  let calibPts = [], calibCur = null;

  const floor = () => ctx.floor();
  const sx = (x) => x * s + tx, sy = (z) => z * s + ty;
  const wx = (px) => (px - tx) / s, wz = (py) => (py - ty) / s;
  const grid = () => ctx.settings().grid || 0.25;
  const isLive = () => ctx.isLive();

  /* ---------- geometry helpers ---------- */
  const dirOf = (w) => { const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1; return [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L, L]; };
  const distSeg = (px, pz, a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L2));
    return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
  };
  function footOf(d) {
    const base = FOOT[d.type] || DEFAULT_FOOT;
    const k = d.scale || 1;
    return base.r ? { r: base.r * k } : { w: base.w * k, d: base.d * k };
  }
  function devHit(d, x, z) {
    const f = footOf(d), pad = Math.max(0.05, 8 / s);
    const th = (-(d.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
    const dx = x - d.x, dz = z - d.z;
    const lx = dx * c + dz * sn, lz = -dx * sn + dz * c;           // into device-local frame
    if (f.r) return Math.hypot(dx, dz) <= f.r + pad;
    return Math.abs(lx) <= f.w / 2 + pad && Math.abs(lz) <= f.d / 2 + pad;
  }

  /* Snap to nearby corner points first, then to the grid. `fine` = 5 cm grid (devices). */
  function snapPt(x, z, { fine = false, ends = true, free = false } = {}) {
    if (ends) {
      const f = floor(), tol = 10 / s;
      let best = null, bd = tol;
      const test = (p) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; best = p; } };
      f.walls.forEach((w) => { test(w.a); test(w.b); });
      f.rooms.forEach((r) => r.points.forEach(test));
      if (best) return [best[0], best[1]];
    }
    if (free) return [x, z];
    const g = fine ? 0.05 : grid();
    return [Math.round(x / g) * g, Math.round(z / g) * g];
  }
  function angleSnap(from, p) {
    const dx = p[0] - from[0], dz = p[1] - from[1], L = Math.hypot(dx, dz);
    if (!L) return p;
    const a = Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const g = grid();
    const l = Math.round(L / g) * g;
    return [from[0] + Math.cos(a) * l, from[1] + Math.sin(a) * l];
  }

  /* ---------- picking ---------- */
  function openingAt(x, z) {
    const tol = Math.max(0.12, 8 / s);
    let best = null, bd = Infinity;
    floor().walls.forEach((w) => {
      const [ux, uz, L] = dirOf(w);
      (w.openings || []).forEach((o) => {
        const cx = w.a[0] + ux * o.pos, cz = w.a[1] + uz * o.pos;
        const along = Math.abs((x - cx) * ux + (z - cz) * uz), across = Math.abs(-(x - cx) * uz + (z - cz) * ux);
        const swing = o.type === 'door' ? o.width : 0;                  // door leaf area counts a bit
        if (along <= o.width / 2 + tol && across <= Math.max(w.thickness / 2 + tol, swing * 0.15) && along + across < bd) { bd = along + across; best = { kind: 'opening', id: o.id }; }
      });
    });
    return best;
  }
  function pickAt(x, z) {
    const f = floor();
    const devs = f.devices.filter((d) => devHit(d, x, z) && d.type !== 'carpet').sort((a, b) => {
      const fa = footOf(a), fb = footOf(b);
      return (fa.r ? fa.r * fa.r * 3 : fa.w * fa.d) - (fb.r ? fb.r * fb.r * 3 : fb.w * fb.d);   // smallest first
    });
    if (devs.length) return { kind: 'device', id: devs[0].id };
    const op = openingAt(x, z);
    if (op) return op;
    const tol = Math.max(0.06, 7 / s);
    let wb = null, wd = Infinity;
    f.walls.forEach((w) => { const d = distSeg(x, z, w.a, w.b); if (d <= Math.max(w.thickness / 2, tol) && d < wd) { wd = d; wb = w; } });
    if (wb) return { kind: 'wall', id: wb.id };
    const rug = f.devices.find((d) => d.type === 'carpet' && devHit(d, x, z));
    if (rug) return { kind: 'device', id: rug.id };
    const rooms = f.rooms.filter((r) => ctx.pointInPoly(x, z, r.points));
    if (rooms.length) return { kind: 'room', id: rooms[rooms.length - 1].id };
    return null;
  }
  /* handles of the selected wall (end points) or room (corners) */
  function handleAt(px, py) {
    const sel = ctx.getSelection();
    if (!sel) return null;
    const f = floor();
    const near = (p) => Math.hypot(sx(p[0]) - px, sy(p[1]) - py) <= 11;
    if (sel.kind === 'wall') {
      const w = f.walls.find((q) => q.id === sel.id);
      if (w) { if (near(w.a)) return { type: 'wall-end', wall: w, end: 'a' }; if (near(w.b)) return { type: 'wall-end', wall: w, end: 'b' }; }
    } else if (sel.kind === 'room') {
      const r = f.rooms.find((q) => q.id === sel.id);
      if (r) { const i = r.points.findIndex(near); if (i >= 0) return { type: 'room-pt', room: r, i }; }
    }
    return null;
  }

  /* ---------- rendering ---------- */
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  function scheduleRebuild() { if (!rebuildRaf) rebuildRaf = requestAnimationFrame(() => { rebuildRaf = 0; ctx.rebuild3d(); }); }

  function wallPoly(a, b, t, extA = 0, extB = 0) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, nx = -uz * t / 2, nz = ux * t / 2;
    const A = [a[0] - ux * extA, a[1] - uz * extA], B = [b[0] + ux * extB, b[1] + uz * extB];
    return [[A[0] + nx, A[1] + nz], [B[0] + nx, B[1] + nz], [B[0] - nx, B[1] - nz], [A[0] - nx, A[1] - nz]];
  }
  const pts = (arr) => arr.map((p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
  const isOn = (e) => !!e && ctx.isOn(e);

  function render() {
    if (!visible) return;
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const f = floor();
    if (!f) { svg.innerHTML = ''; return; }
    const sel = ctx.getSelection();
    const live = isLive();
    let o = '';

    /* background image (edit mode only): a scan / photo of the floor plan to trace */
    const bg = f.bg;
    if (bg && bg.img && !bg.hidden && !live) {
      const bw = bg.w * s, bh = bw * (bg.ar || 1);
      o += `<image href="api/backgrounds/${esc(bg.img)}" x="${sx(bg.x).toFixed(1)}" y="${sy(bg.z).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" opacity="${bg.op ?? 0.5}" preserveAspectRatio="none" transform="rotate(${bg.rot || 0} ${sx(bg.x).toFixed(1)} ${sy(bg.z).toFixed(1)})" style="pointer-events:none"/>`;
    }

    /* grid */
    const step = s >= 40 ? 0.5 : s >= 18 ? 1 : 5, minor = s >= 90 ? 0.1 : null;
    const x0 = wx(0), x1 = wx(W), z0 = wz(0), z1 = wz(H);
    let g = '';
    const lines = (stp, col) => {
      let d = '';
      for (let x = Math.floor(x0 / stp) * stp; x <= x1; x += stp) d += `M${sx(x).toFixed(1)} 0V${H}`;
      for (let z = Math.floor(z0 / stp) * stp; z <= z1; z += stp) d += `M0 ${sy(z).toFixed(1)}H${W}`;
      return `<path d="${d}" stroke="${col}" stroke-width="1" fill="none"/>`;
    };
    if (minor) g += lines(minor, 'rgba(160,215,255,.05)');
    g += lines(step, C.grid1);
    g += lines(step >= 5 ? 10 : step >= 1 ? 5 : 1, C.grid2);
    o += g;

    /* floors below, faint */
    const idx = ctx.getFloorIdx();
    if (idx > 0) {
      const below = ctx.layout().floors[idx - 1];
      below.walls.forEach((w) => { o += `<polygon points="${pts(wallPoly(w.a, w.b, w.thickness, w.thickness / 2, w.thickness / 2))}" fill="${C.wallGhost}"/>`; });
    }

    /* rooms */
    f.rooms.forEach((rm) => {
      const isSel = sel?.kind === 'room' && sel.id === rm.id;
      const heat = ctx.roomHeat ? ctx.roomHeat(rm, f) : null;
      const fill = heat || rm.color || '#8a7f70';
      o += `<polygon points="${pts(rm.points)}" fill="${fill}" fill-opacity="${heat ? 0.45 : 0.26}" stroke="${isSel ? C.sel : 'rgba(255,255,255,.25)'}" stroke-width="${isSel ? 2 : 1}" stroke-dasharray="${isSel ? '' : '4 4'}"/>`;
    });

    /* walls (split around openings) */
    f.walls.forEach((w) => {
      const [ux, uz, L] = dirOf(w);
      const ops = [...(w.openings || [])].sort((a, b) => a.pos - b.pos);
      let cur = 0;
      const t = w.thickness;
      const isSel = sel?.kind === 'wall' && sel.id === w.id;
      const col = isSel ? C.sel : C.wall;
      const seg = (from, to, extA, extB) => {
        if (to - from < 1e-3) return;
        const a = [w.a[0] + ux * from, w.a[1] + uz * from], b = [w.a[0] + ux * to, w.a[1] + uz * to];
        o += `<polygon points="${pts(wallPoly(a, b, t, extA, extB))}" fill="${col}" stroke="${col}" stroke-width="0.5"/>`;
      };
      ops.forEach((op, i) => { seg(cur, op.pos - op.width / 2, i === 0 ? t / 2 : 0, 0); cur = op.pos + op.width / 2; });
      seg(cur, L, ops.length ? 0 : t / 2, t / 2);
      if (!ops.length) { /* solid wall: caps handled above (both ends extended) */ }
    });
    /* openings */
    f.walls.forEach((w) => {
      const [ux, uz] = dirOf(w);
      const nx = -uz, nz = ux;
      (w.openings || []).forEach((op) => {
        const cx = w.a[0] + ux * op.pos, cz = w.a[1] + uz * op.pos, hw = op.width / 2;
        const isSel = sel?.kind === 'opening' && sel.id === op.id;
        const open = isOn(op.entity);
        const col = isSel ? C.sel : open ? C.warn : C.line;
        const P = (u, n) => [sx(cx + ux * u + nx * n), sy(cz + uz * u + nz * n)];
        const t = w.thickness / 2;
        const jamb = [P(-hw, -t), P(-hw, t), P(hw, -t), P(hw, t)];
        o += `<path d="M${jamb[0]}L${jamb[1]}M${jamb[2]}L${jamb[3]}" stroke="${col}" stroke-width="2" fill="none"/>`;
        if (op.type === 'door') {
          const hu = op.flip ? hw : -hw, closed = P(-hu, 0), hinge = P(hu, 0);
          const leaf = P(hu, op.width);
          const v0 = [leaf[0] - hinge[0], leaf[1] - hinge[1]], v1 = [closed[0] - hinge[0], closed[1] - hinge[1]];
          const sweep = v0[0] * v1[1] - v0[1] * v1[0] > 0 ? 1 : 0;
          const R = op.width * s;
          o += `<path d="M${hinge}L${leaf}" stroke="${col}" stroke-width="2.5" fill="none"/>`;
          o += `<path d="M${leaf}A${R} ${R} 0 0 ${sweep} ${closed}" stroke="${col}" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".8"/>`;
        } else {
          const a = P(-hw, 0), b = P(hw, 0), a1 = P(-hw, -t * .5), b1 = P(hw, -t * .5), a2 = P(-hw, t * .5), b2 = P(hw, t * .5);
          o += `<path d="M${a1}L${b1}M${a2}L${b2}" stroke="${col}" stroke-width="1.6" fill="none"/><path d="M${a}L${b}" stroke="${col}" stroke-width="1" opacity=".7"/>`;
        }
        const hit = `M${P(-hw, -t - 0.15)}L${P(hw, -t - 0.15)}L${P(hw, t + 0.15)}L${P(-hw, t + 0.15)}Z`;
        if (isSel) o += `<path d="${hit}" fill="rgba(255,176,74,.12)" stroke="${C.sel}" stroke-dasharray="4 3"/>`;
        if (live && op.entity) { const p = P(0, -t - 0.35); o += `<text x="${p[0]}" y="${p[1]}" fill="${open ? C.warn : C.text}" font-size="10" text-anchor="middle">${esc(ctx.openText(op.entity))}</text>`; }
      });
    });

    /* wall dimensions */
    if (s >= 28) {
      f.walls.forEach((w) => {
        const [ux, uz, L] = dirOf(w);
        if (L < 0.5) return;
        const nx = -uz, nz = ux;
        const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2, off = w.thickness / 2 + 11 / s;
        const px = sx(mx + nx * off), py = sy(mz + nz * off);
        let ang = Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]) * 180 / Math.PI;
        if (ang > 90 || ang < -90) ang += 180;
        const isSel = sel?.kind === 'wall' && sel.id === w.id;
        o += `<text transform="translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${ang.toFixed(1)})" text-anchor="middle" dominant-baseline="middle" font-size="${isSel ? 12 : 10}" fill="${isSel ? C.sel : 'rgba(210,235,255,.75)'}">${esc(ctx.fmtLen(L))}</text>`;
      });
    }

    /* devices */
    const devs = [...f.devices].sort((a, b) => (a.type === 'carpet' ? -1 : 0) - (b.type === 'carpet' ? -1 : 0));
    devs.forEach((d) => {
      const fo = footOf(d);
      const isSel = sel?.kind === 'device' && sel.id === d.id;
      const st = d.entity ? ctx.states()[d.entity] : null;
      const on = d.entity && isOn(d.entity);
      let fill = 'rgba(35,224,255,.14)', stroke = isSel ? C.sel : C.accent;
      const isLight = /^(light|switch)\./.test(d.entity || '');
      if (on && isLight) {
        const c = Array.isArray(st?.rgb) ? st.rgb : [255, 214, 120];
        fill = `rgba(${c[0]},${c[1]},${c[2]},.55)`;
      } else if (on) fill = 'rgba(80,255,170,.22)';
      const rot = -(d.rot || 0);
      const cx = sx(d.x), cy = sy(d.z);
      o += `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${rot})">`;
      if (on && isLight) o += `<circle r="${(fo.r || Math.max(fo.w, fo.d) / 2) * s * 2.6}" fill="url(#glow)" opacity=".7"/>`;
      if (fo.r) o += `<circle r="${fo.r * s}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel ? 2.2 : 1.4}"/>`;
      else {
        const w = fo.w * s, h = fo.d * s;
        o += `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(4, h / 4)}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel ? 2.2 : 1.4}"/>`;
        if (h > 8 && d.type !== 'carpet') o += `<line x1="${-w / 2 + 3}" y1="${h / 2 - 3}" x2="${w / 2 - 3}" y2="${h / 2 - 3}" stroke="${stroke}" stroke-width="1" opacity=".55"/>`;   // front edge
      }
      o += '</g>';
      const gl = GLYPH[d.type];
      if (gl && s >= 20) o += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${Math.max(9, Math.min(18, (fo.r ? fo.r * s * 1.4 : Math.min(fo.w, fo.d) * s * .6)))}" fill="${on ? '#fff' : C.accent}">${gl}</text>`;
      if (d.type !== 'carpet' && (d.name || d.entity) && (s >= 48 || (live && s >= 34 && st && (st.unit || d.entity.startsWith('sensor.'))))) {
        const off = (fo.r || Math.max(fo.w, fo.d) / 2) * s + 10;
        const label = live && st ? `${d.name || ''}${st.unit || /^(sensor)\./.test(d.entity) ? ' · ' + ctx.stateText(d.entity) : ''}` : d.name || '';
        o += `<text x="${cx}" y="${cy + Math.min(off, 40)}" text-anchor="middle" font-size="10" fill="${C.text}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${esc(label)}</text>`;
      }
      if (!live && d.entity && s >= 34) o += `<circle cx="${cx + (fo.r || fo.w / 2) * s}" cy="${cy - (fo.r || fo.d / 2) * s}" r="3" fill="${on ? '#5dff9d' : 'rgba(255,255,255,.4)'}"/>`;
    });

    /* room labels on top */
    f.rooms.forEach((rm) => {
      if (!rm.name) return;
      const c = rm.points.reduce((a, p) => [a[0] + p[0] / rm.points.length, a[1] + p[1] / rm.points.length], [0, 0]);
      const area = ctx.area(rm.points);
      o += `<text x="${sx(c[0])}" y="${sy(c[1])}" text-anchor="middle" font-size="14" font-weight="700" fill="${C.text}" stroke="rgba(3,21,71,.85)" stroke-width="4" paint-order="stroke">${esc(rm.name)}</text>`;
      o += `<text x="${sx(c[0])}" y="${sy(c[1]) + 15}" text-anchor="middle" font-size="11" fill="rgba(210,235,255,.85)" stroke="rgba(3,21,71,.85)" stroke-width="3" paint-order="stroke">${esc(area)}</text>`;
    });

    /* selection handles */
    if (!live && sel) {
      const hnd = (p, fill = '#fff') => `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="6" fill="${fill}" stroke="${C.sel}" stroke-width="2"/>`;
      if (sel.kind === 'wall') { const w = f.walls.find((q) => q.id === sel.id); if (w) o += hnd(w.a) + hnd(w.b); }
      if (sel.kind === 'room') { const rm = f.rooms.find((q) => q.id === sel.id); if (rm) rm.points.forEach((p) => { o += hnd(p); }); }
    }

    /* hover + drafts */
    const tool = ctx.getTool();
    if (!live && tool === 'opening' && opPreview) {
      const { wall, pos, valid, def } = opPreview;
      const [ux, uz] = dirOf(wall);
      const cx = wall.a[0] + ux * pos, cz = wall.a[1] + uz * pos, hw = def.width / 2, t = wall.thickness / 2 + 0.1;
      const P = (u, n) => `${sx(cx + ux * u - uz * n)},${sy(cz + uz * u + ux * n)}`;
      o += `<polygon points="${P(-hw, -t)} ${P(hw, -t)} ${P(hw, t)} ${P(-hw, t)}" fill="${valid ? 'rgba(35,224,255,.35)' : 'rgba(255,74,61,.4)'}" stroke="${valid ? C.accent : C.warn}"/>`;
    }
    if (!live && (tool === 'wall' || tool === 'room') && drawPts.length) {
      const pl = cursor ? [...drawPts, cursor] : drawPts;
      o += `<polyline points="${pts(pl)}" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
      if (tool === 'room' && drawPts.length >= 2) o += `<polygon points="${pts(pl)}" fill="rgba(35,224,255,.12)" stroke="none"/>`;
      drawPts.forEach((p) => { o += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="4" fill="${C.accent}"/>`; });
      if (cursor) {
        const last = drawPts[drawPts.length - 1], L = Math.hypot(cursor[0] - last[0], cursor[1] - last[1]);
        o += `<text x="${sx((cursor[0] + last[0]) / 2)}" y="${sy((cursor[1] + last[1]) / 2) - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.accent}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${esc(ctx.fmtLen(L))}</text>`;
      }
    }
    if (!live && cursor && (tool === 'wall' || tool === 'room' || tool === 'device')) o += `<circle cx="${sx(cursor[0])}" cy="${sy(cursor[1])}" r="5" fill="none" stroke="${C.accent}" stroke-width="1.5"/>`;

    if (!live && bgMode === 'calib' && calibPts.length) {
      const pl = calibCur && calibPts.length === 1 ? [...calibPts, calibCur] : calibPts;
      o += `<polyline points="${pts(pl)}" fill="none" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="6 4"/>`;
      pl.forEach((p) => { o += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="5" fill="#ff4fd8" stroke="#fff" stroke-width="1.5"/>`; });
    }

    svg.innerHTML = `<defs><radialGradient id="glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>${o}`;
  }

  /* ---------- view ---------- */
  function fit() {
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    const f = floor();
    if (!f || !W || !H) return;
    const p = [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((q) => q.points), ...f.devices.map((d) => [d.x, d.z])];
    if (!p.length && f.bg?.img && !f.bg.hidden && !isLive()) p.push([f.bg.x, f.bg.z], [f.bg.x + f.bg.w, f.bg.z + f.bg.w * (f.bg.ar || 1)]);   // empty floor: frame the template
    if (!p.length) { s = 60; tx = W / 2 - 3 * s; ty = H / 2 - 2 * s; render(); return; }
    const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]);
    const [a0, a1, b0, b1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    const padX = 60, padTop = 130, padBottom = 70;
    s = Math.max(12, Math.min(160, Math.min((W - 2 * padX) / Math.max(a1 - a0, 2), (H - padTop - padBottom) / Math.max(b1 - b0, 2))));
    tx = (W - (a1 - a0) * s) / 2 - a0 * s;
    ty = padTop + ((H - padTop - padBottom) - (b1 - b0) * s) / 2 - b0 * s;
    render();
  }
  function zoomAt(px, py, k) {
    const ns = Math.max(8, Math.min(400, s * k));
    const wxp = wx(px), wzp = wz(py);
    s = ns; tx = px - wxp * s; ty = py - wzp * s;
    render();
  }

  /* ---------- pointer interaction ---------- */
  const local = (e) => { const r = root.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const pointers = new Map();
  let pinch = null;

  function pickIfAllowed(x, z) {
    const h = pickAt(x, z);
    if (isLive() && h && h.kind === 'opening') {
      const o = ctx.findOpening(h.id);
      if (!o?.opening.entity) return null;
    }
    return h;
  }

  root.addEventListener('contextmenu', (e) => e.preventDefault());
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [px, py] = local(e);
    zoomAt(px, py, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  root.addEventListener('pointerdown', (e) => {
    const [px, py] = local(e);
    pointers.set(e.pointerId, [px, py]);
    root.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {                                   // pinch zoom
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s };
      drag = null;
      return;
    }
    const x = wx(px), z = wz(py);
    if (e.button === 1 || e.button === 2) { drag = { type: 'pan', px, py, tx, ty }; return; }
    if (e.button !== 0) return;
    const live = isLive();
    const tool = ctx.getTool();
    if (live) { drag = { type: 'tap', px, py, moved: false }; return; }
    if (bgMode === 'move' && floor()?.bg) { const b = floor().bg; drag = { type: 'bgmove', px, py, ox: b.x, oz: b.z, sx0: x, sz0: z, moved: false }; return; }
    if (bgMode === 'calib') { drag = { type: 'calib', px, py }; return; }

    if (tool === 'select') {
      const sel = ctx.getSelection();
      const hd = handleAt(px, py);
      if (hd) { drag = { ...startHandleDrag(hd), px, py }; return; }
      if (ctx.isLocked() && sel) {                               // locked: only the selection reacts
        const d0 = startDrag(sel, x, z, px, py, e);
        drag = d0 || { type: 'pan', px, py, tx, ty, locked: true };
        return;
      }
      const h = pickAt(x, z);
      if (h) {
        ctx.setSelection(h);
        drag = startDrag(h, x, z, px, py, e) || { type: 'pan', px, py, tx, ty };
      } else {
        drag = { type: 'pan', px, py, tx, ty, clear: true };
      }
    } else if (tool === 'erase') {
      drag = { type: 'erase', px, py };
    } else {
      drag = { type: 'tool', px, py, moved: false };
    }
  });

  let snapDone = false;
  function snapshotOnce() { if (!snapDone) { ctx.snapshot(); snapDone = true; } }

  function coincident(p, list) { return list.filter((q) => Math.abs(q[0] - p[0]) < 0.02 && Math.abs(q[1] - p[1]) < 0.02); }
  function allCornerRefs() {
    const f = floor();
    return [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points)];
  }
  function startHandleDrag(hd) {
    if (hd.type === 'wall-end') {
      const p = hd.wall[hd.end];
      const refs = coincident(p, allCornerRefs());
      return { type: 'points', refs: refs.map((q) => ({ q, ox: q[0], oz: q[1] })), start: [p[0], p[1]], wall: hd.wall, other: [...hd.wall[hd.end === 'a' ? 'b' : 'a']] };
    }
    return { type: 'points', refs: [{ q: hd.room.points[hd.i], ox: hd.room.points[hd.i][0], oz: hd.room.points[hd.i][1] }], start: [...hd.room.points[hd.i]], single: true };
  }
  function startDrag(h, x, z, px, py) {
    const f = floor();
    if (h.kind === 'device') {
      const d = f.devices.find((v) => v.id === h.id);
      return d ? { type: 'device', d, dx: d.x - x, dz: d.z - z, moved: false, px, py } : null;
    }
    if (h.kind === 'opening') {
      const fo = ctx.findOpening(h.id);
      return fo ? { type: 'opening', ...fo, moved: false, px, py } : null;
    }
    if (h.kind === 'wall') {
      const w = f.walls.find((q) => q.id === h.id);
      if (!w) return null;
      const all = allCornerRefs();
      const refs = [...new Set([...coincident(w.a, all), ...coincident(w.b, all)])];
      return { type: 'points', refs: refs.map((q) => ({ q, ox: q[0], oz: q[1] })), start: [x, z], moved: false, whole: true, px, py };
    }
    if (h.kind === 'room') {
      const r = f.rooms.find((q) => q.id === h.id);
      return r ? { type: 'points', refs: r.points.map((q) => ({ q, ox: q[0], oz: q[1] })), start: [x, z], moved: false, whole: true, px, py } : null;
    }
    return null;
  }

  root.addEventListener('pointermove', (e) => {
    const [px, py] = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [px, py]);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const ns = Math.max(8, Math.min(400, pinch.s * d / pinch.d));
      const wxp = wx(mx), wzp = wz(my);
      s = ns; tx = mx - wxp * s; ty = my - wzp * s;
      render();
      return;
    }
    shift = e.shiftKey;
    const x = wx(px), z = wz(py);
    const tool = ctx.getTool();

    if (drag) {
      const moved = Math.hypot(px - drag.px, py - drag.py) > 4;
      if (drag.type === 'pan') { tx = drag.tx + (px - drag.px); ty = drag.ty + (py - drag.py); render(); return; }
      if (drag.type === 'bgmove' && moved) {
        snapshotOnce();
        const b = floor().bg;
        b.x = +(drag.ox + (x - drag.sx0)).toFixed(3); b.z = +(drag.oz + (z - drag.sz0)).toFixed(3);
        drag.moved = true; render();
        return;
      }
      if (drag.type === 'device' && moved) {
        snapshotOnce();
        const [nx, nz] = snapPt(x + drag.dx, z + drag.dz, { fine: true, ends: false, free: e.altKey });
        drag.d.x = nx; drag.d.z = nz; drag.moved = true;
        ctx.liveMoveDevice(drag.d);
        render();
        return;
      }
      if (drag.type === 'opening' && moved) {
        const { wall, opening } = drag;
        const raw = Math.round(ctx.projectOnWall(wall, [x, z]) / 0.05) * 0.05;
        const pos = ctx.clampOpeningPos(wall, opening.width, raw);
        if (pos !== null && !ctx.openingOverlaps(wall, pos, opening.width, opening.id) && Math.abs(pos - opening.pos) > 1e-6) {
          snapshotOnce();
          opening.pos = pos; drag.moved = true;
          scheduleRebuild(); render();
        }
        return;
      }
      if (drag.type === 'points' && (moved || drag.moved)) {
        snapshotOnce();
        let nx = x, nz = z;
        if (drag.whole) { nx = drag.refs[0].ox + (x - drag.start[0]); nz = drag.refs[0].oz + (z - drag.start[1]); }
        let p = snapPt(nx, nz, { ends: !drag.whole, free: e.altKey });
        if (!drag.whole && drag.wall && shift) p = angleSnap(drag.other, p);
        const ddx = p[0] - drag.refs[0].ox, ddz = p[1] - drag.refs[0].oz;
        drag.refs.forEach((r) => { r.q[0] = +(r.ox + ddx).toFixed(4); r.q[1] = +(r.oz + ddz).toFixed(4); });
        drag.moved = true;
        scheduleRebuild(); render();
        if (drag.wall) ctx.setStatus(`${ctx.t('length')}: ${ctx.fmtLen(Math.hypot(drag.wall.b[0] - drag.wall.a[0], drag.wall.b[1] - drag.wall.a[1]))}`);
        return;
      }
      return;
    }

    /* no button down: hover / previews */
    if (isLive()) return;
    if (bgMode === 'calib') { calibCur = [x, z]; if (calibPts.length) render(); return; }
    if (tool === 'wall' || tool === 'room') {
      let p = snapPt(x, z, { free: e.altKey });
      if (drawPts.length && tool === 'wall' && shift) p = angleSnap(drawPts[drawPts.length - 1], p);
      cursor = p;
      if (drawPts.length && tool === 'wall') {
        const last = drawPts[drawPts.length - 1];
        ctx.setStatus(`${ctx.t('length')}: ${ctx.fmtLen(Math.hypot(p[0] - last[0], p[1] - last[1]))}`);
      }
      render();
    } else if (tool === 'device') {
      cursor = snapPt(x, z, { fine: true, ends: false });
      render();
    } else if (tool === 'opening') {
      opPreview = openingTarget(x, z);
      render();
    }
  });

  function openingTarget(x, z, def = ctx.OPENING_DEFAULTS[ctx.getOpeningType()]) {
    let best = null, bd = Math.max(0.3, 14 / s);
    floor().walls.forEach((w) => { const d = distSeg(x, z, w.a, w.b); if (d < bd) { bd = d; best = w; } });
    if (!best) return null;
    const raw = Math.round(ctx.projectOnWall(best, [x, z]) / 0.05) * 0.05;
    const pos = ctx.clampOpeningPos(best, def.width, raw);
    if (pos === null) return null;
    return { wall: best, pos, valid: !ctx.openingOverlaps(best, pos, def.width, null), def };
  }

  root.addEventListener('pointerup', (e) => {
    const [px, py] = local(e);
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    const d = drag;
    drag = null;
    if (!d) return;
    const x = wx(px), z = wz(py);
    const moved = Math.hypot(px - (d.px ?? px), py - (d.py ?? py)) > 4;
    const tool = ctx.getTool();

    if (d.type === 'bgmove') { if (d.moved) { ctx.commit(); } snapDone = false; return; }
    if (d.type === 'calib') {
      if (!moved) {
        calibPts.push([x, z]);
        if (calibPts.length === 2) { const [a, b] = calibPts; calibPts = []; calibCur = null; ctx.calibrate(a, b); } else ctx.setStatus(ctx.t('bg.calibB'));
        render();
      }
      return;
    }
    if (d.type === 'tap') { if (!moved) { const h = pickIfAllowed(x, z); ctx.liveTap(h); } return; }
    if (d.type === 'pan') {
      if (!moved && d.clear && !d.locked) { ctx.setSelection(null); }
      return;
    }
    if (d.type === 'erase') { if (!moved) { const h = pickAt(x, z); if (h) { ctx.snapshot(); ctx.deleteItem(h); } } return; }
    if (d.type === 'device' || d.type === 'opening' || d.type === 'points') {
      if (d.moved) { ctx.commit(); } snapDone = false;
      return;
    }
    if (d.type === 'tool' && !moved) {
      const now = performance.now();
      const dbl = lastTap && now - lastTap.t < 400 && Math.hypot(px - lastTap.px, py - lastTap.py) < 8;
      lastTap = { t: now, px, py };
      if (dbl && (tool === 'wall' || tool === 'room')) { if (tool === 'room') finishRoom(); else cancel(); return; }   // double tap ends the chain
      placeWith(tool, x, z, e);
    }
  });
  root.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); drag = null; pinch = null; snapDone = false; });

  function placeWith(tool, x, z, e) {
    const f = floor();
    if (tool === 'wall') {
      let p = snapPt(x, z, { free: e.altKey });
      const last = drawPts[drawPts.length - 1];
      if (last && shift) p = angleSnap(last, p);
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.01) { cancel(); return; }
      if (last) {
        ctx.snapshot();
        f.walls.push({ id: ctx.uid(), a: [...last], b: [...p], thickness: ctx.settings().wallThickness, height: ctx.settings().wallHeight, openings: [] });
        ctx.commit();
      }
      drawPts.push(p);
      render();
    } else if (tool === 'room') {
      const p = snapPt(x, z, { free: e.altKey });
      if (drawPts.length >= 3 && Math.hypot(p[0] - drawPts[0][0], p[1] - drawPts[0][1]) < 0.01) { finishRoom(); return; }
      drawPts.push(p);
      render();
    } else if (tool === 'opening') {
      const tgt = openingTarget(x, z);
      if (tgt?.valid) {
        ctx.snapshot();
        const o = { id: ctx.uid(), type: ctx.getOpeningType(), pos: tgt.pos, ...tgt.def };
        (tgt.wall.openings ||= []).push(o);
        ctx.setSelection({ kind: 'opening', id: o.id });
        ctx.commit();
      }
    } else if (tool === 'device') {
      const [px2, pz2] = snapPt(x, z, { fine: true, ends: false });
      ctx.snapshot();
      const d = ctx.newDevice(px2, pz2);
      f.devices.push(d);
      ctx.setSelection({ kind: 'device', id: d.id });
      ctx.commit();
    }
  }

  function finishRoom() {
    if (drawPts.length >= 3) {
      ctx.snapshot();
      floor().rooms.push({ id: ctx.uid(), name: `${ctx.t('prop.room')} ${floor().rooms.length + 1}`, color: '#8a7f70', points: drawPts.map((p) => [...p]) });
      ctx.commit();
    }
    cancel();
  }
  function cancel() { drawPts = []; cursor = null; opPreview = null; ctx.setStatus(''); render(); }

  root.addEventListener('dblclick', (e) => {
    if (isLive()) return;
    const tool = ctx.getTool();
    if (tool === 'wall') cancel();
    else if (tool === 'room') finishRoom();
    else if (tool === 'select') {
      const [px, py] = local(e);
      const h = pickAt(wx(px), wz(py));
      if (h?.kind === 'device') ctx.deviceDoubleClick(h.id);
    }
  });
  root.addEventListener('pointerleave', () => { if (!drag) { opPreview = null; if (!drawPts.length) cursor = null; render(); } });

  new ResizeObserver(() => { if (visible) schedule(); }).observe(root);

  return {
    el: root,
    show(v) {
      visible = v;
      root.hidden = !v;
      if (v) { requestAnimationFrame(() => { fit(); }); }
    },
    isVisible: () => visible,
    toClient: (x, z) => { const r = root.getBoundingClientRect(); return [r.left + sx(x), r.top + sy(z)]; },
    render: schedule,
    fit,
    cancel,
    reset() { drawPts = []; cursor = null; opPreview = null; calibPts = []; calibCur = null; },
    setBgMode(m) { bgMode = m; calibPts = []; calibCur = null; root.classList.toggle('bgmode', !!m); render(); },
    hasDraft: () => drawPts.length > 0,
    finishRoom,
  };
}
