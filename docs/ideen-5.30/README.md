# Ideen 5.30: das Haus aus dem Bauplan mit einer KI, sichtbarer (#779)

Anlass: FrankBecker in #779 (2026-11-21): „Mach auf der Hauptseite von Floorplanner die Möglichkeit für den JSON Import prominenter.“
Er hat seine Bauzeichnung mit einem kurzen Satz und dem Link zum Projekt an eine KI gegeben, das JSON war gleich richtig.

Nur Beispielbilder, nichts davon ist gebaut. Rot = heute, grün = der Vorschlag.

| Idee | Bilder | Was |
| --- | --- | --- |
| 1 GitHub-Seite | 1 heute, 2 neu | Gleich unter dem ersten Absatz ein Kasten „💡 Tip: Fastest start“ mit drei Schritten, dazu neben „Try the demo“ ein Knopf „🤖 House from your floor plan“ |
| 2 Willkommen | 3 heute, 4 neu | Im leeren Haus zuerst und groß „🤖 Haus aus dem Bauplan bauen lassen“ (am schnellsten), darunter zeichnen, Beispielhaus, JSON-Datei |
| 3 Erste Schritte | 5 heute, 6 neu | Schritt 1 hat vorne den Knopf „🤖 Aus dem Bauplan per KI“ |
| 4 Import-Fenster | 7 heute, 8 neu | Oben drei Schritte: ① KI-Text kopieren ② in Claude / ChatGPT / Gemini mit Foto oder PDF des Bauplans ③ Antwort einfügen, Prüfen, Importieren; Datei und Beispiele darunter als „Oder“ |

Neu machen (Demo vorher bauen: `cd demo && npm ci && node build.mjs`):

    python3 docs/ideen-5.30/make_pictures.py /tmp/ideen-png

`mockup.js` malt die Ideen in die echte Demo, `readme_mock.py` baut den Kopf der GitHub-Seite nach.
