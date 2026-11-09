/* ✎ Bearbeiten (#595): a hidden card is not drawn in the edit mode either (the page looks as it will look), it stands by name in the row
 * "👁 Ausgeblendet" under the edit strip; a tap on it shows it again at its old place, "Alle zeigen" all of them. pageboard.js draws
 * the row (for the version of the page being edited, #507) and says what a tap does. */

const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

/** the text of a heading without what is in it (a line under the title of a card on ▶ Abläufe) */
function headingOf(el) {
  const h = el?.querySelector?.('h1, h2, h3, h4');
  if (!h) return '';
  const own = [...h.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  return own || h.textContent.trim();
}

/** the name of a card in the row: the one the page gave it (a room, a camera …), else its heading, else a word for its key
 *  (bd.k.<key>: the clock, the weather …), else the key */
export function cardName(t, key, item, own) {
  if (own) return own.name || key;
  const word = t(`bd.k.${key}`);
  return item?.name || headingOf(item?.el) || (word !== `bd.k.${key}` ? word : key);
}

/** the row: list [{ key, name }] (the hidden cards that are there now), show(key) shows one again, showAll() all of them */
export function hiddenRow({ t, list, show, showAll }) {
  const row = make('div', 'bdHidden');
  row.dataset.count = String(list.length);
  row.append(make('b', '', `👁 ${t('bd.hiddenList')}`));
  if (!list.length) { row.append(make('span', 'bdSub', t('bd.hiddenNone'))); return row; }
  list.forEach(({ key, name }) => {
    const b = make('button', 'bdHidChip'); b.type = 'button'; b.dataset.key = key; b.title = t('bd.show');
    b.append(make('span', 'bdBox'), make('span', '', name));
    b.addEventListener('click', (e) => { e.stopPropagation(); b.classList.add('on'); show(key); });
    row.append(b);
  });
  if (list.length > 1) {
    const all = make('button', 'bdBtn small', t('bd.showAll')); all.type = 'button'; all.dataset.act = 'showAll';
    all.addEventListener('click', (e) => { e.stopPropagation(); showAll(); });
    row.append(all);
  }
  return row;
}
