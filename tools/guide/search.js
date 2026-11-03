/* 🎬 The search of the video guide. make_guide.py --site puts this file into the page (index.html, from page.html), so the page
 * stays one file that also works without internet (the add-on's saved copy). Pure: no page, no DOM (tests/guidesearch.test.mjs,
 * tests/test_guide_search.py).
 *
 * The owner, 2026-11-03: "dass man die besser findet, wenn man oben was sucht … wenn Leute ein anderes Wort verwenden als es ist,
 * dass dann trotzdem das richtige Video kommt". A clip is found by its title, its description, its search words (keys in the clip,
 * more in tools/guide/tags.py), the names of its features (tools/guide/features.py) and every step, in both languages. A word of
 * the search also finds
 *   - other forms of it: Lampe, Lampen; heizen, Heizung; Tür, Tuer; lights, light;
 *   - words with the same meaning: Rollo finds Rollladen (the groups SYN in tools/guide/tags.py);
 *   - long words it is part of (Kontakt: Fensterkontakt), and the parts of a long word typed (Deckenlampe: Lampe);
 *   - small typing mistakes (Heizng: Heizung, Jalosie: Jalousie).
 * Little words (wie, ich, kann, mein, the, how …) are left out. The clips with every word come first; if no clip has every word, the
 * ones with the most words ("partial"), and below a short list the ones with one word less ("more").
 */
