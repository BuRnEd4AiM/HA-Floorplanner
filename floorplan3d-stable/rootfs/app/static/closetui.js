/* Cabinet builder: the editor window (🗄 Schrank-Editor) and the cabinet's part of the properties panel. The editor works on a copy: the
 * front (tap a column to set it up), a cut through the chosen column from the side or a 3D view to turn, and on the right the sizes, the
 * chosen column, the roof slopes ("📐 An die Dachschräge anpassen" fits it under the roof over its place) and the look. "Übernehmen" puts the
 * copy on the device. The maths is in closet.js, the drawings in closetview.js, the 3D model in closet3d.js. */
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { cleanCloset, closetPreset, closetW, setWidth, evenCols, fitToRoof, hingeOf, PRESET_KEYS, FILLS, FRONTS, SIDES, HANDLES, METALS, DOORS, COLORS, LIM, MAX_COLS, MAX_SLOPES } from './closet.js';
import { frontView, sideView } from './closetview.js';
import { closetModel } from './closet3d.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/** ctx: t, snapshot(), changed(), renderProps(), imperial(), setStatus(txt), roof(dev) ({ planes, baseY }: the roof slopes over the device's
 *  floor and the height of its bottom, null without any) */
export function initClosetUi(ctx) {
  const { t } = ctx;
  const metric = () => !ctx.imperial();
  const unit = () => (metric() ? 'cm' : 'in');
  const disp = (m) => (metric() ? Math.round(m * 1000) / 10 : Math.round((m / 0.0254) * 10) / 10);
  const fromDisp = (v) => (metric() ? v / 100 : v * 0.0254);
  const len = (m) => (metric() ? `${Math.round(m * 100)} cm` : `${Math.round(m / 0.0254)}″`);
  const sizeText = (c) => `${disp(closetW(c))} × ${disp(c.h)} × ${disp(c.d)} ${unit()}`;

  /** fit the cabinet c of device `dev` under the roof: { cab, text } (cab null when nothing changes) */
  function fit(c, dev) {
    const roof = ctx.roof?.(dev);
    const r = roof ? fitToRoof(c, { x: dev.x, z: dev.z, rot: dev.rot || 0, mirror: !!dev.mirror }, roof.planes, roof.baseY) : null;
    if (!r) return { cab: null, text: t('closet.fitNone') };
    if (r.error) return { cab: null, text: t('closet.fitLow') };
    if (!r.slopes && !r.lowered) return { cab: r.cab, text: t('closet.fitFree') };
    const parts = r.cab.slopes.map((s) => `${t(`closet.side.${s.side}`)} ${len(s.low)} · ${s.deg}°`);
    return { cab: r.cab, text: `${t('closet.fitDone')} ${[...parts, r.lowered ? `${t('closet.height')} ${len(r.cab.h)}` : ''].filter(Boolean).join(', ')}${r.tight ? ` ${t('closet.fitTight')}` : ''}` };
  }

  /** the cabinet's part of the properties panel: a small front view (tap: the editor), its size and the two buttons */
  function props(body, it) {
    const c = cleanCloset(it.cab);
    const head = document.createElement('h4'); head.id = 'closetHead'; head.textContent = t('closet.title'); body.append(head);
    const pic = document.createElement('div'); pic.className = 'closetThumb'; pic.id = 'closetThumb'; pic.title = t('closet.edit');
    pic.innerHTML = frontView(c, { doors: true, len, w: 320, h: 240 });
    pic.addEventListener('click', () => open(it));
    const info = document.createElement('p'); info.className = 'sub'; info.id = 'closetInfo';
    info.textContent = `${sizeText(c)} · ${t('closet.cols', { n: c.cols.length })}${c.slopes.length ? ` · ${c.slopes.map((s) => t(`closet.slopeAt.${s.side}`)).join(', ')}` : ''}`;
    const edit = document.createElement('button'); edit.type = 'button'; edit.id = 'closetEdit'; edit.className = 'primary'; edit.textContent = `✎ ${t('closet.edit')}`;
    edit.addEventListener('click', () => { if (it.locked) ctx.setStatus(t('prop.lockedHint')); else open(it); });
    const fb = document.createElement('button'); fb.type = 'button'; fb.id = 'closetFit'; fb.textContent = `📐 ${t('closet.fit')}`;
    fb.addEventListener('click', () => {
      const r = fit(c, it);
      if (r.cab && JSON.stringify(r.cab) !== JSON.stringify(c)) { ctx.snapshot(); it.cab = r.cab; ctx.changed(); ctx.renderProps(); }
      ctx.setStatus(r.text);
    });
    body.append(pic, info, edit, fb);
  }

  /** the editor window for device `it` */
  function open(it) {
    let cab = cleanCloset(it.cab), sel = 0, doors = false, view3d = false, msg = '', preview = null;
    const hist = [];
    const dlg = document.createElement('dialog');
    dlg.id = 'closetDialog';
    dlg.innerHTML = `<form method="dialog" novalidate>
      <div class="dlgHead"><h2>🗄 ${esc(t('closet.title'))}</h2><button type="submit" value="cancel" class="dlgClose" formnovalidate aria-label="${esc(t('close'))}">✕</button></div>
      <div class="closetBody">
        <div class="closetViews">
          <div class="closetBar">
            <button type="button" id="closetDoors">🚪 ${esc(t('closet.doors'))}</button>
            <button type="button" id="closet3d">🧊 3D</button>
            <span class="grow"></span>
            <button type="button" id="closetUndo" title="${esc(t('closet.undo'))}">↶</button>
          </div>
          <div class="closetDraw" id="closetDraw"></div>
          <p class="hint" id="closetHint"></p>
        </div>
        <div class="closetForm" id="closetForm"></div>
      </div>
      <div class="closetFoot"><span id="closetSize"></span><span class="grow"></span>
        <button type="submit" value="cancel" formnovalidate>${esc(t('cancel'))}</button>
        <button type="button" id="closetOk" class="primary">${esc(t('closet.apply'))}</button></div>
    </form>`;
    document.body.append(dlg);
    const $ = (s) => dlg.querySelector(s), draw = $('#closetDraw'), form = $('#closetForm');
    const change = (fn) => { hist.push(JSON.stringify(cab)); if (hist.length > 80) hist.shift(); fn(); cab = cleanCloset(cab); sel = Math.min(sel, cab.cols.length - 1); msg = ''; render(); };

    function renderViews(look = cab) {                                  // look: the cabinet as drawn (a colour still being picked)
      $('#closetDoors').classList.toggle('on', doors);
      $('#closet3d').classList.toggle('on', view3d);
      $('#closetUndo').disabled = !hist.length;
      $('#closetSize').textContent = sizeText(look);
      $('#closetHint').textContent = t(view3d ? 'closet.hint3d' : 'closet.hint');
      if (view3d) {
        if (!preview) { draw.innerHTML = ''; preview = makePreview(draw); }
        preview.show(look);
        return;
      }
      if (preview) { preview.dispose(); preview = null; }
      draw.innerHTML = `<div class="closetFrontBox">${frontView(look, { sel, doors, len })}</div><div class="closetSideBox">${sideView(look, { sel, len })}</div>`;
    }
    const lenRow = (label, k, m, min, max, extra = '') => `<label class="crow"><span>${esc(label)}</span><input type="number" data-k="${k}" value="${disp(m)}" min="${disp(min)}" max="${disp(max)}" step="${metric() ? 1 : 0.5}"${extra}><em>${unit()}</em></label>`;
    const numRow = (label, k, v, min, max, u = '', extra = '') => `<label class="crow"><span>${esc(label)}</span><input type="number" data-k="${k}" value="${v}" min="${min}" max="${max}" step="1"${extra}><em>${u}</em></label>`;
    const selRow = (label, k, list, v, key, extra = '') => `<label class="crow"><span>${esc(label)}</span><select data-k="${k}"${extra}>${list.map((x) => `<option value="${x}"${x === v ? ' selected' : ''}>${esc(t(`${key}.${x}`))}</option>`).join('')}</select></label>`;
    const swatches = (k) => `<div class="closetSwatches">${Object.entries(COLORS).map(([n, c]) => `<button type="button" data-swatch="${k}" data-c="${c}" title="${esc(t(`closet.c.${n}`))}" style="background:${c}"${cab[k] === c ? ' class="on"' : ''}></button>`).join('')}<input type="color" data-k="${k}" value="${cab[k]}" title="${esc(t('closet.ownColor'))}"></div>`;

    function renderForm() {
      const q = cab.cols[sel], n = cab.cols.length;
      let h = `<label class="crow"><span>${esc(t('closet.preset'))}</span><select data-k="preset"><option value="" selected>${esc(t('closet.presetPick'))}</option>${PRESET_KEYS.map((k) => `<option value="${k}">${esc(t(`closet.p.${k}`))}</option>`).join('')}</select></label>`;
      h += `<h3>${esc(t('closet.size'))}</h3>`;
      h += lenRow(t('closet.width'), 'w', closetW(cab), LIM.w[0] * n, LIM.w[1] * n) + lenRow(t('closet.height'), 'h', cab.h, LIM.h[0], LIM.h[1]) + lenRow(t('closet.depth'), 'd', cab.d, LIM.d[0], LIM.d[1]) + lenRow(t('closet.plinth'), 'plinth', cab.plinth, 0, LIM.plinth[1]);
      h += `<button type="button" data-act="even">⇔ ${esc(t('closet.even'))}</button>`;
      h += `<h3 id="closetColHead">${esc(t('closet.col', { i: sel + 1, n }))}</h3>`;
      h += lenRow(t('closet.colWidth'), 'col.w', q.w, LIM.w[0], LIM.w[1]);
      h += selRow(t('closet.fill'), 'col.fill', FILLS, q.fill, 'closet.f');
      if (q.fill === 'shelves') h += numRow(t('closet.shelves'), 'col.n', q.n, LIM.n[0], LIM.n[1]);
      if (q.fill === 'drawers') h += numRow(t('closet.drawers'), 'col.n', q.n, LIM.drawers[0], LIM.drawers[1]);
      else {
        h += numRow(t('closet.lowDrawers'), 'col.low', q.low || 0, LIM.lowDrawers[0], LIM.lowDrawers[1]);
        h += selRow(t('closet.front'), 'col.front', FRONTS, q.front, 'closet.fr');
        if (q.front !== 'open' && cab.doors === 'hinged') h += selRow(t('closet.hinge'), 'col.hinge', ['l', 'r'], hingeOf(cab, sel), 'closet.h');
      }
      h += `<div class="closetBtns"><button type="button" data-act="left" title="${esc(t('closet.toLeft'))}"${sel ? '' : ' disabled'}>◀</button><button type="button" data-act="right" title="${esc(t('closet.toRight'))}"${sel < n - 1 ? '' : ' disabled'}>▶</button>`
        + `<button type="button" data-act="dup" title="${esc(t('closet.dup'))}"${n < MAX_COLS ? '' : ' disabled'}>⧉</button><button type="button" data-act="del" title="${esc(t('closet.del'))}"${n > 1 ? '' : ' disabled'}>🗑</button>`
        + `<button type="button" data-act="add" id="closetAdd"${n < MAX_COLS ? '' : ' disabled'}>+ ${esc(t('closet.add'))}</button></div>`;
      h += `<h3>${esc(t('closet.slopes'))}</h3><p class="hint">${esc(t('closet.slopeHelp'))}</p>`;
      if (ctx.roof) h += `<button type="button" data-act="fit" id="closetFitDlg" class="primary">📐 ${esc(t('closet.fit'))}</button>`;
      if (msg) h += `<p class="closetMsg" id="closetMsg">${esc(msg)}</p>`;
      cab.slopes.forEach((s, i) => {
        h += `<div class="closetSlope" data-i="${i}">${selRow(t('closet.lowSide'), `slope.side`, SIDES, s.side, 'closet.side', ` data-i="${i}"`)}`
          + lenRow(t('closet.lowHeight'), 'slope.low', s.low, LIM.low[0], cab.h, ` data-i="${i}"`) + numRow(t('closet.pitch'), 'slope.deg', s.deg, LIM.deg[0], LIM.deg[1], '°', ` data-i="${i}"`)
          + `<button type="button" data-act="slopeDel" data-i="${i}">🗑 ${esc(t('closet.slopeDel'))}</button></div>`;
      });
      if (cab.slopes.length < MAX_SLOPES) h += `<button type="button" data-act="slopeAdd" id="closetSlopeAdd">+ ${esc(t('closet.slopeAdd'))}</button>`;
      h += `<h3>${esc(t('closet.look'))}</h3>`;
      h += `<div class="crow stack"><span>${esc(t('closet.body'))}</span>${swatches('body')}</div><div class="crow stack"><span>${esc(t('closet.frontColor'))}</span>${swatches('front')}</div>`;
      h += selRow(t('closet.doorType'), 'doors', DOORS, cab.doors, 'closet.d') + selRow(t('closet.handle'), 'handle', HANDLES, cab.handle, 'closet.g');
      if (cab.handle !== 'none') h += selRow(t('closet.metal'), 'metal', METALS, cab.metal, 'closet.m');
      h += `<label class="crow check"><input type="checkbox" data-k="led"${cab.led ? ' checked' : ''}><span>${esc(t('closet.led'))}</span></label>`;
      form.innerHTML = h;
    }
    function render() { renderViews(); renderForm(); }

    form.addEventListener('change', (e) => {
      const el = e.target, k = el.dataset.k, i = +el.dataset.i || 0, v = el.value, m = fromDisp(+v || 0);
      if (!k) return;
      if (k === 'preset') { if (v) change(() => { cab = { ...closetPreset(v), body: cab.body, front: cab.front, handle: cab.handle, metal: cab.metal, led: cab.led }; sel = 0; }); return; }
      change(() => {
        const q = cab.cols[sel];
        if (k === 'w') cab = setWidth(cab, m);
        else if (k === 'h' || k === 'd' || k === 'plinth') cab[k] = m;
        else if (k === 'col.w') q.w = m;
        else if (k === 'col.fill') { q.fill = v; if (v === 'drawers') q.n = 4; if (v === 'shelves') q.n = 4; }
        else if (k === 'col.n' || k === 'col.low') q[k.slice(4)] = +v;
        else if (k === 'col.front') q.front = v;
        else if (k === 'col.hinge') q.hinge = v;
        else if (k === 'slope.side') cab.slopes[i].side = v;
        else if (k === 'slope.low') cab.slopes[i].low = m;
        else if (k === 'slope.deg') cab.slopes[i].deg = +v;
        else if (k === 'body' || k === 'front') cab[k] = v;
        else if (k === 'led') cab.led = el.checked;
        else cab[k] = v;                                                   // doors, handle, metal
      });
    });
    form.addEventListener('input', (e) => {                              // a colour being picked: only the drawing follows
      const k = e.target.dataset.k;
      if (e.target.type === 'color' && (k === 'body' || k === 'front')) renderViews({ ...cab, [k]: e.target.value });
    });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.swatch) { change(() => { cab[b.dataset.swatch] = b.dataset.c; }); return; }
      const act = b.dataset.act, i = +b.dataset.i || 0;
      if (!act) return;
      if (act === 'fit') {
        const r = fit(cab, it);
        if (r.cab && JSON.stringify(r.cab) !== JSON.stringify(cab)) change(() => { cab = r.cab; });
        msg = r.text; renderForm();
        return;
      }
      change(() => {
        const cols = cab.cols;
        if (act === 'even') cab = evenCols(cab);
        else if (act === 'left') { [cols[sel - 1], cols[sel]] = [cols[sel], cols[sel - 1]]; sel -= 1; }
        else if (act === 'right') { [cols[sel + 1], cols[sel]] = [cols[sel], cols[sel + 1]]; sel += 1; }
        else if (act === 'dup') { cols.splice(sel + 1, 0, { ...cols[sel] }); sel += 1; }
        else if (act === 'del') cols.splice(sel, 1);
        else if (act === 'add') { cols.splice(sel + 1, 0, { w: 0.5, fill: 'shelves', n: 4 }); sel += 1; }
        else if (act === 'slopeAdd') { const side = ['left', 'back', 'right', 'front'].find((s) => !cab.slopes.some((q) => q.side === s)); cab.slopes.push({ side, low: Math.min(1, cab.h), deg: 35 }); }
        else if (act === 'slopeDel') cab.slopes.splice(i, 1);
      });
    });
    draw.addEventListener('click', (e) => {
      const hit = e.target.closest('[data-col]');
      if (hit) { sel = +hit.dataset.col; msg = ''; render(); }
    });
    $('#closetDoors').addEventListener('click', () => { doors = !doors; if (view3d) view3d = false; renderViews(); });
    $('#closet3d').addEventListener('click', () => { view3d = !view3d; renderViews(); });
    $('#closetUndo').addEventListener('click', () => { if (hist.length) { cab = cleanCloset(JSON.parse(hist.pop())); sel = Math.min(sel, cab.cols.length - 1); render(); } });
    dlg.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.target.tagName !== 'INPUT') { e.preventDefault(); $('#closetUndo').click(); } });
    $('#closetOk').addEventListener('click', () => {
      if (JSON.stringify(cab) !== JSON.stringify(cleanCloset(it.cab))) { ctx.snapshot(); it.cab = cab; ctx.changed(); ctx.renderProps(); }
      dlg.close();
    });
    dlg.addEventListener('close', () => { preview?.dispose(); dlg.remove(); });
    dlg.showModal();
    render();
  }
  return { props, open };
}

/** the turnable 3D view in the editor: the cabinet on a round floor, drawn again when it is turned or changed */
function makePreview(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.domElement.className = 'closet3dCanvas';
  host.append(renderer.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.05, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4450, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(2.5, 4, 3.5); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: 0x8a96a3, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.001; scene.add(floor);
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = false; controls.maxPolarAngle = Math.PI * 0.49;
  let model = null, framed = false;
  const drop = () => { if (!model) return; scene.remove(model); model.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); model = null; };
  function frame() {
    const w = host.clientWidth || 520, h = host.clientHeight || 380;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    renderer.render(scene, cam);
  }
  controls.addEventListener('change', frame);
  return {
    show(cab) {
      drop();
      model = closetModel(new THREE.Group(), { cab });
      scene.add(model);
      if (!framed) {
        const W = closetW(cab), dist = Math.max(W, cab.h) * 1.7 + cab.d;
        cam.position.set(dist * 0.45, cab.h * 0.7 + 0.3, dist);
        controls.target.set(0, cab.h * 0.45, 0); controls.update();
        framed = true;
      }
      frame();
    },
    dispose() { drop(); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
