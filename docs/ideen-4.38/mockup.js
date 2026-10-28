/* Example pictures for room sensors of the thermostats (wish of the owner, 2026-10-28: "jedem Thermostat einfach einen Temperatursensor
 * gebe … wie bei Better Thermostat … dass die ganzen Heizungsdinger … diese Temperatur … von dem Temperatursensor … angezeigt werden";
 * his choice: the add-on regulates itself, with every kind of thermostat, Matter too). Injected into the demo by make_pictures.py; it
 * only paints, nothing is saved:
 *   mkRf.rules()    🌡 Klima → 📋 Heiz-Regeln with the new card "🌡 Raumfühler": every thermostat with its sensor and how it is regulated
 *   mkRf.picker()   the same with the window to choose a sensor (the ones of the same room first) and how to regulate
 *   mkRf.climate()  🌡 Klima → Räume: the living room's circle shows the sensor's temperature, below what the thermostat measures */
window.mkRf = (() => {
  const css = `
.rfCard { grid-column: 1 / -1; }
.rfIntro { margin: 2px 0 10px; color: var(--muted); font-size: 13.5px; line-height: 1.45; max-width: 980px; }
.rfTable { display: grid; grid-template-columns: minmax(220px, 1.1fr) minmax(250px, 1.2fr) 120px minmax(300px, 1.6fr); gap: 6px 14px; align-items: center; }
.rfTable > .rfTh { font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; padding: 0 4px 2px; }
.rfRow { display: contents; }
.rfRow > div { background: color-mix(in srgb, var(--field) 55%, transparent); border-radius: 10px; padding: 9px 12px; min-height: 44px; display: flex; align-items: center; gap: 8px; }
.rfName { flex-direction: column; align-items: flex-start !important; justify-content: center; gap: 1px !important; }
.rfName b { font-size: 14.5px; }
.rfName small { color: var(--muted); font-size: 12px; }
.rfPick { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; border: 1px solid var(--line); border-radius: 9px; padding: 6px 10px;
  background: var(--panel); color: var(--text); font: inherit; font-size: 13.5px; cursor: pointer; }
.rfPick b { font-variant-numeric: tabular-nums; }
.rfPick.none { color: var(--muted); border-style: dashed; }
.rfPick::after { content: '▾'; color: var(--muted); margin-left: 4px; }
.rfMeas { justify-content: flex-end; font-variant-numeric: tabular-nums; }
.rfMeas b { font-size: 15px; }
.rfMeas small { color: var(--muted); font-size: 11.5px; }
.rfHow { flex-wrap: wrap; }
.rfWay { border-radius: 999px; padding: 3px 10px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.rfWay.cal { background: color-mix(in srgb, #3fb950 20%, transparent); color: #7ee2a8; }
.rfWay.shift { background: color-mix(in srgb, #ff8c32 22%, transparent); color: #ffb578; }
.rfWay.own { background: color-mix(in srgb, var(--muted) 18%, transparent); color: var(--muted); }
.rfHow .tpSub { font-size: 12.5px; }
.rfSug { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--muted); }
.rfSug .bdBtn { padding: 4px 10px; font-size: 12.5px; }
.rfFoot { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.rfLegend { display: flex; gap: 22px; margin-top: 12px; font-size: 12.5px; color: var(--muted); line-height: 1.45; }
.rfLegend > div { flex: 1; }
.rfDlgBack { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 50; display: flex; align-items: center; justify-content: center; }
.rfDlg { width: 640px; max-height: 88vh; overflow: auto; background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 18px 22px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
.rfDlg h3 { margin: 0 0 2px; font-size: 19px; }
.rfDlg .rfSearch { width: 100%; box-sizing: border-box; margin: 12px 0 8px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font: inherit; }
.rfSec { font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin: 12px 0 4px; }
.rfOpt { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; border: 1px solid transparent; }
.rfOpt + .rfOpt { margin-top: 3px; }
.rfOpt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.rfOpt .rfIc { width: 24px; text-align: center; }
.rfOpt .rfTxt { flex: 1; display: flex; flex-direction: column; }
.rfOpt .rfTxt small { color: var(--muted); font-size: 11.5px; }
.rfOpt b.v { font-variant-numeric: tabular-nums; }
.rfTag { font-size: 11px; border-radius: 999px; padding: 2px 8px; background: color-mix(in srgb, var(--accent) 22%, transparent); color: var(--text); }
.rfWays { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.rfWays .rfOpt { border-color: var(--line); margin: 0; }
.rfWays .rfOpt.on { border-color: var(--accent); }
.rfNote { margin-top: 8px; font-size: 12.5px; color: var(--muted); line-height: 1.45; padding: 8px 10px; border-radius: 10px; background: color-mix(in srgb, #3fb950 10%, transparent); }
.rfBtns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.clRf { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 2px 0 6px; font-size: 12.5px; color: var(--muted); justify-content: center; }
.clRf .rfWay { font-size: 11.5px; }
`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.append(st);
  const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const page = () => document.querySelector('[data-page=climate]');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const ROWS = [
    { name: 'Heizung Wohnzimmer', where: 'Wohnzimmer · Zigbee (Zigbee2MQTT)', sensor: 'Temperatur Wohnzimmer', v: '20,5°', meas: '25,1°',
      how: '<span class="rfWay cal">🎯 Ausgleich am Thermostat</span><span class="tpSub">✓ eingestellt: −4,6°</span>' },
    { name: 'Heizung Schlafzimmer', where: 'Schlafzimmer · Homematic IP', sensor: 'Schlafzimmer Temperatur', v: '18,6°', meas: '21,0°',
      how: '<span class="rfWay shift">↕ Wunsch verschieben</span><span class="tpSub">du willst 20° → am Thermostat 22,5°</span>' },
    { name: 'Heizung Kinderzimmer', where: 'Kinderzimmer · Matter', sensor: 'Kinderzimmer Klima', v: '20,2°', meas: '23,4°',
      how: '<span class="rfWay cal">🎯 Ausgleich am Thermostat</span><span class="tpSub">✓ eingestellt: −3,2°</span>' },
    { name: 'Heizung Bad', where: 'Bad · Zigbee (ZHA)', sensor: 'Bad Temperatur', v: '22,3°', meas: '24,0°',
      how: '<span class="rfWay cal">🎯 Ausgleich am Thermostat</span><span class="tpSub">⏳ wird gerade eingestellt: −1,7°</span>' },
    { name: 'Heizung Gästezimmer', where: 'Gästezimmer · tado', sensor: null, meas: '19,8°',
      how: '<div class="rfSug">💡 Vorschlag: <b>Gästezimmer Temperatur · 17,4°</b><button class="bdBtn" type="button">＋ Übernehmen</button></div>' },
    { name: 'Klimaanlage Büro', where: 'Büro · kann heizen und kühlen', sensor: 'Büro Temperatur', v: '23,0°', meas: '24,5°',
      how: '<span class="rfWay shift">↕ Wunsch verschieben</span><span class="tpSub">du willst 21° → an der Anlage 19,5°</span>' },
  ];

  function card() {
    const c = make('div', 'tpCard hrCard rfCard');
    c.dataset.heatRule = 'sensors';
    c.innerHTML = `
<div class="hrHead"><span class="hrIc">🌡️</span><div><b>Raumfühler für die Thermostate</b><small class="tpSub">das Thermostat regelt nach der echten Raumtemperatur</small></div>
  <label class="sw" title="an / aus"><input type="checkbox" checked><span></span></label></div>
<p class="rfIntro">Ein Thermostat misst direkt am warmen Heizkörper und hört darum zu früh auf. Gib ihm einen Fühler im Raum: dann regelt das Add-on
nach dessen Temperatur (auch wenn kein Bildschirm offen ist), und überall hier steht die Temperatur vom Fühler.</p>`;
    const tb = make('div', 'rfTable');
    ['Thermostat', 'Fühler im Raum', 'misst selbst', 'So regelt das Add-on'].forEach((h, i) => tb.append(make('div', 'rfTh', h)));
    tb.lastChild.previousSibling.style.textAlign = 'right';
    ROWS.forEach((r) => {
      const row = make('div', 'rfRow');
      row.append(make('div', 'rfName', `<b>${r.name}</b><small>📍 ${r.where}</small>`));
      row.append(make('div', '', r.sensor ? `<button class="rfPick" type="button"><span>🌡 ${r.sensor}</span><b>${r.v}</b></button>`
        : '<button class="rfPick none" type="button"><span>– kein Fühler –</span></button>'));
      row.append(make('div', 'rfMeas', `<b>${r.meas}</b>`));
      row.append(make('div', 'rfHow', r.how));
      tb.append(row);
    });
    c.append(tb);
    const foot = make('div', 'hrKvs rfFoot');
    foot.innerHTML = `
<div class="hrKv"><span>Ausgleich nachstellen höchstens alle</span><span class="hrStep"><button type="button">−</button><b>10 Min</b><button type="button">+</button></span></div>
<div class="hrKv"><span>erst ab einem Unterschied von</span><span class="hrStep"><button type="button">−</button><b>0,5°</b><button type="button">+</button></span></div>
<div class="hrKv"><span>Fühler meldet sich nicht</span><b>Thermostat regelt selbst</b></div>`;
    c.append(foot);
    const leg = make('div', 'rfLegend');
    leg.innerHTML = `<div><span class="rfWay cal">🎯 Ausgleich</span> Das Thermostat hat eine Einstellung „Kalibrierung“ oder „externer Fühler“
(die meisten Zigbee- und Matter-Thermostate). Das Add-on stellt sie nach, dann zeigt auch das Thermostat selbst in Home Assistant die Raumtemperatur.</div>
<div><span class="rfWay shift">↕ Wunsch verschieben</span> Für jedes andere Thermostat: das Add-on dreht die Soll-Temperatur am Gerät etwas
höher oder tiefer, bis es im Raum so warm ist, wie du willst. Heizplan und Regeln meinen immer die Temperatur im Raum.</div>`;
    c.append(leg);
    return c;
  }

  async function openRules() {
    document.querySelector('#tabBar [data-tab=climate]').click();
    await wait(900);
    page().querySelector('[data-view=rules]').click();
    await wait(900);
  }

  async function rules() {
    await openRules();
    page().querySelector('.hrBanner')?.remove();
    const grid = page().querySelector('.hrGrid');
    grid.prepend(card());
    page().querySelector('.hrView').scrollTop = 0;
  }

  async function picker() {
    await rules();
    const back = make('div', 'rfDlgBack');
    const d = make('div', 'rfDlg');
    d.innerHTML = `
<h3>🌡 Fühler für „Heizung Gästezimmer“</h3><small class="tpSub">Thermostat im Gästezimmer · misst selbst 19,8° (am Heizkörper)</small>
<input class="rfSearch" placeholder="🔎 Sensor suchen …">
<div class="rfSec">Im selben Raum</div>
<div class="rfOpt on"><span class="rfIc">🌡</span><span class="rfTxt"><b>Gästezimmer Temperatur</b><small>sensor.gast_temp · Aqara · liegt im Plan im Gästezimmer</small></span><span class="rfTag">Vorschlag</span><b class="v">17,4°</b></div>
<div class="rfOpt"><span class="rfIc">🌡</span><span class="rfTxt"><b>Bewegungsmelder Gästezimmer Temperatur</b><small>sensor.gast_bewegung_temp · im Gästezimmer</small></span><b class="v">18,1°</b></div>
<div class="rfSec">Andere Räume</div>
<div class="rfOpt"><span class="rfIc">🌡</span><span class="rfTxt"><b>Kinderzimmer Klima</b><small>Obergeschoss</small></span><b class="v">20,2°</b></div>
<div class="rfOpt"><span class="rfIc">🌡</span><span class="rfTxt"><b>Schlafzimmer Temperatur</b><small>Erdgeschoss</small></span><b class="v">18,6°</b></div>
<div class="rfSec">So regeln</div>
<div class="rfWays">
  <div class="rfOpt on"><span class="rfIc">✨</span><span class="rfTxt"><b>Automatisch</b><small>Ausgleich, wenn das Thermostat ihn kann, sonst Wunsch verschieben</small></span></div>
  <div class="rfOpt"><span class="rfIc">🎯</span><span class="rfTxt"><b>Ausgleich am Thermostat</b><small>Kalibrierung / externer Fühler</small></span></div>
  <div class="rfOpt"><span class="rfIc">↕</span><span class="rfTxt"><b>Wunsch verschieben</b><small>geht mit jedem Thermostat</small></span></div>
  <div class="rfOpt"><span class="rfIc">👁</span><span class="rfTxt"><b>Nur anzeigen</b><small>das Thermostat regelt wie bisher selbst</small></span></div>
</div>
<div class="rfNote">✨ Automatisch heißt hier: <b>Wunsch verschieben</b>. Dieses Thermostat (tado) hat in Home Assistant keine Einstellung für einen Ausgleich.</div>
<div class="rfBtns"><button class="bdBtn" type="button">Abbrechen</button><button class="bdBtn" type="button" style="background:var(--accent);color:#04121f">✓ Übernehmen</button></div>`;
    back.append(d);
    document.body.append(back);
  }

  async function climate() {
    // the living room heats again (window shut), wants 21°; its thermostat at the radiator says 25,1°, the sensor in the room 20,5°
    const call = (e, s, data) => fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: e.split('.')[0], service: s, entity_id: e, data }) });
    await call('binary_sensor.fenster_wohnzimmer', 'turn_off', {}).catch(() => {});
    document.querySelector('#tabBar [data-tab=climate]').click();
    await wait(900);
    page().querySelector('.tpTools .tpChip:not([data-view])')?.click();
    await wait(600);
    page().querySelector('[data-room=r1] .hrLine button')?.click();
    await wait(600);
    await call('climate.wohnzimmer', 'set_hvac_mode', { hvac_mode: 'heat' });
    await call('climate.wohnzimmer', 'set_temperature', { temperature: 21 });
    await wait(1500);
  }

  /** after climate(): what the page would show (the circle's "jetzt" is the sensor's, a line says what the thermostat measures) */
  function climatePaint() {
    const c = page().querySelector('.clCard[data-room=r1]');
    if (!c) return 'no card';
    const now = c.querySelector('.thNow');
    if (now) now.textContent = 'jetzt 20,5° 🌡';
    c.querySelectorAll('.hrLine, .clWarn, .clRoomTemp').forEach((x) => x.remove());
    const badge = c.querySelector('.clBadge');
    if (badge) { badge.className = 'clBadge heating'; badge.textContent = '🔥 heizt'; }
    const line = make('div', 'clRf', '<span>🌡 Raumfühler 20,5° · am Heizkörper 25,1°</span><span class="rfWay cal">🎯 Ausgleich −4,6°</span>');
    const dial = c.querySelector('.th');
    (dial || c.firstChild).after(line);
    const dot = c.querySelector('.thNowDot');
    return { ok: true, dot: !!dot };
  }

  return { rules, picker, climate, climatePaint };
})();
