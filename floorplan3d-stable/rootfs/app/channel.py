"""Normal and Beta (5.2.0): which of the two add-ons this is, and the beta's pause while the normal one runs.

The store has two add-ons: "3D Floorplan" (the folder floorplan3d-stable/, only the versions the owner released, tools/stable.py) and
"3D Floorplan Beta" (floorplan3d/, every merged version). Each keeps its own data. Run both with the same house and both would heat, run
routines and send messages. So the normal one says over Home Assistant's event bus that it runs (when it starts and whenever a beta asks),
and the beta switches nothing by itself while it heard that in the last minutes: no heating rules, routines, alarm, holiday alarm or
household messages. What a person taps on the page still works. Until the beta has asked once it waits as well (a few seconds).

The Dockerfile says which one this is (FP_CHANNEL); the Docker version (container/) the same with its build argument CHANNEL. Anything
else (a test, a copy started by hand) is neither: it never pauses and never answers.

Pure but for run(), which is tested with a stand-in websocket (tests/test_channel.py)."""
import asyncio
import json
import logging
import time

log = logging.getLogger("floorplan3d.channel")

STABLE, BETA = "stable", "beta"
PING = "floorplan3d_ping"           # a beta asks: is the normal one running?
HERE = "floorplan3d_running"        # the normal one says so (at its start and as the answer)
ASK_EVERY = 120.0                   # the beta asks this often (seconds)
FRESH = 300.0                       # an answer counts this long: the beta goes on by itself at most this long after the normal one stopped
LOOK = 5.0                          # after its first question the beta waits this long for an answer before it starts on its own
REPO = "https://raw.githubusercontent.com/BuRnEd4AiM/HA-Floorplanner/main"


def channel_of(value) -> str:
    """"stable", "beta" or "" (neither: a test, a copy run by hand)"""
    v = str(value or "").strip().lower()
    return v if v in (STABLE, BETA) else ""


def manifest_url(channel: str) -> str:
    """where the newest version of this channel lists its files: the normal one compares itself with the last released version (the copy in
    floorplan3d-stable/), everything else with the newest one"""
    folder = "floorplan3d-stable" if channel == STABLE else "floorplan3d"
    return f"{REPO}/{folder}/rootfs/app/manifest.json"


class Watch:
    """what the beta knows about the normal one; clock: seconds that only go forward (time.monotonic)"""

    def __init__(self, channel: str, version=None, clock=time.monotonic, ha: bool = True):
        self.channel, self.version, self.clock = channel_of(channel), version, clock
        self.seen = None                 # when the normal one said it runs, last
        self.other = None                # its version
        self.looked = not ha             # without Home Assistant there is nothing to switch, so nothing to wait for

    def heard(self, data, now=None) -> bool:
        """an event floorplan3d_running: True when it came from a normal one"""
        if not isinstance(data, dict) or data.get("channel") != STABLE:
            return False
        self.seen = self.clock() if now is None else now
        self.other = str(data.get("version") or "")[:20] or None
        return True

    def state(self, now=None) -> str:
        """"" (not the beta), "looking" (the beta has not asked yet), "paused" (the normal one runs), "alone" (the beta works)"""
        if self.channel != BETA:
            return ""
        now = self.clock() if now is None else now
        if self.seen is not None and now - self.seen < FRESH:
            return "paused"
        return "alone" if self.looked else "looking"

    def paused(self, now=None) -> bool:
        """True while the beta must not switch anything by itself"""
        return self.state(now) in ("paused", "looking")

    def info(self, now=None) -> dict:
        st = self.state(now)
        return {"channel": self.channel or None, "state": st or None, "stable": self.other if st == "paused" else None}


async def run(watch: Watch, *, connect, every: float = ASK_EVERY, look: float = LOOK, retry: float = 60.0):
    """Runs while the add-on runs; never raises. The normal one says it runs, then answers every question; the beta asks every `every`
    seconds and listens for the answers. connect(): async context manager of an authenticated websocket to Home Assistant."""
    if watch.channel not in (STABLE, BETA):
        return
    stable = watch.channel == STABLE
    delay = first_delay = min(1.0, retry)
    while True:
        try:
            async with connect() as ws:
                n = 1
                await ws.send_json({"id": n, "type": "subscribe_events", "event_type": PING if stable else HERE})

                async def fire(kind):
                    nonlocal n
                    n += 1
                    await ws.send_json({"id": n, "type": "fire_event", "event_type": kind,
                                        "event_data": {"channel": watch.channel, "version": watch.version}})

                if stable:
                    await fire(HERE)
                asked = first = None
                delay = first_delay
                while True:
                    now = time.monotonic()
                    if not stable and (asked is None or now - asked >= every):
                        await fire(PING)
                        asked = now
                        first = first or now
                    wait = every if stable else max(0.05, every - (now - asked))
                    if not stable and not watch.looked:
                        wait = min(wait, max(0.05, look - (now - first)))
                    try:
                        msg = await asyncio.wait_for(ws.receive(), wait)
                    except asyncio.TimeoutError:
                        msg = None
                    if msg is not None:
                        if msg.type != 1:                  # aiohttp.WSMsgType.TEXT; anything else: closed or an error
                            raise ConnectionError("websocket closed")
                        data = json.loads(msg.data)
                        ev = (data.get("event") or {}) if data.get("type") == "event" else {}
                        if stable and ev.get("event_type") == PING:
                            await fire(HERE)
                        elif not stable and ev.get("event_type") == HERE and watch.heard(ev.get("data")):
                            log.info("the normal 3D Floorplan (%s) runs too: this beta switches nothing by itself", watch.other)
                    if not stable and not watch.looked and time.monotonic() - first >= look:
                        watch.looked = True
        except asyncio.CancelledError:
            raise
        except Exception as err:  # noqa: BLE001 - must never stop the add-on
            log.info("normal/beta: no connection to Home Assistant (%s), again in %ss", err, delay)
            await asyncio.sleep(delay)
            delay = min(retry, delay * 2)
