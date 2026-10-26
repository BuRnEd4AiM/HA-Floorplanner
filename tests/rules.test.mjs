// Unit tests for rules.js (the pages of the add-on's own heating rules and routines, #546; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/rules.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');
const names = { 'binary_sensor.fenster_wz': 'Fenster Wohnzimmer', 'binary_sensor.fenster_bad': 'Fenster Bad', 'climate.wz': 'Heizung Wohnzimmer', 'light.flur': 'Flurlicht' };
const ctx = { t, lang: 'de', nameOf: (e) => names[e], states: { 'binary_sensor.bewegung': { dc: 'motion' } } };

test('durations, days and when something ran', () => {
  assert.equal(R.duration(30, t), 'fl.sec{"n":30}');
  assert.equal(R.duration(120, t), 'fl.min{"n":2}');
  assert.equal(R.duration(5400, t), 'fl.hour{"n":1} fl.min{"n":30}');
  assert.equal(R.daysText([], 'de', t), 'fl.everyDay');
  assert.equal(R.daysText([4, 0, 1, 2, 3], 'de', t), 'Mo–Fr');
  assert.equal(R.daysText([0, 2], 'de', t), 'Mo, Mi');
  const now = new Date(2026, 9, 26, 9, 0).getTime() / 1000;
  assert.equal(R.ago(now - 20, now, t), 'fl.justNow');
  assert.equal(R.ago(now - 12 * 60, now, t), 'fl.agoMin{"n":12}');
  assert.equal(R.ago(now - 3 * 3600, now, t), 'fl.today{"at":"06:00"}');
  assert.equal(R.ago(now - 10 * 3600, now, t), 'fl.yesterday{"at":"23:00"}');
  assert.equal(R.ago(now - 4 * 86400, now, t), 'fl.agoDays{"n":4}');
  assert.equal(R.ago(null, now, t), '');
  assert.equal(R.hhmm(450), '07:30');
  assert.equal(R.minutes('7:05'), 425);
  assert.equal(R.minutes('x'), null);
});

test('what a block says and a lane in words', () => {
  assert.deepEqual(R.blockWords({ k: 'state', ents: ['binary_sensor.fenster_wz', 'binary_sensor.fenster_bad'], to: 'open' }, ctx),
    { icon: '🪟', text: 'fl.b.state.open{"name":"Fenster Wohnzimmer +1"}', sub: 'Fenster Bad' });
  assert.equal(R.blockWords({ k: 'state', ents: ['binary_sensor.bewegung'], to: 'on' }, ctx).icon, '🏃');
  assert.deepEqual(R.blockWords({ k: 'heat', ents: [], same: true, do: 'temp', v: 21.5 }, ctx), { icon: '🔥', text: 'fl.same.heat', sub: '21,5°' });
  assert.deepEqual(R.blockWords({ k: 'switch', ents: ['light.flur'], same: false, do: 'on', pct: 20 }, ctx), { icon: '💡', text: 'Flurlicht', sub: 'fl.do.on · 20 %' });
  assert.equal(R.blockWords({ k: 'time', at: '06:00', days: [5, 6] }, ctx).sub, 'Sa, So');
  const lane = { blocks: [{ k: 'state', ents: ['binary_sensor.fenster_wz'], to: 'open' }, { k: 'hold', s: 120 }, { k: 'if_outside', op: 'below', v: 15 },
    { k: 'heat', ents: [], same: true, do: 'off' }, { k: 'notify', text: 'Fenster offen' }] };
  assert.equal(R.laneWords(lane, ctx), 'fl.w.when fl.b.state.open{"name":"Fenster Wohnzimmer"} · fl.w.hold{"d":"fl.min{\\"n\\":2}"} · '
    + 'fl.w.onlyIf fl.b.outside.below{"v":"15°"} · fl.w.then fl.same.heat (fl.heat.off), fl.b.notify („Fenster offen“)');
  const light = { blocks: [{ k: 'button' }, { k: 'switch', ents: ['light.flur'], do: 'on' }, { k: 'wait', s: 60 }, { k: 'switch', ents: ['light.flur'], do: 'off' }] };
  assert.equal(R.laneWords(light, ctx), 'fl.w.when fl.b.button · fl.w.then Flurlicht (fl.do.on) · fl.w.wait{"d":"fl.min{\\"n\\":1}"} · fl.w.then Flurlicht (fl.do.off)');
});

