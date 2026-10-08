/* Performance display: a small box at the top right of the 3D picture with the frames per second and, when wanted, all other values that tell how
 * hard the device works (time per frame, draw calls, triangles, resolution, low-power mode, idle, graphics chip, memory). Chosen in the
 * "View" drop-down ("⏱ Performance: off / FPS / all values"), kept per device (browser), works on phone, tablet and desktop; on a wall
 * tablet without the menu ?fps=1 or ?fps=all in the address does the same. The box lets every touch through.
 * The counting and the lines of text are pure (unit test: tests/perfhud.test.mjs); the texts live here so no language file is touched. */

export const MODES = ['off', 'fps', 'all'];
export const STORE_KEY = 'fp3d.perfHud';
/** the frames of the last WINDOW ms are counted; the box is written again every REFRESH ms (not every frame: that would cost itself) */
export const WINDOW = 1000;
export const REFRESH = 500;

const TEXT = {
  de: { btn: 'Leistung', off: 'aus', fps: 'FPS', all: 'alle Werte', tip: 'Bilder pro Sekunde und weitere Leistungswerte oben rechts im 3D-Bild einblenden (nur auf diesem Gerät)',
    frame: 'Bild', work: 'Arbeit', calls: 'Zeichenaufrufe', tris: 'Dreiecke', geo: 'Geometrien', tex: 'Texturen', prog: 'Shader',
    res: 'Auflösung', mode: 'Modus', low: 'Sparmodus', normal: 'Normal', idle: 'Leerlauf', busy: 'aktiv', gpu: 'Grafik', mem: 'Speicher', screen: 'Bildschirm' },
  en: { btn: 'Performance', off: 'off', fps: 'FPS', all: 'all values', tip: 'Show the frames per second and more performance values at the top right of the 3D picture (on this device only)',
    frame: 'Frame', work: 'Work', calls: 'Draw calls', tris: 'Triangles', geo: 'Geometries', tex: 'Textures', prog: 'Shaders',
    res: 'Resolution', mode: 'Mode', low: 'low power', normal: 'normal', idle: 'idle', busy: 'busy', gpu: 'GPU', mem: 'Memory', screen: 'Screen' },
  fr: { btn: 'Performances', off: 'non', fps: 'FPS', all: 'toutes les valeurs', tip: 'Afficher les images par seconde et d’autres valeurs en haut à droite (sur cet appareil)' },
  es: { btn: 'Rendimiento', off: 'no', fps: 'FPS', all: 'todos los valores', tip: 'Mostrar las imágenes por segundo y otros valores arriba a la derecha (solo en este dispositivo)' },
  it: { btn: 'Prestazioni', off: 'no', fps: 'FPS', all: 'tutti i valori', tip: 'Mostra i fotogrammi al secondo e altri valori in alto a destra (solo su questo dispositivo)' },
  nl: { btn: 'Prestaties', off: 'uit', fps: 'FPS', all: 'alle waarden', tip: 'Beelden per seconde en meer prestatiewaarden rechtsboven tonen (alleen op dit apparaat)' },
  pl: { btn: 'Wydajność', off: 'wył.', fps: 'FPS', all: 'wszystkie wartości', tip: 'Pokaż klatki na sekundę i inne wartości w prawym górnym rogu (tylko na tym urządzeniu)' },
};
/** the text for key in language l (English, then German when missing) */
export const tx = (l, key) => TEXT[l]?.[key] ?? TEXT.en[key] ?? TEXT.de[key] ?? key;

/** the next mode after m (off → FPS → all values → off) */
export const nextMode = (m) => MODES[(MODES.indexOf(m) + 1) % MODES.length];
/** the mode to start with: ?fps=1 / ?fps=all in the address wins, then what this browser remembers, else off */
export function startMode(param, stored) {
  if (param === 'all') return 'all';
  if (param === '0' || param === 'off') return 'off';
  if (param != null) return 'fps';
  return MODES.includes(stored) ? stored : 'off';
}

/** frames per second and frame times from the times the frames were drawn (ms, oldest first) and the work of each frame (ms):
 *  { fps, avg (ms between two frames), max (longest gap), work (mean work per frame), workMax } over the last WINDOW ms before now */
export function frameStats(times, works, now) {
  let i = 0;
  while (i < times.length && now - times[i] > WINDOW) i++;
  const tt = times.slice(i), ww = works.slice(i);
  const gaps = tt.slice(1).map((x, k) => x - tt[k]);
  const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  return {
    fps: tt.length,
    avg, max: gaps.length ? Math.max(...gaps) : 0,
    work: ww.length ? ww.reduce((a, b) => a + b, 0) / ww.length : 0,
    workMax: ww.length ? Math.max(...ww) : 0,
  };
}

