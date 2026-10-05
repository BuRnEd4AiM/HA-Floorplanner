/* Room lighting: every lit lamp shines from its own position, so a room is brightest near the lamp. Shader materials for the floor of the
 * hologram theme, the light pool on the floor of the solid themes and the wash on the walls, up to MAX_LIGHTS lamps per room; and the colour
 * scales of the room colourings (temperature, humidity, CO2). Colour maths is pure (tested). */
import * as THREE from './vendor/three.module.min.js';

export const MAX_LIGHTS = 8;
/** how far (r, relative to the setting) and how strongly (k) a kind of lamp lights the room */
export const LIGHT_PROFILE = {
  light: { r: 0.85, k: 0.8 }, lamp: { r: 0.6, k: 0.6 }, orb: { r: 0.3, k: 0.4 }, strip: { r: 0.4, k: 0.4 },
  panel_tri: { r: 0.35, k: 0.4 }, panel_hex: { r: 0.35, k: 0.4 }, panel_sq: { r: 0.35, k: 0.4 }, panel_bar: { r: 0.4, k: 0.4 }, nanoleaf: { r: 0.45, k: 0.5 }, tv_led: { r: 0.55, k: 0.55 },
  ledseg: { r: 0.5, k: 0.45 },
};
/** '#rrggbb' -> 0xrrggbb */
export const cssHex = (s) => parseInt(s.slice(1), 16);
/** 0xrrggbb -> vector of 0..1 */
export const hexVec = (h) => new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);

/** the colour of a value on a colour scale [{ v, c: '#rrggbb' }] (sorted by v): the end colours outside, mixed in between */
export function colorFromStops(stops, v) {
  if (v <= stops[0].v) return cssHex(stops[0].c);
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i].v) {
      const k = (v - stops[i - 1].v) / (stops[i].v - stops[i - 1].v || 1);
      const p = cssHex(stops[i - 1].c), q = cssHex(stops[i].c);
      const mix = (s) => Math.round(((p >> s) & 255) * (1 - k) + ((q >> s) & 255) * k);
      return (mix(16) << 16) | (mix(8) << 8) | mix(0);
    }
  }
  return cssHex(stops[stops.length - 1].c);
}

const LIGHT_HEAD = `uniform int uCount; uniform vec4 uPos[${MAX_LIGHTS}]; uniform vec3 uCol[${MAX_LIGHTS}]; uniform float uStr; varying vec3 vP;`;
const VERT = 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FLOOR_FS = `${LIGHT_HEAD} uniform vec3 uBase; uniform float uAlpha;
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP.xz, uPos[i].xz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 2.2); }
  float lit = max(acc.r, max(acc.g, acc.b)) * uStr;
  float alpha = uAlpha < 1.0 ? min(1.0, uAlpha + lit * 0.9) : 1.0;     // lit spots stay visible through floors above
  vec3 lc = vec3(1.0) - exp(-acc * uStr * 0.9);                        // soft roll-off: no burnt-out white
  gl_FragColor = vec4(min(uBase + lc * (uAlpha < 1.0 ? 1.0 : 0.85), vec3(1.0)), alpha); }`;
const WASH_FS = `${LIGHT_HEAD} uniform float uH;
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP, uPos[i].xyz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 1.6); }
  acc *= uStr; float m = max(max(acc.r, acc.g), max(acc.b, 0.001));
  float a = clamp(m * 0.6, 0.0, 0.6) * (1.0 - smoothstep(0.0, uH, vP.y));
  if (a < 0.01) discard; gl_FragColor = vec4(acc / m, a); }`;
/* light pool on the floor of the solid themes: a tinted, alpha-blended layer above the normal floor (keeps its shading and shadows) */
const GLOW_FS = `${LIGHT_HEAD}
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP.xz, uPos[i].xz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 2.2); }
  acc *= uStr; float m = max(max(acc.r, acc.g), max(acc.b, 0.001));
  float a = clamp(m * 0.75, 0.0, 0.7);
  if (a < 0.01) discard; gl_FragColor = vec4(acc / m, a); }`;

const lightUniforms = () => ({
  uPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
  uCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()) },
});
/** kind 'floor' (hologram floor, base colour floorHex), 'glow' (light pool of the solid themes) or 'wash' (light on the walls) */
export function roomLightMat(kind, alpha = 1, ghost = false, floorHex = 0x0a1830) {
  if (kind === 'glow') {
    return new THREE.ShaderMaterial({
      uniforms: { uCount: { value: 0 }, uStr: { value: 1 }, uH: { value: 1 }, ...lightUniforms() },
      vertexShader: VERT, fragmentShader: GLOW_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
  }
  const wash = kind === 'wash';
  return new THREE.ShaderMaterial({
    uniforms: { uBase: { value: hexVec(floorHex) }, uAlpha: { value: alpha }, uCount: { value: 0 }, uStr: { value: 1 }, uH: { value: 1.6 }, ...lightUniforms() },
    vertexShader: VERT, fragmentShader: wash ? WASH_FS : FLOOR_FS,
    transparent: wash || alpha < 1, depthWrite: !wash && !ghost, side: wash ? THREE.BackSide : THREE.DoubleSide,
  });
}
/** put the lamps [{ x, y, z, r, c (Vector3) }] into a light material; strength and wash height come from the settings */
export function fillLights(m, lights, k, settings) {
  const U = m.uniforms;
  U.uCount.value = lights.length; U.uStr.value = settings.glowStrength * k; U.uH.value = settings.glowHeight;
  lights.forEach((l, i) => { U.uPos.value[i].set(l.x, l.y, l.z, l.r); U.uCol.value[i].copy(l.c); });
}
