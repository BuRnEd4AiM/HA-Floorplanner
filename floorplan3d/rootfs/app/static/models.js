import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { SHAPES, polyOf, DEFAULT_PANELS } from './nanoleaf.js';
import { ringSections, piecesLocal, pointAt } from './ledring.js';
import { kitchenLayout } from './kitchen.js';
import { solarField, PANEL } from './solarroof.js';

/* Geräte-Typen: label, Standardhöhe (y) über dem Boden. Alle Maße in Metern. */
export const DEVICE_TYPES = {
  light:      { label: 'Deckenlampe', y: 2.55 },
  lamp:       { label: 'Stehlampe',   y: 0 },
  switch:     { label: 'Schalter',    y: 1.1 },
  sensor:     { label: 'Sensor',      y: 1.8 },
  thermostat: { label: 'Heizung',     y: 0.2 },
  tv:         { label: 'TV',          y: 0.5 },
  tv_wall:    { label: 'Wand-TV',     y: 1.0 },
  sofa:       { label: 'Sofa',        y: 0 },
  bed:        { label: 'Bett',        y: 0 },
  table:      { label: 'Tisch',       y: 0 },
  door:       { label: 'Tür',         y: 0, hidden: true },     // legacy: doors/windows are wall openings now
  window:     { label: 'Fenster',     y: 0.9, hidden: true },
  plant:      { label: 'Pflanze',     y: 0 },
  chair:      { label: 'Stuhl',       y: 0 },
  armchair:   { label: 'Sessel',      y: 0 },
  desk:       { label: 'Schreibtisch', y: 0 },
  diningtable:{ label: 'Esstisch',    y: 0 },
  coffeetable:{ label: 'Couchtisch',  y: 0 },
  wardrobe:   { label: 'Schrank',     y: 0 },
  shelf:      { label: 'Regal',       y: 0 },
  sideboard:  { label: 'Sideboard',   y: 0 },
  kitchen:    { label: 'Küchenzeile', y: 0 },
  fridge:     { label: 'Kühlschrank', y: 0 },
  washer:     { label: 'Waschmaschine', y: 0 },
  bathtub:    { label: 'Badewanne',   y: 0 },
  toilet:     { label: 'WC',          y: 0 },
  basin:      { label: 'Waschtisch',  y: 0 },
  shower:     { label: 'Dusche',      y: 0 },
  carpet:     { label: 'Teppich',     y: 0 },
  car:        { label: 'Auto',        y: 0 },
  tree:       { label: 'Baum',        y: 0 },
  bush:       { label: 'Busch',       y: 0 },
  pool:       { label: 'Pool',        y: 0 },
  lawn:       { label: 'Rasen',       y: 0 },
  terrace:    { label: 'Terrasse',    y: 0 },
  path:       { label: 'Weg',         y: 0 },
  fence:      { label: 'Zaun',        y: 0 },
  sofa2:      { label: 'Ecksofa',      y: 0 },
  tvstand:    { label: 'TV-Board',     y: 0 },
  bookcase:   { label: 'Bücherregal',  y: 0 },
  fireplace:  { label: 'Kamin',        y: 0 },
  piano:      { label: 'Klavier',      y: 0 },
  pouf:       { label: 'Hocker',       y: 0 },
  sidetable:  { label: 'Beistelltisch', y: 0 },
  curtain:    { label: 'Vorhang',      y: 0 },
  barstool:   { label: 'Barhocker',    y: 0 },
  stove:      { label: 'Herd',         y: 0 },
  oven:       { label: 'Backofen',     y: 0 },
  dishwasher: { label: 'Geschirrspüler', y: 0 },
  sink:       { label: 'Spüle',        y: 0 },
  island:     { label: 'Kücheninsel',  y: 0 },
  microwave:  { label: 'Mikrowelle',   y: 0.9 },
  mirror:     { label: 'Spiegel',      y: 0.9 },
  towelrad:   { label: 'Handtuchheizkörper', y: 0.3 },
  doublebasin:{ label: 'Doppelwaschtisch', y: 0 },
  bed_single: { label: 'Einzelbett',   y: 0 },
  nightstand: { label: 'Nachttisch',   y: 0 },
  dresser:    { label: 'Kommode',      y: 0 },
  crib:       { label: 'Babybett',     y: 0 },
  monitor:    { label: 'PC-Arbeitsplatz', y: 0.75 },
  officechair:{ label: 'Bürostuhl',    y: 0 },
  printer:    { label: 'Drucker',      y: 0.75 },
  pendant:    { label: 'Hängelampe',   y: 1.9 },
  walllamp:   { label: 'Wandlampe',    y: 1.7 },
  spot:       { label: 'Deckenspot',   y: 2.55 },
  radiator:   { label: 'Heizkörper',   y: 0.15 },
  boiler:     { label: 'Warmwasserspeicher', y: 0 },
  camera:     { label: 'Kamera',       y: 2.2 },
  speaker:    { label: 'Lautsprecher', y: 0 },
  vacuum:     { label: 'Saugroboter',  y: 0 },
  smoke:      { label: 'Rauchmelder',  y: 2.55 },
  router:     { label: 'Router',       y: 1.0 },
  presence:   { label: 'Anwesenheit',  y: 0 },
  inverter:   { label: 'Wechselrichter', y: 1.2 },
  powermeter: { label: 'Stromzähler',  y: 1.4 },
  solarpanel: { label: 'Solarpanel',   y: 0 },
  houseentry: { label: 'Hausanschluss', y: 0 },
  fusebox:    { label: 'Zählerkasten', y: 1.4 },
  battery:    { label: 'Batteriespeicher', y: 0 },
  wallbox:    { label: 'Wallbox',      y: 1.2 },
  picture:    { label: 'Bild',         y: 1.5 },
  orb:        { label: 'Lichtkugel',  y: 0.4 },
  strip:      { label: 'LED-Streifen', y: 0.5 },
  ledring:    { label: 'LED-Ring', y: 2.5 },
  kitchenrun: { label: 'Küchenzeile (selbst bauen)', y: 0 },
  panel_tri:  { label: 'Nanoleaf Dreieck',  y: 1.4 },
  panel_hex:  { label: 'Nanoleaf Sechseck', y: 1.4 },
  panel_sq:   { label: 'Nanoleaf Quadrat',  y: 1.4 },
  panel_bar:  { label: 'Nanoleaf Linie',    y: 1.4 },
  nanoleaf:   { label: 'Nanoleaf Layout',   y: 1.4 },
  tv_led:     { label: 'TV-Hintergrundlicht', y: 1.0 },
};


