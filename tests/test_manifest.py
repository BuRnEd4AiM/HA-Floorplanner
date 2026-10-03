"""Version and checksums: the committed manifest matches the files, the add-on and GitHub comparison work."""
import json
import re
import sys
from pathlib import Path

import pytest
from aiohttp import web

ROOT = Path(__file__).parent.parent
APP = ROOT / "floorplan3d" / "rootfs" / "app"
sys.path.insert(0, str(APP))
import manifest as mf  # noqa: E402
import server  # noqa: E402


def config_version():
    return re.search(r'^version:\s*"([^"]+)"', (ROOT / "floorplan3d" / "config.yaml").read_text("utf-8"), re.M).group(1)


def test_committed_manifest_matches_the_files():
    """If this fails: run `python3 tools/make_manifest.py` and commit manifest.json."""
    m = mf.load_manifest(APP)
    assert m, "manifest.json is missing: run python3 tools/make_manifest.py"
    assert m["version"] == config_version(), "version in config.yaml changed: run python3 tools/make_manifest.py"
    assert m == mf.build_manifest(APP, config_version()), "files changed: run python3 tools/make_manifest.py and commit manifest.json"


def test_hash_changes_with_content_and_version(tmp_path):
    (tmp_path / "a.txt").write_text("one")
    a = mf.build_manifest(tmp_path, "1.0.0")
    (tmp_path / "a.txt").write_text("two")
    b = mf.build_manifest(tmp_path, "1.0.0")
    c = mf.build_manifest(tmp_path, "1.0.1")
    assert len({a["buildHash"], b["buildHash"], c["buildHash"]}) == 3


def test_compare_finds_changed_missing_and_extra_files(tmp_path):
    (tmp_path / "a.txt").write_text("one"); (tmp_path / "b.txt").write_text("two")
    m = mf.build_manifest(tmp_path, "1.0.0")
    assert mf.compare(tmp_path, m)["ok"] is True
    (tmp_path / "a.txt").write_text("changed"); (tmp_path / "b.txt").unlink(); (tmp_path / "c.txt").write_text("new")
    r = mf.compare(tmp_path, m)
    assert not r["ok"] and r["changed"] == ["a.txt"] and r["missing"] == ["b.txt"] and r["extra"] == ["c.txt"]


def test_cache_and_manifest_files_are_not_hashed(tmp_path):
    (tmp_path / "a.txt").write_text("x")
    (tmp_path / "__pycache__").mkdir(); (tmp_path / "__pycache__" / "x.pyc").write_bytes(b"1")
    (tmp_path / mf.NAME).write_text("{}")
    assert list(mf.file_hashes(tmp_path)) == ["a.txt"]


def test_relation():
    local = {"version": "1.2.3", "buildHash": "aaa"}
    assert mf.relation(local, {"version": "1.2.3", "buildHash": "aaa"}) == "same"
    assert mf.relation(local, {"version": "1.2.4", "buildHash": "bbb"}) == "behind"
    assert mf.relation(local, {"version": "1.10.0", "buildHash": "bbb"}) == "behind"      # numbers, not text
    assert mf.relation(local, {"version": "1.2.3", "buildHash": "bbb"}) == "differs"
    assert mf.relation(local, {"version": "1.2.0", "buildHash": "bbb"}) == "differs"


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))


async def test_api_version_reports_the_installed_files(client):
    j = await (await client.get("/api/version")).json()
    assert j["known"] and j["version"] == config_version() and len(j["short"]) == 7
    assert j["server"]["ok"] is True and j["server"]["files"] > 50
    assert "app.js" in j["staticFiles"] and not any(k.startswith("vendor/") for k in j["staticFiles"])


async def test_api_version_remote(aiohttp_client, aiohttp_server, tmp_path, monkeypatch):
    local = mf.load_manifest(APP)
    remote = {"version": "9.9.9", "buildHash": "f" * 64}

    async def serve(request):
        return web.json_response(remote)

    async def broken(request):
        return web.Response(status=500)
    app = web.Application(); app.router.add_get("/m.json", serve); app.router.add_get("/broken.json", broken)
    srv = await aiohttp_server(app)
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))
    monkeypatch.setattr(server, "MANIFEST_URL", str(srv.make_url("/m.json")))
    j = await (await c.get("/api/version/remote")).json()
    assert j["state"] == "behind" and j["version"] == "9.9.9"
    remote.update(local)
    assert (await (await c.get("/api/version/remote")).json())["state"] == "same"
    monkeypatch.setattr(server, "MANIFEST_URL", str(srv.make_url("/broken.json")))
    assert (await (await c.get("/api/version/remote")).json())["state"] == "unreachable"
    monkeypatch.setattr(server, "MANIFEST_URL", "http://127.0.0.1:9/none.json")
    assert (await (await c.get("/api/version/remote")).json())["state"] == "unreachable"
