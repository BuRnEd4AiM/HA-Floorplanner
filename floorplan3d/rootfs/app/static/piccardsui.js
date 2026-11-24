/* 🖼 Bildkarten fürs Handy (5.33.0, the owner's choice of docs/ideen-5.33: idea 1 "Bausteine untereinander" with templates, in ▶ Abläufe):
 * the part "🖼 Bildkarten fürs Handy" of the page ▶ Abläufe (who may edit): every card as a small picture with where it is used and
 * "＋ Neue Bildkarte" (a template first, picture 5). The editor (pictures 2 and 3): name, colour, light / dark, tall / wide and where it is
 * used on the left; the building blocks from top to bottom in the middle (⠿ to drag, ▲▼, 🗑, the options of the chosen one under it, "＋"
 * for another); on the right the card as the add-on draws it (api/piccards/preview, with a room of the house as the sample).
 * "📨 Test an mich" sends it through the own Telegram bot. The rules are in piccards.js (tested), the picture in piccard.py.
 * ctx: t, canEdit(), states(), names() ({entity: name}), floors() ([{ id, name }] of the house: a plan's floor to choose), flows() (the routines), notify() (the alarm messages' settings or null),
 *  changed() (the page draws anew) */
import { makePhField } from './phfield.js';
import { KINDS, NO_HALF, ROWS, ICON, COLORS, TEMPLATES, newBlock, fromTemplate, moveBlock, dragBlock, blockSub, usedBy, cleanCard, MAX_CARDS, MAX_BLOCKS } from './piccards.js';

