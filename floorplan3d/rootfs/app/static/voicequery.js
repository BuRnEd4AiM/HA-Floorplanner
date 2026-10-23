/* The voice search (#509): a spoken or typed sentence ("Welche Fenster sind offen?", "Wie sieht's im Wohnzimmer aus?", "Ist oben noch
 * Licht an?") turned into what to show: which things (windows, doors, lights …), in which state (open, on …) and where (a room, a floor,
 * a house, or a code word of the settings such as "Wohnzimmer der Eltern"). No AI: known words in the 7 languages of the add-on (plus
 * English), the names of the plans and the code words; the rest of the sentence may be free. Pure (unit test: tests/voicequery.test.mjs);
 * voiceui.js shows the answer. */

/** how the engine of the settings may be chosen: auto (the browser's own recognition, else Home Assistant's Assist), browser, assist, off */
export const ENGINES = ['auto', 'browser', 'assist', 'off'];
/** at most this many code words (the server keeps the same: voice.py MAX_ALIASES) */
export const MAX_ALIASES = 60;
/** what can be asked about, in the order of the answers' icons */
export const WHATS = ['windows', 'doors', 'gates', 'lights', 'covers', 'locks', 'media', 'heating', 'battery', 'offline', 'temp', 'humid', 'co2', 'devices'];
export const ICONS = { windows: '🪟', doors: '🚪', gates: '🚗', lights: '💡', covers: '🪟', locks: '🔒', media: '🎵', heating: '🔥', battery: '🪫', offline: '⚠',
  temp: '🌡', humid: '💧', co2: '🌬', devices: '📋' };
/** the readings of a room (the colour modes of the house: temp, humid, co2) */
export const READINGS = ['temp', 'humid', 'co2'];

/* Words per language. what: the things; state: sure = a word that only means that state, end = a word that also is a preposition ("an der
 * Tür", "lights on the first floor") and counts only at the end of the sentence; all: "alle"; floor: generic words for a floor; stop: little
 * words that are dropped (and may stand after a state word at the end); notOff: words that make "aus" a part of the verb ("wie sieht es
 * aus"). Words are folded (fold: lower case, no accents, ß = ss). A word of 4 letters or more also matches a longer form ("fenstern"). */
