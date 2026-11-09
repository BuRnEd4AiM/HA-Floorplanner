# Ideen für „Oberfläche 2“ (Beispielbilder, 2026-11-08)

Wunsch des Besitzers: „so unendlich viele Einstellmöglichkeiten … für verschiedene Fenster, Böden, Bödenhöhe“; eine neue Oberfläche
„Version 2“, zwischen alt und neu umschaltbar; Sachen ein- und ausklappen, Reiter („Noppel“), die an der Leiste hängen; die
Bearbeiten-Spalte rechts (Fenster, Räume, Etagen, Gebäude, Häuser) aufräumen. **Noch nichts gebaut**, nur Bilder zum Aussuchen.

Die Bilder sind die echte Demo (Version 4.72.0) im Bearbeiten-Modus; die neue Leiste ist nur für das Foto darübergemalt
(`mockup.js`, gemacht mit `python3 docs/ideen-5.0/make_pictures.py <ordner> [bildname]`, siehe `docs/UEBERGABE.md`).

| Bild | Idee |
|---|---|
| ① `1-ueberblick` | Die neue Leiste am Beispiel Fenster: oben „wo bin ich“ (Haus › Etage › Raum › Fenster), Löschen/Sperren/Kopieren als Symbole oben, alles in Abschnitten zum Ein- und Ausklappen; jede eingeklappte Zeile sagt, was eingestellt ist. Umschalter „Klassisch / ✨ Neu“ oben. |
| ② `2-umschalten` | In ⚙ → Allgemein: „Oberfläche: Klassisch oder Neu“, gilt für mich / alle / je Tablet. Beide bleiben drin. |
| ③ `3-fenster-bild` | Das Fenster als Bild wie im Fensterkatalog: Flügel antippen → Dreh-Kipp, nur kippen, nur drehen, fest, Griff links/rechts. Ersetzt vier Listen. |
| ④ `4-fensterarten` | Fensterarten als Bilder (Fenster, Doppelfenster, Bodentief unten fest …): ein Tipp stellt alles ein; eigene Art merken (⭐). |
| ⑤ `5-noppel` | „Noppel“: Reiter hängen links an der Leiste (Maße, Flügel, Feste Scheibe, Home Assistant, Rollladen, Mehr); ein Tipp klappt die Zusatzoptionen daneben aus. |
| ⑥ `6-mini-leiste` | Eine kleine Leiste schwebt direkt über dem angeklickten Fenster (Größe, Flügel, Kontakt, Kopieren, Löschen); die große Leiste bleibt zu. |
| ⑦ `7-raum-boden` | Raum mit Reitern (Allgemein, Boden, Wände, Geräte); Böden als kleine Bilder nach Gruppen; „Höhe des Bodens“ mit Seitenansicht. |
| ⑧ `8-vorher-nachher` | Derselbe Raum heute (eine sehr lange Leiste) und neu (eine Bildschirmhöhe). |
| ⑨ `9-haus-baum` | Nichts ausgewählt: Häuser › Gebäude › Etagen › Räume als Baum; Etagen ziehen statt „▲ / ▼“; Hilfe als kleiner Reiter. |
| ⑩ `10-etage` | Eine Etage: Art als drei Knöpfe, Geschosshöhe mit kleinem Haus von der Seite, „Löschen“ eingeklappt unten. |
| ⑪ `11-werkzeuge` | Oben nur eine Zeile (Modus, Ansicht, Haus, Etage, Speichern, „⋯ Mehr“), Werkzeuge links in Gruppen. |
| ⑫ `12-suchen` | Ein Wort tippen („kipp“), die passenden Einstellungen erscheinen direkt zum Ändern, mit dem Weg dorthin. |
| ⑬ `13-uebernehmen` | Ein Knopf „⇉ Übernehmen“ überall: wohin (Raum, Etage, Haus, im Bild auswählen) und was. |
| ⑭ `14-geraet` | Gerät: zuerst „Was steuert es?“ (Entität mit Zustand), Lage/Größe/Kippen eingeklappt. |
| ⑮ `15-reiter-oben` | Wie in Word („Bildformat“): beim Fenster hängt oben „Fenster-Optionen“ herunter, eine breite Zeile, rechts keine Leiste. |
| ⑯ `16-handy` | Am Handy: Blatt von unten, Reiter als kleine Knöpfe. |
| ⑰ `17-fenster-look` | (2026-11-09) Das Fenster ohne die gestrichelten Linien: A Schildchen, B halb offen gezeichnet, C kleine Zeichen, D ganz schlicht. |

Vorschlag von Claude: ①, ②, ③, ④, ⑦–⑩, ⑫–⑭ passen zusammen und wären „Version 2“ der Leiste. ⑤, ⑥ und ⑮ sind drei
verschiedene Wege, wo die selteneren Sachen hinkommen (davon eins aussuchen, oder ⑥ zusätzlich). ⑪ (Werkzeuge) und ⑯ (Handy)
können später kommen. Gebaut würde die neue Leiste in eigenen Modulen; die alte bleibt, bis die neue alles kann.

**Wahl des Besitzers (2026-11-09):** gut: 1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14 („5 können wir machen“). Nicht gewählt: 6, 11, 15, 16.
Zu 1 bis 4: „diese vielen gestrichelten Linien auf den Fenstern sind seltsam“ → Bild 17 mit vier anderen Darstellungen.
