/* The 🎤 of the voice search (#509): listening with the browser's own speech recognition (Chrome, Edge, Safari; the sound goes to Google
 * or Apple) or, where there is none (the Home Assistant app on Android, Fully Kiosk, Firefox), recording the microphone and letting Home
 * Assistant's Assist turn it into text (api/voice/stt, voice.py). Which one: pickEngine in voicequery.js; the sound: voiceaudio.js (both
 * tested). This file only talks to the browser. */
import { pickEngine, SPEECH_LANG } from './voicequery.js';
import { toPcm16, joinPcm, loudness, listener, step } from './voiceaudio.js';

/** the browser's speech recognition, null without */
export const Recognizer = () => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
/** may the page record the microphone? Only a secure page (https or the computer itself) with getUserMedia and Web Audio */
export const canMic = () => !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia && (window.AudioContext || window.webkitAudioContext));

/** ctx: lang() (the add-on's language), engine() (the setting: auto | browser | assist | off), assist() (Home Assistant can listen:
 *  api/voice) */
export function initVoiceInput(ctx) {
  let current = null;                                   // the listening going on: { stop(), cancel() }
  const can = () => ({ browser: !!Recognizer(), assist: !!ctx.assist(), mic: canMic() });
  const engine = () => pickEngine(ctx.engine(), can());

  /** the browser listens and gives the words while they are said */
  function browserListen(on) {
    const R = Recognizer(), rec = new R();
    rec.lang = SPEECH_LANG[ctx.lang()] || navigator.language || 'de-DE';
    rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
    let said = '', done = false;
    const end = (fn) => { if (done) return; done = true; current = null; fn(); };
    rec.onresult = (ev) => { said = [...ev.results].map((r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim(); on.partial(said); };
    rec.onerror = (ev) => end(() => on.error(ev.error === 'aborted' ? 'cancel' : ev.error || 'error'));   // no-speech, not-allowed, network, audio-capture ...
    rec.onend = () => end(() => (said ? on.final(said) : on.error('no-speech')));
    try { rec.start(); } catch { end(() => on.error('error')); return null; }
    on.state('listening');
    return { stop: () => rec.stop(), cancel: () => end(() => { rec.abort(); on.error('cancel'); }) };
  }

  /** record until a pause after speech (voiceaudio.js), then Home Assistant's Assist makes it text */
  function assistListen(on) {
    let stopped = false, cancelled = false, finish = null;
    const handle = { stop: () => { stopped = true; finish?.('done'); }, cancel: () => { cancelled = true; finish?.('cancel'); } };
    (async () => {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
      catch (e) { current = null; on.error(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'not-allowed' : 'audio-capture'); return; }
      if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); current = null; on.error('cancel'); return; }
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const src = ac.createMediaStreamSource(stream), node = ac.createScriptProcessor(4096, 1, 1);
      const parts = [], s = listener(performance.now());
      finish = (how) => {
        finish = null;
        node.onaudioprocess = null;
        try { src.disconnect(); node.disconnect(); } catch { /* already */ }
        stream.getTracks().forEach((tr) => tr.stop());
        ac.close().catch(() => {});
        if (how === 'cancel') { current = null; on.error('cancel'); return; }
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

  /** start listening; on: { partial(text) (the words so far, browser only), final(text), error(code), state('listening' | 'thinking') }.
   *  Listening already: stop it (what was said so far counts) */
  function listen(on) {
    if (current) { current.stop(); return; }
    const e = engine();
    if (!e) { on.error('none'); return; }
    current = e === 'browser' ? browserListen(on) : assistListen(on);
  }
  return { engine, can, listen, busy: () => !!current, cancel: () => current?.cancel() };
}
