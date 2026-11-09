/* Security (Sicherheit), the screen: the 🛡️ button in the tool bar, the list of recorded days, and the bar at the bottom with play,
 * pause, event to event, speed, a zoom (the slider shows 24 h … 10 min of the day) with every event as an icon on it, and the list of what switched. While it is open
 * the house shows the recorded states instead of the live ones and nothing can be switched (the app pauses the live channel and locks
 * "control"). The rules (states at a moment, events ...) are in timeline.js. */
import { SPEEDS, ZOOMS, parseDay, makePlayer, eventList, nextEvent, prevEvent, eventsAround, advance, eventKind, clock, dayChoices, todayIso,
  follow, zoomLabel, markers, tickTimes } from './timeline.js';

const ICON_PX = 26;                                       // the width one icon needs on the time line: closer events share one icon
const ZOOM_KEY = 'fp.tlZoom';                             // the zoom chosen last (this browser only)

/** ctx: $, t, lang() (for the date), name(entity_id), enter() (live mode, live channel paused), exit(), show(recorded states) */
export function initTimeline(ctx) {
  const { $, t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  /* ---- the button ---- */
  const btn = el('button', null, '🛡️ '), word = el('span');
  word.dataset.i18n = 'tl.btn'; word.textContent = t('tl.btn'); btn.append(word);
  btn.id = 'timelineBtn'; btn.type = 'button'; btn.dataset.i18nTitle = 'tl.tip'; btn.title = t('tl.tip');
  $('#settingsBtn')?.before(btn);

  /* ---- the list of days ---- */
  const dlg = el('dialog'); dlg.id = 'tlDays';
  document.body.append(dlg);
  async function openDays() {
    dlg.replaceChildren(el('p', 'sub', t('tl.loading')));
    if (!dlg.open) dlg.showModal();
    let info;
    try { const r = await fetch('api/timeline'); if (!r.ok) throw new Error(String(r.status)); info = await r.json(); } catch { info = null; }
    const close = el('button', 'dlgClose', '✕'); close.type = 'button'; close.addEventListener('click', () => dlg.close());
    const list = el('div', 'tlDayList');
    const days = dayChoices(info?.days, todayIso());
    days.forEach((d) => {
      const row = el('div', 'tlDayRow');
      const pick = el('button', 'tlDay');
      pick.type = 'button';
      pick.append(el('b', null, dateText(d.day)), el('span', 'sub', d.today ? t('tl.today') : d.day));
      pick.addEventListener('click', () => { dlg.close(); start(d.day); });
      const dl = el('a', 'btn tlDl', '⬇'); dl.href = `api/timeline/${d.day}?download=1`; dl.download = ''; dl.title = t('tl.download');
      row.append(pick, dl); list.append(row);
    });
    const parts = [close, el('h3', null, `🛡️ ${t('tl.title')}`), el('p', 'sub', t('tl.hint'))];
    if (!info) parts.push(el('p', 'tlWarn', t('tl.failed')));
    else {
      if (!info.on) parts.push(el('p', 'tlWarn', t('tl.off')));
      else if (info.ha === false) parts.push(el('p', 'tlWarn', t('tl.noHa')));
      parts.push(days.length ? list : el('p', 'sub', t('tl.none')));
      parts.push(el('p', 'sub', t('tl.files', { n: Math.round(info.keepDays || 7), folder: info.folder || '' })));
    }
    dlg.replaceChildren(...parts);
  }
  btn.addEventListener('click', openDays);
  /* ---- the recorded days in the backup dialog (#317): each to play (▶) or to download (⬇) ---- */
  const setDays = document.getElementById('tlSetDays');
  async function renderSetDays() {
    if (!setDays) return;
    let info = null;
    try { const r = await fetch('api/timeline'); if (r.ok) info = await r.json(); } catch { /* no backend (demo) */ }
    const days = dayChoices(info?.days, todayIso());
    if (!days.length) { setDays.replaceChildren(el('p', 'sub', t(info ? 'tl.none' : 'tl.failed'))); return; }
    setDays.replaceChildren(...days.map((d) => {
      const row = el('div', 'abRow');
      const kb = d.size >= 1048576 ? `${(d.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(d.size / 1024))} kB`;
      const label = el('span', 'abName', `${dateText(d.day)}${d.today ? ` (${t('tl.today')})` : ''} · ${kb}`);
      const play = el('button', null, '▶'); play.type = 'button'; play.title = t('tl.play');
      play.addEventListener('click', () => start(d.day));
      const dl = el('a', 'btn', '⬇'); dl.href = `api/timeline/${d.day}?download=1`; dl.download = `floorplan3d-timeline-${d.day}.jsonl`; dl.title = t('tl.download');
      row.append(label, play, dl);
      return row;
    }));
  }
  const dateText = (day) => {
    const [y, m, d] = day.split('-').map(Number);
    try { return new Date(y, m - 1, d).toLocaleDateString(ctx.lang(), { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return day; }
  };

  /* ---- the bar ---- */
  const bar = el('div'); bar.id = 'tlBar'; bar.hidden = true;
  /** a button; key: its tooltip (data-i18n-title, so it follows a change of the language) */
  const b = (txt, key, cls) => { const x = el('button', cls, txt); x.type = 'button'; if (key) { x.dataset.i18nTitle = key; x.title = t(key); } return x; };
  const exitBtn = b('✕', 'tl.exit', 'tlExit'), dayBtn = b('', 'tl.title', 'tlDayBtn');
  const time = el('span', 'tlTime', '--:--:--');
  const prevBtn = b('⏮', 'tl.prev', 'tlPrev'), playBtn = b('▶', 'tl.play', 'primary tlPlay'), nextBtn = b('⏭', 'tl.next', 'tlNext');
  const speedSel = el('select', 'tlSpeed'); speedSel.dataset.i18nTitle = 'tl.speed'; speedSel.title = t('tl.speed');
  SPEEDS.forEach((s) => { const o = el('option', null, `×${s}`); o.value = String(s); speedSel.append(o); });
  speedSel.value = '60';
  const zoomSel = el('select', 'tlZoom'); zoomSel.dataset.i18nTitle = 'tl.zoom'; zoomSel.title = t('tl.zoom');
  ZOOMS.forEach((s) => { const o = el('option', null, `🔍 ${zoomLabel(s)}`); o.value = String(s); zoomSel.append(o); });
  zoomSel.value = (() => { try { const v = localStorage.getItem(ZOOM_KEY); return ZOOMS.includes(Number(v)) ? v : '86400'; } catch { return '86400'; } })();
  const listBtn = b('📋', 'tl.events', 'tlListBtn');
  const last = el('span', 'tlLast');
  const track = el('div', 'tlTrack'), bars = el('div', 'tlMarks'), slider = el('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '1000'; slider.step = '1'; slider.value = '0'; slider.dataset.i18nTitle = 'tl.title';
  track.append(bars, slider);
  const ticks = el('div', 'tlTicks');
  const evBox = el('div', 'tlEvents'); evBox.hidden = true;
  const row1 = el('div', 'tlRow');
  row1.append(exitBtn, dayBtn, time, prevBtn, playBtn, nextBtn, speedSel, zoomSel, listBtn);
  bar.append(row1, last, track, ticks, evBox);
  $('#stage').append(bar);

  let day = null, player = null, events = [], cur = 0, playing = false, raf = 0, lastTs = 0, shownIdx = -1, active = false;
  let win = null, drawnWin = null;                        // the part of the day the slider shows, and the one the icons were drawn for

  async function start(name) {
    stop();
    time.textContent = t('tl.loading');
    let data;
    try { const r = await fetch(`api/timeline/${name}`); if (!r.ok) throw new Error(String(r.status)); data = await r.json(); } catch { ctx.status?.(t('tl.failed')); return; }
    day = { name, ...parseDay(data) };
    player = makePlayer(day.frames);
    events = eventList(day.frames);
    if (!active) { active = true; ctx.enter(); }
    document.body.classList.add('replay');
    bar.hidden = false;
    dayBtn.textContent = `📅 ${dateText(name)}`;
    win = null; drawnWin = null;
    seek(day.frames[0]?.t ?? day.start, true);                   // from the moment the recording of that day began
  }
  const dayEnd = () => day.start + Math.max(day.end - day.start, 86400);   // the slider covers the whole day, also today's future
  /** the icons of the events in the window, the times under it, today's part still to come */
  function drawMarks() {
    const { from, to } = win, span = to - from;
    const list = markers(events, from, to, (track.clientWidth || 600) / ICON_PX);
    bars.replaceChildren(...list.map((m) => {
      const x = b('', null, `tlMark ${m.kind}`);
      x.style.left = `${m.pct}%`;
      x.textContent = m.icon;
      if (m.count > 1) x.append(el('sup', null, String(m.count)));
      x.title = m.events.slice(0, 6).map((e) => `${clock(e.t, span < 7200)} ${eventText(e)}`).join('\n') + (m.count > 6 ? `\n… +${m.count - 6}` : '');
      x.addEventListener('click', (ev) => { ev.stopPropagation(); pause(); seek(m.t); });
      return x;
    }));
    if (day.end < to) {                                    // today: the rest of the day is still to come
      const done = el('i', 'tlFuture'); done.style.left = `${Math.max(0, ((day.end - from) / span) * 100)}%`; bars.append(done);
    }
    ticks.replaceChildren(...tickTimes(from, to, day.start).map((x) => { const l = el('span', null, clock(x, span < 600)); l.style.left = `${((x - from) / span) * 100}%`; return l; }));
    drawnWin = win;
  }
  function seek(tt, force = false) {
    if (!day) return;
    cur = Math.min(day.end, Math.max(day.start, tt));
    const r = player.seek(cur);
    win = follow(win, cur, Number(zoomSel.value) || 86400, day.start, dayEnd());
    if (win !== drawnWin) drawMarks();
    slider.value = String(Math.round(((cur - win.from) / (win.to - win.from)) * 1000));
    time.textContent = clock(cur);
    if (force || r.idx !== shownIdx) {
      shownIdx = r.idx;
      ctx.show(r.states);
      const ev = prevEvent(events, cur + 0.1);
      last.textContent = ev ? `${clock(ev.t, false)} · ${eventText(ev)}` : t('tl.noEvents');
      if (!evBox.hidden) renderEvents();
    }
  }
  const stateWord = (e) => ({ on: t('tl.on'), off: t('tl.offState') }[eventKind(e)] || e.to);
  const eventText = (e) => `${ctx.name(e.id)} → ${stateWord(e)}`;
  function renderEvents() {
    const around = eventsAround(events, cur, 6, 6), now = prevEvent(events, cur + 0.1);
    if (!around.length) { evBox.replaceChildren(el('p', 'sub', t('tl.noEvents'))); return; }
    evBox.replaceChildren(...around.map((e) => {
      const r = b('', null, `tlEv ${eventKind(e)}${e === now ? ' now' : ''}`);
      r.append(el('span', 'tlEvT', clock(e.t)), el('span', 'tlEvN', ctx.name(e.id)), el('span', 'tlEvS', stateWord(e)));
      r.addEventListener('click', () => { pause(); seek(e.t); });
      return r;
    }));
  }
  function play() {
    if (!day) return;
    if (cur >= day.end) seek(day.start);
    playing = true; playBtn.textContent = '⏸'; playBtn.dataset.i18nTitle = 'tl.pause'; playBtn.title = t('tl.pause');
    lastTs = 0;
    raf = requestAnimationFrame(step);
  }
  function pause() {
    playing = false; playBtn.textContent = '▶'; playBtn.dataset.i18nTitle = 'tl.play'; playBtn.title = t('tl.play');
    cancelAnimationFrame(raf); raf = 0;
  }
  function step(ts) {
    if (!playing) return;
    const dt = lastTs ? Math.min(0.25, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    const a = advance(cur, dt, Number(speedSel.value) || 60, day.end);
    seek(a.t);
    if (a.done) { pause(); return; }
    raf = requestAnimationFrame(step);
  }
  function stop() { pause(); }
  function exit() {
    if (!active) return;
    stop();
    active = false; day = null; player = null; events = [];
    bar.hidden = true; evBox.hidden = true;
    document.body.classList.remove('replay');
    ctx.exit();
  }

  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  prevBtn.addEventListener('click', () => { const e = prevEvent(events, cur); pause(); seek(e ? e.t : day.start); });
  nextBtn.addEventListener('click', () => { const e = nextEvent(events, cur); pause(); seek(e ? e.t : day.end); });
  slider.addEventListener('input', () => { if (day) seek(win.from + (Number(slider.value) / 1000) * (win.to - win.from)); });
  zoomSel.addEventListener('change', () => {
    try { localStorage.setItem(ZOOM_KEY, zoomSel.value); } catch { /* private window: not remembered */ }
    if (day) seek(cur, true);
  });
  track.addEventListener('wheel', (e) => {                // mouse wheel over the time line: zoom in / out
    if (!day) return;
    e.preventDefault();
    const i = ZOOMS.indexOf(Number(zoomSel.value)), j = Math.min(ZOOMS.length - 1, Math.max(0, i + (e.deltaY > 0 ? -1 : 1)));
    if (j !== i) { zoomSel.value = String(ZOOMS[j]); zoomSel.dispatchEvent(new Event('change')); }
  }, { passive: false });
  addEventListener('resize', () => { if (day) drawMarks(); });
  listBtn.addEventListener('click', () => { evBox.hidden = !evBox.hidden; listBtn.classList.toggle('active', !evBox.hidden); if (!evBox.hidden) renderEvents(); });
  exitBtn.addEventListener('click', exit);
  dayBtn.addEventListener('click', () => { pause(); openDays(); });
  document.addEventListener('keydown', (e) => {
    if (!active || e.target.closest?.('input:not([type=range]), select, textarea')) return;
    if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
    else if (e.key === 'ArrowRight' && e.shiftKey) nextBtn.click();
    else if (e.key === 'ArrowLeft' && e.shiftKey) prevBtn.click();
    else if (e.key === 'Escape' && !dlg.open) exit();
  });

  return { active: () => active, exit, open: openDays, renderSetDays };
}
