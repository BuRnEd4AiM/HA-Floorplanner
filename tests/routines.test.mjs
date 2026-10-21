// Unit tests for routines.js (the page ▶ Abläufe of the tab bar, #483; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/routines.js`);
const states = {
  'scene.filmabend': { state: 'scening' }, 'scene.gute_nacht': { state: 'scening' }, 'script.ich_gehe': { state: 'on' }, 'script.kaffee': { state: 'off' },
  'button.klingel': { state: 'unknown' }, 'light.a': { state: 'on' }, 'media_player.tv': { state: 'playing' }, 'media_player.radio': { state: 'idle' },
  'media_player.sonos': { state: 'on' }, 'lock.haustuer': { state: 'unlocked' }, 'lock.keller': { state: 'locked' },
  'automation.licht_flur': { state: 'on' }, 'automation.rollo': { state: 'off' },
};
const names = { 'scene.filmabend': 'Filmabend', 'scene.gute_nacht': 'Gute Nacht', 'script.ich_gehe': 'Ich gehe', 'script.kaffee': 'Kaffee kochen',
  'media_player.tv': 'Fernseher', 'media_player.sonos': 'Sonos', 'lock.haustuer': 'Haustür', 'automation.rollo': 'Rollos abends' };

test('what can be a routine: scenes, scripts, buttons; the stored list made safe', () => {
  assert.equal(R.canRoutine('scene.a'), true); assert.equal(R.canRoutine('script.a'), true); assert.equal(R.canRoutine('input_button.a'), true);
  assert.equal(R.canRoutine('light.a'), false); assert.equal(R.canRoutine('lock.a'), false); assert.equal(R.canRoutine('scene.A b'), false);
  assert.deepEqual(R.cleanRoutines(['scene.a', 'light.x', 'scene.a', 'script.b', 5]), ['scene.a', 'script.b']);
  assert.equal(R.cleanRoutines(Array.from({ length: 40 }, (_, i) => `scene.s${i}`)).length, R.MAX_ROUTINES);
  assert.deepEqual(R.cleanRoutines(null), []);
  assert.equal(R.cleanRoutine('script.x'), 'script.x'); assert.equal(R.cleanRoutine('light.x'), ''); assert.equal(R.cleanRoutine(undefined), '');
});
test('an icon by the name, else by the kind', () => {
  assert.equal(R.routineIcon('Filmabend'), '🎬'); assert.equal(R.routineIcon('Gute Nacht'), '🌙'); assert.equal(R.routineIcon('Guten Morgen'), '☀️');
  assert.equal(R.routineIcon('Wohnzimmer gemütlich'), '🛋️'); assert.equal(R.routineIcon('Alle Lichter aus'), '💡'); assert.equal(R.routineIcon('Urlaub'), '🏖️');
  assert.equal(R.routineIcon('Ich gehe'), '🚪'); assert.equal(R.routineIcon('Ich bin da'), '🏠');
  assert.equal(R.routineIcon('xyz', 'scene.xyz'), '🎨'); assert.equal(R.routineIcon('xyz', 'script.xyz'), '▶️'); assert.equal(R.routineIcon('xyz', 'button.xyz'), '🔘');
});
test('the buttons: the picked ones in their order (only those Home Assistant knows), else every scene and script by name', () => {
  assert.deepEqual(R.routineButtons(states, names, ['script.kaffee', 'scene.gone', 'scene.filmabend']).map((b) => b.entity), ['script.kaffee', 'scene.filmabend']);
  const all = R.routineButtons(states, names, []);
  assert.deepEqual(all.map((b) => b.name), ['Filmabend', 'Gute Nacht', 'Ich gehe', 'Kaffee kochen']);   // buttons only when picked
  assert.equal(all.find((b) => b.entity === 'script.ich_gehe').running, true);
  assert.equal(all.find((b) => b.entity === 'script.kaffee').running, false);
  assert.equal(R.routineButtons({ 'scene.ohne_name': {} }).at(0).name, 'ohne name');
  assert.deepEqual(R.routineButtons(states, names, ['button.klingel']).map((b) => [b.entity, b.icon]), [['button.klingel', '🔘']]);
  assert.deepEqual(R.routineButtons(states, names, [], ['scene.gute_nacht', '']).map((b) => b.entity), ['scene.filmabend', 'script.ich_gehe', 'script.kaffee']);   // linked to a check
  assert.deepEqual(R.routineButtons(states, names, ['scene.gute_nacht'], ['scene.gute_nacht']).map((b) => b.entity), ['scene.gute_nacht']);           // picked on purpose
  const many = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`scene.s${String(i).padStart(2, '0')}`, {}]));
  assert.equal(R.routineButtons(many).length, R.MAX_ALL);
});
test('what plays and what is unlocked', () => {
  assert.deepEqual(R.playingMedia(states, names), [{ entity: 'media_player.tv', name: 'Fernseher' }, { entity: 'media_player.sonos', name: 'Sonos' }]);
  assert.deepEqual(R.openLocks(states, names), [{ entity: 'lock.haustuer', name: 'Haustür' }]);
  assert.deepEqual(R.playingMedia(null), []); assert.deepEqual(R.openLocks({}), []);
});
test('the rows of a check: only what is open or on; lights and players can be switched off, windows and locks not', () => {
  assert.deepEqual(R.checkRows({}), []);
  const rows = R.checkRows({ open: ['Küche', 'Bad', 'WZ', 'Flur', 'Keller'], lights: ['light.a', 'light.b'], media: [{ entity: 'media_player.tv', name: 'Fernseher' }],
    locks: [{ entity: 'lock.haustuer', name: 'Haustür' }] });
  assert.deepEqual(rows.map((r) => [r.key, r.n, r.fix]), [['open', 5, false], ['lights', 2, true], ['media', 1, true], ['locks', 1, false]]);
  assert.deepEqual(rows[0].names, ['Küche', 'Bad', 'WZ', 'Flur']); assert.deepEqual(rows[2].names, ['Fernseher']);
});
test('the buttons of the check: all fine starts the linked routine; something on: Alles aus and Trotzdem', () => {
  const on = R.checkRows({ lights: ['light.a'] }), open = R.checkRows({ open: ['Küche'] });
  assert.deepEqual(R.checkButtons([], 'script.x'), ['back', 'start']);
  assert.deepEqual(R.checkButtons([], ''), ['ok']);
  assert.deepEqual(R.checkButtons(on, 'script.x'), ['back', 'allOff', 'anyway']);
  assert.deepEqual(R.checkButtons(on, ''), ['back', 'allOff']);
  assert.deepEqual(R.checkButtons(open, 'script.x'), ['back', 'anyway']);
  assert.deepEqual(R.checkButtons(open, ''), ['ok']);                       // nothing to switch, nothing to start: only see it
});
test('Alles aus: the lights on and the players off', () => {
  assert.deepEqual(R.offCalls(['light.a'], [{ entity: 'media_player.tv' }]), [['light.a', 'turn_off'], ['media_player.tv', 'turn_off']]);
  assert.deepEqual(R.offCalls(), []);
});
test('automations by name with their state; the page has something with a scene, a script or a light', () => {
  assert.deepEqual(R.automations(states, names), [{ entity: 'automation.licht_flur', name: 'licht flur', on: true }, { entity: 'automation.rollo', name: 'Rollos abends', on: false }]);
  assert.equal(R.hasRoutines(states), true); assert.equal(R.hasRoutines({ 'light.a': {} }), true);
  assert.equal(R.hasRoutines({ 'sensor.a': {}, 'automation.x': {} }), false); assert.equal(R.hasRoutines(null), false);
  assert.deepEqual(R.CHECKS, ['leave', 'night']);
});
