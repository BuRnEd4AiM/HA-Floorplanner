/* Home Assistant's own more-info dialog (history, logbook, attributes, settings) for an entity.
   In the sidebar the add-on runs in an Ingress iframe on Home Assistant's own origin, so the HA frontend
   (<home-assistant>) in a parent frame can be asked to open it, exactly like a tap on a dashboard card does.
   Opened as a page of its own (direct port, demo file, other origin) there is no HA frontend: the button is not shown. */

function haRoot(win) {
  let w = win;
  for (let i = 0; i < 6 && w.parent && w.parent !== w; i++) {
    w = w.parent;
    try {
      const el = w.document.querySelector('home-assistant');
      if (el) return { el, w };
    } catch { return null; }                                    // a frame of another origin: not inside Home Assistant
  }
  return null;
}

/** true when the page runs inside the Home Assistant frontend and can open its dialogs */
export const canMoreInfo = (win = window) => !!haRoot(win);

/** open Home Assistant's more-info dialog for the entity; false when that is not possible */
export function openMoreInfo(entityId, win = window) {
  const root = entityId && haRoot(win);
  if (!root) return false;
  root.el.dispatchEvent(new root.w.CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
  return true;
}
