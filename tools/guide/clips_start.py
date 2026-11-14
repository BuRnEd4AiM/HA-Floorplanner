"""Clips of the group "Erste Schritte": moving around the 3D view, floors, 2D and 3D, rooms, search, colour views."""
from recorder import clip

FREE = (1060, 430)          # a free spot of the 3D view in live mode (lawn beside the house, no card, no label)


@clip("orbit", "start",
      {"de": "3D-Ansicht drehen, schieben und zoomen", "en": "Turn, move and zoom the 3D view"},
      {"de": "Mit der Maus (oder zwei Fingern) um das Haus herumgehen, näher heran und wieder alles einpassen.",
       "en": "Walk around the house with the mouse (or two fingers), get closer and fit everything again."},
      "drehen schieben zoomen kamera maus finger einpassen ansicht turn rotate pan zoom camera mouse fit view")
def _(r):
    r.say("Linke Maustaste gedrückt halten und ziehen: das Haus dreht sich.", "Hold the left mouse button and drag: the house turns.")
    r.drag(*FREE, FREE[0] - 260, FREE[1] + 30, ms=1600)
    r.wait(500)
    r.say("Mit dem Mausrad gehst du näher heran.", "The mouse wheel brings you closer.")
    r.move(720, 400)
    r.wheel(-900, steps=12, ms=1400)
    r.wait(500)
    r.poster()
    r.say("Rechte Maustaste ziehen: das Bild verschiebt sich.", "Drag with the right mouse button: the picture moves.")
    r.drag(760, 420, 600, 360, ms=1100, button="right")
    r.wait(600)
    r.say("„Einpassen“ zeigt wieder das ganze Haus.", "“Fit” shows the whole house again.")
    r.click("#fitBtn")
    r.wait(1800)


@clip("floors", "start",
      {"de": "Etagen wechseln und das ganze Haus", "en": "Switch floors and see the whole house"},
      {"de": "Links stehen alle Etagen vom Keller bis zum Dach. Ein Tipp zeigt die Etage, „Ganzes Haus“ alle zusammen.",
       "en": "All floors from the basement to the roof are on the left. A tap shows one floor, “Whole house” all of them."},
      "etage stockwerk keller dach obergeschoss ganzes haus floor storey basement roof whole house")
def _(r):
    r.say("Links siehst du alle Etagen deines Hauses.", "On the left you see every floor of your house.")
    r.move("#floorRail .floorThumb[data-floor='2']")
    r.wait(700)
    r.say("Ein Tipp auf eine Etage zeigt sie im 3D-Bild.", "Tap a floor to show it in the 3D view.")
    r.click("#floorRail .floorThumb[data-floor='2']")
    r.wait(1800)
    r.click("#floorRail .floorThumb[data-floor='0']")
    r.wait(1800)
    r.say("„Ganzes Haus“ zeigt alle Etagen und das Grundstück zusammen.", "“Whole house” shows every floor and the plot together.")
    r.click("#floorRail .railHouse")
    r.wait(2200)
    r.poster()
    r.say("Zurück ins Erdgeschoss.", "Back to the ground floor.")
    r.click("#floorRail .floorThumb[data-floor='1']")
    r.wait(1800)


@clip("views", "start",
      {"de": "2D-Plan, 3D und beides nebeneinander", "en": "2D plan, 3D and both side by side"},
      {"de": "Oben umschalten: der Grundriss von oben, das 3D-Bild oder beides zugleich.",
       "en": "Switch at the top: the floor plan from above, the 3D view or both at once."},
      "2d 3d grundriss plan von oben nebeneinander split ansicht floor plan from above side by side view")
def _(r):
    r.say("Oben schaltest du zwischen 2D und 3D um.", "Switch between 2D and 3D at the top.")
    r.click("#view2d")
    r.wait(1800)
    r.say("2D zeigt den Grundriss von oben, mit Lampen und Fenstern.", "2D shows the floor plan from above, with lamps and windows.")
    r.wait(1500)
    r.say("„2D + 3D“ zeigt beides nebeneinander.", "“2D + 3D” shows both side by side.")
    r.click("#viewSplit")
    r.wait(2200)
    r.poster()
    r.say("Und zurück zum 3D-Bild.", "And back to the 3D view.")
    r.click("#view3d")
    r.wait(1600)


