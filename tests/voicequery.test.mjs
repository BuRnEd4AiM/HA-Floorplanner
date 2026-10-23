// Unit tests for voicequery.js (the voice search: a sentence -> what to show, #509; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const V = await import(`${dir}/voicequery.js`);
const D = await import(`${dir}/devicelist.js`);

const env = {
  lang: 'de', house: 'main', floor: 'eg', user: 'papa',
  houses: [{ id: 'main', name: 'Haus' }, { id: 'el', name: 'Haus Eltern' }],
  floors: [{ house: 'main', id: 'kg', name: 'Keller', kind: 'basement' }, { house: 'main', id: 'eg', name: 'Erdgeschoss', kind: 'floor' },
    { house: 'main', id: 'og', name: 'Obergeschoss', kind: 'floor' }, { house: 'el', id: 'el_eg', name: 'Erdgeschoss', kind: 'floor' }],
  rooms: [{ house: 'main', floor: 'eg', id: 'wz', name: 'WZ EG' }, { house: 'main', floor: 'eg', id: 'ku', name: 'Küche' },
    { house: 'main', floor: 'og', id: 'k1', name: 'Kind 1' }, { house: 'main', floor: 'og', id: 'bad_og', name: 'Bad OG' },
    { house: 'main', floor: 'eg', id: 'bad_eg', name: 'Bad EG' }, { house: 'el', floor: 'el_eg', id: 'el_wz', name: 'Wohnzimmer' },
    { house: 'el', floor: 'el_eg', id: 'el_ws', name: 'Werkstatt' }],
  aliases: [{ say: 'Wohnzimmer', rooms: ['wz'] }, { say: 'Wohnzimmer der Eltern', rooms: ['el_wz'] }, { say: 'mein Zimmer', rooms: ['k1'], user: 'lena' },
    { say: 'unten', floor: 'eg' }],
};
const ask = (text, more = {}) => V.understand(text, { ...env, ...more });

test('fold and words: lower case, no accents, ß, number words as digits', () => {
  assert.equal(V.fold('Küche – Süd! Straße'), 'kuche sud strasse');
  assert.equal(V.fold('Włączone'), 'wlaczone');
  assert.deepEqual(V.tokens('Kind eins'), ['kind', '1']);
  assert.deepEqual(V.tokens('Kind 2'), ['kind', '2']);
  assert.ok(V.sameWord('kuche', 'kuchen') && V.sameWord('fenstern', 'fenster'));
  assert.ok(!V.sameWord('bad', 'badezimmer') && !V.sameWord('bad', 'bade'));
  assert.deepEqual(V.findPhrase(['im', 'kinder', 'zimmer'], ['kinderzimmer']), [{ at: 1, len: 2 }]);   // said apart, named together
  assert.deepEqual(V.findPhrase(['im', 'kinderzimmer'], ['kinder', 'zimmer']), [{ at: 1, len: 1 }]);
});

test('things and states: "Welche Fenster sind offen?", "Ist oben noch Licht an?", "Sind alle Fenster zu?"', () => {
  let q = ask('Welche Fenster sind offen?');
  assert.equal(q.what, 'windows'); assert.equal(q.state, 'open'); assert.equal(q.floor, null); assert.ok(V.isQuestion(q));
  q = ask('Ist oben noch Licht an?');
  assert.equal(q.what, 'lights'); assert.equal(q.state, 'on'); assert.equal(q.floor, 'og'); assert.equal(q.place, 'Obergeschoss');
  q = ask('Sind alle Fenster zu?');
  assert.equal(q.state, 'closed'); assert.ok(q.all);
  q = ask('Ist das Licht an im Keller?');                         // "an" before the place still is the last real word
  assert.equal(q.state, 'on'); assert.equal(q.floor, 'kg');
  assert.equal(ask('Wie sieht es im Keller aus?').state, null);   // "aus" of "aussehen" is not "off"
  assert.equal(ask('Ist alles aus?').state, 'off');
  assert.equal(ask('Ist die Haustür abgeschlossen?').what, 'locks');
  assert.equal(ask('Ist die Haustür abgeschlossen?').state, 'closed');
  assert.equal(ask('Wie warm ist es?').what, 'temp');
  assert.equal(ask('Ist es im Bad feucht?').what, 'humid');
  assert.equal(ask('Welche Batterien sind leer?').state, 'low');
});