const WORDS = {
  de: {
    what: {
      windows: ['fenster', 'dachfenster'], doors: ['tur', 'ture', 'turen', 'haustur', 'eingangstur', 'terrassentur', 'balkontur'],
      gates: ['tor', 'tore', 'garagentor', 'hoftor', 'gartentor'], lights: ['licht', 'lichter', 'lampe', 'lampen', 'leuchte', 'beleuchtung'],
      covers: ['rollladen', 'rolladen', 'rollo', 'rollos', 'jalousie', 'jalousien', 'markise'], locks: ['schloss', 'schlosser', 'turschloss'],
      media: ['fernseher', 'fernsehen', 'tv', 'musik', 'lautsprecher', 'radio'], heating: ['heizung', 'heizungen', 'heizt', 'thermostat', 'heizkorper'],
      battery: ['batterie', 'batterien', 'akku', 'akkus'], offline: ['offline', 'unerreichbar', 'erreichbar', 'ausgefallen'],
      temp: ['temperatur', 'warm', 'kalt', 'grad', 'heiss', 'warme'], humid: ['feucht', 'feuchtigkeit', 'luftfeuchte', 'luftfeuchtigkeit'], co2: ['co2', 'luft', 'luften'],
      devices: ['gerate'],
    },
    state: {
      open: { sure: ['offen', 'geoffnet', 'gekippt', 'aufgemacht', 'unverschlossen', 'aufgeschlossen'], end: ['auf'] },
      closed: { sure: ['geschlossen', 'zugemacht', 'verschlossen', 'abgeschlossen', 'zugesperrt', 'verriegelt'], end: ['zu'] },
      on: { sure: ['eingeschaltet', 'angeschaltet', 'brennt', 'brennen', 'leuchtet', 'leuchten', 'lauft', 'laufen', 'spielt'], end: ['an'] },
      off: { sure: ['ausgeschaltet', 'abgeschaltet'], end: ['aus'] },
      low: { sure: ['leer', 'schwach', 'niedrig', 'wechseln'], end: [] },
    },
    all: ['alle', 'alles', 'uberall', 'samtliche', 'ganze', 'ganzen'],
    floor: { ground: ['erdgeschoss', 'eg', 'parterre', 'unten'], upper: ['oben', 'obergeschoss', 'og', 'obere', 'oberen', 'stock'],
      basement: ['keller', 'untergeschoss', 'ug'], attic: ['dachgeschoss', 'dachboden', 'dg', 'spitzboden'] },
    stop: ['ist', 'sind', 'es', 's', 'im', 'in', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'noch', 'gerade', 'jetzt',
      'bitte', 'mal', 'welche', 'welcher', 'welches', 'wo', 'wie', 'was', 'zeig', 'zeige', 'zeigen', 'mir', 'uns', 'sieht', 'siehts', 'schaut',
      'schauts', 'aus', 'bei', 'beim', 'vom', 'von', 'zum', 'zur', 'und', 'oder', 'gibt', 'haben', 'hat', 'wir', 'ich', 'denn', 'eigentlich',
      'irgendwo', 'irgendein', 'irgendeine', 'mit', 'am', 'an', 'auf', 'zu', 'da', 'dort', 'hier', 'haus', 'hause', 'zuhause', 'etage', 'stockwerk', 'raum', 'zimmer'],
    notOff: ['sieht', 'siehts', 'schaut', 'schauts', 'aussehen'],
    numbers: { eins: '1', zwei: '2', drei: '3', vier: '4', funf: '5', sechs: '6' },
  },
  en: {
    what: {
      windows: ['window', 'windows', 'skylight', 'skylights'], doors: ['door', 'doors', 'frontdoor'], gates: ['gate', 'gates', 'garage'],
      lights: ['light', 'lights', 'lamp', 'lamps', 'lighting'], covers: ['shutter', 'shutters', 'blind', 'blinds', 'cover', 'covers', 'awning'],
      locks: ['lock', 'locks'], media: ['tv', 'television', 'music', 'speaker', 'speakers', 'radio'],
      heating: ['heating', 'heater', 'heaters', 'thermostat', 'radiator'], battery: ['battery', 'batteries'], offline: ['offline', 'unavailable'],
      temp: ['temperature', 'warm', 'cold', 'degrees', 'hot'], humid: ['humidity', 'humid'], co2: ['co2', 'air'], devices: ['devices'],
    },
    state: {
      open: { sure: ['open', 'opened', 'unlocked'], end: [] }, closed: { sure: ['closed', 'shut', 'locked'], end: [] },
      on: { sure: ['running', 'playing', 'lit'], end: ['on'] }, off: { sure: [], end: ['off'] }, low: { sure: ['low', 'empty', 'flat', 'weak'], end: [] },
    },
    all: ['all', 'every', 'everything', 'anything', 'everywhere', 'whole'],
    floor: { ground: ['downstairs', 'ground floor'], upper: ['upstairs', 'upper floor'], basement: ['basement', 'cellar'], attic: ['attic', 'loft'] },
    stop: ['is', 'are', 'the', 'a', 'an', 'in', 'on', 'of', 'at', 'still', 'now', 'please', 'which', 'what', 'where', 'how', 'show', 'me', 'us',
      'does', 'do', 'look', 'looks', 'like', 'any', 'there', 'and', 'or', 'it', 's', 'house', 'home', 'floor', 'room', 'i', 'we', 'have', 'has', 'off', 'up'],
    notOff: [],
    numbers: { two: '2', three: '3', four: '4', five: '5', six: '6' },
  },
  fr: {
    what: {
      windows: ['fenetre', 'fenetres', 'velux'], doors: ['porte', 'portes'], gates: ['portail', 'portails', 'garage'],
      lights: ['lumiere', 'lumieres', 'lampe', 'lampes', 'eclairage'], covers: ['volet', 'volets', 'store', 'stores'], locks: ['serrure', 'serrures', 'verrou'],
      media: ['tele', 'television', 'tv', 'musique', 'enceinte'], heating: ['chauffage', 'radiateur', 'radiateurs', 'thermostat'],
      battery: ['batterie', 'batteries', 'pile', 'piles'], offline: ['hors', 'ligne', 'injoignable'],
      temp: ['temperature', 'chaud', 'froid', 'degres'], humid: ['humidite', 'humide'], co2: ['co2', 'air'], devices: ['appareils'],
    },
    state: {
      open: { sure: ['ouvert', 'ouverte', 'ouverts', 'ouvertes', 'deverrouillee'], end: [] }, closed: { sure: ['ferme', 'fermee', 'fermes', 'fermees', 'verrouillee'], end: [] },
      on: { sure: ['allume', 'allumee', 'allumes', 'allumees'], end: [] }, off: { sure: ['eteint', 'eteinte', 'eteints', 'eteintes'], end: [] },
      low: { sure: ['faible', 'faibles', 'vide', 'vides'], end: [] },
    },
    all: ['tous', 'toutes', 'tout', 'partout'],
    floor: { ground: ['rez de chaussee'], upper: ['en haut', 'etage'], basement: ['cave', 'sous sol'], attic: ['grenier', 'combles'] },
    stop: ['est', 'sont', 'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'dans', 'au', 'aux', 'en', 'encore', 'quel', 'quelle', 'quels',
      'quelles', 'ou', 'comment', 'montre', 'moi', 'il', 'y', 'a', 'qu', 'que', 'est', 'ce', 'maison', 'piece', 'chez', 's', 'il'],
    notOff: [],
    numbers: { deux: '2', trois: '3', quatre: '4', cinq: '5' },
  },
  es: {
    what: {
      windows: ['ventana', 'ventanas'], doors: ['puerta', 'puertas'], gates: ['porton', 'portones', 'garaje'], lights: ['luz', 'luces', 'lampara', 'lamparas'],
      covers: ['persiana', 'persianas', 'toldo'], locks: ['cerradura', 'cerraduras'], media: ['tele', 'television', 'tv', 'musica', 'altavoz'],
      heating: ['calefaccion', 'radiador', 'radiadores', 'termostato'], battery: ['bateria', 'baterias', 'pila', 'pilas'], offline: ['desconectado', 'desconectados'],
      temp: ['temperatura', 'calor', 'frio', 'grados'], humid: ['humedad', 'humedo'], co2: ['co2', 'aire'], devices: ['dispositivos'],
    },
    state: {
      open: { sure: ['abierta', 'abiertas', 'abierto', 'abiertos'], end: [] }, closed: { sure: ['cerrada', 'cerradas', 'cerrado', 'cerrados'], end: [] },
      on: { sure: ['encendida', 'encendidas', 'encendido', 'encendidos', 'prendida', 'prendidas'], end: [] },
      off: { sure: ['apagada', 'apagadas', 'apagado', 'apagados'], end: [] }, low: { sure: ['baja', 'bajas', 'vacia', 'vacias'], end: [] },
    },
    all: ['todas', 'todos', 'toda', 'todo'],
    floor: { ground: ['planta baja'], upper: ['arriba', 'planta alta'], basement: ['sotano'], attic: ['atico', 'desvan'] },
    stop: ['esta', 'estan', 'el', 'la', 'los', 'las', 'un', 'una', 'en', 'de', 'del', 'al', 'que', 'cual', 'cuales', 'donde', 'como', 'muestra', 'muestrame',
      'me', 'hay', 'todavia', 'aun', 'casa', 'habitacion', 'y'],
    notOff: [],
    numbers: { dos: '2', tres: '3', cuatro: '4', cinco: '5' },
  },
  it: {
    what: {
      windows: ['finestra', 'finestre'], doors: ['porta', 'porte'], gates: ['cancello', 'cancelli', 'garage'], lights: ['luce', 'luci', 'lampada', 'lampade'],
      covers: ['tapparella', 'tapparelle', 'persiana', 'persiane', 'tenda'], locks: ['serratura', 'serrature'], media: ['tv', 'televisore', 'musica', 'altoparlante'],
      heating: ['riscaldamento', 'termosifone', 'termosifoni', 'termostato'], battery: ['batteria', 'batterie', 'pila', 'pile'], offline: ['offline', 'irraggiungibile'],
      temp: ['temperatura', 'caldo', 'freddo', 'gradi'], humid: ['umidita', 'umido'], co2: ['co2', 'aria'], devices: ['dispositivi'],
    },
    state: {
      open: { sure: ['aperta', 'aperte', 'aperto', 'aperti'], end: [] }, closed: { sure: ['chiusa', 'chiuse', 'chiuso', 'chiusi'], end: [] },
      on: { sure: ['accesa', 'accese', 'acceso', 'accesi'], end: [] }, off: { sure: ['spenta', 'spente', 'spento', 'spenti'], end: [] },
      low: { sure: ['scarica', 'scariche', 'bassa', 'basse'], end: [] },
    },
    all: ['tutte', 'tutti', 'tutta', 'tutto'],
    floor: { ground: ['pianterreno', 'piano terra'], upper: ['sopra', 'di sopra'], basement: ['cantina', 'seminterrato'], attic: ['soffitta', 'mansarda'] },
    stop: ['e', 'sono', 'il', 'lo', 'la', 'i', 'gli', 'le', 'l', 'un', 'una', 'in', 'nel', 'nella', 'di', 'del', 'della', 'a', 'al', 'alla', 'quale',
      'quali', 'dove', 'come', 'mostra', 'mostrami', 'mi', 'ci', 'ancora', 'casa', 'stanza', 'piano'],
    notOff: [],
    numbers: { due: '2', tre: '3', quattro: '4', cinque: '5' },
  },
  nl: {
    what: {
      windows: ['raam', 'ramen', 'venster'], doors: ['deur', 'deuren', 'voordeur'], gates: ['poort', 'poorten', 'garagedeur'], lights: ['licht', 'lichten', 'lamp', 'lampen'],
      covers: ['rolluik', 'rolluiken', 'zonnescherm', 'jaloezie'], locks: ['slot', 'sloten'], media: ['tv', 'televisie', 'muziek', 'speaker'],
      heating: ['verwarming', 'radiator', 'thermostaat'], battery: ['batterij', 'batterijen'], offline: ['offline', 'onbereikbaar'],
      temp: ['temperatuur', 'warm', 'koud', 'graden'], humid: ['vochtigheid', 'vochtig'], co2: ['co2', 'lucht'], devices: ['apparaten'],
    },
    state: {
      open: { sure: ['open', 'geopend'], end: [] }, closed: { sure: ['dicht', 'gesloten'], end: [] },
      on: { sure: ['ingeschakeld'], end: ['aan'] }, off: { sure: ['uitgeschakeld'], end: ['uit'] }, low: { sure: ['leeg', 'bijna', 'zwak'], end: [] },
    },
    all: ['alle', 'allemaal', 'overal', 'alles'],
    floor: { ground: ['begane grond', 'beneden'], upper: ['boven', 'bovenverdieping'], basement: ['kelder'], attic: ['zolder'] },
    stop: ['is', 'zijn', 'de', 'het', 'een', 'in', 'op', 'van', 'nog', 'welke', 'waar', 'hoe', 'wat', 'toon', 'laat', 'me', 'mij', 'zien', 'er',
      'huis', 'kamer', 'aan', 'uit'],
    notOff: [],
    numbers: { twee: '2', drie: '3', vier: '4', vijf: '5' },
  },
  pl: {
    what: {
      windows: ['okno', 'okna', 'oknie', 'okien'], doors: ['drzwi'], gates: ['brama', 'bramy', 'garaz'], lights: ['swiatlo', 'swiatla', 'lampa', 'lampy'],
      covers: ['roleta', 'rolety', 'zaluzje'], locks: ['zamek', 'zamki'], media: ['telewizor', 'tv', 'muzyka', 'glosnik'],
      heating: ['ogrzewanie', 'grzejnik', 'grzejniki', 'termostat'], battery: ['bateria', 'baterie', 'akumulator'], offline: ['offline', 'niedostepne'],
      temp: ['temperatura', 'cieplo', 'zimno', 'stopni'], humid: ['wilgotnosc', 'wilgotno'], co2: ['co2', 'powietrze'], devices: ['urzadzenia'],
    },
    state: {
      open: { sure: ['otwarte', 'otwarty', 'otwarta', 'otwartych'], end: [] }, closed: { sure: ['zamkniete', 'zamkniety', 'zamknieta'], end: [] },
      on: { sure: ['wlaczone', 'wlaczony', 'wlaczona', 'swieci', 'swieca'], end: [] }, off: { sure: ['wylaczone', 'wylaczony', 'wylaczona'], end: [] },
      low: { sure: ['slaba', 'slabe', 'rozladowana', 'rozladowane'], end: [] },
    },
    all: ['wszystkie', 'wszystko', 'wszedzie'],
    floor: { ground: ['parter'], upper: ['pietro', 'gorze', 'gora'], basement: ['piwnica', 'piwnicy'], attic: ['poddasze', 'strych'] },
    stop: ['jest', 'sa', 'w', 'we', 'na', 'czy', 'ktore', 'ktory', 'gdzie', 'jak', 'co', 'pokaz', 'mi', 'jeszcze', 'dom', 'domu', 'pokoj', 'pokoju', 'i'],
    notOff: [],
    numbers: { dwa: '2', trzy: '3', cztery: '4', piec: '5' },
  },
};
export const LANGS = Object.keys(WORDS);

