/* Opening a house (step 22 of the split, #137): switch to another plan of the list (edits of the open one are saved first), open an
 * imported plan or the example house from the welcome card, and load a whole backup file. What happens in the view once a plan is open
 * (floor, selection, camera) stays in app.js (ctx.opened). */

/** ctx: $, t, hs (houses.js), hasLayout(), flush() (save the open plan if it was changed), opened(layout), setStatus(txt), alert(txt), confirm(txt), reload() */
export function initHouseLoad(ctx) {
  const { $, t, hs } = ctx;
  /** open house `id`: nothing when it is open already */
  async function switchHouse(id) {
    if (id === hs.id() && ctx.hasLayout()) return;
    await ctx.flush();                                            // edits of the house we leave
    hs.setCurrent(id);
    let layout;
    try { layout = await (await fetch(hs.url())).json(); } catch { ctx.setStatus(t('loadFailed')); return; }
    ctx.opened(layout);
  }
  /** the example house of the welcome card: imported as a new house and opened */
  async function openExample() {
    try {
      const ex = await (await fetch('api/import/examples/house')).text();
      const r = await fetch(`api/import?name=${encodeURIComponent(t('wel.exampleName'))}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ex });
      const j = await r.json();
      if (!r.ok || !j.id) throw new Error(j.error || r.status);
      hs.add(j); await switchHouse(j.id);
    } catch (err) { ctx.setStatus(`${t('loadFailed')}: ${err.message}`); }
  }
  /** an imported plan (import.js): added to the list and opened */
  async function openImported(j) {
    hs.add(j);
    await switchHouse(j.id);
    ctx.setStatus(t('imp.done').replace('{name}', j.name));
  }
  $('#backupImport').addEventListener('click', () => $('#backupFile').click());
  $('#backupFile').addEventListener('change', async (e) => {      // a whole backup (all houses and settings) replaces what is there
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !ctx.confirm(t('backup.confirm'))) return;
    try {
      await ctx.flush();
      const r = await fetch('api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.status);
      ctx.alert(t('backup.done', { h: j.houses }));
      ctx.reload();
    } catch (err) { ctx.alert(`${t('backup.failed')}: ${err.message}`); }
  });
  $('#houseSelect').addEventListener('change', (e) => switchHouse(e.target.value));
  return { switchHouse, openExample, openImported };
}
