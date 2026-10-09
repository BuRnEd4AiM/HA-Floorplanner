# Notes for Claude Code
Home Assistant add-on "3D Floorplan": backend floorplan3d/rootfs/app/server.py, frontend floorplan3d/rootfs/app/static/ (app.js main file, plan2d.js 2D editor).
## graphify
A knowledge graph of the code is built at session start in graphify-out/.
- For codebase questions first run `graphify query "<question>"`, `graphify explain "<name>"` or `graphify path "<A>" "<B>"` before reading whole files.
- After changing code run `graphify update .` (no API cost).
## Working with the owner
- The owner is not a developer: explain everything simply in German.
- Always say how to approve a pull request: open the link, "Merge pull request", "Confirm merge".
- Document bugs as GitHub issues and close them when fixed (use "Fixes #n" in the PR).
## Checksums
- After every change in floorplan3d/ (also the version in config.yaml) run `python3 tools/make_manifest.py` and commit floorplan3d/rootfs/app/manifest.json. The tests (tests/test_manifest.py) fail otherwise. The add-on shows the version and checksum in the top bar and compares files, browser and GitHub.
## Code structure (new rule)
- app.js is far too big (see docs/MODULE-PLAN.md for what is already split and what is next). **Every extension goes into a NEW module or into a fitting existing module, never as another large block into app.js.** app.js only gets the import, an `init...({...})` call and the wiring.
- Pure logic (no three.js, no DOM) is kept separate and gets a node unit test in tests/ (like kitchen.js, heatpanel.js) plus a CI step.
- When an existing part of app.js is changed anyway, move that part into a module in the same PR if it is small and safe. Keep docs/MODULE-PLAN.md up to date (move rows from "still in app.js" to "already split").
## Test protocol
- When entering test results in docs/TESTPROTOKOLL.md, only change the result tables, then run `python3 tools/testprotokoll.py`: it rewrites the overview table (counts and open numbers). tests/test_testprotokoll.py fails if it is out of date. Also update the hand-written "Jetzt prüfen" / "Ältere offene Punkte" lists if items in them are done.
- A PR that only changes docs/*.md skips the long e2e job in CI.
