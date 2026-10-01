# Notes for Claude Code
Home Assistant add-on "3D Floorplan": backend floorplan3d/rootfs/app/server.py, frontend floorplan3d/rootfs/app/static/ (app.js main file, plan2d.js 2D editor).
## graphify
A knowledge graph of the code is built at session start in graphify-out/.
- For codebase questions first run `graphify query "<question>"`, `graphify explain "<name>"` or `graphify path "<A>" "<B>"` before reading whole files.
- After changing code run `graphify update .` (no API cost).
