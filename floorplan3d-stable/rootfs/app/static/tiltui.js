/* The field "Kippwinkel (°)" of a window that opens (biggilottecassi in #624: "Kann man die Kippstellung von dem Fenster grafisch noch
 * ein bisschen mehr als Kippstellung anzeigen lassen?"): how far its pane leans into the room in 3D when it is tilted, 5° to 45° (14° when
 * not set, as before), and the button "Für alle Fenster": the same angle for every window of the house. After a change the window leans in
 * for a moment (openings.js preview), also when it is shut, so you see the angle while you set it. The rules: windowtilt.js (pure). */
import { tiltDeg, setTiltDeg, tiltAll, TILT_DEG_MIN, TILT_DEG_MAX } from './windowtilt.js';

/** ui: { t, field(label, el), snapshot(), changed(), preview(id) (lean window id in for a moment), windows() (every door and window of
 *  the house), setStatus(text) }; body: the panel; it: the window */
export function tiltAngleField(ui, body, it) {
  const { t } = ui;
  const inp = document.createElement('input');
  inp.type = 'number'; inp.id = 'tiltDeg'; inp.min = String(TILT_DEG_MIN); inp.max = String(TILT_DEG_MAX); inp.step = '1';
  inp.value = String(tiltDeg(it));
  inp.addEventListener('change', () => {
    ui.snapshot();
    inp.value = String(setTiltDeg(it, inp.value));            // whole degrees, 5 to 45
    ui.changed();
    ui.preview(it.id);
  });
  const all = document.createElement('button');
  all.type = 'button'; all.id = 'tiltDegAll'; all.textContent = t('prop.tiltDegAll'); all.title = t('prop.tiltDegAllHint');
  all.addEventListener('click', () => {
    ui.snapshot();
    const deg = tiltDeg(it), n = tiltAll(ui.windows(), deg);
    ui.changed();
    ui.preview(it.id);
    ui.setStatus(t('prop.tiltDegAllDone', { n, deg }));
  });
  const f = ui.field(t('prop.tiltDeg'), inp);
  f.id = 'tiltDegField'; f.title = t('prop.tiltDegHint');
  const line = document.createElement('div'); line.className = 'prop'; line.append(all);   // under the field, on a line of its own: the number
  body.append(f, line);                                                                    // keeps its width in a narrow panel
}
