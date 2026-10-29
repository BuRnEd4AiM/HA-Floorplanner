"""Add UI texts to all 8 languages at once.

    python3 tools/add_i18n.py texts.json

texts.json maps each new key to its text in every language: {"tile.on": {"de": "{n} an", "en": "{n} on", "fr": ..., "es": ..., "it": ..., "nl": ..., "pl": ..., "zh": ...}} (zh: Simplified Chinese since 4.46.0).
German and English go at the end of their tables in static/i18n.js, the others at the end of static/lang/<code>.js. A key that exists
already is refused. tests/test_i18n.py checks afterwards that every language has the same keys and placeholders.
"""
import json, sys
from pathlib import Path
ST = Path(__file__).resolve().parent.parent / "floorplan3d" / "rootfs" / "app" / "static"
data = json.loads(Path(sys.argv[1]).read_text())
LANGS = ["de", "en", "fr", "es", "it", "nl", "pl", "zh"]
for k, v in data.items():
    assert set(v) == set(LANGS), (k, set(LANGS) ^ set(v))
q = lambda s: "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"
def line(lang, indent):
    items = [f"{q(k)}: {q(v[lang])}" for k, v in data.items()]
    out, cur = [], indent
    for it in items:
        if len(cur) + len(it) > 160 and cur.strip():
            out.append(cur.rstrip()); cur = indent
        cur += it + ", "
    out.append(cur.rstrip())
    return "\n".join(out) + "\n"
i18n = ST / "i18n.js"; t = i18n.read_text()
for k in data:
    assert f"'{k}':" not in t, f"exists: {k}"
de_end = t.index("\n  },\n  en: {") + 1
t = t[:de_end] + line("de", "    ") + t[de_end:]
en_end = t.index("\n  },\n};") + 1
t = t[:en_end] + line("en", "    ") + t[en_end:]
i18n.write_text(t)
for l in LANGS[2:]:
    f = ST / "lang" / f"{l}.js"; s = f.read_text()
    end = s.rindex("\n};") + 1
    s = s[:end] + line(l, "  ") + s[end:]
    f.write_text(s)
print("added", len(data), "keys")
