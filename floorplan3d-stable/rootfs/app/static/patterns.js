/* Drawing the patterns of floors and walls (#448) on a square canvas in the browser (no picture files): planks, herringbone, chevron,
 * basket weave, tiles (straight, checkerboard, mosaic, cement tiles, zellige, marble), running bond (large tiles, metro tiles, bricks,
 * paving), hexagons, stones (polygonal, cobbles, random slabs), terrazzo, concrete, carpet, cork, woodchip, plaster, limewash, linen,
 * wallpapers (stripes, damask, dots, harlequin, leaves, fans, zigzag, plaid), wood slats and slate shingles. Every picture repeats without
 * a seam. The same drawing in grey gives the relief (height = true): joints deep, tiles and stones up; it draws the very same shapes, as
 * it takes the same "random" numbers in the same order. Needs only a 2D canvas context (unit test with a recording one:
 * tests/patterns.test.mjs); finishtex.js makes textures of it. A finish (finishes.js resolve) gives kind, p, color, color2. */

/** the same "random" numbers every time */
export function seeded(seed) { let s = (seed % 2147483646) + 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
import { bondRows } from './finishes.js';

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
/** a darker / lighter shade of '#rrggbb' (k: factor) as a canvas colour */
export function shade(hex, k) { const [r, g, b] = rgb(hex); return `rgb(${clamp(r * k)},${clamp(g * k)},${clamp(b * k)})`; }
/** a number from a few integers, the same for the same ones (so a tile cut by the edge of the picture looks the same on both sides) */
const hash = (...v) => { let h = 2166136261; v.forEach((x) => { h = Math.imul(h ^ (x | 0), 16777619); }); return ((h >>> 0) % 100000) / 100000; };
const mod = (a, n) => ((a % n) + n) % n;

/** fn(ox, oy) once for every copy of the box (x, y, w, h) moved by whole pictures that reaches into the picture */
function wrapped(S, x, y, w, h, fn) {
  for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
    if (x + ox < S && x + ox + w > 0 && y + oy < S && y + oy + h > 0) fn(ox, oy);
  }
}
/** periodic smooth noise over the picture: c cells along each side; returns n(x, y) in 0..1 for x, y in pixels */
function noise(S, c, rnd) {
  const v = Array.from({ length: c * c }, () => rnd());
  const at = (i, j) => v[mod(j, c) * c + mod(i, c)];
  return (x, y) => {
    const gx = (x / S) * c, gy = (y / S) * c, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx, b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
    return a + (b - a) * sy;
  };
}
/** several octaves of noise (cells c, 2c, 4c ...), 0..1 */
function fbm(S, c, octaves, rnd) {
  const ns = Array.from({ length: octaves }, (_, k) => noise(S, c << k, rnd));
  return (x, y) => { let s = 0, w = 0.5, t = 0; ns.forEach((n) => { s += n(x, y) * w; t += w; w *= 0.5; }); return s / t; };
}
/** paint every pixel: fn(x, y) -> [r, g, b] */
function pixels(g, S, fn) {
  const img = g.createImageData(S, S), d = img.data;
  for (let y = 0, i = 0; y < S; y++) for (let x = 0; x < S; x++, i += 4) {
    const c = fn(x, y);
    d[i] = clamp(c[0]); d[i + 1] = clamp(c[1]); d[i + 2] = clamp(c[2]); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
/** a grey level of the relief as a canvas colour (0 deep .. 1 high) */
const grey = (v) => { const c = clamp(v * 255); return `rgb(${c},${c},${c})`; };

/** the colours a drawing uses: a (the surface), b (the second colour), joint (between planks, tiles, stones). height: the relief,
 *  joints deep; on a wallpaper the motif a little raised */
function inks(fin, height, motif) {
  if (height) return motif ? { a: '#a0a0a0', b: '#bcbcbc', joint: '#9a9a9a', h: true } : { a: '#b4b4b4', b: '#202020', joint: '#202020', h: true };
  return { a: fin.color, b: fin.color2 || shade(fin.color, 0.72), joint: fin.color2 || 'rgba(40,25,10,.55)', h: false };
}

/** wood grain along a box (x, y, w, h), along its longer side */
function grain(g, x, y, w, h, rnd, dark = 'rgba(60,35,15,', n = 14) {
  const along = w >= h;
  for (let i = 0; i < n; i++) {
    const o = 0.08 + rnd() * 0.84, a = 0.05 + rnd() * 0.08, wob = (rnd() * 6 - 3), wob2 = (rnd() * 6 - 3);
    g.strokeStyle = `${dark}${a})`; g.lineWidth = 1 + rnd();
    g.beginPath();
    if (along) { const yy = y + o * h; g.moveTo(x, yy); g.bezierCurveTo(x + w * 0.3, yy + wob, x + w * 0.7, yy + wob2, x + w, yy); }
    else { const xx = x + o * w; g.moveTo(xx, y); g.bezierCurveTo(xx + wob, y + h * 0.3, xx + wob2, y + h * 0.7, xx, y + h); }
    g.stroke();
  }
}
/** a plank, tile or brick: filled, with wood grain or speckles, in every copy that reaches into the picture */
function piece(g, S, x, y, w, h, fill, extra) {
  wrapped(S, x, y, w, h, (ox, oy) => {
    g.save(); g.beginPath(); g.rect(x + ox, y + oy, w, h); g.clip();
    g.fillStyle = fill; g.fillRect(x + ox, y + oy, w, h);
    if (extra) extra(x + ox, y + oy);
    g.restore();
  });
}

function planks(g, S, f, ink, rnd) {
  const rows = 8, rh = S / rows, k = S / 512, gap = (f.p.gap || 3) * k, joint = f.p.gap > 3 || f.p.joint ? ink.b : ink.h ? ink.joint : 'rgba(40,25,10,.55)';
  g.fillStyle = joint; g.fillRect(0, 0, S, S);
  for (let r = 0; r < rows; r++) {
    const y = r * rh, start = rnd() * S, lens = [];
    if (f.p.long) lens.push(S);
    else { const lo = f.p.min || 0.3; let sum = 0; while (S - sum > 0.6 * S) { const l = S * (lo + rnd() * 0.3); lens.push(l); sum += l; } lens.push(S - sum); }
    let x = start;
    lens.forEach((len) => {
      const tone = 0.86 + rnd() * 0.26, seed = Math.floor(rnd() * 1e6);
      piece(g, S, x + gap, y + gap / 2, len - gap, rh - gap, ink.h ? grey(0.7 * tone) : shade(f.color, tone), (px, py) => {
        const r2 = seeded(seed);
        grain(g, px, py, len - gap, rh - gap, r2, ink.h ? 'rgba(0,0,0,' : 'rgba(60,35,15,');
        if (f.p.grooves) for (let q = 1; q < 4; q++) { g.fillStyle = ink.h ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.12)'; g.fillRect(px, py + ((rh - gap) * q) / 4 - k, len - gap, 2 * k); }
      });
      x += len;
    });
  }
}

/** herringbone: slats of n x 1 laid as H at (i + j n, i - j n) and V one step left (finishes.js repeatOf: the picture has two periods) */
function herringbone(g, S, f, ink, rnd) {
  const n = f.p.n || 5, kk = 2, u = S / (kk * n * Math.SQRT2), k = S / 512, tile = !!f.p.tile;
  const tones = Array.from({ length: kk * n * kk * 2 }, () => 0.86 + rnd() * 0.26);
  g.fillStyle = tile ? ink.b : ink.h ? ink.joint : 'rgba(40,25,10,.6)'; g.fillRect(0, 0, S, S);
  g.save();
  const c = u / Math.SQRT2;
  g.setTransform(c, c, c, -c, 0, 0);
  const gap = (tile ? 3 : 2) * k / u;
  for (let i = -n - 2; i <= kk * n + n + 2; i++) for (let j = -2; j <= kk + 2; j++) {
    const hx = i + j * n, hy = i - j * n, im = mod(i, kk * n), jm = mod(j, kk);
    [[hx, hy, n, 1, 0], [hx - 1, hy, 1, n, 1]].forEach(([x, y, w, h, v]) => {
      const tone = tones[(im * kk + jm) * 2 + v];
      g.fillStyle = ink.h ? grey(0.7 * tone) : tile ? shade(f.color, 0.97 + (tone - 1) * 0.15) : shade(f.color, tone);
      g.fillRect(x + gap / 2, y + gap / 2, w - gap, h - gap);
      if (!tile) {
        const r2 = seeded(1 + im * 31 + jm * 7 + v * 1000);
        g.save(); g.beginPath(); g.rect(x + gap / 2, y + gap / 2, w - gap, h - gap); g.clip();
        g.lineWidth = 1 / u;
        for (let q = 0; q < 6; q++) {
          g.strokeStyle = ink.h ? `rgba(0,0,0,${0.05 + r2() * 0.08})` : `rgba(60,35,15,${0.06 + r2() * 0.08})`;
          const o = 0.1 + r2() * 0.8; g.beginPath();
          if (w > h) { g.moveTo(x, y + o); g.lineTo(x + w, y + o + (r2() - 0.5) * 0.1); } else { g.moveTo(x + o, y); g.lineTo(x + o + (r2() - 0.5) * 0.1, y + h); }
          g.stroke();
        }
        g.restore();
      }
    });
  }
  g.restore();
}

/** chevron: slats cut at 45° meeting in a line, four columns of 2n slats */
function chevron(g, S, f, ink, rnd) {
  const n = f.p.n || 5, cw = S / 4, step = S / (2 * n), k = S / 512, gap = 2 * k;
  const tones = Array.from({ length: 4 * 2 * n }, () => 0.86 + rnd() * 0.26);
  g.fillStyle = ink.h ? ink.joint : 'rgba(40,25,10,.6)'; g.fillRect(0, 0, S, S);
  for (let c = 0; c < 4; c++) {
    const xl = c * cw, xr = xl + cw, up = c % 2 === 0;
    for (let m = -2 * n; m <= 4 * n; m++) {
      const y0 = m * step, tone = tones[c * 2 * n + mod(m, 2 * n)];
      const pts = up ? [[xl, y0], [xr, y0 - cw], [xr, y0 - cw + step], [xl, y0 + step]] : [[xl, y0 - cw], [xr, y0], [xr, y0 + step], [xl, y0 - cw + step]];
      g.fillStyle = ink.h ? grey(0.7 * tone) : shade(f.color, tone);
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1] + gap / 2); g.lineTo(pts[1][0], pts[1][1] + gap / 2); g.lineTo(pts[2][0], pts[2][1] - gap / 2); g.lineTo(pts[3][0], pts[3][1] - gap / 2); g.closePath(); g.fill();
      g.strokeStyle = ink.h ? 'rgba(0,0,0,.06)' : 'rgba(60,35,15,.07)'; g.lineWidth = k;
      for (let q = 1; q < 4; q++) { const o = (step * q) / 4; g.beginPath(); g.moveTo(pts[0][0], pts[0][1] + o); g.lineTo(pts[1][0], pts[1][1] + o); g.stroke(); }
    }
  }
  g.fillStyle = ink.h ? ink.joint : 'rgba(40,25,10,.35)';
  for (let c = 1; c <= 4; c++) g.fillRect(c * cw - gap / 2, 0, gap, S);
}