test('an automation of Home Assistant in words and two rules for one thermostat', () => {
  const sum = { when: [{ k: 'time', at: ['06:00'] }], more: 0, checks: 1, do: [{ k: 'call', svc: 'climate.set_temperature', ents: ['climate.wz'], temperature: 22 }, { k: 'delay' }] };
  assert.equal(R.sumWords(sum, ctx), '06:00 (fl.s.checks{"n":1}) → Heizung Wohnzimmer 22° , fl.s.delay'.replace(' ,', ','));
  assert.equal(R.sumWords({ when: [{ k: 'state', ents: ['light.flur'], to: 'on' }], do: [{ k: 'call', svc: 'light.turn_off', ents: ['light.flur'] }] }, ctx), 'Flurlicht → on → Flurlicht fl.do.off');   // a state without a text of its own: as Home Assistant says it
  assert.equal(R.sumWords(null, ctx), '');
  const rows = [{ entity: 'automation.morgen', kind: 'automation', on: true, sum }, { entity: 'automation.aus', kind: 'automation', on: false, sum },
    { entity: 'script.x', kind: 'script', on: null, sum }];
  assert.deepEqual(R.clashes('climate.wz', rows, [{ kind: 'heat', rule: 'schedule', room: 'h/wz' }]), ['automation.morgen']);
  assert.deepEqual(R.clashes('climate.wz', rows, [{ kind: 'heat', rule: 'window', room: 'h/wz' }]), []);       // the window rule only pauses
});

test('the blocks of a day of the schedule and what a tap or a drag does', () => {
  const plan = R.defaultPlan();
  assert.deepEqual(R.dayBlocks(plan.days[0], 'night').map((b) => [b.from, b.to, b.level]), [[0, 360, 'night'], [360, 480, 'comfort'], [480, 930, 'eco'], [930, 1350, 'comfort'], [1350, 1440, 'night']]);
  assert.deepEqual(R.dayBlocks([[480, 'comfort']], 'night').map((b) => [b.from, b.level, b.i]), [[0, 'night', -1], [480, 'comfort', 0]]);
  assert.equal(R.dayStart(plan.days, 0), 'night');
  assert.deepEqual(R.planNow(plan, new Date(2026, 9, 26, 7, 44)), { level: 'comfort', until: 480, next: 'eco' });
  assert.deepEqual(R.planNow(plan, new Date(2026, 9, 26, 23, 0)), { level: 'night', until: null, next: null });
  const day = [[480, 'comfort']];
  const first = R.dayBlocks(day, 'night')[0];
  assert.deepEqual(R.cycleBlock(day, first), [[0, 'eco'], [480, 'comfort']]);
  assert.deepEqual(R.cycleBlock(plan.days[0], R.dayBlocks(plan.days[0], 'night')[2])[2], [480, 'comfort']);
  assert.deepEqual(R.moveStart(plan.days[0], 2, 512)[2], [480 + 30, 'eco']);
  assert.deepEqual(R.moveStart(plan.days[0], 2, 100)[2], [375, 'eco']);           // not before its neighbour
  assert.deepEqual(R.moveStart(plan.days[0], 0, 100)[0], [0, 'night']);           // the start of the day stays
  assert.deepEqual(R.splitBlock(day, R.dayBlocks(day, 'night')[1]), [[480, 'comfort'], [960, 'night']]);
  assert.deepEqual(R.removeBlock(plan.days[0], R.dayBlocks(plan.days[0], 'night')[1]).length, 4);
});

