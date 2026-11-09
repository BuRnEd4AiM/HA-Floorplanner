"""Checksums of the add-on files: a manifest is committed with the code (tools/make_manifest.py), the running add-on
compares the files it really has with it, the browser compares the files it really loaded, and the add-on can compare
the manifest with the one on GitHub. So "is this the version I think it is?" has a checkable answer."""
import hashlib
import json
from pathlib import Path

NAME = "manifest.json"
SKIP_DIRS = {"__pycache__"}
SKIP_FILES = {NAME}
SKIP_SUFFIX = {".pyc", ".tmp"}


def file_hashes(app_dir: Path) -> dict:
    """sha256 of every file of the app folder, keyed by the relative path (forward slashes)."""
    out = {}
    for f in sorted(Path(app_dir).rglob("*")):
        rel = f.relative_to(app_dir)
        if not f.is_file() or f.name in SKIP_FILES or f.suffix in SKIP_SUFFIX or any(p in SKIP_DIRS for p in rel.parts):
            continue
        out[rel.as_posix()] = hashlib.sha256(f.read_bytes()).hexdigest()
    return out


def build_hash(version: str, files: dict) -> str:
    """One checksum over the version and all file checksums."""
    h = hashlib.sha256(version.encode("utf-8"))
    for name in sorted(files):
        h.update(f"\n{name}:{files[name]}".encode("utf-8"))
    return h.hexdigest()


def build_manifest(app_dir: Path, version: str) -> dict:
    files = file_hashes(app_dir)
    return {"version": version, "buildHash": build_hash(version, files), "files": files}


def load_manifest(app_dir: Path):
    try:
        data = json.loads((Path(app_dir) / NAME).read_text("utf-8"))
        if isinstance(data, dict) and isinstance(data.get("files"), dict) and isinstance(data.get("buildHash"), str):
            return data
    except (OSError, ValueError):
        pass
    return None


def compare(app_dir: Path, manifest: dict) -> dict:
    """Compare the files that are really there with the manifest."""
    now = file_hashes(app_dir)
    want = manifest["files"]
    changed = sorted(n for n in want if n in now and now[n] != want[n])
    missing = sorted(n for n in want if n not in now)
    extra = sorted(n for n in now if n not in want)
    return {"ok": not changed and not missing and not extra, "changed": changed, "missing": missing, "extra": extra, "files": len(want)}


def version_tuple(v: str):
    try:
        return tuple(int(x) for x in str(v).split("."))
    except ValueError:
        return ()


def relation(local: dict, remote: dict) -> str:
    """same | behind (GitHub is newer) | differs (other content, same or older version)"""
    if remote.get("buildHash") == local.get("buildHash"):
        return "same"
    rv, lv = version_tuple(remote.get("version", "")), version_tuple(local.get("version", ""))
    return "behind" if rv and lv and rv > lv else "differs"
