// Unit tests for safearea.js (the strip kept clear of the iPhone's home bar, not twice in the Home Assistant app; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/safearea.js`);

test('the whole screen: nothing kept clear around the page, the page keeps the strip clear itself', () => {
  assert.equal(S.frameGap({ framed: false, full: false, parentHeight: null, frameBottom: null }), 0);
  assert.equal(S.frameGap({ framed: false, full: false, parentHeight: 812, frameBottom: 700 }), 0);
});
test('the Home Assistant app: the frame ends above the strip, Home Assistant keeps it clear', () => {
  assert.equal(S.frameGap({ framed: true, full: false, parentHeight: 812, frameBottom: 782 }), 30);
  assert.equal(S.frameGap({ framed: true, full: false, parentHeight: 812, frameBottom: 781.6 }), 30);
});
test('a frame down to the bottom edge: the page keeps the strip clear itself', () => {
  assert.equal(S.frameGap({ framed: true, full: false, parentHeight: 812, frameBottom: 812 }), 0);
  assert.equal(S.frameGap({ framed: true, full: false, parentHeight: 812, frameBottom: 814 }), 0);   // never below 0
});
test('a frame of another address (Docker panel, dashboard card): the page around keeps clear', () => {
  assert.equal(S.frameGap({ framed: true, full: false, parentHeight: null, frameBottom: null }), S.OUTSIDE);
  assert.ok(S.OUTSIDE > 100);
});
test('full screen: the frame covers the whole screen', () => {
  assert.equal(S.frameGap({ framed: true, full: true, parentHeight: 812, frameBottom: 782 }), 0);
  assert.equal(S.frameGap({ framed: true, full: true, parentHeight: null, frameBottom: null }), 0);
});
