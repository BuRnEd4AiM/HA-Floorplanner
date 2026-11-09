/* The settings of the page ▶ Abläufe (#483), in ⚙ → "Reiter unten": which scenes, scripts and buttons are big buttons (none ticked:
 * every scene and script) and what "Ich gehe" and "Gute Nacht" start after their check. A part of the settings form (settings.js parts:
 * fill / read); the rules are in routines.js (tested). */
import { canRoutine, cleanRoutines, cleanRoutine } from './routines.js';

/** ctx: $, t, entities() (Home Assistant's entities [{ entity_id, name }]) */
export function initRoutinePrefs(ctx) {
  const { $, t } = ctx;
  const box = $('#setRoutines'), leave = $('#setRoutineLeave'), night = $('#setRoutineNight');
  let cur = { routines: [], routineLeave: '', routineNight: '' };
  const choices = () => ctx.entities().filter((e) => canRoutine(e.entity_id)).map((e) => ({ id: e.entity_id, name: e.name || e.entity_id }))
    .sort((a, b) => a.name.localeCompare(b.name));
  function pick(sel, value, list) {
    sel.replaceChildren(new Option(t('rt.onlyCheck'), ''), ...list.map((c) => new Option(c.name, c.id)));
    if (value && !list.some((c) => c.id === value)) sel.add(new Option(value, value));      // one Home Assistant does not know (any more)
    sel.value = value;
  }
  function draw() {
    const list = choices();
    if (!list.length) box.textContent = t('rt.noneInHa');
    else {
      box.replaceChildren(...list.map((c) => {
        const lab = document.createElement('label'); lab.className = 'lockItem'; lab.title = c.id;
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.routine = c.id; cb.checked = cur.routines.includes(c.id);
        lab.append(cb, document.createTextNode(c.name));
        return lab;
      }));
    }
    pick(leave, cur.routineLeave, list); pick(night, cur.routineNight, list);
  }
  return {
    fill(settings) { cur = { routines: cleanRoutines(settings.routines), routineLeave: cleanRoutine(settings.routineLeave), routineNight: cleanRoutine(settings.routineNight) }; draw(); },
    /** what is ticked: those ticked before keep their place, new ones come at the end; before Home Assistant's entities are known nothing changes */
    read(next) {
      if (!box.querySelector('[data-routine]')) return;               // drawn before Home Assistant's entities were there
      const ticked = [...box.querySelectorAll('[data-routine]:checked')].map((x) => x.dataset.routine);
      next.routines = cleanRoutines([...cur.routines.filter((e) => ticked.includes(e)), ...ticked.filter((e) => !cur.routines.includes(e))]);
      next.routineLeave = cleanRoutine(leave.value);
      next.routineNight = cleanRoutine(night.value);
      cur = { routines: next.routines, routineLeave: next.routineLeave, routineNight: next.routineNight };
    },
  };
}
