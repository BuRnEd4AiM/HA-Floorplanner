// Metal bridge / walkway between two building parts (#189): a grating deck on two steel beams with a railing on both sides.
// Pure geometry, no three.js (unit test: tests/bridge.test.mjs). Local frame: length along x, centred on the device, the walking
// surface at y = 0 (the floor level of the storey it is placed on) at its start (-x end); with `rise` the far (+x) end is that much higher
// (or lower), the bridge slopes evenly in between (#222: two houses whose upper floors are not at the same height).

export const BRIDGE = { len: 3, width: 1.2, minLen: 0.5, maxLen: 30, minWidth: 0.5, maxWidth: 5, railH: 1.0, postStep: 1.0, maxRise: 3 };

const clamp = (v, lo, hi, def) => (Number.isFinite(+v) && v !== null && v !== '' ? Math.max(lo, Math.min(hi, +v)) : def);
/** length, width and height difference (far end against the start) of a bridge device, with defaults and limits */
export function bridgeSize(d) {
  return { len: clamp(d?.len, BRIDGE.minLen, BRIDGE.maxLen, BRIDGE.len), width: clamp(d?.w, BRIDGE.minWidth, BRIDGE.maxWidth, BRIDGE.width),
    rise: clamp(d?.rise, -BRIDGE.maxRise, BRIDGE.maxRise, 0) };
}

/** the boxes of the bridge: { kind: deck | beam | post | rail, w (x), h (y), d (z), x, y (bottom at the middle), z, tilt (radians round z, the +x end up) } */
export function bridgeParts(d) {
  const { len, width, rise } = bridgeSize(d), parts = [];
  const tilt = Math.atan2(rise, len), L = Math.hypot(len, rise), mid = rise / 2;       // sloping parts run along the walking line through the middle
  const at = (x) => (rise * (x + len / 2)) / len;                                         // height of the walking surface over the start at x
  parts.push({ kind: 'deck', w: L, h: 0.06, d: width, x: 0, y: mid - 0.06, z: 0, tilt });
  [-1, 1].forEach((s) => parts.push({ kind: 'beam', w: L, h: 0.2, d: 0.08, x: 0, y: mid - 0.26, z: s * (width / 2 - 0.04), tilt }));
  if (d?.noRail) return parts;
  const n = Math.max(1, Math.ceil(len / BRIDGE.postStep)), H = BRIDGE.railH;
  [-1, 1].forEach((s) => {
    const z = s * (width / 2 - 0.03);
    for (let i = 0; i <= n; i++) { const x = -len / 2 + (len * i) / n; parts.push({ kind: 'post', w: 0.05, h: H, d: 0.05, x, y: at(x), z, tilt: 0 }); }
    parts.push({ kind: 'rail', w: L, h: 0.05, d: 0.06, x: 0, y: mid + H - 0.05, z, tilt });   // hand rail
    parts.push({ kind: 'rail', w: L, h: 0.03, d: 0.03, x: 0, y: mid + H * 0.5, z, tilt });    // knee rail
  });
  return parts;
}
