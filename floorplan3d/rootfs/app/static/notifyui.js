/* Settings dialog, part "🚨 Message on alarm" (#414): when the alarm panel goes off or a smoke, gas, carbon monoxide or water sensor
 * reports, the add-on sends a message at once (alarmnotify.py on the server, also with no screen open): by WhatsApp through CallMeBot
 * (phone number + the key CallMeBot sends back), by Telegram through CallMeBot (to users, or into a group with its key, #456) or through
 * notify services and notify entities of Home Assistant, ticked in a list grouped by where they come from (the phone app, set up in
 * Home Assistant's UI such as its own Telegram bot, or the old way in configuration.yaml; #456, #460). Only editors see it;
 * the phone number and the keys are kept by the add-on (api/notify), not in the settings every tablet reads. Saved with its own button; "Send a test" saves
 * first. 📸 Since 5.16.0 also the add-on's own Telegram bot (tgbot.py): text and a picture of the plan with the room in red and of a camera in
 * it (alarmpic.py); "🔎 Chat finden" lists who wrote to the bot. 5.32.1 (the owner: "kann man den Schlüssel des Bots nicht richtig
 * einfügen", "wenn man auf Chat finden drückt, resettet sich die Ansicht"): the part is drawn anew from what is typed, not from what was
 * saved (it jumped back to WhatsApp and the key was gone); the key is a plain field with a check under it, found inside a pasted message,
 * with a 📋 button; Telegram's "no" is said in words; a chat can be typed by hand (when another program reads the bot). 🖼 5.33.0: per kind
 * of alarm a picture card of one's own (piccardsui.js) instead of the plan and the camera ("cards"). Above it, in the group "Warnings & alarm", which alarm panels Home Assistant has: the add-on has no alarm of its own, the doors
 * and windows that set it off are chosen in the alarm panel (e.g. Alarmo). */
import { alarmPanels } from './alerts.js';

const KINDS = ['alarm', 'smoke', 'gas', 'co', 'water'];
const CALLMEBOT = 'https://www.callmebot.com/blog/free-api-whatsapp-messages/';
const CMB_TG = 'https://www.callmebot.com/blog/telegram-text-messages/';
const CMB_TG_GROUP = 'https://www.callmebot.com/blog/telegram-group-messages-api-easy/';
const ADD_TELEGRAM_BOT = 'https://my.home-assistant.io/redirect/config_flow_start/?domain=telegram_bot';
const BOTFATHER = 'https://t.me/BotFather';
const SIGNS = [[/^mobile_app_/, '📱'], [/telegram/, '✈️'], [/whatsapp/, '💬'], [/signal/, '🔵'], [/mail|smtp/, '✉️'], [/alexa|echo/, '🔊']];
const PLATFORMS = { telegram_bot: 'Telegram-Bot', mobile_app: 'Home Assistant App', signal_messenger: 'Signal', smtp: 'E-Mail', ntfy: 'ntfy',
  pushover: 'Pushover', matrix: 'Matrix', discord: 'Discord', slack: 'Slack', whatsapp: 'WhatsApp', alexa_media: 'Alexa', gotify: 'Gotify' };
export const ORIGINS = ['app', 'integration', 'yaml'];

/** a notify service of Home Assistant with a sign for what it probably is ("📱 mobile_app_pixel", "✈️ telegram_familie") */
export const serviceLabel = (name) => `${(SIGNS.find(([re]) => re.test(name)) || [null, '🔔'])[1]} ${name}`;
/** the name of the integration a notify entity belongs to ("Telegram-Bot"), '' when unknown */
export const platformName = (p) => PLATFORMS[p] || (p ? p.replace(/_/g, ' ') : '');
/** what to send through, grouped by where it comes from (#460): [{ origin, items: [{ id, name, origin, platform }] }] in the order of ORIGINS;
 *  ticked ones Home Assistant no longer lists are kept (a notify entity as set up in the UI, a service as configuration.yaml) */
export function targetGroups(available, picked = []) {
  const all = [...(available || [])];
  picked.filter((id) => !all.some((a) => a.id === id))
    .forEach((id) => all.push({ id, name: id, origin: id.startsWith('notify.') ? 'integration' : id.startsWith('mobile_app_') ? 'app' : 'yaml', platform: '' }));
  return ORIGINS.map((origin) => ({ origin, items: all.filter((a) => a.origin === origin) })).filter((g) => g.items.length);
}

