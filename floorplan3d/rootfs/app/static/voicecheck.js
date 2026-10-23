/* ⚙ → 🎤 Sprachsuche → 🩺 Mikrofon-Test (#511, the owner: "einen Browser-Test … dass man in den Einstellungen testen kann, ob auch das
 * Mikrofon richtig erkannt wird"): what this device is and may (https, the browser or an app, the microphone's permission, the
 * recognition), 1. the microphone with a level bar and a choice of microphones (kept per device, Assist records with it), 2. the
 * recognition the 🎤 uses (or the browser's, to find out whether it works here: kept per device), what went wrong and what to do, and
 * the whole result to copy. Which words: voicediag.js (pure, tested); the listening: voiceinput.js. */
import { micProblem, advice, levelVerdict, meter, recProblem } from './voicediag.js';
import { loudness } from './voiceaudio.js';
import { micPermission, openMic, micChoice, setMicChoice } from './voiceinput.js';

/** how long the microphone is listened to (ms) */
export const TEST_MS = 6000;

/** ctx: $, t, voice (voiceui.js: status(), refresh(), update(), input), version() */
export function initVoiceCheck(ctx) {
  const { $, t } = ctx;
  const input = ctx.voice.input, kind = input.kind;
  let perm = '', level = null;                          // the microphone's permission; the level test going on: { stop() }
  const results = { mic: [], rec: [] };                 // the lines of both steps: [ok (true | false | null), text, fix]
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fixes = (problem) => advice(problem, kind).map((k) => [null, t(`vk.fix.${k}`, { origin: location.origin }), true]);

  /** what this device is and may: [ok, text, fix] */
  function facts() {
    const c = input.can(), s = ctx.voice.status();
    const device = [kind.name, t(`vk.os.${kind.os || 'other'}`), kind.app && t(`vk.app.${kind.fully ? 'fully' : kind.app}`)].filter(Boolean).join(' · ');
    const rec = c.state === 'ok' ? 'vc.st.browser' : c.state === 'none' ? 'vc.st.noBrowser' : c.app ? 'vk.st.recApp' : 'vk.st.recBroken';
    const out = [
      [c.secure, c.secure ? t('vk.st.secure') : t('vk.st.insecure', { origin: location.origin })],
      [null, t('vk.st.device', { device })],
      ...(perm ? [[perm === 'granted' ? true : perm === 'denied' ? false : null, t(`vk.perm.${perm}`)]] : []),
      ...(c.policy ? [] : [[false, t('vk.st.policy')]]),
      [c.state === 'ok' && c.secure, t(rec)],
      [c.mic, t(c.mic ? 'vc.st.mic' : 'vc.st.noMic')],
      [s.assist?.assist ?? null, s.assist == null ? t('vc.st.asking') : s.assist.assist ? t('vc.st.assist', { name: s.assist.name || '' }) : t('vc.st.noAssist')],
    ];
    if (s.engine) out.push([true, t('vc.st.uses', { what: t(`vc.via.${s.engine}`) }), false, 'now']);
    else {
      out.push([false, s.why && s.why !== 'off' ? t(`vq.why.${s.why}`) : t('vc.st.none'), false, 'now']);
      if (s.why) out.push(...fixes(s.why));
    }
    return out;
  }
  const line = ([ok, text, fix, cls]) => el('li', [fix ? 'fix' : ok === true ? 'ok' : ok === false ? 'no' : 'info', cls].filter(Boolean).join(' '),
    fix ? `→ ${text}` : `${ok === true ? '✓' : ok === false ? '✗' : 'ℹ'} ${text}`);
  /** the facts into a list (voiceprefs.js: #vcStatus) */
  const drawFacts = (ul) => ul.replaceChildren(...facts().map(line));
  function show(step, lines) {
    results[step] = lines;
    $('#vkResult').replaceChildren(...[...results.mic, ...results.rec].map(line));
    ctx.changed?.();
  }
  async function refresh() {
    perm = await micPermission();
    ctx.changed?.();
  }

  /* ---- 1. the microphone: does sound come? ---- */
  async function listDevices(now) {
    let devs = [];
    try { devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput' && d.deviceId && !['default', 'communications'].includes(d.deviceId)); } catch { /* none */ }
    const sel = $('#vkDevice');
    sel.replaceChildren(new Option(t('vk.dev.default'), ''), ...devs.map((d, i) => new Option(d.label || t('vk.dev.n', { n: i + 1 }), d.deviceId)));
    const want = micChoice() || '';
    sel.value = [...sel.options].some((o) => o.value === want) ? want : '';
    return devs.find((d) => d.deviceId === now)?.label || '';
  }
  async function micTest() {
    if (level) { level.stop(); return; }
    level = { stop: () => {} };                         // asking for the microphone: a second tap waits
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = AC ? new AC() : null;                    // made in the tap: Safari only lets a sound start there
    ac?.resume().catch(() => {});
    show('mic', [[null, t('vk.m.asking')]]);
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !ac) throw Object.assign(new Error('unsupported'), { name: 'unsupported' });
      stream = await openMic();
    } catch (e) {
      ac?.close().catch(() => {});
      level = null;
      await refresh();
      const p = micProblem(e?.name, { secure: !!window.isSecureContext, permission: perm });
      show('mic', [[false, t(`vk.m.${p}`, { err: e?.name || '' })], ...fixes(p)]);
      return;
    }
    await refresh();
    const track = stream.getAudioTracks()[0];
    const name = (await listDevices(track?.getSettings?.().deviceId)) || track?.label || t('vk.dev.unnamed');
    const src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
    an.fftSize = 2048; src.connect(an);
    const buf = new Float32Array(an.fftSize), t0 = performance.now();
    let max = 0, done = false;
    $('#vkLevelBox').hidden = false; $('#vkMic').textContent = t('vk.stop');
    show('mic', [[null, t('vk.m.speak', { name })]]);
    const stop = () => {
      if (done) return;
      done = true; clearInterval(iv); level = null;
      stream.getTracks().forEach((tr) => tr.stop());
      try { src.disconnect(); } catch { /* already */ }
      ac.close().catch(() => {});
      $('#vkMic').textContent = t('vk.mic'); $('#vkLevel').style.width = '0%';
      const v = levelVerdict(max);
      show('mic', [[v === 'ok', t(`vk.m.${v}`, { name, pct: Math.round(meter(max) * 100) })], ...(v === 'ok' ? [] : fixes(v))]);
    };
    const iv = setInterval(() => {
      an.getFloatTimeDomainData(buf);
      const rms = loudness(buf);
      max = Math.max(max, rms);
      $('#vkLevel').style.width = `${Math.round(meter(rms) * 100)}%`;
      $('#vkLevel').classList.toggle('loud', rms >= 0.02);
      if (performance.now() - t0 >= TEST_MS) stop();
    }, 50);
    level = { stop };
  }

  /* ---- 2. the recognition: are words understood? ---- */
  function recTest() {
    if (input.busy()) { input.listen({}); return; }
    level?.stop();
    const c = input.can();
    const e = input.engine() || (c.has && c.secure && c.policy ? 'browser' : c.assist && c.mic ? 'assist' : null);   // the browser's once more: does it work here?
    if (!e) { const why = input.why() || 'none'; show('rec', [[false, why === 'none' ? t('vc.st.none') : t(`vq.why.${why}`)], ...fixes(why)]); return; }
    const what = t(`vc.via.${e}`);
    const done = () => { $('#vkRec').textContent = t('vk.rec'); ctx.voice.update(); ctx.changed?.(); };
    $('#vkRec').textContent = t('vk.stop');
    input.listen({
      partial: (txt) => show('rec', [[null, `🎤 … ${txt}`]]),
      final: (txt) => { show('rec', [[true, t('vk.r.ok', { what, text: txt })]]); done(); },
      error: (code) => {
        done();
        if (code === 'cancel') { show('rec', []); return; }
        const p = recProblem(code);
        const fix = { noSpeech: 'noSpeech', mic: c.secure ? 'denied' : 'insecure', network: 'network', dead: c.app ? 'app' : 'dead', silent: 'silent', noAssist: 'noAssist' }[p];
        show('rec', [[false, t(`vk.r.${p}`, { what, code })], ...(fix ? fixes(fix) : [])]);
      },
      state: (s) => show('rec', [[null, t(s === 'thinking' ? 'vq.thinking' : s === 'starting' ? 'vq.starting' : 'vk.r.speak', { what })]]),
    }, { engine: e });
  }

  /* ---- the result to copy (to send it on) ---- */
  async function copy() {
    const mark = ([ok, text, fix]) => `${fix ? '  →' : ok === true ? '✓' : ok === false ? '✗' : 'ℹ'} ${text}`;
    const text = [`3D Floorplan ${ctx.version?.() || ''} · ${t('vk.title')} · ${new Date().toLocaleString()}`, navigator.userAgent, '',
      ...facts().map(mark), '', ...[...results.mic, ...results.rec].map(mark)].join('\n');
    const box = $('#vkReport');
    box.value = text; box.hidden = false;
    try { await navigator.clipboard.writeText(text); $('#vkCopy').textContent = `✓ ${t('vk.copied')}`; } catch { box.select(); $('#vkCopy').textContent = t('vk.copySelf'); }
    setTimeout(() => { $('#vkCopy').textContent = t('vk.copy'); }, 4000);
  }

  $('#vkMic').addEventListener('click', micTest);
  $('#vkRec').addEventListener('click', recTest);
  $('#vkCopy').addEventListener('click', copy);
  $('#vkDevice').addEventListener('change', (ev) => {
    ev.stopPropagation();                               // per device, not a setting of the house
    setMicChoice(ev.target.value);
    level?.stop(); micTest();
  });
  /** the settings closed: no microphone stays on */
  const stopAll = () => { level?.stop(); if (input.busy()) input.cancel(); };
  $('#settingsDialog')?.addEventListener('close', stopAll);
  return { facts, drawFacts, refresh, stop: stopAll, micTest, recTest };
}
