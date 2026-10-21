/* A full screen kept on for a user (#487): the lock "fullscreen" of the users dialog (userlocks.js) keeps that user's screen in full
 * screen; only the code ends it (one code for every screen, set by an admin in ⚙ → Benutzer, kept hashed by the add-on: api/fullscreen).
 * Pure rules (unit test: tests/fullscreen.test.mjs); the screen part is fullscreenui.js. */

export const FULL_LOCK = 'fullscreen';
/** after the code the screen is free until ⛶ is tapped again, the page is loaded again or nobody touched it for so many minutes */
export const FREE_MIN = 10;

/**
 * What the screen does now: 'off' (no lock, or the browser cannot go full screen: nothing to keep), 'cover' (kept, but not in full
 * screen: a sheet lies over everything, a tap goes back into it), 'on' (kept and in full screen: ⛶ asks for the code), 'free' (kept,
 * but the code was typed).
 */
export function fullState({ locked, can, full, free }) {
  if (!locked || !can) return 'off';
  if (free) return 'free';
  return full ? 'on' : 'cover';
}

/** what ⛶ in the bar does: 'ask' for the code (kept), 'keep' (free and not in full screen: back into it, kept again), else 'toggle' */
export function fullButton(state, full) {
  if (state === 'on') return 'ask';
  if (state === 'free' && !full) return 'keep';
  return 'toggle';
}

/** the code was typed, but nobody touched the screen for FREE_MIN minutes: kept again */
export const freeOver = ({ free, idleMs, minutes = FREE_MIN }) => !!free && idleMs > minutes * 60000;

/** a code as it may be set: 4 to 8 digits ('' takes it away) */
export const codeOk = (code) => typeof code === 'string' && /^[0-9]{4,8}$/.test(code);

/** what the answer of api/fullscreen/unlock means: { ok: true }, or { note: the key of the text to show, n } */
export function unlockAnswer(status, body) {
  const b = body && typeof body === 'object' ? body : {};
  if (status === 200 && b.ok === true) return { ok: true };
  if (status === 429) return { note: 'fs.wait', n: Math.max(1, Number(b.wait) || 1) };
  if (status === 409) return { note: 'fs.noCode' };
  if (status === 403) return { note: 'fs.wrong', n: Math.max(0, Number(b.left) || 0) };
  return { note: 'fs.failed' };
}
