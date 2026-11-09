/* 🎬 The button "Anleitung" in the top bar (only for those who may edit: class admin-only) and its window: the page of the
 * video guide in a frame, from the internet or from the copy saved in the add-on; "📥 Für ohne Internet speichern" makes that
 * copy (POST api/guide, guide.py), "🗑" removes it. What is shown is decided in guide.js (pure, tested). */
import { SITE, guideLang, guideSrc, sizeMb, statusOf } from './guide.js';

/** ctx: $, t, lang() (the language of the interface) */
export function initGuide(ctx) {
  const { $, t } = ctx;
  const btn = $('#guideBtn');
  let dlg = null, st = null, online = null, siteData = null, poll = 0, shownSrc = '';

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function build() {
    dlg = el('dialog', 'guideDlg');
    dlg.setAttribute('aria-label', t('vg.title'));
    const head = el('div', 'gvHead');
    const title = el('b', 'gvTitle', `🎬 ${t('vg.title')}`);
    const info = el('span', 'gvStatus');
    const save = el('button', 'gvSave'); save.type = 'button';
    const del = el('button', 'gvDel', t('vg.del')); del.type = 'button';
    const out = el('a', 'gvOut', '↗'); out.target = '_blank'; out.rel = 'noopener'; out.title = t('vg.out');
    const x = el('button', 'dlgClose gvClose', '✕'); x.type = 'button'; x.title = t('close');
    head.append(title, info, el('span', 'gvGrow'), save, del, out, x);
    const frame = el('iframe', 'gvFrame');
    frame.setAttribute('allow', 'fullscreen; autoplay; clipboard-write');
    frame.setAttribute('allowfullscreen', '');
    frame.title = t('vg.title');
    dlg.append(head, frame);
    document.body.append(dlg);
    x.addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => { clearTimeout(poll); });
    save.addEventListener('click', async () => {
      save.disabled = true;
      st = await call('POST', { lang: guideLang(ctx.lang()) }) || st;
      render(); watch();
    });
    del.addEventListener('click', async () => {
      if (!confirm(t('vg.delAsk'))) return;
      st = await call('DELETE') || st;
      render(true);
    });
  }
  async function call(method, body) {
    try {
      const r = await fetch('api/guide', { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }
  async function checkSite() {          // is the internet there (GitHub Pages answers every origin) and how big would the copy be
    try {
      const r = await fetch(`${SITE}guide.json`, { cache: 'no-cache' });
      siteData = r.ok ? await r.json() : null;
      online = r.ok;
    } catch { online = false; }
    render();
  }
  function render(reload = false) {
    if (!dlg) return;
    const [key, p] = statusOf(st, online);
    dlg.querySelector('.gvStatus').textContent = t(key, p);
    dlg.querySelector('.gvStatus').classList.toggle('warn', key === 'vg.offline' || key === 'vg.error' || !!p.old);
    const save = dlg.querySelector('.gvSave'), del = dlg.querySelector('.gvDel');
    const mb = sizeMb(siteData, ctx.lang());
    save.hidden = !st || st.demo;
    save.disabled = st?.state === 'loading' || online === false;
    save.textContent = st?.local ? t('vg.update') : mb ? t('vg.save', { mb }) : t('vg.saveNoSize');
    save.title = t('vg.saveTip');
    del.hidden = !st?.local || st.state === 'loading';
    const src = guideSrc(st, ctx.lang());
    dlg.querySelector('.gvOut').href = src.replace('embed=1&', '');      // the whole page in a tab of its own
    if (reload || src !== shownSrc) { shownSrc = src; dlg.querySelector('.gvFrame').src = src; }
  }
  function watch() {                    // while the copy is being saved: ask every second how far it is
    clearTimeout(poll);
    if (st?.state !== 'loading') return;
    poll = setTimeout(async () => {
      const was = st?.local;
      st = await call('GET') || st;
      render(st?.state === 'done' && !was);
      watch();
    }, 1000);
  }
  async function open() {
    if (!dlg) build();
    if (!dlg.open) dlg.showModal();
    st = await call('GET');
    if (!st) st = { local: false, state: 'idle', demo: false };
    render();
    watch();
    checkSite();
  }
  btn?.addEventListener('click', open);
  return { open };
}
