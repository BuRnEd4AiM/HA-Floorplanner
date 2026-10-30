/* 3D Floorplan (Container) card (container/custom_components/floorplan3d/frontend): the options of the add-on's card work here too
 * (they become the plan's address), the card needs no options, and a second copy of the file (a new resource version next to the old
 * one) does not throw. The card is loaded the way the browser loads it: the file defines its elements and puts itself into Home
 * Assistant's card picker. */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const FILE = new URL("../frontend/floorplan3d-container-card.js", import.meta.url);
const SOURCE = readFileSync(FILE, "utf8");
const DIST_SOURCE = readFileSync(new URL("../../../../dist/floorplan3d-card.js", import.meta.url), "utf8");
const TAG = "floorplan3d-container-card";

/** a stand-in for a DOM element: the card builds its shadow DOM, the tests only look at what it decides */
function fake() {
  const el = {
    style: {},
    hidden: false,
    addEventListener() {},
    append() {},
    setAttribute() {},
    removeAttribute() {},
    getAttribute: () => "",
    classList: { toggle() {}, add() {}, remove() {} },
    querySelector: () => fake(),
  };
  return el;
}

/** one script scope (a browser gives every module its own), sharing the element registry and the page's window */
function scope(shared = { defined: new Map(), window: {} }) {
  const context = vm.createContext({
    HTMLElement: class { attachShadow() { return { innerHTML: "", querySelector: () => fake(), append() {} }; } },
    customElements: { get: (tag) => shared.defined.get(tag), define: (tag, ctor) => shared.defined.set(tag, ctor) },
    window: shared.window,
    navigator: { language: "en" },
    location: { search: "" },
    console,
    URL,
    URLSearchParams,
    clearTimeout() {},
    setTimeout: () => 0,
  });
  vm.runInContext(SOURCE, context, { filename: "floorplan3d-container-card.js" });
  shared.Card = shared.defined.get(TAG);
  shared.Editor = shared.defined.get(`${TAG}-editor`);
  return { ...shared, context };
}

function card(config = {}) {
  const c = new (scope().Card)();
  c.setConfig(config);
  return c;
}

test("the card needs no options: it opens the plan the integration serves", () => {
  const { Card } = scope();
  assert.ok(Card, "the element is defined");
  assert.ok(Card.getStubConfig && Object.keys(Card.getStubConfig()).length === 0, "adding it from the picker works without options");
  const c = card({});
  assert.equal(c._config.url, undefined);
  assert.equal(Card.frameUrl(null, {}, false), "/floorplan/?card=1");
});

test("the plan's options go into its address, exactly like the add-on's card", () => {
  const config = { house: "home", floor: "EG", room: "Wohnzimmer", view: "panel", theme: "dark", quality: "low",
                   walls: "see_through", labels: "all", heatmap: "temp", night: "sun", alerts: false,
                   room_panel: false, show_nav: false, show_bar: true, tabs: true, idle_return: 7 };
  const url = scope().Card.frameUrl("/floorplan/", config, false);
  const q = new URLSearchParams(new URL(url, "http://ha.test/").search);
  assert.equal(url.split("?")[0], "/floorplan/");
  assert.equal(q.get("card"), "1");
  assert.equal(q.get("house"), "home");
  assert.equal(q.get("floor"), "EG");
  assert.equal(q.get("room"), "Wohnzimmer");
  assert.equal(q.get("view"), "panel");
  assert.equal(q.get("theme"), "dark");
  assert.equal(q.get("perf"), "low");
  assert.equal(q.get("walls"), "see_through");
  assert.equal(q.get("labels"), "all");
  assert.equal(q.get("heatmap"), "temp");
  assert.equal(q.get("night"), "sun");
  assert.equal(q.get("alerts"), "0");                    // false is said, the plan switches the warnings off
  assert.equal(q.get("room_panel"), "0");
  assert.equal(q.get("show_nav"), "0");
  assert.equal(q.get("show_bar"), "1");
  assert.equal(q.get("tabs"), "1");
  assert.equal(q.get("idle_return"), "7");
});

