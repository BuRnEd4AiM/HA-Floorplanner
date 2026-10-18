/* Holiday alarm (#456) on the screen: the 🛡 button over the plan, the lock screen that covers the whole tablet (half see-through) while it
 * is armed and only goes away with the code, and its part in the settings (group "Warnings & alarm", editors only): the sensors that set it
 * off, offline counts, the time to leave and to come home, the code, the sirens and lights, the message. The rules are in guard.js (tested),
 * the alarm itself runs in the add-on (guard.py), also with no screen open. Editors may look at the plan while it is armed ("Nur ansehen"),
 * a wall tablet may not. */
import { sensorChoices, actionChoices, openNow, leftNow, screenOf, pressKey } from './guard.js';

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

/** ctx: $, t, entities(), layout() */
export function initGuardUi(ctx) {
  const { $, t } = ctx;
  const btn = $('#guardBtn'), scr = $('#guardScreen'), box = $('#guardBox');
  if (!btn || !scr) return { poll() {} };
  let info = null, fetchedAt = 0, code = '', note = '', asking = false, peek = '', busy = false, timer = 0, saveNote = '', wasShown = false;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const phase = () => info?.view?.phase || 'off';
  const left = () => leftNow(info?.view, fetchedAt, Date.now());

  async function poll() {
    clearTimeout(timer);
    try {
      const r = await fetch('api/guard');
      if (r.ok) { info = await r.json(); fetchedAt = Date.now(); }
    } catch { /* offline: try again */ }
    if (peek && peek !== phase()) peek = '';                    // "only look" lasts until something changes (an alarm shows again)
    if (asking && phase() !== 'off') { asking = false; code = ''; }   // armed meanwhile on another screen
    render();
    timer = setTimeout(poll, phase() === 'off' && !asking ? 15000 : 2000);
  }
  async function send(arm) {
    if (busy) return;
    busy = true;
    try {
      const r = await fetch(`api/guard/${arm ? 'arm' : 'disarm'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { info = { ...info, view: j.view }; fetchedAt = Date.now(); asking = false; note = ''; peek = ''; }
      else note = r.status === 429 ? t('gd.wait', { s: j.wait }) : r.status === 403 && j.error === 'code' ? t('gd.wrong', { n: j.left }) : t('gd.failed', { e: j.error || r.status });
    } catch (err) { note = t('gd.failed', { e: err.message }); }
    code = ''; busy = false;
    poll();
  }

  /* ---- the 🛡 button and the lock screen ---- */
  function renderButton() {
    const p = phase();
    btn.hidden = !info || !!info.ready;                          // not set up: no button
    btn.textContent = t(`gd.btn.${p === 'entry' ? 'alarm' : p}`, { s: left() });
    btn.classList.toggle('alert', p === 'entry' || p === 'alarm');
    btn.classList.toggle('armed', p === 'arming' || p === 'armed');
  }
  function renderScreen() {
    const sc = screenOf(info?.view, left()), p = phase();
    const shown = !!info && !info.ready && (asking ? p === 'off' : sc.show && peek !== p);
    scr.hidden = !shown;
    document.body.classList.toggle('guardLocked', shown);
    if (shown && !wasShown && !asking) document.querySelectorAll('dialog[open]').forEach((d) => d.close());   // nothing lies over the lock screen
    wasShown = shown;
    if (!shown) { scr.replaceChildren(); return; }
    scr.className = `gd-${asking ? 'ask' : sc.tone}`;
    const card = el('div', 'gdCard');
    card.append(el('div', 'gdIcon', p === 'entry' || p === 'alarm' ? '🚨' : '🛡'));
    card.append(el('div', 'gdTitle', asking ? t('gd.armTitle') : t(sc.key, { s: sc.left, name: sc.what?.name || '' })));
    if (asking) {
      const open = openNow(info.sensors, ctx.entities());
      card.append(el('p', 'gdSub', t('gd.armHint', { s: info.delay })));
      if (open.length) card.append(el('p', 'gdWarn', t('gd.openWarn', { list: open.map((o) => `${o.name} (${t(`gd.st.${o.state}`)})`).join(', ') })));
    } else if (sc.what?.at) card.append(el('p', 'gdSub', new Date(sc.what.at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })));
    if (info.locked) card.append(el('p', 'gdSub', t('gd.lockedHint')));
    else {
      card.append(el('div', 'gdDots', code ? '●'.repeat(code.length) : t('gd.codeAsk')));
      const pad = el('div', 'gdPad');
      PAD.forEach((k) => { const b = el('button', '', k); b.type = 'button'; b.dataset.key = k; b.addEventListener('click', () => key(k)); pad.append(b); });
      const go = el('button', 'gdGo', t(asking ? 'gd.arm' : 'gd.disarm')); go.type = 'button'; go.id = 'guardGo'; go.disabled = busy || code.length < 4;
      go.addEventListener('click', () => send(asking));
      card.append(pad, go);
    }
    if (note) card.append(el('p', 'gdNote', note));
    const tools = el('div', 'gdTools');
    if (asking) { const x = el('button', '', t('close')); x.type = 'button'; x.id = 'guardClose'; x.addEventListener('click', () => { asking = false; code = ''; note = ''; render(); }); tools.append(x); }
    else if (info.canEdit) { const v = el('button', '', t('gd.peek')); v.type = 'button'; v.id = 'guardPeek'; v.addEventListener('click', () => { peek = p; code = ''; render(); }); tools.append(v); }
    if (tools.childNodes.length) card.append(tools);
    scr.replaceChildren(card);
  }
  function key(k) {
    if (k === 'OK') { if (code.length >= 4) send(asking); return; }
    code = pressKey(code, k); note = '';
    render();
  }
  function render() { renderButton(); renderScreen(); }
  btn.addEventListener('click', () => {
    if (phase() === 'off') { asking = true; code = ''; note = ''; render(); poll(); }
    else { peek = ''; render(); }                                 // armed: the lock screen again (after "only look")
  });
  addEventListener('keydown', (e) => {                           // a keyboard works too; nothing else gets a key while it is shown
    if (scr.hidden || e.key === 'Tab') return;
    e.stopPropagation();
    const k = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Backspace' ? '⌫' : e.key === 'Enter' ? 'OK' : e.key === 'Escape' && asking ? 'ESC' : null;
    if (!k) return;
    e.preventDefault();
    if (k === 'ESC') { asking = false; code = ''; render(); } else key(k);
  }, true);
  setInterval(() => { if (phase() === 'arming' || phase() === 'entry') render(); }, 1000);   // the seconds count down
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

  /* ---- the part in the settings (editors) ---- */
  function checkRow(id, key, on) {
    const row = el('div', 'row check'), cb = el('input'); cb.type = 'checkbox'; cb.id = id; cb.checked = !!on;
    const lb = el('label', '', t(key)); lb.htmlFor = id; row.append(cb, lb);
    return row;
  }
  /** a group of ticks that folds open, with "all" / "none" */
  function pickGroup(title, items, chosen, attr, open) {
    const d = el('details', 'gdGroup'); d.open = open;
    const n = items.filter((i) => chosen.includes(i.entity)).length;
    const sum = el('summary', '', `${title} (${n}/${items.length})`);
    const all = el('button', '', t('gd.all')), none = el('button', '', t('gd.none'));
    all.type = none.type = 'button';
    const set = (on) => { d.querySelectorAll(`[${attr}]`).forEach((c) => { c.checked = on; }); };
    all.addEventListener('click', (e) => { e.preventDefault(); set(true); }); none.addEventListener('click', (e) => { e.preventDefault(); set(false); });
    sum.append(el('span', 'gdAllNone'), all, none);
    d.append(sum);
    items.forEach((i) => {
      const row = el('label', 'gdItem'), cb = el('input'); cb.type = 'checkbox'; cb.setAttribute(attr, i.entity); cb.checked = chosen.includes(i.entity);
      const name = el('span', 'n', i.name);
      if (i.where) name.append(el('small', '', i.where));
      row.append(cb, name);
      if (i.state) row.append(el('span', `chip ${i.state}`, t(`gd.st.${i.state}`)));
      d.append(row);
    });
    return d;
  }
  function renderSettings() {
    if (!box) return;
    const cfg = info?.cfg;
    if (!cfg) { box.replaceChildren(...(info ? [el('p', 'sub', t('gd.onlyEditors'))] : [])); return; }
    const out = [el('h4', '', t('gd.title')), el('p', 'hint', t('gd.help'))];
    out.push(el('div', 'sub', t('gd.sensors')));
    const sensors = sensorChoices(ctx.entities(), ctx.layout(), cfg.sensors);
    if (!sensors.length) out.push(el('p', 'sub', t('gd.noSensors')));
    sensors.forEach((g, i) => out.push(pickGroup(t(`gd.g.${g.group}`), g.items, cfg.sensors, 'data-gd-sensor', i === 0 || g.items.some((x) => cfg.sensors.includes(x.entity)))));
    out.push(checkRow('gdOffline', 'gd.offline', cfg.offline));
    const delay = el('input'); delay.type = 'number'; delay.min = '0'; delay.max = '300'; delay.step = '5'; delay.id = 'gdDelay'; delay.value = String(cfg.delay);
    const dr = el('div', 'row'), dl = el('label', '', t('gd.delay')); dl.htmlFor = 'gdDelay'; dr.append(dl, delay); out.push(dr);
    const cin = el('input'); cin.type = 'password'; cin.inputMode = 'numeric'; cin.autocomplete = 'new-password'; cin.id = 'gdCode'; cin.maxLength = 8;
    cin.placeholder = cfg.hasCode ? t('gd.codeSaved') : t('gd.codeNew');
    const cr = el('div', 'prop stack'), cl = el('label', '', t('gd.code')); cl.htmlFor = 'gdCode'; cr.append(cl, cin); out.push(cr);
    out.push(el('div', 'sub', t('gd.actions')));
    actionChoices(ctx.entities(), cfg.actions).forEach((g) => out.push(pickGroup(t(`gd.ag.${g.group}`), g.items, cfg.actions, 'data-gd-action', g.items.some((x) => cfg.actions.includes(x.entity)))));
    out.push(checkRow('gdNotify', 'gd.notify', cfg.notify), checkRow('gdReport', 'gd.report', cfg.report));
    const bar = el('div', 'stopTools'), sv = el('button', '', t('gd.save')); sv.type = 'button'; sv.id = 'gdSave';
    sv.addEventListener('click', saveSettings); bar.append(sv);
    out.push(bar, el('p', 'sub gdStatus', saveNote || t(`gd.ready.${info.ready || 'ok'}`)));
    box.replaceChildren(...out);
  }
  async function saveSettings() {
    const v = (id) => box.querySelector(`#${id}`);
    const body = {
      sensors: [...box.querySelectorAll('[data-gd-sensor]:checked')].map((c) => c.getAttribute('data-gd-sensor')),
      actions: [...box.querySelectorAll('[data-gd-action]:checked')].map((c) => c.getAttribute('data-gd-action')),
      offline: v('gdOffline').checked, notify: v('gdNotify').checked, report: v('gdReport').checked, delay: Math.max(0, parseInt(v('gdDelay').value, 10) || 0),
    };
    const c = v('gdCode').value.trim();
    if (c && !/^[0-9]{4,8}$/.test(c)) { saveNote = t('gd.codeBad'); renderSettings(); return; }
    if (c) body.code = c;
    try {
      const r = await fetch('api/guard', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      info = { ...info, cfg: j.cfg, ready: j.ready, sensors: j.cfg.sensors, delay: j.cfg.delay };
      saveNote = `${t('gd.saved')} ${t(`gd.ready.${j.ready || 'ok'}`)}`;
    } catch (err) { saveNote = t('gd.failed', { e: err.message }); }
    renderSettings(); render();
  }
  $('#settingsBtn')?.addEventListener('click', async () => { saveNote = ''; await poll(); renderSettings(); });
  poll();
  return { poll, info: () => info, screen: () => !scr.hidden };
}
