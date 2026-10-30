/* 3D Floorplan (Container) card: the floorplan3d container on a Home Assistant dashboard, without a second login. The card asks the
 * "3D Floorplan (Container)" integration for a session (Home Assistant authenticates the request with the logged-in user's token; the
 * integration walks the container's own OAuth login server-side) and then shows the plan — already logged in.
 *
 *   type: custom:floorplan3d-container-card
 *
 * The options are the ones of the add-on's card `custom:floorplan3d-card` (title, house, floor, room, view, theme, quality, walls,
 * labels, heatmap, night, alerts, idle_return, room_panel, show_nav, show_bar, tabs, kiosk, height, fill), passed to the plan in its
 * address (cardmode.js reads them there). Two are of this version only: `url` (the plan's address, default /floorplan/) and nothing
 * else — no `addon`, the plan is on Home Assistant's own address. The card ships with the integration: it is served from it and
 * loaded on every page by it (no /config/www file, no dashboard resource). README: container/custom_components/floorplan3d/README.md
 */
const TAG = "floorplan3d-container-card";
const DEFAULT_BASE = "/floorplan/";                    // the plan this integration serves (PATH in const.py)
const DEFAULT_HEIGHT = "400px";
const MIN_EDITOR_MINUTES = 0, MAX_EDITOR_MINUTES = 1440;

const OPTIONS = {
  view: ["3d", "room", "panel"],
  theme: ["default", "auto", "dark", "light", "holo"],
  quality: ["auto", "low", "high"],
  walls: ["default", "auto", "see_through", "low", "full"],
  labels: ["default", "important", "all", "none"],
  heatmap: ["off", "temp", "humid", "co2"],
  night: ["default", "off", "sun", "time"],
  alerts: ["default", "on", "off"],
};
const SKIP = { view: "3d", theme: "default", quality: "auto", walls: "default", labels: "default", heatmap: "off", night: "default", alerts: "default" };
const ON_BY_DEFAULT = ["room_panel", "show_nav", "show_bar"];
const OFF_BY_DEFAULT = ["tabs", "kiosk"];

