"""📅 Besondere Tage (specialdays.py, the owner 2026-11-01: "an Halloween, an Heiligabend soll zum Beispiel der Rollladen nicht ganz
hochfahren"): the days are checked, Easter and the public holidays of every German state, which day a date is, the template for Home
Assistant, and the page (static/specialdays.js) says the same as the add-on."""
import datetime
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

APP = Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"
sys.path.insert(0, str(APP))
import specialdays as sd  # noqa: E402

D = datetime.date


def test_days_are_checked():
    days = sd.clean_days([
        {"id": "d_xmas", "kind": "date", "name": " Heiligabend ", "icon": "🎄", "md": "12-24"},
        {"id": "d_xmas", "kind": "date", "md": "12-25"},                                   # the same id twice: the first stays
        {"id": "d_bad", "kind": "date", "md": "02-30"},                                    # no such day
        {"id": "d_leap", "kind": "date", "md": "02-29", "to": "02-29"},                     # to = from: no range
        {"id": "d_hol", "kind": "once", "from": "2026-12-21", "to": "2026-12-01"},          # to before from: one day
        {"id": "d_long", "kind": "once", "from": "2026-01-01", "to": "2028-01-01"},         # longer than a year: one day
        {"id": "d_ros", "kind": "easter", "off": -480},
        {"id": "d_ft", "kind": "holidays", "region": "XX"},
        {"id": "d_cal", "kind": "calendar", "ent": "sensor.x"},
        {"id": "d_cal2", "kind": "calendar", "ent": "calendar.feiertage"},
        {"id": "Bad", "kind": "date", "md": "01-01"}, {"id": "d_x", "kind": "nope"}, "x", None,
    ])
    assert days == [
        {"id": "d_xmas", "kind": "date", "name": "Heiligabend", "icon": "🎄", "md": "12-24"},
        {"id": "d_leap", "kind": "date", "name": "", "icon": "", "md": "02-29"},
        {"id": "d_hol", "kind": "once", "name": "", "icon": "", "from": "2026-12-21", "to": "2026-12-21"},
        {"id": "d_long", "kind": "once", "name": "", "icon": "", "from": "2026-01-01", "to": "2026-01-01"},
        {"id": "d_ros", "kind": "easter", "name": "", "icon": "", "off": -70},
        {"id": "d_ft", "kind": "holidays", "name": "", "icon": "", "region": "DE"},
        {"id": "d_cal2", "kind": "calendar", "name": "", "icon": "", "ent": "calendar.feiertage"},
    ]
    assert sd.clean_days("x") == [] and len(sd.clean_days([{"id": f"d_{n}", "kind": "date", "md": "01-01"} for n in range(40)])) == sd.MAX_DAYS
    assert sd.clean_ids(["d_a", "d_a", "x", 3, "d_b"]) == ["d_a", "d_b"] and sd.clean_ids(None) == []


def test_easter_and_the_holidays():
    assert [sd.easter(y) for y in (2024, 2025, 2026, 2027, 2038)] == [D(2024, 3, 31), D(2025, 4, 20), D(2026, 4, 5), D(2027, 3, 28), D(2038, 4, 25)]
    bw = sd.holidays("BW", 2026)                         # the owner lives in Baden-Württemberg
    assert [d.isoformat()[5:] for d, _ in bw] == ["01-01", "01-06", "04-03", "04-06", "05-01", "05-14", "05-25", "06-04", "10-03", "11-01", "12-25", "12-26"]
    assert [k for _, k in sd.holidays("DE", 2026)] == ["newyear", "goodfriday", "eastermonday", "mayday", "ascension", "whitmonday", "unity", "xmas1", "xmas2"]
    assert (D(2026, 11, 18), "repentance") in sd.holidays("SN", 2026) and (D(2025, 11, 19), "repentance") in sd.holidays("SN", 2025)
    assert (D(2026, 10, 31), "reformation") in sd.holidays("NI", 2026) and all(k != "reformation" for _, k in bw)
    assert (D(2026, 3, 8), "womensday") in sd.holidays("BE", 2026) and (D(2026, 9, 20), "childrensday") in sd.holidays("TH", 2026)
    for r in sd.REGIONS:                                 # every state has at least the nine of the whole country
        assert len(sd.holidays(r, 2027)) >= 9


def test_which_day_a_date_is():
    days = sd.clean_days([
        {"id": "d_xmas", "kind": "date", "md": "12-24"}, {"id": "d_wn", "kind": "date", "md": "12-27", "to": "01-06"},
        {"id": "d_once", "kind": "once", "from": "2026-11-02", "to": "2026-11-04"}, {"id": "d_ros", "kind": "easter", "off": -48},
        {"id": "d_ft", "kind": "holidays", "region": "BW"}, {"id": "d_cal", "kind": "calendar", "ent": "calendar.urlaub"}])
    assert sd.which(days, D(2026, 12, 24)) == ["d_xmas"]
    assert sd.which(days, D(2027, 1, 6)) == ["d_wn", "d_ft"] and sd.which(days, D(2026, 12, 30)) == ["d_wn"] and sd.which(days, D(2027, 1, 7)) == []
    assert sd.which(days, D(2026, 11, 3)) == ["d_once"] and sd.which(days, D(2027, 11, 3)) == []
    assert sd.which(days, D(2026, 2, 16)) == ["d_ros"] and sd.which(days, D(2027, 2, 8)) == ["d_ros"]       # Rosenmontag
    assert sd.which(days, D(2026, 11, 1)) == ["d_ft"]
    on = {"calendar.urlaub": {"state": "on"}}
    assert sd.which(days, D(2026, 8, 3), on) == ["d_cal"] and sd.which(days, D(2026, 8, 3), {"calendar.urlaub": {"state": "off"}}) == []
    assert sd.is_special(days, [], D(2026, 12, 24)) and not sd.is_special(days, ["d_ft"], D(2026, 12, 24))
    assert sd.is_special(days, ["d_ft", "d_xmas"], D(2026, 12, 24)) and not sd.is_special(days, ["d_gone"], D(2026, 12, 24))
    assert not sd.is_special([], [], D(2026, 12, 24))


