# Roadmap

Progress is tracked with [milestones](https://github.com/BuRnEd4AiM/HA-Floorplanner/milestones) and [issues](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues). Dates are targets, not promises.

## Done

- **0.1 Foundation** – walls, rooms, floors, snapping grid, 3D view, device placement, entity binding, auto-save, undo
- **0.2 Professional basics** – settings, doors and windows, custom GLB models, live view for wall tablets
- **0.3 – 0.7 Daily use** – Home Assistant areas, entity search, room panel, object list, selection lock, 2D blueprint editor with split view, light colours and effects, more furniture, light ball and LED strip, administrator-only editing, per-user room and view, whole-room control with scenes

## v0.8 – Live sync – done in 3.6.0

- [x] Live state updates via WebSocket instead of polling (3.6.0)
- [x] Native Home Assistant more-info dialog for tapped devices (3.4.0)
- [x] Auto-place all entities of an area (3.5.0)

## v0.9 – Dashboards

- [ ] HACS Lovelace card to show the floor plan on any dashboard
- [x] Furniture library with previews (1.3.0)
- [ ] Glowing floor cables with watt display

## Done in 3.3 – 3.9

- [x] LED ring for indirect light around a room, free sections with their own lights (3.3.0, 3.4.0)
- [x] Home Assistant details dialog (3.4.0, #9)
- [x] Auto placement of an area's entities (3.5.0)
- [x] Live updates over Home Assistant's websocket (3.6.0)
- [x] House in solid ground, basement shown as a section (3.7.0)
- [x] Draw the plot, adjustable lawn around the house (3.8.0)
- [x] Devices offline / not linked at a glance (3.9.0 – 3.9.2)
- [x] Faster on tablets: per-device performance setting, scrolling buttons, no graphics memory leak (3.9.0, 3.9.3)

## v1.0 – Stable release

- [ ] Verified on real Home Assistant installs (test protocol issue)
- [x] Layout export / import (backup 1.5.0, JSON import 3.0.0)
- [x] Documentation and screenshots (import guide, quick tour, demo)

## v3.0 – Property import (JSON API) – done in 3.0.0

Describe a plot and the building as JSON (or import GeoJSON footprints) and let the add-on build the house or apartment from it. Feasible in stages, each one useful on its own:

- [x] Property JSON format (schema v1) with examples
- [x] `POST /api/import` with validation and dry run (creates a new house, never overwrites)
- [x] Interpreter: walls, rooms, openings, floors and roof from the description
- [x] Plot boundary and garden objects in the whole-house view
- [x] GeoJSON converter (lat/lon to local metres)
- [x] Import dialog in the UI with preview and errors
- [x] Export in the same format (round trip)
- [x] Docs and an AI prompt for generating the JSON

## Backlog

- [x] Presence: people and presence sensors in the rooms (3.2.0)

- [x] Placeholder blocks and stairs / stairwells (0.8.0)
- [x] Backup export/import (1.5.0, #12)
- [x] Several houses and per-pane window sensors (1.4.0)
- [x] Furniture library with previews, search and categories, door/window variants, wall pictures (1.3.0)
- [x] Move floors, basement, roof, garden objects, whole-house view (0.9.0)
- [x] Nanoleaf panel shapes and layout editor (0.10.0)
- [x] Multi-segment LED strips: LED ring around the room, one light per section (3.3.0)
- [ ] Automatic room detection from closed wall loops
- [x] Background image / blueprint for tracing (0.7.2)
- [x] More languages: Français, Español, Italiano, Nederlands, Polski (3.1.0)
