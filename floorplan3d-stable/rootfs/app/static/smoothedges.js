/* Smoothing the edges of the 3D picture (#560): draws each frame as edges.js decides, straight onto the screen or through a picture of its own
 * (a render target, with 4 samples per pixel for "smooth" or without for the FXAA shader) that is then copied onto the screen. The picture of
 * its own is filled exactly as the screen would be (colours in sRGB, the same blending, see `screenLike`), so a frame looks the same either
 * way and only the edges differ. Also the choice in ⚙ "Kantenglättung auf diesem Gerät" (#setEdges, kept in this browser; the page reloads,
 * as the canvas' own smoothing is chosen at the start). The decisions are pure: edges.js. */
import * as THREE from './vendor/three.module.min.js';
import { FXAAShader } from './vendor/shaders/FXAAShader.js';
import { MODES, STORE_KEY, edgeMode, framePath, cameraStep, STILL_STEP, MOVE_HOLD, weakGraphics, WEAK_FRAMES, GAP_MAX } from './edges.js';

/** the mode at the start: ?edges= (param), else what this browser keeps, else as before (low: the low-power mode) */
export function startEdges(param, low) {
  let stored = null;
  try { stored = localStorage.getItem(STORE_KEY); } catch { /* no storage */ }
  return edgeMode(param, stored, low);
}

/** a render target filled like the screen: three.js writes linear colours into a render target, the screen gets sRGB and blends in it.
 *  Marked like a WebXR target (three.js' own way for a target that stands for the screen) with an sRGB texture stored as plain RGBA8,
 *  the shaders write what they write onto the screen, and a copy of it looks the same (glass, glow and see-through walls included) */
function screenLike(samples) {
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  rt.texture.internalFormat = 'RGBA8';
  rt.isXRRenderTarget = true;
  return rt;
}

const VERT = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const COPY = 'uniform sampler2D tMap;\nvoid main() { gl_FragColor = texelFetch(tMap, ivec2(gl_FragCoord.xy), 0); }';

/** ctx: $, renderer, mode (from startEdges), target() (what the camera looks at), reload() */
export function initSmoothEdges(ctx) {
  const { renderer, mode } = ctx;
  const sel = ctx.$?.('#setEdges');
  if (sel) {
    let stored = null;
    try { stored = localStorage.getItem(STORE_KEY); } catch { /* no storage */ }
    sel.value = MODES.includes(stored) ? stored : 'default';
    sel.addEventListener('change', () => {
      try { if (sel.value === 'default') localStorage.removeItem(STORE_KEY); else localStorage.setItem(STORE_KEY, sel.value); } catch { /* not kept */ }
      ctx.reload();
    });
  }

  let rtSmooth = null, rtPlain = null, quad = null, quadScene = null;
  const quadCam = new THREE.Camera(), size = new THREE.Vector2();
  const copyMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: null } }, vertexShader: VERT, fragmentShader: COPY });
  const fxaaMat = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, resolution: { value: new THREE.Vector2() } }, vertexShader: VERT, fragmentShader: FXAAShader.fragmentShader });
  for (const m of [copyMat, fxaaMat]) Object.assign(m, { depthTest: false, depthWrite: false, blending: THREE.NoBlending, toneMapped: false });

  let last = null, lastMoved = -Infinity, lastNow = 0, wasMoving = false, weak = null, path = 'direct';
  const gaps = [];

  /** draw the scene into rt (resized to the screen's pixels) and copy it onto the screen with mat; the copy is not counted in renderer.info,
   *  so the performance display and the tests keep counting the house only */
  function through(rt, mat, scene, camera) {
    renderer.getDrawingBufferSize(size);
    if (rt.width !== size.x || rt.height !== size.y) rt.setSize(size.x, size.y);
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    if (!quad) { quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat); quad.frustumCulled = false; quadScene = new THREE.Scene(); quadScene.add(quad); }
    quad.material = mat;
    if (mat === fxaaMat) { mat.uniforms.tDiffuse.value = rt.texture; mat.uniforms.resolution.value.set(1 / size.x, 1 / size.y); }
    else mat.uniforms.tMap.value = rt.texture;
    const counted = { ...renderer.info.render };
    renderer.render(quadScene, quadCam);
    Object.assign(renderer.info.render, counted);
  }

  /** draw a frame at time now (ms) */
  function render(scene, camera, now) {
    const cur = { p: camera.position.toArray(), q: camera.quaternion.toArray() };
    if (cameraStep(last, cur, camera.position.distanceTo(ctx.target())) > STILL_STEP) lastMoved = now;
    last = cur;
    const moving = now - lastMoved < MOVE_HOLD;
    path = framePath(mode, moving, weak === true);
    if (mode === 'auto' && weak !== true && path === 'smooth') {            // measure the graphics while it smooths a moving picture
      if (moving && wasMoving && now - lastNow < GAP_MAX) gaps.push(now - lastNow);
      if (gaps.length > WEAK_FRAMES) gaps.shift();
      weak = weakGraphics(gaps) ?? weak;
    }
    wasMoving = moving; lastNow = now;
    if (path === 'smooth') through(rtSmooth ||= screenLike(4), copyMat, scene, camera);
    else if (path === 'fxaa') through(rtPlain ||= screenLike(0), fxaaMat, scene, camera);
    else renderer.render(scene, camera);
  }

  /** for the performance display and the tests: { mode, path (of the last frame), weak (auto: null while measuring) } */
  const info = () => ({ mode, path, weak });
  /** for the tests: draw the scene straight or through the plain picture (no smoothing either way) and read the pixels back */
  function compare(scene, camera) {
    const gl = renderer.getContext();
    renderer.getDrawingBufferSize(size);
    const read = () => { const px = new Uint8Array(size.x * size.y * 4); gl.readPixels(0, 0, size.x, size.y, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
    renderer.render(scene, camera);
    const a = read();
    through(rtPlain ||= screenLike(0), copyMat, scene, camera);
    const b = read();
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff = Math.max(diff, Math.abs(a[i] - b[i]));
    return { diff, pixels: size.x * size.y };
  }
  return { render, info, compare };
}
