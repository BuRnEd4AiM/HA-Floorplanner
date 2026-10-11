/* 3D Floorplan card (#13): the live 3D view of the "3D Floorplan" add-on on any Home Assistant dashboard, without editing, a tap
 * controls the device as in the add-on.
 *
 *   type: custom:floorplan3d-card
 *   floor: Erdgeschoss        # optional: a floor by its name or number (0 = ground floor, -1 = basement) or "house"
 *
 * Installed through HACS (hacs.json at the top of the repository, type "Dashboard") or by hand: this file into /config/www and
 * /local/floorplan3d-card.js as a dashboard resource (JavaScript module). One plain file, no build step, no imports.
 *
 * How it works: the card shows the add-on's own page in a frame through Home Assistant Ingress, the same way the add-on's sidebar panel
 * does. It asks the Supervisor for the add-on's Ingress address (/addons/<slug>/info) and an Ingress session (a cookie), and checks the
 * session every minute so it stays valid. The page reads the card's options from its address (?card=1&floor=..., cardmode.js in the
 * add-on): a live view like a wall tablet, the look for this screen only. The parts without the page (finding the add-on, the address,
 * the size, the editor's fields) are static methods of the card class (unit test: tests/card.test.mjs). */
(() => {
  const TAG = 'floorplan3d-card';
  const SLUG = 'floorplan3d';                       // the add-on's slug (floorplan3d/config.yaml)
  const MIN_ADDON = '3.75.0';                       // the first add-on version that knows ?card=1
  // The Supervisor names an add-on "<first 8 hex digits of sha1(repository address in lower case)>_<slug>", "local_<slug>" for a copy in
  // /addons. The card looks for the add-on's sidebar panel first; these are tried when it is hidden ("Show in sidebar" off): the
  // repository added as https://github.com/BuRnEd4AiM/HA-Floorplanner, with "/" or with ".git" at the end, or a local copy. Then, for
  // an administrator, the list of installed add-ons (the repository added under another address, #352).
  const KNOWN = ['05edeb72', '986a80b9', 'b9c4c5d0', 'local'].map((h) => `${h}_${SLUG}`);
  const DEFAULT_HEIGHT = '400px';
  const OPTIONS = {                                 // the choices of the editor's drop-downs; "default" = as set in the add-on (left out)
    theme: ['default', 'auto', 'dark', 'light', 'holo'],
    quality: ['auto', 'low', 'high'],
    walls: ['default', 'auto', 'see_through', 'low', 'full'],
    labels: ['default', 'important', 'all', 'none'],
    heatmap: ['off', 'temp', 'humid', 'co2'],
    night: ['default', 'off', 'sun', 'time'],
    alerts: ['default', 'on', 'off'],
  };
  const SKIP = { theme: 'default', quality: 'auto', walls: 'default', labels: 'default', heatmap: 'off', night: 'default', alerts: 'default' };
  const ON_BY_DEFAULT = ['room_panel', 'show_nav', 'show_bar'];

  const TEXT = {
    en: {
      loading: 'Loading 3D Floorplan …',
      notFound: 'The 3D Floorplan add-on was not found. Install and start it (Settings → Apps, formerly Add-ons), or enter its slug in the card option "addon". Tried: {tried}',
      notRunning: 'The 3D Floorplan add-on is not running. Start it in Settings → Apps (formerly Add-ons).',
      tooOld: 'The 3D Floorplan add-on is version {v}. The card needs {min} or newer: update the add-on.',
      noAccess: 'Home Assistant does not let this user open the add-on: {e}',
      failed: 'The 3D Floorplan add-on could not be opened: {e}',
      title: 'Title', house: 'House', floor: 'Floor', room: 'Room (a room tablet)', height: 'Height', fill: 'Fill the screen',
      look: 'Look', parts: 'Shown in the card', advanced: 'Advanced',
      theme: 'Theme', quality: 'Quality', walls: 'Walls', labels: 'Value labels', heatmap: 'Room colours', night: 'Dim at night',
      alerts: 'Warnings', idle_return: 'Back to the start after (minutes without a touch, 0 = never)',
      room_panel: 'Room panel when a room is tapped', show_nav: 'Bar at the top (floors, rooms)', show_bar: 'Bar at the bottom (view, room colours, search)',
      addon: 'Add-on slug (only when it is not found by itself)',
      wholeHouse: 'Whole house', firstHouse: 'As in the add-on', anyRoom: 'None',
      'theme.default': 'As in the add-on', 'theme.auto': 'Like Home Assistant (dark / light)', 'theme.dark': 'Dark', 'theme.light': 'Light', 'theme.holo': 'Hologram',
      'quality.auto': 'Automatic', 'quality.low': 'Fast', 'quality.high': 'Beautiful',
      'walls.default': 'As in the add-on', 'walls.auto': 'Sink towards the camera', 'walls.see_through': 'See-through towards the camera', 'walls.low': 'All low', 'walls.full': 'All full height',
      'labels.default': 'As in the add-on', 'labels.important': 'Important', 'labels.all': 'All', 'labels.none': 'None',
      'heatmap.off': 'Normal', 'heatmap.temp': 'Temperature', 'heatmap.humid': 'Humidity', 'heatmap.co2': 'CO₂',
      'night.default': 'As in the add-on', 'night.off': 'Off', 'night.sun': 'When the sun is down', 'night.time': 'At the times of the add-on',
      'alerts.default': 'As in the add-on', 'alerts.on': 'On', 'alerts.off': 'Off',
      description: 'The live 3D view of the 3D Floorplan add-on: tap a device to control it.',
    },
    de: {
      loading: '3D Floorplan wird geladen …',
      notFound: 'Das Add-on 3D Floorplan wurde nicht gefunden. Installiere und starte es (Einstellungen → Apps, früher Add-ons) oder trage seinen Slug in der Karten-Option „addon“ ein. Gesucht: {tried}',
      notRunning: 'Das Add-on 3D Floorplan läuft nicht. Starte es unter Einstellungen → Apps (früher Add-ons).',
      tooOld: 'Das Add-on 3D Floorplan hat die Version {v}. Die Karte braucht {min} oder neuer: bitte das Add-on aktualisieren.',
      noAccess: 'Home Assistant lässt diesen Benutzer das Add-on nicht öffnen: {e}',
      failed: 'Das Add-on 3D Floorplan konnte nicht geöffnet werden: {e}',
      title: 'Titel', house: 'Haus', floor: 'Etage', room: 'Raum (Raum-Tablet)', height: 'Höhe', fill: 'Bildschirm füllen',
      look: 'Aussehen', parts: 'In der Karte zeigen', advanced: 'Erweitert',
      theme: 'Design', quality: 'Qualität', walls: 'Wände', labels: 'Wert-Anzeigen', heatmap: 'Raumfarben', night: 'Nachts abdunkeln',
      alerts: 'Warnungen', idle_return: 'Zurück zum Start nach (Minuten ohne Berührung, 0 = nie)',
      room_panel: 'Raum-Fenster beim Antippen eines Raums', show_nav: 'Leiste oben (Etagen, Räume)', show_bar: 'Leiste unten (Ansicht, Raumfarben, Suche)',
      addon: 'Slug des Add-ons (nur wenn es nicht von selbst gefunden wird)',
      wholeHouse: 'Ganzes Haus', firstHouse: 'Wie im Add-on', anyRoom: 'Keiner',
      'theme.default': 'Wie im Add-on', 'theme.auto': 'Wie Home Assistant (dunkel / hell)', 'theme.dark': 'Dunkel', 'theme.light': 'Hell', 'theme.holo': 'Hologramm',
      'quality.auto': 'Automatisch', 'quality.low': 'Schnell', 'quality.high': 'Schön',
      'walls.default': 'Wie im Add-on', 'walls.auto': 'Zur Kamera hin absenken', 'walls.see_through': 'Zur Kamera hin durchsichtig', 'walls.low': 'Alle niedrig', 'walls.full': 'Alle in voller Höhe',
      'labels.default': 'Wie im Add-on', 'labels.important': 'Wichtige', 'labels.all': 'Alle', 'labels.none': 'Keine',
      'heatmap.off': 'Normal', 'heatmap.temp': 'Temperatur', 'heatmap.humid': 'Luftfeuchte', 'heatmap.co2': 'CO₂',
      'night.default': 'Wie im Add-on', 'night.off': 'Aus', 'night.sun': 'Wenn die Sonne untergegangen ist', 'night.time': 'Zu den Zeiten des Add-ons',
      'alerts.default': 'Wie im Add-on', 'alerts.on': 'An', 'alerts.off': 'Aus',
      description: 'Die Live-3D-Ansicht des Add-ons 3D Floorplan: ein Gerät antippen, um es zu steuern.',
    },
  };
  const texts = (hass) => TEXT[String(hass?.locale?.language || hass?.language || navigator.language || 'en').slice(0, 2)] || TEXT.en;
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

  /* ---- the Ingress session: one for all cards of the page, checked every minute while a card is shown ---- */
  const ingress = { id: null, pending: null, timer: null, users: 0, hass: null };
  const supervisor = (hass, endpoint, method = 'get', data) => hass.callWS({ type: 'supervisor/api', endpoint, method, ...(data ? { data } : {}) });
  function setCookie(id) {
    document.cookie = `ingress_session=${id};path=/api/hassio_ingress/;SameSite=Strict${location.protocol === 'https:' ? ';Secure' : ''}`;
  }
  function session(hass) {
    ingress.hass = hass;
    if (ingress.id) return Promise.resolve(ingress.id);
    if (!ingress.pending) {
      ingress.pending = supervisor(hass, '/ingress/session', 'post')
        .then((r) => { ingress.id = r.session; setCookie(r.session); return r.session; })
        .finally(() => { ingress.pending = null; });
    }
    return ingress.pending;
  }
  async function refresh() {
    const { hass, id } = ingress;
    if (!hass || !id) return;
    try { await supervisor(hass, '/ingress/validate_session', 'post', { session: id }); setCookie(id); }
    catch { ingress.id = null; try { await session(hass); } catch { /* again in a minute */ } }
  }
  function hold(on) {
    ingress.users = Math.max(0, ingress.users + (on ? 1 : -1));
    if (ingress.users && !ingress.timer) { ingress.timer = setInterval(refresh, 60000); refresh(); }
    if (!ingress.users && ingress.timer) { clearInterval(ingress.timer); ingress.timer = null; }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ingress.users) refresh(); });   // back from sleep: a new session at once

  /* ---- the add-on: looked up once per page and slug (cards asking at the same time share the answer; a failure is asked again) ---- */
  const found = new Map();
  /** { slug, ingressUrl, version } of the running add-on; throws { kind: notFound | notRunning | tooOld | noAccess | failed, message, tried } */
  function findAddon(hass, config) {
    const key = config.addon || '';
    if (!found.has(key)) found.set(key, lookup(hass, config).catch((e) => { found.delete(key); throw e; }));
    return found.get(key);
  }
  async function lookup(hass, config) {
    let denied = null, other = null;
    const tried = [];
    const attempt = async (slugs) => {
      for (const slug of slugs) {
        if (tried.includes(slug)) continue;
        tried.push(slug);
        let info;
        try { info = await supervisor(hass, `/addons/${slug}/info`); }
        catch (e) {
          if (/unauthori[sz]ed|forbidden/i.test(`${e?.code} ${e?.message}`)) denied = e;
          else if (!KNOWN.includes(slug)) other = e;                   // the card option, the sidebar panel or the list named it: a real failure
          continue;                                                    // a usual name that is not installed here
        }
        if (!info?.ingress_url) continue;
        if (info.state && info.state !== 'started') throw { kind: 'notRunning' };
        if (Floorplan3dCard.olderThan(info.version, MIN_ADDON)) throw { kind: 'tooOld', version: info.version };
        return { slug, ingressUrl: info.ingress_url, version: info.version };
      }
      return null;
    };
    let hit = await attempt(Floorplan3dCard.slugs(hass.panels, config.addon));
    if (!hit && !config.addon) {                                       // installed under another name and not in the sidebar: the installed
      const list = await supervisor(hass, '/addons').catch(() => null); // add-ons (administrators only, others get "unauthorized")
      hit = await attempt(Floorplan3dCard.slugsFromList(list));
    }
    if (hit) return hit;
    if (denied) throw { kind: 'noAccess', message: denied.message || denied.code };
    if (other) throw { kind: 'failed', message: other.message || other.code || String(other) };
    throw { kind: 'notFound', tried };
  }
  const isOurs = (s) => typeof s === 'string' && (s === SLUG || s.endsWith(`_${SLUG}`));

  class Floorplan3dCard extends HTMLElement {
    /* ---- pure helpers (tests/card.test.mjs) ---- */

    /** the add-on slugs to try: the card option alone, else the add-on's sidebar panel(s), then the usual names. A panel names its add-on
     *  in config.addon (Home Assistant 2026.2 and newer, #352) or config.ingress (older) */
    static slugs(panels, want) {
      if (want) return [String(want).trim()];
      const fromPanels = Object.values(panels || {}).flatMap((p) => [p?.config?.addon, p?.config?.ingress]).filter(isOurs);
      return [...new Set([...fromPanels, ...KNOWN])];
    }
    /** the slugs of this add-on in the Supervisor's list of installed add-ons ({ addons: [{ slug }] }, { apps: [...] } in a newer API) */
    static slugsFromList(data) {
      return [...new Set([].concat(data?.addons || data?.apps || []).map((a) => a?.slug).filter(isOurs))];
    }

    /** true when version a is older than b ("3.74.2" < "3.75.0"); an unknown version is not older (a dev build) */
    static olderThan(a, b) {
      const pa = String(a || '').split('.').map(Number), pb = String(b).split('.').map(Number);
      if (!a || pa.some((n) => !Number.isFinite(n))) return false;
      for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0);
      return false;
    }

    /** the address of the add-on page in the card: the Ingress address and the options (cardmode.js in the add-on reads them).
     *  dark: Home Assistant shows its dark theme (for theme: auto) */
    static frameUrl(ingressUrl, config = {}, dark = false) {
      const q = new URLSearchParams({ card: '1' });
      const put = (k, v) => { if (v != null && String(v).trim() !== '') q.set(k, String(v).trim()); };
      put('house', config.house); put('floor', config.floor); put('room', config.room);
      put('theme', config.theme === 'auto' ? (dark ? 'dark' : 'light') : config.theme === 'default' ? null : config.theme);
      if (config.quality === 'low' || config.quality === 'high') q.set('perf', config.quality);
      if (config.walls !== 'default') put('walls', config.walls);
      if (config.labels !== 'default') put('labels', config.labels);
      if (config.heatmap && config.heatmap !== 'off') q.set('heatmap', config.heatmap);
      if (config.night !== 'default') put('night', config.night);
      for (const k of ['alerts', ...ON_BY_DEFAULT]) if (typeof config[k] === 'boolean') q.set(k, config[k] ? '1' : '0');
      const idle = Number(config.idle_return);
      if (config.idle_return != null && config.idle_return !== '' && Number.isFinite(idle)) q.set('idle_return', String(Math.min(1440, Math.max(0, Math.round(idle)))));
      const base = String(ingressUrl || '/');
      return `${base.endsWith('/') ? base : `${base}/`}?${q}`;
    }

    /** the height of the frame: the screen (fill), the cell of a sections dashboard or the panel view, else the height option (a number
     *  is pixels; a CSS length as "60vh" also works) */
    static frameHeight(config = {}, { grid = false, panel = false } = {}) {
      if (panel) return 'calc(100vh - var(--header-height, 56px))';
      if (config.fill) return 'calc(100vh - var(--header-height, 56px) - 16px)';
      if (grid) return '100%';
      const h = config.height;
      if (typeof h === 'number' && h > 0) return `${h}px`;
      const s = String(h ?? '').trim();
      if (/^\d+(\.\d+)?$/.test(s) && +s > 0) return `${s}px`;
      if (/^\d+(\.\d+)?(px|vh|svh|dvh|em|rem)$/.test(s)) return s;
      return DEFAULT_HEIGHT;
    }

    /** the height in pixels for Home Assistant's layout (getCardSize, the rows of a sections dashboard): 400 for anything not in px */
    static heightPx(config = {}) {
      const m = /^(\d+(?:\.\d+)?)(px)?$/.exec(String(config.height ?? '').trim());
      return m && +m[1] > 0 ? +m[1] : 400;
    }

    /** the editor's form data for a card config: the defaults shown as what they mean */
    static editorData(config = {}) {
      const d = { ...config };
      for (const [k, v] of Object.entries(SKIP)) if (d[k] == null || d[k] === '') d[k] = v;
      if (typeof config.alerts === 'boolean') d.alerts = config.alerts ? 'on' : 'off';
      for (const k of ON_BY_DEFAULT) d[k] = config[k] !== false;
      if (d.floor != null) d.floor = String(d.floor);
      return d;
    }

    /** the card config from the editor's form data: defaults are left out, the rest of the old config stays */
    static editorConfig(old = {}, data = {}) {
      const c = { ...old, ...data };
      for (const [k, v] of Object.entries(SKIP)) if (c[k] === v || c[k] == null || c[k] === '') delete c[k];
      if (c.alerts === 'on') c.alerts = true; else if (c.alerts === 'off') c.alerts = false;
      for (const k of ON_BY_DEFAULT) if (c[k] !== false) delete c[k];
      for (const k of ['title', 'house', 'floor', 'room', 'height', 'addon']) if (c[k] == null || String(c[k]).trim() === '') delete c[k];
      if (c.fill !== true) delete c.fill;
      if (c.idle_return == null || c.idle_return === '' || !Number.isFinite(Number(c.idle_return))) delete c.idle_return;
      return c;
    }

    /** the editor's fields; plan: { houses: [names], floors: [names], rooms: [names] } from the add-on, or null (then free text) */
    static editorSchema(plan, T = TEXT.en) {
      const choose = (key) => ({ select: { mode: 'dropdown', options: OPTIONS[key].map((value) => ({ value, label: T[`${key}.${value}`] || value })) } });
      const list = (names, first) => ({ select: { mode: 'dropdown', custom_value: true, options: [...first, ...names.map((n) => ({ value: n, label: n }))] } });
      const text = { text: {} };
      return [
        { name: 'title', selector: text },
        ...(plan && plan.houses.length < 2 ? [] : [{ name: 'house', selector: plan ? list(plan.houses, []) : text }]),
        { type: 'grid', name: '', schema: [
          { name: 'floor', selector: plan ? list(plan.floors, [{ value: 'house', label: T.wholeHouse }]) : text },
          { name: 'room', selector: plan ? list(plan.rooms, []) : text },
        ] },
        { type: 'grid', name: '', schema: [{ name: 'height', selector: text }, { name: 'fill', selector: { boolean: {} } }] },
        { type: 'expandable', name: 'look', flatten: true, title: T.look, schema: [
          { type: 'grid', name: '', schema: ['theme', 'quality', 'walls', 'labels', 'heatmap', 'night', 'alerts'].map((k) => ({ name: k, selector: choose(k) })) },
          { name: 'idle_return', selector: { number: { min: 0, max: 1440, mode: 'box', unit_of_measurement: 'min' } } },
        ] },
        { type: 'expandable', name: 'parts', flatten: true, title: T.parts, schema: ON_BY_DEFAULT.map((k) => ({ name: k, selector: { boolean: {} } })) },
        { type: 'expandable', name: 'advanced', flatten: true, title: T.advanced, schema: [{ name: 'addon', selector: text }] },
      ];
    }

    /* ---- the card ---- */
    static getConfigElement() { return document.createElement(`${TAG}-editor`); }
    static getStubConfig() { return {}; }

    setConfig(config) {
      if (!config || typeof config !== 'object') throw new Error('3D Floorplan: the card needs a configuration');
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

    getCardSize() { return Math.max(3, Math.ceil(Floorplan3dCard.heightPx(this._config) / 50)); }
    getGridOptions() { return { columns: 12, rows: Math.max(3, Math.round((Floorplan3dCard.heightPx(this._config) + 8) / 64)), min_columns: 4, min_rows: 3 }; }
    getLayoutOptions() { return { grid_columns: 4, grid_rows: Math.max(3, Math.round((Floorplan3dCard.heightPx(this._config) + 8) / 64)), grid_min_rows: 3 }; }

    connectedCallback() {
      if (!this._held) { this._held = true; hold(true); }
      this._render();
    }
    disconnectedCallback() {
      if (this._held) { this._held = false; hold(false); }
      clearTimeout(this._retry);
    }

    _dom() {
      if (this._root) return this._root;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>
        :host { display: block; height: 100%; }
        ha-card { display: flex; flex-direction: column; height: 100%; overflow: hidden; box-sizing: border-box; }
        .box { position: relative; flex: 1 1 auto; min-height: 160px; }
        iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; background: transparent; }
        .msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;
               text-align: center; line-height: 1.4; color: var(--secondary-text-color, #888); pointer-events: none; }
        .msg.err { color: var(--error-color, #db4437); }
        .msg[hidden], iframe[hidden] { display: none; }
      </style><ha-card><div class="box"><iframe title="3D Floorplan" allow="fullscreen" hidden></iframe><div class="msg"></div></div></ha-card>`;
      this._root = root;
      root.querySelector('iframe').addEventListener('load', () => { if (root.querySelector('iframe').src) root.querySelector('.msg').hidden = true; });
      return root;
    }
    _size() {
      if (!this._root || !this._config) return;
      const grid = this._layout === 'grid', panel = this._layout === 'panel' || !!this._panel;
      this._root.querySelector('.box').style.height = Floorplan3dCard.frameHeight(this._config, { grid, panel });
    }
    _message(text, err = false) {
      const m = this._dom().querySelector('.msg');
      m.textContent = text; m.hidden = !text; m.classList.toggle('err', err);
    }
    async _render() {
      if (!this._config) return;
      const root = this._dom(), card = root.querySelector('ha-card');
      if (this._config.title) card.setAttribute('header', this._config.title); else card.removeAttribute('header');
      this._size();
      const hass = this._hass;
      if (!hass) return;
      const T = texts(hass), run = (this._run || 0) + 1;
      this._run = run;
      this._dark = !!hass.themes?.darkMode;
      const frame = root.querySelector('iframe');
      try {
        const addon = await findAddon(hass, this._config);
        await session(hass);
        if (run !== this._run) return;                                  // a newer config came in meanwhile
        const url = Floorplan3dCard.frameUrl(addon.ingressUrl, this._config, this._dark);
        if (frame.getAttribute('src') !== url) { this._message(T.loading); frame.setAttribute('src', url); }
        frame.hidden = false;
      } catch (e) {
        if (run !== this._run) return;
        const kind = TEXT.en[e?.kind] ? e.kind : 'failed';
        frame.hidden = true; frame.removeAttribute('src');
        this._message(fill(T[kind], { v: e?.version, min: MIN_ADDON, e: e?.message || e?.code || String(e), tried: (e?.tried || []).join(', ') }), true);
        clearTimeout(this._retry);
        if (this.isConnected) this._retry = setTimeout(() => this._render(), 30000);   // the add-on may be starting: try again
      }
    }
  }

  /* ---- the visual editor ---- */
  class Floorplan3dCardEditor extends HTMLElement {
    /** Home Assistant loads its form element (ha-form) only for its own editors: open one of them once if it is not there yet */
    async connectedCallback() {
      if (customElements.get('ha-form') || !window.loadCardHelpers) return;
      try { const helpers = await window.loadCardHelpers(); const c = await helpers.createCardElement({ type: 'entities', entities: [] }); await c.constructor.getConfigElement?.(); }
      catch { /* an older Home Assistant: ha-form is there anyway */ }
      this._render();
    }
    setConfig(config) { this._config = { ...config }; this._render(); }
    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (this._form) this._form.hass = hass;
      if (first) { this._render(); this._loadPlan(); }
    }
    /** the houses, floors and rooms of the add-on for the drop-downs; without them the fields stay free text */
    async _loadPlan() {
      try {
        const addon = await findAddon(this._hass, this._config || {});
        await session(this._hass);
        const get = async (path) => { const r = await fetch(addon.ingressUrl.replace(/\/?$/, '/') + path, { credentials: 'same-origin' }); if (!r.ok) throw new Error(r.status); return r.json(); };
        const houses = await get('api/houses').catch(() => []);
        const want = String(this._config?.house || '').trim().toLowerCase();
        const house = houses.find((h) => h.id === want || String(h.name).trim().toLowerCase() === want) || houses[0];
        const layout = await get(`api/layout${house ? `?house=${encodeURIComponent(house.id)}` : ''}`);
        const floors = (layout.floors || []).map((f) => f.name).filter(Boolean);
        const rooms = [...new Set((layout.floors || []).flatMap((f) => (f.rooms || []).map((r) => r.name)).filter(Boolean))];
        this._plan = { houses: houses.map((h) => h.name).filter(Boolean), floors, rooms };
        this._planHouse = want;
        this._render();
      } catch { /* the add-on is not there or not running: free text */ }
    }
    _render() {
      if (!this._hass || !this._config) return;
      const T = texts(this._hass);
      if (!this._form) {
        this._form = document.createElement('ha-form');
        this._form.addEventListener('value-changed', (e) => this._changed(e.detail.value));
        this.append(this._form);
      }
      this._form.hass = this._hass;
      this._form.schema = Floorplan3dCard.editorSchema(this._plan || null, T);
      this._form.data = Floorplan3dCard.editorData(this._config);
      this._form.computeLabel = (s) => T[s.name] || s.title || s.name;
    }
    _changed(data) {
      const config = Floorplan3dCard.editorConfig(this._config, data);
      const houseChanged = String(config.house || '').trim().toLowerCase() !== (this._planHouse ?? '');
      this._config = config;
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
      if (houseChanged && this._plan) this._loadPlan();                  // another house: its floors and rooms
    }
  }

  if (!customElements.get(TAG)) customElements.define(TAG, Floorplan3dCard);
  if (!customElements.get(`${TAG}-editor`)) customElements.define(`${TAG}-editor`, Floorplan3dCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === TAG)) {
    window.customCards.push({ type: TAG, name: '3D Floorplan', description: texts(null).description, preview: false,
      documentationURL: 'https://github.com/BuRnEd4AiM/HA-Floorplanner#-dashboard-card' });
  }
})();
