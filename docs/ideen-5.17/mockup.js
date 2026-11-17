/* Beispielbilder für docs/ideen-5.17 (2026-11-17): der Helfer „🌙 Nachtlicht-Weg“, der einen normalen Ablauf anlegt (Wahl des Besitzers:
 * erst Bilder, dann bauen; der Ablauf läuft in Home Assistant). Nur fürs Foto in die echte Demo gemalt; braucht die Stile von
 * docs/ideen-5.15/mockup.js (make_pictures.py lädt beide). Aufruf: mockNight(1 … 4). */
(() => {
  const $ = (s) => document.querySelector(s);
  const fp = () => window.__fp;
  const layer = () => { let l = $('#mkLayer'); if (!l) { l = document.createElement('div'); l.id = 'mkLayer'; document.body.append(l); } return l; };
  const add = (html) => { const d = document.createElement('div'); d.innerHTML = html; const e = d.firstElementChild; layer().append(e); return e; };
  const card = (html, pos, w = 380) => { const e = add(`<div class="mkCard" style="width:${w}px">${html}</div>`); Object.assign(e.style, pos); return e; };
  function mark(id, html, cls = '', dx = 0, dy = 0) {
    const p = fp().screenOf(id); if (!p) return null;
    const e = add(`<div class="mkMark ${cls}">${html}</div>`); e.style.left = `${p.x + dx}px`; e.style.top = `${p.y + dy}px`;
    return p;
  }
  function path(ids, color = '#ffd27a') {
    const pts = ids.map((id) => fp().screenOf(id)).filter(Boolean);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    add(`<svg class="mkSvg" width="${innerWidth}" height="${innerHeight}"><path d="${d}" stroke="${color}" stroke-width="22" opacity=".35" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" stroke="${color}" stroke-width="7" stroke-dasharray="2 14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  }
  const row = (a, b = '', cls = '') => `<div class="mkRow ${cls}"><span>${a}</span><b>${b}</b></div>`;
  const sw = (on = true) => `<span class="mkSw ${on ? 'on' : ''}"><i></i></span>`;
  const btn = (t, cls = '') => `<span class="mkBtn ${cls}">${t}</span>`;
  const chip = (t, cls = '') => `<span class="mkChip ${cls}">${t}</span>`;
  const steps = (n) => `<div style="display:flex;gap:6px;margin:2px 0 10px">${[1, 2, 3].map((i) => `<span class="mkChip ${i === n ? 'yellow' : i < n ? 'green' : ''}">${i < n ? '✓' : i}. ${['Start', 'Lampen', 'Wann'][i - 1]}</span>`).join('')}</div>`;
  const head = (n, title, sub) => `<h3>🌙 Nachtlicht-Weg</h3>${steps(n)}<div style="font-weight:700;font-size:16px;margin-bottom:2px">${title}</div><div class="mkSub">${sub}</div>`;
  const css = document.createElement('style');
  css.textContent = `.mkPick { padding: 7px 12px !important; font-size: 14px !important; } .mkMark.pick { background: #2f7dd8; border-color: #bcd8ff; }
    .mkMark.num { padding: 0 !important; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; transform: translate(-50%, -50%); font-size: 15px; }
    .mkMark.num::after { display: none; } .mkFlow { display: flex; flex-direction: column; gap: 6px; } .mkFlow .mkRow b { font-weight: 600; }
    .mkTag { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #8fa3bd; margin: 8px 0 2px; }`;
  document.head.append(css);

  const STEPS = {
    1() {
      mark('d12', '🛏 Schlafzimmer · Bewegung am Bett ✓', 'pick mkPick', 0, -14);
      mark('d18', '🚶 Büro · Präsenz', 'shade', 0, -14);
      mark('d4', '🚶 Wohnzimmer · Bewegung', 'shade', 0, -14);
      card(head(1, 'Wo startet der Weg?', 'Tippe den Bewegungsmelder an, bei dem das Licht angehen soll. Blau = gewählt.')
        + row('Bewegungsmelder', '🛏 Bewegung Schlafzimmer', 'good') + row('Nur wenn das Bett belegt war (Bett-Sensor)', sw(false))
        + `<div style="margin-top:10px">${btn('Weiter →', 'blue')}${btn('Abbrechen', 'ghost')}</div>`, { right: '24px', top: '64px' });
    },
    2() {
      path(['d12', 'd19', 'd15']);
      mark('d12', '🛏 Start', 'shade', 0, 60);
      mark('d19', '1', 'glow num'); mark('d19', '💡 Flurlicht · 10 %', 'glow', 0, -22);
      mark('d15', '2', 'glow num'); mark('d15', '💡 Badlicht · 20 %', 'glow', 0, -22);
      card(head(2, 'Lampen auf dem Weg antippen', 'In der Reihenfolge des Wegs. Je Lampe: wie hell. Die Lampen gehen schwach und warm an, nicht grell.')
        + row('1 · 💡 Flurlicht', `${chip('10 %', 'yellow')} ${chip('warmweiß')}`) + row('2 · 💡 Badlicht', `${chip('20 %', 'yellow')} ${chip('warmweiß')}`)
        + `<div class="mkSub" style="margin-top:8px">Noch eine Lampe? Einfach im Haus antippen.</div>`
        + `<div style="margin-top:10px">${btn('← Zurück', 'ghost')}${btn('Weiter →', 'blue')}</div>`, { right: '24px', top: '64px' });
    },
    3() {
      path(['d12', 'd19', 'd15']);
      card(head(3, 'Wann und wie lange?', 'Danach legt der Helfer einen normalen Ablauf an – in Home Assistant, du kannst ihn jederzeit ändern.')
        + row('Wann', '23:00 – 6:00') + row('… oder einfach: wenn es dunkel ist', sw(false)) + row('Aus nach', '3 Min ohne Bewegung')
        + row('Neue Bewegung verlängert die Zeit', sw(true)) + row('Lampe war schon an → bleibt, wie sie war', sw(true))
        + `<div class="mkTag">Vorher geprüft</div>`
        + row('⚠️ Flurlicht steckt schon in „Flurlicht nachts“', btn('ansehen', 'ghost'), 'warn')
        + `<div class="mkSub" style="margin:6px 0 0">Zwei Abläufe für dieselbe Lampe können sich stören. Der Helfer kann den alten abschalten.</div>`
        + `<div style="margin-top:6px">${row('Alten Ablauf „Flurlicht nachts“ abschalten', sw(true))}</div>`
        + `<div style="margin-top:10px">${btn('← Zurück', 'ghost')}${btn('✓ Ablauf anlegen', 'green')}</div>`, { right: '24px', top: '64px' }, 420);
    },
    4() {
      card(`<h3>▶ Abläufe</h3><div class="mkSub">Neu angelegt vom Helfer „🌙 Nachtlicht-Weg“ · läuft in Home Assistant ${chip('🏠 Home Assistant', 'green')}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 4px"><b style="font-size:16px">🌙 Nachtlicht: Schlafzimmer → Bad</b>${sw(true)}</div>
        <div class="mkFlow">
          <div class="mkTag">Wenn</div>${row('🚶 Bewegung Schlafzimmer', 'erkannt')}
          <div class="mkTag">Nur wenn</div>${row('🕐 Uhrzeit', '23:00 – 6:00')}
          <div class="mkTag">Dann</div>${row('💡 Flurlicht', '10 % · warmweiß')}${row('💡 Badlicht', '20 % · warmweiß')}
          <div class="mkTag">Warten</div>${row('⏳ bis 3 Min keine Bewegung', '(neue Bewegung: von vorn)')}
          <div class="mkTag">Dann</div>${row('↩ Lampen wie vorher', 'was an war, bleibt an')}
        </div>
        <div style="margin-top:10px">${btn('✏ Ändern', 'blue')}${btn('▶ Jetzt ausprobieren', 'ghost')}${btn('🌙 Weg im Haus zeigen', 'ghost')}</div>
        <div class="mkSub" style="margin-top:8px">„Flurlicht nachts“ ist abgeschaltet (vom Helfer, auf Wunsch).</div>`, { left: '50%', top: '80px', transform: 'translateX(-50%)' }, 520);
    },
  };
  window.mockNight = (n) => { layer().innerHTML = ''; STEPS[n](); return layer().children.length; };
})();
