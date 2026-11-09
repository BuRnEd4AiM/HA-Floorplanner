// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Wish of 2026-11-08: "so unendlich viele Einstellmöglichkeiten" (windows, floors, floor height …): a new look of the edit column on the
// right ("Version 2"), switchable between old and new; fold things in and out, tabs ("Noppel") hanging on the column, simpler for everyone.
// Every function paints one idea over the real demo (the 3D picture and the selection stay real), make_pictures.py takes the photo.
window.mkV2 = (() => {
  const css = `
  :root { --v2-w: 380px; }
  #panel.v2On { width: var(--v2-w) !important; padding: 0 !important; overflow: hidden !important; position: relative; }
  #panel.v2On > :not(.v2) { display: none !important; }
  .v2 { position: absolute; inset: 0; overflow: hidden; display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; font-size: 14px; color: var(--text); }
  .v2 * { box-sizing: border-box; }
  .v2Crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; font-size: 12.5px; color: var(--muted); font-weight: 600; }
  .v2Crumbs span { padding: 3px 7px; border-radius: 8px; white-space: nowrap; }
  .v2Crumbs span.c { background: var(--field); }
  .v2Crumbs span.last { color: var(--text); background: color-mix(in srgb, var(--accent) 22%, transparent); }
  .v2Crumbs i { font-style: normal; opacity: .55; }
  .v2Head { display: grid; grid-template-columns: 48px 1fr; gap: 4px 12px; align-items: center; padding: 12px; border-radius: 16px; background: var(--field);
    border: 1px solid var(--line); }
  .v2Head .ic { grid-row: span 2; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-size: 26px;
    background: color-mix(in srgb, var(--accent) 22%, transparent); }
  .v2Head b { font-size: 17px; display: flex; align-items: center; gap: 6px; } .v2Head b .ed { font-size: 13px; opacity: .6; }
  .v2Head small { color: var(--muted); font-size: 12.5px; font-weight: 600; }
  .v2Head .chips { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .v2Head .acts { grid-column: 1 / -1; display: flex; gap: 6px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
  .v2Head .acts span { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px; border-radius: 10px; font-size: 17px;
    background: rgba(255,255,255,.04); } .v2Head .acts span small { font-size: 10.5px; }
  .v2Head .acts span.del { color: #ff8a80; }
  .v2Chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700;
    background: rgba(255,255,255,.07); border: 1px solid var(--line); white-space: nowrap; }
  .v2Chip.ok { background: rgba(70,167,88,.18); border-color: rgba(70,167,88,.6); color: #9be3a8; }
  .v2Chip.warn { background: rgba(255,196,0,.15); border-color: rgba(255,196,0,.55); color: #ffd866; }
  .v2Chip.acc { background: color-mix(in srgb, var(--accent) 22%, transparent); border-color: var(--accent); }
  .v2Row { display: flex; gap: 8px; align-items: center; }
  .v2Search { flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; background: var(--field); border: 1px solid var(--line);
    color: var(--muted); font-size: 13.5px; } .v2Search.on { border-color: var(--accent); color: var(--text); }
  .v2Seg { display: inline-flex; padding: 3px; border-radius: 12px; background: var(--field); border: 1px solid var(--line); gap: 2px; flex: none; }
  .v2Seg span { padding: 5px 10px; border-radius: 9px; font-size: 12.5px; font-weight: 700; color: var(--muted); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .v2Seg span.on { background: var(--accent); color: var(--accent-text); }
  .v2Seg.wide { display: flex; } .v2Seg.wide span { flex: 1; justify-content: center; }
  .v2Seg.big span { padding: 8px 6px; flex-direction: column; font-size: 12px; } .v2Seg.big span i { font-style: normal; font-size: 19px; }
  .v2Sec { border-radius: 14px; background: rgba(255,255,255,.035); border: 1px solid var(--line); flex: none; }
  .v2Sec > .hd { display: flex; align-items: center; gap: 10px; padding: 11px 12px; }
  .v2Sec > .hd .i { font-size: 18px; width: 24px; text-align: center; flex: none; }
  .v2Sec > .hd b { font-size: 14.5px; flex: none; }
  .v2Sec > .hd .sum { flex: 1; min-width: 0; color: var(--muted); font-size: 12.5px; font-weight: 600; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v2Sec > .hd .chev { color: var(--muted); font-size: 13px; flex: none; width: 14px; text-align: center; }
  .v2Sec.open { background: rgba(255,255,255,.055); border-color: color-mix(in srgb, var(--accent) 55%, var(--line)); }
  .v2Sec.open > .hd { border-bottom: 1px solid var(--line); }
  .v2Sec > .bd { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 9px; }
  .v2Sec.hi { box-shadow: 0 0 0 2px #ffd45c; }
  .v2F { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; }
  .v2F > label small { display: block; color: var(--muted); font-size: 11.5px; font-weight: 600; }
  .v2Step { display: inline-flex; align-items: center; border-radius: 10px; background: var(--field); border: 1px solid var(--line); overflow: hidden; }
  .v2Step span { padding: 5px 10px; font-weight: 800; color: var(--muted); } .v2Step b { min-width: 64px; text-align: center; font-size: 14px; }
  .v2Sel { display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 150px; padding: 6px 10px; border-radius: 10px;
    background: var(--field); border: 1px solid var(--line); font-weight: 600; font-size: 13.5px; } .v2Sel::after { content: '▾'; color: var(--muted); }
  .v2Tog { width: 40px; height: 23px; border-radius: 999px; background: var(--field); border: 1px solid var(--line); position: relative; flex: none; }
  .v2Tog::after { content: ''; position: absolute; top: 3px; left: 3px; width: 15px; height: 15px; border-radius: 50%; background: #8b98a5; }
  .v2Tog.on { background: #46a758; border-color: #46a758; } .v2Tog.on::after { left: 20px; background: #fff; }
  .v2Ent { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 12px; background: var(--field); border: 1px solid var(--line); }
  .v2Ent .e { font-size: 18px; } .v2Ent div { flex: 1; min-width: 0; } .v2Ent b { display: block; font-size: 13.5px; }
  .v2Ent small { display: block; color: var(--muted); font-size: 11.5px; font-family: ui-monospace, monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v2Ent .st { font-size: 12px; font-weight: 800; padding: 3px 8px; border-radius: 999px; background: rgba(70,167,88,.2); color: #9be3a8; }
  .v2Ent .st.off { background: rgba(255,255,255,.08); color: var(--muted); }
  .v2Hint { color: var(--muted); font-size: 12px; line-height: 1.4; font-weight: 600; }
  .v2Btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border-radius: 11px; background: var(--field);
    border: 1px solid var(--line); font-weight: 700; font-size: 13px; } .v2Btn.pri { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .v2Btn.ghost { background: transparent; border-style: dashed; color: var(--muted); }
  .v2Tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); flex: none; }
  .v2Tabs span { padding: 8px 10px 9px; font-weight: 700; font-size: 13.5px; color: var(--muted); border-bottom: 3px solid transparent; margin-bottom: -1px; white-space: nowrap; }
  .v2Tabs span.on { color: var(--text); border-color: var(--accent); }
  .v2Tabs span em { font-style: normal; font-size: 11px; padding: 1px 6px; border-radius: 999px; background: var(--field); margin-left: 3px; }
  .v2Grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .v2Tile { border-radius: 12px; overflow: hidden; border: 2px solid transparent; background: var(--field); position: relative; }
  .v2Tile .pv { height: 62px; } .v2Tile .nm { font-size: 11.5px; font-weight: 700; padding: 5px 6px 6px; line-height: 1.2; }
  .v2Tile.on { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent); }
  .v2Tile.on::after { content: '✓'; position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--accent);
    color: var(--accent-text); display: grid; place-items: center; font-weight: 900; font-size: 12px; }
  .v2Sw { display: flex; gap: 6px; flex-wrap: wrap; } .v2Sw i { width: 26px; height: 26px; border-radius: 8px; border: 2px solid rgba(255,255,255,.15); }
  .v2Sw i.on { border-color: #fff; box-shadow: 0 0 0 2px var(--accent); }
  .v2Tree { display: flex; flex-direction: column; gap: 2px; font-size: 13.5px; }
  .v2Tree .n { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 9px; font-weight: 600; }
  .v2Tree .n .ar { width: 12px; color: var(--muted); font-size: 11px; flex: none; } .v2Tree .n .ic { flex: none; width: 20px; text-align: center; }
  .v2Tree .n .nm { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v2Tree .n small { color: var(--muted); font-size: 11.5px; font-weight: 600; white-space: nowrap; }
  .v2Tree .n .tl { display: flex; gap: 6px; color: var(--muted); font-size: 12px; opacity: .8; }
  .v2Tree .n.on { background: color-mix(in srgb, var(--accent) 22%, transparent); box-shadow: inset 3px 0 0 var(--accent); }
  .v2Tree .n.h { font-weight: 800; }
  .v2Tree .grip { color: var(--muted); letter-spacing: -2px; font-size: 13px; opacity: .7; }
  .v2Foot { margin-top: auto; display: flex; gap: 8px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--line); }
  .v2Pop { position: absolute; z-index: 95; padding: 12px; border-radius: 14px; background: var(--panel); border: 1px solid var(--accent); box-shadow: 0 18px 50px rgba(0,0,0,.6);
    color: var(--text); font-size: 13.5px; }
  .v2Pop h5 { margin: 0 0 8px; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .v2Opt { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 9px; font-weight: 600; }
  .v2Opt .rd { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--muted); flex: none; }
  .v2Opt.on { background: color-mix(in srgb, var(--accent) 18%, transparent); } .v2Opt.on .rd { border-color: var(--accent); background: radial-gradient(var(--accent) 45%, transparent 50%); }
  .v2Opt small { margin-left: auto; color: var(--muted); font-size: 12px; }
  .v2Opt .bx { width: 17px; height: 17px; border-radius: 5px; border: 2px solid var(--muted); flex: none; display: grid; place-items: center; font-size: 11px; font-weight: 900; }
  .v2Opt .bx.on { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
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
    document.documentElement.style.setProperty('--v2-w', `${w}px`);
    const p = $('#panel'); p.classList.add('v2On');
    p.querySelector('.v2')?.remove();
    const v = h(`<div class="v2">${html}</div>`); p.append(v);
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
  const crumbs = (list) => `<div class="v2Crumbs">${list.map((c, i) => `<span class="${i === list.length - 1 ? 'last' : 'c'}">${c}</span>`).join('<i>›</i>')}</div>`;
  const head = ({ icon, name, sub, chips = [], acts = true, compact = false }) => compact ? `<div class="v2Head" style="padding:9px 12px"><div class="ic" style="width:38px;height:38px;font-size:20px">${icon}</div><b>${name}</b><small>${sub}</small></div>` : `<div class="v2Head"><div class="ic">${icon}</div><b>${name} <span class="ed">✏️</span></b><small>${sub}</small>
    ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
    ${acts ? '<div class="acts"><span>🎯<small>Zeigen</small></span><span>🔒<small>Sperren</small></span><span>⧉<small>Kopieren</small></span><span>⇉<small>Übernehmen</small></span><span class="del">🗑<small>Löschen</small></span></div>' : ''}</div>`;
  const chip = (t, c = '') => `<span class="v2Chip ${c}">${t}</span>`;
  const sec = (icon, name, sum, body = '', cls = '') => `<div class="v2Sec ${body ? 'open' : ''} ${cls}"><div class="hd"><span class="i">${icon}</span><b>${name}</b><span class="sum">${sum}</span><span class="chev">${body ? '▴' : '▾'}</span></div>${body ? `<div class="bd">${body}</div>` : ''}</div>`;
  const f = (label, ctl, sub = '') => `<div class="v2F"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>${ctl}</div>`;
  const fc = (label, ctl) => `<div style="display:flex;flex-direction:column;gap:2px;font-size:12px;font-weight:700;color:var(--muted)">${label}${ctl}</div>`;
  const step = (v) => `<span class="v2Step"><span>−</span><b>${v}</b><span>+</span></span>`;
  const seg = (opts, on, cls = '') => `<span class="v2Seg ${cls}">${opts.map((o, i) => `<span class="${i === on ? 'on' : ''}">${o}</span>`).join('')}</span>`;
  const sel = (v) => `<span class="v2Sel">${v}</span>`;
  const tog = (on) => `<span class="v2Tog ${on ? 'on' : ''}"></span>`;
  const ent = (e, name, id, st, off) => `<div class="v2Ent"><span class="e">${e}</span><div><b>${name}</b><small>${id}</small></div>${st ? `<span class="st ${off ? 'off' : ''}">${st}</span>` : ''}</div>`;
  const search = (txt = 'Einstellung suchen …', on = false) => `<div class="v2Search ${on ? 'on' : ''}">🔍 <span>${txt}</span></div>`;
  const easy = (on = 1) => seg(['Einfach', 'Alle'], on);

  // ---------- a window drawn from the front, like in a window catalogue ----------
  // panes: t = 'dk' (Dreh-Kipp), 'd' (only turns), 'k' (only tilts), 'f' (fixed); g = hinge side 'l' / 'r'
  // how a pane shows how it opens (wish of 2026-11-09: the dashed lines are "seltsam"): 'lines' (window catalogue), 'chips' (a label
  // under each pane), 'open' (drawn half open), 'icons' (a small sign in the pane), 'plain' (glass and handle only)
  let LOOK = 'lines';
  const NAME = { dk: 'Dreh-Kipp', d: 'Drehen', k: 'Kippen', f: 'fest' };
  function icon(t, cx, cy) {     // a small round sign: turn = curved arrow, tilt = arrow down into the room, fixed = lock
    const c = '#1d3550', st = `stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    const g = (body) => `<g transform="translate(${cx} ${cy})"><circle r="17" fill="#fff" stroke="#c4d0dc" stroke-width="1.5"/>${body}</g>`;
    if (t === 'd') return g(`<path d="M-8 5 A9 9 0 1 1 6 6" ${st}/><path d="M6 6 l1 -6 M6 6 l-6 1" ${st}/>`);
    if (t === 'k') return g(`<path d="M-8 -8 L-1 8 M-1 8 h9" ${st}/><path d="M-1 8 l-1 -6 M-1 8 l4 -4" ${st}/>`);
    return g(`<rect x="-7" y="-2" width="14" height="11" rx="2" fill="${c}"/><path d="M-4 -2 v-4 a4 4 0 0 1 8 0 v4" ${st}/>`);
  }
  function winSvg({ w = 1.2, hh = 1.2, panes = [{ t: 'dk', g: 'l' }, { t: 'dk', g: 'r' }], below = 0, px = 150, sel = -1, dims = false, sill = null, lbl = false, look = LOOK }) {
    const H = px, W = Math.round(px * w / hh), pad = dims ? 34 : 6, F = 7, padL = sill != null ? 44 : pad;
    const chipH = look === 'chips' || look === 'open' ? 30 : 0, VW = W + pad + padL, VH = H + pad * 2 + (sill != null ? 26 : 0) + chipH;
    const bandH = below ? Math.round(H * below / hh) : 0;
    let s = `<svg viewBox="${pad - padL} 0 ${VW} ${VH}" width="${VW}" height="${VH}" style="display:block;margin:0 auto;overflow:visible;max-width:100%;height:auto">
      <defs><linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fd3ff" stop-opacity=".55"/><stop offset="1" stop-color="#5d8fc4" stop-opacity=".35"/></linearGradient></defs>
      <rect x="${pad}" y="${pad}" width="${W}" height="${H}" rx="3" fill="#e9eef3" stroke="#aab7c4"/>`;
    const top = pad + F, inH = H - F * 2 - bandH, pw = (W - F * 2) / panes.length;
    panes.forEach((p, i) => {
      const x = pad + F + i * pw + 2, y = top + 2, ww = pw - 4, hh2 = inH - 4;
      const on = i === sel;
      const stroke = `stroke="${on ? '#ffd45c' : '#c4d0dc'}" stroke-width="${on ? 4 : 3}"`;
      const handle = () => {       // on the side opposite the hinge (only tilting: on top)
        if (p.t === 'f') return '';
        if (p.t === 'k') return `<rect x="${x + ww / 2 - 8}" y="${y + 4}" width="16" height="5" rx="2" fill="#4b5d70"/>`;
        const hx = p.g === 'l' ? x + ww - 9 : x + 4; return `<rect x="${hx}" y="${y + hh2 / 2 - 9}" width="5" height="18" rx="2" fill="#4b5d70"/>`;
      };
      if (look === 'open' && p.t !== 'f') {
        s += `<rect x="${x}" y="${y}" width="${ww}" height="${hh2}" fill="#2b3946" ${stroke}/>`;   // the hole behind the open pane
        if (p.t === 'k') {         // tilted: the top comes into the room
          const d = ww * 0.12;
          s += `<polygon points="${x + d},${y + hh2 * 0.14} ${x + ww - d},${y + hh2 * 0.14} ${x + ww},${y + hh2} ${x},${y + hh2}" fill="#bfe0fb" stroke="#c4d0dc" stroke-width="3"/>
            <rect x="${x + ww / 2 - 8}" y="${y + hh2 * 0.14 + 4}" width="16" height="5" rx="2" fill="#4b5d70"/>`;
        } else {                   // turned: the free side swings into the room
          const fx = p.g === 'l' ? x + ww * 0.62 : x + ww * 0.38, hx = p.g === 'l' ? x : x + ww;
          s += `<polygon points="${hx},${y} ${fx},${y - hh2 * 0.06} ${fx},${y + hh2 * 1.06} ${hx},${y + hh2}" fill="#bfe0fb" stroke="#c4d0dc" stroke-width="3"/>
            <rect x="${p.g === 'l' ? fx - 8 : fx + 3}" y="${y + hh2 / 2 - 9}" width="5" height="18" rx="2" fill="#4b5d70"/>`;
        }
      } else {
        s += `<rect x="${x}" y="${y}" width="${ww}" height="${hh2}" fill="url(#gl)" ${stroke}/>`;
        if (look === 'lines') {
          const dash = 'stroke="#2c4a66" stroke-width="1.6" stroke-dasharray="6 4" fill="none"';
          if (p.t === 'd' || p.t === 'dk') {
            s += p.g === 'l' ? `<polyline points="${x + ww},${y} ${x},${y + hh2 / 2} ${x + ww},${y + hh2}" ${dash}/>` : `<polyline points="${x},${y} ${x + ww},${y + hh2 / 2} ${x},${y + hh2}" ${dash}/>`;
          }
          if (p.t === 'k' || p.t === 'dk') s += `<polyline points="${x},${y} ${x + ww / 2},${y + hh2} ${x + ww},${y}" ${dash}/>`;
          if (p.t === 'f') s += `<text x="${x + ww / 2}" y="${y + hh2 / 2 + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#2c4a66">fest</text>`;
        } else if (look === 'icons') {
          const cx = x + ww / 2, cy = y + hh2 / 2;
          if (p.t === 'dk') s += icon('d', cx, cy - 20) + icon('k', cx, cy + 20); else s += icon(p.t, cx, cy);
        } else if (look === 'open') {
          s += `<text x="${x + ww / 2}" y="${y + hh2 / 2 + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="#2c4a66">fest</text>`;
        }
        s += handle();
      }
      if (look === 'chips') {
        const t = NAME[p.t], cw = t.length * 7.4 + 16, cx = x + ww / 2, cy = pad + H + 8;
        s += `<rect x="${cx - cw / 2}" y="${cy}" width="${cw}" height="21" rx="10.5" fill="${p.t === 'f' ? '#3a4552' : '#3fa9f5'}"/>
          <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="12" font-weight="800" fill="${p.t === 'f' ? '#dfe7ef' : '#04121f'}">${t}</text>`;
      }
      if (look === 'open') s += `<text x="${x + ww / 2}" y="${pad + H + 22}" text-anchor="middle" font-size="12" font-weight="700" fill="#9fb3c8">${{ dk: 'dreht + kippt', d: 'dreht', k: 'kippt', f: 'fest' }[p.t]}</text>`;
      if (lbl && look === 'lines') s += `<text x="${x + ww / 2}" y="${y + hh2 - 8}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d3550">${{ dk: 'Dreh-Kipp', d: 'Dreh', k: 'Kipp', f: '' }[p.t]}</text>`;
    });
    if (bandH) {
      const y = pad + H - F - bandH;
      s += `<rect x="${pad + F + 2}" y="${y + 2}" width="${W - F * 2 - 4}" height="${bandH - 4}" fill="url(#gl)" stroke="#c4d0dc" stroke-width="3"/>
        <text x="${pad + W / 2}" y="${y + bandH / 2 + 5}" text-anchor="middle" font-size="13" font-weight="800" fill="#2c4a66">${px >= 100 ? 'feste Scheibe' : 'fest'}</text>`;
    }
    if (dims) {
      const c = '#9fb3c8';
      s += `<g stroke="${c}" stroke-width="1.4" fill="${c}" font-size="12.5" font-weight="700">
        <line x1="${pad}" y1="${pad + H + 14}" x2="${pad + W}" y2="${pad + H + 14}"/><line x1="${pad}" y1="${pad + H + 8}" x2="${pad}" y2="${pad + H + 20}"/><line x1="${pad + W}" y1="${pad + H + 8}" x2="${pad + W}" y2="${pad + H + 20}"/>
        <text x="${pad + W / 2}" y="${pad + H + 30}" text-anchor="middle" stroke="none">${String(w.toFixed(2)).replace('.', ',')} m</text>
        <line x1="${pad + W + 14}" y1="${pad}" x2="${pad + W + 14}" y2="${pad + H}"/><line x1="${pad + W + 8}" y1="${pad}" x2="${pad + W + 20}" y2="${pad}"/><line x1="${pad + W + 8}" y1="${pad + H}" x2="${pad + W + 20}" y2="${pad + H}"/>
        <text x="${pad + W + 20}" y="${pad + H / 2}" stroke="none" transform="rotate(90 ${pad + W + 20} ${pad + H / 2})" text-anchor="middle" dy="-4">${String(hh.toFixed(2)).replace('.', ',')} m</text></g>`;
    }
    if (sill != null) {
      const y0 = pad + H, y1 = VH - 4;
      s += `<line x1="${pad - 20}" y1="${y1}" x2="${pad + W + 20}" y2="${y1}" stroke="#8b6b4a" stroke-width="3"/>
        <line x1="${pad - 10}" y1="${y0}" x2="${pad - 10}" y2="${y1}" stroke="#9fb3c8" stroke-width="1.4"/>
        <text x="${pad - 14}" y="${(y0 + y1) / 2 + 4}" text-anchor="end" font-size="11.5" font-weight="700" fill="#9fb3c8">${sill}</text>`;
    }
    return `${s}</svg>`;
  }

  // ---------- floors as small pictures ----------
  const svgUri = (s) => `url('data:image/svg+xml,${encodeURIComponent(s)}')`;
  const PAT = {
    herringbone: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#b08355"/><g fill="#c49a68" stroke="#7a5532" stroke-width=".8"><path d="M0 0h8v24H0zM16 8h8v24h-8z"/><path d="M8 0h16v8H8zM24 24h8v8h-8zM8 24h8v8H8z" fill="#a8794b"/></g></svg>'),
    chevron: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#a77a4e"/><path d="M0 0l12 8 12-8v8l-12 8-12-8z" fill="#c09060" stroke="#6e4b2b" stroke-width=".7"/><path d="M0 16l12 8 12-8" fill="none" stroke="#6e4b2b" stroke-width=".7"/></svg>'),
    oak: 'repeating-linear-gradient(90deg, #c8a06c 0 14px, #8e6a40 14px 15px, #bf9562 15px 29px, #8e6a40 29px 30px)',
    light: 'repeating-linear-gradient(90deg, #e2c9a0 0 14px, #b39a74 14px 15px, #d8bd92 15px 29px, #b39a74 29px 30px)',
    dark: 'repeating-linear-gradient(90deg, #6b4a32 0 14px, #3d2a1c 14px 15px, #5e402b 15px 29px, #3d2a1c 29px 30px)',
    planks: 'repeating-linear-gradient(90deg, #b98d5c 0 22px, #6f5134 22px 23px, #a97f50 23px 45px, #6f5134 45px 46px)',
    tilesL: 'linear-gradient(#9b968c 2px, transparent 2px) 0 0/34px 34px, linear-gradient(90deg, #9b968c 2px, transparent 2px) 0 0/34px 34px, #d9d4c9',
    tilesS: 'linear-gradient(#7f8b96 1px, transparent 1px) 0 0/14px 14px, linear-gradient(90deg, #7f8b96 1px, transparent 1px) 0 0/14px 14px, #e6edf2',
    checker: 'conic-gradient(#2b2b2b 25%, #eee 0 50%, #2b2b2b 0 75%, #eee 0) 0 0/24px 24px',
    stone: 'radial-gradient(circle at 20% 30%, #b9b2a6 0 18%, transparent 19%), radial-gradient(circle at 70% 60%, #a59d90 0 22%, transparent 23%), radial-gradient(circle at 40% 85%, #c4bdb1 0 15%, transparent 16%), #988f82',
    concrete: 'radial-gradient(#8f9396 1px, transparent 1.4px) 0 0/7px 7px, #a9adb0',
    carpet: 'radial-gradient(#6c7f99 1px, transparent 1.3px) 0 0/4px 4px, #7d90aa',
    plain: '#c7b9a3',
    vinyl: 'repeating-linear-gradient(90deg, #d2cbc0 0 26px, #a9a297 26px 27px)',
  };
  const floorTile = (key, name, on) => `<div class="v2Tile ${on ? 'on' : ''}"><div class="pv" style="background:${PAT[key]}"></div><div class="nm">${name}</div></div>`;

  // =====================================================================================================================
  // 1 the whole column for a window
  function windowPanel({ open = 'size', easyOn = 1, extra = '', compact = false } = {}) {
    const body = {
      size: `<div style="display:flex;gap:8px;align-items:center">${winSvg({ px: 100, dims: true, sill: '0,90' })}
        <div style="flex:1;display:flex;flex-direction:column;gap:6px">${fc('Breite', step('1,20 m'))}${fc('Höhe', step('1,20 m'))}${fc('Brüstung', step('0,90 m'))}</div></div>
        ${f('Lage in der Wand', step('1,60 m'), 'von der linken Ecke')}`,
    };
    return panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer', '🪟 Fenster'])}
      ${head({ icon: '🪟', name: 'Fenster Wohnzimmer', sub: 'Doppelfenster · Wand zum Garten', chips: [chip('🔗 Kontakt: zu', 'ok'), chip('↔ 1,20 × 1,20 m'), chip('🎚 kein Rollladen')], compact })}
      <div class="v2Row">${search()}${easy(easyOn)}</div>
      ${sec('📐', 'Größe & Lage', '1,20 × 1,20 m · Brüstung 0,90', open === 'size' ? body.size : '')}
      ${sec('🪟', 'Flügel & Öffnen', '2 Flügel · Dreh-Kipp · nach innen', open === 'panes' ? extra : '')}
      ${sec('▭', 'Feste Scheibe', 'keine')}
      ${sec('🔗', 'Home Assistant', 'Kontakt ✓ · gekippt –', open === 'ha' ? extra : '')}
      ${sec('🎚', 'Rollladen / Vorhang', 'keiner')}
      ${sec('⋯', 'Mehr', 'Kippwinkel im Bild, Name')}`);
  }
  function ueberblick() {
    __fp.select('opening', 'o1');
    uiSwitch();
    windowPanel();
    const p = $('#panel').getBoundingClientRect();
    title('①', 'Leiste „Version 2“', 'am Beispiel Fenster');
    const at = (sel, dy = 0) => { const r = (typeof sel === 'string' ? document.querySelector(sel) : sel).getBoundingClientRect(); return r.top + r.height / 2 + dy; };
    const nt = (t, y) => { const n = note(t, p.left - 330, 0, 'r', 300); n.style.top = `${y - n.offsetHeight / 2}px`; };
    nt('Oben: wo bin ich? Haus › Etage › Raum › Fenster. Ein Tipp springt zurück.', at('.v2Crumbs') + 30);
    nt('Die Knöpfe, die heute ganz unten stehen (Löschen, Sperren, Kopieren …), sind oben als Symbole.', at('.v2Head .acts'));
    nt('Eingeklappt, aber die Zeile sagt schon, was eingestellt ist. Nur das Nötige ist offen.', at(document.querySelectorAll('.v2 .v2Sec')[1], 20));
    const st = $('#stage').getBoundingClientRect();
    note('Oben rechts (lila): Umschalter „Klassisch / ✨ Neu“. Jederzeit zurück zur alten Leiste.', st.left + 170, st.bottom - 150, '', 300);
  }

  // 2 switching in ⚙
  function umschalten() {
    uiSwitch();
    $('#settingsBtn').click();
    setTimeout(() => {
      const g = $('details.setGroup[data-group=general]'); g.open = true;
      const body = g.querySelector('.sgBody');
      const mini = (neu) => `<div style="height:110px;border-radius:10px;background:#0f1419;border:1px solid var(--line);display:flex;overflow:hidden">
        <div style="flex:1;background:linear-gradient(#5b8fc0,#3f6b4a 70%)"></div>
        <div style="width:${neu ? 74 : 62}px;background:#182028;padding:6px;display:flex;flex-direction:column;gap:${neu ? 5 : 3}px">
        ${neu ? '<i style="height:16px;border-radius:5px;background:#2a3d52"></i>' + '<i style="height:12px;border-radius:5px;background:#26323e;border:1px solid #3fa9f5"></i>'.repeat(1) + '<i style="height:22px;border-radius:5px;background:#26323e"></i>' + '<i style="height:9px;border-radius:5px;background:#222c36"></i>'.repeat(4)
          : '<i style="height:4px;background:#2a3541"></i>'.repeat(16)}</div></div>`;
      const card = h(`<div style="grid-column:1/-1;border:2px solid #b48cff;border-radius:14px;padding:14px 16px;background:rgba(180,140,255,.07);position:relative">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="font-size:22px">✨</span><b style="font-size:16px">Oberfläche</b> <span class="mkNew">NEU</span>
          <span style="margin-left:auto;color:var(--muted);font-size:13px">Taste <b>V</b> schaltet auch um</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div style="border:2px solid var(--line);border-radius:12px;padding:10px">${mini(false)}<div style="margin-top:8px;font-weight:700">○ Klassisch</div><small style="color:var(--muted)">Alles untereinander, wie bisher</small></div>
          <div style="border:2px solid #b48cff;border-radius:12px;padding:10px;background:rgba(180,140,255,.1)">${mini(true)}<div style="margin-top:8px;font-weight:700">◉ Neu (Version 2)</div><small style="color:var(--muted)">Eingeklappt, Bilder statt Listen, Reiter</small></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:12px;font-size:14px;font-weight:600"><span>Gilt für</span>${seg(['nur mich', 'alle Benutzer', 'je Tablet'], 0)}</div></div>`);
      body.prepend(card);
      const r = card.getBoundingClientRect();
      title('②', 'Alt oder neu: selbst wählen', '⚙ Einstellungen → Allgemein', 30);
      note('Beide Oberflächen bleiben drin. Wer die alte gewohnt ist, behält sie. Die neue zeigt dieselben Einstellungen, nur aufgeräumt.', r.left + 20, r.bottom + 18, 'u', 420);
    }, 400);
  }

  // 3 the window as a picture: tap a pane
  function fensterBild() {
    __fp.select('opening', 'o1');
    uiSwitch();
    const extra = `<div style="position:relative">${winSvg({ px: 170, sel: 1, lbl: true })}</div>
      ${f('Flügel', seg(['1', '2', '3', '4'], 1))}
      ${f('Geht auf', seg(['⤵ nach innen', '⤴ nach außen'], 0))}
      ${f('Kippwinkel', step('14°'), 'wie weit es gekippt im Bild steht')}`;
    windowPanel({ open: 'panes', extra, compact: true });
    const v = $('.v2'), svg = v.querySelector('.v2Sec.open svg').getBoundingClientRect();
    const pop = h(`<div class="v2Pop" style="width:230px"><h5>Flügel 2 (rechts)</h5>
      <div class="v2Opt on"><span class="rd"></span>⇲ Dreh-Kipp</div><div class="v2Opt"><span class="rd"></span>⇩ nur kippen</div>
      <div class="v2Opt"><span class="rd"></span>⇥ nur drehen</div><div class="v2Opt"><span class="rd"></span>▭ fest (geht nicht auf)</div>
      <div style="margin-top:8px;display:flex;align-items:center;gap:8px;font-weight:700">Griff ${seg(['links', 'rechts'], 0)}</div></div>`);
    Object.assign(pop.style, { left: `${svg.left - 248}px`, top: `${svg.top + 10}px` });
    lay().append(pop);
    title('③', 'Fenster als Bild', 'Flügel antippen statt Listen');
    const pr = pop.getBoundingClientRect();
    note('Tippe im Bild auf einen Flügel: so stellst du ihn ein. Die Striche zeigen wie im Fensterkatalog, wie er aufgeht (die Spitze zeigt zum Scharnier).', pr.left - 330, pr.top, 'r', 300);
    note('„Fest“, „Anzahl Flügel“, „Öffnungsrichtung“, „Fenster öffnet“ (heute vier Listen) werden ein Bild und zwei Knopfreihen.', pr.left - 330, pr.bottom + 20, '', 300);
  }

  // 4 window kinds as pictures
  function vorlagen() {
    __fp.select('opening', 'o1');
    uiSwitch();
    const t = (name, o, on, star) => `<div class="v2Tile ${on ? 'on' : ''}" style="background:var(--field)"><div style="height:96px;display:grid;place-items:center;background:rgba(255,255,255,.03)">${winSvg({ px: 70, ...o })}</div><div class="nm">${star ? '⭐ ' : ''}${name}</div></div>`;
    panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer', '🪟 Fenster'])}
      ${head({ icon: '🪟', name: 'Fenster Wohnzimmer', sub: 'Doppelfenster · 1,20 × 1,20 m', chips: [], acts: false })}
      <div class="v2Sec open"><div class="hd"><span class="i">🧩</span><b>Fensterart</b><span class="sum">ein Tipp stellt alles ein</span><span class="chev">▴</span></div>
      <div class="bd"><div class="v2Grid">
        ${t('Fenster', { w: 0.9, hh: 1.2, panes: [{ t: 'dk', g: 'l' }] })}
        ${t('Doppelfenster', { w: 1.2, hh: 1.2 }, true)}
        ${t('Dreifach', { w: 1.8, hh: 1.2, panes: [{ t: 'dk', g: 'l' }, { t: 'f' }, { t: 'dk', g: 'r' }] })}
        ${t('Fenstertür / Balkon', { w: 0.9, hh: 2.2, panes: [{ t: 'dk', g: 'l' }] })}
        ${t('Bodentief, unten fest', { w: 0.9, hh: 2.2, panes: [{ t: 'k', g: 'l' }], below: 0.9 })}
        ${t('Badfenster klein', { w: 0.6, hh: 0.6, panes: [{ t: 'k', g: 'l' }] })}
        ${t('Festverglasung', { w: 1.2, hh: 1.2, panes: [{ t: 'f' }] })}
        ${t('Schiebetür', { w: 1.8, hh: 2.2, panes: [{ t: 'f' }, { t: 'd', g: 'r' }] })}
        ${t('Kinderzimmer', { w: 1.0, hh: 1.3, panes: [{ t: 'dk', g: 'r' }] }, false, true)}
      </div>
      <div class="v2Row" style="margin-top:4px"><span class="v2Btn ghost" style="flex:1">⭐ Dieses Fenster als eigene Art merken</span></div></div></div>
      ${sec('✏️', 'Anpassen', 'Größe, Flügel, feste Scheibe …')}
      ${sec('🔗', 'Home Assistant', 'Kontakt ✓')}`);
    const p = $('#panel').getBoundingClientRect();
    title('④', 'Fensterarten als Bilder', 'Vorlagen statt vieler Felder');
    note('Eine Art antippen stellt alles auf einmal ein: Größe, Brüstung, Flügel, feste Scheibe. Danach nur noch „Anpassen“, wenn nötig.', p.left - 330, 260, 'r', 300);
    note('Eigene Fensterart merken (⭐): z. B. alle Kinderzimmer-Fenster gleich. Dieselben Bilder gibt es auch oben beim Werkzeug „Tür/Fenster“.', p.left - 330, 520, 'r', 300);
  }

  // 5 tabs hanging on the column ("Noppel"), a drawer opens next to it
  function noppel() {
    __fp.select('opening', 'o3');
    uiSwitch();
    panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🍳 Küche', '🪟 Fenster'])}
      ${head({ icon: '🪟', name: 'Fenster Küche', sub: 'Doppelfenster · 1,20 × 1,20 m', chips: [chip('🔗 Kontakt: zu', 'ok'), chip('🎚 Rollladen 60 %', 'acc')] })}
      ${sec('📐', 'Größe & Lage', '1,20 × 1,20 m · Brüstung 0,90', `${f('Breite', step('1,20 m'))}${f('Höhe', step('1,20 m'))}${f('Brüstung', step('0,90 m'))}`)}
      ${sec('🔗', 'Kontakt', 'binary_sensor.fenster_kueche')}`, 340);
    const p = $('#panel').getBoundingClientRect();
    const tabs = [['📐', 'Maße'], ['🪟', 'Flügel'], ['▭', 'Feste Scheibe'], ['🔗', 'Home Assistant'], ['🎚', 'Rollladen', true], ['⋯', 'Mehr']];
    const drawerW = 330, dx = p.left - drawerW;
    const drawer = h(`<div style="position:fixed;z-index:92;left:${dx}px;top:${p.top + 10}px;width:${drawerW}px;background:var(--panel);border:1px solid var(--accent);border-right:0;
      border-radius:16px 0 0 16px;box-shadow:-18px 10px 50px rgba(0,0,0,.5);padding:14px;display:flex;flex-direction:column;gap:10px;color:var(--text);font-size:14px">
      <div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">🎚</span><b style="font-size:16px">Rollladen / Vorhang</b><span style="margin-left:auto;color:var(--muted)">✕</span></div>
      <div class="v2Hint">Zusätzliche Fensteroptionen: was man nur einmal einrichtet, hängt seitlich an der Leiste.</div>
      <b style="font-size:13.5px">Am Fenster ist ein</b>${seg(['keiner', 'Rollladen', 'Vorhang', 'Raffstore'], 1, 'wide')}
      ${ent('🎚', 'Rollladen Küche', 'cover.rollladen_kueche', '60 % offen')}
      <div style="display:flex;gap:8px"><span class="v2Btn" style="flex:1">▲ Hoch</span><span class="v2Btn" style="flex:1">■ Stopp</span><span class="v2Btn" style="flex:1">▼ Runter</span></div>
      <div style="height:8px;border-radius:9px;background:var(--field);position:relative"><i style="position:absolute;inset:0 40% 0 0;border-radius:9px;background:var(--accent)"></i></div>
      ${f('Im 3D-Bild zeigen', tog(true))}
      ${f('Farbe des Panzers', '<span class="v2Sw"><i style="background:#e8e8e8" class="on"></i><i style="background:#7b7f84"></i><i style="background:#3b3f44"></i><i style="background:#8a6a4a"></i></span>')}
      ${f('Bei offenem Fenster nicht runter', tog(true), 'Aussperr-Schutz')}</div>`);
    lay().append(drawer);
    const tx = dx - 46;
    let y = p.top + 70;
    tabs.forEach(([i, t, on]) => {
      const hgt = 42 + t.length * 8.2;
      const tab = h(`<div style="position:fixed;z-index:93;left:${tx}px;top:${y}px;width:46px;height:${hgt}px;border-radius:12px 0 0 12px;display:flex;flex-direction:column;align-items:center;gap:6px;
        padding-top:8px;font-weight:800;font-size:12.5px;color:${on ? 'var(--text)' : 'var(--muted)'};background:${on ? 'var(--panel)' : 'var(--field)'};border:1px solid ${on ? 'var(--accent)' : 'var(--line)'};
        border-right:${on ? '0' : '1px solid var(--line)'};box-shadow:${on ? 'none' : '-4px 4px 14px rgba(0,0,0,.35)'}"><span style="font-size:17px">${i}</span>
        <span style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap">${t}</span></div>`);
      lay().append(tab);
      y += hgt + 6;
    });
    title('⑤', '„Noppel“ an der Leiste', 'Reiter, die seitlich dranhängen', $('#stage').getBoundingClientRect().bottom - 70);
    note('Die Reiter hängen links an der Leiste wie Karteikarten. Ein Tipp klappt die Zusatzoptionen daneben aus, die Leiste selbst bleibt kurz.', tx - 330, p.top + 120, 'r', 300);
    note('Hier: „Rollladen“ ist offen. Was man nur einmal einrichtet, ist so aus dem Weg, aber mit einem Tipp da.', tx - 330, p.top + 330, 'r', 300);
  }

  // 6 a small bar right at the selected window, the column folded away
  function kontextleiste() {
    __fp.select('opening', 'o1');
    uiSwitch();
    const pn = $('#panel'); pn.style.display = 'none'; $('#panelResizer').style.display = 'none'; fit();
    setTimeout(() => {
      const stage = $('#stage').getBoundingClientRect();
      const tab = h(`<div style="position:fixed;z-index:92;right:0;top:${stage.top + 160}px;padding:14px 8px;border-radius:12px 0 0 12px;background:var(--panel);border:1px solid var(--line);border-right:0;
        writing-mode:vertical-rl;transform:rotate(180deg);font-weight:800;font-size:13px;color:var(--text)">◂ Alle Einstellungen</div>`);
      lay().append(tab);
      const at = __fp.screenOf('o1') || { x: stage.left + stage.width * 0.45, y: stage.top + stage.height * 0.5 };
      const bar = h(`<div style="position:fixed;z-index:94;display:flex;align-items:center;gap:4px;padding:6px;border-radius:16px;background:var(--panel);border:1px solid var(--accent);
        box-shadow:0 14px 40px rgba(0,0,0,.55);color:var(--text);font-weight:700;font-size:13.5px;white-space:nowrap">
        <span style="padding:6px 10px">🪟 Fenster Wohnzimmer</span><i style="width:1px;height:26px;background:var(--line)"></i>
        <span class="v2Btn">↔ 1,20</span><span class="v2Btn">↕ 1,20</span><span class="v2Btn">⤒ 0,90</span>
        <span class="v2Btn" style="border-color:var(--accent)">🪟 2 Flügel ▾</span><span class="v2Btn" style="color:#9be3a8">🔗 ✓</span><span class="v2Btn">🎚</span>
        <i style="width:1px;height:26px;background:var(--line)"></i><span class="v2Btn">⧉</span><span class="v2Btn" style="color:#ff8a80">🗑</span><span class="v2Btn">⋯</span></div>`);
      lay().append(bar);
      const bw = bar.getBoundingClientRect().width;
      const bx = Math.min(Math.max(stage.left + 10, at.x - bw / 2), stage.right - bw - 10), by = Math.max(stage.top + 70, at.y - 120);
      Object.assign(bar.style, { left: `${bx}px`, top: `${by}px` });
      const fl = [...bar.querySelectorAll('.v2Btn')][3].getBoundingClientRect();
      const pop = h(`<div class="v2Pop" style="width:250px">${winSvg({ px: 90 })}
        <div style="display:flex;gap:6px;margin-top:10px">${seg(['1', '2', '3'], 1)}${seg(['innen', 'außen'], 0)}</div>
        <div class="v2Hint" style="margin-top:8px">Flügel antippen: Dreh-Kipp, Kipp, fest</div></div>`);
      Object.assign(pop.style, { left: `${fl.left - 40}px`, top: `${by + 58}px` });
      lay().append(pop);
      title('⑥', 'Mini-Leiste direkt am Fenster', 'die große Leiste bleibt zu');
      note('Das Häufigste schwebt direkt über dem angeklickten Fenster: Größe, Flügel, Kontakt, Kopieren, Löschen. Wie in Handy-Fotoprogrammen.', stage.left + 30, stage.bottom - 190, '', 340);
      note('Die große Leiste ist eingeklappt: mehr Platz fürs Haus. „Alle Einstellungen“ holt sie zurück.', stage.right - 380, stage.top + 120, 'r', 320);
    }, 600);
  }

  // 7 room: tabs, floors as pictures, floor height with a small side view
  function raumBoden() {
    __fp.select('room', 'r1');
    uiSwitch();
    panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer'])}
      ${head({ icon: '🛋', name: 'Wohnzimmer', sub: '27,0 m² · 6,00 × 4,50 m · Erdgeschoss', chips: [chip('🔗 Bereich „Wohnzimmer“', 'ok'), chip('🌡 21,4°'), chip('💡 3 an')], acts: false })}
      <div class="v2Tabs"><span>Allgemein</span><span class="on">Boden</span><span>Wände</span><span>Geräte<em>12</em></span></div>
      <div style="display:flex;gap:6px">${seg(['Holz', 'Fliesen', 'Stein', 'Andere'], 0, 'wide')}</div>
      <div class="v2Grid">
        ${floorTile('herringbone', 'Fischgrät', true)}${floorTile('chevron', 'Fischgrät französisch')}${floorTile('oak', 'Parkett Eiche')}
        ${floorTile('light', 'Parkett hell')}${floorTile('dark', 'Parkett dunkel')}${floorTile('planks', 'Landhausdielen')}</div>
      ${f('Farbe', '<span class="v2Sw"><i style="background:#b89b74" class="on"></i><i style="background:#d8c3a0"></i><i style="background:#8a6542"></i><i style="background:#5a3e2a"></i><i style="background:#c9c9c9"></i><i style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"></i></span>')}
      ${sec('↕', 'Höhe des Bodens', '0 cm = wie die Etage', `<div style="display:flex;gap:12px;align-items:center">
        <svg width="140" height="78" viewBox="0 0 140 78"><rect x="0" y="34" width="38" height="8" fill="#6d7a87"/><rect x="102" y="34" width="38" height="8" fill="#6d7a87"/>
        <rect x="38" y="48" width="64" height="8" fill="#b08355"/><path d="M38 34v22M102 34v22" stroke="#6d7a87" stroke-width="2"/>
        <path d="M110 34v14" stroke="#ffd45c" stroke-width="2"/><path d="M106 34h8M106 48h8" stroke="#ffd45c" stroke-width="2"/><text x="118" y="46" font-size="11" fill="#ffd45c" font-weight="800">15</text>
        <text x="2" y="28" font-size="10.5" fill="#9fb3c8" font-weight="700">Flur</text><text x="44" y="72" font-size="10.5" fill="#dfe7ef" font-weight="800">Wohnzimmer</text>
        <circle cx="70" cy="30" r="4" fill="#dfe7ef"/><path d="M70 34v8M64 38h12M70 42l-4 6M70 42l4 6" stroke="#dfe7ef" stroke-width="2"/></svg>
        <div style="flex:1;display:flex;flex-direction:column;gap:6px">${step('−15 cm')}<div class="v2Hint">Minus = abgesenkt (z. B. Wohngrube), Plus = Podest</div></div></div>`)}
      ${sec('⚙', 'Feinheiten', 'Dielen 60 cm · Drehung 45° · Balkon nein')}`);
    const p = $('#panel').getBoundingClientRect();
    title('⑦', 'Raum mit Reitern', 'Böden als Bilder, Höhe mit Seitenansicht');
    note('Reiter oben: Allgemein (Name, Bereich), Boden, Wände, Geräte. Man sieht nur, was zum Reiter gehört.', p.left - 330, 210, 'r', 300);
    note('Böden als kleine Bilder statt einer Liste mit 30 Namen. Erst die Gruppe (Holz, Fliesen …), dann das Muster.', p.left - 330, 400, 'r', 300);
    note('„Boden höher als die Etage“ mit kleiner Seitenansicht: man sieht sofort, ob es hoch oder runter geht.', p.left - 330, 640, 'r', 300);
  }

  // 8 before / after for a room
  function vorherNachher() {
    __fp.select('room', 'r1');
    setTimeout(() => {
      const old = $('#panel').cloneNode(true);
      old.removeAttribute('id'); old.id = 'panel';
      Object.assign(old.style, { width: '290px', height: 'auto', maxHeight: 'none', overflow: 'visible', position: 'relative', borderLeft: '1px solid var(--line)' });
      const H = 820;
      const ov = h(`<div style="position:fixed;inset:0;z-index:91;background:rgba(5,9,14,.88);display:flex;align-items:flex-start;justify-content:center;gap:40px;padding:70px 30px 10px;color:var(--text)">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px"><b style="font-size:18px">Heute</b><div class="oldBox" style="height:${H - 60}px;overflow:hidden;border-radius:12px;border:2px solid #ff8a80;position:relative"></div></div>
        <div style="align-self:center;font-size:46px;color:#b48cff">➜</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px"><b style="font-size:18px">Version 2</b><div class="newBox" style="width:380px;height:${H - 60}px;border-radius:12px;border:2px solid #46a758;position:relative;background:var(--panel);overflow:hidden"></div></div></div>`);
      lay().append(ov);
      const box = ov.querySelector('.oldBox');
      const realH = old.scrollHeight || 3600;
      box.append(old);
      const k = (H - 60) / Math.max(old.getBoundingClientRect().height, 1);
      old.style.transform = `scale(${k})`; old.style.transformOrigin = '0 0';
      box.style.width = `${290 * k}px`;
      const nb = ov.querySelector('.newBox');
      nb.innerHTML = `<div class="v2" style="position:absolute">${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer'])}
        ${head({ icon: '🛋', name: 'Wohnzimmer', sub: '27,0 m² · Erdgeschoss', chips: [chip('🔗 Bereich „Wohnzimmer“', 'ok'), chip('🌡 21,4°')] })}
        <div class="v2Tabs"><span class="on">Allgemein</span><span>Boden</span><span>Wände</span><span>Geräte<em>12</em></span></div>
        ${f('Name', sel('Wohnzimmer'))}${f('Bereich in HA', sel('🛋 Wohnzimmer'))}
        ${sec('🪵', 'Boden', 'Fischgrät · 0 cm')}${sec('🧱', 'Wände', 'Raufaser · weiß')}${sec('🌇', 'Balkon / Dachterrasse', 'nein')}${sec('📟', 'Geräte im Raum', '12 · 3 Lichter an')}</div>`;
      const ob = box.getBoundingClientRect();
      note(`Heute: alles untereinander. Beim Wohnzimmer ist die Leiste ${Math.round(realH)} Pixel hoch: etwa ${Math.round(realH / 800)} Bildschirme scrollen.`, ob.left - 300, ob.top + 60, 'r', 270);
      const nr = nb.getBoundingClientRect();
      note('Neu: alles auf einen Blick. Nichts geht verloren, es ist nur eingeklappt, und jede Zeile sagt, was eingestellt ist.', nr.right + 24, nr.top + 300, 'l', 280);
      title('⑧', 'Vorher / nachher', 'derselbe Raum', 14);
    }, 500);
  }

  // 9 nothing selected: the structure of house, buildings, floors, rooms
  function treePanel() {
    const n = (cls, ar, ic, nm, small = '', tl = '', ind = 0) => `<div class="n ${cls}" style="padding-left:${8 + ind * 16}px"><span class="ar">${ar}</span><span class="ic">${ic}</span><span class="nm">${nm}</span>${small ? `<small>${small}</small>` : ''}${tl ? `<span class="tl">${tl}</span>` : ''}</div>`;
    panel(`<div class="v2Row"><span class="v2Seg wide" style="flex:1"><span class="on">🗂 Haus</span><span>🔍 Suchen</span><span>❔ Hilfe</span></span></div>
      <div class="v2Tree">
        ${n('h', '▾', '🏠', 'Demo-Haus', '', '⋯')}
        ${n('h', '▾', '🏢', 'Haupthaus', '5 Etagen', '⋯', 1)}
        ${n('', '', '<span class="grip">⠿</span>', '🔺 Dach', 'Satteldach', '', 2)}
        ${n('', '▸', '<span class="grip">⠿</span>', 'Dachgeschoss', '2 Räume', '', 2)}
        ${n('', '▸', '<span class="grip">⠿</span>', 'Obergeschoss', '7 Räume', '', 2)}
        ${n('on', '▾', '<span class="grip">⠿</span>', '<b>Erdgeschoss</b>', '6 Räume', '👁 ⋯', 2)}
        ${n('', '', '🛋', 'Wohnzimmer', '27 m²', '', 3)}
        ${n('', '', '🍳', 'Küche', '18 m²', '', 3)}
        ${n('', '', '🛁', 'Bad', '7,5 m²', '', 3)}
        ${n('', '', '🛏', 'Schlafzimmer', '10 m²', '', 3)}
        ${n('', '', '💻', 'Büro', '7,5 m²', '', 3)}
        ${n('', '', '🧺', 'Hauswirtschaft', '30 m²', '🔒', 3)}
        ${n('', '▸', '<span class="grip">⠿</span>', 'Keller', '4 Räume', '', 2)}
        ${n('h', '▸', '🛖', 'Gartenhaus', '1 Etage', '⋯', 1)}
        ${n('', '', '', '<span style="color:var(--muted)">🏡 Nachbarhaus „Oma“ (nur Ansicht)</span>', '', '', 1)}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="v2Btn">＋ Etage</span><span class="v2Btn">＋ Keller</span><span class="v2Btn">＋ Gebäude</span><span class="v2Btn">＋ Haus</span></div>
      ${sec('🖼', 'Vorlage (Bild vom Grundriss)', 'keine')}
      ${sec('⤵', 'Hereinholen / Import', 'Datei, Beispiel, anderes Haus')}
      <div class="v2Foot"><span class="v2Hint">❔ Tipp: Klick auf ein Objekt im Bild wählt es aus · Doppelklick schaltet die Entität</span></div>`);
  }
  function struktur() {
    __fp.select(null, null);
    uiSwitch();
    treePanel();
    const p = $('#panel').getBoundingClientRect();
    title('⑨', 'Nichts ausgewählt: das ganze Haus als Baum', 'Häuser › Gebäude › Etagen › Räume');
    note('Statt „Häuser“, „Gebäude in diesem Plan“, „Etage verwalten“, „Hintergrundbild“ und „Objekte“ untereinander: ein Baum wie im Datei-Explorer. Antippen öffnet die Einstellungen (Bild ⑩).', p.left - 340, 300, 'r', 310);
    note('Etagen mit ⠿ einfach ziehen, um sie umzusortieren (statt „▲ Nach oben / ▼ Nach unten“). ⋯ = umbenennen, kopieren, löschen.', p.left - 340, 540, 'r', 310);
    note('Der lange Hinweistext oben wird ein kleiner Reiter „❔ Hilfe“.', p.left - 340, 760, 'r', 310);
  }

  // 10 a floor selected
  function etage() {
    __fp.select(null, null);
    uiSwitch();
    const H = [['Dach', '', 0], ['Dachgeschoss', '3,00', 0], ['Obergeschoss', '3,00', 0], ['Erdgeschoss', '3,00', 1], ['Keller', '3,00', 0]];
    let svg = '<svg width="176" height="170" viewBox="0 0 176 170">';
    svg += '<path d="M10 34 L88 4 L166 34 Z" fill="#b2533e"/>';
    H.slice(1).forEach(([nm, hh, on], i) => {
      const y = 34 + i * 32, hgt = i === 3 ? 26 : 32;
      svg += `<rect x="14" y="${y}" width="148" height="${hgt}" fill="${on ? 'rgba(63,169,245,.45)' : (i === 3 ? '#3a3f45' : '#2a3541')}" stroke="${on ? '#3fa9f5' : '#4b5866'}" stroke-width="${on ? 2.5 : 1}"/>
        <text x="20" y="${y + hgt / 2 + 4}" font-size="10.5" font-weight="700" fill="#dfe7ef">${nm}</text><text x="156" y="${y + hgt / 2 + 4}" font-size="10.5" font-weight="800" fill="${on ? '#ffd45c' : '#9fb3c8'}" text-anchor="end">${hh} m</text>`;
    });
    svg += '<rect x="0" y="129" width="176" height="3" fill="#5c8a3a"/></svg>';
    panel(`${crumbs(['🏠 Demo-Haus', '🏢 Haupthaus', 'Erdgeschoss'])}
      ${head({ icon: '▤', name: 'Erdgeschoss', sub: 'Etage 2 von 4 · 6 Räume · 47 Geräte', chips: [chip('🌡 21,2° im Schnitt'), chip('🪟 0 offen', 'ok')], acts: false })}
      <div class="v2Tabs"><span class="on">Allgemein</span><span>Alle Räume</span><span>Vorlage</span></div>
      ${f('Name', sel('Erdgeschoss'))}
      ${f('Art', '', '')}
      ${seg(['<i>⬇</i>Keller', '<i>▤</i>Etage', '<i>⌂</i>Dachstuhl'], 1, 'wide big')}
      <div style="display:flex;gap:12px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--line)">${svg}
        <div style="flex:1;display:flex;flex-direction:column;gap:8px"><b style="font-size:14px">Höhe</b>${step('3,00 m')}<div class="v2Hint">Geschosshöhe, Boden bis Boden. Gilt für das ganze Haus, Treppen rechnen ihre Stufen neu.</div></div></div>
      ${sec('🪵', 'Boden für alle Räume', 'jeder Raum eigen')}
      ${sec('🗑', 'Etage löschen', 'mit 6 Räumen und 47 Geräten')}`);
    const p = $('#panel').getBoundingClientRect();
    title('⑩', 'Eine Etage', 'Art als Knöpfe, Höhe mit Seitenansicht');
    note('Typ (Keller, Etage, Dachstuhl) als drei Knöpfe mit Bild statt einer Liste.', p.left - 330, 300, 'r', 300);
    note('Die Geschosshöhe zeigt ein kleines Haus von der Seite: die gewählte Etage leuchtet, man sieht alle Höhen auf einmal.', p.left - 330, 470, 'r', 300);
    note('„Löschen“ ganz unten, eingeklappt: kein Versehen.', p.left - 330, 690, 'r', 300);
  }

  // 11 the tools: one row on top, tools on the left
  function werkzeuge() {
    __fp.select(null, null);
    const tb = $('#toolbar');
    [...tb.children].forEach((c) => { c.style.display = 'none'; });
    tb.append(h(`<div style="display:flex;align-items:center;gap:10px;width:100%;font-weight:700;font-size:14px">
      <span class="v2Seg"><span class="on">✏️ Bearbeiten</span><span>▶ Live</span></span>
      <span class="v2Seg"><span>2D</span><span class="on">3D</span><span>2D+3D</span></span>
      <span class="v2Sel" style="min-width:150px">🏠 Demo-Haus</span><span class="v2Sel" style="min-width:150px">▤ Erdgeschoss</span>
      <span style="flex:1"></span><span class="mkUiSw"><span>Klassisch</span><span class="on">✨ Neu</span></span>
      <span class="v2Btn">↶</span><span class="v2Btn">↷</span><span class="v2Btn pri" style="background:#2e7d4f;border-color:#2e7d4f;color:#fff">💾 Speichern</span>
      <span class="v2Btn">⋯ Mehr</span><span class="v2Btn">⚙</span></div>`));
    $('#floorRail').style.display = 'none'; $('#floorCards').style.display = 'none';
    treePanel();
    fit();
    setTimeout(() => {
      const st = $('#stage').getBoundingClientRect();
      const tool = (i, t, on, more) => `<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px;border-radius:12px;font-size:11px;font-weight:700;
        ${on ? 'background:var(--accent);color:var(--accent-text)' : 'color:var(--text)'}"><span style="font-size:20px">${i}</span>${t}${more ? '<span style="position:absolute;right:4px;bottom:4px;font-size:8px;opacity:.7">◢</span>' : ''}</div>`;
      const rail = h(`<div style="position:fixed;z-index:92;left:${st.left + 10}px;top:${st.top + 60}px;width:70px;padding:6px;border-radius:16px;background:var(--panel);border:1px solid var(--line);
        box-shadow:0 10px 30px rgba(0,0,0,.45);display:flex;flex-direction:column;gap:2px">
        ${tool('➚', 'Auswählen')}${tool('✏️', 'Zeichnen', true, true)}${tool('🚪', 'Tür/Fenster', false, true)}${tool('💡', 'Gerät')}${tool('🪜', 'Treppe', false, true)}${tool('⌂', 'Dach', false, true)}
        <i style="height:1px;background:var(--line);margin:4px 6px"></i>${tool('📏', 'Messen')}${tool('⚡', 'Strom')}${tool('🧽', 'Löschen')}</div>`);
      lay().append(rail);
      const rr = rail.getBoundingClientRect();
      const fly = h(`<div class="v2Pop" style="left:${rr.right + 8}px;top:${rr.top + 46}px;width:250px"><h5>Zeichnen</h5>
        <div class="v2Opt on">▭ Wand <small>W</small></div><div class="v2Opt">⬚ Raum <small>R</small></div><div class="v2Opt">✨ Räume erkennen</div>
        <div class="v2Opt">⬛ Block (Säule, Schrank)</div><div class="v2Opt">🌳 Grundstück</div><div class="v2Opt">◯ Loch in Decke</div></div>`);
      lay().append(fly);
      const more = h(`<div class="v2Pop" style="right:20px;top:58px;width:260px"><h5>Mehr</h5>
        <div class="v2Opt">🎬 Anleitung (Videos)</div><div class="v2Opt">💾 Backup</div><div class="v2Opt">⤵ Import</div><div class="v2Opt">🛡 Sicherheit</div><div class="v2Opt">✓ v4.72.0 · aktuell</div><div class="v2Opt">⌨ Tasten</div></div>`);
      lay().append(more);
      title('⑪', 'Werkzeuge: eine Zeile oben, Leiste links', 'wie in Malprogrammen', st.bottom - 70);
      note('Oben nur noch eine Zeile: Modus, Ansicht, Haus, Etage, Speichern. Seltenes (Backup, Anleitung, Version, Sicherheit) steckt in „⋯ Mehr“. Die Etagen-Bilder links werden die Auswahl „▤ Erdgeschoss“ oben.', st.left + 520, st.top + 70, 'u', 400);
      note('Werkzeuge links untereinander, verwandte in Gruppen (◢ = hält mehr bereit): Wand, Raum, Erkennen, Block … unter „Zeichnen“.', rr.right + 280, rr.top + 260, 'l', 320);
    }, 600);
  }

  // 12 search inside the column
  function suche() {
    __fp.select('opening', 'o2');
    uiSwitch();
    const r = (path, name, val, hi) => `<div style="padding:10px 12px;border-radius:12px;background:${hi ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'rgba(255,255,255,.04)'};border:1px solid ${hi ? 'var(--accent)' : 'var(--line)'}">
      <div style="color:var(--muted);font-size:11.5px;font-weight:700">${path}</div><div style="display:flex;align-items:center;gap:8px;margin-top:4px"><b style="flex:1">${name}</b>${val}</div></div>`;
    panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer', '🪟 Fenster'])}
      ${head({ icon: '🪟', name: 'Fenster Terrasse', sub: 'Fenster · 1 Flügel · Dreh-Kipp', chips: [chip('🔗 offen ✓', 'ok'), chip('🔗 gekippt ✓', 'ok')], acts: false })}
      <div class="v2Row">${search('<b style="color:var(--text)">kipp</b>|', true)}<span class="v2Btn">✕</span></div>
      <div class="v2Hint">4 Treffer in diesem Fenster · 2 in ⚙ Einstellungen</div>
      ${r('🪟 Flügel & Öffnen', '<mark style="background:#ffd45c;color:#2a2100;border-radius:3px">Kipp</mark>winkel im Bild', step('14°'), true)}
      ${r('🔗 Home Assistant', 'Kontakt ge<mark style="background:#ffd45c;color:#2a2100;border-radius:3px">kipp</mark>t', '<span class="v2Chip ok">binary_sensor.fenster_wz_gekippt</span>')}
      ${r('🪟 Flügel & Öffnen', 'Flügel 1 öffnet', seg(['Dreh-<mark style="background:#ffd45c;color:#2a2100;border-radius:3px">Kipp</mark>', 'nur <mark style="background:#ffd45c;color:#2a2100;border-radius:3px">Kipp</mark>'], 0))}
      ${r('⇉ Übernehmen', 'Diesen <mark style="background:#ffd45c;color:#2a2100;border-radius:3px">Kipp</mark>winkel für alle Fenster', '<span class="v2Btn">Los</span>')}
      ${r('⚙ Einstellungen › Warnungen', 'Ge<mark style="background:#ffd45c;color:#2a2100;border-radius:3px">kipp</mark>t zählt als offen', tog(true))}`);
    const p = $('#panel').getBoundingClientRect();
    title('⑫', 'Suchen statt suchen', 'ein Wort tippen, die Einstellung erscheint');
    note('Wer das Wort kennt („kipp“, „Rollladen“, „Höhe“), tippt es oben ein. Gezeigt wird die Einstellung direkt zum Ändern, mit dem Weg dorthin.', p.left - 340, 260, 'r', 310);
    note('Findet auch, was in ⚙ Einstellungen steht, und sagt, wo.', p.left - 340, 600, 'r', 310);
  }

  // 13 one way to copy settings to other windows / rooms
  function uebernehmen() {
    __fp.select('opening', 'o1');
    uiSwitch();
    windowPanel({ open: 'panes', extra: `${winSvg({ px: 110 })}${f('Flügel', seg(['1', '2', '3', '4'], 1))}${f('Kippwinkel', step('20°'))}
      <div style="display:flex;justify-content:flex-end"><span class="v2Btn" style="border-color:#ffd45c;box-shadow:0 0 0 2px #ffd45c">⇉ Auf andere übernehmen</span></div>` });
    const b = [...document.querySelectorAll('.v2 .v2Btn')].pop().getBoundingClientRect();
    const pop = h(`<div class="v2Pop" style="width:330px;left:${b.right - 330 - 390}px;top:${b.top - 250}px"><h5>Flügel & Kippwinkel übernehmen</h5>
      <div style="font-weight:700;margin:2px 0 4px">Auf welche?</div>
      <div class="v2Opt"><span class="rd"></span>Fenster im Wohnzimmer<small>3</small></div>
      <div class="v2Opt on"><span class="rd"></span>Fenster im Erdgeschoss<small>9</small></div>
      <div class="v2Opt"><span class="rd"></span>alle Fenster im Haus<small>23</small></div>
      <div class="v2Opt"><span class="rd"></span>im Bild auswählen …</div>
      <div style="font-weight:700;margin:8px 0 4px">Was?</div>
      <div class="v2Opt"><span class="bx on">✓</span>Flügel (2, Dreh-Kipp)</div><div class="v2Opt"><span class="bx on">✓</span>Kippwinkel 20°</div>
      <div class="v2Opt"><span class="bx"></span>Größe 1,20 × 1,20 m</div>
      <div style="display:flex;gap:8px;margin-top:10px"><span class="v2Btn" style="flex:1">Abbrechen</span><span class="v2Btn pri" style="flex:1.4">Für 9 Fenster ✓</span></div></div>`);
    lay().append(pop);
    let pr = pop.getBoundingClientRect();
    if (pr.bottom > innerHeight - 12) { pop.style.top = `${innerHeight - 12 - pr.height}px`; pr = pop.getBoundingClientRect(); }
    title('⑬', 'Ein Knopf „⇉ Übernehmen“ für alles', 'statt vieler einzelner „für alle“-Knöpfe');
    note('Heute gibt es verstreut „Diesen Winkel für alle Fenster“, „Wände für alle Räume der Etage übernehmen“ … Neu: überall derselbe Knopf, und man wählt, wohin und was.', pr.left - 330, pr.top + 40, 'r', 300);
    note('Rückgängig mit ↶ wie immer.', pr.left - 330, pr.top + 250, 'r', 300);
  }

  // 14 the device: what it controls first
  function geraet() {
    __fp.select('device', 'd1');
    uiSwitch();
    panel(`${crumbs(['🏠 Demo-Haus', 'Erdgeschoss', '🛋 Wohnzimmer', '📺 Fernseher'])}
      ${head({ icon: '📺', name: 'Fernseher', sub: 'Fernseher an der Wand · 1,40 × 0,80 m', chips: [chip('▶ läuft: Tagesschau', 'ok'), chip('💡 LED an', 'warn')] })}
      ${sec('🔗', 'Was steuert es?', 'media_player.tv', `${ent('📺', 'Fernseher', 'media_player.tv', 'läuft')}
        ${ent('💡', 'Hintergrundlicht (LED hinter dem TV)', 'light.tv_led', 'an')}
        ${f('Antippen in Live', seg(['Steuerung', 'An/Aus', 'nichts'], 0))}`)}
      ${sec('📍', 'Lage', 'an der Wand · 90° · 1,10 m hoch')}
      ${sec('📏', 'Größe', '1,40 × 0,80 × 0,10 m')}
      ${sec('↻', 'Kippen & Spiegeln', 'nichts')}
      ${sec('📟', 'Andere Geräte im Raum', '11 · zum Springen antippen')}`);
    const p = $('#panel').getBoundingClientRect();
    title('⑭', 'Gerät: zuerst, was es steuert', 'Lage und Größe eingeklappt');
    note('Für Home-Assistant-Leute ist die Entität das Wichtigste: sie steht oben, mit ihrem Zustand live.', p.left - 330, 300, 'r', 300);
    note('X, Z, Drehung, Höhe, Breite, Tiefe, Kippen, Spiegeln (heute 12 Felder) stecken in drei Zeilen mit Zusammenfassung. Verschieben geht ja meist mit der Maus.', p.left - 330, 520, 'r', 300);
  }

  // 15 Office-like: a context tab hangs under the top bar
  function kontextReiter() {
    __fp.select('opening', 'o1');
    const pn = $('#panel'); pn.style.display = 'none'; $('#panelResizer').style.display = 'none'; fit();
    setTimeout(() => {
      const tb = $('#toolbar').getBoundingClientRect(), st = $('#stage').getBoundingClientRect();
      const tab = h(`<div style="position:fixed;z-index:93;left:${st.left + st.width / 2 - 120}px;top:${tb.bottom - 1}px;padding:7px 16px 9px;border-radius:0 0 14px 14px;background:#b48cff;color:#1a0f2e;
        font-weight:900;font-size:14px;box-shadow:0 8px 20px rgba(0,0,0,.4)">🪟 Fenster-Optionen ▴</div>`);
      lay().append(tab);
      const grp = (t, body) => `<div style="display:flex;flex-direction:column;gap:6px;padding:0 14px;border-right:1px solid var(--line)"><div style="display:flex;gap:8px;align-items:center">${body}</div><div style="text-align:center;color:var(--muted);font-size:11.5px;font-weight:700">${t}</div></div>`;
      const rib = h(`<div style="position:fixed;z-index:92;left:${st.left + 10}px;right:20px;top:${tb.bottom + 34}px;display:flex;align-items:stretch;padding:10px 4px;border-radius:16px;background:var(--panel);
        border:1px solid #b48cff;box-shadow:0 14px 40px rgba(0,0,0,.5);color:var(--text);font-size:13px;font-weight:700;overflow:hidden">
        ${grp('Art', `<div class="v2Tile on" style="width:64px"><div style="padding:4px">${winSvg({ px: 38 })}</div></div><div class="v2Tile" style="width:64px"><div style="padding:4px">${winSvg({ px: 38, w: 0.6, hh: 1.2, panes: [{ t: 'dk', g: 'l' }] })}</div></div><span class="v2Btn">▾</span>`)}
        ${grp('Größe', `<div style="display:flex;flex-direction:column;gap:4px">${step('↔ 1,20')}${step('↕ 1,20')}</div>${step('⤒ 0,90')}`)}
        ${grp('Flügel', `${seg(['1', '2', '3'], 1)}${seg(['⤵ innen', '⤴ außen'], 0)}`)}
        ${grp('Feste Scheibe', `<span class="v2Btn">▭ unten</span><span class="v2Btn">▭ oben</span>`)}
        ${grp('Home Assistant', `<span class="v2Chip ok">🔗 Kontakt ✓</span><span class="v2Btn">＋ gekippt</span><span class="v2Btn">🎚 Rollladen</span>`)}
        <div style="display:flex;align-items:center;gap:8px;padding:0 14px"><span class="v2Btn">⧉</span><span class="v2Btn" style="color:#ff8a80">🗑</span></div></div>`);
      lay().append(rib);
      const rr = rib.getBoundingClientRect();
      title('⑮', 'Reiter, der oben herunterhängt', 'wie bei Word: „Bildformat“', st.bottom - 70);
      note('Klickt man ein Fenster an, hängt oben ein farbiger „Noppel“ herunter: „Fenster-Optionen“. Er klappt eine breite Zeile mit allen Fenster-Sachen auf. Bei einem Raum heißt er „Raum-Optionen“.', st.left + 40, rr.bottom + 26, 'u', 420);
      note('Rechts ist dann gar keine Leiste nötig: das ganze Bild bleibt frei.', st.right - 360, rr.bottom + 120, '', 300);
    }, 600);
  }

  // 16 on the phone: a sheet from below with chips
  function handy() {
    __fp.select('opening', 'o1');
    setTimeout(() => {
      const W = innerWidth, H = innerHeight;
      const sheet = h(`<div style="position:fixed;z-index:92;left:0;right:0;bottom:0;height:${Math.round(H * 0.6)}px;background:var(--panel);border-radius:22px 22px 0 0;border-top:1px solid var(--accent);
        box-shadow:0 -14px 40px rgba(0,0,0,.55);padding:8px 14px 14px;display:flex;flex-direction:column;gap:10px;color:var(--text);font-size:14px">
        <div style="align-self:center;width:46px;height:5px;border-radius:9px;background:var(--muted);opacity:.6"></div>
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">🪟</span><div style="flex:1"><b style="font-size:16px">Fenster Wohnzimmer</b><div style="color:var(--muted);font-size:12px;font-weight:600">Wohnzimmer · Doppelfenster</div></div>
          <span class="v2Btn">⧉</span><span class="v2Btn" style="color:#ff8a80">🗑</span></div>
        <div style="display:flex;gap:6px;overflow:hidden">${['📐 Maße', '🪟 Flügel', '🔗 HA', '🎚 Rollladen', '⋯'].map((t, i) => `<span class="v2Chip ${i === 1 ? 'acc' : ''}" style="padding:7px 12px;font-size:13px">${t}</span>`).join('')}</div>
        <div style="display:flex;gap:14px;align-items:center">${winSvg({ px: 120, sel: 0 })}<div style="flex:1;display:flex;flex-direction:column;gap:8px">${seg(['1', '2', '3'], 1, 'wide')}${seg(['innen', 'außen'], 0, 'wide')}<div class="v2Hint">Flügel im Bild antippen</div></div></div>
        ${f('Kippwinkel', step('14°'))}
        ${sec('▭', 'Feste Scheibe', 'keine')}${sec('🔗', 'Home Assistant', 'Kontakt ✓')}</div>`);
      lay().append(sheet);
      const sr = sheet.getBoundingClientRect();
      const t = h('<div class="mkTitle" style="font-size:14px;padding:7px 14px">⑯ Am Handy: Blatt von unten</div>');
      t.style.top = '64px'; t.style.left = `${W / 2}px`; lay().append(t);
      note('Das Blatt zieht man halb oder ganz hoch. Die Reiter sind kleine Knöpfe zum Wischen.', 14, sr.top - 104, 'd', W - 60);
    }, 500);
  }

  // 17 the window without the dashed lines: which look?
  function fensterLook() {
    const panes = [{ t: 'dk', g: 'l' }, { t: 'f' }, { t: 'k' }];
    const card = (k, name, txt, look, old) => `<div style="flex:1;min-width:0;background:var(--panel);border:2px solid ${old ? 'var(--line)' : '#b48cff'};border-radius:18px;padding:16px;
      display:flex;flex-direction:column;gap:12px;${old ? 'filter:saturate(.4) brightness(.75)' : ''}">
      <div style="display:flex;align-items:center;gap:10px"><span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font:900 24px system-ui;
        background:${old ? 'var(--field)' : '#b48cff'};color:${old ? 'var(--muted)' : '#1a0f2e'}">${k}</span><b style="font-size:17px">${name}</b></div>
      <div style="height:250px;display:grid;place-items:center;background:rgba(255,255,255,.03);border-radius:12px">${winSvg({ w: 1.8, hh: 1.2, px: 150, panes, look })}</div>
      <div class="v2Hint" style="font-size:13.5px;color:var(--text);line-height:1.45">${txt}</div></div>`;
    const ov = h(`<div style="position:fixed;inset:0;z-index:91;background:rgba(5,9,14,.9);display:flex;flex-direction:column;gap:18px;padding:110px 28px 28px;color:var(--text)">
      <div style="text-align:center;font-size:16px;font-weight:700;color:var(--muted)">Dasselbe Fenster mit drei Flügeln: links <b style="color:var(--text)">Dreh-Kipp</b>, Mitte <b style="color:var(--text)">fest</b>, rechts <b style="color:var(--text)">nur kippen</b></div>
      <div style="display:flex;gap:16px;align-items:stretch">
      ${card('–', 'bisher (Bild 3)', 'Gestrichelte Linien wie im Fensterkatalog: die Spitze zeigt zum Scharnier. Für Laien schwer zu lesen.', 'lines', true)}
      ${card('A', 'Schildchen', 'Nur Glas und Griff. Unter jedem Flügel steht in Worten, wie er aufgeht. Blau = geht auf, grau = fest.', 'chips')}
      ${card('B', 'Halb offen', 'Jeder Flügel ist so gezeichnet, wie er offen aussieht: zur Seite gedreht oder oben gekippt. Wie im 3D-Bild.', 'open')}
      ${card('C', 'Kleine Zeichen', 'Ein rundes Zeichen im Glas: ↻ drehen, ↘ kippen, 🔒 fest. Dreh-Kipp hat beide.', 'icons')}
      ${card('D', 'Ganz schlicht', 'Nur Glas und Griff. Wie der Flügel aufgeht, steht erst nach dem Antippen im kleinen Menü (wie Bild 3).', 'plain')}
      </div></div>`);
    lay().append(ov);
    title('⑰', 'Fenster ohne Striche', 'welche Darstellung?', 30);
  }
  const setLook = (x) => { LOOK = x; };

  return { fensterLook, setLook, ueberblick, umschalten, fensterBild, vorlagen, noppel, kontextleiste, raumBoden, vorherNachher, struktur, etage, werkzeuge, suche, uebernehmen, geraet, kontextReiter, handy };
})();
