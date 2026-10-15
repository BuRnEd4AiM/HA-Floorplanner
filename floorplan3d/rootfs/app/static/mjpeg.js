/* Live camera picture (#381): Home Assistant's MJPEG stream (camera_proxy_stream, multipart/x-mixed-replace) cut into its pictures.
 * The ingress proxies of Home Assistant drop the boundary from the Content-Type header (and would compress the stream), so an <img> cannot
 * show the stream itself: the add-on passes the bytes through unchanged and this parser finds the pictures. Each part is
 * "--boundary" + headers + a blank line + the picture; its Content-Length says how long the picture is (Home Assistant's still image stream and
 * ffmpeg's mpjpeg both send it), without one the picture ends at the next boundary. Pure (no DOM): unit tests in tests/mjpeg.test.mjs. */

export const MAX_FRAME = 8 * 1024 * 1024;     // the same limit as the add-on's still images
const MAX_HEAD = 4096;                         // boundary line and headers of one part

const bytes = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const CRLF2 = bytes('\r\n\r\n'), LF2 = bytes('\n\n');

/** where needle starts in hay (from `from` on), -1 when it does not */
export function find(hay, needle, from = 0) {
  const n = needle.length;
  for (let i = hay.indexOf(needle[0], from); i !== -1 && i <= hay.length - n; i = hay.indexOf(needle[0], i + 1)) {
    let k = 1;
    while (k < n && hay[i + k] === needle[k]) k++;
    if (k === n) return i;
  }
  return -1;
}

/** the head of one part (its boundary line and headers): { boundary ('--xyz' or ''), type, len (-1: none) } */
export function readHead(head) {
  let boundary = '', type = '', len = -1;
  String.fromCharCode(...head).split(/\r?\n/).forEach((line) => {
    if (line.startsWith('--')) { if (!boundary) boundary = line.trim(); return; }
    const m = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) return;
    const name = m[1].toLowerCase(), value = m[2].trim();
    if (name === 'content-type') type = value.split(';')[0].trim().toLowerCase();
    else if (name === 'content-length' && /^\d+$/.test(value)) len = Number(value);
  });
  return { boundary, type: type.startsWith('image/') ? type : 'image/jpeg', len };
}

/** a parser for one stream: push(piece) with every piece of bytes as it arrives; onFrame(picture, type) for every whole picture.
 *  push throws when the stream is no MJPEG (a part head without its end, a part without length and boundary, a picture over maxFrame). */
export function mjpegParser(onFrame, { maxFrame = MAX_FRAME } = {}) {
  const pieces = [];            // what arrived and is not used yet
  let size = 0;
  let boundary = null;          // '--xyz' as bytes, from the first part
  let part = null;              // { type, len } while the picture of a part is awaited (len -1: up to the next boundary)
  let searched = 0;             // a picture without length: how far the boundary was searched already
  /** the first n bytes in one piece (only the pieces needed are joined) */
  function first(n) {
    let k = 0, got = 0;
    while (got < n) got += pieces[k++].length;
    if (k > 1) {
      const one = new Uint8Array(got);
      for (let i = 0, o = 0; i < k; o += pieces[i].length, i++) one.set(pieces[i], o);
      pieces.splice(0, k, one);
    }
    return pieces[0].subarray(0, n);
  }
  function drop(n) {
    size -= n;
    while (n > 0) {
      if (pieces[0].length <= n) n -= pieces.shift().length;
      else { pieces[0] = pieces[0].subarray(n); n = 0; }
    }
  }
  /** the line ends between the parts */
  function skipLineEnds() {
    while (size) {
      const p = pieces[0];
      let i = 0;
      while (i < p.length && (p[i] === 13 || p[i] === 10)) i++;
      if (!i) return;
      drop(i);
    }
  }
  function nextHead() {
    skipLineEnds();
    if (!size) return false;
    const look = first(Math.min(size, MAX_HEAD));
    let end = find(look, CRLF2), skip = 4;
    const lf = find(look, LF2);
    if (lf !== -1 && (end === -1 || lf < end)) { end = lf; skip = 2; }
    if (end === -1) {
      if (size >= MAX_HEAD) throw new Error('no MJPEG: a part head without its end');
      return false;
    }
    const h = readHead(look.subarray(0, end));
    drop(end + skip);
    if (!boundary && h.boundary) boundary = bytes(h.boundary);
    if (h.len > maxFrame) throw new Error('MJPEG picture too big');
    if (h.len < 0 && !boundary) throw new Error('no MJPEG: a part without length and boundary');
    part = { type: h.type, len: h.len };
    searched = 0;
    return true;
  }
  function nextPicture() {
    if (part.len >= 0) {
      if (size < part.len) return false;
      const pic = part.len ? first(part.len) : null, type = part.type;
      drop(part.len); part = null;
      if (pic) onFrame(pic, type);
      return true;
    }
    if (size < boundary.length) return false;
    const all = first(size), at = find(all, boundary, Math.max(0, searched - boundary.length));
    if (at === -1) {
      searched = size;
      if (size > maxFrame) throw new Error('MJPEG picture too big');
      return false;
    }
    let end = at;
    if (all[end - 1] === 10) end--;
    if (all[end - 1] === 13) end--;
    const pic = all.subarray(0, end), type = part.type;
    drop(at); part = null;                 // the boundary stays: it is the head of the next part
    if (pic.length) onFrame(pic, type);
    return true;
  }
  function push(piece) {
    if (!piece?.length) return;
    pieces.push(piece); size += piece.length;
    while (part ? nextPicture() : nextHead());
  }
  return { push };
}
