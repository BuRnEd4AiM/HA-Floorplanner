/* The 🎤 of the voice search (#509): listening with the browser's own speech recognition (Chrome, Edge, Safari; the sound goes to Google
 * or Apple) or, where there is none (Firefox) or where it is there but does nothing (an app with a built-in browser: the Home Assistant
 * app, Fully Kiosk, #511), recording the microphone and letting Home Assistant's Assist turn it into text (api/voice/stt, voice.py). Which
 * one: pickEngine in voicequery.js, whyNot / browserRecognition in voicediag.js; the sound: voiceaudio.js (all tested). This file only
 * talks to the browser. */
import { pickEngine, SPEECH_LANG } from './voicequery.js';
import { toPcm16, joinPcm, loudness, listener, step, MAX_MS } from './voiceaudio.js';
import { browserKind, browserRecognition, whyNot, FALL_BACK, BROKEN, START_MS, ASK_MS } from './voicediag.js';

/** the browser's speech recognition, null without */
export const Recognizer = () => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
/** may the page record the microphone? Only a secure page (https or the computer itself) with getUserMedia and Web Audio */
export const canMic = () => !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext));
/** may this page use the microphone where it is embedded (Permissions Policy; true when the browser does not say) */
export const micPolicy = () => {
  const p = document.permissionsPolicy || document.featurePolicy;
  try { return p?.allowsFeature ? p.allowsFeature('microphone') : true; } catch { return true; }
};
/** the microphone's permission for this page: 'granted' | 'denied' | 'prompt' | '' (the browser does not say) */
export async function micPermission() {
  try { return (await navigator.permissions.query({ name: 'microphone' })).state || ''; } catch { return ''; }
}

/* what this device found out (kept in the browser, per device): does the browser's recognition work here ('ok' | 'broken', for this
 * user agent: an update of the browser asks again) and which microphone records for Assist (its deviceId) */
const MEMO_KEY = 'fp.voiceDevice', MIC_KEY = 'fp.voiceMic';
const store = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* no storage */ } };
const stored = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
export function memo() {
  try { const m = JSON.parse(stored(MEMO_KEY) || '{}'); return m.ua === navigator.userAgent ? m.browser || '' : ''; } catch { return ''; }
}
export const remember = (browser) => store(MEMO_KEY, browser ? JSON.stringify({ ua: navigator.userAgent, browser }) : '');
export const micChoice = () => stored(MIC_KEY);
export const setMicChoice = (id) => store(MIC_KEY, id);

