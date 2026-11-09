# Ideen: das Dach neu und Räume sperren (Beispielbilder, 2026-11-09)

Wunsch des Besitzers: „kannst du das Dach auch neu aufmachen, dass es geiler und übersichtlicher ist, weil das ist noch ein wenig
unübersichtlich, und ich habe nicht die Möglichkeit, Räume zu sperren, dass diese nicht verschoben werden … mache mal Bilder, wie du es
umsetzen würdest“. **Noch nichts gebaut**, nur Bilder zum Aussuchen.

Die Bilder sind die echte Demo (Version 5.0.0, „✨ Neu“ eingeschaltet) im Bearbeiten-Modus; die neue Leiste, die Rahmen und die Schlösser
sind nur für das Foto darübergemalt (`mockup.js`, gemacht mit `python3 docs/ideen-5.1/make_pictures.py <ordner> [bildname]`, siehe
`docs/UEBERGABE.md`). Die Rahmen im 3D-Bild sitzen genau: das Skript nimmt die Kamera aus dem nächsten Bild (`renderer.render`).

**Heute:** Das Dach steht unter „Etage verwalten“ der Etage „Dach“: Etage, Dachform, Gauben, Dachfenster, Absätze und weitere Dächer
untereinander, mit langen Erklärtexten (im Demo-Haus etwa 4100 Pixel, 5 Bildschirme). Räume sperren geht nur versteckt (Häkchen in der
Objektliste) und hält den Raum nicht fest: man kann ihn nicht als Ganzes ziehen, aber eine Wand daneben zieht seine Ecken mit
(`plan2d.js` `allCornerRefs` nimmt auch die Ecken gesperrter Räume).

| Bild | Idee |
|---|---|
| ① `1-dach-ueberblick` | Ein Klick aufs Dach öffnet es (nicht mehr unter „Etage verwalten“). Oben in einer Zeile, was das Dach hat; Reiter Form / Auf dem Dach / Mehr Dächer / Vorlagen; Dachform als Bilder; das Dach klein von der Seite; der Rest eingeklappt, Erklärtexte als ⓘ. |
| ② `2-dach-profil` | Das Dach von der Seite groß (⤢): Neigung, Firsthöhe, Kniestock, Überstand an Punkten ziehen; grün, wo man im Dachgeschoss stehen kann (über 2 m). |
| ③ `3-dach-von-oben` | Reiter „Auf dem Dach“: eine Karte von oben mit Gauben, Dachfenster und Solar; ziehen statt „Abstand vom Giebel“ tippen; „＋“ für Gaube, Dachfenster, Solar, Absatz; Gaubenart als Bild; immer nur ein Teil offen. |
| ④ `4-dach-ziehen` | Direkt im 3D-Bild: Gaube anfassen und zur Seite ziehen, Griffe für die Breite, am First die Neigung; die Leiste geht mit. |
| ⑤ `5-dach-vorlagen` | Fertige Dächer als Bilder (Satteldach, mit Gauben, Walm, Pult, Flach, L-Haus, mit Vordach, mit Solar), ein Tipp stellt alles ein; „⭐ Mein Dach merken“. |
| ⑥ `6-vorher-nachher` | Das Dach heute (in 3 Stücken nebeneinander) und neu (eine Bildschirmhöhe). |
| ⑦ `7-raum-sperren` | 🔒 oben beim Raum; wählen, was fest bleibt (Wände und Ecken, Fenster und Türen, Geräte, Name); für den Raum, die Etage oder das Haus; im Bild schraffiert mit Schlössern an den Ecken. |
| ⑧ `8-plan-gesperrt` | Im 2D-Plan: gesperrte Räume schraffiert, Schlösser statt Griffe; eine Wand zum gesperrten Raum bleibt auch fest; wer daran zieht, bekommt einen Hinweis mit „Entsperren“. |
| ⑨ `9-alles-sperren` | Ein Schalter „🔒 Grundriss fertig“ für das ganze Haus (Geräte bleiben frei), „nur Admins dürfen entsperren“; Schlösser je Etage und Raum im Baum; oben „🔒 Grundriss gesperrt“. |

Vorschlag von Claude: ①, ②, ③, ⑥ gehören zusammen (das neue Dach-Fenster); ④ und ⑤ können danach kommen. Beim Sperren ⑦ und ⑧
zusammen (dabei die Lücke von heute schließen), ⑨ dazu oder später. Gebaut würde alles in eigenen Modulen (z. B. `roofui2.js`,
`roofmap.js` rein mit Test, `roomlock.js` rein mit Test), app.js bekommt nur das `init…`.
