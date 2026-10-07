# Roadmap

✅ = done · ⬜ = still open

Progress is tracked with [milestones](https://github.com/BuRnEd4AiM/HA-Floorplanner/milestones) and [issues](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues). Dates are targets, not promises.

## Done

- **0.1 Foundation** – walls, rooms, floors, snapping grid, 3D view, device placement, entity binding, auto-save, undo
- **0.2 Professional basics** – settings, doors and windows, custom GLB models, live view for wall tablets
- **0.3 – 0.7 Daily use** – Home Assistant areas, entity search, room panel, object list, selection lock, 2D blueprint editor with split view, light colours and effects, more furniture, light ball and LED strip, administrator-only editing, per-user room and view, whole-room control with scenes

## Done in 3.20 – 3.26

- ✅ Dormers and manual roof size, basement without a hole in the ground
- ✅ Customisable toolbar with a *More* menu, rooms grouped by house in the user list
- ✅ Double-click a wall to add a corner, grouped opening palette, placed devices stay selected
- ✅ Automatic backups with retention, check and restore
- ✅ Version and checksum pill (add-on files, browser, GitHub)
- ✅ Add-on store listing (icon, logo, translations), welcome card on first start

## Open

- ⬜ HACS Lovelace card to show the floor plan on any dashboard ([#13](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/13))
- ⬜ Sun light and shadows through the windows by the position of the sun ([#68](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/68))
- ⬜ Faster on tablets: measure first, then speed up the slow parts ([#138](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/138))

## Done in 3.26 – 3.56

- ✅ Exploded view lifts every floor, also the ground floor over the basement (3.26.1) ([#146](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/146))
- ✅ Version dialog over plain `http`: no more "check not possible here" (3.27.0) ([#144](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/144))
- ✅ Version pill shows "New version available" by itself (3.27.0) ([#140](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/140))
- ✅ Live mode: a second click into the room goes back to the view before (3.28.0) ([#128](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/128))
- ✅ Option: walls seen from the front slightly transparent (3.28.0) ([#129](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/129))
- ✅ Cut-away view also cuts the ceilings (3.28.0) ([#131](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/131))
- ✅ View menu at the bottom, next to Normal / Temperature / Humidity (3.28.0) ([#132](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/132))
- ✅ Live mode: bigger touch areas for lights, objects without an entity take no tap (3.29.0) ([#130](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/130))
- ✅ Heating control: its own panel with a sign that the heating is running (3.30.0) ([#134](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/134))
- ✅ Several different roofs per house (3.31.0) ([#125](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/125))
- ✅ Edit kitchen units individually: modules, stove and sink, L / U shape, island (3.32.0) ([#124](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/124))
- ✅ Doors and windows also in very short wall pieces (3.33.0) ([#142](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/142))
- ✅ Power add-on: inverter, meters, solar panels, animated cables with the watts on them, on/off button at the bottom (3.34.0 – 3.42.0) ([#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136))
  - ✅ Water, gas and heat meters with their reading as a badge (3.42.0)
  - Ideas for later are collected in the comment of [#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136#issuecomment-5981634564) (separate import / export sensors, flip the sign, setup checklist, take over from the energy dashboard)
- ✅ Power button / power editor is a real switch that stays on until pressed again (3.40.8) ([#174](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/174))
- ✅ Compass needle turns all the way back after one full turn (3.39.3) ([#175](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/175))
- ✅ Stairs over several floors, light wall stair with landings and an outdoor spiral over several floors (3.40.0) ([#188](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/188))
- ✅ Import, export and API know stairs, placeholder blocks and floor openings (3.40.1) ([#191](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/191))
- ✅ Place solar panels on the roof (3.41.0) ([#176](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/176))
- ✅ Metal bridge (walkway, about 3 m) between two buildings ([#189](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/189), 3.43.0; between two separate houses with the neighbour house [#220](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/220), 3.44.0)
- ✅ Move roofs and drag their size in 3D and in the 2D plan (3.49.0 – 3.50.0) ([#255](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/255), [#257](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/257), [#259](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/259))
- ✅ Live mode: devices with a tap ball are only switched over the ball (3.51.0) ([#262](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/262))
- ✅ Attic with knee wall, walls cut under the slopes, dormers, roof starting on any floor, ridge height (3.52.0 – 3.53.0) ([#260](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/260), [#265](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/265))
- ✅ Dormer windows are real windows, also in the wall of the room under the dormer (3.54.0 – 3.56.0) ([#269](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/269), [#275](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/275))
- ✅ See-through roof over a chosen room or floor (3.55.0 – 3.56.0) ([#273](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/273))
- ✅ Phones: room sheet, tool bar as a ☰ menu, no iPhone zoom on the search (3.54.0 – 3.56.1) ([#267](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/267), [#271](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/271), [#277](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/277))
- ✅ Demo runs directly on GitHub Pages, always updated automatically (3.54.0) ([#133](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/133))
- ✅ `app.js` split into smaller modules (about 5,100 → 1,500 lines, see [docs/MODULE-PLAN.md](docs/MODULE-PLAN.md)); new features go into their own module ([#137](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/137))

## v0.8 – Live sync – done in 3.6.0

- ✅ Live state updates via WebSocket instead of polling (3.6.0)
- ✅ Native Home Assistant more-info dialog for tapped devices (3.4.0)
- ✅ Auto-place all entities of an area (3.5.0)

## v0.9 – Dashboards

- ⬜ HACS Lovelace card to show the floor plan on any dashboard ([#13](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/13))
- ✅ Furniture library with previews (1.3.0)
- ✅ Cables with flowing dots and the watts on them, part of the power add-on (3.35.0) ([#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136))

## Done in 3.3 – 3.9

- ✅ LED ring for indirect light around a room, free sections with their own lights (3.3.0, 3.4.0)
- ✅ Home Assistant details dialog (3.4.0, #9)
- ✅ Auto placement of an area's entities (3.5.0)
- ✅ Live updates over Home Assistant's websocket (3.6.0)
- ✅ House in solid ground, basement shown as a section (3.7.0)
- ✅ Draw the plot, adjustable lawn around the house (3.8.0)
- ✅ Devices offline / not linked at a glance (3.9.0 – 3.9.2)
- ✅ Faster on tablets: per-device performance setting, scrolling buttons, no graphics memory leak (3.9.0, 3.9.3)

## v1.0 – Stable release

- ⬜ Verified on real Home Assistant installs (the points to check are in [docs/TESTPROTOKOLL.md](docs/TESTPROTOKOLL.md))
- ✅ Layout export / import (backup 1.5.0, JSON import 3.0.0)
- ✅ Documentation and screenshots (import guide, quick tour, demo)

## v3.0 – Property import (JSON API) – done in 3.0.0

Describe a plot and the building as JSON (or import GeoJSON footprints) and let the add-on build the house or apartment from it. Feasible in stages, each one useful on its own:

- ✅ Property JSON format (schema v1) with examples
- ✅ `POST /api/import` with validation and dry run (creates a new house, never overwrites)
- ✅ Interpreter: walls, rooms, openings, floors and roof from the description
- ✅ Plot boundary and garden objects in the whole-house view
- ✅ GeoJSON converter (lat/lon to local metres)
- ✅ Import dialog in the UI with preview and errors
- ✅ Export in the same format (round trip)
- ✅ Docs and an AI prompt for generating the JSON

## Backlog

- ✅ Presence: people and presence sensors in the rooms (3.2.0)

- ✅ Placeholder blocks and stairs / stairwells (0.8.0)
- ✅ Backup export/import (1.5.0, #12)
- ✅ Several houses and per-pane window sensors (1.4.0)
- ✅ Furniture library with previews, search and categories, door/window variants, wall pictures (1.3.0)
- ✅ Move floors, basement, roof, garden objects, whole-house view (0.9.0)
- ✅ Nanoleaf panel shapes and layout editor (0.10.0)
- ✅ Multi-segment LED strips: LED ring around the room, one light per section (3.3.0)
- ✅ Automatic room detection from closed wall loops (*Detect rooms*)
- ✅ Background image / blueprint for tracing (0.7.2)
- ✅ More languages: Français, Español, Italiano, Nederlands, Polski (3.1.0)
