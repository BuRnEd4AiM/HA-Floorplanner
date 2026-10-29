/* The page 📷 Kameras of the tab bar (#479, tabs.js): every camera of the plan as a big tile with its still image (renewed every few seconds
 * while the page is open, cameras.js), the ones that see movement first; a tap shows it big and live (Home Assistant's stream, camlive.js)
 * with "show in the plan" and Home Assistant's own dialog. The motion sensors of the plan as a row below. The model is pure (cameraPage in
 * cameras.js, tested); this file draws. */
import { cameraPage } from './cameras.js';

/** ctx: t, el (the page), cams (initCameras: list(), camImage, camLive, haButton), layout(), settings(), showDevice(fi, id) (back to the
 *  house with the camera marked), board (pageboard.js) */
export function initCameraPage(ctx) {
  const { t, el } = ctx;
  let big = null, drawn = '';                     // the camera shown big (entity), what is drawn (so a state change that shows nothing new draws nothing)
  const model = () => cameraPage(ctx.cams.list(), ctx.layout().floors);
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function head(title, sub, m) {
    const h = make('div', 'tpHead');
    h.append(make('h2', '', title));
    if (sub) h.append(make('span', 'tpSub', sub));
    if (m?.motion) h.append(make('span', 'tpChip alert', t('tp.cam.motion', { n: m.motion })));
    return h;
  }
  function tile(c) {
    const b = make('button', `tpCam${c.motion ? ' alert' : ''}`); b.type = 'button'; b.dataset.entity = c.entity;
    if (ctx.settings().cameraImages) b.append(ctx.cams.camImage(c.entity, 'tp-img'));
    else b.append(make('span', 'tpNoImg', t('tp.cam.noImages')));
    b.append(make('span', 'tpName', c.name));
    if (c.place) b.append(make('span', 'tpPlace', c.place));
    if (c.motion) b.append(make('span', 'tpMotion', `🏃 ${t('cam.motionOn')}`));
    b.addEventListener('click', (e) => { e.stopPropagation(); big = c.entity; render(true); }, true);   // before the still image's own tap (Home Assistant's dialog)
    return b;
  }
  /** all cameras: the tiles and the motion sensors as cards of the board (pageboard.js, #484: keys cam:<entity>, sensors) */
  function list(m) {
    const out = [head(`📷 ${t('tab.cameras')}`, t('tp.cam.count', { n: m.cams.length }), m)];
    const grid = make('div', 'tpCams'), items = m.cams.map((c) => ({ key: `cam:${c.entity}`, name: c.name, el: tile(c), width: 1 }));
    out.push(grid);
    if (m.sensors.length) {
      const row = make('div', 'tpSensors');
      row.append(make('h3', '', t('tp.cam.sensors')));
      m.sensors.forEach((s) => {
        const chip = make('button', `tpChip${s.motion ? ' alert' : ''}`, `${s.motion ? '🏃' : '·'} ${s.name}${s.place ? ` · ${s.place}` : ''}`); chip.type = 'button';
        chip.addEventListener('click', () => ctx.showDevice(s.fi, s.id));
        row.append(chip);
      });
      items.push({ key: 'sensors', el: row, width: 4 });
    }
    return { out, grid, items };
  }
  function one(c) {
    const h = head(c.name, c.place, null);
    const back = make('button', 'tpBack', `‹ ${t('tp.cam.all')}`); back.type = 'button';
    back.addEventListener('click', () => { big = null; render(true); });
    h.prepend(back);
    if (c.motion) h.append(make('span', 'tpChip alert', `🏃 ${t('cam.motionOn')}`));
    const show = make('button', '', t('cam.show')); show.type = 'button';
    show.addEventListener('click', () => ctx.showDevice(c.fi, c.id));
    const tools = make('div', 'tpTools'); tools.append(show, ctx.cams.haButton(c.entity));
    h.append(tools);
    const box = make('div', 'tpBig');
    box.append(ctx.settings().cameraImages ? ctx.cams.camLive(c.entity, 'tp-live') : make('span', 'tpNoImg', t('tp.cam.noImages')));
    return [h, box];
  }
  /** draw the page (again only when something shown changed, or force) */
  function render(force = false) {
    const m = model(), c = big && m.cams.find((x) => x.entity === big);
    if (big && !c) big = null;
    const sig = `${big || ''}|${ctx.settings().cameraImages}|${m.sig}`;
    if (!force && sig === drawn) return;
    drawn = sig;
    if (c) { el.replaceChildren(...one(c)); return; }
    const l = list(m);
    el.replaceChildren(...l.out);
    ctx.board.fill('cameras', l.grid, l.items, { min: 320 });
  }
  return {
    render: () => render(true), update: () => render(false),
    has: () => ctx.cams.list().some((x) => x.kind === 'cam'),
    reset: () => { big = null; drawn = ''; el.replaceChildren(); },   // the page was left: no still images fetched for it any more, the next visit starts with all cameras
    big: (entity) => { big = entity; drawn = ''; },                  // the next render shows this camera big (an own card "Kamera", #484)
  };
}
