/* Version pill in the top bar: shows the version and a short checksum, green when the files of the add-on and the files the
 * browser really loaded both match the committed manifest. The dialog behind it can also compare with GitHub (main). */
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256(buf) {
  return hex(await crypto.subtle.digest('SHA-256', buf));
}
/** which of the expected files differ from the actual checksums (a missing one counts as different) */
export function diffHashes(expected, actual) {
  return Object.keys(expected).filter((n) => actual[n] !== expected[n]).sort();
}
const short = (list, max = 3) => (list.length > max ? `${list.slice(0, max).join(', ')} …` : list.join(', '));

export function initVersion({ t, reload = () => location.reload() }) {
  const pill = document.getElementById('versionPill'), dlg = document.getElementById('versionDialog');
  if (!pill || !dlg) return { run() {} };
  const body = document.getElementById('versionBody');
  let info = null, browser = null, github = null;

  async function fetchJson(url) {
    try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
  }
  async function checkBrowser(files) {
    if (!globalThis.crypto?.subtle) return { skipped: true, changed: [] };
    const actual = {};
    await Promise.all(Object.keys(files).map(async (name) => {
      try { const r = await fetch(new URL(name, document.baseURI)); if (r.ok) actual[name] = await sha256(await r.arrayBuffer()); } catch { /* counts as different */ }
    }));
    return { skipped: false, changed: diffHashes(files, actual) };
  }
  function line(icon, text, cls) {
    const p = document.createElement('p'); p.className = `verLine ${cls || ''}`;
    p.textContent = `${icon} ${text}`; return p;
  }
  function paint() {
    if (!info) { pill.hidden = true; return; }
    pill.hidden = false;
    const serverOk = info.server?.ok, browserOk = !browser || browser.skipped || !browser.changed.length;
    const state = !browser ? 'wait' : !serverOk ? 'bad' : !browserOk ? 'warn' : 'ok';
    pill.className = `pill ver-${state}`;
    pill.textContent = `${state === 'ok' ? '✓' : state === 'wait' ? '…' : '⚠'} v${info.version} · ${info.short}`;
    pill.title = t('ver.tip');
    const rows = [
      line('•', `${t('ver.version')}: ${info.version}`),
      line('•', `${t('ver.hash')}: ${info.buildHash}`),
      info.server.ok ? line('✓', t('ver.serverOk', { n: info.server.files }), 'ok')
        : line('✗', t('ver.serverBad', { n: info.server.changed.length + info.server.missing.length + info.server.extra.length, list: short([...info.server.changed, ...info.server.missing, ...info.server.extra]) }), 'bad'),
    ];
    if (!browser) rows.push(line('…', t('ver.checking')));
    else if (browser.skipped) rows.push(line('•', t('ver.browserSkip')));
    else if (!browser.changed.length) rows.push(line('✓', t('ver.browserOk'), 'ok'));
    else rows.push(line('✗', t('ver.browserBad', { n: browser.changed.length, list: short(browser.changed) }), 'bad'));
    if (!github) rows.push(line('•', t('ver.githubNone')));
    else if (github.state === 'same') rows.push(line('✓', t('ver.githubSame'), 'ok'));
    else if (github.state === 'behind') rows.push(line('⚠', t('ver.githubBehind', { v: github.version }), 'warn'));
    else if (github.state === 'differs') rows.push(line('⚠', t('ver.githubDiffers', { v: github.version, h: github.short }), 'warn'));
    else rows.push(line('•', t('ver.githubDown')));
    if (state === 'ok' && github?.state === 'same') rows.push(line('✓', t('ver.allOk'), 'ok'));
    body.replaceChildren(...rows);
    document.getElementById('versionReload').hidden = !(browser && browser.changed.length);
  }
  async function run(withGithub = false) {
    browser = null; paint();
    info = await fetchJson('api/version');
    if (!info?.known) { info = null; paint(); return; }                  // no backend (demo) or no manifest: nothing to show
    paint();
    browser = await checkBrowser(info.staticFiles || {});
    if (withGithub) github = (await fetchJson('api/version/remote')) || { state: 'unreachable' };
    paint();
  }
  pill.addEventListener('click', () => { paint(); dlg.showModal(); });
  document.getElementById('versionCheck').addEventListener('click', () => { github = null; run(true); });
  document.getElementById('versionReload').addEventListener('click', async () => {
    // fetch the differing files past the cache, so the next load gets them
    await Promise.all((browser?.changed || []).map((n) => fetch(new URL(n, document.baseURI), { cache: 'reload' }).catch(() => {})));
    reload();
  });
  run(false);
  return { run };
}
