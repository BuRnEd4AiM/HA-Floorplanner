/* The name of a room at the top of its panel (edit mode): the field "Name" and right under it the drop-down "HA-Bereich": "✏️ Eigener
 * Name" or one of Home Assistant's areas (the room is then called like it and shows its devices), the areas another room already has
 * after the free ones; a line that says what the link does, "↺ Name aus Home Assistant" when the name was changed, and "🔗 … alle
 * verknüpfen" when rooms of the house are called like an area but not linked yet. A typed name that is a free area's name links the
 * room by itself. What it does: roomname.js (pure, tested). Before, the drop-down stood far down in the panel (props.js). */
import { areaChoices, takeArea, linkByName, nameMatches, linkState } from './roomname.js';
import { roomIcon } from './roomgroups.js';

/** ui: { t, field, snapshot(), changed(), render() (the whole panel again), setStatus(text), areas(), layout() } */
export function roomNameFields(body, it, ui) {
  const { t } = ui;
  const areas = ui.areas() || [], layout = ui.layout();
  const name = document.createElement('input'); name.type = 'text'; name.id = 'roomName'; name.value = it.name || '';
  name.placeholder = t('rname.placeholder');
  body.append(ui.field(t('prop.name'), name));
  if (!areas.length) {                                     // no areas in Home Assistant (or it cannot be reached yet): the name only, a link stays
    name.addEventListener('change', () => { ui.snapshot(); it.name = name.value; ui.changed(); });
    const p = document.createElement('p'); p.className = 'roomAreaHint'; p.id = 'roomAreaHint'; p.dataset.state = 'noAreas';
    p.textContent = t('rname.noAreas');
    body.append(p);
    return;
  }
  const sel = document.createElement('select'); sel.id = 'roomArea';
  sel.add(new Option(`✏️ ${t('rname.own')}`, ''));
  const choices = areaChoices(areas, layout, it.id);
  const group = (label, list) => {
    if (!list.length) return;
    const g = document.createElement('optgroup'); g.label = label;
    list.forEach((a) => {
      const text = a.missing ? `⚠ ${a.name} · ${t('rname.gone')}`
        : `${roomIcon(a.name)} ${a.name}${a.usedBy.length ? ` · ${t('rname.usedBy', { rooms: a.usedBy.join(', ') })}` : ''}`;
      g.append(new Option(text, a.id));
    });
    sel.append(g);
  };
  group(t('rname.free'), choices.filter((a) => !a.usedBy.length));
  group(t('rname.taken'), choices.filter((a) => a.usedBy.length));
  body.append(ui.field(t('prop.area'), sel));
  const hint = document.createElement('p'); hint.className = 'roomAreaHint'; hint.id = 'roomAreaHint';
  const back = document.createElement('button'); back.type = 'button'; back.className = 'linkBtn'; back.id = 'roomAreaName';
  back.textContent = `↺ ${t('rname.back')}`;
  body.append(hint, back);

  const all = document.createElement('button'); all.type = 'button'; all.id = 'roomAreaAll'; all.className = 'roomAreaAll';
  body.append(all);                                         // rooms called like an area, not linked yet: all in one step

  function update() {                                       // after a change: the drop-down, the line under it, "↺" and "🔗 alle"
    sel.value = it.area || '';
    const st = linkState(it, areas), a = areas.find((x) => x.id === it.area);
    hint.dataset.state = st;
    hint.textContent = t(`rname.hint.${st}`, { area: a?.name || it.area || '' });
    back.style.display = st === 'own' ? '' : 'none';
    const todo = nameMatches(areas, layout);
    all.style.display = todo.length ? '' : 'none';
    all.textContent = todo.length === 1 ? `🔗 ${t('rname.linkOne', { room: todo[0].room.name })}` : `🔗 ${t('rname.linkAll', { n: todo.length })}`;
    all.title = todo.map((x) => x.room.name).join(', ');
  }
  name.addEventListener('change', () => {
    ui.snapshot(); it.name = name.value;
    const a = linkByName(it, areas, layout);                // "Küche" typed and Home Assistant has a free area "Küche": linked
    ui.changed(); update();
    if (a) ui.setStatus(t('rname.linked', { area: a.name }));
  });
  sel.addEventListener('change', () => {
    ui.snapshot();
    takeArea(it, areas.find((x) => x.id === sel.value) || null);
    name.value = it.name || '';
    ui.changed(); update();
    if (!it.area) {                                         // "✏️ Eigener Name": straight into the name (the panel may be drawn anew by now)
      const n = document.getElementById('roomName') || name; n.focus(); n.select();
    }
  });
  back.addEventListener('click', () => {
    const a = areas.find((x) => x.id === it.area);
    if (!a) return;
    ui.snapshot(); it.name = a.name; name.value = it.name; ui.changed(); update();
  });
  all.addEventListener('click', () => {
    const todo = nameMatches(areas, layout);
    if (!todo.length) return;
    ui.snapshot();
    todo.forEach(({ room, area }) => { room.area = area.id; });
    ui.changed();
    ui.setStatus(t('rname.linkedAll', { n: todo.length, rooms: todo.map((x) => x.room.name).join(', ') }));
    ui.render();                                            // the drop-down again: those areas now belong to a room
  });
  update();
}