test('places: code words (longest first, per user), rooms, floors, other houses', () => {
  let q = ask('Wie sieht es im Wohnzimmer aus?');
  assert.deepEqual(q.rooms, ['wz']); assert.ok(q.alias); assert.equal(q.house, null); assert.ok(!V.isQuestion({ ...q, alias: false }));
  q = ask('Wie sieht\'s im Wohnzimmer der Eltern aus?');
  assert.deepEqual(q.rooms, ['el_wz']); assert.equal(q.house, 'el'); assert.equal(q.place, 'Wohnzimmer der Eltern');
  assert.deepEqual(ask('mein Zimmer').rooms, []);                         // the code word of another user
  assert.deepEqual(ask('mein Zimmer', { user: 'lena' }).rooms, ['k1']);
  q = ask('Ist im Bad oben das Fenster auf?');                            // "Bad OG" by its core and the floor said
  assert.deepEqual(q.rooms, ['bad_og']); assert.equal(q.place, 'Bad OG'); assert.equal(q.state, 'open');
  assert.deepEqual(ask('Licht im Bad').rooms, ['bad_eg', 'bad_og']);       // the same name on two floors: both, the open floor first
  assert.deepEqual(ask('Wie warm ist es in Kind eins').rooms, ['k1']);
  q = ask('Ist das Küchenfenster offen?');                                // a thing written together with the room
  assert.deepEqual(q.rooms, ['ku']); assert.equal(q.what, 'windows');
  q = ask('Wie sieht es in der Werkstatt aus');                           // a room only the other house has
  assert.equal(q.house, 'el'); assert.deepEqual(q.rooms, ['el_ws']);
  q = ask('bei den Eltern');                                              // "Haus Eltern" by its core
  assert.equal(q.house, 'el'); assert.deepEqual(q.rooms, []);
  assert.equal(ask('Rollläden unten').floor, 'eg');                        // a code word for a floor
  assert.equal(ask('Keller').floor, 'kg');
  assert.equal(ask('Wo ist der Staubsauger?').rest, 'staubsauger');
  assert.ok(!V.isQuestion(ask('Wo ist der Staubsauger?')));
});

test('other languages: English with "on" at the end, French, Polish', () => {
  let q = ask('Are the lights on upstairs?', { lang: 'en' });
  assert.equal(q.what, 'lights'); assert.equal(q.state, 'on'); assert.equal(q.floor, 'og');
  assert.equal(ask('Which lights are on in the kitchen', { lang: 'en' }).state, 'on');
  q = ask('Quelles fenêtres sont ouvertes ?', { lang: 'fr' });
  assert.equal(q.what, 'windows'); assert.equal(q.state, 'open');
  q = ask('Czy światła są włączone?', { lang: 'pl' });
  assert.equal(q.what, 'lights'); assert.equal(q.state, 'on');
  assert.equal(ask('Welche Fenster sind offen', { lang: 'xx' }).what, 'windows');   // an unknown language: German
});

