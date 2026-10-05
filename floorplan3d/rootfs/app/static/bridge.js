// Metal bridge / walkway between two building parts (#189): a grating deck on two steel beams with a railing on both sides.
// Pure geometry, no three.js (unit test: tests/bridge.test.mjs). Local frame: length along x, centred on the device, the walking
// surface at y = 0 (the floor level of the storey it is placed on).

export const BRIDGE = { len: 3, width: 1.2, minLen: 0.5, maxLen: 30, minWidth: 0.5, maxWidth: 5, railH: 1.0, postStep: 1.0 };

const clamp = (v, lo, hi, def) => (Number.isFinite(+v) && v !== null && v !== '' ? Math.max(lo, Math.min(hi, +v)) : def);
/** length and width of a bridge device, with defaults and limits */
export function bridgeSize(d) {
  return { len: clamp(d?.len, BRIDGE.minLen, BRIDGE.maxLen, BRIDGE.len), width: clamp(d?.w, BRIDGE.minWidth, BRIDGE.maxWidth, BRIDGE.width) };
}

/** the boxes of the bridge: { kind: deck | beam | post | rail, w (x), h (y), d (z), x, y (bottom), z } */
export function bridgeParts(d) {
  const { len, width } = bridgeSize(d), parts = [];
  parts.push({ kind: 'deck', w: len, h: 0.06, d: width, x: 0, y: -0.06, z: 0 });
  [-1, 1].forEach((s) => parts.push({ kind: 'beam', w: len, h: 0.2, d: 0.08, x: 0, y: -0.26, z: s * (width / 2 - 0.04) }));
  if (d?.noRail) return parts;
  const n = Math.max(1, Math.ceil(len / BRIDGE.postStep)), H = BRIDGE.railH;
  [-1, 1].forEach((s) => {
    const z = s * (width / 2 - 0.03);
    for (let i = 0; i <= n; i++) parts.push({ kind: 'post', w: 0.05, h: H, d: 0.05, x: -len / 2 + (len * i) / n, y: 0, z });
    parts.push({ kind: 'rail', w: len, h: 0.05, d: 0.06, x: 0, y: H - 0.05, z });            // hand rail
    parts.push({ kind: 'rail', w: len, h: 0.03, d: 0.03, x: 0, y: H * 0.5, z });             // knee rail
  });
  return parts;
}
