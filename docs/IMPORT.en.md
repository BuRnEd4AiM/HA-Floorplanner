<div align="center">

# 📥 Import a house from JSON

**Describe plot, rooms, windows, doors and devices. The house builds itself.**

<img src="img/import-en-4-whole-house.png" alt="Imported house with plot in the 3D view" width="820">

[Deutsch](IMPORT.md) · **English**

</div>

> [!NOTE]
> The import **always creates a new house** and never overwrites anything (max. 20 houses).

A small JSON description (plot, room polygons, windows, doors, devices) is turned into a complete **new house** in 3D Floorplan: walls, rooms, openings, floors, roof, plot boundary and garden.

You can write the JSON by hand, let an **AI** generate it, derive it from **GeoJSON** (cadastre / OpenStreetMap outlines) or **export** it from an existing house.

## Contents

[Quick start](#quick-start-in-30-seconds) · [Coordinates](#coordinates) · [Format](#format-schemaversion-1) · [API](#api) · [GeoJSON](#geojson) · [AI prompting](#ai-prompting) · [Export](#export-round-trip) · [Troubleshooting](#error-messages)

Ready-made examples: [`docs/examples/flat.json`](examples/flat.json) (flat, 1 floor) and [`docs/examples/house.json`](examples/house.json) (house with plot, basement, ground floor, upper floor, roof). The example rooms and floors have German names; names are just text and can be changed in the editor.

## Quick start in 30 seconds

**1. Open the import dialog.** In edit mode, expand **Houses & backup** in the side panel and click **Import house from JSON …**.

![Houses panel with import and export buttons](img/import-en-0-panel.png)

**2. Load an example and check it.** Click **Example: flat** or **Example: house with plot**, then **Check**. You get a summary (floors, rooms, walls, doors/windows, devices) and any warnings. **Import** only becomes active once exactly this text has been checked without errors.

![Import dialog after a successful check](img/import-en-1-dialog.png)

**3. Read errors.** An error carries the exact path into your JSON (here: a room whose edges cross each other). Nothing is created while there are errors.

![Error message with JSON path](img/import-en-2-error.png)

**4. Import.** The house is created as a **new house** and opened right away. Your existing house stays untouched; switch back any time with the house selector at the top.

![Imported house (ground floor)](img/import-en-3-result.png)

**5. Whole house and plot.** In live mode, **Whole house** shows building, roof, plot and garden objects (lawn, terrace, trees, fence). The house stands in the lawn, the basement sits in the earth and is shown cut open on the camera side.

![Whole house with plot](img/import-en-4-whole-house.png)

**6. Keep working in the 2D plan.** The plot boundary is dashed. From here on everything is a normal house: move walls, link devices to entities, add rooms.

![2D plan with dashed plot boundary](img/import-en-5-plan2d.png)

## Coordinates

- Everything is in **metres**. `x` points east (right), `z` points south (down in the plan). `[0,0]` is the top left corner.
- Polygons: 3 to 100 points, any order, **must not cross themselves**.
- `building.origin: [x, z]` moves the building on the plot (plot boundary and garden objects stay where they are).

## Format (schemaVersion 1)

```jsonc
{
  "schemaVersion": 1,
  "name": "My house",
  "plot": {                                  // optional: the property
    "boundary": [[0,0],[22,0],[22,30],[0,30]],
    "objects": [{ "type": "tree", "x": 3, "z": 4 }]     // garden, terrace, pool, fence ...
  },
  "building": {
    "origin": [5.5, 8],                      // optional
    "wallHeight": 2.6, "outerWall": 0.3, "innerWall": 0.12,
    "footprint": [[0,0],[11,0],[11,9],[0,9]],           // optional: outline, gives thick outer walls
    "roof": { "type": "gable", "pitch": 38 },           // gable | hip | flat
    // roof dormers (optional, not on flat): side 0|1 or "a"|"b", pos 0..1 along the ridge, w/hw/eave in m, type gable|flat, win true|false
    // "roof": { "type": "gable", "dormers": [ { "side": "a", "pos": 0.3, "w": 1.6, "hw": 1.2, "eave": 0.8, "type": "gable", "win": true } ] },
    "floors": [
      {
        "name": "Ground floor", "kind": "floor",        // floor | basement | roof
        "rooms": [{ "name": "Living room", "points": [[0,0],[6,0],[6,5],[0,5]], "area": "living_room" }],
        "openings": [{ "preset": "doorEntry", "at": [3, 0] }],
        "devices":  [{ "type": "light", "x": 3, "z": 2.5, "entity": "light.living_room" }]
      }
    ]
  }
}
```

### How rooms become walls

- Every room edge becomes a wall. An edge **shared by two rooms** becomes **one** inner wall (`innerWall`); edges on the `footprint` or without a neighbouring room become outer walls (`outerWall`).
- Where a wall meets another one from the side, it is split at that point (T junction).
- If you want full control, give `"walls": [...]` in the floor. Nothing is derived then.

### Openings (windows and doors)

`{ "preset": "window2", "at": [x, z] }`: the opening snaps to the **nearest wall**. If no wall is nearby it is skipped with a warning; overlaps and positions too close to corners are corrected or reported.

| Preset | Kind | Style | Width × height | Sill |
|---|---|---|---|---|
| `door` | Door | single | 0.9 × 2.05 m | 0 m |
| `doorEntry` | Door | single | 1.1 × 2.15 m | 0 m |
| `doorGlass` | Door | glass | 0.9 × 2.05 m | 0 m |
| `doorDouble` | Door | double | 1.6 × 2.05 m | 0 m |
| `doorSlide` | Door | sliding | 1.8 × 2.1 m | 0 m |
| `doorOpen` | Door | open | 1.0 × 2.05 m | 0 m |
| `doorGap` | Door | gap | 1.0 × 2.1 m | 0 m |
| `doorGarage` | Door | garage | 2.5 × 2.1 m | 0 m |
| `window` | Window | single | 1.0 × 1.2 m | 0.9 m |
| `window2` | Window | double | 1.8 × 1.2 m | 0.9 m |
| `window3` | Window | triple | 2.4 × 1.2 m | 0.9 m |
| `windowTall` | Window | double | 1.8 × 2.1 m | 0 m |
| `windowBath` | Window | single | 0.6 × 0.6 m | 1.5 m |
| `windowFixed` | Window | fixed | 1.6 × 1.4 m | 0.6 m |

Can be overridden: `width`, `height`, `sill`, `style`, `entity` (e.g. a window sensor), `name`. Instead of `preset` you can use `"type": "door"|"window"`.

### Devices and furniture

`{ "type": "sofa", "x": 2, "z": 3, "y": 0, "rot": 180, "scale": 1, "name": "...", "entity": "light.xyz" }`
Unknown types are skipped with a warning. All types are listed in the schema (`/api/import/schema`), among them lights (`light`, `spot`, `strip`, `pendant`, `nanoleaf`, `tv_led`), furniture (`sofa`, `bed`, `kitchen`, ...), sensors and garden objects (`tree`, `lawn`, `pool`, `fence`, `terrace`). More fields: `ledEntity`, `hideModel`, `panels` (Nanoleaf), `pts` / `closed` / `segs` / `inset` (LED ring).

**Kitchen run** (`"type": "kitchenrun"`): `legs` = up to 3 legs (straight, L, U), each a list of modules (`base`, `drawers`, `sink`, `stove`, `dish`, `fridge`, `tall`, `gap`), plus `upper` (wall cabinets, default `true`) and `depth` (0.4 to 1.2 m).
`{ "type": "kitchenrun", "x": 3, "z": 2, "legs": [["base","sink","dish","stove","fridge"],["base","base"]], "upper": true }`

**Bridge / walkway** (`"type": "bridge"`): `len` = length (0.5 to 30 m, default 3), `w` = width (0.5 to 5 m, default 1.2), `noRail: true` = no railing. The walking surface is at the level of the floor, `rot` turns it.
`{ "type": "bridge", "x": 12, "z": 4, "len": 3, "rot": 90 }`

**Solar panel** (`"type": "solarpanel"`): `cols` = panels side by side, `rows` = rows (each 1 to 12, default 1), `mount` = `auto` (default: flat on sloped roofs, on a rack on a flat roof and the ground), `flat` or `stand`. When the device is on the floor of kind `roof`, it follows the roof surface below it.
`{ "type": "solarpanel", "x": 4, "z": 2, "cols": 4, "rows": 2 }`

**Power** (`houseentry`, `fusebox`, `powermeter`, `inverter`, `solarpanel`, `battery`, `wallbox`; plus the meters `watermeter`, `gasmeter`, `heatmeter`, which only show their reading): cables join two devices. Every device that is a target or has cables gets an `id` (free choice, only valid inside the file); the cables are listed at the starting device as `cables`: `route` is `floor` (along the floor, default), `through` (through the floor to another storey) or `air`. The flow direction of the dots follows the value of the `entity` (negative = backwards, kW is converted). Targets on another floor are allowed.
`{ "type": "houseentry", "id": "hak", "x": 1, "z": 1, "cables": [{ "to": "zk", "route": "floor" }] }`, `{ "type": "fusebox", "id": "zk", "x": 3, "z": 1, "entity": "sensor.house_power" }`

### Stairs, blocks and floor openings

Per floor (not for the roof), all sizes in metres. A stair belongs to the floor it **starts** on.

`"stairs": [{ "type": "straight", "x": 1, "z": 0.5, "rot": 0, "w": 1, "floors": 1, "dir": "up" }]`

| Field | Meaning |
|---|---|
| `type` | `straight`, `L`, `U`, `spiral` or `wall` (a light stair on a wall) |
| `x`, `z` | Start of the stair (bottom, middle of the first step; the centre of a spiral) |
| `rot` | Rotation around that point in degrees |
| `w` | Width of the steps, the radius of a spiral (0.4 to 4 m) |
| `tread` | Depth of one step (0.1 to 0.45 m, not for spiral and wall stairs) |
| `turn` | `left`/`right`: for L, U and spiral the side it turns to; for a wall stair the side the steps stick out to (seen in walking direction) |
| `dir` | `up` (climbs, opening in the floor above) or `down` (comes up from below, opening in this floor) |
| `floors` | how many floors the stair climbs (1 to 6, default 1); an opening is cut into every floor it goes through. A spiral makes one turn per floor |
| `path` | **only for `wall`:** the line along the wall as points `[x, z]` relative to `x`/`z`; the first point is `[0, 0]` (another start is moved there). Every bend is a landing. 2 to 30 points |

A wall stair with a landing in the corner (along the top wall, then down the right wall; the steps stick out to the right, into the room):
`{ "type": "wall", "x": 1.6, "z": 0.1, "turn": "right", "floors": 2, "path": [[0, 0], [2.3, 0], [2.3, 4.9]] }`
The points should lie on the wall face (wall centre plus half the wall thickness). The landing is built for bends of about 90°.

**Placeholder blocks** (a part of the house without detail, e.g. an annex): `"blocks": [{ "name": "Annex", "points": [[8,0],[11,0],[11,4],[8,4]], "h": 3 }]` (`h` = height, default one floor).
**Floor openings** (a hole in the floor of this floor, e.g. a void): `"holes": [{ "points": [[2,1],[4,1],[4,3],[2,3]] }]`.

Unknown stair types are skipped with a warning, invalid numbers (e.g. `floors` 9) are ignored, a wall stair without a usable `path` is an error. Stairs, blocks and floor openings are part of the **export** too (round trip).

### Floors

The order does not matter: basements come first, attic / roof last. The roof shape is set in `building.roof` (or in a floor with `"kind": "roof"`). **Further roofs** (e.g. an annex with a flat roof): `"roof": { "type": "gable", "parts": [{ "box": {"x0": 8, "x1": 11, "z0": 0, "z1": 4}, "type": "flat", "level": 0, "name": "Annex" }] }`, up to 8; `level` is the index of the floor in `building.floors` the roof sits on (without it: on top of the house), plus `pitch`, `overhang`, `dormers`. Garden objects from `plot.objects` are placed on the first floor that is not a basement.

## API

> [!IMPORTANT]
> All calls need write permission (Home Assistant admin or configured editor) and go through Ingress or the direct port.

```bash
# check only, creates nothing
curl -X POST "$BASE/api/import?dryRun=1" -H "Content-Type: application/json" -d @house.json
# really create a new house
curl -X POST "$BASE/api/import?name=Cabin" -H "Content-Type: application/json" -d @house.json
# export a house as import JSON (round trip)
curl "$BASE/api/export/property?house=main" -o my-house.json
# JSON schema (editor autocompletion, AI validation) and examples
curl "$BASE/api/import/schema"
curl "$BASE/api/import/examples/house"
```

On success: `{"ok":true,"id":"...","name":"...","summary":{...},"warnings":[...]}`.
On errors: HTTP 400 with `{"errors":[{"path":"building.floors[0].rooms[1].points","message":"..."}],"warnings":[...]}`. The path points at the exact spot.

### GeoJSON

A polygon, feature or feature collection in longitude / latitude is detected automatically and converted to local metres. Assignment: `properties.role` = `"plot"` / `"building"`, otherwise a `building` tag means building and `landuse` / `parcel` / `plot` means plot; without any hints the largest polygon is the plot. The result is a house with one room in the shape of the building. Add rooms, windows and furniture in the editor or with JSON.

## AI prompting

The import dialog has **Copy AI prompt**. The prompt contains the full format, all allowed types and presets and an example. Paste it into ChatGPT / Claude / Gemini and append your description, for example:

> Plot 20 × 28 m, house 10 × 8 m in the middle, two floors. Ground floor: open kitchen/living room 6×5, hall, WC, office. Upper floor: 3 bedrooms and a bathroom. Gable roof 35°. Front door on the south side, patio door to the garden, one window in every room. Lights `light.<room>`.

Tips:
- Give measurements in metres and say where north / the entrance is (north = up = small `z`).
- Describe rooms as **rectangles next to each other** that share edges: this gives clean inner walls.
- Always **Check** first; you can paste error messages straight back to the AI ("Fix: building.floors[0]... points: ...").
- Only give entity IDs you know. Otherwise link them later in the editor.
- A photo of a floor plan? Let the AI estimate the measurements and ask it for the JSON.

## Export (round trip)

**Export this house as JSON** (same side panel) downloads your current house in the import format, with explicit walls so nothing is derived again. Useful for sharing, as a template for the AI ("change this house so that ...") or for versioning in Git. Also available to scripts via `GET /api/export/property?house=<id>`. Stairs, placeholder blocks and floor openings are included; background pictures (templates to trace) are not.

## Typical workflows

| Goal | How |
|---|---|
| Build a flat quickly | Load the example, adjust sizes and rooms, check, import |
| Let an AI plan the house | Copy the prompt, add your description, paste the answer, check, send errors back to the AI |
| Use a cadastre outline | Paste GeoJSON (building + plot), import, draw the rooms in the editor |
| Back up / share a house | Export it, hand over the file, import it on the other side |
| Script / CI | `POST /api/import` with curl (see above) |

## Error messages

| Message | Meaning | Fix |
|---|---|---|
| `crosses itself` | Room edges intersect (bow tie) | Give the points in walking order |
| `too small or degenerate` | Area below 0.5 m² | Check the sizes (metres, not cm) |
| `no wall near ...` | Opening is far from every wall | Put `at` on the wall line |
| `overlaps` | Two openings in the same place | Change position or width |
| `unknown device type` | Type is not in the library | Pick a type from the schema |
| `schemaVersion` missing | Warning only | Add `"schemaVersion": 1` |

## Limits

- Straight walls only (no arcs), rooms as simple polygons, max. 100 points; max. 20 houses.
- The demo HTML has no import (no backend).
