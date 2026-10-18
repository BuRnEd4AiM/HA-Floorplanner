/* Settings dialog, part "🚨 Message on alarm" (#414): when the alarm panel goes off or a smoke, gas, carbon monoxide or water sensor
 * reports, the add-on sends a message at once (alarmnotify.py on the server, also with no screen open): by WhatsApp through CallMeBot
 * (phone number + the key CallMeBot sends back), by Telegram through CallMeBot (to users, or into a group with its key, #456) or through
 * notify services of Home Assistant, ticked in the list of the ones it has (also those of configuration.yaml, #456). Only editors see it;
 * the phone number and the keys are kept by the add-on (api/notify), not in the settings every tablet reads. Saved with its own button; "Send a test" saves
 * first. Above it, in the group "Warnings & alarm", which alarm panels Home Assistant has: the add-on has no alarm of its own, the doors
 * and windows that set it off are chosen in the alarm panel (e.g. Alarmo). */
import { alarmPanels } from './alerts.js';

const KINDS = ['alarm', 'smoke', 'gas', 'co', 'water'];
const CALLMEBOT = 'https://www.callmebot.com/blog/free-api-whatsapp-messages/';
const CMB_TG = 'https://www.callmebot.com/blog/telegram-text-messages/';
const CMB_TG_GROUP = 'https://www.callmebot.com/blog/telegram-group-messages-api-easy/';
const SIGNS = [[/^mobile_app_/, '📱'], [/telegram/, '✈️'], [/whatsapp/, '💬'], [/signal/, '🔵'], [/mail|smtp/, '✉️'], [/alexa|echo/, '🔊']];

/** a notify service of Home Assistant with a sign for what it probably is ("📱 mobile_app_pixel", "✈️ telegram_familie") */
export const serviceLabel = (name) => `${(SIGNS.find(([re]) => re.test(name)) || [null, '🔔'])[1]} ${name}`;

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
      cfg = j; services = j.available || []; status = why(j.ready);
    } catch { cfg = null; }
    render();
  }
  /** what the fields say now */
  function read() {
    const v = (id) => box.querySelector(`#${id}`);
    const out = {
      on: v('anOn').checked, clear: v('anClear').checked, via: v('anVia').value,
      kinds: KINDS.filter((k) => v(`anKind_${k}`).checked), phone: v('anPhone').value, tgMode: v('anTgMode').value, tgUsers: v('anTgUsers').value,
      services: [...box.querySelectorAll('[data-svc]:checked')].map((c) => c.dataset.svc).concat(v('anService')?.value.split(/[\s,;|]+/).filter(Boolean) || []),
    };
    const key = v('anKey').value.trim(), tgKey = v('anTgKey').value.trim();
    if (key) out.apikey = key;                                // empty: the stored key stays
    if (tgKey) out.tgkey = tgKey;
    return out;
  }
  /** numbered steps; the link goes after the step at `at` */
  function steps(keys, href, at = 0) {
    const ol = el('ol', 'anSteps');
    keys.forEach((k, i) => {
      const li = el('li', '', `${t(k)} `);
      if (i === at) { const a = el('a', '', new URL(href).hostname.replace(/^www\./, '')); a.href = href; a.target = '_blank'; a.rel = 'noopener'; li.append(a); }
      ol.append(li);
    });
    return [el('div', 'sub', t('an.stepsTitle')), ol];
  }
  const secret = (has) => { const k = el('input'); k.type = 'password'; k.autocomplete = 'off'; k.placeholder = has ? t('an.keySaved') : '123456'; return k; };
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
    [['whatsapp', 'an.via.whatsapp'], ['telegram', 'an.via.telegram'], ['ha', 'an.via.ha']].forEach(([v, k]) => via.add(new Option(t(k), v)));
    via.value = cfg.via || 'whatsapp';
    out.push(field('anVia', 'an.via', via));
    // WhatsApp through CallMeBot: the steps to get the key (#454), the number, the key
    const wa = el('div', 'anWa'), phone = el('input'); phone.type = 'tel'; phone.placeholder = '+49 170 1234567'; phone.value = cfg.phone || ''; phone.autocomplete = 'off';
    wa.append(...steps(['an.step1', 'an.step2', 'an.step3'], CALLMEBOT), field('anPhone', 'an.phone', phone), field('anKey', 'an.key', secret(cfg.hasKey)));
    // Telegram through CallMeBot (#456): to users (they allow CallMeBot once) or into a group (the group's key)
    const tg = el('div', 'anTg'), mode = el('select');
    [['user', 'an.tg.user'], ['group', 'an.tg.group']].forEach(([v, k]) => mode.add(new Option(t(k), v)));
    mode.value = cfg.tgMode === 'group' ? 'group' : 'user';
    const users = el('input'); users.placeholder = '@name, @name2'; users.value = (cfg.tgUsers || []).join(', '); users.autocomplete = 'off';
    const tgUser = el('div', 'anTgUser'), tgGroup = el('div', 'anTgGroup');
    tgUser.append(...steps(['an.tgu.step1', 'an.tgu.step2', 'an.step3'], CMB_TG), field('anTgUsers', 'an.tg.users', users));
    tgGroup.append(...steps(['an.tgg.step1', 'an.tgg.step2', 'an.step3'], CMB_TG_GROUP), field('anTgKey', 'an.tg.key', secret(cfg.hasTgKey)));
    tg.append(field('anTgMode', 'an.tg.mode', mode), tgUser, tgGroup);
    // notify services of Home Assistant: ticked in its list (also those of configuration.yaml, #456); typed only when it lists none
    const ha = el('div', 'anHa'), picked = cfg.services || [];
    const all = [...new Set([...services, ...picked])];
    if (all.length) {
      const list = el('div', 'anSvcs');
      all.forEach((s) => {
        const row = el('label', 'row check'), cb = el('input'); cb.type = 'checkbox'; cb.dataset.svc = s; cb.checked = picked.includes(s);
        row.append(cb, el('span', '', serviceLabel(s))); list.append(row);
      });
      ha.append(el('div', 'sub', t('an.svcPick')), list);
    }
    if (!services.length) { const svc = el('input'); svc.placeholder = 'mobile_app_…'; ha.append(field('anService', 'an.service', svc)); }
    ha.append(el('p', 'sub', services.length ? t('an.serviceHint') : t('an.serviceNone')));
    const shown = () => {
      wa.hidden = via.value !== 'whatsapp'; tg.hidden = via.value !== 'telegram'; ha.hidden = via.value !== 'ha';
      tgUser.hidden = mode.value !== 'user'; tgGroup.hidden = mode.value !== 'group';
    };
    via.addEventListener('change', shown); mode.addEventListener('change', shown); shown();
    out.push(wa, tg, ha, check('anClear', 'an.clear', cfg.clear));
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
