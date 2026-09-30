#!/usr/bin/env bash
# Creates labels, milestones, roadmap issues and releases for the repository. Safe to run again (skips what exists).
# Runs in GitHub Actions (workflow "Project setup") with the built-in GITHUB_TOKEN. Needs: gh, jq, full git history.
set -euo pipefail
REPO="${GITHUB_REPOSITORY:?}"

echo "== Labels"
while IFS=$'\t' read -r name color desc; do
  [ -z "${name:-}" ] && continue
  gh label create "$name" --color "$color" --description "$desc" --force >/dev/null && echo "  $name"
done < .github/labels.tsv

echo "== Milestones"
milestone() {   # title, description
  if gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$1"; then echo "  exists: $1"
  else gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null && echo "  created: $1"; fi
}
milestone "v0.8 – Live sync"        "Live state updates via WebSocket, native more-info dialog, faster setup of rooms."
milestone "v0.9 – Dashboards"       "HACS card to show the floor plan on any dashboard, furniture library, power visualisation."
milestone "v1.0 – Stable release"   "Verified on real Home Assistant installs, backup/export, complete docs."
milestone "Backlog"                 "Ideas without a date."

echo "== Issues"
EXISTING="$(gh issue list --state all --limit 300 --json title --jq '.[].title')"
issue() {       # title, milestone, labels (comma separated), body
  if printf '%s\n' "$EXISTING" | grep -Fxq "$1"; then echo "  exists: $1"; return; fi
  gh issue create --title "$1" --milestone "$2" --label "$3" --body "$4" >/dev/null && echo "  created: $1"
}
issue "Live state updates via WebSocket instead of polling" "v0.8 – Live sync" "enhancement,area: backend,area: live" \
"Today the frontend polls \`/api/entities\` every few seconds. Subscribe to Home Assistant's \`state_changed\` events over the WebSocket API (server side) and push them to the browser (SSE or WebSocket).

- [ ] Backend keeps one WebSocket connection to Home Assistant
- [ ] Browsers receive only changes
- [ ] Polling stays as fallback"
issue "Native Home Assistant more-info dialog for tapped devices" "v0.8 – Live sync" "enhancement,area: live" \
"Tapping a device in live mode should be able to open the standard Home Assistant more-info dialog (history, all attributes) in addition to the built-in quick controls."
issue "Auto-place all entities of an area" "v0.8 – Live sync" "enhancement,area: home-assistant" \
"Button in the room properties: place every not yet placed entity of the linked HA area in the room in one step (grid layout, sensible device type per domain), so a new room is usable in seconds."
issue "Test protocol on a real Home Assistant (ingress, editors, areas)" "v1.0 – Stable release" "testing,area: home-assistant" \
"Everything so far was tested against a mock Home Assistant. Please verify on a real installation and report results here:

- [ ] Add-on installs from the repository and starts
- [ ] Panel opens through Ingress, sidebar entry visible
- [ ] Administrators can edit; a normal user only gets the read-only live view
- [ ] \`editors\` option grants editing to a non-admin
- [ ] HA areas appear in the room properties and entity pickers
- [ ] Lights, scenes, covers and effects (Nanoleaf) can be controlled
- [ ] Tablet user with room assignment starts in its room"
issue "Layout backup: export and import as file" "v1.0 – Stable release" "enhancement,area: backend" \
"Download the layout (walls, rooms, devices, settings) as one JSON file and import it again, for backups and for moving to another Home Assistant."
issue "HACS Lovelace card to show the floor plan on dashboards" "v0.9 – Dashboards" "enhancement,area: home-assistant" \
"A custom card (\`custom:floorplan3d-card\`) that renders the live view on any dashboard, read-only, with tap to control. Distributed through HACS."
issue "Glowing floor cables with watt display" "v0.9 – Dashboards" "enhancement,area: 3d" \
"Draw cables along the floor between devices and a distribution point; brightness/pulse follows the power sensor (W) of the linked entity."
issue "Furniture library with previews" "v0.9 – Dashboards" "enhancement,area: 3d" \
"Thumbnail previews in the device palette, search and categories (living, kitchen, bath, lighting)."
issue "Multi-segment LED strips and Nanoleaf panel shapes" "Backlog" "enhancement,area: 3d" \
"Strips that follow several walls (polyline) and Nanoleaf panels (triangles, hexagons, lines) as placeable shapes."
issue "Automatic room detection from closed wall loops" "Backlog" "enhancement,area: 2d" \
"Draw walls first, then create rooms automatically for every closed loop."
issue "Import a background image / blueprint for tracing" "Backlog" "enhancement,area: 2d" \
"Load a floor plan image as underlay in the 2D editor with scale and opacity, to trace walls."
issue "More languages (translations)" "Backlog" "enhancement,good first issue,help wanted,documentation" \
"The UI strings live in \`floorplan3d/rootfs/app/static/i18n.js\` (German, English and Polish). Add your language by copying the English block."

echo "== Releases"
LATEST=""
versions="$(grep -oE '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' CHANGELOG.md | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"
LATEST="$(printf '%s\n' "$versions" | head -1)"
for v in $versions; do
  if gh release view "v$v" >/dev/null 2>&1; then echo "  exists: v$v"; continue; fi
  sha="$(git log --reverse --format=%H -S"version: \"$v\"" -- floorplan3d/config.yaml 2>/dev/null | head -1 || true)"
  if [ -z "$sha" ]; then echo "  skipped v$v (no commit found)"; continue; fi
  notes="$(awk -v v="$v" '$0 ~ "^## \\["v"\\]" {p=1; next} /^## \[/ {p=0} p' CHANGELOG.md)"
  flag=""; [ "$v" = "$LATEST" ] && flag="--latest"
  gh release create "v$v" --target "$sha" --title "3D Floorplan $v" --notes "${notes:-See CHANGELOG.md}" $flag >/dev/null && echo "  created: v$v"
done
echo "Done."
