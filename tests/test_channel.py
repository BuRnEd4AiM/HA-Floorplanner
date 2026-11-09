"""Normal and Beta (channel.py, 5.2.0): which add-on this is, where it looks for a newer version, and the beta's pause while the normal
add-on runs, with a stand-in websocket of Home Assistant that passes fired events on to everyone who subscribed to them."""
import asyncio
import contextlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import channel as chn  # noqa: E402


def test_which_channel():
    assert chn.channel_of("stable") == "stable" and chn.channel_of(" Beta ") == "beta"
    assert chn.channel_of(None) == "" and chn.channel_of("edge") == ""          # a test or a copy run by hand: neither


def test_where_each_looks_for_a_newer_version():
    assert chn.manifest_url("stable").endswith("/main/floorplan3d-stable/rootfs/app/manifest.json")
    assert chn.manifest_url("beta").endswith("/main/floorplan3d/rootfs/app/manifest.json")
    assert chn.manifest_url("") == chn.manifest_url("beta")


def test_the_beta_waits_until_it_asked_then_pauses_while_the_normal_one_answers():
    w = chn.Watch("beta", "5.2.0", clock=lambda: 0.0)
    assert w.state(0) == "looking" and w.paused(0)                            # not asked yet: it switches nothing
    w.looked = True
    assert w.state(0) == "alone" and not w.paused(0)
    assert not w.heard({"channel": "beta", "version": "5.3.0"}, 10)            # another beta does not count
    assert not w.heard("junk", 10) and w.state(10) == "alone"
    assert w.heard({"channel": "stable", "version": "5.1.0"}, 10)
    assert w.state(10) == "paused" and w.paused(10 + chn.FRESH - 1)
    assert w.info(20) == {"channel": "beta", "state": "paused", "stable": "5.1.0"}
    assert w.state(10 + chn.FRESH) == "alone"                                  # it stopped: the beta goes on by itself
    assert w.info(10 + chn.FRESH) == {"channel": "beta", "state": "alone", "stable": None}


def test_the_normal_one_and_a_test_never_pause():
    for ch in ("stable", ""):
        w = chn.Watch(ch, "5.2.0", clock=lambda: 0.0)
        w.heard({"channel": "stable", "version": "5.2.0"}, 0)
        assert w.state(0) == "" and not w.paused(0)
    assert chn.Watch("stable").info()["channel"] == "stable" and chn.Watch("").info()["channel"] is None
    assert chn.Watch("beta", ha=False).state() == "alone"                       # without Home Assistant there is nothing to wait for


class Msg:
    type = 1

    def __init__(self, data):
        self.data = json.dumps(data)


class Bus:
    """Home Assistant's event bus: every socket gets the events it subscribed to"""
    def __init__(self):
        self.sockets, self.fired = [], []

    def connect(self):
        bus = self

        @contextlib.asynccontextmanager
        async def cm():
            ws = Socket(bus)
            bus.sockets.append(ws)
            try:
                yield ws
            finally:
                bus.sockets.remove(ws)
        return cm

    async def fire(self, kind, data):
        self.fired.append((kind, data))
        for ws in self.sockets:
            if kind in ws.subs:
                await ws.queue.put({"type": "event", "event": {"event_type": kind, "data": data}})


class Socket:
    def __init__(self, bus):
        self.bus, self.subs, self.queue = bus, set(), asyncio.Queue()

    async def send_json(self, obj):
        if obj["type"] == "subscribe_events":
            self.subs.add(obj["event_type"])
        elif obj["type"] == "fire_event":
            await self.bus.fire(obj["event_type"], obj["event_data"])
        await self.queue.put({"id": obj["id"], "type": "result", "success": True, "result": None})

    async def receive(self):
        return Msg(await self.queue.get())


async def until(cond, seconds=2.0):
    for _ in range(int(seconds / 0.02)):
        if cond():
            return True
        await asyncio.sleep(0.02)
    return cond()


async def test_the_beta_hears_the_normal_one_and_goes_on_when_it_is_gone():
    bus = Bus()
    beta = chn.Watch("beta", "5.3.0")
    b = asyncio.create_task(chn.run(beta, connect=bus.connect(), every=0.2, look=0.1))
    assert await until(lambda: beta.state() == "alone")                       # asked, nobody answered: it works
    assert ("floorplan3d_ping", {"channel": "beta", "version": "5.3.0"}) in bus.fired
    stable = chn.Watch("stable", "5.2.0")
    s = asyncio.create_task(chn.run(stable, connect=bus.connect()))
    assert await until(lambda: beta.state() == "paused")                      # the normal one said so when it started
    assert beta.info()["stable"] == "5.2.0" and stable.state() == ""
    pings = sum(k == "floorplan3d_ping" for k, _ in bus.fired)
    answers = sum(k == "floorplan3d_running" for k, _ in bus.fired)
    assert await until(lambda: sum(k == "floorplan3d_running" for k, _ in bus.fired) > answers)   # each question gets an answer
    assert sum(k == "floorplan3d_ping" for k, _ in bus.fired) > pings
    s.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await s
    beta.seen -= chn.FRESH                                                     # minutes later: no answer any more
    await asyncio.sleep(0.3)
    assert beta.state() == "alone"
    b.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await b


async def test_no_home_assistant_the_beta_keeps_waiting_and_a_test_does_nothing():
    tries = []

    @contextlib.asynccontextmanager
    async def broken():
        tries.append(1)
        raise ConnectionError("no Home Assistant")
        yield  # noqa: unreachable - makes this a generator

    beta = chn.Watch("beta", "5.3.0")
    b = asyncio.create_task(chn.run(beta, connect=broken, retry=0.05))
    await asyncio.sleep(0.2)
    assert len(tries) >= 2 and beta.state() == "looking" and beta.paused()    # not known: switch nothing (nor could it)
    b.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await b
    assert await chn.run(chn.Watch(""), connect=broken) is None and len(tries) >= 2


async def test_the_server_tells_the_page_which_one_it_is(aiohttp_client, tmp_path, monkeypatch):
    import server
    monkeypatch.setattr(server, "CHANNEL", "beta")
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))
    assert (await (await c.get("/api/version")).json())["channel"] == "beta"
    assert await (await c.get("/api/channel")).json() == {"channel": "beta", "state": "alone", "stable": None}   # no Home Assistant here
    app, ctx = c.server.app, server._AppCtx(c.server.app)
    assert not server.beta_paused(ctx)
    app[server.KEY_CHANNEL].looked = False                                    # as with Home Assistant, before it asked
    assert server.beta_paused(ctx)
    app[server.KEY_CHANNEL].heard({"channel": "stable", "version": "5.2.0"})
    app[server.KEY_CHANNEL].looked = True
    assert server.beta_paused(ctx)
    assert await (await c.get("/api/channel")).json() == {"channel": "beta", "state": "paused", "stable": "5.2.0"}


async def test_household_messages_wait_while_the_beta_pauses(aiohttp_client, tmp_path, monkeypatch):
    import server
    monkeypatch.setattr(server, "CHANNEL", "beta")
    c = await aiohttp_client(server.make_app(tmp_path / "data", tmp_path / "config"))
    app = c.server.app
    app[server.KEY_CHANNEL].heard({"channel": "stable", "version": "5.2.0"})
    asked = []
    monkeypatch.setattr(server, "household_store", lambda r: asked.append(1) or {"tell": {}, "told": {}})
    await server.household_tell(server._AppCtx(app))
    assert not asked                                                          # not even looked at: the normal add-on tells
