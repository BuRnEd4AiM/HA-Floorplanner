/* 🎬 The video guide (4.52.0): what the window of the guide shows. Pure (tests/guide.test.mjs); guideui.js draws it.
 * The videos are on GitHub Pages next to the demo (tools/make_guide.py records them in the demo after every update);
 * a saved copy in the add-on (guide.py, "📥 Für ohne Internet speichern") is served under guide/ and works without internet. */
export const SITE = 'https://burned4aim.github.io/HA-Floorplanner/guide/';

/** the videos exist with a German and an English interface: German for German, English for everybody else */
export const guideLang = (lang) => (String(lang || '').toLowerCase().startsWith('de') ? 'de' : 'en');

/** the address of the guide's page in the window: the saved copy (st.local) or the internet; maybe a search or a clip */
export function guideSrc(st, lang, opt = {}) {
  const q = new URLSearchParams({ embed: '1', lang: guideLang(lang) });
  if (opt.q) q.set('q', opt.q);
  return `${st?.local ? 'guide/' : SITE}?${q}${opt.clip ? `#${encodeURIComponent(opt.clip)}` : ''}`;
}

/** how many MB the saved copy in this language will be (guide.json of the site: the small videos plus their pictures) */
export function sizeMb(data, lang) {
  const l = guideLang(lang);
  const kb = (data?.clips || []).reduce((s, c) => s + (c.v?.[l] ? (+c.v[l].kb || 0) + 60 : 0), 0);
  return kb ? Math.max(1, Math.round(kb / 1024)) : 0;
}

/** the line under the title: [key, params] for t() */
export function statusOf(st, online, now = Date.now()) {
  if (!st) return ['vg.checking', {}];
  if (st.state === 'loading') return ['vg.loading', { done: st.done || 0, total: st.total || '…' }];
  if (st.state === 'error') return ['vg.error', { msg: st.error || '' }];
  if (st.local) {
    const d = st.saved ? new Date(st.saved * 1000) : null;
    return ['vg.saved', { mb: st.mb ?? '?', date: d ? d.toLocaleDateString() : '', old: d && now - d.getTime() > 60 * 864e5 ? 1 : 0 }];
  }
  if (online === false) return ['vg.offline', {}];
  return st.demo ? ['vg.demo', {}] : ['vg.online', {}];
}
