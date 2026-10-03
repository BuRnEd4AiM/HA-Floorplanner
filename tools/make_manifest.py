#!/usr/bin/env python3
"""Write floorplan3d/rootfs/app/manifest.json: the checksums of the add-on files. Run it after every change in
floorplan3d/ (the test suite fails when the manifest does not match the files)."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "floorplan3d" / "rootfs" / "app"
sys.path.insert(0, str(APP))
import manifest  # noqa: E402


def version() -> str:
    m = re.search(r'^version:\s*"([^"]+)"', (ROOT / "floorplan3d" / "config.yaml").read_text("utf-8"), re.M)
    if not m:
        raise SystemExit("version not found in floorplan3d/config.yaml")
    return m.group(1)


if __name__ == "__main__":
    data = manifest.build_manifest(APP, version())
    (APP / manifest.NAME).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", "utf-8")
    print(f"manifest.json: version {data['version']}, {len(data['files'])} files, hash {data['buildHash'][:12]}")
