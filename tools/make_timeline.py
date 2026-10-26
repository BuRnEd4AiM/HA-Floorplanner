#!/usr/bin/env python3
"""Builds the timeline page (how the project grew, version by version) from CHANGELOG.md.

    python3 tools/make_timeline.py [output folder]      (default: _site)

Writes <output>/timeline.html and copies the pictures it shows next to it: docs/img/3d.jpg (the title picture), the photos of
docs/timeline/<version>/ (what a version looks like) and the example pictures of docs/ideen-<major>.<minor>/ (made before building,
shown at <major>.<minor>.0). The German texts come from docs/CHANGELOG.de.md (same versions, sections and bullets), the tokens
Claude used from docs/tokens/*.json. The workflow "Demo" runs it for GitHub Pages after every merge, so a new version, photo or
token count shows up on its own. Only the standard library."""
import datetime
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO_URL = "https://github.com/BuRnEd4AiM/HA-Floorplanner"
HERO = "docs/img/3d.jpg"
GERMAN = "docs/CHANGELOG.de.md"
PICTURE_TYPES = (".jpg", ".jpeg", ".png", ".gif", ".webp")
SECTION_DE = {"Neu": "Added", "Verbessert": "Changed", "Repariert": "Fixed", "Entfernt": "Removed", "Hinweis": "Notes"}

VERSION_RE = re.compile(r"^## \[(\d+)\.(\d+)\.(\d+)\] - (\d{4}-\d{2}-\d{2})\s*$")
SECTION_RE = re.compile(r"^### (\w+)")


def parse_changelog(text):
    """[{version, major, minor, patch, date, sections: [{name, items: [{md, subs: [md]}]}]}], newest first like the file."""
    versions, cur, sec = [], None, None
    for line in text.splitlines():
        m = VERSION_RE.match(line)
        if m:
            major, minor, patch, date = int(m[1]), int(m[2]), int(m[3]), m[4]
            cur = {"version": f"{major}.{minor}.{patch}", "major": major, "minor": minor, "patch": patch,
                   "date": date, "sections": []}
            versions.append(cur)
            sec = None
            continue
        if line.startswith("## "):            # [Unreleased] or anything else: not a version
            cur = sec = None
            continue
        if cur is None or not line.strip():
            continue
        m = SECTION_RE.match(line)
        if m:
            sec = {"name": SECTION_DE.get(m[1], m[1]), "items": []}     # the German file says "Neu" for "Added" …
            cur["sections"].append(sec)
            continue
        if sec is None:                        # text right under the version heading
            sec = {"name": "Notes", "items": []}
            cur["sections"].append(sec)
        stripped = line.lstrip()
        if line.startswith("- "):
            sec["items"].append({"md": line[2:].strip(), "subs": []})
        elif stripped.startswith("- ") and sec["items"]:
            sec["items"][-1]["subs"].append(stripped[2:].strip())
        elif sec["items"] and line.startswith(" "):  # a bullet that goes on in the next line
            last = sec["items"][-1]
            if last["subs"]:
                last["subs"][-1] += " " + stripped
            else:
                last["md"] += " " + stripped
        else:                                  # a paragraph between the bullets
            sec["items"].append({"md": stripped, "subs": []})
    return versions


def md_inline(text):
    """The bit of Markdown the changelog uses (code, bold, italic, links, #123) as HTML; everything else is escaped."""
    out = []
    for i, part in enumerate(re.split(r"`([^`]*)`", text)):
        if i % 2:
            out.append(f"<code>{html.escape(part)}</code>")
            continue
        links = []                             # [label](url) aside first, so "#13" in a label is not linked twice

        def keep(m):
            links.append(_link(m[2], m[1]))
            return f"\0{len(links) - 1}\0"
        s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", keep, html.escape(part, quote=False))
        s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"(?<![\w*])\*(?!\s)([^*]+?)\*(?![\w*])", r"<em>\1</em>", s)
        s = re.sub(r"(?<![\w&/])#(\d+)\b", lambda m: _link(f"{REPO_URL}/issues/{m[1]}", f"#{m[1]}"), s)
        out.append(re.sub(r"\0(\d+)\0", lambda m: links[int(m[1])], s))
    return "".join(out)


def _link(url, label):
    """url is escaped already (or built here); only a quote could still break out of the attribute."""
    if not re.match(r"https?://", url):        # a link into the repository (docs/IMPORT.md …)
        url = f"{REPO_URL}/blob/main/{url.lstrip('./')}"
    return f'<a href="{url.replace(chr(34), "%22")}">{label}</a>'


def plain(text):
    """The Markdown of one entry as plain text (for the headline and the search)."""
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    return re.sub(r"[*`]", "", text).strip()


def headline(md, limit=110):
    """The bold start of an entry ("**🏡 The plot** (#538) …" → "🏡 The plot"), else its first sentence, at most `limit` characters."""
    m = re.match(r"\*\*(.+?)\*\*", md)
    text = plain(m[1]) if m else plain(re.split(r"(?<=[.!?:])\s", md, maxsplit=1)[0])
    text = text.rstrip(":").strip()
    return text if len(text) <= limit else text[:limit - 1].rstrip() + "…"


def _natural(name):
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", name)]


