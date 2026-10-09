#!/usr/bin/env python3
"""Keeps the overview in docs/TESTPROTOKOLL.md in step with the result tables below it.

Every section with a numbered test table ("| Nr. | ... | Ergebnis | ...") is counted: the first of ✅ ❌ ❓ ➖ in its
"Ergebnis" cell decides (an empty cell counts as ❓). The overview table between the two AUTO markers is rewritten,
together with the numbers that are still open or failing.

    python3 tools/testprotokoll.py          # rewrite the overview
    python3 tools/testprotokoll.py --check  # exit 1 if the overview is out of date (used by tests/test_testprotokoll.py)
"""
import re
import sys
from pathlib import Path

DOC = Path(__file__).resolve().parent.parent / "docs" / "TESTPROTOKOLL.md"
START = "<!-- AUTO-UEBERSICHT-START: wird von tools/testprotokoll.py erzeugt, nicht von Hand ändern -->"
END = "<!-- AUTO-UEBERSICHT-END -->"
SYMBOLS = ("✅", "❌", "❓", "➖")
HEADING = re.compile(r"^#{2,3} (\d+)\. (.+?)\s*$")


def cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def result_of(cell):
    hits = [(cell.find(s), s) for s in SYMBOLS if s in cell]
    return min(hits)[1] if hits else "❓"


def collect(text):
    """[(title, {symbol: count}, [open numbers], [failing numbers])] in document order."""
    sections, cur, col = [], None, None
    for line in text.splitlines():
        m = HEADING.match(line)
        if m:
            cur = {"title": f"{m.group(1)}. {m.group(2)}", "n": dict.fromkeys(SYMBOLS, 0), "open": [], "bad": []}
            sections.append(cur)
            col = None
            continue
        if line.startswith("#"):
            cur, col = None, None
            continue
        if cur is None or not line.startswith("|"):
            col = None if not line.startswith("|") else col
            continue
        row = cells(line)
        if row and row[0] == "Nr.":
            col = row.index("Ergebnis") if "Ergebnis" in row else None
            continue
        if col is None or set(line.replace("|", "").strip()) <= set("-: "):
            continue
        sym = result_of(row[col] if col < len(row) else "")
        cur["n"][sym] += 1
        if sym == "❓":
            cur["open"].append(row[0])
        elif sym == "❌":
            cur["bad"].append(row[0])
    return [s for s in sections if sum(s["n"].values())]


def ranges(numbers):
    """["24.1", "24.2", "24.3", "24.5"] -> ["24.1 bis 24.3", "24.5"] (three or more plain consecutive numbers are joined)."""
    out, run = [], []
    def flush():
        if run:
            out.extend(run if len(run) < 3 else [f"{run[0]} bis {run[-1]}"])
            run.clear()
    for n in numbers:
        m = re.fullmatch(r"(\d+)\.(\d+)", n)
        prev = re.fullmatch(r"(\d+)\.(\d+)", run[-1]) if run else None
        if m and prev and m.group(1) == prev.group(1) and int(m.group(2)) == int(prev.group(2)) + 1:
            run.append(n)
            continue
        flush()
        if m:
            run.append(n)
        else:
            out.append(n)
    flush()
    return out


def overview(sections):
    out = ["| Abschnitt | ✅ geht | ❌ geht nicht | ❓ offen | ➖ nur Add-on | noch offen (❌ zuerst) |",
           "|---|---:|---:|---:|---:|---|"]
    tot = dict.fromkeys(SYMBOLS, 0)
    for s in sections:
        for k in SYMBOLS:
            tot[k] += s["n"][k]
        todo = ", ".join([f"❌ {x}" for x in s["bad"]] + ranges(s["open"])) or "–"
        out.append(f"| {s['title']} | {s['n']['✅']} | {s['n']['❌']} | {s['n']['❓']} | {s['n']['➖']} | {todo} |")
    out.append(f"| **Zusammen** | **{tot['✅']}** | **{tot['❌']}** | **{tot['❓']}** | **{tot['➖']}** | |")
    return "\n".join(out)


def render(text):
    a, b = text.index(START) + len(START), text.index(END)
    return text[:a] + "\n" + overview(collect(text)) + "\n" + text[b:]


def main():
    text = DOC.read_text(encoding="utf-8")
    new = render(text)
    if "--check" in sys.argv:
        if new != text:
            print("docs/TESTPROTOKOLL.md: Übersicht veraltet, bitte `python3 tools/testprotokoll.py` ausführen")
            return 1
        return 0
    if new != text:
        DOC.write_text(new, encoding="utf-8")
    print("Übersicht aktualisiert" if new != text else "Übersicht war schon aktuell")
    return 0


if __name__ == "__main__":
    sys.exit(main())
