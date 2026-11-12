// Unit tests for statusline.js (the status line over the compass, 2026-11-12; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/statusline.js`);

/** a stand-in for #status in #stage: its height grows with the text, the stage keeps the CSS variables */
function fake() {
  const vars = {};
  const stage = { style: { setProperty: (k, v) => { vars[k] = v; } } };
  return { vars, el: { textContent: '', parentElement: stage, get offsetHeight() { return this.textContent ? 27 : 0; } } };
}

test('the floor rail keeps room for the line: its height and a gap, nothing while it is empty', () => {
  assert.equal(S.statusGap(0), 0);
  assert.equal(S.statusGap(27), 35);
  assert.equal(S.statusGap(26.2), 35);                     // whole pixels, never too little
});

test('a message shows and the floor rail moves up for it; empty hides it again', () => {
  const { vars, el } = fake();
  S.showStatus(el, '11 Lichter aus: Ganzes Haus', false);
  assert.equal(el.textContent, '11 Lichter aus: Ganzes Haus');
  assert.equal(vars['--status-gap'], '35px');
  S.showStatus(el, '', false);
  assert.equal(el.textContent, '');
  assert.equal(vars['--status-gap'], '0px');
  S.showStatus(null, 'x', true);                            // no line on the page: nothing happens
});

test('in the live view a message goes again by itself, in the editor it stays', async () => {
  const { setTimeout: wait } = await import('node:timers/promises');
  assert.ok(S.STATUS_LIVE_MS >= 4000 && S.STATUS_LIVE_MS <= 10000);   // long enough to read it, not there for good
  const orig = globalThis.setTimeout, timers = [];
  globalThis.setTimeout = (fn, ms) => { timers.push([fn, ms]); return timers.length; };
  try {
    const { vars, el } = fake();
    S.showStatus(el, 'Gespeichert', false);
    assert.equal(timers.length, 0);                         // the editor: a tool's hint stays while drawing
    S.showStatus(el, '2 Lichter aus: Kinder', true);
    assert.equal(timers.length, 1);
    assert.equal(timers[0][1], S.STATUS_LIVE_MS);
    timers[0][0]();
    assert.equal(el.textContent, '');
    assert.equal(vars['--status-gap'], '0px');
    S.showStatus(el, 'eins', true);
    S.showStatus(el, 'zwei', true);                         // a newer message is not taken away by the timer of the older one
    timers[1][0]();
    assert.equal(el.textContent, 'zwei');
  } finally {
    globalThis.setTimeout = orig;
  }
  await wait(0);
});
