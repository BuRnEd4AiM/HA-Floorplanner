# Plan 4.18: eine Seite in eigenen Fassungen je Benutzer (#507)

**Stand: gebaut in 4.18.0** (Branch `claude/laughing-ptolemy-iqgsx6`, alle Schritte unten erledigt; offen ist nur das Testen durch den Besitzer, Testprotokoll 95). Der Plan bleibt als Beschreibung von Datenmodell, Aufbau und Stolperfallen.

## Der Wunsch (2026-10-23, wörtlich, gekürzt)

> kannst du das so machen das man die einzelnen reiter so einstellen kann das man das für bestimmte Benutzer oder unter karten machen kann die man dann Benutzern sichtbar machen kann … ein Temperatur zu haben den reiter und bei unteschiedlichen benutzern unterschiedliche sachen anzuzeigen das man das besser mannagen kann

## Seine Entscheidungen (alle per Auswahl im Chat)

1. **„Eigene Fassung je Benutzer“** (nicht „Haken je Karte“): eine Seite wie 🌡 Klima gibt es mehrfach, z. B. „👪 Für alle“ (die normale Seite), „🧒 Kinder“, „📟 Tablet Flur“. Jede Fassung hat eigene Karten (Reihenfolge, ausgeblendet, eigene Karten, Abschnitte, Größen, Breiten). Jeder Benutzer bekommt je Seite **eine** Fassung; wer keine hat, sieht „Für alle“.
2. **Erst Beispielbilder** → gemacht, `docs/ideen-4.18/` (siehe unten).
3. Auf die Bilder: **„Ja, alles so bauen“** = Fassungen beim Bearbeiten (Bild 1), „Neue Fassung“ (Bild 2), „👁 Ansehen als …“, die Tabelle „Wer sieht was“ (Bild 4).
4. **Für alle Reiter** (Heute, Energie, Klima, Kameras, Musik & TV, Haushalt, Abläufe, Familie und die eigenen Seiten `p_…`).

## Die Beispielbilder (`docs/ideen-4.18/`)

| Bild | Was |
|---|---|
| `1-fassung-bearbeiten.jpg` | ✎ Bearbeiten auf 🌡 Klima: unter der blauen Leiste eine lila Leiste „🗂 Fassung: 👪 Für alle (Standard) · 🧒 Kinder · 📟 Tablet Flur · ＋ Neue Fassung“, rechts „Sehen diese Fassung: Lena, Tim“, „⚙ Einstellen“, „👁 Ansehen als …“. Darunter die Karten **der gewählten Fassung** (hier nur das Kinderzimmer und ein Tipp). |
| `2-neue-fassung.jpg` | Fenster „Neue Fassung von 🌡 Klima“: Name, Symbol (16 Emojis), „Anfangen mit“ (Kopie von „Für alle“ / Kopie einer anderen Fassung / Leer), „Wer bekommt diese Fassung?“ (Haken je Benutzer, daneben was er jetzt hat), Hinweis „Jeder Benutzer bekommt eine Fassung je Seite …“, Knöpfe „Abbrechen“ / „✓ Anlegen und bearbeiten“. |
| `3-zwei-benutzer.jpg` | derselbe Reiter bei Papa (Tablet, „Für alle“) und Lena (Handy, „Kinder“). Nur zur Erklärung, nichts zu bauen. |
| `4-wer-sieht-was.jpg` | Fenster „👥 Wer sieht was“: Tabelle Benutzer × Seiten, in jeder Zelle eine Auswahl „Für alle“ / eine Fassung / „aus“ (Reiter fehlt in seiner Leiste); erreichbar aus der lila Leiste **und** aus ⚙ → 👥 Benutzer. |

Neu machen: `python3 docs/ideen-4.18/make_pictures.py /tmp/bilder` (Demo vorher bauen, Playwright 1.56, siehe `docs/UEBERGABE.md`).

## Datenmodell (so entschieden)

