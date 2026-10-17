# Plan 3.98.0: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste

Dieser Plan ist die **Übergabe**: Falls die Arbeit abbricht (z. B. kein Volumen mehr), kann eine andere Sitzung oder ein anderer Zugang genau hier weitermachen. Erst diesen Plan lesen, dann `.claude/CLAUDE.md`, dann unten bei **Fortschritt** den ersten offenen Punkt nehmen. Nach jedem fertigen Teil: Fortschritt hier abhaken, committen, pushen.

- **Branch:** `claude/funny-bardeen-6cdspw` (Pull Request „3.98.0: Himmel, Wetter, Strom-Bild, Raum-Kacheln, Werkzeugleiste“, zuerst als Entwurf)
- **Issues:** #418 Himmel · #419 Wetter und Regen-Warnung pro Fenster · #420 Strom als Bild · #421 Raum-Kacheln · #422 Werkzeugleiste
- **Beispielbilder** (so hat der Besitzer es gesehen und ausgesucht): `docs/ideen-3.98/` (`0-heute.jpg` ist der Stand vorher)
- **Version:** 3.98.0 (eine Version für alles, ein Pull Request; je Teil ein eigener Commit)

## Entscheidungen des Besitzers (2026-10-17, wörtlich)

> 1a 1b das Leuchten finde ich kacke, mach das nicht, aber der Hintergrund ist geil, mit der Uhrzeit auch.
> 2 Strom als Bild auch geil. 3a und b auch geil. 4a und b auch geil.
> 6 Wetter geil und mit Benachrichtigungen ist auch cool, sollte aber auf bestimmte Fenster eingestellt werden können, da manche ja auch bei Regen offen sein können.

Also: **kein** Lichtschein um die Lampen (die Kugeln aus `1b-himmel-nacht.jpg`), **keine** Szenen-Knöpfe (Idee 5 wurde nicht gewählt). Der Besitzer ist kein Entwickler: mit ihm einfach und auf Deutsch reden, wie in `.claude/CLAUDE.md` beschrieben.

## Regeln (aus `.claude/CLAUDE.md`, kurz)

- Neues kommt in **neue Module** in `floorplan3d/rootfs/app/static/`, `app.js` bekommt nur Import, `init…({...})` und Verdrahtung.
- Reine Logik (ohne three.js, ohne DOM) bekommt einen Node-Test `tests/<name>.test.mjs` und wird in `.github/workflows/ci.yml` in die Liste der Tests eingetragen (die lange `for t in …`-Zeile).
- Nach jeder Änderung in `floorplan3d/`: `python3 tools/make_manifest.py` und `floorplan3d/rootfs/app/manifest.json` mit committen.
- Texte in **allen 7 Sprachen**: `i18n.js` (de, en) und `lang/fr.js`, `es.js`, `it.js`, `nl.js`, `pl.js`.
- Browser-Test: nur die betroffenen Teile laufen lassen (`tests/e2e/run.sh <teil>`), neue Prüfungen in einen neuen Teil `tests/e2e/parts/25_sky_tiles.py`.
- Testprotokoll: neuer Abschnitt **65** in `docs/TESTPROTOKOLL.md`, danach `python3 tools/testprotokoll.py`; die „Kurze Prüfliste“ oben bekommt einen Punkt.
- `CHANGELOG.md` und `floorplan3d/CHANGELOG.md` gleich halten; `ROADMAP.md`, `docs/MODULE-PLAN.md`, `floorplan3d/DOCS.md` nachziehen; `config.yaml` auf 3.98.0.
- Nach Code-Änderungen `graphify update .`.
- Im Pull Request `Fixes #418`, `Fixes #419`, `Fixes #420`, `Fixes #421`, `Fixes #422`.

## A. Himmel nach Uhrzeit (#418)

**Was man sieht:** Hinter dem 3D-Bild ein Verlauf passend zur Sonnenhöhe: Nacht dunkelblau mit Sternen, Dämmerung lila/rosa, Sonnenauf- und -untergang orange, Tag blau. Im Live-Modus oben rechts (nur breite Bildschirme, nicht am Handy, nicht in der Dashboard-Karte) eine Anzeige wie „🌇 Abend · 18:45 · Sonnenuntergang 18:52“. Das Licht im Haus bleibt, wie es ist: **kein Leuchten**. Der Rasen wird nachts etwas dunkler, abends etwas wärmer, so wie auf den Beispielbildern.

