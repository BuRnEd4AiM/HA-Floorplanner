/* Beispielbilder für docs/ideen-5.8 (2026-11-12): malt die Ideen nur fürs Foto in die echte Demo (nichts wird gespeichert).
 * Aufruf über make_pictures.py; jede Idee ist eine Funktion an window. */
(() => {
  const css = (id, s) => { let e = document.getElementById(id); if (!e) { e = document.createElement('style'); e.id = id; document.head.append(e); } e.textContent = s; };
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  css('mkBase', `
    .mkSeg { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: var(--field); max-width: 100%; }
    .mkSeg button { border: 0; border-radius: 0; background: none; padding: 6px 13px; min-height: 34px; color: var(--text); border-left: 1px solid var(--line);
      font-size: 13px; display: inline-flex; align-items: center; gap: 7px; box-shadow: none; }
    .mkSeg button:first-child { border-left: 0; }
    .mkSeg button.on { background: var(--accent); color: var(--accent-text); font-weight: 600; }
    .mkSw { width: 20px; height: 20px; border-radius: 6px; border: 1px solid rgba(255,255,255,.45); display: inline-block; flex: none; }
    .mkRange { display: flex; align-items: center; gap: 10px; width: min(320px, 58%); }
    .mkRange input { flex: 1; accent-color: var(--accent); }
    .mkRange output { min-width: 52px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
    .mkUnit { display: inline-flex; align-items: center; gap: 6px; } .mkUnit input { width: 96px !important; } .mkUnit span { color: var(--muted); }
    .mkMore { color: var(--accent); cursor: pointer; white-space: nowrap; }
    .mkClamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .mkNew { position: relative; }
    .mkNew::after { content: 'neu'; position: absolute; top: -8px; right: -6px; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 8px;
      background: #b06cff; color: #fff; letter-spacing: .03em; }
    .mkChips { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 16px; grid-column: 1 / -1; }
    .mkChip { border: 1px solid var(--line); background: var(--field); color: var(--text); border-radius: 999px; padding: 7px 14px; font-size: 13.5px; min-height: 36px; }
    .mkChip small { color: var(--muted); margin-left: 6px; font-size: 11.5px; }
    .mkChip.on { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 600; }
    .mkChip.on small { color: inherit; opacity: .75; }
    details.mkCard { grid-column: 1 / -1; border: 1px solid var(--line); border-radius: 12px; margin: 0 0 12px; background: color-mix(in srgb, var(--field) 45%, transparent); }
    details.mkCard > summary { list-style: none; display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; }
    details.mkCard > summary::-webkit-details-marker { display: none; }
    details.mkCard > summary::after { content: '▸'; margin-left: 4px; color: var(--muted); transition: transform .15s; }
    details.mkCard[open] > summary::after { transform: rotate(90deg); }
    details.mkCard[open] > summary { border-bottom: 1px solid var(--line); }
    details.mkCard > .mkIn { padding: 12px 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    details.mkCard > .mkIn > :not(.sgTile) { grid-column: 1 / -1; }
    .mkCi { font-size: 22px; width: 28px; text-align: center; }
    .mkCt { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .mkCt small { color: var(--muted); font-size: 12px; }
    .mkBadge { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
    .mkBadge.on { color: #3ddc84; border-color: #3ddc84; background: rgba(61,220,132,.12); }
    .mkBadge.warn { color: #ffb347; border-color: #ffb347; background: rgba(255,179,71,.12); }
    details.mkGuide { border: 1px dashed var(--line); border-radius: 10px; margin: 6px 0 12px; grid-column: 1 / -1; }
    details.mkGuide > summary { padding: 10px 12px; cursor: pointer; font-weight: 600; list-style: none; display: flex; gap: 10px; align-items: center; }
    details.mkGuide > summary::-webkit-details-marker { display: none; }
    details.mkGuide > summary small { font-weight: 400; color: var(--muted); }
    details.mkGuide > summary::after { content: '▸'; margin-left: auto; color: var(--muted); }
    details.mkGuide > :not(summary) { margin: 0 12px 12px; }
    .mkOk { color: #3ddc84; }
  `);

  /* ① Schalter statt Häkchen, Knopfleisten statt kurzer Listen, Schieberegler und Einheiten statt nackter Zahlen */
  const SEG = {
    setTheme: { holo: ['#050d1c', '#23e0ff'], dark: ['#0f1419', '#3fa9f5'], light: ['#eef1f4', '#1f8de0'] },
    setWindowFrames: { white: ['#f4f4f2'], anthracite: ['#383e42'] },
    setUi: {}, setUnits: {}, setPerf: {}, setBelowMode: {}, setHouseFloors: {}, setSky: {}, setLabels: {}, setNightDim: {}, setEarth: {},
  };
  const short = (s) => s.replace(/\s*\(.*$/, '').replace(/,.*$/, '').replace(/^Neu: Version 2$/, '✨ Neu').trim();
  window.mockControls = () => {
    css('mkCtl', `
      #settingsDialog .row.check { flex-direction: row-reverse; justify-content: space-between; gap: 14px; }
      #settingsDialog .row.check input[type=checkbox] { appearance: none; -webkit-appearance: none; width: 46px; height: 27px; border-radius: 14px; background: var(--field);
        border: 1px solid var(--line); position: relative; flex: none; margin: 0; }
      #settingsDialog .row.check input[type=checkbox]::after { content: ''; position: absolute; top: 2px; left: 2px; width: 21px; height: 21px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.4); }
      #settingsDialog .row.check input[type=checkbox]:checked { background: var(--accent); border-color: var(--accent); }
      #settingsDialog .row.check input[type=checkbox]:checked::after { transform: translateX(19px); }
      #settingsDialog.sgSide .sgTile .row .mkSeg { flex: none; }
    `);
    Object.entries(SEG).forEach(([id, sw]) => {
      const sel = document.getElementById(id); if (!sel || sel.nextElementSibling?.classList.contains('mkSeg')) return;
      const seg = h('div', 'mkSeg');
      [...sel.options].forEach((o) => {
        const b = h('button', o.value === sel.value ? 'on' : ''); b.type = 'button';
        const c = sw[o.value];
        if (c) { const s = h('i', 'mkSw'); s.style.background = c.length > 1 ? `linear-gradient(135deg, ${c[0]} 55%, ${c[1]} 55%)` : c[0]; b.append(s); }
        b.append(short(o.textContent)); seg.append(b);
      });
      sel.style.display = 'none'; sel.after(seg);
    });
    const range = (id, min, max, fmt) => {
      const inp = document.getElementById(id); if (!inp || inp.dataset.mk) return; inp.dataset.mk = 1;
      const v = parseFloat(inp.value) || 0;
      const w = h('div', 'mkRange'), r = h('input'); r.type = 'range'; r.min = min; r.max = max; r.step = 0.01; r.value = v;
      const out = h('output', '', fmt(v)); w.append(r, out); inp.style.display = 'none'; inp.after(w);
    };
    const pct = (v) => `${Math.round(v * 100)} %`;
    range('setWallOpacity', 0.2, 1, pct); range('setBelow', 0.05, 1, pct);
    const unit = (id, u, conv = (x) => x) => {
      const inp = document.getElementById(id); if (!inp || inp.dataset.mk) return; inp.dataset.mk = 1;
      const w = h('span', 'mkUnit'); inp.before(w); w.append(inp, h('span', '', u));
      inp.value = String(conv(parseFloat(inp.value))).replace('.', ',');
      inp.type = 'text';
    };
    unit('setWallHeight', 'm'); unit('setWallThickness', 'cm', (x) => Math.round(x * 100)); unit('setAutosave', 's');
    unit('setGlowRadius', 'm'); unit('setGlowHeight', 'm'); unit('setEarthMargin', 'm'); unit('setIdleReturn', 'min');
    // die Beschriftungen ohne die Einheit in Klammern, die steht jetzt am Feld
    $$('#settingsDialog label').forEach((l) => { l.innerHTML = l.innerHTML.replace(/\s*\((m|s|0,2–1|0,05–1)\)/, ''); });
  };

  /* lange graue Erklärungen auf zwei Zeilen kürzen, mit „mehr …“ */
  window.mockClamp = (maxChars = 200) => {
    $$('#settingsDialog .sgTile p.sub, #settingsDialog .sgBody > p.hint').forEach((p) => {
      if (p.closest('[hidden]') || p.textContent.length < maxChars || p.dataset.mk) return; p.dataset.mk = 1;
      p.classList.add('mkClamp');
      if (p.scrollHeight <= p.clientHeight + 2) { p.classList.remove('mkClamp'); return; }   // passt schon auf zwei Zeilen: kein „mehr“
      const m = h('div', 'sub', '<span class="mkMore">mehr …</span>'); m.style.marginTop = '2px'; p.after(m);
    });
  };

  /* ② „Reiter unten“: je Seite ein Knopf oben, darunter nur die Einstellungen dieser Seite */
  window.mockTabsPages = (pick) => {
    const body = $('.setGroup[data-group=tabs] .sgBody');
    const pages = []; let cur = null;
    [...body.children].forEach((k) => {
      if (k.tagName === 'H4') { cur = { h: k, els: [k] }; pages.push(cur); } else if (cur) cur.els.push(k);
    });
    const bar = h('div', 'mkChips');
    const count = (p) => {
      const boxes = p.els.flatMap((e) => $$('input[type=checkbox]', e)); const on = boxes.filter((b) => b.checked).length;
      return boxes.length ? `${on || 'alle'}` : '';
    };
    pages.forEach((p, i) => {
      const b = h('button', 'mkChip' + (i === pick ? ' on' : '')); b.type = 'button';
      b.textContent = p.h.textContent.replace(/:.*$/, '').replace(' und Pinnwand', ' & Pinnwand').replace('Wer ist zu Hause', 'Zu Hause');
      p.els.forEach((e) => { e.style.display = i === pick ? '' : 'none'; });
      bar.append(b);
    });
    pages[pick].h.style.display = 'none';
    pages[0].h.before(bar);
    const tip = h('p', 'sub', 'Jeder Knopf ist eine Seite der Leiste unten. Was du hier einstellst, gilt nur für diese Seite.'); tip.style.gridColumn = '1 / -1'; tip.style.margin = '-6px 0 10px';
    bar.after(tip);
    return count;
  };

  /* ③ „Warnungen & Alarm“: drei Karten mit Zustand, zum Aufklappen */
  window.mockAlarm = (openIdx = 0) => {
    const body = $('.setGroup[data-group=alarm] .sgBody');
    const guard = $('#guardBox'), nt = $('#alarmNotifyTitle'), nb = $('#alarmNotify'), noff = $('#alarmNotifyOff');
    const kids = [...body.children];
    const first = kids.slice(0, kids.indexOf(guard));
    const card = (icon, title, sub, badge, cls, els, open) => {
      const d = h('details', 'mkCard'); d.open = open;
      d.append(h('summary', '', `<span class="mkCi">${icon}</span><span class="mkCt"><b>${title}</b><small>${sub}</small></span><span class="mkBadge ${cls}">${badge}</span>`));
      const inn = h('div', 'mkIn'); inn.append(...els); d.append(inn); return d;
    };
    const intro = h('p', 'sub', 'Drei Teile: was oben im Bild warnt, die eigene Alarmanlage für den Urlaub und die Nachricht aufs Handy. Antippen klappt einen Teil auf.');
    intro.style.gridColumn = '1 / -1';
    body.append(intro,
      card('⚠️', 'Warnungen im Bild', 'Rauch, Gas, CO, Wasser, Alarmanlage, Fenster offen bei Regen · rotes Banner oben', 'An', 'on', first, openIdx === 0),
      card("🛡️", "Urlaubs-Alarm", `3 Türen und Fenster gewählt · Code gespeichert · 20 s zum Rausgehen`, 'Unscharf', '', [guard], openIdx === 1),
      card('📲', 'Nachricht aufs Handy', 'WhatsApp über CallMeBot · noch nicht eingerichtet', 'Aus', 'warn', [nt, nb, noff].filter(Boolean), openIdx === 2));
    first.forEach((e) => { if (e.tagName === 'P' && e.classList.contains('hint')) e.style.display = 'none'; });
  };

  /* ④ Anleitungen, die man nur einmal braucht, eingeklappt */
  const fold = (el, title, sub) => {
    if (!el || el.closest('details.mkGuide')) return;
    const d = h('details', 'mkGuide'); d.append(h('summary', '', `${title}${sub ? ` <small>${sub}</small>` : ''}`));
    el.before(d); d.append(el);
    const hd = el.querySelector(':scope > h4, :scope > b'); if (hd) hd.style.display = 'none';
  };
  window.mockGuides = () => {
    fold($('.tabletGuide'), '📖 Anleitung: Wandtablet einrichten', '5 Schritte · Text der Karte zum Kopieren');
    fold($('#vcGuide'), '📖 Anleitung: Home Assistant Assist einrichten', 'für die App und Wandtablets');
    const st = $('#vcStatus'), vk = $('#vkBox');
    if (st && vk) {
      const now = st.querySelector('.now')?.textContent.replace(/^✓\s*/, '') || '';
      const box = h('div'); st.before(box); box.append(st, vk);
      fold(box, `🩺 Geht es auf diesem Gerät? <span class="mkOk">✓ ${now.replace('Auf diesem Gerät: ', '')}</span>`, 'Einzelheiten und Mikrofon-Test');
    }
    const steps = $('#alarmNotify .anSteps'); if (steps) fold(steps, '📖 So richtest du WhatsApp ein', '3 Schritte');
  };

  /* ⑤ Licht-Gruppen: Räume als Knöpfe zum Antippen, im Kopf wie viele gewählt sind */
  window.mockLightGroups = () => {
    css('mkLg', `
      .lgFloor { gap: 6px !important; }
      .lgFloor label { display: inline-flex; align-items: center; padding: 5px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--field); font-size: 13px; min-height: 32px; }
      .lgFloor label input { display: none; }
      .lgFloor label:has(input:checked) { background: #ffcf70; color: #2a1d00; border-color: #ffcf70; font-weight: 600; }
      .lgFloor label:has(input:checked)::before { content: '💡'; margin-right: 5px; }
      .lgFloor small { margin-top: 4px; }
      .mkLgN { color: var(--muted); font-size: 12.5px; white-space: nowrap; align-self: center; }
    `);
    $$('.lgEdit').forEach((ed) => {
      const head = ed.querySelector('.lgEditHead'); const n = $$('input[type=checkbox]:checked', ed).length;
      if (head && !head.querySelector('.mkLgN')) head.lastElementChild.before(h('span', 'mkLgN', `💡 ${n} Räume`));
    });
  };

  /* ⑥ Kopfleiste beim Bearbeiten: Anleitung, Backup, Sicherheit in einem Menü „⋯“, die Werkzeuge etwas schmaler: zwei Zeilen statt vier */
  window.mockHeader = (openMenu) => {
    css('mkHd', `
      #tools > button { padding-left: 7px !important; padding-right: 7px !important; min-width: 0 !important; }
      #toolbar { row-gap: 6px; }
      .mkMoreMenu { position: fixed; z-index: 99; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 6px; display: flex; flex-direction: column;
        gap: 2px; min-width: 230px; box-shadow: 0 10px 30px rgba(0,0,0,.45); backdrop-filter: blur(10px); }
      .mkMoreMenu button { text-align: left; justify-content: flex-start; border: 0; background: none; padding: 9px 12px; border-radius: 8px; }
      .mkMoreMenu button:hover, .mkMoreMenu button:first-child { background: color-mix(in srgb, var(--accent) 14%, transparent); }
      .mkMoreMenu small { display: block; color: var(--muted); font-size: 11.5px; }
    `);
    const right = $('#toolbar .group.right');
    const hide = ['#guideBtn', '#backupBtn', '#tlBtn', '#timelineBtn'];
    const moved = [];
    hide.forEach((s) => { const b = $(s); if (b) { moved.push(b.textContent.trim()); b.style.display = 'none'; } });
    $$('#toolbar .group.right > button').forEach((b) => { if (/Sicherheit/.test(b.textContent) && b.style.display !== 'none') { moved.push(b.textContent.trim()); b.style.display = 'none'; } });
    const more = h('button', 'icon mkNew', '⋯'); more.type = 'button'; more.title = 'Mehr';
    $('#settingsBtn').before(more);
    if (openMenu) {
      requestAnimationFrame(() => {
        const r = more.getBoundingClientRect();
        const m = h('div', 'mkMoreMenu', `
          <button>🎬 Anleitung<small>Videos zu jeder Funktion</small></button>
          <button>🗄️ Backup<small>Sichern, zurückholen, automatische Sicherung</small></button>
          <button>🛡️ Sicherheit<small>Einen Tag abspielen: was wann an war</small></button>`);
        document.body.append(m); m.style.top = `${r.bottom + 6}px`; m.style.left = `${Math.min(r.right - 230, innerWidth - 240)}px`;
      });
    }
    return moved;
  };

  /* ⑦ Handy: Etage und Zimmer in einem Knopf (ein Menü: oben die Etagen, darunter die Zimmer), der Alarm nur als 🛡️: so ist alles ganz zu lesen */
  window.mockPhoneTop = (open) => {
    const g = $('#guardBtn'); if (g) { g.textContent = '🛡️'; g.style.minWidth = '0'; g.style.padding = '7px 11px'; }
    const rb = $('#roomMenuBtn'); if (rb) rb.style.display = 'none';
    const fb = $('#phoneNavBtn'); fb.style.maxWidth = 'none'; fb.innerHTML = '<span style="color:#3ddc84">●</span> Erdgeschoss ▾';
    if (!open) return;
    css('mkPh', `
      .mkPhMenu { position: absolute; top: 54px; left: 60px; right: 12px; z-index: 40; background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
        padding: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.45); display: flex; flex-direction: column; gap: 8px; }
      .mkPhMenu h5 { margin: 2px 2px 0; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
      .mkPhFl { display: flex; flex-wrap: wrap; gap: 6px; }
      .mkPhFl .pill { padding: 6px 11px; font-size: 13px; }
      .mkPhFl .pill.active { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 600; }
      .mkPhRooms { display: flex; flex-direction: column; gap: 6px; }
      .mkPhRooms .pill { text-align: left; padding: 9px 14px; }
      .mkPhRooms .pill.occ::before { content: '● '; color: #3ddc84; }
    `);
    const fl = [...document.querySelectorAll('#phoneNav .pill')].map((b) => b.textContent.trim());
    const rooms = [...document.querySelectorAll('#roomMenu .pill')].map((b) => [b.textContent.trim(), b.classList.contains('occupied')]);
    const m = h('div', 'mkPhMenu');
    m.append(h('h5', '', 'Etage'));
    const row = h('div', 'mkPhFl'); fl.forEach((f) => row.append(h('button', 'pill' + (f === 'Erdgeschoss' ? ' active' : ''), f))); m.append(row);
    m.append(h('h5', '', 'Zimmer im Erdgeschoss'));
    const rl = h('div', 'mkPhRooms'); rooms.forEach(([r, o]) => rl.append(h('button', 'pill' + (o ? ' occ' : ''), r))); m.append(rl);
    $('#stage').append(m);
  };
})();