(function (root) {
  'use strict';

  // ä → a, Ä → a, ae → a (so "Tuer" finds "Tür"), ß → ss, CO₂ → co2
  function fold(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss').replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  }

  const STOP = new Set(fold(`
    ich du er sie es wir ihr man mein meine meinen meinem meiner meines dein deine mich mir dich dir sich uns euch
    der die das den dem des ein eine einen einem einer eines kein keine keinen
    und oder aber mit ohne von vom zu zum zur im in ins am an auf aus für bei beim nach über unter vor als um bis durch gegen
    wie was wo wohin woher wer wen wem wann warum wieso weshalb welche welcher welches welchen
    kann kannst können konnte könnte will willst wollen möchte möchten mag muss musst müssen soll sollte sollen darf dürfen
    ist sind war bin bist hat habe hast haben wird werden würde mache machst machen macht tun tut geht gehts gibt lassen lässt
    hier da dort dann denn doch so auch noch nur mal bitte etwas was ja nein nicht nichts sehr ganz einfach jetzt schon immer
    dieser diese dieses diesen irgendwie eigentlich gerne hallo hilfe funktioniert funktion anzeigen zeigen
    i me my mine you your we our it its a an the to of for in on at by with from into and or but
    how what where when which who whom why can could do does did done make makes is are was be been have has had get
    set use using want need please this that these those there here some any so just also not no very
  `).split(/\s+/).filter(Boolean));

  // a long enough word without its ending: lampen, lampe, lamps → lamp; heizen → heiz (finds Heizung); fenstern → fenst
  const ENDS = ['ern', 'en', 'er', 'es', 'em', 'e', 'n', 's', 'ing', 'ed'];
  function stem(w) {
    if (w.length < 5 || /\d/.test(w)) return w;
    for (const e of ENDS) if (w.endsWith(e) && w.length - e.length >= 4) return w.slice(0, -e.length);
    return w;
  }

  // the words of a text, folded; a word with a hyphen also as one word (Dreh-Kipp → dreh, kipp, drehkipp)
  function tokens(text) {
    const f = fold(text), out = f.split(/[^a-z0-9]+/).filter(Boolean);
    for (const m of f.match(/[a-z0-9]+(?:-[a-z0-9]+)+/g) || []) out.push(m.replace(/-/g, ''));
    return out;
  }

  // how many letters differ (a swap of two counts once); stops early above max
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const n = a.length, m = b.length;
    let pp = null, p = Array.from({ length: m + 1 }, (_, j) => j);
    for (let i = 1; i <= n; i++) {
      const c = [i];
      let low = i;
      for (let j = 1; j <= m; j++) {
        let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, pp[j - 2] + 1);
        c.push(v);
        if (v < low) low = v;
      }
      if (low > max) return max + 1;
      pp = p; p = c;
    }
    return p[m];
  }

  // how well a word of the search (alt, its stem st) fits a word of a clip (t, its stem ts): 0 … 1.
  // own: 0 a word with the same meaning or a corrected one: the start of a longer word only when it is long enough ("ai" ≠ air);
  // 1 the word as typed (may be the start of a word: "lam" finds Lampe); 2 the same, and no clip has the word: its parts count too;
  // 3 a short word as typed that a clip has as it is: only that word ("Tür" ≠ turn)
  function fit(alt, st, t, ts, own) {
    if (t === alt) return 1;
    if (ts === st) return 0.92;                                                // lampen → lampe
    if ((!own && alt.length < 4) || own === 3) return 0;
    if (t.startsWith(st)) return 0.85;                                         // lamp → lampe, licht → lichter
    if (st.length >= 4 && t.includes(st)) return 0.7;                          // kontakt → fensterkontakt
    if (own === 2 && t.length >= 4 && alt.includes(t)) return 0.5;             // deckenlampe → lampe, decke (no clip has the word)
    return 0;
  }

  // where a word counts, and how much: the title most, the steps least, the other language less
  const W = { title: 10, titleO: 4, keys: 6, tags: 6, tagsO: 5, feat: 5, featO: 2, desc: 4, descO: 1.5, step: 2, stepO: 0.5 };
  const SYN_W = 0.8, FIX_W = 0.75, SHOW = 0.6, PAIR = 4, LOW = 0.1;   // LOW: a clip far below the best is left out

  /** clips: [{ id, title: {de, en}, desc: {de, en}, keys, tags: {de, en}, feat: {de: [], en: []}, steps: [{de, en}] }],
   *  syn: [[word, word …], …] (words with the same meaning) */
  function index(clips, syn) {
    const vocab = new Map(), orig = new Map();
    const add = (text, keep) => {
      const ts = tokens(text);
      for (const t of ts) if (!vocab.has(t)) vocab.set(t, stem(t));
      if (keep) {                                                              // how it is written (a capital letter if it has one)
        for (const w of String(text || '').match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) || []) {
          const f = fold(w).replace(/-/g, ''), o = orig.get(f);
          if (!o || (o === o.toLowerCase() && w !== w.toLowerCase())) orig.set(f, w);
        }
      }
      return ts;
    };
    const two = (o, keep) => ({ de: add(o && o.de, keep), en: add(o && o.en, keep) });
    const items = (clips || []).map((c) => {
      const feat = { de: (c.feat && c.feat.de || []).join(' · '), en: (c.feat && c.feat.en || []).join(' · ') };
      const pairs = new Set();                                                 // two words in a row ("zu Hause", "turned on")
      for (const x of [c.title, c.desc, c.tags, feat]) for (const l of ['de', 'en']) addPairs(pairs, x && x[l]);
      addPairs(pairs, c.keys);
      return { id: c.id, title: two(c.title, true), desc: two(c.desc), keys: add(c.keys, true), tags: two(c.tags, true), feat: two(feat, true),
        steps: (c.steps || []).map((x) => two(x)), pairs };
    });
    const groups = (syn || []).map((g) => g.map(fold).filter(Boolean));
    for (const g of groups) for (const t of g) if (!vocab.has(t)) vocab.set(t, stem(t));
    return { items, vocab, orig, groups };
  }

  function addPairs(set, text) {
    const w = fold(text).split(/[^a-z0-9]+/).filter(Boolean);
    for (let i = 1; i < w.length; i++) set.add(w[i - 1] + ' ' + w[i]);
  }

  /** the words of a search: folded, without little words, at least 2 letters */
  function words(q) {
    const ws = [...new Set(fold(q).split(/[^a-z0-9]+/).filter((w) => w.length > 1))];
    return ws.filter((w) => !STOP.has(w));                                   // only little words ("wie kann ich"): still typing
  }

  // the words of the clips that a word of the search finds, each with how well (synonyms and corrected typing mistakes a bit less)
  function lookup(idx, w) {
    const sw = stem(w), alts = new Map([[w, 1]]);
    let fix = null;
    let direct = false;
    for (const [t, ts] of idx.vocab) if (fit(w, sw, t, ts, 1) >= 0.85) { direct = true; break; }
    const bases = [w];
    if (!direct && w.length >= 4) {                                            // a typing mistake? the closest words
      const k = w.length >= 8 ? 2 : 1, near = [];
      for (const t of idx.vocab.keys()) {
        if (t.length < 3) continue;
        let d = dist(w, t, k);
        if (d > k && w.length >= 5 && t.length > w.length) d = dist(w, t.slice(0, w.length), 1) <= 1 ? k : k + 1;
        if (d <= k) near.push([d, t]);
      }
      near.sort((a, b) => a[0] - b[0] || a[1].length - b[1].length);
      for (const [, t] of near.slice(0, 3)) { if (!alts.has(t)) alts.set(t, FIX_W); bases.push(t); }
      if (near.length) fix = near[0][1];
    }
    for (const b of bases) {                                                   // words with the same meaning
      const sb = stem(b);
      for (const g of idx.groups) {
        if (!g.some((m) => m === b || stem(m) === sb || (b.length >= 4 && m.startsWith(b))
          || (!direct && m.length >= 4 && b.length > m.length + 2 && (b.endsWith(m) || b.endsWith(stem(m)))))) continue;   // Deckenleuchte → Leuchte
        for (const m of g) if (!alts.has(m) || alts.get(m) < SYN_W) alts.set(m, SYN_W);
      }
    }
    const mine = !direct ? 2 : w.length <= 3 && idx.vocab.has(w) ? 3 : 1;
    const q = new Map(), list = [...alts].map(([a, wt]) => [a, stem(a), wt, a === w ? mine : 0]);
    for (const [t, ts] of idx.vocab) {
      let b = 0;
      for (const [a, sa, wt, own] of list) {
        const v = fit(a, sa, t, ts, own) * wt;
        if (v > b) b = v;
      }
      if (b > 0) q.set(t, b);
    }
    return { q, fix };
  }

  function best(ts, q) { let b = 0; for (const t of ts) { const v = q.get(t); if (v > b) b = v; } return b; }

  /** search: { words, fixed: {word: correction}, list: [{ id, s, n, steps: [i …], via: [tag word …] }], partial, more: […], hit: Set }
   *  list: the clips with the most words (all of them if any clip has all); hit: the folded words to mark in the texts */
  function search(idx, query, lang) {
    const ws = words(query), L = lang === 'en' ? 'en' : 'de', O = L === 'de' ? 'en' : 'de';
    if (!ws.length) return { words: [], fixed: {}, list: idx.items.map((it) => ({ id: it.id, s: 1, n: 0, steps: [], via: [] })), partial: false, more: [], hit: new Set() };
    const looks = ws.map((w) => lookup(idx, w)), fixed = {}, hit = new Set(), qp = new Set();
    addPairs(qp, query);
    ws.forEach((w, i) => { if (looks[i].fix) fixed[w] = idx.orig.get(looks[i].fix) || looks[i].fix; for (const [t, v] of looks[i].q) if (v >= SHOW) hit.add(t); });
    const res = idx.items.map((it) => {
      let s = 0, n = 0;
      const steps = new Set(), via = [];
      for (const { q } of looks) {
        const top = best(it.title[L], q), desc = best(it.desc[L], q);
        let ws_ = W.title * top + W.titleO * best(it.title[O], q) + W.keys * best(it.keys, q) + W.tags * best(it.tags[L], q)
          + W.tagsO * best(it.tags[O], q) + W.feat * best(it.feat[L], q) + W.featO * best(it.feat[O], q) + W.desc * desc + W.descO * best(it.desc[O], q);
        let st = 0;
        it.steps.forEach((x, k) => { const v = best(x[L], q); if (v >= SHOW) steps.add(k); st += v; });
        ws_ += W.step * Math.min(st, 3) + W.stepO * Math.min(it.steps.reduce((a, x) => a + best(x[O], q), 0), 3);
        if (ws_ > 0) { n++; s += ws_; }
        if (ws_ > 0 && top < SHOW && desc < SHOW) {                            // found only by a search word: say which
          let bw = null, bv = SHOW - 1e-9;
          for (const t of [...it.keys, ...it.tags[L], ...it.tags[O], ...it.feat[L]]) { const v = q.get(t) || 0; if (v > bv) { bv = v; bw = t; } }
          if (bw && !via.includes(bw)) via.push(bw);
        }
      }
      let pairs = 0;                                                           // the words in a row as in the clip: it fits better,
      if (n) for (const p of qp) if (it.pairs.has(p)) pairs++;                 // the more the much better
      s += PAIR * pairs ** 1.5;
      return { id: it.id, s, n, steps: [...steps].sort((a, b) => a - b), via: via.map((t) => idx.orig.get(t) || t) };
    }).filter((r) => r.n > 0).sort((a, b) => b.n - a.n || b.s - a.s);
    const top = res.length ? res[0].n : 0;
    const list = res.filter((r) => r.n === top && r.s >= res[0].s * LOW);
    const more = top >= 2 && list.length < 6 ? res.filter((r) => r.n === top - 1 && r.s >= res[0].s * LOW * 2).slice(0, 6 - list.length) : [];
    return { words: ws, fixed, list, partial: top > 0 && top < ws.length, more, hit };
  }

  /** where to put <mark> in a text: [start, end] of every word the search found */
  function ranges(text, hit) {
    const out = [];
    if (!hit || !hit.size) return out;
    for (const m of String(text || '').matchAll(/[\p{L}\p{N}]+/gu)) if (hit.has(fold(m[0]))) out.push([m.index, m.index + m[0].length]);
    return out;
  }

  const api = { fold, stem, tokens, dist, words, index, search, ranges, STOP };
  root.GuideSearch = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
