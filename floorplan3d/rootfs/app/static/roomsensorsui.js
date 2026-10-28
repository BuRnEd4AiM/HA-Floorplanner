/* 🌡 Klima → 📋 Heiz-Regeln → 🌡 Raumfühler (#573, the owner: "jedem Thermostat einfach einen Temperatursensor gebe … wie bei Better
 * Thermostat"; pictures docs/ideen-4.38/1-raumfuehler.jpg, 2-fuehler-waehlen.jpg, 3-klima.jpg): a card with every thermostat, the sensor
 * in its room an admin gave it, what the thermostat measures itself and what the add-on does (🎯 Ausgleich, ↕ Wunsch verschieben, 👁 Nur
 * anzeigen); a sensor of the same room is only suggested ("＋ Übernehmen", his choice). The window to choose a sensor (those of the room
 * first) and how to regulate. Also the line under a thermostat on 🌡 Klima, the log's lines and the page's states with the sensors'
 * temperatures (applySensors). The add-on regulates (roomsensors.py); the logic of the page is in roomsensors.js (tested). */
import { WAYS, WAY_ICON, platformName, sensorChoices, sensorLine, roomSensorChip, sensorCfg, sensorValue, applySensors, sensorLog } from './roomsensors.js';

/** ctx: t, states(), nameOf(entity), canEdit(), rules (rulesstore.js), rooms() (every room of the house shown: [{ id, name, floorName,
 *  ids }]), partOf() ({ entity: the thermostat of its device }), deg(°C), delta(° of difference), changed() (draw the page again) */
