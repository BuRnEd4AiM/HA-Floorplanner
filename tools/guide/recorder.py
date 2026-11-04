"""The engine of the video guide (tools/make_guide.py): plays one clip in the demo like a person does and films it.

How a clip becomes a video:
  1. A fresh browser opens the demo (demo/floorplan3d-demo.html, build it first) in the language of the video.
  2. The page runs slower than real time (SLOW, default 2): every clock of the page (Date, performance.now, timers,
     requestAnimationFrame, CSS animations) goes at 1/SLOW. The screen recording of Chromium (CDP screencast) then gets
     SLOW times more pictures per second of the video: a software-rendered 3D view gives about 12 a second, the video wants 30.
  3. The clip moves the mouse (in small steps, so the page sees hover and drag like from a hand) and logs every move and click.
  4. Afterwards every picture of the video (30 a second, Full HD) is put together from the recording: the screen at that
     moment, a smooth mouse pointer drawn on top (eased curves, it never jumps), a ring where it clicks, maybe a soft zoom
     to where something happens, and for phone clips a phone around the screen. ffmpeg (H.264) makes the MP4 from it.
  5. What the clip said at which second (the steps, German and English) goes into a JSON next to it: the page of the guide
     shows it as subtitles and as a list of chapters, and its search finds words of every step.
"""
import base64
import json
import math
import re
import shutil
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEMO = ROOT / "demo" / "floorplan3d-demo.html"
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--hide-scrollbars"]
TZ = "Europe/Berlin"
W, H = 1920, 1080                       # every video
FPS = 30
VIEW = {"width": 1440, "height": 810}   # the browser of a desktop clip, filmed at 4/3 = Full HD
DSF = W / VIEW["width"]
PHONE = {"width": 390, "height": 844}   # an iPhone held upright, filmed at 1.5 and shown in a phone
PHONE_DSF = 1.5
LOOK = {"belowLabels": False}           # no names of the floor below shining through the lawn (as the README pictures)

# The clocks of the page, slowed down on demand: window.__slow(k). Before the clip starts the page runs at normal speed
# (loading the demo stays quick), then the clip switches to SLOW. Isolated worlds (Playwright's own scripts) keep real time.
TIME_JS = """(() => {
  const pn = performance.now.bind(performance), RealDate = Date, rdn = RealDate.now.bind(RealDate);
  const st = setTimeout.bind(window), ct = clearTimeout.bind(window), raf = requestAnimationFrame.bind(window);
  let k = 1, br = pn(), bv = br, dr = rdn(), dv = dr, seq = 1e6;
  const now = () => bv + (pn() - br) / k, dnow = () => dv + (rdn() - dr) / k;
  // the timers keep their due time on the page's clock: when the speed changes (r.fast) every waiting timer is set anew
  const timers = new Map();
  function arm(id) {
    const T = timers.get(id);
    if (!T) return;
    T.native = st(() => {
      if (!timers.has(id)) return;
      if (T.every != null) { T.due = now() + T.every; arm(id); } else timers.delete(id);
      try { typeof T.f === 'function' ? T.f(...T.a) : (0, eval)(String(T.f)); } catch (e) { st(() => { throw e; }); }
    }, Math.max(0, (T.due - now()) * k));
  }
  function add(f, ms, a, every) { const id = ++seq; ms = Math.max(0, +ms || 0); timers.set(id, { f, a, due: now() + ms, every: every ? Math.max(ms, 4) : null }); arm(id); return id; }
  function clear(id) { const T = timers.get(id); if (T) { ct(T.native); timers.delete(id); } }
  window.setTimeout = (f, ms, ...a) => add(f, ms, a, false);
  window.setInterval = (f, ms, ...a) => add(f, ms, a, true);
  window.clearTimeout = clear;
  window.clearInterval = clear;
  window.__slow = (n) => { bv = now(); br = pn(); dv = dnow(); dr = rdn(); k = n; for (const id of timers.keys()) { ct(timers.get(id).native); arm(id); } };
  performance.now = now;
  function D(...a) { if (!new.target) return new RealDate(dnow()).toString(); return a.length ? new RealDate(...a) : new RealDate(dnow()); }
  D.prototype = RealDate.prototype; D.now = dnow; D.parse = RealDate.parse; D.UTC = RealDate.UTC;
  window.Date = D;
  window.requestAnimationFrame = (cb) => raf(() => cb(now()));
})();"""

