"""Every feature of the add-on and the clip of the video guide that shows it (the owner, 2026-11-02: "das Programm hat echt viele
Funktionen … nicht dass man da was vergisst").

One line per feature: (id, group, German name, English name, clip ids, why). `clips` names the clips that show it; a feature that
cannot be filmed in the demo has no clips and says why (shown on the page under "Alle Funktionen"). tests/test_make_guide.py checks:
every clip id exists, every clip is used here, every feature has clips or a reason, and every new version from 4.52.0 on that adds
something ("### Added" in CHANGELOG.md) has a line here with since="<version>".

A new feature: a line here (since="x.y.z") and a clip in tools/guide/clips_*.py (tools/guide/README.md).
"""

F = []


def f(fid, group, de, en, clips=(), why=None, since=None):
    F.append({"id": fid, "group": group, "de": de, "en": en, "clips": list(clips), "why": why, "since": since})


# ---------- the 3D view and finding things ----------
f("orbit", "start", "3D-Bild drehen, schieben, zoomen, einpassen", "Turn, move, zoom and fit the 3D view", ["orbit"])
f("floors", "start", "Etagen wechseln, ganzes Haus", "Switch floors, the whole house", ["floors"])
f("views", "start", "2D-Plan, 3D, beides nebeneinander", "2D plan, 3D, both side by side", ["views"])
f("viewmenu", "start", "Ansicht: durchsichtig, Wände absenken (Auto), Halbschnitt, aufeinander", "View: see-through, lowered walls (Auto), half cut, stacked", ["viewmenu"])
f("room", "start", "Raum öffnen, ganzer Raum auf einmal", "Open a room, the whole room at once", ["room"])
f("search", "start", "Suche („Wo ist …?“)", "Search (“Where is …?”)", ["search"])
f("voice", "start", "Sprachsuche und Schalten per Sprache 🎤", "Voice search and switching by voice 🎤", ["voice"])
f("colors", "start", "Temperatur, Feuchte, CO₂ als Farbe", "Temperature, humidity, CO₂ as colours", ["colors"])
f("power", "start", "Strom als Bild (Verbrauch, Solar, fließende Punkte)", "Power as a picture (usage, solar, flowing dots)", ["power"])
f("sky", "start", "Himmel nach Tageszeit, Mond, Wetter", "Sky by the time of day, moon, weather", ["sky"])
f("labels", "start", "Schilder über den Räumen, Anwesenheit", "Labels over the rooms, presence", ["room", "light"])

# ---------- controlling the house ----------
f("light", "live", "Licht schalten, dimmen, Farbe, Weißton", "Switch, dim, colour a light, white tone", ["light"])
f("lightgroups", "live", "Welche Lampen sind an, Licht-Gruppen aus", "Which lamps are on, light groups off", ["lightgroups"])
f("scenesrun", "live", "Szenen und Skripte starten (Szenen-Leiste)", "Start scenes and scripts (scene bar)", ["scenes"])
f("tiles", "live", "Kacheln: Favoriten und Räume", "Tiles: favourites and rooms", ["tiles"])
f("shutter", "live", "Rollläden und Vorhänge", "Roller shutters and curtains", ["shutter"])
f("heating", "live", "Heizung im Raum einstellen", "Set the heating in a room", ["heating"])
f("devices", "live", "Geräte-Übersicht, Batterien, offline", "Device overview, batteries, offline", ["devices"])
f("open", "live", "Offene Fenster und Türen", "Open windows and doors", ["open"])
f("warnings", "live", "Warnungen: Regen am offenen Fenster, Rauch, Gas, Wasser", "Warnings: rain at an open window, smoke, gas, water", ["warnings"])
f("alarm", "live", "Urlaubs-Alarm", "Holiday alarm", ["alarm"])
f("security", "live", "Sicherheit: einen Tag abspielen", "Security: play back a day", ["security"])
f("ledring", "live", "LED-Ring unter der Decke", "LED ring under the ceiling", ["ledring"])
f("effects", "live", "Effekte (Nanoleaf, WLED, Hue)", "Effects (Nanoleaf, WLED, Hue)", ["effects"])
f("doorbell", "live", "Türklingel mit Kamera", "Doorbell with camera", ["doorbell"])
f("usedby", "live", "🔎 Wird benutzt: was ein Gerät schaltet", "🔎 Used by: what switches a device", ["usedby"])
f("moreinfo", "live", "ⓘ Fenster von Home Assistant (Verlauf, Logbuch)", "ⓘ Home Assistant's dialog (history, logbook)",
  why="öffnet das Fenster von Home Assistant selbst; in der Demo gibt es kein Home Assistant")
