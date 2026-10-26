/* The scene editor (#549, the owner: "dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann
 * wirkliche … Szenen in Home Assistant"): a name, the devices of the scene (lights and LED strips first, switches, roller shutters), each
 * on or off, its brightness, a colour (swatches and a colour picker), a white tone, an effect of the light's own list (WLED, Nanoleaf …),
 * a roller shutter's position. "📸 Wie jetzt übernehmen" takes every device as it is now, "▶ Ausprobieren" shows the scene at once without
 * saving it (scene.apply), "✓ Speichern" writes it as a real scene of Home Assistant (api/scenes, only the dashboard's own scenes fp3d_…
 * are changed; one of Home Assistant's is saved as a copy). The model and its words come from scenes.js (tested). */
import { SWATCHES, WHITES, hex, fromHex, kelvinRgb, fromStates, deviceNow, deviceWords, sceneReady, pickable } from './scenes.js';

/** ctx: t, entities() ([{ entity_id, name }]), states(), nameOf(entity), canEdit(), locked(), saved() (a scene was saved or deleted:
 *  draw the cards again) */
export function initSceneEdit(ctx) {
  const { t } = ctx;
  let dlg = null, draft = null, cid = null, copyOf = null, dirty = false, flash = '', search = '', busy = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const change = (fn) => { fn(); dirty = true; draw(); };
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
      const whites = make('div', 'feChips'); whites.dataset.field = 'kelvin';
      WHITES.forEach(([k, v]) => { const b = btn(`tpChip${x.kelvin === v ? ' on' : ''}`, t(`sc.${k}`), () => change(() => { x.kelvin = v; delete x.rgb; })); b.dataset.value = String(v); whites.append(b); });
      body.append(make('label', '', t('sc.white')), whites);
      if (Array.isArray(st.fx) && st.fx.length) {
        const sel = make('select', 'scFx'); sel.dataset.field = 'fx';
        sel.append(new Option(t('sc.noFx'), ''));
        st.fx.forEach((f) => sel.append(new Option(f, f, false, f === x.fx)));
        sel.value = x.fx || '';
        sel.addEventListener('change', () => change(() => { if (sel.value) x.fx = sel.value; else delete x.fx; }));
        body.append(make('label', '', t('sc.fx')), sel);
      }
    }
    row.append(body);
    return row;
  }

  function picker() {
    const box = make('div', 'scPicker');
    box.append(make('div', 'scPickH', t('sc.pick')));
    const q = make('input', 'scSearch'); q.type = 'search'; q.placeholder = t('sc.search'); q.value = search; q.dataset.field = 'search';
    q.addEventListener('input', () => { search = q.value; drawList(); });
    const list = make('div', 'scPickList');
    function drawList() {
      list.replaceChildren(...pickable(ctx.entities(), draft.ents, search).slice(0, 60).map((e) => {
        const b = btn('scPickRow', '', () => change(() => { draft.ents[e.entity_id] = deviceNow(e.entity_id, ctx.states()[e.entity_id]); }));
        b.dataset.entity = e.entity_id;
        b.append(make('span', '', `＋ ${e.name || e.entity_id}`), make('small', '', e.entity_id));
        return b;
      }));
    }
    drawList();
    box.append(q, list);
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
    if (cid && !copyOf) { const del = btn('bdBtn', `🗑 ${t('sc.delete')}`, drop); del.dataset.act = 'scDelete'; right.append(del); }
    const now = btn('bdBtn', t('sc.now'), () => change(() => { draft.ents = fromStates(draft.ents, ctx.states()); }), t('sc.nowHelp')); now.dataset.act = 'scNow';
    now.disabled = !Object.keys(draft.ents).length;
    const tryIt = btn('bdBtn', `▶ ${t('sc.try')}`, tryNow); tryIt.dataset.act = 'scTry'; tryIt.disabled = !sceneReady(draft) || ctx.locked() || busy;
    const save = btn('bdBtn primary', `✓ ${t('sc.save')}`, store); save.dataset.act = 'scSave'; save.disabled = !sceneReady(draft) || !dirty || busy;
    right.append(now, tryIt, save);
    top.append(right);
    const parts = [top];
    if (copyOf) parts.push(make('div', 'feSync warn', t('sc.copyNote', { name: copyOf })));
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

  async function store() {
    if (!sceneReady(draft)) return;
    busy = true; draw();
    const r = await send('PUT', `api/scenes/${encodeURIComponent(cid && !copyOf ? cid : 'new')}`, draft);
    busy = false;
    if (r.ok) {
      cid = r.id; copyOf = null; dirty = false;
      say(r.missing ? t('sc.missing') : t('sc.saved'));
      ctx.saved();
    } else say(t('sc.notSaved', { why: r.error === 'nohass' ? t('sc.nohass') : r.error || '…' }));
  }
  async function tryNow() {
    const r = await send('POST', 'api/scenes/try', draft);
    say(r.ok ? `✓ ${t('sc.tried')}` : t('sc.notSaved', { why: r.error || '…' }));
  }
  async function drop() {
    if (!window.confirm(t('sc.deleteAsk', { name: draft.name }))) return;
    const r = await send('DELETE', `api/scenes/${encodeURIComponent(cid)}`);
    if (r.ok) { dirty = false; ctx.saved(); dlg.close(); } else say(t('sc.notSaved', { why: r.error || '…' }));
  }
  function close() {
    if (dirty && !window.confirm(t('sc.leaveAsk'))) return;
    dirty = false;
    dlg?.close();
  }

  /** the editor: scene = { entity, cid, ours, name } of the list (its config is read from Home Assistant; another's becomes a copy), or
   *  null for a new one */
  async function open(scene) {
    if (!ctx.canEdit()) return;
    if (!dlg) {
      dlg = make('dialog', 'feDlg scDlg');
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
      dlg.addEventListener('close', () => { draft = null; });
      document.body.append(dlg);
    }
    flash = ''; search = ''; dirty = false; cid = null; copyOf = null;
    draft = { name: t('sc.newName'), ents: {} };
    if (scene?.cid) {
      const r = await send('GET', `api/scenes/${encodeURIComponent(scene.cid)}`);
      if (!r.ok || !r.scene) { window.alert(t('sc.notSaved', { why: r.error || '…' })); return; }
      draft = r.scene;
      cid = scene.cid;
      if (!r.ours) { copyOf = draft.name; draft.name = t('sc.copyName', { name: draft.name }); dirty = true; }
    } else dirty = true;
    if (!dlg.open) dlg.showModal();
    draw();
  }
  return { open, isOpen: () => !!dlg?.open };
}
