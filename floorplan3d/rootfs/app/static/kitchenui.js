/* Kitchen run (#124): the properties of a selected run: shape, depth, wall cabinets and every module of every leg (type, width, order).
 * The geometry (and its tests) is in kitchen.js. */
import { MOD_TYPES, MAX_MODS, cleanLegs, legLength, modType, modW, withType, withWidth, MIN_MOD_W } from './kitchen.js';

/** ctx: t, changed(), snapshot(), renderProps(), field(label, input), lenInput(get, set, opts), toDisp(m), imperial(); returns kitchenProps(body, device) */
export function initKitchenUi(ctx) {
  const { t } = ctx;
  return function kitchenProps(body, it) {
    const head = document.createElement('h4'); head.id = 'kitchenHead'; head.textContent = t('kitchen.title'); body.append(head);
    const legs = it.legs = cleanLegs(it.legs);
    const apply = () => { ctx.changed(); ctx.renderProps(); };
    const shape = document.createElement('select'); shape.id = 'kitchenShape';
    [1, 2, 3].forEach((n) => shape.add(new Option(t(`kitchen.shape${n}`), n)));
    shape.value = String(legs.length);
    shape.addEventListener('change', () => {
      ctx.snapshot();
      const n = +shape.value;
      while (legs.length > n) legs.pop();
      while (legs.length < n) legs.push(['base', 'base', 'base', 'base']);
      apply();
    });
    body.append(ctx.field(t('kitchen.shape'), shape));
    const upper = document.createElement('input'); upper.type = 'checkbox'; upper.id = 'kitchenUpper'; upper.checked = it.upper !== false;
    upper.addEventListener('change', () => { ctx.snapshot(); it.upper = upper.checked; apply(); });
    body.append(ctx.field(t('kitchen.upper'), upper));
    body.append(ctx.field(t('kitchen.depth'), ctx.lenInput(() => it.depth ?? 0.6, (v) => { it.depth = Math.max(0.4, Math.min(1.2, v)); }, { min: 0.4 })));
    legs.forEach((leg, li) => {
      const box = document.createElement('div'); box.className = 'kitchenLeg';
      const cap = document.createElement('b'); cap.textContent = `${t('kitchen.leg')} ${li + 1} · ${ctx.toDisp(legLength(leg)).toFixed(2)} ${ctx.imperial() ? 'ft' : 'm'}`; box.append(cap);
      leg.forEach((m, mi) => {
        const row = document.createElement('div'); row.className = 'kitchenMod';
        const sel = document.createElement('select');
        MOD_TYPES.forEach((v) => sel.add(new Option(t(`kitchen.m.${v}`), v)));
        sel.value = modType(m);
        sel.addEventListener('change', () => { ctx.snapshot(); leg[mi] = withType(m, sel.value); apply(); });
        const wd = ctx.lenInput(() => modW(m), (v) => { leg[mi] = withWidth(m, v); }, { min: MIN_MOD_W });          // each module can be made wider or narrower
        wd.classList.add('kitchenW'); wd.title = t('kitchen.width');
        const btn = (txt, title, fn, off) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.title = title; b.disabled = !!off; b.addEventListener('click', () => { ctx.snapshot(); fn(); apply(); }); return b; };
        wd.addEventListener('change', () => ctx.renderProps());
        row.append(sel, wd,
          btn('↑', t('kitchen.left'), () => { [leg[mi - 1], leg[mi]] = [leg[mi], leg[mi - 1]]; }, mi === 0),
          btn('↓', t('kitchen.right'), () => { [leg[mi + 1], leg[mi]] = [leg[mi], leg[mi + 1]]; }, mi === leg.length - 1),
          btn('×', t('kitchen.del'), () => { leg.splice(mi, 1); }));
        box.append(row);
      });
      const add = document.createElement('button'); add.type = 'button'; add.className = 'kitchenAdd'; add.textContent = t('kitchen.add'); add.disabled = leg.length >= MAX_MODS;
      add.addEventListener('click', () => { ctx.snapshot(); leg.push('base'); apply(); });
      box.append(add);
      body.append(box);
    });
  };
}
