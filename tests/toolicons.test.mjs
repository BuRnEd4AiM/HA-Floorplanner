// Unit tests for toolicons.js (tool bar with icons and groups, #422; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const I = await import(`${dir}/toolicons.js`);
const { TOOLS } = await import(`${dir}/toolbar.js`);

test('every tool of the bar has an icon and a group, the More button an icon', () => {
  TOOLS.forEach(([id]) => {
    assert.ok(I.ICONS[id], `icon for ${id}`);
    assert.ok(id in I.TOOL_GROUP, `group for ${id}`);
  });
  assert.ok(I.ICONS.more);
  Object.values(I.ICONS).forEach((s) => assert.match(s, /^<(path|rect|circle)/));
});

test('a caption on the first tool of each group, the selection tool alone without one', () => {
  const runs = I.groupStarts(['select', 'wall', 'room', 'stairs', 'opening', 'device', 'measure', 'erase']);
  assert.deepEqual(runs.map((r) => r.cap), ['', 'draw', null, null, 'place', null, 'tools', null]);
});

test('moved tools: a group that comes again gets its caption again', () => {
  const runs = I.groupStarts(['wall', 'select', 'measure', 'room']);
  assert.deepEqual(runs.map((r) => r.cap), ['draw', '', 'tools', 'draw']);
  assert.deepEqual(I.groupStarts([]), []);
  assert.equal(I.groupStarts(['ufo'])[0].cap, 'tools', 'an unknown tool counts as a tool');
});

test('the default order of the bar gives one caption per group', () => {
  const shown = TOOLS.map(([id]) => id).filter((id) => !['cable', 'energy', 'import'].includes(id));   // hidden or folded by default
  const caps = I.groupStarts(shown).map((r) => r.cap).filter((c) => c !== null);
  assert.deepEqual(caps, ['', 'draw', 'place', 'tools']);
});
