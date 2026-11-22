/* 🕳 The fields of a basement window's light well in the properties panel (#786): the tick "Lichtschacht" (on by itself where the window
 * lies under the ground), its width and how far it reaches out from the wall, and a line that says why (or why not). props.js calls
 * wellFields under the window's roller shutter (mark 'well', in "✨ Neu" the section 🕳 Lichtschacht). The rules are in lightwell.js. */
import { wellSize, setWellSize } from './lightwell.js';

/** u: { t, field(label, input), lenInput(get, set, opts), snapshot(), changed(), fmtLen(m), state: 'on' | 'off' | 'free' | 'inner' | 'none'
 *  (lightwell.js wellState), deep (how far the sill lies under the ground, m; for 'on') }. Returns false when the window has nothing to show */
export function wellFields(u, body, it) {
  const { t } = u;
  if (!['on', 'off', 'free'].includes(u.state)) return false;
  const box = document.createElement('div'); box.id = 'wellBox'; box.className = 'wellBox';
  const head = document.createElement('p'); head.className = 'plotHead'; head.textContent = `🔆 ${t('well.title')}`;
  box.append(head);
  if (u.state !== 'free') {
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'wellOn'; cb.checked = !it.noWell;
    cb.addEventListener('change', () => { u.snapshot(); if (cb.checked) delete it.noWell; else it.noWell = true; u.changed(); });
    box.append(u.field(t('well.on'), cb));
    if (!it.noWell) {
      const s = wellSize(it);
      box.append(u.field(t('well.w'), Object.assign(u.lenInput(() => s.w, (v) => { setWellSize(it, 'wellW', v); }, { min: 0.4, step: 0.05 }), { id: 'wellW' })));
      box.append(u.field(t('well.d'), Object.assign(u.lenInput(() => s.d, (v) => { setWellSize(it, 'wellD', v); }, { min: 0.25, step: 0.05 }), { id: 'wellD' })));
    }
  }
  const line = document.createElement('p'); line.className = 'sub'; line.id = 'wellHint';
  line.textContent = u.state === 'free' ? t('well.free') : u.state === 'off' ? t('well.offHint') : t('well.onHint', { d: u.fmtLen(Math.max(0, u.deep || 0)) });
  box.append(line);
  body.append(box);
  return true;
}
