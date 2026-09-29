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
