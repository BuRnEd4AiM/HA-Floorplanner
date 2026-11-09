/* Live picture of the camera card (#381, #383): Home Assistant's own HLS stream of the camera, the one its live view plays. The add-on asks
 * Home Assistant for it (api/camera/<entity>/hls, websocket camera/stream) and passes its playlists and segments through (api/hls/...).
 * Each of them is a complete answer, and only such answers come through the Supervisor between the add-on and Home Assistant (an endless
 * MJPEG stream never did, #383). hls.js plays it (vendor, loaded only when a camera card opens); a browser without it that plays HLS
 * itself (Safari) gets the playlist directly. A camera without a stream, or a stream that never plays: still images as before.
 * liveNext, playWay and HLS_CONFIG are pure (unit tests in tests/camlive.test.mjs); initCamLive draws. */

export const LIVE_TRIES = 3;                 // tries in a row that never played, then still images
export const LIVE_PAUSE = 5 * 60 * 1000;     // ... for 5 minutes, then the live picture is tried again
export const START_TIMEOUT = 30000;          // a try that has not played after 30 s has failed
/** hls.js settings like Home Assistant's own player (long timeouts: the camera may need a while), low latency, little buffer behind */
export const HLS_CONFIG = Object.freeze({
  enableWorker: false, lowLatencyMode: true, backBufferLength: 10, maxLiveSyncPlaybackRate: 2,
  fragLoadingTimeOut: 30000, manifestLoadingTimeOut: 30000, levelLoadingTimeOut: 30000,
});

/** what to do when a try has ended by itself: { still: true } (still images for now) or { wait } ms until the next try.
 *  status: the add-on's answer when the stream was asked for (0: none, or it came), played: the video had played,
 *  fails: tries before this one that never played */
export function liveNext({ status = 0, played = false, fails = 0 }) {
  if (status === 403 || status === 404) return { still: true, fails };      // switched off or locked; the camera has no stream
  if (played) return { wait: 1000, fails: 0 };                              // it ran and broke off: straight on
  return fails + 1 >= LIVE_TRIES ? { still: true, fails: fails + 1 } : { wait: 2000 * (fails + 1), fails: fails + 1 };
}

/** how the stream is played: 'hls' (hls.js, wherever it works), 'native' (the browser plays HLS itself) or null (it cannot be played) */
export const playWay = ({ hlsJs, native }) => (hlsJs ? 'hls' : native ? 'native' : null);

let hlsLib = null;
const loadHls = () => (hlsLib ||= import('./vendor/hls.light.module.min.js').then((m) => m.default, () => null));

