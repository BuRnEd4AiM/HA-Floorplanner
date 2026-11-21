/* 📡 Funk-Karte on the page (5.17.0, docs/ideen-5.15 picture 3): the button "📡 Funk" beside the colour views shows over every device and
 * window contact of the building shown how well it hears its sender, as a small coloured sign (green good, yellow middle, red weak, with
 * the value), and a card with the counts, the weakest ones (a tap shows it in the house) and a tip; when Home Assistant has switched the
 * signal entities off (Zigbee2MQTT and ZHA ship them off), the card says how to switch them on. The rules are in radiomap.js (tested);
 * the signs are three.js sprites in the floor group of their thing, like the offline signs (offlinemarks.js). */
import * as THREE from './vendor/three.module.min.js';
import { radioRows, counts } from './radiomap.js';

const COLOR = { good: '#23874b', mid: '#c79a10', bad: '#c9443a' };
const H = 0.034;                              // height of a sign: a share of the picture's height (the same size near and far)

/** ctx: $, t, registry (id -> 3D object), layout() (the building shown), states(), signals() ({ of, off }), openings(f), floorShown(fi),
 *  locate(id) (show it in the house), wake() (draw the 3D picture again: it is only drawn when something changed) */
export function initRadioUi(ctx) {
  const { $, t } = ctx;
  let on = false, sig = '';
  const marks = new Map();                     // id -> { sprite, key, obj }
  const box = new THREE.Box3(), tmp = new THREE.Box3(), inv = new THREE.Matrix4(), v = new THREE.Vector3();
  const btn = $('#radioBtn');
  const card = document.createElement('div'); card.id = 'radioCard'; card.className = 'glass'; card.hidden = true;
  $('#sideStack')?.append(card);

  function make(row) {
    const canvas = document.createElement('canvas'), text = `📶 ${row.text}`, g = canvas.getContext('2d');
    g.font = 'bold 44px system-ui, sans-serif';
    const w = Math.ceil(g.measureText(text).width) + 44;
    canvas.width = w; canvas.height = 72;
    const g2 = canvas.getContext('2d');
    g2.fillStyle = COLOR[row.q]; g2.strokeStyle = '#ffffff'; g2.lineWidth = 5;
    g2.beginPath(); g2.roundRect(3, 3, w - 6, 66, 30); g2.fill(); g2.stroke();
    g2.font = 'bold 44px system-ui, sans-serif'; g2.fillStyle = row.q === 'mid' ? '#231600' : '#ffffff'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText(text, w / 2, 38);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: false }));
    const k = row.q === 'good' ? 0.72 : 1;            // the good ones smaller: the weak ones stand out
    sp.scale.set(H * k * (w / 72), H * k, 1);
    sp.center.set(0.5, 0);
    sp.renderOrder = row.q === 'bad' ? 14 : row.q === 'mid' ? 13 : 12;   // the weak ones on top
    sp.userData.radio = row.q;
    return sp;
  }
  function drop(id) {
    const m = marks.get(id);
    if (!m) return;
    m.sprite.removeFromParent(); m.sprite.material.map.dispose(); m.sprite.material.dispose();
    marks.delete(id);
  }
  function place(m, kind) {
    const obj = m.obj, group = kind === 'opening' ? obj.parent?.parent : obj.parent;
    if (!group) return false;
    if (m.sprite.parent !== group) group.add(m.sprite);
    group.updateWorldMatrix(true, true);
    inv.copy(group.matrixWorld).invert();
    box.makeEmpty();
    obj.traverse((o) => {
      if (!o.isMesh || !o.geometry || o.userData.proxy) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      box.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(inv));
    });
    if (box.isEmpty()) return false;
    box.getCenter(v);
    m.sprite.position.set(v.x, box.max.y + 0.08, v.z);
    return true;
  }
  const rows = () => radioRows(ctx.layout(), ctx.states(), ctx.signals().of, ctx.openings);

  function drawCard(list) {
    const c = counts(list), off = ctx.signals().off || [];
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const head = el('div', 'rcHead');
    head.append(el('b', '', `📡 ${t('rd.title')}`));
    const x = el('button', 'rcClose', '✕'); x.type = 'button'; x.title = t('rd.close'); x.addEventListener('click', () => toggle(false));
    head.append(x);
    const out = [head, el('p', 'rcSub', t('rd.sub'))];
    if (list.length) {
      const chips = el('div', 'rcChips');
      [['good', c.good], ['mid', c.mid], ['bad', c.bad]].forEach(([q, n]) => { const s = el('span', `rcChip rc-${q}`, `● ${t(`rd.q.${q}`)} ${n}`); s.dataset.q = q; chips.append(s); });
      out.push(chips);
      const weak = list.filter((r) => r.q !== 'good').slice(0, 6);
      if (weak.length) {
        out.push(el('div', 'rcH', t('rd.weakest')));
        weak.forEach((r) => {
          const b = el('button', `rcRow rc-${r.q}`); b.type = 'button'; b.dataset.id = r.id;
          b.append(el('span', '', r.name), el('small', '', r.floorName), el('b', '', r.text));
          b.addEventListener('click', () => ctx.locate?.(r.id));
          out.push(b);
        });
      }
      out.push(el('p', 'rcTip', `💡 ${t(c.bad ? 'rd.tipBad' : 'rd.tipGood')}`));
    } else out.push(el('p', 'rcTip', t('rd.none')));
    if (off.length) {
      const d = el('details', 'rcOff'); d.dataset.off = off.length;
      d.append(el('summary', '', t('rd.off', { n: off.length })), el('p', '', t('rd.offHow')));
      const ul = el('ul', ''); off.slice(0, 8).forEach((e) => ul.append(el('li', '', e))); d.append(ul);
      out.push(d);
    }
    card.replaceChildren(...out);
  }

  /** show the signs and the card again (after a change of the states, a new building, a rebuilt house) */
  function update() {
    if (btn) btn.hidden = !(Object.keys(ctx.signals().of || {}).length || (ctx.signals().off || []).length);
    if (!on) { if (marks.size) { [...marks.keys()].forEach(drop); ctx.wake?.(); } card.hidden = true; return; }
    const list = rows(), want = new Map(list.map((r) => [r.id, r]));
    marks.forEach((m, id) => { const r = want.get(id); if (!r || ctx.registry.get(id) !== m.obj || m.key !== r.text + r.q) drop(id); });
    list.forEach((r) => {
      const obj = ctx.registry.get(r.id);
      if (!obj) return;
      let m = marks.get(r.id);
      if (!m) { m = { sprite: make(r), key: r.text + r.q, obj }; marks.set(r.id, m); }
      m.sprite.visible = place(m, r.kind) && obj.visible !== false && (ctx.floorShown?.(r.floor) ?? true);
    });
    const s = JSON.stringify([list.map((r) => [r.id, r.text, r.q]), ctx.signals().off?.length, t('rd.title')]);
    if (s !== sig || card.hidden) { sig = s; drawCard(list); }
    card.hidden = false;
    ctx.wake?.();
  }
  function toggle(v = !on) {
    on = v;
    btn?.classList.toggle('active', on);
    btn?.setAttribute('aria-pressed', String(on));
    sig = '';
    update();
  }
  btn?.addEventListener('click', () => toggle());
  return { update, toggle, on: () => on, clear: () => [...marks.keys()].forEach(drop), shown: (id) => !!marks.get(id)?.sprite.visible,
    quality: (id) => marks.get(id)?.sprite.userData.radio ?? null };
}
