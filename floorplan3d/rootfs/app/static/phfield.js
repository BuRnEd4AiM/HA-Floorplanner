/* 🖼 A text of a picture card with its placeholders as green boxes (5.34.0, the owner's choice of docs/ideen-5.34: idea 2, "Grüne Kästchen";
 * his question 2026-11-24: "wenn ich nur … Raum rein schreibe, es einen Raum nimmt"): a one-line field you can type in; {room} … are shown
 * as a box "Raum" that ⌫ deletes as a whole; under it a button per placeholder ("＋ Raum  wo es ist") puts one where the cursor is. What is
 * kept stays the text with {room} … (piccard.fill draws it; the rules are in piccards.js: phParts, phText).
 * makePhField({ t, label, value, max, onInput(text), key }) → { el (the field, the buttons and the help), field, value() } */
import { PH, phParts, phText } from './piccards.js';

export function makePhField({ t, label, value = '', max = 200, onInput, key }) {
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const box = (k) => { const s = make('span', 'pcPh', t(`pc.ph.${k}`)); s.contentEditable = 'false'; s.dataset.ph = k; return s; };
  const field = make('div', 'pcPhField');
  field.contentEditable = 'true'; field.spellcheck = false; field.setAttribute('role', 'textbox'); field.title = t('pc.o.textHelp');
  if (key) field.dataset.opt = key;
  const fill = (text) => field.replaceChildren(...phParts(text).map((p) => (p.ph ? box(p.ph) : document.createTextNode(p.s))));
  /** the field as its text: the boxes as {room} …, line breaks as spaces */
  const read = () => {
    const parts = [];
    const walk = (n) => n.childNodes.forEach((c) => {
      if (c.nodeType === 3) parts.push({ s: c.nodeValue.replace(/[\n\r]+/g, ' ') });
      else if (c.dataset?.ph) parts.push({ ph: c.dataset.ph });
      else if (c.nodeName === 'BR') parts.push({ s: ' ' });
      else walk(c);
    });
    walk(field);
    return phText(parts).replace(/\u00a0/g, ' ');
  };
  fill(value);
  let last = value, range = null;
  const changed = () => {
    let v = phText(phParts(read()));                            // {raum} typed by hand is kept as {room}
    if (v.length > max) { v = v.slice(0, max); fill(v); }
    if (/\{\w+\}/.test(v) && field.querySelectorAll('.pcPh').length !== phParts(v).filter((p) => p.ph).length) {   // {raum} typed by hand: a box
      fill(v); placeAtEnd();
    }
    if (v !== last) { last = v; onInput?.(v); }
  };
  function placeAtEnd() {
    const r = document.createRange(); r.selectNodeContents(field); r.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); range = r.cloneRange();
  }
  const keep = () => { const sel = getSelection(); if (sel.rangeCount && field.contains(sel.getRangeAt(0).startContainer)) range = sel.getRangeAt(0).cloneRange(); };
  field.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });   // one line, as before
  field.addEventListener('keyup', keep);
  field.addEventListener('mouseup', keep);
  field.addEventListener('input', () => { keep(); changed(); });
  field.addEventListener('paste', (e) => {                      // only plain text
    e.preventDefault();
    insert(document.createTextNode((e.clipboardData?.getData('text/plain') || '').replace(/[\n\r]+/g, ' ')));
    fill(read()); placeAtEnd(); changed();
  });
  /** a node put where the cursor was (else at the end), the cursor after it */
  function insert(node) {
    field.focus();
    let r = range && field.contains(range.startContainer) ? range : null;
    if (!r) { r = document.createRange(); r.selectNodeContents(field); r.collapse(false); }
    r.deleteContents(); r.insertNode(node);
    const after = document.createRange(); after.setStartAfter(node); after.collapse(true);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(after); range = after.cloneRange();
  }
  const chips = make('div', 'pcPhChips');
  chips.append(make('div', 'pcPhLead', t('pc.o.phLead')));
  PH.forEach((k) => {
    const b = make('button', 'pcPhChip'); b.type = 'button'; b.dataset.ph = k;
    b.append(`＋ ${t(`pc.ph.${k}`)}`, make('small', '', t(`pc.phx.${k}`)));
    b.addEventListener('mousedown', (e) => e.preventDefault());   // the cursor stays in the field
    b.addEventListener('click', () => { insert(box(k)); changed(); });
    chips.append(b);
  });
  const el = make('div', 'pcField pcPhWrap');                   // no label: a tap in it would press the first button
  el.append(make('span', '', label), field, chips, make('small', 'tpSub', t('pc.o.phHelp')));
  return { el, field, value: read };
}