f("renames", "live", "Umbenannt in Home Assistant, umbenannt im Plan", "Renamed in Home Assistant, renamed in the plan",
  why="geschieht von selbst im Hintergrund, es gibt nichts zu bedienen")

# ---------- the pages ----------
f("today", "pages", "☀ Heute: Uhr, Wetter, Zug, Müll, Termine", "☀ Today: clock, weather, train, bins, appointments", ["today"])
f("energy", "pages", "⚡ Energie: Verbrauch, Solar, Kosten", "⚡ Energy: usage, solar, costs", ["energy"])
f("energyhouses", "pages", "⚡ Strom mehrerer Häuser: eigene Zähler und Preise je Haus, alle zusammen, ⚖ Vergleichen",
  "⚡ Power of several houses: own meters and prices per house, all together, ⚖ Compare", ["energy-houses"])
f("climate", "pages", "🌡 Klima: alle Räume und Thermostate", "🌡 Climate: every room and thermostat", ["climate"])
f("heatplan", "pages", "📅 Heizplan je Raum", "📅 Heating schedule per room", ["heatplan"])
f("heatrules", "pages", "📋 Heiz-Regeln, Raumfühler, Zu warm", "📋 Heating rules, room sensors, too warm", ["heatrules"])
f("heatdiag", "pages", "🩺 Protokoll der Heizung", "🩺 Heating log", ["heatdiag"])
f("cameras", "pages", "📷 Kameras", "📷 Cameras", ["cameras"])
f("media", "pages", "🎵 Musik und Fernseher", "🎵 Music and TV", ["media"])
f("household", "pages", "🧺 Haushalt: Wäsche, Saugroboter, Auto, Garten, Einkauf", "🧺 Household: laundry, vacuum, car, garden, shopping", ["household"])
f("routines", "pages", "▶ Abläufe: Knöpfe, Szenen, Automationen", "▶ Routines: buttons, scenes, automations", ["routines"])
f("flow", "pages", "Eigener Ablauf „Wenn … dann …“", "Own routine “When … then …”", ["flow"])
f("specialdays", "pages", "📅 Besondere Tage", "📅 Special days", ["specialdays"])
f("sceneedit", "pages", "Szenen anlegen und ändern", "Create and change scenes", ["sceneedit"])
f("family", "pages", "👪 Familie und Pinnwand", "👪 Family and pinboard", ["family"])
f("log", "pages", "📜 Protokoll: wer hat was geschaltet", "📜 Log: who switched what", ["log"])
f("buttons", "pages", "🔘 Eigene Seiten mit Knöpfen", "🔘 Own pages with buttons", ["buttons"])

# ---------- drawing the plan ----------
f("walls", "edit", "Wände zeichnen", "Draw walls", ["walls"])
f("rooms", "edit", "Räume erkennen und benennen", "Find and name rooms", ["rooms"])
f("openings", "edit", "Türen und Fenster", "Doors and windows", ["openings"])
f("windowsetup", "edit", "Fenster einstellen: Flügel, Anschlag, Kontakt, Rollladen, Vorhang", "Set up a window: panes, hinges, contact, shutter, curtain",
  ["window-setup"])
