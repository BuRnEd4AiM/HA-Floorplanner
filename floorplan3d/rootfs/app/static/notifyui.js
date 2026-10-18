/* Settings dialog, part "🚨 Message on alarm" (#414): when the alarm panel goes off or a smoke, gas, carbon monoxide or water sensor
 * reports, the add-on sends a message at once (alarmnotify.py on the server, also with no screen open): by WhatsApp through CallMeBot
 * (phone number + the key CallMeBot sends back) or through a notify service of Home Assistant. Only editors see it; the phone number and
 * the key are kept by the add-on (api/notify), not in the settings every tablet reads. Saved with its own button; "Send a test" saves
 * first. Above it, in the group "Warnings & alarm", which alarm panels Home Assistant has: the add-on has no alarm of its own, the doors
 * and windows that set it off are chosen in the alarm panel (e.g. Alarmo). */
import { alarmPanels } from './alerts.js';

const KINDS = ['alarm', 'smoke', 'gas', 'co', 'water'];
const CALLMEBOT = 'https://www.callmebot.com/blog/free-api-whatsapp-messages/';

/** ctx: $, t, entities() */
export function initNotifyUi(ctx) {
  const { $, t } = ctx;
  const box = $('#alarmNotify'), head = $('#alarmNotifyTitle'), off = $('#alarmNotifyOff'), panelsEl = $('#alarmPanels');
  let cfg = null, services = [], status = '', busy = false;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const check = (id, key, on) => {
    const row = el('div', 'row check'), cb = el('input'); cb.type = 'checkbox'; cb.id = id; cb.checked = !!on;
    const lb = el('label', '', t(key)); lb.htmlFor = id; row.append(cb, lb);
    return row;
  };
  const field = (id, key, input) => { const row = el('div', 'prop stack'), lb = el('label', '', t(key)); lb.htmlFor = id; input.id = id; row.append(lb, input); return row; };
  const why = (r) => (r ? t(`an.ready.${r}`) : t('an.ready.ok'));

  /** the alarm panels of Home Assistant and their state, or a tip when there is none */
  function renderPanels() {
    if (!panelsEl) return;
    const list = alarmPanels(ctx.entities?.() || []);
    const st = (s) => { const k = `dc.st.${s}`, v = t(k); return v === k ? s : v; };
    panelsEl.textContent = list.length ? t('sg.alarm.found', { list: list.map((p) => `${p.name} (${st(p.state)})`).join(', ') }) : t('sg.alarm.none');
  }
  async function load() {
    renderPanels();
    if (!box) return;
    try {
      const r = await fetch('api/notify');
      if (!r.ok) { cfg = null; render(); return; }          // not an editor: the part stays hidden
      const j = await r.json();
      cfg = j; services = j.services || []; status = why(j.ready);
    } catch { cfg = null; }
    render();
  }
  /** what the fields say now */
  function read() {
    const v = (id) => box.querySelector(`#${id}`);
    const out = {
      on: v('anOn').checked, clear: v('anClear').checked, via: v('anVia').value,
      kinds: KINDS.filter((k) => v(`anKind_${k}`).checked), phone: v('anPhone').value, service: v('anService').value,
    };
    const key = v('anKey').value.trim();
    if (key) out.apikey = key;                                // empty: the stored key stays
    return out;
  }
  async function save(body) {
    const r = await fetch('api/notify', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(String(r.status));
    cfg = await r.json();
    return cfg;
  }
  async function act(test) {
    if (busy) return;
    const body = read();                                       // before drawing anew: the fields are drawn from what is stored
    busy = true; status = t(test ? 'an.sending' : 'an.saving'); render();
    try {
      const c = await save(body);
      if (!test) status = `${t('an.saved')} ${why(c.ready)}`;
      else {
        const r = await fetch('api/notify/test', { method: 'POST' }), j = await r.json().catch(() => ({}));
        status = r.ok ? t('an.sent') : t('an.failed', { e: j.error || r.status });
      }
    } catch (err) { status = t('an.failed', { e: err.message }); }
    busy = false;
    render();
  }
  function render() {
    if (!box) return;
    if (head) head.hidden = !cfg;
    if (off) off.hidden = !!cfg;                              // who may not edit learns why the part is missing
    box.hidden = !cfg;
    if (!cfg) { box.replaceChildren(); return; }
    const out = [el('p', 'hint', t('an.help')), check('anOn', 'an.on', cfg.on)];
    const kinds = el('div', 'anKinds');
    KINDS.forEach((k) => kinds.append(check(`anKind_${k}`, `an.kind.${k}`, (cfg.kinds || []).includes(k))));
    out.push(el('div', 'sub', t('an.kinds')), kinds);
    const via = el('select');
    [['whatsapp', 'an.via.whatsapp'], ['ha', 'an.via.ha']].forEach(([v, k]) => via.add(new Option(t(k), v)));
    via.value = cfg.via || 'whatsapp';
    out.push(field('anVia', 'an.via', via));
    const wa = el('div', 'anWa'), phone = el('input'); phone.type = 'tel'; phone.placeholder = '+49 170 1234567'; phone.value = cfg.phone || ''; phone.autocomplete = 'off';
    const key = el('input'); key.type = 'password'; key.autocomplete = 'off'; key.placeholder = cfg.hasKey ? t('an.keySaved') : '123456';
    const steps = el('ol', 'anSteps'), a = el('a', '', 'callmebot.com'); a.href = CALLMEBOT; a.target = '_blank'; a.rel = 'noopener';
    ['an.step1', 'an.step2', 'an.step3'].forEach((k, i) => { const li = el('li', '', `${t(k)} `); if (!i) li.append(a); steps.append(li); });   // how to get the key (#454)
    wa.append(el('div', 'sub', t('an.stepsTitle')), steps, field('anPhone', 'an.phone', phone), field('anKey', 'an.key', key));
    const ha = el('div', 'anHa'), svc = el('input'); svc.placeholder = 'mobile_app_…'; svc.value = cfg.service || ''; svc.setAttribute('list', 'anServices');
    const dl = el('datalist'); dl.id = 'anServices'; services.forEach((s) => dl.append(new Option(s, s)));
    ha.append(field('anService', 'an.service', svc), dl, el('p', 'sub', services.length ? t('an.serviceHint') : t('an.serviceNone')));
    const shown = () => { wa.hidden = via.value !== 'whatsapp'; ha.hidden = via.value !== 'ha'; };
    via.addEventListener('change', shown); shown();
    out.push(wa, ha, check('anClear', 'an.clear', cfg.clear));
    const bar = el('div', 'stopTools'), sv = el('button', '', t('an.save')), ts = el('button', '', t('an.test'));
    sv.type = ts.type = 'button'; sv.id = 'anSave'; ts.id = 'anTest'; sv.disabled = ts.disabled = busy;
    sv.addEventListener('click', () => act(false)); ts.addEventListener('click', () => act(true));
    bar.append(sv, ts);
    out.push(bar, el('p', 'sub anStatus', status));
    box.replaceChildren(...out);
  }
  $('#settingsBtn')?.addEventListener('click', load);         // read again each time the settings open (another screen may have changed it)
  return { load, render, renderPanels };
}
