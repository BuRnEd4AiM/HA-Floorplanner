/* Example pictures only (the owner, 2026-10-29: "eine gruppierung nach räumen in HA das man das direkt sieht ein und aus klappen kann … wenn
 * man viele hat das das nicht so viel auf einmal ist"; his choice: all four lists, in every room it uses, all closed at first): the page
 * ▶ Abläufe of the demo with its lists sorted into the areas of Home Assistant, painted over the real page. make_pictures.py injects it.
 *   mkRg.cards(open)  A: every card keeps its place, the rooms inside it (open: the room opened in each list)
 *   mkRg.rooms(open)  B: one card per room with everything of that room (buttons, own routines, automations, scenes) */
(() => {
  const ICON = [[/wohn/i, '🛋'], [/schlaf/i, '🛏'], [/büro|buero|arbeit/i, '💻'], [/küche|kueche/i, '🍳'], [/bad|wc|toi/i, '🛁'], [/flur|gang|diele/i, '🚪'], [/kind/i, '🧒']];
  const iconOf = (name) => (ICON.find(([re]) => re.test(name)) || [0, '🏠'])[1];
  const NONE = 'Ohne Raum';
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const css = `
    .mkRooms { display: flex; flex-direction: column; gap: 6px; }
    .mkRoom { border: 1px solid var(--line); border-radius: 12px; background: color-mix(in srgb, var(--text) 3%, var(--panel)); }
    .mkRoom > summary { list-style: none; display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; }
    .mkRoom > summary::-webkit-details-marker { display: none; }
    .mkRoom > summary .chev { width: 16px; color: var(--muted); font-weight: 800; transition: transform .15s; }
    .mkRoom[open] > summary .chev { transform: rotate(90deg); }
    .mkRoom > summary .ic { font-size: 20px; }
    .mkRoom > summary b { font-size: 15px; }
    .mkRoom > summary .n { padding: 1px 9px; border-radius: 999px; background: var(--field); color: var(--muted); font-size: 12.5px; font-weight: 700; }
    .mkRoom > summary .pre { color: var(--muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; }
    .mkRoom[open] > summary .pre { visibility: hidden; }
    .mkRoom > .body { display: flex; flex-direction: column; gap: 8px; padding: 0 10px 10px; }
    .mkRoom .mkTiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
    .mkRoom .mkTiles .rtBtn { min-height: 104px; padding: 10px 8px; }
    .mkRoom .mkTiles .rtBtn .rtIcon { font-size: 32px; }
    .mkRoom .mkTiles .rtBtn .rtName { font-size: 16px; }
    .mkRoom .sub { margin: 4px 2px 0; color: var(--muted); font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
    .mkAllBar { display: flex; gap: 8px; align-items: center; }
    .mkAllBar .tpSub { margin-left: auto; }
    .mkWide { grid-column: 1 / -1; }
    .mkNote { position: fixed; right: 18px; top: 64px; z-index: 99; max-width: 380px; padding: 10px 14px; border-radius: 12px; background: #f5c542; color: #1b1300;
      font: 600 14px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.4); }`;

  async function data() {
    const areas = await (await fetch('api/areas')).json();
    const autos = (await (await fetch('api/automations')).json()).rows || [];
    const rules = await (await fetch('api/rules')).json();
    const st = window.__fp.states();
    const areaOf = {};
    areas.forEach((a) => a.entities.forEach((e) => { (areaOf[e] ||= []).push(a.name); }));
    const roomsOf = (own, ents) => {                     // its own area first, else every area of what it uses ("in jedem Raum")
      if (areaOf[own]) return areaOf[own];
      const out = [...new Set(ents.flatMap((e) => areaOf[e] || []))];
      return out.length ? out : [NONE];
    };
    return {
      areas: areas.map((a) => a.name),
      auto: (e) => roomsOf(e, autos.find((x) => x.entity === e)?.uses || []),
      scene: (e) => roomsOf(e, st[e]?.members || []),
      tile: (e) => roomsOf(e, st[e]?.members || []),
      flow: (id) => roomsOf('', (rules.flows || []).find((f) => f.id === id)?.lanes.flatMap((l) => l.blocks.flatMap((b) => b.ents || [])) || []),
    };
  }

  function sortRooms(map) {
    return [...map.keys()].sort((a, b) => (a === NONE) - (b === NONE) || a.localeCompare(b, 'de'));
  }
  function room(name, items, open, what, preview) {
    const d = make('details', 'mkRoom'); d.open = open;
    const s = make('summary');
    s.append(make('span', 'chev', '›'), make('span', 'ic', name === NONE ? '🏠' : iconOf(name)), make('b', '', name), make('span', 'n', `${items.length} ${what}`),
      make('span', 'pre', preview.join(' · ')));
    d.append(s);
    const body = make('div', 'body');
    items.forEach((x) => body.append(x));
    d.append(body);
    return d;
  }
  function allBar(n) {
    const bar = make('div', 'mkAllBar');
    bar.append(make('button', 'tpChip', '▾ Alle aufklappen'), make('button', 'tpChip', '▸ Alle zuklappen'), make('span', 'tpSub', n === 1 ? '1 Raum' : `${n} Räume`));
    return bar;
  }
  function group(rows, roomsFor, nameOf) {
    const map = new Map();
    rows.forEach((r) => roomsFor(r).forEach((k) => { if (!map.has(k)) map.set(k, []); map.get(k).push(r); }));
    return sortRooms(map).map((k) => ({ name: k, rows: map.get(k), names: map.get(k).map(nameOf) }));
  }
  const rowName = (r) => r.querySelector('.roName b, .roTx > b')?.textContent || '';
  const tileName = (b) => b.querySelector('.rtName')?.textContent || '';

  function fit(grid) {                                 // the board is a masonry grid (pageboard.js): every card its rows again
    grid.querySelectorAll(':scope > *').forEach((it) => {
      if (it.classList.contains('mkWide')) it.style.gridColumn = '1 / -1';
      it.style.gridRowEnd = `span ${Math.max(1, Math.ceil((it.getBoundingClientRect().height + 14) / (8 + 14)))}`;
    });
  }
  function note(text) {
    const n = make('div', 'mkNote', text);
    document.body.append(n);
  }

  /* A: every card keeps its place */
  async function cards(open) {
    const d = await data();
    const st = make('style', '', css); document.head.append(st);
    // the big buttons: "Ich gehe" and "Gute Nacht" stay on top, the others by room
    const grid = document.querySelector('.rtGrid');
    const tiles = [...grid.querySelectorAll('.rtBtn[data-routine]')];
    const groups = group(tiles.map((b) => b.cloneNode(true)), (b) => d.tile(b.dataset.routine), tileName);
    const box = make('div', 'tpCard roCard mkWide');
    const h = make('h3', 'peH roHead'); h.append(make('span', '', '▶️ Knöpfe nach Räumen'), make('span', 'tpSub roHint', 'ein Tipp auf den Raum klappt ihn auf'));
    box.append(h, allBar(groups.length));
    const list = make('div', 'mkRooms');
    groups.forEach((g) => { const t = make('div', 'mkTiles'); g.rows.forEach((x) => t.append(x)); list.append(room(g.name, [t], open && g.name === 'Wohnzimmer', g.rows.length === 1 ? 'Knopf' : 'Knöpfe', g.names)); });
    list.querySelectorAll('.mkRoom').forEach((r) => { r.querySelector('.n').textContent = `${r.querySelectorAll('.rtBtn').length} ${r.querySelectorAll('.rtBtn').length === 1 ? 'Knopf' : 'Knöpfe'}`; });
    box.append(list);
    tiles.forEach((b) => (b.closest('.bdItem') || b).remove());
    const firstOther = grid.querySelector('.roOwn')?.closest('.bdItem') || grid.querySelector('.roOwn');
    grid.insertBefore(box, firstOther);
    // the lists inside the cards
    const lists = [
      ['.roOwn', '[data-flow]', (r) => d.flow(r.dataset.flow), 'Ablauf', 'Abläufe'],
      ['.roAutos', 'div[data-auto]', (r) => d.auto(r.dataset.auto), 'Automation', 'Automationen'],
      ['.scCard', '[data-scene]', (r) => d.scene(r.dataset.scene), 'Szene', 'Szenen'],
    ];
    lists.forEach(([card, sel, roomsFor, one, many]) => {
      const c = document.querySelector(card);
      if (!c) return;
      const rows = [...c.querySelectorAll(sel)];
      if (!rows.length) return;
      const gs = group(rows.map((r) => r.cloneNode(true)), roomsFor, rowName);
      const at = rows[0];
      const wrap = make('div', 'mkRooms');
      gs.forEach((g) => wrap.append(room(g.name, g.rows, open && g.name === 'Wohnzimmer', g.rows.length === 1 ? one : many, g.names)));
      at.before(allBar(gs.length), wrap);
      rows.forEach((r) => r.remove());
      c.querySelectorAll('.roMore').forEach((m) => m.remove());
    });
    fit(grid);
    note(open ? 'Beispielbild A: Wohnzimmer in jeder Liste aufgeklappt (ein Tipp auf den Raum)'
      : 'Beispielbild A: jede Liste bleibt, wo sie ist, darin die Räume aus Home Assistant – am Anfang alle zu');
  }

  /* B: one card per room with everything in it */
  async function rooms(open) {
    const d = await data();
    const st = make('style', '', css); document.head.append(st);
    const grid = document.querySelector('.rtGrid');
    const map = new Map();
    const add = (k, kind, el) => { if (!map.has(k)) map.set(k, { tiles: [], flows: [], autos: [], scenes: [] }); map.get(k)[kind].push(el); };
    grid.querySelectorAll('.rtBtn[data-routine]').forEach((b) => d.tile(b.dataset.routine).forEach((k) => add(k, 'tiles', b.cloneNode(true))));
    document.querySelectorAll('.roOwn [data-flow]').forEach((r) => d.flow(r.dataset.flow).forEach((k) => add(k, 'flows', r.cloneNode(true))));
    document.querySelectorAll('.roAutos div[data-auto]').forEach((r) => d.auto(r.dataset.auto).forEach((k) => add(k, 'autos', r.cloneNode(true))));
    document.querySelectorAll('.scCard [data-scene]').forEach((r) => d.scene(r.dataset.scene).forEach((k) => add(k, 'scenes', r.cloneNode(true))));
    const box = make('div', 'tpCard roCard mkWide');
    const h = make('h3', 'peH roHead'); h.append(make('span', '', '🏠 Nach Räumen'), make('span', 'tpSub roHint', 'Knöpfe, eigene Abläufe, Automationen und Szenen eines Raums zusammen'));
    const names = sortRooms(map);
    const adds = make('div', 'roBar');
    adds.append(make('button', 'bdBtn primary', '＋ Neuer Ablauf'), make('button', 'bdBtn', '📋 Aus Vorlage'), make('button', 'bdBtn', '＋ Neue Szene'));
    box.append(h, adds, allBar(names.length));
    const list = make('div', 'mkRooms');
    names.forEach((k) => {
      const g = map.get(k), body = [];
      const count = [];
      if (g.tiles.length) { body.push(make('p', 'sub', '▶️ Knöpfe')); const t = make('div', 'mkTiles'); g.tiles.forEach((x) => t.append(x)); body.push(t); count.push(g.tiles.length === 1 ? '1 Knopf' : `${g.tiles.length} Knöpfe`); }
      if (g.flows.length) { body.push(make('p', 'sub', '🏠 Eigene Abläufe'), ...g.flows); count.push(g.flows.length === 1 ? '1 Ablauf' : `${g.flows.length} Abläufe`); }
      if (g.autos.length) { body.push(make('p', 'sub', '⚙️ Automationen in Home Assistant'), ...g.autos); count.push(g.autos.length === 1 ? '1 Automation' : `${g.autos.length} Automationen`); }
      if (g.scenes.length) { body.push(make('p', 'sub', '🎨 Szenen'), ...g.scenes); count.push(g.scenes.length === 1 ? '1 Szene' : `${g.scenes.length} Szenen`); }
      const r = room(k, body, open && k === 'Wohnzimmer', '', count);
      r.querySelector('.n').remove();
      list.append(r);
    });
    box.append(list);
    grid.querySelectorAll('.rtBtn[data-routine]').forEach((b) => (b.closest('.bdItem') || b).remove());
    ['.roOwn', '.roAutos', '.scCard'].forEach((s) => { const c = document.querySelector(s); if (c) (c.closest('.bdItem') || c).remove(); });
    const log = grid.querySelector('.roLog');
    grid.insertBefore(box, log?.closest('.bdItem') || log);
    fit(grid);
    note(open ? 'Beispielbild B: der Raum „Wohnzimmer“ aufgeklappt – alles aus diesem Raum zusammen'
      : 'Beispielbild B: eine Liste der Räume, in jedem Raum alles zusammen – am Anfang alle zu');
  }

  window.mkRg = { cards, rooms };
})();