f("devicesplace", "edit", "Lampen und Geräte platzieren, mit Home Assistant verbinden", "Place lamps and devices, link them to Home Assistant", ["devices-place"])
f("move", "edit", "Verschieben, drehen, löschen, rückgängig", "Move, turn, delete, undo", ["move"])
f("measure", "edit", "Messen, Wände genau verschieben und drehen (Abstand, Winkel)", "Measure, move and turn walls exactly (distance, angle)", ["measure"])
f("background", "edit", "Grundriss nachzeichnen (Hintergrundbild)", "Trace a floor plan (background picture)", ["background"])
f("roof", "edit", "Dach und Gauben", "Roof and dormers", ["roof"])
f("stairs", "edit", "Treppen", "Stairs", ["stairs"])
f("plot", "edit", "Grundstück und Garten", "Plot and garden", ["plot"])
f("floorsadd", "edit", "Etagen und Keller anlegen", "Add floors and a basement", ["floors-add"])
f("finishes", "edit", "Böden, Wände, Farben je Raum", "Floors, walls, colours per room", ["finishes"])
f("library", "edit", "Möbel-Bibliothek, Größe, sperren", "Furniture library, size, lock", ["library"])
f("closet", "edit", "Schrank nach Maß", "Made-to-measure closet", ["closet"])
f("houses", "edit", "Mehrere Häuser, ein Nachbarhaus daneben zeigen", "Several houses, a neighbour house beside this one", ["houses"])
f("energycalc", "edit", "⚡ Strom-Rechner (Rechnung): welcher Sensor ist Netz, Solar, Batterie, Haus und Räume; Checkliste, Vorzeichen",
  "⚡ Power bookkeeping: which sensor is grid, solar, battery, house and rooms; check list, signs", ["energy-calc"])
f("nanoleaf", "edit", "Nanoleaf: die Form der Panels zeichnen (Layout-Editor)", "Nanoleaf: draw the shape of the panels (layout editor)", ["nanoleaf-edit"])
f("objlist", "edit", "Liste aller Objekte", "List of all objects", ["objlist"])
f("toolbar", "edit", "Werkzeugleiste anpassen", "Customise the tool bar", ["toolbar"])
f("import", "edit", "Haus aus einer Beschreibung bauen (Import, KI)", "Build a house from a description (import, AI)", ["import"])
f("glb", "edit", "Eigene 3D-Modelle (.glb) und Bilder an Wänden", "Own 3D models (.glb) and pictures on walls", ["library"],
  why="braucht eine eigene Datei; geht wie im Video „Möbel“ über „Gerät“ → „Eigene Modelle“")

# ---------- designing pages ----------
f("addcard", "dash", "Karten auf eine Seite setzen", "Put cards on a page", ["addcard"])
f("arrange", "dash", "Karten ausblenden, frei anordnen", "Hide cards, arrange them freely", ["arrange"])
f("tabs", "dash", "Reiter unten ordnen, eigene Seiten", "Arrange the tabs, own pages", ["tabs"])
f("scenebaredit", "dash", "Szenen-Leiste einstellen", "Set up the scene bar", ["scenebar-edit"])
f("variants", "dash", "Seiten je Person (Fassungen)", "Pages per person (versions)", ["variants"])

# ---------- settings ----------
f("language", "settings", "Sprache, Design, Einheiten", "Language, design, units", ["language"])
f("settingssearch", "settings", "Einstellungen finden", "Find a setting", ["settings-search"])
f("users", "settings", "Benutzer, Rechte, Wandtablets", "Users, rights, wall tablets", ["users"])
f("kiosk", "settings", "Wandtablet: Startansicht, Bildschirmschoner, sparsam", "Wall tablet: start view, screen saver, saving mode", ["kiosk"])
f("notify", "settings", "Nachricht aufs Handy bei Alarm", "Message to the phone on an alarm", ["notify"])
f("backup", "settings", "Backup und Wiederherstellen: alles, auch Codes und Aufzeichnungen", "Backup and restore: everything, codes and recordings too",
  ["backup"], since="4.53.0")
f("fullscreen", "settings", "Vollbild (mit Code)", "Full screen (with a code)", ["fullscreen"])
f("version", "settings", "Version und Prüfsumme", "Version and checksum", ["version"])
f("card", "settings", "Karte im Dashboard von Home Assistant", "Card in a Home Assistant dashboard",
  why="eine Karte in Home Assistant selbst, nicht in der Demo; Anleitung in der Beschreibung des Add-ons (Dashboard card)")
f("docker", "settings", "Ohne Add-on-Store (Docker)", "Without the add-on store (Docker)",
  why="eine Installation, kein Bildschirm; Anleitung in container/README.md")

# ---------- phone and tablet ----------
f("phonehouse", "phone", "Am Handy: Haus, Räume, Licht", "On the phone: house, rooms, light", ["phone-house"])
f("phonepages", "phone", "Am Handy: die Seiten", "On the phone: the pages", ["phone-pages"])