/* Library categories (room types) for the palette */
export const CATEGORIES = {
  living:  ['sofa', 'sofa2', 'armchair', 'pouf', 'table', 'coffeetable', 'sidetable', 'diningtable', 'chair', 'barstool', 'tv', 'tv_wall', 'tvstand', 'sideboard', 'shelf', 'bookcase', 'fireplace', 'piano', 'carpet', 'curtain', 'plant'],
  kitchen: ['kitchenrun', 'kitchen', 'island', 'sink', 'stove', 'oven', 'microwave', 'dishwasher', 'fridge', 'washer'],
  bath:    ['bathtub', 'shower', 'toilet', 'basin', 'doublebasin', 'mirror', 'towelrad'],
  bedroom: ['bed', 'bed_single', 'crib', 'wardrobe', 'nightstand', 'dresser'],
  office:  ['desk', 'monitor', 'officechair', 'printer'],
  lighting:['light', 'pendant', 'spot', 'walllamp', 'lamp', 'orb', 'strip', 'ledring', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led'],
  smart:   ['switch', 'sensor', 'thermostat', 'radiator', 'boiler', 'camera', 'speaker', 'vacuum', 'smoke', 'router', 'presence'],
  power:   ['houseentry', 'fusebox', 'powermeter', 'inverter', 'solarpanel', 'battery', 'wallbox'],
  outdoor: ['tree', 'bush', 'lawn', 'terrace', 'path', 'pool', 'fence', 'car'],
  decor:   ['picture'],
};
export const catOf = (type) => Object.keys(CATEGORIES).find((k) => CATEGORIES[k].includes(type)) || 'living';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...extra });

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y + h / 2, z);
  return m;
}
function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y + h / 2, z);
  return m;
}
function glowMat(color = 0xfff2cc) {
  return new THREE.MeshStandardMaterial({ color, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.4 });
}

/** flat light panel (Nanoleaf & co.) standing upright, facing +z, centred on its origin so it turns around its middle; the whole shape glows with the light */
function panel(g, pts) {
  const glow = glowMat();
  glow.side = THREE.DoubleSide;
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false });
  const m = new THREE.Mesh(geo, glow);
  m.position.z = -0.0125;
  g.add(m);
  g.userData.glow = [glow];
}
const ngon = (n, r, cy, a0 = 0) => Array.from({ length: n }, (_, k) => [Math.cos(a0 + (k * 2 * Math.PI) / n) * r, cy + Math.sin(a0 + (k * 2 * Math.PI) / n) * r]);

/** a whole Nanoleaf layout (many panels, ONE entity): every panel shares one material, so the lot shows the same colour */
function nanoleaf(g, d) {
  const glow = glowMat();
  glow.side = THREE.DoubleSide;
  (d?.panels?.length ? d.panels : DEFAULT_PANELS).forEach((p) => {
    const poly = polyOf(p), cx = p.x, cy = p.y;
    const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(cx + (x - cx) * 0.97, cy + (y - cy) * 0.97)));
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false }), glow);
    m.position.z = -0.0125;
    g.add(m);
  });
  g.userData.glow = [glow];
  g.userData.solid = true;          // in the hologram theme these stay solid (not see-through from the side)
}

/** the TV's own backlight (ambilight): a thin frame just behind the screen, shown only when the device has a backlight entity */
function tvLed(g, W, H, cy, z) {
  const led = glowMat(), t = 0.03, parts = [];
  [[W, t, 0, cy + (H - t) / 2], [W, t, 0, cy - (H - t) / 2], [t, H, (W - t) / 2, cy], [t, H, -(W - t) / 2, cy]].forEach(([w, h, x, y]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), led);
    m.position.set(x, y, z);
    m.userData.ledPart = true; m.visible = false;
    g.add(m); parts.push(m);
  });
  g.userData.led = [led];
  g.userData.ledParts = parts;
}

