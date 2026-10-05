/* Customisable tool bar: every tool can be shown, hidden, moved up or down and folded into a "More" menu.
 * The choice is stored per browser (localStorage), so a tablet and a desktop can look different. */
const KEY = 'fp3d.toolbar';
/** id -> how to find the button; the order here is the default order */
export const TOOLS = [
  ['select', '[data-tool=select]'], ['wall', '[data-tool=wall]'], ['room', '[data-tool=room]'], ['autoRooms', '#autoRooms'],
  ['block', '[data-tool=block]'], ['plot', '[data-tool=plot]'], ['stairs', '[data-tool=stairs]'], ['hole', '[data-tool=hole]'],
  ['opening', '[data-tool=opening]'], ['device', '[data-tool=device]'], ['erase', '[data-tool=erase]'],
  ['power', '#powerEditBtn'], ['cable', '#cableBtn'], ['dormer', '#dormerBtn'], ['import', '#importBtn'],
];
const ALWAYS = new Set(['select']);                       // the selection tool can not be hidden, so the bar never gets empty
const DEFAULT = { order: TOOLS.map(([id]) => id), hidden: [], folded: ['import'] };

export function normalise(raw) {
  const ids = TOOLS.map(([id]) => id);
  const r = raw && typeof raw === 'object' ? raw : {};
  const known = (a) => (Array.isArray(a) ? a.filter((x) => ids.includes(x)) : []);
  const order = known(r.order);
  ids.forEach((id) => { if (!order.includes(id)) order.push(id); });   // a tool added by an update shows up at the end
  const seen = new Set();
  return {
    order: order.filter((id) => !seen.has(id) && seen.add(id)),
    hidden: known(r.hidden).filter((id) => !ALWAYS.has(id)),
    folded: Array.isArray(r.folded) ? known(r.folded) : DEFAULT.folded.slice(),
  };
}
function load() {
  try { return normalise(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return normalise(null); }
}
function save(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* no storage: the choice lasts for this session */ } }

export function initToolbar({ t, applyI18n }) {
  const bar = document.getElementById('tools');
  const moreBtn = document.getElementById('toolsMoreBtn'), more = document.getElementById('toolsMore');
  const dlg = document.getElementById('toolsDialog'), list = document.getElementById('toolsList');
  let cfg = load();
  const btn = (id) => bar.querySelector(TOOLS.find(([k]) => k === id)[1]);

  function apply() {
    let folded = 0;
    cfg.order.forEach((id) => {
      const b = btn(id); if (!b) return;
      const off = cfg.hidden.includes(id);
      b.classList.toggle('tb-off', off);
      if (!off && cfg.folded.includes(id)) { more.append(b); folded++; } else bar.insertBefore(b, moreBtn);   // keeps the order, the More button stays last
    });
    moreBtn.hidden = !folded;
    if (!folded) closeMore();
    markActive();
  }
  function markActive() { moreBtn.classList.toggle('active', !!more.querySelector('button.active')); }
  function closeMore() { more.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); }
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation(); more.hidden = !more.hidden; moreBtn.setAttribute('aria-expanded', String(!more.hidden));
    more.style.left = `${moreBtn.offsetLeft}px`; more.style.top = `${moreBtn.offsetTop + moreBtn.offsetHeight + 6}px`;   // right under the button, also when the bar wraps
  });
  more.addEventListener('click', () => closeMore());      // a click on a folded tool closes the menu
  document.addEventListener('click', (e) => { if (!more.hidden && !more.contains(e.target)) closeMore(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !more.hidden) closeMore(); });
  new MutationObserver(markActive).observe(more, { subtree: true, attributes: true, attributeFilter: ['class'] });

  function renderList() {
    list.replaceChildren(...cfg.order.map((id, i) => {
      const b = btn(id);
      const row = document.createElement('div'); row.className = 'tbRow';
      const name = document.createElement('span'); name.className = 'tbName'; name.textContent = (b?.textContent || id).trim();
      const mk = (label, title, on, disabled = false) => {
        const x = document.createElement('button'); x.type = 'button'; x.textContent = label; x.title = title; x.disabled = disabled;
        x.addEventListener('click', on); return x;
      };
      const show = document.createElement('input'); show.type = 'checkbox'; show.checked = !cfg.hidden.includes(id); show.disabled = ALWAYS.has(id);
      show.title = t('tbar.show'); show.setAttribute('aria-label', `${name.textContent}: ${t('tbar.show')}`);
      show.addEventListener('change', () => { cfg.hidden = show.checked ? cfg.hidden.filter((x) => x !== id) : [...cfg.hidden, id]; commit(); });
      const fold = document.createElement('input'); fold.type = 'checkbox'; fold.checked = cfg.folded.includes(id); fold.disabled = ALWAYS.has(id) || cfg.hidden.includes(id);
      fold.title = t('tbar.fold'); fold.setAttribute('aria-label', `${name.textContent}: ${t('tbar.fold')}`);
      fold.addEventListener('change', () => { cfg.folded = fold.checked ? [...cfg.folded, id] : cfg.folded.filter((x) => x !== id); commit(); });
      const move = (d) => () => { const j = i + d; [cfg.order[i], cfg.order[j]] = [cfg.order[j], cfg.order[i]]; commit(); };
      row.append(show, name, fold, mk('▲', t('tbar.up'), move(-1), i === 0), mk('▼', t('tbar.down'), move(1), i === cfg.order.length - 1));
      return row;
    }));
  }
  function commit() { save(cfg); apply(); renderList(); }

  document.getElementById('toolsEditBtn').addEventListener('click', () => { renderList(); dlg.showModal(); });
  document.getElementById('toolsReset').addEventListener('click', () => { cfg = normalise(null); commit(); });
  apply();
  return { apply, markActive };
}
