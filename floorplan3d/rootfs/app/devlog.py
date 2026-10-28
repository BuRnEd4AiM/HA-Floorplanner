"""📜 Protokoll (the owner, 2026-10-28: "eine eigene Seite, wo alles quasi passiert … wo alle Geräte verbunden sind, wo man dann auch …
exportieren kann für eine Fehleranalyse … alle Geräte drin hat, die in den Plänen verwendet werden"; his choice from docs/ideen-4.40/: every
device of the plans with who it was, a device's day on the side, export as text, .txt and .csv, kept as long as the 🛡 Sicherheit
recording, only for admins). The recorder (timeline.py) writes every change of a device of the plans into its day file; this module says
who it was (Who), and makes the day's lines into the events of the page (events, api/log).

Who did it (Who.who), the first that fits:
- the add-on: a command it sent to the device a moment ago that asked for what the device does now (own: a heating rule, the room sensor, a routine, a scene, a button of a page,
  the garden, the holiday alarm); a thermostat's target or mode within 30 minutes when it is what was sent (a sleepy one reports late)
- a service call Home Assistant announced for the device a moment ago (its call_service event): an automation or a script (its name from
  automation_triggered / script_started with the same context), a person in Home Assistant (user_id → person), Home Assistant itself
- what the context of the new state says, the same way; else the device itself (at the device, its remote, or its integration)
A device that stops reporting (unavailable, unknown) is "off", nobody's.

Lines of a day file (timeline.py): {"t", "snap": {…}} the states at once, {"t", "e", "s", "w"} a change with who it was, {"t", "c": {src, n,
e: [entities], sv: "domain.service", v: {data}, ok, err, u}} a command of the add-on, {"t", "x": "off", "err"} the connection lost.

Pure (unit test: tests/test_devlog.py)."""

WINDOW = 60.0              # s: a change this soon after a command for the device is that command's
SLOW = 30 * 60             # s: … for a thermostat, when it is the value sent (a sleepy radiator thermostat reports late)
OWN_ECHO = 5.0             # s: Home Assistant announces the add-on's own call this soon after it
GONE = ("unavailable", "unknown")
MAX_CTX = 300              # contexts of automations and scripts kept
SHOWN = ("state", "brightness", "position", "tt")   # what makes a change worth a line (not the measured temperature, not heating/idle)
MAX_EVENTS = 20000
SKIP = {"entity_id", "device_id", "area_id"}


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _ents(v) -> list:
    if isinstance(v, str):
        return [v]
    return [x for x in v if isinstance(x, str)] if isinstance(v, list) else []


def data_of(data) -> dict:
    """what a command carries besides its target, small (for the page: "an, 80 %", "Soll 21°")"""
    out = {}
    for k, v in (data or {}).items():
        if k in SKIP or len(out) >= 8:
            continue
        if isinstance(v, (int, float, bool)) or v is None:
            out[k] = v
        elif isinstance(v, str):
            out[k] = v[:60]
        elif isinstance(v, list) and len(v) <= 4 and all(isinstance(x, (int, float)) for x in v):
            out[k] = v
    return out


class Who:
    """who switched a device: the add-on's own commands (own), Home Assistant's service calls (service), the automations and scripts that
    ran (started), the persons (people: {user id: name}), the add-on's own user id (me, learned from the echo of its own call)"""

    def __init__(self):
        self.calls: dict = {}      # entity -> [[time, by, service, data]]
        self.ctx: dict = {}        # context id -> {"k": "auto", "n": name}
        self.people: dict = {}
        self.me = None

    def _add(self, e, t, by, svc, data):
        keep = [x for x in self.calls.get(e) or [] if t - x[0] < SLOW][-7:]
        self.calls[e] = keep + [[t, by, svc, data or {}]]

    def own(self, ents, svc, data, src, name, t):
        """the add-on sent a command (src: heat, sensor, flow, page, scene, garden, guard; name: the rule, routine, scene or user)"""
        by = {"k": "addon", "src": src, "n": name}
        for e in _ents(ents):
            self._add(e, t, by, svc, data)

    def started(self, ev):
        """an automation_triggered or script_started event: its context is the automation's"""
        d, c = ev.get("data") or {}, (ev.get("context") or {}).get("id")
        if isinstance(c, str):
            self.ctx[c] = {"k": "auto", "n": str(d.get("name") or d.get("entity_id") or "")[:80] or None}
            for k in list(self.ctx)[:-MAX_CTX]:
                self.ctx.pop(k)

    def set_people(self, states):
        """{user id: name} from the person entities (raw states of Home Assistant)"""
        for s in states or []:
            a = (s or {}).get("attributes") or {}
            if str(s.get("entity_id", "")).startswith("person.") and isinstance(a.get("user_id"), str):
                self.people[a["user_id"]] = a.get("friendly_name") or s["entity_id"]

    def _by(self, ctx) -> dict | None:
        """who a context of Home Assistant is; None: the add-on itself"""
        ctx = ctx or {}
        for k in ("id", "parent_id"):
            if ctx.get(k) in self.ctx:
                return dict(self.ctx[ctx[k]])
        uid = ctx.get("user_id")
        if uid and uid == self.me:
            return None
        if uid:
            return {"k": "user", "n": self.people.get(uid)}
        if ctx.get("parent_id"):
            return {"k": "auto", "n": None}
        return {"k": "ha"}

    def service(self, ev, t):
        """a call_service event of Home Assistant: who asked for which devices (the add-on's own echo teaches its user id)"""
        d = ev.get("data") or {}
        sd = d.get("service_data") if isinstance(d.get("service_data"), dict) else {}
        ents, svc, uid = _ents(sd.get("entity_id")), d.get("service"), (ev.get("context") or {}).get("user_id")
        if any(x[1]["k"] == "addon" and x[2] == svc and t - x[0] < OWN_ECHO for e in ents for x in self.calls.get(e) or []):
            if isinstance(uid, str):
                self.me = uid
            return
        by = self._by(ev.get("context"))
        if by is None:
            by = {"k": "addon", "src": None, "n": None}
        for e in ents:
            self._add(e, t, by, svc, data_of(sd))

    def who(self, e, new, t) -> dict:
        """who it was that device e has the state new now (raw state of Home Assistant with attributes and context)"""
        new = new or {}
        st, dom = new.get("state"), e.split(".")[0]
        if st in GONE or not new:
            return {"k": "off"}
        a = new.get("attributes") or {}
        for x in reversed(self.calls.get(e) or []):
            age = t - x[0]
            if dom == "climate":
                if age >= SLOW or not _fits(x[2], x[3], st, a):
                    continue
            elif age >= WINDOW or not _fits_state(x[2], st):     # switched back at the wall right after: not the command's
                continue
            return {**x[1], "ago": round(age)}
        by = self._by(new.get("context"))
        if by is None:
            return {"k": "addon"}
        return {"k": "dev"} if by["k"] == "ha" else by


