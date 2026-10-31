"""The boot splash the proxy injects into the plan's pages: a dark page with a progress bar from the first painted pixel, so a
slow first load never shows the plan's unstyled markup (buttons without text, no house).

The splash ends when the plan is really on screen: app.js sets ``window.fp3dBooted`` once its modules are loaded and
``window.fp3dReady`` once layout, models and the first scene are built (``fp3dReadySupported`` tells the splash that the signal
exists, so only an older plan needs the idle fallback). Loading the models can take a while, so the splash only gives up when the
plan's network has gone quiet; a page that keeps fetching is capped by a hard limit from the first pixel, and the stylesheet hides
the splash after the same time even when a Content-Security-Policy blocks the inline script.

The styles go into <head>, the element and its script right after <body>: a <div> in <head> would make the parser close the head
early and move the plan's own meta, title and stylesheet into the body.

Pure: string building only, so tests/test_container_dashboard.py checks the snippets without a browser.
"""
import re

_HEAD = re.compile(r"(<head\b[^>]*>)", re.IGNORECASE)
_BODY = re.compile(r"(<body\b[^>]*>)", re.IGNORECASE)
_HTML = re.compile(r"(<html\b[^>]*>)", re.IGNORECASE)

_HEAD_SNIPPET = r"""<meta charset="utf-8"><style>#fp3d-splash{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;background:#10151d;color:#e6edf3;font:15px/1.5 system-ui,sans-serif;transition:opacity .4s ease;animation:fp3d-watch 0s linear __WATCH__s forwards}
#fp3d-splash.fp3d-out{opacity:0;pointer-events:none}
#fp3d-splash b{font-size:20px;font-weight:600}
#fp3d-splash .fp3d-bar{width:min(320px,70vw);height:6px;border-radius:999px;background:#232c3a;overflow:hidden}
#fp3d-splash .fp3d-fill{width:30%;height:100%;border-radius:999px;background:#4c8dff;animation:fp3d-slide 1.4s ease-in-out infinite}
@keyframes fp3d-slide{from{transform:translateX(-100%)}to{transform:translateX(350%)}}
#fp3d-splash .fp3d-row{display:flex;gap:12px;opacity:.6;font-size:13px}
@keyframes fp3d-watch{to{opacity:0;visibility:hidden;pointer-events:none}}
</style>"""

