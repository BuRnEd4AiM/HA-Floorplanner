/* Import dialog: paste / load a property JSON (or GeoJSON), check it (dry run) and build a new house from it. */

/** Prompt for an AI assistant. Built from the live schema so the lists of device types and presets are always current. */
export async function buildPrompt(lang) {
  let types = [], presets = [], example = '';
  try {
    const sc = await (await fetch('api/import/schema')).json();
    types = sc.$defs.device.properties.type.enum;
    presets = sc.$defs.opening.properties.preset.enum;
    example = JSON.stringify(await (await fetch('api/import/examples/flat')).json());
  } catch { /* offline: the prompt still works without the lists */ }
  const de = lang === 'de';
  return de ? `Du bist Assistent für das Home-Assistant-Add-on "3D Floorplan". Erzeuge aus meiner Beschreibung (Text, Maße und/oder Foto eines Grundrisses) GENAU EINE JSON-Datei in diesem Format und antworte NUR mit dem JSON in einem Codeblock.

REGELN
- Alle Längen in Metern. x geht nach rechts (Osten), z nach unten (Süden), Norden ist oben. Ursprung (0,0) ist die linke obere Außenecke des Gebäudes.
- Gebäude: "building" mit "footprint" (Außenumriss als Liste von [x,z]-Punkten, Wand-Mittellinie, ohne den ersten Punkt am Ende zu wiederholen) und "floors" (Liste von Etagen, kind: "floor" | "basement" | "roof"). Alle Etagen nutzen dasselbe Koordinatensystem.
- Räume: pro Etage "rooms": [{ "name", "points": [[x,z],...] }]. Räume überlappen nicht, grenzen lückenlos aneinander und teilen sich Eckpunkte mit IDENTISCHEN Koordinaten. Die Wände werden automatisch aus Umriss und Räumen erzeugt - gib keine "walls" an.
- Türen und Fenster: pro Etage "openings": [{ "preset": "...", "at": [x,z] }]; "at" ist ein Punkt auf der Wand (Mitte der Öffnung). Optional width, height, sill (Brüstung), entity (Kontaktsensor).
  Presets: ${presets.join(', ')}
- Möbel, Lampen, Sensoren: pro Etage "devices": [{ "type", "x", "z", "rot" (Grad), "y" (Höhe in m, optional), "name", "entity" }]. Nur diese Typen: ${types.join(', ')}
- Dach: "building.roof": { "type": "gable" | "hip" | "flat", "pitch": 35, "overhang": 0.4 }.
- Grundstück (optional): "plot": { "boundary": [[x,z],...], "objects": [{ "type": "lawn|terrace|path|tree|bush|fence|pool|car", "x", "z", "scale" }] } und "building.origin": [x,z] = Position der Gebäude-Ecke (0,0) auf dem Grundstück.
- "entity" nur eintragen, wenn ich eine Home-Assistant-Entität nenne (z. B. light.wohnzimmer). Sonst leer lassen.
- Fehlen Angaben, triff vernünftige Annahmen und nenne sie nach dem Codeblock in einem kurzen Satz.
- Beginne mit { "schemaVersion": 1, "name": "..." }.

BEISPIEL (Wohnung)
${example}

MEINE BESCHREIBUNG
(hier Beschreibung, Maße oder Foto ergänzen)` : `You are an assistant for the Home Assistant add-on "3D Floorplan". From my description (text, measurements and/or a photo of a floor plan) produce EXACTLY ONE JSON file in this format and answer ONLY with the JSON in a code block.

RULES
- All lengths in metres. x runs right (east), z runs down (south), north is up. Origin (0,0) is the top-left outer corner of the building.
- Building: "building" with "footprint" (outer outline as a list of [x,z] points, wall centre line, do not repeat the first point at the end) and "floors" (list of floors, kind: "floor" | "basement" | "roof"). All floors use the same coordinate system.
- Rooms: per floor "rooms": [{ "name", "points": [[x,z],...] }]. Rooms do not overlap, touch without gaps and share corner points with IDENTICAL coordinates. Walls are generated automatically from the outline and the rooms - do not give "walls".
- Doors and windows: per floor "openings": [{ "preset": "...", "at": [x,z] }]; "at" is a point on the wall (centre of the opening). Optional width, height, sill, entity (contact sensor).
  Presets: ${presets.join(', ')}
- Furniture, lamps, sensors: per floor "devices": [{ "type", "x", "z", "rot" (degrees), "y" (height in m, optional), "name", "entity" }]. Only these types: ${types.join(', ')}
- Roof: "building.roof": { "type": "gable" | "hip" | "flat", "pitch": 35, "overhang": 0.4 }.
- Plot (optional): "plot": { "boundary": [[x,z],...], "objects": [{ "type": "lawn|terrace|path|tree|bush|fence|pool|car", "x", "z", "scale" }] } and "building.origin": [x,z] = position of the building corner (0,0) on the plot.
- Only set "entity" if I give you a Home Assistant entity (e.g. light.wohnzimmer). Otherwise leave it empty.
- If information is missing make sensible assumptions and name them in one short sentence after the code block.
- Start with { "schemaVersion": 1, "name": "..." }.

EXAMPLE (flat)
${example}

MY DESCRIPTION
(add description, measurements or photo here)`;
}

