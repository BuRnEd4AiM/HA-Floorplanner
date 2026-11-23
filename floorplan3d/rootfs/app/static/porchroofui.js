/* 🏠 A canopy over a door in the properties panel (#786): the button "＋ Vordach über die Tür" at a door that leads outside (props.js, mark
 * 'porch', in "✨ Neu" the section 🏠 Vordach) and the fields of the canopy itself (width, depth, height, pitch, posts, cover; mark
 * 'special' of a device). The rules are in porchroof.js. */
import { porchSize, porchAtDoor, PORCH_COVERS } from './porchroof.js';
import { outerDoors } from './levels.js';

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const r3 = (v) => Math.round(v * 1000) / 1000;

/** at a door that leads outside: "＋ Vordach über die Tür". u: { t, snapshot(), changed(), select(sel), setStatus(txt), uid(), floor() (the
 *  floor of the door) }. Returns false when the door does not lead outside */
export function porchDoorFields(u, body, op) {
  const { t } = u, f = u.floor();
  const doors = outerDoors(f, null);
  if (!doors.some((q) => q.op.id === op.id)) return false;
  const has = (f.devices || []).find((d) => d.type === 'porchroof' && d.door === op.id);
  const box = make('div', 'porchBox'); box.id = 'porchBox';
  box.append(make('p', 'plotHead', `🏠 ${t('porch.title')}`));
  const b = make('button', '', has ? t('porch.show') : t('porch.add')); b.type = 'button'; b.id = 'porchAdd';
  b.addEventListener('click', () => {
    if (has) { u.select({ kind: 'device', id: has.id }); return; }
    const at = porchAtDoor(doors, op.id);
    if (!at) return;
    u.snapshot();
    const d = { id: u.uid(), type: 'porchroof', name: t('dev.porchroof'), x: at.x, z: at.z, y: 0, rot: at.rot, scale: 1, w: at.w, h: at.h, door: op.id, entity: '' };
    (f.devices ||= []).push(d);
    u.changed();
    u.select({ kind: 'device', id: d.id });
    u.setStatus(t('porch.done'));
  });
  box.append(b, make('p', 'sub', t('porch.help')));
  body.append(box);
  return true;
}

/** the fields of a canopy (device `porchroof`). u: { t, field(label, input), lenInput(get, set, opts), inp(type, value, onChange, opts),
 *  snapshot(), changed(), render() }. Its depth changes towards the front: the back edge stays at the wall */
export function porchFields(u, body, it) {
  const { t } = u, s = porchSize(it);
  const deeper = (v) => {
    const d1 = porchSize({ d: v }).d, dd = (d1 - porchSize(it).d) / 2, r = ((+it.rot || 0) * Math.PI) / 180;   // from what it is now (a change can come twice)
    it.d = d1;
    if (Math.abs(dd) > 1e-6) { it.x = r3((+it.x || 0) + Math.sin(r) * dd); it.z = r3((+it.z || 0) + Math.cos(r) * dd); }
  };
  body.append(u.field(t('porch.w'), Object.assign(u.lenInput(() => s.w, (v) => { it.w = porchSize({ w: v }).w; }, { min: 0.8, step: 0.1 }), { id: 'porchW' })));
  body.append(u.field(t('porch.d'), Object.assign(u.lenInput(() => s.d, deeper, { min: 0.6, step: 0.1 }), { id: 'porchD' })));
  body.append(u.field(t('porch.h'), Object.assign(u.lenInput(() => s.h, (v) => { it.h = porchSize({ h: v }).h; }, { min: 1.9, step: 0.05 }), { id: 'porchH' })));
  body.append(u.field(t('porch.pitch'), u.inp('number', s.pitch, (v) => { it.pitch = porchSize({ pitch: v }).pitch; }, { step: 1, min: 5, max: 35, id: 'porchPitch' })));
  const pc = make('input'); pc.type = 'checkbox'; pc.id = 'porchPosts'; pc.checked = s.posts;
  pc.addEventListener('change', () => { u.snapshot(); if (pc.checked) delete it.noPosts; else it.noPosts = true; u.changed(); });
  body.append(u.field(t('porch.posts'), pc));
  const cov = make('div', 'plotSeg'); cov.id = 'porchCover';
  PORCH_COVERS.forEach((k) => {
    const b = make('button', k === s.cover ? 'active' : '', t(`porch.cover.${k}`)); b.type = 'button'; b.dataset.v = k; b.setAttribute('aria-pressed', String(k === s.cover));
    b.addEventListener('click', () => { u.snapshot(); if (k === 'tiles') delete it.cover; else it.cover = k; u.changed(); u.render(); });
    cov.append(b);
  });
  body.append(u.field(t('porch.cover'), cov));
  body.append(make('p', 'sub', t('porch.fieldsHelp')));
}
