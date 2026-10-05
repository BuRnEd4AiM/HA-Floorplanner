/* Settings: the form of the settings dialog (which field holds which setting, lengths shown in m or ft), loading them from the add-on (with
 * retries while it restarts), saving every change (the ETag guards against overwriting a change made on another screen), and the users dialog
 * (tablet assignments, mirrored to a file). Applying the settings to the 3D view stays in app.js. Form reading and the rules between settings
 * are pure functions (tested). */

/** setting -> form field */
export const BINDINGS = {
  language: '#setLanguage', theme: '#setTheme', units: '#setUnits', grid: '#setGrid',
  wallHeight: '#setWallHeight', wallThickness: '#setWallThickness', autosaveSeconds: '#setAutosave',
  shadows: '#setShadows', labelMode: '#setLabels', cameraImages: '#setCameraImages', earth: '#setEarth', earthMargin: '#setEarthMargin', lowWalls: '#setLowWalls',
  alerts: '#setAlerts', alertJump: '#setAlertJump', weatherEntity: '#setWeather', idleReturn: '#setIdleReturn', idleOrbit: '#setIdleOrbit', nightDim: '#setNightDim', nightFrom: '#setNightFrom', nightTo: '#setNightTo', cutaway: '#setCutaway', seeThrough: '#setSeeThrough', wallStop: '#setWallStop', placeSelect: '#setPlaceSelect', updateCheck: '#setUpdateCheck', autoBackup: '#setAutoBackup', backupEveryHours: '#setBackupEvery', backupKeepDays: '#setBackupKeepDays', backupKeepCount: '#setBackupKeepCount',
  wallOpacity: '#setWallOpacity', belowVisibility: '#setBelow', belowMode: '#setBelowMode', glowRadius: '#setGlowRadius', glowStrength: '#setGlowStrength', glowHeight: '#setGlowHeight',
  defaultLightColor: '#setDefaultLight', bgTop: '#setBgTop', bgBottom: '#setBgBottom', bgGlow: '#setBgGlow', bgGlowStrength: '#setBgGlowStrength',
};
/** settings that are lengths: shown in the current unit, stored in metres */
export const DISP_KEYS = new Set(['wallHeight', 'wallThickness', 'glowRadius', 'glowHeight', 'earthMargin']);

/** the value of one form field for a setting. el: { type, value, checked }; returns undefined when the field keeps the old value */
export function formValue(key, el, fromDisp) {
  if (el.type === 'checkbox') return el.checked;
  if (key === 'idleReturn') return Math.max(0, parseFloat(el.value) || 0);   // 0 = off
  if (el.type === 'number') {
    const v = parseFloat(el.value);
    return Number.isFinite(v) && v > 0 ? (DISP_KEYS.has(key) ? fromDisp(v) : v) : undefined;
  }
  if (el.type === 'range') return parseFloat(el.value) || 0;
  if (key === 'grid') return parseFloat(el.value);
  return el.value;
}
/** what a form field shows for a setting */
export function fieldValue(key, value, toDisp) {
  return DISP_KEYS.has(key) ? toDisp(value) : String(value);
}
/** "Auto" (walls sink) and "See-through" exclude each other: the one switched on last wins. Returns the settings to keep (a copy when changed). */
export function resolveWallView(prev, next) {
  if (!(next.seeThrough && next.cutaway)) return next;
  return !prev.seeThrough ? { ...next, cutaway: false } : { ...next, seeThrough: false };
}
/** how many users have a tablet assignment (room or view) */
export const tabletUsers = (s) => new Set([...Object.keys(s.userRooms || {}), ...Object.keys(s.userViews || {})]).size;

/** ctx: $, t, get() (the settings), set(next), ui (settingsui.js), toDisp(m), fromDisp(v), layout(), entities(), perfStored, perfKey, setStatus(txt),
 *  committed(prev) (apply the new settings to the house and the view), alert(txt), reload() */
