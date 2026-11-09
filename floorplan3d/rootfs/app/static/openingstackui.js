/* Two doors / windows one above the other (#694, ChrisSN86: a high window over each terrace door, with wall between them and a roller
 * shutter of its own) in the properties of a door or window: the other one of the pair as a button ("⇅ Darüber: Fenster" /
 * "⇅ Darunter: Tür") that selects it, and "＋ Fenster darüber" when the wall has room above it (25 cm of wall between, 15 cm under the
 * top of the wall). The rules: openingstack.js (pure, unit test). */
import { neighbours, roomAbove } from './openingstack.js';

/** ui: { t, snapshot(), changed(), select(sel), setStatus(txt), uid(), fmtLen(m) }; body: the panel; it: the door / window; wall: its wall */
export function stackFields(ui, body, it, wall) {
  const { t } = ui;
  if (!wall || wall.dormer) return;                              // a dormer or roof window has its place from the roof
  const { above, below } = neighbours(wall, it);
  const name = (o) => o.name || t(`prop.${o.type}`);
  const row = document.createElement('div'); row.className = 'stackRow'; row.id = 'stackRow';
  const button = (id, text, onClick) => {
    const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'stackBtn'; b.textContent = text;
    b.addEventListener('click', onClick);
    row.append(b);
    return b;
  };
  if (above) button('stackAbove', `⇅ ${t('stack.above')}: ${name(above)}`, () => ui.select({ kind: 'opening', id: above.id }));
  if (below) button('stackBelow', `⇅ ${t('stack.below')}: ${name(below)}`, () => ui.select({ kind: 'opening', id: below.id }));
  const room = above ? null : roomAbove(wall, it, +wall.height || 2.6);
  if (room) {
    const b = button('stackAdd', `＋ ${t('stack.add')}`, () => {
      ui.snapshot();
      const o = { id: ui.uid(), type: 'window', style: it.width >= 1.4 ? 'double' : 'single', width: it.width, height: room.height, sill: room.sill, pos: it.pos };
      wall.openings = [...(wall.openings || []), o];
      ui.changed();
      ui.select({ kind: 'opening', id: o.id });
      ui.setStatus(t('stack.added', { sill: ui.fmtLen(room.sill), h: ui.fmtLen(room.height) }));
    });
    b.title = t('stack.addHint');
  }
  if (row.children.length) body.append(row);
}
