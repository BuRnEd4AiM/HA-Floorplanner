/* View presets per user / tablet (#250) and the labels of the floors below (#249). Pure rules (unit test: tests/viewprefs.test.mjs):
 *  - a user (a tablet) can get its own start values for how the house looks (walls see-through, labels ...), set in the users dialog;
 *    they apply in that browser only and are never saved as the settings of everybody, unless that user changes them on purpose;
 *  - looking at one floor, the room names and value labels of the floors below can be left out, so they do not get in the way. */

/** what a preset can set, with the values allowed (the first value of a yes/no field is "yes") */
export const PRESET_FIELDS = {
  seeThrough: [true, false],                  // walls facing the camera turn see-through instead of sinking down
  cutaway: [true, false],                     // walls facing the camera react on their own (Auto)
  lowWalls: [true, false],                    // all walls low
  labelMode: ['important', 'all', 'none'],    // value labels on devices
  belowMode: ['dim', 'stacked', 'hidden'],    // floors below the open one
  belowLabels: [true, false],                 // names and labels of the floors below
  houseFloors: ['normal', 'apart', 'stacked'], // the floors of the whole-house view: as built, pulled apart, stacked like a real house
};
/** what the dashboard card (#13, cardmode.js) can set for its screen: the preset fields and a few more; a function checks a number */
export const CARD_FIELDS = {
  ...PRESET_FIELDS,
  theme: ['holo', 'dark', 'light'],
  alerts: [true, false],                      // warnings (smoke, water, open windows in the rain ...)
  idleReturn: (v) => Number.isInteger(v) && v >= 0 && v <= 1440,   // minutes without a touch, then back to the start view (0 = never)
  nightDim: ['off', 'sun', 'time'],           // dim at night
};
const allowed = (vals, v) => (typeof vals === 'function' ? vals(v) : vals.includes(v));

/** a preset with only known fields (PRESET_FIELDS or the ones given) and allowed values (anything else is dropped); {} for junk */
export function cleanPreset(p, fields = PRESET_FIELDS) {
  const out = {};
  if (!p || typeof p !== 'object' || Array.isArray(p)) return out;
  for (const [k, vals] of Object.entries(fields)) if (allowed(vals, p[k])) out[k] = p[k];
  return out;
}

/** start a preset on top of the settings: { settings (with the preset), base (the settings of everybody for those fields), start (the
 *  preset) }; null when the preset sets nothing. fields: what it may set (the dashboard card: CARD_FIELDS) */
export function startPreset(settings, preset, fields = PRESET_FIELDS) {
  const p = cleanPreset(preset, fields), keys = Object.keys(p);
  if (!keys.length) return null;
  return { settings: { ...settings, ...p }, base: Object.fromEntries(keys.map((k) => [k, settings[k]])), start: p };
}

/** what goes to the server: a preset field still at its preset value is saved as the value of everybody (base); one the user changed
 *  on purpose is saved as changed. Returns { body, state } (the state follows a field that was changed: it is now everybody's value) */
export function forSaving(cur, state) {
  if (!state) return { body: cur, state };
  const body = { ...cur }, base = { ...state.base }, start = { ...state.start };
  for (const k of Object.keys(state.start)) {
    if (cur[k] === state.start[k]) body[k] = state.base[k];
    else { base[k] = cur[k]; start[k] = cur[k]; }
  }
  return { body, state: { ...state, base, start } };
}

/** the preset fields as this browser has them now: laid over what the server sends back, so a save does not undo the preset */
export function keepSession(cur, state) {
  return state ? Object.fromEntries(Object.keys(state.start).map((k) => [k, cur[k]])) : {};
}

/** do the room names and value labels of floor i show: always in the whole-house view and on the open floor (and above), on the
 *  floors below unless switched off (#249) */
export function floorLabels(settings, i, openFloor, wholeHouse) {
  return wholeHouse || i >= openFloor || settings.belowLabels !== false;
}

/** presets typed in the users dialog: [{ user, preset }] -> { user: preset }, empty presets left out */
export function collectPresets(rows) {
  const out = {};
  rows.forEach((r) => { const u = (r.user || '').trim(), p = cleanPreset(r.preset); if (u && Object.keys(p).length) out[u] = p; });
  return out;
}
