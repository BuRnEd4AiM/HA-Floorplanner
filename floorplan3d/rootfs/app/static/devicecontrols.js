/* More devices switched right in the plan (#406): the live card of a music player or TV (play / pause, previous / next track, volume,
 * mute, source), a robot vacuum (start, pause, back to the dock, find it, suction), a fan (speed, swing, presets), an alarm panel (arm
 * home / away / night, disarm, with its code), a button (press) and a choice list (select / input_select). A thermostat's card uses the
 * heating panel (heatpanel.js, presets and fan modes there too). Which buttons a device gets follows what Home Assistant says it can do
 * (supported_features); without that a device gets the usual ones. The server lets through only these calls (controls.py).
 * controlPlan is pure (unit test: tests/devicecontrols.test.mjs); initDeviceControls draws it. */

/** Home Assistant's feature bits (supported_features) of the domains below */
export const MEDIA = { PAUSE: 1, VOLUME_SET: 4, VOLUME_MUTE: 8, PREVIOUS: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256, VOLUME_STEP: 1024, SOURCE: 2048, STOP: 4096, PLAY: 16384 };
export const VACUUM = { PAUSE: 4, STOP: 8, RETURN_HOME: 16, FAN_SPEED: 32, LOCATE: 512, START: 8192 };
export const FAN = { SET_SPEED: 1, OSCILLATE: 2, PRESET_MODE: 8 };
export const ALARM = { ARM_HOME: 1, ARM_AWAY: 2, ARM_NIGHT: 4, ARM_VACATION: 32 };
/** the alarm states in which it is armed (or about to be, or going off): then it can be disarmed */
const ALARM_ON = new Set(['armed_home', 'armed_away', 'armed_night', 'armed_vacation', 'armed_custom_bypass', 'arming', 'pending', 'triggered']);

/** feature f of a device: what Home Assistant reports, every feature when it reports nothing (an older integration, the demo) */
const can = (sf, f) => (Number.isInteger(sf) ? (sf & f) !== 0 : true);
/** a choice list with up to this many options shows them as buttons (#474: "Urlaub" one tap away, like a fan's presets) */
export const CHIPS_MAX = 6;
const btn = (svc, label, icon = '', only = false) => ({ svc, label, icon, ...(only ? { only: true } : {}) });   // only: the sign alone, the word as its tip

/** what the card of entity `id` with state `s` ({ state, ctl }, entitystate.js) offers, or null when the domain has no controls here:
 *   media  { buttons, now: 'title – artist', volume: { value, muted, step } | null, mute, sources: { list, value } | null }
 *   vacuum { buttons, speeds: { list, value } | null }
 *   fan    { pct: { value, step } | null, osc: true | false | null, presets: { list, value } | null }
 *   alarm  { armed, buttons, code: 'number' | 'text' | null (what the code field takes), codeFor: [services that need the code] }
 *   button {} · select { options, value, chips (few options: buttons side by side instead of a drop-down, #474) }
 * buttons: [{ svc, label (key of i18n.js), icon, only (show the icon alone, a play / pause / next ... button) }] */