const TOKEN_IN = /(?<![0-9A-Za-z_-])([0-9]{5,12}:[A-Za-z0-9_-]{30,64})(?![A-Za-z0-9_-])/g;
/** 📸 the key of a Telegram bot in what was typed or pasted (BotFather's whole message too; invisible marks of the copy dropped), '' when there is
 *  none or more than one (as tgbot.check_token) */
export function findToken(v) {
  const s = String(v ?? '').replace(/[\u00ad\u200b-\u200f\u2028-\u202f\u2060-\u2064\ufeff]/g, '').trim();
  if (/^[0-9]{5,12}:[A-Za-z0-9_-]{30,64}$/.test(s)) return s;
  const m = [...s.matchAll(TOKEN_IN)];
  return m.length === 1 ? m[0][1] : '';
}
/** a chat typed by hand: a number (a group's starts with "-") or "@channel", '' when it is neither (as tgbot.chats_of) */
export function chatId(v) {
  const s = String(v ?? '').trim().replace(/\s+/g, '');
  return /^-?[0-9]{1,20}$/.test(s) || /^@[A-Za-z0-9_]{5,32}$/.test(s) ? s : '';
}

/** ctx: $, t, entities(), cards() (the picture cards, 5.33.0), loadCards() */
export function initNotifyUi(ctx) {
  const { $, t } = ctx;
  const box = $('#alarmNotify'), head = $('#alarmNotifyTitle'), off = $('#alarmNotifyOff'), panelsEl = $('#alarmPanels');
  let cfg = null, services = [], status = '', busy = false, found = null;   // found: the chats that wrote to the bot (📸 5.16.0)
  let over = null;                    // what the fields show instead of the stored settings for the next drawing (a chat just found or typed)
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
    render(true);
    if (cfg && ctx.loadCards && !(ctx.cards?.() || []).length) ctx.loadCards().then(() => render()).catch(() => {});   // 🖼 the cards to choose from
  }
  /** what the fields say now (with `raw`: also what is typed in the key fields, to draw it again) */
  function read(raw) {
    const v = (id) => box.querySelector(`#${id}`);
    const out = {
      on: v('anOn').checked, clear: v('anClear').checked, via: v('anVia').value,
      kinds: KINDS.filter((k) => v(`anKind_${k}`).checked), phone: v('anPhone').value, tgMode: v('anTgMode').value, tgUsers: v('anTgUsers').value,
      services: [...box.querySelectorAll('[data-svc]:checked')].map((c) => c.dataset.svc).concat(v('anService')?.value.split(/[\s,;|]+/).filter(Boolean) || []),
      entities: [...box.querySelectorAll('[data-ent]:checked')].map((c) => c.dataset.ent),
    };
    const key = v('anKey').value.trim(), tgKey = v('anTgKey').value.trim(), bot = v('anBotToken').value.trim();
    if (key) out.apikey = key;                                // empty: the stored key stays
    if (tgKey) out.tgkey = tgKey;
    if (bot) out.bottoken = findToken(bot) || bot;            // 📸 the own Telegram bot (5.16.0); the key inside a pasted message (5.32.1)
    if (raw) out.typed = { anKey: v('anKey').value, anTgKey: v('anTgKey').value, anBotToken: v('anBotToken').value, anChatId: v('anChatId')?.value || '' };
    out.botChats = [...box.querySelectorAll('[data-chat]:checked')].map((c) => ({ id: c.dataset.chat, name: c.dataset.name || '' }));
    out.plan = v('anPlan').checked; out.camera = v('anCamera').checked;
    out.cards = Object.fromEntries([...box.querySelectorAll('[data-card-kind]')].map((s) => [s.dataset.cardKind, s.value]).filter(([, id]) => id));   // 🖼 5.33.0
    return out;
  }
  /** numbered steps, folded in a line that opens (needed once, 5.8.0); the link goes after the step at `at` */
  function steps(keys, href, at = 0, title = 'an.stepsTitle') {
    const ol = el('ol', 'anSteps');
    keys.forEach((k, i) => {
      const li = el('li', '', `${t(k)} `);
      if (i === at) { const a = el('a', '', new URL(href).hostname.replace(/^www\./, '')); a.href = href; a.target = '_blank'; a.rel = 'noopener'; li.append(a); }
      ol.append(li);
    });
    const d = el('details', 'sgGuide anStepsBox');
    d.append(el('summary', '', `📖 ${t(title).replace(/\s*[:：]\s*$/, '')}`), ol);
    return [d];
  }
  const secret = (has, value = '') => { const k = el('input'); k.type = 'password'; k.autocomplete = 'off'; k.placeholder = has ? t('an.keySaved') : '123456'; k.value = value; return k; };
  async function save(body) {
    const r = await fetch('api/notify', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(String(r.status));
    cfg = await r.json();
    return cfg;
  }
  async function act(test) {
    if (busy) return;
    const body = read();
    busy = true; status = t(test ? 'an.sending' : 'an.saving'); render();
    let saved = false;
    try {
      const c = await save(body);
      saved = true;
      if (!test) status = `${t('an.saved')} ${why(c.ready)}`;
      else {
        const r = await fetch('api/notify/test', { method: 'POST' }), j = await r.json().catch(() => ({}));
        status = r.ok ? t('an.sent') : t('an.failed', { e: j.error || r.status });
      }
    } catch (err) { status = t('an.failed', { e: err.message }); }
    busy = false;
    render(saved);                                             // saved: drawn from what is stored now; else what was typed stays
  }
  /** what went wrong with the bot, in words (5.32.1) */
  const botWhy = (e) => (['bottoken', 'unauthorized', 'conflict'].includes(e) ? t(`an.bot.err.${e}`) : t('an.failed', { e }));
  /** 📸 the chats that wrote to the bot: the key typed now (not saved yet) or the saved one. Drawn anew from what is typed (5.32.1: it
   *  jumped back to the stored "Senden über" and the key was gone); when Telegram knows the key it is saved with the chats at once */
  async function findChats() {
    if (busy) return;
    const body = read(), typed = box.querySelector('#anBotToken').value.trim();
    if (typed && !findToken(typed)) { status = t('an.bot.err.badToken'); render(); return; }
    busy = true; status = t('an.bot.finding'); render();
    let saved = false;
    try {
      const r = await fetch('api/notify/tgchats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bottoken: body.bottoken || '' }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        found = j.chats || [];
        const botChats = body.botChats.length ? body.botChats : found.slice(0, 1);   // the first one ticked at once
        await save({ ...body, via: 'tgbot', botChats, botName: j.bot || '' });
        saved = true;
        status = j.error ? `${t('an.bot.ok', { bot: j.bot || '' })} ${botWhy(j.error)}`
          : found.length ? t('an.bot.foundSaved', { bot: j.bot || '', n: found.length }) : t('an.bot.noChat', { bot: j.bot || '' });
      } else status = botWhy(j.error || r.status);
    } catch (err) { status = t('an.failed', { e: err.message }); }
    busy = false;
    render(saved);
  }
  /** 📸 a chat typed by hand (its number, or "@channel"): added to the list, ticked (5.32.1) */
  function addChat() {
    const id = chatId(box.querySelector('#anChatId').value);
    if (!id) { status = t('an.bot.err.chatId'); render(); return; }
    const body = read();
    if (!(found || []).some((c) => c.id === id)) found = [...(found || []), { id, name: '' }];
    if (!body.botChats.some((c) => c.id === id)) body.botChats.push({ id, name: '' });
    over = { botChats: body.botChats };
    status = t('an.bot.chatAdded');
    render();
    box.querySelector('#anChatId').value = '';
  }
  /** 📋 the key from the clipboard (where the browser allows it; else a long tap in the field → "Einfügen") */
  async function pasteKey() {
    const f = box.querySelector('#anBotToken');
    try { f.value = await navigator.clipboard.readText(); } catch { status = t('an.bot.err.paste'); render(); box.querySelector('#anBotToken')?.focus(); return; }
    f.dispatchEvent(new Event('input'));
  }
  /** the part drawn anew. `fresh`: from the stored settings (after loading or saving); else what the fields say now stays (5.32.1), also the
   *  typed keys, which guides are open and where the dialog is scrolled to */
  function render(fresh) {
    if (!box) return;
    if (head) head.hidden = !cfg;
    if (off) off.hidden = !!cfg;                              // who may not edit learns why the part is missing
    box.hidden = !cfg;
    if (!cfg) { box.replaceChildren(); box.dispatchEvent(new CustomEvent('sg-status', { bubbles: true })); return; }
    const now = !fresh && box.querySelector('#anVia') ? read(true) : null;
    const opened = [...box.querySelectorAll('details')].map((d) => d.open);
    let scroller = box.parentElement;
    while (scroller && scroller.scrollHeight <= scroller.clientHeight) scroller = scroller.parentElement;
    const top = scroller?.scrollTop;
    const view = { ...cfg, ...(now || {}), ...(over || {}) };
    over = null;
    box.replaceChildren(...draw(view, now?.typed || {}));
    box.querySelectorAll('details').forEach((d, i) => { if (opened[i]) d.open = true; });
    if (scroller && top != null) scroller.scrollTop = top;
    box.dispatchEvent(new CustomEvent('sg-status', { bubbles: true }));   // the card's head shows the state (setsections.js)
  }
  /** the fields of the part: `cfg` is what they show (the stored settings with what is typed over them), `typed` the typed keys */
  function draw(cfg, typed) {
    const out = [el('p', 'hint', t('an.help')), check('anOn', 'an.on', cfg.on)];
    const kinds = el('div', 'anKinds');
    KINDS.forEach((k) => kinds.append(check(`anKind_${k}`, `an.kind.${k}`, (cfg.kinds || []).includes(k))));
    out.push(el('div', 'sub', t('an.kinds')), kinds);
    const via = el('select');
    [['whatsapp', 'an.via.whatsapp'], ['telegram', 'an.via.telegram'], ['tgbot', 'an.via.tgbot'], ['ha', 'an.via.ha']].forEach(([v, k]) => via.add(new Option(t(k), v)));
    via.value = cfg.via || 'whatsapp';
    out.push(field('anVia', 'an.via', via));
    // WhatsApp through CallMeBot: the steps to get the key (#454), the number, the key
    const wa = el('div', 'anWa'), phone = el('input'); phone.type = 'tel'; phone.placeholder = '+49 170 1234567'; phone.value = cfg.phone || ''; phone.autocomplete = 'off';
    wa.append(...steps(['an.step1', 'an.step2', 'an.step3'], CALLMEBOT), field('anPhone', 'an.phone', phone), field('anKey', 'an.key', secret(cfg.hasKey, typed.anKey)));
    // Telegram through CallMeBot (#456): to users (they allow CallMeBot once) or into a group (the group's key)
    const tg = el('div', 'anTg'), mode = el('select');
    [['user', 'an.tg.user'], ['group', 'an.tg.group']].forEach(([v, k]) => mode.add(new Option(t(k), v)));
    mode.value = cfg.tgMode === 'group' ? 'group' : 'user';
    const users = el('input'); users.placeholder = '@name, @name2'; users.autocomplete = 'off';
    users.value = Array.isArray(cfg.tgUsers) ? cfg.tgUsers.join(', ') : cfg.tgUsers || '';   // drawn from what is typed: the text as it is
    const tgUser = el('div', 'anTgUser'), tgGroup = el('div', 'anTgGroup');
    tgUser.append(...steps(['an.tgu.step1', 'an.tgu.step2', 'an.step3'], CMB_TG, 0, 'an.stepsTitleTg'), field('anTgUsers', 'an.tg.users', users));
    tgGroup.append(...steps(['an.tgg.step1', 'an.tgg.step2', 'an.step3'], CMB_TG_GROUP, 0, 'an.stepsTitleTg'), field('anTgKey', 'an.tg.key', secret(cfg.hasTgKey, typed.anTgKey)));
    tg.append(field('anTgMode', 'an.tg.mode', mode), tgUser, tgGroup);
    // what Home Assistant can send through, grouped by where it comes from (#460): the phone app, set up in its UI (notify entities, e.g.
    // one per chat of its own Telegram bot), the old way in configuration.yaml; typed only when it lists nothing
    const ha = el('div', 'anHa'), picked = [...(cfg.services || []), ...(cfg.entities || [])];
    const groups = targetGroups(services, picked);
    if (groups.length) {
      ha.append(el('div', 'sub', t('an.svcPick')));
      groups.forEach((g) => {
        const list = el('div', `anSvcs anSrc-${g.origin}`);
        list.append(el('div', 'anSrcHead', t(`an.src.${g.origin}`)));
        if (g.origin === 'yaml') list.append(el('p', 'sub', t('an.src.yamlHint')));
        g.items.forEach((s) => {
          const row = el('label', 'row check anTarget'), cb = el('input'); cb.type = 'checkbox'; cb.checked = picked.includes(s.id);
          if (g.origin === 'integration') cb.dataset.ent = s.id; else cb.dataset.svc = s.id;
          const name = el('span', 'n', g.origin === 'integration' ? `${(SIGNS.find(([re]) => re.test(`${s.platform} ${s.id}`)) || [null, '🔔'])[1]} ${s.name}` : serviceLabel(s.name));
          name.append(el('small', '', [g.origin === 'integration' ? s.id : `notify.${s.id}`, platformName(s.platform)].filter(Boolean).join(' · ')));
          row.append(cb, name); list.append(row);
        });
        ha.append(list);
      });
    }
    if (!services.length) { const svc = el('input'); svc.placeholder = 'mobile_app_…'; ha.append(field('anService', 'an.service', svc)); }
    ha.append(el('p', 'sub', services.length ? t('an.serviceHint') : t('an.serviceNone')));
    // your own Telegram bot in Home Assistant (#460): set up in its UI (no YAML any more), then it shows above under "set up in Home Assistant"
    const guide = el('details', 'anGuide sgGuide');
    guide.append(el('summary', '', t('an.tgbot.title')));
    const ol = el('ol', 'anSteps');
    ['an.tgbot.s1', 'an.tgbot.s2', 'an.tgbot.s3', 'an.tgbot.s4'].forEach((k) => ol.append(el('li', '', t(k))));
    const add = el('a', 'anMy', t('an.tgbot.add')); add.href = ADD_TELEGRAM_BOT; add.target = '_blank'; add.rel = 'noopener';
    guide.append(ol, add, el('p', 'sub', t('an.tgbot.note')));
    ha.append(guide);
    // 📸 the own Telegram bot (5.16.0): text and pictures straight from the add-on; made once with @BotFather, the chat found by itself
    // the key: a plain field (a pasted key can be seen; 5.32.1), the key found inside a pasted message, a line under it says whether it is one
    const bot = el('div', 'anBot'), tok = el('input', 'anTok'); tok.type = 'text'; tok.autocomplete = 'off'; tok.spellcheck = false; tok.setAttribute('autocapitalize', 'off');
    tok.setAttribute('autocorrect', 'off'); tok.placeholder = cfg.hasBot ? t('an.keySaved') : '123456789:AA…'; tok.value = typed.anBotToken || '';
    const tokCheck = el('p', 'sub anTokCheck');
    const checkTok = () => {
      const raw = tok.value.trim(), k = findToken(raw);
      if (k && k !== raw) tok.value = k;                      // BotFather's whole message pasted: only the key stays
      tokCheck.textContent = !raw ? (cfg.hasBot ? `${t('an.bot.saved')}${cfg.botName ? ` (${cfg.botName})` : ''}` : '') : k ? t('an.bot.looksOk') : t('an.bot.err.badToken');
      tokCheck.classList.toggle('bad', !!raw && !k);
    };
    tok.addEventListener('input', checkTok); checkTok();
    const tokRow = el('div', 'anTokRow'); tokRow.append(tok);
    if (navigator.clipboard?.readText) {
      const paste = el('button', '', `📋 ${t('an.bot.paste')}`); paste.type = 'button'; paste.id = 'anBotPaste'; paste.addEventListener('click', pasteKey);
      tokRow.append(paste);
    }
    const tokField = el('div', 'prop stack'), tokLabel = el('label', '', t('an.bot.token')); tok.id = tokLabel.htmlFor = 'anBotToken';
    tokField.append(tokLabel, tokRow);
    bot.append(el('p', 'sub', t('an.bot.help')), ...steps(['an.bot.s1', 'an.bot.s2', 'an.bot.s3', 'an.bot.s4', 'an.bot.s5'], BOTFATHER, 0, 'an.stepsTitleTg'),
      tokField, tokCheck);
    const find = el('button', '', `🔎 ${t('an.bot.find')}`); find.type = 'button'; find.id = 'anBotFind'; find.disabled = busy;
    find.addEventListener('click', findChats);
    bot.append(find);
    const chats = [...(cfg.botChats || [])];
    (found || []).forEach((c) => { if (!chats.some((x) => x.id === c.id)) chats.push(c); });
    if (chats.length) {
      const list = el('div', 'anSvcs anChats');
      list.append(el('div', 'anSrcHead', t('an.bot.chats')));
      chats.forEach((c) => {
        const row = el('label', 'row check anTarget'), cb = el('input'); cb.type = 'checkbox';
        cb.checked = (cfg.botChats || []).some((x) => x.id === c.id); cb.dataset.chat = c.id; cb.dataset.name = c.name || '';
        const name = el('span', 'n', `✈️ ${c.name || c.id}`); name.append(el('small', '', c.id));
        row.append(cb, name); list.append(row);
      });
      bot.append(list);
    }
    // a chat by hand (5.32.1): when "Chat finden" cannot read the bot (Home Assistant's Telegram integration uses the same bot)
    const byHand = el('details', 'sgGuide anChatHand'), cid = el('input'); cid.id = 'anChatId'; cid.inputMode = 'text'; cid.autocomplete = 'off';
    cid.placeholder = '123456789'; cid.value = typed.anChatId || '';
    const addBtn = el('button', '', `＋ ${t('an.bot.chatAdd')}`); addBtn.type = 'button'; addBtn.id = 'anChatAdd'; addBtn.addEventListener('click', addChat);
    cid.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addChat(); } });
    const handRow = el('div', 'anTokRow'); handRow.append(cid, addBtn);
    byHand.append(el('summary', '', `✍️ ${t('an.bot.byHand')}`), el('p', 'sub', t('an.bot.byHandHelp')), handRow);
    bot.append(byHand, check('anPlan', 'an.bot.plan', cfg.plan !== false), check('anCamera', 'an.bot.camera', cfg.camera !== false));
    // 🖼 a picture card of one's own per kind of alarm (5.33.0): instead of the plan and the camera above
    const cards = ctx.cards?.() || [], perKind = el('div', 'anCards');
    perKind.append(el('div', 'anSrcHead', `🖼 ${t('an.cards')}`));
    KINDS.forEach((k) => {
      const row = el('label', 'anCardRow'), s = el('select'); s.dataset.cardKind = k;
      s.add(new Option(t('an.cardStd'), ''));
      cards.forEach((c) => s.add(new Option(c.name, c.id)));
      const id = (cfg.cards || {})[k] || '';
      if (id && !cards.some((c) => c.id === id)) s.add(new Option(id, id));
      s.value = id;
      row.append(el('span', '', t(`an.kind.${k}`)), s);
      perKind.append(row);
    });
    perKind.append(el('p', 'sub', t('an.cardsHint')));
    bot.append(perKind);
    const shown = () => {
      wa.hidden = via.value !== 'whatsapp'; tg.hidden = via.value !== 'telegram'; ha.hidden = via.value !== 'ha'; bot.hidden = via.value !== 'tgbot';
      tgUser.hidden = mode.value !== 'user'; tgGroup.hidden = mode.value !== 'group';
    };
    via.addEventListener('change', shown); mode.addEventListener('change', shown); shown();
    out.push(wa, tg, bot, ha, check('anClear', 'an.clear', cfg.clear));
    const bar = el('div', 'stopTools'), sv = el('button', '', t('an.save')), ts = el('button', '', t('an.test'));
    sv.type = ts.type = 'button'; sv.id = 'anSave'; ts.id = 'anTest'; sv.disabled = ts.disabled = busy;
    sv.addEventListener('click', () => act(false)); ts.addEventListener('click', () => act(true));
    bar.append(sv, ts);
    out.push(bar, el('p', 'sub anStatus', status));
    return out;
  }
  $('#settingsBtn')?.addEventListener('click', load);         // read again each time the settings open (another screen may have changed it)
  return { load, render, renderPanels, cfg: () => cfg };
}