const TEXT = {
  en: {
    loading: "Loading 3D floor plan …",
    signingIn: "Signing in to the floor plan …",
    failed: "The floor plan did not sign in. Is the 3D Floorplan (Container) integration added and the container running? Check the Home Assistant log, then retry.",
    retry: "Retry",
    description: "The 3D floor plan of the floorplan3d container, signed in through the 3D Floorplan (Container) integration.",
    title: "Title", house: "House", floor: "Floor", room: "Room (a room tablet)",
    height: "Height", fill: "Fill the screen",
    view: "Show", look: "Look", parts: "Shown in the card", advanced: "Advanced",
    theme: "Theme", quality: "Quality", walls: "Walls", labels: "Value labels", heatmap: "Room colours", night: "Dim at night", alerts: "Warnings",
    idle_return: "Back to the card's floor after (minutes)", url: "Address of the plan (optional, relative)",
    room_panel: "Room panel over the 3D view (a tapped room)", show_nav: "Bar at the top (floors, rooms)",
    show_bar: "Bar at the bottom (view, room colours, search)", tabs: "Tabs at the very bottom (house, cameras …)",
    kiosk: "Wall tablet: hide Home Assistant's sidebar and top bar",
    wholeHouse: "Whole house",
    "view.3d": "3D view", "view.room": "Only the room in 3D (stays in the room)", "view.panel": "Only the room's panel, without the 3D picture",
    "theme.default": "As set in the plan", "theme.auto": "Like Home Assistant (dark / light)", "theme.dark": "Dark", "theme.light": "Light", "theme.holo": "Hologram",
    "quality.auto": "Automatic", "quality.low": "Fast", "quality.high": "Beautiful",
    "walls.default": "As set in the plan", "walls.auto": "Walls towards the camera sink", "walls.see_through": "Walls towards the camera turn see-through", "walls.low": "All low", "walls.full": "All full height",
    "labels.default": "As set in the plan", "labels.important": "The important ones", "labels.all": "All", "labels.none": "None",
    "heatmap.off": "Normal", "heatmap.temp": "Temperature", "heatmap.humid": "Humidity", "heatmap.co2": "CO₂",
    "night.default": "As set in the plan", "night.off": "Off", "night.sun": "When the sun is down", "night.time": "At the times set in the plan",
    "alerts.default": "As set in the plan", "alerts.on": "On", "alerts.off": "Off",
  },
  de: {
    loading: "3D-Grundriss wird geladen …",
    signingIn: "Am Grundriss anmelden …",
    failed: "Die Anmeldung am Grundriss hat nicht geklappt. Ist die Integration 3D Floorplan (Container) eingerichtet und läuft der Container? Das Home-Assistant-Protokoll nennt den Grund; dann erneut versuchen.",
    retry: "Erneut versuchen",
    description: "Der 3D-Grundriss des floorplan3d-Containers, angemeldet über die Integration 3D Floorplan (Container).",
    title: "Titel", house: "Haus", floor: "Etage", room: "Raum (Raum-Tablet)",
    height: "Höhe", fill: "Bildschirm füllen",
    view: "Anzeige", look: "Aussehen", parts: "In der Karte zeigen", advanced: "Erweitert",
    theme: "Design", quality: "Qualität", walls: "Wände", labels: "Wert-Anzeigen", heatmap: "Raumfarben", night: "Nachts abdunkeln", alerts: "Warnungen",
    idle_return: "Zurück zur Etage der Karte nach (Minuten)", url: "Adresse des Grundrisses (freiwillig, relativ)",
    room_panel: "Raum-Fenster über der 3D-Ansicht (Raum antippen)", show_nav: "Leiste oben (Etagen, Räume)",
    show_bar: "Leiste unten (Ansicht, Raumfarben, Suche)", tabs: "Reiter ganz unten (Haus, Kameras …)",
    kiosk: "Wandtablet: Seitenleiste und Kopfzeile von Home Assistant ausblenden",
    wholeHouse: "Ganzes Haus",
    "view.3d": "3D-Ansicht", "view.room": "Nur der Raum in 3D (bleibt im Raum)", "view.panel": "Nur das Raum-Fenster, ohne 3D-Bild",
    "theme.default": "Wie im Grundriss", "theme.auto": "Wie Home Assistant (dunkel / hell)", "theme.dark": "Dunkel", "theme.light": "Hell", "theme.holo": "Hologramm",
    "quality.auto": "Automatisch", "quality.low": "Schnell", "quality.high": "Schön",
    "walls.default": "Wie im Grundriss", "walls.auto": "Wände zur Kamera hin absenken", "walls.see_through": "Wände zur Kamera hin durchsichtig", "walls.low": "Alle niedrig", "walls.full": "Alle in voller Höhe",
    "labels.default": "Wie im Grundriss", "labels.important": "Die wichtigen", "labels.all": "Alle", "labels.none": "Keine",
    "heatmap.off": "Normal", "heatmap.temp": "Temperatur", "heatmap.humid": "Luftfeuchte", "heatmap.co2": "CO₂",
    "night.default": "Wie im Grundriss", "night.off": "Aus", "night.sun": "Wenn die Sonne untergegangen ist", "night.time": "Zu den Zeiten im Grundriss",
    "alerts.default": "Wie im Grundriss", "alerts.on": "An", "alerts.off": "Aus",
  },
  zh: {
    loading: "正在加载 3D 楼层图 …",
    signingIn: "正在登录楼层图 …",
    failed: "楼层图登录失败。请确认已添加 3D Floorplan (Container) 集成且容器正在运行；Home Assistant 日志里会有原因，然后再重试。",
    retry: "重试",
    description: "floorplan3d 容器的 3D 楼层图，通过 3D Floorplan (Container) 集成自动登录。",
    title: "标题", house: "房子", floor: "楼层", room: "房间（房间平板）",
    height: "高度", fill: "占满屏幕",
    view: "显示", look: "外观", parts: "卡片里显示", advanced: "高级",
    theme: "主题", quality: "画质", walls: "墙体", labels: "数值标签", heatmap: "房间颜色", night: "夜间调暗", alerts: "警告",
    idle_return: "空闲后回到卡片楼层（分钟）", url: "楼层图地址（可选，相对路径）",
    room_panel: "3D 视图上的房间面板（点房间）", show_nav: "顶部栏（楼层、房间）",
    show_bar: "底部栏（视图、房间颜色、搜索）", tabs: "底部标签页（房子、摄像头 …）",
    kiosk: "墙上平板：隐藏 Home Assistant 的侧边栏和顶栏",
    wholeHouse: "整个房子",
    "view.3d": "3D 视图", "view.room": "只显示所选房间（不离开）", "view.panel": "只显示房间面板，不带 3D",
    "theme.default": "跟随楼层图设置", "theme.auto": "跟随 Home Assistant（深/浅）", "theme.dark": "深色", "theme.light": "浅色", "theme.holo": "全息",
    "quality.auto": "自动", "quality.low": "流畅", "quality.high": "精细",
    "walls.default": "跟随楼层图设置", "walls.auto": "朝向镜头的墙下沉", "walls.see_through": "朝向镜头的墙透視", "walls.low": "全部低墙", "walls.full": "全部全高",
    "labels.default": "跟随楼层图设置", "labels.important": "重要的", "labels.all": "全部", "labels.none": "无",
    "heatmap.off": "正常", "heatmap.temp": "温度", "heatmap.humid": "湿度", "heatmap.co2": "CO₂",
    "night.default": "跟随楼层图设置", "night.off": "关", "night.sun": "日落后", "night.time": "按楼层图设置",
    "alerts.default": "跟随楼层图设置", "alerts.on": "开", "alerts.off": "关",
  },
};