@clip("room", "start",
      {"de": "Einen Raum öffnen", "en": "Open a room"},
      {"de": "Ein Tipp auf den Namen eines Raums: die Kamera fährt hin, rechts öffnet sich seine Karte. Oben die Werte (Temperatur, CO₂, Strom, offene Fenster), darunter Reiter: Licht, Rollo, Klima, Geräte, Fenster. Über eine Lampe wischen dimmt sie.",
       "en": "Tap the name of a room: the camera flies there and its card opens on the right. The values on top (temperature, CO₂, power, open windows), tabs below: light, blinds, climate, devices, windows. Swiping over a lamp dims it."},
      "raum zimmer öffnen raumkarte reiter werte lampen dimmen wischen alle aus heizung klima room open card tabs values lamps dim swipe all off heating climate", sky="18:40")
def _(r):
    r.say("Tippe auf den Namen eines Raums.", "Tap the name of a room.")
    r.click("#roomLabels [data-room=r1]")
    r.wait(2000)
    r.say("Die Kamera fährt hin, rechts öffnet sich die Karte des Raums.", "The camera flies there and the room's card opens on the right.")
    r.wait(1200)
    r.poster()
    r.say("Oben stehen seine Werte: Temperatur, Luftfeuchte, CO₂, Strom und offene Fenster.", "On top its values: temperature, humidity, CO₂, power and open windows.")
    r.move("#roomPanel .rpChips")
    r.wait(1300)
    r.say("Darunter die Reiter: Licht, Rollo, Klima, Geräte, Fenster. Es ist immer nur einer offen.", "Below them the tabs: light, blinds, climate, devices, windows. Only one is open at a time.")
    r.move("#roomPanel .rpTabs")
    r.wait(1300)
    r.say("„Alle aus“ schaltet alle Lampen des Raums auf einmal.", "“All off” switches all lamps of the room at once.")
    r.move("#roomPanel button >> text=/Alle aus|All off/")
    r.wait(900)
    r.say("Über eine Lampe wischen macht sie heller oder dunkler, ein Tipp schaltet sie.", "Swiping over a lamp makes it brighter or darker, a tap switches it.")
    row = r.pg.locator("#roomPanel .rpLight.dim").first
    if row.count():
        bx = row.bounding_box()
        r.drag(bx["x"] + bx["width"] * 0.75, bx["y"] + bx["height"] / 2, bx["x"] + bx["width"] * 0.35, bx["y"] + bx["height"] / 2)
        r.wait(1500)
    r.say("„Klima“ zeigt die Heizung und was der Heizplan gerade macht.", "“Climate” shows the heating and what the heating plan does right now.")
    r.click("#roomPanel .rpTab[data-tab=climate]")
    r.wait(1800)
    r.say("Mit ✕ ist der Raum wieder zu.", "✕ closes the room again.")
    r.click("#roomPanel .rp-x")
    r.wait(1500)


@clip("search", "start",
      {"de": "Ein Gerät suchen", "en": "Find a device"},
      {"de": "Die Lupe sucht Lampen, Räume und Geräte nach Namen und zeigt, wo sie sind.",
       "en": "The magnifier finds lamps, rooms and devices by name and shows where they are."},
      "suchen suche lupe finden gerät lampe name search find magnifier device lamp")
def _(r):
    r.say("Tippe auf die Lupe.", "Tap the magnifier.")
    r.click("#findBtn")
    r.wait(700)
    r.say("Schreib, was du suchst, zum Beispiel „Stehlampe“.", "Type what you are looking for, for example “floor lamp”.")
    r.type("Stehlampe" if r.lang == "de" else "Floor lamp")
    r.wait(900)
    r.poster()
    r.say("Ein Tipp auf einen Treffer zeigt das Gerät im Haus.", "Tap a result to see the device in the house.")
    r.click("#findList li", text="Stehlampe.*Wohnzimmer")      # the lamp itself (the first row sums up all lights)
    r.wait(2400)


@clip("colors", "start",
      {"de": "Temperatur, Feuchte und CO₂ als Farbe", "en": "Temperature, humidity and CO₂ as colours"},
      {"de": "Unten umschalten: jeder Raum bekommt die Farbe seiner Temperatur, Luftfeuchte oder Luftqualität.",
       "en": "Switch at the bottom: every room gets the colour of its temperature, humidity or air quality."},
      "temperatur feuchte luftfeuchte co2 luft farbe heatmap warm kalt temperature humidity air quality colour color")
def _(r):
    r.say("Unten wählst du, was die Räume zeigen.", "At the bottom you choose what the rooms show.")
    r.click("#modeBar [data-vm=temp]")
    r.wait(1800)
    r.say("„Temp.“: warme Räume rot, kühle blau.", "“Temp.”: warm rooms red, cool rooms blue.")
    r.wait(1200)
    r.poster()
    r.say("„Feuchte“ zeigt die Luftfeuchte.", "“Humidity” shows the humidity.")
    r.click("#modeBar [data-vm=humid]")
    r.wait(2000)
    r.say("„CO₂“ zeigt, wo gelüftet werden sollte.", "“CO₂” shows where you should open a window.")
    r.click("#modeBar [data-vm=co2]")
    r.wait(2000)
    r.say("„Normal“ zeigt wieder das Haus, wie es ist.", "“Normal” shows the house as it is again.")
    r.click("#modeBar [data-vm=normal]")
    r.wait(1400)


@clip("power", "start",
      {"de": "Sehen, wo Strom fließt", "en": "See where power flows"},
      {"de": "„Strom“ zeigt den Verbrauch jedes Geräts, die Solaranlage und die Leitungen mit fließenden Punkten.",
       "en": "“Power” shows what each device uses, the solar panels and the cables with flowing dots."},
      "strom verbrauch leistung watt solar pv leitung energie power usage watt solar cable energy", sky="12:30")
def _(r):
    r.say("Tippe unten auf „Strom“.", "Tap “Power” at the bottom.")
    r.click("#powerBtn")
    r.wait(2200)
    r.poster()
    r.say("Jedes Gerät zeigt, wie viel es gerade braucht.", "Every device shows how much it uses right now.")
    r.wait(1800)
    r.say("Die Punkte fließen vom Dach und vom Netz zu den Geräten.", "The dots flow from the roof and the grid to the devices.")
    r.wait(2200)
    r.click("#powerBtn")
    r.wait(1000)


@clip("viewmenu", "start",
      {"de": "Ansicht: durchsichtig, Wände absenken, halb aufgeschnitten", "en": "View: see-through, lowered walls, half cut"},
      {"de": "„Ansicht“ unten hat mehr Arten, das Haus zu zeigen: Wände zur Kamera durchsichtig oder abgesenkt („Auto“), alle Etagen aufeinander, ein Halbschnitt, Schilder und Kacheln an oder aus.",
       "en": "“View” at the bottom has more ways to show the house: walls facing the camera see-through or lowered (“Auto”), all floors stacked, a half cut, labels and tiles on or off."},
      "Ansicht durchsichtig Wände absenken Auto aufeinander Etagen Halbschnitt Schilder Kacheln view see-through walls lower sink auto stacked floors half cut labels tiles")
def _(r):
    r.say("Unten rechts: „Ansicht“.", "Bottom right: “View”.")
    r.click("#viewMenuBtn")
    r.wait(900)
    r.say("„Durchsichtig“ ist an: die Wände zur Kamera und das Dach sind wie Glas.", "“See-through” is on: the walls facing the camera and the roof are like glass.")
    r.move("#seeToggle")
    r.wait(1800)
    r.poster()
    r.say("„Auto“ senkt diese Wände stattdessen ab.", "“Auto” lowers these walls instead.")
    r.click("#autoToggle")
    r.wait(2600)
    r.say("Zurück zu „Durchsichtig“.", "Back to “See-through”.")
    r.click("#seeToggle")
    r.wait(1600)
    r.say("„Halbschnitt“: die Wände nur halb hoch, man sieht hinein.", "“Half cut”: the walls only half high, you see inside.")
    r.click("#halfToggle")
    r.wait(1800)
    r.click("#halfToggle")
    r.wait(800)


@clip("sky", "start",
      {"de": "Himmel, Mond und Wetter", "en": "Sky, moon and weather"},
      {"de": "Der Himmel zeigt die echte Tageszeit: die Sonne, wo sie steht, nachts Sterne und den Mond, dazu Wolken, Regen oder Schnee aus deinem Wetter.",
       "en": "The sky shows the real time of day: the sun where it is, at night the stars and the moon, plus clouds, rain or snow from your weather."},
      "Himmel Sonne Mond Sterne Nacht Wetter Regen Wolken Tageszeit Sonnenuntergang sky sun moon stars night weather rain clouds time of day sunset",
      sky="21:40", query="mode=live&weather=rainy")
def _(r):
    r.say("Der Himmel hinter dem Haus ist wie draußen: hier um 21:40 Uhr, mit Regen.", "The sky behind the house is as it is outside: here at 9:40 pm, with rain.")
    r.wait(1800)
    r.say("Oben rechts: Tageszeit, Sonnenaufgang, der Mond und das Wetter.", "Top right: the time of day, sunrise, the moon and the weather.")
    r.move("#skyChips")
    r.wait(1800)
    r.poster()
    r.say("Dreh das Haus: der Mond steht da, wo er wirklich steht.", "Turn the house: the moon is where it really is.")
    r.drag(1060, 430, 820, 450, ms=1800)
    r.wait(1500)
