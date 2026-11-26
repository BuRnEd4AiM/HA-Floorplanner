"""The HACS repository of the Home Assistant integration for Docker (#744): tools/connector_mirror.py fills it from HA-Floorplanner's
releases, and container/connector-repo/ is what it starts with. GitHub is replaced by local git repositories and a fake `gh`."""
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import connector_mirror as cm  # noqa: E402

TEMPLATE = ROOT / "container" / "connector-repo"


def rel(tag, pre=False, draft=False):
    return {"tag_name": tag, "prerelease": pre, "draft": draft}


def test_only_new_releases_from_5_9_0_oldest_first():
    source = [rel("v5.10.0", pre=True), rel("v5.9.1"), rel("v5.9.0"), rel("v5.8.0"), rel("v5.9.2", draft=True), rel("nightly")]
    create, flags, latest = cm.plan(source, {}, "v5.9.1")
    assert create == ["v5.9.0", "v5.9.1", "v5.10.0"]                # 5.8.0 had its own numbering; a draft is not out yet
    assert flags == {} and latest == "v5.9.1"
    create, flags, latest = cm.plan(source, {"v5.9.0": False, "v5.9.1": True}, "v5.9.1")
    assert create == ["v5.10.0"]
    assert flags == {"v5.9.1": False}                                # "Release to everyone" made it a normal release there
    assert latest == "v5.9.1"


def test_an_older_release_than_the_newest_here_is_not_made_again():
    """a commit for an older version on top of a newer one would leave the older integration in the branch"""
    create, _flags, latest = cm.plan([rel("v5.9.0"), rel("v5.9.3")], {"v5.9.3": False}, "v5.9.0")
    assert create == [] and latest is None


def test_versions():
    assert cm.version("v5.10.0") > cm.version("v5.9.12") and cm.version("5.9.0") == (5, 9, 0)
    assert cm.version("v5.9") is None and cm.version("nightly") is None and cm.version(None) is None


def test_the_template_of_the_hacs_repository():
    hacs = json.loads((TEMPLATE / "hacs.json").read_text("utf-8"))
    assert hacs["name"] and "filename" not in hacs and "zip_release" not in hacs   # HACS takes custom_components/ of the tag
    workflow = (TEMPLATE / ".github" / "workflows" / "sync.yml").read_text("utf-8")
    assert "raw.githubusercontent.com/BuRnEd4AiM/HA-Floorplanner/main/tools/connector_mirror.py" in workflow
    assert "contents: write" in workflow and "schedule:" in workflow and "workflow_dispatch:" in workflow
    readme = (TEMPLATE / "README.md").read_text("utf-8")
    for words in ("type **Integration**", "Restart Home Assistant", "floorplan3d-connector.zip", "Settings → Repairs",
                  "ghcr.io/burned4aim/floorplan3d", "Pre-release"):
        assert words in readme, words
    assert cm.PACKAGE == "container/custom_components/floorplan3d" and (ROOT / cm.PACKAGE / "manifest.json").is_file()


# ---------- a whole run against local repositories ----------

def git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def commit_version(src: Path, v: str, code: str, manifest_version: str = ""):
    pkg = src / cm.PACKAGE
    pkg.mkdir(parents=True, exist_ok=True)
    (pkg / "manifest.json").write_text(json.dumps({"domain": "floorplan3d", "version": manifest_version or v}), "utf-8")
    (pkg / "__init__.py").write_text(code, "utf-8")
    git(src, "add", "-A")
    git(src, "commit", "-q", "-m", v)
    git(src, "tag", f"v{v}")


class FakeGitHub(cm.Runner):
    def __init__(self, repo, releases):
        super().__init__(repo)
        self.rel = releases                   # {"o/src": [...], "o/dest": [...]}
        self.latest_of = {}
        self.calls = []
        self.fail_create = 0                  # so many `gh release create` fail (-1: all of them)
        self.made_anyway = False              # ... and the failing ones made the release all the same
        self.waited = []

    def wait(self, seconds):
        self.waited.append(seconds)

    def gh(self, *args, write=False, quiet=False):
        if args[0] == "api":
            repo = args[1].split("/")[1] + "/" + args[1].split("/")[2]
            if args[1].endswith("/releases/latest"):
                if repo not in self.latest_of:
                    raise subprocess.CalledProcessError(1, "gh")
                return self.latest_of[repo] + "\n"
            return "".join(json.dumps(r) + "\n" for r in self.rel[repo])
        if args[:2] == ("release", "view"):
            if not any(r["tag_name"] == args[2] for r in self.rel["o/dest"]):
                raise subprocess.CalledProcessError(1, "gh")
            return "{}\n"
        self.calls.append(args)
        if args[:2] == ("release", "create"):
            if self.fail_create:
                self.fail_create -= 1
                if self.made_anyway:
                    self.rel["o/dest"].append(rel(args[2], pre="--prerelease" in args))
                raise subprocess.CalledProcessError(1, "gh", stderr=b"HTTP 502")
            self.rel["o/dest"].append(rel(args[2], pre="--prerelease" in args))
        if args[:2] == ("release", "edit"):
            for r in self.rel["o/dest"]:
                if r["tag_name"] == args[2]:
                    r["prerelease"] = "--prerelease=true" in args
            if "--latest" in args:
                self.latest_of["o/dest"] = args[2]
        return ""