const builders = {
  tv_led(g) {                   // LED frame behind a wall TV: a thin glowing ring a little larger than the TV, so the light spills out around it
    const glow = glowMat();
    const W = 1.3, H = 0.78, t = 0.035;
    [[W, t, 0, (H - t) / 2], [W, t, 0, -(H - t) / 2], [t, H, (W - t) / 2, 0], [t, H, -(W - t) / 2, 0]].forEach(([w, h, x, y]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), glow);
      m.position.set(x, y, -0.005);
      g.add(m);
    });
    g.userData.glow = [glow];
  },
  panel_tri(g) { panel(g, [[-0.12, -0.069], [0.12, -0.069], [0, 0.139]]); },
  panel_hex(g) { panel(g, ngon(6, 0.13, 0)); },
  panel_sq(g)  { panel(g, [[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]]); },
  panel_bar(g) { panel(g, [[-0.45, -0.02], [0.45, -0.02], [0.45, 0.02], [-0.45, 0.02]]); },
  orb(g) {                      // glowing ball: one spot of an LED strip / accent light
    const glow = glowMat();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), glow));
    g.userData.glow = [glow];
  },
  strip(g) {                    // 1 m LED strip, scale it to the real length
    const glow = glowMat();
    g.add(box(1, 0.025, 0.025, glow, 0, -0.0125, 0));
    g.userData.glow = [glow];
  },
  light(g) {
    const glow = glowMat();
    g.add(cyl(0.03, 0.03, 0.25, std('#555'), 0, 0.05, 0, 8));
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glow);
    shade.rotation.x = Math.PI;
    shade.position.y = 0.05;
    g.add(shade);
    g.userData.glow = [glow];
  },
  lamp(g) {
    const glow = glowMat();
    g.add(cyl(0.18, 0.2, 0.03, std('#333')));
    g.add(cyl(0.015, 0.015, 1.4, std('#333'), 0, 0.03, 0, 8));
    g.add(cyl(0.12, 0.2, 0.28, glow, 0, 1.4));
    g.userData.glow = [glow];
  },
  switch(g) {
    g.add(box(0.08, 0.08, 0.02, std('#f2f2f2'), 0, -0.04, 0));
    g.add(box(0.03, 0.03, 0.01, std('#888'), 0, -0.015, 0.015));
  },
  sensor(g) {
    const glow = glowMat(0x9fe8ff);
    g.add(box(0.07, 0.07, 0.04, std('#eee'), 0, -0.035, 0));
    g.add(cyl(0.015, 0.015, 0.012, glow, 0, -0.02, 0.03, 12).rotateX(Math.PI / 2));
    g.userData.glow = [glow];
  },
  thermostat(g) {
    const glow = glowMat(0xff9a5c);
    g.add(box(0.9, 0.6, 0.08, std('#f4f4f4')));
    for (let i = 0; i < 6; i++) g.add(box(0.03, 0.5, 0.02, std('#dcdcdc'), -0.36 + i * 0.145, 0.05, 0.05));
    g.add(box(0.06, 0.04, 0.01, glow, 0.38, 0.5, 0.045));
    g.userData.glow = [glow];
  },
  tv_wall(g) {
    const glow = glowMat(0x9db8ff);
    g.add(box(1.25, 0.73, 0.05, std('#111'), 0, 0, 0));
    g.add(box(1.19, 0.67, 0.01, glow, 0, 0.03, 0.03));
    g.userData.glow = [glow];
    tvLed(g, 1.31, 0.79, 0.365, -0.03);
  },
  tv(g) {
    const glow = glowMat(0x9db8ff);
    g.add(box(1.2, 0.5, 0.45, std('#5a4630'), 0, -0.5, 0));       // Lowboard
    g.add(box(1.1, 0.65, 0.04, std('#111'), 0, 0.02, 0));
    g.add(box(1.04, 0.59, 0.01, glow, 0, 0.05, 0.025));
    g.add(box(0.2, 0.03, 0.15, std('#222'), 0, 0, 0));
    g.userData.glow = [glow];
    tvLed(g, 1.17, 0.73, 0.345, -0.035);
  },
  sofa(g) {
    const c = std('#6b7a8f');
    g.add(box(2.0, 0.4, 0.9, c));
    g.add(box(2.0, 0.5, 0.2, c, 0, 0.4, -0.35));
    g.add(box(0.2, 0.25, 0.7, c, -0.9, 0.4, 0.1));
    g.add(box(0.2, 0.25, 0.7, c, 0.9, 0.4, 0.1));
  },
  bed(g) {
    g.add(box(1.6, 0.3, 2.0, std('#8b6b4a')));
    g.add(box(1.5, 0.2, 1.9, std('#e8e6df'), 0, 0.3, 0.02));
    g.add(box(1.6, 0.9, 0.08, std('#8b6b4a'), 0, 0, -1.0));
    g.add(box(0.55, 0.12, 0.35, std('#fff'), -0.38, 0.5, -0.75));
    g.add(box(0.55, 0.12, 0.35, std('#fff'), 0.38, 0.5, -0.75));
  },
  table(g) {
    const wood = std('#a07b52');
    g.add(box(1.4, 0.05, 0.8, wood, 0, 0.72, 0));
    [[-0.63, -0.33], [0.63, -0.33], [-0.63, 0.33], [0.63, 0.33]].forEach(([x, z]) => g.add(box(0.06, 0.72, 0.06, wood, x, 0, z)));
  },
  door(g) {
    g.add(box(0.95, 2.05, 0.05, std('#8a6a48'), 0, 0, 0));
    g.add(box(1.05, 0.05, 0.1, std('#d0d0d0'), 0, 2.05, 0));
    g.add(cyl(0.02, 0.02, 0.12, std('#bbb'), 0.38, 1.0, 0.05, 8).rotateX(Math.PI / 2));
  },
  window(g) {
    const glass = new THREE.MeshStandardMaterial({ color: 0x9cc9ee, transparent: true, opacity: 0.45, roughness: 0.1 });
    const frame = std('#f2f2f2');
    g.add(box(1.2, 1.2, 0.02, glass));
    g.add(box(1.28, 0.05, 0.1, frame, 0, 0, 0));
    g.add(box(1.28, 0.05, 0.1, frame, 0, 1.2, 0));
    g.add(box(0.05, 1.2, 0.1, frame, -0.6, 0, 0));
    g.add(box(0.05, 1.2, 0.1, frame, 0.6, 0, 0));
    g.add(box(0.04, 1.2, 0.08, frame, 0, 0, 0));
  },
  plant(g) {
    g.add(cyl(0.16, 0.12, 0.3, std('#b4633c')));
    const leaf = std('#3f8f4a');
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.18 + (i % 2) * 0.05, 10, 8), leaf);
      const a = (i / 5) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.12, 0.6 + (i % 3) * 0.15, Math.sin(a) * 0.12);
      g.add(s);
    }
  },
};

