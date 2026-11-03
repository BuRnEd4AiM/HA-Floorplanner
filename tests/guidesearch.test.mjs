// Unit tests for tools/guide/search.js (🎬 the search of the video guide page). With the real clips: tests/test_guide_search.py.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const GS = createRequire(import.meta.url)('../tools/guide/search.js');

const CLIPS = [
  { id: 'shutter', title: { de: 'Rollladen auf und zu', en: 'Open and close a shutter' }, desc: { de: 'Die Kugel des Rollladens antippen.', en: 'Tap the ball of the shutter.' },
    keys: 'Rollladen Jalousie shutter blind', tags: { de: 'Rollo runter hochfahren', en: 'roller blind lower raise' }, feat: { de: ['Rollläden und Vorhänge'], en: ['Roller shutters and curtains'] },
    steps: [{ de: 'Tippe auf den Raum.', en: 'Tap the room.' }, { de: '„Schließen“ fährt ihn herunter.', en: '“Close” lowers it.' }] },
  { id: 'light', title: { de: 'Licht schalten und dimmen', en: 'Switch and dim a light' }, desc: { de: 'An, aus, heller, dunkler.', en: 'On, off, brighter, darker.' },
    keys: 'Lampe Licht dimmen lamp light', tags: { de: 'Glühbirne Deckenlampe', en: 'bulb ceiling lamp' }, feat: { de: ['Licht schalten'], en: ['Switch a light'] }, steps: [] },
  { id: 'heating', title: { de: 'Heizung einstellen', en: 'Set the heating' }, desc: { de: 'Wärmer oder kälter.', en: 'Warmer or colder.' },
    keys: 'Heizung Thermostat heating', tags: { de: 'Heizkörper Grad', en: 'radiator degrees' }, feat: { de: [], en: [] }, steps: [] },
  { id: 'log', title: { de: 'Protokoll', en: 'Log' }, desc: { de: 'Wer hat was geschaltet.', en: 'Who switched what.' },
    keys: 'Protokoll log', tags: { de: 'wer hat das Licht angemacht', en: 'who turned on the light' }, feat: { de: [], en: [] }, steps: [] },
  { id: 'orbit', title: { de: 'Drehen und zoomen', en: 'Turn and zoom' }, desc: { de: 'Mit der Maus.', en: 'With the mouse.' },
    keys: 'drehen turn', tags: { de: 'umsehen', en: 'look around' }, feat: { de: [], en: [] }, steps: [] },
  { id: 'doors', title: { de: 'Türen einsetzen', en: 'Put in doors' }, desc: { de: 'Eine Tür in die Wand.', en: 'A door in the wall.' },
    keys: 'Tür door', tags: { de: 'Haustür', en: 'front door' }, feat: { de: [], en: [] }, steps: [] },
];
const SYN = [['rollladen', 'rollo', 'jalousie', 'shutter', 'blind'], ['licht', 'lampe', 'light', 'lamp'], ['heizung', 'heizkörper', 'heating', 'radiator'], ['ki', 'ai', 'chatgpt']];
const idx = GS.index(CLIPS, SYN);
const ids = (q, lang = 'de') => GS.search(idx, q, lang).list.map((r) => r.id);

test('folding: no accents, ä = ae, ß = ss, CO₂ = co2', () => {
  assert.equal(GS.fold('Rollläden'), 'rollladen');
  assert.equal(GS.fold('Tuer'), GS.fold('Tür'));
  assert.equal(GS.fold('Fußboden'), 'fussboden');
  assert.equal(GS.fold('CO₂'), 'co2');
});

test('other forms of a word count as the word', () => {
  assert.equal(GS.stem('lampen'), GS.stem('lampe'));
  assert.equal(GS.stem('lamps'), 'lamp');
  assert.equal(GS.stem('tilted'), 'tilt');
  assert.equal(GS.stem('auto'), 'auto');                                  // short words stay as they are
  assert.deepEqual(ids('Lampen'), ['light', 'log']);                      // "Licht" in the log: a word with the same meaning
  assert.deepEqual(ids('Türen'), ['doors']);
});

