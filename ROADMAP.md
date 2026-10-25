# Roadmap

✅ = done · ⬜ = still open

Progress is tracked with [milestones](https://github.com/BuRnEd4AiM/HA-Floorplanner/milestones) and [issues](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues). Dates are targets, not promises.

## Open

- ⬜ Faster on tablets: measure first, then speed up the slow parts ([#138](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/138); the performance display 3.60.0, fewer draw calls 3.89.0 and the furniture drawn together in the live mode 4.21.3 are the first steps)
- ⬜ Verified on real Home Assistant installs, the goal of 1.0 (the short list of what to check first is at the top of [docs/TESTPROTOKOLL.md](docs/TESTPROTOKOLL.md))

Not planned: sun light and shadows through the windows by the position of the sun ([#68](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/68), closed).

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

## Done in 3.59 – 4.2

- ✅ 🔔 The doorbell on every wall tablet: the camera at the door, open the door (it asks once more), a gong; bells and cameras found by themselves (4.22.0)
- ✅ Quick access: lights off for the whole house or a group of rooms (two taps), favourites in front of the room tiles, "what is still on?", low batteries stand out, undo note after deleting, all keys on one card, recently used furniture (4.2.0) ([#471](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/471))
- ✅ Tab bar at the bottom, the add-on as the only dashboard, step 1: 🏠 the house and 📷 the cameras as a page, tabs and start tab per user, the dashboard card with tabs and as a wall tablet without Home Assistant's sidebar, ⛶ full screen (4.3.0) ([#479](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/479)), 🎵 music, 🧺 household, ▶ routines, 👨‍👩‍👧 family (docs/PLAN-4.3.md)
- ✅ Tabs, package 1: ☀ today (time, weather and forecast, calendars, waste, who is home, what needs a look, power now) and ⚡ energy (day, week, month, year from the long-term statistics, cost, biggest users, gas and water, several houses with their own meters) (4.4.0) ([#481](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/481))
- ✅ Tabs, package 2: 🌡 climate (rooms with target, air, open windows), ▶ routines (scenes and scripts, "Ich gehe" / "Gute Nacht" with their check, automations on / off) and 👨‍👩‍👧 family (people, the phone's battery, a pinboard for everybody) (4.5.0) ([#483](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/483))
- ✅ The pages arranged like a Home Assistant dashboard: move and hide cards, twelve kinds of own cards, own pages, the order of the bar (4.6.0) ([#484](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/484))
- ✅ Full screen kept on for a user (a wall tablet), only a code ends it (4.7.0) ([#487](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/487))
- ✅ The last two pages of the tab bar: 🎵 music & TV (players, radio stations, rooms together) and 🧺 household (washing machine, dryer, dishwasher by their state or their power, robot vacuum, shopping list) (4.8.0) ([#490](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/490)); next: the doorbell on every tablet (`6-klingel.jpg`, docs/PLAN-4.3.md)
- ✅ Walls with a finish (woodchip, plaster, wallpapers, tiles, brick, wood …), tiles up to a height, accent walls, the facade outside, many more floors, every pattern with its colour, size and angle (4.0.0) ([#448](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/448))
- ✅ The settings in groups that fold open, with a search; what the alarm panel is and which one Home Assistant has (4.0.1) ([#450](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/450))
- ✅ Users & tablets inside the settings; WhatsApp on alarm in three steps (4.0.3) ([#454](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/454))
- ✅ The add-on's own holiday alarm with a lock screen and a code, Telegram (also groups), notify services to tick (4.1.0) ([#456](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/456))
- ✅ The holiday alarm does not lock out editors (red strip and frame instead), message targets sorted by where they come from, Home Assistant's own Telegram bot (4.1.1) ([#460](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/460))
- ✅ The demo checked through: room labels from edit mode, security with recorded days, batteries, backup download, import examples (4.1.2) ([#462](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/462))
- ✅ Room labels in the whole-house view: nothing in the picture but the floor cards (4.1.3) ([#464](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/464))
- ✅ Phones held upright: values folded into one 📊 button, small floor cards beside the house, phones only show the house (3.59.0 – 3.63.0) ([#288](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/288), [#290](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/290), [#292](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/292), [#294](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/294), [#299](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/299))
- ✅ Performance display: FPS and more in the View menu (3.60.0)
- ✅ Lock things per user / tablet (switching, details, cameras, power …) (3.61.0)
- ✅ Several selected things move together (3.62.0)
- ✅ Security: what switched in the house recorded per day, a time line to play it back (3.64.0 – 3.66.0) ([#317](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/317))
- ✅ Start view can be chosen, backup in its own dialog (3.66.0) ([#315](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/315), [#321](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/321))
- ✅ LED ring sections in their own colours while editing (3.67.0) ([#325](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/325))
- ✅ Renamed in Home Assistant, renamed in the plan (3.68.0)
- ✅ Roller shutters on every window, a shutter card like in Home Assistant (3.69.0 – 3.70.0) ([#331](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/331), [#335](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/335))
- ✅ Browser test in parts, all at the same time in CI (3.69.1)
- ✅ Long shed dormer, roof with steps, windows of the rooms through a dormer (3.71.0 – 3.74.0) ([#339](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/339), [#341](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/341), [#342](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/342), [#345](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/345))
- ✅ Dashboard card for Home Assistant (HACS), also one room or only its controls (3.75.0 – 3.78.0) ([#13](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/13), [#348](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/348), [#352](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/352), [#356](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/356))
- ✅ Example: show house with everything in it (3.77.0)
- ✅ Lamps on a relay light the floor, own light colour per lamp (3.79.0) ([#367](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/367))
- ✅ Kitchen: wall cabinet per module (3.80.0) ([#372](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/372))
- ✅ Heaters show their temperature, contact sensors with a green frame, device overview with battery levels, offline marks in 3D (3.81.0) ([#374](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/374), [#375](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/375), [#376](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/376))
- ✅ Power editor tab "⚡ Rechnung": which sensor is what and how it is counted (3.82.0) ([#378](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/378), [#379](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/379))
- ✅ Camera card with the live video (3.83.0 – 3.83.2) ([#381](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/381), [#383](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/383), [#385](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/385))
- ✅ Library: Scandinavian furniture, sauna, fitness, bar, home cinema, PC desk, LED mirrors with zones, swivel TV, air conditioners and fans, garage, workshop and carport (3.84.0 – 3.90.0)
- ✅ Floors stacked like a real house ("Aufeinander"), smoother on the iPad (3.88.0 – 3.89.0) ([#391](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/391), [#392](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/392), [#394](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/394), [#396](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/396))
- ✅ Measuring in the 2D plan: length, distance and angle of two walls (3.91.0) ([#399](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/399))
- ✅ Bar with something hanging from the ceiling (3.92.0) ([#401](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/401))
- ✅ Redo, copy / paste / duplicate, no overwriting when two screens edit at the same time, spiral stair rail per floor (3.93.0) ([#403](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/403), [#404](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/404), [#405](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/405), [#318](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/318))
- ✅ Several buildings in one plan: switch, roofs per building, per user, bring another house in (3.94.0) ([#409](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/409))
- ✅ Energy: take over the energy dashboard of Home Assistant, set-up check list, gas and water meters in one click (3.95.0) ([#407](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/407))
- ✅ More devices switched in the live card: music and TV, robot vacuum, fan, presets and fan modes of thermostats, alarm panel with code, buttons, choice lists (3.96.0) ([#406](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/406))
- ✅ A message by WhatsApp (CallMeBot or a notify service of Home Assistant) when the alarm, a smoke, gas, CO or water sensor goes off, with the place in the plan (3.97.0) ([#414](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/414))
- ✅ Sky by the time of day and the weather in it, rain warning per window, energy flow as a picture, room tiles in live mode, tool bar with icons and groups (3.98.0) ([#418](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/418), [#419](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/419), [#420](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/420), [#421](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/421), [#422](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/422))

## Done in 3.26 – 3.58

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
  - ✅ The ideas of the comment of [#136](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/136#issuecomment-5981634564): separate import / export sensors and flipping the sign (3.82.0), setup check list and taking over the energy dashboard (3.95.0)
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
- ✅ Roof with steps for a house narrower at the front, dragged in the 2D plan (3.73.0) ([#342](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/342)); the windows of the rooms show through a shed dormer (3.72.0) ([#341](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/341))
- ✅ Long shed dormer (Schleppgaube): part of one roof side raised, placed in metres from the gable; a hole in the roof under every dormer (3.71.0) ([#339](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/339))
- ✅ See-through roof over a chosen room or floor (3.55.0 – 3.56.0) ([#273](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/273))
- ✅ Phones: room sheet, tool bar as a ☰ menu, floors and rooms as drop-downs next to ☰, everything on one upright screen, no iPhone zoom on the search (3.54.0 – 3.57.2) ([#284](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/284)) ([#281](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/281)) ([#267](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/267), [#271](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/271), [#277](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/277))
- ✅ Split a wall at an exact distance or into equal parts, double click on a selected wall always splits it (3.58.0) ([#286](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/286))
- ✅ Demo runs directly on GitHub Pages, always updated automatically (3.54.0) ([#133](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/133))
- ✅ `app.js` split into smaller modules (about 5,100 → 1,500 lines, see [docs/MODULE-PLAN.md](docs/MODULE-PLAN.md)); new features go into their own module ([#137](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/137))

## v0.8 – Live sync – done in 3.6.0

- ✅ Live state updates via WebSocket instead of polling (3.6.0)
- ✅ Native Home Assistant more-info dialog for tapped devices (3.4.0)
- ✅ Auto-place all entities of an area (3.5.0)

## v0.9 – Dashboards

- ✅ HACS Lovelace card to show the floor plan on any dashboard (3.75.0) ([#13](https://github.com/BuRnEd4AiM/HA-Floorplanner/issues/13))
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
