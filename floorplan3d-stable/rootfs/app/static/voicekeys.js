/* The 🎤 with the dictation of the keyboard: browsers let a page use the microphone only over https (or on the computer itself), and an
 * app's built-in browser (Fully Kiosk, the Home Assistant app) has no speech recognition of its own. The keyboard's own 🎤 (Gboard,
 * Samsung, iPhone / iPad; on a PC Windows + H or the dictation of the Mac) types into any text field of any page, also over http://.
 * So there the 🎤 opens the search box with the keyboard and says how; what is dictated is asked by itself once it rests a moment
 * (KEYS_MS). Which words for which device and when: keysHint, TO_KEYS, KEYS_MS in voicediag.js (tested); answering: voiceui.js. */
import { keysHint, KEYS_MS } from './voicediag.js';

/** ctx: $, t, search (search.js), kind (voicediag.js browserKind), ask(text) (voiceui.js), checkRow() (the row "🩺 Mikrofon-Test öffnen") */
export function initVoiceKeys(ctx) {
  const { $, t } = ctx;
  const field = $('#findInput');
  let on = false, timer = 0, asked = '';
  const touch = () => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } };
  const hint = () => t(`vq.keys.${keysHint(ctx.kind, touch())}`);
  function stop() { on = false; clearTimeout(timer); }
  /** the search box empty with the keyboard and how to dictate */
  function start() {
    ctx.search.show({ text: '', head: `🎤 ${hint()}`, rows: [ctx.checkRow()] });
    on = true; asked = ''; clearTimeout(timer);
    field.focus();                                       // in the tap: so the keyboard of a tablet or phone comes up
  }
  field.addEventListener('input', () => {
    if (!on) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const text = field.value.trim();
      if (!on || !text || text === asked) return;
      asked = text;
      if (touch()) field.blur();                         // the keyboard goes: the whole answer is seen
      ctx.ask(text);
    }, KEYS_MS);
  });
  field.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') stop(); });   // asked or closed by hand
  new MutationObserver(() => { if ($('#findBox').hidden) stop(); }).observe($('#findBox'), { attributes: true, attributeFilter: ['hidden'] });
  return { start, stop, active: () => on, hint };
}
