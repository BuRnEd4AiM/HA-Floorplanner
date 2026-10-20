/* Labels over the rooms in 3D (#430): live mode (on phones too, smaller, #444), over every room of the open floor a glass label with its
 * name, the temperature, how many lights are on (the edge in their colour), 🪟 for an open window and a green dot when somebody is there. Either the
 * labels or the devices (the owner's wish): while the labels show, the devices' balls and value labels are off and the room names lying on
 * the floor step aside; a tapped room (or label) shows its devices. HTML over the picture, moved along with the camera every frame (place), filled
 * again only when a label changed (update). What a label shows and when they show comes from roomtiles.js (tested). The View menu switches
 * between "room labels" and "devices" (also in the settings). Labels that would lie on each other are tidied (#436): the ones that matter
 * more keep their place, another moves up a row at most, else it shrinks to a small dot over its room. The whole house (#464): no labels
 * and no devices, only the floor cards beside the house. */
import * as THREE from './vendor/three.module.min.js';
import { roomSummary, labelTexts, roomView, labelsShown, labelHeight, labelRank, tidyLabels, liveToggle } from './roomtiles.js';
import { roomCenter } from './floorbuild.js';

const hex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NAME_Y = 0.45;                               // where floorbuild.js puts the room name over the floor
const STEM = 8;                                    // px: the line from a label down to its room (longer when the label was pushed up)

/** ctx: $, t, layout(), floorIdx(), houseMode(), focusedRoom(), settings(), states(), isLive(), view3d() (the 3D view is shown), elev(i),
 *  camera, canvas, placed(floor), areaEntities(room), isOn(entity), isOpen(entity), openingEntities(opening), commitSettings(), lang(), imperial(),
 *  quiet(on) (the devices' balls off while the labels show), changed() (draw the states again: the balls and value labels come or go),
 *  openRoom(id) (what a tap on a label does: the room opens with its devices), goLive() (a tap on the switch in edit mode) */
