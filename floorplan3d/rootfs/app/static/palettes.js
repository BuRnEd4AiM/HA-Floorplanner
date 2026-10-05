/* Palettes (the library on the left): the device types by category and search, the 3D models you uploaded (and the ones that come with the add-on).
 * Which entries are shown is decided by pure functions (tested); initPalettes draws the buttons and loads / uploads / deletes models. */
import { DEVICE_TYPES, CATEGORIES, catOf, thumbnail, forgetGlb } from './models.js';

/* extra search words so the library also finds things under their everyday names */
export const SEARCH_ALIASES = {
  tv_led: 'led licht ambilight hintergrundlicht fernseher tv indirekt backlight',
  kitchenrun: 'küchenzeile küche kitchen spüle sink schrank cabinet unterschrank oberschrank',
  ledring: 'led ring streifen strip indirekt indirect voute cove decke ceiling rundum ringsum abschnitte sections',
  tv: 'fernseher fernsehen television tele glotze', tv_wall: 'fernseher wandfernseher wand tv fernsehen flachbild', tvstand: 'fernsehtisch lowboard tv-board fernseher', monitor: 'bildschirm pc display', sofa: 'couch', sofa2: 'couch ecksofa wohnlandschaft',
  fridge: 'kühlschrank kuehlschrank', washer: 'waschmaschine', boiler: 'warmwasser', speaker: 'lautsprecher box', vacuum: 'saugroboter staubsauger', router: 'wlan fritzbox internet',
  presence: 'person anwesenheit anwesend bewegung bewegungsmelder präsenz praesenz presence motion occupancy mensch',
  light: 'leuchte lampe', lamp: 'leuchte stehlampe', bed: 'doppelbett', wardrobe: 'schrank kleiderschrank', shelf: 'regal', bookcase: 'bücherregal buecherregal',
};

/** the device types shown in the library: not hidden, in the category (or all), and matching the search (name, key or an everyday name).
 *  types: { key: def }, opts: { cat, query, catOf(key), name(key) } */
export function filterDevices(types, { cat, query, catOf: catFn, name }) {
  const q = (query || '').trim().toLowerCase();
  return Object.entries(types).filter(([key, def]) => !def.hidden && (cat === 'all' || catFn(key) === cat)
    && (!q || name(key).toLowerCase().includes(q) || key.includes(q) || (SEARCH_ALIASES[key] || '').includes(q))).map(([key]) => key);
}

/** the models shown in the list: yours always, the shipped ones only when they match the search (upper and lower case, spaces and dashes do not matter) */
export function filterModels(models, query) {
  const q = (query || '').trim().toLowerCase().replace(/[\s-]+/g, '');
  return models.filter((m) => !m.builtin || !q || m.name.toLowerCase().replace(/-/g, '').includes(q));
}

/** ctx: $, t, getType(), setType(key), alert(text), onModelsChanged?() */
export function initPalettes(ctx) {
  const { $, t } = ctx;
  let cat = 'all', query = '', models = [];
  async function loadModels() {
    try { models = await (await fetch('api/models')).json(); } catch { models = []; }
  }
  function build() {
    const grid = $('#paletteGrid'), cats = $('#paletteCats');
    cats.innerHTML = '';
    ['all', ...Object.keys(CATEGORIES)].forEach((k) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = t(`cat.${k}`);
      b.classList.toggle('active', k === cat);
      b.addEventListener('click', () => { cat = k; build(); });
      cats.append(b);
    });
    grid.innerHTML = '';
    filterDevices(DEVICE_TYPES, { cat, query, catOf, name: (key) => t(`dev.${key}`) }).forEach((key) => {
      const b = document.createElement('button'); b.className = 'dev'; b.type = 'button';
      const url = thumbnail(key);
      if (url) { const im = document.createElement('img'); im.src = url; im.alt = ''; b.append(im); }
      const sp = document.createElement('span'); sp.textContent = t(`dev.${key}`); sp.title = t(`dev.${key}`); b.append(sp);
      b.classList.toggle('active', key === ctx.getType());
      b.addEventListener('click', () => { ctx.setType(key); build(); renderModels(); });
      grid.append(b);
    });
    renderModels();
  }
  function renderModels() {
    const box = $('#modelGrid');
    box.innerHTML = '';
    const shown = filterModels(models, query);
    if (!shown.length) {
      const n = document.createElement('div'); n.className = 'none'; n.textContent = t('panel.modelsEmpty');
      box.append(n);
      return;
    }
    shown.forEach((m) => {
      const b = document.createElement('button');
      b.className = 'model';
      b.title = m.name;
      b.textContent = m.name;
      b.classList.toggle('active', ctx.getType() === `glb:${m.name}`);
      const pick = () => { ctx.setType(`glb:${m.name}`); build(); };
      if (m.builtin) { b.addEventListener('click', pick); box.append(b); return; }
      const x = document.createElement('span'); x.className = 'x'; x.textContent = '×'; x.title = t('panel.delete');
      x.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!confirm(`${t('panel.deleteModel')} (${m.name})`)) return;
        await fetch(`api/models/${encodeURIComponent(m.name)}`, { method: 'DELETE' });
        forgetGlb(m.name);
        if (ctx.getType() === `glb:${m.name}`) ctx.setType('light');
        await loadModels(); build();
      });
      b.append(x);
      b.addEventListener('click', pick);
      box.append(b);
    });
  }
  $('#paletteSearch').addEventListener('input', (e) => { query = e.target.value; build(); });
  $('#modelFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch('api/models', { method: 'POST', body: fd });
      if (!r.ok) throw new Error((await r.json()).error || r.status);
      const m = await r.json();
      ctx.setType(`glb:${m.name}`);
      await loadModels(); build();
    } catch (err) { ctx.alert(`${t('panel.uploadFailed')}: ${err.message}`); }
  });
  return { build, loadModels, setCat: (k) => { cat = k; }, models: () => models };
}
