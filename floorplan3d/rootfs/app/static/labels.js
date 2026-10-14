/* Text in the scene (#137, step 24): a sprite with a canvas that shows a room name, a value on a device (dark pill; a heater's temperature:
 * red while it heats, blue while it does not) or a power badge (glowing orange pill); setText(txt, badge, tone) draws it again only when
 * the text changes. three.js and canvas only, no app state. */
import * as THREE from './vendor/three.module.min.js';

/** fill, rim and glow of a value pill by its tone (heating.js pillTone); no tone: the usual dark pill */
const PILL_TONE = {
  heat: { fill: 'rgba(214,46,30,.94)', rim: 'rgba(255,205,190,.9)', glow: 'rgba(255,70,30,.85)' },
  cold: { fill: 'rgba(30,100,205,.92)', rim: 'rgba(190,220,255,.85)', glow: null },
};
const DARK_PILL = { fill: 'rgba(16,22,30,.82)', rim: 'rgba(255,255,255,.35)', glow: null };

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
  s.userData.setText = (txt, badge = false, tone = null) => {
    const key = txt + (badge ? '|b' : '') + (tone ? `|${tone}` : '');
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
    if (pill) {                                    // a readable badge on the device: dark (or red / blue) pill that fits the text
      const w = Math.min(244, g.measureText(txt).width + 30), look = PILL_TONE[tone] || DARK_PILL;
      g.fillStyle = look.fill; g.strokeStyle = look.rim; g.lineWidth = 2;
      if (look.glow) { g.shadowColor = look.glow; g.shadowBlur = 6 * S; }
      g.beginPath(); g.roundRect(128 - w / 2, 10, w, 44, 22); g.fill();
      g.shadowBlur = 0; g.stroke();
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

/** an invisible tap target on a value pill (a heater's temperature, which has no tap ball): a ball of radius r round the pill's middle, a
 *  child of the sprite (it goes where the pill goes); data: what a tap on it hits ({ kind, id }), live mode only like a tap ball. It is only
 *  hit while the pill shows */
let fingerGeo = null, fingerMat = null;          // one ball and one (invisible) material for every pill
export function pillFinger(sprite, data, r = 0.32) {
  fingerGeo ||= new THREE.SphereGeometry(1, 10, 8); fingerMat ||= new THREE.MeshBasicMaterial({ visible: false });
  const f = new THREE.Mesh(fingerGeo, fingerMat);
  f.scale.set(r / sprite.scale.x, r / sprite.scale.y, r / sprite.scale.z);   // the sprite is stretched, the ball is not
  f.userData = { ...data, tapBall: true, touchOnly: true };
  f.raycast = function raycast(ray, hits) { if (sprite.visible) THREE.Mesh.prototype.raycast.call(this, ray, hits); };
  sprite.add(f);
  return f;
}
