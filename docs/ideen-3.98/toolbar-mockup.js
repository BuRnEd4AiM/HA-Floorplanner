// Only for the example pictures in this folder (injected into the demo with ?debug=1), not part of the add-on.
// Mock-up: tool bar with icons, labels under them and groups (example picture only)
window.mkToolbar = () => {
  const I = {
    select: '<path d="M5 3l13 7.5-5.5 1.6L10 18z"/>',
    wall: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 12h18M9 5v7M15 12v7"/>',
    room: '<path d="M4 4h16v16H4z"/><path d="M4 13h7v7M13 4v5h7"/>',
    autoRooms: '<path d="M4 20L15 9"/><path d="M15 3v3M19.5 5.5l-2 2M21 10h-3M11 5.5l2 2"/>',
    block: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    plot: '<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    hole: '<rect x="4" y="4" width="16" height="16" rx="1.5" stroke-dasharray="3 2.5"/>',
    opening: '<path d="M6 21V4h12v17"/><path d="M3 21h18"/><circle cx="15" cy="13" r="1"/>',
    device: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    measure: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7.5 12.5l2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>',
    erase: '<path d="M8 20h12"/><path d="M4.5 15.5l9-9.5 5.5 5.5-8.5 8.5H8.5z"/><path d="M9 11l5 5"/>',
    powerEditBtn: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    dormerBtn: '<path d="M3 12l9-7.5L21 12"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    toolsMoreBtn: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  };
  const label = { autoRooms: 'Erkennen', powerEditBtn: 'Strom', dormerBtn: 'Dach', toolsMoreBtn: 'Mehr', hole: 'Öffnung', opening: 'Tür/Fenster', plot: 'Garten' };
  const groups = [['', ['select']], ['ZEICHNEN', ['wall', 'room', 'autoRooms', 'stairs', 'hole', 'dormerBtn', 'plot']], ['SETZEN', ['opening', 'device', 'block']], ['WERKZEUGE', ['measure', 'erase', 'powerEditBtn', 'toolsMoreBtn']]];
  const tools = document.getElementById('tools');
  const key = (b) => b.dataset.tool || b.id;
  const byKey = {}; [...tools.querySelectorAll(':scope > button')].forEach((b) => { byKey[key(b)] = b; });
  const st = document.createElement('style');
  st.textContent = `
    #toolbar { background: rgba(14,19,26,.78) !important; backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.08); }
    #tools { display:flex !important; align-items:stretch; gap:6px !important; padding:4px 6px; border-radius:16px; background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); }
    .mkg { display:flex; flex-direction:column; gap:2px; }
    .mkg > i { font: 700 9.5px system-ui; letter-spacing:.08em; color:#7f8b98; font-style:normal; padding-left:6px; height:11px; }
    .mkg > div { display:flex; gap:2px; }
    .mkg + .mkg { border-left: 1px solid rgba(255,255,255,.09); padding-left:6px; }
    .mkb { display:flex !important; flex-direction:column; align-items:center; justify-content:center; gap:3px; min-width:58px; height:52px; padding:4px 6px !important;
      background: transparent !important; border: 1px solid transparent !important; border-radius: 12px !important; color:#cfd8e2 !important; font: 500 11.5px system-ui !important; }
    .mkb svg { width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
    .mkb:hover { background: rgba(255,255,255,.06) !important; }
    .mkb.active { background: linear-gradient(180deg, #2f8cff, #1f6fe0) !important; color:#fff !important; box-shadow: 0 6px 18px rgba(47,140,255,.35); }
    #toolsEditBtn { display:none !important; }
    #toolbar .group:not(#tools) button, #toolbar select { border-radius: 10px !important; }
  `;
  document.head.appendChild(st);
  groups.forEach(([name, keys]) => {
    const g = document.createElement('div'); g.className = 'mkg';
    g.innerHTML = `<i>${name}</i><div></div>`;
    keys.forEach((k) => {
      const b = byKey[k]; if (!b) return;
      const txt = label[k] || b.textContent.replace('▾', '').trim();
      b.classList.add('mkb'); b.hidden = false;
      b.innerHTML = `<svg viewBox="0 0 24 24">${I[k] || ''}</svg><span>${txt}</span>`;
      g.lastElementChild.appendChild(b);
    });
    tools.insertBefore(g, document.getElementById('toolsMore'));
  });
};
