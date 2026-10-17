// Only for the example pictures in this folder (injected into the demo with ?debug=1), not part of the add-on.
// Mock-up helpers injected into the demo page (only for example pictures, not part of the add-on)
window.mk = (() => {
  const fp = window.__fp, scene = fp.scene, st = fp.states(), L = fp.layout;
  const stage = document.getElementById('stage');
  const canvas = fp.renderer.domElement;

  function css(text) { const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); }
  css(`
    .mk-glass { background: rgba(16,22,30,.70); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
      border: 1px solid rgba(255,255,255,.12); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35); color: #eef3f8; }
    .mk-abs { position: absolute; z-index: 40; }
    .mk-chip { padding: 8px 14px; font-size: 14px; font-weight: 600; border-radius: 999px; }
  `);
  function el(html, style) { const d = document.createElement('div'); d.innerHTML = html; const n = d.firstElementChild; if (style) Object.assign(n.style, style); stage.appendChild(n); return n; }

  function lights() { const out = []; scene.traverse((o) => { if (o.isHemisphereLight || o.isDirectionalLight || o.isAmbientLight) out.push(o); }); return out; }
  function sky(bg) { scene.background = null; canvas.style.background = bg; }

  function findObj(id) { let hit = null; scene.traverse((o) => { if (!hit && o.userData && o.userData.id === id && o.children && o.children.length) hit = o; }); return hit; }
  function spriteKit() { let spr = null; scene.traverse((o) => { if (!spr && o.isSprite && o.material && o.material.map) spr = o; }); return spr; }

  function glow(rgb, size, strength) {
    const kit = spriteKit(); if (!kit) return null;
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const [r, gg, b] = rgb;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, `rgba(255,255,255,${strength})`);
    grad.addColorStop(0.12, `rgba(${r},${gg},${b},${strength * 0.9})`);
    grad.addColorStop(0.45, `rgba(${r},${gg},${b},${strength * 0.28})`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    const tex = new kit.material.map.constructor(c); tex.needsUpdate = true; if (kit.material.map.colorSpace) tex.colorSpace = kit.material.map.colorSpace;
    const m = new kit.material.constructor({ map: tex, transparent: true, depthWrite: false, depthTest: false, blending: 2 });
    const s = new kit.constructor(m); s.scale.set(size, size, 1); s.renderOrder = 999; return s;
  }

  function lampGlows(scaleK = 1) {
    const f = L.floors[1];
    f.devices.filter((d) => (d.entity || '').startsWith('light.') && st[d.entity]?.state === 'on').forEach((d) => {
      const o = findObj(d.id); if (!o) return;
      const p = o.getWorldPosition(new o.position.constructor());
      const rgb = st[d.entity].rgb || [255, 196, 120];
      const big = d.type === 'light' || d.type === 'lamp';
      const s1 = glow(rgb, (big ? 4.2 : 2.6) * scaleK, 0.85); if (s1) { s1.position.copy(p); scene.add(s1); }
      const s2 = glow([255, 200, 140], (big ? 1.1 : 0.7) * scaleK, 1); if (s2) { s2.position.copy(p); scene.add(s2); }
    });
  }

  function dimGround(r, g, b) {   // the lawn and the earth are not lit by the lights (MeshBasicMaterial): tint them by hand
    scene.traverse((o) => { if (!o.isMesh || !o.geometry) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; const s = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * Math.max(o.scale.x, o.scale.z);
      if (s > 12) [].concat(o.material).forEach((m) => { if (m.isMeshBasicMaterial && m.color) { m.color.r *= r; m.color.g *= g; m.color.b *= b; } }); });
  }

  function stars(w, h, n) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) { const x = rnd() * w, y = rnd() * h * 0.75, r = rnd() < 0.08 ? 1.6 : 0.8 + rnd() * 0.6; g.globalAlpha = 0.35 + rnd() * 0.65 * (1 - y / h); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    return c.toDataURL();
  }

  return {
    css, el, lights, sky, lampGlows, stars, st, L, stage, canvas,
    evening() {
      sky('radial-gradient(ellipse 40% 30% at 78% 62%, rgba(255,214,140,.9), rgba(255,170,90,0) 70%), linear-gradient(to top, #ffd08a 0%, #f79a5e 28%, #c8607a 50%, #6b4f9a 72%, #26285a 100%)');
      lights().forEach((l) => { if (l.isHemisphereLight) { l.color.set(0xffd9b0); l.intensity *= 0.85; } if (l.isDirectionalLight) { l.color.set(0xffa860); l.intensity *= 0.9; } });
      lampGlows(0.8);
      dimGround(0.95, 0.82, 0.7);
      el(`<div class="mk-glass mk-abs mk-chip">🌇 Abend · 18:45 · Sonnenuntergang 18:52</div>`, { right: '16px', top: '64px' });
    },
    night() {
      const r = stage.getBoundingClientRect();
      sky(`url(${stars(Math.round(r.width), Math.round(r.height), 260)}), linear-gradient(to top, #1d2a5a 0%, #0f1838 35%, #070b1e 70%, #03050f 100%)`);
      canvas.style.backgroundSize = '100% 100%';
      lights().forEach((l) => { if (l.isHemisphereLight) { l.color.set(0x8fa2ff); l.intensity *= 0.22; } if (l.isDirectionalLight) { l.color.set(0x9fb2ff); l.intensity *= 0.12; } });
      lampGlows(1);
      dimGround(0.2, 0.24, 0.38);
      el(`<div class="mk-glass mk-abs mk-chip">🌙 Nacht · 22:30 · 6 Lampen an</div>`, { right: '16px', top: '64px' });
    },
    rain() {
      sky('radial-gradient(ellipse 30% 14% at 20% 8%, rgba(220,226,232,.55), rgba(220,226,232,0) 70%), radial-gradient(ellipse 36% 16% at 62% 4%, rgba(210,216,224,.6), rgba(210,216,224,0) 70%), radial-gradient(ellipse 26% 12% at 88% 14%, rgba(200,208,216,.5), rgba(200,208,216,0) 70%), linear-gradient(to top, #a3acb6 0%, #7b8692 45%, #4e5865 100%)');
      lights().forEach((l) => { if (l.isHemisphereLight) { l.color.set(0xcfd8e6); l.intensity *= 0.75; } if (l.isDirectionalLight) { l.intensity *= 0.45; } });
      dimGround(0.72, 0.76, 0.8);
      const r = stage.getBoundingClientRect();
      const c = document.createElement('canvas'); c.width = r.width; c.height = r.height;
      Object.assign(c.style, { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 20 });
      const g = c.getContext('2d'); let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 900; i++) { const x = rnd() * r.width, y = rnd() * r.height, len = 12 + rnd() * 16; g.strokeStyle = `rgba(215,228,245,${0.18 + rnd() * 0.3})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * 0.18, y + len); g.stroke(); }
      stage.appendChild(c);
      el(`<div class="mk-glass mk-abs mk-chip">🌧 Regen · 11 °C · Wind 24 km/h</div>`, { right: '16px', top: '64px' });
      el(`<div class="mk-abs mk-chip" style="background:#e5484d;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.3)">⚠ Regen: Fenster Wohnzimmer ist offen</div>`, { right: '16px', top: '110px' });
    },
    energy(compact) {
      const pill = document.getElementById('energyPill'); if (pill && !compact) pill.style.display = 'none';
      const dots = (x1, y1, x2, y2, col, n) => { let s = ''; for (let i = 1; i < n; i++) { const t = i / n; s += `<circle cx="${x1 + (x2 - x1) * t}" cy="${y1 + (y2 - y1) * t}" r="3.2" fill="${col}"/>`; } return s; };
      const node = (x, y, col, icon, val, sub) => `<circle cx="${x}" cy="${y}" r="34" fill="rgba(10,14,20,.6)" stroke="${col}" stroke-width="3"/><text x="${x}" y="${y - 8}" text-anchor="middle" font-size="18">${icon}</text><text x="${x}" y="${y + 13}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${val}</text>${sub ? `<text x="${x}" y="${y + 52}" text-anchor="middle" font-size="11.5" fill="#aeb9c6">${sub}</text>` : ''}`;
      const svg = `<svg width="300" height="270" viewBox="0 0 300 270" font-family="system-ui, sans-serif">
        <path d="M150 74 L150 196" stroke="#ff9800" stroke-opacity=".35" stroke-width="3"/>${dots(150, 74, 150, 196, '#ff9800', 6)}
        <path d="M172 60 Q 250 70 250 104" fill="none" stroke="#ff9800" stroke-opacity=".35" stroke-width="3"/>
        <circle cx="214" cy="68" r="3.2" fill="#ff9800"/><circle cx="238" cy="82" r="3.2" fill="#ff9800"/><circle cx="196" cy="62" r="3.2" fill="#ff9800"/>
        <path d="M84 138 L216 138" stroke="#488fc2" stroke-opacity=".35" stroke-width="3"/>${dots(84, 138, 216, 138, '#488fc2', 7)}
        ${node(150, 40, '#ff9800', '☀️', '3,20 kW', '')}
        ${node(50, 138, '#488fc2', '⚡', '450 W', 'Bezug vom Netz')}
        ${node(250, 138, '#4caf50', '🏠', '3,05 kW', 'Haus braucht')}
        ${node(150, 210, '#f06292', '🔋', '82 %', 'lädt 600 W')}
      </svg>`;
      return el(`<div class="mk-glass mk-abs" style="padding:12px 14px 6px"><div style="font-size:13px;font-weight:700;letter-spacing:.04em;color:#aeb9c6;margin:0 0 4px 4px">STROM JETZT</div>${svg}</div>`, { right: '16px', top: '64px' });
    },
    roomTiles(phone) {
      const f = L.floors[1];
      const inside = (pts, x, z) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, zi] = pts[i], [xj, zj] = pts[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
      const slug = { Wohnzimmer: 'wohnzimmer', 'Küche': 'kueche', Bad: 'bad', Schlafzimmer: 'schlafzimmer', 'Büro': 'buero', Garage: 'garage' };
      const cards = f.rooms.map((r) => {
        const devs = f.devices.filter((d) => inside(r.points, d.x, d.z));
        const on = devs.filter((d) => (d.entity || '').startsWith('light.') && st[d.entity]?.state === 'on');
        const s = slug[r.name] || r.area;
        const temp = st[`sensor.${s}_temp`]?.state;
        const win = st[`binary_sensor.fenster_${s}`]?.state === 'on';
        const pres = st[`binary_sensor.${s}_bewegung`]?.state === 'on' || st[`binary_sensor.${s}_praesenz`]?.state === 'on';
        const col = on[0] && st[on[0].entity].rgb ? '#' + st[on[0].entity].rgb.map((v) => v.toString(16).padStart(2, '0')).join('') : '#ffcf70';
        const lit = on.length > 0;
        return `<div class="mk-glass" style="flex:0 0 auto;width:${phone ? 136 : 158}px;padding:${phone ? '9px 10px' : '11px 13px'};border-radius:14px;${lit ? `border-color:${col};box-shadow:0 0 0 1px ${col}55, 0 8px 26px ${col}33` : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:${phone ? 12.5 : 14}px;font-weight:700"><span>${r.name}</span><span>${pres ? '👤' : ''}</span></div>
          <div style="font-size:${phone ? 22 : 26}px;font-weight:300;margin:2px 0 4px">${temp ? (+temp).toFixed(1).replace('.', ',') + '°' : '–'}</div>
          <div style="display:flex;gap:6px;align-items:center;white-space:nowrap;font-size:${phone ? 11 : 12}px;color:#c5cfda">
            <span style="padding:2px 7px;border-radius:999px;background:${lit ? col + '33' : 'rgba(255,255,255,.08)'};color:${lit ? '#fff' : '#9aa6b2'}">💡 ${on.length ? on.length + ' an' : 'aus'}</span>
            ${win ? '<span style="padding:2px 7px;border-radius:999px;background:#e5484d33;color:#ffb4b4">🪟 offen</span>' : ''}
          </div></div>`;
      }).join('');
      const strip = el(`<div class="mk-abs" style="display:flex;gap:10px;${phone ? 'left:12px;right:0;overflow:hidden' : 'left:50%;transform:translateX(-50%)'}">${cards}</div>`, phone ? { bottom: '178px' } : { bottom: '78px' });
      return strip;
    },
    scenes(phone) {
      const items = [['🎬', 'Kino'], ['🍽️', 'Essen'], ['📖', 'Lesen'], ['🌙', 'Gute Nacht'], ['☀️', 'Guten Morgen'], ['⏻', 'Alles aus']];
      const html = items.map(([i, t], k) => `<button class="mk-glass" style="width:${phone ? 74 : 100}px;height:${phone ? 66 : 76}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:600 ${phone ? 11.5 : 13}px system-ui;color:#eef3f8;cursor:pointer;${k === 0 ? 'border-color:#7c5cff;box-shadow:0 0 0 1px #7c5cff88, 0 8px 26px #7c5cff44;' : ''}${k === items.length - 1 ? 'color:#ffb4b4;' : ''}"><span style="font-size:${phone ? 22 : 26}px;line-height:1">${i}</span>${t}</button>`).join('');
      return el(`<div class="mk-abs" style="display:flex;gap:10px;${phone ? 'left:12px;right:0;overflow:hidden' : 'left:50%;transform:translateX(-50%)'}">${html}</div>`, phone ? { bottom: '178px' } : { bottom: '78px' });
    },
  };
})();