@pytest.fixture
def repos(tmp_path, monkeypatch):
    for key in ("AUTHOR", "COMMITTER"):
        monkeypatch.setenv(f"GIT_{key}_NAME", "test")
        monkeypatch.setenv(f"GIT_{key}_EMAIL", "test@example.org")
    src = tmp_path / "source"
    src.mkdir()
    git(src, "init", "-q", "-b", "main")
    (src / "LICENSE").write_text("GPL", "utf-8")
    (src / cm.TEMPLATE).mkdir(parents=True)
    for name in cm.TEMPLATE_FILES:
        (src / cm.TEMPLATE / name).write_text((TEMPLATE / name).read_text("utf-8"), "utf-8")
    commit_version(src, "5.8.0", "old = 1\n", manifest_version="1.4.5")     # before 5.9.0: its own numbering
    commit_version(src, "5.9.0", "first = 1\n")
    commit_version(src, "5.9.1", "second = 1\n")
    bare = tmp_path / "dest.git"
    git(tmp_path, "init", "-q", "--bare", "-b", "main", str(bare))
    dest = tmp_path / "dest"
    git(tmp_path, "clone", "-q", str(bare), str(dest))
    (dest / "README.md").write_text("empty", "utf-8")
    git(dest, "add", "-A")
    git(dest, "commit", "-q", "-m", "start")
    git(dest, "push", "-q", "origin", "HEAD:main")
    return src, bare, dest


def test_a_run_mirrors_the_releases_and_a_second_one_only_what_changed(repos):
    src, bare, dest = repos
    gh = FakeGitHub(dest, {"o/src": [rel("v5.9.1", pre=True), rel("v5.9.0"), rel("v5.8.0")], "o/dest": []})
    gh.latest_of["o/src"] = "v5.9.0"
    assert cm.sync(gh, "o/src", src.as_uri(), "o/dest") == 0

    assert git(bare, "tag").split() == ["v5.9.0", "v5.9.1"]
    assert json.loads(git(bare, "show", "v5.9.0:custom_components/floorplan3d/manifest.json"))["version"] == "5.9.0"
    assert git(bare, "show", "v5.9.0:custom_components/floorplan3d/__init__.py") == "first = 1\n"
    assert git(bare, "show", "main:custom_components/floorplan3d/__init__.py") == "second = 1\n"   # the newest in the branch
    assert "type **Integration**" in git(bare, "show", "main:README.md")
    assert git(bare, "show", "main:LICENSE") == "GPL"
    assert json.loads(git(bare, "show", "main:hacs.json"))["name"]
    created = [c for c in gh.calls if c[:2] == ("release", "create")]
    assert [c[2] for c in created] == ["v5.9.0", "v5.9.1"]
    assert "--prerelease" not in created[0] and "--prerelease" in created[1]
    assert gh.latest_of["o/dest"] == "v5.9.0"                       # what HACS offers without pre-releases

    # "Release to everyone" gives 5.9.1 to everybody: here it becomes a normal release and the latest, nothing new is committed
    gh.rel["o/src"][0]["prerelease"] = False
    gh.latest_of["o/src"] = "v5.9.1"
    gh.calls.clear()
    head = git(bare, "rev-parse", "main")
    assert cm.sync(gh, "o/src", src.as_uri(), "o/dest") == 0
    assert git(bare, "rev-parse", "main") == head
    assert ("release", "edit", "v5.9.1", "--prerelease=false") in gh.calls
    assert gh.latest_of["o/dest"] == "v5.9.1"
    assert not [c for c in gh.calls if c[:2] == ("release", "create")]


def test_a_dry_run_publishes_nothing(repos, capsys):
    src, bare, dest = repos
    gh = FakeGitHub(dest, {"o/src": [rel("v5.9.0")], "o/dest": []})
    gh.dry_run = True
    gh.latest_of["o/src"] = "v5.9.0"
    real_gh = cm.Runner.gh

    def dry(self, *args, write=False, quiet=False):
        if write:
            return real_gh(self, *args, write=True)          # prints "would run" in a dry run, runs nothing
        return FakeGitHub.gh(self, *args)

    gh.gh = dry.__get__(gh)
    assert cm.sync(gh, "o/src", src.as_uri(), "o/dest") == 0
    assert git(bare, "tag") == "" and "would run: gh release create v5.9.0" in capsys.readouterr().out


