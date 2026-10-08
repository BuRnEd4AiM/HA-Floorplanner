/* Security (Sicherheit), the screen: the 🛡️ button in the tool bar, the list of recorded days, and the bar at the bottom with play,
 * pause, event to event, speed, a slider over the day with the events as little bars, and the list of what switched. While it is open
 * the house shows the recorded states instead of the live ones and nothing can be switched (the app pauses the live channel and locks
 * "control"). The rules (states at a moment, events ...) are in timeline.js. */
import { SPEEDS, parseDay, makePlayer, eventList, nextEvent, prevEvent, eventsAround, buckets, advance, eventKind, clock, dayChoices, todayIso } from './timeline.js';

const BARS = 96;                                          // the day in quarter hours

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
  const listBtn = b('📋', 'tl.events', 'tlListBtn');
  const last = el('span', 'tlLast');
  const track = el('div', 'tlTrack'), bars = el('div', 'tlBars'), slider = el('input');
  slider.type = 'range'; slider.min = '0'; slider.max = '1000'; slider.step = '1'; slider.value = '0'; slider.dataset.i18nTitle = 'tl.title';
  track.append(bars, slider);
  const ticks = el('div', 'tlTicks');
  [0, 6, 12, 18, 24].forEach((h) => ticks.append(el('span', null, `${String(h).padStart(2, '0')}:00`)));
  const evBox = el('div', 'tlEvents'); evBox.hidden = true;
  const row1 = el('div', 'tlRow');
  row1.append(exitBtn, dayBtn, time, prevBtn, playBtn, nextBtn, speedSel, listBtn);
  bar.append(row1, last, track, ticks, evBox);
  $('#stage').append(bar);

  let day = null, player = null, events = [], cur = 0, playing = false, raf = 0, lastTs = 0, shownIdx = -1, active = false;

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
    drawBars();
    seek(day.frames[0]?.t ?? day.start, true);                   // from the moment the recording of that day began
  }
  function drawBars() {
    const n = buckets(events, day.start, day.start + 86400 > day.end ? day.start + 86400 : day.end, BARS), max = Math.max(1, ...n);
    bars.replaceChildren(...n.map((v) => { const x = el('i'); x.style.height = v ? `${Math.max(12, (v / max) * 100)}%` : '0'; return x; }));
    const done = el('i', 'tlFuture'); done.style.left = `${Math.min(100, ((day.end - day.start) / 86400) * 100)}%`;   // today: the rest of the day is still to come
    bars.append(done);
  }
  const span = () => Math.max(day.end - day.start, 86400);
  function seek(tt, force = false) {
    if (!day) return;
    cur = Math.min(day.end, Math.max(day.start, tt));
    const r = player.seek(cur);
    slider.value = String(Math.round(((cur - day.start) / span()) * 1000));
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
  slider.addEventListener('input', () => { if (day) seek(day.start + (Number(slider.value) / 1000) * span()); });
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

  return { active: () => active, exit, open: openDays };
}
