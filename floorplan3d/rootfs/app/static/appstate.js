/* The starting state of the app (step 22 of the split, #137): the default settings (the add-on sends the stored ones over them), how this
 * screen starts for the user who opened it (a wall tablet, a room tablet, read-only, live mode) and lengths in metres or feet. All pure
 * (unit test: tests/appstate.test.mjs); the state itself (the open plan, floor, tool, selection ...) is kept by app.js. */

/** default settings; the server has the same list in server.py (DEFAULT_SETTINGS) and keeps only known keys */
export const DEFAULT_SETTINGS = Object.freeze({
  language: 'auto', theme: 'dark', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, labelMode: 'important', cameraImages: true, cutaway: true, wallStop: true, seeThrough: false, placeSelect: true, updateCheck: true, autoBackup: false, backupEveryHours: 24, backupKeepDays: 14, backupKeepCount: 30, timelineOn: true, timelineKeepDays: 7, earth: 'solid', earthMargin: 5,
  alerts: true, alertJump: false, weatherEntity: '', idleReturn: 0, idleOrbit: false, nightDim: 'off', nightFrom: '22:00', nightTo: '06:00',
  wallOpacity: 0.72, glowRadius: 3.5, glowStrength: 1, glowHeight: 1.6, defaultLightColor: '#ffc861',
  userRooms: {}, userViews: {}, userPresets: {}, userLocks: {}, belowVisibility: 0.5, belowMode: 'dim', belowLabels: true, bgTop: '#0a3ba8', bgBottom: '#031547', bgGlow: '#28ebd2', bgGlowStrength: 0,
  tempStops: [{ v: 16, c: '#2a6bff' }, { v: 20, c: '#2ad0a0' }, { v: 23, c: '#ffd84a' }, { v: 26, c: '#ff8a2a' }, { v: 30, c: '#ff3a3a' }],
  humidStops: [{ v: 30, c: '#e8d9a0' }, { v: 50, c: '#4fd0c8' }, { v: 65, c: '#2a7bff' }, { v: 80, c: '#5a3aff' }],
  co2Stops: [{ v: 400, c: '#2ad0a0' }, { v: 800, c: '#ffd84a' }, { v: 1200, c: '#ff8a2a' }, { v: 2000, c: '#ff3a3a' }],
});
/** a fresh, changeable copy of the default settings */
export const defaultSettings = () => structuredClone({ ...DEFAULT_SETTINGS });

/** how this screen starts: me (from api/me: canEdit, room) and the address (?room=, ?kiosk=, ?mode=live). tabletRoom: the room this
 *  screen is locked to (one tablet per room); kiosk: no editing bars; readonly: the user may not edit; live: start in the live mode */
export function startup(me, params) {
  const tabletRoom = params.get('room') || me.room || null;
  return {
    tabletRoom,
    kiosk: !!params.get('kiosk') || !me.canEdit || !!tabletRoom,
    readonly: !me.canEdit,
    live: params.get('mode') === 'live' || !!params.get('kiosk') || !!tabletRoom || !me.canEdit,
  };
}

/* lengths: the plan always stores metres; shown and typed in metres or feet */
export const M_TO_FT = 3.28084;
/** metres -> the number shown (3 decimals) */
export const toDisp = (m, imperial) => +(imperial ? m * M_TO_FT : m).toFixed(3);
/** a typed number -> metres */
export const fromDisp = (v, imperial) => (imperial ? v / M_TO_FT : v);
/** a length as text: "2.50 m" or "8.20 ft" */
export const fmtLen = (m, imperial) => (imperial ? `${(m * M_TO_FT).toFixed(2)} ft` : `${m.toFixed(2)} m`);