def test_a_tag_whose_integration_has_another_version_gives_nothing(repos):
    src, _bare, dest = repos
    run = cm.Runner(dest)
    assert cm.package_at(run, src, "v5.8.0") is None
    assert cm.package_at(run, src, "v9.9.9") is None
    files = cm.package_at(run, src, "v5.9.0")
    assert files["custom_components/floorplan3d/__init__.py"] == b"first = 1\n" and set(cm.TEMPLATE_FILES) <= set(files)


def test_a_tag_without_its_release_is_finished_by_the_next_run(repos, tmp_path):
    """#809: a run pushed commit and tag of 5.36.0, then `gh release create` failed; every later run stopped at `git tag v5.36.0`
    (the tag was there already), so 5.36.1 never came. Now the next run only makes the missing release and goes on."""
    src, bare, dest = repos
    gh = FakeGitHub(dest, {"o/src": [rel("v5.9.0", pre=True)], "o/dest": []})     # only pre-releases: no latest one
    gh.fail_create = -1
    with pytest.raises(subprocess.CalledProcessError):
        cm.sync(gh, "o/src", src.as_uri(), "o/dest")
    assert git(bare, "tag").split() == ["v5.9.0"] and gh.rel["o/dest"] == []
    assert len([c for c in gh.calls if c[:2] == ("release", "create")]) == len(cm.WAITS) + 1 and gh.waited == list(cm.WAITS)
    tagged = git(bare, "rev-parse", "v5.9.0")

    # the next run starts in a fresh checkout with all tags (actions/checkout, fetch-depth 0); 5.9.1 is out in the meantime
    fresh = tmp_path / "fresh"
    git(tmp_path, "clone", "-q", str(bare), str(fresh))
    gh2 = FakeGitHub(fresh, {"o/src": [rel("v5.9.1", pre=True), rel("v5.9.0", pre=True)], "o/dest": gh.rel["o/dest"]})
    assert cm.sync(gh2, "o/src", src.as_uri(), "o/dest") == 0
    assert git(bare, "tag").split() == ["v5.9.0", "v5.9.1"]
    assert git(bare, "rev-parse", "v5.9.0") == tagged                                 # the old tag stays as it was
    assert git(bare, "show", "v5.9.0:custom_components/floorplan3d/__init__.py") == "first = 1\n"
    assert git(bare, "show", "main:custom_components/floorplan3d/__init__.py") == "second = 1\n"
    assert [r["tag_name"] for r in gh2.rel["o/dest"]] == ["v5.9.0", "v5.9.1"]
    assert all(r["prerelease"] for r in gh2.rel["o/dest"])
    assert git(bare, "log", "--format=%s", "main").splitlines()[:2] == ["3D Floorplan Connector 5.9.1", "3D Floorplan Connector 5.9.0"]


def test_gh_release_create_is_tried_again(repos):
    src, bare, dest = repos
    gh = FakeGitHub(dest, {"o/src": [rel("v5.9.0")], "o/dest": []})
    gh.latest_of["o/src"] = "v5.9.0"
    gh.fail_create = 2                                                   # GitHub does not know the tag yet, then it does
    assert cm.sync(gh, "o/src", src.as_uri(), "o/dest") == 0
    assert [r["tag_name"] for r in gh.rel["o/dest"]] == ["v5.9.0"] and gh.waited == list(cm.WAITS[:2])
    assert gh.latest_of["o/dest"] == "v5.9.0"


def test_a_release_made_by_a_failed_try_counts(repos):
    """gh says it failed (say the answer got lost), but the release is there: no second one, no error"""
    src, bare, dest = repos
    gh = FakeGitHub(dest, {"o/src": [rel("v5.9.0")], "o/dest": []})
    gh.latest_of["o/src"] = "v5.9.0"
    gh.fail_create, gh.made_anyway = 1, True
    assert cm.sync(gh, "o/src", src.as_uri(), "o/dest") == 0
    assert [r["tag_name"] for r in gh.rel["o/dest"]] == ["v5.9.0"] and gh.waited == []


def test_what_a_failing_command_said_is_in_the_log(tmp_path, capsys):
    run = cm.Runner(tmp_path)
    with pytest.raises(subprocess.CalledProcessError):
        run.git("tag", "v1.0.0")                                         # not a git repository
    err = capsys.readouterr().err
    assert "git tag failed (exit 128)" in err and "not a git repository" in err
    assert run.has_tag("v1.0.0") is False and capsys.readouterr().err == ""   # a question that may say no stays quiet
