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
f("houses", "edit", "Mehrere Häuser", "Several houses", ["houses"])
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