const num = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e4 ? `${Math.round(n / 1e3)} k` : String(Math.round(n)));
const ms = (x) => `${x.toFixed(1)} ms`;

/** the lines of the box. s: frameStats, info: { calls, tris, geo, tex, prog, w, h, ratio, low, idle, gpu, mem (MB or null), screen } */
export function hudLines(mode, s, info, l) {
  if (mode === 'off') return [];
  const first = `${s.fps} FPS`;
  if (mode === 'fps') return [info.idle ? `${first} 💤` : first];     // asleep: few frames on purpose (frameloop.js), not slow
  const T = (k) => tx(l, k);
  const lines = [
    `${first} · ${info.low ? T('low') : T('normal')} · ${info.idle ? T('idle') : T('busy')}`,
    `${T('frame')}: ⌀ ${ms(s.avg)} / max ${ms(s.max)}`,
    `${T('work')}: ⌀ ${ms(s.work)} / max ${ms(s.workMax)}`,
    `${T('calls')}: ${num(info.calls)} · ${T('tris')}: ${num(info.tris)}`,
    `${T('geo')}: ${info.geo} · ${T('tex')}: ${info.tex} · ${T('prog')}: ${info.prog}`,
    `${T('res')}: ${info.w}×${info.h} @${info.ratio.toFixed(2)}`,
    `${T('screen')}: ${info.screen}`,
  ];
  if (info.gpu) lines.push(`${T('gpu')}: ${info.gpu}`);
  if (info.mem != null) lines.push(`${T('mem')}: ${info.mem} MB`);
  return lines;
}

/** ctx: $, renderer, low (low-power mode), param (?fps=…), lang() (current language), onChange() (e.g. wake the picture).
 *  Returns { frame(now, due, t0) }: call it after each frame drawn (due: from frameDue, t0: performance.now() when the frame began). */
export function initPerfHud(ctx) {
  const { $, renderer } = ctx;
  let stored = null;
  try { stored = localStorage.getItem(STORE_KEY); } catch { /* no storage */ }
  let mode = startMode(ctx.param, stored);
  const times = [], works = [];
  let lastWrite = 0, gpu = null;

  const box = document.createElement('div');
  box.id = 'perfHud';
  box.setAttribute('aria-hidden', 'true');
  ($('#stage') || document.body).append(box);              // on the 3D picture, not over the tool bar

  const btn = document.createElement('button');
  btn.id = 'perfToggle'; btn.type = 'button'; btn.className = 'pill';
  $('#viewMenu')?.append(btn);
  const label = () => {
    const l = ctx.lang();
    btn.textContent = `⏱ ${tx(l, 'btn')}: ${tx(l, mode)}`;
    btn.title = tx(l, 'tip');
    btn.classList.toggle('active', mode !== 'off');
    box.hidden = mode === 'off';
    box.classList.toggle('all', mode === 'all');
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();                                      // the View menu stays open, so the next choice is one tap away
    mode = nextMode(mode);
    try { if (mode === 'off') localStorage.removeItem(STORE_KEY); else localStorage.setItem(STORE_KEY, mode); } catch { /* not kept */ }
    times.length = 0; works.length = 0; lastWrite = 0;
    label(); ctx.onChange?.();
  });
  label();
  $('#viewMenuBtn')?.addEventListener('click', label);      // the language may have changed since the start

  function gpuName() {
    if (gpu !== null) return gpu;
    gpu = '';
    try {
      const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '').replace(/\s+/g, ' ').slice(0, 60);
    } catch { /* not told */ }
    return gpu;
  }

  function frame(now, due, t0) {
    if (mode === 'off') return;
    times.push(now); works.push(performance.now() - t0);
    while (times.length && now - times[0] > WINDOW) { times.shift(); works.shift(); }
    if (now - lastWrite < REFRESH) return;
    lastWrite = now;
    const r = renderer.info, size = renderer.domElement;
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;   // Chrome only
    const info = {
      calls: r.render.calls, tris: r.render.triangles, geo: r.memory.geometries, tex: r.memory.textures, prog: r.programs?.length ?? 0,
      w: size.width, h: size.height, ratio: renderer.getPixelRatio(), low: !!ctx.low, idle: !!due?.idle,
      gpu: mode === 'all' ? gpuName() : '', mem, screen: `${screen.width}×${screen.height} @${devicePixelRatio}`,
    };
    box.textContent = hudLines(mode, frameStats(times, works, now), info, ctx.lang()).join('\n');
  }
  return { frame, refresh: label };
}
