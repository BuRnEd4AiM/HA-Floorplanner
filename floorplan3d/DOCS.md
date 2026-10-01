# 3D Floorplan

Draw your home, view it in 3D and control your devices from the floor plan.

## First steps

1. Start the add-on and open **3D Floorplan** from the sidebar.
2. Pick **Wall** and click your outline point by point (double-click or `Esc` finishes).
3. Pick **Door/Window** and click a wall to cut an opening.
4. Pick **Device**, choose a type and a Home Assistant entity, click the floor.
5. Switch to **Live** to try it out: tap a device to control it.

Everything is saved automatically in the add-on's `/data` folder and is part of Home Assistant backups.

## Wall tablet / kiosk

Open the add-on page with `?kiosk=1` (for example in a dashboard iframe or a kiosk browser). The editor UI is hidden, the floor plan stays interactive.

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
3. On your own account open the add-on → ⚙ → **Users & tablets**, press **+ User** and pick the user from the list of Home Assistant users (you can also type to search).
4. Choose what that user gets:
   - **Room:** the tablet then starts with only its room (with the room's entities). A button at the top toggles between the room and the whole floor. *Whole house* shows everything.
   - **View in live mode:** *3D only* (default for everybody without an entry), *2D only*, *2D + 3D* or *Switchable* (the user gets the 2D / 3D / split buttons).

If you open the add-on directly (for example through a mapped port), `?room=Wohnzimmer` does the same as the room assignment.

## Whole room at once and scenes

In live mode, tapping a light or scene opens its controls and, below them, **Whole room: <room>**. There you can switch **all lights of the room** on or off, set brightness, colour and warm/cold white for all of them, and start the room's **scenes**. The same block sits at the top of the room panel (tap a room).
Lights and scenes belong to a room when they are placed inside it or assigned to the room's Home Assistant area.

## Nanoleaf and other effect lights

Nanoleaf (Shapes, Elements, Canvas ...) works through the official Home Assistant *Nanoleaf* integration: every panel set shows up as a light entity, place it like any other light (a *Lichtkugel* or *LED-Streifen* fits well). If a light offers effects (Nanoleaf scenes, WLED, Hue ...), the live popup shows an **Effects** drop-down; for a whole room the effects that all its lights share are offered.

**Place a whole area at once:** link a room to its Home Assistant area (room properties → *HA-Bereich*), then press **✨ Alle … sinnvoll platzieren** in the room's entity list. Lights are spread evenly under the ceiling, switches go next to the door, heating under a window, sensors and cameras onto free stretches of wall, motion sensors onto the floor, and door / window contacts are linked to the room's doors and windows. Battery, signal or energy sensors, scenes and scripts are skipped. Everything can be moved afterwards, and one *Undo* removes it all again.

**Ground and basement:** the house stands on a lawn, in the shape of your plot if you drew one. A basement sits inside the earth: in the whole-house view the earth in front of the facade facing you is cut away like in a section drawing, so the basement wall and the soil layers next to it are visible; the cut turns with the camera. ⚙ → *Ground around the house* switches between *solid* (default), *see-through* and *off*. To set the size of the lawn, draw your plot with the *Plot* tool in edit mode (click the corners in the 2D plan, double click to close; *Delete plot* removes it), or without a plot set ⚙ → *Lawn around the house without a plot (m)*. The grid is hidden under the lawn and only appears while you draw.

**Live updates:** changes made anywhere (wall switch, automation, HA app, sensors) appear in the floor plan within a fraction of a second; the add-on receives them from Home Assistant as they happen. If that connection is interrupted, the view keeps working and checks every few seconds until it is back.

**Details (history, logbook, settings):** the live popup of a device has an **ⓘ Details** button next to its name, the room panel one on every row. It opens Home Assistant's own dialog for that entity, the same one a dashboard card opens: history graph, logbook, all attributes and the entity settings. It is shown when the floor plan runs inside Home Assistant (sidebar or HA app).

**Scenes:** the popup of a light also lists every Home Assistant scene that contains this light (**Szenen mit dieser Lampe**); one tap activates the whole scene, so several strips take their scene colours together. The room panel does the same for all lights of the room.

**Turning and mirroring:** every device has *Drehung* (around the vertical axis), *Kippen vor/zurück* and *Drehen in der Fläche / seitlich* (roll) in the side panel, and **Spiegeln** flips the shape left-right. For a wall panel, *Drehen in der Fläche* turns it in the wall plane to build the pattern.

**Groups:** tool *Gruppe* – click the devices that belong together, then *Gruppe bilden*. The group moves, turns around its centre and mirrors as one shape (side panel of any member: *Gruppe spiegeln*, *Aus Gruppe lösen*, *Gruppe auflösen*). Ideal for a Nanoleaf logo you built once.

**Wall stop:** devices stop at walls when you drag them, so nothing ends up behind a wall by accident; doors let them pass. Settings → *Geräte stoppen an Wänden* switches it off.

**Layout editor (many panels):** many panels are easier as *Nanoleaf Layout*: place it, then in the editor pick a shape and click panels together – edges snap to neighbours (rotation is found automatically, `R` turns the free first panel, right-click erases, *Zurück* undoes). *Übernehmen* saves the whole layout as ONE object with ONE entity; all panels glow in that light's colour. Change it later with *Layout bearbeiten* in the side panel.

**TV with backlight:** select a *TV* or *Wand-TV* and pick the LED's light entity in *Hintergrundlicht (LED hinter dem TV)*: the frame behind the screen glows in its colour and lights the room. Alternatively, for an LED strip behind a wall TV use *TV-Hintergrundlicht (LED)*: place it where the TV hangs, give it the strip's light entity and adjust width/height to the TV. It glows in the light's colour and lights the room from behind the TV.

**Single panel shapes:** the device palette has *Nanoleaf Dreieck / Sechseck / Quadrat / Linie*. Place one per real panel, rotate it to match the wall and give all of them the same light entity: they glow in the light's colour together. Clicking one in live mode opens the popup with colour, brightness and the effect (scene) list.

**LED ring (indirect light around the room):** pick *LED-Ring (indirekt)* in the lighting library and click into a room: the ring runs all around the room just under the ceiling, 15 cm from the walls, with one **section per wall**. Select it to give each section its own light entity (for example two WLED segments or two Hue strips), or leave them empty and use *Entität für alle Abschnitte* for a single strip. *Abstand zur Wand* and *↻ An Raum anpassen* re-fit it after the room changed, *Geschlossen* turns it into an open line, *Höhe über Boden* sets the height. In live mode, tapping a section controls that section; the popup also switches or colours the whole ring.

**More than one LED section per wall:** set *Anzahl Abschnitte* and press *Gleichmäßig verteilen*, then adjust every section with *Von (m)* / *Bis (m)*, measured along the band from the **0 m** mark shown in the 2D plan (once around the room). Or drag the white ends of a section along the wall in the 2D plan. ✂ splits a section in the middle, 🗑 removes it, *Je Wand einer* goes back to one section per wall. Where no section lies there are no LEDs, and a section may run around a corner.

## Home Assistant areas

Select a room and pick its **HA area** in the properties panel. Afterwards:

- entity lists (device properties and the sidebar search) are grouped by area, the area of the room the device stands in is on top, and searching for an area name finds its entities;
- the room panel in live mode also shows the area's lights, covers, media players, switches and sensors that are not placed on the plan yet.

Areas are read through Home Assistant's template API; if that is not available the lists simply stay ungrouped.

## 2D editor

Use the buttons **2D**, **3D** and **2D + 3D** at the top. The 2D plan and the 3D view show the same data: whatever you draw or move in one appears in the other immediately (best seen in the split view).

- **Draw:** pick *Wall* or *Room* and click the corners. Double click, Enter or Esc finishes; clicking the first corner closes a room. Corners snap to the grid and to existing corners. Hold **Shift** for 45° angles, **Alt** to switch snapping off.
- **Move:** with *Select*, drag furniture, doors/windows (along their wall), whole walls or rooms. A selected wall or room shows corner handles; connected walls and room corners move along.
- **Reshape rooms:** double click on the outline of a room or block adds a corner there (then drag it), double click on a corner removes it.
- **Navigate:** mouse wheel to zoom, right or middle mouse button (or dragging empty space) to pan, two fingers to pinch on touch screens. *Fit* recentres.
- The object list, the *Lock* selection and the room entity list work the same in 2D.

### Floors you do not draw: placeholder blocks

Live on the first floor of a building and do not want to draw the ground floor below you? Use the tool **Block** (B): click the corners of the building outline (double click or the first point closes it). The block stands under your floor as a solid mass in 3D and as a hatched area in 2D, so you see where your flat sits. *Belongs to* chooses the floor below (default, created automatically on the first floor) or the current floor. Blocks cannot be controlled and are only for orientation; select one in the object list to rename it, change its height or drag its corners.

### Floors, basement, roof, garden, whole house

Panel **Etage verwalten**: rename, change type, **▲/▼ move** the floor in the stack, **+ Keller** (inserted below; the ground floor stays at height 0), **+ Dach**, delete. A floor of type *Dachstuhl* draws a roof over everything below it: gable, hip or flat, with pitch, overhang and ridge direction (automatic = along the longer side).

Outdoor items (*Baum, Busch, Pool, Rasen, Terrasse, Weg, Zaun*) are normal device types: place them anywhere, also outside the walls, on the ground floor. The pill **Ganzes Haus** next to the floors shows every floor solid together with the plot; it is a view only.

### Stairs and stairwells

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

On touch screens and with `?kiosk=1` or `?room=...` the app switches to a **low-power mode**: lower resolution, no antialiasing or shadows, 30 fps while in use and about 4 fps when idle, no drawing while the screen is off. Add `&perf=high` to the address to force full quality, `&perf=low` to force the low-power mode on a computer. Tips for Fire tablets: use Fully Kiosk Browser, keep hardware acceleration/WebGL on, and use one tablet per room (`?room=Name`) instead of the whole-house view.

## Library, doors, windows and pictures

- **Library:** tool *Gerät* shows every piece with a preview. Filter with the category chips (living, kitchen, bath, bedroom, office, lighting, tech, outdoor, decor) or search by name.
- **Doors and windows:** tool *Tür/Fenster* offers front door, glass door, double door, sliding door, passage, single/double/triple window, balcony door, small bath window and fixed glazing. In the side panel of a placed opening, *Ausführung* changes its style later.
- **Pictures:** place *Bild* (category Decor), then *Bild laden …* in the side panel to upload a PNG, JPG or WebP; set the width, the height follows the image. Wall-hung items (pictures, mirrors, panels, radiators, wall lamps ...) snap flat onto the closest wall when placed; *An Wand ausrichten* does it for an existing one.

## Several houses

Open **Manage houses** in the side panel: create a new (empty) house, duplicate the current one, rename or delete it. A house selector appears in the header as soon as there is more than one house. Every house has its own floors, devices and backgrounds layout; all editors can manage all houses.

For a wall tablet, open the add-on with `?house=Parents` (name or id, case-insensitive) so it always shows the right house; without it the last chosen house of that browser is used.

## Windows with several sensors

For a double or triple window, the side panel lists **Individual panes**: pick one contact sensor per pane. Each pane then opens on its own in 3D, and the room panel shows every pane. Panes without their own sensor follow the window's main sensor.

## Backup and restore

*Houses & backup* in the side panel: **Download backup** saves everything (all houses, settings, pictures, custom 3D models) as one JSON file, **Restore backup…** replaces the current data with such a file. Handy before big changes, for moving to another Home Assistant or for copying a plan to a second installation. Before a restore, the current layouts and settings are copied to `/data/backups` on the server (last 5 kept). Only editors can export and import.

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