export function controlPlan(id, s) {
  if (!id || !s) return null;
  const domain = id.split('.')[0], c = s.ctl || {}, sf = c.sf, st = s.state;
  if (domain === 'media_player') {
    const on = !['off', 'standby', 'unavailable', 'unknown'].includes(st), buttons = [];
    if (on) {
      if (can(sf, MEDIA.PREVIOUS)) buttons.push(btn('media_previous_track', 'dc.prev', '⏮', true));
      if (can(sf, MEDIA.PAUSE) || can(sf, MEDIA.PLAY)) buttons.push(btn('media_play_pause', st === 'playing' ? 'dc.pause' : 'dc.play', st === 'playing' ? '⏸' : '▶', true));
      if (Number.isInteger(sf) && can(sf, MEDIA.STOP)) buttons.push(btn('media_stop', 'dc.stop', '⏹', true));
      if (can(sf, MEDIA.NEXT)) buttons.push(btn('media_next_track', 'dc.next', '⏭', true));
    }
    if (on ? can(sf, MEDIA.TURN_OFF) : can(sf, MEDIA.TURN_ON)) buttons.push(btn(on ? 'turn_off' : 'turn_on', on ? 'live.off' : 'live.on', '⏻'));
    const volume = on && (can(sf, MEDIA.VOLUME_SET) || can(sf, MEDIA.VOLUME_STEP))
      ? { value: Number.isFinite(c.vol) ? c.vol : null, muted: c.muted === true, step: !can(sf, MEDIA.VOLUME_SET) } : null;
    const sources = on && can(sf, MEDIA.SOURCE) && c.sources?.length ? { list: c.sources, value: c.source || '' } : null;
    return { kind: 'media', buttons, now: [c.title, c.artist].filter(Boolean).join(' – '), volume, mute: !!volume && can(sf, MEDIA.VOLUME_MUTE), sources };
  }
  if (domain === 'vacuum') {
    const cleaning = st === 'cleaning', buttons = [];
    if (!cleaning && can(sf, VACUUM.START)) buttons.push(btn('start', st === 'paused' ? 'dc.resume' : 'dc.clean', '▶'));
    if (cleaning && can(sf, VACUUM.PAUSE)) buttons.push(btn('pause', 'dc.pause', '⏸'));
    if (cleaning && !can(sf, VACUUM.PAUSE) && can(sf, VACUUM.STOP)) buttons.push(btn('stop', 'dc.stop', '⏹'));
    if (st !== 'docked' && can(sf, VACUUM.RETURN_HOME)) buttons.push(btn('return_to_base', 'dc.dock', '⌂'));
    if (Number.isInteger(sf) && can(sf, VACUUM.LOCATE)) buttons.push(btn('locate', 'dc.locate', '🔊'));
    const speeds = can(sf, VACUUM.FAN_SPEED) && c.speeds?.length ? { list: c.speeds, value: c.speed || '' } : null;
    return { kind: 'vacuum', buttons, speeds };
  }
  if (domain === 'fan') {
    const step = Number.isFinite(c.step) && c.step > 0 ? c.step : 1;
    return {
      kind: 'fan',
      pct: can(sf, FAN.SET_SPEED) && (Number.isFinite(c.pct) || Number.isInteger(sf)) ? { value: Number.isFinite(c.pct) ? c.pct : 0, step } : null,
      osc: Number.isInteger(sf) ? (can(sf, FAN.OSCILLATE) ? c.osc === true : null) : (typeof c.osc === 'boolean' ? c.osc : null),
      presets: can(sf, FAN.PRESET_MODE) && c.presets?.length ? { list: c.presets, value: c.preset || '' } : null,
    };
  }
  if (domain === 'alarm_control_panel') {
    const armed = ALARM_ON.has(st), code = c.code === 'number' || c.code === 'text' ? c.code : null, buttons = [];
    if (armed) buttons.push(btn('alarm_disarm', 'dc.disarm', '🔓'));
    else {
      if (can(sf, ALARM.ARM_HOME)) buttons.push(btn('alarm_arm_home', 'dc.armHome', '🏠'));
      if (can(sf, ALARM.ARM_AWAY)) buttons.push(btn('alarm_arm_away', 'dc.armAway', '🚪'));
      if (Number.isInteger(sf) && can(sf, ALARM.ARM_NIGHT)) buttons.push(btn('alarm_arm_night', 'dc.armNight', '🌙'));
      if (Number.isInteger(sf) && can(sf, ALARM.ARM_VACATION)) buttons.push(btn('alarm_arm_vacation', 'dc.armVacation', '🧳'));
    }
    const codeFor = !code ? [] : buttons.map((b) => b.svc).filter((v) => v === 'alarm_disarm' || c.codeArm !== false);
    return { kind: 'alarm', armed, buttons, code: codeFor.length ? code : null, codeFor };
  }
  if (domain === 'button' || domain === 'input_button') return { kind: 'button' };
  if (domain === 'select' || domain === 'input_select') {
    const options = c.options || [];
    return { kind: 'select', options, value: st, chips: options.length > 0 && options.length <= CHIPS_MAX };
  }
  return null;
}

/** the speed a fan slider stands for, on the fan's own steps (a fan with 3 speeds: 33, 67, 100) */
export function fanStep(v, step = 1) {
  const n = Math.max(1, Math.round(100 / step));
  return Math.min(100, Math.max(0, Math.round(Math.round((v / 100) * n) * (100 / n))));
}

