"""Which GitHub releases are missing (used by .github/workflows/release.yml).

Several merges in a row used to cancel each other's release run (GitHub keeps only one waiting run per queue), so versions were
skipped. Every release run now creates all missing ones: the versions in CHANGELOG.md that are newer than the newest release up to the
version in config.yaml, oldest first. With --backfill also the gaps between older releases are filled (never older than the oldest one).

    python3 tools/release_versions.py <current version> [--backfill] [existing tags ...]   -> prints one version per line
"""
import re
import sys
from pathlib import Path

VERSION = re.compile(r"^\d+\.\d+\.\d+$")


def key(v):
    return tuple(int(x) for x in v.split("."))


def changelog_versions(text):
    """the versions with an entry in the changelog ("## [1.2.3] - date"), as written"""
    return re.findall(r"^## \[(\d+\.\d+\.\d+)\]", text, re.M)


def missing(changelog, tags, current, backfill=False):
    """versions to release, oldest first: in the changelog, not released yet, not newer than `current`, newer than the newest release
    (with backfill: newer than the oldest release); with no release at all only `current`"""
    have = {t[1:] if t.startswith("v") else t for t in tags}
    have = {v for v in have if VERSION.match(v)}
    if not have:
        return [current] if current in changelog_versions(changelog) else []
    floor = min(have, key=key) if backfill else max(have, key=key)
    out = {v for v in changelog_versions(changelog) if v not in have and key(floor) < key(v) <= key(current)}
    return sorted(out, key=key)


if __name__ == "__main__":
    args = sys.argv[1:]
    backfill = "--backfill" in args
    args = [a for a in args if a != "--backfill"]
    text = (Path(__file__).resolve().parent.parent / "CHANGELOG.md").read_text(encoding="utf-8")
    print("\n".join(missing(text, args[1:], args[0], backfill)))
