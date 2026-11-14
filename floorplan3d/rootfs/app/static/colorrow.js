/* A colour to choose in the properties panel (the roof #752, the stairs #753, doors and windows #754): a colour field for any colour and
 * under it a row of the usual ones to tap (brick red, anthracite, slate … for a roof; stainless steel, black, oak … for a hand rail); the
 * one chosen is marked, "↺" goes back to the colour as always. The same look as the colours of the floor patterns (finishui.js). */

/** the elements of one colour: [the row with its label and colour field (and ↺ when one is set), the colours to tap]. o: { id (the colour
 *  field gets id + 'Color', the row of colours id + 'Swatches', ↺ id + 'Reset'), label, value (the colour stored, or '' / undefined),
 *  def (the colour without one), list ([[key, '#rrggbb'], …]), name(key) (its name, shown when pointing at it), reset (the text of ↺),
 *  on(hex or null: the colour as always) } */
export function colorFields(o) {
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const cur = (o.value || o.def).toLowerCase();
  const pick = (hex) => o.on(hex.toLowerCase() === o.def.toLowerCase() ? null : hex.toLowerCase());
  const row = el('div', 'prop colorRow'), lab = el('label');
  lab.textContent = o.label;
  const ci = el('input'); ci.type = 'color'; ci.id = `${o.id}Color`; ci.value = cur;
  ci.addEventListener('change', () => pick(ci.value));
  lab.htmlFor = ci.id;
  row.append(lab, ci);
  if (o.value) {
    const back = el('button', 'linkBtn colorBack'); back.type = 'button'; back.id = `${o.id}Reset`; back.textContent = '↺'; back.title = o.reset || '';
    back.addEventListener('click', () => o.on(null));
    row.append(back);
  }
  const sw = el('div', 'swatches'); sw.id = `${o.id}Swatches`;
  o.list.forEach(([key, hex]) => {
    const b = el('button', hex === cur ? 'sw on' : 'sw'); b.type = 'button'; b.style.background = hex; b.dataset.color = hex; b.dataset.key = key;
    b.title = o.name ? o.name(key) : hex;
    b.setAttribute('aria-label', b.title);
    b.addEventListener('click', () => pick(hex));
    sw.append(b);
  });
  return [row, sw];
}
