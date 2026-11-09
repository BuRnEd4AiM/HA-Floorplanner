/* A picture on the wall (device type 'picture', step 20 of the split, part 3, #137): a dark frame with the uploaded image on a plane; the
 * image file lives in the add-on (api/backgrounds/<name>). The size rule is pure (unit test: tests/picture.test.mjs). */
import * as THREE from './vendor/three.module.min.js';
import { imageSize } from './background.js';

/** the picture's frame in metres: `w` wide (0.6 m by default), `ar` = height / width (3:4 by default) */
export function pictureSize(d) {
  const w = d.w || 0.6;
  return { w, h: w * (d.ar || 0.75) };
}

/** ctx: snapshot(), changed(), renderProps() */
export function initPictures(ctx) {
  const loader = new THREE.TextureLoader();
  /** draw picture d into its model: the frame and the image (light grey until it has loaded) */
  function setPicture(model, d) {
    model.clear();
    const { w, h } = pictureSize(d);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6 }));
    const art = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.05, w - 0.06), Math.max(0.05, h - 0.06)), new THREE.MeshBasicMaterial({ color: 0xc9d6e2 }));
    art.position.z = 0.0155;
    model.add(frame, art);
    if (d.img) loader.load(`api/backgrounds/${encodeURIComponent(d.img)}`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      art.material.map = tex; art.material.color.set(0xffffff); art.material.needsUpdate = true;
    });
  }
  /** upload an image file for picture d; the picture takes the image's shape (and 0.8 m width if it had none) */
  async function uploadPicture(file, d) {
    if (!file) return;
    const [nw, nh] = await imageSize(file);
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch('api/backgrounds', { method: 'POST', body: fd });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
    const { name } = await r.json();
    ctx.snapshot(); d.img = name; d.ar = +(nh / nw).toFixed(5); d.w ||= 0.8;
    ctx.changed(); ctx.renderProps();
  }
  return { setPicture, uploadPicture };
}
