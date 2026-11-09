"""Normal and Beta (tools/stable.py, 5.2.0): floorplan3d/ is the beta, floorplan3d-stable/ the normal add-on, a copy of the beta at a
released version. The copy must be whole (its files match its own manifest), keep the old name and slug, and only newer versions can be
released."""
import importlib.util
import re
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("stable", ROOT / "tools" / "stable.py")
st = importlib.util.module_from_spec(spec)
spec.loader.exec_module(st)

BETA_CFG = (ROOT / "floorplan3d" / "config.yaml").read_text("utf-8")


def test_the_beta_has_its_own_name_and_slug_and_is_marked_experimental():
    assert re.search(r'^name: "3D Floorplan Beta"$', BETA_CFG, re.M) and re.search(r"^slug: floorplan3d_beta$", BETA_CFG, re.M)
    assert re.search(r"^stage: experimental", BETA_CFG, re.M) and re.search(r'^panel_title: "3D Floorplan Beta"$', BETA_CFG, re.M)
    assert st.BETA_TEXT in BETA_CFG
    assert "ENV FP_CHANNEL=beta" in (ROOT / "floorplan3d" / "Dockerfile").read_text("utf-8")


def test_the_normal_add_on_keeps_the_old_name_and_slug():
    cfg = st.stable_config(BETA_CFG)
    assert cfg.startswith("# The NORMAL add-on") and "The BETA" not in cfg
    assert re.search(r'^name: "3D Floorplan"$', cfg, re.M) and re.search(r"^slug: floorplan3d$", cfg, re.M)
    assert re.search(r'^panel_title: "3D Floorplan"$', cfg, re.M) and not re.search(r"^stage:", cfg, re.M)
    assert st.BETA_TEXT not in cfg and 'description: "More than a floor plan' in cfg
    assert st.version_of(cfg) == st.version_of(BETA_CFG)
    rest = lambda t: [l for l in t.splitlines() if l and not l.startswith(("#", "name:", "slug:", "stage:", "panel_title:", "description:"))]
    assert rest(cfg) == rest(BETA_CFG)                                   # everything else (options, ingress, map ...) as in the beta
    with pytest.raises(ValueError):
        st.stable_config('version: "1.0.0"\nname: "x"\n')
    assert st.stable_dockerfile("COPY rootfs /\nENV FP_CHANNEL=beta\n") == "COPY rootfs /\nENV FP_CHANNEL=stable\n"
    with pytest.raises(ValueError):
        st.stable_dockerfile("COPY rootfs /\n")


def test_the_committed_normal_add_on_is_a_whole_copy():
    assert st.check() == [], "floorplan3d-stable/ is not a whole copy: release it again with tools/stable.py (never edit it by hand)"
    assert st.key(st.current()) <= st.key(st.version_of(BETA_CFG))


def test_release_writes_a_whole_copy_and_only_newer_versions(tmp_path):
    files = st.files_here()
    v = st.version_of(files["config.yaml"][0].decode())
    st.release(v, files, "worktree", root=tmp_path)
    assert st.check(tmp_path) == [] and st.current(tmp_path) == v
    mode = lambda p: p.stat().st_mode & 0o777
    assert mode(tmp_path / "floorplan3d-stable" / "rootfs" / "run.sh") == mode(ROOT / "floorplan3d" / "rootfs" / "run.sh")
    with pytest.raises(SystemExit, match="already"):
        st.release(v, files, "worktree", root=tmp_path)                 # Home Assistant offers only newer versions
    st.release(v, files, "worktree", root=tmp_path, again=True)         # the same once more, on purpose
    assert st.check(tmp_path) == []
    with pytest.raises(SystemExit, match="not 9.9.9"):
        st.release("9.9.9", files, "worktree", root=tmp_path)
    old = {**files, "CHANGELOG.md": (b"# Changelog\n", 0o644)}
    with pytest.raises(SystemExit, match="no entry"):
        st.release(v, old, "worktree", root=tmp_path / "other")
    (tmp_path / "floorplan3d-stable" / "rootfs" / "app" / "server.py").write_text("changed by hand")
    assert any("differ" in x for x in st.check(tmp_path))


def _git(repo, *args):
    r = subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", *args], cwd=repo, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr


def _commit(repo, version, text):
    (repo / "floorplan3d").mkdir(exist_ok=True)
    (repo / "floorplan3d" / "config.yaml").write_text(f'name: "x"\nversion: "{version}"\n')
    (repo / "floorplan3d" / "code.txt").write_text(text)
    _git(repo, "add", "-A")
    _git(repo, "commit", "-m", f"{version} {text}")
    return subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo, capture_output=True, text=True).stdout.strip()


def test_the_version_is_taken_as_it_was_last_on_main_not_the_first_commit_of_its_pull_request(tmp_path):
    _git(tmp_path, "init", "-q", "-b", "main")
    _commit(tmp_path, "1.0.0", "a")
    fixed = _commit(tmp_path, "1.0.0", "a fixed")                       # a fix without a new version
    _git(tmp_path, "checkout", "-q", "-b", "feature")
    first = _commit(tmp_path, "1.1.0", "b")
    _commit(tmp_path, "1.1.0", "b fixed in the pull request")
    _git(tmp_path, "checkout", "-q", "main")
    _git(tmp_path, "merge", "--no-ff", "-q", "-m", "Merge pull request", "feature")
    merge = subprocess.run(["git", "rev-parse", "HEAD"], cwd=tmp_path, capture_output=True, text=True).stdout.strip()
    assert st.last_commit_with("1.0.0", repo=tmp_path) == fixed
    got = st.last_commit_with("1.1.0", repo=tmp_path)
    assert got == merge and got != first
    assert st.files_at(got, repo=tmp_path)["code.txt"][0] == b"b fixed in the pull request"
    for never in ("0.9.0", "2.0.0", "1.0.5"):
        with pytest.raises(SystemExit, match="never"):
            st.last_commit_with(never, repo=tmp_path)


def test_the_workflow_and_the_docker_version_know_the_normal_add_on():
    wf = (ROOT / ".github" / "workflows" / "stable.yml").read_text("utf-8")
    assert "workflow_dispatch" in wf and "tools/stable.py release" in wf and "--latest" in wf
    docker = (ROOT / "container" / "Dockerfile").read_text("utf-8")
    assert "ARG CHANNEL=stable" in docker and "floorplan3d-stable/rootfs/app" in docker and "FP_CHANNEL=$CHANNEL" in docker
    assert "floorplan3d-stable/" in (ROOT / ".ignore").read_text() and "floorplan3d-stable/" in (ROOT / ".graphifyignore").read_text()