export function initImport({ t, lang, houseId, onImported }) {
  const dlg = document.getElementById('importDialog');
  if (!dlg) return;
  const $ = (s) => dlg.querySelector(s);
  const text = $('#importText'), out = $('#importResult'), run = $('#importRun');
  let checked = '';                                   // the text that passed the dry run
  const say = (html) => { out.innerHTML = html; };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const list = (title, items, cls) => (items?.length ? `<div class="imp-${cls}"><b>${t(title)}</b><ul>${items.map((i) => `<li><code>${esc(i.path)}</code> ${esc(i.message)}</li>`).join('')}</ul></div>` : '');
  const call = async (dry) => {
    const body = text.value.trim();
    if (!body) { say(`<div class="imp-errors">${t('imp.empty')}</div>`); return null; }
    try { JSON.parse(body); } catch (e) { say(`<div class="imp-errors">${t('imp.badJson').replace('{msg}', esc(e.message))}</div>`); run.disabled = true; return null; }
    const name = $('#importName').value.trim();
    let r;
    try {
      r = await fetch(`api/import?${dry ? 'dryRun=1&' : ''}${name ? `name=${encodeURIComponent(name)}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch { say(`<div class="imp-errors">${t('imp.noBackend')}</div>`); return null; }
    if (r.status === 501 || r.status === 404) { say(`<div class="imp-errors">${t('imp.noBackend')}</div>`); return null; }
    let j = {};
    try { j = await r.json(); } catch { /* empty */ }
    return { ok: r.ok, j, body };
  };
  const summary = (s) => t('imp.ok').replace('{floors}', s.floors).replace('{rooms}', s.rooms).replace('{walls}', s.walls).replace('{openings}', s.openings).replace('{devices}', s.devices);
  $('#importCheck').addEventListener('click', async () => {
    run.disabled = true;
    const res = await call(true);
    if (!res) return;
    const { ok, j } = res;
    say((ok ? `<div class="imp-ok">✓ ${esc(summary(j.summary))}</div>` : '') + list('imp.errors', j.errors || (j.error ? [{ path: '$', message: j.error }] : []), 'errors') + list('imp.warnings', j.warnings, 'warnings'));
    if (ok) { checked = res.body; run.disabled = false; if (!$('#importName').value && j.name) $('#importName').placeholder = j.name; }
  });
  run.addEventListener('click', async () => {
    if (text.value.trim() !== checked) { run.disabled = true; return; }
    run.disabled = true;
    const res = await call(false);
    if (!res) return;
    if (!res.ok) { say(list('imp.errors', res.j.errors, 'errors')); return; }
    dlg.close();
    await onImported(res.j);
  });
  text.addEventListener('input', () => { if (text.value.trim() !== checked) run.disabled = true; });
  const load = async (name) => { try { const r = await fetch(`api/import/examples/${name}`); if (!r.ok) throw new Error(); text.value = JSON.stringify(await r.json(), null, 1).replace(/\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g, '[$1, $2]'); checked = ''; run.disabled = true; say(''); } catch { say(`<div class="imp-errors">${t('imp.noBackend')}</div>`); } };
  $('#importExFlat').addEventListener('click', () => load('flat'));
  $('#importExHouse').addEventListener('click', () => load('house'));
  $('#importPrompt').addEventListener('click', async () => {
    const p = await buildPrompt(lang());
    try { await navigator.clipboard.writeText(p); say(`<div class="imp-ok">${t('imp.promptCopied')}</div>`); }
    catch { text.value = p; say(`<div class="imp-ok">${t('imp.promptShown')}</div>`); }
  });
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    text.value = await f.text(); checked = ''; run.disabled = true; say('');
  });
  document.getElementById('importOpen')?.addEventListener('click', () => { say(''); run.disabled = true; dlg.showModal(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.getElementById('propExport')?.addEventListener('click', () => { location.href = `api/export/property?house=${encodeURIComponent(houseId() || '')}`; });
}