Object.assign(builders, {
  chair(g) {
    const w = std('#a07b52');
    g.add(box(0.42, 0.05, 0.42, w, 0, 0.45, 0));
    [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, z]) => g.add(box(0.04, 0.45, 0.04, w, x, 0, z)));
    g.add(box(0.42, 0.45, 0.04, w, 0, 0.5, -0.2));
  },
  armchair(g) {
    const c = std('#7a6b8f');
    g.add(box(0.9, 0.4, 0.85, c));
    g.add(box(0.9, 0.45, 0.2, c, 0, 0.4, -0.33));
    g.add(box(0.16, 0.25, 0.65, c, -0.37, 0.4, 0.08));
    g.add(box(0.16, 0.25, 0.65, c, 0.37, 0.4, 0.08));
  },
  desk(g) {
    const w = std('#b08a5c');
    g.add(box(1.4, 0.04, 0.7, w, 0, 0.73, 0));
    g.add(box(0.05, 0.73, 0.65, w, -0.65, 0, 0));
    g.add(box(0.4, 0.6, 0.6, std('#9a7548'), 0.45, 0.13, 0));
    const glow = glowMat(0x9db8ff);
    g.add(box(0.55, 0.32, 0.02, std('#111'), 0, 0.85, -0.2));
    g.add(box(0.5, 0.27, 0.01, glow, 0, 0.875, -0.19));
    g.userData.glow = [glow];
  },
  diningtable(g) {
    const wood = std('#a07b52');
    g.add(box(1.8, 0.05, 0.95, wood, 0, 0.72, 0));
    [[-0.82, -0.4], [0.82, -0.4], [-0.82, 0.4], [0.82, 0.4]].forEach(([x, z]) => g.add(box(0.06, 0.72, 0.06, wood, x, 0, z)));
    const cw = std('#6f5a40');
    [-0.5, 0.5].forEach((x) => [-0.62, 0.62].forEach((z) => {
      g.add(box(0.4, 0.04, 0.4, cw, x, 0.45, z));
      g.add(box(0.4, 0.4, 0.04, cw, x, 0.49, z + (z < 0 ? -0.18 : 0.18)));
    }));
  },
  coffeetable(g) {
    const w = std('#8b6b4a');
    g.add(box(1.0, 0.04, 0.55, w, 0, 0.4, 0));
    [[-0.45, -0.22], [0.45, -0.22], [-0.45, 0.22], [0.45, 0.22]].forEach(([x, z]) => g.add(box(0.04, 0.4, 0.04, w, x, 0, z)));
  },
  wardrobe(g) {
    const w = std('#d8d3c8');
    g.add(box(1.5, 2.1, 0.6, w));
    g.add(box(0.01, 2.0, 0.01, std('#888'), 0, 0.05, 0.305));
    g.add(box(0.03, 0.2, 0.02, std('#888'), -0.06, 1.0, 0.31));
    g.add(box(0.03, 0.2, 0.02, std('#888'), 0.06, 1.0, 0.31));
  },
  shelf(g) {
    const w = std('#a07b52');
    g.add(box(0.9, 1.9, 0.04, std('#8a6a48'), 0, 0, -0.16));
    for (let i = 0; i < 5; i++) g.add(box(0.9, 0.03, 0.34, w, 0, i * 0.45, 0));
    g.add(box(0.03, 1.9, 0.34, w, -0.44, 0, 0));
    g.add(box(0.03, 1.9, 0.34, w, 0.44, 0, 0));
  },
  sideboard(g) {
    g.add(box(1.6, 0.75, 0.42, std('#c9b79a')));
    g.add(box(0.01, 0.65, 0.01, std('#777'), -0.27, 0.05, 0.215));
    g.add(box(0.01, 0.65, 0.01, std('#777'), 0.27, 0.05, 0.215));
  },
  kitchen(g) {
    g.add(box(2.4, 0.86, 0.6, std('#e6e6e6')));
    g.add(box(2.42, 0.04, 0.62, std('#555'), 0, 0.86, 0));
    g.add(box(2.4, 0.7, 0.32, std('#e6e6e6'), 0, 1.4, -0.14));
    [-0.3, 0, 0.3, 0.6].forEach((x) => g.add(cyl(0.09, 0.09, 0.01, std('#222'), x - 0.3, 0.9, 0.05, 16)));
  },
  fridge(g) {
    g.add(box(0.6, 1.8, 0.65, std('#d4dbe0')));
    g.add(box(0.02, 0.5, 0.03, std('#888'), 0.22, 1.1, 0.34));
    g.add(box(0.5, 0.01, 0.01, std('#9aa'), 0, 0.6, 0.33));
  },
  washer(g) {
    g.add(box(0.6, 0.85, 0.6, std('#f0f0f0')));
    const glass = new THREE.MeshStandardMaterial({ color: 0x6fa8d8, roughness: 0.1, metalness: 0.3 });
    g.add(cyl(0.2, 0.2, 0.02, glass, 0, 0.3, 0.3, 24).rotateX(Math.PI / 2));
  },
  bathtub(g) {
    const w = std('#f4f6f8');
    g.add(box(1.7, 0.55, 0.75, w));
    g.add(box(1.5, 0.05, 0.55, new THREE.MeshStandardMaterial({ color: 0x9fd0ee, transparent: true, opacity: 0.7 }), 0, 0.42, 0));
  },
  toilet(g) {
    const w = std('#f4f6f8');
    g.add(box(0.38, 0.38, 0.5, w, 0, 0, 0.05));
    g.add(box(0.38, 0.4, 0.16, w, 0, 0.38, -0.2));
  },
  basin(g) {
    g.add(box(0.6, 0.8, 0.45, std('#c9c4b8')));
    g.add(box(0.5, 0.08, 0.36, std('#f4f6f8'), 0, 0.8, 0));
    g.add(cyl(0.015, 0.015, 0.2, std('#aaa'), 0, 0.88, -0.15, 8));
  },
  shower(g) {
    g.add(box(0.9, 0.06, 0.9, std('#e8ecef')));
    const glass = new THREE.MeshStandardMaterial({ color: 0x9cc9ee, transparent: true, opacity: 0.3, roughness: 0.1 });
    g.add(box(0.9, 2.0, 0.02, glass, 0, 0.06, 0.44));
    g.add(box(0.02, 2.0, 0.9, glass, 0.44, 0.06, 0));
    g.add(cyl(0.1, 0.1, 0.02, std('#aaa'), -0.3, 2.0, -0.3, 12));
  },
  carpet(g) {
    g.add(box(2.0, 0.015, 1.4, std('#7c8aa6')));
  },
  tree(g) {
    g.add(cyl(0.12, 0.16, 1.6, std('#6b4a2f'), 0, 0, 0, 10));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), std('#3f8f4a')).translateY(2.3));
  },
  bush(g) {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), std('#4a9a52')).translateY(0.4));
  },
  pool(g) {
    g.add(box(4.0, 0.06, 2.5, std('#d8e4ea')));
    g.add(box(3.7, 0.08, 2.2, std('#2fa8d8', { transparent: true, opacity: 0.8, emissive: 0x0a4a66 })));
  },
  lawn(g) {
    g.add(box(6.0, 0.02, 4.0, std('#5aa04a')));
  },
  terrace(g) {
    g.add(box(4.0, 0.06, 3.0, std('#b9a58a')));
  },
  path(g) {
    g.add(box(1.0, 0.03, 4.0, std('#9a9488')));
  },
  fence(g) {
    g.add(box(3.0, 0.08, 0.06, std('#8a6a44'), 0, 0.85));
    g.add(box(3.0, 0.08, 0.06, std('#8a6a44'), 0, 0.4));
    for (let i = 0; i <= 6; i++) g.add(box(0.07, 1.0, 0.07, std('#8a6a44'), -1.5 + i * 0.5, 0, 0));
  },
  sofa2(g) {
    const fab = std('#7d8ea3');
    g.add(box(2.6, 0.42, 0.9, fab, 0, 0.1, 0));
    g.add(box(0.9, 0.42, 1.0, fab, -0.85, 0.1, 0.95));
    g.add(box(2.6, 0.45, 0.2, fab, 0, 0.5, -0.35));
    g.add(box(0.2, 0.45, 1.2, fab, -1.25, 0.5, 0.5));
    g.add(box(0.12, 0.2, 0.9, fab, 1.25, 0.5, 0)); },
  tvstand(g) { g.add(box(1.6, 0.5, 0.4, std('#5b4636'))); g.add(box(1.5, 0.02, 0.01, std('#2a2a2a'), 0, 0.25, 0.2)); },
  bookcase(g) {
    const w = std('#6b5140');
    g.add(box(0.9, 2.0, 0.3, w));
    for (let i = 0; i < 5; i++) g.add(box(0.82, 0.03, 0.28, std('#3a2c22'), 0, 0.3 + i * 0.38, 0.02));
    [0.35, 0.72, 1.1, 1.5].forEach((y, i) => g.add(box(0.5 - i * 0.05, 0.28, 0.2, std(['#a33', '#37a', '#3a5', '#c93'][i]), -0.1 + i * 0.06, y, 0.02))); },
  fireplace(g) {
    g.add(box(1.2, 1.1, 0.5, std('#a9a29a')));
    g.add(box(0.7, 0.55, 0.05, std('#1a1614'), 0, 0.2, 0.26));
    g.add(box(0.55, 1.4, 0.4, std('#8f8880'), 0, 1.1, -0.05)); },
  piano(g) {
    g.add(box(1.5, 1.15, 0.65, std('#1c1c20')));
    g.add(box(1.4, 0.04, 0.3, std('#f2f2f2'), 0, 0.72, 0.45));
    g.add(box(0.5, 0.45, 0.4, std('#1c1c20'), 0, 0, 0.6)); },
  pouf(g) { g.add(cyl(0.28, 0.3, 0.4, std('#c79a6b'))); },
  sidetable(g) { g.add(cyl(0.25, 0.25, 0.03, std('#d9cdb8'), 0, 0.5, 0, 24)); g.add(cyl(0.02, 0.02, 0.5, std('#555'), 0, 0, 0, 8)); g.add(cyl(0.16, 0.16, 0.02, std('#555'), 0, 0, 0, 16)); },
  curtain(g) {
    const c = std('#c8b8a4');
    for (let i = 0; i < 8; i++) g.add(box(0.2, 2.3, 0.05 + (i % 2) * 0.03, c, -0.8 + i * 0.23, 0, 0));
    g.add(box(1.9, 0.03, 0.03, std('#333'), 0, 2.3, 0)); },
  barstool(g) { g.add(cyl(0.18, 0.18, 0.05, std('#4a4a4a'), 0, 0.65, 0, 20)); g.add(cyl(0.025, 0.025, 0.65, std('#999'), 0, 0, 0, 8)); g.add(cyl(0.2, 0.2, 0.02, std('#999'), 0, 0, 0, 16)); },
  stove(g) {
    g.add(box(0.6, 0.9, 0.6, std('#dfe3e6')));
    g.add(box(0.58, 0.02, 0.58, std('#1a1a1a'), 0, 0.9, 0));
    [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].forEach(([x, z]) => g.add(cyl(0.09, 0.09, 0.012, std('#444'), x, 0.92, z, 16)));
    g.add(box(0.5, 0.3, 0.02, std('#222'), 0, 0.3, 0.3)); },
  oven(g) { g.add(box(0.6, 0.6, 0.55, std('#cfd4d8'))); g.add(box(0.5, 0.3, 0.02, std('#222'), 0, 0.18, 0.28)); g.add(box(0.4, 0.02, 0.03, std('#999'), 0, 0.5, 0.3)); },
  dishwasher(g) { g.add(box(0.6, 0.85, 0.6, std('#dfe3e6'))); g.add(box(0.4, 0.02, 0.03, std('#999'), 0, 0.75, 0.31)); g.add(box(0.5, 0.06, 0.01, std('#3a3a3a'), 0, 0.8, 0.3)); },
  sink(g) {
    g.add(box(1.2, 0.86, 0.6, std('#e8e2d8')));
    g.add(box(1.22, 0.04, 0.62, std('#7a7a7a'), 0, 0.86, 0));
    g.add(box(0.5, 0.02, 0.4, std('#b8bec4'), -0.25, 0.9, 0));
    g.add(cyl(0.02, 0.02, 0.25, std('#bbb'), 0.05, 0.9, -0.2, 8)); },
  island(g) { g.add(box(1.8, 0.9, 0.9, std('#d9d2c6'))); g.add(box(1.9, 0.04, 1.0, std('#5b5b5b'), 0, 0.9, 0)); },
  microwave(g) { g.add(box(0.46, 0.28, 0.35, std('#c9ced2'))); g.add(box(0.3, 0.2, 0.01, std('#1e1e1e'), -0.05, 0.04, 0.18)); },
  mirror(g) { g.add(box(0.62, 1.22, 0.03, std('#8a8a8a'), 0, 0, -0.01)); g.add(box(0.56, 1.16, 0.02, new THREE.MeshStandardMaterial({ color: 0xcfe6f2, roughness: 0.05, metalness: 0.6 }), 0, 0.03, 0.01)); },
  towelrad(g) { const hot = glowMat(0xe8e8e8); g.userData.heat = [hot]; for (let i = 0; i < 6; i++) g.add(box(0.5, 0.025, 0.04, hot, 0, i * 0.18, 0)); g.add(box(0.03, 0.95, 0.04, hot, -0.235, 0, 0)); g.add(box(0.03, 0.95, 0.04, hot, 0.235, 0, 0)); },
  doublebasin(g) {
    g.add(box(1.2, 0.85, 0.5, std('#e6e6e6')));
    [-0.3, 0.3].forEach((x) => { g.add(box(0.45, 0.02, 0.35, std('#f8f8f8'), x, 0.85, 0)); g.add(cyl(0.015, 0.015, 0.18, std('#aaa'), x, 0.87, -0.18, 8)); }); },
  bed_single(g) { g.add(box(0.95, 0.3, 2.0, std('#8a6a48'))); g.add(box(0.85, 0.2, 1.8, std('#e8e0d0'), 0, 0.3, 0.05)); g.add(box(0.95, 0.7, 0.06, std('#8a6a48'), 0, 0.3, -1.0)); g.add(box(0.5, 0.1, 0.35, std('#fafafa'), 0, 0.5, -0.8)); },
  nightstand(g) { g.add(box(0.45, 0.5, 0.4, std('#8a6a48'))); g.add(box(0.36, 0.02, 0.01, std('#3a2c22'), 0, 0.3, 0.2)); },
  dresser(g) { g.add(box(1.2, 0.85, 0.5, std('#9a7a56'))); [0.2, 0.45, 0.68].forEach((y) => g.add(box(1.1, 0.02, 0.01, std('#3a2c22'), 0, y, 0.25))); },
  crib(g) {
    const w = std('#e8dcc8');
    g.add(box(0.7, 0.05, 1.3, w, 0, 0.25, 0));
    for (let i = 0; i < 9; i++) { g.add(box(0.02, 0.6, 0.02, w, -0.34, 0.3, -0.6 + i * 0.15)); g.add(box(0.02, 0.6, 0.02, w, 0.34, 0.3, -0.6 + i * 0.15)); }
    g.add(box(0.7, 0.75, 0.04, w, 0, 0.2, -0.63)); g.add(box(0.7, 0.75, 0.04, w, 0, 0.2, 0.63)); },
  monitor(g) {
    g.add(box(0.62, 0.36, 0.03, std('#111'), 0, 0.14, 0)); g.add(box(0.05, 0.14, 0.05, std('#333'), 0, 0, 0)); g.add(box(0.25, 0.01, 0.16, std('#333')));
    g.add(box(0.44, 0.02, 0.14, std('#2a2a2a'), 0, 0, 0.22)); },
  officechair(g) {
    const b = std('#2b2f36');
    g.add(cyl(0.28, 0.28, 0.03, b, 0, 0.02, 0, 5)); g.add(cyl(0.03, 0.03, 0.4, std('#999'), 0, 0.05, 0, 8));
    g.add(box(0.5, 0.08, 0.5, b, 0, 0.45, 0)); g.add(box(0.46, 0.55, 0.06, b, 0, 0.53, -0.24)); },
  printer(g) { g.add(box(0.45, 0.2, 0.35, std('#d8dce0'))); g.add(box(0.36, 0.01, 0.15, std('#fff'), 0, 0.2, 0.05)); },
  pendant(g) {
    const glow = glowMat();
    g.add(cyl(0.005, 0.005, 0.7, std('#222'), 0, 0.05, 0, 6));
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glow);
    shade.rotation.x = Math.PI; shade.position.y = 0.05; g.add(shade);
    g.userData.glow = [glow]; },
  walllamp(g) {
    const glow = glowMat();
    g.add(box(0.08, 0.16, 0.04, std('#444'), 0, -0.08, -0.02));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), glow).translateZ(0.06));
    g.userData.glow = [glow]; },
  spot(g) { const glow = glowMat(); g.add(cyl(0.05, 0.05, 0.05, std('#ccc'), 0, -0.03, 0, 14)); g.add(cyl(0.035, 0.035, 0.01, glow, 0, -0.045, 0, 12)); g.userData.glow = [glow]; },
  radiator(g) { const hot = glowMat(0xf0f0f0); g.userData.heat = [hot]; for (let i = 0; i < 10; i++) g.add(box(0.07, 0.55, 0.08, hot, -0.45 + i * 0.1, 0, 0)); },
  boiler(g) { g.add(cyl(0.25, 0.25, 1.2, std('#e8eaec'), 0, 0, 0, 20)); g.add(box(0.12, 0.08, 0.03, std('#2a2a2a'), 0, 0.9, 0.25)); },
  camera(g) { g.add(box(0.07, 0.07, 0.1, std('#e8e8e8'))); g.add(cyl(0.025, 0.025, 0.03, std('#111'), 0, 0.02, 0.06, 12).rotateX(Math.PI / 2)); },
  speaker(g) { g.add(box(0.2, 0.35, 0.2, std('#2e2e32'))); g.add(cyl(0.07, 0.07, 0.02, std('#111'), 0, 0.08, 0.1, 16).rotateX(Math.PI / 2)); },
  vacuum(g) { g.add(cyl(0.17, 0.17, 0.09, std('#3c3f45'), 0, 0, 0, 24)); g.add(cyl(0.05, 0.05, 0.01, std('#888'), 0, 0.09, 0, 12)); },
  presence(g) {                // a person (person.* / device_tracker.*) or a presence / motion sensor: a figure on a glowing floor ring, shown while somebody is there
    const glow = glowMat(0xbfe9ff);
    g.add(cyl(0.38, 0.38, 0.012, glow, 0, 0, 0, 36));                                        // ring on the floor
    [-0.09, 0.09].forEach((x) => g.add(cyl(0.065, 0.075, 0.8, glow, x, 0.02, 0, 12)));       // legs
    g.add(box(0.42, 0.55, 0.22, glow, 0, 0.8, 0));                                           // torso
    [-0.27, 0.27].forEach((x) => g.add(cyl(0.05, 0.045, 0.55, glow, x, 0.8, 0, 10)));        // arms
    g.add(cyl(0.05, 0.05, 0.08, glow, 0, 1.35, 0, 10));                                      // neck
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 12), glow).translateY(1.55));   // head
    g.userData.glow = [glow];
  },
  inverter(g) {                // wall box with a status light (on = producing / has a state)
    const led = glowMat(0x7dff9a); g.userData.glow = [led];
    g.add(box(0.45, 0.35, 0.16, std('#e9ecef'), 0, 0, 0)); g.add(box(0.3, 0.05, 0.01, std('#2a2f36'), 0, 0.08, 0.085));
    g.add(cyl(0.025, 0.025, 0.01, led, 0.15, -0.1, 0.085, 12).rotateX(Math.PI / 2)); },
  powermeter(g) {              // electricity meter: grey housing, glass window with a display
    const led = glowMat(0x7fd8ff); g.userData.glow = [led];
    g.add(box(0.22, 0.3, 0.11, std('#d7dbe0'), 0, 0, 0)); g.add(box(0.16, 0.07, 0.01, led, 0, 0.06, 0.058)); g.add(box(0.16, 0.1, 0.012, std('#3b4048'), 0, -0.07, 0.058)); },
  solarpanel(g) { solarPanels(g, null, 'stand'); },
  houseentry(g) {              // house connection: a post with a cable head and a lead going into the ground
    g.add(box(0.3, 0.7, 0.2, std('#8d949c'), 0, 0.35, 0)); g.add(box(0.34, 0.06, 0.24, std('#5d646c'), 0, 0.73, 0));
    g.add(cyl(0.03, 0.03, 0.3, std('#222'), 0, 0.15, 0.13, 8)); },
  fusebox(g) {                 // meter / distribution cabinet with a door and a few breakers
    g.add(box(0.5, 0.65, 0.18, std('#d8dde2'), 0, 0, 0)); g.add(box(0.44, 0.58, 0.012, std('#bfc6cd'), 0, 0, 0.096));
    for (let i = 0; i < 4; i++) g.add(box(0.05, 0.1, 0.012, std('#2d3b4a'), -0.12 + i * 0.08, 0.15, 0.104)); },
  battery(g) {                 // home battery: tall box with a charge light
    const led = glowMat(0x7dff9a); g.userData.glow = [led];
    g.add(box(0.6, 1.0, 0.22, std('#e4e7ea'), 0, 0.5, 0)); g.add(box(0.5, 0.04, 0.01, led, 0, 0.9, 0.116)); },
  wallbox(g) {                 // EV charger: small wall box with a cable holster
    const led = glowMat(0x7fd8ff); g.userData.glow = [led];
    g.add(box(0.25, 0.35, 0.12, std('#2e3338'), 0, 0, 0)); g.add(box(0.2, 0.03, 0.01, led, 0, 0.1, 0.065)); g.add(cyl(0.035, 0.035, 0.08, std('#111'), 0, -0.12, 0.08, 10)); },
  smoke(g) { g.add(cyl(0.06, 0.06, 0.03, std('#f4f4f4'), 0, -0.03, 0, 16)); },
  router(g) { g.add(box(0.2, 0.04, 0.14, std('#f4f4f4'))); [-0.07, 0.07].forEach((x) => g.add(box(0.008, 0.18, 0.008, std('#333'), x, 0.04, -0.05))); },
  picture(g) { g.add(box(0.6, 0.45, 0.03, std('#3a3a3a'), 0, 0, 0)); g.add(box(0.52, 0.37, 0.005, std('#c9d6e2'), 0, 0.04, 0.016)); },
  car(g) {
    const body = std('#c4ccd6', { metalness: 0.4 });
    g.add(box(1.8, 0.5, 4.2, body, 0, 0.25, 0));
    g.add(box(1.6, 0.5, 2.2, std('#8fb4d6', { transparent: true, opacity: 0.7 }), 0, 0.75, -0.1));
    const wh = std('#222');
    [[-0.85, -1.3], [0.85, -1.3], [-0.85, 1.3], [0.85, 1.3]].forEach(([x, z]) => g.add(cyl(0.3, 0.3, 0.2, wh, x, 0, z, 16).rotateZ(Math.PI / 2)));
  },
});