test('a hyphen word is also one word', () => {
  assert.deepEqual(GS.tokens('Dreh-Kipp-Fenster'), ['dreh', 'kipp', 'fenster', 'drehkippfenster']);
});

test('little words are left out; only little words: still typing, every clip', () => {
  assert.deepEqual(GS.words('Wie kann ich die Heizung wärmer machen?'), ['heizung', 'warmer']);
  const r = GS.search(idx, 'wie kann ich', 'de');
  assert.deepEqual(r.words, []);
  assert.equal(r.list.length, CLIPS.length);
});

test('a word with the same meaning finds the clip', () => {
  assert.equal(ids('Jalousie')[0], 'shutter');
  assert.equal(ids('Rollo')[0], 'shutter');
  assert.equal(ids('Heizkörper')[0], 'heating');
  assert.equal(ids('radiator', 'en')[0], 'heating');
});

test('a short word with the same meaning is not the start of another word', () => {
  assert.deepEqual(ids('chatgpt'), []);                                   // "ai" must not find "air", "aim" …
});

test('a short word that a clip has is only that word ("Tür" is not "turn")', () => {
  assert.deepEqual(ids('Tür'), ['doors']);
});

test('the start of a word while typing', () => {
  assert.ok(ids('Roll').includes('shutter'));
  assert.ok(ids('lam').includes('light'));
});

test('part of a long word, and the parts of a long word typed', () => {
  assert.equal(ids('Stehlampe')[0], 'light');                             // ends with a word of a group of the same meaning
  assert.equal(ids('Wohnzimmerlampe')[0], 'light');                       // no clip has it: its parts
  assert.equal(ids('Haustür')[0], 'doors');
});

test('a typing mistake finds the word and says which', () => {
  const r = GS.search(idx, 'Heizng', 'de');
  assert.equal(r.list[0].id, 'heating');
  assert.deepEqual(r.fixed, { heizng: 'Heizung' });                       // with its capital letter
  assert.equal(ids('Jalosie')[0], 'shutter');
  assert.equal(GS.dist('jalosie', 'jalousie', 2), 1);
  assert.equal(GS.dist('thermostta', 'thermostat', 2), 1);                // two letters swapped: one mistake
  assert.equal(GS.search(idx, 'Licht', 'de').fixed.licht, undefined);     // a word that is there is not "corrected"
});

test('the title counts most; words in a row as in the clip count more', () => {
  assert.deepEqual(ids('who turned on the light', 'en').slice(0, 1), ['log']);
  assert.equal(ids('Licht')[0], 'light');
});

test('every word must be there; if no clip has every word, the ones with the most', () => {
  const r = GS.search(idx, 'Rollo Heizung', 'de');
  assert.equal(r.partial, true);
  assert.deepEqual(r.list.map((x) => x.id).sort(), ['heating', 'shutter']);
  const all = GS.search(idx, 'Rollo runter', 'de');
  assert.equal(all.partial, false);
  assert.deepEqual(all.list.map((x) => x.id), ['shutter']);
});

test('a clip found only by its search words says by which', () => {
  const r = GS.search(idx, 'Rollo runter', 'de').list[0];
  assert.deepEqual(r.via, ['runter']);                                    // "Rollo" is marked in the title as "Rollladen"
  assert.deepEqual(r.steps, [1]);                                         // the step "fährt ihn herunter": runter is in herunter
});

test('marks: whole words the search found', () => {
  const r = GS.search(idx, 'Rollo', 'de');
  assert.deepEqual(GS.ranges('Rollladen auf und zu', r.hit), [[0, 9]]);
  assert.deepEqual(GS.ranges('Die Kugel', r.hit), []);
  assert.deepEqual(GS.ranges('x', new Set()), []);
});
