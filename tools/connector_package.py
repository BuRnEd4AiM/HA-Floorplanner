#!/usr/bin/env python3
"""Pack the Home Assistant integration for Docker (#744) as the release's floorplan3d-connector.zip, with its SHA-256.

    python3 tools/connector_package.py --out DIR [--ref COMMIT] [--version 5.9.0]

The zip holds custom_components/floorplan3d/ (unpack it in Home Assistant's config folder), from the commit COMMIT (the workflow
"Release": the commit of that version) or, without --ref, from this checkout. The same commit always gives the same bytes (sorted
entries, the commit's time on every file), so the checksum can be compared with a zip built again. With --version it refuses a commit
whose integration has another version (versions before 5.9.0 had their own numbering): exit code 1, nothing written.

Writes DIR/floorplan3d-connector.zip and DIR/floorplan3d-connector.zip.sha256 ("<hash>  floorplan3d-connector.zip", for
`sha256sum -c`), and prints the hash. tests/test_connector_package.py.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "container/custom_components/floorplan3d"
PREFIX = "custom_components/floorplan3d"
ZIP_NAME = "floorplan3d-connector.zip"


def _git(*args: str, binary: bool = False):
    out = subprocess.run(["git", "-C", str(ROOT), *args], check=True, capture_output=True).stdout
    return out if binary else out.decode("utf-8")


def files_at(ref: str | None) -> tuple[dict[str, bytes], int]:
    """the integration's files (path below SOURCE -> content) and the time to stamp them with, from a commit or this checkout"""
    if ref is None:
        base = ROOT / SOURCE
        files = {p.relative_to(base).as_posix(): p.read_bytes() for p in sorted(base.rglob("*"))
                 if p.is_file() and "__pycache__" not in p.parts and p.suffix != ".pyc"}
        return files, 315532800                     # 1980-01-01: the earliest a zip can say
    names = [n for n in _git("ls-tree", "-r", "--name-only", ref, "--", SOURCE).splitlines() if n]
    files = {n[len(SOURCE) + 1:]: _git("show", f"{ref}:{n}", binary=True) for n in names}
    return files, int(_git("show", "-s", "--format=%ct", ref).strip())


def build(files: dict[str, bytes], stamp: int) -> bytes:
    """the zip's bytes: sorted, every entry with the same time and the same rights, so equal files give an equal zip"""
    from io import BytesIO
    buf = BytesIO()
    when = time.gmtime(max(stamp, 315532800))[:6]
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in sorted(files):
            info = zipfile.ZipInfo(f"{PREFIX}/{name}", date_time=when)
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, files[name])
    return buf.getvalue()


def manifest_version(files: dict[str, bytes]) -> str | None:
    try:
        return str(json.loads(files["manifest.json"].decode("utf-8"))["version"])
    except (KeyError, ValueError, TypeError):
        return None


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--ref", help="a commit (default: this checkout)")
    ap.add_argument("--version", help="refuse an integration with another version")
    a = ap.parse_args(argv)
    try:
        files, stamp = files_at(a.ref)
    except subprocess.CalledProcessError as err:
        print(f"no integration at {a.ref}: {err.stderr.decode('utf-8', 'replace').strip()}", file=sys.stderr)
        return 1
    if "manifest.json" not in files or "__init__.py" not in files:
        print(f"no integration at {a.ref or 'this checkout'} ({SOURCE})", file=sys.stderr)
        return 1
    have = manifest_version(files)
    if a.version and have != a.version.lstrip("v"):
        print(f"the integration at {a.ref or 'this checkout'} has version {have}, not {a.version}: no package", file=sys.stderr)
        return 1
    data = build(files, stamp)
    digest = hashlib.sha256(data).hexdigest()
    a.out.mkdir(parents=True, exist_ok=True)
    (a.out / ZIP_NAME).write_bytes(data)
    (a.out / f"{ZIP_NAME}.sha256").write_text(f"{digest}  {ZIP_NAME}\n", "utf-8")
    print(f"{ZIP_NAME}: version {have}, {len(files)} files, sha256 {digest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
