// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of the owner's wishes of 2026-10-22 (#495): cards that can be set more freely, a thermostat like Home Assistant's (a circle,
// − / +, the modes), the power of several houses in one chart, sections placed freely on a page, who is really at home (Wi-Fi, GPS,
// rooms), a calendar card with several calendars, and buttons with their own look.
window.mk49 = (() => {
  const css = `
  .mkPage { position: relative; }
  .mkGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; align-items: start; }
  .mkC { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; min-width: 0; position: relative; }
  .mkC h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); display: flex; align-items: center; gap: 8px; }
  .mkC h4 .r { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 600; }
  .mkS2 { grid-column: span 2; } .mkS3 { grid-column: span 3; } .mkS4 { grid-column: 1 / -1; }
  .mkMuted { color: var(--muted); font-size: 13px; }
  .mkNew { position: absolute; top: -11px; right: 14px; padding: 2px 10px; border-radius: 999px; background: #46a758; color: #fff; font-size: 12px; font-weight: 800; z-index: 3; }
  .mkNote { position: absolute; z-index: 20; max-width: 300px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  /* the thermostat */
  .mkTh { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .mkTh .top { display: flex; width: 100%; align-items: flex-start; }
  .mkTh .top b { font-size: 17px; } .mkTh .top small { display: block; color: var(--muted); font-size: 12px; }
  .mkTh .badge { margin-left: auto; }
  .mkDial { position: relative; width: 210px; height: 190px; }
  .mkDial svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .mkDial .mid { position: absolute; inset: 40px 0 0; display: flex; flex-direction: column; align-items: center; }
  .mkDial .mid small { color: var(--muted); font-size: 12px; font-weight: 700; }
  .mkDial .mid .t { font-size: 46px; font-weight: 800; letter-spacing: -.03em; line-height: 1.05; }
  .mkDial .mid .t sup { font-size: 22px; }
  .mkDial .mid .now { color: var(--muted); font-size: 13px; font-weight: 600; margin-top: 2px; }
  .mkDial.small { width: 150px; height: 136px; } .mkDial.small .mid { inset: 26px 0 0; } .mkDial.small .mid .t { font-size: 32px; }
  .mkPM { display: flex; gap: 16px; margin-top: -26px; z-index: 1; }
  .mkPM span { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-size: 24px; font-weight: 700; background: var(--field); border: 1px solid var(--line); }
  .mkModes { display: flex; gap: 6px; width: 100%; justify-content: center; flex-wrap: wrap; }
  .mkModes span { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 58px; padding: 7px 8px; border-radius: 12px; background: var(--field);
    border: 1px solid var(--line); font-size: 18px; } .mkModes span small { font-size: 11px; font-weight: 700; color: var(--muted); }
  .mkModes span.on { background: rgba(255, 140, 50, .2); border-color: #ff8c32; } .mkModes span.on small { color: #ffb070; }
  .mkModes span.cool.on { background: rgba(63, 169, 245, .2); border-color: #3fa9f5; } .mkModes span.cool.on small { color: #8fd0ff; }
  .mkModes span.off.on { background: rgba(140, 150, 160, .2); border-color: #8b98a5; } .mkModes span.off.on small { color: var(--text); }
  .mkPre { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
  .mkPre span { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line); font-size: 12px; font-weight: 700; color: var(--muted); }
  .mkPre span.on { color: var(--text); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); }
  .mkBadge { padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 800; }
  .mkBadge.heat { background: rgba(255, 120, 60, .18); color: #ffb070; border: 1px solid rgba(255, 120, 60, .5); }
  .mkBadge.cool { background: rgba(63, 169, 245, .18); color: #8fd0ff; border: 1px solid rgba(63, 169, 245, .5); }
  .mkBadge.off { background: rgba(140, 150, 160, .14); color: var(--muted); border: 1px solid var(--line); }
  /* charts */
  .mkChart { width: 100%; height: auto; display: block; }
  .mkChart .grid { stroke: var(--line); stroke-width: 1; } .mkChart text { fill: var(--muted); font-size: 11px; font-family: inherit; }
  .mkLegend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; font-weight: 600; margin-top: 6px; }
  .mkLegend span { display: inline-flex; align-items: center; gap: 6px; } .mkLegend i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .mkLegend i.line { height: 3px; border-radius: 2px; width: 16px; }
  .mkHouse { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line); }
  .mkHouse:first-of-type { border-top: 0; }
  .mkHouse i { width: 12px; height: 12px; border-radius: 3px; } .mkHouse .n { flex: 1; font-weight: 700; } .mkHouse b { font-size: 18px; }
  .mkHouse .bar { flex: 1.2; height: 8px; border-radius: 4px; background: var(--field); overflow: hidden; } .mkHouse .bar u { display: block; height: 100%; }
  .mkTile { display: flex; flex-direction: column; gap: 2px; }
  .mkTile .v { font-size: 28px; font-weight: 800; letter-spacing: -.02em; } .mkTile .v small { font-size: 14px; font-weight: 700; margin-left: 3px; }
  .mkTile .nm { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; font-weight: 600; } .mkTile .nm i { width: 10px; height: 10px; border-radius: 3px; }
  /* sections */
  .mkStrip { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: -4px 0 14px; padding: 10px 14px; border-radius: 14px;
    background: color-mix(in srgb, var(--accent) 14%, var(--panel)); border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent); }
  .mkStrip b { font-size: 16px; } .mkStrip .sub { color: var(--muted); font-size: 13px; flex: 1; min-width: 200px; }
  .mkB { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--field);
    color: var(--text); font-weight: 700; font-size: 14px; }
  .mkB.blue { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .mkSecs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
  .mkSec { border-radius: 18px; padding: 10px; background: color-mix(in srgb, var(--panel) 45%, transparent); border: 1px dashed color-mix(in srgb, var(--accent) 45%, transparent); }
  .mkSec.wide { grid-column: span 2; }
  .mkSecH { display: flex; align-items: center; gap: 8px; padding: 2px 4px 10px; font-size: 17px; font-weight: 800; }
  .mkSecH .tools { margin-left: auto; display: flex; gap: 4px; }
  .mkSecH .tools span, .mkCT span { width: 28px; height: 26px; display: grid; place-items: center; border-radius: 8px; background: var(--panel); border: 1px solid var(--line); font-size: 13px; }
  .mkSecH .grip { color: var(--muted); letter-spacing: -2px; }
  .mkSG { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; grid-auto-rows: 58px; }
  .mkSG .mkC { padding: 10px 12px; outline: 2px dashed color-mix(in srgb, var(--accent) 45%, transparent); outline-offset: 2px; }
  .mkCT { position: absolute; top: -12px; right: 8px; display: flex; gap: 3px; z-index: 2; }
  .mkResize { position: absolute; right: 3px; bottom: 3px; width: 16px; height: 16px; border-right: 3px solid var(--accent); border-bottom: 3px solid var(--accent); border-radius: 0 0 6px 0; }
  .mkAddSec { display: grid; place-items: center; min-height: 140px; border-radius: 18px; border: 2px dashed color-mix(in srgb, var(--accent) 60%, transparent);
    color: var(--accent); font-weight: 800; font-size: 16px; background: color-mix(in srgb, var(--accent) 6%, transparent); }
  .mkAddCard { display: grid; place-items: center; border-radius: 12px; border: 2px dashed color-mix(in srgb, var(--accent) 45%, transparent); color: var(--accent); font-weight: 800; font-size: 13px; }
  .mkDrag { transform: rotate(-2deg); box-shadow: 0 18px 40px rgba(0,0,0,.55); z-index: 5; }
  .mkTileBtn { display: flex; align-items: center; gap: 10px; height: 100%; }
  .mkTileBtn .ic { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; flex: none; }
  .mkTileBtn b { display: block; font-size: 14px; } .mkTileBtn small { color: var(--muted); font-size: 12px; }
  /* presence */
  .mkHome { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 16px; background: rgba(70, 167, 88, .14); border: 1px solid rgba(70, 167, 88, .55); margin-bottom: 14px; }
  .mkHome .big { font-size: 34px; } .mkHome b { font-size: 20px; } .mkHome .mkMuted { font-size: 14px; }
  .mkPerson { display: flex; flex-direction: column; gap: 10px; }
  .mkPerson .hd { display: flex; align-items: center; gap: 12px; }
  .mkAva { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; font-size: 22px; font-weight: 800; color: #fff; flex: none; position: relative; }
  .mkAva .dot { position: absolute; right: -2px; bottom: -2px; width: 16px; height: 16px; border-radius: 50%; border: 3px solid var(--panel); }
  .mkPerson .hd b { font-size: 18px; display: block; } .mkPerson .hd .where { font-size: 15px; font-weight: 600; }
  .mkSrc { display: flex; flex-direction: column; gap: 6px; }
  .mkSrc div { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 6px 10px; border-radius: 10px; background: var(--field); }
  .mkSrc div b { font-weight: 700; } .mkSrc div small { margin-left: auto; color: var(--muted); }
  .mkSrc div.yes { box-shadow: inset 3px 0 0 #46a758; } .mkSrc div.no { box-shadow: inset 3px 0 0 #8b98a5; opacity: .8; }
  .mkRule { display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
  .mkRule label { display: flex; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 10px; background: var(--field); }
  .mkRule label small { color: var(--muted); display: block; font-size: 12px; }
  .mkTick { width: 20px; height: 20px; border-radius: 6px; display: grid; place-items: center; background: var(--accent); color: var(--accent-text); font-size: 13px; font-weight: 900; flex: none; }
  .mkTick.off { background: transparent; border: 2px solid var(--line); }
  /* calendar */
  .mkWeek { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
  .mkDay { min-height: 260px; border-radius: 12px; background: var(--field); padding: 8px 6px; display: flex; flex-direction: column; gap: 5px; }
  .mkDay.today { box-shadow: inset 0 0 0 2px var(--accent); }
  .mkDay .dh { font-size: 12px; font-weight: 800; color: var(--muted); text-align: center; margin-bottom: 2px; } .mkDay.today .dh { color: var(--accent); }
  .mkEv { border-radius: 7px; padding: 4px 6px; font-size: 11.5px; line-height: 1.25; font-weight: 600; color: #fff; }
  .mkEv small { display: block; font-weight: 800; opacity: .85; font-size: 10.5px; }
  .mkCals { display: flex; flex-wrap: wrap; gap: 6px; }
  .mkCals span { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--line); font-size: 12.5px; font-weight: 700; }
  .mkCals span i { width: 10px; height: 10px; border-radius: 50%; } .mkCals span.off { opacity: .45; text-decoration: line-through; }
  .mkAg { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid var(--line); font-size: 14px; }
  .mkAg:first-of-type { border-top: 0; } .mkAg .bar { width: 4px; align-self: stretch; border-radius: 2px; } .mkAg b { width: 62px; font-size: 13px; }
  .mkAg small { margin-left: auto; color: var(--muted); font-size: 12px; }
  .mkDayHead { font-size: 13px; font-weight: 800; color: var(--muted); margin: 8px 0 2px; }
  /* the dialog */
  .mkModal { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.55); display: grid; place-items: center; }
  .mkBox { width: min(980px, calc(100vw - 40px)); background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 18px 22px; color: var(--text);
    box-shadow: 0 30px 80px rgba(0,0,0,.6); }
  .mkBox h3 { margin: 0 0 2px; font-size: 21px; } .mkBox .sub { color: var(--muted); margin: 0 0 12px; }
  .mkCols { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 20px; }
  .mkF { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; } .mkF > label { font-size: 13px; color: var(--muted); font-weight: 700; }
  .mkIn { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .mkIn small { color: var(--muted); margin-left: auto; font-size: 12px; }
  .mkSeg { display: flex; gap: 6px; flex-wrap: wrap; } .mkSeg span { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--field); font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
  .mkSeg span.on { background: color-mix(in srgb, var(--accent) 24%, transparent); border-color: var(--accent); }
  .mkDots { display: flex; gap: 8px; } .mkDots i { width: 26px; height: 26px; border-radius: 50%; display: block; border: 2px solid transparent; }
  .mkDots i.on { border-color: #fff; box-shadow: 0 0 0 2px var(--accent); }
  .mkEmo { display: grid; grid-template-columns: repeat(10, 1fr); gap: 5px; } .mkEmo span { display: grid; place-items: center; height: 34px; border-radius: 9px; background: var(--field); font-size: 19px; border: 1px solid var(--line); }
  .mkEmo span.on { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); background: color-mix(in srgb, var(--accent) 20%, transparent); }
  .mkBtns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
  .mkPrev { border-radius: 16px; padding: 12px; background: rgba(0,0,0,.2); }
  .mkPrev > small { display: block; color: var(--muted); font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 10px 2px; }
  .mkBtnGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .mkBtn { border-radius: 16px; padding: 12px; background: var(--panel); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; min-height: 96px; position: relative; }
  .mkBtn .ic { font-size: 28px; } .mkBtn b { font-size: 14px; } .mkBtn small { color: var(--muted); font-size: 12px; }
  .mkBtn.lit { background: linear-gradient(140deg, rgba(255, 200, 90, .35), rgba(255, 160, 60, .12)); border-color: rgba(255, 190, 90, .7); }
  .mkBtn.round { border-radius: 50%; aspect-ratio: 1; min-height: 0; align-items: center; justify-content: center; text-align: center; gap: 2px; padding: 8px; }
  .mkBtn.pill { flex-direction: row; align-items: center; border-radius: 999px; min-height: 0; padding: 10px 14px; }
  .mkBtn.pill .ic { font-size: 22px; } .mkBtn.big { grid-column: span 2; flex-direction: row; align-items: center; gap: 14px; }
  .mkBtn.big .ic { font-size: 44px; } .mkBtn.big b { font-size: 18px; }
  .mkBtn.iconOnly { align-items: center; justify-content: center; min-height: 0; aspect-ratio: 1; } .mkBtn.iconOnly .ic { font-size: 34px; }
  .mkBtn .corner { position: absolute; top: 8px; right: 10px; font-size: 12px; font-weight: 800; color: var(--muted); }
  `;
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  function setup() {
    if (!document.getElementById('mk49css')) { const s = document.createElement('style'); s.id = 'mk49css'; s.textContent = css; document.head.append(s); }
  }
  /** a tab opened, its real page hidden and a page of the mock-up in its place (the demo's own redraws go to the hidden page) */
  function page(tab, html) {
    setup();
    document.querySelector(`#tabBar [data-tab=${tab}]`)?.click();
    const host = document.getElementById('tabPages');
    host.querySelectorAll('.tabPage').forEach((p) => { p.hidden = true; });
    host.querySelector('.mkPage')?.remove();
    const p = el(`<section class="tabPage mkPage">${html}</section>`);
    host.append(p);
    host.scrollTop = 0;
    return p;
  }
  const note = (p, text, style) => { const n = el(`<div class="mkNote" style="${style}">${text}</div>`); p.append(n); };

  /* ---- the thermostat as a circle ---- */
  function arc(cx, cy, r, a0, a1) {
    const rad = (a) => (a * Math.PI) / 180, p = (a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  function dial({ cur, target, mode = 'heat', min = 7, max = 30, small = false, label = 'Soll' }) {
    const W = 210, H = 190, cx = 105, cy = 100, r = 86;
    const ang = (v) => 135 + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 270;
    const col = mode === 'heat' ? 'url(#mkHeat)' : mode === 'cool' ? 'url(#mkCool)' : mode === 'auto' ? 'url(#mkAuto)' : '#5b6875';
    const kx = cx + r * Math.cos((ang(target) * Math.PI) / 180), ky = cy + r * Math.sin((ang(target) * Math.PI) / 180);
    const ix = cx + r * Math.cos((ang(cur) * Math.PI) / 180), iy = cy + r * Math.sin((ang(cur) * Math.PI) / 180);
    const ticks = Array.from({ length: 24 }, (_, i) => { const a = 135 + (i / 23) * 270, c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180); return `<line x1="${cx + (r - 15) * c}" y1="${cy + (r - 15) * s}" x2="${cx + (r - 11) * c}" y2="${cy + (r - 11) * s}" stroke="var(--line)" stroke-width="2"/>`; }).join('');
    const off = mode === 'off';
    const fmt = (v) => v.toLocaleString('de', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `<div class="mkDial${small ? ' small' : ''}"><svg viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="mkHeat" x1="0" x2="1"><stop offset="0" stop-color="#ffcf5a"/><stop offset="1" stop-color="#ff5b2e"/></linearGradient>
      <linearGradient id="mkCool" x1="0" x2="1"><stop offset="0" stop-color="#9fe3ff"/><stop offset="1" stop-color="#2f8cf0"/></linearGradient>
      <linearGradient id="mkAuto" x1="0" x2="1"><stop offset="0" stop-color="#7ee0a0"/><stop offset="1" stop-color="#ffb04a"/></linearGradient></defs>
      <path d="${arc(cx, cy, r, 135, 405)}" stroke="var(--field)" stroke-width="16" fill="none" stroke-linecap="round"/>
      ${off ? '' : `<path d="${arc(cx, cy, r, 135, ang(target))}" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="round"/>`}
      ${ticks}
      <circle cx="${ix}" cy="${iy}" r="4" fill="#fff" opacity=".85"/>
      ${off ? '' : `<circle cx="${kx}" cy="${ky}" r="13" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`}
    </svg><div class="mid"><small>${off ? 'Aus' : label}</small><div class="t">${off ? fmt(cur) : fmt(target)}<sup>°</sup></div>
      <div class="now">${off ? 'jetzt im Raum' : `jetzt ${fmt(cur)}°`}</div></div></div>`;
  }
  const modes = (list, on) => `<div class="mkModes">${list.map(([k, i, n]) => `<span class="${k}${k === on ? ' on' : ''}">${i}<small>${n}</small></span>`).join('')}</div>`;
  const HEAT = [['heat', '🔥', 'Heizen'], ['auto', '⟳', 'Auto'], ['off', '⏻', 'Aus']];
  const AC = [['cool', '❄️', 'Kühlen'], ['heat', '🔥', 'Heizen'], ['dry', '💧', 'Trocknen'], ['fan', '🌀', 'Lüfter'], ['off', '⏻', 'Aus']];
  function thermostat() {
    const card = (room, floor, badge, d, ms, pre, extra = '') => `<div class="mkC mkTh"><div class="top"><div><b>${room}</b><small>${floor}</small></div><span class="badge">${badge}</span></div>
      ${d}<div class="mkPM"><span>−</span><span>+</span></div>${ms}${pre ? `<div class="mkPre">${pre}</div>` : ''}${extra}</div>`;
    const p = page('climate', `<div class="tpHead"><h2>🌡️ Klima</h2><span class="tpSub">draußen 14,0°</span></div>
      <div class="mkGrid">
        ${card('Wohnzimmer', 'Erdgeschoss · 💧 48 %', '<span class="mkBadge heat">🔥 heizt</span>', dial({ cur: 21.3, target: 22 }), modes(HEAT, 'heat'),
          '<span class="on">🏠 Komfort</span><span>🌙 Eco</span><span>✈ Abwesend</span><span>🚀 Boost</span>')}
        ${card('Büro', 'Erdgeschoss · Klimagerät', '<span class="mkBadge cool">❄ kühlt</span>', dial({ cur: 23, target: 21, mode: 'cool', min: 16, max: 30 }), modes(AC, 'cool'),
          '<span>Lüfter</span><span class="on">Auto</span><span>1</span><span>2</span><span>3</span>')}
        ${card('Schlafzimmer', 'Erdgeschoss', '<span class="mkBadge off">aus</span>', dial({ cur: 18.6, target: 18, mode: 'off' }), modes(HEAT, 'off'), '')}
        ${card('Kinderzimmer', 'Obergeschoss', '<span class="mkBadge heat">⟳ Zeitplan</span>', dial({ cur: 20.2, target: 20.5, mode: 'auto' }), modes(HEAT, 'auto'),
          '<span>🏠 Komfort</span><span class="on">🌙 Eco</span><span>✈ Abwesend</span>', '<div class="mkMuted">ab 6:00 Uhr wieder 21,0°</div>')}
      </div>
      <h3 class="peH" style="margin:22px 0 10px">Oder kleiner (in ⚙ der Karte wählbar)</h3>
      <div class="mkGrid">
        ${[['Gästezimmer', 17.4, 19, 'heat', '🔥 heizt'], ['Studio', 24.6, 21, 'off', 'aus'], ['Bad', 22.8, 23, 'heat', '🔥 heizt'], ['Warmwasser', 48, 50, 'heat', 'Wärmepumpe']].map(([n, c, tg, m, b]) =>
          `<div class="mkC" style="display:flex;align-items:center;gap:10px">${dial({ cur: c, target: tg, mode: m, small: true, min: n === 'Warmwasser' ? 30 : 7, max: n === 'Warmwasser' ? 65 : 30 })}
            <div style="display:flex;flex-direction:column;gap:8px"><b style="font-size:16px">${n}</b><span class="mkBadge ${m === 'off' ? 'off' : 'heat'}" style="align-self:flex-start">${b}</span>
            <div class="mkPM" style="margin:0;gap:8px"><span style="width:38px;height:38px;font-size:20px">−</span><span style="width:38px;height:38px;font-size:20px">+</span></div></div></div>`).join('')}
      </div>`);
    note(p, 'Wie in Home Assistant: Kreis zum Ziehen, − / +, darunter Heizen · Auto · Aus und die Vorwahlen (Komfort, Eco …)', 'left: 30px; top: 690px; max-width: 520px');
    p.querySelectorAll('.mkTh').forEach((c, i) => { if (i < 2) c.append(el('<span class="mkNew">neu</span>')); });
  }

  /* ---- power of several houses in one chart ---- */
  function series(seed, base, amp, peaks) {
    let s = seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    return Array.from({ length: 97 }, (_, i) => { const h = i / 4; let v = base + amp * 0.35 * Math.sin((h / 24) * Math.PI * 2 - 1.2) + (rnd() - 0.5) * amp * 0.25;
      peaks.forEach(([at, w, hgt]) => { v += hgt * Math.exp(-((h - at) ** 2) / (2 * w * w)); }); return Math.max(60, v); });
  }
  function lines(sets, { W = 760, H = 230, max = 4000, now = 72, unit = 'W' } = {}) {
    const pl = 46, pb = 22, pt = 10, x = (i) => pl + (i / 96) * (W - pl - 8), y = (v) => H - pb - (v / max) * (H - pb - pt);
    const grid = [0, max / 4, max / 2, (3 * max) / 4, max].map((v) => `<line class="grid" x1="${pl}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v >= 1000 ? `${(v / 1000).toLocaleString('de')} k` : v}</text>`).join('');
    const xs = [0, 6, 12, 18, 24].map((h) => `<text x="${x(h * 4)}" y="${H - 5}" text-anchor="${h === 24 ? 'end' : h ? 'middle' : 'start'}">${h}:00</text>`).join('');
    const paths = sets.map(({ pts, col, dash, fill }) => {
      const d = pts.slice(0, now + 1).map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
      return `${fill ? `<path d="${d} L${x(now)} ${H - pb} L${x(0)} ${H - pb} Z" fill="${col}" opacity=".13"/>` : ''}<path d="${d}" stroke="${col}" stroke-width="2.4" fill="none" ${dash ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round"/>
        <circle cx="${x(now)}" cy="${y(pts[now])}" r="4.5" fill="${col}"/>`;
    }).join('');
    return `<svg class="mkChart" viewBox="0 0 ${W} ${H}">${grid}${xs}<line x1="${x(now)}" x2="${x(now)}" y1="${pt}" y2="${H - pb}" stroke="var(--muted)" stroke-dasharray="3 3"/><text x="${x(now) + 5}" y="${pt + 10}">jetzt</text>${paths}</svg>`;
  }
  function weekBars(houses, { W = 900, H = 170 } = {}) {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], max = 20, pl = 32, pb = 22, pt = 8, gw = (W - pl) / 7, bw = (gw - 14) / houses.length;
    const y = (v) => H - pb - (v / max) * (H - pb - pt);
    const grid = [0, 10, 20].map((v) => `<line class="grid" x1="${pl}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
    const bars = days.map((d, i) => houses.map((h, k) => { const v = h.week[i]; if (v == null) return ''; const x0 = pl + i * gw + 7 + k * bw;
      return `<rect x="${x0}" y="${y(v)}" width="${bw - 3}" height="${H - pb - y(v)}" rx="3" fill="${h.col}"/>`; }).join('') + `<text x="${pl + i * gw + gw / 2}" y="${H - 5}" text-anchor="middle">${d}</text>`).join('');
    return `<svg class="mkChart" viewBox="0 0 ${W} ${H}">${grid}${bars}</svg>`;
  }
  function power() {
    const A = series(3, 700, 900, [[7.2, 0.6, 1800], [12.3, 0.5, 1400], [18.5, 0.8, 2100]]), B = series(11, 380, 500, [[6.8, 0.5, 900], [19, 0.7, 1300]]);
    const C = series(17, 260, 300, [[8, 0.6, 600], [13, 1.2, 700]]);
    const pv = Array.from({ length: 97 }, (_, i) => { const h = i / 4; return h < 7 || h > 18.5 ? 0 : 3300 * Math.sin(((h - 7) / 11.5) * Math.PI) ** 1.4; });
    const houses = [{ n: 'Demo-Haus', col: '#3fa9f5', pts: A, now: '1,9 kW', kwh: '12,7', week: [14.1, 15.3, 12.2, 13.8, 16.4, 9.6, null] },
      { n: 'Nachbarhaus', col: '#f5a623', pts: B, now: '840 W', kwh: '6,9', week: [7.2, 8.1, 6.4, 7.9, 9.2, 5.1, null] },
      { n: 'Ferienwohnung', col: '#c678dd', pts: C, now: '310 W', kwh: '3,2', week: [3.4, 2.9, 3.6, 3.1, 4.2, 5.8, null] }];
    const p = page('energy', `<div class="tpHead"><h2>⚡ Energie</h2><div class="peChips"><span class="tpChip">Demo-Haus</span><span class="tpChip">Nachbarhaus</span><span class="tpChip">Ferienwohnung</span>
        <span class="tpChip">Alle zusammen</span><span class="tpChip on">⚖ Vergleichen</span></div>
        <div class="peChips" style="margin-left:auto"><span class="tpChip on">Tag</span><span class="tpChip">Woche</span><span class="tpChip">Monat</span><span class="tpChip">Jahr</span></div></div>
      <div class="mkGrid">
        ${houses.map((h) => `<div class="mkC mkTile"><div class="nm"><i style="background:${h.col}"></i>${h.n}</div><div class="v">${h.kwh}<small>kWh</small></div><div class="mkMuted">jetzt ${h.now}</div></div>`).join('')}
        <div class="mkC mkTile"><div class="nm">Σ alle Häuser</div><div class="v">22,8<small>kWh</small></div><div class="mkMuted">jetzt 3,05 kW · ☀️ 2,4 kW</div></div>
        <div class="mkC mkS3"><h4>Leistung heute, jedes Haus eine Linie <span class="r tpSub">aus den Strom-Sensoren jedes Hauses</span></h4>
          ${lines([...houses.map((h, i) => ({ pts: h.pts, col: h.col, fill: i === 0 })), { pts: pv, col: '#7ee0a0', dash: true }])}
          <div class="mkLegend">${houses.map((h) => `<span><i class="line" style="background:${h.col}"></i>${h.n}</span>`).join('')}<span><i class="line" style="background:#7ee0a0"></i>☀️ PV (Demo-Haus)</span></div></div>
        <div class="mkC"><h4>Jetzt</h4>${houses.map((h, i) => `<div class="mkHouse"><i style="background:${h.col}"></i><span class="n">${h.n}</span><b>${h.now}</b></div><div class="bar" style="height:8px;border-radius:4px;background:var(--field);overflow:hidden;margin:-2px 0 6px"><u style="display:block;height:100%;width:${[62, 27, 10][i]}%;background:${h.col}"></u></div>`).join('')}
          <div class="mkMuted" style="margin-top:8px">Tippen auf ein Haus: nur dieses</div></div>
        <div class="mkC mkS2"><h4>Diese Woche pro Tag (kWh)</h4>${weekBars(houses)}<div class="mkLegend">${houses.map((h) => `<span><i style="background:${h.col}"></i>${h.n}</span>`).join('')}</div></div>
        <div class="mkC mkS2"><h4>Kosten diese Woche</h4>${houses.map((h, i) => `<div class="mkHouse"><i style="background:${h.col}"></i><span class="n">${h.n}</span><span class="bar"><u style="width:${[100, 52, 28][i]}%;background:${h.col}"></u></span><b style="width:80px;text-align:right">${['24,40', '12,70', '6,90'][i]} €</b></div>`).join('')}
          <div class="mkHouse"><span class="n">Σ zusammen</span><b>44,00 €</b></div></div>
      </div>`);
    p.querySelector('.mkS3').append(el('<span class="mkNew">neu</span>'));
    note(p, 'Mehrere Häuser mit eigenen Strom-Sensoren nebeneinander in einer Grafik, live und aus dem Energie-Dashboard', 'right: 30px; top: 440px; max-width: 360px');
  }

  /* ---- sections placed freely ---- */
  function sections() {
    const tb = (ic, bg, n, s) => `<div class="mkTileBtn"><span class="ic" style="background:${bg}">${ic}</span><span><b>${n}</b><small>${s}</small></span></div>`;
    const card = (cls, span, rows, inner, extra = '') => `<div class="mkC ${cls}" style="grid-column: span ${span}; grid-row: span ${rows}">${inner}<span class="mkCT"><span>⚙️</span><span>🗑</span></span><i class="mkResize"></i>${extra}</div>`;
    const A = series(3, 700, 900, [[7.2, 0.6, 1800], [12.3, 0.5, 1400], [18.5, 0.8, 2100]]), B = series(11, 380, 500, [[6.8, 0.5, 900], [19, 0.7, 1300]]);
    const p = page('today', `<div class="mkStrip"><b>✎ Seite „Übersicht“ bearbeiten</b><span class="sub">Abschnitte und Karten ziehen · Ecke ↘ ziehen: Größe · ⚙ Karte einstellen</span>
        <span class="mkB">＋ Karte</span><span class="mkB">＋ Abschnitt</span><span class="mkB">🎨 Aussehen</span><span class="mkB blue">✓ Fertig</span></div>
      <div class="mkSecs">
        <div class="mkSec"><div class="mkSecH"><span class="grip">⠿</span>🛋 Wohnzimmer<span class="tools"><span>✏️</span><span>🗑</span></span></div>
          <div class="mkSG">
            ${card('', 2, 1, tb('💡', 'rgba(255,190,80,.35)', 'Decke', 'an · 80 %'))}
            ${card('', 2, 1, tb('🪟', 'rgba(63,169,245,.25)', 'Rollo', 'offen · 100 %'))}
            ${card('', 4, 3, `<div style="display:flex;gap:12px;align-items:center">${dial({ cur: 21.3, target: 22, small: true })}<div>${modes(HEAT, 'heat')}</div></div>`)}
            ${card('', 2, 1, tb('📺', 'rgba(198,120,221,.3)', 'Fernseher', 'aus'))}
            <div class="mkAddCard" style="grid-column: span 2">＋ Karte</div>
          </div></div>
        <div class="mkSec wide"><div class="mkSecH"><span class="grip">⠿</span>⚡ Strom beider Häuser<span class="tools"><span>✏️</span><span>🗑</span></span></div>
          <div class="mkSG">
            ${card('', 1, 2, '<div class="mkTile"><div class="nm"><i style="background:#3fa9f5"></i>Demo-Haus</div><div class="v">1,9<small>kW</small></div><div class="mkMuted">heute 12,7 kWh</div></div>')}
            ${card('', 1, 2, '<div class="mkTile"><div class="nm"><i style="background:#f5a623"></i>Nachbarhaus</div><div class="v">840<small>W</small></div><div class="mkMuted">heute 6,9 kWh</div></div>')}
            ${card('', 2, 2, '<div class="mkTile"><div class="nm">☀️ Sonne jetzt</div><div class="v">2,4<small>kW</small></div><div class="mkMuted">🔋 76 % · ins Netz 0,3 kW</div></div>')}
            ${card('mkDrag', 4, 4, `<h4>Leistung heute</h4>${lines([{ pts: A, col: '#3fa9f5', fill: true }, { pts: B, col: '#f5a623' }], { H: 170, W: 1100 })}`)}
          </div></div>
        <div class="mkSec"><div class="mkSecH"><span class="grip">⠿</span>🔒 Sicherheit<span class="tools"><span>✏️</span><span>🗑</span></span></div>
          <div class="mkSG">
            ${card('', 2, 1, tb('🚪', 'rgba(70,167,88,.3)', 'Haustür', 'zu · abgeschlossen'))}
            ${card('', 2, 1, tb('🛡', 'rgba(229,72,77,.3)', 'Alarm', 'unscharf'))}
            ${card('', 4, 3, '<div style="height:100%;border-radius:10px;background:linear-gradient(160deg,#2b3a48,#11161c);display:grid;place-items:center;color:var(--muted);font-weight:700">📷 Kamera Einfahrt</div>')}
          </div></div>
        <div class="mkSec wide"><div class="mkSecH"><span class="grip">⠿</span>📅 Termine<span class="tools"><span>✏️</span><span>🗑</span></span></div>
          <div class="mkSG">${card('', 4, 2, '<div class="mkAg"><span class="bar" style="background:#3fa9f5"></span><b>15:00</b>Zahnarzt Anna<small>Familie</small></div><div class="mkAg"><span class="bar" style="background:#46a758"></span><b>17:30</b>Fußball-Training Max<small>Schule</small></div>')}</div></div>
      </div>`);
    note(p, 'Abschnitte mit Überschrift wie in Home Assistant: frei anordnen, Karten zwischen Abschnitten ziehen, Größe an der Ecke ↘', 'right: 30px; top: 730px; max-width: 560px');
  }

  /* ---- who is really at home ---- */
  function presence() {
    const src = (cls, ic, text, when) => `<div class="${cls}">${ic} ${text}<small>${when}</small></div>`;
    const person = (n, col, dot, where, srcs) => `<div class="mkC mkPerson"><div class="hd"><span class="mkAva" style="background:${col}">${n[0]}<i class="dot" style="background:${dot}"></i></span>
      <div><b>${n}</b><span class="where">${where}</span></div></div><div class="mkSrc">${srcs}</div></div>`;
    const p = page('family', `<div class="tpHead"><h2>👨‍👩‍👧 Familie</h2></div>
      <div class="mkHome"><span class="big">🏠</span><div><b>2 Personen zu Hause</b><div class="mkMuted">Anna (Wohnzimmer) · Opa · dazu 1 unbekanntes Handy im WLAN (Gast?)</div></div></div>
      <div class="mkGrid">
        ${person('Anna', '#46a758', '#46a758', '🏠 zu Hause · im Wohnzimmer', src('yes', '📶', '<b>im WLAN</b> „Zuhause-5G“', 'seit 11:02') + src('yes', '📍', '<b>GPS</b> zu Hause', 'vor 3 min') + src('yes', '🛋', '<b>Bewegung</b> Wohnzimmer', 'gerade eben') + src('', '📱', 'Handy 78 % · lädt nicht', ''))}
        ${person('Opa', '#3fa9f5', '#46a758', '🏠 zu Hause', src('yes', '📶', '<b>im WLAN</b> (FRITZ!Box)', 'seit 08:40') + src('no', '📍', 'kein GPS (kein Handy-App)', '') + src('', '⌚', 'Uhr: im Schlafzimmer (Bluetooth)', 'vor 10 min'))}
        ${person('Lena', '#2e6fa3', '#8b98a5', '📍 Schule', src('no', '📶', 'nicht im WLAN', 'seit 07:41') + src('yes', '📍', '<b>GPS</b> Schule', 'vor 12 min') + src('', '🕒', 'kommt meist gegen 13:30', ''))}
        ${person('Max', '#6f9a32', '#8b98a5', '🚗 unterwegs · 12 km', src('no', '📶', 'nicht im WLAN', 'seit 08:10') + src('yes', '📍', '<b>GPS</b> unterwegs, fährt', 'vor 1 min') + src('', '⏱', 'in etwa 18 min zu Hause', ''))}
        <div class="mkC mkS2"><h4>Wer ist wo im Haus</h4>
          <div class="mkAg"><span class="bar" style="background:#46a758"></span><b>🛋</b>Wohnzimmer<small>Anna · Bewegung + Handy</small></div>
          <div class="mkAg"><span class="bar" style="background:#46a758"></span><b>🛏</b>Schlafzimmer<small>Opa · Uhr (Bluetooth)</small></div>
          <div class="mkAg"><span class="bar" style="background:#8b98a5"></span><b>🍳</b>Küche<small>leer seit 25 min</small></div>
          <div class="mkAg"><span class="bar" style="background:#8b98a5"></span><b>🧒</b>Kinderzimmer<small>leer seit 07:30</small></div></div>
        <div class="mkC mkS2"><h4>⚙ So erkennt das Programm „zu Hause“ <span class="r tpSub">pro Person</span></h4>
          <div class="mkRule">
            <label><span class="mkTick">✓</span><span>Handy im WLAN<small>über den Router: FRITZ!Box, UniFi, Ping (device_tracker)</small></span></label>
            <label><span class="mkTick">✓</span><span>WLAN-Name aus der Handy-App<small>sensor.…_wifi_connection = „Zuhause-5G“</small></span></label>
            <label><span class="mkTick">✓</span><span>GPS der Home-Assistant-App<small>Zone „Zuhause“</small></span></label>
            <label><span class="mkTick off"></span><span>Bluetooth / Bewegung im Raum<small>zeigt den Raum, zählt aber nicht als „zu Hause“</small></span></label>
            <div class="mkSeg"><span class="on">zu Hause, wenn <b>eins</b> passt</span><span>wenn <b>zwei</b> passen (sicherer)</span></div>
          </div></div>
      </div>`);
    p.querySelectorAll('.mkPerson').forEach((c, i) => { if (i < 1) c.append(el('<span class="mkNew">neu</span>')); });
    note(p, 'Woher es weiß, dass jemand da ist: WLAN, GPS, Bewegung. Fällt eins aus, bleibt die Person trotzdem „zu Hause“', 'left: 30px; top: 660px; max-width: 520px');
  }

  /* ---- a calendar card with several calendars ---- */
  const CALS = [['Familie', '#3fa9f5'], ['Arbeit Anna', '#f5a623'], ['Schule', '#46a758'], ['Geburtstage', '#e5484d'], ['Müll', '#8b98a5']];
  const col = (n) => CALS.find((c) => c[0] === n)[1];
  function calendar() {
    const days = [['Do 22.', true, [['ganztags', 'Herbstferien', 'Schule'], ['15:00', 'Zahnarzt Anna', 'Familie'], ['17:30', 'Fußball Max', 'Schule']]],
      ['Fr 23.', false, [['ganztags', 'Herbstferien', 'Schule'], ['08:15', 'Handwerker', 'Familie'], ['09:00', 'Team-Termin', 'Arbeit Anna'], ['19:00', 'Elternabend', 'Schule']]],
      ['Sa 24.', false, [['ganztags', 'Oma 70 🎂', 'Geburtstage'], ['14:00', 'Kaffee bei Oma', 'Familie']]],
      ['So 25.', false, [['ganztags', 'Restmüll', 'Müll'], ['10:00', 'Laufen', 'Familie']]],
      ['Mo 26.', false, [['08:00', 'Büro', 'Arbeit Anna'], ['16:00', 'Schwimmen Lena', 'Schule']]],
      ['Di 27.', false, [['09:30', 'Arzt Max', 'Familie'], ['13:00', 'Mittag mit Jan', 'Arbeit Anna']]],
      ['Mi 28.', false, [['ganztags', 'Papier', 'Müll'], ['18:00', 'Chor', 'Familie']]]];
    const ev = ([when, what, cal]) => `<div class="mkEv" style="background:${col(cal)}${cal === 'Müll' ? ';color:#fff' : ''}"><small>${when}</small>${what}</div>`;
    const p = page('today', `<div class="mkGrid">
      <div class="mkC mkS3"><h4>📅 Diese Woche <span class="r"><span class="mkCals">${CALS.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</span></span></h4>
        <div class="mkWeek">${days.map(([d, today, list]) => `<div class="mkDay${today ? ' today' : ''}"><div class="dh">${d}</div>${list.map(ev).join('')}</div>`).join('')}</div></div>
      <div class="mkC"><h4>📅 Termine Anna</h4><div class="mkMuted" style="margin:-4px 0 6px">nur „Familie“ und „Arbeit Anna“</div>
        <div class="mkDayHead">Heute</div>
        <div class="mkAg"><span class="bar" style="background:${col('Familie')}"></span><b>15:00</b>Zahnarzt</div>
        <div class="mkDayHead">Morgen</div>
        <div class="mkAg"><span class="bar" style="background:${col('Familie')}"></span><b>08:15</b>Handwerker</div>
        <div class="mkAg"><span class="bar" style="background:${col('Arbeit Anna')}"></span><b>09:00</b>Team-Termin</div>
        <div class="mkDayHead">Montag</div>
        <div class="mkAg"><span class="bar" style="background:${col('Arbeit Anna')}"></span><b>08:00</b>Büro</div></div>
      <div class="mkC"><h4>🎂 Geburtstage</h4><div class="mkAg"><b>Sa</b>Oma wird 70<small>in 2 Tagen</small></div><div class="mkAg"><b>12.11.</b>Lena wird 9<small>in 3 Wochen</small></div></div>
      <div class="mkC"><h4>🗑 Müll</h4><div class="mkAg"><b>Fr</b>Gelber Sack<small>morgen</small></div><div class="mkAg"><b>So</b>Restmüll<small></small></div><div class="mkAg"><b>Mi</b>Papier<small></small></div></div>
      </div>`);
    p.querySelector('.mkS3').append(el('<span class="mkNew">neu</span>'));
    note(p, 'Mehrere Kalender in einer Karte, jeder mit Farbe; oder eigene Kalender-Karten (z. B. nur Annas Termine)', 'right: 30px; top: 340px; max-width: 420px');
  }
  function calendarEditor() {
    calendar();
    const p = document.querySelector('.mkPage');
    const cals = CALS.map(([n, c], i) => `<div class="mkIn"><span class="mkTick${i === 4 ? ' off' : ''}">${i === 4 ? '' : '✓'}</span>${n}<small>calendar.${n.toLowerCase().replace(/ /g, '_').replace('ü', 'ue')}</small>
      <span class="mkDots" style="margin-left:8px">${['#3fa9f5', '#f5a623', '#46a758', '#e5484d', '#8b98a5'].map((x) => `<i style="background:${x};width:18px;height:18px${x === c ? ';border-color:#fff' : ''}"></i>`).join('')}</span></div>`).join('');
    p.append(el(`<div class="mkModal"><div class="mkBox"><h3>📅 Kalender-Karte einstellen</h3><p class="sub">Welche Kalender, wie weit voraus, wie es aussieht</p>
      <div class="mkCols"><div>
        <div class="mkF"><label>Kalender (mehrere)</label>${cals}</div>
        <div class="mkF"><label>Zeitraum</label><div class="mkSeg"><span>Heute + morgen</span><span class="on">7 Tage</span><span>14 Tage</span><span>Monat</span></div></div>
        <div class="mkF"><label>Ansicht</label><div class="mkSeg"><span class="on">▦ Woche</span><span>☰ Liste</span><span>🗓 Monat</span><span>Nur nächster Termin</span></div></div>
        <div class="mkF"><label>Name</label><div class="mkIn">Diese Woche</div></div>
      </div><div class="mkPrev"><small>Vorschau</small>
        <div class="mkC"><h4>📅 Diese Woche</h4><div class="mkWeek" style="grid-template-columns:repeat(4,1fr)">
          <div class="mkDay today" style="min-height:150px"><div class="dh">Do 22.</div><div class="mkEv" style="background:#46a758"><small>ganztags</small>Herbstferien</div><div class="mkEv" style="background:#3fa9f5"><small>15:00</small>Zahnarzt</div></div>
          <div class="mkDay" style="min-height:150px"><div class="dh">Fr 23.</div><div class="mkEv" style="background:#3fa9f5"><small>08:15</small>Handwerker</div><div class="mkEv" style="background:#f5a623"><small>09:00</small>Team</div></div>
          <div class="mkDay" style="min-height:150px"><div class="dh">Sa 24.</div><div class="mkEv" style="background:#e5484d"><small>ganztags</small>Oma 70 🎂</div></div>
          <div class="mkDay" style="min-height:150px"><div class="dh">So 25.</div><div class="mkEv" style="background:#3fa9f5"><small>10:00</small>Laufen</div></div></div></div>
        <div class="mkF" style="margin-top:12px"><label>＋ Termin eintragen (geht direkt in den Kalender von Home Assistant)</label><div class="mkIn">Kalender: Familie ▾ <small>Titel, Tag, Uhrzeit</small></div></div>
      </div></div>
      <div class="mkBtns"><span class="mkB">Abbrechen</span><span class="mkB blue">✓ Hinzufügen</span></div></div></div>`));
  }

  /* ---- buttons with their own look ---- */
  function buttons() {
    page('today', '<div class="mkGrid"></div>');
    const p = document.querySelector('.mkPage');
    const emo = ['💡', '🛋', '🛏', '📺', '🎵', '🔥', '❄️', '🪟', '🚪', '🔒', '🌙', '☀️', '🍳', '🧺', '🚗', '🌱', '🎮', '🎬', '⚡', '🏠'];
    p.append(el(`<div class="mkModal"><div class="mkBox"><h3>🔘 Knopf einstellen</h3><p class="sub">Gerät, Aussehen und was ein Tipp macht</p>
      <div class="mkCols"><div>
        <div class="mkF"><label>Gerät</label><div class="mkIn">💡 Wohnzimmer Decke<small>light.wohnzimmer</small></div></div>
        <div class="mkF"><label>Symbol</label><div class="mkEmo">${emo.map((e, i) => `<span class="${i === 1 ? 'on' : ''}">${e}</span>`).join('')}</div></div>
        <div class="mkF"><label>Farbe, wenn an</label><div class="mkDots">${['#ffc04d', '#ff7a3d', '#e5484d', '#c678dd', '#3fa9f5', '#46a758', '#8b98a5', 'linear-gradient(135deg,#ffc04d,#c678dd)'].map((c, i) => `<i class="${i === 0 ? 'on' : ''}" style="background:${c}"></i>`).join('')}<span class="mkMuted" style="align-self:center">oder die Farbe der Lampe</span></div></div>
        <div class="mkF"><label>Form und Größe</label><div class="mkSeg"><span class="on">▢ Kachel</span><span>◯ Rund</span><span>▭ Pille</span><span>Nur Symbol</span></div>
          <div class="mkSeg" style="margin-top:6px"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div></div>
        <div class="mkF"><label>Zeigen</label><div class="mkSeg"><span class="on">✓ Name</span><span class="on">✓ Zustand</span><span>Helligkeit als Balken</span><span>seit wann</span></div></div>
        <div class="mkF"><label>Tippen</label><div class="mkSeg"><span class="on">An / Aus</span><span>Fenster mit Reglern</span><span>Seite öffnen</span><span>Szene / Skript</span></div></div>
        <div class="mkF"><label>Lange drücken</label><div class="mkSeg"><span>nichts</span><span class="on">Fenster mit Reglern</span><span>Verlauf</span></div></div>
      </div><div class="mkPrev"><small>So kann es aussehen</small><div class="mkBtnGrid">
        <div class="mkBtn lit"><span class="ic">🛋</span><b>Wohnzimmer</b><small>an · 80 %</small><span class="corner">80 %</span></div>
        <div class="mkBtn"><span class="ic">🛏</span><b>Schlafzimmer</b><small>aus</small></div>
        <div class="mkBtn round lit" style="background:radial-gradient(circle at 30% 30%,rgba(255,160,80,.55),rgba(255,120,60,.15))"><span class="ic">🔥</span><b>Heizung</b><small>21,5°</small></div>
        <div class="mkBtn round"><span class="ic">🎬</span><b>Kino</b><small>Szene</small></div>
        <div class="mkBtn pill lit" style="grid-column:span 2"><span class="ic">💡</span><b>Alle Lichter</b><small style="margin-left:auto">5 an</small></div>
        <div class="mkBtn pill" style="grid-column:span 2"><span class="ic">🔒</span><b>Haustür</b><small style="margin-left:auto">zu</small></div>
        <div class="mkBtn big" style="background:linear-gradient(140deg,rgba(63,169,245,.35),rgba(63,169,245,.08));border-color:rgba(63,169,245,.6)"><span class="ic">🌙</span><span><b>Gute Nacht</b><br><small>alles aus, Alarm an</small></span></div>
        <div class="mkBtn iconOnly lit"><span class="ic">📺</span></div>
        <div class="mkBtn iconOnly"><span class="ic">🎵</span></div>
      </div></div></div>
      <div class="mkBtns"><span class="mkB">Abbrechen</span><span class="mkB blue">✓ Speichern</span></div></div></div>`));
  }

  return { thermostat, power, sections, presence, calendar, calendarEditor, buttons };
})();