/** the microphone, the one chosen in the microphone test when it is still there */
export async function openMic() {
  const base = { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, id = micChoice();
  if (id) {
    try { return await navigator.mediaDevices.getUserMedia({ audio: { ...base, deviceId: { exact: id } } }); } catch (e) {
      if (e?.name !== 'OverconstrainedError' && e?.name !== 'NotFoundError') throw e;
      setMicChoice('');                                         // that microphone is gone: the system's own
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: base });
}

/** ctx: lang() (the add-on's language), engine() (the setting: auto | browser | assist | off), assist() (Home Assistant can listen:
 *  api/voice), askAssist() (async: asks Home Assistant now when it was not asked yet -> it can listen) */
export function initVoiceInput(ctx) {
  let current = null;                                   // the listening going on: { stop(), cancel() }
  const kind = browserKind(navigator.userAgent);
  /** what this device can: has (the browser has a recognition), state (browserRecognition), browser (it may be used), app, secure,
   *  policy, mic (it may record), assist */
  const can = () => {
    const has = !!Recognizer(), state = browserRecognition(has, kind.app, memo()), secure = !!window.isSecureContext, policy = micPolicy();
    return { has, state, browser: state === 'ok' && secure && policy, app: kind.app, secure, policy, mic: canMic() && policy, assist: !!ctx.assist() };
  };
  const engine = () => pickEngine(ctx.engine(), can());

  /** the browser listens and gives the words while they are said. Nothing at all after start() (an app's built-in browser): 'dead';
   *  fallback: then (or after another error that is not "nothing said") Home Assistant's Assist listens when it can */
  function browserListen(on, fallback) {
    const R = Recognizer(), rec = new R();
    rec.lang = SPEECH_LANG[ctx.lang()] || navigator.language || 'de-DE';
    rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
    let said = '', done = false, started = false, timer = 0;
    const end = (fn) => { if (done) return; done = true; clearTimeout(timer); current = null; fn(); };
    const abort = () => { try { rec.abort(); } catch { /* gone */ } };
    const fail = (code) => end(async () => {
      if (BROKEN.includes(code)) remember('broken');
      if (fallback && FALL_BACK.includes(code) && can().mic) {              // Home Assistant tries, when it can
        let gaveUp = false;
        const asking = { stop: () => { gaveUp = true; }, cancel: () => { gaveUp = true; } };
        current = asking;                                                   // a tap meanwhile ends it, it does not start another
        const ok = await ctx.askAssist();
        if (current === asking) current = null;
        if (gaveUp) { on.error('cancel'); return; }
        if (ok) { current = assistListen(on); return; }
      }
      on.error(code);
    });
    const begin = () => {
      if (started || done) return;
      started = true; clearTimeout(timer);
      on.state('listening');
      timer = setTimeout(() => rec.stop(), MAX_MS + 3000);    // it should end by itself
    };
    /** not started yet after START_MS (longer while the browser asks for the microphone): it never will */
    const watch = (ms) => { timer = setTimeout(async () => {
      if (started || done) return;
      if (ms === START_MS && await micPermission() === 'prompt') { if (!started && !done) watch(ASK_MS); return; }
      if (started || done) return;
      abort(); fail('dead');
    }, ms); };
    const handle = {
      stop: () => {
        if (!started) { end(() => { abort(); on.error('cancel'); }); return; }
        rec.stop();
        setTimeout(() => end(() => (said ? on.final(said) : on.error('no-speech'))), 2500);   // no "end" from the browser: what was said counts
      },
      cancel: () => end(() => { abort(); on.error('cancel'); }),
    };
    rec.onstart = begin; rec.onaudiostart = begin;
    rec.onresult = (ev) => {
      begin();
      said = [...ev.results].map((r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
      if (said && memo() !== 'ok') remember('ok');             // it works on this device
      on.partial(said);
    };
    rec.onerror = (ev) => (ev.error === 'aborted' ? end(() => on.error('cancel')) : ev.error === 'no-speech' ? end(() => on.error('no-speech')) : fail(ev.error || 'error'));
    rec.onend = () => (started || said ? end(() => (said ? on.final(said) : on.error('no-speech'))) : fail('dead'));
    on.state('starting');
    try { rec.start(); } catch { setTimeout(() => fail('error')); return handle; }
    watch(START_MS);
    return handle;
  }

  /** record until a pause after speech (voiceaudio.js), then Home Assistant's Assist makes it text */
  function assistListen(on) {
    let stopped = false, cancelled = false, finish = null;
    const handle = { stop: () => { stopped = true; finish?.('done'); }, cancel: () => { cancelled = true; finish?.('cancel'); } };
    on.state('starting');
    (async () => {
      let stream;
      try { stream = await openMic(); }
      catch (e) { current = null; on.error(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'not-allowed' : 'audio-capture'); return; }
      if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); current = null; on.error('cancel'); return; }
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const src = ac.createMediaStreamSource(stream), node = ac.createScriptProcessor(4096, 1, 1);
      const parts = [], s = listener(performance.now());
      const timers = [
        setTimeout(() => { if (!parts.length) finish?.('no-audio'); }, 3000),             // the microphone gives nothing at all
        setTimeout(() => finish?.(parts.length ? 'done' : 'nothing'), MAX_MS + 2000),   // the sound stopped coming
      ];
      finish = (how) => {
        finish = null;
        timers.forEach(clearTimeout);
        node.onaudioprocess = null;
        try { src.disconnect(); node.disconnect(); } catch { /* already */ }
        stream.getTracks().forEach((tr) => tr.stop());
        ac.close().catch(() => {});
        if (how === 'cancel') { current = null; on.error('cancel'); return; }
        if (how === 'no-audio') { current = null; on.error('no-audio'); return; }
        if (how === 'nothing' || !parts.length) { current = null; on.error('no-speech'); return; }
        send(joinPcm(parts), on);
      };
      node.onaudioprocess = (ev) => {
        const x = ev.inputBuffer.getChannelData(0);
        parts.push(toPcm16(x, ac.sampleRate));
        const r = step(s, loudness(x), performance.now());
        if (r !== 'go') finish?.(r);
      };
      src.connect(node); node.connect(ac.destination);        // a ScriptProcessor only runs while it is connected; it writes silence
      on.state('listening');
      if (stopped) finish?.('done');
    })();
    return handle;
  }
  async function send(pcm, on) {
    on.state('thinking');
    try {
      const r = await fetch('api/voice/stt', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: pcm.buffer });
      const body = await r.json().catch(() => ({}));
      current = null;
      if (r.ok && body.text) on.final(body.text);
      else on.error(r.ok ? 'no-speech' : body.error === 'stt-no-text-recognized' ? 'no-speech' : body.error || `http ${r.status}`);
    } catch { current = null; on.error('network'); }
  }

  /** start listening; on: { partial(text) (the words so far, browser only), final(text), error(code), state('starting' | 'listening' |
   *  'thinking') }. Listening already: stop it (what was said so far counts). opts.engine: this recognition and no other (the
   *  microphone test), else the one of the setting and, with "auto", Assist when the browser's fails */
  function listen(on, opts = {}) {
    if (current) { current.stop(); return; }
    const e = opts.engine || engine();
    if (!e) { on.error(whyNot(ctx.engine(), can()) || 'none'); return; }
    current = e === 'browser' ? browserListen(on, !opts.engine && ctx.engine() === 'auto') : assistListen(on);   // "Nur die des Browsers": no Assist
  }
  return { engine, can, kind, why: () => whyNot(ctx.engine(), can()), listen, busy: () => !!current, cancel: () => current?.cancel() };
}
