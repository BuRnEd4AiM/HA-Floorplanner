/* Phones held upright: the values at the top (power overview, water / gas, offline, open, cameras / movement) fold into one button
 * "📊" next to the floor and the room button, so the top bar is a single row. A tap opens them as a drop-down list; tapping one of
 * them does what it always does (energy overview, offline list, open list, cameras) and closes the list. When something needs
 * attention (open doors, movement, devices offline) the button turns red and shows "⚠️ n".
 * The pills are moved into the list only on phones held upright (same width as in style.css) and put back at their old place
 * otherwise, so desktop, tablets, phones held sideways and the room tablet are unchanged.
 * phoneStatusModel is pure and tested in tests/phonestatus.test.mjs. */

export const STATUS_PILLS = ['energyPill', 'meterPill', 'offlinePill', 'openPill', 'camPill'];
export const PHONE_QUERY = '(max-width: 760px)';

/** what the button shows. pills: [{ hidden, alert }] (alert: the pill is red / warns) */
export function phoneStatusModel(pills) {
  const shown = pills.filter((p) => !p.hidden);
  const alerts = shown.filter((p) => p.alert).length;
  return { show: shown.length > 0, alerts, label: alerts ? `⚠️ ${alerts}` : '📊' };
}

/** ctx: $, closeOthers() (the other drop-downs) */
export function initPhoneStatus(ctx) {
  const { $ } = ctx;
  const pills = STATUS_PILLS.map((id) => $(`#${id}`)).filter(Boolean);
  const homes = pills.map((p) => { const m = document.createComment(p.id); p.before(m); return m; });   // where each pill goes back to
  const btn = document.createElement('button'), menu = document.createElement('div');
  btn.id = 'phoneStatusBtn'; btn.type = 'button'; btn.className = 'pill'; btn.hidden = true; btn.title = 'Status';
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  menu.id = 'phoneStatus'; menu.hidden = true;
  $('#roomPills').after(btn);
  $('#stage').append(menu);
  const mq = window.matchMedia(PHONE_QUERY);
  let folded = false;

  function set(open) { menu.hidden = !open; btn.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); }
  function update() {
    const m = phoneStatusModel(pills.map((p) => ({ hidden: p.hidden, alert: p.classList.contains('alert') || p.classList.contains('warn') })));
    btn.textContent = m.label;
    btn.classList.toggle('alert', m.alerts > 0);
    btn.hidden = !folded || !m.show;
    if (btn.hidden) set(false);
  }
  function place() {
    const fold = mq.matches && !document.body.classList.contains('roomtablet');
    if (fold === folded) return;
    folded = fold;
    if (fold) menu.append(...pills);
    else { pills.forEach((p, i) => homes[i].after(p)); set(false); }
    update();
  }

  btn.addEventListener('click', (e) => { e.stopPropagation(); const open = menu.hidden; if (open) ctx.closeOthers?.(); set(open); });
  menu.addEventListener('click', (e) => { if (e.target.closest('button')) set(false); }, true);   // a choice was made (capture: the camera pill stops its click)
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) set(false); });
  const watch = new MutationObserver(update);
  pills.forEach((p) => watch.observe(p, { attributes: true, attributeFilter: ['hidden', 'class'] }));
  new MutationObserver(place).observe(document.body, { attributes: true, attributeFilter: ['class'] });   // the room tablet is switched on later
  mq.addEventListener?.('change', place);
  place();
  update();
  return { close: () => set(false) };
}
