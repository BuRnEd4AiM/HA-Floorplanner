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
    - florian
  ```

  Use the login name (Settings → People → Users). Leave the list empty if only administrators may edit.
- If the administrators cannot be read (the add-on then shows "Editing locked" in the status line), add your own user to `editors` as above. Everything stays locked for all others until then.

## One tablet per room

Home Assistant does not pass URL parameters into add-on panels, so tablets are assigned by user:

1. Create a normal (non-admin) Home Assistant user for each tablet, e.g. `tablet_wohnzimmer` (Settings → People → Users).
2. Log the tablet into that user and open the add-on once.
3. On your own account open the add-on → ⚙ → **Tablets per room**, press **+ Tablet**, type the user name and choose the room.

That tablet now always starts with only its room shown, together with the room's entities. The button at the top (*Whole floor* / *‹ Room*) toggles between the room and the whole floor; in the whole-floor view the floor buttons are available as well.
If you open the add-on directly (for example through a mapped port), `?room=Wohnzimmer` does the same.

## Home Assistant areas

Select a room and pick its **HA area** in the properties panel. Afterwards:

- entity lists (device properties and the sidebar search) are grouped by area, the area of the room the device stands in is on top, and searching for an area name finds its entities;
- the room panel in live mode also shows the area's lights, covers, media players, switches and sensors that are not placed on the plan yet.

Areas are read through Home Assistant's template API; if that is not available the lists simply stay ungrouped.

## 2D editor

Use the buttons **2D**, **3D** and **2D + 3D** at the top. The 2D plan and the 3D view show the same data: whatever you draw or move in one appears in the other immediately (best seen in the split view).

- **Draw:** pick *Wall* or *Room* and click the corners. Double click, Enter or Esc finishes; clicking the first corner closes a room. Corners snap to the grid and to existing corners. Hold **Shift** for 45° angles, **Alt** to switch snapping off.
- **Move:** with *Select*, drag furniture, doors/windows (along their wall), whole walls or rooms. A selected wall or room shows corner handles; connected walls and room corners move along.
- **Navigate:** mouse wheel to zoom, right or middle mouse button (or dragging empty space) to pan, two fingers to pinch on touch screens. *Fit* recentres.
- The object list, the *Lock* selection and the room entity list work the same in 2D.