/** the labels of one language, falling back to English key by key */
const texts = (hass) => {
  const lang = TEXT[String(hass?.locale?.language || navigator.language || "en").slice(0, 2)] || TEXT.en;
  return (key) => lang[key] ?? TEXT.en[key];
};

/* ---- the wall tablet (option kiosk): Home Assistant's sidebar and the top bar of the dashboard away, so the card is all there is.
 * The sidebar is hidden the way Home Assistant's own profile setting "Always hide the sidebar" does it (the event hass-dock-sidebar,
 * kept by this browser); the top bar by a style in the dashboard's root (hui-root), found through the shadow roots. What is not
 * found stays as it is, nothing breaks. ---- */
const KIOSK_CSS = ".header, .toolbar { display: none !important; } :host { --header-height: 0px !important; }";

function deepFind(root, tag, budget = 6000) {
  const stack = [root];
  while (stack.length && budget-- > 0) {
    const node = stack.pop();
    if (node.localName === tag) return node;
    if (node.shadowRoot) stack.push(node.shadowRoot);
    for (const c of node.children || []) stack.push(c);
  }
  return null;
}

function kioskApply(from) {
  try {
    if (localStorage.getItem("dockedSidebar") !== '"always_hidden"') {
      from.dispatchEvent(new CustomEvent("hass-dock-sidebar", { detail: { dock: "always_hidden" }, bubbles: true, composed: true }));
    }
  } catch { /* no storage: the sidebar stays */ }
  const root = deepFind(document.documentElement, "hui-root")?.shadowRoot;
  if (!root) return false;
  if (!root.getElementById("fp3dContainerKiosk")) {
    const st = document.createElement("style");
    st.id = "fp3dContainerKiosk";
    st.textContent = KIOSK_CSS;
    root.append(st);
  }
  return true;
}

class Floorplan3dContainerCard extends HTMLElement {
  /** the address of the plan in the card: the base and the options (cardmode.js reads them there). dark: Home Assistant's theme */
  static frameUrl(base, config = {}, dark = false) {
    const raw = String(base || DEFAULT_BASE);
    const [path, query = ""] = raw.split("?");
    const q = new URLSearchParams(query);
    q.set("card", "1");
    const put = (k, v) => { if (v != null && String(v).trim() !== "") q.set(k, String(v).trim()); };
    put("house", config.house); put("floor", config.floor); put("room", config.room);
    if (config.view === "room" || config.view === "panel") q.set("view", config.view);
    put("theme", config.theme === "auto" ? (dark ? "dark" : "light") : config.theme === "default" ? null : config.theme);
    if (config.quality === "low" || config.quality === "high") q.set("perf", config.quality);
    if (config.walls !== "default") put("walls", config.walls);
    if (config.labels !== "default") put("labels", config.labels);
    if (config.heatmap && config.heatmap !== "off") q.set("heatmap", config.heatmap);
    if (config.night !== "default") put("night", config.night);
    for (const k of ["alerts", ...ON_BY_DEFAULT]) if (typeof config[k] === "boolean") q.set(k, config[k] ? "1" : "0");
    if (config.tabs === true) q.set("tabs", "1");                     // the tab bar at the bottom of the plan
    const idle = Number(config.idle_return);
    if (config.idle_return != null && config.idle_return !== "" && Number.isFinite(idle)) {
      q.set("idle_return", String(Math.min(MAX_EDITOR_MINUTES, Math.max(MIN_EDITOR_MINUTES, Math.round(idle)))));
    }
    return `${path.endsWith("/") ? path : `${path}/`}?${q}`;
  }

