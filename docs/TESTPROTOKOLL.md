# Testprotokoll

Hier steht, was getestet wurde, wann und von wem. Der Besitzer testet in der **Demo-Datei** (`demo/floorplan3d-demo.html`, erfundene Daten, ohne Home Assistant). Die automatischen Tests laufen bei jeder Änderung.

Legende: ✅ geht · ❌ geht nicht · ❓ noch nicht getestet · ➖ in der Demo nicht prüfbar (nur im Add-on)

## Diese Woche noch prüfen (Stand 3.36.2)

**Neu: Abschnitt 23 ist ein Rundgang durch alle neuen Funktionen in der Demo.**

Das sind die Punkte, die nur der Besitzer im echten Betrieb prüfen kann. Nach Wichtigkeit geordnet, die Nummern verweisen auf die Tabellen unten. Ergebnis jeweils unten in der Tabelle eintragen (✅ / ❌).

1. **Nach dem Update auf 3.28.0** (Abschnitte 21 und 22): Versionsanzeige, Etagen auseinander, Backup-Panel, Ansichtsmenü unten, Halbschnitt, durchsichtige Wände, zweites Tippen im Live-Modus.
2. **Erster Start** (Abschnitt 20): auf einer sauberen Installation oder in einem privaten Fenster.
3. **Automatische Sicherung** (Abschnitt 18): vor allem 18.3 (Ordner `addon_configs`), 18.6 und 18.7 (zeitgesteuert, dauert eine Stunde) und 18.8 (Zurückspielen).
4. **Wandtablet** (Abschnitt 10 und 8.5): Kiosk, Leistungsmodus, Warnbanner. Nur mit echtem Gerät möglich.
5. **Backup und Speichern** (9.6, 9.7) und **Import des eigenen Hauses** (13.3 bis 13.5, 15.6, 12.6a).
6. **Kameras** (Abschnitt 6) und **Öffnungen gruppiert** (7.1a), falls Kameras vorhanden sind.
7. **Haus ohne Keller** (14.4) und **Demo mit Gauben** (16.4).

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
| 6.1 | Kamera-Gerät zeigt einen Sichtkegel am Boden (Sichtwinkel, Reichweite) | ❓ |
| 6.2 | Mit Bewegungssensor färbt sich der Kegel rot | ❓ |
| 6.3 | Knopf 📷 oben öffnet die Kameraübersicht | ❓ |

### 7. Türen, Fenster, Garage
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 7.1 | Tür oder Fenster in eine Wand setzen, Ausführung später ändern | ✅ im Add-on (2026-10-03) |
| 7.1a | Die Auswahl „Öffnung“ ist gruppiert (Türen / Durchgänge und Tore / Fenster) (Wunsch aus dem Test) | ❓ |
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
| 8.5 | Warnbanner (Rauch, Wasser, offenes Fenster bei Regen), Tippen springt in den Raum | ❓ |
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
| 9.6 | Backup herunterladen und wiederherstellen | ❓ |
| 9.7 | Automatisches Speichern, nach dem Neuladen ist alles noch da | ❓ |

### 10. Tablet und Bedienung
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 10.1 | Wandtablet mit ?kiosk=1 oder ?room=…: zeigt nur den Raum | ❓ |
| 10.2 | Zurück zur Startansicht nach einigen Minuten ohne Berührung | ❓ |
| 10.3 | Bildschirmschoner und Nachtabsenkung, die erste Berührung weckt nur | ❓ |
| 10.4 | Leistungsmodus: Automatisch / Schön / Schnell | ❓ |
| 10.5 | Benutzer sehen nur ihren Raum und ihre Ansicht | ❓ |