def pictures(root):
    """{"4.26.0": [{"src": "photos/4.26.0/1-plot.jpg", "from": "docs/timeline/4.26.0/1-plot.jpg", "kind": "photo"}, …]}: the photos of
    docs/timeline/<version>/ first, then the example pictures of docs/ideen-<major>.<minor>/ at <major>.<minor>.0."""
    found = {}
    for kind, pattern, rx, site in (("photo", "timeline/*", r"(\d+)\.(\d+)\.(\d+)", "photos"), ("idea", "ideen-*", r"ideen-(\d+)\.(\d+)", "ideen")):
        for folder in sorted((root / "docs").glob(pattern)):
            m = re.fullmatch(rx, folder.name)
            if not m or not folder.is_dir():
                continue
            version = f"{m[1]}.{m[2]}.{m[3] if kind == 'photo' else 0}"
            key = version if kind == "photo" else f"{m[1]}.{m[2]}"
            for f in sorted((f for f in folder.iterdir() if f.suffix.lower() in PICTURE_TYPES), key=lambda f: _natural(f.name)):
                found.setdefault(version, []).append({"src": f"{site}/{key}/{f.name}", "from": f.relative_to(root).as_posix(), "kind": kind})
    return found


def _days(first, last):
    """every day from first to last (ISO dates), both included"""
    a, b = datetime.date.fromisoformat(first), datetime.date.fromisoformat(last)
    return [(a + datetime.timedelta(n)).isoformat() for n in range((b - a).days + 1)]


def tokens(root, versions_per_day):
    """The tokens Claude used, per day, from docs/tokens/*.json (written by tools/tokens.py at every commit). A session counts evenly on
    the days from its start to its last update. The estimate for the early sessions of another account (source "estimate") is spread
    over the days from its start to the first measured session, by how many versions came out on each day."""
    recs = []
    for f in sorted((root / "docs" / "tokens").glob("*.json")):
        try:
            r = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        n = sum(int(r.get(k) or 0) for k in ("input", "cache_write", "cache_read", "output"))
        if n > 0 and re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(r.get("start", ""))):
            recs.append((r, n))
    measured = [r["start"] for r, _ in recs if r.get("source") != "estimate"]
    days, estimated, until = {}, 0, None
    for r, n in recs:
        if r.get("source") == "estimate":
            end = max(r["start"], min(measured)) if measured else r["start"]
            span = _days(r["start"], end)
            weights = [versions_per_day.get(d, 0) for d in span]
            estimated += n
            until = max(until or end, end)
        else:
            updated = str(r.get("updated", ""))[:10]
            span = _days(r["start"], updated if re.fullmatch(r"\d{4}-\d{2}-\d{2}", updated) and updated > r["start"] else r["start"])
            weights = [1] * len(span)
        if not sum(weights):
            weights = [1] * len(span)
        for d, w in zip(span, weights):
            days[d] = days.get(d, 0) + n * w / sum(weights)
    return {"days": {d: round(v) for d, v in sorted(days.items())}, "total": sum(n for _, n in recs),
            "written": sum(int(r.get("output") or 0) for r, _ in recs), "estimated": estimated, "estimatedUntil": until}


def _shape(sections):
    return [(s["name"], [len(i["subs"]) for i in s["items"]]) for s in sections]


def _sections(sections, text):
    out = []
    for sec in sections:
        items = []
        for it in sec["items"]:
            items.append({"h": headline(it["md"]), "html": md_inline(it["md"]), "subs": [md_inline(s) for s in it["subs"]]})
            text += [plain(it["md"])] + [plain(s) for s in it["subs"]]
        out.append({"name": sec["name"], "items": items})
    return out


def page_data(versions, pics, german=None):
    """What the page needs, oldest version first. A version gets its German texts ("de") when docs/CHANGELOG.de.md has it with the
    same sections and bullets, else the page shows the English ones."""
    de = {v["version"]: v["sections"] for v in german or []}
    out = []
    for v in reversed(versions):
        text = [v["version"]]
        sections = _sections(v["sections"], text)
        g = de.get(v["version"])
        out.append({"v": v["version"], "major": v["major"], "big": v["patch"] == 0, "date": v["date"], "sections": sections,
                    "de": _sections(g, text) if g is not None and _shape(g) == _shape(v["sections"]) else None,
                    "pics": [{"src": p["src"], "kind": p["kind"]} for p in pics.get(v["version"], [])], "text": " ".join(text).lower()})
    return out


def build(root, out_dir):
    root, out_dir = Path(root), Path(out_dir)
    versions = parse_changelog((root / "CHANGELOG.md").read_text(encoding="utf-8"))
    german = parse_changelog((root / GERMAN).read_text(encoding="utf-8")) if (root / GERMAN).exists() else []
    pics = pictures(root)
    data = page_data(versions, pics, german)
    per_day = {}
    for v in versions:
        per_day[v["date"]] = per_day.get(v["date"], 0) + 1
    template = (root / "tools" / "timeline.html").read_text(encoding="utf-8")
    payload = json.dumps({"versions": data, "tokens": tokens(root, per_day), "repo": REPO_URL}, ensure_ascii=False, separators=(",", ":"))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "timeline.html").write_text(template.replace("__DATA__", payload.replace("<", "\\u003c")), encoding="utf-8")
    for p in [p for ps in pics.values() for p in ps]:
        target = out_dir / p["src"]
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / p["from"], target)
    if (root / HERO).exists():
        (out_dir / "img").mkdir(exist_ok=True)
        shutil.copyfile(root / HERO, out_dir / "img" / Path(HERO).name)
    return data


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "_site"
    data = build(ROOT, out)
    print(f"{out}/timeline.html: {len(data)} versions ({sum(1 for v in data if v['de'])} in German), {sum(len(v['pics']) for v in data)} pictures")
