/* The settings of the page ☀ Heute (#481), in ⚙ → "Reiter unten": the calendars it shows (none ticked: all of them) and the calendar of
 * the waste collection (its dates stand apart). Home Assistant's calendars are asked for once (api/calendars). A part of the settings
 * form (settings.js parts: fill / read). */

/** ctx: $, t */
export function initTodayPrefs(ctx) {
  const { $, t } = ctx;
  const box = $('#setAgendaCals'), sel = $('#setWasteCal');
  let cals = null, cur = { agendaCalendars: [], wasteCalendar: '' }, asking = false;
  async function load() {
    if (cals || asking) return;
    asking = true;
    try { const r = await fetch('api/calendars'); cals = r.ok ? await r.json() : []; } catch { cals = []; }
    if (!Array.isArray(cals)) cals = [];
    asking = false;
    draw();
  }
  function draw() {
    if (!cals) { box.textContent = t('tp.today.loading'); return; }
    if (!cals.length) box.textContent = t('tp.today.noCals');
    else {
      box.replaceChildren(...cals.map((c) => {
        const lab = document.createElement('label'); lab.className = 'lockItem';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.cal = c.entity_id; cb.checked = cur.agendaCalendars.includes(c.entity_id);
        lab.append(cb, document.createTextNode(c.name || c.entity_id)); lab.title = c.entity_id;
        return lab;
      }));
    }
    const ids = cals.map((c) => c.entity_id);
    sel.replaceChildren(new Option(t('tp.today.noWaste'), ''), ...cals.map((c) => new Option(c.name || c.entity_id, c.entity_id)));
    if (cur.wasteCalendar && !ids.includes(cur.wasteCalendar)) sel.add(new Option(cur.wasteCalendar, cur.wasteCalendar));
    sel.value = cur.wasteCalendar;
  }
  return {
    fill(settings) { cur = { agendaCalendars: settings.agendaCalendars || [], wasteCalendar: settings.wasteCalendar || '' }; draw(); load(); },
    /** what is ticked; before Home Assistant's calendars are known nothing changes */
    read(next) {
      if (!cals) return;
      next.agendaCalendars = [...box.querySelectorAll('[data-cal]:checked')].map((x) => x.dataset.cal);
      next.wasteCalendar = sel.value;
    },
  };
}
