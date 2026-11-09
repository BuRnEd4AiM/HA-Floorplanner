#!/usr/bin/env python3
"""Normal and Beta (5.2.0): give a version to everyone.

The store has two add-ons. floorplan3d/ is the beta: every merged version lands there at once ("3D Floorplan Beta", slug floorplan3d_beta,
shown in the store only with Advanced mode). floorplan3d-stable/ is the normal add-on everybody has ("3D Floorplan", slug floorplan3d, the
slug it always had): a copy of floorplan3d/ as it was at a released version. Home Assistant builds both the same way; only the names and
FP_CHANNEL (the Dockerfile) differ. Releasing a version is copying it: one commit, and every normal add-on offers the update.

    python3 tools/stable.py                     the released version and the newest one
    python3 tools/stable.py release 5.3.0       copy floorplan3d/ as it was last at version 5.3.0 on main into floorplan3d-stable/
    python3 tools/stable.py release 5.3.0 --worktree   the same from the files here (the very first copy, and the tests)
    python3 tools/stable.py release 5.3.0 --again      copy the version the normal add-on has once more (a copy that went wrong)
    python3 tools/stable.py check               is floorplan3d-stable/ a whole copy (its files match its manifest, the names are right)

The workflow "Release to everyone" (.github/workflows/stable.yml) runs `release` on main, commits the copy and makes that version the
latest GitHub release (HACS gives the dashboard card of the latest release). Never edit floorplan3d-stable/ by hand: the tests compare it
with its own manifest."""
import io
import json
import re
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BETA_DIR, STABLE_DIR = "floorplan3d", "floorplan3d-stable"
NAME, SLUG = "3D Floorplan", "floorplan3d"
BETA_NAME, BETA_SLUG = "3D Floorplan Beta", "floorplan3d_beta"
NOTE = "release.json"
BETA_TEXT = "Beta: every new version at once, to test it before everyone gets it. "   # the start of the beta's description
HEAD = ("# The NORMAL add-on: a copy of floorplan3d/ (the beta) at version {v}, written by tools/stable.py.\n"
        "# Do not edit: change floorplan3d/, then release the version (workflow \"Release to everyone\").\n")


def key(v: str):
    return tuple(int(x) for x in v.split("."))


def version_of(config_text: str) -> str:
    m = re.search(r'^version:\s*"([^"]+)"', config_text, re.M)
    if not m:
        raise ValueError("no version in config.yaml")
    return m.group(1)


def stable_config(text: str) -> str:
    """the beta's config.yaml as the normal add-on's: its old name and slug, its own panel title, no stage, without "Beta" in the text"""
    out, seen = [], set()
    lines = text.splitlines()
    while lines and lines[0].startswith("#"):          # the beta's own note on top
        lines.pop(0)
    for line in lines:
        k = line.split(":", 1)[0] if line and not line[0].isspace() and ":" in line else None
        if k == "stage":
            continue
        if k == "name":
            line = f'name: "{NAME}"'
        elif k == "slug":
            line = f"slug: {SLUG}"
        elif k == "panel_title":
            line = f'panel_title: "{NAME}"'
        elif k == "description":
            line = line.replace(BETA_TEXT, "", 1)
        if k:
            seen.add(k)
        out.append(line)
    missing = {"name", "slug", "panel_title", "version"} - seen
    if missing:
        raise ValueError(f"config.yaml has no {', '.join(sorted(missing))}")
    return HEAD.format(v=version_of(text)) + "\n".join(out) + "\n"


def stable_dockerfile(text: str) -> str:
    if "ENV FP_CHANNEL=beta" not in text:
        raise ValueError("the beta's Dockerfile does not set ENV FP_CHANNEL=beta")
    return text.replace("ENV FP_CHANNEL=beta", "ENV FP_CHANNEL=stable")


def git(*args, binary=False, repo: Path = ROOT):
    r = subprocess.run(["git", *args], cwd=repo, capture_output=True, check=True)
    return r.stdout if binary else r.stdout.decode()


def last_commit_with(version: str, head: str = "HEAD", repo: Path = ROOT) -> str:
    """the newest commit on main (first parents: the merges) whose floorplan3d/config.yaml has this version: the version with all that came
    for it before the next version, not the first commit of its pull request (where the GitHub tag sits)"""
    commits = git("rev-list", "--first-parent", head, repo=repo).split()
    for c in commits:
        try:
            v = version_of(git("show", f"{c}:{BETA_DIR}/config.yaml", repo=repo))
        except (subprocess.CalledProcessError, ValueError):
            continue
        if v == version:
            return c
        if key(v) < key(version):              # older versions from here on: it was never on main
            break
    raise SystemExit(f"version {version} was never in {BETA_DIR}/config.yaml on main")


