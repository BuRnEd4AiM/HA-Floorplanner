/* Boot guard: a classic script that runs before app.js. After an update the browser may load some old files from its cache together
 * with new ones; app.js then cannot start at all (e.g. "does not provide an export named …") and the page stays empty: buttons without
 * text, no house (#328). app.js sets window.fp3dBooted as soon as all its modules are loaded. An error before that fetches every
 * interface file past the cache once and reloads; if the page still does not start, a message says what to do instead of an empty page. */
(function (w) {
  var KEY = 'fp3d.bootguard', RETRY_MS = 60000, busy = false;
  var TEXT = {
    de: { title: '3D Floorplan konnte nicht starten', text: 'Wahrscheinlich hat der Browser nach einem Update noch alte Dateien gespeichert. Bitte neu laden; am PC mit Strg+F5, in der Home-Assistant-App den Frontend-Cache zurücksetzen (Einstellungen → Companion App).', reload: 'Neu laden' },
    en: { title: '3D Floorplan could not start', text: 'The browser probably still keeps old files from before an update. Please reload; on a PC with Ctrl+F5, in the Home Assistant app reset the frontend cache (Settings → Companion app).', reload: 'Reload' },
  };
  function lang() { return /^de/i.test((w.navigator && w.navigator.language) || '') ? 'de' : 'en'; }
  function store(get, val) {
    try { return get ? w.sessionStorage.getItem(KEY) : (w.sessionStorage.setItem(KEY, val), true); } catch (e) { return get ? null : false; }
  }
  function show(detail) {
    var d = w.document, tx = TEXT[lang()], box = d.createElement('div'), h = d.createElement('b'), p = d.createElement('p'),
      c = d.createElement('code'), b = d.createElement('button');
    box.id = 'bootError';
    box.style.cssText = 'position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:9999;max-width:min(520px,calc(100vw - 32px));'
      + 'padding:18px 20px;border-radius:14px;background:#1b2330;color:#e6edf3;border:1px solid #f85149;font:14px/1.45 system-ui,sans-serif';
    h.textContent = tx.title; p.textContent = tx.text; c.textContent = String(detail || ''); c.style.cssText = 'display:block;opacity:.7;font-size:12px;margin-bottom:12px;word-break:break-word';
    b.textContent = tx.reload; b.type = 'button'; b.onclick = function () { w.location.reload(); };
    box.append(h, p, c, b);
    d.body.append(box);
  }
  /** fetch every interface file past the cache (the list comes from the add-on), then reload */
  function refresh() {
    var base = ['index.html', 'app.js', 'bootguard.js', 'style.css'];
    return w.fetch('api/version', { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (v) { return Object.keys((v && v.staticFiles) || {}); }, function () { return []; })
      .then(function (files) {
        var all = base.concat(files.filter(function (f) { return base.indexOf(f) < 0; }));
        return Promise.all(all.map(function (f) { return w.fetch(f, { cache: 'reload' }).catch(function () {}); }));
      })
      .then(function () { w.location.reload(); });
  }
  function failed(detail) {
    if (w.fp3dBooted || busy) return;
    busy = true;
    var last = +store(true) || 0;
    if (Date.now() - last < RETRY_MS || !store(false, String(Date.now()))) { show(detail); return; }   // tried a moment ago (or no storage): no reload loop
    refresh();
  }
  w.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'SCRIPT') failed('cannot load ' + (el.getAttribute('src') || 'script'));   // a module that could not be fetched
    else if (e.message) failed(e.message);                                                          // a module that does not fit (old file)
  }, true);
})(window);