# ---------- added by a version (since=) ----------
f("guide", "settings", "🎬 Video-Anleitung im Add-on, für ohne Internet speichern", "🎬 Video guide in the add-on, saved for without internet",
  why="das ist diese Anleitung selbst", since="4.52.0")
f("roofwing", "edit", "L-förmiges Dach: ein weiteres Dach wie das Hauptdach, auch auf dem Kniestock", "L-shaped roof: a further roof like the main roof, on the knee wall too",
  ["roof-wing"], since="4.54.0")
f("roofgable", "edit", "Giebelwand, Überstand am Giebel, Pultdach und Vordach", "Gable wall, overhang at the gables, shed roof and canopy",
  ["roof-gable"], since="4.55.0")
f("phoneedit", "phone", "Am Handy bearbeiten: Werkzeuge als Leiste, Plan mit dem Finger", "Edit on the phone: the tools as a strip, the plan with the finger",
  ["phone-edit"], since="4.56.0")
f("cars", "pages", "🚗 Mehrere Autos im Haushalt", "🚗 Several cars on Household", ["cars"], since="4.57.0")
f("terrain", "edit", "Gelände am Hang: Höhenpunkte, Hang in einem Schritt, Höhenlinien, Keller frei", "Terrain on a slope: spot heights, a slope in one step, contour lines, basement free",
  ["plot-terrain"], since="4.58.0")
f("stairwinder", "edit", "Gewendelte Treppe: Keilstufen statt Podest, Stufen im 1. Lauf, massive Wandtreppe", "Winder stairs: wedge steps instead of a landing, steps in flight 1, solid wall stair",
  ["stairs-winder"], since="4.60.0")
f("roofcut", "edit", "L-Dach: Dächer schneiden sich in den Kehlen, Firstrichtung 0°/90°, breite Gaube mit eigener Neigung", "L-shaped roof: roofs cut into each other in the valleys, ridge direction 0°/90°, a wide dormer with its own pitch",
  ["roof-wing", "dormer-pitch"], since="4.61.0")
f("skylight", "edit", "Dachfenster ohne Gaube: in der Dachschräge, übliche Größen, ein echtes Fenster mit Kontakt", "Roof windows without a dormer: in the slope, usual sizes, a real window with a contact",
  ["skylight"], since="4.62.0")
f("balcony", "edit", "Balkon und Dachterrasse: Geländer aus Metall, Glas oder Holz, Stützen bis zum Boden, frei hängend auf einer Platte (auch am Hang)", "Balcony and roof terrace: a railing of metal, glass or wood, supports down to the ground, hanging free on a plate (also on a slope)",
  ["balcony"], since="4.63.0")
f("windowtilt", "edit", "Fenster mit zwei Kontakten: gekippt und offen", "A window with two contacts: tilted and open", ["window-tilt"], since="4.59.0")
f("storeystairs", "edit", "Geschosshöhe je Haus, Stufen je Etage, L-Treppe mit 2. Ecke (unten und oben gewendelt)", "Storey height per house, steps per floor, L stair with a 2nd corner (winders at both ends)",
  ["stairs-storey"], since="4.68.0")
f("tiltangle", "edit", "Kippwinkel eines Fensters (5° bis 45°, auch für alle Fenster) und Flügelrahmen mit Griff", "Tilt angle of a window (5° to 45°, also for every window) and a sash with a handle",
  ["window-tilt"], since="4.64.0")
f("roomarea", "edit", "Raumname aus einem Home-Assistant-Bereich oder eigener Name, Räume verknüpfen", "Room name from a Home Assistant area or an own name, link rooms",
  ["room-area"], since="4.69.0")
f("energybuildings", "edit", "⚡ Strom je Gebäude: eigene Rechnung für jedes Gebäude eines Plans, oben umschalten, alle getrennt, vergleichen",
  "⚡ Power per building: a calculation of its own for each building of a plan, switch at the top, all apart, compare", ["energy-buildings"], since="4.70.0")
f("heatpause", "pages", "⏸️ Heizplan aussetzen: gedrückt halten am Thermostat, wie lange, selbst regeln, je Benutzer und je Karte",
  "⏸️ Pause the schedule: hold on the thermostat, how long, regulate by hand, per user and per card", ["heat-pause"], since="4.71.0")
