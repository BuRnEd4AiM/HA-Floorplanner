/* Phones (live view): the tool bar (Edit/Live, 2D/3D, house, version, users, settings) is folded into a ☰ button at the top left.
 * A tap opens it as a drop-down list; a tap on one of its buttons, outside of it or on ✕ closes it again. Whether the button and the
 * folding apply at all is decided in style.css (narrow or very low screens, live view, not in kiosk mode). */

/** ctx: $ */
export function initPhoneMenu({ $ }) {
  const bar = $('#toolbar'), btn = document.createElement('button');
  btn.id = 'tbMenuBtn'; btn.type = 'button'; btn.className = 'pill';
  btn.setAttribute('aria-label', 'Menu'); btn.setAttribute('aria-haspopup', 'true');
  $('#stage').append(btn);
  const isOpen = () => document.body.classList.contains('tbopen');
  function set(open) {
    document.body.classList.toggle('tbopen', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '✕' : '☰';
  }
  set(false);
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(!isOpen()); });
  bar.addEventListener('click', (e) => { if (isOpen() && e.target.closest('button')) set(false); });   // a choice was made
  bar.addEventListener('change', () => { if (isOpen()) set(false); });                                  // the house list
  document.addEventListener('pointerdown', (e) => { if (isOpen() && !bar.contains(e.target) && !btn.contains(e.target)) set(false); }, true);
  return { close: () => set(false) };
}
