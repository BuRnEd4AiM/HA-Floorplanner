/* The microphone test of the voice search (#511): what kind of browser this is, whether its own speech recognition can work here (an app
 * with a built-in browser, Fully Kiosk or the Home Assistant app, has the recognition of Chrome but it does nothing), why the 🎤 cannot
 * listen, what a failed microphone or recognition means and what to do about it, how loud the microphone was. Pure (unit test:
 * tests/voicediag.test.mjs); voicecheck.js shows it in ⚙ → 🎤 Sprachsuche, voiceinput.js listens. */

/** the browser from its user agent: { name ('Chrome 130', 'Edge 129', 'Firefox 131', 'Safari 17', 'Samsung Internet 26', 'Opera 114'),
 *  app ('' | 'ha' (the Home Assistant app) | 'webview' (an Android app with a built-in browser: Fully Kiosk, a kiosk app) | 'ios' (an app
 *  on the iPhone / iPad)), os ('android' | 'ios' | 'windows' | 'mac' | 'linux' | ''), fully (Fully Kiosk Browser says its name) } */
export function browserKind(ua) {
  const s = String(ua || '');
  const ver = (re) => { const m = s.match(re); return m ? m[1] : null; };
  const os = /Android/.test(s) ? 'android' : /iPhone|iPad|iPod/.test(s) ? 'ios' : /Windows/.test(s) ? 'windows'
    : /Macintosh|Mac OS X/.test(s) ? 'mac' : /Linux|CrOS/.test(s) ? 'linux' : '';
  const app = /Home ?Assistant\//i.test(s) ? 'ha'
    : os === 'android' && (/; wv\)/.test(s) || /Version\/[\d.]+ Chrome\//.test(s)) ? 'webview'
      : os === 'ios' && !/Safari\//.test(s) ? 'ios' : '';
  const named = [['Edge', /Edg(?:e|A|iOS)?\/(\d+)/], ['Opera', /OPR\/(\d+)/], ['Samsung Internet', /SamsungBrowser\/(\d+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/(\d+)/], ['Chrome', /CriOS\/(\d+)/], ['Chrome', /Chrome\/(\d+)/], ['Safari', /Version\/(\d+)[\d.]* (?:Mobile\/\S+ )?Safari\//]]
    .map(([n, re]) => [n, ver(re)]).find(([, v]) => v);
  return { name: named ? `${named[0]} ${named[1]}` : 'Browser', app, os, fully: /Fully ?Kiosk|FullyKiosk/i.test(s) };
}

/** may the browser's own recognition be used: 'ok' | 'broken' (it is there but does nothing here: in an app, or it failed on this
 *  device before) | 'none' (there is none). memo: what the microphone test or an earlier try found on this device ('ok' | 'broken' | '') */
export function browserRecognition(has, app, memo) {
  if (!has) return 'none';
  if (memo === 'ok') return 'ok';
  return memo === 'broken' || app ? 'broken' : 'ok';
}

/** the errors of the browser's recognition after which Home Assistant's Assist is tried at once (when it can listen), and those after
 *  which the browser's recognition counts as not working on this device ('dead': it never started) */
export const FALL_BACK = ['dead', 'network', 'not-allowed', 'service-not-allowed', 'language-not-supported', 'bad-grammar', 'error'];
export const BROKEN = ['dead', 'service-not-allowed', 'language-not-supported'];
/** how long the browser's recognition may take to start before it counts as dead (ms); longer while the browser asks for the microphone */
export const START_MS = 5000;
export const ASK_MS = 30000;

/** why the 🎤 cannot listen, '' when it can: 'off' | 'insecure' (http://, no microphone at all) | 'policy' (the page may not use the
 *  microphone where it is embedded) | 'app' (an app's built-in browser without Assist) | 'broken' (the browser's recognition failed here,
 *  no Assist) | 'noBrowser' (no recognition in this browser, no Assist) | 'noMic' (no microphone for Assist) | 'noAssist' (Assist chosen,
 *  Home Assistant has none). engine: the setting; can: voiceinput.js can() { has, browser, app, secure, policy, mic, assist } */
export function whyNot(engine, can) {
  if (engine === 'off') return 'off';
  if (!can.secure) return 'insecure';
  if (can.policy === false) return 'policy';
  const notBrowser = () => (!can.has ? 'noBrowser' : can.app ? 'app' : 'broken');
  if (engine === 'browser') return can.browser ? '' : notBrowser();
  if (can.assist && can.mic) return '';
  if (engine === 'assist') return can.assist ? 'noMic' : 'noAssist';
  if (can.browser) return '';
  return can.assist ? 'noMic' : notBrowser();
}

/** a failed getUserMedia (the name of its error) -> 'insecure' | 'denied' (this page may not: the browser's setting) | 'dismissed' (the
 *  question was closed) | 'blocked' (the browser may, the system or the app does not let it) | 'noDevice' | 'busy' (another program has
 *  it) | 'unsupported' | 'other'. permission: what navigator.permissions says ('granted' | 'denied' | 'prompt' | '' unknown) */
export function micProblem(name, { secure = true, permission = '' } = {}) {
  if (!secure) return 'insecure';
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)) {
    return permission === 'granted' ? 'blocked' : permission === 'prompt' ? 'dismissed' : 'denied';
  }
  if (['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(name)) return 'noDevice';
  if (['NotReadableError', 'TrackStartError', 'AbortError'].includes(name)) return 'busy';
  if (name === 'TypeError' || name === 'unsupported') return 'unsupported';
  return 'other';
}

/** what to do about a problem on this kind of device: keys of vk.fix.* (static/i18n.js), most likely first */
export function advice(problem, kind) {
  const k = kind || {}, inApp = k.app === 'ha' || k.app === 'webview' || k.app === 'ios';
  const appFix = k.fully ? ['fully', 'android'] : k.app === 'ha' ? (k.os === 'ios' ? ['ios'] : ['haApp']) : k.app === 'ios' ? ['ios'] : ['android'];
  const system = k.os === 'windows' ? ['windows'] : k.os === 'mac' ? ['mac'] : k.os === 'android' ? ['android'] : k.os === 'ios' ? ['ios'] : [];
  switch (problem) {
    case 'insecure': return ['https', ...(inApp ? [] : ['flag'])];
    case 'policy': return ['newTab'];
    case 'denied': return inApp ? appFix : ['site', ...system];
    case 'dismissed': return ['again'];
    case 'blocked': return inApp ? appFix : system.length ? system : ['site'];
    case 'noDevice': return ['plugIn', ...system];
    case 'busy': return ['otherProgram'];
    case 'silent': return ['wrongMic', ...system];
    case 'quiet': return ['louder'];
    case 'app': case 'broken': case 'dead': return ['assist', ...(k.os === 'android' && inApp ? ['chrome'] : [])];
    case 'noBrowser': return ['assist', 'otherBrowser'];
    case 'network': return ['internet', 'assist'];
    case 'noAssist': return ['assist'];
    case 'noSpeech': return ['speakNow', 'defaultMic', ...system];
    default: return [];
  }
}

/** the loudest piece of a microphone test (root mean square) -> 'ok' (speech) | 'quiet' (only very soft) | 'silent' (nothing at all:
 *  muted or the wrong microphone) */
export function levelVerdict(max) {
  return max >= 0.02 ? 'ok' : max >= 0.002 ? 'quiet' : 'silent';
}

/** how full the level bar is for a loudness (0..1): soft speech shows a good third, loud speech the whole bar */
export const meter = (rms) => Math.max(0, Math.min(1, Math.sqrt(Math.max(0, rms)) * 2.2));

/** an error code of the recognition (the browser's, Home Assistant's or this add-on's) -> a key of vk.rec.* */
export function recProblem(code) {
  const c = String(code || '');
  if (c === 'no-speech' || c === 'stt-no-text-recognized') return 'noSpeech';
  if (c === 'not-allowed' || c === 'service-not-allowed' || c === 'audio-capture') return 'mic';
  if (c === 'network') return 'network';
  if (c === 'dead') return 'dead';
  if (c === 'no-audio') return 'silent';
  if (c === 'no_assist' || c === 'none') return 'noAssist';
  if (c === 'language-not-supported') return 'language';
  return 'other';
}
