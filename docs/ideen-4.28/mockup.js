// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of the owner's wish of 2026-10-26 (#546): heating rules in the dashboard (window open -> heating off, nobody at home, a
// schedule per room ...), seeing which automations, scripts and scenes use a thermostat and whether they run right now, and own
// routines "Wenn … dann …" built from blocks like a Node-RED flow, all run by the add-on itself.
window.mk427 = (() => {
  const css = `
  .mkPage { position: relative; }
  .mkGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
  .mkC { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; min-width: 0; position: relative; }
  .mkC h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); display: flex; align-items: center; gap: 8px; }
  .mkC h4 .r { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 600; }
  .mkS2 { grid-column: span 2; } .mkS3 { grid-column: 1 / -1; }
  .mkMuted { color: var(--muted); font-size: 13px; }
  .mkNew { position: absolute; top: -11px; right: 14px; padding: 2px 10px; border-radius: 999px; background: #46a758; color: #fff; font-size: 12px; font-weight: 800; z-index: 3; }
  .mkNote { position: absolute; z-index: 120; max-width: 300px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  .mkB { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--field);
    color: var(--text); font-weight: 700; font-size: 14px; white-space: nowrap; }
  .mkB.blue { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .mkB.small { padding: 5px 10px; font-size: 12.5px; border-radius: 8px; }
  .mkSw { width: 44px; height: 26px; border-radius: 999px; background: var(--field); border: 1px solid var(--line); position: relative; flex: none; }
  .mkSw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #8b98a5; }
  .mkSw.on { background: #46a758; border-color: #46a758; } .mkSw.on::after { left: 21px; background: #fff; }
  .mkChip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid var(--line); color: var(--muted); white-space: nowrap; }
  .mkChip.run { background: rgba(70, 167, 88, .2); color: #8be09c; border-color: rgba(70, 167, 88, .7); }
  .mkChip.run::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #5fd37a; box-shadow: 0 0 0 4px rgba(95, 211, 122, .25); }
  .mkChip.warn { background: rgba(245, 166, 35, .18); color: #ffc46b; border-color: rgba(245, 166, 35, .6); }
  .mkChip.off { opacity: .75; }
  .mkChip.ha { color: #8fd0ff; border-color: rgba(63, 169, 245, .5); background: rgba(63, 169, 245, .1); }
  .mkChip.fp { color: #ffb070; border-color: rgba(255, 140, 50, .5); background: rgba(255, 140, 50, .1); }
  .mkSeg { display: flex; gap: 6px; flex-wrap: wrap; } .mkSeg span { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--field); font-weight: 700; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
  .mkSeg span.on { background: color-mix(in srgb, var(--accent) 24%, transparent); border-color: var(--accent); }
  /* the window over the page */
  .mkModal { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.55); display: grid; place-items: center; }
  .mkBox { width: min(1240px, calc(100vw - 40px)); background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 18px 22px; color: var(--text);
    box-shadow: 0 30px 80px rgba(0,0,0,.6); position: relative; }
  .mkBoxH { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .mkBoxH h3 { margin: 0; font-size: 21px; } .mkBoxH .x { margin-left: auto; font-size: 20px; color: var(--muted); }
  .mkTabs { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--field); }
  .mkTabs span { padding: 7px 14px; border-radius: 9px; font-weight: 700; font-size: 14px; color: var(--muted); }
  .mkTabs span.on { background: var(--panel); color: var(--text); box-shadow: 0 1px 4px rgba(0,0,0,.3); }
  .mkCols { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 22px; }
  /* the thermostat circle (as on 🌡 Klima) */
  .mkDial { position: relative; width: 210px; height: 190px; margin: 0 auto; }
  .mkDial svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .mkDial .mid { position: absolute; inset: 40px 0 0; display: flex; flex-direction: column; align-items: center; }
  .mkDial .mid small { color: var(--muted); font-size: 12px; font-weight: 700; }
  .mkDial .mid .t { font-size: 46px; font-weight: 800; letter-spacing: -.03em; line-height: 1.05; } .mkDial .mid .t sup { font-size: 22px; }
  .mkDial .mid .now { color: var(--muted); font-size: 13px; font-weight: 600; margin-top: 2px; }
  .mkPause { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: rgba(63, 169, 245, .12); border: 1px solid rgba(63, 169, 245, .55); font-size: 13.5px; line-height: 1.4; }
  .mkPause b { display: block; font-size: 15px; margin-bottom: 2px; }
  /* who uses it */
  .mkUse { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 12px; background: var(--field); margin-bottom: 8px; border: 1px solid transparent; }
  .mkUse.live { border-color: rgba(70, 167, 88, .7); box-shadow: inset 4px 0 0 #46a758; }
  .mkUse.clash { border-color: rgba(245, 166, 35, .7); box-shadow: inset 4px 0 0 #f5a623; }
  .mkUse.dim { opacity: .72; }
  .mkUse .ic { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; font-size: 20px; background: var(--panel); flex: none; }
  .mkUse .tx { flex: 1; min-width: 0; } .mkUse .tx b { font-size: 15px; } .mkUse .tx .what { display: block; color: var(--muted); font-size: 13px; margin-top: 2px; }
  .mkUse .tx .row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; align-items: center; }
  .mkUse .when { color: var(--muted); font-size: 12.5px; font-weight: 600; white-space: nowrap; text-align: right; }
  .mkWarn { display: flex; gap: 12px; align-items: center; padding: 11px 14px; border-radius: 12px; background: rgba(245, 166, 35, .13); border: 1px solid rgba(245, 166, 35, .6); margin-bottom: 12px; font-size: 14px; line-height: 1.4; }
  .mkWarn .big { font-size: 24px; } .mkWarn .mkB { margin-left: auto; }
  .mkSub { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 800; margin: 14px 0 8px; display: flex; gap: 8px; align-items: center; }
  /* chains of blocks in a list */
  .mkChain { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 7px; }
  .mkChain .k { padding: 4px 9px; border-radius: 8px; font-size: 12.5px; font-weight: 700; border: 1px solid; white-space: nowrap; }
  .mkChain .k.when { background: rgba(245, 197, 66, .14); border-color: rgba(245, 197, 66, .55); color: #ffe08a; }
  .mkChain .k.and { background: rgba(63, 169, 245, .13); border-color: rgba(63, 169, 245, .5); color: #9fd6ff; }
  .mkChain .k.wait { background: rgba(166, 120, 221, .15); border-color: rgba(166, 120, 221, .55); color: #d4b5ff; }
  .mkChain .k.then { background: rgba(70, 167, 88, .15); border-color: rgba(70, 167, 88, .55); color: #9fe6ae; }
  .mkChain .ar { color: var(--muted); font-weight: 800; }
  .mkFlowRow { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; background: var(--field); margin-bottom: 9px; border: 1px solid transparent; }
  .mkFlowRow.live { border-color: rgba(70, 167, 88, .7); box-shadow: inset 4px 0 0 #46a758; }
  .mkFlowRow .tx { flex: 1; min-width: 0; } .mkFlowRow .tx b { font-size: 16px; }
  .mkFlowRow .st { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; font-size: 12.5px; color: var(--muted); font-weight: 600; white-space: nowrap; }
  .mkFlowRow .ed { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; background: var(--panel); border: 1px solid var(--line); }
  .mkLog { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid var(--line); font-size: 13.5px; line-height: 1.35; }
  .mkLog:first-of-type { border-top: 0; } .mkLog b { width: 44px; flex: none; color: var(--muted); font-size: 12.5px; padding-top: 1px; }
  .mkLog small { display: block; color: var(--muted); font-size: 12px; }
  .mkBtnRow { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
  .mkBtnRow div { border-radius: 16px; background: var(--panel); border: 1px solid var(--line); padding: 12px; text-align: center; font-weight: 800; font-size: 15px; }
  .mkBtnRow div span { display: block; font-size: 30px; margin-bottom: 4px; }
  /* heating rules */
  .mkActive { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 16px; background: rgba(63, 169, 245, .12); border: 1px solid rgba(63, 169, 245, .6); margin-bottom: 16px; }
  .mkActive .big { font-size: 34px; } .mkActive b { font-size: 18px; } .mkActive .mkMuted { font-size: 14px; }
  .mkRule { display: flex; flex-direction: column; gap: 10px; }
  .mkRule .hd { display: flex; align-items: flex-start; gap: 12px; }
  .mkRule .hd .ic { font-size: 30px; line-height: 1; } .mkRule .hd b { font-size: 17px; display: block; } .mkRule .hd small { color: var(--muted); font-size: 13px; }
  .mkRule .hd .mkSw { margin-left: auto; }
  .mkRule.off { opacity: .7; }
  .mkKV { display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; }
  .mkKV div { display: flex; gap: 10px; padding: 6px 10px; border-radius: 9px; background: var(--field); align-items: center; }
  .mkKV div span { color: var(--muted); } .mkKV div b { margin-left: auto; font-weight: 700; text-align: right; }
  .mkMini { display: grid; grid-template-columns: 44px 1fr; gap: 3px 8px; align-items: center; font-size: 11.5px; color: var(--muted); font-weight: 700; }
  .mkMini .bar { height: 12px; border-radius: 4px; display: flex; overflow: hidden; }
  /* the schedule */
  .mkWeek { display: grid; grid-template-columns: 70px 1fr; gap: 8px 12px; align-items: center; }
  .mkWeek .day { font-weight: 800; font-size: 14px; } .mkWeek .day small { display: block; color: var(--muted); font-weight: 600; font-size: 11px; }
  .mkWeek .bar { position: relative; height: 44px; border-radius: 10px; display: flex; overflow: hidden; background: var(--field); }
  .mkWeek .bar i { display: flex; align-items: center; justify-content: center; font-style: normal; font-size: 12.5px; font-weight: 800; color: rgba(255,255,255,.92); border-right: 2px solid var(--panel); }
  .mkWeek .hours { grid-column: 2; display: flex; justify-content: space-between; color: var(--muted); font-size: 11.5px; font-weight: 700; }
  .mkNow { position: absolute; top: -4px; bottom: -4px; width: 3px; background: #fff; border-radius: 2px; box-shadow: 0 0 0 2px rgba(0,0,0,.4); }
  .mkLevels { display: flex; gap: 10px; flex-wrap: wrap; }
  .mkLevels span { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 12px; background: var(--field); border: 1px solid var(--line); font-weight: 800; font-size: 14px; }
  .mkLevels span i { width: 14px; height: 14px; border-radius: 4px; } .mkLevels span em { font-style: normal; color: var(--muted); font-weight: 600; }
  /* the flow editor */
  .mkEd { display: grid; grid-template-columns: 250px minmax(0, 1fr) 290px; gap: 14px; height: 790px; }
  .mkPal { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 12px; overflow: hidden; }
  .mkPal .g { font-size: 11.5px; text-transform: uppercase; letter-spacing: .07em; font-weight: 800; margin: 10px 2px 6px; display: flex; align-items: center; gap: 6px; }
  .mkPal .g:first-child { margin-top: 0; } .mkPal .g i { width: 10px; height: 10px; border-radius: 3px; }
  .mkPal .it { display: flex; align-items: center; gap: 8px; padding: 6px 9px; border-radius: 9px; background: var(--field); margin-bottom: 4px; font-size: 13px; font-weight: 600; border-left: 3px solid; }
  .mkCanvas { position: relative; border-radius: 16px; border: 1px solid var(--line); overflow: hidden;
    background: radial-gradient(circle, color-mix(in srgb, var(--muted) 35%, transparent) 1px, transparent 1.2px) 0 0 / 22px 22px, color-mix(in srgb, var(--panel) 70%, #000); }
  .mkCanvas svg.wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .mkLane { position: absolute; left: 14px; font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; }
  .mkBlk { position: absolute; width: 196px; border-radius: 14px; background: var(--panel); border: 1px solid var(--line); box-shadow: 0 8px 22px rgba(0,0,0,.35); overflow: visible; }
  .mkBlk .h { padding: 6px 11px; font-size: 10.5px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; border-radius: 13px 13px 0 0; color: #1b1b1b; }
  .mkBlk .b { padding: 8px 11px 10px; font-size: 14px; font-weight: 700; line-height: 1.3; }
  .mkBlk .b small { display: block; color: var(--muted); font-weight: 600; font-size: 12px; margin-top: 2px; }
  .mkBlk .p { position: absolute; top: 50%; width: 12px; height: 12px; margin-top: -6px; border-radius: 50%; background: var(--panel); border: 2px solid #8b98a5; }
  .mkBlk .p.l { left: -7px; } .mkBlk .p.r { right: -7px; }
  .mkBlk.when .h { background: #f5c542; } .mkBlk.and .h { background: #6cbcf5; } .mkBlk.wait .h { background: #b892e8; } .mkBlk.then .h { background: #5cc472; }
  .mkBlk.sel { outline: 3px solid var(--accent); outline-offset: 3px; }
  .mkBlk .live { position: absolute; top: -12px; right: 10px; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 800; }
  .mkBlk .live.ok { background: #2f7d40; color: #fff; } .mkBlk .live.wt { background: #6b4fa0; color: #fff; }
  .mkBlk.waiting { box-shadow: 0 0 0 3px rgba(184, 146, 232, .55), 0 8px 22px rgba(0,0,0,.35); }
  .mkPlus { position: absolute; width: 196px; height: 54px; border-radius: 14px; border: 2px dashed color-mix(in srgb, var(--accent) 55%, transparent); color: var(--accent);
    display: grid; place-items: center; font-weight: 800; font-size: 13px; background: color-mix(in srgb, var(--accent) 6%, transparent); }
  .mkWords { position: absolute; left: 14px; right: 14px; bottom: 14px; padding: 12px 16px; border-radius: 14px; background: var(--panel); border: 1px solid var(--line); font-size: 15px; line-height: 1.5; }
  .mkWords small { display: block; font-size: 11.5px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .mkProps { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .mkProps h5 { margin: 0; font-size: 16px; display: flex; gap: 8px; align-items: center; }
  .mkF { display: flex; flex-direction: column; gap: 6px; } .mkF > label { font-size: 12.5px; color: var(--muted); font-weight: 800; }
  .mkIn { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .mkIn small { color: var(--muted); margin-left: auto; font-size: 12px; }
  .mkTop { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .mkTop .name { font-size: 22px; font-weight: 800; padding: 6px 12px; border-radius: 10px; background: var(--field); border: 1px solid var(--line); }
  /* in the house */
  .mkTag { position: fixed; z-index: 60; transform: translate(-50%, -100%); padding: 10px 14px; border-radius: 14px; background: rgba(18, 28, 40, .92); border: 2px solid #3fa9f5;
    color: #fff; font-size: 14px; line-height: 1.35; box-shadow: 0 12px 30px rgba(0,0,0,.5); white-space: nowrap; }
  .mkTag b { font-size: 16px; } .mkTag small { display: block; color: #b9c7d4; font-size: 12.5px; }
  .mkTag::after { content: ''; position: absolute; left: 50%; bottom: -10px; margin-left: -9px; border: 9px solid transparent; border-bottom: 0; border-top-color: #3fa9f5; }
  `;
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  function setup() {
    if (!document.getElementById('mk427css')) { const s = document.createElement('style'); s.id = 'mk427css'; s.textContent = css; document.head.append(s); }
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
  /** a window over the real page of a tab */
  function modal(tab, html) {
    setup();
    document.querySelector(`#tabBar [data-tab=${tab}]`)?.click();
    document.querySelector('.mkModal')?.remove();
    const m = el(`<div class="mkModal"><div class="mkBox">${html}</div></div>`);
    document.body.append(m);
    return m;
  }
  const note = (p, text, style) => { const n = el(`<div class="mkNote" style="${style}">${text}</div>`); p.append(n); };
  const sw = (on) => `<span class="mkSw${on ? ' on' : ''}"></span>`;
  const chain = (parts) => `<div class="mkChain">${parts.map(([k, t]) => `<span class="k ${k}">${t}</span>`).join('<span class="ar">→</span>')}</div>`;

  /* ---- the thermostat circle, as on 🌡 Klima (4.9.0) ---- */
  function arc(cx, cy, r, a0, a1) {
    const rad = (a) => (a * Math.PI) / 180, p = (a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  function dial({ cur, target, paused = false, min = 7, max = 30 }) {
    const cx = 105, cy = 100, r = 86, ang = (v) => 135 + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 270;
    const pt = (v) => [cx + r * Math.cos((ang(v) * Math.PI) / 180), cy + r * Math.sin((ang(v) * Math.PI) / 180)];
    const [kx, ky] = pt(target), [ix, iy] = pt(cur), fmt = (v) => v.toLocaleString('de', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `<div class="mkDial"><svg viewBox="0 0 210 190">
      <defs><linearGradient id="mk427Heat" x1="0" x2="1"><stop offset="0" stop-color="#ffcf5a"/><stop offset="1" stop-color="#ff5b2e"/></linearGradient></defs>
      <path d="${arc(cx, cy, r, 135, 405)}" stroke="var(--field)" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="${arc(cx, cy, r, 135, ang(target))}" stroke="${paused ? '#5b7a96' : 'url(#mk427Heat)'}" stroke-width="16" fill="none" stroke-linecap="round" ${paused ? 'stroke-dasharray="6 7"' : ''}/>
      <circle cx="${ix}" cy="${iy}" r="4" fill="#fff" opacity=".85"/>
      <circle cx="${kx}" cy="${ky}" r="13" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    </svg><div class="mid"><small>${paused ? '⏸️ pausiert' : 'Soll'}</small><div class="t">${fmt(target)}<sup>°</sup></div><div class="now">jetzt ${fmt(cur)}°</div></div></div>`;
  }

  /* ---- 1: who uses this thermostat ---- */
  function usedBy() {
    const use = (cls, ic, name, kind, what, chips, when, ctl) => `<div class="mkUse ${cls}"><span class="ic">${ic}</span>
      <div class="tx"><b>${name}</b> ${kind}<span class="what">${what}</span>${chips ? `<div class="row">${chips}</div>` : ''}</div>
      <div class="when">${when}</div>${ctl}</div>`;
    const FP = '<span class="mkChip fp">im Dashboard</span>', HA = '<span class="mkChip ha">Home Assistant</span>';
    const m = modal('climate', `<div class="mkBoxH"><h3>🌡 Wohnzimmer · Thermostat</h3>
        <div class="mkTabs"><span>Steuern</span><span class="on">🔎 Wird benutzt (6)</span><span>📜 Verlauf</span></div><span class="x">✕</span></div>
      <div class="mkCols">
        <div>${dial({ cur: 21.2, target: 22, paused: true })}
          <div class="mkPause"><b>⏸️ Heizung pausiert</b>Fenster Wohnzimmer seit 3 Min offen. Sobald es zu ist, heizt sie wieder auf 22,0°.<div style="margin-top:8px"><span class="mkB small">🔥 Trotzdem heizen</span></div></div>
          <div class="mkSub" style="margin-top:16px">Das Thermostat kann selbst</div>
          <div class="mkUse dim" style="margin:0"><span class="ic">🪟</span><div class="tx"><b>Fenster-offen-Erkennung</b><span class="what">im Thermostat eingebaut · aus</span></div></div>
        </div>
        <div>
          <div class="mkWarn"><span class="big">⚠️</span><div><b>Zwei Regeln stellen morgens die Temperatur.</b><br>„Heizplan Wohnzimmer“ (Dashboard) und „Heizung morgens hoch“ (Home Assistant) streiten sich um 6:00 Uhr.</div><span class="mkB">Die in Home Assistant ausschalten</span></div>
          ${use('live', '🪟', 'Fenster offen → Heizung aus', FP, 'Fenster 2 Min offen → Heizung aus, wieder zu → wie vorher', '<span class="mkChip run">läuft gerade · seit 07:44</span>', 'zuletzt heute 07:44', sw(true))}
          ${use('clash', '📅', 'Heizplan Wohnzimmer', FP, 'Mo–Fr 6:00 21° · 22:30 17° · Sa–So 8:00 21°', '<span class="mkChip warn">⚠ gleiche Zeit wie „Heizung morgens hoch“</span>', 'zuletzt heute 06:00', sw(true))}
          ${use('clash', '⚙️', 'Heizung morgens hoch', HA, 'Automation: werktags um 6:00 → Wohnzimmer 22°', '<span class="mkChip warn">⚠ gleiche Zeit wie der Heizplan</span>', 'zuletzt heute 06:00', sw(true))}
          ${use('dim', '⚙️', 'Heizung aus, wenn alle weg', HA, 'Automation: alle Personen weg → Wohnzimmer aus', '<span class="mkChip off">ausgeschaltet</span>', 'zuletzt vor 4 Tagen', sw(false))}
          ${use('', '📜', 'Guten Morgen', HA, 'Skript: Rollläden hoch, Radio an, Wohnzimmer 22°', '', 'zuletzt heute 06:30', '<span class="mkB small">▶ Start</span>')}
          ${use('', '🎨', 'Gute Nacht', HA, 'Szene: alle Lichter aus, Wohnzimmer 17°', '', 'zuletzt gestern 23:05', '<span class="mkB small">▶ Start</span>')}
        </div>
      </div>`);
    m.querySelector('.mkTabs').style.marginLeft = '24px';
    note(m, 'Wer steuert dieses Thermostat? Grün = läuft gerade, Orange = zwei Regeln streiten sich. Ein- und ausschalten gleich hier', 'left: 40px; bottom: 90px; max-width: 360px');
  }

  /* ---- 2: the page ▶ Abläufe with own routines and the automations of Home Assistant ---- */
  function routines() {
    const flow = (cls, on, name, parts, st) => `<div class="mkFlowRow ${cls}">${sw(on)}<div class="tx"><b>${name}</b>${chain(parts)}</div><div class="st">${st}</div><span class="ed">✏️</span></div>`;
    const auto = (cls, on, name, uses, st) => `<div class="mkFlowRow ${cls}">${sw(on)}<div class="tx"><b>${name}</b><div class="mkMuted" style="margin-top:4px">benutzt: ${uses}</div></div><div class="st">${st}</div><span class="ed">ⓘ</span></div>`;
    const p = page('routines', `<div class="tpHead"><h2>▶️ Abläufe</h2><span class="tpSub">ein Tipp, alles passiert</span></div>
      <div class="mkBtnRow"><div><span>🚪</span>Ich gehe</div><div><span>🌙</span>Gute Nacht</div><div><span>🎬</span>Filmabend</div><div><span>☀️</span>Guten Morgen</div><div><span>🎨</span>Wohnzimmer Aus</div><div><span>🛋️</span>Gemütlich</div></div>
      <div class="mkGrid">
        <div class="mkC mkS2"><h4>🏠 Eigene Abläufe <span class="r tpSub">laufen im Add-on, auch ohne offenen Bildschirm</span></h4>
          <div style="display:flex;gap:8px;margin:-2px 0 12px"><span class="mkB blue">＋ Neuer Ablauf</span><span class="mkB">📋 Aus Vorlage</span>
            <span style="margin-left:auto" class="mkSeg"><span class="on">Alle</span><span>🌡 Heizung</span><span>💡 Licht</span><span>🪟 Rollläden</span><span>▶ läuft</span></span></div>
          ${flow('live', true, 'Fenster offen → Heizung aus', [['when', '🪟 Fenster geht auf'], ['wait', '⏱ 2 Min offen'], ['then', '🔥 Heizung im Raum aus']], '<span class="mkChip run">läuft · Wohnzimmer</span>seit 07:44')}
          ${flow('', true, 'Heizplan', [['when', '🕐 nach Plan'], ['and', '🏠 jemand zu Hause'], ['then', '🔥 6 Räume']], 'zuletzt heute 06:00')}
          ${flow('', true, 'Flurlicht nachts', [['when', '🏃 Bewegung Flur'], ['and', '🌙 nach Sonnenuntergang'], ['then', '💡 Flurlicht 20 %'], ['wait', '⏱ 2 Min'], ['then', '💡 aus']], 'zuletzt vor 12 Min')}
          ${flow('', true, 'Rollläden am Abend', [['when', '🌇 Sonnenuntergang'], ['then', '🪟 Rollläden unten (5)']], 'zuletzt gestern 17:31')}
          ${flow('', false, 'Waschmaschine fertig', [['when', '🧺 Waschmaschine fertig'], ['and', '🏠 Anna zu Hause'], ['then', '🔔 Nachricht an Anna']], '<span class="mkChip off">aus</span>')}
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="mkC"><h4>⚙️ Automationen in Home Assistant <span class="r tpSub">an / aus</span></h4>
            ${auto('', true, 'Flurlicht Bewegung', '🏃 Flur · 💡 Flurlicht', '<span class="mkChip run">läuft gerade</span>')}
            ${auto('', true, 'Heizung morgens hoch', '🌡 Wohnzimmer · Küche', '<span class="mkChip warn">⚠ wie Heizplan</span>')}
            ${auto('', true, 'Rollladen abends', '🪟 Wohnzimmer · Küche', 'gestern 17:30')}
            ${auto('', false, 'Urlaub Licht', '💡 Wohnzimmer · Küche · Flur', 'vor 3 Wochen')}</div>
          <div class="mkC"><h4>📜 Was ist passiert <span class="r tpSub">heute</span></h4>
            <div class="mkLog"><b>07:44</b><div>🔥 Heizung Wohnzimmer <b>aus</b><small>Fenster offen → Heizung aus</small></div></div>
            <div class="mkLog"><b>07:42</b><div>🪟 Fenster Wohnzimmer <b>auf</b><small>Ablauf wartet 2 Min</small></div></div>
            <div class="mkLog"><b>07:31</b><div>💡 Flurlicht <b>20 %</b>, 07:33 aus<small>Flurlicht nachts</small></div></div>
            <div class="mkLog"><b>06:00</b><div>🔥 Wohnzimmer <b>21°</b>, Küche 20°<small>Heizplan</small></div></div>
          </div>
        </div>
      </div>`);
    p.querySelector('.mkS2').append(el('<span class="mkNew">neu</span>'));
    p.querySelectorAll('.mkC')[1].querySelectorAll('.mkFlowRow').forEach((r) => { r.style.padding = '9px 10px'; r.style.gap = '10px'; });
    note(p, 'Eigene Abläufe als Kette zum Lesen. Daneben die Automationen von Home Assistant mit „läuft gerade“ und was sie benutzen, darunter was heute passiert ist', 'left: 40px; top: 745px; max-width: 700px');
  }

  /* ---- 3: heating rules on 🌡 Klima ---- */
  function rules() {
    const rule = (cls, ic, name, sub, on, kv, extra = '') => `<div class="mkC mkRule ${cls}"><div class="hd"><span class="ic">${ic}</span><div><b>${name}</b><small>${sub}</small></div>${sw(on)}</div>
      <div class="mkKV">${kv.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>${extra}</div>`;
    const mini = [['Mo–Fr', [[25, '#2e5f8f'], [12, '#ff8c32'], [30, '#3fa9f5'], [27, '#ff8c32'], [6, '#2e5f8f']]], ['Sa–So', [[33, '#2e5f8f'], [61, '#ff8c32'], [6, '#2e5f8f']]]];
    const p = page('climate', `<div class="tpHead"><h2>🌡️ Klima</h2><span class="tpSub">draußen 14,0°</span>
        <div class="peChips" style="margin-left:auto"><span class="tpChip">Räume</span><span class="tpChip on">📋 Heiz-Regeln</span><span class="tpChip">📅 Heizplan</span></div></div>
      <div class="mkActive"><span class="big">⏸️</span><div><b>Gerade aktiv: Wohnzimmer pausiert</b><div class="mkMuted">Fenster Wohnzimmer seit 3 Min offen · die Heizung ist aus · wenn es zu ist, wieder 22,0°</div></div>
        <span class="mkB" style="margin-left:auto">🔥 Trotzdem heizen</span></div>
      <div class="mkGrid">
        ${rule('', '🪟', 'Fenster offen → Heizung aus', 'die Fenster und Türen jedes Raums', true, [['wenn offen länger als', '2 Min'], ['danach', 'zurück wie vorher'], ['Räume', '5 von 6 (Bad: Thermostat kann es selbst)']], '<div><span class="mkChip run">aktiv im Wohnzimmer</span></div>')}
        ${rule('', '🚶', 'Keiner zu Hause → kühler', 'alle Personen weg', true, [['nach', '30 Min'], ['dann', 'Eco 17°'], ['zurück', 'sobald jemand kommt']], '<div class="mkMuted">zuletzt heute 08:10 bis 11:02</div>')}
        ${rule('', '🌙', 'Nachtabsenkung', 'jede Nacht', true, [['von – bis', '22:30 – 6:00'], ['Temperatur', '17°'], ['Schlafzimmer', '16°']])}
        ${rule('', '📅', 'Heizplan', 'eigene Zeiten je Raum und Tag', true, [['Räume mit Plan', '4']],
          `<div class="mkMini">${mini.map(([d, parts]) => `<span>${d}</span><span class="bar">${parts.map(([w, c]) => `<i style="width:${w}%;background:${c}"></i>`).join('')}</span>`).join('')}</div>`)}
        ${rule('off', '☀️', 'Sommerpause', 'nach dem Wetter', false, [['Heizung aus, wenn draußen über', '18°'], ['für mindestens', '2 Tage']])}
        ${rule('', '🚀', 'Boost-Knopf', 'auf jeder Raumkarte', true, [['volle Wärme für', '30 Min'], ['danach', 'zurück wie vorher']])}
        ${rule('off', '✈️', 'Urlaub', 'mit dem Urlaubs-Alarm', false, [['alle Räume', '15°'], ['am letzten Tag vorheizen', 'ab 14:00']])}
        <div class="mkC" style="display:grid;place-items:center;min-height:170px;border:2px dashed color-mix(in srgb, var(--accent) 55%, transparent);color:var(--accent);font-weight:800;font-size:16px;text-align:center">＋ Eigene Regel<br><span class="mkMuted" style="font-weight:600">„Wenn … dann …“ mit Bausteinen</span></div>
      </div>`);
    p.querySelectorAll('.mkRule')[0].append(el('<span class="mkNew">neu</span>'));
    note(p, 'Fertige Heiz-Regeln zum Einschalten, die Zahlen antippen zum Ändern. Läuft im Add-on, Home Assistant braucht dafür keine Automation', 'right: 30px; bottom: 90px; max-width: 420px');
  }

  /* ---- 4: the schedule of a room ---- */
  function schedule() {
    const L = { n: ['💤 Nacht', '#2e5f8f'], e: ['🌙 Eco', '#3fa9f5'], k: ['☀️ Komfort', '#ff8c32'] };
    const T = { n: '17°', e: '19°', k: '21°' };
    const day = (d, sub, parts, now) => `<div class="day">${d}${sub ? `<small>${sub}</small>` : ''}</div><div class="bar">${parts.map(([h, l]) => `<i style="width:${(h / 24) * 100}%;background:${L[l][1]}">${h >= 2 ? T[l] : ''}</i>`).join('')}${now != null ? `<span class="mkNow" style="left:${(now / 24) * 100}%"></span>` : ''}</div>`;
    const work = [[6, 'n'], [2, 'k'], [7.5, 'e'], [7, 'k'], [1.5, 'n']], home = [[8, 'n'], [14.5, 'k'], [1.5, 'n']];
    const m = modal('climate', `<div class="mkBoxH"><h3>📅 Heizplan</h3>
        <div class="mkSeg" style="margin-left:18px"><span class="on">Wohnzimmer</span><span>Küche</span><span>Schlafzimmer</span><span>Kinderzimmer</span><span>Bad</span><span>Gästezimmer</span></div><span class="x">✕</span></div>
      <div class="mkLevels" style="margin-bottom:16px">${Object.keys(L).map((k) => `<span><i style="background:${L[k][1]}"></i>${L[k][0]} <em>${T[k]}</em> ✏️</span>`).join('')}
        <span style="margin-left:auto"><i style="background:#8b98a5"></i>Vorheizen <em>30 Min vorher</em></span></div>
      <div class="mkWeek">
        ${day('Mo', '', work)}${day('Di', '', work)}${day('Mi', 'heute', work, 7.73)}${day('Do', '', work)}${day('Fr', '', [[6, 'n'], [2, 'k'], [7.5, 'e'], [8, 'k'], [0.5, 'n']])}
        ${day('Sa', '', home)}${day('So', '', home)}
        <div class="hours">${[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => `<span>${h}:00</span>`).join('')}</div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap">
        <span class="mkB">⧉ Tag kopieren</span><span class="mkB">Mo–Fr gleich</span><span class="mkB">Für alle Räume übernehmen</span>
        <span class="mkMuted" style="margin-left:12px">Jetzt: ☀️ Komfort 21° bis 8:00, dann 🌙 Eco 19° (gerade pausiert: Fenster offen)</span>
        <span class="mkB blue" style="margin-left:auto">✓ Speichern</span></div>
      <div class="mkMuted" style="margin-top:10px">Fenster offen, keiner zu Hause und Urlaub gehen vor dem Plan. Mit dem Finger einen Block ziehen: Zeit ändern · antippen: andere Stufe.</div>`);
    note(m, 'Ein Plan pro Raum: Blöcke über den Tag ziehen, drei Stufen mit eigenen Temperaturen', 'left: 40px; bottom: 60px; max-width: 360px');
  }

  /* ---- 5: building an own routine from blocks, like a Node-RED flow ---- */
  function editor() {
    const blk = (cls, x, y, head, body, extra = '') => `<div class="mkBlk ${cls}" style="left:${x}px;top:${y}px"><div class="h">${head}</div><div class="b">${body}</div>
      ${cls.includes('when') ? '' : '<span class="p l"></span>'}<span class="p r"></span>${extra}</div>`;
    const W = 196, H = 74, link = ([x0, y0], [x1, y1], col) => { const a = [x0 + W, y0 + H / 2], b = [x1, y1 + H / 2], dx = Math.max(40, (b[0] - a[0]) / 2);
      return `<path d="M${a[0]} ${a[1]} C${a[0] + dx} ${a[1]} ${b[0] - dx} ${b[1]} ${b[0]} ${b[1]}" stroke="${col}" stroke-width="3" fill="none" opacity=".9"/>`; };
    const P = { w1: [34, 60], a1: [272, 60], a2: [510, 60], t1: [748, 30], t2: [748, 140], w2: [34, 330], t3: [272, 330], a3: [272, 450], t4: [510, 450] };
    const pal = (g, col, items) => `<div class="g" style="color:${col}"><i style="background:${col}"></i>${g}</div>${items.map((t) => `<div class="it" style="border-left-color:${col}">${t}</div>`).join('')}`;
    const p = page('routines', `<div class="mkTop"><span class="mkB">‹ Abläufe</span><span class="name">Fenster offen → Heizung aus</span>${sw(true)}<span class="mkMuted">an</span>
        <span style="margin-left:auto" class="mkB">📜 Verlauf</span><span class="mkB">▶ Jetzt ausprobieren</span><span class="mkB blue">✓ Speichern</span></div>
      <div class="mkEd">
        <div class="mkPal">
          ${pal('Wenn … (Auslöser)', '#f5c542', ['🪟 Fenster / Tür geht auf', '🏃 Bewegung', '🕐 Uhrzeit', '🌅 Sonne geht auf / unter', '👤 Jemand kommt / geht', '💡 Gerät geht an / aus', '🔘 Knopf im Dashboard'])}
          ${pal('Und … (nur wenn)', '#6cbcf5', ['🕐 Zwischen zwei Zeiten', '📅 Wochentag', '🏠 Jemand zu Hause', '🌡 Draußen kälter als'])}
          ${pal('Warten', '#b892e8', ['⏱ So lange noch so'])}
          ${pal('Dann … (Aktion)', '#5cc472', ['🔥 Heizung / Temperatur', '💡 Schalten, dimmen', '🪟 Rollladen', '🔔 Nachricht schicken', '↩ Wie vorher'])}
        </div>
        <div class="mkCanvas">
          <svg class="wires">${link(P.w1, P.a1, '#f5c542')}${link(P.a1, P.a2, '#b892e8')}${link(P.a2, P.t1, '#6cbcf5')}${link(P.a2, P.t2, '#6cbcf5')}${link(P.w2, P.t3, '#f5c542')}${link(P.w2, P.a3, '#f5c542')}${link(P.a3, P.t4, '#b892e8')}</svg>
          <span class="mkLane" style="top:24px">Wenn das Fenster aufgeht</span><span class="mkLane" style="top:294px">Wenn es wieder zugeht</span>
          ${blk('when', ...P.w1, 'Wenn', '🪟 Fenster geht auf<small>jedes Fenster eines Raums mit Heizung</small>', '<span class="live ok">✓ 07:42</span>')}
          ${blk('wait sel', ...P.a1, 'Warten', '⏱ bleibt offen<small>2 Minuten</small>', '<span class="live ok">✓ 07:44</span>')}
          ${blk('and', ...P.a2, 'Nur wenn', '🌡 draußen kälter als<small>15 ° (jetzt 14,0 °)</small>', '<span class="live ok">✓</span>')}
          ${blk('then', ...P.t1, 'Dann', '🔥 Heizung im selben Raum<small>aus · den Wert merken</small>', '<span class="live ok">✓ 07:44</span>')}
          ${blk('then', ...P.t2, 'Dann', '🔔 Nachricht<small>„Fenster {Raum} offen, Heizung aus“</small>')}
          ${blk('when', ...P.w2, 'Wenn', '🪟 Fenster geht zu<small>das gleiche Fenster</small>')}
          ${blk('then', ...P.t3, 'Dann', '↩ Heizung wie vorher<small>22,0 ° im Wohnzimmer</small>')}
          ${blk('wait waiting', ...P.a3, 'Warten', '⏱ bleibt offen<small>1 Stunde</small>', '<span class="live wt">⏳ noch 57 Min</span>')}
          ${blk('then', ...P.t4, 'Dann', '🔔 Erinnerung<small>„Fenster {Raum} ist noch offen“</small>')}
          <div class="mkPlus" style="left:986px;top:40px">＋ Baustein</div>
          <div class="mkWords"><small>In Worten</small>Wenn ein Fenster <b>2 Minuten offen</b> ist und es draußen <b>kälter als 15°</b> ist, geht die Heizung in diesem Raum <b>aus</b> und du bekommst eine Nachricht. Wenn es wieder <b>zu</b> ist, heizt sie <b>wie vorher</b>. Ist es nach einer Stunde noch offen, kommt eine Erinnerung.</div>
        </div>
        <div class="mkProps"><h5>⏱ Baustein „Warten“</h5>
          <div class="mkF"><label>So lange muss es so bleiben</label><div class="mkSeg"><span>30 s</span><span>1 Min</span><span class="on">2 Min</span><span>5 Min</span><span>10 Min</span><span>eigene …</span></div></div>
          <div class="mkF"><label>Was gilt</label><div class="mkIn">🪟 das Fenster bleibt offen</div></div>
          <div class="mkF"><label>Wenn es vorher zugeht</label><div class="mkSeg"><span class="on">nichts tun</span><span>trotzdem weiter</span></div></div>
          <div class="mkF"><label>Gerade</label><div class="mkIn">✓ Wohnzimmer: 07:42 auf, 07:44 weiter<small>vor 3 Min</small></div></div>
          <div style="margin-top:auto;display:flex;gap:8px"><span class="mkB">⧉ Kopieren</span><span class="mkB">🗑 Entfernen</span></div>
        </div>
      </div>`);
    note(p, 'Bausteine links antippen und verbinden wie bei Node-RED. Grün: was gerade gelaufen ist, lila: wartet. Unten steht der Ablauf in einfachen Worten', 'right: 40px; top: 560px; max-width: 250px');
  }

  /* ---- 6: in the house: the paused heating at the radiator ---- */
  function house(id) {
    setup();
    document.querySelector('#tabBar [data-tab=house]')?.click();
    document.querySelectorAll('.mkTag').forEach((t) => t.remove());
    const at = window.__fp.screenOf(id);
    if (!at) return false;
    const tag = el(`<div class="mkTag" style="left:${at.x}px;top:${at.y - 34}px"><b>⏸️ Heizung pausiert</b><small>🪟 Fenster offen seit 3 Min · danach wieder 22,0°</small></div>`);
    document.body.append(tag);
    return true;
  }

  return { usedBy, routines, rules, schedule, editor, house };
})();
