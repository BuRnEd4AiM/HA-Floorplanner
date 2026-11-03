// Mockup only (not in the add-on): a sash frame round every pane that opens, in the window's frame colour, and a handle on the room side.
// It hangs in the pane's pivot, so it tilts and swings with the pane.
window.__sash = (handle = true) => {
  const fp = window.__fp;
  fp.scene.traverse((g) => {
    if (g.userData?.kind !== 'opening' || !g.userData.panePivots) return;
    const frameMat = (g.userData.tint || []).find((x) => x.k === 'frame')?.m;
    const metalMat = (g.userData.tint || []).find((x) => x.k === 'metal')?.m || frameMat;
    if (!frameMat) return;
    const tilts = g.userData.tiltPivots || [];
    g.userData.panePivots.forEach((pv, i) => {
      if (!pv || pv.userData.sash || pv.userData.dir == null) return;
      const glass = pv.children.find((c) => c.isMesh && c.geometry?.parameters?.width);
      if (!glass) return;
      const { width: W, height: H } = glass.geometry.parameters, c = glass.position;
      const b = 0.065, d = 0.07;                           // the profile of the sash: 6.5 cm wide, 7 cm deep
      const Box = glass.geometry.constructor, Mesh = glass.constructor;
      const add = (w, h, dd, x, y, z, mat) => { const m = new Mesh(new Box(w, h, dd), mat); m.position.set(c.x + x, c.y + y, c.z + z); m.castShadow = true; pv.add(m); return m; };
      add(W, b, d, 0, H / 2 - b / 2, 0, frameMat); add(W, b, d, 0, -H / 2 + b / 2, 0, frameMat);
      add(b, H - 2 * b, d, -W / 2 + b / 2, 0, 0, frameMat); add(b, H - 2 * b, d, W / 2 - b / 2, 0, 0, frameMat);
      if (handle) {
        const room = Math.sign(tilts[i]?.userData?.dir || 1);           // the side the pane tilts to is the room
        const side = pv.userData.axis === 'y' ? Math.sign(c.x || 1) : 0; // a side-hinged pane: the handle on the far side
        const hx = side ? side * (W / 2 - b / 2) : 0, hy = side ? 0 : H / 2 - b / 2;
        add(0.03, 0.05, 0.03, hx, hy, room * (d / 2 + 0.015), metalMat);
        add(0.025, 0.13, 0.02, hx, hy - 0.06, room * (d / 2 + 0.035), metalMat);
      }
      pv.userData.sash = true;
    });
  });
};
