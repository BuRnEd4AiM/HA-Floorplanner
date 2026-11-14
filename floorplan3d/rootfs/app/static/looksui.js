/* The look of stairs, doors and windows in the properties panel and the settings (Miicki's wishes of 2026-11-14):
 * - a stair (#753, stairlook.js): the covering of its treads (the floor coverings of a room, with colour, size and angle) or one colour,
 *   „Wie der Boden von …“ (the floor of the room the stair stands in), the colour of the risers and of the hand rail (a spiral stair: the
 *   only one with a hand rail in 3D so far);
 * - a door or window (#754, doorlook.js): the colour of a door's leaf and frame, of a window's frame; none: the house's;
 * - the house's doors in ⚙ → Außen (#754): the leaf and the frame of the inner doors and of the doors to the outside.
 * The rules are in stairlook.js and doorlook.js (tested); colorrow.js draws one colour. */
import { cleanLook } from './finishes.js';
import { cleanCovering } from './floorcover.js';
import { pointInPoly } from './rooms.js';
import { stairBounds } from './stairs.js';
import { STEP_HEX, RAIL_HEX, STEP_COLORS, RISER_COLORS, RAIL_COLORS, setStairLook, lookOfRoom, treadHex } from './stairlook.js';
import { LEAF_COLORS, FRAME_COLORS, setOpeningLook, cleanOpeningLook, openingColors, leadsOut, DOOR_SETTINGS } from './doorlook.js';
import { colorFields } from './colorrow.js';
import { houseFootprint } from './earth.js';

/** the room of floor f a stair stands in: at its start, else under its middle (H: the storey height) */
export function roomOfStair(f, st, H) {
  const rooms = (f?.rooms || []).filter((r) => (r.points || []).length >= 3);
  const at = (x, z) => rooms.find((r) => pointInPoly(x, z, r.points));
  const hit = at(st.x, st.z);
  if (hit) return hit;
  const b = stairBounds(st, H), lx = (b.x0 + b.x1) / 2, lz = (b.z0 + b.z1) / 2, a = ((st.rot || 0) * Math.PI) / 180;
  return at(st.x + lx * Math.cos(a) + lz * Math.sin(a), st.z - lx * Math.sin(a) + lz * Math.cos(a)) || null;   // stairtool.js turns by rot about y
}

/** ctx: t, field(label, input), snapshot(), changed(), render() (the panel again), floor(), floorH(), finishUi ({ patternSelect,
 *  lookFields }, finishui.js), settings(), windowFrame() (the colour of the window frames of the house, facade.js) */
