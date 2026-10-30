/* Small bootstrap for the 3D Floorplan card: it registers custom:floorplan3d-container-card immediately, so Home Assistant's
 * Lovelace never shows “Custom element doesn't exist” while the full card (about 26 KB) is still downloading. The full card is
 * imported lazily and rendered inside this element. Home Assistant loads this file with add_extra_js_url().
 *
 * Keep this file small — it is the part that has to arrive before Home Assistant renders the dashboard.
 */
const TAG = "floorplan3d-container-card";
const IMPL = `./floorplan3d-container-card-impl.js${new URL(import.meta.url).search}`;
const TEXT = {
  en: {
    loading: "Loading 3D floor plan …",
    failed: "The 3D floor plan card could not be loaded.",
    retry: "Retry",
    description: "The 3D floor plan of the floorplan3d container, signed in through the 3D Floorplan (Container) integration.",
  },
  de: {
    loading: "3D-Grundriss wird geladen …",
    failed: "Die 3D-Grundriss-Karte konnte nicht geladen werden.",
    retry: "Erneut versuchen",
    description: "Der 3D-Grundriss des floorplan3d-Containers, angemeldet über die Integration 3D Floorplan (Container).",
  },
  zh: {
    loading: "正在加载 3D 楼层图 …",
    failed: "无法加载 3D 楼层图卡片。",
    retry: "重试",
    description: "floorplan3d 容器的 3D 楼层图，通过 3D Floorplan (Container) 集成自动登录。",
  },
};

const texts = (hass) => {
  const lang = TEXT[String(hass?.locale?.language || navigator.language || "en").slice(0, 2)] || TEXT.en;
  return (key) => lang[key] ?? TEXT.en[key];
};

let implPromise = null;

/** the full card, once; a failed import is retried by the button instead of staying broken forever */
const loadImpl = () => {
  if (!implPromise) {
    implPromise = import(IMPL).then(() => {
      const impl = window.__floorplan3dContainerCard;
      if (!impl?.CardTag || !impl?.EditorTag) throw new Error("floorplan3d: the card implementation did not load");
      return impl;
    }).catch((err) => {
      implPromise = null;
      throw err;
    });
  }
  return implPromise;
};

class Floorplan3dContainerCardLoader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._message("loading");
  }

  static getConfigElement() { return document.createElement(`${TAG}-editor`); }
  static getStubConfig() { return {}; }

  setConfig(config) {
    this._config = { ...(config || {}) };
    if (this._impl) this._impl.setConfig(this._config);
    this._ensure();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._impl) this._impl.hass = hass;
    else if (this._config) this._ensure();
  }

  get hass() { return this._hass; }
  set layout(value) { this._layout = value; if (this._impl) this._impl.layout = value; }
  get layout() { return this._layout; }
  set isPanel(value) { this._panel = !!value; if (this._impl) this._impl.isPanel = value; }
  get isPanel() { return this._panel; }

  getCardSize() {
    if (this._impl?.getCardSize) return this._impl.getCardSize();
    const h = Number(this._config?.height);
    return Math.max(3, Math.ceil((Number.isFinite(h) && h > 0 ? h : 400) / 50));
  }

  getGridOptions() {
    if (this._impl?.getGridOptions) return this._impl.getGridOptions();
    return { columns: 12, rows: this.getCardSize(), min_columns: 4, min_rows: 3 };
  }

  getLayoutOptions() {
    if (this._impl?.getLayoutOptions) return this._impl.getLayoutOptions();
    return { grid_columns: 4, grid_rows: this.getCardSize(), grid_min_rows: 3 };
  }

  connectedCallback() { if (this._config) this._ensure(); }
  disconnectedCallback() { /* the full card travels with this element; nothing to release */ }

  _message(text, retry = false) {
    const T = texts(this._hass);
    const label = text === "loading" ? T("loading") : T("failed");
    this.shadowRoot.innerHTML = `<style>
      :host { display: block; height: 100%; }
      .box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 160px;
             height: 100%; box-sizing: border-box; padding: 16px; text-align: center; color: var(--secondary-text-color, #888);
             font-family: var(--paper-font-body1_-_font-family, sans-serif); }
      button { padding: 6px 16px; border-radius: 16px; border: 1px solid var(--divider-color, #ddd); background: none;
               color: inherit; cursor: pointer; font: inherit; }
    </style><div class="box"><span>${label}</span>${retry ? `<button type="button">${T("retry")}</button>` : ""}</div>`;
    this.shadowRoot.querySelector("button")?.addEventListener("click", () => this._ensure(true));
  }

  _ensure(force = false) {
    if (this._impl) return Promise.resolve(this._impl);
    if (force) implPromise = null;
    if (this._implPromise) return this._implPromise;
    this._implPromise = loadImpl().then(({ CardTag }) => {
      const card = document.createElement(CardTag);
      card.setConfig(this._config || {});
      this._impl = card;
      this.shadowRoot.replaceChildren(card);
      if (this._hass) card.hass = this._hass;
      if (this._layout) card.layout = this._layout;
      if (this._panel) card.isPanel = this._panel;
      return card;
    }).catch((err) => {
      this._implPromise = null;
      console.error("3D Floorplan: the card could not be loaded", err);
      this._message("failed", true);
    });
    return this._implPromise;
  }
}

class Floorplan3dContainerCardEditorLoader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    if (this._impl) this._impl.setConfig(this._config);
    this._ensure();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._impl) this._impl.hass = hass;
    else if (this._config) this._ensure();
  }

  connectedCallback() { if (this._config) this._ensure(); }

  _ensure() {
    if (this._impl) return Promise.resolve(this._impl);
    if (this._implPromise) return this._implPromise;
    this._implPromise = loadImpl().then(({ EditorTag }) => {
      const editor = document.createElement(EditorTag);
      editor.setConfig(this._config || {});
      this._impl = editor;
      this.shadowRoot.replaceChildren(editor);
      if (this._hass) editor.hass = this._hass;
      return editor;
    }).catch((err) => {
      this._implPromise = null;
      console.error("3D Floorplan: the card editor could not be loaded", err);
    });
    return this._implPromise;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, Floorplan3dContainerCardLoader);
if (!customElements.get(`${TAG}-editor`)) customElements.define(`${TAG}-editor`, Floorplan3dContainerCardEditorLoader);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === TAG)) {
  window.customCards.push({
    type: TAG,
    name: "3D Floorplan (Container)",
    description: TEXT.en.description,
    preview: false,
    documentationURL: "https://github.com/BuRnEd4AiM/HA-Floorplanner/blob/main/container/custom_components/floorplan3d/README.md",
  });
}
