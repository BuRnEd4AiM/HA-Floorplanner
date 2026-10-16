# 3D Floorplan

Draw your home, view it in 3D and control your devices from the floor plan.

## First steps

1. Start the add-on and open **3D Floorplan** from the sidebar.
   A new, empty house shows a **welcome card** with three ways to start: *Draw walls*, *Try the example house* (a ready-made house with plot and garden, created as a new house) and *Import a house from JSON*. The interface follows the language of your browser and starts in the dark design; both can be changed in ⚙.
2. Pick **Wall** and click your outline point by point (double-click or `Esc` finishes).
3. Pick **Door/Window** and click a wall to cut an opening.
4. Pick **Device**, choose a type and a Home Assistant entity, click the floor.
5. Switch to **Live** to try it out: tap a device to control it.

Everything is saved automatically in the add-on's `/data` folder and is part of Home Assistant backups.

## Wall tablet / kiosk

Open the add-on page with `?kiosk=1` (for example in a dashboard iframe or a kiosk browser). The editor UI is hidden, the floor plan stays interactive.

## Dashboard card

The card `custom:floorplan3d-card` shows the live 3D view of this add-on on any Home Assistant dashboard; a tap on a device controls it. Install it with HACS (custom repository `https://github.com/BuRnEd4AiM/HA-Floorplanner`, type *Dashboard*) or copy `dist/floorplan3d-card.js` from the repository to `/config/www/` and add `/local/floorplan3d-card.js` as a dashboard resource (*JavaScript module*). Then add the card **3D Floorplan** to a dashboard. Its options (floor, room, height, theme, room colours, warnings, the bars …) are in the visual editor and in the [README](https://github.com/BuRnEd4AiM/HA-Floorplanner#-dashboard-card). The card opens this add-on through Ingress, so the add-on must be running; nothing has to be set up in the add-on. A card is never an editor, also for administrators, and its look is never saved as the add-on's settings.

With a room chosen, the option **Show** (`view`) makes a card for that one room: *Only the room in 3D* (`view: room`) shows the room and never leaves it, without the room panel over it; *Only the room's controls* (`view: panel`) shows just its room panel (lights, heating, shutters, doors and windows) filling the card, without 3D. Two cards side by side give the room and its controls at the same time.

## Custom 3D models

In the device tool use **Upload GLB**. Models are scaled to fit 1 m and can be resized per device. Draco/Meshopt-compressed files are not supported yet.

## Options

| Option | Description |
| --- | --- |
| `log_level` | Log verbosity of the backend |

All other settings (language, theme, units, grid ...) live in the ⚙ dialog inside the app.

## Support

Please open an issue in the project repository and include the add-on version and browser console output.

## Who may edit (permissions)

The add-on panel is open to every Home Assistant user (`panel_admin: false`), but **only Home Assistant administrators can edit**:

- **Administrators** (owner or "Administrator" group) always get the full editor: drawing, settings, saving. The add-on asks Home Assistant who the administrators are.
- **Everyone else** (for example wall tablets or family members with a normal user) only sees the plan in **read-only live mode**: they can control lights, covers and so on, but the editor, the settings and saving are hidden and also blocked in the backend (HTTP 403).
- **Extra editors:** to let a non-admin user edit as well, add the login name to the add-on **Configuration**:

  ```yaml
  editors:
    - admin
  ```

  Use the login name (Settings → People → Users). Leave the list empty if only administrators may edit.
- If the administrators cannot be read (the add-on then shows "Editing locked" in the status line), add your own user to `editors` as above. Everything stays locked for all others until then.

## Users, tablets and views

Home Assistant does not pass URL parameters into add-on panels, so what someone sees is assigned **per user**:

1. Create a normal (non-admin) Home Assistant user for each tablet or family member, e.g. `tablet_wohnzimmer` (Settings → People → Users).
2. Log the tablet into that user and open the add-on once.
3. On your own account open the add-on → the **Users** button in the top bar (administrators only), press **+ User** and pick the user from the list of Home Assistant users (you can also type to search).
4. Choose what that user gets:
   - **Room:** the tablet then starts with only its room (with the room's entities). A button at the top toggles between the room and the whole floor. *Whole house* shows everything.
   - **View in live mode:** *3D only* (default for everybody without an entry), *2D only*, *2D + 3D* or *Switchable* (the user gets the 2D / 3D / split buttons).

**Backup that survives updates:** every change is also saved as `users.json` in the add-on configuration folder of Home Assistant (folder `addon_configs` → the folder ending in `floorplan3d`; reachable with the *File editor* or *Samba* add-on). The button **💾 Create / save file** writes it at once (use it once after the update if the folder has no file yet). If the assignments are ever lost, press **↻ Synchronise** in the Users dialog: the file is read and the users and tablets are taken from it. After a fresh installation this happens by itself.

If you open the add-on directly (for example through a mapped port), `?room=Wohnzimmer` does the same as the room assignment.

## Whole room at once and scenes

In live mode, tapping a light or scene opens its controls and, below them, **Whole room: <room>**. There you can switch **all lights of the room** on or off, set brightness, colour and warm/cold white for all of them, and start the room's **scenes**. The same block sits at the top of the room panel (tap a room).
Lights and scenes belong to a room when they are placed inside it or assigned to the room's Home Assistant area.

**Lamps on a relay and the light colour:** a lamp (ceiling light, pendant, spot, wall lamp, floor lamp, LED strip ...) that is only switched on and off, e.g. by a relay (a `switch.…` entity), lights the floor just like a light entity and has a light bulb on its tap ball. A relay does not tell the lamp's colour, so every lamp has the field **Lichtfarbe** (light colour) in the side panel: the floor, the lamp and its ball glow in that colour, e.g. cool white instead of warm white. A lamp that reports a colour itself uses that one; ↺ goes back to the default light colour of the settings. A lamp on the wall, just outside the room's outline, lights the room too (not the room on the other side of the wall).

## Nanoleaf and other effect lights

Nanoleaf (Shapes, Elements, Canvas ...) works through the official Home Assistant *Nanoleaf* integration: every panel set shows up as a light entity, place it like any other light (a *Lichtkugel* or *LED-Streifen* fits well). If a light offers effects (Nanoleaf scenes, WLED, Hue ...), the live popup shows an **Effects** drop-down; for a whole room the effects that all its lights share are offered.

**Place a whole area at once:** link a room to its Home Assistant area (room properties → *HA-Bereich*), then press **✨ Alle … sinnvoll platzieren** in the room's entity list. Lights are spread evenly under the ceiling, switches go next to the door, heating under a window, sensors and cameras onto free stretches of wall, motion sensors onto the floor, and door / window contacts are linked to the room's doors and windows. Battery, signal or energy sensors, scenes and scripts are skipped. Everything can be moved afterwards, and one *Undo* removes it all again.

**Ground and basement:** the house stands on a lawn, in the shape of your plot if you drew one. A basement sits inside the earth: in the whole-house view the earth in front of the facade facing you is cut away like in a section drawing, so the basement wall and the soil layers next to it are visible; the cut turns with the camera. ⚙ → *Ground around the house* switches between *solid* (default), *see-through* and *off*. To set the size of the lawn, draw your plot with the *Plot* tool in edit mode (click the corners in the 2D plan, double click to close; *Delete plot* removes it), or without a plot set ⚙ → *Lawn around the house without a plot (m)*. The grid is hidden under the lawn and only appears while you draw.

**Live updates:** changes made anywhere (wall switch, automation, HA app, sensors) appear in the floor plan within a fraction of a second; the add-on receives them from Home Assistant as they happen. If that connection is interrupted, the view keeps working and checks every few seconds until it is back.

**Details (history, logbook, settings):** the live popup of a device has an **ⓘ Details** button next to its name, the room panel one on every row. It opens Home Assistant's own dialog for that entity, the same one a dashboard card opens: history graph, logbook, all attributes and the entity settings. It is shown when the floor plan runs inside Home Assistant (sidebar or HA app).

**Scenes:** the popup of a light also lists every Home Assistant scene that contains this light (**Szenen mit dieser Lampe**); one tap activates the whole scene, so several strips take their scene colours together. The room panel does the same for all lights of the room.

**Turning and mirroring:** every device has *Drehung* (around the vertical axis), *Kippen vor/zurück* and *Drehen in der Fläche / seitlich* (roll) in the side panel, and **Spiegeln** flips the shape left-right. For a wall panel, *Drehen in der Fläche* turns it in the wall plane to build the pattern.

**Wall stop:** devices stop at walls when you drag them, so nothing ends up behind a wall by accident; doors let them pass. Settings → *Geräte stoppen an Wänden* switches it off.

**Layout editor (many panels):** many panels are easier as *Nanoleaf Layout*: place it, then in the editor pick a shape and click panels together – edges snap to neighbours (rotation is found automatically, `R` turns the free first panel, right-click erases, *Zurück* undoes). *Übernehmen* saves the whole layout as ONE object with ONE entity; all panels glow in that light's colour. Change it later with *Layout bearbeiten* in the side panel.

**TV on a swivel arm:** the *Wand-TV mit Schwenkarm* hangs on an articulated wall bracket and stands off the wall. Select it and set its *Größe* (43 to 85 inch), *Schwenken* (degrees, + turns the screen to the right seen from the front, − to the left), *Abstand zur Wand* and *Neigen* (+ tips it down). Swung or tilted, the arm pulls the TV out as far as it needs so that it does not touch the wall; the note under the fields then says how far it stands off. It has the backlight like the other TVs.

**TV with backlight:** select a *TV*, *Wand-TV* or *Wand-TV mit Schwenkarm* and pick the LED's light entity in *Hintergrundlicht (LED hinter dem TV)*: the frame behind the screen glows in its colour and lights the room. You switch the backlight in the room panel (or under *Whole room*); a TV with nothing but a backlight has no tap ball in live mode and cannot be tapped, give the TV its own entity (e.g. its media player) for that. Alternatively, for an LED strip behind a wall TV use *TV-Hintergrundlicht (LED)*: place it where the TV hangs, give it the strip's light entity and adjust width/height to the TV. It glows in the light's colour and lights the room from behind the TV.

**Single panel shapes:** the device palette has *Nanoleaf Dreieck / Sechseck / Quadrat / Linie*. Place one per real panel, rotate it to match the wall and give all of them the same light entity: they glow in the light's colour together. Clicking one in live mode opens the popup with colour, brightness and the effect (scene) list.

**LED ring (indirect light around the room):** pick *LED-Ring (indirekt)* in the lighting library and click into a room: the ring runs all around the room just under the ceiling, 15 cm from the walls, with one **section per wall**. Select it to give each section its own light entity (for example two WLED segments or two Hue strips), or leave them empty and use *Entität für alle Abschnitte* for a single strip. *Abstand zur Wand* and *↻ An Raum anpassen* re-fit it after the room changed, *Geschlossen* turns it into an open line, *Höhe über Boden* sets the height. In live mode, tapping a section controls that section; the popup also switches or colours the whole ring.

**Mirrors and the bar with several LEDs (LED zones):** the *LED-Spiegel mit 3 Zonen* (behind it, the frosted bands in front, the light underneath), the *Hollywood-Spiegel* (bulbs, behind), the *Spiegelschrank mit LED* (top, underneath), the big mirrors *Spiegelwand mit LED* and *Ganzkörperspiegel mit LED* (behind, the bands in front) and the bar counters (counter edge, plinth) have LED zones. Select the piece: under *LEDs einzeln verknüpfen* every zone gets its own light or switch; an empty zone follows the device's own entity, so one light for the whole mirror is enough. While editing, a zone that is off shows its own soft colour in 3D (the same colour as the stripe beside its field). In live mode the card has a button per zone and *Alle LEDs* on / off; a double click switches all zones. Sauna, fitness, bar, home cinema and PC pieces are in their own library groups (*Sauna & Wellness*, *Fitness*, *Bar*, *Heimkino*; the PC pieces in *Büro*): link a sauna to its heater and its stones glow while it heats, a screen to the projector or media player and it lights up while it plays. The *Gaming-PC-Arbeitsplatz* has its monitors under *Anordnung*: one, two or three side by side, four (2 × 2), a curved one, or a curved one with two upright.

**Air conditioners and fans** are in the library group *Klima & Lüftung*: split air conditioner (wall), outdoor unit / heat pump, portable air conditioner, ceiling cassette, ceiling fan with light, standing fan, tower fan, air purifier, dehumidifier. Link an air conditioner to its thermostat entity (`climate.*`): its air outlet turns blue while it cools and red while it heats, its display glows while it runs (also while it only dries or fans), and like a heater it shows its temperature on a pill. On a plain switch it cools while it is on. The ceiling fan's light is an LED zone: link the fan to the fan and, under *LEDs einzeln verknüpfen*, the light to its own light.

**More than one LED section per wall:** set *Anzahl Abschnitte* and press *Gleichmäßig verteilen*, then adjust every section with *Von (m)* / *Bis (m)*, measured along the band from the **0 m** mark shown in the 2D plan (once around the room). Or drag the white ends of a section along the wall in the 2D plan. ✂ splits a section in the middle, 🗑 removes it, *Je Wand einer* goes back to one section per wall. Where no section lies there are no LEDs, and a section may run around a corner.

## Home Assistant areas

Select a room and pick its **HA area** in the properties panel. Afterwards:

- entity lists (device properties and the sidebar search) are grouped by area, the area of the room the device stands in is on top, and searching for an area name finds its entities;
- the room panel in live mode also shows the area's lights, covers, media players, switches and sensors that are not placed on the plan yet.

What Home Assistant keeps off its own dashboards is left out there too: **diagnostic** and **configuration** entities of a device (for a relay e.g. its signal, IP address, SSID, firmware, restart time or restart reason) and entities you **hid** in Home Assistant (entity settings → *Visible* off). So a relay of which you only use the switch shows just the switch. Something you place on the plan yourself is always shown; in the entity picker these entities stay in their area.

Areas are read through Home Assistant's template API; if that is not available the lists simply stay ungrouped.

## 2D editor

Use the buttons **2D**, **3D** and **2D + 3D** at the top. The 2D plan and the 3D view show the same data: whatever you draw or move in one appears in the other immediately (best seen in the split view).

- **Place devices:** pick *Gerät* and a type, click into the plan. The new device is selected right away, so you can move it (drag or arrow keys) or link its entity; the next click on empty space deselects it and the next device can be placed.
- **Draw:** pick *Wall* or *Room* and click the corners. Double click, Enter or Esc finishes; clicking the first corner closes a room. Corners snap to the grid and to existing corners. Hold **Shift** for 45° angles, **Alt** to switch snapping off.
- **Move:** with *Select*, drag furniture, doors/windows (along their wall), whole walls or rooms. A selected wall or room shows corner handles; connected walls and room corners move along.
- **Reshape rooms:** double click on the outline of a room or block adds a corner there (then drag it), double click on a corner removes it. Double click on a **wall** adds a corner on it, the wall becomes two walls (Ctrl+Z takes it back); doors and windows stay with the piece they sit on, and a room that runs along the wall gets the corner too. A few pixels beside the line count as well. Too close to a wall end or on a door / window there is no corner and the status line says so. A device that really lies on the wall wins the double click (it toggles its entity), so double-click a free spot of the wall; the generous reach around doors, windows and devices does not count.
- **Navigate:** mouse wheel to zoom, right or middle mouse button (or dragging empty space) to pan, two fingers to pinch on touch screens. *Fit* recentres.
- The object list, the *Lock* selection and the room entity list work the same in 2D.
- **Customise the tool bar:** the **✎** button at the end of the tool bar opens *Customise tools*. For every tool you choose whether it is shown, in which order (▲ / ▼), and whether it is folded into the **More ▾** menu (rarely used tools stay out of the way but are one click away). *Select* can not be hidden. *Reset* restores the default. The choice is stored in this browser only, so a tablet and a desktop can look different. The bar also has **Dormers** (jumps to the roof floor and its dormer section, and creates a roof floor if there is none) and **Import house** (folded into *More* by default).

### Floors you do not draw: placeholder blocks

Live on the first floor of a building and do not want to draw the ground floor below you? Use the tool **Block** (B): click the corners of the building outline (double click or the first point closes it). The block stands under your floor as a solid mass in 3D and as a hatched area in 2D, so you see where your flat sits. *Belongs to* chooses the floor below (default, created automatically on the first floor) or the current floor. Blocks cannot be controlled and are only for orientation; select one in the object list to rename it, change its height or drag its corners.

### Floors, basement, roof, garden, whole house

Panel **Etage verwalten**: rename, change type, **▲/▼ move** the floor in the stack, **+ Keller** (inserted below; the ground floor stays at height 0), **+ Dach**, delete. A floor of type *Dachstuhl* draws a roof over everything below it: gable, hip or flat, with pitch, overhang and ridge direction (automatic = along the longer side). **Steps (house narrower at the front, wider at the back):** in the 2D plan click the roof on the roof floor, double click on its edge to split it there and drag the diamond handle out or in, or drag the corners (circles) of a step one by one; a double click on a diamond removes the step. The ridge stays straight, the wider part gets a slightly flatter slope. The same in the panel under *Steps* (side, from where, how far out). Gable and flat roofs only. **Dormers (Gauben):** in the same panel, section *Dormers* → **+ Dormer**: a dormer with its own little roof and a window stands out of one slope. Set the roof side (A/B), the position along the ridge (slider, or *Distance from the gable* in metres), width, wall height, distance from the eave, gable, flat or **shed dormer** roof and the window. A **shed dormer** (Schleppgaube) raises a part of one roof side: its front wall stands on the outer wall and goes straight up, its roof runs up at its own, flatter pitch (*Dormer pitch*) into the main roof; it may be as long as the roof, so the rooms under it get straight walls; with *Distance from the gable* 0 it goes flush up to the edge of the roof. Values are limited so that it always fits under the ridge; a flat main roof has no dormers. The main roof has a hole under every dormer, so its slope does not run through the room below. A long shed dormer over several rooms: put a window into the wall of each room under it as usual (tool *Door/Window*); where the dormer's front stands on that wall, the windows show through the dormer, with contact and roller shutter (the dormer's own window can be switched off).

Outdoor items (*Baum, Busch, Pool, Rasen, Terrasse, Weg, Zaun*) are normal device types: place them anywhere, also outside the walls, on the ground floor. The pill **Ganzes Haus** next to the floors shows every floor solid together with the plot; it is a view only.

On wide screens the floors are a **column of thumbnails** at the left edge (top floor first); the **Ganzes Haus** button on top shows the whole house, where a small **card** beside every floor lists its rooms, lights on and windows open (tap = open that floor). Narrow screens and wall tablets show the floor pills instead.

In the whole-house view the **Auseinander** button pulls the floors apart (tap again to stack them). ⚙ → *Etagen darunter* chooses how the floors below the open floor look: dimmed, stacked or hidden.

**Value badges**: ⚙ → *Value badges on devices* shows measurements on the devices ("21.4 °C", "95 W", shutter position ...): only the important ones, all devices, or none. **Temp. / Feuchte / CO₂** at the bottom colour the rooms by their sensors; a scale at the bottom right shows the colours (adjustable in ⚙).

**Räume erkennen** (button next to the *Raum* tool): draw the walls first, then one tap creates a room for every closed loop of walls on the floor. Walls may meet, cross or end on another wall; walls that end nowhere close nothing. Existing rooms stay, so you can press it again after adding walls.

**Floors in the 2D plan:** the box at the top right of the plan (also *View ▾* → *Floors in the plan*) shows the other floors as outlines in their own colours, with the legend under the switch so you can draw exactly over them: *off*, *below* (all lower floors, default) or *all*.

**Top bar:** the rooms are one drop-down *Zimmer ▾* (all rooms; in the whole-house view grouped by floor). *offline*, *open* (windows and doors) and *📷* (cameras) stay visible, because they need attention; tap one for the list. *View ▾* holds the display options: Auto (lower the walls facing the camera), Halbschnitt, Auseinander and the wall height. The *📷* button names the room with movement and turns red; its drop-down lists cameras (still image) and motion / presence sensors grouped by room, rooms with movement first.

**Garage door and roof terrace:** *Tür/Fenster* → *Garagentor* puts a sectional door into a wall. Give it a cover entity (e.g. `cover.garagentor`) or a contact sensor: the slats roll up when it is open, and in live mode a tap offers *Open / Close / Stop*. Mark a room as *Dachterrasse (offen, mit Geländer)* (room properties) for an open area with a wooden floor and a railing on the edges without a wall, e.g. on top of the garage: draw the room on the floor above the garage; the roof of the house leaves it out. In the room panel and the *open* list the openings are grouped into doors, gates and windows.

**Cameras:** a camera device shows its field of view as a cone on the floor (device panel: *Sichtwinkel*, *Reichweite*, *Bewegungssensor*). With a motion sensor the cone turns red while there is movement. In live mode a tap on the camera or its cone shows the camera live (Home Assistant's own HLS stream, the one its live view plays, through the add-on; the badge in the picture says *LIVE*). A camera without a stream in Home Assistant shows a still image instead, renewed every 5 seconds (badge *Standbild*). ⓘ or a tap on the picture opens Home Assistant's live view. ⚙ → *Show camera still images* switches the pictures off (they are visible to everybody who may open the panel).

**Room panel (live mode):** the devices of a room by kind: lights (with *Alle aus*), covers, heating, media, switches (slide switches), cameras, sensors, scenes & scripts. On phones and tablets held upright it comes up from the bottom.

The thermostats of the room have their own **heating panel** next to it (current and target temperature, modes). What else the thermostat's device brings along in Home Assistant, such as its **child lock**, window or valve detection, is shown there under the thermostat (switches as slide switches, values as text) and not among the room's switches and sensors. If the thermostat is not in this room, they stay in the room's list. The button **ⓘ In Home Assistant öffnen** under each thermostat opens Home Assistant's own dialog of the entity (history, settings); it shows when the add-on runs inside Home Assistant (side bar or dashboard card).

**Heaters in 3D:** a radiator, towel radiator or *Heizung* linked to an entity shows only its temperature, on a **red** pill while it heats and a **blue** one while it does not (idle, off); the radiator itself turns red while it heats and a cool blue otherwise. Tap the temperature to open its card. With the value labels switched off it gets a tap ball like other devices.

**View menu:** the *View ▴* button sits in the bottom bar next to Normal / Temperature / Humidity / CO₂; its menu (Auto, Halbschnitt, pull apart, walls, floors in the plan) opens upwards.

**See-through walls:** in ⚙ you can make the walls between the camera and the room fade instead of sinking (*Make walls facing the camera see-through …*). Only the wall fades: its doors and windows and the furniture behind it stay solid.

**Live mode:** a second tap into the room you are in goes back to the view before (floor or whole house, same camera).

**Halbschnitt** (button in the view menu): cuts every wall at half height so you see into all rooms from any side; lamps, LED rings and pictures that hang above the cut are hidden with it. **Arrow keys** move the selected item by one grid step (Shift 10 cm, Alt 1 cm; a door or window slides along its wall). With nothing selected, **arrow up / down** switch to the floor above / below.

### Stairs and stairwells

Tool **Bodenöffnung** (floor opening): click the corners of an opening in the 2D plan (double click to close). The floor of that level is open there, for a stairwell, a gallery or a void; a placeholder block on the floor below is cut too. Select it to drag its corners, *Del* removes it.


Tool **Treppe** (T): pick *Gerade*, *L*, *U* (with landing) or *Wendel*, set the direction and click in the plan. The steps are calculated from the floor height (3 m). Q/E rotates, dragging moves, the side panel edits width or radius, length and the turning side. Select a stair to get two handles in 2D: drag the one at the end of the run to change step depth (length) and the one at its side to change the width.

- **Leads up**: the stair belongs to this floor and climbs to the next one. The floor above gets an opening over the whole stair automatically (dashed orange in 2D, only where the opening lies completely inside a room).
- **Comes from below**: the stair starts one floor lower (for example in a block) and ends on this floor; the opening is cut into this floor.
- **Treppenhaus**: one click places a U stair with four walls, a room, a flat door and, for stairs leading up, the same shell on the next floor. Everything stays editable as normal walls, rooms and doors.

### Trace a floor plan (background image)

Open the panel **Hintergrundbild** in the side bar (edit mode). Every floor has its own image.

1. **Load image**: a scan or photo of your floor plan (PNG, JPG or WebP, max. 8 MB). It appears in the 2D view.
2. **Set scale**: click *Maßstab setzen*, click the two ends of a distance you know (a wall, a door width, a dimension from the plan) and type its real length. The image is scaled around the first point.
3. **Move / resize**: drag the image into place and drag its corner handles to make it bigger or smaller (the opposite corner stays), or type width, X, Z and rotation; use *Opacity* to keep the lines readable.
4. Draw the walls and rooms over it. *Hide* switches the template off without deleting it.

The template is only shown in the editor, never in live mode. Images are stored in the add-on's data folder and are included in add-on backups.

## Tablets and kiosk screens (performance)

On touch screens and with `?kiosk=1` or `?room=...` the app switches to a **low-power mode**: lower resolution, no antialiasing, shadows, blur or glow, 30 fps while in use and about 2 fps when idle, no drawing while the screen is off. If a tablet is not recognised (or you want full quality on it), choose ⚙ → **Performance on this device**: *Automatic*, *Beautiful* or *Fast*. The choice is stored in that browser only, so each tablet can have its own. Add `&perf=high` or `&perf=low` to the address to override it. When the floor and room buttons over the plan do not fit, they scroll sideways: swipe them or use the ‹ › arrows at the ends. Tips for Fire tablets: use Fully Kiosk Browser, keep hardware acceleration/WebGL on, and use one tablet per room (`?room=Name`) instead of the whole-house view.

## Warnings

Without any setup the plan warns when a **smoke, gas, carbon monoxide or water sensor** (a `binary_sensor` with that device class) reports *on*, when an **alarm panel** is triggered, and when a **window is open while it rains** (the weather entity reports rain, hail or sleet). A red banner appears at the top and the room flashes red; a tap on the banner jumps into the room. The room is found from the device or window bound to the sensor, otherwise from the Home Assistant area of the room. ⚙ → *Wall tablet: warnings and kiosk* switches warnings off, can jump to a new warning by itself and sets the weather entity (empty = the first one).

## Search

The 🔍 button at the bottom left opens **"Where is …?"**: type part of a device, window or room name. A tap (or Enter for the first hit) switches to the right floor, moves the camera there and marks the device with a ring; in live mode its controls open.

## Wall tablet kiosk

In ⚙ → *Wall tablet: warnings and kiosk*, for the live view:
- **Back to the start view** after a number of minutes without a touch (0 = off). A room tablet goes back to its room, otherwise the ground floor.
- **Screen saver**: the house then turns slowly until the next touch.
- **Dim at night**, by the sun (`sun.sun`) or between two times (e.g. 22:00 to 06:00). The first touch only wakes the screen, it does not switch anything.

## Renamed in Home Assistant

Rename an entity or a device in Home Assistant, in Zigbee2MQTT ("update Home Assistant entity ID") or with another add-on such as the Zigbee Devices Manager, and the floor plan follows by itself: every placed device, LED ring section, TV backlight, door/window contact and cable linked to the old entity id gets the new one, in every house, and so do the settings (e.g. the weather entity) and `users.json`. A device whose name is still the name Home Assistant showed gets the new name; a name you typed yourself stays. An open floor plan updates at once, without a reload, and an undo does not bring the old id back. The add-on recognises an entity by its entry in Home Assistant's entity registry (integration and unique id), so this also works when the entity was deleted and created again with the same unique id, and renames made while the add-on was stopped are caught up at its next start. Entities without a unique id (defined in YAML) cannot be renamed in Home Assistant and are not affected. The add-on log lists what was renamed.

## Device overview

The button **📋 Geräte** at the top shows and hides a list of every placed device linked to Home Assistant and every door or window with a sensor, by floor and room: its state, its **battery level** and whether it is offline. The battery comes from the battery sensor of the same device in Home Assistant (e.g. `sensor.…_battery`), so a door contact or a thermostat shows its battery without any setting; a robot vacuum shows the level it reports itself. *🔋 Batterie* lists only what has a battery, the emptiest first; at 20 % or less it is red, and the button shows how many are low (**📋 Geräte · 🪫 2**). *⚠ Offline* lists only what is offline. Tap a device to see it in the plan. On a phone the button is in the 📊 list.

## Power: what is what (⚡ Rechnung)

The power overview at the top left (☀ production · ⚡ grid · ⌂ consumption · 🔋 battery) counts with the power devices of the plan. To say exactly which sensor is what, switch on **Strom-Editor** in edit mode and press **⚡ Rechnung** next to *Kabel*. The window has a part for each:

- **Netz** (house connection): one sensor where plus means drawn from the grid and minus fed in, or two sensors for drawn and fed in. *Vorzeichen umdrehen* when your meter counts the other way round. Under the sensor you see its value now and how it is read (→ *Bezug* / *Einspeisung*).
- **Erzeugung**: one or more solar sensors (e.g. one per inverter or balcony plant); they are added up.
- **Batterie**: the charge level (%) and one sensor (plus = charging) or two for charging and discharging. Switch off *Batterie im Hausverbrauch mitrechnen* when your production sensor measures the output of a hybrid inverter, which already includes the battery.
- **Hausverbrauch**: without a sensor it is calculated as production + drawn − fed in + discharging − charging. With a sensor of its own the overview shows the measured value and the calculation stays next to it as a check.
- **Räume**: the sensors (smart plugs, sub-meters) that measure what each room uses. *Vorschlagen* takes the sensors in watts from the room's Home Assistant area or placed in the room. What no room accounts for is shown as the rest.

At the top the window shows the calculation with the values of now. When something does not add up it says so: a consumption below zero (usually a sign the wrong way round; the button *Vorzeichen … umdrehen* turns it), a house sensor far from the calculation, rooms that use more than the whole house, a sensor counted twice. Everything left empty comes from the power devices of the plan. The settings are saved with the house; the overview's tooltip lists the rooms and the rest.

## Devices offline

The pill **✓ 0 offline** over the plan (live and edit mode) turns red (**⚠ n offline**) as soon as a placed device is **unavailable** in Home Assistant, reports an **unknown** state, or no longer exists there (e.g. deleted). Tap it to see the list with floor, room, entity and since when it is offline. Tap an entry to jump to the device. LED ring sections, TV backlights and door/window contacts are checked too. Placed lamps and smart devices that are **not linked** to an entity are listed too (furniture, garden objects and pictures are not). Only what is placed in the plan is checked.

The 3D view marks them as well: a small ball with a **crossed-out lightning bolt** floats over each one (red: offline, amber: not linked), over a door or window it sits in its middle. In live mode a device with a tap ball shows the sign on its ball.

**Doors and windows with a sensor** show it by their frame: **green** while shut, **red** (the whole door or window) while open, **amber** while the sensor does not report. Doors and windows without a sensor keep their own colour.

## Library, doors, windows and pictures

- **Library:** tool *Gerät* shows every piece with a preview. Filter with the category chips (living, kitchen, bath, bedroom, office, lighting, tech, outdoor, decor) or search by name.
- **Doors and windows:** tool *Tür/Fenster* offers, in three groups, **Doors** (door, front door, glass door, double door, sliding door), **Passages and gates** (passage, opening without frame, garage door) and **Windows** (single/double/triple window, balcony door, small bath window, fixed glazing). In the side panel of a placed opening, *Ausführung* changes its style later.
- **Pictures:** place *Bild* (category Decor), then *Bild laden …* in the side panel to upload a PNG, JPG or WebP; set the width, the height follows the image. Wall-hung items (pictures, mirrors, panels, radiators, wall lamps ...) snap flat onto the closest wall when placed; *An Wand ausrichten* does it for an existing one.

## Several houses

Open **Manage houses** in the side panel: create a new (empty) house, duplicate the current one, rename or delete it. A house selector appears in the header as soon as there is more than one house. Every house has its own floors, devices and backgrounds layout; all editors can manage all houses.

For a wall tablet, open the add-on with `?house=Parents` (name or id, case-insensitive) so it always shows the right house; without it the last chosen house of that browser is used.

## Windows with several sensors

For a double or triple window, the side panel lists **Individual panes**: pick one contact sensor per pane. Each pane then opens on its own in 3D, and the room panel shows every pane. Panes without their own sensor follow the window's main sensor.

## Roller shutters

Every window (also a dormer window) has the tick **Rollladen** in the side panel. Tick it and pick the shutter's own entity under **Rollladen-Entität** (a cover, e.g. `cover.rollladen_kueche`); the window's contact stays its sensor. In 3D the shutter comes down outside the glass as far as the cover is closed (its position, 100 % = open) and moves up and down with it; a label over the window says how far it is open (e.g. "↕ 60 % offen"; it follows the setting for value labels). In live mode a 🪟 ball on top of the window opens the shutter's own card (only the shutter, not the window's contact): a tall slider that shows the curtain (drag it or tap where it should go), *Up / Stop / Down* beside it and quick positions 0 / 25 / 50 / 75 / 100 %; the room panel lists the shutter under *Rollläden*, and the 2D plan shows it outside the window (in live mode with its position). An open shutter does not count as an open window. Untick it to remove the shutter and its entity.

## Version and checksum

At the top right of the bar there is a pill with the **version** and a short **checksum**, for example `✓ v3.24.1 · a1b2c3d`. Every change of the add-on files changes the checksum: a *manifest* with the checksum of every file is committed with the code, and the tests fail when it does not match. The pill checks on every start:
- **Add-on:** do the files the add-on really has match the manifest? (red when files differ or are missing)
- **Browser:** do the files your browser really loaded match it? (orange when the browser still shows old files, for example after an update: *Reload (clear cache)* fixes that)

The pill is **green** when both match. Click it for the details and **Check now (also with GitHub)**: the add-on then fetches the manifest of the `main` branch on GitHub and tells you whether it is the same state, whether GitHub has a newer version (update in the add-on store) or a different state. If GitHub cannot be reached, it says so; the other two checks still count.

**New version available:** in the edit mode the add-on looks at GitHub once at the start and then every 5 minutes. When a newer version exists the pill turns **blue** (`⬆ New version available · v…`); update in *Settings → Apps → 3D Floorplan*. Only the public `manifest.json` is fetched, nothing about you or your house is sent. Switch it off in ⚙ (*Check GitHub every 5 minutes …*). The browser check also works when Home Assistant is opened over plain `http` (the checksums are then calculated without the browser's secure-context function).

For developers: after every change in `floorplan3d/` run `python3 tools/make_manifest.py` and commit `manifest.json`.

## Security (Sicherheit)
The add-on records what switches in the house: lights, switches, doors and windows with a contact, covers, people, locks, climate and the like (sensors such as temperature at most every 5 minutes). Only entities placed in one of your floor plans are recorded. Every day gets one file in the add-on configuration folder: `addon_configs/…_floorplan3d/timeline/YYYY-MM-DD.jsonl`.

Press **🛡️ Sicherheit** in the tool bar (on a phone: in the ☰ menu) and pick a day. The house looks like the live view, but shows the recorded states, with a bar at the bottom: ▶ play / ⏸ pause, ⏮ ⏭ previous / next event, the speed (×1 … ×3600), a slider over the day with every change as an icon (💡 light, 🚪 door, 🏃 motion …; several close together show one icon with a number), 🔍 the zoom: how much of the day the line shows, from 24 h down to 10 min (also the mouse wheel over the line) and 📋 the list of events (tap one to jump to it). Nothing can be switched while security view is open; ✕ goes back to live. Each day file can be downloaded from the list (⬇).

The recorder uses its own connection to Home Assistant and only listens, so Home Assistant and the live view are not slowed down. *Houses & backup → Security* switches recording off and sets how many days are kept (default: 7 days plus today; older files are deleted). In the users dialog security view can be locked for a user.

## Backup and restore

*Houses & backup* in the side panel: **Download backup** saves everything (all houses, settings, pictures, custom 3D models) as one JSON file, **Restore backup…** replaces the current data with such a file. Handy before big changes, for moving to another Home Assistant or for copying a plan to a second installation. Before a restore, the current layouts and settings are copied to `/data/backups` on the server (last 5 kept). Only editors can export and import.

**Automatic backups:** under *Houses & backup* the section **Automatic backup** can save everything by itself. Switch it on, choose the **interval** in hours (24 = daily), how many **days** the automatic backups are kept and the **maximum number**. Older ones are deleted by themselves; the newest automatic backup always stays and backups you made by hand are never deleted. The files are stored in the configuration folder of the add-on (in Home Assistant: `addon_configs` → the folder ending in `floorplan3d` → `backups`), so they survive updates and reinstalls and can be copied away with the *File editor* or *Samba* add-on. **Back up now** makes one at once. **Check the newest** (or *Check* in the list) reads a backup like a restore would, without changing anything, and tells you how many houses, pictures and models it holds. **Restore** replaces the current data with a backup of the list (the current state is saved once more before), ⬇ downloads it, × deletes it. The schedule runs inside the add-on, no browser has to be open.

## Resize and lock furniture

Select a piece in the 2D plan: the two square handles on its edges stretch it in width and depth independently (Alt is not needed). Height and exact factors are in the side panel (*Breite / Höhe / Tiefe (Streckung)*). Tick **Sperren** to fix a piece in place.

## Object list

The object list in the side panel is grouped by room: the room itself, its doors and windows and its furniture. Walls, stairs and blocks are listed below, things outside any room under *No room*. The search field above the list finds objects by name. The box before each name locks the item against moving, resizing and deleting. You can widen the whole side panel by dragging its left edge.

## About this project

3D Floorplan is an AI-assisted project: developed together with Claude (Anthropic), directed, tested and used daily by its author. It is open source (MIT); bug reports and ideas are very welcome.


## Import (Grundstück / Grundriss per JSON)

Unter **Häuser → Grundriss importieren (JSON)** legst du aus einer JSON-Beschreibung (Grundstück, Räume, Fenster/Türen, Geräte) ein neues Haus an – von Hand, per KI-Prompt oder aus GeoJSON. Es gibt Beispiele, eine Prüfung vor dem Import und einen Export vorhandener Häuser. API: `POST /api/import[?dryRun=1&name=]`, `GET /api/export/property`, `GET /api/import/schema`. Details und Prompt-Tipps: [docs/IMPORT.md](https://github.com/BuRnEd4AiM/HA-Floorplanner/blob/main/docs/IMPORT.md).


## Language

⚙ → *Language*: Deutsch, English, Français, Español, Italiano, Nederlands, Polski, or *Auto* (follows the browser language of the device, so a tablet and a phone can differ if you set it per device in the browser; the saved setting is shared by all). Names you typed yourself (floors, rooms, devices) are never translated.