/* ---------- preview images for the library palette ---------- */
let thumbR = null, thumbScene = null, thumbCam = null;
const thumbs = new Map();
export function thumbnail(type) {
  if (isCustom(type)) return null;
  if (thumbs.has(type)) return thumbs.get(type);
  let url = null;
  try {
    if (!thumbR) {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      thumbR = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbR.setSize(96, 96, false);
      thumbScene = new THREE.Scene();
      thumbScene.add(new THREE.HemisphereLight(0xffffff, 0x556677, 1.4));
      const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(2, 4, 3); thumbScene.add(dl);
      thumbCam = new THREE.PerspectiveCamera(30, 1, 0.05, 200);
    }
    const m = makeModel(type);
    thumbScene.add(m);
    const box3 = new THREE.Box3().setFromObject(m), size = box3.getSize(new THREE.Vector3()), ctr = box3.getCenter(new THREE.Vector3());
    const dist = Math.max(size.x, size.y, size.z, 0.2) * 2.5;
    thumbCam.position.copy(ctr).add(new THREE.Vector3(0.75, 0.7, 1).normalize().multiplyScalar(dist));
    thumbCam.lookAt(ctr);
    thumbR.render(thumbScene, thumbCam);
    url = thumbR.domElement.toDataURL('image/png');
    thumbScene.remove(m);
    m.traverse((o) => { o.geometry?.dispose?.(); });
  } catch { url = null; }
  thumbs.set(type, url);
  return url;
}

