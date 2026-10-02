# Testprotokoll

Hier steht, was getestet wurde, wann und von wem. Der Besitzer testet in der **Demo-Datei** (`demo/floorplan3d-demo.html`, erfundene Daten, ohne Home Assistant). Die automatischen Tests laufen bei jeder Änderung.

Legende: ✅ geht · ❌ geht nicht · ❓ noch nicht getestet · ➖ in der Demo nicht prüfbar (nur im Add-on)

## Automatische Tests

| Datum | Stand | Python-Tests | Browser-Test (E2E) | Bemerkung |
|---|---|---|---|---|
| 2026-10-02 | 3.20.0 | 72 bestanden | siehe unten | Benutzer-Reiter, `users.json`, Synchronisieren |

E2E-Ergebnis 3.20.0: wird nach dem letzten Lauf eingetragen (Zeile unten).

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
| 2.1 | Karten mit Vorschaubild je Etage | ❓ |
| 2.2 | Klick auf Etage wechselt, Karte hervorgehoben | ❓ |
| 2.3 | Pfeiltasten wechseln die Etage | ❓ |
| 2.4 | „Haus auseinanderziehen" | ❓ |
| 2.5 | Halbschnitt (Wände halb hoch) | ❓ |
| 2.6 | Automatisches Wände-Ausblenden funktioniert weiter | ❓ |
| 2.7 | In 2D+3D keine Etagen-Beschriftungen, wo sie nicht hingehören | ❓ |

### 3. Etagen im 2D-Plan (3.19.1)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 3.1 | Feld „Etagen im Plan" oben rechts im Plan, von nichts verdeckt | ❓ (Screenshot vom Besitzer 2026-10-02: Feld und Legende sichtbar) |
| 3.2 | Legende: eine Zeile je Etage mit Farbe | ❓ (siehe 3.1) |
| 3.3 | Klick schaltet unten → alle → aus | ❓ |
| 3.4 | Gleicher Schalter im Menü „Ansicht" | ❓ |
| 3.5 | Nicht sichtbar in der reinen 3D-Ansicht | ❓ |
| 3.6 | Einstellung bleibt nach dem Neuladen | ❓ |
| 3.7 | Umrisse stören das Zeichnen nicht | ❓ |

### 4. Räume · 5. Farbansichten · 6. Kameras · 7. Türen/Fenster/Garage · 8. Live-Ansicht · 9. Bearbeiten · 10. Tablet/Bedienung
Alle Punkte der Liste aus dem Chat: ❓ (werden vom Besitzer nacheinander abgehakt und hier eingetragen).

### 11. Benutzer & Tablets (3.20.0)
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 11.1 | Oben in der Leiste gibt es den Knopf „Benutzer" (nur für Admins) | ❓ |
| 11.2 | Im Zahnrad (⚙) ist der Abschnitt „Benutzer & Tablets" nicht mehr | ❓ |
| 11.3 | Benutzer hinzufügen, Raum und Ansicht wählen, wird gespeichert | ❓ |
| 11.4 | Unter dem Dialog steht, ob Datei und Add-on gleich sind | ❓ |
| 11.5 | „↻ Synchronisieren" liest `users.json` und übernimmt die Benutzer | ➖ (nur im Add-on mit echtem Ordner) |
| 11.6 | Nach einem Update/Neuinstallation sind Benutzer und Tablets wieder da | ➖ |

## Automatisch geprüft (zusätzlich)
- Python: Benutzer werden in `users.json` gespiegelt; Synchronisieren lädt/speichert; frische Installation holt sich Benutzer aus der Datei zurück.
- Browser-Test: Benutzer-Reiter sichtbar für Admins, versteckt für Nur-Lese-Benutzer; nicht mehr im Zahnrad; Tablet speichern; Synchronisieren.