/** lower case, no accents, ß = ss, ł = l, only letters and digits with single spaces between them */
export const fold = (s) => String(s ?? '').toLowerCase().replace(/ß/g, 'ss').replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

/** the words of language lang, with English added (people mix "TV", "offline" into any language) */
function wordsOf(lang) {
  const a = WORDS[lang] || WORDS.de, b = lang === 'en' ? null : WORDS.en;
  if (!b) return a;
  const merge = (x, y) => [...new Set([...x, ...y])];
  return {
    what: Object.fromEntries(Object.keys(a.what).map((k) => [k, merge(a.what[k], b.what[k] || [])])),
    state: Object.fromEntries(Object.keys(a.state).map((k) => [k, { sure: merge(a.state[k].sure, b.state[k].sure), end: a.state[k].end }])),
    all: merge(a.all, b.all), floor: Object.fromEntries(Object.keys(a.floor).map((k) => [k, merge(a.floor[k], b.floor[k])])),
    stop: a.stop, notOff: a.notOff, numbers: { ...b.numbers, ...a.numbers },
  };
}

/** the words of a sentence: folded, number words as digits ("Kind eins" = "Kind 1") */
export function tokens(text, lang = 'de') {
  const nums = wordsOf(lang).numbers;
  return fold(text).split(' ').filter(Boolean).map((w) => nums[w] || w);
}