def _fits(svc, data, state, attrs) -> bool:
    """a thermostat's new state is what the command asked for"""
    if svc == "set_temperature":
        want, have = _num(data.get("temperature")), _num(attrs.get("temperature"))
        step = _num(attrs.get("target_temp_step")) or 0.5
        return want is not None and have is not None and abs(want - have) <= step / 2 + 0.001
    if svc == "set_hvac_mode":
        return state == data.get("hvac_mode")
    if svc == "turn_off":
        return state == "off"
    if svc == "turn_on":
        return state not in ("off", *GONE)
    return False


FITS = {"turn_on": None, "turn_off": ("off",), "open_cover": ("open", "opening"), "close_cover": ("closed", "closing"), "lock": ("locked", "locking"),
        "unlock": ("unlocked", "unlocking", "open"), "media_play": ("playing",), "media_pause": ("paused",), "media_stop": ("idle", "off", "paused")}


def _fits_state(svc, state) -> bool:
    """a device's new state is what the command asked for (on after turn_on, closing or closed after close_cover …; any for the rest)"""
    if svc not in FITS:
        return True
    want = FITS[svc]
    return state not in ("off", *GONE) if want is None else state in want


def _shown(s) -> dict:
    return {k: s.get(k) for k in SHOWN if isinstance(s, dict) and s.get(k) is not None}


def relevant(e, a, b) -> bool:
    """a change worth a line: what is shown changed; a sensor (temperature, power …) only when it stops or starts reporting"""
    if e.split(".")[0] == "sensor":
        return a is not None and ((a.get("state") in GONE) != ((b or {}).get("state") in GONE))
    return a is None or _shown(a) != _shown(b)


def events(lines, known=None) -> list:
    """The lines of one or more day files (timeline.read_day, in order) as the events of the page: [{t, k: "s" (a device changed: e, a
    (before, None: not known), b (after), w (who)) | "c" (a command of the add-on: src, n, e, sv, v, ok, err, u) | "x" (the connection
    lost: err)}], the newest last, at most MAX_EVENTS. A snapshot after a gap brings the changes missed meanwhile (w: gap). known: the
    states before the first line."""
    cur, out, first = dict(known or {}), [], known is None
    for ln in lines:
        t = ln.get("t")
        if isinstance(ln.get("snap"), dict):
            if not first:
                for e, s in ln["snap"].items():
                    if e in cur and relevant(e, cur[e], s):
                        out.append({"t": t, "k": "s", "e": e, "a": _shown(cur[e]), "b": _shown(s), "w": {"k": "gap"}})
            cur.update(ln["snap"])
            first = False
        elif isinstance(ln.get("e"), str) and isinstance(ln.get("s"), dict):
            e, s = ln["e"], ln["s"]
            a = cur.get(e)
            cur[e] = s
            if relevant(e, a, s):
                out.append({"t": t, "k": "s", "e": e, "a": _shown(a) if a is not None else None, "b": _shown(s), "w": ln.get("w") or {"k": "dev"}})
        elif isinstance(ln.get("c"), dict):
            c = ln["c"]
            out.append({"t": t, "k": "c", "src": c.get("src"), "n": c.get("n"), "e": _ents(c.get("e")), "sv": c.get("sv"), "v": c.get("v") or {},
                        "ok": c.get("ok") is not False, "err": c.get("err"), "u": c.get("u")})
        elif ln.get("x") == "off":
            out.append({"t": t, "k": "x", "err": ln.get("err")})
    return out[-MAX_EVENTS:]


def command(src, name, domain, service, data, ok, err=None, user=None) -> dict:
    """a command of the add-on as written into the day file"""
    data = data if isinstance(data, dict) else {}
    return {"src": src, "n": (str(name)[:80] if name else None), "e": _ents(data.get("entity_id"))[:20], "sv": f"{domain}.{service}", "v": data_of(data),
            "ok": bool(ok), "err": (str(err)[:160] if err and not ok else None), "u": (str(user)[:80] if user else None)}
