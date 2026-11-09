/* Deleting a scene or an automation of Home Assistant from the dashboard, and taking it back (#564, the owner: "dass ich auch Szenen dort
 * löschen kann, die von Home Assistant sind … sodass ich die auch verwalten kann und die Automatisierungen auch"): it asks first, the add-on
 * keeps the old version (ha-backup), and for a few minutes the card shows "↶ Wiederherstellen". The cards hide what was deleted at once
 * (hidden(cid)) until Home Assistant says it is gone. scenesui.js, sceneedit.js and routinesown.js use it; the server checks again
 * (api/scenes, api/automations, api/ha-restore). */

const KEEP_MS = 5 * 60000;                          // how long "↶ Wiederherstellen" stays

/** ctx: t, changed() (draw the page again) */
export function initHaManage(ctx) {
  const { t } = ctx;
  let gone = null, timer = 0;                       // the last one deleted: { kind: 'scene' | 'automation', cid, name }
  const why = (e) => (e === 'nohass' ? t('sc.nohass') : e === 'yaml' ? t('hm.yaml') : e || '…');
  async function send(method, url, body) {
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json().catch(() => ({}));
      return { ...j, ok: r.ok && j.ok !== false };
    } catch { return { ok: false, error: '…' }; }
  }

  /** delete it in Home Assistant after asking; -> true when it is gone */
  async function remove(kind, cid, name) {
    if (!cid || !window.confirm(t(kind === 'scene' ? 'hm.askScene' : 'hm.askAuto', { name }))) return false;
    const r = await send('DELETE', `api/${kind === 'scene' ? 'scenes' : 'automations'}/${encodeURIComponent(cid)}`);
    if (!r.ok) { window.alert(t('hm.failed', { why: why(r.error) })); return false; }
    gone = { kind, cid, name };
    clearTimeout(timer);
    timer = setTimeout(() => { gone = null; ctx.changed(); }, KEEP_MS);
    ctx.changed();
    return true;
  }
  async function restore() {
    if (!gone) return;
    const g = gone;
    const r = await send('POST', 'api/ha-restore', { kind: g.kind, id: g.cid });
    if (!r.ok) { window.alert(t('hm.failed', { why: why(r.error) })); return; }
    if (gone === g) { gone = null; clearTimeout(timer); }
    ctx.changed();
  }
  /** "🗑 „Abend“ gelöscht · ↶ Wiederherstellen" in the card of this kind, or null */
  function undoRow(kind) {
    if (!gone || gone.kind !== kind) return null;
    const row = document.createElement('div'); row.className = 'hmUndo'; row.dataset.gone = gone.cid;
    const tx = document.createElement('span'); tx.textContent = `🗑 ${t('hm.gone', { name: gone.name })}`;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tpChip'; b.textContent = `↶ ${t('hm.restore')}`; b.dataset.act = 'haRestore';
    b.title = t('hm.restoreHint');
    b.addEventListener('click', restore);
    row.append(tx, b);
    return row;
  }
  return { remove, restore, undoRow, hidden: (cid) => !!gone && gone.cid === cid, sig: () => JSON.stringify(gone) };
}
