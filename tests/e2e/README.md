# Browser end-to-end test

Drives the real UI in headless Chromium against the real server and a mock Home Assistant.

```bash
pip install playwright aiohttp && playwright install chromium
python make_glb.py                                   # creates tri.glb test model
python mock_ha.py &                                  # fake HA API on :8123
echo '{"editors": ["florian"]}' > /tmp/opts.json           # the test browser acts as user "florian"
DATA_DIR=$(mktemp -d) SUPERVISOR_TOKEN=x HA_API=http://localhost:8123 OPTIONS_FILE=/tmp/opts.json \
  python ../../floorplan3d/rootfs/app/server.py &    # add-on backend on :8099
python test_e2e.py
```

Covers: drawing walls, doors/windows (incl. overlap rejection), GLB upload and placement,
entity binding, settings (language/theme/units), live mode with service call, reload persistence.