- **`settings.pageVariants`** = `{ <seite>: [{ id: 'v_xxxxxx', name, icon, layout }] }`. `layout` hat genau die Form von `pageLayouts.<seite>` (`cleanLayout` in `pagelayout.js`). Höchstens `MAX_VARIANTS = 6` je Seite (zusätzlich zu „Für alle“), Name höchstens 30 Zeichen (Code-Punkte, wie Python `len`), Symbol höchstens 8 Zeichen (sonst `🗂`), Steuerzeichen raus. Nur bekannte Seiten (nicht `house`, eigene Seiten nur, wenn es sie gibt).
- **„Für alle“** bleibt `settings.pageLayouts.<seite>` (nichts ändert sich für alte Einstellungen).
- **Wer welche Fassung bekommt:** `settings.userTabs.<user>.variants = { <seite>: 'v_…' }` (neben `hide` und `start`; wird mit `users.json` gesichert, `USER_KEYS` in `server.py`). Eine Fassung ist **keine Sperre** (was jemand nicht darf, regeln die Sperren `userLocks`); das so in `DOCS.md` schreiben.
- `api/me` gibt schon `tabs` (den Eintrag des Benutzers) zurück → das Programm hat `me.tabs.variants` ohne neuen Endpunkt (geht auch in der Docker-Version: der Server sucht den Benutzer über `current_user(request)`).

## Der erste Teil (vor der Übergabe)

- Beispielbilder + Skripte (`docs/ideen-4.18/`), Issue **#507** mit Wunsch, Auswahl und Notizen.
- **`static/tabs.js`:** `VARIANT_ID = /^v_[a-z0-9]{3,16}$/`, `cleanPicks(v)` (höchstens 30, nur Seiten ≠ house), `cleanTabEntry` behält `variants` (ein Eintrag nur mit `variants` ist nicht leer), `collectUserTabs` nimmt `variants` mit. `tests/tabs.test.mjs` läuft weiter grün; **neue Fälle für `variants` fehlen noch**.
- **`static/pagevariants.js` (rein, noch von nichts benutzt, noch ohne Test):** `cleanVariant`, `cleanVariants(val, pages)`, `variantsOf(settings, page)`, `newVariantId`, `entryOf(userTabs, user)` (Name ohne Groß/klein), `pickedVariant(settings, entry, page)` (eigene Fassung, solange es sie gibt, sonst `ALL = ''`), `cellOf` (`OFF = 'off'` wenn der Reiter versteckt ist), `layoutIn(settings, page, id)`, `withLayoutIn(settings, page, id, layout)` (gibt `{ pageLayouts }` oder `{ pageVariants }` zurück), `emptyStart(keys)` (für „Leer“: alle eingebauten Karten ausgeblendet), `addVariant`, `renameVariant`, `dropVariant` (gibt auch `userTabs` zurück: wer sie hatte, sieht wieder „Für alle“), `setPick(userTabs, user, page, id)` (Fassung / `ALL` / `OFF`; eine Fassung oder `ALL` zeigt den Reiter wieder), `withUsers(settings, users, page, id, chosen)` (Haken im Fenster), `usersOf`, `knownUsers(haUsers, settings)`. Von Hand ausprobiert (anlegen, zwei Benutzer geben, Lena sieht sie, löschen), geht.

## So wurde es gebaut (alle Schritte erledigt)

1. **Test** `tests/pagevariants.test.mjs` (Vorbild `tests/pagelayout.test.mjs`, Aufruf `STATIC_DIR=$PWD/floorplan3d/rootfs/app/static node --test tests/pagevariants.test.mjs`), dazu Fälle für `variants` in `tests/tabs.test.mjs`. `pagevariants` in `.github/workflows/ci.yml` in die lange Zeile `for t in … ; do` eintragen.
2. **Server:**
   - `boards.py`: `VARIANT_ID`, `MAX_VARIANTS = 6`, `clean_variant`, `clean_page_variants(val, custom_tabs)` (gleiche Regeln wie `cleanVariants`, Layout über `clean_layout`).
   - `server.py`: `"pageVariants": {}` in `DEFAULT_SETTINGS` (Kommentar wie bei `pageLayouts`), in `clean_settings` wie `pageLayouts` **nach** der Schleife (braucht `customTabs`); `clean_user_tabs` behält `variants` (gleiche Regeln wie `cleanPicks`; danach Zuweisungen auf Fassungen, die es nicht gibt, weglassen).
   - `static/appstate.js`: `pageVariants: {}` in den Normalwerten.
   - Tests: `tests/test_boards.py` (neue Funktion, Listen gleich wie JS), `tests/test_server.py` (`clean_user_tabs` mit `variants`, `clean_settings` mit `pageVariants`). Danach `python3 -m pytest -q tests/test_boards.py tests/test_server.py tests/test_login.py tests/test_container.py`.
