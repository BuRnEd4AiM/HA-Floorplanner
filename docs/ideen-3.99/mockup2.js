// Only for the example pictures in this folder (injected into the demo with ?debug=1, see docs/UEBERGABE.md), not part of the add-on.
// Mock-up helpers for the second round of look ideas (only for example pictures, injected into the demo with ?debug=1)
window.mk2 = (() => {
  const fp = window.__fp, scene = fp.scene;
  let kit = null; scene.traverse((o) => { if (!kit && o.isSprite && o.material && o.material.map) kit = o; });
  const Tex = kit.material.map.constructor, cs = kit.material.map.colorSpace;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function tex(c, repeat) { const t = new Tex(c); t.wrapS = t.wrapT = 1000; t.repeat.set(repeat, repeat); if (cs) t.colorSpace = cs; t.anisotropy = 8; t.needsUpdate = true; return t; }
  const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

  function parquet(base) {
    const [c, g] = canvas(512);
    for (let y = 0; y < 512; y += 64) {
      let x = -Math.floor(rnd() * 200);
      while (x < 512) {
        const len = 180 + rnd() * 160, k = 0.85 + rnd() * 0.3;
        g.fillStyle = shade(base, k); g.fillRect(x, y, len, 64);
        for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(60,35,15,${0.05 + rnd() * 0.08})`; g.lineWidth = 1 + rnd(); g.beginPath(); const yy = y + 4 + rnd() * 56; g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + rnd() * 6 - 3, x + len * 0.7, yy + rnd() * 6 - 3, x + len, yy); g.stroke(); }
        g.fillStyle = 'rgba(40,25,10,.6)'; g.fillRect(x, y, 3, 64);
        x += len;
      }
      g.fillStyle = 'rgba(40,25,10,.55)'; g.fillRect(0, y, 512, 3);
    }
    return c;
  }
  function tiles(a, b, grout, n = 4) {
    const [c, g] = canvas(512), s = 512 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = shade((i + j) % 2 ? a : b, 0.96 + rnd() * 0.06); g.fillRect(i * s, j * s, s, s); }
    for (let k = 0; k < 4000; k++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.04})`; g.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
    g.strokeStyle = grout; g.lineWidth = 4;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); }
    return c;
  }
  function concrete() {
    const [c, g] = canvas(512); g.fillStyle = '#9a9a96'; g.fillRect(0, 0, 512, 512);
    for (let k = 0; k < 9000; k++) { const v = 120 + rnd() * 60; g.fillStyle = `rgba(${v},${v},${v - 4},${0.15 + rnd() * 0.2})`; g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 3, 1 + rnd() * 3); }
    g.strokeStyle = 'rgba(60,60,60,.35)'; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
    return c;
  }
  function lawn() {
    const [c, g] = canvas(512);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#5f9a4c' : '#6aa957'; g.fillRect(i * 128, 0, 128, 512); }
    for (let k = 0; k < 16000; k++) { const x = rnd() * 512, y = rnd() * 512; g.strokeStyle = `rgba(${rnd() < 0.5 ? '30,70,25' : '150,200,110'},${0.12 + rnd() * 0.2})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd() * 2 - 1, y - 2 - rnd() * 4); g.stroke(); }
    return c;
  }

  function eachMesh(kind, fn) { scene.traverse((o) => { if (o.userData && o.userData.kind === kind) o.traverse((c) => { if (c.isMesh) fn(c, o); }); }); }

  const declutter = () => { const st = document.createElement('style'); st.textContent = '#sideStack, #roomTiles { display: none !important; }'; document.head.appendChild(st); };
  declutter();
  // the balls and value labels are left out of these pictures, so the look itself can be seen
  const quiet = () => scene.traverse((o) => { if (o.isSprite && o.material) { o.material.opacity = 0; o.material.transparent = true; } });
  quiet(); setInterval(quiet, 200);
  return {
    floors() {
      const F = { r1: [parquet('#b88a5c'), 0.5], r2: [tiles('#e9e4da', '#ddd6ca', '#bdb5a8'), 1 / 1.2], r3: [tiles('#e8eef2', '#dfe7ec', '#b8c3ca', 8), 1 / 1.2], r4: [parquet('#d2b48c'), 0.5], r5: [parquet('#8f6a48'), 0.5], gr1: [concrete(), 1 / 3] };
      eachMesh('room', (m, o) => {
        const f = F[o.userData.id]; if (!f) return;
        m.material = m.material.clone(); m.material.color.set('#ffffff'); m.material.map = tex(f[0], f[1]); m.material.roughness = 0.75; m.material.needsUpdate = true;
      });
      // the light layer over the floors (a shader in the room colour) would hide the texture: flat ones are left out for the picture
      const flat = () => scene.traverse((o) => { if (o.isMesh && o.material && (o.material.isShaderMaterial || (o.material.blending === 2 && o.material.transparent))) {
        o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; if (bb.max.y - bb.min.y < 0.05 || bb.max.z - bb.min.z < 0.05) o.visible = false; } });
      flat(); setInterval(flat, 200);
    },
    facade() {
      eachMesh('wall', (m) => [].concat(m.material).forEach((mat, i) => {
        if (!mat.color) return;
        const h = mat.color.getHexString();
        if (h === 'd9d4cc' || h === 'cfc9bf') { const nm = mat.clone(); nm.color.set('#f4f0ea'); if (Array.isArray(m.material)) m.material[i] = nm; else m.material = nm; }
      }));
      eachMesh('opening', (m) => [].concat(m.material).forEach((mat, i) => {
        if (!mat.color || mat.transparent) return;
        if (mat.color.getHexString() === 'f4f4f4') { const nm = mat.clone(); nm.color.set('#2e3338'); nm.roughness = 0.5; if (Array.isArray(m.material)) m.material[i] = nm; else m.material = nm; }
      }));
    },
    garden() {
      scene.traverse((o) => { if (!o.isMesh || !o.geometry) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; const s = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
        [].concat(o.material).forEach((m) => { if (s > 12 && m.isMeshBasicMaterial && m.color && m.color.g > m.color.r * 1.2 && m.color.g > m.color.b * 1.2) { m.color.set('#ffffff'); m.map = tex(lawn(), 1 / 6); m.needsUpdate = true; } }); });
    },
    glass() {
      const st = document.createElement('style');
      st.textContent = `
        #floorRail > *, #navBar .pill, #modeBar .pill, #findBtn, #compass svg { background: rgba(16,22,30,.5) !important; -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%);
          border: 1px solid rgba(255,255,255,.16) !important; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
        #floorRail > * { border-radius: 16px !important; }
        #modeBar .pill.active, #navBar .pill.active { background: rgba(63,169,245,.85) !important; }
        #toolbar { background: linear-gradient(180deg, rgba(22,30,40,.96), rgba(14,19,26,.96)) !important; }
        #toolbar button:not(.tBtn):not(.active):not(.primary) { background: rgba(255,255,255,.06) !important; border-color: rgba(255,255,255,.1) !important; border-radius: 10px !important; }`;
      document.head.appendChild(st);
    },
    async roomPills() {
      let cam = null; scene.onBeforeRender = (r, s, c) => { cam = c; }; fp.frame(); scene.onBeforeRender = () => {};
      const V = scene.position.constructor, stage = document.getElementById('stage'), r = fp.renderer.domElement.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const f = fp.layout.floors[1], y = fp.elev(1) + 1.6;
      const info = { r1: ['21,3°', '💡 5', true], r2: ['22,1°', '', false], r3: ['', '', false], r4: ['18,6°', '💡 3', false], r5: ['23,0°', '💡 1', true], gr1: ['', '', false] };
      const st = document.createElement('style');
      st.textContent = `.rpill { position:absolute; transform: translate(-50%,-100%); z-index:3; display:flex; align-items:center; gap:6px; padding:5px 10px 5px 8px; border-radius:999px; white-space:nowrap;
          background: rgba(16,22,30,.78); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border:1px solid rgba(255,255,255,.18); color:#f1f5f9; font:600 12.5px system-ui; box-shadow:0 6px 18px rgba(0,0,0,.35); pointer-events:none }
        .rpill i { font-style:normal; font-weight:400; color:#c7d2dd } .rpill .dot { width:8px; height:8px; border-radius:50%; background:#2ad0a0; box-shadow:0 0 8px #2ad0a0 }
        .rpill::after { content:''; position:absolute; left:50%; bottom:-6px; width:2px; height:6px; background:rgba(255,255,255,.4); transform:translateX(-50%) }`;
      document.head.appendChild(st);
      f.rooms.forEach((room) => {
        const xs = room.points.map((p) => p[0]), zs = room.points.map((p) => p[1]);
        const v = new V((Math.min(...xs) + Math.max(...xs)) / 2, y, (Math.min(...zs) + Math.max(...zs)) / 2).project(cam);
        const x = r.left - sr.left + ((v.x + 1) / 2) * r.width, yy = r.top - sr.top + ((1 - v.y) / 2) * r.height;
        const [temp, light, someone] = info[room.id] || ['', '', false];
        const d = document.createElement('div'); d.className = 'rpill'; d.style.left = `${x}px`; d.style.top = `${yy}px`;
        d.innerHTML = `${someone ? '<span class="dot"></span>' : ''}<b>${room.name}</b>${temp ? `<i>${temp}</i>` : ''}${light ? `<i>${light}</i>` : ''}`;
        stage.appendChild(d);
      });
    },
  };
})();
