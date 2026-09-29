# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- Hologram theme (new default): translucent blue walls with neon edges, wireframe devices, teal windows, orange doors; active devices and rooms with a light on glow orange (theme *Hologram*, dark and light remain available)
- Navigation pills above the scene: floors, rooms (tap to focus the camera), *Auto* (cutaway) and *Walls high/low*
- Git guide for beginners (`docs/GIT-EINSTIEG.md`)
- Cutaway: walls facing the camera sink down automatically so you can see into the rooms (setting: *Lower walls facing the camera*)
- Single-file demo (`demo/`): the real editor with an example apartment and simulated devices, runs by double-click

### Changed
- Steeper default 3D camera, room names always readable

### Fixed
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