/** basket weave: 4 x 4 squares of n slats, turned every other square */
function basket(g, S, f, ink, rnd) {
  const n = f.p.n || 4, b = S / 4, sw = b / n, k = S / 512, gap = 2 * k;
  g.fillStyle = ink.h ? ink.joint : 'rgba(40,25,10,.6)'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let q = 0; q < n; q++) {
    const across = (i + j) % 2 === 0, tone = 0.86 + rnd() * 0.26, seed = Math.floor(rnd() * 1e6);
    const [x, y, w, h] = across ? [i * b, j * b + q * sw, b, sw] : [i * b + q * sw, j * b, sw, b];
    piece(g, S, x + gap / 2, y + gap / 2, w - gap, h - gap, ink.h ? grey(0.7 * tone) : shade(f.color, tone), (px, py) => grain(g, px, py, w - gap, h - gap, seeded(seed), ink.h ? 'rgba(0,0,0,' : 'rgba(60,35,15,', 5));
  }
}

/** marble veins over a box: soft clouds, one long vein and finer ones beside it, bent by smooth noise */
function marbleBox(g, x0, y0, w, h, f, ink, rnd) {
  const N = 128, warp = fbm(N, 2, 3, rnd), cloud = fbm(N, 5, 3, rnd), turn = rnd() * Math.PI, ca = Math.cos(turn), sa = Math.sin(turn);
  const [r, gg, b] = rgb(f.color), [vr, vg, vb] = rgb(f.color2 || '#888888'), off = rnd() * 4, off2 = rnd() * 4;
  const img = g.createImageData(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), d = img.data, W = img.width, H = img.height;
  for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) {
    const u = (x / W) * N, v = (y / H) * N, bend = warp(u, v), along = (u * ca + v * sa) / N;
    const main = Math.pow(1 - Math.abs(Math.sin((along * 1.3 + bend * 1.4 + off) * Math.PI)), 26);
    const thin = Math.pow(1 - Math.abs(Math.sin((along * 3.1 + bend * 2.2 + off2) * Math.PI)), 70) * 0.55;
    const k = Math.min(0.85, main * 0.85 + thin), c = 0.95 + cloud(u, v) * 0.08;
    d[i] = clamp(r * c * (1 - k) + vr * k); d[i + 1] = clamp(gg * c * (1 - k) + vg * k); d[i + 2] = clamp(b * c * (1 - k) + vb * k); d[i + 3] = 255;
  }
  g.putImageData(img, Math.round(x0), Math.round(y0));
}
/** the ornament of a cement tile: corners, a ring and a four-leafed flower, in the second colour */
function cementTile(g, x, y, s, col, bg) {
  const c = s / 2;
  g.save(); g.translate(x + c, y + c);
  g.fillStyle = col;
  for (let q = 0; q < 4; q++) {
    g.save(); g.rotate((q * Math.PI) / 2);
    g.beginPath(); g.moveTo(-c, -c); g.lineTo(-c + s * 0.32, -c); g.quadraticCurveTo(-c + s * 0.18, -c + s * 0.18, -c, -c + s * 0.32); g.closePath(); g.fill();   // the corners: four quarters make a star where tiles meet
    g.beginPath(); g.moveTo(0, -s * 0.08); g.bezierCurveTo(s * 0.12, -s * 0.18, s * 0.06, -s * 0.36, 0, -s * 0.4); g.bezierCurveTo(-s * 0.06, -s * 0.36, -s * 0.12, -s * 0.18, 0, -s * 0.08); g.fill();   // a leaf of the flower
    g.restore();
  }
  g.strokeStyle = col; g.lineWidth = s * 0.03;
  g.beginPath(); g.arc(0, 0, s * 0.27, 0, Math.PI * 2); g.stroke();
  g.fillStyle = bg; g.beginPath(); g.arc(0, 0, s * 0.07, 0, Math.PI * 2); g.fill();
  g.restore();
}
/** tiles in a straight grid: n across, n * ar down; checkerboard, mosaic (vary), zellige, marble or cement tiles */
function grid(g, S, f, ink, rnd) {
  const n = f.p.n || 4, ar = f.p.ar || 1, w = S / n, h = w / ar, rows = Math.round(n * ar), k = S / 512, gw = (f.p.joint || 3) * k;
  g.fillStyle = ink.h ? ink.joint : f.color2 && !f.p.checker ? f.color2 : '#bdb5a8'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
    const x = i * w + gw / 2, y = j * h + gw / 2, tw = w - gw, th = h - gw;
    const base = f.p.checker && (i + j) % 2 ? f.color2 : f.color, v = f.p.vary || 0, zel = !!f.p.zellige;
    const tone = zel ? 0.78 + rnd() * 0.4 : v ? 1 - v + rnd() * 2 * v : 0.96 + rnd() * 0.06, warm = rnd();
    if (ink.h) { g.fillStyle = grey(0.7 * (zel ? 0.85 + (tone - 0.78) * 0.4 : 1)); g.fillRect(x, y, tw, th); }
    else {
      g.fillStyle = v ? shade(base, tone) : shade(base, tone); g.fillRect(x, y, tw, th);
      if (v && warm > 0.7) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, y, tw, th); }
    }
    if (f.p.marble) { if (!ink.h) marbleBox(g, x, y, tw, th, f, ink, seeded(11 + i * 7 + j * 13)); }
    if (f.p.cement && !ink.h) cementTile(g, x, y, tw, f.color2, f.color);
    if (zel) {                                                 // handmade: glossy blotches and uneven edges
      const gr = g.createRadialGradient(x + tw * (0.2 + rnd() * 0.6), y + th * (0.2 + rnd() * 0.6), 0, x + tw / 2, y + th / 2, tw * 0.7);
      gr.addColorStop(0, ink.h ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(0,0,0,.12)');
      g.fillStyle = gr; g.fillRect(x, y, tw, th);
    }
    if (f.p.bevel || n <= 6) {                                 // a light edge at the top left, a darker one at the bottom right
      g.fillStyle = ink.h ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.18)'; g.fillRect(x, y, tw, 2 * k); g.fillRect(x, y, 2 * k, th);
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x, y + th - 2 * k, tw, 2 * k); g.fillRect(x + tw - 2 * k, y, 2 * k, th);
    }
  }
  if (!ink.h) for (let q = 0; q < 4000; q++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.04})`; g.fillRect(rnd() * S, rnd() * S, 2 * k, 2 * k); }
  else for (let q = 0; q < 4000; q++) rnd(), rnd(), rnd();
}

/** running bond: rows shifted by half a tile (large tiles, metro tiles with a bevel, bricks, paving stones) */
function bond(g, S, f, ink, rnd) {
  const ar = f.p.ar || 2, cols = f.p.cols || 2, rows = bondRows(ar, cols), w = S / cols, h = S / rows, k = S / 512;
  const brick = !!f.p.brick, pave = !!f.p.paving, gw = (brick ? 5 * 2 / cols : pave ? 4 : 3) * k, vary = f.p.vary ?? (brick ? 0.4 : pave ? 0.25 : 0.06);
  g.fillStyle = ink.h ? ink.joint : f.color2 || '#bdb5a8'; g.fillRect(0, 0, S, S);
  const tones = Array.from({ length: rows * cols }, () => 1 - vary * 0.65 + rnd() * vary);
  const seeds = Array.from({ length: rows * cols }, () => Math.floor(rnd() * 1e6));
  for (let r = 0; r < rows; r++) for (let c = -1; c <= cols; c++) {
    const x = c * w + (r % 2) * (w / 2) + gw / 2, y = r * h + gw / 2, tw = w - gw, th = h - gw, idx = r * cols + mod(c, cols), tone = tones[idx];
    piece(g, S, x, y, tw, th, ink.h ? grey(brick || pave ? 0.6 + (tone - 0.8) * 0.4 : 0.7) : shade(f.color, tone), (px, py) => {
      const r2 = seeded(seeds[idx]);
      if (brick || pave) {
        for (let q = 0; q < 240 / cols; q++) { const lv = r2(); g.fillStyle = lv > 0.5 ? `rgba(255,255,255,${(lv - 0.5) * 0.18})` : `rgba(0,0,0,${(0.5 - lv) * 0.25})`; g.fillRect(px + r2() * tw, py + r2() * th, (1 + r2() * 3) * k, (1 + r2() * 2) * k); }
        if (brick && r2() > 1 - vary && vary >= 0.2) { g.fillStyle = 'rgba(30,15,10,.18)'; g.fillRect(px, py, tw * (0.3 + r2() * 0.5), th); }   // a darker end (fired harder)
        g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(px, py + th - 2 * k, tw, 2 * k);
      }
      if (f.p.bevel) {                                       // metro tiles: the rounded edge catches the light
        const gr = g.createLinearGradient(px, py, px, py + th);
        gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.18, 'rgba(255,255,255,0)'); gr.addColorStop(0.82, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)');
        g.fillStyle = gr; g.fillRect(px, py, tw, th);
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px, py, 3 * k, th);
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(px + tw - 3 * k, py, 3 * k, th);
      }
      if (pave) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3 * k; g.strokeRect(px + 1.5 * k, py + 1.5 * k, tw - 3 * k, th - 3 * k); }
    });
  }
}

/** hexagons, pointy on top: drawn in units of their width (across the flats); 4 across and 4 rows in one picture */
function hex(g, S, f, ink, rnd) {
  const k = S / 512, R = 1 / Math.sqrt(3), sx = S / 4, sy = S / (2 * Math.sqrt(3)), gw = (3 * k) / sx;
  g.fillStyle = ink.h ? ink.joint : f.color2 || '#bdb5a8'; g.fillRect(0, 0, S, S);
  const tones = Array.from({ length: 16 }, () => 0.95 + rnd() * 0.08);
  g.save(); g.setTransform(sx, 0, 0, sy, 0, 0);
  for (let row = -1; row <= 5; row++) for (let col = -1; col <= 5; col++) {
    const cx = col + (mod(row, 2) ? 0.5 : 0), cy = row * (Math.sqrt(3) / 2), r = R - gw / Math.sqrt(3);
    g.fillStyle = ink.h ? grey(0.7) : shade(f.color, tones[mod(row, 4) * 4 + mod(col, 4)]);
    g.beginPath();
    for (let q = 0; q < 6; q++) { const a = Math.PI / 2 + (q * Math.PI) / 3; g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    g.closePath(); g.fill();
  }
  g.restore();
}

/** stones as cells around g x g scattered points (polygonal slabs, a stone wall, cobbles: round), joints between them */
function cells(g, S, f, ink, rnd) {
  const n = f.p.g || 5, cs = S / n, pts = [], tone = [], k = S / 512, joint = (f.p.round ? 0.14 : 0.07) * cs;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { pts.push([(i + 0.15 + rnd() * 0.7) * cs, (j + 0.15 + rnd() * 0.7) * cs]); tone.push(0.8 + rnd() * 0.35); }
  const nz = fbm(S, 8, 3, rnd), [r, gg, b] = rgb(f.color), [jr, jg, jb] = rgb(f.color2 || '#6f675b');
  pixels(g, S, (x, y) => {
    const ci = Math.floor(x / cs), cj = Math.floor(y / cs);
    let d1 = 1e9, d2 = 1e9, best = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = ci + di, jj = cj + dj, p = pts[mod(jj, n) * n + mod(ii, n)];
      const px = p[0] + Math.floor(ii / n) * S, py = p[1] + Math.floor(jj / n) * S;
      const dd = Math.hypot(x - px, y - py);
      if (dd < d1) { d2 = d1; d1 = dd; best = mod(jj, n) * n + mod(ii, n); } else if (dd < d2) d2 = dd;
    }
    const e = (d2 - d1) / 2, t = nz(x, y);
    if (e < joint * 0.5) { const v = ink.h ? 30 : 0; return ink.h ? [v, v, v] : [jr * (0.9 + t * 0.2), jg * (0.9 + t * 0.2), jb * (0.9 + t * 0.2)]; }
    const dome = f.p.round ? Math.min(1, (e - joint * 0.5) / (cs * 0.25)) : Math.min(1, (e - joint * 0.5) / (3 * k));
    if (ink.h) { const v = 90 + 110 * Math.sqrt(dome) + t * 30; return [v, v, v]; }
    const s = tone[best] * (0.88 + t * 0.24) * (f.p.round ? 0.7 + 0.3 * dome : 1);
    return [r * s, gg * s, b * s];
  });
}

/** random slabs in rows (slate, natural stone): rows of two or three heights, slabs of random length */
function rows(g, S, f, ink, rnd) {
  const k = S / 512, gw = 3 * k, hs = Array.from({ length: 5 }, () => 0.6 + rnd() * 0.8), sum = hs.reduce((a, b) => a + b, 0);
  g.fillStyle = ink.h ? ink.joint : f.color2 || '#8f8577'; g.fillRect(0, 0, S, S);
  let y = 0;
  hs.forEach((hh) => {
    const h = (hh / sum) * S, start = rnd() * S, lens = [];
    let tot = 0;
    while (S - tot > 0.5 * S) { const l = S * (0.18 + rnd() * 0.3); lens.push(l); tot += l; }
    lens.push(S - tot);
    let x = start;
    lens.forEach((len) => {
      const tone = 0.82 + rnd() * 0.3, seed = Math.floor(rnd() * 1e6);
      piece(g, S, x + gw / 2, y + gw / 2, len - gw, h - gw, ink.h ? grey(0.6 + (tone - 0.82) * 0.5) : shade(f.color, tone), (px, py) => {
        const r2 = seeded(seed);
        if (f.p.layers) for (let q = 0; q < 40; q++) { g.fillStyle = r2() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; g.fillRect(px, py + r2() * h, len, (1 + r2() * 2) * k); }   // layers in slate
        else for (let q = 0; q < 160; q++) { const lv = r2(); g.fillStyle = lv > 0.5 ? `rgba(255,255,255,${(lv - 0.5) * 0.12})` : `rgba(0,0,0,${(0.5 - lv) * 0.14})`; g.fillRect(px + r2() * len, py + r2() * h, (1 + r2() * 3) * k, (1 + r2() * 3) * k); }
      });
      x += len;
    });
    y += h;
  });
}

/** terrazzo: chips of stone in three colours on the ground colour, polished flat */
function terrazzo(g, S, f, ink, rnd) {
  const k = S / 512, chips = ink.h ? null : [f.color2 || '#7d746a', shade(f.color2 || '#7d746a', 1.35), shade(f.color, 0.82), '#f4f2ee', shade(f.color2 || '#7d746a', 0.7)];
  g.fillStyle = ink.h ? grey(0.6) : f.color; g.fillRect(0, 0, S, S);
  for (let q = 0; q < 900; q++) {
    const x = rnd() * S, y = rnd() * S, r = (2 + rnd() * rnd() * 14) * k, c = Math.floor(rnd() * 5), m = 3 + Math.floor(rnd() * 4), turn = rnd() * 6.3, lob = Array.from({ length: m }, () => 0.6 + rnd() * 0.5);
    wrapped(S, x - r, y - r, 2 * r, 2 * r, (ox, oy) => {
      g.fillStyle = ink.h ? grey(0.62) : chips[c]; g.beginPath();
      for (let i = 0; i < m; i++) { const a = turn + (i / m) * Math.PI * 2; g.lineTo(x + ox + Math.cos(a) * r * lob[i], y + oy + Math.sin(a) * r * lob[i]); }
      g.closePath(); g.fill();
    });
  }
}

/** grain painted per pixel: base colour, clouds (big), grain (fine), pores; the relief from the same numbers */
function grainy(g, S, f, ink, rnd, { cloud = 0.1, cloudCells = 4, fine = 0.08, pores = 0, relief = 0.5 }) {
  const big = fbm(S, cloudCells, 4, rnd), small = noise(S, 128, rnd), [r, gg, b] = rgb(f.color);
  const holes = new Set();
  for (let q = 0; q < pores; q++) holes.add(Math.floor(rnd() * S) + Math.floor(rnd() * S) * S);
  pixels(g, S, (x, y) => {
    const c = big(x, y), s = small(x, y), hole = holes.has(x + y * S);
    if (ink.h) { const v = 128 + (s - 0.5) * 255 * relief + (c - 0.5) * 40 - (hole ? 90 : 0); return [v, v, v]; }
    const k = (1 + (c - 0.5) * 2 * cloud) * (1 + (s - 0.5) * 2 * fine) * (hole ? 0.6 : 1);
    return [r * k, gg * k, b * k];
  });
}
function concrete(g, S, f, ink, rnd) {
  grainy(g, S, f, ink, rnd, { cloud: 0.09, cloudCells: 3, fine: 0.06, pores: f.p.formwork ? 500 : 300, relief: 0.35 });
  const k = S / 512;
  g.strokeStyle = ink.h ? 'rgba(0,0,0,.5)' : 'rgba(60,60,60,.35)'; g.lineWidth = 2 * k;
  if (!f.p.formwork) { g.strokeRect(0, 0, S, S); return; }          // the joints of the slabs
  g.strokeRect(0, 0, S, S);                                          // exposed concrete: one formwork panel, its joints and six tie holes
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x = ((i + 0.5) / 3) * S, y = ((j + 0.5) / 2) * S;
    g.fillStyle = ink.h ? '#101010' : 'rgba(40,40,40,.65)'; g.beginPath(); g.arc(x, y, 7 * k, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink.h ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.18)'; g.lineWidth = 3 * k; g.beginPath(); g.arc(x, y, 11 * k, 0, Math.PI * 2); g.stroke();
  }
}
function carpet(g, S, f, ink, rnd) {
  grainy(g, S, f, ink, rnd, { cloud: 0.05, cloudCells: 6, fine: 0.16, relief: 0.8 });
  if (!f.p.tiles) return;
  const k = S / 512, h = S / 2;                                       // carpet tiles: four, the pile turned every other one, a seam between
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    g.save(); g.beginPath(); g.rect(i * h, j * h, h, h); g.clip();
    g.strokeStyle = (i + j) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; g.lineWidth = 2 * k;
    for (let q = 0; q < h; q += 4 * k) { g.beginPath(); if ((i + j) % 2) { g.moveTo(i * h + q, j * h); g.lineTo(i * h + q, j * h + h); } else { g.moveTo(i * h, j * h + q); g.lineTo(i * h + h, j * h + q); } g.stroke(); }
    g.restore();
  }
  g.strokeStyle = ink.h ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.25)'; g.lineWidth = 2 * k;
  g.strokeRect(0, 0, h, h); g.strokeRect(h, 0, h, h); g.strokeRect(0, h, h, h); g.strokeRect(h, h, h, h);
}
function cork(g, S, f, ink, rnd) {
  const k = S / 512;
  g.fillStyle = ink.h ? grey(0.5) : f.color; g.fillRect(0, 0, S, S);
  for (let q = 0; q < 7000; q++) {
    const x = rnd() * S, y = rnd() * S, r = (1 + rnd() * 4) * k, lv = rnd(), a = rnd() * 3.1;
    g.fillStyle = ink.h ? grey(0.3 + lv * 0.5) : shade(f.color, 0.6 + lv * 0.75);
    wrapped(S, x - r, y - r, 2 * r, 2 * r, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, r, r * 0.6, a, 0, Math.PI * 2); g.fill(); });
  }
}
/** woodchip (Raufaser): small chips of wood under the paint, seen only as a little light and shadow; the relief carries it */
function woodchip(g, S, f, ink, rnd) {
  const k = S / 512;
  g.fillStyle = ink.h ? grey(0.45) : f.color; g.fillRect(0, 0, S, S);
  for (let q = 0; q < 9000; q++) {
    const x = rnd() * S, y = rnd() * S, r = (0.8 + rnd() * rnd() * 4) * k, a = rnd() * 3.1, lv = rnd();
    wrapped(S, x - 2 * r, y - 2 * r, 4 * r, 4 * r, (ox, oy) => {
      if (ink.h) { g.fillStyle = grey(0.6 + lv * 0.35); g.beginPath(); g.ellipse(x + ox, y + oy, r * 1.6, r, a, 0, Math.PI * 2); g.fill(); return; }
      g.fillStyle = 'rgba(0,0,0,.07)'; g.beginPath(); g.ellipse(x + ox + r * 0.5, y + oy + r * 0.5, r * 1.6, r, a, 0, Math.PI * 2); g.fill();
      g.fillStyle = shade(f.color, 1.02 + lv * 0.03); g.beginPath(); g.ellipse(x + ox, y + oy, r * 1.6, r, a, 0, Math.PI * 2); g.fill();
    });
  }
}
/** plaster (Reibeputz): coarse grain with grooves rubbed in small arcs */
function plaster(g, S, f, ink, rnd) {
  grainy(g, S, f, ink, rnd, { cloud: 0.04, cloudCells: 4, fine: 0.07, relief: 0.9 });
  const k = S / 512;
  for (let q = 0; q < 1400; q++) {
    const x = rnd() * S, y = rnd() * S, r = (4 + rnd() * 10) * k, a0 = rnd() * 6.3, len = 0.6 + rnd() * 1.4;
    g.strokeStyle = ink.h ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,.05)'; g.lineWidth = (1 + rnd()) * k;
    wrapped(S, x - r, y - r, 2 * r, 2 * r, (ox, oy) => { g.beginPath(); g.arc(x + ox, y + oy, r, a0, a0 + len); g.stroke(); });
  }
}
function limewash(g, S, f, ink, rnd) { grainy(g, S, f, ink, rnd, { cloud: 0.16, cloudCells: 3, fine: 0.03, relief: 0.2 }); }
/** linen: fine threads across and along */
function linen(g, S, f, ink, rnd) {
  const k = S / 512;
  g.fillStyle = ink.h ? grey(0.5) : f.color; g.fillRect(0, 0, S, S);
  for (let q = 0; q < S; q += 2 * k) {
    const a = rnd() * 0.12, b = rnd() * 0.12;
    g.fillStyle = ink.h ? `rgba(255,255,255,${a * 3})` : `rgba(255,255,255,${a})`; g.fillRect(0, q, S, k);
    g.fillStyle = ink.h ? `rgba(0,0,0,${b * 3})` : `rgba(0,0,0,${b * 0.8})`; g.fillRect(q, 0, k, S);
  }
}
/** wallpaper: a fine paper grain under the motif */
function paper(g, S, ink, rnd) {
  const k = S / 512;
  for (let q = 0; q < 2500; q++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.035})`; g.fillRect(rnd() * S, rnd() * S, 2 * k, 2 * k); }
}
function stripes(g, S, f, ink, rnd) {
  const w = S / 4, k = S / 512;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  g.fillStyle = ink.b;
  for (let i = 1; i < 4; i += 2) g.fillRect(i * w, 0, w, S);
  g.fillStyle = ink.h ? '#c4c4c4' : shade(f.color2 || f.color, 0.8);
  for (let i = 0; i < 4; i++) { g.fillRect(i * w + 3 * k, 0, 2 * k, S); g.fillRect((i + 1) * w - 5 * k, 0, 2 * k, S); }
  paper(g, S, ink, rnd);
}
/** wood slats on a dark felt (acoustic panels): the slats up, the gaps deep */
function slats(g, S, f, ink, rnd) {
  const n = 8, p = S / n, w = p * 0.62;
  g.fillStyle = ink.h ? '#101010' : f.color2 || '#1e1e1e'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const tone = 0.88 + rnd() * 0.22, seed = Math.floor(rnd() * 1e6);
    piece(g, S, i * p + (p - w) / 2, 0, w, S, ink.h ? grey(0.75) : shade(f.color, tone), (px, py) => grain(g, px, py, w, S, seeded(seed), ink.h ? 'rgba(0,0,0,' : 'rgba(60,35,15,', 6));
  }
}
/** a damask motif (spine, two scrolls, crown and a small leaf) in a box of s around (x, y) */
function damaskMotif(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(0, -0.42); g.bezierCurveTo(0.09, -0.25, 0.1, 0.1, 0, 0.36); g.bezierCurveTo(-0.1, 0.1, -0.09, -0.25, 0, -0.42); g.fill();   // the spine
  for (const m of [1, -1]) {
    g.beginPath(); g.moveTo(0.02 * m, 0.05); g.bezierCurveTo(0.3 * m, -0.05, 0.42 * m, 0.2, 0.26 * m, 0.3); g.bezierCurveTo(0.16 * m, 0.36, 0.1 * m, 0.24, 0.19 * m, 0.19);
    g.bezierCurveTo(0.26 * m, 0.15, 0.22 * m, 0.06, 0.1 * m, 0.12); g.closePath(); g.fill();                                            // a scroll
    g.beginPath(); g.moveTo(0.03 * m, -0.18); g.bezierCurveTo(0.2 * m, -0.3, 0.36 * m, -0.2, 0.32 * m, -0.06); g.bezierCurveTo(0.24 * m, -0.12, 0.14 * m, -0.12, 0.03 * m, -0.08); g.fill();   // an upper leaf
    g.beginPath(); g.arc(0.36 * m, 0.02, 0.035, 0, Math.PI * 2); g.fill();
  }
  g.beginPath(); g.moveTo(0, -0.5); g.bezierCurveTo(0.08, -0.44, 0.05, -0.38, 0, -0.36); g.bezierCurveTo(-0.05, -0.38, -0.08, -0.44, 0, -0.5); g.fill();   // the crown
  g.beginPath(); g.moveTo(0, 0.38); g.bezierCurveTo(0.07, 0.43, 0.04, 0.5, 0, 0.5); g.bezierCurveTo(-0.04, 0.5, -0.07, 0.43, 0, 0.38); g.fill();
  g.restore();
}
function damask(g, S, f, ink, rnd) {
  const s = S / 2;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  g.fillStyle = ink.b;
  for (let c = -1; c <= 2; c++) for (let r = -1; r <= 2; r++) damaskMotif(g, (c + 0.5) * s, (r + (mod(c, 2) ? 0 : 0.5)) * s, s * 0.9);
  paper(g, S, ink, rnd);
}
function dots(g, S, f, ink, rnd) {
  const s = S / 4;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  g.fillStyle = ink.b;
  for (let r = -1; r <= 4; r++) for (let c = -1; c <= 4; c++) { g.beginPath(); g.arc((c + (mod(r, 2) ? 0.5 : 0)) * s, (r + 0.5) * s, s * 0.17, 0, Math.PI * 2); g.fill(); }
  paper(g, S, ink, rnd);
}
/** harlequin: diamonds 1 wide and 1.5 high (the picture is 2 x 3 of them), rows in turn in the two colours, thin lines along the edges */
function diamonds(g, S, f, ink, rnd) {
  const sx = S / 2, sy = S / 3;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  g.save(); g.setTransform(sx, 0, 0, sy, 0, 0);
  for (let j = -1; j <= 5; j++) for (let i = -1; i <= 3; i++) {
    const cx = i + (mod(j, 2) ? 0.5 : 0), cy = j * 0.75;
    g.beginPath(); g.moveTo(cx, cy - 0.75); g.lineTo(cx + 0.5, cy); g.lineTo(cx, cy + 0.75); g.lineTo(cx - 0.5, cy); g.closePath();
    g.fillStyle = mod(j, 2) ? ink.b : ink.a; g.fill();
    g.strokeStyle = ink.h ? '#c8c8c8' : shade(f.color2 || f.color, 0.75); g.lineWidth = 1.5 / sx; g.stroke();
  }
  g.restore();
  paper(g, S, ink, rnd);
}
function leaves(g, S, f, ink, rnd) {
  const s = S / 4, k = S / 512;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  for (let q = 0; q < 18; q++) {
    const x = rnd() * S, y = rnd() * S, a = rnd() * 6.3, l = s * (0.6 + rnd() * 0.4), tone = 0.85 + rnd() * 0.3;
    wrapped(S, x - l, y - l, 2 * l, 2 * l, (ox, oy) => {
      g.save(); g.translate(x + ox, y + oy); g.rotate(a);
      g.fillStyle = ink.h ? ink.b : shade(f.color2, tone);
      g.beginPath(); g.moveTo(-l / 2, 0); g.quadraticCurveTo(0, -l * 0.32, l / 2, 0); g.quadraticCurveTo(0, l * 0.32, -l / 2, 0); g.fill();
      g.strokeStyle = ink.h ? '#a8a8a8' : 'rgba(255,255,255,.35)'; g.lineWidth = 1.5 * k;
      g.beginPath(); g.moveTo(-l / 2, 0); g.lineTo(l / 2, 0); g.stroke();
      g.strokeStyle = ink.h ? ink.b : shade(f.color2, tone * 0.8); g.lineWidth = 2 * k;
      g.beginPath(); g.moveTo(-l / 2, 0); g.lineTo(-l * 0.7, l * 0.08); g.stroke();
      g.restore();
    });
  }
  paper(g, S, ink, rnd);
}
/** art deco fans: circles in rows shifted by half, each row over the one above: only their tops show, with rings inside */
function scallop(g, S, f, ink, rnd) {
  const r = S / 8, k = S / 512;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  for (let row = -1; row <= 9; row++) for (let c = -1; c <= 4; c++) {
    const x = c * 2 * r + (mod(row, 2) ? r : 0) + r, y = row * r;
    g.fillStyle = ink.a; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink.b;
    [[0.97, 2.5], [0.72, 1.5], [0.48, 1.5]].forEach(([q, lw]) => { g.lineWidth = lw * k; g.beginPath(); g.arc(x, y, r * q, Math.PI, Math.PI * 2); g.stroke(); });
  }
  paper(g, S, ink, rnd);
}
function zigzag(g, S, f, ink, rnd) {
  const s = S / 4;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  g.strokeStyle = ink.b; g.lineWidth = s * 0.22; g.lineJoin = 'miter';
  for (let row = -1; row <= 4; row++) {
    const y = (row + 0.5) * s;
    g.beginPath();
    for (let i = -1; i <= 8; i++) g.lineTo((i * s) / 2, y + (mod(i, 2) ? s * 0.22 : -s * 0.22));
    g.stroke();
  }
  paper(g, S, ink, rnd);
}
function plaid(g, S, f, ink, rnd) {
  const k = S / 512;
  g.fillStyle = ink.a; g.fillRect(0, 0, S, S);
  const band = (pos, w, alpha) => {
    g.globalAlpha = alpha; g.fillStyle = ink.b;
    g.fillRect(pos * S, 0, w * S, S); g.fillRect(0, pos * S, S, w * S);
    g.globalAlpha = 1;
  };
  band(0.1, 0.22, 0.45); band(0.5, 0.06, 0.6); band(0.62, 0.06, 0.6); band(0.82, 0.02, 0.8);
  g.fillStyle = ink.h ? '#c4c4c4' : 'rgba(255,255,255,.45)';
  [0.38, 0.95].forEach((p) => { g.fillRect(p * S, 0, 2 * k, S); g.fillRect(0, p * S, S, 2 * k); });
  paper(g, S, ink, rnd);
}
/** slate shingles (Schiefer): rows shifted by half, rounded at the bottom, the bottom of each row over the top of the row under it */
function shingles(g, S, f, ink, rnd) {
  const w = S / 4, h = S / 6, k = S / 512;
  g.fillStyle = ink.h ? '#101010' : f.color2 || '#25282c'; g.fillRect(0, 0, S, S);
  const tones = Array.from({ length: 6 * 4 }, () => 0.85 + rnd() * 0.3);
  for (let row = 7; row >= -1; row--) for (let c = -1; c <= 4; c++) {          // from the bottom up: each row lies over the top of the one under it
    const x = c * w + (mod(row, 2) ? w / 2 : 0), y = row * h, tone = tones[mod(row, 6) * 4 + mod(c, 4)];
    g.fillStyle = ink.h ? grey(0.55 + (tone - 0.85) * 0.6) : shade(f.color, tone);
    g.beginPath(); g.moveTo(x + 2 * k, y - h * 0.6); g.lineTo(x + w - 2 * k, y - h * 0.6); g.lineTo(x + w - 2 * k, y + h * 0.45);
    g.quadraticCurveTo(x + w - 2 * k, y + h - 2 * k, x + w / 2, y + h - 2 * k); g.quadraticCurveTo(x + 2 * k, y + h - 2 * k, x + 2 * k, y + h * 0.45); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 2 * k, y - h * 0.6, w - 4 * k, 3 * k);
  }
}
const plain = (g, S, f, ink) => { g.fillStyle = ink.a; g.fillRect(0, 0, S, S); };

/** how every kind is drawn (finishes.js kind) and whether it is a printed motif (its relief stays flat, the motif a little raised) */
export const KINDS = { plain, planks, herringbone, chevron, basket, grid, bond, hex, cells, rows, terrazzo, concrete, carpet, cork, woodchip, plaster, limewash, linen, stripes, slats, damask, dots, diamonds, leaves, scallop, zigzag, plaid, shingles };
const MOTIFS = new Set(['stripes', 'damask', 'dots', 'diamonds', 'leaves', 'scallop', 'zigzag', 'plaid']);

/** draw finish fin (finishes.js resolve) on context g of a square canvas S x S; height: the relief in grey instead of the colours */
export function drawPattern(g, S, fin, height = false) {
  const draw = KINDS[fin.kind] || plain;
  let seed = 7;
  for (const ch of fin.key || '') seed = (seed * 31 + ch.charCodeAt(0)) % 100003;
  draw(g, S, fin, inks(fin, height, MOTIFS.has(fin.kind)), seeded(seed));
}
