/* Beispielbilder ideen-5.37, Teil 2 (2026-11-26): ein neues Design „Glas (Apple-Stil)“ für die ganze App, dunkel und hell, neben
 * Hologramm / Dunkel / Hell. Nur fürs Foto in die echte Demo gemalt: window.__glass(dark) setzt die Farben, legt ein Hintergrundbild unter die
 * Seiten und macht jede Fläche mit der Farbe einer Karte zu Milchglas (backdrop-filter). */
window.__glass = (dark = true) => {
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';            // the nearest real theme first, so every element has its colours
  const wall = dark
    ? 'radial-gradient(60% 70% at 15% 20%, #4b2a8a 0%, transparent 60%), radial-gradient(55% 60% at 85% 15%, #0b5c8f 0%, transparent 60%), radial-gradient(70% 70% at 70% 90%, #b2456e 0%, transparent 60%), radial-gradient(60% 60% at 10% 95%, #11705f 0%, transparent 60%), #0b0d1a'
    : 'radial-gradient(60% 70% at 15% 20%, #c9b8ff 0%, transparent 60%), radial-gradient(55% 60% at 85% 15%, #9fd8ff 0%, transparent 60%), radial-gradient(70% 70% at 70% 90%, #ffc2d4 0%, transparent 60%), radial-gradient(60% 60% at 10% 95%, #b5f0dc 0%, transparent 60%), #eef0f7';
  const v = dark
    ? '--bg: transparent; --panel: rgba(36,36,48,.42); --line: rgba(255,255,255,.14); --text: #ffffff; --muted: rgba(235,235,245,.62); --field: rgba(118,118,128,.26); --accent: #0a84ff; --accent-text: #fff; --ok: #30d158; --glass: rgba(28,28,36,.42); --glass-solid: rgba(28,28,36,.62); --glass-line: rgba(255,255,255,.18);'
    : '--bg: transparent; --panel: rgba(255,255,255,.55); --line: rgba(0,0,0,.08); --text: #1c1c1e; --muted: rgba(60,60,67,.62); --field: rgba(118,118,128,.14); --accent: #007aff; --accent-text: #fff; --ok: #34c759; --glass: rgba(255,255,255,.5); --glass-solid: rgba(255,255,255,.72); --glass-line: rgba(255,255,255,.7);';
  const st = document.createElement('style');
  st.textContent = `
  html, html[data-theme] { ${v} }
  html body { background: ${wall} fixed !important; font-family: -apple-system, "SF Pro Display", "Inter", system-ui, sans-serif; }
  .mkGl { backdrop-filter: blur(30px) saturate(180%) !important; -webkit-backdrop-filter: blur(30px) saturate(180%) !important;
          box-shadow: 0 12px 40px ${dark ? '#0006' : '#5a5a8a22'}, inset 0 1px 0 ${dark ? '#ffffff22' : '#ffffffcc'} !important; border-color: var(--glass-line) !important; }
  .mkGlBig { border-radius: 22px !important; }
  #tabBar { margin: 0 14px 10px !important; border-radius: 26px !important; border: 1px solid var(--glass-line) !important; }
  #tabBar [data-tab] { border-radius: 18px !important; }
  #tabBar [data-tab].on, #tabBar [aria-selected=true], #tabBar .active { background: ${dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.9)'} !important; border-color: transparent !important; box-shadow: 0 2px 10px #0002 !important; }
  [data-page]:not([data-page=house]) { background: ${wall} fixed !important; }
  .mkRound { border-radius: 999px !important; }
  `;
  document.head.appendChild(st);
  const panelRgb = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return p.length === 4 ? p : [...p, 1]; };
  const mark = () => {
    for (const e of document.querySelectorAll('body *')) {
      if (e.tagName === 'CANVAS' || e.closest('svg') || e.classList.contains('mkGl')) continue;
      const cs = getComputedStyle(e), p = panelRgb(cs.backgroundColor);
      if (!dark && /gradient/.test(cs.backgroundImage) && ((h, w) => h > 80 && h < innerHeight * 0.35 && w < innerWidth * 0.8)(e.getBoundingClientRect().height, e.getBoundingClientRect().width)) e.style.setProperty('color', '#fff', 'important');   // dark picture tiles keep white text
      if (!p || p[3] === 0) continue;
      const r = e.getBoundingClientRect();
      if ((e.tagName === 'BUTTON' || e.tagName === 'SELECT') && r.height <= 48 && r.width < 400) e.classList.add('mkRound');
      if (r.width < 40 || r.height < 24) continue;
      // the colours of the cards, fields and bars of the real themes: replace with glass
      const light = (p[0] + p[1] + p[2]) / 3;
      if ((dark && light < 70) || (!dark && (light > 200 || light < 70))) {
        if (r.width > innerWidth * 0.8 && r.height > innerHeight * 0.5) { e.style.setProperty('background', wall, 'important'); e.style.setProperty('background-attachment', 'fixed', 'important'); continue; }   // whole pages: the picture behind
        e.style.setProperty('background-color', r.width > 120 && r.height > 60 ? 'var(--panel)' : 'var(--field)', 'important');
        if (!dark) { const c = panelRgb(cs.color); if (c && (c[0] + c[1] + c[2]) / 3 > 140 && Math.max(...c.slice(0, 3)) - Math.min(...c.slice(0, 3)) > 40) e.style.setProperty('color', `color-mix(in srgb, ${cs.color} 55%, #000)`, 'important'); }   // pale coloured text: darker on light glass
        if (!e.parentElement?.closest('.mkGl')) e.classList.add('mkGl');
        if (r.width > 120 && r.height > 60) e.classList.add('mkGlBig');
      }
    }
  };
  for (const pgEl of document.querySelectorAll('[data-page]:not([data-page=house])')) {     // the frame around the pages: no house shining through
    const r = pgEl.getBoundingClientRect(); if (!r.width) continue;
    for (let x = pgEl.parentElement; x && x !== document.body; x = x.parentElement) { x.style.setProperty('background', wall, 'important'); x.style.setProperty('background-attachment', 'fixed', 'important'); }
  }
  mark();
  window.__mkMark = mark;                                   // again after a page drew itself anew
  return mark;
};
