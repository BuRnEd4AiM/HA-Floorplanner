// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of the owner's wish of 2026-10-23: one tab (e.g. 🌡 Klima) shows different things to different users. His choice: "Eigene
// Fassung je Benutzer": a page can have several versions ("Für alle", "Kinder", "Tablet Flur"), each with its own cards, and each
// user gets one of them. The pictures draw over the real 🌡 Klima page of the demo (its edit mode included).
window.mk418 = (() => {
  const css = `
  .mkVer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: -6px 0 14px; padding: 10px 14px; border-radius: 14px;
    background: color-mix(in srgb, #b07cff 13%, var(--panel)); border: 1px solid color-mix(in srgb, #b07cff 55%, transparent); position: relative; }
  .mkVer .lbl { font-weight: 800; font-size: 15px; margin-right: 2px; }
  .mkChipV { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--line); background: var(--field);
    font-weight: 700; font-size: 14px; color: var(--text); }
  .mkChipV small { color: var(--muted); font-weight: 600; font-size: 12px; }
  .mkChipV.on { background: color-mix(in srgb, #b07cff 30%, transparent); border-color: #b07cff; box-shadow: inset 0 0 0 1px #b07cff; }
  .mkChipV.add { border-style: dashed; color: #c9a8ff; border-color: color-mix(in srgb, #b07cff 70%, transparent); background: transparent; }
  .mkWho { margin-left: auto; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; color: var(--muted); }
  .mkWho b { color: var(--text); padding: 3px 9px; border-radius: 999px; background: var(--field); border: 1px solid var(--line); font-size: 13px; }
  .mkB { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field);
    color: var(--text); font-weight: 700; font-size: 13px; }
  .mkB.blue { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .mkB.purple { background: #8a5cf0; color: #fff; border-color: #8a5cf0; }
  .mkNew { position: absolute; top: -11px; left: 14px; padding: 2px 10px; border-radius: 999px; background: #46a758; color: #fff; font-size: 12px; font-weight: 800; z-index: 3; }
  .mkNote { position: absolute; z-index: 95; max-width: 320px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  .mkModal { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.55); display: grid; place-items: center; }
  .mkBox { width: min(900px, calc(100vw - 40px)); background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 20px 24px; color: var(--text);
    box-shadow: 0 30px 80px rgba(0,0,0,.6); position: relative; }
  .mkBox h3 { margin: 0 0 4px; font-size: 21px; } .mkBox .sub { color: var(--muted); margin: 0 0 14px; font-size: 14px; }
  .mkCols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 22px; }
  .mkF { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; } .mkF > label { font-size: 13px; color: var(--muted); font-weight: 700; }
  .mkIn { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font-size: 16px; font-weight: 600; }
  .mkEmo { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; } .mkEmo span { display: grid; place-items: center; height: 38px; border-radius: 10px; background: var(--field); font-size: 20px; border: 1px solid var(--line); }
  .mkEmo span.on { border-color: #b07cff; box-shadow: inset 0 0 0 1px #b07cff; background: color-mix(in srgb, #b07cff 22%, transparent); }
  .mkOpt { display: flex; gap: 10px; align-items: flex-start; padding: 9px 12px; border-radius: 10px; background: var(--field); border: 1px solid var(--line); margin-bottom: 6px; font-size: 14px; font-weight: 600; }
  .mkOpt small { display: block; color: var(--muted); font-weight: 500; font-size: 12px; margin-top: 1px; }
  .mkOpt.on { border-color: #b07cff; background: color-mix(in srgb, #b07cff 14%, var(--field)); }
  .mkRadio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--line); flex: none; margin-top: 1px; }
  .mkOpt.on .mkRadio { border: 5px solid #b07cff; }
  .mkUser { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; background: var(--field); border: 1px solid var(--line); margin-bottom: 6px; font-size: 15px; font-weight: 700; }
  .mkUser .ava { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 16px; flex: none; }
  .mkUser small { margin-left: auto; color: var(--muted); font-size: 12px; font-weight: 600; }
  .mkUser.on { border-color: #b07cff; background: color-mix(in srgb, #b07cff 14%, var(--field)); }
  .mkTick { width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; background: #8a5cf0; color: #fff; font-size: 14px; font-weight: 900; flex: none; }
  .mkTick.off { background: transparent; border: 2px solid var(--line); }
  .mkHint { color: var(--muted); font-size: 13px; line-height: 1.4; margin: 8px 0 0; }
  .mkBtns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
  .mkTable { width: 100%; border-collapse: separate; border-spacing: 0 6px; font-size: 14px; }
  .mkTable th { text-align: left; font-size: 13px; color: var(--muted); font-weight: 700; padding: 0 6px 2px; white-space: nowrap; }
  .mkTable td { padding: 6px; background: var(--field); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .mkTable td:first-child { border-left: 1px solid var(--line); border-radius: 12px 0 0 12px; font-weight: 800; white-space: nowrap; padding-left: 12px; }
  .mkTable td:last-child { border-right: 1px solid var(--line); border-radius: 0 12px 12px 0; }
  .mkTable td:first-child small { display: block; color: var(--muted); font-weight: 600; font-size: 12px; }
  .mkSel { display: inline-flex; align-items: center; gap: 5px; padding: 5px 9px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel);
    font-weight: 700; font-size: 13px; white-space: nowrap; }
  .mkSel::after { content: '▾'; color: var(--muted); font-size: 11px; margin-left: 2px; }
  .mkSel.v { border-color: #b07cff; background: color-mix(in srgb, #b07cff 20%, var(--panel)); }
  .mkSel.off { color: var(--muted); border-style: dashed; background: transparent; }
  .mkLegend { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); font-size: 13px; margin-top: 4px; }
  .mkAsBar { display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 12px; margin: 0 0 12px; background: #8a5cf0; color: #fff; font-weight: 700; font-size: 14px; }
  .mkAsBar .mkB { margin-left: auto; }
  `;
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const page = () => document.querySelector('.tabPage[data-page=climate]');
  function setup() {
    if (!document.getElementById('mk418css')) { const s = document.createElement('style'); s.id = 'mk418css'; s.textContent = css; document.head.append(s); }
  }
  const note = (text, style) => document.body.append(el(`<div class="mkNote" style="${style}">${text}</div>`));
  /** the masonry rows of the cards again after their content changed (pageboard.js does it with a ResizeObserver) */
  function relayout() {
    const its = [...page().querySelectorAll('.bdItem, .bdAdd')].filter((it) => it.style.display !== 'none');
    its.forEach((it) => { it.style.gridRowEnd = 'auto'; });
    its.map((it) => Math.max(1, Math.ceil((it.getBoundingClientRect().height + 14) / 22))).forEach((n, i) => { its[i].style.gridRowEnd = `span ${n}`; });
  }
  /** the version "Kinder": only the children's room (a thermostat without the extras) and a tip for children */
  function kids() {
    const p = page();
    p.querySelectorAll('.bdItem').forEach((it) => { if (!['room:r1', 'tip'].includes(it.dataset.key)) it.style.display = 'none'; });
    p.querySelectorAll('.tpTools').forEach((x) => { x.style.display = 'none'; });
    const c = p.querySelector('[data-key="room:r1"]');
    c.classList.remove('alert');
    c.querySelector('.clName').textContent = 'Kinderzimmer';
    c.querySelector('.clFloor').textContent = 'Obergeschoss';
    c.querySelector('.thNow').textContent = 'jetzt 20,2°';
    c.querySelectorAll('.th-presets, .clWarn, .thMode.m-auto').forEach((x) => x.remove());
    c.querySelector('.clTags .tpChip').textContent = 'Luft gut · 640 ppm';
    const tip = p.querySelector('[data-key="tip"]');
    const txt = [...tip.querySelectorAll('*')].find((x) => /Fenster/.test(x.textContent) && !x.children.length);
    if (txt) txt.textContent = 'Lüften: Fenster 5 Minuten ganz auf, dann wieder zu. Beim Lüften die Heizung auf „Aus“.';
    tip.style.gridColumn = 'span 1';
    relayout();
  }
  /** the purple strip under the edit strip: the versions of this page, who gets the chosen one */
  function versionBar(on) {
    const chips = [['👪', 'Für alle', 'Standard'], ['🧒', 'Kinder', ''], ['📟', 'Tablet Flur', '']].map(([i, n, s]) =>
      `<span class="mkChipV${n === on ? ' on' : ''}">${i} ${n}${s ? ` <small>${s}</small>` : ''}</span>`).join('');
    const who = on === 'Kinder' ? '<b>👧 Lena</b><b>👦 Tim</b>' : '<b>👨 Papa</b><b>👩 Mama</b><span>und alle ohne eigene Fassung</span>';
    const bar = el(`<div class="mkVer"><span class="mkNew">neu</span><span class="lbl">🗂 Fassung:</span>${chips}<span class="mkChipV add">＋ Neue Fassung</span>
      <span class="mkWho">Sehen diese Fassung: ${who}<span class="mkB">⚙ Einstellen</span><span class="mkB">👁 Ansehen als …</span></span></div>`);
    page().querySelector('.bdStrip').after(bar);
    relayout();
    return bar;
  }

  /** 1: the version "Kinder" of 🌡 Klima in the edit mode */
  function edit() {
    setup();
    kids();
    versionBar('Kinder');
    const b = page().querySelector('.mkVer').getBoundingClientRect();
    note('Eine Seite, mehrere Fassungen. Oben wählst du, welche du bearbeitest. Jede hat ihre eigenen Karten.', `left:${b.right - 380}px; top:${b.bottom + 180}px`);
    const k = page().querySelector('[data-key="room:r1"]').getBoundingClientRect();
    note('In der Fassung „Kinder“ nur das Kinderzimmer, ohne Eco/Komfort und ohne „Auto“. Was du hier änderst, sehen nur Lena und Tim.', `left:${k.right + 30}px; top:${k.top + 250}px`);
  }

  /** 2: a new version: name, icon, what it starts with, who gets it */
  function create() {
    setup();
    versionBar('Für alle');
    const users = [['👨', '#3b6fd8', 'Papa', 'Admin · hat „Für alle“', false], ['👩', '#d0489a', 'Mama', 'hat „Für alle“', false], ['👧', '#e0902a', 'Lena', '', true],
      ['👦', '#2fa36b', 'Tim', '', true], ['📟', '#6a7684', 'Tablet Flur', 'hat „Tablet Flur“', false]];
    document.body.append(el(`<div class="mkModal"><div class="mkBox">
      <h3>🗂 Neue Fassung von „🌡️ Klima“</h3><p class="sub">Eine eigene Zusammenstellung der Karten dieser Seite, für bestimmte Benutzer.</p>
      <div class="mkCols"><div>
        <div class="mkF"><label>Name</label><div class="mkIn">Kinder</div></div>
        <div class="mkF"><label>Symbol</label><div class="mkEmo">${['👪', '🧒', '📟', '👴', '🛏️', '🏠', '⭐', '🎮', '🧑‍💼', '👵', '🐶', '🌙', '🔧', '🛋️', '🚪', '📱'].map((e) => `<span class="${e === '🧒' ? 'on' : ''}">${e}</span>`).join('')}</div></div>
        <div class="mkF"><label>Anfangen mit</label>
          <div class="mkOpt on"><span class="mkRadio"></span><span>Kopie von „Für alle“<small>Alle Karten wie jetzt, dann wegnehmen, was nicht passt</small></span></div>
          <div class="mkOpt"><span class="mkRadio"></span><span>Kopie von „Tablet Flur“</span></div>
          <div class="mkOpt"><span class="mkRadio"></span><span>Leer<small>Nur die Karten, die du selbst hinzufügst</small></span></div>
        </div>
      </div><div>
        <div class="mkF"><label>Wer bekommt diese Fassung?</label>
          ${users.map(([i, c, n, s, on]) => `<div class="mkUser${on ? ' on' : ''}"><span class="mkTick${on ? '' : ' off'}">${on ? '✓' : ''}</span><span class="ava" style="background:${c}">${i}</span>${n}<small>${s}</small></div>`).join('')}
          <p class="mkHint">Jeder Benutzer bekommt <b>eine</b> Fassung je Seite. Wer keine eigene hat, sieht „Für alle“. Ein neuer Benutzer sieht auch erst „Für alle“.</p>
        </div>
      </div></div>
      <div class="mkBtns"><span class="mkB">Abbrechen</span><span class="mkB purple">✓ Anlegen und bearbeiten</span></div>
    </div></div>`));
    const box = document.querySelector('.mkBox').getBoundingClientRect();
    note('„Kopie von …“: du fängst nicht bei null an, sondern nimmst nur weg, was die Kinder nicht brauchen.', `left:${box.left - 300}px; top:${box.top + 330}px; max-width:270px`);
  }

  /** 3: what Lena sees on her phone (no edit, the version "Kinder"); the picture of papa's screen is the page as it is */
  function lena() {
    setup();
    kids();
    const keep = ['house', 'today', 'climate', 'media', 'family'];
    document.querySelectorAll('#tabBar [data-tab]').forEach((b) => { if (!keep.includes(b.dataset.tab)) b.style.display = 'none'; });
    document.querySelectorAll('#tabBar .tbRight').forEach((x) => { x.style.display = 'none'; });
    relayout();
  }

  /** 4: one table for everything: which user sees which tab, in which version */
  function table() {
    setup();
    versionBar('Für alle');
    const cols = ['☀️ Heute', '⚡ Energie', '🌡️ Klima', '📷 Kameras', '🎵 Musik & TV', '👨‍👩‍👧 Familie'];
    const A = 'Für alle', K = '🧒 Kinder', T = '📟 Tablet Flur', O = '—';
    const rows = [['👨 Papa', 'Admin', [A, A, A, A, A, A]], ['👩 Mama', '', [A, A, A, A, A, A]], ['👧 Lena', '', [K, O, K, O, A, A]], ['👦 Tim', '', [K, O, K, O, A, A]],
      ['📟 Tablet Flur', 'Vollbild', [T, A, T, A, O, A]]];
    const cell = (v) => `<span class="mkSel${v === O ? ' off' : v === A ? '' : ' v'}">${v === O ? 'aus' : v}</span>`;
    document.body.append(el(`<div class="mkModal"><div class="mkBox" style="width:min(1120px, calc(100vw - 40px))">
      <h3>👥 Wer sieht was</h3><p class="sub">Für jeden Benutzer und jede Seite: welche Fassung, oder „aus“ (der Reiter fehlt in seiner Leiste). Auch in ⚙ → 👥 Benutzer.</p>
      <table class="mkTable"><tr><th>Benutzer</th>${cols.map((c) => `<th>${c}</th>`).join('')}</tr>
        ${rows.map(([n, s, v]) => `<tr><td>${n}${s ? `<small>${s}</small>` : ''}</td>${v.map((x) => `<td>${cell(x)}</td>`).join('')}</tr>`).join('')}</table>
      <div class="mkLegend"><span><span class="mkSel">Für alle</span> die normale Seite</span><span><span class="mkSel v">🧒 Kinder</span> eine eigene Fassung</span><span><span class="mkSel off">aus</span> Reiter nicht zu sehen</span></div>
      <div class="mkBtns"><span class="mkB">Schließen</span><span class="mkB blue">✓ Speichern</span></div>
    </div></div>`));
    const box = document.querySelector('.mkBox').getBoundingClientRect();
    note('Lena und Tim haben auf ☀️ Heute und 🌡️ Klima die Fassung „Kinder“. Energie und Kameras sehen sie gar nicht.', `left:${box.left + 300}px; top:${box.bottom + 14}px; max-width:420px`);
  }
  return { edit, create, lena, table };
})();