export function initSettings(ctx) {
  const { $, t, ui } = ctx;
  const dlg = $('#settingsDialog'), usersDlg = $('#usersDialog');
  let loaded = false, etag = null;   // never save settings that were not loaded from the server first (would wipe e.g. the tablet assignments)

  function fill() {
    const settings = ctx.get();
    for (const [key, sel] of Object.entries(BINDINGS)) {
      const el = $(sel);
      if (el.type === 'checkbox') el.checked = !!settings[key];
      else el.value = fieldValue(key, settings[key], ctx.toDisp);
    }
    $('#earthMarginNote').hidden = !(ctx.layout().plot?.boundary?.length >= 3);
    $('#weatherList').replaceChildren(...ctx.entities().filter((e) => e.entity_id.startsWith('weather.')).map((e) => { const o = document.createElement('option'); o.value = e.entity_id; o.label = e.name; return o; }));
    $('#setPerf').value = ctx.perfStored;
    ui.renderTablets();
    ui.renderStops('#tempStops', 'tempStops', '°C');
    ui.renderStops('#humidStops', 'humidStops', '%');
    ui.renderStops('#co2Stops', 'co2Stops', 'ppm');
  }
  function read() {
    const settings = ctx.get(), next = { ...settings };
    for (const [key, sel] of Object.entries(BINDINGS)) {
      const v = formValue(key, $(sel), ctx.fromDisp);
      if (v !== undefined) next[key] = v;
    }
    const tb = ui.readTablets(); next.userRooms = tb.rooms; next.userViews = tb.views;
    next.tempStops = ui.readStops('#tempStops', settings.tempStops);
    next.humidStops = ui.readStops('#humidStops', settings.humidStops);
    next.co2Stops = ui.readStops('#co2Stops', settings.co2Stops);
    return next;
  }
  async function load() {
    for (let i = 0; i < 6 && !loaded; i++) {
      try {
        const r = await fetch('api/settings');
        if (r.ok) { ctx.set({ ...ctx.get(), ...(await r.json()) }); etag = r.headers.get('ETag'); loaded = true; fill(); break; }   // the form always shows the real settings: every later save reads it back
      } catch { /* add-on is probably restarting, try again */ }
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
    return loaded;
  }
  /** save the current settings as they are (without reading the form) */
  async function save() {
    try {
      const r = await fetch('api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(etag ? { 'If-Match': etag } : {}) }, body: JSON.stringify(ctx.get()) });
      if (r.ok) { ctx.set({ ...ctx.get(), ...(await r.json()) }); etag = r.headers.get('ETag'); }
      else if (r.status === 409) { ctx.alert(t('set.changedElsewhere')); ctx.reload(); }
    } catch { /* offline: settings stay for this session */ }
  }
  /** the form changed: read it, apply it, save it */
  async function commit() {
    if (!loaded && !(await load())) { ctx.setStatus(t('set.notLoaded')); return; }
    const prev = ctx.get(), read1 = read(), next = resolveWallView(prev, read1);
    ctx.set(next);
    if (next !== read1) fill();
    ctx.committed(prev);
    fill();
    await save();
  }
  $('#setPerf').addEventListener('change', (e) => {     // per device (this browser), not for the whole house: needs a fresh start
    try { if (e.target.value === 'auto') localStorage.removeItem(ctx.perfKey); else localStorage.setItem(ctx.perfKey, e.target.value); } catch { /* no storage */ }
    ctx.reload();
  });
  $('#settingsBtn').addEventListener('click', () => { fill(); dlg.showModal(); });

  /* ---- users dialog: tablets per user, mirrored to users.json ---- */
  async function refreshUsersFile(note = '') {
    const el = $('#usersFileStatus');
    try {
      const r = await fetch('api/users-file');
      if (!r.ok) { el.textContent = note; return; }
      const s = await r.json();
      el.classList.toggle('warn', !s.inSync);
      el.textContent = note || (!s.exists ? t('users.fileNone') : s.inSync ? t('users.fileOk', { n: s.users }) : t('users.fileDiff', { f: s.fileUsers, n: s.users }));
    } catch { el.textContent = note; }
  }
  async function syncUsersFile() {
    try {
      const r = await fetch('api/users-file/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await r.json().catch(() => ({}));
      if (r.status === 404) { await refreshUsersFile(t('users.syncMissing')); return; }
      if (!r.ok) { await refreshUsersFile(t('users.syncFail', { msg: body.error || r.status })); return; }
      ctx.set({ ...ctx.get(), ...body }); etag = r.headers.get('ETag') || etag;
      ui.renderTablets();
      await refreshUsersFile(t('users.syncDone', { n: tabletUsers(ctx.get()) }));
    } catch (e) { await refreshUsersFile(t('users.syncFail', { msg: String(e.message || e) })); }
  }
  async function saveUsersFile() {
    try {
      await commit();                                                   // what is typed in the dialog goes along
      const r = await fetch('api/users-file/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: 'save' }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) { await refreshUsersFile(t('users.syncFail', { msg: body.error || r.status })); return; }
      etag = r.headers.get('ETag') || etag;
      await refreshUsersFile(t('users.saveDone', { n: tabletUsers(ctx.get()) }));
    } catch (e) { await refreshUsersFile(t('users.syncFail', { msg: String(e.message || e) })); }
  }
  $('#usersBtn').addEventListener('click', async () => {
    if (!loaded) await load();
    fill();                                  // the form behind the dialogs must hold the real settings before the first save reads it back (else the defaults, e.g. the hologram theme, win)
    usersDlg.showModal(); ui.loadHaUsers(); refreshUsersFile();
    ui.loadRoomGroups().then((ok) => { if (usersDlg.open && ok) ui.renderTablets(); });   // all houses, grouped; the first paint already shows the open house
  });
  $('#usersSave').addEventListener('click', saveUsersFile);
  $('#usersSync').addEventListener('click', syncUsersFile);
  usersDlg.addEventListener('change', async () => { await commit(); refreshUsersFile(); });
  usersDlg.addEventListener('click', (e) => { if (e.target === usersDlg) usersDlg.close(); });
  dlg.addEventListener('change', commit);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });     // a click on the dark backdrop closes it too
  return { fill, read, load, save, commit, loaded: () => loaded };
}
