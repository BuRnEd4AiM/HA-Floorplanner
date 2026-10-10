#!/usr/bin/env bash
# Runs the browser test locally: starts the mock Home Assistant and the add-on with an empty data folder, runs test_e2e.py, stops both.
#   tests/e2e/run.sh                the whole test (about 15 minutes in a Claude Code session)
#   tests/e2e/run.sh power roofs    the test house and only these parts (a few minutes): the parts that cover what was changed
#   tests/e2e/run.sh --list         the parts and what each one checks
# Other ports (two runs at the same time): E2E_PORT=8100 MOCK_PORT=8124 tests/e2e/run.sh houses
set -u
cd "$(dirname "$0")"
if [ "${1:-}" = "--list" ] || [ "${1:-}" = "--json" ]; then exec python3 test_e2e.py "$@"; fi
python3 -c "import playwright, aiohttp" 2>/dev/null || pip install -q aiohttp playwright
PORT=${E2E_PORT:-8099}; MPORT=${MOCK_PORT:-8123}
LOGS=$(mktemp -d); DATA=$(mktemp -d)
echo '{"editors": ["admin"]}' > "$LOGS/opts.json"
python3 make_glb.py
MOCK_PORT=$MPORT python3 mock_ha.py > "$LOGS/mock.log" 2>&1 & MOCK=$!
PORT=$PORT DATA_DIR=$DATA SUPERVISOR_TOKEN=x HA_API=http://localhost:$MPORT OPTIONS_FILE=$LOGS/opts.json \
  python3 ../../floorplan3d/rootfs/app/server.py > "$LOGS/server.log" 2>&1 & SERVER=$!
trap 'kill $MOCK $SERVER 2>/dev/null; rm -rf "$DATA"' EXIT
for i in $(seq 1 30); do curl -s -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done
E2E_URL=http://localhost:$PORT/ MOCK_HA_URL=http://localhost:$MPORT python3 -u test_e2e.py "$@"
code=$?
[ $code -eq 0 ] || { echo "--- server log ($LOGS/server.log)"; tail -n 30 "$LOGS/server.log"; }
exit $code
