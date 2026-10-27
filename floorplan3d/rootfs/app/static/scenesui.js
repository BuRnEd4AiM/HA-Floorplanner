/* The card "🎨 Szenen" of ▶ Abläufe (#549): every scene of Home Assistant with ▶ (plays it), ✏ to change it in the scene editor
 * (sceneedit.js; since #564 also one made in Home Assistant, in place) and 🗑 to delete it (hamanage.js: asks first, "↶ Wiederherstellen"
 * after), "＋ Neue Szene" for editors when Home Assistant is there. Only scenes of Home Assistant's editor (scenes.yaml, with an id) can be
 * changed. routinesown.js puts this card on the board of ▶ Abläufe. */
import { sceneList, deviceWords } from './scenes.js';

/** ctx: t, states(), nameOf(entity), canEdit(), locked(), callService(entity, service, data), ha() (Home Assistant is there), edit(scene) (the
 *  editor: a scene of the list or null), manage (hamanage.js), changed() (draw the page again) */
export function initScenesCard(ctx) {
  const { t } = ctx;
  let all = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };

  function card() {
    const list = sceneList(ctx.states(), ctx.nameOf).filter((s) => !ctx.manage.hidden(s.cid));
    const c = make('div', 'tpCard roCard scCard');
    const h = make('h3', 'peH roHead'); h.append(make('span', '', `🎨 ${t('sc.title', { n: list.length })}`), make('span', 'tpSub roHint', t('sc.hint')));
    c.append(h);
    if (ctx.canEdit() && ctx.ha()) {
      const bar = make('div', 'roBar');
      const add = btn('bdBtn primary', `＋ ${t('sc.new')}`, () => ctx.edit(null)); add.dataset.act = 'newScene';
      bar.append(add);
      c.append(bar);
    }
    const undo = ctx.manage.undoRow('scene');
    if (undo) c.append(undo);
    if (!list.length) c.append(make('p', 'tpSub', t('sc.none')));
    list.slice(0, all ? 200 : 8).forEach((s) => {
      const r = make('div', 'roRow small'); r.dataset.scene = s.entity;
      const tx = make('div', 'roTx');
      const title = make('div', 'roName'); title.append(make('b', '', s.name));
      if (s.ours) { const w = make('span', 'roWhere ha', `🎨 ${t('sc.ours')}`); w.title = t('sc.oursHint'); title.append(w); }
      tx.append(title);
      if (s.members.length) tx.append(make('small', 'roUses', s.members.slice(0, 4).map((m) => ctx.nameOf(m) || m).join(' · ') + (s.members.length > 4 ? ' …' : '')));
      r.append(tx);
      if (!ctx.locked()) { const p = btn('roIcon', '▶', () => ctx.callService(s.entity, 'turn_on'), t('sc.play')); p.dataset.playScene = s.entity; r.append(p); }
      if (ctx.canEdit() && ctx.ha() && s.cid) {
        const e = btn('roIcon', '✏️', () => ctx.edit(s), s.ours ? t('sc.edit') : t('sc.editTheirs')); e.dataset.editScene = s.entity;
        const d = btn('roIcon', '🗑', () => ctx.manage.remove('scene', s.cid, s.name), t('sc.delete')); d.dataset.delScene = s.entity;
        r.append(e, d);
      }
      c.append(r);
    });
    if (list.length > 8) c.append(btn('tpChip roMore', all ? t('ro.less') : t('ro.all', { n: list.length }), () => { all = !all; ctx.changed(); }));
    return c;
  }
  const sig = () => {
    const st = ctx.states();
    return JSON.stringify([Object.keys(st).filter((e) => e.startsWith('scene.')).map((e) => [e, st[e]?.cid, ctx.nameOf(e), st[e]?.members]), all, ctx.canEdit(), ctx.locked(), ctx.ha(), ctx.manage.sig(), t('sc.new')]);
  };
  return { items: () => [{ key: 'scenes', width: 2, sig: sig(), make: card }], sig, words: deviceWords };
}