/** two words are the same: equal, or (both 4 letters or more) one starts with the other and they differ by at most 3 letters
 *  ("küche" / "küchen", "fenster" / "fenstern"; not "bad" / "badezimmer") */
export function sameWord(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 3) return false;
  return a.startsWith(b) || b.startsWith(a);
}

/** where phrase (folded words) stands in the words ws, not on a used word: [{ at, len }] (len: how many words of ws). Also written
 *  together or apart ("Kinderzimmer" / "Kinder Zimmer") */
export function findPhrase(ws, phrase, used = []) {
  const p = phrase.filter(Boolean), out = [];
  if (!p.length) return out;
  const joined = p.join('');
  for (let i = 0; i < ws.length; i++) {
    if (used[i]) continue;
    if (i + p.length <= ws.length && p.every((w, j) => !used[i + j] && sameWord(ws[i + j], w))) { out.push({ at: i, len: p.length }); continue; }
    for (let n = 1; n <= 3 && i + n <= ws.length; n++) {        // written together or apart
      if (n === p.length) continue;
      const slice = ws.slice(i, i + n);
      if (slice.some((_, j) => used[i + j])) break;
      if (sameWord(slice.join(''), joined)) { out.push({ at: i, len: n }); break; }
    }
  }
  return out;
}

/** the code words that count for user (Home Assistant user name: those of everybody and the user's own), longest first */
export function aliasesFor(aliases, user) {
  const me = String(user || '').trim().toLowerCase();
  return (Array.isArray(aliases) ? aliases : []).filter((a) => a && a.say && (!a.user || a.user.trim().toLowerCase() === me))
    .sort((p, q) => fold(q.say).length - fold(p.say).length || Number(!!q.user) - Number(!!p.user));
}

