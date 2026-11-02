/* Phones (live view): the tool bar (Edit/Live, 2D/3D, house, version, users, settings) is folded into a ☰ button at the top left.
 * A tap opens it as a drop-down list; a tap on one of its buttons, outside of it or on ✕ closes it again. Whether the button and the
 * folding apply at all is decided in style.css (narrow or very low screens, live view, not in kiosk mode).
 * Phones start with the house (#299): live mode and 3D, no users (body.phoneview, style.css). Since #624 the ☰ menu offers Edit again:
 * editing works on a phone too, with its own layout (style.css, body.phoneview:not(.live)); back in live it is 3D again. */

/** a phone: a touch screen that is narrow (upright) or very low (held sideways); the same sizes as the ☰ rule in style.css.
 *  A narrow desktop window (mouse) is no phone and keeps the editor. */
export function isPhoneScreen({ coarse, w, h }) {
  return !!coarse && (w <= 760 || h <= 520);
}

/** the mode and layout a screen may use: phones in the live mode only 3D; editing (#624) and other screens keep their choice */
export function phoneView(phone, { mode, layoutMode }) {
  return { mode, layoutMode: phone && mode === 'live' ? '3d' : layoutMode };
}

/** ctx: $, onPhone() (the screen has just become a phone: live only 3D) */
export function initPhoneMenu({ $, onPhone }) {
  const bar = $('#toolbar'), btn = document.createElement('button');
  btn.id = 'tbMenuBtn'; btn.type = 'button'; btn.className = 'pill';
  btn.setAttribute('aria-label', 'Menu'); btn.setAttribute('aria-haspopup', 'true');
  $('#stage').append(btn);
  const isOpen = () => document.body.classList.contains('tbopen'), app = bar.parentElement;
  function set(open) {
    // editing on a phone (#624): the bar is a strip in the page; while it hangs down as the list, its place stays free (the picture does not jump)
    const keep = open && !isOpen() && document.body.classList.contains('phoneview') && !document.body.classList.contains('live');
    if (keep) app.style.paddingTop = `${bar.offsetHeight}px`;
    else if (!open) app.style.paddingTop = '';
    document.body.classList.toggle('tbopen', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '✕' : '☰';
  }
  set(false);
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(!isOpen()); });
  bar.addEventListener('click', (e) => { if (isOpen() && e.target.closest('button')) set(false); });   // a choice was made
  bar.addEventListener('change', () => { if (isOpen()) set(false); });                                  // the house list
  document.addEventListener('pointerdown', (e) => { if (isOpen() && !bar.contains(e.target) && !btn.contains(e.target)) set(false); }, true);

  const coarse = window.matchMedia?.('(pointer: coarse)');
  const isPhone = () => isPhoneScreen({ coarse: coarse?.matches, w: innerWidth, h: innerHeight });
  let phone = isPhone();
  document.body.classList.toggle('phoneview', phone);
  addEventListener('resize', () => {                                   // turned, or a tablet window made smaller
    const now = isPhone();
    if (now === phone) return;
    phone = now;
    document.body.classList.toggle('phoneview', phone);
    if (phone) onPhone?.();
  });
  return { close: () => set(false), isPhone: () => phone };
}