export function initPicCards(ctx) {
  const { t } = ctx;
  let cards = null, loading = null, dlg = null, draft = null, sel = -1, dirty = false, status = '', mode = 'edit', timer = 0, previewSig = '', shown = '';
  const thumbs = new Map();                                       // the JSON of a card → the URL of its picture
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };

  async function load(force = false) {
    if (loading && !force) return loading;
    loading = (async () => {
      try {
        const r = await fetch('api/piccards');
        if (r.ok) cards = (await r.json()).cards || [];
      } catch { /* the part stays empty */ }
      ctx.changed?.();
      return cards;
    })();
    return loading;
  }
  async function saveAll(list) {
    const r = await fetch('api/piccards', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cards: list }) });
    if (!r.ok) throw new Error(String(r.status));
    cards = (await r.json()).cards || [];
    ctx.changed?.();
    return cards;
  }
  /** what a card's sample shows: the alarm it is chosen for, else a routine that sends it (its name, its text), else water */
  function sampleOf(card) {
    const used = usedBy(card.id, ctx.notify?.(), ctx.flows?.());
    if (used.kinds.length) return { kind: used.kinds[0] };
    const f = (ctx.flows?.() || []).find((x) => used.flows.includes(x.name));
    const b = f && (f.lanes || []).flatMap((l) => l.blocks || []).find((x) => x.k === 'notify' && x.card === card.id);
    if (f) return { kind: 'flow', title: f.name, text: b?.text || '' };
    const alarmLook = (card.blocks || []).some((x) => x.k === 'info' && (x.rows || []).some((r) => r === 'sensor' || r === 'since'));   // shows the sensor: as an alarm
    return alarmLook ? { kind: 'water', text: t('pc.sampleText') } : { kind: 'flow', title: card.name, text: t('pc.sampleFlow') };
  }
  /** the card drawn by the add-on: the URL of the picture (kept while the card stays the same) */
  async function picture(card) {
    const body = JSON.stringify({ card, ...sampleOf(card) });
    if (thumbs.has(body)) return thumbs.get(body);
    const r = await fetch('api/piccards/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!r.ok) throw new Error(String(r.status));
    const url = URL.createObjectURL(await r.blob());
    if (thumbs.size > 40) { const [k, v] = thumbs.entries().next().value; URL.revokeObjectURL(v); thumbs.delete(k); }
    thumbs.set(body, url);
    return url;
  }
  const usedWords = (card) => {
    const u = usedBy(card.id, ctx.notify?.(), ctx.flows?.());
    const parts = [];
    if (u.kinds.length) parts.push(t('pc.usedAlarm', { list: u.kinds.map((k) => t(`an.kind.${k}`)).join(', ') }));
    if (u.flows.length) parts.push(u.flows.length === 1 ? t('pc.usedFlow', { name: u.flows[0] }) : t('pc.usedFlows', { n: u.flows.length }));
    return parts.join(' · ') || t('pc.unused');
  };

  /* ---- the part of ▶ Abläufe ---- */
  function partCard() {
    const c = make('div', 'tpCard roCard pcCard');
    const h = make('h3', 'peH roHead', `🖼 ${t('pc.title')}`);
    h.append(make('span', 'pcHeadSub', t('pc.sub')));
    const row = make('div', 'pcList');
    (cards || []).forEach((card) => {
      const tile = btn('pcTile', '', () => open(card.id));
      tile.dataset.card = card.id;
      const img = make('img', 'pcThumb'); img.alt = card.name; img.loading = 'lazy';
      picture(card).then((u) => { img.src = u; }).catch(() => img.classList.add('bad'));
      tile.append(img, make('b', '', card.name), make('small', '', usedWords(card)));
      row.append(tile);
    });
    if ((cards || []).length < MAX_CARDS) {
      const add = btn('pcTile pcNew', '', () => open(null));
      add.dataset.act = 'newCard';
      add.append(make('span', 'pcPlus', '＋'), make('b', '', t('pc.new')), make('small', '', t('pc.newSub')));
      row.append(add);
    }
    c.append(h, row);
    if (ctx.notify?.() && ctx.notify().via !== 'tgbot') c.append(make('p', 'tpSub pcNote', t('pc.notBot')));
    return c;
  }
  const sig = () => JSON.stringify([cards, ctx.canEdit?.(), ctx.notify?.()?.cards, ctx.notify?.()?.via, (ctx.flows?.() || []).map((f) => [f.name, (f.lanes || []).flatMap((l) => (l.blocks || []).filter((b) => b.k === 'notify').map((b) => b.card || ''))]), t('pc.title')]);
  /** the board's part (pageboard.js) for who may edit; the cards are loaded the first time */
  function items() {
    if (!ctx.canEdit?.()) return [];
    if (cards === null) { load(); return []; }
    return [{ key: 'piccards', width: 4, sig: sig(), make: partCard }];
  }

  /* ---- the editor ---- */
  function ensureDlg() {
    if (dlg) return;
    dlg = make('dialog', 'ceDlg pcDlg'); dlg.id = 'picCardDlg';
    dlg.addEventListener('cancel', (e) => { if (!askClose()) e.preventDefault(); });
    document.body.append(dlg);
  }
  function askClose() {
    if (dirty && !confirm(t('pc.discard'))) return false;
    dirty = false;
    return true;
  }
  function close() { if (askClose()) dlg.close(); }
  /** opens a card (id) or, with null, the templates of a new one */
  async function open(id) {
    ensureDlg();
    if (cards === null) await load();
    const card = (cards || []).find((c) => c.id === id);
    mode = card ? 'edit' : 'tpl';
    draft = card ? JSON.parse(JSON.stringify(card)) : null;
    sel = -1; dirty = false; status = ''; previewSig = ''; shown = '';
    draw();
    if (!dlg.open) dlg.showModal();
  }
  function draw() {
    if (mode === 'tpl') { drawTemplates(); return; }
    const head = make('div', 'pcTop');
    const name = make('input', 'pcName'); name.id = 'pcName'; name.value = draft.name; name.maxLength = 40; name.placeholder = t('pc.namePh');
    name.addEventListener('input', () => { draft.name = name.value; dirty = true; preview(); });
    const test = btn('bdBtn', `📨 ${t('pc.test')}`, sendTest); test.id = 'pcTest';
    const save = btn('bdBtn primary', `✓ ${t('pc.save')}`, saveDraft); save.id = 'pcSave';
    head.append(make('span', 'pcTopIcon', '🖼'), name, make('span', 'pcStatus', status), test, save, btn('bdBtn pcClose', '✕', close, t('pc.close')));
    const body = make('div', 'pcBody');
    body.append(drawSide(), drawBlocks(), drawPreview());
    dlg.replaceChildren(head, body);
    preview();
  }
  function chips(options, value, on) {
    const box = make('div', 'pcChips');
    options.forEach(([v, label]) => {
      const b = btn(`tpChip${v === value ? ' on' : ''}`, label, () => on(v));
      b.dataset.v = v; box.append(b);
    });
    return box;
  }
  const head = (text) => make('div', 'pcSect', text);
  function drawSide() {
    const side = make('div', 'pcSide');
    const sw = make('div', 'pcSwatches');
    COLORS.forEach((c) => {
      const b = btn(`pcSwatch${draft.color === c ? ' on' : ''}`, '', () => { draft.color = c; dirty = true; draw(); });
      b.style.background = c; b.dataset.color = c; b.title = c; sw.append(b);
    });
    const own = make('input', 'pcColor'); own.type = 'color'; own.value = draft.color; own.title = t('pc.ownColor');
    own.addEventListener('change', () => { draft.color = own.value; dirty = true; draw(); });
    sw.append(own);
    const u = usedBy(draft.id, ctx.notify?.(), ctx.flows?.());
    const used = make('div', 'pcUsed');
    u.kinds.forEach((k) => used.append(make('div', '', `🚨 ${t(`an.kind.${k}`)}`)));
    u.flows.forEach((n) => used.append(make('div', '', `▶ ${n}`)));
    if (!u.kinds.length && !u.flows.length) used.append(make('div', 'tpSub', t('pc.usedHow')));
    const del = btn('bdBtn pcDel', `🗑 ${t('pc.delete')}`, removeCard); del.id = 'pcDelete';
    side.append(head(t('pc.color')), sw,
      head(t('pc.theme')), chips([['light', `☀ ${t('pc.light')}`], ['dark', `🌙 ${t('pc.dark')}`]], draft.theme, (v) => { draft.theme = v; dirty = true; draw(); }),
      head(t('pc.width')), chips([['tall', `▯ ${t('pc.tall')}`], ['wide', `▭ ${t('pc.wide')}`]], draft.width, (v) => { draft.width = v; dirty = true; draw(); }),
      head(t('pc.usedIn')), used, del);
    return side;
  }
  function drawBlocks() {
    const box = make('div', 'pcBlocks');
    box.append(head(t('pc.blocks')));
    const list = make('div', 'pcRows');
    let dragFrom = -1;
    draft.blocks.forEach((b, i) => {
      const row = make('div', `pcRow${i === sel ? ' on' : ''}${b.half ? ' half' : ''}`); row.dataset.i = i; row.dataset.k = b.k; row.draggable = true;
      row.addEventListener('dragstart', (e) => { dragFrom = i; e.dataTransfer.effectAllowed = 'move'; row.classList.add('drag'); });
      row.addEventListener('dragend', () => row.classList.remove('drag'));
      row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('over'); });
      row.addEventListener('dragleave', () => row.classList.remove('over'));
      row.addEventListener('drop', (e) => { e.preventDefault(); if (dragFrom < 0) return; draft.blocks = dragBlock(draft.blocks, dragFrom, i); sel = -1; dirty = true; draw(); });
      const main = btn('pcRowMain', '', () => { sel = sel === i ? -1 : i; draw(); });
      main.append(make('span', 'pcGrip', '⠿'), make('span', 'pcIcon', ICON[b.k]));
      const tx = make('span', 'pcRowTx');
      tx.append(make('b', '', t(`pc.b.${b.k}`)), make('small', '', blockSub(b, t, ctx.names?.() || {}, ctx.floors?.() || [])));
      main.append(tx);
      const up = btn('pcMini', '▲', () => { draft.blocks = moveBlock(draft.blocks, i, -1); sel = sel === i ? i - 1 : sel; dirty = true; draw(); }, t('pc.up'));
      const down = btn('pcMini', '▼', () => { draft.blocks = moveBlock(draft.blocks, i, 1); sel = sel === i ? i + 1 : sel; dirty = true; draw(); }, t('pc.down'));
      const del = btn('pcMini', '🗑', () => { draft.blocks.splice(i, 1); sel = -1; dirty = true; draw(); }, t('pc.remove'));
      up.disabled = i === 0; down.disabled = i === draft.blocks.length - 1; up.dataset.act = 'up'; down.dataset.act = 'down'; del.dataset.act = 'remove';
      row.append(main, up, down, del);
      list.append(row);
      if (i === sel) list.append(drawOptions(b));
    });
    box.append(list);
    if (draft.blocks.length < MAX_BLOCKS) {
      box.append(head(`＋ ${t('pc.add')}`));
      const add = make('div', 'pcChips pcAdd');
      KINDS.forEach((k) => {
        const b = btn('tpChip', `${ICON[k]} ${t(`pc.b.${k}`)}`, () => { draft.blocks.push(newBlock(k)); sel = draft.blocks.length - 1; dirty = true; draw(); });
        b.dataset.add = k; add.append(b);
      });
      box.append(add);
    }
    box.append(make('p', 'tpSub', t('pc.blocksHelp')));
    return box;
  }
  function drawOptions(b) {
    const o = make('div', 'pcOpts'); o.dataset.k = b.k;
    const set = (fn) => { fn(b); dirty = true; draw(); };
    const check = (label, on, fn, key) => {
      const l = make('label', 'pcCheck'), cb = make('input'); cb.type = 'checkbox'; cb.checked = !!on; if (key) cb.dataset.opt = key;
      cb.addEventListener('change', () => set((x) => fn(x, cb.checked)));
      l.append(cb, make('span', '', label)); return l;
    };
    /** a text with its placeholders as green boxes (phfield.js, 5.34.0): kept as it is typed, without drawing the editor anew */
    const text = (label, value, fn, key) => makePhField({ t, label, value, max: b.k === 'head' ? 60 : 200, key, onInput: (v) => {
      fn(b, v); dirty = true;
      const sub = dlg.querySelector(`.pcRow[data-i="${draft.blocks.indexOf(b)}"] .pcRowTx small`);
      if (sub) sub.textContent = blockSub(b, t, ctx.names?.() || {}, ctx.floors?.() || []);
      preview();
    } }).el;
    switch (b.k) {
      case 'head':
        o.append(text(t('pc.o.text'), b.text, (x, v) => { x.text = v || '{kind}'; }, 'text'),
          check(t('pc.o.clock'), b.clock, (x, v) => { x.clock = v; }, 'clock'));
        break;
      case 'plan': {                                              // which floor: automatic (the sensor's, else the ground floor) or a chosen one
        const s = make('select'); s.dataset.opt = 'floor';
        s.add(new Option(t('pc.o.floorAuto'), ''));
        (ctx.floors?.() || []).forEach((f) => s.add(new Option(f.name || f.id, f.id)));
        if (b.floor && !(ctx.floors?.() || []).some((f) => f.id === b.floor)) s.add(new Option(t('pc.o.floorGone'), b.floor));
        s.value = b.floor || '';
        s.addEventListener('change', () => set((x) => { if (s.value) x.floor = s.value; else delete x.floor; }));
        const l = make('label', 'pcField'); l.append(make('span', '', t('pc.o.floorPick')), s);
        if (b.floor) l.append(make('small', 'tpSub', t('pc.o.floorHelp')));
        o.append(l, chips([['floor', t('pc.o.floor')], ['room', t('pc.o.room')]], b.show, (v) => set((x) => { x.show = v; })),
          check(t('pc.o.marks'), b.marks, (x, v) => { x.marks = v; }, 'marks'));
        break;
      }
      case 'camera': {
        const s = make('select'); s.dataset.opt = 'ent';
        s.add(new Option(t('pc.o.camAuto'), ''));
        const st = ctx.states?.() || {}, names = ctx.names?.() || {};
        Object.keys(st).filter((e) => e.startsWith('camera.')).sort().forEach((e) => s.add(new Option(names[e] || e, e)));
        s.value = b.ent || '';
        s.addEventListener('change', () => set((x) => { x.ent = s.value; }));
        const l = make('label', 'pcField'); l.append(make('span', '', t('pc.o.camera')), s);
        o.append(l);
        break;
      }
      case 'clock': o.append(check(t('pc.o.date'), b.date, (x, v) => { x.date = v; }, 'date')); break;
      case 'info': {
        const box = make('div', 'pcRowsPick');
        ROWS.forEach((r) => box.append(check(t(`pc.r.${r}`), (b.rows || []).includes(r), (x, v) => {
          x.rows = v ? ROWS.filter((k) => k === r || (x.rows || []).includes(k)) : (x.rows || []).filter((k) => k !== r);
        }, `row-${r}`)));
        o.append(make('div', 'pcSect', t('pc.o.rows')), box);
        break;
      }
      case 'values': {
        const list = make('div', 'pcEnts');
        (b.ents || []).forEach((e, i) => {
          const r = make('div', 'pcEnt'); r.append(make('span', '', (ctx.names?.() || {})[e] || e), btn('pcMini', '✕', () => set((x) => { x.ents.splice(i, 1); })));
          list.append(r);
        });
        const inp = make('input'); inp.placeholder = t('pc.o.entPh'); inp.dataset.opt = 'ent';
        const dl = make('datalist'); dl.id = 'pcEntList';
        Object.keys(ctx.states?.() || {}).filter((e) => /^(sensor|binary_sensor|climate|light|switch|cover|lock|person|weather|input_number|input_boolean)\./.test(e)).sort()
          .forEach((e) => { const op = make('option'); op.value = e; op.label = (ctx.names?.() || {})[e] || ''; dl.append(op); });
        inp.setAttribute('list', 'pcEntList');
        const add = btn('bdBtn', '＋', () => { const v = inp.value.trim(); if (/^[a-z_]+\.[a-z0-9_]+$/.test(v) && (b.ents || []).length < 8) set((x) => { x.ents = [...new Set([...(x.ents || []), v])]; }); });
        add.dataset.act = 'addEnt';
        const r = make('div', 'pcAddEnt'); r.append(inp, add, dl);
        o.append(make('div', 'pcSect', t('pc.o.ents')), list, r);
        break;
      }
      case 'text':
        o.append(text(t('pc.o.text'), b.text, (x, v) => { x.text = v; }, 'text'), check(t('pc.o.big'), b.big, (x, v) => { x.big = v; }, 'big'));
        break;
      default: o.append(make('p', 'tpSub', t('pc.o.none')));
    }
    if (!NO_HALF.includes(b.k)) o.append(check(t('pc.o.half'), b.half, (x, v) => { if (v) x.half = true; else delete x.half; }, 'half'));
    return o;
  }
  function drawPreview() {
    const box = make('div', 'pcPrev');
    const img = make('img', 'pcPrevImg'); img.id = 'pcPreview'; img.alt = t('pc.preview');
    if (shown) img.src = shown;                                     // the last picture stays until the new one is drawn
    box.append(head(t('pc.preview')), img, make('p', 'tpSub', t('pc.previewHint')));
    return box;
  }
  /** the picture on the right drawn anew a moment after the last change */
  function preview() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const img = dlg?.querySelector('#pcPreview');
      if (!img || !draft) return;
      const card = cleanCard(draft), s = JSON.stringify(card);
      if (s === previewSig && img.src && img.src === shown) return;
      previewSig = s;
      img.classList.add('busy');
      try { const u = await picture(card); if (previewSig === s) { shown = u; const now = dlg.querySelector('#pcPreview'); if (now) now.src = u; } } catch { img.classList.add('bad'); }
      img.classList.remove('busy');
    }, 350);
  }
  function setStatus(text) { status = text; const s = dlg?.querySelector('.pcStatus'); if (s) s.textContent = text; }
  async function saveDraft() {
    const card = cleanCard(draft);
    if (!card.name) { setStatus(t('pc.needName')); dlg.querySelector('#pcName')?.focus(); return; }
    const list = (cards || []).filter((c) => c.id !== card.id);
    const at = (cards || []).findIndex((c) => c.id === card.id);
    if (at >= 0) list.splice(at, 0, card); else list.push(card);
    try { await saveAll(list); draft = JSON.parse(JSON.stringify(cards.find((c) => c.id === card.id) || card)); dirty = false; setStatus(`✓ ${t('pc.saved')}`); } catch (err) { setStatus(t('pc.failed', { e: err.message })); }
  }
  async function sendTest() {
    setStatus(t('pc.sending'));
    try {
      const r = await fetch('api/piccards/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ card: cleanCard(draft), ...sampleOf(draft) }) });
      const j = await r.json().catch(() => ({}));
      setStatus(r.ok ? t('pc.sent') : j.error === 'notbot' ? t('pc.notBot') : t('pc.failed', { e: j.error || r.status }));
    } catch (err) { setStatus(t('pc.failed', { e: err.message })); }
  }
  async function removeCard() {
    if (!confirm(t('pc.deleteAsk', { name: draft.name }))) return;
    try { await saveAll((cards || []).filter((c) => c.id !== draft.id)); dirty = false; dlg.close(); } catch (err) { setStatus(t('pc.failed', { e: err.message })); }
  }
  function drawTemplates() {
    const head2 = make('div', 'pcTop');
    head2.append(make('span', 'pcTopIcon', '🖼'), make('b', 'pcTplTitle', t('pc.tplTitle')), make('span', 'pcStatus', ''), btn('bdBtn pcClose', '✕', close, t('pc.close')));
    const grid = make('div', 'pcTpls');
    TEMPLATES.forEach((x) => {
      const b = btn('pcTpl', '', () => {
        draft = fromTemplate(x.key, t('pc.newName', { n: (cards || []).length + 1 }), (cards || []).map((c) => c.id));
        mode = 'edit'; dirty = true; sel = -1; draw();
        dlg.querySelector('#pcName')?.select();
      });
      b.dataset.tpl = x.key;
      b.append(make('span', 'pcTplIcon', x.icon), make('b', '', t(`pc.tpl.${x.key}`)), make('small', '', t(`pc.tpl.${x.key}Sub`)));
      grid.append(b);
    });
    dlg.replaceChildren(head2, grid);
  }
  return { items, sig, load, open, list: () => cards || [] };
}
