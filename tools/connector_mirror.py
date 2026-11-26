#!/usr/bin/env python3
"""Keep the HACS repository of the Home Assistant integration for Docker in step with HA-Floorplanner's releases (#744).

HACS has HA-Floorplanner in its store as a Dashboard (the add-on's card), and HACS knows a repository under one type only: the
integration in the same repository can be neither found nor added there ("exists in the store"). So the integration has a small
repository of its own (default: BuRnEd4AiM/HA-Floorplanner-Connector) with custom_components/floorplan3d/, hacs.json and a README.
Its workflow (the template: container/connector-repo/.github/workflows/sync.yml) fetches this script from HA-Floorplanner's main and
runs it every hour, inside its own checkout:

- every release of HA-Floorplanner from 5.9.0 on that it does not have yet and that is newer than its newest (oldest first): the
  integration of that tag goes into custom_components/floorplan3d/ with README.md and hacs.json from container/connector-repo/, then a
  commit, the tag v<version> and a release (a pre-release when it is one there: HACS offers those only with its beta versions on);
- a release that is a pre-release there or not any more ("Release to everyone") changes here too, and HA-Floorplanner's latest release
  is the latest here (that is the one HACS offers).
- a run that stopped after pushing the tag but before its release is finished by the next one (#809: `gh release create` failed once,
  and every later run then stopped at `git tag` because the tag was there already): a tag that is here already only gets its release.
  `gh release create` is tried a few times (a tag that was just pushed is not always visible to it at once), commit and tag go up in
  one atomic push, and a failing git or gh command prints what it said.

    python3 connector_mirror.py [--source BuRnEd4AiM/HA-Floorplanner] [--dry-run]

Needs git and gh (GH_TOKEN with contents: write on this repository). tests/test_connector_mirror.py.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

SOURCE = "BuRnEd4AiM/HA-Floorplanner"
PACKAGE = "container/custom_components/floorplan3d"
TEMPLATE = "container/connector-repo"
TEMPLATE_FILES = ("README.md", "hacs.json")         # not the workflow: a workflow's own token may not change workflows
TARGET = "custom_components/floorplan3d"
FIRST = (5, 9, 0)                                   # before 5.9.0 the integration had its own version numbers
WAITS = (5, 15, 30)                                 # seconds before the 2nd, 3rd and 4th try of `gh release create`


def version(tag) -> tuple[int, ...] | None:
    """v5.9.0 -> (5, 9, 0); anything that is not such a tag -> None"""
    m = re.fullmatch(r"v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})", str(tag or ""))
    return tuple(int(x) for x in m.groups()) if m else None


def plan(source: list[dict], mirrored: dict[str, bool], latest: str | None):
    """what to do, pure: (the releases to create, oldest first; {tag: prerelease} to change; the tag to make the latest or None).

    source: HA-Floorplanner's releases ({"tag_name", "prerelease", "draft"}); mirrored: this repository's releases {tag: prerelease};
    latest: HA-Floorplanner's latest release (its tag)."""
    wanted = {r["tag_name"]: bool(r.get("prerelease")) for r in source
              if not r.get("draft") and version(r.get("tag_name")) and version(r["tag_name"]) >= FIRST}
    newest = max((version(t) for t in mirrored if version(t)), default=None)
    create = sorted((t for t in wanted if t not in mirrored and (newest is None or version(t) > newest)), key=version)
    flags = {t: pre for t, pre in wanted.items() if t in mirrored and mirrored[t] != pre}
    make_latest = latest if latest in wanted and (latest in mirrored or latest in create) else None
    return create, flags, make_latest


def notes(tag: str, source: str) -> str:
    v = tag.lstrip("v")
    return (f"The Home Assistant integration of [3D Floorplan {v}](https://github.com/{source}/releases/tag/{tag}), for Home Assistant "
            f"Container (Docker without the Supervisor).\n\nIt belongs to the container of the same version: update both "
            f"(`docker compose pull && docker compose up -d` for the container, then restart Home Assistant). What is new: the link above.")


def _run(cmd: list[str], cwd: Path, quiet: bool = False) -> bytes:
    """the command's output; when it fails, what it said goes to the log first (the traceback alone does not show it, #809)"""
    try:
        return subprocess.run(cmd, cwd=cwd, check=True, capture_output=True).stdout
    except subprocess.CalledProcessError as e:
        if not quiet:
            said = b"\n".join(x.strip() for x in (e.stderr or b"", e.stdout or b"") if x.strip()).decode("utf-8", "replace")
            print(f"{cmd[0]} {cmd[1]} failed (exit {e.returncode}): {said or '(it said nothing)'}", file=sys.stderr, flush=True)
        raise