export function initLooksUi(ctx) {
  const { t } = ctx;
  const edit = (fn) => { ctx.snapshot(); fn(); ctx.changed(); ctx.render(); };
  const head = (txt, id) => { const h = document.createElement('h4'); h.className = 'finHead'; h.id = id; h.textContent = txt; return h; };
  const name = (k) => t(`look.c.${k}`);

  /** the treads, risers and rail of stair st */
  function stairFields(body, st) {
    body.append(head(t('stair.look'), 'stairLookHead'));
    const acc = {
      get: () => (cleanCovering(st.covering) ? { pattern: st.covering, ...cleanLook(st.floorLook) } : null),
      set: (spec) => {
        if (!spec) { delete st.covering; delete st.floorLook; return; }
        st.covering = spec.pattern;
        const l = cleanLook(spec);
        if (l) st.floorLook = l; else delete st.floorLook;
      },
    };
    const s = ctx.finishUi.patternSelect('stairCovering', 'floor', acc.get()?.pattern, t('stair.coverNone'));
    s.title = t('stair.coverHint');
    s.addEventListener('change', () => edit(() => acc.set(s.value ? { pattern: s.value } : null)));
    body.append(ctx.field(t('stair.treads'), s));
    if (acc.get()) ctx.finishUi.lookFields(body, acc, 'stairTread');
    else body.append(...colorFields({ id: 'stairStep', label: t('fin.color'), value: st.color, def: STEP_HEX, list: STEP_COLORS, name, reset: t('look.reset'),
      on: (hex) => edit(() => setStairLook(st, { color: hex })) }));
    const room = roomOfStair(ctx.floor(), st, ctx.floorH());
    if (room) {                                                       // „Wie der Boden von Flur“: the floor of the room it stands in
      const b = document.createElement('button'); b.type = 'button'; b.id = 'stairLikeRoom'; b.className = 'looksBtn';
      b.textContent = `⇣ ${t('stair.likeRoom', { room: room.name || t('prop.room') })}`;
      b.addEventListener('click', () => edit(() => {
        const l = lookOfRoom(room);
        if (l.covering) { st.covering = l.covering; if (l.floorLook) st.floorLook = { ...l.floorLook }; else delete st.floorLook; delete st.color; }
        else { delete st.covering; delete st.floorLook; setStairLook(st, { color: l.color }); }
      }));
      body.append(b);
    }
    body.append(...colorFields({ id: 'stairRiser', label: t('stair.riser'), value: st.riser, def: treadHex(st), list: RISER_COLORS, name, reset: t('stair.riserReset'),
      on: (hex) => edit(() => setStairLook(st, { riser: hex })) }));
    if (st.type === 'spiral') {                                      // only a spiral stair has a hand rail in 3D so far (stairs.js)
      body.append(...colorFields({ id: 'stairRail', label: t('stair.rail'), value: st.rail, def: RAIL_HEX, list: RAIL_COLORS, name, reset: t('look.reset'),
        on: (hex) => edit(() => setStairLook(st, { rail: hex })) }));
    } else { const p = document.createElement('p'); p.className = 'sub'; p.id = 'stairNoRail'; p.textContent = t('stair.noRail'); body.append(p); }
  }

  /** the colours of door or window o in wall w: a door's leaf and frame, a window's frame; none of its own: the house's (said under them) */
  function openingFields(body, o, w) {
    const f = ctx.floor(), outer = o.type === 'door' && leadsOut(w, o, f?.rooms, f ? houseFootprint([f], 0) : null), own = cleanOpeningLook(o.look, o.type) || {};
    const house = openingColors({ type: o.type }, { settings: ctx.settings(), outer, windowFrame: ctx.windowFrame?.() });
    body.append(head(t(o.type === 'door' ? 'door.look' : 'win.look'), 'openLookHead'));
    const one = (part, label, list) => body.append(...colorFields({ id: `open${part[0].toUpperCase()}${part.slice(1)}`, label, value: own[part], def: house[part], list, name,
      reset: t('look.house'), on: (hex) => edit(() => setOpeningLook(o, part, hex)) }));
    if (o.type === 'door' && o.style !== 'gap' && o.style !== 'open') one('leaf', t(o.style === 'garage' ? 'door.gate' : 'door.leaf'), LEAF_COLORS);
    if (o.style !== 'gap') one('frame', t(o.type === 'door' ? 'door.frame' : 'win.frame'), FRAME_COLORS);
    const p = document.createElement('p'); p.className = 'sub'; p.id = 'openLookHint';
    p.textContent = t(o.type === 'window' ? 'win.lookHint' : outer ? 'door.lookHintOuter' : 'door.lookHint');
    body.append(p);
  }
  return { stairFields, openingFields };
}

/** ⚙ → Außen: the leaf and the frame of the inner doors and of the doors to the outside (#754); fill(settings) / read(next) like the other
 *  parts of the settings dialog (settings.js). $: query, t: texts */
export function initDoorSettings({ $, t }) {
  const lists = { doorLeaf: LEAF_COLORS, doorFrame: FRAME_COLORS, outerDoorLeaf: LEAF_COLORS, outerDoorFrame: FRAME_COLORS };
  const none = { doorLeaf: 'set.door.wood', doorFrame: 'set.door.white', outerDoorLeaf: 'set.door.asInner', outerDoorFrame: 'set.door.asInner' };
  const id = (k) => `#set${k[0].toUpperCase()}${k.slice(1)}`;
  return {
    fill(settings) {
      DOOR_SETTINGS.forEach((k) => {
        const sel = $(id(k));
        if (!sel) return;
        sel.replaceChildren(new Option(t(none[k]), ''), ...lists[k].map(([key, hex]) => new Option(t(`look.c.${key}`), hex)));
        const v = settings[k] || '';
        if (v && !lists[k].some(([, hex]) => hex === v)) sel.add(new Option(`${t('look.own')} ${v}`, v));
        sel.value = v;
      });
    },
    read(next) { DOOR_SETTINGS.forEach((k) => { const sel = $(id(k)); if (sel) next[k] = sel.value; }); },
  };
}
