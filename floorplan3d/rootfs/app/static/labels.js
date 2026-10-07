/* Text in the scene (#137, step 24): a sprite with a canvas that shows a room name, a value on a device (dark pill) or a power badge (glowing
 * orange pill); setText(txt, badge) draws it again only when the text changes. three.js and canvas only, no app state. */
import * as THREE from './vendor/three.module.min.js';

/** a text sprite; anisotropy: the renderer's best texture filtering (sharp when seen at an angle) */
export function textSprite(text, anisotropy, { size = 30, scaleX = 2.4, scaleY = 0.6, depthTest = false, pill = false } = {}) {
  const c = document.createElement('canvas');
  const S = 4;                                    // render text at 4x so it stays sharp when zooming in
  c.width = 256 * S; c.height = 64 * S;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = anisotropy;
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest }));
  s.scale.set(scaleX, scaleY, 1);
  s.renderOrder = 10;
  s.userData.pill = pill;                          // a value pill on a device (the tests check it is one)
  s.userData.setText = (txt, badge = false) => {
    const key = txt + (badge ? '|b' : '');
    if (s.userData.text === key) return;
    s.userData.text = key;
    const g = c.getContext('2d');
    g.setTransform(S, 0, 0, S, 0, 0);
    g.clearRect(0, 0, 256, 64);
    if (badge) {                                   // glowing orange pill, like the power badges in the reference
      const grad = g.createLinearGradient(0, 8, 0, 56);
      grad.addColorStop(0, '#ffd45e'); grad.addColorStop(1, '#ff9d2e');
      g.shadowColor = 'rgba(255,170,40,.9)'; g.shadowBlur = 14;
      g.fillStyle = grad; g.beginPath(); g.roundRect(14, 10, 228, 44, 22); g.fill();
      g.shadowBlur = 0;
      g.font = `700 ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#3b2400'; g.fillText(txt, 128, 33);
      tex.needsUpdate = true;
      return;
    }
    g.font = `600 ${size}px system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (pill) {                                    // a readable badge on the device: dark pill that fits the text
      const w = Math.min(244, g.measureText(txt).width + 30);
      g.fillStyle = 'rgba(16,22,30,.82)'; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(128 - w / 2, 10, w, 44, 22); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.fillText(txt, 128, 33);
      tex.needsUpdate = true;
      return;
    }
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.75)';
    g.strokeText(txt, 128, 32);
    g.fillStyle = '#fff'; g.fillText(txt, 128, 32);
    tex.needsUpdate = true;
  };
  s.userData.setText(text);
  return s;
}