def files_at(ref: str, repo: Path = ROOT) -> dict:
    """{path below floorplan3d/: (bytes, mode)} of a commit"""
    data = git("archive", "--format=tar", ref, BETA_DIR, binary=True, repo=repo)
    out = {}
    with tarfile.open(fileobj=io.BytesIO(data)) as tar:
        for m in tar.getmembers():
            if m.isfile():
                out[m.name[len(BETA_DIR) + 1:]] = (tar.extractfile(m).read(), m.mode)
    return out


def files_here() -> dict:
    """the same from the files in the working tree (only what git tracks or would add: no caches)"""
    names = git("ls-files", "--cached", "--others", "--exclude-standard", BETA_DIR).splitlines()
    out = {}
    for n in names:
        p = ROOT / n
        if p.is_file():
            out[n[len(BETA_DIR) + 1:]] = (p.read_bytes(), p.stat().st_mode & 0o777)
    return out


def current(root: Path = ROOT):
    """the version the normal add-on has now (None before the first copy)"""
    p = root / STABLE_DIR / "config.yaml"
    return version_of(p.read_text("utf-8")) if p.is_file() else None


def release(version: str, files: dict, source: str, root: Path = ROOT, again: bool = False) -> None:
    """write floorplan3d-stable/ from the beta's files of this version"""
    cfg = files.get("config.yaml")
    if not cfg:
        raise SystemExit("no config.yaml in the files")
    if version_of(cfg[0].decode()) != version:
        raise SystemExit(f"those files are version {version_of(cfg[0].decode())}, not {version}")
    if f"## [{version}]" not in (files.get("CHANGELOG.md") or (b"", 0))[0].decode():
        raise SystemExit(f"CHANGELOG.md of that version has no entry for {version}")
    now = current(root)
    if now and (key(version) < key(now) or (key(version) == key(now) and not again)):
        raise SystemExit(f"the normal add-on has {now} already: Home Assistant offers only newer versions")
    out = root / STABLE_DIR
    if out.exists():
        shutil.rmtree(out)
    for name, (data, mode) in sorted(files.items()):
        if name == "config.yaml":
            data = stable_config(data.decode()).encode()
        elif name == "Dockerfile":
            data = stable_dockerfile(data.decode()).encode()
        p = out / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        p.chmod(mode | 0o644)
    (out / NOTE).write_text(json.dumps({"version": version, "from": source,
                                         "note": "the normal add-on, written by tools/stable.py: do not edit"}, indent=1) + "\n", "utf-8")


def check(root: Path = ROOT) -> list:
    """what is wrong with floorplan3d-stable/ (empty: nothing)"""
    out = root / STABLE_DIR
    if not (out / "config.yaml").is_file():
        return [f"{STABLE_DIR}/config.yaml is missing"]
    bad = []
    cfg = (out / "config.yaml").read_text("utf-8")
    v = version_of(cfg)
    for want in (f'name: "{NAME}"', f"slug: {SLUG}", f'panel_title: "{NAME}"'):
        if not re.search(rf"^{re.escape(want)}$", cfg, re.M):
            bad.append(f"config.yaml: not {want}")
    if re.search(r"^stage:", cfg, re.M):
        bad.append("config.yaml: the normal add-on has no stage")
    if "ENV FP_CHANNEL=stable" not in (out / "Dockerfile").read_text("utf-8"):
        bad.append("Dockerfile: ENV FP_CHANNEL=stable is missing")
    note = json.loads((out / NOTE).read_text("utf-8")) if (out / NOTE).is_file() else {}
    if note.get("version") != v:
        bad.append(f"{NOTE}: version {note.get('version')} instead of {v}")
    sys.path.insert(0, str(out / "rootfs" / "app"))
    try:
        import manifest as mf
    finally:
        sys.path.pop(0)
    m = mf.load_manifest(out / "rootfs" / "app")
    if not m or m.get("version") != v:
        bad.append(f"manifest.json: version {(m or {}).get('version')} instead of {v}")
    elif not (res := mf.compare(out / "rootfs" / "app", m))["ok"]:
        bad.append(f"files differ from the manifest: {res['changed'] + res['missing'] + res['extra']}")
    return bad


def main(argv):
    if not argv:
        beta = version_of((ROOT / BETA_DIR / "config.yaml").read_text("utf-8"))
        print(f"normal add-on (everyone): {current() or '-'}\nbeta (newest):            {beta}")
        return 0
    if argv[0] == "check":
        bad = check()
        print("\n".join(bad) or f"{STABLE_DIR}/ is a whole copy of version {current()}")
        return 1 if bad else 0
    if argv[0] == "release" and len(argv) >= 2 and re.fullmatch(r"\d+\.\d+\.\d+", argv[1].lstrip("v")):
        version = argv[1].lstrip("v")
        if "--worktree" in argv:
            files, source = files_here(), "worktree"
        else:
            commit = last_commit_with(version)
            files, source = files_at(commit), commit
        release(version, files, source, again="--again" in argv)
        bad = check()
        if bad:
            print("\n".join(bad))
            return 1
        print(f"{STABLE_DIR}/ is now version {version} (from {source})")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
