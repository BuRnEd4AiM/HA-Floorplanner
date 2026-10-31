# Testprotokoll

Hier steht, was getestet wurde, wann und von wem. Der Besitzer testet in der **Demo-Datei** (`demo/floorplan3d-demo.html`, erfundene Daten, ohne Home Assistant). Die automatischen Tests laufen bei jeder Änderung.

Legende: ✅ geht · ❌ geht nicht · ❓ noch nicht getestet · ➖ in der Demo nicht prüfbar (nur im Add-on)

## Kurze Prüfliste: das Wichtigste zuerst (Stand 4.50.1)

Die **Demo** öffnen: https://burned4aim.github.io/HA-Floorplanner/ und neu laden (am PC Strg+F5). Oben in der Leiste muss **v4.50.1** stehen. Punkte mit „nur im Add-on“ gehen nur in Home Assistant. Ergebnis gern hier oder im Chat: Nummer + „geht“ oder „geht nicht, weil …“ (ein Bild hilft). Die Nummern in Klammern führen zu den Tabellen unten, dort steht jeder Schritt genau.

**In der Nacht zum 2026-10-25 hat Claude fast alle offenen Punkte der Demo selbst geprüft** (Chromium als PC, Tablet und Handy) und einige im Test-Add-on (das Add-on mit einem nachgebauten Home Assistant); eingetragen als „Claude“. Die Fehler dabei sind in 4.21.2 repariert (Abschnitt 101). Übrig bleibt, was nur mit deinen echten Geräten geht:

1. **Neu in 4.50.0 und 4.50.1: 🪟 Vorhänge zur Seite und jeder Fensterflügel für sich, auch „Fest“** (Abschnitt 138 und 139, ein Beitrag von aixmoyu): Claude hat 138.1 bis 138.3, 139.1 und 139.2 geprüft (probier es gern selbst in der Demo); für dich im Add-on 138.4 bis 138.6 und 139.3, und 138.7, wenn du einen Vorhang mit Motor hast.
1. **Neu in 4.48.0: ▦ „Frei anordnen“, die Karten einer Seite dort, wo du sie willst** (Abschnitt 137): Claude hat 137.1 bis 137.5 in der Demo geprüft (probier es gern selbst); für dich im Add-on am iPad und Handy 137.6 bis 137.8.
1. **Neu in 4.47.0: 🎚️ mehrere Lampen in einem Balken der Lichtsteuerung** (Abschnitt 136): Claude hat 136.1 bis 136.3 in der Demo geprüft (probier es gern selbst); für dich im Add-on am iPad 136.4 bis 136.6.
1. **Neu in 4.46.0: 简体中文 Chinesisch als achte Sprache** (Abschnitt 135): Claude hat 135.1 bis 135.3 in der Demo geprüft; für dich nur 135.4 (die Sprache wieder auf Deutsch stellen geht?).
1. **Neu in 4.45.0: 🎬 Szenen-Leiste über der Reiter-Leiste und die Karte 🎚️ „Lichtsteuerung“** (Abschnitt 134): Claude hat 134.1 bis 134.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on am iPad 134.7 bis 134.9 und am Handy 134.10.
1. **Neu in 4.44.0: ✎ Bearbeiten: ausgeblendete Karten sind ganz weg, die Zeile „👁 Ausgeblendet“ holt sie zurück** (Abschnitt 133): Claude hat 133.1 bis 133.4 in der Demo geprüft (probier es gern selbst); für dich im Add-on mit deiner Fassung „Eltern“ 133.5 und am Handy oder iPad 133.6.
1. **Repariert in 4.43.1: der Raumfühler nimmt keinen alten Wert mehr als Wunsch, 🔥 Zu warm merkt „von Hand gedreht“** (Abschnitt 132): Claude hat 132.1 und 132.2 automatisch geprüft; 132.3 hast du im Add-on geprüft ✅; für dich noch 132.4 bis 132.6 (132.4: morgen früh im 🩺 Protokoll kein „✋ Von Hand gedreht“, das du nicht warst).
1. **Neu in 4.43.0: ▶ Abläufe nach Räumen, zum Auf- und Zuklappen** (Abschnitt 131): Claude hat 131.1 bis 131.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on mit deinen Bereichen 131.7 und 131.8.
1. **Repariert in 4.42.1: die Reihenfolge der Heizung bleibt, auch wenn ein Thermostat spät meldet** (Abschnitt 130): Claude hat 130.1 mit tausenden zufälligen Tagen geprüft; für dich im Add-on 130.2 bis 130.5.
1. **Neu in 4.42.0: 🔥 Zu warm → Heizung runter** (Abschnitt 129): Claude hat 129.1 und 129.2 in der Demo geprüft (probier es gern selbst); für dich im Add-on 129.3 bis 129.6.
1. **Neu in 4.41.0: eine Tür zwischen zwei Räumen kann für die Heizung zählen** (Abschnitt 128): Claude hat 128.1 in der Demo geprüft; für dich im Add-on 128.2 bis 128.6 (zuerst an der Bad-Tür den Haken „Zählt für die Heizung“ einschalten).
1. **Neu in 4.40.0: 📜 Protokoll, ein eigener Reiter für alle Geräte** (Abschnitt 127): Claude hat 127.1 bis 127.4 in der Demo geprüft (probier es gern selbst); für dich im Add-on 127.5 bis 127.9.
1. **Neu in 4.39.0: 🩺 Protokoll „Wer steuert was?“** (Abschnitt 126): Claude hat 126.1 bis 126.5 in der Demo geprüft (probier es gern selbst); für dich im Add-on 126.6 bis 126.9. Und wenn dir wieder etwas auffällt: „📋 Bericht kopieren“ und im Chat einfügen.
1. **Repariert in 4.38.2: Raumfühler und Fenster-Regel zusammen** (Abschnitt 125): im Add-on mit deinem Wohnzimmer FL 125.1 bis 125.3.
1. **Neu in 4.38.0: 🌡 Raumfühler für die Thermostate** (Abschnitt 124): Claude hat 124.1 bis 124.4 in der Demo geprüft (probier es gern selbst); für dich im Add-on mit deinen Thermostaten 124.5 bis 124.9.
1. **Repariert in 4.37.2: bei offenem Fenster geht das Thermostat wirklich aus** (Abschnitt 123): im Add-on mit deinem Wohnzimmer FL 123.1 bis 123.3.
1. **Repariert in 4.37.1: Fenster-Regel unter dem Heizplan, Temperatur über dem Raum** (Abschnitt 122): 122.1 ✅ (Claude in der Demo), 122.2 und 122.4 ✅ im Add-on (122.3 ging nicht ganz, repariert in 4.37.2).
1. **Neu in 4.37.0: ▲ Plateau im Gelände, Boden je Raum höher, Außentreppe** (Abschnitt 121): Claude hat 121.1 bis 121.7 in der Demo und im Test-Add-on geprüft (probier es gern selbst in der Demo, 121.1 bis 121.6); für dich im Add-on mit deinem zweiten Haus 121.8.
1. **Neu in 4.36.0: Szenen „⇉ Auf alle anwenden“, Weißton in Kelvin, Szenen und Automationen aus Home Assistant ändern und löschen** (Abschnitt 120): Claude hat 120.1 bis 120.6 in der Demo geprüft (probier es gern selbst); für dich im Add-on 120.7 bis 120.9.
1. **Neu in 4.35.0: Die Einstellungen fast über den ganzen Bildschirm** (Abschnitt 119): Claude hat 119.1 bis 119.4 in der Demo geprüft; für dich im Add-on am PC 119.5 und am Tablet quer 119.6.
1. **Neu in 4.33.0: 🌙 Der Mond im Himmel** (Abschnitt 116): Claude hat 116.1 bis 116.4 in der Demo geprüft; schau heute Abend im Add-on, ob er dort steht, wo du ihn draußen siehst (116.5).
1. **Neu in 4.32.0: 📅 Heizplan, von Hand gedreht** (Abschnitt 115): Claude hat 115.1 und 115.2 im Test-Add-on geprüft; für dich im Add-on mit deinem Thermostat 115.3 und 115.4.
1. **Neu in 4.31.0 und 4.31.1: 🚆 Zug-Karte** (Abschnitt 113 und 114): Claude hat 113.1 bis 113.3 in der Demo und 114.1 im Test-Add-on geprüft; für dich im Add-on mit deinem Bahnhof 113.4 bis 113.6 und 114.2 bis 114.4 (abends dein Zug von morgen).
2. **Neu in 4.30.0: 🎨 Szenen für Lampen und LED-Streifen** (Abschnitt 112): Claude hat 112.1 bis 112.5 in der Demo geprüft; für dich im Add-on 112.6 bis 112.8.
3. **Neu in 4.29.0: Abläufe werden echte Automationen in Home Assistant** (Abschnitt 111): Claude hat 111.1 bis 111.4 in der Demo geprüft; für dich im Add-on mit deinem Home Assistant 111.5 bis 111.8.
4. **Neu in 4.28.0: Heiz-Regeln, Heizplan, „Wird benutzt“ und eigene Abläufe** (Abschnitt 110): 110.6, 110.12, 110.13 ✅ (Claude in der Demo, 2026-10-28); im Add-on mit deinem echten Fenster und Thermostat 110.14, 110.15.
5. **Neu: 🗄 Schrank-Editor** (Abschnitt 109): Claude hat 109.1 bis 109.10 in der Demo geprüft; probier ihn gern selbst aus (Etage „Dach“, „Schrank unter der Schräge“), und im Add-on unter deinem echten Dach 109.11.
6. **Neu in der Nacht zum 2026-10-26** (Abschnitt 102 bis 107): in der Demo hat Claude am Morgen alles geprüft (siehe unten). Für dich bleibt: **flüssiger am iPad** (102.1), **🎤 mit echter Sprache** „Mach das Licht im Bad an“ (105.6) und im Add-on mit deinen Geräten 103.5 bis 103.7, 104.3 bis 104.5, 105.7, 106.5, 106.6.
7. **iPhone in der Home-Assistant-App** (100.1, 100.2; die Demo in Safari: 100.3): kein leerer Streifen mehr unter „Haus, Heute, Energie …“.
8. **Werte der Energie-Balken mit dem Finger** (101.1): am Tablet oder Handy auf einen Balken tippen.
9. **🎤 mit echter Sprache** (96.1, 97.3, 98.2; im Add-on über http:// 98.4, 98.5): sprechen statt tippen.
10. **🔋 Ladestand mit deiner Batterie** (99.9, 99.10, nur im Add-on).
11. **Zähler und Backup im Add-on** (92.2, 92.3, 92.6, 93.1 bis 93.4): SolarNet-Sensoren, Helfer „Energie“, Urlaubs-Alarm im Backup.
12. **Kalender, Knöpfe, Anwesenheit, zweites Haus im Add-on** (90.7, 91.7, 89.5, 89.6, 87.6).
13. **Wandtablet schneller** (85.1 bis 85.4; in der 2D-Ansicht 108.3) und **iPad flüssig** (56.1, 56.2).
14. **Dashboard-Karte in Home Assistant** (46.3 bis 46.9; 46.3 war ❌, behoben in 3.77.1, bitte noch einmal).
15. **Docker-Version** (94.1 bis 94.3), nur wenn du sie benutzt.
16. ~~**Schleppgaube in der Demo** (42.1 bis 42.6, 43.1 bis 43.4, 45.1 bis 45.3)~~: ✅ seit 2026-10-28 (Claude in der Demo; bei 42.4 zeigte das Feld die neue Neigung erst nach dem Neuöffnen, repariert in 4.38.1).
17. ~~**Warnbanner am Wandtablet** (8.5)~~: ✅ seit 2026-10-28 (Claude in der Demo: Regen-Warnung, Tippen springt in den Raum).

**Zuletzt geprüft (2026-10-28, Claude in der Demo 4.38.0):** ✅ 8.5, 42.1 bis 42.6, 43.1 bis 43.4, 45.1 bis 45.3, 110.6, 110.12, 110.13, 122.1, 124.1 bis 124.4. Die früheren ❌ 63.4, 63.8, 66.21, 67.12, 79.11, 80.2, 84.1, 96.2 waren schon repariert und unter neuen Nummern geprüft (77.x, 66.23, 75.x, 101.x): jetzt ✅; 46.3 und 87.2 sind repariert, aber nur mit echtem Gerät zu bestätigen (wieder ❓). Übrig sind nur noch Punkte für deine echten Geräte.

**Zuletzt geprüft (2026-10-27, per Auswahl im Chat, 4.34.0):** ✅ 118.4, 118.5 (Kantenglättung „Automatisch“ läuft flüssig und gefällt am besten; Abschnitt 118 fertig).

**Zuletzt geprüft (2026-10-27, per Auswahl im Chat, 4.33.1):** ✅ 117.1 bis 117.4 (das Haus dreht sich flüssig, am PC mit Intel-Grafik in „Schön“ und „Schnell“, am Tablet mit dem Finger; Abschnitt 117 fertig).

**Zuletzt geprüft (2026-10-26 morgens, Claude in der Demo 4.26.0):** ✅ 102.2 bis 102.6, 103.1 bis 103.4, 104.1, 104.2, 105.1 bis 105.5, 106.1 bis 106.4, 107.1 bis 107.8 (Chromium als PC und als Tablet, nachts und am Tag der Zeitumstellung mit gestellter Uhr). Kein ❌.

**Zuletzt geprüft (2026-10-25, Claude in der Nacht):** ✅ 76.1 bis 76.14, 78.1 bis 78.11, 79 (ohne 79.11), 80 (ohne 80.2), 81.1 bis 81.12, 82.1 bis 82.8, 83.1 bis 83.12, 86.1 bis 86.9, 87.1, 87.3 bis 87.5, 88.1 bis 88.8, 89.1 bis 89.4, 90.1 bis 90.6, 91.1 bis 91.6, 92.1, 92.4, 92.5, 95.1 bis 95.10, 96.2 bis 96.10, 96.14, 97.1, 97.2, 97.4, 97.7, 98.1, 98.3, 99.1 bis 99.8, 63.1 bis 63.3; im Test-Add-on 12.6a, 15.6, 23.17, 37.6, 48.1 bis 48.5, 52.12, 56.6. **❌** 79.11, 80.2, 84.1, 87.2, 96.2 (#519 bis #525, behoben in 4.21.2, neu: 101).

**Zuletzt geprüft (2026-10-21, per Auswahl im Chat, nach 4.2.1):** ✅ 77.1 bis 77.4, 77.6 (Saugroboter, Hausmodus mit Knöpfen, Innenmaß, Klimaanlage), 54.6 (Klimagerät kühlt und heizt), 51.4 bis 51.8 (Abschnitt 51 fertig), 50.1 bis 50.8 (Strom-Rechnung, fertig), 49.1 bis 49.4 (Küchenzeile, fertig), 47.1, 47.2 (Durchsichtig, fertig), 46.1 (Karte in der Demo), 44.1 bis 44.6 (Dach mit Absatz, fertig). Pause vor 45.1 bis 45.3, 42 und 43 (Schleppgaube). **Davor am selben Tag:** ✅ 51.1 bis 51.3 (skandinavische Möbel), 52.1 bis 52.11 (Sauna, Fitness, Bar, Heimkino, LED-Spiegel), 53.1 bis 53.3 (Gaming-PC, große Spiegel), 54.7, 54.8 (mobiles Klimagerät, Deckenventilator). Noch nicht: 52.12 (Musterhaus importieren). ✅ 54.1 bis 54.5 (Schwenkarm-TV, Gruppe „Klima & Lüftung“), 55.1 bis 55.7 (Aufeinander), 56.3 bis 56.5, 56.7; 54.6: „Kühlen“ fehlte, weil das Klimagerät mit der Heizung verknüpft war (die kann nur heizen), jetzt hat die Demo eine Klimaanlage im Büro (77.6). Noch nicht: 56.1, 56.2 (iPad, Leistung), 56.6. ✅ 57.1 bis 57.7 (Garage, Werkstatt, Carport: alles, was in der Demo geht), 58.5 bis 58.8 (Messen: Abstand und Winkel setzen, gesperrte Wand; Abschnitt 58 damit fertig), 65.10 (Raum-Kacheln am Handy), 63.5 (Standventilator). Wunsch bei 58.5: „Lichter Abstand“ heißt jetzt „Innenmaß (Wand bis Wand)“ (77.4). ❌ 63.4: der Saugroboter war nicht zu finden (stand unter der Treppe, #473), ❌ 63.8: beim Hausmodus gab es keinen Knopf „Urlaub“, nur eine Liste (#474); beides behoben in 4.2.1 (77.1 bis 77.3). **Davor (2026-10-20 abends):** ✅ 63.6, 63.7 (Alarmanlage mit Code), 62.1 bis 62.4 (Energie aus dem Energie-Dashboard), 61.1 bis 61.9, 61.12, 61.13 (mehrere Gebäude), 60.1 bis 60.8 (Rückgängig, Kopieren, Einfügen), 59.1 bis 59.7 (Bar mit Deckenteil), 58.1 bis 58.4 (Messen). Noch nicht: 63.4, 63.5, 63.8 und 58.5; 63.1 bis 63.3 (Ton: Lautsprecher, Fernseher) will der Besitzer als Letztes prüfen. **Davor am selben Tag:** ✅ 75.1, 75.2 (Raumfarben im 2D-Plan, 4.1.4), der ganze Abschnitt 66, soweit in der Demo prüfbar (66.1 bis 66.10, 66.12 bis 66.20, 66.23 bis 66.25: Böden, Fensterrahmen, Glas, Raum-Schilder, Strom-Karte, Sterne, am Handy flüssige Raum-Kacheln, Strom-Karte und Zeile mit Uhrzeit und Wetter), 65.1 bis 65.9, 65.11 bis 65.13, 65.16 (Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste). 63.1 bis 63.4 noch nicht: die Geräte waren in „Live“ nicht zu finden (mit Raum-Schildern sind die Kugeln aus, Hinweis jetzt in der Prüfliste). **Davor am selben Tag:** ✅ 67.9 bis 67.11 (Wände für alle Räume, Akzentwand, „Temp.“ und Hologramm). ❌ 67.12: im 2D-Plan waren die Räume mit „Temp.“ schwarz (#467, behoben in 4.1.4: 75.1, 75.2). **Davor am selben Tag:** ✅ alles, was in der Demo geht, von 4.1.3 bis 4.0.1: 74.1, 74.2, 73.1 bis 73.7, 72.1 bis 72.7 (roter Streifen und Rand statt Sperrbildschirm, Wandtablet mit `?wand=1`, Dienste nach Herkunft), 71.1 bis 71.6 und 71.8 bis 71.11 (Urlaubs-Alarm mit Sperrbildschirm, Telegram, Dienste ankreuzen), 70.1 bis 70.6 (Benutzer & Tablets in ⚙, WhatsApp-Schritte), 69.1 bis 69.3 (Gebäude-Filter), 68.1 bis 68.8 (Einstellungen in Gruppen), 67.1 bis 67.8 (Wände und Böden mit Muster, Fassade). **Davor (2026-10-18):** ✅ 66.22 (am iPhone steht der angetippte Raum schön über der Raum-Karte). ❌ 66.21: die Raum-Kacheln ließen sich am Handy nur ruckelig wischen, die Leiste blieb hängen (#441, neu gebaut in 3.99.6: 66.23); dazu zeigte „Strom“ am Handy nichts an (#442, neu: 66.24), am Handy gab es keine Raum-Schilder (#444, neu: 66.10), und unten soll Uhrzeit und Wetter stehen (#445, neu: 66.25).

**Davor geprüft (2026-10-17): ✅** 10.2 und 10.3 (Wandtablet: zurück zur Startansicht, Bildschirmschoner), 13.3 bis 13.5 (Import mit Keller und Anbau), der ganze Abschnitt 20 (erster Start), 21.4 (Hinweis auf neue Version), die ganzen Abschnitte 24 bis 27 (Treppen über mehrere Etagen, Solarpanels, Wasser-, Gas- und Wärmezähler, Brücke und die Nachträge 27.5 bis 27.8), 29 (Treppenhaus) und 30 (weniger aus Versehen antippen), 31.1 und 31.3 (Abschnitt 31 damit fertig; 31.1 war ❌, geht jetzt), 60.9 (Geländer der Wendeltreppe pro Etage, #318), die ganzen Abschnitte 38 (Kugeln, Startansicht, Backup-Fenster), 39 (LED-Ring-Abschnitte farbig), 40 und 41 (Rollläden und Rollladen-Karte).

<details>
<summary>Ältere Prüflisten bis 3.94 (ausführlich, zum Nachschlagen)</summary>

**Davor geprüft (2026-10-10): ✅** der ganze Abschnitt 28 (Nachbarhaus und Brücke), 21.5, 21.6, 18.3, 18.7, 18.8 (Abschnitt 18 damit fertig), 9.6, 9.7 (Backup, automatisches Speichern) und 6.1 bis 6.3 (Kameras). 10.1 entfällt: die Raum-Zuordnung fürs Wandtablet läuft jetzt über „Benutzer & Tablets“.

**Am Vortag geprüft (2026-10-09): ✅** 36.11 (Handy quer), der ganze Abschnitt 32 (Dächer verschieben und Größe ziehen), 31.2 und 31.4 bis 31.7. **❌ 31.1**: bei der Wandtreppe mit „Etagen“ 2 ist noch ein langer Lauf vorhanden (#318, vorerst nur notiert). Ebenso am selben Tag ✅: 10.4 und 10.5 (Leistungsmodus, Benutzer sehen nur ihren Raum), 37.1 bis 37.5 (Handy hochkant, Leistungsanzeige), 37.7 und 37.8 (mehrere zusammen verschieben). Ebenso am selben Tag: der ganze Abschnitt 33 (nur die Kugel zählt im Live-Modus) und der ganze Abschnitt 34 (ausgebauter Dachstuhl). Am selben Tag davor ebenso ✅: 7.1a, 11.6, 14.4, 16.4, 17.4, 18.1, 18.2, 18.4 bis 18.6, 18.9, 18.10, 19.1 bis 19.5, 21.2, 21.3, der ganze Abschnitt 22 (22.1 bis 22.9) und 23.1 bis 23.16: Öffnungs-Auswahl gruppiert, Benutzer nach Update wieder da, Haus ohne Keller, Gauben in der Demo, Werkzeugleiste, automatische Sicherung, Versionsanzeige mit Prüfsumme, Ansicht-Knopf, Halbschnitt, durchsichtige Wände, Zurück-Zoomen im Live, Heizungs-Panel, weitere Dächer, Küchenzeile, Strom-Editor mit Kabeln und Kamera-Sichtkegel.

**Davor geprüft (2026-10-08): ✅** 36.1 bis 36.10 und 36.12 bis 36.14: Gaubenfenster (Name, Kontakt, löschen, in der Wand, „Vorderseite auf die Wand“), Dach über dem Raum durchsichtig, Handy-Menü ☰, kein Hineinzoomen bei der Suche, Raum-Karte, Tablet/PC unverändert, Etagen- und Zimmer-Listen, alles auf einen Blick. Ebenso ✅ das Löschen mehrerer Dinge (Punkt 15 unten). Daraus kam der Wunsch „mehrere zusammen verschieben“, eingebaut in 3.62.0 (37.7, 37.8). Später am selben Tag ebenso ✅: 36.15 (Wand teilen), der ganze Abschnitt 35 (Gauben im ausgebauten Dachstuhl, „Dach beginnt auf Etage“, Firsthöhe, Haken weg) und 34.1 bis 34.3 (Kniestock).

**Prüfen ab 3.62** (ausführlich in Abschnitt **37** unten)
2. ✅ (2026-10-09) **Neu: mehrere zusammen verschieben** (3.62.0, 37.7 und 37.8): Bearbeiten, Werkzeug „Auswählen“, Ansicht **2D** oder **2D + 3D**. Mit **Strg/Shift + Klick** (oder Strg/Shift + Rahmen ziehen) mehrere Dinge auswählen, z. B. Raum, Wände, Lampe und Sofa. Dann **ohne** Strg/Shift auf eins davon drücken und **ziehen**: **alle** wandern zusammen und bleiben ausgewählt (grüner Rahmen). Wände, die an einer mitgezogenen Wand hängen, werden länger/kürzer und bleiben verbunden; Türen und Fenster wandern mit ihrer Wand. **Strg+Z** holt alles in einem Schritt zurück. Nur **klicken** (nicht ziehen) auf eins davon: nur dieses ist dann ausgewählt.
3. ✅ (2026-10-09) **Leistungsanzeige** (3.60.0, 37.5): unten „Ansicht“ → „⏱ Leistung“ auf „FPS“, dann „alle Werte“, dann „aus“.
4. ✅ (2026-10-09) **Handy hochkant** (3.59.0 bis 3.60.1, 37.1 bis 37.4): Knopf 📊 oben; in „Ganzes Haus“ kleine Etagen-Karten rechts neben dem Haus, auch beim Hineinzoomen.
5. **Benutzer sperren** (3.61.0, 37.6): „Benutzer“ → „⚙“ → „🔒 Gesperrt“: Haken setzen, schließen, wieder öffnen, die Haken sind noch da.

**Neu in 3.66** (ausführlich in Abschnitt **38** unten)
8. ✅ (2026-10-17) **Kugeln verdecken sich nicht mehr** (38.1): Live, schräg von oben auf Lampen schauen, drehen.
9. ✅ (2026-10-17) **Startansicht wählen** (38.2, 38.3): Ansicht einstellen, ⚙ → „📌 Aktuelle Ansicht übernehmen“, neu laden.
10. ✅ (2026-10-17) **Sicherheit über die ganze Breite** (38.5) und **„🗄️ Backup“ oben** (38.6).
11. ✅ (2026-10-17) **Keine dunkle Fläche beim Platzieren** (38.8): „2D + 3D“, Werkzeug „Treppe“.

**Neu in 3.67** (ausführlich in Abschnitt **39** unten)
12. ✅ (2026-10-17) **LED-Ring-Abschnitte farbig** (39.1, 39.2): Bearbeiten, LED-Ring in mehrere Abschnitte teilen, in 2D und 3D schauen.

**Neu in 3.69** (ausführlich in Abschnitt **40** unten)
13. ✅ (2026-10-17) **Rollladen an jedem Fenster, auch an der Gaube** (40.1 bis 40.6): Bearbeiten, ein Fenster anklicken, Haken „Rollladen“. Live: die Kugel 🪟 über dem Küchenfenster antippen, „Hoch“ / „Runter“ und Schieber ausprobieren.

**Neu in 3.70** (ausführlich in Abschnitt **41** unten)
14. ✅ (2026-10-17) **Rollladen-Karte wie in Home Assistant** (41.1 bis 41.5): Live, am Handy die Kugel 🪟 **über** einem Fenster mit Rollladen antippen. Die Karte zeigt **nur den Rollladen** (nicht den Fensterkontakt), einen großen Schieber, Hoch / Stopp / Runter und 0 / 25 / 50 / 75 / 100 %; den Schieber ziehen oder eine Stufe antippen.

**Neu in 3.71** (ausführlich in Abschnitt **42** unten)
15. **Lange Schleppgaube** (42.1 bis 42.6, #339): Bearbeiten, Etage „Dach“, „Etage verwalten“ aufklappen. Bei einer Gaube „Dachform der Gaube“ auf **„Schleppgaube“** stellen, „Breite“ z. B. 6 m, **„Abstand vom Giebel“** z. B. 3 m. In 3D: die Wand geht vorne senkrecht hoch, das Dach der Gaube läuft flacher bis ins Hauptdach, links und rechts davon ist wieder normale Schräge.
16. **Neu in 3.72: ein Fenster pro Raum unter der Schleppgaube** (43.1 bis 43.4, #341): bei der Schleppgaube den Haken „Fenster“ aus. Dann die Etage darunter öffnen und mit dem Werkzeug „Tür/Fenster“ in die Wand jedes Raums unter der Gaube ein Fenster setzen. Von außen sind die Fenster jetzt **durch die Gaube** zu sehen.

**Neu in 3.73** (ausführlich in Abschnitt **44** unten)
17. **Dach mit Absatz** (44.1 bis 44.6, #342): Bearbeiten, Etage „Dach“, Ansicht **2D**. Das Dach anklicken, dann **Doppelklick auf die Dachkante** an der Stelle, wo das Haus breiter wird. Die **Raute** des vorderen Teils nach innen ziehen. In 3D: das Dach ist vorne schmaler, der First bleibt gerade.

**Neu in 3.74** (ausführlich in Abschnitt **45** unten)
18. **Schleppgaube bis zur Kante, Ecken einzeln ziehen** (45.1 bis 45.3, #345): bei der Schleppgaube „Abstand vom Giebel“ auf **0** stellen: sie geht bündig bis an die Dachkante. Im 2D-Plan beim Dach mit Absatz die **Kreise** an einem Absatz einzeln ziehen.

**Neu in 3.75** (ausführlich in Abschnitt **46** unten)
19. **So sieht die Karte aus, schon in der Demo** (46.1, #13): `https://burned4aim.github.io/HA-Floorplanner/?card=1&floor=house&heatmap=temp&theme=light` öffnen: das ganze Haus, hell, mit Temperaturfarben, ohne Werkzeugleiste.
20. **Das Haus auf dem Dashboard, nur in Home Assistant** (46.3 bis 46.9, #13): Add-on auf 3.77.1 aktualisieren. **Wichtig:** bis 3.77.0 fand die Karte das Add-on in neuen Home-Assistant-Versionen nicht (#352). In HACS bei „3D Floorplan Card“ auf **3.77.1** aktualisieren (oder ⋮ → „Erneut herunterladen“) und den Browser mit Strg+F5 neu laden. In HACS → ⋮ → **Benutzerdefinierte Repositories** `https://github.com/BuRnEd4AiM/HA-Floorplanner` mit Typ **Dashboard** hinzufügen, **3D Floorplan Card** herunterladen, Browser neu laden. Dann ein Dashboard bearbeiten → **Karte hinzufügen** → **3D Floorplan**. Im Editor eine Etage wählen und speichern: das Haus erscheint in der Karte, ein Tipp auf eine Lampen-Kugel schaltet sie.

**Neu in 3.76** (ausführlich in Abschnitt **47** unten)
21. **Durchsichtig: nur die Wand, nicht Fenster und Türen** (47.1, 47.2, #350): unten „Ansicht“ → **„Durchsichtig“** einschalten, die Kamera um das Haus drehen. Die Wände zur Kamera werden durchsichtig, **Fenster, Türen und Möbel bleiben normal sichtbar**.

**Neu in 3.77** (ausführlich in Abschnitt **48** unten, nur im Add-on: die Demo hat keinen Import)
22. **Musterhaus mit allem drin** (48.1 bis 48.5, #353): Bearbeiten, links „Häuser“ aufklappen, **„Haus aus JSON importieren …“**, dann **„Beispiel: Musterhaus (alles drin)“**, **Prüfen**, **Importieren**. Danach „Ganzes Haus“ und jede Etage ansehen. Zum Schluss das Musterhaus wieder löschen, wenn du es nicht behalten willst.

**Neu in 3.80** (ausführlich in Abschnitt **49** unten)
23. **Küchenzeile ohne Oberschrank über einzelnen Modulen** (49.1 bis 49.4, #372): Bearbeiten, die Küchenzeile anklicken. In der Modul-Liste steht in jeder Zeile neben der Breite ein Haken: beim gewünschten Modul wegnehmen. In 3D ist nur dort der Oberschrank weg, Unterschrank und Arbeitsplatte bleiben.

**Neu in 3.82** (ausführlich in Abschnitt **50** unten)
24. **Strom-Rechnung: welcher Sensor ist was** (50.1 bis 50.8, #378, #379): Bearbeiten, **„Strom-Editor“** drücken, dann daneben **„⚡ Rechnung“**. Oben steht die Rechnung mit den Werten von jetzt. In der Demo: Erzeugung 3,20 kW, + Bezug 450 W, − Batterie lädt 600 W, **= Hausverbrauch 3,05 kW** (vorher stand oben links fälschlich 3,65 kW, weil die Batterie fehlte). Darunter Netz, Erzeugung, Batterie, Hausverbrauch und Räume einstellen und sehen, wie sich die Rechnung und die Strom-Anzeige oben links ändern.

**Neu in 3.84** (ausführlich in Abschnitt **51** unten)
25. **Über 50 neue Möbel im Stil der bekannten skandinavischen Klassiker** (51.1 bis 51.8): Bearbeiten, Werkzeug **„Gerät“**, links in der Bibliothek blättern (neue Gruppen **„Kinder“** und **„Flur“**) oder im Suchfeld z. B. **„kallax“**, **„billy“**, **„poäng“** oder **„blåhaj“** eingeben. Ein Teil setzen, anklicken und rechts bei **„Ausführung“** z. B. Eiche oder Schwarzbraun wählen.

**Neu in 3.85** (ausführlich in Abschnitt **52** unten)
26. **Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED** (52.1 bis 52.6): Bearbeiten, Werkzeug **„Gerät“**, links die neuen Gruppen **„Sauna & Wellness“**, **„Fitness“**, **„Bar“** und **„Heimkino“** ansehen (die PCs stehen bei **„Büro“**, die LED-Spiegel bei **„Bad“**), oder im Suchfeld z. B. **„sauna“**, **„laufband“**, **„beamer“**, **„spiegel“** eingeben.
27. **Spiegel mit mehreren LEDs, jede einzeln verknüpft** (52.7 bis 52.10): den **„LED-Spiegel mit 3 Zonen“** an eine Wand setzen, anklicken, rechts unter **„LEDs einzeln verknüpfen“** für „Hinten (indirekt)“, „Vorne“ und „Unten“ je ein Licht wählen. Dann **„Live“** und den Spiegel antippen: ein Knopf pro LED.

**Neu in 3.86** (ausführlich in Abschnitt **53** unten)
28. **Gaming-PC-Arbeitsplatz mit anderen Bildschirmen** (53.1, 53.2): den „Gaming-PC-Arbeitsplatz“ (Gruppe „Büro“) setzen, anklicken, rechts bei **„Anordnung“** z. B. „Curved + 2 hochkant“ wählen.
29. **Große Spiegel mit zwei LEDs** (53.3): die „Spiegelwand mit LED“ (Gruppe „Fitness“) oder den „Ganzkörperspiegel mit LED“ (Gruppe „Flur“) anklicken: unter „LEDs einzeln verknüpfen“ stehen „Hinten (indirekt)“ und „Vorne“.

**Neu in 3.87** (ausführlich in Abschnitt **54** unten)
30. **Fernseher am Schwenkarm** (54.1 bis 54.4): im Suchfeld **„schwenkarm“** eingeben, den **„Wand-TV mit Schwenkarm“** an eine Wand setzen, anklicken und rechts **„Schwenken“**, **„Abstand zur Wand“** und **„Neigen“** ändern; bei **„Hintergrundlicht“** ein Licht wählen.
31. **Klimageräte und Ventilatoren** (54.5 bis 54.8): links die neue Gruppe **„Klima & Lüftung“**; ein Klimagerät mit seinem Thermostat (`climate.…`) verknüpfen und in „Live“ auf Kühlen und Heizen stellen.

**Neu in 3.88** (ausführlich in Abschnitt **55** unten)
32. **Etagen aufeinander wie ein echtes Haus** (55.1 bis 55.5): „Ganzes Haus“, unten „Ansicht“ → **„Aufeinander“**. Die Etagen sitzen ohne Lücke aufeinander, dazwischen eine Decke. In „Live“ bleiben die Kugeln und Schilder vom Erdgeschoss im Erdgeschoss und schweben nicht mehr über dem 1. Stock.
33. **Kein schwarzes Loch unter dem Erdgeschoss** (55.6, #391): den 1. Stock öffnen: das Erdgeschoss darunter ist blass, steht aber auf Boden, nicht über einem schwarzen Loch.
34. **Ganzes Haus: alle Etagen zeigen ihre Lampen** (55.7, #392): erst das Erdgeschoss öffnen, dann „Ganzes Haus“ und „Live“: auch die Lampen im 1. Stock haben ihre Kugeln und leuchten.

**Neu in 3.89** (ausführlich in Abschnitt **56** unten)
35. **Flüssig auf dem iPad, auch mit dem Musterhaus** (56.1 bis 56.3, #394): das Musterhaus („alles drin“) öffnen, auf dem iPad drehen und zoomen, auch „Ganzes Haus“: es soll nicht mehr ruckeln. Alles sieht aus wie vorher.
36. **„Aufeinander“ auch bei einer Etage** (56.4 bis 56.6, #396): eine Etage öffnen (z. B. Obergeschoss), unten „Ansicht“ → **„Aufeinander“**: die Etage sitzt direkt auf der Etage darunter, deren Schilder schweben nicht mehr darüber. Im Benutzer-Fenster lässt es sich pro Benutzer vorgeben und sperren.

**Neu in 3.90** (ausführlich in Abschnitt **57** unten)
37. **Garage, Werkstatt und Carport einrichten** (57.1 bis 57.5): Bearbeiten, Werkzeug **„Gerät“**, links die neuen Gruppen **„Fahrzeuge“**, **„Werkstatt“** und **„Garage & Carport“** ansehen. Ein Auto, das Wohnmobil und die Werkbank in die Garage stellen: passt alles hinein? Ein Auto anklicken und rechts bei **„Ausführung“** die Farbe ändern.
38. **Licht am Auto und in der Werkstatt** (57.6, 57.7): das Auto mit einem Schalter verknüpfen, in „Live“ einschalten: Scheinwerfer und Rücklichter leuchten. Die „LED-Werkstattleuchte“ an die Decke setzen und schalten: sie erhellt die Garage.
39. **Musterhaus mit Garage und Hof** (57.8, nur im Add-on): das Musterhaus neu importieren: in der Garage stehen der blaue Kombi, die Werkbank und ein Fahrrad an der Wand, vorne rechts ist ein Hof mit drei Carports, Wohnmobilen, Wohnwagen und einer Hebebühne.

**Neu in 3.91** (ausführlich in Abschnitt **58** unten)
40. **Messen mit der Taste M** (58.1 bis 58.3, #399): Bearbeiten, Taste **M** drücken (oder oben **„Messen“**): es öffnet sich 2D + 3D. Zwei Punkte im Plan anklicken: die Linie mit ihrer Länge erscheint, rechts stehen die Maße.
41. **Zwei Wände genau einstellen** (58.4 bis 58.8): zwei gegenüberliegende Wände eines Raums nacheinander anklicken, rechts beim **„Innenmaß (Wand bis Wand)“** (bis 4.2.0 „Lichter Abstand“) z. B. 4 eintippen und **„Setzen“**: die orange Wand rückt genau dorthin, die Wände daneben und der Raum ziehen mit. Dann zwei Wände in einer Ecke anklicken und den **„Winkel“** auf z. B. 120 stellen. Strg+Z macht es rückgängig.

**Neu in 3.92** (ausführlich in Abschnitt **59** unten)
42. **Bar mit Deckenteil** (59.1 bis 59.5, #401): Bearbeiten, die Bar über Eck anklicken (oder eine neue aus der Gruppe „Bar“ setzen), rechts bei **„An der Decke“** z. B. **„Gläserregal mit hängenden Gläsern“** wählen: über der Theke hängt jetzt ein Regal in L-Form mit Gläsern. Probiere auch **„Deckensegel mit LED“** und **„Pendelleuchten“**.
43. **Eigenes Licht für das Deckenteil** (59.6, 59.7): unten bei **„LEDs einzeln verknüpfen“** beim **„Deckenteil“** ein Licht wählen, dann in „Live“ die Bar antippen: das Deckenteil hat einen eigenen Knopf.

**Neu in 3.93** (ausführlich in Abschnitt **60** unten)
44. **Wiederholen** (60.1 bis 60.3, #404): Bearbeiten, eine Lampe anklicken und mit den Pfeiltasten verschieben, **Strg+Z** (zurück), dann **Strg+Y** (wieder vor). Oben neben „Speichern“ gibt es dafür auch die Knöpfe **↶** und **↷**.
45. **Kopieren und Einfügen** (60.4 bis 60.8, #405): eine Lampe anklicken, **Strg+C**, dann **Strg+V**: eine zweite Lampe steht etwas daneben. **Strg+D** verdoppelt direkt. Auf eine andere Etage wechseln und **Strg+V**: dieselbe Lampe steht dort an derselben Stelle. Ein Fenster anklicken und **Strg+D**: ein zweites Fenster in derselben Wand.
46. ✅ (2026-10-17) **Wendeltreppe: Geländer pro Etage** (60.9, #318): eine Wendeltreppe mit „Etagen“ 2 setzen und von der Seite ansehen: auf der Etage dazwischen hört das Geländer am Podest auf und fängt danach neu an, man kann dort aussteigen.
47. **Schutz beim Speichern** (60.10 bis 60.12, #403, nur im Add-on): den Plan auf zwei Geräten (oder in zwei Fenstern) im Bearbeiten öffnen, auf dem einen etwas ändern, dann auf dem anderen: es kommt die Frage **„Plan wurde woanders geändert“**.

**Neu in 3.94** (ausführlich in Abschnitt **61** unten, #409)
48. **Mehrere Gebäude in einem Plan** (61.1 bis 61.5): Bearbeiten, rechts **„🏘 Gebäude in diesem Plan“** aufklappen, zweimal **„+ Gebäude“**, z. B. „Haupthaus“ und „Gartenhaus“ eintippen. Bei den Räumen des Erdgeschosses jeweils das Gebäude wählen: die Räume darüber zeigen „automatisch (Haupthaus)“.
49. **Umschalten** (61.6 bis 61.9): oben erscheint **„🏘 Alle Gebäude“**. „Gartenhaus“ wählen: nur das Gartenhaus ist zu sehen (3D und 2D), die Etagen ohne Gartenhaus verschwinden links. Dann **„🏠 Jedes Gebäude bekommt sein eigenes Dach“** drücken.
50. **Pro Benutzer / Tablet** (61.10, 61.11): „Benutzer“ → bei einem Benutzer ⚙ → **„Gebäude“** wählen und bei „🔒 Gesperrt“ **„Gebäude wechseln“** abhaken: dieser Benutzer sieht nur sein Gebäude.
51. **Anderes Haus hereinholen** (61.12, 61.13): im selben Abschnitt unten ein anderes Haus der Liste wählen, **„⤵ Hereinholen“**: es wird ein Gebäude dieses Plans.

**Noch offen aus Abschnitt 36**
6. ✅ (2026-10-09) **Handy quer** (36.11): die Etagen-Knöpfe stehen oben als kleine Pillen und verdecken den Kompass nicht; die Knöpfe unten rutschen nicht aus dem Bild.
7. **Demo-Hinweis** (3.55.0): der Hinweis „Demo · changes are not saved“ unten verschwindet nach ein paar Sekunden und verdeckt die Knöpfe unten nicht.

**Noch von 3.53.0 offen** (falls schon geprüft: bitte kurz Bescheid geben, dann trage ich es ein)

**A. Live-Modus** (oben „Live“ drücken)
2. Über jeder Lampe, Kamera, dem Fernseher, Rollladen-Schalter usw. schwebt eine **größere Kugel mit kleinem Symbol** (💡 🪟 📷 📺 🌡 …). Unter Deckenlampen hängt sie **darunter**. Kugeln, die dicht beieinander liegen, rücken etwas auseinander und **verdecken sich nicht** (auch nicht die Wert-Schilder).
3. Lampe an: die Kugel leuchtet in der **Lichtfarbe**, aus: grau-blau. Ein **Tipp auf die Kugel** öffnet bzw. schaltet das Gerät.
2a. ✅ (2026-10-09) **Neu: nur die Kugel zählt** (3.51.0, #262): die Kugeln sind **größer**. Auf eine **Lampe selbst** (nicht auf ihre Kugel) tippen: es passiert **nichts** am Gerät, der Tipp geht in den Raum (wie ein Tipp ins Leere). Auf die **Kugel** tippen: das Gerät öffnet bzw. schaltet sich. Ein LED-Ring lässt sich weiter **Abschnitt für Abschnitt** antippen. Geräte **ohne** Kugel verhalten sich wie bisher.
4. ✅ (2026-10-17, 30.1 bis 30.4) Auf die **Anwesenheits-Figur**, einen **Temperatur-/CO₂-Sensor** und den **Sichtkegel der Kamera** tippen: es passiert **nichts**. Auf die **Kamera selbst** tippen: das Kamerabild öffnet sich.
5. Oben die **Energie-Anzeige** zeigt nur Strom. **Daneben ein eigenes Feld** „🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh“. Unten „Strom“ drücken: nur das Strom-Feld leuchtet blau.
4a. ✅ (2026-10-17, 31.3) Treppe über 2 Etagen (z. B. Wendeltreppe mit „Etagen“ 2): im **Live** endet sie auf der gewählten Etage, **nichts darüber**. Im **Bearbeiten** ist der obere Teil durchsichtig zu sehen.

**B. Treppen** (oben „Bearbeiten“, Werkzeug „Treppe“)
6. ✅ (2026-10-17, 29.1, 29.2) **Treppenhaus** mit „Etagen“ 2 im Garten setzen: auf jeder Etage Wände, Raum, **Podest vor der Treppe mit Tür**; in 3D kommt die U-Treppe auf jeder Etage an.
7. ✅ (2026-10-17, 29.6, 31.3) Nur **eine Etage** ansehen (nicht „Ganzes Haus“): im Bearbeiten ist der obere Teil der Treppe **durchsichtig** zu sehen, im Live fehlt er (Punkt 4a), nichts Festes schwebt.
8. ✅ (2026-10-17, 29.3) **L- oder U-Treppe**: in den Eigenschaften „Podest nach dem Knick“ z. B. 0,8 → das Podest an der Wende wird tiefer.
9. ✅ (2026-10-17, 29.7, 31.1) **Wandtreppe** um eine Ecke zeichnen, an der Ecke ruhig zweimal klicken: **ebenes Podest**, keine Stufe mittendrin. Mit „Etagen“ 2: dieselbe Treppe **noch einmal eine Etage höher**. ❌ (2026-10-09, 31.1): noch ein langer Lauf vorhanden, #318. Gemeint war die **Wendeltreppe**: ihr Geländer lief über alle Etagen durch, repariert in 3.93; Nachtest 2026-10-17 ✅.
10. ✅ (2026-10-17, 29.8) **Wendeltreppe** (in der Demo von der Garage auf die Dachterrasse): oben ein **Viertelkreis-Podest** zum Aussteigen; mit „Etagen“ 2 auf **jeder Etage** eines.

**C. Zwei Häuser und Brücke**
11. ✅ (2026-10-10, 28) Oben in der Auswahl gibt es **„Demo-Haus“ und „Nachbarhaus“**. „Ganzes Haus“: beide stehen nebeneinander, die **Brücke** führt von Dachterrasse zu Dachterrasse, das **Geländer ist an beiden Enden offen**.
12. ✅ (2026-10-10, 28.8) Brücke anklicken (Etage Obergeschoss), „Höhenunterschied am Ende“ auf **1,2** stellen: die Brücke bekommt **Stufen**.
13. ✅ (2026-10-10, 28.2) „Häuser & Backup“ → Nachbarhaus: „Höhe“ oder „Lage X“ ändern → es rückt mit (Abschnitt 28).

**D. Sonstiges**
14. ✅ (2026-10-09, 31.7) **Strom-Editor** einschalten, dann ein anderes Werkzeug wählen: der Knopf „Strom-Editor“ **bleibt blau**.
15. ✅ (2026-10-17, 27.5) Im Kamera-/Offline-Menü oder bei „n offen“ einen Eintrag wählen: die Kamera **fliegt hin** (wie bei der Suche).
16. ✅ (2026-10-08) **Mehrere löschen** (Bearbeiten, Werkzeug „Auswählen“, 2D oder 2D + 3D): **Strg** (oder Shift) gedrückt halten und mehrere Dinge anklicken, sie bekommen einen grünen Rahmen. Oder **Strg/Shift gedrückt halten und ziehen**: ein grüner Rahmen, alles darin wird ausgewählt. Dann **Entf** drücken (oder rechts „Alle n löschen“): alles weg. **Strg+Z** holt alles zurück.
17. **Schilder der Etagen darunter** (#249): eine obere Etage öffnen, unten „Ansicht“ → **„Schilder darunter“** ausschalten: die Raumnamen und Werte-Schilder der Etagen darunter verschwinden. „Ganzes Haus“ zeigt trotzdem alles. Wieder einschalten: sie sind zurück. (Auch im Zahnrad unter „Aussehen“.)
18. **Voreinstellungen pro Benutzer/Tablet** (#250): oben „Benutzer“ → bei einem Benutzer **„⚙ Voreinstellungen“** → z. B. „Wände zur Kamera: Durchsichtig“ wählen. Der Knopf zeigt dann „⚙ 1 gesetzt“. Mit diesem Benutzer (Tablet) angemeldet startet die Ansicht so. Bei dir selbst ändert sich nichts. (In der Demo-Datei gibt es nur einen Benutzer: hier nur prüfen, dass das Kästchen aufgeht und sich merkt, was du wählst.)
19. **Doppelklick schaltet** (#251): im Bearbeiten (3D oder 2D) doppelt auf eine Lampe klicken: sie geht an bzw. aus (das ging zuletzt nicht).
20. **Alles wie immer**: Wände/Räume zeichnen, Geräte setzen und ziehen, Türen setzen, Entf/Pfeiltasten/Q/E, Strg+Z, Live-Antippen. Hinter den Kulissen wurde viel umgebaut (die Hauptdatei ist von gut 2.000 auf knapp 1.500 Zeilen geschrumpft); es soll sich **nichts** anders anfühlen. Wenn doch: bitte melden.
21. **Dach verschieben** (#255): Bearbeiten, links die Etage **„Dach“** wählen. Aufs Dach klicken: rechts steht „Dach“ mit der Lage. **Noch einmal drücken und ziehen**: das Dach wandert mit, die Solarpanels darauf auch. Im **2D-Plan** (und 2D + 3D) sind die Dächer gestrichelt zu sehen und lassen sich genauso ziehen. Pfeiltasten schieben in kleinen Schritten, Strg+Z holt es zurück.
20a. **Neu: Dach ziehen ruckelt nicht mehr** (3.49.1, #257): wie bei 20 das Dach ziehen, einmal in **3D** und einmal im **2D-Plan**. Es soll **flüssig** mitwandern, ohne Hänger. Beim **Loslassen** sitzt das Dach genau dort, wo es beim Ziehen zu sehen war, die Solarpanels liegen weiter darauf.
20b. **Neu: Dachgröße ziehen** (3.50.0, #259): Etage „Dach“, **2D-Plan**, aufs Dach klicken. An den **4 Ecken und 4 Seitenmitten** erscheinen **weiße Kästchen**.
   - An einer **Ecke** ziehen: das Dach wird breiter/schmaler und tiefer/flacher, die **gegenüberliegende Ecke bleibt** stehen.
   - An einer **Seitenmitte** ziehen: nur diese Seite wandert.
   - Sehr weit nach innen ziehen: das Dach wird **nicht kleiner als 1 m**.
   - Mit gedrückter **Alt**-Taste ziehen: frei statt in 5-cm-Schritten.
   - **Loslassen**: das 3D-Dach hat die neue Größe, rechts stehen die neuen Maße.
   - **Strg+Z**: die alte Größe ist zurück.
   - Unter „Etage verwalten“ ist danach „Größe selbst festlegen“ angehakt und die Zahlen passen zum Plan.
20c. ✅ (2026-10-09) **Neu: ausgebauter Dachstuhl** (3.52.0, #260): Etage **„Dach“** wählen, rechts **„Etage verwalten“** öffnen, Haken bei **„Ausgebauter Dachstuhl“** setzen.
   - Das Dach rutscht nach unten und sitzt jetzt **im Dachgeschoss** auf einer 1 m hohen Wand (Kniestock).
   - Etage **„Dachgeschoss“** ansehen: die Wände sind **schräg abgeschnitten**, wo das Dach sie trifft (von der Giebelseite sieht man die Dachform).
   - Feld **„Kniestock“** auf z. B. 1,5 ändern: das Dach geht höher, die Schrägen schneiden weniger ab.
   - Gauben und Solarpanels wandern mit dem Dach mit.
   - Die Etage „Dach“ ist jetzt der **Spitzboden**: dort einen kleinen Raum zeichnen und etwas hinstellen (z. B. Kisten).
   - Haken wieder weg: alles wie vorher.
20d. ✅ (2026-10-08) **Neu: Gauben, mehrere Etagen, Firsthöhe** (3.53.0, #265): wie bei 20c den ausgebauten Dachstuhl einschalten.
   - **Gauben**: wo eine Gaube ist, geht die Wand darunter **bis unter die Gaube** hoch (bei einer Giebelgaube bis in die Spitze); daneben bleibt sie an der Schräge abgeschnitten. Gut zu sehen, wenn unten „Ansicht“ → „Auto“ aus ist.
   - **„Dach beginnt auf Etage“**: z. B. „Obergeschoss“ wählen: das Dach rutscht eine Etage tiefer, jetzt liegen Obergeschoss **und** Dachgeschoss unter der Schräge, beide werden abgeschnitten.
   - **„Firsthöhe“**: z. B. 4 eintippen: das Dach wird so hoch (über der Wand bzw. dem Kniestock), die Neigung passt sich an.
22. **Flüssiger** (#253): die Demo beim Drehen der Kamera: sollte spürbar weniger ruckeln.

Ausführlicher stehen die Punkte in den Abschnitten **28 bis 37** weiter unten.

</details>

## Übersicht: was ist geprüft?

Diese Tabelle **rechnet sich selbst aus** den Tabellen unten aus (`python3 tools/testprotokoll.py`). Sie wird bei jeder Änderung automatisch geprüft. Ergebnisse also nur unten eintragen, die Übersicht folgt. ❓ heißt: noch nicht getestet (oder kein Ergebnis eingetragen).

<!-- AUTO-UEBERSICHT-START: wird von tools/testprotokoll.py erzeugt, nicht von Hand ändern -->
| Abschnitt | ✅ geht | ❌ geht nicht | ❓ offen | ➖ nur Add-on | noch offen (❌ zuerst) |
|---|---:|---:|---:|---:|---|
| 1. Start und Grundansicht | 4 | 0 | 0 | 0 | – |
| 2. Etagen (linke Leiste) | 7 | 0 | 0 | 0 | – |
| 3. Etagen im 2D-Plan (3.19.1) | 7 | 0 | 0 | 0 | – |
| 4. Räume | 7 | 0 | 0 | 0 | – |
| 5. Farbansichten und Messwerte | 3 | 0 | 0 | 0 | – |
| 6. Kameras | 3 | 0 | 0 | 0 | – |
| 7. Türen, Fenster, Garage | 6 | 0 | 0 | 0 | – |
| 8. Live-Ansicht (echte Geräte) | 7 | 0 | 0 | 0 | – |
| 9. Bearbeiten | 7 | 0 | 0 | 0 | – |
| 10. Tablet und Bedienung | 5 | 0 | 0 | 0 | – |
| 11. Benutzer & Tablets (3.20.0) | 7 | 0 | 0 | 0 | – |
| 12. Dachgauben (3.21.0) | 8 | 0 | 0 | 0 | – |
| 13. Import eines Hauses mit Keller, Anbau und Dachgeschoss | 5 | 0 | 0 | 0 | – |
| 14. Erdreich unter Anbauten ohne Keller (Fehler #93) | 4 | 0 | 0 | 0 | – |
| 15. Dachgröße von Hand (3.22.0) | 6 | 0 | 0 | 0 | – |
| 16. Wiederholung der drei Fehler (3.22.0) | 4 | 0 | 0 | 0 | – |
| 17. Werkzeugleiste anpassen und Raumliste nach Haus (3.23.0) | 7 | 0 | 0 | 0 | – |
| 18. Automatische Sicherung (3.24.0) | 10 | 0 | 0 | 0 | – |
| 19. Version und Prüfsumme in der Leiste (3.25.0) | 5 | 0 | 0 | 0 | – |
| 20. Erster Start (3.26.0) | 8 | 0 | 0 | 0 | – |
| 21. Neu in 3.26.1 bis 3.27.1 | 6 | 0 | 0 | 0 | – |
| 22. Ansicht und Live-Bedienung (3.28.0) | 9 | 0 | 0 | 0 | – |
| 23. Demo-Rundgang für 3.29 bis 3.36 (Besitzer) | 17 | 0 | 0 | 0 | – |
| 24. Treppen: mehrere Etagen, Wandtreppe, Außen-Wendeltreppe (3.40.x) | 13 | 0 | 0 | 0 | – |
| 25. Solarpanels auf dem Dach (3.41.0) | 9 | 0 | 0 | 0 | – |
| 26. Wasser-, Gas- und Wärmezähler (3.42.0) | 4 | 0 | 0 | 0 | – |
| 27. Metallbrücke / Übergang (3.43.0) | 8 | 0 | 0 | 0 | – |
| 28. Nachbarhaus und Brücke zur Dachterrasse (3.44.0) | 8 | 0 | 0 | 0 | – |
| 29. Treppenhaus, Podest an der Wende, Ausgang auf jeder Etage (3.45.0) | 8 | 0 | 0 | 0 | – |
| 30. Live-Modus: weniger aus Versehen antippen (3.45.1) | 4 | 0 | 0 | 0 | – |
| 31. Treppen über mehrere Etagen, Zähler in der Übersicht (3.46.0) | 7 | 0 | 0 | 0 | – |
| 32. Dächer verschieben und ihre Größe ziehen (3.49.0 bis 3.50.0) | 9 | 0 | 0 | 0 | – |
| 33. Live-Modus: nur über die Kugel antippen (3.51.0) | 6 | 0 | 0 | 0 | – |
| 34. Ausgebauter Dachstuhl (3.52.0) | 8 | 0 | 0 | 0 | – |
| 35. Ausgebauter Dachstuhl: Gauben, mehrere Etagen, Firsthöhe (3.53.0) | 6 | 0 | 0 | 0 | – |
| 36. Gaubenfenster, Dach über dem Raum, Handy (3.54.0 bis 3.57.0) | 15 | 0 | 0 | 0 | – |
| 37. Neu in 3.59 bis 3.62 | 8 | 0 | 0 | 0 | – |
| 38. Neu in 3.66 | 8 | 0 | 0 | 0 | – |
| 39. Neu in 3.67 | 2 | 0 | 0 | 0 | – |
| 40. Neu in 3.69: Rollläden an den Fenstern | 6 | 0 | 0 | 0 | – |
| 41. Neu in 3.70: Rollladen-Karte | 5 | 0 | 0 | 0 | – |
| 42. Neu in 3.71: lange Schleppgaube | 6 | 0 | 0 | 0 | – |
| 43. Neu in 3.72: Fenster der Räume durch die Schleppgaube | 4 | 0 | 0 | 0 | – |
| 44. Neu in 3.73: Dach mit Absatz (Haus vorne schmaler, hinten breiter) | 6 | 0 | 0 | 0 | – |
| 45. Neu in 3.74: Schleppgaube bis zur Kante, Ecken einzeln ziehen | 3 | 0 | 0 | 0 | – |
| 46. Neu in 3.75: Karte für das Dashboard (46.1 in der Demo, der Rest nur in Home Assistant) | 2 | 0 | 7 | 0 | 46.3 bis 46.9 |
| 47. Neu in 3.76: Durchsichtig nur die Wand | 2 | 0 | 0 | 0 | – |
| 48. Neu in 3.77: Musterhaus mit allem drin (nur im Add-on, die Demo hat keinen Import) | 5 | 0 | 0 | 0 | – |
| 49. Neu in 3.80: Küchenzeile ohne Oberschrank über einzelnen Modulen | 4 | 0 | 0 | 0 | – |
| 50. Neu in 3.82: Strom-Rechnung (Reiter „⚡ Rechnung“ im Strom-Editor) | 8 | 0 | 0 | 0 | – |
| 51. Neu in 3.84: Möbel im skandinavischen Stil | 8 | 0 | 0 | 0 | – |
| 52. Neu in 3.85: Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED-Zonen | 12 | 0 | 0 | 0 | – |
| 53. Neu in 3.86: Bildschirme am Gaming-PC-Arbeitsplatz, große Spiegel mit zwei LEDs | 3 | 0 | 0 | 0 | – |
| 54. Neu in 3.87: Fernseher am Schwenkarm, Klimageräte und Ventilatoren | 8 | 0 | 0 | 0 | – |
| 55. Neu in 3.88: Etagen aufeinander wie ein echtes Haus | 7 | 0 | 0 | 0 | – |
| 56. Neu in 3.89: flüssig auf dem iPad, „Aufeinander“ auch bei einer Etage | 5 | 0 | 2 | 0 | 56.1, 56.2 |
| 57. Neu in 3.90: Garage, Werkstatt und Carport | 7 | 0 | 0 | 1 | – |
| 58. Neu in 3.91: Messen, Abstand und Winkel zweier Wände | 8 | 0 | 0 | 0 | – |
| 59. Neu in 3.92: Bar mit Deckenteil | 7 | 0 | 0 | 1 | – |
| 60. Neu in 3.93: Wiederholen, Kopieren und Einfügen, Schutz beim Speichern, Geländer der Wendeltreppe | 9 | 0 | 0 | 3 | – |
| 61. Neu in 3.94: mehrere Gebäude in einem Plan (#409) | 11 | 0 | 0 | 2 | – |
| 62. Neu in 3.95: Energie leichter einrichten (#407) | 4 | 0 | 0 | 3 | – |
| 63. Neu in 3.96: mehr Geräte direkt im Plan steuern (#406) | 8 | 0 | 0 | 3 | – |
| 64. Neu in 3.97: Alarm per WhatsApp (#414) | 0 | 0 | 0 | 6 | – |
| 65. Neu in 3.98: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste (#418 bis #422) | 14 | 0 | 0 | 3 | – |
| 66. Neu in 3.99: echte Böden, dunkle Fensterrahmen, Glas-Optik, Raum-Schilder (#427 bis #430) | 24 | 0 | 0 | 1 | – |
| 67. Neu in 4.0: Wände mit Oberfläche, viel mehr Böden, Muster anpassen, Fassade (#448) | 12 | 0 | 0 | 2 | – |
| 68. Neu in 4.0.1: Einstellungen in Gruppen, Suche, was die Alarmanlage ist (#450) | 8 | 0 | 0 | 1 | – |
| 69. Neu in 4.0.2: Gebäude-Filter richtig (#451) | 3 | 0 | 0 | 1 | – |
| 70. Neu in 4.0.3: Benutzer & Tablets in den Einstellungen, WhatsApp leichter einrichten (#454) | 7 | 0 | 0 | 0 | – |
| 71. Neu in 4.1: Urlaubs-Alarm mit Sperrbildschirm, Telegram, Dienste ankreuzen (#456) | 10 | 0 | 0 | 4 | – |
| 72. Neu in 4.1.1: Streifen statt Sperrbildschirm für Bearbeiter, Dienste nach Herkunft, eigener Telegram-Bot (#460) | 7 | 0 | 0 | 2 | – |
| 73. Neu in 4.1.2: die Demo durchgesehen, Raum-Schilder aus „Bearbeiten“ (#462) | 7 | 0 | 0 | 0 | – |
| 74. Neu in 4.1.3: Ganzes Haus mit Raum-Schildern (#464) | 2 | 0 | 0 | 0 | – |
| 75. Neu in 4.1.4: Raumfarben im 2D-Plan bei „Temp.“ (#467) | 2 | 0 | 0 | 0 | – |
| 76. Neu in 4.2.0: Schnellzugriff, Licht-Gruppen, Favoriten und Hilfen beim Bearbeiten (#471) | 14 | 0 | 0 | 1 | – |
| 77. Neu in 4.2.1: Saugroboter sichtbar, Hausmodus mit Knöpfen, „Innenmaß“ beim Messen (#473, #474) | 5 | 0 | 0 | 1 | – |
| 78. Neu in 4.3.0: Reiter unten, Kamera-Seite, Reiter pro Benutzer, Tablet ohne Seitenleiste (#479) | 11 | 0 | 0 | 3 | – |
| 79. Neu in 4.4.0: ☀ Heute und ⚡ Energie (#481) | 13 | 0 | 0 | 3 | – |
| 80. Neu in 4.5.0: 🌡 Klima, ▶ Abläufe und 👨‍👩‍👧 Familie mit Pinnwand (#483) | 17 | 0 | 0 | 4 | – |
| 81. Neu in 4.6.0: Seiten bearbeiten wie ein Home-Assistant-Dashboard (#484) | 12 | 0 | 0 | 3 | – |
| 82. Neu in 4.7.0: Vollbild fest für einen Benutzer, beenden nur mit Code (#487) | 8 | 0 | 0 | 2 | – |
| 83. Neu in 4.8.0: 🎵 Musik & TV und 🧺 Haushalt (#490) | 12 | 0 | 0 | 4 | – |
| 84. Neu in 4.8.1: Zustände auf Deutsch in der Geräte-Liste (#492) | 1 | 0 | 0 | 0 | – |
| 85. Neu in 4.8.2: Tablets schneller (#494) | 0 | 0 | 4 | 0 | 85.1 bis 85.4 |
| 86. Neu in 4.9.0: Thermostat als Kreis wie in Home Assistant (#495) | 9 | 0 | 0 | 0 | – |
| 87. Neu in 4.10.0: Strom mehrerer Häuser in einer Grafik (#495) | 4 | 0 | 2 | 0 | 87.2, 87.6 |
| 88. Neu in 4.11.0: Abschnitte auf den Seiten wie in Home Assistant (#495) | 8 | 0 | 0 | 0 | – |
| 89. Neu in 4.12.0: Wer ist wirklich zu Hause (#495) | 4 | 0 | 2 | 0 | 89.5, 89.6 |
| 90. Neu in 4.13.0: Kalender-Karte mit mehreren Kalendern und „＋ Termin“ (#495) | 6 | 0 | 1 | 0 | 90.7 |
| 91. Neu in 4.14.0: Knöpfe gestalten (#495) | 6 | 0 | 1 | 0 | 91.7 |
| 92. Neu in 4.15.0: Zähler „von oben übernehmen“ und vollständigeres Backup (#501, #500) | 3 | 0 | 3 | 0 | 92.2, 92.3, 92.6 |
| 93. Neu in 4.16.0: Leistungs-Sensoren (W) als Zähler (#503) | 0 | 0 | 4 | 0 | 93.1 bis 93.4 |
| 94. Neu in 4.17.0: Docker-Version ohne Supervisor (#489) | 0 | 0 | 3 | 0 | 94.1 bis 94.3 |
| 95. Neu in 4.18.0: eine Seite in eigener Fassung je Benutzer (#507) | 10 | 0 | 0 | 0 | – |
| 96. Neu in 4.19.0: Sprachsuche mit 🎤 und Codewörtern (#509) | 10 | 0 | 1 | 3 | 96.1 |
| 97. Neu in 4.19.1: 🩺 Mikrofon-Test, 🎤 am Tablet und ohne https (#511) | 4 | 0 | 1 | 2 | 97.3 |
| 98. Neu in 4.20.0: 🎤 ohne https mit dem Diktat der Tastatur (#513) | 2 | 0 | 1 | 2 | 98.2 |
| 99. Neu in 4.21.0: 🔋 Ladestand der Batterien auf ⚡ Energie (#515) | 8 | 0 | 0 | 2 | – |
| 100. Neu in 4.21.1: iPhone, kein leerer Streifen unter der Reiter-Leiste (#517) | 0 | 0 | 1 | 2 | 100.3 |
| 101. Neu in 4.21.2: Funde aus dem Nacht-Test (#519 bis #525) | 6 | 0 | 1 | 0 | 101.1 |
| 102. Neu in 4.21.3: Tablet schneller, Komma, Demo nachts (#138, #527, #528) | 5 | 0 | 1 | 0 | 102.1 |
| 103. Neu in 4.22.0: 🔔 Klingel (Kamera auf jedem Tablet, #530) | 4 | 0 | 0 | 3 | – |
| 104. Neu in 4.23.0: 🔔 Sag mir Bescheid (#531) | 2 | 0 | 0 | 3 | – |
| 105. Neu in 4.24.0: 🗣 Schalten per Sprache (#532) | 5 | 0 | 1 | 1 | 105.6 |
| 106. Neu in 4.25.0: 🚗 Auto und 🌱 Garten auf 🧺 Haushalt (#533) | 4 | 0 | 0 | 2 | – |
| 107. Neu in 4.26.0: 🏡 Grundstück, Außenflächen, Maße und Garten-Deko (#538) | 8 | 0 | 0 | 0 | – |
| 108. Neu in 4.26.1: die 2D-Ansicht zeichnet kein verstecktes 3D-Bild mehr (#542) | 2 | 0 | 1 | 0 | 108.3 |
| 109. Neu in 4.27.0: 🗄 Schrank-Editor, Schrank nach Maß, auch unter der Dachschräge (#545) | 10 | 0 | 1 | 0 | 109.11 |
| 110. Neu in 4.28.0: Heiz-Regeln, Heizplan, „Wird benutzt“ und eigene Abläufe „Wenn … dann …“ (#546) | 13 | 0 | 0 | 2 | – |
| 111. Neu in 4.29.0: Abläufe werden echte Automationen in Home Assistant (#548) | 4 | 0 | 0 | 4 | – |
| 112. Neu in 4.30.0: 🎨 Szenen für Lampen und LED-Streifen als echte Szenen in Home Assistant (#549) | 5 | 0 | 0 | 3 | – |
| 113. Neu in 4.31.0: 🚆 Zug-Karte: Kommt mein Zug pünktlich? (#550) | 3 | 0 | 0 | 3 | – |
| 114. Neu in 4.31.1: 🚆 Zug-Karte zeigt deinen Zug auch morgen (#550) | 1 | 0 | 0 | 3 | – |
| 115. Neu in 4.32.0: 📅 Heizplan: von Hand gedreht, nach 10 Minuten zurück (#546) | 2 | 0 | 0 | 2 | – |
| 116. Neu in 4.33.0: 🌙 Der Mond im Himmel | 4 | 0 | 0 | 1 | – |
| 117. Neu in 4.33.1: Das Haus dreht sich flüssig (#557) | 4 | 0 | 0 | 0 | – |
| 118. Neu in 4.34.0: Kantenglättung zum Auswählen (#560) | 6 | 0 | 0 | 0 | – |
| 119. Neu in 4.35.0: Die Einstellungen fast über den ganzen Bildschirm (#562) | 4 | 0 | 2 | 0 | 119.5, 119.6 |
| 120. Neu in 4.36.0: Szenen „Auf alle anwenden“, Weißton in Kelvin, Szenen und Automationen aus Home Assistant verwalten (#564) | 6 | 0 | 3 | 0 | 120.7 bis 120.9 |
| 121. Neu in 4.37.0: Plateau im Gelände, Boden je Raum höher, Außentreppe (#566) | 7 | 0 | 1 | 0 | 121.8 |
| 122. Repariert in 4.37.1: Fenster-Regel unter dem Heizplan, Temperatur über dem Raum (#568, #569) | 3 | 1 | 0 | 0 | ❌ 122.3 |
| 123. Repariert in 4.37.2: bei offenem Fenster geht das Thermostat wirklich aus (#571) | 0 | 0 | 3 | 0 | 123.1 bis 123.3 |
| 124. Neu in 4.38.0: 🌡 Raumfühler für die Thermostate (#573) | 4 | 0 | 5 | 0 | 124.5 bis 124.9 |
| 125. Repariert in 4.38.2: Raumfühler und Fenster-Regel zusammen (#577) | 0 | 0 | 3 | 0 | 125.1 bis 125.3 |
| 126. Neu in 4.39.0: 🩺 Protokoll „Wer steuert was?“ (#579) | 5 | 0 | 4 | 0 | 126.6 bis 126.9 |
| 127. Neu in 4.40.0: 📜 Protokoll, ein eigener Reiter für alle Geräte (#581) | 4 | 0 | 5 | 0 | 127.5 bis 127.9 |
| 128. Neu in 4.41.0: Tür zwischen zwei Räumen zählt für die Heizung, Bad nicht mehr „von Hand gedreht“ (#583) | 1 | 0 | 5 | 0 | 128.2 bis 128.6 |
| 129. Neu in 4.42.0: 🔥 Zu warm → Heizung runter, „Wer hat Vorrang?“ (#585) | 2 | 0 | 4 | 0 | 129.3 bis 129.6 |
| 130. Repariert in 4.42.1: die Reihenfolge der Heizung bleibt, auch wenn ein Thermostat spät meldet (#588) | 1 | 0 | 4 | 0 | 130.2 bis 130.5 |
| 131. Neu in 4.43.0: ▶ Abläufe nach Räumen, zum Auf- und Zuklappen (#590) | 6 | 0 | 2 | 0 | 131.7, 131.8 |
| 132. Repariert in 4.43.1: der Raumfühler nimmt keinen alten Wert mehr als Wunsch, 🔥 Zu warm merkt „von Hand gedreht“ (#592) | 3 | 0 | 3 | 0 | 132.4 bis 132.6 |
| 133. Neu in 4.44.0: ✎ Bearbeiten: ausgeblendete Karten ganz weg, die Zeile „👁 Ausgeblendet“ (#595) | 4 | 0 | 2 | 0 | 133.5, 133.6 |
| 134. Neu in 4.45.0: 🎬 Szenen-Leiste und Karte 🎚️ „Lichtsteuerung“ (#597) | 6 | 0 | 4 | 0 | 134.7 bis 134.10 |
| 135. Neu in 4.46.0: 简体中文 Chinesisch als achte Sprache (#587) | 3 | 0 | 1 | 0 | 135.4 |
| 136. Neu in 4.47.0: 🎚️ mehrere Lampen in einem Balken der Lichtsteuerung | 3 | 0 | 3 | 0 | 136.4 bis 136.6 |
| 137. Neu in 4.48.0: ▦ „Frei anordnen“, die Karten einer Seite auf einem Gitter | 5 | 0 | 3 | 0 | 137.6 bis 137.8 |
| 138. Neu in 4.50.0: 🪟 Vorhänge zur Seite und jeder Fensterflügel für sich (#606) | 3 | 0 | 4 | 0 | 138.4 bis 138.7 |
| 139. Neu in 4.50.1: ein Fensterflügel kann „Fest“ sein, ein Flügel ohne Kontakt folgt wieder dem Hauptkontakt (#606) | 2 | 0 | 1 | 0 | 139.3 |
| **Zusammen** | **846** | **1** | **100** | **92** | |
<!-- AUTO-UEBERSICHT-END -->

## Ältere offene Punkte (nur im echten Betrieb prüfbar)

Das sind die Punkte, die nur der Besitzer im echten Betrieb prüfen kann. Nach Wichtigkeit geordnet, die Nummern verweisen auf die Tabellen unten. Ergebnis jeweils unten in der Tabelle eintragen (✅ / ❌).

1. ~~**Wandtablet** (8.5): das Warnbanner~~: ✅ seit 2026-10-28 (Claude in der Demo; 10.2 und 10.3 sind seit 2026-10-17 ✅).
2. ~~**Import mit Dach-Angaben** (15.6, 12.6a)~~: ✅ seit 2026-10-25 (Claude im Test-Add-on: `roof.dormers` gibt zwei Gauben, `roof.box` das Dach des Gartenhauses).
3. **Batterie im Strom-Bild** (65.17, neu in 3.98.2): nachts im Add-on ansehen, was unter der Batterie steht („ruht · 0 W“ oder „kein Leistungs-Sensor“).

Fertig seit 2026-10-17: 21.4 (Hinweis auf neue Version) und der ganze Abschnitt 20 (erster Start).

## Automatische Tests

| Datum | Stand | Python-Tests | Browser-Test (E2E) | Bemerkung |
|---|---|---|---|---|
| 2026-10-02 | 3.21.0 | 80 bestanden + 8 Gauben-Tests | 208 von 208 bestanden | Dachgauben |
| 2026-10-03 | 3.22.0 | 80 bestanden | die 3 neuen Prüfungen bestanden; ein Lauf mit 93 Prüfungen ohne Fehler wurde vorzeitig abgebrochen (Zeitlimit), kein vollständiger Lauf | Dachgröße, Erdreich, Pfeiltasten, Menü Ansicht, Benutzer-Dialog |
| 2026-10-03 | 3.23.0 | 80 bestanden + 5 Werkzeugleisten-Tests | 222 von 222 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Werkzeugleiste anpassbar, Raumliste nach Haus gruppiert |
| 2026-10-03 | 3.24.0 | 91 bestanden + Tests für Werkzeugleiste und Sicherungsliste | 235 von 235 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Wand teilen, Öffnungen gruppiert, Gerät bleibt ausgewählt, automatische Sicherung |
| 2026-10-03 | 3.25.0 | 98 bestanden + Tests für Version und Sicherungsliste | 240 von 240 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Versionsanzeige mit Prüfsumme, Doppelklick auf Wand großzügiger |
| 2026-10-03 | 3.25.1 | 98 bestanden | 242 von 242 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Doppelklick auf Wand neben Türen, Fenstern und Möbeln |
| 2026-10-03 | 3.26.0 | 98 bestanden + Tests für Willkommenskarte | 249 von 249 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Erster Start: Sprache Auto, dunkles Design, Willkommenskarte |

E2E-Ergebnis 3.21.0: alle 208 Prüfungen bestanden (frischer Server, Headless-Chromium, 2026-10-02).

## Handtest in der Demo (Besitzer)

### 1. Start und Grundansicht
| Nr. | Prüfpunkt | Ergebnis | Datum |
|---|---|---|---|
| 1.1 | Demo öffnet ohne Fehlermeldung, Haus in 3D | ✅ | 2026-10-02 |
| 1.2 | Drehen, Zoomen, Verschieben | ✅ | 2026-10-02 |
| 1.3 | Schalter 3D / 2D / 2D+3D | ✅ | 2026-10-02 |
| 1.4 | Sprache und Design umstellbar | ✅ (der gemeldete „Rasen über dem Boden" war ein Irrtum, kein Fehler) | 2026-10-02 |

### 2. Etagen (linke Leiste)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 2.1 | Karten mit Vorschaubild je Etage | ✅ |
| 2.2 | Klick auf Etage wechselt, Karte hervorgehoben | ✅ |
| 2.3 | Pfeiltasten wechseln die Etage | ✅ ab 3.22.0 im Add-on (vorher ❌, #98) |
| 2.4 | „Haus auseinanderziehen" | ✅ |
| 2.5 | Halbschnitt (Wände halb hoch) | ✅ |
| 2.6 | Automatisches Wände-Ausblenden funktioniert weiter | ✅ |
| 2.7 | In 2D+3D keine Etagen-Beschriftungen, wo sie nicht hingehören | ✅ |

### 3. Etagen im 2D-Plan (3.19.1)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 3.1 | Feld „Etagen im Plan" oben rechts im Plan, von nichts verdeckt | ✅ |
| 3.2 | Legende: eine Zeile je Etage mit Farbe | ✅ |
| 3.3 | Klick schaltet unten → alle → aus | ✅ |
| 3.4 | Gleicher Schalter im Menü „Ansicht" | ✅ |
| 3.5 | Nicht sichtbar in der reinen 3D-Ansicht | ✅ ab 3.22.0 im Add-on (vorher ❌, #99) |
| 3.6 | Einstellung bleibt nach dem Neuladen | ✅ |
| 3.7 | Umrisse stören das Zeichnen nicht | ✅ |

### 4. Räume
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 4.1 | Raum zeichnen (Werkzeug „Raum“), die erste Ecke schließt den Raum | ✅ im Add-on (2026-10-03) |
| 4.2 | „Räume erkennen“ legt Räume aus geschlossenen Wänden an | ✅ im Add-on (2026-10-03) |
| 4.3 | Raum benennen, Farbe wählen, Ecken verschieben, Ecke an der Raumkante per Doppelklick hinzufügen oder entfernen | ✅ im Add-on (2026-10-03) |
| 4.3a | Doppelklick auf eine Wand fügt eine Ecke hinzu, die Wand wird zu zwei Wänden (Wunsch aus dem Test) | ✅ ab 3.25.1 im Add-on (vorher ❌: Türen, Fenster und Möbel in der Nähe nahmen den Doppelklick weg) |
| 4.4 | Dropdown „Zimmer ▾“ oben: Raum anwählen, die Kamera fährt hin | ✅ im Add-on (2026-10-03) |
| 4.5 | Raum mit einem Home-Assistant-Bereich verknüpfen, „Alle … sinnvoll platzieren“ | ✅ im Add-on (2026-10-03) |
| 4.6 | Objektliste im Seitenpanel nach Räumen gruppiert, Suchfeld findet Objekte | ✅ im Add-on (2026-10-03) |

### 5. Farbansichten und Messwerte
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 5.1 | Normal / Temp. / Feuchte / CO₂ färbt die Räume nach Sensorwerten, die Legende erscheint | ✅ im Add-on (2026-10-03) |
| 5.2 | Wertplaketten auf Geräten (wichtige / alle / keine) | ✅ im Add-on (2026-10-03) |
| 5.3 | Funktioniert auf jeder Etage und in jedem Raum | ✅ im Add-on (2026-10-03) |

### 6. Kameras
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 6.1 | Kamera-Gerät zeigt einen Sichtkegel am Boden (Sichtwinkel, Reichweite) | ✅ |
| 6.2 | Mit Bewegungssensor färbt sich der Kegel rot | ✅ |
| 6.3 | Knopf 📷 oben öffnet die Kameraübersicht | ✅ |

### 7. Türen, Fenster, Garage
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 7.1 | Tür oder Fenster in eine Wand setzen, Ausführung später ändern | ✅ im Add-on (2026-10-03) |
| 7.1a | Die Auswahl „Öffnung“ ist gruppiert (Türen / Durchgänge und Tore / Fenster) (Wunsch aus dem Test) | ✅ |
| 7.2 | Verschieben entlang der Wand, Überlappung wird verhindert | ✅ im Add-on (2026-10-03) |
| 7.3 | Fenster mit mehreren Scheiben: je Scheibe ein eigener Kontaktsensor | ✅ im Add-on (2026-10-03) |
| 7.4 | Garagentor in eine Wand setzen, bei „Auf“ rollen die Lamellen hoch | ✅ im Add-on (2026-10-03) |
| 7.5 | Offene Fenster und Türen zeigt die Plakette „open“ | ✅ im Add-on (2026-10-03) |

### 8. Live-Ansicht (echte Geräte)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 8.1 | Gerät antippen: Zustand und Steuerung erscheinen | ✅ im Add-on (2026-10-03) |
| 8.2 | Raumblock „Ganzer Raum“: alle Lichter schalten, Szenen starten | ✅ im Add-on (2026-10-03) |
| 8.3 | Sensorwerte neben den Geräten | ✅ im Add-on (2026-10-03) |
| 8.4 | Änderungen in Home Assistant erscheinen live ohne Neuladen | ✅ im Add-on (2026-10-03) |
| 8.5 | Warnbanner (Rauch, Wasser, offenes Fenster bei Regen), Tippen springt in den Raum | ✅ (2026-10-28, Claude in der Demo: Regen-Warnung „Fenster offen bei Regen“, Tippen springt ins Wohnzimmer; Rauch und Wasser prüft der Browser-Test 07_tablet) |
| 8.6 | Plakette „offline“ zeigt nicht erreichbare Geräte und springt zum Gerät | ✅ im Add-on (2026-10-03) |
| 8.7 | Suche 🔍 „Wo ist …?“ springt zum Gerät | ✅ im Add-on (2026-10-03) |

### 9. Bearbeiten
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 9.1 | Wände zeichnen und verschieben, Rückgängig (Strg+Z) | ✅ im Add-on (2026-10-03) |
| 9.2 | Möbel aus der Bibliothek setzen, drehen, strecken, sperren | ✅ im Add-on (2026-10-03) |
| 9.3 | Bild an die Wand hängen (PNG/JPG hochladen) | ✅ im Add-on (2026-10-03) |
| 9.4 | Hintergrundbild als Vorlage zum Nachzeichnen | ✅ im Add-on (2026-10-03) |
| 9.5 | Mehrere Häuser: anlegen, kopieren, umbenennen, löschen, Hausauswahl | ✅ im Add-on (2026-10-03) |
| 9.6 | Backup herunterladen und wiederherstellen | ✅ |
| 9.7 | Automatisches Speichern, nach dem Neuladen ist alles noch da | ✅ |

### 10. Tablet und Bedienung
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 10.1 | Wandtablet mit ?kiosk=1 oder ?room=…: zeigt nur den Raum | ✅ entfällt (2026-10-10): die Raum-Zuordnung fürs Wandtablet läuft jetzt über „Benutzer & Tablets“ (Abschnitt 11, geprüft); `?kiosk=1` / `?room=…` gibt es weiter als Notlösung |
| 10.2 | Zurück zur Startansicht nach einigen Minuten ohne Berührung | ✅ (2026-10-17) |
| 10.3 | Bildschirmschoner und Nachtabsenkung, die erste Berührung weckt nur | ✅ (2026-10-17) |
| 10.4 | Leistungsmodus: Automatisch / Schön / Schnell | ✅ |
| 10.5 | Benutzer sehen nur ihren Raum und ihre Ansicht | ✅ |

### 11. Benutzer & Tablets (3.20.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 11.1 | Oben in der Leiste gibt es den Knopf „Benutzer" (nur für Admins) | ✅ |
| 11.2 | Im Zahnrad (⚙) ist der Abschnitt „Benutzer & Tablets" nicht mehr | ✅ |
| 11.3 | Benutzer hinzufügen, Raum und Ansicht wählen, wird gespeichert | ✅ |
| 11.4 | Unter dem Dialog steht, ob Datei und Add-on gleich sind | ✅ |
| 11.4a | Knopf „💾 Datei erstellen / speichern“ legt `users.json` an, auch wenn es sie noch nicht gibt | ✅ ab 3.22.0 im Add-on: das Design bleibt unverändert (vorher schaltete der Klick auf Hologramm, #100) |
| 11.5 | „↻ Synchronisieren" liest `users.json` und übernimmt die Benutzer | ✅ |
| 11.6 | Nach einem Update/Neuinstallation sind Benutzer und Tablets wieder da | ✅ |

### 12. Dachgauben (3.21.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 12.1 | Dachstuhl wählen → Abschnitt „Dachgauben" mit „+ Gaube" | ✅ (3.23.0, im Add-on) |
| 12.2 | Eine Gaube erscheint in 3D auf dem Dach, mit Fenster | ✅ (3.23.0, im Add-on) |
| 12.3 | Seite A/B, Position, Breite, Höhe, Abstand zur Traufe lassen sich ändern | ✅ (3.23.0, im Add-on) |
| 12.4 | Gaube mit Satteldach und mit Flachdach | ✅ (3.23.0, im Add-on) |
| 12.5 | Gaube entfernen (×) | ✅ (3.23.0, im Add-on) |
| 12.6 | Bei Flachdach erscheint ein Hinweis statt der Gauben | ✅ (3.23.0, im Add-on) |
| 12.6a | JSON-Import mit `roof.dormers` (docs/examples/house.json hat zwei Gauben) zeigt Gauben auf dem Dach | ✅ (2026-10-25, Claude im Test-Add-on) |
| 12.7 | Nach dem Neuladen sind die Gauben noch da (nur im Add-on, Demo speichert nicht) | ✅ (3.23.0, im Add-on) |

### 13. Import eines Hauses mit Keller, Anbau und Dachgeschoss
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 13.1 | JSON-Import (Prüfen, dann Importieren) läuft ohne Fehler und ohne Warnungen durch | ✅ |
| 13.2 | Es entsteht ein neues Haus mit allen Etagen (Keller, Erdgeschoss, Obergeschoss, Dachgeschoss) | ✅ |
| 13.3 | Räume, Türen und Fenster liegen an den richtigen Stellen | ✅ (2026-10-17) |
| 13.4 | Das bestehende Haus bleibt unverändert, Umschalten über die Hausauswahl geht | ✅ (2026-10-17) |
| 13.5 | Treppen fehlen beim Import und lassen sich im Editor zeichnen | ✅ (2026-10-17) |

### 14. Erdreich unter Anbauten ohne Keller (Fehler #93)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 14.1 | Gesamtansicht, Kamera so drehen, dass der Erdschnitt sichtbar ist | ✅ (3.22.0, im Add-on) |
| 14.2 | Unter einem Anbau ohne Keller (z. B. Garage) ist kein Hohlraum im Boden, darunter ist Erde | ✅ (3.22.0, im Add-on) |
| 14.3 | Der Keller wird im Schnitt weiterhin richtig angezeigt | ✅ (3.22.0, im Add-on) |
| 14.4 | Ein Haus ohne Keller zeigt weiterhin den Boden ohne Schnitt | ✅ |

### 15. Dachgröße von Hand (3.22.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 15.1 | Im Panel des Dach-Stockwerks gibt es den Haken „Größe selbst festlegen" | ✅ |
| 15.2 | Mit dem Haken erscheinen Links, Oben, Breite und Tiefe, das Dach ändert sich sofort in 3D | ✅ |
| 15.3 | Das Dach lässt sich so verkleinern, dass der Anbau (Garage) nicht mehr darunter liegt | ✅ |
| 15.4 | Haken entfernen: die Größe ist wieder automatisch | ✅ |
| 15.5 | Nach dem Neuladen bleibt die Größe erhalten (nur im Add-on) | ✅ |
| 15.6 | JSON-Import mit `roof.box` | ✅ (2026-10-25, Claude im Test-Add-on) |

### 16. Wiederholung der drei Fehler (3.22.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 16.1 | Pfeiltasten ohne Auswahl wechseln die Etage, mit Auswahl verschieben sie das Objekt (#98) | ✅ |
| 16.2 | Schalter „Etagen im Plan" im Menü „Ansicht": in reinem 3D nicht da, in 2D und 2D+3D da (#99) | ✅ |
| 16.3 | „Datei erstellen / speichern" ändert das Design nicht (#100) | ✅ |
| 16.4 | Demo mit zwei Dachgauben im Beispielhaus | ✅ |

### 17. Werkzeugleiste anpassen und Raumliste nach Haus (3.23.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 17.1 | Knopf ✎ am Ende der Werkzeugleiste öffnet „Werkzeuge anpassen" | ✅ |
| 17.2 | Werkzeuge ausblenden, umsortieren (▲ / ▼) und ins Menü „Mehr ▾" einklappen | ✅ |
| 17.3 | Die Auswahl bleibt nach dem Neuladen erhalten | ✅ |
| 17.4 | „Auswählen" lässt sich nicht ausblenden, „Zurücksetzen" stellt den Standard wieder her | ✅ |
| 17.5 | Knopf „Gauben" springt zum Dach-Stockwerk und zum Abschnitt Dachgauben | ✅ |
| 17.6 | Knopf „Haus importieren" liegt standardmäßig im Menü „Mehr" | ✅ |
| 17.7 | Benutzer & Tablets: Raumliste nach Haus gruppiert, mit Etage dahinter | ✅ |

### 18. Automatische Sicherung (3.24.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 18.1 | „Häuser & Backup“ zeigt den Abschnitt „Automatische Sicherung“ | ✅ |
| 18.2 | „Jetzt sichern“ legt eine Datei an, sie steht in der Liste (Art „von Hand“) | ✅ |
| 18.3 | Die Datei liegt im Ordner `addon_configs/…_floorplan3d/backups` | ✅ |
| 18.4 | „Neueste prüfen“ meldet, wie viele Häuser, Bilder und Modelle die Sicherung enthält | ✅ |
| 18.5 | „Automatisch sichern“ einschalten, Abstand, Tage und Anzahl einstellen, nach dem Neuladen stehen die Werte noch | ✅ |
| 18.6 | Mit kurzem Abstand (1 Stunde) entsteht nach der Zeit eine automatische Sicherung (Art „automatisch“) | ✅ |
| 18.7 | Alte automatische Sicherungen werden nach den eingestellten Tagen / der Anzahl gelöscht, die neueste und die von Hand bleiben | ✅ |
| 18.8 | „Zurückspielen“ ersetzt Häuser und Einstellungen durch die Sicherung, die Seite lädt neu | ✅ |
| 18.9 | Herunterladen (⬇) und Löschen (×) in der Liste | ✅ |
| 18.10 | Der Schalter „Auto“ im Menü „Ansicht“ lässt die anderen Einstellungen unverändert (Design bleibt) | ✅ |

### 19. Version und Prüfsumme in der Leiste (3.25.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 19.1 | Oben rechts steht die Version mit kurzer Prüfsumme, zum Beispiel „✓ v3.25.0 · a1b2c3d“ | ✅ |
| 19.2 | Die Anzeige ist grün, wenn Add-on und Browser zur Prüfsumme passen | ✅ |
| 19.3 | Ein Klick öffnet die Einzelheiten (Version, Prüfsumme, Add-on, Browser) | ✅ |
| 19.4 | „Jetzt prüfen (auch mit GitHub)“ meldet: gleicher Stand / neuere Version / anderer Stand | ✅ |
| 19.5 | Nach einem Update zeigt sie die neue Version; zeigt der Browser noch alte Dateien, ist sie orange und „Neu laden“ hilft | ✅ |

### 20. Erster Start (3.26.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 20.1 | Auf einer Neuinstallation folgt die Oberfläche der Browsersprache (Einstellung „Auto") | ✅ (2026-10-17) |
| 20.2 | Das Design ist standardmäßig „Dunkel" | ✅ (2026-10-17) |
| 20.3 | Ein leeres Haus zeigt die Willkommenskarte mit drei Knöpfen | ✅ (2026-10-17) |
| 20.4 | „Wände zeichnen" schließt die Karte und wählt das Wand-Werkzeug (2D + 3D) | ✅ (2026-10-17) |
| 20.5 | „Beispielhaus ausprobieren" legt ein neues Haus an und öffnet es | ✅ (2026-10-17) |
| 20.6 | „Haus aus JSON importieren" öffnet den Importdialog | ✅ (2026-10-17) |
| 20.7 | Die Etage heißt je nach Sprache „Ground floor", „Erdgeschoss" und so weiter | ✅ (2026-10-17) |
| 20.8 | Bestehende Installationen behalten Sprache und Design | ✅ (2026-10-17) |

### 21. Neu in 3.26.1 bis 3.27.1

| Nr. | Prüfpunkt | Ergebnis |
| --- | --- | --- |
| 21.1 | Etagen auseinander (Ganzes Haus, „auseinander"): jede Etage hat ihre Lücke, auch das Erdgeschoss hebt sich vom Keller ab (#146) | ✅ (Besitzer, 3.26.1) |
| 21.2 | Versionsanzeige: im Fenster steht „Browser: zeigt genau diese Dateien", auch bei `http://` (#144) | ✅ |
| 21.3 | Einstellungen ⚙ zeigt das Kästchen „Alle 5 Minuten bei GitHub nachsehen …" (#140) | ✅ |
| 21.4 | Sobald es eine neuere Version gibt, wird die Anzeige im Bearbeiten-Modus nach spätestens 5 Minuten blau: „⬆ Neue Version verfügbar" (#140) | ✅ (2026-10-17) |
| 21.5 | Backup-Panel: die Beschriftungen der Zahlenfelder stehen über den Feldern, nicht in einer schmalen Spalte | ✅ |
| 21.6 | Im Protokoll des Add-ons steht beim Start „Starting 3D Floorplan on port 8099 ..." | ✅ |

### 22. Ansicht und Live-Bedienung (3.28.0)

| Nr. | Prüfpunkt | Ergebnis |
| --- | --- | --- |
| 22.1 | Der Knopf „Ansicht" steht unten bei Normal / Temp. / Feuchte / CO₂, sein Menü öffnet sich nach oben (#132) | ✅ |
| 22.2 | Auf dem Handy und Tablet ist unten nichts verdeckt, alle Knöpfe sind erreichbar | ✅ |
| 22.3 | „Halbschnitt": Deckenlampen, LED-Ringe und hoch hängende Bilder verschwinden mit, nichts schwebt über den Wänden (#131) | ✅ |
| 22.4 | Halbschnitt wieder aus: alles ist wieder da | ✅ |
| 22.5 | Einstellungen ⚙ „Wände zur Kamera durchsichtig machen statt absenken": die Wände zur Kamera werden leicht durchsichtig, man sieht den Raum (#129) | ✅ |
| 22.6 | Beim Drehen der Kamera wechseln die durchsichtigen Wände mit (von hinten normal) | ✅ |
| 22.7 | Option aus: die Wände senken sich wie bisher | ✅ |
| 22.8 | Live-Modus: Tippen in einen Raum zoomt hinein, ein zweites Tippen in den Raum geht zurück zur Ansicht davor, zum Beispiel zur Etage (#128) | ✅ |
| 22.9 | Das gilt auch aus der Ganzes-Haus-Ansicht: zurück zeigt wieder das ganze Haus | ✅ |

## 23. Demo-Rundgang für 3.29 bis 3.36 (Besitzer)

Alles lässt sich in der Demo im Browser prüfen: https://burned4aim.github.io/HA-Floorplanner/ . Ergebnis jeweils eintragen (✅ / ❌). Die Demo hat dafür eine Heizung mit Zieltemperatur, ein Stromnetz (Hausanschluss, Zähler, Zählerkasten, Wechselrichter, drei Solarmodule im Garten, rechts neben der Garage) und eine Küchenzeile.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 23.1 | Version oben anschauen | zeigt 3.36.x mit grünem Haken | ✅ |
| 23.2 | Live: Wohnzimmer antippen | Raum-Panel und daneben das **Heizungs-Panel** (21,2 °C, Ziel 22 °C, „heating") | ✅ |
| 23.3 | Im Heizungs-Panel zweimal „+" | Ziel springt auf 23, nach einer kurzen Pause wird gesetzt; „Off" macht die Anzeige grau, Heizkörper links glüht nur bei „heating" | ✅ |
| 23.4 | Ansicht ▴ → „Durchsichtig", dann „Auto" | die beiden schließen sich gegenseitig aus; Wände werden durchsichtig, Dach auch von weitem | ✅ |
| 23.5 | Haus von allen Seiten drehen, unten Kompass ansehen | Kompass dreht mit, jede Außenwand der Erdgeschoss-Seite zur Kamera senkt sich ab | ✅ |
| 23.6 | Bearbeiten: Dachgeschoss öffnen, Gaube setzen | Dach bleibt gut sichtbar, nicht fast unsichtbar | ✅ |
| 23.7 | Bearbeiten: Dachgeschoss → „Weitere Dächer" → „+ Weiteres Dach", Form „Flach", Etage „Erdgeschoss" | ein eigenes Dach über dem Anbau, tiefer als das Hauptdach | ✅ |
| 23.8 | Küche ansehen (3D und 2D) | Küchenzeile aus Modulen (Unterschrank, Spüle, Geschirrspüler, Herd, Kühlschrank) mit Oberschränken | ✅ |
| 23.9 | Küchenzeile anklicken → Form „L-Form", „+ Modul", ein Modul mit ↑/↓ verschieben, „×" | zweiter Schenkel erscheint, Module ändern sich in 2D und 3D | ✅ |
| 23.10 | Werkzeug „Tür/Fenster", in ein sehr kurzes Wandstück klicken | Öffnung wird kleiner gemacht statt abgelehnt (mind. 10 cm) | ✅ |
| 23.11 | Unten „Strom" antippen (Knopf neben CO₂) | orange/grüne Kabel mit fließenden Punkten und Watt-Zahlen (z. B. 1100 W an den Solarmodulen, 3,20 kW am Wechselrichter) | ✅ |
| 23.12 | Werkzeugleiste „Strom-Editor" | nur Strom-Sachen sichtbar und anklickbar, alles andere ausgeblendet; Bibliothek zeigt Kategorie „Strom" | ✅ |
| 23.13 | Strom-Editor: Werkzeug „Kabel", ein Stromgerät, dann ein anderes anklicken | neues Kabel; an einem Gerät lassen sich mehrere Kabel haben | ✅ |
| 23.14 | Stromgerät anklicken → Eigenschaften: Verlauf „Am Boden entlang" / „Durch den Boden" / „Frei in der Luft", „×" | Kabel ändert den Weg, „×" löscht es; unten steht „Kommt von: …" | ✅ |
| 23.15 | 2D-Ansicht im Strom-Editor | orange Linien zwischen den Geräten | ✅ |
| 23.16 | Kamera im Wohnzimmer ansehen | Sichtkegel; rot mit „Bewegung", wenn der Bewegungsmelder an ist (in der Demo ist er an) | ✅ |
| 23.17 | Haus → Grundriss importieren → Export | Strom-Kabel, Küchenzeile und weitere Dächer überleben Export und erneuten Import | ✅ (2026-10-25, Claude im Test-Add-on) |

**Hinweis zur Kamera und Bewegung:** Der Sichtkegel mit Bewegungsanzeige ist im echten Add-on genauso vorhanden wie in der Demo. Die Demo liefert nur Beispielwerte. Im echten Haus wählst du bei der Kamera in den Eigenschaften „Bewegungsmelder" aus (ein `binary_sensor`), dann färbt sich der Kegel rot.

## Automatisch geprüft (zusätzlich)
- Python: Benutzer werden in `users.json` gespiegelt; Synchronisieren lädt/speichert; frische Installation holt sich Benutzer aus der Datei zurück.
- Browser-Test: Benutzer-Reiter sichtbar für Admins, versteckt für Nur-Lese-Benutzer; nicht mehr im Zahnrad; Tablet speichern; Synchronisieren.

## 24. Treppen: mehrere Etagen, Wandtreppe, Außen-Wendeltreppe (3.40.x)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 24.1 | Bearbeiten, Werkzeug „Treppe" → Typ „Wandtreppe", Feld „Etagen" auf 2 | Hinweis „Weiter an der Wand entlang klicken …" | ✅ (2026-10-17) |
| 24.2 | In der 2D-Ansicht an einer Wand entlang klicken, an der Ecke weiter an der nächsten Wand, zuletzt **Enter** (oder Doppelklick) | Eine Treppe entsteht; ihr Weg liegt genau auf der Wandfläche, in der Ecke ist ein **Podest**; „Esc" bricht ab | ✅ (2026-10-17) |
| 24.3 | 3D ansehen | Dünne Stufenplatten an der Wand, darunter frei; Podest in der Ecke | ✅ (2026-10-17) |
| 24.4 | Eine Etage höher und zwei höher schauen | In jeder Etage, durch die die Treppe geht, ist die Aussparung im Boden (orange gestrichelt), dort darüber nicht mehr | ✅ (2026-10-17) |
| 24.5 | Treppe anklicken → Eigenschaften: „Etagen" auf 1 stellen | nur noch die Etage direkt darüber hat die Aussparung | ✅ (2026-10-17) |
| 24.6 | Treppe anklicken, das weiße Quadrat am Rand der Stufen ziehen | Breite ändert sich | ✅ (2026-10-17) |
| 24.7 | „Stufen nach" links/rechts umstellen | Die Stufen stehen auf der anderen Seite des Wegs | ✅ (2026-10-17) |
| 24.8 | Wandtreppe mit **zwei Knicken** zeichnen (U-förmiger Weg, Podest dazwischen) | Zwei Podeste, die Stufen verteilen sich nach Länge der Abschnitte | ✅ (2026-10-17) |
| 24.9 | Typ „Wendel", „Etagen" auf 2, im Garten neben dem Haus platzieren | Wendeltreppe mit zwei Umdrehungen (eine pro Etage), kein Treppenhaus drumherum | ✅ (2026-10-17) |
| 24.10 | „Gerade", „L" oder „U" mit „Etagen" 2 | Eine lange Treppe über zwei Etagen | ✅ (2026-10-17) |
| 24.11 | Alte Treppen im bestehenden Haus ansehen | Unverändert (Etagen = 1) | ✅ (2026-10-17) |
| 24.12 | Haus → „Dieses Haus als JSON exportieren“, Datei ansehen | Treppen stehen mit `"type": "wall"`, `"floors"` und `"path"` in der Datei, ebenso Blöcke und Bodenöffnungen (3.40.1) | ✅ (2026-10-17) |
| 24.13 | Diese Datei wieder importieren (neues Haus) | Die Treppen sind genauso wieder da | ✅ (2026-10-17) |

## 25. Solarpanels auf dem Dach (3.41.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 25.1 | Bearbeiten, Etage „Dach“ öffnen (gibt es keine: im Etagen-Panel „+ Dach“) | Das Dach ist zu sehen | ✅ (2026-10-17) |
| 25.2 | Aus der Bibliothek (Strom) ein **Solarpanel** auf eine Dachseite setzen | Das Panel liegt flach auf der Dachfläche, schräg wie das Dach, ohne Ständer | ✅ (2026-10-17) |
| 25.3 | Das Panel verschieben, z. B. Richtung Dachrinne oder auf die andere Dachseite | Es bleibt auf dem Dach und kippt auf der anderen Seite mit | ✅ (2026-10-17) |
| 25.4 | Eigenschaften: „Panels nebeneinander“ 4, „Reihen“ 2 | Ein Feld aus 8 Panels mit Montageschienen | ✅ (2026-10-17) |
| 25.5 | Das Panel drehen (Drehung in den Eigenschaften) | Es bleibt flach auf dem Dach liegen | ✅ (2026-10-17) |
| 25.6 | Im Etagen-Panel die Dachform auf „Flachdach“ stellen | Die Panels stehen aufgeständert (schräg zur Sonne) oben auf dem Flachdach | ✅ (2026-10-17) |
| 25.7 | „Montage“ auf „Flach auf dem Dach“ bzw. „Aufgeständert“ | Das Panel liegt flach bzw. steht auf Ständern | ✅ (2026-10-17) |
| 25.8 | Ein Solarpanel in einer normalen Etage (Garten) | Wie bisher auf einem Ständer am Boden; in den Eigenschaften steht, wie man es aufs Dach legt | ✅ (2026-10-17) |
| 25.9 | Haus → Export, Datei ansehen und wieder importieren | `cols`, `rows`, `mount` stehen in der Datei und sind nach dem Import wieder da | ✅ (2026-10-17) |

## 26. Wasser-, Gas- und Wärmezähler (3.42.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 26.1 | Bearbeiten, Bibliothek, im Suchfeld „zähler“ eingeben | Stromzähler, Wasserzähler, Gaszähler, Wärmemengenzähler | ✅ (2026-10-17) |
| 26.2 | Einen Wasserzähler in den Keller setzen | Blauer Zähler mit runder Anzeige auf einem Messingrohr | ✅ (2026-10-17) |
| 26.3 | Gaszähler und Wärmemengenzähler an eine Wand setzen | Beiger Gaszähler mit Zählwerk; kleiner weißer Wärmezähler mit rotem und blauem Rohr | ✅ (2026-10-17) |
| 26.4 | Beim Zähler in den Eigenschaften den passenden Sensor wählen (z. B. `sensor.wasserzaehler`) | Über dem Zähler steht der Stand, z. B. „🚰 1234.6 m³“, „🔥 845.2 m³“, „♨ 5321 kWh“ | ✅ (2026-10-17) |

## 27. Metallbrücke / Übergang (3.43.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 27.1 | Bearbeiten, obere Etage öffnen, Bibliothek „Außen“ → „Brücke / Übergang“ zwischen zwei Gebäudeteile setzen | Eine 3 m lange Metallbrücke mit Gitterboden und Geländer auf beiden Seiten, auf Höhe der Etage | ✅ (2026-10-17) |
| 27.2 | Mit „Drehung“ ausrichten, in den Eigenschaften „Länge“ und „Breite“ ändern | Die Brücke wird länger / breiter, das Geländer passt sich an | ✅ (2026-10-17) |
| 27.3 | Haken „Geländer“ wegnehmen | Nur noch Boden und Träger | ✅ (2026-10-17) |
| 27.4 | Haus → Export und wieder importieren | `len`, `w`, `noRail` stehen in der Datei und sind wieder da | ✅ (2026-10-17) |

**Hinweis:** Zwischen zwei **getrennten** Häusern (zwei Grundrisse in der Häuser-Liste) geht das noch nicht, weil das Programm nicht weiß, wie die Häuser zueinander liegen. Innerhalb eines Grundrisses (Haupthaus und Anbau) funktioniert es.

**Nachtest 3.43.5:** 25.6 bis 25.8 (Ständer enden unter dem Panel; auf dem Schrägdach reichen sie bis aufs Dach), 26.1 bis 26.4 und 27.1 bis 27.4 (Zähler und Brücke sichtbar). Ist der Strom-Editor an und du setzt etwas anderes als ein Stromgerät oder einen Zähler, schaltet er sich aus, und unten steht ein Hinweis.

**Nachtest 3.43.6 (24.9, #209):** Die Wendeltreppe hat eine Stange in der Mitte, dünne Stufen ohne etwas darunter und einen Handlauf außen.

**Nachträge 3.43.7 bis 3.43.10** (gehören nicht zur Brücke, stehen aber hier, weil sie in diesen Versionen kamen):

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 27.5 | Pille „n offen“ antippen und einen Eintrag wählen; ebenso in der Liste „offline“ und bei „Im Plan zeigen“ in der Kamera-Übersicht (3.43.7, #215) | Die Kamera fliegt zum Fenster bzw. zur Tür, ein Ring zeigt die Stelle (wie bei der Suche) | ✅ (2026-10-17) |
| 27.6 | Ansicht „2D + 3D“, oben rechts im Plan „↻ Plan dreht mit“ einschalten, dann die 3D-Ansicht drehen; noch einmal drücken (3.43.8, #212) | Der Plan dreht mit, oben ist immer die Blickrichtung; Schrift lesbar, Klicken und Zeichnen gehen weiter; der zweite Druck stellt den Plan wieder gerade | ✅ (2026-10-17) |
| 27.7 | Ein Ding anklicken, mit **Shift** weitere anklicken (2D und 3D); **Esc**; Shift + Klick auf ein schon ausgewähltes Ding (3.43.9, #211) | Grüner Rahmen um alle, rechts „n ausgewählt“; Esc hebt die Auswahl auf; Shift + Klick nimmt ein Ding wieder heraus (Löschen mit Entf und Strg+Z ist schon mit Punkt 15 oben ✅) | ✅ (2026-10-17) |
| 27.8 | Wandtreppe anklicken, „Podest nach dem Knick“ z. B. 1 m; beim Zeichnen einer Wandtreppe mitten auf einer Geraden einmal zusätzlich klicken (3.43.10, #210) | Nach jeder Ecke bleibt die Treppe 1 m eben; an der zusätzlichen Stelle entsteht ein flaches Podest, danach geht die Treppe weiter | ✅ (2026-10-17) |

## 28. Nachbarhaus und Brücke zur Dachterrasse (3.44.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 28.1 | Im ersten Haus: Bearbeiten → „Häuser & Backup“ aufklappen → „+ Nachbarhaus“ | Eine Karte mit Haus, Lage X, Lage Z, Drehung, Höhe erscheint; das andere Haus steht in 3D da | ✅ |
| 28.2 | Lage X / Z (und falls nötig Drehung) so einstellen, dass das Nachbarhaus wie in echt steht | Es rückt an die richtige Stelle | ✅ |
| 28.3 | „Ganzes Haus“ | Beide Häuser sind ganz zu sehen; die Dachterrasse des Nachbarhauses hat ein Geländer | ✅ |
| 28.4 | Ins 1. OG wechseln, Ansicht „2D + 3D“ | Im Plan ist der Umriss des Nachbarhauses auf dieser Höhe lila gestrichelt | ✅ |
| 28.5 | Die Brücke (Bibliothek „Außen“) im 1. OG zwischen beide Häuser setzen, drehen und Länge einstellen | Sie führt vom eigenen 1. OG auf die Dachterrasse | ✅ |
| 28.6 | Zum Nachbarhaus wechseln (Häuser-Liste) | Es lässt sich dort ganz normal bearbeiten; zurück im ersten Haus ist die Änderung nach dem Neuladen zu sehen | ✅ |
| 28.7 | „Nachbarhaus entfernen“ | Es verschwindet wieder | ✅ |
| 28.8 | Das 1. OG des Nachbarhauses liegt höher/tiefer: beim Nachbarhaus „Höhe“ z. B. 0,40 eintragen, bei der Brücke „Höhenunterschied am Ende“ ebenfalls 0,40 | Die Terrasse rückt hoch, die Brücke steigt gleichmäßig zu ihr an; im Plan zeigt der lila Pfeil auf das Ende mit „+0,40 m“ (3.44.1) | ✅ |

**Jetzt auch in der Demo (3.44.2):** Die Demo hat zwei Häuser. Neben dem Demo-Haus steht das „Nachbarhaus“ (oben in der Häuser-Auswahl), sein 1. OG liegt 0,40 m höher. Von der Dachterrasse des Demo-Hauses führt schon eine Brücke mit „+0,40 m“ hinüber, das Geländer ist an beiden Enden offen. So lassen sich 28.3 bis 28.8 direkt im Browser ausprobieren. Bei 28.6 gilt: Die Demo speichert nichts, nach dem Neuladen ist alles wieder wie am Anfang. Außerdem neu im Demo-Haus: Wasser-, Gas- und Wärmezähler im Keller (26), 10 Solarpanels auf dem Dach (25), eine Wendeltreppe von der Garage hoch auf die Dachterrasse (24.9). Im Nachbarhaus gibt es eine Wandtreppe mit Podest nach dem Knick (24.1, 24.8).

## 29. Treppenhaus, Podest an der Wende, Ausgang auf jeder Etage (3.45.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 29.1 | Bearbeiten, Werkzeug „Treppe“ → „Treppenhaus“, „Etagen“ auf 2, im Plan klicken | Vier Wände mit Raum „Treppenhaus“; vor der Treppe ein Podest, dort die Tür. Dasselbe (Wände, Raum, Tür) auch in den beiden Etagen darüber | ✅ (2026-10-17) |
| 29.2 | 3D ansehen | Auf jeder Etage kommt die U-Treppe an, man kann aufs Podest aussteigen; danach geht es mit der nächsten U-Treppe weiter nach oben | ✅ (2026-10-17) |
| 29.3 | U- oder L-Treppe setzen, in den Eigenschaften „Podest nach dem Knick“ z. B. 0,8 | Das Podest an der Wende wird 0,8 m tiefer, der zweite Lauf rückt weiter | ✅ (2026-10-17) |
| 29.4 | Gerade Treppe mit „Etagen“ 2 | Zwei Läufe übereinander, auf der Etage dazwischen kommt man an (nicht mehr ein langer Lauf) | ✅ (2026-10-17) |
| 29.5 | Haus → Export und wieder importieren | `landing` bleibt bei L- und U-Treppen erhalten | ✅ (2026-10-17) |
| 29.6 | Treppenhaus mit „Etagen“ 2 im Keller setzen, nur den Keller ansehen (nicht „Ganzes Haus“) | Nur der Teil bis zur nächsten Etage ist zu sehen, nichts schwebt darüber; im EG kommt die Treppe an und geht weiter (3.45.1) | ✅ (2026-10-17) |
| 29.7 | Wandtreppe um eine Ecke zeichnen und an der Ecke zweimal knapp hintereinander klicken, „Podest nach dem Knick“ 1 | An der Ecke ein ebenes Podest ohne Stufe dazwischen, die Treppe geht erst danach weiter (3.45.1) | ✅ (2026-10-17) |
| 29.8 | Wendeltreppe (in der Demo: von der Garage auf die Dachterrasse) von oben ansehen | Nach der letzten Stufe ein Viertelkreis-Podest auf Bodenhöhe bis zum Rand der Öffnung, dort steigt man aus; mit der Drehung zeigt es in die gewünschte Richtung (3.45.1) | ✅ (2026-10-17) |

## 30. Live-Modus: weniger aus Versehen antippen (3.45.1)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 30.1 | Live-Modus, auf eine Anwesenheits-Figur tippen | Nichts passiert (kein Fenster), ein Tipp daneben trifft den Raum | ✅ (2026-10-17) |
| 30.2 | Live-Modus, in den roten/blauen Sichtkegel einer Kamera tippen | Die Kamera öffnet sich nicht; ein Licht oder der Raum darunter wird getroffen | ✅ (2026-10-17) |
| 30.3 | Live-Modus, direkt auf die Kamera tippen | Das Kamera-Fenster öffnet sich wie bisher | ✅ (2026-10-17) |
| 30.4 | Live-Modus, auf einen Temperatur- oder CO₂-Sensor tippen (3.46.0) | Nichts passiert; ein Thermostat lässt sich weiter antippen | ✅ (2026-10-17) |

## 31. Treppen über mehrere Etagen, Zähler in der Übersicht (3.46.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 31.1 | Wandtreppe mit „Etagen“ 2 zeichnen | Dieselbe Wandtreppe noch einmal eine Etage höher; auf der Etage dazwischen kommt sie an (kein langer Lauf mehr) | ✅ (2026-10-17) Nachtest nach 3.93.0: geht. Vorher (2026-10-09) war noch ein langer Lauf zu sehen, #318 (gemeint war die Wendeltreppe, ihr Geländer lief durch) |
| 31.2 | Wendeltreppe mit „Etagen“ 2 | Pro Etage eine Umdrehung, auf jeder Etage ein Viertelkreis-Podest zum Aussteigen | ✅ |
| 31.3 | Eine Treppe über 2 Etagen, nur die untere Etage ansehen | Der obere Teil ist durchsichtig zu sehen (ganze Höhe), nicht fest in der Luft | ✅ (2026-10-17) |
| 31.4 | Wasser- und Gaszähler mit Sensor im Haus, oben die Energie-Anzeige ansehen | In einer zweiten Zeile: „🚰 … m³ · 🔥 … m³“ | ✅ |
| 31.5 | Live-Modus ansehen | Über jeder Lampe, Kamera, jedem Schalter usw. schwebt eine kleine Kugel (unter Deckenlampen hängt sie darunter); sie leuchtet in der Lichtfarbe, wenn an. Antippen der Kugel schaltet bzw. öffnet das Gerät | ✅ |
| 31.6 | Brücke: „Höhenunterschied am Ende“ groß machen, z. B. 1,2 m bei 4 m Länge | Statt einer steilen Rampe hat die Brücke Stufen | ✅ |
| 31.7 | Strom-Editor einschalten, dann ein anderes Werkzeug wählen | Der Knopf „Strom-Editor“ bleibt blau, solange er an ist | ✅ |

## 32. Dächer verschieben und ihre Größe ziehen (3.49.0 bis 3.50.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 32.1 | Etage „Dach“, in 3D aufs Dach klicken | Rechts steht „Dach“ mit Ecke und Größe | ✅ |
| 32.2 | Das ausgewählte Dach noch einmal drücken und ziehen (3D) | Es wandert flüssig mit, ohne Ruckeln; die Solarpanels darauf auch (3.49.1) | ✅ |
| 32.3 | Dasselbe im 2D-Plan | Flüssig; das gestrichelte Dach und in 2D + 3D auch das 3D-Dach wandern mit | ✅ |
| 32.4 | Loslassen | Das Dach sitzt genau dort, wo es beim Ziehen war | ✅ |
| 32.5 | Im 2D-Plan an einer Ecke des ausgewählten Dachs ziehen (3.50.0) | Es wird größer/kleiner, die gegenüberliegende Ecke bleibt | ✅ |
| 32.6 | An einer Seitenmitte ziehen | Nur diese Seite wandert | ✅ |
| 32.7 | Eine Seite weit über die andere hinaus ziehen | Das Dach bleibt mindestens 1 m breit/tief | ✅ |
| 32.8 | Strg+Z | Die alte Größe ist zurück | ✅ |
| 32.9 | Ein weiteres Dach (unter „Etage verwalten“ → „+ Weiteres Dach“) auswählen und an den Ecken ziehen | Geht genauso; das Hauptdach bleibt unverändert | ✅ |

## 33. Live-Modus: nur über die Kugel antippen (3.51.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 33.1 | Live-Modus ansehen | Die Kugeln über den Geräten sind deutlich größer als vorher | ✅ |
| 33.2 | Auf eine Lampe selbst tippen (nicht auf die Kugel) | Die Lampe schaltet nicht, es öffnet sich nichts für sie; der Tipp wirkt wie ein Tipp in den Raum | ✅ |
| 33.3 | Auf die Kugel der Lampe tippen | Die Lampe öffnet bzw. schaltet sich wie bisher | ✅ |
| 33.4 | Dasselbe mit Fernseher, Rollladen, Kamera | Nur die Kugel reagiert | ✅ |
| 33.5 | LED-Ring mit mehreren Abschnitten: auf einen Abschnitt tippen | Dieser Abschnitt öffnet sich wie bisher | ✅ |
| 33.6 | Ins Bearbeiten wechseln, auf eine Lampe klicken | Sie wird wie immer ausgewählt (die Regel gilt nur im Live-Modus) | ✅ |

## 34. Ausgebauter Dachstuhl (3.52.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 34.1 | Etage „Dach“, „Etage verwalten“, Haken „Ausgebauter Dachstuhl“ | Feld „Kniestock“ mit 1 m erscheint, das Dach sitzt tiefer (im Dachgeschoss) | ✅ 2026-10-08 |
| 34.2 | Etage „Dachgeschoss“ ansehen, von der Giebelseite | Die Wände enden schräg unter dem Dach, nichts sticht oben heraus | ✅ 2026-10-08 |
| 34.3 | Kniestock auf 1,5 m, dann auf 0,5 m | Das Dach geht hoch bzw. runter, die Schrägen schneiden weniger bzw. mehr ab | ✅ 2026-10-08 |
| 34.4 | Dachform „Walmdach“ | Auch an den Stirnseiten werden die Wände schräg abgeschnitten | ✅ |
| 34.5 | „Ganzes Haus“ | Das Dach sitzt sauber auf dem Dachgeschoss, Gauben und Solarpanels mit | ✅ |
| 34.6 | Etage „Dach“ (Spitzboden): einen Raum zeichnen, ein Gerät hinstellen | Liegt über dem Dachgeschoss, unter dem First | ✅ |
| 34.7 | Haken wieder entfernen | Das Dach sitzt wieder oben drauf, die Wände sind wieder ganz | ✅ |
| 34.8 | Im echten Haus: Kniestock wie bei euch einstellen, Wohnzimmer mit Gauben ansehen | Sieht aus wie in echt (Rückmeldung gern mit Bild) | ✅ |

## 35. Ausgebauter Dachstuhl: Gauben, mehrere Etagen, Firsthöhe (3.53.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 35.1 | Ausgebauter Dachstuhl an, eine Gaube über einer Wand des Dachgeschosses, „Auto“ aus | Die Wand geht unter der Gaube hoch bis unter das Gaubendach, daneben ist sie schräg abgeschnitten | ✅ 2026-10-08 |
| 35.2 | Gaube als „Giebel“ | Unter der Gaube reicht die Wand in der Mitte höher (Spitze) | ✅ 2026-10-08 |
| 35.3 | „Dach beginnt auf Etage“ = Obergeschoss | Das Dach sitzt eine Etage tiefer; Obergeschoss und Dachgeschoss sind an der Schräge abgeschnitten | ✅ 2026-10-08 |
| 35.4 | Wieder das Geschoss direkt darunter wählen | Wie vorher (nur das Dachgeschoss liegt unter der Schräge) | ✅ 2026-10-08 |
| 35.5 | „Firsthöhe“ auf 4 m | Das Dach ist 4 m hoch über der Wand/dem Kniestock, die Neigung wurde angepasst | ✅ 2026-10-08 |
| 35.6 | Haken „Ausgebauter Dachstuhl“ weg | Alles wie vorher: Dach oben drauf, keine abgeschnittenen Wände | ✅ 2026-10-08 |

## 36. Gaubenfenster, Dach über dem Raum, Handy (3.54.0 bis 3.57.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 36.1 | Bearbeiten, Etage „Dachgeschoss“: auf das Fenster einer Gaube klicken | Rechts: Name, Fensterkontakt (auch je Flügel), Fensterart | ✅ 2026-10-08 |
| 36.2 | Kontakt verknüpfen, im echten Haus das Fenster öffnen | Das Gaubenfenster wird rot und kippt auf; es steht in „n offen“, im Raum-Fenster und in der Suche | ✅ 2026-10-08 |
| 36.3 | Gaubenfenster löschen | Die Gaube hat kein Fenster mehr (die Gaube selbst bleibt) | ✅ 2026-10-08 |
| 36.4 | Wand des Raums direkt hinter der Gaube | Das Fenster sitzt in dieser Wand, mit Loch, im Raum sichtbar; die Gaube zeigt von außen ihr Glas | ✅ 2026-10-08 |
| 36.5 | Wand weiter weg: Gaube anklicken, „Vorderseite auf die Wand setzen“ | Die Gaube rutscht an die Wand, das Fenster sitzt darin; die Karte sagt, wo das Fenster sitzt | ✅ 2026-10-08 |
| 36.6 | Live: Raum unter dem Dach antippen | Dachschräge und Gaube über diesem Raum durchsichtig, nur über dem Raum | ✅ 2026-10-08 |
| 36.7 | Live: Etage direkt unter dem Dach öffnen | Das Dach darüber ist durchsichtig zu sehen, mit Gauben | ✅ 2026-10-08 |
| 36.8 | Handy, Live: ☰ oben links antippen, etwas wählen | Liste klappt auf und nach der Wahl wieder zu | ✅ 2026-10-08 |
| 36.9 | iPhone: in die Suche tippen | Kein Hineinzoomen | ✅ 2026-10-08 |
| 36.10 | Handy: Raum antippen | Raum über der Raum-Karte sichtbar, Heizung in der Karte, kein dunkler Kasten | ✅ 2026-10-08 |
| 36.11 | Handy quer | Etagen-Pillen oben, Kompass frei, Knöpfe unten vollständig | ✅ |
| 36.12 | Tablet und PC | Alles wie vorher (die Handy-Änderungen gelten nur für schmale Bildschirme) | ✅ 2026-10-08 |
| 36.13 | Handy: oben ☰, Etagen-Knopf und Zimmer-Knopf; Etage wählen, dann Zimmer wählen | Zwei eigene Listen; die Wahl schließt die Liste, das Zimmer öffnet sich (3.57.1, #281) | ✅ 2026-10-08 |
| 36.14 | Handy hochkant: oben und unten alles ansehen | Alle Anzeigen und Ansichts-Knöpfe sichtbar, in mehreren Reihen, nichts zum Seitwärtsschieben (3.57.2, #284) | ✅ 2026-10-08 |
| 36.15 | Wand anklicken, rechts „Wand teilen“: 0,30 m, dann „3 Teile“; Doppelklick auf die ausgewählte Wand | Ecke genau dort; drei gleiche Stücke; Doppelklick teilt an der Klickstelle, auch über Rasen/Zaun (3.58.0, #286) | ✅ 2026-10-08 |

## 37. Neu in 3.59 bis 3.62

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 37.1 | Handy hochkant, Live | Oben neben Etage und Zimmer ein Knopf **📊**; Antippen zeigt Strom, Wasser/Gas, offline, offen, Kameras als Liste; ist etwas offen oder offline, fällt der Knopf auf (3.59.0, #288) | ✅ |
| 37.2 | Handy hochkant, „Ganzes Haus“ | Die Etagen-Karten sind klein: Name und eine Zeile mit ▦ 💡 🪟 (3.59.1, #290) | ✅ |
| 37.3 | Handy hochkant, „Ganzes Haus“ | Die Karten stehen rechts neben dem Haus, nicht davor (3.59.2, #292) | ✅ |
| 37.4 | Handy, „Ganzes Haus“, weit hineinzoomen und wieder heraus | Die Karten bleiben neben dem Haus (dürfen aus dem Bild rutschen), beim Herauszoomen kommen sie zurück (3.60.1, #294) | ✅ |
| 37.5 | Unten „Ansicht“ → „⏱ Leistung“: aus / FPS / alle Werte | FPS oben rechts im 3D-Bild (💤 in Ruhe); „alle Werte“ zeigt mehr Zahlen; die Anzeige stört kein Antippen; bleibt nach Neuladen so (3.60.0) | ✅ |
| 37.6 | Oben „Benutzer“ → bei einem Benutzer „⚙“ → „🔒 Gesperrt“, Haken setzen | Die Haken bleiben gespeichert; mit diesem Benutzer angemeldet sind die Dinge weg (Wirkung nur im Add-on prüfbar, in der Demo gibt es nur einen Benutzer) (3.61.0) | ✅ (2026-10-25, Claude im Test-Add-on) |
| 37.7 | Bearbeiten, „Auswählen“, Ansicht **2D** oder **2D + 3D**: mehrere Dinge mit Strg/Shift + Klick (oder Strg/Shift + Rahmen) wählen, dann eins davon **ohne** Strg/Shift ziehen | Alle wandern zusammen und bleiben ausgewählt; angehängte Wände dehnen sich mit, Türen/Fenster wandern mit ihrer Wand; in 2D + 3D zieht das 3D-Bild mit (3.62.0) | ✅ |
| 37.8 | Danach Strg+Z; dann nur auf eins der Ausgewählten **klicken** (nicht ziehen) | Strg+Z holt alles in einem Schritt zurück; der Klick wählt nur dieses eine | ✅ |

## 38. Neu in 3.66

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 38.1 | Live, schräg von oben auf einen Raum mit vielen Lampen schauen (Stehlampe vor einer Deckenlampe), dann drehen und zoomen | Die runden Kugeln liegen nicht mehr aufeinander, sie rücken auf dem Bildschirm auseinander und bleiben nahe bei ihrem Gerät (#314) | ✅ (2026-10-17) |
| 38.2 | Ansicht einstellen (z. B. „Ganzes Haus“ oder ein Raum, Blickwinkel), dann ⚙ → „Wandtablet“ → „📌 Aktuelle Ansicht übernehmen“; Seite neu laden | Daneben steht „Gespeichert: …“; nach dem Neuladen öffnet sich genau diese Ansicht (#315) | ✅ (2026-10-17) |
| 38.3 | ⚙ → „Automatisch“, neu laden | Wieder der alte Start (Erdgeschoss bzw. Raum des Benutzers) | ✅ (2026-10-17) |
| 38.4 | „Benutzer“ → bei einem Benutzer „Start: aktuelle Ansicht übernehmen“ | Steht danach auf „Start: gespeicherte Ansicht“; dieser Benutzer startet dort und das Wandtablet kehrt dorthin zurück (Wirkung nur im Add-on) | ✅ (2026-10-17) |
| 38.5 | Oben 🛡️ Sicherheit, einen Tag abspielen | Die Leiste unten geht über die ganze Breite (#316) | ✅ (2026-10-17) |
| 38.6 | Oben „🗄️ Backup“ | Ein Fenster mit Backup, automatischer Sicherung und Sicherheit; in der Seitenleiste heißt der Abschnitt nur noch „Häuser“ (#321) | ✅ (2026-10-17) |
| 38.7 | Im Backup-Fenster unter „Sicherheit“ | Liste der aufgezeichneten Tage, je Tag ▶ (abspielen) und ⬇ (Datei herunterladen); „Tage behalten“ ändern bleibt gespeichert (#317, nur im Add-on mit Aufzeichnung) | ✅ (2026-10-17) |
| 38.8 | Bearbeiten, „2D + 3D“, Werkzeug „Treppe“ oder „Gerät“ | Rechts in 3D keine große dunkle Fläche mehr; Rasen sichtbar mit leichtem Raster darüber (#320) | ✅ (2026-10-17) |

## 39. Neu in 3.67
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 39.1 | Bearbeiten, einen LED-Ring (indirekt) auswählen, „Anzahl Abschnitte“ z. B. 4, „Gleichmäßig verteilen“ | Im 2D-Plan hat jeder Abschnitt eine eigene, helle Farbe (Linie und Nummer); in den Eigenschaften hat jeder Abschnitt links einen Rand in derselben Farbe (#325) | ✅ (2026-10-17) |
| 39.2 | Dasselbe in 3D anschauen, dann einen Abschnitt einschalten und in den Live-Modus wechseln | In 3D sind die ausgeschalteten Abschnitte leicht in ihrer Farbe getönt; der eingeschaltete leuchtet in seiner Lichtfarbe; im Live-Modus sind keine Markierungsfarben zu sehen | ✅ (2026-10-17) |

## 40. Neu in 3.69: Rollläden an den Fenstern
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 40.1 | Bearbeiten, Erdgeschoss, ein Fenster ohne Rollladen anklicken (z. B. im Bad); in den Eigenschaften den Haken „Rollladen“ setzen, dann wieder entfernen | Mit Haken erscheint darunter das Feld „Rollladen-Entität“ (zeigt die Rollläden aus Home Assistant), im 2D-Plan eine gestrichelte Linie außen am Fenster; ohne Haken ist beides wieder weg (#331) | ✅ (2026-10-17) |
| 40.2 | Erdgeschoss in 3D: Küchenfenster und Schlafzimmerfenster anschauen (von innen und von außen) | Küche: der Rollladen ist ganz unten (zu); Schlafzimmer: gut zur Hälfte unten (40 % offen); der Rollladen hängt außen vor dem Glas. Über jedem dieser Fenster steht ein Schild „↕ Geschlossen“ bzw. „↕ 40 % offen“ | ✅ (2026-10-17) |
| 40.3 | Live, Erdgeschoss: die Kugel 🪟 unter dem Küchenfenster antippen, „Hoch“ drücken, danach den Schieber in die Mitte ziehen | Eine Karte „Fenster Küche“ mit „🪟 Rollladen“, Hoch / Stopp / Runter und Schieber; nach „Hoch“ fährt der Rollladen in 3D sichtbar hoch, die Karte und das Schild über dem Fenster zeigen „Offen“; mit dem Schieber in der Mitte fährt er bis zur Hälfte runter und das Schild zeigt „↕ 50 % offen“ | ✅ (2026-10-17) |
| 40.4 | Live, in die Küche tippen (Raum-Karte) | Unter „ROLLLÄDEN“ steht „Fenster Küche“ mit Öffnen / Stopp / Schließen; unter „FENSTER“ steht weiter der Fensterkontakt. Oben bei „n offen“ zählt ein offener Rollladen nicht als offenes Fenster | ✅ (2026-10-17) |
| 40.5 | Etage „Dach“: das Gaubenfenster anklicken (Bearbeiten), dann im Live-Modus seine Kugel 🪟 antippen und „Runter“ drücken | Bearbeiten: Haken „Rollladen“ ist gesetzt, Entität „Rollladen Gaube“. Live: die Karte „Gaubenfenster“ öffnet sich, der Rollladen der Gaube fährt herunter | ✅ (2026-10-17) |
| 40.6 | Live, Ansicht 2D, Erdgeschoss | Außen an Küche und Schlafzimmer steht „↕ Geschlossen“ bzw. „↕ 40 % offen“; beim Küchenfenster steht der Text des Fensterkontakts darunter, nichts liegt übereinander; ein Tipp aufs Fenster öffnet die Karte mit dem Rollladen | ✅ (2026-10-17) |

## 41. Neu in 3.70: Rollladen-Karte
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 41.1 | Live, Erdgeschoss, schräg von oben auf das Küchenfenster schauen | Die Kugel 🪟 sitzt **über** dem Fenster (dort, wo der Rollladen sitzt), nicht darunter; das Schild „↕ Geschlossen“ steht über der Kugel (#335) | ✅ (2026-10-17) |
| 41.2 | Die Kugel 🪟 über dem Küchenfenster antippen | Eine Karte „🪟 Rollladen · Fenster Küche“ öffnet sich: groß „Geschlossen“, daneben ein hoher Schieber mit dem Panzer, Hoch / Stopp / Runter und darunter 0 % / 25 % / 50 % / 75 % / 100 %. **Kein** Fensterkontakt („Fenster · Offen · binary_sensor…“) in der Karte | ✅ (2026-10-17) |
| 41.3 | Am Schieber mit dem Finger den Panzer nach oben bis etwa zur Mitte ziehen und loslassen | Beim Ziehen zeigt die Karte groß die Prozent („50 % offen“); nach dem Loslassen fährt der Rollladen in 3D bis dorthin, das Schild über dem Fenster zeigt dasselbe | ✅ (2026-10-17) |
| 41.4 | „75 %“ antippen, dann „100 %“, dann „▼ Runter“ | Der Rollladen fährt jeweils dorthin; die gewählte Stufe ist blau markiert; nach „Runter“ ist er ganz zu | ✅ (2026-10-17) |
| 41.5 | Am Handy hochkant: die Karte offen lassen und unten auf „Ansicht ▴“ schauen | Die Karte steht **über** den Knöpfen unten (Normal, Temp., Feuchte, CO₂), nichts davon verdeckt die Karte | ✅ (2026-10-17) |

## 42. Neu in 3.71: lange Schleppgaube
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 42.1 | Bearbeiten, Etage „Dach“, „Etage verwalten“: bei einer Gaube „Dachform der Gaube“ auf „Schleppgaube“ stellen | Neue Felder „Neigung der Gaube (°)“ (15) und ein Hinweis erscheinen; „Abstand zur Traufe“ springt auf den Überstand (0,4 m). In 3D: die Vorderwand steht auf der Außenwand und geht senkrecht hoch, das Dach der Gaube läuft flacher nach oben ins Hauptdach, unter dem First (#339) | ✅ (2026-10-28, Claude in der Demo) |
| 42.2 | „Breite“ auf 6 m (oder mehr als 5 m) stellen | Die Gaube wird so lang, sie bleibt auf dem Dach und unter dem First; eine Sattelgaube bliebe höchstens 5 m breit | ✅ (2026-10-28, Claude in der Demo) |
| 42.3 | „Abstand vom Giebel“ auf 3 m stellen, danach die „Breite“ ändern | Die Gaube beginnt 3 m vom Giebel links (bzw. oben) im Plan; beim Ändern der Breite bleibt ihr Anfang stehen, der Schieber „Position am First“ wandert mit | ✅ (2026-10-28, Claude in der Demo) |
| 42.4 | „Neigung der Gaube“ auf 8 und dann auf 25 stellen, danach „Höhe der Wand“ sehr hoch (z. B. 3 m) | Das Gaubendach wird flacher bzw. steiler. Ist die Wand zu hoch für die Neigung, wird zuerst das Gaubendach flacher (das Feld zeigt den benutzten Wert), erst dann die Wand niedriger; nichts ragt über den First | ✅ (2026-10-28, Claude in der Demo: 25° wird zu 19,3°, mit 3 m Wand 2°; das Feld zeigte die neue Neigung erst nach dem Neuöffnen, repariert in 4.38.1) |
| 42.5 | Haken „Ausgebauter Dachstuhl“ setzen (Kniestock), dann die Etage darunter öffnen | Unter der Schleppgaube gehen die Wände gerade hoch bis unter ihr schräges Dach; daneben werden sie an der Dachschräge abgeschnitten | ✅ (2026-10-28, Claude in der Demo) |
| 42.6 | Mit der Kamera nah an eine Gaube (auch eine normale) heran, oder einen Raum unter einer Gaube öffnen | Die Schräge des Hauptdachs läuft **nicht** mehr quer durch den Raum unter der Gaube: dort hat das Dach ein Loch, das Gaube und Gaubendach schließen | ✅ (2026-10-28, Claude in der Demo) |

## 43. Neu in 3.72: Fenster der Räume durch die Schleppgaube
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 43.1 | Schleppgaube auf der Außenwand (42.1), Haken „Fenster“ aus. Etage darunter öffnen, Werkzeug „Tür/Fenster“: in die Wand unter der Gaube zwei Fenster setzen (z. B. eines pro Raum), Sims etwa 1,2 m | Von außen (Ganzes Haus oder Live) sind beide Fenster **durch die Gaube** zu sehen, mit Rahmen und Glas; die Gaube hat dort keine geschlossene Wand mehr (#341) | ✅ (2026-10-28, Claude in der Demo) |
| 43.2 | Eines der Fenster anklicken, Kontakt und Haken „Rollladen“ mit Entität setzen | Es ist ein normales Fenster: Kontakt, offen = rot, Rollladen fährt außen vor dem Glas, Kugel 🪟 im Live-Modus | ✅ (2026-10-28, Claude in der Demo) |
| 43.3 | Live: in den Raum tippen (Raum-Karte), oben auf „n offen“ schauen | Das Fenster steht beim richtigen Raum, ein offenes Fenster zählt bei „n offen“ | ✅ (2026-10-28, Claude in der Demo) |
| 43.4 | Ein Fenster in der Wand verschieben oder löschen | Das Loch in der Gaube wandert mit bzw. ist wieder zu | ✅ (2026-10-28, Claude in der Demo) |

## 44. Neu in 3.73: Dach mit Absatz (Haus vorne schmaler, hinten breiter)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 44.1 | Bearbeiten, Etage „Dach“, Ansicht 2D: das Dach anklicken, dann Doppelklick auf eine lange Dachkante | An der Stelle wird die Kante geteilt: auf beiden Teilen erscheint eine **Raute** (#342) | ✅ (2026-10-21) |
| 44.2 | Die Raute eines Teils nach innen oder außen ziehen | Die Kante dieses Teils wandert in 5-cm-Schritten mit (Alt: frei); beim Loslassen ist das Dach in 3D an dieser Stelle schmaler bzw. breiter, der First bleibt gerade und gleich hoch, am Absatz schließt ein kleines Dreieck die Lücke | ✅ (2026-10-21) |
| 44.3 | Strg+Z, dann Doppelklick auf eine Raute | Strg+Z nimmt das Ziehen zurück; der Doppelklick nimmt den Absatz wieder weg | ✅ (2026-10-21) |
| 44.4 | „Etage verwalten“ aufklappen, Abschnitt „Absätze“: Seite, „Ab (Abstand vom Giebel)“ und „Nach außen“ ändern, „+ Absatz“, × | Das Dach ändert sich passend; „+ Absatz“ legt einen auf Seite A in der Hausmitte an (50 cm nach außen) | ✅ (2026-10-21) |
| 44.5 | „Ausgebauter Dachstuhl“ an, die Etage darunter öffnen; eine Gaube und ein Solarpanel auf den breiten Teil setzen | Die Wände werden an der richtigen Dachfläche abgeschnitten; Gaube und Panel sitzen auf der flacheren Fläche des breiten Teils | ✅ (2026-10-21) |
| 44.6 | Dachform „Walmdach“ wählen | Statt der Absätze steht ein Hinweis (nur Sattel- und Flachdach); das Walmdach bleibt rechteckig | ✅ (2026-10-21) |

## 45. Neu in 3.74: Schleppgaube bis zur Kante, Ecken einzeln ziehen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 45.1 | Bei einer Schleppgaube „Abstand vom Giebel“ auf 0 stellen (oder den Schieber ganz an den Rand), dann von der Giebelseite schauen | Vorderwand, Seitenwand und Dach der Gaube enden genau an der Dachkante, kein Abstand; Giebel und Gaubenseite sind eine Fläche (#345) | ✅ (2026-10-28, Claude in der Demo) |
| 45.2 | Die Gaube so breit machen, dass sie bis zum anderen Giebel reicht | Auch dort bündig bis an die Kante | ✅ (2026-10-28, Claude in der Demo: Breite = Länge des Hauses, 10 m; bündig an beiden Giebeln) |
| 45.3 | Dach mit Absatz (44.1), Ansicht 2D: das Dach anklicken und einen **Kreis** an einem Absatz ziehen, längs und quer | Der Absatz wandert längs mit, die Kante dieses Stücks quer (5-cm-Schritte); beim Loslassen folgt das Dach in 3D; Strg+Z nimmt es zurück | ✅ (2026-10-28, Claude in der Demo) |

## 46. Neu in 3.75: Karte für das Dashboard (46.1 in der Demo, der Rest nur in Home Assistant)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 46.1 | Demo mit der Adresse `https://burned4aim.github.io/HA-Floorplanner/?card=1&floor=house&heatmap=temp&theme=light` öffnen, Fenster schmal und niedrig ziehen; danach `…/?card=1&floor=1&show_bar=0&show_nav=0` | So sieht das Haus später in der Karte aus: ganzes Haus, hell, Temperaturfarben, keine Werkzeugleiste, die Farbskala verdeckt den Kompass nicht; die zweite Adresse zeigt das Obergeschoss ohne Knöpfe oben und unten | ✅ (2026-10-21) |
| 46.2 | HACS → ⋮ → Benutzerdefinierte Repositories: `https://github.com/BuRnEd4AiM/HA-Floorplanner`, Typ „Dashboard“; „3D Floorplan Card“ herunterladen, Browser neu laden | HACS lädt die Karte und trägt sie selbst als Ressource ein (#13) | ✅ (2026-10-11) mit 3.75.1: die Karte ist geladen, ihr Editor öffnet sich (mit 3.75.0 fehlte sie, #348) |
| 46.3 | Dashboard bearbeiten → „Karte hinzufügen“, nach „3D Floorplan“ suchen | Die Karte steht in der Liste; nach dem Hinzufügen zeigt sie das Haus live, ohne Werkzeugleiste | ❓ (repariert in 3.77.1, #352: bitte in Home Assistant noch einmal prüfen. Damals ❌ 2026-10-11: „Das Add-on 3D Floorplan wurde nicht gefunden“) |
| 46.4 | Im Editor der Karte „Etage“ aufklappen | Die Etagen und Räume des eigenen Plans stehen zur Auswahl, dazu „Ganzes Haus“; die Vorschau wechselt auf die gewählte Etage | ❓ |
| 46.5 | In der Karte eine Lampen-Kugel antippen, schalten; in einen Raum tippen | Die Live-Karte öffnet sich und schaltet die Lampe; der Raum öffnet sein Raum-Fenster (mit „Raum-Fenster“ aus: nur hineinzoomen) | ❓ |
| 46.6 | „Design“ auf „Wie Home Assistant“, dann im Profil von Home Assistant zwischen dunkel und hell wechseln | Die Karte wechselt mit (dunkel / hell); das Add-on selbst behält sein Design | ❓ |
| 46.7 | „Raumfarben“ auf „Temperatur“, „Leiste oben“ und „Leiste unten“ aus | Die Karte startet mit den Temperaturfarben, ohne Knöpfe oben und unten | ❓ |
| 46.8 | Ein Sections-Dashboard: die Karte größer und kleiner ziehen; ein anderes Dashboard mit „Bildschirm füllen“ | Die Ansicht füllt immer die ganze Karte, ohne Ränder oder Balken | ❓ |
| 46.9 | Das Add-on anhalten, das Dashboard neu laden; danach wieder starten | Die Karte sagt „Das Add-on 3D Floorplan läuft nicht …“; nach dem Start erscheint das Haus von selbst (bis zu einer halben Minute) | ❓ |

## 47. Neu in 3.76: Durchsichtig nur die Wand
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 47.1 | Unten „Ansicht“ → „Durchsichtig“ einschalten, die Kamera langsam um das Haus drehen | Die Wände zur Kamera werden durchsichtig; ihre Fenster (Rahmen, Glas, Rollladen) und Türen (Rahmen, Türblatt) bleiben so sichtbar wie sonst (#350) | ✅ (2026-10-21) |
| 47.2 | Dabei auf die Möbel hinter der durchsichtigen Wand schauen (Sofa, Schrank, Tisch) | Die Möbel bleiben fest, nicht durchsichtig | ✅ (2026-10-21) |

## 48. Neu in 3.77: Musterhaus mit allem drin (nur im Add-on, die Demo hat keinen Import)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 48.1 | Bearbeiten, „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Musterhaus (alles drin)“ → „Prüfen“ | Grün: 4 Etagen, 23 Räume, 74 Wände, 44 Türen/Fenster, 264 Geräte (seit 3.84 mit den Möbeln im skandinavischen Stil, seit 3.85 mit Sauna, Fitness, Heimkino und Bar im neuen Kellerteil); keine Fehler und keine Hinweise (#353) | ✅ (2026-10-25, Claude im Test-Add-on; inzwischen 329 Geräte) |
| 48.2 | „Importieren“, dann „Ganzes Haus“ | Ein neues Haus „Musterhaus – alles drin“: Keller in der Erde, Erdgeschoss mit Garage, Obergeschoss mit Dachterrasse (Geländer, keine Wände), Satteldach mit drei Gauben und Solaranlage, Gartenhaus mit Walmdach, Pool mit Brücke, Einfahrt mit Auto | ✅ (2026-10-25, Claude im Test-Add-on) |
| 48.3 | Die Etagen einzeln öffnen und die Treppen suchen | U-Treppe vom Keller bis ins Obergeschoss, L-Treppe von der Werkstatt in die Garage, Wandtreppe vom Wohnzimmer zur Galerie, Wendeltreppe außen an der Garage zur Dachterrasse, Bodentreppe im Kinderzimmer | ✅ (2026-10-25, Claude im Test-Add-on) |
| 48.4 | Etage „Dach“: die Solaranlage anklicken; dann „Dieses Haus als JSON exportieren“ und die Datei wieder importieren | Die Solaranlage liegt auf der Dachfläche; im wieder importierten Haus ist sie noch da (vorher ging sie verloren) | ✅ (2026-10-25, Claude im Test-Add-on) |
| 48.5 | „Häuser“ → das Musterhaus löschen | Es ist weg, das eigene Haus bleibt unverändert | ✅ (2026-10-25, Claude im Test-Add-on) |

## 49. Neu in 3.80: Küchenzeile ohne Oberschrank über einzelnen Modulen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 49.1 | Bearbeiten, die Küchenzeile anklicken; in der Modul-Liste bei einem Unterschrank den Haken neben der Breite wegnehmen | In 3D ist nur der Oberschrank über diesem Modul weg; Unterschrank und Arbeitsplatte bleiben (#372) | ✅ (2026-10-21) |
| 49.2 | Beim Herd den Haken wegnehmen; beim Kühlschrank nachsehen | Die Haube über dem Herd ist weg; Kühlschrank, Hochschrank und Lücke haben keinen Haken | ✅ (2026-10-21) |
| 49.3 | Bei einem Modul ohne Oberschrank den Typ (z. B. Schubladen) oder die Breite ändern und es mit ↑/↓ verschieben | Der Oberschrank bleibt weg, er wandert mit dem Modul | ✅ (2026-10-21) |
| 49.4 | Oben den Haken „Oberschränke“ wegnehmen, dann wieder setzen | Weg: alle Oberschränke sind weg, die Haken in den Zeilen verschwinden; wieder gesetzt: die Oberschränke kommen zurück, nur nicht über den Modulen ohne Haken | ✅ (2026-10-21) |

## 50. Neu in 3.82: Strom-Rechnung (Reiter „⚡ Rechnung“ im Strom-Editor)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 50.1 | Bearbeiten, oben „Strom-Editor“ drücken | Neben „Kabel“ erscheint der Knopf „⚡ Rechnung“; ohne Strom-Editor ist er nicht da (#378) | ✅ (2026-10-21) |
| 50.2 | „⚡ Rechnung“ drücken | Ein Fenster „Strom: was ist was und wie wird gerechnet“; oben „So wird gerade gerechnet“: Erzeugung, + Bezug aus dem Netz, − Batterie lädt, = Hausverbrauch (berechnet) mit den Werten von jetzt; bei allem, was nicht eingestellt ist, steht „Automatisch aus dem Plan: …“ mit dem Gerät und seinem Wert | ✅ (2026-10-21) |
| 50.3 | Die Strom-Anzeige oben links ansehen (Demo: Erzeugung 3,20 kW, Bezug 450 W, Batterie lädt 600 W) | ⌂ zeigt 3,05 kW: die ladende Batterie wird abgezogen (vorher 3,65 kW, #379) | ✅ (2026-10-21) |
| 50.4 | Bei „Netz“ einen Sensor wählen, dann „Vorzeichen umdrehen“ an- und wieder ausschalten | Unter dem Sensor „jetzt: … → Bezug“ bzw. „→ Einspeisung“; die Rechnung oben und die Anzeige oben links ändern sich sofort mit | ✅ (2026-10-21) |
| 50.5 | Wenn die Rechnung unter null fällt: „⚠ … unter null“ mit dem Knopf „Vorzeichen am Netz umdrehen“ drücken | Die Warnung ist weg, unten steht „✓ Die Rechnung geht auf.“ | ✅ (2026-10-21) |
| 50.6 | Bei „Batterie“ den Haken „Batterie im Hausverbrauch mitrechnen“ wegnehmen, dann wieder setzen | Weg: oben „Batterie (nicht mitgerechnet)“, der Verbrauch ist ohne Batterie; wieder gesetzt: wie vorher | ✅ (2026-10-21) |
| 50.7 | Bei „Räume“ „Vorschlagen“ drücken oder bei einem Raum „+ Sensor hinzufügen …“ (z. B. „Wohnzimmer Leistung“) | Der Raum zeigt den Sensor mit seinem Wert; oben „↳ Raumname“ und „Rest (keinem Raum zugeordnet)“; × nimmt ihn wieder heraus | ✅ (2026-10-21) |
| 50.8 | Fenster schließen, „Live“, mit der Maus auf die Strom-Anzeige oben links zeigen | Die Anzeige rechnet mit den Einstellungen aus dem Fenster; der Hinweis nennt die Räume und den Rest | ✅ (2026-10-21) |

## 51. Neu in 3.84: Möbel im skandinavischen Stil
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 51.1 | Bearbeiten, Werkzeug „Gerät“, links die Bibliothek ansehen | Neue Gruppen „Kinder“ und „Flur“; in „Wohnen“, „Küche“, „Bad“, „Schlafen“, „Büro“, „Licht“ und „Deko“ viele neue Teile mit Vorschaubild (Würfelregale, Bücherregale, Sofas, Sessel, Kommoden, Schränke, Schreibtische, Lampen …) | ✅ (2026-10-21) |
| 51.2 | Im Suchfeld „kallax“ eingeben, dann „billy“, „malm“, „pax“, „poäng“ | „kallax“: die 4 Würfelregale; „billy“: die 2 hohen Bücherregale; „malm“: Bett mit hohem Kopfteil, 2 Kommoden, Nachttisch; „pax“: die 2 Kleiderschränke; „poäng“: der Schwingsessel | ✅ (2026-10-21) |
| 51.3 | Ein Würfelregal 2×4 in einen Raum setzen, im 2D-Plan nachsehen | In 3D ein weißes Regal mit 8 Fächern (Boxen, Bücher, eine Tür); im 2D-Plan ist das Rechteck so groß wie das Regal (77 × 39 cm) | ✅ (2026-10-21) |
| 51.4 | Das Regal anklicken, rechts bei „Ausführung“ „Eiche“ wählen, dann „Schwarzbraun“; Strg+Z | Das Regal wird sofort eichenfarben, dann schwarzbraun; Strg+Z holt die vorige Ausführung zurück. Nach dem Neuladen ist die gewählte Ausführung noch da | ✅ (2026-10-21) |
| 51.5 | Eine „Papier-Hängelampe“ (Gruppe „Licht“) setzen und mit einer Lampe aus Home Assistant verknüpfen, dann „Live“ und die Lampe einschalten | Die Papierkugel hängt unter der Decke und leuchtet, der Raum wird hell wie bei den anderen Lampen | ✅ (2026-10-21) |
| 51.6 | In der Gruppe „Kinder“ das Hochbett und den Plüschhai setzen | Hochbett mit Leiter und Rausfallschutz, darunter frei; ein kleiner blauer Hai mit weißem Bauch | ✅ (2026-10-21) |
| 51.7 | Einen Kleiderschrank mit Schiebetüren an eine Wand schieben | Er bleibt an der Wand stehen und lässt sich nicht hineinschieben (Wandstopp) | ✅ (2026-10-21) |
| 51.8 | Sprache auf Englisch stellen und die Bibliothek ansehen | Alle neuen Teile und die Ausführungen haben englische Namen, z. B. „Cube shelf 2×4“, „Oak“ | ✅ (2026-10-21) |

## 52. Neu in 3.85: Sauna, Fitness, Bar, Heimkino, PC und Spiegel mit LED-Zonen
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 52.1 | Bearbeiten, Werkzeug „Gerät“, links die Bibliothek ansehen | Neue Gruppen „Sauna & Wellness“, „Fitness“, „Bar“ und „Heimkino“, jede mit Vorschaubildern; bei „Büro“ PC, Gaming-PC, PC-Arbeitsplatz, Laptop, Gaming-Stuhl, Netzwerkschrank; bei „Bad“ die LED-Spiegel und der Spiegelschrank | ✅ (2026-10-21) |
| 52.2 | Eine „Sauna mit Glasfront“ in einen Raum setzen, mit dem Schalter oder Thermostat der Sauna verknüpfen, „Live“, die Sauna einschalten | Holzkabine mit Glasfront und Glastür, innen zwei Bänke und der Ofen; eingeschaltet glühen die Saunasteine orange und das Licht unter der Bank und hinter der Lehne leuchtet | ✅ (2026-10-21) |
| 52.3 | Bei „Ausführung“ „Thermoholz“ wählen | Die Kabine wird dunkelbraun | ✅ (2026-10-21) |
| 52.4 | Aus „Fitness“ Laufband, Power Rack und Hantelbank setzen, aus „Bar“ die „Bartheke mit LED“, das Barregal und den Billardtisch | Die Teile stehen in echter Größe im Raum (Billardtisch 2,50 × 1,40 m), im 2D-Plan genauso groß | ✅ (2026-10-21) |
| 52.5 | Aus „Heimkino“ die „Leinwand mit Rahmen“ an eine Wand setzen und den „Beamer (Decke)“ davor; beide mit dem Beamer oder Mediaplayer verknüpfen, „Live“, abspielen | Die Leinwand rastet an der Wand ein; der Beamer hängt unter der Decke. Beim Abspielen leuchtet die Leinwand hell und die Linse des Beamers | ✅ (2026-10-21) |
| 52.6 | Den „Gaming-PC mit RGB“ mit dem Schalter des PCs verknüpfen, „Live“, einschalten | Die Lüfter vorne und die Teile hinter dem Glas leuchten lila (oder in der Farbe des Lichts, wenn es ein Licht ist) | ✅ (2026-10-21) |
| 52.7 | Den „LED-Spiegel mit 3 Zonen“ an eine Wand setzen und anklicken | Der Spiegel rastet flach an der Wand ein; rechts unter „LEDs einzeln verknüpfen“ drei Felder „Hinten (indirekt)“, „Vorne“, „Unten“, jedes mit einem farbigen Streifen; in 3D haben die LEDs genau diese Farben | ✅ (2026-10-21) |
| 52.8 | Nur das Hauptgerät (oben „Entität“) mit einem Licht verknüpfen, „Live“, einschalten | Alle LEDs des Spiegels leuchten, der Raum wird etwas heller | ✅ (2026-10-21) |
| 52.9 | Zurück zu „Bearbeiten“, für „Hinten (indirekt)“ und „Unten“ je ein eigenes Licht wählen; „Live“, den Spiegel antippen | Die Karte zeigt „x von 3 LED-Zonen an“ und drei Knöpfe „Hinten (indirekt)“, „Vorne“, „Unten“; ein Knopf öffnet die Steuerung nur dieser LED, „Alle LEDs“ schaltet alle | ✅ (2026-10-21) |
| 52.10 | Nur das Licht „Hinten“ einschalten, z. B. in Blau | In 3D leuchtet nur der Rand hinter dem Spiegel blau, die anderen LEDs bleiben aus | ✅ (2026-10-21) |
| 52.11 | Die „Bartheke mit LED“ anklicken, „Thekenkante“ und „Sockel“ mit zwei Lichtern verknüpfen, in „Live“ beide einschalten | Die Kante der Theke und das Licht am Boden vor dem Sockel leuchten jeweils in der Farbe ihres Lichts | ✅ (2026-10-21) |
| 52.12 | „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Musterhaus (alles drin)“ → „Importieren“, dann den „Keller“ öffnen | Rechts neben der Werkstatt ein neuer Kellerteil mit „Sauna & Wellness“, „Heimkino“, „Fitness“ und „Bar“; im Garten Fass-Sauna, Whirlpool und Poolbar | ✅ (2026-10-25, Claude im Test-Add-on) |

## 53. Neu in 3.86: Bildschirme am Gaming-PC-Arbeitsplatz, große Spiegel mit zwei LEDs
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 53.1 | Den „Gaming-PC-Arbeitsplatz“ (Gruppe „Büro“) setzen und anklicken, rechts bei „Anordnung“ nacheinander alle Möglichkeiten wählen | „2 Monitore nebeneinander“ (so wie bisher), „1 Monitor“, „3 Monitore nebeneinander“ (die äußeren schräg nach innen), „4 Monitore (2 × 2)“ an einem Monitorarm, „Curved-Monitor“ (gebogen), „Curved + 2 hochkant“; bei 3 Monitoren und bei Curved + 2 hochkant wird der Tisch breiter (1,80 m), auch im 2D-Plan | ✅ (2026-10-21) |
| 53.2 | Eine Anordnung wählen, Strg+Z; dann eine wählen und die Seite neu laden | Strg+Z holt die vorige Anordnung zurück; nach dem Neuladen ist die gewählte noch da | ✅ (2026-10-21) |
| 53.3 | Die „Spiegelwand mit LED“ und den „Ganzkörperspiegel mit LED“ anklicken, unter „LEDs einzeln verknüpfen“ für „Hinten (indirekt)“ und „Vorne“ je ein Licht wählen, „Live“, beide einzeln schalten | Der Rand hinter dem Spiegel und die zwei Lichtstreifen vorne links und rechts leuchten jeweils mit ihrem eigenen Licht; der Spiegel antippen zeigt zwei Knöpfe | ✅ (2026-10-21) |

## 54. Neu in 3.87: Fernseher am Schwenkarm, Klimageräte und Ventilatoren
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 54.1 | Den „Wand-TV mit Schwenkarm“ (Gruppe „Wohnen“, Suche „schwenkarm“) nahe an eine Wand setzen | Er springt an die Wand; man sieht die Wandplatte, den Klapparm und den Fernseher ein Stück (15 cm) vor der Wand | ✅ (2026-10-21) |
| 54.2 | Anklicken, rechts „Schwenken“ auf 30, dann auf −30, „Neigen“ auf 10, „Abstand zur Wand“ auf 0,4 m, „Größe“ auf 75″ | Der Bildschirm dreht sich nach rechts bzw. links (von vorne gesehen), kippt nach unten, steht weiter von der Wand ab, wird größer; der Arm klappt dabei mit aus und der Fernseher stößt nie an die Wand. Beim Schwenken steht unter den Feldern, wie weit er von der Wand absteht | ✅ (2026-10-21) |
| 54.3 | Bei „Hintergrundlicht (LED hinter dem TV)“ ein Licht wählen, das Licht einschalten, dann schwenken | Der Rahmen hinter dem Fernseher leuchtet in der Farbe des Lichts und dreht sich mit dem Fernseher mit | ✅ (2026-10-21) |
| 54.4 | Etwas ändern, Strg+Z; dann die Seite neu laden | Strg+Z holt die vorige Stellung zurück; nach dem Neuladen steht er noch so, wie eingestellt | ✅ (2026-10-21) |
| 54.5 | Links die Gruppe „Klima & Lüftung“ öffnen | Klimagerät (Split, Wand), Klima-Außengerät / Wärmepumpe, mobiles Klimagerät, Klima-Deckenkassette, Deckenventilator mit Licht, Standventilator, Turmventilator, Luftreiniger, Luftentfeuchter, jeweils mit Vorschaubild | ✅ (2026-10-21) |
| 54.6 | Das Split-Klimagerät an eine Wand setzen, mit dem Thermostat (`climate.…`) verknüpfen, in „Live“ auf Kühlen, dann auf Heizen stellen | Kühlt es, wird die Klappe unten blau, heizt es, wird sie rot; das Display leuchtet, solange es läuft (auch bei nur Lüften oder Entfeuchten); das Schild zeigt die Temperatur | ✅ (2026-10-21) |
| 54.7 | Ein mobiles Klimagerät an einer Steckdose (`switch.…`) einschalten | Der Luftauslass oben wird blau (es kühlt), das Display leuchtet | ✅ (2026-10-21) |
| 54.8 | Den Deckenventilator mit seinem Ventilator (`fan.…`) verknüpfen, unter „LEDs einzeln verknüpfen“ bei „Licht“ die Lampe des Ventilators wählen | Die Leuchte unter dem Ventilator folgt ihrem eigenen Licht und erhellt den Raum | ✅ (2026-10-21) |

## 55. Neu in 3.88: Etagen aufeinander wie ein echtes Haus
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 55.1 | „Ganzes Haus“, unten „Ansicht“ öffnen | Neben „Auseinander“ steht ein Knopf **„Aufeinander“**; in einer einzelnen Etage sind beide nicht da | ✅ (2026-10-21) |
| 55.2 | „Aufeinander“ drücken, das Haus von der Seite ansehen | Die Etagen sitzen ohne Lücke aufeinander, zwischen ihnen ist eine Decke (ein etwa 40 cm hohes Band in der Fassade), die Wände unter dem Dach reichen bis an das Dach; an der Treppe ist die Decke offen | ✅ (2026-10-21) |
| 55.3 | Noch einmal „Aufeinander“ drücken; dann „Auseinander“ und danach „Aufeinander“ | Wieder die gewohnte Ansicht (kleine Lücke); „Auseinander“ und „Aufeinander“ lösen sich ab, nur einer ist gedrückt | ✅ (2026-10-21) |
| 55.4 | „Aufeinander“ an, „Live“, schräg von oben schauen, dann tiefer von der Seite in das Erdgeschoss schauen | Die Kugeln (💡), Schilder (z. B. „22,1 °C“) und Raumnamen vom Erdgeschoss schweben nicht über dem 1. Stock; von der Seite sieht man sie im Erdgeschoss unter der Decke | ✅ (2026-10-21) |
| 55.5 | Seite neu laden, „Ganzes Haus“; ⚙ öffnen | Das Haus steht wieder „aufeinander“; in ⚙ steht bei „Etagen im ganzen Haus“ „Aufeinander (wie ein echtes Haus)“, dort lässt es sich auch umstellen | ✅ (2026-10-21) |
| 55.6 | Haus ohne Keller, Erde „fest“: den 1. Stock öffnen (#391) | Das Erdgeschoss darunter ist blass, aber darunter ist Boden (grau), kein schwarzes Loch im Rasen | ✅ (2026-10-21) |
| 55.7 | Das Erdgeschoss öffnen, dann „Ganzes Haus“ und „Live“ (#392) | Auch die Lampen im 1. Stock haben ihre Kugeln und leuchten, wenn sie an sind; ebenso umgekehrt (erst den 1. Stock öffnen: das Erdgeschoss hat seine Kugeln) | ✅ (2026-10-21) |

## 56. Neu in 3.89: flüssig auf dem iPad, „Aufeinander“ auch bei einer Etage
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 56.1 | Auf dem iPad das Musterhaus („alles drin“) öffnen, in „Live“ drehen und zoomen, auch in „Ganzes Haus“ (#394) | Es läuft flüssig, ruckelt nicht mehr | ❓ |
| 56.2 | Unten „Ansicht“ → „⏱ Leistung“ auf „alle Werte“ | Bei „Zeichenaufrufe“ stehen im ganzen Haus etwa 1.300 statt früher etwa 3.700 | ❓ (Claude 2026-10-25 im Test-Add-on: im ganzen Haus 1.661 Zeichenaufrufe; flüssig ist es nur am iPad zu beurteilen) |
| 56.3 | Möbel, Bar, Sauna, Küche, Türen, Fenster und Treppen ansehen; eine Lampe, eine LED-Zone, einen Rollladen und eine Tür mit Kontakt schalten | Alles sieht aus wie vorher; was leuchtet, leuchtet; Türen und Fenster gehen auf, Rollläden fahren | ✅ (2026-10-21) |
| 56.4 | Eine Etage öffnen (z. B. Obergeschoss), unten „Ansicht“ öffnen (#396) | „Aufeinander“ steht da, „Auseinander“ nicht (das gibt es nur in „Ganzes Haus“) | ✅ (2026-10-21) |
| 56.5 | „Aufeinander“ drücken, von der Seite schauen | Die Etage sitzt ohne Lücke auf der Etage darunter (Decke dazwischen); die Namen und Schilder der Etage darunter schweben nicht mehr über der offenen Etage | ✅ (2026-10-21) |
| 56.6 | „Benutzer“ → bei einem Benutzer unter „🔒 Gesperrt“ „Abstand der Etagen (Auseinander / Aufeinander)“ abhaken, als dieser Benutzer öffnen | Die Knöpfe „Auseinander“ und „Aufeinander“ fehlen; die Ansicht bleibt so, wie sie eingestellt ist | ✅ (2026-10-25, Claude im Test-Add-on) |
| 56.7 | README auf GitHub öffnen (#395) | Das Abzeichen „release“ zeigt die Version (v3.89.0), keinen Fehlertext | ✅ (2026-10-21) |

## 57. Neu in 3.90: Garage, Werkstatt und Carport
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 57.1 | Bearbeiten, Werkzeug „Gerät“, links die Gruppe „Fahrzeuge“ öffnen | Kleinwagen, Limousine, Kombi, SUV, Sportwagen, Pick-up, Transporter / Kleinbus, Kastenwagen (Camper), Wohnmobil, Alkoven-Wohnmobil, Wohnwagen, PKW-Anhänger, Motorrad, Motorroller, Fahrrad, E-Bike, Lastenrad, Aufsitzmäher, Mähroboter mit Ladestation, jedes mit Vorschaubild | ✅ (2026-10-21) |
| 57.2 | Die Gruppen „Werkstatt“ und „Garage & Carport“ öffnen | Werkstatt: Werkbank (auch mit Lochwand und Licht), Lochwand, Werkstattwagen, Werkzeugschrank, Schwerlastregal, Sichtlagerkästen, Hebebühne, Wagenheber, Kompressor, Standbohrmaschine, Tischkreissäge, Schleifbock, Schweißgerät, Werkstattsauger, Reifenregal, Reifensatz, Stehleiter, zwei Werkstattleuchten, Feuerlöscher, Ölfass, Rollbrett. Garage & Carport: Carport, Doppelcarport, Solarcarport, Mülltonnen, Mülltonnenbox, Fahrradständer, Fahrrad an der Wand, Deckenregal, Metallschrank, Schubkarre, Rasenmäher, Gartengeräte, Hochdruckreiniger, Radstopper | ✅ (2026-10-21) |
| 57.3 | Im Suchfeld „wohnmobil“, „hebebühne“, „mülltonne“, „kombi“ eingeben | Es werden die passenden Teile gefunden | ✅ (2026-10-21) |
| 57.4 | Ein Auto und das Wohnmobil in die Garage stellen, von allen Seiten ansehen, im 2D-Plan die Größe ansehen | Sie sind so groß wie in echt (Kombi etwa 4,8 m lang, Wohnmobil 7 m lang und fast 3 m hoch); man sieht Fenster, Räder, Lichter, Spiegel | ✅ (2026-10-21) |
| 57.5 | Ein Auto anklicken, rechts bei „Ausführung“ eine andere Farbe wählen, Strg+Z; dann eine wählen und die Seite neu laden | Die Farbe wechselt (glänzend wie Autolack); Strg+Z holt die vorige zurück; nach dem Neuladen ist die gewählte noch da | ✅ (2026-10-21) |
| 57.6 | Das Auto mit einem Schalter verknüpfen, „Live“, ein- und ausschalten | Eingeschaltet leuchten vorne die Scheinwerfer weiß und hinten die Rücklichter rot; ausgeschaltet sind sie dunkel | ✅ (2026-10-21) |
| 57.7 | Die „LED-Werkstattleuchte“ und die „Werkbank mit Lochwand und Licht“ setzen, mit Lichtern verknüpfen, in „Live“ schalten; die Lochwand, die Sichtlagerkästen und den Feuerlöscher nahe an eine Wand setzen | Die Leuchten und das Licht unter dem Brett der Werkbank leuchten und erhellen den Raum; die Wandteile springen an die Wand | ✅ (2026-10-21) |
| 57.8 | Im Add-on das Musterhaus („alles drin“) neu importieren, Erdgeschoss öffnen | In der Garage stehen der blaue Kombi, die Werkbank, ein Regal, ein Fahrrad an der Wand; vorne rechts auf dem Grundstück ein Hof mit Carport, Doppelcarport, Solarcarport, Autos, Wohnmobilen, Wohnwagen, Anhänger und einer Limousine auf der Hebebühne | ➖ |

## 58. Neu in 3.91: Messen, Abstand und Winkel zweier Wände
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 58.1 | Bearbeiten, in der 3D-Ansicht die Taste M drücken | Das Werkzeug „Messen“ ist an, es öffnet sich 2D + 3D, rechts steht der Abschnitt „Messen“ mit „Klicke den ersten Punkt“ | ✅ (2026-10-20) |
| 58.2 | Im 2D-Plan zwei Punkte anklicken (eine Ecke, dann irgendwo); mit Alt gedrückt zwei freie Punkte | Gelbe Linie mit Länge im Plan und im 3D-Bild; rechts die Länge groß, darunter ↔, ↕ und der Winkel; Ecken und Wandflächen rasten ein, mit Alt nicht | ✅ (2026-10-20) |
| 58.3 | Im 3D-Bild von 2D + 3D zwei Punkte auf dem Boden anklicken | Auch so wird gemessen, die Linie erscheint in beiden Bildern | ✅ (2026-10-20) |
| 58.4 | Zwei gegenüberliegende Wände eines Raums nacheinander anklicken (auf die Wand, nicht auf die Ecke) | Die erste Wand ist blau gestrichelt, die zweite orange; rechts „Innenmaß (Wand bis Wand)“ (bis 4.2.0 „Lichter Abstand“) und „Abstand der Wandmitten“, im Plan ein grüner Abstand im rechten Winkel | ✅ (2026-10-20) |
| 58.5 | Beim „Innenmaß (Wand bis Wand)“ (bis 4.2.0 „Lichter Abstand“) 4 eintippen, „Setzen“ (oder Enter) | Die orange Wand rückt so, dass zwischen den Wandflächen genau 4,00 m sind; die Wände daneben werden länger / kürzer, der Raum und seine Fläche passen sich an; Türen und Fenster in der verschobenen Wand bleiben drin | ✅ (2026-10-21; Wunsch: „Lichter Abstand“ umbenennen, jetzt „Innenmaß (Wand bis Wand)“, 77.4) |
| 58.6 | „⇄ Die andere Wand bewegen“, einen Wert setzen; dann Strg+Z | Jetzt bewegt sich die andere Wand; Strg+Z holt den Stand davor zurück | ✅ (2026-10-21) |
| 58.7 | Zwei Wände in einer Ecke anklicken, beim „Winkel“ 120 setzen, dann 90 | Im Plan steht der Winkel in der Ecke; die zweite Wand dreht sich um die Ecke, bleibt gleich lang, die Wand an ihrem anderen Ende zieht mit; mit 90 ist es wieder rechtwinklig | ✅ (2026-10-21) |
| 58.8 | Eine gesperrte Wand (in der Objektliste abgehakt) als zweite Wand nehmen und einen Abstand setzen; Esc; ein anderes Werkzeug wählen | Die gesperrte Wand bewegt sich nicht, oben steht ein Hinweis; Esc löscht die Messung; mit einem anderen Werkzeug verschwindet der Abschnitt „Messen“ | ✅ (2026-10-21) |

## 59. Neu in 3.92: Bar mit Deckenteil
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 59.1 | Bearbeiten, eine „Bartheke über Eck mit LED“ setzen und anklicken | Rechts steht „An der Decke“ mit „Nichts“; darunter ein kurzer Hinweis; bei „LEDs einzeln verknüpfen“ stehen Thekenkante und Sockel | ✅ (2026-10-20) |
| 59.2 | Bei „An der Decke“ „Gläserregal mit hängenden Gläsern“ wählen, die Bar von allen Seiten ansehen | Über der Theke hängt in L-Form ein Brett mit Stahlrahmen an Stangen von der Decke, darunter zwei Reihen Weingläser kopfüber und ein LED-Streifen; es folgt der Theke genau | ✅ (2026-10-20) |
| 59.3 | „Deckensegel mit LED“, dann „Pendelleuchten“ wählen | Ein schwebendes Brett in der Farbe der Bar mit Licht oben und Spots unten; dann eine schwarze Schiene an der Decke mit 5 Pendelleuchten (bei der geraden Bar 3) | ✅ (2026-10-20) |
| 59.4 | Dasselbe mit der geraden „Bartheke mit LED“ | Regal, Segel und Leuchten sind gerade und so lang wie die Theke | ✅ (2026-10-20) |
| 59.5 | Im 2D-Plan die Bar ansehen, bei den Maßen rechts auf „Höhe“ schauen, an eine Wand schieben | Im Plan ist sie so groß wie vorher; „Höhe“ zeigt die Theke (etwa 1,2 m), nicht die Decke; sie stoppt an der Wand wie vorher | ✅ (2026-10-20) |
| 59.6 | Bei „LEDs einzeln verknüpfen“ beim „Deckenteil“ ein Licht wählen, ein- und ausschalten | Das Licht des Deckenteils folgt seinem eigenen Licht, die Theke dem Licht der Bar; ohne eigenes Licht leuchtet es mit der Bar | ✅ (2026-10-20) |
| 59.7 | „Live“, die Bar antippen; danach wieder „An der Decke: Nichts“ wählen | Die Karte hat einen Knopf „Deckenteil“; mit „Nichts“ ist das Deckenteil weg, sein Licht auch, Thekenkante und Sockel bleiben | ✅ (2026-10-20) |
| 59.8 | Im Add-on das Musterhaus („alles drin“) neu importieren | Über der Bar im Keller hängt ein Gläserregal | ➖ |

## 60. Neu in 3.93: Wiederholen, Kopieren und Einfügen, Schutz beim Speichern, Geländer der Wendeltreppe
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 60.1 | Bearbeiten, oben rechts neben „Speichern“ schauen | Zwei Knöpfe ↶ und ↷, beide grau (es gibt noch nichts rückgängig zu machen) | ✅ (2026-10-20) |
| 60.2 | Eine Lampe anklicken, mit einer Pfeiltaste verschieben, Strg+Z, dann Strg+Y (oder Strg+Umschalt+Z) (#404) | Strg+Z holt sie zurück, Strg+Y schiebt sie wieder hin; ↶ und ↷ werden je nachdem drückbar oder grau | ✅ (2026-10-20) |
| 60.3 | Strg+Z, dann etwas anderes ändern, dann Strg+Y | Nach einer neuen Änderung gibt es nichts mehr zu wiederholen (↷ grau) | ✅ (2026-10-20) |
| 60.4 | Eine Lampe anklicken, Strg+C, dann zweimal Strg+V (#405) | Oben steht „Kopiert: 1“; jede Kopie steht ein Stück weiter rechts unten und ist gleich ausgewählt; sie hat dasselbe Licht verknüpft | ✅ (2026-10-20) |
| 60.5 | Eine Kopie anklicken, Strg+D, dann Strg+Z | Strg+D verdoppelt sie direkt daneben; ein Strg+Z nimmt die Kopie wieder weg | ✅ (2026-10-20) |
| 60.6 | Nach Strg+C auf eine andere Etage wechseln, Strg+V | Dieselbe Lampe steht dort an derselben Stelle | ✅ (2026-10-20) |
| 60.7 | Im 2D-Plan mit Strg + Rahmen einen Raum mit Wänden, Fenstern und Möbeln auswählen, Strg+D | Alles zusammen wird verdoppelt (Wände mit ihren Fenstern, Raum, Möbel), ein Stück versetzt, und ist ausgewählt; es lässt sich gleich zusammen verschieben | ✅ (2026-10-20) |
| 60.8 | Ein Fenster anklicken, Strg+D, nochmal Strg+D | Ein zweites (drittes) gleiches Fenster in derselben Wand daneben; ist die Wand voll, steht oben „kein Platz in der Wand“ | ✅ (2026-10-20) |
| 60.9 | Eine Wendeltreppe mit „Etagen“ 2 setzen, „Ganzes Haus“, von der Seite ansehen (#318) | Auf der Etage dazwischen endet das Geländer am Podest und fängt nach dem Podest neu an; der Ausstieg auf die Etage ist frei | ✅ (2026-10-17) |
| 60.10 | Im Add-on den Plan in zwei Fenstern im Bearbeiten öffnen; im ersten eine Lampe verschieben, kurz warten (#403) | Das erste Fenster speichert normal („Gespeichert ✓“) | ➖ |
| 60.11 | Im zweiten Fenster etwas anderes verschieben, kurz warten | Es kommt die Frage „Plan wurde woanders geändert“ mit zwei Knöpfen; Esc schließt sie nicht. „Die andere Version laden“: das zweite Fenster zeigt jetzt die Lampe vom ersten Fenster, die eigene Änderung ist weg | ➖ |
| 60.12 | Noch einmal: im ersten Fenster ändern, dann im zweiten, diesmal „Meine Version behalten“ | Das zweite Fenster speichert über das erste; nach dem Neuladen des ersten Fensters ist dort der Stand vom zweiten | ➖ |

## 61. Neu in 3.94: mehrere Gebäude in einem Plan (#409)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 61.1 | Bearbeiten, rechts „🏘 Gebäude in diesem Plan“ aufklappen | Ein Hinweis, der Knopf „+ Gebäude“ und unten „Anderes Haus hereinholen“ | ✅ (2026-10-20) |
| 61.2 | Zweimal „+ Gebäude“, die Namen auf „Haupthaus“ und „Gartenhaus“ ändern | Beide stehen in der Liste, oben erscheint die Auswahl „🏘 Alle Gebäude“ | ✅ (2026-10-20) |
| 61.3 | Bei den Räumen des Erdgeschosses jeweils das Gebäude wählen | Die Räume der oberen Etagen zeigen „automatisch (…)“ mit dem Gebäude des Raums darunter | ✅ (2026-10-20) |
| 61.4 | Ein Gebäude mit × löschen, dann Strg+Z | Die Räume bleiben, gehören zu keinem Gebäude mehr; Strg+Z holt das Gebäude zurück | ✅ (2026-10-20) |
| 61.5 | Oben „Gartenhaus“ wählen, dann einen neuen Raum im Gartenhaus zeichnen | Der neue Raum gehört zum Gartenhaus (in der Liste rechts) | ✅ (2026-10-20) |
| 61.6 | Oben „Gartenhaus“ wählen, in 3D und 2D ansehen | Nur das Gartenhaus mit seinen Räumen, Wänden und Geräten; Gartenmöbel (in keinem Raum) bleiben; das Bild zeigt das Gartenhaus formatfüllend | ✅ (2026-10-20) |
| 61.7 | Links die Etagen ansehen | Etagen ohne etwas vom Gartenhaus (z. B. das Obergeschoss) fehlen | ✅ (2026-10-20) |
| 61.8 | „Ganzes Haus“ und „Live“ mit „Gartenhaus“ | Auch dort nur das Gartenhaus; Warnungen (Rauch, Wasser) kommen weiter für den ganzen Plan | ✅ (2026-10-20) |
| 61.9 | Oben „🏘 Alle Gebäude“, rechts bei den Dächern „🏠 Jedes Gebäude bekommt sein eigenes Dach“ | Jedes Gebäude hat ein eigenes Dach in derselben Form (vorher eins über allen, mit Hinweis) | ✅ (2026-10-20) |
| 61.10 | „Benutzer“ → bei einem Benutzer ⚙ → „Gebäude“: Gartenhaus wählen, unter „🔒 Gesperrt“ „Gebäude wechseln“ abhaken, als dieser Benutzer öffnen | Er sieht nur das Gartenhaus, die Auswahl oben fehlt | ➖ |
| 61.11 | Dasselbe ohne den Haken „Gebäude wechseln“ | Er startet im Gartenhaus, kann aber oben umschalten | ➖ |
| 61.12 | Unten „Anderes Haus hereinholen“: ein Haus der Liste wählen, „⤵ Hereinholen“ | Es wird ein Gebäude dieses Plans: steht es als Nachbarhaus daneben, genau dort, sonst 3 m rechts daneben; seine Etagen liegen auf den Etagen gleicher Höhe | ✅ (2026-10-20) |
| 61.13 | Danach Strg+Z | Alles Hereingeholte ist wieder weg; das andere Haus steht weiter in der Häuser-Liste | ✅ (2026-10-20) |

## 62. Neu in 3.95: Energie leichter einrichten (#407)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 62.1 | Bearbeiten, „Strom-Editor“, daneben „⚡ Rechnung“ | Ganz oben steht „🧭 Einrichten“ mit dem Knopf „⤵ Aus dem Energie-Dashboard übernehmen“ und darunter die Checkliste (✅ eingerichtet, ○ fehlt noch, ⚠ bitte prüfen, ℹ zur Info) | ✅ (2026-10-20) |
| 62.2 | In der Demo: „⤵ Aus dem Energie-Dashboard übernehmen“ | Die Liste zeigt Netz (Netzbezug), Solar (PV Wechselrichter), Batterie mit „Vorzeichen umgedreht“, Ladestand und drei Zähler | ✅ (2026-10-20) |
| 62.3 | „✓ Übernehmen“ | Die Zeile darunter sagt „Übernommen: Netz, Solar, Batterie“; unten in den Feldern stehen diese Sensoren, die Rechnung geht auf; Strg+Z nimmt es zurück | ✅ (2026-10-20) |
| 62.4 | In der Checkliste bei „Zähler“ auf „+ Wasserzähler in den Plan setzen“ | Der Wasserzähler Garten steht in der Mitte der Etage und ist mit seinem Sensor verknüpft; die Zeile wird ✅ | ✅ (2026-10-20) |
| 62.5 | Im Add-on mit eingerichtetem Energie-Dashboard: „⤵ Aus dem Energie-Dashboard übernehmen“, dann „✓ Übernehmen“ | Netz, Solar und Batterie wie im Energie-Dashboard von Home Assistant; die Rechnung oben stimmt (Batterie „lädt“ / „entlädt“ richtig herum) | ➖ |
| 62.6 | Im Add-on, wenn im Energie-Dashboard nur Zähler in kWh stehen (keine Watt-Sensoren) | Der Vorschlag nimmt den Watt-Sensor am selben Gerät und schreibt „geraten (Sensor am selben Gerät), bitte unten prüfen“ dazu | ➖ |
| 62.7 | Im Add-on ohne eingerichtetes Energie-Dashboard | Die Zeile sagt, dass das Energie-Dashboard noch nicht eingerichtet ist; nichts wird geändert | ➖ |

## 63. Neu in 3.96: mehr Geräte direkt im Plan steuern (#406)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 63.1 | In der Demo „Live“, den **Lautsprecher** im Wohnzimmer (vorne rechts) antippen | Die Karte zeigt „♪ Sommerregen – Die Demo-Band“, die Knöpfe ⏮ ⏸ ⏭, „Aus“, den Lautstärke-Schieber (35 %), 🔈 und „Quelle“ | ✅ (2026-10-25, Claude in der Demo) |
| 63.2 | ⏭ drücken, dann ⏸, den Lautstärke-Schieber ziehen, die Quelle auf „Radio“ stellen | Der Titel wechselt, ⏸ wird zu ▶, Lautstärke und Quelle bleiben so stehen | ✅ (2026-10-25, Claude in der Demo; die Zahl neben dem Schieber blieb stehen: #524, 101.6) |
| 63.3 | Den **Fernseher** antippen | Auch er hat jetzt ⏮ ⏸ ⏭, Lautstärke und die Quellen (HDMI 1, HDMI 2, Netflix, YouTube) | ✅ (2026-10-25, Claude in der Demo) |
| 63.4 | Den **Saugroboter** in der Küche antippen, „Saugen“ | Oben steht „🔌 An der Station“, nach „Saugen“ „🧹 Saugt“ und die Knöpfe „Pause“ und „Zur Station“; die Saugstufe lässt sich wählen | ✅ (2026-10-28, Claude in der Demo: „An der Station“, nach „Saugen“ „🧹 Saugt“ mit Pause, Zur Station und Saugstufe; repariert in #473, geprüft als 77.1. Damals ❌ 2026-10-21: „es gibt dort keinen Saugroboter“) |
| 63.5 | Den **Standventilator** im Wohnzimmer antippen | An / Aus / Umschalten, der Schieber „Stufe“ (springt auf 33, 67 oder 100 %), „↔ Schwenken“ und die Modi Normal / Natur / Nacht | ✅ (2026-10-21) |
| 63.6 | Die **Alarmanlage** (Schalter rechts im Büro an der Außenwand) antippen, „Scharf (abwesend)“ | Oben steht rot „🛡 Scharf (abwesend)“, darunter ein Feld „Code“ und „Unscharf schalten“ | ✅ (2026-10-20) |
| 63.7 | Einen falschen Code eingeben und „Unscharf schalten“, dann 1234 | Mit dem falschen Code bleibt sie scharf und unten steht „Aktion fehlgeschlagen“; mit 1234 ist sie wieder „Unscharf“ | ✅ (2026-10-20) |
| 63.8 | Den **Hausmodus** antippen und „Urlaub“ wählen; die **Heizung** im Wohnzimmer antippen | Der Hausmodus steht auf „Urlaub“; die Heizungskarte hat − / +, die Modi und neu „Vorwahl“ (Eco, Komfort, Abwesend, Boost) | ✅ (2026-10-28, Claude in der Demo: Hausmodus „Urlaub“ antippbar und gesetzt; repariert in #474, geprüft als 77.2, 77.3. Damals ❌ 2026-10-21: „den Knopf Urlaub finde ich nicht“) |
| 63.9 | Im Add-on einen echten Lautsprecher / Fernseher, Saugroboter oder Ventilator mit einem Gerät im Plan verknüpfen und in „Live“ bedienen | Die Knöpfe tun, was sie sagen; Geräte, die etwas nicht können (z. B. kein „Weiter“), zeigen den Knopf nicht | ➖ |
| 63.10 | Im Add-on die echte Alarmanlage verknüpfen, scharf und mit Code unscharf schalten | Wie in Home Assistant; ein falscher Code wird abgelehnt | ➖ |
| 63.11 | „Benutzer“ → bei einem Tablet ⚙ → „🔒 Gesperrt“: „Alarmanlage bedienen“ abhaken, auf dem Tablet die Alarmanlage antippen | Die Knöpfe der Alarmanlage fehlen, alles andere lässt sich weiter schalten | ➖ |

## 64. Neu in 3.97: Alarm per WhatsApp (#414)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 64.1 | Im Add-on ⚙ öffnen, nach unten zu „🚨 Benachrichtigung bei Alarm (WhatsApp)“ | Der Teil ist da (nur für Bearbeiter), aus, alle fünf Melder angehakt | ➖ |
| 64.2 | Auf der Seite von CallMeBot (Link im Teil) den Schlüssel holen; „WhatsApp direkt“, die eigene Nummer mit +49 und den Schlüssel eintragen, „Nachricht bei Alarm senden“ anhaken, „Speichern“ | „Gespeichert. Bereit: bei Alarm kommt eine Nachricht.“ | ➖ |
| 64.3 | „Test senden“ | Nach ein paar Sekunden kommt die WhatsApp „✅ Test: die Alarm-Benachrichtigung vom 3D Floorplan funktioniert.“ | ➖ |
| 64.4 | Einen Rauchmelder mit seinem Testknopf auslösen (oder in Home Assistant den Zustand eines Wassermelders auf „an“ setzen) | Eine WhatsApp „🔥 Rauch erkannt: …“ mit Etage, Raum und Uhrzeit, auch wenn kein Bildschirm offen ist; ein zweites Auslösen gleich danach schickt keine zweite | ➖ |
| 64.5 | Statt WhatsApp „Benachrichtigungsdienst von Home Assistant“ wählen, z. B. die Companion-App (mobile_app_…), „Test senden“ | Die Nachricht kommt auf dem Handy über die App | ➖ |
| 64.6 | Auf einem Tablet, das nicht bearbeiten darf, ⚙ öffnen | Der Teil „Benachrichtigung bei Alarm“ fehlt | ➖ |

## 65. Neu in 3.98: Himmel, Wetter, Strom als Bild, Raum-Kacheln, Werkzeugleiste (#418 bis #422)
Vorlage: die Beispielbilder in `docs/ideen-3.98/`. In der Demo zeigt `?skytime=21:30` eine andere Uhrzeit und `?weather=rainy` (oder `snowy`, `cloudy`, `pouring`) ein anderes Wetter, z. B. https://burned4aim.github.io/HA-Floorplanner/?skytime=21:30&weather=snowy
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 65.1 | Demo öffnen, „Live“ | Hinter dem Haus ein Himmel passend zur Uhrzeit statt Schwarz (tagsüber blau); oben rechts z. B. „☀️ Tag · 14:05 · Sonnenuntergang …“ und darunter „⛅ Teilweise bewölkt · 14 °C · Wind 12 km/h“ | ✅ (2026-10-20) |
| 65.2 | Adresse mit `?skytime=21:30`, dann mit `?skytime=18:05` | 21:30: dunkelblau mit Sternen, der Rasen dunkler, „🌙 Nacht · … · Sonnenaufgang …“; 18:05: lila und orange am Horizont, „Abenddämmerung“ bzw. „Abend“. Die Lampen leuchten **nicht** extra (wie gewünscht) | ✅ (2026-10-20) |
| 65.3 | Adresse mit `?weather=rainy`, dann `?weather=snowy` | Grauer Himmel, Regen fällt über das Bild, oben „🌧️ Regen · …“; bei Schnee fallen Flocken. Im Bearbeiten-Modus fällt nichts | ✅ (2026-10-20) |
| 65.4 | ⚙ → „Himmel“ auf „Einfarbig“, dann zurück auf „Nach Uhrzeit und Wetter“ | Einfarbig: der Hintergrund wie früher, keine Anzeigen oben rechts; danach ist der Himmel wieder da | ✅ (2026-10-20) |
| 65.5 | Mit `?weather=rainy`: oben die rote Warnung „Fenster offen bei Regen · Fenster Wohnzimmer“. Bearbeiten, das Wohnzimmerfenster anklicken, Haken **„Bei Regen warnen“** wegnehmen | Die Warnung verschwindet; Haken wieder setzen: sie ist wieder da | ✅ (2026-10-20) |
| 65.6 | „Live“ am PC: oben rechts die Karte **„Strom jetzt“** ansehen | Sonne 3.20 kW, Netz 450 W „Bezug vom Netz“, Haus 3.05 kW, Batterie 82 % „lädt 600 W“; Punkte wandern von der Sonne zum Haus und zur Batterie und vom Netz zum Haus; die Zahlenzeile oben links ist weg | ✅ (2026-10-20) |
| 65.7 | Die Karte antippen, dann „Ansicht“ → „Strom als Bild“ | Antippen: die Strom-Kabel im Haus erscheinen (nochmal: weg). „Strom als Bild“ aus: die Zahlenzeile ist zurück | ✅ (2026-10-20) |
| 65.8 | „Live“ am PC: unten über „Normal / Temp. …“ die **Raum-Kacheln** | Eine Karte pro Raum: Name, Temperatur (z. B. Wohnzimmer 21,3°), „💡 5 an“ mit farbigem Rand, „🪟 offen“, 👤 im Büro und Wohnzimmer; Räume ohne Licht „aus“ | ✅ (2026-10-20) |
| 65.9 | Eine Kachel antippen, dann nochmal; „Ganzes Haus“ und eine Kachel aus dem Obergeschoss antippen | Die Kamera fliegt in den Raum, rechts die Raum-Karte; nochmal: zurück. Ganzes Haus: alle Räume mit Etage, der Tipp öffnet die Etage und den Raum | ✅ (2026-10-20) |
| 65.10 | Am Handy hochkant „Live“ | Die Kacheln sind kleiner und lassen sich zur Seite wischen; oben rechts keine Uhrzeit- und keine Strom-Karte (dort bleibt 📊) | ✅ (2026-10-21) |
| 65.11 | „Ansicht“ → „Raum-Kacheln“ ausschalten, wieder einschalten | Die Leiste verschwindet und kommt wieder | ✅ (2026-10-20) |
| 65.12 | Bearbeiten: die Werkzeugleiste oben ansehen | Symbole mit Namen darunter, in Gruppen „ZEICHNEN“, „SETZEN“, „WERKZEUGE“; das gewählte Werkzeug blau; jedes Werkzeug funktioniert wie vorher | ✅ (2026-10-20) |
| 65.13 | „Mehr“ (⋯) antippen, dann ✎ (Werkzeuge anpassen): ein Werkzeug ausblenden, eins verschieben, „Zurücksetzen“ | „Mehr“ zeigt „Import“; im Anpassen stehen die vollen Namen („Räume erkennen“, „Strom-Editor“); die Gruppen passen sich an, Zurücksetzen stellt alles wieder her | ✅ (2026-10-20) |
| 65.14 | Im Add-on: Live-Modus mit echtem `sun.sun` und echter Wetter-Entität | Der Himmel passt zur echten Tageszeit, die Anzeige nennt den echten Sonnenuntergang bzw. -aufgang und das echte Wetter | ➖ |
| 65.15 | Im Add-on: ein echtes Fenster, das bei Regen offen bleiben darf, „Bei Regen warnen“ abhaken | Bei Regen keine Warnung für dieses Fenster, die anderen warnen weiter | ➖ |
| 65.16 | Neu in 3.98.1: „Bearbeiten“ am PC | Oben rechts steht auch hier die Karte „Strom jetzt“, die kleine Zahlenzeile ist weg; ein Tipp auf die Karte zeigt die Kabel | ✅ (2026-10-20) |
| 65.17 | Neu in 3.98.2: die Karte „Strom jetzt“ ansehen, wenn die Batterie weder lädt noch entlädt (im Add-on z. B. nachts bei fast leerer Batterie) | Unter der Batterie steht „ruht · 0 W“ statt nur „Batterie“; meldet die Batterie keine Leistung (kein Leistungs-Sensor eingerichtet), steht dort „kein Leistungs-Sensor“. Lädt sie, steht weiter „lädt … W“ | ➖ |

## 66. Neu in 3.99: echte Böden, dunkle Fensterrahmen, Glas-Optik, Raum-Schilder (#427 bis #430)
Vorlage: die Beispielbilder in `docs/ideen-3.99/` (1, 2, 4 und 5). Die Demo hat die Böden und die anthrazitfarbenen Fensterrahmen schon eingestellt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 66.1 | Demo öffnen, „Live“, Erdgeschoss, nah heranzoomen | Wohnzimmer Parkett (Eiche), Küche helle Fliesen, Bad kleine Fliesen, Schlafzimmer helles Parkett, Büro dunkles Parkett, Garage Beton; die Muster wirken nicht verzerrt | ✅ (2026-10-20) |
| 66.2 | Unten „Temp.“, dann „Normal“ | Bei „Temp.“ färben sich die Böden nach der Temperatur (ohne Muster), bei „Normal“ sind die Muster wieder da | ✅ (2026-10-20) |
| 66.3 | „Bearbeiten“, einen Raum anklicken, rechts „Boden“: z. B. „Fliesen anthrazit (60 cm)“, dann „Einfarbig“ | Der Boden wechselt sofort; bei einem Muster verschwindet das Farbfeld, bei „Einfarbig“ ist es wieder da | ✅ (2026-10-20) |
| 66.4 | „2D“ ansehen | Die Räume haben die Farbe ihres Bodens (Parkett braun, Fliesen hell, Beton grau); auch die kleinen Etagen-Bilder links | ✅ (2026-10-20) |
| 66.5 | Fenster von außen ansehen | Die Fensterrahmen sind anthrazit, die Wände heller; Türrahmen bleiben weiß. ⚙ → „Fensterrahmen“ → „Weiß“ stellt den alten Look her | ✅ (2026-10-20) |
| 66.6 | Die Knöpfe unten (Normal, Temp. …), oben (Zimmer, Geräte …) und die Etagen-Karten links ansehen | Leicht durchsichtig wie Milchglas, das Bild scheint verschwommen durch; im hellen Design helles Glas | ✅ (2026-10-20) |
| 66.7 | „Live“: über den Räumen | Über jedem Raum ein Schild: Name, Temperatur, „💡 5“ wenn Lichter an sind (Rand in Lichtfarbe), 🪟 bei offenem Fenster, grüner Punkt wenn jemand da ist; die Kugeln und Werte der Geräte und die Namen auf dem Boden sind weg (entweder Schilder oder Geräte); die Schilder wandern beim Drehen mit | ✅ (2026-10-20) |
| 66.8 | „Ansicht“ → „Im Bild: Raum-Schilder“ antippen, dann noch einmal | Es steht „Im Bild: Geräte“: keine Schilder, die Kugeln und Werte der Geräte und die Namen auf dem Boden sind wieder da; noch ein Tipp: wieder die Schilder | ✅ (2026-10-20) |
| 66.9 | Ein Schild (z. B. „Wohnzimmer“) antippen, dann unten die Kachel des Raums | Der Raum öffnet sich mit seinen Geräten (Kugeln und Werte), keine Schilder; nach dem Kachel-Tipp wieder die Schilder. Bei „Ganzes Haus“ und im Bearbeiten-Modus keine Schilder, dort die Geräte wie bisher | ✅ (2026-10-20) |
| 66.10 | Neu in 3.99.6 (#444): am Handy „Live“, „Ansicht“ → „Im Bild: Raum-Schilder“ (bis 3.99.5 gab es am Handy keine Schilder) | Über den Räumen kleine Schilder (Name, Temperatur, Lichter …), Räume ohne Platz zeigen einen Punkt; ein Tipp auf ein Schild öffnet den Raum unten. „Im Bild: Geräte“ zeigt wieder die Kugeln und die Namen auf dem Boden | ✅ (2026-10-20) |
| 66.11 | Im Add-on: eigenen Räumen einen Boden geben, Fensterrahmen auf „Anthrazit“ | Bleibt nach dem Neuladen so; ein Tablet im Sparmodus „Schnell“ zeigt die Böden einfarbig in ihrer Farbe | ➖ |
| 66.12 | Neu in 3.99.1: „Live“, das Bild flach von der Seite drehen (Räume hintereinander) | Die Raum-Schilder liegen nicht übereinander: das hintere rückt nach oben, ein Strich führt zu seinem Raum | ✅ (2026-10-20) |
| 66.13 | Neu in 3.99.1: oben links und in der Karte „Strom jetzt“ nachsehen | Oben links keine Zeile mit Wasser, Gas und Wärme mehr; die Zähler stehen unten in der Karte „Strom jetzt“ (🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh). Am Handy bleibt die Zeile | ✅ (2026-10-20) |
| 66.14 | Neu in 3.99.2: „Live“, links „Ganzes Haus“ (oder das Fenster schmaler machen) | Passen die Raum-Kacheln unten nicht alle hin, ist rechts ein Pfeil ›, der Rand wird weich ausgeblendet; der Pfeil (oder das Mausrad über den Kacheln) schiebt weiter, dann ist links ein Pfeil ‹. Nichts ist einfach abgeschnitten | ✅ (2026-10-20) |
| 66.15 | Neu in 3.99.2: „Ganzes Haus“ mit der Karte „Strom jetzt“ oben rechts | Die Etagen-Karten (Obergeschoss, Erdgeschoss …) liegen nicht unter der Karte „Strom jetzt“, sondern daneben bzw. auf der anderen Seite des Hauses | ✅ (2026-10-20) |
| 66.16 | Neu in 3.99.3 (#434): „Live“ auf dem Tablet oder PC, unten „Strom“ **nicht** gedrückt | Oben rechts keine Karte „Strom jetzt“ und auch keine Zahlenzeile oben links | ✅ (2026-10-20) |
| 66.17 | Unten „Strom“ drücken, dann auf die Karte „Strom jetzt“ tippen | Mit „Strom“ erscheint die Karte (und die Kabel im Haus); ein Tipp auf die Karte schaltet „Strom“ wieder aus, die Karte verschwindet | ✅ (2026-10-20) |
| 66.18 | Neu in 3.99.4 (#436): auf dem Tablet „Live“, unten eine Raum-Kachel antippen | Die Kachel des Raums bleibt lesbar: Name, Temperatur und Licht stehen hell auf blau getöntem Grund (vorher war sie leer) | ✅ (2026-10-20) |
| 66.19 | Nachts „Live“ ansehen (in der Demo `?skytime=23:30` an die Adresse hängen) | Viel mehr Sterne, verschieden hell, ein paar leuchten sanft, eine schwache Milchstraße; bei „bewölkt“ scheinen noch einige Sterne durch, die Wolken liegen davor | ✅ (2026-10-20) |
| 66.20 | „Live“ mit vielen Räumen, das Bild flach von der Seite ansehen (wie auf dem Foto mit den langen Strichen) | Keine Türme aus Schildern mit langen Strichen: höchstens zwei Reihen; Räume ohne Platz zeigen einen kleinen Punkt, ein Tipp darauf öffnet den Raum; beim Heranzoomen werden aus den Punkten wieder Schilder | ✅ (2026-10-20) |
| 66.21 | Neu in 3.99.5 (#438): am iPhone (auch in der Home-Assistant-App) „Live“, die Raum-Kacheln unten nach links und rechts wischen | Die Leiste folgt dem Finger, ein schneller Wisch gleitet nach; alle Räume sind erreichbar. Ein Wisch öffnet keinen Raum, ein Tipp auf eine Kachel öffnet ihn | ✅ (repariert in #441, von dir geprüft als 66.23 ✅ 2026-10-20. Damals ❌ 2026-10-18: ruckelt und bleibt hängen) |
| 66.22 | Neu in 3.99.5 (#440): am iPhone „Live“, einen Raum antippen (Kachel unten oder im Bild) | Unten öffnet sich die Raum-Karte, der Raum selbst steht darüber gut sichtbar (nicht dahinter) | ✅ (2026-10-18) |
| 66.23 | Neu in 3.99.6 (#441): am Handy (iPhone, auch in der Home-Assistant-App) „Live“, die Raum-Kacheln unten langsam, schnell und etwas schräg nach links und rechts wischen | Die Leiste läuft flüssig mit dem Finger und bleibt nicht hängen, nach einem schnellen Wisch gleitet sie weich aus; alle Räume sind erreichbar. Ein Wisch öffnet keinen Raum, ein Tipp auf eine Kachel öffnet ihn | ✅ (2026-10-20) |
| 66.24 | Neu in 3.99.6 (#442): am Handy „Live“, unten „Strom“ drücken, dann auf die Karte „Strom jetzt“ tippen | Oben in der Mitte erscheint die Karte „Strom jetzt“ klein (Sonne, Netz, Haus, Batterie, darunter Wasser, Gas, Wärme), ganz zu sehen; das Haus und die Raum-Kacheln bleiben frei; ein Tipp auf die Karte schaltet „Strom“ aus, die Karte verschwindet | ✅ (2026-10-20) |
| 66.25 | Neu in 3.99.6 (#445): am Handy „Live“, ganz unten nachsehen | Ganz unten unter den Knöpfen eine kurze Zeile mit der Uhrzeit und dem Wetter, z. B. „☀️ 12:24 · ⛅ Teilweise bewölkt · 14 °C“; nichts überdeckt sich (Knöpfe, Kompass, Raum-Kacheln). Am PC und Tablet bleiben die beiden Zeilen oben rechts | ✅ (2026-10-20) |

## 67. Neu in 4.0: Wände mit Oberfläche, viel mehr Böden, Muster anpassen, Fassade (#448)
Die Demo hat schon Beispiele eingestellt: Wohnzimmer Fischgrät und Raufaser, Küche Großformat-Fliesen, Metro-Fliesen bis 1,40 m und salbeigrüne Farbe, Bad Sechseck-Fliesen und blaue Fliesen bis 1,20 m, Schlafzimmer Teppich und Blätter-Tapete, Büro Rauputz; oben Punkte- und Streifen-Tapete, Chevron, Terrassendielen; im Dachgeschoss weißer Backstein; außen Rauputz. Zum Hineinschauen nah an eine Wand zoomen und das Bild drehen (die Wände zur Kamera hin senken sich).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 67.1 | Demo öffnen, Erdgeschoss, nah an die Wände im Bad, in der Küche und im Wohnzimmer zoomen | Bad: blaue Fliesen bis etwa Hüfthöhe, darüber weiß; Küche: weiße Metro-Fliesen, darüber salbeigrün; Wohnzimmer: feine Raufaser, Boden Fischgrät. Türen und Fenster bleiben frei, die Muster wirken nicht verzerrt | ✅ (2026-10-20) |
| 67.2 | Obergeschoss und Dachgeschoss ansehen | Kinderzimmer Punkte-Tapete, Gästezimmer Streifen-Tapete und Chevron-Boden, Dachterrasse Holzdielen, Studio weißer Backstein und breite Dielen | ✅ (2026-10-20) |
| 67.3 | Von außen ums Haus drehen | Die Außenwände haben Rauputz; ⚙ → „Fassade“ → z. B. „Klinker rot“ macht alle Außenwände zu Klinker, „Glatt (wie bisher)“ stellt es zurück; „Farbe der Fassade“ färbt sie um | ✅ (2026-10-20) |
| 67.4 | „Bearbeiten“, einen Raum anklicken, rechts „Boden“ aufklappen | Die Muster stehen unter „Holz“, „Fliesen“, „Stein“, „Sonstiges“, gut 25 Stück; ein anderes wählen: der Boden wechselt sofort | ✅ (2026-10-20) |
| 67.5 | Unter dem Boden auf einen Farbkreis tippen, dann „Farbe“ und „Fugen“ selbst wählen | Der Boden nimmt die Farbe an (z. B. Nussbaum), die Fugen ihre Farbe; „↺ Wie vorgegeben“ stellt alles zurück | ✅ (2026-10-20) |
| 67.6 | „Größe“ ändern (z. B. Fliesen 60 statt 30 cm), „Drehung“ 45° antippen | Die Fliesen werden größer bzw. liegen schräg (diagonal); 90° dreht die Dielen quer zum Raum; jede andere Zahl geht auch | ✅ (2026-10-20) |
| 67.7 | Beim Raum unter „Wände“ z. B. „Raufaser“, „Rauputz“, „Tapete Ornament“, „Metro-Fliesen“, „Klinker rot“ wählen | Die Wände des Raums ändern sich sofort, nur auf der Seite dieses Raums; die Nachbarräume bleiben, wie sie sind; Farbe, Größe und Drehung gehen wie beim Boden | ✅ (2026-10-20) |
| 67.8 | Haken „Unten anders (z. B. Fliesen)“, darunter Muster und „Bis Höhe“ (z. B. 1,50 m) | Unten Fliesen bis zur Höhe, darüber die Wand von oben; unter einem Fenster auch Fliesen | ✅ (2026-10-20) |
| 67.9 | „Wände für alle Räume der Etage übernehmen“ | Alle Räume der Etage bekommen dieselben Wände (unten steht, wie viele); Strg+Z macht es rückgängig | ✅ (2026-10-20) |
| 67.10 | Eine einzelne Wand anklicken, rechts „Oberfläche dieser Wand“: auf einer Seite eine Tapete wählen | Nur diese Seite dieser Wand hat die Tapete, über die ganze Höhe (Akzentwand); die Seiten stehen mit dem Namen des Raums („Zu Wohnzimmer“) oder „Außen“; „Wie der Raum“ nimmt es zurück | ✅ (2026-10-20) |
| 67.11 | Unten „Temp.“, dann „Normal“; das Design „Hologramm“ | Bei „Temp.“ färben sich die Böden wie bisher (die Wände behalten ihr Muster); im Hologramm keine Muster, alles wie bisher | ✅ (2026-10-20) |
| 67.12 | „2D“ ansehen | Die Räume haben die Farbe ihres Bodens, auch mit eigener Farbe (z. B. Nussbaum dunkel) | ✅ (repariert in #467, von dir geprüft als 75.1, 75.2 ✅ 2026-10-20. Damals ❌: mit „Temp.“ waren die Räume schwarz) |
| 67.13 | Im Add-on: eigenen Räumen Böden und Wände geben, neu laden; ein Tablet im Sparmodus „Schnell“ | Bleibt nach dem Neuladen so; im Sparmodus sind Böden und Wände einfarbig in ihrer Farbe (ohne Muster), das Bild bleibt flüssig | ➖ |
| 67.14 | Im Add-on: Export (Haus als JSON) und wieder Import | Böden, Farben, Größen, Drehungen, Wände, „Unten anders“ und Akzentwände kommen wieder mit | ➖ |

## 68. Neu in 4.0.1: Einstellungen in Gruppen, Suche, was die Alarmanlage ist (#450)
⚙ oben rechts öffnet die Einstellungen. Statt einer langen Liste stehen dort zehn Gruppen, die man auf- und zuklappt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 68.1 | Demo öffnen, ⚙ antippen | Zehn Gruppen, alle zugeklappt: Allgemein, Zeichnen & Bearbeiten, 3D-Bild & Leistung, Was im Bild erscheint, Etagen, Haus außen & Umgebung, Licht & Hintergrund, Warnungen & Alarm, Wandtablet, Farben. Unter jedem Namen steht klein, was drin ist | ✅ (2026-10-20) |
| 68.2 | Eine Gruppe antippen, dann noch einmal | Sie klappt auf (der Pfeil rechts dreht sich) und wieder zu; die Einstellungen darin wirken wie bisher | ✅ (2026-10-20) |
| 68.3 | Eine Gruppe offen lassen, das Fenster schließen und wieder öffnen | Dieselbe Gruppe ist wieder offen (der Browser merkt es sich) | ✅ (2026-10-20) |
| 68.4 | Oben „Alle aufklappen“, dann „Alle zuklappen“ | Alle Gruppen gehen auf, der Knopf heißt dann „Alle zuklappen“; danach sind alle wieder zu | ✅ (2026-10-20) |
| 68.5 | Oben ins Suchfeld „Alarm“ tippen | Nur noch die passenden Gruppen, aufgeklappt, die passenden Zeilen haben einen farbigen Rahmen; „Himmel“ oder „Sonne“ findet den Himmel, „Fassade“ die Fassade | ✅ (2026-10-20) |
| 68.6 | Etwas Unsinniges suchen, dann Esc drücken (am Tablet das ✕ im Suchfeld) | „Keine Einstellung passt zu diesem Wort.“; nach Esc ist die Suche leer und die Gruppen sind wie vorher, das Fenster bleibt offen | ✅ (2026-10-20) |
| 68.7 | Gruppe „Warnungen & Alarm“ öffnen | Oben steht, wie Warnungen erscheinen; im blauen Kasten „Was ist mit „Alarmanlage“ gemeint?“: die Erklärung (Türen und Fenster wählt man in der Alarmanlage von Home Assistant, z. B. Alarmo) und darunter „In Home Assistant gefunden: Alarmanlage (🛡 Unscharf)“; darunter „🚨 Benachrichtigung bei Alarm (WhatsApp)“ (in der Demo wird nichts gesendet: „Test senden“ sagt das) | ✅ (2026-10-20) |
| 68.8 | Gruppe „Wandtablet“, „Nachts abdunkeln“ auf „Nach Uhrzeit“, dann „Aus“ | Die Zeilen „Abdunkeln ab“ und „Abdunkeln bis“ erscheinen nur bei „Nach Uhrzeit“ | ✅ (2026-10-20) |
| 68.9 | Im Add-on: ⚙ → „Warnungen & Alarm“ | Steht die eigene Alarmanlage (z. B. Alarmo) mit ihrem Zustand da? Als Benutzer, der nicht bearbeiten darf: statt der WhatsApp-Einstellung der Satz, dass das ein Bearbeiter einstellt | ➖ |

## 69. Neu in 4.0.2: Gebäude-Filter richtig (#451)
Nach Bildern des Besitzers aus seinem Haus „Kinder“: beim Umschalten oben blieben Wandstücke stehen, ein Raum im 1. Stock nahm den großen Raum im EG darunter mit, und die Geräteliste zeigte alle Geräte.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 69.1 | „Bearbeiten“, rechts „🏘 Gebäude in diesem Plan“: zwei Gebäude anlegen, im Erdgeschoss nur die Küche dem zweiten Gebäude geben, oben das erste Gebäude wählen | Die Küche ist weg, mit ihren Wänden. Eine lange Wand, die an der Küche und an einem anderen Raum entlang läuft, steht nur noch an dem anderen Raum: kein Wandstück ragt in die leere Küche | ✅ (2026-10-20) |
| 69.2 | Einen Raum im Obergeschoss dem zweiten Gebäude geben (z. B. das Kinderzimmer), oben das erste Gebäude wählen, „Ganzes Haus“ | Nur dieser Raum fehlt; das Erdgeschoss darunter bleibt ganz stehen. Rechts steht beim Raum darunter weiter sein Gebäude oder „automatisch (Grundstück)“. Umgekehrt folgen die Räume darüber weiter dem Erdgeschoss (61.3) | ✅ (2026-10-20) |
| 69.3 | Oben „📋 Geräte“ öffnen, dann oben zwischen den Gebäuden umschalten | Die Liste zeigt nur die Geräte, Türen und Fenster des gewählten Gebäudes (und was in keinem Raum steht, z. B. im Garten); die Zahl der schwachen Batterien am Knopf auch. „🏘 Alle Gebäude“ zeigt wieder alles | ✅ (2026-10-20) |
| 69.4 | Im Add-on, Haus „Kinder“: oben „Gebäude 1“ und „Gebäude 2“ umschalten, auch mit WZFA in Gebäude 2 | „Raum 1“ im EG bleibt stehen (rechts „automatisch (Grundstück)“, bis er selbst ein Gebäude bekommt); keine Mauern ohne ihren Raum; die Geräteliste passt zum Bild | ➖ |

## 70. Neu in 4.0.3: Benutzer & Tablets in den Einstellungen, WhatsApp leichter einrichten (#454)
Der Knopf „Benutzer“ oben ist weg: alles daraus steht jetzt in ⚙ → „👥 Benutzer & Tablets“. Ältere Prüfschritte mit „Benutzer“ → … gehen genauso über diese Gruppe.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 70.1 | Demo öffnen, oben in der Leiste schauen | Kein Knopf „Benutzer“ mehr, die Leiste ist kürzer | ✅ (2026-10-20) |
| 70.2 | ⚙ → Gruppe „👥 Benutzer & Tablets“ aufklappen | Die Benutzer mit Raum, Ansicht und Start stehen da; oben in jeder Zeile der Benutzer mit ⚙ und ×, darunter Raum, Ansicht, Start; unten „Sicherung in Home Assistant“ mit „Datei erstellen / speichern“ und „Synchronisieren“ | ✅ (2026-10-20) |
| 70.3 | „+ Benutzer“, einen Benutzer wählen, Raum wählen; Fenster schließen und wieder öffnen | Der Benutzer bleibt gespeichert, mit Raum | ✅ (2026-10-20) |
| 70.4 | Bei einem Benutzer ⚙ → „🔒 Gesperrt“ einen Haken setzen | Wie bisher: der Haken bleibt, der Knopf zeigt 🔒 1 | ✅ (2026-10-20) |
| 70.5 | Am Handy ⚙ öffnen | Die Gruppe „Benutzer & Tablets“ gibt es am Handy nicht (wie vorher der Knopf) | ✅ (2026-10-20) |
| 70.6 | ⚙ → „Warnungen & Alarm“ → „Benachrichtigung bei Alarm“, „Senden über: WhatsApp direkt“ | Drei nummerierte Schritte: Nachricht „I allow callmebot to send me messages“ an CallMeBot (mit Link), Schlüssel und Nummer eintragen, Haken, Speichern, Test senden | ✅ (2026-10-20) |
| 70.7 | Im Add-on: die drei Schritte wirklich machen | Die Test-Nachricht kommt per WhatsApp aufs Handy | ✅ (2026-10-18) |

## 71. Neu in 4.1: Urlaubs-Alarm mit Sperrbildschirm, Telegram, Dienste ankreuzen (#456)
In der Demo ist der Urlaubs-Alarm schon eingerichtet: Code **1234**, Bürotür und zwei Fenster gewählt, 20 Sekunden Zeit. 25 Sekunden nach dem Scharfschalten öffnet ein gespielter Einbrecher die Bürotür. Seit 4.1.1 gilt der Sperrbildschirm nur für Wandtablets: in der Demo dafür `?wand=1` an die Adresse hängen.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 71.1 | Demo öffnen, „Live“ | Oben im Bild steht der Knopf „🛡 Alarm aus“ | ✅ (2026-10-20) |
| 71.2 | 🛡 antippen | Ein halb durchsichtiges Fenster mit Ziffernfeld: „Urlaubs-Alarm scharf schalten“, darunter „Noch offen: Fenster Wohnzimmer“; „Schließen“ geht zurück | ✅ (2026-10-20) |
| 71.3 | Einen falschen Code (z. B. 1111) und „Scharf schalten“ | „Falscher Code (noch 4 Versuche)“, nichts passiert | ✅ (2026-10-20) |
| 71.4 | 1234 und „Scharf schalten“ | Der Sperrbildschirm deckt alles ab: „Scharf in 20 Sekunden – bitte jetzt das Haus verlassen“, die Zahl zählt herunter; hinter dem Bildschirm lässt sich nichts antippen | ✅ (2026-10-20) |
| 71.5 | Warten | „Urlaubs-Alarm ist scharf“; nach etwa 25 Sekunden öffnet sich die Bürotür: der Bildschirm wird rot, „Alarm in 20 Sekunden – Code eingeben!“ | ✅ (2026-10-20) |
| 71.6 | Nichts eingeben, warten | „ALARM: Bürotür wurde geöffnet“ mit Uhrzeit, rot blinkend | ✅ (2026-10-20) |
| 71.7 | „👁 Nur ansehen“ (entfällt seit 4.1.1: wer bearbeiten darf, bekommt keinen Sperrbildschirm mehr, siehe 72) | – | ➖ |
| 71.8 | 1234 und „Ausschalten“ | Der Sperrbildschirm ist weg, der Knopf sagt wieder „🛡 Alarm aus“, die Bürotür ist wieder zu | ✅ (2026-10-20) |
| 71.9 | „Bearbeiten“, ⚙ → „Warnungen & Alarm“ → „🛡 Urlaubs-Alarm“ | Türen und Fenster mit Raum und „offen“ / „zu“, „alle“ / „keine“; offline-Haken, Sekunden, Code, „Bei Alarm einschalten“ (Lichter, Schalter …), Nachricht; „Speichern“ sagt „Bereit“ | ✅ (2026-10-20) |
| 71.10 | ⚙ → „Benachrichtigung bei Alarm“ → „Senden über: Telegram“, „An wen?“ umschalten | Bei „An Personen“ die Schritte mit @CallMeBot_txtbot und das Feld für Benutzernamen, bei „In eine Telegram-Gruppe“ die Schritte und das Feld für den Schlüssel | ✅ (2026-10-20) |
| 71.11 | „Senden über: Benachrichtigungsdienst von Home Assistant“ | Eine Liste zum Ankreuzen (in der Demo 📱 mobile_app_handy, ✈️ telegram_familie, 💬 whatsapp), mehrere gehen | ✅ (2026-10-20) |
| 71.12 | Im Add-on: Urlaubs-Alarm mit echten Türen einrichten, Telegram oder WhatsApp einrichten, scharf schalten, eine Tür öffnen und nicht ausschalten | Nach der eingestellten Zeit: Nachricht aufs Handy mit Tür und Raum, gewählte Sirene / Lichter gehen an; mit dem Code am Wandtablet aus: Sirene aus, Nachricht „Alarm beendet, ausgeschaltet von …“ | ➖ |
| 71.13 | Im Add-on: Telegram in eine Gruppe (Schlüssel von CallMeBot), „Test senden“ | Die Test-Nachricht kommt in der Gruppe an | ➖ |
| 71.14 | Im Add-on: als Wandtablet-Benutzer, während der Alarm scharf ist | Sperrbildschirm mit Ziffernfeld, ohne „Nur ansehen“; mit der Sperre „Urlaubs-Alarm“ ohne Ziffernfeld | ➖ |

## 72. Neu in 4.1.1: Streifen statt Sperrbildschirm für Bearbeiter, Dienste nach Herkunft, eigener Telegram-Bot (#460)
Wer bearbeiten darf (du als Admin), wird vom Urlaubs-Alarm nicht mehr gesperrt, sieht aber deutlich, dass er scharf ist. Wandtablets bekommen weiter den Sperrbildschirm. Die Test-Nachrichten per WhatsApp und Telegram (CallMeBot) kamen beim Besitzer an (2026-10-18).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 72.1 | Demo öffnen (ohne `?wand=1`), „Live“, 🛡, Code 1234, „Scharf schalten“ | Kein Sperrbildschirm: oben im Bild ein Streifen „🛡 Urlaubs-Alarm wird scharf in 20 s“ (orange), um den ganzen Bildschirm ein roter Rand; der Plan lässt sich weiter drehen und antippen | ✅ (2026-10-20) |
| 72.2 | Warten | Der Streifen wird rot: „🛡 Urlaubs-Alarm ist SCHARF · seit (Uhrzeit) · antippen zum Ausschalten“ | ✅ (2026-10-20) |
| 72.3 | Auf den Streifen tippen | Das Ziffernfeld kommt („Ausschalten“, „Schließen“); „Schließen“ geht zurück, der Alarm bleibt scharf | ✅ (2026-10-20) |
| 72.4 | Warten, bis der Einbrecher die Bürotür öffnet | Der Streifen blinkt: „🚨 Bürotür offen: Alarm in 20 s – antippen und Code eingeben“, danach „🚨 ALARM: Bürotür · (Uhrzeit)“; der rote Rand blinkt | ✅ (2026-10-20) |
| 72.5 | Streifen antippen, 1234, „Ausschalten“ | Streifen und Rand sind weg, der Knopf sagt wieder „🛡 Alarm aus“ | ✅ (2026-10-20) |
| 72.6 | Demo mit `?wand=1` am Ende der Adresse öffnen, scharf schalten | Wie ein Wandtablet: der halb durchsichtige Sperrbildschirm deckt alles ab, ohne Streifen | ✅ (2026-10-20) |
| 72.7 | „Bearbeiten“, ⚙ → „Warnungen & Alarm“ → „Benachrichtigung bei Alarm“ → „Senden über: Benachrichtigungsdienst von Home Assistant“ | Drei Gruppen mit farbigem Rand: „📱 Home Assistant App (Handy)“ (mobile_app_handy), „🧩 In Home Assistant eingerichtet“ (✈️ Familien-Chat · Telegram-Bot), „📄 Aus der configuration.yaml“ (telegram_familie, whatsapp); unter jedem Eintrag klein der volle Name; darunter aufklappbar „✈️ Eigenen Telegram-Bot einrichten (Anleitung)“ mit 4 Schritten und dem Knopf | ✅ (2026-10-20) |
| 72.8 | Im Add-on: die Liste ansehen | Deine Dienste stehen in der richtigen Gruppe: die Handy-App oben, in der UI eingerichtete (z. B. Telegram-Bot) in der Mitte, die aus der configuration.yaml unten | ➖ |
| 72.9 | Im Add-on: eigenen Telegram-Bot nach der Anleitung einrichten, den Chat anhaken, „Speichern“, „Test senden“ | Die Test-Nachricht kommt vom eigenen Bot in Telegram an (auch in einer Gruppe, wenn der Bot dort Mitglied ist) | ➖ |

## 73. Neu in 4.1.2: die Demo durchgesehen, Raum-Schilder aus „Bearbeiten“ (#462)
Der Besitzer meldete: „Im Bild: Raum-Schilder“ geht in der Demo nicht. Grund: Die Demo startet am PC und Tablet in „Bearbeiten“, die Schilder gibt es aber nur in „Live“. Dazu fehlte in der Demo einiges, was nur das Add-on liefern konnte.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 73.1 | Demo am PC oder Tablet öffnen (sie startet in „Bearbeiten“), unten „Ansicht“ → „Im Bild: Raum-Schilder“ antippen | Die Demo wechselt zu „Live“, über den Räumen stehen die Schilder; der Knopf sagt weiter „Im Bild: Raum-Schilder“. Noch ein Tipp (jetzt in „Live“): „Im Bild: Geräte“, die Schilder sind weg | ✅ (2026-10-20) |
| 73.2 | „Bearbeiten“, „Ansicht“ → „Raum-Kacheln“ antippen | Die Demo wechselt zu „Live“, unten sind die Raum-Kacheln | ✅ (2026-10-20) |
| 73.3 | Oben „🛡️ Sicherheit“ | Zwei Tage zur Auswahl: heute („Heute“) und gestern. Gestern antippen, ▶: morgens gehen Bad- und Küchenlicht an, Anna fährt weg (Garagentor), mittags ist das Küchenfenster offen, abends Wohnzimmer, Büro und Schlafzimmer; ✕ führt zurück zu „Live“ | ✅ (2026-10-20) |
| 73.4 | „Live“, oben „Geräte“ → „Batterie“ | Fenster, Türen, Feuchte- und Anwesenheitssensor mit ihrer Batterie; „Luftfeuchte Keller“ (8 %) und „Fenster Küche“ (12 %) sind rot. Oben steht „🪫 2 Batterie schwach“, am Knopf „Geräte · 🪫 2“ | ✅ (2026-10-20) |
| 73.5 | Oben „🗄️ Backup“ → „Backup herunterladen“, dann unten bei „Sicherheit“ ⬇ bei einem Tag | Es wird eine Datei `floorplan3d-backup-demo.json` gespeichert (bzw. `floorplan3d-timeline-….jsonl`), die Demo bleibt offen (vorher war die Seite danach leer oder es kam eine Fehlerseite) | ✅ (2026-10-20) |
| 73.6 | Rechts „Häuser“ → „Haus aus JSON importieren …“ → „Beispiel: Haus mit Grundstück“, dann „Prüfen“; danach „Dieses Haus als JSON exportieren“ | Das Beispiel steht im Feld; „Prüfen“ sagt „Der Import braucht das Add-on und ist in der Demo nicht verfügbar.“; Exportieren sagt „In der Demo nicht verfügbar (nur im Add-on).“ und die Demo bleibt offen | ✅ (2026-10-20) |
| 73.7 | Oben auf die grüne Versionsanzeige tippen → „Jetzt prüfen (auch mit GitHub)“ | „GitHub (main): gleicher Stand“ und „Alles stimmt, auch mit GitHub“ | ✅ (2026-10-20) |

## 74. Neu in 4.1.3: Ganzes Haus mit Raum-Schildern (#464)
Der Besitzer meldete: „Im Bild: Raum-Schilder“ geht im „Ganzes Haus“ nicht. Grund: Im ganzen Haus gibt es keine Schilder (über allen Räumen aller Etagen lägen sie übereinander), es kamen dort stattdessen die Geräte wie bei „Geräte“. Er hat gewählt: im ganzen Haus dann alles ausblenden, nur die Etagen-Karten an der Seite.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 74.1 | „Live“, links „Ganzes Haus“, unten „Ansicht“: „Im Bild: Raum-Schilder“ ist an | Im Bild keine Geräte-Kugeln, keine Werte-Schilder und keine Raumnamen, auch im Keller nicht; nur die Etagen-Karten neben dem Haus (Räume, Lichter an, Fenster offen); ein Tipp auf eine Karte öffnet die Etage, dort sind die Raum-Schilder wieder da | ✅ (2026-10-20) |
| 74.2 | Im „Ganzes Haus“ „Ansicht“ → „Im Bild: Raum-Schilder“ antippen (wird „Im Bild: Geräte“), dann noch einmal | Mit „Geräte“ sind die Kugeln, Werte und Raumnamen im ganzen Haus wieder da; mit „Raum-Schilder“ wieder nur die Etagen-Karten | ✅ (2026-10-20) |

## 75. Neu in 4.1.4: Raumfarben im 2D-Plan bei „Temp.“ (#467)
Der Besitzer meldete bei 67.12 (mit Bild): Die Farbe der Räume wird im 2D-Plan nicht richtig angezeigt. Grund: Bei „Temp.“, „Feuchte“ und „CO₂“ bekam der 2D-Plan die Farbe als Zahl statt als Farbe; der Browser malte jeden Raum mit Messwert dunkelgrau bis schwarz, in jedem Design.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 75.1 | „Bearbeiten“, Ansicht „2D“, Erdgeschoss, unten „Temp.“ (auch im Design „Hologramm“), dann „Feuchte“ | Die Räume mit Messwert haben die Farbe ihrer Temperatur wie in der Leiste „Temp.“ links (blau kühl, grün und gelb mittel, rot warm), keiner ist schwarz; bei „Feuchte“ ihre Feuchte-Farbe | ✅ (2026-10-20) |
| 75.2 | Unten „Normal“, weiter in „2D“ | Die Räume haben wieder die Farbe ihres Bodens (Wohnzimmer braun, Küche hell, Garage grau), auch mit eigener Farbe (z. B. Nussbaum dunkel) | ✅ (2026-10-20) |

## 76. Neu in 4.2.0: Schnellzugriff, Licht-Gruppen, Favoriten und Hilfen beim Bearbeiten (#471)
Der Besitzer hat aus einer Auswahl alle sieben Ideen gewählt und dazu gesagt: Gruppen aus mehreren Räumen, damit nicht aus Versehen alles ausgeht, wenn noch jemand in einem Raum ist, und nichts überladen. Die Demo hat drei Gruppen (Wohnen, Oben, Keller) und vier Favoriten eingestellt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 76.1 | „Live“, oben „💡 … an“ antippen | Eine kleine Liste „Lichter“: „🏠 Ganzes Haus“, „Wohnen“, „Oben“, „Keller“, jede mit „… an“ und einem Knopf „Aus“; 👤, wo gerade jemand im Raum ist | ✅ (2026-10-25, Claude in der Demo) |
| 76.2 | Bei „Wohnen“ einmal „Aus“ antippen, dann ein paar Sekunden warten | Der Knopf wird rot „Sicher? Aus“, es geht noch nichts aus; nach etwa 3 Sekunden steht wieder „Aus“ da | ✅ (2026-10-25, Claude in der Demo) |
| 76.3 | Bei „Wohnen“ zweimal kurz nacheinander „Aus“ | Nur die Lichter von Wohnzimmer und Küche gehen aus (Schlafzimmer, Büro, Keller bleiben an); die Zeile sagt „alle aus“, oben die Zahl wird kleiner | ✅ (2026-10-25, Claude in der Demo) |
| 76.4 | Bei „Ganzes Haus“ zweimal „Aus“ | Alle Lichter sind aus; schließt man die Liste, ist der Knopf „💡 … an“ oben weg (er erscheint wieder, sobald ein Licht an ist) | ✅ (2026-10-25, Claude in der Demo) |
| 76.5 | Unten ganz vorne in der Leiste der Raum-Kacheln: die Favoriten „Wohnzimmer Gemütlich“, „Wohnzimmer Aus“, „Stehlampe“, „Küche Licht“. „Wohnzimmer Gemütlich“ antippen, dann „Küche Licht“ | Die Szene macht die Wohnzimmer-Lichter an; „Küche Licht“ geht an und aus, der Knopf leuchtet, solange es an ist, und sagt „An“ / „Aus“ | ✅ (2026-10-25, Claude in der Demo) |
| 76.6 | Ein Licht im Bild antippen (z. B. Bürolicht), auf seiner Karte ☆ antippen, dann noch einmal | Aus ☆ wird ★ und unten kommt ein Knopf „Büro Licht“ dazu; noch ein Tipp: wieder ☆, der Knopf ist weg | ✅ (2026-10-25, Claude in der Demo) |
| 76.7 | ⚙ → „⭐ Schnellzugriff“ → „Favoriten“: „Bad Licht“ eintippen, „+ Hinzufügen“; dann „climate.wohnzimmer“ eintippen, „+ Hinzufügen“; bei einem Favoriten ↑ und × | „Bad Licht“ steht in der Liste und unten in der Leiste; beim Thermostat steht „Das geht nicht als Favorit …“; ↑ schiebt nach vorne, × nimmt heraus | ✅ (2026-10-25, Claude in der Demo) |
| 76.8 | ⚙ → „Schnellzugriff“ → „Licht-Gruppen“: „+ Neue Gruppe“, Name „Schlafen“, Schlafzimmer und Bad ankreuzen, schließen, oben „💡 … an“ | Die neue Gruppe „Schlafen“ steht in der Liste oben, mit ihren Lichtern; „Wohnen“ hat Wohnzimmer und Küche angehakt | ✅ (2026-10-25, Claude in der Demo) |
| 76.9 | Oben „📋 Geräte · 🪫 2“ ansehen und antippen | Der Knopf ist orange; die Liste öffnet gleich bei „🔋 Batterie“, die zwei schwachen (rot) stehen oben | ✅ (2026-10-25, Claude in der Demo) |
| 76.10 | In der Geräte-Liste „💡 An / offen“ | Nur was gerade an ist (Lichter, Fernseher, Ventilator …) und offene Türen und Fenster, nach Raum; die Zahl am Knopf stimmt | ✅ (2026-10-25, Claude in der Demo) |
| 76.11 | „Bearbeiten“: ein Möbel antippen, „Entf“ (oder 🗑 im Eigenschaften-Fenster); dann „↶ Rückgängig“ im Hinweis. Noch einmal löschen und nichts tun | Unten erscheint „Gelöscht · ↶ Rückgängig“; der Knopf holt das Möbel zurück; ohne Tipp verschwindet der Hinweis nach etwa 6 Sekunden | ✅ (2026-10-25, Claude in der Demo) |
| 76.12 | „Bearbeiten“: Taste „?“ (oder rechts unter „Steuerung“ „⌨ Alle Tasten (?)“) | Eine Karte „⌨ Tasten“ mit allen Tasten: Werkzeuge (V, W, R, M …), Rückgängig, Kopieren, Schieben um 1 cm / 10 cm, Etage höher / tiefer | ✅ (2026-10-25, Claude in der Demo) |
| 76.13 | „Bearbeiten“, Werkzeug „Gerät“, ein Teil wählen (z. B. „TV“) und ins Bild setzen | In der Bibliothek oben „🕘 Zuletzt benutzt“ mit dem Teil; ein Tipp darauf wählt es wieder | ✅ (2026-10-25, Claude in der Demo) |
| 76.14 | Am Handy hochkant „Live“: oben „📊“ → „💡 … an“ | Die Liste „Lichter“ mit Haus und Gruppen wie am PC, „Aus“ zweimal tippen; unten vorne die Favoriten | ✅ (2026-10-25, Claude in der Demo) |
| 76.15 | Im Add-on: eigene Licht-Gruppen anlegen (z. B. Kinderzimmer), abends eine Gruppe ausschalten | Nur die Lichter dieser Räume gehen aus; die Gruppen bleiben nach Neuladen und auf jedem Gerät gleich | ➖ |

## 77. Neu in 4.2.1: Saugroboter sichtbar, Hausmodus mit Knöpfen, „Innenmaß“ beim Messen (#473, #474)
Der Besitzer meldete bei 63.4: In der Küche gibt es keinen Saugroboter. Grund: Er stand in der Demo unter der Treppe. Und bei 63.8: Den Knopf „Urlaub“ gibt es nicht. Grund: Der Hausmodus zeigte seine Möglichkeiten nur in einer Liste zum Aufklappen, und seine Kugel war nur ein weißer Punkt. Bei 58.5 wünschte er sich einen anderen Namen für „Lichter Abstand“ (ein Fachwort aus dem Bau). Bei 54.6 fehlte „Kühlen“: das Klimagerät war mit der Heizung des Wohnzimmers verknüpft, die nur heizen kann; die Demo hat jetzt eine Klimaanlage im Büro, die auch kühlt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 77.1 | Demo, „Live“, Erdgeschoss, „Ansicht“ → „Im Bild: Geräte“; in die Küche schauen, den Saugroboter antippen, „Saugen“ | Der Saugroboter (eine flache runde Scheibe) steht vor der Küchenzeile, darüber eine Kugel mit Besen 🧹; die Karte zeigt „🔌 An der Station“, nach „Saugen“ „🧹 Saugt“ mit „Pause“ und „Zur Station“, die Saugstufe lässt sich wählen | ✅ (2026-10-21) |
| 77.2 | Im Büro an der Innenwand zum Schlafzimmer (rechts neben der Tür) die Kugel ☰ des **Hausmodus** antippen | Unter „Auswahl“ stehen vier Knöpfe: Zu Hause, Abwesend, Urlaub, Nacht; „Zu Hause“ ist blau | ✅ (2026-10-21) |
| 77.3 | „Urlaub“ antippen, die Karte schließen und den Hausmodus noch einmal antippen | Jetzt ist „Urlaub“ blau, oben steht „Urlaub · input_select.hausmodus“ | ✅ (2026-10-21) |
| 77.4 | Bearbeiten, Taste M, zwei gegenüberliegende Wände eines Raums anklicken | Rechts steht „Innenmaß (Wand bis Wand)“ statt „Lichter Abstand“, darunter wie bisher „Abstand der Wandmitten“; das Setzen geht wie in 58.5 | ✅ (2026-10-21) |
| 77.6 | Neu (Frage des Besitzers bei 54.6: „da steht bei der Klima kein Kühlen“): Demo, „Live“, Erdgeschoss, „Im Bild: Geräte“; im Büro oben an der Wand zur Küche die **Klimaanlage Büro** antippen | Die Karte hat Aus, **Kühlen**, Heizen, Entfeuchten, Lüfter, Auto, dazu „Vorwahl“ und „Lüfter“ (Auto, Niedrig, Mittel, Hoch); sie kühlt („❄ kühlt“), die Klappe unten am Gerät ist blau. Auf „Heizen“ und mit + über 23 °C: „🔥 heizt“, die Klappe wird rot. (Die Heizung im Wohnzimmer kann nur heizen, darum hat sie kein „Kühlen“: das zeigt die Karte nur, wenn das Gerät in Home Assistant kühlen kann.) | ✅ (2026-10-21) |
| 77.5 | Im Add-on eine Auswahl mit vielen Möglichkeiten (mehr als 6, z. B. ein Waschprogramm) mit einem Gerät verknüpfen und in „Live“ antippen | Hier bleibt es eine Liste zum Aufklappen (sonst würde die Karte zu groß) | ➖ |

## 78. Neu in 4.3.0: Reiter unten, Kamera-Seite, Reiter pro Benutzer, Tablet ohne Seitenleiste (#479)
Der Besitzer möchte nur noch dieses Programm in Home Assistant benutzen („keine anderen Dashboards mehr“) und hat aus den Beispielbildern (`docs/ideen-4.3/`) alle acht Reiter gewählt, die Leiste unten. Schritt 1: die Leiste, 📷 Kameras als eigene Seite, pro Benutzer welche Reiter und mit welchem es anfängt („es soll ja aber auch noch administrativ verwaltet werden“), die Anleitung fürs Tablet und die Karte für HACS mit Reitern und als Wandtablet. Die übrigen Reiter kommen in den nächsten Schritten.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 78.1 | Demo am PC oder Tablet, „Live“ | Ganz unten eine Leiste mit „🏠 Haus“ (blau umrandet) und „📷 Kameras“, rechts „⛶ Vollbild“; das 3D-Bild endet über der Leiste, nichts wird verdeckt | ✅ (2026-10-25, Claude in der Demo) |
| 78.2 | „📷 Kameras“ antippen | Eine Seite über dem Haus: „📷 Kameras · 2 Kameras · 🏃 Bewegung: 2“, die Kamera Wohnzimmer rot umrandet mit „Bewegung erkannt“, darunter die Kamera Büro, unten „Bewegungsmelder“ mit „Büro Anwesenheit“ | ✅ (2026-10-25, Claude in der Demo) |
| 78.3 | Die Kamera Wohnzimmer antippen, dann „‹ Alle Kameras“ | Die Kamera groß (in der Demo ein Standbild, im Add-on das Live-Bild), oben ihr Name, „Im Plan zeigen“ und „In Home Assistant öffnen“; „‹ Alle Kameras“ geht zurück zu den Kacheln | ✅ (2026-10-25, Claude in der Demo) |
| 78.4 | Noch einmal eine Kamera groß, dann „Im Plan zeigen“ | Zurück beim Haus, die Kamera im Bild markiert, unten ist „🏠 Haus“ blau | ✅ (2026-10-25, Claude in der Demo) |
| 78.5 | Oben den Kamera-Knopf („📷 Bewegung in …“) antippen | In „Live“ öffnet er die Kamera-Seite (früher eine kleine Liste; die gibt es noch beim Bearbeiten) | ✅ (2026-10-25, Claude in der Demo) |
| 78.6 | „Bearbeiten“, dann wieder „Live“ | Beim Bearbeiten ist die Leiste weg und alles wie immer; in „Live“ ist sie wieder da, das Haus offen | ✅ (2026-10-25, Claude in der Demo) |
| 78.7 | „⛶ Vollbild“ antippen, dann noch einmal (oder Esc) | Die Seite füllt den ganzen Bildschirm, wieder antippen: zurück | ✅ (2026-10-25, Claude in der Demo) |
| 78.8 | ⚙ → „📱 Wandtablet“: den Haken „Reiter-Leiste unten“ wegnehmen, schließen; dann wieder setzen | Ohne Haken ist die Leiste weg, mit Haken wieder da | ✅ (2026-10-25, Claude in der Demo) |
| 78.9 | ⚙ → „📱 Wandtablet“ → „📱 Tablet einrichten“ aufklappen, „Text der Karte kopieren“ | Fünf Schritte und der Text der Karte (`type: custom:floorplan3d-card`, `fill`, `tabs`, `kiosk`); der Knopf sagt „Kopiert ✓“ | ✅ (2026-10-25, Claude in der Demo) |
| 78.10 | ⚙ → „👥 Benutzer & Tablets“ → „+ Benutzer“, einen Namen eintippen, sein ⚙ antippen | Unter „Reiter unten“ ein Haken „📷 Kameras“ und „Fängt an mit“ (🏠 Haus / 📷 Kameras); „Fängt an mit: 📷 Kameras“ wählen, schließen, wieder öffnen: es ist gespeichert | ✅ (2026-10-25, Claude in der Demo) |
| 78.11 | Am Handy: Demo, unten „📷 Kameras“ | Die Kameras untereinander, die Überschrift wird nicht vom ☰ verdeckt; „🏠 Haus“ geht zurück | ✅ (2026-10-25, Claude in der Demo) |
| 78.12 | Im Add-on: einem Tablet-Benutzer „Fängt an mit: 📷 Kameras“ geben, am Tablet neu laden; in ⚙ „Zurück zur Startansicht nach“ 1 Minute, zum Haus wechseln und warten | Das Tablet startet auf der Kamera-Seite (Live-Bilder); nach einer Minute ohne Berührung ist es wieder dort | ➖ |
| 78.13 | Im Add-on: einem Benutzer den Haken „📷 Kameras“ wegnehmen (oder unter 🔒 „Kameras“ sperren) | Dieser Benutzer hat keine Leiste (nur das Haus) | ➖ |
| 78.14 | Im Add-on mit HACS: die Karte aktualisieren, ein neues Dashboard mit Ansicht „Panel“ und dem Text aus 78.9, als Standard-Dashboard des Tablet-Benutzers; am Tablet anmelden | Die Karte füllt den Bildschirm mit der Leiste unten; beim Tablet-Benutzer (ohne Admin) sind die Seitenleiste und die Kopfzeile von Home Assistant weg (falls nicht: welche Home-Assistant-Version, ein Bild); als Admin sind sie da | ➖ |

## 79. Neu in 4.4.0: ☀ Heute und ⚡ Energie (#481)
Der Besitzer: „kannst du die anderen reiter auch machen“. Paket 1 von 3: die Startseite „Heute“ und der Strom-Verlauf „Energie“ (auch für zwei Häuser). In der Demo sind Wetter, Termine und Strom-Werte erfunden.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 79.1 | Demo, „Live“: unten die Leiste | 🏠 Haus, ☀️ Heute, ⚡ Energie, 📷 Kameras, rechts ⛶ Vollbild (seit 4.5.0 dazu Klima, Abläufe, Familie: 80.1) | ✅ (2026-10-25, Claude in der Demo) |
| 79.2 | „☀️ Heute“ antippen | Groß die Uhrzeit und das Datum; das Wetter (14 °C, Teilweise bewölkt) mit 5 Tagen (Symbol, Höchst-/Tiefstwert, Regen in %); „Termine“ heute (ganztags Herbstferien, 15:00 Zahnarzt Anna, 17:30 Fußball-Training) und morgen; „Müll“: morgen Gelber Sack, dann Restmüll und Papier; „Wer ist da“: Anna da, Max unterwegs | ✅ (2026-10-25, Claude in der Demo) |
| 79.3 | Rechts „Im Haus“ ansehen und „10 Lichter an“ antippen | Dort stehen offene Türen/Fenster, Lichter an, schwache Batterien; der Tipp geht zum Haus, die Liste „Lichter“ ist offen | ✅ (2026-10-25, Claude in der Demo) |
| 79.4 | Zurück zu „Heute“, „2 offen“ antippen; dann „2 Batterien fast leer“ | Erst die Liste der offenen Türen und Fenster, dann die Geräte-Liste bei „Batterie“ | ✅ (2026-10-25, Claude in der Demo) |
| 79.5 | „Heute“ → „Strom jetzt“ antippen | Die Seite ⚡ Energie geht auf | ✅ (2026-10-25, Claude in der Demo) |
| 79.6 | ⚡ Energie: „Tag“ | Kacheln Verbraucht (mit „gestern um die Zeit“), Vom Dach, Aus dem Netz, Selbst gemacht %, Kosten; Balken je Stunde bis „jetzt“ (orange = Sonne/Batterie, blau = Netz); rechts die größten Verbraucher (Wärmepumpe …); unten Gas und Wasser | ✅ (2026-10-25, Claude in der Demo) |
| 79.7 | Woche, Monat, Jahr nacheinander; mit der Maus über einen Balken fahren (PC) | Balken je Tag (Woche, Monat) und je Monat (Jahr); beim Darüberfahren steht der Wert des Balkens | ✅ (2026-10-25, Claude in der Demo) |
| 79.8 | „‹“ antippen, dann „›“ | Der Zeitraum davor (z. B. „Gestern“, „2025“), die Kachel sagt „Tag davor“ bzw. „Jahr davor“; „›“ geht wieder vor, beim aktuellen Zeitraum ist „›“ grau | ✅ (2026-10-25, Claude in der Demo) |
| 79.9 | Oben „Nachbarhaus“, dann „Alle zusammen“ | Ohne eigene Zähler rechnet das Nachbarhaus mit dem Energie-Dashboard (der Satz unter dem Zeitraum sagt es); „Alle zusammen“ zählt jeden Zähler einmal | ✅ (2026-10-25, Claude in der Demo; das Nachbarhaus hat inzwischen eigene Zähler) |
| 79.10 | „Bearbeiten“ → Strom-Editor → „⚡ Rechnung“, ganz nach unten | „Zähler für den Verlauf (Seite ⚡ Energie)“: je Art (Bezug, Einspeisung, Solar, Batterie rein/raus, Gas, Wasser) ein Feld, „⤵ Aus dem Energie-Dashboard übernehmen“, darunter Strompreis und Einspeisung | ✅ (2026-10-25, Claude in der Demo) |
| 79.11 | „⤵ Aus dem Energie-Dashboard übernehmen“, einen Zähler mit × entfernen, Preis 0,35 eintragen; dann „Wieder das Energie-Dashboard nehmen“ | Die Zähler stehen als Kärtchen mit ihrem Zählerstand da, der Preis bleibt; danach ist es wieder leer („Jetzt: die Zähler des Energie-Dashboards“) | ✅ (repariert in #525, geprüft als 101.7 ✅ 2026-10-25. Damals ❌ 2026-10-25: Strom-Zähler ohne Namen und Stand) |
| 79.12 | ⚙ → „🗂 Reiter unten“ aufklappen | Der Schalter „Reiter-Leiste unten“, darunter die Kalender (Familie, Müllabfuhr) zum Ankreuzen und „Kalender der Müllabfuhr“ | ✅ (2026-10-25, Claude in der Demo) |
| 79.13 | Am Handy: Demo, unten „Heute“, dann „Energie“ | Alles untereinander, gut lesbar; die Leiste unten lässt sich zur Seite wischen, wenn sie nicht passt | ✅ (2026-10-25, Claude in der Demo) |
| 79.14 | Im Add-on: ⚡ Energie mit deinem Energie-Dashboard | Die Zahlen von heute stimmen mit dem Energie-Dashboard von Home Assistant überein (gleicher Tag); Woche, Monat und Jahr ebenso | ➖ |
| 79.15 | Im Add-on: dem zweiten Haus („Kinder“) eigene Zähler in ⚡ Rechnung geben | ⚡ Energie zeigt je Haus seine Werte, „Alle zusammen“ beide | ➖ |
| 79.16 | Im Add-on: ☀ Heute mit deinen Kalendern und dem Müll-Kalender (⚙ → Reiter unten) | Deine Termine und die nächste Müllabfuhr stehen da; das Wetter mit Vorhersage | ➖ |

## 80. Neu in 4.5.0: 🌡 Klima, ▶ Abläufe und 👨‍👩‍👧 Familie mit Pinnwand (#483)
Der Besitzer: „kannst du die anderen reiter auch machen“. Paket 2 von 3: die Räume mit Temperatur, Soll und Luft; große Knöpfe für Szenen und Skripte mit „Ich gehe“ und „Gute Nacht“; wer wo ist mit Handy-Akku und eine Pinnwand für alle. In der Demo sind Personen, Akkus und Zettel erfunden.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 80.1 | Demo, „Live“: unten die Leiste | 🏠 Haus, ☀️ Heute, ⚡ Energie, 🌡️ Klima, 📷 Kameras, ▶️ Abläufe, 👨‍👩‍👧 Familie, rechts ⛶ Vollbild | ✅ (2026-10-25, Claude in der Demo) |
| 80.2 | „🌡️ Klima“ antippen | Je Raum eine Karte mit Temperatur. Wohnzimmer: 21,3°, „🔥 heizt“, Soll 22,0°, „Luft gut · 920 ppm“, 💧 48 %, roter Rand und „Offen: Fenster Wohnzimmer, Tür Wohnzimmer-Küche“ mit „Heizung aus“; Schlafzimmer „🪟 Lüften · 1350 ppm“; Büro „❄ kühlt“, 23,0° in Orange (zu warm); unten „Warmwasser (Wärmepumpe)“ 48,0° und ein Tipp | ✅ (2026-10-28, Claude in der Demo: Büro „🌡 zu warm“ in Orange; repariert in #520, geprüft als 101.2. Wohnzimmer zeigt seit 4.38.0 den Raumfühler, 21,4°) |
| 80.3 | Beim Wohnzimmer zweimal „+“ antippen | Soll springt sofort auf 23,0°; nach einem Moment bleibt es so (ein einziger Befehl an die Heizung) | ✅ (2026-10-25, Claude in der Demo) |
| 80.4 | Beim Wohnzimmer „Heizung aus“ antippen | Das Wohnzimmer zeigt „aus“, kein Soll und keine − + mehr; der rote Rand und der Tipp zum Fenster sind weg | ✅ (2026-10-25, Claude in der Demo) |
| 80.5 | Oben „Nur mit Hinweis“, dann „Alle Räume“ | Nur noch die Räume mit Hinweis (Schlafzimmer: Lüften, Büro: zu warm); dann wieder alle | ✅ (2026-10-25, Claude in der Demo; warum das Büro dabei ist, sah man nicht: #520, 101.2) |
| 80.6 | Auf einen Raumnamen tippen (z. B. „Küche“) | Das Haus geht auf, der Raum ist ausgewählt und seine Karte offen | ✅ (2026-10-25, Claude in der Demo) |
| 80.7 | „▶️ Abläufe“ antippen | Vorne „🚪 Ich gehe“ und „🌙 Gute Nacht“ („… dann Gute Nacht“), dann Filmabend, Guten Morgen, Wohnzimmer Aus, Wohnzimmer Gemütlich; unten zugeklappt „⚙ Automationen (3)“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.8 | „Filmabend“ antippen | Darunter kurz „✓ gestartet“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.9 | „Ich gehe“ antippen | Fenster „Bevor du gehst …“: Offen: 2 (bleibt offen), Lichter an: 10 (gehen aus), Es läuft: 2 (geht aus), Nicht abgeschlossen: 1 Haustür (bleibt offen); Knöpfe „Zurück“ und „Alles aus“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.10 | „Alles aus“ antippen | „✓ Erledigt“, das Fenster geht zu; im Haus sind alle Lichter, der Fernseher und der Lautsprecher aus | ✅ (2026-10-25, Claude in der Demo) |
| 80.11 | „Gute Nacht“ antippen, dann „Trotzdem starten“ | Das Fenster zeigt nur noch die offenen Türen/Fenster und die Haustür, „Danach startet: Gute Nacht“; „Trotzdem starten“ startet die Szene, „✓ Erledigt“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.12 | „⚙ Automationen (3)“ aufklappen, einen Schalter umlegen | Drei Automationen mit Schalter; der Schalter bleibt in der neuen Stellung | ✅ (2026-10-25, Claude in der Demo) |
| 80.13 | ⚙ → „🗂️ Reiter unten“ → „▶️ Abläufe“: Haken bei „Filmabend“, „„Ich gehe“ startet danach“ auf „Wohnzimmer Aus“; dann zur Seite Abläufe | Auf der Seite nur noch Filmabend neben den zwei Prüfungen; „Ich gehe“ sagt „… dann Wohnzimmer Aus“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.14 | „👨‍👩‍👧 Familie“ antippen | Anna „🏠 zu Hause“ seit 11:02, 📱 78 %; Lena „📍 Schule“, 📱 18 % in Rot; Max „🚗 unterwegs“ seit 08:10; rechts die Pinnwand mit drei Zetteln | ✅ (2026-10-25, Claude in der Demo) |
| 80.15 | Eine neue Notiz schreiben, eine Farbe wählen, „📌 Anheften“; dann bei einem Zettel ✕ | Der Zettel kommt vorne dazu (Farbe, „Demo · Uhrzeit“), das Feld ist wieder leer; ✕ nimmt den Zettel ab | ✅ (2026-10-25, Claude in der Demo; nachts steht der neue Zettel nicht vorne, weil die Demo-Zettel Uhrzeiten später am Tag haben) |
| 80.16 | „☀️ Heute“ antippen | Links unter dem Wetter „📌 Pinnwand“ mit den neuesten Zetteln; ein Tipp darauf öffnet „Familie“ | ✅ (2026-10-25, Claude in der Demo) |
| 80.17 | Am Handy: Klima, Abläufe, Familie | Alles untereinander und gut lesbar, bei Abläufe zwei Knöpfe nebeneinander; die Leiste unten lässt sich zur Seite wischen, die Namen sind ganz zu lesen | ✅ (2026-10-25, Claude in der Demo) |
| 80.18 | Im Add-on: 🌡️ Klima mit deinen Thermostaten und Sensoren | Deine Räume mit Temperatur; „+“ / „−“ kommt an der Heizung an | ➖ |
| 80.19 | Im Add-on: 👨‍👩‍👧 Familie | Deine Personen mit ihrem Bild aus Home Assistant und dem Akku des Handys (Companion-App) | ➖ |
| 80.20 | Im Add-on: am Handy eine Notiz anheften, mit „📲 Auch aufs Handy schicken“ | Nach höchstens einer Minute auch am Tablet; die Nachricht kommt über die Benachrichtigung von „Warnungen & Alarm“ | ➖ |
| 80.21 | Im Add-on: einem Benutzer in ⚙ → „Benutzer & Tablets“ die Sperre „Steuern“ geben | Er sieht 🌡️ Klima und ▶️ Abläufe nicht, 👨‍👩‍👧 Familie schon | ➖ |

## 81. Neu in 4.6.0: Seiten bearbeiten wie ein Home-Assistant-Dashboard (#484)
Der Besitzer: „dass ich als Admin die einzelnen Dashboards bearbeiten kann wie im HA-Dashboard“. Gewählt nach den Beispielbildern (`docs/ideen-4.6/`): Karten ordnen und ausblenden, eigene Karten (zwölf Arten), eigene Seiten, für alle gleich. In der Demo darf man immer bearbeiten.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 81.1 | Demo, „Live“, unten „☀️ Heute“, dann rechts in der Leiste „✎ Bearbeiten“ | Oben die Leiste „Seite „Heute“ bearbeiten“ mit „＋ Karte“, „🗂 Reiter“, „↺ Wie am Anfang“, „✓ Fertig“; jede Karte gestrichelt mit ⠿ und 👁; am Ende „＋ Karte hinzufügen“ | ✅ (2026-10-25, Claude in der Demo) |
| 81.2 | Bei „Müll“ 👁 antippen, dann „✓ Fertig“; dann wieder ✎ und 👁 | Erst blass mit „ausgeblendet“, nach „Fertig“ ist die Karte weg; mit 👁 kommt sie zurück | ✅ (2026-10-25, Claude in der Demo) |
| 81.3 | Die Pinnwand an ⠿ greifen und vor die Uhr ziehen, loslassen | Die anderen Karten machen Platz, die Pinnwand bleibt vorne (auch nach „Fertig“ und neu Laden) | ✅ (2026-10-25, Claude in der Demo; nach dem neu Laden fängt die Demo wieder von vorne an, im Add-on bleibt es) |
| 81.4 | „＋ Karte hinzufügen“ → „Verlauf“ → im Suchfeld „wohnzimmer temp“ → „Wohnzimmer Temperatur“ → „7 Tage“, Farbe „Orange“ → „✓ Karte hinzufügen“ | Zwölf Arten zur Auswahl; die Liste zeigt nur passende Geräte; rechts die Vorschau mit Linie; danach steht die Karte auf der Seite („eigene Karte“) | ✅ (2026-10-25, Claude in der Demo; inzwischen 13 Arten) |
| 81.5 | Bei der neuen Karte ⚙️ → Breite „ganze Zeile“ → „Speichern“; dann 🗑 | Die Karte geht über die ganze Breite; 🗑 fragt nach und nimmt sie weg | ✅ (2026-10-25, Claude in der Demo) |
| 81.6 | Weitere Arten anlegen: Schalter (Flur Schalter), Licht (Stehlampe), Thermostat (Heizung Wohnzimmer), Rollladen (Wohnzimmer), Kamera, Raum (Küche), Text, Fertige Karte (Wetter) | Jede Karte zeigt ihr Gerät und lässt sich bedienen (Schalter, Helligkeit, − +, ▲ ■ ▼; Kamera antippen: groß; Raum antippen: im Haus) | ✅ (2026-10-25, Claude in der Demo) |
| 81.7 | „↺ Wie am Anfang“ | Fragt nach; die Karten stehen wieder wie vorher und alle sichtbar, die eigenen bleiben hinten | ✅ (2026-10-25, Claude in der Demo) |
| 81.8 | Auf „Klima“, „Abläufe“, „Familie“, „Energie“, „Kameras“ jeweils „✎ Bearbeiten“ | Überall dieselbe Leiste und dieselben Werkzeuge; z. B. bei Klima die Küche ausblenden, bei Abläufe „Gute Nacht“ nach vorne ziehen | ✅ (2026-10-25, Claude in der Demo) |
| 81.9 | Im Bearbeiten „🗂 Reiter“, dann einen Reiter unten seitlich ziehen (z. B. Familie nach vorn) | Über der Leiste „Reiter bearbeiten“, die Reiter gestrichelt; die neue Reihenfolge bleibt | ✅ (2026-10-25, Claude in der Demo) |
| 81.10 | „＋ Seite“ → Name „Garten“, Symbol 🌱, „Anfangen mit: Geräten eines Bereichs“ → Wohnzimmer → „Seite anlegen“ | Unten der neue Reiter „🌱 Garten“, die Seite mit den Geräten des Wohnzimmers als Karten (Lichter, Heizung, Rollladen, Szenen …), gleich im Bearbeiten | ✅ (2026-10-25, Claude in der Demo) |
| 81.11 | Wieder „🗂 Reiter“, auf „Garten“ tippen: Namen ändern; dann „🗑 Seite löschen“ | Erst heißt der Reiter anders, dann ist er weg | ✅ (2026-10-25, Claude in der Demo) |
| 81.12 | Am Handy: eine Seite bearbeiten, eine Karte mit dem Finger am ⠿ verschieben | Die Karte folgt dem Finger, die Seite rollt mit, wenn man an den Rand kommt | ✅ (2026-10-25, Claude in der Demo) |
| 81.13 | Im Add-on: als Admin eine Seite einrichten, dann am Wandtablet (Benutzer ohne Bearbeiten) ansehen | Dieselbe Anordnung, aber kein „✎ Bearbeiten“ | ➖ |
| 81.14 | Im Add-on: Verlauf-Karte mit einem echten Sensor, 24 Std. und 7 Tage | Die Linie passt zum Verlauf in Home Assistant | ➖ |
| 81.15 | Im Add-on: eine eigene Seite einem Benutzer abwählen (⚙ → Benutzer & Tablets → ⚙ des Benutzers → Reiter unten) | Dieser Benutzer sieht die Seite nicht, alle anderen schon | ➖ |

## 82. Neu in 4.7.0: Vollbild fest für einen Benutzer, beenden nur mit Code (#487)
Der Besitzer: „dass der Benutzer den Vollbildmodus sozusagen dauerhaft anhat und ihn selbst nicht deaktivieren kann … nur mit einem Code“. In der Demo spielt die Adresse mit `?vollbild=1` so ein Tablet (Code **1234**).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 82.1 | Demo mit der Adresse https://burned4aim.github.io/HA-Floorplanner/?vollbild=1&mode=live öffnen | Über allem eine dunkle Fläche „Tippen für Vollbild“; dahinter lässt sich nichts antippen | ✅ (2026-10-25, Claude in der Demo) |
| 82.2 | Auf die Fläche tippen | Die Seite füllt den ganzen Bildschirm; unten rechts steht „🔒 Vollbild beenden“ | ✅ (2026-10-25, Claude in der Demo) |
| 82.3 | „🔒 Vollbild beenden“ antippen, dann 1111 und „Beenden“ | Das Vollbild bleibt, es kommt ein Zahlenfeld; bei 1111 „Falscher Code“ | ✅ (2026-10-25, Claude in der Demo) |
| 82.4 | 1234 und „Beenden“; danach „⛶ Vollbild“ noch einmal | Das Vollbild ist aus, unten rechts wieder „⛶ Vollbild“; nach dem Antippen wieder Vollbild mit 🔒 | ✅ (2026-10-25, Claude in der Demo) |
| 82.5 | Im Vollbild Esc drücken (PC) oder vom Rand wischen bzw. Zurück (Tablet, Handy) | Sofort wieder die Fläche „Das Vollbild wurde verlassen“, ein Tipp: zurück ins Vollbild (Chrome am PC: Esc muss man lange halten) | ✅ (2026-10-25, Claude in der Demo) |
| 82.6 | Auf der Fläche „🔒 Mit Code beenden“ → 1234 → „Beenden“ | Die Fläche ist weg, die Seite geht ohne Vollbild | ✅ (2026-10-25, Claude in der Demo) |
| 82.7 | Nach 82.6 zehn Minuten nichts berühren | Die Fläche „Tippen für Vollbild“ kommt wieder | ✅ (2026-10-25, Claude in der Demo; die Fläche sagt dann „Das Vollbild wurde verlassen“) |
| 82.8 | Demo ohne `?vollbild=1`: ⚙ → „👥 Benutzer & Tablets“, bei einem Benutzer ⚙ → „🔒 Gesperrt“; darunter „🔒 Code für das Vollbild“ | Neuer Haken „Vollbild verlassen (⛶ bleibt an, beenden nur mit Code)“; „✓ Ein Code ist eingerichtet.“; ein Code mit 3 Ziffern wird abgelehnt, mit 4 bis 8 Ziffern „✓ Code gespeichert.“ | ✅ (2026-10-25, Claude in der Demo; erst mit „+“ einen Benutzer anlegen, die Demo hat keinen) |
| 82.9 | Im Add-on: als Admin beim Tablet-Benutzer „Vollbild verlassen“ ankreuzen und einen Code setzen; am Tablet (Fully Kiosk oder Chrome) öffnen | Die Fläche, nach einem Tipp Vollbild; beenden nur mit dem Code | ➖ |
| 82.10 | Im Add-on am Tablet fünfmal einen falschen Code | „Zu viele falsche Versuche. Bitte … Sekunden warten.“ | ➖ |

## 83. Neu in 4.8.0: 🎵 Musik & TV und 🧺 Haushalt (#490)
Paket 3 der Reiter („kannst du die anderen Reiter auch machen“), so wie auf den Bildern `docs/ideen-4.3/7-musik.jpg` und `8-haushalt.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 83.1 | Demo, „Live“: unten die Leiste | Nach „📷 Kameras“ stehen „🎵 Musik & TV“ und „🧺 Haushalt“; am Haushalt eine rote 1 (die Spülmaschine ist fertig) | ✅ (2026-10-25, Claude in der Demo) |
| 83.2 | „🎵 Musik & TV“ antippen | Karten: Fernseher (Netflix), Lautsprecher Wohnzimmer (Sommerregen), Kinderzimmer (Pause), Küchenradio (aus); ⏯, ⏭ und die Lautstärke gehen | ✅ (2026-10-25, Claude in der Demo) |
| 83.3 | Unten bei „Radiosender“ auf „SWR3“, dann „Küchenradio“ | Ein Fenster fragt „Wo soll der Sender laufen?“; danach spielt das Küchenradio SWR3 | ✅ (2026-10-25, Claude in der Demo) |
| 83.4 | Oben „🔗 Räume zusammen“, Häkchen setzen, „Zusammen spielen“; danach wieder öffnen, „Alle trennen“ | Die Karten zeigen „zusammen mit …“; nach dem Trennen ist das wieder weg | ✅ (2026-10-25, Claude in der Demo) |
| 83.5 | Oben „Alles stopp“ | Alles, was spielt, steht auf Pause | ✅ (2026-10-25, Claude in der Demo) |
| 83.6 | „🧺 Haushalt“ antippen | Waschmaschine: Programm, „fertig um …“, „noch … min“ und ein Balken; Trockner „zuletzt gestern 19:40“; Spülmaschine „fertig ✓“, „bitte ausräumen“ | ✅ (2026-10-25, Claude in der Demo) |
| 83.7 | Bei der Spülmaschine „✓ Ausgeräumt“ | Die Karte sagt „zuletzt …“, die rote 1 am Reiter ist weg | ✅ (2026-10-25, Claude in der Demo) |
| 83.8 | Beim Saugroboter „Saugen“, dann „Zur Station“ | Er saugt (Knopf „Pause“), dann fährt er zurück | ✅ (2026-10-25, Claude in der Demo) |
| 83.9 | Einkaufsliste: „Milch“ abhaken, unten „Butter“ eintippen und Enter, dann „Erledigte löschen“ | Milch wird durchgestrichen und rutscht nach unten, Butter kommt dazu, die abgehakten verschwinden | ✅ (2026-10-25, Claude in der Demo) |
| 83.10 | ⚙ → „🗂 Reiter unten“ → „🎵 Musik & TV: Radiosender“: „＋ Sender“, Name und Adresse eintippen, schließen; dann mit × wieder entfernen | Der neue Sender steht als Knopf auf der Seite; nach × ist er weg | ✅ (2026-10-25, Claude in der Demo) |
| 83.11 | Auf beiden Seiten „✎ Bearbeiten“ | Karten lassen sich verschieben und ausblenden wie auf den anderen Seiten | ✅ (2026-10-25, Claude in der Demo) |
| 83.12 | Am Handy beide Seiten ansehen | Alles lesbar, Knöpfe groß genug, nichts abgeschnitten | ✅ (2026-10-25, Claude in der Demo) |
| 83.13 | Im Add-on: echte Lautsprecher und Fernseher | Bild, Titel, Knöpfe und Lautstärke stimmen; ein Sender mit echter Stream-Adresse spielt | ➖ |
| 83.14 | Im Add-on: echte Waschmaschine (Home Connect o. Ä.) oder eine Steckdose mit Leistungsmessung | „läuft seit …“ während sie läuft, danach „fertig“ bis „Ausgeräumt“ | ➖ |
| 83.15 | Im Add-on: die Einkaufsliste von Home Assistant | Was hier abgehakt oder eingetragen wird, steht auch in der Home-Assistant-App | ➖ |
| 83.16 | Im Add-on: „Räume zusammen“ mit Sonos o. Ä. | Die Räume spielen zusammen, „Alle trennen“ trennt sie | ➖ |

## 84. Neu in 4.8.1: Zustände auf Deutsch in der Geräte-Liste (#492)
Beim Selbsttest der Demo gefunden: In der Geräte-Liste stand beim Saugroboter „docked“ und beim Bewegungsmelder „on“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 84.1 | Demo, „Live“, oben „📋 Geräte“ antippen und die Liste durchsehen | Beim Saugroboter steht „An der Station“, bei „Büro Anwesenheit“ „An“, nirgends „on“, „off“ oder „docked“ | ✅ (2026-10-28, Claude in der Demo: nirgends on/off/docked/playing; repariert in #521, geprüft als 101.3) |

## 85. Neu in 4.8.2: Tablets schneller (#494)
Der Besitzer merkte, dass die Tablets langsamer wurden. Das 3D-Bild lief bei jeder Meldung eines Sensors 15 Sekunden mit voller Bildrate, und die Seiten wurden bei jeder Änderung ganz neu gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 85.1 | Im Add-on am Wandtablet ☀ Heute offen lassen, ein paar Minuten warten, dann zwischen den Reitern wechseln | Alles reagiert flüssig, das Tablet wird nicht mehr warm; „Strom jetzt“ zeigt neue Werte, die anderen Karten flackern nicht | ❓ |
| 85.2 | Im Add-on 🏠 Haus offen lassen, nichts berühren (ein Strom-Sensor meldet sich weiter) | Lampen und Werte ändern sich weiter wie gewohnt; das Tablet bleibt kühl | ❓ |
| 85.3 | Im Add-on im 🏠 Haus eine Tür oder ein Rollo über Home Assistant bewegen | Tür bzw. Rollo bewegt sich flüssig bis zum Ende, nicht ruckelnd | ❓ |
| 85.4 | Auf einer Seite (z. B. 🌡 Klima) ein Licht über Home Assistant einschalten, dann auf 🏠 Haus wechseln | Im Haus ist das Licht sofort an (Raum-Kachel, Schild und Lampe) | ❓ |

## 86. Neu in 4.9.0: Thermostat als Kreis wie in Home Assistant (#495)
Wunsch des Besitzers: „wie in Home Assistant selbst mit so einem Kreis, wo man Plus und Minus machen kann … Heizen, Auto und Aus“. Bild `docs/ideen-4.9/1-thermostat.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 86.1 | Demo, „Live“, unten 🌡 Klima | Wohnzimmer und Büro haben einen Kreis: in der Mitte das Soll (groß), darunter „jetzt …“, der Ring ist orange (Heizen) bzw. blau (Kühlen) | ✅ (2026-10-25, Claude in der Demo) |
| 86.2 | Beim Wohnzimmer zweimal auf + tippen | Das Soll steigt sofort um 1,0°, kurz danach wird es an Home Assistant geschickt (bleibt stehen) | ✅ (2026-10-25, Claude in der Demo) |
| 86.3 | Den weißen Knopf am Ring mit dem Finger ziehen | Die Zahl in der Mitte folgt dem Finger; beim Loslassen wird der Wert gesendet | ✅ (2026-10-25, Claude in der Demo) |
| 86.4 | Unter dem Kreis „Auto“, dann wieder „Heizen“ antippen | Der getippte Knopf wird farbig, das Gerät wechselt den Modus | ✅ (2026-10-25, Claude in der Demo) |
| 86.5 | Beim Büro (Klimagerät) „Kühlen“, „Entfeuchten“, „Lüfter“ und die Lüfterstufen antippen | Alle Knöpfe gibt es, der gewählte ist markiert | ✅ (2026-10-25, Claude in der Demo) |
| 86.6 | Bei Wohnzimmer eine Vorwahl antippen (Eco, Komfort …) | Die Vorwahl ist markiert | ✅ (2026-10-25, Claude in der Demo) |
| 86.7 | Unten ✎ Bearbeiten, bei einer Klima-Karte ⤡ antippen, dann ✓ Fertig | Die Karte zeigt einen kleinen Kreis mit − / + und den Modi als Symbole daneben; ⤢ macht sie wieder groß | ✅ (2026-10-25, Claude in der Demo) |
| 86.8 | ☀ Heute, ✎, „＋ Karte hinzufügen“, „Thermostat“, ein Thermostat wählen, „Größe des Kreises: Klein“ | Die Vorschau und die Karte zeigen den kleinen Kreis; mit „Groß“ den großen mit allen Knöpfen | ✅ (2026-10-25, Claude in der Demo) |
| 86.9 | Am Handy 🌡 Klima öffnen und am Ring ziehen | Der Kreis passt auf den Bildschirm, beim Ziehen am Ring scrollt die Seite nicht | ✅ (2026-10-25, Claude in der Demo) |

## 87. Neu in 4.10.0: Strom mehrerer Häuser in einer Grafik (#495)
Wunsch des Besitzers: „wenn man mehrere Häuser hat mit unterschiedlichen Stromsensoren, dass es dann auch in einer Grafik irgendwie zu sehen ist“. Bild `docs/ideen-4.9/2-strom-haeuser.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 87.1 | Demo, „Live“, ⚡ Energie, oben „⚖ Vergleichen“ | Je eine Kachel für Demo-Haus und Nachbarhaus (kWh heute, „jetzt …“) und „Σ alle Häuser“; die Grafik hat eine blaue und eine orange Linie bis „jetzt“ | ✅ (2026-10-25, Claude in der Demo) |
| 87.2 | „Woche“, „Monat“, „Jahr“ antippen | Pro Tag bzw. Monat ein blauer und ein oranger Balken nebeneinander; mit dem Finger auf einem Balken stehen beide Werte | ❓ (repariert in #519; mit nachgemachtem Finger geht es, am echten Tablet noch offen, siehe 101.1. Damals ❌ 2026-10-25: mit dem Finger kein Wert) |
| 87.3 | Die Karten „Leistung jetzt“ und „Kosten“ ansehen | Jedes Haus mit seiner Farbe, Balken und Wert; bei Kosten unten die Summe | ✅ (2026-10-25, Claude in der Demo) |
| 87.4 | ☀ Heute, ✎, „＋ Karte hinzufügen“, „Verlauf“, nach „leistung“ suchen und „Netzbezug“ und „Nachbarhaus Verbrauch“ antippen | Beide sind markiert (farbiges Quadrat), die Vorschau zeigt zwei Linien mit Legende | ✅ (2026-10-25, Claude in der Demo) |
| 87.5 | Die Karte speichern und „✓ Fertig“ | Die Karte heißt „Verlauf“, zeigt zwei farbige Linien und oben beide Werte von jetzt | ✅ (2026-10-25, Claude in der Demo) |
| 87.6 | Im Add-on: bei jedem Haus in ⚡ Rechnung die eigenen Zähler eintragen, dann ⚡ Energie → „⚖ Vergleichen“ | Jedes Haus zeigt seine eigenen Werte; ein Haus ohne eigene Zähler zeigt „keine eigenen Zähler“ (außer dem ersten, das die Zähler aus dem Energie-Dashboard nimmt) | ❓ |

## 88. Neu in 4.11.0: Abschnitte auf den Seiten wie in Home Assistant (#495)
Wunsch des Besitzers: „dass ich so Kartenabschnitte frei auf dem Dashboard platzieren kann mit so Abschnitten“. Bild `docs/ideen-4.9/3-abschnitte.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 88.1 | Demo, „Live“, ☀ Heute, unten ✎ Bearbeiten, oben „＋ Abschnitt“ | Ein Fenster „Abschnitt einstellen“ mit Name, Symbol und Breite; nach „Speichern“ steht der Abschnitt unter den Karten, leer mit „Karten mit ⠿ hierher ziehen“ | ✅ (2026-10-25, Claude in der Demo) |
| 88.2 | Eine Karte am ⠿ in den Abschnitt ziehen, eine zweite daneben | Beide stehen im Abschnitt, oben fehlen sie | ✅ (2026-10-25, Claude in der Demo) |
| 88.3 | Die blaue Ecke ↘ unten rechts einer Karte nach rechts ziehen | Die Karte wird breiter (über zwei oder drei Spalten), nach links wieder schmaler | ✅ (2026-10-25, Claude in der Demo) |
| 88.4 | Am Abschnitt ✏️: anderer Name, „Breit (zwei Spalten)“ | Der Abschnitt heißt anders und ist doppelt so breit | ✅ (2026-10-25, Claude in der Demo) |
| 88.5 | Zweiten Abschnitt anlegen, mit ‹ › die Reihenfolge ändern | Die Abschnitte tauschen den Platz | ✅ (2026-10-25, Claude in der Demo) |
| 88.6 | „✓ Fertig“ | Die Überschriften bleiben, alle Werkzeuge (⠿, ↘, ✏️) sind weg | ✅ (2026-10-25, Claude in der Demo) |
| 88.7 | Wieder ✎, am Abschnitt 🗑 | Nach der Rückfrage ist der Abschnitt weg, seine Karten stehen wieder oben | ✅ (2026-10-25, Claude in der Demo) |
| 88.8 | Dasselbe auf 🌡 Klima oder einer eigenen Seite | Geht genauso | ✅ (2026-10-25, Claude in der Demo) |

## 89. Neu in 4.12.0: Wer ist wirklich zu Hause (#495)
Wunsch des Besitzers: „ob jetzt wirklich eine Person im Haus ist … mit dem Handy, dass es sich mit dem WLAN verbindet“. Bild `docs/ideen-4.9/4-anwesenheit.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 89.1 | Demo, „Live“, unten 👨‍👩‍👧 Familie | Oben „1 Person zu Hause – Anna (Wohnzimmer)“; bei Anna „zu Hause · Wohnzimmer“ | ✅ (2026-10-25, Claude in der Demo) |
| 89.2 | Bei Anna die Liste unter dem Namen ansehen | GPS, Raum, WLAN „Zuhause-5G“ (Handy-App) und „Handy im WLAN (Router)“, jeweils mit Uhrzeit, grün markiert | ✅ (2026-10-25, Claude in der Demo) |
| 89.3 | Bei Lena und Max | „nicht im WLAN (Router)“ grau markiert, GPS sagt Schule / unterwegs | ✅ (2026-10-25, Claude in der Demo) |
| 89.4 | Karte „Wer ist wo im Haus“ | Wohnzimmer – Anna; Räume mit Bewegungsmelder stehen mit „Bewegung / Anwesenheit“ da | ✅ (2026-10-25, Claude in der Demo) |
| 89.5 | Im Add-on: ⚙ → „Reiter unten“ → „Wer ist zu Hause“: „Zu Hause, wenn“ und „WLAN-Name(n) zu Hause“ | Drei Möglichkeiten (Home Assistant / eine Quelle / zwei Quellen); der eigene WLAN-Name lässt sich eintragen | ❓ |
| 89.6 | Im Add-on mit dem eigenen Handy (Home-Assistant-App, WLAN-Sensor an) auf 👨‍👩‍👧 Familie | Bei dir stehen dein WLAN-Name und, wenn vorhanden, das Handy im Router; mit „eine Quelle“ zählst du zu Hause, sobald das Handy im WLAN ist | ❓ |

## 90. Neu in 4.13.0: Kalender-Karte mit mehreren Kalendern und „＋ Termin“ (#495)
Wunsch des Besitzers: „verschiedene Kalender … zusätzlich eine Karte einfach mit Terminkalendern“. Bilder `docs/ideen-4.9/5-kalender.jpg` und `6-kalender-einstellen.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 90.1 | Demo, „Live“, ☀ Heute | Unter Uhr und Wetter die Karte „Diese Woche“: oben die Kalender als farbige Punkte (Familie blau, Arbeit Anna orange, Schule grün, Geburtstage rot), darunter eine Spalte pro Tag mit farbigen Terminen, heute umrandet | ✅ (2026-10-25, Claude in der Demo) |
| 90.2 | Auf der Karte „＋ Termin“, Titel „Test“, Uhrzeit wählen, „✓ Eintragen“ | Das Fenster geht zu, der Termin steht sofort in der Karte | ✅ (2026-10-25, Claude in der Demo) |
| 90.3 | Noch einmal „＋ Termin“, „Ganztägig“ anhaken | „Von / Bis“ verschwinden, dafür „Bis (letzter Tag)“; ohne Titel sagt das Fenster „Bitte einen Titel eingeben.“ | ✅ (2026-10-25, Claude in der Demo) |
| 90.4 | ✎ Bearbeiten, an der Karte ⚙️ | Fenster „Karte ‚Kalender‘ einstellen“: alle Kalender mit Haken und sechs Farbpunkten, Zeitraum, Ansicht, „Termin eintragen“; rechts die Vorschau | ✅ (2026-10-25, Claude in der Demo) |
| 90.5 | Ansicht „☰ Liste“, dann „🗓 Monat“, dann „Nur nächster Termin“ (jeweils speichern, „✓ Fertig“) | Liste nach Tagen („Heute“, „Morgen“, …); Monat mit Punkten, Tippen auf einen Tag zeigt seine Termine darunter; nächster Termin groß, darunter „Danach“ mit zwei weiteren | ✅ (2026-10-25, Claude in der Demo) |
| 90.6 | ✎ → „＋ Karte“ → „📅 Kalender“, nur einen Kalender anhaken, Farbe ändern, „Hinzufügen“ | Eine zweite Kalender-Karte nur mit diesem Kalender in der gewählten Farbe | ✅ (2026-10-25, Claude in der Demo) |
| 90.7 | Im Add-on: eine Kalender-Karte mit deinen Kalendern, „＋ Termin“ in einen Kalender, der Termine annimmt (z. B. Lokaler Kalender, Google) | Der Termin steht danach auch im Kalender von Home Assistant | ❓ |

## 91. Neu in 4.14.0: Knöpfe gestalten (#495)
Wunsch des Besitzers: „mehr Möglichkeiten, Buttons anzupassen“. Bild `docs/ideen-4.9/7-knoepfe.jpg`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 91.1 | Demo, „Live“, unten die neue Seite „🔘 Knöpfe“ | Knöpfe als Kachel, rund, als Pille und nur mit Symbol, in verschiedenen Farben; „Wohnzimmer“ in der Farbe der Lampe mit Helligkeits-Balken, „Schlafzimmer“ mit „seit … Std.“ | ✅ (2026-10-25, Claude in der Demo) |
| 91.2 | Auf „Küche“ tippen | Das Licht geht an, der Knopf wird farbig | ✅ (2026-10-25, Claude in der Demo) |
| 91.3 | „Wohnzimmer“ lange drücken (etwa eine halbe Sekunde) | Ein Fenster mit Reglern: An/Aus, Helligkeit, Farben | ✅ (2026-10-25, Claude in der Demo) |
| 91.4 | Auf „Heizung“ tippen, dann auf „Haustür“ | Heizung: Fenster mit dem Thermostat-Kreis; Haustür: Fenster mit „🔒 Abschließen“ / „🔓 Aufschließen“ | ✅ (2026-10-25, Claude in der Demo) |
| 91.5 | ✎ Bearbeiten, an einem Knopf ⚙️ | Symbol, „Farbe, wenn an“ (auch „oder die Farbe der Lampe“), „Form und Größe“, „Zeigen“, „Tippen“, „Lange drücken“; die Vorschau rechts ändert sich sofort | ✅ (2026-10-25, Claude in der Demo) |
| 91.6 | Bei „Tippen“ „Seite öffnen“ wählen, eine Seite aussuchen, speichern, „✓ Fertig“, dann auf den Knopf tippen | Die gewählte Seite geht auf | ✅ (2026-10-25, Claude in der Demo) |
| 91.7 | Im Add-on: einen eigenen Knopf für eine Lampe anlegen und gestalten | Sieht aus wie gewählt, Tippen und lange Drücken tun, was eingestellt ist | ❓ |

## 92. Neu in 4.15.0: Zähler „von oben übernehmen“ und vollständigeres Backup (#501, #500)
Wünsche des Besitzers: „einen Knopf …, dass es von oben, was ich eingestellt habe, nach unten auch übernommen wird“ und „sichert das Backup auch alles …?“
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 92.1 | Demo, Bearbeiten → Strom-Editor (⚡) → unten „Zähler für den Verlauf“ → „⤵ Von oben übernehmen“ | Für Netz, Solar und Batterie je eine grüne Zeile „… übernommen“; die Zähler stehen darunter | ✅ (2026-10-25, Claude in der Demo) |
| 92.2 | Im Add-on: dasselbe mit deinen Sensoren (SolarNet) | Wo dein Gerät einen kWh-Zähler hat, wird er übernommen; sonst steht dort „misst nur die Leistung (W) …“ mit dem Knopf „＋ Zähler anlegen“ | ❓ |
| 92.3 | Im Add-on: bei einem Sensor ohne Zähler „＋ Zähler anlegen“ | Grüne Zeile „… angelegt und übernommen“; in Home Assistant unter Einstellungen → Geräte & Dienste → Helfer steht ein neuer Helfer „… Energie“ (Integral) | ❓ |
| 92.4 | Noch einmal „⤵ Von oben übernehmen“ | Alles „war schon eingetragen“, nichts doppelt | ✅ (2026-10-25, Claude in der Demo) |
| 92.5 | Eine Notiz an die Pinnwand, dann „Backup herunterladen“, die Notiz löschen, das Backup einspielen | Die Notiz ist wieder da | ✅ (2026-10-25, Claude im Test-Add-on; in der Demo geht das Einspielen nicht, nur im Add-on) |
| 92.6 | Im Add-on: Urlaubs-Alarmanlage eingerichtet (Sensoren, Code), Backup einspielen | Sensoren und Einstellungen stimmen, der Code ist noch derselbe | ❓ |

## 93. Neu in 4.16.0: Leistungs-Sensoren (W) als Zähler (#503)
Nachfrage des Besitzers: „kannst du es nicht einfach so machen, dass es egal ist ob W oder kWh?“
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 93.1 | Im Add-on: Bearbeiten → ⚡ Strom-Editor → „Zähler für den Verlauf“ → „⤵ Von oben übernehmen“ | Bei Solar und Batterie grüne Zeilen „… übernommen: die Seite ⚡ Energie rechnet aus den Watt die kWh“; beim Netzbezug „steht schon: Strom-HD_Strasse-Bezug, nichts doppelt eingetragen“ | ❓ |
| 93.2 | Unten bei „Solar erzeugt“ in „＋ Sensor hinzufügen …“ tippen | Auch Sensoren in W (z. B. SolarNet PV-Leistung) stehen in der Liste | ❓ |
| 93.3 | Unten auf ⚡ Energie, „Woche“ oder „Monat“ | Solar und Batterie zeigen kWh, auch für die Tage vor heute | ❓ |
| 93.4 | Zum Vergleich in Home Assistants eigenem Energie-Dashboard denselben Tag ansehen | Die Werte liegen nah beieinander (aus dem Mittelwert gerechnet, darum nicht aufs Komma gleich) | ❓ |

## 94. Neu in 4.17.0: Docker-Version ohne Supervisor (#489)
Wunsch eines Nutzers (#489): 3D Floorplan auch für Home Assistant als Docker-Container. Im Add-on ändert sich nichts; 94.2 und 94.3 kann nur prüfen, wer Home Assistant als Docker-Container hat (der Nutzer aus #489).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 94.1 | Im Add-on wie immer öffnen, oben rechts schauen, etwas bearbeiten und speichern | Kein Knopf „Abmelden“; Bearbeiten und Speichern gehen wie vorher | ❓ |
| 94.2 | Docker: nach `container/README.md` starten und `http://<Rechner>:8100` öffnen | Die Anmeldeseite von Home Assistant kommt; nach dem Anmelden der Grundriss, als Administrator mit Bearbeiten | ❓ |
| 94.3 | Docker: oben rechts „Abmelden“ | „Abgemeldet.“; „Wieder anmelden“ führt wieder zur Anmeldeseite von Home Assistant | ❓ |

## 95. Neu in 4.18.0: eine Seite in eigener Fassung je Benutzer (#507)
Wunsch des Besitzers: „bei unterschiedlichen Benutzern unterschiedliche Sachen anzeigen“. Beispielbilder `docs/ideen-4.18/`. In der Demo gibt es die Benutzer Admin, Tablet Wohnzimmer und Familie.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 95.1 | 🌡 Klima öffnen, unten rechts ✎ Bearbeiten | Unter der blauen Leiste eine lila Leiste „🗂 Fassung“ mit „👪 Für alle“, „＋ Neue Fassung“, „👁 Ansehen als …“, „👥 Wer sieht was“ | ✅ (2026-10-25, Claude in der Demo) |
| 95.2 | „＋ Neue Fassung“: Name „Kinder“, ein Symbol, „Kopie von „Für alle““, Haken bei „Familie“, „Anlegen und bearbeiten“ | Die Leiste zeigt „🧒 Kinder“ gewählt, daneben „Sehen diese Fassung: Familie“ | ✅ (2026-10-25, Claude in der Demo) |
| 95.3 | In „Kinder“ bei zwei Räumen 👁 tippen, dann oben „👪 Für alle“ tippen | In „Kinder“ sind die zwei Räume blass (ausgeblendet), in „Für alle“ sind sie normal da | ✅ (2026-10-25, Claude in der Demo) |
| 95.4 | „👁 Ansehen als …“ → „Familie“ | Oben lila „Du siehst alles wie Familie · ✕ Zurück“; Klima ohne die zwei Räume; kein ✎ in der Leiste | ✅ (2026-10-25, Claude in der Demo) |
| 95.5 | „✕ Zurück“ | Alles wieder wie vorher, die zwei Räume da, ✎ wieder da | ✅ (2026-10-25, Claude in der Demo) |
| 95.6 | ✎ → „👥 Wer sieht was“: bei Familie unter ⚡ Energie „aus“, „Speichern“; dann „Ansehen als …“ → Familie | Bei Familie fehlt der Reiter ⚡ Energie; „Zurück“ | ✅ (2026-10-25, Claude in der Demo) |
| 95.7 | ⚙ → 👥 Benutzer & Tablets → bei Familie ⚙ → „Reiter unten“ | Neben 🌡 Klima eine Auswahl „🧒 Kinder“; der Haken bei ⚡ Energie ist weg | ✅ (2026-10-25, Claude in der Demo) |
| 95.8 | ✎ auf Klima → Chip „🧒 Kinder“ → „⚙ Einstellen“ → „🗑 Fassung löschen“ → OK | Die Fassung ist weg, nur noch „👪 Für alle“; Familie sieht Klima wieder normal | ✅ (2026-10-25, Claude in der Demo) |
| 95.9 | Dasselbe auf einer anderen Seite (z. B. ☀ Heute) mit „Leer“ | Die neue Fassung startet ohne Karten (alle blass), „＋ Karte“ fügt nur dort etwas hinzu | ✅ (2026-10-25, Claude in der Demo) |
| 95.10 | Handy: ✎ auf Klima, „👥 Wer sieht was“ | Die lila Leiste bricht sauber um, die Tabelle lässt sich seitwärts schieben | ✅ (2026-10-25, Claude in der Demo) |

## 96. Neu in 4.19.0: Sprachsuche mit 🎤 und Codewörtern (#509)
Wunsch des Besitzers: „Sprachsuche … welche Fenster sind offen … Codewörter … Wohnzimmer von den Eltern … pro Benutzer einschränken“. In der Demo gibt es die Codewörter „Stube“ (Wohnzimmer), „Werkstatt“ (Hobbyraum), „Schlafräume“ (drei Räume) und „beim Nachbarn“ (Nachbarhaus). Das 🎤 geht in der Demo mit Chrome, Edge oder Safari (die Erkennung des Browsers), Home Assistant Assist nur im Add-on.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 96.1 | Unten links neben 🔍 auf 🎤 tippen, Mikrofon erlauben, „Welche Fenster sind offen?“ sagen | Das Suchfeld zeigt den Satz, darüber „🪟 Fenster · offen: …“ und die offenen Fenster; im Bild blaue Ringe an diesen Fenstern | ❓ |
| 96.2 | 🔍 tippen und „Ist oben noch Licht an?“ eintippen (ohne Mikrofon) | Oben in der Liste eine Zeile „💬 Lichter · an · Obergeschoss“; Enter: das Obergeschoss, die Lichter, die an sind, mit Ringen | ✅ (repariert in #522, geprüft als 101.4 ✅ 2026-10-25, Claude in der Demo. Damals ❌: der Ring lag unter dem Raum-Schild) |
| 96.3 | „Wie sieht es in der Stube aus?“ (Codewort der Demo) | Die Ansicht fliegt ins Wohnzimmer (in „Live“ geht die Raum-Karte auf) | ✅ (2026-10-25, Claude in der Demo) |
| 96.4 | „Wie warm ist es im Kinderzimmer?“ | Das Kinderzimmer, oben „🌡 Kinderzimmer: … °C“ | ✅ (2026-10-25, Claude in der Demo) |
| 96.5 | „Wie warm ist es?“ | Die Räume werden nach Temperatur gefärbt (wie „Temp.“), darunter alle Räume mit ihrer Temperatur | ✅ (2026-10-25, Claude in der Demo) |
| 96.6 | „Sind alle Fenster zu?“ | Entweder „✓ Fenster: alle zu“ oder die Fenster, die noch offen sind | ✅ (2026-10-25, Claude in der Demo) |
| 96.7 | „Wie sieht es beim Nachbarn aus?“ | Das Nachbarhaus wird geöffnet, oben „🏠 Nachbarhaus“ | ✅ (2026-10-25, Claude in der Demo) |
| 96.8 | Einen Eintrag der Antwort-Liste antippen | Die Ansicht fliegt zu diesem Fenster / Licht, ein Ring markiert es | ✅ (2026-10-25, Claude in der Demo) |
| 96.9 | ⚙ → 🎤 Sprachsuche öffnen | Was dieses Gerät kann (✓/✗ Browser, Mikrofon, Home Assistant Assist), die Anleitung für Assist, die Codewörter der Demo | ✅ (2026-10-25, Claude in der Demo; der Link zu Home Assistant war dunkelblau: #523, 101.5) |
| 96.10 | „＋ Codewort“: „Kinder“ eintippen, bei „＋ Ort …“ Kinderzimmer und Gästezimmer wählen, dann fragen „Wie sieht es bei den Kindern aus?“ | Das Codewort hat zwei Chips; die Frage zeigt beide Räume zum Antippen | ✅ (2026-10-25, Claude in der Demo) |
| 96.11 | Bei einem Codewort ins Feld „für alle (oder Benutzer)“ einen Benutzer schreiben | Das Codewort gilt nur noch für diesen Benutzer | ➖ |
| 96.12 | ⚙ → 👥 Benutzer & Tablets → bei einem Benutzer 🔒 „Sprachsuche (🎤)“ abhaken, als dieser Benutzer öffnen | Kein 🎤 mehr (die Suche 🔍 bleibt) | ➖ |
| 96.13 | Im Add-on mit der Home-Assistant-App auf dem Handy (Android) oder am Wandtablet: 🔍 → 🎤 | Ohne Assist: „Home Assistant kann noch keine Sprache erkennen …“ bzw. kein 🎤; nach der Anleitung in ⚙ → 🎤 (Whisper) geht es | ➖ |
| 96.14 | Handy: 🔍 tippen | Das 🎤 ist im Suchfeld rechts neben dem Eingabefeld | ✅ (2026-10-25, Claude in der Demo) |


## 97. Neu in 4.19.1: 🩺 Mikrofon-Test, 🎤 am Tablet und ohne https (#511)
Der Besitzer: „wenn ich aufs Mikrofon drauf drücke, dann hört er nichts … weder auf dem Tablet noch auf dem PC“. Ursache am Tablet: Apps mit eingebautem Browser (Fully Kiosk, die Home-Assistant-App) haben die Spracherkennung von Chrome, sie tut darin aber nichts. Über http:// gibt kein Browser das Mikrofon frei. Der Test geht auch in der Demo (dort ist es https).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 97.1 | ⚙ → 🎤 Sprachsuche öffnen | Oben eine Liste, was dieses Gerät ist: „Sichere Verbindung (https)“ oder „Unsichere Verbindung (http://…)“, „Gerät: …“ (z. B. „Chrome 130 · Windows“), ob das Mikrofon erlaubt ist, welche Erkennung das 🎤 nimmt (oder warum keine, mit „→ was zu tun ist“) | ✅ (2026-10-25, Claude in der Demo) |
| 97.2 | Darunter „🎤 1. Mikrofon prüfen“, „Zulassen“, etwas sagen | Der Balken bewegt sich und wird grün; nach 6 Sekunden „✓ Das Mikrofon „…“ hört dich“ (oder ✗ mit dem Grund und „→ …“); darunter eine Auswahl „Mikrofon“ | ✅ (2026-10-25, Claude in der Demo mit einem nachgemachten Mikrofon) |
| 97.3 | „🗣 2. Erkennung prüfen“, „Welche Fenster sind offen?“ sagen | „✓ Erkannt mit …: „Welche Fenster sind offen““ oder ✗ mit dem Grund und was zu tun ist | ❓ |
| 97.4 | „📋 Ergebnis kopieren“ | Unten ein Kasten mit dem ganzen Ergebnis (Version, Browser, alle Zeilen); in den Chat einfügen geht | ✅ (2026-10-25, Claude in der Demo) |
| 97.5 | Am PC (Chrome oder Edge) unten links 🎤 tippen | Über https: es hört zu. Über http:// seit 4.20.0: das Diktat der Tastatur (siehe 98.5) | ➖ |
| 97.6 | Am Wandtablet (Fully Kiosk) oder in der Home-Assistant-App 🎤 tippen | Nie mehr endlos „Ich höre zu …“. Ohne Assist seit 4.20.0: das Diktat der Tastatur (siehe 98.4); mit Assist (Whisper, nur über https) hört es selbst zu | ➖ |
| 97.7 | Nach einer Warnung beim 🎤 die Zeile „🩺 Mikrofon-Test öffnen“ antippen | Die Einstellungen gehen bei 🎤 Sprachsuche auf, beim Mikrofon-Test | ✅ (2026-10-25, Claude in der Demo; die Überschrift lag unter der Kopfzeile: #523, behoben in 4.21.2, 101.5) |

## 98. Neu in 4.20.0: 🎤 ohne https mit dem Diktat der Tastatur (#513)
Der Besitzer: „das muss ja einfach Plug and Play funktionieren … man kann ja nicht erwarten, dass jemand, der das installiert, noch eine HTTPS-Verbindung drauf macht“. Browser geben einer Seite das Mikrofon nur über https; das 🎤 der Tastatur gehört aber dem Gerät und tippt in jedes Feld. Wo die Seite nicht selbst zuhören darf (http://, eine App ohne Assist), nimmt das 🎤 deshalb von selbst das Diktat der Tastatur. Die Demo ist https: dort mit der Einstellung „Nur das Diktat der Tastatur“ testen.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 98.1 | In der Demo ⚙ → 🎤 Sprachsuche → Spracherkennung „Nur das Diktat der Tastatur (geht auch ohne https)“ wählen, schließen, unten links 🎤 tippen | Das Suchfeld geht auf (am Tablet und Handy mit der Tastatur), darüber „🎤 Tippe ins Suchfeld, dann auf das 🎤 der Tastatur, und sprich …“ (am PC: „Drücke die Windows-Taste + H …“) | ✅ (2026-10-25, Claude in der Demo: Tablet und Handy „Tippe ins Suchfeld …“, Windows-PC „Windows-Taste + H“) |
| 98.2 | Auf das 🎤 der Tastatur tippen (am PC Windows-Taste + H) und „Welche Fenster sind offen?“ sagen, dann kurz still sein | Nach etwa 2 Sekunden kommt von selbst „🪟 Fenster · offen: …“ mit der Liste, ohne Enter; am Tablet geht die Tastatur weg | ❓ (Claude 2026-10-25: mit nachgestelltem Diktat kommt die Antwort nach etwa 2 Sekunden ohne Enter; das echte 🎤 der Tastatur bitte selbst) |
| 98.3 | ⚙ → 🎤 Sprachsuche ansehen | In der Liste „✓ Auf diesem Gerät: 🎤 mit dem Diktat der Tastatur“ und wie man diktiert; danach wieder „Automatisch“ wählen | ✅ (2026-10-25, Claude in der Demo) |
| 98.4 | Im Add-on über http:// (z. B. http://homeassistant.local:8123) am Wandtablet (Fully Kiosk) oder in der Home-Assistant-App, Einstellung „Automatisch“: 🎤 tippen, dann das 🎤 der Tastatur, fragen | Ohne etwas einzurichten (kein https, kein Whisper) wird die Frage beantwortet | ➖ |
| 98.5 | Im Add-on über http:// am PC (Chrome oder Edge): 🎤 tippen, dann Windows-Taste + H, fragen | Wie 98.4 | ➖ |

## 99. Neu in 4.21.0: 🔋 Ladestand der Batterien auf ⚡ Energie (#515)
Der Besitzer: „dass man den Batterieladezustand nachvollziehen kann in einer Art Diagramm … alles zusammen sehen oder nur einzeln … auch für unterschiedliche Häuser“. In der Demo hat das Demo-Haus die „Hausbatterie“, das Nachbarhaus einen „Hausspeicher“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 99.1 | In der Demo unten „⚡ Energie“, oben „Demo-Haus“ | Eine Karte „🔋 Ladestand“ mit einer Linie durch den Tag bis „jetzt“, oben ein Knopf „Hausbatterie 82 %“, darunter „tiefster Stand … · höchster …“ | ✅ (2026-10-25, Claude in der Demo; am Tag der Zeitumstellung macht die Demo-Linie am Ende einen kleinen Sprung) |
| 99.2 | Oben „Alle Häuser“ | In der Karte zwei Knöpfe „Demo-Haus · Hausbatterie“ (blau) und „Nachbarhaus · Hausspeicher“ (orange), zwei Linien, rechts oben „Zusammen“ und „Einzeln“ | ✅ (2026-10-25, Claude in der Demo) |
| 99.3 | Mit der Maus über die Linien fahren (am Tablet auf die Grafik tippen) | Ein Kästchen mit der Uhrzeit und dem Ladestand jeder Batterie an dieser Stelle | ✅ (2026-10-25, Claude in der Demo) |
| 99.4 | „Einzeln“ antippen | Je Batterie ein eigenes kleines Bild mit Name, tiefstem und höchstem Stand | ✅ (2026-10-25, Claude in der Demo) |
| 99.5 | Den Knopf „Nachbarhaus · Hausspeicher“ antippen, dann noch einmal | Erst durchgestrichen und sein Bild ist weg, dann wieder da | ✅ (2026-10-25, Claude in der Demo) |
| 99.6 | „Einzeln“ lassen, die Seite neu laden (Strg+F5), wieder „⚡ Energie“ → „Alle Häuser“ | Immer noch „Einzeln“: das Gerät hat sich die Wahl gemerkt (ein anderes Gerät hat seine eigene) | ✅ (2026-10-25, Claude in der Demo) |
| 99.7 | Oben „Woche“, dann „Monat“, dann „Jahr“, mit ‹ zurück | Die Linien gehen über die Woche (Tag für Tag auf und ab), den Monat und das Jahr | ✅ (2026-10-25, Claude in der Demo) |
| 99.8 | Oben „⚖ Vergleichen“ | Unter den Karten der Häuser auch hier „🔋 Ladestand“ mit beiden Batterien | ✅ (2026-10-25, Claude in der Demo) |
| 99.9 | Im Add-on: ⚡ Energie mit deiner echten Batterie (Strom-Editor → ⚡ Rechnung → Batterie → Ladestand, oder eine Batterie im Plan) | Die Linie passt zu dem, was Home Assistant im Verlauf des Sensors zeigt | ➖ |
| 99.10 | Im Add-on mit zwei Häusern, jedes mit seiner Batterie: „Alle Häuser“ | Beide Batterien, jede in der Farbe ihres Hauses | ➖ |

## 100. Neu in 4.21.1: iPhone, kein leerer Streifen unter der Reiter-Leiste (#517)
Der Besitzer (Bildschirmfoto aus der Home-Assistant-App): „ganz unten da ein bisschen Abstand … dieses ganze Zeug ein bisschen weiter nach unten verschieben“. Nur auf dem iPhone (oder iPad) prüfbar.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 100.1 | Im Add-on in der Home-Assistant-App am iPhone, unten „🏠 Haus“ | Unter „Haus, Heute, Energie …“ kein leerer Streifen mehr in der Farbe der Leiste; darunter nur noch der dunkle Streifen von Home Assistant mit dem Home-Strich. Die Knöpfe (Ansicht, Normal, Temp.), die Uhrzeit mit dem Wetter und die Raum-Fenster sitzen etwas tiefer, das Haus ist größer | ➖ |
| 100.2 | Im Add-on in der Home-Assistant-App am iPhone, einen anderen Reiter (z. B. „☀ Heute“) öffnen und bis ganz nach unten wischen | Die Seite geht bis an die Leiste, nichts ist abgeschnitten, die Leiste sitzt wie bei 100.1 | ➖ |
| 100.3 | Die Demo am iPhone in Safari öffnen (ohne Home Assistant), unten „Haus“ | Die Leiste hält wie bisher Platz für den Home-Strich frei: der Strich liegt unter den Namen, nicht auf ihnen | ❓ |

## 101. Neu in 4.21.2: Funde aus dem Nacht-Test (#519 bis #525)
In der Nacht zum 2026-10-25 hat Claude die offenen Punkte der Demo durchgetestet (Chromium als PC, Tablet und Handy) und einige im Test-Add-on (Add-on mit nachgebautem Home Assistant). Was dabei nicht ging, ist hier repariert; Claude hat es danach noch einmal geprüft.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 101.1 | Am Tablet oder Handy: Demo, unten „⚡ Energie“, „Woche“, mit dem Finger auf einen Balken tippen; dann oben „⚖ Vergleichen“ und wieder auf einen Balken; dann daneben tippen (#519) | Ein Kästchen mit Tag und kWh (beim Vergleichen beide Häuser untereinander), die Spalte wird hell; ein Tipp daneben schließt es | ❓ (Claude 2026-10-25 mit nachgemachtem Finger: geht; bitte einmal am echten Tablet) |
| 101.2 | Demo, „🌡 Klima“ (#520) | Beim Büro (23,0°, Soll 21) unter dem Kreis ein oranger Chip „🌡 zu warm“; bei „Nur mit Hinweis“ sieht man jetzt, warum das Büro dabei ist | ✅ (2026-10-25, Claude in der Demo) |
| 101.3 | Demo, oben „📋 Geräte“ → „💡 An / offen“ (#521) | Fernseher und Lautsprecher Wohnzimmer „▶ läuft“, nirgends „playing“ | ✅ (2026-10-25, Claude in der Demo) |
| 101.4 | Demo, 🔍 „Ist oben noch Licht an?“, Enter (#522) | Die Raum-Schilder werden blass, der blaue Ring an der Lampe im Kinderzimmer ist zu sehen; nach ein paar Sekunden sind die Schilder wieder normal | ✅ (2026-10-25, Claude in der Demo) |
| 101.5 | Demo, ⚙ → 🎤 Sprachsuche → „Nur das Diktat der Tastatur“, schließen, 🎤 → „🩺 Mikrofon-Test öffnen“ (#523) | Der Mikrofon-Test steht ganz unter der Kopfzeile (Überschrift „🩺 Mikrofon-Test“ zu sehen); weiter unten der Link „Sprachassistenten in Home Assistant öffnen ↗“ hellblau statt dunkelblau. Danach wieder „Automatisch“ wählen | ✅ (2026-10-25, Claude in der Demo, PC und Handy) |
| 101.6 | Demo, „Live“, den Lautsprecher im Wohnzimmer antippen, den Lautstärke-Schieber ziehen (#524) | Die Zahl daneben läuft beim Ziehen mit | ✅ (2026-10-25, Claude in der Demo) |
| 101.7 | Demo, Bearbeiten → Strom-Editor → ⚡ Rechnung → „⤵ Aus dem Energie-Dashboard übernehmen“ (#525) | Auch die fünf Strom-Zähler mit Namen und Stand („Netz Bezug gesamt 18342.7 kWh“ …), nicht nur Gas und Wasser | ✅ (2026-10-25, Claude in der Demo) |

## 102. Neu in 4.21.3: Tablet schneller, Komma, Demo nachts (#138, #527, #528)
Vom Besitzer am 2026-10-25 gewählt („Tablet schneller“, „Komma statt Punkt“, „Demo-Uhrzeiten“), über Nacht gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 102.1 | Auf dem Tablet oder iPad das Musterhaus („alles drin“) öffnen, „Live“, „Ganzes Haus“, drehen und zoomen (#138) | Es läuft flüssiger als vorher; alle Möbel sehen aus wie immer (Farben, Formen, nichts fehlt, nichts schwebt) | ❓ |
| 102.2 | Wie 102.1, dann unten „Ansicht“ → „⏱ Leistung“ auf „alle Werte“ (#138) | Bei „Zeichenaufrufe“ stehen im ganzen Haus etwa 1.200 (vorher etwa 1.660) | ✅ (2026-10-25, Claude im Test-Add-on: 1.177 statt 1.661 Zeichenaufrufe, gleich viele Dreiecke, das Bild Punkt für Punkt gleich) |
| 102.3 | Danach „Bearbeiten“, ein Sofa oder einen Schrank anklicken und verschieben, wieder „Live“ (#138) | Das ganze Möbelstück wandert mit, nichts bleibt am alten Platz stehen; in „Live“ steht es am neuen Platz | ✅ (2026-10-26, Claude in der Demo als Tablet: Sofa verschoben, in „Live“ am neuen Platz, die übrigen Möbel weiter gebündelt) |
| 102.4 | Demo, „Live“, unten „Strom“ drücken; oben links die Zähler ansehen (#527) | Zahlen mit Komma: „3,20 kW“ (am Tag), „🚰 1234,6 m³“; die Schilder über den Geräten „🌡 21,4 °C“ | ✅ (2026-10-26, Claude in der Demo: „1,20 kW“, „🚰 1234,6 m³“, Schilder „🌡 21,2 °C“) |
| 102.5 | Demo nachts öffnen (z. B. nach 22 Uhr), unten „👨‍👩‍👧 Familie“ und „☀ Heute“ (#528) | Keine Uhrzeit aus der Zukunft: „seit 11:02“ und der Zettel „Bin um 6 da“ sind von gestern; im Strom-Bild liefert die Sonne nachts 0 W, die Batterie entlädt | ✅ (2026-10-26, Claude in der Demo um 2 Uhr nachts: „seit gestern 11:02“, Sonne 0 W, die Batterie entlädt) |
| 102.6 | Demo, „⚡ Energie“, Karte „🔋 Ladestand“, „Tag“ (am 25.10. oder einem anderen Tag der Zeitumstellung) (#528) | Die Linie läuft ohne Sprung durch die Nacht | ✅ (2026-10-26, Claude in der Demo am 25.10.: die Linie läuft ohne Sprung) |

## 103. Neu in 4.22.0: 🔔 Klingel (Kamera auf jedem Tablet, #530)
Vom Besitzer am 2026-10-25 gewählt (Bild `docs/ideen-4.3/6-klingel.jpg`), über Nacht gebaut. In der Demo klingelt es mit `?klingel=1` (https://burned4aim.github.io/HA-Floorplanner/?klingel=1).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 103.1 | Demo mit `?klingel=1` öffnen, 8 Sekunden warten | Die Demo geht in „Live“; ein Fenster „🔔 Es klingelt: Haustür“ mit roter Kopfzeile und Uhrzeit, darunter das Kamerabild, unten „🔓 Tür öffnen“ und „✕ Schließen“ | ✅ (2026-10-26, Claude in der Demo) |
| 103.2 | Im Fenster „🔓 Tür öffnen“ einmal tippen, dann noch einmal | Erst „Sicher? Öffnen“ (orange), erst der zweite Tipp öffnet: „✓ Tür geöffnet“ (grün) | ✅ (2026-10-26, Claude in der Demo) |
| 103.3 | „✕ Schließen“ | Das Fenster geht zu | ✅ (2026-10-26, Claude in der Demo) |
| 103.4 | ⚙ → 📱 Wandtablet → 🔔 Klingel ansehen, „🔔 Ausprobieren“ | Haken „Beim Klingeln das Kamerabild zeigen“ und „Gong spielen“, eine Zeile Haustür mit Kamera und Türöffner; „Ausprobieren“ zeigt das Fenster (mit Gong) | ✅ (2026-10-26, Claude in der Demo) |
| 103.5 | Im Add-on mit deiner echten Klingel: am Wandtablet in „Live“ klingeln lassen | Das Fenster mit dem Kamerabild der Tür erscheint sofort, das Tablet wacht auf, ein Gong (wenn das Tablet vorher einmal berührt wurde) | ➖ nur im Add-on |
| 103.6 | Im Add-on: ⚙ → 📱 Wandtablet → 🔔 Klingel | Unter „Selbst gefunden“ steht deine Klingel mit ihrer Kamera; sonst mit „+ Klingel“ selbst wählen (Kamera, Türöffner, Name) | ➖ nur im Add-on |
| 103.7 | Im Add-on: ⚙ → 👥 Benutzer & Tablets → bei einem Tablet 🔒 „Klingel-Fenster“ abhaken | Auf diesem Tablet erscheint beim Klingeln nichts, auf den anderen schon | ➖ nur im Add-on |

## 104. Neu in 4.23.0: 🔔 Sag mir Bescheid (#531)
Vom Besitzer am 2026-10-25 gewählt (Bild `docs/ideen-4.3/8-haushalt.jpg`), über Nacht gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 104.1 | Demo, unten „🧺 Haushalt“ | Bei der Waschmaschine (läuft) der Knopf „🔔 Sag mir Bescheid“; beim Trockner und der Spülmaschine keiner | ✅ (2026-10-26, Claude in der Demo) |
| 104.2 | „🔔 Sag mir Bescheid“ tippen, dann noch einmal | Erst „✓ Ich sage Bescheid“ (blau umrandet), dann wieder „🔔 Sag mir Bescheid“ (in der Demo wird nichts gesendet) | ✅ (2026-10-26, Claude in der Demo) |
| 104.3 | Im Add-on: ⚙ → Warnungen & Alarm muss eine Nachricht eingerichtet sein (WhatsApp, Telegram oder Handy-App). Waschmaschine starten, „🔔 Sag mir Bescheid“ tippen | Wenn sie fertig ist, kommt **eine** Nachricht „🧺 Die Waschmaschine ist fertig.“ aufs Handy (spätestens eine Minute danach), auch wenn kein Bildschirm offen ist | ➖ nur im Add-on |
| 104.4 | Im Add-on: ⚙ → 🗂 Reiter unten → Haushalt: „🔔 Immer Bescheid sagen …“ abhaken | Bei jeder Maschine, die fertig wird, kommt eine Nachricht, auch ohne Tipp | ➖ nur im Add-on |
| 104.5 | Im Add-on ohne eingerichtete Nachricht „🔔 Sag mir Bescheid“ tippen | Die Karte sagt, dass zuerst in ⚙ → Warnungen & Alarm eingerichtet werden muss, wohin die Nachricht geht | ➖ nur im Add-on |

## 105. Neu in 4.24.0: 🗣 Schalten per Sprache (#532)
Vom Besitzer am 2026-10-25 gewählt, über Nacht gebaut. Geht in der Demo auch getippt: 🔍, den Satz eintippen, Enter.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 105.1 | Demo, „Live“, 🔍 „Licht im Wohnzimmer aus“ und Enter | Die Lichter im Wohnzimmer gehen aus; oben steht „✓ 💡 Lichter aus: …“ mit dem Raum, die Lampen haben einen Ring | ✅ (2026-10-26, Claude in der Demo: „✓ 💡 Lichter aus: 4 (Wohnzimmer)“) |
| 105.2 | 🔍 „Licht im Wohnzimmer an“ | Die Lichter gehen wieder an | ✅ (2026-10-26, Claude in der Demo) |
| 105.3 | 🔍 „Ist das Licht im Wohnzimmer an?“ | Nur eine Antwort (Liste), nichts wird geschaltet | ✅ (2026-10-26, Claude in der Demo) |
| 105.4 | 🔍 „Alle Lichter aus“ | Erst die Frage „Lichter im ganzen Haus aus? (n)“ mit „✓ Ja, aus“; erst der Tipp darauf schaltet alles aus | ✅ (2026-10-26, Claude in der Demo: „Lichter im ganzen Haus aus? (8)“) |
| 105.5 | 🔍 „Rollläden in der Küche runter“ | Der Rollladen am Küchenfenster fährt herunter (das Garagentor nie) | ✅ (2026-10-26, Claude in der Demo; der Küchen-Rollladen ist in der Demo schon zu: erst „hoch“, dann „runter“; das Garagentor bleibt zu) |
| 105.6 | Mit echter Sprache (🎤): „Mach das Licht im Bad an“ | Das Licht im Bad geht an | ❓ |
| 105.7 | Im Add-on: als ein Benutzer mit 🔒 „Steuern“ „Licht im Bad an“ sagen | Die Antwort sagt, dass Schalten gesperrt ist, nichts geht an | ➖ nur im Add-on |

## 106. Neu in 4.25.0: 🚗 Auto und 🌱 Garten auf 🧺 Haushalt (#533)
Vom Besitzer am 2026-10-25 gewählt (Bild `docs/ideen-4.3/8-haushalt.jpg`), über Nacht gebaut.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 106.1 | Demo, unten „🧺 Haushalt“ | Eine Karte „🚗 Auto“: groß „64 %“, ein grüner Balken, „lädt mit 3,2 kW · voll um …“ und „312 km Reichweite“ | ✅ (2026-10-26, Claude in der Demo) |
| 106.2 | „☀ Nur mit Sonne laden“ tippen, dann noch einmal | Der Knopf wird gelb (an), beim zweiten Tipp wieder normal | ✅ (2026-10-26, Claude in der Demo) |
| 106.3 | Die Karte „🌱 Garten“ ansehen | „Regen morgen: … mm“, „Boden 34 %“, rechts „Bewässerung aus“; zwei Knöpfe „💧 Rasen · 10 min gießen“ und „💧 Bewässerung Beet · 10 min gießen“ | ✅ (2026-10-26, Claude in der Demo) |
| 106.4 | „💧 Rasen · 10 min gießen“ tippen | Rechts „gießt noch 10 min“, der Knopf heißt jetzt „■ Rasen Stopp“; ein Tipp darauf stoppt es | ✅ (2026-10-26, Claude in der Demo) |
| 106.5 | Im Add-on mit deinem Auto (z. B. evcc): Haushalt öffnen | Die Auto-Karte zeigt deinen Ladestand und die Reichweite; sonst in ⚙ → 🗂 Reiter unten → 🚗 Auto die Sensoren wählen | ➖ nur im Add-on |
| 106.6 | Im Add-on mit deiner Bewässerung: „💧 10 min gießen“, dann 10 Minuten warten | Das Ventil geht auf und nach 10 Minuten von selbst wieder zu | ➖ nur im Add-on |

## 107. Neu in 4.26.0: 🏡 Grundstück, Außenflächen, Maße und Garten-Deko (#538)
Wunsch des Besitzers vom 2026-10-26 („draußen Hof und sowas editieren, das Grundstück bemessen, Deko ums Haus, nicht so krampfig“).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 107.1 | Demo, „Bearbeiten“, Erdgeschoss, Werkzeug „Grundstück“ | Der 2D-Plan zeigt das ganze Grundstück; rechts „Fläche“ ist gewählt, darunter die Beläge (Rasen, Pflaster …), „Ecken klicken / Rechteck“, die Größe des Grundstücks und die Liste der Flächen (Einfahrt, Hof, Beet, Teich, Kiesweg) | ✅ (2026-10-26, Claude in der Demo) |
| 107.2 | „Holzterrasse“ und „▭ Rechteck“ wählen, im Plan zwei Ecken klicken | Beim Bewegen stehen die Maße (z. B. „4.00 m × 3.00 m“) dran; nach dem zweiten Klick liegt eine Holzterrasse da, im 3D-Bild mit Holzdielen | ✅ (2026-10-26, Claude in der Demo) |
| 107.3 | Rechts im Seitenfeld der neuen Fläche einen Namen eintippen und „Seite 1“ ändern | Der Name steht im Plan auf der Fläche; die Seite wird so lang wie getippt, es bleibt ein Rechteck | ✅ (2026-10-26, Claude in der Demo) |
| 107.4 | Werkzeug „Auswählen“, in die Fläche tippen und ziehen; eine Ecke ziehen; Doppelklick auf eine Seite | Die Fläche wandert mit; die Ecke bewegt sich; der Doppelklick macht eine neue Ecke (Doppelklick darauf nimmt sie wieder weg) | ✅ (2026-10-26, Claude in der Demo) |
| 107.5 | Auf den Rand des Grundstücks tippen | Das Grundstück ist orange umrandet, an jeder Seite steht ihre Länge; rechts Fläche, Umfang, Breite und Tiefe zum Eintippen | ✅ (2026-10-26, Claude in der Demo) |
| 107.6 | Werkzeug „Grundstück“: „▭ Rechteck ums Haus“ mit Abstand 5 | Das Grundstück liegt 5 m rings ums Haus; der Rasen im 3D-Bild hat diese Form | ✅ (2026-10-26, Claude in der Demo) |
| 107.7 | „Gerät“, Gruppe „Außen“ | Viele Gartendinge mit Bild: Gartenzwerg, Trampolin, Gartenhaus, Hochbeet, Sonnenschirm, Grill … ; eins in den Garten setzen | ✅ (2026-10-26, Claude in der Demo) |
| 107.8 | Live, „Ganzes Haus“, um das Haus drehen | Einfahrt, Hof, Beet, Teich und Kiesweg liegen mit ihrem Muster auf dem Rasen, dazu Trampolin, Gartenhaus, Gartenzwerg & Co. | ✅ (2026-10-26, Claude in der Demo) |

## 108. Neu in 4.26.1: die 2D-Ansicht zeichnet kein verstecktes 3D-Bild mehr (#542)
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 108.1 | „Bearbeiten“, oben „2D“; Werkzeug „Auswählen“, auf den Rand des Grundstücks tippen | Das Grundstück ist umrandet, an jeder Seite steht sofort ihre Länge | ✅ (2026-10-26, Claude im Test-Add-on) |
| 108.2 | Danach oben „3D“ (oder „2D + 3D“) | Das 3D-Bild ist sofort da und zeigt den aktuellen Stand | ✅ (2026-10-26, Claude im Test-Add-on) |
| 108.3 | Am Tablet in der 2D-Ansicht arbeiten (nur wenn du sie benutzt) | Es reagiert so flüssig wie die 3D-Ansicht oder besser | ❓ |

## 109. Neu in 4.27.0: 🗄 Schrank-Editor, Schrank nach Maß, auch unter der Dachschräge (#545)
Wunsch des Besitzers vom 2026-10-26 („einen Schrank-Editor … auch mit Schrägen, dass man den in Dachschrägen einbauen kann … mit allem personalisierbar … im Nachhinein bearbeiten“).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 109.1 | Demo, „Bearbeiten“, „Gerät“, ins Suchfeld „Schrank“; „Schrank nach Maß“ antippen und im Plan in einen Raum tippen | Der Schrank steht da, und der Schrank-Editor geht sofort auf: vorne der Schrank mit Kleiderstangen, Böden und Schubladen, daneben der Schnitt von der Seite, dazu die Einstellungen | ✅ (2026-10-26, Claude in der Demo) |
| 109.2 | Im Editor auf das mittlere Fach tippen, „Innen“ auf „Nur Schubladen“ | Das Fach ist blau umrandet, „Fach 2 von 3“; vorne sind dort jetzt Schubladen statt einer Tür | ✅ (2026-10-26, Claude in der Demo) |
| 109.3 | „Breite“ auf 210 ändern, dann „+ Fach“ | Alle Fächer werden zusammen breiter (je 70 cm); ein neues Fach kommt dazu | ✅ (2026-10-26, Claude in der Demo) |
| 109.4 | Bei „Fronten“ „Eiche“ antippen, bei „Korpus“ „Anthrazit“, dann „🚪 Türen“ | Die Zeichnung zeigt die Türen in Eiche und den Korpus in Anthrazit; bei „Front: Glastür“ sieht man durch die Tür | ✅ (2026-10-26, Claude in der Demo) |
| 109.5 | „🧊 3D“ antippen und mit dem Finger drehen | Der Schrank steht in 3D da und dreht sich | ✅ (2026-10-26, Claude in der Demo) |
| 109.6 | „Übernehmen“, dann oben ↶ (Rückgängig) | Der Schrank im Haus sieht aus wie im Editor; ↶ holt den alten zurück | ✅ (2026-10-26, Claude in der Demo) |
| 109.7 | Etage „Dach“, im Dachboden den „Schrank unter der Schräge“ antippen | Rechts ein Bild des Schranks, „✎ Schrank bearbeiten“ und „📐 An die Dachschräge anpassen“; im 3D-Bild ist er hinten niedriger, passt unter das Dach und hat innen Licht | ✅ (2026-10-26, Claude in der Demo) |
| 109.8 | Einen neuen Schrank auf die Etage „Dach“ setzen, nah an die Dachkante; im Editor „📐 An die Dachschräge anpassen“ | Darunter steht z. B. „An die Dachschräge angepasst: hinten 101 cm · 35°, Höhe 143 cm“; Zeichnung und 3D zeigen die Schräge | ✅ (2026-10-26, Claude in der Demo) |
| 109.9 | Vorlage „Dachschrägenschrank“ wählen, bei „Dachschräge“ die Höhe und die Neigung ändern | Der Schrank wird links niedriger, Türen und Böden werden schräg abgeschnitten | ✅ (2026-10-26, Claude in der Demo) |
| 109.10 | Im 2D-Plan den Schrank auswählen und am weißen Quadrat an der Seite ziehen | Der Schrank wird breiter oder schmaler (alle Fächer zusammen); im Plan sieht man die Fächer und in Orange, wo er unter der Schräge niedriger ist | ✅ (2026-10-26, Claude in der Demo) |
| 109.11 | Nur im Add-on, in deinem Haus: einen Schrank unter eure echte Dachschräge stellen (Dach-Etage oder ausgebautes Dach mit Kniestock), „📐 An die Dachschräge anpassen“ | Er passt unter die Schräge, nichts ragt durchs Dach | ❓ |

## 110. Neu in 4.28.0: Heiz-Regeln, Heizplan, „Wird benutzt“ und eigene Abläufe „Wenn … dann …“ (#546)
In der Demo ist die Fenster-Regel an: Das Fenster im Wohnzimmer ist offen, darum ist seine Heizung pausiert. Bilder vorher: `docs/ideen-4.28/`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 110.1 | Unten „Klima“, oben „📋 Heiz-Regeln“ | Sieben Karten (Fenster offen → Heizung aus, Keiner zu Hause, Nachtabsenkung, Heizplan, Sommerpause, Boost-Knopf, Urlaub) und „＋ Eigene Regel“; oben „Wohnzimmer: Heizung pausiert …“ mit „🔥 Trotzdem heizen“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.2 | Bei „Fenster offen → Heizung aus“ die Minuten mit − / + ändern; eine Regel mit dem Schalter an- oder ausmachen | Die Zahl ändert sich, kurz „✓ gespeichert“; die Karte wird hell oder blass | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.3 | Oben „Räume“: die Karte „Wohnzimmer“ | Darunter die Zeile „⏸️ Heizung pausiert · Fenster offen seit … Min · danach wieder 22°“, dazu „🔥 Trotzdem heizen“, „🚀 Boost“ und „🔎 Wird benutzt“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.4 | „🔥 Trotzdem heizen“ antippen, danach „🚀 Boost“ und noch einmal „Boost aus“ | Die Heizung heizt trotz offenem Fenster; Boost: „Boost bis …“, noch einmal: wieder wie vorher | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.5 | „🔎 Wird benutzt“ an der Wohnzimmer-Karte | „Im Dashboard“: Fenster offen (läuft gerade), Heizplan, Nachtabsenkung; „In Home Assistant“: „Heizung morgens hoch“ mit „06:00 → Heizung Wohnzimmer 22°“, Schalter, „zuletzt …“, dazu oben die Warnung „Zwei Regeln stellen die Temperatur …“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.6 | Oben „📅 Heizplan“, Raum „Wohnzimmer“: einen Block antippen, noch einmal antippen; den linken Rand eines Blocks ziehen | Der Block ist weiß umrandet, darunter seine Zeit und die Stufen; beim zweiten Tipp eine andere Stufe; der Rand wandert mit dem Finger; „✓ Speichern“ wird blau | ✅ (2026-10-28, Claude in der Demo) |
| 110.7 | Im Heizplan einen Raum ohne Plan wählen, „＋ Plan anlegen“, „✓ Speichern“ | Eine Woche mit Blöcken erscheint und bleibt nach dem Speichern | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.8 | Unten „Haus“ (Live) | Das Schild über dem Wohnzimmer zeigt „⏸️ pausiert“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.9 | Unten „Abläufe“ | „🏠 Eigene Abläufe“: Flurlicht nachts, Rollläden am Abend, Kinoabend als Kette; „⚙️ Automationen in Home Assistant“ mit „benutzt: …“ und „läuft gerade“; „📜 Was ist passiert“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.10 | Bei „Flurlicht nachts“ auf ✏️ tippen | Der Editor: links die Bausteine, in der Mitte die Kette mit Linien und grünen Häkchen, rechts die Einstellungen des gewählten Bausteins, unten „In Worten“ | ✅ (2026-10-26, Claude in der Demo) |
| 110.11 | „＋ Neuer Ablauf“: links „Knopf im Dashboard“, dann „Schalten, dimmen“, rechts eine Lampe ankreuzen, oben einen Namen, „✓ Speichern“, „‹ Abläufe“ | Ohne Lampe ist „Speichern“ grau; danach steht der Ablauf in der Liste mit ▶ | ✅ (2026-10-26, Claude im Test-Add-on) |
| 110.12 | „📋 Aus Vorlage“ | Sechs fertige Abläufe (Fenster offen → Heizung aus, Licht bei Bewegung, Rollläden …); einer öffnet sich im Editor | ✅ (2026-10-28, Claude in der Demo) |
| 110.13 | Am Handy oder Tablet: den Editor öffnen | Die Bausteine stehen oben in einer Reihe zum Wischen, darunter die Kette, darunter die Einstellungen | ✅ (2026-10-28, Claude in der Demo) |
| 110.14 | Nur im Add-on: die Fenster-Regel an, ein echtes Fenster öffnen und warten | Nach den eingestellten Minuten geht die Heizung des Raums aus, beim Schließen wieder an, auch wenn kein Bildschirm offen ist | ➖ (im Test-Add-on ✅ 2026-10-26, Claude) |
| 110.15 | Nur im Add-on: „🔎 Wird benutzt“ an einem echten Thermostat | Deine Automationen, die es benutzen, mit „läuft gerade“ und „zuletzt …“ | ➖ |

## 111. Neu in 4.29.0: Abläufe werden echte Automationen in Home Assistant (#548)
Wunsch des Besitzers vom 2026-10-26 („der Editor soll in unserer App sein … aber es soll dann auch eine echte Home Assistant Automatisierung … daraus werden … nicht, dass wir dann irgendwas kaputt machen“). In der Demo spielt die Seite Home Assistant nur nach.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 111.1 | Unten „Abläufe“ | „Flurlicht nachts“ und „Kinoabend“ zeigen „🏠 Home Assistant“ und ↗, „Rollläden am Abend“ zeigt „⚙️ Add-on“; bei „Automationen in Home Assistant“ stehen die beiden nicht noch einmal | ✅ (2026-10-26, Claude in der Demo) |
| 111.2 | Bei „Flurlicht nachts“ auf ✏️, oben „⚙️ Add-on“ und wieder „🏠 Home Assistant“ antippen, „✓ Speichern“ | Darunter steht „🏠 In Home Assistant gespeichert“ mit „↗ In Home Assistant öffnen“; unten „Läuft als echte Automation in Home Assistant …“ | ✅ (2026-10-26, Claude in der Demo) |
| 111.3 | „＋ Neuer Ablauf“ | Oben ist „🏠 Home Assistant“ schon gewählt | ✅ (2026-10-26, Claude in der Demo) |
| 111.4 | Einen Ablauf auf „⚙️ Add-on“ stellen und speichern, „‹ Abläufe“ | In der Liste steht bei ihm „⚙️ Add-on“ | ✅ (2026-10-26, Claude in der Demo) |
| 111.5 | Nur im Add-on: einen Ablauf mit „🏠 Home Assistant“ speichern, dann in Home Assistant unter Einstellungen → Automationen schauen | Dort steht er mit demselben Namen und „Erstellt mit 3D Floorplan …“; er tut, was im Editor steht | ➖ |
| 111.6 | Nur im Add-on: die Automation in Home Assistant ein wenig ändern und speichern, dann im Dashboard den Ablauf ändern und speichern | Das Dashboard fragt „⚠️ … in Home Assistant geändert. Überschreiben?“; „Nicht überschreiben“ lässt sie, „Überschreiben“ schreibt sie | ➖ |
| 111.7 | Nur im Add-on: einen Ablauf mit „Knopf im Dashboard“ in Home Assistant speichern, dann ▶ | Die Automation läuft (in Home Assistant „zuletzt ausgelöst“: gerade eben) | ➖ |
| 111.8 | Nur im Add-on: den Ablauf löschen | Seine Automation ist in Home Assistant weg, deine anderen Automationen sind alle noch da | ➖ |

## 112. Neu in 4.30.0: 🎨 Szenen für Lampen und LED-Streifen als echte Szenen in Home Assistant (#549)
Wunsch des Besitzers vom 2026-10-26 („dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant“). In der Demo spielt die Seite Home Assistant nur nach.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 112.1 | Unten „Abläufe“, die Karte „🎨 Szenen“ | „TV-Abend“ mit „🎨 Dashboard“ und ✏️, die anderen Szenen mit ▶; „Wohnzimmer Gemütlich“ mit 📋 | ✅ (2026-10-26, Claude in der Demo) |
| 112.2 | Bei „TV-Abend“ ✏️ | Der Szenen-Editor: TV Hintergrundlicht (an, 35 %, lila, Effekt „Kino“), Deckenlicht aus, Stehlampe warm; rechts die Geräte zum Dazunehmen | ✅ (2026-10-26, Claude in der Demo) |
| 112.3 | Beim TV-Licht ein grünes Farbfeld antippen, „▶ Ausprobieren“, dann „✓ Speichern“ | Oben „🏠 In Home Assistant gespeichert“; im Haus leuchtet das TV-Licht grün | ✅ (2026-10-26, Claude in der Demo) |
| 112.4 | „‹ Abläufe“, bei „Wohnzimmer Gemütlich“ 📋 | Der Editor heißt „Wohnzimmer Gemütlich (Kopie)“ mit dem Hinweis, dass die alte bleibt | ✅ (2026-10-26, Claude in der Demo) |
| 112.5 | „＋ Neue Szene“, rechts eine Lampe antippen, „📸 Wie jetzt übernehmen“, Namen geben, speichern | Die neue Szene steht nach ein paar Sekunden in der Karte, mit ✏️ und ▶ | ✅ (2026-10-26, Claude in der Demo) |
| 112.6 | Nur im Add-on: eine Szene mit deinen LED-Streifen bauen und speichern, dann in Home Assistant unter Einstellungen → Szenen schauen | Dort steht sie mit demselben Namen; „Aktivieren“ in Home Assistant stellt die Lichter so ein wie im Editor | ➖ |
| 112.7 | Nur im Add-on: bei einem WLED- oder Nanoleaf-Licht einen Effekt wählen, „▶ Ausprobieren“ | Das Licht spielt den Effekt sofort, ohne dass die Szene gespeichert ist | ➖ |
| 112.8 | Nur im Add-on: eine Szene, die du in Home Assistant gebaut hast, mit 📋 öffnen und speichern | Es gibt eine neue Szene „… (Kopie)“, deine alte ist unverändert | ➖ |

## 113. Neu in 4.31.0: 🚆 Zug-Karte: Kommt mein Zug pünktlich? (#550)
Wunsch des Besitzers vom 2026-10-26 („dass man sich so seine Verbindung reinmacht, um zu schauen, ob morgens der Zug richtig kommt oder nicht … als Karte dazu“). In der Demo sind die Züge erfunden (ab dem Öffnen der Demo).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 113.1 | Unten „Heute“, die Karte „Mein Zug zur Arbeit“ | Oben „Dein Zug RE 50 → Frankfurt (Main) Hbf“ mit der geplanten Zeit durchgestrichen, der neuen groß in Gelb, „+4 Min“, „Gleis 4 statt 3“, „in … Min“ und dem Hinweis der Bahn | ✅ (2026-10-26, Claude in der Demo) |
| 113.2 | Dieselbe Karte, unten | Die nächsten Züge mit Zeit, Zug, Ziel und Gleis; der ICE „fällt aus“ und ist durchgestrichen, „+8“ in Rot | ✅ (2026-10-26, Claude in der Demo) |
| 113.3 | „✎“, „＋ Karte“, „🚆 Zug“ | Felder Bahnhof, Richtung, Mein Zug, wie viele Abfahrten; „Hinzufügen“ geht erst mit einem Bahnhof | ✅ (2026-10-26, Claude im Test-Add-on) |
| 113.4 | Nur im Add-on: eine Zug-Karte mit deinem Bahnhof und deiner Richtung (z. B. „Frankfurt (Main) Hbf“) und deinem Zug | Die echten Abfahrten der Bahn erscheinen, dein Zug steht oben | ➖ |
| 113.5 | Nur im Add-on: an einem Morgen mit Verspätung draufschauen | „+… Min“ in Gelb oder Rot, wie in der DB-App | ➖ |
| 113.6 | Nur im Add-on: einen falsch geschriebenen Bahnhof eintragen | Die Karte sagt, dass die Bahn den Bahnhof so nicht kennt | ➖ |

## 114. Neu in 4.31.1: 🚆 Zug-Karte zeigt deinen Zug auch morgen (#550)
Wunsch des Besitzers vom 2026-10-26 („mache es so, dass ich auch immer den auch morgen sehe“): Die Bahn zeigt nur die nächsten 3 Stunden; abends stand darum „Dein Zug um 06:05 ist nicht unter den nächsten Abfahrten“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 114.1 | Test-Add-on: eine Zug-Karte, deren Zug in 5 Stunden fährt | Oben „Dein Zug“ mit der Zeit groß, „heute“ oder „morgen“, „in 5 Std …“ und „Ob er pünktlich ist, zeigt die Bahn ab etwa …“; darunter die nächsten Züge | ✅ (2026-10-26, Claude im Test-Add-on) |
| 114.2 | Nur im Add-on, am Abend: deine Karte „Oftersheim“ → „Mannheim Hbf“ mit deinem Zug (z. B. 06:05) | Statt „ist nicht unter den nächsten Abfahrten“ steht „06:05“, „morgen“, „in … Std … Min“ | ➖ |
| 114.3 | Nur im Add-on, am Morgen ab etwa 3 Stunden vor deinem Zug | Dein Zug mit Zug, Ziel, Gleis und „pünktlich“ oder „+… Min“ wie bisher | ➖ |
| 114.4 | Nur im Add-on, am Abend danach | Oben zusätzlich dein Zug (z. B. „S S9 → Mannheim Hbf“) und sein Gleis, wie die Bahn sie am Morgen gemeldet hat | ➖ |

## 115. Neu in 4.32.0: 📅 Heizplan: von Hand gedreht, nach 10 Minuten zurück (#546)
Wunsch des Besitzers vom 2026-10-26 („gerne wenn man von Hand dreht nach 10 min wieder zurück, aber das kann eingestellt werden“).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 115.1 | Test-Add-on: ein Raum mit Heizplan, das Thermostat von Hand 3° wärmer drehen | Am Raum im 🌡 Klima „✋ Von Hand gedreht · ab … wieder …“ (10 Minuten später) | ✅ (2026-10-26, Claude im Test-Add-on) |
| 115.2 | 🌡 Klima → 📋 Heiz-Regeln, Karte „Heizplan“ | „Von Hand gedreht: zurück nach 10 Min“, mit − / + änderbar; ganz unten „erst beim nächsten Abschnitt“ | ✅ (2026-10-26, Claude im Test-Add-on) |
| 115.3 | Nur im Add-on: dein Thermostat (z. B. WZFL) bei eingeschaltetem Heizplan von Hand drehen, 10 Minuten warten | Danach steht wieder die Temperatur des Heizplans (z. B. „Nacht 17°“) | ➖ |
| 115.4 | Nur im Add-on: das Thermostat von Hand auf „Aus“ stellen | Es bleibt aus, bis der nächste Abschnitt des Plans beginnt | ➖ |

## 116. Neu in 4.33.0: 🌙 Der Mond im Himmel
Wunsch des Besitzers vom 2026-10-27 („den Mondzyklus reinmachen, dass man sieht, was gerade für ein Mondzyklus ist, ob Vollmond oder Halbmond abnehmend“). Ausprobieren in der Demo: hinten an die Adresse `?skydate=2026-11-01&skytime=05:00` (Halbmond) oder `?skydate=2026-11-12&skytime=17:45` (Sichel am Abend).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 116.1 | Demo, Live, `?skytime=21:30&weather=clear-night` | Links oben (Osten) der fast volle Mond mit grauen Meeren und weichem Schein; oben rechts „🌖 Abnehmender Mond · 96 %“ zwischen Uhrzeit und Wetter | ✅ (2026-10-27, Claude in der Demo) |
| 116.2 | Demo, `?skydate=2026-11-01&skytime=05:00`, dann `?skydate=2026-11-12&skytime=17:45` | Ein Halbmond links beleuchtet hoch am Himmel; am Abend eine schmale Sichel rechts beleuchtet tief im Südwesten | ✅ (2026-10-27, Claude in der Demo) |
| 116.3 | Demo, `?skydate=2026-11-01&skytime=11:00&weather=sunny` | Tagsüber ein blasser Halbmond rechts (Westen), ohne graue dunkle Hälfte | ✅ (2026-10-27, Claude in der Demo) |
| 116.4 | Am Handy, Live, nachts | Unten in der kurzen Zeile der Mond, wie er ist (z. B. 🌖), statt 🌙; der Mond im Himmel | ✅ (2026-10-27, Claude in der Demo) |
| 116.5 | Nur im Add-on, heute Abend | Der Mond steht ungefähr dort, wo du ihn draußen siehst (links Osten, rechts Westen), und die Phase stimmt | ➖ |

## 117. Neu in 4.33.1: Das Haus dreht sich flüssig (#557)
Wunsch des Besitzers vom 2026-10-27 („es erfüllt zwar die 30 fps, aber es fühlt sich trotzdem ruckelig dafür an“). Am besten mit Ansicht → ⏱ Leistung → „alle Werte“: die Zeile „Bild“ zeigt ⌀ (der Durchschnitt) und max (das längste Warten auf ein Bild).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 117.1 | Am PC, Leistung „Automatisch“ oder „Schön“: das Haus mit der Maus langsam einmal ganz herumdrehen | Es dreht sich gleichmäßig, ohne Hänger jede Sekunde; „max“ bei „Bild“ bleibt nah am ⌀ | ✅ (2026-10-27) |
| 117.2 | Wie 117.1, aber schnell drehen und loslassen | Das Haus gleitet weich aus; Wände, die absinken, ruckeln nicht | ✅ (2026-10-27) |
| 117.3 | Am PC ⚙ → „Leistung auf diesem Gerät“: „Schnell (für Tablets)“, das Haus drehen | Beim Drehen mehr als 30 FPS (so viele, wie die Grafik schafft); steht das Bild, wieder 30 und nach 4 s nur noch wenige | ✅ (2026-10-27) |
| 117.4 | Am Tablet oder Handy (Sparmodus von selbst) das Haus mit dem Finger drehen | Flüssiger als vorher, der Finger und das Haus bleiben zusammen | ✅ (2026-10-27) |

## 118. Neu in 4.34.0: Kantenglättung zum Auswählen (#560)
Wunsch des Besitzers vom 2026-10-27 („kannst du das einbauen, so dass ich es anschalten kann jeweils, das wäre praktisch“). Alles in ⚙ → „Kantenglättung auf diesem Gerät“ (bei „Leistung auf diesem Gerät“); dazu Ansicht → ⏱ Leistung → „alle Werte“: die Zeile „Kanten“ sagt, was gerade gilt.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 118.1 | ⚙ öffnen, bei „Leistung auf diesem Gerät“ | Darunter „Kantenglättung auf diesem Gerät“ mit „Wie bei „Leistung““, „Immer“, „Glatt, wenn das Bild steht“, „Nachträglich glätten“, „Automatisch“, „Aus“ | ✅ (2026-10-27, Claude in der Demo) |
| 118.2 | „Glatt, wenn das Bild steht“ wählen (die Seite lädt neu), das Haus drehen und loslassen | Beim Drehen flüssig, „Kanten: glatt im Stillstand · jetzt schnell“; steht das Bild, werden die Kanten glatt („jetzt glatt“) | ✅ (2026-10-27, Claude in der Demo) |
| 118.3 | „Nachträglich glätten“ wählen | Die Kanten sind weich, auch beim Drehen; feine Linien etwas weicher | ✅ (2026-10-27, Claude in der Demo) |
| 118.4 | „Automatisch“ wählen und am PC mit der Intel-Grafik das Haus einige Sekunden drehen | „Kanten: automatisch · … · Grafik zu langsam“ oder „Grafik reicht“; ist sie zu langsam, flüssig beim Drehen und glatt im Stillstand | ✅ (2026-10-27, „schnell beim Drehen, danach glatt … läuft flüssig“; der Text „Grafik zu langsam“ klang nach einem Fehler, heißt jetzt „beim Drehen ohne Glättung“, 4.35.0) |
| 118.5 | Am PC jede Art einmal ausprobieren, das Haus drehen | Welche gefällt dir am besten? Die Farben sind bei allen gleich, nur die Kanten unterscheiden sich | ✅ (2026-10-27, am liebsten „Automatisch“) |
| 118.6 | „Wie bei „Leistung““ wählen | Wieder wie vor 4.34.0 („Kanten: immer glatt“, im Sparmodus „nicht geglättet“) | ✅ (2026-10-27, Claude in der Demo) |

## 119. Neu in 4.35.0: Die Einstellungen fast über den ganzen Bildschirm (#562)
Wunsch des Besitzers vom 2026-10-27 („dass diese fast über den ganzen Bildschirm geht, so muss man nicht ewig scrollen … professionelle Einstellung … schön und übersichtlich“), seine Wahl aus den Beispielbildern `docs/ideen-4.35/`: die Seitenleiste.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 119.1 | Am PC ⚙ öffnen | Das Fenster füllt fast den ganzen Bildschirm: links die Liste der Gruppen, rechts eine Gruppe, ihre Einstellungen als Kacheln nebeneinander | ✅ (2026-10-27, Claude in der Demo) |
| 119.2 | Links eine andere Gruppe antippen (oder mit ↑ / ↓), schließen, ⚙ wieder öffnen | Rechts steht diese Gruppe, links ist sie markiert; beim nächsten Öffnen ist sie wieder da | ✅ (2026-10-27, Claude in der Demo) |
| 119.3 | Oben „Sonne“ suchen, dann „Wand“ und auf „3D-Bild & Leistung“ tippen | Rechts die Gruppen mit Treffern untereinander, die Kachel „Himmel“ markiert, links nur diese Gruppen; der Tipp springt in die Gruppe | ✅ (2026-10-27, Claude in der Demo) |
| 119.4 | Am Handy (oder in einem schmalen Fenster) ⚙ öffnen | Wie bisher: die Gruppen zum Aufklappen untereinander | ✅ (2026-10-27, Claude in der Demo) |
| 119.5 | Im Add-on am PC durch alle Gruppen klicken und etwas umstellen (z. B. Raster, Fassade) | Alles ist erreichbar, die Änderung bleibt gespeichert; gefällt es dir? | ❓ |
| 119.6 | Am Tablet quer im Add-on ⚙ öffnen | Ebenfalls die Liste links, alles gut lesbar und antippbar | ❓ |
## 120. Neu in 4.36.0: Szenen „Auf alle anwenden“, Weißton in Kelvin, Szenen und Automationen aus Home Assistant verwalten (#564)
Wünsche des Besitzers vom 2026-10-27: „den Knopf … für egal welches Gerät auf alle anwenden in der Szene“, „bei Lampen … so eine Kelvin-Anzeige“, „Szenen dort löschen …, die von Home Assistant sind … verwalten … und die Automatisierungen auch“.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 120.1 | ▶ Abläufe → 🎨 Szenen → ✏ bei „Wohnzimmer Gemütlich“, bei der Stehlampe „⇉ Auf alle anwenden“ | Alle Lampen der Szene bekommen Helligkeit und Weißton der Stehlampe, oben „✓ Für alle übernommen (2)“ und „↶ Rückgängig“; Rückgängig stellt es zurück | ✅ (2026-10-27, Claude in der Demo) |
| 120.2 | Im Szenen-Editor rechts „💡 Lampen“ antippen, dann „＋ Alle … dazunehmen“ | Nur Lampen in der Liste; der Knopf nimmt alle auf einmal in die Szene | ✅ (2026-10-27, Claude in der Demo) |
| 120.3 | Im Szenen-Editor bei einer Lampe den Schieber „Weißton“ ziehen | Der Schieber ist von warm (orange) nach kalt (weiß) gefärbt, daneben steht z. B. „4000 K · Neutralweiß“ | ✅ (2026-10-27, Claude in der Demo) |
| 120.4 | Im 3D-Bild die Stehlampe antippen und den Schieber „Weißton“ ziehen | Statt „Warmweiß / Kaltweiß“ ein Schieber mit „2700 K · Warmweiß“; losgelassen ändert die Lampe ihren Weißton | ✅ (2026-10-27, Claude in der Demo) |
| 120.5 | 🎨 Szenen → 🗑 bei „Wohnzimmer Gemütlich“, die Frage mit OK bestätigen, dann „↶ Wiederherstellen“ | Die Szene verschwindet, oben steht „🗑 „Wohnzimmer Gemütlich“ gelöscht · ↶ Wiederherstellen“; danach ist sie wieder da | ✅ (2026-10-27, Claude in der Demo) |
| 120.6 | Automationen in Home Assistant → 🗑 bei einer Automation, dann „↶ Wiederherstellen“; ▶ bei einer anderen | Sie verschwindet und kommt zurück; ▶ startet sie (kurz ✓, „zuletzt“ springt auf „gerade eben“) | ✅ (2026-10-27, Claude in der Demo) |
| 120.7 | Im Add-on eine Szene aus Home Assistant mit ✏ öffnen, etwas ändern, „Speichern“; dann in Home Assistant (Einstellungen → Automationen & Szenen → Szenen) nachsehen | Die Szene ist dort geändert, alles andere darin (z. B. ein Fernseher) ist geblieben | ❓ |
| 120.8 | Im Add-on bei einer Lampe, die Weißtöne kann (z. B. Hue), den Schieber „Weißton“ ziehen | Der Bereich passt zur Lampe (z. B. 2200 bis 6500 K), die Lampe wird wärmer oder kälter | ❓ |
| 120.9 | Im Add-on eine Automation (oder Szene) aus Home Assistant löschen und mit „↶ Wiederherstellen“ zurückholen | Sie ist in Home Assistant weg und danach wieder da, mit allem, was darin war | ❓ |

## 121. Neu in 4.37.0: Plateau im Gelände, Boden je Raum höher, Außentreppe (#566)
Wunsch des Besitzers vom 2026-10-27: „das andere Haus steht aber auf einem leichten, erhöhten Plateau … man läuft erst eine Treppe hoch … ich möchte das zweite Haus einfach da drin zusätzlich zeichnen“; seine Wahl: Plateau im Gelände und Höhe je Raum, beides zusammen.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 121.1 | In der Demo: Bearbeiten → rechts „🏘 Gebäude in diesem Plan“ aufklappen → unten „Nachbarhaus“ → „Hereinholen“ (Frage mit OK) | Das Nachbarhaus ist jetzt ein Gebäude im selben Plan (oben „🏘 Alle Gebäude / Demo-Haus / Nachbarhaus“) | ✅ (2026-10-27, Claude in der Demo) |
| 121.2 | Werkzeug „Grundstück“ → „Fläche“ → bei „▲ Plateau unter“ „Nachbarhaus“ wählen → „Anlegen“ | Rechts das Plateau mit „Höhe über dem Rasen 0.6“; in 3D steht nur das Nachbarhaus 60 cm höher auf einer Natursteinmauer, das Demo-Haus bleibt unten | ✅ (2026-10-27, Claude in der Demo) |
| 121.3 | Höhe auf 0.9 ändern, dann Rand „🌱 Böschung“, dann wieder „🧱 Mauer“ und „Mauer aus: Gabionen“ | Das Haus geht 90 cm hoch; die Böschung ist ein schräger Rasen rundherum; dann eine Mauer aus Steinkörben | ✅ (2026-10-27, Claude im Test-Add-on) |
| 121.4 | „＋ Außentreppe an die Haustür“ | Vor der Haustür eine Steintreppe mit Podest und Geländer vom Rasen bis zur Tür; rechts „Höhe (bis oben) 0.9“, Breite, Podest, Geländer und „5 Stufen à 0.18 m“ | ✅ (2026-10-27, Claude in der Demo) |
| 121.5 | 2D: das Plateau und die Räume darauf ansehen | Am Rand „▲ Plateau · 0.90 m“, die Mauer als dicker brauner Rand, unter „Wohnen“ und „Diele“ „▲ +0.90 m“, die Außentreppe mit ihren Stufen | ✅ (2026-10-27, Claude in der Demo) |
| 121.6 | Einen Raum anklicken (z. B. Wohnzimmer), rechts „Boden höher als die Etage“ 0.45 | Boden und Möbel 45 cm höher, die Deckenlampe bleibt oben; an der Tür zur Küche 2 Stufen (3 × 15 cm); im 2D-Plan „▲ +0.45 m“ | ✅ (2026-10-27, Claude im Test-Add-on) |
| 121.7 | Beim selben Raum den Haken „Stufen an den Türen von selbst“ wegnehmen | Die Stufen verschwinden | ✅ (2026-10-27, Claude im Test-Add-on) |
| 121.8 | Im Add-on: dein zweites Haus in den Plan zeichnen, rechts bei „🏘 Gebäude in diesem Plan“ seine Räume dem zweiten Gebäude zuordnen, dann Grundstück → „▲ Plateau unter <dein Haus>“, Höhe wie bei euch, „＋ Außentreppe an die Haustür“ | Nur dieses Haus steht höher, das andere bleibt auf dem Rasen; die Treppe führt zu eurer Haustür; Lampen, Fenster und Kugeln sitzen in der Live-Ansicht am richtigen Ort | ❓ |

## 122. Repariert in 4.37.1: Fenster-Regel unter dem Heizplan, Temperatur über dem Raum (#568, #569)
Meldung des Besitzers vom 2026-10-28: „bei mir ist das Fenster offen, die Steuerung ist an, aber er überschreibt nicht den Heizplan“ und „über den einzelnen Zimmern … schwebt ja immer eine Temperatur … keine von den Temperaturen, die da drin ist“ (Wohnzimmer FL: 22,8° oben, Sensor 20,5°, Thermostat 25,1°).
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 122.1 | In der Demo: „Live“, Schild über dem Wohnzimmer ansehen | Es zeigt 21,4° wie der Sensor „Wohnzimmer Temperatur“, nicht mehr 21,3° (der Mittelwert mit der Heizung, 21,2°) | ✅ (2026-10-28, Claude in der Demo) |
| 122.2 | Im Add-on: Schild und Kachel über deinem Wohnzimmer FL ansehen | Dieselbe Temperatur wie dein Sensor im Raum (bei deinem Bild 20,5°), nicht mehr der Mittelwert mit dem Thermostat am Heizkörper | ✅ (2026-10-28) |
| 122.3 | Im Add-on: 🌡 Klima → 📋 Heiz-Regeln, „Fenster offen → Heizung aus“ und den Heizplan an, im Wohnzimmer FL das Fenster öffnen | Erst „Fenster offen: die Heizung geht gleich aus“, nach den eingestellten Minuten geht das Thermostat aus und die Zeile sagt „Heizung pausiert · Fenster offen seit … Min“ | ❌ (2026-10-28: „Heizung pausiert · Fenster offen seit 25 Min“ steht da, „aber aus wird das Thermostat dann nicht“, es heizt weiter auf 17° → #571, repariert in 4.37.2, siehe 123) |
| 122.4 | Danach das Fenster wieder schließen | Die Heizung kommt zurück mit der Temperatur des Heizplans, die gerade gilt | ✅ (2026-10-28) |

## 123. Repariert in 4.37.2: bei offenem Fenster geht das Thermostat wirklich aus (#571)
Meldung des Besitzers vom 2026-10-28 (zu 122.3): „Aber aus wird das Thermostat dann nicht, soll das so?“
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 123.1 | Im Add-on (4.37.2): im Wohnzimmer FL das Fenster öffnen und warten (die eingestellten Minuten, dann noch bis zu 6 Minuten) | Das Thermostat steht auf „Aus“ oder auf seiner kleinsten Temperatur (5° oder 7°) und heizt nicht mehr; die Zeile sagt „Heizung pausiert · Fenster offen seit … Min · danach wieder …°“ | ❓ |
| 123.2 | Das Fenster wieder schließen | Das Thermostat heizt wieder mit der Temperatur von vorher (oder der des Heizplans, die jetzt gilt) | ❓ |
| 123.3 | Nur falls es trotzdem weiter heizt: nach etwa 15 Minuten auf 🌡 Klima schauen | Die Zeile sagt ehrlich „⚠️ … das Thermostat geht nicht aus, es heizt weiter“ (dann bitte melden, welches Thermostat es ist) | ❓ |

## 124. Neu in 4.38.0: 🌡 Raumfühler für die Thermostate (#573)
Wunsch des Besitzers vom 2026-10-28: „jedem Thermostat einfach einen Temperatursensor gebe … wie bei Better Thermostat“. Beispielbilder: `docs/ideen-4.38/`.
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 124.1 | In der Demo: „Live“, unten 🌡 Klima, oben „📋 Heiz-Regeln“ | Ganz oben die Karte „🌡 Raumfühler für die Thermostate“: „Heizung Wohnzimmer · Wohnzimmer · Zigbee2MQTT / MQTT“, Fühler „Wohnzimmer Temperatur 21,4°“, misst selbst 24,6°, „🎯 Ausgleich am Thermostat ✓ eingestellt: −3,2°“ | ✅ (2026-10-28, Claude in der Demo) |
| 124.2 | In derselben Karte bei „Klimaanlage Büro“ auf „＋ Übernehmen“ tippen | Der Vorschlag „Büro Temperatur“ steht jetzt als Fühler da, daneben „↕ Wunsch verschieben“ (die Klimaanlage hat keinen Ausgleich) | ✅ (2026-10-28, Claude in der Demo) |
| 124.3 | Bei „Heizung Wohnzimmer“ auf den Fühler tippen, im Fenster „Küche Temperatur“ wählen, „✓ Übernehmen“ | Im Fenster stehen oben die Sensoren des Raums („Im selben Raum“), darunter die anderen; danach zeigt die Zeile „Küche Temperatur 22,1°“ und einen neuen Ausgleich (−2,5°) | ✅ (2026-10-28, Claude in der Demo) |
| 124.4 | „Räume“ antippen, Karte Wohnzimmer ansehen | Im Kreis die Temperatur vom Fühler; darunter „🌡 Raumfühler 21,4° · am Heizkörper 24,6°“ und „🎯 Ausgleich −3,2°“ | ✅ (2026-10-28, Claude in der Demo) |
| 124.5 | Im Add-on: 📋 Heiz-Regeln → „🌡 Raumfühler“ | Alle deine Thermostate mit Raum und Art (z. B. Zigbee2MQTT, ZHA, Matter, Homematic IP); wo im selben Raum ein Temperatursensor liegt, steht „💡 Vorschlag … ＋ Übernehmen“ | ❓ |
| 124.6 | Dem Thermostat im Wohnzimmer FL den Sensor des Raums geben („＋ Übernehmen“) und 1 bis 2 Minuten warten | Die Zeile sagt „🎯 Ausgleich am Thermostat ✓ eingestellt: …“ (oder „↕ Wunsch verschieben“, wenn das Gerät keinen Ausgleich hat); in Home Assistant zeigt das Thermostat nach ein paar Minuten ungefähr die Temperatur des Sensors | ❓ |
| 124.7 | Im 🌡 Klima beim Wohnzimmer FL die Wunschtemperatur einstellen (z. B. 21°) und eine Weile warten | Der Heizkörper heizt, bis der Sensor im Raum etwa 21° zeigt (nicht mehr nur bis das Thermostat am Heizkörper 21° misst) | ❓ |
| 124.8 | Nur wenn du eins hast: einem Thermostat ohne Ausgleich (z. B. Homematic IP) einen Fühler geben, 21° einstellen | „↕ Wunsch verschieben · du willst 21° → am Thermostat …“; am Gerät steht eine höhere Zahl, im Raum werden es etwa 21° | ❓ |
| 124.9 | Beim Wohnzimmer FL auf den Fühler tippen, „✕ Fühler entfernen“ | Das Thermostat bekommt seinen alten Ausgleich zurück (bei „Wunsch verschieben“: die Wunschtemperatur), die Zeile zeigt wieder „💡 Vorschlag …“ | ❓ |

## 125. Repariert in 4.38.2: Raumfühler und Fenster-Regel zusammen (#577)
Meldung des Besitzers vom 2026-10-28: „seitdem du das geändert hast, reagiert die Heizungssteuerung irgendwie nicht mehr so, wie sie soll. Der Heizplan überschreibt irgendwie alles, selbst wenn die Fenster aufgehen.“ Sein Bild: Soll 29,5°, „↕ am Thermostat 30°“, „✋ Von Hand gedreht · ab 17:23 wieder Komfort 27,5°“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 125.1 | Im Add-on (4.38.2): 🌡 Klima, Wohnzimmer FL (mit Raumfühler, Heizplan an) eine halbe Stunde nicht anfassen | Im Kreis steht als Soll die Temperatur des Heizplans (z. B. Komfort), nicht mehr 29,5° oder 30°; kein „✋ Von Hand gedreht“, wenn niemand gedreht hat. Unter „↕ am Thermostat“ darf eine höhere Zahl stehen (das ist der Ausgleich) | ❓ |
| 125.2 | Die Tür nach draußen im Wohnzimmer FL öffnen (die von deinem Bild; eine Tür zu einem anderen Raum zählt nicht) und die Minuten der Fenster-Regel warten, dann noch bis zu 6 Minuten. Danach dasselbe mit einem Fenster | Das Thermostat ist aus oder auf seiner kleinsten Temperatur und bleibt so; die Zeile sagt „⏸️ Heizung pausiert · Fenster offen seit … Min“, beim Raumfühler „⏸️ pausiert, das Fenster ist offen · danach wieder …°“ | ❓ |
| 125.3 | Tür und Fenster wieder schließen | Das Thermostat heizt wieder: Soll = die Temperatur des Heizplans, am Thermostat etwas mehr (verschoben) | ❓ |

## 126. Neu in 4.39.0: 🩺 Protokoll „Wer steuert was?“ (#579)
Wunsch des Besitzers vom 2026-10-28: „Wäre es nicht sinnvoll, noch irgendwo so ein Log … hinzuzufügen, wo man so auch auslesen kann, was gerade wen steuert?“ Dazu seine Meldung: ein offenes Fenster oder eine offene Tür wird nicht immer erkannt, und manchmal steht „von Hand gedreht“, obwohl es das Add-on selbst war. Repariert: „✋ Von Hand gedreht“ gleich nach dem eigenen Befehl (das Thermostat meldet spät), und ein Fenster-Kontakt, der sich kurz nicht meldet.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 126.1 | In der Demo: 🌡 Klima → „🩺 Protokoll“ | Oben „Wer steuert was?“ mit „Verbunden mit Home Assistant seit …“, Fenster-Regel und Heizplan; darunter je Raum eine Karte (Wohnzimmer: „⏸️ Heizung pausiert …“, das Thermostat, „Fenster Wohnzimmer: offen“ mit „Fenster · zählt für die Fenster-Regel“, „Tür Wohnzimmer-Küche: offen“ mit „… zählt nicht: Tür zwischen zwei Räumen“); ganz unten das Protokoll, neueste zuerst | ✅ (2026-10-28, Claude in der Demo) |
| 126.2 | Im Protokoll lesen | z. B. „✋ Wohnzimmer: Heizung Wohnzimmer Soll 21° → 23°“ mit „am Thermostat selbst …“, „🤖 … Soll 23° → 21°“ mit „vom Add-on (vor 52 s geschickt)“, „📋 Wohnzimmer: Fenster offen → Heizung Wohnzimmer aus“ mit „✓ Home Assistant hat es angenommen“ | ✅ (2026-10-28, Claude in der Demo) |
| 126.3 | Oben „Wohnzimmer“ antippen, dann „Alle Räume“ | Nur noch die Karte und die Zeilen des Wohnzimmers; „Alle Räume“ zeigt wieder alles | ✅ (2026-10-28, Claude in der Demo) |
| 126.4 | „📋 Bericht kopieren“ und in eine Notiz einfügen; dann „⬇ Als Datei“ | Der Knopf sagt „✓ Kopiert: jetzt im Chat einfügen“; der Text hat oben die Version, je Raum „== Wohnzimmer (main/r1) ==“ mit den Entitäten in Klammern, unten das Protokoll; die Datei ist dasselbe mit dem ganzen Protokoll | ✅ (2026-10-28, Claude in der Demo) |
| 126.5 | „Räume“ antippen, beim Wohnzimmer „🩺 Protokoll“ | Das Protokoll öffnet sich nur für das Wohnzimmer | ✅ (2026-10-28, Claude in der Demo) |
| 126.6 | Im Add-on: 🌡 Klima → „🩺 Protokoll“, dein Wohnzimmer FL ansehen | Die Karte zeigt dein Thermostat, deinen Raumfühler, deine Fenster und die Tür nach draußen, jeweils mit „zählt für die Fenster-Regel“. Steht dort „zählt nicht: …“ oder fehlt ein Fenster: sag es, das ist dann der Grund, warum es nicht erkannt wird | ❓ |
| 126.7 | Ein Fenster im Wohnzimmer FL öffnen, die Minuten der Fenster-Regel warten, wieder schließen, dann 🩺 Protokoll | Im Protokoll (neueste oben) stehen „Fenster … offen“, „Fenster offen, die Wartezeit läuft“, „⏸️ Heizung pausiert“, „Fenster offen → … aus“ mit ✓ und das Thermostat „heizen → aus“ mit „vom Add-on“; danach „… zu“ und das Zurückstellen | ❓ |
| 126.8 | Mit Heizplan: einen neuen Abschnitt des Plans abwarten | Kein „✋ Von Hand gedreht“ nur, weil das Thermostat die neue Temperatur spät meldet; im 🩺 Protokoll vielleicht kurz „⏳ … geschickt, das Thermostat hat es noch nicht gemeldet“, dann „🤖 … vom Add-on (vor … s geschickt)“ | ❓ |
| 126.9 | Fällt dir wieder etwas auf (ein Fenster nicht erkannt, „✋ Von Hand gedreht“ ohne Drehen): „📋 Bericht kopieren“ und im Chat einfügen | Claude sieht darin, was das Add-on gesehen und getan hat, und findet den Grund | ❓ |

## 127. Neu in 4.40.0: 📜 Protokoll, ein eigener Reiter für alle Geräte (#581)
Wunsch des Besitzers vom 2026-10-28: „eine eigene Seite, wo alles quasi passiert … exportieren … für eine Fehleranalyse … alle Geräte drin hat, die in den Plänen verwendet werden“. Seine Wahl aus `docs/ideen-4.40/`: Bild 2 und 3, nur für Admins, Export als Text, .txt und .csv, so lange wie 🛡 Sicherheit.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 127.1 | In der Demo: unten „📜 Protokoll“ antippen | Oben die Zahlen (Änderungen, Befehle, Fehler, „zeichnet auf“), darunter die Liste, neueste oben: Zeit, Gerät mit Raum, was sich geändert hat, wer es war (🤖 Add-on, ⚙️ Automation, 👤 Anna, ✋ am Gerät, 📶 Sensor) | ✅ (2026-10-28, Claude in der Demo) |
| 127.2 | Oben „⚠️ Fehler & offline“ antippen, dann „Alle“; „Wer“ auf „⚙️ Automationen“; einen Raum wählen; „küche“ suchen | Jedes Mal nur die passenden Zeilen (z. B. „Befehl an Rollladen Wohnzimmer ✗ nicht angenommen“, „Bewegungsmelder meldet sich nicht“) | ✅ (2026-10-28, Claude in der Demo) |
| 127.3 | Auf die Zeile „Heizung Wohnzimmer“ tippen | Rechts der Tag dieses Geräts: jetzt, Änderungen und Befehle, ein Balken über den Tag, die letzten Ereignisse, „📋 Nur dieses Gerät kopieren“, „🔎 Wird benutzt“; die Liste bleibt ganz, die Zeile ist markiert | ✅ (2026-10-28, Claude in der Demo) |
| 127.4 | „⬇ Exportieren“: einmal „Tabelle (.csv)“, einmal „Letzte 7 Tage“ als „Datei (.txt)“, einmal „Text“ | Die .csv öffnet sich in Excel mit Spalten (Datum, Zeit, Gerät, Entität, Raum, Was, Wer, Genauer); die .txt hat beide Tage; „Text“ sagt „✓ Kopiert“ | ✅ (2026-10-28, Claude in der Demo) |
| 127.5 | Im Add-on: als Admin „📜 Protokoll“, dann zu Hause ein Licht am Schalter an- und ausmachen, eins auf einer Seite des Add-ons | Beim Schalter steht „✋ am Gerät“, beim Tippen „🤖 Add-on · 👆 dein Name“ und dazu eine Zeile „📤 Befehl an … ✓ angenommen“ | ❓ |
| 127.6 | Im Add-on: eine deiner Automationen in Home Assistant laufen lassen, die ein Licht oder Thermostat schaltet | Die Zeile sagt „⚙️ Automation“ mit ihrem Namen (bei Geräten, die spät melden, vielleicht „✋ am Gerät“: dann sag es mir) | ❓ |
| 127.7 | Im Add-on: ein Fenster im Wohnzimmer FL öffnen, warten bis die Heizung aus ist | „🪟 Fenster … zu → offen“, „📤 Befehl an … „aus“ ✓“ mit „📋 Fenster offen“, dann das Thermostat „heizen → aus“ mit „🤖 Add-on … s nach dem Befehl“ | ❓ |
| 127.8 | Im Add-on: als Benutzer, der nicht bearbeiten darf (z. B. ein Wandtablet) | Kein Reiter „📜 Protokoll“ | ❓ |
| 127.9 | Fällt dir etwas auf: „⬇ Exportieren“ → „Text“ (oder „Letzte 7 Tage“) und im Chat einfügen | Claude sieht darin, was wann von wem geschaltet wurde | ❓ |

## 128. Neu in 4.41.0: Tür zwischen zwei Räumen zählt für die Heizung, Bad nicht mehr „von Hand gedreht“ (#583)
Gemeldet vom Besitzer am 2026-10-28 mit dem Bericht aus 🩺 Protokoll: „wen zwei räume anneinander sind wie wird dann die tür zugeordnet weil evtl soll sie auch für das andere zimmer zählen und das andere ist ein gang … warum geht das addon nicht richtig wenn türen und so aufgehen“. Seine Wahl: ein Schalter je Tür.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 128.1 | In der Demo: „Bearbeiten“, Erdgeschoss, die Tür Wohnzimmer-Küche antippen | Rechts unter „Aufschlag umkehren“ der Haken „Zählt für die Heizung“ mit „Offen → die Heizung der Räume daneben geht aus, wie bei einem Fenster.“ | ✅ (2026-10-28, Claude in der Demo) |
| 128.2 | Im Add-on: „Bearbeiten“, die Tür BAD ↔ Gang antippen, „Zählt für die Heizung“ einschalten, „Speichern“. Dann 🌡 Klima → 🩺 Protokoll, Raum BAD | Die Tür steht als „Tür (zählt: an der Tür eingestellt)“ und „zählt für die Fenster-Regel“ | ❓ |
| 128.3 | Im Add-on: die Bad-Tür offen lassen, länger als die Minuten der Fenster-Regel (bei dir 2 Min) | Die Heizung im Bad geht aus, die Karte sagt „🪟 Fenster offen“; Tür zu → die Heizung kommt wieder wie vorher | ❓ |
| 128.4 | Im Add-on: genauso an der Tür SZFA ↔ Gang (und an anderen Türen, die zählen sollen) | Wie 128.3 im Schlafzimmer FA | ❓ |
| 128.5 | Im Add-on: eine Tür ohne den Haken (z. B. WZFL ↔ SZFL) offen lassen | Die Heizung bleibt an; 🩺 Protokoll sagt „zählt nicht: Tür zwischen zwei Räumen (soll sie zählen: …)“ | ❓ |
| 128.6 | Im Add-on: wenn der Heizplan im Bad das nächste Mal umschaltet (abends oder morgens) | Kein „✋ Von Hand gedreht“ mehr im Bad; das Thermostat hat die Temperatur des Heizplans (nicht seine eigenen 24°) | ❓ |

## 129. Neu in 4.42.0: 🔥 Zu warm → Heizung runter, „Wer hat Vorrang?“ (#585)
Wunsch des Besitzers vom 2026-10-28: „wenn es zu warm ist das dann die heizung runter geht ka so 5 grad das es nicht die ganze zeit heizt wenn die temperatur im raum an ist“. Seine Wahl: 5° unter den Wunsch, ab 1° zu warm (Raumfühler, sonst das Thermostat), eigene Karte, „beachte die Prio von den ganzen Karten“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 129.1 | In der Demo: 🌡 Klima → 📋 Heiz-Regeln, die Karte „🔥 Zu warm → Heizung runter“ (gleich nach „Fenster offen“); bei „wenn der Raum wärmer ist um“ und „Thermostat tiefer um“ − und + tippen | Die Zahlen ändern sich, das Beispiel darunter auch (z. B. „Wunsch 17°, ab 18° im Raum geht das Thermostat auf 12° …“) | ✅ (2026-10-28, Claude in der Demo) |
| 129.2 | In der Demo: oben „ℹ️ Wer hat Vorrang?“ antippen | „🪟 Fenster offen → 🚀 Boost → 🔥 Zu warm → ✈️ Urlaub → ☀️ Sommerpause → 🚶 Keiner zu Hause → 📅 Heizplan → 🌙 Nachtabsenkung …“ | ✅ (2026-10-28, Claude in der Demo) |
| 129.3 | Im Add-on: die Karte „🔥 Zu warm“ einschalten. Ein Raum mit 🌡 Raumfühler, der 1° oder mehr wärmer ist als gewünscht (z. B. Wunsch 17°, Raum 18°) | Nach höchstens einer Minute steht das Thermostat 5° tiefer (12°); die Raum-Karte sagt „🔥 Zu warm (18° im Raum) · Thermostat 12°, bis wieder 17°“ | ❓ |
| 129.4 | Im Add-on: warten, bis der Raum wieder den Wunsch hat (17°) | Das Thermostat bekommt wieder 17°, die Zeile „Zu warm“ ist weg, kein „✋ Von Hand gedreht“ | ❓ |
| 129.5 | Im Add-on: während „Zu warm“ ein Fenster des Raums öffnen (länger als die Minuten der Fenster-Regel), dann wieder zu | Offen: die Heizung geht aus („Fenster offen“ geht vor); zu und noch zu warm: wieder 5° tiefer; zu und nicht mehr zu warm: wieder der Wunsch | ❓ |
| 129.6 | Im Add-on: 🌡 Klima → 🩺 Protokoll | Oben „🔥 Zu warm: an · ab 1° wärmer · Thermostat 5° tiefer“, im Protokoll beim Raum „🔥 Zu warm …“, wenn es anfängt, und der Heizplan, wenn es aufhört | ❓ |

## 130. Repariert in 4.42.1: die Reihenfolge der Heizung bleibt, auch wenn ein Thermostat spät meldet (#588)
Wunsch des Besitzers vom 2026-10-29: „die Reihenfolge der heizungsteureung muss stabiler sein und auch so das es da keine fehler gibt“. Ein langsames Thermostat zeigt nach einem Befehl noch ein paar Minuten den alten Wert; das Add-on hat danach entschieden. Jetzt rechnet es mit dem, was es geschickt hat.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 130.1 | Automatischer Test `tests/test_heatorder.py`: 300 zufällige Tage mit Fenster, Boost, zu warm, Heizplan, keiner zu Hause, Urlaubs-Alarm, Sommerpause, von Hand gedreht und Thermostaten, die nach Sekunden bis 10 Minuten melden | Jedes Mal gewinnt die richtige Regel, das Thermostat steht so, wie sie es will, bleibt nie ohne Grund aus, nichts geht hin und her (vorher gingen 87 bis 208 von 800 Tagen schief; in 9000 weiteren Tagen nur noch 2, mit Thermostaten, die für jede Meldung 2 bis 10 Minuten brauchen) | ✅ (2026-10-29, Claude, automatisch) |
| 130.2 | Im Add-on: ein Fenster öffnen, bis die Heizung „⏸️ pausiert“ zeigt, und gleich wieder schließen (am besten bei einem Thermostat, das langsam meldet) | Die Heizung kommt wieder (Modus heizen, die Temperatur von vorher oder vom Heizplan); sie bleibt nicht aus | ❓ |
| 130.3 | Im Add-on: in einem Raum 🚀 Boost antippen und nach ein paar Sekunden noch einmal (aus) | Das Thermostat geht wieder auf die Temperatur von vorher (oder vom Heizplan); es bleibt nicht auf der Boost-Temperatur | ❓ |
| 130.4 | Im Add-on mit Heizplan und „Keiner zu Hause“: ein Thermostat von Hand drehen, dann ein Fenster öffnen; während es offen ist, gehen alle weg und kommen wieder; Fenster zu | Das Thermostat bekommt die Temperatur des Heizplans, nicht die von Hand gedrehte von vorher | ❓ |
| 130.5 | Im Add-on: ein paar Tage normal heizen lassen, dann 🌡 Klima → 🩺 Protokoll | Keine Thermostate, die nach „Fenster offen“ oder „Boost“ aus bleiben oder auf der falschen Temperatur stehen; wenn doch: „📋 Bericht kopieren“ und im Chat einfügen | ❓ |

## 131. Neu in 4.43.0: ▶ Abläufe nach Räumen, zum Auf- und Zuklappen (#590)
Wunsch des Besitzers vom 2026-10-29: „ich hätte gerne hier eine gruppierung nach räumen in HA das man das direkt sieht ein und aus klappen kann … wenn man viele hat das das nicht so viel auf einmal ist“. Seine Wahl (Bilder in `docs/ideen-4.43/`): alle vier Listen, jedes in jedem Raum, den es benutzt, am Anfang alle zu, beide Ansichten umschaltbar, ohne Raum offen oben, „Alle auf- / zuklappen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 131.1 | In der Demo: ▶ Abläufe öffnen | Oben rechts „☰ Nach Listen“ (gewählt) und „🏠 Nach Räumen“; in „Knöpfe nach Räumen“, „Eigene Abläufe“, „Automationen in Home Assistant“ und „Szenen“ die Räume als Zeilen (Symbol, Name, Anzahl, die Namen dahinter), alle zu; „Filmabend“, „Guten Morgen“ und die Szene „Gute Nacht“ (ohne Raum) stehen offen oben | ✅ (2026-10-29, Claude in der Demo) |
| 131.2 | In der Demo: bei „Automationen in Home Assistant“ auf „Wohnzimmer“ tippen, dann noch einmal | Der Raum klappt auf (die vier Automationen), dann wieder zu; die anderen Räume bleiben zu | ✅ (2026-10-29, Claude in der Demo) |
| 131.3 | In der Demo: bei den Automationen auf die Räume schauen | „Urlaub: Licht zufällig“ (Lampen im Wohnzimmer und im Schlafzimmer) steht in beiden Räumen | ✅ (2026-10-29, Claude in der Demo) |
| 131.4 | In der Demo: über einer Liste „▾ Alle aufklappen“, dann „▸ Alle zuklappen“ | Alle Räume dieser Liste gehen auf, dann alle wieder zu | ✅ (2026-10-29, Claude in der Demo) |
| 131.5 | In der Demo: oben „🏠 Nach Räumen“, dann „Wohnzimmer“ antippen | Eine Karte „Nach Räumen“; das Wohnzimmer zeigt seine Knöpfe, eigenen Abläufe, Automationen und Szenen zusammen; oben „＋ Neuer Ablauf“, „📋 Aus Vorlage“, „＋ Neue Szene“ | ✅ (2026-10-29, Claude in der Demo) |
| 131.6 | In der Demo: die Seite neu laden | Die Ansicht „Nach Räumen“ bleibt, die Räume sind wieder zu | ✅ (2026-10-29, Claude in der Demo) |
| 131.7 | Im Add-on mit deinen Bereichen aus Home Assistant: ▶ Abläufe, beide Ansichten | Jede Automation und Szene steht im richtigen Raum (in jedem Raum, dessen Geräte sie benutzt); was keinen Raum hat, steht offen oben | ❓ |
| 131.8 | Im Add-on am Tablet und am Handy: umschalten, Räume auf- und zuklappen | Alles gut zu tippen, nichts ragt über den Rand, die Wahl bleibt auf dem Gerät | ❓ |

## 132. Repariert in 4.43.1: der Raumfühler nimmt keinen alten Wert mehr als Wunsch, 🔥 Zu warm merkt „von Hand gedreht“ (#592)
Bericht des Besitzers vom 2026-10-29 (Bild der Karte WZFL und 🩺 Bericht): „Ich glaube da ist noch immer was nicht so ganz richtig oder?“. Die Karte sagte „🔥 Zu warm · Thermostat 12°“, gewünscht waren aber 27°, und das Thermostat heizte auf 29,5°. Grund: das Thermostat hatte einen Wert nicht übernommen und zeigte seinen alten; den hielt das Add-on nach einer halben Stunde für einen Wunsch von jemand anderem.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 132.1 | Automatischer Test `tests/test_roomsensors.py`: deine Nacht nachgestellt (Zu warm 12°, das Thermostat übernimmt 46 Minuten lang nichts und zeigt weiter seinen alten Wert) | Der Wunsch bleibt 12°, das Add-on schickt nach 3 Minuten noch einmal (5 Mal), dann alle 10 Minuten; kein „neuer Wunsch“; dazu: ein Thermostat, das gerade eingeschaltet wurde oder wieder da ist, und dein gespeicherter Wunsch 27° (nach 5 Minuten wieder 12°) | ✅ (2026-10-29, Claude, automatisch) |
| 132.2 | Automatischer Test `tests/test_heatorder.py`: 300 zufällige Tage mit Raumfühler und einem Thermostat, das bis 60 % der Werte verliert | Kein Wunsch, den niemand gestellt hat, jede Regel wie sie soll (4.43.0: 211 von 300 Tagen falsch, jetzt keiner) | ✅ (2026-10-29, Claude, automatisch) |
| 132.3 | Im Add-on nach dem Update: 🌡 Klima, die Karte WZFL (ein paar Minuten warten) | Erst „🔥 Zu warm … · ✋ von Hand gedreht, ab … wieder 12°“, nach 5 Minuten Soll 12° (am Thermostat etwas mehr, z. B. 14,5°), die Heizung hört auf zu heizen | ✅ (2026-10-29, im Add-on: 17:29 nach dem Update „✋ von Hand gedreht, ab 17:34 wieder 19°“, um 17:34:33 von selbst Soll 19°, am Thermostat 20°) |
| 132.4 | Im Add-on am nächsten Morgen: 🌡 Klima → 🩺 Protokoll | Kein „↕ neuer Wunsch … von außen gestellt“, wenn niemand gedreht hat; höchstens „🌡 … noch einmal: das Thermostat hatte es nicht übernommen“; kein „✋ Von Hand gedreht“, das du nicht warst | ❓ |
| 132.5 | Im Add-on: während ein Raum „🔥 Zu warm“ zeigt, sein Thermostat am Gerät höher drehen | Die Karte zeigt „✋ von Hand gedreht, ab … wieder …“; nach deinen 5 Minuten geht es wieder runter | ❓ |
| 132.6 | Im Add-on: 📋 Heiz-Regeln, Karte 🔥 Zu warm | Eine Zeile „Von Hand gedreht: nach 5 Min wieder runter (wie im 📅 Heizplan)“ | ❓ |

## 133. Neu in 4.44.0: ✎ Bearbeiten: ausgeblendete Karten ganz weg, die Zeile „👁 Ausgeblendet“ (#595)
Wunsch des Besitzers vom 2026-10-29 (Bild von ☀ Heute in seiner Fassung „Eltern“): „wenn ich eine Karte ausblende, dass sie dann auch für mich wirklich weg ist und ich dann einfach sozusagen irgendwo eine Liste habe mit ausgeblendeten Elementen und dann wieder anhaken kann … weil sonst wird es echt schwierig, die richtig anzuordnen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 133.1 | In der Demo: ☀ Heute, unten ✎ Bearbeiten, bei „Termine“ das 👁 antippen | Die Karte ist sofort weg (nicht mehr blass); oben unter den Leisten die Zeile „👁 Ausgeblendet“ mit „☐ Termine“ | ✅ (2026-10-29, Claude in der Demo) |
| 133.2 | In der Demo: noch „Uhr“ und „Pinnwand“ ausblenden, dann eine andere Karte mit ⠿ an einen neuen Platz ziehen, dann in der Zeile „Termine“ antippen | Die Zeile zeigt die drei Karten beim Namen; nach dem Tipp ist „Termine“ wieder da, an seinem alten Platz, und steht nicht mehr in der Zeile | ✅ (2026-10-29, Claude in der Demo) |
| 133.3 | In der Demo: in der Zeile „Alle zeigen“ antippen | Alle Karten sind wieder da; die Zeile sagt „keine. 👁 an einer Karte blendet sie aus, dann steht sie hier.“ | ✅ (2026-10-29, Claude in der Demo) |
| 133.4 | In der Demo: 🌡 Klima, ✎ Bearbeiten, „＋ Neue Fassung“ (Kopie von „Für alle“), darin zwei Räume ausblenden, dann oben „👪 Für alle“ antippen | In der neuen Fassung sind die zwei Räume weg und stehen mit ihrem Namen in der Zeile; in „Für alle“ sind sie da und die Zeile ist leer | ✅ (2026-10-29, Claude in der Demo) |
| 133.5 | Im Add-on am Tablet: ☀ Heute, ✎, deine Fassung „Eltern“: Termine, Wer ist da und Pinnwand ausblenden, die übrigen Karten anordnen, „✓ Fertig“ | Beim Bearbeiten sieht die Seite schon so aus wie danach; nach „Fertig“ und am Tablet tablet_S2_WE (Fassung „Eltern“) steht alles genau so | ❓ |
| 133.6 | Im Add-on am Handy oder iPad: die Zeile „👁 Ausgeblendet“ mit mehreren Karten | Die Zeile bricht um, alles gut zu tippen, nichts ragt über den Rand | ❓ |

## 134. Neu in 4.45.0: 🎬 Szenen-Leiste und Karte 🎚️ „Lichtsteuerung“ (#597)
Wunsch des Besitzers vom 2026-10-29 (Bild von ☀ Heute auf dem iPad und Bild der slider-button-card „Light Control“): „über dieser Leiste, die wir da unten haben, … Szenen reinmachen, die man auch, wenn es mehrere Szenen sind, … scrollen kann“ und „diese Lichtkarte … mit diesem Schieberegler … dass man da Gruppen oder auch nur einzelne Lampen hinzufügen kann“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 134.1 | In der Demo (Live): unten über „Haus, Heute, Energie …“ schauen, am Handy die Leiste mit dem Finger seitwärts wischen | Eine Reihe Kacheln (Wohnzimmer gemütlich, TV-Abend, Filmabend …); „Wohnzimmer gemütlich“ hat einen kleinen Punkt (lief zuletzt); am Handy wischt sie seitwärts, der Rand läuft blass aus; die Seite darüber wird nicht verdeckt | ✅ (2026-10-29, Claude in der Demo, iPad und Handy) |
| 134.2 | In der Demo: „Wohnzimmer aus“ antippen | Die Kachel zeigt kurz ✓ grün, danach hat „Wohnzimmer aus“ den Punkt | ✅ (2026-10-29, Claude in der Demo) |
| 134.3 | In der Demo: ☀ Heute, in „Im Haus“ auf „💡 … Lichter an“ tippen | Das Fenster „Lichtsteuerung“ geht auf: je Lampe ein Balken in ihrer Farbe mit „45 %“, „Aus“, „Nicht verfügbar“ (Terrasse, grau), rechts Schalter, oben „Alle aus“ | ✅ (2026-10-29, Claude in der Demo) |
| 134.4 | In der Demo, im Fenster: „Küche Licht“ (aus) mit dem Finger oder der Maus nach rechts bis zur Mitte ziehen, loslassen; dann „TV“ kurz antippen | Beim Ziehen läuft die Zahl mit (z. B. „60 %“), nach dem Loslassen bleibt die Küche bei 60 % an; „TV“ geht aus | ✅ (2026-10-29, Claude in der Demo) |
| 134.5 | In der Demo, im Fenster: bei „Wohnzimmer“ das ▸ antippen | Darunter klappen die drei Lampen der Gruppe auf (Deckenlicht, Stehlampe, LED Sofa), jede mit eigenem Balken | ✅ (2026-10-29, Claude in der Demo) |
| 134.6 | In der Demo: Seite 🔘 Knöpfe, ✎ Bearbeiten: oben „🎬 Szenen-Leiste“, dann bei der Karte „Lichter“ das ⚙ | Fenster „Szenen-Leiste“: Haken „anzeigen“, „Gilt für“ (Alle Seiten oder eine Seite: Wie alle Seiten / Eigene Szenen / Keine Leiste), Kacheln mit Symbol, Name, Farbe, ⠿, ✕, Suche. Karte „Lichtsteuerung“: Lampen mit ⠿ und Suche, „Alle aus“, Gruppen aufklappbar, „Als Karte auf der Seite“ oder „Als Fenster (Popup)“ | ✅ (2026-10-29, Claude in der Demo) |
| 134.7 | Im Add-on am iPad: ✎ Bearbeiten auf ☀ Heute, „🎬 Szenen-Leiste“, deine Szenen (z. B. TV schauen, Wohnzimmer Hell, Esszimmer, Couch) hinzufügen, Namen und Symbole geben, „Speichern“; dann eine Szene antippen und eine gedrückt halten | Die Leiste steht über den Reitern, in der Reihenfolge, die du gezogen hast; der Tipp startet die Szene (✓), gedrückt halten öffnet das Fenster von Home Assistant; die zuletzt gestartete hat den Punkt | ❓ |
| 134.8 | Im Add-on am iPad: ✎, „＋ Karte hinzufügen“ → „Lichtsteuerung“, deine Lampen und eine Lichtgruppe dazu (auch eine Zigbee2MQTT-Gruppe), speichern; dann ziehen, tippen, halten | Balken in der Farbe der Lampe; ziehen stellt die Helligkeit erst beim Loslassen; eine Gruppe von Home Assistant hat ▸ mit ihren Lampen (eine Zigbee2MQTT-Gruppe bleibt ein Balken); eine Lampe, die nur schaltet, hat keinen Schieber | ❓ |
| 134.9 | Im Add-on am iPad: in der Karte „Als Fenster (Popup)“ und den Haken „Öffnet sich über „💡 … Lichter an““ setzen, speichern, „Fertig“; dann in „Im Haus“ auf „12 Lichter an“ tippen | Das Fenster „Lichtsteuerung“ geht auf; die Karte selbst steht nur beim Bearbeiten (mit „↗ Fenster“) auf der Seite | ❓ |
| 134.10 | Im Add-on am Handy: die Szenen-Leiste wischen, im Lichtfenster ziehen und die Seite hoch und runter scrollen | Wischen geht flüssig, ziehen seitwärts stellt die Helligkeit, hoch und runter scrollt die Seite (ohne eine Lampe zu ändern) | ❓ |

## 135. Neu in 4.46.0: 简体中文 Chinesisch als achte Sprache (#587)
Beitrag von aixmoyu (Pull Request #587, vom Stand 4.42.0); der Besitzer am 2026-10-29: „checke mal diesen pull request“, seine Wahl per Auswahl: „Ich übernehme ihn“. Claude hat ihn auf den heutigen Stand gebracht und die 83 neueren Texte übersetzt.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 135.1 | In der Demo: ⚙ → Allgemein → Sprache: „简体中文“ | Die ganze Oberfläche ist auf Chinesisch (Leisten, Reiter „今天“, Karten, Einstellungen), nirgends ein Schlüssel wie „sb.title“ | ✅ (2026-10-29, Claude in der Demo) |
| 135.2 | In der Demo, auf Chinesisch: ☀ 今天, die Szenen-Leiste und „💡 … 盏灯亮着“ (das Lichtfenster) | Auch die neuen Teile aus 4.43 bis 4.45 sind übersetzt („灯光控制“, „全部关闭“, „不可用“) | ✅ (2026-10-29, Claude in der Demo) |
| 135.3 | Ein Browser auf Chinesisch, Sprache „Auto“ | Die Seite kommt gleich auf Chinesisch | ✅ (2026-10-29, Claude in der Demo mit einem chinesischen Browser) |
| 135.4 | Im Add-on: ⚙ → Sprache auf „简体中文“ und gleich wieder auf „Deutsch“ | Alles wieder auf Deutsch, nichts bleibt chinesisch | ❓ |

## 136. Neu in 4.47.0: 🎚️ mehrere Lampen in einem Balken der Lichtsteuerung
Der Besitzer am 2026-10-30 mit einem Bild von „Karte „Lichtsteuerung“ einstellen“: „ich kann nicht pro Karte mehrere Lampen hinzufügen … pro Kachel einfach mehrere Lampen verknüpfen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 136.1 | In der Demo (Live): Seite 🔘 Knöpfe, Karte „Lichter“, ganz unten der Balken „✨ Voute“ | „Voute 60 %“ in Lila; ▸ klappt die zwei Lampen auf (Voute Bettseite, Voute Fensterseite, je 60 %) | ✅ (2026-10-30, Claude in der Demo) |
| 136.2 | In der Demo: „Voute“ kurz antippen, dann noch einmal | Erst gehen beide Lampen aus (der Balken grau, „Aus“), dann beide wieder an | ✅ (2026-10-30, Claude in der Demo) |
| 136.3 | In der Demo: ✎ Bearbeiten, bei der Karte „Lichter“ das ⚙; bei „Küche Licht“ auf „＋ Lampe dazu“, „wohn“ tippen, „Wohnzimmer Deckenlicht“ antippen, „Fertig“, Namen „Unten“ geben; dann bei einer Lampe des Balkens das ✕ | Unter „Küche Licht“ stehen die Lampen mit ✕, die Vorschau rechts zeigt „Unten“ mit ▸; nach dem ✕ ist die Lampe weg, der Name „Unten“ bleibt | ✅ (2026-10-30, Claude in der Demo) |
| 136.4 | Im Add-on am iPad: ✎ Bearbeiten, deine Karte „Lichtsteuerung“ ⚙, bei einem Balken „＋ Lampe dazu“ und zwei, drei Lampen eines Raums dazu, Namen geben, „Speichern“, „Fertig“ | Der Balken steht mit deinem Namen auf der Karte; an, wenn eine der Lampen an ist; ▸ zeigt die Lampen einzeln | ❓ |
| 136.5 | Im Add-on: den Balken aus 136.4 antippen, dann seitwärts auf etwa die Hälfte ziehen und loslassen | Der Tipp schaltet alle seine Lampen aus (bzw. an); nach dem Ziehen gehen alle auf etwa 50 % (eine Lampe, die nur schaltet, geht an) | ❓ |
| 136.6 | Im Add-on: oben in der Karte „Alle aus“ | Alle Lampen gehen aus, auch die in einem Balken mit mehreren Lampen | ❓ |

## 137. Neu in 4.48.0: ▦ „Frei anordnen“, die Karten einer Seite auf einem Gitter
Der Besitzer am 2026-10-30 mit einem Bild von 🔘 Knöpfe: „das man die karte platzieren kann wo man will … ein unsichtbares gitter im hintergrund … wenn ich will das eine karte unten rechts ist“. Seine Wahl nach den Beispielbildern `docs/ideen-4.48/`: je Seite einschaltbar, Breite und Höhe, eine andere Karte rutscht nach unten, am Handy untereinander.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 137.1 | In der Demo: Seite 🔘 Knöpfe, ✎ Bearbeiten, oben „▦ Frei anordnen“ | Der Knopf leuchtet, hinter den Karten zeigen sich blasse Felder (12 Spalten), die Karten stehen noch genau dort, wo sie vorher waren; „＋ Abschnitt“ ist weg | ✅ (2026-10-30, Claude in der Demo) |
| 137.2 | In der Demo: „Haustür“ am ⠿ ganz nach unten rechts ziehen und loslassen | Beim Ziehen leuchtet ein blaues Feld, wo sie einrastet; danach steht sie unten rechts, darüber bleibt die Lücke frei | ✅ (2026-10-30, Claude in der Demo) |
| 137.3 | In der Demo: bei „Küche“ die Ecke ↘ nach unten ziehen | Die Karte wird höher (der Knopf füllt sie), „Gute Nacht“ und die Karten darunter rutschen nach unten | ✅ (2026-10-30, Claude in der Demo) |
| 137.4 | In der Demo: „✓ Fertig“, dann die Seite am Handy (oder das Fenster ganz schmal) | Am PC/iPad stehen die Karten auf ihren Plätzen, das Gitter ist unsichtbar; am Handy untereinander, von oben links nach unten rechts | ✅ (2026-10-30, Claude in der Demo, PC, iPad hochkant, Handy) |
| 137.5 | In der Demo: ✎ Bearbeiten, „▦ Frei anordnen“ wieder antippen (aus), dann noch einmal (an) | Aus: die Karten rücken zusammen wie vorher; an: sie stehen wieder auf den Plätzen von eben | ✅ (2026-10-30, Claude in der Demo) |
| 137.6 | Im Add-on am iPad: ✎ auf deiner Seite 🔘 Knöpfe, „▦ Frei anordnen“, ein paar Karten verschieben (auch unten rechts) und größer/kleiner ziehen, „✓ Fertig“ | Alles bleibt dort, wo du es hingesetzt hast, auch nach dem Neuladen und auf einem anderen Gerät | ❓ |
| 137.7 | Im Add-on: eine Karte auf eine andere ziehen | Die andere rutscht nach unten, sonst bewegt sich nichts | ❓ |
| 137.8 | Im Add-on am Handy: dieselbe Seite ansehen | Die Karten stehen untereinander, nichts ist abgeschnitten oder überlappt | ❓ |

## 138. Neu in 4.50.0: 🪟 Vorhänge zur Seite und jeder Fensterflügel für sich (#606)
Ein Beitrag von aixmoyu (#606). Der Besitzer am 2026-10-31: „Schau dir mal #606 an“, dann „Ich übernehme ihn“. Die Felder stehen beim Bearbeiten im Seitenfenster eines Fensters: „Anzahl Flügel“ und „Fenster öffnet“ (je Flügel) unter „Ausführung“, „Vorhangart“ unter dem Haken „Vorhang / Rollladen“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 138.1 | In der Demo: ✎ Bearbeiten, Erdgeschoss, ein Fenster im Wohnzimmer antippen, Haken „Vorhang / Rollladen“, bei „Vorhangart“ „Nach links aufziehen“, als Entität `cover.wohnzimmer`; dann Live und das 🪟 am Fenster antippen | Innen hängt ein Vorhang an einer Stange, links zusammengeschoben, so weit der Rollladen offen ist; über dem Fenster „← … % offen“; die Karte heißt „Vorhang / Rollladen“ mit „Nach links aufziehen“, „Stopp“, „Nach rechts schließen“ | ✅ (2026-10-31, Claude in der Demo) |
| 138.2 | In der Demo: beim selben Fenster „Vorhangart“: „Mittig nach beiden Seiten“ | Zwei Vorhanghälften: offen an beiden Seiten zusammengeschoben, zu treffen sie sich in der Mitte; über dem Fenster „⇔“; die Karte hat „Mittig nach beiden Seiten“ und „Zur Mitte schließen“ | ✅ (2026-10-31, Claude in der Demo) |
| 138.3 | In der Demo: beim selben Fenster „Anzahl Flügel“ 3, bei „Flügel 1 · Fenster öffnet“ „Links angeschlagen“, bei Flügel 3 „Rechts angeschlagen“; unter „Einzelne Flügel“ jedem Flügel `binary_sensor.fenster_wohnzimmer` geben (meldet in der Demo „offen“) | Drei Felder, eins je Flügel; die offenen Flügel: Flügel 1 dreht sich um seine linke Kante, Flügel 3 um seine rechte Kante wie eine Tür in den Raum, Flügel 2 kippt oben nach innen | ✅ (2026-10-31, Claude in der Demo, mit ausgedachten Kontakten) |
| 138.4 | Im Add-on: ein Fenster mit deinem Rollladen ansehen und in Live bedienen | Alles wie vorher: der Rollladen fährt außen hoch und runter, über dem Fenster „↕ … % offen“, die Karte hat „Hoch“, „Stopp“, „Runter“ | ❓ |
| 138.5 | Im Add-on: ein Fenster, bei dem nur manche Flügel einen eigenen Kontakt haben (falls du so eins hast), Fenster öffnen | (seit 4.50.1) Ein Flügel mit eigenem Kontakt folgt diesem, ein Flügel ohne Kontakt dem Hauptkontakt des Fensters, wie vor 4.50.0; der Rahmen wird rot, und das Raum-Fenster zeigt jeden Flügel mit Kontakt | ❓ |
| 138.6 | Im Add-on: ein gekipptes Fenster in 3D ansehen (Kontakt meldet „offen“) | Der Flügel kippt in den Raum hinein, nicht nach außen | ❓ |
| 138.7 | Im Add-on, nur wenn du einen Vorhang mit Motor hast: ihm die passende „Vorhangart“ geben und in Live auf- und zufahren | Der Vorhang in 3D geht zur richtigen Seite auf (links und rechts so, wie man im Raum steht und hinausschaut) | ❓ |

## 139. Neu in 4.50.1: ein Fensterflügel kann „Fest“ sein, ein Flügel ohne Kontakt folgt wieder dem Hauptkontakt (#606)
aixmoyu hat #606 kurz vor dem Merge von 4.50.0 noch verbessert. Der Besitzer am 2026-10-31: „Ja, als 4.50.1“.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 139.1 | In der Demo: ✎ Bearbeiten, ein Fenster mit „Anzahl Flügel“ 3, bei „Flügel 2 · Fenster öffnet“ „Fest (öffnet nicht)“ | Flügel 2 hat unter „Einzelne Flügel“ kein Kontaktfeld mehr (dort steht „Flügel 2 · Fest (öffnet nicht)“); meldet der Hauptkontakt „offen“, gehen Flügel 1 und 3 auf, Flügel 2 bleibt zu | ✅ (2026-10-31, Claude im Test-Add-on) |
| 139.2 | In der Demo: Live, das 🪟 an einem Fenster mit Rollladen (ohne Vorhangart) antippen | Die Karte heißt „Rollladen“ (nicht „Vorhang / Rollladen“), mit „Hoch“, „Stopp“, „Runter“ | ✅ (2026-10-31, Claude im Test-Add-on) |
| 139.3 | Im Add-on: dein Dreifachfenster (falls du eins hast) mit festem Mittelteil: Flügel 2 auf „Fest“, dann das Fenster öffnen | Nur die Flügel, die wirklich aufgehen, drehen sich in 3D; der Mittelteil bleibt zu | ❓ |
