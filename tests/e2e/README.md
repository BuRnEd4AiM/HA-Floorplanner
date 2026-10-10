# Browser end-to-end test

Drives the real UI in headless Chromium against the real server and a mock Home Assistant.

The checks are split into parts in [`parts/`](parts/):

- `parts/base.py` builds the test house through the interface (walls, doors, devices, 2D editor, floors, roof ...).
  It always runs first, every other part works in this house.
- `parts/01_*.py`, `parts/02_*.py` ... are the parts. Each one runs on its own right after `base.py`: it may use what
  `base.py` made, never what another part made. `python test_e2e.py --list` shows what each part checks.

```bash
./run.sh                    # the whole test: the house and every part (about 15-20 minutes on a small machine)
./run.sh power roofs        # the house and only these parts (a few minutes): the parts that cover what was changed
./run.sh --list             # the parts
```

`run.sh` installs Playwright if it is missing, starts the mock Home Assistant (`mock_ha.py`, port 8123) and the add-on
(port 8099) with an empty data folder, runs `test_e2e.py` and stops both again. Other ports, for two runs at the same time:
`E2E_PORT=8100 MOCK_PORT=8124 ./run.sh houses`. Without the script:

```bash
pip install playwright aiohttp && playwright install chromium
python make_glb.py                                   # creates tri.glb test model
python mock_ha.py &                                  # fake HA API on :8123
echo '{"editors": ["admin"]}' > /tmp/opts.json           # the test browser acts as user "admin"
DATA_DIR=$(mktemp -d) SUPERVISOR_TOKEN=x HA_API=http://localhost:8123 OPTIONS_FILE=/tmp/opts.json \
  python ../../floorplan3d/rootfs/app/server.py &    # add-on backend on :8099
python test_e2e.py                                   # or: python test_e2e.py power roofs
```

In CI (`.github/workflows/ci.yml`) every part is its own job (`e2e 01_...`, `e2e 02_...` ...), all at the same time, each
with a fresh server: the whole browser test takes a few minutes instead of about 13. The job `e2e` collects their results.
A new numbered file in `parts/` is picked up by CI on its own. Keep a part under about 3 minutes and split it when it grows.
