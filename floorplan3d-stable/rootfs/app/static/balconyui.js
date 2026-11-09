/* 🏗 The balcony / roof terrace fields of a room (#646, before in props.js): the tick "Balkon / Dachterrasse" (an open room: no roof, a
 * railing on every edge without a wall), and when it is set: the railing (metal, glass, wood), the supports down to the ground and a line
 * that says whether the room hangs free (a balcony with a plate under it) or lies on the house or the ground. The rules: balcony.js. */
import { RAILS, cleanRail } from './balcony.js';

const OPEN_COLOR = '#a58a63', ROOM_COLOR = '#8a7f70';

/** ui: { t, field, snapshot(), changed(), render(), free(id) (does the room hang free: balcony3d.js) } */
export function balconyFields(body, it, ui) {
  const { t } = ui;
  const tc = document.createElement('input'); tc.type = 'checkbox'; tc.checked = !!it.terrace; tc.id = 'roomTerrace';
  tc.addEventListener('change', () => {
    ui.snapshot();
    if (tc.checked) { it.terrace = true; if (!it.color || it.color === ROOM_COLOR) it.color = OPEN_COLOR; } else {
      delete it.terrace; delete it.rail; delete it.posts;
      if (it.color === OPEN_COLOR) it.color = ROOM_COLOR;
    }
    ui.changed(); ui.render();
  });
  const tl = document.createElement('label'); tl.className = 'chk'; tl.title = t('prop.terraceHint'); tl.append(tc, document.createTextNode(' ' + t('prop.terrace')));
  body.append(tl);
  if (!it.terrace) return;
  const rail = document.createElement('select'); rail.id = 'roomRail';
  RAILS.forEach((r) => rail.add(new Option(t(`balc.${r}`), r)));
  rail.value = cleanRail(it.rail);
  rail.addEventListener('change', () => {
    ui.snapshot();
    if (rail.value === 'metal') delete it.rail; else it.rail = rail.value;   // metal is the default: not stored
    ui.changed();
  });
  body.append(ui.field(t('balc.rail'), rail));
  const free = !!ui.free?.(it.id);
  const pc = document.createElement('input'); pc.type = 'checkbox'; pc.checked = !!it.posts; pc.id = 'roomPosts';
  pc.addEventListener('change', () => { ui.snapshot(); if (pc.checked) it.posts = true; else delete it.posts; ui.changed(); });
  const pl = document.createElement('label'); pl.className = 'chk'; pl.title = t('balc.postsHint'); pl.append(pc, document.createTextNode(' ' + t('balc.posts')));
  const hint = document.createElement('p'); hint.className = 'sub'; hint.id = 'balconyHint'; hint.dataset.free = free ? '1' : '0';
  hint.textContent = t(free ? 'balc.free' : 'balc.onTop');
  body.append(pl, hint);
}
