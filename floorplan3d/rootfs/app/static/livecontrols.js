/* Live control: switching Home Assistant entities from the plan. Service calls, the light controls (brightness, colour, warm / cold, effects),
 * scene buttons, the "details" button (Home Assistant's own dialog) and the "whole room" block (all lights, the room's scenes).
 * The decisions are pure functions (tested); initLiveControls builds the DOM pieces the live popup and the room panel use. */

/** what can be done with an entity of a domain (the first one is the default action) */
export const ACTIONS = {
  light: ['turn_on', 'turn_off', 'toggle'], switch: ['turn_on', 'turn_off', 'toggle'],
  fan: ['turn_on', 'turn_off', 'toggle'], input_boolean: ['turn_on', 'turn_off', 'toggle'],
  cover: ['open_cover', 'close_cover', 'stop_cover'], lock: ['lock', 'unlock'],
  scene: ['turn_on'], script: ['turn_on'],
};
export const ACTION_LABEL = {
  turn_on: 'live.on', turn_off: 'live.off', toggle: 'live.toggle', open_cover: 'live.open',
  close_cover: 'live.close', stop_cover: 'live.stop', lock: 'live.lock', unlock: 'live.unlock',
};
export const COLOR_PRESETS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#23e0ff', '#0a84ff', '#bf5af2', '#ff2d92'];
export const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgbToHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** the body of a service call: scenes and scripts are always "turned on" (other services such as set_temperature pass through) */
export function serviceBody(entityId, service, data) {
  const domain = entityId.split('.')[0];
  const svc = domain === 'scene' || domain === 'script' ? 'turn_on' : service;
  return { domain, service: svc, entity_id: entityId, ...(data ? { data } : {}) };
}
/** the one-tap action of an entity: toggle where possible, else the first action; null when nothing can be done */
export function quickService(entityId) {
  const acts = ACTIONS[entityId.split('.')[0]];
  if (!acts) return null;
  return acts.includes('toggle') ? 'toggle' : acts[0];
}
/** scenes (scene.*) that set at least one of these entities */
export function scenesWith(states, ids) {
  const set = new Set(ids);
  return Object.entries(states).filter(([id, st]) => id.startsWith('scene.') && (st.members || []).some((m) => set.has(m))).map(([id]) => id);
}
/** effects (Nanoleaf, WLED, Hue ...) that all these lights have */
export function commonEffects(stateList) {
  if (!stateList.length) return [];
  return stateList.map((x) => x.fx || []).reduce((acc, cur) => acc.filter((e) => cur.includes(e)));
}
/** the entities of a domain that belong to a room: placed inside it, or in its Home Assistant area; only those that exist.
 *  env: { devices (every placed entity of the floor), areas, states, pointInPoly } */
export function roomEntityIds(env, room, domain) {
  const ids = new Set(env.devices.filter((d) => d.entity?.startsWith(`${domain}.`) && env.pointInPoly(d.x, d.z, room.points)).map((d) => d.entity));
  (room.area ? env.areas.find((x) => x.id === room.area)?.entities || [] : []).filter((id) => id.startsWith(`${domain}.`)).forEach((id) => ids.add(id));
  return [...ids].filter((id) => env.states[id]);
}

/** ctx: t, states(), entities(), areas(), floor(), entityDevices(f), pointInPoly, onStates, setStatus(txt), afterService() (fetch states when there is no
 *  live channel), canEdit(), settings(), saveEffectColors(), canMoreInfo(), openMoreInfo(id), locked(key) (userlocks.js: 'control' = no switching) */