test("defaults are not said (the plan keeps its own settings)", () => {
  const q = new URLSearchParams(new URL(scope().Card.frameUrl("/floorplan/", {}, false), "http://ha.test/").search);
  for (const k of ["theme", "perf", "walls", "labels", "heatmap", "night", "alerts", "view", "tabs", "kiosk", "idle_return"]) {
    assert.equal(q.get(k), null, k);
  }
});

test("theme auto follows Home Assistant's dark mode", () => {
  const f = scope().Card.frameUrl;
  assert.equal(new URLSearchParams(new URL(f("/floorplan/", { theme: "auto" }, true), "http://ha.test/").search).get("theme"), "dark");
  assert.equal(new URLSearchParams(new URL(f("/floorplan/", { theme: "auto" }, false), "http://ha.test/").search).get("theme"), "light");
});

test("an own url is the base, its options stay and are not overwritten", () => {
  const url = scope().Card.frameUrl("/floorplan/?kiosk=1&theme=holo", { theme: "dark", view: "room" }, false);
  const q = new URLSearchParams(new URL(url, "http://ha.test/").search);
  assert.equal(q.get("kiosk"), "1");                     // the plan's own option that has no card option of its own
  assert.equal(q.get("theme"), "dark");                  // a card option wins over the url
  assert.equal(q.get("view"), "room");
  assert.equal(url.split("?")[0], "/floorplan/");
});

test("a trailing slash is added once", () => {
  assert.equal(scope().Card.frameUrl("/floorplan", {}, false), "/floorplan/?card=1");
  assert.equal(scope().Card.frameUrl("/floorplan/", {}, false), "/floorplan/?card=1");
});

test("the height: fill, a number in px, a CSS length, else the default", () => {
  const f = scope().Card.frameHeight;
  assert.equal(f({ fill: true }), "calc(100vh - var(--header-height, 56px) - 16px)");
  assert.equal(f({}, { grid: true }), "100%");                       // in a cell of a sections dashboard
  assert.equal(f({}, { panel: true }), "calc(100vh - var(--header-height, 56px))");
  assert.equal(f({ height: 600 }), "600px");
  assert.equal(f({ height: "60vh" }), "60vh");
  assert.equal(f({}), "400px");
  assert.equal(scope().Card.heightPx({ height: 600 }), 600);
  assert.equal(scope().Card.heightPx({ height: "60vh" }), 400);
});

test("kiosk is a wall tablet, never for an administrator, off with ?kiosk=off", () => {
  const w = scope().Card.kioskWanted;
  assert.equal(w({ kiosk: true }, { is_admin: false }, ""), true);
  assert.equal(w({ kiosk: true }, { is_admin: true }, ""), false);          // the administrator manages the dashboard
  assert.equal(w({ kiosk: true }, null, ""), false);
  assert.equal(w({ kiosk: true }, { is_admin: false }, "/lovelace/0?kiosk=off"), false);
  assert.equal(w({ kiosk: true }, { is_admin: false }, "/lovelace/0?x=1"), true);
  assert.equal(w({}, { is_admin: false }, ""), false);
});

/** a field of the form, also inside the grids and the expandable groups */
function findField(schema, name) {
  for (const field of schema) {
    if (field.name === name) return field;
    if (field.schema) { const hit = findField(field.schema, name); if (hit) return hit; }
  }
  return null;
}

