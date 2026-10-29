/* The page 🎵 Musik & TV of the tab bar (#490): a card per player (room and name, what plays with its picture, ⏮ ⏯ ⏭, on / off, the
 * source, the volume), "Alles stopp" (pauses what plays), "Räume zusammen" (players that can play together: Sonos, Music Assistant …)
 * and the radio stations of ⚙ (a tap asks on which player, when there is more than one). The rules are in media.js (tested). */
import { players, stopCalls, groupsOf, joinCall, cleanStations, stationCall, picUrl, tone, hasMedia } from './media.js';

/** ctx: t, el (the page), states(), names() ({ entity: name }), roomOf(entity) (the room in the plan or Home Assistant's area),
 *  settings(), canEdit(), callService(entity, service, data) (-> true when Home Assistant took it), board (pageboard.js, #484: keys
 *  mp:<entity>, stations) */
export function initMediaPage(ctx) {
  const { t, el } = ctx;
  let drawn = '', dlg = null, sliding = false, waiting = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const list = () => players(ctx.states(), { names: ctx.names(), roomOf: ctx.roomOf });
  const stations = () => cleanStations(ctx.settings().radioStations);
  const nameOf = (p) => (p.room && p.room !== p.name ? `${p.room} · ${p.name}` : p.name);
  const stateWord = (s) => { const k = `mp.st.${s}`, w = t(k); return w === k ? s : w; };

  function ensureDlg() {
    if (dlg) return dlg;
    dlg = make('dialog', 'mpDlg');
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    document.body.append(dlg);
    return dlg;
  }
  /** a small window: a title, rows and buttons at the bottom */
  function ask(title, sub, rows, buttons) {
    const d = ensureDlg(), head = make('div', 'ceHead');
    head.append(make('h3', '', title));
    if (sub) head.append(make('p', 'tpSub', sub));
    const bar = make('div', 'ceBtns');
    bar.append(btn('bdBtn', t('ce.cancel'), () => d.close()), ...buttons);
    d.replaceChildren(head, ...rows, bar);
    if (!d.open) d.showModal();
  }

  /* ---- a station: on which player ---- */
  const play = (entity, s) => { const c = stationCall(entity, s); return ctx.callService(c.entity, c.service, c.data); };
  function playStation(s) {
    const can = list().filter((p) => p.canPlay);
    if (can.length === 1) { play(can[0].entity, s); return; }
    const box = make('div', 'mpPicks');
    can.forEach((p) => {
      const b = btn('mpPick', null, () => { play(p.entity, s); dlg.close(); });
      b.dataset.entity = p.entity;
      b.append(make('b', '', nameOf(p)), make('small', 'tpSub', p.on ? p.title || stateWord(p.state) : stateWord(p.state)));
      box.append(b);
    });
    ask(`📻 ${s.name}`, t('mp.where'), [can.length ? box : make('p', 'tpSub', t('mp.noTarget'))], []);
  }

  /* ---- rooms together ---- */
  function together() {
    const all = list().filter((p) => p.canGroup && p.state !== 'unavailable'), groups = groupsOf(all);
    const box = make('div', 'mpPicks');
    all.forEach((p) => {
      const lab = make('label', 'mpTick'), cb = make('input'); cb.type = 'checkbox'; cb.dataset.entity = p.entity;
      cb.checked = !!p.group || p.playing;
      lab.append(cb, make('b', '', nameOf(p)), make('small', 'tpSub', p.playing ? p.title || stateWord(p.state) : stateWord(p.state)));
      box.append(lab);
    });
    const go = btn('bdBtn primary', `🔗 ${t('mp.join')}`, () => {
      const ticked = [...box.querySelectorAll('input:checked')].map((c) => c.dataset.entity);
      const lead = ticked.find((e) => all.find((p) => p.entity === e)?.playing) || ticked[0];
      const c = joinCall(lead, ticked);
      if (c) ctx.callService(c.entity, c.service, c.data);
      dlg.close();
    });
    go.dataset.act = 'join';
    const parts = groups.length ? [btn('bdBtn', `✂ ${t('mp.apart')}`, () => {
      groups.forEach((g) => g.members.filter((m) => m !== g.leader).forEach((m) => ctx.callService(m, 'unjoin')));
      dlg.close();
    })] : [];
    if (parts.length) parts[0].dataset.act = 'apart';
    ask(`🔗 ${t('mp.together')}`, t('mp.togetherSub'), [box], [...parts, go]);
  }

  /* ---- a player's card ---- */
  function card(p) {
    const c = make('div', `tpCard mpCard${p.playing ? ' playing' : ''}${p.on ? '' : ' off'}`);
    c.dataset.player = p.entity;
    const art = make('div', `mpArt t${tone(p.entity)}`), src = picUrl(p.entity, p.pic);
    if (src) {
      const img = make('img'); img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.src = src;
      img.addEventListener('error', () => img.remove());                 // the ♪ under it shows instead
      art.append(make('span', '', '♪'), img);
    } else art.append(make('span', '', p.state === 'unavailable' ? '✕' : '♪'));
    const body = make('div', 'mpBody');
    body.append(make('small', 'mpWhere', nameOf(p)), make('div', 'mpTitle', p.on && p.title ? p.title : stateWord(p.state)));
    if (p.on && p.sub) body.append(make('div', 'mpSub', p.sub));
    else if (p.on && p.title && p.state !== 'playing') body.append(make('div', 'mpSub', stateWord(p.state)));
    if (p.group) body.append(make('div', 'mpGroup', `🔗 ${t('mp.with', { list: p.group.filter((e) => e !== p.entity).map((e) => ctx.names()[e] || ctx.roomOf(e) || e).join(', ') })}`));
    const plan = p.plan || { buttons: [] }, row = make('div', 'mpBtns');
    plan.buttons.forEach((b) => {
      const k = btn(`mpBtn${b.svc === 'media_play_pause' ? ' main' : ''}`, b.only ? b.icon : `${b.icon} ${t(b.label)}`.trim(), () => ctx.callService(p.entity, b.svc), t(b.label));
      k.dataset.svc = b.svc; row.append(k);
    });
    if (plan.sources) {
      const sel = make('select', 'mpSource'); sel.title = t('dc.source');
      if (!plan.sources.list.includes(plan.sources.value)) sel.add(new Option(`📺 ${t('dc.source')}`, ''));
      plan.sources.list.forEach((o) => sel.add(new Option(o, o)));
      sel.value = plan.sources.list.includes(plan.sources.value) ? plan.sources.value : '';
      sel.addEventListener('change', () => { if (sel.value) ctx.callService(p.entity, 'select_source', { source: sel.value }); });
      row.append(sel);
    }
    if (row.childElementCount) body.append(row);
    if (plan.volume) {
      const v = make('div', 'mpVol');
      if (plan.mute) {
        const m = btn(`mpMute${plan.volume.muted ? ' on' : ''}`, plan.volume.muted ? '🔇' : '🔈', () => ctx.callService(p.entity, 'volume_mute', { is_volume_muted: !plan.volume.muted }),
          t(plan.volume.muted ? 'dc.unmute' : 'dc.mute'));
        v.append(m);
      } else v.append(make('span', 'mpMute', '🔈'));
      if (plan.volume.step || plan.volume.value == null) {
        v.append(btn('mpBtn', '−', () => ctx.callService(p.entity, 'volume_down'), t('dc.volDown')), btn('mpBtn', '+', () => ctx.callService(p.entity, 'volume_up'), t('dc.volUp')));
      } else {
        const s = make('input', 'mpRange'); s.type = 'range'; s.min = 0; s.max = 100; s.value = plan.volume.value; s.setAttribute('aria-label', t('dc.volume'));
        const val = make('span', 'mpVal', `${plan.volume.value} %`);
        s.addEventListener('pointerdown', () => { sliding = true; });
        s.addEventListener('input', () => { val.textContent = `${s.value} %`; });
        s.addEventListener('change', () => { sliding = false; ctx.callService(p.entity, 'volume_set', { volume_level: +s.value / 100 }); });
        v.append(s, val);
      }
      body.append(v);
    }
    c.append(art, body);
    return c;
  }

  function stationsCard(list) {
    const c = make('div', 'tpCard mpStations');
    c.append(make('h3', 'peH', t('mp.stations')));
    if (!list.length) { c.append(make('p', 'tpSub', t('mp.noStations'))); return c; }
    const row = make('div', 'mpStationRow');
    list.forEach((s) => { const b = btn('mpStation', `📻 ${s.name}`, () => playStation(s), s.url); b.dataset.station = s.url; row.append(b); });
    c.append(row);
    return c;
  }

  function draw(force = false) {
    if (sliding && !force) return;                                   // a volume being moved stays under the finger
    const all = list(), st = stations(), canJoin = all.filter((p) => p.canGroup && p.state !== 'unavailable').length > 1, playing = all.some((p) => p.playing && p.stop);
    const sig = JSON.stringify([all.map((p) => [p.entity, p.state, p.title, p.sub, p.pic, p.group, p.plan?.volume, p.plan?.sources?.value, p.plan?.buttons.map((b) => b.svc)]),
      st, canJoin, waiting, ctx.canEdit(), t('tab.media')]);
    if (!force && sig === drawn) return;
    drawn = sig;
    const head = make('div', 'tpHead');
    head.append(make('h2', '', `🎵 ${t('tab.media')}`));
    const tools = make('div', 'tpTools');
    if (canJoin) { const j = btn('bdBtn', `🔗 ${t('mp.together')}`, together); j.dataset.act = 'together'; tools.append(j); }
    if (playing) {
      const s = btn('bdBtn', `⏸ ${t('mp.stopAll')}`, async () => {
        waiting = true; draw(true);
        await Promise.all(stopCalls(list()).map((c) => ctx.callService(c.entity, c.service)));
        waiting = false; draw(true);
      });
      s.dataset.act = 'stopAll'; s.disabled = waiting; tools.append(s);
    }
    head.append(tools);
    const grid = make('div', 'mpGrid'), items = all.map((p) => ({ key: `mp:${p.entity}`, name: nameOf(p), el: card(p), width: 1 }));
    if (st.length || ctx.canEdit()) items.push({ key: 'stations', el: stationsCard(st), width: 4 });
    el.replaceChildren(head, ...(all.length ? [] : [make('p', 'tpSub', t('mp.none'))]), grid);
    ctx.board.fill('media', grid, items, { min: 380 });
  }
  addEventListener('pointerup', () => { if (sliding) { sliding = false; drawn = ''; } }, true);

  return {
    render: () => draw(true),
    update: () => draw(false),
    has: () => hasMedia(ctx.states()),
    reset: () => { if (dlg?.open) dlg.close(); drawn = ''; sliding = false; },
  };
}