export function initRoomLabels(ctx) {
  const { $, t, camera, canvas } = ctx;
  const box = $('#roomLabels');
  const names = [];                                // { f, id, sp }: the room names on the floors built (floorbuild.js)
  let pills = [], last = '', shown = false, quiet = false;
  const v = new THREE.Vector3();
  $('#roomLabelsToggle').addEventListener('click', () => {
    const next = liveToggle({ on: ctx.settings().roomLabels !== false, live: ctx.isLive() });   // edit mode: on, and live (roomtiles.js)
    $('#setRoomLabels').checked = next.on; ctx.commitSettings();
    if (next.live) ctx.goLive();
  });
  box.addEventListener('click', (e) => { const p = e.target.closest('[data-room]'); if (p) ctx.openRoom?.(p.dataset.room); });

  // the dashboard card and a room tablet (its one room) have no room for them, like the room tiles; phones have them, smaller (#444)
  const cls = document.body.classList;
  const wide = () => !cls.contains('card') && !cls.contains('roomtablet');
  const state = () => ({ on: ctx.settings().roomLabels !== false, live: ctx.isLive(), wide: wide(), house: ctx.houseMode(),
    focused: ctx.focusedRoom(), view3d: ctx.view3d() });
  /** the room names on the open floor hide while the labels show; in the whole house all of them, nothing but the floor cards (#464) */
  function hideNames() {
    const f = ctx.layout().floors[ctx.floorIdx()], house = ctx.houseMode();
    names.forEach((n) => { n.sp.visible = !(quiet && (house || n.f === f)); });
  }
  function update() {
    const on = ctx.settings().roomLabels !== false, btn = $('#roomLabelsToggle');
    btn.classList.toggle('active', on);
    btn.textContent = `${t('nav.roomView')}: ${t(on ? 'nav.roomView.labels' : 'nav.roomView.devices')}`;
    const s = state();
    quiet = roomView(s); shown = labelsShown(s);
    ctx.quiet?.(quiet);
    hideNames();
    const f = ctx.layout().floors[ctx.floorIdx()];
    if (!shown || !f) { box.hidden = true; box.replaceChildren(); last = ''; pills = []; return; }
    let fmt;
    try { fmt = new Intl.NumberFormat(ctx.lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); } catch { fmt = new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
    const rooms = f.rooms.filter((r) => r.name && r.points.length >= 3), ranks = [];
    const html = rooms.map((r) => {
      const s = roomSummary(r, f, { placed: ctx.placed(f), areaEntities: ctx.areaEntities(r), states: ctx.states(), isOn: ctx.isOn, isOpen: ctx.isOpen, openingEntities: ctx.openingEntities });
      const tx = labelTexts(s, (x) => fmt.format(x), ctx.imperial());
      const col = s.lights ? (s.rgb ? hex(s.rgb) : '#ffcf70') : '';
      ranks.push(labelRank(s));
      return `<div class="rlPill glass${col ? ' lit' : ''}" data-room="${esc(r.id)}" title="${esc(r.name)}"${col ? ` style="--lc:${col}"` : ''}>`
        + (s.occupied ? `<span class="rlDot" title="${esc(t('nav.occupied'))}"></span>` : '') + `<b>${esc(r.name)}</b>`
        + [tx.temp, tx.lights, tx.open].filter(Boolean).map((x) => `<i>${esc(x)}</i>`).join('') + '</div>';
    }).join('');
    box.hidden = false;
    if (html !== last) { box.innerHTML = html; last = html; }
    const h = labelHeight(ctx.settings().wallHeight), y0 = ctx.elev(ctx.floorIdx());
    pills = rooms.map((r, k) => {
      const n = names.find((x) => x.f === f && x.id === r.id);                     // where its name lies (the floor's group may be moved)
      const at = n ? n.sp.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, h - NAME_Y, 0))
        : new THREE.Vector3(roomCenter(r.points)[0], y0 + h, roomCenter(r.points)[1]);
      const el = box.children[k];
      el?.classList.remove('mini');                                                  // measured as a label; place() makes it a dot again if need be
      return { el, at, rank: ranks[k], x: NaN, y: NaN, up: 0, mini: false, w: el?.offsetWidth || 0, h: el?.offsetHeight || 0 };
    });
  }
  /** every frame: the labels follow the camera; they (and with them the devices) come or go when what decides it changed (live mode, floor,
   *  a room opened ...) */
  function place() {
    const s = state();
    if (roomView(s) !== quiet || labelsShown(s) !== shown) { if (ctx.changed) ctx.changed(); else update(); }
    if (!shown || !pills.length) return;
    const w = canvas.clientWidth, hh = canvas.clientHeight;
    const cr = canvas.getBoundingClientRect(), br = box.getBoundingClientRect(), ox = cr.left - br.left, oy = cr.top - br.top;   // 2D + 3D: the 3D view is only part of the stage
    const vis = [];
    pills.forEach((p) => {
      if (!p.el) return;
      v.copy(p.at).project(camera);
      const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      if (!on) { if (p.x !== -1) { p.el.style.display = 'none'; p.x = -1; } return; }
      if (p.x === -1) { p.el.style.display = ''; p.x = NaN; }
      if (!p.w) { p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; }
      vis.push({ p, x: Math.round((v.x + 1) / 2 * w + ox), y: Math.round((1 - v.y) / 2 * hh + oy) });
    });
    const tidy = tidyLabels(vis.map((q) => ({ x: q.x, y: q.y, w: q.p.w, h: q.p.h, rank: q.p.rank, mini: q.p.mini })), { stem: STEM });   // roomtiles.js
    vis.forEach(({ p, x, y }, k) => {
      const { up, mini } = tidy[k];
      if (x === p.x && y === p.y && up === p.up && mini === p.mini) return;
      if (mini !== p.mini) p.el.classList.toggle('mini', mini);
      p.x = x; p.y = y; p.up = up; p.mini = mini;
      p.el.style.transform = `translate(${x}px, ${y - up - STEM}px) translate(-50%, -100%)`;
      p.el.style.setProperty('--stem', `${STEM + up}px`);
    });
  }
  return {
    update, place,
    /** a room name on a floor that was built (floorbuild.js); clear() before every build */
    nameSprite: (f, id, sp) => names.push({ f, id, sp }),
    clear: () => { names.length = 0; },
    /** the devices' balls and value labels are off: the labels show, or the whole house shows nothing but the floor cards (#464) */
    quiet: () => quiet,
  };
}
