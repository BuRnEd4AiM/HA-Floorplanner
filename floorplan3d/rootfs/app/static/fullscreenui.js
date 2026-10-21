/* The full screen (⛶ at the right of the tab bar, #479) and a full screen kept on for a user (#487). While the lock "fullscreen" (users
 * dialog) is on, a sheet lies over the page whenever it is not in full screen (a browser lets a page go full screen only after a tap:
 * the tap on the sheet), ⛶ asks for the code instead of leaving, and Esc is held where the browser can (Chrome: keyboard lock). The
 * code goes to the add-on (api/fullscreen/unlock); right: the screen is free until ⛶ is tapped again, the page is loaded again or nobody
 * touched it for 10 minutes. Editors set the code in ⚙ → Benutzer (#fullCodeBox). The rules are in fullscreen.js (tested). A web page
 * can never stop the home button or a switch to another app: a kiosk browser or the tablet's own pinning does that. */
import { FULL_LOCK, fullState, fullButton, freeOver, codeOk, unlockAnswer } from './fullscreen.js';
import { pressKey } from './guard.js';

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
/** the browser may go full screen here (not inside a frame that forbids it, e.g. Home Assistant's add-on panel; not on an iPhone) */
export const canFull = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
export const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

/** ctx: $, t, locks() (a Set: what this user may not use, userlocks.js), changed() (the bar draws its ⛶ again) */
export function initFullscreen(ctx) {
  const { $, t } = ctx;
  let free = false, wasFull = false, asking = false, code = '', note = '', busy = false, touched = Date.now();
  let refused = false;                                             // the browser said it can, but did not (some app WebViews): nothing is kept then
  let hasCode = null, codeNote = '';                               // the part in ⚙ (editors)
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const button = (cls, text, on) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); on(); }); return b; };
  const cover = el('div'); cover.id = 'fullCover'; cover.hidden = true;
  document.body.append(cover);
  const state = () => fullState({ locked: ctx.locks().has(FULL_LOCK), can: canFull() && !refused, full: isFull(), free });

  /** into full screen (only from a tap or a key); kept: Esc is held where the browser can. Refused (or still not in full screen a second
   *  later with the older Safari way, which gives no answer): the sheet goes away instead of locking the screen out */
  function enter() {
    const d = document.documentElement;
    let p;
    try { p = (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d, { navigationUI: 'hide' }); } catch { p = Promise.reject(); }
    Promise.resolve(p).then(() => new Promise((r) => setTimeout(r, p ? 0 : 1000)))
      .then(() => { if (!isFull()) refused = true; else if (state() === 'on') navigator.keyboard?.lock?.(['Escape'])?.catch?.(() => {}); }, () => { refused = true; })
      .finally(() => { render(); ctx.changed(); });
  }
  function leave() {
    navigator.keyboard?.unlock?.();
    try { (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {}); } catch { /* already out */ }
  }

  function render() {
    const s = state(), show = asking || s === 'cover';
    if (show && cover.hidden) document.querySelectorAll('dialog[open]').forEach((d) => d.close());   // nothing lies over the sheet
    cover.hidden = !show;
    if (!show) { cover.replaceChildren(); return; }
    cover.className = asking ? 'fc-ask' : 'fc-cover';
    const card = el('div', 'fcCard');
    if (asking) {
      card.append(el('div', 'fcIcon', '🔒'), el('div', 'fcTitle', t('fs.askTitle')), el('p', 'fcSub', t('fs.askSub')));
      card.append(el('div', `fcDots${code ? '' : ' empty'}`, code ? '●'.repeat(code.length) : t('fs.codeAsk')));
      const pad = el('div', 'fcPad');
      PAD.forEach((k) => { const b = button('', k, () => key(k)); b.dataset.key = k; pad.append(b); });
      const go = button('fcGo', t('fs.end'), send); go.id = 'fullGo'; go.disabled = busy || code.length < 4;
      card.append(pad, go);
      if (note) card.append(el('p', 'fcNote', note));
      const tools = el('div', 'fcTools'), back = button('', t('fs.back'), () => { asking = false; code = ''; note = ''; render(); });
      back.id = 'fullBack'; tools.append(back); card.append(tools);
    } else {
      card.append(el('div', 'fcIcon', '⛶'), el('div', 'fcTitle', t(wasFull ? 'fs.leftTitle' : 'fs.startTitle')), el('p', 'fcSub', t('fs.coverSub')));
      const go = button('fcGo', `⛶ ${t(wasFull ? 'fs.goFull' : 'tab.full')}`, enter); go.id = 'fullEnter';
      const tools = el('div', 'fcTools'), ask = button('', `🔒 ${t('fs.withCode')}`, () => { asking = true; code = ''; note = ''; render(); });
      ask.id = 'fullAsk'; tools.append(ask);
      card.append(go, tools);
    }
    cover.replaceChildren(card);
  }
  cover.addEventListener('click', (e) => { if (!asking && e.target === cover) enter(); });       // the whole sheet goes back into full screen
  function key(k) {
    if (k === 'OK') { send(); return; }
    code = pressKey(code, k); note = '';
    render();
  }
  async function send() {
    if (busy || code.length < 4) return;
    busy = true; render();
    let a;
    try {
      const r = await fetch('api/fullscreen/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      a = unlockAnswer(r.status, await r.json().catch(() => ({})));
    } catch { a = { note: 'fs.failed' }; }
    busy = false; code = '';
    if (a.ok) { free = true; asking = false; note = ''; touched = Date.now(); if (isFull()) leave(); }
    else note = t(a.note, { n: a.n });
    render(); ctx.changed();
  }

  /** ⛶ in the bar */
  function click() {
    const a = fullButton(state(), isFull());
    if (a === 'ask') { asking = true; code = ''; note = ''; render(); return; }
    if (a === 'keep') { free = false; enter(); ctx.changed(); return; }
    if (isFull()) leave(); else enter();
  }
  const changed = () => { if (isFull()) wasFull = true; else navigator.keyboard?.unlock?.(); render(); ctx.changed(); };
  document.addEventListener('fullscreenchange', changed);
  document.addEventListener('webkitfullscreenchange', changed);
  ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, () => { touched = Date.now(); }, { passive: true, capture: true }));
  addEventListener('keydown', (e) => {                            // the keypad takes the keys while it is shown; on the sheet Enter goes back
    if (cover.hidden || e.key === 'Tab') return;
    if (!asking) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } return; }
    e.stopPropagation();
    const k = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Backspace' ? '⌫' : e.key === 'Enter' ? 'OK' : null;
    if (!k) return;
    e.preventDefault(); key(k);
  }, true);
  setInterval(() => { if (freeOver({ free, idleMs: Date.now() - touched })) { free = false; render(); ctx.changed(); } }, 5000);

  /* ---- the code in ⚙ → Benutzer (editors) ---- */
  const box = $('#fullCodeBox');
  function renderSettings() {
    if (!box) return;
    const inp = el('input'); inp.type = 'password'; inp.inputMode = 'numeric'; inp.autocomplete = 'new-password'; inp.id = 'fullCode'; inp.maxLength = 8;
    inp.placeholder = hasCode ? t('fs.codeSaved') : t('fs.codeNew');
    const row = el('div', 'prop stack'), lab = el('label', '', t('fs.code')); lab.htmlFor = 'fullCode'; row.append(lab, inp);
    const tools = el('div', 'stopTools'), sv = button('', t('fs.save'), () => saveCode(inp.value.trim())); sv.id = 'fullCodeSave';
    tools.append(sv);
    if (hasCode) { const rm = button('', t('fs.remove'), () => { if (confirm(t('fs.removeAsk'))) saveCode(''); }); rm.id = 'fullCodeRemove'; tools.append(' ', rm); }
    const status = el('p', `sub${hasCode === false ? ' fcWarn' : ''}`, codeNote || (hasCode == null ? '' : t(hasCode ? 'fs.hasCode' : 'fs.noCodeYet')));
    status.id = 'fullCodeStatus';
    box.replaceChildren(el('h4', '', `🔒 ${t('fs.setTitle')}`), el('p', 'hint', t('fs.setHelp')), row, tools, status);
  }
  async function saveCode(c) {
    if (c && !codeOk(c)) { codeNote = t('fs.codeBad'); renderSettings(); return; }
    if (!c && !hasCode) { codeNote = t('fs.codeBad'); renderSettings(); return; }
    try {
      const r = await fetch('api/fullscreen', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      hasCode = !!j.hasCode; codeNote = t(c ? 'fs.codeSet' : 'fs.codeGone');
    } catch (err) { codeNote = t('fs.saveFailed', { e: err.message }); }
    renderSettings();
  }
  async function loadSettings() {
    try { hasCode = !!(await (await fetch('api/fullscreen')).json()).hasCode; } catch { hasCode = null; }
    codeNote = ''; renderSettings();
  }
  $('#settingsBtn')?.addEventListener('click', loadSettings);

  return {
    can: canFull, isFull, click, state,
    refresh: render,                                             // the locks of this user are known (app.js init)
    asking: () => asking,
  };
}
