"""Who goes first in the heating rules (heatrules.ORDER), and thousands of random days that check it holds (the owner: "die Reihenfolge der
heizungsteureung muss stabiler sein und auch so das es da keine fehler gibt").

A day: windows open and shut, somebody taps 🚀 boost, the room gets warmer and cooler, everybody leaves and comes back, the holiday alarm
is armed, it gets warm outside, somebody turns a thermostat by hand, and every thermostat reports what it was sent only after a while (a
sleepy radiator thermostat: up to 10 minutes, its calls in the order they were sent). Now and then, once everything is reported, these
must hold for every thermostat:
- the rule that wins is the first in ORDER that applies (an open window always wins);
- the thermostat is as the winner wants it (the window: off or as cold as it goes; the boost: its temperature; too warm: the wish less
  the degrees set; a level: its temperature, or off in the summer pause) unless somebody turned it since the winner last changed;
- it is never left off without a reason;
- looking again changes nothing (no calls back and forth)."""
import datetime
import json
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "floorplan3d" / "rootfs" / "app"))
import heatrules as hr  # noqa: E402
import roomsensors as rs  # noqa: E402

ROOMS = [{"key": "h/wz", "name": "Wohnzimmer", "climates": ["climate.wz"], "windows": ["binary_sensor.wz"], "doors": [], "outer": [], "entities": []},
         {"key": "h/bad", "name": "Bad", "climates": ["climate.bad"], "windows": ["binary_sensor.bad"], "doors": [], "outer": [], "entities": []}]
WINDOW = {"h/wz": "binary_sensor.wz", "h/bad": "binary_sensor.bad"}
CLIMATE = {"h/wz": "climate.wz", "h/bad": "climate.bad"}
EMOJI = {"window": "🪟", "boost": "🚀", "warm": "🔥", "holiday": "✈️", "summer": "☀️", "away": "🚶", "schedule": "📅", "night": "🌙"}


def test_the_page_says_the_same_order():
    """📋 Heiz-Regeln → "Wer hat Vorrang?" lists the rules in the order the add-on goes by"""
    assert hr.ORDER == ("window", "boost", "warm", "holiday", "summer", "away", "schedule", "night") and set(EMOJI) == set(hr.ORDER)
    texts = re.findall(r"'hr\.prio\.text': '([^']*)'", (ROOT / "floorplan3d/rootfs/app/static/i18n.js").read_text(encoding="utf-8"))
    assert len(texts) >= 2
    for text in texts:
        assert [k for k in sorted(hr.ORDER, key=lambda k: text.find(EMOJI[k])) if EMOJI[k] in text] == list(hr.ORDER), text


def test_the_first_level_that_applies_wins():
    plan = {"days": [[[0, "comfort"]]] * 7}
    rules = hr.clean_rules({"schedule": {"on": True, "rooms": {"h/wz": plan}}, "night": {"on": True, "from": "00:00", "to": "23:59"}})
    ctx = {"holiday": True, "summer": True, "away": True}
    at = datetime.datetime(2026, 10, 26, 12, 0)
    got = []
    for k in hr.LEVEL_ORDER:
        got.append(hr.room_level(rules, ROOMS[0], at, ctx)["why"])
        ctx[k] = False
        if k == "schedule":
            rules["schedule"]["on"] = False
    assert got == list(hr.LEVEL_ORDER)
    rules["night"]["on"] = False
    assert hr.room_level(rules, ROOMS[0], at, ctx) is None


def thermostat(temp, modes):
    return {"state": "heat", "attributes": {"temperature": temp, "hvac_modes": list(modes), "min_temp": 5, "max_temp": 30, "current_temperature": 20.0}}


def aim(t):
    """what the winning rule wants of a thermostat (a level that sets it alike is no change)"""
    ov, lv = t.get("ov"), t.get("level") or {}
    if ov in ("window", "boost"):
        return (ov,)
    if ov == "warm":
        return ("warm", t.get("warmTo"))
    return ("level", bool(lv.get("off")), lv.get("temp")) if lv else (None,)


def lvkey(lv):
    return (bool(lv.get("off")), lv.get("temp"), lv.get("why")) if lv else None


