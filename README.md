<div align="center">

# 3D Floorplan for Home Assistant

**Draw your home, see it in 3D and control it right where things are.**

[![CI](https://github.com/wvssweber-max/HA-Floorplanner/actions/workflows/ci.yml/badge.svg)](https://github.com/wvssweber-max/HA-Floorplanner/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/wvssweber-max/HA-Floorplanner?display_name=tag&sort=semver)](https://github.com/wvssweber-max/HA-Floorplanner/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Home Assistant add-on](https://img.shields.io/badge/Home%20Assistant-add--on-41BDF5?logo=homeassistant&logoColor=white)
![Ingress](https://img.shields.io/badge/Ingress-yes-success)
![No build step](https://img.shields.io/badge/frontend-no%20build%20step-lightgrey)

[![Add repository to my Home Assistant](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fwvssweber-max%2FHA-Floorplanner)

![3D and 2D split view](docs/img/split.png)

</div>

> **Status: early development (0.x).** It works and is used daily, but layouts are stored in a versioned JSON format that may be migrated between releases. See the [roadmap](ROADMAP.md) and the [milestones](https://github.com/wvssweber-max/HA-Floorplanner/milestones).

## Highlights

| | |
| --- | --- |
| **Draw it yourself** | Walls, rooms and several floors on a snapping grid, in a 2D blueprint editor that is linked live with the 3D view (split view) |
| **Real 3D** | Orbit, pan, zoom; doors and windows cut real openings; low-wall mode; translucent neon hologram design |
| **Home Assistant native** | Every device is bound to an entity; lights glow in their real colour, sensors show values, HA areas group your entities |
| **Whole room at once** | Switch all lights of a room, set colour for all of them and start the room's scenes in one place |
| **Effects and colour** | Colour, brightness and warm/cold white per light; effect lists of Nanoleaf, WLED, Hue and others |
| **Heat and humidity views** | Temperature and humidity colour the rooms |
| **Permissions** | Only administrators edit; everyone else gets a read-only live view, enforced in the backend |
| **Tablets** | One Home Assistant user per wall tablet: starts in its room, sees only the views you allow |
| **Your own models** | 29 built-in objects (lights, furniture, light ball, LED strip …) plus your own `.glb` files |
| **Offline and private** | three.js is bundled, no CDN, no cloud, opens through Ingress in the sidebar |

## Screenshots

| 3D view | 2D blueprint editor |
| --- | --- |
| ![3D](docs/img/3d.png) | ![2D](docs/img/2d.png) |

## Installation

1. In Home Assistant open **Settings → Apps → App store → ⋮ → Repositories**.
2. Add `https://github.com/wvssweber-max/HA-Floorplanner` (or press the button at the top).
3. Reload the store, open **3D Floorplan**, **Install**, **Start** and enable **Show in sidebar**.

Requires Home Assistant OS or Supervised (anything with the Add-on / App store). Details, permissions and tablet setup are in the [documentation](floorplan3d/DOCS.md).

## Try it without Home Assistant

The demo is a single HTML file with an example apartment and simulated lights and sensors:

```bash
cd demo && npm install && npm run build      # → demo/dist/floorplan3d-demo.html
```

Open the file by double-click. Changes are not saved in the demo.

## Quick start

| Action | How |
| --- | --- |
| Tools | Select `V`, Wall `W`, Room `R`, Door/Window `O`, Device `D`, Erase |
| Draw walls / rooms | Click point by point, double-click or `Esc` finishes |
| Move / rotate | Drag it; `Q` / `E` rotate in 15° steps |
| Link an entity | Select a device → search the entity in the properties panel |
| Live mode | Tap a device to control it; tap a room for the whole room |
| Undo | `Ctrl+Z` |

## Documentation

- [User guide](floorplan3d/DOCS.md) – permissions, tablets and views, areas, whole-room control, Nanoleaf, 2D editor
- [Architecture](docs/ARCHITECTURE.md) – how the add-on is built
- [Changelog](CHANGELOG.md) · [Roadmap](ROADMAP.md) · [Security policy](SECURITY.md)

## Development

```bash
pip install -r requirements-dev.txt
pytest -q                                                   # backend tests
DATA_DIR=./data python floorplan3d/rootfs/app/server.py     # http://localhost:8099 (standalone mode)
```

The browser end-to-end tests are described in [tests/e2e/README.md](tests/e2e/README.md). New to Git? Start with the [beginner guide (German)](docs/GIT-EINSTIEG.md).

## Contributing

Bug reports, ideas and pull requests are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md) and the [issue templates](https://github.com/wvssweber-max/HA-Floorplanner/issues/new/choose). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 Florian Weber. Bundles [three.js](https://threejs.org) (MIT).
