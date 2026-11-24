/* 🖼 „So funktionieren Bildkarten“ (5.35.0, the owner 2026-11-24: "kannst du diese Grafik … bei Abläufe …, dass, wenn Benutzer das nicht
 * verstehen, dort ein Beispiel haben"): the explanation of docs/hilfe/bildkarten.jpg as a window of its own, in the page's language:
 * ① the green boxes are gaps you write once (a sentence) → something happens → the card on the phone (drawn by the add-on with a room of
 * the house, api/piccards/preview); ② the same sentence for an alarm, a routine a device starts and a routine by time or button (there the
 * room, floor and sensor stay empty); ③ what to remember and where it is set. Opened from ▶ Abläufe → 🖼 Bildkarten fürs Handy and from the
 * card editor (piccardsui.js). The sentence and its samples: piccards.js (HELP_SENTENCE, helpFilled; tested).
 * initPicCardsHelp({ t }) → { open() } */
import { PH, HELP_SENTENCE, helpFilled } from './piccards.js';

const SENTENCE = HELP_SENTENCE.map((p) => (PH.includes(p) ? `{${p}}` : p)).join('');

export function initPicCardsHelp({ t }) {
  let dlg = null, url = '';
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const pill = (k) => make('span', 'pchPill', t(`pc.ph.${k}`));
  const sentence = () => { const d = make('span', 'pchSent'); HELP_SENTENCE.forEach((p) => d.append(PH.includes(p) ? pill(p) : p)); return d; };
  const filled = (vals) => {
    const d = make('span', 'pchBubble');
    helpFilled(vals).forEach((x) => d.append(x.s != null ? x.s : x.v != null ? make('span', 'pchVal', x.v) : make('span', 'pchGap', '?')));
    return d;
  };
  const step = (n, title) => { const h = make('h3', 'pchH'); h.append(make('span', 'pchStep', String(n)), title); return h; };
  async function picture(img) {
    if (url) { img.src = url; return; }
    const card = { id: 'help', name: t('pc.h.title'), color: '#d63c31', theme: 'light', width: 'tall', blocks: [
      { k: 'head', text: '{kind}', clock: true }, { k: 'text', text: SENTENCE, big: true }, { k: 'plan', show: 'floor', marks: false }] };
    try {
      const r = await fetch('api/piccards/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card, kind: 'water' }) });
      if (!r.ok) throw new Error(String(r.status));
      url = URL.createObjectURL(await r.blob());
      img.src = url;
    } catch { img.closest('.pchPhone')?.remove(); }   // no picture: the rest still explains it
  }
  function build() {
    const head = make('div', 'pchTop');
    const x = make('button', 'bdBtn pchClose', '✕'); x.type = 'button'; x.title = t('pc.close'); x.addEventListener('click', () => dlg.close());
    head.append(make('b', 'pchTitle', `🖼 ${t('pc.h.title')}`), x);
    const lead = make('p', 'pchLead', t('pc.h.lead'));
    // ① the sentence → something happens → the phone
    const s1 = make('section', 'pchBox');
    const left = make('div', 'pchLeft'), write = make('div', 'pchWrite');
    write.append(sentence(), make('small', '', t('pc.h.write')));
    left.append(write, make('div', 'pchThen', t('pc.h.then')));
    const phone = make('div', 'pchPhone'), scr = make('div', 'pchScr'), img = make('img'); img.alt = t('pc.h.phone');
    scr.append(img, make('div', 'pchCap', t('pc.h.phone'))); phone.append(scr);
    const hero = make('div', 'pchHero'); hero.append(left, make('div', 'pchArrow', '➜'), phone);
    s1.append(step(1, t('pc.h.s1')), hero);
    picture(img);
    // ② the same sentence, three things that happen
    const s2 = make('section', 'pchBox');
    const yours = make('div', 'pchYours'); yours.append(make('b', '', t('pc.h.yours')), sentence());
    s2.append(step(2, t('pc.h.s2')), yours);
    [['A', '💧', 'a', true], ['B', '🚶', 'b', true], ['C', '🕙', 'c', false]].forEach(([letter, icon, k, ok]) => {
      const row = make('div', `pchRow${ok ? '' : ' bad'}`); row.dataset.case = k;
      const side = make('div', 'pchIcon'); side.append(make('span', 'pchLetter', letter), make('span', 'pchEmoji', icon));
      const body = make('div', 'pchBody');
      const arrive = make('div', 'pchArrive'); arrive.append(make('span', 'pchLbl', t('pc.h.arrives')), filled(t(`pc.h.${k}Vals`)));
      body.append(make('div', 'pchT', t(`pc.h.${k}`)), make('div', 'pchW', t(`pc.h.${k}Sub`)), arrive, make('div', ok ? 'pchOk' : 'pchWarn', t(ok ? 'pc.h.ok' : 'pc.h.gap')));
      row.append(side, body); s2.append(row);
    });
    // ③ remember
    const s3 = make('section', 'pchBox');
    const tips = make('div', 'pchTips');
    const tip = (cls, icon, ...parts) => { const d = make('div', `pchTip ${cls}`); d.append(make('span', 'pchTipIc', icon), ...parts); return d; };
    const only = make('div', ''); ['time', 'house', 'kind', 'text'].forEach((k) => only.append(pill(k), ' '));
    tips.append(tip('g', '✅', t('pc.h.tip1')), tip('r', '⚠️', make('div', '', t('pc.h.tip2')), only, make('div', '', t('pc.h.tip2b'))),
      tip('b', '📨', make('div', '', t('pc.via')), make('div', 'pchSmall', t('pc.h.tip3'))));
    s3.append(step(3, t('pc.h.s3')), tips);
    const body = make('div', 'pchMain'); body.append(lead, s1, s2, s3);
    dlg.replaceChildren(head, body);
  }
  function open() {
    if (!dlg) {
      dlg = make('dialog', 'ceDlg pchDlg'); dlg.id = 'pcHelpDlg';
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // a tap beside it closes it
      document.body.append(dlg);
    }
    build();
    if (!dlg.open) dlg.showModal();
  }
  return { open };
}