/** the floor a generic word means (ground, upper, basement, attic) among floors [{ id, kind }] in their order (basement first) */
export function floorByWord(floors, word) {
  const g = Math.max(0, floors.findIndex((f) => f.kind !== 'basement'));
  if (!floors.length) return null;
  if (word === 'ground') return floors[g];
  if (word === 'upper') return floors[g + 1] || null;
  if (word === 'basement') return g > 0 ? floors[g - 1] : null;
  if (word === 'attic') return [...floors].reverse().find((f, i) => floors.length - 1 - i > g) || null;
  return null;
}

/** the words of a name without little words and floor words ("Haus Eltern" -> "Eltern", "Bad OG" -> "Bad"): a second way to find it */
function coreOf(words, W) {
  const drop = new Set([...W.stop, ...Object.values(W.floor).flat()]);
  const core = words.filter((w) => !drop.has(w));
  return core.length && core.length < words.length ? core : null;
}
/** the best place of list (items with `words`) said in ws: the longest phrase, then the longest name; { x, m } or null. Each item's
 *  whole name first, its core (coreOf) only when no whole name was found */
function bestOf(list, ws, used, W, keep = () => true) {
  for (const key of ['words', 'core']) {
    const hits = list.filter((x) => x[key]).map((x) => ({ x, m: findPhrase(ws, x[key], used)[0] })).filter((h) => h.m && keep(h.x));
    if (!hits.length) continue;
    const score = (h) => h.m.len * 100 + h.x[key].join('').length, best = Math.max(...hits.map(score));
    return hits.filter((h) => score(h) === best);
  }
  return [];
}
/** "Küchenfenster" -> "kuchen fenster", "Wohnzimmerlicht" -> "wohnzimmer licht": a word that ends with a thing (5 letters or more) is
 *  split, unless it is a word of a name (keep) */
function splitThings(ws, W, keep) {
  const things = Object.values(W.what).flat().filter((v) => v.length >= 5);
  return ws.flatMap((w) => {
    if (keep.has(w) || things.includes(w)) return [w];
    const v = things.filter((x) => w.length - x.length >= 3 && w.endsWith(x)).sort((p, q) => q.length - p.length)[0];
    return v ? [w.slice(0, -v.length), v] : [w];
  });
}
/** the states a thing can be in: a little word ("Licht auf der Terrasse") only counts as a state that fits */
const STATES_OF = { windows: ['open', 'closed'], doors: ['open', 'closed'], gates: ['open', 'closed'], covers: ['open', 'closed'], locks: ['open', 'closed'],
  lights: ['on', 'off'], media: ['on', 'off'], heating: ['on', 'off'], battery: ['low'] };
/** words that ask about a lock ("abgeschlossen"): the thing is the lock, not the door */
const LOCK_WORDS = new Set(['abgeschlossen', 'aufgeschlossen', 'unverschlossen', 'verschlossen', 'zugesperrt', 'verriegelt', 'locked', 'unlocked',
  'verrouillee', 'deverrouillee']);

/**
 * Understand a sentence. env: { lang, house (the open house's id), floor (the open floor's id), user, aliases (settings.voice.aliases),
 * houses: [{ id, name }], floors: [{ house, id, name, kind }] (in their order per house), rooms: [{ house, floor, id, name }] }.
 * -> { text, house (id of another house or null), floor (id or null), rooms: [id], place: the names of the place found, alias (a code
 *    word was used), what (WHATS or null), state ('open' | 'closed' | 'on' | 'off' | 'low' | null), all ("alle"), rest (the words left:
 *    a name to look for), known (something of it was understood) }
 */
