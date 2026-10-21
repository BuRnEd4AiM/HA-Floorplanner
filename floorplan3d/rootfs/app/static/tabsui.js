/* The tab bar at the bottom of the live view (#479; the rules are in tabs.js, tested): one button per tab, the pages over the 3D picture,
 * and ⛶ full screen where the browser allows it (not inside a frame that forbids it, e.g. Home Assistant's add-on panel). While a page is
 * open the 3D picture rests: app.js draws nothing (covered()), like with the screen off. */
import { TABS, HOME, shownTabs, barShown, startTab, keepTab } from './tabs.js';

/** the page goes full screen or back (the standard way, the older one of Safari / WebViews); false when the browser does not allow it */
const canFull = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFull() {
  const d = document.documentElement;
  if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  else (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d)?.catch?.(() => {});
}

/** ctx: $, t, settings(), isLive(), card (true in the dashboard card without its option "tabs"), me() ({ tabs: { hide, start }, locks }),
 *  pages: { <tab>: { el, render(), update(), has(), reset() } }, onShow(tab) (close what lies over the house, wake the drawing) */
export function initTabsUi(ctx) {
  const { $, t } = ctx;
  const bar = $('#tabBar'), host = $('#tabPages');
  let open = HOME, tabs = [HOME], shown = false, drawn = '';

  function draw() {
    const sig = `${tabs.join()}|${shown}|${canFull()}|${t('tab.house')}`;      // the language too: the names follow a change in ⚙
    if (sig === drawn) { mark(); return; }
    drawn = sig;
    bar.hidden = !shown;
    document.body.classList.toggle('hasTabs', shown);
    bar.replaceChildren(...TABS.filter(([k]) => tabs.includes(k)).map(([k, icon]) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.tab = k;
      const i = document.createElement('span'); i.className = 'ti'; i.textContent = icon;
      b.append(i, document.createTextNode(t(`tab.${k}`)));
      b.addEventListener('click', () => show(k));
      return b;
    }));
    if (canFull()) {
      const f = document.createElement('button'); f.type = 'button'; f.className = 'tbFull'; f.title = t('tab.fullTip');
      f.innerHTML = '<span class="ti">⛶</span>'; f.append(document.createTextNode(t('tab.full')));
      f.addEventListener('click', toggleFull);
      bar.append(f);
    }
    mark();
  }
  const mark = () => bar.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === open));

  /* the guide "Set up a tablet" in ⚙ (group Wall tablet): its card text to the clipboard (marked for copying by hand where that is not allowed) */
  $('#tgCopy')?.addEventListener('click', async (e) => {
    const pre = $('#tgYaml');
    try { await navigator.clipboard.writeText(pre.textContent); e.target.textContent = t('tg.copied'); }
    catch { getSelection()?.selectAllChildren(pre); }
  });

  /** open a tab: the house (the pages go away) or a page over it */
  function show(tab) {
    if (!tabs.includes(tab)) tab = HOME;
    const was = open;
    open = tab;
    host.hidden = tab === HOME;
    Object.entries(ctx.pages).forEach(([k, p]) => { p.el.hidden = k !== tab; if (k !== tab && k === was) p.reset(); });
    if (tab !== HOME) ctx.pages[tab].render();
    mark();
    ctx.onShow(tab, was);
  }
  /** after a change (states, the plan, live / edit, the settings): which tabs, the bar, the open page up to date */
  function update() {
    const me = ctx.me() || {};
    tabs = shownTabs({ has: Object.fromEntries(Object.entries(ctx.pages).map(([k, p]) => [k, p.has()])), hide: me.tabs?.hide || [], locks: me.locks || [] });
    shown = barShown({ live: ctx.isLive(), card: ctx.card, on: ctx.settings().tabBar, tabs });
    draw();
    const next = keepTab(open, tabs, shown);
    if (next !== open) show(next);
    else if (open !== HOME) ctx.pages[open].update();
  }
  return {
    update, show,
    home: () => show(startTab(ctx.me()?.tabs?.start, tabs)),      // the start tab of this user / tablet (start, back when idle)
    covered: () => open !== HOME,
    has: (k) => shown && tabs.includes(k),                        // the bar is there with this tab (the camera pill opens its page)
    open: () => open,
  };
}
