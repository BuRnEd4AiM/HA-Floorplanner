"""Security (Sicherheit): a recorder of what happened in the house, one file per day.

The add-on keeps its own websocket to Home Assistant (separate from the live view, so neither disturbs the other) and writes
every change of the entities placed in the floor plans into <addon config>/timeline/YYYY-MM-DD.jsonl, one JSON object per line:

    {"t": 1700000000.0, "snap": {"light.kitchen": {"state": "on", "brightness": 80}, ...}}   all states at that moment
    {"t": 1700000012.3, "e": "light.kitchen", "s": {"state": "off"}}                             one change

A day file starts with a snapshot (at midnight, or when the add-on started), so a day can be played back on its own. After a
lost connection a new snapshot is written. Only the fields the 3D view draws are kept (state, brightness, colour, position ...),
sensors (temperature, power ...) at most every few minutes, so a day stays small (typically well under a megabyte). Days older
than the configured number of days are deleted. Writes are collected and appended every few seconds: Home Assistant itself is
only asked once (the subscription), nothing is ever written to it.
"""
import asyncio
import datetime
import json
import logging
import re
import threading
import time
from pathlib import Path

log = logging.getLogger("floorplan3d.timeline")

DAY_NAME = re.compile(r"^(\d{4}-\d{2}-\d{2})\.jsonl$")
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# domains that switch (lights, doors, covers, people ...): every change is kept
EVENT_DOMAINS = {"light", "switch", "binary_sensor", "cover", "fan", "media_player", "climate", "lock", "input_boolean",
                 "person", "device_tracker", "alarm_control_panel", "vacuum", "siren", "humidifier", "water_heater", "valve"}
# domains whose value changes all the time (temperature, power ...): kept at most every THROTTLE seconds
SLOW_DOMAINS = {"sensor"}
THROTTLE = 300.0
ENTITY = re.compile(r"^([a-z_]+)\.[a-z0-9_]+$")
KEEP = ("state", "unit", "brightness", "position", "rgb", "dc", "ct", "ch", "hvac", "tt", "fxc", "since")
MAX_DAY_BYTES = 30 * 1024 * 1024          # a day file never grows beyond this (a runaway sensor must not fill the disk)


def layout_entities(obj, out: set | None = None) -> set:
    """Every entity id in a floor plan (devices, LED rings, doors and windows with contacts ...) of a domain worth recording."""
    out = set() if out is None else out
    if isinstance(obj, dict):
        for v in obj.values():
            layout_entities(v, out)
    elif isinstance(obj, list):
        for v in obj:
            layout_entities(v, out)
    elif isinstance(obj, str) and len(obj) <= 120:
        m = ENTITY.match(obj)
        if m and (m.group(1) in EVENT_DOMAINS or m.group(1) in SLOW_DOMAINS):
            out.add(obj)
    return out


def compact(slim: dict | None) -> dict:
    """The fields of a slim state (server.slim_state) the playback draws; empty ones left out."""
    if not slim:
        return {"state": "unavailable"}
    return {k: slim[k] for k in KEEP if slim.get(k) is not None}


def day_of(t: float, tz) -> str:
    return datetime.datetime.fromtimestamp(t, tz).strftime("%Y-%m-%d")


def day_start(day: str, tz) -> float:
    """Epoch seconds of midnight at the start of the day (in the time zone of Home Assistant)."""
    d = datetime.datetime.strptime(day, "%Y-%m-%d")
    if tz is None:
        return d.timestamp()
    return d.replace(tzinfo=tz).timestamp()


def next_day(day: str) -> str:
    return (datetime.datetime.strptime(day, "%Y-%m-%d") + datetime.timedelta(days=1)).strftime("%Y-%m-%d")


def list_days(folder: Path) -> list:
    """The recorded days, newest first: [{day, size}]."""
    items = []
    if folder.is_dir():
        for f in folder.iterdir():
            m = DAY_NAME.match(f.name)
            if m and f.is_file():
                items.append({"day": m.group(1), "size": f.stat().st_size})
    return sorted(items, key=lambda i: i["day"], reverse=True)


