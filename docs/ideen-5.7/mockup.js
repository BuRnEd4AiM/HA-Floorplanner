// Beispielbilder „✨ Neu“ für Treppe, Bodenöffnung und den Haus-Baum (nur fürs Foto, ändert nichts am Plan)
window.v2mock = (spec) => {
  const props = document.getElementById('props'), body = document.getElementById('propsBody');
  props.classList.add('v2');
  const kids = [...body.children];
  const byLabel = (l) => kids.find((k) => k.classList?.contains('prop') && k.querySelector('label')?.textContent.trim() === l);
  body.textContent = '';
  const nav = document.createElement('nav'); nav.className = 'v2Crumbs';
  nav.innerHTML = spec.crumbs.map((c, i) => (i ? '<i>›</i>' : '') + `<button class="${i === spec.crumbs.length - 1 ? 'last' : 'c'}" type="button">${c}</button>`).join('');
  const head = document.createElement('div'); head.className = 'v2Head';
  head.innerHTML = `<div class="ic">${spec.icon}</div><b>${spec.title}</b><small>${spec.sub}</small>`
    + (spec.chips?.length ? `<div class="chips">${spec.chips.map(([t, c]) => `<span class="v2Chip ${c || ''}">${t}</span>`).join('')}</div>` : '')
    + `<div class="acts">${spec.acts.map(([ic, l, c]) => `<button type="button" class="${c || ''}"><span>${ic}</span><small>${l}</small></button>`).join('')}</div>`;
  body.append(nav, head);
  body.insertAdjacentHTML('beforeend', '<div class="v2SearchRow"><input class="v2Search" type="search" placeholder="🔍 Einstellung suchen … (z. B. Stufen, Breite)"></div>');
  if (spec.top) { const t = document.createElement('div'); t.className = 'v2Top'; spec.top.forEach((l) => { const r = byLabel(l); if (r) t.append(r); }); body.append(t); }
  for (const s of spec.sections) {
    const sec = document.createElement('section'); sec.className = 'v2Sec' + (s.open ? ' open' : '');
    sec.innerHTML = `<button class="hd" type="button"><span class="i">${s.icon}</span><b>${s.title}</b><span class="sum">${s.sum || ''}</span><span class="chev">${s.open ? '▴' : '▾'}</span></button>`;
    const bd = document.createElement('div'); bd.className = 'bd'; bd.hidden = !s.open;
    (s.labels || []).forEach((l) => { const r = byLabel(l); if (r) bd.append(r); });
    (s.sel || []).forEach((q) => { const r = kids.find((k) => k.matches?.(q)); if (r) bd.append(r); });
    (s.html || []).forEach((h) => bd.insertAdjacentHTML('beforeend', h));
    sec.append(bd); body.append(sec);
  }
  document.getElementById('panel').scrollTop = 0;
};

window.v2homeMock = () => {
  document.getElementById('planLockBox')?.remove();
  const house = document.querySelector('#v2Tree .n.h.cur');
  house.insertAdjacentHTML('beforeend', '<button class="lk none" type="button" title="Grundriss fertig: Wände und Räume im ganzen Haus sperren">🔓</button>'
    + '<button class="lk" type="button" style="margin-left:4px;font-size:16px" title="Mehr zum Haus">⋯</button>');
  const menu = document.createElement('div');
  menu.style.cssText = 'margin:6px 0 10px 28px;padding:6px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.04);display:grid;gap:4px';
  const item = (ic, txt, sub) => `<button type="button" style="display:flex;gap:10px;align-items:center;text-align:left;padding:8px 10px;border-radius:9px;width:100%"><span style="width:22px;text-align:center">${ic}</span><span><b style="font-weight:600">${txt}</b>${sub ? `<br><small style="opacity:.65">${sub}</small>` : ''}</span></button>`;
  menu.innerHTML = item('🏘', 'Gebäude in diesem Plan', 'Haupthaus und Gartenhaus getrennt, oben umschalten')
    + item('🏡', 'Nachbarhaus daneben zeigen', 'z. B. das Haus, zu dem die Brücke führt')
    + item('🖼', 'Vorlage (Grundriss-Bild)', 'Scan oder Foto zum Nachzeichnen')
    + item('⧉', 'Duplizieren · ✎ Umbenennen', '')
    + item('⇩', 'Als JSON speichern · aus Beschreibung bauen', '')
    + item('🗑', 'Haus löschen', '');
  house.after(menu);
  document.querySelectorAll('#housePanel, #buildingPanel, #bgPanel').forEach((d) => { d.style.display = 'none'; });
  document.getElementById('panel').scrollTop = 0;
};
