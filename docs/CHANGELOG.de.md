# Änderungen (deutsch)

Die deutsche Fassung von [CHANGELOG.md](../CHANGELOG.md), für den Zeitstrahl (`tools/make_timeline.py`). Jede neue Version kommt in beide Dateien, mit denselben Abschnitten und denselben Punkten (Neu = Added, Verbessert = Changed, Repariert = Fixed, Entfernt = Removed); `tests/test_make_timeline.py` prüft das.

## [4.31.0] - 2026-10-26
### Neu
- **🚆 Die Karte „Zug“: Kommt mein Zug pünktlich?** (#550, der Besitzer: „dass man sich so seine Verbindung reinmacht, um zu schauen, ob morgens der Zug richtig kommt oder nicht … nicht als eigenes Dashboard, sondern als Karte dazu“). Eine neue Kartenart für jede Seite (✎ → „＋ Karte“ → 🚆 Zug): der Bahnhof, die Richtung („über“) und **mein Zug** (seine geplante Abfahrt). Oben steht dein Zug groß: pünktlich in Grün, „+5 Min“ in Gelb, ab 6 Minuten Verspätung in Rot, „fällt aus“, das Gleis (ein geändertes in Gelb, „statt 3“), „in 11 Min“ und der Hinweis der Bahn; darunter die nächsten 3 bis 8 Abfahrten. Die Demo hat eine auf ☀ Heute.
- Das Add-on fragt den freien Dienst, den auch die Home-Assistant-Integration „DB Infoscreen“ nutzt (dbf.finalrewind.org, Daten der Deutschen Bahn, ohne Schlüssel, nichts zu installieren), höchstens einmal pro Minute je Bahnhof für alle Bildschirme zusammen (`api/train`, `trains.py`); wer „DB Infoscreen“ hat, kann stattdessen dessen Sensor wählen. Die alte Integration „Deutsche Bahn“ von Home Assistant geht seit Dezember 2024 nicht mehr.
### Verbessert
- Neue Module `trains.py` (rein, `tests/test_trains.py`), `trains.js` (rein, `tests/trains.test.mjs`), `traincard.js`; die Kartenart `train` in `cards.js` und `boards.py` (auf beiden Seiten dieselben Regeln); der Teil `53_train` des Browser-Tests mit einem nachgebauten Abfahrts-Dienst (`DBF_URL`).

## [4.30.0] - 2026-10-26
### Neu
- **🎨 Szenen für Lampen und LED-Streifen als echte Szenen in Home Assistant** (#549, der Besitzer: „dass auch die Szenen von LED-Streifen und LEDs auch verwaltbar sind über unsere App, aber dann wirkliche … Szenen in Home Assistant … nicht, dass es dann irgendwie Sachen gegenseitig kaputt macht“). ▶ Abläufe hat die Karte **🎨 Szenen**: alle Szenen von Home Assistant mit ▶; „＋ Neue Szene“ öffnet den Szenen-Editor: die Geräte der Szene (Lampen und LED-Streifen zuerst, Schalter, Ventilatoren, Rollläden), jedes an oder aus, seine Helligkeit, eine Farbe (Farbfelder oder Farbwähler), ein Weißton (warm, neutral, kalt), ein Effekt aus der eigenen Liste der Lampe (WLED, Nanoleaf …), die Position eines Rollladens. **📸 Wie jetzt übernehmen** nimmt jedes Gerät, wie es gerade ist, **▶ Ausprobieren** zeigt die Szene sofort, ohne sie zu speichern (`scene.apply`), **✓ Speichern** schreibt sie über den eigenen Szenen-Editor von Home Assistant (`fp3d_s…`), sie ist dort also eine echte Szene, für Automationen, Sprache und die eigenen Dashboards von Home Assistant. Ein echtes Home Assistant hat so eine Szene genau wie gebaut abgespielt (`tools/ha_check.py`).
- **Damit nichts kaputt geht**: Geändert oder gelöscht werden nur die eigenen Szenen des Dashboards (`fp3d_…`), die alte Fassung wird vorher gesichert (`ha-backup/`); eine in Home Assistant gebaute Szene bekommt „📋 Als Kopie bearbeiten“: gespeichert wird eine Kopie, die Szene bleibt, wie sie ist.
### Verbessert
- Neue Module `scenes.py` (rein, `tests/test_scenes.py`), `scenes.js` (rein, `tests/scenes.test.mjs`), `sceneedit.js`, `scenesui.js`; die Adressen `api/scenes/<id>` (lesen, speichern, löschen: Admins) und `api/scenes/try` (nicht für Benutzer, die nicht schalten dürfen); der Teil `52_scenes` des Browser-Tests.
- `tests/test_names.py`: Eine Funktion, die in einer Datei des Add-ons zweimal steht, lässt die Tests scheitern (in 4.29.0 hatte eine neue Hilfsfunktion die des Gartens ersetzt; der Browser-Test fand es vor der Veröffentlichung).

## [4.29.0] - 2026-10-26
### Neu
- **Eigene Abläufe werden echte Automationen in Home Assistant** (#548, der Besitzer: „der Editor soll in unserer App sein … aber es soll dann auch eine echte Home Assistant Automatisierung … daraus werden … nicht, dass wir dann irgendwas kaputt machen“). Der Editor von ▶ Abläufe bleibt, wie er ist (Bausteine wie bei Node-RED); oben steht jetzt, wo der Ablauf läuft: **🏠 Home Assistant** (neue Abläufe) oder **⚙️ Add-on**. Beim Speichern wird jeder Weg als Automation über den eigenen Editor von Home Assistant geschrieben (`fp3d_<Ablauf>_<Weg>`, „Erstellt mit 3D Floorplan“); Home Assistant führt ihn aus, auch ohne das Add-on, und das Add-on führt ihn nicht noch einmal aus. Jeder Baustein hat dort sein Gegenstück (Fenster geht auf, Bewegung, Uhrzeit, Sonne, jemand kommt, ein Wert; zwischen zwei Zeiten, Wochentage, jemand zu Hause, draußen kälter, dunkel; „bleibt so“, warten; schalten und dimmen, Heizung, Rollläden, Szene oder Skript, Nachricht, „im selben Raum“, „wie vorher“ über `scene.create`). Ein echtes Home Assistant hat sie geprüft und laufen lassen (`tools/ha_check.py`).
- **Damit nichts kaputt geht**: Das Add-on schreibt und löscht nur Automationen, deren Kennung mit `fp3d_` beginnt; die anderen Automationen von Home Assistant werden nur gezeigt und geschaltet. Wurde eine seiner Automationen in Home Assistant geändert, fragt das Speichern zuerst „Überschreiben?“, und die alte Fassung wird im Datenordner des Add-ons gesichert (`ha-backup/`, die letzten 20). Was in Home Assistant nicht geht („draußen kälter“ ohne Wetter, „jemand kommt“ ohne Personen), wird gesagt, und dann wird nichts geschrieben. Ein ausgeschalteter oder gelöschter Ablauf schaltet seine Automation aus oder löscht sie.
- **▶ Abläufe**: Ein Ablauf sagt „🏠 Home Assistant“ oder „⚙️ Add-on“; einer in Home Assistant bekommt ↗ (öffnet ihn dort), sein „läuft“ und „zuletzt“ kommen von seiner Automation, sein ▶ startet die Automation. Seine Automationen stehen nicht noch einmal bei denen von Home Assistant; „🔎 Wird benutzt“ zeigt ihn einmal, als Ablauf.
### Verbessert
- Eine Nachricht eines Ablaufs in Home Assistant geht über die Benachrichtigungs-Dienste von Home Assistant aus den Einstellungen; mit WhatsApp oder Telegram (CallMeBot) bittet die Automation das Add-on (Ereignis `fp3d_notify`), das sie schickt.
- Die Seite behält von einer Automation, wann sie zuletzt lief, wie oft sie gerade läuft und ihre Kennung (das fehlte, darum zeigte sich „läuft gerade“ einer Automation erst nach dem Neuladen ihrer Liste).
- Neues Modul `haflows.py` (rein, `tests/test_haflows.py`); der Teil `51_ha_routines` des Browser-Tests prüft Speichern, Nachfragen vor dem Überschreiben, ▶, Ausschalten und Löschen mit einem nachgebauten Home Assistant.

## [4.28.0] - 2026-10-26
### Neu
- **📋 Heiz-Regeln im Dashboard** (#546, Wunsch des Besitzers: „eine Heizungssteuerung … wenn Fenster offen, dann wird Heizung deaktiviert … so ähnlich wie Node-RED, bloß halt in unserem Dashboard“; Bilder `docs/ideen-4.28/`). Im 🌡 Klima neben „Räume“ die Ansicht **📋 Heiz-Regeln**: sieben fertige Regeln zum Einschalten, ihre Zahlen mit − / + änderbar: **Fenster offen → Heizung aus** (nach einigen Minuten, Raum für Raum, auch Türen nach draußen, beim Schließen zurück wie vorher), **Keiner zu Hause → kühler**, **Nachtabsenkung** (einzelne Räume anders), **Heizplan**, **Sommerpause** (draußen einige Stunden warm: aus), der **Boost-Knopf** und **Urlaub** (bis zum Tag der Rückkehr, oder solange der Urlaubs-Alarm scharf ist). Das Add-on führt sie selbst aus, auch ohne offenen Bildschirm (`heatrules.py`, ausgeführt von `rulesrun.py` über eine Websocket-Verbindung zu Home Assistant): Eine Regel stellt ein Thermostat, wenn sich etwas ändert, von Hand Gedrehtes bleibt bis zur nächsten Änderung, was vorher war, kommt zurück, wenn ein Fenster zugeht oder alle wieder da sind; eine Klimaanlage bekommt nur die Fenster-Regel. Welche Thermostate und Fenster zu welchem Raum gehören, kommt aus den Plänen, wie auf der Seite (`roommap.py`).
- **📅 Heizplan**: ein Wochenplan pro Raum mit drei Stufen (💤 Nacht, 🌙 Eco, ☀️ Komfort) und ihren Temperaturen. Ein Tipp wählt einen Block, ein zweiter gibt ihm die nächste Stufe, sein linker Rand lässt sich ziehen; „✂ Teilen“, „🗑 Weg“, seine Anfangszeit, „Di–Fr wie Montag“, „Sonntag wie Samstag“, „Für alle Räume übernehmen“, „Vorheizen“ (ein wärmerer Block beginnt früher), was der Raum jetzt und danach macht.
- **Die Räume sagen, was die Regeln tun**: im 🌡 Klima eine Zeile pro Raum („⏸️ Heizung pausiert · Fenster offen seit 3 Min · danach wieder 22°“ mit **🔥 Trotzdem heizen**, „Boost bis 17:30“, „Heizplan: Komfort 21°“ …), **🚀 Boost** an jedem Raum mit Thermostat und „⏸️ pausiert“ am Schild und an der Kachel des Raums im Haus.
- **🔎 Wird benutzt** für jedes Gerät (am Thermostat im 🌡 Klima, an der Gerätekarte im Haus, im Fenster einer Knopf-Karte): die eigenen Heiz-Regeln und Abläufe des Add-ons, die es benutzen, und die Automationen, Skripte und Szenen von Home Assistant (seine Suche „verwandt“) mit an / aus, „läuft gerade“, wann sie zuletzt liefen und was sie in Worten tun („06:00 → Heizung Wohnzimmer 22°“); eine Warnung, wenn eine Automation dasselbe Thermostat stellt wie eine eigene Heiz-Regel, mit „Die in Home Assistant ausschalten“; ob das Thermostat ein offenes Fenster selbst erkennt (`usedby.py`, `usedbyui.js`).
- **⚙ Eigene Abläufe „Wenn … dann …“**, gebaut wie ein Node-RED-Ablauf: ein Editor mit den Bausteinen zum Antippen links (Wenn: ein Fenster oder eine Tür geht auf, Bewegung, eine Uhrzeit, Sonnenaufgang oder -untergang, jemand kommt oder geht, ein Wert über oder unter, ein Knopf auf der Seite; Nur wenn: zwischen zwei Zeiten, Wochentage, jemand zu Hause, draußen kälter als, dunkel oder hell, ein Gerät ist …; Warten: „bleibt so“ und eine Weile; Dann: Heizung, schalten und dimmen, Rollläden, eine Szene oder ein Skript, eine Nachricht, „wie vorher“), in der Mitte die Wege mit Linien zwischen den Bausteinen und Häkchen, was zuletzt wann lief, rechts der gewählte Baustein (seine Geräte, „im selben Raum wie der Auslöser“), unten der Ablauf in Worten; „▶ Jetzt ausprobieren“, „📋 Aus Vorlage“ (sechs fertige Abläufe). Das Add-on führt sie aus (`flows.py`).
- **▶ Abläufe** zeigt die eigenen Abläufe als Kette (an / aus, „läuft“, wann zuletzt, ▶ bei einem mit Knopf, ✏), die Automationen von Home Assistant mit den Geräten, die sie benutzen, was sie tun und „läuft gerade“ (Admins), und **📜 Was ist passiert**: was die Regeln und Abläufe getan haben.
- Neue Schnittstellen: `api/rules` (lesen; speichern nur Admins), `api/rules/room` (Boost, „Trotzdem heizen“; nicht für Benutzer, die nicht schalten dürfen), `api/rules/run` (der Knopf eines Ablaufs; „Jetzt ausprobieren“ nur Admins), `api/related`, `api/automations` (Admins). Die Regeln und Abläufe kommen ins Backup.
### Verbessert
- Automationen und Skripte sagen der Seite, wann sie zuletzt liefen und ob sie gerade laufen (Live-Kanal); die alte Liste „⚙ Automationen“ der Seite ▶ Abläufe ist jetzt die neue Karte. Neue Module `rules.js` (rein, `tests/rules.test.mjs`), `rulesstore.js`, `rulesui.js`, `heatrulesui.js`, `heatplanui.js`, `routinesown.js`, `flowedit.js`; der Teil `50_rules` des Browser-Tests prüft alles mit dem Add-on.
- Die Demo startet mit eingeschalteter Fenster-Regel: Das Fenster im Wohnzimmer ist offen, darum ist seine Heizung pausiert.

## [4.27.0] - 2026-10-26
### Neu
- **🗄 Schrank-Editor: „Schrank nach Maß“ mit eigenem Editor** (#545, Wunsch des Besitzers vom 2026-10-26: „einen Schrank-Editor, dass man einen individuellen Schrank bauen kann … auch mit Schrägen, dass man den in Dachschrägen einbauen kann … mit allem personalisierbar … im Nachhinein bearbeiten“). Ein neues Stück in der Bibliothek (Gruppe „Schlafen“, zu finden mit „Schrank“, „Dachschräge“, „Kommode“ …): im Plan gesetzt, geht sein **Editor** sofort auf, und später wieder mit „✎ Schrank bearbeiten“ oder einem Tipp auf sein Bild im Seitenfeld. Der Editor zeigt den Schrank von vorne (ein Fach antippen, um es einzustellen), einen Schnitt durch das gewählte Fach von der Seite und mit „🧊 3D“ ein 3D-Bild zum Drehen; „🚪 Türen“ zeigt die Türen oder das Innere; ↶ geht einen Schritt zurück, „Übernehmen“ setzt ihn aufs Stück (ein Rückgängig-Schritt im Plan), „Abbrechen“ ändert nichts.
- **Alles ist wählbar**: Breite, Höhe, Tiefe und Sockel (in cm oder Zoll); bis zu 12 Fächer nebeneinander, jedes mit eigener Breite (oder „⇔ Alle Fächer gleich breit“); innen eine Kleiderstange unter einem Hutboden, zwei Stangen, Einlegeböden (wie viele), nur Schubladen (wie viele) oder nichts, Schubladen unten unter der Tür; eine Tür, Glastür, Spiegeltür oder offen, die Seite der Scharniere; Fächer verschieben, verdoppeln, entfernen, dazunehmen. Dreh- oder Schiebetüren, 4 Arten Griffe (Stange, Knopf, Griffleiste, grifflos) in Edelstahl, Schwarz oder Messing, 10 Farben (Weiß, Kaschmir, Hellgrau, Salbeigrün, Taubenblau, Anthrazit, Schwarz, Eiche hell, Eiche, Nussbaum) oder jede eigene Farbe für den Korpus und für die Fronten, ein LED-Licht innen, das mit der Entität leuchtet. 8 Vorlagen zum Anfangen: Kleiderschrank mit 2 oder 3 Türen, Schwebetürenschrank, Dachschrägenschrank, Kniestockschrank, offenes Regal, Kommode, Garderobe.
- **Unter einer Dachschräge**: bis zu zwei Schrägen (die niedrige Seite links, rechts, hinten oder vorne, die Höhe dort und die Neigung); der Schrank wird daran abgeschnitten, seine Türen und Schubladen auch, Böden und Stangen enden unter dem schrägen Brett. **„📐 An die Dachschräge anpassen“** (im Editor und im Seitenfeld) liest das Dach über dem Platz des Schranks (auf der Dach-Etage oder unter einem Dach mit Kniestock) und stellt Schrägen und Höhe selbst ein, auch bei einem gedrehten Schrank oder einem unter dem First.
- Im 2D-Plan zeigt der Schrank seine Fächer und in Orange, wo er unter einer Schräge niedriger ist; seine zwei Größen-Griffe ändern seine Breite (alle Fächer zusammen) und seine Tiefe. Die Demo hat einen unter dem Dach („Schrank unter der Schräge“ auf der Etage „Dach“, mit Licht an).
- Import und Export einer Grundstücksbeschreibung nehmen den Schrank mit (`"type": "closet"` mit `cab`; `property.schema.json`, `docs/IMPORT.md`, das Musterhaus).
### Verbessert
- Neue Module statt mehr app.js: `closet.js` (die Rechnung: Fächer, Schrägen, die an den Schrägen abgeschnittenen Teile, das Anpassen ans Dach; `tests/closet.test.mjs`), `closetview.js` (die Zeichnungen), `closet3d.js` (das 3D-Modell, ein Netz je Material) und `closetui.js` (Seitenfeld und Editor).

## [4.26.1] - 2026-10-26
### Repariert
- **Die 2D-Ansicht zeichnet das versteckte 3D-Bild nicht mehr** (#542): Wenn nur der Plan auf dem Bildschirm war, wurde das 3D-Bild dahinter trotzdem in jedem Bild neu gezeichnet. Jetzt wird es nur gezeichnet, wenn man es sieht: Die 2D-Ansicht ist leichter für Tablets und PCs (Teil von #138), und der Plan reagiert sofort, wo ein langsames 3D-Bild sein Neuzeichnen aufgehalten hat (der Browser-Test-Teil `48_plot` schlug deshalb ab und zu fehl; seine Prüfung wartet jetzt auch auf das Neuzeichnen). Zurück in der 3D- oder geteilten Ansicht ist das Bild sofort wieder da.

## [4.26.0] - 2026-10-26
### Neu
- **🏡 Das Grundstück und die Flächen darauf** (#538, Wunsch des Besitzers vom 2026-10-26: „draußen Hof und sowas editieren, das Grundstück bemessen, Deko ums Haus, freier und nicht so krampfig“). Das Werkzeug „Grundstück“ zeichnet jetzt das Grundstück oder eine **Fläche** (Außenfläche) mit Belag: ein Hof aus Kopfsteinpflaster, eine gepflasterte Einfahrt, eine Holzterrasse, Steinplatten, Natursteinplatten, Kies, ein Blumenbeet, Beton, Asphalt, Sand, Rasen oder ein Teich, jede liegt im 3D-Bild mit dem Muster ihres Belags auf dem Boden (die Texturen der Böden) und im 2D-Plan in ihrer Farbe mit Name und Größe. Ecke für Ecke oder als **Rechteck mit zwei Klicks** (beim Bewegen wird die Größe angezeigt).
- **Das Grundstück vermessen**: seine Größe in m², sein Umfang, die Länge jeder Seite im Plan (mit dem Werkzeug oder bei ausgewähltem Grundstück), Breite und Tiefe eines rechteckigen Grundstücks zum Eintippen, **„▭ Rechteck ums Haus“** mit einem Abstand in einem Tipp; die Länge jeder Seite des Grundstücks oder einer Fläche zum Eintippen (die nächste Ecke wandert mit, ein Rechteck bleibt ein Rechteck); die Liste der Flächen in der Palette mit ihren Größen und wie viel es von jedem Belag gibt.
- **Bearbeiten wie bei einem Raum**: Das Grundstück (an seinem Rand) und die Flächen (innen) werden mit dem Auswahl-Werkzeug angetippt, verschoben, ihre Ecken gezogen, eine Ecke mit Doppelklick auf eine Seite hinzugefügt und mit Doppelklick darauf entfernt, mit den Pfeiltasten verschoben, mit Entf gelöscht (Strg+Z holt sie zurück) oder mit dem Radiergummi; das Seitenfeld einer Fläche hat Name, Belag, Größe und Seiten. Beim Wählen des Werkzeugs kommt das ganze Grundstück ins Bild.
- **26 Dinge für den Garten** in der Bibliotheksgruppe „Außen“ (`yarddeco.js`): Hecke, Gartenbank, Gartentisch mit 4 Stühlen, Sonnenliege, Sonnenschirm, Kugelgrill, Gasgrill, Feuerschale (ihre Glut leuchtet mit ihrer Entität), Hochbeet, Pflanzkübel, Blumen, Pollerleuchte und Gartenlaterne (leuchten mit ihrer Entität), Trampolin, Sandkasten, Doppelschaukel, Pergola, Gewächshaus, Gartenhaus, Briefkasten, Vogeltränke, Wäschespinne, Trittsteine, Komposter, Lounge-Ecke und ein Gartenzwerg; wie die Bäume mit dem Erdreich aufgeschnitten.
- Import und Export einer Grundstücksbeschreibung nehmen die Flächen mit (`plot.areas`: Name, Belag, Punkte; `property.schema.json`).
### Verbessert
- Die Flächen der Räume im Plan und im Raum-Feld haben jetzt auch das Dezimalkomma („12,5 m²“, #527).
- Das Grundstück ist von `blocks.js` ins neue `plotui.js` umgezogen; reine Logik in `yard.js` (`tests/yard.test.mjs`), die 3D-Flächen in `yard3d.js`.

## [4.25.0] - 2026-10-26
### Neu
- **🚗 Auto und 🌱 Garten auf 🧺 Haushalt** (#533, vom Besitzer gewählt, Bild `docs/ideen-4.3/8-haushalt.jpg`). Das Auto: sein Ladestand mit Balken, „lädt mit 3,2 kW · voll um 17:30“, die Reichweite, „☀ Nur mit Sonne laden“ (der Modus pv / now von evcc oder ein Schalter). Der Garten: der Regen von heute oder morgen, wann zuletzt gegossen wurde, die Bodenfeuchte, „💧 10 min gießen“ je Bewässerungszone (das Add-on dreht sie nach Ablauf wieder zu, auch nach einem Neustart) und „■ Stopp“. Beide werden über ihre Namen gefunden oder in ⚙ → Reiter unten gewählt. Ventile lassen sich jetzt auch aus dem Plan schalten (`valve.open_valve` / `close_valve`).

## [4.24.0] - 2026-10-26
### Neu
- **🗣 Schalten per Sprache** (#532, vom Besitzer gewählt): Ein Befehl in der Sprachsuche (oder ins Suchfeld getippt) schaltet: „Licht im Wohnzimmer aus“, „Mach oben alle Lichter an“, „Rollläden in der Küche runter“, „Fernseher aus“, in allen 7 Sprachen. Lichter und Player an und aus, Rollläden hoch und runter (nie ein Garagentor), nur was nicht schon so ist, mit einem Ring an jedem. Beim ganzen Haus wird erst gefragt („✓ Ja, aus“); eine Frage bleibt eine Frage; die Sperre „Steuern“ wird beachtet.

## [4.23.0] - 2026-10-26
### Neu
- **🔔 Sag mir Bescheid** (#531, vom Besitzer gewählt, Bild `docs/ideen-4.3/8-haushalt.jpg`): Eine laufende Waschmaschine, ein Trockner oder eine Spülmaschine auf 🧺 Haushalt hat den Knopf „🔔 Sag mir Bescheid“; wenn sie fertig ist, schickt das Add-on eine Nachricht auf dem Weg aus ⚙ → Warnungen & Alarm (WhatsApp, Telegram, die Handy-App), auch wenn kein Bildschirm offen ist (es schaut jede Minute nach). „Immer Bescheid sagen“ in ⚙ → Reiter unten meldet jeden Durchlauf. Nie zweimal für einen Durchlauf; ein Wunsch wird nach einem Tag vergessen.

## [4.22.0] - 2026-10-26
### Neu
- **🔔 Die Klingel auf jedem Bildschirm** (#530, vom Besitzer gewählt, Bild `docs/ideen-4.3/6-klingel.jpg`). Wenn jemand klingelt, zeigt jeder Bildschirm in der Live-Ansicht die Kamera an der Tür mit „🔓 Tür öffnen“ und „✕ Schließen“, wacht auf und spielt einen Gong; nach zwei Minuten schließt es sich von selbst. Klingeln werden von selbst gefunden (ein Ereignis der Klasse `doorbell`, ein Binärsensor mit einem Namen wie Klingel), jede mit ihrer Kamera; ⚙ → 📱 Wandtablet → 🔔 Klingel wählt bis zu vier mit Kamera, Türöffner und Namen, und „🔔 Ausprobieren“ zeigt es auf diesem Bildschirm. Beim Öffnen der Tür wird noch einmal gefragt. Ein Benutzer oder Tablet kann davon ausgesperrt werden (🔒 Klingel-Fenster). Die Demo klingelt mit `?klingel=1`.

## [4.21.3] - 2026-10-25
### Verbessert
- **Flüssiger auf Tablets: Die Möbel werden im Live-Modus zusammen gezeichnet** (#138, vom Besitzer gewählt: „Tablet schneller“). Im Live-Modus ändert sich nichts an Möbeln, die mit nichts verbunden sind (keine Entität, keine LED, kein Abschnitt). Darum werden ihre gleich aussehenden Teile auf einer Etage jetzt als eins gezeichnet, das Grau des Sofas mit dem Grau des Regals. Das Musterhaus zeichnet seine Ansicht des ganzen Hauses mit etwa 1.180 statt 1.660 Zeichenaufrufen, mit demselben Bild (denselben Dreiecken). Zurück im Editor ist jedes Stück wieder einzeln und lässt sich verschieben.
### Repariert
- **Zahlen mit Dezimalkomma** (#527): Auf Deutsch haben die Strom-Übersicht, das Energiebild und die Watt an den Kabeln („☀ 3,20 kW“), die Zähler („🚰 1234,6 m³“) und die Werte-Schilder über den Geräten („🌡 21,4 °C“) jetzt ein Komma, wie die Seiten der Reiter-Leiste; auf Englisch bleibt der Punkt.
- **Die Demo bei Nacht** (#528): keine Uhrzeiten, die noch nicht gekommen sind („seit 11:02“ um 2 Uhr nachts ist jetzt gestern), die Sonne macht nachts keinen Strom (der Solarstrom folgt der Sonne am Himmel der Demo, die Batterie gibt, was das Haus braucht), und die Linie „🔋 Ladestand“ springt am Tag der Zeitumstellung um 2 Uhr nicht mehr.

## [4.21.2] - 2026-10-25
### Repariert
Gefunden, als Claude in der Nacht die offenen Punkte des Testprotokolls durchgespielt hat (die Demo in Chromium als PC, Tablet und Handy, manches im Add-on mit einem nachgebauten Home Assistant):
- **⚡ Energie: die Werte eines Balkens per Finger** (#519): Die Werte eines Balkens (ein Haus und ⚖ Vergleichen) waren nur ein SVG-Tooltip, den eine Maus nach einem Moment zeigt und ein Finger nie. Jetzt zeigt ein Tipp oder die Maus irgendwo auf einer Säule ein kleines Kästchen mit dem Tag (oder Monat) und den kWh, beim Vergleichen für jedes Haus; ein Tipp woanders hin räumt es weg (`bartip.js`).
- **🌡 Klima: „zu warm“ / „zu kalt“ mit Thermostat-Kreis** (#520): Seit dem Kreis (4.9.0) zeigte ein Raum, der zu warm oder zu kalt ist, das nirgends mehr an (die farbige große Zahl ist weg), stand aber unter „Nur mit Hinweis“. Jetzt sagt es ein Chip „🌡 zu warm“ (orange) oder „🌡 zu kalt“ (blau).
- **Geräteliste: „▶ läuft“ statt „▶ playing“** (#521): Ein Player ohne App zeigte den rohen Zustand von Home Assistant; jetzt die Wörter aus #492 („läuft“, „⏸ Pause“, „bereit“).
- **Suche: der Ring an einer Lampe unter ihrem Raum-Schild** (#522): Eine Deckenlampe sitzt genau unter dem Schild ihres Raums, das den Ring einer Antwort verdeckte („Ist oben noch Licht an?“). Solange Ringe zu sehen sind, werden die Raum-Schilder blass.
- **⚙ → 🎤 Sprachsuche** (#523): „🩺 Mikrofon-Test öffnen“ (und der Sprung zu einer Gruppe der Einstellungen) setzte das Ziel unter den festen Kopf des Fensters; jetzt steht es darunter. Links in den Fenstern sind in der Akzentfarbe statt im dunklen Blau des Browsers.
- **Live-Karte: Die Zahl neben dem Lautstärke-Regler geht mit** (#524).
- **Demo: die Stromzähler von ⚡ Rechnung mit Name und Stand** (#525).

## [4.21.1] - 2026-10-25
### Repariert
- **iPhone in der Home-Assistant-App: kein leerer Streifen mehr unter der Reiter-Leiste** (#517, der Besitzer: „ganz unten da ein bisschen Abstand … dieses ganze Zeug ein bisschen weiter nach unten verschieben“). Home Assistant hält den Streifen des Home-Balkens am iPhone unter dem Add-on frei, aber iOS gibt dem Add-on denselben Streifen noch einmal, obwohl sein Rahmen gar nicht bis zum unteren Rand reicht; so hielt die Reiter-Leiste (🏠 Haus, ☀ Heute, ⚡ Energie …) ihn ein zweites Mal frei. Das Add-on misst jetzt, was Home Assistant schon freihält, und lässt es weg; die Ansichts-Knöpfe, die Zeile mit Uhrzeit und Wetter und die Raum-Kacheln über dem 3D-Bild halten den Streifen nicht mehr frei, solange die Reiter-Leiste darunter liegt. Alles rückt etwa 30 pt nach unten, das 3D-Bild wird höher. Allein in Safari (oder in der Demo) geöffnet, hält die Leiste den Streifen frei wie bisher.

## [4.21.0] - 2026-10-24
### Neu
- **🔋 Ladestand auf ⚡ Energie** (#515, der Besitzer: „dass man den Batterieladezustand nachvollziehen kann in einer Art Diagramm … alles zusammen sehen oder nur einzeln … auch für unterschiedliche Häuser“). Eine neue Karte zeigt den Ladestand jeder Batterie über den Tag, die Woche, den Monat oder das Jahr, das oben auf der Seite gewählt ist: den Ladestand-Sensor von ⚡ Rechnung, jede Batterie des Plans mit einem Sensor in %, und den Ladestand-Sensor des Energie-Dashboards von Home Assistant. **„Zusammen“** zeichnet eine Grafik mit einer Linie je Batterie, **„Einzeln“** eine kleine Grafik für jede mit dem Band vom niedrigsten zum höchsten Ladestand und wann sie erreicht wurden. Ein Chip je Batterie zeigt ihren Ladestand jetzt und blendet sie mit einem Tipp aus oder wieder ein; ein Finger oder die Maus auf der Grafik zeigt die Uhrzeit und den Ladestand jeder Batterie dort. Die Wahl bleibt auf diesem Gerät (das Wandtablet merkt sich seine, das Handy seine). Ein Haus gewählt: seine Batterien; **„Alle Häuser“** und **„⚖ Vergleichen“**: die Batterien aller Häuser, jede in der Farbe ihres Hauses, der Name des Hauses davor. Ein Haus nur mit Batterie und ohne Zähler bekommt jetzt auch die Seite ⚡ Energie.
- Die Zahlen kommen aus der Langzeit-Statistik von Home Assistant (ein Tag in 5 Minuten, eine Woche und ein Monat stündlich, ein Jahr täglich; neuer Endpunkt `api/energy/levels`); ein Ladestand-Sensor ohne Statistik (kein `state_class`) wird bis zu einer Woche aus seinem Verlauf gelesen.
- Die Demo hat auch im Nachbarhaus eine Batterie.

## [4.20.0] - 2026-10-23
### Neu
- **Das 🎤 ohne https, Plug and Play** (#513, der Besitzer: „das muss ja einfach Plug and Play funktionieren … man kann ja nicht erwarten, dass jemand, der das installiert, noch eine HTTPS-Verbindung drauf macht“). Browser geben einer Seite das Mikrofon nur über https, und keine Seite kommt daran vorbei (Home Assistants eigenes Assist-Fenster und andere Grundriss-Programme haben dieselbe Grenze). Das 🎤 der Tastatur (Gboard, Samsung, iPhone / iPad; am PC Windows + H, am Mac das Diktat) gehört zum Gerät und schreibt in jedes Feld, auch über http://. Wo die Seite also nicht selbst zuhören darf (http://, eine App mit eingebautem Browser wie Fully Kiosk oder die Home-Assistant-App ohne Assist) oder ihr Zuhören fehlschlägt, öffnet das 🎤 das Suchfeld mit der Tastatur und sagt, wie man auf diesem Gerät diktiert; was diktiert wurde, wird nach einer kurzen Pause von selbst gefragt (kein Enter), und am Tablet verschwindet die Tastatur, damit man die ganze Antwort sieht.
- ⚙ → 🎤 Sprachsuche: eine neue Wahl **„Nur das Diktat der Tastatur (geht auch ohne https)“**; „Automatisch“ heißt jetzt: der Browser, sonst Home Assistant Assist, sonst die Tastatur; eine Zeile sagt, wann die Tastatur benutzt wird. Der 🩺 Mikrofon-Test sagt „🎤 mit dem Diktat der Tastatur“, warum die Seite nicht selbst zuhören darf und, als Möglichkeit, was es erlauben würde (https).
### Repariert
- Der Tooltip des 🎤 („Sprachsuche über Home Assistant Assist“ und so weiter) wurde jedes Mal auf den einfachen zurückgesetzt, wenn die Texte der Seite neu gesetzt wurden.

## [4.19.1] - 2026-10-23
### Repariert
- **Das 🎤 hörte nichts** (#511, der Besitzer: „wenn ich aufs Mikrofon drauf drücke, dann hört er nichts … weder auf dem Tablet noch auf dem PC … und alles ist freigegeben“). Apps mit eingebautem Browser (Android WebView: Fully Kiosk, die Home-Assistant-App) haben die Spracherkennung von Chrome eingebaut, aber dort tut sie nichts: kein Start, kein Fehler, und das 🎤 sagte für immer „Ich höre zu …“. Solche Apps werden jetzt erkannt (User-Agent), die Erkennung des Browsers gilt dort als nicht funktionierend, und das 🎤 nimmt **Home Assistant Assist**. Ein Wächter deckt den Rest ab: Eine Erkennung, die nach 5 s (30 s, solange der Browser nach dem Mikrofon fragt) nicht gestartet ist, gilt auf diesem Gerät als nicht funktionierend (im Browser gemerkt), und mit „Automatisch“ hört stattdessen sofort Assist zu (dann wird Home Assistant gefragt, ob es das kann).
- Über **http://** erlauben Browser kein Mikrofon; das 🎤 sagte dann „Das Mikrofon ist gesperrt: erlaube es im Browser“, obwohl es nichts zu erlauben gab. Jetzt sagt es, dass die Seite https braucht und was zu tun ist.
- Das 🎤 bleibt da, wo es nicht zuhören kann (blass), und ein Tipp sagt **warum** (http, eine App ohne Assist, ein Browser ohne Erkennung, Assist nicht eingerichtet) mit einer Zeile „🩺 Mikrofon-Test öffnen“. Vorher fehlte es oder hörte für immer zu.
- Die Aufnahme für Assist wartet nicht mehr ewig, wenn kein Ton kommt („Vom Mikrofon kommt kein Ton“).
### Neu
- **🩺 Mikrofon-Test** in ⚙ → 🎤 Sprachsuche: was dieses Gerät ist und darf (https oder http, der Browser oder die App, die Erlaubnis für das Mikrofon, die Erkennung des Browsers, Assist, welche das 🎤 nimmt), **1. Mikrofon prüfen** (ein Pegelbalken für 6 s, „Das Mikrofon … hört dich“ oder „kommt kein Ton an“, eine Auswahl der Mikrofone, je Gerät gemerkt und auch für Assist benutzt), **2. Erkennung prüfen** (was verstanden wurde, oder warum nicht; es versucht auch die Erkennung des Browsers noch einmal und merkt sich, wenn sie geht), unter jedem Fehler, was zu tun ist (Windows, Mac, Android, iPhone, Fully Kiosk, die Home-Assistant-App, https, ein Chrome-Flag für http), **📋 Ergebnis kopieren** (alles als Text zum Weiterschicken). Reine Logik in `voicediag.js` (Unit-Test), der Bildschirm in `voicecheck.js`.

## [4.19.0] - 2026-10-23
### Neu
- **Sprachsuche** (#509, der Besitzer: „so eine Sprachsuche … drauf drückt und dann sagen kann, welche Fenster sind offen? Und dann wird dir die Ansicht gezeigt …“). Ein 🎤 neben der 🔍 unten links (am Handy im Suchfeld): Sag „Welche Fenster sind offen?“, „Ist oben noch Licht an?“, „Wie warm ist es im Kinderzimmer?“ oder „Wie sieht es im Wohnzimmer aus?“, und die Ansicht geht dorthin: die Etage oder das ganze Haus, der Raum, ein Ring an jedem Ding der Antwort, die Antwort als Zeile („🪟 Fenster · offen: 2“) und eine Liste zum Antippen. „Sind alle Fenster zu?“ zählt die noch offenen auf oder sagt „✓ Fenster: alle zu“; „Wie warm ist es?“ färbt die Räume nach Temperatur. Eine ins Suchfeld getippte Frage wird genauso beantwortet (eine Zeile „💬 …“, Enter). Keine KI: bekannte Wörter in allen 7 Sprachen, die Namen der Räume, Etagen und Häuser der Pläne, der Rest des Satzes darf frei sein (`voicequery.js`, getestet). Es zeigt nur, es schaltet nichts.
- **Codewörter** in ⚙ → 🎤 Sprachsuche: „Wenn ich sage … → meine ich …“, ein oder mehrere Räume, eine Etage oder ein Haus, auch aus einem anderen Haus („Wohnzimmer der Eltern“), für alle oder einen Benutzer („mein Zimmer“).
- **Welche Erkennung**: die eigene des Browsers (Chrome, Edge, Safari; die Aufnahme geht an Google oder Apple) oder, wo es keine gibt (die Home-Assistant-App auf Android, Fully Kiosk, Firefox), **Home Assistant Assist** (Whisper oder Home Assistant Cloud): Das Add-on nimmt 16-kHz-Ton auf und lässt Assist daraus Text machen (`api/voice`, `api/voice/stt`, `voice.py`, getestet). Die Einstellungen sagen, was auf diesem Gerät geht und wie man Assist einrichtet. Auch in der Docker-Version (#489).
- Neue Sperre **„Sprachsuche (🎤)“** je Benutzer; der Server lehnt auch `api/voice/stt` ab.

## [4.18.0] - 2026-10-23
### Neu
- **Eine Seite in eigener Fassung je Benutzer** (#507, der Besitzer: „bei unterschiedlichen Benutzern unterschiedliche Sachen anzeigen“; Bilder `docs/ideen-4.18/`). Jede Seite der Reiter-Leiste (Heute, Energie, Klima, Kameras, Musik & TV, Haushalt, Abläufe, Familie und die eigenen Seiten) kann neben der normalen („👪 Für alle“) bis zu sechs eigene **Fassungen** haben, z. B. „🧒 Kinder“ nur mit dem Kinderzimmer auf 🌡 Klima, oder „📟 Tablet Flur“. Jede Fassung hat ihre eigenen Karten (Reihenfolge, ausgeblendete Karten, eigene Karten, Abschnitte, Größen, Breiten); jeder Benutzer bekommt je Seite eine Fassung, wer keine hat, sieht „Für alle“.
- In ✎ *Bearbeiten* eine lila Leiste **🗂 Fassung** unter der Bearbeiten-Leiste: ein Chip je Fassung (ein Tipp bearbeitet diese), **＋ Neue Fassung** (Name, Symbol, Start mit einer Kopie einer Fassung oder leer, wer sie bekommt), wer die gewählte Fassung sieht, **⚙ Einstellen** (Name, Symbol, Benutzer, 🗑 löschen: ihre Benutzer sehen wieder „Für alle“).
- **👁 Ansehen als …**: der Bildschirm so, wie ein Benutzer ihn sieht, mit seinen Fassungen und Reitern, bis „✕ Zurück“ in der Leiste oben.
- **👥 Wer sieht was**: eine Tabelle Benutzer × Seiten, in jeder Zelle „Für alle“, eine Fassung oder „aus“ (der Reiter ist nicht in der Leiste dieses Benutzers); auch in ⚙ → 👥 Benutzer. Eine Sperre, die einen Reiter wegnimmt, zeigt 🔒. In den Benutzer-Zeilen von ⚙ → 👥 Benutzer eine Auswahl der Fassung neben jedem Reiter, der Fassungen hat.
- Eine Fassung ist keine Sperre: Was ein Benutzer nicht darf, sagen wie bisher die Sperren in ⚙ → 👥 Benutzer.
- Gespeichert in den Einstellungen (`pageVariants`) und je Benutzer in `userTabs.<user>.variants` (auch in `users.json` gemerkt); `api/me` gibt einem Benutzer seine Fassungen; das Löschen einer eigenen Seite nimmt ihre Fassungen mit. Auch in der Docker-Version (#489).

## [4.17.0] - 2026-10-23
### Neu
- **Home Assistant Container (Docker, ohne Supervisor)** (#489, gewünscht von einem Nutzer: „I run Home Assistant as a Docker container … Please support Home Assistant Container“). 3D Floorplan läuft jetzt auch als eigener Container neben Home Assistant: `container/Dockerfile`, `container/docker-compose.yml` und die Schritte in `container/README.md`. Es spricht mit einem langlebigen Zugangstoken (`HA_TOKEN`) unter `HA_URL` mit Home Assistant. Ohne Ingress meldet sich, wer die Seite öffnet, mit seinem Home-Assistant-Benutzer auf der Anmeldeseite von Home Assistant an; das Add-on merkt sich ein eigenes signiertes Cookie (30 Tage, verlängert bei Benutzung), das Token der Anmeldung von Home Assistant wird sofort zurückgegeben. Kopfzeilen, die Ingress schicken würde, zählen dann nichts, und ein in Home Assistant abgeschalteter oder entfernter Benutzer ist sofort draußen. Administratoren und die Benutzer in `EDITORS` dürfen bearbeiten, wie im Add-on. Die obere Leiste hat **Abmelden**. Im Add-on ändert sich nichts. Die Dashboard-Karte braucht weiter den Supervisor; ein *Webseite*-Dashboard zeigt stattdessen die Seite. Die CI baut das Image und prüft seine Anmeldung.

## [4.16.0] - 2026-10-22
### Verbessert
- **Leistungssensoren (W) zählen auch als Zähler, egal ob W oder kWh** (#503, der Besitzer: „kannst du es nicht einfach so machen, dass es egal ist ob W oder kWh, weil oben geht es ja auch“). Home Assistant merkt sich von jedem Leistungssensor mit `state_class` einen zeitgewichteten Mittelwert je Stunde, Tag und Monat; die Seite ⚡ Energie zählt jetzt Mittelwert × Stunden als kWh, auch für die Tage davor. Die Listen „Zähler für den Verlauf“ bieten W-Sensoren für Netz, Sonne und Batterie an. **⤵ Von oben übernehmen** nimmt einen Zähler in kWh des Geräts, wenn es einen gibt, sonst den Leistungssensor selbst; eine Art, die schon einen Zähler hat, bekommt nichts dazu (sonst würde dieselbe Energie doppelt zählen, z. B. ein Netzzähler in kWh und die Netzleistung des Wechselrichters). **＋ Zähler anlegen** wird nur für einen Sensor angeboten, von dem Home Assistant keine Statistik hat. Ein Sensor, der in beide Richtungen misst (+/−), wird nicht genommen (Bezug und Einspeisung derselben Stunde würden sich aufheben).

## [4.15.0] - 2026-10-22
### Neu
- **⤵ Von oben übernehmen: die Zähler der Seite ⚡ Energie aus den Leistungssensoren** (#501, der Besitzer: „einen Knopf …, dass es von oben, was ich eingestellt habe, nach unten auch übernommen wird“). „Zähler für den Verlauf“ braucht Zähler in kWh (die nur steigen), der Strom-Editor oben hat Sensoren in W, darum bot die Liste sie zu Recht nicht an. Der neue Knopf sucht für jeden oben eingestellten Sensor (Netz, Solar, Batterie laden / entladen) seinen Zähler: einen daraus gemachten „Integral“-Helfer von Home Assistant oder einen Zähler in kWh desselben Geräts mit passendem Namen (eine Summe, nicht die des Tages), und nimmt ihn. Wo es keinen gibt, legt **＋ Zähler anlegen** über den Einrichtungsablauf von Home Assistant den Helfer „Integral“ an (W → kWh) und nimmt ihn; er zählt ab dann. Je Art sagt eine Zeile, was passiert ist. Ein Sensor, der in beide Richtungen misst (+/−), bekommt nur einen Zähler, den sein Gerät hat. Server: `counters.py` (getestet), `api/energy/counters`, `api/energy/counter` (nur Bearbeiter).
### Repariert
- **Das Backup sichert jetzt auch die Pinnwand und die Alarm-Einstellungen** (#500, der Besitzer: „sichert das Backup auch alles … auch das, was wir nun neu gemacht haben?“). „Backup herunterladen“ und die automatischen Backups enthielten die Häuser, die Einstellungen (Seiten, Abschnitte, eigene Karten, Anwesenheit …), Bilder und 3D-Modelle, aber nicht die Zettel der Pinnwand, die Einstellungen des Urlaubs-Alarms und der Alarm-Nachrichten. Die sind jetzt drin (`extras`) und kommen beim Zurückspielen wieder; der Code des Alarms und die CallMeBot-Schlüssel bleiben aus der Datei heraus und behalten ihren aktuellen Wert. Ältere Backups werden wie bisher zurückgespielt.

## [4.14.0] - 2026-10-22
### Neu
- **Knöpfe so, wie man sie will** (#495, der Besitzer: „mehr Möglichkeiten, Buttons anzupassen“; Bild `docs/ideen-4.9/7-knoepfe.jpg`). Die eigene Karte *🔘 Knopf* bekommt in *Karte einstellen*: ein **Symbol** (20 zur Wahl oder automatisch), die **Farbe, wenn an** (sieben oder die eigene Farbe der Lampe), die **Form** (▢ Kachel, ◯ Rund, ▭ Pille, Nur Symbol) und **Größe** (S, M, L, XL), was er **zeigt** (Name, Zustand, die Helligkeit als Balken, seit wann: „seit 2 Std.“), was ein **Tipp** tut (an / aus, das Fenster mit der Bedienung, eine Seite öffnen, nichts) und was **langes Drücken** tut (nichts, das Fenster mit der Bedienung, das eigene Fenster von Home Assistant mit dem Verlauf). Ein Knopf kann jetzt auch ein Thermostat, ein Warmwasserbereiter, ein Schloss oder ein Saugroboter sein (ein Tipp öffnet sein Fenster).
- **Das Fenster mit der Bedienung** eines Geräts (`ctlwindow.js`): an / aus, die Helligkeit, Farben und Effekte einer Lampe, der Kreis eines Thermostats, ▲ ■ ▼ und Stellung eines Rollladens, 🔒 / 🔓 eines Schlosses, die Knöpfe eines Players, Ventilators, Saugroboters oder Alarms, eine Szene oder ein Skript zum Starten, *Details* in Home Assistant.
- Die Live-Zustände sagen, wann sich ein Zustand zuletzt geändert hat (`lc`, Sekunden), für „seit wann“.
- Demo: eine eigene Seite *🔘 Knöpfe* mit Knöpfen in jedem Aussehen.
### Repariert
- Die Geräteliste von *Karte einstellen* quetscht ihre Zeilen nicht mehr, wenn das Fenster lang ist.
- CI: Der Browser-Test versucht Chromium zuerst ohne zusätzliche Ubuntu-Pakete (das Runner-Image hat ihre Bibliotheken); ein hängendes `apt-get update` wird vor dem nächsten Versuch gestoppt, statt ihn zu blockieren.

## [4.13.0] - 2026-10-22
### Neu
- **Die Kalender-Karte: mehrere Kalender, jeder in seiner Farbe, und „＋ Termin“** (#495, der Besitzer: „verschiedene Kalender … zusätzlich eine Karte einfach mit Terminkalendern“; Bilder `docs/ideen-4.9/5-kalender.jpg`, `6-kalender-einstellen.jpg`). Eine neue Art eigener Karte *📅 Kalender* (✎ → *＋ Karte*): beliebige Kalender von Home Assistant anhaken und jedem eine Farbe geben (blau, orange, grün, rot, lila, grau); dazu die Zeitspanne (heute + morgen, 7, 14 oder 31 Tage) und die Ansicht: **▦ Woche** (eine Spalte je Tag, die Termine als farbige Blöcke), **☰ Liste** (nach Tagen), **🗓 Monat** (der Monat mit einem Punkt je Termin, ein Tipp auf einen Tag listet ihn auf) oder **Nur nächster Termin** (groß, die zwei danach darunter). Ein Chip je Kalender zeigt, welche Farbe welche ist. **＋ Termin** auf der Karte trägt einen neuen Termin direkt in einen ihrer Kalender ein (Titel, Kalender, Tag, ganztägig oder von / bis; `calendar.create_event` von Home Assistant, für Kalender, die neue Termine annehmen, wie Local Calendar, Google oder CalDAV); die Karte zeigt ihn sofort. Mehrere Kalender-Karten sind möglich, z. B. eine nur mit Annas Kalendern. Die Termine kommen aus `api/calendar/events` (bis zu 10 Kalender und 42 Tage, 5 Minuten gemerkt, frisch nach einem neuen Termin); die Regeln in `calcard.js` (getestet), dieselben in `boards.py`; `controls.py` lässt nur einen Titel, die Daten oder Uhrzeiten (mit Zeitzone) und ein Ende nach dem Anfang durch.
- Demo: ☀ Heute hat eine Kalender-Karte „Diese Woche“ mit den Kalendern Familie, Arbeit Anna, Schule und Geburtstage.

## [4.12.0] - 2026-10-22
### Neu
- **Wer wirklich zu Hause ist** (#495, der Besitzer: „ob jetzt wirklich eine Person im Haus ist … mit dem Handy, dass es sich mit dem WLAN verbindet“; Bild `docs/ideen-4.9/4-anwesenheit.jpg`). Auf 👨‍👩‍👧 Familie listet die Karte jeder Person auf, was sagt, wo sie ist, jeweils mit Uhrzeit und grün (zu Hause) oder grau (weg): das Handy im WLAN des Routers (ein device_tracker von FRITZ!Box, UniFi, Ping …), GPS der Home-Assistant-App, der WLAN-Name, den die App meldet (`sensor.<phone>_wifi_connection` / `_ssid`), und der Raum (Bermuda / ESPresense: `sensor.<phone>_area` / `_room`). Über den Personen *n Personen zu Hause* mit ihren Namen und Räumen, daneben *Wer ist wo im Haus* (die Räume mit dem Handy einer Person oder mit Bewegung / Anwesenheit). In ⚙ → *Reiter unten* → *Wer ist zu Hause*: zu Hause, wenn Home Assistant es sagt (wie bisher), wenn eine Quelle es sagt oder wenn zwei es sagen (sicherer), und die Namen des WLANs zu Hause (`settings.presence`). Die Quellen kommen mit `api/family` (`pages.person_sources`), die Regel steht in `family.js` (getestet).

## [4.11.0] - 2026-10-22
### Neu
- **Abschnitte auf den Seiten, wie die „Abschnitte“ eines Home-Assistant-Dashboards** (#495, der Besitzer: „dass ich so Kartenabschnitte frei auf dem Dashboard platzieren kann mit so Abschnitten“; Bild `docs/ideen-4.9/3-abschnitte.jpg`). In ✎ macht der neue Knopf *＋ Abschnitt* einen Abschnitt mit Name, Symbol und Breite (normal: eine Spalte Karten, breit: zwei); ⠿ zieht eine Karte in einen Abschnitt, zwischen Abschnitte und wieder darüber; ein Abschnitt hat ‹ › zum Verschieben, ✏️ zum Umbenennen und 🗑 zum Entfernen (seine Karten stehen wieder darüber). **Die Ecke ↘** jeder Karte in ✎ macht sie breiter oder schmaler (eingebaute Karten: `widths`, eigene Karten: ihre Breite). Geht auf jeder Seite, eingebaut oder eigen, für alle gespeichert (`pageLayouts.<page>.sections`, `.widths`; die Regeln in `sections.js`, getestet, dieselben in `boards.py`). *Wie am Anfang* entfernt auch die Abschnitte und Breiten.

## [4.10.0] - 2026-10-22
### Neu
- **⚖ Vergleichen: der Strom mehrerer Häuser in einer Grafik** (#495, der Besitzer: „wenn man mehrere Häuser hat mit unterschiedlichen Stromsensoren, dass es dann auch in einer Grafik irgendwie zu sehen ist“; Bild `docs/ideen-4.9/2-strom-haeuser.jpg`). Auf ⚡ Energie mit mehr als einem Haus ein Chip *⚖ Vergleichen* neben *Alle zusammen*: jedes Haus mit seinen eigenen Zählern (⚡ Rechnung; das erste Haus ohne eigene nimmt die des Energie-Dashboards von Home Assistant, ein späteres keine, damit nichts doppelt zählt), jedes in seiner Farbe: eine Kachel je Haus (kWh im Zeitraum, die Leistung jetzt) und die Summe, heute eine Linie je Haus durch die Stunden, Woche / Monat / Jahr ein Balken je Haus und Tag / Monat, die Leistung jedes Hauses jetzt, die Kosten jedes Hauses. Eine einzige Anfrage an die Statistik von Home Assistant für alle Häuser (`energycompare.js`, die Regeln in `energyhistory.js`, getestet).
- **Verlaufs-Karte mit mehreren Sensoren** (#495): Die eigene Karte *Verlauf* nimmt bis zu sechs Sensoren (`more`), jeder eine Linie in seiner Farbe auf einer Skala, mit Legende und dem Wert jetzt, z. B. die Leistungssensoren jedes Hauses.
- Demo: Das Nachbarhaus hat einen eigenen Zähler, Preis und Leistungssensor, so zeigt *⚖ Vergleichen* beide Häuser.
### Repariert
- CI: Der Browser-Test scheitert nicht mehr vor dem Start, wenn ein Paket-Server des GitHub-Runners mit 403 antwortet oder hängt (diese Quelle wird weggelassen, ein neuer Versuch wartet, bis das hängende apt-get die Paket-Sperre loslässt).

## [4.9.0] - 2026-10-22
### Neu
- **Das Thermostat als Kreis wie in Home Assistant** (#495, der Besitzer: „wie in Home Assistant selbst mit so einem Kreis, wo man Plus und Minus machen kann … Heizen, Auto und Aus“; Bild `docs/ideen-4.9/1-thermostat.jpg`). Auf 🌡 Klima zeigt jeder Raum mit Thermostat einen Kreis: der Sollwert in der Mitte, die Temperatur jetzt auf dem Ring; den Knopf ziehen (oder auf den Ring tippen) oder − / + benutzen (mehrere Tipps werden ein Aufruf); darunter die Modi, die das Gerät anbietet (🔥 Heizen, ❄️ Kühlen, ⟳ Auto, 💧 Entfeuchten, 🌀 Lüfter, ⏻ Aus), seine Voreinstellungen (Komfort, Eco, Abwesend …) und Lüfterstufen. **Groß oder klein**: In ✎ macht der Knopf ⤡ den Kreis eines Raums klein (Kreis, − / + und die Modi als Symbole daneben), ⤢ wieder groß, für alle (`pageLayouts.<page>.sizes`). Die eigene Karte „Thermostat“ zeichnet denselben Kreis, mit *Größe des Kreises: Groß / Klein* in ihren Einstellungen. Ein Warmwasserbereiter zeigt seinen Sollwert auf dem Kreis, ohne ihn zu stellen. Die eigene Temperatur des Raums steht darunter, wenn sie von der des Thermostats abweicht.

## [4.8.2] - 2026-10-22
### Repariert
- **Tablets langsam, seit alles in einem Programm ist** (#494, der Besitzer: „kann sein, dass irgendwie die Performance darunter gelitten hat“). Gemessen in der Demo mit Sensoren, die sich viermal pro Sekunde ändern: Die Arbeit je Änderung ging von etwa 10 auf 3 ms auf ☀ Heute herunter, von 7 auf 1–2 ms auf den anderen Seiten und von 8 auf 6 ms auf 🏠 Haus.
  - Ein Zustand von Home Assistant zeichnet jetzt **ein** neues Bild des 3D-Bilds, statt es 15 Sekunden lang mit voller Geschwindigkeit laufen zu lassen: Ein Leistungssensor, der alle paar Sekunden meldet, hielt ein Tablet den ganzen Tag bei 60 Bildern pro Sekunde. Das Bild anfassen, eine Tür oder ein Rollladen in Bewegung und der Stromfluss laufen weiter flüssig.
  - Solange eine Seite der Reiter-Leiste über dem Haus liegt, wird das Haus (Raum-Kacheln, Schilder, Lampen, Etagen-Karten …) nicht mehr bei jeder Änderung aufgefrischt; es holt das nach, wenn es wieder zu sehen ist. Die Warnungen bleiben live.
  - ☀ Heute zeichnet nur die Karte, deren Inhalt sich geändert hat (ein neuer Stromwert: nur *Strom jetzt*), und das Raster einer Seite misst seine Karten alle auf einmal statt eine nach der anderen; hat sich nichts geändert, wird gar nichts gemessen.
  - Die Geräte einer Etage werden einmal je Änderung ermittelt, nicht noch einmal für jeden Raum.

## [4.8.1] - 2026-10-22
### Repariert
- **Zustände auf Englisch in der Geräteliste** (#492, beim Prüfen der Demo gefunden): Ein Saugroboter sagte „docked“, ein Anwesenheitssensor „on“. Die Geräteliste, die Schilder über den Geräten und die Zustandszeilen sagen jetzt „An der Station“, „An“ / „Aus“, „zu Hause“ / „unterwegs“, bei einem Player „läuft“ / „Pause“, bei einer Kamera „bereit“ und den Zustand einer Alarmanlage in der Sprache der Seite; andere Zustände bleiben so, wie Home Assistant sie sagt.
- Demo: Die Standbilder der Kameras tragen nicht mehr den Namen der Kamera, der auf der Kamera-Seite hinter dem Namen hervorschaute.

## [4.8.0] - 2026-10-22
### Neu
- **🎵 Musik & TV** (#490, Paket 3 von 3 aus dem Wunsch des Besitzers „kannst du die anderen reiter auch machen“, Bild `docs/ideen-4.3/7-musik.jpg`): eine Karte je Player mit seinem Raum, was läuft, seinem Bild (über das Add-on: `api/media/<player>/picture`), ⏮ ⏯ ⏭, an / aus, Quelle und Lautstärke; **Alles stopp**; **Räume zusammen** (`media_player.join` / `unjoin`, für Player, die das können); **Radiosender** als Knöpfe (⚙ → *🗂 Reiter unten*: ein Name und ein Stream oder eine `media-source://`-Adresse; ein Tipp fragt, auf welchem Player, `media_player.play_media`).
- **🧺 Haushalt** (#490, `8-haushalt.jpg`): Waschmaschine, Trockner und Spülmaschine über ihre Namen gefunden (oder in ⚙ gewählt): ihr eigener Zustand, Programm, Endzeit und Fortschritt, oder, nur mit einer Steckdose, *läuft seit* / *fertig seit* aus dem Verlauf von Home Assistant (das Add-on entscheidet: `household.py`, `api/household`); **✓ Ausgeräumt** für jeden Bildschirm und eine Zahl am Reiter, solange eine fertig ist; die Saugroboter; die **Einkaufsliste** von Home Assistant (`todo.*` über `api/todo`: abhaken, hinzufügen, leeren; jeder darf); die Müll-Karte von ☀ Heute.
- Reiter können eine Zahl tragen (die fertigen Maschinen des Haushalts).

## [4.7.0] - 2026-10-21
### Neu
- **Vollbild für einen Benutzer fest an, nur ein Code beendet es** (#487, Wunsch des Besitzers: „dass der Benutzer den Vollbildmodus sozusagen dauerhaft anhat und ihn selbst nicht deaktivieren kann … nur mit einem Code“). Benutzer-Fenster → ⚙ des Benutzers → *🔒 Gesperrt* → **Vollbild verlassen**; unter den Benutzern der **Code für das Vollbild** (4 bis 8 Ziffern, einer für alle Bildschirme, vom Add-on verschlüsselt in `fullscreen.json` gemerkt, `api/fullscreen`). Dieser Bildschirm zeigt ein Blatt *Tippen für Vollbild*, bis er im Vollbild ist; im Vollbild heißt der Knopf rechts 🔒 *Vollbild beenden* und öffnet ein Tastenfeld: Ein falscher Code wird abgelehnt (5 falsche: alle warten 5 Minuten), der richtige beendet es, bis ⛶ wieder getippt wird, die Seite neu geladen wird oder 10 Minuten lang niemand den Bildschirm berührt. Wer es anders verlässt (Esc, Wischen, die Zurück-Taste), bekommt sofort das Blatt zurück; Chrome hält auch Esc fest. Ein Browser, der das Vollbild verweigert, wird nie ausgesperrt. Geht am besten zusammen mit Bildschirmfixierung (Android), Geführtem Zugriff (iPad) oder einem Kiosk-Browser, weil keine Webseite die Home-Taste aufhalten kann. Die Demo zeigt es mit `?vollbild=1` (Code 1234).

### Verbessert
- Im Vollbild heißt der Knopf rechts in der Leiste **Vollbild beenden**.

## [4.6.0] - 2026-10-21
### Neu
- **Die Seiten der Reiter-Leiste angeordnet wie ein Home-Assistant-Dashboard** (#484, Wunsch des Besitzers: „dass ich als Admin die einzelnen Dashboards bearbeiten kann wie im HA-Dashboard“; seine Wahl nach den Beispielbildern in `docs/ideen-4.6/`: alles davon, für alle gleich). Bearbeiter bekommen **✎ Bearbeiten** in der Leiste jeder Seite (☀ Heute, ⚡ Energie, 🌡 Klima, 📷 Kameras, ▶ Abläufe, 👨‍👩‍👧 Familie): eine Leiste oben, jede Karte mit **⠿** (an einen anderen Platz ziehen) und **👁** (ausblenden), **↺ Wie am Anfang**, **✓ Fertig**. Die Karten rücken zusammen wie eine Mauer.
- **Eigene Karten, zwölf Arten**: Knopf (Szene, Skript oder Gerät mit einem Tipp), Schalter, Wert, Verlauf (eine Linie über 6 h, 24 h, 7 oder 30 Tage aus dem Verlauf von Home Assistant), Licht (an / aus, Helligkeit), Thermostat (− / +), Rollladen (▲ ■ ▼), Kamera, Mehrere Geräte, Raum (wie eine Raum-Kachel), Text und Fertige Karte (Wetter, Müll, Pinnwand … von ☀ Heute). „＋ Karte hinzufügen“ → die Art → das Gerät aus einer Liste, die beim Tippen sucht (nur passende Geräte), Name, Breite (normal, breit, sehr breit, ganze Reihe), Zeitspanne und Farbe, mit Vorschau; ⚙️ ändert eine eigene Karte, 🗑 löscht sie.
- **Eigene Seiten**: Im Bearbeiten-Modus macht **🗂 Reiter** die Leiste zum Editor: die Reiter in ihre Reihenfolge ziehen, **＋ Seite** macht eine eigene Seite (Name, Symbol, leer, mit den Geräten eines Bereichs oder mit den Karten von ☀ Heute, ihr Platz in der Leiste), ein Tipp auf eine eigene Seite benennt sie um oder löscht sie. Eigene Seiten lassen sich wie die anderen je Benutzer abhaken (⚙ → Benutzer & Tablets).
- Das Add-on merkt sich das in den Einstellungen (`pageLayouts`, `customTabs`, `tabOrder`, geprüft in `boards.py`) und fragt Home Assistant nach dem Verlauf für eine Karte „Verlauf“ (`api/history`, 2 Minuten gemerkt).

## [4.5.0] - 2026-10-21
### Neu
- **🌡 Klima** (#483, Paket 2 von 3 aus dem Wunsch des Besitzers „kannst du die anderen reiter auch machen“): eine Karte je Raum mit seiner Temperatur (blau, wenn zu kalt, orange, wenn zu warm), dem Sollwert seines Thermostats mit − / + (mehrere Tipps werden ein Aufruf), ob er heizt oder kühlt, der Luftfeuchte, der Luft (CO₂: „Luft gut“ oder „Lüften“ ab der dritten Stufe der CO₂-Farbskala, normal 1200 ppm) und einem offenen Fenster oder einer offenen Tür beim Heizen, mit **Heizung aus**; *Alle Räume* / *Nur mit Hinweis*; darunter die Thermostate und Warmwasserbereiter in keinem Raum (das Warmwasser einer Wärmepumpe) und ein Tipp. Ein Tipp auf den Namen eines Raums zeigt ihn im Haus.
- **▶ Abläufe** (#483): ein großer Knopf je Szene, Skript und Taste von Home Assistant (✓, wenn gestartet; ⚙ → *🗂 Reiter unten* wählt sie aus, keine angehakt: jede Szene und jedes Skript), und die zwei Prüfungen **Ich gehe** und **Gute Nacht**: Bevor sie starten, zeigen sie, was noch offen oder an ist (Fenster und Türen, Lichter, ein Fernseher oder Lautsprecher, der spielt, ein offenes Schloss), mit **Alles aus** (Lichter und Player aus, dann der Ablauf, der in ⚙ mit der Prüfung verbunden ist) und **Trotzdem starten** (nur dieser Ablauf). Bearbeiter können die Automationen von Home Assistant an- und ausschalten (nicht bearbeiten).
- **👨‍👩‍👧 Familie** (#483): jede Person von Home Assistant mit Bild (oder einem farbigen Buchstaben), wo (zu Hause, eine Zone, weg), seit wann und der Akku des Handys (der Akkusensor des Handys aus dem Tracker der Person, rot unter 20 %), daneben die **Pinnwand**: Zettel für alle, vom Add-on gemerkt (`pinboard.json`, höchstens 30, der älteste fällt weg), mit wer ihn geschrieben hat und wann, vier Farben, ✕ nimmt einen ab (jeder darf, wie bei einer echten Pinnwand zu Hause), **auch aufs Handy schicken** über den Weg von *Benachrichtigung bei Alarm*, wenn der eingerichtet ist. Die neuesten Zettel stehen auch auf ☀ Heute (ein Tipp führt zur Familienseite).
- Ein Benutzer, der nicht schalten darf (Sperre *Steuern*), bekommt keine Klima- und keine Abläufe-Seite; jede Seite lässt sich wie die anderen je Benutzer abhaken.
- Das Add-on fragt Home Assistant nach den Personen mit ihren Handys (`api/family`, eine Minute gemerkt) und ihren Bildern (`api/family/<person>/picture`, nur die selbst hochgeladenen Bilder von Home Assistant und sein `www`-Ordner), merkt sich die Zettel (`api/pinboard`), lässt `automation.turn_on` / `turn_off` für Bearbeiter durch und schickt die Sollwerte der Warmwasserbereiter an die Seite.

## [4.4.0] - 2026-10-21
### Neu
- **☀ Heute, die Startseite der Reiter-Leiste** (#481, Wunsch des Besitzers: „kannst du die anderen reiter auch machen“, Paket 1 von 3): Uhrzeit und Datum groß, das Wetter jetzt und die nächsten fünf Tage (die Vorhersage von Home Assistant), die Termine von heute und morgen aus den Kalendern, die nächste Müllabfuhr aus einem eigenen Kalender, wer zu Hause ist (und wo, nach Zone), **Im Haus** mit dem, was einen Blick braucht (Türen und Fenster offen, Lichter an, die Alarmanlage scharf, Batterien schwach, Geräte offline; ein Tipp führt im Haus dorthin) und der Strom jetzt (ein Tipp öffnet ⚡ Energie). ⚙ → **🗂 Reiter unten** wählt die Kalender (keiner angehakt: alle) und den Müll-Kalender; der Schalter der Leiste ist auch dorthin umgezogen.
- **⚡ Energie, der Verlauf** (#481): heute nach Stunden, eine Woche oder ein Monat nach Tagen, ein Jahr nach Monaten, aus der Langzeit-Statistik von Home Assistant: verbraucht, von der Sonne, aus dem Netz, eingespeist, wie viel das Haus selbst gemacht hat (%), was es gekostet hat, Balken mit dem Anteil von Sonne und Batterie und dem aus dem Netz, die Geräte, die am meisten verbraucht haben (die Geräte des Energie-Dashboards), Gas und Wasser; ‹ › geht in der Zeit zurück, jede Kachel im Vergleich mit dem Zeitraum davor (bisher: „gestern um die Zeit“). Mit mehreren Häusern ein Chip je Haus und **Alle zusammen** (jeder Zähler einmal gezählt).
- **Zähler und Preise je Haus** (#481): Bearbeiten → Strom-Editor → ⚡ Rechnung → **Zähler für den Verlauf**: die Zähler (kWh, Gas und Wasser in m³) und Preise dieses Hauses; leer: die des Energie-Dashboards von Home Assistant (das gibt es nur einmal, ein zweites Haus braucht hier also eigene). **⤵ Aus dem Energie-Dashboard übernehmen** kopiert sie herein.
- Das Add-on fragt Home Assistant nach den Zählern des Energie-Dashboards (`api/energy/meters`), ihrer Statistik (`api/energy/stats`), der Wettervorhersage (`api/forecast`, 15 Minuten gemerkt) und den Kalendern und ihren Terminen (`api/calendars`, `api/agenda`, 5 Minuten gemerkt); ein Benutzer, für den die Energie gesperrt ist, bekommt keine Energie-Seite, und der Server verweigert ihm die Daten.

### Verbessert
- Die Reiter-Leiste scrollt seitlich, wenn sie mehr Reiter hat, als hineinpassen (Handys).

## [4.3.0] - 2026-10-21
### Neu
- **Reiter-Leiste unten: das Add-on als einziges Dashboard, Schritt 1** (#479, Wunsch des Besitzers: „nur noch dieses Programm … keine anderen Dashboards mehr“): im Live-Modus eine Leiste ganz unten mit **🏠 Haus** (das 3D-Bild wie immer) und **📷 Kameras**, einer Seite mit jeder Kamera des Plans als große Kachel (Standbild, erneuert, solange die Seite offen ist), die mit Bewegung zuerst, die Bewegungsmelder darunter; ein Tipp zeigt die Kamera groß und live, mit *Alle Kameras*, *Im Plan zeigen* und dem eigenen Fenster von Home Assistant. Solange eine Seite offen ist, ruht das 3D-Bild (kein Zeichnen, wie bei ausgeschaltetem Bildschirm). Der Kamera-Knopf oben öffnet im Live-Modus diese Seite (im Editor bleibt die Ausklappliste). Keine Leiste beim Bearbeiten, in der Dashboard-Karte (außer gewünscht) oder wenn es nur das Haus gibt. Weitere Reiter folgen Schritt für Schritt (Heute, Energie für mehrere Häuser, Klima, Musik, Haushalt, Abläufe, Familie: Beispielbilder in `docs/ideen-4.3/`, Plan in `docs/PLAN-4.3.md`).
- **Reiter je Benutzer** (#479, „es soll ja aber auch noch administrativ verwaltet werden“): ⚙ → *👥 Benutzer & Tablets* → ⚙ eines Benutzers: ein Haken je Seite (*Reiter unten*) und *Fängt an mit* (der Reiter, mit dem der Bildschirm anfängt und zu dem er nach den Minuten von *Zurück zur Startansicht* zurückkehrt). Auch in `users.json` gemerkt. Ein Benutzer, der die Kameras nicht sehen darf (Sperre), bekommt keine Kamera-Seite. ⚙ → *Wandtablet* → *Reiter-Leiste unten* schaltet die Leiste für alle aus.
- **⛶ Vollbild** rechts in der Leiste, wo der Browser es erlaubt (auch in der Dashboard-Karte).
- **Ein Tablet einrichten** (⚙ → *Wandtablet* → *📱 Tablet einrichten*): die Schritte für eine Startseite im Vollbild ohne die Seitenleiste von Home Assistant, mit dem Text der Karte zum Kopieren.
- **Dashboard-Karte**: `tabs: true` zeigt die Reiter-Leiste in der Karte; `kiosk: true` macht ein Wandtablet daraus: Die Seitenleiste von Home Assistant und die obere Leiste des Dashboards werden für Benutzer ohne Admin-Rechte ausgeblendet (zum Ausprobieren; `?kiosk=off` in der Adresse hebt es auf). Beides im Editor der Karte unter *In der Karte zeigen*.

### Verbessert
- Die Demo hat keinen Live-Stream ihrer Kameras und sagt das jetzt sofort, so zeigt eine groß geöffnete Kamera gleich ihr Standbild.
- **Auf dem Weg in den HACS-Store**: Der Workflow *Validate* lässt die eigene Prüfung von HACS über dieses Repository laufen (täglich, bei jedem Push auf `main` und bei jedem Pull Request); was noch zu tun ist, und den Antrag an HACS, den nur der Besitzer stellen kann, steht in `docs/HACS-STORE.md`.

## [4.2.1] - 2026-10-21
### Verbessert
- **Eine Auswahlliste mit wenigen Möglichkeiten zeigt sie als Knöpfe** (#474): Die Live-Karte einer Auswahlliste (`input_select` / `select`, z. B. ein Hausmodus *Zu Hause / Abwesend / Urlaub / Nacht*) hatte nur eine Ausklappliste, *Urlaub* war also kein Knopf zum Antippen. Bis zu 6 Möglichkeiten stehen jetzt als Knöpfe nebeneinander wie die Voreinstellungen eines Ventilators, die gewählte hervorgehoben; längere Listen bleiben eine Ausklappliste. Ihre Kugel zeigt ☰ statt eines einfachen Punkts.
- **Messen: *Lichter Abstand* heißt jetzt *Innenmaß (Wand bis Wand)*** (Englisch: *Inside distance (wall to wall)*): Wunsch des Besitzers, der alte Name war ein Wort vom Bau. Dieselben einfachen Wörter in jeder Sprache.

### Repariert
- **Demo: Der Saugroboter war nicht zu finden** (#473): Er stand in der Küche genau unter der Treppe. Jetzt steht er vor der Küchenzeile. Der Hausmodus der Demo ist von der vollen Außenwand des Büros (neben den Schildern der Zähler) an seine Innenwand umgezogen.
- **Demo: keine Klimaanlage, die kühlt**: Das einzige Thermostat der Demo heizt (aus / heizen / auto), darum zeigte eine damit verbundene Split-Klimaanlage kein *Kühlen*, was für so ein Gerät richtig ist. Das Büro der Demo hat jetzt eine eigene Klimaanlage (kühlen, heizen, entfeuchten, Lüfter, auto, Voreinstellungen und Lüfterstufen), die kühlt und heizt.

## [4.2.0] - 2026-10-21
### Neu
- **Licht aus für das ganze Haus oder eine Gruppe von Räumen** (#471): Solange Lichter an sind, zeigt sich oben **💡 n an**. Ein Tipp listet **Ganzes Haus** und deine **Licht-Gruppen** (mehrere Räume zusammen, z. B. *Kinder* oder *Oben*), jede mit wie vielen ihrer Lichter an sind, 👤, wenn jemand in einem ihrer Räume ist, und **Aus**. Damit nichts aus Versehen ausgeht, fragt der erste Tipp nur (**Sicher? Aus**), der zweite innerhalb von drei Sekunden schaltet nur die Lichter dieser Zeile aus. Die Gruppen werden in ⚙ → **⭐ Schnellzugriff** → *Licht-Gruppen* eingerichtet (ein Name und die Räume, nach Etage angehakt). Am Handy ist der Knopf in der 📊-Liste.
- **Favoriten** (#471): die meistbenutzten Geräte und Szenen als Knöpfe am Anfang der Leiste unten im Live-Modus, vor den Raum-Kacheln (auch wenn die Raum-Kacheln aus sind). Ein Tipp startet eine Szene, ein Skript oder eine Taste oder schaltet ein Licht, einen Schalter, Ventilator, Rollladen oder Player um; eine leuchtende Lampe leuchtet in ihrer Farbe. Eingestellt mit **☆** auf der Karte eines Geräts im Live-Modus oder in ⚙ → *Schnellzugriff* → *Favoriten* (über den Namen hinzufügen, ↑ ↓, ×), höchstens 16. Ein Schloss oder eine Alarmanlage ist nie ein Favorit.
- **„Was ist noch an?“** (#471): Die Geräteliste (📋) hat den Filter **💡 An / offen**: Lichter, Schalter, Ventilatoren, Player und Saugroboter, die laufen, und offene Türen und Fenster.
- **Schwache Batterien fallen auf** (#471): **📋 Geräte · 🪫 n** wird orange, und ein Tipp öffnet die Liste bei **🔋 Batterie** mit den leersten zuerst.
- **Rückgängig nach dem Löschen** (#471): Im Editor zeigt sich sechs Sekunden lang **Gelöscht · ↶ Rückgängig**, nachdem etwas gelöscht wurde (mehreres auf einmal: *3 Teile gelöscht*); der Knopf holt es zurück, praktisch an einem Tablet ohne Strg+Z.
- **Alle Tasten auf einer Karte** (#471): **?** im Editor oder *⌨ Alle Tasten* unter *Steuerung* listet jede Taste (Werkzeuge, Rückgängig, Kopieren, Verschieben um 1 cm / 10 cm, Etagen …).
- **Zuletzt benutzt** (#471): Die zuletzt gesetzten Stücke stehen oben in der Möbel-Bibliothek (*Alle*, keine Suche), je Browser.

## [4.1.4] - 2026-10-20
### Repariert
- **Räume wurden im 2D-Plan mit Temp., Feuchte oder CO₂ schwarz** (#467): Die Farbe des Messwerts eines Raums wurde dem Plan als Zahl übergeben, die dort keine Farbe ist, darum wurde jeder Raum mit Sensor dunkelgrau oder schwarz gezeichnet statt in der Farbe seiner Temperatur, Feuchte oder seines CO₂ (in jedem Design). Jetzt zeigt der Plan die Farbe des Messwerts und *Normal* wie bisher die Farbe des Bodens.

## [4.1.3] - 2026-10-20
### Repariert
- **„Im Bild: Raum-Schilder“ schien in der Ansicht des ganzen Hauses nichts zu tun** (#464): In *Ganzes Haus* gibt es keine Raum-Schilder (über jedem Raum jeder Etage würden sie sich stapeln), und bisher zeigten sich dort stattdessen die Kugeln und Werte-Schilder der Geräte, wie bei *Geräte*. Jetzt zeigt das Bild des ganzen Hauses, wie der Besitzer es gewählt hat, mit *Raum-Schilder* nichts: keine Kugeln, keine Werte-Schilder, keine Raumnamen, nur die Etagen-Karten neben dem Haus (Räume, Lichter an, Fenster offen; ein Tipp öffnet die Etage). *Im Bild: Geräte* zeigt die Geräte im ganzen Haus wie bisher.

## [4.1.2] - 2026-10-19
### Repariert
- **„Im Bild: Raum-Schilder“ tat in der Demo nichts** (#462): Die Demo startet am PC oder Tablet im Bearbeiten-Modus, und Raum-Schilder und Raum-Kacheln zeigen sich nur im Live-Modus, darum änderte ein Tipp auf *Ansicht* → *Im Bild: Raum-Schilder* (oder *Raum-Kacheln*) nichts Sichtbares. Im Bearbeiten-Modus schaltet der Tipp sie jetzt ein und wechselt in den Live-Modus, wo sie zu sehen sind (auch im Add-on). Im Live-Modus schaltet er sie wie bisher ein und aus.
- **Die Demo hat, was fehlte** (#462): **🛡️ Sicherheit** spielt zwei aufgezeichnete Tage ab (gestern und heute bis jetzt) statt *Die Aufzeichnung konnte nicht geladen werden*; **Geräte → Batterie** listet die Batterien der Fenster-, Tür- und anderen Sensoren auf (zwei fast leer); **🗄️ Backup → Backup herunterladen** speichert die Häuser und Einstellungen der Demo als echte Backup-Datei des Add-ons (vorher verließ es die Demo zu einer Fehlerseite), ⬇ eines aufgezeichneten Tages speichert seine Datei; **Import** zeigt die Beispiele, und der KI-Prompt listet jede Geräteart auf; *Version → Jetzt prüfen (auch mit GitHub)* antwortet. Was nur das Add-on kann (ein Haus aus JSON bauen, ein Backup zurückspielen, ein Haus exportieren), sagt das, statt die Seite zu verlassen: *Häuser → Als Datei exportieren* ist jetzt ein Download-Link, keine neue Adresse.

## [4.1.1] - 2026-10-18
### Verbessert
- **Der Urlaubs-Alarm sperrt den Besitzer nicht aus** (#460): Benutzer, die bearbeiten dürfen, bekommen keinen Sperrbildschirm mehr, wenn er scharf ist. Stattdessen sagt **ein roter Streifen oben** im Bild *Urlaubs-Alarm wird scharf in … s*, *ist SCHARF · seit …*, welche Tür offen ist und die restlichen Sekunden, oder *ALARM*, und **ein roter Rahmen** läuft um den ganzen Bildschirm (bei Alarm blinkend); der Plan lässt sich wie gewohnt benutzen. Ein Tipp auf den Streifen (oder den 🛡-Knopf) öffnet das Tastenfeld zum Ausschalten. Wandtablets (Benutzer, die nicht bearbeiten dürfen) bekommen weiter den halb durchsichtigen Sperrbildschirm; *Nur ansehen* ist weg.
- **Woher jedes Nachrichtenziel kommt** (#460): Mit *Senden über* → *Benachrichtigungsdienst von Home Assistant* ist die Liste aufgeteilt in **📱 Home Assistant App (Handy)**, **🧩 In Home Assistant eingerichtet (Geräte & Dienste)** und **📄 Aus der configuration.yaml (alte Art)**, jede Zeile mit ihrem vollen Namen (`notify.…`) und, bei den in Home Assistant eingerichteten, der Integration (z. B. *Telegram-Bot*).
### Neu
- **Der eigene Telegram-Bot von Home Assistant** (#460): Die Chats der Telegram-Bot-Integration (und andere Benachrichtigungs-Entitäten, die in der Oberfläche eingerichtete Integrationen seit Home Assistant 2025 anlegen) stehen in der Liste und lassen sich anhaken; die Nachricht geht mit `notify.send_message` an sie. Eine aufklappbare Anleitung **✈️ Eigenen Telegram-Bot einrichten** erklärt die vier Schritte (@BotFather, Chat-ID, die Integration mit dem Knopf hinzufügen, der sie in Home Assistant öffnet, den Chat anhaken); nichts muss in die `configuration.yaml`.

## [4.1.0] - 2026-10-18
### Neu
- **Urlaubs-Alarm, der eigene Alarm des Add-ons** (#456): ⚙ → *Warnungen & Alarm* → **🛡 Urlaubs-Alarm**, kein Alarmo nötig. Die Tür-, Fenster- und Bewegungssensoren anhaken, die ihn auslösen (gruppiert, mit ihrem Raum und ob sie gerade offen sind), ob ein Sensor, der länger als 5 Minuten offline ist, auch zählt (Batterie, Funk; nicht, während Home Assistant neu startet), die Sekunden, um das Haus zu verlassen und um ihn beim Heimkommen auszuschalten (anfangs 30), einen Code mit 4 bis 8 Ziffern (nur als gesalzener Hash gespeichert), die Sirenen, Lichter, Schalter, Skripte oder Szenen, die bei Alarm angehen, und ob eine Nachricht rausgeht (über *Benachrichtigung bei Alarm*), auch wenn jemand ihn scharf oder unscharf schaltet. Das Add-on wacht selbst, auch wenn kein Bildschirm offen ist.
- **Ein Sperrbildschirm, solange er scharf ist** (#456): Ein 🛡-Knopf über dem Plan schaltet ihn mit dem Code scharf. Solange er scharf ist, deckt ein halb durchsichtiger Bildschirm das ganze Tablet mit einem Tastenfeld ab: Er zählt die Zeit zum Verlassen herunter, sagt, wann er scharf ist, zählt die Zeit zum Eintippen des Codes herunter, wenn eine Tür aufgeht, und zeigt den Alarm in Rot mit dem, was geöffnet wurde. Nur der Code schaltet ihn aus (an jedem Bildschirm); nach fünf falschen Codes warten alle fünf Minuten, und eine Nachricht sagt das. Benutzer, die bearbeiten dürfen, können *Nur ansehen* (nur auf den Plan schauen), Wandtablets nicht. Neue Sperre in *Benutzer & Tablets*: **Urlaubs-Alarm** nimmt einem Benutzer das Scharf- und Unscharfschalten weg (auch der Server lehnt es ab).
- **Telegram über CallMeBot** (#456): *Senden über* → *Telegram*: an Personen (ihre Telegram-Benutzernamen; jede schickt einmal `/start` an @CallMeBot_txtbot) oder **in eine Telegram-Gruppe** mit dem Gruppen-Schlüssel von CallMeBot, jeweils mit nummerierten Schritten. Der Gruppen-Schlüssel bleibt wie der WhatsApp-Schlüssel im Add-on.
- **Benachrichtigungsdienste von Home Assistant zum Anhaken** (#456): Statt `notify.…` einzutippen, zeigt die Liste jeden Benachrichtigungsdienst, den Home Assistant hat, auch die aus der `configuration.yaml` (Telegram, die Companion-App, WhatsApp, Signal, Mail …, jeder mit einem Zeichen), und die Nachricht geht an jeden angehakten.
### Verbessert
- Der Ort in einer Nachricht nennt auch den Raum eines Tür- oder Fensterkontakts (der Raum neben seiner Wand), nicht nur den eines Geräts.
- In der Demo ist der Urlaubs-Alarm mit dem Code 1234 eingerichtet: 25 Sekunden lang scharf, ein „Einbrecher“ öffnet die Bürotür, so ist der ganze Ablauf zu sehen.

## [4.0.3] - 2026-10-18
### Verbessert
- **Benutzer & Tablets sind in den Einstellungen** (#454): Der Knopf *Benutzer* in der oberen Leiste und sein eigenes Fenster sind weg; alles davon (Benutzer mit Raum, Ansicht, Startansicht, Voreinstellungen und Sperren, die Sicherungsdatei `users.json` mit *Datei erstellen / speichern* und *Synchronisieren*) ist jetzt die Gruppe **👥 Benutzer & Tablets** in ⚙, wie bisher nur für Administratoren und nicht am Handy. Die Zeilen eines Benutzers passen ins schmalere Fenster: der Benutzer mit ⚙ und × oben, Raum, Ansicht und Start darunter. Die obere Leiste ist kürzer.
- **WhatsApp bei Alarm ist leichter einzurichten** (#454): ⚙ → *Warnungen & Alarm* → *Benachrichtigung bei Alarm* zeigt drei nummerierte Schritte für CallMeBot (ihm die Nachricht *I allow callmebot to send me messages* schicken, den Schlüssel, den es zurückschickt, und deine Nummer eintragen, anhaken, speichern und einen Test schicken) statt eines langen Satzes.

## [4.0.2] - 2026-10-18
### Repariert
- **Ein Gebäude von mehreren zeigt sich sauber** (#451): Eine lange Wand, die an einem Raum des gezeigten Gebäudes und an Räumen eines anderen Gebäudes entlangläuft, wird nur am gezeigten Gebäude entlang gezeichnet (und an Räumen des Grundstücks), kein Stück davon steht mehr in den leeren Räumen des anderen Gebäudes. Eine Wand, die einen Raum des gezeigten Gebäudes nur vom anderen Gebäude aus trifft (30–40 cm an ihrem Ende), ragt nicht mehr heraus. Den Bildausschnitt wählen und das Dach eines Gebäudes nutzen diese Teile auch.
- **Ein Raum nimmt die Etage darunter nicht mehr mit** (#451): Ein Raum ohne eigenes Gebäude nahm das Gebäude eines Raums, der auf einer anderen Etage über oder unter seiner Mitte liegt, auch eines Raums **oben**: Einen kleinen Raum im Obergeschoss Gebäude 2 zu geben, nahm den großen Raum im Erdgeschoss darunter (und seine Wände) mit. Jetzt folgen nur die Etagen darüber dem Erdgeschoss (und ein Keller folgt dem Erdgeschoss darüber), wie die Hilfe sagt; das Erdgeschoss folgt nie einer anderen Etage.
- **Was oben in keinem Raum liegt** (ein Stück Wand, eine Lampe zwischen zwei Räumen), gehört zum Gebäude des Raums darunter, nicht zu allen Gebäuden.
- **Die Geräteliste zeigt nur das gezeigte Gebäude** (#451): Mit einem oben gewählten Gebäude listet „📋 Geräte“ nur seine Geräte, Türen und Fenster (und was in keinem Raum steht, z. B. im Garten), und die Zahl der schwachen Batterien am Knopf zählt nur diese.

## [4.0.1] - 2026-10-18
### Verbessert
- **Die Einstellungen in Gruppen zum Aufklappen** (#450): ⚙ war eine lange Liste. Jetzt hat es zehn Gruppen: *Allgemein*, *Zeichnen & Bearbeiten*, *3D-Bild & Leistung*, *Was im Bild erscheint*, *Etagen*, *Haus außen & Umgebung*, *Licht & Hintergrund*, *Warnungen & Alarm*, *Wandtablet* und *Farben für Temperatur, Feuchte, CO₂*. Jede sagt in einer kleinen Zeile, was darin ist, ein Tipp öffnet oder schließt sie, *Alle aufklappen* öffnet alle. Am Anfang sind alle zu; der Browser merkt sich, welche offen geblieben sind.
- Die Zeiten für *Nachts abdunkeln* zeigen sich nur, wenn es nach der Uhr geht.
### Neu
- **Eine Suche in den Einstellungen** (#450): oben ein Wort eintippen (*Alarm*, *Himmel*, *Wand* …): Nur die Gruppen, die es haben, bleiben, aufgeklappt, mit den passenden Zeilen markiert. Die Tooltips zählen mit (*Sonne* findet den Himmel). Escape leert die Suche.
- **Was die Alarmanlage ist** (#450): Die Gruppe *Warnungen & Alarm* erklärt sie: eine Alarmanlage von Home Assistant (zum Beispiel die kostenlose Integration *Alarmo*); welche Türen, Fenster und Bewegungsmelder sie auslösen, wird dort gewählt, nicht im Add-on. Sie nennt die Alarmanlagen, die Home Assistant hat, mit ihrem Zustand. Wer nicht bearbeiten darf, erfährt, warum der Teil *Benachrichtigung bei Alarm* fehlt.
- Die Demo zeigt auch den Teil *Benachrichtigung bei Alarm* (dort wird nichts gesendet).

## [4.0.0] - 2026-10-18
### Neu
- **Wände mit Oberfläche** (#448): In den Eigenschaften eines Raums gibt *Wände* seinen Wänden auf der Seite des Raums eine Oberfläche: glatte Farbe, Raufaser, Strukturputz, Kalkputz, Sichtbeton, Tapeten (Streifen, Damast, Punkte, Harlekin, Blätter, Art-déco-Fächer, Zickzack, Karo, Leinen), Fliesen (20 × 20, 10 × 10, Metro, Metro im Fischgrät, groß 60 × 30, Sechsecke, Glasmosaik, Marmor, Zellige), Ziegel (rot, weiß gestrichen, anthrazit, gelb), Naturstein, Holzvertäfelung und Akustik-Holzlamellen. Die Räume nebenan behalten ihre eigenen Wände; Türen und Fenster bleiben offen.
- **Unten etwas anderes** (#448): *Unten anders* setzt z. B. Fliesen bis 1,20 m (jede Höhe) und darüber die Wand-Oberfläche, wie in Bad oder Küche. *Wände für alle Räume der Etage übernehmen* gibt jedem Raum der Etage in einem Schritt dieselben Wände.
- **Akzentwand** (#448): Die Eigenschaften einer Wand haben *Oberfläche dieser Wand*: Jede Seite (nach ihrem Raum benannt, oder *Außen*) kann über die ganze Höhe eine eigene Oberfläche haben.
- **Fassade** (#448): ⚙ → *Fassade*: Strukturputz, Ziegel (rot, weiß, anthrazit, gelb), Naturstein, Holzverkleidung (Lärche, verwittert), Schiefer, Sichtbeton oder Fassadenplatten außen auf den Wänden, mit eigener Farbe (*Farbe der Fassade*); *Glatt (wie bisher)* lässt die Wände, wie sie waren.
- **Viel mehr Böden** (#448): neben Parkett, Fliesen und Beton: breite Dielen, Fischgrät, Chevron, Würfelmuster, Laminat, Terrassendielen, Kork, große Fliesen 120 × 60, Fliesen in Holzoptik, Schachbrett, Sechsecke, Mosaik, Zementfliesen, Terrazzo, Marmor, Schiefer, Natursteinplatten, Polygonalplatten, Pflaster, Kopfsteinpflaster, Teppich und Teppichfliesen, unter den Überschriften Holz, Fliesen, Stein und Sonstiges.
- **Jedes Muster lässt sich ändern** (#448): seine Farbe (eine Reihe Farben zum Antippen oder jede Farbe), die zweite Farbe (Fugen, Motiv, Lücken, Adern), die Größe einer Fliese, Diele oder eines Motivs in cm und der Winkel, in dem es verlegt ist (0°, 45°, 90°, 135° oder jeder andere); *↺ Wie vorgegeben* nimmt es zurück. Die Muster zeichnet der Browser (keine Bilddateien) mit einem Relief, das das Licht fängt; sie wiederholen sich ohne Naht und beginnen in der Ecke des Raums (Böden) oder am Boden (Wände).
- Import / Export und das JSON-Schema kennen die neuen Felder `floorLook`, `wallLook`, `wallBelow` (Räume) und `faces` (Wände); die Einstellungen `facade` und `facadeColor`.
### Verbessert
- Die Demo zeigt die neuen Oberflächen: Fischgrät und Raufaser im Wohnzimmer, Metro-Fliesen in der Küche, Fliesen bis 1,20 m im Bad, Teppich und Blätter-Tapete im Schlafzimmer, Tapeten oben, weißer Ziegel im Atelier, Putz außen.
- Eine Farbe ohne Muster im Leistungsmodus „Schnell“ (Wände und Böden in der Farbe, die sie von weitem haben), keine im Hologramm-Design.

## [3.99.6] - 2026-10-18
### Repariert
- **Das Wischen der Raum-Kacheln am Handy läuft flüssig** (#441): Seit 3.99.5 schob die Seite die Leiste bei jeder Bewegung des Fingers, und am iPhone ruckelte das und blieb hängen, ein schräger Wisch hielt sie an. Jetzt scrollt der Browser die Leiste wieder selbst (flüssig, sie gleitet von selbst weiter), nur seitwärts. Die Leiste nimmt Berührungen an, sobald sie mehr Kacheln hat, als hineinpassen, und genau das brauchte das iPhone, um sie überhaupt zu scrollen (#438). Die Seite schiebt die Leiste nur noch als Ersatz, wenn der Browser nach ein paar Millimetern nicht übernimmt.
- **„Strom“ zeigt den Strom am Handy** (#442): Am Handy war die Karte „Strom jetzt“ ganz ausgeschaltet, und die Zahlenzeile sitzt in der Liste hinter „📊“ oben, darum zeigte „Strom“ nur die dünnen Kabel im Haus. Jetzt erscheint die Karte auch am Handy, solange „Strom“ gedrückt ist: klein (etwa ein Drittel kleiner als am Tablet), mittig unter der oberen Leiste, damit das Haus im Blick bleibt. Ein Tipp darauf schaltet „Strom“ wieder aus.
### Verbessert
- **Raum-Schilder auch am Handy** (#444): „Ansicht“ → „Im Bild: Raum-Schilder“ tat am Handy nichts, die Schilder über den Räumen waren dort ausgeschaltet. Jetzt zeigen sie sich auch am Handy, ein bisschen kleiner; Schilder ohne Platz werden wie überall kleine Punkte, ein Tipp öffnet den Raum.
### Neu
- **Uhrzeit und Wetter unten am Handy** (#445): eine kurze Zeile ganz unten, „☀️ 12:24 · ⛅ Teilweise bewölkt · 14 °C“ (ohne Wetter-Entität der nächste Sonnenunter- oder -aufgang). Sie nutzt den Streifen, der für den Home-Balken des iPhones frei bleibt und in der Home-Assistant-App leer blieb; wo es keinen gibt, rücken die Ansichts-Knöpfe ein bisschen hoch.

## [3.99.5] - 2026-10-18
### Repariert
- **Die Raum-Kacheln am iPhone wischen** (#438): Am iPhone (Safari, auch in der Home-Assistant-App) ließ sich die Leiste der Raum-Kacheln unten nicht seitwärts wischen, die Räume weiter rechts waren also nicht erreichbar (Handys haben keine Pfeile). Jetzt bewegt der Finger die Leiste selbst, auf jedem Gerät gleich: Sie folgt dem Finger, ein schneller Wisch gleitet weiter und wird langsamer, ein Tipp öffnet weiter den Raum, und ein Wisch öffnet keinen. Die Maus behält ihr Rad und die Pfeile.
- **Der angetippte Raum versteckt sich am iPhone nicht mehr hinter der Raum-Karte** (#440): Am Handy rückt das Bild nach oben, solange die Raum-Karte unten offen ist, damit der Raum darüber steht. Das iPhone hält die Karte von seinem Home-Balken frei, etwas höher als vorher, und dann rückte das Bild nicht: Der Raum lag hinter der Karte. Jetzt zählt auch eine so weit oben liegende Karte.

## [3.99.4] - 2026-10-18
### Repariert
- **Die angetippte Raum-Kachel ist nicht mehr leer** (#436): Am Tablet (Leistungsmodus „Schnell“) verlor die Kachel des geöffneten Raums Name, Temperatur und Lichter: dunkle Schrift auf der dunklen Kachel. Jetzt hat sie eine eigene helle Schrift auf einem Hauch der Akzentfarbe.
### Verbessert
- **Mehr und schönere Sterne in der Nacht** (#436): viele schwache Sterne, einige deutlichere und ein paar helle mit sanftem Schein, manche etwas bläulich oder warm, auch auf Tablets scharf, und eine schwache Milchstraße quer über den Himmel. Unter bewölktem Himmel scheinen noch einige Sterne durch (keine, wenn es bedeckt ist), und die Wolken liegen vor den Sternen.
- **Raum-Schilder aufgeräumt** (#436): Bei vielen Räumen stapelten sich die Schilder zu Türmen über dem Haus, an langen Linien. Jetzt rückt ein Schild, das ein anderes verdecken würde, höchstens eine Reihe hoch; ist dann noch kein Platz, schrumpft es zu einem kleinen Punkt über seinem Raum (ein Tipp öffnet den Raum wie bisher). Die wichtigeren Räume behalten ihre Schilder: Lichter an, dann jemand da, ein offenes Fenster, eine Temperatur, dann die näheren Räume. Hineinzoomen macht aus den Punkten wieder Schilder.

## [3.99.3] - 2026-10-18
### Repariert
- **„Strom jetzt“ nur, solange der Knopf „Strom“ gedrückt ist** (#434): Die Karte mit Sonne, Netz, Haus und Batterie (und den Zählern darunter) stand auf breiten Bildschirmen immer oben rechts, auch wenn der Knopf **Strom** unten nicht gedrückt war. Jetzt zeigt sie sich nur, solange **Strom** an ist (oder der Strom-Editor offen ist); ein Tipp auf die Karte schaltet sie wieder aus, wie der Knopf. Die Zahlenzeile oben links bleibt auf breiten Bildschirmen weg wie bisher. Der Knopf **Strom** zeigt sich jetzt auch, wenn nur die Sensoren des Reiters „⚡ Rechnung“ eingestellt sind und kein Stromgerät im Plan steht, damit sich die Karte trotzdem aufrufen lässt.

## [3.99.2] - 2026-10-18
### Verbessert
- **Raum-Kacheln, die nicht hineinpassen** (#421): Bei vielen Räumen (das ganze Haus eines großen Plans) wurde die Leiste der Raum-Kacheln rechts einfach abgeschnitten. Jetzt scrollt ein Pfeil an jedem Ende, an dem es mehr zu sehen gibt, die abgeschnittene Seite blendet weich aus, und auch das Mausrad scrollt seitwärts. Handys wischen weiter.
- **Etagen-Karten neben dem Energiebild**: In der Ansicht des ganzen Hauses rutschen die Etagen-Karten nicht mehr unter die Karte „Strom jetzt“ und die Himmels-Chips oben rechts; sie gehen auf die andere Seite des Hauses.

## [3.99.1] - 2026-10-17
### Verbessert
- **Raum-Schilder liegen nicht mehr aufeinander** (#430): Flach von der Seite gesehen, landeten die Schilder hintereinander liegender Räume auf derselben Stelle des Bildschirms. Jetzt werden sie nach oben auseinandergeschoben: Der nähere Raum behält seinen Platz, der fernere geht an einer längeren Linie zu seinem Raum nach oben.
- **Die Zähler im Energiebild** (#420): Die Wasser-, Gas- und Wärmezähler (z. B. 🚰 1234.6 m³ · 🔥 845.2 m³ · ♨ 5321 kWh) stehen auf breiten Bildschirmen unter den Kreisen von „Strom jetzt“ statt in einer eigenen Pille oben links. Handys behalten die Pille.

## [3.99.0] - 2026-10-17
### Neu
- **Echte Böden je Raum** (#427): In den Eigenschaften eines Raums legt *Boden* Parkett (Eiche, hell, dunkel), Fliesen (30 cm, klein fürs Bad, anthrazit 60 cm) oder Beton hinein statt einer Farbe. Die Muster zeichnet der Browser (keine Bilddateien) in ihrer echten Größe; die Farbansichten Temp. / Feuchte / CO₂ färben den Boden wie bisher; der 2D-Plan und die Etagen-Vorschauen zeigen den Raum in der Farbe seines Bodens. Eine Farbe im Leistungsmodus „Schnell“ und im Hologramm-Design. Import / Export und das JSON-Schema kennen das neue Feld `covering`.
- **Anthrazitfarbene Fensterrahmen** (#428): ⚙ → *Fensterrahmen*: weiß (wie immer) oder anthrazit, mit helleren Wänden; die Türrahmen bleiben weiß.
- **Raum-Schilder oder Geräte** (#430): Im Live-Modus auf breiten Bildschirmen entweder ein Glas-Schild über jedem Raum der gezeigten Etage (Name, Temperatur, Lichter an mit dem Rand in ihrer Farbe, offenes Fenster, ein grüner Punkt, wenn jemand da ist) oder die Geräte wie bisher, nie beides (Wunsch des Besitzers). Die Raum-Schilder sind der neue Normalfall: Die Kugeln und Werte-Schilder der Geräte und die Namen auf dem Boden sind solange aus; ein Tipp auf ein Schild oder einen Raum öffnet ihn mit seinen Geräten. Nicht in der Ansicht des ganzen Hauses, bei geöffnetem Raum, im Bearbeiten-Modus oder am Handy. *Ansicht* → *Im Bild: Raum-Schilder / Geräte* schaltet um (auch in ⚙; das Benutzer-Fenster kann es voreinstellen).
### Verbessert
- **Glas-Optik** (#429): Die Knöpfe über dem Bild und die Etagen-Karten links sind Milchglas wie die Raum-Kacheln und das Energiebild (helles Glas im hellen Design, keine Unschärfe im Modus „Schnell“).
- Die Demo zeigt die neuen Böden und die anthrazitfarbenen Fensterrahmen.

## [3.98.2] - 2026-10-17
### Verbessert
- **Die Batterie im Energiebild sagt, was sie tut** (#420): Statt nur „Batterie“ darunter sagt der Kreis jetzt **„ruht · 0 W“**, wenn sie weder lädt noch entlädt (z. B. nachts bei 9 %, wenn die meisten Batterien ihre Reserve halten), und **„kein Leistungs-Sensor“**, wenn ihre Leistung unbekannt ist, damit man einen fehlenden Leistungssensor von einer ruhenden Batterie unterscheiden kann.

## [3.98.1] - 2026-10-17
### Verbessert
- **Strom als Bild auch im Bearbeiten-Modus** (#420): Auf breiten Bildschirmen steht die Karte mit Sonne, Netz, Haus und Batterie jetzt auch im Bearbeiten-Modus oben rechts, statt der Zahlenzeile. Nur Handys behalten die Zeile (kein Platz für die Karte). „Strom als Bild“ im Ansicht-Menü und in den Einstellungen gibt die Zeile weiter zurück.

## [3.98.0] - 2026-10-17
### Neu
- **Himmel nach Uhrzeit** (#418): Hinter dem 3D-Bild ein Himmel, der der Sonne folgt, statt einer Farbe: dunkelblau mit Sternen in der Nacht, rosa in der Dämmerung, orange bei Sonnenauf- und -untergang, blau am Tag. Die Sonne kommt aus `sun.sun` (das Add-on schickt jetzt ihre Höhe und den nächsten Sonnenauf- / -untergang), ohne sie aus der Uhr. Der Rasen wird nachts dunkler und beim Sonnenuntergang wärmer; das Licht im Haus bleibt, wie es ist. Live-Modus, breite Bildschirme: ein Chip oben rechts, z. B. „🌇 Abend · 18:45 · Sonnenuntergang 18:52“. Einstellung **„Himmel“** (nach Uhrzeit und Wetter / einfarbig); das Hologramm-Design behält seinen eigenen Hintergrund. Kostet pro Bild nichts: Der Himmel ist CSS hinter der durchsichtigen Zeichenfläche.
- **Wetter am Himmel** (#419): Die Wetter-Entität (die für die Regenwarnung eingestellte, sonst die erste `weather.*`) macht den Himmel grau mit Wolken, und im Live-Modus **fällt Regen oder Schnee** über das Bild (stillstehend im Leistungsmodus „Schnell“). Ein zweiter Chip: „🌧️ Regen · 11 °C · Wind 24 km/h“.
- **Regenwarnung je Fenster** (#419): Ein Fenster mit Kontakt hat den neuen Haken **„Fenster offen bei Regen“** (normal an). Ein Fenster, das bei Regen offen bleiben darf, wird mit `rainWarn: false` gespeichert und warnt nicht; Import, Export und das Schema behalten das.
- **Energiefluss als Bild** (#420): Live-Modus auf breiten Bildschirmen, eine Karte oben rechts mit **Sonne, Netz, Haus und Batterie** und Punkten, die auf den Linien dazwischen laufen, schneller bei mehr Leistung, wie die Energieverteilungs-Karte von Home Assistant. Sie ersetzt dort die Zahlenzeile (am Handy und im Bearbeiten-Modus bleibt die Zeile). Ein Tipp zeigt oder versteckt die Stromkabel. **„Strom als Bild“** im Ansicht-Menü und in den Einstellungen; die Benutzersperre „Strom“ versteckt es auch.
- **Raum-Kacheln** (#421): Live-Modus, eine Leiste über den Ansichts-Knöpfen mit **einer Karte je Raum** der gezeigten Etage (das ganze Haus: jeder Raum mit seiner Etage): der Name, die **Temperatur**, die **Lichter, die an sind** (der Rand der Karte in ihrer Farbe), **offene Fenster** und 👤, wenn jemand da ist. Ein Tipp fliegt zum Raum und öffnet seine Raum-Karte, ein zweiter Tipp geht zurück. Kleiner und seitwärts gewischt am Handy. **„Raum-Kacheln“** im Ansicht-Menü und in den Einstellungen, auch als Voreinstellung je Benutzer.
- **Werkzeugleiste mit Symbolen und Gruppen** (#422): Jedes Werkzeug des Bearbeiten-Modus hat ein Linien-Symbol mit seinem Namen darunter, in Gruppen mit einer kleinen Überschrift: Auswählen | **ZEICHNEN** | **SETZEN** | **WERKZEUGE**. Ein paar Namen sind unter dem Symbol kürzer („Erkennen“, „Öffnung“, „Strom“, „Mehr“), das Fenster zum Anpassen behält die vollen. Die Gruppen folgen der Reihenfolge der Leiste (Werkzeuge lassen sich weiter ausblenden, verschieben und einklappen); das Dach steht jetzt bei den Zeichen-Werkzeugen.
- Neue Module `sky.js` (Sonne, Himmelsfarben, Wetter; Unit-Tests `tests/sky.test.mjs`) und `skyui.js`, `energyflow.js` (was wohin fließt; `tests/energyflow.test.mjs`) und `energyflowui.js`, `roomtiles.js` (was die Karte eines Raums zeigt, und der Messwert eines Raums für die Farbansichten, aus `app.js` herausgezogen; `tests/roomtiles.test.mjs`) und `roomtilesui.js`, `toolicons.js` (Symbole und Gruppen; `tests/toolicons.test.mjs`). Browser-Test-Teil `25_sky_tiles`. Die Demo hat eine Wetter-Entität; `?weather=rainy` (snowy, cloudy …) und `?skytime=21:30` probieren das Wetter und eine andere Uhrzeit aus. In alle 7 Sprachen übersetzt. Beispielbilder und der Plan: `docs/ideen-3.98/`, `docs/PLAN-3.98.md`.

## [3.97.0] - 2026-10-17
### Neu
- **Eine Nachricht bei Alarm, per WhatsApp** (#414): Wenn die **Alarmanlage auslöst** oder ein **Rauch-, Gas-, Kohlenmonoxid- oder Wassersensor** meldet, schickt das Add-on sofort eine Nachricht, auch wenn kein Bildschirm offen ist (es hält eine eigene Verbindung zu Home Assistant, wie die Aufzeichnung für die Sicherheit). Die Nachricht sagt, was ausgelöst hat, **wo es im Plan ist** (Haus · Etage · Raum) und die Uhrzeit, z. B. „🔥 Rauch erkannt: Rauchmelder Küche – Erdgeschoss · Küche · 17.10. 18:22“.
  - **Zwei Wege:** WhatsApp **direkt über CallMeBot** (kostenlos: deine Nummer und der Schlüssel, den CallMeBot dir einmal schickt) oder **jeder Benachrichtigungsdienst von Home Assistant** (eine WhatsApp-, Telegram- oder Signal-Integration, die Companion-App …; die Liste bietet die an, die Home Assistant hat).
  - Neuer Teil **„🚨 Nachricht bei Alarm (WhatsApp)“** in den Einstellungen (nur Bearbeiter): an / aus, welche Sensoren, auf Wunsch eine Nachricht, wenn alles wieder normal ist, **Test senden** (ein falscher Schlüssel wird gemeldet).
  - Keine Flut: derselbe Sensor erst nach 10 Minuten wieder, höchstens 10 Nachrichten in 10 Minuten; was beim Start des Add-ons schon auslöst, wird nicht noch einmal geschickt.
  - Die Telefonnummer und der Schlüssel bleiben im Add-on (`notify.json`), nicht in den Einstellungen, die jedes Tablet liest; der Schlüssel wird nie wieder herausgegeben. Neue Endpunkte `GET/PUT /api/notify`, `POST /api/notify/test` (nur Bearbeiter).
  - Neue Module `alarmnotify.py` (was ein Alarm ist, der Text, wo es ist, das Wachen; Unit-Tests `tests/test_alarmnotify.py`) und `notifyui.js` (der Teil der Einstellungen). Browser-Test-Teil `24_alarm_notify` mit einem nachgebauten CallMeBot. In alle 7 Sprachen übersetzt; Add-on-Doku: „Nachricht bei Alarm (WhatsApp)“.

## [3.96.0] - 2026-10-17
### Neu
- **Mehr Geräte direkt im Plan schalten** (#406): Ein Tipp auf ein Gerät im Live-Modus öffnet seine Karte, und die Karte hat jetzt die Bedienung für mehr Arten von Geräten:
  - **Musik und TV** (`media_player`): was läuft (Titel – Künstler), **⏮ ⏯ ⏭** (zurück, Wiedergabe / Pause, weiter), ein **Lautstärke**-Regler (oder lauter / leiser), **stumm** und die **Quelle** (HDMI, Spotify, Radio …). Ausgeschaltet hat es einen Knopf zum Einschalten.
  - **Saugroboter** (`vacuum`): sein Zustand in Worten (saugt, an der Station, auf dem Rückweg …), **saugen** / **Pause** / **zurück zur Station** / **finden**, und die **Saugstärke**.
  - **Ventilator** (`fan`): an / aus, die **Geschwindigkeit** in den eigenen Stufen des Ventilators (ein Ventilator mit 4 Stufen: 25, 50, 75, 100 %), **Schwenken** und seine **Voreinstellungen** (Nacht, Natur …).
  - **Thermostat und Klimaanlage** (`climate`): Die Live-Karte hat die Solltemperatur mit − / +, die Modi und neu: die **Voreinstellungen** (Eco, Komfort, Abwesend, Boost …) und die **Lüftermodi** (auto, niedrig, hoch …), auch im Heizungs-Feld neben dem Raum-Feld.
  - **Alarmanlage** (`alarm_control_panel`): ihr Zustand (unscharf, scharf zu Hause / abwesend / Nacht, Alarm), **scharf schalten** (zu Hause, abwesend, Nacht, Urlaub, soweit die Anlage es kann) und **unscharf schalten**, mit einem Feld für den **Code**, wo Home Assistant einen verlangt (ein falscher Code wird abgelehnt, die Karte sagt es). Neue Sperre im Benutzer-Fenster: **„Alarmanlage (scharf / unscharf)“** nimmt sie einem Benutzer oder Tablet weg, dann lehnt das Add-on es auch ab.
  - **Tasten** (`button`, `input_button`): **drücken**. **Auswahllisten** (`select`, `input_select`): eine Ausklappliste mit den Möglichkeiten.
  - Welche Knöpfe ein Gerät bekommt, folgt dem, was Home Assistant über seine Fähigkeiten sagt (`supported_features`), ein einfaches Radio bekommt also kein „nächster Titel“.
- **Das Add-on prüft jeden Schaltbefehl genauer**: Jeder Bereich hat seine eigene Liste erlaubter Dienste, und jeder Wert wird geprüft (Bereich, Typ, Länge), bevor er an Home Assistant geht; alles andere (z. B. die rohen Befehle eines Saugroboters, das „Auslösen“ des Alarms) wird abgelehnt. Neues Modul `controls.py` (Unit-Tests `tests/test_controls.py`); Entitäten tragen die wenigen Werte, die die Bedienung braucht, als `ctl` (Lautstärke, Titel, Quellen, Saugstärke, Lüftergeschwindigkeit, Voreinstellungen, Möglichkeiten …).
- Neues Modul `devicecontrols.js` (welche Knöpfe ein Gerät bekommt: rein, Unit-Tests `tests/devicecontrols.test.mjs`, und das Zeichnen). Die Demo hat zum Ausprobieren einen Lautsprecher, einen Saugroboter, einen Ventilator, eine Alarmanlage (Code 1234) und einen Hausmodus. Neuer Browser-Test-Teil `23_device_controls`. In alle 7 Sprachen übersetzt.

## [3.95.0] - 2026-10-17
### Neu
- **Energie: das Energie-Dashboard von Home Assistant übernehmen** (#407): Der Reiter **⚡ Rechnung** des Strom-Editors hat oben einen neuen Teil **🧭 Einrichten**. **⤵ Aus dem Energie-Dashboard übernehmen** liest, was im Energie-Dashboard von Home Assistant eingerichtet ist, und zeigt es als Vorschlag: das Netz, die Solarsensoren, die Batterie mit ihrem Ladestand und die Gas- und Wasserzähler. **✓ Übernehmen** trägt Netz, Solar und Batterie in den Reiter ein (Strg+Z nimmt es zurück); die Räume und der Haus-Sensor bleiben, wie sie sind.
  - **Die Vorzeichen werden richtig herum gedreht**: Home Assistant zählt bei der Batterie plus = entladen, der Reiter plus = laden, darum wird ihr Sensor von selbst umgedreht; ein im Energie-Dashboard als umgekehrt markierter Sensor oder zwei Sensoren (laden / entladen, Bezug / Einspeisung) werden als solche übernommen.
  - **Nur Energiezähler (kWh) im Energie-Dashboard**: Der Vorschlag nimmt den Leistungssensor (W) am selben Gerät und markiert ihn mit „geraten, bitte unten prüfen“.
  - **Prüfliste**: was eingerichtet ist (✅), was fehlt (○), was geprüft werden sollte (⚠, z. B. ein Sensor ohne Wert oder eine Rechnung, die nicht aufgeht) und was freiwillig ist (ℹ): Netz, Solar, Batterie, Hausverbrauch, Räume, Zähler, Rechnung. Sie folgt den Live-Werten, solange das Fenster offen ist.
  - **Zähler mit einem Klick**: Ein Gas- oder Wasserzähler des Energie-Dashboards, der noch nicht im Plan ist, bekommt einen Knopf **+ Gaszähler / Wasserzähler in den Plan setzen**: Er wird in die offene Etage gesetzt (an die nächste Wand) und mit seinem Sensor verbunden.
  - Neuer Endpunkt `GET /api/energy/prefs` (nur Bearbeiter): die Einstellungen des Energie-Dashboards und die anderen Sensoren jedes Geräts. Neue Module `energyprefs.js` (rein: das Energie-Dashboard als Einstellungen des Reiters, die Prüfliste; Unit-Tests `tests/energyprefs.test.mjs`) und `energysetup.js` (der Teil des Fensters). Die Demo antwortet mit einem eigenen Energie-Dashboard. In alle 7 Sprachen übersetzt.
### Verbessert
- **Roadmap und Testprotokoll aufgeräumt** (#408): Die Roadmap listet zuerst, was offen ist, und hat die Neuheiten von 3.59 bis 3.95; das Sonnenlicht (#68) ist als nicht geplant markiert. Das Testprotokoll beginnt mit einer kurzen Liste der 15 wichtigsten Prüfpunkte, die langen älteren Listen sind darunter zugeklappt.

## [3.94.0] - 2026-10-17
### Neu
- **Mehrere Gebäude in einem Plan** (#409): das Haupthaus und das Gartenhaus (oder eine Werkstatt, eine Einliegerwohnung …) zusammen in einem Plan zeichnen und sagen, welcher Teil welcher ist:
  - **Feld „🏘 Gebäude in diesem Plan“** im Seitenfeld (Bearbeiter): Gebäude hinzufügen, umbenennen und löschen und für jeden Raum wählen, zu welchem Gebäude er gehört. Wände, Türen, Fenster, Geräte, Treppen und Blöcke gehören von selbst zum Gebäude ihres Raums; ein Raum ohne Gebäude nimmt das des Raums darunter oder darüber (das Erdgeschoss zuordnen, die Etagen darüber folgen, angezeigt als „automatisch (…)“); was in keinem Raum liegt (der Garten, der Carport …), gehört zum Grundstück und zeigt sich immer. Ein Raum, der gezeichnet wird, während ein Gebäude gezeigt wird, gehört zu diesem Gebäude.
  - **Umschalter „🏘 Alle Gebäude / Haupthaus / Gartenhaus“** oben (ab zwei Gebäuden): Nur das gewählte Gebäude wird in 3D und im 2D-Plan gezeichnet, ins Bild gerückt, aufgelistet (Objekte, Suche, Offline- und Offen-Listen, Etagen-Karten) und hat seinen Rasen; Etagen ohne etwas davon verschwinden aus den Etagen-Knöpfen, der Etagen-Leiste und der Etagenliste am Handy; das Hauptdach folgt diesem Gebäude. Warnungen (Rauch, Wasser …) gelten weiter für den ganzen Plan. Die Wahl merkt sich der Browser je Plan.
  - **Dächer je Gebäude:** Das Hauptdach und jedes weitere Dach können ein Gebäude bekommen; ein weiteres Dach ohne Gebäude gehört zum Gebäude darunter. **„🏠 Jedem Gebäude ein eigenes Dach geben“**: Das höchste Gebäude behält das Hauptdach, jedes andere bekommt ein weiteres Dach derselben Art über seinen eigenen Räumen, oben auf seiner höchsten Etage. Solange das Hauptdach noch alle Gebäude deckt, sagt das Feld das.
  - **Je Benutzer / Tablet** (Benutzer-Fenster, ⚙ einer Zeile): welches Gebäude ein Benutzer oder Tablet beim Start sieht, und die neue Sperre **„Gebäude wechseln“** hält es dort (der Umschalter ist versteckt). Gespeichert als `userBuildings` (auch in `users.json`), `/api/me` meldet es.
  - **Ein anderes Haus hereinholen:** Das Feld kann ein anderes Haus der Hausliste als eigenes Gebäude in diesen Plan holen: Seine Etagen kommen auf die Etagen derselben Höhe (eine Etage, die dieser Plan nicht hat, wird in der richtigen Höhe eingefügt), es kommt genau dorthin, wo es als Nachbarhaus steht (dieser Eintrag fällt weg), oder 3 m rechts neben diesen Plan, alles bekommt neue IDs, seine Dächer werden weitere Dächer seines Gebäudes, LED-Ringe und Kabel zeigen weiter auf ihre Kopien. Das andere Haus bleibt in der Liste. Ein Strg+Z nimmt alles zurück.
  - Neue Module `buildings.js` (rein: zu welchem Gebäude etwas gehört, der Plan, wie ein Gebäude ihn sieht, Dächer je Gebäude, einen Plan hereinholen; Unit-Tests `tests/buildings.test.mjs`) und `buildingsui.js` (der Umschalter und das Feld). In alle 7 Sprachen übersetzt. Browser-Test-Teil `21_buildings`.

## [3.93.0] - 2026-10-17
### Neu
- **Wiederholen** (#404): **Strg+Y** oder **Strg+Umschalt+Z** (Cmd am Mac) macht wieder, was **Strg+Z** zurückgenommen hat; eine neue Änderung nach einem Rückgängig leert die Wiederholen-Liste, wie in jedem Programm. Zwei neue Knöpfe **↶** und **↷** neben *Speichern* tun dasselbe und sind ausgegraut, solange es nichts zurückzunehmen oder zu wiederholen gibt (praktisch am Tablet ohne Tastatur). Die Hilfe im Seitenfeld listet die Tasten. Die Wiederholen-Liste lebt neben der Rückgängig-Liste in `persist.js` und wird ebenfalls umgeschrieben, wenn Entitäten in Home Assistant umbenannt werden.
- **Kopieren, Einfügen und Verdoppeln** (#405): **Strg+C** kopiert, was ausgewählt ist (ein Ding oder mehrere zusammen: Geräte, Wände mit ihren Türen und Fenstern, Räume, Blöcke, Treppen, Bodenöffnungen), **Strg+V** fügt es ein, **Strg+D** verdoppelt die Auswahl sofort (die Kopie von Strg+C bleibt). Auf der Etage, von der sie kam, landet die Kopie einen halben Meter daneben, jedes weitere Einfügen einen Schritt weiter; auf einer anderen Etage oder in einem anderen Haus an derselben Stelle (dieselbe Lampe ein Stockwerk höher). Alles bekommt neue IDs, die verbundenen Entitäten bleiben, nichts von der Kopie ist gesperrt; ein mit seinem Raum kopierter LED-Ring folgt dem kopierten Raum. Eine allein kopierte Tür oder ein Fenster kommt in dieselbe Wand an die nächste freie Stelle daneben. Was eingefügt wurde, ist ausgewählt und lässt sich sofort verschieben; ein Strg+Z nimmt es zurück. Ohne Auswahl bleiben Strg+C / Strg+V die des Browsers; Strg + ein Buchstabe wählt nie mehr ein Werkzeug (Strg+D wählte früher das Geräte-Werkzeug). Neues Modul `clipboard.js` (rein, Unit-Tests `tests/clipboard.test.mjs`). Browser-Test-Teil `20_editing` (Wiederholen, Kopieren / Einfügen, ein zweiter Bildschirm, der zwischendurch speichert).
### Repariert
- **Der Plan wird nicht mehr ohne Warnung überschrieben, wenn zwei Bildschirme gleichzeitig bearbeiten** (#403): Jeder Plan hat jetzt eine Versionsmarke (`ETag` von `GET /api/layout`, aus seinem Inhalt gebildet). Ein Speichern trägt die Marke des Plans, wie der Bildschirm ihn geladen hat (`If-Match`); hat ein anderer Bildschirm (oder ein vergessener Browser-Tab) den Plan inzwischen gespeichert, lehnt das Add-on das Speichern ab (HTTP 409) und fragt: **die andere Fassung laden** (die Änderungen dieses Bildschirms fallen weg, die offene Etage bleibt) oder **meine Fassung behalten** (über die andere gespeichert). Esc entscheidet nichts. Die Speichervorgänge eines Bildschirms gehen nacheinander, so wird der Speichern-Knopf während eines automatischen Speicherns nie für eine Änderung von woanders gehalten. Wenn das Add-on die Pläne umschreibt, weil Entitäten in Home Assistant umbenannt wurden, schickt es die neuen Marken mit, so gilt auch das nicht als Änderung von woanders. Ein Speichern ohne Marke (ältere Browser, Skripte) wird wie bisher gespeichert. Unit-Tests in `tests/persist.test.mjs`, Server-Tests in `tests/test_server.py`.
- **Wendeltreppe über mehrere Etagen: Der Handlauf läuft nicht mehr durch** (#318): Der Handlauf einer Wendeltreppe mit „Etagen“ 2 oder mehr war ein Stück über alle Windungen, auch über den Absatz auf der Etage dazwischen, man hätte dort also eigentlich nicht aussteigen können. Jede Windung hat jetzt einen eigenen Handlauf: Er endet am Absatz, und der nächste beginnt danach, so ist der Weg auf die Etage frei (`rails` in `stairs.js`, einer je Stockwerk; getestet).

## [3.92.0] - 2026-10-17
### Neu
- **Etwas, das über der Bar von der Decke hängt** (#401): Beide Bartheken (*Bartheke mit LED* und *Bartheke über Eck mit LED*) haben im Seitenfeld eine neue Wahl **An der Decke**: *Nichts* (wie bisher), **Gläserregal mit hängenden Gläsern** (ein Brett in der Oberfläche der Bar auf einem Stahlrahmen, zwei Reihen kopfüber hängender Weingläser, LED darunter), **Deckensegel mit LED** (eine schwebende Platte mit Licht obendrauf und Strahlern darunter) oder **Pendelleuchten** (Pendellampen an einer schwarzen Deckenschiene). Es folgt der Theke, gerade oder um die Ecke (die L-förmige Bar bekommt ein L-förmiges Regal, Segel oder eine L-förmige Schiene), und hängt von der Decke eines 2,6 m hohen Raums. Sein Licht ist eine dritte LED-Zone **Deckenteil**: Ohne eigenes Licht folgt es der Bar, oder es bekommt unter *LEDs einzeln verknüpfen* ein eigenes Licht, mit eigenem Knopf in der Live-Karte. Plan, Wandanschlag und Größenfelder bleiben die der Theke. Das Musterhaus hat ein Gläserregal über seiner Bar. In alle 7 Sprachen übersetzt; der Hausimport kennt die neuen Möglichkeiten (`variant`: `rack`, `canopy`, `pendants`). Die LED-Zonen eines Stücks können jetzt davon abhängen, wie es gebaut ist (`zoneKeys(type, dev)` in `ledzones.js`); die Größe eines Modells für das Seitenfeld ist von `app.js` nach `models.js` umgezogen (`baseSize`). Unit-Tests in `tests/leisure.test.mjs` und `tests/ledzones.test.mjs`, Browser-Test-Teil `16_leisure`.

## [3.91.0] - 2026-10-16
### Neu
- **Messen im 2D-Plan und in 2D + 3D** (#399): ein neues Werkzeug **Messen** in der Werkzeugleiste, auch mit der Taste **M** (in der 3D-Ansicht öffnet es 2D + 3D). Zwei Punkte anklicken: Der Plan zeigt die Linie mit ihrer Länge, das Seitenfeld die Länge, wie weit sie quer und längs über den Plan geht und ihre Steigung. Klicks rasten an Wandenden ein, an den inneren und äußeren Ecken der Wandflächen, an Raumecken und auf der Fläche einer Wand; **Alt** misst von einem freien Punkt. **Zwei Wände** nacheinander anklicken und im Seitenfeld genau einstellen: bei parallelen Wänden den **lichten Abstand** (Fläche zu Fläche) oder den Abstand zwischen den Wandmitten, bei zwei beliebigen Wänden den **Winkel** zwischen ihnen. Die orange Wand bewegt sich (eine gerade Wand aus mehreren Stücken als Ganzes), die mit ihr verbundenen Wände strecken sich mit, auch eine Wand, die an ihr endet, und die Räume folgen; eine gedrehte Wand behält ihre Länge und dreht sich um die Ecke. **⇄** bewegt stattdessen die andere Wand, Strg+Z nimmt es zurück. Der Plan zeigt die zwei Wände, den rechtwinkligen Abstand zwischen ihren Flächen und den Winkel in der Ecke; die 3D-Ansicht zeigt die Linie mit ihrer Länge, und auch Klicks dort messen. In alle 7 Sprachen übersetzt. Neue Module `measure.js` (Punkte, Abstände, Winkel, was sich bewegt; reine Logik, Unit-Tests `tests/measure.test.mjs`) und `measuretool.js` (Seitenfeld, Linie in 3D); Browser-Test-Teil `19_measure`.

## [3.90.0] - 2026-10-16
### Neu
- **Garage, Werkstatt und Carport: etwa 55 neue Stücke** in drei neuen Bibliotheksgruppen, alle in ihrer echten Größe, damit man ausprobieren kann, ob das Auto, das Wohnmobil oder die Werkbank passt:
  - **Fahrzeuge**: Kleinwagen, Limousine, Kombi, SUV, Sportwagen, Pick-up, Transporter / Kleinbus, Campingbus, Wohnmobil (teilintegriert), Alkoven-Wohnmobil, Wohnwagen, Autoanhänger, Motorrad, Roller, Fahrrad, E-Bike, Lastenrad, Aufsitzmäher und Mähroboter mit Ladestation. Die Autos haben Räder mit Felgen, Fenster, Spiegel, Lichter und Nummernschilder, die Wohnmobile ihren Wohnteil mit Fenstern, Eingangstür, Markise und Dachfenstern. Ein Auto auswählen, um unter *Ausführung* seinen **Lack** zu wählen (silber, weiß, schwarz, grau, rot, blau, grün, glänzend wie Autolack). Mit einer Entität verbinden (sein Ladeschalter, das Schloss …): Seine **Scheinwerfer leuchten weiß und seine Rücklichter rot**, solange es an ist.
  - **Werkstatt**: Werkbank, Werkbank mit Lochwand und Licht, Lochwand mit Werkzeug, Werkzeugwagen, Werkzeugkiste, Schwerlastregal, Wand mit Sichtlagerkästen, Zwei-Säulen-Hebebühne, Rangierwagenheber, Kompressor, Tischbohrmaschine, Tischkreissäge, Doppelschleifer, Schweißgerät, Werkstattsauger, Reifenregal, gestapelte Reifen, Stehleiter, LED-Werkstattlampe, Hallenstrahler, Feuerlöscher, Ölfass, Montageliege. Die Werkstattlampen und die Werkbank mit Licht sind Lampen: Sie erhellen den Raum.
  - **Garage & Carport**: Carport, Doppelcarport, Solar-Carport, vier Mülltonnen, Mülltonnenbox, Fahrradständer, Fahrrad an der Wand, Deckenregal, Metallschrank, Schubkarre, Rasenmäher, Gartengeräte an der Wand, Hochdruckreiniger, Parkstopper.
  - Wandstücke (Lochwand, Kästen an der Wand, Feuerlöscher, Gartengeräte, Fahrrad an der Wand) rasten an der Wand ein, die Werkstattlampen und das Deckenregal hängen von der Decke, die Parkstopper liegen auf dem Boden. In alle 7 Sprachen übersetzt; der Hausimport und -export kennen jedes Stück und die neuen Ausführungen.
  - Das Musterhaus *Musterhaus – alles drin* hat sie alle (329 Geräte): die Garage mit einem blauen Kombi, einer Werkbank, einem Regal und einem Fahrrad an der Wand, eine Lochwand in der Kellerwerkstatt und vorne einen neuen Hof mit drei Carports, Autos, Wohnmobilen, einem Wohnwagen, einem Anhänger, einer Werkstattecke und einer Limousine auf der Hebebühne.
  - Neues Modul `garage.js` (reine Geometrie, Unit-Tests `tests/garage.test.mjs`: echte Größen, die Räder auf dem Boden, die Fenster außen an den Karosserien, die Lichter). Neuer Baustein für die Stücke: ein Seitenprofil über eine Breite gezogen (`prof` in `shapes.js`, gezeichnet von `models.js`), so haben die Karosserien der Autos und Camper schräge Motorhauben, Windschutzscheiben und Radkästen. Browser-Test-Teil `18_garage`.

## [3.89.0] - 2026-10-16
### Neu
- **„Aufeinander“ auch mit einer offenen Etage** (#396): Das Ansicht-Menü bietet **Aufeinander** jetzt auch an, wenn nur eine Etage offen ist (*Auseinander* bleibt in der Ansicht des ganzen Hauses). Die offene Etage sitzt dann auf einer Decke direkt auf der abgedunkelten Etage darunter, ohne Lücke, und die Namen, Werte-Schilder, Kugeln und Offline-Zeichen der Etagen darunter bleiben in ihren Räumen, statt über der offenen Etage zu schweben. Es ist dieselbe Wahl wie in der Ansicht des ganzen Hauses (⚙ jetzt *Abstand der Etagen*: kleine Lücke / auseinander, nur ganzes Haus / aufeinander), auch als Startwert je Benutzer im Benutzer-Fenster. Neue Sperre im Benutzer-Fenster: **„Abstand der Etagen (Auseinander / Aufeinander)“** versteckt die zwei Knöpfe für diesen Benutzer, damit das Aussehen bleibt, wie eingestellt (`floorGap`, auch dem Add-on bekannt).
### Repariert
- **Ruckeln am iPad mit dem Musterhaus** (#394): Gemessen mit dem Musterhaus *Musterhaus – alles drin* (274 Geräte), brauchte ein Bild etwa **3.700 Zeichenaufrufe**, weil jedes Teil eines eingebauten Modells ein eigenes Mesh war (eine Rückbar hat 133 Teile, ein Weinkühlschrank 85). Ein PC schafft das leicht, Safari auf einem iPad nicht. Die gleich aussehenden Teile eines Modells werden jetzt zu einem Mesh zusammengefügt (neues Modul `meshmerge.js`, Unit-Tests `tests/meshmerge.test.mjs`): die Geräte, die Wände mit den festen Teilen ihrer Türen und Fenster und die Treppen. Das ganze Musterhaus braucht jetzt etwa **1.250 Zeichenaufrufe**, mit genau derselben Form (dieselben 129.285 Dreiecke; Bildschirmfotos von alt und neu sehen gleich aus). Was sich mit dem Zustand ändert, bleibt getrennt: leuchtende Teile, LED-Zonen, Türblätter, Fensterscheiben, Rollläden, das Hintergrundlicht eines Fernsehers. Auf einem Tablet (Stromsparmodus) werden die Textschilder mit halber Schärfe gezeichnet: 256 kB Grafikspeicher je Schild statt 1 MB, und ein neuer Wert erreicht den Grafikchip viermal schneller (`labelRes` in `labels.js`). Der Browser-Test prüft die Zeichenaufrufe des Musterhauses (Teil `14_showcase`) und die Schilder auf einem Tablet (Teil `07_tablet`).
- **README: Das Release-Abzeichen zeigte „Unable to select next GitHub token from pool“** (#395): ein Fehler von shields.io, dessen GitHub-Tokens aufgebraucht waren. Das Abzeichen liest die Version jetzt aus `floorplan3d/config.yaml` (eine einfache Datei, keine GitHub-API).

## [3.88.0] - 2026-10-16
### Neu
- **Etagen aufeinander wie bei einem echten Haus** in der Ansicht des ganzen Hauses: Das Ansicht-Menü hat einen neuen Knopf **Aufeinander** neben **Auseinander**. Die Etagen sitzen dann ohne Lücke aufeinander: Eine Decke füllt den Raum zwischen der Oberkante der Wände und der Etage darüber (Geschosshöhe minus Wandhöhe: 40 cm bei den üblichen 2,6 m hohen Wänden), im Umriss der Etage darüber, mit ihren Treppenlöchern und Bodenöffnungen frei; die Wände unter dem Dach reichen bis zum Dach (nicht die einer Garage neben dem Haus und keine Brüstung). Ein zweiter Tipp geht zur üblichen Ansicht zurück; *Auseinander* und *Aufeinander* lösen einander ab. Die Wahl bleibt: neue Einstellung **Etagen im ganzen Haus** in ⚙ (kleine Lücke / auseinander / aufeinander), auch ein Startwert je Benutzer oder Tablet im Benutzer-Fenster. Die Tipp-Kugeln, Werte-Schilder, Raumnamen und Offline-Zeichen einer Etage, die unter einer anderen liegt, **bleiben jetzt in ihren Räumen**: Sie schweben nicht mehr über der Etage darüber (wo sie aussahen, als gehörten sie dorthin); man sieht sie dort, wo man in diese Etage hineinschaut (Wände abgesenkt oder durchsichtig), sonst verdeckt sie die Decke. Die Kugel eines Rollladens, ein Werte-Schild oder ein Offline-Zeichen, das durch die Decke reichen würde, rückt nach unten in den Raum (ein Offline-Zeichen hängt dann unter seiner Lampe). Neues Modul `housefloors.js` (die Regeln, Unit-Tests `tests/housefloors.test.mjs`), die Decke wird in `floorbuild.js` gebaut. In alle 7 Sprachen übersetzt; der Browser-Test-Teil `09_floors` prüft es.
### Repariert
- **Eine Etage unter der offenen sah aus wie ein schwarzes Loch im Rasen** (#391): Mit eingeschaltetem Erdreich wird der Umriss des Hauses aus dem Rasen ausgeschnitten (ohne Keller das ganze Haus, mit Keller der Keller), und dieser Ausschnitt hatte keinen Boden. Öffnete man die obere Etage eines Hauses ohne Keller, schaute man durch das abgedunkelte Erdgeschoss darunter in den leeren Hintergrund; in der Ansicht des ganzen Hauses verdeckte es das massive Erdgeschoss. Das Haus steht dort jetzt auf Boden (eine Bodenplatte knapp unter dem Rasen, mit Keller unten in seiner Grube), so sieht eine abgedunkelte oder ausgeblendete Etage darunter wie ein Boden aus (`padLevel` in `earth.js`, Unit-Test).
- **Ansicht des ganzen Hauses: Nur die zuletzt geöffnete Etage zeigte die Zustände ihrer Geräte** (#392): Die Live-Zustände gingen nur an die zuletzt geöffnete Etage und die Etagen darunter, und die darunter galten als abgedunkelt: Ihre Lampen hatten keine Tipp-Kugeln, und die Etagen darüber blieben dunkel (kein Leuchten, keine Kugeln, Werte-Schilder blieben „…“). Jetzt zeigt jede Etage sie (`liveFloors` in `housefloors.js`, Unit-Test; Browser-Test-Teil `09_floors`).

## [3.87.0] - 2026-10-16
### Neu
- **Wand-TV am Schwenkarm** (neues Stück *Wand-TV am Schwenkarm*, Gruppe Wohnen, Suchwort *schwenkarm*): Der Fernseher hängt an einer Gelenk-Wandhalterung und steht von der Wand ab: Man sieht die Wandplatte, die zwei Klapparme und das Gelenk hinter dem Fernseher. Im Seitenfeld: seine **Größe** (43, 50, 55, 65, 75 oder 85 Zoll), **Schwenken** (bis zu 80° nach jeder Seite; + dreht den Bildschirm von vorne gesehen nach rechts), **Abstand zur Wand** (8 bis 80 cm, anfangs 15 cm) und **Neigung** (bis zu 15°, + kippt ihn nach unten). Geschwenkt oder geneigt zieht der Arm den Fernseher so weit heraus, wie er es braucht, damit er nie die Wand berührt; das Seitenfeld sagt dann, wie weit er absteht. Wie die anderen Fernseher hat er das **Hintergrundlicht** (LED hinter dem Fernseher, sein eigenes Licht aus Home Assistant), das sich mitdreht. Er rastet beim Setzen an der Wand ein; der 2D-Plan zeichnet ihn so breit wie seine Größe. Mit dem Stück gespeichert (`tvSize`, `armSwing`, `armReach`, `armTilt`, auch im Hausimport und -export). Neues Modul `tvmount.js` (reine Geometrie, Unit-Tests `tests/tvmount.test.mjs`: Bei keiner Größe, Schwenkung und Neigung geht etwas vom Fernseher in die Wand).
- **Klimaanlagen und Ventilatoren** in einer neuen Bibliotheksgruppe **Klima & Luft**: Klimaanlage (Split-Innengerät an der Wand), Außengerät / Wärmepumpe, mobile Klimaanlage mit Abluftschlauch, Deckenkassette, Deckenventilator mit Licht, Standventilator, Turmventilator, Luftreiniger und Luftentfeuchter. Der **Luftauslass einer Klimaanlage wird blau, solange sie kühlt, und rot, solange sie heizt** (wie ein Heizkörper): An einer Thermostat-Entität (`climate.*`) folgt er ihrem Modus, an einem einfachen Schalter kühlt sie, solange er an ist. Ihre Anzeige leuchtet, solange sie läuft, jetzt auch, wenn sie nur entfeuchtet oder lüftet (`dry`, `fan_only`, hvac-Aktion `drying` / `fan`). Das Licht des Deckenventilators ist eine eigene LED-Zone: den Ventilator mit der Ventilator-Entität und das Licht mit seinem Licht verbinden (oder es folgt dem Ventilator). In alle 7 Sprachen übersetzt; das Musterhaus hat sie alle und den Fernseher an seinem Arm (274 Geräte). Der Browser-Test-Teil `17_tvarm_climate` prüft die neue Gruppe, die Felder des Arms, den gedrehten Fernseher, die Farben des Auslasses und das Licht des Ventilators.

## [3.86.0] - 2026-10-16
### Neu
- **Der Gaming-PC-Tisch in sechs Monitor-Anordnungen**: den Tisch auswählen (jetzt *Gaming-PC-Tisch* genannt) und im Seitenfeld unter **„Anordnung“** wählen: 2 Monitore nebeneinander (wie bisher), 1 Monitor, 3 Monitore nebeneinander (die äußeren nach innen gedreht), 4 Monitore (2 × 2 an einem Monitorarm), ein gebogener Ultrawide-Monitor oder der gebogene mit zwei hochkant stehenden Monitoren daneben. Der Tisch wächst auf 1,8 m, wo drei Monitore oder der gebogene mit zwei hochkant stehenden es brauchen, auch im 2D-Plan; die Größenfelder folgen der Anordnung. Mit dem Stück gespeichert (`variant`, auch im Hausimport und -export); neu ist ein allgemeiner Weg, ein Stück in Varianten zu bauen (`variants` in `leisure.js`, `variantOf` in `scandi.js`).
- **Die großen LED-Spiegel haben zwei LED-Zonen**: Die Spiegelwand mit LED (Fitness) und der Ganzkörperspiegel mit LED (Flur) haben das Licht dahinter und zwei satinierte Lichtbänder vorne, links und rechts; unter „LEDs einzeln verknüpfen“ bekommt jedes sein eigenes Licht, oder beide folgen dem Licht des Spiegels.

## [3.85.0] - 2026-10-16
### Neu
- **Etwa 60 neue 3D-Stücke für Sauna, Fitness, Bar, Heimkino, die PC-Ecke und Spiegel mit LED-Licht**, mit vier neuen Bibliotheksgruppen. **Sauna & Wellness**: Sauna mit Glasfront (Bänke, Ofen mit Steinen, LED unter der Bank und hinter der Lehne), kleine Sauna, Infrarotkabine, Fasssauna für den Garten, Saunaofen, Whirlpool mit LED unter Wasser, Tauchbecken, Ruheliege, Schwallbrause. **Fitness**: Laufband, Heimtrainer, Indoor-Bike, Rudergerät, Crosstrainer, Hantelbank mit Langhantel, Power Rack, Kabelzugstation, Kurzhantelständer, Boxsack, Kettlebells, Gymnastikball, Yogamatte, Fitnessboden, Sprossenwand, Spiegelwand mit LED. **Bar**: Bartheke mit LED (gerade und über Eck), Rückbar mit Flaschen und LED-Böden, Barhocker mit Lehne, Stehtisch, Weinkühlschrank, Getränkekühlschrank, Zapfanlage mit leuchtendem Medaillon, Neonschild (Cocktailglas), Dartscheibe, Billardtisch mit seiner Lampe, Tischkicker. **Heimkino**: Rahmenleinwand, Motorleinwand, Deckenbeamer, Kinosessel und eine Reihe aus drei (LED-Becherhalter und Bodenlicht), Popcornmaschine, Standlautsprecher, Subwoofer, Akustik-Lamellenpaneel, LED-Sternenhimmel für die Decke. **PC** (Gruppe Büro): PC-Tower, Gaming-PC mit Glasseite und RGB-Lüftern, PC-Tisch mit zwei Monitoren, Tastatur und Tower, Laptop, Gaming-Stuhl, Netzwerkschrank. **Spiegel mit LED-Licht**: Spiegel mit indirekter LED, runder LED-Spiegel, Ganzkörperspiegel mit LED (Flur), LED-Spiegel mit 3 Zonen, Hollywood-Spiegel mit Glühbirnen, Spiegelschrank mit LED. Was leuchtet, folgt der verbundenen Entität: Die Steine der Sauna glühen orange, solange sie heizt, eine Leinwand wird hell, solange der Beamer oder Mediaplayer spielt, ein PC zeigt seine RGB-Farbe, Anzeigen und LED-Streifen leuchten in der Farbe des Lichts. Die meisten Stücke haben im Seitenfeld eine Ausführung (Saunen in Fichte, Hemlock, Zeder oder Thermoholz; Fitness-Rahmen, Bar-Fronten, Lederfarben …). Wandstücke (Spiegel, Leinwände, das Neonschild, die Dartscheibe, die Sprossenwand …) rasten beim Setzen an der Wand ein, auch die tieferen mit ihrer Rückseite an der Wandfläche; der Beamer, die Billardlampe und der Sternenhimmel hängen von der Decke.
- **LED-Zonen: ein Spiegel (oder die Bar) mit mehreren LEDs, jede mit ihrem eigenen Licht verbunden.** Der LED-Spiegel mit 3 Zonen (dahinter, die satinierten Bänder vorne, das Licht darunter), der Hollywood-Spiegel (Glühbirnen, dahinter), der Spiegelschrank (Lichtleiste oben, Licht darunter) und die Bartheken (Thekenkante, Sockel) haben LED-Zonen. Im Seitenfeld unter **„LEDs einzeln verknüpfen“** bekommt jede Zone ihr eigenes Licht oder ihren eigenen Schalter aus Home Assistant; eine leere Zone folgt der Entität des Geräts, ein Spiegel mit einem Licht braucht also nichts weiter. In 3D leuchtet jede Zone in der Farbe ihres eigenen Lichts (beim Bearbeiten zeigt eine ausgeschaltete Zone ihre eigene sanfte Farbe, wie die Abschnitte eines LED-Rings), jede Zone mit eigenem Licht erhellt den Raum, und im Live-Modus hat die Karte einen Knopf je Zone mit eigener Bedienung und „Alle LEDs“ an / aus. Die Offline-Liste, die Geräte-Übersicht, die Warnungen und ein Doppelklick (schaltet alle Zonen) kennen die Zonen auch.
- Neue Module `leisure.js` (die Stücke als reine Geometrie, Unit-Tests `tests/leisure.test.mjs`), `ledzones.js` (LED-Zonen, Unit-Tests `tests/ledzones.test.mjs`) und `shapes.js` (die mit `scandi.js` geteilten Bausteine). In alle 7 Sprachen übersetzt. Der Hausimport und -export (JSON) kennen die neuen Stücke und die Entitäten der Zonen (`leds`), und das Musterhaus *Musterhaus – alles drin* hat jedes neue Stück: einen neuen Kellerflügel mit Sauna & Wellness, Heimkino, Fitness und Bar, LED-Spiegel oben, Fasssauna, Whirlpool und Poolbar im Garten (264 Geräte). Der Browser-Test-Teil `16_leisure` prüft die Bibliothek, eine gesetzte Sauna und die LED-Zonen.

## [3.84.0] - 2026-10-15
### Neu
- **Über 50 neue Möbel im Stil der bekannten skandinavischen Möbel zum Selbstaufbauen**: Die Bibliothek wächst von etwa 95 auf etwa 145 Stücke. **Wohnen**: Würfelregale 2×2, 2×4, 4×4 und 4×1 (mit Stoffkisten, einer Tür und Büchern), das hohe weiße Bücherregal (offen oder mit Glastüren), ein Kiefernregal, eine Vitrine, eine TV-Bank, der einfache Couch- und Beistelltisch, der Schwingsessel mit gebogenem Birkengestell, ein Ohrensessel, ein kompaktes Sofa, ein Dreisitzer mit losen Kissen, ein Sofa mit Récamiere, ein runder Teppich, ein runder Säulen-Esstisch, ein Holz-Esstisch, ein Sprossenstuhl und ein Schalenstuhl. **Küche**: Servierwagen, Tritthocker. **Schlafzimmer**: Bett mit hohem Kopfteil, Kiefernbett, Kommoden mit 6 und 3 Schubladen, Nachttisch, Kleiderschrank mit 2 Türen, Kleiderschrank mit Schiebetüren (einer mit Spiegel), Kleiderständer. **Büro**: Schreibtisch mit Schubladen, kompakter Schreibtisch, Sitz-Steh-Schreibtisch, Rollcontainer, Bürostuhl mit hoher Lehne. **Bad**: Waschtisch mit Unterschrank, Hochschrank fürs Bad, Bambusregal. **Beleuchtung**: Papier-Stehlampe, Bogenlampe, Tischlampe, Papier-Pendelleuchte und Metall-Pendelleuchte; sie erhellen den Raum wie jede andere Lampe. **Deko**: Zimmerpalme. Zwei neue Bibliotheksgruppen: **Kinder** (Hochbett, Spielzeugregal mit Kisten, Kindertisch mit Stühlen, Hochstuhl, Plüschhai) und **Eingang** (Schuhschrank, Garderobenständer, Bank mit Schuhablage, Standspiegel). Es sind unsere eigenen einfachen Modelle mit den echten Größen solcher Stücke (zum Beispiel das Würfelregal 77 × 77 × 39 cm, das Bücherregal 80 × 202 × 28 cm, der Kleiderschrank 236 cm hoch), keine Dateien eines Geschäfts; die Namen der Stücke des Geschäfts (*kallax*, *billy*, *malm*, *pax*, *poäng*, *blåhaj* …) funktionieren als Suchwörter. Die meisten Stücke haben im Seitenfeld eine **Ausführung** (*Ausführung*: weiß, schwarzbraun, Eiche, Birke, Kiefer, Nussbaum, grau; die Sofas und Sessel in Stofffarben), mit dem Stück gespeichert. Der 2D-Plan zeichnet sie in ihrer echten Größe, und der Wandanschlag kennt sie. Neues Modul `scandi.js`: Jedes Stück ist reine Geometrie (eine Liste von Quadern, Zylindern und Kugeln; Unit-Tests `tests/scandi.test.mjs`: echte Größen, auf dem Boden stehend, mittig, Grundfläche, Ausführungen, Lampen leuchten); `models.js` macht aus den Teilen Meshes, `plan2d.js` nimmt die Grundfläche daraus, `props.js` zeigt die Ausführung. In alle 7 Sprachen übersetzt. Der Browser-Test-Teil `02_tools` prüft die Suche in der Bibliothek, die neuen Gruppen, ein gesetztes Stück und seine Ausführung. Der Hausimport und -export (JSON) kennen die neuen Stücke und ihre `finish` (`importer.py` liest sie aus `scandi.js`, Schema `property.schema.json`), und das Musterhaus *Musterhaus – alles drin* hat jetzt jedes davon (200 Geräte).

## [3.83.2] - 2026-10-15
### Repariert
- **Standbilder der Kameras und das Live-Video waren abgeschnitten: Nur das erste Stück kam durch** (#385): Das Add-on las die Antwort von Home Assistant mit einem Aufruf, der nur gibt, was bis dahin angekommen ist (`content.read(n)` in aiohttp), nicht die ganze Antwort. Über den Supervisor kommt ein Standbild oder ein Stück des Live-Videos in mehreren Teilen an, darum wurde nur das erste weitergegeben: Das Protokoll des Add-ons zeigte fast jedes Bild und Videostück mit genau derselben Größe (101418 oder 7296 Bytes). Ein abgeschnittenes Bild zeigt sich schwarz oder teilweise grau, was sehr wahrscheinlich auch die Ursache der schwarzen Standbilder in #381 war. Ein abgeschnittenes Videostück lässt sich nicht abspielen, darum blieb die Kamera-Karte bei *Live-Bild wird verbunden …* und fiel dann auf Standbilder zurück. Das Add-on liest jetzt jede Antwort bis zu ihrem Ende (`read_all` in `server.py`; ein Standbild oder Videostück über der Grenze wird abgelehnt, nie abgeschnitten). Ein neuer Server-Test schickt ein 300-KB-Bild und -Videostück langsam in Teilen (vor der Reparatur kamen nur die ersten 40 KB durch). Der nachgebaute Home Assistant des Browser-Tests schickt seine Standbilder und Videostücke jetzt in zwei Teilen mit einer Pause, wie der Supervisor, so würde der Teil `09_floors` das auch erwischen.

## [3.83.1] - 2026-10-15
### Repariert
- **Die Kamera-Karte zeigt jetzt das Live-Video (in 3.83.0 blieb sie schwarz)** (#383): 3.83.0 holte für die Kamera-Karte den MJPEG-Stream von Home Assistant. Zwischen Add-on und Home Assistant sitzt der Supervisor, und der gibt eine Antwort erst weiter, wenn sie vollständig ist. Ein MJPEG-Stream endet nie, darum kam kein einziges Bild an: Die Karte blieb dunkel mit dem Schild *Standbild*. Schlimmer noch, der Supervisor hielt jeden dieser Streams 5 Minuten offen, so musste die Kamera im Hintergrund zusätzliche Streams liefern (Kameras erlauben nur wenige gleichzeitig, was auch die Standbilder stören konnte). Der Browser-Test merkte es nicht, weil sein nachgebauter Home Assistant keinen Supervisor dazwischen hatte. Die Karte spielt jetzt den eigenen **HLS-Stream** der Kamera aus Home Assistant, denselben, den seine Live-Ansicht zeigt: Das Add-on fragt Home Assistant danach (Websocket `camera/stream`, neue API `/api/camera/<entity>/hls`) und reicht seine Playlisten und Videostücke durch (`/api/hls/<token>/...`, nur die eigenen Dateinamen von Home Assistant). Jede davon ist eine vollständige Antwort, so kommen sie durch den Supervisor. Home Assistant betreibt einen solchen Stream je Kamera für alle Zuschauer, es gibt also keine zusätzliche Last je Zuschauer. Das Video spielt **hls.js** ab (mitgeliefert in `vendor/hls.light.module.min.js`, Apache 2.0, nur geladen, wenn eine Kamera-Karte aufgeht) oder der Browser selbst, wo er HLS abspielt (Safari). Das Schild funktioniert wie bisher (*LIVE*, *Live-Bild wird verbunden …*, *Standbild*). Eine Kamera ohne Stream in Home Assistant zeigt sofort Standbilder. Eine neu gezeichnete Karte (zum Beispiel, wenn sich der Bewegungsmelder ändert) behält ihr laufendes Video, und das Video hält an, wenn die Karte geschlossen oder die Seite versteckt wird. Der MJPEG-Weg `/api/camera/<entity>/live` und `mjpeg.js` sind weg. Neues Modul `camlive.js` (Regeln in `liveNext`, `playWay`, `HLS_CONFIG`, Unit-Tests `tests/camlive.test.mjs`), Server-Tests in `tests/test_server.py`. Der nachgebaute Home Assistant des Browser-Tests beantwortet jetzt `camera/stream` und liefert ein kleines HLS-Testvideo (`tests/e2e/hls`), und der Teil `09_floors` prüft, dass das Video wirklich durch das Add-on läuft, beim Neuzeichnen der Karte bleibt, beim Schließen anhält und dass eine Kamera ohne Stream Standbilder bekommt.

## [3.83.0] - 2026-10-15
### Repariert
- **Die Kamera-Karte zeigt die Kamera live statt eines schwarzen Standbilds** (#381): Im Live-Modus öffnete ein Tipp auf eine Kamera ihre Karte mit einem Bild, das oft ganz schwarz war oder verschmiert und nur alle 5 Sekunden erneuert. Die Karte zeigte gar keinen Stream, nur ein Standbild; bei Kameras wie einer Tapo C425 mit der Entität *HD Stream (Direct)* startet jedes Standbild den Stream der Kamera neu und nimmt sein allererstes Bild, das meist schwarz ist. Die Karte zeigt die Kamera jetzt **live**: Das Add-on reicht den MJPEG-Stream von Home Assistant durch (neue API `/api/camera/<entity>/live`, derselbe Stream, den die eigenen Karten von Home Assistant nutzen), und die Seite zeigt seine Bilder nacheinander. Ein kleines Schild im Bild sagt *LIVE* (roter Punkt), *Live-Bild wird verbunden …* beim Verbinden oder *Standbild*, wenn eine Kamera keinen funktionierenden Stream hat: Dann fällt die Karte wie bisher auf die Standbilder zurück (und versucht es nach 5 Minuten wieder live). Der Stream läuft nur, solange die Karte offen und die Seite sichtbar ist; höchstens 4 Live-Bilder laufen gleichzeitig, und ein Stream endet nach 10 Minuten (die Seite verbindet sich dann von selbst neu). Ein Tipp auf das Bild öffnet weiter die Live-Ansicht von Home Assistant. Das Ingress von Home Assistant wirft die *boundary* eines MJPEG-Streams weg (und würde ihn komprimieren), darum konnte ein einfaches Bild ihn dort nicht zeigen: Das Add-on schickt die Bytes unverändert, und das neue Modul `mjpeg.js` schneidet sie in Bilder (Unit-Tests `tests/mjpeg.test.mjs`); wann neu verbunden oder zurückgefallen wird, steht in `liveNext` in `cameras.js` (Unit-Tests). Server-Tests in `tests/test_server.py`; der Browser-Test-Teil `09_floors` prüft, dass das Bild läuft und beim Schließen der Karte anhält. Das Raum-Feld und die Kamera-Übersicht behalten ihre Standbilder (viele Kameras gleichzeitig wären viele Streams).

## [3.82.0] - 2026-10-15
### Neu
- **Der Strom-Editor hat einen eigenen Reiter für die Rechnung: welcher Sensor was ist und wie gezählt wird** (#378): Der neue Knopf **⚡ Rechnung** neben *Kabel* (er zeigt sich, solange der Strom-Editor an ist) öffnet ein Fenster, in dem man einstellt, welcher Sensor von Home Assistant was misst, damit die Strom-Übersicht oben links (auch im Live-Modus) aufgeht. **Netz**: ein Sensor (plus = Bezug, minus = Einspeisung) oder zwei getrennte für Bezug und Einspeisung, und *Vorzeichen umdrehen* für einen Zähler, der andersherum zählt. **Erzeugung**: ein oder mehrere Solarsensoren, zusammengezählt. **Batterie**: der Ladestand und ein Sensor (plus = laden) oder zwei für Laden und Entladen, ihr Vorzeichen und ob die Batterie im Hausverbrauch zählt (aus bei einem Hybrid-Wechselrichter, dessen Erzeugungssensor sie schon enthält). **Hausverbrauch**: berechnet (Erzeugung + Bezug − Einspeisung + Entladen − Laden) oder ein eigener Sensor, der dann gezeigt und mit der Rechnung verglichen wird. **Räume**: welche Sensoren (Zwischenstecker, Unterzähler) messen, was jeder Raum verbraucht; *Vorschlagen* nimmt die Sensoren in Watt aus dem Home-Assistant-Bereich des Raums oder die im Raum gesetzten; was kein Raum erklärt, ist der Rest. Oben zeigt das Fenster die Rechnung Zeile für Zeile mit den Werten von jetzt, und was nicht aufgeht: ein Verbrauch unter null (*Vorzeichen am Netz / der Batterie umdrehen* behebt es mit einem Klick), ein Haus-Sensor weit weg von der Rechnung, Räume, die mehr verbrauchen als das Haus, ein doppelt gezählter Sensor. Was nicht eingestellt ist, kommt wie bisher von den Stromgeräten des Plans. Alles wird mit dem Haus gespeichert (`energy` im Plan) und folgt umbenannten Entitäten; der Tooltip der Übersicht listet die Räume und den Rest. Die Regeln stehen im neuen Modul `energycalc.js` (Unit-Tests `tests/energycalc.test.mjs`), das Fenster in `energyui.js`; der neue Browser-Test-Teil `15_energy` prüft es.

### Repariert
- **Die Strom-Übersicht zählt die Batterie beim Verbrauch mit** (#379): Die Übersicht oben links rechnete den Verbrauch als Erzeugung + Netz und ließ die Batterie weg, darum machte eine ladende Batterie den Verbrauch zu hoch und eine entladende zu niedrig. Jetzt ist er Erzeugung + Bezug − Einspeisung + Entladen − Laden. Eine Batterie, deren Sensor nur *lädt* / *entlädt* als Text meldet, zeigt jetzt ihren Pfeil (↑ / ↓) in der Übersicht; vorher zeigte sie keinen.

## [3.81.0] - 2026-10-14
### Neu
- **Heizungen zeigen nur ihre Temperatur, rot, solange sie heizen, blau, solange nicht** (#374): Ein Heizkörper, Handtuchheizkörper oder eine *Heizung* (Thermostat), mit einer Entität verbunden, bekommt im Live-Modus nicht mehr die große runde Tipp-Kugel mit Thermometer. Er zeigt nur seine Werte-Pille mit der Temperatur, die rot ist, solange die Heizung heizt, und blau, solange nicht (ruht, aus, kühlt); ein Tipp auf die Temperatur öffnet seine Karte wie vorher die Kugel. Mit ausgeschalteten Werte-Schildern (*Werte-Schilder: keine*) behält die Heizung ihre Kugel. Regeln im neuen Modul `heating.js` (`isHeater`, `heatMode`, `pillTone`, Unit-Tests `tests/heating.test.mjs`), die Farben der Pille in `labels.js`, die Tippfläche auf der Pille (`pillFinger`) in `floorbuild.js`.
- **Ein Knopf zum Thermostat in Home Assistant im Heizungs-Feld** (#374): Jedes Thermostat im Heizungs-Feld neben dem Raum-Feld hat den Knopf *ⓘ In Home Assistant öffnen*, der das eigene Fenster von Home Assistant für die Entität öffnet (Verlauf, Einstellungen), wie *Details* auf der Live-Karte. Wie dort zeigt er sich nur, wenn das Add-on in Home Assistant läuft (Seitenleiste oder Dashboard-Karte). `heatpanel.js` (Unit-Test), geprüft vom Browser-Test-Teil `06_ledring`.
- **Türen und Fenster mit Sensor haben einen grünen Rahmen, solange sie zu sind** (#375): Bisher sah man nicht, welche Türen und Fenster einen Kontaktsensor haben. Geschlossen ist ihr Rahmen jetzt grün; offen bleiben sie wie bisher rot; wenn ihr Sensor nicht meldet (nicht verfügbar, unbekannt, weg), ist der Rahmen bernsteinfarben. `contactLook` und `partHex` in `openings.js` (Unit-Tests).
- **Geräte-Übersicht mit Batteriestand** (#376): Der neue Knopf **📋 Geräte** oben zeigt und versteckt eine Liste jedes gesetzten Geräts, das mit Home Assistant verbunden ist, und jeder Tür / jedes Fensters mit Sensor oder Rollladen, nach Etage und Raum, jeweils mit seinem Zustand, seinem **Batteriestand** und ob es offline ist. Die Batterie kommt vom Batteriesensor desselben Geräts in Home Assistant (ein Sensor mit `device_class: battery` oder ein Binärsensor „Batterie schwach“; das Add-on liest dafür das Entitätenregister von Home Assistant, `battery_of` in `renames.py`, neue API `/api/batteries`) oder vom Batteriestand, den ein Gerät selbst meldet (ein Saugroboter, `bat` im schlanken Zustand). Filter: *Alle*, *🔋 Batterie* (die leersten zuerst) und *⚠ Offline*; eine Batterie bei oder unter 20 % ist rot, und der Knopf zeigt, wie viele schwach sind (🪫 n). Ein Tipp auf ein Gerät zeigt es im Plan (am Handy schließt sich die Liste). Am Handy sitzt der Knopf in der 📊-Liste. Neues Modul `devicelist.js` (Unit-Tests `tests/devicelist.test.mjs`), Server-Tests in `tests/test_renames.py` und `tests/test_server.py`; der Browser-Test-Teil `07_tablet` prüft es mit einem Rauchmelder und seinem Batteriesensor im nachgebauten Home Assistant.
- **Was offline ist, wird in 3D markiert** (#375): Alles, was die Offline-Liste nennt (eine Entität, die nicht verfügbar, unbekannt oder weg ist, oder eine Lampe / ein smartes Gerät, das mit nichts verbunden ist), zeigt jetzt auch in der 3D-Ansicht eine kleine Kugel mit durchgestrichenem Blitz, rot, wenn offline, bernsteinfarben, wenn mit nichts verbunden, über dem Gerät (auf seiner Werte-Pille, wenn es eine hat) oder in der Mitte der Tür / des Fensters. Im Live-Modus zeigt ein Gerät mit Tipp-Kugel das Zeichen stattdessen auf seiner Kugel. Neues Modul `offlinemarks.js` (Unit-Tests `tests/offlinemarks.test.mjs`); der Browser-Test-Teil `07_tablet` prüft die Zeichen und die Farben der Rahmen.

### Repariert
- **Eine Heizung wird rot, solange sie heizt** (#374): Das Modell *Heizung* (Thermostat) ließ beim Heizen nur sein kleines Licht in der Ecke leuchten, der Heizkörper selbst blieb weiß; der *Heizkörper* und der Handtuchheizkörper bekamen nur einen blassen orangen Schein auf ihrer weißen Farbe. Jetzt wird der ganze Heizkörper deutlich rot, solange er heizt, und kühl blau, solange nicht, auch im Hologramm-Design (`paintHeat` in `heating.js`); der Browser-Test-Teil `04_lights` prüft beide Modelle.

## [3.80.0] - 2026-10-13
### Neu
- **Eine Küchenzeile kommt über einzelnen Modulen ohne Oberschrank aus** (#372): Bisher schaltete der Haken *Oberschränke* die Oberschränke der ganzen Zeile ein oder aus. Jetzt hat jede Zeile der Modulliste ihren eigenen Haken: Ohne ihn ist dieses Modul nur der Unterschrank mit der Arbeitsplatte (über dem Herd: keine Haube). Der Haken sitzt neben der Breite; Module, die nie einen Oberschrank haben (Kühlschrank, Hochschrank, Lücke), haben keinen. Der Haken oben bleibt der Hauptschalter für die ganze Zeile. Das Modul behält die Einstellung, wenn sich seine Art, Breite oder sein Platz ändert, und auch das Importformat behält sie (`{"m": "base", "up": false}`, docs/IMPORT.md). Die Regeln stehen in `kitchen.js` (`withUpper`, `hasUpper`, Unit-Tests), der Haken in `kitchenui.js`; der Browser-Test-Teil `05_power` prüft es.

## [3.79.2] - 2026-10-13
### Repariert
- **Die Kindersicherung eines Thermostats zeigt sich bei der Heizung, nicht bei den Schaltern des Raums** (#370): Ein Thermostat bringt in Home Assistant weitere Entitäten mit, etwa seine Kindersicherung, Fenstererkennung oder Ventilerkennung. Sie standen im Raum-Feld unter *Schalter* neben den Lichtschaltern. Home Assistant weiß, welche Entitäten zum selben Gerät gehören (das Entitätenregister, das das Add-on schon liest); das Add-on merkt sich jetzt, welche Entität zum Gerät eines Thermostats gehört (`climate_parts` in `renames.py`, `parts` in `/api/areas`), und das Raum-Feld zeigt diese Entitäten im Heizungs-Feld unter ihrem Thermostat (Schalter als Schiebeschalter, Werte als Text; `splitHeatParts` und `partName` in `heatpanel.js`, mit Unit-Tests). Ist das Thermostat nicht in diesem Raum, bleiben sie in der Liste des Raums.

## [3.79.1] - 2026-10-13
### Repariert
- **Das Raum-Feld listet die Neben-Entitäten eines Geräts nicht mehr auf** (#368): Ein mit einem Home-Assistant-Bereich verbundener Raum zeigte unter *Sensoren* jede Entität des Bereichs, auch die Diagnose-Entitäten seiner Geräte; bei einem Tasmota-Relais sind das seine letzte Neustartzeit, MQTT- und WLAN-Verbindungszähler, Neustartgrund, SSID, IP-Adresse, Firmware und Signal, obwohl nur sein Schalter benutzt wird. Home Assistant markiert solche Entitäten als Diagnose oder Konfiguration (`entity_category`) und lässt sie aus seinen eigenen Dashboards heraus; das Add-on macht jetzt dasselbe im Raum-Feld, in der Entitätenliste des Raums und beim Setzen eines ganzen Bereichs und lässt auch in Home Assistant versteckte Entitäten weg. Das Add-on liest das Entitätenregister von Home Assistant schon (für umbenannte Entitäten), jetzt merkt es sich auch diese Entitäten (`side_entities` in `renames.py`); `/api/areas` listet sie unter `side` statt unter `entities` (`area_list` in `server.py`), so sortiert die Entitätenauswahl sie weiter in ihren Bereich ein (`areaIndex` in `livechannel.js`). Unit-Tests in `tests/test_renames.py`, `tests/test_server.py` und `tests/livechannel.test.mjs`.

## [3.79.0] - 2026-10-13
### Neu
- **Lampen an einem Relais erhellen den Boden, und jede Lampe kann ihre eigene Lichtfarbe haben** (#367): Eine Lampe, die nur ein- und ausgeschaltet wird, z. B. über ein Relais (eine `switch.…`-Entität an einer Deckenleuchte, Pendelleuchte, einem Strahler, einer Wandlampe, Stehlampe, einem LED-Streifen …), erhellte den Boden nur mit 60 % der Reichweite einer Licht-Entität, immer in der normalen Lichtfarbe, und ihre Tipp-Kugel zeigte einen Stecker. Jetzt erhellt sie den Boden wie jede Lampe, und ihre Kugel zeigt eine Glühbirne. Weil ein Relais die Farbe der Lampe nicht verrät, hat das Seitenfeld einer Lampe das neue Feld **Lichtfarbe** (`lightColor`): Der Boden, die Lampe und ihre Kugel leuchten darin, z. B. kaltweiß statt warmweiß; eine Lampe, die selbst eine Farbe meldet, nimmt weiter diese, ↺ geht zur normalen Lichtfarbe der Einstellungen zurück; auch das Importformat behält sie (`lightColor`, docs/IMPORT.md). Eine Lampe knapp außerhalb des Umrisses ihres Raums (bis 30 cm, an der Wand, nicht in einem anderen Raum) erhellt jetzt auch den Raum; vorher erhellte sie den Boden gar nicht. Die Regeln stehen im neuen Modul `lamplight.js` (aus `app.js` herausgezogen, Unit-Tests `tests/lamplight.test.mjs`); der Browser-Test-Teil `04_lights` prüft eine Lampe an einem Relais.

### Repariert
- **Ein Fernseher, der nur ein Hintergrundlicht hat, lässt sich im Live-Modus nicht mehr antippen** (#364): Ein Fernseher (oder Wand-TV), dessen eigene Entität leer war, dessen Hintergrundlicht (die LED hinter dem Fernseher) aber verbunden war, bekam eine Tipp-Kugel (eine graue Glühbirne) und ließ sich antippen, und seine Karte sagte nur *Keine Entität verknüpft*, ohne einen Knopf. Was mit nichts verbunden ist, hat keine Kugel und nimmt keinen Tipp an (#130), und das Hintergrundlicht allein zählt nicht mehr als Verbindung des Fernsehers: Seine Karte zeigt nur den Fernseher selbst. Das Hintergrundlicht ist weiter ein Licht des Raums: Es leuchtet und steht im Raum-Feld und unter *Ganzer Raum*. `linkedDevice` in `pickrules.js` ist jetzt die eine Regel für den Tipp und die Kugel (`wantsBall` in `tapballs.js`), mit Unit-Tests; der Browser-Test-Teil `04_lights` prüft so einen Fernseher.
- **Ein Schalter zeigt auf seiner Tipp-Kugel einen Lichtschalter, keinen Stecker** (#366): Jede `switch.…`-Entität bekam im Live-Modus einen Stecker 🔌 auf ihre Kugel, auch ein Wandschalter oder ein Relais. Es gibt kein Emoji für einen Lichtschalter, darum zeichnet die Kugel jetzt einen (eine weiße Platte mit Wippe). Nur ein Schalter, den Home Assistant als Steckdose meldet (`device_class: outlet`), behält den Stecker; eine Geräteart mit eigenem Symbol (eine Waschmaschine, eine Wallbox …) behält ihres auch. `ballIcon` in `tapballs.js` (Unit-Tests); der Browser-Test-Teil `11_live` prüft einen Schalter.

## [3.78.3] - 2026-10-12
### Repariert
- **Die Tür einer Abstellkammer in einem Raum gehört zum Raum** (#362): Ein Raum, dessen Umriss eine kleine Kammer einschließt (hier eine Kammer unter der Treppe neben der Küche), hat die Wand und Tür der Kammer in sich, nicht an seinem Rand. Wurde der Raum gewählt, fehlten diese Wand und ihre Tür in 3D, die Objektliste zeigte die Tür unter *Kein Raum*, und das Raum-Feld listete ihren Kontakt nicht: Eine Tür zählte nur für einen Raum, wenn ihre Mitte höchstens 35 cm vom Rand des Raums entfernt war (innen nur bei Gaubenfenstern), und ein gewählter Raum behielt nur die Wände bis 30 cm von seinem Rand. Jetzt gehören auch Türen, Fenster und Wände innerhalb des Umrisses zum Raum, wie die Liste offener Türen und Fenster sie schon zählte. `roomOpenings` in `roompanel.js`, `clipWallToRoom` in `roomclip.js` (Unit-Tests); der Browser-Test-Teil `11_live` prüft eine Kammerwand mit ihrer Tür in einem gewählten Raum.

## [3.78.2] - 2026-10-12
### Repariert
- **Ein Tipp direkt nach einer Kamerabewegung geht nicht mehr daneben** (#360): Wenn die Kamera sprang (in einen Raum, die Startansicht, ein Test), zielte ein Tipp oder Klick vor dem nächsten gezeichneten Bild mit der alten Blickrichtung der Kamera und konnte nichts oder das Falsche treffen. Die Weltmatrix der Kamera wird jetzt erneuert, bevor der Strahl eines Tipps gebaut wird (`picking.js`). Auf einem langsamen Rechner ließ das die Browser-Test-Prüfung *in 3D wird das Dach angetippt* (Teil `10_roofs`) ab und zu scheitern; die Prüfung bewegt die Kamera und tippt jetzt in einem Schritt, so testet sie diesen Fall immer.

## [3.78.1] - 2026-10-12
### Repariert
- **Ein gewählter Raum zeigt keine Geräte des Raums hinter der Wand mehr** (#358): Ist ein Raum gewählt (im Live-Modus angetippt, aus dem Raum-Menü, ein Raum-Tablet oder die Dashboard-Karte), wird nur dieser Raum gezeichnet, aber Geräte des Nachbarraums, die knapp hinter einer gemeinsamen Wand standen, tauchten auch darin auf. Der Raum behielt jedes Gerät bis 30 cm von seinem Rand, gedacht für Wandlampen an seiner eigenen Wand. Jetzt gehört ein Gerät außerhalb des Raums, aber nah an seinem Rand, nur dann zu ihm, wenn es nicht in einem anderen Raum der Etage steht; eine Wandlampe an einer Außenwand bleibt, und Wände, Türen und Fenster bleiben wie bisher. Das passt zum Raum-Feld, das schon nur die Geräte im Raum aufzählte. `deviceInIso` in `roomclip.js` (Unit-Test); der Browser-Test-Teil `11_live` prüft zwei Räume nebeneinander.

## [3.78.0] - 2026-10-12
### Neu
- **Dashboard-Karte: nur ein Raum in 3D, oder nur die Bedienung des Raums als eigene Karte** (#356): Mit einem gewählten Raum zoomte die Karte bisher hinein und öffnete das Raum-Feld darüber, und in einer Dashboard-Karte verdeckte das Feld den größten Teil des Raums. Die neue Karten-Option `view` (*Zeigen* im visuellen Editor) arbeitet mit `room` zusammen: `room` zeigt nur diesen Raum in 3D und verlässt ihn nie (kein Raum-Feld darüber, ein Tipp in den Raum geht nicht zur Etage zurück, keine Leiste oben, keine Suche, kein Warnbanner, das woandershin springt; nach der Ruhezeit geht die Kamera zum Raum zurück); `panel` zeigt nur das Raum-Feld dieses Raums, kartenfüllend, mit der Heizung darin und ohne Schließen-Knopf und ohne 3D-Bild dahinter (es wird nichts gezeichnet, das spart Strom). Beides nebeneinander gestellt zeigt den Raum und seine Bedienung zugleich. Ohne Raum sagt die Karte, man solle einen wählen; mit einem Add-on älter als 3.78.0 sagt sie, man solle das Add-on aktualisieren. Die Option *Raum-Feld* unter *In der Karte zeigen* sagt jetzt, dass sie auch den Start eines Raum-Tablets betrifft (ausschalten für die 3D-Ansicht eines Raums ohne das Feld). `view` in `cardmode.js` (Unit-Tests), `alone()` in `roompanel.js`, `needsNewer` in `dist/floorplan3d-card.js` (Unit-Tests); der Browser-Test-Teil `13_card` prüft beide Ansichten. In HACS: die Karte auf 3.78.0 aktualisieren, dann den Browser neu laden.

## [3.77.1] - 2026-10-11
### Repariert
- **Dashboard-Karte: „Add-on nicht gefunden“ ab Home Assistant 2026.2** (#352): Die Karte findet das Add-on über sein Seitenleisten-Panel, und seit Home Assistant 2026.2 nennt das Panel sein Add-on in `config.addon` statt in `config.ingress`, darum sagte die Karte (und die Vorschau in ihrem Editor) *Das 3D-Floorplan-Add-on wurde nicht gefunden*, obwohl das Add-on lief. Die Karte liest jetzt beides. Ist das Add-on nicht in der Seitenleiste und das Repository unter einer anderen Adresse hinzugefügt, schaut die Karte eines Administrators auch in der Liste der installierten Add-ons nach. Die Meldung nennt die Add-on-Namen, die sie versucht hat, und sagt *Einstellungen → Apps* (der neue Name der Add-ons). `slugs` und `slugsFromList` in `dist/floorplan3d-card.js` (Unit-Tests); der Browser-Test nutzt das neue Panel-Format und die Liste. In HACS: die Karte auf 3.77.1 aktualisieren, dann den Browser neu laden.

## [3.77.0] - 2026-10-11
### Neu
- **Beispiel: Musterhaus mit allem drin**: Das Import-Fenster hat ein drittes Beispiel, *Beispiel: Musterhaus (alles drin)* (`examples/showcase.json`, auch in `docs/examples/` und über `GET /api/import/examples/showcase`). Ein Haus, das jeden Teil des JSON-Formats nutzt: alle 93 Gerätearten, alle 14 Arten von Türen und Fenstern (mit Rollläden, Fenstersensoren je Flügel, eigenen Größen), alle fünf Arten von Treppen (U über zwei Etagen, L, gerade, Wendeltreppe, Wandtreppe mit Podest), einen Keller mit ausdrücklichen Wänden, ein Erdgeschoss mit eigenem Umriss (Garage), ein Obergeschoss mit Dachterrasse, einen Luftraum über dem Wohnzimmer und eine Galerie, ein Satteldach mit einem Versatz in der Traufe, drei Arten von Gauben und Solarpanels, ein Gartenhaus mit eigenem Walmdach, Stromkabel vom Hausanschluss über Zähler, Sicherungskasten, Wechselrichter und Batterie zur Wallbox, eine Küchenzeile, Nanoleaf, LED-Ring und einen Garten mit Pool, Brücke und Solarpanels auf dem Boden. Ein Unit-Test sorgt dafür, dass das Beispiel weiter jede Geräteart, jede Öffnungs-Vorlage und jede Treppenart nutzt, und ein neuer Browser-Test-Teil `14_showcase` importiert es über das Fenster.

### Repariert
- **JSON-Import** (#353): Ein Raum mit `"terrace": true` (Dachterrasse) bekommt keine Wände mehr an seinen offenen Seiten, nur dort, wo er an einen gewöhnlichen Raum stößt; Dinge auf der Etage der Art `roof` (Solarpanels auf dem Dach, die Räume eines Dachbodens) werden jetzt importiert und exportiert, statt stillschweigend wegzufallen; der Grundkasten eines Dachs und weiterer Dächer bewegt sich wie die Räume mit `building.origin`; das Importschema (`/api/import/schema`, auch von *KI-Prompt kopieren* benutzt) listet wieder alle Gerätearten auf (13 fehlten, darunter `wallbox`, `battery`, `solarpanel`, `inverter`, `kitchenrun`, `bridge`) und beschreibt Schleppgauben (`shed`, `sp`) und Versätze in der Traufe (`steps`). Ein Test hält die Gerätearten des Schemas im Einklang mit der Bibliothek.

## [3.76.0] - 2026-10-11
### Verbessert
- **Durchsichtig: Nur die Wand wird durchsichtig, nicht ihre Türen und Fenster** (#350): Mit *Durchsichtig* an (Ansicht-Menü oder ⚙) verblassen beim Drehen der Kamera die Wände, die zur Kamera zeigen, und mit ihnen ihre Fenster (Rahmen, Glas, Rollladen) und Türen (Rahmen, Blatt), so verschwanden diese fast. Jetzt verblasst nur die Wand selbst; Türen und Fenster behalten ihr normales Aussehen, und die Möbel hinter der Wand bleiben wie bisher fest. `fadesWithWall` in `cutaway.js` (Unit-Test); der Browser-Test prüft eine Wand mit Tür und Fenster und einem Sofa dahinter.

## [3.75.1] - 2026-10-11
### Repariert
- **Die Dashboard-Karte wird wieder von HACS installiert** (#348): HACS lud nur die Demo-Datei herunter und nicht die Karte, darum sagte ein Dashboard *Custom element doesn't exist: floorplan3d-card* (und `/hacsfiles/HA-Floorplanner/floorplan3d-card.js` gab 404). Sobald ein Release Dateien angehängt hat, lädt HACS nur diese herunter, und jedes Release hatte nur die Demo angehängt. Jetzt trägt jedes Release auch `floorplan3d-card.js`, angehängt, wenn das Release angelegt wird (bevor es veröffentlicht wird), und der Release-Workflow fügt sie dem neuesten Release hinzu, wenn sie fehlt. In HACS: die Karte auf 3.75.1 aktualisieren (oder ⋮ → *Erneut herunterladen*), dann den Browser neu laden.

## [3.75.0] - 2026-10-11
### Neu
- **Dashboard-Karte: der 3D-Grundriss auf jedem Home-Assistant-Dashboard** (#13): Die neue Lovelace-Karte `custom:floorplan3d-card` zeigt die Live-3D-Ansicht des Add-ons in einem Dashboard, ohne Bearbeiten; ein Tipp auf ein Gerät steuert es wie im Add-on (die Live-Karte, das Raum-Feld, das eigene Detailfenster von Home Assistant). Installiert über **HACS** (dieses Repository als benutzerdefiniertes Repository der Art *Dashboard* hinzufügen, die Karte wird dann von selbst geladen) oder von Hand (`dist/floorplan3d-card.js` nach `/config/www`, Ressource `/local/floorplan3d-card.js`). Die Karte findet das Add-on von selbst (sein Seitenleisten-Panel, sonst die üblichen Namen; Option `addon` für alles andere), öffnet es wie das Seitenleisten-Panel über Home Assistant Ingress und hält die Ingress-Sitzung am Leben. Optionen, alle freiwillig und auch im visuellen Editor (Etagen, Räume und Häuser als Ausklapplisten aus dem Add-on): `floor` (ein Name, eine Zahl mit 0 = Erdgeschoss und -1 = Keller, oder `house` für das ganze Haus), `room`, `house`, `title`, `height` (oder `fill` für den ganzen Bildschirm; in einem Abschnitte-Dashboard nimmt die Karte die Größe ihrer Zelle), `theme` (`auto` folgt dem dunklen / hellen Modus von Home Assistant, oder `dark`, `light`, `holo`), `quality` (`low` / `high`), `walls` (`auto`, `see_through`, `low`, `full`), `labels`, `heatmap` (`temp`, `humid`, `co2`), `alerts`, `idle_return` (Minuten, zurück zur Etage der Karte), `night` (`off`, `sun`, `time`), `room_panel`, `show_nav` und `show_bar` (die Leisten über dem Haus weglassen). Die Karte sagt, was falsch ist, wenn das Add-on fehlt, gestoppt oder zu alt ist. Das Aussehen einer Karte gilt nur für ihren Bildschirm und wird nie als Einstellung für alle gespeichert.
- Im Add-on öffnet `?card=1` die Seite so, wie die Karte sie braucht: Live-Ansicht ohne Bearbeiten-Leisten, die Optionen der Karte aus der Adresse. Neues Modul `cardmode.js` (Unit-Tests); das Aussehen der Karte geht über die Benutzer-Voreinstellungen (`viewprefs.js`, `CARD_FIELDS`), eine Karte ohne Raum-Feld sagt `roompanel.js`, es nicht zu öffnen. In einer niedrigen Karte sitzt die Farbskala der Raumfärbung oben, weg vom Kompass. Die Karte selbst ist `dist/floorplan3d-card.js` (eine Datei ohne Build-Schritt, Unit-Tests `tests/card.test.mjs`), `hacs.json` macht das Repository zu einem HACS-Dashboard-Repository. Neuer Browser-Test-Teil `13_card` (die Karte auf einem nachgebauten Dashboard mit der echten Seite des Add-ons darin).

## [3.74.0] - 2026-10-11
### Neu
- **Eine Schleppgaube geht bündig bis an den Rand des Dachs** (#345): Eine Schlepp- oder Flachdachgaube auf einem Satteldach konnte den Giebel nicht erreichen: Sie hielt immer einen Abstand zum Rand des Dachs. Jetzt bleibt sie zwischen den Giebelwänden, und mit *Abstand zum Giebel* 0 (oder dem Regler am Ende) gehen ihre Vorderwand, Seitenwand und ihr Dach bündig bis an den Rand des Dachs, so sind der Giebel des Dachs und die Seite der Gaube eine Fläche. Dasselbe am anderen Ende, und an beiden Enden bei einer Gaube so lang wie das Haus. Eine Giebelgaube und Gauben auf einem Walmdach behalten ihren Abstand. `fitDormer` in `dormer.js` (Unit-Tests).
- **Die Ecken eines Versatzes einzeln ziehen** (#345): Im 2D-Plan hat jeder Versatz in der Traufe des gewählten Dachs zwei Ecken (Kreise), eine an jedem Stück. Eine davon zu ziehen, verschiebt den Versatz entlang des Firsts (mindestens 30 cm vom nächsten) und die Traufe seines Stücks nach außen oder innen, in 5-cm-Schritten (Alt: frei). `cornerHandles` und `moveCorner` in `roofsteps.js` (Unit-Tests); die Browser-Tests ziehen eine Ecke und prüfen die bündige Gaube.

## [3.73.0] - 2026-10-11
### Neu
- **Dach mit Versatz: ein Haus vorne schmaler und hinten breiter** (#342): Die Traufen eines Sattel- oder Flachdachs können jetzt Versätze haben. Ab einem Punkt entlang des Firsts liegt die Traufe einer Seite weiter außen (oder innen) als der Rest, wie dort, wo ein Haus ein Stück vorspringt. Der First bleibt gerade und auf einer Höhe, und die Traufe bleibt auf der Höhe der Wände, darum ist das Dach dort, wo das Haus breiter ist, etwas flacher; an einem Versatz schließt ein kleines senkrechtes Dreieck die Lücke zwischen den zwei Dachflächen. Im 2D-Plan (auch in 2D + 3D): auf der Dach-Etage das Dach anklicken, mit Doppelklick auf seinen Rand dort teilen, dann den Rauten-Griff eines Stücks nach außen oder innen ziehen (5-cm-Schritte, Alt: frei); ein Doppelklick auf eine Raute entfernt den Versatz wieder. Das Dach-Feld (*Etage verwalten*) hat eine Karte je Versatz (Seite, ab wo, wie weit außen) und *+ Versatz*. Die Wände unter dem Dach werden in der richtigen Neigung geschnitten, Solarpanels liegen darauf, und eine Gaube steht auf der Dachfläche unter ihrer Mitte. Ein Walmdach behält sein Rechteck. Der JSON-Import kennt `steps` (`side`, `at`, `out`). Neues Modul `roofsteps.js` (Unit-Tests); Gauben, Dachfläche, Wandschnitt (der Shader nimmt jetzt bis zu 8 Neigungsebenen, jede auf ihrem eigenen Stück), Solarpanels und der 2D-Plan nutzen es; neuer Browser-Test-Teil `12_roofsteps`.

### Verbessert
- Die Unit-Tests der Gauben laufen mit den anderen Modul-Tests (sie importieren jetzt `roofsteps.js`).

## [3.72.0] - 2026-10-11
### Neu
- **Die Fenster der Räume scheinen durch eine Schleppgaube** (#341): Eine lange Schleppgaube (3.71.0) läuft über mehrere Räume, aber eine Gaube hat nur ein eigenes Fenster. Jetzt kann jeder Raum darunter sein eigenes Fenster haben: wie gewohnt eine Tür oder ein Fenster in die Wand des Raums unter der Gaube setzen (Werkzeug *Tür/Fenster*). Wo die Vorderseite der Gaube auf so einer Wand steht (parallel, höchstens 25 cm davor oder dahinter), bekommt ihre Vorderwand ein Loch für jede Tür und jedes Fenster dieser Wand, so scheinen die echten Fenster mit Rahmen, Glas und Rollladen durch die Gaube. Es sind gewöhnliche Fenster: Kontakt, offen / zu, Raum, Rollladen, die Liste „n offen“. Das eigene Fenster der Gaube lässt sich wie bisher ausschalten (Haken *Fenster*). Geht bei jeder Gaubenart. Die Löcher kommen aus `frontHoles` in `dormerwin.js`, die Vorderwand wird in `dormerParts` (`dormer.js`) um sie herum ausgeschnitten (beide mit Unit-Tests); der Browser-Test setzt ein Fenster unter eine Schleppgaube.

## [3.71.0] - 2026-10-11
### Neu
- **Lange Schleppgaube** (#339): Eine Gaube kann jetzt eine *Schleppgaube* sein: Ihre Vorderwand geht senkrecht hoch, und ihr Dach läuft mit eigener, flacherer Neigung unterhalb des Firsts ins Hauptdach. So wird ein Teil einer Dachseite angehoben und bleibt doch dasselbe Dach: Die Räume darunter werden nicht mehr von der Schräge angeschnitten, sondern haben gerade Wände. *Schleppgaube* als Dach der Gaube im Dach-Feld wählen (Etage *Dach*, Abschnitt *Gauben*): Sie wird auf die Außenwand gesetzt (ihr Abstand zur Traufe wird der Überstand) und bekommt ein Feld für ihre Neigung (15°, wenn nichts eingestellt ist). Eine Schlepp- oder Flachdachgaube darf so lang sein wie das Dach (eine Giebelgaube bleibt höchstens 5 m breit). Wenn die gewählte Wandhöhe und Neigung über den First reichen würden, wird zuerst das Gaubendach flacher und erst dann die Wand niedriger, wenn selbst das nicht reicht; das Neigungsfeld zeigt, was genommen wird. Das Fenster einer Schleppgaube ist höchstens 1,2 m breit, mitten in ihrer Vorderseite.
- **Wo eine Gaube anfängt** (#339): Ein neues Feld *Abstand zum Giebel* sagt in Metern, wo eine Gaube anfängt (vom Giebel links oder oben im Plan), neben dem Regler. Ändert man die Breite, bleibt dieser Anfang.

### Verbessert
- **Das Dach hat ein Loch unter jeder Gaube** (#339): Die Schräge des Hauptdachs läuft nicht mehr durch den Raum unter einer Gaube (zu sehen durch die Wände, in der Raumansicht und wenn die Kamera nahe kommt); die Wände und das Dach der Gaube schließen das Loch. Unter einer Schleppgaube reichen die Wände des Stockwerks darunter bis an ihr schräges Dach. Der JSON-Import kennt `"type": "shed"` mit `sp` (ihre Neigung in Grad) und Gauben bis 30 m Länge. Die Geometrie steht in `dormer.js` (`roofSurface`, `dormerStart`, `posForStart`) und `attic.js` (Unit-Tests); der Browser-Test wählt eine Schleppgaube im Feld.

## [3.70.1] - 2026-10-10
### Repariert
- **Live-Karte: Knöpfe und Regler verschwinden nicht mehr unter dem Finger** (#336): Solange die Karte einer Lampe im Live-Modus offen war, zeichnete jede Zustandsänderung irgendeiner Entität im Haus (Stromzähler, Temperaturen … alle paar Sekunden) die ganze Karte neu. Ein Tipp auf An / Aus, eine Farbe oder eine Szene konnte verloren gehen (der Knopf wurde zwischen Finger auf und Finger hoch ersetzt), ein Ziehen an der Helligkeit wurde abgebrochen, und eine offene Farbauswahl oder Effektliste ging zu. Die LED-Ring-Karte und die Kamera-Karte taten dasselbe. Wie die Rollladen-Karte (3.70.0) wird die Karte jetzt nur noch neu gezeichnet, wenn sich etwas ändert, das sie zeigt: das Gerät, der Zustand seiner Entität, Helligkeit, Farbe und Effekte, die Szenen, die Lichter des Raums, die Abschnitte des LED-Rings, die Bewegung der Kamera, die Sprache. Solange ein Regler gehalten wird oder ein Regler, eine Farbauswahl oder eine Effektliste den Fokus hat, wird gar nicht gezeichnet; was sich in der Zeit geändert hat, zeigt sich, wenn der Regler losgelassen wird oder der Fokus die Karte verlässt. Der Schlüssel ist `popupKey` in `livepopup.js` (Unit-Tests); der Browser-Test öffnet die Karte einer Lampe, ändert eine Temperatur und prüft, dass die Knöpfe dieselben Elemente sind.

## [3.70.0] - 2026-10-10
### Verbessert
- **Rollladen-Karte wie in Home Assistant** (#335): Ein Tipp auf die 🪟-Kugel eines Rollladens im Live-Modus öffnet eine Karte nur für den Rollladen, mit allem auf einmal: wie weit er offen ist in großer Schrift, ein hoher Regler, der den Behang zeigt (ziehen oder dorthin tippen, wohin er soll: Der Rollladen fährt dorthin, wenn man loslässt), daneben *Hoch* / *Stopp* / *Runter* und darunter die schnellen Stellungen 0 / 25 / 50 / 75 / 100 %. Eine gerade gewählte Stellung zeigt sich sofort und bleibt, solange der Rollladen dorthin unterwegs ist. Die Karte wird nur neu gezeichnet, wenn sich der Rollladen ändert (nicht bei jeder Zustandsänderung im Haus, die einen Tipp verschlucken konnte), und am Handy bleibt sie über den Ansichts-Knöpfen unten (*Normal*, *Temp.* …), die ihren unteren Teil verdeckten. Neues Modul `shuttercard.js`; die Regeln (Stellung unter dem Finger, was sich zeigt, während der Rollladen fährt) stehen in `shutters.js` (Unit-Tests); der Browser-Test zieht den Regler und tippt eine schnelle Stellung an.

### Repariert
- **Die Rollladen-Karte zeigte den Kontakt des Fensters** (#335): Ein Tipp auf die Kugel eines Rollladens zeigte oben auf der Karte auch den Kontaktsensor des Fensters („Fenster · Offen · binary_sensor…“). Jetzt zeigt sie nur den Rollladen; der Kontakt bleibt im Raum-Feld und in der Liste „n offen“.
- **Die Kugel des Rollladens hing unter dem Fenster** (#335): Wo zwischen Fenster und Decke wenig Platz war, saß die Kugel unter dem Fenster an der Fensterbank. Jetzt sitzt sie immer oben auf dem Fenster, wo sich der Rollladen aufrollt, mit dem Schild („↕ 40 % offen“) darüber.

## [3.69.1] - 2026-10-10
### Repariert
- **Einstellungen: zwei schnelle Änderungen hintereinander** (#333): Zwei Einstellungen schnell nacheinander zu ändern (z. B. die Sprache und gleich danach das Design) konnte mit der Meldung enden, die Einstellungen seien an einem anderen Bildschirm geändert worden, einem Neuladen der Seite und einer verlorenen zweiten Änderung. Die zweite Änderung wurde gespeichert, bevor das erste Speichern zurückkam, noch mit ihrer alten Versionsnummer (ETag), und das Add-on lehnte sie ab. Jetzt wird nacheinander gespeichert: Eine Änderung, die gemacht wird, während ein Speichern unterwegs ist, wird gleich danach gespeichert, und die Antwort des älteren Speicherns überschreibt die neuere Änderung nicht mehr. `oneAtATime` in `settings.js` (Unit-Tests).

### Verbessert
- **Browser-Test in Teilen, alle gleichzeitig**: Der Browser-Test (über 450 Prüfungen, etwa 13 Minuten hintereinander) ist in Teile aufgeteilt (`tests/e2e/parts/`). Jeder Teil baut zuerst dasselbe Testhaus und läuft dann für sich, darum lässt die CI alle Teile gleichzeitig als eigene Jobs laufen (ein paar Minuten); der Job `e2e` sammelt ihre Ergebnisse. `tests/e2e/run.sh power roofs` lässt nur die Teile laufen, die eine Änderung abdecken (`--list` zeigt sie). Eine Änderung, die nicht ändern kann, was der Browser zeigt (nur Text, Unit-Tests oder Werkzeuge), überspringt den Browser-Test. Die Bilder, die der Test macht, werden nicht mehr in git aufbewahrt.

## [3.69.0] - 2026-10-10
### Neu
- **Rollläden an jedem Fenster, auch in Gauben** (#331): Jedes Fenster hat in seinen Eigenschaften einen neuen Haken „Rollladen“. Angehakt bekommt es ein Feld für die eigene Home-Assistant-Entität des Rollladens (ein Cover), getrennt vom Kontaktsensor des Fensters. In 3D kommt außen vor dem Glas ein Behang aus Lamellen so weit herunter, wie das Cover geschlossen ist (seine Stellung, sonst offen / zu), und fährt mit gleichmäßiger Geschwindigkeit mit ihm hoch und runter, wie ein Motor (ganz in etwa 3 s); er hängt auf der Seite der Wand ohne Raum, und die Flügel so eines Fensters kippen nach innen. Ein Schild über dem Fenster sagt, wie weit er offen ist („↕ 60 % offen“, wie die Werte-Schilder der Geräte; mit ihnen in den Einstellungen ausschaltbar). Im Live-Modus öffnet eine 🪟-Kugel am Fenster eine Karte mit hoch, Stopp, runter und einem Regler für die Stellung; das Raum-Feld listet den Rollladen unter „Abdeckungen“; der 2D-Plan markiert ihn außen am Fenster (im Live-Modus mit „↕ 60 % offen“). Ein offener Rollladen ist kein offenes Fenster: Für „n offen“ und die Warnungen zählt nur der Kontakt. Die Fenster von Gauben haben denselben Haken (an der Gaube gespeichert, außen ist weg vom First). Abdeckungen im Raum-Feld lesen sich jetzt „60 % offen“ statt des rohen Zustands von Home Assistant; Rollläden, die offline sind, stehen in der Offline-Liste, die Suche findet ein Fenster über den Namen seines Rollladens. Der JSON-Import und -Export kennen `shutter` und `shutterEntity`. Logik im neuen `shutters.js` (Unit-Tests); der Browser-Test bedient ihn.

## [3.68.0] - 2026-10-10
### Neu
- **In Home Assistant umbenannt, im Plan umbenannt**: Wenn sich die ID einer Entität in Home Assistant ändert (dort umbenannt, von Zigbee2MQTT mit „update Home Assistant entity ID“ oder von einem anderen Add-on wie dem Zigbee Devices Manager), bekommt jedes gesetzte Gerät, jeder LED-Ring-Abschnitt, jedes TV-Hintergrundlicht, jeder Tür-/Fensterkontakt und jedes Kabel, das damit verbunden ist, die neue ID, in jedem Haus, ebenso die Einstellungen (Wetter-Entität) und `users.json`. Ein Gerät, dessen Name noch der Name aus Home Assistant ist, bekommt den neuen Namen; ein von Hand eingetippter Name bleibt. Das Add-on hält eine eigene Verbindung zu Home Assistant (auch ohne offenen Browser), erkennt eine Entität an ihrem Registereintrag (Integration + eindeutige ID, so zählt auch Löschen und neu Anlegen) und holt Umbenennungen nach, die gemacht wurden, während es gestoppt war (`renames.json` in den Daten des Add-ons). Eine offene Ansicht frischt ihren Plan und ihre Rückgängig-Liste sofort auf, und ein Plan, den ein Browser speichert, der die Umbenennung verpasst hat, bekommt auch die neuen IDs. Logik im neuen `renames.py` und `renames.js` (Unit-Tests); der nachgebaute Home Assistant des Browser-Tests kennt das Entitätenregister und Umbenennungen.

## [3.67.1] - 2026-10-10
### Repariert
- **Leere Seite nach einem Update** (#328): Nach dem Update auf 3.67.0 konnte die Seite leer bleiben (Knöpfe ohne Text, kein Haus). Der Browser hatte ein altes `modelfx.js` neben dem neuen `app.js` behalten, darum konnte `app.js` gar nicht starten. Das Add-on schickt jetzt `Cache-Control: no-cache` für die Dateien der Oberfläche, so prüft der Browser sie immer beim Add-on nach (eine schnelle Antwort „unverändert“, wenn sich nichts geändert hat). Als Sicherheitsnetz merkt das neue `bootguard.js`, wenn `app.js` nicht starten kann, holt jede Datei einmal am Cache vorbei und lädt neu. Hilft das nicht, zeigt es eine Meldung mit dem, was zu tun ist, statt einer leeren Seite.

## [3.67.0] - 2026-10-10
### Neu
- **LED-Ring: jeder Abschnitt beim Bearbeiten in seiner eigenen Farbe** (#325): Im Bearbeiten-Modus wird jeder Abschnitt eines LED-Rings in einer eigenen sanften Farbe gezeichnet, im 2D-Plan (Linie und Nummer), in 3D und als farbiger Rand seines Kastens in den Eigenschaften, so sieht man, wo jeder Abschnitt verläuft, bevor man ihm ein Licht gibt. Eingeschaltete Abschnitte behalten ihre echte Lichtfarbe; der Live-Modus sieht aus wie bisher. Farben in `ledring.js` (`sectionHex`, Unit-Test); das 3D-Aussehen des Rings ist von `app.js` nach `modelfx.js` umgezogen (`ringLook`).

## [3.66.1] - 2026-10-10
### Repariert
- **Zustände zeigen sich wieder sofort** (#323): Eine Änderung in Home Assistant brauchte manchmal etwa 30 Sekunden, bis sie erschien. Ein Browser, der keine Nachrichten annahm (ein schlafendes Tablet, ein Handy ohne Netz), hielt den Live-Kanal für jede andere Ansicht auf, bis der Herzschlag es bemerkte. Jeder Browser hat jetzt in `LiveHub` seine eigene Warteschlange und seinen eigenen Sender; einer, der 5 s feststeckt, fällt heraus und verbindet sich mit der vollen Liste neu. Ein Tablet oder Handy, das aufwacht, holt auch sofort die Zustände.

## [3.66.0] - 2026-10-09
### Neu
- **Die Startansicht lässt sich wählen** (#315): In den Einstellungen (Abschnitt Wandtablet) speichert „📌 Aktuelle Ansicht nehmen“ die gerade gezeigte Ansicht (Haus, Etage oder ganzes Haus, Raum, Kamera) als Startansicht für alle; „Automatisch“ geht zum alten Start zurück (der Raum des Benutzers oder das Erdgeschoss). Im Benutzer-Fenster kann jeder Benutzer seine eigene bekommen („Start: aktuelle Ansicht nehmen“). Die Seite öffnet sich damit, und ein Wandtablet kehrt nach der Ruhezeit dahin zurück. Gespeichert in `startViews` (auch in users.json), `api/me` gibt die eigene des Benutzers oder die für alle heraus. Logik im neuen `startview.js` (Unit-Tests).
- **Sicherheit: die aufgezeichneten Tage als Liste** (#317): Das Backup-Fenster listet die aufgezeichneten Tage auf, jeden zum Abspielen (▶) oder Herunterladen (⬇).
### Verbessert
- **Backup in der oberen Leiste** (#321): Das ganze Backup, die automatischen Backups und die Aufzeichnung für die Sicherheit sind vom Seitenfeld in ein Fenster hinter dem neuen Knopf „🗄️ Backup“ umgezogen; der Abschnitt im Seitenfeld heißt jetzt nur „Häuser“. Die zwei Felder der Sicherheit werden jetzt auch beim Ändern gespeichert.
- **Sicherheits-Leiste über die ganze Breite** (#316): Die Leiste mit der Zeitachse nutzt jetzt die ganze Breite des Bildschirms.
### Repariert
- **Kein dunkler Boden in 3D beim Setzen** (#320): Mit einem Zeichen-Werkzeug (Gerät, Treppe …) verschmolz das 3D-Raster zu einer dunklen Fläche, die den Rasen verdeckte (600 feine Linien über 60 m). In 3D haben seine Linien jetzt mindestens 50 cm Abstand und sind durchsichtig; das Einrasten nutzt weiter die Raster-Einstellung.
- **Tipp-Kugeln verdecken einander nicht mehr** (#314): Kugeln, die auf dem Bildschirm aufeinander landen (eine Stehlampe vor einer Deckenlampe, Dinge schräg gesehen hintereinander), rücken jetzt auf dem Bildschirm auseinander, jedes Mal, wenn sich die Kamera bewegt (`spreadScreen` in `tapballs.js`, Unit-Tests).

## [3.65.0] - 2026-10-08
### Neu
- **Sicherheit: Zoom und Symbole auf der Zeitachse**: Eine neue 🔍-Wahl in der Leiste stellt ein, wie viel vom Tag die Zeitachse zeigt (24 h, 12 h, 6 h, 3 h, 1 h, 30 min, 10 min; am Computer auch mit dem Mausrad über der Linie). Die Linie folgt dem Abspielen, und die Uhrzeiten darunter passen zum gezeigten Teil. Jede Änderung ist jetzt ein Symbol auf der Linie (💡 Licht, 🚪 Tür, 🪟 Fenster, 🏃 Bewegung, 🔥 Rauch, 🔒 Schloss, 👤 Person, 🌡️ Klima …), hell für „an“; zu nah beieinander liegende Ereignisse teilen sich ein Symbol mit Zahl, so trennt Hineinzoomen sie. Ein Tipp auf ein Symbol springt dorthin; sein Tooltip listet, was passiert ist. Der gewählte Zoom bleibt im Browser gemerkt. Logik in `timeline.js` (`follow`, `markers`, `eventIcon`, Unit-Tests).

## [3.64.2] - 2026-10-08
### Repariert
- **Raumansicht: kein Dach, das über dem Raum schwebt** (#306): Das durchsichtige Dach über einem gewählten Raum (3.55.0) wird jetzt nur gezeichnet, wenn das Dach wirklich zum Raum gehört: Seine Schräge schneidet den Boden des Raums (Kniestock) oder eine Gaube sitzt über dem Raum. Ein Dach, das einfach oben auf dem Stockwerk darunter sitzt, liegt über der Decke und schwebt nicht mehr über jedem Raum. `roofOverRoom` in `attic.js` (Unit-Test).

## [3.64.1] - 2026-10-08
### Repariert
- **Ganzes Haus: Die Etagen-Karten verstecken sich, solange ein Raum geöffnet ist** (#304): Ein Tipp auf einen Raum in der Ansicht des ganzen Hauses zoomt hinein; die Etagen-Karten (Räume, Lichter an, Fenster offen) schweben nicht mehr im leeren Raum daneben. Zurück zum ganzen Haus zeigen sie sich wieder. `cardsShown` in `floorcards.js` (Unit-Test).

## [3.64.0] - 2026-10-08
### Neu
- **Sicherheit**: Das Add-on zeichnet jetzt auf, was im Haus schaltet (Lichter, Schalter, Türen und Fenster, Abdeckungen, Personen, Schlösser, Klima …; Sensoren höchstens alle 5 Minuten), für jede in einem Grundriss gesetzte Entität, eine Datei je Tag in `addon_configs/…_floorplan3d/timeline/YYYY-MM-DD.jsonl`. Der neue Knopf 🛡️ *Sicherheit* (Werkzeugleiste; am Handy im ☰-Menü) listet die aufgezeichneten Tage (jede Datei lässt sich auch herunterladen) und spielt einen Tag in derselben 3D-Ansicht ab: unten eine Leiste mit Wiedergabe / Pause, vorheriges / nächstes Ereignis, Geschwindigkeit (×1 … ×3600), ein Regler über den Tag mit den Ereignissen als kleinen Strichen und die Liste, was wann geschaltet hat. Das Haus zeigt die aufgezeichneten Zustände (Lichter, Farben, offene Fenster, Warnungen …); solange es offen ist, lässt sich nichts schalten, und Live-Änderungen warten, bis es geschlossen ist. Geht an Handy, Tablet und Computer. Die Aufzeichnung hat ihre eigene Verbindung zu Home Assistant und hört nur zu, so sind die Live-Ansicht und Home Assistant nicht betroffen; geschrieben wird alle paar Sekunden gesammelt, eine Tagesdatei ist auf 30 MB begrenzt. *Häuser & Backup → Sicherheit*: Aufzeichnung ausschalten, Tage zum Aufbewahren (normal 7 plus heute). Das Benutzer-Fenster kann sie für einen Benutzer sperren (auch der Server lehnt dann ab). Aufzeichnung in `timeline.py`, Logik des Abspielens in `timeline.js` (Unit-Tests), Bildschirm in `timelineui.js`.

## [3.63.0] - 2026-10-08
### Verbessert
- **Handys zeigen nur das Haus** (#299): Am Handy (Touchscreen, schmal oder quer gehalten) läuft die App immer im Live-Modus und in 3D. Das ☰-Menü bietet nicht mehr Bearbeiten / Live, 2D und 2D + 3D oder die Benutzer an; Haus wechseln, „Fit“, die Version und ⚙ bleiben. Tablets und Computer bleiben unverändert. Logik in `phonemenu.js` (`isPhoneScreen`, `phoneView`) mit Unit-Tests.

## [3.62.0] - 2026-10-08
### Neu
- **Mehrere ausgewählte Dinge bewegen sich zusammen**: Nachdem man mehrere Dinge mit Umschalt / Strg + Klick oder einem Rahmen ausgewählt hat, bewegt das Ziehen von einem davon im 2D-Plan (auch in der Ansicht 2D + 3D) jetzt alle um dasselbe Stück, in einem Rückgängig-Schritt; sie bleiben ausgewählt. Mit einer bewegten Wand verbundene Wände strecken sich mit, wie wenn eine Wand gezogen wird; Türen und Fenster gehen mit ihrer Wand; gesperrte Dinge bleiben. Ein einfacher Klick auf eines davon wählt weiter nur dieses aus. Logik in `multisel.js` (`groupTargets`, `moveGroup`) mit Unit-Tests.

## [3.61.0] - 2026-10-08
### Neu
- **Benutzer: Dinge für einen Benutzer / ein Tablet sperren**: Im Benutzer-Fenster hat das ⚙-Kästchen jedes Benutzers jetzt auch „🔒 Gesperrt“ mit Haken: Geräte schalten, Details von Home Assistant (ⓘ), Kameras, Strom- und Zähler-Übersicht, Farbansichten (Temperatur, Feuchte, CO₂, Strom), das Menü „Ansicht“, 2D / 3D umschalten, Haus wechseln, Suche und die Einstellungen (⚙). Angehakte Dinge sind für diesen Benutzer versteckt; Schalten und Kamerabilder lehnt auch der Server ab. Die Sperren werden mit den Benutzern gespeichert (auch in users.json). Neues Modul `userlocks.js` mit Unit-Tests.

## [3.60.1] - 2026-10-08
### Repariert
- **Handys: Etagen-Karten bleiben beim Hineinzoomen neben dem Haus (#294)**: Nahes Hineinzoomen in der Ansicht des ganzen Hauses schob die Etagen-Karten in die Mitte des Bildes, auf das Haus. Jetzt bleiben sie auf der Seite mit mehr Platz neben dem Haus, auch wenn sie dadurch teilweise oder ganz aus dem Bildschirm rutschen; Herauszoomen holt sie zurück.

## [3.60.0] - 2026-10-08
### Neu
- **Leistungsanzeige (FPS und mehr)**: Die Ausklappliste *Ansicht* hat *⏱ Leistung: aus / FPS / alle Werte*. *FPS* zeigt die Bilder pro Sekunde oben rechts im 3D-Bild (💤, wenn das Bild absichtlich ruht, um Strom zu sparen); *alle Werte* fügt die Zeit pro Bild (Mittel und längste), die Arbeit pro Bild, Zeichenaufrufe, Dreiecke, Geometrien, Texturen, Shader, die Auflösung des Bildes, den Bildschirm, den Stromsparmodus, den Grafikchip und den Speicher (Chrome) hinzu. Je Gerät gemerkt, geht an Handy, Tablet und PC, das Kästchen lässt jede Berührung durch; an einem Wandtablet ohne das Menü tut `?fps=1` oder `?fps=all` in der Adresse dasselbe. Neues Modul `perfhud.js` mit Unit-Tests.

## [3.59.2] - 2026-10-08
### Repariert
- **Handys: Etagen-Karten neben dem Haus, nicht davor (#292)**: In der Ansicht des ganzen Hauses wird das Haus an hochkant gehaltenen Handys etwas nach links und etwas kleiner gezeichnet, so hält eine freie Spalte rechts die Etagen-Karten, und sie verdecken das Haus nicht mehr. Verlässt man die Ansicht des ganzen Hauses (eine Etage, ein Raum), zeigt sich das Bild wie bisher; Tablets und PCs bleiben unverändert.

## [3.59.1] - 2026-10-08
### Repariert
- **Handys: Die Etagen-Karten in der Ansicht des ganzen Hauses waren viel zu groß (#290)**: An hochkant gehaltenen Handys brauchte jede Karte vier Zeilen, und zusammen verdeckten sie das halbe Haus. Jetzt ist eine Karte der Name der Etage mit einer kurzen Zeile Symbolen darunter (▦ Räume, 💡 Lichter an, 🪟 Fenster offen; Lichter und Fenster nur, wenn es welche gibt), in kleinerer Schrift. Tablets und PCs behalten die vollen Karten.

## [3.59.0] - 2026-10-08
### Verbessert
- **Hochkant gehaltene Handys: mehr Platz für das Haus und das Raum-Blatt (#288)**: Die Werte oben (Strom-Übersicht, Wasser / Gas, offline, offen, Kameras / Bewegung) sind in einen Knopf „📊“ neben dem Etagen- und dem Raum-Knopf zusammengeklappt; ein Tipp öffnet sie als Liste, ein Tipp auf einen davon tut, was er immer getan hat. Braucht etwas Aufmerksamkeit (offene Türen / Fenster, Bewegung, Geräte offline), ist der Knopf rot und zeigt „⚠️ n“. Der Such-Knopf 🔍 ist von unten links nach oben rechts umgezogen, so nutzt das Raum-Blatt unten jetzt die ganze Breite. Quer gehaltene Handys, Tablets, PCs und Raum-Tablets bleiben unverändert. Neues Modul `phonestatus.js` mit Unit-Tests.

## [3.58.0] - 2026-10-08
### Neu
- **Eine Wand genau teilen (#286)**: Die Eigenschaften einer Wand haben *Wand teilen*: eine Ecke in genauem Abstand vom Anfang (z. B. 0,30 m, in der gewählten Längeneinheit) oder die Wand in 2 bis 10 gleiche Teile. Türen und Fenster bleiben bei ihrem Stück, Räume entlang der Wand bekommen die Ecke auch, Strg+Z nimmt es zurück. Neues Modul `wallsplit.js` mit Unit-Tests; Texte in 7 Sprachen.

### Repariert
- **Doppelklick auf eine Wand (#286)**: Ist die Wand ausgewählt (das macht der erste Klick des Doppelklicks), teilt der Doppelklick immer diese Wand, auch wenn ein Gerät, ein Gartenobjekt (Rasen, Zaun …) oder ein Raum darunter liegt. Eine Ecke darf jetzt 5 cm vom Ende der Wand liegen (vorher 10 cm).

## [3.57.2] - 2026-10-08
### Verbessert
- **Hochkant gehaltene Handys: alles auf einem Bildschirm (#284)**: Die Werte oben (Strom-Übersicht, Wasser / Gas, offline, offen, Kameras) brechen in mehr Zeilen um und sind etwas kleiner, und die Ansichts-Knöpfe unten (Normal, Temp., Feuchte, CO₂, Strom) brechen auch um, so muss nichts mehr seitwärts gescrollt werden. Quer gehaltene Handys, Tablets und PCs behalten die eine Zeile.

## [3.57.1] - 2026-10-08
### Verbessert
- **Handys, obere Zeile (#281)**: So, wie der Besitzer es wollte, drei Knöpfe nebeneinander: ☰ (Werkzeugleiste), die Etage („Obergeschoss ▾“, öffnet die Liste der Etagen und das ganze Haus) und die Räume („Zimmer ▾“, die Raumliste der gezeigten Etage). In 3.57.0 waren Etagen und Räume eine gemeinsame Liste. Eine Etage oder ein Raum schließt seine Liste. PC und Tablets bleiben unverändert.

## [3.57.0] - 2026-10-08
### Neu
- **Handys: Etagen und Räume in einer Ausklappliste (#281)**: Statt der Reihe von Etagen-Pillen, die seitwärts gescrollt werden musste, zeigen Handys oben einen Knopf mit der Etage (und dem gewählten Raum), z. B. „Obergeschoss · Kinderzimmer ▾“. Er öffnet eine Liste mit den Etagen und dem ganzen Haus, darunter die Räume der gezeigten Etage (in der Ansicht des ganzen Hauses die Räume jeder Etage). Eine Etage lässt die Liste offen, damit als Nächstes ein Raum gewählt werden kann; ein Raum schließt sie und öffnet den Raum. PC, Tablets und Raum-Tablets bleiben unverändert. Neues Modul `phonenav.js` mit Unit-Tests; Texte in 7 Sprachen.

### Repariert
- **Browser-Tests (CI)**: Die Tests handelten manchmal, bevor die Seite ihr Haus geladen hatte (feste Wartezeiten, die auf einem langsamen GitHub-Runner zu kurz waren), darum blieb die Prüfung ab und zu rot, obwohl nichts kaputt war (#280). Die Seite meldet jetzt, wann sie bereit ist (`ready()` im Test-Haken, nur mit `?debug=1`), und jede Testseite wartet nach dem Laden darauf.

## [3.56.1] - 2026-10-07
### Repariert
- **Handys, ☰-Menü (#277)**: In der Live-Ansicht ist die Werkzeugleiste (Bearbeiten/Live, 2D/3D, Haus, Version, Benutzer, Einstellungen) in einen ☰-Knopf oben links zusammengeklappt und öffnet sich als Ausklappliste, statt einer Zeile, die seitwärts gescrollt werden musste; das macht auch die obere Zeile für das Haus frei (`phonemenu.js`). Textfelder am Handy nutzen 16-px-Schrift, so zoomt das iPhone nicht mehr die ganze Seite heran, wenn man auf die Suche tippt. PC und Tablets bleiben unverändert.

### Verbessert
- **Dokumentation**: Die Roadmap listet nur noch, was wirklich offen ist (15 längst erledigte Punkte sind mit ihrer Version abgehakt); die Testliste für den Besitzer deckt 3.54.0 bis 3.56.1 ab (Abschnitt 36); der Modulplan zeigt die aktuelle Größe von `app.js`.

## [3.56.0] - 2026-10-07
### Neu
- **Gaubenfenster in der Wand des Raums (#275)**: Wenn eine Wand des Raums unter einer Gaube direkt hinter der Vorderseite der Gaube verläuft (von 25 cm davor bis dorthin, wo die Gaube auf das Dach trifft), wird das Gaubenfenster jetzt in diese Wand geschnitten: Es zeigt sich im Raum (auch in der Raumansicht), hat ein echtes Loch in der Wand und gehört zum Raum. Die Vorderseite der Gaube behält von außen ihre Glasscheibe. Liegt die Wand weiter weg, schiebt der neue Knopf **„Vorderseite auf die Wand setzen“** in der Gauben-Karte die Gaube so, dass ihre Vorderseite auf der Wand des Raums darunter liegt; die Karte sagt auch, wo das Fenster sitzt. `hostWall`, `eaveOntoWall`, `dormerWindows` in `dormerwin.js` mit Tests; Texte in 7 Sprachen.
- **Durchsichtiges Dach über einer Etage**: Wie in der Raumansicht zeigt eine Etage unter dem Dach (das Stockwerk direkt unter der Dach-Etage oder unter den Schrägen auf einem Kniestock) jetzt das Dach darüber durchsichtig, mit seinen Gauben, wenn diese Etage offen ist.

## [3.55.0] - 2026-10-07
### Neu
- **Durchsichtiges Dach über einem gewählten Raum**: Ist ein Raum gewählt (Raumansicht), wird das Dach darüber durchsichtig gezeichnet, mit der Dachschräge und den Gauben, aber nur der Teil über diesem Raum (auf den Umriss des Raums zugeschnitten), nicht das ganze Dach. So zeigt ein Gaubenfenster im Raum, wo es wirklich sitzt. Geht für die Stockwerke unter den Schrägen (Kniestock) und für das Stockwerk direkt unter der Dach-Etage. `coverRoofFloor` in `attic.js` (mit Tests), der Zuschnitt auf den Umriss des Raums in `atticclip.js`, das Zeichnen in `roofs.js`.

### Repariert
- **Handys, angetippter Raum**: Die Heizung ist jetzt Teil des Raum-Blatts statt eines zweiten Feldes oben, so bleibt der Raum dazwischen im Blick; das Blatt hält Abstand vom Home-Balken des iPhones; ein dunkler Kasten, den Chrome über dem scrollenden Blatt auf das 3D-Bild malte (er verdeckte den angetippten Raum), ist weg (`clip-path` am Blatt); die Kamera kommt etwas näher an den Raum. Der Hinweis „Änderungen werden nicht gespeichert“ der Demo blendet nach ein paar Sekunden aus, er verdeckte die Knöpfe unten. PC und Tablets bleiben unverändert.

## [3.54.0] - 2026-10-07
### Neu
- **Gaubenfenster sind echte Fenster**: Das Fenster in einer Dachgaube war nur eine blaue Scheibe. Jetzt ist es ein Fenster wie die in den Wänden: antippen, um ihm einen Kontaktsensor (auch einen je Flügel) und einen Namen zu geben, seine Art wählen; es wird rot und kippt auf, wenn der Sensor offen meldet, und es zeigt sich in der Liste „n offen“, im Raum-Feld des Raums unter der Gaube, in der Suche und in der Objektliste. So lässt sich das alte Fenster des Raums löschen und stattdessen das Gaubenfenster benutzen. Seine Größe und sein Platz kommen weiter von der Gaube (Dach-Feld); es zu löschen, schaltet das Fenster der Gaube aus. Mit dem Dach auf einem Kniestock gehört es zum Stockwerk unter den Schrägen (z. B. dem Atelier), sonst zur Dach-Etage. Neues Modul `dormerwin.js` mit Tests; Texte in 7 Sprachen.

### Repariert
- **Handys**: Quer gehalten sitzen die Etagen-Knöpfe jetzt oben als kleine Pillen (die Etagenbilder an der Seite passten nicht und verdeckten den Kompass). Ein angetippter Raum versteckt sich nicht mehr hinter dem Raum-Blatt unten: Das Bild rückt in den freien Teil hoch, und die Kamera steht auf schmalen Bildschirmen weiter zurück (`sheetview.js`, mit Unit-Tests). In der Live-Ansicht am Handy ist die Werkzeugleiste eine Zeile, die seitwärts scrollt (sie brauchte vier Zeilen), die Ansichts-Knöpfe (Normal, Temp. …) sind eine Zeile neben dem Kompass mit *Ansicht* zuerst, und quer gehalten rutschen die Knöpfe unten nicht mehr aus dem Bildschirm. PC und Tablets bleiben unverändert.

### Neu
- **Keine übersprungenen Releases mehr**: Wurden mehrere Pull Requests hintereinander gemergt, brach GitHub wartende Release-Läufe ab, und manche Versionen bekamen kein Release. Jeder Release-Lauf legt jetzt alle fehlenden Releases an (die Versionen im Changelog, die neuer sind als das neueste Release, jede an ihrem eigenen Commit, die älteste zuerst; nur die neueste wird „latest“), in einer eigenen Warteschlange. Ein Lauf von Hand kann auch ältere Lücken füllen („backfill“). Die Wahl der Versionen steht in `tools/release_versions.py` mit Tests. Eine Version, die nur einen Changelog-Eintrag hat, aber nie in `config.yaml` gesetzt wurde (in einer späteren Version mitgeliefert), bekommt kein Release, statt eines, das auf den neuesten Code zeigt.
- **Die Demo direkt auf GitHub Pages (#133)**: Der Demo-Workflow veröffentlicht die frisch gebaute Demo jetzt auch als Webseite, so lässt sie sich ohne Download im Browser ausprobieren. Dafür muss Pages einmal eingeschaltet werden (Settings → Pages → Source: GitHub Actions).

## [3.53.0] - 2026-10-07
### Neu
- **Bewohntes Dachgeschoss: Gauben, mehrere Stockwerke, Firsthöhe (#265)**:
  - Wo eine Gaube aus dem Dach steht, werden die Wände darunter nicht mehr an der Schräge geschnitten; sie reichen unter die Gaube (bis zum First einer Giebelgaube), so zeigt sich die Gaube im Schnitt.
  - Neue Wahl „Dach beginnt auf Etage“: Das Dach kann auf einem tieferen Stockwerk beginnen, z. B. zwei Stockwerke unter den Schrägen (Obergeschoss und Dachgeschoss); alle werden am Dach geschnitten.
  - Neues Feld „Firsthöhe“: die Höhe des Firsts über den Wänden (oder dem Kniestock) eintippen, und die Neigung wird ausgerechnet.
  - Die Wände werden jetzt von ein paar Zeilen Shader geschnitten (`atticclip.js`) statt von Schnittebenen von three.js, die keine Gaube aussparen können. `attic.js` hat `roofBaseIdx`, `roofY0`, `dormerRooms`, `keptAt`, `ridgeHeight`, `pitchFor` mit Tests; Texte in 7 Sprachen.

## [3.52.0] - 2026-10-07
### Neu
- **Bewohntes Dachgeschoss (#260)**: In „Etage verwalten“ auf der Dach-Etage lässt das neue Kästchen „Bewohntes Dachgeschoss (das Dach beginnt im Stockwerk darunter)“ das Dach im Stockwerk unter der Dach-Etage beginnen (z. B. im Dachgeschoss), auf einem Kniestock mit einstellbarer Höhe (normal 1 m). Die Wände dieses Stockwerks werden dann dort abgeschnitten, wo sie auf die Dachschrägen treffen (Sattel- und Walmdächer; Gauben und Solarpanels rücken mit dem Dach nach unten), so sieht ein Wohnraum unter den Schrägen auch so aus. Die Dach-Etage darüber wird der Spitzboden für Räume und Dinge, die dort oben lagern. Auf der Dach-Etage selbst gezeichnete Wände werden auch am Dach geschnitten, auch ohne Kniestock. Neues Modul `attic.js` (Kniestock, welches Dach welche Etage schneidet, die Ebenen der Schrägen) mit Tests; Texte in allen 7 Sprachen.

## [3.51.0] - 2026-10-07
### Verbessert
- **Live-Modus: die Kugel antippen, nicht das Gerät (#262)**: Ein Gerät mit Tipp-Kugel (eine Lampe, ein Fernseher, eine Jalousie, eine Kamera …) wird jetzt nur noch über seine Kugel angetippt. Ein Tipp auf das Gerät selbst landet beim Raum, wie ein Tipp ins Leere, so wird beim Herumtippen in einem Raum nichts aus Versehen geschaltet. Geräte ohne Kugel funktionieren wie bisher; die Abschnitte eines LED-Rings bleiben einzeln antippbar. Die Kugeln sind größer (60 cm statt 44 cm Durchmesser, ein schärferes Bild), und ihre unsichtbare Fingerfläche ist mitgewachsen. `ballOnly` in `pickrules.js` mit einem Test.

## [3.50.0] - 2026-10-07
### Neu
- **Dachgröße durch Ziehen (#259)**: Im 2D-Plan zeigt ein ausgewähltes Dach (auf der Dach-Etage) 8 weiße Griffe, an seinen Ecken und in der Mitte seiner Seiten. Eine Ecke zu ziehen, ändert Breite und Tiefe, eine Seite nur diese Seite; die gegenüberliegende Seite bleibt. 5-cm-Schritte (Alt: frei), nie kleiner als 1 m, Strg+Z macht es rückgängig. Der Plan folgt beim Ziehen, das Haus wird einmal neu gebaut, wenn der Griff losgelassen wird. Das Hauptdach behält dann seine eigene Größe („Größe von Hand gesetzt“). `roofHandles`, `resizeBox` und `setRoofBox` in `roofmove.js` mit Tests.

## [3.49.1] - 2026-10-07
### Repariert
- **Ein Dach zu verschieben ruckelt nicht mehr (#257)**: Während ein Dach gezogen wurde, wurde bei jedem 5-cm-Schritt das ganze Haus in 3D neu gebaut. Jetzt bewegen sich beim Ziehen nur das gezeichnete Dach und die Solarpanels darauf mit (in 3D und im 2D-Plan), und das Haus wird einmal gebaut, wenn das Dach losgelassen wird. Die Arbeit je Zeigerbewegung ging in der Demo von etwa 80 ms auf unter 1 ms herunter. `panelsOn` in `roofmove.js` mit einem Test.

## [3.49.0] - 2026-10-07
### Neu
- **Dächer verschieben (#255)**: Mit der Dach-Etage offen im Editor wählt ein Klick auf ein Dach (das Hauptdach oder ein weiteres) es aus, und das Feld zeigt, wo es ist. Das ausgewählte Dach noch einmal drücken und ziehen, um es zu verschieben, in 3D oder im 2D-Plan, der jetzt die Umrisse aller Dächer zeigt (5-cm-Schritte, Alt: frei). Auch die Pfeiltasten schieben es. Auf dem Dach liegende Solarpanels gehen mit. Das Hauptdach folgt dem Haus, bis es zum ersten Mal verschoben wird; danach behält es seine eigene Größe und seinen Platz („Größe von Hand gesetzt“). „Fit“ auf der Dach-Etage rückt die Dächer ins Bild. `roofmove.js` mit Tests.

## [3.48.11] - 2026-10-07
### Verbessert
- **Flüssigeres Bild (#253)**: Die Schatten wurden in jedem Bild neu gezeichnet, fast die Hälfte der Arbeit, obwohl sich die Sonne nie bewegt. Jetzt werden sie nur neu gezeichnet, wenn sich etwas geändert hat, das einen wirft (ein Neubau oder eine Zustandsänderung, ein gezogenes Gerät, Wände, die sinken oder steigen, eine Tür in Bewegung, die Schatten-Einstellung), und mindestens einmal pro Sekunde. Beim Drehen der Kamera in der Demo: 715 statt 1.274 Zeichenaufrufe pro Bild (−44 %) und weniger Arbeit pro Bild; das Bild sieht gleich aus. `shadowDue` in `frameloop.js` mit Tests.

## [3.48.10] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 22, der letzte (#137)**: Die Standard-Einstellungen, wie ein Bildschirm startet (Wandtablet, Raum-Tablet, nur ansehen, Live-Modus) und Längen in m / ft (`appstate.js`), wie oft das Bild gezeichnet wird, um auf Tablets Strom zu sparen (`frameloop.js`), Häuser öffnen, wechseln und importieren und ein Backup laden (`houseload.js`) und das Laden der Bereiche von Home Assistant (`livechannel.js`) haben `app.js` verlassen. Die reinen Teile sind getestet; ein Test prüft auch, dass jede Standard-Einstellung eine ist, die das Add-on kennt. `app.js` hält jetzt nur noch den Zustand des offenen Plans und verdrahtet die Module miteinander (etwa 1.430 Zeilen, 5.100 am Anfang). Für den Benutzer ändert sich nichts.

## [3.48.9] - 2026-10-07
### Repariert
- **Ein Doppelklick auf ein Gerät im Editor schaltet es wieder (#251)**: In 3D und im 2D-Plan tat ein Doppelklick auf eine Lampe nichts (der Browser meldete „quickAction is not defined“, ein Überbleibsel einer früheren Code-Aufteilung); er schaltet das Gerät wieder, und eine e2e-Prüfung passt darauf auf.
### Verbessert
- **Code aufteilen, Schritt 20, Teil 4 (#137)**: Zeichnen und Ziehen in der 3D-Ansicht (auswählen, Geräte und Türen / Fenster ziehen, Wände und Räume zeichnen, Öffnungen und Geräte setzen, Kabel- und Radier-Werkzeug, Doppelklick) haben `app.js` für `draw3d.js` verlassen, mit dem Zustand des Zeichnens; wohin eine Tür / ein Fenster an einer Wand kommt und wann zwei Klicks derselbe Punkt sind, ist getestet. Sonst ändert sich für den Benutzer nichts.

## [3.48.8] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 20, Teil 3 (#137)**: Bilder an der Wand (Rahmen, Bild, Hochladen) haben `app.js` für `picture.js` verlassen; die Bildgröße ist getestet. Für den Benutzer ändert sich nichts.

## [3.48.7] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 20, Teil 2 (#137)**: Das Antippen in der 3D-Ansicht (der Strahl vom Zeiger, der Punkt auf dem Boden darunter, was ein Klick oder Tipp trifft) hat `app.js` für `picking.js` verlassen; welcher von mehreren Treffern gewinnt und was im Live-Modus angetippt werden kann, sind jetzt reine Regeln in `pickrules.js` mit Tests. Für den Benutzer ändert sich nichts.

## [3.48.6] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 20, Teil 1 (#137)**: Löschen, Verschieben mit den Pfeiltasten (Wände nehmen die mit ihnen verbundenen Ecken mit), Drehen mit Q / E und die Tastenkürzel haben `app.js` für `edititems.js` verlassen; welche Taste was tut und die Änderungen der Listen sind getestet. Für den Benutzer ändert sich nichts.

## [3.48.5] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 21, Teil 3 (#137)**: Die Geräte einer Etage in 3D (Modelle, Solarpanels auf dem Dach, Halbschnitt, Tipp-Kugeln, Kamerakegel, Werte-Schilder) haben `build` in `app.js` für `floorbuild.js` verlassen; welches Gerät ein Werte-Schild bekommt, ist getestet. `build` ist jetzt nur noch der Rahmen (Boden, Grundstück, Nachbarhaus, Erdschnitt) um die Etagen. `app.js` ist auf etwa 1.800 Zeilen geschrumpft (5.100 am Anfang). Für den Benutzer ändert sich nichts.

## [3.48.4] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 21, Teil 2 (#137)**: Die Treppen und die Wände einer Etage in 3D (mit Türen, Fenstern, Halbschnitt und Absenken) haben `build` in `app.js` für `floorbuild.js` verlassen. Für den Benutzer ändert sich nichts.

## [3.48.3] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 21, Teil 1 (#137)**: Die flachen Teile einer Etage in 3D (Raumböden mit ihren Lichtschichten, Warnpuls und Name, die Ränder von Bodenöffnungen, Platzhalter-Blöcke) haben `build` in `app.js` für `floorbuild.js` verlassen; das Raum-Schild ist getestet. Für den Benutzer ändert sich nichts.

## [3.48.2] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 22, Teil 2 (#137)**: Rückgängig (die letzten 60 Stände des Plans) und das automatische Speichern des offenen Hauses haben `app.js` für `persist.js` verlassen; die Regel der Rückgängig-Liste ist getestet. Für den Benutzer ändert sich nichts.

## [3.48.1] - 2026-10-07
### Verbessert
- **Code aufteilen, Schritt 22, Teil 1 (#137)**: Der Live-Kanal (Zustände, die das Add-on in dem Moment schickt, in dem Home Assistant sie meldet, Abfragen, solange er weg ist) hat `app.js` für `livechannel.js` verlassen; eine geschickte Änderung einarbeiten, der Fingerabdruck einer vollen Liste und wann abgefragt wird, sind rein und getestet. Für den Benutzer ändert sich nichts.

## [3.48.0] - 2026-10-07
### Neu
- **Die Schilder der Etagen darunter ausblenden (#249)**: Beim Blick auf eine Etage lassen sich die Raumnamen und Werte-Schilder der Etagen darunter weglassen, damit sie die offene Etage nicht mehr überdecken: in den Einstellungen („Namen und Schilder der Etagen darunter zeigen“) oder schnell im Menü „Ansicht“ („Schilder darunter“). Die Ansicht des ganzen Hauses zeigt immer alles.
- **Ansichts-Voreinstellungen je Benutzer / Tablet (#250)**: Im Benutzer-Fenster hat jede Benutzerzeile einen Knopf „⚙ Voreinstellungen“ mit eigenen Startwerten für das Aussehen: Wände zur Kamera hin (durchsichtig oder niedriger), Auto, alle Wände niedrig oder hoch, Werte-Schilder, Etagen darunter und ihre Schilder. „Standard“ behält die allgemeine Einstellung. Eine Voreinstellung gilt nur im Browser dieses Benutzers und wird nie als Einstellung für alle gespeichert (außer dieser Benutzer ändert das Feld absichtlich); sie wird mit den Tablets in `users.json` gespiegelt. `viewprefs.js` mit Tests, auch auf dem Server geprüft.

## [3.47.0] - 2026-10-06
### Neu
- **Mehreres auf einmal, leichter (#247)**: Strg + Klick (Cmd am Mac) fügt jetzt Dinge zur Auswahl hinzu wie Umschalt + Klick, in 2D und 3D. Im 2D-Plan zieht Umschalt oder Strg + Ziehen von jeder Stelle einen Rahmen auf: Alles, was ganz darin liegt, kommt zur Auswahl; Entf (oder „Alle löschen“) entfernt sie dann alle in einem Rückgängig-Schritt. `boxItems` und `addMulti` in `multisel.js` mit Tests.
### Verbessert
- **Treppen über mehrere Etagen: die ganze Höhe nur im Editor (#246)**: Im Live-Modus zeigt eine Treppe wieder nur bis zur offenen Etage, nichts hängt darüber in der Luft (Handlauf und Mittelstange einer Wendeltreppe enden dort auch); der Editor zeichnet die Stockwerke darüber weiter durchsichtig. `splitStoreys` in `stairs.js` mit Tests.
- **Tipp-Kugeln größer und nie übereinander (#244)**: Die Kugeln im Live-Modus sind größer (44 cm Durchmesser), und Kugeln, die einander oder ein Werte-Schild verdecken würden, rücken ein Stück auseinander (höchstens 90 cm von ihrem Gerät); `spreadBalls` in `tapballs.js` mit Tests.
- **Wasser und Gas in einer eigenen Pille (#245)**: Die Wasser-, Gas- und Wärmezähler sind keine zweite Zeile mehr in der Strom-Übersicht (sie überdeckte die Felder daneben und leuchtete mit den Stromkabeln auf); sie haben jetzt ihre eigene einzeilige Pille daneben. `meterText` in `powerlogic.js` mit Tests.

## [3.46.1] - 2026-10-06
### Verbessert
- **Code aufteilen, Schritte 23 und 24 (#137)**: Fünf weitere Teile haben `app.js` verlassen (jetzt knapp unter 2.000 Zeilen, von 5.100 am Anfang): der Zustand einer Entität und die Farbe eines Lichteffekts (`entitystate.js`), einen geladenen Plan vervollständigen (`layoutnorm.js`), einen gewählten Raum freistellen (`roomclip.js`), die Trefferflächen und das Hologramm-Aussehen eines Modells (`modelfx.js`) und Text in der Szene (`labels.js`). Die reinen Teile haben Unit-Tests; für den Benutzer ändert sich nichts.

## [3.46.0] - 2026-10-06
### Neu
- **Wasser- und Gaszähler in der Strom-Übersicht (#237)**: Die Übersichts-Pille oben zeigt die Stände der Wasser-, Gas- und Wärmezähler in einer zweiten Zeile unter den Stromzahlen („🚰 1234.6 m³ · 🔥 845.2 m³“), wenn es Zähler mit einem Wert gibt; der Tooltip nennt jeden Zähler. `meterReadings` in `powerlogic.js` mit Tests.
- **Tipp-Kugeln im Live-Modus (#238)**: Alles, was sich im Live-Modus antippen lässt, hat eine kleine Kugel, die darüber schwebt (unter einer Deckenlampe: darunter), in der Farbe des Lichts leuchtend, solange es an ist, graublau, solange aus, mit einem kleinen Symbol dafür, was sie steuert (💡 Lampen und LEDs, 🪟 Rollläden, 🔌 Steckdosen, 📷 Kameras, 📺 Fernseher, 🌡 Heizung, ☀ ⚡ 🔋 Stromgeräte, 🚰 🔥 Zähler …, #240); ein Tipp auf die Kugel wirkt wie ein Tipp auf das Gerät. Neues Modul `tapballs.js` mit Unit-Tests.
- **Brücke mit Stufen (#239)**: Steiler als 1 : 8 wird das Deck einer Brücke zu flachen Trittstufen mit Setzstufen von höchstens 18 cm, so lässt sich auch ein großer Höhenunterschied begehen.
### Verbessert
- **Wand- und Wendeltreppen über mehrere Etagen (#236)**: Eine Wandtreppe über mehrere Etagen wird jetzt Stockwerk für Stockwerk gebaut wie das Treppenhaus (dieselbe Treppe auf jeder Etage noch einmal, auf jeder ankommend), statt eines immer längeren Laufs. Eine Wendeltreppe macht eine Windung je Etage und bekommt auf jeder Etage, die sie erreicht, einen Absatz auf Bodenhöhe; die nächste Windung beginnt dort, wo dieser Absatz endet.
- **Die volle Höhe einer Treppe über mehrere Etagen wieder sichtbar (#236)**: Beim Blick auf eine Etage werden die Stockwerke darüber durchsichtig gezeichnet, statt weggelassen zu werden, so zeigt sich die ganze Treppe, ohne als feste Treppe in der Luft zu hängen.
- **Live-Modus: Sensoren nehmen keinen Tipp an (#236)**: Temperatur-, Feuchte- und CO₂-Sensoren haben im Live-Modus keine Trefferfläche mehr (ihre Werte zeigen sich im Raum und in den Übersichten); Thermostate lassen sich weiter antippen.
### Repariert
- **Knopf des Strom-Editors (#239)**: Solange der Strom-Editor an ist, bleibt sein Knopf blau wie jeder aktive Knopf (ein anderes Werkzeug zu wählen, nahm die Hervorhebung weg).

## [3.45.1] - 2026-10-06
### Verbessert
- **Live-Modus: weniger aus Versehen zu treffen (#234)**: Die Anwesenheits-Figur hat im Live-Modus keine Trefferfläche mehr, und auch nicht der Sichtkegel einer Kamera (nur die Kamera selbst lässt sich antippen). Die Regeln stehen im neuen Modul `pickrules.js` mit Unit-Tests.
### Repariert
- **Treppe über mehrere Etagen hängt in der Luft (#231)**: Beim Blick auf eine Etage wurden die oberen Stockwerke eines Treppenhauses oder einer geraden / L- / U-Treppe über mehrere Etagen darüber gezeichnet, obwohl die Etagen, auf denen sie ankommen, ausgeblendet waren, so schwebten sie. Auf einer Etage wird jetzt nur das Stockwerk gezeichnet, das dort beginnt (`storeysShown` in `stairs.js`, getestet); eine Etage höher kommt die Treppe an und geht weiter, und die Ansicht des ganzen Hauses zeigt sie ganz.
- **Wandtreppe: eine Stufe zwischen zwei Podesten an der Wende (#232)**: Zwei nahe beieinander liegende Klicks an einer Ecke (oder einer gleich danach) machten zwei Podeste ohne Stufe dazwischen, und das zweite lag eine Stufe höher. Podeste ohne Stufe dazwischen liegen jetzt auf einer Höhe, so bleibt die Treppe an der Wende flach und geht erst nach dem Podest weiter; sie kommt trotzdem auf der Etage darüber an.
- **Die Wendeltreppe hat kein Ende (#233)**: Die Wendeltreppe hörte eine Stufe unter dem Boden mitten in ihrer runden Öffnung auf. Nach der letzten Stufe hat sie jetzt ein Viertelpodest auf Bodenhöhe bis an den Rand der Öffnung, so steigt man auf den Boden aus. In der Demo ist die Wendeltreppe zur Dachterrasse so gedreht, dass ihr Ausgang zur Terrasse zeigt.

## [3.45.0] - 2026-10-06
### Neu
- **Treppen über mehrere Etagen kommen auf jeder Etage an (#229)**: Eine gerade, L- oder U-Treppe mit „Etagen“ 2 oder mehr war bisher ein langer Lauf an den Etagen dazwischen vorbei, ohne Ausstieg. Jetzt wird sie Stockwerk für Stockwerk gebaut: dieselbe Treppe auf jeder Etage noch einmal, so kommt man auf jeder Etage an und kann dort aussteigen; die oberen Stockwerke ruhen auf einer Platte unter ihren Stufen, statt bis zur Etage darunter massiv zu sein. Wo eine U-Treppe ein Stück hinter ihrem Anfang endet, schließt eine Platte auf Bodenhöhe diese Lücke.
- **Podest an der Wende von L- und U-Treppen (#229)**: Das Feld „Podest nach einer Biegung“ geht jetzt auch bei L- und U-Treppen (im Treppen-Werkzeug und in den Eigenschaften): Das Podest an der Wende wird so viel tiefer (0 bis 3 m), Lauf 2 rückt entsprechend weiter. Import und Export kennen `landing` für L und U.
- **Treppenhaus mit Podest und Tür auf jeder Etage (#229)**: Die Vorlage „Treppenhaus“ hält vor der Treppe ein Podest frei (1,2 m, mindestens die Treppenbreite), setzt die Tür dorthin und baut Wände, Raum und Tür auf jeder Etage, die die Treppe erreicht (vorher: nur die Etage darüber, ohne Tür).

## [3.44.2] - 2026-10-06
### Neu
- **Demo mit zwei Häusern**: Die Demo hat jetzt ein zweites Haus, *Nachbarhaus*, das neben dem Demo-Haus steht (sein Obergeschoss 0,4 m höher). Eine Metallbrücke führt von der Dachterrasse des Demo-Hauses hinüber zu seiner Dachterrasse und steigt dabei um 0,4 m, so lassen sich das Nachbarhaus (#220) und die Brücke mit Höhenunterschied (#222) im Browser ausprobieren. Häuser wechseln, anlegen, kopieren, umbenennen und löschen geht auch in der Demo (gemerkt, bis der Tab geschlossen wird).
- **Mehr von den neuen Sachen im Demo-Haus**: Wasser-, Gas- und Wärmezähler mit Ständen im Keller, ein Feld aus 10 Solarpanels auf dem Dach, eine Wendeltreppe von der Garage hoch durch die Dachterrasse; das Nachbarhaus hat eine Wandtreppe mit einem Podest nach ihrer Biegung.
### Repariert
- **Terrassengeländer und Brücke**: Das Geländer einer Dachterrasse lief quer über das Ende einer Brücke, so ließ sie sich nicht betreten. Wo eine Brücke ankommt, auf der Terrasse dieses Hauses und auf der des Nachbarn, lässt das Geländer jetzt eine Lücke (`onBridge` in `bridge.js`, mit Tests).

## [3.44.1] - 2026-10-06
### Neu
- **Brücke mit Höhenunterschied (#222)**: Wenn die Obergeschosse der zwei Häuser nicht auf derselben Höhe liegen, macht das neue Feld „Höhenunterschied am Ende“ der Brücke ihr fernes Ende so viel höher (+) oder niedriger (−); Deck, Träger und Geländer steigen gleichmäßig an, die Pfosten folgen. Im 2D-Plan zeigt ein lila Pfeil zum fernen Ende mit dem Wert daneben. Das Nachbarhaus zeigt sein Stockwerk auf der Höhe der offenen Etage, auch wenn es etwas höher oder tiefer liegt (eingestellt mit seiner „Höhe“). Import und Export kennen `rise`.

## [3.44.0] - 2026-10-06
### Neu
- **Nachbarhaus (#220, macht #189 fertig)**: Unter „Häuser & Backup“ lässt sich ein anderes Haus der Liste neben dieses stellen (Position X / Z, Drehung, Höhe). Es wird in 3D neben diesem Haus gezeichnet (Wände, Böden, Dächer, das Geländer einer Dachterrasse), in der Ansicht des ganzen Hauses vollständig und auf einer Etage bis zur Höhe dieser Etage; im 2D-Plan zeigt sich sein Umriss auf derselben Ebene lila gestrichelt. Es bleibt ein eigener Plan und wird bearbeitet, indem man zu ihm wechselt. So kann die Metallbrücke im 1. Stock hinüber zur Dachterrasse des anderen Hauses führen. Die Geometrie steht im neuen Modul `neighbor.js` mit Unit-Tests.
### Repariert
- **Terrassengeländer**: Ein Rand einer Dachterrasse, der von Ecke zu Ecke offen ist (keine Wand an seinem Anfang), bekam gar kein Geländer. Jetzt bekommt er eins.

## [3.43.10] - 2026-10-05
### Neu
- **Podeste der Wandtreppe (#210)**: Ein neues Feld „Podest nach einer Biegung“ hält die Wandtreppe nach jeder Biegung so lange flach (0 bis 3 m, 0 = nur die Ecke wie bisher), so bleibt sie um die Ecke auf einer Höhe und steigt erst dann weiter. Ein Klick mitten auf ein gerades Stück beim Zeichnen des Wegs setzt dort ein eigenes Podest. Import und Export kennen `landing`.

## [3.43.9] - 2026-10-05
### Neu
- **Mehreres auf einmal (#211)**: Umschalt + Klick (im 2D-Plan und in 3D) fügt ein Ding zur Auswahl hinzu oder nimmt es wieder heraus. Alles Ausgewählte bekommt einen grünen Rahmen; das Eigenschaften-Feld zeigt, wie viele, und einen Knopf „Alle löschen“. Die Entf-Taste entfernt sie alle, ein Rückgängig (Strg+Z) holt sie alle zurück, Esc leert die Auswahl. Die Logik der Liste steht im neuen Modul `multisel.js` mit Unit-Tests.

## [3.43.8] - 2026-10-05
### Neu
- **Der 2D-Plan dreht sich mit der 3D-Ansicht (#212)**: In „2D + 3D“ dreht ein neuer Schalter „↻ Plan dreht mit“ in der Ecke des Plans den Plan so, dass oben immer die Blickrichtung der Kamera ist. Schilder bleiben aufrecht, Klicken und Zeichnen im gedrehten Plan gehen wie bisher. Aus (der Normalfall) bleibt der Plan gerade. Die Winkelrechnung steht im neuen Modul `planview.js` mit Unit-Tests.

## [3.43.7] - 2026-10-05
### Verbessert
- **Aus den Listen springen (#215)**: Ein Tipp auf einen Eintrag der Liste offener Türen und Fenster, der Offline-Liste oder auf „Im Plan zeigen“ einer Kamera wirkt jetzt wie die Suche: Die Kamera fliegt dorthin, ein Ring markiert die Stelle, und das Ding ist ausgewählt (vorher wechselte nur die Etage).

## [3.43.6] - 2026-10-05
### Verbessert
- **Wendeltreppe (#209)**: kein massiver Zylinder mehr. Die Stufen sind dünne Platten an einer Mittelstange, ohne etwas darunter, und außen läuft ein Handlauf mit einem Geländerstab je Stufe, auch über mehrere Etagen.

## [3.43.5] - 2026-10-05
### Repariert
- **Zähler und Brücke nach dem Setzen unsichtbar (#207)**: Der Strom-Editor (er bleibt seit #174 an) versteckte alles, was kein Stromgerät ist, auch das gerade Gesetzte. Die Wasser-, Gas- und Wärmezähler bleiben im Strom-Editor jetzt sichtbar; etwas anderes dort zu setzen, schaltet den Editor aus, mit einem Hinweis in der Statuszeile.
- **Gestell der Solarpanels (#208)**: Der Pfosten ragte durch das Panel (er war von Anfang an zu lang). Jedes Panel steht jetzt auf vier Pfosten, die knapp darunter enden. Auf einem schrägen Dach reicht jeder Pfosten bis aufs Dach darunter, und das Panel ist vom Dach abgehoben, so schwebt nichts und steckt nichts im Dach.

## [3.43.4] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 22 (#137)**: Das Setzen von Dingen (am Raster und an Wandecken einrasten, Wandgeräte flach an eine Wand klicken, der LED-Ring um einen Raum, die Liste der Wandgeräte) ist aus `app.js` nach `placement.js` umgezogen, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.43.3] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 21 (#137)**: Die Navigation (Etagen-Pillen, Raum-Menü, Scroll-Pfeile der Leiste, der Raum-Knopf des Tablets, der Bereich, den die Kamera ins Bild nimmt) ist aus `app.js` nach `nav.js` umgezogen, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.43.2] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 20 (#137)**: Der Wandanschlag (Dinge lassen sich nicht in eine Wand schieben, sie gleiten an ihr entlang, Türöffnungen lassen sie durch) ist aus `app.js` nach `collide.js` umgezogen, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.43.1] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 19 (#137)**: Die Dächer (Dachgröße, Dachflächen mit Gauben und weiteren Dächern, das Geländer einer Dachterrasse, Solarpanels auf dem Dach, Ausblenden, wenn die Kamera nahe kommt) sind aus `app.js` nach `roofs.js` umgezogen, mit Unit-Tests für die Dachgrößen. Keine Änderung im Verhalten.

## [3.43.0] - 2026-10-05
### Neu
- **Metallbrücke / Übergang (#189)**: neues Teil „Brücke / Übergang“ in der Bibliothek (Außen): ein Gitterrost-Deck auf zwei Stahlträgern mit Geländer auf beiden Seiten, normal 3 m lang und 1,2 m breit. Länge, Breite und Geländer werden in den Eigenschaften eingestellt; die Lauffläche liegt auf der Höhe der Etage, auf der sie steht, so verbindet sie im Obergeschoss gesetzt zwei Gebäudeteile. Import und Export behalten `len`, `w` und `noRail`. Die Geometrie steht im neuen Modul `bridge.js` mit Unit-Tests.

## [3.42.0] - 2026-10-05
### Neu
- **Wasser-, Gas- und Wärmezähler (#136)**: drei neue Geräte in der Bibliothek (Kategorie Smart Home neben den Sensoren, die Suche findet sie auch unter „Zähler“ / „meter“): Wasserzähler an seinem Rohr, Gaszähler und Wärmezähler mit einem roten und einem blauen Rohr. Mit einem Sensor verbunden, zeigen sie den Stand als Schild mit eigenem Zeichen: 🚰 1234.6 m³, 🔥 845.2 m³, ♨ 5321 kWh.
### Verbessert
- Die Texte der Werte-Schilder sind aus `app.js` nach `badgetext.js` umgezogen (mit Unit-Tests); Sensoren mit der Geräteklasse Wasser, Gas oder Energie bekommen auch ein Zeichen.

## [3.41.0] - 2026-10-05
### Neu
- **Solarpanels auf dem Dach (#176)**: Ein auf der Dach-Etage gesetztes Solarpanel liegt jetzt auf dem Dach selbst: Seine Höhe und Neigung folgen der Dachfläche darunter (Sattel-, Walm-, Flachdach und weitere Dächer), auch beim Verschieben. Auf einem Flachdach steht es auf Gestellen. Neue Felder in den Eigenschaften: Panels nebeneinander und Reihen (ein Feld aus bis zu 12 x 12 Panels) und die Montage (automatisch, flach auf dem Dach, auf einem Gestell). Die Dachrechnung steht im neuen Modul `solarroof.js` mit Unit-Tests; Import und Export behalten `cols`, `rows` und `mount`.

## [3.40.8] - 2026-10-05
### Repariert
- **Der Strom-Editor bleibt an (#174)**: Im Strom-Editor kamen die anderen Geräte (Lampen, Möbel …) nach ein paar Sekunden zurück, weil die nächste Zustandsänderung jedes Gerät wieder sichtbar machte. Jetzt bleiben sie versteckt, bis der Editor ausgeschaltet wird, auch nach einem Neubau der Szene. Der Strom-Knopf unten behält seinen Zustand genauso. Browser-Tests passen auf beides auf.

## [3.40.7] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 18 (#137)**: Die Shader der Raumbeleuchtung und die Farbskalen sind aus `app.js` nach `roomlight.js` umgezogen, der Boden (Erdreich, Rasen, Form des Grundstücks, der Schnitt durch das Erdreich) nach `earth.js`, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.40.6] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 17 (#137)**: Das Etagen-Feld (Name, Art und Reihenfolge einer Etage, einen Keller oder ein Dach hinzufügen, löschen; das Dach mit seinen Gauben und weiteren Dächern) ist aus `app.js` nach `floorpanel.js` umgezogen, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.40.5] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 16 (#137)**: Die Einstellungen (Formular, Laden mit Wiederholungen, Speichern mit der ETag-Sicherung, das Benutzer-Fenster) sind aus `app.js` nach `settings.js` umgezogen, mit Unit-Tests. Die Einstellungen auf das Haus und die Ansicht anzuwenden, bleibt in `app.js`. Keine Änderung im Verhalten.

## [3.40.4] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 15 (#137)**: Türen, Tore und Fenster mit Kontaktsensor (offen oder zu, die Liste „n offen“, die sich bewegenden Flügel) sind aus `app.js` nach `openings.js` umgezogen und das Absenken (Wände zur Kamera hin sinken ab oder werden durchsichtig) nach `cutaway.js`, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.40.3] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 14 (#137)**: Das Eigenschaften-Feld ist aus `app.js` umgezogen nach `props.js` (Felder je Objektart, Abschnitte des LED-Rings), `objlist.js` (Objektliste der Etage), `roomentities.js` (Entitäten des gewählten Raums, automatisches Setzen), `propfields.js` (Eingabefelder des Seitenfelds) und `entitypicker.js` (Entitätenauswahl mit Suche, nach Bereich gruppiert), mit Unit-Tests. Keine Änderung im Verhalten.

## [3.40.2] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 13 (#137)**: Die Live-Bedienung (Schalten, Licht-Bedienung, Szenen, der Block „Ganzer Raum“), das Live-Popup und das Raum-Feld sind aus `app.js` nach `livecontrols.js`, `livepopup.js` und `roompanel.js` umgezogen, mit Unit-Tests. Zwei kleine Geometrie-Helfer (Fläche, Abstand zu einem Umriss) leben jetzt einmal in `rooms.js`. Keine Änderung im Verhalten.

## [3.40.1] - 2026-10-05
### Neu
- **Import, Export und API kennen Treppen (#191)**: Das Haus-JSON hat jetzt `stairs` je Etage (Arten gerade, L, U, Wendel und Wand, mit `floors`, `dir`, `turn`, `w`, `tread`, `rot` und `path` für eine Wandtreppe), dazu `blocks` (Platzhalter-Blöcke) und `holes` (Bodenöffnungen). Ungültige Werte werden mit ihrem JSON-Pfad gemeldet, der Export schreibt sie zurück (hin und zurück), das JSON-Schema beschreibt sie, und die Import-Zusammenfassung der API zählt `stairs`. Der KI-Prompt des Import-Fensters erwähnt Treppen. Die Dokumentation (deutsch und englisch) ist erweitert.

## [3.40.0] - 2026-10-05
### Neu
- **Treppen über mehrere Etagen (#188)**: Jede Treppe hat jetzt eine Einstellung „Etagen“ (1 bis 6). Eine gerade, L- oder U-Treppe wird einfach lang genug, eine Wendeltreppe macht eine Windung je Etage. Die Öffnung im Boden wird in jede Etage geschnitten, durch die die Treppe geht.
- **Wandtreppe (#188)**: eine leichte Treppe, die an einer Wand hängt. Man klickt ihren Weg entlang der Wand im 2D-Plan (Doppelklick oder Enter beendet ihn, Esc bricht ab). Der Weg rastet an der Wandfläche ein, und jede Biegung ist ein **Podest** (auch an Ecken zwischen zwei Wänden). Die Stufen sind dünne Platten ohne etwas darunter. Man wählt die Seite, zu der die Stufen herausragen; die Breite wird an einem Griff gezogen. Sie kann über mehrere Etagen steigen.
- **Außen-Wendeltreppe (#188)**: Die Wendeltreppe geht auch über mehrere Etagen, so kann sie vom Garten hoch bis zu einer Dachterrasse führen.
### Verbessert
- Die Treppenfelder des Eigenschaften-Felds sind von `app.js` nach `stairtool.js` umgezogen. Die Unit-Tests der Treppen laufen jetzt über den ganzen Ordner `static` (CI-Schritt geändert).

## [3.39.12] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 12 (#137)**: Platzhalter-Blöcke, Bodenöffnungen, das Grundstück und das Treppen-Werkzeug sind aus `app.js` nach `blocks.js` und `stairtool.js` umgezogen, mit Unit-Tests (Form eines Treppenhauses, auf welche Etage ein Block kommt, Bodenformen mit Öffnungen). Keine Änderung im Verhalten.

## [3.39.11] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 11 (#137)**: Die Paletten der Bibliothek (Gerätearten nach Kategorie und Suche, deine eigenen 3D-Modelle) sind aus `app.js` nach `palettes.js` umgezogen, mit Unit-Tests.
### Repariert
- Die Suche in der Bibliothek findet jetzt auch mitgelieferte 3D-Modelle, deren Name Großbuchstaben hat (der getippte Text wurde kleingeschrieben, der Name nicht).

## [3.39.10] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 10 (#137)**: Das Hintergrundbild (Vorlage zum Nachzeichnen) ist aus `app.js` nach `background.js` umgezogen, mit Unit-Tests für das Kalibrieren und das Ersetzen eines Bildes. Keine Änderung im Verhalten.

## [3.39.9] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 9 (#137)**: Die zwei tabellenartigen Teile der Einstellungen (Tablet-Zuordnungen und Farbskalen) sind aus `app.js` nach `settingsui.js` umgezogen, mit Unit-Tests. Die einfachen Felder, das Anwenden und Speichern der Einstellungen bleiben vorerst in `app.js`. Keine Änderung im Verhalten.

## [3.39.8] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 8 (#137)**: Die Häuser (Liste, Ausklappliste, neu / kopieren / umbenennen / löschen) sind aus `app.js` nach `houses.js` umgezogen, mit Unit-Tests für die Wahl des zu öffnenden Hauses. Das Laden eines Plans bleibt in `app.js`. Keine Änderung im Verhalten.

## [3.39.7] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 7 (#137)**: Die Etagen-Leiste (Seitenleiste mit einem Bild jeder Etage) ist aus `app.js` nach `floorrail.js` umgezogen, mit Unit-Tests für das Zeichnen. Keine Änderung im Verhalten.

## [3.39.6] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 6 (#137)**: Die Etagen-Karten der Ansicht des ganzen Hauses sind aus `app.js` nach `floorcards.js` umgezogen, mit Unit-Tests für die Zahlen und die Platzierung. Keine Änderung im Verhalten.

## [3.39.5] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 5 (#137)**: Kameras (Sichtkegel, Kamera-Übersicht, Standbilder) sind aus `app.js` nach `cameras.js` umgezogen, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.39.4] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 4 (#137)**: Offline-Liste, Wandtablet (Bildschirmschoner/Nacht) und Werte-Schilder sind aus `app.js` nach `offline.js`, `kiosk.js` und `badges.js` umgezogen, mit Unit-Tests. Keine Änderung im Verhalten.

## [3.39.3] - 2026-10-05
### Repariert
- **Kompass (#175)**: Nach einer ganzen Runde um das Haus dreht die Nadel nicht mehr ganz zurück. Der Winkel zählt jetzt über 360 Grad hinaus weiter. Der Kompass ist in ein eigenes Modul `compass.js` mit Unit-Tests umgezogen.

## [3.39.2] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 3 (#137)**: Die Warnungen (Banner, roter Raum, Sprung zum Raum), die Suche „Wo ist …?“ und die Eigenschaften der Küchenzeile sind aus `app.js` nach `alertsui.js`, `search.js` und `kitchenui.js` umgezogen. `app.js` ist etwa 190 Zeilen kürzer. Für den Benutzer ändert sich nichts.

## [3.39.1] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 2 (#137)**: Das Strom-Add-on (Kabel, Strom-Editor, Strom-Übersicht, Batterie, Eigenschaften) ist aus `app.js` nach `power.js` (3D- und Bildschirm-Teil) und `powerlogic.js` (die Rechnungen, mit 9 Unit-Tests) umgezogen. `app.js` ist etwa 240 Zeilen kürzer. Für den Benutzer ändert sich nichts.

## [3.39.0] - 2026-10-05
### Neu
- **Batterie: Man sieht, ob sie lädt**: Die Übersicht neben dem Raum-Menü zeigt den Ladestand und einen Pfeil, `↑ 600 W`, solange sie lädt, und `↓ 450 W`, solange sie entlädt (nichts, wenn sie ruht). Die Batterie bekommt einen freiwilligen Sensor für die Leistung (Eigenschaften: *Sensor für Laden / Entladen*; plus = laden, oder ein Textsensor, der laden / entladen sagt) und *Vorzeichen umdrehen* für Zähler, die andersherum zählen. Ohne diesen Sensor geht auch eine Batterie, deren eigener Sensor Watt meldet. Import / Export: `batPower`, `batInvert`.

## [3.38.1] - 2026-10-05
### Verbessert
- **Die Sprache startet auf Auto**: Die Demo (sie war fest auf Englisch) und das Add-on folgen der Sprache des Browsers. Von älteren Versionen gespeicherte Einstellungen mit einem deutschen Standard, den niemand gewählt hat, gelten auch als Auto; ist in den Einstellungen einmal eine Sprache gewählt, bleibt sie gewählt. Neue versteckte Einstellung `langChosen`.

## [3.38.0] - 2026-10-05
### Neu
- **Strom: Kabel lassen sich antippen und löschen**: Im Strom-Editor wählt ein Klick auf ein Kabel (2D: die Linie, 3D: das Kabel oder sein dickes unsichtbares Trefferrohr) es aus; die Eigenschaften zeigen, wohin es geht, seine Art, seinen Weg, einen freiwilligen eigenen Sensor und einen Knopf **Kabel löschen** (auch die Entf-Taste). Die Liste in den Geräte-Eigenschaften behält ihr Kreuz.
- **Kabelfarben**: Jedes Kabel hat eine Art, die seine Farbe bestimmt: *Netz / Einspeisung* (rot), *eigener Solarstrom* (grün), *Batterie* (blau), *Verbrauch* (bernstein). Der Normalfall folgt dem Gerät, an dem das Kabel beginnt; je Kabel änderbar (auch im Import: `kind`).
- **Strom-Übersicht** neben dem Raum-Menü: was das Haus erzeugt (Wechselrichter, sonst Solarpanels), was es aus dem Netz bezieht oder einspeist (Zähler), den berechneten Verbrauch und den Ladestand der Batterie. Ein Klick zeigt oder versteckt die Kabel. Ein Kabel kann seinen eigenen Sensor haben (`entity`), ein Ladestand in % wird nie als Watt gezeigt.
- Die **Demo** zeigt jetzt ihre Version in der oberen Leiste (`vX.Y.Z · demo`) und hat eine Hausbatterie mit eigenem Kabel.
### Repariert
- **Stromdinge im 2D-Plan** hatten einen riesigen Kasten von 0,8 m; jetzt haben sie ihre echte Größe (Zähler 22 x 11 cm, Wechselrichter 45 x 16 cm, Solarpanel 1,0 x 1,55 m …).

## [3.37.0] - 2026-10-05
### Neu
- **Küchenzeile: Jedes Modul kann seine eigene Breite haben** (ein Zahlenfeld je Modul, 30 cm bis 2,4 m); Schublade, Spüle, Spülmaschine und der Rest folgen in 2D und 3D, die Länge des Schenkels wird angepasst. Die Spülmaschine heißt in der Modulliste *Dishwasher* / *Spülmaschine*. Import / Export: Ein Modul ist sein Name oder `{ "m": name, "w": metres }`.
### Verbessert
- **Kompass**: Der Ring mit N / O / S / W steht jetzt still (Norden ist oben), und nur die Nadel dreht sich dorthin, wohin man schaut, statt dass sich die ganze Scheibe dreht.
- **Dach**: Der Knopf *Gauben* der Werkzeugleiste heißt jetzt *Dach* (Form, Gauben, weitere Dächer), und der Abschnitt *Weitere Dächer* erklärt, wie man ein zweites Dach hinzufügt (*+ Weiteres Dach*, dann Form, Größe und die Etage, auf der es sitzt).

## [3.36.3] - 2026-10-05
### Repariert
- **Strom-Editor**: Ihn einzuschalten, öffnet jetzt sofort die Bibliothek mit den Stromdingen (vorher musste erst das Werkzeug *Gerät* gewählt werden, und nichts zeigte sich). Im Editor lassen sich **nur Stromgeräte** treffen, auswählen oder verschieben; Wände, Türen, Fenster, Räume und alle anderen Geräte werden nicht mehr angetippt. Das Kabel-Werkzeug geht auch mit Klicks in der 3D-Ansicht (die kleinen Geräte werden innerhalb einer Fingerbreite um den Zeiger gefunden; vorher traf der Klick oft eine Tür oder Wand dahinter), und ein Klick auf etwas, das kein Stromgerät ist, sagt das in der Statuszeile.

## [3.36.2] - 2026-10-05
### Verbessert
- **Die Demo zeigt die neuen Sachen**: Das Thermostat hat eine Solltemperatur und Modi (das Heizungs-Feld funktioniert, `+`/`-` und die Modus-Knöpfe antworten), ein Heizkörper glüht mit der Heizung, die Küche ist eine *Küchenzeile*, und ein kleines Stromnetz ist verdrahtet (Hausanschluss, Zähler, Zählerschrank, Wechselrichter, drei Solarmodule mit Wattwerten und Kabeln). Test-Haken `powerLinks()` für die Browser-Tests.

## [3.36.1] - 2026-10-05
### Verbessert
- **Code aufteilen, Schritt 1 (#137)**: Das Heizungs-Feld ist aus `app.js` in ein eigenes Modul `heatpanel.js` mit Unit-Tests umgezogen (Runden der Solltemperatur, das Schild, ein Aufruf für mehrere Klicks, die Modus-Knöpfe). Für den Benutzer ändert sich nichts.

## [3.36.0] - 2026-10-05
### Neu
- **Strom-Editor (#136)**: neuer Knopf *Strom-Editor* in der Werkzeugleiste. Solange er an ist, werden nur die Stromdinge gezeigt und lassen sich antippen oder verschieben (Hausanschluss, Zählerschrank, Zähler, Wechselrichter, Solarpanel, Batterie, Wallbox), und die Kabel werden gezeigt; alles andere ist versteckt. Die Bibliothek wechselt zur neuen Kategorie *Strom*.
- **Kabel-Werkzeug**: ein Stromgerät anklicken, dann ein anderes, und ein Kabel wird gezeichnet. Ein Gerät kann **mehrere Kabel** haben; in seinen Eigenschaften hat jedes Kabel sein Ziel, seinen **Weg** (*am Boden entlang*, *durch den Boden* für ein anderes Stockwerk oder *frei in der Luft*) und ein Kreuz zum Entfernen, und die ankommenden Kabel werden aufgelistet.
- **Kabel in 2D und 3D** auf jeder Etage: bernsteinfarbene Linien im Plan (ein Kabel zu einer anderen Etage endet in einem Pfeil mit dem Namen der Etage), fließende Punkte und der Wattwert in 3D. Neue Geräte *Hausanschluss*, *Zählerschrank*, *Hausbatterie* und *Wallbox*.
### Verbessert
- Import / Export: `cables` (Liste von `{to, route}`) ersetzt das einzelne `feeds` aus 3.35.0 (wird weiter gelesen).

## [3.35.0] - 2026-10-05
### Neu
- **Strom-Add-on, Kabel (#136)**: Ein Solarpanel, Wechselrichter oder Stromzähler lässt sich mit einem anderen verkabeln (*Kabel zu* in den Eigenschaften). Das Kabel wird in 3D mit fließenden Punkten gezeichnet: Richtung und Geschwindigkeit folgen den Watt der Entität des Geräts (negativ fließt rückwärts, kW wird umgerechnet), und der Wert steht auf dem Kabel. Ein Knopf **Strom** neben Normal / Temperatur / Feuchte / CO₂ schaltet die Kabel ein und aus (er erscheint nur, wenn das Haus so ein Gerät hat).
- **Import / Export**: Geräte können eine `id` und `feeds` (die `id` eines anderen Geräts) tragen, so überstehen Kabel das Hin und Zurück; Küchenzeilen (`legs`, `upper`, `depth`) gehören jetzt zum Format. Im Schema beschrieben.

## [3.34.0] - 2026-10-05
### Neu
- **Strom-Add-on, erster Schritt (#136)**: neue Geräte *Wechselrichter*, *Stromzähler* und *Solarpanel* (Kategorie Smart), jedes mit einem 3D-Modell, mit Home-Assistant-Entitäten verbindbar und in 2D und 3D wie alle anderen Geräte nutzbar. Animierte Kabel, Wattwerte und der Ein-/Aus-Schalter unten folgen in einem späteren Schritt.

## [3.33.0] - 2026-10-05
### Verbessert
- **Türen und Fenster in sehr kurzen Wandstücken (#142)**: Eine Öffnung, die breiter ist als das Wandstück, wird nicht mehr abgelehnt, sondern schrumpft auf die Breite, die übrig ist (mindestens 10 cm; vorher 30 cm). Die Breite lässt sich für Schlitzfenster und schmale Türen bis auf 10 cm einstellen.

## [3.32.0] - 2026-10-05
### Neu
- **Küchenzeile (#124)**: neues Gerät *Küchenzeile*, gebaut aus Modulen (Unterschrank, Schubladen, Spüle, Herd, Spülmaschine, Kühlschrank, Hochschrank, Lücke). Form gerade, L oder U (bis zu 3 Schenkel, je 16 Module), Tiefe und freiwillige Oberschränke; Module lassen sich in den Eigenschaften hinzufügen, verschieben und entfernen. In 3D als Schränke gezeichnet und im 2D-Editor als Modul-Kästen.

## [3.31.0] - 2026-10-05
### Neu
- **Mehrere verschiedene Dächer je Haus (#125)**: Neben dem Hauptdach kann die Dach-Etage **weitere Dächer** haben (bis zu 8), jedes mit eigener Form (Sattel / Walm / Flach), Neigung, Überstand, Grundfläche (links, oben, Breite, Tiefe) und der **Etage, auf der es sitzt**, z. B. ein Flachdach über einem Anbau mit nur einem Stockwerk. Neuer Abschnitt *Weitere Dächer* im Feld der Dach-Etage mit einer Karte je Dach, einem Knopf *+ Weiteres Dach* und einem Kreuz zum Entfernen.
- **Import / Export**: `building.roof.parts` (Liste von Dächern mit einer `box`, freiwillig `name`, `type`, `pitch`, `overhang`, `dormers` und `level` = Index einer Etage in `building.floors`); der Export schreibt es wieder, so übersteht ein Haus das Hin und Zurück. Im Schema beschrieben.

## [3.30.0] - 2026-10-05
### Neu
- **Heizungs-Feld (#134)**: Im Live-Modus öffnet ein Klick auf einen Raum ein **zweites Feld neben dem Raum-Feld** mit den Thermostaten (`climate.*`) dieses Raums: die Raumtemperatur, die Solltemperatur mit **− / +** (Klicks hintereinander werden ein Aufruf, die Grenzen und der Schritt kommen vom Thermostat) und die **Modi**, die es anbietet (aus, heizen, auto …). Licht und Heizung sind auf einmal im Blick. Am Handy sitzt das Feld oben.
- **Zeichen, dass die Heizung läuft**: ein Schild *🔥 heizt* im Feld, und der **Heizkörper glüht** in 3D, solange die `hvac_action` des Thermostats heizt (kühlen zeigt *❄*). Vorher galt ein Thermostat im Zustand `heat` als „an“, auch wenn es ruhte.
- Die Thermostate stehen nicht mehr in der Liste des Raum-Felds.
- Backend: Die Dienste `climate.set_temperature` (4 bis 40 °C) und `climate.set_hvac_mode` (nur die bekannten Modi) sind erlaubt; der Live-Kanal trägt `hvac_action`, den Sollwert, seine Grenzen und die Modi eines Thermostats.

## [3.29.0] - 2026-10-05
### Neu
- **Kompass** in der 3D-Ansicht (unten links): Die Rose dreht sich mit der Kamera (Norden ist im 2D-Plan oben) und sagt, von welcher Seite des Hauses man schaut, z. B. *Blick von S* (7 Sprachen).
- **Live-Modus, Fingerflächen (#130)**: Lampen und andere Dinge bekommen eine größere unsichtbare Trefferfläche (mindestens 60 cm), die nur der Live-Modus nutzt.
### Verbessert
- **Live-Modus (#130)**: Nur Dinge, die mit etwas verbunden sind (eine Entität, ein TV-Hintergrundlicht, ein LED-Ring mit Lichtern), lassen sich antippen. Möbel ohne Verbindung nehmen der Lampe dahinter nicht mehr den Tipp weg. **Türen und Fenster haben im Live-Modus keine Trefferfläche** mehr (im Bearbeiten-Modus lässt sich weiter alles antippen).
### Repariert
- **Dach bearbeiten**: Mit *Durchsichtig* an waren das Dach (und seine Gauben) beim Bearbeiten der Dach-Etage fast unsichtbar. Solange die Dach-Etage offen ist, bleibt das Dach jetzt deutlich sichtbar (mindestens 85 %), auch von nahem.
- **Eine Wand, die nie durchsichtig wurde (oder nie absank)**, im Erdgeschoss: Die Mitte des Hauses, die entscheidet, welche Wände zur Kamera zeigen, wurde aus allem auf der Etage genommen, so zog ein Garten (Bäume, Zaun, Rasen) weit im Süden sie weg, und die Südwand galt als Innenwand. Jetzt ist es die Mitte der Wände.

## [3.28.1] - 2026-10-05
### Verbessert
- **Durchsichtig** ist jetzt ein Knopf im Menü *Ansicht* (neben *Auto* und *Halbschnitt*), nicht nur ein Kästchen in ⚙.
- **Durchsichtig und Auto schließen einander aus** (beide im Ansicht-Menü und in ⚙): Eins einzuschalten, schaltet das andere aus.
- Mit *Durchsichtig* an ist auch das **Dach** aus jeder Entfernung durchsichtig (30 %), so verdeckt es nichts dahinter. Vorher war es ab etwa 7 m ganz fest.

## [3.28.0] - 2026-10-05
### Neu
- **Durchsichtige Wände** (Option in ⚙: *Wände zur Kamera hin durchsichtig machen statt absenken*): Die Wände zwischen Kamera und Raum verblassen auf 30 %, statt abzusinken, so sieht man alles im Raum (#129).
- **Zweiter Tipp verlässt den Raum**: Im Live-Modus geht ein zweiter Tipp in den Raum, in dem man ist, zur Ansicht davor zurück, z. B. zur Etage oder zum ganzen Haus mit derselben Kamera (#128).
### Verbessert
- **Ansicht-Menü unten**: Der Knopf *Ansicht* sitzt jetzt in der unteren Leiste neben Normal / Temperatur / Feuchte / CO₂, und sein Menü öffnet sich nach oben (#132).
- **Halbschnitt** nimmt auch weg, was über dem Schnitt hängt (Deckenlampen, LED-Ringe, Bilder hoch an einer Wand), so schwebt nichts über den geschnittenen Wänden in der Luft (#131).

## [3.27.1] - 2026-10-05
### Verbessert
- **Backup-Feld im Seitenfeld**: Die Beschriftungen der drei Zahlenfelder stehen jetzt über den Feldern, statt in einer schmalen Spalte über fünf Zeilen umzubrechen.
- Die Protokollzeile beim Start des Add-ons ist auf Englisch (`Starting 3D Floorplan on port 8099 ...`).
- **CI**: Die Browser-End-to-End-Tests (253 Prüfungen) laufen jetzt bei jedem Push und Pull Request als Job `e2e`.

## [3.27.0] - 2026-10-05
### Neu
- **Hinweis auf eine neue Version**: Im Bearbeiten-Modus fragt die Versions-Pille einmal beim Start und dann alle 5 Minuten bei GitHub nach. Hat `main` eine neuere Version, wird sie blau: **⬆ Neue Version verfügbar · v…**. Geholt wird nur das öffentliche `manifest.json`. Lässt sich in ⚙ ausschalten (`updateCheck`, normal an). Vorher lief der Vergleich nur, wenn der Knopf im Versions-Fenster gedrückt wurde (#140).
### Repariert
- **Versions-Fenster über einfaches `http`**: Es sagte „Browser: Prüfung hier nicht möglich (kein sicherer Kontext)“. Die Prüfsummen werden jetzt mit einem eingebauten SHA-256 berechnet, wenn die eigene Funktion des Browsers nicht da ist, so geht die Browser-Prüfung auch dort (#144).
### Verbessert
- `SECURITY.md` nennt die einzige Anfrage nach außen (die Versionsprüfung) und sagt, dass Backups nicht verschlüsselt sind.

## [3.26.1] - 2026-10-05
### Repariert
- **Auseinandergezogene Ansicht**: Mit Keller wurden nur das Obergeschoss und das Dach angehoben, das Erdgeschoss blieb auf dem Keller. Jetzt bekommt jede Etage ihre Lücke, die unterste bleibt an ihrem Platz (#146).

## [3.26.0] - 2026-10-03
### Neu
- **Willkommenskarte bei einem leeren Haus** mit drei Wegen zum Anfangen: *Wände zeichnen*, *Beispielhaus ausprobieren*, *Haus aus JSON importieren*. Wird im Bearbeiten-Modus gezeigt, bis das Haus Inhalt hat oder die Karte geschlossen wird
### Verbessert
- **Erster Start**: Eine neue Installation folgt der **Sprache des Browsers** (*Auto*, vorher Deutsch) und startet im **dunklen Design** (vorher *Hologramm*). Bestehende Einstellungen werden nicht angerührt. Die Standardnamen „Erdgeschoss“ und „Haus“ eines ganz neuen Hauses zeigen sich in der Sprache des Benutzers
- **Eintrag im Add-on-Store**: Symbol und Logo (`icon.png`, `logo.png`, gezeichnet von `tools/make_addon_icons.py`), Beschriftungen und Beschreibungen für die Optionen auf der Konfigurationsseite (Englisch und Deutsch, `translations/`), englische Beschreibung des Add-ons

## [3.25.1] - 2026-10-03
### Repariert
- **Ein Doppelklick auf eine Wand** tat nichts, wo die großzügige Reichweite einer Tür oder eines Fensters (auch einer an der Nachbarwand) oder eines Geräts über der Wand lag. Jetzt gewinnt nur die echte Tür, das echte Fenster oder Gerät; daneben wird die Wand geteilt

## [3.25.0] - 2026-10-03
### Neu
- **Version und Prüfsumme in der oberen Leiste**: eine Pille mit der Version und einer kurzen Prüfsumme (`✓ v3.26.0 · a1b2c3d`), grün, wenn die Dateien des Add-ons und die Dateien, die der Browser geladen hat, beide zum eingecheckten Manifest passen (`manifest.json`, geschrieben von `tools/make_manifest.py`, von den Tests geprüft). Das Fenster dahinter listet die Prüfungen auf und kann mit dem Manifest auf GitHub (`main`) vergleichen: gleicher Stand, neuere Version verfügbar oder anders. *Neu laden (Cache leeren)*, wenn der Browser alte Dateien zeigt
### Verbessert
- Doppelklick auf eine Wand: Die Ecke darf jetzt 10 cm vom Ende der Wand liegen (vorher 20 cm)

## [3.24.1] - 2026-10-03
### Repariert
- **Doppelklick auf eine Wand** ist nachsichtiger: Ein paar Pixel neben der Linie zählen als Wand (auch in der Ansicht 2D + 3D, wo der Plan klein ist), auch wenn ein Raum unter dem Zeiger liegt. Wo keine Ecke passt (zu nah am Ende der Wand, auf einer Tür oder einem Fenster), sagt die Statuszeile das, statt nichts zu tun. Der Hinweis zum Auswählen erwähnt es

## [3.24.0] - 2026-10-03
### Neu
- **Automatische Backups**: *Häuser & Backup → Automatisches Backup*. Einschalten, den Abstand einstellen (Stunden, 24 = täglich), wie viele Tage und wie viele automatische Backups behalten werden; alte werden von selbst gelöscht (das neueste automatische bleibt, von Hand gemachte werden nie gelöscht). Gespeichert im Konfigurationsordner des Add-ons (`addon_configs/…_floorplan3d/backups`), so überstehen sie Updates und Neuinstallationen. **Jetzt sichern**, **Prüfen** (liest ein Backup, wie es ein Zurückspielen tun würde, ändert nichts), **Zurückspielen**, Herunterladen und Löschen aus der Liste. Der Zeitplan läuft im Add-on
- **Ein gesetztes Gerät bleibt ausgewählt**: Nach dem Setzen eines Geräts lässt es sich sofort verschieben (ziehen, Pfeiltasten, Seitenfeld); der nächste Klick ins Leere hebt die Auswahl auf, und das Setzen geht mit derselben Geräteart weiter. Lässt sich in ⚙ ausschalten (*Neu gesetztes Gerät ausgewählt lassen*)
- **Ein Doppelklick auf eine Wand fügt eine Ecke hinzu** im 2D-Plan: Die Wand wird zu zwei Wänden (Türen und Fenster bleiben bei ihrem Stück, Räume entlang der Wand bekommen die Ecke auch, Strg+Z nimmt es zurück)
### Verbessert
- Die Öffnungs-Palette (*Tür/Fenster*) ist gruppiert: **Türen**, **Durchgänge und Tore**, **Fenster**
### Repariert
- **Einstellungen wurden mit Standardwerten überschrieben**, wenn etwas die Einstellungen speicherte, bevor das ⚙-Fenster geöffnet worden war (zum Beispiel der Schalter *Auto* im Menü *Ansicht*): Das Einstellungs-Formular wird jetzt gefüllt, sobald die Einstellungen geladen sind

## [3.23.0] - 2026-10-03
### Neu
- **Anpassbare Werkzeugleiste**: Der Knopf **✎** öffnet *Werkzeuge anpassen*: jedes Werkzeug zeigen oder verstecken, die Reihenfolge ändern und selten benutzte Werkzeuge in ein Menü **Mehr ▾** einklappen. Je Browser gespeichert. Neue Knöpfe **Gauben** (öffnet den Gauben-Abschnitt der Dach-Etage, legt bei Bedarf eine Dach-Etage an) und **Haus importieren** (normal in *Mehr* eingeklappt)
- **Benutzer & Tablets**: Die Raumliste ist nach Haus gruppiert, und jeder Raum zeigt seine Etage (*Wohnzimmer · Erdgeschoss*), so sieht man, wo ein Raum ist, auch über mehrere Häuser

## [3.22.0] - 2026-10-02
### Neu
- **Dachgröße von Hand**: Im Feld der Dach-Etage lässt *Größe von Hand setzen* links, oben, Breite und Tiefe des Dachs (vor dem Überstand) einstellen, zum Beispiel um eine angebaute Garage auszulassen. Auch im JSON-Import als `roof.box` (`x0`, `x1`, `z0`, `z1`)
### Verbessert
- Das Demo-Haus hat jetzt zwei Dachgauben, so lassen sie sich ohne das Add-on ausprobieren
### Repariert
- **Boden**: Das Erdreich wird jetzt nur dort ausgeschnitten, wo ein Keller ist. Teile des Erdgeschosses ohne Keller (z. B. eine angebaute Garage) bekamen bisher einen Hohlraum bis zur Kellertiefe (#93)
- **Pfeiltasten wechseln die Etage** (#98): Ist nichts ausgewählt, gehen Pfeil hoch / runter zur Etage darüber / darunter (mit einer Auswahl verschieben sie diese weiter)
- **Ansicht-Menü**: Der Schalter *Etagen im Plan* ist in der reinen 3D-Ansicht versteckt, wo es keinen Plan gibt (#99)
- **Benutzer & Tablets**: *Datei erstellen / speichern* (und die erste Änderung im Fenster) schalten das Design nicht mehr auf *Hologramm* (#100). Das Einstellungs-Formular wurde nur gefüllt, wenn das ⚙-Fenster vorher geöffnet worden war, darum schrieb das Speichern seine Standardwerte zurück

## [3.21.0] - 2026-10-02
### Neu
- **Dachgauben**: Im Feld der Dach-Etage gibt es einen neuen Abschnitt *Gauben* mit **+ Gaube**. Jede Gaube steht in 3D aus einer Dachseite heraus, mit eigenem kleinem Dach, einer Vorderwand und einem Fenster. Je Gaube: *Dachseite* (A / B), *Position entlang des Firsts* (Regler), *Breite*, *Wandhöhe*, *Abstand zur Traufe*, *Gaubendach* (Sattel oder flach) und *Fenster* an/aus. Die Werte sind begrenzt, damit eine Gaube immer unter den First passt (ein Hinweis zeigt sich, wenn sie nicht passt). Ein flaches Hauptdach hat keine Gauben
- **Gauben über die API**: Der JSON-Import (`POST /api/import`, `building.roof.dormers`, auch in einer Etage der Art `roof`) und der Export (`GET /api/export/property`) kennen Gauben; das Schema `property.schema.json`, die Anleitungen `docs/IMPORT.md` / `docs/IMPORT.en.md` und das Beispiel `house.json` beschreiben sie. Ungültige Werte werden mit einer Warnung durch Standardwerte ersetzt (höchstens 20 Gauben; ein Flachdach übergeht sie). `PUT /api/layout` speichert sie als `floors[].roof.dormers`
- Unit-Tests für die Geometrie der Gauben (`tests/dormer.test.mjs`, auch in der CI) und Browser-Prüfungen

## [3.20.1] - 2026-10-02
### Neu
- **Benutzer & Tablets: Knopf „Datei erstellen / speichern“**: schreibt `users.json` sofort in den Home-Assistant-Ordner (und legt sie an, wenn sie noch nicht da ist). Vorher erschien die Datei erst nach dem nächsten Speichern, und *Synchronisieren* sagte dann „nicht gefunden“; diese Meldung erklärt jetzt, was zu drücken ist
- Nach einem Update von einer älteren Version legt das Add-on `users.json` beim Start selbst an, wenn schon Benutzer oder Tablets gespeichert sind (es überschreibt nie eine bestehende Datei)
### Verbessert
- README-Bilder (3D, 2D, 2D + 3D, ganzes Haus, Raum, Licht, LED-Ring, Boden, Geräte-Bibliothek, Import, das Rundgang-GIF) neu aus der aktuellen Demo aufgenommen: Sie zeigen die Etagen-Leiste, das Menü *Ansicht* und das Etagen-Kästchen im Plan

## [3.20.0] - 2026-10-02
### Neu
- **Benutzer & Tablets als eigener Reiter in der oberen Leiste**: Die Verwaltung von Benutzern, Räumen und Ansichten ist nicht mehr im Zahnrad (⚙) versteckt; Administratoren sehen jetzt oben einen Knopf **Benutzer** (für alle anderen und in der Nur-ansehen-Ansicht versteckt)
- **Benutzer & Tablets überstehen Updates und Neuinstallationen**: Jede Änderung wird auch in die Datei `users.json` im Add-on-Konfigurationsordner von Home Assistant geschrieben (`addon_configs` → `…floorplan3d`), wo sie sich auch von Hand bearbeiten lässt. Der neue Knopf **↻ Synchronisieren** im Benutzer-Fenster liest diese Datei zurück; eine Zeile darunter sagt, ob Datei und Add-on übereinstimmen. Nach einer frischen Installation werden die Benutzer und Tablets von selbst aus der Datei übernommen
- Neue Schnittstellen-Endpunkte `GET /api/users-file` und `POST /api/users-file/sync` (nur Bearbeiter; `{"direction": "save"}` schreibt die Datei aus dem Add-on)
### Verbessert
- Die Seite hat ihr eigenes eingebettetes Favicon, so fragt der Browser nicht mehr nach `/favicon.ico` (ein harmloser 404 in der Konsole)
- Testprotokoll `docs/TESTPROTOKOLL.md`: was getestet wurde, wann und von wem

## [3.19.1] - 2026-10-02
### Verbessert
- **Etagen im Plan: Schalter und Legende in der Ecke des Plans**: Die Farblegende war unten rechts im Plan, und die Knöpfe *Normal / Temp. / Feuchte* verdeckten sie, und der Schalter war nur im Menü *Ansicht*. Beides ist jetzt ein kleines Kästchen oben rechts im Plan (nur solange der Plan gezeigt wird): ein Knopf *Etagen im Plan: darunter*, der *aus / darunter / alle* umschaltet, und darunter eine Zeile je Etagen-Umriss mit seiner Farbe. Der Schalter bleibt auch im Menü *Ansicht*

## [3.19.0] - 2026-10-02
### Neu
- **Andere Etagen im 2D-Plan**: Der Plan (2D und 2D + 3D) zeigt die anderen Etagen als Umrisse, jede in ihrer eigenen Farbe, mit einer kleinen Legende unten rechts, so lassen sich Wände und Räume genau über die Etagen darunter setzen (z. B. das Erdgeschoss, während man das Dachgeschoss zeichnet). *Ansicht ▾* → *Etagen im Plan* schaltet zwischen *aus*, *darunter* (alle tieferen Etagen, der Normalfall) und *alle* (jede andere Etage) um; die Wahl wird gemerkt. Vorher zeigte sich nur die Etage direkt darunter, blass

## [3.18.0] - 2026-10-02
### Neu
- **Garagentor** (#86): neue Öffnung *Garagentor* (Sektionaltor). Mit einer Cover-Entität (z. B. `cover.garagentor`) oder einem Kontaktsensor zeigt es offen und zu: Die Lamellen rollen unter den Sturz hoch, und ein Tipp im Live-Modus bietet *Öffnen / Schließen / Stopp* an. Ein Tor, das unterwegs ist (`opening` / `closing`), zählt als offen
- **Türen, Tore und Fenster gruppiert** (#86): Im Raum-Feld und in der Liste hinter dem Knopf *offen* stehen die Öffnungen unter eigenen Überschriften *Türen*, *Tore* und *Fenster*; ein Tor oder eine rollladenartige Öffnung mit Cover-Entität lässt sich direkt aus dem Raum-Feld fahren. Eine Tür am Rand eines Raums wird in der Liste jetzt diesem Raum zugeordnet
- **Dachterrasse** (#87): Ein Raum lässt sich als *Dachterrasse (offen, mit Geländer)* markieren. Er bekommt einen Holzboden und ein Geländer an jedem Rand ohne Wand; das Dach des Hauses lässt ihn aus, und was darunter liegt (eine Garage)
- **Demo**: eine Garage mit Garagentor und dem Auto unter einer Dachterrasse mit einer Tür vom Gästezimmer, Tisch und Pflanzen (auch importierbar: `doorGarage`, `"terrace": true`)

## [3.17.1] - 2026-10-02
### Repariert
- **Der Sichtkegel der Kamera blieb zurück**: Wenn man eine Kamera verschob, blieb ihr Kegel auf dem Boden, wo er war. Jetzt wandert der Kegel mit der Kamera mit

## [3.17.0] - 2026-10-02
### Verbessert
- **Bewegung in der Kamera-Ausklappliste**: Der Knopf *📷* nennt jetzt den Raum, in dem Bewegung erkannt wurde (*Bewegung erkannt: Wohnzimmer* oder *Bewegung in 2 Räumen*), und wird rot. Seine Ausklappliste gruppiert alles nach Raum, mit der Etage neben dem Raumnamen, damit gleiche Raumnamen auf zwei Etagen nicht verwechselt werden; Räume mit Bewegung kommen zuerst mit einer roten Marke *Bewegung erkannt*. Neben den Kameras listet die Ausklappliste jetzt auch die im Plan gesetzten Bewegungs- und Anwesenheitssensoren auf (🔔), so zeigt sich auch ein Raum mit Bewegungsmelder, aber ohne Kamera

## [3.16.0] - 2026-10-02
### Verbessert
- **Räume als Ausklappliste**: Die Reihe der Raum-Knöpfe oben ist jetzt ein Knopf *Zimmer ▾*. Er listet alle Räume auf (in der Ansicht des ganzen Hauses nach Etage gruppiert, oberste Etage zuerst), zeigt einen grünen Punkt, solange jemand in einem Raum ist, und der Knopf trägt den Namen des Raums, in dem man ist. Kein Scrollen einer langen Reihe mehr am Tablet
- **Kameras: direkt zu Home Assistant**: Jede Kamera in der Übersicht hat einen deutlichen Knopf *In Home Assistant öffnen* (Live-Ansicht, Verlauf, Einstellungen der Kamera-Entität); ein Tipp auf das Bild tut dasselbe. Außerhalb von Home Assistant (Demo-Datei) sagt es, warum es nicht öffnen kann

## [3.15.0] - 2026-10-02
### Neu
- **Kameras auf einen Blick**: Ein neuer Knopf *📷 n* in der oberen Leiste (nur, wenn der Plan Kameras hat) öffnet eine Übersicht als Ausklappliste mit dem Standbild jeder Kamera, ihrer Etage und ihrem Raum und einer roten Marke *Bewegung erkannt*; der Knopf selbst wird rot und sagt *n Bewegung*, solange ein Bewegungsmelder Bewegung meldet. *Im Plan zeigen* springt zur Kamera, ein Tipp auf das Bild öffnet die Live-Ansicht von Home Assistant

### Verbessert
- **Ansicht-Menü**: *Auto*, *Halbschnitt*, *Auseinander* und die Wandhöhe sind in eine Ausklappliste *Ansicht ▾* oben umgezogen. Die Knöpfe, die Aufmerksamkeit brauchen, bleiben draußen: *offline*, *offen* und die Kameras

## [3.14.0] - 2026-10-02
### Neu
- **Mitgelieferte 3D-Modell-Bibliothek**: 120 kostenlose Modelle (Kenney Furniture Kit, CC0: Möbel, Küche, Bad, Pflanzen, Lampen, Haushaltsgeräte) kommen mit dem Add-on und zeigen sich in der Modellliste des Geräte-Werkzeugs, auch das Suchfeld filtert sie. Sie lassen sich nicht löschen; ein eigener Upload mit demselben Namen geht vor. Quellen und Lizenz in `library/CREDITS.md` (#79)
- **Räume erkennen** (#17): Der neue Knopf *Räume erkennen* neben dem Raum-Werkzeug legt für jede geschlossene Schleife aus Wänden auf der Etage einen Raum an (Wände, die sich treffen, kreuzen oder auf einer anderen Wand enden, zählen; Sackgassen nicht). Schon vorhandene Räume bleiben in Ruhe, so lässt es sich nach dem Zeichnen weiterer Wände wieder benutzen; ein Rückgängig-Schritt nimmt es zurück
- **Kameras mit Sichtfeld** (#69): Eine Kamera zeigt ihr Sichtfeld als Kegel auf dem Boden (Geräte-Feld: *Sichtwinkel*, *Reichweite*; Winkel 0 = kein Kegel). Einen Bewegungsmelder wählen, und der Kegel wird rot und pulsiert, solange er Bewegung meldet. Im Live-Modus zeigt ein Tipp auf die Kamera oder ihren Kegel ein Standbild, das alle 5 Sekunden erneuert wird; der ⓘ-Knopf (oder ein Tipp auf das Bild) öffnet die Live-Ansicht von Home Assistant. Der Kegel wird auch im 2D-Plan gezeichnet
- **Raum-Feld nach Art** (#67): Lichter (mit *Alle aus*), Abdeckungen, Heizung, Medien, Schalter, Kameras (mit dem Standbild), Sensoren, Szenen & Skripte. Schalter sind Schiebeschalter wie am Handy statt *Umschalten*-Knöpfen. An hochkant gehaltenen Handys und Tablets kommt das Feld von unten herauf
- Die Standbilder der Kameras lassen sich in ⚙ ausschalten (*Kamera-Standbilder zeigen*): Jeder, der das Feld öffnen darf, sieht diese Bilder, darum ist das ein Schalter für die Privatsphäre. Das Add-on holt nur jpeg / png / gif / webp von `camera.*`-Entitäten
- **Demo**: zwei Kameras (eine mit Bewegung), eine Szene und ein Skript, so lassen sich diese Sachen ohne Home Assistant ausprobieren

### Repariert
- **Grüner Umriss des Grundstücks im Live-Modus**: Der Umriss des Grundstücks (eine Zeichenhilfe) zeigt sich jetzt nur noch im Bearbeiten-Modus

## [3.13.0] - 2026-10-02
### Neu
- **Liste offener Fenster und Türen**: oben auf den Knopf *n offen* tippen, und eine Liste zeigt, welche Fenster und Türen offen sind, mit Etage und Raum; ein Tipp auf einen Eintrag springt im Plan dorthin
- **Die Anwesenheits-Figur verstecken**: Ein Anwesenheits-/Personen-Gerät hat jetzt das Kästchen *Figur im Live-Modus unsichtbar*. Die Figur wird nicht im Raum gezeichnet, aber der Punkt am Raum-Knopf oben zeigt weiter, wo jemand ist

### Entfernt
- **Gruppen** (Werkzeug *Gruppe*): Es funktionierte nicht zuverlässig und wurde nicht benutzt. Das Werkzeug, sein Feld und die Gruppen-Knöpfe im Geräte-Feld sind weg; vorher gruppierte Geräte verhalten sich jetzt einfach wie einzelne Geräte

### Repariert
- **Werte-Schilder, die einander verdecken** (z. B. zwei Lampen an einer Stelle): Schilder, die sich auf dem Bildschirm überlappen würden, werden jetzt untereinander gestapelt
- **Etagen-Karten in der Ansicht 2D + 3D** erschienen über dem 2D-Plan. Jetzt bleiben sie in der 3D-Ansicht (und sind in der reinen 2D-Ansicht versteckt); wo neben dem Haus kein Platz ist, werden sie schmaler, ein Wert je Zeile

## [3.12.0] - 2026-10-02
### Neu
- **Das Haus auseinanderziehen** (#65): In der Ansicht des ganzen Hauses zieht der neue Knopf *Auseinander* die Etagen über dem Boden auseinander, so kann man in jede hineinschauen; ein zweiter Tipp stapelt sie wieder
- **Etagen unter der offenen Etage** (#65), in ⚙: *abgedunkelt* (wie bisher, durchsichtig), *gestapelt* (deutlich sichtbar) oder *versteckt*
- **Werte-Schilder** (#66): gut lesbare Schilder mit einem Zeichen direkt am Gerät, z. B. „🌡 21.4 °C“, „⚡ 95 W“, „↕ 70 %“ (Rollladen), „💡 80 %“ (Licht), die laufende App auf einem Fernseher. ⚙ → *Werte-Schilder an Geräten*: *Wichtige* (Messwerte, Klima, Rollläden; wie bisher), *Alle Geräte* oder *Keine* (ersetzt das alte An/Aus-Kästchen)
- **CO₂-Färbung** (#70): Ein dritter Knopf *CO₂* neben *Temp.* und *Feuchte* färbt die Räume nach dem CO₂-Sensor des Raums (400 – 2000 ppm, Farben in ⚙ einstellbar). Eine Farbskala am linken Rand (neben der Etagen-Leiste) zeigt jede Farbstufe mit ihrem Wert, für Temperatur, Feuchte und CO₂
- In der Ansicht des ganzen Hauses listen die Raum-Knöpfe oben die Räume **aller** Etagen auf (oberste Etage zuerst); ein Tipp öffnet diese Etage und den Raum
- **Demo** (`demo/floorplan3d-demo.html`) zeigt jetzt auch eine Treppe mit ihrem Treppenhaus, eine Bodenöffnung im Dachgeschoss, das Dach als oberste Etage, CO₂-Sensoren, einen Fernseher mit seiner App und einen Rollladen mit seiner Stellung, so lassen sich alle neuen Sachen ohne Home Assistant ausprobieren

## [3.11.0] - 2026-10-02
### Neu
- **Etagen-Leiste** (#63): Auf breiten Bildschirmen sind die Etagen jetzt eine Spalte kleiner Bilder am linken Rand (oberste Etage zuerst, mit einem Knopf *Ganzes Haus* oben) statt der Etagen-Pillen. Ein Tipp wechselt die Etage; die Bilder werden aus dem Plan selbst in den Farben deines Designs gezeichnet (Raumfarben, Wände, Türen, Fenster, Dach; Neonlinien im Hologramm-Design) und folgen deinen Änderungen. Schmale Bildschirme und Wandtablets behalten die Pillen
- **Etagen-Karten** (#64): In der Ansicht des ganzen Hauses schwebt neben jeder Etage eine kleine Karte mit ihren Räumen, Lichtern an und offenen Fenstern; ein Tipp öffnet diese Etage
- **Halbschnitt**: neuer Knopf *Halbschnitt* neben *Auto*. Jede Wand wird auf halber Höhe geschnitten, und nur die untere Hälfte bleibt, so kann man von jeder Seite in alle Räume schauen; Türen und Fenster werden sauber abgeschnitten
- **Pfeiltasten** (#71): verschieben die Auswahl um einen Rasterschritt; Umschalt = 10 cm, Alt = 1 cm. Eine Tür oder ein Fenster gleitet an seiner Wand entlang
- **Öffnung ohne Rahmen** (#71): neu *Öffnung (ohne Rahmen)* in der Palette der Türen und Fenster, ein bloßes Loch in der Wand (auch als `doorGap` / Stil `gap` im JSON-Import)

### Repariert
- **Keller von einer grünen Schicht bedeckt**: Mit gezeichnetem Grundstück lag die Rasenfläche auf Bodenhöhe über dem Keller, wenn man ihn öffnete. Dort wird sie nicht mehr gezeichnet
- **Treppen lassen sich kürzer machen**: Eine gerade Treppe konnte nicht kürzer als 2,88 m sein, weil eine Stufe mindestens 18 cm tief sein musste. Stufen dürfen jetzt 10 cm tief sein, so kann eine Treppe nur 1,6 m kurz sein (bei einer 3 m hohen Etage)

Ideen für die Etagen-Leiste, die Karten und die Pfeiltasten von [NeonPlan 3D](https://github.com/Mastershort/neonplan3d) (MIT). Eine Höhe je Wand gab es schon (eine Wand auswählen, Feld *Höhe*).

## [3.10.0] - 2026-10-01
### Neu
- **Bodenöffnung**: neues Werkzeug im Bearbeiten-Modus. Eine Öffnung in den Boden einer Etage im 2D-Plan zeichnen (Treppenloch, Galerie, Luftraum); der Boden ist dort offen, und ein Platzhalter-Block darunter wird auch ausgeschnitten. Auswählen, um ihre Ecken zu ziehen, Entf entfernt sie
- **Warnungen** (#58): Rauch-, Gas-, Kohlenmonoxid- und Wassersensoren, eine ausgelöste Alarmanlage und ein Fenster, das offen ist, während es regnet (aus der Wetter-Entität), zeigen oben ein rotes Banner, und der Raum blinkt rot; ein Tipp springt in den Raum. Braucht keine Einrichtung. ⚙ kann sie ausschalten, von selbst zu einer neuen Warnung springen lassen und die Wetter-Entität wählen
- **Suche „Wo ist …?“** (#62): Der Knopf 🔍 unten links findet Geräte, Fenster und Räume auf jeder Etage nach ihrem Namen; die Kamera geht dorthin, und ein Ring markiert das Gerät
- **Wandtablet-Kiosk** (#61), in ⚙ → *Wandtablet: Warnungen und Kiosk*: nach einigen Minuten ohne Berührung zurück zur Startansicht, das Haus dreht sich dann langsam als Bildschirmschoner, und nachts wird die Ansicht abgedunkelt (nach der Sonne oder nach der Uhr); die erste Berührung weckt nur den Bildschirm

Ideen für Warnungen, Suche und Kiosk von [NeonPlan 3D](https://github.com/Mastershort/neonplan3d) (MIT).

## [3.9.5] - 2026-10-01
### Repariert
- **Treppenhaus von einem Platzhalter-Block verschlossen**: Ist die Etage darunter ein Block (eine Etage, die man nicht gezeichnet hat), füllte der Block die Treppenöffnung und verdeckte die Treppe. Das Treppenhaus wird jetzt aus dem Block ausgeschnitten, so schaut man die Treppe hinunter (#55)

### Verbessert
- **Neue Bildschirmfotos und Aufnahmen** im dunklen Design statt im Hologramm-Look: README, Kurzrundgang, Import-Anleitung (deutsch und englisch) und die Import-Aufnahme; die herunterladbare Demo öffnet auch im dunklen Design
- Heizkörper und Warmwasserspeicher ohne Entität werden nicht mehr als *Nicht verknüpft* aufgelistet (sie sind oft nur gezeichnet)

## [3.9.4] - 2026-10-01
### Repariert
- **Treppen von der Etage darüber gesehen**: Die Treppe, die in die gezeigte Etage heraufkommt, wird durch ihre Öffnung fest gezeichnet statt so blass wie der Rest der Etage darunter, so liest sich das Treppenhaus als Öffnung mit einer Treppe darin
- Ein Tipp auf den **Raum, in dem eine Treppe steht** (z. B. das Treppenhaus), versteckt die Treppe nicht mehr

## [3.9.3] - 2026-10-01
### Repariert
- **Raum- und Etagen-Knöpfe wurden mit der Zeit langsam**, besonders auf Tablets: Jeder Neubau der Szene (Antippen eines Raums oder einer Etage) behielt die alte Kopie auf der Grafikkarte (etwa 275 Formen je Tipp im Beispielhaus). Alte Formen und Texturen werden jetzt freigegeben, so bleibt die Ansicht so schnell wie gleich nach dem Laden

## [3.9.2] - 2026-10-01
### Verbessert
- Die Offline-Liste prüft wieder **nur, was im Plan gesetzt ist**: Die Liste ungesetzter, nicht verfügbarer Entitäten aus 3.9.1 ist weg
- Gesetzte **Lampen und smarte Geräte, die nicht** mit einer Home-Assistant-Entität **verbunden** sind, stehen als *Nicht verknüpft* in der Liste (Möbel, Gartenobjekte und Bilder werden ausgelassen)

## [3.9.1] - 2026-10-01
### Verbessert
- Die Offline-Pille wird **immer gezeigt**: grün **✓ 0 offline**, wenn alles im Plan erreichbar ist, sonst rot **⚠ n offline**
- Die Offline-Liste zeigt auch **nicht verfügbare Entitäten, die nicht im Plan gesetzt sind** (ein Tipp öffnet das Fenster von Home Assistant), so bleibt ein Gerät, das man noch nicht gesetzt hat, nicht mehr unbemerkt

## [3.9.0] - 2026-10-01
### Neu
- **Geräte offline**: eine rote Pille **⚠ n offline** über dem Plan, sobald ein gesetztes Gerät nicht verfügbar, unbekannt oder nicht mehr in Home Assistant ist; sie öffnet eine Liste mit Etage, Raum, Entität und seit wann, ein Tipp springt zum Gerät
- ⚙ **Leistung auf diesem Gerät** (*Automatisch*, *Schön*, *Schnell*), je Browser gespeichert, so lässt sich ein Tablet, das nicht erkannt wird, in den schnellen Modus schalten

### Verbessert
- Die Etagen- und Raum-Knöpfe über dem Plan **scrollen seitwärts**, wenn sie nicht hineinpassen (Tablets): ‹ ›-Pfeile an den Enden, Wischen oder Mausrad; Gruppen in der oberen Leiste brechen um, statt aus dem Bildschirm zu laufen
- Schneller auf Tablets: Der Stromsparmodus lässt die Unschärfe und das Leuchten hinter Knöpfen und Feldern weg und ruht bei etwa 2 Bildern pro Sekunde, solange nichts passiert; jede Ansicht wird nach 15 s ohne Aktivität langsamer

### Repariert
- Das **Raster** zeigt sich nie im Live-Modus und liegt auf der Höhe der gezeigten Etage, so verdeckt es nicht mehr den Keller oder ein Haus ohne Erdreich

## [3.8.1] - 2026-10-01
### Repariert
- Das **Raster** stört nicht mehr auf den Etagen (Live und Bearbeiten) und nicht mit durchsichtigem Erdreich: Jeder Boden ersetzt es, es zeigt sich nur, solange ein Zeichen-Werkzeug aktiv ist (#39)
- Ein Garten-Objekt **Rasen, Terrasse oder Weg** liegt nicht mehr wie ein Teppich über den Etagen des Hauses (#40)
- Auf einer Etage (z. B. dem Erdgeschoss) wird der Rasen vor dem Haus **nicht mehr weggeschnitten**; das Erdreich wird nur in der Ansicht des ganzen Hauses aufgeschnitten, wo der Keller gezeigt wird (#41)
- ⚙ *Rasen ums Haus ohne Grundstück* zeigt einen Hinweis, wenn das Haus ein Grundstück hat (der Rasen folgt dann dem Grundstück) (#42)
- **Dach** zu wählen, nimmt das Dach ins Bild statt einer Ecke des Plans (#43)
- **Treppen schneiden eine volle Öffnung** in die Etage darüber, über die ganze Treppe (gerade, L und U), nicht nur über ihren oberen Teil (#44)

## [3.8.0] - 2026-10-01
### Neu
- **Dein Grundstück zeichnen**: neues Werkzeug *Grundstück* im Bearbeiten-Modus. Die Ecken im 2D-Plan anklicken, mit Doppelklick, Enter oder einem Klick auf den ersten Punkt schließen; der Rasen hat dann genau diese Form. *Grundstück löschen* entfernt es wieder
- Neue Einstellung **⚙ → Rasen ums Haus ohne Grundstück (m)**: wie weit der Rasen über das Haus hinausreicht (normal 5 m)

### Repariert
- Der Rasen reicht jetzt auch um **Platzhalter-Blöcke**, nicht nur um Räume (ein aus Blöcken gebautes Haus hatte nur einen winzigen Rasen)
- **Garten-Objekte** (Rasen, Terrasse, Weg, Pool, Bäume …) werden zusammen mit dem Erdreich aufgeschnitten, so verdeckt ein importierter Gartenrasen nicht mehr den Kellerschnitt
- Das **Raster** liegt in den Etagen-Ansichten nicht mehr über dem Rasen; es zeigt sich nur, solange ein Zeichen-Werkzeug aktiv ist

## [3.7.1] - 2026-10-01
### Verbessert
- Der Grundriss **öffnet sich im Erdgeschoss** statt im Keller (auch nach dem Wechseln oder Importieren eines Hauses)
- Das Demo-Haus hat einen **Keller** (Hobbyraum, Hauswirtschaftsraum, Waschküche), ein **Grundstück mit Garten** (Bäume, Terrasse, Hecke, Zaun, Auto) und zeigt das Haus in seinem Boden
- **Neue Bildschirmfotos und Aufnahmen** in der README und der Import-Anleitung: das Haus auf seinem Grundstück, der Keller im Schnitt, der LED-Ring; der Kurzrundgang und die Import-Aufnahme zeigen die neue Bodenansicht

## [3.7.0] - 2026-10-01
### Neu
- **Das Haus steht im Boden**: festes Erdreich mit **Rasen obendrauf** um das Haus, in der Form des Grundstücks, wenn eins gezeichnet ist, sonst eine großzügige Fläche um das Haus. Das Haus selbst wird ausgeschnitten, so reicht der Rasen bis an die Wände
- **Keller im Erdreich, im Schnitt gezeigt**: Mit Keller wird das Erdreich vor der Fassade, die zur Kamera zeigt, weggeschnitten wie in einer Schnittzeichnung. Man sieht die ganze Kellerwand, und die Schnittfläche zeigt Bodenschichten (Mutterboden, Lehm, Ton, Kies). Der Schnitt dreht sich mit der Kamera
- Auch in der normalen Etagen-Ansicht (Erdgeschoss und darüber) steht das Haus auf dem Rasen, statt zu schweben
- Neue Einstellung **⚙ → Boden um das Haus**: *fest, zur Kamera hin aufgeschnitten* (Normalfall), *durchsichtig* (das frühere blasse Aussehen) oder *aus*

### Verbessert
- Mit festem Erdreich wird der Keller in der Ansicht des ganzen Hauses normal gezeichnet (vorher war er immer blass), und das Raster unter dem Rasen ist im Live-Modus und in der Ansicht des ganzen Hauses versteckt (beim Zeichnen bleibt es)
- Ohne Keller wird der Boden nicht geschnitten, der Rasen läuft einfach rund um das Haus

## [3.6.0] - 2026-10-01
### Verbessert
- **Live-Änderungen sofort**: Das Add-on hält eine Websocket-Verbindung zu Home Assistant und schickt jede Zustandsänderung in dem Moment, in dem sie passiert, an alle offenen Ansichten. Ein Wandschalter, eine Automation, die HA-App oder ein Sensor zeigen sich jetzt **innerhalb eines Sekundenbruchteils** statt bis zu 4 Sekunden später
- **Weniger Last für Home Assistant**: Offene Ansichten holen nicht mehr alle 4 Sekunden die ganze Liste aller Entitäten; solange der Live-Kanal steht, gleichen sie sich nur einmal pro Minute ab
- Ist der Live-Kanal nicht da (Home Assistant startet neu, ein Proxy ohne Websockets), fällt die Ansicht von selbst auf Abfragen alle 4 Sekunden zurück und verbindet sich selbst neu
- Die Verbindung zu Home Assistant bleibt nach dem Schließen der letzten Ansicht noch eine Minute offen, so ist ein neu geladenes Wandtablet sofort live

## [3.5.0] - 2026-10-01
### Neu
- **Einen ganzen HA-Bereich automatisch setzen**: Einen Raum auswählen, der mit einem Home-Assistant-Bereich verbunden ist, und in seiner Entitätenliste **✨ Alle … sinnvoll platzieren** drücken. Jede Entität des Bereichs kommt dorthin, wo sie hingehört, in einem Rückgängig-Schritt:
  - Lichter in einem gleichmäßigen Raster unter die Decke, Rauchmelder dazwischen
  - Schalter (und Jalousien, Ventilatoren) neben die Tür
  - Heizung / Thermostat unter ein Fenster
  - Temperatur-, Feuchte-, CO₂- und Lichtsensoren und Kameras an freie Wandstücke
  - Fernseher in die Mitte der längsten freien Wand
  - Bewegungs- / Anwesenheitssensoren und Saugroboter auf den Boden, weg von den Lampen und dem Raumnamen
  - **Tür- und Fensterkontakte werden mit den Türen und Fenstern des Raums verbunden**, die noch keinen Sensor haben
  - Dinge, die keine Gegenstände im Raum sind (Batterie, Signal, Energiesensoren, Szenen, Skripte …), werden übersprungen und bleiben in der Liste zum Setzen von Hand
- Der einzelne Knopf **+ platzieren** einer Entität nutzt dieselben Regeln, statt sie in die Mitte des Raums fallen zu lassen

## [3.4.0] - 2026-10-01
### Neu
- **LED-Ring: freie Abschnitte** — einstellen, **wie viele** Abschnitte das Band hat und **wo jeder anfängt und aufhört** (*Von / Bis* in Metern entlang des Bands, ab der Marke „0 m“ gezählt), so kann eine Wand mehrere Abschnitte und Lücken ohne LEDs haben. *Gleichmäßig verteilen* verteilt beliebig viele Abschnitte gleichmäßig, *Je Wand einer* geht zu einem je Wand zurück, ✂ teilt einen Abschnitt in der Mitte und 🗑 entfernt ihn. Im 2D-Plan lassen sich die weißen Enden jedes Abschnitts **an den Wänden entlang ziehen** (5-cm-Schritte). Ein Abschnitt kann um eine Ecke laufen. Die Lichter der Abschnitte bleiben über ihre Nummer erhalten
- **Details von Home Assistant** (#9): Im Live-Modus hat das Popup eines Geräts (und eines Tür-/Fenstersensors) einen Knopf **ⓘ Details** neben seinem Namen. Er öffnet das eigene Fenster von Home Assistant für die Entität mit **Verlaufsgrafik, Logbuch, allen Attributen und Einstellungen**, direkt über dem Grundriss
- LED-Ring: Jeder Abschnitt hat seinen eigenen Knopf ⓘ Details, die Haupt-Entität des Rings einen neben dem Namen
- Raum-Feld: ein ⓘ-Knopf an jeder Entitäten-Zeile
- Die Knöpfe erscheinen nur, wenn der Grundriss in Home Assistant läuft (Seitenleiste, HA-App, Wandtablet mit der HA-App); als eigene Seite geöffnet gibt es kein HA-Fenster zum Öffnen, darum bleiben sie versteckt

### Verbessert
- Raum-Feld: Lange Entitätennamen bleiben lesbar, die Knöpfe rücken bei wenig Platz in eine zweite Zeile

## [3.3.0] - 2026-10-01
### Neu
- **LED-Ring (indirektes Licht)**: neues Gerät *LED-Ring (indirekt)* in der Licht-Bibliothek. In einen Raum gesetzt, läuft er **rund um den Raum knapp unter der Decke** (Voute / indirekte Beleuchtung), 15 cm von den Wänden. Er ist ein Objekt aus mehreren **Abschnitten** (einer je Wand), und **jeder Abschnitt kann eine eigene Licht-Entität haben**; Abschnitte ohne eine nutzen die Haupt-Entität des Rings
- Jeder Abschnitt leuchtet in 3D und im 2D-Plan in der Farbe seines eigenen Lichts und erhellt den Raum von dort, wo er ist
- Eigenschaften: offener oder geschlossener Ring, Abstand zur Wand, *An Raum anpassen* (behält die Lichter der Abschnitte), eine Entitätenauswahl je Abschnitt mit seiner Länge
- Live-Modus: Ein Tipp auf einen Abschnitt öffnet ihn mit eigenem An/Aus, Helligkeit und Farbe, dazu Knöpfe für alle Abschnitte und Bedienung für den ganzen Ring; ein Doppelklick schaltet den ganzen Ring
- Im 2D-Plan lässt sich nur die Linie selbst anklicken, der Raum darin bleibt auswählbar
- Grundstücks-Import / -Export (JSON) behält den Ring (`pts`, `closed`, `segs`, `inset`)
- Die Demo hat einen LED-Ring mit zwei Lichtern im Schlafzimmer

## [3.2.0] - 2026-10-01
### Neu
- **Anwesenheit**: neues Gerät *Anwesenheit / Person* für `person.*`, `device_tracker.*` und Anwesenheits- / Bewegungssensoren (`binary_sensor.*`). Eine leuchtende Figur steht auf einem Bodenring, solange jemand da ist, und verschwindet im Live-Modus, wenn die Person weg ist; die Raum-Pille bekommt einen grünen Punkt, solange jemand im Raum ist. Entitäten dieser Bereiche werden automatisch als Anwesenheits-Geräte gesetzt
- Die Demo hat zwei Personen und einen Anwesenheitssensor im Büro

## [3.1.1] - 2026-10-01
### Verbessert
- Der Lichtfleck oben rechts im Hologramm-Hintergrund ist **normal aus**. Er lässt sich in ⚙ mit dem neuen Regler *Stärke des Leuchtens* weiter einschalten (neben *Leuchten im Hintergrund* für die Farbe)
- Neue, schärfere Bildschirmfotos, GIFs und Social Preview ohne das Leuchten in der Ecke

## [3.1.0] - 2026-10-01
### Neu
- **Mehrsprachige Oberfläche**: Deutsch, Englisch, **Französisch, Spanisch, Italienisch, Niederländisch und Polnisch**. In ⚙ → Sprache wählen; *Auto* folgt der Sprache des Browsers / von Home Assistant. Fehlende Texte fallen auf Englisch zurück
- Auch der Temperatur-/Feuchte-Schalter unten ist übersetzt
- Tests sorgen dafür, dass jede Sprache genau dieselben Texte und Platzhalter hat, so kann ein neuer Text nie vergessen werden

## [3.0.1] - 2026-10-01
### Verbessert
- Import-Anleitung neu gestaltet: Bildschirmfotos, Tabelle der Vorlagen, Tabelle der Fehler, Hinweiskästen; Import-Abschnitt mit Bildern in der README
- Import: Ein Vieleck, dessen Kanten sich kreuzen, wird jetzt als solches gemeldet (statt „zu klein“); ausgeschaltete Knöpfe sehen ausgeschaltet aus

## [3.0.0] - 2026-10-01
### Neu
- **Ein Grundstück per JSON importieren**: *Häuser → Grundriss importieren (JSON)* baut ein **neues Haus** aus einer Beschreibung von Grundstück, Räumen, Fenstern/Türen und Geräten. Die Wände werden aus den Raum-Vielecken abgeleitet (gemeinsame Kanten werden eine Innenwand, Außenwände sind dicker), Öffnungen rasten an der nächsten Wand ein, Etagen/Keller/Dach werden automatisch geordnet. Erst prüfen, importieren erst nach einer fehlerfreien Prüfung; Fehler nennen den genauen JSON-Pfad
- Beispielwohnung und Beispielhaus im Fenster, ein Datei-Lader und ein Knopf **KI-Prompt kopieren** (der Prompt enthält das ganze Format, alle Gerätearten und Vorlagen)
- **Grundstücksgrenze und Garten-Objekte** (Bäume, Rasen, Terrasse, Pool, Zaun) werden in der 3D-Ansicht und im 2D-Plan gezeichnet
- API: `POST /api/import[?dryRun=1&name=]`, `GET /api/export/property` (ein Haus im selben Format exportieren), `GET /api/import/schema`, `GET /api/import/examples/{flat|house}`; GeoJSON-Vielecke (lat/lon) werden automatisch in Meter umgerechnet
- Anleitung mit Format-Referenz, curl-Beispielen und Tipps für Prompts: `docs/IMPORT.md`

## [2.5.0] - 2026-10-01
### Neu
- **Fernseher mit eingebautem Hintergrundlicht**: Der stehende *TV* und der *Wand-TV* haben ein neues Feld *Hintergrundlicht (LED hinter dem TV)*. Eine Licht-Entität wählen, und hinter dem Bildschirm erscheint ein leuchtender Rahmen; er leuchtet in der Farbe der Entität (Effekte und Szenen gehen wie bei jedem Licht) und erhellt den Raum. Kein zusätzliches Gerät nötig
- Download-Knopf für die Demo oben in der README (immer der neueste Stand); der neue Workflow *Demo* baut sie neu, sobald sich die App ändert, und ersetzt sie im neuesten Release

## [2.4.1] - 2026-10-01
### Neu
- **Herunterladbare Demo**: `demo/floorplan3d-demo.html` liegt im Repository (von GitHub herunterladen, mit Doppelklick öffnen) und hängt an jedem Release. Sie zeigt jetzt die neuen Sachen: Nanoleaf-Layout, TV-Hintergrundlicht, einen unsichtbaren LED-Streifen, Effekte und Szenen

## [2.4.0] - 2026-09-30
### Neu
- **Dächer machen der Kamera Platz**: Ein Dach blendet sanft aus, wenn die Kamera nahe kommt (ab etwa 7 m, bei etwa 2,5 m größtenteils durchsichtig), und kommt beim Herauszoomen zurück
- *Unsichtbar im Live-Modus (Licht bleibt)* wird jetzt für jedes Lichtgerät angeboten (Deckenlampen, Strahler, Wandlampen, Streifen …), nicht nur für LED-Arten

## [2.3.1] - 2026-09-30
### Repariert
- Die Knöpfe *Normal / Temp. / Feuchte* gibt es wieder in jedem Design (sie zeigten sich nur im Hologramm-Design); in den festen Designs nimmt der Boden die Temperatur- / Feuchte-Farbe an

## [2.3.0] - 2026-09-30
### Neu
- **Unsichtbare Lichter**: Kästchen *Unsichtbar im Live-Modus (Licht bleibt)* für LED-Streifen, TV-Hintergrundlichter, Nanoleaf-Panels/-Layouts, Lichtkugeln und jedes Gerät mit Licht-Entität. Das Modell wird im Live-Modus nicht gezeichnet (und lässt sich dort nicht antippen), aber sein Licht scheint weiter in den Raum; im Bearbeiten-Modus bleibt es sichtbar, damit man es noch findet und verschieben kann

## [2.2.0] - 2026-09-30
### Neu
- **TV-Hintergrundlicht (LED)**: neues Gerät in der Kategorie Licht, ein leuchtender Rahmen für hinter einen Wand-TV (indirektes Licht / Ambilight). Auf den Fernseher setzen, mit der Licht-Entität der LED verbinden (Farbe, Helligkeit, Effekte gehen wie bei jedem Licht) und mit den Feldern Breite/Höhe an den Fernseher anpassen

## [2.1.1] - 2026-09-30
### Neu
- Raum-Feld: Jede Lichtzeile hat einen 🎨-Knopf, der Farbe, warm/kalt, Effekte (mit der Effektfarbe) und die Szenen des Lichts aufklappt, so muss man kein kleines Modell mehr in einer vollen 3D-Ansicht treffen

## [2.1.0] - 2026-09-30
### Neu
- **Effektfarben**: Home Assistant meldet von einem Lichteffekt nur den *Namen* (Nanoleaf-Szene, WLED, Hue …), nicht seine Farben, und die eigene Farbe des Lichts ist veraltet/weiß, solange ein Effekt läuft. Ein Licht mit aktivem Effekt zeigt jetzt die Farbe, die diesem Effekt zugeordnet ist (Farbauswahl neben der Effektliste im Live-Popup, für alle gespeichert), oder eine Farbe, die an einem Wort in seinem Namen erkannt wird (*lila, purple, rot, blue, gaming* …)

### Repariert
- Das Update-Fenster in Home Assistant zeigte einen veralteten Changelog (hängengeblieben bei 0.2.0): Das Add-on liefert jetzt das aktuelle `CHANGELOG.md` mit, und ein Test hält beide Kopien gleich

## [2.0.2] - 2026-09-30
### Repariert
- Nanoleaf-Layouts bleiben im Hologramm-Design fest (von der Seite nicht mehr durchsichtig)
- Ihr Raumlicht scheint jetzt von den echten Positionen der Panels, ein Stück von der Wand weg, statt von einem Punkt

## [2.0.1] - 2026-09-30
### Neu
- Nanoleaf-Layout-Editor: **kleines Dreieck** (halbe Größe); es rastet auch an jeder Hälfte der Kante eines großen Dreiecks ein

## [2.0.0] - 2026-09-30
### Neu
- **Nanoleaf-Layout-Editor**: Das neue Gerät *Nanoleaf Layout* öffnet einen Editor mit Einrast-Raster – Dreieck / Sechseck / Quadrat / Leiste wählen, zusammenklicken (Kanten rasten an ihren Nachbarn ein, die Drehung wird von selbst gefunden), Rechtsklick löscht, Rückgängig, mit `R` drehen
- Das ganze Layout ist **ein Objekt mit einer Entität**: Es bewegt, dreht, spiegelt, sperrt sich und hängt an der Wand wie ein einzelnes Gerät, und alle Panels zeigen zusammen die Farbe und Helligkeit der Entität
- Später über *Layout bearbeiten* im Seitenfeld bearbeiten

## [1.9.4] - 2026-09-30
### Repariert
- *An Wand ausrichten* (und das Setzen von Wandgegenständen) setzt den Gegenstand jetzt auf die **innere** Fläche der Wand, die Seite zu einem Raum hin, statt nach außen zu springen
## [1.9.3] - 2026-09-30
### Neu
- Einstellungs-Fenster: ein fester Kopf mit einem ✕-Knopf (schließt auch bei einem Klick daneben) statt nur `Esc`
### Repariert
- **Tablet-Zuordnungen (Benutzer → Raum / Ansicht) und andere Einstellungen konnten nach einem Update verloren gehen**: Ein Browser, der die Einstellungen nicht laden konnte, während das Add-on neu startete, oder ein alter offener Tab konnte Standardwerte über die echten Einstellungen speichern. Jetzt werden Einstellungen nur gespeichert, nachdem sie erfolgreich geladen wurden, ein veralteter Browser kann neuere Einstellungen nicht mehr überschreiben (die Seite lädt stattdessen neu), und der Server behält die letzten Fassungen der Einstellungen in `/data/backups` und stellt sie daraus wieder her, wenn die Datei kaputt ist

## [1.9.2] - 2026-09-30
### Neu
- **Lichtschein im dunklen und hellen Design**: Leuchtende Lampen färben den Boden jetzt mit einem sanften Lichtkegel und tönen die Wände des Raums, genau wie im Hologramm-Design
## [1.9.1] - 2026-09-30
### Verbessert
- README, Dokumentation und Anleitung zum Mitmachen: Hinweis, dass dies ein KI-unterstütztes Projekt ist (mit viel menschlicher Arbeit, Testen und Sorgfalt), dazu die neuesten Sachen

## [1.9.0] - 2026-09-30
### Verbessert
- **Objektliste nach Raum gruppiert**: Jeder Raum ist eine aufklappbare Gruppe mit dem Raum selbst, seinen Türen / Fenstern und seinen Möbeln; Übriges steht unter *Kein Raum*, Wände, Treppen und Blöcke darunter. Die Gruppe mit dem ausgewählten Ding öffnet sich von selbst
### Neu
- Suchfeld über der Objektliste (öffnet alle passenden Gruppen)

## [1.8.1] - 2026-09-30
### Verbessert
- Ganz überarbeitete README mit Überblick über die Funktionen und neuen Bildschirmfotos (3D, 2D, geteilte Ansicht, ganzes Haus, Bibliothek, Raum-Feld, Licht-Popup)
### Repariert
- Die Hausauswahl im Kopf war auch mit nur einem Haus sichtbar

## [1.8.0] - 2026-09-30
### Neu
- **Seitenfeld in der Breite verstellbar**: an seinem linken Rand ziehen, um es breiter zu machen (je Browser gemerkt)
- **Echte Maße**: Breite, Höhe und Tiefe eines Stücks werden in Metern eingegeben (z. B. Sideboard 0,90 m hoch) statt als Faktoren; *Höhe über Boden* ist das Feld für die Höhe
### Repariert
- Die Sperr-Kästchen in der Objektliste und im Geräte-Feld waren gestreckt und verrutscht

## [1.7.0] - 2026-09-30
### Neu
- **Wand-TV** (Flachbildschirm, der wie Bilder an der Wand einrastet; leuchtet, wenn sein Mediaplayer an ist)
### Repariert
- 3D und 2D stimmen jetzt überein: Alle 3D-Möbelmodelle sind auf ihre Grundfläche zentriert (das Ecksofa, das Klavier und der Monitor saßen in 3D bis zu 0,5 m neben der Stelle im 2D-Plan)

## [1.6.0] - 2026-09-30
### Neu
- Sperr-Kästchen in der Objektliste für jedes Ding; die Suche in der Bibliothek findet Dinge über Alltagsnamen (z. B. *Fernseher*)

## [1.5.0] - 2026-09-30
### Neu
- **Möbel je Achse strecken**: Breite, Höhe und Tiefe lassen sich unabhängig einstellen (Seitenfeld, *Streckung*), und im 2D-Plan hat das ausgewählte Stück zwei quadratische Griffe an seiner rechten und vorderen Kante, um es länger oder breiter zu ziehen (5-cm-Schritte), z. B. ein längeres Sideboard
- **Dinge sperren**: ein Kästchen vor jedem Namen in der Objektliste (Räume, Wände, Türen/Fenster, Möbel, Treppen, Blöcke) und im Geräte-Feld; ein gesperrtes Ding lässt sich weiter auswählen, aber nicht aus Versehen verschieben, in der Größe ändern oder löschen
- Die Suche in der Möbel-Bibliothek findet Dinge auch über Alltagsnamen (z. B. findet *Fernseher* den TV, *Couch* das Sofa)
### Verbessert
- **Wandanschlag überarbeitet**: Grundfläche und Wanddicke zählen jetzt, das Stück hält an der Wandfläche an und gleitet an ihr entlang, und schnelles Ziehen kann nicht mehr durch eine Wand springen. Wand-, Decken- und Außengegenstände sind ausgenommen; Türöffnungen lassen Dinge durch
- Ausgewählte Objekte, die nicht gezeichnet werden (z. B. von einem gewählten Raum versteckt oder außerhalb des Bildschirms), bleiben auswählbar und löschbar; neuer Knopf *In die Bildmitte holen* im Geräte-Feld
- **Backup exportieren/importieren** (#12): *Häuser & Backup* im Seitenfeld lädt eine JSON-Datei mit allen Häusern, Einstellungen, hochgeladenen Bildern und eigenen 3D-Modellen herunter und spielt sie wieder zurück. Vor dem Zurückspielen behält der Server eine Sicherheitskopie der aktuellen Pläne und Einstellungen (die letzten 5 in `/data/backups`). Dateien werden geprüft (Bild- und Modellformate, Namen, Größen), bevor etwas geschrieben wird

## [1.4.0] - 2026-09-30
### Neu
- **Mehrere Häuser**: ein Grundriss je Haus (z. B. das eigene und das der Eltern). Im Kopf erscheint eine Hausauswahl, Häuser werden im Seitenfeld angelegt, verdoppelt, umbenannt und gelöscht (*Häuser verwalten*). Kiosk-Tablets öffnen ein bestimmtes Haus mit `?house=<name>` in der Adresse. Bestehende Installationen behalten ihren Grundriss als erstes Haus
- **Einzelne Flügel mehrflügeliger Fenster**: Zwei- und dreiflügelige Fenster können je Flügel einen eigenen Kontaktsensor verbinden; jeder Flügel kippt für sich auf, und das Raum-Feld listet jeden Flügel auf

## [1.3.0] - 2026-09-30
### Neu
- **Möbel-Bibliothek** (#15): Die Geräte-Palette zeigt ein Vorschaubild jedes Stücks, hat ein Suchfeld und Kategorien (Wohnen, Küche, Bad, Schlafzimmer, Büro, Licht, Technik, Außen, Deko)
- **35 neue Stücke**: Ecksofa, TV-Möbel, Bücherregal, Kamin, Klavier, Pouf, Beistelltisch, Vorhang, Barhocker, Herd, Backofen, Spülmaschine, Spüle, Kücheninsel, Mikrowelle, Spiegel, Handtuchheizkörper, Doppelwaschbecken, Einzelbett, Nachttisch, Kommode, Babybett, Computertisch, Bürostuhl, Drucker, Pendelleuchte, Wandlampe, Deckenstrahler, Heizkörper, Warmwasserbereiter, Kamera, Lautsprecher, Saugroboter, Rauchmelder, Router
- **Arten von Türen und Fenstern**: Haustür, Glastür, Doppeltür, Schiebetür, Durchgang (ohne Blatt), ein- / zwei- / dreiflügeliges Fenster, Balkontür, kleines Badfenster, Festverglasung; die Art einer gesetzten Öffnung lässt sich im Seitenfeld ändern. Doppeltüren und Schiebetüren bewegen sich, wenn der Kontaktsensor offen meldet
- **Bilder an Wänden**: Gerät *Bild*: im Seitenfeld ein PNG/JPG/WebP hochladen, die Breite einstellen; Bilder, Spiegel, Paneele, Heizkörper und andere Wandgegenstände rasten beim Setzen flach an der nächsten Wand ein, und *An Wand ausrichten* tut das später

## [1.2.1] - 2026-09-30
### Verbessert
- Die Lichtsimulation (Hologramm-Design) ist wirklichkeitsnäher: LED-Streifen, Lichtkugeln und Nanoleaf-Panels erhellen nur ihre Umgebung (kurze Reichweite, geringe Stärke), eine Stehlampe weniger als eine Deckenlampe; gedimmte Lichter werden viel dunkler (bis 12 % statt 35 %); mehrere Lampen brennen den Boden nicht mehr weiß aus (sanfter Abfall). *Reichweite* und *Stärke* in den Einstellungen skalieren weiter alles

## [1.2.0] - 2026-09-30
### Neu
- **Gruppen**: Werkzeug *Gruppe* – mehrere Geräte anklicken (z. B. alle Nanoleaf-Panels eines Logos) und *Gruppe bilden* drücken. Eine Gruppe bewegt, dreht (Q/E oder das Feld *Drehung*, um ihre Mitte) und spiegelt sich (*Gruppe spiegeln*) als eine Form, so fällt die Form nie auseinander. Gruppen sind in 2D gestrichelt umrandet; *Aus Gruppe lösen* / *Gruppe auflösen* machen es rückgängig
- **Wandanschlag**: Geräte lassen sich nicht mehr aus Versehen durch eine Wand ziehen; sie halten an ihr an (offene Türen lassen sie durch). In den Einstellungen ausschaltbar (*Geräte stoppen an Wänden*)

## [1.1.0] - 2026-09-30
### Neu
- Geräte lassen sich um **alle Achsen** drehen: Neben *Drehung* (senkrechte Achse) gibt es *Kippen vor/zurück* und *Drehen in der Fläche / seitlich* (Rollen, bei einem Panel: in der Wandebene drehen), dazu **Spiegeln**, um eine Form zu spiegeln. Nanoleaf-Panels drehen sich jetzt um ihre Mitte statt um ihre Unterkante

## [1.0.0] - 2026-09-30
### Verbessert
- Erste stabile Versionsnummer. Keine Änderungen an den Funktionen gegenüber 0.10.2; der Sprung sorgt auch dafür, dass Home Assistant das Update anbietet (manche Installationen zeigten 0.10.x nicht)

## [0.10.2] - 2026-09-30
### Neu
- **Stromsparmodus für Tablets und Kiosk-Bildschirme** (Fire-Tablets …): Auflösung höchstens 1,25-fach, keine Kantenglättung, keine Schatten, 30 Bilder pro Sekunde, solange man bedient, und nur etwa 4, wenn nichts passiert (volle Geschwindigkeit bei Berührung, Zustandsänderungen und Bearbeiten); nichts wird gezeichnet, solange der Bildschirm oder Tab versteckt ist. Automatisch bei `?kiosk=1`, `?room=...` und Touchscreens; `?perf=high` / `?perf=low` überschreibt es. Am PC ändert sich nichts

## [0.10.1] - 2026-09-30
### Neu
- Live-Popup eines Lichts: **Szenen mit dieser Lampe** – alle Szenen von Home Assistant (`scene.*`), die dieses Licht enthalten, stehen als Knöpfe da und starten die ganze Szene (z. B. eine Szene *Gaming*, die mehrere LED-Streifen auf verschiedene Farben stellt). Das Raum-Feld bietet auch die Szenen an, die eines seiner Lichter enthalten, nicht nur die des Bereichs des Raums

## [0.10.0] - 2026-09-30
### Neu
- Nanoleaf-Panel-Formen als setzbare Geräte: **Dreieck, Sechseck, Quadrat und Linie** (aufrecht, an der Wand, mit Q/E drehen). Mehreren Panels dieselbe Licht-Entität geben, und sie leuchten zusammen; die Effekte/Szenen des Lichts werden wie bisher im Live-Popup angeboten (#16)

## [0.9.3] - 2026-09-30
### Repariert
- Release-Workflow: doppelter `push`-Auslöser zusammengeführt (die Datei wurde von GitHub abgelehnt)

## [0.9.2] - 2026-09-30
### Verbessert
- Der Workflow *Release* läuft jetzt von selbst, wenn sich die Version in `config.yaml` auf `main` ändert, so passen das Release-Abzeichen und die GitHub-Releases immer zur aktuellen Version (kein *Run workflow* von Hand nötig)

## [0.9.1] - 2026-09-30
### Repariert
- Garten-Objekte (Rasen, Baum, Busch, Pool, Terrasse, Weg, Zaun) behalten im Hologramm-Design ihre natürlichen Farben, statt blau zu werden
- Ansicht des ganzen Hauses: Ein Keller wird durchscheinend in einem Erdblock unter einer grünen Bodenfläche gezeichnet, so sieht er nicht mehr wie ein weiteres Stockwerk aus

## [0.9.0] - 2026-09-30
### Neu
- Etagen: **nach oben/unten verschieben** und **einen Keller** unter dem Erdgeschoss **einfügen** (Feld *Etage verwalten*); das Erdgeschoss behält die Höhe 0, Etagen bekommen eine Art (Etage / Keller / Dach) und lassen sich löschen
- **Dach** als Art einer Etage: Sattel-, Walm- oder Flachdach, erzeugt über der Grundfläche von allem darunter (Neigung, Überstand, Firstrichtung)
- **Außen- / Deko**-Objekte: Baum, Busch, Pool, Rasen, Terrasse, Weg, Zaun – gesetzt wie Geräte, auch außerhalb des Hauses (flache werden in 2D unter anderen Objekten gezeichnet)
- Ansicht **Ganzes Haus**: alle Etagen fest (kein Durchscheinen) plus das Grundstück mit Bodenraster; ein Klick auf eine Etage verlässt sie. Nur ansehen (in dieser Ansicht wird nichts bearbeitet)

## [0.8.3] - 2026-09-30
### Repariert
- Treppenöffnung: Die Etage darüber wird jetzt mit einer echten Vieleck-Differenz geschnitten (kleine mitgelieferte Bibliothek `polygon-clipping`, MIT). Vorher wurde die Öffnung nur geschnitten, wenn sie ganz in einem Raum lag, darum klappte es nicht über Wänden, Fluren und zwischen Räumen
### Neu
- Treppen: **Größe bearbeiten**: Längenfeld im Seitenfeld und zwei Griffe in 2D (Ende des Laufs = Stufentiefe/Länge, Seite des Laufs = Breite oder Radius der Wendeltreppe). Nach dem Setzen einer Treppe ist das Werkzeug *Auswählen* aktiv, so funktionieren die Griffe sofort
- Türen: **Aufschlag umkehren** – die Tür schlägt zur anderen Seite der Wand auf (2D-Bogen und 3D-Blatt), unabhängig von *Spiegeln* (Seite der Angeln)

## [0.8.2] - 2026-09-30
### Neu
- 2D-Editor: **Ein Doppelklick auf den Umriss eines Raums oder Blocks fügt dort eine Ecke hinzu** (so lässt sich ein Raum leicht umformen), ein Doppelklick auf eine Ecke entfernt sie wieder (ein Raum behält mindestens drei)

## [0.8.1] - 2026-09-30
### Verbessert
- Hintergrundbild: **die Größe durch Ziehen an den Eckgriffen ändern** (gleichmäßig um die gegenüberliegende Ecke), das Bild ziehen, um es zu verschieben. Beides ist gleich nach dem Laden eines Bildes aktiv und über den Knopf „Verschieben / Größe“

## [0.8.0] - 2026-09-30
### Neu
- **Platzhalter-Blöcke** für Etagen, die man nicht zeichnen will: Werkzeug *Block* (B), den Gebäudeumriss zeichnen, er steht als feste Masse (3D) / schraffierte Fläche (2D) für die Etage darunter. Auf der ersten Etage wird die Etage darunter automatisch angelegt (die Standard-Etage wird in „1. Stock“ umbenannt). Blöcke lassen sich nicht steuern und geben nur Orientierung
- **Treppen** (Werkzeug *Treppe*, T): gerade, L- und U-Treppen mit Podest, Wendeltreppen. Die Stufen werden aus der Geschosshöhe berechnet, in 3D als feste Stufen gezeigt und in 2D als Stufenlinien mit Richtungspfeil. Q/E dreht, das Seitenfeld bearbeitet Breite/Radius, Drehseite, Richtung und Position
- **Bodenöffnung**: Die Etage darüber (oder die eigene Etage bei Treppen, die „von unten kommen“) bekommt automatisch eine Öffnung über dem oberen Lauf, in 2D orange gestrichelt gezeigt
- **Vorlage Treppenhaus** (*Treppenhaus*): U-Treppe, vier Wände, ein Raum, eine flache Tür und, bei Treppen nach oben, dieselbe Hülle auf der nächsten Etage mit einem Klick
- Treppen und Blöcke erscheinen in der Objektliste, lassen sich in 2D ziehen, löschen und rückgängig machen
- Unit-Tests für die Treppengeometrie (`tests/stairs.test.mjs`, laufen in der CI) und 7 neue Browser-Prüfungen

## [0.7.2] - 2026-09-30
### Neu
- **Hintergrundbild / Bauplan zum Nachzeichnen** (Roadmap-Issue #18): Je Etage lässt sich ein Scan oder Foto des Grundrisses (PNG, JPG oder WebP, bis 8 MB) als Vorlage in den 2D-Editor laden. Feld „Hintergrundbild“ mit Deckkraft, Breite, Position und Drehung, **Maßstab setzen** (zwei Punkte mit bekanntem Abstand anklicken, die echte Länge eingeben) und **Verschieben** (das Bild ziehen). Die Vorlage ist nur im Editor sichtbar und wird mit dem Plan gespeichert
- Backend: `POST/GET/DELETE /api/backgrounds` (Schreiben nur für Bearbeiter, Bilder werden an ihrem Inhalt erkannt, SVG wird abgelehnt, zufällige Dateinamen)

## [0.7.1] - 2026-09-30
### Repariert
- Admin-Erkennung: Der Cache begann bei der monotonen Zeit 0, darum wurde die Prüfung in der ersten Minute nach einem Start des Rechners übersprungen (ließ auch den CI-Test auf frischen Runnern scheitern)

## [0.7.0] - 2026-09-30
### Neu
- Live-Modus: **Bedienung des ganzen Raums.** Unter der Bedienung eines Lichts oder einer Szene (und oben im Raum-Feld) gibt es „Ganzer Raum“: alle Lichter des Raums an/aus, Helligkeit, Farbe und warm-/kaltweiß für alle, dazu die **Szenen** des Raums als Knöpfe (Lichter und Szenen des Raums = darin gesetzt oder in seinem HA-Bereich)
- **Effekte** für Lichter, die eine `effect_list` melden (Nanoleaf, WLED, Hue …): Ausklappliste im Live-Popup, bei einem Raum die Effekte, die alle seine Lichter teilen. Die Liste erlaubter Dienste lässt `effect` nur für Lichter zu
- Einstellungen → „Benutzer & Tablets“: Der Benutzer wird aus den **Benutzern von Home Assistant** gewählt (neuer Endpunkt `/api/users`, nur Bearbeiter; Eintippen geht weiter), mit Raum und **Live-Ansicht** je Benutzer (nur 3D / nur 2D / 2D + 3D / umschaltbar)
### Verbessert
- Der Live-Modus zeigt normal **nur die 3D-Ansicht**; die Knöpfe 2D und 2D + 3D sind versteckt, außer der Benutzer hat in den Einstellungen mehr bekommen (`userViews`, geliefert über `/api/me`)

## [0.6.0] - 2026-09-30
### Verbessert
- **Berechtigungen:** Administratoren von Home Assistant bekommen jetzt immer den vollen Editor; alle anderen Benutzer bekommen nur die Live-Ansicht zum Ansehen (vorher ließ eine leere `editors`-Liste alle bearbeiten). `editors` erlaubt weiter zusätzliche Bearbeiter ohne Admin-Rechte. Die Administratoren werden aus Home Assistant gelesen (Websocket `config/auth/list`, eine Minute gemerkt); klappt das nicht, dürfen nur Benutzer in `editors` bearbeiten, und die Statuszeile sagt das
- Die Einstellung Wandhöhe gilt jetzt für alle Wände (vorher betraf sie nur neue Wände). Umbenannt in „Wandhöhe (alle Wände)“; einzelne Wandhöhen lassen sich weiter im Eigenschaften-Feld ändern

## [0.5.1] - 2026-09-30
### Neu
- Suchfeld über „Entitäten im Raum“ (Bearbeiten-Modus): filtert die Geräte, Öffnungen und ungesetzten Bereichs-Entitäten des Raums nach Name, Entitäts-ID oder Bereich

## [0.5.0] - 2026-09-30
### Neu
- Neue Geräte „Lichtkugel“ und „LED-Streifen“ (1 m LED-Streifen, auf die echte Länge skalieren) für LED-Streifen und Akzentlichter; mit jeder Licht-Entität verbindbar
- Leuchtende Geräteteile (alle Lichter, Kugeln, Streifen) nehmen in 3D die Farbe der Licht-Entität an

## [0.4.1] - 2026-09-30
### Verbessert
- Die Entitätenauswahl im Eigenschaften-Feld ist volle Breite mit einer großzügigen Ergebnisliste: Namen brechen um, statt abgeschnitten zu werden, die Entitäts-ID steht darunter, nach Bereich gruppiert, und die aktuelle Verbindung steht darüber

## [0.4.0] - 2026-09-29
### Neu
- Durchsuchbare Entitätenauswahl im Eigenschaften-Feld (Geräte und Tür-/Fenster-Kontaktsensoren): Suche nach Name, Entitäts-ID oder HA-Bereich (mehrere Wörter = UND), Enter weist den ersten Treffer zu

## [0.3.1] - 2026-09-29
### Repariert
- Dockerfile: Standard-Basis-Image für `BUILD_FROM`

## [0.3.0] - 2026-09-29
### Repariert
- Konfiguration des Add-ons: Standardwerte entfernt (`boot`, `ingress_port`, `startup`) und die veraltete Architektur `armv7`, so besteht das Add-on die Prüfung des Linters

### Neu
- 2D-Bauplan-Editor (neues `plan2d.js`): ein SVG-Plan von oben mit Raster, Wandlängen, Türaufschlägen, Fenstersymbolen, Raumflächen und Grundflächen der Möbel. Wände/Räume zeichnen, Türen/Fenster/Geräte setzen, alles verschieben (Eckgriffe für Wände und Räume, verbundene Wände und Raumecken folgen), radieren, verschieben und zoomen (Rad, Ziehen mit rechter/mittlerer Taste, Zwei-Finger-Zoom). Er bearbeitet denselben Plan wie die 3D-Ansicht; die neue geteilte Ansicht „2D + 3D“ frischt beide live auf. Geht auch im Live-Modus (Zustände gezeigt, zum Steuern antippen)
- Raum-Auswahl: Die Liste des Raums (alle Möbel, Geräte und Türen/Fenster darin) bleibt sichtbar; ein Klick auf einen Eintrag wählt ihn aus und sperrt ihn, so bewegt sich nur dieses Objekt. Esc/„Lösen“/nochmal anklicken geht zum Raum zurück
- Auswahl-Sperre: Ein Objekt aus der Seitenliste zu wählen, sperrt die Auswahl. Klicks und Ziehen in der 3D-Ansicht bewegen dann nur dieses Objekt (von überall); lösen mit dem Listeneintrag, dem Knopf „Lösen“ oder Esc
- Bearbeiten-Modus: Seitenliste aller Räume, Wände, Türen/Fenster und Geräte der Etage, um Objekte auszuwählen, die in 3D schwer zu treffen sind; Geräte haben jetzt Felder für die X/Z-Position
- Bearbeiten-Modus: Einen Raum auszuwählen, listet seine Entitäten auf (gesetzte Geräte mit ihrer zugewiesenen Entität und ihrem Live-Zustand, dazu ungesetzte Entitäten seines HA-Bereichs mit einem Knopf „+ platzieren“); ein ausgewähltes Gerät zeigt seine Entität und ihren Zustand
- Bereiche von Home Assistant: Ein Raum lässt sich mit einem HA-Bereich verbinden (Eigenschaften des Raums). Die Entitätenauswahl ist nach Bereich gruppiert, mit dem eigenen Bereich des Raums zuerst, die Suche findet auch Bereichsnamen, und das Raum-Feld listet zusätzlich Lichter/Abdeckungen/usw. des Bereichs auf, die nicht im Plan gesetzt sind (neuer Endpunkt `/api/areas`)
- Live-Modus: Ein Tipp auf ein Licht öffnet die Farb-Bedienung (8 Vorlagen, Farbauswahl, warm-/kaltweiß, Helligkeit); das Leuchten des Raums folgt der gewählten Farbe. Die Liste erlaubter Dienste lässt jetzt `rgb_color` und `color_temp_kelvin` nur für Lichter zu
- 17 neue Möbelarten: Stuhl, Sessel, Schreibtisch, Esstisch, Couchtisch, Kleiderschrank, Regal, Sideboard, Küchenzeile, Kühlschrank, Waschmaschine, Badewanne, Toilette, Waschbecken, Dusche, Teppich, Auto
- Berechtigungen: Die Add-on-Option `editors` begrenzt, wer bearbeiten darf; andere Benutzer bekommen eine Live-Ansicht nur zum Ansehen (im Backend erzwungen, HTTP 403); das Panel ist jetzt für alle Benutzer offen (`panel_admin: false`)
- Tablet je Raum: in den Einstellungen einem Raum einen Home-Assistant-Benutzer zuweisen; dieser Bildschirm startet nur mit dem Raum und einem Knopf, der zur ganzen Etage umschaltet (`?room=` geht auch)
- Etagen darunter werden mit allem gezeigt, nur abgedunkelt: beleuchtete Räume und Lampenschein, Raumnamen, Sensorwerte, Strom-Schilder, Zustände von Türen und Fenstern
- Etagen darunter scheinen durch die aktuelle Etage (durchsichtige Bodenplatte, blasse Wände und Geräte); Stärke in den Einstellungen einstellbar (*Etagen darunter sichtbar*); die Demo hat jetzt ein Obergeschoss
- Tür- und Fensterkontakte: einen Sensor (binary_sensor, cover oder lock) an jede Tür oder jedes Fenster binden; offene werden rot, Türen schwingen auf und Fenster kippen, eine rote Pille „N offen“ zeigt die Zahl, das Raum-Feld listet Türen und Fenster mit ihrem Zustand, im Live-Modus eine antippen für Einzelheiten
- Raum freistellen: Ein Tipp auf eine Raum-Pille (oder im Live-Modus auf den Raumboden) zeigt nur diesen Raum mit seinen Wänden und Geräten
- Licht breitet sich von der Position jeder Lampe aus und wird schwächer, in der (RGB-)Farbe und Helligkeit der Lampe, nur in ihrem eigenen Raum; farbiges Leuchten klettert die Wände hoch
- Raum-Feld (Entitäten je Raum) auch im Bearbeiten-Modus und durch Antippen eines Raums
- Einstellungen: Deckkraft der Wände, Reichweite/Stärke/Leuchthöhe der Lampen, normale Lichtfarbe, Hintergrundfarben, frei bearbeitbare Farbskalen für die Temperatur- und Feuchte-Ansichten
- Hologramm-Hintergrund: königsblauer Verlauf mit türkisem Leuchten in der Ecke, schwächeres Raster
- Wärme-Ansichten *Normal / Temp. / Feuchte* färben Räume nach Sensorwerten; Leistungssensoren (W) erscheinen als leuchtende orange Schilder
- Raum-Feld im Live-Modus: eine Raum-Pille antippen, um alle ihre Entitäten gruppiert zu sehen (Lichter, Abdeckungen, Medien, Schalter, Sensoren), mit Reglern für Helligkeit und Rollladen-Stellung
- Raumfläche (m²/ft²) in der 2D-Ansicht gezeigt
- Backend: `/api/service` nimmt `brightness_pct` (Lichter) und `position` (Abdeckungen, `set_cover_position`) an; `/api/entities` gibt Helligkeit und Stellung zurück
- Hologramm-Design (neuer Normalfall): durchscheinende blaue Wände mit Neonkanten, Drahtgitter-Geräte, türkise Fenster, orange Türen; aktive Geräte und Räume mit eingeschaltetem Licht leuchten orange (Design *Hologramm*, dunkel und hell bleiben verfügbar)
- Navigations-Pillen über der Szene: Etagen, Räume (antippen, um die Kamera darauf zu richten), *Auto* (Absenken) und *Wände hoch/niedrig*
- Git-Anleitung für Anfänger (`docs/GIT-EINSTIEG.md`)
- Absenken: Wände zur Kamera hin sinken automatisch ab, so sieht man in die Räume (Einstellung: *Wände zur Kamera hin absenken*)
- Demo in einer Datei (`demo/`): der echte Editor mit einer Beispielwohnung und simulierten Geräten, läuft mit Doppelklick

### Verbessert
- Steilere 3D-Kamera am Anfang, Raumnamen immer lesbar

### Repariert
- Der Statustext sitzt nicht mehr in der Werkzeugleiste und schiebt sie in eine zweite Zeile, was beim Zeichnen die Ansicht unter der Maus verschob
- Türen/Fenster: Die Trefferflächen passen jetzt zu ihrer echten Größe, und eine nicht ausgewählte Tür / ein Fenster wird beim ersten Klick nur ausgewählt (Ziehen beginnt bei einer schon ausgewählten), so verschieben verirrte Klicks sie nicht mehr
- Die Temperatur-/Feuchte-Ansicht geht auf jeder Etage und für jeden Raum: Sensoren werden über Einheit oder device_class erkannt (auch °F), Klima-Entitäten zählen mit ihren aktuellen Werten, und Sensoren im HA-Bereich des Raums zählen mit, auch wenn sie nicht gesetzt sind
- Türen und Fenster lassen sich wieder auswählen, verschieben und in der Größe ändern, auch während ihre Wand abgesenkt ist (ungeskalierte Trefferflächen mit Umriss); Trefferflächen von Türen/Fenstern gewinnen gegen Geräte dahinter
- Lampenlicht auf Etagen darunter bleibt durch mehrere Etagen darüber sichtbar (beleuchtete Bodenflächen sind deckender); die Demo hat eine dritte Etage
- Schilder und Werte werden in 4-facher Auflösung gezeichnet und bleiben beim Hineinzoomen scharf; ein kleinster Zoom-Abstand, damit die Kamera nicht in Objekte hineinfährt
- Raum freistellen kürzt lange Wände auf den Teil, der an den Raum grenzt, so bleiben keine Wände anderer Räume stehen
- Das Geräte-Popup überdeckt die Knöpfe Normal/Temp./Feuchte nicht mehr
- Lampen und andere Geräte lassen sich durch abgesenkte oder durchsichtige Wände antippen (Geräte gehen beim Antippen vor Wänden; im Live-Modus werden Wände übergangen)
- Kleine Geräte (Deckenlampen, Schalter) lassen sich dank einer unsichtbaren, gepolsterten Trefferfläche leichter auswählen und antippen

## [0.2.0] - 2026-09-29
### Neu
- Einstellungs-Fenster: Sprache (DE/EN), helles/dunkles Design, metrische/imperiale Einheiten, Rastergröße, Standard-Wandhöhe und -dicke, Schatten, Werte-Schilder, Verzögerung des automatischen Speicherns; auf dem Server in `/data/settings.json` gespeichert
- Türen und Fenster sind echte Wandöffnungen (Wände werden geschnitten, Rahmen und Blätter sind modelliert); an der Wand entlang ziehen, Schutz vor Überlappung, Breite/Höhe/Brüstung/Position bearbeitbar
- Eigene GLB-Modelle: hochladen, Modell-Bibliothek, Setzen wie eingebaute Geräte (automatisch auf 1 m skaliert, einstellbar)
- Live-Modus: ein Gerät antippen, um seinen Zustand zu sehen und es zu steuern (Lichter, Schalter, Ventilatoren, Abdeckungen, Schlösser, Szenen, Skripte); Sensor- und Klimawerte werden neben dem Gerät gezeigt
- Kiosk-Modus für Wandtablets über `?kiosk=1` (auch `?mode=live`)
- Knopf „Fit“, Backend-Tests (pytest) und Browser-End-to-End-Test

### Verbessert
- Dienstaufrufe sind auf eine Liste erlaubter Bereiche und Dienste beschränkt
- Frontend in Module aufgeteilt (`walls.js`, `models.js`, `i18n.js`)

### Repariert
- Hochgeladene Dateinamen mit Sonderzeichen werden richtig entschlüsselt

## [0.1.0] - 2026-09-29
### Neu
- Home-Assistant-Add-on mit Ingress
- Wände, Räume und Etagen zeichnen mit Einrast-Raster
- 3D- und 2D-Ansicht, 12 eingebaute Gerätemodelle
- Entitäten verbinden, Umschalten per Doppelklick, automatisches Speichern, Rückgängig