/* the answer from the device overview of devicelist.js */
const sq = (x, z, w = 4, d = 4) => [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
const pointInPoly = (x, z, pts) => {
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return x >= Math.min(...xs) && x <= Math.max(...xs) && z >= Math.min(...zs) && z <= Math.max(...zs);
};
const wall = (id, a, b, openings) => ({ id, a, b, openings });
const layout = { floors: [
  { name: 'EG', rooms: [{ id: 'wz', name: 'WZ EG', points: sq(0, 0) }, { id: 'ku', name: 'Küche', points: sq(4, 0) }],
    devices: [{ id: 'd1', type: 'lamp', entity: 'light.wz', x: 1, z: 1 }, { id: 'd2', type: 'lamp', entity: 'light.stehlampe', name: 'Stehlampe', x: 2, z: 2 },
      { id: 'd3', type: 'lock', entity: 'lock.haustuer', name: 'Haustür', x: 0.2, z: 3 }, { id: 'd4', type: 'tv', entity: 'media_player.tv', x: 3, z: 3 }],
    walls: [wall('w1', [0, 0], [8, 0], [{ id: 'o1', type: 'window', pos: 1, entity: 'binary_sensor.f_wz' }, { id: 'o2', type: 'window', pos: 5, entity: 'binary_sensor.f_ku', name: 'Fenster Küche' },
      { id: 'o3', type: 'door', pos: 7, entity: 'binary_sensor.terrasse', name: 'Terrassentür' }, { id: 'o4', type: 'window', pos: 2, shutter: 'roller', shutterEntity: 'cover.rollo_wz' }])] },
  { name: 'OG', rooms: [{ id: 'k1', name: 'Kind 1', points: sq(0, 0) }],
    devices: [{ id: 'd5', type: 'lamp', entity: 'light.k1', x: 1, z: 1 }, { id: 'd6', type: 'sensor', entity: 'binary_sensor.rauch', x: 2, z: 2 }],
    walls: [wall('w2', [0, 0], [4, 0], [{ id: 'o5', type: 'window', pos: 1, entity: 'binary_sensor.f_k1' }])] },
] };
const states = {
  'light.wz': { state: 'on' }, 'light.stehlampe': { state: 'off' }, 'light.k1': { state: 'on' }, 'lock.haustuer': { state: 'unlocked' },
  'media_player.tv': { state: 'off' }, 'binary_sensor.f_wz': { state: 'on' }, 'binary_sensor.f_ku': { state: 'off' }, 'binary_sensor.terrasse': { state: 'off' },
  'binary_sensor.f_k1': { state: 'off' }, 'cover.rollo_wz': { state: 'closed' }, 'binary_sensor.rauch': { state: 'off', dc: 'smoke' },
  'sensor.rauch_bat': { state: '9', dc: 'battery' },
};
const rows = V.flatRows(D.deviceRows({ layout, states, t: (k) => k, pointInPoly, onStates: new Set(['on', 'open']), batteryOf: { 'binary_sensor.rauch': 'sensor.rauch_bat' } }));
const run = (text, place = {}) => V.answer(ask(text), rows, states, place);
const ids = (a) => a.items.map((i) => i.id);

test('flatRows: every thing with its floor and room', () => {
  const o1 = rows.find((r) => r.id === 'o1'), d5 = rows.find((r) => r.id === 'd5');
  assert.equal(o1.room, 'wz'); assert.equal(o1.roomName, 'WZ EG'); assert.equal(o1.floor, 0); assert.ok(o1.contact);
  assert.equal(d5.room, 'k1'); assert.equal(d5.floor, 1);
  assert.equal(rows.find((r) => r.id === 'o4').shutter, 'cover.rollo_wz');
});

test('answer: lists of things in a state, the place, "alle zu?", names, readings', () => {
  let a = run('Welche Fenster sind offen?');
  assert.equal(a.mode, 'list'); assert.deepEqual(ids(a), ['o1']); assert.equal(a.n, 1);
  a = run('Sind alle Fenster zu?');
  assert.ok(a.check); assert.equal(a.state, 'open'); assert.deepEqual(ids(a), ['o1']);
  a = V.answer({ ...ask('Sind alle Fenster zu?') }, rows.filter((r) => r.id !== 'o1'), states);
  assert.equal(a.n, 0);
  const t = (k, p) => (p ? `${k}(${Object.values(p).join(',')})` : k);
  assert.equal(V.headline(a, t), '✓ vq.allOk(vq.w.windows,vq.s.closed)');
  a = run('Welche Fenster sind zu?');
  assert.deepEqual(ids(a).sort(), ['o2', 'o5']);
  a = run('Welche Lichter sind an?');
  assert.deepEqual(ids(a).sort(), ['d1', 'd5']);
  assert.equal(V.headline(a, t, 'Haus'), '💡 vq.w.lights · vq.s.on: 2 (Haus)');
  a = run('Ist oben Licht an?', { floor: 1 });
  assert.deepEqual(ids(a), ['d5']);
  a = run('Licht im Wohnzimmer', { rooms: ['wz'] });                    // a place without a state: all of them, the ones on first
  assert.deepEqual(ids(a), ['d1', 'd2']); assert.equal(a.state, null);
  a = run('Ist im Wohnzimmer das Fenster offen?', { rooms: ['wz'] });      // about one room: its shut window shows too, the open one first
  assert.deepEqual(ids(a), ['o1', 'o4']); assert.equal(a.n, 1);
  a = run('Ist die Stehlampe an?');                                      // asked by name: shown also when it is off
  assert.ok(a.named); assert.deepEqual(ids(a), ['d2']); assert.equal(a.n, 0);
  a = run('Ist die Haustür abgeschlossen?');
  assert.deepEqual(ids(a), ['d3']); assert.equal(a.n, 0);
  a = run('Rollläden');
  assert.deepEqual(ids(a), ['o4']);
  assert.equal(run('Welche Rollläden sind zu?').n, 1);
  a = run('Was ist alles an?');
  assert.deepEqual(ids(a).sort(), ['d1', 'd3', 'd5', 'o1']);                // lights, the open window, the unlocked lock
  a = run('Welche Batterien sind leer?');
  assert.deepEqual(ids(a), ['d6']);
  assert.equal(run('Wie warm ist es?').mode, 'reading');
  assert.equal(run('Wie sieht es im Wohnzimmer aus?', { rooms: ['wz'] }).mode, 'rooms');
  assert.equal(run('Keller', { floor: 0 }).mode, 'floor');
  assert.equal(run('Wo ist der Staubsauger?').mode, 'find');
  assert.equal(run('').mode, 'none');
});

test('settings: code words cleaned, engine, which recognition', () => {
  const v = V.cleanVoice({ engine: 'x', aliases: [{ say: ' Stube ', rooms: ['wz', 'wz', 5] }, { say: 'leer' }, { say: '', rooms: ['a'] }, 'junk', { say: 'Oma', house: 'el', user: 'lena' }] });
  assert.equal(v.engine, 'auto');
  assert.deepEqual(v.aliases, [{ say: 'Stube', house: '', floor: '', rooms: ['wz'], user: '' }, { say: 'Oma', house: 'el', floor: '', rooms: [], user: 'lena' }]);
  assert.equal(V.cleanVoice(null).aliases.length, 0);
  assert.equal(V.cleanVoice({ aliases: Array.from({ length: 99 }, (_, i) => ({ say: `w${i}`, floor: 'eg' })) }).aliases.length, V.MAX_ALIASES);
  assert.equal(V.pickEngine('auto', { browser: true, assist: true, mic: true }), 'browser');
  assert.equal(V.pickEngine('auto', { browser: false, assist: true, mic: true }), 'assist');
  assert.equal(V.pickEngine('auto', { browser: false, assist: true, mic: false }), null);   // Assist needs the microphone of a secure page
  assert.equal(V.pickEngine('assist', { browser: true, assist: false, mic: true }), null);
  assert.equal(V.pickEngine('off', { browser: true }), null);
  assert.deepEqual(V.aliasesFor(env.aliases, 'lena').map((a) => a.say)[0], 'Wohnzimmer der Eltern');
});
