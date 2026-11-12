/* Settings dialog, easier to use (5.8.0, the owner's choice from docs/ideen-5.8, idea ①): a short drop-down becomes a row of buttons (all
 * choices at a glance, one tap; the design and the window frames with a little colour sample), a slider shows its value ("72 %"), a length
 * its unit (m or ft), and a long grey explanation shows two lines with "mehr …". The on/off ticks look like switches (style.css only).
 * The drop-down stays in the page, hidden: it is still what the settings read and save (settings.js), and tests and the video guide may
 * still pick from it; a pick there moves the buttons along. What the buttons say is pure (segItems, tests/setcontrols.test.mjs). */

/** the drop-downs that become buttons (when their choices are short enough, segItems) */
export const SEG_IDS = ['setTheme', 'setUnits', 'setGrid', 'setPerf', 'setLabels', 'setBelowMode', 'setHouseFloors', 'setWindowFrames', 'setEarth', 'setSky',
  'setNightDim', 'setUi', 'setPresenceRule'];
/** colour samples of some choices: [background] or [background, accent] */
export const SWATCH = {
  setTheme: { holo: ['#050d1c', '#23e0ff'], dark: ['#0f1419', '#3fa9f5'], light: ['#eef1f4', '#1f8de0'] },
  setWindowFrames: { white: ['#f4f4f2'], anthracite: ['#383e42'] },
};
const MAX_OPTS = 5, MAX_MAIN = 36, LONG = 22;

/** an option's text as what it is and a note: "Anthrazit (hellere Wände)" -> { main: 'Anthrazit', note: 'hellere Wände' }; the Chinese
 *  brackets too; a long text with a comma is split there ("Voll, an der Kameraseite aufgeschnitten" -> "Voll" + the rest) */
export function splitLabel(text) {
  const s = String(text ?? '').trim();
  const m = s.match(/^(.+?)\s*[(（]([^()（）]+)[)）]\s*$/);
  if (m) return { main: m[1].trim(), note: m[2].trim() };
  const c = s.match(/^([^,，]+)[,，]\s*(.+)$/);
  if (c && [...s].length > LONG) return { main: c[1].trim(), note: c[2].trim() };
  return { main: s, note: '' };
}
/** the buttons for a drop-down's options [{ value, text, hidden, disabled }]: [{ value, main, note, disabled }], or null when it does not
 *  suit buttons (fewer than 2 or more than 5 choices, or a long one: it stays a drop-down) */
export function segItems(options) {
  const opts = (options || []).filter((o) => !o.hidden);
  if (opts.length < 2 || opts.length > MAX_OPTS) return null;
  const items = opts.map((o) => ({ value: String(o.value), ...splitLabel(o.text), disabled: !!o.disabled }));
  return items.some((i) => !i.main || [...i.main].length > MAX_MAIN) ? null : items;
}
/** what a slider from 0 to 1 shows: 0.72 -> "72 %" */
export const pctText = (v) => `${Math.round((parseFloat(v) || 0) * 100)} %`;
/** the unit of the lengths in the settings */
export const lenUnit = (units) => (units === 'imperial' ? 'ft' : 'm');

/** ctx: $, t. Returns a part of the settings form (settings.js ctx.parts): fill(settings) draws the buttons, values and units anew after the
 *  form is filled; read() reads nothing (the drop-downs and sliders are read by settings.js) */