/** ctx: t, states(), callService(id, service, data) */
export function initDeviceControls(ctx) {
  const { t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const label = (k) => el('div', 'sub', t(k));
  /** a row of buttons, the one that is chosen now marked */
  function row(items, cls = 'actions') {
    const r = el('div', cls);
    items.forEach(({ text, title, on, click, data }) => {
      const b = el('button', on ? 'on' : '', text); b.type = 'button'; if (title) b.title = title;
      if (data) Object.entries(data).forEach(([k, v]) => { b.dataset[k] = v; });
      b.addEventListener('click', click); r.append(b);
    });
    return r;
  }
  /** a drop-down of names Home Assistant gave (sources, suction, presets, options) */
  function choose(list, value, pick, cls) {
    const sel = el('select', `fxsel ${cls}`);
    if (!list.includes(value)) sel.add(new Option('–', ''));
    list.forEach((o) => sel.add(new Option(o, o)));
    sel.value = list.includes(value) ? value : '';
    sel.addEventListener('change', () => { if (sel.value) pick(sel.value); });
    return sel;
  }
  /** the controls of entity id for the live card, null when it has none here */
  function controls(id) {
    const plan = controlPlan(id, ctx.states()[id]);
    if (!plan) return null;
    const call = (svc, data) => ctx.callService(id, svc, data);
    const wrap = el('div', `devctl devctl-${plan.kind}`);
    const sk = `dc.st.${ctx.states()[id]?.state}`;                   // the state of an alarm or a vacuum in words ("armed away", "docked")
    if ((plan.kind === 'alarm' || plan.kind === 'vacuum') && t(sk) !== sk) wrap.append(el('div', `dc-status ${plan.kind === 'alarm' && plan.armed ? 'armed' : ''}`.trim(), t(sk)));
    const buttons = (list, extra = () => undefined) => row(list.map((b) => ({ text: b.only ? b.icon : `${b.icon} ${t(b.label)}`.trim(), title: t(b.label),
      click: () => call(b.svc, extra(b.svc)), data: { svc: b.svc, ...(b.only ? { only: '1' } : {}) } })));
    if (plan.kind === 'media') {
      if (plan.now) wrap.append(el('div', 'dc-now', `♪ ${plan.now}`));
      if (plan.buttons.length) wrap.append(buttons(plan.buttons));
      if (plan.volume) {
        wrap.append(label('dc.volume'));
        const r = el('div', 'dc-vol');
        if (plan.volume.step || plan.volume.value == null) {
          r.append(row([{ text: '−', title: t('dc.volDown'), click: () => call('volume_down') }, { text: '+', title: t('dc.volUp'), click: () => call('volume_up') }]));
        } else {
          const s = el('input', 'dc-volume'); s.type = 'range'; s.min = 0; s.max = 100; s.value = plan.volume.value;
          s.addEventListener('change', () => call('volume_set', { volume_level: +s.value / 100 }));
          r.append(s, el('span', 'dc-val', `${plan.volume.value} %`));
        }
        if (plan.mute) {
          const m = el('button', plan.volume.muted ? 'on dc-mute' : 'dc-mute', plan.volume.muted ? '🔇' : '🔈'); m.type = 'button';
          m.title = t(plan.volume.muted ? 'dc.unmute' : 'dc.mute');
          m.addEventListener('click', () => call('volume_mute', { is_volume_muted: !plan.volume.muted }));
          r.append(m);
        }
        wrap.append(r);
      }
      if (plan.sources) wrap.append(label('dc.source'), choose(plan.sources.list, plan.sources.value, (v) => call('select_source', { source: v }), 'dc-source'));
    } else if (plan.kind === 'vacuum') {
      if (plan.buttons.length) wrap.append(buttons(plan.buttons));
      if (plan.speeds) wrap.append(label('dc.suction'), choose(plan.speeds.list, plan.speeds.value, (v) => call('set_fan_speed', { fan_speed: v }), 'dc-speed'));
    } else if (plan.kind === 'fan') {
      if (plan.pct) {
        wrap.append(label('dc.speed'));
        const r = el('div', 'dc-vol'), s = el('input', 'dc-fan'); s.type = 'range'; s.min = 0; s.max = 100; s.step = 'any'; s.value = plan.pct.value;
        const val = el('span', 'dc-val', `${plan.pct.value} %`);
        s.addEventListener('input', () => { val.textContent = `${fanStep(+s.value, plan.pct.step)} %`; });
        s.addEventListener('change', () => call('set_percentage', { percentage: fanStep(+s.value, plan.pct.step) }));
        r.append(s, val); wrap.append(r);
      }
      if (plan.osc !== null) wrap.append(row([{ text: `↔ ${t('dc.swing')}`, on: plan.osc, click: () => call('oscillate', { oscillating: !plan.osc }), data: { svc: 'oscillate' } }]));
      if (plan.presets) wrap.append(label('dc.preset'), row(plan.presets.list.map((p) => ({ text: p, on: p === plan.presets.value, click: () => call('set_preset_mode', { preset_mode: p }) })), 'actions dc-chips'));
    } else if (plan.kind === 'alarm') {
      let code = null;
      if (plan.code) {
        code = el('input', 'dc-code'); code.type = 'password'; code.autocomplete = 'off'; code.placeholder = t('dc.code'); code.maxLength = 32;
        if (plan.code === 'number') code.inputMode = 'numeric';
        wrap.append(code);
      }
      wrap.append(buttons(plan.buttons, (svc) => (code && plan.codeFor.includes(svc) && code.value ? { code: code.value } : undefined)));
    } else if (plan.kind === 'button') {
      wrap.append(row([{ text: `⏺ ${t('dc.press')}`, click: () => call('press'), data: { svc: 'press' } }]));
    } else if (plan.kind === 'select' && plan.chips) {
      wrap.append(label('dc.choose'), row(plan.options.map((o) => ({ text: o, on: o === plan.value, click: () => call('select_option', { option: o }), data: { option: o } })), 'actions dc-chips dc-option'));
    } else if (plan.kind === 'select' && plan.options.length) {
      wrap.append(label('dc.choose'), choose(plan.options, plan.value, (v) => call('select_option', { option: v }), 'dc-option'));
    }
    return wrap.childElementCount ? wrap : null;
  }
  return { controls };
}
