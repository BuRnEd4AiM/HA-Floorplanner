# Architecture

```
Browser (Home Assistant sidebar, Ingress)
 │  ES modules, three.js, no build step
 ▼
server.py  (aiohttp, port 8099)
 ├─ /                 static frontend
 ├─ /api/layout       floors, walls, rooms, devices      → /data/layout.json (first house), /data/layouts/<id>.json (ETag / If-Match: no silent overwrite, #403)
 ├─ /api/houses       house index (several floor plans)  → /data/houses.json
 ├─ /api/backup       export / import everything         → /data/backups/ (safety copies)
 ├─ /api/backgrounds  floor plan templates, wall pictures → /data/backgrounds/
 ├─ /api/settings     look, units, users/rooms/views     → /data/settings.json
 ├─ /api/models       uploaded GLB models                → /data/models/
 ├─ /api/users-file   users & tablets file, sync button  → /config/users.json (addon_configs)
 ├─ /api/entities     entity list with state             ← Home Assistant REST API
 ├─ /api/live         websocket: state changes pushed live ← Home Assistant websocket (state_changed)
 ├─ /api/areas        HA areas with their entities       ← template API
 ├─ /api/users, /api/me   who is looking, may they edit   ← ingress headers + HA auth list
 ├─ /api/service      whitelisted service calls          → Home Assistant REST API
 ├─ /api/rules        own heating rules and routines     → /data/rules.json (+ rules-state.json), run by rulesrun.py (#546)
 └─ /api/related      who uses a device                  ← Home Assistant websocket (search/related, automation/config)
```

## Frontend

| File | Job |
| --- | --- |
| `app.js` | State (layout, selection, settings), 3D scene, live mode, panels, settings dialog |
| `plan2d.js` | SVG blueprint editor, shares the layout with the 3D scene |
| `walls.js` | Wall geometry with door and window openings |
| `models.js` | Built-in furniture and device models, GLB loading |
| `ledring.js` | LED ring geometry: sections, room inset, entity per section (shared by 3D, 2D and tests) |
| `moreinfo.js` | Opens Home Assistant's more-info dialog from the Ingress iframe (only inside the HA frontend) |
| `autoplace.js` | Automatic placement of an area's entities in a room (pure, unit-tested) |
| `i18n.js` | German and English strings |

More modules (heating panel, kitchen run, tool bar, backups, ...) and the plan for splitting the rest of `app.js`: see [MODULE-PLAN.md](MODULE-PLAN.md).

The layout is plain JSON: floors → walls (with openings), rooms, devices. A plan can hold several buildings (`buildings: [{ id, name }]`, `room.building`, a roof's `building`, #409): `buildings.js` works out what belongs to which one and the plan as one building sees it (`viewOf`); drawing, framing and the lists use that view, editing always the plan itself. Both editors change the same object and call `changed()`, which rebuilds the 3D scene and schedules a save.

## Backend rules

- **Permissions:** administrators (read from Home Assistant) and users in the `editors` option may write; everyone else gets HTTP 403 on every write endpoint.
- **Service calls:** only a fixed set of domains and services, with validated data (brightness, colour, colour temperature, effect, cover position).
- **Standalone mode:** without a `SUPERVISOR_TOKEN` the backend stores layouts but disables entity features, which is what the tests and local development use.

## Tests

`pytest` covers the backend (validation, permissions, admin detection). `tests/e2e` drives the real UI in headless Chromium against the real server and a mock Home Assistant. The demo (`demo/`) runs the same frontend with a fake API for screenshots and quick trials.


## Property import

`rootfs/app/importer.py` (stdlib only) validates a property JSON (schema in `property.schema.json`, examples in `examples/`), derives walls from room polygons, snaps openings to walls and returns `(layout, plot, report, summary)`. `server.py` exposes it as `POST /api/import` (always a new house), `GET /api/export/property`, `GET /api/import/schema` and `/api/import/examples/{name}`. The UI is `static/import.js` (dialog and AI prompt, built from the live device list). The optional `layout.plot.boundary` is drawn in 3D (`app.js` build) and 2D (`plan2d.js`). Guide: [IMPORT.en.md](IMPORT.en.md).


## Live updates

`server.py` (`LiveHub`) opens one websocket to Home Assistant while at least one view is open (and for a minute after), subscribes to `state_changed` and forwards each change, in the same slim shape as `/api/entities`, to every browser connected to `/api/live` (batched per 50 ms). It also tells the browsers whether Home Assistant is reachable (`{type: upstream, ok}`). The browser (`connectLive` in `app.js`) applies the changes at once; while the channel is down it polls `/api/entities` every 4 s, while it is up only once a minute.


## Own heating rules and routines (#546)

`heatrules.py` (window open → off, nobody home, night, schedule, summer pause, boost, holidays) and `flows.py` (routines "Wenn … dann …" made of blocks) are pure: they get the states, the clock and the rooms (`roommap.py`, worked out from the saved plans like the page does) and return the calls. `rulesrun.py` runs them in the add-on while a rule is on: one websocket to Home Assistant (all states, then every change), a look every 15 s, the wishes of the pages (boost, "Trotzdem heizen", a routine's button); the calls go through `HA_API`, what the rules do goes to the pages over the live channel (`{type: rules}`). The pages: `rulesui.js` puts `rulesstore.js`, `heatrulesui.js`, `heatplanui.js`, `usedbyui.js`, `routinesown.js` and `flowedit.js` together.

A routine with `ha: true` (#548, the default for new ones) is not run by the add-on: `haflows.py` (pure) turns every lane into an automation of Home Assistant (`fp3d_<routine>_<lane>`, mode restart, conditions and waits as steps, "wie vorher" through `scene.create`), and `put_rules` writes them through Home Assistant's own editor API (`HA_API/config/automation/config/<id>`, `ha_sync_flows`): only ids starting with `fp3d_`, not again when unchanged (`ha-sync.json` keeps what was sent and what Home Assistant gave back), not over a change made in Home Assistant unless the page sends `force`, the old version kept in `ha-backup/`, switched on or off with the routine, deleted with it. A message of such an automation goes through Home Assistant's notify services, or as the event `fp3d_notify` that `rulesrun.py` listens for and sends the add-on's way. `tools/ha_check.py` lets a real Home Assistant validate and run what `haflows.py` writes.

Scenes (#549) go the same way without a copy in the add-on: the scene editor (`sceneedit.js`, model in `scenes.js`) reads a scene from Home Assistant's scene editor API (`api/scenes/<id>` → `HA_API/config/scene/config/<id>`, `scenes.from_ha`) and saves it there (`scenes.to_ha`); only `fp3d_…` ids are written or deleted, another scene is saved as a copy; `api/scenes/try` calls `scene.apply`.