  /** the base of the plan (for the card and its editor): the url's address without its options */
  static planBase(config = {}) {
    const raw = String(config.url || DEFAULT_BASE).split("?")[0];
    return raw.endsWith("/") ? raw : `${raw}/`;
  }

  /** the height of the frame: the screen (fill), the cell of a sections dashboard or the panel view, else the height option (a number
   *  is pixels; a CSS length as "60vh" also works) */
  static frameHeight(config = {}, { grid = false, panel = false } = {}) {
    if (panel) return "calc(100vh - var(--header-height, 56px))";
    if (config.fill) return "calc(100vh - var(--header-height, 56px) - 16px)";
    if (grid) return "100%";
    const h = config.height;
    if (typeof h === "number" && h > 0) return `${h}px`;
    const s = String(h ?? "").trim();
    if (/^\d+(\.\d+)?$/.test(s) && +s > 0) return `${s}px`;
    if (/^\d+(\.\d+)?(px|vh|svh|dvh|em|rem)$/.test(s)) return s;
    return DEFAULT_HEIGHT;
  }

  /** the height in pixels for Home Assistant's layout: 400 for anything that is not in px */
  static heightPx(config = {}) {
    const m = /^(\d+(?:\.\d+)?)(px)?$/.exec(String(config.height ?? "").trim());
    return m && +m[1] > 0 ? +m[1] : 400;
  }

  /** the card makes the screen a wall tablet (option kiosk): never for an administrator, and ?kiosk=off in the dashboard's address
   *  switches it off for a moment */
  static kioskWanted(config = {}, user = null, search = "") {
    return config.kiosk === true && !!user && !user.is_admin && !/[?&]kiosk=(off|0|false|no)(&|$)/i.test(search);
  }

  /** the editor's form data: the defaults shown as what they mean */
  static editorData(config = {}) {
    const d = { ...config };
    for (const [k, v] of Object.entries(SKIP)) if (d[k] == null || d[k] === "") d[k] = v;
    if (typeof config.alerts === "boolean") d.alerts = config.alerts ? "on" : "off";
    for (const k of ON_BY_DEFAULT) d[k] = config[k] !== false;
    if (d.floor != null) d.floor = String(d.floor);
    return d;
  }

  /** the card config from the editor's form data: defaults are left out, the rest of the old config stays */
  static editorConfig(old = {}, data = {}) {
    const c = { ...old, ...data };
    for (const [k, v] of Object.entries(SKIP)) if (c[k] === v || c[k] == null || c[k] === "") delete c[k];
    if (c.alerts === "on") c.alerts = true; else if (c.alerts === "off") c.alerts = false;
    for (const k of ON_BY_DEFAULT) if (c[k] !== false) delete c[k];
    for (const k of ["title", "house", "floor", "room", "height", "url"]) if (c[k] == null || String(c[k]).trim() === "") delete c[k];
    for (const k of ["fill", ...OFF_BY_DEFAULT]) if (c[k] !== true) delete c[k];
    if (c.idle_return == null || c.idle_return === "" || !Number.isFinite(Number(c.idle_return))) delete c.idle_return;
    return c;
  }

  /** the editor's fields; plan: { houses: [names], floors: [names], rooms: [names] } from the plan, or null (then free text) */
  static editorSchema(plan, T) {
    const choose = (key) => ({ select: { mode: "dropdown", options: OPTIONS[key].map((value) => ({ value, label: T(`${key}.${value}`) || value })) } });
    const list = (names, first) => ({ select: { mode: "dropdown", custom_value: true, options: [...first, ...names.map((n) => ({ value: n, label: n }))] } });
    const text = { text: {} };
    return [
      { name: "title", selector: text },
      { name: "view", selector: choose("view") },
      ...(plan && plan.houses.length < 2 ? [] : [{ name: "house", selector: plan ? list(plan.houses, []) : text }]),
      { type: "grid", name: "", schema: [
          { name: "floor", selector: plan ? list(plan.floors, [{ value: "house", label: T("wholeHouse") }]) : text },
          { name: "room", selector: plan ? list(plan.rooms, []) : text },
        ] },
      { type: "grid", name: "", schema: [{ name: "height", selector: text }, { name: "fill", selector: { boolean: {} } }] },
      { type: "expandable", name: "look", flatten: true, title: T("look"), schema: [
          { type: "grid", name: "", schema: ["theme", "quality", "walls", "labels", "heatmap", "night", "alerts"].map((k) => ({ name: k, selector: choose(k) })) },
          { name: "idle_return", selector: { number: { min: MIN_EDITOR_MINUTES, max: MAX_EDITOR_MINUTES, mode: "box", unit_of_measurement: "min" } } },
        ] },
      { type: "expandable", name: "parts", flatten: true, title: T("parts"), schema: [...ON_BY_DEFAULT, ...OFF_BY_DEFAULT].map((k) => ({ name: k, selector: { boolean: {} } })) },
      { type: "expandable", name: "advanced", flatten: true, title: T("advanced"), schema: [{ name: "url", selector: text }] },
    ];
  }

