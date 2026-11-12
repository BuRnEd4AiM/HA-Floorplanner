#!/usr/bin/env python3
"""Write floorplan3d/rootfs/app/manifest.json: the checksums of the add-on files. Run it after every change in
floorplan3d/ (the test suite fails when the manifest does not match the files).

It also gives the Home Assistant integration for Docker (container/custom_components/floorplan3d/manifest.json) the same version
(#744): both come out of the same release, the integration compares its version with the container's, and HACS and the release
name the same number."""
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


CONNECTOR = ROOT / "container" / "custom_components" / "floorplan3d" / "manifest.json"


def write_connector_version(v: str, path: Path = CONNECTOR) -> bool:
    """the integration's manifest.json with version v (only that line changes, the rest stays as written); True when it changed"""
    text = path.read_text("utf-8")
    new = re.sub(r'("version"\s*:\s*)"[^"]*"', lambda m: f'{m.group(1)}"{v}"', text, count=1)
    if new == text:
        return False
    path.write_text(new, "utf-8")
    return True


if __name__ == "__main__":
    data = manifest.build_manifest(APP, version())
    (APP / manifest.NAME).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", "utf-8")
    print(f"manifest.json: version {data['version']}, {len(data['files'])} files, hash {data['buildHash'][:12]}")
    if write_connector_version(data["version"]):
        print(f"container/custom_components/floorplan3d/manifest.json: version {data['version']}")
