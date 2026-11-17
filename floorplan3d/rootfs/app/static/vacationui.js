/* 🏠 Urlaubs-Licht in the settings of the holiday alarm (5.18.0, the owner's choice 2026-11-17, docs/ideen-5.15 picture 7): a switch, the
 * lamps and the roller shutters it may switch, and tonight's plan as bars (17:00 … 02:30) with how many evenings each lamp was learned
 * from. The add-on runs it while the holiday alarm is armed (vacation.py); it is saved with the holiday alarm's "Speichern" (api/rules
 * {vac}). The bars and times are pure (unit test: tests/vacation.test.mjs). */

export const JITTERS = [15, 30, 45, 60, 90];              // the "Spielraum" in minutes (vacation.py JITTERS)
export const WINDOW = [300, 870];                         // the evening drawn: 17:00 … 02:30 in evening minutes (since 12:00)
/** an evening minute as a time of day: 390 → "18:30" */
export const clock = (m) => { const x = ((m + 720) % 1440 + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
/** a stretch [a, b] as left / width in % of the evening drawn */
export function bar([a, b]) {
  const w = WINDOW[1] - WINDOW[0], l = Math.max(0, Math.min(1, (a - WINDOW[0]) / w)), r = Math.max(0, Math.min(1, (b - WINDOW[0]) / w));
  return { left: +(l * 100).toFixed(2), width: +((r - l) * 100).toFixed(2) };
}
/** the lamps (lights and switches) and the shutters to choose from: [{ entity, name }] by name, the chosen ones kept even when Home
 *  Assistant does not list them now */
export const NOT_SHUTTERS = ['garage', 'gate', 'door', 'damper'];   // a garage door, a gate, a door: never offered (vacation.py skips them too) …
const NOT_NAMES = /garag|gate|(tor|t[uü]e?r|door)($|[\s_.-])/i;   // … also when it does not say so: a word ending in tor, tür, door
export const shutterOk = (e) => !NOT_SHUTTERS.includes(e.dc) && !NOT_NAMES.test(`${e.entity_id} ${e.name || ''}`);
export function vacChoices(entities, doms, chosen = []) {
  const items = (entities || []).filter((e) => doms.includes(String(e.entity_id).split('.')[0]) && !(e.entity_id.startsWith('cover.') && !shutterOk(e)))
    .map((e) => ({ entity: e.entity_id, name: e.name || e.entity_id }));
  chosen.filter((e) => !items.some((i) => i.entity === e)).forEach((e) => items.push({ entity: e, name: e }));
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

/** ctx: t, rules() (rulesstore.js), entities() */
export function initVacationUi(ctx) {
  const { t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const cfg = () => ctx.rules()?.get()?.vac || { on: false, lights: [], covers: [] };
  const names = () => new Map((ctx.entities() || []).map((e) => [e.entity_id, e.name || e.entity_id]));

  function planBox() {
    const st = ctx.rules()?.get()?.status?.vac || {}, c = cfg();
    const box = el('div', 'vacPlan'); box.dataset.vac = 'plan';
    if (!c.on) return box;
    box.append(el('div', 'sub', st.armed ? `▶ ${t('vac.running')}` : t('vac.waiting')));
    if (!st.plan || !Object.keys(st.plan).length) { box.append(el('p', 'sub', t('vac.noPlan'))); return box; }
    box.append(el('div', 'vacH', t('vac.tonight')));
    const nm = names();
    Object.entries(st.plan).forEach(([e, spans]) => {
      const row = el('div', 'vacRow'); row.dataset.light = e;
      const lab = el('span', 'vacName', nm.get(e) || e), n = st.learned?.[e] || 0;
      lab.append(el('small', '', n ? t('vac.learned', { n }) : t('vac.plain')));
      const track = el('div', 'vacTrack');
      spans.forEach((s) => { const b = bar(s), i = el('i', ''); i.style.left = `${b.left}%`; i.style.width = `${b.width}%`; i.title = `${clock(s[0])} – ${clock(s[1])}`; track.append(i); });
      row.append(lab, track);
      box.append(row);
    });
    const ax = el('div', 'vacAxis'); ['17', '19', '21', '23', '01 Uhr'].forEach((x) => ax.append(el('span', '', x)));
    box.append(ax);
    return box;
  }

  return {
    /** the elements of the part; pickGroup and checkRow are the holiday alarm's own (guardui.js) */
    part(pickGroup, checkRow) {
      const c = cfg();
      const out = [el('h4', 'vacTitle', `🏠 ${t('vac.title')}`), el('p', 'hint', t('vac.help')), checkRow('vacOn', 'vac.on', c.on)];
      out.push(pickGroup(t('vac.lights'), vacChoices(ctx.entities(), ['light', 'switch'], c.lights), c.lights, 'data-vac-light', c.on && !c.lights.length || c.lights.length > 0));
      out.push(pickGroup(t('vac.covers'), vacChoices(ctx.entities(), ['cover'], c.covers), c.covers, 'data-vac-cover', c.covers.length > 0));
      const jit = document.createElement('select'); jit.id = 'vacJitter';                 // the "Spielraum" (the owner: "dass es nicht immer zu genau der selben Zeit passiert")
      JITTERS.forEach((m) => jit.add(new Option(t('vac.jitterN', { n: m }), String(m))));
      jit.value = String(c.jitter || 30);
      const jr = el('div', 'row'), jl = el('label', '', t('vac.jitter')); jl.htmlFor = 'vacJitter'; jr.append(jl, jit);
      out.push(jr, el('p', 'sub', t('vac.jitterHelp')));
      out.push(el('p', 'sub', `🤝 ${t('vac.calm')}`), planBox());
      return out;
    },
    /** what the fields say now */
    read(box) {
      return { on: !!box.querySelector('#vacOn')?.checked, lights: [...box.querySelectorAll('[data-vac-light]:checked')].map((x) => x.getAttribute('data-vac-light')),
        covers: [...box.querySelectorAll('[data-vac-cover]:checked')].map((x) => x.getAttribute('data-vac-cover')),
        jitter: Number(box.querySelector('#vacJitter')?.value) || 30 };
    },
    save: (v) => ctx.rules()?.save({ vac: v }),
  };
}
