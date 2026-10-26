# Übergabe: so geht es in einem neuen Chat weiter

Stand: 2026-10-26, Version **4.26.0** (gemergt). Diese Datei ist für den nächsten Chat (auch auf einem anderen Zugang) geschrieben: erst diese Datei lesen, dann `.claude/CLAUDE.md`.

**Diese Datei kurz halten** (Wunsch des Besitzers beim Aufräumen am 2026-10-26): unter „Zuletzt“ stehen nur die letzten Sitzungen mit ein, zwei Sätzen; was gebaut ist, steht in `CHANGELOG.md` und im Zeitstrahl. Wird ein Abschnitt alt, kommt er ins Archiv `docs/archiv/`. Die ganze alte Fassung bis 4.26.0 (alle früheren Wünsche und Entscheidungen, die Tabelle „Was fertig ist“, die technischen Notizen zu 4.0 bis 4.2, zu den Reitern, den Seiten und #495) liegt in **`docs/archiv/UEBERGABE-bis-2026-10-26.md`**.

## Zuletzt

- **2026-10-26, Aufräumen (Branch `claude/friendly-goldberg-30ll7l`):** Der Besitzer: „kannst du das Git ein wenig aufräumen … eine Menge Altlast“. Seine Wahl per Auswahl im Chat: **alle 104 alten Zweige löschen** (alles darin steckte schon in `main`, geprüft mit `git rev-list`/`git cherry` und dem CHANGELOG), **Zweige künftig nach dem Merge automatisch löschen**, **diese Datei kürzen** (alte Fassung ins Archiv), `docs/GIT-EINSTIEG.md` weg (erklärte GitHub Desktop und eine ZIP vom ersten Tag), die fertigen **Meilensteine** v0.8, v0.9 und v3.0 schließen. Die Beispielbilder `docs/ideen-*` bleiben. Dazu sein neuer Wunsch: „wie sich das Projekt entwickelt hat mit Version zu Version … mit einem Zeitstrahl … zukünftig immer weiter ergänzen … ästhetisch“ → der **Zeitstrahl** (siehe unten).
- **2026-10-25 abends bis 2026-10-26 (Branches `claude/night-fixes` und folgende, #527 bis #540):** Auf „Was könnte man noch verbessern oder hinzufügen“ wählte der Besitzer: reparieren Tablet schneller (#138), Komma statt Punkt, Demo-Uhrzeiten (4.21.3); neu 🔔 Klingel (4.22.0), 🔔 Sag mir Bescheid (4.23.0), 🗣 Schalten per Sprache (4.24.0), 🚗 Auto und 🌱 Garten (4.25.0); danach „draußen Hof … das Grundstück bemessen … Deko-Sachen ums Haus … freier“ → 🏡 Grundstück und Flächen (4.26.0, #538). Nicht gewählt: 🤖 Saugroboter je Raum, Weg zu 1.0. Claude hat danach 102 bis 107 in der Demo geprüft (#540).
- **2026-10-25 nachts (Branch `claude/overnight-tests`, #519 bis #525):** Auf „kannst du über die Nacht ein paar Tests für mich machen“ hat Claude die offenen Punkte des Testprotokolls in der Demo und im Test-Add-on durchgespielt (wie: Stolperfalle „Nacht-Test“ unten), Funde in 4.21.2 repariert.

## Offen

- **Testen durch den Besitzer:** was noch offen ist, steht oben in `docs/TESTPROTOKOLL.md` („Kurze Prüfliste“ und die Übersicht, die sich selbst ausrechnet). Wenn er testet: per Auswahl im Chat abfragen (siehe „Der Besitzer“).
- **Sprachsuche am Tablet:** das 🎤 geht nur über **https** (Nabu Casa oder ein Zertifikat) und mit **Assist mit Whisper** (Anleitung in ⚙ → 🎤 Sprachsuche); ohne https hilft das Diktat der Tastatur (4.20.0). Das Ergebnis seines 🩺 Mikrofon-Tests (Testprotokoll 97) fehlt noch.
- **#138 Tablet schneller:** erste Schritte gemacht (3.60.0 Anzeige, 3.89.0 weniger Zeichenaufrufe, 4.21.3 Möbel zusammen gezeichnet); das Musterhaus braucht noch 1.661 Zeichenaufrufe (56.2 erwartet etwa 1.300).
- **HACS-Store:** Schritt 3 in `docs/HACS-STORE.md` darf nur der Besitzer machen (siehe unten).
- Nicht gewählt, vielleicht später: 🤖 Saugroboter je Raum, der Weg zu 1.0 (`ROADMAP.md`), Rasen mit Mähstreifen.

## Der Besitzer

- Kein Entwickler: einfach und auf Deutsch erklären, kurze Sätze, keine Fachwörter.
- Er testet in der **Demo** (https://burned4aim.github.io/HA-Floorplanner/) und schickt Ergebnisse als Nummern aus `docs/TESTPROTOKOLL.md`, z. B. „65.1 bis 65.8 geht“. Eintragen: nur die Ergebnis-Zellen ändern (`✅ (Datum)`), dann `python3 tools/testprotokoll.py`, die „Kurze Prüfliste“ oben und „Ältere offene Punkte“ nachziehen (siehe `.claude/CLAUDE.md`).
- **Testen per Auswahl im Chat** (sein Wunsch, 2026-10-20): wenn er testet, fragt Claude die Testpunkte mit dem Werkzeug AskUserQuestion ab, eine Frage je Nummer (✅ Geht / ❌ Geht nicht / ⏭ Noch nicht getestet, dazu „Other“ für einen Satz), höchstens 4 je Runde; dann eintragen wie oben. Genau so in `.claude/CLAUDE.md`.
- Er mag **Beispielbilder vor dem Bauen**: Ideen erst als Bild zeigen (die Demo mit eingespieltem Skript fotografieren, siehe unten), dann bauen, was er auswählt.
- Zu jedem Pull Request erklären, wie er mergt (Link öffnen, „Merge pull request“, „Confirm merge“). Er hat Claude schon mehrmals gebeten, selbst zu mergen, sobald alles grün ist („mache den merge wenn er bereit ist“, „gerne“). Das gilt pro Pull Request: kurz fragen, wenn er es nicht schon gesagt hat. **Seit 2026-10-22 allgemein:** „du kannst alles mergen“ – Claude merged die eigenen Pull Requests selbst, sobald alles grün ist (Methode „merge“), und sagt es danach.
- Er hat die Reihenfolge seiner Werkzeugleiste früher selbst angepasst („Gerät“ steht bei ihm vorne). Das ist kein Fehler; ✎ → „Zurücksetzen“ stellt die normale Reihenfolge her (schon gesagt).

## Wo was steht

- **Was es gibt und seit wann:** `CHANGELOG.md` (dasselbe wie `floorplan3d/CHANGELOG.md`) und der Zeitstrahl https://burned4aim.github.io/HA-Floorplanner/timeline.html.
- **Aufbau des Codes:** `docs/ARCHITECTURE.md`; was aus `app.js` schon herausgelöst ist: `docs/MODULE-PLAN.md`.
- **Pläne mit technischen Notizen:** Reiter und Seiten `docs/PLAN-4.3.md`, Fassungen je Benutzer `docs/PLAN-4.18.md`, Himmel, Wetter, Strom-Bild `docs/PLAN-3.98.md`; alles Ältere im Archiv.
- **Beispielbilder** der Ideen: `docs/ideen-<version>/` (mit den Skripten, die sie gemacht haben).

## Zeitstrahl (seit 2026-10-26)

- Die Seite `timeline.html` liegt neben der Demo auf GitHub Pages: Titelbild (`docs/img/3d.jpg`), Zahlen (Versionen, Tage, neu, verbessert, repariert), die Kurve „Versionen über die Zeit“ (Punkte = 1.0, 2.0 …; tippen springt zum Tag), alle Versionen nach Hauptversion und Tag, Suche, „Nur große Versionen“, Reihenfolge, Deutsch / Englisch. Die Einträge selbst sind englisch (aus dem CHANGELOG), das steht auf der Seite.
- **Sie baut sich selbst:** der Workflow „Demo“ ruft bei jedem Merge, der `CHANGELOG.md`, die Bilder oder das Werkzeug ändert, `python3 tools/make_timeline.py _site` auf. Nichts von Hand eintragen: eine neue Version im CHANGELOG erscheint von selbst, ein neuer Ordner `docs/ideen-<major>.<minor>/` mit seinen Bildern bei Version `<major>.<minor>.0`.
- Aussehen und Texte: `tools/timeline.html`. Die Namen der Abschnitte („Die Anfänge“ … „Das ganze Zuhause“) stehen dort in `eras` (Deutsch und Englisch); eine neue Hauptversion heißt „Version 5“, bis jemand ihr dort einen Namen gibt.
- Lokal ansehen: `python3 tools/make_timeline.py /tmp/zeit`, dann `/tmp/zeit/timeline.html` öffnen. Unit-Test: `tests/test_make_timeline.py`.

## Zweige (seit 2026-10-26)

- Der Workflow **„Clean up branches“** (`.github/workflows/cleanup.yml`) löscht den Zweig eines Pull Requests, sobald er gemergt ist. Er lässt ihn stehen, wenn nach dem Merge noch neue Commits darauf kamen, und löscht nie `main` und nie einen Zweig, auf dem ein offener Pull Request aufbaut.
- Von Hand (Actions → Clean up branches → Run workflow): ohne Eingabe alle Zweige, deren Pull Request gemergt ist; oder genau die eingetragenen Zweige (mit Leerzeichen getrennt); dazu Meilensteine schließen (Titel mit `;` getrennt). Claude kann von hier aus keine anderen Zweige löschen (der Git-Proxy lässt nur den eigenen Zweig zu): dafür diesen Workflow über das GitHub-Werkzeug starten.
- Für Claude: nach dem Merge ist der Zweig weg. Weiterarbeiten wie immer: `git fetch origin main && git checkout -B <branch> origin/main`; `git push -u origin <branch>` legt ihn neu an.

## HACS-Store (2026-10-21, Wunsch des Besitzers: „kannst du gerne vorbereiten mit hacs“)

Die Karte soll in den offiziellen HACS-Store (heute nur als benutzerdefiniertes Repository). Vorbereitet: Workflow `validate.yml` (`hacs/action`, Kategorie `plugin`, ohne `ignore`), Anleitung für den Besitzer in **`docs/HACS-STORE.md`** (Beschreibung des Repositorys verbessern, auf ein Release nach grüner Prüfung warten, dann selbst den Pull Request an `hacs/default`, Datei `plugin`, nach `BTNBx/xPower-Flow-Card`). Den Antrag darf nur der Besitzer stellen. **Stand 2026-10-21:** „Validate“ ist auf `main` grün (seit dem Merge von #480, Lauf https://github.com/BuRnEd4AiM/HA-Floorplanner/actions/runs/39655629762), das Release v4.3.0 hat `floorplan3d-card.js`; es entstand aber in derselben Minute wie die Prüfung. Das Release 4.4.0 (nach dem Merge von #482) kommt sicher nach einer grünen Prüfung: damit kann der Besitzer Schritt 3 machen (Schritt 1, die Beschreibung, ist seine Sache). Gesagt am 2026-10-21; ob er den Antrag gestellt hat, weiß Claude nicht (fragen, wenn es passt).

## Token-Zähler (seit 2026-10-18)

- Der Besitzer wollte wissen, wie viele Tokens Claude verbraucht, egal mit welchem Zugang. Übersicht: `docs/TOKENS.md`.
- Jede Sitzung hat eine eigene Datei `docs/tokens/<sitzung>.json`. Der Hook in `.claude/settings.json` ruft vor jedem `git commit` `tools/tokens.py --hook` auf: er zählt den Verlauf der Sitzung (mit Helfern) und legt die Datei in den Commit. Darum steckt in jedem Commit von Claude auch diese Datei; das ist gewollt.
- `docs/TOKENS.md` schreibt nur der Workflow „Token count“ nach dem Merge (`.github/workflows/tokens.yml`), nie ein Pull Request (sonst Konflikte zwischen parallelen Sitzungen).
- Startwerte: 34 Sitzungen mit echten Zahlen aus der Sitzungsliste eines Zugangs, die übrigen 13 (anderer Zugang, nur aus den Commits bekannt) geschätzt (`docs/tokens/estimate-other-accounts.json`).
- Von Hand zählen: `python3 tools/tokens.py --now`.

## Beispielbilder machen (so entstanden alle Bilder in `docs/ideen-3.98/` und `docs/ideen-3.99/`)

1. Demo lokal bauen: `cd demo && npm ci && node build.mjs` (schreibt `demo/floorplan3d-demo.html`; diese Datei **nicht** committen, nach dem Merge baut sie die CI selbst: „Rebuild demo [skip ci]“; vor dem Commit `git checkout demo/floorplan3d-demo.html`).
2. Playwright: `pip install playwright==1.56.0` (passt zum vorinstallierten Chromium 1194; neuere Versionen finden den Browser nicht). In eigenen Skripten `executable_path="/opt/pw-browsers/chromium"`, `args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]`, `locale="de-DE"`, `timezone_id="Europe/Berlin"`.
3. Demo mit `?debug=1` öffnen: `window.__fp` hat u. a. `scene`, `renderer`, `camAt(x, y, z, tx, tz)`, `layout`, `states()`, `select(kind, id)`, `switchFloor(i)`, `alerts()`, `powerInfo()`, `frame()`. Dazu `?skytime=21:30` (Uhrzeit des Himmels) und `?weather=rainy` (Wetter der Demo).
4. Ein Skript in die Seite spielen, das die Idee nur für das Foto malt (`docs/ideen-3.99/mockup2.js`, `docs/ideen-3.98/mockup.js`), dann `page.screenshot`. Beispiel: `python3 docs/ideen-3.99/make_pictures.py /tmp/bilder 1-boeden`.
5. Die Bilder als JPG (Qualität 80) in `docs/ideen-<version>/` legen und dem Besitzer schicken.

## Die Bilder der README und der Import-Anleitung neu machen (2026-10-18, Wunsch des Besitzers: „mache mal bitte die bilder alle neu“)

- Alle Bilder in `docs/img` macht **ein** Skript: `python3 tools/make_screenshots.py` (alle, etwa 15 Minuten) oder nur einzelne, z. B. `python3 tools/make_screenshots.py hero phone sky`. Mit `OUT=/pfad` landen sie erst woanders (zum Anschauen). Vorher die Demo bauen (siehe oben, Schritt 1) und Playwright 1.56.0 installieren; das Skript nimmt `/opt/pw-browsers/chromium` von selbst.
- Namen: `hero` (3d.jpg), `house`, `ground`, `ledring`, `room`, `light`, `split`, `plan` (2d.jpg), `library`, `toolbar`, `power`, `heat`, `floors`, `sky` (vier Tageszeiten/Wetter in einem Bild), `devices`, `security`, `phone` (drei Handys in einem Bild, PNG mit durchsichtigen Ecken), `tour` (overview.gif); aus einem Wegwerf-Add-on: `welcome`, `backup`, `version` und `import` (die Bilder von `docs/IMPORT.md` auf Deutsch, `docs/IMPORT.en.md` auf Englisch und `import-demo.gif`).
- Das Bild für GitHub (Social Preview): `python3 tools/make_social_preview.py` (im Editor ohne Himmel, damit das Haus ausgeschnitten werden kann). Es muss danach von Hand in GitHub hochgeladen werden: Settings → General → Social preview.
- Große Bildschirmfotos sind **JPG** (höchstens 2400 px breit, Qualität 85): ein Himmel mit Sternen machte ein PNG 2 bis 3 MB groß.
- Feste Uhrzeit des Himmels pro Bild (`?skytime=`), englische Oberfläche, „Ansicht“ → „Schilder darunter“ aus (sonst scheinen die Kellernamen durch den Rasen). Die Demo bekommt ihre Einstellungen und für `security` einen aufgezeichneten Beispieltag über `HOOK` im Skript (fängt `fetch` ab, bevor die Demo es ersetzt).
- Karten (Lampe, LED-Ring) liegen mitten über dem Raum: das Skript schiebt das 3D-Bild danach mit der rechten Maustaste zur Seite (`pan`), von einer freien Stelle aus, nicht auf einer Karte.

## Stolperfallen

- `body` trägt `data-tool` (das gewählte Werkzeug): ein Selektor wie `[data-tool=wall] svg` trifft auch den `body`. Immer auf `#tools` einschränken.
- Browser-Test: `parts/base.py` hinterlässt das Design „holo“, evtl. englische Sprache und imperiale Einheiten. Ein Teil, der Texte oder Temperaturen prüft, setzt `language`, `units`, `theme` selbst und stellt sie am Ende zurück (Vorbild `tests/e2e/parts/25_sky_tiles.py`). Die Seite öffnet nicht unbedingt Etage 0: `window.__fp.switchFloor(0)`.
- Playwright in dieser Sitzung (2026-10-23): vorinstalliert war Chromium 1243, dazu passt `pip install playwright==1.63.0` (nicht mehr 1.56.0). Ohne `aiohttp`/`pytest` im System: `python3 -m venv <ordner> && <ordner>/bin/pip install -r requirements-dev.txt playwright==1.63.0`, dann `PATH=<ordner>/bin:$PATH tests/e2e/run.sh voice`.
- Lokal nur die betroffenen Teile laufen lassen: `tests/e2e/run.sh 05_power 25_sky_tiles` (Basis-Haus + Teile, ein paar Minuten). Die CI startet bei jedem Push alle Teile neu; ein roter Lauf zu einem älteren Commit ist nach einem neueren Push egal.
- Sprachsuche (#511): In Android-WebViews (Fully Kiosk, Home-Assistant-App) gibt es `webkitSpeechRecognition`, aber `start()` tut nichts; nie nur auf das Vorhandensein prüfen. Der Server merkt sich `api/voice` 60 s: im Browser-Test „Assist aus“ mit `page.route("**/api/voice", …)` statt `/_voice` des Mocks. Playwright 1.64 mit vorinstalliertem Chromium 1243: `ln -s chromium_headless_shell-1243 /opt/pw-browsers/chromium_headless_shell-1248` ging auch.
- Sprachsuche ohne https (#513): `localhost` und `127.0.0.1` gelten im Browser als sicher (`isSecureContext` true). Den echten http-Fall prüft man über die Adresse des Containers (`hostname -I`, z. B. `http://192.0.2.2:<port>/`, Server bzw. `python3 -m http.server --bind <adresse>` für die gebaute Demo); Playwright mit `has_touch=True, is_mobile=True` gibt `pointer: coarse` (Tablet).
- **Nacht-Test (2026-10-25):** Skripte in Python-Playwright gegen die Demo-Datei (`file://…/floorplan3d-demo.html?debug=1`, sonst gibt es kein `window.__fp`). Die Demo merkt sich nichts über ein Neuladen (kein localStorage in `demo-data.js`, nur was die App selbst im localStorage hält, z. B. „Zusammen/Einzeln“). Die Demo hat am Anfang **keine Benutzer-Zeilen** (⚙ → Benutzer & Tablets): erst mit „+“ einen anlegen. Fenster wie `.ctlDlg`/`.calDlg` haben auch die Klasse `ceDlg`: offene mit `.ceDlg[open]` suchen. Maus-Ereignisse außerhalb des Bildschirms kommen nicht an: vorher `scroll_into_view_if_needed()`. Finger-Ziehen: `ctx.new_cdp_session(pg)` und `Input.dispatchTouchEvent`. `page.clock.install()` ließ die Demo hängen (10 Minuten Warten in 82.7 darum echt im Hintergrund). Downloads mit `extra_http_headers` bekommen den Kopf `X-Remote-User-Name` nicht (403): im Test-Add-on lieber über die API prüfen. `pkill -f <muster>` beendet auch die eigene Shell, wenn das Muster im Befehl steht: lieber `kill <pid>`.
- Neue Texte: `python3 tools/add_i18n.py texts.json` (alle 7 Sprachen auf einmal), danach `python3 -m pytest -q tests/test_i18n.py`.
- Neues reines Modul mit Test: in `.github/workflows/ci.yml` in die lange Zeile `for t in … toolicons; do` eintragen.
- Nach jeder Änderung in `floorplan3d/`: `python3 tools/make_manifest.py` (sonst schlägt `tests/test_manifest.py` fehl); danach `graphify update .`.
- **Die Demo** hat keinen Server: `demo/demo-data.js` beantwortet jeden `api/…`-Aufruf selbst (ersetzt `fetch`) und fängt Klicks auf Links `api/…` ab (Downloads). Ein neuer Endpunkt im Add-on braucht dort eine Antwort (oder `ONLY_ADDON`, „nur im Add-on“); sonst sieht der Besitzer in der Demo nur „nicht verfügbar“. Nie `location.href = 'api/…'` (verlässt die Demo), sondern einen Link. Prüfen: die Demo bauen und durchklicken; was fehlt, zeigt ein `fetch`-Mitschnitt der Antworten mit Status 404/501.
- Seit 4.4.0 hat jeder „Live“-Bildschirm die Reiter-Leiste unten (☀ Heute ist immer da). Ein Browser-Test, der unten etwas antippt oder misst, muss das bedenken. `07_tablet` „offline in 3D (#375)“ war lokal einmal rot (die Kugel der fehlenden Lampe noch nicht sichtbar, darum kam das Schild darüber), in der CI grün: ein Zeitproblem des Tests, kein Fehler.
- Ist der Pull Request des Branches gemergt: den Branch neu von `main` starten (`git fetch origin main && git checkout -B <branch> origin/main`) und einen **neuen** Pull Request aufmachen.
