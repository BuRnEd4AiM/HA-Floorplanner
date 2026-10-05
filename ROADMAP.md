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

## Known issues

- ⬜ Exploded view: the ground floor stays on the basement, only the upper floor and the roof are lifted ([#146](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/146))
- ⬜ Version dialog says "Browser: check not possible here (no secure context)" when Home Assistant is opened over plain `http` ([#144](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/144))

## Ideas, not started

- ⬜ HACS Lovelace card ([#13](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/13))
- ⬜ Sun light and shadows by time of day ([#68](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/68))
- ⬜ Edit kitchen units individually: modules, position of stove and sink, L / U shape, island ([#124](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/124))
- ⬜ Several different roofs per house, e.g. gable plus flat roof on an annex ([#125](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/125))
- ⬜ Live mode: a second click into the room goes back to the view before (e.g. back to the floor) ([#128](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/128))
- ⬜ Option: walls seen from the front slightly transparent, in addition to lowering them ([#129](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/129))
- ⬜ Live mode: bigger touch areas for lights; objects without an entity, windows and doors cannot be clicked ([#130](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/130))
- ⬜ Cut-away view also cuts the ceilings ([#131](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/131))
- ⬜ View menu moves to the bottom, next to Normal / Temperature / Humidity ([#132](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/132))
- ⬜ Demo runs directly on GitHub (Pages), always updated automatically ([#133](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/133))
- ⬜ Heating control: its own panel next to the room panel, with a sign that the heating is running ([#134](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/134))
- ⬜ Version pill shows "New version available" by itself (check every 5 minutes in the edit mode) ([#140](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/140))
- ⬜ Doors and windows can be placed even in very short wall pieces where there is no room, so very narrow windows work ([#142](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/142))
- ⬜ Power add-on: inverter, meters, solar panels and animated cables with consumption, switched on and off from the bottom bar ([#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136))
  - Small steps: first meters, inverter and battery with value badges, then solar panels (on the roof, free-standing, on walls; rows and columns, kWp, sensor per field), then animated cables with the on/off button at the bottom
  - Separate sensors (grid import / export, battery charging / discharging) and a button to flip the sign of a sensor that counts the wrong way
  - Setup checklist ("what is missing?") and a one-click *Take over from the Home Assistant energy dashboard*
  - Ideas collected in the comment of [#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136#issuecomment-5981634564)
- ⬜ Power button is only a short flicker: it must be a real switch that stays on until pressed again ([#174](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/174))
- ✅ Compass needle turns all the way back after one full turn (fixed in 3.39.3) ([#175](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/175))
- ✅ Stairs over several floors, light wall stair with landings (drawn along the wall) and an outdoor spiral over several floors (3.40.0) ([#188](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/188))
- ⬜ Metal bridge (walkway, about 3 m) between two buildings ([#189](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/189))
- ⬜ Place solar panels on the roof ([#176](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/176))
- ⬜ Split `app.js` into smaller modules, step by step ([#137](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/137))
- ⬜ Faster on tablets: measure first, then speed up the slow parts ([#138](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/138))

## v0.8 – Live sync – done in 3.6.0

- ✅ Live state updates via WebSocket instead of polling (3.6.0)
- ✅ Native Home Assistant more-info dialog for tapped devices (3.4.0)
- ✅ Auto-place all entities of an area (3.5.0)

## v0.9 – Dashboards

- ⬜ HACS Lovelace card to show the floor plan on any dashboard
- ✅ Furniture library with previews (1.3.0)
- ⬜ Glowing floor cables with watt display, part of the power add-on ([#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136))

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

- ⬜ Verified on real Home Assistant installs (test protocol issue)
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