def prune_days(folder: Path, today: str, keep_days: float) -> list:
    """Delete day files older than keep_days before today (today and that many days before it stay)."""
    cutoff = (datetime.datetime.strptime(today, "%Y-%m-%d") - datetime.timedelta(days=int(keep_days))).strftime("%Y-%m-%d")
    gone = []
    for item in list_days(folder):
        if item["day"] < cutoff:
            (folder / f"{item['day']}.jsonl").unlink(missing_ok=True)
            gone.append(item["day"])
    return gone


def read_day(folder: Path, day: str) -> list:
    """The lines of a day file as objects; a damaged line (power cut while writing) is skipped."""
    p = folder / f"{day}.jsonl"
    out = []
    if not p.is_file():
        return out
    with p.open("r", encoding="utf-8") as fh:
        for line in fh:
            try:
                obj = json.loads(line)
            except ValueError:
                continue
            if isinstance(obj, dict) and isinstance(obj.get("t"), (int, float)):
                out.append(obj)
    return out


class Recorder:
    """What is written where. No network here: the websocket loop (run_recorder) feeds it, the tests call it directly."""

    def __init__(self, folder: Path, tz=None):
        self.folder = folder
        self.tz = tz
        self.tracked: set = set()
        self.current: dict = {}        # entity_id -> compact state last seen (also of the throttled ones)
        self.written: dict = {}        # entity_id -> compact state last written
        self.last_write: dict = {}     # entity_id -> time of its last line (throttle)
        self.lines: list = []          # (day, line) waiting to be appended
        self.day = None                # the day the last snapshot was written for
        self.full: set = set()         # days that reached MAX_DAY_BYTES
        self.lock = threading.Lock()   # flush runs in a worker thread (also for a browser asking for today)

    def set_tracked(self, ids: set) -> bool:
        """The entities of the floor plans; True when some are new (their states must be fetched: a fresh snapshot)."""
        new = set(ids) - self.tracked
        self.tracked = set(ids)
        for k in list(self.current):
            if k not in self.tracked:
                self.current.pop(k, None)
                self.written.pop(k, None)
        return bool(new)

    def _line(self, t: float, obj: dict) -> None:
        with self.lock:
            self.lines.append((day_of(t, self.tz), json.dumps({"t": round(t, 1), **obj}, separators=(",", ":"))))

    def snapshot(self, states: list | None, t: float) -> None:
        """All states at once (start, reconnect, midnight). states: slim states of Home Assistant, None = what is known."""
        if states is not None:
            self.current = {s["entity_id"]: compact(s) for s in states if s.get("entity_id") in self.tracked}
        if not self.tracked:
            self.day = None            # nothing placed in any plan yet: nothing to record (no empty files)
            return
        snap = {k: v for k, v in self.current.items() if k in self.tracked}
        self._line(t, {"snap": snap})
        self.written = dict(snap)
        self.last_write = {k: t for k in snap}
        self.day = day_of(t, self.tz)

    def change(self, entity_id: str, slim: dict | None, t: float) -> None:
        """One state_changed event of Home Assistant (slim: server.slim_state of the new state, None = removed)."""
        if entity_id not in self.tracked:
            return
        if self.day != day_of(t, self.tz):
            self.roll(t)               # first the states at midnight, then this change
        self.current[entity_id] = compact(slim)
        self._maybe_write(entity_id, t)

    def _maybe_write(self, entity_id: str, t: float, force: bool = False) -> None:
        c = self.current.get(entity_id)
        if c is None or self.written.get(entity_id) == c:
            return
        slow = entity_id.split(".")[0] in SLOW_DOMAINS
        if slow and not force and t - self.last_write.get(entity_id, 0) < THROTTLE:
            return                     # tick() writes it once the time is up
        self._line(t, {"e": entity_id, "s": c})
        self.written[entity_id] = c
        self.last_write[entity_id] = t

    def roll(self, t: float) -> None:
        """A new day began: its file starts with the states at midnight."""
        self.snapshot(None, max(day_start(day_of(t, self.tz), self.tz), t - 86400) if self.day else t)

    def tick(self, t: float) -> None:
        """Every few seconds: a new day, throttled sensors that are due."""
        if self.day and self.day != day_of(t, self.tz):
            self.roll(t)
        for k in list(self.current):
            if k.split(".")[0] in SLOW_DOMAINS:
                self._maybe_write(k, t)

    def flush(self) -> int:
        """Append the waiting lines to their day files; returns how many were written."""
        with self.lock:
            if not self.lines:
                return 0
            lines, self.lines = self.lines, []
        self.folder.mkdir(parents=True, exist_ok=True)
        by_day: dict = {}
        for day, line in lines:
            by_day.setdefault(day, []).append(line)
        n = 0
        for day, rows in by_day.items():
            p = self.folder / f"{day}.jsonl"
            size = p.stat().st_size if p.is_file() else 0
            if size > MAX_DAY_BYTES:
                if day not in self.full:
                    self.full.add(day)
                    log.warning("security view: %s is full (%d MB), further changes of that day are not recorded", p.name, MAX_DAY_BYTES >> 20)
                continue
            with p.open("a", encoding="utf-8") as fh:
                fh.write("\n".join(rows) + "\n")
            n += len(rows)
        return n


