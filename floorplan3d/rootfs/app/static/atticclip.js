/* Cutting walls at the roof (#260, #265): a wall material gets a few lines of shader that drop every pixel above the roof surface,
 * except inside a dormer. Three's own clipping planes cannot keep a dormer (they only cut), so this is done by hand. The maths is the
 * same as keptAt in attic.js (unit tested there). */
import * as THREE from './vendor/three.module.min.js';

export const MAX_PLANES = 4, MAX_ROOMS = 8;

/** the uniforms for one cut: clip = { planes: [[nx, ny, nz, d]], rooms: [{ x0, x1, z0, z1, top, gh, at, alongX }] }, all in the world frame */
export function atticUniforms(clip) {
  const planes = clip.planes.slice(0, MAX_PLANES), rooms = clip.rooms.slice(0, MAX_ROOMS);
  const fill = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  return {
    atticPlanes: { value: fill(MAX_PLANES, (i) => new THREE.Vector4(...(planes[i] || [0, 0, 0, 1]))) },
    atticNP: { value: planes.length },
    atticBox: { value: fill(MAX_ROOMS, (i) => { const q = rooms[i]; return q ? new THREE.Vector4(q.x0, q.x1, q.z0, q.z1) : new THREE.Vector4(); }) },
    atticTop: { value: fill(MAX_ROOMS, (i) => { const q = rooms[i]; return q ? new THREE.Vector4(q.top, q.gh, q.at, q.alongX ? 1 : 0) : new THREE.Vector4(); }) },
    atticNR: { value: rooms.length },
  };
}

const HEAD = `
uniform vec4 atticPlanes[${MAX_PLANES}];
uniform int atticNP;
uniform vec4 atticBox[${MAX_ROOMS}];
uniform vec4 atticTop[${MAX_ROOMS}];
uniform int atticNR;
varying vec3 vAtticPos;`;
const CUT = `
  {
    bool above = false;
    for (int i = 0; i < ${MAX_PLANES}; i++) { if (i >= atticNP) break; if (dot(atticPlanes[i].xyz, vAtticPos) + atticPlanes[i].w < 0.0) above = true; }
    if (above) {
      bool inside = false;
      for (int i = 0; i < ${MAX_ROOMS}; i++) {
        if (i >= atticNR) break;
        vec4 B = atticBox[i], T = atticTop[i];
        if (vAtticPos.x >= B.x && vAtticPos.x <= B.y && vAtticPos.z >= B.z && vAtticPos.z <= B.w) {
          float u = T.w > 0.5 ? vAtticPos.x : vAtticPos.z;
          float hw = T.w > 0.5 ? (B.y - B.x) * 0.5 : (B.w - B.z) * 0.5;
          if (vAtticPos.y <= T.x + T.y * max(0.0, 1.0 - abs(u - T.z) / hw)) inside = true;
        }
      }
      if (!inside) discard;
    }
  }`;

/** cut material m at the roof (uniforms from atticUniforms, shared by all materials of one floor); m.userData.attic: how many planes */
export function cutAtRoof(m, uniforms) {
  m.userData.attic = uniforms.atticNP.value; m.userData.atticU = uniforms;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vAtticPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n  vAtticPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>${HEAD}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>${CUT}`);
  };
  m.customProgramCacheKey = () => 'attic';
  m.needsUpdate = true;
}

/* Only over one room: the roof over a focused room is drawn see-through, cut to the room's outline (a point-in-polygon test per pixel,
 * the same as pointInPoly in roomclip.js). */
export const MAX_POLY = 32;
/** the uniforms for the outline pts [[x, z], ...] of a room (world frame), at most MAX_POLY corners */
export function polyUniforms(pts) {
  const p = pts.slice(0, MAX_POLY);
  return { polyPts: { value: Array.from({ length: MAX_POLY }, (_, i) => new THREE.Vector2(...(p[i] || [0, 0]))) }, polyN: { value: p.length } };
}
const POLY = `
  {
    bool inPoly = false;
    for (int i = 0; i < ${MAX_POLY}; i++) {
      if (i >= polyN) break;
      vec2 a = polyPts[i], b = polyPts[i == 0 ? polyN - 1 : i - 1];
      if ((a.y > vPolyPos.z) != (b.y > vPolyPos.z) && vPolyPos.x < (b.x - a.x) * (vPolyPos.z - a.y) / (b.y - a.y) + a.x) inPoly = !inPoly;
    }
    if (!inPoly) discard;
  }`;
/** drop every pixel of material m that is not over the room (uniforms from polyUniforms) */
export function clipToPoly(m, uniforms) {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vPolyPos;`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n  vPolyPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec2 polyPts[${MAX_POLY}];\nuniform int polyN;\nvarying vec3 vPolyPos;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>${POLY}`);
  };
  m.customProgramCacheKey = () => 'roompoly';
  m.needsUpdate = true;
}
