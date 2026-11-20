"""🔧 Wartung of the 🩺 Haus-Check (maintenance.py, 5.24.0): reminders checked like static/housecheck.js."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"))
import maintenance as mt  # noqa: E402


def test_reminders_are_checked():
    good = {"id": "m_abc123", "name": " Rauchmelder testen ", "icon": "🚨", "every": 365, "last": "2026-11-20", "device": "d12"}
    out = mt.clean_reminders([good, {**good}, {"id": "bad"}, "x", {"id": "m_xyz", "every": 0, "last": "gestern", "icon": "toolong!"}])
    assert out == [{"id": "m_abc123", "name": "Rauchmelder testen", "icon": "🚨", "every": 365, "last": "2026-11-20", "device": "d12"},
                   {"id": "m_xyz", "name": "?", "icon": "🔧", "every": 90, "last": "", "device": ""}]
    assert mt.clean_reminders(None) == [] and len(mt.clean_reminders([{"id": f"m_a{i:03d}"} for i in range(80)])) == 60