export function initLiveControls(ctx) {
  const { t } = ctx;
  async function callService(entityId, service, data) {
    if (ctx.locked?.('control')) { ctx.setStatus(t('lock.controlMsg')); return; }
    try {
      const r = await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serviceBody(entityId, service, data)) });
      if (!r.ok) throw new Error(String(r.status));
    } catch { ctx.setStatus(t('live.failed')); return; }
    ctx.afterService();
  }
  function quickAction(entityId) {
    const svc = quickService(entityId);
    if (svc) callService(entityId, svc);
  }
  const scenesOf = (ids) => scenesWith(ctx.states(), ids);
  const nameOf = (id) => ctx.entities().find((e) => e.entity_id === id)?.name || id;

  /** small button that opens Home Assistant's own dialog for the entity (history, logbook, settings); null outside the HA frontend */
  function detailsButton(entityId, compact = false) {
    if (!entityId || !ctx.canMoreInfo() || ctx.locked?.('details')) return null;
    const b = document.createElement('button'); b.type = 'button'; b.className = compact ? 'rp-more mi' : 'mi';
    b.textContent = compact ? 'ⓘ' : `ⓘ ${t('live.details')}`; b.title = t('live.detailsHint');
    b.addEventListener('click', (ev) => { ev.stopPropagation(); ctx.openMoreInfo(entityId); });
    return b;
  }
  function lightControls(ids) {              // one light, or all lights of a room
    const states = ctx.states(), settings = ctx.settings();
    const list = [].concat(ids);
    const sts = list.map((id) => states[id] || {});
    const st = sts.find((x) => ctx.onStates.has(x.state)) || sts[0] || {};
    const all = (svc, data) => list.forEach((id) => callService(id, svc, data));
    const wrap = document.createElement('div'); wrap.className = 'lightctl';
    const lbl = (k) => { const s = document.createElement('div'); s.className = 'sub'; s.textContent = t(k); return s; };
    if (sts.some((x) => x.brightness != null)) {
      const r = document.createElement('input'); r.type = 'range'; r.min = 1; r.max = 100; r.value = st.brightness ?? 100;
      r.addEventListener('change', () => all('turn_on', { brightness_pct: +r.value }));
      wrap.append(lbl('live.brightness'), r);
    }
    wrap.append(lbl('live.color'));
    const sw = document.createElement('div'); sw.className = 'swatches';
    const setRgb = (c) => all('turn_on', { rgb_color: c });
    COLOR_PRESETS.forEach((h) => {
      const b = document.createElement('button'); b.className = 'sw'; b.style.background = h; b.title = h;
      b.addEventListener('click', () => setRgb(hexToRgb(h)));
      sw.append(b);
    });
    const pick = document.createElement('input'); pick.type = 'color'; pick.className = 'sw-pick';
    pick.value = Array.isArray(st.rgb) ? rgbToHex(st.rgb) : '#ffd9a0';
    pick.addEventListener('change', () => setRgb(hexToRgb(pick.value)));
    sw.append(pick);
    wrap.append(sw);
    const wr = document.createElement('div'); wr.className = 'actions';
    [['live.warm', 2700], ['live.cold', 6500]].forEach(([k, kel]) => {
      const b = document.createElement('button'); b.textContent = t(k);
      b.addEventListener('click', () => all('turn_on', { color_temp_kelvin: kel }));
      wr.append(b);
    });
    wrap.append(wr);
    const fx = commonEffects(sts);
    if (fx.length) {
      const sel = document.createElement('select'); sel.className = 'fxsel';
      sel.add(new Option(t('live.effect'), ''));
      fx.forEach((e) => sel.add(new Option(e, e)));
      if (list.length === 1 && st.fxc && fx.includes(st.fxc)) sel.value = st.fxc;
      sel.addEventListener('change', () => { if (sel.value) all('turn_on', { effect: sel.value }); });
      wrap.append(lbl('live.effects'), sel);
      if (list.length === 1 && st.fxc && fx.includes(st.fxc) && ctx.canEdit()) {          // what the effect looks like is not known to HA: let the editor say
        const row = document.createElement('div'); row.className = 'actions';
        const cp = document.createElement('input'); cp.type = 'color'; cp.className = 'sw-pick'; cp.title = t('live.fxColorHint');
        cp.value = Array.isArray(st.rgb) ? rgbToHex(st.rgb) : '#aa50ff';
        cp.addEventListener('change', () => { settings.effectColors = { ...(settings.effectColors || {}), [st.fxc]: cp.value }; ctx.saveEffectColors(); });
        const rs = document.createElement('button'); rs.textContent = '↺'; rs.title = t('live.fxColorReset');
        rs.addEventListener('click', () => { const c = { ...(settings.effectColors || {}) }; delete c[st.fxc]; settings.effectColors = c; ctx.saveEffectColors(); });
        const tx = document.createElement('span'); tx.className = 'sub'; tx.textContent = t('live.fxColor').replace('{fx}', st.fxc);
        row.append(cp, rs, tx); wrap.append(row);
      }
    }
    return wrap;
  }
  function sceneButtons(ids, labelKey) {
    if (!ids.length) return null;
    const wrap = document.createElement('div'); wrap.className = 'sceneList';
    const sh = document.createElement('div'); sh.className = 'sub'; sh.textContent = t(labelKey); wrap.append(sh);
    const row = document.createElement('div'); row.className = 'scenes';
    ids.forEach((id) => {
      const b = document.createElement('button'); b.textContent = nameOf(id);
      b.addEventListener('click', () => callService(id, 'turn_on'));
      row.append(b);
    });
    wrap.append(row);
    return wrap;
  }
  /** the whole room: all lights at once + the room's scenes; null when the room has neither */
  function roomControls(room) {
    const env = { devices: ctx.entityDevices(ctx.floor()), areas: ctx.areas(), states: ctx.states(), pointInPoly: ctx.pointInPoly };
    const lights = roomEntityIds(env, room, 'light'), scenes = [...new Set([...roomEntityIds(env, room, 'scene'), ...scenesOf(lights)])];
    if (!lights.length && !scenes.length) return null;
    const states = ctx.states();
    const wrap = document.createElement('div'); wrap.className = 'roomctl';
    const h = document.createElement('h4'); h.textContent = t('rc.title', { n: room.name || '' }); wrap.append(h);
    if (lights.length) {
      const on = lights.filter((id) => ctx.onStates.has(states[id]?.state)).length;
      const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = t('rc.lights', { on, n: lights.length }); wrap.append(sub);
      const row = document.createElement('div'); row.className = 'actions';
      [['turn_on', 'live.allOn'], ['turn_off', 'live.allOff']].forEach(([svc, k]) => {
        const b = document.createElement('button'); b.textContent = t(k);
        b.addEventListener('click', () => lights.forEach((id) => callService(id, svc)));
        row.append(b);
      });
      wrap.append(row, lightControls(lights));
    }
    if (scenes.length) {
      const sh = document.createElement('div'); sh.className = 'sub'; sh.textContent = t('rc.scenes'); wrap.append(sh);
      const row = document.createElement('div'); row.className = 'scenes';
      scenes.forEach((id) => {
        const b = document.createElement('button'); b.textContent = nameOf(id);
        b.addEventListener('click', () => callService(id, 'turn_on'));
        row.append(b);
      });
      wrap.append(row);
    }
    return wrap;
  }
  return { callService, quickAction, detailsButton, lightControls, sceneButtons, roomControls, scenesWith: scenesOf };
}
