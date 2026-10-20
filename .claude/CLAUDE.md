# Notes for Claude Code
Home Assistant add-on "3D Floorplan": backend floorplan3d/rootfs/app/server.py, frontend floorplan3d/rootfs/app/static/ (app.js main file, plan2d.js 2D editor).
## graphify
A knowledge graph of the code is built at session start in graphify-out/.
- For codebase questions first run `graphify query "<question>"`, `graphify explain "<name>"` or `graphify path "<A>" "<B>"` before reading whole files.
- After changing code run `graphify update .` (no API cost).
## Working with the owner
- Continuing from an earlier chat: read docs/UEBERGABE.md first (state, open questions to the owner, how the example pictures are made, pitfalls).
- The owner is not a developer: explain everything simply in German.
- Always say how to approve a pull request: open the link, "Merge pull request", "Confirm merge".
- Document bugs as GitHub issues and close them when fixed (use "Fixes #n" in the PR).
- Test results (the owner's wish, 2026-10-20): when he tests or asks what to test, ask with the AskUserQuestion tool (a choice in the chat to tap), never as a list he has to type back. One question per test number from docs/TESTPROTOKOLL.md (header = the number, e.g. "74.1"; the question says in short German what to do and what he should see), options "✅ Geht", "❌ Geht nicht", "⏭ Noch nicht getestet"; "Other" lets him write why. At most 4 questions per call: several rounds, the newest section first. Then enter the answers (✅/❌ (date), see "Test protocol"); a ❌ with his text becomes an issue.
## Checksums
- After every change in floorplan3d/ (also the version in config.yaml) run `python3 tools/make_manifest.py` and commit floorplan3d/rootfs/app/manifest.json. The tests (tests/test_manifest.py) fail otherwise. The add-on shows the version and checksum in the top bar and compares files, browser and GitHub.
## Code structure (new rule)
- app.js is far too big (see docs/MODULE-PLAN.md for what is already split and what is next). **Every extension goes into a NEW module or into a fitting existing module, never as another large block into app.js.** app.js only gets the import, an `init...({...})` call and the wiring.
- Pure logic (no three.js, no DOM) is kept separate and gets a node unit test in tests/ (like kitchen.js, heatpanel.js) plus a CI step.
- When an existing part of app.js is changed anyway, move that part into a module in the same PR if it is small and safe. Keep docs/MODULE-PLAN.md up to date (move rows from "still in app.js" to "already split").
## Token count
- Before every `git commit` the hook runs `tools/tokens.py --hook`: it writes this session's token use to docs/tokens/<session>.json and stages it. Commit it, it belongs in every commit. docs/TOKENS.md is written only by the workflow "Token count" after a merge, never edit or commit it in a PR.
## Test protocol
- When entering test results in docs/TESTPROTOKOLL.md, only change the result tables, then run `python3 tools/testprotokoll.py`: it rewrites the overview table (counts and open numbers). tests/test_testprotokoll.py fails if it is out of date. Also update the hand-written "Kurze Prüfliste" / "Ältere offene Punkte" lists if items in them are done.
- A PR that only changes text (*.md in docs/ or the top folder), unit tests (tests/*.mjs, tests/test_*.py) or tools/ skips the browser test in CI.
## Browser test (tests/e2e)
- It is split into parts (tests/e2e/parts/, `tests/e2e/run.sh --list`). CI runs every part as its own job at the same time (a few minutes).
- In a session never run the whole browser test (15-20 minutes here). Run only the parts that cover the change: `tests/e2e/run.sh <part> [<part> ...]` (the test house + those parts, a few minutes each), then push: CI runs all parts.
- A new browser check goes into the part that fits, or into a new numbered file in tests/e2e/parts/ (CI picks it up on its own). A part must pass alone right after parts/base.py: it may use what base.py built, never what another part made. Keep a part under about 3 minutes in CI, split it when it grows.