_BODY_SNIPPET = r"""<div id="fp3d-splash" role="status"><b>3D Floorplan</b><div class="fp3d-bar"><div class="fp3d-fill"></div></div><div class="fp3d-row"><span class="fp3d-hint"></span><span class="fp3d-num">0%</span></div></div><script>
(function () {
  if (window.__fp3dSplash) return; window.__fp3dSplash = 1;
  var root = document.getElementById("fp3d-splash"); if (!root) return;
  var BASE = "__BASE__";
  var fill = root.querySelector(".fp3d-fill"), num = root.querySelector(".fp3d-num"),
      hint = root.querySelector(".fp3d-hint"), lang = (navigator.language || "en").slice(0, 2).toLowerCase();
  fill.style.animation = "none";                                 // from here the real progress drives the bar
  var TEXT = {
    de: { load: "Wird geladen \u2026", build: "3D-Szene wird aufgebaut \u2026" },
    zh: { load: "\u6b63\u5728\u52a0\u8f7d \u2026", build: "\u6b63\u5728\u751f\u6210 3D \u573a\u666f \u2026" },
    en: { load: "Loading \u2026", build: "Building the 3D scene \u2026" }
  }[lang] || { load: "Loading \u2026", build: "Building the 3D scene \u2026" };
  hint.textContent = TEXT.load;
  var done = false, shown = 0, target = 0, files = 0, total = 0, t0 = Date.now(), bootedAt = 0, inflight = 0, lastNet = 0;
  function paint() { fill.style.width = shown + "%"; num.textContent = Math.round(shown) + "%"; }
  function finish() {
    if (done) return; done = true;
    clearInterval(timer); shown = 100; paint();
    setTimeout(function () {
      root.classList.add("fp3d-out");
      setTimeout(function () { root.remove(); }, 450);
    }, 180);
  }
  var _fetch = window.fetch;                                     // track the plan's own calls: while one is running the
  if (_fetch) window.fetch = function () {                       // plan is still building, so the splash keeps waiting
    inflight++; lastNet = Date.now();
    return _fetch.apply(this, arguments).then(
      function (r) { inflight--; lastNet = Date.now(); return r; },
      function (e) { inflight--; lastNet = Date.now(); throw e; });
  };
  var _send = window.XMLHttpRequest && XMLHttpRequest.prototype.send;
  if (_send) XMLHttpRequest.prototype.send = function () {       // models loaded over XHR count as loading too
    inflight++; lastNet = Date.now();
    this.addEventListener("loadend", function () { inflight--; lastNet = Date.now(); });
    return _send.apply(this, arguments);
  };
  var CRITICAL = ["vendor/three.module.min.js", "vendor/controls/OrbitControls.js", "vendor/loaders/GLTFLoader.js"];
  function track(link) {                                         // a module still on its way counts as loading, so the
    inflight++; lastNet = Date.now();                            // "nothing happened" fallback cannot close the splash over
    link.addEventListener("load", function () { inflight--; lastNet = Date.now(); });     // a slow module graph
    link.addEventListener("error", function () { inflight--; lastNet = Date.now(); });
  }
  function preload() {                                           // ~250 module files: fetched one import at a time they take
    try {                                                        // the depth of the import graph in round trips, so ask at once
      fetch(BASE + "api/version").then(function (r) { return r.json(); }).then(function (v) {
        var names = Object.keys((v && v.staticFiles) || {}), js = names.filter(function (n) { return /\.js$/i.test(n); });
        total = js.length + CRITICAL.length;
        var i, l;
        for (i = 0; i < CRITICAL.length; i++) {                  // the renderer and its loaders first: without them no house
          l = document.createElement("link");
          l.rel = "modulepreload"; l.href = BASE + CRITICAL[i]; l.fetchPriority = "high";
          track(l); document.head.appendChild(l);
        }
        for (i = 0; i < js.length; i++) {
          l = document.createElement("link");
          l.rel = "modulepreload"; l.href = BASE + js[i]; l.fetchPriority = "low";
          track(l); document.head.appendChild(l);
        }
      }).catch(function () {});
    } catch (e) { /* no modulepreload: the plan's imports still work, only one round trip at a time */ }
  }
  preload();
  var timer = setInterval(function () {
    if (document.getElementById("bootError")) return finish();   // bootguard says why it will not start
    if (window.fp3dReady) return finish();                       // layout, models and first scene: the plan is on screen
    if (Date.now() - t0 > __HARDCAP__) return finish();          // never hold the page hostage, whatever it keeps loading
    var idle = !inflight && Date.now() - (lastNet || t0) > (window.fp3dBooted ? 1500 : 4000);   // nothing in flight or done
    if (window.fp3dBooted) {
      if (!bootedAt) bootedAt = Date.now();
      else if (!window.fp3dReadySupported && Date.now() - bootedAt > 4000 && idle) return finish();   // an older plan
    } else if (Date.now() - t0 > 15000 && idle) return finish(); // it never even booted and nothing is loading
    if (Date.now() - (lastNet || t0) > __TIMEOUT__) return finish();   // a stalled plan or a hung request
    var byTime = Math.min(80, (Date.now() - t0) / 100);          // keeps moving even when files come from the cache
    var byFiles = total ? 88 * Math.min(1, files / (total + 8))  // the file list from api/version: real progress
                          : 90 * (1 - Math.exp(-files / 3));     // without it: every finished file nudges the bar along
    target = Math.max(target, byTime, byFiles, window.fp3dBooted ? 92 : 0);   // the last stretch belongs to the plan building
    shown = target >= shown ? target : shown + (target - shown) * 0.3;
    paint();
    hint.textContent = (window.fp3dBooted ? TEXT.build : TEXT.load) + " (" + Math.round((Date.now() - t0) / 1000) + "s)";
  }, 120);
  try {
    new PerformanceObserver(function (list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) if (entries[i].responseEnd > 0) { files++; lastNet = Date.now(); }
    }).observe({ type: "resource", buffered: true });
  } catch (e) { /* no resource timing: time alone keeps the bar honest */ }
})();
</script>"""


def inject(html: str, timeout_ms: int = 60000, hard_cap_ms: int = 150000, base: str = "/floorplan/") -> str:
    """the page with the splash: styles in <head> (before anything of the plan is painted), element and script after <body>"""
    if "fp3d-splash" in html:
        return html                      # already there; injecting twice would double the elements
    timeout = max(3000, int(timeout_ms))
    hard_cap = max(timeout, int(hard_cap_ms))
    head = _HEAD_SNIPPET.replace("__WATCH__", f"{hard_cap / 1000:.0f}")
    body = (_BODY_SNIPPET.replace("__TIMEOUT__", str(timeout))
            .replace("__HARDCAP__", str(hard_cap))
            .replace("__BASE__", str(base or "/")))
    match = _HEAD.search(html)
    if match:
        html = html[:match.end()] + head + html[match.end():]
    else:
        match = _HTML.search(html)
        html = (html[:match.end()] + head + html[match.end():]) if match else head + html
    match = _BODY.search(html)
    if match:
        return html[:match.end()] + body + html[match.end():]
    end = html.lower().rfind("</body>")
    return (html[:end] + body + html[end:]) if end >= 0 else html + body
