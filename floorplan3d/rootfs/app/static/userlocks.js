/* Locks per user / tablet: the users dialog can take things away from a user (switching devices, cameras, the settings, changing the view ...).
 * Pure rules (unit test: tests/userlocks.test.mjs) and one small DOM step (applyLocks: a <style> that hides what is locked).
 * "control" and "cameras" are also refused by the server (api/service, api/camera), the rest is only hidden in the browser. */

/** what can be locked, in the order of the dialog, with what is hidden on the screen */
export const LOCKS = [
  ['control', '.lightctl, .roomctl, .sceneList, #livePopup .actions, #roomPanel :is(.rp-alloff, label.sw, .rp-ctl, .rp-more:not(.mi))'],   // switching lights, covers, scenes ... (the server refuses it too)
  ['details', '.mi'],                                                  // the ⓘ button: Home Assistant's own dialog of an entity
  ['cameras', '#camPill, #camMenu, img[data-cam]'],                    // camera list and still images (the server refuses them too)
  ['energy', '#energyPill, #meterPill, #powerBtn'],                    // power and meter overview
  ['colorModes', '#modeBar [data-vm], #powerBtn, #viewLegend'],        // temperature / humidity / CO2 / power colours of the rooms
  ['viewMenu', '#viewMenuBtn, #viewMenu'],                             // the "View" menu (see-through, low walls ...): the look stays as preset
  ['views', '#view2d, #view3d, #viewSplit'],                           // switching 2D / 3D / 2D + 3D
  ['houses', '#houseGroup'],                                           // switching to another house
  ['search', '#findBtn, #findBox'],                                    // the "Where is ...?" search
  ['settings', '#settingsBtn'],                                        // the settings dialog (⚙)
  ['timeline', '#timelineBtn'],                                        // time travel: what switched when (the server refuses it too)
];
export const LOCK_KEYS = LOCKS.map(([k]) => k);

/** only known locks, each once, in the order of LOCKS; [] for junk */
export function cleanLocks(list) {
  if (!Array.isArray(list)) return [];
  return LOCK_KEYS.filter((k) => list.includes(k));
}

/** locks ticked in the users dialog: [{ user, locks }] -> { user: [lock] }, users without a lock left out */
export function collectLocks(rows) {
  const out = {};
  rows.forEach((r) => { const u = (r.user || '').trim(), l = cleanLocks(r.locks); if (u && l.length) out[u] = l; });
  return out;
}

/** the CSS that hides what is locked; '' when nothing is locked */
export function lockCss(locks) {
  const l = cleanLocks(locks);
  const sels = LOCKS.filter(([k]) => l.includes(k)).map(([, s]) => s);
  if (l.includes('colorModes') && l.includes('viewMenu')) sels.push('#modeBar');   // nothing left in the bar
  return sels.length ? `${sels.join(', ')} { display: none !important; }` : '';
}

/** settings as a locked user sees them: no camera images are fetched when the cameras are locked */
export function lockedSettings(settings, locks) {
  return cleanLocks(locks).includes('cameras') && settings.cameraImages ? { ...settings, cameraImages: false } : settings;
}

/** hide what is locked for this user (locks from api/me); returns a Set of the locks */
export function applyLocks(doc, locks) {
  const l = cleanLocks(locks), css = lockCss(l);
  let el = doc.getElementById('userLocks');
  if (css && !el) { el = doc.createElement('style'); el.id = 'userLocks'; doc.head.append(el); }
  if (el) el.textContent = css;
  return new Set(l);
}