# Before the demo replaces fetch (demo/demo-data.js) this catches the first GET of the settings: the language of the video
# and the look (as tools/make_screenshots.py does). Everything else goes to the demo as before.
HOOK = """(() => {
  const S = %s, A = %s, real = window.fetch;
  let inner = null, first = true;
  const json = (d) => new Response(JSON.stringify(d), { status: 200, headers: { 'Content-Type': 'application/json' } });
  async function hooked(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url, full = url.replace(/^.*?(api\\/)/, '$1'), path = full.split('?')[0];
    for (const [k, v] of Object.entries(A)) if (k.includes('?') ? full === k : k.endsWith('/') ? path.startsWith(k) : path === k) return json(v);
    const r = await (inner || real)(input, init);
    if (path === 'api/settings' && first && (init.method || 'GET').toUpperCase() === 'GET') { first = false; return json({ ...(await r.json()), ...S }); }
    return r;
  }
  Object.defineProperty(window, 'fetch', { configurable: true, get: () => (inner ? hooked : real), set: (v) => { inner = v; } });
})();"""


def ease(u):
    """slow start, slow end (a hand moving a mouse)"""
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def curve(x0, y0, x1, y1, u):
    """a point on the slightly bent way from (x0, y0) to (x1, y1): a straight line looks like a robot"""
    e = ease(u)
    dx, dy = x1 - x0, y1 - y0
    bend = 0.12 * math.hypot(dx, dy)
    n = math.hypot(dx, dy) or 1
    cx, cy = (x0 + x1) / 2 - dy / n * bend, (y0 + y1) / 2 + dx / n * bend
    a, b, c = (1 - e) ** 2, 2 * (1 - e) * e, e * e
    return a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1


class Clip:
    """one video: its id, where it is listed, its titles; fn(rec) plays it"""
    def __init__(self, cid, cat, title, desc, keys, fn, device="desktop", query="mode=live", settings=None, sky="13:00", order=0, answers=None, prep=None):
        self.id, self.cat, self.title, self.desc, self.keys, self.fn = cid, cat, title, desc, keys, fn
        self.device, self.query, self.settings, self.sky, self.order = device, query, settings or {}, sky, order
        self.answers = answers          # {api path: JSON} the demo does not have (a path ending in / means every path below it,
        #                                 one with ?… only that address, e.g. api/layout?house=x)
        self.prep = prep                # prep(r): gets the page ready before the recording starts (not in the video)

    def meta(self):
        return {"id": self.id, "cat": self.cat, "title": self.title, "desc": self.desc, "keys": self.keys, "device": self.device}


CLIPS = {}


def clip(cid, cat, title, desc, keys="", **kw):
    """@clip("lights", "live", {"de": …, "en": …}, {"de": …, "en": …}, "Lampe Licht lamp light") over def _(r): …"""
    def put(fn):
        assert cid not in CLIPS, f"two clips are called {cid}"
        CLIPS[cid] = Clip(cid, cat, title, desc, keys, fn, order=len(CLIPS), **kw)
        return fn
    return put


