/* 👥 Gäste-Zugang (5.21.0, the owner 2026-11-20: a Home Assistant user "gast", a QR code, then the guest sees a card of the chosen room
 * to control): the pure part. The address the QR code holds, the QR code as SVG, the "bis" time between the form (datetime-local) and the
 * settings (ISO with its offset), and the "bis" in words. Unit test: tests/guestaccess.test.mjs. The form is guestui.js, the guest's own
 * screen guestview.js, the rules on the server guest.py. */
import qrcode from './vendor/qrcode.js';

const p2 = (n) => String(n).padStart(2, '0');

/** the address of the page the guest opens: the add-on's panel in Home Assistant (the top window's address when the page runs inside it,
 *  without a query or hash), else this page's */
export function guestUrl(top, here) {
  const loc = top && top.origin && top.pathname ? top : here;
  return `${loc.origin}${loc.pathname}`;
}

/** a datetime-local value ("2026-11-23T12:00", the browser's time) -> the settings' form ("2026-11-23T12:00+01:00"); '' for none */
export function untilFromInput(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v || '');
  if (!m) return '';
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), off = -d.getTimezoneOffset();
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}${off >= 0 ? '+' : '-'}${p2(Math.trunc(Math.abs(off) / 60))}:${p2(Math.abs(off) % 60)}`;
}
/** the settings' "bis" -> a datetime-local value in the browser's time; '' for none */
export function inputFromUntil(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(+d)) return '';
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
}
/** a "bis" `days` days from now at 12:00 (the quick buttons), as a datetime-local value */
export function untilIn(days, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 12, 0);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T12:00`;
}
/** is the access over */
export const isOver = (iso, now = new Date()) => !!iso && !Number.isNaN(+new Date(iso)) && +new Date(iso) <= +now;
/** "So., 23.11., 12:00" in the language */
export function untilText(iso, lang = 'de') {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(+d)) return '';
  try { return new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d); } catch { return d.toLocaleString(); }
}

/** the QR code of a text as SVG (black squares on white, a quiet zone of 4 around it), UTF-8 */
export function qrSvg(text, { size = 220, ecc = 'M' } = {}) {
  const q = qrcode(0, ecc);
  q.addData(unescape(encodeURIComponent(String(text))), 'Byte');   // the library counts bytes: the text as UTF-8 bytes
  q.make();
  const n = q.getModuleCount(), all = n + 8;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${all} ${all}" width="${size}" height="${size}" shape-rendering="crispEdges">`
    + `<rect width="${all}" height="${all}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
/** how many modules a side of the QR code of a text has (tests) */
export function qrModules(text, ecc = 'M') {
  const q = qrcode(0, ecc);
  q.addData(unescape(encodeURIComponent(String(text))), 'Byte');
  q.make();
  return { n: q.getModuleCount(), dark: (r, c) => q.isDark(r, c) };
}
