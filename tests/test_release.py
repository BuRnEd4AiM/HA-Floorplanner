"""tools/release_versions.py: which releases the release workflow creates (several merges in a row must not skip versions)."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("release_versions", Path(__file__).parent.parent / "tools" / "release_versions.py")
rv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rv)

LOG = "# Changelog\n\n## [Unreleased]\n\n## [1.3.0] - x\n### Added\n- c\n\n## [1.2.10] - x\n\n## [1.2.9] - x\n\n## [1.2.2] - x\n\n## [1.2.1] - x\n\n## [1.0.0] - x\n"


def test_versions_are_read_from_the_changelog_and_compared_as_numbers():
    assert rv.changelog_versions(LOG) == ["1.3.0", "1.2.10", "1.2.9", "1.2.2", "1.2.1", "1.0.0"]
    assert rv.key("1.2.10") > rv.key("1.2.9")


def test_the_skipped_versions_after_the_newest_release_are_made_oldest_first():
    assert rv.missing(LOG, ["v1.2.1", "v1.2.9"], "1.3.0") == ["1.2.10", "1.3.0"]


def test_nothing_newer_than_config_and_nothing_twice():
    assert rv.missing(LOG, ["v1.2.1"], "1.2.9") == ["1.2.2", "1.2.9"]
    assert rv.missing(LOG, ["v1.3.0"], "1.3.0") == []


def test_backfill_fills_gaps_between_releases_but_not_before_the_oldest():
    assert rv.missing(LOG, ["v1.2.1", "v1.2.10"], "1.3.0", backfill=True) == ["1.2.2", "1.2.9", "1.3.0"]
    assert "1.0.0" not in rv.missing(LOG, ["v1.2.1"], "1.3.0", backfill=True)


def test_without_any_release_only_the_current_version_and_odd_tags_are_ignored():
    assert rv.missing(LOG, [], "1.3.0") == ["1.3.0"]
    assert rv.missing(LOG, ["nightly", "v1.3.0"], "1.3.0") == []


def test_the_real_changelog_has_the_version_of_config_yaml():
    root = Path(__file__).parent.parent
    cfg = next(l.split('"')[1] for l in (root / "floorplan3d" / "config.yaml").read_text().splitlines() if l.startswith("version:"))
    assert cfg in rv.changelog_versions((root / "CHANGELOG.md").read_text(encoding="utf-8"))


def test_the_workflow_skips_versions_without_a_commit_and_never_breaks_its_pipe():
    wf = (Path(__file__).parent.parent / ".github" / "workflows" / "release.yml").read_text()
    loop = wf[wf.index("for ver in $todo"):wf.index("  demo:")]
    assert "| head" not in loop                      # head closes the pipe early: git gets SIGPIPE and set -o pipefail stops the run
    assert "never in config.yaml, skipped" in loop   # an old version that was never shipped is skipped
    assert loop.index('[ "$ver" = "$cfg" ]') < loop.index('target="$GITHUB_SHA"')   # only the current version may fall back to the run's commit
