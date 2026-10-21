/* The tab bar at the bottom of the live view (#479; the rules are in tabs.js, tested): one button per tab, the pages over the 3D picture,
 * and ⛶ full screen where the browser allows it (fullscreenui.js: also a full screen kept on for a user, only the code ends it, #487).
 * While a page is open the 3D picture rests: app.js draws nothing (covered()), like with the screen off. Since 4.6 (#484) the tabs come
 * in the order an admin chose, with his own pages; ✎ (editors, on a page) starts the page's edit mode (pageboard.js), in the bar's own
 * edit mode (tabedit.js) the tabs are dragged and "＋ Seite" makes a new page. */
import { HOME, shownTabs, barShown, startTab, keepTab, barTabs } from './tabs.js';

/** ctx: $, t, settings(), isLive(), card (true in the dashboard card without its option "tabs"), me() ({ tabs: { hide, start }, locks }),
 *  pages() ({ <tab>: { el, render(), update(), has(), reset() } }, own pages too), onShow(tab) (close what lies over the house, wake the
 *  drawing), edit ({ can() (editors), editing() (the page in the edit mode), toggle(tab) }), tabEdit ({ on(), newPage() }),
 *  full (fullscreenui.js: { can(), isFull(), state(), click() }) */
export function initTabsUi(ctx) {
  const { $, t } = ctx;
  const bar = $('#tabBar'), host = $('#tabPages');
  let open = HOME, tabs = [HOME], shown = false, drawn = '';
  const pages = () => ctx.pages();
  const order = () => barTabs(ctx.settings().customTabs, ctx.settings().tabOrder);
  const nameOf = (x) => x.name || t(`tab.${x.key}`);

  function draw() {
    const all = order().filter((x) => tabs.includes(x.key)), editor = !!ctx.edit?.can(), moving = !!ctx.tabEdit?.on();
    const full = ctx.full, fs = full?.can() ? [full.isFull(), full.state()] : null;
    const sig = JSON.stringify([all, shown, fs, editor, moving, t('tab.house')]);      // the language too: the names follow a change in ⚙
    if (sig === drawn) { mark(); return; }
    drawn = sig;
    bar.hidden = !shown;
    document.body.classList.toggle('hasTabs', shown);
    bar.replaceChildren(...all.map((x) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = x.key;
      const i = document.createElement('span'); i.className = 'ti'; i.textContent = x.icon;
      b.append(i, document.createTextNode(nameOf(x)));
      b.addEventListener('click', () => { if (!ctx.tabEdit?.on()) show(x.key); });
      return b;
    }));
    if (moving) {
      const n = document.createElement('button'); n.type = 'button'; n.className = 'tbNew'; n.dataset.act = 'newPage';
      n.innerHTML = '<span class="ti">＋</span>'; n.append(document.createTextNode(t('te.newShort')));
      n.addEventListener('click', () => ctx.tabEdit.newPage());
      bar.append(n);
    }
    const right = document.createElement('span'); right.className = 'tbRight';
    if (editor && !moving) {
      const e = document.createElement('button'); e.type = 'button'; e.className = 'tbEdit'; e.title = t('bd.editTip');
      e.innerHTML = '<span class="ti">✎</span>'; e.append(document.createTextNode(t('bd.edit')));
      e.addEventListener('click', () => ctx.edit.toggle(open));
      right.append(e);
    }
    if (fs && !moving) {                                           // in full screen: "Vollbild beenden", kept for this user: 🔒 and the code (#487)
      const [on, st] = fs, kept = st === 'on';
      const f = document.createElement('button'); f.type = 'button'; f.className = `tbFull${kept ? ' kept' : ''}`; f.title = t(kept ? 'fs.tip' : 'tab.fullTip');
      f.innerHTML = `<span class="ti">${kept ? '🔒' : '⛶'}</span>`; f.append(document.createTextNode(t(on ? 'tab.fullEnd' : 'tab.full')));
      f.addEventListener('click', () => full.click());
      right.append(f);
    }
    if (right.childElementCount) bar.append(right);
    mark();
  }
  const mark = () => {
    bar.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === open));
    const e = bar.querySelector('.tbEdit');
    if (e) { e.hidden = open === HOME; e.classList.toggle('active', ctx.edit.editing() === open); }
  };

  /* the guide "Set up a tablet" in ⚙ (group Wall tablet): its card text to the clipboard (marked for copying by hand where that is not allowed) */
  $('#tgCopy')?.addEventListener('click', async (e) => {
    const pre = $('#tgYaml');
    try { await navigator.clipboard.writeText(pre.textContent); e.target.textContent = t('tg.copied'); }
    catch { getSelection()?.selectAllChildren(pre); }
  });

  /** open a tab: the house (the pages go away) or a page over it */
  function show(tab) {
    if (!tabs.includes(tab)) tab = HOME;
    const was = open, ps = pages();
    open = tab;
    host.hidden = tab === HOME;
    Object.entries(ps).forEach(([k, p]) => { p.el.hidden = k !== tab; if (k !== tab && k === was) p.reset(); });
    if (was !== tab && ctx.edit?.editing() && ctx.edit.editing() !== tab) ctx.edit.toggle(ctx.edit.editing());   // leaving a page ends its edit mode
    if (tab !== HOME) ps[tab].render();
    mark();
    ctx.onShow(tab, was);
  }
  /** after a change (states, the plan, live / edit, the settings): which tabs, the bar, the open page up to date */
  function update() {
    const me = ctx.me() || {}, ps = pages();
    tabs = shownTabs({ has: Object.fromEntries(Object.entries(ps).map(([k, p]) => [k, p.has()])), hide: me.tabs?.hide || [], locks: me.locks || [],
      keys: order().map((x) => x.key) });
    shown = barShown({ live: ctx.isLive(), card: ctx.card, on: ctx.settings().tabBar, tabs });
    draw();
    const next = keepTab(open, tabs, shown);
    if (next !== open) show(next);
    else if (open !== HOME) { ps[open].update(); ctx.edit?.refresh(open); }   // the page, then its own cards (#484)
  }
  return {
    update, show,
    redraw: () => { drawn = ''; update(); },                     // the bar again (own pages, their order, the edit modes)
    home: () => show(startTab(ctx.me()?.tabs?.start, tabs)),      // the start tab of this user / tablet (start, back when idle)
    covered: () => open !== HOME,
    has: (k) => shown && tabs.includes(k),                        // the bar is there with this tab (the camera pill opens its page)
    open: () => open,
    tabs: () => order().filter((x) => tabs.includes(x.key)),      // the tabs of the bar now, in their order
    render: (k) => { if (open === k && k !== HOME) pages()[k]?.render(); },
  };
}
