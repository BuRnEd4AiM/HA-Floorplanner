"""🎬 The video guide in the add-on (guide.py, server.py): the videos are on GitHub Pages (tools/make_guide.py); an admin can save a
smaller copy into the add-on ("📥 Für ohne Internet speichern", the owner: "für Leute, die den HA nicht im Netz haben … pass auf, dass es
nicht zu groß wird das Add-on"), which is then served under guide/. Only the files of the guide, only for those who may edit."""
import asyncio
import json
import sys
from pathlib import Path

import aiohttp
import pytest
from aiohttp import web

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import guide as vg  # noqa: E402
import server  # noqa: E402

DATA = {"version": "4.52.0", "cats": [{"id": "live", "de": "Bedienen", "en": "Control"}],
        "clips": [{"id": "light", "cat": "live", "v": {"de": {"kb": 900, "steps": []}, "en": {"kb": 800, "steps": []}}},
                  {"id": "rooms", "cat": "edit", "v": {"de": {"kb": 500, "steps": []}}},
                  {"id": "../evil", "cat": "edit", "v": {"de": {"kb": 1}}}]}


def test_only_the_files_of_the_guide():
    assert vg.allowed("index.html") and vg.allowed("guide.json") and vg.allowed("de/light.small.mp4") and vg.allowed("en/phone-house.jpg")
    for bad in ("", "../server.py", "de/../../x.jpg", "de/light.mp4", "fr/light.jpg", "de/Light.jpg", "/etc/passwd", "de/light.prev.mp4"):
        assert not vg.allowed(bad), bad


def test_files_size_and_the_local_list_of_one_language():
    assert vg.files_of(DATA, "de") == ["de/light.small.mp4", "de/light.jpg", "de/rooms.small.mp4", "de/rooms.jpg"]   # never "../evil"
    assert vg.files_of(DATA, "en") == ["en/light.small.mp4", "en/light.jpg"]
    assert vg.size_kb(DATA, "en") == 860
    loc = vg.local_json(DATA, "en", now=1000)
    assert loc["local"] is True and loc["lang"] == "en" and loc["saved"] == 1000 and [c["id"] for c in loc["clips"]] == ["light"]
    assert loc["clips"][0]["v"] == {"en": DATA["clips"][0]["v"]["en"]}


def site_app(fail=None):
    """GitHub Pages as the tests see it"""
    async def handle(request):
        name = request.match_info["name"]
        if name == fail:
            return web.Response(status=404)
        if name == "guide.json":
            return web.json_response(DATA)
        if name == "index.html":
            return web.Response(text="<!doctype html><title>guide</title>", content_type="text/html")
        return web.Response(body=b"x" * 1000)
    app = web.Application()
    app.add_routes([web.get("/guide/{name:.+}", handle)])
    return app


async def test_download_puts_the_copy_in_place_and_a_broken_one_keeps_the_old(aiohttp_server, tmp_path):
    site = await aiohttp_server(site_app())
    folder, job = tmp_path / "guide", vg.Job()
    job.start("de")
    await vg.download(folder, "de", job, aiohttp.ClientSession, str(site.make_url("/guide/")))
    assert job.state == "done" and job.done == job.total == 5
    assert sorted(str(p.relative_to(folder)) for p in folder.rglob("*") if p.is_file()) == \
        ["de/light.jpg", "de/light.small.mp4", "de/rooms.jpg", "de/rooms.small.mp4", "guide.json", "index.html"]
    st = vg.status(folder, job)
    assert st["local"] and st["localLang"] == "de" and st["clips"] == 2 and st["mb"] > 0
    bad = await aiohttp_server(site_app(fail="de/rooms.jpg"))
    job.start("de")
    await vg.download(folder, "de", job, aiohttp.ClientSession, str(bad.make_url("/guide/")))
    assert job.state == "error" and "rooms.jpg" in job.error and "404" in job.error
    assert (folder / "de" / "rooms.jpg").exists() and not folder.with_name("guide.new").exists()     # the old copy stays
    assert vg.status(tmp_path / "nothing", vg.Job())["local"] is False


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))


async def test_the_add_on_saves_serves_and_deletes_the_copy(client, aiohttp_server, tmp_path, monkeypatch):
    site = await aiohttp_server(site_app())
    monkeypatch.setattr(vg, "URL", str(site.make_url("/guide/")))
    assert (await (await client.get("/api/guide")).json())["local"] is False
    st = await (await client.post("/api/guide", json={"lang": "de"})).json()
    assert st["state"] == "loading"
    for _ in range(100):
        st = await (await client.get("/api/guide")).json()
        if st["state"] != "loading":
            break
        await asyncio.sleep(0.05)
    assert st["state"] == "done" and st["local"] and st["localLang"] == "de"
    page = await client.get("/guide/")
    assert page.status == 200 and "guide" in await page.text()
    assert json.loads(await (await client.get("/guide/guide.json")).text())["local"] is True
    vid = await client.get("/guide/de/light.small.mp4", headers={"Range": "bytes=0-9"})
    assert vid.status == 206 and len(await vid.read()) == 10                      # a video can be wound (Range)
    for bad in ("/guide/de/light.mp4", "/guide/server.py", "/guide/%2e%2e/%2e%2e/config/x", "/guide/en/light.jpg"):
        assert (await client.get(bad)).status == 404, bad
    st = await (await client.delete("/api/guide")).json()
    assert st["local"] is False and (await client.get("/guide/")).status == 404


async def test_only_who_may_edit(client, tmp_path, monkeypatch):
    opts = tmp_path / "options.json"
    opts.write_text('{"editors": ["admin"]}')
    monkeypatch.setattr(server, "SUPERVISOR_TOKEN", "t")
    monkeypatch.setattr(server, "OPTIONS_FILE", opts)
    server._admin_cache.update(at=float("-inf"), ids=None)

    async def no_admins():
        return None
    monkeypatch.setattr(server, "load_admin_ids", no_admins)
    for method in ("get", "post", "delete"):
        assert (await getattr(client, method)("/api/guide", headers={"X-Remote-User-Name": "tablet_flur"})).status == 403
    assert (await client.get("/api/guide", headers={"X-Remote-User-Name": "admin"})).status == 200
