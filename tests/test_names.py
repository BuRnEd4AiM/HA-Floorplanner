"""No function or class of the add-on is defined twice in one file: the second one silently replaces the first (#551: a new
ha_service(domain, service, data) replaced the garden's ha_service(domain, service, entity), and "💧 gießen" stopped working)."""
import ast
from collections import Counter
from pathlib import Path

APP = Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app"


def test_no_name_is_defined_twice():
    twice = {}
    for p in sorted(APP.glob("*.py")):
        names = [n.name for n in ast.parse(p.read_text()).body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))]
        dup = [n for n, c in Counter(names).items() if c > 1]
        if dup:
            twice[p.name] = dup
    assert twice == {}