/* ---------- custom GLB models ---------- */
const loader = new GLTFLoader();
const glbCache = new Map();          // name -> Promise<Object3D> (normalised template)

function loadGlb(name) {
  if (!glbCache.has(name)) {
    glbCache.set(name, loader.loadAsync(`api/models/${encodeURIComponent(name)}`).then((gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const k = 1 / (Math.max(size.x, size.y, size.z) || 1);      // fit into a 1 m cube, user scales further
      const wrap = new THREE.Group();
      root.scale.multiplyScalar(k);
      const b2 = new THREE.Box3().setFromObject(root);
      root.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y, -(b2.min.z + b2.max.z) / 2);
      wrap.add(root);
      return wrap;
    }).catch((err) => { glbCache.delete(name); throw err; }));
  }
  return glbCache.get(name);
}
export function forgetGlb(name) { glbCache.delete(name); }

export function isCustom(type) { return typeof type === 'string' && type.startsWith('glb:'); }

/** Build a device model. For custom models a placeholder is shown until the GLB has loaded;
 *  `onReady` is called afterwards so the caller can refresh shadows/selection helpers. */
export function makeModel(type, onReady, dev, opts) {
  const g = new THREE.Group();
  if (isCustom(type)) {
    const ph = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.4, wireframe: true }));
    ph.position.y = 0.25;
    g.add(ph);
    loadGlb(type.slice(4)).then((tpl) => {
      g.remove(ph);
      const inst = tpl.clone(true);
      inst.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      g.add(inst);
      onReady?.(g);
    }).catch(() => { ph.material.color.set(0xff5555); });
    return g;
  }
  if (type === 'nanoleaf') { nanoleaf(g, dev); return g; }
  if (type === 'ledring') { ledRing(g, dev); return g; }
  if (type === 'kitchenrun') { kitchenRun(g, dev); return g; }
  if (type === 'solarpanel') { const m = opts?.mount || 'stand'; solarPanels(g, dev, m); if (m === 'stand') centreOnFootprint(g); return g; }
  (builders[type] || builders.sensor)(g);
  centreOnFootprint(g);
  return g;
}
/** Solar panels (#176): one panel or a field (rows x columns, see solarField), on stands tilted to the sun
 *  or lying flat on rails (on a sloped roof the whole model is tilted onto the roof surface by the caller). */
