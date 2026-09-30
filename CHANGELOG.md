# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-09-30
### Changed
- First stable version number. No functional changes compared to 0.10.2; the jump also makes sure Home Assistant offers the update (some installs did not show 0.10.x)

## [0.10.2] - 2026-09-30
### Added
- **Low-power mode for tablets and kiosk screens** (Fire tablets ...): resolution capped at 1.25x, no antialiasing, no shadows, 30 fps while you interact and only about 4 fps when nothing happens (back to full speed on touch, state changes and edits); nothing is drawn while the screen or tab is hidden. Automatic for `?kiosk=1`, `?room=...` and touch screens; `?perf=high` / `?perf=low` overrides. Desktop is unchanged

## [0.10.1] - 2026-09-30
### Added
- Live popup of a light: **Szenen mit dieser Lampe** – all Home Assistant scenes (`scene.*`) that contain this light are listed as buttons and activate the whole scene (e.g. one *Gaming* scene that sets several LED strips to different colours). The room panel also offers the scenes that contain any of its lights, not only those of the room's area

## [0.10.0] - 2026-09-30
### Added
- Nanoleaf panel shapes as placeable devices: **triangle, hexagon, square and line** (upright, wall-mounted, rotate with Q/E). Give several panels the same light entity and they glow together; effects/scenes of the light are offered in the live popup as before (#16)

## [0.9.3] - 2026-09-30
### Fixed
- Release workflow: duplicate `push` trigger merged (the file was rejected by GitHub)

## [0.9.2] - 2026-09-30
### Changed
- The *Release* workflow now runs by itself when the version in `config.yaml` changes on `main`, so the release badge and the GitHub releases always match the current version (no manual *Run workflow* needed)

## [0.9.1] - 2026-09-30
### Fixed
- Garden objects (lawn, tree, bush, pool, terrace, path, fence) keep their natural colours in the hologram theme instead of turning blue
- Whole-house view: a basement is drawn translucent inside a block of earth under a green ground plane, so it no longer looks like another storey

## [0.9.0] - 2026-09-30
### Added
- Floors: **move up/down** and **insert a basement** below the ground floor (panel *Etage verwalten*); the ground floor keeps height 0, floors get a type (floor / basement / roof) and can be deleted
- **Roof** as a floor type: gable, hip or flat roof, generated over the footprint of everything below (pitch, overhang, ridge direction)
- **Outdoor / decoration** objects: tree, bush, pool, lawn, terrace, path, fence – placed like devices, also outside the house (flat ones are drawn below other objects in 2D)
- View **Ganzes Haus**: all floors solid (no ghosting) plus the plot with ground grid; a click on a floor leaves it. Read-only (nothing is edited in this view)

## [0.8.3] - 2026-09-30
### Fixed
- Stair opening: the floor above is now cut with a real polygon difference (small vendored library `polygon-clipping`, MIT). Before, the opening was only cut when it lay completely inside one room, so it failed over walls, corridors and between rooms
### Added
- Stairs: **size editing**: length field in the side panel and two handles in 2D (end of the run = step depth/length, side of the run = width or spiral radius). After placing a stair the *Select* tool is active so the handles work at once
- Doors: **Aufschlag umkehren** – the door swings to the other side of the wall (2D arc and 3D leaf), independent of *Spiegeln* (hinge side)

## [0.8.2] - 2026-09-30
### Added
- 2D editor: **double click on the outline of a room or block adds a corner** at that point (easy to reshape a room), double click on a corner removes it again (a room keeps at least three)

## [0.8.1] - 2026-09-30
### Changed
- Background image: **resize by dragging the corner handles** (uniform scale around the opposite corner), drag the image to move it. Both are active right after loading an image and via the button "Verschieben / Größe"

## [0.8.0] - 2026-09-30
### Added
- **Placeholder blocks** for floors you do not want to draw: tool *Block* (B), draw the building outline, it stands as a solid mass (3D) / hatched area (2D) for the floor below. On the first floor the floor below is created automatically (the default floor is renamed "1. Stock"). Blocks are not controllable and only give orientation
- **Stairs** (tool *Treppe*, T): straight, L and U stairs with landing, spiral stairs. Steps are calculated from the floor height, shown as solid steps in 3D and as tread lines with a direction arrow in 2D. Q/E rotates, side panel edits width/radius, turning side, direction and position
- **Floor opening**: the floor above (or the own floor for stairs that "come from below") gets an opening over the upper flight automatically, shown dashed orange in 2D
- **Stairwell preset** (*Treppenhaus*): U stair, four walls, a room, a flat door and, for stairs leading up, the same shell on the next floor in one click
- Stairs and blocks appear in the object list, can be dragged in 2D, deleted and undone
- Unit tests for the stair geometry (`tests/stairs.test.mjs`, run in CI) and 7 new browser checks

## [0.7.2] - 2026-09-30
### Added
- **Background image / blueprint for tracing** (roadmap issue #18): per floor you can load a scan or photo of your floor plan (PNG, JPG or WebP, up to 8 MB) as a template in the 2D editor. Panel "Hintergrundbild" with opacity, width, position and rotation, **Set scale** (click two points of a known distance, enter the real length) and **Move** (drag the image). The template is only visible in the editor and is stored with the layout
- Backend: `POST/GET/DELETE /api/backgrounds` (editors only for writing, images are recognised by their content, SVG is refused, random file names)

## [0.7.1] - 2026-09-30
### Fixed
- Admin detection: the cache started at monotonic time 0, so within the first minute after a host boot the check was skipped (also made the CI test fail on fresh runners)

## [0.7.0] - 2026-09-30
### Added
- Live mode: **whole-room control.** Below a light's or scene's controls (and at the top of the room panel) there is "Ganzer Raum": switch all lights of the room on/off, brightness, colour and warm/cold white for all of them, plus the room's **scenes** as buttons (lights and scenes of the room = placed inside it or in its HA area)
- **Effects** for lights that report an `effect_list` (Nanoleaf, WLED, Hue ...): drop-down in the live popup, for a room the effects all its lights share. The service whitelist allows `effect` for lights only
- Settings → "Benutzer & Tablets": the user is picked from the **Home Assistant users** (new endpoint `/api/users`, editors only; typing still works), with room and **live view** per user (3D only / 2D only / 2D + 3D / switchable)
### Changed
- Live mode shows **only the 3D view** by default; the 2D and 2D + 3D buttons are hidden unless the user was given more in the settings (`userViews`, delivered through `/api/me`)

## [0.6.0] - 2026-09-30
### Changed
- **Permissions:** Home Assistant administrators now always get the full editor; all other users only get the read-only live view (before, an empty `editors` list let everybody edit). `editors` still allows extra non-admin editors. The administrators are read from Home Assistant (websocket `config/auth/list`, cached for a minute); if that fails, only users in `editors` may edit and the status line says so
- The wall height setting now applies to all walls (it only affected new walls before). Renamed to "Wandhöhe (alle Wände)"; individual wall heights can still be changed in the properties panel

## [0.5.1] - 2026-09-30
### Added
- Search field above "Entitäten im Raum" (edit mode): filters the room's devices, openings and unplaced area entities by name, entity id or area

## [0.5.0] - 2026-09-30
### Added
- New devices "Lichtkugel" (light ball) and "LED-Streifen" (1 m LED strip, scale it to the real length) for LED strips and accent lights; link them to any light entity
- Lit device parts (all lights, balls, strips) take the colour of the light entity in 3D

## [0.4.1] - 2026-09-30
### Changed
- Entity picker in the properties panel is full width with a roomy result list: names wrap instead of being cut off, the entity id is shown below, groups by area, and the current link is shown above

## [0.4.0] - 2026-09-29
### Added
- Searchable entity picker in the properties panel (devices and door/window contact sensors): search by name, entity id or HA area (several words = AND), Enter assigns the first match

## [0.3.1] - 2026-09-29
### Fixed
- Dockerfile: default base image for `BUILD_FROM`

## [0.3.0] - 2026-09-29
### Fixed
- Add-on config: removed defaults (`boot`, `ingress_port`, `startup`) and the deprecated `armv7` architecture, so the add-on linter passes

### Added
- 2D blueprint editor (new `plan2d.js`): top-down SVG plan with grid, wall lengths, door swings, window symbols, room areas and furniture footprints. Draw walls/rooms, place doors/windows/devices, move everything (corner handles for walls and rooms, connected walls and room corners follow), erase, pan and zoom (wheel, right/middle drag, pinch). It edits the same layout as the 3D view; the new "2D + 3D" split view updates both live. Also works in live mode (states shown, tap to control)
- Room selection: the room's list (all furniture, devices and doors/windows in it) stays visible; clicking an entry selects and locks it so only that object moves. Esc/"Lösen"/clicking it again goes back to the room
- Selection lock: choosing an object from the side list locks the selection. Clicks and drags in the 3D view then only move that object (from anywhere); release with the list entry, the "Lösen" button or Esc
- Edit mode: side list of all rooms, walls, doors/windows and devices of the floor for selecting objects that are hard to hit in 3D; devices now have X/Z position fields
- Edit mode: selecting a room lists its entities (placed devices with their assigned entity and live state, plus unplaced entities of its HA area with a "+ place" button); a selected device shows its entity and state
- Home Assistant areas: a room can be linked to an HA area (room properties). Entity pickers are grouped by area with the room's own area first, the search also matches area names, and the room panel additionally lists lights/covers/etc. of the area that are not placed on the plan (new endpoint `/api/areas`)
- Live mode: tapping a light opens colour controls (8 presets, colour picker, warm/cool white, brightness); the room glow follows the chosen colour. The service whitelist now allows `rgb_color` and `color_temp_kelvin` for lights only
- 17 new furniture types: chair, armchair, desk, dining table, coffee table, wardrobe, shelf, sideboard, kitchen unit, fridge, washing machine, bathtub, toilet, washbasin, shower, rug, car
- Permissions: add-on option `editors` limits who may edit; other users get a read-only live view (enforced in the backend, HTTP 403); the panel is now open to all users (`panel_admin: false`)
- Tablet per room: assign a Home Assistant user to a room in the settings; that screen starts with only the room and a button that toggles to the whole floor (`?room=` also works)
- Floors below are shown with everything, just dimmed: lit rooms and lamp glow, room names, sensor values, power badges, door and window states
- Floors below shine through the current floor (see-through floor plate, ghosted walls and devices); strength adjustable in settings (*Floors below visible*); demo now has an upper floor
- Door and window contacts: bind a sensor (binary_sensor, cover or lock) to any door or window; open ones turn red, doors swing open and windows tilt, a red "N open" pill shows the count, the room panel lists doors and windows with their state, tap one in live mode for details
- Room isolation: tapping a room pill (or the room floor in live mode) shows only that room with its walls and devices
- Light spreads from each lamp's position with falloff, in the lamp's (RGB) colour and brightness, only inside its own room; coloured glow climbs the walls
- Room panel (entities per room) also in edit mode and by tapping a room
- Settings: wall opacity, lamp reach/strength/glow height, default light colour, background colours, freely editable colour scales for temperature and humidity views
- Hologram backdrop: royal-blue gradient with teal corner glow, fainter grid
- Heat views *Normal / Temp. / Feuchte* colour rooms by sensor values; power sensors (W) appear as glowing orange badges
- Room panel in live mode: tap a room pill to see all its entities grouped (lights, covers, media, switches, sensors) with brightness and cover-position sliders
- Room area (m²/ft²) shown in the 2D view
- Backend: `/api/service` accepts `brightness_pct` (lights) and `position` (covers, `set_cover_position`); `/api/entities` returns brightness and position
- Hologram theme (new default): translucent blue walls with neon edges, wireframe devices, teal windows, orange doors; active devices and rooms with a light on glow orange (theme *Hologram*, dark and light remain available)
- Navigation pills above the scene: floors, rooms (tap to focus the camera), *Auto* (cutaway) and *Walls high/low*
- Git guide for beginners (`docs/GIT-EINSTIEG.md`)
- Cutaway: walls facing the camera sink down automatically so you can see into the rooms (setting: *Lower walls facing the camera*)
- Single-file demo (`demo/`): the real editor with an example apartment and simulated devices, runs by double-click

### Changed
- Steeper default 3D camera, room names always readable

### Fixed
- The status text no longer sits in the toolbar and pushes it into a second row, which shifted the view under the mouse while drawing
- Doors/windows: hit boxes now match their real size, and an unselected door/window is only selected by the first click (dragging starts on an already selected one), so stray clicks no longer move it
- Temperature/humidity view works on every floor and for every room: sensors are matched by unit or device_class (also °F), climate entities count with their current values, and sensors assigned to the room's HA area are included even if not placed
- Doors and windows can be selected, moved and resized again, also while their wall is lowered by the cutaway (unscaled hit boxes with an outline); door/window hit boxes win over devices behind them
- Lamp light on floors below stays visible through several floors above (lit floor areas are more opaque); demo has a third floor
- Labels and badges are rendered at 4x resolution and stay sharp when zooming in; minimum zoom distance so the camera cannot enter objects
- Room isolation cuts long walls down to the part that borders the room, so no walls of other rooms remain
- Device popup no longer overlaps the Normal/Temp./Feuchte buttons
- Lamps and other devices can be tapped through lowered or see-through walls (devices take priority over walls when picking; walls are ignored in live mode)
- Small devices (ceiling lamps, switches) are easier to select and tap thanks to an invisible, padded hit box

## [0.2.0] - 2026-09-29
### Added
- Settings dialog: language (DE/EN), light/dark theme, metric/imperial units, grid size, default wall height and thickness, shadows, value labels, autosave delay; stored server-side in `/data/settings.json`
- Doors and windows are real wall openings (walls are cut, frames and leaves are modelled); drag along the wall, overlap protection, width/height/sill/position editable
- Custom GLB models: upload, model library, placement like built-in devices (auto-scaled to 1 m, adjustable)
- Live mode: tap a device to see its state and control it (lights, switches, fans, covers, locks, scenes, scripts); sensor and climate values are shown next to the device
- Kiosk mode for wall tablets via `?kiosk=1` (also `?mode=live`)
- "Fit" button, backend tests (pytest) and browser end-to-end test

### Changed
- Service calls are restricted to a whitelist of domains and services
- Frontend split into modules (`walls.js`, `models.js`, `i18n.js`)

### Fixed
- Uploaded file names with special characters are decoded correctly

## [0.1.0] - 2026-09-29
### Added
- Home Assistant add-on with Ingress
- Wall, room and floor drawing with snapping grid
- 3D and 2D view, 12 built-in device models
- Entity binding, toggle on double-click, auto-save, undo
