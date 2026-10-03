# Testprotokoll

Hier steht, was getestet wurde, wann und von wem. Der Besitzer testet in der **Demo-Datei** (`demo/floorplan3d-demo.html`, erfundene Daten, ohne Home Assistant). Die automatischen Tests laufen bei jeder Änderung.

Legende: ✅ geht · ❌ geht nicht · ❓ noch nicht getestet · ➖ in der Demo nicht prüfbar (nur im Add-on)

## Automatische Tests

| Datum | Stand | Python-Tests | Browser-Test (E2E) | Bemerkung |
|---|---|---|---|---|
| 2026-10-02 | 3.21.0 | 80 bestanden + 8 Gauben-Tests | 208 von 208 bestanden | Dachgauben |
| 2026-10-03 | 3.22.0 | 80 bestanden | die 3 neuen Prüfungen bestanden; ein Lauf mit 93 Prüfungen ohne Fehler wurde vorzeitig abgebrochen (Zeitlimit), kein vollständiger Lauf | Dachgröße, Erdreich, Pfeiltasten, Menü Ansicht, Benutzer-Dialog |
| 2026-10-03 | 3.23.0 | 80 bestanden + 5 Werkzeugleisten-Tests | 222 von 222 bestanden (vollständiger Lauf auf frischem Server, Headless-Chromium) | Werkzeugleiste anpassbar, Raumliste nach Haus gruppiert |

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

### 4. Räume · 5. Farbansichten · 6. Kameras · 7. Türen/Fenster/Garage · 8. Live-Ansicht · 9. Bearbeiten · 10. Tablet/Bedienung
Alle Punkte der Liste aus dem Chat: ❓ (werden vom Besitzer nacheinander abgehakt und hier eingetragen).

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
| 12.1 | Dachstuhl wählen → Abschnitt „Dachgauben" mit „+ Gaube" | ❓ |
| 12.2 | Eine Gaube erscheint in 3D auf dem Dach, mit Fenster | ❓ |
| 12.3 | Seite A/B, Position, Breite, Höhe, Abstand zur Traufe lassen sich ändern | ❓ |
| 12.4 | Gaube mit Satteldach und mit Flachdach | ❓ |
| 12.5 | Gaube entfernen (×) | ❓ |
| 12.6 | Bei Flachdach erscheint ein Hinweis statt der Gauben | ❓ |
| 12.6a | JSON-Import mit `roof.dormers` (docs/examples/house.json hat zwei Gauben) zeigt Gauben auf dem Dach | ❓ |
| 12.7 | Nach dem Neuladen sind die Gauben noch da (nur im Add-on, Demo speichert nicht) | ➖ |

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

## Automatisch geprüft (zusätzlich)
- Python: Benutzer werden in `users.json` gespiegelt; Synchronisieren lädt/speichert; frische Installation holt sich Benutzer aus der Datei zurück.
- Browser-Test: Benutzer-Reiter sichtbar für Admins, versteckt für Nur-Lese-Benutzer; nicht mehr im Zahnrad; Tablet speichern; Synchronisieren.
