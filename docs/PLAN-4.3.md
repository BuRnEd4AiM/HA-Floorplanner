# Plan 4.3 und weiter: Reiter, damit das Programm das einzige Dashboard ist

Dieser Plan ist die **Übergabe**: Falls die Arbeit abbricht, kann eine andere Sitzung hier weitermachen. Erst diesen Plan lesen, dann `docs/UEBERGABE.md` und `.claude/CLAUDE.md`.

- **Stand (2026-10-21):** Ideen gesammelt, Beispielbilder gemacht (`docs/ideen-4.3/`). Der Besitzer hat „Schritt 1 bauen“ gewählt: **Schritt 1 ist gebaut (4.3.0, #479)**, siehe `docs/UEBERGABE.md`. Dazu seine zwei Hinweise: „es soll ja aber auch noch administrativ verwaltet werden“ (Reiter pro Benutzer nur durch Admins, die Leiste nur in „Live“) und „baue es direkt auch für den hacs store“ (die Karte bekam `tabs` und `kiosk`).
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
4. **4.5.0: Paket 2** (Klima, Abläufe, Familie mit Pinnwand), **4.6.0: Paket 3** (Musik & TV, Haushalt).

## Technische Notizen

- **Regeln** (`.claude/CLAUDE.md`): jede Seite ein eigenes Modul (`tabs.js` rein mit Test für „welcher Benutzer sieht welchen Reiter, welcher ist Start“, `tabsui.js` für die Leiste; je Seite `page<name>.js`), `app.js` bekommt nur Import und `init…`. Neue Endpunkte brauchen eine Antwort in `demo/demo-data.js`, sonst sieht der Besitzer in der Demo „nicht verfügbar“.
- **Leiste und 3D-Bild:** auf einer anderen Seite als 🏠 das 3D-Bild anhalten (wie bei ausgeschaltetem Bildschirm, `frameloop.js`), damit das Tablet nicht warm wird. `#modeBar`, `#roomTiles`, `#findBtn`, Kompass rücken um die Höhe der Leiste nach oben (so im Bild 1). Die Dashboard-Karte (`?card=1`) zeigt die Leiste nur, wenn die Karte es will (Option).
- **Energie-Verlauf:** Home Assistant speichert für Zähler (`state_class: total_increasing`, kWh/m³) stündliche Werte dauerhaft. Websocket `recorder/statistics_during_period` mit `period: hour | day | week | month` und `types: ["change"]` liefert den Verbrauch je Abschnitt. Welche Zähler: aus `layout.energy` (heute Leistung in W) um die **Zähler** (kWh) erweitern; Vorschlag aus dem Energie-Dashboard von Home Assistant (`energy/get_prefs`, gibt es schon: `get_energy_prefs` in `server.py`). Nur Watt-Sensor: Hinweis auf den Helfer „Integral“ in Home Assistant. Kosten: fester Preis je kWh oder ein Preis-Sensor.
- **Heute:** Wetter-Vorhersage `weather.get_forecasts` (Dienst mit Antwort), Termine `GET /api/calendars/<entity>?start=…&end=…`, Müll aus Sensoren (z. B. Waste Collection Schedule) oder einem Kalender, Personen `person.*`.
- **Klingel:** eine `event.*`-Entität (device class `doorbell`) oder ein `binary_sensor`; beim Auslösen öffnet jedes Tablet mit dem Reiter Kameras das Fenster mit dem Live-Bild (`camlive.js`).
- **Haushalt:** Waschmaschine & Co. je nach Integration; ohne eigene Integration „fertig“ über einen Leistungs-Sensor (unter x W seit n Minuten). Einkaufsliste über `todo.*` (Websocket `todo/item/list`, Dienst `todo.add_item`).
- **Pinnwand:** im Add-on gespeichert (Datenordner), für alle gleich, optional als Nachricht ans Handy (`alarmnotify.py`-Kanal).
- **Abläufe:** Szenen/Skripte gibt es schon (Favoriten, `favorites.js`); „Ich gehe“/„Gute Nacht“ prüfen vorher offene Fenster/Türen, Lichter, Medien (Regeln rein, mit Test).

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
