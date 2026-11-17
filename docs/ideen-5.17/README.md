# Ideen: der Helfer „🌙 Nachtlicht-Weg“ (Beispielbilder, 2026-11-17)

Idee 6 aus `docs/ideen-5.15`. Frage des Besitzers: „wie könnte man das gut umsetzen, da man hier evtl. etwas baut, was man durch
zeitgesteuerte Abläufe auch machen kann … dass man etwas macht, was nicht so gut [ist] oder etwas anderes kaputt macht“. Claudes
Vorschlag: kein eigener Motor (zwei Stellen, die dieselben Lampen schalten, würden sich stören), sondern ein Helfer, der einen
normalen Ablauf anlegt. Seine Wahl: erst Bilder; der Ablauf läuft in Home Assistant (als Automation).

Die Bilder sind die echte Demo (5.16.0, 2:30 Uhr), der Helfer ist nur fürs Foto hineingemalt (`mockup.js` mit den Stilen von
`docs/ideen-5.15/mockup.js`). Gemacht mit `python3 docs/ideen-5.17/make_pictures.py <ordner>`, dann
`python3 docs/ideen-5.17/to_jpg.py <ordner> docs/ideen-5.17`.

| Bild | Was |
|---|---|
| `01` | Schritt 1 „Wo startet der Weg?“: den Bewegungsmelder antippen (blau = gewählt), auf Wunsch nur wenn das Bett belegt war. |
| `02` | Schritt 2 „Lampen auf dem Weg antippen“: in der Reihenfolge des Wegs, je Lampe wie hell (10 %, 20 %) und warmweiß; der Weg leuchtet im Haus. |
| `03` | Schritt 3 „Wann und wie lange?“: 23–6 Uhr oder „wenn es dunkel ist“, aus nach 3 Minuten ohne Bewegung, neue Bewegung verlängert, eine Lampe, die schon an war, bleibt, wie sie war. „Vorher geprüft“: das Flurlicht steckt schon in „Flurlicht nachts“, der Helfer kann den alten Ablauf abschalten. |
| `04` | Das Ergebnis in ▶ Abläufe: ein normaler Ablauf „🌙 Nachtlicht: Schlafzimmer → Bad“ (Wenn / Nur wenn / Dann / Warten / Lampen wie vorher), läuft in Home Assistant, „✏ Ändern“, „▶ Jetzt ausprobieren“, „🌙 Weg im Haus zeigen“. |

Seine Wahl: noch offen.
