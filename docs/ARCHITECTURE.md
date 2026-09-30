# Architecture

```
Browser (Home Assistant sidebar, Ingress)
 │  ES modules, three.js, no build step
 ▼
server.py  (aiohttp, port 8099)
 ├─ /                 static frontend
 ├─ /api/layout       floors, walls, rooms, devices      → /data/layout.json (first house), /data/layouts/<id>.json
 ├─ /api/houses       house index (several floor plans)  → /data/houses.json
 ├─ /api/backup       export / import everything         → /data/backups/ (safety copies)
 ├─ /api/backgrounds  floor plan templates, wall pictures → /data/backgrounds/
 ├─ /api/settings     look, units, users/rooms/views     → /data/settings.json
 ├─ /api/models       uploaded GLB models                → /data/models/
 ├─ /api/entities     entity list with state             ← Home Assistant REST API
 ├─ /api/areas        HA areas with their entities       ← template API
 ├─ /api/users, /api/me   who is looking, may they edit   ← ingress headers + HA auth list
 └─ /api/service      whitelisted service calls          → Home Assistant REST API
```

## Frontend

| File | Job |
| --- | --- |
| `app.js` | State (layout, selection, settings), 3D scene, live mode, panels, settings dialog |
| `plan2d.js` | SVG blueprint editor, shares the layout with the 3D scene |
| `walls.js` | Wall geometry with door and window openings |
| `models.js` | Built-in furniture and device models, GLB loading |
| `i18n.js` | German and English strings |

The layout is plain JSON: floors → walls (with openings), rooms, devices. Both editors change the same object and call `changed()`, which rebuilds the 3D scene and schedules a save.

## Backend rules

- **Permissions:** administrators (read from Home Assistant) and users in the `editors` option may write; everyone else gets HTTP 403 on every write endpoint.
- **Service calls:** only a fixed set of domains and services, with validated data (brightness, colour, colour temperature, effect, cover position).
- **Standalone mode:** without a `SUPERVISOR_TOKEN` the backend stores layouts but disables entity features, which is what the tests and local development use.

## Tests

`pytest` covers the backend (validation, permissions, admin detection). `tests/e2e` drives the real UI in headless Chromium against the real server and a mock Home Assistant. The demo (`demo/`) runs the same frontend with a fake API for screenshots and quick trials.
