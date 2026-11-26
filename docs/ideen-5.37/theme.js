/* Beispielbilder ideen-5.37, Teil 2 (2026-11-26): ein neues Design „Glas (Apple-Stil)“ für die ganze App, dunkel und hell, neben
 * Hologramm / Dunkel / Hell. Nur fürs Foto in die echte Demo gemalt: window.__glass(dark) setzt die Farben, legt ein Hintergrundbild unter die
 * Seiten und macht jede Fläche mit der Farbe einer Karte zu Milchglas (backdrop-filter). */
window.__glass = (dark = true, photo = null) => {
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';            // the nearest real theme first, so every element has its colours
  const wall = dark
    ? 'radial-gradient(60% 70% at 15% 20%, #4b2a8a 0%, transparent 60%), radial-gradient(55% 60% at 85% 15%, #0b5c8f 0%, transparent 60%), radial-gradient(70% 70% at 70% 90%, #b2456e 0%, transparent 60%), radial-gradient(60% 60% at 10% 95%, #11705f 0%, transparent 60%), #0b0d1a'
    : 'radial-gradient(60% 70% at 15% 20%, #c9b8ff 0%, transparent 60%), radial-gradient(55% 60% at 85% 15%, #9fd8ff 0%, transparent 60%), radial-gradient(70% 70% at 70% 90%, #ffc2d4 0%, transparent 60%), radial-gradient(60% 60% at 10% 95%, #b5f0dc 0%, transparent 60%), #eef0f7';
  const wallImg = photo ? `url(${photo}) center / cover no-repeat` : null;   // the own house, blurred (Bild 3)
  const v = dark
    ? '--bg: transparent; --panel: rgba(36,36,48,.42); --line: rgba(255,255,255,.14); --text: #ffffff; --muted: rgba(235,235,245,.62); --field: rgba(118,118,128,.26); --accent: #0a84ff; --accent-text: #fff; --ok: #30d158; --glass: rgba(28,28,36,.42); --glass-solid: rgba(28,28,36,.62); --glass-line: rgba(255,255,255,.18);'
    : '--bg: transparent; --panel: rgba(255,255,255,.55); --line: rgba(0,0,0,.08); --text: #1c1c1e; --muted: rgba(60,60,67,.62); --field: rgba(118,118,128,.14); --accent: #007aff; --accent-text: #fff; --ok: #34c759; --glass: rgba(255,255,255,.5); --glass-solid: rgba(255,255,255,.72); --glass-line: rgba(255,255,255,.7);';
  const st = document.createElement('style');
  st.textContent = `
  html, html[data-theme] { ${v} }
  html body { background: ${wallImg || wall} !important; background-attachment: fixed !important; font-family: -apple-system, "SF Pro Display", "Inter", system-ui, sans-serif; }
  .mkGl { backdrop-filter: blur(30px) saturate(180%) !important; -webkit-backdrop-filter: blur(30px) saturate(180%) !important;
          box-shadow: 0 12px 40px ${dark ? '#0006' : '#5a5a8a22'}, inset 0 1px 0 ${dark ? '#ffffff22' : '#ffffffcc'} !important; border-color: var(--glass-line) !important; }
  .mkGlBig { border-radius: 22px !important; }
  .mkGlFlat { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background-color: ${dark ? 'rgba(30,30,40,.55)' : 'rgba(255,255,255,.62)'} !important;
              border-color: var(--glass-line) !important; box-shadow: inset 0 1px 0 ${dark ? '#ffffff22' : '#ffffffcc'} !important; }   /* no shadow: cut off it made a box (Bild 7) */
  #toolbar { background: transparent !important; border-bottom: 0 !important; box-shadow: none !important; }
  #sceneBar { background: transparent !important; border: 0 !important; }
  @media (min-width: 700px) { #tabBar { align-self: center; width: fit-content; max-width: calc(100% - 28px); } }
  #tabBar { padding: 6px 8px !important; }
  @media (min-width: 700px) { #tabBar [data-tab] { min-width: 74px; } }
  dialog { background: var(--glass-solid) !important; backdrop-filter: blur(40px) saturate(180%) !important; -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
           border: 1px solid var(--glass-line) !important; border-radius: 28px !important; box-shadow: 0 30px 80px #0007 !important; }
  dialog::backdrop { background: rgba(0,0,0,.25) !important; backdrop-filter: blur(10px); }
  dialog * { border-color: var(--line); }
  #tabBar { margin: 0 12px 12px !important; border-radius: 26px !important; border: 1px solid var(--glass-line) !important; }
  #tabBar [data-tab] { border-radius: 18px !important; }
  #tabBar [data-tab].on, #tabBar [aria-selected=true], #tabBar .active { background: ${dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.9)'} !important; border-color: transparent !important; box-shadow: 0 2px 10px #0002 !important; }
  [data-page]:not([data-page=house]) { background: ${wallImg || wall} !important; background-attachment: fixed !important; }
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
        if (r.width > innerWidth * 0.8 && r.height > innerHeight * 0.5) { e.style.setProperty('background', wallImg || wall, 'important'); e.style.setProperty('background-attachment', 'fixed', 'important'); continue; }   // whole pages: the picture behind
        e.style.setProperty('background-color', r.width > 120 && r.height > 60 ? 'var(--panel)' : 'var(--field)', 'important');
        if (!dark) { const c = panelRgb(cs.color); if (c && (c[0] + c[1] + c[2]) / 3 > 140 && Math.max(...c.slice(0, 3)) - Math.min(...c.slice(0, 3)) > 40) e.style.setProperty('color', `color-mix(in srgb, ${cs.color} 55%, #000)`, 'important'); }   // pale coloured text: darker on light glass
        // in a strip that scrolls or fades out (the tiles, the floors, the chips at the top) the browser draws the blur as a box: glass without blur there
        const inStrip = (() => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const c = getComputedStyle(x); if (/auto|scroll|hidden/.test(c.overflowX + c.overflowY) && x.scrollWidth + x.scrollHeight > 0 && !x.matches('[data-page]') || c.maskImage !== 'none') return true; } return false; })();
        if (inStrip && !document.querySelector('[data-page]:not([hidden]):not([data-page=house])')?.contains(e)) e.classList.add('mkGlFlat');
        else if (!e.parentElement?.closest('.mkGl')) e.classList.add('mkGl');
        if (r.width > 120 && r.height > 60) e.classList.add('mkGlBig');
      }
    }
  };
  for (const pgEl of document.querySelectorAll('[data-page]:not([data-page=house])')) {     // the frame around the pages: no house shining through
    const r = pgEl.getBoundingClientRect(); if (!r.width) continue;
    for (let x = pgEl.parentElement; x && x !== document.body; x = x.parentElement) { x.style.setProperty('background', wallImg || wall, 'important'); x.style.setProperty('background-attachment', 'fixed', 'important'); }
  }
  document.querySelector('#tabBar')?.classList.add('mkGl');
  const clear = () => {
    for (const e of document.querySelectorAll('body *')) {
      if (e.tagName === 'CANVAS' || e.closest('svg') || e.closest('dialog') || e.matches('#tabBar, [data-page], .mkGl')) continue;
      if (!e.querySelector('.mkGl, button')) continue;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (r.height > innerHeight * 0.6 && r.width > innerWidth * 0.6) continue;      // whole pages keep the picture
      if (/gradient/.test(cs.backgroundImage) && r.height < innerHeight * 0.35 && r.width < innerWidth * 0.8) continue;   // picture tiles (rooms in the phone app) keep their colour
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backdropFilter !== 'none' || cs.backgroundImage !== 'none') {
        e.style.setProperty('background', 'transparent', 'important'); e.style.setProperty('backdrop-filter', 'none', 'important');
        e.style.setProperty('-webkit-backdrop-filter', 'none', 'important'); e.style.setProperty('box-shadow', 'none', 'important'); e.style.setProperty('border-color', 'transparent', 'important');
      }
    }
  };
  const strips = () => {          // strips that scroll or fade out: shadows and blur of what is inside are cut off there and look like a box
    for (const x of document.querySelectorAll('body *')) {
      if (x.matches('[data-page], dialog') || x.closest('[data-page]:not([data-page=house])')) continue;
      const c = getComputedStyle(x);
      if (!(/auto|scroll/.test(c.overflowX + c.overflowY) || c.maskImage !== 'none')) continue;
      for (const e of x.querySelectorAll('*')) { e.style.setProperty('backdrop-filter', 'none', 'important'); e.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        e.style.setProperty('box-shadow', e.matches('.mkGl, .mkGlFlat') ? `inset 0 1px 0 ${dark ? '#ffffff22' : '#ffffffcc'}` : 'none', 'important'); }
    }
  };
  mark(); clear(); strips();
  window.__mkMark = () => { mark(); clear(); strips(); };                                   // again after a page drew itself anew
  return mark;
};
