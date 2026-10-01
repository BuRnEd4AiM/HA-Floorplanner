# Grundstück / Grundriss importieren (JSON-Schnittstelle)

Mit dem Import baust du aus einer kleinen JSON-Beschreibung (Grundstück, Raumpolygone, Fenster, Türen, Geräte) automatisch ein **neues Haus** im 3D Floorplan. Dein bestehendes Haus bleibt unberührt – der Import legt immer ein neues an (max. 20 Häuser).

Du kannst die JSON von Hand schreiben, von einer **KI** erzeugen lassen, aus **GeoJSON** (z. B. Katasterdaten/OpenStreetMap) ableiten oder aus einem vorhandenen Haus **exportieren**.

## Schnellstart in 30 Sekunden

1. Häuser-Bereich öffnen → **Grundriss importieren (JSON)**.
2. **Beispiel: Wohnung** oder **Beispiel: Haus** klicken.
3. **Prüfen** → es erscheint eine Zusammenfassung (Etagen, Räume, Wände, Öffnungen, Geräte) plus Warnungen.
4. **Importieren** → das neue Haus wird angelegt und geöffnet. Danach ist alles ganz normal im Editor bearbeitbar.

„Importieren“ ist erst aktiv, wenn die Prüfung für genau diesen Text fehlerfrei war.

## Koordinaten

- Alles in **Metern**. `x` = nach Osten (rechts), `z` = nach Süden (unten im Grundriss). `[0,0]` ist die obere linke Ecke.
- Polygone: 3–100 Punkte, Reihenfolge egal, **nicht selbstüberschneidend**.
- `building.origin: [x, z]` verschiebt das Gebäude auf dem Grundstück (Grundstücksgrenze und Gartenobjekte bleiben stehen).

## Format (schemaVersion 1)

```jsonc
{
  "schemaVersion": 1,
  "name": "Mein Haus",
  "plot": {                                  // optional: Grundstück
    "boundary": [[0,0],[22,0],[22,30],[0,30]],
    "objects": [{ "type": "tree", "x": 3, "z": 4 }]     // Garten, Terrasse, Pool, Zaun …
  },
  "building": {
    "origin": [5.5, 8],                      // optional
    "wallHeight": 2.6, "outerWall": 0.3, "innerWall": 0.12,
    "footprint": [[0,0],[11,0],[11,9],[0,9]],           // optional: Außenumriss → dicke Außenwände
    "roof": { "type": "gable", "pitch": 38 },           // gable | hip | flat
    "floors": [
      {
        "name": "Erdgeschoss", "kind": "floor",         // floor | basement | roof
        "rooms": [{ "name": "Wohnzimmer", "points": [[0,0],[6,0],[6,5],[0,5]], "area": "wohnzimmer" }],
        "openings": [{ "preset": "doorEntry", "at": [3, 0] }],
        "devices":  [{ "type": "light", "x": 3, "z": 2.5, "entity": "light.wohnzimmer" }]
      }
    ]
  }
}
```

### Wie aus Räumen Wände werden

- Jede Raumkante wird zur Wand. **Gemeinsame Kanten** zweier Räume werden **eine** Innenwand (`innerWall`), Kanten am `footprint` bzw. ohne Nachbarraum werden Außenwände (`outerWall`).
- Stößt eine Wand seitlich an eine andere, wird sie an dieser Stelle geteilt (T-Anschluss).
- Willst du es exakt selbst bestimmen, gib in der Etage `"walls": [...]` an – dann wird nichts abgeleitet.

### Öffnungen (Fenster & Türen)

`{ "preset": "window2", "at": [x, z] }` – die Öffnung rastet an der **nächstgelegenen Wand** ein. Liegt keine Wand in der Nähe, wird sie mit Warnung übersprungen; Überlappungen und Positionen zu nah an Ecken werden korrigiert bzw. gemeldet.

Presets: `door`, `doorEntry`, `doorGlass`, `doorDouble`, `doorSlide`, `doorOpen`, `window`, `window2`, `window3`, `windowTall`, `windowBath`, `windowFixed`.
Überschreibbar: `width`, `height`, `sill`, `style`, `entity` (z. B. Fenstersensor), `name`. Statt `preset` geht auch `"type": "door"|"window"`.

### Geräte & Möbel