class Day:
    """one random day of a house with two rooms"""

    def __init__(self, seed, delays):
        r = self.r = random.Random(seed)
        plan = {"days": [[[0, "night"], [r.choice([360, 390, 420]), "comfort"], [r.choice([480, 510]), "eco"], [r.choice([600, 660]), "comfort"],
                          [1320, "night"]]] * 7}
        self.rules = hr.clean_rules({
            "window": {"on": r.random() < 0.8, "delay": r.choice([0, 1, 2])},
            "schedule": {"on": r.random() < 0.7, "hand": r.choice([0, 5, 10]), "pre": r.choice([0, 0, 15]), "rooms": {k: plan for k in CLIMATE if r.random() < 0.8}},
            "warm": {"on": r.random() < 0.6},
            "away": {"on": r.random() < 0.4, "delay": r.choice([0, 5])},
            "night": {"on": r.random() < 0.3, "from": "22:00", "to": "06:00"},
            "summer": {"on": r.random() < 0.2, "above": 18, "hours": 0},
            "holiday": {"guard": r.random() < 0.2},
            "boost": {"minutes": r.choice([5, 10])}})
        self.states = {"climate.wz": thermostat(21.0, ("off", "heat", "auto")),
                       "climate.bad": thermostat(22.0, ("off", "heat") if r.random() < 0.7 else ("heat",)),   # one without "off": as cold as it goes
                       "binary_sensor.wz": {"state": "off"}, "binary_sensor.bad": {"state": "off"}, "person.anna": {"state": "home"},
                       "weather.home": {"state": "sunny", "attributes": {"temperature": 10}}}
        self.delay = {e: r.choice(delays) for e in CLIMATE.values()}     # seconds until a thermostat reports a call
        self.queue, self.guard = [], False                              # [(when it reports, thermostat, service, data)]
        self.now, self.local, self.mem = 1_000_000.0, datetime.datetime(2026, 10, 26, 5, 0), {}
        self.turned = {e: False for e in CLIMATE.values()}              # turned by hand since what the winner wants last changed
        self.under = {}                                                 # {thermostat: (turned, level)} when an override started
        self.moved = {}                                                 # the level changed during the override
        self.room = {k: 20.0 for k in CLIMATE}

    def report(self, everything=False):
        later = []
        for q in self.queue:
            if everything or q[0] <= self.now:
                e, svc, data = q[1:]
                if svc == "set_hvac_mode":
                    self.states[e]["state"] = data["hvac_mode"]
                else:
                    self.states[e]["attributes"]["temperature"] = data["temperature"]
            else:
                later.append(q)
        self.queue = later

    def look(self, minutes=0.0, at_once=False):
        self.now += minutes * 60
        self.local += datetime.timedelta(minutes=minutes)
        self.report()
        mem = json.loads(json.dumps(self.mem))                         # kept in rules-state.json between two looks
        before = {e: json.loads(json.dumps((mem.get("t") or {}).get(e) or {})) for e in CLIMATE.values()}   # step changes mem in place
        rule_calls, calls = self.step(mem)
        for e, svc, data in calls:
            if at_once or not self.lost(e, svc):
                self.queue.append((self.now + (0 if at_once else self.delay[e]), e, svc, data))
        self.follow(before, rule_calls)
        self.report()
        return calls

    def step(self, mem):
        """one look of the add-on: (the calls of the heating rules, the calls that go to the thermostats)"""
        self.mem, calls, self.status, _ = hr.step(self.rules, ROOMS, self.states, self.now, self.local, mem, guard_armed=self.guard, weather="weather.home")
        return calls, calls

    def seen(self):
        """the thermostats as the heating rules see them"""
        return self.states

    def lost(self, e, svc):
        """a call the thermostat never gets"""
        return False

    def wants(self, t):
        """the temperature the winning rule wants of a thermostat, None when it wants none (off, the window, no rule)"""
        ov, lv = t.get("ov"), t.get("level") or {}
        if ov == "warm":
            return t.get("warmTo")
        if ov == "boost":
            return self.rules["boost"]["temp"]
        return lv["temp"] if not ov and lv and not lv.get("off") else None

    def follow(self, before, calls=()):
        """keeps track of whether a turn by hand still counts (the add-on keeps it until what the winner wants changes, and puts it back
        with "as it was" after an override, or after too warm when it was turned meanwhile; under the schedule and while too warm it sets
        the winner's temperature again after the minutes of "hand", #592)"""
        for e, t0 in before.items():
            t = self.mem["t"].get(e) or {}
            ov, ov0, lv, lv0 = t.get("ov"), t0.get("ov"), t.get("level"), t0.get("level")
            if ov and not ov0:
                self.under[e], self.moved[e] = (self.turned[e], lvkey(lv0)), False
            elif ov and lvkey(lv) != lvkey(lv0):
                self.moved[e] = True
            if ov0 == "warm" and not ov and self.turned[e] and lvkey(lv) == lvkey(lv0):
                pass                                                   # turned while too warm: stays as turned
            elif ov0 and not ov and not self.moved.get(e) and e in self.under and lvkey(lv) == self.under[e][1]:
                self.turned[e] = self.under[e][0]                      # as it was
            elif aim(t) != aim(t0):
                self.turned[e] = False
            elif self.wants(t) is not None and any(c[0] == e and c[1] == "set_temperature" and c[2]["temperature"] == self.wants(t) for c in calls):
                self.turned[e] = False                                 # the winner's temperature again (back after "hand", sent once more)

    def happen(self):
        r, k = self.r, self.r.choice(list(CLIMATE))
        e, x = CLIMATE[k], r.random()
        if x < 0.15:
            w = self.states[WINDOW[k]]
            w["state"] = "off" if w["state"] == "on" else "on"
        elif x < 0.22:
            self.mem = hr.boost(self.mem, k, self.now, self.rules)
        elif x < 0.40:
            self.room[k] = min(27.0, max(14.0, self.room[k] + r.choice([-2, -1, -0.5, 0.5, 1, 2])))
            self.states[e]["attributes"]["current_temperature"] = self.room[k]
        elif x < 0.45:
            p = self.states["person.anna"]
            p["state"] = "not_home" if p["state"] == "home" else "home"
        elif x < 0.48:
            self.guard = not self.guard
        elif x < 0.51:
            self.states["weather.home"]["attributes"]["temperature"] = r.choice([5, 10, 22])
        elif x < 0.56:
            self.states[e]["attributes"]["temperature"] = r.choice([18.0, 19.5, 22.0, 23.0, 25.0])
            self.queue = [q for q in self.queue if q[1] != e or q[2] != "set_temperature"]   # turned at the device: the target on its way is lost
            self.turned[e] = True

    def check(self):
        self.report(everything=True)
        for _ in range(4):                                             # everything reported: what follows from it
            if not self.look(0, at_once=True):
                break
            self.report(everything=True)
        wrong = [f"calls again and again: {c}" for c in [self.look(0, at_once=True)] if c]
        seen = self.seen()
        for k, e in CLIMATE.items():
            t, st = self.mem["t"].get(e) or {}, seen[e]
            ov, lv, temp, mode = t.get("ov"), t.get("level"), st["attributes"]["temperature"], st["state"]
            w = self.rules["window"]
            due = (w["on"] and k not in w["skip"] and self.states[WINDOW[k]]["state"] == "on" and k in self.mem["open"]
                   and self.now - self.mem["open"][k] >= w["delay"] * 60 and not self.mem["skip"].get(k))
            boosted = self.mem["boost"].get(k, 0) > self.now
            if due != (ov == "window"):
                wrong.append(f"{e}: window open {due}, but the rule is {ov}")
            elif not due and boosted and ov != "boost":
                wrong.append(f"{e}: boost, but the rule is {ov}")
            elif not ov and lv and not lv.get("off") and self.rules["warm"]["on"] and self.room[k] >= lv["temp"] + 1:
                wrong.append(f"{e}: {self.room[k]}° in the room for {lv['temp']}°, not lowered")
            if self.turned[e]:
                continue
            if ov == "window" and not hr.paused(seen, e):
                wrong.append(f"{e}: window open, but {mode} {temp}")
            elif ov == "boost" and (mode == "off" or temp != self.rules["boost"]["temp"]):
                wrong.append(f"{e}: boost, but {mode} {temp}")
            elif ov == "warm" and (mode == "off" or temp != t.get("warmTo") or (lv and t["warmTo"] != max(5, lv["temp"] - 5))):
                wrong.append(f"{e}: too warm to {t.get('warmTo')} ({lv}), but {mode} {temp}")
            elif not ov and lv and (not hr.paused(seen, e) if lv.get("off") else (mode == "off" or temp != lv["temp"])):
                wrong.append(f"{e}: {lv['why']} {lv.get('temp', 'off')}, but {mode} {temp}")
            elif not ov and mode == "off" and not (lv or {}).get("off"):
                wrong.append(f"{e}: left off without a reason")
        return wrong

    def run(self, looks=150):
        for _ in range(looks):
            if self.r.random() < 0.6:
                self.happen()
            self.look(self.r.choice([0.25, 1, 1, 3, 10]))
            if self.r.random() < 0.3:
                wrong = self.check()
                if wrong:
                    return wrong
        return []


