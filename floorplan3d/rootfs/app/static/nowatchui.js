/* The tick "🙈 Nicht überwachen" (#780) in the properties of a device, a door / window and in the floor panel: what is only drawn (the flat
 * upstairs that belongs to someone else) is never offline. The rule lives in nowatch.js. */
import { setNoWatch } from './nowatch.js';

const IDS = { device: 'devNoWatch', opening: 'openNoWatch', floor: 'floorNoWatch' };

/** the tick and a line under it into body; ui: { t, snapshot(), changed(), floorOff (the whole floor is left out: the tick of a thing on it
 *  shows that and is greyed out) }; kind: 'device' | 'opening' | 'floor' */
export function noWatchField(ui, body, it, kind) {
  const { t } = ui;
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = IDS[kind];
  cb.checked = !!it.noWatch || (kind !== 'floor' && !!ui.floorOff);
  cb.disabled = kind !== 'floor' && !!ui.floorOff;
  cb.addEventListener('change', () => { ui.snapshot(); setNoWatch(it, cb.checked); ui.changed(); });
  const lb = document.createElement('label'); lb.className = 'chk nwChk'; lb.title = t(`nw.${kind}Hint`);
  lb.append(cb, document.createTextNode(' 🙈 ' + t(kind === 'floor' ? 'nw.floor' : 'nw.thing')));
  const p = document.createElement('p'); p.className = 'sub'; p.id = `${IDS[kind]}Hint`;
  p.textContent = t(kind !== 'floor' && ui.floorOff ? 'nw.byFloor' : `nw.${kind}Hint`);
  body.append(lb, p);
  return lb;
}
