# Aufteilung des Codes: Stand und Plan

Stand: Version 5.6.1 (zuerst geschrieben bei 4.2.0). Hintergrund: Issue #137 (geschlossen; die Aufteilung geht nach der Regel unten Schritt für Schritt weiter). Die Hauptdatei `floorplan3d/rootfs/app/static/app.js` hatte am Anfang gut **5.100 Zeilen**, jetzt sind es etwa **2.100** (Stand 5.6.1). Das Ziel ist, sie in kleine Module mit klarer Schnittstelle und eigenen Unit-Tests zu zerlegen, damit neue Funktionen einfacher und sicherer dazukommen.

## Regel für alles Neue

1. **Neue Funktionen kommen in ein neues Modul** (eigene Datei in `static/`) **oder in ein passendes bestehendes Modul**. In `app.js` steht nur der „Klebstoff": ein Import, ein `init…({...})`-Aufruf und die Verdrahtung mit dem Rest.
2. Reine Rechen- und Geometrie-Teile (ohne three.js und ohne DOM) werden separat gehalten und mit einem **Node-Unit-Test** (`tests/<name>.test.mjs`) geprüft, so wie `kitchen.js` und `heatpanel.js`.
3. Pro neuem Modul: einen Kommentar oben in die Datei (was sie macht), den Test in `.github/workflows/ci.yml` eintragen, `python3 tools/make_manifest.py` ausführen, Eintrag in `CHANGELOG.md` (beide Dateien gleich).
4. Wird `app.js` angefasst, um etwas Bestehendes zu ändern, wandert der berührte Abschnitt nach Möglichkeit gleich in ein Modul (Pfadfinder-Regel: den Platz sauberer verlassen, als man ihn vorgefunden hat).

## Schon getrennt

Rund 300 Module in `static/` und 30 Python-Dateien neben `server.py`. Die lange Liste (Datei, Zeilen, Aufgabe) bis 5.6.1 liegt in `docs/archiv/MODULE-PLAN-schon-getrennt.md`. Ein neues Modul bekommt keine Zeile mehr: was es macht, steht im Kommentar oben in der Datei (und graphify findet es).

## Noch in `app.js`

Alle geplanten Schritte (1 bis 24) sind erledigt. `app.js` hält nur noch den Zustand des offenen Plans (Etage, Werkzeug, Auswahl, Modus …),
die three.js-Grundlage (Szene, Kamera, Licht) und verbindet die Module (`init…({ … })`). Neues kommt weiterhin in ein neues oder passendes
Modul, nie als großer Block nach `app.js` (siehe „Regel für alles Neue“).

## Vorgehen je Schritt

1. Abschnitt auswählen, nach Möglichkeit den Rechenteil von der Oberfläche trennen.
2. Neues Modul mit `init…({ t, states, … })`-Schnittstelle, ohne globale Zustände, die nur `app.js` kennt.
3. Unit-Test für den reinen Teil schreiben, Browser-Tests (`tests/e2e`) bleiben unverändert und müssen grün bleiben.
4. Ein Schritt = ein Pull Request, Verhalten darf sich nicht ändern.

## Stolperfallen (aus Erfahrung)

- `node --check app.js` prüft eine `.js`-Datei ohne `"type": "module"` **nicht** wirklich auf Syntaxfehler: immer eine Kopie als `.mjs` prüfen (`cp app.js /tmp/a.mjs && node --check /tmp/a.mjs`), und die Browser-Tests laufen lassen.
- `let`/`const` weiter unten in `app.js` sind beim Aufruf noch nicht gesetzt („Cannot access … before initialization“): `init…` dort aufrufen, wo alles Nötige schon steht, oder Funktionen übergeben statt Werte.
- Während eines Browser-Testlaufs keine ausgelieferten Dateien ändern.
- Nach jeder Änderung in `floorplan3d/` `python3 tools/make_manifest.py` ausführen.
