/* 📊 Monatsbericht in the settings (5.26.0, docs/ideen-5.15 picture 11): the card under "🚨 Warnungen & Alarm" next to 📲 Benachrichtigung:
 * on / off, the day of the month and the hour it is sent (settings.monthReport, checked by monthreport.py on the server, which also makes
 * and sends it), "👁 Vorschau" with last month's numbers per room as bars (api/monthreport) and "📨 Jetzt senden" (api/monthreport/send). */

/** ctx: t, settings() (the settings object), save() (stores the settings), canEdit() */
export function initMonthReportUi(ctx) {
  const { t } = ctx;
  const box = document.getElementById('monthReport');
  if (!box) return { render() {} };
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const cfg = () => ({ on: false, day: 1, hour: 8, ...(ctx.settings().monthReport || {}) });
  const set = (patch) => { ctx.settings().monthReport = { ...cfg(), ...patch }; ctx.save(); hint.textContent = when(); badge(); };
  /** "An" / "Aus" in the card's head, like the other cards of "Warnungen & Alarm" (setsections.js) */
  const badge = () => {
    const b = box.closest('details.sgCard')?.querySelector('.sgBadge');
    if (b) { b.className = `sgBadge ${cfg().on ? 'on' : 'off'}`; b.textContent = t(`sg.badge.${cfg().on ? 'on' : 'off'}`); }
  };
  const when = () => (cfg().on ? t('mr.when', { day: cfg().day, hour: cfg().hour }) : t('mr.offHint'));
  let hint = null;

  function bars(rep, out) {
    out.replaceChildren();
    out.append(make('pre', 'mrText', rep.text || ''));
    const top = Math.max(1, ...(rep.rooms || []).map((r) => r.heat + r.power));
    (rep.rooms || []).forEach((r) => {
      const row = make('div', 'mrRow');
      const bar = make('span', 'mrBar');
      const h = make('i', 'mrHeat'); h.style.width = `${(r.heat / top) * 100}%`;
      const p = make('i', 'mrPower'); p.style.width = `${(r.power / top) * 100}%`;
      bar.append(h, p);
      const unit = rep.heatUnit === rep.powerUnit ? ` ${rep.powerUnit}` : '';
      row.append(make('span', 'mrName', r.name), bar, make('b', 'mrSum', `${r.heat + r.power}${unit}`));
      out.append(row);
    });
    if ((rep.rooms || []).length) {
      const legend = make('p', 'sub mrLegend');
      legend.append(make('span', 'mrDot heat'), ` ${t('mr.heat')}  `, make('span', 'mrDot power'), ` ${t('mr.power')}`);
      out.append(legend);
    }
  }

  function render() {
    const c = cfg(), edit = ctx.canEdit();
    box.replaceChildren();
    box.append(make('p', 'hint', t('mr.help')));
    const on = make('input'); on.type = 'checkbox'; on.id = 'setMrOn'; on.checked = c.on; on.disabled = !edit;
    const onRow = make('div', 'row check'); const onLab = make('label', '', t('mr.on')); onLab.htmlFor = 'setMrOn'; onRow.append(on, onLab);
    const day = make('select'); day.id = 'setMrDay'; day.disabled = !edit;
    for (let d = 1; d <= 28; d++) day.add(new Option(t('mr.dayOpt', { d }), String(d)));
    day.value = String(c.day);
    const hour = make('select'); hour.id = 'setMrHour'; hour.disabled = !edit;
    for (let h = 0; h < 24; h++) hour.add(new Option(t('mr.hourOpt', { h }), String(h)));
    hour.value = String(c.hour);
    const dayRow = make('div', 'row'); const dl = make('label', '', t('mr.day')); dl.htmlFor = 'setMrDay'; dayRow.append(dl, day);
    const hourRow = make('div', 'row'); const hl = make('label', '', t('mr.hour')); hl.htmlFor = 'setMrHour'; hourRow.append(hl, hour);
    hint = make('p', 'sub mrWhen', when());
    on.addEventListener('change', () => set({ on: on.checked }));
    day.addEventListener('change', () => set({ day: Number(day.value) }));
    hour.addEventListener('change', () => set({ hour: Number(hour.value) }));
    const out = make('div', 'mrPreview');
    const status = make('p', 'sub mrStatus');
    const preview = make('button', 'bdBtn small', `👁 ${t('mr.preview')}`); preview.type = 'button'; preview.id = 'mrPreview';
    preview.addEventListener('click', async () => {
      status.textContent = t('mr.loading'); out.replaceChildren();
      try {
        const r = await fetch('api/monthreport');
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || r.status);
        status.textContent = ''; bars(j, out);
      } catch (err) { status.textContent = t('mr.failed', { err: err.message }); }
    });
    const send = make('button', 'bdBtn small', `📨 ${t('mr.send')}`); send.type = 'button'; send.id = 'mrSend'; send.hidden = !edit;
    send.addEventListener('click', async () => {
      status.textContent = t('mr.loading');
      try {
        const r = await fetch('api/monthreport/send', { method: 'POST' });
        const j = await r.json();
        status.textContent = j.ok ? t('mr.sent') : t('mr.failed', { err: j.error || r.status });
      } catch (err) { status.textContent = t('mr.failed', { err: err.message }); }
    });
    const btns = make('div', 'mrBtns'); btns.append(preview, send);
    box.append(onRow, dayRow, hourRow, hint, btns, status, out);
    badge();
  }
  render();
  return { render };
}
