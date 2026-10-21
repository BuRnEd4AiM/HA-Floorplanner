/* Demo mode: replaces the add-on backend with in-memory data so the editor runs from a single HTML file.
 * Installed as window.fetch shim before the app starts. Nothing is sent anywhere and nothing is persisted. */
import flatExample from '../floorplan3d/rootfs/app/examples/flat.json';
import houseExample from '../floorplan3d/rootfs/app/examples/house.json';
import showcaseExample from '../floorplan3d/rootfs/app/examples/showcase.json';
import propertySchema from '../floorplan3d/rootfs/app/property.schema.json';

const W = (id, a, b, thickness, openings = []) => ({ id, a, b, thickness, height: 2.6, openings });
const D = (id, pos, extra = {}) => ({ id, type: 'door', pos, width: 0.9, height: 2.05, sill: 0, ...extra });
const Win = (id, pos, extra = {}) => ({ id, type: 'window', pos, width: 1.2, height: 1.2, sill: 0.9, ...extra });

const layout = {
  version: 1,
  plot: { boundary: [[-7, -6], [29, -6], [29, 14], [-7, 14]] },   // the plot (Grundstück): the house stands in the lawn, the basement in the earth; the neighbour house too
  neighbors: [{ house: 'nachbar', x: 19, z: 0, rot: 0, y: 0.4 }],   // #220/#222: the second demo house stands next to this one, its upper floor 0.4 m higher
  floors: [{
    id: 'kg', name: 'Keller', kind: 'basement',
    rooms: [
      { id: 'k1', name: 'Hobbyraum',  color: '#8f8a7e', points: [[0, 0], [6, 0], [6, 4.5], [0, 4.5]] },
      { id: 'k2', name: 'Technik',    covering: 'concrete', color: '#7d8590', points: [[6, 0], [10, 0], [10, 4.5], [6, 4.5]] },
      { id: 'k3', name: 'Waschküche', covering: 'concrete', color: '#8a96a0', points: [[0, 4.5], [10, 4.5], [10, 7], [0, 7]] },
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
      { id: 'k_m1', type: 'watermeter', x: 6.7, z: 0.4, y: 0.5, rot: 0,  scale: 1, name: 'Wasserzähler', entity: 'sensor.wasserzaehler' },
      { id: 'k_m2', type: 'gasmeter',   x: 9.8, z: 2.4, y: 1.2, rot: 270, scale: 1, name: 'Gaszähler', entity: 'sensor.gaszaehler' },
      { id: 'k_m3', type: 'heatmeter',  x: 9.8, z: 3.5, y: 1.4, rot: 270, scale: 1, name: 'Wärmemengenzähler', entity: 'sensor.waermemenge' },
    ],
  }, {
    id: 'eg', name: 'Erdgeschoss',
    stairs: [{ id: 'st1', name: 'Treppe', type: 'straight', x: 6.5, z: 3.9, rot: 0, w: 1.0, tread: 0.2, turn: 'right', dir: 'up' },
      { id: 'st2', name: 'Wendeltreppe zur Dachterrasse', type: 'spiral', x: 14.1, z: 5.05, rot: 180, w: 0.9, turn: 'right', dir: 'up', floors: 1 }],
    rooms: [
      { id: 'r1', name: 'Wohnzimmer',    area: 'wohnzimmer', covering: 'herringbone', wallLook: { pattern: 'woodchip' }, color: '#b89b74', points: [[0, 0], [6, 0], [6, 4.5], [0, 4.5]] },
      { id: 'r2', name: 'Küche',         covering: 'tilesLarge', floorLook: { color: '#b9b5ad' }, wallLook: { pattern: 'paint', color: '#b4c2ad' }, wallBelow: { pattern: 'wMetro', height: 1.4 }, color: '#c9c2b4', points: [[6, 0], [10, 0], [10, 4.5], [6, 4.5]] },
      { id: 'r3', name: 'Bad',           covering: 'hexFloor', wallLook: { pattern: 'paint', color: '#f4f2ee' }, wallBelow: { pattern: 'wTiles', color: '#6f8fa8', height: 1.2 }, color: '#8fb1c2', points: [[0, 4.5], [3, 4.5], [3, 7], [0, 7]] },
      { id: 'r4', name: 'Schlafzimmer',  area: 'schlafzimmer', covering: 'carpet', floorLook: { color: '#c7bba8' }, wallLook: { pattern: 'wpLeaves' }, color: '#a99bb8', points: [[3, 4.5], [7, 4.5], [7, 7], [3, 7]] },
      { id: 'r5', name: 'Büro',          area: 'buero', covering: 'parquetDark', wallLook: { pattern: 'plaster', color: '#ece6da' }, color: '#9db39a', points: [[7, 4.5], [10, 4.5], [10, 7], [7, 7]] },
      { id: 'gr1', name: 'Garage',       covering: 'concrete', color: '#8d9096', points: [[10, 0], [15, 0], [15, 6], [10, 6]] },
    ],
    walls: [
      W('w1', [0, 0], [6, 0], 0.24, [Win('o1', 1.6, { entity: 'binary_sensor.fenster_wohnzimmer', name: 'Fenster Wohnzimmer' }), Win('o2', 4.4)]),
      W('w2', [6, 0], [10, 0], 0.24, [Win('o3', 2, { entity: 'binary_sensor.fenster_kueche', name: 'Fenster Küche', shutter: true, shutterEntity: 'cover.rollladen_kueche' })]),   // #331: window with a contact and a roller shutter
      W('w3', [10, 0], [10, 4.5], 0.24, [D('o4', 2.25, { name: 'Tür zur Garage' })]),
      W('w4', [10, 4.5], [10, 7], 0.24, []),
      W('g_w1', [10, 0], [15, 0], 0.24, []),
      W('g_w2', [15, 0], [15, 6], 0.24, [D('g_o1', 3, { width: 2.6, height: 2.1, style: 'garage', entity: 'cover.garagentor', name: 'Garagentor' })]),
      W('g_w3', [15, 6], [10, 6], 0.24, []),
      W('w5', [10, 7], [7, 7], 0.24, [D('o6', 1.5, { entity: 'binary_sensor.tuer_buero', name: 'Bürotür' })]),
      W('w6', [7, 7], [3, 7], 0.24, [Win('o7', 2, { shutter: true, shutterEntity: 'cover.rollladen_schlafzimmer' })]),
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
      { id: 'dc_sp', type: 'speaker',  x: 5.6, z: 0.4,  y: 0,    rot: 0,   scale: 1,   name: 'Lautsprecher Wohnzimmer', entity: 'media_player.sonos_wz' },   // #406: music, vacuum, fan, alarm, choice list
      { id: 'dc_fan', type: 'fan_stand', x: 0.6, z: 4.0, y: 0,    rot: 45,  scale: 1,   name: 'Standventilator', entity: 'fan.ventilator_wz' },
      { id: 'dc_vac', type: 'vacuum',  x: 8.6, z: 3.9,  y: 0,    rot: 0,   scale: 1,   name: 'Saugroboter', entity: 'vacuum.robo' },
      { id: 'dc_al', type: 'switch',   x: 9.86, z: 5.3, y: 1.4,  rot: 270, scale: 1,   name: 'Alarmanlage (Code 1234)', entity: 'alarm_control_panel.haus' },
      { id: 'dc_hm', type: 'switch',   x: 9.86, z: 5.9, y: 1.1,  rot: 270, scale: 1,   name: 'Hausmodus', entity: 'input_select.hausmodus' },
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
      { id: 'pw_zk', type: 'fusebox', x: 9.82, z: 5.4, y: 1.4, rot: 270, scale: 1, name: 'Zählerkasten', entity: '', cables: [{ id: 'c7', to: 'pw_bt', route: 'floor', kind: 'battery', entity: 'sensor.batterie_leistung' }] },
      { id: 'pw_wr', type: 'inverter', x: 10.14, z: 5.2, y: 1.2, rot: 90, scale: 1, name: 'Wechselrichter', entity: 'sensor.pv_leistung', cables: [{ id: 'c3', to: 'pw_zk', route: 'floor' }] },
      { id: 'pw_bt', type: 'battery', x: 10.3, z: 4.1, y: 0, rot: 90, scale: 1, name: 'Hausbatterie', entity: 'sensor.batterie_ladung', batPower: 'sensor.batterie_leistung' },
      { id: 'pw_s1', type: 'solarpanel', x: 16.2, z: 1.2, y: 0, rot: 90, scale: 1, name: 'PV Modul 1', entity: 'sensor.pv_string1', cables: [{ id: 'c4', to: 'pw_wr', route: 'floor' }] },
      { id: 'pw_s2', type: 'solarpanel', x: 16.2, z: 2.6, y: 0, rot: 90, scale: 1, name: 'PV Modul 2', entity: 'sensor.pv_string2', cables: [{ id: 'c5', to: 'pw_wr', route: 'floor' }] },
      { id: 'pw_s3', type: 'solarpanel', x: 16.2, z: 4.0, y: 0, rot: 90, scale: 1, name: 'PV Modul 3', entity: 'sensor.pv_string3', cables: [{ id: 'c6', to: 'pw_wr', route: 'floor' }] },
      { id: 'gt1', type: 'tree',    x: -4,   z: -3.2, y: 0, rot: 0,  scale: 1.1, name: 'Apfelbaum', entity: '' },
      { id: 'gt2', type: 'tree',    x: 14.5, z: -3.5, y: 0, rot: 0,  scale: 1.3, name: 'Linde', entity: '' },
      { id: 'gt3', type: 'bush',    x: -5,   z: 5.5,  y: 0, rot: 0,  scale: 1,   name: 'Hecke', entity: '' },
      { id: 'gt4', type: 'terrace', x: -2.6, z: 2.5,  y: 0, rot: 90, scale: 1.1, name: 'Terrasse', entity: '' },
      { id: 'gt5', type: 'car',     x: 12.2, z: 3.0,  y: 0, rot: 90, scale: 1,   name: 'Auto', entity: '' },
      { id: 'gg1', type: 'light',   x: 12.5, z: 3.0,  y: 2.55, rot: 0, scale: 1.2, name: 'Garagenlicht', entity: 'light.garage' },
      { id: 'gt6', type: 'fence',   x: 5,    z: -5.6, y: 0, rot: 0,  scale: 1, sx: 7.8, name: 'Zaun', entity: '' },
    ],
  }, {
    id: 'og', name: 'Obergeschoss',
    rooms: [
      { id: 'q1', name: 'Kinderzimmer', covering: 'parquetLight', wallLook: { pattern: 'wpDots' }, color: '#a0b8d8', points: [[0, 0], [5, 0], [5, 4], [0, 4]] },
      { id: 'q2', name: 'Gästezimmer', covering: 'chevron', wallLook: { pattern: 'wpStripes' }, color: '#c8b0a0', points: [[5, 0], [10, 0], [10, 4], [5, 4]] },
      { id: 'q3', name: 'Dachterrasse', covering: 'deck', color: '#a58a63', terrace: true, points: [[10, 0], [15, 0], [15, 6], [10, 6]] },
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
      { id: 'te3', type: 'plant', x: 10.6, z: 5.4, y: 0, rot: 0, scale: 1.3, name: 'Pflanze', entity: '' },
      { id: 'br1', type: 'bridge', x: 17, z: 3, y: 0, rot: 0, scale: 1, len: 4, w: 1.4, rise: 0.4, name: 'Brücke zum Nachbarhaus', entity: '' },
    ],
  }, {
    id: 'dg', name: 'Dachgeschoss',
    holes: [{ id: 'h1', points: [[3.6, 0.9], [5.4, 0.9], [5.4, 1.9], [3.6, 1.9]] }],
    rooms: [
      { id: 'p1', name: 'Studio', covering: 'plankWide', wallLook: { pattern: 'brickWhite' }, color: '#b0c8a0', points: [[1, 0.5], [6, 0.5], [6, 3.5], [1, 3.5]] },
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
    id: 'dach', name: 'Dach', kind: 'roof', walls: [], rooms: [], blocks: [], stairs: [],
    devices: [{ id: 'pv_dach', type: 'solarpanel', x: 5, z: 5.45, y: 0, rot: 0, scale: 1, cols: 5, rows: 2, name: 'PV Dach', entity: 'sensor.pv_dach' }],
    roof: { type: 'gable', pitch: 35, overhang: 0.4, dormers: [{ side: 'a', pos: 0.3, window: { id: 'gw1', type: 'window', style: 'double', name: 'Gaubenfenster', shutter: true, shutterEntity: 'cover.rollladen_gaube' } }, { side: 'b', pos: 0.7, w: 2.0, type: 'flat' }] },   // #331: a dormer window with a roller shutter
  }],
};

// The second demo house (#220): a small house next door with a roof terrace on its upper floor, reached over the bridge from the
// terrace of the demo house; inside a wall stair with a landing after its bend (#210).
const neighbor = {
  version: 1,
  floors: [{
    id: 'n_eg', name: 'Erdgeschoss',
    stairs: [{ id: 'n_st1', name: 'Wandtreppe', type: 'wall', x: 7.76, z: 0.9, rot: 0, w: 0.9, turn: 'right', dir: 'up', floors: 1, landing: 1, path: [[0, 0], [0, 5.85], [-2.4, 5.85]] }],
    rooms: [
      { id: 'n_r1', name: 'Wohnen', color: '#b8a58a', points: [[0, 0], [5, 0], [5, 7], [0, 7]] },
      { id: 'n_r2', name: 'Diele', color: '#a9a39a', points: [[5, 0], [8, 0], [8, 7], [5, 7]] },
    ],
    walls: [
      W('n_w1', [0, 0], [8, 0], 0.24, [Win('n_o1', 1.5), Win('n_o2', 3.6), D('n_o3', 5.8, { name: 'Haustür Nachbar' })]),
      W('n_w2', [8, 0], [8, 7], 0.24, []),
      W('n_w3', [8, 7], [0, 7], 0.24, [Win('n_o4', 5.5)]),
      W('n_w4', [0, 7], [0, 0], 0.24, [Win('n_o5', 3.5, { width: 1.6 })]),
      W('n_i1', [5, 0], [5, 7], 0.12, [D('n_o6', 1.2)]),
    ],
    devices: [
      { id: 'n_d1', type: 'sofa', x: 2.5, z: 5.6, y: 0, rot: 180, scale: 1, name: 'Sofa', entity: '' },
      { id: 'n_d2', type: 'table', x: 2.5, z: 4.3, y: 0, rot: 0, scale: 0.6, name: 'Tisch', entity: '' },
      { id: 'n_d3', type: 'light', x: 2.5, z: 3.5, y: 2.55, rot: 0, scale: 1.2, name: 'Licht Wohnen', entity: 'light.nachbar_wohnen' },
      { id: 'n_d4', type: 'plant', x: 0.6, z: 0.6, y: 0, rot: 0, scale: 1.2, name: 'Pflanze', entity: '' },
    ],
  }, {
    id: 'n_og', name: 'Obergeschoss',
    rooms: [
      { id: 'n_q1', name: 'Dachterrasse', color: '#a58a63', terrace: true, points: [[0, 0], [3, 0], [3, 7], [0, 7]] },
      { id: 'n_q2', name: 'Schlafen', color: '#a99bb8', points: [[3, 0], [8, 0], [8, 4], [3, 4]] },
      { id: 'n_q3', name: 'Flur', color: '#b3aca0', points: [[3, 4], [8, 4], [8, 7], [3, 7]] },
    ],
    walls: [
      W('n_u1', [3, 0], [8, 0], 0.24, [Win('n_u5', 2.5)]),
      W('n_u2', [8, 0], [8, 7], 0.24, []),
      W('n_u3', [8, 7], [3, 7], 0.24, [Win('n_u6', 1.5)]),
      W('n_u4', [3, 7], [3, 0], 0.24, [D('n_u7', 5, { width: 1.8, height: 2.1, style: 'sliding', name: 'Terrassentür' })]),
      W('n_u8', [3, 4], [8, 4], 0.12, [D('n_u9', 1.2)]),
    ],
    devices: [
      { id: 'n_e1', type: 'bed', x: 5.5, z: 1.6, y: 0, rot: 0, scale: 1, name: 'Bett', entity: '' },
      { id: 'n_e2', type: 'diningtable', x: 1.5, z: 4.5, y: 0, rot: 90, scale: 0.7, name: 'Terrassentisch', entity: '' },
      { id: 'n_e3', type: 'plant', x: 2.5, z: 0.6, y: 0, rot: 0, scale: 1.3, name: 'Pflanze', entity: '' },
    ],
  }, {
    id: 'n_dach', name: 'Dach', kind: 'roof', walls: [], rooms: [], devices: [], blocks: [], stairs: [],
    roof: { type: 'hip', pitch: 30, overhang: 0.4 },
  }],
};
const layouts = { main: layout, nachbar: neighbor };
const houses = [{ id: 'main', name: 'Demo-Haus' }, { id: 'nachbar', name: 'Nachbarhaus' }];

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
  'media_player.tv':         { name: 'Fernseher',              state: 'playing', app: 'Netflix', ctl: { vol: 25, muted: false, title: 'Die Serie – Folge 3', sources: ['HDMI 1', 'HDMI 2', 'Netflix', 'YouTube'], source: 'Netflix' } },
  'media_player.sonos_wz':   { name: 'Lautsprecher Wohnzimmer', state: 'playing', ctl: { vol: 35, muted: false, title: 'Sommerregen', artist: 'Die Demo-Band', sources: ['Radio', 'Spotify', 'Line-in'], source: 'Spotify' } },
  'fan.ventilator_wz':       { name: 'Standventilator',        state: 'on', ctl: { pct: 67, step: 33.33, osc: true, presets: ['Normal', 'Natur', 'Nacht'], preset: 'Normal' } },
  'vacuum.robo':             { name: 'Saugroboter',            state: 'docked', bat: 92, ctl: { speeds: ['Leise', 'Standard', 'Stark', 'Turbo'], speed: 'Standard' } },
  'alarm_control_panel.haus': { name: 'Alarmanlage',           state: 'disarmed', ctl: { code: 'number', codeArm: false } },
  'input_select.hausmodus':  { name: 'Hausmodus',              state: 'Zu Hause', ctl: { options: ['Zu Hause', 'Abwesend', 'Urlaub', 'Nacht'] } },
  'climate.wohnzimmer':      { name: 'Heizung Wohnzimmer',     state: 'heat', hvac: 'heating', ct: 21.2, ch: 48, tt: 22, tmin: 16, tmax: 26, tstep: 0.5, modes: ['off', 'heat', 'auto'], ctl: { presets: ['eco', 'comfort', 'away', 'boost'], preset: 'comfort' } },
  'sensor.netz_leistung':    { name: 'Netzbezug',              state: '450',  unit: 'W' },
  'sensor.pv_leistung':      { name: 'PV Wechselrichter',      state: '3.2',  unit: 'kW' },
  'sensor.pv_string1':       { name: 'PV Modul 1',             state: '1100', unit: 'W' },
  'sensor.pv_string2':       { name: 'PV Modul 2',             state: '1050', unit: 'W' },
  'sensor.pv_string3':       { name: 'PV Modul 3',             state: '1050', unit: 'W' },
  'sensor.batterie_ladung':  { name: 'Hausbatterie',           state: '82',   unit: '%' },
  'sensor.batterie_leistung': { name: 'Batterie Leistung',     state: '600', unit: 'W' },
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
  'cover.rollladen_kueche':  { name: 'Rollladen Küche',        state: 'closed', position: 0 },
  'cover.rollladen_schlafzimmer': { name: 'Rollladen Schlafzimmer', state: 'open', position: 40 },
  'cover.rollladen_gaube':   { name: 'Rollladen Gaube',        state: 'open', position: 100 },
  'light.garage':            { name: 'Garage Licht',           state: 'off' },
  'script.filmabend':        { name: 'Filmabend',              state: 'off' },
  'sensor.bad_feuchte':      { name: 'Bad Luftfeuchte',        state: '64', unit: '%' },
  'sensor.wohnzimmer_co2':   { name: 'Wohnzimmer CO₂',         state: '920', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.schlafzimmer_co2': { name: 'Schlafzimmer CO₂',       state: '1350', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.kinder_co2':       { name: 'Kinderzimmer CO₂',       state: '640', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.wasserzaehler':    { name: 'Wasserzähler',           state: '1234.6', unit: 'm³', dc: 'water' },
  'sensor.gaszaehler':       { name: 'Gaszähler',              state: '845.2', unit: 'm³', dc: 'gas' },
  'sensor.waermemenge':      { name: 'Wärmemengenzähler',      state: '5321', unit: 'kWh', dc: 'energy' },
  'sensor.wasser_garten':    { name: 'Wasserzähler Garten',    state: '87.3', unit: 'm³', dc: 'water' },
  'sensor.pv_dach':          { name: 'PV Dach',                state: '4100', unit: 'W', dc: 'power' },
  'light.nachbar_wohnen':    { name: 'Nachbar Wohnen Licht',   state: 'on', rgb: [255, 200, 140] },
  // the weather in the sky (#419); ?weather=rainy (snowy, cloudy, pouring ...) shows another one. No sun.sun: the demo's sky follows the clock (#418)
  'weather.zuhause':         { name: 'Zuhause', state: new URLSearchParams(location.search).get('weather') || 'partlycloudy', wx: { t: 14, tu: '°C', w: 12, wu: 'km/h' } },
  // the batteries of the sensors' devices (#376: "Geräte" → "Batterie"); the kitchen window contact and the basement sensor are nearly empty
  'sensor.fenster_wohnzimmer_batterie': { name: 'Fenster Wohnzimmer Batterie', state: '84', unit: '%', dc: 'battery' },
  'sensor.fenster_kueche_batterie':     { name: 'Fenster Küche Batterie',      state: '12', unit: '%', dc: 'battery' },
  'sensor.tuer_buero_batterie':         { name: 'Bürotür Batterie',            state: '63', unit: '%', dc: 'battery' },
  'sensor.tuer_wz_kueche_batterie':     { name: 'Tür Wohnzimmer-Küche Batterie', state: '91', unit: '%', dc: 'battery' },
  'sensor.buero_praesenz_batterie':     { name: 'Büro Anwesenheit Batterie',   state: '47', unit: '%', dc: 'battery' },
  'sensor.bad_feuchte_batterie':        { name: 'Bad Luftfeuchte Batterie',    state: '35', unit: '%', dc: 'battery' },
  'sensor.keller_feuchte_batterie':     { name: 'Keller Luftfeuchte Batterie', state: '8', unit: '%', dc: 'battery' },
};
// api/batteries: the battery entity of each sensor's device, as the add-on reads it from Home Assistant's registries
const batteryOf = {
  'binary_sensor.fenster_wohnzimmer': 'sensor.fenster_wohnzimmer_batterie', 'binary_sensor.fenster_kueche': 'sensor.fenster_kueche_batterie',
  'binary_sensor.tuer_buero': 'sensor.tuer_buero_batterie', 'binary_sensor.tuer_wohnzimmer_kueche': 'sensor.tuer_wz_kueche_batterie',
  'binary_sensor.buero_praesenz': 'sensor.buero_praesenz_batterie', 'sensor.bad_feuchte': 'sensor.bad_feuchte_batterie',
  'sensor.keller_feuchte': 'sensor.keller_feuchte_batterie',
};

/* Security (🛡️ Sicherheit): two recorded days, yesterday and today until now. Every day the same story in the demo house: up in the
 * morning, Anna leaves by car, a window is aired, Max comes home, the living room evening, lights out. Lines as in the add-on's files
 * (timeline.py): first a snapshot of every state, then one line per change. */
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function recordedDay(iso) {
  const [y, m, d] = iso.split('-').map(Number), start = new Date(y, m - 1, d).getTime() / 1000, end = new Date(y, m - 1, d + 1).getTime() / 1000;
  const off = { state: 'off' }, at = (hh, mm) => start + hh * 3600 + mm * 60;
  const snap = Object.fromEntries(['light.wohnzimmer', 'light.stehlampe', 'light.kueche', 'light.schlafzimmer', 'light.bad', 'light.buero',
    'light.shapes_wz', 'light.tv_led', 'light.sofa_led', 'light.voute_bett', 'light.voute_fenster', 'light.garage', 'binary_sensor.fenster_wohnzimmer',
    'binary_sensor.fenster_kueche', 'binary_sensor.tuer_buero', 'binary_sensor.tuer_wohnzimmer_kueche', 'binary_sensor.buero_praesenz'].map((e) => [e, off]));
  Object.assign(snap, { 'person.anna': { state: 'home' }, 'person.max': { state: 'not_home' }, 'cover.garagentor': { state: 'closed', position: 0 } });
  const ev = [[6, 40, 'light.bad', { state: 'on' }], [6, 55, 'light.kueche', { state: 'on' }], [7, 20, 'light.bad', off], [7, 35, 'light.kueche', off],
    [7, 45, 'cover.garagentor', { state: 'open', position: 100 }], [7, 46, 'person.anna', { state: 'not_home' }], [7, 52, 'cover.garagentor', { state: 'closed', position: 0 }],
    [11, 5, 'binary_sensor.fenster_kueche', { state: 'on' }], [11, 40, 'binary_sensor.fenster_kueche', off], [17, 10, 'cover.garagentor', { state: 'open', position: 100 }],
    [17, 11, 'person.max', { state: 'home' }], [17, 14, 'cover.garagentor', { state: 'closed', position: 0 }], [17, 20, 'light.kueche', { state: 'on' }],
    [17, 45, 'binary_sensor.fenster_wohnzimmer', { state: 'on' }], [18, 30, 'light.wohnzimmer', { state: 'on', brightness: 70, rgb: [255, 140, 110] }],
    [18, 31, 'light.stehlampe', { state: 'on' }], [18, 50, 'person.anna', { state: 'home' }], [19, 5, 'light.tv_led', { state: 'on', rgb: [255, 60, 160] }],
    [19, 6, 'light.shapes_wz', { state: 'on', rgb: [120, 90, 255] }], [19, 30, 'light.buero', { state: 'on', rgb: [255, 226, 110] }],
    [19, 31, 'binary_sensor.buero_praesenz', { state: 'on' }], [19, 40, 'light.kueche', off], [21, 50, 'light.voute_bett', { state: 'on', rgb: [190, 80, 255] }],
    [22, 30, 'light.wohnzimmer', off], [22, 31, 'light.stehlampe', off], [22, 32, 'light.tv_led', off], [22, 33, 'light.shapes_wz', off], [23, 10, 'light.voute_bett', off]];
  const now = Date.now() / 1000;
  const lines = [{ t: start + 1, snap }, ...ev.map(([hh, mm, e, s]) => ({ t: at(hh, mm), e, s })).filter((l) => l.t <= now)];
  return { day: iso, start, end, now, lines };
}
const recordedDays = () => { const d = new Date(); const today = isoDay(d); d.setDate(d.getDate() - 1); return [today, isoDay(d)]; };

let settings = {
  language: 'auto', theme: 'dark', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, labelMode: 'important', belowMode: 'dim', cameraImages: true, cutaway: true,
  windowFrames: 'anthracite',                               // 3.99: the demo shows the dark window frames (#428)
  facade: 'plaster',                                        // 4.0: plaster outside, finishes on the walls inside (#448)
  favorites: ['scene.wz_gemuetlich', 'scene.wz_aus', 'light.stehlampe', 'light.kueche'],   // 4.2: favourites and light groups (#471)
  lightGroups: [{ id: 'g_wohnen', name: 'Wohnen', rooms: ['r1', 'r2'] }, { id: 'g_oben', name: 'Oben', rooms: ['q1', 'q2'] }, { id: 'g_keller', name: 'Keller', rooms: ['k1', 'k2', 'k3'] }],
};

const notify = { on: false, kinds: ['alarm', 'smoke', 'gas', 'co', 'water'], via: 'whatsapp', phone: '', services: [], entities: [], tgMode: 'user', tgUsers: [], clear: false, apikey: '', tgkey: '' };   // api/notify in the demo
// the holiday alarm (#456) in the demo: set up with the code 1234; armed for 25 s, a "burglar" opens the office door (the whole flow can be seen)
const guard = { cfg: { sensors: ['binary_sensor.tuer_buero', 'binary_sensor.fenster_kueche', 'binary_sensor.fenster_wohnzimmer'], offline: true, delay: 20, actions: [],
  notify: true, report: true, code: '1234' }, st: { phase: 'off', since: 0, due: 0, by: '', what: null }, armedAt: 0 };
function guardView() {
  const g = guard, now = Date.now() / 1000;
  if (g.st.phase === 'arming' && now >= g.st.due) { g.st = { ...g.st, phase: 'armed', due: 0 }; g.armedAt = now; }
  if (g.st.phase === 'armed' && g.armedAt && now - g.armedAt >= 25 && g.cfg.sensors.includes('binary_sensor.tuer_buero')) {
    entities['binary_sensor.tuer_buero'].state = 'on';
    g.st = { ...g.st, phase: g.cfg.delay ? 'entry' : 'alarm', due: now + g.cfg.delay, what: { entity: 'binary_sensor.tuer_buero', name: 'Bürotür', why: 'open', at: now } };
  }
  if (g.st.phase === 'entry' && now >= g.st.due) g.st = { ...g.st, phase: 'alarm', due: 0 };
  return { phase: g.st.phase, left: ['arming', 'entry'].includes(g.st.phase) ? Math.max(0, Math.round(g.st.due - now)) : 0, since: g.st.since, by: g.st.by, what: g.st.what };
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const file = (text, name, type) => new Response(text, { status: 200, headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${name}"` } });
const ONLY_ADDON = 'In der Demo nicht verfügbar (nur im Add-on).';
const examples = { flat: flatExample, house: houseExample, showcase: showcaseExample };
const demoVersion = () => (typeof __DEMO_VERSION__ === 'undefined' ? 'demo' : __DEMO_VERSION__);

export function installDemoBackend() {
  window.__fpNoLive = true;                                  // no add-on server behind the demo: no live channel, states change only here
  // links into the add-on (🗄️ Backup → "Backup herunterladen", ⬇ of a recorded day, "Als Datei exportieren"): answered here too and saved
  // as a file. Opened as a page they left the demo (a GitHub error page, an empty tab from the file)
  document.addEventListener('click', async (e) => {
    const a = e.target.closest?.('a[href]'), href = a?.getAttribute('href') || '';
    if (!href.startsWith('api/')) return;
    e.preventDefault();
    const r = await window.fetch(href);
    if (!r.ok) { window.alert((await r.json().catch(() => ({}))).error || ONLY_ADDON); return; }
    const name = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || a.getAttribute('download') || 'floorplan3d.json';
    const blob = URL.createObjectURL(await r.blob()), dl = Object.assign(document.createElement('a'), { href: blob, download: name });
    document.body.append(dl); dl.click(); dl.remove();
    setTimeout(() => URL.revokeObjectURL(blob), 10000);
  }, true);
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
    if (path === 'api/layout') {                              // several houses (#220): ?house=id; edits live only in this tab
      const hid = new URL(url, location.href).searchParams.get('house') || houses[0].id;
      if (!layouts[hid]) return json({ error: 'unknown house' }, 404);
      if (method === 'PUT') { layouts[hid] = JSON.parse(init.body); return json({ ok: true }); }
      return json(layouts[hid]);
    }
    if (path === 'api/houses') {
      if (method === 'POST') {                                  // a new (empty) house or a copy, kept until the tab is closed
        const body = JSON.parse(init.body || '{}'), id = `h${Date.now().toString(36)}`;
        layouts[id] = body.copyFrom && layouts[body.copyFrom] ? structuredClone(layouts[body.copyFrom]) : { version: 1, floors: [{ id: 'f1', name: 'Erdgeschoss', walls: [], rooms: [], devices: [] }] };
        houses.push({ id, name: String(body.name || '').trim() });
        return json({ id, name: houses.at(-1).name });
      }
      return json(houses);
    }
    if (path.startsWith('api/houses/')) {
      const id = decodeURIComponent(path.slice('api/houses/'.length)), h = houses.find((x) => x.id === id);
      if (!h) return json({ error: 'unknown house' }, 404);
      if (method === 'PATCH') { h.name = String(JSON.parse(init.body || '{}').name || h.name).trim(); return json({ ok: true }); }
      if (method === 'DELETE' && houses.length > 1) { houses.splice(houses.indexOf(h), 1); delete layouts[id]; return json({ ok: true }); }
      return json({ error: 'cannot delete' }, 400);
    }
    if (path === 'api/energy/prefs') {                   // the energy dashboard of Home Assistant (#407), as in a real one: the battery counted plus = discharging there,
      return json({ prefs: { energy_sources: [               // so its sensor (plus = charging here) is the inverted one; the garden water meter is not in the plan yet
        { type: 'grid', stat_energy_from: 'sensor.netz_bezug_kwh', stat_energy_to: 'sensor.netz_einspeisung_kwh', stat_rate: 'sensor.netz_leistung' },
        { type: 'solar', stat_energy_from: 'sensor.pv_ertrag_kwh', stat_rate: 'sensor.pv_leistung' },
        { type: 'battery', stat_energy_from: 'sensor.batterie_entladen_kwh', stat_energy_to: 'sensor.batterie_geladen_kwh', stat_soc: 'sensor.batterie_ladung',
          power_config: { stat_rate_inverted: 'sensor.batterie_leistung' } },
        { type: 'gas', stat_energy_from: 'sensor.gaszaehler' },
        { type: 'water', stat_energy_from: 'sensor.wasserzaehler' },
        { type: 'water', stat_energy_from: 'sensor.wasser_garten' },
      ], device_consumption: [] }, siblings: {} });
    }
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
        hvac: e.hvac ?? null, tt: e.tt ?? null, tmin: e.tmin ?? null, tmax: e.tmax ?? null, tstep: e.tstep ?? null, modes: e.modes ?? null,
        bat: e.bat ?? null, ctl: e.ctl ? structuredClone(e.ctl) : null, wx: e.wx ?? null, sun: e.sun ?? null })));
    }
    if (path === 'api/version') {                       // so that the version pill shows in the demo too; the file checks do not apply to a single file
      return json({ known: true, version: demoVersion(), buildHash: 'demo', short: 'demo', server: { ok: true, files: 0, changed: [], missing: [], extra: [] }, staticFiles: {} });
    }
    if (path === 'api/version/remote') return json({ state: 'same', version: demoVersion(), short: 'demo' });   // built from GitHub's newest main
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
      if (service === 'toggle') e.state = id.startsWith('cover.') ? (e.state === 'open' ? 'closed' : 'open') : e.state === 'on' ? 'off' : 'on';   // a favourite (#471)
      if (service === 'toggle' && id.startsWith('cover.')) e.position = e.state === 'open' ? 100 : 0;
      if (service === 'turn_on') { e.state = 'on'; if (data?.brightness_pct != null) e.brightness = data.brightness_pct; if (data?.rgb_color) e.rgb = data.rgb_color; if (data?.color_temp_kelvin) e.rgb = data.color_temp_kelvin < 4500 ? [255, 190, 120] : [200, 220, 255]; }
      if (service === 'set_cover_position') { e.position = data.position; e.state = data.position > 0 ? 'open' : 'closed'; }
      if (service === 'open_cover') { e.state = 'open'; e.position = 100; }
      if (service === 'close_cover') { e.state = 'closed'; e.position = 0; }
      if (service === 'turn_off') e.state = 'off';
      if (service === 'set_temperature') { e.tt = data.temperature; if (e.state !== 'off') e.hvac = e.ct < e.tt ? 'heating' : 'idle'; }
      if (service === 'set_hvac_mode') { e.state = data.hvac_mode; e.hvac = data.hvac_mode === 'off' ? 'off' : (e.ct < e.tt ? 'heating' : 'idle'); }
      const c = e.ctl || (e.ctl = {});                          // #406: music, vacuum, fan, alarm, choice list, presets
      if (id.startsWith('media_player.') && service === 'turn_on') e.state = 'paused';
      if (service === 'media_play_pause') e.state = e.state === 'playing' ? 'paused' : 'playing';
      if (service === 'media_next_track' || service === 'media_previous_track') {
        const songs = ['Sommerregen', 'Abendlicht', 'Nordwind', 'Kaffee am Morgen'], i = songs.indexOf(c.title);
        c.title = songs[(Math.max(0, i) + (service === 'media_next_track' ? 1 : songs.length - 1)) % songs.length]; e.state = 'playing';
      }
      if (service === 'volume_set') c.vol = Math.round(data.volume_level * 100);
      if (service === 'volume_mute') c.muted = data.is_volume_muted;
      if (service === 'select_source') c.source = data.source;
      if (service === 'start') e.state = 'cleaning';
      if (service === 'pause') e.state = 'paused';
      if (service === 'stop') e.state = 'idle';
      if (service === 'return_to_base') { e.state = 'returning'; setTimeout(() => { if (e.state === 'returning') e.state = 'docked'; }, 4000); }
      if (service === 'set_fan_speed') c.speed = data.fan_speed;
      if (service === 'set_percentage') { c.pct = data.percentage; e.state = data.percentage > 0 ? 'on' : 'off'; }
      if (service === 'oscillate') c.osc = data.oscillating;
      if (service === 'set_preset_mode') c.preset = data.preset_mode;
      if (service === 'set_fan_mode') c.fan = data.fan_mode;
      if (service.startsWith('alarm_arm_')) e.state = `armed_${service.slice(10)}`;
      if (service === 'alarm_disarm') { if (data?.code !== '1234') return json({ ok: false }, 502); e.state = 'disarmed'; }   // the demo's code
      if (service === 'select_option') e.state = data.option;
      return json({ ok: true });
    }
    if (path === 'api/notify') {                         // the message on alarm (#414): shown in the demo too, kept only in this tab, never sent
      if (method === 'PUT') {
        const b = JSON.parse(init.body || '{}'), keep = (k) => (typeof b[k] === 'string' && b[k].trim() ? b[k].trim() : notify[k]);
        const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[\s,;|]+/)).filter(Boolean);
        Object.assign(notify, b, { apikey: keep('apikey'), tgkey: keep('tgkey'), services: list(b.services ?? notify.services),
          entities: list(b.entities ?? notify.entities).filter((e) => /^notify\.[a-z0-9_]+$/.test(e)),
          tgUsers: list(b.tgUsers ?? notify.tgUsers).map((u) => (/^[@+]/.test(u) ? u : `@${u}`)) });
      }
      const n = notify, ready = !n.on ? 'off' : n.via === 'ha' ? (n.services.length || n.entities.length ? null : 'service')
        : n.via === 'telegram' ? (n.tgMode === 'group' ? (n.tgkey ? null : 'tgkey') : (n.tgUsers.length ? null : 'tguser'))
        : !n.phone ? 'phone' : n.apikey ? null : 'apikey';
      return json({ on: n.on, kinds: n.kinds, via: n.via, phone: n.phone, services: n.services, entities: n.entities,
        available: [{ id: 'mobile_app_handy', name: 'mobile_app_handy', origin: 'app', platform: '' },     // where each one comes from (#460)
          { id: 'notify.telegram_bot_familie', name: 'Familien-Chat', origin: 'integration', platform: 'telegram_bot' },
          { id: 'telegram_familie', name: 'telegram_familie', origin: 'yaml', platform: '' }, { id: 'whatsapp', name: 'whatsapp', origin: 'yaml', platform: '' }],
        tgMode: n.tgMode, tgUsers: n.tgUsers, clear: n.clear, hasKey: !!n.apikey, hasTgKey: !!n.tgkey, ready });
    }
    if (path === 'api/guard') {
      if (method === 'PUT') {
        const b = JSON.parse(init.body || '{}');
        ['sensors', 'actions', 'offline', 'notify', 'report', 'delay'].forEach((k) => { if (k in b) guard.cfg[k] = b[k]; });
        if (/^[0-9]{4,8}$/.test(b.code || '')) guard.cfg.code = b.code;
      }
      const { code, ...pub } = guard.cfg, ready = !pub.sensors.length ? 'sensors' : code ? null : 'code';
      const cfg = { ...pub, hasCode: !!code };
      // ?wand=1 shows it as on a wall tablet (a user who may not edit): the lock screen instead of the strip (#460)
      const wall = new URLSearchParams(location.search).has('wand');
      return json(method === 'PUT' ? { cfg, ready } : { view: guardView(), ready, sensors: pub.sensors, delay: pub.delay, locked: false, canEdit: !wall, cfg });
    }
    if (path === 'api/guard/arm' || path === 'api/guard/disarm') {
      const b = JSON.parse(init.body || '{}'), now = Date.now() / 1000;
      if (b.code !== guard.cfg.code) return json({ error: 'code', left: 4 }, 403);
      if (path.endsWith('/arm') && guard.st.phase === 'off') guard.st = { phase: guard.cfg.delay ? 'arming' : 'armed', since: now, due: now + guard.cfg.delay, by: 'demo', what: null };
      if (path.endsWith('/disarm')) { guard.st = { phase: 'off', since: now, due: 0, by: 'demo', what: null }; guard.armedAt = 0; entities['binary_sensor.tuer_buero'].state = 'off'; }
      if (guard.st.phase === 'armed') guard.armedAt = now;
      return json({ view: guardView() });
    }
    if (path === 'api/batteries') return json(batteryOf);
    if (path === 'api/timeline') {
      return json({ days: recordedDays().map((day) => ({ day, size: JSON.stringify(recordedDay(day).lines).length })), on: true, keepDays: 7, recording: true,
        ha: true, folder: 'addon_configs/…_floorplan3d/timeline' });
    }
    if (path.startsWith('api/timeline/')) {
      const day = path.slice('api/timeline/'.length);
      if (!recordedDays().includes(day)) return json({ error: 'not recorded' }, 404);
      const rec = recordedDay(day);
      if (/[?&]download=/.test(url)) return file(rec.lines.map((l) => JSON.stringify(l)).join('\n') + '\n', `floorplan3d-timeline-${day}.jsonl`, 'application/x-ndjson');
      return json(rec);
    }
    if (path === 'api/backup') {                         // the demo's houses and settings as a backup file of the add-on; restoring one needs the add-on
      if (method === 'POST') return json({ error: ONLY_ADDON }, 501);
      return file(JSON.stringify({ format: 'floorplan3d-backup', version: 1, exported: new Date().toISOString(), houses: houses.map((h) => ({ ...h, layout: layouts[h.id] })),
        settings, backgrounds: {}, models: {} }), 'floorplan3d-backup-demo.json', 'application/json');
    }
    if (path === 'api/import/schema') return json(propertySchema);
    if (path.startsWith('api/import/examples/')) {         // the examples of the import dialog, the AI prompt's lists: the same as in the add-on
      const ex = examples[path.slice('api/import/examples/'.length)];
      return ex ? json(ex) : json({ error: 'unknown example' }, 404);
    }
    if (path === 'api/import') return json({ error: ONLY_ADDON }, 501);   // building a house from JSON is the add-on's (importer.py)
    if (path === 'api/notify/test') return json({ error: 'in der Demo wird nichts gesendet' }, 501);
    if (path === 'api/backgrounds' && method === 'POST') return json({ error: 'Upload ist in der Demo deaktiviert' }, 501);
    if (path === 'api/models') {
      if (method === 'POST') return json({ error: 'Upload ist in der Demo deaktiviert' }, 501);
      return json([]);
    }
    return json({ error: ONLY_ADDON }, 404);
  };
}
