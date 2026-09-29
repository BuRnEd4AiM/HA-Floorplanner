# 3D Floorplan for Home Assistant

Draw your home yourself, view it in 3D and place your Home Assistant devices right where they are.

> Status: early development (0.x). Layouts are stored in a versioned JSON format and will be migrated between releases.

## Features

- **Draw your own floor plan** – walls, rooms and multiple floors on a snapping grid
- **3D view** – orbit, pan and zoom; 2D top view for precise editing; low-wall mode to look inside
- **Doors and windows** – real openings cut into the walls, draggable along the wall with overlap protection
- **Devices** – 10 built-in models (lights, switches, sensors, radiators, furniture, plants) plus your **own GLB models** with a model library
- **Home Assistant linked** – each device can be bound to an entity; lights glow when on, sensor values are shown at the device
- **Live mode** – tap a device to see its state and control it (lights, switches, fans, covers, locks, scenes, scripts); `?kiosk=1` hides all editor UI for wall tablets
- **Permissions and room tablets** – only chosen users may edit (`editors` option); every tablet can be locked to one room via its Home Assistant user
- **2D blueprint editor** – draw and move walls, rooms, doors, windows and furniture in a top-down plan, linked live with the 3D view (split view)
- **Hologram design** – translucent neon walls, glowing devices and lit rooms, pill navigation for floors and rooms
- **Settings** – language (DE/EN), hologram/dark/light theme, metric/imperial units, grid size, default wall size, shadows, autosave
- **Auto-save and undo** – changes are saved automatically, `Ctrl+Z` reverts
- **Works offline** – three.js is bundled, no CDN required
- **Ingress** – opens in the Home Assistant sidebar, no extra ports or logins

See the [roadmap](ROADMAP.md) for what is planned (HACS card for dashboards, live WebSocket updates, native more-info dialog).

## Try it without Home Assistant

Build the single-file demo (example apartment, simulated lights and sensors, everything runs in the browser):

```bash
cd demo && npm install && npm run build      # -> demo/dist/floorplan3d-demo.html
```

Open the file by double-click. Changes are not saved in the demo.

## Installation

### Add-on

1. In Home Assistant open **Settings → Add-ons → Add-on Store → ⋮ → Repositories**.
2. Add the URL of this repository.
3. Install **3D Floorplan**, start it and enable **Show in sidebar**.

For local development copy the `floorplan3d/` folder to `/addons/` on your Home Assistant host instead.

## Usage

| Action | How |
| --- | --- |
| Tools | Select `V`, Wall `W`, Room `R`, Door/Window `O`, Device `D`, Erase |
| Draw walls / rooms | Click point by point, double-click or `Esc` finishes |
| Move device | Drag it |
| Rotate device | `Q` / `E` (15° steps) or the properties panel |
| Toggle linked entity | Double-click the device (edit mode) or tap it (live mode) |
| Custom model | Device tool → *Upload GLB*, then place it like any device (`.glb`, max 20 MB, no Draco compression) |
| Wall tablet | Open the add-on with `?kiosk=1` |
| Undo | `Ctrl+Z` |

## Development

```bash
pip install -r requirements-dev.txt
pytest                      # backend tests
# browser end-to-end test: see tests/e2e/README.md
DATA_DIR=./data python floorplan3d/rootfs/app/server.py   # http://localhost:8099
```

Without a `SUPERVISOR_TOKEN` the backend runs in standalone mode: layouts are saved, entity features are disabled.

Repository layout:

```
floorplan3d/            Home Assistant add-on (config, Dockerfile, backend, frontend)
tests/                  backend tests
.github/workflows/      CI
```

## Contributing

New to Git? Start with the [beginner guide (German)](docs/GIT-EINSTIEG.md).


Issues and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 Florian Weber. Bundles [three.js](https://threejs.org) (MIT).
