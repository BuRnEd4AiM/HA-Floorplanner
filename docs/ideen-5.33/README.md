# Ideen 5.33: eigene Bildkarten fürs Handy

Anlass: der Besitzer (2026-11-23): „eigene Bilderkarten designen für spezielle Alarme … hier oben soll das Bild von dem Raum hin, hier die
Informationen, hier die Uhrzeit … das ist die spezielle Benachrichtigung für Florian 1 … und in den Abläufen sagen: löse Florian 1 aus.“

Nur Beispielbilder, nichts davon ist gebaut. Grün = neu. Eine Bildkarte kommt als **ein fertiges Bild** über den eigenen Telegram-Bot
(⚙ → Warnungen & Alarm → Nachricht aufs Handy → „Telegram – eigener Bot“), der Text der Nachricht steht darunter. Das Add-on malt das Bild
selbst (ohne Browser, wie heute schon den Grundriss bei Alarm), darum auch nachts ohne offenen Bildschirm.

| Bild | Für | Was |
| --- | --- | --- |
| 1 | alle Ideen | ▶ Abläufe bekommt den Abschnitt „🖼 Bildkarten fürs Handy“: jede Karte als kleines Bild, wo sie benutzt wird, „＋ Neue Bildkarte“ |
| 2, 3 | Idee 1 | **Bausteine untereinander**: Überschrift, Raumbild, Kamerabild, Uhrzeit, Infos, Werte … als Liste, mit ⠿ ziehen oder ▲▼; zwei nebeneinander geht auch; rechts (am Handy oben) sofort die Vorschau. Farbe, hell/dunkel, hoch/quer/quadratisch |
| 4 | Idee 2 | **Freie Fläche** wie in einem Malprogramm: Bausteine auf die Karte ziehen, verschieben, an den Ecken größer machen, rastet im Raster ein; rechts Schrift, Farbe, Ausrichtung des gewählten Bausteins |
| 5 | Idee 3 | **Vorlage wählen**: sechs fertige Aufteilungen, dann nur noch sagen, was in die nummerierten Felder kommt, und eine Farbe |
| 6, 7, 8 | alle Ideen | So kommen die drei Beispielkarten im Handy an: „Wasser-Alarm“ (Grundriss, Kamera, Infos), „Florian 1“ (Kamera groß, Uhrzeit riesig), „Gute Nacht“ (Etage mit offenen Fenstern und Licht, Liste) |
| 9 | alle Ideen | Im Ablauf: der Baustein „🔔 Nachricht“ bekommt „🖼 Als Bildkarte schicken: Florian 1“ |
| 10 | alle Ideen | Bei Alarm: je Art (Alarmanlage, Rauch, Gas, CO, Wasser) eine Bildkarte wählen; „Standard“ = wie heute |

Bausteine, die es geben könnte: Überschrift, Raumbild (Grundriss der Etage oder nur der Raum, der Raum rot, Ring am Melder), Kamerabild,
Uhrzeit & Datum, Infos (Raum, Melder, seit wann), Werte aus Home Assistant, Verlauf der letzten 24 Stunden, Wer ist zu Hause, Wetter,
Trennlinie, eigener Text mit Platzhaltern ({raum}, {melder}, {zeit}).

Neu machen (Demo vorher bauen: `cd demo && npm ci && node build.mjs`):

    python3 docs/ideen-5.33/make_pictures.py /tmp/ideen-png
    python3 docs/ideen-5.33/to_jpg.py /tmp/ideen-png docs/ideen-5.33

`mockup.js` malt die Ideen in die echte Demo, `cardpics.py` die Grundrisse der Karten (so, wie das Add-on sie mit Pillow malen könnte);
die „Kamerabilder“ sind Ansichten aus dem 3D-Haus der Demo.
