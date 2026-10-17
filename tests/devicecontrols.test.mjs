// Unit tests for devicecontrols.js (music, robot vacuum, fan, alarm, button and choice list in the live card, #406; run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = process.env.STATIC_DIR || '/tmp/static';
const D = await import(`${S}/devicecontrols.js`);
const svcs = (p) => p.buttons.map((b) => b.svc);

test('nothing for a domain without controls here, or without a state', () => {
  assert.equal(D.controlPlan('light.x', { state: 'on' }), null);
  assert.equal(D.controlPlan('sensor.t', { state: '21' }), null);
  assert.equal(D.controlPlan('media_player.tv', undefined), null);
  assert.equal(D.controlPlan('', { state: 'on' }), null);
});

test('music player: buttons by what it can do, volume, mute, source, the track', () => {
  const all = D.MEDIA.PAUSE | D.MEDIA.PLAY | D.MEDIA.PREVIOUS | D.MEDIA.NEXT | D.MEDIA.VOLUME_SET | D.MEDIA.VOLUME_MUTE | D.MEDIA.SOURCE | D.MEDIA.TURN_OFF | D.MEDIA.TURN_ON;
  const p = D.controlPlan('media_player.wz', { state: 'playing', ctl: { sf: all, vol: 35, muted: false, title: 'Song', artist: 'Band', sources: ['TV', 'Spotify'], source: 'Spotify' } });
  assert.equal(p.kind, 'media');
  assert.deepEqual(svcs(p), ['media_previous_track', 'media_play_pause', 'media_next_track', 'turn_off']);
  assert.equal(p.buttons[1].label, 'dc.pause');                 // playing: the middle button pauses
  assert.deepEqual(p.volume, { value: 35, muted: false, step: false });
  assert.equal(p.mute, true);
  assert.deepEqual(p.sources, { list: ['TV', 'Spotify'], value: 'Spotify' });
  assert.equal(p.now, 'Song – Band');
  const paused = D.controlPlan('media_player.wz', { state: 'paused', ctl: { sf: all } });
  assert.equal(paused.buttons[1].label, 'dc.play');
  const off = D.controlPlan('media_player.wz', { state: 'off', ctl: { sf: all, vol: 35 } });
  assert.deepEqual(svcs(off), ['turn_on']);                     // off: only switch it on
  assert.equal(off.volume, null);
  const simple = D.controlPlan('media_player.radio', { state: 'playing', ctl: { sf: D.MEDIA.PAUSE | D.MEDIA.VOLUME_STEP } });
  assert.deepEqual(svcs(simple), ['media_play_pause']);         // no next / previous / power where it cannot
  assert.equal(simple.volume.step, true);                       // only louder / quieter
  assert.equal(simple.sources, null);
  const unknown = D.controlPlan('media_player.x', { state: 'idle' });   // no features reported: the usual buttons
  assert.deepEqual(svcs(unknown), ['media_previous_track', 'media_play_pause', 'media_next_track', 'turn_off']);
});

test('robot vacuum: clean / pause / back to the dock by its state, suction', () => {
  const sf = D.VACUUM.START | D.VACUUM.PAUSE | D.VACUUM.RETURN_HOME | D.VACUUM.FAN_SPEED | D.VACUUM.LOCATE;
  const docked = D.controlPlan('vacuum.robo', { state: 'docked', ctl: { sf, speeds: ['Leise', 'Turbo'], speed: 'Leise' } });
  assert.deepEqual(svcs(docked), ['start', 'locate']);          // at the dock: no "back to the dock"
  assert.deepEqual(docked.speeds, { list: ['Leise', 'Turbo'], value: 'Leise' });
  assert.deepEqual(svcs(D.controlPlan('vacuum.robo', { state: 'cleaning', ctl: { sf } })), ['pause', 'return_to_base', 'locate']);
  const paused = D.controlPlan('vacuum.robo', { state: 'paused', ctl: { sf } });
  assert.equal(paused.buttons[0].label, 'dc.resume');
  assert.deepEqual(svcs(D.controlPlan('vacuum.old', { state: 'cleaning', ctl: { sf: D.VACUUM.STOP | D.VACUUM.RETURN_HOME } })), ['stop', 'return_to_base']);
  assert.equal(D.controlPlan('vacuum.robo', { state: 'docked', ctl: { sf: D.VACUUM.START } }).speeds, null);
});

