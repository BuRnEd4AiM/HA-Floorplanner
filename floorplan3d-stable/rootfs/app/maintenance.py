"""🔧 Wartung of the 🩺 Haus-Check (5.24.0, docs/ideen-5.21 picture 1): the reminders kept in settings.maintenance, checked the same way as
cleanReminders in static/housecheck.js: [{id ("m_…"), name, icon, every (days 1 … 3650), last ("YYYY-MM-DD" or ""), device (an id of the
plan or "")}], at most 60. Pure (unit test: tests/test_maintenance.py)."""
import re

ID = re.compile(r"^m_[a-z0-9]{3,16}$")
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX = 60


def clean_reminders(val) -> list:
    out, ids = [], set()
    for r in val if isinstance(val, list) else []:
        if not isinstance(r, dict) or not isinstance(r.get("id"), str) or not ID.match(r["id"]) or r["id"] in ids:
            continue
        ids.add(r["id"])
        name = r.get("name").strip()[:60] if isinstance(r.get("name"), str) and r["name"].strip() else "?"
        icon = r.get("icon").strip() if isinstance(r.get("icon"), str) and r["icon"].strip() and len(r["icon"].strip()) <= 4 else "🔧"
        every = r.get("every") if isinstance(r.get("every"), int) and not isinstance(r.get("every"), bool) and 1 <= r["every"] <= 3650 else 90
        last = r.get("last") if isinstance(r.get("last"), str) and DAY.match(r["last"]) else ""
        device = r.get("device") if isinstance(r.get("device"), str) and len(r["device"]) <= 40 else ""
        out.append({"id": r["id"], "name": name, "icon": icon, "every": every, "last": last, "device": device})
        if len(out) >= MAX:
            break
    return out