/** ctx: t, camImage(entity, cls) (a still image, renewed every few seconds), openInHa(entity) */
export function initCamLive(ctx) {
  const { t } = ctx;
  const lives = new Map();          // entity -> { id, cls, box, video, badge, hls, tok, running, played, fails, retry, guard }
  const noLive = new Map();         // entity -> when its live picture gave up (still images until LIVE_PAUSE has passed)
  let timer = 0;

  function look(box, state) {
    if (box.dataset.state === state) return;
    box.dataset.state = state;
    box.querySelector('.camLiveBadge').textContent = t(`cam.${state}`);
  }
  function stillBox(id, cls) {
    const box = document.createElement('div'); box.className = 'camLive';
    const badge = document.createElement('span'); badge.className = 'camLiveBadge';
    box.append(ctx.camImage(id, cls), badge);
    look(box, 'still');
    return box;
  }
  /** the camera live: a video in a box with a small badge (connecting / live / still image); a tap opens Home Assistant's live view.
   *  The same box for the same camera, so a card drawn anew keeps its running video. It plays while it is on the screen and the page
   *  is visible. */
  function camLive(id, cls = 'pop-cam') {
    if (Date.now() - (noLive.get(id) ?? -Infinity) < LIVE_PAUSE) return stillBox(id, cls);
    noLive.delete(id);
    let s = lives.get(id);
    if (!s) {
      s = { id, cls, hls: null, tok: 0, running: false, played: false, fails: 0, retry: 0, guard: 0 };
      s.box = document.createElement('div'); s.box.className = 'camLive';
      const v = s.video = document.createElement('video');
      v.className = `${cls} tap`; v.dataset.live = id; v.title = t('cam.openHa');
      v.muted = true; v.autoplay = true; v.playsInline = true; v.disableRemotePlayback = true;    // the last one: hls.js on iPhones (ManagedMediaSource)
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.addEventListener('click', () => ctx.openInHa(id));
      v.addEventListener('playing', () => { if (!s.running) return; s.played = true; s.fails = 0; clearTimeout(s.guard); look(s.box, 'live'); });
      v.addEventListener('error', () => { if (s.running && !s.hls) failed(s, s.tok, 0); });       // the browser's own HLS
      v.addEventListener('ended', () => { if (s.running) failed(s, s.tok, 0); });
      s.badge = document.createElement('span'); s.badge.className = 'camLiveBadge';
      s.box.append(v, s.badge);
      look(s.box, 'wait');
      lives.set(id, s);
    }
    if (!timer) timer = setInterval(watch, 1000);
    setTimeout(watch);                                  // once the card is drawn
    return s.box;
  }
  /** starts and stops: only cameras whose box is on the screen (not in a closed card), nothing while the page is hidden */
  function watch() {
    lives.forEach((s, id) => {
      if (!s.box.isConnected) { stop(s); lives.delete(id); return; }
      const wanted = !document.hidden && s.box.getClientRects().length > 0;
      if (!wanted) { if (s.running || s.retry) stop(s); } else if (!s.running && !s.retry) start(s);
    });
    if (!lives.size) { clearInterval(timer); timer = 0; }
  }
  async function start(s) {
    const tok = ++s.tok;
    s.running = true; s.played = false;
    look(s.box, 'wait');
    clearTimeout(s.guard);
    s.guard = setTimeout(() => { if (!s.played) failed(s, tok, 0); }, START_TIMEOUT);
    let status = 0;
    try {
      const r = await fetch(`api/camera/${encodeURIComponent(s.id)}/hls`, { cache: 'no-store' });
      if (!r.ok) { status = r.status; throw new Error(String(r.status)); }
      const { url } = await r.json();
      const Hls = await loadHls();
      if (s.tok !== tok) return;                        // stopped meanwhile
      const way = playWay({ hlsJs: !!Hls?.isSupported?.(), native: !!s.video.canPlayType('application/vnd.apple.mpegurl') });
      if (way === 'hls') {
        const hls = s.hls = new Hls({ ...HLS_CONFIG });   // a copy: hls.js adds to the object it gets
        hls.on(Hls.Events.ERROR, (_, d) => { if (d?.fatal) failed(s, tok, 0); });
        hls.on(Hls.Events.MANIFEST_PARSED, () => { s.video.play().catch(() => {}); });
        hls.loadSource(url);
        hls.attachMedia(s.video);
      } else if (way === 'native') {
        s.video.src = url;
        s.video.play().catch(() => {});
      } else failed(s, tok, 404);                        // this browser cannot play HLS: still images
    } catch { failed(s, tok, status); }
  }
  /** a try ended by itself: try again, or still images */
  function failed(s, tok, status) {
    if (s.tok !== tok || !s.running) return;
    const played = s.played;
    halt(s);
    const next = liveNext({ status, played, fails: s.fails });
    s.fails = next.fails;
    if (next.still) { toStill(s); return; }
    look(s.box, 'wait');
    s.retry = setTimeout(() => { s.retry = 0; watch(); }, next.wait);
  }
  function halt(s) {
    s.tok++; s.running = false;
    clearTimeout(s.guard);
    if (s.hls) { s.hls.destroy(); s.hls = null; }
    if (s.video.getAttribute('src')) { s.video.removeAttribute('src'); s.video.load(); }
  }
  function stop(s) {
    halt(s);
    clearTimeout(s.retry); s.retry = 0;
    look(s.box, 'wait');
  }
  /** no live picture for this camera: the box shows still images (renewed every few seconds) instead */
  function toStill(s) {
    stop(s);
    lives.delete(s.id);
    noLive.set(s.id, Date.now());
    s.video.replaceWith(ctx.camImage(s.id, s.cls));
    look(s.box, 'still');
  }
  return { camLive };
}
