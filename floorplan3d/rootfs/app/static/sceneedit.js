/* The scene editor (#549, the owner: "dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann
 * wirkliche … Szenen in Home Assistant"): a name, the devices of the scene (lights and LED strips first, switches, roller shutters), each
 * on or off, its brightness, a colour (swatches and a colour picker), a white tone, an effect of the light's own list (WLED, Nanoleaf …),
 * a roller shutter's position. "📸 Wie jetzt übernehmen" takes every device as it is now, "▶ Ausprobieren" shows the scene at once without
 * saving it (scene.apply), "✓ Speichern" writes it as a real scene of Home Assistant (api/scenes, only the dashboard's own scenes fp3d_…
 * are written straight; one of Home Assistant's is changed in place (#564: what the editor cannot show stays as it was, the add-on keeps
 * the old version) or saved as a copy ("📋 Als Kopie"). #564 also: "⇉ Auf alle anwenden" on every device (its settings for all the others,
 * "↶ Rückgängig"), the white tone as a slider in Kelvin (kelvinui.js), the picker by kind with "＋ Alle hinzufügen". The model and its words
 * come from scenes.js (tested). */
import { SWATCHES, WHITES, KINDS, MAX_ENTS, hex, fromHex, kelvinRgb, fromStates, deviceNow, deviceWords, sceneReady, pickable, applyToAll, allTargets } from './scenes.js';
import { lightRange } from './kelvin.js';
import { kelvinSlider } from './kelvinui.js';

/** ctx: t, entities() ([{ entity_id, name }]), states(), nameOf(entity), canEdit(), locked(), saved() (a scene was saved or deleted:
 *  draw the cards again), manage (hamanage.js: deleting with "↶ Wiederherstellen") */
