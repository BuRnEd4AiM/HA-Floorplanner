// Unit tests for family.js (the page 👨‍👩‍👧 Familie of the tab bar and the pinboard, #483; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/family.js`);
const now = new Date(2026, 9, 21, 14, 30);               // Wednesday, 21 October 2026, 14:30 (local time)

test('where a person is: at home, a zone, away, unknown', () => {
  assert.deepEqual(F.whereOf('home'), { key: 'home', zone: '' });
  assert.deepEqual(F.whereOf('not_home'), { key: 'away', zone: '' });
  assert.deepEqual(F.whereOf('Arbeit'), { key: 'zone', zone: 'Arbeit' });
  for (const s of ['unknown', 'unavailable', '', undefined]) assert.equal(F.whereOf(s).key, 'unknown');
});
test('the people: what the add-on found with the live states, at home first, then by name', () => {
  const people = [
    { id: 'person.max', name: 'Max', state: 'not_home', since: '2026-10-21T08:10:00Z', picture: true, battery: 45.4, charging: false },
    { id: 'person.anna', name: 'Anna', state: 'home', since: '2026-10-21T11:02:00Z', battery: 78 },
    { id: 'light.x', name: 'nope' },
  ];
  const states = { 'person.max': { state: 'not_home' }, 'person.anna': { state: 'home' }, 'person.oma': { state: 'Ferienhaus' } };
  const rows = F.familyRows(people, states, { 'person.oma': 'Oma' });
  assert.deepEqual(rows.map((r) => [r.id, r.where.key]), [['person.anna', 'home'], ['person.max', 'away'], ['person.oma', 'zone']]);
  assert.equal(rows[1].battery, 45); assert.equal(rows[1].picture, true); assert.equal(rows[1].initial, 'M');
  assert.equal(+rows[0].since, Date.parse('2026-10-21T11:02:00Z'));
  assert.equal(rows[2].since, null); assert.equal(rows[2].battery, null); assert.equal(rows[2].name, 'Oma');
});
test('somebody who moved since the add-on was asked has no "since" until it is asked again', () => {
  const rows = F.familyRows([{ id: 'person.anna', name: 'Anna', state: 'home', since: '2026-10-21T11:02:00Z' }], { 'person.anna': { state: 'not_home' } });
  assert.equal(rows[0].where.key, 'away'); assert.equal(rows[0].since, null);
});
test('a person only the add-on knows (no live states yet) is there; a battery out of range is held in', () => {
  const rows = F.familyRows([{ id: 'person.lena', state: 'Schule', battery: 140 }], {});
  assert.equal(rows[0].name, 'lena'); assert.equal(rows[0].where.zone, 'Schule'); assert.equal(rows[0].battery, 100);
  assert.deepEqual(F.familyRows(null, null), []);
});
test('the colour of a circle stays the same for a name', () => {
  assert.equal(F.avatarHue('Anna'), F.avatarHue('Anna'));
  assert.notEqual(F.avatarHue('Anna'), F.avatarHue('Max'));
  assert.ok(F.avatarHue('') >= 0 && F.avatarHue('Ölrich') < 360);
});
test('when: today the time, yesterday, a weekday this week, else the date', () => {
  assert.equal(F.whenOf(new Date(2026, 9, 21, 11, 2), now).key, 'time');
  assert.equal(F.whenOf(new Date(2026, 9, 20, 18, 30), now).key, 'yesterday');
  assert.equal(F.whenOf(new Date(2026, 9, 17, 9, 0), now).key, 'day');
  assert.equal(F.whenOf(new Date(2026, 9, 1, 9, 0), now).key, 'date');
  assert.equal(F.whenOf(new Date('x'), now), null); assert.equal(F.whenOf(null, now), null);
});
test('a new note: control characters out, at most 300 characters, the colour after the newest one', () => {
  assert.equal(F.cleanNote('  Bin um 6 da 🚗 \u0007 '), 'Bin um 6 da 🚗');
  assert.equal(F.cleanNote('a\n\n\n\nb'), 'a\n\nb');
  assert.equal([...F.cleanNote('😀'.repeat(400))].length, F.MAX_NOTE);
  assert.equal(F.cleanNote(null), '');
  assert.equal(F.noteColor('pink'), 'pink'); assert.equal(F.noteColor('red'), 'yellow');
  assert.equal(F.nextColor([{ color: 'yellow' }]), 'green'); assert.equal(F.nextColor([{ color: 'pink' }]), 'yellow'); assert.equal(F.nextColor([]), 'green');
});
test('the notes of the server: newest first, broken ones left out', () => {
  const notes = F.pinNotes([{ id: 'a', text: 'Katze füttern', by: 'Anna', at: '2026-10-21T08:10:00Z', color: 'green' },
    { id: 'b', text: 'Bin um 6 da', by: 'Max', at: '2026-10-21T11:48:00Z', color: 'nope' }, { id: 'c', text: '' }, { id: 'd', text: 'x', at: 'never' }, null]);
  assert.deepEqual(notes.map((n) => [n.id, n.color]), [['b', 'yellow'], ['a', 'green']]);
  assert.deepEqual(F.pinNotes('x'), []);
});
test('the page has something with a person', () => {
  assert.equal(F.hasFamily({ 'person.a': {} }), true); assert.equal(F.hasFamily({ 'light.a': {} }), false); assert.equal(F.hasFamily(null), false);
});
