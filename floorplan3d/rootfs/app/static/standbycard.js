/* 🔌 Stromfresser, the card of the page ⚡ Energie (the owner's choice 2026-11-19, picture docs/ideen-5.15/06): what the house draws
 * while everybody sleeps (2–5 o'clock, the last 14 nights), in W and € a year, the devices of the energy dashboard that draw most at
 * night, and "⏰ Nachts abschalten …": opens a ready routine (▶ Abläufe) that switches their plugs off at 1:00 and on at 6:00, to look at
 * and save. Asks api/energy/stats (hourly, 14 days) at most every 30 minutes; the rules are in standby.js (tested). */
import { nightSpan, nightLoad, perYear, savedPerYear, switchable, nightFlow, barParts, OFF, ON } from './standby.js';
import { isoLocal, meterIds } from './energyhistory.js';
import { fmtWatts } from './powerlogic.js';

const AGAIN = 30 * 60 * 1000;

/** ctx: t, lang(), nameOf(entity), canEdit(), editFlow(flow) (the routine's editor on ▶ Abläufe) */
export function initStandbyCard(ctx) {
  const { t } = ctx;
  const cache = new Map();                          // key -> { at, load, sig }
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const eur = (v) => `${Math.round(v).toLocaleString(ctx.lang() || 'de')} €`;

  async function ask(c) {
    const ids = meterIds(c.meters, c.devices), span = nightSpan(new Date());
    const sig = `${ids.join()}|${+span.end}`, hit = cache.get(sig);
    if (hit && Date.now() - hit.at < AGAIN) return hit.load;
    const r = await fetch('api/energy/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, start: isoLocal(span.start), end: isoLocal(span.end), period: 'hour' }) });
    if (!r.ok) throw new Error(String(r.status));
    const load = nightLoad((await r.json()).stats || {}, c.meters, c.devices, span.buckets);
    if (cache.size > 20) cache.clear();
    cache.set(sig, { at: Date.now(), load });
    return load;
  }

  function draw(card, load, c) {
    const name = (d) => d.name || ctx.nameOf?.(d.id) || d.id;
    card.replaceChildren(make('h3', 'peH', `🔌 ${t('hog.title')}`));
    if (load.watts == null) { card.append(make('div', 'tpSub', t('hog.none'))); return; }
    card.append(make('div', 'tpSub', t('hog.sub', { n: load.nights })));
    const big = make('div', 'hogBig', fmtWatts(load.watts));
    const year = perYear(load.watts, c.price?.buy);
    if (year != null) big.append(make('span', 'hogYear', t('hog.year', { v: eur(year) })));
    card.append(big);
    const parts = barParts(load);
    if (parts && load.devices.length) {
      const bar = make('div', 'hogBar');
      [['standby', parts.standby], ['always', parts.always], ['rest', parts.rest]].forEach(([k, p]) => { if (p > 0) { const i = make('i', `hog_${k}`); i.style.width = `${p}%`; bar.append(i); } });
      const legend = make('div', 'hogLegend');
      ['standby', 'always', 'rest'].forEach((k) => { const s = make('span'); s.append(make('i', `hog_${k}`), document.createTextNode(t(`hog.leg.${k}`))); legend.append(s); });
      card.append(bar, legend);
    }
    load.devices.slice(0, 6).forEach((d) => {
      const row = make('div', `hogRow${d.always ? ' always' : ''}`);
      row.dataset.id = d.id;
      const y = perYear(d.w, c.price?.buy);
      row.append(make('span', 'hogName', name(d)), make('span', 'hogTag', d.always ? t('hog.always') : ''), make('b', '', `${fmtWatts(d.w)}${y != null ? ` · ${eur(y)}` : ''}`));
      card.append(row);
    });
    if (!c.devices.length) { card.append(make('div', 'tpSub hogTip', `💡 ${t('hog.noDevices')}`)); return; }
    const off = switchable(load, c.plugs);
    if (!off.length) { card.append(make('div', 'tpSub hogTip', `💡 ${t(load.devices.some((d) => !d.always) ? 'hog.noPlugs' : 'hog.allGood')}`)); return; }
    const w = off.reduce((s, d) => s + d.w, 0), save = savedPerYear(w, c.price?.buy);
    card.append(make('div', 'tpSub hogTip', `💡 ${t(save != null ? 'hog.tip' : 'hog.tipNoPrice', { list: off.map(name).join(', '), from: OFF, to: ON, v: save != null ? eur(save) : '', w: fmtWatts(w) })}`));
    if (ctx.canEdit()) {
      const b = make('button', 'bdBtn primary', `⏰ ${t('hog.off')}`);
      b.type = 'button'; b.dataset.act = 'standbyOff';
      b.addEventListener('click', () => ctx.editFlow(nightFlow(off.map((d) => d.plug), t('hog.flowName'))));
      card.append(b);
    }
  }

  /** the card's item for the board of the page: c = what the page counts with ({ meters, devices, price, plugs }) */
  function item(c) {
    const card = make('div', 'tpCard hogCard');
    card.append(make('h3', 'peH', `🔌 ${t('hog.title')}`), make('div', 'tpSub', '…'));
    ask(c).then((load) => draw(card, load, c), () => card.replaceChildren(make('h3', 'peH', `🔌 ${t('hog.title')}`), make('div', 'tpSub', t('pe.noHa'))));
    return { key: 'standby', el: card, width: 1, name: t('hog.title') };
  }
  return { item };
}