**Neue Module:**
- `sky.js` (rein, Test `tests/sky.test.mjs`):
  - `sunNow(states, date)` → `{ elev, rising, rise, set }`: aus `sun.sun` (Feld `sun` des Zustands, siehe Server), sonst Näherung aus Datum und Uhrzeit (Breite 50°, Länge aus der Zeitzone).
  - `skyPhase(elev, rising)` → `night | dawn | morning | day | evening | dusk` (Grenzen: unter −6° Nacht, −6° bis 0° Dämmerung, 0° bis 8° Morgen/Abend, darüber Tag).
  - `skyColors(elev, rising)` → `{ top, mid, low }` (Hex), stufenlos zwischen festen Stützpunkten; `skyCss(colors, cloud)` → CSS-`background` (Wolken mischen nach Grau).
  - `groundTint(elev)` → `[r, g, b]`-Faktoren für den Rasen.
- `skyui.js` (DOM): setzt `scene.background = null` und den Verlauf als CSS auf die Leinwand (`renderer` hat `alpha: true`), Sterne als einmal gezeichnetes Bild, die Anzeige oben rechts (`#skyChips`), Rasen-Tönung über eine Funktion aus `earth.js`. Aktualisiert jede Minute und bei neuen Zuständen.

**Einstellung:** `sky`: `"time"` (Standard) oder `"off"` (einfarbig wie bisher), in ⚙ → Aussehen. Im Thema „Hologramm“ kein Himmel. Server: `DEFAULT_SETTINGS` und Prüfung in `validate_settings` (`server.py`), Test in `tests/test_server.py`.

**Server:** `slim_state` schickt bei `sun.sun` das Feld `sun: { elev, rising, rise, set }` (aus `elevation`, `rising`, `next_rising`, `next_setting`), Test in `tests/test_server.py`. `entitystate.js` (`toState`) übernimmt `sun` und `wx`.

**Demo:** ohne `sun.sun`, damit der Himmel der echten Uhrzeit folgt. Zum Prüfen: Adresse mit `?skytime=21:30` (stellt die Uhr nur für den Himmel).

## B. Wetter im Bild und Regen-Warnung pro Fenster (#419)

