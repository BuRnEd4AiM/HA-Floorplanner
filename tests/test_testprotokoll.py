"""The overview in docs/TESTPROTOKOLL.md is computed from the result tables (tools/testprotokoll.py) and must be current."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import testprotokoll as tp  # noqa: E402

DOC = """### 1. Eins
| Nr. | Prüfpunkt | Ergebnis |
|---|---|---|
| 1.1 | a | ✅ ab 3.22.0 (vorher ❌) |
| 1.2 | b | ❓ |
| 1.3 | c | |
| 1.4 | d | ❌ geht nicht |
| 1.5 | e | ➖ |
| 1.6 | f | ❓ |

## 2. Zwei
| Nr. | Was tun | Erwartung | Ergebnis |
|---|---|---|---|
| 2.1 | x | y | ✅ |

## Ohne Tabelle
Text
"""


def test_counts_first_symbol_and_open_numbers():
    (one, two) = tp.collect(DOC)
    assert one["title"] == "1. Eins"
    assert one["n"] == {"✅": 1, "❌": 1, "❓": 3, "➖": 1}
    assert one["open"] == ["1.2", "1.3", "1.6"] and one["bad"] == ["1.4"]
    assert two["n"]["✅"] == 1


def test_ranges():
    assert tp.ranges(["24.1", "24.2", "24.3", "24.5", "24.6", "12.6a"]) == ["24.1 bis 24.3", "24.5", "24.6", "12.6a"]


def test_overview_row_and_total():
    table = tp.overview(tp.collect(DOC))
    assert "| 1. Eins | 1 | 1 | 3 | 1 | ❌ 1.4, 1.2, 1.3, 1.6 |" in table
    assert "| **Zusammen** | **2** | **1** | **3** | **1** | |" in table


def test_overview_in_document_is_current():
    r = subprocess.run([sys.executable, str(ROOT / "tools" / "testprotokoll.py"), "--check"], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout
