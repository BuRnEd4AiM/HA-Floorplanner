"""More search words for the video guide: what people type when they look for a clip (the owner, 2026-11-03: "dass man die besser
findet, wenn man oben was sucht … pro Video mehr Tags … wenn Leute ein anderes Wort verwenden als es ist, dass dann trotzdem das
richtige Video kommt").

TAGS: for every clip (id from tools/guide/clips_*.py) more words in German and in English, besides the `keys` in the clip: other
words for the same thing, everyday words ("Lampe heller machen"), what you would ask ("Wo sehe ich, ob ein Fenster offen ist?"),
brands, common spellings and typing mistakes. Only words: their order and the little words (wie, ich, the …) do not count.

SYN: groups of words with the same meaning. A word of the search also finds every other word of its group in every clip
(Rollo → Rollladen, Jalousie, shutter …). A word is in one group at most.

The page searches them with tools/guide/search.js (make_guide.py --site writes both into guide.json and index.html). Changing this
file needs no new videos: the workflow "Demo" puts it on the page. tests/test_make_guide.py: every clip has a line here with enough
words; tests/test_guide_search.py: what people type finds the right clip.
"""

TAGS = {}


def t(cid, de, en):
    TAGS[cid] = {"de": " ".join(de.split()), "en": " ".join(en.split())}


# ---------- first steps (clips_start.py) ----------
t("orbit",
  "3D-Ansicht bewegen umsehen herumgehen rundherum Perspektive Blickwinkel näher ran ranzoomen rauszoomen heranzoomen vergrößern "
  "verkleinern Mausrad Linksklick Rechtsklick ziehen wischen zwei Finger Touchpad Kamera zurücksetzen alles sehen ganzes Haus "
  "zentrieren Übersicht verdreht verloren Startansicht",
  "move the 3D view look around walk around orbit perspective angle closer zoom in zoom out mouse wheel left click right click "
  "drag swipe two fingers pinch touchpad reset camera see everything centre center overview lost start view")
t("floors",
  "Etage wechseln Stockwerk umschalten Geschoss Obergeschoss OG Erdgeschoss EG Untergeschoss Dachgeschoss Keller Dachboden "
  "oben unten nach oben alle Etagen auf einmal Gesamtansicht ganzes Gebäude Grundstück Ebene",
  "switch floor change storey upstairs downstairs ground floor first floor upper floor basement cellar attic loft level "
  "all floors at once whole building overview plot")
t("views",
  "2D-Ansicht Draufsicht Vogelperspektive von oben Plan Grundriss flach 3D-Ansicht dreidimensional geteilt zweigeteilt "
  "beide gleichzeitig nebeneinander umschalten wechseln Ansicht",
  "2D view top view bird's eye view from above plan floor plan flat 3D view three dimensional split screen both at once "
  "side by side switch toggle view")
t("viewmenu",
  "Wände ausblenden Wände unsichtbar Wände durchsichtig transparent Glas reinschauen hineinsehen Dach ausblenden Dach weg "
  "Schnitt aufgeschnitten Puppenhaus Röntgen Wände niedriger Etagen übereinander gestapelt Schilder ausblenden Beschriftung "
  "Namen ausblenden Kacheln ausblenden Darstellung Ansicht ändern",
  "hide walls invisible walls transparent glass look inside hide roof no roof cut away cutaway section doll house x-ray "
  "lower walls floors stacked hide labels hide names hide tiles display change the view")
t("room",
  "Raum anklicken Raum antippen Zimmer öffnen Raumansicht Raumkarte alles im Raum alle Lampen im Raum Raum ausschalten "
  "Wohnzimmer Küche Bad Schlafzimmer Büro Kinderzimmer heranfahren Seitenleiste rechts schließen",
  "click a room tap a room open a room room view room card everything in a room all lamps of a room switch a room off "
  "living room kitchen bathroom bedroom office kids room fly to side panel close")
t("search",
  "Lupe Suchfeld finden wo ist Gerät suchen Lampe finden Sensor finden Steckdose Name eintippen schnell finden zeigen "
  "Wo ist die Stehlampe",
  "magnifier search box find where is find a device find a lamp find a sensor plug type a name quick find show me where")
t("voice",
  "Sprachsteuerung Spracheingabe sprechen reden Mikrofon Frage stellen fragen Sprachassistent Assist Alexa Siri Google "
  "per Stimme sagen Licht per Sprache ausschalten welche Fenster sind offen wie warm ist es Antwort",
  "voice control speech speak talk microphone mic ask a question voice assistant Assist Alexa Siri Google say it "
  "switch the light off by voice which windows are open how warm is it answer")
t("colors",
  "Wärmebild Heatmap Raumtemperatur farbig Farben Räume einfärben Luftfeuchtigkeit Feuchtigkeit Schimmel feucht trocken "
  "Luftqualität CO2 schlechte Luft lüften Frischluft warm kalt rot blau Thermometer Klima Übersicht",
  "heat map thermal room temperature coloured coloured rooms humidity moisture mould mold damp dry air quality CO2 "
  "bad air ventilate fresh air warm cold red blue thermometer")
t("power",
  "Stromverbrauch Verbrauch live Leistung Watt Kilowatt Stromfluss fließender Strom Stromleitungen Leitungen Kabel "
  "Photovoltaik PV Solaranlage Einspeisung Netzbezug Batterie Speicher wer verbraucht was Stromfresser Steckdose messen",
  "power usage consumption live watts kilowatt power flow flowing power wires cables photovoltaic PV solar panels feed-in "
  "grid battery storage what uses power energy hog smart plug measure")
t("sky",
  "Himmel Tageszeit Sonnenstand Sonne Sonnenaufgang Sonnenuntergang Dämmerung Nacht Abend Sterne Mond Mondphase "
  "Vollmond Wetter Regen Schnee Gewitter Nebel Wolken bewölkt draußen echt Uhrzeit Schatten",
  "sky time of day sun position sunrise sunset dusk night evening stars moon moon phase full moon weather rain snow "
  "thunderstorm fog clouds cloudy outside real time shadow")

# ---------- controlling the house (clips_live.py) ----------
t("light",
  "Licht anmachen Licht ausmachen einschalten ausschalten Lampe schalten heller dunkler Helligkeit Dimmer gedimmt "
  "Lichtfarbe Farbe ändern RGB bunt Farbtemperatur warmweiß kaltweiß Weißton Glühbirne Leuchte Deckenlampe Stehlampe "
  "Hue Shelly Zigbee Kugel antippen Lampe steuern",
  "turn the light on turn the light off switch on switch off lamp brighter darker brightness dimmer dimmed light colour "
  "change colour RGB colourful colour temperature warm white cold white white tone bulb fixture ceiling lamp floor lamp "
  "Hue Shelly Zigbee tap the ball control a lamp")
t("lightgroups",
  "alle Lichter aus alles aus Licht vergessen brennt noch Lampen an Übersicht wie viele Lampen an welche Lampen brennen "
  "Bereich ausschalten Etage ausschalten Gruppe Lichtgruppe Zähler oben",
  "all lights off everything off light left on still on lamps on overview how many lamps are on which lamps are on "
  "switch an area off switch a floor off group light group counter at the top")
t("shutter",
  "Rollladen hoch Rollladen runter Rollo Rollos Jalousie Jalousien Raffstore Lamellen Markise Fensterladen Sonnenschutz "
  "hochfahren herunterfahren runterlassen öffnen schließen anhalten Stopp abdunkeln Sichtschutz Verdunkelung Cover Shelly",
  "shutter up shutter down roller shutter blind blinds venetian blind slats awning window shutter sun protection raise "
  "lower open close stop darken privacy blackout cover")
t("heating",
  "Heizung an Heizung aus Temperatur einstellen wärmer kälter Grad Celsius Solltemperatur Wunschtemperatur Heizkörper "
  "Radiator Thermostat Heizkörperthermostat Fußbodenheizung Klimaanlage kühlen Vorwahl Komfort Eco Boost Auto Modus",
  "heating on heating off set the temperature warmer colder degrees target temperature radiator thermostat TRV "
  "underfloor heating air conditioning cooling preset comfort eco boost auto mode")
t("scenes",
  "Szene abspielen Szene aktivieren Szene auslösen Stimmung Lichtstimmung Fernsehabend Filmabend Gute Nacht Guten Morgen "
  "Skript ausführen Knopf unten Leiste unten Szenenleiste",
  "play a scene activate a scene trigger a scene mood lighting mood movie night TV evening good night good morning "
  "run a script button at the bottom bar at the bottom scene bar")
t("tiles",
  "Kachel Kacheln Favorit Favoriten Lieblingsgeräte Schnellzugriff schnell schalten Stern anheften Raumkacheln Temperatur "
  "auf einen Blick unten Leiste",
  "tile tiles favourite favorites favourite devices quick access switch quickly star pin room tiles temperature "
  "at a glance bottom bar")
t("devices",
  "Geräteliste alle Geräte Batterie leer Batteriestand Akku schwach Batterie wechseln nicht erreichbar offline "
  "unavailable antwortet nicht kaputt ausgefallen Übersicht Status Sensoren Zigbee Funk",
  "device list all devices battery empty battery level low battery change battery unreachable offline unavailable "
  "not responding broken dead overview status sensors Zigbee wireless")
t("open",
  "Fenster offen Tür offen geöffnet auf welche Fenster sind offen Fensterkontakt Türkontakt Kontaktsensor rotes Schild "
  "lüften vergessen zu schließen Übersicht offene",
  "window open door open opened which windows are open window contact door contact contact sensor red badge "
  "airing forgot to close overview open ones")
t("alarm",
  "Alarmanlage Alarm einschalten Alarm ausschalten scharf unscharf Urlaub verreist abwesend Einbruch Einbrecher Einbruchschutz "
  "PIN Code Passwort Sirene Verzögerung Countdown Haus verlassen Sicherheit",
  "alarm system arm disarm armed holiday vacation away burglary burglar intruder break-in PIN code password siren "
  "delay countdown leave the house security")
t("security",
  "Aufzeichnung Rückblick zurückspulen Zeitreise was war gestern was ist passiert Verlauf Historie abspielen "
  "Zeitstrahl Zeitleiste Regler Einbruch prüfen wer war da Tor Fenster Licht Tag ansehen",
  "recording look back rewind time travel what happened yesterday history play back timeline slider check a break-in "
  "who was there gate window light watch a day")
t("warnings",
  "Warnung Hinweis Meldung Regen Fenster offen Regenwarnung Unwetter Sturm Rauchmelder Feuer Brand Gasmelder Wassermelder "
  "Wasserschaden Leckage Wasser ausgelaufen Alarm rot blinkt rote Warnung Gefahr",
  "warning notice alert rain window open rain warning storm smoke detector fire gas detector water sensor water damage "
  "leak water leak alarm red blinking red warning danger")
t("ledring",
  "LED-Streifen LED Strip Lichtband Lichtleiste indirekte Beleuchtung Deckenvoute Voute Stuck Segmente Abschnitte einzeln "
  "WLED Ambilight Ring Decke",
  "LED strip light strip light band indirect lighting cove lighting ceiling cove segments sections one by one WLED "
  "ambilight ring ceiling")
t("effects",
  "Lichteffekt Effekte Animation Regenbogen Farbwechsel Nanoleaf Panels Dreiecke WLED Govee Hue Lichtshow bunt",
  "light effect effects animation rainbow colour change Nanoleaf panels triangles WLED Govee Hue light show colourful")
t("doorbell",
  "Klingel Türklingel klingelt Besuch Gast Haustür Türsprechanlage Gegensprechanlage Video-Türklingel Ring Doorbird "
  "Kamera an der Tür Gong Ton Tür öffnen Türöffner Summer Tablet zeigt",
  "bell doorbell rings visitor guest front door intercom video doorbell Ring Doorbird camera at the door chime sound "
  "open the door door opener buzzer tablet shows")
t("usedby",
  "wird benutzt wer benutzt wer schaltet wer steuert warum geht die Lampe an Automation Automatisierung Skript Szene Regel "
  "welche Automationen Abhängigkeiten verknüpft Lupe",
  "used by who uses who switches who controls why does the lamp turn on automation script scene rule which automations "
  "dependencies linked magnifier")

# ---------- the pages (clips_pages.py) ----------
t("today",
  "Startseite Tagesübersicht Morgen Uhrzeit Datum Wetterbericht Vorhersage Bahn Zug Abfahrt Verspätung Pendeln Müllabfuhr "
  "Mülltonne Abfall Biotonne gelber Sack Kalender Termine Geburtstag Wetter",
  "home page day overview morning time date weather forecast train departure delay commute bin collection bins rubbish "
  "trash garbage calendar appointments birthday weather")
t("energy",
  "Stromkosten Kosten Euro Strompreis Stromverbrauch Verbrauch Zähler kWh Kilowattstunden Photovoltaik PV Solar "
  "Solaranlage Eigenverbrauch Einspeisung Netz Batteriespeicher Statistik Diagramm Balken Woche Monat Jahr Energie",
  "electricity cost cost price power consumption usage meter kWh kilowatt hours photovoltaic PV solar self-consumption "
  "feed-in grid home battery statistics chart bars week month year energy")
t("energy-houses",
  "zweites Haus mehrere Häuser Ferienhaus Einliegerwohnung Mieter Eltern Häuser vergleichen Vergleich nebeneinander "
  "alle zusammen Summe eigene Zähler Strompreis pro Haus Kosten je Haus Verbrauch je Haus welches Haus braucht wie viel",
  "second house several houses holiday home granny flat tenant parents compare houses comparison side by side all "
  "together sum own meters electricity price per house cost per house usage per house which house uses how much")
t("climate",
  "Raumklima alle Thermostate Temperaturen Übersicht Heizung Klimaanlage Luftfeuchtigkeit CO2 Luftqualität lüften "
  "Hinweis kalt warm Grad",
  "room climate all thermostats temperatures overview heating air conditioning humidity CO2 air quality ventilate "
  "notice cold warm degrees")
t("heatplan",
  "Heizplan Zeitplan Wochenplan Heizzeiten Heizprofil Zeitsteuerung Nachtabsenkung Absenkung morgens abends Wochenende "
  "Uhrzeiten Schedule Komfort Eco Nacht",
  "heating schedule schedule weekly plan heating times heating profile timer night setback setback morning evening "
  "weekend times comfort eco night")
t("heatrules",
  "Heiz-Regeln Regel Fenster auf Heizung aus Fenster offen Heizung ausschalten lüften Abwesenheit niemand zu Hause "
  "Sommer Nacht Raumfühler externer Sensor zu warm Vorrang Automatik Heizung sparen Energie sparen",
  "heating rules rule window open heating off switch heating off airing away nobody home summer night room sensor "
  "external sensor too warm priority automatic save heating save energy")
t("cameras",
  "Kamera Überwachungskamera Kamerabild Livebild Video Stream Bewegung Bewegungsmelder Garten Einfahrt Haustür "
  "Reolink Unifi Frigate Vollbild groß",
  "camera security camera CCTV camera picture live picture video stream motion motion sensor garden driveway front door "
  "Reolink Unifi Frigate full screen large")
t("media",
  "Musik abspielen Musik hören Lautstärke lauter leiser Pause weiter nächstes Lied Radio Radiosender Internetradio "
  "Lautsprecher Box Sonos Spotify Fernseher TV Fernsehen Media Player Chromecast",
  "play music listen to music volume louder quieter pause play next song radio radio station internet radio speaker "
  "Sonos Spotify television TV media player Chromecast")
t("household",
  "Haushalt Waschmaschine fertig Wäsche Trockner Spülmaschine Geschirrspüler Saugroboter Staubsauger Roborock Roomba "
  "Mähroboter Rasenmäher Bewässerung Garten gießen Einkaufsliste Einkauf einkaufen Auto laden",
  "household washing machine done laundry dryer dishwasher robot vacuum vacuum cleaner Roborock Roomba robot mower "
  "lawn mower irrigation water the garden shopping list groceries shopping charge the car")
t("cars",
  "Auto Autos zweites Auto drittes Auto Elektroauto E-Auto Ladestand Akku Batterie Reichweite Wallbox laden Ladestation "
  "Tesla Hybrid Fahrzeug Fahrzeuge weiteres Auto hinzufügen",
  "car cars second car third car electric car EV state of charge battery range wallbox charging charger Tesla hybrid "
  "vehicle vehicles add another car")
t("routines",
  "Abläufe Routinen Automationen Übersicht Knöpfe Ich gehe Haus verlassen Gute Nacht Schlafen Räume sortiert "
  "Automatisierung an aus",
  "routines automations overview buttons I am leaving leave the house good night sleep sorted by room automation on off")
t("flow",
  "Automation erstellen Automatisierung anlegen Ablauf erstellen eigene Regel wenn dann Bedingung Auslöser Aktion "
  "Bausteine Zeitschaltuhr zu einer Uhrzeit Sonnenuntergang Rollladen automatisch Licht automatisch Blockly ohne YAML",
  "create an automation make an automation create a routine own rule if then when then condition trigger action blocks "
  "timer at a time sunset shutter automatically light automatically no YAML")
t("family",
  "Familie Personen wer ist zu Hause Anwesenheit abwesend unterwegs Standort Handy Ortung Raum Pinnwand Notizen Zettel "
  "Nachricht Kinder",
  "family people who is home presence away on the way location phone tracking room pinboard notes note message kids")
t("log",
  "Protokoll Logbuch Verlauf Historie wer hat das Licht angemacht wer war das was ist passiert Uhrzeit Ereignisse "
  "Filter gestern Liste",
  "log logbook history who turned on the light who did that what happened time events filter yesterday list")
t("buttons",
  "eigene Seite Knöpfe Buttons Tasten Schalter Fernbedienung Dashboard Bedienfeld große Knöpfe lange drücken Lichter "
  "mehrere Lampen",
  "own page buttons keys switches remote control dashboard control panel big buttons long press lights several lamps")
t("heatdiag",
  "Protokoll Heizung Heizungsprotokoll Diagnose warum heizt es nicht warum ist es kalt Fehler suchen Thermostat dreht "
  "Problem Bericht kopieren Support Regeln Verlauf",
  "heating log diagnosis why is it not heating why is it cold troubleshoot thermostat turns problem copy report support "
  "rules history")
t("specialdays",
  "Feiertage Feiertag Heiligabend Weihnachten Silvester Ostern Urlaub Ferien Schulferien Kalender Ausnahme Ausnahmetag "
  "freier Tag anders Wochenende",
  "public holidays holiday Christmas Eve Christmas New Year's Eve Easter vacation school holidays calendar exception "
  "day off different weekend")
t("sceneedit",
  "Szene erstellen Szene anlegen neue Szene Szene speichern Lichtszene Stimmung Lampen einstellen Helligkeit Farbe "
  "Szene bearbeiten Szene ändern",
  "make a scene create a scene new scene save a scene light scene mood set the lamps brightness colour edit a scene "
  "change a scene")

# ---------- drawing the plan (clips_edit.py) ----------
t("walls",
  "Wand zeichnen Wände ziehen Mauer Grundriss zeichnen Haus zeichnen Haus erstellen Plan erstellen neues Haus Anfang "
  "erste Schritte bauen Ecke Linie Bearbeiten-Modus Editor Außenwand Innenwand Trennwand",
  "draw a wall draw walls wall draw a floor plan draw a house create a house make a plan new house getting started "
  "build corner line edit mode editor outer wall inner wall partition")
t("rooms",
  "Raum erstellen Raum anlegen Zimmer Raumname benennen umbenennen Quadratmeter m² Wohnfläche Größe Fläche berechnen "
  "Räume automatisch erkennen",
  "create a room add a room room name name rename square metres m2 living area size area calculate find rooms "
  "automatically")
t("openings",
  "Tür einsetzen Fenster einsetzen Tür hinzufügen Fenster hinzufügen Haustür Eingangstür Terrassentür Balkontür Schiebetür "
  "Glastür Garagentor Durchgang Öffnung Loch in der Wand",
  "add a door add a window insert front door entrance door patio door balcony door sliding door glass door garage door "
  "passage opening hole in the wall")
t("window-setup",
  "Fenster einstellen Fensterflügel zweiflügelig Anschlag links rechts Kippfenster Drehkippfenster Festverglasung "
  "Fensterkontakt verbinden Rollladen Fenster Vorhang Gardine Store Rollo Fenster Sensor zuordnen",
  "set up a window window sash two panes double hinge left right tilt window tilt and turn fixed glazing link a window "
  "contact shutter on a window curtain drapes blind assign a sensor")
t("window-tilt",
  "Fenster gekippt Kippstellung Kippfenster Dreh-Kipp-Fenster zwei Sensoren zwei Kontakte Fenstergriff Griffsensor "
  "Homematic Aqara halb offen auf Kipp gelb gekippt offen zu",
  "window tilted tilt position tilt window tilt and turn two sensors two contacts window handle handle sensor Homematic "
  "Aqara half open yellow tilted open closed")
t("devices-place",
  "Gerät einfügen Gerät hinzufügen Lampe hinzufügen Sensor hinzufügen Thermostat platzieren Steckdose Schalter setzen "
  "Entität zuordnen verknüpfen Home Assistant verbinden Deckenlampe aufhängen",
  "insert a device add a device add a lamp add a sensor place a thermostat plug switch place an entity assign link "
  "connect Home Assistant hang a ceiling lamp")
t("move",
  "verschieben bewegen ziehen umstellen drehen rotieren löschen entfernen wegmachen Entf Entfernen-Taste rückgängig "
  "Strg+Z zurück wiederherstellen Fehler korrigieren Q E",
  "move drag shift turn rotate delete remove get rid of Del key undo Ctrl+Z back redo fix a mistake Q E")
t("measure",
  "messen ausmessen Maß Maße Abstand Entfernung Länge Wandlänge Wandstärke Winkel Grad rechter Winkel 90 Grad "
  "schräge Wand genau Zentimeter Meter Wand verschieben Wand drehen Maßband Lineal",
  "measure measurement dimensions distance length wall length wall thickness angle degrees right angle 90 degrees "
  "slanted wall exact centimetres metres move a wall turn a wall tape measure ruler")
t("background",
  "Grundriss hochladen Bauplan Bild hochladen Foto Scan PDF Vorlage abzeichnen nachzeichnen durchpausen Hintergrund "
  "Maßstab Plan vom Architekten Exposé",
  "upload a floor plan building plan upload a picture photo scan PDF template trace copy background scale "
  "plan from the architect brochure")
t("roof",
  "Dach erstellen Dach hinzufügen Satteldach Walmdach Flachdach Pultdach Zeltdach Dachform Dachneigung Neigung "
  "Gaube Dachgaube Dachüberstand First Traufe Ziegel",
  "add a roof create a roof gable roof hip roof flat roof shed roof pyramid roof roof shape roof pitch slope pitch "
  "dormer overhang ridge eaves tiles")
t("skylight",
  "Dachfenster Dachflächenfenster Schrägfenster Fenster in der Dachschräge Fenster im Dach ohne Gaube Velux Roto Fakro "
  "Klappfenster Schwingfenster Lichtband Oberlicht Wohndachfenster Ausstiegsfenster Größe 78 x 118 Dachfenster Kontakt "
  "Dachfenster offen Regen wie setze ich ein Dachfenster",
  "roof window skylight rooflight roof light window in the roof slope without a dormer Velux Roto Fakro top hung "
  "centre pivot window size 78 x 118 roof window contact roof window open rain how do I add a roof window")
t("roof-wing",
  "L-Dach L-förmiges Dach Winkeldach Winkelhaus zweites Dach Anbau Seitenflügel Kehle Dachkehle Verschneidung "
  "Firstrichtung First drehen 90 Grad Kniestock Drempel zwei Dächer",
  "L roof L-shaped roof angled roof second roof extension side wing valley roof valley intersection ridge direction "
  "turn the ridge 90 degrees knee wall two roofs")
t("dormer-pitch",
  "Gaube breit breite Gaube Gaubenneigung Neigung der Gaube Satteldachgaube Zwerchgiebel Zwerchhaus große Gaube "
  "Gaube flacher Gaubendach",
  "wide dormer broad dormer dormer pitch pitch of the dormer gable dormer cross gable big dormer flatter dormer "
  "dormer roof")
t("roof-gable",
  "Giebel Giebelwand Giebeldreieck Wand bis unters Dach Dachüberstand Überstand Ortgang Pultdach Vordach Überdachung "
  "Terrassendach Carport Eingangsdach Hauseingang",
  "gable gable wall gable triangle wall up to the roof roof overhang overhang verge shed roof canopy porch roof "
  "terrace roof carport entrance roof")
t("stairs",
  "Treppe einfügen Treppe hinzufügen Treppe bauen Treppenhaus gerade Treppe Wendeltreppe Spindeltreppe L-Treppe "
  "U-Treppe Wandtreppe Stufen Treppenloch Deckenöffnung nach oben nach unten",
  "add a staircase add stairs build stairs stairwell straight stairs spiral staircase L stairs U stairs wall stairs "
  "steps stair opening hole in the ceiling up down")
t("stairs-winder",
  "gewendelte Treppe viertelgewendelt halbgewendelt Wendelstufen Keilstufen Treppe mit Kurve Ecke Podest Zwischenpodest "
  "Kellertreppe Lauf massive Treppe Blockstufen",
  "winder stairs quarter turn half turn winders wedge steps stairs with a turn corner landing basement stairs flight "
  "solid stairs block steps")
t("plot",
  "Grundstück anlegen Garten zeichnen Rasen Wiese Terrasse Weg Gehweg Einfahrt Auffahrt Pflaster Beet Teich Pool "
  "Zaun Hecke Außenbereich Hof Außenanlage",
  "create a plot draw a garden lawn grass terrace patio path walkway driveway paving flower bed pond pool fence hedge "
  "outdoor area yard landscaping")
t("balcony",
  "Balkon Balkone Balkon anlegen Balkon hinzufügen Balkongeländer Geländer Brüstung Glasgeländer Glasbalkon Holzgeländer "
  "Holzbalkon Stahlbalkon Vorstellbalkon Stützen Pfosten Säulen Balkonplatte Kragplatte Loggia Austritt Dachterrasse "
  "Terrasse oben wie mache ich einen Balkon Balkon am Hang Balkontür",
  "balcony balconies add a balcony balcony railing railing balustrade glass railing glass balcony wooden railing "
  "wooden balcony steel balcony supported balcony supports posts columns balcony slab cantilever loggia roof terrace "
  "deck upstairs how do I add a balcony balcony on a slope balcony door")
t("plot-terrain",
  "Hang Hanglage Gefälle abschüssig schräges Grundstück Gelände Höhe Höhenunterschied Höhenlinien Geländemodell "
  "Hanghaus Souterrain Keller frei Böschung Sockel Straße tiefer",
  "slope hillside gradient sloping plot terrain height height difference contour lines terrain model house on a slope "
  "walkout basement exposed basement embankment plinth street lower")
t("floors-add",
  "Etage hinzufügen neue Etage Stockwerk hinzufügen Obergeschoss anlegen Dachgeschoss anlegen Keller anlegen "
  "Untergeschoss Geschoss Etage löschen Etage umbenennen Etagenhöhe",
  "add a floor new floor add a storey create an upper floor create an attic create a basement cellar level "
  "delete a floor rename a floor floor height")
t("finishes",
  "Bodenbelag Fußboden Holzboden Laminat Parkett Fliesen Kacheln Teppich Vinyl Beton Wandfarbe streichen Tapete Putz "
  "Fliesenspiegel Material Textur Farbe ändern Raum gestalten",
  "flooring floor wooden floor laminate parquet tiles carpet vinyl concrete wall colour paint wallpaper plaster "
  "splashback material texture change colour decorate a room")
t("library",
  "Möbel einfügen Möbel hinzufügen Einrichtung einrichten Sofa Couch Bett Tisch Stuhl Schrank Küche Badewanne Dusche "
  "Waschbecken Toilette Pflanze Katalog Möbelgröße Größe ändern sperren fixieren eigenes Modell GLB Bild an der Wand",
  "add furniture insert furniture furnishing furnish sofa couch bed table chair cupboard kitchen bathtub shower sink "
  "toilet plant catalogue furniture size resize lock fix own model GLB picture on the wall")
t("closet",
  "Kleiderschrank Einbauschrank Schrank planen Schrank selbst bauen nach Maß Dachschräge Schräge Fächer Böden Schubladen "
  "Türen Kleiderstange Regal Stauraum",
  "wardrobe built-in wardrobe plan a closet build your own closet made to measure sloped ceiling slope shelves "
  "drawers doors clothes rail shelf storage")
t("houses",
  "zweites Haus mehrere Häuser Ferienhaus Ferienwohnung Wohnung Gartenhaus Nachbarhaus Eltern Haus wechseln "
  "Haus kopieren Haus umbenennen Haus löschen neues Haus Haus daneben nebeneinander Doppelhaus zwei Häuser auf einem "
  "Grundstück Anbau Brücke Lage verschieben drehen",
  "second house several houses holiday home holiday flat apartment garden house neighbour's house parents switch house "
  "copy a house rename a house delete a house new house house beside side by side semi-detached two houses on one plot "
  "annex bridge position move turn")
t("energy-calc",
  "Strom-Rechner Stromrechner Stromrechnung Rechnung einrichten Sensoren zuordnen welcher Sensor ist was Netzbezug "
  "Hausanschluss Stromzähler Smartmeter Wechselrichter Balkonkraftwerk Batteriespeicher Ladestand Hausverbrauch "
  "Zwischenstecker Unterzähler Vorzeichen falsch negativ Minus stimmt nicht geht nicht auf Energie-Dashboard übernehmen "
  "Strom-Editor Autarkie Shelly",
  "power calculator power bookkeeping set up assign sensors which sensor is what grid import house connection "
  "electricity meter smart meter inverter balcony solar home battery charge level house consumption smart plug sub-meter "
  "wrong sign negative minus does not add up energy dashboard take over power editor autarky Shelly")
t("nanoleaf-edit",
  "Nanoleaf Shapes Canvas Lines Elements Lichtpanels Lichtpaneele Wandpanels Wandleuchte Dreiecke Sechsecke Hexagon "
  "Quadrate Linien Form zeichnen Anordnung Layout ändern einrasten Panel hinzufügen Panel löschen Govee Glide Hexa",
  "Nanoleaf Shapes Canvas Lines Elements light panels wall panels wall light triangles hexagons hexagon squares lines "
  "draw the shape arrangement change the layout snap add a panel delete a panel Govee Glide Hexa")
t("objlist",
  "Objektliste alle Objekte Liste aller Geräte Liste aller Möbel finden auswählen markieren sperren gesperrt "
  "versteckt wiederfinden Übersicht",
  "object list all objects list of all devices list of all furniture find select highlight lock locked hidden "
  "find again overview")
t("toolbar",
  "Werkzeugleiste Symbolleiste Werkzeuge ausblenden Werkzeuge sortieren Reihenfolge ändern Leiste aufräumen weniger "
  "Knöpfe Mehr Menü zurücksetzen Stift",
  "tool bar toolbar hide tools sort tools change the order tidy up the bar fewer buttons more menu reset pencil")
t("import",
  "importieren Import Export JSON Datei KI künstliche Intelligenz ChatGPT Claude Gemini Copilot Text beschreiben "
  "Haus aus Text automatisch bauen GeoJSON Prompt Vorlage Beispiel",
  "import export JSON file AI artificial intelligence ChatGPT Claude Gemini Copilot text describe house from text "
  "build automatically GeoJSON prompt template example")

# ---------- designing pages (clips_dash.py) ----------
t("addcard",
  "Karte hinzufügen Widget hinzufügen Seite bearbeiten Dashboard anpassen Thermostat-Karte Licht-Karte Verlauf Diagramm "
  "Graph Sensor anzeigen neue Karte",
  "add a card add a widget edit a page customise the dashboard thermostat card light card history chart graph "
  "show a sensor new card")
t("arrange",
  "Karten verschieben Karten sortieren Karte ausblenden Karte verstecken Karte einblenden Layout Raster frei anordnen "
  "Größe der Karte Anordnung Seite gestalten",
  "move cards sort cards hide a card show a card again layout grid arrange freely card size arrangement design a page")
t("tabs",
  "Reiter Tabs Leiste unten Menü unten Seiten sortieren Reihenfolge Seite hinzufügen Seite löschen Seite umbenennen "
  "Navigation eigene Seite",
  "tabs bottom bar bottom menu sort pages order add a page delete a page rename a page navigation own page")
t("scenebar-edit",
  "Szenenleiste bearbeiten Szenen auswählen Szenen sortieren Symbol ändern Icon Farbe Skripte Leiste unten je Seite "
  "eigene Szenen",
  "edit the scene bar choose scenes sort scenes change the icon icon colour scripts bottom bar per page own scenes")
t("variants",
  "für jeden anders Kinder Eltern Gast eigene Ansicht Benutzer Person Fassung Version der Seite ansehen als "
  "Kinderansicht Rechte",
  "different for everyone children parents guest own view user person variant version of a page view as kids view "
  "rights")

# ---------- settings (clips_settings.py) ----------
t("language",
  "Sprache ändern Deutsch Englisch Französisch Spanisch Italienisch Niederländisch Polnisch Chinesisch Dark Mode "
  "Dunkelmodus dunkles Design helles Design Hologramm Aussehen Theme Einheiten Meter Fuß Celsius Fahrenheit",
  "change the language German English French Spanish Italian Dutch Polish Chinese dark mode dark design light design "
  "hologram look theme units metres feet Celsius Fahrenheit")
t("settings-search",
  "Einstellung suchen Einstellungen durchsuchen Option finden wo finde ich Zahnrad Optionen Konfiguration Leistung "
  "Schatten Qualität",
  "search the settings find an option where do I find gear options configuration performance shadows quality")
t("users",
  "Benutzer Benutzerverwaltung Rechte Berechtigungen Admin Gast Kinder sperren nur ansehen Wandtablet einrichten "
  "Startraum Seiten freigeben Zugriff wer darf was",
  "users user management rights permissions admin guest children lock view only set up a wall tablet start room "
  "share pages access who may do what")
t("backup",
  "Sicherung Datensicherung Backup erstellen sichern speichern exportieren wiederherstellen zurückspielen einspielen "
  "Restore Umzug neuer Rechner Daten verloren Datei herunterladen hochladen",
  "backup make a backup save export restore bring back import move to a new computer data lost download a file "
  "upload a file")
t("fullscreen",
  "Vollbild Vollbildmodus Kiosk Kioskmodus ohne Leisten ohne Menü Bildschirm füllen Tablet an der Wand sperren Code "
  "beenden",
  "full screen fullscreen mode kiosk kiosk mode no bars no menu fill the screen tablet on the wall lock code exit")
t("kiosk",
  "Wandtablet einrichten Tablet an der Wand Startansicht zurück zum Start Bildschirmschoner dimmen nachts dunkel "
  "Energiesparmodus sparsam langsames Tablet altes Tablet Fire Tablet Display",
  "set up a wall tablet tablet on the wall start view back to start screen saver dim at night dark power saving "
  "economy slow tablet old tablet Fire tablet display")
t("notify",
  "Benachrichtigung Push Push-Nachricht Nachricht aufs Handy WhatsApp Telegram CallMeBot Companion App Meldung "
  "Rauchalarm Wasseralarm Einbruch informieren Testnachricht",
  "notification push push message message to my phone WhatsApp Telegram CallMeBot companion app alert smoke alarm "
  "water alarm burglary inform test message")
t("version",
  "Version Update aktualisieren aktuell neueste Version Prüfsumme Cache leeren neu laden alter Stand veraltet "
  "Browser Cache Fehler nach Update",
  "version update upgrade up to date latest version checksum clear the cache reload old version outdated browser cache "
  "problem after an update")

# ---------- phone and tablet (clips_phone.py) ----------
t("phone-house",
  "Handy Smartphone iPhone Android Mobil unterwegs App Companion App Home Assistant App Touch tippen Finger zoomen "
  "zwei Finger drehen klein Bildschirm",
  "phone smartphone iPhone Android mobile on the go app companion app Home Assistant app touch tap finger zoom "
  "two fingers turn small screen")
t("phone-pages",
  "Handy Seiten wechseln wischen Leiste unten Menü Handy Energie Klima Heute App Smartphone",
  "phone switch pages swipe bottom bar phone menu energy climate today app smartphone")
t("phone-edit",
  "am Handy bearbeiten am Handy zeichnen Wand am Handy Smartphone Editor mobil bearbeiten Tablet bearbeiten Menü "
  "Werkzeuge wischen Finger Fenster Kontakt zuordnen",
  "edit on the phone draw on the phone wall on the phone smartphone editor edit on mobile edit on a tablet menu tools "
  "swipe finger window assign a contact")


# ---------- words with the same meaning ----------
SYN = [g.split() for g in """
licht lampe lampen leuchte leuchten beleuchtung glühbirne birne leuchtmittel light lights lamp lamps bulb lighting
dimmen dimmer gedimmt heller dunkler helligkeit dim dimming brighter darker brightness
farbe farben färben bunt farbig rgb colour color colours colors coloured colored
rollladen rollläden rolladen rollo rollos jalousie jalousien raffstore lamellen shutter shutters blind blinds cover
vorhang vorhänge gardine gardinen store curtain curtains drapes
heizung heizen heizkörper radiator heating heizkörperthermostat trv
klimaanlage klimagerät kühlen cooling aircon conditioner
etage etagen stockwerk stockwerke geschoss geschosse ebene storey storeys story stories level levels
keller untergeschoss souterrain basement cellar
dachboden dachgeschoss spitzboden attic loft
tür türen tor türe door doors gate
fenster window windows
wand wände mauer wall walls
raum räume zimmer room rooms
möbel einrichtung mobiliar furniture
schrank kleiderschrank wardrobe closet cupboard
handy smartphone telefon iphone android mobil mobile phone
tablet tablets ipad
kamera kameras überwachungskamera webcam camera cameras cctv
klingel türklingel klingeln doorbell bell
alarmanlage einbruch einbrecher einbruchschutz burglar burglary intruder
musik lautsprecher music speaker speakers sonos spotify
fernseher fernsehen tv television telly
strom stromverbrauch energie electricity energy
solar photovoltaik pv solaranlage solarstrom photovoltaic
szene szenen stimmung scene scenes mood
ablauf abläufe automation automationen automatisierung routine routines
löschen entfernen wegmachen delete remove
rückgängig undo strg+z
verschieben bewegen umstellen move
drehen rotieren rotate turn
zeichnen malen draw sketch
grundriss bauplan floorplan blueprint
backup sicherung datensicherung wiederherstellen restore
benutzer nutzer user users account konto
einstellungen optionen konfiguration settings options preferences
benachrichtigung benachrichtigungen push nachricht notification notifications message
warnung warnungen hinweis warning warnings alert
dach dächer roof roofs
treppe treppen stiege stairs staircase stair
stufen stufe steps step
garten grundstück garden plot yard
rasen wiese gras lawn grass
hang gefälle abhang hanglage slope hillside
waschmaschine wäsche washing laundry washer
saugroboter staubsauger roboter vacuum robot roomba
auto autos wagen elektroauto pkw car cars vehicle
wallbox ladestation ladesäule charger
kalender termine termin calendar appointment appointments
müll abfall mülltonne tonne bins trash garbage rubbish waste
zug bahn train trains
wetter weather forecast vorhersage
feiertag feiertage holidays
urlaub ferien verreist vacation
vollbild kiosk fullscreen
bildschirmschoner screensaver
update aktualisieren aktualisierung upgrade
kontakt kontakte fensterkontakt türkontakt magnetkontakt contact contacts
bewegung bewegungsmelder motion pir
anwesenheit präsenz presence
rauch rauchmelder feuer smoke fire
leck leckage wasserschaden leak flood
favorit favoriten lieblings favourite favourites favorite favorites
kachel kacheln tile tiles
karte karten card cards widget widgets
seite seiten dashboard page pages
reiter tab tabs
knopf knöpfe taste tasten button buttons
einschalten anschalten anmachen ausschalten abschalten ausmachen schalten switch toggle
öffnen aufmachen open
schließen zumachen close
gekippt kippen kipp tilt tilted
messen abmessen maßband measure measuring
größe abmessung abmessungen size dimensions
sperren fixieren lock locked
ansicht sicht view perspektive perspective
durchsichtig transparent see-through
zoomen zoom vergrößern
ki chatgpt gpt ai claude gemini copilot
code pin passwort kennwort password
terrasse patio terrace
balkon balkone loggia balcony balconies
geländer brüstung balustrade railing railings
luftfeuchtigkeit luftfeuchte feuchtigkeit feuchte humidity
co2 luftqualität air
sprachsteuerung sprachsuche spracheingabe mikrofon voice microphone mic alexa siri
protokoll log logbuch verlauf history historie
kosten preis euro cost costs price
familie personen leute family people
pinnwand notiz notizen zettel pinboard note notes
einkaufsliste einkauf einkaufen shopping groceries
design theme aussehen look darkmode dunkelmodus
gaube gauben dormer dormers
giebel gable
vordach überdachung canopy porch
pultdach shed lean-to
bild foto fotos bilder picture photo image pictures photos
werkzeug werkzeuge tool tools
mond moon
regen regnet rain
temperatur temperaturen grad temperature degrees
thermostat thermostate thermostats
""".strip().splitlines()]
