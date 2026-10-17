/* Labels over the rooms in 3D (#430): live mode on wide screens, over every room of the open floor a glass label with its name, the
 * temperature, how many lights are on (the edge in their colour), 🪟 for an open window and a green dot when somebody is there. Either the
 * labels or the devices (the owner's wish): while the labels show, the devices' balls and value labels are off and the room names lying on
 * the floor step aside; a tapped room (or label) shows its devices. HTML over the picture, moved along with the camera every frame (place), filled
 * again only when a label changed (update). What a label shows and when they show comes from roomtiles.js (tested). The View menu switches
 * between "room labels" and "devices" (also in the settings). */
import * as THREE from './vendor/three.module.min.js';
import { roomSummary, labelTexts, labelsShown, labelHeight, stackLabels } from './roomtiles.js';
import { roomCenter } from './floorbuild.js';

const hex = (c) => '#' + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NAME_Y = 0.45;                               // where floorbuild.js puts the room name over the floor
const STEM = 8;                                    // px: the line from a label down to its room (longer when the label was pushed up)

/** ctx: $, t, layout(), floorIdx(), houseMode(), focusedRoom(), settings(), states(), isLive(), view3d() (the 3D view is shown), elev(i),
 *  camera, canvas, placed(floor), areaEntities(room), isOn(entity), isOpen(entity), openingEntities(opening), commitSettings(), lang(), imperial(),
 *  quiet(on) (the devices' balls off while the labels show), changed() (draw the states again: the balls and value labels come or go),
 *  openRoom(id) (what a tap on a label does: the room opens with its devices) */
export function initRoomLabels(ctx) {
  const { $, t, camera, canvas } = ctx;
  const box = $('#roomLabels');
  const names = [];                                // { f, id, sp }: the room names on the floors built (floorbuild.js)
  let pills = [], last = '', shown = false;
  const v = new THREE.Vector3();
  $('#roomLabelsToggle').addEventListener('click', () => { $('#setRoomLabels').checked = ctx.settings().roomLabels === false; ctx.commitSettings(); });
  box.addEventListener('click', (e) => { const p = e.target.closest('[data-room]'); if (p) ctx.openRoom?.(p.dataset.room); });

  // phones, the dashboard card and a room tablet (its one room) have no room for them, like the room tiles
  const cls = document.body.classList, phone = window.matchMedia?.('(max-width: 760px)');
  const wide = () => !phone?.matches && !cls.contains('card') && !cls.contains('roomtablet');
  const isShown = () => labelsShown({ on: ctx.settings().roomLabels !== false, live: ctx.isLive(), wide: wide(), house: ctx.houseMode(),
    focused: ctx.focusedRoom(), view3d: ctx.view3d() });
  /** the room names on the open floor hide while the labels show */
  function hideNames(on) {
    const f = ctx.layout().floors[ctx.floorIdx()];
    names.forEach((n) => { n.sp.visible = !(on && n.f === f); });
  }
  function update() {
    const on = ctx.settings().roomLabels !== false, btn = $('#roomLabelsToggle');
    btn.classList.toggle('active', on);
    btn.textContent = `${t('nav.roomView')}: ${t(on ? 'nav.roomView.labels' : 'nav.roomView.devices')}`;
    shown = isShown();
    ctx.quiet?.(shown);
    hideNames(shown);
    const f = ctx.layout().floors[ctx.floorIdx()];
    if (!shown || !f) { box.hidden = true; box.replaceChildren(); last = ''; pills = []; return; }
    let fmt;
    try { fmt = new Intl.NumberFormat(ctx.lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); } catch { fmt = new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
    const rooms = f.rooms.filter((r) => r.name && r.points.length >= 3);
    const html = rooms.map((r) => {
      const s = roomSummary(r, f, { placed: ctx.placed(f), areaEntities: ctx.areaEntities(r), states: ctx.states(), isOn: ctx.isOn, isOpen: ctx.isOpen, openingEntities: ctx.openingEntities });
      const tx = labelTexts(s, (x) => fmt.format(x), ctx.imperial());
      const col = s.lights ? (s.rgb ? hex(s.rgb) : '#ffcf70') : '';
      return `<div class="rlPill glass${col ? ' lit' : ''}" data-room="${esc(r.id)}"${col ? ` style="--lc:${col}"` : ''}>`
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
      return { el, at, x: NaN, y: NaN, up: 0, w: el?.offsetWidth || 0, h: el?.offsetHeight || 0 };
    });
  }
  /** every frame: the labels follow the camera; they (and with them the devices) come or go when what decides it changed (live mode, floor,
   *  a room opened ...) */
  function place() {
    if (isShown() !== shown) { if (ctx.changed) ctx.changed(); else update(); }
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
    const up = stackLabels(vis.map((q) => ({ x: q.x, y: q.y, w: q.p.w, h: q.p.h })), STEM);   // labels on each other move apart, upwards (roomtiles.js)
    vis.forEach(({ p, x, y }, k) => {
      if (x === p.x && y === p.y && up[k] === p.up) return;
      p.x = x; p.y = y; p.up = up[k];
      p.el.style.transform = `translate(${x}px, ${y - up[k] - STEM}px) translate(-50%, -100%)`;
      p.el.style.setProperty('--stem', `${STEM + up[k]}px`);
    });
  }
  return {
    update, place,
    /** a room name on a floor that was built (floorbuild.js); clear() before every build */
    nameSprite: (f, id, sp) => names.push({ f, id, sp }),
    clear: () => { names.length = 0; },
    shown: () => shown,
  };
}