test('fan: speed on its own steps, swing, presets', () => {
  const p = D.controlPlan('fan.decke', { state: 'on', ctl: { sf: D.FAN.SET_SPEED | D.FAN.OSCILLATE | D.FAN.PRESET_MODE, pct: 67, step: 33.33, osc: true, presets: ['Nacht', 'Natur'], preset: 'Nacht' } });
  assert.deepEqual(p.pct, { value: 67, step: 33.33 });
  assert.equal(p.osc, true);
  assert.deepEqual(p.presets, { list: ['Nacht', 'Natur'], value: 'Nacht' });
  const plain = D.controlPlan('fan.bad', { state: 'off', ctl: { sf: 0 } });
  assert.deepEqual([plain.pct, plain.osc, plain.presets], [null, null, null]);      // a fan that only switches: nothing more
  assert.equal(D.controlPlan('fan.x', { state: 'on', ctl: { sf: D.FAN.SET_SPEED } }).pct.value, 0);   // off without a speed: 0
  assert.equal(D.fanStep(50, 33.33), 67);
  assert.equal(D.fanStep(10, 33.33), 0);
  assert.equal(D.fanStep(20, 33.33), 33);
  assert.equal(D.fanStep(57, 1), 57);
  assert.equal(D.fanStep(57, 25), 50);
});

test('alarm panel: arm when it is off, disarm when it is armed, the code where it is needed', () => {
  const sf = D.ALARM.ARM_HOME | D.ALARM.ARM_AWAY | D.ALARM.ARM_NIGHT;
  const off = D.controlPlan('alarm_control_panel.haus', { state: 'disarmed', ctl: { sf, code: 'number', codeArm: false } });
  assert.deepEqual(svcs(off), ['alarm_arm_home', 'alarm_arm_away', 'alarm_arm_night']);
  assert.equal(off.armed, false);
  assert.equal(off.code, null);                                 // arming needs no code here
  const on = D.controlPlan('alarm_control_panel.haus', { state: 'armed_away', ctl: { sf, code: 'number', codeArm: false } });
  assert.deepEqual(svcs(on), ['alarm_disarm']);
  assert.equal(on.code, 'number');
  assert.deepEqual(on.codeFor, ['alarm_disarm']);
  const strict = D.controlPlan('alarm_control_panel.haus', { state: 'disarmed', ctl: { sf, code: 'text', codeArm: true } });
  assert.equal(strict.code, 'text');
  assert.deepEqual(strict.codeFor, ['alarm_arm_home', 'alarm_arm_away', 'alarm_arm_night']);
  assert.deepEqual(svcs(D.controlPlan('alarm_control_panel.x', { state: 'triggered' })), ['alarm_disarm']);   // going off: disarm
  assert.deepEqual(svcs(D.controlPlan('alarm_control_panel.x', { state: 'disarmed' })), ['alarm_arm_home', 'alarm_arm_away']);   // unknown: the usual two
  assert.equal(D.controlPlan('alarm_control_panel.x', { state: 'disarmed' }).code, null);
});

test('button and choice list', () => {
  assert.deepEqual(D.controlPlan('button.klingel', { state: 'unknown' }), { kind: 'button' });
  assert.deepEqual(D.controlPlan('input_button.x', { state: '2026-01-01' }), { kind: 'button' });
  assert.deepEqual(D.controlPlan('input_select.modus', { state: 'Eco', ctl: { options: ['Eco', 'Komfort'] } }), { kind: 'select', options: ['Eco', 'Komfort'], value: 'Eco' });
  assert.deepEqual(D.controlPlan('select.x', { state: 'a' }).options, []);
});
