/* Version pill in the top bar: shows the version and a short checksum, green when the files of the add-on and the files the
 * browser really loaded both match the committed manifest. The dialog behind it can also compare with GitHub (main). */
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
/** SHA-256 in plain JavaScript, for pages that are not a secure context (http://...), where crypto.subtle does not exist */
export function sha256Js(buf) {
  const bytes = new Uint8Array(buf), len = bytes.length;
  const K = [], H = [];
  for (let c = 2, n = 0; n < 64; c++) {                       // constants: fractions of the roots of the first primes
    let prime = true;
    for (let d = 2; d * d <= c; d++) if (c % d === 0) { prime = false; break; }
    if (!prime) continue;
    if (n < 8) H[n] = (Math.sqrt(c) % 1) * 2 ** 32 | 0;
    K[n++] = (Math.cbrt(c) % 1) * 2 ** 32 | 0;
  }
  const words = ((len + 9 + 63) >> 6) << 4, w = new Int32Array(words);
  for (let i = 0; i < len; i++) w[i >> 2] |= bytes[i] << (24 - (i & 3) * 8);
  w[len >> 2] |= 0x80 << (24 - (len & 3) * 8);
  w[words - 2] = Math.floor(len / 2 ** 29);
  w[words - 1] = len * 8 | 0;
  const rotr = (x, n) => (x >>> n) | (x << (32 - n)), W = new Int32Array(64), h = Int32Array.from(H);
  for (let o = 0; o < words; o += 16) {
    for (let t = 0; t < 16; t++) W[t] = w[o + t];
    for (let t = 16; t < 64; t++) {
      const a = W[t - 15], b = W[t - 2];
      W[t] = (W[t - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + W[t - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
  }
  return [...h].map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
export async function sha256(buf) {
  return globalThis.crypto?.subtle ? hex(await crypto.subtle.digest('SHA-256', buf)) : sha256Js(buf);
}
/** true when GitHub (main) has a newer version than the one that runs here */
export const updateAvailable = (github) => github?.state === 'behind';
/** which of the expected files differ from the actual checksums (a missing one counts as different) */
export function diffHashes(expected, actual) {
  return Object.keys(expected).filter((n) => actual[n] !== expected[n]).sort();
}
const short = (list, max = 3) => (list.length > max ? `${list.slice(0, max).join(', ')} …` : list.join(', '));

export function initVersion({ t, reload = () => location.reload(), active = () => false, every = 5 * 60 * 1000 }) {
  const pill = document.getElementById('versionPill'), dlg = document.getElementById('versionDialog');
  if (!pill || !dlg) return { run() {} };
  const body = document.getElementById('versionBody');
  let info = null, browser = null, github = null;

  async function fetchJson(url) {
    try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
  }
  async function checkBrowser(files) {
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
    const news = updateAvailable(github) && state === 'ok';
    pill.className = `pill ver-${news ? 'new' : state}`;
    pill.textContent = news ? `⬆ ${t('ver.new')} · v${github.version}`
      : `${state === 'ok' ? '✓' : state === 'wait' ? '…' : '⚠'} v${info.version} · ${info.short}`;
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
  /* new-version notice: in the edit mode every few minutes (only when the setting allows it; only GitHub's public manifest is fetched) */
  async function poll() {
    if (!active() || document.hidden || !info) return;
    github = (await fetchJson('api/version/remote')) || github;
    paint();
  }
  run(false).then(() => { if (active()) poll(); });
  setInterval(poll, every);
  return { run, poll };
}
