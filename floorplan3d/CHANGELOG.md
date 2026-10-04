# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [3.29.0] - 2026-10-05
### Added
- **Compass** in the 3D view (bottom left): the rose turns with the camera (north is up in the 2D plan) and says from which side of the house you look, e.g. *View from S* (7 languages).
- **Live mode, finger boxes (#130)**: lamps and other things get a bigger invisible hit box (at least 60 cm) that only the live mode uses.
### Changed
- **Live mode (#130)**: only things that are linked to something (an entity, a TV backlight, an LED ring with lights) can be tapped. Furniture without a link no longer takes the tap away from the lamp behind it. **Doors and windows have no hit box** in the live mode any more (in the edit mode everything can still be picked).
### Fixed
- **A wall that never became see-through (or never sank)** on the ground floor: the centre of the house, which decides which walls face the camera, was taken from everything of the floor, so a garden (trees, fence, lawn) far south pulled it away and the south wall counted as an inner wall. It is now the centre of the walls.

## [3.28.1] - 2026-10-05
### Changed
- **See-through** is now a button in the *View* menu (next to *Auto* and *Halbschnitt*), not only a checkbox in ⚙.
- **See-through and Auto exclude each other** (both in the View menu and in ⚙): switching one on switches the other off.
- With *See-through* on, the **roof** is see-through from any distance too (30 %), so it hides nothing behind it. Before, it was fully solid beyond about 7 m.

## [3.28.0] - 2026-10-05
### Added
- **See-through walls** (option in ⚙: *Make walls facing the camera see-through instead of lowering them*): the walls between the camera and the room fade to 30 % instead of sinking, so you see everything in the room (#129).
- **Second tap leaves the room**: in the live mode a second tap into the room you are in goes back to the view before, e.g. the floor or the whole house with the same camera (#128).
### Changed
- **View menu at the bottom**: the *View* button now sits in the bottom bar next to Normal / Temperature / Humidity / CO₂, and its menu opens upwards (#132).
- **Half section** also takes away what hangs above the cut (ceiling lamps, LED rings, pictures high on a wall), so nothing floats in the air above the cut walls (#131).

## [3.27.1] - 2026-10-05
### Changed
- **Backup panel in the side panel**: the labels of the three number fields now sit above the fields instead of wrapping in a narrow column over five lines.
- The log line at the start of the add-on is in English (`Starting 3D Floorplan on port 8099 ...`).
- **CI**: the browser end-to-end tests (253 checks) now run on every push and pull request as the job `e2e`.

## [3.27.0] - 2026-10-05
### Added
- **New-version notice**: in the edit mode the version pill checks GitHub once at the start and then every 5 minutes. When `main` has a newer version it turns blue: **⬆ New version available · v…**. Only the public `manifest.json` is fetched. Can be switched off in ⚙ (`updateCheck`, on by default). Before, the comparison ran only when the button in the version dialog was pressed (#140).
### Fixed
- **Version dialog over plain `http`**: it said "Browser: check not possible here (no secure context)". The checksums are now calculated with a built-in SHA-256 when the browser's own function is not available, so the browser check works there too (#144).
### Changed
- `SECURITY.md` names the only outside request (the version check) and says that backups are not encrypted.

## [3.26.1] - 2026-10-05
### Fixed
- **Pulled-apart view**: with a basement only the upper floor and the roof were lifted, the ground floor stayed on the basement. Now every floor gets its gap, the lowest one stays in place (#146).

## [3.26.0] - 2026-10-03
### Added
- **Welcome card on an empty house** with three ways to start: *Draw walls*, *Try the example house*, *Import a house from JSON*. Shown in edit mode until the house has content or the card is closed
### Changed
- **First start**: a new install follows the **language of the browser** (*Auto*, was German) and starts in the **dark design** (was *Hologram*). Existing settings are not touched. The default names "Erdgeschoss" and "Haus" of a brand-new house are shown in the language of the user
- **Add-on store listing**: icon and logo (`icon.png`, `logo.png`, drawn by `tools/make_addon_icons.py`), labels and descriptions for the options on the configuration page (English and German, `translations/`), English add-on description

## [3.25.1] - 2026-10-03
### Fixed
- **Double click on a wall** did nothing where the generous reach of a door or window (also one on the neighbouring wall) or of a device lay over the wall. Now only the real door, window or device wins; beside it the wall is split

## [3.25.0] - 2026-10-03
### Added
- **Version and checksum in the top bar**: a pill with the version and a short checksum (`✓ v3.26.0 · a1b2c3d`), green when the files of the add-on and the files the browser loaded both match the committed manifest (`manifest.json`, written by `tools/make_manifest.py`, checked by the tests). The dialog behind it lists the checks and can compare with the manifest on GitHub (`main`): same state, newer version available, or different. *Reload (clear cache)* when the browser shows old files
### Changed
- Double click on a wall: the corner may now be 10 cm from the end of the wall (was 20 cm)

## [3.24.1] - 2026-10-03
### Fixed
- **Double click on a wall** is more forgiving: a few pixels beside the line count as the wall (also in the 2D + 3D view, where the plan is small), also when a room lies under the pointer. Where no corner fits (too close to the end of the wall, on a door or window) the status line says so instead of doing nothing. The select hint mentions it

## [3.24.0] - 2026-10-03
### Added
- **Automatic backups**: *Houses & backup → Automatic backup*. Switch on, set the interval (hours, 24 = daily), how many days and how many automatic backups are kept; old ones are deleted by themselves (the newest automatic one stays, manual ones are never deleted). Stored in the configuration folder of the add-on (`addon_configs/…_floorplan3d/backups`), so they survive updates and reinstalls. **Back up now**, **Check** (reads a backup like a restore would, changes nothing), **Restore**, download and delete from the list. The schedule runs inside the add-on
- **A placed device stays selected**: after placing a device you can move it at once (drag, arrow keys, side panel); the next click on empty space deselects it and placing goes on with the same device type. Can be switched off in ⚙ (*Keep a newly placed device selected*)
- **Double click on a wall adds a corner** in the 2D plan: the wall becomes two walls (doors and windows stay with their piece, rooms along the wall get the corner too, Ctrl+Z takes it back)
### Changed
- The opening palette (*Tür/Fenster*) is grouped: **Doors**, **Passages and gates**, **Windows**
### Fixed
- **Settings were overwritten with defaults** when something saved the settings before the ⚙ dialog had been opened (for example the *Auto* switch in the *View* menu): the settings form is now filled as soon as the settings are loaded

## [3.23.0] - 2026-10-03
### Added
- **Customisable tool bar**: the **✎** button opens *Customise tools*: show or hide every tool, change the order, and fold rarely used tools into a **More ▾** menu. Stored per browser. New buttons **Dormers** (opens the dormer section of the roof floor, creates a roof floor if needed) and **Import house** (folded into *More* by default)
- **Users & tablets**: the room list is grouped by house, and every room shows its floor (*Living room · Ground floor*), so you can see where a room is, also across several houses

## [3.22.0] - 2026-10-02
### Added
- **Roof size by hand**: in the panel of the roof floor, *Set size manually* lets you set left, top, width and depth of the roof (before the overhang), for example to leave an attached garage out. Also in the JSON import as `roof.box` (`x0`, `x1`, `z0`, `z1`)
### Changed
- The demo house now has two roof dormers, so they can be tried without the add-on
### Fixed
- **Ground**: the earth is now cut out only where there is a basement. Parts of the ground floor without a basement (e.g. an attached garage) used to get a hollow space down to the basement depth (#93)
- **Arrow keys switch the floor** (#98): with nothing selected, arrow up / down go to the floor above / below (with a selection they still move it)
- **View menu**: the switch *Floors in plan* is hidden in the pure 3D view, where there is no plan (#99)
- **Users & tablets**: *Create / save file* (and the first change in the dialog) no longer switch the design to *Hologram* (#100). The settings form was only filled when the ⚙ dialog had been opened before, so saving wrote its defaults back

## [3.21.0] - 2026-10-02
### Added
- **Roof dormers (Dachgauben)**: in the panel of the roof floor there is a new section *Dormers* with **+ Dormer**. Every dormer stands out of one roof slope in 3D with its own little roof, a front wall and a window. Per dormer: *roof side* (A / B), *position along the ridge* (slider), *width*, *wall height*, *distance from the eave*, *dormer roof* (gable or flat) and *window* on/off. Values are limited so that a dormer always fits under the ridge (a hint shows when it cannot fit). A flat main roof has no dormers
- **Dormers through the API**: the JSON import (`POST /api/import`, `building.roof.dormers`, also in a floor of kind `roof`) and the export (`GET /api/export/property`) know dormers; the schema `property.schema.json`, the guides `docs/IMPORT.md` / `docs/IMPORT.en.md` and the example `house.json` describe them. Invalid values are replaced by defaults with a warning (at most 20 dormers; a flat roof ignores them). `PUT /api/layout` stores them as `floors[].roof.dormers`
- Unit tests for the dormer geometry (`tests/dormer.test.mjs`, also in CI) and browser checks

## [3.20.1] - 2026-10-02
### Added
- **Users & tablets: button "Create / save file"**: writes `users.json` into the Home Assistant folder at once (and creates it if it is not there yet). Before, the file only appeared after the next save, and *Synchronise* then said "not found"; that message now explains what to press
- After an update from an older version the add-on creates `users.json` by itself at start when users or tablets are already stored (it never overwrites an existing file)
### Changed
- README pictures (3D, 2D, 2D + 3D, whole house, room, light, LED ring, ground, device library, import, the tour GIF) taken anew from the current demo: they show the floor rail, the *View* menu and the floors box in the plan

## [3.20.0] - 2026-10-02
### Added
- **Users & tablets as their own tab in the top bar**: the management of users, rooms and views is no longer hidden in the gear (⚙); administrators now see a **Users** button at the top (hidden for everybody else and in the read-only view)
- **Users & tablets survive updates and reinstalls**: every change is also written to the file `users.json` in the add-on configuration folder of Home Assistant (`addon_configs` → `…floorplan3d`), where it can also be edited by hand. The new button **↻ Synchronise** in the Users dialog reads that file back; a line below it says whether file and add-on match. After a fresh installation the users and tablets are taken from the file by themselves
- New interface endpoints `GET /api/users-file` and `POST /api/users-file/sync` (editors only; `{"direction": "save"}` writes the file from the add-on)
### Changed
- The page has its own inline favicon, so the browser no longer asks for `/favicon.ico` (a harmless 404 in the console)
- Test log `docs/TESTPROTOKOLL.md`: what was tested, when and by whom

## [3.19.1] - 2026-10-02
### Changed
- **Floors in the plan: switch and legend in the corner of the plan**: the colour legend was at the bottom right of the plan and the buttons *Normal / Temp. / Feuchte* covered it, and the switch was only in the *View* menu. Both are one small box now at the top right of the plan (only while the plan is shown): a button *Floors in the plan: below* that switches *off / below / all*, and under it one line per floor outline with its colour. The switch stays in the *View* menu too

## [3.19.0] - 2026-10-02
### Added
- **Other floors in the 2D plan**: the plan (2D and 2D + 3D) shows the other floors as outlines, each in its own colour, with a small legend at the bottom right, so you can place walls and rooms exactly over the floors below (e.g. the ground floor while you draw the attic). *View ▾* → *Floors in the plan* switches between *off*, *below* (all lower floors, the default) and *all* (every other floor); the choice is remembered. Before, only the floor directly below showed, faintly

## [3.18.0] - 2026-10-02
### Added
- **Garage door** (#86): new opening *Garagentor* (sectional door). With a cover entity (e.g. `cover.garagentor`) or a contact sensor it shows open and closed: the slats roll up under the lintel, and a tap in live mode offers *Open / Close / Stop*. A door on its way (`opening` / `closing`) counts as open
- **Doors, gates and windows grouped** (#86): in the room panel and in the list behind the *open* button the openings are under their own headings *Doors*, *Gates* and *Windows*; a gate or shutter-like opening with a cover entity can be driven right from the room panel. A door on the edge of a room is now assigned to that room in the list
- **Roof terrace** (#87): a room can be marked *Dachterrasse (offen, mit Geländer)*. It gets a wooden floor and a railing along every edge that has no wall; the roof of the house leaves it out, and what lies below it (a garage)
- **Demo**: a garage with a garage door and the car under a roof terrace with a door from the guest room, table and plants (also importable: `doorGarage`, `"terrace": true`)

## [3.17.1] - 2026-10-02
### Fixed
- **Camera field of view stayed behind**: when you moved a camera, its cone on the floor stayed where it was. The cone now moves along with the camera

## [3.17.0] - 2026-10-02
### Changed
- **Movement in the cameras drop-down**: the *📷* button now names the room where movement was detected (*Bewegung erkannt: Wohnzimmer*, or *Bewegung in 2 Räumen*) and turns red. Its drop-down groups everything by room, with the floor next to the room name so equal room names on two floors are not mixed up; rooms with movement come first with a red *Bewegung erkannt* mark. Besides the cameras the drop-down now also lists the motion and presence sensors placed in the plan (🔔), so a room with a motion sensor but no camera shows up too

## [3.16.0] - 2026-10-02
### Changed
- **Rooms as a drop-down**: the row of room buttons at the top is one button *Zimmer ▾* now. It lists all rooms (in the whole-house view grouped by floor, top floor first), shows a green dot while somebody is in a room, and the button carries the name of the room you are in. No more scrolling a long row on a tablet
- **Cameras: straight to Home Assistant**: every camera in the overview has a clear button *In Home Assistant öffnen* (live view, history, settings of the camera entity); a tap on the picture does the same. Outside Home Assistant (demo file) it tells you why it cannot open

## [3.15.0] - 2026-10-02
### Added
- **Cameras at a glance**: a new button *📷 n* in the top bar (only when the plan has cameras) opens a drop-down overview with the still image of every camera, its floor and room, and a red *Motion detected* badge; the button itself turns red and says *n motion* while a motion sensor reports movement. *Show in the plan* jumps to the camera, a tap on the picture opens Home Assistant's live view

### Changed
- **View menu**: *Auto*, *Halbschnitt*, *Auseinander* and the wall height moved into a drop-down *View ▾* at the top. The buttons that need attention stay outside: *offline*, *open* and the cameras

## [3.14.0] - 2026-10-02
### Added
- **Shipped 3D model library**: 120 free models (Kenney Furniture Kit, CC0: furniture, kitchen, bathroom, plants, lamps, appliances) come with the add-on and show up in the model list of the device tool, the search box filters them too. They cannot be deleted; an own upload with the same name takes precedence. Sources and licence in `library/CREDITS.md` (#79)
- **Detect rooms** (#17): the new button *Räume erkennen* next to the room tool creates a room for every closed loop of walls on the floor (walls that meet, cross or end on another wall count; dead ends do not). Rooms that already exist are left alone, so it can be used again after drawing more walls; one undo step takes it back
- **Cameras with a field of view** (#69): a camera shows its field of view as a cone on the floor (device panel: *Sichtwinkel*, *Reichweite*; angle 0 = no cone). Choose a motion sensor and the cone turns red and pulses while it reports movement. In live mode a tap on the camera or on its cone shows a still image that is renewed every 5 seconds; the ⓘ button (or a tap on the picture) opens Home Assistant's live view. The cone is also drawn in the 2D plan
- **Room panel by kind** (#67): lights (with *Alle aus*), covers, heating, media, switches, cameras (with the still image), sensors, scenes & scripts. Switches are slide switches like on a phone instead of *Toggle* buttons. On phones and tablets held upright the panel comes up from the bottom
- Camera still images can be switched off in ⚙ (*Show camera still images*): everybody who may open the panel sees these pictures, so this is a privacy switch. The add-on only fetches jpeg / png / gif / webp from `camera.*` entities
- **Demo**: two cameras (one with movement), a scene and a script, so these features can be tried without Home Assistant

### Fixed
- **Green plot outline in live mode**: the outline of the plot (a drawing aid) is only shown in edit mode now

## [3.13.0] - 2026-10-02
### Added
- **Open windows and doors list**: tap the *n open* button at the top and a list shows which windows and doors are open, with floor and room; a tap on an entry jumps to it in the plan
- **Hide the presence figure**: a presence / person device now has the box *Figure invisible in live mode*. The figure is not drawn in the room, but the dot at the room button at the top still shows where somebody is

### Removed
- **Groups** (tool *Gruppe*): it did not work reliably and was not used. The tool, its panel and the group buttons in the device panel are gone; devices that were grouped before simply behave as single devices now

### Fixed
- **Value badges covering each other** (e.g. two lamps at one spot): badges that would overlap on the screen are now stacked below each other
- **Floor cards in the 2D + 3D view** appeared over the 2D plan. They now stay inside the 3D view (and are hidden in the 2D-only view); where there is no room beside the house they get narrower, one value per line

## [3.12.0] - 2026-10-02
### Added
- **Pull the house apart** (#65): in the whole-house view the new *Auseinander* button lifts the floors above ground apart, so you can look into every one; a second tap stacks them again
- **Floors below the open floor** (#65), in ⚙: *dimmed* (as before, see-through), *stacked* (clearly visible) or *hidden*
- **Value badges** (#66): readable badges with a symbol right on the device, e.g. "🌡 21.4 °C", "⚡ 95 W", "↕ 70 %" (shutter), "💡 80 %" (light), the running app on a TV. ⚙ → *Value badges on devices*: *Important* (measurements, climate, shutters; as before), *All devices* or *None* (replaces the old on/off box)
- **CO₂ colouring** (#70): a third button *CO₂* next to *Temp.* and *Feuchte* colours the rooms by the CO₂ sensor of the room (400 – 2000 ppm, colours adjustable in ⚙). A colour scale at the left edge (beside the floor rail) shows every colour stop with its value, for temperature, humidity and CO₂
- In the whole-house view the room buttons at the top list the rooms of **all** floors (top floor first); a tap opens that floor and the room
- **Demo** (`demo/floorplan3d-demo.html`) now also shows a stair with its stairwell, a floor opening in the attic, the roof as top floor, CO₂ sensors, a TV with its app and a shutter with its position, so all new features can be tried without Home Assistant

## [3.11.0] - 2026-10-02
### Added
- **Floor rail** (#63): on wide screens the floors are now a column of thumbnails at the left edge (top floor first, with a *Whole house* button on top) instead of the floor pills. A tap switches the floor; the thumbnails are drawn from the plan itself in the colours of your theme (room colours, walls, doors, windows, roof; neon lines in the hologram theme) and follow your changes. Narrow screens and wall tablets keep the pills
- **Floor cards** (#64): in the whole-house view a small card floats beside every floor with its rooms, lights on and windows open; a tap opens that floor
- **Half section**: new *Halbschnitt* button next to *Auto*. Every wall is cut at half height and only the lower half stays, so you can look into all rooms from any side; doors and windows are cut off cleanly
- **Arrow keys** (#71): move the selection by one grid step; Shift = 10 cm, Alt = 1 cm. A door or window slides along its wall
- **Opening without a frame** (#71): new *Öffnung (ohne Rahmen)* in the door and window palette, a bare hole in the wall (also available as `doorGap` / style `gap` in the JSON import)

### Fixed
- **Basement covered by a green layer**: with a plot drawn, the lawn area at ground level lay over the basement when you opened it. It is no longer drawn there
- **Stairs can be made shorter**: a straight stair could not be shorter than 2.88 m because a tread had to be at least 18 cm deep. Treads may now be 10 cm deep, so a stair can be as short as 1.6 m (for a 3 m floor)

Ideas for the floor rail, cards and arrow keys from [NeonPlan 3D](https://github.com/Mastershort/neonplan3d) (MIT). A height per wall already existed (select a wall, field *Höhe*).

## [3.10.0] - 2026-10-01
### Added
- **Floor opening** (*Bodenöffnung*): new tool in edit mode. Draw an opening into the floor of a level in the 2D plan (stairwell, gallery, void); the floor is open there and a placeholder block below is cut too. Select it to drag its corners, Del removes it
- **Warnings** (#58): smoke, gas, carbon monoxide and water sensors, a triggered alarm panel and a window open while it rains (from the weather entity) show a red banner at the top and the room flashes red; a tap jumps into the room. Needs no setup. ⚙ can switch them off, jump to a new warning by itself, and choose the weather entity
- **"Where is …?" search** (#62): the 🔍 button at the bottom left finds devices, windows and rooms on every floor by name; the camera goes there and a ring marks the device
- **Wall-tablet kiosk** (#61), in ⚙ → *Wall tablet: warnings and kiosk*: back to the start view after some minutes without a touch, the house then turns slowly as a screen saver, and the view is dimmed at night (by the sun or by the clock); the first touch only wakes the screen

Ideas for warnings, search and kiosk from [NeonPlan 3D](https://github.com/Mastershort/neonplan3d) (MIT).

## [3.9.5] - 2026-10-01
### Fixed
- **Stairwell closed by a placeholder block**: when the floor below is a block (a floor you did not draw), the block filled the stair opening and hid the stair. The stairwell is now cut out of the block, so you look down the stair (#55)

### Changed
- **New screenshots and screen recordings** in the dark theme instead of the hologram look: README, quick tour, import guide (German and English) and the import recording; the downloadable demo opens in the dark theme too
- Radiators and hot-water tanks without an entity are no longer listed as *Not linked* (they are often just drawn)

## [3.9.4] - 2026-10-01
### Fixed
- **Stairs seen from the floor above**: the stair that comes up into the floor shown is drawn solid through its opening, instead of as faint as the rest of the floor below, so the stairwell reads as an opening with a stair in it
- Tapping the **room a stair stands in** (e.g. the stairwell) no longer hides the stair

## [3.9.3] - 2026-10-01
### Fixed
- **Room and floor buttons became slow over time**, especially on tablets: every rebuild of the scene (tapping a room or floor) kept the old copy on the graphics card (about 275 shapes per tap in the example house). Old shapes and textures are now freed, so the view stays as fast as right after loading

## [3.9.2] - 2026-10-01
### Changed
- The offline list checks **only what is placed in the plan** again: the list of unplaced unavailable entities from 3.9.1 is gone
- Placed **lamps and smart devices that are not linked** to a Home Assistant entity are listed as *Not linked* (furniture, garden objects and pictures are left out)

## [3.9.1] - 2026-10-01
### Changed
- The offline pill is **always shown**: green **✓ 0 offline** when everything in the plan can be reached, red **⚠ n offline** otherwise
- The offline list also shows **unavailable entities that are not placed in the plan** (a tap opens Home Assistant's dialog), so a device you have not placed yet no longer goes unnoticed

## [3.9.0] - 2026-10-01
### Added
- **Devices offline**: a red pill **⚠ n offline** over the plan as soon as a placed device is unavailable, unknown or no longer in Home Assistant; it opens a list with floor, room, entity and since when, a tap jumps to the device
- ⚙ **Performance on this device** (*Automatic*, *Beautiful*, *Fast*), stored per browser, so a tablet that is not recognised can be switched to the fast mode

### Changed
- The floor and room buttons over the plan **scroll sideways** when they do not fit (tablets): ‹ › arrows at the ends, swipe or mouse wheel; groups in the top bar wrap instead of running off the screen
- Faster on tablets: the low-power mode drops the blur and glow behind buttons and panels and rests at about 2 fps while nothing happens; every view slows down after 15 s without activity

### Fixed
- The **grid** is never shown in live mode and lies on the level of the floor shown, so it no longer covers the basement or a house without earth

## [3.8.1] - 2026-10-01
### Fixed
- The **grid** no longer gets in the way on the floors (live and edit) nor with see-through earth: any ground replaces it, it only shows while a drawing tool is active (#39)
- A garden **lawn, terrace or path** object no longer lies over the floors of the house like a carpet (#40)
- On a floor (e.g. ground floor) the lawn in front of the house is **no longer cut away**; the earth is cut open only in the whole-house view, where the basement is shown (#41)
- ⚙ *Lawn around the house without a plot* shows a note when the house has a plot (the lawn then follows the plot) (#42)
- Choosing **Roof** frames the roof instead of a corner of the plan (#43)
- **Stairs cut a full opening** into the floor above, over the whole stair (straight, L and U), not only over its upper part (#44)

## [3.8.0] - 2026-10-01
### Added
- **Draw your plot (Grundstück)**: new tool *Plot* in edit mode. Click the corners in the 2D plan, close with a double click, Enter or a click on the first point; the lawn then has exactly that shape. *Delete plot* removes it again
- New setting **⚙ → Lawn around the house without a plot (m)**: how far the lawn reaches beyond the house (default 5 m)

### Fixed
- The lawn now reaches around **placeholder blocks** too, not only around rooms (a house built from blocks had only a tiny lawn)
- **Garden objects** (lawn, terrace, path, pool, trees …) are cut open together with the earth, so an imported garden lawn no longer covers the basement section
- The **grid** no longer lies over the lawn in the floor views; it only shows while a drawing tool is active

## [3.7.1] - 2026-10-01
### Changed
- The floor plan **opens on the ground floor** instead of the basement (also after switching or importing a house)
- The demo house has a **basement** (hobby room, utility room, laundry), a **plot with garden** (trees, terrace, hedge, fence, car) and shows the house in its ground
- **New screenshots and screen recordings** in the README and the import guide: the house on its plot, the basement as a section, the LED ring; the quick tour and the import recording show the new ground view

## [3.7.0] - 2026-10-01
### Added
- **The house stands in the ground**: solid earth with a **lawn on top** around the house, in the shape of the plot (Grundstück) if one is drawn, otherwise a generous area around the house. The house itself is cut out, so the lawn reaches right up to the walls
- **Basement in the earth, shown as a section**: with a basement, the earth in front of the facade that faces the camera is cut away like in a section drawing. You see the whole basement wall, and the cut face shows soil layers (topsoil, loam, clay, gravel). The cut turns with the camera
- Also in the normal floor view (ground floor and above) the house stands on the lawn instead of floating
- New setting **⚙ → Ground around the house**: *solid, cut open on the camera side* (default), *see-through* (the earlier faint look) or *off*

### Changed
- With solid earth the basement is drawn normally in the whole-house view (before it was always faint), and the grid under the lawn is hidden in live mode and the whole-house view (it stays while drawing)
- Without a basement the ground is not cut, the lawn simply runs all around the house

## [3.6.0] - 2026-10-01
### Changed
- **Live updates instantly**: the add-on keeps one websocket connection to Home Assistant and pushes every state change to all open views the moment it happens. A wall switch, an automation, the HA app or a sensor now show up **within a fraction of a second** instead of up to 4 seconds later
- **Less load on Home Assistant**: open views no longer fetch the complete list of all entities every 4 seconds; while the live channel is up they only re-sync once a minute
- If the live channel is not available (Home Assistant restarting, a proxy without websockets) the view falls back to polling every 4 seconds automatically and reconnects by itself
- The connection to Home Assistant stays open for a minute after the last view closed, so reloading a wall tablet is live right away

## [3.5.0] - 2026-10-01
### Added
- **Place a whole HA area automatically**: select a room that is linked to a Home Assistant area and press **✨ Alle … sinnvoll platzieren** in its entity list. Every entity of the area goes where it belongs, in one undo step:
  - lights on an even grid under the ceiling, smoke detectors between them
  - switches (and blinds, fans) next to the door
  - heating / thermostat under a window
  - temperature, humidity, CO₂ and light sensors and cameras on free stretches of wall
  - TV in the middle of the longest free wall
  - motion / presence sensors and robot vacuums on the floor, clear of the lamps and the room name
  - **door and window contacts are linked to the room's doors and windows** that have no sensor yet
  - things that are not objects in the room (battery, signal, energy sensors, scenes, scripts …) are skipped and stay in the list to place by hand
- The single **+ platzieren** button of an entity uses the same rules instead of dropping it in the middle of the room

## [3.4.0] - 2026-10-01
### Added
- **LED ring: free sections** — set **how many** sections the band has and **where each one starts and ends** (*Von / Bis* in metres along the band, counted from the "0 m" mark), so a wall can have several sections and gaps without LEDs. *Gleichmäßig verteilen* spreads any number of sections evenly, *Je Wand einer* goes back to one per wall, ✂ splits a section in the middle and 🗑 removes it. In the 2D plan the white ends of every section can be **dragged along the walls** (5 cm steps). A section can run around a corner. The lights of the sections are kept by their number
- **Home Assistant details** (#9): in live mode the popup of a device (and of a door/window sensor) has a **ⓘ Details** button next to its name. It opens Home Assistant's own dialog for the entity with **history graph, logbook, all attributes and settings**, right on top of the floor plan
- LED ring: every section has its own ⓘ Details button, the ring's main entity one next to the name
- Room panel: an ⓘ button on every entity row
- The buttons only appear when the floor plan runs inside Home Assistant (sidebar, HA app, wall tablet with the HA app); opened as a page of its own there is no HA dialog to open, so they stay hidden

### Changed
- Room panel: long entity names stay readable, the buttons move to a second line when space is short

## [3.3.0] - 2026-10-01
### Added
- **LED ring (indirect light)**: new device *LED-Ring (indirekt)* in the lighting library. Placed in a room it runs **all around the room just under the ceiling** (cove / indirect lighting), 15 cm from the walls. It is one object made of several **sections** (one per wall), and **every section can have a light entity of its own**; sections without one use the ring's main entity
- Each section glows in its own light's colour in 3D and in the 2D plan and lights the room from where it is
- Properties: open or closed ring, distance to the wall, *Fit to room* (keeps the sections' lights), one entity picker per section with its length
- Live mode: tapping a section opens it with its own on/off, brightness and colour, plus buttons for all sections and controls for the whole ring; a double click switches the whole ring
- In the 2D plan only the line itself can be clicked, the room inside stays selectable
- Property import / export (JSON) keeps the ring (`pts`, `closed`, `segs`, `inset`)
- The demo has an LED ring with two lights in the bedroom

## [3.2.0] - 2026-10-01
### Added
- **Presence**: new device *Anwesenheit / Person* for `person.*`, `device_tracker.*` and presence / motion sensors (`binary_sensor.*`). A glowing figure stands on a floor ring while somebody is there and disappears in live mode when they are away; the room pill gets a green dot while someone is in the room. Entities of these domains are placed as presence devices automatically
- The demo has two people and an office presence sensor

## [3.1.1] - 2026-10-01
### Changed
- The light patch in the top right corner of the hologram background is **off by default**. It can still be turned on in ⚙ with the new *Glow strength* slider (next to *Background glow* for the colour)
- New, sharper screenshots, GIFs and social preview without the corner glow

## [3.1.0] - 2026-10-01
### Added
- **Multilingual interface**: Deutsch, English, **Français, Español, Italiano, Nederlands and Polski**. Pick it in ⚙ → Language; *Auto* follows the browser / Home Assistant language. Missing texts fall back to English
- The heat / humidity switch at the bottom is translated, too
- Tests make sure every language has exactly the same texts and placeholders, so a new text can never be forgotten

## [3.0.1] - 2026-10-01
### Changed
- Import guide redesigned: screenshots, preset table, error table, callouts; import section with pictures in the README
- Import: a polygon whose edges cross is now reported as such (instead of "too small"); disabled buttons look disabled

## [3.0.0] - 2026-10-01
### Added
- **Import a property by JSON**: *Häuser → Grundriss importieren (JSON)* builds a **new house** from a description of plot, rooms, windows/doors and devices. Walls are derived from the room polygons (shared edges become one inner wall, outer walls are thicker), openings snap to the nearest wall, floors/basement/roof are ordered automatically. Check first, import only after a clean check; errors name the exact JSON path
- Example flat and example house in the dialog, a file loader and a **copy AI prompt** button (the prompt contains the full format, all device types and presets)
- **Plot boundary and garden objects** (trees, lawn, terrace, pool, fence) are drawn in the 3D view and in the 2D plan
- API: `POST /api/import[?dryRun=1&name=]`, `GET /api/export/property` (export a house in the same format), `GET /api/import/schema`, `GET /api/import/examples/{flat|house}`; GeoJSON polygons (lat/lon) are converted to metres automatically
- Guide with format reference, curl examples and prompting tips: `docs/IMPORT.md`

## [2.5.0] - 2026-10-01
### Added
- **TVs with built-in backlight**: the standing *TV* and the *Wand-TV* have a new field *Hintergrundlicht (LED hinter dem TV)*. Pick a light entity and a glowing frame appears behind the screen; it shines in the entity's colour (effects and scenes work as for any light) and lights the room. No extra device needed
- Download button for the demo at the top of the README (always the newest build); the new *Demo* workflow rebuilds it whenever the app changes and replaces it in the latest release

## [2.4.1] - 2026-10-01
### Added
- **Downloadable demo**: `demo/floorplan3d-demo.html` is in the repository (download from GitHub, double-click to open) and is attached to every release. It now shows the new features: Nanoleaf layout, TV backlight, an invisible LED strip, effects and scenes

## [2.4.0] - 2026-09-30
### Added
- **Roofs make room for the camera**: a roof fades out smoothly when the camera gets close (from about 7 m, mostly transparent at about 2.5 m) and comes back when you zoom out
- *Unsichtbar im Live-Modus (Licht bleibt)* is now offered for every lighting device (ceiling lamps, spots, wall lamps, strips ...), not only for LED types

## [2.3.1] - 2026-09-30
### Fixed
- The *Normal / Temp. / Feuchte* buttons are available in every theme again (they were only shown in the hologram theme); in the solid themes the floor takes the temperature / humidity colour

## [2.3.0] - 2026-09-30
### Added
- **Invisible lights**: checkbox *Unsichtbar im Live-Modus (Licht bleibt)* for LED strips, TV backlights, Nanoleaf panels/layouts, light balls and any device with a light entity. The model is not drawn in live mode (and cannot be tapped there), but its light keeps shining into the room; in edit mode it stays visible so you can still find and move it

## [2.2.0] - 2026-09-30
### Added
- **TV backlight (LED)**: new device in the lighting category, a glowing frame for behind a wall TV (indirect light / ambilight). Put it on the TV, link it to the LED light entity (colour, brightness, effects work as for any light), and resize it with the width/height fields to match the TV

## [2.1.1] - 2026-09-30
### Added
- Room panel: every light row has a 🎨 button that unfolds colour, warm/cold, effects (with the effect colour) and the light's scenes, so you no longer have to hit a small model in a crowded 3D view

## [2.1.0] - 2026-09-30
### Added
- **Effect colours**: Home Assistant only reports the *name* of a light effect (Nanoleaf scene, WLED, Hue ...), not its colours, and the light's own colour is stale/white while an effect runs. A light with an active effect now shows the colour assigned to that effect (colour picker next to the effect list in the live popup, saved for everyone), or a colour recognised from a word in its name (*lila, purple, rot, blue, gaming* ...)

### Fixed
- The update dialog in Home Assistant showed an outdated changelog (stuck at 0.2.0): the add-on now ships the current `CHANGELOG.md`, and a test keeps both copies identical

## [2.0.2] - 2026-09-30
### Fixed
- Nanoleaf layouts stay solid in the hologram theme (no longer see-through from the side)
- Their room light now shines from the real panel positions, a little off the wall, instead of one point

## [2.0.1] - 2026-09-30
### Added
- Nanoleaf layout editor: **small triangle** (half size); it also snaps to either half of a large triangle's edge

## [2.0.0] - 2026-09-30
### Added
- **Nanoleaf layout editor**: the new device *Nanoleaf Layout* opens an editor with a snap grid – pick triangle / hexagon / square / bar, click them together (edges click onto their neighbours, rotation is found automatically), right-click erases, undo, rotate with `R`
- The whole layout is **one object with one entity**: it moves, turns, mirrors, locks and hangs on the wall like a single device, and all panels show the entity's colour and brightness together
- Edit later via *Layout bearbeiten* in the side panel

## [1.9.4] - 2026-09-30
### Fixed
- *An Wand ausrichten* (and placing wall-hung items) now puts the item on the **inner** face of the wall, the side facing a room, instead of jumping to the outside
## [1.9.3] - 2026-09-30
### Added
- Settings dialog: a fixed header with an ✕ button (also closes on a click outside) instead of only `Esc`
### Fixed
- **Tablet assignments (user → room / view) and other settings could get lost after an update**: a browser that failed to load the settings while the add-on was restarting, or an old open tab, could save defaults over the real settings. Now settings are only saved after they were loaded successfully, a stale browser can no longer overwrite newer settings (the page reloads instead), and the server keeps the last versions of the settings in `/data/backups` and restores from them if the file is damaged

## [1.9.2] - 2026-09-30
### Added
- **Light glow in the dark and light themes**: lit lamps now colour the floor with a soft light pool and tint the room's walls, just like in the hologram theme
## [1.9.1] - 2026-09-30
### Changed
- README, documentation and contributing guide: note that this is an AI-assisted project (with a lot of human work, testing and care), plus the newest features

## [1.9.0] - 2026-09-30
### Changed
- **Object list grouped by room**: every room is a collapsible group with the room itself, its doors / windows and its furniture; leftovers are under *No room*, walls, stairs and blocks below. The group holding the selected item opens automatically
### Added
- Search field above the object list (opens all matching groups)

## [1.8.1] - 2026-09-30
### Changed
- Completely revised README with feature overview and new screenshots (3D, 2D, split view, whole house, library, room panel, light popup)
### Fixed
- The house selector in the header was visible even with a single house

## [1.8.0] - 2026-09-30
### Added
- **Resizable side panel**: drag its left edge to make it wider (remembered per browser)
- **Real dimensions**: width, height and depth of a piece are entered in metres (e.g. sideboard 0.90 m high) instead of factors; *Höhe über Boden* is the elevation field
### Fixed
- Lock checkboxes in the object list and device panel were stretched and misaligned

## [1.7.0] - 2026-09-30
### Added
- **Wall TV** (flat screen that clicks onto the wall like pictures; lights up when its media player is on)
### Fixed
- 3D and 2D now agree: all 3D furniture models are centred on their footprint (the corner sofa, piano and monitor sat up to 0.5 m off to one side in 3D compared to the 2D plan)

## [1.6.0] - 2026-09-30
### Added
- Lock checkbox in the object list for every item; library search finds things by everyday names (e.g. *Fernseher*)

## [1.5.0] - 2026-09-30
### Added
- **Stretch furniture per axis**: width, height and depth can be set independently (side panel, *Streckung*), and in the 2D plan the selected piece has two square handles on its right and front edge to drag it longer or wider (5 cm steps), e.g. a longer sideboard
- **Lock items**: a checkbox before every name in the object list (rooms, walls, doors/windows, furniture, stairs, blocks) and in the device panel; a locked item can still be selected but cannot be moved, resized or deleted by accident
- The furniture library search also finds things by everyday names (e.g. *Fernseher* finds the TV, *Couch* the sofa)
### Changed
- **Wall stop reworked**: footprint and wall thickness count now, the piece stops at the wall surface and slides along it, and fast drags can no longer jump through a wall. Wall-hung, ceiling and outdoor items are exempt; doorways let things pass
- Selected objects that are not drawn (e.g. hidden by a focused room or off screen) stay selectable and deletable; new button *In die Bildmitte holen* in the device panel
- **Backup export/import** (#12): *Houses & backup* in the side panel downloads one JSON file with all houses, settings, uploaded pictures and custom 3D models, and restores it again. Before a restore the server keeps a safety copy of the current layouts and settings (last 5 in `/data/backups`). Files are validated (picture and model formats, names, sizes) before anything is written

## [1.4.0] - 2026-09-30
### Added
- **Several houses**: one floor plan per house (e.g. your own and your parents'). A house selector appears in the header, houses are created, duplicated, renamed and deleted in the side panel (*Manage houses*). Kiosk tablets open a specific house with `?house=<name>` in the URL. Existing installs keep their layout as the first house
- **Individual panes of multi-pane windows**: double and triple windows can link a separate contact sensor per pane; every pane tilts open on its own and the room panel lists each pane

## [1.3.0] - 2026-09-30
### Added
- **Furniture library** (#15): the device palette shows a preview image of every piece, has a search field and categories (Living, Kitchen, Bath, Bedroom, Office, Lighting, Tech, Outdoor, Decor)
- **35 new pieces**: corner sofa, TV stand, bookcase, fireplace, piano, pouf, side table, curtain, bar stool, stove, oven, dishwasher, sink, kitchen island, microwave, mirror, towel radiator, double basin, single bed, nightstand, dresser, crib, computer desk, office chair, printer, pendant lamp, wall lamp, ceiling spot, radiator, water heater, camera, speaker, robot vacuum, smoke detector, router
- **Door and window variants**: front door, glass door, double door, sliding door, passage (no leaf), single / double / triple window, balcony door, small bath window, fixed glazing; the style of a placed opening can be changed in the side panel. Double doors and sliding doors move when the contact sensor reports open
- **Pictures on walls**: device *Bild*: upload a PNG/JPG/WebP in the side panel, set the width; pictures, mirrors, panels, radiators and other wall-hung items click flat onto the nearest wall when placed, and *An Wand ausrichten* does it later

## [1.2.1] - 2026-09-30
### Changed
- Light simulation (hologram theme) is more realistic: LED strips, light balls and Nanoleaf panels only light their surroundings (short reach, low strength), a floor lamp less than a ceiling lamp; dimmed lights get much darker (down to 12 % instead of 35 %); several lamps no longer burn the floor out to white (soft roll-off). *Reach* and *Strength* in the settings still scale everything

## [1.2.0] - 2026-09-30
### Added
- **Groups**: tool *Gruppe* – click several devices (e.g. all Nanoleaf panels of one logo) and press *Gruppe bilden*. A group moves, turns (Q/E or the *Drehung* field, around its centre) and mirrors (*Gruppe spiegeln*) as one shape, so the form never falls apart. Groups are outlined dashed in 2D; *Aus Gruppe lösen* / *Gruppe auflösen* undo it
- **Wall stop**: devices can no longer be dragged through a wall by accident; they stop at it (open doors let them pass). Switch it off in the settings (*Geräte stoppen an Wänden*)

## [1.1.0] - 2026-09-30
### Added
- Devices can be turned on **all axes**: besides *Drehung* (vertical axis) there are *Kippen vor/zurück* and *Drehen in der Fläche / seitlich* (roll, for a panel: turn it in the wall plane), plus **Spiegeln** to mirror a shape. Nanoleaf panels now turn around their middle instead of their bottom edge

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