class Rec:
    """the browser of one clip and everything it logs for the video"""

    def __init__(self, browser, clip_, lang, slow, frames_dir):
        self.b, self.clip, self.lang, self.slow, self.dir = browser, clip_, lang, slow, Path(frames_dir)
        self.phone = clip_.device == "phone"
        self.view = PHONE if self.phone else VIEW
        self.dsf = PHONE_DSF if self.phone else DSF
        self.frames, self.moves, self.clicks, self.zooms, self.steps, self.hidden, self.ff = [], [], [], [], [], [], []
        self.pos = (self.view["width"] * 0.62, self.view["height"] * 0.58)   # where the pointer waits before the first move
        self.t0 = None
        self.poster_t = None
        self.cursor_on = True

    # ---------- the browser ----------

    def open(self):
        c = self.clip
        self.ctx = self.b.new_context(viewport=self.view, device_scale_factor=self.dsf, is_mobile=self.phone, has_touch=self.phone,
                                      locale="de-DE" if self.lang == "de" else "en-US", timezone_id=TZ)
        self.ctx.add_init_script(TIME_JS)
        answers = c.answers() if callable(c.answers) else (c.answers or {})
        self.ctx.add_init_script(HOOK % (json.dumps({**LOOK, "language": self.lang, **c.settings}), json.dumps(answers)))
        self.pg = pg = self.ctx.new_page()
        self.prompt = None              # the answer to the page's next prompt() (None: its suggestion)
        pg.on("dialog", lambda d: d.accept(self.prompt if self.prompt is not None and d.type == "prompt" else d.default_value) if d.type != "alert" else d.dismiss())
        pg.goto(f"{DEMO.as_uri()}?{c.query}&skytime={c.sky}&debug=1", wait_until="domcontentloaded", timeout=180000)
        pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=180000)
        # no demo badge, no real pointer (the video draws its own); Inter where the app says system-ui: the same letters on every
        # machine that records (Windows and Macs show their own system font, close to it)
        pg.add_style_tag(content='.demo-badge{display:none!important}*{cursor:none!important}'
                                 'body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}')
        pg.wait_for_timeout(2500)
        return pg

    def start(self):
        """the recording begins: the page goes slow, the screencast starts"""
        self.cdp = self.ctx.new_cdp_session(self.pg)
        self.cdp.send("Animation.enable")
        self.cdp.send("Animation.setPlaybackRate", {"playbackRate": 1 / self.slow})
        self.pg.evaluate(f"window.__slow({self.slow})")
        self.cdp.on("Page.screencastFrame", self._frame)
        self.t0 = time.time()
        vw, vh = self.view["width"] * self.dsf, self.view["height"] * self.dsf
        self.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "maxWidth": round(vw), "maxHeight": round(vh), "everyNthFrame": 1})
        self.wait(400)

    def _frame(self, f):
        t = (f["metadata"]["timestamp"] - self.t0) / self.slow
        p = self.dir / f"{len(self.frames):05d}.jpg"
        p.write_bytes(base64.b64decode(f["data"]))
        self.frames.append((max(0.0, t), p))
        try:
            self.cdp.send("Page.screencastFrameAck", {"sessionId": f["sessionId"]})
        except Exception:
            pass

    def stop(self):
        self.wait(900)                  # the last picture stays a moment
        self.end = self.now()
        try:
            self.cdp.send("Page.stopScreencast")
        except Exception:
            pass
        self.ctx.close()

    def now(self):
        """seconds of the video since the start"""
        return (time.time() - self.t0) / self.slow if self.t0 else 0.0

    def wait(self, ms):
        """wait ms of the video (the page is SLOW times slower, so the real wait is longer)"""
        self.pg.wait_for_timeout(ms * self.slow)

    def js(self, expr, arg=None):
        return self.pg.evaluate(expr, arg) if arg is not None else self.pg.evaluate(expr)

    # ---------- what the clip says ----------

    def say(self, de, en):
        """a step of the clip: shown as a subtitle from now on, a chapter in the list beside the video"""
        self.steps.append({"t": round(self.now(), 2), "de": de, "en": en})

    def poster(self):
        """this moment is the picture of the clip in the list (otherwise one at 60 % of the video)"""
        self.poster_t = self.now() + 0.3

    # ---------- where things are ----------

    def loc(self, sel, nth=0, text=None):
        """a thing of the page: a selector (maybe only the ones with this text, a regular expression) or a Playwright locator"""
        if not isinstance(sel, str):
            return sel
        loc = self.pg.locator(sel)
        if text:
            loc = loc.filter(has_text=re.compile(text))
        return loc.nth(nth)

    def at(self, sel, dx=0.5, dy=0.5, nth=0, text=None):
        """the point in a thing of the page (CSS px), scrolled into view"""
        loc = self.loc(sel, nth, text)
        for i in range(4):              # a card that draws itself anew right then: try again
            try:
                loc.scroll_into_view_if_needed(timeout=10000)
                bb = loc.bounding_box(timeout=10000)
                if bb or i == 3:
                    break
                self.pg.wait_for_timeout(300)
            except Exception:
                if i == 3:
                    raise
                self.pg.wait_for_timeout(300)
        if not bb:
            raise RuntimeError(f"{sel} is not on the screen")
        return bb["x"] + bb["width"] * dx, bb["y"] + bb["height"] * dy

    def box(self, sel, nth=0, text=None):
        loc = self.loc(sel, nth, text)
        loc.scroll_into_view_if_needed(timeout=10000)
        return loc.bounding_box(timeout=10000)

    def ball(self, dev):
        """the screen point of a device's ball in the 3D view (live mode)"""
        p = self.js(f"window.__fp.ballScreen({json.dumps(dev)})")
        if not p:
            raise RuntimeError(f"no ball for {dev}")
        return p["x"], p["y"]

    # ---------- the hand ----------

    def move(self, x, y=None, ms=None, button=None, text=None, nth=0):
        """glide the pointer to (x, y) or to a thing of the page: the page gets every step (hover, dragging), the video a smooth curve"""
        if y is None:
            x, y = self.at(x, text=text, nth=nth)
        x0, y0 = self.pos
        dist = math.hypot(x - x0, y - y0)
        if ms is None:
            ms = min(1100, 380 + dist * 0.9)
        t_a = self.now()
        t_start = time.time()
        span = ms / 1000 * self.slow
        # by the clock, not by a number of steps: one step of the mouse can take 100 ms while a software 3D view draws
        while True:
            u = min(1.0, (time.time() - t_start) / span)
            px, py = curve(x0, y0, x, y, u)
            if not self.phone or button:
                self.pg.mouse.move(px, py)
            if u >= 1:
                break
            self.pg.wait_for_timeout(max(1, min(33 * self.slow, (span - (time.time() - t_start)) * 1000)))
        self.moves.append({"t0": t_a, "t1": self.now(), "x0": x0, "y0": y0, "x1": x, "y1": y})
        self.pos = (x, y)

    def click(self, x, y=None, ms=None, hold=110, button="left", double=False, text=None, nth=0):
        """move there and click (a ring shows the click); x can be a selector (text: only the one with this text) or a locator"""
        if y is None:
            x, y = self.at(x, text=text, nth=nth)
        self.move(x, y, ms)
        self.wait(120)
        for k in range(2 if double else 1):
            t = self.now()
            if self.phone:
                self.pg.touchscreen.tap(x, y)
            else:
                self.pg.mouse.down(button=button)
                self.wait(hold)
                self.pg.mouse.up(button=button)
            self.clicks.append({"t": t, "t1": self.now(), "x": x, "y": y, "right": button == "right"})
            if double:
                self.wait(60)
        self.wait(250)

    def drag(self, x0, y0, x1, y1, ms=900, button="left"):
        """press at one point, move to another, let go (walls, sliders, turning the 3D view)"""
        self.move(x0, y0)
        self.wait(100)
        self.pg.mouse.down(button=button)
        t = self.now()
        self.clicks.append({"t": t, "t1": t + 0.12, "x": x0, "y": y0, "right": button == "right", "drag": True})
        self.wait(120)
        self.move(x1, y1, ms, button=button)
        self.wait(80)
        self.pg.mouse.up(button=button)
        self.wait(250)

    def slide(self, sel, to, nth=0):
        """drag the knob of a slider (input type=range) to a share of its way (0 … 1)"""
        loc = self.loc(sel, nth)
        loc.scroll_into_view_if_needed(timeout=10000)
        bb = loc.bounding_box()
        lo, hi, v = loc.evaluate("(e) => [+e.min || 0, +e.max || 100, +e.value]")
        u = (v - lo) / ((hi - lo) or 1)
        pad = 8
        x0 = bb["x"] + pad + (bb["width"] - 2 * pad) * u
        x1 = bb["x"] + pad + (bb["width"] - 2 * pad) * to
        y = bb["y"] + bb["height"] / 2
        self.drag(x0, y, x1, y, ms=900)

    def wheel(self, dy, steps=8, ms=700):
        """turn the mouse wheel where the pointer is (zoom the 3D view)"""
        for _ in range(steps):
            self.pg.mouse.wheel(0, dy / steps)
            self.wait(ms / steps)

    def type(self, text, ms=70):
        """type like a person (one key after the other)"""
        for ch in text:
            self.pg.keyboard.type(ch)
            self.wait(ms)

    def key(self, k):
        self.pg.keyboard.press(k)
        self.wait(200)

    def hide(self):
        """no pointer from now on (the camera moves on its own)"""
        if self.cursor_on:
            self.hidden.append([self.now(), None])
            self.cursor_on = False

    def show(self):
        if not self.cursor_on:
            self.hidden[-1][1] = self.now()
            self.cursor_on = True

    # ---------- time ----------

    def _speed(self, k):
        self.cdp.send("Animation.setPlaybackRate", {"playbackRate": 1 / k})
        self.pg.evaluate(f"window.__slow({k})")

    def fast(self, times=8):
        """fast forward: the page runs `times` as fast, the video shows ⏩ (waiting for a countdown, a routine ...)"""
        self._speed(self.slow / times)
        self.ff.append([self.now(), None, times])

    def normal(self):
        """back to normal speed after fast()"""
        if self.ff and self.ff[-1][1] is None:
            self._speed(self.slow)
            self.ff[-1][1] = self.now()

    # ---------- the camera of the video ----------

    def zoom(self, target=None, scale=1.6, ms=900):
        """move the video softly closer to a thing of the page (selector, (x, y) or None = the whole screen again)"""
        if target is None:
            cx, cy, s = self.view["width"] / 2, self.view["height"] / 2, 1.0
        elif isinstance(target, str):
            bb = self.box(target)
            cx, cy, s = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2, scale
        else:
            cx, cy, s = target[0], target[1], scale
        t = self.now()
        self.zooms.append({"t0": t, "t1": t + ms / 1000, "cx": cx, "cy": cy, "s": s})
        return self

    # ---------- the result ----------

    def result(self):
        return {"frames": self.frames, "moves": self.moves, "clicks": self.clicks, "zooms": self.zooms, "steps": self.steps,
                "hidden": [(a, b if b is not None else 1e9) for a, b in self.hidden], "end": self.end, "poster": self.poster_t, "ff": [(a, b if b is not None else 1e9, n) for a, b, n in self.ff],
                "phone": self.phone, "view": self.view, "dsf": self.dsf, "start": self.pos_start}


def record(browser, clip_, lang, slow, workdir):
    """play one clip, return what the video is made of"""
    fdir = Path(workdir) / "frames"
    if fdir.exists():
        shutil.rmtree(fdir)
    fdir.mkdir(parents=True)
    r = Rec(browser, clip_, lang, slow, fdir)
    r.open()
    if clip_.prep:
        clip_.prep(r)
        r.pg.wait_for_timeout(800)
        r.moves, r.clicks, r.steps = [], [], []
    r.pos_start = r.pos
    r.start()
    try:
        clip_.fn(r)
    finally:
        r.stop()
    return r.result()
