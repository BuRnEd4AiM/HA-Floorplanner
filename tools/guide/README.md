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
4. **The page** (`page.html`): the search (`search.js`, see below), groups, the player with subtitles and chapters. It reads
   `guide.json`, which `make_guide.py --site` writes from the clips, `tags.py`, `features.py` and the recorded steps, and puts
   `search.js` into `index.html` (one file: it also works as the add-on's copy without internet).

## The search (search.js) and the search words (tags.py)

The owner, 2026-11-03: "dass man die besser findet, wenn man oben was sucht … wenn Leute ein anderes Wort verwenden als es ist, dass
dann trotzdem das richtige Video kommt". The search looks at the title, the description, the `keys` of the clip, its line in
`tags.py`, the names of its features and every step, in both languages, and also finds other forms (Lampen → Lampe, Tuer → Tür),
words with the same meaning (`SYN` in `tags.py`: Rollo → Rollladen), long words (Deckenleuchte, Fensterkontakt), small typing
mistakes (Heizng → Heizung, the page says "auch gesucht nach „Heizung“") and whole questions (the little words are left out, words
in the same order as in a clip count more). Clips with every word first; if none has every word, the ones with the most, and
"Passt vielleicht auch" below.

- **`tags.py`**: for every clip more words in German and in English: everyday words, what you would ask, brands, typing mistakes.
  `SYN`: groups of words with the same meaning (a word in one group only). Changing it needs no new videos: the workflow "Demo"
  puts it on the page.
- **`tests/test_guide_search.py`** runs more than 160 typical searches (other words, forms, typing mistakes, questions) with the real clips:
  each must find its clip among the first three. Someone did not find a video with their word? Add the word to the clip's line in
  `tags.py` (or to a group of `SYN`) and the search as a line in `QUERIES` there. `tests/guidesearch.test.mjs`: the rules of
  `search.js` alone.

## Every feature (features.py)

`features.py` lists every feature of the add-on with the clips that show it, or why it has none (shown on the page under
"Alle Funktionen von A bis Z"). `tests/test_make_guide.py` fails when a feature has neither, when a clip shows no feature, and when
a version from 4.52.0 on adds something (`### Added` in CHANGELOG.md) without a line `since="<version>"` here. So a new feature
cannot be forgotten in the guide.

## A changed feature

Every change, not only a new feature, is checked against the guide (`.claude/CLAUDE.md`, the owner's wish): find the clips that show
the changed part (`features.py`, and search the `clips_*.py` for its buttons, ids and words), and when a step, a subtitle, the
description or the search words no longer say the truth, change the clip in the same pull request and try it. The pull request says
what changed in the guide, or "Video guide: checked, nothing to change". Example: 4.53.0 put the codes and the recordings into the
backup, so the clip `backup` shows the two new boxes and says what the file holds.

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

And give it a line in `tags.py` (at least 12 more words in each language: other words people use for it, questions, brands).

`tests/test_make_guide.py` checks every clip has both languages, a group, search words, at least two steps and a picture;
`tests/test_guide_search.py` that it has a line in `tags.py`.
