/* Automatic backups panel (inside "Houses & backup"): settings, "back up now", check, restore, download, delete.
 * The schedule itself runs in the add-on (server.py); this file only talks to /api/backups. */
const units = ['B', 'KB', 'MB', 'GB'];
export function fmtSize(n) {
  let i = 0, v = Number(n) || 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
const j = async (url, opts) => {
  const r = await fetch(url, opts);
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
};
const post = (url, data) => j(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });

export function initBackups({ t, commitSettings, reload = () => location.reload() }) {
  const root = document.getElementById('autoBackup');
  if (!root) return { refresh() {} };
  const list = document.getElementById('abList'), status = document.getElementById('abStatus');
  const say = (msg, warn = false) => { status.textContent = msg; status.classList.toggle('warn', warn); };

  async function refresh() {
    let res;
    try { res = await j('api/backups'); } catch { res = { ok: false }; }
    if (!res.ok) { root.hidden = true; return; }              // no backend (demo) or no permission: the section stays away
    root.hidden = false;
    const items = res.body.items || [];
    if (!items.length) { const p = document.createElement('p'); p.className = 'sub'; p.textContent = t('ab.empty'); list.replaceChildren(p); return; }
    list.replaceChildren(...items.map((it) => {
      const row = document.createElement('div'); row.className = 'abRow';
      const label = document.createElement('span'); label.className = 'abName';
      label.textContent = `${it.created.replace('T', ' ')} · ${it.kind === 'auto' ? t('ab.auto') : t('ab.manual')} · ${fmtSize(it.size)}`;
      const btn = (text, title, on) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.title = title; b.addEventListener('click', on); return b; };
      const dl = document.createElement('a'); dl.className = 'btn'; dl.href = `api/backups/${encodeURIComponent(it.name)}`; dl.download = it.name; dl.textContent = '⬇'; dl.title = t('ab.download');
      row.append(label,
        btn(t('ab.check'), t('ab.check'), () => check(it.name)),
        btn(t('ab.restore'), t('ab.restore'), () => restore(it.name)),
        dl,
        btn('×', t('ab.delete'), () => remove(it.name)));
      return row;
    }));
  }
  async function check(name) {
    say('…');
    const r = await post('api/backups/test', name ? { name } : {});
    if (r.ok) say(t('ab.testOk', { houses: r.body.houses.length, pictures: r.body.pictures, models: r.body.models, size: fmtSize(r.body.size) }));
    else say(t('ab.testFail', { msg: r.body.error || r.status }), true);
  }
  async function restore(name) {
    if (!confirm(t('ab.restoreConfirm'))) return;
    const r = await post('api/backups/restore', { name });
    if (r.ok) { say(t('ab.restored')); setTimeout(reload, 800); }
    else say(t('ab.fail', { msg: r.body.error || r.status }), true);
  }
  async function remove(name) {
    if (!confirm(t('ab.deleteConfirm'))) return;
    const r = await j(`api/backups/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!r.ok) say(t('ab.fail', { msg: r.body.error || r.status }), true);
    refresh();
  }
  document.getElementById('abNow').addEventListener('click', async () => {
    say('…');
    const r = await post('api/backups');
    say(r.ok ? t('ab.saved', { name: r.body.name }) : t('ab.fail', { msg: r.body.error || r.status }), !r.ok);
    refresh();
  });
  document.getElementById('abTest').addEventListener('click', () => check(null));
  root.addEventListener('change', (e) => { if (e.target.matches('input')) commitSettings(); });   // the four settings fields
  return { refresh };
}
