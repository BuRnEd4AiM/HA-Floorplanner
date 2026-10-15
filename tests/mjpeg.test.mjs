// Unit tests for mjpeg.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const M = await import(`${process.env.STATIC_DIR || '/tmp/static'}/mjpeg.js`);
const enc = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const join = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; parts.forEach((p) => { out.set(p, o); o += p.length; }); return out; };
/** a fake JPEG of n bytes (starts with FF D8, ends with FF D9, the middle counts up) */
const jpeg = (n, seed = 0) => { const b = new Uint8Array(n); for (let i = 0; i < n; i++) b[i] = (i * 7 + seed) & 255; b[0] = 0xff; b[1] = 0xd8; b[n - 2] = 0xff; b[n - 1] = 0xd9; return b; };
/** Home Assistant's still image stream: the boundary before every part, a line end after the picture */
const haStream = (pics) => join(...pics.flatMap((p) => [enc(`--frameboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${p.length}\r\n\r\n`), p, enc('\r\n')]));
/** ffmpeg's mpjpeg (Tapo Control, generic cameras): the boundary once at the start and after every picture, lower case headers */
const ffStream = (pics) => join(enc('--ffmpeg\r\n'), ...pics.flatMap((p) => [enc(`Content-type: image/jpeg\r\nContent-length: ${p.length}\r\n\r\n`), p, enc('\r\n--ffmpeg\r\n')]));
/** pushes the stream in pieces of the given sizes (repeated) and returns the pictures */
function run(stream, sizes = [stream.length], opts) {
  const got = [], p = M.mjpegParser((pic, type) => got.push({ pic: pic.slice(), type }), opts);
  for (let o = 0, i = 0; o < stream.length; i++) { const n = sizes[i % sizes.length]; p.push(stream.subarray(o, o + n)); o += n; }
  return got;
}
const same = (got, pics) => { assert.equal(got.length, pics.length); got.forEach((g, i) => assert.deepEqual(g.pic, pics[i])); };
const pics = [jpeg(500, 1), jpeg(1200, 2), jpeg(37, 3)];

test('Home Assistant stream: every picture whole, in one piece or cut anywhere', () => {
  const s = haStream(pics);
  for (const sizes of [[s.length], [1], [2, 3], [7], [64], [499, 1, 13]]) same(run(s, sizes), pics);
  assert.equal(run(s)[0].type, 'image/jpeg');
});
test('ffmpeg stream (lower case headers, boundary after the picture)', () => {
  const s = ffStream(pics);
  for (const sizes of [[s.length], [1], [5], [100]]) same(run(s, sizes), pics);
});
test('a picture that contains the boundary text is not cut there when the length is known', () => {
  const tricky = join(jpeg(10), enc('\r\n--frameboundary\r\n'), jpeg(10));
  same(run(haStream([tricky, pics[0]]), [3]), [tricky, pics[0]]);
});
test('without Content-Length the picture ends at the next boundary (also with bare line ends)', () => {
  const s = join(...pics.flatMap((p) => [enc('--xyz\nContent-Type: image/png\n\n'), p, enc('\n')]), enc('--xyz\n'));
  for (const sizes of [[s.length], [1], [9]]) {
    const got = run(s, sizes);
    same(got, pics);
    assert.equal(got[0].type, 'image/png');
  }
});
test('the last picture without length waits for the next boundary', () => {
  const got = run(join(enc('--b\r\n\r\n'), pics[0]));
  assert.equal(got.length, 0);
});
test('an empty part gives no picture; a part type that is no picture is read as JPEG', () => {
  const s = join(enc('--b\r\nContent-Length: 0\r\n\r\n\r\n--b\r\nContent-Type: text/html\r\nContent-Length: 37\r\n\r\n'), pics[2]);
  const got = run(s, [4]);
  same(got, [pics[2]]);
  assert.equal(got[0].type, 'image/jpeg');
});
test('no MJPEG: no end of the head, no length and no boundary, a picture too big', () => {
  assert.throws(() => run(enc('<html>'.repeat(1000))), /no MJPEG/);
  assert.throws(() => run(enc('Content-Type: image/jpeg\r\n\r\nabc')), /no MJPEG/);
  assert.throws(() => run(enc('--b\r\nContent-Length: 999999\r\n\r\n'), undefined, { maxFrame: 1000 }), /too big/);
  assert.throws(() => run(join(enc('--b\r\n\r\n'), jpeg(2000)), undefined, { maxFrame: 1000 }), /too big/);
  assert.doesNotThrow(() => run(enc('--b\r\nContent-Le')));          // the head is not complete yet: wait
});
test('readHead and find', () => {
  assert.deepEqual(M.readHead(enc('--ffmpeg\r\nContent-type: image/jpeg; q=1\r\nContent-length: 12')), { boundary: '--ffmpeg', type: 'image/jpeg', len: 12 });
  assert.deepEqual(M.readHead(enc('X-Timestamp: 5\r\nContent-Length: x')), { boundary: '', type: 'image/jpeg', len: -1 });
  assert.equal(M.find(enc('aab--bc--b'), enc('--b'), 0), 3);
  assert.equal(M.find(enc('aab--bc--b'), enc('--b'), 4), 7);
  assert.equal(M.find(enc('ab'), enc('abc')), -1);
});
