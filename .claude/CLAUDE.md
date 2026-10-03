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
