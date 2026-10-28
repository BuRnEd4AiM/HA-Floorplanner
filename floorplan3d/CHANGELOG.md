# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [4.39.0] - 2026-10-28
### Added
- **🩺 Protokoll: who controls what** (#579, the owner: "Wäre es nicht sinnvoll, noch irgendwo so ein Log … hinzuzufügen, wo man so auch auslesen kann, was gerade wen steuert? Das wäre ja dann noch praktisch für dich, dass du so Fehler … auswerten kannst"). 🌡 Klima has a new view **🩺 Protokoll**, also as a button on every room card with a thermostat (it opens on that room):
  - On top the connection to Home Assistant and the settings that decide (the window rule with its minutes, doors to the outside, rooms left out; the schedule with "turned by hand: back after"), thermostats in no room of the plan and windows or doors with a contact at no room.
  - Every room as the add-on sees it: who controls it now, its thermostats (mode, target, what it measures, the room sensor, who changed it last), its windows and doors with their state and whether the window rule counts them; if not, why (a door between two rooms, the rule off, "doors to the outside" off, the room left out, no thermostat in the room).
  - The log, newest first, with a filter per room: a contact opening, shutting or not reporting; a thermostat's mode or target changing and by whom (the add-on itself, with how long after it sent it; an automation or a script; somebody in Home Assistant; at the thermostat itself or through its integration); what a room's rules do; what a rule decided and whether Home Assistant took the call; the room sensor's calls; the connection lost and back; the add-on's start.
  - **"📋 Bericht kopieren"** puts the whole as text with the entity ids on the clipboard, to paste into the chat; **"⬇ Als Datei"** saves it with the whole log.
  - The add-on keeps the log itself, also with no screen open: the last 500 entries in `rules-trace.json` (written at most once a minute), read through the new address `api/rules/trace`. The demo shows a made-up day.
### Fixed
- **No "✋ Von Hand gedreht" right after the add-on set the thermostat itself** (#579, the owner: "manchmal … von selbst gedreht, dass es manchmal … einfach er selbst [ist] und er weiß es irgendwie nicht"). When the schedule sent a new temperature, a sleepy radiator thermostat reports it some seconds or minutes later; until then Home Assistant shows the old target, and the next look 15 seconds later took that for a turn by hand ("✋ … ab 10:10 wieder Komfort"). The same after the window shut, when the thermostat had been set as cold as it goes. Now the add-on remembers what it sent: for 3 minutes the old target is no turn by hand (🩺 Protokoll says "⏳ 21° geschickt, das Thermostat hat es noch nicht gemeldet"); still the old one after 3 minutes, it sends it once more (at most 5 times). A target that is neither stays a turn by hand as before.
- **A window contact that does not report for a moment no longer ends the pause** (#579): when Home Assistant or Zigbee2MQTT starts again, a contact is "unavailable" or "unknown" for a moment; that counted as shut, the heating went on, and off again after the minutes of the window rule. An open window whose contact does not report now still counts as open for 15 minutes; a shut one stays shut.
### Changed
- Test protocol: new section 126.

## [4.38.2] - 2026-10-28
### Fixed
- **Room sensor "↕ Wunsch verschieben": the wish no longer climbs by itself** (#577, the owner: "seitdem … reagiert die Heizungssteuerung irgendwie nicht mehr so, wie sie soll. Der Heizplan überschreibt irgendwie alles, selbst wenn die Fenster aufgehen"; his picture: Soll 29,5°, "↕ am Thermostat 30°", "✋ Von Hand gedreht · ab 17:23 wieder Komfort 27,5°"). A target at the thermostat that still differed 3 minutes after the add-on sent one became the new wish. A sleepy thermostat that reported the add-on's earlier, already moved target late so turned it into the wish, and the difference came on top once more (27,5° → 29° → 30°); the heating rules took that for "turned by hand" and set the schedule's temperature again after 10 minutes, over and over. A target the add-on itself sent in the last 30 minutes now never counts as a wish; one really set in Home Assistant or at the device still does.
- **With the window open the room sensor leaves the thermostat to the window rule** (#577): while the window rule holds a thermostat, its sensor moves nothing. Before, a thermostat that went back to heating by itself got a warm target from the sensor again, and the window rule's "as cold as it goes" became a wish that was moved up. The card 🌡 Raumfühler says "⏸️ pausiert, das Fenster ist offen · danach wieder 21°" meanwhile, the circle on 🌡 Klima shows the thermostat's own target. Shut, the wish of before comes back, moved.
- **A thermostat that is off for a moment and then heats again by itself gets "as cold as it goes"** (#577, since 4.37.2): the window rule counted its tries from zero each time it saw the thermostat off, so such a thermostat only got "off" every 3 minutes and heated in between. The tries now count as long as the window is open.
- **A door to the outside switches the heating off even when something drawn as a room lies beyond it** (#577, the owner's door of the living room FL goes outside, but the rule did not even say "Fenster offen"): the window rule took a door for one to the outside only when it lay on the edge of exactly one room; with a terrace or another area drawn as a room beyond it, it counted as a door between two rooms. Now a door leads outside also when one of its sides (just beyond the wall) lies in no room or only in an open area (a room with "Dachterrasse / offener Bereich"), as the plateau's outdoor steps already decide it (`levels.js`). A door between two closed rooms still does not count.
### Changed
- Test protocol: new section 125 for the owner's living room.

## [4.38.1] - 2026-10-28
### Fixed
- **A shed dormer's pitch follows its wall at once** (test 42.4, found by Claude while testing in the demo): with a high "Höhe der Wand" the dormer's roof gets flatter by itself; the field "Neigung der Gaube" showed the new value only after the panel was opened again. Now it shows it at once.
- **The room tiles at the bottom keep their chips inside**: with lights on, a window open and "⏸ pausiert" of the heating rules at once, the third chip ran under the next tile (seen on the new picture of the README); now it goes to a new line of its tile.
### Changed
- **The README shows what is new since 4.4**: the pages of the tab bar (☀ Today, ⚡ Energy, 🌡 Climate, 📷 Cameras, 🎵 Music & TV, 🧺 Household, ▶ Routines, 👨‍👩‍👧 Family), heating rules, schedule, the room sensors of the thermostats, own routines as automations of Home Assistant, scenes, the train card, the moon, the plateau and the cabinet editor; every picture taken again (8 new ones: `today`, `energy`, `climate`, `heatrules`, `heatplan`, `routines`, `flowedit`, `closet` in `tools/make_screenshots.py`).
- Test protocol: Claude checked every open point that can be checked in the demo (8.5, 42.1 to 45.3, 110.6, 110.12, 110.13, 122.1); the earlier ❌ that were repaired and checked under new numbers are ✅ now. Open are only points for real devices.

## [4.38.0] - 2026-10-28
### Added
- **🌡 Room sensors for the thermostats, like Better Thermostat** (#573, the owner: "Ich hätte gerne so etwas, wo ich einfach jedem Thermostat einfach einen Temperatursensor gebe … wie bei Better Thermostat"; his choice from the example pictures in `docs/ideen-4.38/`: the add-on regulates itself, with every kind of thermostat, the room's sensor only suggested). A thermostat on the radiator measures the warm air right at the radiator (his living room: 25,1° there, 20,5° in the room) and stops too early. 🌡 Klima → 📋 Heiz-Regeln has a new card **"🌡 Raumfühler für die Thermostate"**: every thermostat with the sensor in its room an admin gave it, what it measures itself and what the add-on does. A sensor of the same room is shown as **"💡 Vorschlag … ＋ Übernehmen"**; the window **"Fühler für …"** lists the sensors of the room first, then the others (with search), never one of a thermostat's own device. The add-on regulates by the sensor, also with no screen open:
  - **🎯 Ausgleich am Thermostat**: when the thermostat's device has a setting for it (a temperature offset or calibration: Zigbee2MQTT, ZHA, Matter …; or an input for an external temperature with its select set to external: Sonoff TRVZB, Aqara, Bosch, Danfoss Ally in hundredths), the add-on sets it from the sensor. The thermostat then works with (and shows in Home Assistant) the room's temperature.
  - **↕ Wunsch verschieben**: any other thermostat (Homematic IP, tado, FRITZ!DECT …): the add-on keeps the wish (the temperature wanted in the room) and sets the thermostat to wish + (what it measures − the sensor). A temperature set on the add-on's pages and by its heating rules (schedule, night, window, boost) is the wish; one set in Home Assistant, by an automation or at the device becomes the new wish.
  - **✨ Automatisch** (the default) takes 🎯 when the device can, else ↕; **👁 Nur anzeigen** only shows the sensor.
  - To save the batteries it writes at most every 10 minutes and only from 0,5° of difference (both in the card), and after a new offset it waits until the thermostat has measured with it. While the sensor does not report, the thermostat regulates on its own; a sensor taken away (or the card switched off) puts the thermostat back as before (its offset, its select, its target the wish).
- **Everywhere the add-on shows a thermostat's temperature it is the sensor's** (the circle on 🌡 Klima with "🌡", the cards, badges, room tiles and labels), and for a moved target the wish; under the thermostat on 🌡 Klima a line "🌡 Raumfühler 21,4° · am Heizkörper 24,6° · 🎯 Ausgleich −3,2°". The log of ▶ Abläufe has the add-on's writes ("🌡 Raumfühler"). The card names the kind of each thermostat (Zigbee2MQTT, ZHA, Matter, Homematic IP …).
- The demo: the living room's thermostat has its sensor and an offset (Zigbee2MQTT), the office's air conditioner gets its room's sensor suggested.
### Changed
- New modules instead of more app.js: `roomsensors.py` (pure: the card's settings, finding the offset or external input of a device, the offset, the moved target, the wish, back as before; `tests/test_roomsensors.py`), `roomsensors.js` (pure: the states with the sensors' temperatures, the sensors offered, what the card and the lines say; `tests/roomsensors.test.mjs`) and `roomsensorsui.js` (the card, the window, the line on 🌡 Klima). `heatrules.clean_rules` keeps `heat.sensors`; `rulesrun.py` shows the heating rules the wish of a moved thermostat and turns their targets into wishes, then runs the sensors; `api/service` takes a page's temperature for a moved thermostat as its wish; `renames.py` keeps each thermostat's integration (`plat`); rules may call `number.set_value` and `select.select_option`. `api/rules` has `status.sensors`, `status.cal` and `status.plat`. New browser test part `56_roomsensors` (the mock Home Assistant sets numbers and announces registry changes).

## [4.37.2] - 2026-10-28
### Fixed
- **With the window open the thermostat really goes off, and stays off** (#571, the owner after 4.37.1: "Aber aus wird das Thermostat dann nicht, soll das so?"; 🌡 Klima said "Heizung pausiert · Fenster offen seit 25 Min", his thermostat still heated at 17°). The window rule sent "off" once and from then on believed it. A thermostat that does not take it, or goes back to heating by itself, now gets the call again: as long as the window is open the rule looks at it every time; still heating after 3 minutes, it gets "off" once more, then "as cold as it goes" (5° or its own minimum, which every thermostat takes; an air conditioner only "off"), at most 5 times. If it still heats after that, the line says so: "⚠️ Fenster offen seit … Min · das Thermostat geht nicht aus, es heizt weiter" instead of "pausiert". Shut, it goes back to its temperature from before as until now.
### Changed
- `heatrules.py`: `paused`, `keep_off` (`RETRY` 180 s, `TRIES` 5), the room's status has `stuck`; `rules.js` `roomLine` shows it (text `hr.line.stuck` in all languages). Unit tests in `tests/test_heatrules.py` and `tests/rules.test.mjs`.

## [4.37.1] - 2026-10-28
### Fixed
- **The window rule switches the heating off again when a window is open, also under the schedule** (#568, the owner: "bei mir ist das Fenster offen, die Steuerung ist an, aber er überschreibt nicht den Heizplan, sondern der Heizplan ist noch immer drin"). The rule left a room alone when its thermostat has a window detection of its own; it took that from a switch "window detection" of the thermostat's device being on. On nearly every radiator thermostat (Zigbee, Tuya, Sonoff, Aqara, Bosch …) that switch only allows the detection and is on from the factory; the thermostat itself guesses an open window only from a quick drop of the temperature, which often does not come. Now the window contact in the plan always counts: open longer than the minutes set, the heating goes off, shut again, it comes back as before (or the schedule's block of now). "🔎 Wird benutzt" still shows the thermostat's own detection.
- **The temperature over a room is the one of its sensor** (#569, the owner: "die kann aber nicht sein, weil keine von den Temperaturen, die da drin ist, ist die Temperatur, die da oben angezeigt wird"; his living room showed 22,8°, its sensor 20,5°, the thermostat at the radiator 25,1°). The room's value was the average of its sensors and its thermostats; a thermostat measures at the warm radiator. Now a room's own sensors count first; the thermostat (its current value and the sensors of its device) only when the room has none. The same for humidity. Everywhere the room's value is used: the labels over the rooms, the room tiles, the colours "Temp." / "Feuchte", the cards of 🌡 Klima (there "im Raum …" beside the thermostat's value) and the voice search ("Wie warm ist es im Wohnzimmer?").
### Changed
- `roomReading` (`roomtiles.js`) takes `partOf` (`thermostatParts(areas)`: the sensors of a thermostat's device from `api/areas`, #370), passed through `roomSummary`, `roomClimate` and `climateRooms`; `heatrules.step` and the server no longer have `own_window`. Unit tests in `tests/roomtiles.test.mjs`, `tests/climate.test.mjs` and `tests/test_heatrules.py`.

## [4.37.0] - 2026-10-27
### Added
- **▲ A plateau in the ground: a second house in the same plan stands higher** (#566, the owner: "das andere Haus steht aber auf einem leichten, erhöhten Plateau … man läuft erst eine Treppe hoch … ich möchte das zweite Haus einfach da drin zusätzlich zeichnen"; his choice from the example pictures in `docs/ideen-4.37/`: a plateau in the ground and a height per room, both at once). An area of the plot (tool "Grundstück") gets **"Höhe über dem Rasen"**: everything of the house that stands on it goes up with it, on every floor: rooms, walls, doors, windows, devices, stairs and the roof over it. Its **edge** is a retaining wall (**natural stone, concrete, clinker or gabions**, with cover stones on top) or a **bank of lawn** that runs down to the lawn; its surface lies on top. In the palette of the tool **"▲ Plateau unter [Gebäude] · Anlegen"** lays one round the outline of a building (20 cm more on every side, 60 cm high to start with), or of the whole house.
- **"＋ Außentreppe an die Haustür"** in the plateau's side panel: outdoor steps of stone from the lawn up to the front door, a landing on top, a hand rail on both sides, steps of at most 18 cm (90 cm = 5 steps). Also a new piece **"Außentreppe"** in the library (Außen) with its height, width, landing and rail; the 2D plan shows its treads.
- **A room's floor higher or lower than its storey** (#566): **"Boden höher als die Etage"** in the side panel of a room (minus: lower, e.g. a sunken living room). Its floor and what stands in it go up, the ceiling stays (and what hangs from it); doors and windows in its walls go up with the higher side; at a door to a floor of another height **steps** lie on the lower side by themselves ("Stufen an den Türen von selbst" switches them off). The side of the raised floor shows in the door and in the cut.
- The 2D plan shows how high a room lies (**"▲ +90 cm"** under its name), the plateau's height beside its longest side, its wall as a thick edge or its bank as a green band.
- JSON import and export: `plot.areas[].rise`, `edge`, `wall`; `rooms[].raise`, `steps`; the device `steps` with `h`, `w`, `land`, `noRail` (schema, `docs/IMPORT.md`). The show house (`examples/showcase.json`) has a garden house on a plateau of gabions with steps and a library 32 cm higher.
### Changed
- New modules instead of more app.js: `levels.js` (pure: what goes up by how much, doors and windows beside a raised room, the steps at the doors, the plateau under a building, the outdoor steps; `tests/levels.test.mjs`), `plateau3d.js` (the wall or bank in 3D) and `plateauui.js` (the fields); `floorbuild.js` lifts rooms, walls, devices, stairs, blocks and ceilings, `roofs.js` a roof over a plateau. New browser test part `55_levels`.

## [4.36.0] - 2026-10-27
### Added
- **"⇉ Auf alle anwenden" in the scene editor** (#564, the owner: "den Knopf sozusagen für egal welches Gerät auf alle anwenden in der Szene, dass … ich nicht jedes Gerät einzeln ansteuern muss"). Every device of a scene has the button at its foot: its settings go to every other device of the scene that can take them. A light gives the other lights on / off, brightness, colour or white tone and its effect (only to a light that has this effect), switches and fans on / off (a light that stays on keeps its colour); a roller shutter gives the other roller shutters its position. "✓ Für alle übernommen (3)" says how many changed, **"↶ Rückgängig"** at the top takes it back (also after "📸 Wie jetzt übernehmen").
- **A scene for everything**: the list "Geräte dazunehmen" filters by kind (**Alle, 💡 Lampen, 🔌 Schalter, 🪟 Rollläden**) and has **"＋ Alle … dazunehmen"**: every device found (with the search) into the scene at once. A scene may hold up to 100 devices (was 40).
- **The white tone in Kelvin** (#564, the owner: "bei Lampen zum Beispiel so eine Kelvin-Anzeige"): a slider coloured from warm to cold with its value, e.g. **"Weißton  2700 K · Warmweiß"** (Neutralweiß, Kaltweiß). In the scene editor for every light (the quick choices warm / neutral / kalt stay below it) and in the lamp's card and window and for a whole room, there in place of "Warmweiß / Kaltweiß" when Home Assistant says the lamp can do white tones; its range comes from the lamp (e.g. 2200 to 6500 K), for several lamps the range they share. "📸 Wie jetzt übernehmen" now takes a lamp in its white mode with its white tone, not as a colour.
- **Scenes of Home Assistant can be changed and deleted in the dashboard, not only looked at** (#564, the owner: "dass ich auch Szenen dort löschen kann, die von Home Assistant sind. Und nicht nur angucken, sodass ich die auch verwalten kann"). ✏ opens a scene made in Home Assistant's editor itself (no longer a copy): "Speichern" changes it there; what the editor cannot show (e.g. a TV in the scene, a transition, a device left as it was) stays exactly as it was; **"📋 Als Kopie"** saves it as a new scene instead. **🗑** in the card deletes a scene (after asking).
- **Automations of Home Assistant can be managed on ▶ Abläufe** (#564, the owner: "… und die Automatisierungen auch"): next to on / off each one made in Home Assistant's editor has **▶** (run it now; a moment ✓ when Home Assistant took it), **↗** (change it in Home Assistant's editor) and **🗑** (delete it, after asking).
- **"↶ Wiederherstellen"**: before it changes or deletes a scene or an automation of Home Assistant the add-on keeps the old version (`ha-backup/` in its data folder, the last 20); after deleting, the card shows "🗑 „…“ gelöscht · ↶ Wiederherstellen" for five minutes and writes it back to Home Assistant.
### Changed
- The server sends a light's white tone (`kel`, only in its white mode) and the white tones it can do (`kmin`, `kmax`); new addresses `DELETE api/automations/<id>` and `POST api/ha-restore`, `api/scenes/<id>` also for scenes made in Home Assistant (`scenes.merge_ha` keeps what the editor cannot show). Only scenes and automations of Home Assistant's editor (with an id) can be changed or deleted; one in a YAML file of its own is refused ("nur dort zu ändern"), the add-on's own routines stay with their routine. `automation.trigger` is allowed for editors.
- New modules `kelvin.js` (pure, `tests/kelvin.test.mjs`), `kelvinui.js` (the slider) and `hamanage.js` (delete with "↶ Wiederherstellen"); `applyToAll`, `allTargets` and the kinds of the picker in `scenes.js` with unit tests. The browser test parts `52_scenes` and `11_live` check the new buttons, the slider, changing in place, deleting and restoring.

## [4.35.0] - 2026-10-27
### Added
- **The settings over almost the whole screen, with a list of groups on the left** (#562, the owner: "dass diese fast über den ganzen Bildschirm geht, so muss man nicht ewig scrollen … eine professionelle Einstellung … einfach schön und übersichtlich"; his choice from the example pictures in `docs/ideen-4.35/`: the side list). On a PC or a tablet held across, ⚙ fills the screen instead of a narrow column of 440 pixels: on the left the 14 groups (symbol, name and what is in it), like the settings of Home Assistant or Windows; on the right the chosen group with its settings as tiles in two or three columns (a setting with its grey hint is one tile, lists and longer explanations take the full width). A tap in the list shows another group; the group comes back the next time (per browser); ↑ / ↓ walk through the list. The search at the top shows every group it finds on the right, one under the other, the list only those, the tile with a hit is marked; a tap on a found group's name goes there. Phones and narrow windows keep the groups that fold, as before.
### Changed
- The performance display for edge smoothing "Automatisch" says **"beim Drehen ohne Glättung"** or **"glättet auch beim Drehen"** instead of "Grafik zu langsam" / "Grafik reicht" (#560, the owner: "grafik sagt er zu langsam, aber ich spüre nix davon, es läuft flüssig": that is how it should be).
- `setgroups.js`: the list (`#sgNav`), the place on the right (`#sgPane`) and the tiles (`.sgTile`, `display: contents` on a narrow screen, so the folding groups look as before); `pickGroup` and `tileRuns` with unit tests; the event `sg-show` shows a group at once (`openSettingsAt`). The browser test part `28_settings` checks both layouts (narrow at 820 pixels, wide at 1400); the test helper `open_setting` shows the group on a wide screen.

## [4.34.0] - 2026-10-27
### Added
- **Edge smoothing to choose: smooth when the picture stands, smoothed afterwards, automatic** (#560, the owner after #557: "kannst du das einbauen, so dass ich es anschalten kann jeweils, das wäre praktisch"). Smoothing the edges (the browser's own antialiasing) costs the graphics the most, about 40 % of a frame. ⚙ has a new choice next to "Leistung auf diesem Gerät": **"Kantenglättung auf diesem Gerät"**, kept per browser like the performance, the page reloads:
  - **Wie bei „Leistung“** (the default): as before, smooth, off in the low-power mode "Schnell".
  - **Immer**: always smooth (the nicest, needs the most power).
  - **Glatt, wenn das Bild steht**: while you turn or move the house the picture is drawn without smoothing (fluid, the steps are hardly seen in motion); as soon as it stands (it moves less than half a pixel per frame) it is drawn smooth.
  - **Nachträglich glätten**: drawn without smoothing, then a small program (FXAA) softens the steps along the edges; costs little, fine lines and text in the 3D picture get a little softer.
  - **Automatisch**: smooth like "Immer"; when the graphics cannot keep up while you turn the house (fewer than 45 frames a second) it smooths only when the picture stands, until the page is opened again.
  - **Aus**: no smoothing (the fastest).
- The performance display ("alle Werte") has a line **"Kanten: …"**, e.g. "Kanten: automatisch · jetzt schnell · Grafik zu langsam", so you see what applies right now.
### Changed
- New modules `edges.js` (pure, `tests/edges.test.mjs`) and `smoothedges.js`; the FXAA shader of three.js in `vendor/shaders/FXAAShader.js`. The picture of its own is filled exactly like the screen (an sRGB render target marked like WebXR's, stored as RGBA8): a frame through it has the same colours to the last bit, glass, glow and see-through walls included (checked by the browser test). `?edges=msaa|still|fxaa|auto|off` in the address tries a mode. The browser test part `54_edges` checks the colours, the switching while turning, the shader, the choice in ⚙ and the display.

## [4.33.1] - 2026-10-27
### Fixed
- **Turning the house is smooth again, on a PC with weak graphics and in the low-power mode** (#557, the owner: "die Performance fühlt sich auf dem Sparmodus nicht flüssig an … trotzdem nicht mehr als 30 fps am PC" and "es erfüllt zwar die 30 fps, aber es fühlt sich trotzdem ruckelig dafür an"). On his PC (Chrome, Intel graphics) a frame takes the graphics longer than 1/60 s, so Chrome shows 30 frames a second; three things made those 30 frames feel jerky, and they are gone: (1) **no new shadows in the middle of turning**: the safety refresh of the shadows came every second and a wall sinking while the camera turns drew them in every frame of its way down; a frame with new shadows takes about a third longer and came too late. Now the refresh waits until the picture stands (at most 5 s), sinking walls get new shadows every 0.3 s and once when they stand. (2) **The camera glides the same per second at any frame rate**: it took 5 % of the rest of a move in every frame, made for 60 frames; at 30 frames it followed the mouse half as fast, and with uneven frames it jumped and stood in turn. (3) **Low-power mode ("Schnell")**: while you turn or move the house by hand (finger, mouse, wheel) every frame is drawn, not at most 30; as soon as the picture stands it rests again as before (30 frames, a few when nothing happens; the screen saver stays at 30). Its 30 frames now come evenly (a frame 0.1 ms early waited a whole frame more: 16, 33, 50 ms).
### Changed
- `frameloop.js`: `SLACK`, `MOVING`, `shadowDue` with `{ sinking, sank, lastMove }` (`SHADOW_REFRESH_MOVING`, `SHADOW_SINKING`), `dampingFor`; `app.js` sets `controls.dampingFactor` per frame and gives `controls.update` the time since the last frame (the screen saver turns at the same speed on every device). Unit tests in `tests/frameloop.test.mjs`.

## [4.33.0] - 2026-10-27
### Added
- **🌙 The moon in the sky** (the owner: "den Mondzyklus reinmachen, dass man sieht, was gerade für ein Mondzyklus ist, ob Vollmond oder Halbmond abnehmend … dass da irgendwo der Mond ist"). The sky behind the house now has the moon as it is now: full, half, a thin crescent or gibbous, lit on the right while it waxes and on the left while it wanes (the other way round on the southern half of the earth), with its grey seas, at night with a soft glow and the dark part faint, by day pale. It stands where it really is for your home: it rises on the left (east), is highest in the middle and sets on the right (west); under the horizon it is not there, behind clouds it is fainter, behind an overcast sky hidden. It stays in the background when you tap a room. The chips at the top right have a new one between time and weather: **"🌖 Abnehmender Mond · 96 %"** (Neumond, Zunehmende Sichel, Zunehmender Halbmond, Zunehmender Mond, Vollmond, Abnehmender Mond, Abnehmender Halbmond, Abnehmende Sichel); at night the time chip and the short line of a phone show the moon as it is instead of 🌙.
- Where home is comes from `zone.home` of Home Assistant (rounded to about 10 km); without it latitude 50° and the time zone. To try it out: `?skydate=2026-11-01&skytime=05:00` in the address shows the sky of that day and time.
### Changed
- New module `moon.js` (pure, `tests/moon.test.mjs`, compared with PyEphem: the phase to 1 %, the place in the sky to 1 to 2 degrees); `sky.js` gets `skyDateOf`; the server sends `geo` of `zone.home`; the browser test part `25_sky_tiles` checks the chip and the full moon of 26 October.

## [4.32.0] - 2026-10-26
### Added
- **📅 Heizplan: a thermostat turned by hand goes back to the plan after 10 minutes** (#546, the owner: "gerne wenn man von Hand dreht nach 10 min wieder zurück, aber das kann eingestellt werden"). Until now a turn by hand (at the device, in Home Assistant or on the page) stayed until the next block of the plan. Now the plan's temperature comes back **10 minutes** after the last turn; the Heizplan card of 📋 Heiz-Regeln has **"Von Hand gedreht: zurück nach"** with − / + (5 to 240 minutes, or 0: "erst beim nächsten Abschnitt", as before). The room on 🌡 Klima says **"✋ Von Hand gedreht · ab 22:40 wieder Nacht 17°"** (also as a line in 📋 Heiz-Regeln). A thermostat switched off or to "Auto" by hand is left alone (chosen on purpose), one that only rounds (whole degrees) does not count as turned; 🚀 Boost and an open window work as before.
### Changed
- `heatrules.py`: `by_hand` and the setting `schedule.hand` (default 10); the room's status has `hand` (when the plan comes back); `roomLine` in `rules.js` says it. Unit tests in `tests/test_heatrules.py` and `tests/rules.test.mjs`, the browser test part `50_rules` turns a thermostat by hand under a plan.

## [4.31.1] - 2026-10-26
### Changed
- **🚆 The card "Zug" always shows your train, also tomorrow's** (#550, the owner: "mache es so, dass ich auch immer den auch morgen sehe"). The railway lists only the next 3 hours, so in the evening the card said "Dein Zug um 06:05 ist nicht unter den nächsten Abfahrten". Now it shows the train still hours away: its time big with "morgen" or "heute", "in 8 Std 31 Min", the train, its destination and its platform as the railway listed it last time (the add-on remembers them, `trains-seen.json`), and "Ob er pünktlich ist, zeigt die Bahn ab etwa 03:05"; from then on it shows the delay as before. `api/train?mine=06:05` answers with `seen`; new in `trains.py` (`mine_of`, `remember`) and `trains.js` (`aheadOf`, `liveFrom`), with their unit tests; the browser test part `53_train` checks a train 5 hours away.

## [4.31.0] - 2026-10-26
### Added
- **🚆 The card "Zug": is my train on time?** (#550, the owner: "dass man sich so seine Verbindung reinmacht, um zu schauen, ob morgens der Zug richtig kommt oder nicht … nicht als eigenes Dashboard, sondern als Karte dazu"). A new kind of card for every page (✎ → "＋ Karte" → 🚆 Zug): the station, the direction ("über") and **mein Zug** (its planned departure). On top it shows your train big: on time in green, "+5 Min" in yellow, from 6 minutes late in red, "fällt aus", the platform (a changed one in yellow, "statt 3"), "in 11 Min" and the railway's note; below the next 3 to 8 departures. The demo has one on ☀ Heute.
- The add-on asks the free service the Home Assistant integration "DB Infoscreen" uses (dbf.finalrewind.org, data of Deutsche Bahn, no key, nothing to install), at most once a minute per station for every screen together (`api/train`, `trains.py`); who has "DB Infoscreen" can pick its sensor instead. Home Assistant's old integration "Deutsche Bahn" stopped working in December 2024.
### Changed
- New modules `trains.py` (pure, `tests/test_trains.py`), `trains.js` (pure, `tests/trains.test.mjs`), `traincard.js`; the card kind `train` in `cards.js` and `boards.py` (the same rules on both sides); the browser test part `53_train` with a stand-in of the departures service (`DBF_URL`).

## [4.30.0] - 2026-10-26
### Added
- **🎨 Scenes for lights and LED strips as real scenes of Home Assistant** (#549, the owner: "dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant … nicht, dass es dann irgendwie Sachen gegenseitig kaputt macht"). ▶ Abläufe has the card **🎨 Szenen**: every scene of Home Assistant with ▶; "＋ Neue Szene" opens the scene editor: the devices of the scene (lights and LED strips first, switches, fans, roller shutters), each on or off, its brightness, a colour (swatches or a colour picker), a white tone (warm, neutral, cold), an effect of the light's own list (WLED, Nanoleaf …), a roller shutter's position. **📸 Wie jetzt übernehmen** takes every device as it is now, **▶ Ausprobieren** shows the scene at once without saving it (`scene.apply`), **✓ Speichern** writes it through Home Assistant's own scene editor (`fp3d_s…`), so it is a real scene there, for automations, voice and Home Assistant's own dashboards. A real Home Assistant played such a scene exactly as built (`tools/ha_check.py`).
- **So that nothing breaks**: only the dashboard's own scenes (`fp3d_…`) are changed or deleted, the old version is kept first (`ha-backup/`); a scene made in Home Assistant gets "📋 Als Kopie bearbeiten": a copy is saved, the scene stays as it is.
### Changed
- New modules `scenes.py` (pure, `tests/test_scenes.py`), `scenes.js` (pure, `tests/scenes.test.mjs`), `sceneedit.js`, `scenesui.js`; the addresses `api/scenes/<id>` (read, save, delete: editors) and `api/scenes/try` (not for a user who may not switch); the browser test part `52_scenes`.
- `tests/test_names.py`: a function defined twice in one file of the add-on fails the tests (in 4.29.0 a new helper had replaced the garden's, found by the browser test before it was released).

## [4.29.0] - 2026-10-26
### Added
- **Own routines become real automations of Home Assistant** (#548, the owner: "der Editor soll in unserer App sein … aber es soll dann auch eine echte Home Assistant Automatisierung … daraus werden … nicht, dass wir dann irgendwas kaputt machen"). The editor of ▶ Abläufe stays as it is (blocks like Node-RED); at the top it now says where the routine runs: **🏠 Home Assistant** (new routines) or **⚙️ Add-on**. Saving writes every lane as an automation through Home Assistant's own editor (`fp3d_<routine>_<lane>`, "Erstellt mit 3D Floorplan"); Home Assistant runs it, also without the add-on, and the add-on does not run it a second time. Every block has its counterpart there (a window opens, motion, a time, the sun, somebody comes, a value; between two times, weekdays, somebody at home, colder outside, dark; "bleibt so", wait; switch and dim, heating, roller shutters, a scene or script, a message, "im selben Raum", "wie vorher" through `scene.create`). A real Home Assistant checked and ran them (`tools/ha_check.py`).
- **So that nothing breaks**: the add-on only ever writes or deletes automations whose id starts with `fp3d_`; Home Assistant's other automations are only shown and switched. When one of its automations was changed in Home Assistant, saving asks "Überschreiben?" first, and the old version is kept in the add-on's data folder (`ha-backup/`, the last 20). What cannot be done in Home Assistant ("draußen kälter" without a weather entity, "jemand kommt" without persons) is said, and nothing is written then. A routine switched off or deleted switches off or deletes its automation.
- **▶ Abläufe**: a routine says "🏠 Home Assistant" or "⚙️ Add-on"; one in Home Assistant gets ↗ (opens it there), its "läuft" and "zuletzt" come from its automation, its ▶ starts the automation. Its automations are not listed a second time among Home Assistant's; "🔎 Wird benutzt" shows it once, as the routine.
### Changed
- A message of a routine in Home Assistant goes through Home Assistant's notify services of the settings; with WhatsApp or Telegram (CallMeBot) the automation asks the add-on (event `fp3d_notify`), which sends it.
- The page keeps an automation's last run, its runs now and its id from the states (they were missing, so "läuft gerade" of an automation only showed after a reload of its list).
- New module `haflows.py` (pure, `tests/test_haflows.py`); the browser test part `51_ha_routines` checks saving, asking before overwriting, ▶, switching off and deleting with a stand-in Home Assistant.

## [4.28.0] - 2026-10-26
### Added
- **📋 Heating rules in the dashboard** (#546, the owner's wish: "eine Heizungssteuerung … wenn Fenster offen, dann wird Heizung deaktiviert … so ähnlich wie Node-RED, bloß halt in unserem Dashboard"; pictures `docs/ideen-4.28/`). On 🌡 Klima beside "Räume" the view **📋 Heiz-Regeln**: seven ready-made rules to switch on, their numbers changed with − / +: **Fenster offen → Heizung aus** (after some minutes, room by room, doors to the outside too, back as before when it shuts), **Keiner zu Hause → kühler**, **Nachtabsenkung** (some rooms differently), **Heizplan**, **Sommerpause** (warm outside for some hours: off), the **Boost-Knopf** and **Urlaub** (until the day back, or while the holiday alarm is armed). The add-on runs them itself, also with no screen open (`heatrules.py`, run by `rulesrun.py` over one websocket to Home Assistant): a rule sets a thermostat when something changes, a turn by hand stays until the next change, what was before comes back when a window shuts or everybody is home again; an air conditioner only gets the window rule. Which thermostats and windows belong to which room comes from the plans, as on the page (`roommap.py`).
- **📅 Heizplan**: a week plan per room with three levels (💤 Nacht, 🌙 Eco, ☀️ Komfort) and their temperatures. A tap chooses a block, a second tap gives it the next level, its left edge can be dragged; "✂ Teilen", "🗑 Weg", its start time, "Di–Fr wie Montag", "Sonntag wie Samstag", "Für alle Räume übernehmen", "Vorheizen" (a warmer block starts earlier), what the room does now and next.
- **The rooms say what the rules do**: on 🌡 Klima a line per room ("⏸️ Heizung pausiert · Fenster offen seit 3 Min · danach wieder 22°" with **🔥 Trotzdem heizen**, "Boost bis 17:30", "Heizplan: Komfort 21°" …), **🚀 Boost** on each room with a thermostat, and "⏸️ pausiert" on the room's label and tile in the house.
- **🔎 Wird benutzt** for every device (on the thermostat of 🌡 Klima, the device's card in the house, the window of a button card): the add-on's own heating rules and routines that use it, and the automations, scripts and scenes of Home Assistant (its search "related") with on / off, "läuft gerade", when they last ran and what they do in words ("06:00 → Heizung Wohnzimmer 22°"); a warning when an automation sets the same thermostat as an own heating rule, with "Die in Home Assistant ausschalten"; whether the thermostat sees an open window itself (`usedby.py`, `usedbyui.js`).
- **⚙ Own routines "Wenn … dann …"**, built like a Node-RED flow: an editor with the blocks to tap on the left (Wenn: a window or door opens, motion, a time, sunrise or sunset, somebody comes or goes, a value over or under, a button on the page; Nur wenn: between two times, weekdays, somebody at home, colder outside than, dark or light, a device is …; Warten: "bleibt so" and a while; Dann: heating, switch and dim, roller shutters, a scene or script, a message, "wie vorher"), the lanes in the middle with lines between the blocks and ticks of what ran last and when, the chosen block on the right (its devices, "im selben Raum wie der Auslöser"), the routine in words below; "▶ Jetzt ausprobieren", "📋 Aus Vorlage" (six ready-made routines). The add-on runs them (`flows.py`).
- **▶ Abläufe** lists the own routines as chains (on / off, "läuft", when they last ran, ▶ for one with a button, ✏), the automations of Home Assistant with the devices they use, what they do and "läuft gerade" (editors), and **📜 Was ist passiert**: what the rules and routines did.
- New API: `api/rules` (read; save only editors), `api/rules/room` (boost, "Trotzdem heizen"; not for a user who may not switch), `api/rules/run` (a routine's button; "Jetzt ausprobieren" only editors), `api/related`, `api/automations` (editors). The rules and routines go into the backup.
### Changed
- Automations and scripts tell the page when they last ran and whether they run now (live channel); the old list "⚙ Automationen" of ▶ Abläufe became the new card. New modules `rules.js` (pure, `tests/rules.test.mjs`), `rulesstore.js`, `rulesui.js`, `heatrulesui.js`, `heatplanui.js`, `routinesown.js`, `flowedit.js`; the browser test part `50_rules` checks it all with the add-on.
- The demo starts with the window rule on: the living room's window is open, so its heating is paused.

## [4.27.0] - 2026-10-26
### Added
- **🗄 Cabinet builder: "Schrank nach Maß" with its own editor** (#545, the owner's wish of 2026-10-26: "einen Schrank-Editor, dass man einen individuellen Schrank bauen kann … auch mit Schrägen, dass man den in Dachschrägen einbauen kann … mit allem personalisierbar … im Nachhinein bearbeiten"). A new piece in the library (group "Schlafen", found with "Schrank", "Dachschräge", "Kommode" …): placed in the plan, its **editor** opens at once, and later again with "✎ Schrank bearbeiten" or a tap on its picture in its panel. The editor shows the cabinet from the front (tap a column to set it up), a cut through the chosen column from the side and, with "🧊 3D", a 3D view to turn; "🚪 Türen" shows the doors or the inside; ↶ takes a step back, "Übernehmen" puts it on the piece (one undo step in the plan), "Abbrechen" changes nothing.
- **Everything can be chosen**: width, height, depth and plinth (in cm, or inches); up to 12 columns side by side, each with its own width (or "⇔ Alle Fächer gleich breit"); inside a clothes rail under a hat shelf, two rails, shelves (how many), only drawers (how many) or nothing, drawers at the bottom under the door; a door, glass door, mirror door or open, the side of the hinges; columns moved, doubled, removed, added. Hinged or sliding doors, 4 kinds of handles (bar, knob, long, none) in stainless steel, black or brass, 10 colours (white, cashmere, light grey, sage, dove blue, anthracite, black, light oak, oak, walnut) or any own colour for the body and for the fronts, an LED light inside that lights with the entity. 8 templates to start from: wardrobe with 2 or 3 doors, sliding door wardrobe, cabinet under a sloped ceiling, knee wall cabinet, open shelving, chest of drawers, hall wardrobe.
- **Under a sloped ceiling**: up to two slopes (the low side left, right, back or front, the height there and the pitch); the cabinet is cut along them, its doors and drawer fronts too, shelves and rails end under the sloped board. **"📐 An die Dachschräge anpassen"** (in the editor and in the panel) reads the roof over the cabinet's place (on the roof floor, or under a roof on a knee wall) and sets the slopes and the height by itself, also for a turned cabinet or one under the ridge.
- In the 2D plan the cabinet shows its columns and, in orange, where it is lower under a slope; its two size handles change its width (all columns together) and its depth. The demo has one under the roof ("Schrank unter der Schräge" on the floor "Dach", with its light on).
- Import and export of a property description carry the cabinet (`"type": "closet"` with `cab`; `property.schema.json`, `docs/IMPORT.md`, the show house).
### Changed
- New modules instead of more app.js: `closet.js` (the maths: columns, slopes, the parts cut along the slopes, fitting under the roof; `tests/closet.test.mjs`), `closetview.js` (the drawings), `closet3d.js` (the 3D model, one mesh per material) and `closetui.js` (panel and editor).

## [4.26.1] - 2026-10-26
### Fixed
- **The 2D view no longer draws the hidden 3D picture** (#542): with only the plan on the screen, the 3D view behind it was still drawn on every frame. Now it is drawn only when it can be seen: the 2D view is lighter for tablets and PCs (part of #138), and the plan answers at once where a slow 3D frame held its redraw back (the browser test part `48_plot` failed now and then because of it; its check now also waits for the redraw). Back in the 3D or split view the picture is drawn at once.

## [4.26.0] - 2026-10-26
### Added
- **🏡 The plot and the areas on it** (#538, the owner's wish of 2026-10-26: "draußen Hof und sowas editieren, das Grundstück bemessen, Deko ums Haus, freier und nicht so krampfig"). The tool "Grundstück" now draws the plot or an **area** (Außenfläche) of a surface: a yard of cobblestones, a drive of paving, a wooden deck, stone slabs, flagstones, gravel, a flower bed, concrete, asphalt, sand, lawn or a pond, each lying on the ground in 3D with the pattern of its surface (the textures of the floors) and in its colour in the 2D plan with its name and size. Corner by corner or as a **rectangle of two clicks** (its size shown while moving).
- **Measuring the plot**: its size in m², its perimeter, the length of every side in the plan (with the tool or the plot selected), width and depth of a rectangular plot typed in, **"▭ Rechteck ums Haus"** with a margin in one tap; the length of each side of the plot or an area typed in (the next corner moves along, a rectangle stays a rectangle); the list of the areas in the palette with their sizes and how much of each surface there is.
- **Editing like a room**: the plot (by its edge) and the areas (by their inside) are picked with the select tool, moved, their corners dragged, a corner added with a double click on a side and removed with a double click on it, moved with the arrow keys, deleted with Entf (Ctrl+Z brings them back) or the eraser; the side panel of an area has its name, surface, size and sides. The whole plot comes into view when the tool is chosen.
- **26 things for the garden** in the library group "Außen" (`yarddeco.js`): hedge, garden bench, garden table with 4 chairs, sun lounger, parasol, kettle grill, gas grill, fire bowl (its embers glow with its entity), raised bed, planter, flowers, bollard light and garden lantern (glow with their entity), trampoline, sandpit, double swing, pergola, greenhouse, garden shed, mailbox, bird bath, rotary dryer, stepping stones, composter, lounge corner and a garden gnome; cut open with the earth like the trees.
- Import and export of a property description carry the areas (`plot.areas`: name, surface, points; `property.schema.json`).
### Changed
- The areas of rooms in the plan and the room panel have the decimal comma too ("12,5 m²", #527).
- The plot moved from `blocks.js` to the new `plotui.js`; pure logic in `yard.js` (`tests/yard.test.mjs`), the 3D areas in `yard3d.js`.

## [4.25.0] - 2026-10-26
### Added
- **🚗 Auto and 🌱 Garten on 🧺 Haushalt** (#533, chosen by the owner, picture `docs/ideen-4.3/8-haushalt.jpg`). The car: its charge with a bar, "lädt mit 3,2 kW · voll um 17:30", the range, "☀ Nur mit Sonne laden" (evcc's mode pv / now, or a switch). The garden: the rain of today or tomorrow, when it last watered, the soil moisture, "💧 10 min gießen" per watering zone (the add-on closes it again when the time is up, also after a restart) and "■ Stopp". Both found by their names or chosen in ⚙ → Reiter unten. Valves can now be switched from the plan too (`valve.open_valve` / `close_valve`).

## [4.24.0] - 2026-10-26
### Added
- **🗣 Switching by voice** (#532, chosen by the owner): an order in the voice search (or typed into the search box) switches: "Licht im Wohnzimmer aus", "Mach oben alle Lichter an", "Rollläden in der Küche runter", "Fernseher aus", in all 7 languages. Lights and players on and off, roller shutters up and down (never a garage door), only what is not so already, with a ring on each. The whole house asks first ("✓ Ja, aus"); a question stays a question; the lock "Steuern" is respected.

## [4.23.0] - 2026-10-26
### Added
- **🔔 Sag mir Bescheid** (#531, chosen by the owner, picture `docs/ideen-4.3/8-haushalt.jpg`): a running washing machine, dryer or dishwasher on 🧺 Haushalt has the button "🔔 Sag mir Bescheid"; when it is done the add-on sends one message through the way of ⚙ → Warnungen & Alarm (WhatsApp, Telegram, the phone app), also with no screen open (it checks every minute). "Immer Bescheid sagen" in ⚙ → Reiter unten tells about every run. Never twice for one run; a wish is forgotten after a day.

## [4.22.0] - 2026-10-26
### Added
- **🔔 The doorbell on every screen** (#530, chosen by the owner, picture `docs/ideen-4.3/6-klingel.jpg`). When somebody rings, every screen in the live view shows the camera at the door with "🔓 Tür öffnen" and "✕ Schließen", wakes up and plays a gong; it closes by itself after two minutes. Bells are found by themselves (an event of the class `doorbell`, a binary sensor named like a bell), each with its camera; ⚙ → 📱 Wandtablet → 🔔 Klingel chooses up to four with camera, door opener and name, and "🔔 Ausprobieren" shows it on this screen. Opening the door asks once more. A user or tablet can be locked out of it (🔒 Klingel-Fenster). The demo rings with `?klingel=1`.

## [4.21.3] - 2026-10-25
### Changed
- **Smoother on tablets: the furniture is drawn together in the live mode** (#138, chosen by the owner: "Tablet schneller"). In the live mode nothing changes furniture that is linked to nothing (no entity, no LED, no section), so the parts of all of it on one floor that look the same are now drawn as one, the grey of the sofa with the grey of the shelf. The show house draws its whole-house view with about 1,180 draw calls instead of 1,660, with the same picture (the same triangles). Back in the editor every piece is whole again and can be moved.
### Fixed
- **Numbers with the decimal comma** (#527): in German the power overview, the energy picture and the watts on the cables ("☀ 3,20 kW"), the meters ("🚰 1234,6 m³") and the value badges over the devices ("🌡 21,4 °C") now have a comma, like the pages of the tab bar; in English they keep the point.
- **The demo at night** (#528): no times that have not come yet ("seit 11:02" at 2 o'clock in the night is yesterday now), the sun makes no power at night (the solar power follows the sun of the demo's sky, the battery gives what the house needs), and the line "🔋 Ladestand" no longer jumps at 2 o'clock on the day the clocks go back.

## [4.21.2] - 2026-10-25
### Fixed
Found while Claude tested the open points of the test protocol overnight (the demo in Chromium as PC, tablet and phone, some in the add-on with a made-up Home Assistant):
- **⚡ Energie: the values of a bar by finger** (#519): the values of a bar (one house and ⚖ Vergleichen) were only an SVG tooltip, which a mouse shows after a moment and a finger never. Now a tap or the mouse anywhere on a column shows a small box with the day (or month) and the kWh, for every house when comparing; a tap elsewhere puts it away (`bartip.js`).
- **🌡 Klima: "zu warm" / "zu kalt" with a thermostat circle** (#520): since the circle (4.9.0) a room that is too warm or too cold showed it nowhere (the coloured big number is gone), yet it was listed under "Nur mit Hinweis". Now a chip "🌡 zu warm" (orange) or "🌡 zu kalt" (blue) says it.
- **Device list: "▶ läuft" instead of "▶ playing"** (#521): a player without an app showed Home Assistant's raw state; now the words of #492 ("läuft", "⏸ Pause", "bereit").
- **Search: the ring at a lamp under its room label** (#522): a ceiling lamp sits right under the label of its room, which hid the ring of an answer ("Ist oben noch Licht an?"). While rings show, the room labels fade.
- **⚙ → 🎤 Sprachsuche** (#523): "🩺 Mikrofon-Test öffnen" (and the jump to a group of the settings) put the target under the dialog's fixed head; now it stands below it. Links in the dialogs are in the accent colour instead of the browser's dark blue.
- **Live card: the number beside the volume slider follows it** (#524).
- **Demo: the electricity counters of ⚡ Rechnung with name and reading** (#525).

## [4.21.1] - 2026-10-25
### Fixed
- **iPhone in the Home Assistant app: no empty strip under the tab bar any more** (#517, the owner: "ganz unten da ein bisschen Abstand … dieses ganze Zeug ein bisschen weiter nach unten verschieben"). Home Assistant keeps the strip of the iPhone's home bar clear below the add-on, but iOS gives the add-on the same strip again although its frame does not reach the bottom edge, so the tab bar (🏠 Haus, ☀ Heute, ⚡ Energie …) kept it clear a second time. The add-on now measures what Home Assistant already keeps clear and leaves it out; the view buttons, the time and weather line and the room tiles above the 3D picture no longer keep the strip clear while the tab bar lies below them. Everything moves down by about 30 pt, the 3D picture gets taller. Opened on its own in Safari (or the demo) the bar keeps the strip clear as before.

## [4.21.0] - 2026-10-24
### Added
- **🔋 Ladestand on ⚡ Energie** (#515, the owner: "dass man den Batterieladezustand nachvollziehen kann in einer Art Diagramm … alles zusammen sehen oder nur einzeln … auch für unterschiedliche Häuser"). A new card shows the charge of every battery through the day, week, month or year chosen at the top of the page: the charge sensor of ⚡ Rechnung, every battery of the plan whose sensor is in %, and the charge sensor of Home Assistant's energy dashboard. **"Zusammen"** draws one chart with a line per battery, **"Einzeln"** a small chart for each with the band from the lowest to the highest charge and when they were reached. A chip per battery shows its charge now and leaves it out or shows it again with a tap; a finger or the mouse on the chart shows the time and the charge of each battery there. The choice stays on this device (the wall tablet keeps its own, the phone its own). One house chosen: its batteries; **"Alle Häuser"** and **"⚖ Vergleichen"**: the batteries of all houses, each in the colour of its house, the name of the house in front. A house with only a battery and no meters now gets the page ⚡ Energie too.
- The numbers come from Home Assistant's long-term statistics (a day in 5 minutes, a week and a month by hours, a year by days; new endpoint `api/energy/levels`); a charge sensor without statistics (no `state_class`) is read from its history for up to a week.
- The demo has a battery in the neighbour house too.

## [4.20.0] - 2026-10-23
### Added
- **The 🎤 without https, plug and play** (#513, the owner: "das muss ja einfach Plug and Play funktionieren … man kann ja nicht erwarten, dass jemand, der das installiert, noch eine HTTPS-Verbindung drauf macht"). Browsers give a page the microphone only over https, and no page can get around that (Home Assistant's own Assist dialog and other floor plans have the same limit). The keyboard's own 🎤 (Gboard, Samsung, iPhone / iPad; on a PC Windows + H, on a Mac the dictation) belongs to the device and types into any field, also over http://. So where the page may not listen itself (http://, an app with a built-in browser such as Fully Kiosk or the Home Assistant app without Assist) or its listening fails, the 🎤 opens the search box with the keyboard and says how to dictate on this device; what is dictated is asked by itself after a short pause (no Enter), and on a tablet the keyboard goes away so the whole answer is seen.
- ⚙ → 🎤 Sprachsuche: a new choice **"Nur das Diktat der Tastatur (geht auch ohne https)"**, "Automatisch" now means browser, else Home Assistant Assist, else the keyboard; a line says when the keyboard is used. The 🩺 microphone test says "🎤 mit dem Diktat der Tastatur", why the page may not listen itself and, as an option, what would let it (https).
### Fixed
- The tooltip of the 🎤 ("Sprachsuche über Home Assistant Assist" and so on) was put back to the plain one whenever the texts of the page were set again.

## [4.19.1] - 2026-10-23
### Fixed
- **The 🎤 heard nothing** (#511, the owner: "wenn ich aufs Mikrofon drauf drücke, dann hört er nichts … weder auf dem Tablet noch auf dem PC … und alles ist freigegeben"). Apps with a built-in browser (Android WebView: Fully Kiosk, the Home Assistant app) have Chrome's speech recognition built in, but there it does nothing: no start, no error, and the 🎤 said "Ich höre zu …" for ever. Such apps are now recognised (user agent), the browser's recognition counts as not working there and the 🎤 takes **Home Assistant Assist**. A watchdog covers the rest: a recognition that has not started after 5 s (30 s while the browser asks for the microphone) counts as not working on this device (kept in the browser), and with "Automatisch" Assist listens at once instead (Home Assistant is asked then whether it can).
- Over **http://** browsers allow no microphone; the 🎤 then said "Das Mikrofon ist gesperrt: erlaube es im Browser", although there was nothing to allow. Now it says that the page needs https and what to do.
- The 🎤 stays where it cannot listen (pale) and a tap says **why** (http, an app without Assist, a browser without recognition, Assist not set up) with a row "🩺 Mikrofon-Test öffnen". Before, it was missing or listened for ever.
- Recording for Assist no longer waits for ever when no sound comes ("Vom Mikrofon kommt kein Ton").
### Added
- **🩺 Mikrofon-Test** in ⚙ → 🎤 Sprachsuche: what this device is and may (https or http, the browser or the app, the microphone's permission, the browser's recognition, Assist, which one the 🎤 uses), **1. Mikrofon prüfen** (a level bar for 6 s, "Das Mikrofon … hört dich" or "kommt kein Ton an", a choice of microphones, kept per device and used for Assist), **2. Erkennung prüfen** (what was understood, or why not; it also tries the browser's recognition once more and remembers when it works), under every error what to do (Windows, Mac, Android, iPhone, Fully Kiosk, the Home Assistant app, https, a Chrome flag for http), **📋 Ergebnis kopieren** (everything as text to send on). Pure logic in `voicediag.js` (unit test), the screen in `voicecheck.js`.

## [4.19.0] - 2026-10-23
### Added
- **Voice search** (#509, the owner: "so eine Sprachsuche … drauf drückt und dann sagen kann, welche Fenster sind offen? Und dann wird dir die Ansicht gezeigt …"). A 🎤 next to the 🔍 at the bottom left (on phones inside the search box): say "Welche Fenster sind offen?", "Ist oben noch Licht an?", "Wie warm ist es im Kinderzimmer?" or "Wie sieht es im Wohnzimmer aus?" and the view goes there: the floor or the whole house, the room, a ring on every thing of the answer, the answer as a line ("🪟 Fenster · offen: 2") and a list to tap. "Sind alle Fenster zu?" lists the ones still open or says "✓ Fenster: alle zu"; "Wie warm ist es?" colours the rooms by temperature. A question typed into the search box is answered the same way (a row "💬 …", Enter). No AI: known words in all 7 languages, the names of rooms, floors and houses of the plans, the rest of the sentence may be free (`voicequery.js`, tested). It only shows, it switches nothing.
- **Code words** in ⚙ → 🎤 Sprachsuche: "Wenn ich sage … → meine ich …", one or more rooms, a floor or a house, also of another house ("Wohnzimmer der Eltern"), for everybody or one user ("mein Zimmer").
- **Which recognition**: the browser's own (Chrome, Edge, Safari; the recording goes to Google or Apple) or, where there is none (the Home Assistant app on Android, Fully Kiosk, Firefox), **Home Assistant Assist** (Whisper or Home Assistant Cloud): the add-on records 16 kHz audio and lets Assist turn it into text (`api/voice`, `api/voice/stt`, `voice.py`, tested). The settings say what works on this device and how to set up Assist. Also in the Docker version (#489).
- New lock **"Sprachsuche (🎤)"** per user; the server refuses `api/voice/stt` too.

## [4.18.0] - 2026-10-23
### Added
- **A page in its own version per user** (#507, the owner: "bei unterschiedlichen Benutzern unterschiedliche Sachen anzeigen"; pictures `docs/ideen-4.18/`). Every page of the tab bar (Heute, Energie, Klima, Kameras, Musik & TV, Haushalt, Abläufe, Familie and the own pages) can have up to six own **versions** besides the normal one ("👪 Für alle"), e.g. "🧒 Kinder" with only the children's room on 🌡 Klima, or "📟 Tablet Flur". Each version has its own cards (order, hidden cards, own cards, sections, sizes, widths); each user gets one version per page, who has none sees "Für alle".
- In ✎ *Bearbeiten* a purple strip **🗂 Fassung** under the edit strip: a chip per version (a tap edits that one), **＋ Neue Fassung** (name, symbol, start with a copy of a version or empty, who gets it), who sees the version chosen, **⚙ Einstellen** (name, symbol, users, 🗑 delete: its users see "Für alle" again).
- **👁 Ansehen als …**: the screen as a user sees it, his versions and his tabs, until "✕ Zurück" in the bar at the top.
- **👥 Wer sieht was**: one table of users × pages, in each cell "Für alle", a version or "aus" (the tab is not in that user's bar); also in ⚙ → 👥 Benutzer. A lock that takes a tab away shows 🔒. In the user rows of ⚙ → 👥 Benutzer a choice of the version beside every tab that has versions.
- A version is no lock: what a user may not do the locks of ⚙ → 👥 Benutzer say, as before.
- Stored in the settings (`pageVariants`) and per user in `userTabs.<user>.variants` (kept in `users.json` too); `api/me` hands a user his versions; deleting an own page takes its versions along. Also in the Docker version (#489).

## [4.17.0] - 2026-10-23
### Added
- **Home Assistant Container (Docker, without the Supervisor)** (#489, asked for by a user: "I run Home Assistant as a Docker container … Please support Home Assistant Container"). 3D Floorplan now also runs as its own container next to Home Assistant: `container/Dockerfile`, `container/docker-compose.yml` and the steps in `container/README.md`. It talks to Home Assistant with a long-lived access token (`HA_TOKEN`) at `HA_URL`. Without Ingress, whoever opens the page logs in with their Home Assistant user on Home Assistant's own login page; the add-on keeps a signed cookie of its own (30 days, renewed while in use), Home Assistant's token of the login is given back at once. Headers that Ingress would send count for nothing then, and a user switched off or removed in Home Assistant is out at once. Administrators and the users in `EDITORS` may edit, as in the add-on. The top bar has **Abmelden** (log out). In the add-on nothing changes. The dashboard card still needs the Supervisor; a *Webpage* dashboard shows the page instead. CI builds the image and checks its login.

## [4.16.0] - 2026-10-22
### Changed
- **Power sensors (W) count as meters too, no matter whether W or kWh** (#503, the owner: "kannst du es nicht einfach so machen, dass es egal ist ob W oder kWh, weil oben geht es ja auch"). Home Assistant keeps a time-weighted mean of every power sensor with a `state_class` per hour, day and month; the page ⚡ Energie now counts mean × hours as kWh, also for the days before. The lists of "Zähler für den Verlauf" offer W sensors for the grid, the sun and the battery. **⤵ Von oben übernehmen** takes a counter in kWh of the device when there is one, else the power sensor itself; a kind that already has a meter gets nothing added (else the same energy would count twice, e.g. a grid meter in kWh and the inverter's grid power). **＋ Zähler anlegen** is only offered for a sensor Home Assistant keeps no statistics of. A sensor measuring both ways (+/−) is not taken (drawn and fed in of the same hour would cancel out).

## [4.15.0] - 2026-10-22
### Added
- **⤵ Von oben übernehmen: the meters of the page ⚡ Energie from the power sensors** (#501, the owner: "einen Knopf …, dass es von oben, was ich eingestellt habe, nach unten auch übernommen wird"). "Zähler für den Verlauf" needs counters in kWh (they only go up), the power editor above has sensors in W, so the list rightly did not offer them. The new button looks, for every sensor set above (grid, solar, battery charging / discharging), for its counter: an "Integral" helper of Home Assistant made from it, or a counter in kWh of the same device whose name fits (a total, not the one of the day), and takes it. Where there is none, **＋ Zähler anlegen** makes Home Assistant's "Integral" helper (W → kWh) through its config flow and takes it; it counts from then on. Per kind a line says what happened. A sensor measuring both ways (+/−) only gets a counter its device has. Server: `counters.py` (tested), `api/energy/counters`, `api/energy/counter` (editors only).
### Fixed
- **The backup now also keeps the pinboard and the alarm settings** (#500, the owner: "sichert das Backup auch alles … auch das, was wir nun neu gemacht haben?"). "Backup herunterladen" and the automatic backups held the houses, the settings (pages, sections, own cards, presence …), pictures and 3D models, but not the notes of the pinboard, the holiday alarm's settings and the alarm messages' settings. They are in it now (`extras`) and come back when it is put back; the alarm's code and the CallMeBot keys stay out of the file and keep their current value. Older backups restore as before.

## [4.14.0] - 2026-10-22
### Added
- **Buttons the way you want them** (#495, the owner: "mehr Möglichkeiten, Buttons anzupassen"; picture `docs/ideen-4.9/7-knoepfe.jpg`). The own card *🔘 Knopf* gets in *Karte einstellen*: a **symbol** (20 to pick, or automatic), the **colour when on** (seven, or the lamp's own colour), the **shape** (▢ Kachel, ◯ Rund, ▭ Pille, Nur Symbol) and **size** (S, M, L, XL), what it **shows** (name, state, the brightness as a bar, since when: "seit 2 Std."), what a **tap** does (on / off, the window with the controls, open a page, nothing) and a **long press** (nothing, the window with the controls, Home Assistant's own window with the history). A button can now also be a thermostat, a water heater, a lock or a vacuum (a tap opens its window).
- **The window with the controls** of a device (`ctlwindow.js`): on / off, a lamp's brightness, colours and effects, a thermostat's circle, a roller shutter's ▲ ■ ▼ and position, a lock's 🔒 / 🔓, a player's, fan's, vacuum's or alarm's buttons, a scene or script to start, *Details* inside Home Assistant.
- The live states carry when a state last changed (`lc`, seconds) for "since when".
- Demo: an own page *🔘 Knöpfe* with buttons in every look.
### Fixed
- The device list of *Karte einstellen* no longer squeezes its rows when the window is long.
- CI: the browser test first tries Chromium without extra Ubuntu packages (the runner image has their libraries); a hung `apt-get update` is stopped before the next attempt instead of blocking it.

## [4.13.0] - 2026-10-22
### Added
- **The calendar card: several calendars, each in its colour, and "＋ Termin"** (#495, the owner: "verschiedene Kalender … zusätzlich eine Karte einfach mit Terminkalendern"; pictures `docs/ideen-4.9/5-kalender.jpg`, `6-kalender-einstellen.jpg`). A new kind of own card *📅 Kalender* (✎ → *＋ Karte*): tick any of Home Assistant's calendars and give each a colour (blue, orange, green, red, purple, grey); the time span (today + tomorrow, 7, 14 or 31 days) and the view: **▦ Woche** (a column per day, the events as coloured blocks), **☰ Liste** (by day), **🗓 Monat** (the month with a dot per event, a tap on a day lists it) or **Nur nächster Termin** (big, the two after it below). A chip per calendar shows which colour is which. **＋ Termin** on the card puts a new event straight into one of its calendars (title, calendar, day, all day or from / to; Home Assistant's `calendar.create_event`, for calendars that take new events such as Local Calendar, Google or CalDAV); the card shows it right away. Several calendar cards are possible, e.g. one with only Anna's calendars. The events come from `api/calendar/events` (up to 10 calendars and 42 days, kept 5 minutes, fresh after a new event); the rules in `calcard.js` (tested), the same in `boards.py`; `controls.py` lets only a title, the dates or times (with the time zone) and the end after the start through.
- Demo: ☀ Heute has a calendar card "Diese Woche" with the calendars Familie, Arbeit Anna, Schule and Geburtstage.

## [4.12.0] - 2026-10-22
### Added
- **Who is really at home** (#495, the owner: "ob jetzt wirklich eine Person im Haus ist … mit dem Handy, dass es sich mit dem WLAN verbindet"; picture `docs/ideen-4.9/4-anwesenheit.jpg`). On 👨‍👩‍👧 Familie every person's card lists what says where they are, each with its time and green (at home) or grey (away): the phone on the Wi-Fi of the router (a device_tracker of FRITZ!Box, UniFi, Ping …), GPS of the Home Assistant app, the Wi-Fi name the app reports (`sensor.<phone>_wifi_connection` / `_ssid`) and the room (Bermuda / ESPresense: `sensor.<phone>_area` / `_room`). Above the people *n Personen zu Hause* with their names and rooms, beside them *Wer ist wo im Haus* (the rooms with a person's phone or with motion / presence). In ⚙ → *Reiter unten* → *Wer ist zu Hause*: at home when Home Assistant says so (as before), when one source says so or when two do (safer), and the names of the home Wi-Fi (`settings.presence`). The sources come with `api/family` (`pages.person_sources`), the rule is in `family.js` (tested).

## [4.11.0] - 2026-10-22
### Added
- **Sections on the pages, like the "Sections" of a Home Assistant dashboard** (#495, the owner: "dass ich so Kartenabschnitte frei auf dem Dashboard platzieren kann mit so Abschnitten"; picture `docs/ideen-4.9/3-abschnitte.jpg`). In ✎ the new button *＋ Abschnitt* makes a section with a name, a symbol and a width (normal: a column of cards, wide: two); ⠿ drags a card into a section, between sections and back above them; a section has ‹ › to move it, ✏️ to rename it and 🗑 to take it away (its cards stand above again). **The corner ↘** of every card in ✎ makes it wider or narrower (built-in cards: `widths`, own cards: their width). Works on every page, built-in or own, saved for everybody (`pageLayouts.<page>.sections`, `.widths`; the rules in `sections.js`, tested, the same in `boards.py`). *Wie am Anfang* removes the sections and widths too.

## [4.10.0] - 2026-10-22
### Added
- **⚖ Vergleichen: the power of several houses in one chart** (#495, the owner: "wenn man mehrere Häuser hat mit unterschiedlichen Stromsensoren, dass es dann auch in einer Grafik irgendwie zu sehen ist"; picture `docs/ideen-4.9/2-strom-haeuser.jpg`). On ⚡ Energie with more than one house a chip *⚖ Vergleichen* beside *Alle zusammen*: every house with its own meters (⚡ Rechnung; the first house without its own takes those of Home Assistant's energy dashboard, a later one none, so nothing counts twice), each in its own colour: a tile per house (kWh in the period, the power now) and the sum, today a line per house through the hours, a week / month / year a bar per house and day / month, the power of each house now, the cost of each house. One question to Home Assistant's statistics for all houses (`energycompare.js`, the rules in `energyhistory.js`, tested).
- **History card with several sensors** (#495): the own card *Verlauf* takes up to six sensors (`more`), a line each in its own colour on one scale, with a legend and each value now, e.g. the power sensors of every house.
- Demo: the neighbour house has its own meter, price and power sensor, so *⚖ Vergleichen* shows both houses.
### Fixed
- CI: the browser test no longer fails before it starts when a package server of the GitHub runner answers 403 or hangs (that source is left out, a retry waits until the hanging apt-get lets go of the package lock).

## [4.9.0] - 2026-10-22
### Added
- **The thermostat as a circle like in Home Assistant** (#495, the owner: "wie in Home Assistant selbst mit so einem Kreis, wo man Plus und Minus machen kann … Heizen, Auto und Aus"; picture `docs/ideen-4.9/1-thermostat.jpg`). On 🌡 Klima every room with a thermostat shows a circle: the target in the middle, the temperature now on the ring; drag the knob (or tap the ring) or use − / + (several taps become one call); below the modes the device offers (🔥 Heizen, ❄️ Kühlen, ⟳ Auto, 💧 Entfeuchten, 🌀 Lüfter, ⏻ Aus), its presets (Komfort, Eco, Abwesend …) and fan speeds. **Big or small**: in ✎ the button ⤡ makes a room's circle small (circle, − / + and the modes as symbols beside it), ⤢ big again, for everybody (`pageLayouts.<page>.sizes`). The own card "Thermostat" draws the same circle, with *Größe des Kreises: Groß / Klein* in its settings. A water heater shows its target on the circle without setting it. The room's own temperature stands below when it differs from the thermostat's.

## [4.8.2] - 2026-10-22
### Fixed
- **Tablets slow since everything is in one program** (#494, the owner: "kann sein, dass irgendwie die Performance darunter gelitten hat"). Measured in the demo with sensors that change four times a second: the work per change went down from about 10 to 3 ms on ☀ Heute, from 7 to 1–2 ms on the other pages and from 8 to 6 ms on 🏠 Haus.
  - A state from Home Assistant now draws **one** new frame of the 3D picture instead of keeping it at full speed for 15 seconds: a power sensor that reports every few seconds kept a tablet at 60 frames a second all day. Touching the picture, a door or roller shutter moving and the power flow still run smoothly.
  - While a page of the tab bar lies over the house, the house (room tiles, labels, lamps, floor cards …) is no longer brought up to date with every change; it catches up when it is shown again. The warnings stay live.
  - ☀ Heute draws only the card whose content changed (a new power reading: only *Strom jetzt*), and the grid of a page measures its cards all at once instead of one by one; nothing changed: nothing is measured at all.
  - The devices of a floor are worked out once per change, not again for every room.

## [4.8.1] - 2026-10-22
### Fixed
- **States in English in the device list** (#492, found while checking the demo): a robot vacuum said "docked", a presence sensor "on". The device list, the labels over the devices and the state lines now say "An der Station", "An" / "Aus", "zu Hause" / "unterwegs", a player's "läuft" / "Pause", a camera's "bereit" and an alarm panel's state in the language of the page; other states stay as Home Assistant says them.
- Demo: the camera stills no longer carry the camera's name, which peeked out behind the name on the camera page.

## [4.8.0] - 2026-10-22
### Added
- **🎵 Musik & TV** (#490, package 3 of 3 of the owner's wish "kannst du die anderen reiter auch machen", picture `docs/ideen-4.3/7-musik.jpg`): a card per player with its room, what plays, its picture (through the add-on: `api/media/<player>/picture`), ⏮ ⏯ ⏭, on / off, source and volume; **Alles stopp**; **Räume zusammen** (`media_player.join` / `unjoin`, for players that can); **radio stations** as buttons (⚙ → *🗂 Reiter unten*: a name and a stream or `media-source://` address; a tap asks on which player, `media_player.play_media`).
- **🧺 Haushalt** (#490, `8-haushalt.jpg`): washing machine, dryer and dishwasher found by their names (or chosen in ⚙): their own state, program, end time and progress, or, with only a power plug, *läuft seit* / *fertig seit* from Home Assistant's history (the add-on decides: `household.py`, `api/household`); **✓ Ausgeräumt** for every screen and a number on the tab while one is done; the robot vacuums; the **shopping list** of Home Assistant (`todo.*` through `api/todo`: tick off, add, clear; anybody may); the waste card of ☀ Heute.
- Tabs can carry a number (the household's machines that are done).

## [4.7.0] - 2026-10-21
### Added
- **Full screen kept on for a user, only a code ends it** (#487, the owner's wish: "dass der Benutzer den Vollbildmodus sozusagen dauerhaft anhat und ihn selbst nicht deaktivieren kann … nur mit einem Code"). Users dialog → the user's ⚙ → *🔒 Gesperrt* → **Vollbild verlassen**; below the users the **code for the full screen** (4 to 8 digits, one for every screen, kept hashed by the add-on in `fullscreen.json`, `api/fullscreen`). That screen shows a sheet *Tippen für Vollbild* until it is in full screen; in full screen the button at the right reads 🔒 *Vollbild beenden* and opens a keypad: a wrong code is refused (5 wrong: everybody waits 5 minutes), the right one ends it until ⛶ is tapped again, the page is reloaded or nobody touches the screen for 10 minutes. Leaving another way (Esc, a swipe, the back key) brings the sheet back at once; Chrome also holds Esc. A browser that refuses full screen is never locked out. Works best together with screen pinning (Android), Guided Access (iPad) or a kiosk browser, since no web page can stop the home button. The demo shows it with `?vollbild=1` (code 1234).

### Changed
- In full screen the button at the right of the bar says **Vollbild beenden**.

## [4.6.0] - 2026-10-21
### Added
- **The pages of the tab bar arranged like a Home Assistant dashboard** (#484, the owner's wish: "dass ich als Admin die einzelnen Dashboards bearbeiten kann wie im HA-Dashboard"; his choice after the example pictures in `docs/ideen-4.6/`: all of it, the same for everybody). Editors get **✎ Bearbeiten** in the bar on every page (☀ Heute, ⚡ Energie, 🌡 Klima, 📷 Kameras, ▶ Abläufe, 👨‍👩‍👧 Familie): a strip at the top, every card with **⠿** (drag it to another place) and **👁** (hide it), **↺ Wie am Anfang**, **✓ Fertig**. The cards close up like a masonry wall.
- **Own cards, twelve kinds**: Knopf (scene, script or device with one tap), Schalter, Wert, Verlauf (a line of 6 h, 24 h, 7 or 30 days from Home Assistant's history), Licht (on / off, brightness), Thermostat (− / +), Rollladen (▲ ■ ▼), Kamera, Mehrere Geräte, Raum (like a room tile), Text and Fertige Karte (weather, waste, pinboard … of ☀ Heute). "＋ Karte hinzufügen" → the kind → the device from a list searched while typing (only devices that fit), name, width (normal, wide, very wide, whole row), time span and colour, with a preview; ⚙️ changes an own card, 🗑 deletes it.
- **Own pages**: in the edit mode **🗂 Reiter** turns the bar into an editor: drag the tabs into their order, **＋ Seite** makes a page of your own (name, icon, starting empty, with the devices of an area or the cards of ☀ Heute, its place in the bar), a tap on an own page renames it or deletes it. Own pages can be ticked off per user like the others (⚙ → Benutzer & Tablets).
- The add-on keeps it in the settings (`pageLayouts`, `customTabs`, `tabOrder`, checked in `boards.py`) and asks Home Assistant for the history of a card "Verlauf" (`api/history`, kept 2 minutes).

## [4.5.0] - 2026-10-21
### Added
- **🌡 Klima** (#483, package 2 of 3 of the owner's wish "kannst du die anderen reiter auch machen"): a card per room with its temperature (blue when too cold, orange when too warm), the target of its thermostat with − / + (several taps become one call), whether it heats or cools, the humidity, the air (CO₂: "Luft gut", or "Lüften" from the third stop of the colour scale CO₂, normally 1200 ppm) and an open window or door while it heats, with **Heizung aus**; *Alle Räume* / *Nur mit Hinweis*; below the thermostats and water heaters in no room (a heat pump's hot water) and a tip. A tap on a room's name shows it in the house.
- **▶ Abläufe** (#483): a big button per scene, script and button of Home Assistant (✓ when it started; ⚙ → *🗂 Reiter unten* picks them, none ticked: every scene and script), and the two checks **Ich gehe** and **Gute Nacht**: before they start they show what is still open or on (windows and doors, lights, a TV or speaker playing, an unlocked lock) with **Alles aus** (lights and players off, then the routine linked to the check in ⚙) and **Trotzdem starten** (only that routine). Editors can switch Home Assistant's automations on and off (not edit them).
- **👨‍👩‍👧 Familie** (#483): every person of Home Assistant with the picture (or a coloured letter), where (at home, a zone, away), since when and the battery of the phone (the battery sensor of the phone of the person's tracker, red under 20 %), beside it the **pinboard**: notes for everybody kept by the add-on (`pinboard.json`, at most 30, the oldest goes), with who wrote it and when, four colours, ✕ takes one off (anybody may, like a real pinboard at home), **auch aufs Handy schicken** through the channel of *Benachrichtigung bei Alarm* when that is set up. The newest notes are on ☀ Heute too (a tap leads to the family page).
- A user who may not switch (lock *Steuern*) gets no Klima and no Abläufe page; each page can be ticked off per user like the others.
- The add-on asks Home Assistant for the people with their phones (`api/family`, kept a minute) and their pictures (`api/family/<person>/picture`, only Home Assistant's own uploaded pictures and its `www` folder), keeps the notes (`api/pinboard`), lets `automation.turn_on` / `turn_off` through for editors, and sends water heaters' targets to the page.

## [4.4.0] - 2026-10-21
### Added
- **☀ Heute, the start page of the tab bar** (#481, the owner's wish: "kannst du die anderen reiter auch machen", package 1 of 3): the time and date in big, the weather now and the next five days (Home Assistant's forecast), the events of today and tomorrow from the calendars, the next waste collection from a calendar of its own, who is at home (and where, by zone), **Im Haus** with what needs a look (doors and windows open, lights on, the alarm armed, batteries low, devices offline; a tap leads there in the house) and the power now (a tap opens ⚡ Energie). ⚙ → **🗂 Reiter unten** chooses the calendars (none ticked: all) and the waste calendar; the switch of the bar moved there too.
- **⚡ Energie, the history** (#481): today by hours, a week or a month by days, a year by months, from Home Assistant's long-term statistics: used, from the sun, from the grid, fed in, how much the house made itself (%), what it cost, bars of what came from sun and battery and what from the grid, the devices that used most (the devices of the energy dashboard), gas and water; ‹ › to go back in time, each tile compared with the period before (so far: "gestern um die Zeit"). With several houses a chip per house and **Alle zusammen** (every meter counted once).
- **Meters and prices per house** (#481): Bearbeiten → Strom-Editor → ⚡ Rechnung → **Zähler für den Verlauf**: the meters (kWh, gas and water in m³) and prices of this house; empty: those of Home Assistant's energy dashboard (there is only one, so a second house needs its own here). **⤵ Aus dem Energie-Dashboard übernehmen** copies them in.
- The add-on asks Home Assistant for the energy dashboard's meters (`api/energy/meters`), their statistics (`api/energy/stats`), the weather forecast (`api/forecast`, kept 15 minutes) and the calendars and their events (`api/calendars`, `api/agenda`, kept 5 minutes); a user locked out of the energy gets no energy page and the server refuses its data.

### Changed
- The tab bar scrolls sideways when it has more tabs than fit (phones).

## [4.3.0] - 2026-10-21
### Added
- **Tab bar at the bottom: the add-on as the only dashboard, step 1** (#479, the owner's wish: "nur noch dieses Programm … keine anderen Dashboards mehr"): in live mode a bar at the very bottom with **🏠 Haus** (the 3D picture as always) and **📷 Kameras**, a page with every camera of the plan as a big tile (still image, renewed while the page is open), the ones that see movement first, the motion sensors below; a tap shows the camera big and live, with *Alle Kameras*, *Im Plan zeigen* and Home Assistant's own dialog. While a page is open the 3D picture rests (no drawing, like with the screen off). The camera button at the top opens this page in live mode (the drop-down stays in the editor). No bar while editing, in the dashboard card (unless asked for) or with nothing but the house. More tabs follow step by step (today, energy for several houses, climate, music, household, routines, family: example pictures in `docs/ideen-4.3/`, plan in `docs/PLAN-4.3.md`).
- **Tabs per user** (#479, "es soll ja aber auch noch administrativ verwaltet werden"): ⚙ → *👥 Benutzer & Tablets* → ⚙ of a user: a tick per page (*Reiter unten*) and *Fängt an mit* (the tab the screen starts with and comes back to after the minutes of *Zurück zur Startansicht*). Kept in `users.json` too. A user who may not see the cameras (lock) gets no camera page. ⚙ → *Wandtablet* → *Reiter-Leiste unten* switches the bar off for everybody.
- **⛶ Vollbild** at the right of the bar, where the browser allows it (also inside the dashboard card).
- **Set up a tablet** (⚙ → *Wandtablet* → *📱 Tablet einrichten*): the steps for a start page in full screen without Home Assistant's sidebar, with the card's text to copy.
- **Dashboard card**: `tabs: true` shows the tab bar in the card; `kiosk: true` makes a wall tablet of it: Home Assistant's sidebar and the dashboard's top bar are hidden for users without admin rights (to try out; `?kiosk=off` in the address leaves it). Both in the card's editor under *In der Karte zeigen*.

### Changed
- The demo has no live stream of its cameras and now says so at once, so a camera opened big shows its still image straight away.
- **On the way to the HACS store**: the workflow *Validate* runs HACS's own check of this repository (daily, on every push to `main` and every pull request); what is still to do, and the request to HACS that only the owner can make, is in `docs/HACS-STORE.md`.

## [4.2.1] - 2026-10-21
### Changed
- **A choice list with a few options shows them as buttons** (#474): the live card of a choice list (`input_select` / `select`, e.g. a house mode *Zu Hause / Abwesend / Urlaub / Nacht*) had only a drop-down, so *Urlaub* was no button to tap. Up to 6 options now stand side by side as buttons like a fan's presets, the chosen one highlighted; longer lists stay a drop-down. Its ball shows ☰ instead of a plain dot.
- **Measure: *Lichter Abstand* is now *Innenmaß (Wand bis Wand)*** (English: *Inside distance (wall to wall)*): the owner's wish, the old name was a builder's term. The same plain words in every language.

### Fixed
- **Demo: the robot vacuum could not be found** (#473): it stood in the kitchen right under the stairs. It now stands in front of the kitchen counter. The demo's house mode moved from the crowded outer wall of the office (next to the meters' labels) to its inner wall.
- **Demo: no air conditioner that cools**: the only thermostat of the demo heats (off / heat / auto), so a split air conditioner linked to it showed no *Kühlen*, which is right for such a device. The demo office now has an air conditioner of its own (cool, heat, dry, fan, auto, presets and fan speeds) that cools and heats.

## [4.2.0] - 2026-10-21
### Added
- **Lights off for the whole house or a group of rooms** (#471): while lights are on, **💡 n an** shows at the top. A tap lists **Ganzes Haus** and your **light groups** (several rooms together, e.g. *Kinder* or *Oben*), each with how many of its lights are on, 👤 when somebody is in one of its rooms, and **Aus**. So nothing goes off by accident, the first tap only asks (**Sicher? Aus**), the second within three seconds switches off only that row's lights. The groups are set up in ⚙ → **⭐ Schnellzugriff** → *Licht-Gruppen* (a name and the rooms, ticked by floor). On phones the button is in the 📊 list.
- **Favourites** (#471): the devices and scenes used most as buttons at the start of the strip at the bottom of the live mode, in front of the room tiles (also when the room tiles are off). One tap starts a scene, a script or a button, or toggles a light, switch, fan, roller shutter or player; a lit lamp glows in its colour. Set with **☆** on a device's card in live mode or in ⚙ → *Schnellzugriff* → *Favoriten* (add by name, ↑ ↓, ×), at most 16. A lock or an alarm panel is never a favourite.
- **"What is still on?"** (#471): the device list (📋) has the filter **💡 An / offen**: lights, switches, fans, players and robot vacuums that run, and open doors and windows.
- **Low batteries stand out** (#471): **📋 Geräte · 🪫 n** turns orange, and a tap opens the list at **🔋 Batterie** with the emptiest first.
- **Undo after deleting** (#471): in the editor **Gelöscht · ↶ Rückgängig** shows for six seconds after something was deleted (several at once: *3 Teile gelöscht*); the button brings it back, handy on a tablet without Ctrl+Z.
- **All keys on one card** (#471): **?** in the editor, or *⌨ Alle Tasten* under *Steuerung*, lists every key (tools, undo, copy, nudge by 1 cm / 10 cm, floors …).
- **Recently used** (#471): the pieces placed last stand on top of the furniture library (*Alle*, no search), per browser.

## [4.1.4] - 2026-10-20
### Fixed
- **Rooms turned black in the 2D plan with Temp., Feuchte or CO₂** (#467): the colour of a room's reading was handed to the plan as a number, which is no colour there, so every room with a sensor was drawn dark grey or black instead of in the colour of its temperature, humidity or CO₂ (in every design). Now the plan shows the colour of the reading, and *Normal* the colour of the floor as before.

## [4.1.3] - 2026-10-20
### Fixed
- **„Im Bild: Raum-Schilder“ seemed to do nothing in the whole-house view** (#464): there are no room labels in *Ganzes Haus* (over every room of every floor they would pile up), and until now the devices' balls and value labels showed there instead, as with *Geräte*. Now, as the owner chose, the picture of the whole house shows nothing with *Raum-Schilder*: no balls, no value labels, no room names, only the floor cards beside the house (rooms, lights on, windows open; a tap opens the floor). *Im Bild: Geräte* shows the devices in the whole house as before.

## [4.1.2] - 2026-10-19
### Fixed
- **„Im Bild: Raum-Schilder“ did nothing in the demo** (#462): the demo starts in edit mode on a PC or tablet, and room labels and room tiles only show in live mode, so a tap on *Ansicht* → *Im Bild: Raum-Schilder* (or *Raum-Kacheln*) changed nothing to see. In edit mode the tap now switches them on and goes to live mode, where they show (in the add-on too). In live mode it switches them on and off as before.
- **The demo has what was missing** (#462): **🛡️ Sicherheit** plays back two recorded days (yesterday and today until now) instead of *Die Aufzeichnung konnte nicht geladen werden*; **Geräte → Batterie** lists the batteries of the window, door and other sensors (two nearly empty); **🗄️ Backup → Backup herunterladen** saves the demo's houses and settings as a real backup file of the add-on (before it left the demo for an error page), ⬇ of a recorded day saves its file; **Import** shows the examples and the AI prompt lists every device type; *Version → Jetzt prüfen (auch mit GitHub)* answers. What only the add-on can do (building a house from JSON, restoring a backup, exporting a house) says so instead of leaving the page: *Häuser → Als Datei exportieren* is a download link now, not a new address.

## [4.1.1] - 2026-10-18
### Changed
- **The holiday alarm does not lock out the owner** (#460): users who may edit get no lock screen any more when it is armed. Instead a **red strip at the top** of the picture says *Urlaubs-Alarm wird scharf in … s*, *ist SCHARF · seit …*, which door is open and the seconds left, or *ALARM*, and a **red frame** runs round the whole screen (blinking at an alarm); the plan can be used as usual. A tap on the strip (or the 🛡 button) opens the keypad to switch it off. Wall tablets (users who may not edit) still get the half see-through lock screen; *Nur ansehen* is gone.
- **Where each message target comes from** (#460): with *Senden über* → *Benachrichtigungsdienst von Home Assistant* the list is split into **📱 Home Assistant App (Handy)**, **🧩 In Home Assistant eingerichtet (Geräte & Dienste)** and **📄 Aus der configuration.yaml (alte Art)**, each row with its full name (`notify.…`) and, for the ones set up in Home Assistant, the integration (e.g. *Telegram-Bot*).
### Added
- **Home Assistant's own Telegram bot** (#460): the chats of the Telegram bot integration (and other notify entities, which integrations set up in the UI make since Home Assistant 2025) show in the list and can be ticked; the message goes to them with `notify.send_message`. A folding guide **✈️ Eigenen Telegram-Bot einrichten** explains the four steps (@BotFather, chat ID, add the integration with the button that opens it in Home Assistant, tick the chat); nothing needs to go into `configuration.yaml`.

## [4.1.0] - 2026-10-18
### Added
- **Holiday alarm, the add-on's own alarm** (#456): ⚙ → *Warnungen & Alarm* → **🛡 Urlaubs-Alarm**, no Alarmo needed. Tick the door, window and motion sensors that set it off (grouped, with their room and whether they are open now), whether a sensor that stays offline for more than 5 minutes counts too (battery, radio; not while Home Assistant starts again), the seconds to leave the house and to switch it off when coming home (30 to start with), a code of 4 to 8 digits (stored only as a salted hash), the sirens, lights, switches, scripts or scenes to switch on at an alarm, and whether a message goes out (through *Benachrichtigung bei Alarm*) also when somebody arms or disarms it. The add-on watches by itself, also with no screen open.
- **A lock screen while it is armed** (#456): a 🛡 button over the plan arms it with the code. While it is armed a half see-through screen covers the whole tablet with a keypad: it counts the time to leave, says when it is armed, counts the time to type the code when a door opens, and shows the alarm in red with what was opened. Only the code switches it off (on any screen); after five wrong codes everybody waits five minutes and a message says so. Users who may edit can *Nur ansehen* (just look at the plan), wall tablets cannot. New lock in *Benutzer & Tablets*: **Urlaubs-Alarm** takes arming and disarming away from a user (the server refuses it too).
- **Telegram through CallMeBot** (#456): *Senden über* → *Telegram*: to people (their Telegram user names; each sends `/start` to @CallMeBot_txtbot once) or **into a Telegram group** with the group's key from CallMeBot, each with numbered steps. The group key stays in the add-on like the WhatsApp key.
- **Notify services of Home Assistant to tick** (#456): instead of typing `notify.…`, the list shows every notify service Home Assistant has, also those of `configuration.yaml` (Telegram, the Companion app, WhatsApp, Signal, mail …, each with a sign), and the message goes to every ticked one.
### Changed
- The place in a message also names the room of a door or window contact (the room beside its wall), not only of a device.
- The demo has the holiday alarm set up with the code 1234: armed for 25 seconds, a "burglar" opens the office door, so the whole flow can be seen.

## [4.0.3] - 2026-10-18
### Changed
- **Users & tablets are in the settings** (#454): the button *Benutzer* in the top bar and its own window are gone; everything of it (users with room, view, start view, presets and locks, the backup file `users.json` with *Datei erstellen / speichern* and *Synchronisieren*) is now the group **👥 Benutzer & Tablets** of ⚙, for administrators only as before and not on phones. The rows of a user fit the narrower window: the user with ⚙ and × on top, room, view and start below. The top bar is shorter.
- **WhatsApp on alarm is easier to set up** (#454): ⚙ → *Warnungen & Alarm* → *Benachrichtigung bei Alarm* shows three numbered steps for CallMeBot (send it the message *I allow callmebot to send me messages*, enter the key it sends back and your number, tick, save and send a test) instead of one long sentence.

## [4.0.2] - 2026-10-18
### Fixed
- **One building of several shows cleanly** (#451): a long wall that runs along a room of the building shown and along rooms of another building is drawn only along the building shown (and along rooms of the plot), no piece of it stands in the empty rooms of the other building any more. A wall that only meets a room of the building shown from the other building (30–40 cm at its end) no longer sticks out. Framing the view and the roof of one building use these parts too.
- **A room no longer takes the floor below with it** (#451): a room without a building of its own took the building of a room that lies over or under its middle on another floor, also of a room **upstairs**: giving a small room on the upper floor to building 2 took the big room on the ground floor below it (and its walls) along. Now only the floors above follow the ground floor (and a basement follows the ground floor above it), as the help says; the ground floor never follows another floor.
- **What lies in no room upstairs** (a piece of wall, a lamp between two rooms) belongs to the building of the room under it, not to all buildings.
- **The device list shows only the building shown** (#451): with a building chosen at the top, "📋 Devices" lists only its devices, doors and windows (and what stands in no room, e.g. in the garden), and the number of low batteries on the button counts only those.

## [4.0.1] - 2026-10-18
### Changed
- **The settings in groups that fold open** (#450): ⚙ was one long list. Now it has ten groups: *Allgemein*, *Zeichnen & Bearbeiten*, *3D-Bild & Leistung*, *Was im Bild erscheint*, *Etagen*, *Haus außen & Umgebung*, *Licht & Hintergrund*, *Warnungen & Alarm*, *Wandtablet* and *Farben für Temperatur, Feuchte, CO₂*. Each one says in a small line what is in it, a tap opens or shuts it, *Alle aufklappen* opens all of them. They are all shut at first; the browser remembers which ones were left open.
- The times for *Nachts abdunkeln* only show when it goes by the clock.
### Added
- **A search in the settings** (#450): type a word at the top (*Alarm*, *Himmel*, *Wand* …): only the groups that have it stay, opened, with the matching rows marked. The tooltips count too (*Sonne* finds the sky). Escape empties it.
- **What the alarm panel is** (#450): the group *Warnungen & Alarm* explains it: an alarm panel of Home Assistant (for example the free integration *Alarmo*); which doors, windows and motion sensors set it off is chosen there, not in the add-on. It names the alarm panels Home Assistant has, with their state. Who may not edit is told why the part *Benachrichtigung bei Alarm* is missing.
- The demo shows the part *Benachrichtigung bei Alarm* as well (nothing is sent there).

## [4.0.0] - 2026-10-18
### Added
- **Walls with a finish** (#448): in the properties of a room, *Wände* gives its walls a finish on the room's side: smooth paint, woodchip (Raufaser), textured plaster, lime plaster, exposed concrete, wallpapers (stripes, damask, dots, harlequin, leaves, art deco fans, zigzag, plaid, linen), tiles (20 × 20, 10 × 10, metro, metro in herringbone, large 60 × 30, hexagons, glass mosaic, marble, zellige), brick (red, white painted, anthracite, yellow), natural stone, wood panelling and acoustic wood slats. The rooms next door keep their own walls; doors and windows stay open.
- **Something else below** (#448): *Unten anders* puts e.g. tiles up to 1.20 m (any height) and the wall finish above, as in a bathroom or kitchen. *Wände für alle Räume der Etage übernehmen* gives every room of the floor the same walls in one step.
- **Accent wall** (#448): a wall's properties have *Oberfläche dieser Wand*: each side (named by its room, or *Außen*) can have a finish of its own over the whole height.
- **Facade** (#448): ⚙ → *Fassade*: textured plaster, brick (red, white, anthracite, yellow), natural stone, wood cladding (larch, weathered), slate, exposed concrete or facade panels on the outside of the walls, with its own colour (*Farbe der Fassade*); *Glatt (wie bisher)* keeps the walls as they were.
- **Many more floors** (#448): besides the parquets, tiles and concrete: wide planks, herringbone, chevron, basket weave, laminate, decking, cork, large tiles 120 × 60, wood-look tiles, checkerboard, hexagons, mosaic, cement tiles, terrazzo, marble, slate, natural stone slabs, flagstones, paving, cobblestones, carpet and carpet tiles, under the headings wood, tiles, stone and other.
- **Every pattern can be changed** (#448): its colour (a row of colours to tap, or any colour), the second colour (grout, motif, gaps, veins), the size of one tile, plank or motif in cm, and the angle it is laid at (0°, 45°, 90°, 135° or any other); *↺ Wie vorgegeben* takes it back. The patterns are drawn by the browser (no picture files) with a relief that catches the light, repeat without a seam and start at the corner of the room (floors) or at the floor (walls).
- Import / export and the JSON schema know the new fields `floorLook`, `wallLook`, `wallBelow` (rooms) and `faces` (walls); the settings `facade` and `facadeColor`.
### Changed
- The demo shows the new finishes: herringbone and woodchip in the living room, metro tiles in the kitchen, tiles up to 1.20 m in the bathroom, carpet and leaves wallpaper in the bedroom, wallpapers upstairs, white brick in the studio, plaster outside.
- One colour without pictures in the "fast" performance mode (walls and floors in the colour they have from afar), none in the hologram design.

## [3.99.6] - 2026-10-18
### Fixed
- **Swiping the room tiles on the phone runs smoothly** (#441): since 3.99.5 the page moved the strip at every move of the finger, and on the iPhone that jerked and got stuck, a slanted swipe stopped it. Now the browser scrolls the strip itself again (smooth, it glides on by itself), only sideways. The strip takes touches as soon as it has more tiles than fit, which is what the iPhone needed to scroll it at all (#438). The page moves the strip only as a stand-in, when the browser does not take over after a few millimetres.
- **"Strom" shows the power on the phone** (#442): on phones the card "Power now" was switched off completely, and the line of numbers sits in the list behind "📊" at the top, so pressing "Strom" showed only the thin cables in the house. Now the card appears on phones too while "Strom" is pressed: small (about a third smaller than on the tablet), in the middle under the top bar, so the house stays in sight. A tap on it switches "Strom" off again.
### Changed
- **Room labels on the phone too** (#444): "View" → "In the picture: room labels" did nothing on phones, the labels over the rooms were switched off there. Now they show on phones as well, a little smaller; labels without room become small dots as everywhere, a tap opens the room.
### Added
- **Time and weather at the bottom of the phone** (#445): one short line at the very bottom, "☀️ 12:24 · ⛅ Partly cloudy · 14 °C" (without a weather entity the next sunset or sunrise). It uses the strip kept clear of the iPhone's home bar, which stayed empty in the Home Assistant app; where there is none, the view buttons move up a little.

## [3.99.5] - 2026-10-18
### Fixed
- **Swiping the room tiles on the iPhone** (#438): on the iPhone (Safari, also in the Home Assistant app) the strip of room tiles at the bottom could not be swiped sideways, so the rooms further right were out of reach (phones have no arrows). Now the finger moves the strip itself, the same on every device: it follows the finger, a quick swipe glides on and slows down, a tap still opens the room and a swipe opens none. The mouse keeps its wheel and the arrows.
- **The tapped room no longer hides behind the room card on the iPhone** (#440): on phones the picture moves up while the room card is open at the bottom, so the room stands above it. The iPhone keeps the card clear of its home bar, a little higher than before, and then the picture did not move: the room lay behind the card. Now a card that far up still counts.

## [3.99.4] - 2026-10-18
### Fixed
- **The room tile you tapped is no longer empty** (#436): on the tablet (the "fast" performance mode) the tile of the room opened lost its name, temperature and lights: dark text on the dark tile. Now it has its own light text on a tint of the accent colour.
### Changed
- **More and nicer stars at night** (#436): many faint stars, some clearer ones and a few bright ones with a soft glow, some a little bluish or warm, sharp on tablets too, and a faint Milky Way across the sky. Under a cloudy sky some stars still shine through (none when it is overcast), and the clouds lie in front of the stars.
- **Room labels tidied up** (#436): with many rooms the labels piled up into towers over the house, on long lines. Now a label that would cover another one moves up one row at most; if there is still no room it shrinks to a small dot over its room (a tap opens the room as before). The rooms that matter more keep their labels: lights on, then somebody there, an open window, a temperature, then the nearer rooms. Zooming in turns the dots back into labels.

## [3.99.3] - 2026-10-18
### Fixed
- **"Power now" only while the button "Strom" is pressed** (#434): the card with the sun, the grid, the house and the battery (and the meters under it) was always at the top right on wide screens, also when the button **Strom** at the bottom was not pressed. Now it shows only while **Strom** is on (or the power editor is open); a tap on the card switches it off again, like the button. The line of numbers at the top left stays away on wide screens as before. The button **Strom** now also shows when only the sensors of the tab "⚡ Rechnung" are set and no power device stands in the plan, so the card can still be called up.

## [3.99.2] - 2026-10-18
### Changed
- **Room tiles that do not fit** (#421): with many rooms (the whole house of a big plan) the strip of room tiles was simply cut off on the right. Now an arrow at each end with more to see scrolls it, the cut side fades out, and the mouse wheel scrolls it sideways too. Phones keep swiping.
- **Floor cards next to the energy picture**: in the whole-house view the floor cards no longer slide under the "Power now" card and the sky chips at the top right; they move to the other side of the house.

## [3.99.1] - 2026-10-17
### Changed
- **Room labels no longer lie on each other** (#430): seen low from the side, labels of rooms one behind the other landed on the same spot on the screen. Now they are pushed apart, upwards: the nearer room keeps its place, the farther one goes up on a longer line down to its room.
- **The meters in the energy picture** (#420): the water, gas and heat meters (e.g. 🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh) stand under the circles of "Power now" on wide screens instead of in a pill of their own at the top left. Phones keep the pill.

## [3.99.0] - 2026-10-17
### Added
- **Real floors per room** (#427): in the properties of a room, *Boden* puts parquet (oak, light, dark), tiles (30 cm, small for the bathroom, anthracite 60 cm) or concrete in it instead of one colour. The patterns are drawn by the browser (no picture files) at their real size; the colour views Temp. / Humidity / CO₂ colour the floor as before; the 2D plan and the floor thumbnails show the room in the colour of its floor. One colour in the "fast" performance mode and in the hologram design. Import / export and the JSON schema know the new field `covering`.
- **Anthracite window frames** (#428): ⚙ → *Fensterrahmen*: white (as always) or anthracite, with lighter walls; the door frames stay white.
- **Room labels or devices** (#430): in live mode on wide screens either a glass label over every room of the floor shown (name, temperature, lights on with the edge in their colour, open window, a green dot when somebody is there) or the devices as before, never both (the owner's wish). The room labels are the new default: the devices' balls and value labels and the names on the floor are off meanwhile; a tap on a label or a room opens it with its devices. Not in the whole-house view, with a room opened, in edit mode or on phones. *Ansicht* → *Im Bild: Raum-Schilder / Geräte* switches (also ⚙; the users dialog can preset it).
### Changed
- **Glass look** (#429): the buttons over the picture and the floor cards on the left are frosted glass like the room tiles and the energy picture (light glass in the light design, no blur in the "fast" mode).
- The demo shows the new floors and the anthracite window frames.

## [3.98.2] - 2026-10-17
### Changed
- **Battery in the energy picture says what it does** (#420): instead of only "Battery" under it, the circle now says **"idle · 0 W"** when it neither charges nor discharges (e.g. at night at 9 %, when most batteries hold their reserve) and **"no power sensor"** when its power is unknown, so a missing power sensor can be told apart from a resting battery.

## [3.98.1] - 2026-10-17
### Changed
- **Energy as a picture also in edit mode** (#420): on wide screens the card with the sun, the grid, the house and the battery now stands at the top right in edit mode too, instead of the line of numbers. Only phones keep the line (no room for the card). "Power as a picture" in the View menu and in the settings still gives the line back.

## [3.98.0] - 2026-10-17
### Added
- **Sky by the time of day** (#418): behind the 3D view a sky that follows the sun instead of one colour: dark blue with stars at night, pink at dawn, orange at sunrise and sunset, blue by day. The sun comes from `sun.sun` (the add-on now sends its elevation and the next sunrise / sunset), without it from the clock. The lawn turns darker at night and warmer at sunset; the light in the house stays as it is. Live mode, wide screens: a chip at the top right, e.g. "🌇 Evening · 18:45 · Sunset 18:52". Setting **"Sky"** (by the time of day and the weather / plain colour); the hologram design keeps its own backdrop. Costs nothing per frame: the sky is CSS behind the see-through canvas.
- **Weather in the sky** (#419): the weather entity (the one set for the rain warning, else the first `weather.*`) turns the sky grey with clouds, and in live mode **rain or snow falls** over the picture (standing still in the "fast" performance mode). A second chip: "🌧️ Rain · 11 °C · Wind 24 km/h".
- **Rain warning per window** (#419): a window with a contact has the new tick **"Warn in the rain"** (on by default). A window that may stay open in the rain is saved with `rainWarn: false` and gives no warning; import, export and the schema keep it.
- **Energy flow as a picture** (#420): live mode on wide screens, a card at the top right with the **sun, the grid, the house and the battery** and dots running along the lines between them, faster with more power, like the energy distribution card of Home Assistant. It replaces the line of numbers there (on phones and in edit mode the line stays). A tap shows or hides the power cables. **"Power as a picture"** in the View menu and in the settings; the user lock "power" hides it too.
- **Room tiles** (#421): live mode, a strip over the view buttons with a **card per room** of the floor shown (the whole house: every room with its floor): the name, the **temperature**, the **lights that are on** (the card's edge in their colour), **open windows** and 👤 when somebody is there. A tap flies to the room and opens its room card, a second tap goes back. Smaller and swiped sideways on phones. **"Room tiles"** in the View menu and in the settings, also as a preset per user.
- **Tool bar with icons and groups** (#422): every tool of the edit mode has a line icon with its name under it, in groups with a small caption: select | **DRAW** | **PLACE** | **TOOLS**. A few names are shorter under the icon ("Detect", "Opening", "Power", "More"), the customise dialog keeps the full ones. The groups follow the order the bar shows (tools can still be hidden, moved and folded); the roof now stands with the drawing tools.
- New modules `sky.js` (sun, sky colours, weather; unit tests `tests/sky.test.mjs`) and `skyui.js`, `energyflow.js` (what flows where; `tests/energyflow.test.mjs`) and `energyflowui.js`, `roomtiles.js` (what a room's card shows, and the room reading of the colour views, moved out of `app.js`; `tests/roomtiles.test.mjs`) and `roomtilesui.js`, `toolicons.js` (icons and groups; `tests/toolicons.test.mjs`). Browser test part `25_sky_tiles`. The demo has a weather entity; `?weather=rainy` (snowy, cloudy …) and `?skytime=21:30` try the weather and another hour. Translated into all 7 languages. Example pictures and the plan: `docs/ideen-3.98/`, `docs/PLAN-3.98.md`.

## [3.97.0] - 2026-10-17
### Added
- **A message on alarm, by WhatsApp** (#414): when the **alarm panel goes off** or a **smoke, gas, carbon monoxide or water sensor** reports, the add-on sends a message at once, also when no screen is open (it keeps its own connection to Home Assistant, like the security recorder). The message says what went off, **where it is in the plan** (house · floor · room) and the time, e.g. "🔥 Rauch erkannt: Rauchmelder Küche – Erdgeschoss · Küche · 17.10. 18:22".
  - **Two ways:** WhatsApp **directly through CallMeBot** (free: your number and the key CallMeBot sends you once) or **any notify service of Home Assistant** (a WhatsApp, Telegram or Signal integration, the Companion app …; the list offers the ones Home Assistant has).
  - New part **"🚨 Message on alarm (WhatsApp)"** in the settings (editors only): on / off, which sensors, optionally a message when everything is back to normal, **Send a test** (a wrong key is said so).
  - No flood: the same sensor again only after 10 minutes, at most 10 messages in 10 minutes; what is already going off when the add-on starts is not sent again.
  - The phone number and the key stay in the add-on (`notify.json`), not in the settings every tablet reads; the key is never handed out again. New endpoints `GET/PUT /api/notify`, `POST /api/notify/test` (editors only).
  - New modules `alarmnotify.py` (what is an alarm, the text, where it is, the watching; unit tests `tests/test_alarmnotify.py`) and `notifyui.js` (the settings part). Browser test part `24_alarm_notify` with a stand-in CallMeBot. Translated into all 7 languages; add-on docs: "Message on alarm (WhatsApp)".

## [3.96.0] - 2026-10-17
### Added
- **More devices switched right in the plan** (#406): a tap on a device in live mode opens its card, and the card now has the controls of more kinds of devices:
  - **Music and TV** (`media_player`): what is playing (title – artist), **⏮ ⏯ ⏭** (previous, play / pause, next), a **volume** slider (or louder / quieter), **mute** and the **source** (HDMI, Spotify, radio …). Off, it has a button to switch it on.
  - **Robot vacuum** (`vacuum`): its state in words (cleaning, at the dock, on its way back …), **clean** / **pause** / **back to the dock** / **locate**, and the **suction**.
  - **Fan** (`fan`): on / off, the **speed** on the fan's own steps (a fan with 4 speeds: 25, 50, 75, 100 %), **swing** and its **presets** (night, nature …).
  - **Thermostat and air conditioner** (`climate`): the live card has the target temperature with − / +, the modes, and new: the **presets** (eco, comfort, away, boost …) and the **fan modes** (auto, low, high …), also in the heating panel next to the room panel.
  - **Alarm panel** (`alarm_control_panel`): its state (disarmed, armed home / away / night, alarm), **arm** (home, away, night, vacation, as far as the panel can) and **disarm**, with a field for the **code** where Home Assistant asks for one (a wrong code is refused, the card says so). New lock in the users dialog: **"Alarm panel (arm / disarm)"** takes it away from a user or tablet, the add-on refuses it then too.
  - **Buttons** (`button`, `input_button`): **press**. **Choice lists** (`select`, `input_select`): a drop-down with the options.
  - Which buttons a device gets follows what Home Assistant says it can do (`supported_features`), so a simple radio gets no "next track".
- **The add-on checks every switching command more closely**: each domain has its own list of allowed services and every value is checked (range, type, length) before it goes to Home Assistant; anything else (e.g. a vacuum's raw commands, the alarm's "trigger") is refused. New module `controls.py` (unit tests `tests/test_controls.py`); entities carry the few values the controls need as `ctl` (volume, track, sources, suction, fan speed, presets, options …).
- New module `devicecontrols.js` (which buttons a device gets: pure, unit tests `tests/devicecontrols.test.mjs`, and the drawing). The demo has a speaker, a robot vacuum, a fan, an alarm panel (code 1234) and a house mode to try it. New browser test part `23_device_controls`. Translated into all 7 languages.

## [3.95.0] - 2026-10-17
### Added
- **Energy: take over the energy dashboard of Home Assistant** (#407): the tab **⚡ Rechnung** of the power editor has a new part **🧭 Einrichten** at the top. **⤵ Aus dem Energie-Dashboard übernehmen** reads what is set up in Home Assistant's energy dashboard and shows it as a proposal: the grid, the solar sensors, the battery with its charge level, and the gas and water meters. **✓ Übernehmen** puts grid, solar and battery into the tab (Ctrl+Z takes it back); the rooms and the house sensor stay as they are.
  - **The signs are turned the right way**: Home Assistant counts the battery plus = discharging, the tab plus = charging, so its sensor is turned round by itself; a sensor marked as inverted in the energy dashboard, or two sensors (charge / discharge, import / export), are taken over as such.
  - **Only energy meters (kWh) in the energy dashboard**: the proposal takes the power sensor (W) on the same device and marks it "guessed, please check below".
  - **Check list**: what is set up (✅), what is missing (○), what should be checked (⚠, e.g. a sensor without a value or a calculation that does not add up) and what is optional (ℹ): grid, solar, battery, house consumption, rooms, meters, calculation. It follows the live values while the window is open.
  - **Meters in one click**: a gas or water meter of the energy dashboard that is not in the plan yet gets a button **+ Gaszähler / Wasserzähler in den Plan setzen**: it is put into the open floor (onto the nearest wall) and linked to its sensor.
  - New endpoint `GET /api/energy/prefs` (editors only): the energy dashboard's settings and the other sensors of each device. New modules `energyprefs.js` (pure: the energy dashboard as the tab's settings, the check list; unit tests `tests/energyprefs.test.mjs`) and `energysetup.js` (the part of the window). The demo answers with an energy dashboard of its own. Translated into all 7 languages.
### Changed
- **Roadmap and test protocol tidied up** (#408): the roadmap lists what is open first and has the new things from 3.59 to 3.95; sun light (#68) is marked as not planned. The test protocol starts with a short list of the 15 most important points to check, the long older lists are folded below it.

## [3.94.0] - 2026-10-17
### Added
- **Several buildings in one plan** (#409): draw the main house and the garden house (or a workshop, a granny flat …) together in one plan and say which part is which:
  - **Panel "🏘 Buildings in this plan"** in the side panel (editors): add, rename and delete buildings, and pick for every room which building it belongs to. Walls, doors, windows, devices, stairs and blocks belong to the building of their room by themselves; a room without a building takes the one of the room below or above it (assign the ground floor, the floors above follow, shown as "automatic (…)"); what lies in no room (the garden, the carport …) belongs to the plot and always shows. A room drawn while one building is shown belongs to that building.
  - **Switch "🏘 All buildings / main house / garden house"** at the top (from two buildings on): only the building chosen is drawn in 3D and in the 2D plan, framed, listed (objects, search, offline and open lists, floor cards) and has its lawn; floors with nothing of it leave the floor buttons, the floor rail and the phone's floor list; the main roof follows that building. Warnings (smoke, water …) stay for the whole plan. The choice is remembered per plan in the browser.
  - **Roofs per building:** the main roof and every further roof can be given a building; a further roof without one belongs to the building under it. **"🏠 Give every building its own roof"**: the tallest building keeps the main roof, every other one gets a further roof of the same kind over its own rooms, on top of its highest floor. While the main roof still covers all buildings, the panel says so.
  - **Per user / tablet** (users dialog, ⚙ of a row): which building a user or tablet sees at start, and the new lock **"Switch buildings"** keeps it there (the switch is hidden). Stored as `userBuildings` (also in `users.json`), `/api/me` reports it.
  - **Bring another house in:** the panel can bring another house of the house list into this plan as a building of its own: its floors go onto the floors of the same level (a floor this plan does not have is put in at the right height), it goes exactly where it stands as the neighbour house (that entry goes away) or 3 m to the right of this plan, everything gets new ids, its roofs become further roofs of its building, LED rings and cables keep pointing at their copies. The other house stays in the list. One Ctrl+Z takes it all back.
  - New modules `buildings.js` (pure: which building a thing belongs to, the plan as one building sees it, roofs per building, bringing a plan in; unit tests `tests/buildings.test.mjs`) and `buildingsui.js` (the switch and the panel). Translated into all 7 languages. Browser test part `21_buildings`.

## [3.93.0] - 2026-10-17
### Added
- **Redo** (#404): **Ctrl+Y** or **Ctrl+Shift+Z** (Cmd on a Mac) does again what **Ctrl+Z** took back; a new change after an undo empties the redo list, like in every program. Two new buttons **↶** and **↷** next to *Save* do the same and are greyed out while there is nothing to undo or do again (handy on a tablet without a keyboard). The help of the side panel lists the keys. The redo list lives next to the undo list in `persist.js` and is rewritten too when entities are renamed in Home Assistant.
- **Copy, paste and duplicate** (#405): **Ctrl+C** copies what is selected (one thing or several together: devices, walls with their doors and windows, rooms, blocks, stairs, floor openings), **Ctrl+V** pastes it, **Ctrl+D** duplicates the selection at once (the copy of Ctrl+C stays). On the floor it came from the copy lands half a metre aside, each further paste one step more; on another floor, or in another house, at the same place (the same lamp one storey higher). Everything gets new ids, the linked entities stay, nothing of the copy is locked; an LED ring copied with its room follows the copied room. A door or window copied alone goes into the same wall at the next free place beside it. What was pasted is selected and can be moved at once; one Ctrl+Z takes it back. Without a selection Ctrl+C / Ctrl+V stay the browser's own; Ctrl + a letter never picks a tool any more (Ctrl+D used to pick the device tool). New module `clipboard.js` (pure, unit tests `tests/clipboard.test.mjs`). Browser test part `20_editing` (redo, copy / paste, a second screen saving meanwhile).
### Fixed
- **The plan is no longer overwritten without a warning when two screens edit at the same time** (#403): every plan has a version tag now (`ETag` of `GET /api/layout`, taken from its content). A save carries the tag of the plan as the screen loaded it (`If-Match`); when another screen (or a forgotten browser tab) saved the plan meanwhile, the add-on refuses the save (HTTP 409) and asks: **load the other version** (the changes of this screen are dropped, the open floor stays) or **keep my version** (saved over the other one). Esc decides nothing. Saves of one screen go one at a time, so the save button during an autosave is never taken for a change made elsewhere. When the add-on rewrites the plans because entities were renamed in Home Assistant, it sends the new tags along, so that is not taken for a change elsewhere either. A save without a tag (older browsers, scripts) is stored as before. Unit tests in `tests/persist.test.mjs`, server tests in `tests/test_server.py`.
- **Spiral stair over several floors: the hand rail no longer runs through** (#318): the rail of a spiral with "Floors" 2 or more was one piece over all turns, also over the landing on the floor in between, so in theory you could not step off there. Every turn now has a hand rail of its own: it ends at the landing and the next one starts after it, so the way off onto the floor is open (`rails` in `stairs.js`, one per storey; tested).

## [3.92.0] - 2026-10-17
### Added
- **Something hanging from the ceiling over the bar** (#401): both bar counters (*Bartheke mit LED* and *Bartheke über Eck mit LED*) have a new choice **An der Decke** in the side panel: *Nichts* (as before), **Gläserregal mit hängenden Gläsern** (a board in the finish of the bar on a steel frame, two rows of wine glasses hanging upside down, LED under it), **Deckensegel mit LED** (a floating panel with light on top and downlights under it) or **Pendelleuchten** (pendant lamps on a black ceiling track). It follows the counter, straight or round the corner (the L-shaped bar gets an L-shaped rack, panel or track), and hangs from the ceiling of a 2.6 m high room. Its light is a third LED zone **Deckenteil**: without a light of its own it follows the bar, or it gets its own light under *LEDs einzeln verknüpfen*, with its own button in the live card. The plan, the wall stop and the size fields stay those of the counter. The show house has a glass rack over its bar. Translated into all 7 languages; the house import knows the new choices (`variant`: `rack`, `canopy`, `pendants`). The LED zones of a piece can now depend on how it is built (`zoneKeys(type, dev)` in `ledzones.js`); the size of a model for the side panel moved from `app.js` to `models.js` (`baseSize`). Unit tests in `tests/leisure.test.mjs` and `tests/ledzones.test.mjs`, browser test part `16_leisure`.

## [3.91.0] - 2026-10-16
### Added
- **Measuring in the 2D plan and in 2D + 3D** (#399): a new tool **Messen** in the tool bar, also with the key **M** (in the 3D view it opens 2D + 3D). Click two points: the plan shows the line with its length, the side panel the length, how far across and down the plan it goes and its slope. Clicks snap to wall ends, to the inner and outer corners of the wall faces, to room corners and onto the face of a wall; **Alt** measures from a free point. Click **two walls** one after the other and set them exactly in the side panel: for parallel walls the **clear distance** (face to face) or the distance between the wall centres, for any two walls the **angle** between them. The orange wall moves (a straight wall drawn in several pieces as a whole), the walls joined to it stretch along, a wall that ends on it too, and the rooms follow; a turned wall keeps its length and turns round the corner. **⇄** moves the other wall instead, Ctrl+Z takes it back. The plan shows the two walls, the distance between their faces at right angles and the angle in the corner; the 3D view shows the line with its length, and clicks there measure too. Translated into all 7 languages. New modules `measure.js` (points, distances, angles, what moves; pure logic, unit tests `tests/measure.test.mjs`) and `measuretool.js` (side panel, line in 3D); browser test part `19_measure`.

## [3.90.0] - 2026-10-16
### Added
- **Garage, workshop and carport: about 55 new pieces** in three new library groups, all in their real sizes, so you can try out whether the car, the motorhome or the workbench fits:
  - **Vehicles**: small car, saloon, estate, SUV, sports car, pick-up, van / minibus, camper van, motorhome (semi-integrated), motorhome with alcove, caravan, car trailer, motorbike, scooter, bicycle, e-bike, cargo bike, ride-on mower and robot mower with its charging station. The cars have wheels with rims, windows, mirrors, lights and number plates, the motorhomes their living part with windows, entry door, awning and roof lights. Select a car to choose its **paint** under *Ausführung* (silver, white, black, grey, red, blue, green, glossy like car paint). Link it to an entity (its charger switch, the lock …): its **head lights glow white and its tail lights red** while it is on.
  - **Workshop**: workbench, workbench with pegboard and light, pegboard with tools, tool trolley, tool chest, heavy-duty shelf, wall with storage bins, two-post car lift, trolley jack, compressor, drill press, table saw, bench grinder, welder, shop vacuum, tyre rack, stacked tyres, stepladder, LED workshop light, high bay light, fire extinguisher, oil drum, mechanic's creeper. The workshop lights and the workbench with its light are lamps: they light up the room.
  - **Garage & carport**: carport, double carport, solar carport, four wheelie bins, bin store, bike rack, bike on the wall, ceiling rack, metal cabinet, wheelbarrow, lawn mower, garden tools on the wall, pressure washer, wheel stops.
  - Wall pieces (pegboard, bins on the wall, fire extinguisher, garden tools, bike on the wall) click onto the wall, the workshop lights and the ceiling rack hang from the ceiling, the wheel stops lie on the floor. Translated into all 7 languages; the house import and export know every piece and the new finishes.
  - The show house *Musterhaus – alles drin* has them all (329 devices): the garage with a blue estate car, a workbench, a shelf and a bike on the wall, a pegboard in the basement workshop, and a new yard at the front with three carports, cars, motorhomes, a caravan, a trailer, a workshop corner and a saloon on the car lift.
  - New module `garage.js` (pure geometry, unit tests `tests/garage.test.mjs`: real sizes, the wheels on the ground, the windows on the outside of the bodies, the lights). New building block for the pieces: a side profile drawn across a width (`prof` in `shapes.js`, drawn by `models.js`), so the bodies of the cars and campers have sloping bonnets, windscreens and wheel arches. Browser test part `18_garage`.

## [3.89.0] - 2026-10-16
### Added
- **"Aufeinander" also with one floor open** (#396): the View menu now offers **Aufeinander** when only one floor is open too (*Auseinander* stays in the whole-house view). The open floor then sits on a ceiling right on the dimmed floor below, without the gap, and the names, value labels, balls and offline signs of the floors below stay in their rooms instead of floating over the open floor. It is the same choice as in the whole-house view (⚙ now *Abstand der Etagen*: small gap / pulled apart, whole house only / stacked), also as a start value per user in the users dialog. New lock in the users dialog: **"Abstand der Etagen (Auseinander / Aufeinander)"** hides the two buttons for that user, so the look stays as set (`floorGap`, also known to the add-on).
### Fixed
- **Lags on the iPad with the show house** (#394): measured with the show house *Musterhaus – alles drin* (274 devices), a frame needed about **3,700 draw calls**, because every part of a built-in model was its own mesh (a back bar has 133 parts, a wine fridge 85). A desktop takes that easily, Safari on an iPad does not. The parts of a model that look the same are now joined into one mesh (new module `meshmerge.js`, unit tests `tests/meshmerge.test.mjs`): the devices, the walls with the fixed parts of their doors and windows, and the stairs. The whole show house now needs about **1,250 draw calls**, with exactly the same shape (the same 129,285 triangles; screenshots of old and new look the same). What changes with the state stays apart: lit parts, LED zones, door leaves, window panes, roller shutters, the backlight of a TV. On a tablet (low-power mode) the text labels are drawn at half the sharpness: 256 kB of graphics memory per label instead of 1 MB, and a new value reaches the graphics chip four times faster (`labelRes` in `labels.js`). The browser test checks the draw calls of the show house (part `14_showcase`) and the labels on a tablet (part `07_tablet`).
- **README: the release badge showed "Unable to select next GitHub token from pool"** (#395): an error of shields.io, whose GitHub tokens had run out. The badge now reads the version from `floorplan3d/config.yaml` (a plain file, no GitHub API).

## [3.88.0] - 2026-10-16
### Added
- **Floors stacked like a real house** in the whole-house view: the View menu has a new button **Aufeinander** (stack) next to **Auseinander** (pull apart). The floors then sit on each other without a gap: a ceiling fills the space between the top of the walls and the floor above (storey height minus wall height: 40 cm with the usual 2.6 m walls), in the outline of the floor above, with its stairwells and floor openings left open; the walls under the roof reach up to the roof (not those of a garage beside the house, nor a parapet). A second tap goes back to the usual view; *Auseinander* and *Aufeinander* take over from each other. The choice is kept: new setting **Etagen im ganzen Haus** in ⚙ (small gap / pulled apart / stacked), also a start value per user or tablet in the users dialog. The tap balls, value labels, room names and offline signs of a floor that lies under another one now **stay inside its rooms**: they no longer float over the floor above (where they looked as if they belonged to it); you see them where you look into that floor (walls sunk or see-through) and the ceiling hides them otherwise. A roller shutter's ball, a value label or an offline sign that would reach through the ceiling moves down into the room (an offline sign then hangs under its lamp). New module `housefloors.js` (the rules, unit tests `tests/housefloors.test.mjs`), the ceiling is built in `floorbuild.js`. Translated into all 7 languages; the browser test part `09_floors` checks it.
### Fixed
- **A floor below the open one looked like a black hole in the lawn** (#391): with the earth on, the outline of the house is cut out of the lawn (without a basement the whole house, with one the basement), and that cut-out had no bottom. Open the upper floor of a house without a basement: through the dimmed ground floor below you looked into the empty background; in the whole-house view the solid ground floor covered it. The house now stands on ground there (a floor slab just under the lawn, with a basement at the bottom of its pit), so a dimmed or hidden floor below looks like a floor (`padLevel` in `earth.js`, unit test).
- **Whole-house view: only the floor opened last showed the states of its devices** (#392): the live states went only to the floor opened last and the floors below it, and those below counted as dimmed: their lamps had no tap balls, and the floors above it stayed dark (no glow, no balls, value labels stayed "…"). Now every floor shows them (`liveFloors` in `housefloors.js`, unit test; browser test part `09_floors`).

## [3.87.0] - 2026-10-16
### Added
- **Wall TV on a swivel arm** (new piece *Wall TV on swivel arm*, group Living, search word *schwenkarm*): the TV hangs on an articulated wall bracket and stands off the wall: you see the wall plate, the two folding arms and the joint behind the TV. In the side panel: its **size** (43, 50, 55, 65, 75 or 85 inch), **swing** (up to 80° either way; + turns the screen to the right seen from the front), **distance from the wall** (8 to 80 cm, 15 cm to start with) and **tilt** (up to 15°, + tips it down). Swung or tilted, the arm pulls the TV out as far as it needs so that it never touches the wall; the side panel then says how far it stands off. Like the other TVs it has the **backlight** (LED behind the TV, its own light from Home Assistant), which turns with it. It clicks onto the wall when placed; the 2D plan draws it as wide as its size. Saved with the piece (`tvSize`, `armSwing`, `armReach`, `armTilt`, also in the house import and export). New module `tvmount.js` (pure geometry, unit tests `tests/tvmount.test.mjs`: nothing of the TV goes into the wall in any size, swing and tilt).
- **Air conditioners and fans** in a new library group **Climate & air**: air conditioner (split indoor unit on the wall), outdoor unit / heat pump, portable air conditioner with its exhaust hose, ceiling cassette, ceiling fan with light, standing fan, tower fan, air purifier and dehumidifier. An air conditioner's **air outlet turns blue while it cools and red while it heats** (like a radiator): on a thermostat entity (`climate.*`) it follows its mode, on a plain switch it cools while it is on. Its display glows while it runs, now also while it only dries or fans (`dry`, `fan_only`, hvac action `drying` / `fan`). The ceiling fan's light is an LED zone of its own: link the fan to the fan entity and the light to its light (or it follows the fan). Translated into all 7 languages; the show house has all of them and the TV on its arm (274 devices). The browser test part `17_tvarm_climate` checks the new group, the arm's fields, the turned TV, the outlet's colours and the fan's light.

## [3.86.0] - 2026-10-16
### Added
- **The gaming PC desk in six monitor layouts**: select the desk (now called *Gaming PC desk*) and choose under **"Arrangement"** in the side panel: 2 monitors side by side (as before), 1 monitor, 3 monitors side by side (the outer ones turned in), 4 monitors (2 × 2 on a monitor arm), a curved ultrawide monitor, or the curved one with two upright (portrait) monitors beside it. The desk grows to 1.8 m where three monitors or the curved one with two upright need it, also in the 2D plan; the size fields follow the layout. Saved with the piece (`variant`, also in the house import and export); new is a general way for a piece to be built in variants (`variants` in `leisure.js`, `variantOf` in `scandi.js`).
- **The big LED mirrors have two LED zones**: the mirror wall with LED (fitness) and the full-length mirror with LED (hall) have the light behind them and two frosted light bands in front, left and right; under "Link the LEDs one by one" each gets its own light, or both follow the mirror's light.

## [3.85.0] - 2026-10-16
### Added
- **About 60 new 3D pieces for sauna, fitness, bar, home cinema, the PC corner and mirrors with LED light**, with four new library groups. **Sauna & wellness**: sauna with a glass front (benches, heater with stones, LED under the bench and behind the backrest), small sauna, infrared cabin, barrel sauna for the garden, sauna heater, hot tub with LED under the water, cold plunge tub, relaxing lounger, bucket shower. **Fitness**: treadmill, exercise bike, indoor cycle, rowing machine, cross trainer, weight bench with barbell, power rack, cable station, dumbbell rack, punching bag, kettlebells, exercise ball, yoga mat, gym flooring, wall bars, mirror wall with LED. **Bar**: bar counter with LED (straight and round the corner), back bar with bottles and LED shelves, bar stool with backrest, high table, wine fridge, drinks fridge, beer tap with a lit medallion, neon sign (cocktail glass), dartboard, pool table with its lamp, table football. **Home cinema**: fixed frame screen, motorised screen, ceiling projector, cinema seat and a row of three (LED cup holders and floor light), popcorn machine, floor-standing speaker, subwoofer, acoustic slat panel, LED starry sky for the ceiling. **PC** (group Office): PC tower, gaming PC with a glass side and RGB fans, PC desk with two monitors, keyboard and tower, laptop, gaming chair, network cabinet. **Mirrors with LED light**: mirror with indirect LED, round LED mirror, full-length mirror with LED (hall), LED mirror with 3 zones, Hollywood mirror with bulbs, mirror cabinet with LED. What lights up follows the linked entity: the sauna's stones glow orange while it heats, a screen turns bright while the projector or media player plays, a PC shows its RGB colour, displays and LED strips light in the light's colour. Most pieces have a finish in the side panel (saunas in spruce, hemlock, cedar or thermowood; fitness frames, bar fronts, leather colours …). Wall pieces (mirrors, screens, the neon sign, the dartboard, wall bars …) click onto the wall when placed, also the deeper ones with their back on the wall face; the projector, the pool table lamp and the star sky hang from the ceiling.
- **LED zones: a mirror (or the bar) with several LEDs, each linked to its own light.** The LED mirror with 3 zones (behind it, the frosted bands in front, the light underneath), the Hollywood mirror (bulbs, behind), the mirror cabinet (light bar on top, light underneath) and the bar counters (counter edge, plinth) have LED zones. In the side panel under **"Link the LEDs one by one"** every zone gets its own light or switch from Home Assistant; an empty zone follows the device's entity, so a mirror with one light needs nothing more. In 3D every zone lights in its own light's colour (while editing, a zone that is off shows its own soft colour, like the sections of an LED ring), every zone with its own light lights the room, and in the live mode the card has one button per zone with its own controls and "All LEDs" on / off. The offline list, the device overview, the warnings and a double click (switches all zones) know the zones too.
- New modules `leisure.js` (the pieces as pure geometry, unit tests `tests/leisure.test.mjs`), `ledzones.js` (LED zones, unit tests `tests/ledzones.test.mjs`) and `shapes.js` (the building blocks shared with `scandi.js`). Translated into all 7 languages. The house import and export (JSON) know the new pieces and the zones' entities (`leds`), and the show house *Musterhaus – alles drin* has every new piece: a new basement wing with sauna & wellness, home cinema, fitness and bar, LED mirrors upstairs, barrel sauna, hot tub and pool bar in the garden (264 devices). The browser test part `16_leisure` checks the library, a placed sauna and the LED zones.

## [3.84.0] - 2026-10-15
### Added
- **Over 50 new pieces of furniture in the style of the well-known Scandinavian flat-pack classics**: the library grows from about 95 to about 145 pieces. **Living**: cube shelves 2×2, 2×4, 4×4 and 4×1 (with fabric boxes, a door and books), the tall white bookcase (open or with glass doors), a pine shelving unit, a glass-door cabinet, a TV bench, the simple coffee and side table, the swing armchair with a bent birch frame, a wing chair, a compact sofa, a three-seat sofa with loose cushions, a sofa with chaise longue, a round rug, a round pedestal dining table, a wooden dining table, a spindle-back chair and a shell chair. **Kitchen**: utility cart, step stool. **Bedroom**: bed with high headboard, pine bed, chests of 6 and 3 drawers, bedside table, wardrobe with 2 doors, wardrobe with sliding doors (one with a mirror), clothes rack. **Office**: desk with drawers, compact desk, sit/stand desk, drawer unit on castors, high-back office chair. **Bath**: wash-stand with cabinet, tall bathroom cabinet, bamboo shelf. **Lighting**: paper floor lamp, arc lamp, table lamp, paper pendant and metal pendant; they light the room like every other lamp. **Decor**: indoor palm. Two new library groups: **Kids** (loft bed, toy storage with boxes, kids table with chairs, high chair, plush shark) and **Entrance** (shoe cabinet, coat stand, bench with shoe storage, floor mirror). They are our own simple models with the real sizes of such pieces (for example the cube shelf 77 × 77 × 39 cm, the bookcase 80 × 202 × 28 cm, the wardrobe 236 cm high), no files of any shop; the names of the shop's pieces (*kallax*, *billy*, *malm*, *pax*, *poäng*, *blåhaj* …) work as search words. Most pieces have a **finish** in the side panel (*Ausführung*: white, black-brown, oak, birch, pine, walnut, grey; the sofas and armchairs in fabric colours), saved with the piece. The 2D plan draws them in their real size, and the wall stop knows them. New module `scandi.js`: every piece is pure geometry (a list of boxes, cylinders and balls; unit tests `tests/scandi.test.mjs`: real sizes, standing on the floor, centred, footprint, finishes, lamps glow); `models.js` turns the parts into meshes, `plan2d.js` takes the footprint from them, `props.js` shows the finish. Translated into all 7 languages. The browser test part `02_tools` checks the library search, the new groups, a placed piece and its finish. The house import and export (JSON) know the new pieces and their `finish` (`importer.py` reads them from `scandi.js`, schema `property.schema.json`), and the show house *Musterhaus – alles drin* now has every one of them (200 devices).

## [3.83.2] - 2026-10-15
### Fixed
- **Camera still images and the live video were cut off: only the first piece came through** (#385): the add-on read the answer from Home Assistant with a call that gives only what has arrived so far (`content.read(n)` in aiohttp), not the whole answer. Through the Supervisor a still image or a piece of the live video arrives in several pieces, so only the first one was passed on: the add-on log showed almost every picture and video piece with exactly the same size (101418 or 7296 bytes). A cut picture shows black or partly grey, which was very likely also the cause of the black still images in #381. A cut video piece cannot be played, so the camera card stayed at *Live-Bild wird verbunden …* and then fell back to still images. The add-on now reads every answer to its end (`read_all` in `server.py`; a still image or video piece over the limit is refused, never cut). A new server test sends a 300 KB picture and video piece slowly in pieces (before the fix only the first 40 KB came through). The stand-in Home Assistant of the browser test now sends its still image and video pieces in two parts with a pause, as the Supervisor does, so part `09_floors` would catch this too.

## [3.83.1] - 2026-10-15
### Fixed
- **The camera card shows the live video now (it stayed black in 3.83.0)** (#383): 3.83.0 fetched Home Assistant's MJPEG stream for the camera card. Between the add-on and Home Assistant sits the Supervisor, and it passes an answer on only when it is complete. An MJPEG stream never ends, so not a single picture arrived: the card stayed dark with the badge *Standbild*. Worse, the Supervisor kept each of these streams open for 5 minutes, so the camera had to serve extra streams in the background (cameras allow only a few at once, which could also break the still images). The browser test did not notice, because its stand-in Home Assistant had no Supervisor in between. The card now plays Home Assistant's own **HLS stream** of the camera, the same one its live view shows: the add-on asks Home Assistant for it (websocket `camera/stream`, new API `/api/camera/<entity>/hls`) and passes its playlists and video pieces through (`/api/hls/<token>/...`, only Home Assistant's own file names). Each of them is a complete answer, so they come through the Supervisor. Home Assistant runs one such stream per camera for every viewer, so there is no extra load per viewer. The video is played by **hls.js** (vendored in `vendor/hls.light.module.min.js`, Apache 2.0, loaded only when a camera card opens), or by the browser itself where it plays HLS (Safari). The badge works as before (*LIVE*, *Live-Bild wird verbunden …*, *Standbild*). A camera without a stream in Home Assistant shows still images at once. A card drawn anew (for example when the motion sensor changes) keeps its running video, and the video stops when the card is closed or the page is hidden. The MJPEG route `/api/camera/<entity>/live` and `mjpeg.js` are gone. New module `camlive.js` (rules in `liveNext`, `playWay`, `HLS_CONFIG`, unit tests `tests/camlive.test.mjs`), server tests in `tests/test_server.py`. The stand-in Home Assistant of the browser test now answers `camera/stream` and serves a small HLS test video (`tests/e2e/hls`), and part `09_floors` checks that the video really plays through the add-on, stays when the card is drawn anew, stops when it closes, and that a camera without a stream gets still images.

## [3.83.0] - 2026-10-15
### Fixed
- **The camera card shows the camera live instead of a black still image** (#381): in live mode a tap on a camera opened its card with a picture that was often completely black, or smeared and only renewed every 5 seconds. The card did not show a stream at all, only a still image; for cameras such as a Tapo C425 with the *HD Stream (Direct)* entity every still image starts the camera's stream anew and takes its very first picture, which is usually black. The card now shows the camera **live**: the add-on passes Home Assistant's MJPEG stream through (new API `/api/camera/<entity>/live`, the same stream Home Assistant's own cards use) and the page shows its pictures one after the other. A small badge in the picture says *LIVE* (red dot), *Live-Bild wird verbunden …* while it connects, or *Standbild* when a camera has no working stream: then the card falls back to the still images as before (and tries live again after 5 minutes). The stream only runs while the card is open and the page is visible; at most 4 live pictures run at the same time, and a stream ends after 10 minutes (the page then connects again by itself). A tap on the picture still opens Home Assistant's live view. Home Assistant's ingress drops the *boundary* of an MJPEG stream (and would compress it), so a plain picture could not show it there: the add-on sends the bytes unchanged and the new module `mjpeg.js` cuts them into pictures (unit tests `tests/mjpeg.test.mjs`); when to connect again or fall back is `liveNext` in `cameras.js` (unit tests). Server tests in `tests/test_server.py`; the browser test part `09_floors` checks that the picture runs and stops when the card is closed. The room panel and the cameras overview keep their still images (many cameras at once would mean many streams).

## [3.82.0] - 2026-10-15
### Added
- **The power editor has its own tab for the bookkeeping: which sensor is what and how it is counted** (#378): the new button **⚡ Rechnung** next to *Kabel* (it shows while the power editor is on) opens a window in which you set which Home Assistant sensor measures what, so the power overview at the top left (also in live mode) adds up. **Netz**: one sensor (plus = drawn, minus = fed in) or two separate ones for drawn and fed in, and *Vorzeichen umdrehen* for a meter that counts the other way round. **Erzeugung**: one or more solar sensors, added up. **Batterie**: the charge level and one sensor (plus = charging) or two for charging and discharging, its sign, and whether the battery counts in the house consumption (off for a hybrid inverter whose production sensor already includes it). **Hausverbrauch**: calculated (production + drawn − fed in + discharging − charging) or a sensor of its own, which is then shown and compared with the calculation. **Räume**: which sensors (smart plugs, sub-meters) measure what each room uses; *Vorschlagen* takes the sensors in watts from the room's Home Assistant area or placed in the room; what no room accounts for is the rest. At the top the window shows the calculation line by line with the values of now, and what does not add up: a consumption below zero (*Vorzeichen am Netz / der Batterie umdrehen* fixes it with one click), a house sensor far from the calculation, rooms that use more than the house, a sensor counted twice. What is not set comes from the power devices of the plan as before. Everything is saved with the house (`energy` in the plan) and follows renamed entities; the overview's tooltip lists the rooms and the rest. The rules are in the new module `energycalc.js` (unit tests `tests/energycalc.test.mjs`), the window in `energyui.js`; the new browser test part `15_energy` checks it.

### Fixed
- **The power overview counts the battery in the consumption** (#379): the overview at the top left calculated the consumption as production + grid and left the battery out, so a charging battery made the consumption too high and a discharging one too low. It is now production + drawn − fed in + discharging − charging. A battery whose sensor only tells *charging* / *discharging* as text now shows its arrow (↑ / ↓) in the overview; before, it showed none.

## [3.81.0] - 2026-10-14
### Added
- **Heaters show only their temperature, red while they heat, blue while they do not** (#374): a radiator, towel radiator or *Heizung* (thermostat) linked to an entity no longer gets the big round tap ball with a thermometer in live mode. It only shows its value pill with the temperature, which is red while the heater heats and blue while it does not (idle, off, cooling); a tap on the temperature opens its card as the ball did. With value labels switched off (*Werte-Schilder: keine*) the heater keeps its ball. Rules in the new module `heating.js` (`isHeater`, `heatMode`, `pillTone`, unit tests `tests/heating.test.mjs`), the pill colours in `labels.js`, the tap target on the pill (`pillFinger`) in `floorbuild.js`.
- **A button to the thermostat in Home Assistant in the heating panel** (#374): each thermostat in the heating panel next to the room panel has the button *ⓘ In Home Assistant öffnen*, which opens Home Assistant's own dialog of the entity (history, settings), like *Details* on the live card. As there, it only shows when the add-on runs inside Home Assistant (side bar or dashboard card). `heatpanel.js` (unit test), checked by the browser test part `06_ledring`.
- **Doors and windows with a sensor have a green frame while they are shut** (#375): until now you could not see which doors and windows have a contact sensor. Shut, their frame is now green; open they stay red as before; when their sensor does not report (unavailable, unknown, gone), the frame is amber. `contactLook` and `partHex` in `openings.js` (unit tests).
- **Device overview with battery levels** (#376): the new button **📋 Geräte** at the top shows and hides a list of every placed device that is linked to Home Assistant and every door / window with a sensor or roller shutter, by floor and room, each with its state, its **battery level** and whether it is offline. The battery comes from the battery sensor of the same device in Home Assistant (a sensor with `device_class: battery`, or a "battery low" binary sensor; the add-on reads Home Assistant's entity registry for it, `battery_of` in `renames.py`, new API `/api/batteries`) or from the battery level a device reports itself (a robot vacuum, `bat` in the slim state). Filters: *Alle*, *🔋 Batterie* (the emptiest first) and *⚠ Offline*; a battery at or under 20 % is red, and the button shows how many are low (🪫 n). A tap on a device shows it in the plan (on a phone the list closes). On phones the button sits in the 📊 list. New module `devicelist.js` (unit tests `tests/devicelist.test.mjs`), server tests in `tests/test_renames.py` and `tests/test_server.py`; the browser test part `07_tablet` checks it with a smoke alarm and its battery sensor in the stand-in Home Assistant.
- **Offline things are marked in 3D** (#375): everything the offline list names (an entity that is unavailable, unknown or gone, or a lamp / smart device linked to nothing) now also shows a small ball with a crossed-out lightning bolt in the 3D view, red when offline, amber when linked to nothing, over the device (on its value pill if it has one) or in the middle of the door / window. In live mode a device with a tap ball shows the sign on its ball instead. New module `offlinemarks.js` (unit tests `tests/offlinemarks.test.mjs`); the browser test part `07_tablet` checks the signs and the frame colours.

### Fixed
- **A heating turns red while it heats** (#374): the *Heizung* (thermostat) model only lit its little light in the corner while it heated, the radiator itself stayed white; the *Heizkörper* (radiator) and towel radiator only got a pale orange glow on their white paint. Now the whole radiator turns clearly red while it heats and a cool blue while it does not, also in the hologram theme (`paintHeat` in `heating.js`); the browser test part `04_lights` checks both models.

## [3.80.0] - 2026-10-13
### Added
- **A kitchen run can do without the wall cabinet above single modules** (#372): until now the tick *Oberschränke* (wall cabinets) switched the wall cabinets of the whole run on or off. Now every row of the module list has its own tick: without it, that module is only the base cabinet with the worktop (above the stove: no hood). The tick sits next to the width; modules that never have a wall cabinet (fridge, tall cabinet, gap) have none. The tick at the top stays the main switch for the whole run. The module keeps the setting when its type, width or place changes, and the import format keeps it too (`{"m": "base", "up": false}`, docs/IMPORT.md). The rules are in `kitchen.js` (`withUpper`, `hasUpper`, unit tests), the tick in `kitchenui.js`; the browser test part `05_power` checks it.

## [3.79.2] - 2026-10-13
### Fixed
- **The child lock of a thermostat shows with the heating, not among the room's switches** (#370): a thermostat brings further entities along in Home Assistant, such as its child lock, window detection or valve detection. They were listed in the room panel under *Switches* next to the light switches. Home Assistant knows which entities belong to the same device (the entity registry the add-on already reads); the add-on now remembers which entity belongs to a thermostat's device (`climate_parts` in `renames.py`, `parts` in `/api/areas`), and the room panel shows those entities in the heating panel under their thermostat (switches as slide switches, values as text; `splitHeatParts` and `partName` in `heatpanel.js`, with unit tests). If the thermostat is not in that room, they stay in the room's list.

## [3.79.1] - 2026-10-13
### Fixed
- **The room panel no longer lists the side entities of a device** (#368): a room linked to a Home Assistant area showed under *Sensors* every entity of the area, also the diagnostic ones of its devices; for a Tasmota relay that is its last restart time, MQTT and WiFi connect counts, restart reason, SSID, IP address, firmware and signal, although only its switch is used. Home Assistant marks such entities as diagnostic or configuration (`entity_category`) and keeps them off its own dashboards; the add-on now does the same in the room panel, in the room's entity list and when placing a whole area, and also leaves out entities hidden in Home Assistant. The add-on already reads Home Assistant's entity registry (for renamed entities), it now also remembers these entities (`side_entities` in `renames.py`); `/api/areas` lists them under `side` instead of `entities` (`area_list` in `server.py`), so the entity picker still sorts them into their area (`areaIndex` in `livechannel.js`). Unit tests in `tests/test_renames.py`, `tests/test_server.py` and `tests/livechannel.test.mjs`.

## [3.79.0] - 2026-10-13
### Added
- **Lamps on a relay light the floor, and every lamp can have its own light colour** (#367): a lamp that is only switched on and off, e.g. by a relay (a `switch.…` entity on a ceiling light, pendant, spot, wall lamp, floor lamp, LED strip ...), only lit the floor with 60 % of the reach of a light entity, always in the default light colour, and its tap ball showed a plug. Now it lights the floor like any lamp and its ball shows a light bulb. As a relay does not tell the lamp's colour, the side panel of a lamp has the new field **Lichtfarbe** (light colour, `lightColor`): the floor, the lamp and its ball glow in it, e.g. cool white instead of warm white; a lamp that reports a colour itself keeps using that, ↺ goes back to the default light colour of the settings; the import format keeps it too (`lightColor`, docs/IMPORT.md). A lamp just outside its room's outline (up to 30 cm, on the wall, not in another room) now lights the room too; before, it did not light the floor at all. The rules are in the new module `lamplight.js` (moved out of `app.js`, unit tests `tests/lamplight.test.mjs`); the browser test part `04_lights` checks a lamp on a relay.

### Fixed
- **A TV with nothing but a backlight can no longer be tapped in live mode** (#364): a TV (or wall TV) whose own entity was empty but whose backlight (the LED behind the TV) was linked got a tap ball (a grey light bulb) and could be tapped, and its card only said *No entity linked*, without any button. What is linked to nothing has no ball and takes no tap (#130), and the backlight alone no longer counts as a link of the TV: its card only shows the TV itself. The backlight is still a light of the room: it shines, and it is listed in the room panel and under *Whole room*. `linkedDevice` in `pickrules.js` is now the one rule for the tap and the ball (`wantsBall` in `tapballs.js`), with unit tests; the browser test part `04_lights` checks such a TV.
- **A switch shows a light switch on its tap ball, not a plug** (#366): every `switch.…` entity got a plug 🔌 on its ball in live mode, also a wall switch or a relay. There is no emoji for a light switch, so the ball now draws one (a white plate with a rocker). Only a switch that Home Assistant reports as an outlet (`device_class: outlet`) keeps the plug; a device type with its own icon (a washing machine, a wallbox ...) keeps it too. `ballIcon` in `tapballs.js` (unit tests); the browser test part `11_live` checks a switch.

## [3.78.3] - 2026-10-12
### Fixed
- **The door of a closet inside a room belongs to the room** (#362): a room whose outline takes in a small closet (here a closet under the stairs off the kitchen) has the closet's wall and door inside it, not on its edge. When the room was chosen, that wall and its door were missing in 3D, the object list showed the door under *No room* and the room panel did not list its contact: a door only counted for a room when its middle was within 35 cm of the room's edge (inside the room only for dormer windows), and a chosen room only kept the walls within 30 cm of its edge. Now doors, windows and walls inside the room's outline belong to it too, as the list of open doors and windows already counted them. `roomOpenings` in `roompanel.js`, `clipWallToRoom` in `roomclip.js` (unit tests); the browser test part `11_live` checks a closet wall with its door in a chosen room.

## [3.78.2] - 2026-10-12
### Fixed
- **A tap right after the camera moved no longer misses** (#360): when the camera jumped (going into a room, the start view, a test), a tap or click before the next frame was drawn aimed with the camera's old direction and could hit nothing or the wrong thing. The camera's world matrix is now renewed before the ray of a tap is built (`picking.js`). On a slow machine this made the browser test check *in 3D the roof is picked* (part `10_roofs`) fail now and then; the check now moves the camera and picks in one step, so it always tests this case.

## [3.78.1] - 2026-10-12
### Fixed
- **A chosen room no longer shows devices of the room behind the wall** (#358): when a room is chosen (tapped in live mode, from the room menu, a room tablet or the dashboard card), only that room is drawn, but devices of the neighbouring room that stood just behind a wall the two rooms share showed up in it too. The room kept every device within 30 cm of its edge, meant for wall lamps on its own wall. Now a device outside the room but close to its edge only belongs to it when it does not stand inside another room of the floor; a wall lamp on an outer wall stays, and walls, doors and windows are kept as before. This matches the room panel, which already listed only the devices inside the room. `deviceInIso` in `roomclip.js` (unit test); the browser test part `11_live` checks two rooms side by side.

## [3.78.0] - 2026-10-12
### Added
- **Dashboard card: only one room in 3D, or only the room's controls as a card of their own** (#356): with a room chosen, the card used to zoom into it and open the room panel over it, and in a dashboard card the panel covered most of the room. The new card option `view` (*Show* in the visual editor) works together with `room`: `room` shows only that room in 3D and never leaves it (no room panel over it, a tap into the room does not go back to the floor, no bar at the top, no search, no warning banner that jumps elsewhere; after the idle time the camera goes back to the room); `panel` shows only the room panel of that room, filling the card, with the heating inside it and without a close button, and no 3D picture behind it (nothing is drawn, which saves power). Put the two side by side to see the room and its controls at the same time. Without a room the card says to choose one; with an add-on older than 3.78.0 it says to update the add-on. The option *Room panel* in *Shown in the card* now says that it also covers the room tablet start (switch it off for the 3D view of a room without the panel). `view` in `cardmode.js` (unit tests), `alone()` in `roompanel.js`, `needsNewer` in `dist/floorplan3d-card.js` (unit tests); the browser test part `13_card` checks both views. In HACS: update the card to 3.78.0, then reload the browser.

## [3.77.1] - 2026-10-11
### Fixed
- **Dashboard card: "add-on not found" on Home Assistant 2026.2 and newer** (#352): the card finds the add-on through its sidebar panel, and since Home Assistant 2026.2 the panel names its add-on in `config.addon` instead of `config.ingress`, so the card (and the preview in its editor) said *The 3D Floorplan add-on was not found* although the add-on was running. The card now reads both. When the add-on is not in the sidebar and the repository was added under another address, an administrator's card also looks in the list of installed add-ons. The message names the add-on names it tried and says *Settings → Apps* (the new name of Add-ons). `slugs` and `slugsFromList` in `dist/floorplan3d-card.js` (unit tests); the browser test uses the new panel format and the list. In HACS: update the card to 3.77.1, then reload the browser.

## [3.77.0] - 2026-10-11
### Added
- **Example: show house with everything in it**: the import dialog has a third example, *Example: show house (everything in it)* (`examples/showcase.json`, also in `docs/examples/` and through `GET /api/import/examples/showcase`). One house that uses every part of the JSON format: all 93 device types, all 14 kinds of doors and windows (with roller shutters, window sensors per pane, own sizes), all five kinds of stairs (U over two floors, L, straight, spiral, wall stair with landing), a basement with explicit walls, a ground floor with its own outline (garage), an upper floor with a roof terrace, a void over the living room and a gallery, a gable roof with a step in the eaves, three kinds of dormers and solar panels, a garden house with its own hip roof, power cables from the house connection over meter, fuse box, inverter and battery to the wallbox, a kitchen run, Nanoleaf, LED ring, and a garden with pool, bridge and ground-mounted solar panels. A unit test makes sure the example keeps using every device type, opening preset and stair type, and a new browser test part `14_showcase` imports it through the dialog.

### Fixed
- **JSON import** (#353): a room with `"terrace": true` (roof terrace) no longer gets walls along its open sides, only where it meets an ordinary room; things on the floor of kind `roof` (solar panels on the roof, a loft's rooms) are now imported and exported instead of silently dropped; the base box of a roof and of further roofs moves with `building.origin` like the rooms; the import schema (`/api/import/schema`, also used by *Copy AI prompt*) lists all device types again (13 were missing, among them `wallbox`, `battery`, `solarpanel`, `inverter`, `kitchenrun`, `bridge`) and describes shed dormers (`shed`, `sp`) and steps in the eaves (`steps`). A test keeps the schema's device types in line with the library.

## [3.76.0] - 2026-10-11
### Changed
- **See-through: only the wall turns see-through, not its doors and windows** (#350): with *See-through* on (View menu or ⚙), the walls facing the camera fade while you turn the camera, and with them their windows (frame, glass, roller shutter) and doors (frame, leaf), so these almost disappeared. Now only the wall itself fades; doors and windows keep their normal look, and the furniture behind the wall stays solid as before. `fadesWithWall` in `cutaway.js` (unit test); the browser test checks a wall with a door and a window and a sofa behind it.

## [3.75.1] - 2026-10-11
### Fixed
- **The dashboard card is installed by HACS again** (#348): HACS downloaded only the demo file and not the card, so a dashboard said *Custom element doesn't exist: floorplan3d-card* (and `/hacsfiles/HA-Floorplanner/floorplan3d-card.js` gave 404). Once a release has files attached, HACS downloads only those, and every release had just the demo attached. Now every release also carries `floorplan3d-card.js`, attached when the release is created (before it is published), and the release workflow adds it to the newest release when it is missing. In HACS: update the card to 3.75.1 (or ⋮ → *Redownload*), then reload the browser.

## [3.75.0] - 2026-10-11
### Added
- **Dashboard card: the 3D floor plan on any Home Assistant dashboard** (#13): the new Lovelace card `custom:floorplan3d-card` shows the live 3D view of the add-on in a dashboard, without editing; a tap on a device controls it as in the add-on (the live card, the room panel, Home Assistant's own details dialog). Install it through **HACS** (add this repository as a custom repository of the type *Dashboard*, the card is then loaded by itself) or by hand (`dist/floorplan3d-card.js` into `/config/www`, resource `/local/floorplan3d-card.js`). The card finds the add-on by itself (its sidebar panel, else the usual names; option `addon` for anything else), opens it through Home Assistant Ingress like the sidebar panel does and keeps the Ingress session alive. Options, all optional and in the visual editor too (floors, rooms and houses as drop-downs from the add-on): `floor` (a name, a number with 0 = ground floor and -1 = basement, or `house` for the whole house), `room`, `house`, `title`, `height` (or `fill` for the whole screen; in a sections dashboard the card takes the size of its cell), `theme` (`auto` follows the dark / light mode of Home Assistant, or `dark`, `light`, `holo`), `quality` (`low` / `high`), `walls` (`auto`, `see_through`, `low`, `full`), `labels`, `heatmap` (`temp`, `humid`, `co2`), `alerts`, `idle_return` (minutes, back to the card's floor), `night` (`off`, `sun`, `time`), `room_panel`, `show_nav` and `show_bar` (leave out the bars over the house). The card says what is wrong when the add-on is missing, stopped or too old. The look of a card applies to its screen only and is never saved as everybody's settings.
- In the add-on, `?card=1` opens the page the way the card needs it: live view without editing bars, the card's options from the address. New module `cardmode.js` (unit tests); the card's look goes through the user presets (`viewprefs.js`, `CARD_FIELDS`), a card without room panel tells `roompanel.js` not to open it. In a low card the colour scale of the room colouring sits at the top, clear of the compass. The card itself is `dist/floorplan3d-card.js` (one file without build step, unit tests `tests/card.test.mjs`), `hacs.json` makes the repository a HACS dashboard repository. New browser test part `13_card` (the card on a stand-in dashboard with the real add-on page in it).

## [3.74.0] - 2026-10-11
### Added
- **A shed dormer goes flush up to the edge of the roof** (#345): a shed or flat dormer on a gable roof could not reach the gable: it always kept a gap to the edge of the roof. Now it stays between the gable walls, and with *Distance from the gable* 0 (or the slider at the end) its front wall, side wall and roof go flush up to the edge of the roof, so the gable of the roof and the side of the dormer are one face. The same at the other end, and at both ends for a dormer as long as the house. A gable dormer and dormers on a hip roof keep their gap. `fitDormer` in `dormer.js` (unit tests).
- **Drag the corners of a step one by one** (#345): in the 2D plan every step in the eaves of the selected roof has two corners (circles), one on each piece. Dragging one moves the step along the ridge (at least 30 cm from the next one) and the eave of its piece out or in, in 5 cm steps (Alt: free). `cornerHandles` and `moveCorner` in `roofsteps.js` (unit tests); the browser tests drag a corner and check the flush dormer.

## [3.73.0] - 2026-10-11
### Added
- **Roof with steps: a house narrower at the front and wider at the back** (#342): the eaves of a gable or flat roof can now have steps. From a point along the ridge the eave of one side lies further out (or in) than the rest, as where a house springs out a bit. The ridge stays straight and at one height and the eave stays at the height of the walls, so where the house is wider the slope is a little flatter; at a step a small upright triangle closes the gap between the two slopes. In the 2D plan (also in 2D + 3D): click the roof on the roof floor, double click on its edge to split it there, then drag the diamond handle of a piece out or in (5 cm steps, Alt: free); a double click on a diamond removes the step again. The roof panel (*Manage floor*) has a card per step (side, from where, how far out) and *+ Step*. The walls under the roof are cut at the right slope, solar panels lie on it, and a dormer stands on the slope under its middle. A hip roof keeps its rectangle. The JSON import knows `steps` (`side`, `at`, `out`). New module `roofsteps.js` (unit tests); dormers, roof surface, wall cut (the shader now takes up to 8 slope planes, each along its own stretch), solar panels and the 2D plan use it; new browser test part `12_roofsteps`.

### Changed
- The dormer unit tests run with the other module tests (they now import `roofsteps.js`).

## [3.72.0] - 2026-10-11
### Added
- **The windows of the rooms show through a shed dormer** (#341): a long shed dormer (3.71.0) runs over several rooms, but a dormer has only one window of its own. Now every room under it can have its own window: put a door or window into the wall of the room under the dormer as usual (tool *Door/Window*). Where the dormer's front stands on such a wall (parallel, at most 25 cm in front of it or behind it), its front wall gets a hole for every door and window of that wall, so the real windows show through the dormer with frame, glass and roller shutter. They are ordinary windows: contact, open / closed, room, roller shutter, the list "n open". The dormer's own window can be switched off as before (tick *Window*). Works for every dormer type. The holes come from `frontHoles` in `dormerwin.js`, the front wall is cut around them in `dormerParts` (`dormer.js`, both with unit tests); the browser test puts a window under a shed dormer.

## [3.71.0] - 2026-10-11
### Added
- **Long shed dormer (Schleppgaube)** (#339): a dormer can now be a *shed dormer*: its front wall goes straight up and its roof runs up at its own, flatter pitch into the main roof below the ridge. This is how a part of one roof side is raised while it stays the same roof: the rooms under it are no longer cut by the slope but have straight walls. Choose *Shed dormer* as the dormer's roof in the roof panel (floor *Roof*, section *Dormers*): it is put onto the outer wall (its distance from the eave becomes the overhang) and gets a field for its pitch (15° unless set). A shed or flat dormer may be as long as the roof (a gable dormer stays at most 5 m wide). When the chosen wall height and pitch would reach above the ridge, the dormer roof gets flatter first and the wall lower only when even that is not enough; the pitch field shows what is used. The window of a shed dormer is at most 1.2 m wide, in the middle of its front.
- **Where a dormer begins** (#339): a new field *Distance from the gable* says in metres where a dormer begins (from the gable on the left or at the top of the plan), next to the slider. Changing the width keeps that start.

### Changed
- **The roof has a hole under every dormer** (#339): the slope of the main roof no longer runs through the room under a dormer (seen through the walls, in the room view and when the camera comes close); the dormer's walls and roof close the hole. Under a shed dormer the walls of the storey below reach up to its sloping roof. The JSON import knows `"type": "shed"` with `sp` (its pitch in degrees) and dormers up to 30 m long. The geometry is in `dormer.js` (`roofSurface`, `dormerStart`, `posForStart`) and `attic.js` (unit tests); the browser test picks a shed dormer in the panel.

## [3.70.1] - 2026-10-10
### Fixed
- **Live card: buttons and sliders no longer vanish under the finger** (#336): while the card of a lamp was open in the live mode, every state update of any entity of the house (power meters, temperatures ... every few seconds) drew the whole card anew. A tap on On / Off, a colour or a scene could get lost (the button was replaced between finger down and finger up), a brightness drag was cut off and an open colour picker or effect list closed. The LED ring card and the camera card did the same. Like the roller shutter card (3.70.0), the card is now drawn anew only when something it shows changes: the device, its entity's state, brightness, colour and effects, the scenes, the lights of the room, the LED ring's sections, the camera's motion, the language. While a slider is held or a slider, colour picker or effect list has the focus it is not drawn at all; what changed meanwhile shows when the slider is let go or the focus leaves the card. The key is `popupKey` in `livepopup.js` (unit tests); the browser test opens a lamp's card, changes a temperature and checks that the buttons are the same elements.

## [3.70.0] - 2026-10-10
### Changed
- **Roller shutter card like in Home Assistant** (#335): a tap on the 🪟 ball of a roller shutter in the live mode opens a card for the shutter alone, with everything at once: how far it is open in big letters, a tall slider that shows the curtain (drag it, or tap where it should go: the cover goes there when you let go), *Up* / *Stop* / *Down* beside it and the quick positions 0 / 25 / 50 / 75 / 100 % under it. A position just chosen shows at once and stays while the cover is on its way there. The card is drawn anew only when the shutter changes (not at every state update of the house, which could swallow a tap), and on phones it stays above the view buttons at the bottom (*Normal*, *Temp.* ...), which covered its lower part. New module `shuttercard.js`; the rules (position under the finger, what shows while the cover moves) are in `shutters.js` (unit tests); the browser test drags the slider and taps a quick position.

### Fixed
- **The shutter card showed the window's contact** (#335): tapping a shutter's ball also showed the window's contact sensor ("Window · Open · binary_sensor…") at the top of the card. It now shows only the shutter; the contact stays in the room panel and the "n open" list.
- **The shutter's ball hung under the window** (#335): where there was little room between the window and the ceiling, the ball sat under the window at the sill. It now always sits on top of the window, where the shutter rolls up, with the label ("↕ 40 % open") over it.

## [3.69.1] - 2026-10-10
### Fixed
- **Settings: two quick changes in a row** (#333): changing two settings quickly one after the other (e.g. the language and right after it the design) could end with the message that the settings were changed on another screen, a reload of the page and the second change lost. The second change was saved before the first save had come back, still with its old version number (ETag), and the add-on refused it. Saves now go one at a time: a change made while a save is on its way is saved right after it, and the answer of the older save no longer overwrites the newer change. `oneAtATime` in `settings.js` (unit tests).

### Changed
- **Browser test in parts, all at the same time**: the browser test (over 450 checks, about 13 minutes one after the other) is split into parts (`tests/e2e/parts/`). Every part builds the same test house first and then runs on its own, so CI runs all parts at the same time as separate jobs (a few minutes); the job `e2e` collects their results. `tests/e2e/run.sh power roofs` runs only the parts that cover a change (`--list` shows them). A change that cannot alter what the browser sees (only text, unit tests or tools) skips the browser test. The pictures the test takes are no longer kept in git.

## [3.69.0] - 2026-10-10
### Added
- **Roller shutters on every window, also in dormers** (#331): every window has a new tick "Roller shutter" in its properties. Ticked, it gets a field for the shutter's own Home Assistant entity (a cover), separate from the window's contact sensor. In 3D a curtain of slats comes down outside the glass as far as the cover is closed (its position, else open / closed) and moves up and down with it at an even speed, like a motor (all the way in about 3 s); it hangs on the side of the wall without a room, and the panes of such a window tilt inwards. A label over the window says how far it is open ("↕ 60 % open", like the value labels of devices; off with them in the settings). In the live mode a 🪟 ball at the window opens a card with up, stop, down and a slider for the position; the room panel lists the shutter under "Covers"; the 2D plan marks it outside the window (in the live mode with "↕ 60 % open"). An open shutter is no open window: only the contact counts for "n open" and the warnings. The windows of dormers have the same tick (stored on the dormer, outside is away from the ridge). Covers in the room panel now read "60 % open" instead of Home Assistant's raw state; offline shutters show in the offline list, the search finds a window by its shutter's name. The JSON import and export know `shutter` and `shutterEntity`. Logic in the new `shutters.js` (unit tests); the browser test drives it.

## [3.68.0] - 2026-10-10
### Added
- **Renamed in Home Assistant, renamed in the plan**: when an entity id changes in Home Assistant (renamed there, by Zigbee2MQTT with "update Home Assistant entity ID", or by another add-on such as the Zigbee Devices Manager), every placed device, LED ring section, TV backlight, door/window contact and cable linked to it gets the new id, in every house, as do the settings (weather entity) and `users.json`. A device whose name is still Home Assistant's name gets the new name; a name typed by hand stays. The add-on keeps its own connection to Home Assistant (also with no browser open), recognises an entity by its registry entry (integration + unique id, so deleting and creating again counts too) and catches up on renames made while it was stopped (`renames.json` in the add-on data). An open view updates its plan and its undo list at once, and a plan saved by a browser that missed the rename gets the new ids too. Logic in the new `renames.py` and `renames.js` (unit tests); the mock Home Assistant of the browser test knows the entity registry and renames.

## [3.67.1] - 2026-10-10
### Fixed
- **Empty page after an update** (#328): after the update to 3.67.0 the page could stay empty (buttons without text, no house). The browser had kept an old `modelfx.js` next to the new `app.js`, so `app.js` could not start at all. The add-on now sends `Cache-Control: no-cache` for the interface files, so the browser always checks them with the add-on (a quick "unchanged" answer when nothing changed). As a safety net, the new `bootguard.js` notices when `app.js` cannot start, fetches every file past the cache once and reloads. If that does not help, it shows a message with what to do instead of an empty page.

## [3.67.0] - 2026-10-10
### Added
- **LED ring: every section in its own colour while editing** (#325): in the edit mode each section of an LED ring is drawn in a soft colour of its own, in the 2D plan (line and number), in 3D and as a coloured edge of its box in the properties, so you can see where each section runs before giving it a light. Sections that are on keep their real light colour; the live mode looks as before. Colours in `ledring.js` (`sectionHex`, unit test); the 3D look of the ring moved from `app.js` into `modelfx.js` (`ringLook`).

## [3.66.1] - 2026-10-10
### Fixed
- **States show up at once again** (#323): a change in Home Assistant sometimes took about 30 seconds to appear. One browser that took no messages (a tablet asleep, a phone without network) held up the live channel for every other view until the heartbeat noticed it. Every browser now has its own queue and sender in `LiveHub`; one that is stuck for 5 s is dropped and reconnects with the full list. A tablet or phone waking up also fetches the states at once.

## [3.66.0] - 2026-10-09
### Added
- **Start view can be chosen** (#315): in the settings (wall tablet section) "📌 Use current view" saves the view shown now (house, floor or whole house, room, camera) as the start view for everybody; "Automatic" goes back to the old start (the user's room or the ground floor). In the users dialog every user can get their own ("Start: use current view"). The page opens with it and a wall tablet comes back to it after the idle time. Stored in `startViews` (also in users.json), `api/me` hands out the user's own or everybody's. Logic in the new `startview.js` (unit tests).
- **Security: the recorded days as a list** (#317): the backup dialog lists the recorded days, each to play (▶) or download (⬇).
### Changed
- **Backup in the top bar** (#321): the whole backup, the automatic backups and the security recording moved from the side panel into a dialog behind the new "🗄️ Backup" button; the side panel section is now just "Houses". The two security fields are now also saved when changed.
- **Security bar over the whole width** (#316): the bar with the time line now uses the whole width of the screen.
### Fixed
- **No dark floor in 3D while placing** (#320): with a drawing tool (device, stairs …) the 3D grid melted into a dark area that hid the lawn (600 fine lines over 60 m). In 3D its lines are now at least 50 cm apart and see-through; snapping still uses the grid setting.
- **Tap balls no longer cover each other** (#314): balls that land on each other on the screen (a floor lamp in front of a ceiling lamp, things behind each other seen at an angle) now move apart on the screen, every time the camera moves (`spreadScreen` in `tapballs.js`, unit tests).

## [3.65.0] - 2026-10-08
### Added
- **Sicherheit: zoom and icons on the time line**: a new 🔍 choice in the bar sets how much of the day the time line shows (24 h, 12 h, 6 h, 3 h, 1 h, 30 min, 10 min; on a computer also with the mouse wheel over the line). The line follows the playback and the times under it match the part shown. Every change is now an icon on the line (💡 light, 🚪 door, 🪟 window, 🏃 motion, 🔥 smoke, 🔒 lock, 👤 person, 🌡️ climate …), lit for "on"; events too close together share one icon with a count, so zooming in separates them. A tap on an icon jumps there; its tooltip lists what happened. The zoom chosen is remembered in the browser. Logic in `timeline.js` (`follow`, `markers`, `eventIcon`, unit tests).

## [3.64.2] - 2026-10-08
### Fixed
- **Room view: no roof floating over the room** (#306): the see-through roof over a focused room (3.55.0) is now only drawn when the roof really belongs to the room: its slope cuts the room's floor (knee wall) or a dormer sits over the room. A roof that simply sits on top of the storey below is above the ceiling and no longer floats over every room. `roofOverRoom` in `attic.js` (unit test).

## [3.64.1] - 2026-10-08
### Fixed
- **Whole house: the floor cards hide while a room is opened** (#304): tapping a room in the whole-house view zooms into it; the floor cards (rooms, lights on, windows open) no longer float in the empty space beside it. Going back to the whole house shows them again. `cardsShown` in `floorcards.js` (unit test).

## [3.64.0] - 2026-10-08
### Added
- **Security (Sicherheit)**: the add-on now records what switches in the house (lights, switches, doors and windows, covers, people, locks, climate …; sensors at most every 5 minutes) for every entity placed in a floor plan, one file per day in `addon_configs/…_floorplan3d/timeline/YYYY-MM-DD.jsonl`. The new 🛡️ *Sicherheit* button (tool bar; on phones in the ☰ menu) lists the recorded days (each file can also be downloaded) and plays a day back in the same 3D view: a bar at the bottom with play / pause, previous / next event, speed (×1 … ×3600), a slider over the day with the events as little bars, and the list of what switched when. The house shows the recorded states (lights, colours, open windows, warnings …); nothing can be switched while it is open and live changes wait until it is closed. Works on phone, tablet and computer. The recorder has its own connection to Home Assistant and only listens, so the live view and Home Assistant are not affected; writes are collected every few seconds, a day file is capped at 30 MB. *Houses & backup → Sicherheit*: switch recording off, days to keep (default 7 plus today). The users dialog can lock it for a user (also refused by the server). Recorder in `timeline.py`, playback logic in `timeline.js` (unit tests), screen in `timelineui.js`.

## [3.63.0] - 2026-10-08
### Changed
- **Phones only show the house** (#299): on a phone (touch screen, narrow or held sideways) the app always runs in the live mode and in 3D. The ☰ menu no longer offers Edit / Live, 2D and 2D + 3D or the users; switching house, „Fit“, the version and ⚙ stay. Tablets and computers are unchanged. Logic in `phonemenu.js` (`isPhoneScreen`, `phoneView`) with unit tests.

## [3.62.0] - 2026-10-08
### Added
- **Several selected things move together**: after selecting several things with Shift / Ctrl + click or a frame, dragging one of them in the 2D plan (also in the 2D + 3D view) now moves all of them by the same amount, in one undo step; they stay selected. Walls joined to a moved wall stretch along, like when one wall is dragged; doors and windows go with their wall; locked things stay. A plain click on one of them still selects just that one. Logic in `multisel.js` (`groupTargets`, `moveGroup`) with unit tests.

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
