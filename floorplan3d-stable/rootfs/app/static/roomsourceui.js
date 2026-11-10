/* 🌡 The fields "Temperatur von" and "Luftfeuchte von" of a room (#705): automatic (the mean of its sensors, the thermostat only without
 * one), the thermostat, or one of its sensors; each choice shows what it measures right now. A field shows only when more than one thing
 * measures in the room (or a choice is stored). The rules: roomsource.js. */
import { sourceOf, setSource, THERMOSTAT } from './roomsource.js';

const FIELDS = [['temp', 'roomTempFrom', 'src.temp'], ['humid', 'roomHumidFrom', 'src.humid']];

/** ui: { t, field, snapshot(), changed(), choices(mode, chosen) (roomsource.js sourceChoices for this room), nameOf(entity), imperial(),
 *  lang() } */
export function roomSourceFields(body, room, ui) {
  const { t } = ui;
  const num = (v, d) => { try { return v.toLocaleString(ui.lang?.() || 'de', { minimumFractionDigits: d, maximumFractionDigits: d }); } catch { return v.toFixed(d); } };
  const shown = (mode, v) => {                                           // what it measures now, as the house shows it (°F only shown)
    if (typeof v !== 'number') return '–';
    if (mode === 'humid') return `${num(v, 0)} %`;
    return ui.imperial?.() ? `${num((v * 9) / 5 + 32, 1)} °F` : `${num(v, 1)} °C`;
  };
  let any = false;
  FIELDS.forEach(([mode, id, label]) => {
    const chosen = sourceOf(room, mode), c = ui.choices?.(mode, chosen);
    if (!c?.show) return;
    const sel = document.createElement('select'); sel.id = id;
    sel.add(new Option(t('src.auto', { v: shown(mode, c.auto) }), ''));
    if (c.thermo !== null || chosen === THERMOSTAT) sel.add(new Option(t('src.thermo', { v: shown(mode, c.thermo) }), THERMOSTAT));
    c.sensors.forEach(({ id: e, v }) => sel.add(new Option(`${ui.nameOf?.(e) || e} · ${shown(mode, v)}`, e)));
    sel.value = chosen;
    sel.addEventListener('change', () => { ui.snapshot(); setSource(room, mode, sel.value); ui.changed(); });
    body.append(ui.field(t(label), sel));
    any = true;
  });
  if (!any) return;
  const p = document.createElement('p'); p.className = 'sub'; p.id = 'roomSrcHint'; p.textContent = t('src.hint');
  body.append(p);
}
