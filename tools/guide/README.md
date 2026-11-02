# Video guide (tools/make_guide.py)

Every feature as a short video, recorded automatically in the demo. The page: https://burned4aim.github.io/HA-Floorplanner/guide/

## How it works

1. **The workflow "Video guide"** (`.github/workflows/guide.yml`) runs when the app, the demo or a clip changes on `main` (and by
   hand: Actions → Video guide → Run workflow, maybe only some clip ids). It builds the demo and records every clip twice (German and
   English interface) in 8 jobs at once, pushes the videos to the branch `guide-videos` (one commit, replaced every time; a clip
   that fails keeps its last video) and starts the workflow "Demo", which puts them on GitHub Pages under `guide/`.
2. **Recording** (`recorder.py`): a fresh browser per clip opens the demo, the page's clocks run slower (`--slow 2`: more pictures
   per second of video from a software-drawn 3D view), the clip moves the mouse in small steps and logs every move and click.
3. **The video** (`compose.py`): every picture (Full HD, 30 a second) is put together from the screen recording, a smooth pointer
   on an eased curve, a ring at each click, ⏩ while `r.fast()` runs, the phone around a phone clip; ffmpeg makes H.264. Also a
   picture for the list, a small fast preview and a 960 × 540 copy for the add-on (📥 *Für ohne Internet speichern*, `guide.py`).
4. **The page** (`page.html`): search over titles, descriptions, search words and every step, groups, the player with subtitles
   and chapters. It reads `guide.json`, which `make_guide.py --site` writes from the clips and the recorded steps.

## Every feature (features.py)

`features.py` lists every feature of the add-on with the clips that show it, or why it has none (shown on the page under
"Alle Funktionen von A bis Z"). `tests/test_make_guide.py` fails when a feature has neither, when a clip shows no feature, and when
a version from 4.52.0 on adds something (`### Added` in CHANGELOG.md) without a line `since="<version>"` here. So a new feature
cannot be forgotten in the guide.

## A new clip

Every new feature gets a clip (`.claude/CLAUDE.md`). Put it in the `clips_<group>.py` that fits:

```python
@clip("my-feature", "live",                                  # id (a-z 0-9 -), group (CATS in make_guide.py)
      {"de": "Titel", "en": "Title"},
      {"de": "Ein, zwei Sätze, was man sieht.", "en": "One or two sentences."},
      "Suchwörter deutsch english words",                     # what people type into the search
      sky="18:40", query="mode=live", device="desktop")       # time of the sky, start mode, or device="phone"
def _(r):
    r.say("Tippe auf …", "Tap …")                             # a step: subtitle and chapter, in the language of the video
    r.click("#someButton")                                    # selector, (x, y), text="Regex|Regex" or a Playwright locator
    r.wait(1200)                                              # milliseconds of the video
    r.poster()                                                # this moment is the clip's picture in the list
```

More: `r.move`, `r.drag(x0, y0, x1, y1, button="right")`, `r.slide(selector, 0.7)` (a slider), `r.type("text")`, `r.key("Escape")`,
`r.wheel(-600)`, `r.ball("d4")` (the screen point of a device's ball), `r.fast(10)` … `r.normal()` (fast forward), `r.hide()` / `r.show()`
(the pointer), `r.zoom(selector, 1.5)` / `r.zoom()` (move the video closer), `r.js("…")`. `prep=` gets the page ready before the
recording (not in the video, e.g. an empty house: `clips_edit.py`), `answers=` gives the demo API answers it does not have.

Try it (needs the demo, Playwright with Chromium, Pillow and ffmpeg):

```bash
cd demo && npm ci && node build.mjs && cd ..
python3 tools/make_guide.py --slow 1 my-feature          # quick, into /tmp/guide-videos/de/
python3 tools/make_guide.py --lang en my-feature         # the English one, as the workflow records it
python3 tools/make_guide.py --site /tmp/site --videos /tmp/guide-videos && (cd /tmp/site && python3 -m http.server)
```

`tests/test_make_guide.py` checks every clip has both languages, a group, search words, at least two steps and a picture.