test("the editor exists and its form knows the plan's options", () => {
  const { Card, Editor } = scope();
  assert.ok(Editor, "the editor element is defined");
  assert.ok(Card.editorSchema(null, (k) => k).some((f) => f.name === "view"));
  const advanced = Card.editorSchema(null, (k) => k).find((f) => f.name === "advanced");
  assert.ok(advanced.schema.some((f) => f.name === "url"));              // this version's own option
  // one house: no drop-down for it (the plan has no houses to switch between)
  assert.equal(Card.editorSchema({ houses: ["home"], floors: [], rooms: [] }, (k) => k).some((f) => f.name === "house"), false);
  const schema = Card.editorSchema({ houses: ["home", "holiday"], floors: ["EG", "OG"], rooms: ["Wohnzimmer"] }, (k) => k);
  const house = findField(schema, "house").selector.select;
  assert.equal(JSON.stringify(house.options.map((o) => o.value)), JSON.stringify(["home", "holiday"]));
  const floor = findField(schema, "floor").selector.select;
  assert.equal(JSON.stringify(floor.options.map((o) => o.value)), JSON.stringify(["house", "EG", "OG"]));
  const url = findField(schema, "url").selector.text;                  // the plan's address is this version's own option
  assert.ok(url);
});

test("the editor's form data round-trips to a small config", () => {
  const data = scope().Card.editorData({ theme: "dark", fill: true, show_nav: false });
  assert.equal(data.theme, "dark");
  assert.equal(data.show_nav, false);
  const config = scope().Card.editorConfig({}, data);
  assert.equal(JSON.stringify(config), JSON.stringify({ theme: "dark", fill: true, show_nav: false })); // defaults left out
});

test("a dark mode change re-renders the frame without signing in again", async () => {
  const { Card } = scope();
  let calls = 0;
  const hass = { callApi: async () => { calls++; }, themes: { darkMode: false }, locale: { language: "en" }, user: { id: "u" } };
  const c = new Card();
  c.setConfig({});
  c.hass = hass;
  await c._render();
  const once = calls;
  assert.ok(once >= 1, "the first render signs in");
  c.hass = { ...hass, themes: { darkMode: true } };
  await c._render();
  assert.equal(calls, once, "the session cookie is already there; no second OAuth handshake");
});

test("the retry button has a label", () => {
  assert.match(SOURCE, /button\.textContent = texts\(this\._hass\)\("retry"\)/);
});

test("the copied card's options do not drift away from the add-on card", () => {
  /** the literal after `const NAME =`, with quote style and whitespace made comparable */
  const literal = (source, name, end) => {
    const match = new RegExp(`const ${name} = ([\\s\\S]*?)${end}`).exec(source);
    assert.ok(match, `${name} is in both cards`);
    return match[1].replace(/\/\/[^\n]*/g, "").replace(/['"]/g, '"').replace(/\s+/g, " ").trim();
  };
  assert.equal(literal(SOURCE, "OPTIONS", "\\n\\s*\\};"), literal(DIST_SOURCE, "OPTIONS", "\\n\\s*\\};"));
  assert.equal(literal(SOURCE, "SKIP", "\\};"), literal(DIST_SOURCE, "SKIP", "\\};"));
  assert.equal(literal(SOURCE, "ON_BY_DEFAULT", ";"), literal(DIST_SOURCE, "ON_BY_DEFAULT", ";"));
  assert.equal(literal(SOURCE, "OFF_BY_DEFAULT", ";"), literal(DIST_SOURCE, "OFF_BY_DEFAULT", ";"));
});

test("the card is in the card picker, needs no url, and a second copy of the file does not throw", () => {

  const shared = { defined: new Map(), window: {} };
  const first = scope(shared);
  assert.equal(JSON.stringify(shared.window.customCards.map((c) => c.type)), JSON.stringify([TAG]));
  scope(shared);                                         // e.g. ?v=1 next to ?v=2 while the browser still has both
  assert.equal(shared.defined.size, 2);                  // the card and its editor, defined once
  assert.equal(shared.window.customCards.length, 1);
  const c = new (shared.defined.get(TAG))();
  c.setConfig({});                                       // nothing to configure
  assert.equal(c._config.url, undefined);
  assert.equal(shared.Card.frameUrl(null, {}, false), "/floorplan/?card=1");
});