async def run_recorder(rec: Recorder, *, connect, slim_state, tracked, settings, tz_name=None, check: float = 5.0):
    """Keep a websocket to Home Assistant and feed the recorder. connect(): async context manager of an authenticated websocket
    (the server knows the token); tracked(): entity ids of the floor plans; settings(): (on, keep_days). Never raises."""
    delay = 1
    while True:
        try:
            on, keep = await asyncio.to_thread(settings)
            if not on:
                await asyncio.to_thread(rec.flush)
                await asyncio.sleep(30)
                continue
            rec.set_tracked(await asyncio.to_thread(tracked))
            async with connect() as ws:
                await ws.send_json({"id": 1, "type": "subscribe_events", "event_type": "state_changed"})
                await ws.send_json({"id": 2, "type": "get_states"})
                asks, next_id = {2}, 3             # get_states requests on their way (the answer is the snapshot)
                delay = 1
                last_look = time.monotonic()
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.receive(), check)
                    except asyncio.TimeoutError:
                        msg = None
                    now = time.time()
                    if msg is not None:
                        if msg.type != 1:                          # aiohttp.WSMsgType.TEXT; anything else: closed or an error
                            raise ConnectionError("websocket closed")
                        data = json.loads(msg.data)
                        if data.get("id") in asks and data.get("type") == "result" and isinstance(data.get("result"), list):
                            asks.discard(data["id"])
                            rec.snapshot([slim_state(s) for s in data["result"] if isinstance(s, dict) and s.get("entity_id")], now)
                        elif data.get("type") == "event" and rec.day:
                            d = (data.get("event") or {}).get("data") or {}
                            if d.get("entity_id"):
                                rec.change(d["entity_id"], slim_state(d["new_state"]) if d.get("new_state") else None, now)
                    if time.monotonic() - last_look >= check:
                        last_look = time.monotonic()
                        if rec.day:
                            rec.tick(now)
                        await asyncio.to_thread(rec.flush)
                        on, keep = await asyncio.to_thread(settings)
                        if not on:
                            break
                        ids = await asyncio.to_thread(tracked)
                        if ids != rec.tracked and rec.set_tracked(ids):
                            await ws.send_json({"id": next_id, "type": "get_states"})   # something new was placed: a snapshot with it
                            asks.add(next_id)
                            next_id += 1
                        if rec.day:
                            await asyncio.to_thread(prune_days, rec.folder, day_of(now, rec.tz), keep)
        except asyncio.CancelledError:
            try:
                rec.flush()
            except OSError:
                pass
            raise
        except Exception as err:  # noqa: BLE001 - the recorder must never stop the add-on
            log.info("security view recorder interrupted (%s), retrying in %ss", err, delay)
        try:
            await asyncio.to_thread(rec.flush)
        except OSError:
            pass
        rec.day = None                 # after a gap the next connection starts with a fresh snapshot
        await asyncio.sleep(delay)
        delay = min(60, delay * 2)
