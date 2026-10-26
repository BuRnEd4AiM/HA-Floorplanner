#!/usr/bin/env python3
"""Builds the timeline page (how the project grew, version by version) from CHANGELOG.md.

    python3 tools/make_timeline.py [output folder]      (default: _site)

Writes <output>/timeline.html and copies the pictures it shows next to it: docs/img/3d.jpg (the title picture) and the example
pictures of docs/ideen-<version>/ (shown at version <version>.0). The workflow "Demo" runs it for GitHub Pages after every merge,
so a new version in CHANGELOG.md (and a new docs/ideen-<version>/ folder) shows up on its own. Only the standard library."""
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO_URL = "https://github.com/BuRnEd4AiM/HA-Floorplanner"
HERO = "docs/img/3d.jpg"
PICTURE_TYPES = (".jpg", ".jpeg", ".png", ".gif", ".webp")

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
            sec = {"name": m[1], "items": []}
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


def pictures(root):
    """{"4.26.0": ["ideen/4.26/1-garten-3d.jpg", …]} from the folders docs/ideen-<major>.<minor>/."""
    found = {}
    for folder in sorted((root / "docs").glob("ideen-*")):
        m = re.fullmatch(r"ideen-(\d+)\.(\d+)", folder.name)
        if not m or not folder.is_dir():
            continue
        files = sorted((f for f in folder.iterdir() if f.suffix.lower() in PICTURE_TYPES),
                       key=lambda f: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", f.name)])
        if files:
            found[f"{m[1]}.{m[2]}.0"] = [f"ideen/{m[1]}.{m[2]}/{f.name}" for f in files]
    return found


def page_data(versions, pics):
    """What the page needs, oldest version first."""
    out = []
    for v in reversed(versions):
        sections, text = [], [v["version"]]
        for sec in v["sections"]:
            items = []
            for it in sec["items"]:
                items.append({"h": headline(it["md"]), "html": md_inline(it["md"]),
                              "subs": [md_inline(s) for s in it["subs"]]})
                text += [plain(it["md"])] + [plain(s) for s in it["subs"]]
            sections.append({"name": sec["name"], "items": items})
        out.append({"v": v["version"], "major": v["major"], "big": v["patch"] == 0, "date": v["date"],
                    "sections": sections, "pics": pics.get(v["version"], []), "text": " ".join(text).lower()})
    return out


def build(root, out_dir):
    root, out_dir = Path(root), Path(out_dir)
    versions = parse_changelog((root / "CHANGELOG.md").read_text(encoding="utf-8"))
    pics = pictures(root)
    data = page_data(versions, pics)
    template = (root / "tools" / "timeline.html").read_text(encoding="utf-8")
    payload = json.dumps({"versions": data, "repo": REPO_URL}, ensure_ascii=False, separators=(",", ":"))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "timeline.html").write_text(template.replace("__DATA__", payload.replace("<", "\\u003c")), encoding="utf-8")
    for rel in [p for ps in pics.values() for p in ps]:
        major_minor, name = rel.split("/")[1:]
        target = out_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / "docs" / f"ideen-{major_minor}" / name, target)
    if (root / HERO).exists():
        (out_dir / "img").mkdir(exist_ok=True)
        shutil.copyfile(root / HERO, out_dir / "img" / Path(HERO).name)
    return data


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "_site"
    data = build(ROOT, out)
    print(f"{out}/timeline.html: {len(data)} versions, {sum(len(v['pics']) for v in data)} pictures")