f("buildingpages", "pages", "🏘 Oben ein Gebäude wählen: jede Seite und jede eigene Karte zeigt nur seins, eine Seite je Gebäude",
  "🏘 Choose a building at the top: every page and own card shows only its things, a page per building", ["buildings-pages"], since="4.71.0")
f("fixedglass", "edit", "Fenster mit fester Scheibe unten oder oben (bodentief, nur oben kippen; Oberlicht), neue Art „Bodentief, unten fest“",
  "A window with fixed glass below or above (floor-length, only the top tilts; transom), new kind “Floor-length, fixed below”", ["window-fixed"], since="4.72.0")
f("stackedopenings", "edit", "Zwei Öffnungen übereinander an derselben Stelle (Fenster über der Terrassentür, mit Wand dazwischen): „＋ Fenster darüber“, „⇅ Darüber / Darunter“, jedes mit eigenem Rollladen, auch im Import",
  "Two openings one above the other at the same place (a window over the terrace door, with wall in between): “＋ Window above”, “⇅ Above / Below”, each with its own roller shutter, also in the import", ["window-stacked"], since="5.3.0")
f("uiv2", "edit", "✨ Oberfläche 2: neue Bearbeiten-Leiste, umschaltbar (Abschnitte zum Auf- und Zuklappen, Fenster halb offen, Fensterarten und Böden als Bilder, Raum mit Reitern)",
  "✨ Oberfläche 2: a new edit panel, switchable (sections that fold, the window half open, kinds of window and floors as pictures, a room with tabs)", ["ui-v2"], since="4.73.0")
f("uiv2house", "edit", "✨ Oberfläche 2: nichts ausgewählt = das Haus als Baum (Etagen ziehen, Räume antippen), eine Etage mit Art als Knöpfen und Geschosshöhe von der Seite",
  "✨ Oberfläche 2: nothing selected = the house as a tree (drag floors, tap rooms), a floor with its kind as buttons and the storey height from the side", ["ui-v2-house"], since="5.0.0")
f("uiv2tools", "edit", "✨ Oberfläche 2: Einstellung suchen, Abschnitte als Reiter an der Leiste (Seitenfach), „⇉ Übernehmen“ für andere Fenster, Türen, Räume, Geräte",
  "✨ Oberfläche 2: find a setting, sections as tabs on the panel (side drawer), “⇉ Pass on” to other windows, doors, rooms, devices", ["ui-v2-tools"], since="5.0.0")
f("roofeditor", "edit", "🔺 Das neue Dach: Klick aufs Dach öffnet es, Dachform als Bilder, Dach von der Seite zum Ziehen (Neigung, Firsthöhe, Kniestock, Überstand, Stehhöhe), Gauben und Dachfenster von oben und im 3D-Bild ziehen, Vorlagen mit L-Dach und Kreuzdach (+), eigenes Dach merken",
  "🔺 The new roof: a click on the roof opens it, roof shapes as pictures, the roof from the side to drag (pitch, ridge height, knee wall, overhang, headroom), dormers and roof windows dragged from above and in 3D, templates with an L roof and a cross roof (+), keep your own roof", ["roof-editor"], since="5.1.0")
f("roomlock", "edit", "🔒 Räume sperren (Wände, Ecken, nach Wahl Fenster, Türen, Geräte, Einstellungen; Raum, Etage oder Haus), „Grundriss fertig“ für alles (nur Admins entsperren), Streifen im 3D-Bild ausblendbar",
  "🔒 Lock rooms (walls, corners, as chosen windows, doors, devices, settings; room, floor or house), “Floor plan finished” for everything (only admins unlock), stripes in 3D can be hidden", ["room-lock", "objlist"], since="5.1.0")
f("channels", "settings", "Normal und Beta: zwei Add-ons im Store; die Beta bekommt jede neue Version sofort und pausiert, solange das normale läuft (⏸ Beta pausiert)",
  "Normal and Beta: two add-ons in the store; the beta gets every new version at once and pauses while the normal one runs (⏸ Beta paused)",
  why="geschieht im Store von Home Assistant, die Demo hat kein zweites Add-on; das Schild oben zeigt „Beta“ (Video „Version und Prüfsumme“)",
  since="5.2.0")
