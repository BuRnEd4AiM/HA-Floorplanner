/* Demo mode: replaces the add-on backend with in-memory data so the editor runs from a single HTML file.
 * Installed as window.fetch shim before the app starts. Nothing is sent anywhere and nothing is persisted. */
const W = (id, a, b, thickness, openings = []) => ({ id, a, b, thickness, height: 2.6, openings });
const D = (id, pos, extra = {}) => ({ id, type: 'door', pos, width: 0.9, height: 2.05, sill: 0, ...extra });
const Win = (id, pos, extra = {}) => ({ id, type: 'window', pos, width: 1.2, height: 1.2, sill: 0.9, ...extra });

const layout = {
  version: 1,
  plot: { boundary: [[-7, -6], [17, -6], [17, 14], [-7, 14]] },   // the plot (Grundstück): the house stands in the lawn, the basement in the earth
  floors: [{
    id: 'kg', name: 'Keller', kind: 'basement',
    rooms: [
      { id: 'k1', name: 'Hobbyraum',  color: '#8f8a7e', points: [[0, 0], [6, 0], [6, 4.5], [0, 4.5]] },
      { id: 'k2', name: 'Technik',    color: '#7d8590', points: [[6, 0], [10, 0], [10, 4.5], [6, 4.5]] },
      { id: 'k3', name: 'Waschküche', color: '#8a96a0', points: [[0, 4.5], [10, 4.5], [10, 7], [0, 7]] },
    ],
    walls: [
      W('k_w1', [0, 0], [10, 0], 0.3, [Win('k_o1', 2.5, { height: 0.6, sill: 1.8 })]),
      W('k_w2', [10, 0], [10, 7], 0.3, []),
      W('k_w3', [10, 7], [0, 7], 0.3, []),
      W('k_w4', [0, 7], [0, 0], 0.3, []),
      W('k_i1', [6, 0], [6, 4.5], 0.12, [D('k_o2', 3.2)]),
      W('k_i2', [0, 4.5], [10, 4.5], 0.12, [D('k_o3', 3), D('k_o4', 8)]),
    ],
    devices: [
      { id: 'k_d1', type: 'light',   x: 3,   z: 2.25, y: 2.55, rot: 0,   scale: 1.2, name: 'Licht Hobbyraum', entity: 'light.keller' },
      { id: 'k_d2', type: 'sofa',    x: 3,   z: 3.6,  y: 0,    rot: 180, scale: 1,   name: 'Sofa', entity: '' },
      { id: 'k_d3', type: 'table',   x: 3,   z: 2.3,  y: 0,    rot: 0,   scale: 0.7, name: 'Tisch', entity: '' },
      { id: 'k_d4', type: 'shelf',   x: 0.35, z: 2,   y: 0,    rot: 90,  scale: 1,   name: 'Regal', entity: '' },
      { id: 'k_d5', type: 'boiler',  x: 9.4, z: 0.6,  y: 0,    rot: 0,   scale: 1,   name: 'Warmwasserspeicher', entity: '' },
      { id: 'k_d6', type: 'radiator', x: 7.5, z: 0.25, y: 0.3,  rot: 0,   scale: 1,   name: 'Heizung', entity: '' },
      { id: 'k_d7', type: 'washer',  x: 1,   z: 6.4,  y: 0,    rot: 180, scale: 1,   name: 'Waschmaschine', entity: '' },
      { id: 'k_d8', type: 'washer',  x: 1.8, z: 6.4,  y: 0,    rot: 180, scale: 1,   name: 'Trockner', entity: '' },
      { id: 'k_d9', type: 'sensor',  x: 9.8, z: 5.8,  y: 1.6,  rot: 270, scale: 1,   name: 'Luftfeuchte Keller', entity: 'sensor.keller_feuchte' },
      { id: 'k_d10', type: 'light',  x: 5,   z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Licht Waschküche', entity: 'light.waschkueche' },
    ],
  }, {
    id: 'eg', name: 'Erdgeschoss',
    stairs: [{ id: 'st1', name: 'Treppe', type: 'straight', x: 6.5, z: 3.9, rot: 0, w: 1.0, tread: 0.2, turn: 'right', dir: 'up' }],
    rooms: [
      { id: 'r1', name: 'Wohnzimmer',    area: 'wohnzimmer', color: '#b89b74', points: [[0, 0], [6, 0], [6, 4.5], [0, 4.5]] },
      { id: 'r2', name: 'Küche',         color: '#c9c2b4', points: [[6, 0], [10, 0], [10, 4.5], [6, 4.5]] },
      { id: 'r3', name: 'Bad',           color: '#8fb1c2', points: [[0, 4.5], [3, 4.5], [3, 7], [0, 7]] },
      { id: 'r4', name: 'Schlafzimmer',  area: 'schlafzimmer', color: '#a99bb8', points: [[3, 4.5], [7, 4.5], [7, 7], [3, 7]] },
      { id: 'r5', name: 'Büro',          area: 'buero', color: '#9db39a', points: [[7, 4.5], [10, 4.5], [10, 7], [7, 7]] },
      { id: 'gr1', name: 'Garage',       color: '#8d9096', points: [[10, 0], [15, 0], [15, 6], [10, 6]] },
    ],
    walls: [
      W('w1', [0, 0], [6, 0], 0.24, [Win('o1', 1.6, { entity: 'binary_sensor.fenster_wohnzimmer', name: 'Fenster Wohnzimmer' }), Win('o2', 4.4)]),
      W('w2', [6, 0], [10, 0], 0.24, [Win('o3', 2, { entity: 'binary_sensor.fenster_kueche', name: 'Fenster Küche' })]),
      W('w3', [10, 0], [10, 4.5], 0.24, [D('o4', 2.25, { name: 'Tür zur Garage' })]),
      W('w4', [10, 4.5], [10, 7], 0.24, []),
      W('g_w1', [10, 0], [15, 0], 0.24, []),
      W('g_w2', [15, 0], [15, 6], 0.24, [D('g_o1', 3, { width: 2.6, height: 2.1, style: 'garage', entity: 'cover.garagentor', name: 'Garagentor' })]),
      W('g_w3', [15, 6], [10, 6], 0.24, []),
      W('w5', [10, 7], [7, 7], 0.24, [D('o6', 1.5, { entity: 'binary_sensor.tuer_buero', name: 'Bürotür' })]),
      W('w6', [7, 7], [3, 7], 0.24, [Win('o7', 2)]),
      W('w7', [3, 7], [0, 7], 0.24, [Win('o8', 1.5, { width: 0.7, height: 0.8, sill: 1.3 })]),
      W('w8', [0, 7], [0, 4.5], 0.24),
      W('w9', [0, 4.5], [0, 0], 0.24, [Win('o9', 2.25, { width: 1.6 })]),
      W('i1', [0, 4.5], [6, 4.5], 0.12, [D('o10', 1.5), D('o11', 4.5)]),
      W('i2', [6, 4.5], [10, 4.5], 0.12, [D('o12', 2)]),
      W('i3', [6, 0], [6, 4.5], 0.12, [D('o13', 2.25, { width: 1.3, entity: 'binary_sensor.tuer_wohnzimmer_kueche', name: 'Tür Wohnzimmer-Küche' })]),
      W('i4', [3, 4.5], [3, 7], 0.12),
      W('i5', [7, 4.5], [7, 7], 0.12, [D('o14', 1.2)]),
    ],
    devices: [
      { id: 'd1',  type: 'tv_wall',    x: 2.5, z: 0.16, y: 1.2,  rot: 0,   scale: 1,   name: 'Fernseher',       entity: 'media_player.tv', ledEntity: 'light.tv_led' },
      { id: 'd2',  type: 'sofa',       x: 2.5, z: 3.5,  y: 0,    rot: 180, scale: 1.1, name: 'Sofa',            entity: '' },
      { id: 'd3',  type: 'table',      x: 2.5, z: 2.2,  y: 0,    rot: 0,   scale: 0.6, name: 'Couchtisch',      entity: '' },
      { id: 'd4',  type: 'light',      x: 3,   z: 2.25, y: 2.55, rot: 0,   scale: 1.2, name: 'Deckenlicht',     entity: 'light.wohnzimmer' },
      { id: 'd20', type: 'strip',      x: 2.5, z: 3.95, y: 0.12, rot: 0,   scale: 2.2, name: 'LED unter dem Sofa (unsichtbar)', entity: 'light.sofa_led', hideModel: true },
      { id: 'd21', type: 'nanoleaf',   x: 0.14, z: 0.85, y: 1.5, rot: 90, scale: 1, name: 'Nanoleaf Shapes', entity: 'light.shapes_wz',
        panels: [{"s":"hex","x":0.0114,"y":0.0599,"r":0},{"s":"tri","x":0.1964,"y":0.0163,"r":0},{"s":"tri","x":-0.1739,"y":0.103,"r":300},{"s":"tri","x":0.0114,"y":0.2415,"r":0},{"s":"tri","x":0.0117,"y":-0.1221,"r":60},{"s":"tri2","x":0.1014,"y":0.2938,"r":60},{"s":"tri","x":0.1315,"y":-0.1916,"r":0},{"s":"sq","x":-0.1525,"y":-0.2166,"r":30}] },
      { id: 'd5',  type: 'lamp',       x: 5.2, z: 3.9,  y: 0,    rot: 0,   scale: 1,   name: 'Stehlampe',       entity: 'light.stehlampe' },
      { id: 'd6',  type: 'thermostat', x: 0.2, z: 3.4,  y: 0.2,  rot: 90,  scale: 1,   name: 'Heizung',         entity: 'climate.wohnzimmer' },
      { id: 'd7c', type: 'switch', x: 1.2, z: 0.2, y: 1.0, rot: 0, scale: 1, name: 'Rollladen', entity: 'cover.wohnzimmer' },
      { id: 'd7w', type: 'sensor', x: 4.5, z: 0.4, y: 1.4, rot: 0, scale: 1, name: 'Leistung', entity: 'sensor.wohnzimmer_leistung' },
      { id: 'd7',  type: 'plant',      x: 0.7, z: 0.7,  y: 0,    rot: 0,   scale: 1.2, name: 'Pflanze',         entity: '' },
      { id: 'd8',  type: 'sensor',     x: 5.75, z: 0.9, y: 1.6,  rot: 90,  scale: 1,   name: 'Temperatur Wohnzimmer', entity: 'sensor.wohnzimmer_temp' },
      { id: 'cam1', type: 'camera', x: 3, z: 0.18, y: 2.3, rot: 0, scale: 1.4, name: 'Kamera Wohnzimmer', entity: 'camera.wohnzimmer', fov: 90, range: 4.2, motionEntity: 'binary_sensor.wohnzimmer_bewegung' },
      { id: 'cam2', type: 'camera', x: 9.82, z: 6.82, y: 2.3, rot: 225, scale: 1.4, name: 'Kamera Büro', entity: 'camera.buero', fov: 80, range: 3.6 },
      { id: 'd8c', type: 'sensor',     x: 5.75, z: 2.4, y: 1.6,  rot: 90,  scale: 1,   name: 'CO₂ Wohnzimmer', entity: 'sensor.wohnzimmer_co2' },
      { id: 'd9',  type: 'diningtable', x: 8,   z: 2.2,  y: 0,    rot: 0,   scale: 1, name: 'Esstisch',        entity: '' },
      { id: 'd10', type: 'light',      x: 8,   z: 2.25, y: 2.55, rot: 0,   scale: 1.2, name: 'Küchenlicht',     entity: 'light.kueche' },
      { id: 'd11', type: 'sensor',     x: 9.85, z: 0.8, y: 1.6,  rot: 270, scale: 1,   name: 'Temperatur Küche', entity: 'sensor.kueche_temp' },
      { id: 'n1', type: 'kitchenrun', x: 8, z: 0.42, y: 0, rot: 0, scale: 1, name: 'Küchenzeile', entity: '', legs: [['base', 'sink', 'dish', 'stove', 'fridge']], upper: true, depth: 0.6 },
      { id: 'rd1', type: 'radiator', x: 0.22, z: 2.2, y: 0.3, rot: 90, scale: 1, name: 'Heizkörper Wohnzimmer', entity: 'climate.wohnzimmer' },
      { id: 'n3', type: 'bathtub', x: 0.5, z: 5.5, y: 0, rot: 90, scale: 0.9, name: 'Badewanne', entity: '' },
      { id: 'n4', type: 'toilet', x: 2.6, z: 6.5, y: 0, rot: 180, scale: 1, name: 'WC', entity: '' },
      { id: 'n5', type: 'basin', x: 2.6, z: 5.0, y: 0, rot: 0, scale: 1, name: 'Waschtisch', entity: '' },
      { id: 'n6', type: 'wardrobe', x: 6.2, z: 6.65, y: 0, rot: 180, scale: 1, name: 'Schrank', entity: '' },
      { id: 'n7', type: 'armchair', x: 1.0, z: 3.6, y: 0, rot: 135, scale: 1, name: 'Sessel', entity: '' },
      { id: 'n8', type: 'carpet', x: 2.5, z: 2.8, y: 0, rot: 0, scale: 1.2, name: 'Teppich', entity: '' },
      { id: 'n9', type: 'shelf', x: 5.5, z: 1.2, y: 0, rot: 270, scale: 1, name: 'Regal', entity: '' },
      { id: 'd12', type: 'bed',        x: 5,   z: 5.95, y: 0,    rot: 180, scale: 1,   name: 'Bett',            entity: '' },
      { id: 'd13', type: 'light',      x: 5,   z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Schlafzimmerlicht', entity: 'light.schlafzimmer' },
      { id: 'd14', type: 'sensor',     x: 3.15, z: 5.3, y: 1.6,  rot: 90,  scale: 1,   name: 'Temperatur Schlafzimmer', entity: 'sensor.schlafzimmer_temp' },
      { id: 'd14c', type: 'sensor',    x: 3.15, z: 6.3, y: 1.6,  rot: 90,  scale: 1,   name: 'CO₂ Schlafzimmer', entity: 'sensor.schlafzimmer_co2' },
      { id: 'd15', type: 'light',      x: 1.5, z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Badlicht',        entity: 'light.bad' },
      { id: 'd16', type: 'sensor',     x: 2.85, z: 5.0, y: 1.6,  rot: 270, scale: 1,   name: 'Luftfeuchte Bad', entity: 'sensor.bad_feuchte' },
      { id: 'd17', type: 'desk',       x: 8.6, z: 6.0,  y: 0,    rot: 90,  scale: 1,   name: 'Schreibtisch',    entity: '' },
      { id: 'p1',  type: 'presence',   x: 4.4, z: 3.6, y: 0,    rot: 0,   scale: 1,   name: 'Anna',            entity: 'person.anna' },
      { id: 'p2',  type: 'presence',   x: 8.9, z: 5.1, y: 0,    rot: 0,   scale: 1,   name: 'Büro Anwesenheit', entity: 'binary_sensor.buero_praesenz' },
      { id: 'p3',  type: 'presence',   x: 7.5, z: 3.2, y: 0,    rot: 0,   scale: 1,   name: 'Max',             entity: 'person.max' },
      { id: 'd22', type: 'ledring',    x: 5, z: 5.75, y: 2.5, rot: 0, scale: 1, name: 'Voute Schlafzimmer', entity: 'light.voute_bett', room: 'r4', inset: 0.15, closed: true,
        pts: [[-1.85, -1.1], [1.85, -1.1], [1.85, 1.1], [-1.85, 1.1]], segs: [{}, { entity: 'light.voute_fenster' }, {}, { entity: 'light.voute_fenster' }] },
      { id: 'd18', type: 'light',      x: 8.6, z: 5.75, y: 2.55, rot: 0,   scale: 1.2, name: 'Bürolicht',       entity: 'light.buero' },
      { id: 'd19', type: 'switch',     x: 9.4, z: 6.88, y: 1.1,  rot: 0,   scale: 1,   name: 'Flurschalter',    entity: 'switch.flur' },
      { id: 'pw_he', type: 'houseentry', x: 9, z: 7.7, y: 0, rot: 0, scale: 1, name: 'Hausanschluss', entity: 'sensor.netz_leistung', cables: [{ id: 'c1', to: 'pw_zm', route: 'floor' }] },
      { id: 'pw_zm', type: 'powermeter', x: 9.82, z: 6.2, y: 1.4, rot: 270, scale: 1, name: 'Stromzähler', entity: 'sensor.netz_leistung', cables: [{ id: 'c2', to: 'pw_zk', route: 'floor' }] },
      { id: 'pw_zk', type: 'fusebox', x: 9.82, z: 5.4, y: 1.4, rot: 270, scale: 1, name: 'Zählerkasten', entity: '' },
      { id: 'pw_wr', type: 'inverter', x: 10.14, z: 5.2, y: 1.2, rot: 90, scale: 1, name: 'Wechselrichter', entity: 'sensor.pv_leistung', cables: [{ id: 'c3', to: 'pw_zk', route: 'floor' }] },
      { id: 'pw_bt', type: 'battery', x: 10.3, z: 4.1, y: 0, rot: 90, scale: 1, name: 'Hausbatterie', entity: 'sensor.batterie_ladung', cables: [{ id: 'c7', to: 'pw_zk', route: 'floor', kind: 'battery', entity: 'sensor.batterie_leistung' }] },
      { id: 'pw_s1', type: 'solarpanel', x: 16.2, z: 1.2, y: 0, rot: 90, scale: 1, name: 'PV Modul 1', entity: 'sensor.pv_string1', cables: [{ id: 'c4', to: 'pw_wr', route: 'floor' }] },
      { id: 'pw_s2', type: 'solarpanel', x: 16.2, z: 2.6, y: 0, rot: 90, scale: 1, name: 'PV Modul 2', entity: 'sensor.pv_string2', cables: [{ id: 'c5', to: 'pw_wr', route: 'floor' }] },
      { id: 'pw_s3', type: 'solarpanel', x: 16.2, z: 4.0, y: 0, rot: 90, scale: 1, name: 'PV Modul 3', entity: 'sensor.pv_string3', cables: [{ id: 'c6', to: 'pw_wr', route: 'floor' }] },
      { id: 'gt1', type: 'tree',    x: -4,   z: -3.2, y: 0, rot: 0,  scale: 1.1, name: 'Apfelbaum', entity: '' },
      { id: 'gt2', type: 'tree',    x: 14.5, z: -3.5, y: 0, rot: 0,  scale: 1.3, name: 'Linde', entity: '' },
      { id: 'gt3', type: 'bush',    x: -5,   z: 5.5,  y: 0, rot: 0,  scale: 1,   name: 'Hecke', entity: '' },
      { id: 'gt4', type: 'terrace', x: -2.6, z: 2.5,  y: 0, rot: 90, scale: 1.1, name: 'Terrasse', entity: '' },
      { id: 'gt5', type: 'car',     x: 12.6, z: 3.0,  y: 0, rot: 90, scale: 1,   name: 'Auto', entity: '' },
      { id: 'gg1', type: 'light',   x: 12.5, z: 3.0,  y: 2.55, rot: 0, scale: 1.2, name: 'Garagenlicht', entity: 'light.garage' },
      { id: 'gt6', type: 'fence',   x: 5,    z: -5.6, y: 0, rot: 0,  scale: 1, sx: 7.8, name: 'Zaun', entity: '' },
    ],
  }, {
    id: 'og', name: 'Obergeschoss',
    rooms: [
      { id: 'q1', name: 'Kinderzimmer', color: '#a0b8d8', points: [[0, 0], [5, 0], [5, 4], [0, 4]] },
      { id: 'q2', name: 'Gästezimmer', color: '#c8b0a0', points: [[5, 0], [10, 0], [10, 4], [5, 4]] },
      { id: 'q3', name: 'Dachterrasse', color: '#a58a63', terrace: true, points: [[10, 0], [15, 0], [15, 6], [10, 6]] },
    ],
    walls: [
      W('u1', [0, 0], [10, 0], 0.24, [Win('u5', 2.5), Win('u6', 7.5)]),
      W('u2', [10, 0], [10, 4], 0.24, [D('u7', 2, { width: 1.8, height: 2.1, style: 'sliding', name: 'Terrassentür' })]),
      W('u3', [10, 4], [0, 4], 0.24, [D('u8', 2.5), D('u9', 7.5)]),
      W('u4', [0, 4], [0, 0], 0.24, [Win('u10', 2)]),
      W('u11', [5, 0], [5, 4], 0.12, []),
    ],
    devices: [
      { id: 'e1', type: 'bed', x: 2.5, z: 1.6, y: 0, rot: 0, scale: 1, name: 'Bett', entity: '' },
      { id: 'e2', type: 'light', x: 2.5, z: 2, y: 2.55, rot: 0, scale: 1.2, name: 'Licht Kinderzimmer', entity: 'light.schlafzimmer' },
      { id: 'e4', type: 'sensor', x: 4.8, z: 1, y: 1.6, rot: 90, scale: 1, name: 'Temperatur Kinderzimmer', entity: 'sensor.kinder_temp' },
      { id: 'e5', type: 'sensor', x: 5.2, z: 1, y: 1.6, rot: 270, scale: 1, name: 'Temperatur Gästezimmer', entity: 'sensor.gast_temp' },
      { id: 'e4c', type: 'sensor', x: 0.2, z: 3, y: 1.6, rot: 270, scale: 1, name: 'CO₂ Kinderzimmer', entity: 'sensor.kinder_co2' },
      { id: 'e3', type: 'table', x: 7.5, z: 1.5, y: 0, rot: 0, scale: 0.8, name: 'Schreibtisch', entity: '' },
      { id: 'te1', type: 'diningtable', x: 12.8, z: 2.6, y: 0, rot: 0, scale: 0.8, name: 'Terrassentisch', entity: '' },
      { id: 'te2', type: 'plant', x: 14.5, z: 0.6, y: 0, rot: 0, scale: 1.3, name: 'Pflanze', entity: '' },
      { id: 'te3', type: 'plant', x: 14.5, z: 5.4, y: 0, rot: 0, scale: 1.3, name: 'Pflanze', entity: '' },
    ],
  }, {
    id: 'dg', name: 'Dachgeschoss',
    holes: [{ id: 'h1', points: [[3.6, 0.9], [5.4, 0.9], [5.4, 1.9], [3.6, 1.9]] }],
    rooms: [
      { id: 'p1', name: 'Studio', color: '#b0c8a0', points: [[1, 0.5], [6, 0.5], [6, 3.5], [1, 3.5]] },
    ],
    walls: [
      W('t1', [1, 0.5], [6, 0.5], 0.24, [Win('t5', 2.5)]),
      W('t2', [6, 0.5], [6, 3.5], 0.24, []),
      W('t3', [6, 3.5], [1, 3.5], 0.24, [D('t6', 2.5)]),
      W('t4', [1, 3.5], [1, 0.5], 0.24, []),
    ],
    devices: [
      { id: 'g3', type: 'sensor', x: 1.3, z: 3.2, y: 1.6, rot: 0, scale: 1, name: 'Temperatur Studio', entity: 'sensor.studio_temp' },
      { id: 'g1', type: 'sofa', x: 3.5, z: 2.6, y: 0, rot: 180, scale: 1, name: 'Sofa', entity: '' },
      { id: 'g2', type: 'lamp', x: 1.8, z: 1.2, y: 0, rot: 0, scale: 1, name: 'Stehlampe Studio', entity: 'light.stehlampe' },
    ],
  }, {
    id: 'dach', name: 'Dach', kind: 'roof', walls: [], rooms: [], devices: [], blocks: [], stairs: [],
    roof: { type: 'gable', pitch: 35, overhang: 0.4, dormers: [{ side: 'a', pos: 0.3 }, { side: 'b', pos: 0.7, w: 2.0, type: 'flat' }] },
  }],
};

const entities = {
  'light.wohnzimmer':        { name: 'Wohnzimmer Deckenlicht', state: 'on', brightness: 70, rgb: [255, 140, 110] },
  'light.stehlampe':         { name: 'Stehlampe',              state: 'on' },
  'light.kueche':            { name: 'Küche Licht',            state: 'off' },
  'light.keller':            { name: 'Hobbyraum Licht',        state: 'on', rgb: [255, 196, 120], brightness: 70 },
  'light.waschkueche':       { name: 'Waschküche Licht',       state: 'off' },
  'sensor.keller_feuchte':   { name: 'Keller Luftfeuchte',     state: '58', unit: '%' },
  'light.schlafzimmer':      { name: 'Schlafzimmer Licht',     state: 'on', rgb: [130, 170, 255] },
  'light.bad':               { name: 'Bad Licht',              state: 'off' },
  'person.anna':             { name: 'Anna', state: 'home' },
  'person.max':              { name: 'Max', state: 'not_home' },
  'binary_sensor.buero_praesenz': { name: 'Büro Anwesenheit', state: 'on' },
  'light.buero':             { name: 'Büro Licht',             state: 'on', rgb: [255, 226, 110] },
  'light.voute_bett':        { name: 'Voute Bettseite',        state: 'on', rgb: [190, 80, 255], brightness: 60 },
  'light.voute_fenster':     { name: 'Voute Fensterseite',     state: 'on', rgb: [60, 160, 255], brightness: 60 },
  'light.shapes_wz':         { name: 'Nanoleaf Shapes',        state: 'on', rgb: [120, 90, 255], brightness: 80, fx: ['Nordlicht', 'Sonnenuntergang', 'Wald', 'Pulsierend', 'Regenbogen'], fxc: 'Nordlicht' },
  'light.tv_led':            { name: 'TV Hintergrundlicht',    state: 'on', rgb: [255, 60, 160], brightness: 60, fx: ['Kino', 'Gaming', 'Sonnenuntergang', 'Aus'], fxc: 'Gaming' },
  'light.sofa_led':          { name: 'LED Sofa',               state: 'on', rgb: [255, 170, 80], brightness: 45 },
  'scene.wz_gemuetlich':     { name: 'Wohnzimmer Gemütlich',   state: 'scening' },
  'scene.wz_aus':            { name: 'Wohnzimmer Aus',         state: 'scening' },
  'cover.wohnzimmer':        { name: 'Rollladen Wohnzimmer',   state: 'open', position: 60 },
  'switch.flur':             { name: 'Flur Schalter',          state: 'off' },
  'media_player.tv':         { name: 'Fernseher',              state: 'playing', app: 'Netflix' },
  'climate.wohnzimmer':      { name: 'Heizung Wohnzimmer',     state: 'heat', hvac: 'heating', ct: 21.2, ch: 48, tt: 22, tmin: 16, tmax: 26, tstep: 0.5, modes: ['off', 'heat', 'auto'] },
  'sensor.netz_leistung':    { name: 'Netzbezug',              state: '450',  unit: 'W' },
  'sensor.pv_leistung':      { name: 'PV Wechselrichter',      state: '3.2',  unit: 'kW' },
  'sensor.pv_string1':       { name: 'PV Modul 1',             state: '1100', unit: 'W' },
  'sensor.pv_string2':       { name: 'PV Modul 2',             state: '1050', unit: 'W' },
  'sensor.pv_string3':       { name: 'PV Modul 3',             state: '1050', unit: 'W' },
  'sensor.batterie_ladung':  { name: 'Hausbatterie',           state: '82',   unit: '%' },
  'sensor.batterie_leistung': { name: 'Batterie Leistung',     state: '-600', unit: 'W' },
  'sensor.wohnzimmer_temp':  { name: 'Wohnzimmer Temperatur',  state: '21.4', unit: '°C' },
  'sensor.kueche_temp':      { name: 'Küche Temperatur',       state: '22.1', unit: '°C' },
  'sensor.schlafzimmer_temp':{ name: 'Schlafzimmer Temperatur', state: '18.6', unit: '°C' },
  'sensor.wohnzimmer_leistung': { name: 'Wohnzimmer Leistung',   state: '168', unit: 'W' },
  'binary_sensor.fenster_wohnzimmer': { name: 'Fenster Wohnzimmer', state: 'on' },
  'binary_sensor.fenster_kueche': { name: 'Fenster Küche', state: 'off' },
  'binary_sensor.tuer_buero': { name: 'Bürotür', state: 'off' },
  'binary_sensor.tuer_wohnzimmer_kueche': { name: 'Tür Wohnzimmer-Küche', state: 'on' },
  'sensor.kinder_temp':     { name: 'Kinderzimmer Temperatur', state: '20.2', unit: '°C' },
  'sensor.gast_temp':       { name: 'Gästezimmer Temperatur',  state: '17.4', unit: '°C' },
  'sensor.studio_temp':     { name: 'Studio Temperatur',       state: '24.6', unit: '°C' },
  'sensor.buero_temp':      { name: 'Büro Temperatur',         state: '23.0', unit: '°C', dc: 'temperature' },
  'camera.wohnzimmer':       { name: 'Kamera Wohnzimmer',      state: 'idle' },
  'camera.buero':            { name: 'Kamera Büro',            state: 'idle' },
  'binary_sensor.wohnzimmer_bewegung': { name: 'Bewegung Wohnzimmer', state: 'on' },
  'cover.garagentor':        { name: 'Garagentor',             state: 'closed', position: 0 },
  'light.garage':            { name: 'Garage Licht',           state: 'off' },
  'script.filmabend':        { name: 'Filmabend',              state: 'off' },
  'sensor.bad_feuchte':      { name: 'Bad Luftfeuchte',        state: '64', unit: '%' },
  'sensor.wohnzimmer_co2':   { name: 'Wohnzimmer CO₂',         state: '920', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.schlafzimmer_co2': { name: 'Schlafzimmer CO₂',       state: '1350', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.kinder_co2':       { name: 'Kinderzimmer CO₂',       state: '640', unit: 'ppm', dc: 'carbon_dioxide' },
};

let settings = {
  language: 'auto', theme: 'dark', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, labelMode: 'important', belowMode: 'dim', cameraImages: true, cutaway: true,
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export function installDemoBackend() {
  window.__fpNoLive = true;                                  // no add-on server behind the demo: no live channel, states change only here
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const path = url.replace(/^.*?(api\/)/, '$1').split('?')[0];
    if (!path.startsWith('api/')) return realFetch(input, init);
    const method = (init.method || 'GET').toUpperCase();

    if (path.startsWith('api/camera/')) {                       // a drawn "camera picture" that changes every time, so the refresh can be seen
      const id = decodeURIComponent(path.slice('api/camera/'.length)), name = entities[id]?.name || id, now = new Date().toLocaleTimeString();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4a5c"/><stop offset="1" stop-color="#151b22"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><rect x="0" y="250" width="640" height="110" fill="#2a2f36"/><rect x="60" y="90" width="150" height="150" fill="#1d252e" stroke="#556" stroke-width="3"/><rect x="420" y="170" width="170" height="80" rx="10" fill="#4a3a30"/><text x="16" y="30" fill="#fff" font-family="sans-serif" font-size="18">${name}</text><text x="624" y="344" fill="#9fe" font-family="monospace" font-size="16" text-anchor="end">DEMO ${now}</text></svg>`;
      return new Response(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
    }
    if (path === 'api/layout') {
      if (method === 'PUT') return json({ ok: true });        // edits live only in this tab
      return json(layout);
    }
    if (path === 'api/houses') return method === 'GET' ? json([{ id: 'main', name: 'Demo-Haus' }]) : json({ error: 'not in the demo' }, 501);
    if (path === 'api/me') return json({ user: 'demo', canEdit: true, room: null, view: 'all' });
    if (path === 'api/users') return json([{ username: 'admin', name: 'Admin', admin: true }, { username: 'tablet_wohnzimmer', name: 'Tablet Wohnzimmer', admin: false }, { username: 'familie', name: 'Familie', admin: false }]);
    if (path === 'api/users-file') return json({ file: 'users.json', exists: true, fileUsers: 2, users: 2, inSync: true });
    if (path === 'api/users-file/sync') return json(settings);
    if (path === 'api/settings') {
      if (method === 'PUT') { settings = { ...settings, ...JSON.parse(init.body) }; return json(settings); }
      return json(settings);
    }
    if (path === 'api/areas') {
      return json([
        { id: 'wohnzimmer', name: 'Wohnzimmer', entities: ['light.wohnzimmer', 'light.stehlampe', 'light.shapes_wz', 'light.tv_led', 'light.sofa_led', 'scene.wz_gemuetlich', 'scene.wz_aus', 'media_player.tv', 'cover.wohnzimmer', 'climate.wohnzimmer', 'sensor.wohnzimmer_leistung'] },
        { id: 'schlafzimmer', name: 'Schlafzimmer', entities: ['light.schlafzimmer', 'light.voute_bett', 'light.voute_fenster'] },
        { id: 'buero', name: 'Büro', entities: ['light.buero', 'sensor.buero_temp'] },
      ]);
    }
    if (path === 'api/entities') {
      return json(Object.entries(entities).map(([entity_id, e]) => ({
        entity_id, name: e.name, domain: entity_id.split('.')[0], state: e.state, unit: e.unit ?? null,
        dc: e.dc ?? null, brightness: e.brightness ?? null, rgb: e.rgb ?? null, position: e.position ?? null, fx: e.fx ?? null, fxc: e.fxc ?? null, ct: e.ct ?? null, ch: e.ch ?? null, app: e.app ?? null,
        hvac: e.hvac ?? null, tt: e.tt ?? null, tmin: e.tmin ?? null, tmax: e.tmax ?? null, tstep: e.tstep ?? null, modes: e.modes ?? null })));
    }
    if (path === 'api/version') {                       // so that the version pill shows in the demo too; the file checks do not apply to a single file
      const v = typeof __DEMO_VERSION__ === 'undefined' ? 'demo' : __DEMO_VERSION__;
      return json({ known: true, version: v, buildHash: 'demo', short: 'demo', server: { ok: true, files: 0, changed: [], missing: [], extra: [] }, staticFiles: {} });
    }
    if (path === 'api/service' && method === 'POST') {
      const { service, entity_id: id, data } = JSON.parse(init.body);
      const e = entities[id];
      if (!e) return json({ ok: false }, 502);
      if (id.startsWith('scene.')) {                      // demo scenes: switch the living room lights
        const wz = ['light.wohnzimmer', 'light.stehlampe', 'light.shapes_wz'];
        wz.forEach((l) => { if (id.endsWith('_aus')) entities[l].state = 'off'; else { entities[l].state = 'on'; entities[l].rgb = [255, 170, 90]; } });
        return json({ ok: true });
      }
      if (service === 'turn_on' && data?.effect) e.fxc = data.effect;
      if (service === 'toggle') e.state = e.state === 'on' ? 'off' : 'on';
      if (service === 'turn_on') { e.state = 'on'; if (data?.brightness_pct != null) e.brightness = data.brightness_pct; if (data?.rgb_color) e.rgb = data.rgb_color; if (data?.color_temp_kelvin) e.rgb = data.color_temp_kelvin < 4500 ? [255, 190, 120] : [200, 220, 255]; }
      if (service === 'set_cover_position') { e.position = data.position; e.state = data.position > 0 ? 'open' : 'closed'; }
      if (service === 'open_cover') { e.state = 'open'; e.position = 100; }
      if (service === 'close_cover') { e.state = 'closed'; e.position = 0; }
      if (service === 'turn_off') e.state = 'off';
      if (service === 'set_temperature') { e.tt = data.temperature; if (e.state !== 'off') e.hvac = e.ct < e.tt ? 'heating' : 'idle'; }
      if (service === 'set_hvac_mode') { e.state = data.hvac_mode; e.hvac = data.hvac_mode === 'off' ? 'off' : (e.ct < e.tt ? 'heating' : 'idle'); }
      return json({ ok: true });
    }
    if (path === 'api/backgrounds' && method === 'POST') return json({ error: 'Upload ist in der Demo deaktiviert' }, 501);
    if (path === 'api/models') {
      if (method === 'POST') return json({ error: 'Upload ist in der Demo deaktiviert' }, 501);
      return json([]);
    }
    return json({ error: 'not available in demo' }, 404);
  };
}
