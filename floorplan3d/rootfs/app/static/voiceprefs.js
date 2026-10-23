/* ⚙ → "🎤 Sprachsuche" (#509): which recognition (automatic, the browser's, Home Assistant's Assist, off), what works on this device and
 * how to set up Assist, and the code words: "Wenn ich sage … → meine ich …" (a room or several, a floor, a house; for everybody or one
 * user), e.g. "Wohnzimmer der Eltern" → the room "Wohnzimmer" of the house "Eltern". A part of the settings form (settings.js parts:
 * fill / read); the server keeps it in settings.voice (voice.clean_voice), voicequery.js cleanVoice does the same here. */
import { cleanVoice, ENGINES } from './voicequery.js';

/** ctx: $, t, voice (voiceui.js: places(), loadOthers(), status(), refresh()), houseId(), commit(), tryIt() (close the settings and listen) */
export function initVoicePrefs(ctx) {
  const { $, t } = ctx;
  const box = $('#vcAliases'), engine = $('#setVoiceEngine'), group = $('#settingsDialog details[data-group=voice]');
  let edited = '', usersLoaded = false;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  /** the name of a place for a chip; a room or floor of another house with that house's name */
  function label(p, a) {
    const houseName = (id) => p.houses.find((h) => h.id === id)?.name || '?';
    const other = (h) => (h && h !== ctx.houseId() ? ` (${houseName(h)})` : '');
    if (a.rooms.length) return a.rooms.map((id) => { const r = p.rooms.find((x) => x.id === id); return r ? `${r.name || '—'}${other(r.house)}` : t('vc.gone'); });
    if (a.floor) { const f = p.floors.find((x) => x.id === a.floor); return [f ? `🏢 ${f.name}${other(f.house)}` : t('vc.gone')]; }
    if (a.house) return [`🏠 ${houseName(a.house)}`];
    return [];
  }
  /** the choice "＋ Ort …": per house the whole house, its floors and its rooms */
  function placeSelect(p) {
    const sel = el('select'); sel.dataset.role = 'add'; sel.setAttribute('aria-label', t('vc.addPlace'));
    sel.append(new Option(`＋ ${t('vc.addPlace')}`, ''));
    const houses = [...p.houses].sort((a, b) => Number(b.id === ctx.houseId()) - Number(a.id === ctx.houseId()));
    houses.forEach((h) => {
      const g = document.createElement('optgroup'); g.label = h.name;
      if (p.houses.length > 1) g.append(new Option(`🏠 ${t('vc.wholeHouse')}`, `h:${h.id}`));
      p.floors.filter((f) => f.house === h.id).forEach((f) => {
        g.append(new Option(`🏢 ${f.name || '—'}`, `f:${f.id}`));
        p.rooms.filter((r) => r.floor === f.id && r.house === h.id).forEach((r) => g.append(new Option(`   ${r.name || '—'}`, `r:${r.id}`)));
      });
      sel.append(g);
    });
    return sel;
  }
  function row(a, p) {
    const wrap = el('div', 'vcRow');
    const set = (x) => { wrap.dataset.house = x.house || ''; wrap.dataset.floor = x.floor || ''; wrap.dataset.rooms = JSON.stringify(x.rooms || []); };
    set(a);
    const say = el('input'); say.type = 'text'; say.maxLength = 60; say.value = a.say; say.dataset.role = 'say'; say.placeholder = t('vc.sayPh');
    say.setAttribute('aria-label', t('vc.say'));
    const chips = el('span', 'vcPlaces');
    const drawChips = () => {
      const cur = { house: wrap.dataset.house, floor: wrap.dataset.floor, rooms: JSON.parse(wrap.dataset.rooms || '[]') };
      chips.replaceChildren(...label(p, cur).map((txt, i) => {
        const c = el('span', 'vcChip', txt), x = el('button', '', '×'); x.type = 'button'; x.title = t('vc.removePlace');
        x.addEventListener('click', () => {
          if (cur.rooms.length) { cur.rooms.splice(i, 1); if (!cur.rooms.length) cur.house = ''; } else { cur.floor = ''; cur.house = ''; }
          set(cur); drawChips(); ctx.commit();
        });
        c.append(x); return c;
      }));
      if (!chips.childElementCount) chips.append(el('small', 'sub', t('vc.noPlace')));
    };
    const add = placeSelect(p);
    add.addEventListener('change', () => {
      const [kind, id] = [add.value.slice(0, 1), add.value.slice(2)];
      const cur = { house: wrap.dataset.house, floor: wrap.dataset.floor, rooms: JSON.parse(wrap.dataset.rooms || '[]') };
      if (kind === 'h') set({ house: id, floor: '', rooms: [] });
      else if (kind === 'f') set({ house: p.floors.find((f) => f.id === id)?.house || '', floor: id, rooms: [] });
      else if (kind === 'r') {
        const r = p.rooms.find((x) => x.id === id), same = cur.rooms.length && p.rooms.find((x) => x.id === cur.rooms[0])?.house === r?.house;
        set({ house: r?.house || '', floor: '', rooms: same ? [...new Set([...cur.rooms, id])] : [id] });   // rooms of one house
      }
      add.value = '';
      drawChips();                                             // the change bubbles to the dialog, which saves
    });
    const user = el('input'); user.type = 'text'; user.maxLength = 80; user.value = a.user || ''; user.dataset.role = 'user';
    user.setAttribute('list', 'vcUsers'); user.placeholder = t('vc.forAll'); user.title = t('vc.userTip');
    const del = el('button', 'lgDel', '×'); del.type = 'button'; del.title = t('vc.delete');
    del.addEventListener('click', () => { wrap.remove(); ctx.commit(); });
    const line1 = el('div', 'vcLine'), line2 = el('div', 'vcLine');
    line1.append(say, el('span', 'vcArrow', '→'), chips);
    line2.append(add, user, del);
    wrap.append(line1, line2);
    drawChips();
    return wrap;
  }
  function draw(list) {
    const p = ctx.voice.places();
    box.replaceChildren(...list.map((a) => row(a, p)));
    $('#vcNone').hidden = list.length > 0;
  }
  /** what this device can do: the browser's recognition, Home Assistant's Assist, the microphone */
  function status() {
    const s = ctx.voice.status(), ul = $('#vcStatus');
    const line = (ok, text) => { const li = el('li', ok ? 'ok' : 'no', `${ok ? '✓' : '✗'} ${text}`); return li; };
    ul.replaceChildren(
      line(s.browser, t(s.browser ? 'vc.st.browser' : 'vc.st.noBrowser')),
      line(s.mic, t(s.mic ? 'vc.st.mic' : 'vc.st.noMic')),
      line(!!s.assist?.assist, s.assist == null ? t('vc.st.asking') : s.assist.assist ? t('vc.st.assist', { name: s.assist.name || '' }) : t('vc.st.noAssist')),
      el('li', s.engine ? 'ok now' : 'no now', s.engine ? t('vc.st.uses', { what: t(`vc.via.${s.engine}`) }) : t('vc.st.none')),
    );
    $('#vcGuide').hidden = !!s.assist?.assist;                 // how to set up Assist: only while it cannot listen
  }
  async function opened() {
    status();
    await Promise.all([ctx.voice.loadOthers(), ctx.voice.refresh()]);
    status();
    edited = ''; fill(ctx.settings());                          // now with the rooms of every house
    if (!usersLoaded) {
      usersLoaded = true;
      try {
        const r = await fetch('api/users'); const users = r.ok ? await r.json() : [];
        $('#vcUsers').replaceChildren(...users.map((u) => { const o = document.createElement('option'); o.value = u.username; o.label = u.name; return o; }));
      } catch { /* not an editor: no list */ }
    }
  }
  group?.addEventListener('toggle', () => { if (group.open) opened(); });
  $('#vcAdd').addEventListener('click', () => {
    box.append(row({ say: '', house: '', floor: '', rooms: [], user: '' }, ctx.voice.places()));
    $('#vcNone').hidden = true;
    box.lastElementChild.querySelector('input').focus();
  });
  $('#vcTry').addEventListener('click', () => ctx.tryIt());

  function fill(settings) {
    const v = cleanVoice(settings.voice);
    engine.value = v.engine;
    const key = JSON.stringify(v.aliases);
    if (key === edited) return;                                 // as the form has it (a row without a place yet stays)
    edited = key;
    draw(v.aliases);
    if (group?.open) status();
  }
  function read(next) {
    next.voice = cleanVoice({
      engine: ENGINES.includes(engine.value) ? engine.value : 'auto',
      aliases: [...box.querySelectorAll('.vcRow')].map((w) => ({
        say: w.querySelector('[data-role=say]').value, user: w.querySelector('[data-role=user]').value,
        house: w.dataset.house, floor: w.dataset.floor, rooms: JSON.parse(w.dataset.rooms || '[]'),
      })),
    });
    edited = JSON.stringify(next.voice.aliases);
  }
  return { fill, read, status };
}
