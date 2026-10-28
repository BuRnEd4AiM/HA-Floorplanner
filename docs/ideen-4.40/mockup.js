/* Example pictures for a page of its own "📜 Protokoll" (wish of the owner, 2026-10-28: "eine eigene Seite, wo alles quasi passiert …
 * wo alle Geräte verbunden sind, wo man dann auch … exportieren kann für eine Fehleranalyse … alle Geräte drin hat, die in den Plänen
 * verwendet werden"; his choice: an own tab, only admins, pictures first; contents: "Befehle des Add-ons" ticked, so both are shown).
 * Injected into the demo by make_pictures.py; it only paints, nothing is saved:
 *   mkLog.commands()  A: only what the add-on sent (heating rules, routines, scenes, buttons of the pages, room sensors) and whether it was taken
 *   mkLog.all()       B: everything that happens with the devices of the plans, with who it was, the commands and the errors among them
 *   mkLog.device()    B with a device tapped (its day on the right) and the window "Exportieren" */
window.mkLog = (() => {
  const css = `
.lgPage { padding: 18px 24px 120px; display: flex; flex-direction: column; gap: 12px; }
.lgHead { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.lgHead h2 { margin: 0; font-size: 26px; }
.lgHead .tpSub { flex: 1; }
.lgBtns { display: flex; gap: 8px; }
.lgTools { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.lgTools .lgSep { width: 1px; height: 26px; background: var(--line); margin: 0 4px; }
.lgSearch { min-width: 320px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font: inherit; font-size: 14px; }
.lgSel { padding: 7px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font: inherit; font-size: 14px; }
.lgTiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.lgTile { padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, var(--field) 70%, transparent); border: 1px solid var(--line); }
.lgTile b { display: block; font-size: 24px; font-variant-numeric: tabular-nums; }
.lgTile span { color: var(--muted); font-size: 13px; }
.lgTile.bad b { color: #ff8a7a; } .lgTile.ok b { color: #7ee2a8; }
.lgMain { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-items: start; }
.lgMain.side { grid-template-columns: minmax(0, 1fr) 380px; }
.lgTable { border-radius: 14px; border: 1px solid var(--line); overflow: hidden; background: color-mix(in srgb, var(--panel) 80%, transparent); }
.lgRow { display: grid; grid-template-columns: 82px minmax(190px, 1.1fr) minmax(220px, 1.3fr) minmax(170px, 1fr) minmax(230px, 1.3fr); gap: 12px; padding: 9px 14px;
  border-top: 1px solid var(--line); font-size: 13.5px; align-items: center; }
.lgRow.b { grid-template-columns: 82px minmax(230px, 1.3fr) minmax(200px, 1.1fr) minmax(280px, 1.6fr); }
.lgRow.th { border-top: 0; color: var(--muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; background: color-mix(in srgb, var(--field) 45%, transparent); }
.lgRow .at { color: var(--muted); font-variant-numeric: tabular-nums; }
.lgRow small { display: block; color: var(--muted); font-size: 12px; margin-top: 1px; }
.lgRow.err { background: color-mix(in srgb, #ff5a4a 9%, transparent); }
.lgRow.sel { background: color-mix(in srgb, var(--accent) 16%, transparent); box-shadow: inset 3px 0 0 var(--accent); }
.lgDay { padding: 6px 14px; font-size: 12px; color: var(--muted); border-top: 1px solid var(--line); background: color-mix(in srgb, var(--field) 30%, transparent); }
.lgOk { color: #7ee2a8; } .lgBad { color: #ff8a7a; font-weight: 600; }
.lgWho { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 3px 10px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.lgWho.addon { background: color-mix(in srgb, #3fa9f5 20%, transparent); color: #9fd3ff; }
.lgWho.auto { background: color-mix(in srgb, #b48cff 20%, transparent); color: #d4bfff; }
.lgWho.user { background: color-mix(in srgb, #3fb950 20%, transparent); color: #9fe6b4; }
.lgWho.dev { background: color-mix(in srgb, #ff8c32 20%, transparent); color: #ffc08a; }
.lgWho.err { background: color-mix(in srgb, #ff5a4a 22%, transparent); color: #ffb0a6; }
.lgSide { border-radius: 14px; border: 1px solid var(--line); padding: 14px 16px; background: color-mix(in srgb, var(--panel) 85%, transparent); display: flex; flex-direction: column; gap: 10px; }
.lgSide h3 { margin: 0; font-size: 18px; }
.lgSide .kv { display: flex; justify-content: space-between; font-size: 13.5px; } .lgSide .kv span { color: var(--muted); }
.lgBar { display: flex; height: 16px; border-radius: 6px; overflow: hidden; background: var(--field); }
.lgBar i { display: block; height: 100%; }
.lgAxis { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: -4px; }
.lgMini { font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
.lgMini div { display: flex; gap: 8px; } .lgMini .at { color: var(--muted); width: 44px; flex: none; font-variant-numeric: tabular-nums; }
.lgDlgBack { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 50; display: flex; align-items: center; justify-content: center; }
.lgDlg { width: 560px; background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 18px 22px; box-shadow: 0 20px 60px rgba(0,0,0,.5); display: flex; flex-direction: column; gap: 10px; }
.lgDlg h3 { margin: 0; font-size: 19px; }
.lgDlg .sec { font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-top: 4px; }
.lgOpts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.lgOpt { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; font-size: 13.5px; display: flex; flex-direction: column; gap: 2px; }
.lgOpt small { color: var(--muted); font-size: 11.5px; }
.lgOpt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.lgDlg .bt { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
.lgNote { font-size: 12.5px; color: var(--muted); line-height: 1.45; }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
  function page(body) {
    document.querySelectorAll('#tabBar [data-tab]').forEach((b) => b.classList.remove('active'));
    let tab = document.querySelector('#tabBar [data-tab=log]');
    if (!tab) { tab = h('<button type="button" data-tab="log"><span class="ti">📜</span>Protokoll</button>'); document.querySelector('#tabBar .tbRight').before(tab); }
    tab.classList.add('active');
    const el = document.querySelector('[data-page=routines]');
    el.innerHTML = '';
    el.append(h(`<div class="lgPage">${body}</div>`));
    el.scrollTop = 0;
  }
  const head = (sub) => `<div class="lgHead"><h2>📜 Protokoll</h2><span class="tpSub">${sub}</span>
    <div class="lgBtns"><button class="bdBtn" type="button">📋 Bericht kopieren</button><button class="bdBtn" type="button">⬇ Exportieren</button></div></div>`;
  const chips = (list, on = 0) => list.map((x, i) => `<button class="tpChip${i === on ? ' on' : ''}" type="button">${x}</button>`).join('');
  const who = (k, text) => `<span class="lgWho ${k}">${text}</span>`;

  function commands() {
    const rows = [
      ['18:54:19', '📋 Fenster-Regel', '<small>Fenster Wohnzimmer offen</small>', '🌡️ Heizung Wohnzimmer', 'Wohnzimmer', 'aus', '<span class="lgOk">✓ angenommen</span><small>das Thermostat meldet „aus“ nach 12 s</small>'],
      ['18:40:02', '👆 Tablet Flur', '<small>Seite 🌡 Klima</small>', '🌡️ Heizung Bad', 'Bad', 'Soll 22°', '<span class="lgOk">✓ angenommen</span><small>das Thermostat meldet 22° nach 40 s</small>'],
      ['18:30:00', '▶ Ablauf', '<small>„Rollläden am Abend“</small>', '🪟 Rollladen Wohnzimmer', 'Wohnzimmer', 'runter', '<span class="lgOk">✓ angenommen</span>'],
      ['18:30:00', '▶ Ablauf', '<small>„Rollläden am Abend“</small>', '🪟 Rollladen Küche', 'Küche', 'runter', '<span class="lgBad">✗ nicht angenommen</span><small>Home Assistant: Gerät nicht verfügbar</small>', 'err'],
      ['18:25:33', '🌡 Raumfühler', '<small>Küche Temperatur 21,4°</small>', '🎯 Ausgleich Heizung Wohnzimmer', 'Wohnzimmer', '−3,2°', '<span class="lgOk">✓ angenommen</span>'],
      ['18:10:33', '📋 Heizplan', '<small>Komfort ab 18:10</small>', '🌡️ Heizung Wohnzimmer', 'Wohnzimmer', 'Soll 21°', '<span class="lgOk">✓ angenommen</span><small>das Thermostat meldet 21° nach 52 s</small>'],
      ['17:58:10', '🎨 Szene', '<small>„Kinoabend“, von Anna (Handy)</small>', '💡 4 Geräte', 'Wohnzimmer', 'Licht aus, TV-LED 40 % …', '<span class="lgOk">✓ angenommen</span>'],
      ['17:45:00', '👆 Anna', '<small>Seite 🏠 Haus</small>', '💡 Deckenlampe Küche', 'Küche', 'an, 80 %', '<span class="lgOk">✓ angenommen</span>'],
      ['17:20:11', '🔘 Knopf', '<small>„Alles aus“, Tablet Flur</small>', '🔌 Kaffeemaschine', 'Küche', 'aus', '<span class="lgBad">✗ nicht angenommen</span><small>keine Antwort von Home Assistant (15 s)</small>', 'err'],
      ['17:02:40', '▶ Ablauf', '<small>„Flurlicht nachts“</small>', '💡 Stehlampe', 'Flur', 'an, 20 %', '<span class="lgOk">✓ angenommen</span>'],
      ['16:31:05', '🚀 Boost', '<small>Tablet Kinderzimmer</small>', '🌡️ Heizung Kinderzimmer', 'Kinderzimmer', 'Soll 24°', '<span class="lgOk">✓ angenommen</span>'],
    ];
    page(`${head('Alles, was das Add-on geschickt hat, und ob Home Assistant es angenommen hat · nur für Admins')}
      <div class="lgTools">${chips(['Heute', 'Gestern', 'Mo 26.10.', 'Letzte 7 Tage'])}<span class="lgSep"></span>
        ${chips(['Alle', '📋 Heiz-Regeln', '▶ Abläufe', '🎨 Szenen', '👆 Knöpfe der Seiten', '🌡 Raumfühler', '✗ Nur Fehler'])}<span class="lgSep"></span>
        <select class="lgSel"><option>Alle Räume</option></select><input class="lgSearch" placeholder="🔎 Gerät, Raum oder Ablauf suchen …"></div>
      <div class="lgTiles"><div class="lgTile"><b>142</b><span>Befehle heute</span></div><div class="lgTile ok"><b>140</b><span>✓ angenommen</span></div>
        <div class="lgTile bad"><b>2</b><span>✗ nicht angenommen</span></div><div class="lgTile"><b>🔗 seit 14:57</b><span>verbunden mit Home Assistant</span></div></div>
      <div class="lgTable"><div class="lgRow th"><span>Zeit</span><span>Wer hat es geschickt</span><span>Gerät</span><span>Befehl</span><span>Ergebnis</span></div>
        ${rows.map((r) => `<div class="lgRow${r[7] ? ` ${r[7]}` : ''}"><span class="at">${r[0]}</span><span>${r[1]}${r[2]}</span><span>${r[3]}<small>${r[4]}</small></span><span>${r[5]}</span><span>${r[6]}</span></div>`).join('')}
      </div>`);
  }

  const allRows = [
    ['18:54:31', '🌡️ Heizung Wohnzimmer', 'Wohnzimmer', 'heizen → aus', who('addon', '🤖 Add-on') + '<small>Fenster-Regel, 12 s nach dem Befehl</small>'],
    ['18:54:19', '📤 Befehl an Heizung Wohnzimmer', 'Wohnzimmer', '„aus“ ✓ angenommen', who('addon', '🤖 Add-on') + '<small>📋 Fenster-Regel: Fenster Wohnzimmer offen</small>'],
    ['18:52:19', '🪟 Fenster Wohnzimmer', 'Wohnzimmer', 'zu → offen', who('dev', '✋ am Gerät') + '<small>der Kontakt hat es gemeldet</small>'],
    ['18:48:02', '💡 Stehlampe', 'Flur', 'an → aus', who('auto', '⚙️ Automation') + '<small>„Flurlicht nachts“ in Home Assistant</small>'],
    ['18:47:10', '🔌 Kaffeemaschine', 'Küche', 'aus → an', who('user', '👤 Anna') + '<small>in Home Assistant (Handy-App)</small>'],
    ['18:40:43', '🌡️ Heizung Bad', 'Bad', 'Soll 20° → 22°', who('addon', '🤖 Add-on') + '<small>👆 Tablet Flur auf der Seite 🌡 Klima, 40 s nach dem Befehl</small>'],
    ['18:30:00', '📤 Befehl an Rollladen Küche', 'Küche', '„runter“ ✗ nicht angenommen', who('err', '⚠️ Fehler') + '<small>▶ „Rollläden am Abend“: Gerät nicht verfügbar</small>', 'err'],
    ['18:30:04', '🪟 Rollladen Wohnzimmer', 'Wohnzimmer', 'offen → zu', who('addon', '🤖 Add-on') + '<small>▶ „Rollläden am Abend“</small>'],
    ['18:12:44', '📶 Bewegungsmelder Flur', 'Flur', 'meldet sich nicht (nicht verfügbar)', who('err', '⚠️ offline') + '<small>seit 18:12, Batterie 4 %</small>', 'err'],
    ['18:10:33', '📺 Fernseher', 'Wohnzimmer', 'aus → an', who('dev', '✋ am Gerät') + '<small>oder seine Fernbedienung</small>'],
    ['17:58:10', '💡 Deckenlampe Wohnzimmer', 'Wohnzimmer', 'an → aus', who('addon', '🤖 Add-on') + '<small>🎨 Szene „Kinoabend“, von Anna</small>'],
  ];
  const allPage = (sel) => `${head('Alles, was mit den Geräten in deinen Plänen passiert, und wer es war · nur für Admins')}
      <div class="lgTools">${chips(['Heute', 'Gestern', 'Mo 26.10.', 'Letzte 7 Tage'])}<span class="lgSep"></span>
        ${chips(['Alle', '💡 Licht', '🪟 Fenster & Türen', '🌡 Heizung', '🪟 Rollläden', '🔌 Steckdosen', '📤 Befehle', '⚠️ Fehler & offline'])}<span class="lgSep"></span>
        <select class="lgSel"><option>Wer: alle</option></select><select class="lgSel"><option>Alle Räume</option></select><input class="lgSearch" placeholder="🔎 Gerät oder Raum suchen …"></div>
      <div class="lgTiles"><div class="lgTile"><b>1.284</b><span>Ereignisse heute (58 Geräte im Plan)</span></div><div class="lgTile"><b>142</b><span>📤 Befehle des Add-ons, 140 ✓</span></div>
        <div class="lgTile bad"><b>3</b><span>⚠️ Fehler oder offline</span></div><div class="lgTile"><b>🔗 seit 14:57</b><span>verbunden mit Home Assistant</span></div></div>
      <div class="lgMain${sel != null ? ' side' : ''}"><div class="lgTable"><div class="lgRow b th"><span>Zeit</span><span>Gerät</span><span>Was</span><span>Wer</span></div>
        <div class="lgDay">Heute, Mittwoch 28.10.</div>
        ${allRows.map((r, i) => `<div class="lgRow b${r[5] ? ` ${r[5]}` : ''}${i === sel ? ' sel' : ''}"><span class="at">${r[0]}</span><span>${r[1]}<small>${r[2]}</small></span><span>${r[3]}</span><span>${r[4]}</span></div>`).join('')}
      </div>${sel != null ? side() : ''}</div>`;
  function side() {
    const seg = [['#2e5f8f', 25], ['#ff8c32', 12], ['#3fa9f5', 8], ['#ff8c32', 30], ['#2e5f8f', 25]];
    return `<div class="lgSide"><h3>🌡️ Heizung Wohnzimmer</h3><span class="tpSub">climate.wohnzimmer · Zigbee2MQTT · Wohnzimmer, Erdgeschoss</span>
      <div class="kv"><span>Jetzt</span><b>aus · Soll 22° · misst 21,4°</b></div><div class="kv"><span>Heute</span><b>14 Änderungen · 9 vom Add-on</b></div>
      <div class="kv"><span>Befehle</span><b>9 ✓ · 0 ✗</b></div><div class="kv"><span>Wird benutzt von</span><b>Fenster-Regel, Heizplan, 🌡 Raumfühler</b></div>
      <div class="lgBar">${seg.map(([c, w]) => `<i style="background:${c};width:${w}%"></i>`).join('')}</div><div class="lgAxis"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
      <div class="lgMini"><div><span class="at">18:54</span><span>heizen → aus · 🤖 Fenster-Regel</span></div><div><span class="at">18:11</span><span>Soll 23° → 21° · 🤖 Heizplan (nach ✋, 10 Min)</span></div>
        <div><span class="at">18:00</span><span>Soll 21° → 23° · ✋ am Gerät</span></div><div><span class="at">14:57</span><span>⚠️ kurz nicht verfügbar (Home Assistant neu gestartet)</span></div>
        <div><span class="at">06:00</span><span>Soll 17° → 21° · 🤖 Heizplan Komfort</span></div></div>
      <div class="lgBtns"><button class="bdBtn" type="button">📋 Nur dieses Gerät kopieren</button><button class="bdBtn" type="button">🔎 Wird benutzt</button></div></div>`;
  }
  function all() { page(allPage(null)); }
  function device() {
    page(allPage(0));
    document.body.append(h(`<div class="lgDlgBack"><div class="lgDlg"><h3>⬇ Exportieren</h3><span class="tpSub">für eine Fehlersuche, zum Beispiel hier im Chat</span>
      <div class="sec">Zeitraum</div><div class="lgOpts"><div class="lgOpt">Letzte Stunde</div><div class="lgOpt on">Heute</div><div class="lgOpt">Letzte 7 Tage</div></div>
      <div class="sec">Was</div><div class="lgOpts"><div class="lgOpt on">Alles<small>was gerade gefiltert ist</small></div><div class="lgOpt">Nur Fehler<small>und offline</small></div><div class="lgOpt">Nur ein Gerät<small>Heizung Wohnzimmer</small></div></div>
      <div class="sec">Als</div><div class="lgOpts"><div class="lgOpt on">📋 Text<small>kopieren und im Chat einfügen</small></div><div class="lgOpt">📄 Datei (.txt)<small>zum Speichern oder Schicken</small></div><div class="lgOpt">📊 Tabelle (.csv)<small>für Excel</small></div></div>
      <p class="lgNote">Im Text stehen die Namen der Entitäten, die Räume, wer es war und die Antworten von Home Assistant. Codes, Schlüssel und Passwörter nie.</p>
      <div class="bt"><button class="bdBtn" type="button">Abbrechen</button><button class="bdBtn" type="button">📋 Kopieren</button></div></div></div>`));
  }
  return { commands, all, device };
})();
