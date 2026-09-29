/* Demo mode: replaces the add-on backend with in-memory data so the editor runs from a single HTML file.
 * Installed as window.fetch shim before the app starts. Nothing is sent anywhere and nothing is persisted. */
const W = (id, a, b, thickness, openings = []) => ({ id, a, b, thickness, height: 2.6, openings });
const D = (id, pos, extra = {}) => ({ id, type: 'door', pos, width: 0.9, height: 2.05, sill: 0, ...extra });
const Win = (id, pos, extra = {}) => ({ id, type: 'window', pos, width: 1.2, height: 1.2, sill: 0.9, ...extra });

const layout = {
  version: 1,
  floors: [{
    id: 'eg', name: 'Erdgeschoss',
    rooms: [
      { id: 'r1', name: 'Wohnzimmer',    color: '#b89b74', points: [[0, 0], [6, 0], [6, 4.5], [0, 4.5]] },
      { id: 'r2', name: 'Küche',         color: '#c9c2b4', points: [[6, 0], [10, 0], [10, 4.5], [6, 4.5]] },
      { id: 'r3', name: 'Bad',           color: '#8fb1c2', points: [[0, 4.5], [3, 4.5], [3, 7], [0, 7]] },
      { id: 'r4', name: 'Schlafzimmer',  color: '#a99bb8', points: [[3, 4.5], [7, 4.5], [7, 7], [3, 7]] },
      { id: 'r5', name: 'Büro',          color: '#9db39a', points: [[7, 4.5], [10, 4.5], [10, 7], [7, 7]] },
    ],
    walls: [
      W('w1', [0, 0], [6, 0], 0.24, [Win('o1', 1.6), Win('o2', 4.4)]),
      W('w2', [6, 0], [10, 0], 0.24, [Win('o3', 2)]),
      W('w3', [10, 0], [10, 4.5], 0.24, [Win('o4', 2.25, { width: 1.6 })]),
      W('w4', [10, 4.5], [10, 7], 0.24, [Win('o5', 1.25)]),
      W('w5', [10, 7], [7, 7], 0.24, [D('o6', 1.5)]),
      W('w6', [7, 7], [3, 7], 0.24, [Win('o7', 2)]),
      W('w7', [3, 7], [0, 7], 0.24, [Win('o8', 1.5, { width: 0.7, height: 0.8, sill: 1.3 })]),
      W('w8', [0, 7], [0, 4.5], 0.24),
      W('w9', [0, 4.5], [0, 0], 0.24, [Win('o9', 2.25, { width: 1.6 })]),
      W('i1', [0, 4.5], [6, 4.5], 0.12, [D('o10', 1.5), D('o11', 4.5)]),
      W('i2', [6, 4.5], [10, 4.5], 0.12, [D('o12', 2)]),
      W('i3', [6, 0], [6, 4.5], 0.12, [D('o13', 2.25, { width: 1.3 })]),
      W('i4', [3, 4.5], [3, 7], 0.12),
      W('i5', [7, 4.5], [7, 7], 0.12, [D('o14', 1.2)]),
    ],
    devices: [
      { id: 'd1',  type: 'tv',         x: 2.5, z: 0.4,  y: 0.5,  rot: 0,   scale: 1,   name: 'Fernseher',       entity: 'media_player.tv' },
      { id: 'd2',  type: 'sofa',       x: 2.5, z: 3.5,  y: 0,    rot: 180, scale: 1.1, name: 'Sofa',            entity: '' },
      { id: 'd3',  type: 'table',      x: 2.5, z: 2.2,  y: 0,    rot: 0,   scale: 0.6, name: 'Couchtisch',      entity: '' },
      { id: 'd4',  type: 'light',      x: 3,   z: 2.25, y: 2.55, rot: 0,   scale: 1.2, name: 'Deckenlicht',     entity: 'light.wohnzimmer' },
      { id: 'd5',  type: 'lamp',       x: 5.2, z: 3.9,  y: 0,    rot: 0,   scale: 1,   name: 'Stehlampe',       entity: 'light.stehlampe' },
      { id: 'd6',  type: 'thermostat', x: 0.2, z: 3.4,  y: 0.2,  rot: 90,  scale: 1,   name: 'Heizung',         entity: 'climate.wohnzimmer' },
      { id: 'd7c', type: 'switch', x: 1.2, z: 0.2, y: 1.0, rot: 0, scale: 1, name: 'Rollladen', entity: 'cover.wohnzimmer' },
      { id: 'd7w', type: 'sensor', x: 4.5, z: 0.4, y: 1.4, rot: 0, scale: 1, name: 'Leistung', entity: 'sensor.wohnzimmer_leistung' },
      { id: 'd7',  type: 'plant',      x: 0.7, z: 0.7,  y: 0,    rot: 0,   scale: 1.2, name: 'Pflanze',         entity: '' },
      { id: 'd8',  type: 'sensor',     x: 5.75, z: 0.9, y: 1.6,  rot: 90,  scale: 1,   name: 'Temperatur Wohnzimmer', entity: 'sensor.wohnzimmer_temp' },
      { id: 'd9',  type: 'table',      x: 8,   z: 2.2,  y: 0,    rot: 0,   scale: 1.1, name: 'Esstisch',        entity: '' },
      { id: 'd10', type: 'light',      x: 8,   z: 2.25, y: 2.55, rot: 0,   scale: 1.2, name: 'Küchenlicht',     entity: 'light.kueche' },
      { id: 'd11', type: 'sensor',     x: 9.85, z: 0.8, y: 1.6,  rot: 270, scale: 1,   name: 'Temperatur Küche', entity: 'sensor.kueche_temp' },
      { id: 'd12', type: 'bed',        x: 5,   z: 5.95, y: 0,    rot: 180, scale: 1,   name: 'Bett',            entity: '' },
      { id: 'd13', type: 'light',      x: 5,   z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Schlafzimmerlicht', entity: 'light.schlafzimmer' },
      { id: 'd14', type: 'sensor',     x: 3.15, z: 5.3, y: 1.6,  rot: 90,  scale: 1,   name: 'Temperatur Schlafzimmer', entity: 'sensor.schlafzimmer_temp' },
      { id: 'd15', type: 'light',      x: 1.5, z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Badlicht',        entity: 'light.bad' },
      { id: 'd16', type: 'sensor',     x: 2.85, z: 5.0, y: 1.6,  rot: 270, scale: 1,   name: 'Luftfeuchte Bad', entity: 'sensor.bad_feuchte' },
      { id: 'd17', type: 'table',      x: 8.6, z: 6.0,  y: 0,    rot: 90,  scale: 1,   name: 'Schreibtisch',    entity: '' },
      { id: 'd18', type: 'light',      x: 8.6, z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Bürolicht',       entity: 'light.buero' },
      { id: 'd19', type: 'switch',     x: 9.4, z: 6.88, y: 1.1,  rot: 0,   scale: 1,   name: 'Flurschalter',    entity: 'switch.flur' },
    ],
  }],
};

const entities = {
  'light.wohnzimmer':        { name: 'Wohnzimmer Deckenlicht', state: 'on', brightness: 70 },
  'light.stehlampe':         { name: 'Stehlampe',              state: 'on' },
  'light.kueche':            { name: 'Küche Licht',            state: 'off' },
  'light.schlafzimmer':      { name: 'Schlafzimmer Licht',     state: 'off' },
  'light.bad':               { name: 'Bad Licht',              state: 'off' },
  'light.buero':             { name: 'Büro Licht',             state: 'on' },
  'cover.wohnzimmer':        { name: 'Rollladen Wohnzimmer',   state: 'open', position: 60 },
  'switch.flur':             { name: 'Flur Schalter',          state: 'off' },
  'media_player.tv':         { name: 'Fernseher',              state: 'playing' },
  'climate.wohnzimmer':      { name: 'Heizung Wohnzimmer',     state: 'heat' },
  'sensor.wohnzimmer_temp':  { name: 'Wohnzimmer Temperatur',  state: '21.4', unit: '°C' },
  'sensor.kueche_temp':      { name: 'Küche Temperatur',       state: '22.1', unit: '°C' },
  'sensor.schlafzimmer_temp':{ name: 'Schlafzimmer Temperatur', state: '18.6', unit: '°C' },
  'sensor.wohnzimmer_leistung': { name: 'Wohnzimmer Leistung',   state: '168', unit: 'W' },
  'sensor.bad_feuchte':      { name: 'Bad Luftfeuchte',        state: '64', unit: '%' },
};

let settings = {
  language: 'de', theme: 'holo', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, showLabels: true, cutaway: true,
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export function installDemoBackend() {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const path = url.replace(/^.*?(api\/)/, '$1');
    if (!path.startsWith('api/')) return realFetch(input, init);
    const method = (init.method || 'GET').toUpperCase();

    if (path === 'api/layout') {
      if (method === 'PUT') return json({ ok: true });        // edits live only in this tab
      return json(layout);
    }
    if (path === 'api/settings') {
      if (method === 'PUT') { settings = { ...settings, ...JSON.parse(init.body) }; return json(settings); }
      return json(settings);
    }
    if (path === 'api/entities') {
      return json(Object.entries(entities).map(([entity_id, e]) => ({
        entity_id, name: e.name, domain: entity_id.split('.')[0], state: e.state, unit: e.unit ?? null,
        brightness: e.brightness ?? null, position: e.position ?? null })));
    }
    if (path === 'api/service' && method === 'POST') {
      const { service, entity_id: id, data } = JSON.parse(init.body);
      const e = entities[id];
      if (!e) return json({ ok: false }, 502);
      if (service === 'toggle') e.state = e.state === 'on' ? 'off' : 'on';
      if (service === 'turn_on') { e.state = 'on'; if (data?.brightness_pct != null) e.brightness = data.brightness_pct; }
      if (service === 'set_cover_position') { e.position = data.position; e.state = data.position > 0 ? 'open' : 'closed'; }
      if (service === 'open_cover') { e.state = 'open'; e.position = 100; }
      if (service === 'close_cover') { e.state = 'closed'; e.position = 0; }
      if (service === 'turn_off') e.state = 'off';
      return json({ ok: true });
    }
    if (path === 'api/models') {
      if (method === 'POST') return json({ error: 'Upload ist in der Demo deaktiviert' }, 501);
      return json([]);
    }
    return json({ error: 'not available in demo' }, 404);
  };
}
