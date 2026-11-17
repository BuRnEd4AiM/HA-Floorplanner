/* Welcome card on an empty house: three ways to start (draw, example house, import). Shown in edit mode only, until the
 * house has content or the card is closed (remembered in this browser). Never before the plan is loaded (`loaded()`, 5.13.1): while a
 * slow tablet still waited for its plan, the card lay there without text and a touch on it started to draw. */
const KEY = 'fp3d.welcome';
export function isEmptyLayout(layout) {
  return !(layout?.floors || []).some((f) => (f.walls || []).length || (f.rooms || []).length || (f.devices || []).length || (f.blocks || []).length || (f.stairs || []).length);
}
export function initWelcome({ getLayout, isEdit, draw, example, importJson, loaded = () => true }) {
  const box = document.getElementById('welcome');
  if (!box) return { update() {} };
  let closed = false;
  try { closed = localStorage.getItem(KEY) === '1'; } catch { /* no storage: shown again next time */ }
  const close = () => { closed = true; try { localStorage.setItem(KEY, '1'); } catch { /* not stored */ } box.hidden = true; };
  const act = (fn) => async () => { close(); await fn(); };
  document.getElementById('welClose').addEventListener('click', close);
  document.getElementById('welDraw').addEventListener('click', act(draw));
  document.getElementById('welExample').addEventListener('click', act(example));
  document.getElementById('welImport').addEventListener('click', act(importJson));
  return {
    update() { box.hidden = closed || !loaded() || !isEdit() || !isEmptyLayout(getLayout()); },
  };
}