function solarPanels(g, dev, mount) {
  const F = solarField(dev), frame = std('#cfd3d8'), cell = std('#1d2d54', { roughness: 0.25, metalness: 0.4 }), line = std('#9fb0d0'), steel = std('#9aa0a6');
  const panel = (p) => {
    p.add(box(PANEL.w, 0.04, PANEL.d, frame, 0, 0, 0)); p.add(box(PANEL.w - 0.06, 0.045, PANEL.d - 0.06, cell, 0, 0, 0));
    for (let i = 1; i < 3; i++) p.add(box(PANEL.w - 0.06, 0.05, 0.012, line, 0, 0, -0.795 + i * 0.53));
  };
  F.cells.forEach((c) => {
    const p = new THREE.Group();
    if (mount === 'flat') { p.position.set(c.x, 0.04, c.z); panel(p); g.add(p); return; }
    p.rotation.x = -0.5; p.position.set(c.x, 0.55, c.z); panel(p);
    g.add(p); g.add(box(0.06, 0.55, 0.06, steel, c.x, 0.275, c.z + 0.2));
  });
  if (mount === 'flat') for (let r = 0; r < F.rows; r++) [-0.5, 0.5].forEach((k) => {                       // two mounting rails under every row
    g.add(box(F.w, 0.04, 0.04, steel, 0, 0, -F.d / 2 + PANEL.d / 2 + r * (PANEL.d + PANEL.gap) + k * PANEL.d * 0.6));
  });
}
/** Kitchen run (#124): modules in a line, an L or a U. Local frame of a module: x along the run, z towards the room (front), the back at -z. */
function kitchenRun(g, dev) {
  const L = kitchenLayout(dev || {}), upper = dev?.upper !== false;
  const body = std('#e9e6df'), front = std('#f4f1ea'), top = std('#4b4d52', { roughness: 0.35 }), dark = std('#2b2d31'), steel = std('#c4c9ce', { metalness: 0.5, roughness: 0.35 });
  const plates = [];
  L.cells.forEach((c) => {
    const m = new THREE.Group(); m.position.set(c.cx, 0, c.cz); m.rotation.y = c.ang;
    const w = c.w - 0.01, D = c.d;
    const add = (mesh) => { m.add(mesh); return mesh; };
    const handle = (y, x = 0) => add(box(0.16, 0.02, 0.02, steel, x, y, D / 2 + 0.02));
    const baseCab = (frontMat = front) => {
      add(box(w - 0.04, 0.1, D - 0.06, dark, 0, 0, -0.01));                          // plinth
      add(box(w, 0.76, D, body, 0, 0.1, 0));
      add(box(w - 0.03, 0.7, 0.02, frontMat, 0, 0.13, D / 2 + 0.005));
      add(box(c.w, 0.04, D + 0.02, top, 0, 0.86, 0.005));                                // worktop
    };
    if (c.type === 'base') { baseCab(); handle(0.78); }
    else if (c.type === 'drawers') { baseCab(); [0.2, 0.42, 0.64].forEach((y) => handle(y)); }
    else if (c.type === 'sink') {
      baseCab(); handle(0.78);
      add(box(c.w - 0.24, 0.015, D - 0.2, steel, 0, 0.9, 0));                            // basin
      add(cyl(0.015, 0.015, 0.2, steel, 0, 0.9, -D / 2 + 0.08, 10));                     // tap
      add(box(0.02, 0.02, 0.12, steel, 0, 1.08, -D / 2 + 0.14));
    } else if (c.type === 'stove') {
      baseCab(dark); add(box(w - 0.2, 0.012, 0.015, steel, 0, 0.72, D / 2 + 0.02));
      [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].forEach(([x, z]) => {
        const pm = glowMat(0x3a3a3a); plates.push(pm); add(cyl(0.085, 0.085, 0.012, pm, x, 0.9, z, 20));
      });
    } else if (c.type === 'dish') {
      baseCab(std('#cfd3d6', { metalness: 0.3 })); add(box(w - 0.1, 0.03, 0.02, dark, 0, 0.8, D / 2 + 0.02)); handle(0.7);
    } else if (c.type === 'fridge') {
      add(box(w, 1.85, D, std('#e8ecee', { metalness: 0.25, roughness: 0.4 }), 0, 0, 0));
      add(box(w - 0.02, 0.01, 0.01, dark, 0, 1.25, D / 2 + 0.005));
      add(box(0.02, 0.5, 0.025, steel, 0.2, 1.3, D / 2 + 0.02)); add(box(0.02, 0.4, 0.025, steel, 0.2, 0.75, D / 2 + 0.02));
    } else if (c.type === 'tall') {
      add(box(w, 2.1, D, body, 0, 0, 0)); add(box(w - 0.03, 2.0, 0.02, front, 0, 0.05, D / 2 + 0.005)); add(box(0.02, 0.3, 0.025, steel, 0.2, 1.0, D / 2 + 0.02));
    }
    if (upper && ['base', 'drawers', 'sink', 'dish', 'stove'].includes(c.type)) {                      // wall cabinets, a hood above the stove
      if (c.type === 'stove') {
        add(box(c.w - 0.1, 0.1, 0.42, steel, 0, 1.55, -D / 2 + 0.21));
        add(box(0.2, 0.6, 0.2, steel, 0, 1.65, -D / 2 + 0.1));
      } else {
        add(box(w, 0.7, 0.34, body, 0, 1.4, -D / 2 + 0.17));
        add(box(w - 0.03, 0.64, 0.02, front, 0, 1.43, -D / 2 + 0.35)); add(box(0.16, 0.02, 0.02, steel, 0, 1.45, -D / 2 + 0.37));
      }
    }
    g.add(m);
  });
  if (plates.length) g.userData.glow = plates;                                              // the hob glows while the run's entity (e.g. the stove) is on
  if (!L.cells.length) g.add(box(0.6, 0.02, 0.6, std('#999999', { transparent: true, opacity: 0.5 }), 0, 0, 0));
}
const RING_DEMO = { pts: [[-1, -0.7], [1, -0.7], [1, 0.7], [-1, 0.7]], closed: true };
/** LED ring: one glowing strip per section, each with its own material (so each section can show its own light)
 *  and its own invisible hit box, so a tap knows the section and the empty middle of the room stays free */
