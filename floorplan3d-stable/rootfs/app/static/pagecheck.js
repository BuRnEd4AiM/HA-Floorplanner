/* 🩺 Haus-Check, the page of the tab bar (5.24.0, docs/ideen-5.21 picture 1): urgent, soon and the maintenance as rows; a tap on a device
 * shows it in the house, "✓ Erledigt" starts a reminder anew, "＋ Erinnerung" and "Vorschläge für meine Geräte" add one. The rules are
 * housecheck.js (tested). */
import { check, cleanReminders, suggestions, markDone, newId, dayOf } from './housecheck.js';

/** ctx: t, el, data() ({ batteries, offline, radio, updates }), reminders(), save(list) (the reminders into the settings), canEdit(),
 *  devices() (the plan's devices [{ id, name, type, entity, dc }]), locate(id) */
export function initCheckPage(ctx) {
  const { t, el } = ctx;
  let drawn = '', adding = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const button = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const today = () => dayOf(new Date());
  const result = () => check({ ...ctx.data(), reminders: ctx.reminders(), today: today() }, t);

  function row(x) {
    const r = make('div', `hcRow ${x.kind}`); r.dataset.kind = x.kind; r.dataset.id = x.id;
    r.append(make('span', 'hcIcon', x.icon), make('span', 'hcText', x.text), make('span', 'hcRight', x.right));
    if (x.kind === 'care' && ctx.canEdit()) {
      const done = button('hcDone', `✓ ${t('hc.done')}`, () => { ctx.save(markDone(ctx.reminders(), x.id, today())); render(true); });
      done.dataset.act = 'done';
      const del = button('hcDel', '✕', () => { if (confirm(t('hc.delAsk', { name: x.text }))) { ctx.save(cleanReminders(ctx.reminders()).filter((m) => m.id !== x.id)); render(true); } });
      del.title = t('hc.del');
      r.append(done, del);
    } else if (['battery', 'offline', 'radio'].includes(x.kind)) {
      r.classList.add('tap'); r.addEventListener('click', () => ctx.locate(x.id));
    }
    return r;
  }
  function section(title, list, empty) {
    const s = make('div', 'tpCard hcSec');
    s.append(make('h3', 'peH', title));
    if (!list.length) s.append(make('p', 'tpSub', empty));
    list.forEach((x) => s.append(row(x)));
    return s;
  }
  function addBox() {
    const box = make('div', 'tpCard hcAdd');
    if (!adding) {
      box.append(button('bdBtn primary', `＋ ${t('hc.add')}`, () => { adding = true; render(true); }));
      const sug = suggestions(ctx.devices(), ctx.reminders(), t);
      if (sug.length) {
        box.append(make('h3', 'peH', t('hc.suggest')));
        sug.forEach((s) => {
          const r = make('div', 'hcRow');
          r.append(make('span', 'hcIcon', s.icon), make('span', 'hcText', s.name), make('span', 'hcRight', t('hc.every', { n: s.every })),
            button('hcDone', '＋', () => { const list = cleanReminders(ctx.reminders()); ctx.save([...list, { id: newId(list), name: s.name, icon: s.icon, every: s.every, last: today(), device: s.device }]); render(true); }));
          r.lastChild.dataset.act = 'suggest';
          box.append(r);
        });
      }
      return box;
    }
    const name = make('input'); name.type = 'text'; name.placeholder = t('hc.namePh'); name.maxLength = 60; name.id = 'hcName';
    const every = make('select'); every.id = 'hcEvery';
    [7, 14, 30, 60, 90, 180, 365].forEach((n) => every.add(new Option(t('hc.every', { n }), String(n))));
    every.value = '90';
    const ok = button('bdBtn primary', `✓ ${t('hc.save')}`, () => {
      if (!name.value.trim()) { name.focus(); return; }
      const list = cleanReminders(ctx.reminders());
      ctx.save([...list, { id: newId(list), name: name.value.trim(), icon: '🔧', every: Number(every.value), last: today(), device: '' }]);
      adding = false; render(true);
    });
    ok.dataset.act = 'hcSave';
    box.append(make('h3', 'peH', t('hc.add')), name, every, ok, button('bdBtn', t('app.cancel'), () => { adding = false; render(true); }));
    return box;
  }
  function render(force = false) {
    const r = result();
    const sig = JSON.stringify([r, adding, ctx.canEdit(), t('hc.title')]);
    if (!force && sig === drawn) return;
    drawn = sig;
    const head = make('div', 'hcHead');
    head.append(make('h2', '', `🩺 ${t('hc.title')}`), make('p', 'tpSub', t('hc.sub')));
    const chips = make('div', 'hcChips');
    [['urgent', r.urgent.length], ['soon', r.soon.length]].forEach(([k, n]) => chips.append(make('span', `hcChip ${k}`, t(`hc.n.${k}`, { n }))));
    head.append(chips);
    el.replaceChildren(head, section(t('hc.urgent'), r.urgent, t('hc.allGood')), section(t('hc.soon'), r.soon, t('hc.nothing')),
      section(t('hc.care'), r.later, t('hc.noCare')), ...(ctx.canEdit() ? [addBox()] : []));
  }
  return {
    render: () => render(true), update: () => render(), has: () => true, reset: () => { adding = false; },
    /** how many urgent things (the number on the tab and the chip on 📱 Start) */
    badge: () => result().urgent.length,
  };
}
