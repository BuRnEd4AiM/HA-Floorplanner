/* 🧭 Erste Schritte, the card in the editor (5.25.0, docs/ideen-5.21 picture 2): the four steps with ✅ / ➡ / "danach", the open step with
 * its buttons ("🔗 Alle verbinden", "✨ Alle automatisch setzen", "Einzeln" …), a bar with the percent, "⏭ Überspringen" and "🎬 Video
 * dazu". Opened by the welcome card's three ways and by "⋯ → 🧭 Erste Schritte" (topmore.js); closed it stays closed in this browser.
 * The rules: firststeps.js (tested). */
import { progress, KEY, KEY_LIVE } from './firststeps.js';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* not stored: only for now */ } };

/** ctx: t, host (the element the card goes into), stats() ({ rooms, linked, areas, toLink, unplaced, devices }), show() (editor, plan
 *  loaded, may edit, no welcome card), and the buttons: draw(), example(), linkAll(), linkOne(), placeAll(), placeOne(), goLive(),
 *  settings(), video(), busy() (drawing or placing with a tool: the card shrinks to its head and bar in the corner, out of the way) */
export function initFirstSteps(ctx) {
  const { t } = ctx;
  const box = document.createElement('div'); box.id = 'firstSteps'; box.hidden = true;
  ctx.host.append(box);
  let drawn = '';
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const button = (cls, text, act, on) => { const b = make('button', cls, text); b.type = 'button'; b.dataset.act = act; b.addEventListener('click', () => { on(); update(true); }); return b; };
  const isOpen = () => read(KEY) === 'open';
  const stats = () => ({ ...ctx.stats(), liveSeen: read(KEY_LIVE) === '1' });

  function detail(key, s) {
    const d = make('div', 'fsDetail');
    if (key === 'draw') {
      d.append(make('p', '', t('fs.draw.text')), button('bdBtn primary', `✏️ ${t('fs.draw.btn')}`, 'draw', ctx.draw), button('bdBtn', `🏠 ${t('fs.draw.example')}`, 'example', ctx.example));
    } else if (key === 'link') {
      d.append(make('p', '', t('fs.link.text', { n: s.areas })));
      if (s.toLink) d.append(button('bdBtn primary', `🔗 ${t('fs.link.all', { n: s.toLink })}`, 'linkAll', ctx.linkAll));
      d.append(button('bdBtn', t('fs.one'), 'linkOne', ctx.linkOne));
    } else if (key === 'place') {
      d.append(make('p', '', t('fs.place.text', { n: s.unplaced })));
      if (s.unplaced) d.append(button('bdBtn primary', `✨ ${t('fs.place.all', { n: s.unplaced })}`, 'placeAll', ctx.placeAll), button('bdBtn', t('fs.one'), 'placeOne', ctx.placeOne));
    } else {
      d.append(make('p', '', t('fs.live.text')), button('bdBtn primary', `▶ ${t('fs.live.btn')}`, 'goLive', ctx.goLive), button('bdBtn', `⚙ ${t('fs.live.settings')}`, 'settings', ctx.settings));
    }
    return d;
  }
  function right(key, state, s) {
    if (state === 'later') return t('fs.later');
    if (key === 'link' && s.areas) return t('fs.of', { n: s.linked, of: s.rooms });
    if (key === 'place' && state === 'now') return t('fs.open', { n: s.unplaced });
    return state === 'done' ? t('fs.done') : '';
  }
  function render(s, p) {
    const head = make('div', 'fsHead');
    head.append(make('b', '', `🧭 ${t('fs.title')}`), button('dlgClose', '✕', 'close', close));
    box.replaceChildren(head);
    const mini = !!ctx.busy?.();
    box.classList.toggle('mini', mini);
    if (!mini) box.append(make('p', 'tpSub', p.done ? t('fs.allDone') : t('fs.sub')));
    if (!mini) p.steps.forEach(({ key, state }, i) => {
      const row = make('div', `fsStep ${state}`); row.dataset.step = key;
      const top = make('div', 'fsTop');
      top.append(make('span', 'fsName', `${state === 'done' ? '✅' : state === 'now' ? '➡' : ''} ${i + 1} · ${t(`fs.${key}`)}`.trim()), make('span', 'fsRight', right(key, state, s)));
      row.append(top);
      if (state === 'now') row.append(detail(key, s));
      box.append(row);
    });
    const bar = make('div', 'fsBar'); const fill = make('i'); fill.style.width = `${p.percent}%`; bar.append(fill);
    const foot = make('div', 'fsFoot');
    foot.append(make('span', 'fsPct', `${p.percent} %`), button('linkBtn', p.done ? `✓ ${t('fs.finish')}` : `⏭ ${t('fs.skip')}`, 'skip', close), button('linkBtn', `🎬 ${t('fs.video')}`, 'video', ctx.video));
    box.append(bar, foot);
  }
  function update(force = false) {
    const on = isOpen() && ctx.show();
    box.hidden = !on;
    if (!on) { drawn = ''; return; }
    const s = stats(), p = progress(s);
    const sig = JSON.stringify([s, t('fs.title'), !!ctx.busy?.()]);
    if (!force && sig === drawn) return;
    drawn = sig;
    render(s, p);
  }
  function close() { write(KEY, 'closed'); update(); }
  return {
    update: () => update(),
    /** show the card (⋯ menu, the welcome card's buttons) */
    open: () => { write(KEY, 'open'); update(true); },
    isOpen,
    /** the live view was seen: step 4 is done */
    sawLive: () => write(KEY_LIVE, '1'),
  };
}
