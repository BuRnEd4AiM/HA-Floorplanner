/* The page ▶ Abläufe of the tab bar (#483): "Ich gehe" and "Gute Nacht" first (a window shows what is still open or on before they
 * start: "Alles aus" switches lights and players off, then the routine linked to it in ⚙; "Trotzdem" only starts that), then a big
 * button per scene, script or button (a tap starts it, ✓ when Home Assistant took it), and for editors the automations with a switch.
 * The rules are in routines.js (tested); this file draws. */
import { routineButtons, checkRows, checkButtons, offCalls, playingMedia, openLocks, automations, cleanRoutine, routineIcon, hasRoutines, START, CHECKS } from './routines.js';

const CHECK_ICON = { leave: '🚪', night: '🌙' };
const ROW_ICON = { open: '🪟', lights: '💡', media: '📺', locks: '🔓' };

/** ctx: t, el (the page), states(), settings(), names() ({ entity: name }), openNames() (the names of the open windows and doors),
 *  litLights() (the lights on in the house), callService(entity, service, data) (-> true when Home Assistant took it), canEdit() */
export function initRoutinesPage(ctx) {
  const { t, el } = ctx;
  const flash = new Map();                           // button (entity or check) -> 'ok' | 'bad' for a moment after a tap
  let drawn = '', dlg = null, check = null, checkSig = '', busy = false, done = '', autosOpen = false;   // done: 'ok' | 'bad' after the check's buttons
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, on) => { const b = make('button', cls); b.type = 'button'; b.addEventListener('click', on); return b; };
  const domainOf = (e) => e.split('.')[0];
  const linkedOf = (kind) => cleanRoutine(kind === 'leave' ? ctx.settings().routineLeave : ctx.settings().routineNight);
  const nameOf = (e) => ctx.names()[e] || e;

  function mark(key, ok) {
    flash.set(key, ok ? 'ok' : 'bad'); draw(true);
    setTimeout(() => { flash.delete(key); draw(true); }, 2500);
  }
  const start = async (e) => !!(await ctx.callService(e, START[domainOf(e)]));

  /* ---- the check before "Ich gehe" / "Gute Nacht" ---- */
  const now = () => {
    const st = ctx.states(), names = ctx.names();
    return checkRows({ open: ctx.openNames(), lights: ctx.litLights(), media: playingMedia(st, names), locks: openLocks(st, names) });
  };
  function ensureDlg() {
    if (dlg) return;
    dlg = make('dialog', 'rtDlg');
    dlg.addEventListener('close', () => { check = null; checkSig = ''; });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });     // a tap beside the window
    document.body.append(dlg);
  }
  function openCheck(kind) {
    ensureDlg(); check = kind; checkSig = ''; busy = false; done = '';
    drawCheck(); dlg.showModal();
  }
  function drawCheck() {
    if (!dlg || !check) return;
    const rows = now(), linked = linkedOf(check), sig = JSON.stringify([check, rows, linked, done, busy]);
    if (sig === checkSig) return;
    checkSig = sig;
    const head = make('div', 'rtDlgHead');
    head.append(make('span', 'rtIcon', CHECK_ICON[check]), make('h3', '', t(`rt.${check}.ask`)));
    const list = make('div', 'rtRows');
    if (!rows.length) list.append(make('p', 'tdAllOk', `✓ ${t('rt.allOk')}`));
    rows.forEach((r) => {
      const row = make('div', 'rtRow'); row.dataset.row = r.key;
      const what = make('span', 'tdWhat', t(`rt.row.${r.key}`, { n: r.n }));
      if (r.names.length) what.append(make('small', '', r.names.join(', ')));
      row.append(make('span', 'tdIcon', ROW_ICON[r.key]), what, make('span', `tpChip ${r.fix ? 'warn' : 'alert'}`, t(r.fix ? (r.key === 'lights' ? 'rt.goOff' : 'rt.goesOff') : 'rt.stays')));
      list.append(row);
    });
    if (linked) list.append(make('p', 'tpSub rtThen', t('rt.then', { name: nameOf(linked) })));
    const bar = make('div', 'rtDlgBtns');
    if (done) bar.append(make('p', done === 'ok' ? 'tdAllOk' : 'rtBad', done === 'ok' ? `✓ ${t('rt.done')}` : t('rt.failed')));
    else {
      checkButtons(rows, linked).forEach((k) => {
        const b = btn(`rtDlgBtn ${k}${k === 'allOff' || k === 'start' ? ' primary' : ''}`, () => act(k)); b.dataset.act = k; b.disabled = busy;
        b.textContent = k === 'allOff' && linked ? t('rt.btn.allOffThen', { name: nameOf(linked) }) : t(`rt.btn.${k}`);
        bar.append(b);
      });
    }
    dlg.replaceChildren(head, list, bar);
  }
  async function act(k) {
    if (k === 'back' || k === 'ok') { dlg.close(); return; }
    const linked = linkedOf(check);
    busy = true; drawCheck();
    let ok = true;
    if (k === 'allOff') {
      const st = ctx.states();
      const calls = offCalls(ctx.litLights(), playingMedia(st, ctx.names()));
      ok = (await Promise.all(calls.map(([e, s]) => ctx.callService(e, s)))).every(Boolean);
    }
    if (linked) ok = (await start(linked)) && ok;
    busy = false; done = ok ? 'ok' : 'bad';
    const kind = check;
    drawCheck();
    if (ok) setTimeout(() => { if (check === kind) dlg.close(); }, 1500);
  }

  /* ---- the page ---- */
  function tile({ key, icon, name, sub, cls, on }) {
    const b = btn(`rtBtn${cls ? ` ${cls}` : ''}`, on);
    const f = flash.get(key);
    if (f) b.classList.add(f);
    b.append(make('span', 'rtIcon', icon), make('b', 'rtName', name), make('small', 'rtSub', f === 'ok' ? `✓ ${t('rt.started')}` : f === 'bad' ? t('rt.failed') : sub));
    return b;
  }
  function draw(force = false) {
    const st = ctx.states(), names = ctx.names(), s = ctx.settings();
    const buttons = routineButtons(st, names, s.routines, CHECKS.map(linkedOf)), autos = ctx.canEdit() ? automations(st, names) : [];
    const sig = JSON.stringify([buttons, autos, linkedOf('leave'), linkedOf('night'), [...flash], t('tab.routines')]);
    if (!force && sig === drawn) { drawCheck(); return; }
    drawn = sig;
    const head = make('div', 'tpHead');
    head.append(make('h2', '', `▶️ ${t('tab.routines')}`), make('span', 'tpSub', t('rt.sub')));
    const grid = make('div', 'rtGrid');
    CHECKS.forEach((k) => {
      const linked = linkedOf(k), b = tile({ key: k, icon: CHECK_ICON[k], name: t(`rt.${k}`), cls: `rtCheck ${k}`,
        sub: linked ? t('rt.checkThen', { name: nameOf(linked) }) : t('rt.checkOnly'), on: () => openCheck(k) });
      b.dataset.check = k;
      grid.append(b);
    });
    buttons.forEach((r) => {
      const b = tile({ key: r.entity, icon: r.icon || routineIcon(r.name, r.entity), name: r.name, cls: r.running ? 'running' : '',
        sub: r.running ? t('rt.running') : t(`rt.kind.${domainOf(r.entity)}`), on: async () => mark(r.entity, await start(r.entity)) });
      b.dataset.routine = r.entity;
      grid.append(b);
    });
    const out = [head, grid];
    if (!buttons.length) out.push(make('p', 'tpSub', t('rt.none')));
    if (autos.length) {
      const d = make('details', 'tpCard rtAutos'); d.open = autosOpen;
      d.addEventListener('toggle', () => { autosOpen = d.open; });
      d.append(make('summary', 'peH', t('rt.autos', { n: autos.length })), make('p', 'tpSub', t('rt.autosHelp')));
      autos.forEach((a) => {
        const row = make('div', 'rtAuto');
        const sw = make('label', 'sw'); sw.title = t('live.toggle');
        const cb = make('input'); cb.type = 'checkbox'; cb.checked = a.on; cb.dataset.auto = a.entity;
        cb.addEventListener('change', () => ctx.callService(a.entity, cb.checked ? 'turn_on' : 'turn_off'));
        sw.append(cb, make('span'));
        row.append(make('span', 'tdWhat', a.name), sw);
        d.append(row);
      });
      out.push(d);
    }
    el.replaceChildren(...out);
    drawCheck();
  }
  return {
    render: () => draw(true),
    update: () => draw(false),
    has: () => hasRoutines(ctx.states()),
    reset: () => { if (dlg?.open) dlg.close(); drawn = ''; },
  };
}
