/* ⏸️ Heizplan aussetzen (the owner, 2026-11-08; pictures docs/ideen-4.71/): the button under − / + of every thermostat (🌡 Klima and the
 * own card "Thermostat", thermostatui.js). Held down (HOLD_MS, a tap does nothing) it opens the choice of how long (30 / 45 minutes, an
 * hour, until the next block, for today … as an admin offers); while paused it says until when, with "▶ Heizplan fortsetzen" and
 * "＋15 Min". Meanwhile the add-on leaves the thermostats of the room alone (heatrules.py). Who gets it: the card 📋 Heiz-Regeln →
 * "⏸️ Heizplan aussetzen" (on, the choices, what counts anyway), the lock "heatPause" per user (userlocks.js) and the switch of an own
 * card (cards.js "pause"). The choices and texts: heatpause.js (pure, tested). */
import { pauseChoices, optText, canPause, pauseState, untilText, PAUSE_OPTS, DEFAULT_OPTS, HOLD_MS, MORE_MIN } from './heatpause.js';

/** ctx: t, rules (rulesstore.js), roomOf(entity) (the room key <house>/<room> of a thermostat, null in no room), roomName(key),
 *  locks() (a Set: what this user may not use), states(), canEdit(), changed() (draw the pages again) */
export function initHeatPause(ctx) {
  const { t } = ctx;
  let holding = null, dlg = null, asked = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const heat = () => { const d = ctx.rules.get(); if (!d && !asked) { asked = true; ctx.rules.load(); } return d?.heat || null; };
  const heater = (e) => e.startsWith('climate.') && !(ctx.states()[e]?.modes || []).includes('cool');   // an air conditioner: only the window rule
  const allowed = (e, card) => canPause(heat(), { heater: heater(e), locks: [...(ctx.locks() || [])], card });

  /** a big button: icon, title, a line below */
  function face(cls, icon, title, sub) {
    const b = make('button', `hpPause ${cls}`); b.type = 'button';
    const tx = make('span', 'hpTx'); tx.append(make('b', '', title), make('small', '', sub));
    b.append(make('span', 'hpIc', icon), tx);
    return b;
  }

  /** held down: the bar fills, after HOLD_MS the choice opens; let go before: only the hint */
  function holdable(b, key) {
    const stop = (hint) => {
      if (!holding) return;
      clearTimeout(holding.timer);
      holding = null;
      b.classList.remove('hold');
      if (hint) { b.classList.add('hint'); setTimeout(() => b.classList.remove('hint'), 1600); }
    };
    b.addEventListener('pointerdown', (ev) => {
      if (ev.button > 0) return;
      ev.stopPropagation();
      b.setPointerCapture?.(ev.pointerId);
      b.classList.remove('hint');
      b.classList.add('hold');
      holding = { timer: setTimeout(() => { holding = null; b.classList.remove('hold'); open(key); }, HOLD_MS) };
    });
    b.addEventListener('pointerup', () => stop(true));
    b.addEventListener('pointercancel', () => stop(false));
    b.addEventListener('lostpointercapture', () => stop(false));
    b.addEventListener('contextmenu', (ev) => ev.preventDefault());           // a long press on a phone: no menu of the browser
    b.addEventListener('click', (ev) => ev.stopPropagation());
    b.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(key); } });   // the keyboard: at once
  }

  /** the choice of how long, in a window over the page */
  function open(key) {
    const h = heat();
    const choices = pauseChoices(h, key, new Date());
    if (!choices.length) return;
    dlg?.remove();
    dlg = make('dialog', 'hpDlg ceDlg');
    dlg.dataset.room = key;
    const box = make('div', 'hpBox');
    box.append(make('h3', '', `⏸️ ${t('hp.title')} · ${ctx.roomName(key)}`), make('p', 'tpSub', t('hp.how')));
    const list = make('div', 'hpOpts');
    choices.forEach((c) => {
      const b = make('button', 'hpOpt'); b.type = 'button'; b.dataset.opt = c.k;
      b.append(make('b', '', `${c.k === 'block' ? '📅' : c.k === 'day' ? '🌙' : '⏱'} ${optText(c.k, t)}`), make('small', '', t('hp.until', { at: untilText(c.until, t) })));
      b.addEventListener('click', async () => { close(); await ctx.rules.room(key, 'pause', { for: c.k }); ctx.changed(); });
      list.append(b);
    });
    const foot = make('div', 'hpFoot');
    const notes = [];
    if (h.pause.window) notes.push(`🪟 ${t('hp.note.window')}`);
    if (h.pause.warm) notes.push(`🔥 ${t('hp.note.warm')}`);
    if (h.pause.levels) notes.push(`🚶 ${t('hp.note.levels')}`);
    foot.append(make('small', 'tpSub', notes.join(' · ')));
    const cancel = make('button', 'bdBtn', t('hp.cancel')); cancel.type = 'button'; cancel.addEventListener('click', close);
    foot.append(cancel);
    box.append(list, foot);
    dlg.append(box);
    dlg.addEventListener('click', (ev) => { if (ev.target === dlg) close(); });   // a tap beside the window
    dlg.addEventListener('close', () => { dlg?.remove(); dlg = null; ctx.changed(); });
    document.body.append(dlg);
    try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
  }
  function close() { if (!dlg) return; try { dlg.close(); } catch { /* not open */ } dlg?.remove(); dlg = null; }

  /** the button of a thermostat (null: no pause for it here); opts: card (an own card: its switch "pause") */
  function button(e, { card = null } = {}) {
    const key = ctx.roomOf(e);
    if (!key || !allowed(e, card)) return null;
    const st = pauseState(ctx.rules.status(key));
    const box = make('div', 'hpPauseBar'); box.dataset.room = key;   // not "hpBar": that is a day of 📅 Heizplan (5.9.1)
    if (st.on) {
      const b = face('on', '▶', t('hp.resume'), t('hp.pausedUntil', { at: untilText(st.until, t) }));
      b.dataset.act = 'resume';
      b.addEventListener('click', async (ev) => { ev.stopPropagation(); await ctx.rules.room(key, 'resume'); ctx.changed(); });
      const more = make('button', 'tpChip hpMore', `＋${t('fl.min', { n: MORE_MIN })}`); more.type = 'button'; more.dataset.act = 'more';
      more.addEventListener('click', async (ev) => { ev.stopPropagation(); await ctx.rules.room(key, 'more'); ctx.changed(); });
      box.append(b, more);
    } else {
      const b = face('', '⏸️', t('hp.title'), t('hp.hold'));
      b.dataset.act = 'pause';
      holdable(b, key);
      box.append(b);
    }
    return box;
  }

  /** what the button depends on (the card is drawn again when it changes) */
  const sig = (e) => { const k = ctx.roomOf(e), h = heat(); return JSON.stringify([h?.pause, k, k ? ctx.rules.status(k)?.pause : null, h?.schedule?.on, [...(ctx.locks() || [])].join()]); };

  /** 📋 Heiz-Regeln → the card "⏸️ Heizplan aussetzen": on, the choices offered, what counts anyway during a pause.
   *  ui: card(rule, heat, body, extra), change(fn), toggle(on, set, data), kv(label, el) of heatrulesui.js */
  function card(h, { card: makeCard, change, toggle, kv }) {
    const p = h.pause || { on: false, opts: DEFAULT_OPTS, window: true, warm: false, levels: false };
    const opts = new Set(p.opts?.length ? p.opts : DEFAULT_OPTS);
    const chips = make('div', 'hrRooms hpChoose');
    PAUSE_OPTS.forEach((k) => {
      const b = make('button', `tpChip${opts.has(k) ? ' on' : ''}`, optText(k, t)); b.type = 'button'; b.dataset.opt = k; b.disabled = !ctx.canEdit();
      b.addEventListener('click', () => change((x) => {
        const cur = new Set(x.pause?.opts?.length ? x.pause.opts : DEFAULT_OPTS);
        if (cur.has(k) && cur.size > 1) cur.delete(k); else cur.add(k);
        x.pause = { ...p, ...x.pause, opts: PAUSE_OPTS.filter((o) => cur.has(o)) };
      }));
      chips.append(b);
    });
    const set = (field) => (v) => change((x) => { x.pause = { ...p, ...x.pause, [field]: v }; });
    const d = make('div', '');
    d.append(make('p', 'tpSub hrInner', t('hp.rule.how')), make('small', 'tpSub', t('hp.rule.opts')), chips);
    return makeCard('pause', { ...h, pause: p }, [
      kv(`🪟 ${t('hp.rule.window')}`, toggle(p.window, set('window'), 'pause.window')),
      kv(`🔥 ${t('hp.rule.warm')}`, toggle(p.warm, set('warm'), 'pause.warm')),
      kv(`🚶 ${t('hp.rule.levels')}`, toggle(p.levels, set('levels'), 'pause.levels')),
      kv(t('hr.window.after'), make('b', '', t('hp.rule.after')))], d);
  }

  return { button, sig, card, busy: () => holding !== null || !!dlg, open };
}