def test_the_template_for_home_assistant():
    days = sd.clean_days([
        {"id": "d_xmas", "kind": "date", "md": "12-24"}, {"id": "d_wn", "kind": "date", "md": "12-27", "to": "01-06"},
        {"id": "d_ws", "kind": "date", "md": "12-24", "to": "12-26"}, {"id": "d_once", "kind": "once", "from": "2026-11-02", "to": "2026-11-04"},
        {"id": "d_one", "kind": "once", "from": "2026-11-09", "to": "2026-11-09"}, {"id": "d_ros", "kind": "easter", "off": -48},
        {"id": "d_ft", "kind": "holidays", "region": "BW"}, {"id": "d_cal", "kind": "calendar", "ent": "calendar.urlaub"}])
    md, ymd = "now().strftime('%m-%d')", "now().strftime('%Y-%m-%d')"
    assert sd.ha_template(days, ["d_xmas"], 2026) == f"{md} == '12-24'"
    assert sd.ha_template(days, ["d_wn"], 2026) == f"({md} >= '12-27' or {md} <= '01-06')"
    assert sd.ha_template(days, ["d_ws", "d_once", "d_one"], 2026) == f"'12-24' <= {md} <= '12-26' or '2026-11-02' <= {ymd} <= '2026-11-04' or {ymd} == '2026-11-09'"
    assert sd.ha_template(days, ["d_cal"], 2026) == "is_state('calendar.urlaub', 'on')"
    ros = sd.ha_template(days, ["d_ros"], 2026, years=2)
    assert ros == f"{ymd} in ['2026-02-16', '2027-02-08']"
    ft = sd.ha_template(days, ["d_ft"], 2026)
    assert ft.startswith(f"{ymd} in ['2026-01-01', '2026-01-06'") and "'2035-12-26'" in ft and "'2036-01-01'" not in ft
    assert ft.count("'20") == 12 * 10
    every = sd.ha_template(days, [], 2026)
    assert every.startswith(f"{ymd} in [") and every.endswith("is_state('calendar.urlaub', 'on')") and every.count(" or ") == 7   # six between seven parts, one inside "12-27 … 01-06"
    assert sd.ha_template(days, ["d_gone"], 2026) == "false" and sd.ha_template([], [], 2026) == "false"
    assert sd.calendars(days, []) == ["calendar.urlaub"] and sd.calendars(days, ["d_xmas"]) == []


SCRIPT = """
const S = await import(process.argv[1] + '/specialdays.js');
const out = { holidays: {}, kinds: S.KINDS, regions: S.REGIONS, max: [S.MAX_DAYS, S.MAX_ONCE], clean: S.cleanDays(JSON.parse(process.argv[2])), which: {} };
for (const r of S.REGIONS) for (let y = 2020; y <= 2040; y++) out.holidays[`${r}/${y}`] = S.holidays(r, y).map((h) => [h.date, h.key]);
const days = S.cleanDays(JSON.parse(process.argv[2]));
for (let i = 0; i < 800; i++) { const d = new Date(2026, 0, 1 + i); out.which[S.ymd(d)] = S.which(days, d, { 'calendar.urlaub': { state: 'on' } }); }
console.log(JSON.stringify(out));
"""


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
def test_the_page_says_the_same():
    raw = [{"id": "d_xmas", "kind": "date", "md": "12-24", "name": " X "}, {"id": "d_wn", "kind": "date", "md": "12-27", "to": "01-06"},
           {"id": "d_once", "kind": "once", "from": "2026-11-02", "to": "2026-11-04"}, {"id": "d_ros", "kind": "easter", "off": -48},
           {"id": "d_ft", "kind": "holidays", "region": "SN"}, {"id": "d_ft2", "kind": "holidays", "region": "HE"}, {"id": "d_cal", "kind": "calendar", "ent": "calendar.urlaub"},
           {"id": "d_bad", "kind": "date", "md": "02-30"}, {"id": "d_long", "kind": "once", "from": "2026-01-01", "to": "2028-01-01"}, {"id": "d_o", "kind": "easter", "off": 99}]
    with_mod = subprocess.run(["node", "--input-type=module", "-e", SCRIPT, str(APP / "static"), json.dumps(raw)], capture_output=True, text=True, check=True)
    js = json.loads(with_mod.stdout)
    assert tuple(js["kinds"]) == sd.KINDS and tuple(js["regions"]) == sd.REGIONS and js["max"] == [sd.MAX_DAYS, sd.MAX_ONCE]
    assert js["clean"] == sd.clean_days(raw)
    for r in sd.REGIONS:
        for y in range(2020, 2041):
            assert js["holidays"][f"{r}/{y}"] == [[d.isoformat(), k] for d, k in sd.holidays(r, y)], (r, y)
    days = sd.clean_days(raw)
    for i in range(800):
        d = D(2026, 1, 1) + datetime.timedelta(days=i)
        assert js["which"][d.isoformat()] == sd.which(days, d, {"calendar.urlaub": {"state": "on"}}), d