export function understand(text, env = {}) {
  const lang = WORDS[env.lang] ? env.lang : 'de', W = wordsOf(lang);
  const houses = env.houses || [], floors = env.floors || [], rooms = env.rooms || [];
  const aliases = aliasesFor(env.aliases, env.user).map((a) => ({ a, words: tokens(a.say, lang) }));
  const named = (list) => list.filter((x) => x.name).map((x) => { const words = tokens(x.name, lang); return { ...x, words, core: coreOf(words, W) }; });
  const H = named(houses), F = named(floors), R = named(rooms);
  const keep = new Set([...aliases, ...H, ...F, ...R].flatMap((x) => x.words));
  const ws = splitThings(tokens(text, lang), W, keep), used = ws.map(() => false);
  const take = (m) => { for (let j = 0; j < m.len; j++) used[m.at + j] = true; };
  const out = { text: String(text || '').trim(), house: null, floor: null, rooms: [], place: [], alias: false, what: null, state: null, all: false, rest: '', known: false };
  /* 1. a code word: the longest one said */
  for (const { a, words } of aliases) {
    const m = findPhrase(ws, words, used)[0];
    if (!m) continue;
    take(m); out.alias = true; out.place.push(a.say);
    if (a.house && houses.some((h) => h.id === a.house)) out.house = a.house;
    if (a.floor && floors.some((f) => f.id === a.floor)) out.floor = a.floor;
    const rs = (a.rooms || []).filter((id) => rooms.some((r) => r.id === id));
    if (rs.length) { out.rooms = rs; out.house ||= rooms.find((r) => r.id === rs[0]).house; }
    if (out.floor && !out.house) out.house = floors.find((f) => f.id === out.floor).house;
    break;
  }
  /* 2. another house by its name ("bei den Eltern" finds the house "Haus Eltern") */
  if (!out.house) {
    const hit = bestOf(H, ws, used, W, (h) => h.id !== env.house)[0];
    if (hit) { take(hit.m); out.house = hit.x.id; out.place.push(hit.x.name); }
  }
  const houseId = out.house || env.house;
  /* 3. a floor: by its name, else by a generic word ("oben", "Keller") */
  if (!out.floor && !out.rooms.length) {
    const own = F.filter((f) => f.house === houseId);
    const hit = bestOf(own.map((f) => ({ ...f, core: null })), ws, used, W)[0];
    if (hit) { take(hit.m); out.floor = hit.x.id; out.place.push(hit.x.name); }
    else {
      for (const [word, list] of Object.entries(W.floor)) {
        const m = list.map((w) => findPhrase(ws, tokens(w, lang), used)[0]).find(Boolean);
        const f = m && floorByWord(own, word);
        if (f) { take(m); out.floor = f.id; out.place.push(f.name || ws.slice(m.at, m.at + m.len).join(' ')); break; }
      }
    }
  }
  /* 4. a room by its name: in the house and on the floor said, else this house first; the same name on several floors: all of them */
  if (!out.rooms.length) {
    let top = bestOf(R, ws, used, W, (r) => (!out.house || r.house === out.house) && (!out.floor || r.floor === out.floor));
    if (top.some((h) => h.x.house === houseId)) top = top.filter((h) => h.x.house === houseId);
    if (top.length) {
      top.sort((p, q) => Number(q.x.floor === env.floor) - Number(p.x.floor === env.floor));
      take(top[0].m);
      out.rooms = top.map((h) => h.x.id);
      out.place = out.place.filter((p) => !F.some((f) => f.id === out.floor && f.name === p));   // "Bad OG", not "Obergeschoss · Bad OG"
      out.place.push(top[0].x.name);
      if (top[0].x.house !== env.house) out.house = top[0].x.house;
    }
  }
  if (out.house === env.house) out.house = null;
  /* 5. what, the state, "alle"; the rest is a name */
  const free = () => ws.map((w, i) => (used[i] ? null : { w, i })).filter(Boolean);
  if (free().some((x) => LOCK_WORDS.has(x.w))) out.what = 'locks';
  for (const k of out.what ? [] : WHATS) {
    const hit = free().find((x) => W.what[k]?.some((v) => sameWord(x.w, v)));
    if (hit) { out.what = k; used[hit.i] = true; break; }
  }
  const stop = new Set(W.stop);
  for (const [k, list] of Object.entries(W.state)) {
    const hit = free().find((x) => list.sure.includes(x.w));
    if (hit) { out.state = k; used[hit.i] = true; break; }
  }
  if (!out.state) {                     // "an", "auf", "zu", "aus", "on", "off": at the end, or before a little word or the place ("on in the kitchen")
    const endOf = (w) => Object.keys(W.state).find((k) => W.state[k].end.includes(w));
    const hit = free().filter((x) => endOf(x.w) && (x.i === ws.length - 1 || used[x.i + 1] || stop.has(ws[x.i + 1])))
      .map((x) => ({ ...x, k: endOf(x.w) }))
      .filter((x) => !(x.k === 'off' && ws.some((w) => W.notOff.includes(w))) && (!out.what || !STATES_OF[out.what] || STATES_OF[out.what].includes(x.k)))
      .pop();
    if (hit) { out.state = hit.k; used[hit.i] = true; }
  }
  const all = free().find((x) => W.all.includes(x.w));
  if (all) { out.all = true; used[all.i] = true; }
  out.rest = free().map((x) => x.w).filter((w) => !stop.has(w) && w.length > 1).join(' ');
  out.place = out.place.join(' · ');
  out.known = !!(out.what || out.state || out.rooms.length || out.floor || out.house || out.alias);
  return out;
}

