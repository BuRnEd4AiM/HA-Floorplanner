/* Houses (several floor plans): the list, the drop-down and the buttons (new / copy / rename / delete) in the settings. Which house is open at start is
 * decided by pickHouse (tested). Loading a house's plan stays in app.js (switchHouse), because it touches the whole scene. */

/** the house to open: the one asked for in the address (id or name), else the last one used, else the first. houses: [{ id, name }] */
export function pickHouse(houses, want, saved) {
  const w = (want || '').trim().toLowerCase();
  return houses.find((h) => w && (h.id === w || h.name.trim().toLowerCase() === w)) || houses.find((h) => h.id === saved) || houses[0] || null;
}
/** the default name of the first house shows in the user's language */
export const houseLabel = (h, defaultLabel) => (h.id === 'main' && h.name === 'Haus' ? defaultLabel : h.name);
/** where the plan of a house lives on the server (no house = the old single-house address) */
export const layoutUrl = (houseId) => `api/layout${houseId ? `?house=${encodeURIComponent(houseId)}` : ''}`;

/** ctx: $, t, params (URLSearchParams), save() (async), switchHouse(id) (async), alert(text) */
export function initHouses(ctx) {
  const { $, t } = ctx;
  let houses = [], houseId = null;
  const label = (h) => houseLabel(h, t('house.default'));
  async function load() {
    try { const l = await (await fetch('api/houses')).json(); if (Array.isArray(l) && l.length) houses = l; } catch { /* old backend: one house */ }
    let saved = null; try { saved = localStorage.getItem('fp.house'); } catch { /* private mode */ }
    houseId = pickHouse(houses, ctx.params.get('house'), saved)?.id || null;
  }
  /** the open house changed (the plan itself is loaded by the caller) */
  function setCurrent(id) {
    houseId = id;
    try { localStorage.setItem('fp.house', id); } catch { /* private mode */ }
  }
  function renderUi() {
    const sel = $('#houseSelect');
    if (!sel) return;
    sel.replaceChildren(...houses.map((h) => new Option(label(h), h.id)));
    sel.value = houseId || '';
    $('#houseGroup').hidden = houses.length < 2;
    const box = $('#houseBody');
    if (!box) return;
    box.innerHTML = '';
    const cur = houses.find((h) => h.id === houseId);
    const p = document.createElement('p'); p.className = 'sub'; p.textContent = `${t('house.current')}: ${cur ? label(cur) : ''}`; box.append(p);
    const mk = (id, text, on, dis = false) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = text; b.disabled = dis; b.addEventListener('click', on); return b; };
    const row = document.createElement('div'); row.className = 'stopTools';
    row.append(mk('houseNew', t('house.new'), () => action('new')), mk('houseCopy', t('house.copy'), () => action('copy')),
               mk('houseRename', t('house.rename'), () => action('rename')), mk('houseDelete', t('house.delete'), () => action('delete'), houses.length < 2));
    box.append(row);
  }
  async function action(kind) {
    const cur = houses.find((h) => h.id === houseId);
    try {
      if (kind === 'delete') {
        if (!confirm(t('house.deleteConfirm'))) return;
        const r = await fetch(`api/houses/${houseId}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(r.status);
        houses = houses.filter((h) => h.id !== houseId);
        await ctx.switchHouse(houses[0].id);
        return;
      }
      const name = prompt(t('house.namePrompt'), kind === 'rename' ? cur?.name : kind === 'copy' ? `${cur?.name} 2` : t('house.default'));
      if (!name || !name.trim()) return;
      if (kind === 'rename') {
        const r = await fetch(`api/houses/${houseId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
        if (!r.ok) throw new Error(r.status);
        cur.name = name.trim(); renderUi();
        return;
      }
      await ctx.save();                                               // make sure the copy source is up to date
      const r = await fetch('api/houses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, ...(kind === 'copy' ? { copyFrom: houseId } : {}) }) });
      if (!r.ok) throw new Error(r.status);
      const h = await r.json();
      houses.push({ id: h.id, name: h.name });
      await ctx.switchHouse(h.id);
    } catch (err) { ctx.alert(`${t('saveFailed')}: ${err.message}`); }
  }
  /** a house that was just created elsewhere (import) */
  const add = (h) => { houses.push({ id: h.id, name: h.name }); };
  return { list: () => houses, id: () => houseId, url: () => layoutUrl(houseId), load, setCurrent, renderUi, action, add, label,
    current: () => houses.find((h) => h.id === houseId) || null };
}