test('where the blocks stand, whether a routine is complete, new blocks and the ready-made routines', () => {
  const lane = { blocks: [{ k: 'state' }, { k: 'hold' }, { k: 'if_outside' }, { k: 'heat' }, { k: 'notify' }, { k: 'wait' }, { k: 'restore' }] };
  const L = R.laneLayout(lane, { W: 100, H: 50, gx: 20, gy: 10 });
  assert.deepEqual(L.pos, [[0, 0], [120, 0], [240, 0], [360, 0], [360, 60], [480, 0], [600, 0]]);
  assert.deepEqual(L.edges, [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [5, 6]]);
  assert.equal(L.w, 700);
  assert.equal(L.h, 110);
  assert.equal(R.flowReady({ lanes: [{ blocks: [R.newBlock('button'), { ...R.newBlock('switch'), ents: ['light.flur'] }] }] }), true);
  assert.equal(R.flowReady({ lanes: [{ blocks: [R.newBlock('button'), R.newBlock('switch')] }] }), false);      // no device chosen
  assert.equal(R.flowReady({ lanes: [{ blocks: [R.newBlock('wait')] }] }), false);                              // no trigger first
  assert.equal(R.newBlock('nope'), null);
  assert.equal(R.groupOf('if_sun'), 'and');
  const tpl = R.templates({ 'binary_sensor.fenster_wz': { dc: 'window' }, 'binary_sensor.flur_bewegung': {}, 'light.flur': {}, 'cover.wz': {}, 'cover.garage': {} }, t);
  assert.deepEqual(tpl.map((x) => x.key), ['window', 'motion', 'sunset', 'morning', 'away', 'door']);
  assert.deepEqual(tpl[0].lanes[0].blocks[0].ents, ['binary_sensor.fenster_wz']);
  assert.deepEqual(tpl[2].lanes[0].blocks[1].ents, ['cover.wz']);                                               // never the garage door
  assert.equal(R.flowReady(tpl[5]), false);                                                                      // no front door known
  assert.match(R.newId(() => 0.5), /^f_[a-z0-9]{8}$/);
});

test('what a room\'s heating does now', () => {
  const deg = (v) => `${v}°`, now = 1000000;
  assert.deepEqual(R.roomLine({ why: 'window', since: now - 180, back: 22 }, now, t, deg), { icon: '⏸️', tone: 'pause', text: 'hr.line.window{"n":3,"v":"22°"}' });
  assert.equal(R.roomLine({ why: null, waiting: true }, now, t, deg).tone, 'warn');
  assert.equal(R.roomLine({ why: 'schedule', level: 'comfort', temp: 21 }, now, t, deg).text, 'hr.line.schedule{"v":"21°","level":"hr.level.comfort"}');
  assert.equal(R.roomLine({ why: null }, now, t, deg), null);
  assert.equal(R.roomLine(null, now, t, deg), null);
  assert.equal(R.roomKey('h1', 'r1'), 'h1/r1');
});

test('a routine in Home Assistant (#548): its automations, their state, what saving it there came to', () => {
  assert.equal(R.autoId('f_window', 'l2'), 'fp3d_window_l2');
  assert.ok(R.ours('fp3d_window_l2') && !R.ours('heizung_morgens') && !R.ours(undefined));
  const flow = { id: 'f_flur', ha: true, lanes: [{ id: 'l1', blocks: [] }, { id: 'l2', blocks: [] }] };
  const states = { 'automation.flur': { cid: 'fp3d_flur_l1', run: 0, at: 100 }, 'automation.flur_2': { cid: 'fp3d_flur_l2', run: 1, at: 300 }, 'automation.x': { cid: 'x' } };
  const live = R.flowLive(flow, states, () => null);
  assert.deepEqual(live.lanes.map((x) => x.entity), ['automation.flur', 'automation.flur_2']);
  assert.ok(live.running) && assert.equal(live.last, 300);
  assert.deepEqual(R.flowLive({ ...flow, ha: false }, states, (k) => (k === 'f_flur/l1' ? { running: true, t0: 50 } : null)), {
    running: true, last: 50, lanes: [{ lane: flow.lanes[0], entity: null }, { lane: flow.lanes[1], entity: null }] });
  assert.equal(R.haEditUrl('', 'fp3d_flur_l1'), '/config/automation/edit/fp3d_flur_l1');
  assert.equal(R.haEditUrl('http://192.168.1.10:8123', 'fp3d_a_l1'), 'http://192.168.1.10:8123/config/automation/edit/fp3d_a_l1');
  assert.equal(R.syncWords(null, t), null);
  assert.deepEqual(R.syncWords({ ok: true, ids: ['fp3d_a_l1'], problems: [] }, t), { kind: 'ok', text: 'fe.ha.saved' });
  assert.equal(R.syncWords({ ok: true, problems: [{ why: 'room', soft: true }] }, t).kind, 'warn');
  assert.deepEqual(R.syncWords({ problems: [{ why: 'weather' }] }, t), { kind: 'bad', text: 'fe.ha.cannot{"why":"fe.ha.why.weather"}' });
  assert.equal(R.syncWords({ conflict: ['fp3d_a_l1'] }, t).kind, 'ask');
  assert.equal(R.syncWords({ ok: true, problems: [], missing: true }, t).text, 'fe.ha.missing');
  assert.equal(R.syncWords({ error: 'nohass' }, t).text, 'fe.ha.nohass');
});