  static getConfigElement() { return document.createElement(`${TAG}-editor`); }
  static getStubConfig() { return {}; }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("3D Floorplan: the card needs a configuration");
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first || this._dark !== !!hass?.themes?.darkMode) this._render();
  }

  get hass() { return this._hass; }
  set layout(v) { this._layout = v; this._size(); }                 // "grid": in a cell of a sections dashboard, "panel": a panel view
  get layout() { return this._layout; }
  set isPanel(v) { this._panel = !!v; this._size(); }               // the only card of a panel view (older Home Assistant)
  get isPanel() { return this._panel; }

  getCardSize() { return Math.max(3, Math.ceil(Floorplan3dContainerCard.heightPx(this._config) / 50)); }
  getGridOptions() { return { columns: 12, rows: Math.max(3, Math.round((Floorplan3dContainerCard.heightPx(this._config) + 8) / 64)), min_columns: 4, min_rows: 3 }; }
  getLayoutOptions() { return { grid_columns: 4, grid_rows: Math.max(3, Math.round((Floorplan3dContainerCard.heightPx(this._config) + 8) / 64)), grid_min_rows: 3 }; }

  connectedCallback() { this._render(); }
  disconnectedCallback() { clearTimeout(this._retry); clearTimeout(this._kioskTry); }

  _dom() {
    if (this._root) return this._root;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      :host { display: block; height: 100%; }
      ha-card { display: flex; flex-direction: column; height: 100%; overflow: hidden; box-sizing: border-box; }
      .box { position: relative; flex: 1 1 auto; min-height: 160px; }
      iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; background: transparent; }
      .msg { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center;
             padding: 16px; box-sizing: border-box; text-align: center; line-height: 1.4; color: var(--secondary-text-color, #888); }
      .msg.err { color: var(--error-color, #db4437); }
      .msg[hidden], iframe[hidden], .msg button[hidden] { display: none; }
      .msg button { padding: 6px 16px; border-radius: 16px; border: 1px solid var(--divider-color, #ddd); background: none;
                    color: inherit; cursor: pointer; font: inherit; }
    </style><ha-card><div class="box"><iframe title="3D Floorplan" allow="fullscreen" hidden></iframe><div class="msg"><span></span><button hidden></button></div></div></ha-card>`;
    this._root = root;
    root.querySelector("iframe").addEventListener("load", () => { if (root.querySelector("iframe").src) root.querySelector(".msg").hidden = true; });
    root.querySelector("button").addEventListener("click", () => this._render(true));
    return root;
  }

  /** wall tablet: try a few times, the dashboard around the card may still be building */
  _kiosk(tries = 0) {
    clearTimeout(this._kioskTry);
    if (!kioskApply(this) && tries < 10 && this.isConnected) this._kioskTry = setTimeout(() => this._kiosk(tries + 1), 1000);
  }

  _size() {
    if (!this._root || !this._config) return;
    const grid = this._layout === "grid", panel = this._layout === "panel" || !!this._panel;
    this._root.querySelector(".box").style.height = Floorplan3dContainerCard.frameHeight(this._config, { grid, panel });
  }

  _message(text, err = false, retry = false) {
    const box = this._dom().querySelector(".msg");
    box.querySelector("span").textContent = text;
    box.hidden = !text;
    box.classList.toggle("err", err);
    const button = box.querySelector("button");
    button.textContent = texts(this._hass)("retry");
    button.hidden = !retry;
  }

  /** the session cookie the frame's requests travel with: one login per Home Assistant user and card, not one per render */
  _session(hass, force = false) {
    const user = String(hass?.user?.id || "");
    if (force) this._sessionDone = false;
    if (this._sessionDone && this._sessionUser === user) return Promise.resolve();
    if (this._sessionPromise) return this._sessionPromise;
    this._sessionPromise = hass.callApi("POST", "floorplan3d/session")
      .then(() => { this._sessionUser = user; this._sessionDone = true; })
      .catch((e) => { this._sessionDone = false; throw e; })
      .finally(() => { this._sessionPromise = null; });
    return this._sessionPromise;
  }

  async _render(force = false) {
    if (!this._config) return;
    const root = this._dom(), card = root.querySelector("ha-card");
    if (this._config.title) card.setAttribute("header", this._config.title); else card.removeAttribute("header");
    this._size();
    const hass = this._hass;
    if (!hass) return;
    const T = texts(hass), run = (this._run || 0) + 1;
    this._run = run;
    this._dark = !!hass.themes?.darkMode;
    const frame = root.querySelector("iframe");
    try {
      await this._session(hass, force);                             // the session cookie the iframe's requests travel with
      if (run !== this._run) return;                                // a newer config came in meanwhile
      const url = Floorplan3dContainerCard.frameUrl(Floorplan3dContainerCard.planBase(this._config), this._config, this._dark);
      if (frame.getAttribute("src") !== url) { this._message(T("loading")); frame.setAttribute("src", url); }
      frame.hidden = false;
      if (Floorplan3dContainerCard.kioskWanted(this._config, hass.user, location.search)) this._kiosk();
    } catch (e) {
      if (run !== this._run) return;
      frame.hidden = true; frame.removeAttribute("src");
      this._message(T("failed"), true, true);
    }
  }
}

/* ---- the visual editor (like the add-on's card: the plan's houses, floors and rooms as drop-downs) ---- */
class Floorplan3dContainerCardEditor extends HTMLElement {
  /** Home Assistant loads its form element (ha-form) only for its own editors: open one of them once if it is not there yet */
  async connectedCallback() {
    if (customElements.get("ha-form") || !window.loadCardHelpers) { this._render(); return; }
    try {
      const helpers = await window.loadCardHelpers();
      const c = await helpers.createCardElement({ type: "entities", entities: [] });
      await c.constructor.getConfigElement?.();
    } catch { /* an older Home Assistant: ha-form is there anyway */ }
    this._render();
  }

  setConfig(config) { this._config = { ...config }; this._render(); }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (first) { this._render(); this._loadPlan(); }
  }

  /** the houses, floors and rooms of the plan for the drop-downs; without them the fields stay free text */
  async _loadPlan() {
    try {
      const base = Floorplan3dContainerCard.planBase(this._config || {});
      await this._hass.callApi("POST", "floorplan3d/session");       // the editor's requests travel with the session cookie
      const get = async (path) => {
        const r = await fetch(base + path, { credentials: "same-origin" });
        if (!r.ok) throw new Error(r.status);
        return r.json();
      };
      const houses = await get("api/houses").catch(() => []);
      const want = String(this._config?.house || "").trim().toLowerCase();
      const house = houses.find((h) => h.id === want || String(h.name || "").trim().toLowerCase() === want) || houses[0];
      const layout = await get(`api/layout${house ? `?house=${encodeURIComponent(house.id)}` : ""}`);
      const floors = (layout.floors || []).map((f) => f.name).filter(Boolean);
      const rooms = [...new Set((layout.floors || []).flatMap((f) => (f.rooms || []).map((r) => r.name)).filter(Boolean))];
      this._plan = { houses: houses.map((h) => h.name).filter(Boolean), floors, rooms };
      this._planHouse = want;
      this._render();
    } catch { /* the plan is not there or not running: free text */ }
  }

  _render() {
    if (!this._hass || !this._config) return;
    const T = texts(this._hass);
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) => this._changed(e.detail.value));
      this.append(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = Floorplan3dContainerCard.editorSchema(this._plan || null, T);
    this._form.data = Floorplan3dContainerCard.editorData(this._config);
    this._form.computeLabel = (s) => T(s.name) || s.title || s.name;
  }

  _changed(data) {
    const config = Floorplan3dContainerCard.editorConfig(this._config, data);
    const houseChanged = String(config.house || "").trim().toLowerCase() !== (this._planHouse ?? "");
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
    if (houseChanged && this._plan) this._loadPlan();                // another house: its floors and rooms
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, Floorplan3dContainerCard);
if (!customElements.get(`${TAG}-editor`)) customElements.define(`${TAG}-editor`, Floorplan3dContainerCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === TAG)) {
  window.customCards.push({ type: TAG, name: "3D Floorplan (Container)", description: TEXT.en.description, preview: false,
                            documentationURL: "https://github.com/BuRnEd4AiM/HA-Floorplanner/blob/main/container/custom_components/floorplan3d/README.md" });
}