export function initSetControls(ctx) {
  const { $, t } = ctx;
  const dlg = $('#settingsDialog');
  if (!dlg) return { fill() {}, read() {} };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  /* ---- drop-downs as buttons ---- */
  function mark(sel) {
    const box = sel.nextElementSibling?.classList.contains('segBtns') ? sel.nextElementSibling : null;
    box?.querySelectorAll('button').forEach((b) => { const on = b.dataset.value === sel.value; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
  }
  function drawSeg(sel) {
    let box = sel.nextElementSibling?.classList.contains('segBtns') ? sel.nextElementSibling : null;
    const items = segItems([...sel.options].map((o) => ({ value: o.value, text: o.textContent, hidden: o.hidden, disabled: o.disabled })));
    if (!items) { box?.remove(); sel.classList.remove('segHidden'); return; }
    if (!box) {
      box = el('div', 'segBtns'); box.setAttribute('role', 'radiogroup'); box.dataset.for = sel.id;
      sel.after(box); sel.classList.add('segHidden'); sel.tabIndex = -1;
    }
    const label = dlg.querySelector(`label[for="${sel.id}"]`)?.textContent.trim();
    if (label) box.setAttribute('aria-label', label);
    box.replaceChildren(...items.map((it) => {
      const b = el('button'); b.type = 'button'; b.dataset.value = it.value; b.disabled = it.disabled; b.setAttribute('role', 'radio');
      const sw = SWATCH[sel.id]?.[it.value];
      if (sw) { const i = el('i', 'segSwatch'); i.style.background = sw.length > 1 ? `linear-gradient(135deg, ${sw[0]} 55%, ${sw[1]} 55%)` : sw[0]; b.append(i); }
      const txt = el('span', 'segTxt'); txt.append(el('span', 'segMain', it.main));
      if (it.note) txt.append(el('small', 'segNote', it.note));
      b.append(txt);
      if (it.note) b.title = `${it.main} (${it.note})`;
      return b;
    }));
    mark(sel);
  }
  const segSelects = () => SEG_IDS.map((id) => dlg.querySelector(`#${id}`)).filter(Boolean);
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('.segBtns button');
    if (!b || b.disabled) return;
    const sel = b.parentElement.previousElementSibling;
    if (!sel || sel.tagName !== 'SELECT' || sel.value === b.dataset.value) return;
    sel.value = b.dataset.value;
    mark(sel);
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));   // settings.js saves on every change in the dialog
  });
  dlg.addEventListener('keydown', (e) => {                        // ← / → move through the buttons like through a drop-down
    const b = e.target.closest?.('.segBtns button');
    if (!b || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const all = [...b.parentElement.querySelectorAll('button:not(:disabled)')], i = all.indexOf(b);
    const next = all[Math.max(0, Math.min(all.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)))];
    next?.focus(); next?.click();
  });
  dlg.addEventListener('change', (e) => { if (e.target.matches?.('select.segHidden')) mark(e.target); });

  /* ---- sliders with their value, lengths with their unit ---- */
  const showValue = (r) => { const o = r.nextElementSibling; if (o?.tagName === 'OUTPUT') o.textContent = pctText(r.value); };
  dlg.addEventListener('input', (e) => { if (e.target.matches?.('input[type=range][data-show=pct]')) showValue(e.target); });

  /* ---- long explanations: two lines and "mehr …" ---- */
  const HINTS = ':is(.sgTile, .sgBody, .sgSub) > :is(p.sub, p.hint):not([id])';
  function clampOne(p) {
    if (p.dataset.clamp === 'open' || !p.offsetParent) return;          // opened on purpose, or not shown now (measured when it is)
    const more = p.nextElementSibling?.classList.contains('moreBtn') ? p.nextElementSibling : null;
    p.classList.remove('clamp');
    const line = parseFloat(getComputedStyle(p).lineHeight) || 16;
    if (p.scrollHeight <= line * 3.3) { more?.remove(); return; }       // three lines or less: shown as they are
    p.classList.add('clamp');
    if (more) return;
    const b = el('button', 'moreBtn', t('sg.more')); b.type = 'button';
    b.addEventListener('click', () => { p.classList.remove('clamp'); p.dataset.clamp = 'open'; b.remove(); });
    p.after(b);
  }
  let pending = 0;
  /** measure the explanations that are shown now (after the dialog, a group or a page came up) */
  function clamp() {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => { if (dlg.open) dlg.querySelectorAll(HINTS).forEach(clampOne); });
  }
  dlg.addEventListener('sg-show', clamp);
  dlg.addEventListener('sg-page', clamp);
  dlg.addEventListener('toggle', clamp, true);                          // a group or a card folded open
  dlg.addEventListener('click', (e) => { if (e.target.closest('#sgNav')) clamp(); });
  addEventListener('resize', clamp);

  function fill(settings) {
    segSelects().forEach(drawSeg);
    dlg.querySelectorAll('input[type=range][data-show=pct]').forEach(showValue);
    dlg.querySelectorAll('.unit[data-unit=len]').forEach((u) => { u.textContent = lenUnit(settings?.units); });
    clamp();
  }
  return { fill, read() {}, clamp };
}
