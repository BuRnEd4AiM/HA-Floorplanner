/* Keyboard help (#471): "?" in edit mode, or "⌨ All keys" under "Controls" in the side panel, shows every key of the editor on one
 * card. The rows are pure (unit test: tests/shortcuts.test.mjs, which also checks each one against keyCommand in edititems.js, so the
 * card never names a key that does nothing); initShortcuts draws the card. */
import { TOOL_KEYS } from './edititems.js';

/** the card: [{ group (text key), rows: [{ keys: [[key, ...] (pressed together), ...] (alternatives), what (text key) }] }].
 *  A key is a letter or one of ctrl, shift, alt, del, back, enter, esc, arrows, up, down, ? (named by keyName) */
export function shortcutRows() {
  return [
    { group: 'kc.g.tools', rows: Object.entries(TOOL_KEYS).map(([k, tool]) => ({ keys: [[k.toUpperCase()]], what: `tool.${tool}` })) },
    { group: 'kc.g.edit', rows: [
      { keys: [['ctrl', 'Z']], what: 'kc.undo' },
      { keys: [['ctrl', 'Y'], ['ctrl', 'shift', 'Z']], what: 'kc.redo' },
      { keys: [['ctrl', 'C']], what: 'kc.copy' },
      { keys: [['ctrl', 'V']], what: 'kc.paste' },
      { keys: [['ctrl', 'D']], what: 'kc.duplicate' },
      { keys: [['del'], ['back']], what: 'kc.delete' },
      { keys: [['Q'], ['E']], what: 'kc.turn' },
      { keys: [['enter']], what: 'kc.enter' },
      { keys: [['esc']], what: 'kc.esc' },
    ] },
    { group: 'kc.g.move', rows: [
      { keys: [['arrows']], what: 'kc.nudge' },
      { keys: [['shift', 'arrows']], what: 'kc.nudge10' },
      { keys: [['alt', 'arrows']], what: 'kc.nudge1' },
      { keys: [['up'], ['down']], what: 'kc.floor' },
      { keys: [['?']], what: 'kc.help' },
    ] },
  ];
}

/** how a key is written on the card: Ctrl / Strg (⌘ on a Mac), Shift, arrows ... (t: the texts) */
export function keyName(k, t, mac = false) {
  const named = { ctrl: mac ? '⌘' : t('kc.ctrl'), shift: t('kc.shift'), alt: mac ? '⌥' : 'Alt', del: t('kc.del'), back: '⌫', enter: 'Enter', esc: 'Esc',
    arrows: '← ↑ → ↓', up: '↑', down: '↓' };
  return named[k] ?? k;
}

/** ctx: $, t, mac (a Mac: ⌘ instead of Ctrl) */
export function initShortcuts(ctx) {
  const { $, t } = ctx;
  const dlg = $('#keysDialog'), box = $('#keysList');
  const kbd = (k) => { const e = document.createElement('kbd'); e.textContent = keyName(k, t, ctx.mac); return e; };
  function render() {
    box.replaceChildren(...shortcutRows().map((g) => {
      const sec = document.createElement('section'); sec.className = 'keysGroup';
      const h = document.createElement('h4'); h.textContent = t(g.group);
      const dl = document.createElement('dl');
      g.rows.forEach((r) => {
        const dt = document.createElement('dt');
        r.keys.forEach((combo, i) => {
          if (i) dt.append(document.createTextNode(` ${t('kc.or')} `));
          combo.forEach((k, j) => { if (j) dt.append(document.createTextNode('+')); dt.append(kbd(k)); });
        });
        const dd = document.createElement('dd'); dd.textContent = t(r.what);
        dl.append(dt, dd);
      });
      sec.append(h, dl);
      return sec;
    }));
  }
  function open() { if (dlg.open) { dlg.close(); return; } render(); dlg.showModal(); }
  $('#keysBtn')?.addEventListener('click', open);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });     // a click on the dark backdrop closes it
  return { open };
}