/** a question worth an answer rather than the plain name search: it asks for things or a state, or uses a code word or another house */
export const isQuestion = (q) => !!(q && (q.what || q.state || q.alias || q.house));

/* ---- the answer: the things of the plan that fit ---- */

const domain = (e) => String(e || '').split('.')[0];
/** does item it (flatRows) belong to what? */
export function isWhat(it, what) {
  const d = domain(it.entity);
  switch (what) {
    case 'windows': return it.kind === 'opening' && it.type !== 'door';
    case 'doors': return it.kind === 'opening' && it.type === 'door' && !it.gate;
    case 'gates': return (it.kind === 'opening' && !!it.gate) || (it.kind === 'device' && d === 'cover' && /garage|gate|tor/.test(String(it.entity)));
    case 'lights': return it.kind === 'device' && d === 'light';
    case 'covers': return !!it.shutter || (it.kind === 'device' && d === 'cover');
    case 'locks': return d === 'lock';
    case 'media': return d === 'media_player';
    case 'heating': return d === 'climate' || d === 'water_heater';
    case 'battery': return !!it.battery;
    case 'offline': return !!it.off;
    default: return true;
  }
}
/** the state of item it as asked: 'open' | 'closed' | 'on' | 'off' | null (not known) */
export function stateOf(it, states = {}, what = null) {
  if (it.off) return null;
  const st = (e) => states[e]?.state;
  if (what === 'covers' && (it.shutter || domain(it.entity) === 'cover')) {
    const s = st(it.shutter || it.entity);
    return ['open', 'opening'].includes(s) ? 'open' : ['closed', 'closing'].includes(s) ? 'closed' : null;
  }
  if (domain(it.entity) === 'lock') {
    const s = st(it.entity);
    return ['unlocked', 'open', 'opening', 'unlocking'].includes(s) ? 'open' : ['locked', 'locking'].includes(s) ? 'closed' : null;
  }
  if (it.kind === 'opening') return it.contact === false ? null : it.on ? 'open' : it.value && !String(it.value).startsWith('—') ? 'closed' : null;
  return it.on ? 'on' : st(it.entity) ? 'off' : null;
}
const OPPOSITE = { open: 'closed', closed: 'open', on: 'off', off: 'on' };
/** the state a question means when none was said: open doors and windows, lights and players on (in a room: all of them), low batteries */
export function defaultState(what, place) {
  if (what === 'battery') return 'low';
  if (place) return null;
  if (['windows', 'doors', 'gates'].includes(what)) return 'open';
  if (['lights', 'media'].includes(what)) return 'on';
  return null;
}
/** an open / on state for "is ... closed / off" with "alle": the ones that are not (#509: "Sind alle Fenster zu?" lists the open ones) */
const checkState = (state, all) => (all && (state === 'closed' || state === 'off') ? OPPOSITE[state] : null);

/** the overview of devicelist.js (deviceRows) as one list: every thing with its floor index and room id / name */
export function flatRows(floors) {
  return (floors || []).flatMap((f) => f.rooms.flatMap((r) => r.items.map((it) => ({ ...it, room: r.id ?? '', roomName: r.none ? '' : r.name }))));
}

/** the things of list whose name has words of the rest (words of 4 letters or more): those with the most of them */
export function byName(list, rest) {
  const rw = String(rest || '').split(' ').filter((w) => w.length >= 4);
  if (!rw.length) return [];
  const hits = (name) => { const nw = fold(name).split(' '); return rw.filter((w) => nw.some((n) => sameWord(n, w) || (w.length >= 4 && n.includes(w)))).length; };
  const scored = list.map((it) => ({ it, s: hits(it.name) })).filter((x) => x.s > 0);
  const best = Math.max(0, ...scored.map((x) => x.s));
  return scored.filter((x) => x.s === best).map((x) => x.it);
}

const NOTHING = { items: [], what: null, state: null, check: false, named: false, n: 0 };
/**
 * What to show for question q (understand) among items (flatRows of the house shown); place: { floor: index or null, rooms: [id] }.
 * -> { mode, items, what, state, check, named, n }:
 *   'list'    things that fit, the asked ones first (items); n = how many are in the asked state (state: the one asked or meant;
 *             check: "alle zu?" was asked, the list holds the ones that are not; named: things asked for by their name, shown in any state,
 *             like those of a room asked about: "Ist im Bad das Fenster offen?" shows the shut one too)
 *   'reading' a reading (temp, humid, co2: what) of the room(s) or of the house
 *   'rooms' / 'floor' / 'house' only a place was said
 *   'find'    nothing known: look for the rest as a name (search.js)
 *   'none'    nothing at all
 */
