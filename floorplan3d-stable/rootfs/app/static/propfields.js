/* Input fields of the side panel: a labelled row, an input that records an undo step and saves on change, a length field that shows the
 * current unit (m or ft) but stores metres, and a stacked row for the entity picker. Used by the properties panel and many other panels. */

/** ctx: snapshot(), changed(), toDisp(m), fromDisp(v), imperial() */
export function initPropFields(ctx) {
  function field(label, input) {
    const w = document.createElement('div');
    w.className = 'prop';
    const l = document.createElement('label'); l.textContent = label;
    w.append(l, input);
    return w;
  }
  function inp(type, value, onInput, attrs = {}) {
    const i = document.createElement('input');
    i.type = type; i.value = value; Object.assign(i, attrs);
    i.addEventListener('change', () => { ctx.snapshot(); onInput(i.value); ctx.changed(); });
    return i;
  }
  /** number field for a length stored in meters, shown in the current unit system */
  function lenInput(getM, setM, { min = 0, step = 0.05 } = {}) {
    return inp('number', ctx.toDisp(getM()), (v) => setM(Math.max(min, ctx.fromDisp(+v) || 0)), { step: ctx.imperial() ? step * 3 : step });
  }
  const pickerField = (label, picker) => { const w = field(label, picker); w.classList.add('stack'); return w; };
  return { field, inp, lenInput, pickerField };
}