function ledRing(g, dev) {
  const d = dev?.pts?.length >= 2 ? dev : RING_DEMO;
  const pick = new THREE.MeshBasicMaterial({ visible: false });
  g.userData.segs = ringSections(d).map(({ i, from, to }) => {
    const glow = glowMat();
    const sec = new THREE.Group();
    piecesLocal(d, from, to).forEach(([a, b]) => {
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 0.01;
      const piece = new THREE.Group();
      piece.position.set((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2);
      piece.rotation.y = Math.atan2(-dz, dx);
      piece.add(box(L + 0.02, 0.025, 0.04, glow, 0, -0.0125, 0));
      const hit = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 0.3), pick);
      hit.userData.proxy = true; hit.userData.seg = i;
      piece.add(hit);
      sec.add(piece);
    });
    const mid = new THREE.Object3D(); mid.name = 'mid';      // middle of the section (tests, popups)
    const m = pointAt(d, (from + to) / 2); mid.position.set(m[0], 0, m[1]);
    sec.add(mid);
    g.add(sec);
    return { glow: [glow] };
  });
  g.userData.ownProxy = true;
  g.userData.glow = [];
}
/** The 2D plan draws every piece centred on its position, so the 3D model has to be centred the same way
 *  (some builders, e.g. the corner sofa, extend to one side of their origin). Thin wall-hung parts are left alone. */
function centreOnFootprint(g) {
  g.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
  if (bb.isEmpty() || sz.z < 0.1 || (Math.abs(c.x) < 0.08 && Math.abs(c.z) < 0.08)) return;
  g.children.forEach((ch) => { ch.position.x -= c.x; ch.position.z -= c.z; });
}