export function answer(q, items, states = {}, place = {}) {
  const rooms = new Set(place.rooms || []);
  const here = (items || []).filter((it) => (place.floor == null || it.floor === place.floor) && (!rooms.size || rooms.has(it.room)));
  if (READINGS.includes(q.what)) return { ...NOTHING, mode: 'reading', what: q.what };
  const what = q.what || (q.state ? 'devices' : null);
  if (what) {
    let pool = here.filter((it) => isWhat(it, what));
    const byRest = byName(pool, q.rest), named = byRest.length > 0;
    if (named) pool = byRest;
    let state = q.state || (named ? null : defaultState(what, place.floor != null || rooms.size > 0));
    if (what === 'devices' && !state && !named) state = 'on';
    const check = !named && !!checkState(state, q.all);
    if (check) state = checkState(state, q.all);
    const same = what === 'devices' ? { on: ['on', 'open'], off: ['off', 'closed'] }[state] || [state] : [state];   // "Was ist alles an?": open windows too
    const is = (it) => (state === 'low' ? !!it.battery?.low : same.includes(stateOf(it, states, what)));
    const fits = state ? pool.filter(is) : pool;
    const all = named || !state || (rooms.size > 0 && !check);       // asked by name, or about one room: show them all, the asked ones first
    const list = (all ? pool : fits).slice().sort((a, b) => Number(is(b)) - Number(is(a)) || b.floor - a.floor
      || String(a.roomName).localeCompare(String(b.roomName)) || String(a.name).localeCompare(String(b.name)));
    return { mode: 'list', items: list, what, state, check, named, n: fits.length };
  }
  if (rooms.size) return { ...NOTHING, mode: 'rooms', n: rooms.size };
  if (place.floor != null) return { ...NOTHING, mode: 'floor' };
  if (q.house) return { ...NOTHING, mode: 'house' };
  if (q.rest) return { ...NOTHING, mode: 'find' };
  return { ...NOTHING, mode: 'none' };
}

/** the head line of an answer: "🪟 Fenster · offen: 2", "✓ Fenster: alle zu", "🪟 Fenster · offen: keine"; place: the place as said */
export function headline(a, t, place = '') {
  const where = place ? ` (${place})` : '';
  if (a.mode !== 'list') return '';
  const what = t(`vq.w.${a.what}`), icon = ICONS[a.what] || '📋';
  if (a.check && !a.n) return `✓ ${t('vq.allOk', { what, state: t(`vq.s.${OPPOSITE[a.state]}`) })}${where}`;
  if (!a.state) return `${icon} ${what}: ${a.n}${where}`;
  return `${icon} ${what} · ${t(`vq.s.${a.state}`)}: ${a.n || t('vq.none')}${where}`;
}

/** the code words as kept in the settings (the server does the same: voice.clean_voice): { engine, aliases: [{ say, house, floor, rooms,
 *  user }] }, at most MAX_ALIASES, a code word without a place dropped */
export function cleanVoice(v) {
  const src = v && typeof v === 'object' ? v : {};
  const str = (x, n) => (typeof x === 'string' ? x.trim().slice(0, n) : '');
  const aliases = (Array.isArray(src.aliases) ? src.aliases : []).filter((a) => a && typeof a === 'object').map((a) => ({
    say: str(a.say, 60), house: str(a.house, 40), floor: str(a.floor, 80),
    rooms: [...new Set((Array.isArray(a.rooms) ? a.rooms : []).filter((r) => typeof r === 'string' && r && r.length <= 80))].slice(0, 20),
    user: str(a.user, 80),
  })).filter((a) => a.say && (a.house || a.floor || a.rooms.length)).slice(0, MAX_ALIASES);
  return { engine: ENGINES.includes(src.engine) ? src.engine : 'auto', aliases };
}

/** the BCP-47 language of the browser's recognition for the add-on's language */
export const SPEECH_LANG = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', nl: 'nl-NL', pl: 'pl-PL' };

/** which recognition to use: 'browser' | 'assist' | null. engine: the setting; can: { browser (the browser has one), assist (Home Assistant
 *  has a pipeline with speech-to-text), mic (the page may use the microphone: a secure page with getUserMedia) } */
export function pickEngine(engine, can) {
  if (engine === 'off') return null;
  const browser = !!can.browser, assist = !!can.assist && !!can.mic;
  if (engine === 'browser') return browser ? 'browser' : null;
  if (engine === 'assist') return assist ? 'assist' : null;
  return browser ? 'browser' : assist ? 'assist' : null;
}
