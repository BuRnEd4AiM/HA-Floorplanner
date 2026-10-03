"""Automatic backups: folder in the add-on configuration, schedule, clean-up, check and restore."""
import json
import os
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "floorplan3d" / "rootfs" / "app"))
import server  # noqa: E402


@pytest.fixture
def ctx(tmp_path):
    return server._AppCtx(server.make_app(tmp_path / "data", tmp_path / "config"))


@pytest.fixture
async def client(aiohttp_client, tmp_path):
    return await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))


def store(ctx, **settings):
    p = server.settings_path(ctx)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(settings))


def age(ctx, name, days):
    f = server.backups_dir(ctx) / name
    t = time.time() - days * 86400
    os.utime(f, (t, t))


def test_nothing_happens_while_switched_off(ctx):
    assert server.run_backup_cycle(ctx) is None
    assert server.backup_items(ctx) == []


def test_first_backup_then_wait_for_the_interval(ctx):
    store(ctx, autoBackup=True, backupEveryHours=24)
    name = server.run_backup_cycle(ctx)
    assert name and name.endswith("-auto.json")
    assert server.run_backup_cycle(ctx) is None                                        # not due again
    assert server.run_backup_cycle(ctx, now=time.time() + 23 * 3600) is None
    assert server.run_backup_cycle(ctx, now=time.time() + 25 * 3600) is not None       # a day later


def test_backups_land_in_the_config_folder(ctx):
    store(ctx, autoBackup=True)
    name = server.run_backup_cycle(ctx)
    assert (ctx.app[server.KEY_CONFIG] / "backups" / name).is_file()


def test_prune_by_age_keeps_newest_and_manual(ctx):
    store(ctx, autoBackup=True, backupKeepDays=7, backupKeepCount=100)
    a = server.create_backup(ctx, "auto"); time.sleep(1.1)
    b = server.create_backup(ctx, "auto"); time.sleep(1.1)
    m = server.create_backup(ctx, "manual"); time.sleep(1.1)
    c = server.create_backup(ctx, "auto")
    for n in (a, b, m):
        age(ctx, n, 30)
    age(ctx, c, 1)
    removed = server.prune_backups(ctx, 7, 100)
    names = {i["name"] for i in server.backup_items(ctx)}
    assert set(removed) == {a, b} and names == {m, c}                                  # the manual one is never deleted


def test_prune_by_count(ctx):
    names = []
    for _ in range(4):
        names.append(server.create_backup(ctx, "auto")); time.sleep(1.1)
    server.prune_backups(ctx, 365, 2)
    assert [i["name"] for i in server.backup_items(ctx)] == [names[3], names[2]]


def test_the_newest_automatic_backup_always_stays(ctx):
    n = server.create_backup(ctx, "auto")
    age(ctx, n, 100)
    assert server.prune_backups(ctx, 1, 1) == []


def test_check_finds_a_good_backup_and_rejects_bad_ones(ctx):
    n = server.create_backup(ctx, "manual")
    r = server.check_backup_file(ctx)                                                  # without a name: the newest
    assert r["ok"] and r["name"] == n and r["houses"] == ["Haus"]
    (server.backups_dir(ctx) / n).write_text("{ not json")
    with pytest.raises(ValueError):
        server.check_backup_file(ctx, n)
    with pytest.raises(ValueError):
        server.check_backup_file(ctx, "../../etc/passwd")
    with pytest.raises(ValueError):
        server.check_backup_file(ctx, "floorplan3d-backup-20200101-000000.json")      # not there


def test_check_without_any_backup(ctx):
    with pytest.raises(ValueError):
        server.check_backup_file(ctx)


def test_settings_for_backups_are_validated(ctx):
    s = server.validate_settings({"autoBackup": True, "backupEveryHours": 99999, "backupKeepDays": -3, "backupKeepCount": 0})
    assert s["autoBackup"] is True
    assert s["backupEveryHours"] == 720 and s["backupKeepDays"] == server.DEFAULT_SETTINGS["backupKeepDays"] and s["backupKeepCount"] == server.DEFAULT_SETTINGS["backupKeepCount"]


async def test_api_create_list_check_download_delete(client):
    assert (await client.get("/api/backups")).status == 200
    r = await client.post("/api/backups")
    name = (await r.json())["name"]
    assert name.endswith("-manual.json")
    j = await (await client.get("/api/backups")).json()
    assert [i["name"] for i in j["items"]] == [name] and j["items"][0]["kind"] == "manual"
    t = await client.post("/api/backups/test", json={})
    assert t.status == 200 and (await t.json())["ok"] is True
    assert (await client.post("/api/backups/test", json={"name": "nope.json"})).status == 400
    d = await client.get(f"/api/backups/{name}")
    assert d.status == 200 and json.loads(await d.text())["format"] == server.BACKUP_FORMAT
    assert (await client.get("/api/backups/..%2Fsettings.json")).status == 404
    assert (await client.delete(f"/api/backups/{name}")).status == 200
    assert (await client.delete(f"/api/backups/{name}")).status == 404


async def test_api_restore_brings_the_saved_state_back(client):
    layout = {"version": 1, "floors": [{"id": "a", "name": "Vorher", "walls": [], "rooms": [], "devices": []}]}
    await client.put("/api/layout", json=layout)
    name = (await (await client.post("/api/backups")).json())["name"]
    await client.put("/api/layout", json={"version": 1, "floors": [{"id": "b", "name": "Nachher", "walls": [], "rooms": [], "devices": []}]})
    r = await client.post("/api/backups/restore", json={"name": name})
    assert r.status == 200 and (await r.json())["ok"] is True
    assert (await (await client.get("/api/layout")).json())["floors"][0]["name"] == "Vorher"
    bad = await client.post("/api/backups/restore", json={"name": "floorplan3d-backup-20200101-000000.json"})
    assert bad.status == 400
