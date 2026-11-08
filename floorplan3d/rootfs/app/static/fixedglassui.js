/* The fields "Feste Scheibe unten" and "Feste Scheibe oben" of a window that opens (#679, markweiffenbach: tall windows from the floor to
 * the ceiling, "the lower part (about 0–1.10 m) is fixed glazing, and only the upper part (about 1.10–2.20 m) opens or tilts"): the height
 * of a fixed glass below / above its panes, in the unit of the house (m or ft); empty or 0 = none. More than fits is cut (the panes keep
 * 30 cm), and both fields then show what is built. The rules: windowpanes.js (pure: fixedGlass, setFixedGlass); walls.js builds it. */
import { fixedGlass, setFixedGlass } from './windowpanes.js';

/** ui: { t, field(label, el), lenInput(get, set, opts) (records an undo step and saves), toDisp(m) }; body: the panel; it: the window */
export function fixedGlassFields(ui, body, it) {
  const { t } = ui;
  const shown = (m) => (m ? String(ui.toDisp(m)) : '');          // none: an empty field, not "0"
  const boxes = [];
  const refresh = () => boxes.forEach(([el, which]) => { el.value = shown(fixedGlass(it)[which]); });
  const make = (key, which, id, label) => {
    const el = ui.lenInput(() => fixedGlass(it)[which], (m) => setFixedGlass(it, key, m), { min: 0 });
    el.id = id; el.placeholder = '—';
    el.addEventListener('change', refresh);                     // after the value is stored: what was cut, in both fields
    boxes.push([el, which]);
    const f = ui.field(t(label), el);
    f.id = `${id}Field`; f.title = t('prop.fixedGlassHint');
    return f;
  };
  const below = make('fixedBelow', 'below', 'fixedBelow', 'prop.fixedBelow');
  const above = make('fixedAbove', 'above', 'fixedAbove', 'prop.fixedAbove');
  refresh();
  const hint = document.createElement('p'); hint.className = 'sub'; hint.id = 'fixedGlassHint'; hint.textContent = t('prop.fixedGlassSub');
  body.append(below, above, hint);
}
