# Aufteilung des Codes: Stand und Plan

Stand: Version 3.40.0. Hintergrund: Issue #137. Die Hauptdatei `floorplan3d/rootfs/app/static/app.js` hat gut **5.100 Zeilen**. Das Ziel ist, sie in kleine Module mit klarer Schnittstelle und eigenen Unit-Tests zu zerlegen, damit neue Funktionen einfacher und sicherer dazukommen.

## Regel für alles Neue

1. **Neue Funktionen kommen in ein neues Modul** (eigene Datei in `static/`) **oder in ein passendes bestehendes Modul**. In `app.js` steht nur der „Klebstoff": ein Import, ein `init…({...})`-Aufruf und die Verdrahtung mit dem Rest.
2. Reine Rechen- und Geometrie-Teile (ohne three.js und ohne DOM) werden separat gehalten und mit einem **Node-Unit-Test** (`tests/<name>.test.mjs`) geprüft, so wie `kitchen.js` und `heatpanel.js`.
3. Pro neuem Modul: Schritt in `.github/workflows/ci.yml` ergänzen, `python3 tools/make_manifest.py` ausführen, Eintrag in `CHANGELOG.md` (beide Dateien gleich).
4. Wird `app.js` angefasst, um etwas Bestehendes zu ändern, wandert der berührte Abschnitt nach Möglichkeit gleich in ein Modul (Pfadfinder-Regel: den Platz sauberer verlassen, als man ihn vorgefunden hat).

## Schon getrennt

| Datei | Zeilen | Aufgabe |
| --- | ---: | --- |
| `walls.js` | 226 | Wandgeometrie mit Türen und Fenstern |
| `models.js` | 715 | Eingebaute 3D-Modelle (Möbel, Geräte, Küchenzeile, Strom), GLB laden |
| `plan2d.js` | 1.111 | 2D-Editor (SVG) |
| `i18n.js` und `lang/*.js` | 213 + je Sprache | Übersetzungen (7 Sprachen) |
| `stairs.js` | ~330 | Treppengeometrie (gerade, L, U, Wendel, Wandtreppe mit Podesten, mehrere Etagen) |
| `rooms.js` | 146 | Automatische Raumerkennung |
| `dormer.js` | 70 | Dachgauben |
| `ledring.js` | 195 | LED-Ring |
| `nanoleaf.js` | 179 | Nanoleaf-Formen und kleiner Editor |
| `autoplace.js` | 179 | Automatisches Platzieren der Entitäten eines Bereichs |
| `alerts.js` | 62 | Warnungen und Nachtabdunklung (Rechenteil) |
| `kitchen.js` | 63 | Küchenzeile: Geometrie aus Modulen (mit Breiten) |
| `heatpanel.js` | 74 | Heizungs-Panel (Schritt 1 von #137) |
| `compass.js` | ~40 | Kompass (Nadel zählt über 360° weiter), mit Unit-Tests |
| `alertsui.js` | ~75 | Warnungen: Banner, roter Raum, Sprung in den Raum (Schritt 3 von #137) |
| `search.js` | ~70 | „Wo ist …?“-Suche mit Ring (Schritt 3) |
| `kitchenui.js` | ~60 | Küchenzeile: Eigenschaften im Panel (Schritt 3) |
| `power.js` | ~250 | Strom: Kabel in 3D, Strom-Editor, Energie-Übersicht, Eigenschaften (Schritt 2 von #137) |
| `powerlogic.js` | ~100 | Strom: Rechenteil (Watt, Kabelarten, Übersicht, Batterie), mit Unit-Tests |
| `toolbar.js` | 88 | Anpassbare Werkzeugleiste |
| `backups.js` | 70 | Automatische Sicherung (Oberfläche) |
| `version.js` | 122 | Versionsanzeige und Datei-Prüfung |
| `welcome.js` | 21 | Willkommenskarte |
| `import.js` | 112 | Import-Dialog |
| `moreinfo.js` | 27 | Home-Assistant-Dialog |
| `offline.js` | ~100 | Offline-Liste |
| `kiosk.js` | ~70 | Wandtablet (Bildschirmschoner, Nacht) |
| `badges.js` | ~50 | Wertplaketten entzerren |
| `stairtool.js` | ~175 | Treppen-Werkzeug (Platzieren, Treppenhaus, Wandtreppe zeichnen, Eigenschaften, 3D-Treppe) |
| `blocks.js` | ~80 | Platzhalter-Blöcke, Bodenöffnungen, Grundstück, Boden mit Aussparungen |
| `palettes.js` | ~105 | Paletten (Geräte, eigene Modelle, Suche) |
| `background.js` | ~120 | Hintergrundbild (Vorlage zum Nachzeichnen, Eichen) |
| `settingsui.js` | ~115 | Einstellungen: Tablet-Zuordnung und Farbskalen |
| `houses.js` | ~95 | Häuser (Liste, Auswahl, Neu/Kopieren/Umbenennen/Löschen) |
| `floorrail.js` | ~115 | Etagen-Leiste (Vorschaubilder) |
| `floorcards.js` | ~110 | Etagenkarten (Ganzes Haus) |
| `cameras.js` | ~190 | Kameras (Sichtkegel, Übersicht, Standbilder) |

## Noch in `app.js` (Reihenfolge = Empfehlung)

Die Zeilen sind ungefähre Größen. „Risiko“ sagt, wie eng der Abschnitt mit dem Rest verwoben ist.

| Nr. | Abschnitt | Zeilen | Vorschlag für das Modul | Risiko |
| ---: | --- | ---: | --- | --- |
| 13 | **Einstellungen**, Rest (einfache Felder, Anwenden, Speichern) | ~150 | `settings.js` | mittel bis hoch (`settings` wird überall gelesen und ersetzt) |
| 17 | **Raum-Panel und Live-Steuerung** | ~230 + ~240 | `livecontrol.js`, `roompanel.js` | hoch |
| 18 | **Eigenschaften-Panel** (alle Typen) | ~426 | `props.js`, nach Typ aufgeteilt | hoch |
| 19 | **Aufschneiden der Wände** (Cutaway, Durchsichtig) | ~52 + Teile | `cutaway.js` | hoch |
| 20 | **Zeichnen, Auswählen, Zeigerereignisse** | ~260 + ~266 + ~80 | `tools.js`, `pointer.js` | hoch |
| 21 | **3D-Aufbau** (`build`, Boden und Erde, Beleuchtung) | ~600 | `scene.js` | hoch |
| 22 | **Zustand, Rückgängig, Speichern, Datenladen, Live-Kanal** | ~80 + ~25 + ~245 | `state.js`, `data.js` | hoch |

## Vorgehen je Schritt

1. Abschnitt auswählen, nach Möglichkeit den Rechenteil von der Oberfläche trennen.
2. Neues Modul mit `init…({ t, states, … })`-Schnittstelle, ohne globale Zustände, die nur `app.js` kennt.
3. Unit-Test für den reinen Teil schreiben, Browser-Tests (`tests/e2e`) bleiben unverändert und müssen grün bleiben.
4. Ein Schritt = ein Pull Request, Verhalten darf sich nicht ändern.

## Stolperfallen (aus Erfahrung)

- `let`/`const` weiter unten in `app.js` sind beim Aufruf noch nicht gesetzt („Cannot access … before initialization“): `init…` dort aufrufen, wo alles Nötige schon steht, oder Funktionen übergeben statt Werte.
- Während eines Browser-Testlaufs keine ausgelieferten Dateien ändern.
- Nach jeder Änderung in `floorplan3d/` `python3 tools/make_manifest.py` ausführen.