**Was man sieht:** Im Live-Modus folgt der Himmel dem Wetter der Wetter-Entität (`settings.weatherEntity`, sonst die erste `weather.*`): Wolken machen ihn grau, bei Regen fällt Regen über das Bild, bei Schnee Schnee. Neben der Uhrzeit eine zweite Anzeige: „🌧 Regen · 11 °C · Wind 24 km/h“. Im Leistungsmodus „Schnell“ steht der Regen still (kein Ruckeln auf dem iPad, #138).

**Regen-Warnung pro Fenster:** Die Warnung „Fenster offen bei Regen“ gibt es schon (`alerts.js` → `findAlerts`, Banner in `alertsui.js`). Neu ist ein Haken **„Bei Regen warnen“** in den Eigenschaften eines Fensters mit Kontakt (Standard: an). Ist er aus, wird am Fenster `rainWarn: false` gespeichert, und `findAlerts` überspringt es (Fenster-Liste bekommt `rain: false`). Unit-Test in `tests/alerts.test.mjs`. Import/Export und `layoutnorm.js` müssen das Feld behalten. Eine WhatsApp bei Regen gibt es bisher nicht (`alarmnotify.py` kennt nur Rauch, Gas, CO, Wasser, Alarm); das bleibt so, außer der Besitzer wünscht es.

**Module:** `weatherLook(state)` in `sky.js` (Wolkenanteil, Regen/Schnee/Gewitter, Symbol, Name-Schlüssel), Anzeige und Regen-/Schnee-Ebene in `skyui.js` (CSS-Animation nur mit `transform`).

**Server:** `slim_state` schickt bei `weather.*` das Feld `wx: { t, tu, w, wu }` (Temperatur, Einheit, Wind, Einheit).

**Demo:** `weather.home` mit „teilweise bewölkt“; `?weather=rainy` (oder `snowy`, `cloudy`, `pouring` …) stellt das Wetter um. Das Wohnzimmerfenster ist in der Demo offen: mit `?weather=rainy` kommt die Warnung, nach Abhaken von „Bei Regen warnen“ verschwindet sie.

## C. Strom als Bild (#420)

**Was man sieht:** Live-Modus, breiter Bildschirm: oben rechts (unter der Uhrzeit) eine Karte „STROM JETZT“ mit Kreisen für Sonne (oben), Netz (links), Haus (rechts), Batterie (unten), dazwischen Linien mit wandernden Punkten in Flussrichtung. Die Zahlenzeile `#energyPill` verschwindet dann. Ein Tipp auf die Karte macht dasselbe wie heute die Zahlenzeile (Strom-Kabel an/aus). Am Handy und im Bearbeiten-Modus bleibt die Zahlenzeile.

**Neue Module:**
- `energyflow.js` (rein, Test `tests/energyflow.test.mjs`): `energyFlows(bal)` aus dem Ergebnis von `energyBalance` (`energycalc.js`): Kreise (nur die vorhandenen: Sonne nur mit Erzeugung, Batterie nur mit Batterie) und Linien mit Watt: Sonne→Netz = min(Einspeisung, Erzeugung); Sonne→Batterie = min(Laden, Rest); Sonne→Haus = Rest; Netz→Batterie = Laden − Sonne→Batterie; Netz→Haus = Bezug − Netz→Batterie; Batterie→Netz = Einspeisung − Sonne→Netz; Batterie→Haus = Entladen − Batterie→Netz. Laden/Entladen aus `bal.battery.flow` (plus = lädt).
- `energyflowui.js` (DOM): zeichnet die SVG-Karte `#energyCard`, aktualisiert zusammen mit `updateEnergy` in `power.js`. Punkte: Linie mit `stroke-dasharray`, Animation von `stroke-dashoffset`, Tempo nach Watt; bei „Schnell“ still.

**Einstellung:** `energyCard`: `true` (Standard); ausschaltbar im Menü „Ansicht“ (Knopf „Strom als Bild“).

## D. Raum-Kacheln (#421)

**Was man sieht:** Live-Modus: unten über „Normal / Temp. / …“ eine Leiste mit einer Karte pro Raum der gezeigten Etage (im ganzen Haus: alle Räume, oberste Etage zuerst): Name, Temperatur groß, „💡 2 an“ oder „aus“, „🪟 offen“, 👤 wenn jemand da ist. Licht an: Rand in der Lichtfarbe. Tipp: fliegt zum Raum und öffnet die Raum-Karte (`liveSelect({ kind: 'room', id })`). Am Handy wischbar, kleiner, über dem Kompass.

**Neue Module:**
- `roomtiles.js` (rein, Test `tests/roomtiles.test.mjs`): `roomReading(ids, states, mode)` (Durchschnitt Temperatur / Feuchte / CO₂; aus `roomHeat` in `app.js` herausgelöst, `roomHeat` nutzt es danach) und `roomSummary(room, f, ctx)` → `{ temp, lights, rgb, open, occupied }` (Lichter: Geräte im Raum mit `light.…` an, auch `ledEntity`; offen: Fenster des Raums aus `roomOpenings` in `roompanel.js` mit offenem Kontakt; jemand da: `occupied` aus `nav.js` oder ein Bewegungs-/Präsenzmelder im Raum, der „an“ meldet).
- `roomtilesui.js` (DOM): `#roomTiles` in `#stage`, neu gezeichnet nur, wenn sich etwas geändert hat (Vergleich als Text).

**Einstellung:** `roomTiles`: `true` (Standard); Knopf „Raum-Kacheln“ im Menü „Ansicht“; als Benutzer-Voreinstellung (`PRESET_FIELDS` in `server.py` und `viewprefs.js`).

## E. Werkzeugleiste mit Symbolen und Gruppen (#422)

**Was man sieht:** Bearbeiten-Modus: jedes Werkzeug mit Symbol und kurzem Namen darunter, in Gruppen mit kleiner Überschrift: (Auswählen) | ZEICHNEN | SETZEN | WERKZEUGE. Gewähltes Werkzeug blau. Leiste leicht durchsichtig. Vorlage: `docs/ideen-3.98/4b-leisten-neu.jpg`, Bastelvorlage der Symbole im Pfad-Format von `docs/ideen-3.98/toolbar-mockup.js`.

**Neues Modul:** `toolicons.js`: Symbole (Inline-SVG, 24×24, Linien) je Werkzeug, Gruppen, `decorateTools()` setzt Symbol und `<span data-i18n="tool.short.…">` in die Knöpfe. Keine Hüllen um die Knöpfe (die Anpassung in `toolbar.js` und die Tests erwarten `#tools > button`); Gruppen-Überschrift als `data-cap` am ersten Knopf der Gruppe (CSS `::before`), Trennstrich als Rand. Im Menü „Mehr ▾“ und im Handy-Menü ☰: Symbol links, Name rechts, ohne Überschrift. Der volle Name bleibt im Tooltip (`tip.*`).

**Achtung Tests:** `tests/e2e/parts/02_tools.py`, `09_floors.py`, `19_measure.py` suchen Werkzeuge; nach dem Umbau diese Teile laufen lassen.

## Prüfpunkte für das Testprotokoll (Abschnitt 65)

Himmel am Tag / mit `?skytime=21:30` / `?skytime=19:15` · Uhrzeit-Anzeige · ⚙ Himmel aus · Wetter mit `?weather=rainy` / `snowy` · Haken „Bei Regen warnen“ · Strom als Bild (Werte wie die Zahlenzeile: 3,20 kW, 450 W, 3,05 kW, 82 %, lädt 600 W) · Tipp schaltet Kabel · Raum-Kacheln PC / Handy · Tipp fliegt zum Raum · Werkzeugleiste: alle Werkzeuge gehen wie vorher, „Mehr ▾“, ✎ Anpassen, Handy ☰ · im Add-on: Himmel mit `sun.sun`, Wetter mit echter Wetter-Entität.

## Fortschritt

- [x] Beispielbilder, Issues #418 bis #422, dieser Plan
- [x] A. Himmel (`sky.js`, `skyui.js`, Server `sun`, Einstellung, Demo `?skytime`), Texte in 7 Sprachen, `tests/sky.test.mjs` in der CI-Liste
- [x] B1. Wetter im Bild (`weatherLook`, Regen/Schnee, Anzeige, Server `wx`, Demo `?weather`)
- [x] B2. Haken „Bei Regen warnen“ am Fenster (`rainWarn`, `findAlerts`, Eigenschaften, Import/Export, Schema, Tests)
- [x] C. Strom als Bild (`energyflow.js`, `energyflowui.js`, Knopf „Strom als Bild“ im Menü Ansicht, Einstellung `energyCard`, Sperre „Strom“ blendet es aus)
- [x] D. Raum-Kacheln (`roomtiles.js`, `roomtilesui.js`, `roomHeat` nutzt `roomReading`; Knopf im Menü Ansicht, Einstellung, Benutzer-Voreinstellung)
- [x] E. Werkzeugleiste (`toolicons.js`, `index.html`, CSS; `toolbar.js` meldet seine Reihenfolge über `onApply`, „Dach“ steht jetzt bei den Zeichen-Werkzeugen)
- [x] Texte in 7 Sprachen (bei jedem Teil gleich mit; Prüfung `tests/test_i18n.py`)
- [ ] Unit-Tests + CI-Liste, Browser-Test-Teil `25_sky_tiles.py`, betroffene Teile lokal grün
- [x] Version 3.98.0, CHANGELOG (beide), DOCS, ROADMAP, MODULE-PLAN, Testprotokoll Abschnitt 65 und Punkt 1 der Kurzen Prüfliste, Manifest
- [ ] Pull Request fertig (kein Entwurf mehr), CI grün, dem Besitzer erklären, wie er mergt
