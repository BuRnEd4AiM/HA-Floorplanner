/* Background image (template to trace): a floor can carry a picture (floor plan, photo of a sketch) that shows in the 2D editor under the walls.
 * The numbers (calibration by a measured distance, replacing a picture) are pure functions (tested); initBackground draws the panel and runs the modes. */

/** the natural size [w, h] of an image file */
export function imageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve([im.naturalWidth, im.naturalHeight]); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    im.src = url;
  });
}

/** the picture of a floor after an upload; replacing a picture keeps position, scale, opacity and turn. name: stored file, nw/nh: natural size in px */
export function newBg(keep, name, nw, nh) {
  return { img: name, x: keep?.x ?? 0, z: keep?.z ?? 0, w: keep?.w ?? 12, ar: +(nh / nw).toFixed(5), op: keep?.op ?? 0.5, rot: keep?.rot ?? 0 };
}

/** The user clicked two points a and b (plan metres) on the picture and said how long that really is (metres): the picture is scaled around a.
 *  Returns { w, x, z } for the picture, or null when the distance on the plan or the real one makes no sense (too small / too big). */
export function calibratedBg(bg, a, b, real) {
  const measured = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!bg || measured < 0.01 || !(real > 0.05 && real < 500)) return null;
  const k = real / measured;
  return { w: +(bg.w * k).toFixed(4), x: +(a[0] + (bg.x - a[0]) * k).toFixed(4), z: +(a[1] + (bg.z - a[1]) * k).toFixed(4) };
}

/** ctx: $, t, floor(), plan() (the 2D editor), snapshot(), changed(save?), setStatus(txt), imperial(), fromDisp(v), fmtLen(m), field(label, input), inp(...), lenInput(...), alert(txt) */
export function initBackground(ctx) {
  const { $, t } = ctx;
  let mode = null;                                       // null | 'move' | 'calib'
  function setMode(m) {
    mode = m;
    if (m && !ctx.plan()?.isVisible()) $('#view2d').click();      // the template only shows in the 2D editor
    ctx.plan()?.setBgMode(m);
    ctx.setStatus(m === 'calib' ? t('bg.calibA') : m === 'move' ? t('bg.moveHint') : '');
    render();
  }
  /** the editor reports the two clicked points */
  function calibrate(a, b) {
    const bg = ctx.floor()?.bg;
    if (!bg || Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.01) { setMode(null); return; }
    const raw = window.prompt(`${t('bg.askDist')} (${ctx.imperial() ? 'ft' : 'm'})`, '');
    const r = calibratedBg(bg, a, b, ctx.fromDisp(parseFloat(String(raw ?? '').replace(',', '.'))));
    if (!r) { setMode(null); return; }
    ctx.snapshot();
    Object.assign(bg, r);
    ctx.changed();
    setMode(null);
    ctx.setStatus(`${t('bg.scaleSet')}: ${ctx.fmtLen(bg.w)}`);
  }
  async function upload(file) {
    const f = ctx.floor();
    if (!f || !file) return;
    const [nw, nh] = await imageSize(file);
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('api/backgrounds', { method: 'POST', body: fd });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
    const { name } = await r.json();
    ctx.snapshot();
    f.bg = newBg(f.bg, name, nw, nh);
    ctx.changed();
    ctx.plan()?.fit();
    setMode('move');                                      // handles are visible right away: drag to move, corners to resize
  }
  function render() {
    const box = $('#bgBody');
    if (!box) return;
    box.innerHTML = '';
    const f = ctx.floor();
    if (!f) return;
    const bg = f.bg, plan = () => ctx.plan();
    const lab = document.createElement('label'); lab.className = 'uploadBtn';
    const span = document.createElement('span'); span.textContent = t(bg ? 'bg.replace' : 'bg.load');
    const file = document.createElement('input'); file.type = 'file'; file.hidden = true; file.id = 'bgFile'; file.accept = 'image/png,image/jpeg,image/webp';
    file.addEventListener('change', async () => {
      const fl = file.files[0]; file.value = '';
      try { await upload(fl); } catch (err) { ctx.alert(`${t('panel.uploadFailed')}: ${err.message}`); }
    });
    lab.append(span, file);
    box.append(lab);
    if (!bg) { const p = document.createElement('p'); p.className = 'sub'; p.textContent = t('bg.help'); box.append(p); return; }

    const op = document.createElement('input'); op.type = 'range'; op.min = 0.1; op.max = 1; op.step = 0.05; op.value = bg.op ?? 0.5; op.id = 'bgOpacity';
    let snapped = false;
    op.addEventListener('input', () => { if (!snapped) { ctx.snapshot(); snapped = true; } bg.op = +op.value; plan()?.render(); });
    op.addEventListener('change', () => { snapped = false; ctx.changed(false); });
    box.append(ctx.field(t('bg.opacity'), op));
    box.append(ctx.field(t('bg.width'), ctx.lenInput(() => bg.w, (v) => (bg.w = Math.max(0.5, v)), { min: 0.5 })));
    box.append(ctx.field('X', ctx.lenInput(() => bg.x, (v) => (bg.x = v), { min: -1000 })));
    box.append(ctx.field('Z', ctx.lenInput(() => bg.z, (v) => (bg.z = v), { min: -1000 })));
    box.append(ctx.field(t('bg.rot'), ctx.inp('number', bg.rot || 0, (v) => (bg.rot = Math.max(-180, Math.min(180, +v || 0))), { step: 0.5 })));

    const btns = document.createElement('div'); btns.className = 'stopTools';
    const mk = (id, label, on, active = false) => {
      const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label;
      b.classList.toggle('active', active); b.addEventListener('click', on); btns.append(b); return b;
    };
    mk('bgCalib', t('bg.calib'), () => setMode(mode === 'calib' ? null : 'calib'), mode === 'calib');
    mk('bgMove', t('bg.move'), () => setMode(mode === 'move' ? null : 'move'), mode === 'move');
    mk('bgHide', t(bg.hidden ? 'bg.show' : 'bg.hide'), () => { ctx.snapshot(); bg.hidden = !bg.hidden; ctx.changed(false); plan()?.render(); render(); });
    mk('bgRemove', t('bg.remove'), () => { ctx.snapshot(); delete f.bg; if (mode) { plan()?.setBgMode(null); mode = null; } ctx.setStatus(''); ctx.changed(false); plan()?.render(); render(); });
    box.append(btns);
  }
  return { setMode, calibrate, upload, render, mode: () => mode };
}