export function initSceneEdit(ctx) {
  const { t } = ctx;
  let dlg = null, draft = null, cid = null, theirs = false, kept = 0, dirty = false, flash = '', search = '', kind = 'all', busy = false, undo = null;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const change = (fn) => { undo = null; fn(); dirty = true; draw(); };
  /** a change of many devices at once that "↶ Rückgängig" can take back */
  const many = (fn) => { const before = structuredClone(draft.ents); change(fn); undo = before; draw(); };
  const say = (text) => { flash = text; draw(); setTimeout(() => { if (flash === text) { flash = ''; draw(); } }, 3000); };
  async function send(method, url, body) {
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, ...j };
    } catch { return { ok: false, error: '…' }; }
  }

  /* ---- one device ---- */
  function device(e) {
    const x = draft.ents[e], dom = e.split('.')[0], st = ctx.states()[e] || {};
    const row = make('div', `scDev${x.on ? '' : ' off'}`); row.dataset.dev = e;
    const head = make('div', 'scDevH');
    const sw = make('span', 'scDot'); sw.style.background = x.on && dom === 'light' ? hex(x.kelvin ? kelvinRgb(x.kelvin) : x.rgb || [255, 214, 140]) : '';
    head.append(sw, make('b', '', ctx.nameOf(e) || e), make('small', 'tpSub', deviceWords(e, x, t)));
    const rm = btn('roIcon scRm', '✕', () => change(() => { delete draft.ents[e]; }), t('sc.remove')); rm.dataset.act = 'scRemove';
    head.append(rm);
    row.append(head);
    const body = make('div', 'scDevB');
    if (dom === 'cover') {
      const r = make('input'); r.type = 'range'; r.min = 0; r.max = 100; r.step = 5; r.value = x.pos ?? (x.on ? 100 : 0); r.dataset.field = 'pos';
      r.addEventListener('input', () => { x.pos = +r.value; x.on = x.pos > 0; dirty = true; head.querySelector('small').textContent = deviceWords(e, x, t); });
      r.addEventListener('change', draw);
      body.append(make('label', '', t('sc.pos')), r);
    } else {
      const onoff = make('div', 'feChips'); onoff.dataset.field = 'on';
      [[true, t('sc.on')], [false, t('sc.off')]].forEach(([v, w]) => { const b = btn(`tpChip${x.on === v ? ' on' : ''}`, w, () => change(() => { x.on = v; if (!v) { delete x.pct; delete x.rgb; delete x.kelvin; delete x.fx; } })); b.dataset.value = String(v); onoff.append(b); });
      body.append(onoff);
    }
    if (dom === 'light' && x.on) {
      const r = make('input'); r.type = 'range'; r.min = 1; r.max = 100; r.value = x.pct ?? 100; r.dataset.field = 'pct';
      r.addEventListener('input', () => { x.pct = +r.value; dirty = true; head.querySelector('small').textContent = deviceWords(e, x, t); });
      r.addEventListener('change', draw);
      body.append(make('label', '', t('sc.bright')), r);
      const colors = make('div', 'scColors'); colors.dataset.field = 'rgb';
      SWATCHES.forEach((c) => {
        const b = btn(`scSw${!x.kelvin && x.rgb && hex(x.rgb) === hex(c) ? ' on' : ''}`, '', () => change(() => { x.rgb = c; delete x.kelvin; delete x.fx; }), hex(c));
        b.style.background = hex(c); b.dataset.value = hex(c); colors.append(b);
      });
      const pick = make('input', 'scPick'); pick.type = 'color'; pick.value = hex(x.rgb); pick.title = t('sc.color');
      pick.addEventListener('change', () => change(() => { x.rgb = fromHex(pick.value) || x.rgb; delete x.kelvin; }));
      colors.append(pick);
      body.append(make('label', '', t('sc.color')), colors);
      const kel = kelvinSlider({ t, range: lightRange(st), value: x.kelvin ?? null, onChange: (k) => change(() => { x.kelvin = k; delete x.rgb; }) });
      kel.dataset.field = 'kelvinSlider';
      const whites = make('div', 'feChips'); whites.dataset.field = 'kelvin';
      WHITES.forEach(([k, v]) => { const b = btn(`tpChip${x.kelvin === v ? ' on' : ''}`, t(`sc.${k}`), () => change(() => { x.kelvin = v; delete x.rgb; })); b.dataset.value = String(v); whites.append(b); });
      body.append(kel, whites);
      if (Array.isArray(st.fx) && st.fx.length) {
        const sel = make('select', 'scFx'); sel.dataset.field = 'fx';
        sel.append(new Option(t('sc.noFx'), ''));
        st.fx.forEach((f) => sel.append(new Option(f, f, false, f === x.fx)));
        sel.value = x.fx || '';
        sel.addEventListener('change', () => change(() => { if (sel.value) x.fx = sel.value; else delete x.fx; }));
        body.append(make('label', '', t('sc.fx')), sel);
      }
    }
    if (allTargets(draft.ents, e)) {                // #564: these settings for every other device of the scene
      const all = btn('tpChip scAll', `⇉ ${t('sc.toAll')}`, () => toAll(e), t('sc.toAllHint')); all.dataset.act = 'scAll';
      body.append(all);
    }
    row.append(body);
    return row;
  }
  function toAll(from) {
    const r = applyToAll(draft.ents, from, (e) => ctx.states()[e]?.fx);
    if (!r.n) { say(t('sc.allSame')); return; }
    many(() => { draft.ents = r.ents; });
    say(t('sc.allDone', { n: r.n }));
  }

  function picker() {
    const box = make('div', 'scPicker');
    box.append(make('div', 'scPickH', t('sc.pick')));
    const kinds = make('div', 'feChips scKinds');                  // #564: lights, switches, roller shutters
    Object.keys(KINDS).forEach((k) => { const b = btn(`tpChip${kind === k ? ' on' : ''}`, t(`sc.kind.${k}`), () => { kind = k; draw(); }); b.dataset.kind = k; kinds.append(b); });
    const q = make('input', 'scSearch'); q.type = 'search'; q.placeholder = t('sc.search'); q.value = search; q.dataset.field = 'search';
    q.addEventListener('input', () => { search = q.value; drawList(); });
    const addAll = make('div', 'scAddAll');
    const list = make('div', 'scPickList');
    const add = (ids) => ids.forEach((e) => { draft.ents[e] = deviceNow(e, ctx.states()[e]); });
    function drawList() {
      const found = pickable(ctx.entities(), draft.ents, search, kind), room = Math.max(0, MAX_ENTS - Object.keys(draft.ents).length);
      addAll.replaceChildren();
      if (found.length > 1 && room) {                  // "Szene für alles": every device found at once
        const ids = found.slice(0, room).map((e) => e.entity_id);
        const b = btn('bdBtn', `＋ ${t('sc.addAll', { n: ids.length })}`, () => many(() => add(ids)), t('sc.addAllHint')); b.dataset.act = 'scAddAll';
        addAll.append(b);
      }
      list.replaceChildren(...found.slice(0, 60).map((e) => {
        const b = btn('scPickRow', '', () => { if (room) change(() => add([e.entity_id])); });
        b.dataset.entity = e.entity_id; b.disabled = !room;
        b.append(make('span', '', `＋ ${e.name || e.entity_id}`), make('small', '', e.entity_id));
        return b;
      }));
    }
    drawList();
    box.append(kinds, q, addAll, list);
    return box;
  }

  function draw() {
    if (!dlg?.open || !draft) return;
    const focus = document.activeElement, keep = focus && dlg.contains(focus) && focus.matches('input[type=search]') ? focus.selectionStart : null;
    const top = make('div', 'feTop');
    const back = btn('bdBtn', `‹ ${t('sc.back')}`, close); back.dataset.act = 'scBack';
    const name = make('input', 'feName'); name.value = draft.name; name.maxLength = 60; name.dataset.field = 'name'; name.placeholder = t('sc.name');
    name.addEventListener('change', () => change(() => { draft.name = name.value.trim(); }));
    top.append(back, name);
    const right = make('div', 'feTopR');
    if (flash) right.append(make('span', 'feFlash', flash));
    if (undo) { const u = btn('bdBtn', `↶ ${t('sc.undo')}`, () => { draft.ents = undo; undo = null; dirty = true; draw(); }); u.dataset.act = 'scUndo'; right.append(u); }
    if (cid) { const del = btn('bdBtn', `🗑 ${t('sc.delete')}`, drop); del.dataset.act = 'scDelete'; right.append(del); }
    if (theirs) {
      const cp = btn('bdBtn', `📋 ${t('sc.asCopy')}`, () => store(true), t('sc.asCopyHint')); cp.dataset.act = 'scCopy'; cp.disabled = !sceneReady(draft) || busy;
      right.append(cp);
    }
    const now = btn('bdBtn', t('sc.now'), () => many(() => { draft.ents = fromStates(draft.ents, ctx.states()); }), t('sc.nowHelp')); now.dataset.act = 'scNow';
    now.disabled = !Object.keys(draft.ents).length;
    const tryIt = btn('bdBtn', `▶ ${t('sc.try')}`, tryNow); tryIt.dataset.act = 'scTry'; tryIt.disabled = !sceneReady(draft) || ctx.locked() || busy;
    const save = btn('bdBtn primary', `✓ ${t('sc.save')}`, () => store()); save.dataset.act = 'scSave'; save.disabled = !sceneReady(draft) || !dirty || busy;
    right.append(now, tryIt, save);
    top.append(right);
    const parts = [top];
    if (theirs) parts.push(make('div', 'feSync warn', t('sc.theirsNote') + (kept ? ` ${t('sc.keptNote', { n: kept })}` : '')));
    const body = make('div', 'scBody');
    const devs = make('div', 'scDevs');
    const keys = Object.keys(draft.ents);
    if (!keys.length) devs.append(make('p', 'tpSub', t('sc.empty')));
    keys.forEach((e) => devs.append(device(e)));
    body.append(devs, picker());
    parts.push(body);
    dlg.replaceChildren(...parts);
    if (keep != null) { const i = dlg.querySelector('input[type=search]'); if (i) { i.focus(); try { i.setSelectionRange(keep, keep); } catch { /* not every input */ } } }
  }

  /** saved in Home Assistant: a new one, the one opened (also one of Home Assistant's, #564), or asCopy: a copy of it */
  async function store(asCopy = false) {
    if (!sceneReady(draft)) return;
    busy = true; draw();
    const body = asCopy ? { ...draft, name: t('sc.copyName', { name: draft.name }) } : draft;
    const r = await send('PUT', `api/scenes/${encodeURIComponent(cid && !asCopy ? cid : 'new')}`, body);
    busy = false;
    if (r.ok) {
      if (asCopy) { draft.name = body.name; theirs = false; kept = 0; }
      cid = r.id; dirty = false; undo = null;
      say(r.missing ? t('sc.missing') : asCopy ? t('sc.copied') : t('sc.saved'));
      ctx.saved();
    } else say(t('sc.notSaved', { why: r.error === 'nohass' ? t('sc.nohass') : r.error || '…' }));
  }
  async function tryNow() {
    const r = await send('POST', 'api/scenes/try', draft);
    say(r.ok ? `✓ ${t('sc.tried')}` : t('sc.notSaved', { why: r.error || '…' }));
  }
  async function drop() {
    if (await ctx.manage.remove('scene', cid, draft.name)) { dirty = false; ctx.saved(); dlg.close(); }
  }
  function close() {
    if (dirty && !window.confirm(t('sc.leaveAsk'))) return;
    dirty = false;
    dlg?.close();
  }

  /** the editor: scene = { entity, cid, ours, name } of the list (its config is read from Home Assistant), or null for a new one */
  async function open(scene) {
    if (!ctx.canEdit()) return;
    if (!dlg) {
      dlg = make('dialog', 'feDlg scDlg');
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
      dlg.addEventListener('close', () => { draft = null; });
      document.body.append(dlg);
    }
    flash = ''; search = ''; kind = 'all'; dirty = false; cid = null; theirs = false; kept = 0; undo = null;
    draft = { name: t('sc.newName'), ents: {} };
    if (scene?.cid) {
      const r = await send('GET', `api/scenes/${encodeURIComponent(scene.cid)}`);
      if (!r.ok || !r.scene) { window.alert(t('sc.notSaved', { why: r.error || '…' })); return; }
      draft = r.scene;
      cid = scene.cid; theirs = !r.ours; kept = r.kept || 0;
    } else dirty = true;
    if (!dlg.open) dlg.showModal();
    draw();
  }
  return { open, isOpen: () => !!dlg?.open };
}