class Runner:
    """git and gh; the tests replace gh"""

    def __init__(self, repo: Path, dry_run: bool = False) -> None:
        self.repo, self.dry_run = repo, dry_run

    def git(self, *args: str, cwd: Path | None = None, binary: bool = False, quiet: bool = False):
        out = _run(["git", *args], cwd or self.repo, quiet)
        return out if binary else out.decode("utf-8")

    def gh(self, *args: str, write: bool = False, quiet: bool = False) -> str:
        if write and self.dry_run:
            print("would run: gh", " ".join(args))
            return ""
        return _run(["gh", *args], self.repo, quiet).decode("utf-8")

    def wait(self, seconds: float) -> None:
        time.sleep(seconds)

    def releases(self, repo: str) -> list[dict]:
        out = self.gh("api", f"repos/{repo}/releases?per_page=100", "--paginate", "--jq", ".[] | {tag_name, prerelease, draft}")
        return [json.loads(line) for line in out.splitlines() if line.strip()]

    def latest(self, repo: str) -> str | None:
        try:
            return self.gh("api", f"repos/{repo}/releases/latest", "--jq", ".tag_name", quiet=True).strip() or None
        except subprocess.CalledProcessError:
            return None

    def has_tag(self, tag: str) -> bool:
        """the tag is here already (actions/checkout with fetch-depth 0 brings all of them)"""
        try:
            self.git("rev-parse", "--quiet", "--verify", f"refs/tags/{tag}", quiet=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def has_release(self, tag: str) -> bool:
        try:
            self.gh("release", "view", tag, "--json", "tagName", quiet=True)
            return True
        except subprocess.CalledProcessError:
            return False


def create_release(run: Runner, tag: str, *args: str) -> None:
    """gh release create, tried len(WAITS) + 1 times: just after the push GitHub does not always know the tag yet (--verify-tag), or
    it answers with an error. A release that is there after a failed try counts as made (#809)."""
    for wait in (*WAITS, None):
        try:
            run.gh("release", "create", tag, *args, write=True)
            return
        except subprocess.CalledProcessError:
            if run.has_release(tag):
                return
            if wait is None:
                raise
            print(f"{tag}: the release failed, trying again in {wait} s", flush=True)
            run.wait(wait)


def package_at(run: Runner, src: Path, tag: str) -> dict[str, bytes] | None:
    """the integration's files at that tag (path below it -> content, plus the template files under their own names), or None when the
    tag has none or one with another version"""
    try:
        names = [n for n in run.git("ls-tree", "-r", "--name-only", tag, "--", PACKAGE, cwd=src).splitlines() if n]
        files = {f"{TARGET}/{n[len(PACKAGE) + 1:]}": run.git("show", f"{tag}:{n}", cwd=src, binary=True) for n in names}
    except subprocess.CalledProcessError:
        return None
    try:
        if str(json.loads(files[f"{TARGET}/manifest.json"])["version"]) != tag.lstrip("v"):
            return None
    except (KeyError, ValueError):
        return None
    for name, path in [*((n, f"{TEMPLATE}/{n}") for n in TEMPLATE_FILES), ("LICENSE", "LICENSE")]:
        try:
            files[name] = run.git("show", f"{tag}:{path}", cwd=src, binary=True)
        except subprocess.CalledProcessError:
            pass
    return files


def write_files(repo: Path, files: dict[str, bytes]) -> None:
    shutil.rmtree(repo / TARGET, ignore_errors=True)
    for name, data in files.items():
        path = repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def sync(run: Runner, source: str, source_url: str, dest: str) -> int:
    mirrored = {r["tag_name"]: bool(r.get("prerelease")) for r in run.releases(dest) if not r.get("draft")}
    theirs = run.releases(source)
    create, flags, make_latest = plan(theirs, mirrored, run.latest(source))
    print(f"{source} -> {dest}: create {create or 'nothing'}, change {flags or 'nothing'}, latest {make_latest or '-'}")
    source_releases = {r["tag_name"]: bool(r.get("prerelease")) for r in theirs}
    done = set(mirrored)
    if create:
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "source"
            run.git("clone", "--quiet", "--no-checkout", "--filter=blob:none", source_url, str(src), cwd=Path(tmp))
            branch = run.git("rev-parse", "--abbrev-ref", "HEAD").strip()
            for tag in create:
                if run.has_tag(tag):
                    # an earlier run pushed it and stopped before the release (#809): only the release is missing
                    print(f"{tag}: the tag is here already, only its release is made")
                    if not run.dry_run:
                        run.git("push", "--quiet", "origin", tag)       # nothing to do when GitHub has it; a local one goes up
                else:
                    files = package_at(run, src, tag)
                    if files is None:
                        print(f"{tag}: no integration with this version there, skipped")
                        continue
                    write_files(run.repo, files)
                    run.git("add", "-A", "--", TARGET, *[n for n in (*TEMPLATE_FILES, "LICENSE") if n in files])
                    if run.git("status", "--porcelain").strip():
                        run.git("commit", "--quiet", "-m", f"3D Floorplan Connector {tag.lstrip('v')}")
                    if not run.dry_run:
                        run.git("tag", tag)
                        run.git("push", "--quiet", "--atomic", "origin", f"HEAD:{branch}", tag)
                pre = ["--prerelease"] if source_releases.get(tag) else []
                create_release(run, tag, "--verify-tag", "--title", f"3D Floorplan Connector {tag.lstrip('v')}",
                               "--notes", notes(tag, source), "--latest=false", *pre)
                done.add(tag)
                print(f"{tag}: released{' (pre-release)' if pre else ''}")
    for tag, pre in flags.items():
        run.gh("release", "edit", tag, f"--prerelease={'true' if pre else 'false'}", write=True)
        print(f"{tag}: pre-release {pre}")
    if make_latest and make_latest in done and run.latest(dest) != make_latest:
        run.gh("release", "edit", make_latest, "--prerelease=false", "--latest", write=True)
        print(f"{make_latest}: the latest one")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--source", default=SOURCE, help="owner/name of HA-Floorplanner")
    ap.add_argument("--dest", default=os.environ.get("GITHUB_REPOSITORY", ""), help="owner/name of this repository")
    ap.add_argument("--dry-run", action="store_true", help="commit locally, but push, tag and release nothing")
    a = ap.parse_args(argv)
    if not a.dest:
        ap.error("--dest is needed outside GitHub Actions")
    return sync(Runner(Path.cwd(), a.dry_run), a.source, f"https://github.com/{a.source}.git", a.dest)


if __name__ == "__main__":
    sys.exit(main())