### 11. Benutzer & Tablets (3.20.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 11.1 | Oben in der Leiste gibt es den Knopf „Benutzer" (nur für Admins) | ✅ |
| 11.2 | Im Zahnrad (⚙) ist der Abschnitt „Benutzer & Tablets" nicht mehr | ✅ |
| 11.3 | Benutzer hinzufügen, Raum und Ansicht wählen, wird gespeichert | ✅ |
| 11.4 | Unter dem Dialog steht, ob Datei und Add-on gleich sind | ✅ |
| 11.4a | Knopf „💾 Datei erstellen / speichern“ legt `users.json` an, auch wenn es sie noch nicht gibt | ✅ ab 3.22.0 im Add-on: das Design bleibt unverändert (vorher schaltete der Klick auf Hologramm, #100) |
| 11.5 | „↻ Synchronisieren" liest `users.json` und übernimmt die Benutzer | ✅ |
| 11.6 | Nach einem Update/Neuinstallation sind Benutzer und Tablets wieder da | ➖ |

### 12. Dachgauben (3.21.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 12.1 | Dachstuhl wählen → Abschnitt „Dachgauben" mit „+ Gaube" | ✅ (3.23.0, im Add-on) |
| 12.2 | Eine Gaube erscheint in 3D auf dem Dach, mit Fenster | ✅ (3.23.0, im Add-on) |
| 12.3 | Seite A/B, Position, Breite, Höhe, Abstand zur Traufe lassen sich ändern | ✅ (3.23.0, im Add-on) |
| 12.4 | Gaube mit Satteldach und mit Flachdach | ✅ (3.23.0, im Add-on) |
| 12.5 | Gaube entfernen (×) | ✅ (3.23.0, im Add-on) |
| 12.6 | Bei Flachdach erscheint ein Hinweis statt der Gauben | ✅ (3.23.0, im Add-on) |
| 12.6a | JSON-Import mit `roof.dormers` (docs/examples/house.json hat zwei Gauben) zeigt Gauben auf dem Dach | ❓ |
| 12.7 | Nach dem Neuladen sind die Gauben noch da (nur im Add-on, Demo speichert nicht) | ✅ (3.23.0, im Add-on) |

### 13. Import eines Hauses mit Keller, Anbau und Dachgeschoss
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 13.1 | JSON-Import (Prüfen, dann Importieren) läuft ohne Fehler und ohne Warnungen durch | ✅ |
| 13.2 | Es entsteht ein neues Haus mit allen Etagen (Keller, Erdgeschoss, Obergeschoss, Dachgeschoss) | ✅ |
| 13.3 | Räume, Türen und Fenster liegen an den richtigen Stellen | ❓ |
| 13.4 | Das bestehende Haus bleibt unverändert, Umschalten über die Hausauswahl geht | ❓ |
| 13.5 | Treppen fehlen beim Import und lassen sich im Editor zeichnen | ❓ |

### 14. Erdreich unter Anbauten ohne Keller (Fehler #93)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 14.1 | Gesamtansicht, Kamera so drehen, dass der Erdschnitt sichtbar ist | ✅ (3.22.0, im Add-on) |
| 14.2 | Unter einem Anbau ohne Keller (z. B. Garage) ist kein Hohlraum im Boden, darunter ist Erde | ✅ (3.22.0, im Add-on) |
| 14.3 | Der Keller wird im Schnitt weiterhin richtig angezeigt | ✅ (3.22.0, im Add-on) |
| 14.4 | Ein Haus ohne Keller zeigt weiterhin den Boden ohne Schnitt | ❓ |

### 15. Dachgröße von Hand (3.22.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 15.1 | Im Panel des Dach-Stockwerks gibt es den Haken „Größe selbst festlegen" | ✅ |
| 15.2 | Mit dem Haken erscheinen Links, Oben, Breite und Tiefe, das Dach ändert sich sofort in 3D | ✅ |
| 15.3 | Das Dach lässt sich so verkleinern, dass der Anbau (Garage) nicht mehr darunter liegt | ✅ |
| 15.4 | Haken entfernen: die Größe ist wieder automatisch | ✅ |
| 15.5 | Nach dem Neuladen bleibt die Größe erhalten (nur im Add-on) | ✅ |
| 15.6 | JSON-Import mit `roof.box` | ❓ |

### 16. Wiederholung der drei Fehler (3.22.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 16.1 | Pfeiltasten ohne Auswahl wechseln die Etage, mit Auswahl verschieben sie das Objekt (#98) | ✅ |
| 16.2 | Schalter „Etagen im Plan" im Menü „Ansicht": in reinem 3D nicht da, in 2D und 2D+3D da (#99) | ✅ |
| 16.3 | „Datei erstellen / speichern" ändert das Design nicht (#100) | ✅ |
| 16.4 | Demo mit zwei Dachgauben im Beispielhaus | ❓ |

### 17. Werkzeugleiste anpassen und Raumliste nach Haus (3.23.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 17.1 | Knopf ✎ am Ende der Werkzeugleiste öffnet „Werkzeuge anpassen" | ✅ |
| 17.2 | Werkzeuge ausblenden, umsortieren (▲ / ▼) und ins Menü „Mehr ▾" einklappen | ✅ |
| 17.3 | Die Auswahl bleibt nach dem Neuladen erhalten | ✅ |
| 17.4 | „Auswählen" lässt sich nicht ausblenden, „Zurücksetzen" stellt den Standard wieder her | ❓ (automatisch geprüft, nicht von Hand) |
| 17.5 | Knopf „Gauben" springt zum Dach-Stockwerk und zum Abschnitt Dachgauben | ✅ |
| 17.6 | Knopf „Haus importieren" liegt standardmäßig im Menü „Mehr" | ✅ |
| 17.7 | Benutzer & Tablets: Raumliste nach Haus gruppiert, mit Etage dahinter | ✅ |

### 18. Automatische Sicherung (3.24.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 18.1 | „Häuser & Backup“ zeigt den Abschnitt „Automatische Sicherung“ | ❓ |
| 18.2 | „Jetzt sichern“ legt eine Datei an, sie steht in der Liste (Art „von Hand“) | ❓ |
| 18.3 | Die Datei liegt im Ordner `addon_configs/…_floorplan3d/backups` | ❓ |
| 18.4 | „Neueste prüfen“ meldet, wie viele Häuser, Bilder und Modelle die Sicherung enthält | ❓ |
| 18.5 | „Automatisch sichern“ einschalten, Abstand, Tage und Anzahl einstellen, nach dem Neuladen stehen die Werte noch | ❓ |
| 18.6 | Mit kurzem Abstand (1 Stunde) entsteht nach der Zeit eine automatische Sicherung (Art „automatisch“) | ❓ |
| 18.7 | Alte automatische Sicherungen werden nach den eingestellten Tagen / der Anzahl gelöscht, die neueste und die von Hand bleiben | ❓ |
| 18.8 | „Zurückspielen“ ersetzt Häuser und Einstellungen durch die Sicherung, die Seite lädt neu | ❓ |
| 18.9 | Herunterladen (⬇) und Löschen (×) in der Liste | ❓ |
| 18.10 | Der Schalter „Auto“ im Menü „Ansicht“ lässt die anderen Einstellungen unverändert (Design bleibt) | ❓ |

### 19. Version und Prüfsumme in der Leiste (3.25.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 19.1 | Oben rechts steht die Version mit kurzer Prüfsumme, zum Beispiel „✓ v3.25.0 · a1b2c3d“ | ❓ |
| 19.2 | Die Anzeige ist grün, wenn Add-on und Browser zur Prüfsumme passen | ❓ |
| 19.3 | Ein Klick öffnet die Einzelheiten (Version, Prüfsumme, Add-on, Browser) | ❓ |
| 19.4 | „Jetzt prüfen (auch mit GitHub)“ meldet: gleicher Stand / neuere Version / anderer Stand | ❓ |
| 19.5 | Nach einem Update zeigt sie die neue Version; zeigt der Browser noch alte Dateien, ist sie orange und „Neu laden“ hilft | ❓ |

### 20. Erster Start (3.26.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 20.1 | Auf einer Neuinstallation folgt die Oberfläche der Browsersprache (Einstellung „Auto") | ❓ |
| 20.2 | Das Design ist standardmäßig „Dunkel" | ❓ |
| 20.3 | Ein leeres Haus zeigt die Willkommenskarte mit drei Knöpfen | ❓ |
| 20.4 | „Wände zeichnen" schließt die Karte und wählt das Wand-Werkzeug (2D + 3D) | ❓ |
| 20.5 | „Beispielhaus ausprobieren" legt ein neues Haus an und öffnet es | ❓ |
| 20.6 | „Haus aus JSON importieren" öffnet den Importdialog | ❓ |
| 20.7 | Die Etage heißt je nach Sprache „Ground floor", „Erdgeschoss" und so weiter | ❓ |
| 20.8 | Bestehende Installationen behalten Sprache und Design | ❓ |

### 21. Neu in 3.26.1 bis 3.27.1

| Nr. | Prüfpunkt | Ergebnis |
| --- | --- | --- |
| 21.1 | Etagen auseinander (Ganzes Haus, „auseinander"): jede Etage hat ihre Lücke, auch das Erdgeschoss hebt sich vom Keller ab (#146) | ✅ (Besitzer, 3.26.1) |
| 21.2 | Versionsanzeige: im Fenster steht „Browser: zeigt genau diese Dateien", auch bei `http://` (#144) | ❓ |
| 21.3 | Einstellungen ⚙ zeigt das Kästchen „Alle 5 Minuten bei GitHub nachsehen …" (#140) | ❓ |
| 21.4 | Sobald es eine neuere Version gibt, wird die Anzeige im Bearbeiten-Modus nach spätestens 5 Minuten blau: „⬆ Neue Version verfügbar" (#140) | ❓ (erst bei der nächsten Version prüfbar) |
| 21.5 | Backup-Panel: die Beschriftungen der Zahlenfelder stehen über den Feldern, nicht in einer schmalen Spalte | ❓ |
| 21.6 | Im Protokoll des Add-ons steht beim Start „Starting 3D Floorplan on port 8099 ..." | ❓ |

### 22. Ansicht und Live-Bedienung (3.28.0)

| Nr. | Prüfpunkt | Ergebnis |
| --- | --- | --- |
| 22.1 | Der Knopf „Ansicht" steht unten bei Normal / Temp. / Feuchte / CO₂, sein Menü öffnet sich nach oben (#132) | ❓ |
| 22.2 | Auf dem Handy und Tablet ist unten nichts verdeckt, alle Knöpfe sind erreichbar | ❓ |
| 22.3 | „Halbschnitt": Deckenlampen, LED-Ringe und hoch hängende Bilder verschwinden mit, nichts schwebt über den Wänden (#131) | ❓ |
| 22.4 | Halbschnitt wieder aus: alles ist wieder da | ❓ |
| 22.5 | Einstellungen ⚙ „Wände zur Kamera durchsichtig machen statt absenken": die Wände zur Kamera werden leicht durchsichtig, man sieht den Raum (#129) | ❓ |
| 22.6 | Beim Drehen der Kamera wechseln die durchsichtigen Wände mit (von hinten normal) | ❓ |
| 22.7 | Option aus: die Wände senken sich wie bisher | ❓ |
| 22.8 | Live-Modus: Tippen in einen Raum zoomt hinein, ein zweites Tippen in den Raum geht zurück zur Ansicht davor, zum Beispiel zur Etage (#128) | ❓ |
| 22.9 | Das gilt auch aus der Ganzes-Haus-Ansicht: zurück zeigt wieder das ganze Haus | ❓ |

## 23. Demo-Rundgang für 3.29 bis 3.36 (Besitzer)

Alles lässt sich in der Demo im Browser prüfen: https://burned4aim.github.io/HA-Floorplanner/ . Ergebnis jeweils eintragen (✅ / ❌). Die Demo hat dafür eine Heizung mit Zieltemperatur, ein Stromnetz (Hausanschluss, Zähler, Zählerkasten, Wechselrichter, drei Solarmodule im Garten, rechts neben der Garage) und eine Küchenzeile.

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 23.1 | Version oben anschauen | zeigt 3.36.x mit grünem Haken | |
| 23.2 | Live: Wohnzimmer antippen | Raum-Panel und daneben das **Heizungs-Panel** (21,2 °C, Ziel 22 °C, „heating") | |
| 23.3 | Im Heizungs-Panel zweimal „+" | Ziel springt auf 23, nach einer kurzen Pause wird gesetzt; „Off" macht die Anzeige grau, Heizkörper links glüht nur bei „heating" | |
| 23.4 | Ansicht ▴ → „Durchsichtig", dann „Auto" | die beiden schließen sich gegenseitig aus; Wände werden durchsichtig, Dach auch von weitem | |
| 23.5 | Haus von allen Seiten drehen, unten Kompass ansehen | Kompass dreht mit, jede Außenwand der Erdgeschoss-Seite zur Kamera senkt sich ab | |
| 23.6 | Bearbeiten: Dachgeschoss öffnen, Gaube setzen | Dach bleibt gut sichtbar, nicht fast unsichtbar | |
| 23.7 | Bearbeiten: Dachgeschoss → „Weitere Dächer" → „+ Weiteres Dach", Form „Flach", Etage „Erdgeschoss" | ein eigenes Dach über dem Anbau, tiefer als das Hauptdach | |
| 23.8 | Küche ansehen (3D und 2D) | Küchenzeile aus Modulen (Unterschrank, Spüle, Geschirrspüler, Herd, Kühlschrank) mit Oberschränken | |
| 23.9 | Küchenzeile anklicken → Form „L-Form", „+ Modul", ein Modul mit ↑/↓ verschieben, „×" | zweiter Schenkel erscheint, Module ändern sich in 2D und 3D | |
| 23.10 | Werkzeug „Tür/Fenster", in ein sehr kurzes Wandstück klicken | Öffnung wird kleiner gemacht statt abgelehnt (mind. 10 cm) | |
| 23.11 | Unten „Strom" antippen (Knopf neben CO₂) | orange/grüne Kabel mit fließenden Punkten und Watt-Zahlen (z. B. 1100 W an den Solarmodulen, 3,20 kW am Wechselrichter) | |
| 23.12 | Werkzeugleiste „Strom-Editor" | nur Strom-Sachen sichtbar und anklickbar, alles andere ausgeblendet; Bibliothek zeigt Kategorie „Strom" | |
| 23.13 | Strom-Editor: Werkzeug „Kabel", ein Stromgerät, dann ein anderes anklicken | neues Kabel; an einem Gerät lassen sich mehrere Kabel haben | |
| 23.14 | Stromgerät anklicken → Eigenschaften: Verlauf „Am Boden entlang" / „Durch den Boden" / „Frei in der Luft", „×" | Kabel ändert den Weg, „×" löscht es; unten steht „Kommt von: …" | |
| 23.15 | 2D-Ansicht im Strom-Editor | orange Linien zwischen den Geräten | |
| 23.16 | Kamera im Wohnzimmer ansehen | Sichtkegel; rot mit „Bewegung", wenn der Bewegungsmelder an ist (in der Demo ist er an) | |
| 23.17 | Haus → Grundriss importieren → Export | Strom-Kabel, Küchenzeile und weitere Dächer überleben Export und erneuten Import | |

**Hinweis zur Kamera und Bewegung:** Der Sichtkegel mit Bewegungsanzeige ist im echten Add-on genauso vorhanden wie in der Demo. Die Demo liefert nur Beispielwerte. Im echten Haus wählst du bei der Kamera in den Eigenschaften „Bewegungsmelder" aus (ein `binary_sensor`), dann färbt sich der Kegel rot.

## Automatisch geprüft (zusätzlich)
- Python: Benutzer werden in `users.json` gespiegelt; Synchronisieren lädt/speichert; frische Installation holt sich Benutzer aus der Datei zurück.
- Browser-Test: Benutzer-Reiter sichtbar für Admins, versteckt für Nur-Lese-Benutzer; nicht mehr im Zahnrad; Tablet speichern; Synchronisieren.

## 24. Treppen: mehrere Etagen, Wandtreppe, Außen-Wendeltreppe (3.40.x)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 24.1 | Bearbeiten, Werkzeug „Treppe" → Typ „Wandtreppe", Feld „Etagen" auf 2 | Hinweis „Weiter an der Wand entlang klicken …" | |
| 24.2 | In der 2D-Ansicht an einer Wand entlang klicken, an der Ecke weiter an der nächsten Wand, zuletzt **Enter** (oder Doppelklick) | Eine Treppe entsteht; ihr Weg liegt genau auf der Wandfläche, in der Ecke ist ein **Podest**; „Esc" bricht ab | |
| 24.3 | 3D ansehen | Dünne Stufenplatten an der Wand, darunter frei; Podest in der Ecke | |
| 24.4 | Eine Etage höher und zwei höher schauen | In jeder Etage, durch die die Treppe geht, ist die Aussparung im Boden (orange gestrichelt), dort darüber nicht mehr | |
| 24.5 | Treppe anklicken → Eigenschaften: „Etagen" auf 1 stellen | nur noch die Etage direkt darüber hat die Aussparung | |
| 24.6 | Treppe anklicken, das weiße Quadrat am Rand der Stufen ziehen | Breite ändert sich | |
| 24.7 | „Stufen nach" links/rechts umstellen | Die Stufen stehen auf der anderen Seite des Wegs | |
| 24.8 | Wandtreppe mit **zwei Knicken** zeichnen (U-förmiger Weg, Podest dazwischen) | Zwei Podeste, die Stufen verteilen sich nach Länge der Abschnitte | |
| 24.9 | Typ „Wendel", „Etagen" auf 2, im Garten neben dem Haus platzieren | Wendeltreppe mit zwei Umdrehungen (eine pro Etage), kein Treppenhaus drumherum | |
| 24.10 | „Gerade", „L" oder „U" mit „Etagen" 2 | Eine lange Treppe über zwei Etagen | |
| 24.11 | Alte Treppen im bestehenden Haus ansehen | Unverändert (Etagen = 1) | |
| 24.12 | Haus → „Dieses Haus als JSON exportieren“, Datei ansehen | Treppen stehen mit `"type": "wall"`, `"floors"` und `"path"` in der Datei, ebenso Blöcke und Bodenöffnungen (3.40.1) | |
| 24.13 | Diese Datei wieder importieren (neues Haus) | Die Treppen sind genauso wieder da | |

## 25. Solarpanels auf dem Dach (3.41.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 25.1 | Bearbeiten, Etage „Dach“ öffnen (gibt es keine: im Etagen-Panel „+ Dach“) | Das Dach ist zu sehen | |
| 25.2 | Aus der Bibliothek (Strom) ein **Solarpanel** auf eine Dachseite setzen | Das Panel liegt flach auf der Dachfläche, schräg wie das Dach, ohne Ständer | |
| 25.3 | Das Panel verschieben, z. B. Richtung Dachrinne oder auf die andere Dachseite | Es bleibt auf dem Dach und kippt auf der anderen Seite mit | |
| 25.4 | Eigenschaften: „Panels nebeneinander“ 4, „Reihen“ 2 | Ein Feld aus 8 Panels mit Montageschienen | |
| 25.5 | Das Panel drehen (Drehung in den Eigenschaften) | Es bleibt flach auf dem Dach liegen | |
| 25.6 | Im Etagen-Panel die Dachform auf „Flachdach“ stellen | Die Panels stehen aufgeständert (schräg zur Sonne) oben auf dem Flachdach | |
| 25.7 | „Montage“ auf „Flach auf dem Dach“ bzw. „Aufgeständert“ | Das Panel liegt flach bzw. steht auf Ständern | |
| 25.8 | Ein Solarpanel in einer normalen Etage (Garten) | Wie bisher auf einem Ständer am Boden; in den Eigenschaften steht, wie man es aufs Dach legt | |
| 25.9 | Haus → Export, Datei ansehen und wieder importieren | `cols`, `rows`, `mount` stehen in der Datei und sind nach dem Import wieder da | |

## 26. Wasser-, Gas- und Wärmezähler (3.42.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 26.1 | Bearbeiten, Bibliothek, im Suchfeld „zähler“ eingeben | Stromzähler, Wasserzähler, Gaszähler, Wärmemengenzähler | |
| 26.2 | Einen Wasserzähler in den Keller setzen | Blauer Zähler mit runder Anzeige auf einem Messingrohr | |
| 26.3 | Gaszähler und Wärmemengenzähler an eine Wand setzen | Beiger Gaszähler mit Zählwerk; kleiner weißer Wärmezähler mit rotem und blauem Rohr | |
| 26.4 | Beim Zähler in den Eigenschaften den passenden Sensor wählen (z. B. `sensor.wasserzaehler`) | Über dem Zähler steht der Stand, z. B. „🚰 1234.6 m³“, „🔥 845.2 m³“, „♨ 5321 kWh“ | |

## 27. Metallbrücke / Übergang (3.43.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 27.1 | Bearbeiten, obere Etage öffnen, Bibliothek „Außen“ → „Brücke / Übergang“ zwischen zwei Gebäudeteile setzen | Eine 3 m lange Metallbrücke mit Gitterboden und Geländer auf beiden Seiten, auf Höhe der Etage | |
| 27.2 | Mit „Drehung“ ausrichten, in den Eigenschaften „Länge“ und „Breite“ ändern | Die Brücke wird länger / breiter, das Geländer passt sich an | |
| 27.3 | Haken „Geländer“ wegnehmen | Nur noch Boden und Träger | |
| 27.4 | Haus → Export und wieder importieren | `len`, `w`, `noRail` stehen in der Datei und sind wieder da | |

**Hinweis:** Zwischen zwei **getrennten** Häusern (zwei Grundrisse in der Häuser-Liste) geht das noch nicht, weil das Programm nicht weiß, wie die Häuser zueinander liegen. Innerhalb eines Grundrisses (Haupthaus und Anbau) funktioniert es.

**Nachtest 3.43.5:** 25.6 bis 25.8 (Ständer enden unter dem Panel; auf dem Schrägdach reichen sie bis aufs Dach), 26.1 bis 26.4 und 27.1 bis 27.4 (Zähler und Brücke sichtbar). Ist der Strom-Editor an und du setzt etwas anderes als ein Stromgerät oder einen Zähler, schaltet er sich aus, und unten steht ein Hinweis.

**Nachtest 3.43.6 (24.9, #209):** Die Wendeltreppe hat eine Stange in der Mitte, dünne Stufen ohne etwas darunter und einen Handlauf außen.

**Neu in 3.43.7 (#215):** Pille „n offen“ antippen und einen Eintrag wählen: Die Kamera fliegt zum Fenster bzw. zur Tür, und ein Ring zeigt die Stelle (wie bei der Suche). Genauso bei der Liste „offline“ und bei „Im Plan zeigen“ in der Kamera-Übersicht.

**Neu in 3.43.8 (#212):** In der Ansicht „2D + 3D“ ist oben rechts im Plan der Knopf „↻ Plan dreht mit“. Ist er an und du drehst die 3D-Ansicht, dreht sich der Plan mit: oben ist immer die Blickrichtung. Die Schrift bleibt lesbar, Klicken und Zeichnen funktionieren weiter. Ein zweiter Druck stellt den Plan wieder gerade.

**Neu in 3.43.9 (#211):** Ein Ding anklicken, dann mit gedrückter **Shift-Taste** weitere anklicken (im 2D-Plan und in 3D). Alle Ausgewählten haben einen grünen Rahmen, rechts steht „n ausgewählt“ mit dem Knopf „Alle n löschen“. **Entf** löscht alle, **Strg+Z** holt sie mit einem Schritt zurück, **Esc** hebt die Auswahl auf. Shift + Klick auf ein schon ausgewähltes Ding nimmt es wieder heraus.

**Neu in 3.43.10 (#210, zu 24.1, 24.2, 24.8):** Wandtreppe anklicken, dann im Feld **„Podest nach dem Knick“** z. B. 1 m eintragen: Nach jeder Ecke bleibt die Treppe 1 m auf einer Ebene, erst danach kommen wieder Stufen. **Podest einzeln:** Beim Zeichnen des Wegs mitten auf einer geraden Strecke einmal zusätzlich klicken: Dort entsteht ein flaches Podest, danach geht die Treppe weiter.

## 28. Nachbarhaus und Brücke zur Dachterrasse (3.44.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 28.1 | Im ersten Haus: Bearbeiten → „Häuser & Backup“ aufklappen → „+ Nachbarhaus“ | Eine Karte mit Haus, Lage X, Lage Z, Drehung, Höhe erscheint; das andere Haus steht in 3D da | |
| 28.2 | Lage X / Z (und falls nötig Drehung) so einstellen, dass das Nachbarhaus wie in echt steht | Es rückt an die richtige Stelle | |
| 28.3 | „Ganzes Haus“ | Beide Häuser sind ganz zu sehen; die Dachterrasse des Nachbarhauses hat ein Geländer | |
| 28.4 | Ins 1. OG wechseln, Ansicht „2D + 3D“ | Im Plan ist der Umriss des Nachbarhauses auf dieser Höhe lila gestrichelt | |
| 28.5 | Die Brücke (Bibliothek „Außen“) im 1. OG zwischen beide Häuser setzen, drehen und Länge einstellen | Sie führt vom eigenen 1. OG auf die Dachterrasse | |
| 28.6 | Zum Nachbarhaus wechseln (Häuser-Liste) | Es lässt sich dort ganz normal bearbeiten; zurück im ersten Haus ist die Änderung nach dem Neuladen zu sehen | |
| 28.7 | „Nachbarhaus entfernen“ | Es verschwindet wieder | |
| 28.8 | Das 1. OG des Nachbarhauses liegt höher/tiefer: beim Nachbarhaus „Höhe“ z. B. 0,40 eintragen, bei der Brücke „Höhenunterschied am Ende“ ebenfalls 0,40 | Die Terrasse rückt hoch, die Brücke steigt gleichmäßig zu ihr an; im Plan zeigt der lila Pfeil auf das Ende mit „+0,40 m“ (3.44.1) | |

**Jetzt auch in der Demo (3.44.2):** Die Demo hat zwei Häuser. Neben dem Demo-Haus steht das „Nachbarhaus“ (oben in der Häuser-Auswahl), sein 1. OG liegt 0,40 m höher. Von der Dachterrasse des Demo-Hauses führt schon eine Brücke mit „+0,40 m“ hinüber, das Geländer ist an beiden Enden offen. So lassen sich 28.3 bis 28.8 direkt im Browser ausprobieren. Bei 28.6 gilt: Die Demo speichert nichts, nach dem Neuladen ist alles wieder wie am Anfang. Außerdem neu im Demo-Haus: Wasser-, Gas- und Wärmezähler im Keller (26), 10 Solarpanels auf dem Dach (25), eine Wendeltreppe von der Garage hoch auf die Dachterrasse (24.9). Im Nachbarhaus gibt es eine Wandtreppe mit Podest nach dem Knick (24.1, 24.8).

## 29. Treppenhaus, Podest an der Wende, Ausgang auf jeder Etage (3.45.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 29.1 | Bearbeiten, Werkzeug „Treppe“ → „Treppenhaus“, „Etagen“ auf 2, im Plan klicken | Vier Wände mit Raum „Treppenhaus“; vor der Treppe ein Podest, dort die Tür. Dasselbe (Wände, Raum, Tür) auch in den beiden Etagen darüber | |
| 29.2 | 3D ansehen | Auf jeder Etage kommt die U-Treppe an, man kann aufs Podest aussteigen; danach geht es mit der nächsten U-Treppe weiter nach oben | |
| 29.3 | U- oder L-Treppe setzen, in den Eigenschaften „Podest nach dem Knick“ z. B. 0,8 | Das Podest an der Wende wird 0,8 m tiefer, der zweite Lauf rückt weiter | |
| 29.4 | Gerade Treppe mit „Etagen“ 2 | Zwei Läufe übereinander, auf der Etage dazwischen kommt man an (nicht mehr ein langer Lauf) | |
| 29.5 | Haus → Export und wieder importieren | `landing` bleibt bei L- und U-Treppen erhalten | |
| 29.6 | Treppenhaus mit „Etagen“ 2 im Keller setzen, nur den Keller ansehen (nicht „Ganzes Haus“) | Nur der Teil bis zur nächsten Etage ist zu sehen, nichts schwebt darüber; im EG kommt die Treppe an und geht weiter (3.45.1) | |
| 29.7 | Wandtreppe um eine Ecke zeichnen und an der Ecke zweimal knapp hintereinander klicken, „Podest nach dem Knick“ 1 | An der Ecke ein ebenes Podest ohne Stufe dazwischen, die Treppe geht erst danach weiter (3.45.1) | |
| 29.8 | Wendeltreppe (in der Demo: von der Garage auf die Dachterrasse) von oben ansehen | Nach der letzten Stufe ein Viertelkreis-Podest auf Bodenhöhe bis zum Rand der Öffnung, dort steigt man aus; mit der Drehung zeigt es in die gewünschte Richtung (3.45.1) | |

## 30. Live-Modus: weniger aus Versehen antippen (3.45.1)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 30.1 | Live-Modus, auf eine Anwesenheits-Figur tippen | Nichts passiert (kein Fenster), ein Tipp daneben trifft den Raum | |
| 30.2 | Live-Modus, in den roten/blauen Sichtkegel einer Kamera tippen | Die Kamera öffnet sich nicht; ein Licht oder der Raum darunter wird getroffen | |
| 30.3 | Live-Modus, direkt auf die Kamera tippen | Das Kamera-Fenster öffnet sich wie bisher | |
| 30.4 | Live-Modus, auf einen Temperatur- oder CO₂-Sensor tippen (3.46.0) | Nichts passiert; ein Thermostat lässt sich weiter antippen | |

## 31. Treppen über mehrere Etagen, Zähler in der Übersicht (3.46.0)

| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 31.1 | Wandtreppe mit „Etagen“ 2 zeichnen | Dieselbe Wandtreppe noch einmal eine Etage höher; auf der Etage dazwischen kommt sie an (kein langer Lauf mehr) | |
| 31.2 | Wendeltreppe mit „Etagen“ 2 | Pro Etage eine Umdrehung, auf jeder Etage ein Viertelkreis-Podest zum Aussteigen | |
| 31.3 | Eine Treppe über 2 Etagen, nur die untere Etage ansehen | Der obere Teil ist durchsichtig zu sehen (ganze Höhe), nicht fest in der Luft | |
| 31.4 | Wasser- und Gaszähler mit Sensor im Haus, oben die Energie-Anzeige ansehen | In einer zweiten Zeile: „🚰 … m³ · 🔥 … m³“ | |