class SensorDay(Day):
    """a day with a room sensor that moves the target of the living room's thermostat (↕ Wunsch verschieben, roomsensors.py): the
    thermostat measures too warm at the radiator and loses some of the targets sent to it (the owner's, #592: a target it did not take
    became the wish, the room was heated to 26° while too warm said 12°); run as rulesrun._heat does. The rules see the wish as its
    target, so that is what must be as the winner wants it."""

    def __init__(self, seed, delays):
        super().__init__(seed, delays)
        r = self.r
        self.rules["sensors"] = rs.clean({"map": {"climate.wz": {"s": "sensor.wz", "way": "shift"}}})
        self.smem, self.radiator, self.loss = rs.clean_mem({}), r.choice([0.0, 1.5, 3.0]), r.choice([0.0, 0.3, 0.6])
        self.states["sensor.wz"] = {"state": "20.0", "attributes": {"unit_of_measurement": "°C"}}
        self.user, self.wished, self.false = None, [], []           # the last target somebody set at the device, wishes taken, wrong ones
        self.sync()

    def sync(self):
        self.states["sensor.wz"]["state"] = str(self.room["h/wz"])
        self.states["climate.wz"]["attributes"]["current_temperature"] = self.room["h/wz"] + self.radiator

    def happen(self):
        was = self.states["climate.wz"]["attributes"]["temperature"]
        super().happen()
        if self.states["climate.wz"]["attributes"]["temperature"] != was:
            self.user = self.states["climate.wz"]["attributes"]["temperature"]
        self.sync()

    def follow(self, before, calls=()):
        super().follow(before, calls)
        for v in self.wished:                                          # a target set elsewhere taken as the wish: only one somebody set
            if v == self.user:
                self.turned["climate.wz"] = True                       # (seen by the rules one look later than the thermostat reports it)
            else:
                self.false.append(f"climate.wz: {v}° taken as a wish, nobody set it (last set {self.user}°)")

    def step(self, mem):
        smem = json.loads(json.dumps(self.smem))                       # kept in rules-state.json too
        self.mem, calls, self.status, _ = hr.step(self.rules, ROOMS, rs.virtual(self.states, smem, hr.held(mem)), self.now, self.local, mem,
                                                  guard_armed=self.guard, weather="weather.home")
        hold = hr.held(self.mem)
        out = rs.route(calls, smem, hold, rs.moved(self.rules["sensors"], self.states, {}))
        self.smem, more, self.sstatus, log = rs.step(self.rules["sensors"], self.states, {}, smem, self.now, hold)
        self.wished = [x["v"] for x in log if x["act"] == "wish"]
        return calls, out + [(d["entity_id"], svc, {k: v for k, v in d.items() if k != "entity_id"}) for _, svc, d in more]

    def seen(self):
        return rs.virtual(self.states, self.smem, hr.held(self.mem))

    def lost(self, e, svc):
        return e == "climate.wz" and svc == "set_temperature" and self.r.random() < self.loss

    def check(self):
        return self.false + super().check()


def test_thousands_of_random_days_keep_the_order():
    bad = {}
    for delays, seeds in (((0, 5, 30), range(0, 120)), ((0, 0, 10, 60, 150, 300), range(1000, 1120)), ((120, 300, 600), range(2000, 2060))):
        for seed in seeds:
            wrong = Day(seed, delays).run()
            if wrong:
                bad[seed] = wrong
    assert not bad, f"{len(bad)} days went wrong, e.g. {next(iter(bad.items()))} (Day(seed, delays).run() shows it again)"


def test_random_days_with_a_room_sensor_and_a_thermostat_that_loses_targets():
    bad = {}
    for delays, seeds in (((0, 5, 30), range(0, 150)), ((0, 10, 60, 150), range(1000, 1150))):
        for seed in seeds:
            wrong = SensorDay(seed, delays).run()
            if wrong:
                bad[seed] = wrong
    assert not bad, f"{len(bad)} days went wrong, e.g. {next(iter(bad.items()))} (SensorDay(seed, delays).run() shows it again)"