export function initRoomSensorsUi(ctx) {
  const { t } = ctx;
  let dlg = null, pick = null, change = null;           // pick: { climate, s, way, q } while the window is open
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const status = () => ctx.rules.get()?.status || {};
  const cfgOf = (h) => sensorCfg(h || ctx.rules.get()?.heat);
  const name = (e) => ctx.nameOf(e) || e;
  /** what a thermostat measures itself (at the radiator: with an offset it reports the room's temperature, raw is without it) */
  const own = (s, e) => { const raw = status().sensors?.[e]?.raw; return typeof raw === 'number' ? raw : s && 'rs' in s ? s.ct0 : s?.ct; };
  const tempOf = (e) => sensorValue(ctx.states(), e);
  /** the sensors' map changed through the heating rules' draft (saved a moment later) */
  const setMap = (fn) => change?.((x) => { const c = sensorCfg(x); fn(c.map); x.sensors = { ...c, map: { ...c.map } }; });

  /** every thermostat of Home Assistant (and one with a sensor that is gone), with its room, sorted by room and name */
  function thermostats(cfg) {
    const st = ctx.states(), rooms = ctx.rooms();
    const ids = new Set([...Object.keys(st).filter((e) => e.startsWith('climate.')), ...Object.keys(cfg.map)]);
    return [...ids].map((e) => ({ e, room: rooms.find((r) => (r.ids || []).includes(e)) || null }))
      .sort((a, b) => String(a.room?.name || '￿').localeCompare(String(b.room?.name || '￿')) || name(a.e).localeCompare(name(b.e)));
  }
  function wayChip(way) {
    if (!way) return null;
    const c = make('span', `rsWay ${way}`, `${WAY_ICON[way]} ${t(`rs.way.${way}`)}`); c.dataset.way = way;
    return c;
  }

  function row(x, cfg) {
    const e = x.e, s = ctx.states()[e], m = cfg.map[e], st = status().sensors?.[e] || null;
    const r = make('div', 'rsRow'); r.dataset.climate = e;
    const who = make('div', 'rsName');
    who.append(make('b', '', name(e)));
    const where = [x.room?.name, platformName(status().plat?.[e])].filter(Boolean).join(' · ');
    if (where || !s) who.append(make('small', '', s ? `📍 ${where}` : `⚠️ ${t('rs.missing')}`));
    const pickCell = make('div', 'rsSensor');
    const b = btn(`rsPick${m ? '' : ' none'}`, '', () => open(e)); b.dataset.act = 'rsPick'; b.disabled = !ctx.canEdit();
    if (m) { const v = tempOf(m.s); b.append(make('span', '', `🌡 ${name(m.s)}`), make('b', '', v === null ? '–' : ctx.deg(v))); }
    else b.append(make('span', '', t('rs.none')));
    pickCell.append(b);
    const meas = make('div', 'rsMeas');
    meas.append(make('b', '', typeof own(s, e) === 'number' ? ctx.deg(own(s, e)) : '–'));
    const how = make('div', 'rsHow');
    if (m) {
      const line = sensorLine(st, m.way, t, ctx.deg, ctx.delta);
      const chip = wayChip(line.way || (m.way === 'auto' ? null : m.way)); if (chip) how.append(chip);
      const tx = make('span', `tpSub rsText ${line.tone}`, line.text); how.append(tx);
    } else {
      const { suggest } = sensorChoices(e, ctx.rooms(), ctx.states(), ctx.partOf(), name);
      if (suggest && ctx.canEdit()) {
        const sug = make('div', 'rsSug');
        const v = tempOf(suggest);
        sug.append(make('span', '', `💡 ${t('rs.suggest')}`), make('b', '', `${name(suggest)}${v === null ? '' : ` · ${ctx.deg(v)}`}`));
        const take = btn('bdBtn', `＋ ${t('rs.take')}`, () => setMap((map) => { map[e] = { s: suggest, way: 'auto' }; })); take.dataset.act = 'rsTake';
        sug.append(take);
        how.append(sug);
      } else how.append(make('span', 'tpSub', t('rs.ownOnly')));
    }
    r.append(who, pickCell, meas, how);
    return r;
  }

  /** the card; h: the heating rules (draft), parts: { change, toggle, stepper, kv } of heatrulesui.js */
  function card(h, parts) {
    change = parts.change;
    const cfg = cfgOf(h);
    const c = make('div', `tpCard hrCard rsCard${cfg.on ? '' : ' off'}`); c.dataset.heatRule = 'sensors';
    const head = make('div', 'hrHead'), tx = make('div', '');
    tx.append(make('b', '', t('rs.title')), make('small', 'tpSub', t('rs.sub')));
    head.append(make('span', 'hrIc', '🌡️'), tx, parts.toggle(cfg.on, (v) => change((x) => { x.sensors = { ...sensorCfg(x), on: v }; }), 'sensors'));
    c.append(head, make('p', 'rsIntro', t('rs.intro')));
    const list = thermostats(cfg);
    if (!list.length) c.append(make('p', 'tpSub', t('rs.noThermostats')));
    else {
      const tb = make('div', 'rsTable');
      [t('rs.col.climate'), t('rs.col.sensor'), t('rs.col.own'), t('rs.col.how')].forEach((x, i) => tb.append(make('div', `rsTh${i === 2 ? ' num' : ''}`, x)));
      list.forEach((x) => tb.append(row(x, cfg)));
      c.append(tb);
    }
    const foot = make('div', 'hrKvs rsFoot');
    foot.append(parts.kv(t('rs.every'), parts.stepper(cfg.every, { step: 1, min: 2, max: 60, text: (x) => t('fl.min', { n: x }), data: 'sensors.every',
      set: (v) => change((x) => { x.sensors = { ...sensorCfg(x), every: v }; }) })),
    parts.kv(t('rs.min'), parts.stepper(cfg.min, { step: 0.1, min: 0.1, max: 3, text: (x) => ctx.delta(x), data: 'sensors.min',
      set: (v) => change((x) => { x.sensors = { ...sensorCfg(x), min: Math.round(v * 10) / 10 }; }) })),
    parts.kv(t('rs.lostKv'), make('b', '', t('rs.lostDo'))));
    c.append(foot);
    const leg = make('div', 'rsLegend');
    [['cal', 'rs.leg.cal'], ['shift', 'rs.leg.shift']].forEach(([w, k]) => { const d = make('div', ''); d.append(wayChip(w), make('span', '', ` ${t(k)}`)); leg.append(d); });
    c.append(leg);
    return c;
  }

  /* ---- the window to choose a sensor and the way ---- */
  function open(e) {
    if (!ctx.canEdit()) return;
    const m = cfgOf().map[e];
    pick = { climate: e, s: m?.s || null, way: m?.way || 'auto', q: '', had: !!m };
    if (!pick.s) pick.s = sensorChoices(e, ctx.rooms(), ctx.states(), ctx.partOf(), name).suggest;
    if (!dlg) {
      dlg = make('dialog', 'ceDlg rsDlg');
      dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
      dlg.addEventListener('close', () => { pick = null; });
      document.body.append(dlg);
    }
    draw();
    if (!dlg.open) dlg.showModal();
  }
  function option(e, tag, sub) {
    const v = tempOf(e), o = btn(`rsOpt${pick.s === e ? ' on' : ''}`, '', () => { pick.s = e; draw(); });
    o.dataset.sensor = e;
    const txt = make('span', 'rsTxt'); txt.append(make('b', '', name(e)), make('small', '', sub));
    o.append(make('span', 'rsIc', '🌡'), txt);
    if (tag) o.append(make('span', 'rsTag', tag));
    o.append(make('b', 'v', v === null ? '–' : ctx.deg(v)));
    return o;
  }
  function draw() {
    if (!dlg || !pick) return;
    const e = pick.climate, s = ctx.states()[e];
    const ch = sensorChoices(e, ctx.rooms(), ctx.states(), ctx.partOf(), name);
    const head = make('div', 'ceHead');
    head.append(make('h3', '', `🌡 ${t('rs.pickTitle', { name: name(e) })}`));
    head.append(make('p', 'tpSub', [ch.room ? t('rs.pickRoom', { room: ch.room.name }) : '', typeof own(s, e) === 'number' ? t('rs.pickOwn', { v: ctx.deg(own(s, e)) }) : ''].filter(Boolean).join(' · ')));
    const q = make('input', 'rsSearch'); q.type = 'search'; q.placeholder = `🔎 ${t('rs.search')}`; q.value = pick.q;
    q.addEventListener('input', () => { pick.q = q.value; drawList(); q.focus(); });
    const list = make('div', 'rsList');
    function drawList() {
      const hit = (x) => !pick.q || `${name(x)} ${x}`.toLowerCase().includes(pick.q.toLowerCase());
      list.replaceChildren();
      const same = ch.same.filter(hit), other = ch.other.filter(hit);
      if (same.length) { list.append(make('div', 'rsSec', t('rs.secSame'))); same.forEach((x) => list.append(option(x, x === ch.suggest ? t('rs.suggestTag') : '', `${x} · ${ch.room.name}`))); }
      if (other.length) { list.append(make('div', 'rsSec', t(ch.room ? 'rs.secOther' : 'rs.secAll'))); other.forEach((x) => list.append(option(x, '', [x, ch.roomOf(x)?.name].filter(Boolean).join(' · ')))); }
      if (!same.length && !other.length) list.append(make('p', 'tpSub', t('rs.noSensors')));
    }
    drawList();
    const ways = make('div', 'rsWays');
    WAYS.forEach((w) => {
      const o = btn(`rsOpt${pick.way === w ? ' on' : ''}`, '', () => { pick.way = w; draw(); }); o.dataset.way = w;
      const txt = make('span', 'rsTxt'); txt.append(make('b', '', t(`rs.way.${w}`)), make('small', '', t(`rs.waySub.${w}`)));
      o.append(make('span', 'rsIc', WAY_ICON[w]), txt);
      ways.append(o);
    });
    const cal = status().cal, calEnt = cal?.[e];
    const note = make('div', 'rsNote',
      pick.way === 'auto' ? (calEnt ? `✨ ${t('rs.autoCal', { name: name(calEnt) })}` : cal ? `✨ ${t('rs.autoShift')}` : `✨ ${t('rs.autoAny')}`)
        : pick.way === 'cal' && cal && !calEnt ? `⚠️ ${t('rs.calNone')}` : pick.way === 'shift' ? `↕ ${t('rs.shiftNote')}` : pick.way === 'show' ? `👁 ${t('rs.showNote')}` : `🎯 ${t('rs.calNote')}`);
    const bar = make('div', 'ceBtns');
    if (pick.had) { const del = btn('bdBtn', `✕ ${t('rs.remove')}`, () => { setMap((map) => { delete map[e]; }); dlg.close(); }); del.dataset.act = 'rsRemove'; bar.append(del); }
    bar.append(btn('bdBtn', t('rs.cancel'), () => dlg.close()));
    const ok = btn('bdBtn primary', `✓ ${t('rs.apply')}`, () => { const p = { s: pick.s, way: pick.way }; setMap((map) => { map[e] = p; }); dlg.close(); });
    ok.dataset.act = 'rsApply'; ok.disabled = !pick.s;
    bar.append(ok);
    dlg.replaceChildren(head, q, list, make('div', 'rsSec', t('rs.secWay')), ways, note, bar);
  }

  /** the line under a thermostat on 🌡 Klima, or null */
  function line(climate) {
    const s = ctx.states()[climate], x = roomSensorChip(status().sensors?.[climate], s, t, ctx.deg, ctx.delta);
    if (!x) return null;
    const p = make('div', 'rsRoom'); p.dataset.sensor = s.rs;
    p.append(make('span', '', x.text));
    if (x.chip) p.append(make('span', `rsWay ${x.chip.cls}`, x.chip.text));
    return p;
  }

  return {
    card, line,
    /** the page's states with the sensors' temperatures (roomsensors.applySensors) */
    apply: (states) => applySensors(states, cfgOf(), status().sensors),
    /** a line of the log (src "sensor") */
    log: (x) => sensorLog(x, t, name(x.ent || ''), (v) => ctx.deg(v)),
    sig: () => {
      const cfg = cfgOf(), st = ctx.states();
      return JSON.stringify([status().sensors, status().plat, status().cal, Object.keys(cfg.map).map((e) => [tempOf(cfg.map[e].s), own(st[e], e)]),
        Object.keys(st).filter((e) => e.startsWith('climate.')).length]);
    },
  };
}
