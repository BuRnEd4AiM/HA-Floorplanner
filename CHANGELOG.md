# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [3.61.0] - 2026-10-08
### Added
- **Users: lock things for a user / tablet**: in the users dialog the ⚙ box of each user now also has „🔒 Gesperrt“ with ticks: switching devices, Home Assistant details (ⓘ), cameras, power and meter overview, colour views (temperature, humidity, CO₂, power), the „View“ menu, switching 2D / 3D, switching house, search and the settings (⚙). Ticked things are hidden for that user; switching and camera images are also refused by the server. The locks are saved with the users (also in users.json). New module `userlocks.js` with unit tests.

## [3.60.1] - 2026-10-08
### Fixed
- **Phones: floor cards stay beside the house when zoomed in (#294)**: zooming in close in the whole-house view moved the floor cards onto the middle of the picture, on top of the house. Now they stay beside the house on the side with more room, even when that pushes them partly or fully off the screen; zooming out brings them back.

## [3.60.0] - 2026-10-08
### Added
- **Performance display (FPS and more)**: the *View* drop-down has *⏱ Performance: off / FPS / all values*. *FPS* shows the frames per second at the top right of the 3D picture (💤 when the picture rests on purpose to save power); *all values* adds the time per frame (average and longest), the work per frame, draw calls, triangles, geometries, textures, shaders, the resolution of the picture, the screen, low-power mode, the graphics chip and the memory (Chrome). Kept per device, works on phone, tablet and desktop, the box lets every touch through; on a wall tablet without the menu `?fps=1` or `?fps=all` in the address does the same. New module `perfhud.js` with unit tests.

## [3.59.2] - 2026-10-08
### Fixed
- **Phones: floor cards beside the house, not in front of it (#292)**: in the whole-house view on phones held upright the house is drawn a little to the left and slightly smaller, so a free column on the right holds the floor cards and they no longer cover the house. Leaving the whole-house view (a floor, a room) shows the picture as before; tablets and desktops are unchanged.

## [3.59.1] - 2026-10-08
### Fixed
- **Phones: floor cards in the whole-house view were far too big (#290)**: on phones held upright each card took four lines and together they covered half of the house. Now a card is the floor name with one short line of icons below it (▦ rooms, 💡 lights on, 🪟 windows open; lights and windows only when there are any), in smaller text. Tablets and desktops keep the full cards.

## [3.59.0] - 2026-10-08
### Changed
- **Phones held upright: more room for the house and the room sheet (#288)**: the values at the top (power overview, water / gas, offline, open, cameras / movement) are folded into one button "📊" next to the floor and the room button; a tap opens them as a list, a tap on one of them does what it always did. When something needs attention (open doors / windows, movement, devices offline) the button is red and shows "⚠️ n". The search button 🔍 moved from the bottom left to the top right, so the room sheet at the bottom now uses the full width. Phones held sideways, tablets, desktops and room tablets are unchanged. New module `phonestatus.js` with unit tests.

## [3.58.0] - 2026-10-08
### Added
- **Split a wall exactly (#286)**: the properties of a wall have *Split wall*: a corner at an exact distance from the start (e.g. 0.30 m, in the length unit chosen), or the wall in 2 to 10 equal parts. Doors and windows stay with their piece, rooms along the wall get the corner too, Ctrl+Z takes it back. New module `wallsplit.js` with unit tests; texts in 7 languages.

### Fixed
- **Double click on a wall (#286)**: when the wall is selected (the first click of the double click does that), the double click always splits this wall, also when a device, a garden object (lawn, fence …) or a room lies under it. A corner may now be 5 cm from the end of the wall (was 10 cm).

## [3.57.2] - 2026-10-08
### Changed
- **Phones held upright: everything on one screen (#284)**: the values at the top (power overview, water / gas, offline, open, cameras) wrap into more rows and are a little smaller, and the view buttons at the bottom (Normal, Temp., Humidity, CO₂, Power) wrap too, so nothing has to be scrolled sideways any more. Phones held sideways, tablets and desktops keep the single row.

## [3.57.1] - 2026-10-08
### Changed
- **Phones, top row (#281)**: as the owner wanted it, three buttons side by side: ☰ (tool bar), the floor ("Obergeschoss ▾", opens the list of floors and the whole house) and the rooms ("Zimmer ▾", the room list of the floor shown). In 3.57.0 floors and rooms were one shared list. A floor or a room closes its list. Desktop and tablets are unchanged.

## [3.57.0] - 2026-10-08
### Added
- **Phones: floors and rooms in one drop-down (#281)**: instead of the row of floor pills that had to be scrolled sideways, phones show one button at the top with the floor (and the chosen room), e.g. "Obergeschoss · Kinderzimmer ▾". It opens a list with the floors and the whole house, below them the rooms of the floor shown (in the whole-house view the rooms of every floor). A floor keeps the list open so a room can be picked next; a room closes it and opens the room. Desktop, tablets and room tablets are unchanged. New module `phonenav.js` with unit tests; texts in 7 languages.

### Fixed
- **Browser tests (CI)**: the tests sometimes acted before the page had loaded its house (fixed waits that were too short on a slow GitHub runner), so the check stayed red now and then although nothing was broken (#280). The page now reports when it is ready (`ready()` in the test hook, only with `?debug=1`) and every test page waits for it after loading.

## [3.56.1] - 2026-10-07
### Fixed
- **Phones, ☰ menu (#277)**: in the live view the tool bar (Edit/Live, 2D/3D, house, version, users, settings) is folded into a ☰ button at the top left and opens as a drop-down list, instead of a row that had to be scrolled sideways; this also frees the top row for the house (`phonemenu.js`). Text fields on phones use 16 px text, so the iPhone no longer zooms the whole page in when the search is tapped. Desktop and tablets are unchanged.

### Changed
- **Documentation**: the roadmap lists only what is really still open (15 points that were long done are ticked off with their version); the test list for the owner covers 3.54.0 to 3.56.1 (section 36); the module plan shows the current size of `app.js`.

## [3.56.0] - 2026-10-07
### Added
- **Dormer window in the room's wall (#275)**: when a wall of the room under a dormer runs right behind the dormer's front (from 25 cm in front of it back to where the dormer meets the roof), the dormer window is now cut into that wall: it shows in the room (also in the room view), has a real hole in the wall and belongs to the room. The dormer's front keeps its glass pane from outside. If the wall lies further away, the new button **"Put the front on the wall"** in the dormer card moves the dormer so its front lies on the wall of the room below; the card also says where the window sits. `hostWall`, `eaveOntoWall`, `dormerWindows` in `dormerwin.js` with tests; texts in 7 languages.
- **See-through roof over a floor**: like in the room view, a floor under the roof (the storey right under the roof floor, or under the slopes on a knee wall) now shows the roof over it see-through, with its dormers, when that floor is open.

## [3.55.0] - 2026-10-07
### Added
- **See-through roof over a focused room**: when a room is chosen (room view), the roof over it is drawn see-through, with the roof slope and the dormers, but only the part over this room (cut to the room's outline), not the whole roof. So a dormer window in the room shows where it really sits. Works for the storeys under the slopes (knee wall) and for the storey right under the roof floor. `coverRoofFloor` in `attic.js` (with tests), the cut to the room's outline in `atticclip.js`, the drawing in `roofs.js`.

### Fixed
- **Phones, tapped room**: the heating is now part of the room sheet instead of a second panel at the top, so the room stays in view between them; the sheet keeps clear of the iPhone's home bar; a dark box that Chrome painted over the 3D picture above the scrolling sheet (it hid the tapped room) is gone (`clip-path` on the sheet); the camera comes a bit closer to the room. The demo's "changes are not saved" note fades out after a few seconds, it covered the buttons at the bottom. Desktop and tablets are unchanged.

## [3.54.0] - 2026-10-07
### Added
- **Dormer windows are real windows**: the window in a dormer (Dachgaube) was only a blue pane. Now it is a window like the ones in the walls: tap it to give it a contact sensor (also one per pane) and a name, choose its style; it turns red and tilts open when the sensor reports open, and it shows in the list "n open", in the room panel of the room under the dormer, in the search and in the object list. So the old window of the room can be deleted and the dormer window used instead. Its size and place still come from the dormer (roof panel); deleting it switches the dormer's window off. With the roof on a knee wall it belongs to the storey under the slopes (e.g. the Studio), otherwise to the roof floor. New module `dormerwin.js` with tests; texts in 7 languages.

### Fixed
- **Phones**: held sideways, the floor buttons now sit at the top as small pills (the floor pictures at the side did not fit and covered the compass). A tapped room is no longer hidden behind the room sheet at the bottom: the picture moves up into the free part and the camera stands further back on narrow screens (`sheetview.js`, with unit tests). In the live view on phones the tool bar is one row that scrolls sideways (it took four rows), the view buttons (Normal, Temp. …) are one row beside the compass with *View* first, and held sideways the buttons at the bottom no longer slip off the screen. Desktop and tablets are unchanged.

### Added
- **No more skipped releases**: when several pull requests were merged in a row, GitHub cancelled waiting release runs and some versions got no release. Every release run now creates all missing releases (the versions in the changelog newer than the newest release, each at its own commit, oldest first; only the newest becomes "latest"), in a queue of its own. A manual run can also fill older gaps ("backfill"). The choice of versions is in `tools/release_versions.py` with tests. A version that only has a changelog entry but was never set in `config.yaml` (bundled into a later version) gets no release, instead of one pointing at the newest code.
- **Demo directly on GitHub Pages (#133)**: the demo workflow now also publishes the freshly built demo as a web page, so it can be tried in the browser without a download. Needs Pages switched on once (Settings → Pages → Source: GitHub Actions).

## [3.53.0] - 2026-10-07
### Added
- **Lived-in attic: dormers, several storeys, ridge height (#265)**:
  - Where a dormer stands out of the roof, the walls under it are no longer cut at the slope; they reach up under the dormer (up to the ridge of a gable dormer), so the dormer shows in the cut.
  - New choice "Roof starts on floor": the roof can start on a storey further down, e.g. two storeys under the slopes (Obergeschoss and Dachgeschoss); all of them are cut at the roof.
  - New field "Ridge height": type the height of the ridge over the walls (or knee wall) and the pitch is worked out.
  - The walls are now cut by a few lines of shader (`atticclip.js`) instead of three.js clipping planes, which cannot keep a dormer. `attic.js` has `roofBaseIdx`, `roofY0`, `dormerRooms`, `keptAt`, `ridgeHeight`, `pitchFor` with tests; texts in 7 languages.

## [3.52.0] - 2026-10-07
### Added
- **Lived-in attic (#260)**: in "Manage floor" on the roof floor, the new box "Lived-in attic (the roof starts in the storey below)" lets the roof start inside the storey below the roof floor (e.g. the Dachgeschoss), on a knee wall of a set height (default 1 m). The walls of that storey are then cut off where they meet the roof slopes (gable and hip roofs; dormers and solar panels move down with the roof), so a living room under the slopes looks like one. The roof floor above becomes the loft (Spitzboden) for rooms and things stored up there. Walls drawn on the roof floor itself are cut at the roof too, also without a knee wall. New module `attic.js` (knee wall, which roof cuts which floor, the planes of the slopes) with tests; texts in all 7 languages.

## [3.51.0] - 2026-10-07
### Changed
- **Live mode: tap the ball, not the device (#262)**: a device with a tap ball (a lamp, a TV, a blind, a camera ...) is now tapped on its ball only. A tap on the device itself lands on the room, as a tap into empty space does, so nothing is switched by accident while tapping around a room. Devices without a ball work as before; the sections of an LED ring stay tappable one by one. The balls are bigger (60 cm instead of 44 cm across, a sharper picture) and their invisible finger area grew with them. `ballOnly` in `pickrules.js` with a test.

## [3.50.0] - 2026-10-07
### Added
- **Roof size by dragging (#259)**: in the 2D plan a selected roof (on the roof floor) shows 8 white handles, at its corners and in the middle of its sides. Dragging a corner changes width and depth, a side only that side; the opposite side stays. 5 cm steps (Alt: free), never smaller than 1 m, Ctrl+Z undoes it. The plan follows while dragging, the house is built again once when the handle is let go. The main roof then keeps its own size ("size set by hand"). `roofHandles`, `resizeBox` and `setRoofBox` in `roofmove.js` with tests.

## [3.49.1] - 2026-10-07
### Fixed
- **Moving a roof no longer stutters (#257)**: while a roof was dragged, the whole house was built again in 3D at every 5 cm step. Now only the drawn roof and the solar panels on it move along while dragging (in 3D and in the 2D plan), and the house is built once when the roof is let go. The work per pointer move went from about 80 ms to under 1 ms in the demo. `panelsOn` in `roofmove.js` with a test.

## [3.49.0] - 2026-10-07
### Added
- **Move roofs (#255)**: with the roof floor open in the editor, a click on a roof (the main one or a further one) selects it, and the panel shows where it is. Press the selected roof again and drag it to move it, in 3D or in the 2D plan, which now shows the outlines of all roofs (5 cm steps, Alt: free). The arrow keys nudge it too. Solar panels lying on the roof go along. The main roof follows the house until it is moved for the first time; after that it keeps its own size and place ("size set by hand"). "Fit" on the roof floor frames the roofs. `roofmove.js` with tests.

## [3.48.11] - 2026-10-07
### Changed
- **Smoother picture (#253)**: the shadows were drawn again in every frame, almost half of the work, although the sun never moves. They are now drawn again only when something that casts one changed (a build or a state update, a dragged device, walls sinking or rising, a door moving, the shadow setting) and at least once a second. Turning the camera in the demo: 715 instead of 1,274 draw calls per frame (−44 %), and less work per frame; the picture looks the same. `shadowDue` in `frameloop.js` with tests.

## [3.48.10] - 2026-10-07
### Changed
- **Code split step 22, the last one (#137)**: the default settings, how a screen starts (wall tablet, room tablet, read-only, live mode) and lengths in m / ft (`appstate.js`), how often the picture is drawn to save power on tablets (`frameloop.js`), opening, switching and importing houses and loading a backup (`houseload.js`) and loading the Home Assistant areas (`livechannel.js`) left `app.js`. The pure parts are tested; a test also checks that every default setting is one the add-on knows. `app.js` now only holds the state of the open plan and wires the modules together (about 1,430 lines, 5,100 at the start). Nothing changes for the user.

## [3.48.9] - 2026-10-07
### Fixed
- **Double click on a device in the editor switches it again (#251)**: in 3D and in the 2D plan a double click on a lamp did nothing (the browser reported "quickAction is not defined", a leftover of an earlier code split); it switches the device again, and an e2e check guards it.
### Changed
- **Code split step 20, part 4 (#137)**: drawing and dragging in the 3D view (select, drag devices and doors / windows, draw walls and rooms, place openings and devices, cable and erase tools, double click) left `app.js` for `draw3d.js`, with the drawing state; where a door / window goes on a wall and when two clicks are the same point are tested. Nothing else changes for the user.

## [3.48.8] - 2026-10-07
### Changed
- **Code split step 20, part 3 (#137)**: pictures on the wall (frame, image, upload) left `app.js` for `picture.js`; the picture size is tested. Nothing changes for the user.

## [3.48.7] - 2026-10-07
### Changed
- **Code split step 20, part 2 (#137)**: picking in the 3D view (the ray from the pointer, the point on the floor under it, what a click or tap hits) left `app.js` for `picking.js`; which of several hits wins and what can be tapped in the live mode are now pure rules in `pickrules.js` with tests. Nothing changes for the user.

## [3.48.6] - 2026-10-07
### Changed
- **Code split step 20, part 1 (#137)**: deleting, moving with the arrow keys (walls take the corners joined to them along), turning with Q / E and the shortcut keys left `app.js` for `edititems.js`; which key does what and the list changes are tested. Nothing changes for the user.

## [3.48.5] - 2026-10-07
### Changed
- **Code split step 21, part 3 (#137)**: the devices of a floor in 3D (models, solar panels on the roof, half section, tap balls, camera cones, value labels) left `build` in `app.js` for `floorbuild.js`; which device gets a value label is tested. `build` is now only the frame (ground, plot, neighbour house, earth cut) around the floors. `app.js` is down to about 1,800 lines (5,100 at the start). Nothing changes for the user.

## [3.48.4] - 2026-10-07
### Changed
- **Code split step 21, part 2 (#137)**: the stairs and the walls of a floor in 3D (with doors, windows, half section and cutaway) left `build` in `app.js` for `floorbuild.js`. Nothing changes for the user.

## [3.48.3] - 2026-10-07
### Changed
- **Code split step 21, part 1 (#137)**: the flat parts of a floor in 3D (room floors with their light layers, warning pulse and name, the rims of floor openings, placeholder blocks) left `build` in `app.js` for `floorbuild.js`; the room label is tested. Nothing changes for the user.

## [3.48.2] - 2026-10-07
### Changed
- **Code split step 22, part 2 (#137)**: undo (the last 60 states of the plan) and the autosave of the open house left `app.js` for `persist.js`; the undo list rule is tested. Nothing changes for the user.

## [3.48.1] - 2026-10-07
### Changed
- **Code split step 22, part 1 (#137)**: the live channel (states pushed by the add-on the moment Home Assistant reports them, polling while it is down) left `app.js` for `livechannel.js`; merging a pushed change, the fingerprint of a full list and when to poll are pure and tested. Nothing changes for the user.

## [3.48.0] - 2026-10-07
### Added
- **Hide the labels of the floors below (#249)**: looking at one floor, the room names and value labels of the floors below can be left out so they no longer overlap the open floor: in the settings ("Show names and labels of the floors below") or quickly in the "View" menu ("Labels below"). The whole-house view always shows everything.
- **View presets per user / tablet (#250)**: in the users dialog every user row has a "⚙ Presets" button with its own start values for the look: walls facing the camera (see-through or lower), Auto, all walls low or high, value badges, floors below and their labels. "Default" keeps the general setting. A preset applies only in that user's browser and is never saved as the settings of everybody (unless that user changes the field on purpose); it is mirrored to `users.json` with the tablets. `viewprefs.js` with tests, checked on the server too.

## [3.47.0] - 2026-10-06
### Added
- **Several things at once, easier (#247)**: Ctrl + click (Cmd on a Mac) now adds things to the selection just like Shift + click, in 2D and 3D. In the 2D plan, Shift or Ctrl + drag from any spot draws a frame: everything that lies wholly inside it joins the selection; Delete (or "Delete all") then removes them all in one undo step. `boxItems` and `addMulti` in `multisel.js` with tests.
### Changed
- **Stairs over several floors: whole height only in the editor (#246)**: in the live mode a stair again shows only up to the open floor, nothing hangs in the air above it (the hand rail and pole of a spiral stair end there too); the editor still draws the storeys above see-through. `splitStoreys` in `stairs.js` with tests.
- **Tap balls bigger and never covering each other (#244)**: the balls in the live mode are bigger (44 cm across), and balls that would cover each other, or cover a value label, move a little apart (at most 90 cm from their device); `spreadBalls` in `tapballs.js` with tests.
- **Water and gas in a pill of their own (#245)**: the water, gas and heat meters are no longer a second line in the power overview (it overlapped the fields beside it and lit up with the power cables); they now have their own one-line pill next to it. `meterText` in `powerlogic.js` with tests.

## [3.46.1] - 2026-10-06
### Changed
- **Code split steps 23 and 24 (#137)**: five more parts left `app.js` (now just under 2,000 lines, from 5,100 at the start): the state of an entity and the colour of a light effect (`entitystate.js`), making a loaded plan complete (`layoutnorm.js`), isolating a focused room (`roomclip.js`), the hit boxes and hologram look of a model (`modelfx.js`) and text in the scene (`labels.js`). The pure parts have unit tests; nothing changes for the user.

## [3.46.0] - 2026-10-06
### Added
- **Water and gas meters in the energy overview (#237)**: the overview pill at the top shows the readings of the water, gas and heat meters on a second line below the power numbers ("🚰 1234.6 m³ · 🔥 845.2 m³"), if there are meters with a value; the tooltip names each meter. `meterReadings` in `powerlogic.js` with tests.
- **Tap balls in the live mode (#238)**: everything that can be tapped in the live mode has a small ball floating over it (under a ceiling lamp: below it), lit in the light's colour while it is on, grey-blue while off, with a small icon of what it controls (💡 lamps and LEDs, 🪟 shutters, 🔌 sockets, 📷 cameras, 📺 TVs, 🌡 heating, ☀ ⚡ 🔋 power devices, 🚰 🔥 meters ..., #240); a tap on the ball works like a tap on the device. New module `tapballs.js` with unit tests.
- **Bridge with steps (#239)**: steeper than 1 : 8 the deck of a bridge becomes flat treads with risers of at most 18 cm, so a big height difference can be walked.
### Changed
- **Wall and spiral stairs over several floors (#236)**: a wall stair over several floors is now built storey by storey like the stairwell (the same stair again on every floor, arriving on each), instead of one ever longer run. A spiral makes one turn per floor and gets a landing at floor level on every floor it reaches; the next turn starts where that landing ends.
- **Full height of a stair over several floors visible again (#236)**: looking at one floor, the storeys above it are drawn see-through instead of being left out, so the whole stair shows without hanging in the air as a solid one.
- **Live mode: sensors take no tap (#236)**: temperature, humidity and CO₂ sensors have no hit box in the live mode any more (their values show in the room and in the overviews); thermostats can still be tapped.
### Fixed
- **Power editor button (#239)**: while the power editor is on its button stays blue like every active button (picking another tool took the highlight away).

## [3.45.1] - 2026-10-06
### Changed
- **Live mode: fewer things to hit by accident (#234)**: the presence figure has no hit box in the live mode any more, and neither has the field-of-view cone of a camera (only the camera itself can be tapped). The rules are in the new module `pickrules.js` with unit tests.
### Fixed
- **Stair over several floors hanging in the air (#231)**: looking at one floor, the upper storeys of a stairwell or of a straight / L / U stair over several floors were drawn above it although the floors they arrive on were hidden, so they floated. On one floor only the storey that starts there is drawn now (`storeysShown` in `stairs.js`, tested); one floor up the stair arrives and goes on, and the whole-house view shows all of it.
- **Wall stair: a step between two landings at the turn (#232)**: two clicks close together at a corner (or one just after it) made two landings with no step between them, and the second one lay one step higher. Landings with no step between them now lie at one height, so the stair stays flat at the turn and only goes on after the landing; it still arrives at the floor above.
- **Spiral stair has no end (#233)**: the spiral stopped one step below the floor in the middle of its round opening. After the last step it now has a quarter landing at floor level out to the edge of the opening, so you step off onto the floor. In the demo the spiral to the roof terrace is turned so that its exit faces the terrace.

## [3.45.0] - 2026-10-06
### Added
- **Stairs over several floors arrive on every floor (#229)**: a straight, L or U stair with "Floors" 2 or more used to be one long flight past the floors in between, with no way off. It is now built storey by storey: the same stair again on every floor, so you arrive on each floor and can step off there; the upper storeys rest on a slab under their steps instead of being solid down to the floor below. Where a U stair ends a little behind its start, a plate at floor level closes that gap.
- **Landing at the turn of L and U stairs (#229)**: the field "Landing after a bend" now also works for L and U stairs (in the stair tool and in the properties): the landing at the turn becomes that much deeper (0 to 3 m), flight 2 moves on accordingly. Import and export know `landing` for L and U.
- **Stairwell with a landing and a door on every floor (#229)**: the "Stairwell" preset keeps a landing (1.2 m, at least the stair width) in front of the stair, puts the door there, and builds walls, room and door on every floor the stair reaches (before: only the floor above, without a door).

## [3.44.2] - 2026-10-06
### Added
- **Demo with two houses**: the demo now has a second house, *Nachbarhaus*, standing next to the demo house (its upper floor 0.4 m higher). A metal bridge leads from the roof terrace of the demo house over to its roof terrace, rising by 0.4 m, so the neighbour house (#220) and the bridge with a height difference (#222) can be tried in the browser. Switching houses, creating, copying, renaming and deleting houses also work in the demo (kept until the tab is closed).
- **More of the new features in the demo house**: water, gas and heat meter with readings in the basement, a field of 10 solar panels on the roof, a spiral stair from the garage up through the roof terrace; the neighbour house has a wall stair with a landing after its bend.
### Fixed
- **Terrace railing and bridge**: the railing of a roof terrace ran straight across the end of a bridge, so it could not be walked onto. Where a bridge arrives, on this house's terrace and on the neighbour's, the railing now leaves a gap (`onBridge` in `bridge.js`, with tests).

## [3.44.1] - 2026-10-06
### Added
- **Bridge with a height difference (#222)**: when the upper floors of the two houses are not at the same height, the new field "Height difference at the end" of the bridge makes its far end that much higher (+) or lower (−); deck, beams and railing slope evenly, the posts follow. In the 2D plan a purple arrow points to the far end with the value next to it. The neighbour house shows its storey on the level of the open floor even when it lies a bit higher or lower (set with its "Height"). Import and export know `rise`.

## [3.44.0] - 2026-10-06
### Added
- **Neighbour house (#220, completes #189)**: under "Houses & backup" another house of the list can be placed next to this one (position X / Z, rotation, height). It is drawn in 3D next to this house (walls, floors, roofs, the railing of a roof terrace), in the whole-house view completely and on a floor up to that floor's height; in the 2D plan its outline on the same level shows dashed in purple. It stays a plan of its own and is edited by switching to it. So the metal bridge on the 1st floor can lead over to the roof terrace of the other house. The geometry is in the new module `neighbor.js` with unit tests.
### Fixed
- **Terrace railing**: an edge of a roof terrace that is open from corner to corner (no wall at its start) got no railing at all. It now gets one.

## [3.43.10] - 2026-10-05
### Added
- **Landings of the wall stair (#210)**: a new field "Landing after a bend" keeps the wall stair flat for that long after every bend (0 to 3 m, 0 = only the corner as before), so it stays on one level round the corner and only then climbs on. A click in the middle of a straight stretch while drawing the path sets a landing of its own there. Import and export know `landing`.

## [3.43.9] - 2026-10-05
### Added
- **Several things at once (#211)**: Shift + click (in the 2D plan and in 3D) adds a thing to the selection or takes it out again. Everything selected gets a green frame; the properties panel shows how many and a button "Delete all". The Delete key removes them all, one undo (Ctrl+Z) brings them all back, Esc clears the selection. The list logic is in the new module `multisel.js` with unit tests.

## [3.43.8] - 2026-10-05
### Added
- **The 2D plan turns with the 3D view (#212)**: in "2D + 3D" a new switch "↻ Plan turns along" in the corner of the plan turns the plan so that up is always the direction the camera looks. Labels stay upright, clicking and drawing in the turned plan work as before. Off (the default) the plan stays straight. The angle maths is in the new module `planview.js` with unit tests.

## [3.43.7] - 2026-10-05
### Changed
- **Jump from the lists (#215)**: a tap on an entry of the open doors and windows list, of the offline list or on "Show in the plan" of a camera now works like the search: the camera flies there, a ring marks the spot and the thing is selected (before, only the floor changed).

## [3.43.6] - 2026-10-05
### Changed
- **Spiral stair (#209)**: no longer a solid cylinder. The steps are thin plates fixed to a pole in the middle with nothing below them, and a hand rail with one baluster per step runs along the outside, also over several floors.

## [3.43.5] - 2026-10-05
### Fixed
- **Meters and bridge invisible after placing (#207)**: the power editor (it stays on since #174) hid everything that is not a power device, also what was just placed. The water, gas and heat meters now stay visible in the power editor; placing anything else there switches the editor off, with a note in the status line.
- **Solar panel rack (#208)**: the post stuck out through the panel (it was too long from the start). Every panel now stands on four posts that end just under it. On a sloped roof each post reaches down to the roof under it and the panel is lifted clear of the roof, so nothing floats or sticks into the roof.

## [3.43.4] - 2026-10-05
### Changed
- **Code split, step 22 (#137)**: placing things (catching the grid and wall corners, clicking wall-hung devices flat onto a wall, the LED ring around a room, the list of wall-hung types) moved out of `app.js` into `placement.js`, with unit tests. No change in behaviour.

## [3.43.3] - 2026-10-05
### Changed
- **Code split, step 21 (#137)**: the navigation (floor pills, room menu, scroll arrows of the bar, the tablet's room button, the area the camera frames) moved out of `app.js` into `nav.js`, with unit tests. No change in behaviour.

## [3.43.2] - 2026-10-05
### Changed
- **Code split, step 20 (#137)**: the wall stop (things cannot be pushed into a wall, they slide along it, doorways let them through) moved out of `app.js` into `collide.js`, with unit tests. No change in behaviour.

## [3.43.1] - 2026-10-05
### Changed
- **Code split, step 19 (#137)**: the roofs (roof size, roof surfaces with dormers and further roofs, the railing of a roof terrace, solar panels on the roof, fading when the camera comes close) moved out of `app.js` into `roofs.js`, with unit tests for the roof sizes. No change in behaviour.

## [3.43.0] - 2026-10-05
### Added
- **Metal bridge / walkway (#189)**: new part „Brücke / Übergang“ in the library (Outdoor): a grating deck on two steel beams with a railing on both sides, 3 m long and 1.2 m wide by default. Length, width and railing are set in the properties; the walking surface is at the level of the floor it is placed on, so placed on the upper floor it joins two building parts. Import and export keep `len`, `w` and `noRail`. The geometry is in the new module `bridge.js` with unit tests.

## [3.42.0] - 2026-10-05
### Added
- **Water, gas and heat meters (#136)**: three new devices in the library (category Smart home next to the sensors, the search also finds them under „Zähler“ / „meter“): water meter on its pipe, gas meter and heat meter with a red and a blue pipe. Linked to a sensor they show the reading as a badge with their own sign: 🚰 1234.6 m³, 🔥 845.2 m³, ♨ 5321 kWh.
### Changed
- The texts of the value badges moved out of `app.js` into `badgetext.js` (with unit tests); sensors with the device class water, gas or energy get a sign too.

## [3.41.0] - 2026-10-05
### Added
- **Solar panels on the roof (#176)**: a solar panel placed on the roof floor now lies on the roof itself: its height and slope follow the roof surface below it (gable, hip, flat roof and further roofs), also while it is moved. On a flat roof it stands on racks. New fields in the properties: panels side by side and rows (a field of up to 12 x 12 panels) and the mounting (automatic, flat on the roof, on a rack). The roof maths is in the new module `solarroof.js` with unit tests; import and export keep `cols`, `rows` and `mount`.

## [3.40.8] - 2026-10-05
### Fixed
- **Power editor stays on (#174)**: in the power editor the other devices (lamps, furniture ...) came back after a few seconds, because the next state update made every device visible again. They now stay hidden until the editor is switched off, also after the scene is rebuilt. The power button below keeps its state the same way. Browser tests guard both.

## [3.40.7] - 2026-10-05
### Changed
- **Code split, step 18 (#137)**: the room lighting shaders and colour scales moved out of `app.js` into `roomlight.js`, the ground (earth, lawn, plot shape, the cut through the earth) into `earth.js`, with unit tests. No change in behaviour.

## [3.40.6] - 2026-10-05
### Changed
- **Code split, step 17 (#137)**: the floor panel (name, kind and order of a floor, adding a basement or a roof, deleting; the roof with its dormers and further roofs) moved out of `app.js` into `floorpanel.js`, with unit tests. No change in behaviour.

## [3.40.5] - 2026-10-05
### Changed
- **Code split, step 16 (#137)**: the settings (form, loading with retries, saving with the ETag guard, the users dialog) moved out of `app.js` into `settings.js`, with unit tests. Applying the settings to the house and the view stays in `app.js`. No change in behaviour.

## [3.40.4] - 2026-10-05
### Changed
- **Code split, step 15 (#137)**: doors, gates and windows with a contact sensor (open or closed, the "n open" list, the moving leaves) moved out of `app.js` into `openings.js`, and the cutaway (walls towards the camera sink down or turn see-through) into `cutaway.js`, with unit tests. No change in behaviour.

## [3.40.3] - 2026-10-05
### Changed
- **Code split, step 14 (#137)**: the properties panel moved out of `app.js` into `props.js` (fields per object type, LED ring sections), `objlist.js` (object list of the floor), `roomentities.js` (entities of the selected room, automatic placement), `propfields.js` (input fields of the side panel) and `entitypicker.js` (entity picker with search, grouped by area), with unit tests. No change in behaviour.

## [3.40.2] - 2026-10-05
### Changed
- **Code split, step 13 (#137)**: live control (switching, light controls, scenes, the "whole room" block), the live popup and the room panel moved out of `app.js` into `livecontrols.js`, `livepopup.js` and `roompanel.js`, with unit tests. Two small geometry helpers (area, distance to an outline) now live once in `rooms.js`. No change in behaviour.

## [3.40.1] - 2026-10-05
### Added
- **Import, export and API know stairs (#191)**: the house JSON now has `stairs` per floor (types straight, L, U, spiral and wall, with `floors`, `dir`, `turn`, `w`, `tread`, `rot`, and `path` for a wall stair), plus `blocks` (placeholder blocks) and `holes` (floor openings). Invalid values are reported with their JSON path, the export writes them back (round trip), the JSON schema describes them, and the import summary of the API counts `stairs`. The AI prompt of the import dialog mentions stairs. Documentation (German and English) extended.

## [3.40.0] - 2026-10-05
### Added
- **Stairs over several floors (#188)**: every stair now has a "Floors" setting (1 to 6). A straight, L or U stair simply gets long enough, a spiral makes one turn per floor. The opening in the floor is cut into every floor the stair goes through.
- **Wall stair (#188)**: a light stair that hangs on a wall. You click its path along the wall in the 2D plan (double click or Enter ends it, Esc cancels). The path snaps onto the wall face, and every bend is a **landing** (also at corners between two walls). The steps are thin plates with nothing below them. You choose the side the steps stick out to; the width is dragged at a handle. It can climb several floors.
- **Outdoor spiral (#188)**: the spiral also works over several floors, so it can go from the garden up to a roof terrace.
### Changed
- The stair fields of the properties panel moved from `app.js` into `stairtool.js`. The stair unit tests now run on the whole static folder (CI step changed).

## [3.39.12] - 2026-10-05
### Changed
- **Code split, step 12 (#137)**: placeholder blocks, floor openings, the plot and the stair tool moved out of `app.js` into `blocks.js` and `stairtool.js`, with unit tests (shape of a stairwell, which floor a block goes to, floor shapes with openings). No change in behaviour.

## [3.39.11] - 2026-10-05
### Changed
- **Code split, step 11 (#137)**: the library palettes (device types by category and search, your own 3D models) moved out of `app.js` into `palettes.js`, with unit tests.
### Fixed
- The search in the library now also finds shipped 3D models whose name has capital letters (the typed text was made lower case, the name was not).

## [3.39.10] - 2026-10-05
### Changed
- **Code split, step 10 (#137)**: the background image (template to trace) moved out of `app.js` into `background.js`, with unit tests for the calibration and for replacing a picture. No change in behaviour.

## [3.39.9] - 2026-10-05
### Changed
- **Code split, step 9 (#137)**: the two table-like parts of the settings (tablet assignments and colour scales) moved out of `app.js` into `settingsui.js`, with unit tests. The simple fields, applying and saving the settings stay in `app.js` for now. No change in behaviour.

## [3.39.8] - 2026-10-05
### Changed
- **Code split, step 8 (#137)**: the houses (list, drop-down, new / copy / rename / delete) moved out of `app.js` into `houses.js`, with unit tests for the choice of the house to open. Loading a plan stays in `app.js`. No change in behaviour.

## [3.39.7] - 2026-10-05
### Changed
- **Code split, step 7 (#137)**: the floor rail (side bar with a picture of every floor) moved out of `app.js` into `floorrail.js`, with unit tests for the drawing. No change in behaviour.

## [3.39.6] - 2026-10-05
### Changed
- **Code split, step 6 (#137)**: the floor cards of the whole-house view moved out of `app.js` into `floorcards.js`, with unit tests for the numbers and the placement. No change in behaviour.

## [3.39.5] - 2026-10-05
### Changed
- **Code split, step 5 (#137)**: cameras (field-of-view cones, cameras overview, still images) moved out of `app.js` into `cameras.js`, with unit tests. No change in behaviour.

## [3.39.4] - 2026-10-05
### Changed
- **Code split, step 4 (#137)**: offline list, wall tablet (screensaver/night) and value badges moved out of `app.js` into `offline.js`, `kiosk.js` and `badges.js`, with unit tests. No change in behaviour.

## [3.39.3] - 2026-10-05
### Fixed
- **Compass (#175)**: after a full turn around the house the needle no longer spins all the way back. The angle now keeps counting beyond 360 degrees. The compass moved into its own module `compass.js` with unit tests.

## [3.39.2] - 2026-10-05
### Changed
- **Code split, step 3 (#137)**: the warnings (banner, red room, jump to the room), the "Where is ...?" search and the kitchen run properties moved out of `app.js` into `alertsui.js`, `search.js` and `kitchenui.js`. `app.js` is about 190 lines shorter. Nothing changes for the user.

## [3.39.1] - 2026-10-05
### Changed
- **Code split, step 2 (#137)**: the power add-on (cables, power editor, energy overview, battery, properties) moved out of `app.js` into `power.js` (3D and screen part) and `powerlogic.js` (the calculations, with 9 unit tests). `app.js` is about 240 lines shorter. Nothing changes for the user.

## [3.39.0] - 2026-10-05
### Added
- **Battery: you see whether it charges**: the overview next to the room menu shows the charge level and an arrow, `↑ 600 W` while it charges and `↓ 450 W` while it discharges (nothing when it rests). The battery gets an optional sensor for the power (properties: *Sensor for charging / discharging*; plus = charging, or a text sensor saying charging / discharging) and *Turn the sign round* for meters that count the other way. Without that sensor, a battery whose own sensor reports watts works too. Import / export: `batPower`, `batInvert`.

## [3.38.1] - 2026-10-05
### Changed
- **The language starts on Auto**: the demo (it was fixed to English) and the add-on follow the language of the browser. Settings stored by older versions with a German default that nobody picked are treated as Auto too; once a language is chosen in the settings it stays chosen. New hidden setting `langChosen`.

## [3.38.0] - 2026-10-05
### Added
- **Power: cables can be picked and deleted**: in the power editor a click on a cable (2D: the line, 3D: the cable or its thick invisible hit tube) selects it; the properties show where it goes, its kind, its route, an optional own sensor and a **Delete cable** button (also the Delete key). The list in the device properties keeps its cross.
- **Cable colours**: every cable has a kind that sets its colour: *grid / feed-in* (red), *own solar* (green), *battery* (blue), *consumption* (amber). The default follows the device the cable starts at; it can be changed per cable (also in the import: `kind`).
- **Energy overview** next to the room menu: what the house produces (inverters, else solar panels), what it draws from or feeds into the grid (meters), the calculated consumption and the battery charge. A click shows or hides the cables. A cable can have its own sensor (`entity`), a charge level in % is never shown as watts.
- The **demo** now shows its version in the top bar (`vX.Y.Z · demo`) and has a house battery with its own cable.
### Fixed
- **Power things in the 2D plan** had a huge 0.8 m box; they now have their real size (meter 22 x 11 cm, inverter 45 x 16 cm, solar panel 1.0 x 1.55 m ...).

## [3.37.0] - 2026-10-05
### Added
- **Kitchen run: every module can have its own width** (a number field per module, 30 cm to 2.4 m); drawer, sink, dishwasher and the rest follow in 2D and 3D, the leg length updates. The dishwasher is called *Dishwasher* / *Spülmaschine* in the module list. Import / export: a module is its name or `{ "m": name, "w": metres }`.
### Changed
- **Compass**: the ring with N / E / S / W now stands still (north is up) and only the needle turns to where you look, instead of the whole dial spinning.
- **Roof**: the tool bar button *Gauben* is now *Roof* (shape, dormers, further roofs) and the section *Further roofs* explains how to add a second roof (*+ Further roof*, then shape, size and the floor it sits on).

## [3.36.3] - 2026-10-05
### Fixed
- **Power editor**: turning it on now opens the library with the power things at once (before, the *Device* tool had to be chosen first and nothing showed). In the editor **only power devices** can be hit, selected or moved; walls, doors, windows, rooms and all other devices are no longer picked. The cable tool also works with clicks in the 3D view (the small devices are found within a finger's width of the pointer; before, the click often hit a door or wall behind them), and a click on something that is not a power device says so in the status line.

## [3.36.2] - 2026-10-05
### Changed
- **Demo shows the new features**: the thermostat has a target temperature and modes (the heating panel works, `+`/`-` and the mode buttons answer), a radiator glows with the heating, the kitchen is a *kitchen run*, and a small power grid is wired up (house connection, meter, meter cabinet, inverter, three solar modules with watt values and cables). Test hook `powerLinks()` for the browser tests.

## [3.36.1] - 2026-10-05
### Changed
- **Code split, step 1 (#137)**: the heating panel moved out of `app.js` into its own module `heatpanel.js` with unit tests (rounding of the target temperature, the badge, one call for several clicks, the mode buttons). Nothing changes for the user.

## [3.36.0] - 2026-10-05
### Added
- **Power editor (#136)**: new tool bar button *Power editor*. While it is on, only the power things are shown and can be picked or moved (house connection, meter cabinet, meter, inverter, solar panel, battery, wallbox) and the cables are shown; everything else is hidden. The library switches to the new category *Power*.
- **Cable tool**: click one power device, then another, and a cable is drawn. A device can have **several cables**; in its properties each cable has its target, its **route** (*along the floor*, *through the floor* for another storey, or *free in the air*) and a cross to remove it, and the cables that arrive are listed.
- **Cables in 2D and 3D** on every floor: amber lines in the plan (a cable to another floor ends in an arrow with the floor's name), flowing dots and the watt value in 3D. New devices *House connection*, *Meter cabinet*, *Home battery* and *Wallbox*.
### Changed
- Import / export: `cables` (list of `{to, route}`) replaces the single `feeds` of 3.35.0 (still read).

## [3.35.0] - 2026-10-05
### Added
- **Power add-on, cables (#136)**: a solar panel, inverter or power meter can be wired to another one (*Cable to* in the properties). The cable is drawn in 3D with flowing dots: direction and speed follow the watts of the device's entity (negative flows backwards, kW is converted) and the value is shown on the cable. A **Power** button next to Normal / Temperature / Humidity / CO₂ switches the cables on and off (it only appears when the house has such a device).
- **Import / export**: devices can carry an `id` and `feeds` (the `id` of another device) so cables survive the round trip; kitchen runs (`legs`, `upper`, `depth`) are part of the format now. Documented in the schema.

## [3.34.0] - 2026-10-05
### Added
- **Power add-on, first step (#136)**: new devices *Inverter*, *Power meter* and *Solar panel* (category Smart), with a 3D model each, linkable to Home Assistant entities and usable in 2D and 3D like all other devices. Animated cables, watt values and the on/off switch at the bottom follow in a later step.

## [3.33.0] - 2026-10-05
### Changed
- **Doors and windows in very short wall pieces (#142)**: an opening that is wider than the wall piece is no longer refused but shrinks to the width that is left (at least 10 cm; was 30 cm). The width can be set down to 10 cm for slit windows and narrow doors.

## [3.32.0] - 2026-10-05
### Added
- **Kitchen run (#124)**: new device *Kitchen run* built from modules (base cabinet, drawers, sink, stove, dishwasher, fridge, tall cabinet, gap). Shape straight, L or U (up to 3 legs, 16 modules each), depth and optional wall cabinets; modules can be added, moved and removed in the properties. Drawn as cabinets in 3D and as module boxes in the 2D editor.

## [3.31.0] - 2026-10-05
### Added
- **Several different roofs per house (#125)**: besides the main roof, the roof floor can have **further roofs** (up to 8), each with its own shape (gable / hip / flat), pitch, overhang, base (left, top, width, depth) and the **floor it sits on**, e.g. a flat roof over an annex that has only one storey. New section *Further roofs* in the panel of the roof floor with a card per roof, a *+ Further roof* button and a cross to remove one.
- **Import / export**: `building.roof.parts` (list of roofs with a `box`, optional `name`, `type`, `pitch`, `overhang`, `dormers` and `level` = index of a floor in `building.floors`); the export writes it again, so a house survives the round trip. Documented in the schema.

## [3.30.0] - 2026-10-05
### Added
- **Heating panel (#134)**: in the live mode a click on a room opens a **second panel next to the room panel** with the thermostats (`climate.*`) of that room: the room temperature, the target temperature with **− / +** (clicks in a row become one call, the limits and the step come from the thermostat) and the **modes** it offers (off, heat, auto ...). Lights and heating are in view at once. On a phone the panel sits at the top.
- **Sign that the heating runs**: a badge *🔥 heating* in the panel and the **radiator glows** in 3D while the thermostat's `hvac_action` is heating (cooling shows *❄*). Before, a thermostat in the state `heat` counted as "on" even when it was idle.
- The thermostats are no longer in the room panel's list.
- Backend: the services `climate.set_temperature` (4 to 40 °C) and `climate.set_hvac_mode` (only the known modes) are allowed; the live channel carries `hvac_action`, the target, its limits and the modes of a thermostat.

## [3.29.0] - 2026-10-05
### Added
- **Compass** in the 3D view (bottom left): the rose turns with the camera (north is up in the 2D plan) and says from which side of the house you look, e.g. *View from S* (7 languages).
- **Live mode, finger boxes (#130)**: lamps and other things get a bigger invisible hit box (at least 60 cm) that only the live mode uses.
### Changed
- **Live mode (#130)**: only things that are linked to something (an entity, a TV backlight, an LED ring with lights) can be tapped. Furniture without a link no longer takes the tap away from the lamp behind it. **Doors and windows have no hit box** in the live mode any more (in the edit mode everything can still be picked).
### Fixed
- **Roof editing**: with *See-through* on, the roof (and its dormers) were nearly invisible while you edit the roof floor. While the roof floor is open the roof now stays clearly visible (at least 85 %), also close up.
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
