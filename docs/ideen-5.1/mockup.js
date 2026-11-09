// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Wish of 2026-11-09: "das Dach auch neu aufmachen, dass es geiler und übersichtlicher ist" and "Räume sperren, dass diese nicht
// verschoben werden". Every function paints one idea over the real demo (the 3D picture and the selection stay real), make_pictures.py
// takes the photo. The look of the column is the one of "Oberfläche 2" (docs/ideen-5.0/mockup.js, the CSS and small parts are copied).
window.mkRoof = (() => {
  const css = `
  :root { --mk2-w: 380px; }
  #panel.mk2On { width: var(--mk2-w) !important; padding: 0 !important; overflow: hidden !important; position: relative; }
  #panel.mk2On > :not(.mk2) { display: none !important; }
  #panel.mk2On > .mk2 { display: flex !important; }
  .mk2 { position: absolute; inset: 0; overflow: hidden; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; font-size: 14px; color: var(--text); }
  .mk2 * { box-sizing: border-box; }
  .mk2Crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; font-size: 12.5px; color: var(--muted); font-weight: 600; }
  .mk2Crumbs span { padding: 3px 7px; border-radius: 8px; white-space: nowrap; }
  .mk2Crumbs span.c { background: var(--field); }
  .mk2Crumbs span.last { color: var(--text); background: color-mix(in srgb, var(--accent) 22%, transparent); }
  .mk2Crumbs i { font-style: normal; opacity: .55; }
  .mk2Head { display: grid; grid-template-columns: 48px 1fr; gap: 4px 12px; align-items: center; padding: 12px; border-radius: 16px; background: var(--field);
    border: 1px solid var(--line); }
  .mk2Head .ic { grid-row: span 2; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-size: 26px;
    background: color-mix(in srgb, var(--accent) 22%, transparent); }
  .mk2Head b { font-size: 17px; display: flex; align-items: center; gap: 6px; } .mk2Head b .ed { font-size: 13px; opacity: .6; }
  .mk2Head small { color: var(--muted); font-size: 12.5px; font-weight: 600; }
  .mk2Head .chips { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .mk2Head .acts { grid-column: 1 / -1; display: flex; gap: 6px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
  .mk2Head .acts span { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px; border-radius: 10px; font-size: 17px;
    background: rgba(255,255,255,.04); } .mk2Head .acts span small { font-size: 10.5px; }
  .mk2Head .acts span.del { color: #ff8a80; }
  .mk2Chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700;
    background: rgba(255,255,255,.07); border: 1px solid var(--line); white-space: nowrap; }
  .mk2Chip.ok { background: rgba(70,167,88,.18); border-color: rgba(70,167,88,.6); color: #9be3a8; }
  .mk2Chip.warn { background: rgba(255,196,0,.15); border-color: rgba(255,196,0,.55); color: #ffd866; }
  .mk2Chip.acc { background: color-mix(in srgb, var(--accent) 22%, transparent); border-color: var(--accent); }
  .mk2Row { display: flex; gap: 8px; align-items: center; }
  .mk2Search { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; background: var(--field); border: 1px solid var(--line);
    color: var(--muted); font-size: 13.5px; } .mk2Search.on { border-color: var(--accent); color: var(--text); }
  .mk2Seg { display: inline-flex; padding: 3px; border-radius: 12px; background: var(--field); border: 1px solid var(--line); gap: 2px; flex: none; }
  .mk2Seg span { padding: 5px 10px; border-radius: 9px; font-size: 12.5px; font-weight: 700; color: var(--muted); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .mk2Seg span.on { background: var(--accent); color: var(--accent-text); }
  .mk2Seg.wide { display: flex; } .mk2Seg.wide span { flex: 1; justify-content: center; }
  .mk2Seg.big span { padding: 8px 6px; flex-direction: column; font-size: 12px; } .mk2Seg.big span i { font-style: normal; font-size: 19px; }
  .mk2Sec { border-radius: 14px; background: rgba(255,255,255,.035); border: 1px solid var(--line); flex: none; }
  .mk2Sec > .hd { display: flex; align-items: center; gap: 10px; padding: 11px 12px; }
  .mk2Sec > .hd .i { font-size: 18px; width: 24px; text-align: center; flex: none; }
  .mk2Sec > .hd b { font-size: 14.5px; flex: none; }
  .mk2Sec > .hd .sum { flex: 1; min-width: 0; color: var(--muted); font-size: 12.5px; font-weight: 600; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mk2Sec > .hd .chev { color: var(--muted); font-size: 13px; flex: none; width: 14px; text-align: center; }
  .mk2Sec.open { background: rgba(255,255,255,.055); border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); }
  .mk2Sec.open > .hd { border-bottom: 1px solid var(--line); }
  .mk2Sec > .bd { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 9px; }
  .mk2Sec.hi { box-shadow: 0 0 0 2px #ffd45c; }
  .mk2F { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; }
  .mk2F > label small { display: block; color: var(--muted); font-size: 11.5px; font-weight: 600; }
  .mk2Step { display: inline-flex; align-items: center; border-radius: 10px; background: var(--field); border: 1px solid var(--line); overflow: hidden; }
  .mk2Step span { padding: 5px 10px; font-weight: 800; color: var(--muted); } .mk2Step b { min-width: 64px; text-align: center; font-size: 14px; }
  .mk2Sel { display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 150px; padding: 6px 10px; border-radius: 10px;
    background: var(--field); border: 1px solid var(--line); font-weight: 600; font-size: 13.5px; } .mk2Sel::after { content: '▾'; color: var(--muted); }
  .mk2Tog { width: 40px; height: 23px; border-radius: 999px; background: var(--field); border: 1px solid var(--line); position: relative; flex: none; }
  .mk2Tog::after { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #8b98a5; }
  .mk2Tog.on { background: #46a758; border-color: #46a758; } .mk2Tog.on::after { left: 20px; background: #fff; }
  .mk2Ent { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 12px; background: var(--field); border: 1px solid var(--line); }
  .mk2Ent .e { font-size: 18px; } .mk2Ent div { flex: 1; min-width: 0; } .mk2Ent b { display: block; font-size: 13.5px; }
  .mk2Ent small { display: block; color: var(--muted); font-size: 11.5px; font-family: ui-monospace, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mk2Ent .st { font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 999px; background: rgba(70,167,88,.2); color: #9be3a8; }
  .mk2Ent .st.off { background: rgba(255,255,255,.08); color: var(--muted); }
  .mk2Hint { color: var(--muted); font-size: 12px; line-height: 1.4; font-weight: 600; }
  .mk2Btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border-radius: 11px; background: var(--field);
    border: 1px solid var(--line); font-weight: 700; font-size: 13px; } .mk2Btn.pri { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .mk2Btn.ghost { background: transparent; border-style: dashed; color: var(--muted); }
  .mk2Tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); flex: none; }
  .mk2Tabs span { padding: 8px 10px 9px; font-weight: 700; font-size: 13.5px; color: var(--muted); border-bottom: 3px solid transparent; margin-bottom: -1px; white-space: nowrap; }
  .mk2Tabs span.on { color: var(--text); border-color: var(--accent); }
  .mk2Tabs span em { font-style: normal; font-size: 11px; padding: 1px 6px; border-radius: 999px; background: var(--field); margin-left: 3px; }
  .mk2Grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .mk2Tile { border-radius: 12px; overflow: hidden; border: 2px solid transparent; background: var(--field); position: relative; }
  .mk2Tile .pv { height: 62px; } .mk2Tile .nm { font-size: 11.5px; font-weight: 700; padding: 5px 6px 6px; line-height: 1.2; }
  .mk2Tile.on { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent); }
  .mk2Tile.on::after { content: '✓'; position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--accent);
    color: var(--accent-text); display: grid; place-items: center; font-weight: 900; font-size: 12px; }
  .mk2Sw { display: flex; gap: 6px; flex-wrap: wrap; } .mk2Sw i { width: 26px; height: 26px; border-radius: 8px; border: 2px solid rgba(255,255,255,.15); }
  .mk2Sw i.on { border-color: #fff; box-shadow: 0 0 0 2px var(--accent); }
  .mk2Tree { display: flex; flex-direction: column; gap: 2px; font-size: 13.5px; }
  .mk2Tree .n { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 9px; font-weight: 600; }
  .mk2Tree .n .ar { width: 12px; color: var(--muted); font-size: 11px; flex: none; } .mk2Tree .n .ic { flex: none; width: 20px; text-align: center; }
  .mk2Tree .n .nm { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mk2Tree .n small { color: var(--muted); font-size: 11.5px; font-weight: 600; white-space: nowrap; }
  .mk2Tree .n .tl { display: flex; gap: 6px; color: var(--muted); font-size: 12px; opacity: .8; }
  .mk2Tree .n.on { background: color-mix(in srgb, var(--accent) 22%, transparent); box-shadow: inset 3px 0 0 var(--accent); }
  .mk2Tree .n.h { font-weight: 800; }
  .mk2Tree .grip { color: var(--muted); letter-spacing: -2px; font-size: 13px; opacity: .7; }
  .mk2Foot { margin-top: auto; display: flex; gap: 8px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--line); }
  .mk2Pop { position: absolute; z-index: 95; padding: 12px; border-radius: 14px; background: var(--panel); border: 1px solid var(--accent); box-shadow: 0 18px 50px rgba(0,0,0,.6);
    color: var(--text); font-size: 13.5px; }
  .mk2Pop h5 { margin: 0 0 8px; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .mk2Opt { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 9px; font-weight: 600; }
  .mk2Opt .rd { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--muted); flex: none; }
  .mk2Opt.on { background: color-mix(in srgb, var(--accent) 18%, transparent); } .mk2Opt.on .rd { border-color: var(--accent); background: radial-gradient(var(--accent) 45%, transparent 50%); }
  .mk2Opt small { margin-left: auto; color: var(--muted); font-size: 12px; }
  .mk2Opt .bx { width: 17px; height: 17px; border-radius: 5px; border: 2px solid var(--muted); flex: none; display: grid; place-items: center; font-size: 11px; font-weight: 900; }
  .mk2Opt .bx.on { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
  /* the switch old / new in the top bar */
  .mkUiSw { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 12px; background: var(--field); border: 1px solid #b48cff; font-weight: 700; font-size: 13px; }
  .mkUiSw span { padding: 6px 10px; border-radius: 9px; color: var(--muted); } .mkUiSw span.on { background: #b48cff; color: #1a0f2e; }
  /* notes, title */
  .mkLayer { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
  .mkNote { position: absolute; z-index: 99; max-width: 300px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  .mkNote.r::after, .mkNote.l::after, .mkNote.u::after, .mkNote.d::after { content: ''; position: absolute; border: 9px solid transparent; }
  .mkNote.r::after { right: -17px; top: 50%; margin-top: -9px; border-left-color: #ffd45c; }
  .mkNote.l::after { left: -17px; top: 50%; margin-top: -9px; border-right-color: #ffd45c; }
  .mkNote.u::after { top: -17px; left: 50%; margin-left: -9px; border-bottom-color: #ffd45c; }
  .mkNote.d::after { bottom: -17px; left: 50%; margin-left: -9px; border-top-color: #ffd45c; }
  .mkTitle { position: absolute; z-index: 99; left: 50%; transform: translateX(-50%); padding: 9px 20px; border-radius: 999px; background: #b48cff; color: #1a0f2e;
    font-weight: 900; font-size: 17px; box-shadow: 0 10px 30px rgba(0,0,0,.45); white-space: nowrap; }
  .mkTitle small { font-weight: 700; font-size: 14px; opacity: .8; margin-left: 6px; }
  .mkNew { display: inline-block; padding: 1px 7px; border-radius: 999px; background: #46a758; color: #fff; font-size: 10.5px; font-weight: 900; vertical-align: 2px; }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const $ = (s) => document.querySelector(s);
  let layer;
  const lay = () => { if (!layer) { layer = h('<div class="mkLayer"></div>'); document.body.append(layer); } return layer; };
  const note = (text, x, y, dir = '', w) => { const n = h(`<div class="mkNote ${dir}">${text}</div>`); Object.assign(n.style, { left: `${x}px`, top: `${y}px` }); if (w) n.style.maxWidth = `${w}px`; lay().append(n); return n; };
  const title = (n, text, sub = '', top) => { const stage = $('#stage').getBoundingClientRect(); const t = h(`<div class="mkTitle">${n} ${text}${sub ? `<small>${sub}</small>` : ''}</div>`);
    t.style.top = `${top ?? stage.top + 12}px`; t.style.left = `${stage.left + stage.width / 2}px`; lay().append(t); return t; };
  const fit = () => window.dispatchEvent(new Event('resize'));

  /** the new column: hides the old content of #panel and puts ours in */
  function panel(html, w = 380) {
    document.documentElement.style.setProperty('--mk2-w', `${w}px`);
    const p = $('#panel'); p.classList.add('mk2On');
    p.querySelector('.mk2')?.remove();
    const v = h(`<div class="mk2">${html}</div>`); p.append(v);
    fit();
    return v;
  }
  /** the switch "Klassisch | Neu" in the top bar, left of ⚙ */
  function uiSwitch() {
    if ($('.mkUiSw')) return;
    $('#settingsBtn').before(h('<span class="mkUiSw"><span>Klassisch</span><span class="on">✨ Neu</span></span>'));
    $('#guideBtn')?.setAttribute('hidden', '');   // a little room
  }

  // ---------- small parts ----------
  const crumbs = (list) => `<div class="mk2Crumbs">${list.map((c, i) => `<span class="${i === list.length - 1 ? 'last' : 'c'}">${c}</span>`).join('<i>›</i>')}</div>`;
  const head = ({ icon, name, sub, chips = [], acts = true, compact = false }) => compact ? `<div class="mk2Head" style="padding:9px 12px"><div class="ic" style="width:38px;height:38px;font-size:20px">${icon}</div><b>${name}</b><small>${sub}</small></div>` : `<div class="mk2Head"><div class="ic">${icon}</div><b>${name} <span class="ed">✏️</span></b><small>${sub}</small>
    ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
    ${acts ? '<div class="acts"><span>🎯<small>Zeigen</small></span><span>🔒<small>Sperren</small></span><span>⧉<small>Kopieren</small></span><span>⇉<small>Übernehmen</small></span><span class="del">🗑<small>Löschen</small></span></div>' : ''}</div>`;
  const chip = (t, c = '') => `<span class="mk2Chip ${c}">${t}</span>`;
  const sec = (icon, name, sum, body = '', cls = '') => `<div class="mk2Sec ${body ? 'open' : ''} ${cls}"><div class="hd"><span class="i">${icon}</span><b>${name}</b><span class="sum">${sum}</span><span class="chev">${body ? '▴' : '▾'}</span></div>${body ? `<div class="bd">${body}</div>` : ''}</div>`;
  const f = (label, ctl, sub = '') => `<div class="mk2F"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>${ctl}</div>`;
  const fc = (label, ctl) => `<div style="display:flex;flex-direction:column;gap:2px;font-size:12px;font-weight:700;color:var(--muted)">${label}${ctl}</div>`;
  const step = (v) => `<span class="mk2Step"><span>−</span><b>${v}</b><span>+</span></span>`;
  const seg = (opts, on, cls = '') => `<span class="mk2Seg ${cls}">${opts.map((o, i) => `<span class="${i === on ? 'on' : ''}">${o}</span>`).join('')}</span>`;
  const sel = (v) => `<span class="mk2Sel">${v}</span>`;
  const tog = (on) => `<span class="mk2Tog ${on ? 'on' : ''}"></span>`;
  const ent = (e, name, id, st, off) => `<div class="mk2Ent"><span class="e">${e}</span><div><b>${name}</b><small>${id}</small></div>${st ? `<span class="st ${off ? 'off' : ''}">${st}</span>` : ''}</div>`;
  const search = (txt = 'Einstellung suchen …', on = false) => `<div class="mk2Search ${on ? 'on' : ''}">🔍 <span>${txt}</span></div>`;
  const easy = (on = 1) => seg(['Einfach', 'Alle'], on);

  // ---------- more style for the roof and the locks ----------
  const css2 = `
  #panel .mk2Tabs span { padding: 8px 9px 9px; font-size: 13px; }
  .mk2Grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
  .rfTile { border-radius: 12px; border: 2px solid transparent; background: var(--field); position: relative; text-align: center; padding: 4px 2px 6px; }
  .rfTile svg { display: block; width: 100%; height: auto; }
  .rfTile .nm { font-size: 11.5px; font-weight: 800; line-height: 1.15; } .rfTile .nm small { display: block; color: var(--muted); font-weight: 600; font-size: 10.5px; }
  .rfTile.on { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent); background: color-mix(in srgb, var(--accent) 12%, var(--field)); }
  .rfTile.on::after { content: '✓'; position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: var(--accent);
    color: var(--accent-text); display: grid; place-items: center; font-weight: 900; font-size: 11px; }
  .rfTile .star { position: absolute; top: 4px; left: 6px; font-size: 12px; }
  .rfCard { border-radius: 14px; background: rgba(255,255,255,.035); border: 1px solid var(--line); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  .rfCard.hi { border-color: #ffd45c; box-shadow: 0 0 0 2px rgba(255,212,92,.5); background: rgba(255,212,92,.06); }
  .rfPart { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 12px; background: rgba(255,255,255,.035); border: 1px solid var(--line); font-size: 13.5px; }
  .rfPart .ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-size: 16px; background: rgba(255,255,255,.06); flex: none; }
  .rfPart b { flex: none; } .rfPart .sum { flex: 1; min-width: 0; text-align: right; color: var(--muted); font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rfPart .eye { color: var(--muted); font-size: 13px; flex: none; }
  .rfPart.hi { border-color: #ffd45c; background: rgba(255,212,92,.08); box-shadow: inset 3px 0 0 #ffd45c; }
  .rfAdd { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .rfAdd span { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 2px; border-radius: 11px; border: 1px dashed var(--line); color: var(--muted);
    font-size: 11px; font-weight: 700; } .rfAdd span i { font-style: normal; font-size: 18px; }
  .rfBig { position: absolute; z-index: 94; border-radius: 18px; background: var(--panel); border: 1px solid color-mix(in srgb, var(--accent) 60%, var(--line));
    box-shadow: 0 24px 70px rgba(0,0,0,.6); padding: 14px 16px; color: var(--text); }
  .rfBig h4 { margin: 0 0 4px; font-size: 16px; display: flex; align-items: center; gap: 8px; } .rfBig h4 small { color: var(--muted); font-weight: 600; font-size: 12.5px; }
  .rfVals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
  .rfVals div { border-radius: 12px; background: var(--field); border: 1px solid var(--line); padding: 7px 8px; text-align: center; }
  .rfVals small { display: block; color: var(--muted); font-size: 11px; font-weight: 700; } .rfVals b { font-size: 16px; }
  .rfVals div.on { border-color: #ffd45c; box-shadow: 0 0 0 2px rgba(255,212,92,.45); }
  .lkBadge { position: absolute; z-index: 93; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px 5px 8px; border-radius: 999px; background: rgba(16,24,36,.92);
    border: 2px solid #ffb74d; color: #ffd8a1; font-weight: 800; font-size: 13px; box-shadow: 0 8px 22px rgba(0,0,0,.5); transform: translate(-50%, -50%); white-space: nowrap; }
  .lkBadge.sm { padding: 3px 8px 3px 6px; font-size: 12px; }
  .lkToast { position: absolute; z-index: 96; display: flex; align-items: center; gap: 12px; padding: 11px 14px 11px 16px; border-radius: 14px; background: #2a1d10;
    border: 2px solid #ffb74d; color: #ffe2b8; font-weight: 700; font-size: 14.5px; box-shadow: 0 18px 50px rgba(0,0,0,.6); transform: translateX(-50%); white-space: nowrap; }
  .lkToast .mk2Btn { background: #ffb74d; color: #2a1d10; border-color: #ffb74d; }
  .lkBig { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; border: 2px solid #ffb74d; background: rgba(255,183,77,.1); }
  .lkBig .ic { width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; font-size: 24px; background: rgba(255,183,77,.2); flex: none; }
  .lkBig b { display: block; font-size: 15px; } .lkBig small { display: block; color: var(--muted); font-size: 12px; font-weight: 600; }
  .lkBig .mk2Tog { margin-left: auto; }
  .mk2Head .acts span.on { background: rgba(255,183,77,.18); color: #ffd8a1; box-shadow: inset 0 0 0 2px #ffb74d; }
  .mk2Chip.lock { background: rgba(255,183,77,.16); border-color: #ffb74d; color: #ffd8a1; }
  .mk2Tree .n .lk { flex: none; width: 22px; text-align: center; font-size: 13px; opacity: .35; } .mk2Tree .n .lk.on { opacity: 1; } .mk2Tree .n .lk.part { opacity: .55; filter: grayscale(.6); }
  .mk2Tree .n.locked .nm { color: #ffd8a1; }
  .mkTop { position: absolute; z-index: 95; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 11px; border: 2px solid #ffb74d;
    background: rgba(255,183,77,.15); color: #ffd8a1; font-weight: 800; font-size: 13.5px; }
  `;
  const style2 = document.createElement('style'); style2.textContent = css2; document.head.append(style2);

  /** the head of the column with its own action buttons: acts = [[icon, label, cls]] */
  const head2 = ({ icon, name, sub, chips = [], acts = [] }) => `<div class="mk2Head"><div class="ic">${icon}</div><b>${name} <span class="ed">✏️</span></b><small>${sub}</small>
    ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
    ${acts.length ? `<div class="acts">${acts.map(([i, l, c = '']) => `<span class="${c}">${i}<small>${l}</small></span>`).join('')}</div>` : ''}</div>`;
  const ROOF_ACTS = [['🎯', 'Zeigen'], ['👁', 'Ausblenden'], ['🔒', 'Sperren'], ['⧉', 'Kopieren'], ['🗑', 'Löschen', 'del']];
  const roofHead = (extra = {}) => head2({ icon: roofIcon('gable', 40), name: 'Dach', sub: 'Satteldach · 35° · 10,0 × 7,0 m', acts: ROOF_ACTS,
    chips: [chip('🏠 2 Gauben'), chip('🪟 1 Dachfenster'), chip('☀ 18 Module'), chip('🛏 ausgebaut', 'ok')], ...extra });

  // ---------- small drawings ----------
  const COL = { wall: '#ece5d8', side: '#cbc1b0', roof: '#c2583e', roofD: '#8f3b28', flat: '#7d8996', flatD: '#5b6672', glass: '#9fd3ff', edge: 'rgba(0,0,0,.3)' };
  const P = (pts, fill, extra = '') => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${COL.edge}" stroke-width="1" stroke-linejoin="round" ${extra}/>`;
  /** a little house seen from the front and the side with roof kind: gable, hip, shed, flat (and 'dormers': gable with two dormers, 'lshape', 'canopy') */
  function roofIcon(kind, w = 104) {
    const A = [16, 36], B = [66, 36], C = [88, 24], A0 = [16, 60], B0 = [66, 60], C0 = [88, 48];
    let s = '';
    const box = (top = 0) => P([A0, B0, [B[0], B[1] - top], [A[0], A[1] - top]], COL.wall) + P([B0, C0, [C[0], C[1] - top], [B[0], B[1] - top]], COL.side)
      + `<rect x="23" y="${44 - top / 2}" width="9" height="8" fill="#8fc8ef" stroke="#6d7c88" stroke-width=".8"/><rect x="50" y="${44 - top / 2}" width="9" height="8" fill="#8fc8ef" stroke="#6d7c88" stroke-width=".8"/>
         <rect x="36" y="${47 - top / 4}" width="8" height="${13 + top / 4}" fill="#8a6a4f" stroke="#5d4634" stroke-width=".8"/>`;
    if (kind === 'flat') {
      s += box(-4) + P([[A[0] - 1, A[1] + 4], [B[0] + 1, B[1] + 4], [C[0] + 1, C[1] + 4], [C[0] - 49, C[1] + 4]], COL.flat)
        + P([[A[0] - 1, A[1] + 4], [B[0] + 1, B[1] + 4], [B[0] + 1, B[1] + 1], [A[0] - 1, A[1] + 1]], COL.flatD) + P([[B[0] + 1, B[1] + 4], [C[0] + 1, C[1] + 4], [C[0] + 1, C[1] + 1], [B[0] + 1, B[1] + 1]], COL.flatD);
    } else if (kind === 'shed') {
      const Ch = [C[0], 6];
      s += P([A0, B0, B, A], COL.wall) + P([B0, C0, Ch, B], COL.side) + box().replace(/<polygon[^>]*>/g, '')
        + P([[A[0] - 3, A[1] + 1], [B[0] + 3, B[1] + 1], [Ch[0] + 3, Ch[1] - 1], [Ch[0] - 47, Ch[1] - 1]], COL.roof);
    } else if (kind === 'hip') {
      const R1 = [40, 12], R2 = [64, 12];
      s += box() + P([[B[0] + 2, B[1] + 1], [C[0] + 3, C[1] + 1], R2], COL.roofD) + P([[A[0] - 4, A[1] + 1], [B[0] + 2, B[1] + 1], R2, R1], COL.roof);
    } else {           // gable, also with dormers, a canopy or an L
      const R1 = [26, 11], R2 = [78, 11];
      if (kind === 'lshape') s += P([[60, 63], [96, 63], [96, 46], [60, 46]], COL.wall) + P([[56, 47], [100, 47], [92, 33], [64, 33]], COL.roof);
      s += box() + P([B, C, R2], COL.side) + `<polyline points="${B[0] + 2},${B[1] + 2} ${R2[0]},${R2[1] - 1} ${C[0] + 3},${C[1] + 2}" fill="none" stroke="${COL.roofD}" stroke-width="3.5" stroke-linejoin="round"/>`
        + P([[A[0] - 4, A[1] + 1], [B[0] + 2, B[1] + 1], R2, R1], COL.roof);
      if (kind === 'dormers') [[24, 24], [48, 24]].forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="11" height="9" fill="${COL.wall}" stroke="${COL.edge}"/><rect x="${x + 2.5}" y="${y + 2.5}" width="6" height="5" fill="#8fc8ef"/>`
        + P([[x - 2, y + 1], [x + 5.5, y - 6], [x + 13, y + 1]], COL.roofD); });
      if (kind === 'canopy') s += P([[16, 46], [66, 46], [60, 54], [10, 54]], '#6e7a86') + `<line x1="12" y1="54" x2="12" y2="62" stroke="#6e7a86" stroke-width="2"/><line x1="60" y1="54" x2="60" y2="62" stroke="#6e7a86" stroke-width="2"/>`;
      if (kind === 'solar') for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 30 + i * 9 - j * 3, y = 28 - j * 7; s += P([[x, y], [x + 8, y], [x + 6, y - 6], [x - 2, y - 6]], '#1b2a4a', 'stroke="#9fb3c8" stroke-width=".6"'); }
    }
    return `<svg viewBox="0 0 104 66" width="${w}" style="display:block;height:auto">${s}</svg>`;
  }
  /** a dormer on a piece of roof, seen from the front: gable, flat, shed */
  function dormerIcon(kind, w = 96) {
    let s = `<defs><pattern id="tl${kind}" width="8" height="5" patternUnits="userSpaceOnUse"><rect width="8" height="5" fill="${COL.roof}"/><path d="M0 4.5 H8" stroke="${COL.roofD}" stroke-width="1"/></pattern></defs>
      <rect x="0" y="8" width="104" height="58" fill="url(#tl${kind})"/>`;
    const win = (x, y, w2, h2) => `<rect x="${x}" y="${y}" width="${w2}" height="${h2}" fill="#8fc8ef" stroke="#55626e" stroke-width="1.2"/><line x1="${x + w2 / 2}" y1="${y}" x2="${x + w2 / 2}" y2="${y + h2}" stroke="#55626e"/>`;
    if (kind === 'gable') s += `<rect x="32" y="30" width="40" height="28" fill="${COL.wall}" stroke="${COL.edge}"/>${win(40, 35, 24, 17)}` + P([[27, 31], [52, 10], [77, 31]], COL.roofD);
    if (kind === 'flat') s += `<rect x="26" y="28" width="52" height="30" fill="${COL.wall}" stroke="${COL.edge}"/>${win(34, 33, 36, 18)}` + `<rect x="22" y="22" width="60" height="7" fill="${COL.flatD}" stroke="${COL.edge}"/>`;
    if (kind === 'shed') s += `<rect x="10" y="32" width="84" height="26" fill="${COL.wall}" stroke="${COL.edge}"/>${win(18, 37, 28, 15)}${win(58, 37, 28, 15)}` + P([[6, 33], [98, 33], [92, 20], [12, 20]], COL.roofD);
    return `<svg viewBox="0 0 104 66" width="${w}" style="display:block;height:auto">${s}</svg>`;
  }
  const roofTile = (kind, name, on, sub = '') => `<div class="rfTile ${on ? 'on' : ''}">${roofIcon(kind)}<div class="nm">${name}${sub ? `<small>${sub}</small>` : ''}</div></div>`;
  const dormerTile = (kind, name, on) => `<div class="rfTile ${on ? 'on' : ''}">${dormerIcon(kind)}<div class="nm">${name}</div></div>`;

  /** the roof cut across the ridge: knee wall, pitch, ridge, overhang, the part where one can stand (over 2 m), handles to drag */
  function profileSvg({ s = 30, big = false, hi = '' } = {}) {
    const depth = 7, knee = 1, pitch = 35, over = 0.5, wt = 0.3, rt = 0.24, tan = Math.tan(pitch * Math.PI / 180), ridge = depth / 2 * tan;
    const padL = big ? 120 : 16, padR = big ? 120 : 16, padT = big ? 36 : 14, padB = big ? 44 : 18, low = 0.55;
    const W = Math.round((depth + 2 * over + 2 * wt) * s + padL + padR), top = knee + ridge + rt / Math.cos(pitch * Math.PI / 180);
    const H = Math.round((top + low) * s + padT + padB);
    const X = (m) => padL + (m + over + wt) * s, Y = (m) => padT + (top - m) * s;
    const pt = (x, y) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
    const k = rt / Math.cos(pitch * Math.PI / 180), eaveY = knee - (over + wt) * tan;
    const acc = 'var(--accent)', HI = '#ffd45c', fs = big ? 13 : 10;
    const handle = (x, y, glyph, on) => `<g transform="translate(${x} ${y})"><circle r="${big ? 11 : 7.5}" fill="#fff" stroke="${on ? HI : acc}" stroke-width="${big ? 3.5 : 2.5}"/>${big ? `<text y="4.5" text-anchor="middle" font-size="12" font-weight="900" fill="#1d3550">${glyph}</text>` : ''}</g>`;
    const pill = (x, y, txt, on) => { const w2 = txt.length * (big ? 7.4 : 5.8) + 14; return `<g transform="translate(${x} ${y})"><rect x="${-w2 / 2}" y="${big ? -12 : -9}" width="${w2}" height="${big ? 24 : 18}" rx="${big ? 12 : 9}" fill="${on ? HI : '#1d2733'}" stroke="${on ? HI : 'rgba(255,255,255,.25)'}"/><text y="${big ? 4.5 : 3.5}" text-anchor="middle" font-size="${big ? 13 : 10.5}" font-weight="800" fill="${on ? '#2a2100' : '#e8eef5'}">${txt}</text></g>`; };
    const d0 = (2 - knee) / tan;
    let o = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="display:block;max-width:100%;height:auto;margin:0 auto;overflow:visible">
      <defs><pattern id="pfT${big ? 1 : 0}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(${-pitch})"><rect width="7" height="7" fill="${COL.roof}"/><path d="M0 6 H7" stroke="${COL.roofD}" stroke-width="1.2"/></pattern>
      <pattern id="pfT${big ? 1 : 0}b" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(${pitch})"><rect width="7" height="7" fill="${COL.roof}"/><path d="M0 6 H7" stroke="${COL.roofD}" stroke-width="1.2"/></pattern></defs>
      <rect x="${X(-wt)}" y="${Y(0)}" width="${(depth + 2 * wt) * s}" height="${low * s}" fill="rgba(255,255,255,.07)"/>
      <rect x="${X(-wt)}" y="${Y(0)}" width="${(depth + 2 * wt) * s}" height="${0.22 * s}" fill="#8995a2"/>
      ${big ? `<text x="${X(depth / 2)}" y="${Y(-low) - 5}" text-anchor="middle" font-size="${fs}" fill="rgba(255,255,255,.45)" font-weight="700">Obergeschoss</text>` : ''}
      <polygon points="${pt(0, 0)} ${pt(0, knee)} ${pt(depth / 2, knee + ridge)} ${pt(depth, knee)} ${pt(depth, 0)}" fill="rgba(255,255,255,.06)"/>
      <polygon points="${pt(d0, 0)} ${pt(d0, 2)} ${pt(depth / 2, knee + ridge)} ${pt(depth - d0, 2)} ${pt(depth - d0, 0)}" fill="rgba(70,167,88,.22)" stroke="#6fcf86" stroke-dasharray="5 4" stroke-width="1.5"/>
      <rect x="${X(-wt)}" y="${Y(knee)}" width="${wt * s}" height="${knee * s}" fill="${COL.wall}" stroke="${COL.edge}"/>
      <rect x="${X(depth)}" y="${Y(knee)}" width="${wt * s}" height="${knee * s}" fill="${COL.wall}" stroke="${COL.edge}"/>
      <polygon points="${pt(-over - wt, eaveY)} ${pt(depth / 2, knee + ridge)} ${pt(depth / 2, knee + ridge + k)} ${pt(-over - wt, eaveY + k)}" fill="url(#pfT${big ? 1 : 0})" stroke="${COL.roofD}"/>
      <polygon points="${pt(depth + over + wt, eaveY)} ${pt(depth / 2, knee + ridge)} ${pt(depth / 2, knee + ridge + k)} ${pt(depth + over + wt, eaveY + k)}" fill="url(#pfT${big ? 1 : 0}b)" stroke="${COL.roofD}"/>`;
    // somebody standing (1.80 m)
    const px = X(big ? 2.2 : 2.55), py = Y(0), ph = 1.8 * s;
    o += `<g fill="#d7e0ea" opacity=".85"><circle cx="${px}" cy="${py - ph + ph * 0.07}" r="${ph * 0.07}"/><rect x="${px - ph * 0.09}" y="${py - ph * 0.84}" width="${ph * 0.18}" height="${ph * 0.42}" rx="${ph * 0.05}"/>
      <rect x="${px - ph * 0.085}" y="${py - ph * 0.45}" width="${ph * 0.075}" height="${ph * 0.45}" rx="${ph * 0.03}"/><rect x="${px + ph * 0.01}" y="${py - ph * 0.45}" width="${ph * 0.075}" height="${ph * 0.45}" rx="${ph * 0.03}"/></g>`;
    if (big) o += `<text x="${X(4.05)}" y="${Y(0.62)}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#9be3a8">Stehhöhe über 2 m</text><text x="${X(4.05)}" y="${Y(0.62) + 16}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#9be3a8">4,1 m breit</text>`;
    // the pitch: an arc at the top of the left knee wall
    const r = (big ? 1.25 : 1.1) * s, ax = X(0), ay = Y(knee), a = pitch * Math.PI / 180;
    o += `<path d="M ${ax + r} ${ay} A ${r} ${r} 0 0 0 ${ax + r * Math.cos(a)} ${ay - r * Math.sin(a)}" fill="none" stroke="${hi === 'pitch' ? HI : acc}" stroke-width="${big ? 3 : 2}"/>
      <line x1="${ax}" y1="${ay}" x2="${ax + r * 1.25}" y2="${ay}" stroke="${hi === 'pitch' ? HI : acc}" stroke-dasharray="4 3" stroke-width="1.5"/>`;
    o += pill(ax + r * 1.55, ay - r * 0.36, '35°', hi === 'pitch') + handle(ax + r * Math.cos(a), ay - r * Math.sin(a), '⤾', hi === 'pitch');
    // the ridge height
    const rx = X(depth / 2);
    o += `<line x1="${rx}" y1="${Y(knee)}" x2="${rx}" y2="${Y(knee + ridge)}" stroke="${hi === 'ridge' ? HI : acc}" stroke-width="2" stroke-dasharray="5 4"/>
      <line x1="${X(0)}" y1="${Y(knee)}" x2="${X(depth)}" y2="${Y(knee)}" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 4"/>`;
    o += pill(rx + (big ? 64 : 44), Y(knee + ridge * 0.55), big ? 'First 2,45 m' : '2,45 m', hi === 'ridge') + handle(rx, Y(knee + ridge + k) - (big ? 14 : 9), '↕', hi === 'ridge');
    // the knee wall
    const kx = X(depth + wt) + (big ? 26 : 14);
    o += `<line x1="${kx}" y1="${Y(0)}" x2="${kx}" y2="${Y(knee)}" stroke="${hi === 'knee' ? HI : acc}" stroke-width="2"/><line x1="${kx - 5}" y1="${Y(0)}" x2="${kx + 5}" y2="${Y(0)}" stroke="${acc}" stroke-width="2"/>`;
    o += pill(kx + (big ? 66 : 34), Y(knee / 2), big ? 'Kniestock 1,00 m' : '1,00 m', hi === 'knee') + handle(kx, Y(knee), '↕', hi === 'knee');
    // the overhang
    const oy = Y(eaveY) + (big ? 30 : 18);
    o += `<line x1="${X(-over - wt)}" y1="${oy}" x2="${X(-wt)}" y2="${oy}" stroke="${hi === 'over' ? HI : acc}" stroke-width="2"/><line x1="${X(-wt)}" y1="${oy - 5}" x2="${X(-wt)}" y2="${oy + 5}" stroke="${acc}" stroke-width="2"/>`;
    o += pill(X(-over - wt) - (big ? 82 : 30), oy, big ? 'Überstand 50 cm' : '50 cm', hi === 'over') + handle(X(-over - wt), oy, '↔', hi === 'over');
    return o + '</svg>';
  }

  /** the roof seen from above: both sides, the ridge, the dormers, the roof window and the solar panels (sel: 'd1', 'd2', 'sky', 'pv') */
  function roofMapSvg({ s = 30, sel = 'd2', dims = true } = {}) {
    const pad = 22, ov = 0.5, W = (10 + 2 * ov) * s + pad * 2, H = (7 + 2 * ov) * s + pad * 2 + 8;
    const X = (x) => pad + (x + ov) * s, Z = (z) => pad + 8 + (z + ov) * s, HI = '#ffd45c';
    const hiAttr = (k) => (sel === k ? `stroke="${HI}" stroke-width="3.5" filter="url(#glow)"` : `stroke="${COL.edge}" stroke-width="1"`);
    let o = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="display:block;max-width:100%;height:auto;margin:0 auto">
      <defs><pattern id="mpA" width="9" height="7" patternUnits="userSpaceOnUse"><rect width="9" height="7" fill="#c75d43"/><path d="M0 6.5 H9" stroke="#a24631" stroke-width="1"/></pattern>
      <pattern id="mpB" width="9" height="7" patternUnits="userSpaceOnUse"><rect width="9" height="7" fill="#a94a34"/><path d="M0 0.5 H9" stroke="#863523" stroke-width="1"/></pattern>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${HI}" flood-opacity=".9"/></filter></defs>
      <rect x="${X(-ov)}" y="${Z(-ov)}" width="${(10 + 2 * ov) * s}" height="${(3.5 + ov) * s}" fill="url(#mpA)"/>
      <rect x="${X(-ov)}" y="${Z(3.5)}" width="${(10 + 2 * ov) * s}" height="${(3.5 + ov) * s}" fill="url(#mpB)"/>
      <rect x="${X(-ov)}" y="${Z(-ov)}" width="${(10 + 2 * ov) * s}" height="${(7 + 2 * ov) * s}" fill="none" stroke="#5a2418" stroke-width="2" rx="2"/>
      <rect x="${X(0)}" y="${Z(0)}" width="${10 * s}" height="${7 * s}" fill="none" stroke="rgba(255,255,255,.55)" stroke-dasharray="5 4" stroke-width="1.3"/>
      <line x1="${X(-ov)}" y1="${Z(3.5)}" x2="${X(10 + ov)}" y2="${Z(3.5)}" stroke="#4a1b11" stroke-width="5"/>
      <text x="${X(10 + ov) - 6}" y="${Z(3.5) - 6}" text-anchor="end" font-size="11" font-weight="800" fill="#ffe2d6">First</text>
      <text x="${X(-ov) + 4}" y="${Z(-ov) - 7}" font-size="11.5" font-weight="800" fill="#e8eef5">Seite A</text>
      <text x="${X(-ov) + 4}" y="${Z(7 + ov) + 15}" font-size="11.5" font-weight="800" fill="#e8eef5">Seite B</text>
      <text x="${X(-ov) - 7}" y="${Z(3.5)}" font-size="10.5" font-weight="700" fill="rgba(255,255,255,.6)" text-anchor="middle" transform="rotate(-90 ${X(-ov) - 7} ${Z(3.5)})">Giebel</text>
      <text x="${X(10 + ov) + 9}" y="${Z(3.5)}" font-size="10.5" font-weight="700" fill="rgba(255,255,255,.6)" text-anchor="middle" transform="rotate(90 ${X(10 + ov) + 9} ${Z(3.5)})">Giebel</text>`;
    // solar on side B: 6 x 3
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) o += `<rect x="${X(1.1 + i * 0.82)}" y="${Z(4.15 + j * 0.74)}" width="${0.78 * s}" height="${0.7 * s}" fill="#16233f" stroke="#9fb3c8" stroke-width=".8" rx="1"/>`;
    if (sel === 'pv') o += `<rect x="${X(1.0)}" y="${Z(4.05)}" width="${5.1 * s}" height="${2.4 * s}" fill="none" ${hiAttr('pv')} rx="4"/>`;
    // dormer 1 (gable), dormer 2 (flat), the roof window
    o += `<g ${hiAttr('d1')}><rect x="${X(1.44)}" y="${Z(-0.1)}" width="${1.6 * s}" height="${2.0 * s}" fill="#9b3f2b"/></g>
      <polygon points="${X(1.44)},${Z(1.9)} ${X(2.24)},${Z(1.9)} ${X(2.24)},${Z(-0.1)} ${X(1.44)},${Z(-0.1)}" fill="#b04a33"/>
      <line x1="${X(2.24)}" y1="${Z(-0.1)}" x2="${X(2.24)}" y2="${Z(1.9)}" stroke="#5a2418" stroke-width="2"/>
      <rect x="${X(1.64)}" y="${Z(-0.1) - 3}" width="${1.2 * s}" height="5" fill="#9fd3ff" stroke="#3a4a5a"/>`;
    o += `<rect x="${X(6.4)}" y="${Z(-0.1)}" width="${2 * s}" height="${2.1 * s}" fill="#7d8996" ${hiAttr('d2')}/>
      <rect x="${X(6.75)}" y="${Z(-0.1) - 3}" width="${1.3 * s}" height="5" fill="#9fd3ff" stroke="#3a4a5a"/>`;
    o += `<rect x="${X(4.61)}" y="${Z(1.3)}" width="${0.78 * s}" height="${0.97 * s}" fill="#9fd3ff" stroke="#2f3d4b" stroke-width="3" ${sel === 'sky' ? `filter="url(#glow)"` : ''}/>`;
    if (sel === 'sky') o += `<rect x="${X(4.61) - 3}" y="${Z(1.3) - 3}" width="${0.78 * s + 6}" height="${0.97 * s + 6}" fill="none" stroke="${HI}" stroke-width="3"/>`;
    // little pictures on the parts
    o += `<text x="${X(2.24)}" y="${Z(1.0) + 5}" text-anchor="middle" font-size="15">🏠</text><text x="${X(7.4)}" y="${Z(1.05) + 5}" text-anchor="middle" font-size="15">🏠</text>`;
    if (dims && sel === 'd2') {       // the selected dormer: handles on its sides and its distance from the gable
      const y = Z(2.55);
      o += `<line x1="${X(0)}" y1="${y}" x2="${X(6.4)}" y2="${y}" stroke="${HI}" stroke-width="2"/><line x1="${X(0)}" y1="${y - 5}" x2="${X(0)}" y2="${y + 5}" stroke="${HI}" stroke-width="2"/>
        <line x1="${X(6.4)}" y1="${y - 5}" x2="${X(6.4)}" y2="${y + 5}" stroke="${HI}" stroke-width="2"/>
        <rect x="${X(3.2) - 58}" y="${y - 11}" width="116" height="22" rx="11" fill="${HI}"/><text x="${X(3.2)}" y="${y + 4.5}" text-anchor="middle" font-size="12" font-weight="900" fill="#2a2100">6,40 m vom Giebel</text>
        ${[6.4, 8.4].map((x) => `<rect x="${X(x) - 5}" y="${Z(0.95) - 9}" width="10" height="18" rx="3" fill="#fff" stroke="${HI}" stroke-width="2.5"/>`).join('')}
        <text x="${X(7.4)}" y="${Z(-0.1) - 9}" text-anchor="middle" font-size="16" font-weight="900" fill="${HI}">⟵ ⟶</text>`;
    }
    return o + '</svg>';
  }

  // ---------- the pictures ----------
  const show = (sel = null) => { if (sel) window.__fp.select(sel[0], sel[1]); };
  /** a note left of element el, its arrow pointing at the element's middle (+dy) */
  const noteL = (el, text, w = 270, dy = 0) => {
    const r = (typeof el === 'string' ? $(el) : el).getBoundingClientRect();
    const n = note(text, 0, 0, 'r', w); n.style.width = `${w}px`;
    n.style.left = `${r.left - w - 26}px`; n.style.top = `${Math.max(64, r.top + r.height / 2 - n.offsetHeight / 2 + dy)}px`;
    return n;
  };
  const at = (x, y, text, dir, w = 260) => { const n = note(text, x, y, dir, w); n.style.width = `${w}px`; return n; };
  const tabs = (on, list = ['Form', 'Auf dem Dach<em>4</em>', 'Mehr Dächer<em>1</em>', 'Vorlagen']) => `<div class="mk2Tabs">${list.map((t, i) => `<span class="${i === on ? 'on' : ''}">${t}</span>`).join('')}</div>`;
  const crumbsRoof = () => crumbs(['🏠 Demo-Haus', '🏢 Haupthaus', '🔺 Dach']);
  const formTab = (hi = '') => `<div class="mk2Grid4">${roofTile('gable', 'Satteldach', 1)}${roofTile('hip', 'Walmdach')}${roofTile('shed', 'Pultdach')}${roofTile('flat', 'Flachdach')}</div>
    <div class="rfCard ${hi ? 'hi' : ''} mkProfile">${profileSvg({ s: 27, hi })}<div class="mk2Hint" style="text-align:center">✋ Punkte ziehen oder Zahl antippen · ⤢ groß</div></div>
    ${sec('📏', 'Größe & Überstand', 'passt sich an · 50 cm')}${sec('🧭', 'Firstrichtung', 'entlang des Hauses')}
    ${sec('🛏', 'Ausgebauter Dachstuhl', 'ja · Kniestock 1,00 m')}${sec('↔', 'Absätze in der Traufe', 'keine')}`;

  // 1 the roof at a glance (the column when the roof is clicked)
  function dachUeberblick() {
    glowRoof();
    const v = panel(`${crumbsRoof()}${roofHead()}${tabs(0)}${formTab()}`, 410);
    title('①', 'Das Dach auf einen Blick', 'ein Klick aufs Dach öffnet es');
    noteL(v.querySelector('.mk2Head .chips'), 'Oben in einer Zeile, was das Dach hat. Gauben, Dachfenster und Solar haben einen eigenen Reiter (Bild ③).', 270);
    noteL(v.querySelector('.mk2Grid4'), 'Dachform als Bilder statt einer Liste: ein Tipp, und das Dach im Bild ändert sich.', 260);
    noteL(v.querySelector('.mkProfile'), 'Das Dach von der Seite mit allen Maßen: Neigung, Firsthöhe, Kniestock, Überstand (groß: Bild ②).', 270);
    noteL(v.querySelectorAll('.mk2Sec')[2], 'Der Rest ist eingeklappt, jede Zeile sagt, was eingestellt ist. Die langen Erklärtexte werden ein kleines ⓘ.', 270);
    const s = $('#stage').getBoundingClientRect();
    at(s.left + 190, s.top + 70, 'Heute steckt das Dach unter „Etage verwalten“. Neu: aufs Dach im Bild klicken (oder im Baum auf „Dach“).', '', 330);
  }

  // 2 the roof from the side, big, with handles
  function dachProfil() {
    glowRoof();
    const v = panel(`${crumbsRoof()}${roofHead()}${tabs(0)}${formTab('pitch')}`, 410);
    const s = $('#stage').getBoundingClientRect();
    const card = h(`<div class="rfBig"><h4>📐 Dach von der Seite <small>quer durch den First · Dachgeschoss</small><span style="margin-left:auto">${seg(['Quer', 'Giebelseite'], 0)}</span></h4>
      ${profileSvg({ s: 52, big: true, hi: 'pitch' })}
      <div class="rfVals"><div class="on"><small>Neigung</small><b>35°</b></div><div><small>Firsthöhe</small><b>2,45 m</b></div><div><small>Kniestock</small><b>1,00 m</b></div><div><small>Überstand</small><b>50 cm</b></div></div>
      <div class="mk2F" style="margin-top:10px"><label>Ausgebauter Dachstuhl<small>das Dach beginnt im Dachgeschoss auf dem Kniestock</small></label>${tog(true)}</div></div>`);
    lay().append(card);
    card.style.left = `${s.left + 150}px`; card.style.top = `${s.top + 96}px`;
    title('②', 'Dach von der Seite', 'ziehen statt tippen');
    const c = card.getBoundingClientRect();
    at(c.left + 40, c.bottom + 16, 'Am gelben Punkt ziehen: die Neigung ändert sich, das 3D-Dach geht sofort mit. Die Zahlen darunter kann man auch antippen.', 'u', 330);
    at(c.left + 400, c.bottom + 16, 'Grün: wo man im Dachgeschoss aufrecht stehen kann (über 2 m). So sieht man gleich, was eine steilere Neigung bringt.', 'u', 320);
    noteL(v.querySelector('.mkProfile'), 'In der Leiste klein, mit ⤢ groß über dem Bild.', 220);
  }

  /** the column with the tab "Auf dem Dach": the map, add buttons, the parts (open: which one) */
  function partsPanel(open = 'd2') {
    const card = `<div class="rfCard hi mkDormer"><div class="mk2Row" style="justify-content:space-between"><b>🏠 Gaube Atelier</b><span class="mk2Hint">Seite A · 6,40 m vom Giebel</span></div>
      <div class="mk2Grid">${dormerTile('gable', 'Satteldach-Gaube')}${dormerTile('flat', 'Flachdach-Gaube', 1)}${dormerTile('shed', 'Schleppgaube')}</div>
      ${f('Breite', step('2,00 m'))}${f('Höhe der Wand', step('1,20 m'))}
      ${ent('🪟', 'Gaubenfenster Atelier', '2 Flügel · 128 × 80 cm', 'zu', true)}</div>`;
    return panel(`${crumbsRoof()}${head2({ icon: roofIcon('gable', 40), name: 'Dach', sub: 'Satteldach · 35° · 10,0 × 7,0 m', chips: [chip('🏠 2 Gauben'), chip('🪟 1 Dachfenster'), chip('☀ 18 Module')] })}
      ${tabs(1)}<div class="mkMap">${roofMapSvg({ s: 27, sel: open })}</div>
      <div class="rfAdd"><span><i>🏠</i>＋ Gaube</span><span><i>🪟</i>＋ Dachfenster</span><span><i>☀</i>＋ Solar</span><span><i>↔</i>＋ Absatz</span></div>
      <div class="rfPart"><span class="ic">🏠</span><b>Gaube vorne</b><span class="sum">Satteldach-Gaube · 1,60 m</span><span class="eye">▾</span></div>
      ${card}
      <div class="rfPart"><span class="ic">🪟</span><b>Dachfenster</b><span class="sum">78 × 118 cm · Kontakt</span><span class="eye">▾</span></div>
      <div class="rfPart"><span class="ic">☀</span><b>Solar</b><span class="sum">18 Module · 3582 W</span><span class="eye">▾</span></div>`, 410);
  }
  // ---------- points of the 3D picture on the screen (the camera is taken from the renderer's next frame) ----------
  let CAM = null;
  function grabCam() {
    const r = window.__fp.renderer;
    if (!r.__mk) { const o = r.render.bind(r); r.render = (sc, c) => { CAM = c; return o(sc, c); }; r.__mk = true; }
    window.__fp.frame();
  }
  const scr = ([x, y, z]) => {
    const V = window.__fp.scene.position.constructor, v = new V(x, y, z).project(CAM), r = $('#view').getBoundingClientRect();
    return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
  };
  function hull(pts) {          // the outline round some screen points (monotone chain)
    const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach((q) => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    p.reverse().forEach((q) => { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
    return [...lo.slice(0, -1), ...up.slice(0, -1)];
  }
  const corners = ([x0, y0, z0], [x1, y1, z1]) => [[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]];
  // the demo's roof (world metres): the flat dormer of the atelier, the gable dormer, the roof window, the roof itself
  const BOX = { d2: [[6.3, 7.75, 0.4], [8.5, 8.95, 2.2]], d1: [[1.44, 7.75, 0.4], [3.04, 9.3, 2.0]], sky: [[4.55, 7.8, 0.72], [5.45, 8.68, 1.82]] };
  const ROOF = [[-0.5, 7.0, -0.5], [10.5, 7.0, -0.5], [10.5, 7.0, 7.5], [-0.5, 7.0, 7.5], [-0.5, 9.8, 3.5], [10.5, 9.8, 3.5]];
  /** a glowing outline round world points (a box or a list), colour c */
  function glowPts(pts, c = '#ffd45c', fill = 'rgba(255,212,92,.14)', wid = 3.5) {
    grabCam();
    const hl = hull(pts.map(scr));
    const el = h(`<div style="position:absolute;inset:0;z-index:92;pointer-events:none"><svg style="position:absolute;left:0;top:0;overflow:visible" width="1" height="1">
      <defs><filter id="g3${c.slice(1)}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="${c}"/></filter></defs>
      <polygon points="${hl.map((q) => q.join(',')).join(' ')}" fill="${fill}" stroke="${c}" stroke-width="${wid}" stroke-linejoin="round" filter="url(#g3${c.slice(1)})"/></svg></div>`);
    lay().append(el);
    const xs = hl.map((q) => q[0]), ys = hl.map((q) => q[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  const glowRoof = () => glowPts(ROOF, '#4fc3f7', 'rgba(79,195,247,.06)', 3);
  /** the flat dormer in 3D with handles on its sides and arrows along the roof */
  function glow3d(key, { arrows = false, label = '' } = {}) {
    const [a, b] = BOX[key], bb = glowPts(corners(a, b));
    const ym = (a[1] + b[1]) / 2, zm = (a[2] + b[2]) / 2;
    const L = scr([a[0], ym, zm]), R = scr([b[0], ym, zm]), dx = R[0] - L[0], dy = R[1] - L[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (arrows) {
      const arrow = (p, dir) => `<g transform="translate(${p[0] + ux * dir * 44} ${p[1] + uy * dir * 44}) rotate(${ang + (dir < 0 ? 180 : 0)})"><polygon points="26,0 4,-15 4,-6 -22,-6 -22,6 4,6 4,15" fill="#ffd45c" stroke="#3a2c00" stroke-width="1.5"/></g>`;
      const hd = (p) => `<g transform="translate(${p[0]} ${p[1]}) rotate(${ang})"><rect x="-8" y="-17" width="16" height="34" rx="5" fill="#fff" stroke="#ffd45c" stroke-width="3"/></g>`;
      lay().append(h(`<div style="position:absolute;inset:0;z-index:93;pointer-events:none"><svg style="position:absolute;left:0;top:0;overflow:visible" width="1" height="1">${arrow(L, -1)}${arrow(R, 1)}${hd(L)}${hd(R)}</svg></div>`));
    }
    if (label) { const l = h(`<div class="lkBadge" style="border-color:#ffd45c;color:#ffe9a8">${label}</div>`); l.style.left = `${(bb.x0 + bb.x1) / 2}px`; l.style.top = `${bb.y0 - 34}px`; lay().append(l); }
    return bb;
  }

  // 3 everything on the roof: a map from above
  function dachVonOben() {
    const v = partsPanel('d2');
    glow3d('d2');
    title('③', 'Alles auf dem Dach', 'eine Karte von oben');
    noteL(v.querySelector('.mkMap'), 'Das Dach von oben: Gauben, Dachfenster und Solar dort, wo sie wirklich sind. Ziehen verschiebt, die weißen Griffe machen breiter – statt „Abstand vom Giebel 6,4“ zu tippen.', 300);
    noteL(v.querySelector('.rfAdd'), '„＋“ setzt das Neue gleich auf eine freie Stelle der Karte.', 240);
    noteL(v.querySelector('.mkDormer .mk2Grid'), 'Gaubenart als Bild. Offen ist immer nur ein Teil, der Rest ist eine Zeile.', 260);
  }

  // 4 grab the roof right in the 3D picture
  function dachIn3d() {
    partsPanel('d2');
    const g = glow3d('d2', { arrows: true, label: '🏠 Gaube Atelier · 2,00 m breit · 6,40 m vom Giebel' });
    const sb = glowPts(corners(...BOX.sky), '#9fd3ff', 'rgba(159,211,255,.12)', 2.5);
    badge((sb.x0 + sb.x1) / 2, sb.y0 - 18, '🪟 auch ziehen', 'sm').style.borderColor = '#9fd3ff';
    const rp = scr([0, 9.8, 3.5]);
    const rb = badge(rp[0], rp[1] - 26, '⤾ 35° · am First ziehen = Neigung'); rb.style.borderColor = '#4fc3f7'; rb.style.color = '#cdeeff';
    title('④', 'Direkt am Dach ziehen', 'im 3D-Bild');
    if (g) {
      at(g.x0 - 120, g.y1 + 40, 'Eine Gaube im 3D-Bild anfassen: zur Seite ziehen verschiebt sie auf dem Dach, die weißen Griffe machen sie breiter. Die Leiste rechts geht mit.', 'u', 330);
    }
    noteL('.mkDormer', 'Dieselbe Gaube ist rechts aufgeklappt.', 220);
  }

  // 5 ready-made roofs
  function dachVorlagen() {
    glowRoof();
    const big = (k, n, sub, on) => `<div class="rfTile ${on ? 'on' : ''}" style="padding:5px 3px 7px">${roofIcon(k, 112)}<div class="nm">${n}<small>${sub}</small></div></div>`;
    const v = panel(`${crumbsRoof()}${head2({ icon: roofIcon('gable', 40), name: 'Dach', sub: 'Satteldach · 35° · 10,0 × 7,0 m', chips: [chip('🏠 2 Gauben'), chip('🪟 1 Dachfenster'), chip('☀ 18 Module')] })}
      ${tabs(3)}<div class="mk2Hint">Ein Tipp stellt Form, Neigung, Überstand und Gauben ein. Die Größe nimmt die Vorlage von deinem Haus.</div>
      <div class="mk2Grid mkTpl" style="grid-template-columns:repeat(3,1fr);gap:8px">${big('gable', 'Satteldach', '35° · klassisch')}${big('dormers', 'Satteldach mit Gauben', '35° · 2 Gauben', 1)}
      ${big('hip', 'Walmdach', '30° · ringsum schräg')}${big('shed', 'Pultdach', '10° · modern')}${big('flat', 'Flachdach', 'Bungalow · mit Attika')}${big('lshape', 'L-Haus', 'zwei Dächer mit Kehle')}
      ${big('canopy', 'Mit Vordach', 'Pultdach über der Tür')}${big('solar', 'Mit Solar', 'Module auf Seite B')}
      <div class="rfTile" style="display:grid;place-items:center;border:2px dashed var(--line);background:transparent"><div class="nm" style="font-size:26px">⭐<small style="font-size:11.5px;font-weight:800;color:var(--text)">Mein Dach merken</small><small>auch fürs Nachbarhaus</small></div></div></div>`, 410);
    title('⑤', 'Fertige Dächer', 'antippen, dann fein einstellen');
    noteL(v.querySelector('.mkTpl .rfTile'), 'Fertige Dächer als Bilder: ein Tipp, und das Haus hat das Dach. Danach im Reiter „Form“ fein einstellen.', 280);
    noteL(v.querySelectorAll('.mkTpl .rfTile')[3], 'Beim Antippen zeigt das 3D-Bild das neue Dach sofort; ↶ macht es wieder rückgängig.', 260);
    noteL(v.querySelectorAll('.mkTpl .rfTile')[6], 'Das eigene Dach merken und z. B. beim Nachbarhaus wieder benutzen.', 250);
  }

  // 6 before / after: the classic column of the roof (today) and the new one
  function dachVorherNachher() {
    document.querySelectorAll('#panel details').forEach((d) => { if (/Etage verwalten/.test(d.querySelector('summary')?.textContent || '')) d.open = true; });
    setTimeout(() => {
      const H = 900, src = $('#panel');
      const mk = () => { const o = src.cloneNode(true); o.removeAttribute('id'); o.id = 'panel';
        Object.assign(o.style, { width: '290px', height: 'auto', maxHeight: 'none', overflow: 'visible', position: 'absolute', left: '0', top: '0', borderLeft: '1px solid var(--line)' }); return o; };
      const ov = h(`<div style="position:fixed;inset:0;z-index:91;background:rgba(5,9,14,.92);display:flex;align-items:flex-start;justify-content:center;gap:34px;padding:74px 30px 10px;color:var(--text)">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px"><b style="font-size:18px">Heute (unter „Etage verwalten“, in 3 Stücken)</b><div class="oldCols" style="display:flex;gap:10px"></div></div>
        <div style="align-self:center;font-size:46px;color:#b48cff">➜</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px"><b style="font-size:18px">Neu</b><div class="newBox" style="width:410px;height:${H - 74}px;border-radius:12px;border:2px solid #46a758;position:relative;background:var(--panel);overflow:hidden"></div></div></div>`);
      lay().append(ov);
      const cols = ov.querySelector('.oldCols'), probe = mk(); cols.append(probe);
      const realH = probe.getBoundingClientRect().height || 4100; probe.remove();
      const boxH = H - 74, k = Math.min(1, (boxH * 3) / realH), part = boxH / k;
      for (let i = 0; i < 3; i++) {
        const box = h(`<div style="height:${boxH}px;width:${290 * k}px;overflow:hidden;border-radius:12px;border:2px solid #ff8a80;position:relative"></div>`);
        const o = mk(); o.style.transform = `scale(${k}) translateY(${-i * part}px)`; o.style.transformOrigin = '0 0';
        box.append(o); cols.append(box);
      }
      const ob = cols.getBoundingClientRect();
      ov.querySelector('.newBox').innerHTML = `<div class="mk2" style="position:absolute">${crumbsRoof()}${roofHead()}${tabs(0)}${formTab()}</div>`;
      const nr = ov.querySelector('.newBox').getBoundingClientRect();
      at(ob.left - 248, ob.top + 160, `Heute: Etage, Dach, Gauben, Dachfenster, Absätze und weitere Dächer untereinander, dazwischen lange Erklärtexte. ${Math.round(realH)} Pixel hoch: etwa ${Math.round(realH / 860)} Bildschirme scrollen.`, 'r', 222);
      at(nr.right + 24, nr.top + 300, 'Neu: eine Bildschirmhöhe. Gauben & Co. im Reiter „Auf dem Dach“, weitere Dächer im eigenen Reiter, fertige Dächer unter „Vorlagen“.', 'l', 212);
      title('⑥', 'Vorher / nachher', 'das Dach', 12);
    }, 600);
  }

  // ---------- locking rooms ----------
  /** the screen point of a room in 3D: its middle, 1 m over its floor */
  function roomScreen(id) {
    const fl = window.__fp.layout.floors, fi = fl.findIndex((q) => q.rooms.some((r) => r.id === id)), r = fl[fi]?.rooms.find((q) => q.id === id);
    if (!r) return null;
    const c = r.points.reduce((a, p) => [a[0] + p[0] / r.points.length, a[1] + p[1] / r.points.length], [0, 0]);
    grabCam();
    const [x, y] = scr([c[0], (+window.__fp.elev(fi) || 0) + 1.0, c[1]]);
    return { x, y };
  }
  /** the floor of a locked room in 3D: hatched, a lock on each corner */
  function lockRoom3d(id, locks = true) {
    const fl = window.__fp.layout.floors, fi = fl.findIndex((q) => q.rooms.some((r) => r.id === id)), r = fl[fi].rooms.find((q) => q.id === id);
    grabCam();
    const y = (+window.__fp.elev(fi) || 0) + 0.06, sp = r.points.map(([x, z]) => scr([x, y, z]));
    lay().append(h(`<div style="position:absolute;inset:0;z-index:91;pointer-events:none"><svg style="position:absolute;left:0;top:0;overflow:visible" width="1" height="1"><defs><pattern id="lk3" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="12" fill="rgba(255,183,77,.08)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,183,77,.5)" stroke-width="2.5"/></pattern></defs>
      <polygon points="${sp.map((q) => q.join(',')).join(' ')}" fill="url(#lk3)" stroke="#ffb74d" stroke-width="3" stroke-dasharray="10 6"/></svg></div>`));
    if (locks) sp.forEach(([x, yy]) => badge(x, yy, '🔒', 'sm'));
  }
  const badge = (x, y, text, cls = '') => { const b = h(`<div class="lkBadge ${cls}">${text}</div>`); b.style.left = `${x}px`; b.style.top = `${y}px`; lay().append(b); return b; };

  // 7 lock a room
  function raumSperren() {
    const v = panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer'])}
      ${head2({ icon: '🛋', name: 'Wohnzimmer', sub: '27,0 m² · 6,00 × 4,50 m · Erdgeschoss', chips: [chip('🔒 Gesperrt', 'lock'), chip('🔗 Bereich „Wohnzimmer“', 'ok'), chip('🌡 21,4°')],
        acts: [['🎯', 'Zeigen'], ['🔒', 'Gesperrt', 'on mkLock'], ['⧉', 'Kopieren'], ['⇉', 'Übernehmen'], ['🗑', 'Löschen', 'del" style="opacity:.35']] })}
      <div class="mk2Tabs"><span class="on">Allgemein</span><span>Boden</span><span>Wände</span><span>Geräte<em>12</em></span></div>
      ${f('Name', sel('Wohnzimmer'))}${f('Bereich in HA', sel('🛋 Wohnzimmer'))}
      <div class="mk2F" style="opacity:.55"><label>Größe<small>🔒 gesperrt</small></label><span class="mk2Step"><span>−</span><b>6,00 × 4,50 m</b><span>+</span></span></div>
      ${sec('🪵', 'Boden', 'Fischgrät · 0 cm')}${sec('🧱', 'Wände', 'Raufaser · weiß · 🔒')}${sec('📟', 'Geräte im Raum', '12 · frei verschiebbar')}`, 400);
    const lb = v.querySelector('.mkLock').getBoundingClientRect();
    const pop = h(`<div class="mk2Pop" style="width:330px"><h5>Was bleibt fest?</h5>
      <div class="mk2Opt on"><span class="bx on">✓</span>Wände und Ecken <small>Form, Größe</small></div>
      <div class="mk2Opt on"><span class="bx on">✓</span>Fenster und Türen <small>bleiben an der Wand</small></div>
      <div class="mk2Opt"><span class="bx"></span>Geräte und Möbel <small>frei verschiebbar</small></div>
      <div class="mk2Opt"><span class="bx"></span>Name und Einstellungen <small>nur ansehen</small></div>
      <h5 style="margin-top:10px">Gilt für</h5>${seg(['Nur dieser Raum', 'Ganze Etage', 'Ganzes Haus'], 0, 'wide')}
      <div class="mk2Row" style="margin-top:10px"><span class="mk2Btn" style="flex:1">🔓 Entsperren</span><span class="mk2Btn pri" style="flex:1">Fertig</span></div></div>`);
    lay().append(pop); pop.style.left = `${lb.left - 150}px`; pop.style.top = `${lb.bottom + 10}px`;
    const p = roomScreen('r1');
    lockRoom3d('r1');
    if (p) badge(p.x, p.y - 40, '🔒 Wohnzimmer');
    title('⑦', 'Raum sperren', 'damit nichts verrutscht');
    const pr = pop.getBoundingClientRect();
    at(pr.left - 316, pr.top + 20, 'Ein Tipp auf 🔒 oben beim Raum: Wände, Ecken, Fenster und Türen lassen sich nicht mehr ziehen. Löschen geht erst nach dem Entsperren.', 'r', 290);
    at(pr.left - 316, pr.top + 190, 'Selbst wählen, was fest bleibt: z. B. Geräte im Raum weiter verschieben, den Grundriss aber nicht.', 'r', 290);
    if (p) at(p.x - 140, p.y - 220, 'Im Bild zeigt ein Schloss, welcher Raum gesperrt ist.', 'd', 260);
  }

  /** world point (x, z of the plan) → screen, from the labels of two rooms in the 2D plan */
  function planMap() {
    const tx = [...document.querySelectorAll('#plan2d svg text')];
    const lab = (n) => tx.find((t) => t.textContent.trim() === n);
    const w = lab('Wohnzimmer'), k = lab('Küche'), svg = w.ownerSVGElement.getBoundingClientRect();
    const [xw, yw, xk] = [+w.getAttribute('x'), +w.getAttribute('y'), +k.getAttribute('x')];
    const s = (xk - xw) / 5;
    return { s, at: (x, z) => [svg.left + xw + (x - 3) * s, svg.top + yw + (z - 2.25) * s] };
  }
  /** hatch and corner locks over a locked room of the ground floor (pts in metres) */
  function lockRoom(M, pts, name) {
    const sp = pts.map(([x, z]) => M.at(x, z));
    const el = h(`<svg style="position:absolute;left:0;top:0;overflow:visible;z-index:92" width="1" height="1"><defs><pattern id="lkH" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="12" fill="rgba(255,183,77,.07)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,183,77,.45)" stroke-width="2.5"/></pattern></defs>
      <polygon points="${sp.map((p) => p.join(',')).join(' ')}" fill="url(#lkH)" stroke="#ffb74d" stroke-width="3" stroke-dasharray="9 6"/></svg>`);
    lay().append(el);
    sp.forEach(([x, y]) => badge(x, y, '🔒', 'sm'));
    const c = sp.reduce((a, p) => [a[0] + p[0] / sp.length, a[1] + p[1] / sp.length], [0, 0]);
    badge(c[0], c[1] - 38, `🔒 ${name}`);
  }

  // 8 the plan with locked rooms
  function planGesperrt() {
    const M = planMap();
    lockRoom(M, [[0, 0], [6, 0], [6, 4.5], [0, 4.5]], 'gesperrt');
    lockRoom(M, [[6, 0], [10, 0], [10, 4.5], [6, 4.5]], 'gesperrt');
    // the wall between the kitchen and the utility room: somebody tries to drag it
    const [a, b] = [M.at(10, 0.15), M.at(10, 4.35)];
    const wl = h(`<svg style="position:absolute;left:0;top:0;overflow:visible;z-index:93" width="1" height="1"><defs><filter id="rg" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff6b4a"/></filter></defs>
      <line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#ff6b4a" stroke-width="9" stroke-linecap="round" filter="url(#rg)" opacity=".9"/>
      <g fill="none" stroke="#ff6b4a" stroke-width="3" stroke-linecap="round"><path d="M ${a[0] + 16} ${(a[1] + b[1]) / 2 - 18} q 10 18 0 36"/><path d="M ${a[0] + 26} ${(a[1] + b[1]) / 2 - 26} q 15 26 0 52"/></g></svg>`);
    lay().append(wl);
    const hand = h('<div style="position:absolute;z-index:94;font-size:34px;transform:translate(-30%,-20%)">✋</div>'); hand.style.left = `${a[0] + 4}px`; hand.style.top = `${(a[1] + b[1]) / 2}px`; lay().append(hand);
    const st = $('#stage').getBoundingClientRect();
    const toast = h('<div class="lkToast">🔒 Diese Wand gehört zur <b>Küche</b> – sie ist gesperrt. <span class="mk2Btn">Küche entsperren</span></div>');
    lay().append(toast); toast.style.left = `${st.left + st.width / 2}px`; toast.style.top = `${st.bottom - 140}px`;
    const v = panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🧱 Wand'])}
      ${head2({ icon: '🧱', name: 'Wand 7', sub: '4,50 m · 24 cm dick', chips: [chip('🔒 fest: Küche ist gesperrt', 'lock')], acts: [['🎯', 'Zeigen'], ['🔒', 'Fest', 'on'], ['⧉', 'Kopieren'], ['🗑', 'Löschen', 'del" style="opacity:.35']] })}
      <div class="mk2Hint">Die Wand trennt <b>Küche</b> 🔒 und <b>Hauswirtschaft</b>. Weil die Küche gesperrt ist, bleibt sie stehen; Farbe und Putz lassen sich trotzdem ändern.</div>
      ${sec('🎨', 'Aussehen', 'Raufaser · weiß')}${sec('🪟', 'Fenster und Türen', '1 Tür · 🔒')}`, 400);
    title('⑧', 'Gesperrt im 2D-Plan', 'Wände ziehen geht nicht mehr');
    const ra = M.at(3, 0), rb = M.at(8, 4.5);
    at(ra[0] - 110, ra[1] - 150, 'Gesperrte Räume sind schraffiert, an den Ecken sitzt ein Schloss statt der weißen Griffe.', 'd', 270);
    at(toast.getBoundingClientRect().left + 80, toast.getBoundingClientRect().top - 120, 'Wer trotzdem an einer Wand zieht, bekommt einen kurzen Hinweis mit „Entsperren“ – nichts verschiebt sich aus Versehen.', 'd', 330);
    noteL(v.querySelector('.mk2Hint'), 'Auch die Wand zum Nachbarraum bleibt fest, sonst würde sich die gesperrte Küche verformen.', 270);
    void rb;
  }

  // 9 lock everything at once (the floor plan is finished)
  function allesSperren() {
    const n = (cls, ar, ic, nm, small = '', lk = '', ind = 0) => `<div class="n ${cls}" style="padding-left:${8 + ind * 16}px"><span class="ar">${ar}</span><span class="ic">${ic}</span><span class="nm">${nm}</span>${small ? `<small>${small}</small>` : ''}<span class="lk ${lk === '◐' ? 'part' : lk ? 'on' : ''}">${lk === '◐' ? '🔒' : lk || '🔓'}</span></div>`;
    const v = panel(`<div class="mk2Row"><span class="mk2Seg wide" style="flex:1"><span class="on">🗂 Haus</span><span>🔍 Objekte</span><span>❔ Hilfe</span></span></div>
      <div class="lkBig mkAll"><span class="ic">🔒</span><div><b>Grundriss fertig</b><small>Wände und Räume im ganzen Haus sperren. Geräte bleiben frei.</small></div>${tog(true)}</div>
      <div class="mk2Opt" style="padding:2px 6px"><span class="bx on">✓</span>Nur Admins dürfen entsperren</div>
      <div class="mk2Tree mkTree">
        ${n('h', '▾', '🏠', 'Demo-Haus', '', '🔒')}
        ${n('h', '▾', '🏢', 'Haupthaus', '5 Etagen', '🔒', 1)}
        ${n('locked', '▸', '🔺', 'Dach', 'Satteldach', '🔒', 2)}
        ${n('locked', '▸', '▤', 'Dachgeschoss', '2 Räume', '🔒', 2)}
        ${n('locked', '▸', '▤', 'Obergeschoss', '7 Räume', '🔒', 2)}
        ${n('locked on', '▾', '▤', 'Erdgeschoss', '6 Räume', '🔒', 2)}
        ${n('locked', '', '🛋', 'Wohnzimmer', '27 m²', '🔒', 3)}${n('locked', '', '🍳', 'Küche', '18 m²', '🔒', 3)}${n('locked', '', '🛁', 'Bad', '7,5 m²', '🔒', 3)}
        ${n('locked', '', '🛏', 'Schlafzimmer', '10 m²', '🔒', 3)}${n('locked', '', '💻', 'Büro', '7,5 m²', '🔒', 3)}${n('locked', '', '🧺', 'Hauswirtschaft', '30 m²', '🔒', 3)}
        ${n('', '▸', '⬇', 'Keller', '2 von 4 gesperrt', '◐', 2)}
        ${n('h', '▸', '🏠', 'Nachbarhaus', '', '', 0)}
      </div>`, 400);
    $('#guideBtn')?.setAttribute('hidden', '');
    document.querySelector('.mkTopReal')?.remove();
    const top = h('<span class="mkTop mkTopReal" style="position:static">🔒 Grundriss gesperrt</span>'); $('#saveBtn').before(top);
    window.__fp.layout.floors[1].rooms.forEach((r) => lockRoom3d(r.id, false));
    title('⑨', 'Alles auf einmal sperren', 'wenn der Grundriss fertig ist');
    noteL(v.querySelector('.mkAll'), 'Ein Schalter für alles: Ist der Grundriss fertig, verrutscht beim Geräte-Setzen keine Wand mehr.', 270, 40);
    noteL(v.querySelectorAll('.mkTree .n')[6], 'Oder einzeln: ein Schloss je Etage und je Raum direkt im Baum. Ein blasses Schloss: ein Teil davon ist gesperrt.', 270);
    noteL(top, 'Oben sieht man immer, dass gesperrt ist. Ein Tipp darauf entsperrt (mit Rückfrage).', 300);
  }

  return { dachUeberblick, dachProfil, dachVonOben, dachIn3d, dachVorlagen, dachVorherNachher, raumSperren, planGesperrt, allesSperren };
})();
