/* 👥 Gäste-Zugang in ⚙ → 👥 Benutzer & Tablets (5.21.0, the owner 2026-11-20; his choices: the guest logs in once as a Home Assistant
 * user, light, shutters, heating and music / TV of one room, until a date): switch, the Home Assistant user ("gast"), the room, "bis"
 * (with +1 / +3 / +7 days), how to make the user in Home Assistant, the QR code of the add-on's address and a card to print (with the
 * password typed here only for the print, never saved). A part of the settings form (settings.js parts: fill / read); the server keeps
 * it in settings.guest (guest.py) and enforces it. Pure helpers: guestaccess.js. */
import { guestUrl, untilFromInput, inputFromUntil, untilIn, untilText, isOver, qrSvg } from './guestaccess.js';

/** ctx: $, t, lang(), layout() (the house shown), houseId() */
export function initGuestUi(ctx) {
  const { $, t } = ctx;
  const box = $('#guestBox');
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const row = (label, el, id) => { const r = make('div', 'row'); const l = make('label', '', label); if (id) l.htmlFor = id; r.append(l, el); return r; };
  const on = make('input'); on.type = 'checkbox'; on.id = 'guestOn';
  const onRow = make('div', 'row check'); const onLab = make('label', '', t('gu.on')); onLab.htmlFor = 'guestOn'; onRow.append(on, onLab);
  const user = make('input'); user.type = 'text'; user.id = 'guestUser'; user.setAttribute('list', 'haUsers'); user.placeholder = 'gast'; user.maxLength = 64;
  const room = make('select'); room.id = 'guestRoom';
  const until = make('input'); until.type = 'datetime-local'; until.id = 'guestUntil';
  const quick = make('div', 'stopTools guQuick');
  [[1, 'gu.d1'], [3, 'gu.d3'], [7, 'gu.d7']].forEach(([n, k]) => {
    const b = make('button', '', t(k)); b.type = 'button'; b.dataset.days = String(n);
    b.addEventListener('click', () => { until.value = untilIn(n); until.dispatchEvent(new Event('change', { bubbles: true })); });
    quick.append(b);
  });
  const state = make('p', 'sub guState');
  const how = make('details', 'sgGuide guHow');
  const howSum = make('summary', '', t('gu.howTitle')); const howList = make('ol');
  ['gu.how1', 'gu.how2', 'gu.how3', 'gu.how4'].forEach((k) => howList.append(make('li', '', t(k))));
  how.append(howSum, howList);
  const qr = make('div', 'guQr'), url = make('code', 'guUrl');
  const pass = make('input'); pass.type = 'text'; pass.id = 'guestPass'; pass.autocomplete = 'off'; pass.placeholder = t('gu.passHint');
  pass.dataset.noSave = '1';
  const print = make('button', '', `🖨 ${t('gu.print')}`); print.type = 'button'; print.dataset.act = 'guestPrint';
  const qrWrap = make('div', 'guQrWrap'); const qrText = make('div', 'guQrText');
  qrText.append(make('b', '', t('gu.qrTitle')), make('p', 'sub', t('gu.qrHelp')), url, row(t('gu.pass'), pass, 'guestPass'), print);
  qrWrap.append(qr, qrText);
  box.append(make('p', 'hint', t('gu.help')), onRow, row(t('gu.user'), user, 'guestUser'), row(t('gu.room'), room, 'guestRoom'),
    row(t('gu.until'), until, 'guestUntil'), quick, state, how, qrWrap);

  const address = () => {                                      // the top window: Home Assistant around the add-on (same origin); else this page
    let top;
    try { top = window.top.location; void top.origin; } catch { top = null; }
    return guestUrl(top, location);
  };
  const roomName = (key) => [...room.options].find((o) => o.value === key)?.textContent || '';
  function rooms() {
    const hid = ctx.houseId?.() || '';
    return (ctx.layout()?.floors || []).flatMap((f) => (f.rooms || []).filter((r) => r.name && !r.terrace).map((r) => ({ key: `${hid}/${r.id}`, name: r.name })))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  function showState() {
    const over = isOver(untilFromInput(until.value));
    state.classList.toggle('warn', on.checked && (over || !room.value));
    state.textContent = !on.checked ? t('gu.stateOff') : !room.value ? t('gu.noRoom') : over ? t('gu.stateOver')
      : until.value ? t('gu.stateOn', { room: roomName(room.value), until: untilText(untilFromInput(until.value), ctx.lang()) }) : t('gu.stateOnOpen', { room: roomName(room.value) });
    qrWrap.hidden = !on.checked;
    if (on.checked && !qr.dataset.url) { const a = address(); qr.innerHTML = qrSvg(a); qr.dataset.url = a; url.textContent = a; }
  }
  on.addEventListener('change', showState); room.addEventListener('change', showState); until.addEventListener('change', showState);
  pass.addEventListener('change', (e) => e.stopPropagation());     // only for the print: not a change of the settings

  /** the card to print, in a frame of its own (works inside Home Assistant's app too) */
  function printCard() {
    const a = address(), until1 = untilFromInput(until.value), esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t('gu.cardTitle'))}</title><style>
      body{font-family:system-ui,sans-serif;margin:0;display:flex;justify-content:center;padding:24px;color:#111}
      .c{border:2px solid #222;border-radius:16px;padding:22px 26px;width:360px;text-align:center}
      h1{font-size:22px;margin:0 0 4px}p{margin:6px 0;font-size:14px}.k{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;text-align:left;margin:12px auto 0;width:max-content;font-size:16px}
      .k b{font-family:ui-monospace,monospace;font-size:18px}small{color:#555;word-break:break-all}</style></head><body><div class="c">
      <h1>👥 ${esc(t('gu.cardTitle'))}</h1><p>${esc(t('gu.cardRoom', { room: roomName(room.value) }))}</p>${qrSvg(a, { size: 240 })}
      <p>${esc(t('gu.cardScan'))}</p><div class="k"><span>${esc(t('gu.user'))}</span><b>${esc(user.value.trim() || 'gast')}</b>
      <span>${esc(t('gu.pass'))}</span><b>${esc(pass.value || '…………')}</b></div>
      ${until1 ? `<p>${esc(t('gu.cardUntil', { until: untilText(until1, ctx.lang()) }))}</p>` : ''}<small>${esc(a)}</small></div></body></html>`;
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    f.srcdoc = html;
    f.addEventListener('load', () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch { /* no print here */ } setTimeout(() => f.remove(), 60000); });
    document.body.append(f);
  }
  print.addEventListener('click', printCard);

  return {
    fill(settings) {
      const g = settings.guest || {};
      const list = rooms();
      const keep = g.room && !list.some((r) => r.key === g.room) ? [{ key: g.room, name: `${g.room} (?)` }] : [];   // a room of another house
      room.replaceChildren(make('option', '', t('gu.pickRoom')), ...[...list, ...keep].map((r) => { const o = make('option', '', r.name); o.value = r.key; return o; }));
      room.options[0].value = '';
      on.checked = g.on === true;
      if (document.activeElement !== user) user.value = g.user || 'gast';
      room.value = g.room || '';
      if (document.activeElement !== until) until.value = inputFromUntil(g.until);
      showState();
    },
    read(next) {
      next.guest = { on: on.checked, user: user.value.trim() || 'gast', room: room.value || '', until: untilFromInput(until.value) };
    },
  };
}
