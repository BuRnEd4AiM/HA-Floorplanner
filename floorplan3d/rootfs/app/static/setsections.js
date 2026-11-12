/* Settings dialog in parts (5.8.0, the owner's choice from docs/ideen-5.8, ideas ② and ③): "Reiter unten" gets a button per page above its
 * settings (☀ Heute, ⚡ Energie, ▶ Abläufe …) and shows only the page chosen (remembered per browser); "Warnungen & Alarm" is three cards
 * that fold (warnings in the picture, the holiday alarm, the message to the phone), each with its state in the head ("An", "Unscharf",
 * "Aus") and the most important in one line. A search shows every page (setgroups.js opens the cards it finds something in). The states
 * are pure (warnState, guardState, notifyState; tests/setsections.test.mjs). */

const PAGE_KEY = 'fp3d.setPage';

/** the page to show: the remembered one while it is there, else the first */
export const pickPage = (stored, ids) => (ids.includes(stored) ? stored : ids[0] ?? null);
/** a page's button from its heading: "🎵 Musik & TV: Radiosender" -> "🎵 Musik & TV" */
export const pageLabel = (heading) => String(heading ?? '').replace(/\s*[:：].*$/, '').trim();

/** card "Warnungen": { badge } from the setting */
export const warnState = (alerts) => ({ badge: alerts ? 'on' : 'off' });
/** card "Urlaubs-Alarm" from what guardui.js knows (api/guard): null when the add-on said nothing yet; { edit: false } for who may not
 *  set it up; else { edit, badge, sensors, code, delay } with badge alarm (going off), armed (armed or arming), notReady (a sensor or the
 *  code is missing) or off */
export function guardState(info) {
  if (!info) return null;
  if (!info.cfg) return { edit: false, badge: '' };
  const phase = info.view?.phase || 'off';
  const badge = phase === 'entry' || phase === 'alarm' ? 'alarm' : phase === 'arming' || phase === 'armed' ? 'armed' : info.ready ? 'notReady' : 'off';
  return { edit: true, badge, sensors: (info.cfg.sensors || []).length, code: !!info.cfg.hasCode, delay: Number(info.cfg.delay) || 0 };
}
/** card "Nachricht aufs Handy" from what notifyui.js knows (api/notify): null for who may not set it up; else { badge, via, missing } with
 *  badge on (it sends), off (switched off) or notReady (switched on, something missing: missing says what, an.ready.<missing>) */
export function notifyState(cfg) {
  if (!cfg) return null;
  const r = cfg.ready || '';
  return { badge: !r ? 'on' : r === 'off' ? 'off' : 'notReady', via: cfg.via || 'whatsapp', missing: r && r !== 'off' ? r : '' };
}
/** a badge's look: green, grey, orange or red */
export const BADGE_CLASS = { on: 'on', off: 'off', notReady: 'warn', armed: 'on', alarm: 'alarm', disarmed: 'off' };

/** ctx: $, t, guard() (guardui.js: what api/guard said), notify() (notifyui.js: what api/notify said) */
export function initSetSections(ctx) {
  const { $, t } = ctx;
  const dlg = $('#settingsDialog');
  if (!dlg) return { update() {}, showPage() {} };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  /* ---- "Reiter unten": a button per page ---- */
  const tabsBody = dlg.querySelector('details[data-group=tabs] .sgBody');
  const pages = () => [...(tabsBody?.querySelectorAll(':scope > .sgPage') || [])];
  const bar = el('div', 'sgPages'); bar.setAttribute('role', 'tablist');
  if (pages().length) pages()[0].before(bar);
  let current = null;
  const stored = () => { try { return localStorage.getItem(PAGE_KEY); } catch { return null; } };
  function drawBar() {
    bar.replaceChildren(...pages().map((p) => {
      const b = el('button', 'sgPageBtn', pageLabel(p.querySelector('h4')?.textContent)); b.type = 'button'; b.dataset.page = p.dataset.page;
      b.setAttribute('role', 'tab');
      return b;
    }));
    showPage(pickPage(current ?? stored(), pages().map((p) => p.dataset.page)), false);
  }
  /** show this page of "Reiter unten" (remember: chosen by a tap) */
  function showPage(id, keep = true) {
    if (!id) return;
    current = id;
    if (keep) { try { localStorage.setItem(PAGE_KEY, id); } catch { /* not kept */ } }
    pages().forEach((p) => { p.hidden = p.dataset.page !== id; });
    bar.querySelectorAll('button').forEach((b) => { const on = b.dataset.page === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    dlg.dispatchEvent(new CustomEvent('sg-page', { detail: id }));    // setcontrols.js measures the long explanations of the page now shown
  }
  bar.addEventListener('click', (e) => { const b = e.target.closest('button[data-page]'); if (b) showPage(b.dataset.page); });
  dlg.addEventListener('sg-reveal', (e) => { const p = e.target.closest?.('.sgPage'); if (p) showPage(p.dataset.page, false); });   // a link or a test goes to a field of a page

  /* ---- "Warnungen & Alarm": the state of each card ---- */
  const card = (name) => dlg.querySelector(`details.sgCard[data-card=${name}]`);
  function head(name, sub, badge) {
    const c = card(name); if (!c) return;
    if (sub != null) c.querySelector('.sgCardSub').textContent = sub;
    const b = c.querySelector('.sgBadge');
    b.className = `sgBadge ${BADGE_CLASS[badge] || ''}`.trim();
    b.textContent = badge ? t(`sg.badge.${badge}`) : '';
  }
  function update() {
    head('warn', t('sg.card.warnSub'), warnState($('#setAlerts')?.checked).badge);
    const g = guardState(ctx.guard?.());
    if (!g) head('guard', t('sg.card.guardSub'), '');
    else if (!g.edit) head('guard', t('gd.onlyEditors'), '');
    else head('guard', t('sg.card.guardState', { n: g.sensors, code: t(g.code ? 'sg.card.codeYes' : 'sg.card.codeNo'), s: g.delay }), g.badge === 'off' ? 'disarmed' : g.badge);
    const n = notifyState(ctx.notify?.());
    if (!n) head('notify', t('sg.alarm.notifyOff'), '');
    else head('notify', [t(`an.via.${n.via}`), n.missing && t(`an.ready.${n.missing}`)].filter(Boolean).join(' · '), n.badge);
  }
  dlg.addEventListener('change', update);
  dlg.addEventListener('sg-status', update);                         // guardui.js, notifyui.js: drawn anew after loading or saving
  $('#settingsBtn')?.addEventListener('click', () => { drawBar(); update(); });
  drawBar(); update();
  return { update, showPage };
}