3. **Die Tafel (`static/pageboard.js`)** liest und schreibt die Fassung statt fest `pageLayouts`: `layoutOf(page)` = `layoutIn(settings, page, id)`, `setLayout(page, l)` = `Object.assign(settings, withLayoutIn(settings, page, id, l))`, mit `id = editing === page ? ctx.variants.editing(page) : ctx.variants.seen(page)`. Ohne `ctx.variants` wie bisher (`''`). `showStrip()` setzt unter `strip(page)` die lila Leiste `ctx.variants.bar(page)`. Für „Leer“ braucht die Fassungs-Leiste die Schlüssel der eingebauten Karten der Seite: `board.keys(page)` (aus `shown.get(page).keep`, ohne eigene Karten `c_…`).
4. **Neues Modul `static/variantsui.js`** (nicht in `app.js`!), `initVariantsUi({ t, settings, save, me, users, refill, changed, board })`:
   - Zustand: welche Fassung je Seite gerade bearbeitet wird (Anfang: die, die man selbst sieht) und „Ansehen als“ (ein Benutzername oder leer).
   - `seen(page)` = `pickedVariant(settings, entry(), page)`, `entry()` = Eintrag des „Ansehen als“-Benutzers (`entryOf(settings.userTabs, user)`) oder `me().tabs`.
   - `bar(page)`: die lila Leiste wie Bild 1 (Chips je Fassung, „＋ Neue Fassung“ nur unter `MAX_VARIANTS`, „Sehen diese Fassung: …“ mit `usersOf`, „⚙ Einstellen“ nur bei einer eigenen Fassung, „👁 Ansehen als …“, „👥 Wer sieht was“). Ein Klick auf einen Chip: diese Fassung bearbeiten (Seite neu zeichnen).
   - Fenster „Neue Fassung“ / „⚙ Einstellen“ (Bild 2; beim Einstellen ohne „Anfangen mit“, dafür „🗑 Fassung löschen“ mit Rückfrage): Name, Symbol, „Anfangen mit“ (`layoutIn` der gewählten Fassung, „Leer“ = `emptyStart(board.keys(page))`), Haken je Benutzer (`knownUsers(await fetch('api/users'), settings)`, `withUsers`). Nach dem Anlegen: die neue Fassung bearbeiten.
   - „👁 Ansehen als …“: Benutzer wählen → Bearbeiten endet, eine feste Leiste oben „👁 Du siehst alles wie Lena · Zurück“; Seiten zeigen seine Fassungen, die Reiter-Leiste seine Reiter: in `app.js` `me: () => variantsUi.me(me)` an `initTabsUi` geben (gibt `{ ...me, tabs: entry, locks: seine userLocks }` zurück, nur für die Leiste).
   - Fenster „👥 Wer sieht was“ (Bild 4): Zeilen `knownUsers`, Spalten die Reiter ohne 🏠 (`barTabs(settings.customTabs, settings.tabOrder)`), Zelle = `<select>` mit „Für alle“, den Fassungen der Seite, „aus“ (`cellOf`); nimmt ein Lock (`TAB_LOCK` in `tabs.js`) dem Benutzer den Reiter weg: „🔒“ statt Auswahl. Speichern: für jede geänderte Zelle `setPick`, dann `settings.userTabs = …`, `save()`, `refill()` (= `settingsStore.fill()`, damit das offene ⚙-Fenster nicht alte Haken zurückschreibt), `changed()`.
   - In `dashboards.js` erzeugen und an `initBoard` geben (`variants`), in `app.js` nur verdrahten (`me`, `users`, `refill`).
