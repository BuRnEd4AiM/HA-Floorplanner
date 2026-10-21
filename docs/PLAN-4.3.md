# Plan 4.3 und weiter: Reiter, damit das Programm das einzige Dashboard ist

Dieser Plan ist die **Übergabe**: Falls die Arbeit abbricht, kann eine andere Sitzung hier weitermachen. Erst diesen Plan lesen, dann `docs/UEBERGABE.md` und `.claude/CLAUDE.md`.

- **Stand (2026-10-21 spät abends):** 4.3.0 (#480) und 4.4.0 (#482, ☀ Heute und ⚡ Energie) sind gemergt, **Paket 2 ist gebaut (4.5.0, #483: 🌡 Klima, ▶ Abläufe, 👨‍👩‍👧 Familie mit Pinnwand)**. **Die Seiten selbst bearbeiten ist gebaut (#484, 4.6.0, Bilder `docs/ideen-4.6/`).** Als Nächstes Paket 3 (4.7.0, siehe „Paket 2 und 3: so weitermachen“ unten; vorher kurz fragen). Eine neue Seite braucht seit 4.6.0 zusätzlich feste Kartenschlüssel: sie gibt ihre Karten als `[{ key, el, width }]` an `ctx.board.fill(page, box, items, { min })` (Vorbild `pageclimate.js`), statt sie selbst in die Seite zu hängen.
- **Davor:** Ideen gesammelt, Beispielbilder gemacht (`docs/ideen-4.3/`). Der Besitzer hat „Schritt 1 bauen“ gewählt: **Schritt 1 ist gebaut (4.3.0, #479)**, siehe `docs/UEBERGABE.md`. Dazu seine zwei Hinweise: „es soll ja aber auch noch administrativ verwaltet werden“ (Reiter pro Benutzer nur durch Admins, die Leiste nur in „Live“) und „baue es direkt auch für den hacs store“ (die Karte bekam `tabs` und `kiosk`).
- **Branch der Ideen-Runde:** `claude/nice-shannon-mee5c5`
- **Beispielbilder neu machen:** `python3 docs/ideen-4.3/make_pictures.py /tmp/bilder [namen]` (Demo vorher bauen, Playwright 1.56, siehe `docs/UEBERGABE.md`), danach als JPG (Qualität 80) nach `docs/ideen-4.3/`. Die Seiten malt `docs/ideen-4.3/mockup.js` nur für das Foto (Werte teils aus der Demo, teils ausgedacht).

## Wunsch des Besitzers (2026-10-21, wörtlich, gekürzt)

> ich würde das gerne so machen, dass ich mein Programm als Hauptprogramm sozusagen in Home Assistant benutzen kann … dass ich keine anderen Dashboards mehr brauche … zusätzliche Reiter, die man den Benutzern dann anzeigen oder freischalten kann … wenn man jetzt zwei Häuser hat, zwei Energiedashboards … wie viel man heute verbraucht hat … für bestimmte Benutzer auch sagen kann, dieses Webding soll sozusagen dann die Startseite sein von dem Tablet und im Fullscreen sein, dass auch die Seitenleiste nicht angezeigt wird

## Seine Auswahl (per Auswahl im Chat)

- **Alle acht Reiter** gewählt: ⚡ Energie, ☀ Heute (Startseite), 🌡 Klima & Heizung, 📷 Kameras & Klingel, 🎵 Musik & TV, 🧺 Haushalt, ▶ Abläufe, 👨‍👩‍👧 Familie. Dazu bleibt 🏠 Haus (das 3D-Bild wie heute).
- **Leiste unten** (wie eine Handy-App), nicht links, nicht oben.

## Die Beispielbilder (`docs/ideen-4.3/`)

| Bild | Was |
|---|---|
| `1-leiste.jpg` | das 3D-Haus mit der Leiste unten; Knöpfe und Raum-Kacheln rücken über die Leiste |
| `2-heute.jpg` | Startseite: Uhr, Wetter mit Vorhersage, Pinnwand, Termine, Müll, wer ist da, was offen/an ist, Strom jetzt, Haushalt |
| `3-energie.jpg` | Haus wählen (oder beide zusammen), Heute/Woche/Monat/Jahr, kWh, Kosten, Anteil selbst gemacht, Stunden-Balken, größte Verbraucher, Gas/Wasser/Wärme |
| `4-klima.jpg` | jeder Raum: Ist, Soll mit − +, heizt/kühlt, Luft (CO₂) mit „Lüften“, Wärmepumpe, Tipp |
| `5-kameras.jpg`, `6-klingel.jpg` | alle Kameras live; beim Klingeln springt die Kamera auf jedem Tablet auf (Sprechen, Tür öffnen) |
| `7-musik.jpg` | was wo läuft, Lautstärke, Radiosender als Knöpfe, Räume zusammen |
| `8-haushalt.jpg` | Waschmaschine/Trockner/Spülmaschine, Saugroboter, Auto, Garten, Einkaufsliste, Müll |
| `9-ablaeufe.jpg`, `9b-ich-gehe.jpg` | große Knöpfe; „Ich gehe“ zeigt vorher, was offen/an ist |
| `10-familie.jpg` | wer ist wo, Handy-Akku, Pinnwand |
| `11-benutzer.jpg` | ⚙ → 👥 Benutzer & Tablets: Haken je Reiter, Start-Reiter, was er darf; „Tablet einrichten“ |
| `12-handy.jpg` | Handy: vier Reiter und „Mehr“ |

## Vorgeschlagene Reihenfolge (je ein Pull Request, einzeln testbar)

1. ✅ **4.3.0 Reiter-Leiste und Rechte** (gebaut, #479): die Leiste unten (Handy: 4 + „Mehr“), pro Benutzer Haken je Reiter und Start-Reiter (neben `userLocks` in `users.json`), Server prüft die Rechte wie bei `user_locks`. Was es schon gibt, wird eine Seite: 📷 Kameras (heute `#camMenu`), 🛡 Alarm und Verlauf in Kameras, 📋 Geräte (Batterien, offline) in Heute. Dazu die **Anleitung „Tablet einrichten“** (siehe unten).
2. ✅ **4.4.0 Energie** (gebaut mit Heute, #481; der Besitzer wollte alle übrigen Reiter, in drei Paketen: 1. Heute + Energie, 2. Klima + Abläufe + Familie, 3. Musik & TV + Haushalt): Verlauf aus der Statistik von Home Assistant, pro Haus (`layout.energy` jedes Hauses) und zusammen.
3. ✅ **Heute** (Startseite fürs Tablet): in 4.4.0 mit Energie gebaut.
4. ✅ **4.5.0: Paket 2** (Klima, Abläufe, Familie mit Pinnwand, #483), ✅ **4.6.0: Seiten selbst bearbeiten** (#484, der Wunsch kam während Paket 2), **4.7.0: Paket 3** (Musik & TV, Haushalt). Der Besitzer hat am 2026-10-21 „ja“ gesagt: Paket 2 bauen und selbst mergen, wenn alles grün ist. Rezept und Notizen: unten „Paket 2 und 3: so weitermachen“.

## Technische Notizen

- **Regeln** (`.claude/CLAUDE.md`): jede Seite ein eigenes Modul (`tabs.js` rein mit Test für „welcher Benutzer sieht welchen Reiter, welcher ist Start“, `tabsui.js` für die Leiste; je Seite `page<name>.js`), `app.js` bekommt nur Import und `init…`. Neue Endpunkte brauchen eine Antwort in `demo/demo-data.js`, sonst sieht der Besitzer in der Demo „nicht verfügbar“.
- **Leiste und 3D-Bild:** auf einer anderen Seite als 🏠 das 3D-Bild anhalten (wie bei ausgeschaltetem Bildschirm, `frameloop.js`), damit das Tablet nicht warm wird. `#modeBar`, `#roomTiles`, `#findBtn`, Kompass rücken um die Höhe der Leiste nach oben (so im Bild 1). Die Dashboard-Karte (`?card=1`) zeigt die Leiste nur, wenn die Karte es will (Option).
- **Energie-Verlauf:** Home Assistant speichert für Zähler (`state_class: total_increasing`, kWh/m³) stündliche Werte dauerhaft. Websocket `recorder/statistics_during_period` mit `period: hour | day | week | month` und `types: ["change"]` liefert den Verbrauch je Abschnitt. Welche Zähler: aus `layout.energy` (heute Leistung in W) um die **Zähler** (kWh) erweitern; Vorschlag aus dem Energie-Dashboard von Home Assistant (`energy/get_prefs`, gibt es schon: `get_energy_prefs` in `server.py`). Nur Watt-Sensor: Hinweis auf den Helfer „Integral“ in Home Assistant. Kosten: fester Preis je kWh oder ein Preis-Sensor.
- **Heute:** Wetter-Vorhersage `weather.get_forecasts` (Dienst mit Antwort), Termine `GET /api/calendars/<entity>?start=…&end=…`, Müll aus Sensoren (z. B. Waste Collection Schedule) oder einem Kalender, Personen `person.*`.
- **Klingel:** eine `event.*`-Entität (device class `doorbell`) oder ein `binary_sensor`; beim Auslösen öffnet jedes Tablet mit dem Reiter Kameras das Fenster mit dem Live-Bild (`camlive.js`).
- **Haushalt:** Waschmaschine & Co. je nach Integration; ohne eigene Integration „fertig“ über einen Leistungs-Sensor (unter x W seit n Minuten). Einkaufsliste über `todo.*` (Websocket `todo/item/list`, Dienst `todo.add_item`).
- **Pinnwand:** im Add-on gespeichert (Datenordner), für alle gleich, optional als Nachricht ans Handy (`alarmnotify.py`-Kanal).
- **Abläufe:** Szenen/Skripte gibt es schon (Favoriten, `favorites.js`); „Ich gehe“/„Gute Nacht“ prüfen vorher offene Fenster/Türen, Lichter, Medien (Regeln rein, mit Test).

## Paket 2 und 3: so weitermachen (für den nächsten Chat)

Der Besitzer hat die Reiter schon gewählt und die Bilder gesehen; nicht noch einmal fragen, was gebaut wird. Kleine Fragen (z. B. wer die Pinnwand leeren darf) mit einer vernünftigen Antwort selbst entscheiden und im Pull Request nennen. Paket 2 = 4.5.0 (🌡 Klima, ▶ Abläufe, 👨‍👩‍👧 Familie, Issue #483, im Pull Request „Fixes #483“), Paket 3 = 4.6.0 (🎵 Musik & TV, 🧺 Haushalt), je ein Issue und ein Pull Request („Fixes #n“), Testprotokoll-Abschnitt 80 bzw. 81.

### Rezept: ein neuer Reiter (so entstanden ☀ Heute und ⚡ Energie in 4.4.0)

1. **Leiste:** Schlüssel in `TABS` in `static/tabs.js` (Reihenfolge = Reihenfolge in der Leiste) und gleich in `TABS` in `server.py` (`tests/test_server.py` vergleicht beide). Darf eine Sperre den Reiter verbieten, Eintrag in `TAB_LOCK` (Sperren: `LOCKS` in `userlocks.js` und `server.py`; z. B. Klima und Abläufe mit `control`, wer nicht steuern darf, sieht sie nicht). `tests/tabs.test.mjs` und `tests/e2e/parts/31_tabs.py` (erwartet die Liste der Reiter) nachziehen.
2. **Regeln** ohne DOM und three.js in ein eigenes Modul (Vorbild `today.js`, `energyhistory.js`) mit `tests/<name>.test.mjs`; den Namen in `.github/workflows/ci.yml` in die lange `for t in …`-Zeile.
3. **Seite** `static/page<name>.js`: `init<Name>Page(ctx)` gibt `{ render, update, has, reset }` zurück. `tabsui.js` ruft `render()` beim Öffnen, `update()` bei jeder Änderung der Zustände (nur solange die Seite offen ist), `reset()` beim Verlassen, `has()` bei jedem Aufbau der Leiste (falsch = kein Reiter, z. B. kein Gerät dieser Art). Vorbild `pagetoday.js` (Karten `.tpCard`), `pageenergy.js` (eigene Abfragen mit Wiederholen nach Fehlern).
4. **HTML/CSS:** `<section class="tabPage" data-page="<key>" hidden></section>` in `#tabPages` in `index.html`; Klassen mit eigenem Kürzel in `style.css` (Heute `.td*`, Energie `.pe*`, gemeinsam `.tp*`).
5. **app.js** bekommt nur den Import, `init…({ … })` (Werte als Funktionen: `states: () => states`, `layout: () => layout`) und den Eintrag in `pages` von `initTabsUi` (bei `const tabsUi`). Steuern geht über `live.callService(entity, service)` wie in den anderen Modulen.
6. **Daten von Home Assistant**, die die Seite nicht schon hat (die Zustände hat sie über `states`): reine Funktionen in `floorplan3d/rootfs/app/pages.py` (Test `tests/test_pages.py`), Endpunkt in `server.py` (Muster `get_forecast`, Cache `pages_cached`/`pages_keep`, Websocket über `_HaSocket`), Antwort im Test-Home-Assistant `tests/e2e/mock_ha.py` **und** in der Demo `demo/demo-data.js` (sonst „nicht verfügbar“ in der Demo).
7. **Einstellungen** der Seite (z. B. welche Szenen): Feld in `appstate.js` (Normalwert) und `server.py` (Normalwert und Prüfung, wie `agendaCalendars`), Felder in ⚙ → Gruppe „🗂 Reiter unten“ (`data-group="tabs"` in `index.html`) über einen Teil wie `todayprefs.js` (`fill` / `read`, in `app.js` in `parts`).
8. **Texte:** `tab.<key>` und die der Seite in eine JSON-Datei, `python3 tools/add_i18n.py datei.json` (7 Sprachen), `python3 -m pytest -q tests/test_i18n.py`.
9. **Browser-Test:** neuer Teil `tests/e2e/parts/33_<name>.py` (Vorbild `32_today_energy.py`: legt seine Zustände über `/_extra` an und räumt am Ende auf), lokal `tests/e2e/run.sh 31_tabs 33_<name>`.
10. **Zum Schluss:** Version in `floorplan3d/config.yaml`, `CHANGELOG.md` und `floorplan3d/CHANGELOG.md`, `floorplan3d/DOCS.md`, `docs/MODULE-PLAN.md`, `docs/ROADMAP.md`, Zeile in der Tabelle in `docs/UEBERGABE.md`, Testprotokoll-Abschnitt (danach `python3 tools/testprotokoll.py`), `python3 tools/make_manifest.py`, `graphify update .`; die Demo bauen (`cd demo && node build.mjs`) und die neue Seite einmal ansehen, `demo/floorplan3d-demo.html` **nicht** committen.

### Notizen je Seite (Bilder in `docs/ideen-4.3/`)

- **🌡 Klima** (`4-klima.jpg`): je Raum eine Karte: Ist-Temperatur und Feuchte (`roomReading(ids, states, mode)` und `roomEntityIds(room, placed, areaEntities)` in `roomtiles.js`, so rechnen auch die Raum-Kacheln), Soll mit − / + (`clampTarget`, `HEAT_DELAY` in `heatpanel.js`: mehrere Tipps werden ein Aufruf), heizt / kühlt / aus (`heatMode` in `heating.js`), CO₂ mit „Lüften“, wenn es über der zweiten Stufe von `settings.co2Stops` liegt, ein offenes Fenster im Raum („Heizung aus?“, `openings.items()`). Darunter die Klimageräte ohne Raum und eine Wärmepumpe (`water_heater.*` / `climate.*` ohne Raum). `has()`: mindestens ein `climate.*` oder ein Raum mit Temperatur. Die Demo hat Heizungen und die Klimaanlage im Büro (`climate.klima_buero`).
- **▶ Abläufe** (`9-ablaeufe.jpg`, `9b-ich-gehe.jpg`): große Knöpfe für Szenen, Skripte und Knöpfe (`FAV_SERVICE` in `favorites.js` kennt die Dienste); welche, wählt ein Admin in ⚙ → „🗂 Reiter unten“ (leer = alle `scene.*` und `script.*`). „Ich gehe“ und „Gute Nacht“ zeigen vorher, was noch offen oder an ist (offene Fenster/Türen `openings.items()`, Lichter `lightGroups.count()`, laufende `media_player.*`) mit „Trotzdem“ und „Alles aus“; die Prüfung als reine Regel mit Test. Automationen nur ansehen und ein-/ausschalten (`automation.turn_on/off`), nicht bearbeiten.
- **👨‍👩‍👧 Familie** (`10-familie.jpg`): jede `person.*` mit Bild (`entity_picture`), wo (Zustand / Zone, `people` in `today.js`), seit wann (`last_changed`), Handy-Akku (der `sensor.*_battery_level` desselben Geräts wie der `device_tracker` der Person, über das Entity-Register; ohne Treffer weglassen). **Pinnwand:** im Add-on gespeichert (eine Datei im Datenordner wie `users.json`, für alle gleich), Endpunkte `api/pinboard` (lesen, anheften, löschen), Text gekürzt (z. B. 300 Zeichen, höchstens 30 Zettel), mit Name (`api/me`) und Zeit; die Pinnwand auch als Karte auf ☀ Heute (im Bild `2-heute.jpg`). Optional als Nachricht ans Handy über die Kanäle von „Benachrichtigung bei Alarm“ (`alarmnotify.py`).
- **🎵 Musik & TV** (Paket 3, `7-musik.jpg`): `media_player.*` mit Titel, Bild (`entity_picture` liegt bei Home Assistant; dafür braucht es einen Endpunkt wie das Kamerabild über `camera_proxy` in `server.py`), Lautstärke, Weiter/Pause, Räume zusammen (`media_player.join`, nur wenn `group_members` da ist), Sender als Knöpfe (`media_player.play_media`, Liste in ⚙). Bei 63.1 bis 63.3 (Ton) testet der Besitzer erst ganz zum Schluss.
- **🧺 Haushalt** (Paket 3, `8-haushalt.jpg`): Waschmaschine, Trockner, Spülmaschine (eigener Zustand der Integration, sonst „fertig“ über einen Leistungs-Sensor: unter x W seit n Minuten, Regel mit Test), Saugroboter (`vacuum.*`, die Demo hat `dc_vac`), Einkaufsliste über `todo.*` (Websocket `todo/item/list`, Dienste `todo.add_item` / `todo.update_item`), Müll (schon in ☀ Heute: `wasteCalendar`).

## Tablet: Startseite, Vollbild, ohne Seitenleiste

Die Seitenleiste und die Kopfzeile gehören Home Assistant; das Add-on läuft in einem Rahmen darin. Was geht (so dem Besitzer gesagt):
1. **Fully Kiosk Browser** (hat er am Tablet): Start-Adresse, Vollbild.
2. **Ein Dashboard nur mit der Karte `custom:floorplan3d-card`** über die ganze Seite (Ansicht „Panel“), als Start-Adresse.
3. **Kiosk Mode** (HACS, https://github.com/NemesisRE/kiosk-mode) blendet Kopfzeile und Seitenleiste aus, auch nur für bestimmte Benutzer.

Noch zu prüfen, bevor es versprochen wird: ob das Add-on so ein Dashboard selbst anlegen darf (Websocket `lovelace/dashboards/create` und `lovelace/config/save` mit dem Supervisor-Token), und ob ein Knopf „⛶ Vollbild“ (Fullscreen-API) im Ingress-Rahmen von Home Assistant geht (`allow="fullscreen"` am iframe).

## Offene Fragen an den Besitzer

- Passt das Aussehen der Seiten? Was fehlt, was soll weg?
- Zwei Häuser beim Strom: Umschalten, nebeneinander, oder beides wie im Bild?
- Fängt er mit Schritt 1 (Leiste und Rechte) an, oder will er zuerst Energie?