`{ "type": "sofa", "x": 2, "z": 3, "y": 0, "rot": 180, "scale": 1, "name": "…", "entity": "light.xyz" }`
Unbekannte Typen werden mit Warnung übersprungen. Alle Typen stehen im Schema (`/api/import/schema`), u. a. Licht (`light`, `spot`, `strip`, `pendant`, `nanoleaf`, `tv_led`), Möbel (`sofa`, `bed`, `kitchen`, …), Sensoren, Garten (`tree`, `lawn`, `pool`, `fence`, `terrace`). Weitere Felder: `ledEntity`, `hideModel`, `panels` (Nanoleaf).

### Etagen

Reihenfolge ist egal: Keller zuerst, Dachgeschoss/Dach zuletzt. Die Dachform steht in `building.roof` (oder in einer Etage mit `"kind": "roof"`). Gartenobjekte aus `plot.objects` landen auf der ersten Nicht-Keller-Etage.

## API

Alle Aufrufe brauchen Schreibrechte (Home-Assistant-Admin bzw. Editor) und laufen über Ingress oder den direkten Port.

```bash
# nur prüfen, nichts anlegen
curl -X POST "$BASE/api/import?dryRun=1" -H "Content-Type: application/json" -d @house.json
# wirklich anlegen (neues Haus)
curl -X POST "$BASE/api/import?name=Ferienhaus" -H "Content-Type: application/json" -d @house.json
# Haus als Import-JSON exportieren (Round-Trip)
curl "$BASE/api/export/property?house=main" -o mein-haus.json
# JSON-Schema (Editor-Autovervollständigung, KI-Validierung) und Beispiele
curl "$BASE/api/import/schema"
curl "$BASE/api/import/examples/house"
```

Antwort bei Erfolg: `{"ok":true,"id":"…","name":"…","summary":{…},"warnings":[…]}`.
Bei Fehlern HTTP 400 mit `{"errors":[{"path":"building.floors[0].rooms[1].points","message":"…"}],"warnings":[…]}` – der Pfad zeigt genau die Stelle.

### GeoJSON

Ein Polygon, Feature oder eine FeatureCollection in Längen-/Breitengrad wird automatisch erkannt und in lokale Meter umgerechnet. Zuordnung: `properties.role` = `"plot"`/`"building"`, sonst `building`-Tag → Gebäude, `landuse`/`parcel`/`plot` → Grundstück; ohne Angaben ist das größte Polygon das Grundstück. Es entsteht ein Haus mit einem Raum im Umriss des Gebäudes – Räume, Fenster und Möbel ergänzt du im Editor oder per JSON.

## KI-Prompting

Im Import-Dialog gibt es **KI-Prompt kopieren**: Der Prompt enthält das komplette Format, alle erlaubten Typen/Presets und ein Beispiel. Kopiere ihn in ChatGPT/Claude/Gemini und hänge deine Beschreibung an, z. B.:

> Grundstück 20 × 28 m, Haus 10 × 8 m mittig, zwei Etagen. EG: Wohnküche 6×5, Flur, WC, Büro. OG: 3 Zimmer und Bad. Satteldach 35°. Haustür Süden, Terrassentür zum Garten, in jedem Zimmer ein Fenster. Lichter `light.<raum>`.

Tipps:
- Maße nennen (Meter) und sagen, wo Norden/der Eingang ist (Norden = oben = kleines z).
- Räume als **Rechtecke nebeneinander** beschreiben, die sich Kanten teilen – so entstehen saubere Innenwände.
- Das Ergebnis immer erst **Prüfen**; Fehlermeldungen kannst du der KI direkt zurückgeben („Behebe: building.floors[0]… points: …“).
- Entity-IDs nur angeben, wenn du sie kennst – sonst später im Editor zuordnen.
- Grundriss-Foto? Lass die KI die Maße schätzen und frage nach der JSON.

## Grenzen & Fehlersuche

- Nur gerade Wände (keine Bögen), Räume als einfache Polygone, max. 100 Punkte; max. 20 Häuser.
- „no wall near …“: Position `at` liegt >~0,5 m von jeder Wand weg → Koordinaten prüfen.
- „overlaps“: zwei Öffnungen an derselben Stelle.
- Im Demo-HTML ist der Import nicht verfügbar (kein Backend).