5. **⚙ → 👥 Benutzer (`static/settingsui.js`):** im Teil „Reiter unten“ (`tabsPart`) neben jedem Haken ein kleines `<select data-tab-variant="<seite>">` (nur wenn die Seite Fassungen hat), `readTablets` liest `variants` mit (sonst **löscht das Speichern des ⚙-Fensters die Zuweisungen!**), `tabletEntries`/`collectTablets` reichen `variants` durch (`tests/settingsui.test.mjs` nachziehen). Dazu ein Knopf „👥 Wer sieht was“ in der Gruppe (öffnet dasselbe Fenster).
6. **Eigene Seite löschen** (`tabedit.js`): auch `pageVariants.<seite>` weg (der Server wirft sie sonst erst beim Speichern weg).
7. **Texte** (Kürzel `pv.*`): JSON-Datei mit allen 7 Sprachen, `python3 tools/add_i18n.py datei.json`, `python3 -m pytest -q tests/test_i18n.py`. Deutsche Texte wie in den Bildern (`docs/ideen-4.18/mockup.js` hat sie alle).
8. **CSS** (`style.css`, Kürzel `.pv*`): die lila Leiste und die Fenster wie in `docs/ideen-4.18/mockup.js` (`.mkVer`, `.mkChipV`, `.mkBox`, `.mkTable` …; Lila `#b07cff` / `#8a5cf0`). Handy prüfen (die Leiste bricht um, die Tabelle scrollt seitwärts).
9. **Demo** (`demo/demo-data.js`): `api/settings` speichert die Demo schon selbst; prüfen, dass `api/users` Benutzer liefert (die Demo hat `admin`, `tablet_wohnzimmer`, `familie`) und `api/me` einen Benutzer hat. Die Demo bauen (`cd demo && npm ci && node build.mjs`), durchklicken, `demo/floorplan3d-demo.html` **nicht** committen.
10. **Browser-Test:** neuer Teil `tests/e2e/parts/3x_variants.py` (nächste freie Nummer, `tests/e2e/run.sh --list`): Fassung „Kinder“ auf Klima anlegen (Kopie von „Für alle“), eine Karte darin ausblenden, einem Benutzer geben, „Ansehen als“ zeigt sie ohne die Karte, „Für alle“ hat sie noch; „Wer sieht was“: „aus“ nimmt den Reiter weg; am Ende aufräumen. Lokal nur `tests/e2e/run.sh 31_tabs 3x_variants`.
11. **Zum Schluss:** Version **4.18.0** in `floorplan3d/config.yaml`, `CHANGELOG.md` und `floorplan3d/CHANGELOG.md`, `floorplan3d/DOCS.md` (Abschnitt Reiter: Fassungen, „keine Sperre“), `docs/MODULE-PLAN.md` (`pagevariants.js`, `variantsui.js` bei „schon ausgelagert“), Zeile in der Tabelle von `docs/UEBERGABE.md`, Testprotokoll-Abschnitt in `docs/TESTPROTOKOLL.md` (nächste freie Nummer, danach `python3 tools/testprotokoll.py`), `python3 tools/make_manifest.py`, `graphify update .`. Pull Request mit „Fixes #507“, dem Besitzer erklären, wie er mergt (oder selbst mergen, sobald alles grün ist: er hat „du kannst alles mergen“ gesagt), und ihn danach per Auswahl im Chat testen lassen (siehe `.claude/CLAUDE.md`).

## Stolperfallen

- Das ⚙-Fenster schreibt beim Speichern **alle** Benutzer-Zeilen zurück (`settings.js` `read()` → `readTablets()`): alles, was dort nicht steht, ist danach weg. Darum Punkt 5 vor dem ersten Test erledigen.
- `cleanUserTabs` behält höchstens 50 Benutzer; ein Eintrag nur mit `variants` ist gültig (seit diesem Branch).
- Eigene Karten werden beim Kopieren mitkopiert (gleiche `c_…`-Ids in zwei Fassungen). Das ist in Ordnung (jede Fassung hat ihr eigenes Layout), die Tafel vergleicht über `cards.sig`.
- `board.size(page, key)` (Thermostat groß/klein) und `cardeditor.js` (`ctx.board.layout(page)`) gehen über `layoutOf` und folgen damit von selbst der Fassung.
