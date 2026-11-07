"""Clips of the group "Plan zeichnen" (edit mode: walls, rooms, doors and windows, devices, moving, measuring).

Most of them start in a new, empty house of the demo ("Gartenhaus"): prepared before the recording starts (prep), so the
video begins with an empty plan in 2D. The house is drawn with the same clicks a person makes."""
from pathlib import Path

from recorder import clip

# the corners of the little house, from the middle of the 2D view (CSS px)
BOX = [(-230, -150), (230, -150), (230, 150), (-230, 150)]
WALL_MID = {"top": (0, -150), "right": (230, 0), "bottom": (0, 150), "left": (-230, 0)}


def centre(r):
    bb = r.box("#view")
    return bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2


SOFA = (90, 40)      # where the sofa of the clip "move" stands (from the middle of the view)


def empty_house(walls=False, rooms=False, sofa=False):
    """prep: a new empty house in edit mode, the 2D plan; maybe with its four walls (and the room in them, a sofa) already there"""
    def prep(r):
        pg = r.pg
        pg.click("#housePanel > summary")
        pg.wait_for_timeout(300)
        r.prompt = "Gartenhaus" if r.lang == "de" else "Garden house"
        pg.click("#houseNew")
        pg.wait_for_timeout(2500)
        r.prompt = None
        if pg.locator("#welcome").is_visible():
            pg.click("#welClose")
        pg.click("#housePanel > summary")
        pg.click("#view2d")
        pg.wait_for_timeout(800)
        if walls:
            cx, cy = centre(r)
            pg.click("#tools [data-tool=wall]")
            for x, y in BOX + BOX[:1]:
                pg.mouse.click(cx + x, cy + y)
                pg.wait_for_timeout(120)
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(300)
        if rooms:
            pg.click("#autoRooms")
            pg.wait_for_timeout(800)
        if sofa:
            cx, cy = centre(r)
            pg.click("#tools [data-tool=device]")
            pg.fill("#paletteSearch", "Sofa")
            pg.wait_for_timeout(400)
            pg.click("#paletteGrid button >> nth=0")
            pg.mouse.click(cx + SOFA[0], cy + SOFA[1])
            pg.wait_for_timeout(600)
            pg.fill("#paletteSearch", "")
        pg.click("#tools [data-tool=select]")
        pg.wait_for_timeout(500)
    return prep


@clip("walls", "edit",
      {"de": "Wände zeichnen", "en": "Draw walls"},
      {"de": "Im Bearbeiten-Modus „Wand“ wählen und Punkt für Punkt klicken. Doppelklick oder Esc beendet die Wand.",
       "en": "In edit mode choose “Wall” and click point by point. A double click or Esc ends the wall."},
      "Wand Wände zeichnen Grundriss Haus bauen neu Ecke Raster wall walls draw floor plan build new corner grid",
      query="mode=edit", prep=empty_house())
def _(r):
    r.say("Oben im Bearbeiten-Modus: „Wand“.", "At the top in edit mode: “Wall”.")
    r.click("#tools [data-tool=wall]")
    r.wait(500)
    cx, cy = centre(r)
    r.say("Klicke Punkt für Punkt: jede Ecke eine Wand.", "Click point by point: every corner a wall.")
    for i, (x, y) in enumerate(BOX + BOX[:1]):
        r.click(cx + x, cy + y, ms=900 if i else 700)
        r.wait(250)
        if i == 2:
            r.poster()
    r.say("Esc beendet die Wand.", "Esc ends the wall.")
    r.key("Escape")
    r.wait(800)
    r.say("Im 3D-Bild stehen die Wände sofort.", "The walls stand in the 3D view at once.")
    r.click("#viewSplit")
    r.wait(2400)


@clip("rooms", "edit",
      {"de": "Räume erkennen und benennen", "en": "Find and name rooms"},
      {"de": "„Erkennen“ macht aus geschlossenen Wänden Räume. Ein Raum bekommt einen Namen und zählt seine Fläche.",
       "en": "“Detect” turns closed walls into rooms. A room gets a name and counts its area."},
      "Raum Räume erkennen benennen Name Fläche Quadratmeter Zimmer room rooms detect name area square metres",
      query="mode=edit", prep=empty_house(walls=True))
def _(r):
    r.say("Die Wände sind gezeichnet. „Erkennen“ findet die Räume darin.", "The walls are drawn. “Detect” finds the rooms in them.")
    r.click("#autoRooms")
    r.wait(1300)
    r.poster()
    r.say("Tippe den Raum an.", "Tap the room.")
    cx, cy = centre(r)
    r.click(cx - 60, cy + 40)
    r.wait(900)
    r.say("Rechts bekommt er einen Namen.", "On the right it gets a name.")
    name = r.loc("#propsBody input[type=text]")
    r.click(name)
    r.pg.keyboard.press("Control+A")
    r.type("Werkstatt" if r.lang == "de" else "Workshop")
    r.key("Enter")
    r.wait(1200)
    r.say("Der Name und die Fläche stehen im Plan.", "The name and the area are in the plan.")
    r.click(cx + 400, cy + 260)
    r.wait(1500)


@clip("room-area", "edit",
      {"de": "Raum nach einem Bereich aus Home Assistant benennen", "en": "Name a room after a Home Assistant area"},
      {"de": "Unter dem Namen steht „HA-Bereich“: einen Bereich aus Home Assistant wählen (der Raum heißt dann so und zeigt seine "
             "Geräte) oder „Eigener Name“. „🔗 alle verknüpfen“ ordnet alle Räume zu, die schon wie ein Bereich heißen.",
       "en": "Under the name is “HA area”: pick an area from Home Assistant (the room is then called like it and shows its devices) "
             "or “Own name”. “🔗 link them all” links every room that is already called like an area."},
      "Bereich Home Assistant Raumname umbenennen zuordnen verknüpfen eigener Name area room name rename assign link own name",
      query="mode=edit")
def _(r):
    at = lambda x, z: r.js(f"window.__fp.plan().toClient({x}, {z})")      # a point of the plan (metres) on the screen
    r.click("#view2d")
    r.wait(1000)
    r.say("Einen Raum anklicken, hier die Küche.", "Click a room, here the kitchen.")
    r.move(*at(8.6, 3.7))
    r.js("window.__fp.select('room', 'r2')")
    r.wait(600)
    r.js("document.getElementById('props').scrollIntoView({ block: 'start', behavior: 'smooth' })")   # the room's fields at the top of the side panel
    r.wait(900)
    r.say("Rechts unter dem Namen: „HA-Bereich“ mit den Bereichen aus Home Assistant.", "On the right under the name: “HA area” with the areas from Home Assistant.")
    r.click("#roomArea")
    r.wait(700)
    r.loc("#roomArea").select_option("kueche")
    r.wait(1500)
    r.poster()
    r.say("Der Raum heißt jetzt wie der Bereich und zeigt seine Geräte.", "The room is now called like the area and shows its devices.")
    r.wait(1800)
    r.say("Ein eigener Name geht trotzdem: oben eintippen, der Bereich bleibt.", "An own name still works: type it at the top, the area stays.")
    r.click("#roomName")
    r.pg.keyboard.press("Control+A")
    r.type("Wohnküche" if r.lang == "de" else "Kitchen-diner")
    r.key("Enter")
    r.wait(1600)
    r.say("„↺ Name aus Home Assistant“ holt den Namen des Bereichs zurück.", "“↺ Name from Home Assistant” brings the area's name back.")
    r.click("#roomAreaName")
    r.wait(1400)
    r.say("Heißen Räume schon wie ein Bereich: „🔗 alle verknüpfen“ ordnet sie auf einmal zu.", "Rooms already called like an area: “🔗 link them all” links them in one go.")
    r.click("#roomAreaAll")
    r.wait(2200)


@clip("openings", "edit",
      {"de": "Türen und Fenster einsetzen", "en": "Put in doors and windows"},
      {"de": "„Tür/Fenster“ wählen, die Art aussuchen und auf eine Wand klicken. Tür, Haustür, Fenster, Balkontür und mehr.",
       "en": "Choose “Door/Window”, pick the kind and click a wall. Door, front door, window, balcony door and more."},
      "Tür Fenster Haustür Balkon einsetzen Wand Öffnung Glastür Schiebetür door window front door balcony opening wall",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("Oben: „Tür/Fenster“.", "At the top: “Door/Window”.")
    r.click("#tools [data-tool=opening]")
    r.wait(700)
    r.say("Rechts die Art wählen, zum Beispiel „Haustür“.", "Choose the kind on the right, for example “Front door”.")
    r.click("#openingPalette button[data-opening=doorEntry]")
    r.wait(500)
    r.say("Mit der Maus über die Wand fahren und klicken.", "Move the mouse over the wall and click.")
    x, y = WALL_MID["bottom"]
    r.move(cx + x - 80, cy + y)
    r.wait(400)
    r.click(cx + x, cy + y, ms=500)
    r.wait(700)
    r.say("Jetzt Fenster: links „Fenster“, dann auf die Wände.", "Now windows: “Window”, then click the walls.")
    r.click("#openingPalette button[data-opening=window]")
    for side in ("top", "left"):
        x, y = WALL_MID[side]
        r.click(cx + x, cy + y)
        r.wait(500)
    r.poster()
    r.say("Im 3D-Bild sind Tür und Fenster gleich da.", "Door and windows are in the 3D view right away.")
    r.click("#viewSplit")
    r.wait(2600)


FRONT_WALL = "(f) => f.walls.reduce((a, b) => (a.a[1] + a.b[1] >= b.a[1] + b.b[1] ? a : b))"   # the wall at the bottom of the 2D plan


def window_room(r):
    """prep: an empty house with one window of one pane in its front wall, seen in 3D from inside the room"""
    empty_house(walls=True, rooms=True)(r)
    r.pg.evaluate("""() => {
      const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], w = (%s)(f), len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      w.openings.push({ id: 'guideWin', type: 'window', style: 'single', pos: len / 2, width: 1.8, height: 1.4, sill: 0.8 });
      fp.rebuild();
    }""" % FRONT_WALL)
    r.pg.click("#view3d")
    r.pg.wait_for_timeout(900)
    r.pg.evaluate("""() => {
      const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], w = (%s)(f);
      const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2, zs = f.walls.flatMap((x) => [x.a[1], x.b[1]]);
      const cz = (Math.min(...zs) + Math.max(...zs)) / 2, back = Math.max(3, Math.min(5, (mz - cz) * 1.6));
      fp.camAt(mx, 1.75, mz - back, mx, mz + 12);                 // inside the room at eye height, looking out through the window
    }""" % FRONT_WALL)
    r.pg.wait_for_timeout(900)


@clip("window-setup", "edit",
      {"de": "Ein Fenster einstellen: Flügel, Rollladen, Vorhang", "en": "Set up a window: panes, shutter, curtain"},
      {"de": "Ein Fenster anklicken: wie viele Flügel, wo jeder Flügel angeschlagen ist (kippen, links, rechts oder fest), der Kontakt aus Home Assistant (und auf Wunsch ein zweiter für „gekippt“), dazu ein Rollladen oder ein Vorhang, der nach links, rechts oder zur Mitte aufgeht.",
       "en": "Click a window: how many panes, where each pane is hinged (tilt, left, right or fixed), the contact from Home Assistant (and, if you like, a second one for “tilted”), and a roller shutter or a curtain that opens to the left, the right or from the middle."},
      "Fenster Flügel Fensterflügel Anschlag kippen Drehflügel fest Kontakt Fensterkontakt Rollladen Rolladen Vorhang Gardine aufziehen mittig window pane sash hinge tilt turn fixed contact sensor shutter blind curtain",
      query="mode=edit", prep=window_room)
def _(r):
    r.say("Klicke das Fenster an: rechts stehen seine Einstellungen.", "Click the window: its settings are on the right.")
    p = r.js("window.__fp.openingCenter('guideWin')")
    r.click(p["x"], p["y"])
    r.wait(1200)
    r.say("„Anzahl Flügel“: 2 macht zwei Flügel daraus.", "“Panes”: 2 makes two panes of it.")
    r.click("#winPanes")
    r.pg.keyboard.press("Control+A")
    r.type("2")
    r.key("Tab")
    r.wait(1400)
    r.say("Jeder Flügel hat seinen Anschlag: der linke geht links auf …", "Each pane has its hinge: the left one opens on the left …")
    r.click("#winHinge1")
    r.loc("#winHinge1").select_option("left")
    r.wait(900)
    r.say("… der rechte rechts. „Fest“ wäre ein Flügel, der nie aufgeht.", "… the right one on the right. “Fixed” would be a pane that never opens.")
    r.click("#winHinge2")
    r.loc("#winHinge2").select_option("right")
    r.wait(1200)
    r.say("Der Kontakt aus Home Assistant: ist er offen, steht das Fenster auch im Bild offen.", "The contact from Home Assistant: when it is open, the window is open in the picture too.")
    r.click("#propsBody .entPicker input[type=search]", nth=0)
    r.type("fenster wohn" if r.lang == "de" else "fenster wohn")
    r.wait(500)
    r.click("#propsBody .entItem[data-id='binary_sensor.fenster_wohnzimmer']")
    r.wait(2200)
    r.say("Darunter „Kontakt gekippt“: ein zweiter Sensor für ein Dreh-Kipp-Fenster (eigenes Video).", "Below it “Tilt contact”: a second sensor for a tilt-and-turn window (a video of its own).")
    r.move("#tiltContact")
    r.wait(1600)
    r.say("„Vorhang / Rollladen“ anhaken.", "Tick “Curtain / roller shutter”.")
    r.click("#openShutter")
    r.wait(1200)
    r.say("„Vorhangart“: ein Rollladen, ein Vorhang nach links oder rechts, oder einer, der sich in der Mitte teilt.",
          "“Curtain type”: a roller shutter, a curtain to the left or the right, or one that parts in the middle.")
    r.click("#curtainStyle")
    r.loc("#curtainStyle").select_option("split")
    r.wait(1800)
    r.say("Darunter der Rollladen oder Vorhang aus Home Assistant: er steht im Bild, wie er wirklich steht.", "Below it the cover from Home Assistant: it stands in the picture as it really does.")
    r.click("#propsBody .entPicker input[type=search]", nth=2)          # after the contact and the tilt contact (#624)
    r.type("rollladen wohn")
    r.wait(500)
    r.click("#propsBody .entItem[data-id='cover.wohnzimmer']")
    r.wait(2400)
    r.poster()
    r.say("Unter „Einzelne Flügel“ bekommt auf Wunsch jeder Flügel seinen eigenen Kontakt.", "Under “Individual panes” each pane can get a contact of its own.")
    r.move("#propsBody .entPicker input[type=search]", nth=3)
    r.wait(2200)


@clip("window-tilt", "edit",
      {"de": "Fenster mit zwei Kontakten: gekippt und offen", "en": "A window with two contacts: tilted and open"},
      {"de": "Ein Dreh-Kipp-Fenster mit einem Flügel bekommt zwei Kontakte: „Kontakt“ meldet offen, „Kontakt gekippt“ meldet gekippt. Gekippt wird das Fenster gelb und kippt nach innen (wie weit: „Kippwinkel“), offen wird es rot und geht auf, zu hat es einen grünen Rahmen.",
       "en": "A tilt-and-turn window with one pane gets two contacts: “Contact” reports open, “Tilt contact” reports tilted. Tilted, the window turns yellow and tilts in (how far: “Tilt angle”); open, it turns red and swings open; shut, it has a green frame."},
      "Fenster gekippt kippen Kipp Dreh-Kipp Drehkipp zwei Kontakte zweiter Kontakt Fensterkontakt offen geschlossen gelb Griff Fenstergriff Kippwinkel Winkel Grad window tilted tilt turn two contacts second contact handle sensor open closed yellow tilt angle degrees",
      query="mode=edit", prep=window_room)
def _(r):
    r.say("Klicke das Fenster an: es hat einen Flügel.", "Click the window: it has one pane.")
    p = r.js("window.__fp.openingCenter('guideWin')")
    r.click(p["x"], p["y"])
    r.wait(1200)
    r.say("Es geht links auf: „Fenster öffnet“ auf „Links angeschlagen“.", "It opens on the left: “Window opens” to “Left hinged”.")
    r.click("#winHinge")
    r.loc("#winHinge").select_option("left")
    r.wait(1000)
    r.say("„Kontakt“: der Sensor, der „offen“ meldet.", "“Contact”: the sensor that reports “open”.")
    r.click("#propsBody .entPicker input[type=search]", nth=0)
    r.type("terrasse")
    r.wait(500)
    r.click("#propsBody .entItem[data-id='binary_sensor.fenster_wz_offen']")
    r.wait(1200)
    r.say("Neu darunter: „Kontakt gekippt“, der zweite Sensor, der „gekippt“ meldet.", "New below it: “Tilt contact”, the second sensor that reports “tilted”.")
    r.move("#tiltContact")
    r.wait(900)
    r.click("#tiltContact .entPicker input[type=search]")
    r.type("terrasse")
    r.wait(500)
    r.click("#tiltContact .entItem[data-id='binary_sensor.fenster_wz_gekippt']")
    r.wait(1200)
    r.say("Er ist gerade auf: das Fenster ist gekippt. Es wird gelb, der Flügel mit Rahmen und Griff kippt nach innen.",
          "It is on right now: the window is tilted. It turns yellow, the pane with its sash and handle tilts in.")
    r.wait(1400)
    r.js("""(() => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], w = (%s)(f);
      const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2;
      fp.camAt(mx + 2.4, 1.9, mz - 2.2, mx - 1.2, mz + 3); })()""" % FRONT_WALL)          # a little from the side: the pane leans in
    r.wait(2200)
    r.poster()
    r.say("Zu wenig zu sehen? „Kippwinkel (°)“ sagt, wie weit der Flügel im Bild kippt: normal 14°, hier 35°.",
          "Hard to see? “Tilt angle (°)” says how far the pane tilts in the picture: 14° normally, 35° here.")
    r.click("#tiltDeg")
    r.pg.keyboard.press("Control+A")
    r.type("35")
    r.key("Enter")
    r.wait(2600)
    r.say("„Diesen Winkel für alle Fenster“ nimmt ihn für jedes Fenster im Haus. Ist ein Fenster zu, kippt es beim Ändern kurz, damit man den Winkel sieht.",
          "“This angle for all windows” uses it for every window of the house. A shut window tilts for a moment when you change it, so you see the angle.")
    r.move("#tiltDegAll")
    r.wait(3000)
    r.say("Meldet der Kontakt „offen“, ist es offen: rot, der Flügel geht auf. „Offen“ gewinnt, auch wenn beide melden.",
          "When the contact reports “open”, it is open: red, the pane swings open. “Open” wins, also when both report.")
    r.js("""clearInterval(window.__guideHold); window.__guideHold = setInterval(() => window.__fp.fakeState('binary_sensor.fenster_wz_offen', 'on'), 150)""")
    r.wait(3000)
    r.say("Beide zu: das Fenster ist geschlossen, mit grünem Rahmen.", "Both shut: the window is closed, with a green frame.")
    r.js("""clearInterval(window.__guideHold); window.__guideHold = setInterval(() => { window.__fp.fakeState('binary_sensor.fenster_wz_offen', 'off'); window.__fp.fakeState('binary_sensor.fenster_wz_gekippt', 'off'); }, 150)""")
    r.wait(2600)
    r.say("Gekippt zählt wie offen: für die Heizung, den Alarm und die Regenwarnung. Ein Fenstergriff-Sensor, der selbst „gekippt“ meldet, braucht keinen zweiten Kontakt.",
          "Tilted counts like open: for the heating, the alarm and the rain warning. A handle sensor that reports “tilted” itself needs no second contact.")
    r.wait(3200)


@clip("devices-place", "edit",
      {"de": "Lampen und Geräte platzieren", "en": "Place lamps and devices"},
      {"de": "„Gerät“ wählen, eine Lampe oder einen Sensor aussuchen, mit Home Assistant verbinden und in den Raum klicken.",
       "en": "Choose “Device”, pick a lamp or a sensor, link it to Home Assistant and click into the room."},
      "Gerät Lampe Sensor platzieren setzen Entität verbinden Home Assistant Bibliothek device lamp sensor place entity link library",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("Oben: „Gerät“.", "At the top: “Device”.")
    r.click("#tools [data-tool=device]")
    r.wait(800)
    r.say("Rechts die Art wählen: eine Deckenlampe.", "Choose the kind on the right: a ceiling lamp.")
    r.click("#paletteGrid button", nth=0)
    r.wait(600)
    r.say("Darunter sagst du, welche Lampe in Home Assistant es ist.", "Below you say which lamp in Home Assistant it is.")
    r.click("#entitySearch")
    r.type("licht" if r.lang == "de" else "light")
    r.wait(500)
    vals = r.js("[...document.querySelectorAll('#entitySelect option')].map((o) => o.value)")
    r.pg.select_option("#entitySelect", "light.wohnzimmer" if "light.wohnzimmer" in vals else next(v for v in vals if v))
    r.wait(600)
    r.say("Dann in den Raum klicken: da hängt sie.", "Then click into the room: there it hangs.")
    r.click(cx - 80, cy - 30)
    r.wait(800)
    r.say("Genauso ein Sofa aus der Bibliothek.", "A sofa from the library works the same way.")
    r.click("#tools [data-tool=device]")
    r.wait(500)
    r.click("#paletteSearch")
    r.type("Sofa")
    r.wait(600)
    r.click("#paletteGrid button", nth=0)
    r.click(cx + 90, cy + 60)
    r.wait(700)
    r.poster()
    r.say("Im 3D-Bild steht alles, wie es wirklich ist.", "In the 3D view everything stands as it really does.")
    r.click("#view3d")
    r.wait(800)
    r.click("#fitBtn")
    r.wait(2400)


@clip("move", "edit",
      {"de": "Verschieben, drehen, löschen, rückgängig", "en": "Move, turn, delete, undo"},
      {"de": "Ein Gerät anklicken und ziehen, mit Q und E drehen, mit Entf löschen. ↶ holt alles zurück.",
       "en": "Click a device and drag it, turn it with Q and E, delete it with Del. ↶ brings everything back."},
      "verschieben ziehen drehen löschen rückgängig wiederholen Möbel auswählen move drag turn rotate delete undo redo furniture select",
      query="mode=edit", prep=empty_house(walls=True, rooms=True, sofa=True))
def _(r):
    cx, cy = centre(r)
    x, y = cx + SOFA[0], cy + SOFA[1]
    r.say("Klicke ein Möbel an, zum Beispiel das Sofa.", "Click a piece of furniture, for example the sofa.")
    r.click(x, y)
    r.wait(700)
    r.say("Ziehen verschiebt es.", "Dragging moves it.")
    r.drag(x, y, x - 120, y - 60, ms=1000)
    r.wait(500)
    r.say("Q und E drehen es.", "Q and E turn it.")
    for _ in range(3):
        r.key("e")
        r.wait(250)
    r.poster()
    r.say("Entf löscht es …", "Del deletes it …")
    r.key("Delete")
    r.wait(900)
    r.say("… und ↶ holt es zurück.", "… and ↶ brings it back.")
    for _ in range(5):
        if r.pg.locator("#undoBtn:not([disabled])").count() == 0:
            break
        r.click("#undoBtn", ms=500)
        r.wait(300)
    r.wait(1200)


@clip("measure", "edit",
      {"de": "Messen, Wände genau verschieben und drehen", "en": "Measure, move and turn walls exactly"},
      {"de": "„Messen“ zeigt Abstände und Winkel. Zwei Wände nacheinander angeklickt: ihren Abstand oder Winkel eintippen, "
             "die Wand rückt oder dreht sich genau dorthin, angehängte Wände und Räume ziehen mit.",
       "en": "“Measure” shows distances and angles. Two walls clicked one after the other: type their distance or angle and the "
             "wall moves or turns exactly there, joined walls and rooms follow."},
      "messen Abstand Länge Winkel Meter Maßband Wand verschieben drehen Innenmaß genau Ecke schräg "
      "measure distance length angle metre tape wall move turn inside exact corner slanted",
      query="mode=edit")
def _(r):
    at = lambda x, z: r.js(f"window.__fp.plan().toClient({x}, {z})")      # a point of the plan (metres) on the screen
    r.click("#view2d")
    r.wait(900)
    r.move(*at(7.5, 3.5))                                                  # closer to the house (the plan shows the whole plot)
    for _ in range(12):
        if at(10, 0)[0] - at(0, 0)[0] >= 480:                             # 10 m: the house (15 m with the garage) still fits beside the floor rail
            break
        r.wheel(-300, steps=3, ms=240)
    r.wait(500)
    r.say("Oben: „Messen“.", "At the top: “Measure”.")
    r.click("#tools [data-tool=measure]")
    r.wait(700)
    r.say("Zwei Punkte anklicken: der Abstand steht an der Linie, rechts mehr dazu.", "Click two points: the distance is on the line, more on the right.")
    r.click(*at(1.2, 1.2))
    r.wait(400)
    r.click(*at(4.6, 3.2))
    r.wait(2200)
    r.click("#msAgain")
    r.wait(500)
    # the living room (0 … 6 m): its outer wall on the left stays, the wall to the kitchen moves
    r.say("Jetzt zwei Wände: zuerst die, die stehen bleibt …", "Now two walls: first the one that stays …")
    r.click(*at(0, 2.25))
    r.wait(1000)
    r.say("… dann die, die sich bewegen soll.", "… then the one that is to move.")
    r.click(*at(6, 2.25))
    r.wait(1300)
    r.poster()
    r.say("Das Innenmaß eintippen und „Setzen“: die Wand rückt, die Wände an ihr und die Räume ziehen mit.",
          "Type the inside distance and “Set”: the wall moves, the walls joined to it and the rooms follow.")
    r.click("#msClear")
    r.key("Control+a")
    r.type("5")
    r.wait(400)
    r.click("#msClearSet")
    r.wait(2400)
    r.say("„⇄ Die andere Wand bewegen“ tauscht, welche sich bewegt.", "“⇄ Move the other wall” swaps which one moves.")
    r.move("#msSwap")
    r.wait(1600)
    r.click("#msAgain")
    r.wait(500)
    # a corner: the outer wall of the bedroom stays, the wall between bedroom and office turns round the corner
    r.say("Zwei Wände an einer Ecke: den Winkel eintippen, die Wand dreht sich um die Ecke.",
          "Two walls at a corner: type the angle and the wall turns round the corner.")
    r.click(*at(5, 7))
    r.wait(700)
    r.click(*at(7, 5.75))
    r.wait(1200)
    r.click("#msAngle")
    r.key("Control+a")
    r.type("75")
    r.wait(400)
    r.click("#msAngleSet")
    r.wait(2400)
    r.say("Strg+Z macht es rückgängig.", "Ctrl+Z undoes it.")
    r.key("Control+z")
    r.wait(1800)


PLAN_PNG = "fp3d-guide-plan.png"
PLAN_CORNERS = [(2.25, 1.5), (9.75, 1.5), (9.75, 6.5), (2.25, 6.5)]     # metres on the plan


def plan_picture():
    """a drawn floor plan (as a scanned one looks), for the clip "background\""""
    from PIL import Image, ImageDraw
    from recorder import DEMO
    # next to the demo file, where the plan of the page looks for it (api/backgrounds/<name>): the demo cannot keep an upload
    path = DEMO.parent / "api" / "backgrounds" / PLAN_PNG
    path.parent.mkdir(parents=True, exist_ok=True)
    im = Image.new("RGB", (1200, 800), (250, 250, 246))
    d = ImageDraw.Draw(im)
    for x in range(0, 1200, 40):
        d.line([(x, 0), (x, 800)], fill=(232, 236, 240))
    for y in range(0, 800, 40):
        d.line([(0, y), (1200, y)], fill=(232, 236, 240))
    # 100 px = 1 m (the picture is 12 m wide, its top left corner at 0, 0): the house is 7.5 × 5 m, the corners in PLAN_CORNERS
    (x0, y0), (x1, y1) = PLAN_CORNERS[0], PLAN_CORNERS[2]
    d.rectangle((x0 * 100, y0 * 100, x1 * 100, y1 * 100), outline=(30, 30, 30), width=14)
    d.line([(600, y0 * 100), (600, y1 * 100)], fill=(30, 30, 30), width=10)
    d.line([(x0 * 100, 400), (600, 400)], fill=(30, 30, 30), width=10)
    d.rectangle((400, 380, 480, 420), fill=(250, 250, 246))
    for (x, y), name in (((320, 260), "WOHNEN"), ((320, 510), "KUECHE"), ((740, 390), "SCHLAFEN")):
        d.text((x, y), name, fill=(60, 60, 60))
    im.save(path)
    return path


@clip("background", "edit",
      {"de": "Einen Grundriss nachzeichnen", "en": "Trace a floor plan"},
      {"de": "Ein Bild oder Foto deines Grundrisses als Vorlage hochladen, durchsichtig machen und die Wände einfach darauf nachzeichnen.",
       "en": "Upload a picture or photo of your floor plan as a template, make it see-through and simply draw the walls on it."},
      "Grundriss nachzeichnen Vorlage Hintergrundbild Bild Foto hochladen Plan Maßstab floor plan trace template background picture photo upload scale",
      query="mode=edit", prep=empty_house(), answers={"api/backgrounds": {"name": PLAN_PNG}})
def _(r):
    r.say("Rechts: „Hintergrundbild (Vorlage)“.", "On the right: “Background picture (template)”.")
    r.click("#bgPanel > summary")
    r.wait(700)
    r.say("Ein Bild deines Grundrisses wählen, zum Beispiel ein Foto vom Bauplan.", "Pick a picture of your floor plan, for example a photo of the building plan.")
    r.move("#bgBody")
    r.pg.set_input_files("#bgFile", str(plan_picture()))
    r.wait(1800)
    r.poster()
    r.say("Jetzt mit „Wand“ einfach auf den Linien nachzeichnen.", "Now simply trace the lines with “Wall”.")
    r.click("#tools [data-tool=wall]")
    for x, z in PLAN_CORNERS + PLAN_CORNERS[:1]:
        sx, sy = r.js("([x, z]) => window.__fp.plan().toClient(x, z)", [x, z])
        r.click(sx, sy, ms=700)
        r.wait(150)
    r.key("Escape")
    r.wait(1200)
    r.say("Die Vorlage bleibt nur im Editor; im Live-Bild ist sie weg.", "The template stays in the editor only; it is gone in the live view.")
    r.wait(1600)


@clip("roof", "edit",
      {"de": "Dach und Gauben", "en": "Roof and dormers"},
      {"de": "„Dach“ legt ein Dach über das Haus: Satteldach, Walmdach, Flachdach oder Pultdach, die Neigung, dazu Gauben.",
       "en": "“Roof” puts a roof over the house: gable, hip, flat or shed roof, the pitch, and dormers."},
      "Dach Satteldach Walmdach Flachdach Pultdach Neigung Gaube Dachgeschoss roof gable hip flat shed pitch dormer attic",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    r.click("#viewSplit")
    r.wait(1500)
    r.say("Oben: „Dach“.", "At the top: “Roof”.")
    r.click("#dormerBtn")
    r.wait(2000)
    if r.pg.locator("#roofType").count() == 0 or not r.pg.locator("#roofType").is_visible():
        r.click("#floorPanel > summary")
        r.wait(700)
    r.poster()
    r.say("Die Form des Dachs: Walmdach …", "The shape of the roof: hip roof …")
    r.click("#roofType")
    r.loc("#roofType").select_option("hip")
    r.wait(1800)
    r.say("… oder wieder ein Satteldach.", "… or a gable roof again.")
    r.loc("#roofType").select_option("gable")
    r.wait(1500)
    if r.pg.locator("#addDormer").count():
        r.say("„＋ Gaube“ setzt eine Gaube ins Dach.", "“＋ Dormer” puts a dormer into the roof.")
        r.click("#addDormer")
        r.wait(2000)


def l_house(r):
    """prep: an empty house made into an L-shaped one with a Dachgeschoss: the roof on a knee wall of 1 m over the long wing only (#621)"""
    empty_house()(r)
    r.pg.evaluate("""() => {
      const fp = window.__fp, L = fp.layout;
      const wall = (id, a, b, ops = []) => ({ id, a, b, thickness: 0.3, height: 2.6, openings: ops });
      const win = (id, pos) => ({ id, type: 'window', style: 'double', pos, width: 1.2, height: 1.1, sill: 0.9 });
      const ring = (p) => [wall(p + 1, [0, 0], [12, 0], [win(p + 'a', 3), win(p + 'b', 9)]), wall(p + 2, [12, 0], [12, 8], [win(p + 'c', 4)]),
        wall(p + 3, [12, 8], [7, 8], [win(p + 'd', 2.5)]), wall(p + 4, [7, 8], [7, 15], [win(p + 'e', 3.5)]), wall(p + 5, [7, 15], [0, 15], [win(p + 'f', 3.5)]),
        wall(p + 6, [0, 15], [0, 0], [win(p + 'g', 4), win(p + 'h', 11)])];
      const rooms = (p, a, b) => [{ id: p + 'r1', name: a, color: '#d8c3a5', points: [[0, 0], [12, 0], [12, 8], [0, 8]] },
                                  { id: p + 'r2', name: b, color: '#a9c4d8', points: [[0, 8], [7, 8], [7, 15], [0, 15]] }];
      const de = document.documentElement.lang !== 'en';
      const fl = (id, name, kind, walls, rs) => ({ id, name, kind, holes: [], rooms: rs, walls, devices: [], blocks: [], stairs: [] });
      L.floors.splice(0, L.floors.length,
        fl('lEG', de ? 'Erdgeschoss' : 'Ground floor', 'floor', ring('le'), rooms('le', de ? 'Wohnen' : 'Living', de ? 'Küche' : 'Kitchen')),
        fl('lDG', de ? 'Dachgeschoss' : 'Attic floor', 'floor', ring('ld'), rooms('ld', de ? 'Schlafen' : 'Bedroom', de ? 'Kinder' : 'Kids')),
        Object.assign(fl('lDach', de ? 'Dach' : 'Roof', 'roof', [], []),
          { roof: { type: 'gable', pitch: 40, overhang: 0.4, knee: 1, ridge: 'x', box: { x0: 0, x1: 12, z0: 0, z1: 8 } } }));
      fp.rebuild(); fp.switchFloor(2);
    }""")
    r.pg.click("#view3d")
    r.pg.wait_for_timeout(800)
    r.pg.evaluate("window.__fp.camAt(21, 15, 25, 5, 7)")          # from the south-east: both wings in view
    if r.pg.locator("#addRoofPart").count() == 0 or not r.pg.locator("#addRoofPart").is_visible():
        r.pg.click("#floorPanel > summary")
    r.pg.locator("#addRoofPart").scroll_into_view_if_needed()
    r.pg.wait_for_timeout(800)


@clip("roof-wing", "edit",
      {"de": "Ein L-förmiges Dach (zweiter Flügel)", "en": "An L-shaped roof (the second wing)"},
      {"de": "Liegt das Dach nur über einem Flügel, legt „＋ Weiteres Dach“ das zweite Dach über den anderen. „Wie das Hauptdach“ hält beide gleich hoch, auch auf dem Kniestock; die beiden Dächer schneiden sich in den Kehlen, die Wände darunter folgen beiden Schrägen. „Firstrichtung“ 0° oder 90° hält den First fest.",
       "en": "When the roof covers one wing only, “+ Further roof” puts the second roof over the other one. “Like the main roof” keeps both at the same height, on the knee wall too; the two roofs cut into each other in the valleys, the walls below follow both slopes. “Ridge direction” 0° or 90° keeps the ridge."},
      "Dach L-Form Winkelhaus Flügel zweites Dach weiteres Dach Kniestock Drempel Dachgeschoss Kehle Kehlen schneiden Verschneidung Firstrichtung Drehung drehen 90 Grad Anbau roof L-shaped wing second roof further roof knee wall attic valley valleys cut intersect ridge direction rotate turn 90 degrees annex",
      query="mode=edit", prep=l_house)
def _(r):
    r.say("Ein L-Haus mit Kniestock: das Dach liegt nur über einem Flügel.", "An L-shaped house on a knee wall: the roof covers one wing only.")
    r.wait(2200)
    r.say("„＋ Weiteres Dach“ legt ein Dach über den zweiten Flügel.", "“+ Further roof” puts a roof over the second wing.")
    r.click("#addRoofPart")
    r.wait(2200)
    r.poster()
    r.say("„Sitzt auf: wie das Hauptdach“: gleich hoch, auch auf dem Kniestock.", "“Sits on: like the main roof”: the same height, on the knee wall too.")
    r.move(".roofPartCard .roofPartLevel")
    r.wait(2200)
    r.say("Die beiden Dächer schneiden sich in den Kehlen, wie eine Gaube im Dach.", "The two roofs cut into each other in the valleys, like a dormer in the roof.")
    r.js("window.__fp.camAt(17, 9, 22, 6, 9)")
    r.wait(2600)
    r.say("„Firstrichtung“: 0° oder 90° hält den First fest, auch wenn sich die Größe ändert.", "“Ridge direction”: 0° or 90° keeps the ridge, also when the size changes.")
    r.move(".roofPartCard .roofRidge")
    r.wait(2400)
    r.js("window.__fp.camAt(21, 15, 25, 5, 7)")
    r.say("Im Dachgeschoss folgen die Wände beiden Dachschrägen.", "On the attic floor the walls follow both roof slopes.")
    r.click("#floorRail .floorThumb[data-floor='1']")
    r.wait(2600)
    r.say("„Ganzes Haus“: beide Dächer auf gleicher Höhe.", "“Whole house”: both roofs at the same height.")
    r.click("#floorRail .railHouse")
    r.wait(2600)


def wide_house(r):
    """prep: an empty house made into a house 12 x 9 m with a gable roof of 40°, seen in 3D, the roof panel open (#621: a wide dormer)"""
    empty_house()(r)
    r.pg.evaluate("""() => {
      const fp = window.__fp, L = fp.layout, de = document.documentElement.lang !== 'en';
      const wall = (id, a, b, ops = []) => ({ id, a, b, thickness: 0.3, height: 2.6, openings: ops });
      const win = (id, pos) => ({ id, type: 'window', style: 'double', pos, width: 1.2, height: 1.1, sill: 0.9 });
      const fl = (id, name, kind, walls, rs) => ({ id, name, kind, holes: [], rooms: rs, walls, devices: [], blocks: [], stairs: [] });
      L.floors.splice(0, L.floors.length,
        fl('wEG', de ? 'Erdgeschoss' : 'Ground floor', 'floor', [wall('w1', [0, 0], [12, 0], [win('wa', 3), win('wb', 9)]), wall('w2', [12, 0], [12, 9], [win('wc', 4.5)]),
          wall('w3', [12, 9], [0, 9], [win('wd', 6)]), wall('w4', [0, 9], [0, 0], [win('we', 4.5)])],
          [{ id: 'wr1', name: de ? 'Wohnen' : 'Living', color: '#d8c3a5', points: [[0, 0], [12, 0], [12, 9], [0, 9]] }]),
        Object.assign(fl('wDach', de ? 'Dach' : 'Roof', 'roof', [], []), { roof: { type: 'gable', pitch: 40, overhang: 0.4, ridge: 'x' } }));
      fp.rebuild(); fp.switchFloor(1);
    }""")
    r.pg.click("#view3d")
    r.pg.wait_for_timeout(800)
    r.pg.evaluate("window.__fp.camAt(6, 11, -14, 6, 4)")           # from the front (side A of the roof)
    if r.pg.locator("#addDormer").count() == 0 or not r.pg.locator("#addDormer").is_visible():
        r.pg.click("#floorPanel > summary")
    r.pg.locator("#addDormer").scroll_into_view_if_needed()
    r.pg.wait_for_timeout(800)


@clip("dormer-pitch", "edit",
      {"de": "Breite Gaube mit eigener Neigung", "en": "A wide dormer with its own pitch"},
      {"de": "Eine Satteldachgaube darf so breit sein wie das Dach (bis 30 m). „Neigung der Gaube“ stellt ihr Dach ein; ist sie zu breit dafür, wird ihr Dach von selbst flacher und bleibt unter dem First.",
       "en": "A gable dormer may be as wide as the roof (up to 30 m). “Dormer pitch” sets its roof; when it is too wide for it, its roof gets flatter by itself and stays under the ridge."},
      "Gaube breit Satteldachgaube Zwerchgiebel Zwerchhaus Neigung Gaubenneigung Dachneigung Breite 5 m dormer wide gable dormer pitch width",
      query="mode=edit", prep=wide_house)
def _(r):
    r.say("„＋ Gaube“ setzt eine Gaube ins Dach.", "“＋ Dormer” puts a dormer into the roof.")
    r.click("#addDormer")
    r.wait(1800)
    r.say("„Breite“: diese Gaube wird 6 m breit.", "“Width”: this dormer gets 6 m wide.")
    r.click(".dormerCard .dormerWidth")
    r.pg.keyboard.press("Control+A")
    r.type("6")
    r.key("Enter")
    r.wait(2200)
    r.say("„Neigung der Gaube“: 35° macht ihr Dach steiler.", "“Dormer pitch”: 35° makes its roof steeper.")
    r.click(".dormerCard .dormerGablePitch")
    r.pg.keyboard.press("Control+A")
    r.type("35")
    r.key("Tab")
    r.wait(2400)
    r.poster()
    r.say("10 m breit: zu breit für 35°, ihr Dach wird von selbst flacher und bleibt unter dem First.", "10 m wide: too wide for 35°, its roof gets flatter by itself and stays under the ridge.")
    r.click(".dormerCard .dormerWidth")
    r.pg.keyboard.press("Control+A")
    r.type("10")
    r.key("Enter")
    r.wait(2800)


def skylight_house(r):
    """prep: the house of wide_house, the roof panel scrolled to its roof windows (#643)"""
    wide_house(r)
    r.pg.locator("#addSkylight").scroll_into_view_if_needed()
    r.pg.wait_for_timeout(600)


@clip("skylight", "edit",
      {"de": "Dachfenster ohne Gaube", "en": "Roof windows without a dormer"},
      {"de": "Auf der Etage Dach setzt „＋ Dachfenster“ ein ganz normales Fenster in die Dachschräge, ohne Gaube. Seite, Platz und Größe (übliche Größen wie 78 × 118 cm) stellst du dort ein; Kontakt, Name und Rollladen wie bei jedem Fenster: das Fenster antippen. Ist es offen, wird es rot und die Scheibe klappt nach außen.",
       "en": "On the roof floor “＋ Roof window” puts a plain window into the slope of the roof, without a dormer. Set its side, place and size there (usual sizes like 78 × 118 cm); contact, name and roller shutter as for any window: tap the window. When it is open it turns red and its pane opens outwards."},
      "Dachfenster Dachflächenfenster Schrägfenster Fenster im Dach ohne Gaube Velux Roto Größe 78 118 Kontakt skylight roof window rooflight Velux size contact",
      query="mode=edit", prep=skylight_house)
def _(r):
    r.say("Etage Dach, „Etage verwalten“: der Abschnitt „Dachfenster“.", "Roof floor, “Manage floor”: the section “Roof windows”.")
    r.move("#skylightHead")
    r.wait(1600)
    r.say("„＋ Dachfenster“ setzt ein Fenster in die Dachschräge, ohne Gaube.", "“＋ Roof window” puts a window into the slope of the roof, without a dormer.")
    r.click("#addSkylight")
    r.wait(2200)
    r.poster()
    r.say("„Position am First“ schiebt es entlang des Dachs.", "“Position along the ridge” moves it along the roof.")
    r.slide(".skylightCard .skylightPos", 0.25)
    r.wait(1800)
    r.say("„Übliche Größe“: zum Beispiel 114 × 140 cm. Oder Breite und Höhe selbst eintragen.", "“Usual size”: for example 114 × 140 cm. Or type width and height yourself.")
    r.click(".skylightCard .skylightSize")
    r.loc(".skylightCard .skylightSize").select_option("114x140")
    r.wait(2000)
    r.say("Noch eins daneben.", "Another one beside it.")
    r.click("#addSkylight")
    r.wait(800)
    r.loc(".skylightCard >> nth=1").locator(".skylightSide").select_option("0")
    r.wait(600)
    r.slide(".skylightCard >> nth=1 >> .skylightPos", 0.75)
    r.wait(1800)
    r.say("Kontakt, Name, Rollladen: das Dachfenster antippen, wie jedes Fenster. Offen wird es rot, die Scheibe klappt nach außen.",
          "Contact, name, roller shutter: tap the roof window, like any window. Open it turns red, its pane opens outwards.")
    r.js("() => { const s = window.__fp.layout.floors[1].roof.skylights[0]; if (s?.window) window.__fp.select('opening', s.window.id); }")
    r.wait(2800)


def gable_house(r):
    """prep: an empty house made into a house of two storeys with a gable roof, seen in 3D from the front left (#628)"""
    empty_house()(r)
    r.pg.evaluate("""() => {
      const fp = window.__fp, L = fp.layout, de = document.documentElement.lang !== 'en';
      const wall = (id, a, b, ops = []) => ({ id, a, b, thickness: 0.3, height: 2.6, openings: ops });
      const win = (id, pos) => ({ id, type: 'window', style: 'double', pos, width: 1.2, height: 1.1, sill: 0.9 });
      const ring = (p) => [wall(p + 1, [0, 0], [11, 0], [win(p + 'a', 3), win(p + 'b', 8)]), wall(p + 2, [11, 0], [11, 7], [win(p + 'c', 3.5)]),
        wall(p + 3, [11, 7], [0, 7], [win(p + 'd', 3), win(p + 'e', 8)]), wall(p + 4, [0, 7], [0, 0], [win(p + 'g', 3.5)])];
      const room = (id, name) => [{ id, name, color: '#d8c3a5', points: [[0, 0], [11, 0], [11, 7], [0, 7]] }];
      const fl = (id, name, kind, walls, rs) => ({ id, name, kind, holes: [], rooms: rs, walls, devices: [], blocks: [], stairs: [] });
      L.floors.splice(0, L.floors.length,
        fl('gEG', de ? 'Erdgeschoss' : 'Ground floor', 'floor', ring('ge'), room('gr1', de ? 'Wohnen' : 'Living')),
        fl('gOG', de ? 'Obergeschoss' : 'Upper floor', 'floor', ring('go'), room('gr2', de ? 'Schlafen' : 'Bedroom')),
        Object.assign(fl('gDach', de ? 'Dach' : 'Roof', 'roof', [], []), { roof: { type: 'gable', pitch: 40, overhang: 0.5 } }));
      fp.rebuild(); fp.switchFloor(2);
    }""")
    r.pg.click("#view3d")
    r.pg.wait_for_timeout(800)
    r.pg.evaluate("window.__fp.camAt(-9, 9, 21, 5.5, 4)")            # from the front left: a gable and the long side
    if r.pg.locator("#roofType").count() == 0 or not r.pg.locator("#roofType").is_visible():
        r.pg.click("#floorPanel > summary")
    r.pg.locator("#floorBody .roofGableOver").scroll_into_view_if_needed()
    r.pg.wait_for_timeout(800)


@clip("roof-gable", "edit",
      {"de": "Giebelwand, Pultdach und Vordach", "en": "Gable wall, shed roof and canopy"},
      {"de": "Unter dem Giebel geht die Wand bis unters Dach; „Überstand am Giebel“ sagt, wie weit das Dach dort übersteht. „＋ Vordach“ setzt ein Pultdach vor das Haus, und auch das ganze Dach kann ein Pultdach sein, mit seiner hohen Seite.",
       "en": "Under the gable the wall goes on up to the roof; “Overhang at the gables” says how far the roof sticks out there. “+ Canopy” puts a shed roof in front of the house, and the whole roof can be a shed roof too, with its high side."},
      "Giebel Giebelwand Ortgang Überstand Pultdach Vordach Terrassendach Überdachung schräges Flachdach Anbau gable gable wall verge overhang shed roof lean-to canopy porch roof terrace roof one slope annex",
      query="mode=edit", prep=gable_house)
def _(r):
    r.say("Die Giebelwand: die Wand geht bis unters Dach, in der Farbe der Wände.", "The gable wall: the wall goes on up to the roof, in the colour of the walls.")
    r.wait(2200)
    r.say("„Überstand am Giebel“: wie weit das Dach dort übersteht, hier 15 cm.", "“Overhang at the gables”: how far the roof sticks out there, 15 cm here.")
    r.click("#floorBody .roofGableOver")
    r.pg.keyboard.press("Control+A")
    r.type("0.15")
    r.key("Tab")
    r.wait(1800)
    r.say("„＋ Vordach“ setzt ein Pultdach vor die lange Seite, gleich unter die Traufe.", "“+ Canopy” puts a shed roof in front of the long side, just under the eave.")
    r.loc("#addCanopy").scroll_into_view_if_needed()
    r.click("#addCanopy")
    r.wait(2400)
    r.poster()
    r.say("In seiner Karte: hohe Seite, Neigung, „Höher setzen“ und die Größe.", "In its card: the high side, the pitch, “Move up” and the size.")
    r.loc(".roofPartCard .roofPartDy").scroll_into_view_if_needed()
    r.move(".roofPartCard .roofPartDy")
    r.wait(2200)
    r.say("Auch das ganze Dach kann ein Pultdach sein: „Dachform“ → „Pultdach“.", "The whole roof can be a shed roof too: “Roof shape” → “Shed roof”.")
    r.loc("#roofType").scroll_into_view_if_needed()
    r.click("#roofType")
    r.loc("#roofType").select_option("shed")
    r.wait(2200)
    r.say("„Hohe Seite“: hier hinten, die Wände gehen bis unters Dach.", "“High side”: at the back here, the walls go up under the roof.")
    r.click("#roofHigh")
    r.loc("#roofHigh").select_option("z0")
    r.wait(1600)
    r.say("… und wieder ein Satteldach.", "… and a gable roof again.")
    r.click("#roofType")
    r.loc("#roofType").select_option("gable")
    r.wait(1800)


@clip("stairs", "edit",
      {"de": "Eine Treppe setzen", "en": "Place a staircase"},
      {"de": "„Treppe“: gerade, mit Kurve, Wendeltreppe oder an der Wand, für eine oder mehrere Etagen; das Loch im Boden darüber kommt dazu.",
       "en": "“Stairs”: straight, with a turn, spiral or along the wall, for one or more floors; the hole in the floor above comes with it."},
      "Treppe Wendeltreppe Stufen Etage hoch runter Treppenloch stairs staircase spiral steps floor up down stairwell",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("Oben: „Treppe“.", "At the top: “Stairs”.")
    r.click("#tools [data-tool=stairs]")
    r.wait(800)
    r.say("Rechts die Art wählen, zum Beispiel eine Wendeltreppe.", "Choose the kind on the right, for example a spiral staircase.")
    r.click("#stairTypes button[data-stair=spiral]")
    r.wait(600)
    r.say("In den Raum klicken: da steht sie.", "Click into the room: there it stands.")
    r.click(cx + 120, cy - 40)
    r.wait(1000)
    r.poster()
    r.say("Im 3D-Bild führt sie nach oben.", "In the 3D view it leads upwards.")
    r.click("#viewSplit")
    r.wait(2400)


@clip("stairs-winder", "edit",
      {"de": "Gewendelte Treppe: Keilstufen in der Ecke", "en": "Winder stairs: wedge steps in the corner"},
      {"de": "Eine L- oder U-Treppe dreht sich mit Keilstufen statt mit einem Podest („Ecke: Gewendelt“), wie viele „Wendelstufen“, und „Stufen im 1. Lauf“ für einen langen ersten und einen kurzen zweiten Lauf. Eine Wandtreppe kann „Massiv“ sein.",
       "en": "An L or U stair turns with wedge steps instead of a landing (“Corner: Winders”), how many “Winder steps”, and “Steps in flight 1” for a long first and a short second flight. A wall stair can be “Solid”."},
      "Treppe gewendelt viertelgewendelt halbgewendelt Wendelstufen Keilstufen Ecke Podest Kellertreppe L-Treppe U-Treppe Lauf Stufen massiv winder stairs quarter turn half turn wedge steps corner landing cellar stair flight solid",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("Oben: „Treppe“, rechts „L-Treppe“.", "At the top: “Stairs”, on the right “L stair”.")
    r.click("#tools [data-tool=stairs]")
    r.wait(600)
    r.click("#stairTypes button[data-stair=L]")
    r.wait(600)
    r.say("„Ecke“: „Gewendelt (Keilstufen)“ statt „Podest“.", "“Corner”: “Winders (wedge steps)” instead of “Landing”.")
    r.click("#stairCorner")
    r.loc("#stairCorner").select_option("winder")
    r.wait(1000)
    r.say("In den Raum klicken: die Treppe dreht sich in der Ecke mit Keilstufen.", "Click into the room: the stair turns in the corner with wedge steps.")
    r.click(cx - 190, cy - 95)
    r.wait(1400)
    r.say("„Stufen im 1. Lauf“: 9 gibt einen langen ersten und einen kurzen zweiten Lauf.", "“Steps in flight 1”: 9 gives a long first and a short second flight.")
    r.click("#stairSplit")
    r.pg.keyboard.press("Control+A")
    r.type("9")
    r.key("Tab")
    r.wait(1400)
    r.say("„Wendelstufen“: wie viele Keilstufen die Ecke dreht.", "“Winder steps”: how many wedge steps turn the corner.")
    r.click("#stairWinders")
    r.pg.keyboard.press("Control+A")
    r.type("4")
    r.key("Tab")
    r.wait(1400)
    r.poster()
    r.say("Im 3D-Bild: ein langer Lauf an der Wand, die Keilstufen, ein kurzer Lauf.", "In 3D: a long run along the wall, the wedge steps, a short run.")
    r.click("#view3d")
    r.wait(600)
    r.js("""(() => { const fp = window.__fp, st = fp.layout.floors[fp.floorIdx()].stairs.at(-1);
      fp.camAt(st.x + 0.6, 6.8, st.z + 3.6, st.x + 2.6, st.z + 0.3); })()""")          # from above: the wedges in the corner
    r.wait(3000)


@clip("stairs-storey", "edit",
      {"de": "Geschosshöhe und Treppe unten und oben gewendelt", "en": "Storey height and a stair with winders at both ends"},
      {"de": "„Etage verwalten“ → „Geschosshöhe“ (von Boden zu Boden) gibt den Abstand der Etagen und die Stufen der Treppen. Eine L-Treppe bekommt eine „2. Ecke“: unten Keilstufen, ein gerader Lauf, oben noch einmal Keilstufen. „Stufen je Etage“ wie an der echten Treppe gezählt.",
       "en": "“Manage floor” → “Storey height” (floor to floor) sets how far the floors stand apart and the steps of the stairs. An L stair gets a “2nd corner”: wedge steps at the bottom, a straight flight, wedge steps again at the top. “Steps per floor” as counted on the real stair."},
      "Geschosshöhe Etagenhöhe Raumhöhe Boden zu Boden Stufen je Etage Stufenanzahl 2. Ecke unten und oben viertelgewendelt zweimal gewendelt Reihenhaus Keilstufen storey height floor height floor to floor steps per floor number of steps second corner winders at both ends double winder row house",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("„Etage verwalten“: die „Geschosshöhe“, von Boden zu Boden, hier 2,75 m.", "“Manage floor”: the “Storey height”, floor to floor, here 2.75 m.")
    r.click("#floorPanel > summary")
    r.wait(700)
    r.click("#storeyHeight")
    r.pg.keyboard.press("Control+A")
    r.type("2.75")
    r.key("Tab")
    r.wait(1500)
    r.click("#floorPanel > summary")
    r.wait(400)
    r.say("„Treppe“, „L-Treppe“, „Ecke: Gewendelt“, dann in den Raum klicken.", "“Stairs”, “L stair”, “Corner: Winders”, then click into the room.")
    r.click("#tools [data-tool=stairs]")
    r.wait(500)
    r.click("#stairTypes button[data-stair=L]")
    r.wait(400)
    r.click("#stairCorner")
    r.loc("#stairCorner").select_option("winder")
    r.wait(600)
    r.click(cx - 120, cy - 110)
    r.wait(1400)
    r.say("„Stufen im 1. Lauf“ 0: man steigt von der Seite gleich auf die Keilstufen.", "“Steps in flight 1” 0: you step on from the side right onto the wedge steps.")
    r.click("#stairSplit")
    r.pg.keyboard.press("Control+A")
    r.type("0")
    r.key("Tab")
    r.wait(1400)
    r.say("„2. Ecke: Gewendelt“: oben dreht sie noch einmal, zur selben Seite.", "“2nd corner: Winders”: at the top it turns once more, to the same side.")
    r.click("#stairCorner2")
    r.loc("#stairCorner2").select_option("winder")
    r.wait(1400)
    r.say("5 Wendelstufen oben, 6 Stufen im geraden Lauf dazwischen.", "5 winders at the top, 6 steps in the straight flight between.")
    r.click("#stairWinders2")
    r.pg.keyboard.press("Control+A")
    r.type("5")
    r.key("Tab")
    r.wait(900)
    r.click("#stairSplit2")
    r.pg.keyboard.press("Control+A")
    r.type("6")
    r.key("Tab")
    r.wait(1400)
    r.poster()
    r.say("„Stufen je Etage“: 14 aus 2,75 m; eine andere Zahl, wenn deine Treppe mehr oder weniger hat.", "“Steps per floor”: 14 from 2.75 m; another number if your stair has more or fewer.")
    r.zoom("#stairSteps", 1.5)
    r.wait(2200)
    r.zoom()
    r.say("Im 3D-Bild: unten Keilstufen, der gerade Lauf, oben wieder Keilstufen.", "In 3D: wedge steps at the bottom, the straight flight, wedge steps again at the top.")
    r.click("#view3d")
    r.wait(600)
    r.js("""(() => { const fp = window.__fp, st = fp.layout.floors[fp.floorIdx()].stairs.at(-1);
      fp.camAt(st.x + 4.4, 5.0, st.z + 4.2, st.x + 0.4, st.z + 1.6); })()""")          # from inside the room, a little above: both ends
    r.wait(3200)


@clip("plot", "edit",
      {"de": "Grundstück und Garten", "en": "Plot and garden"},
      {"de": "„Grundstück“: Rasen um das Haus, dazu Flächen wie Terrasse, Weg, Beet oder Teich, als Rechteck oder frei gezeichnet.",
       "en": "“Plot”: lawn around the house, plus areas like a terrace, path, bed or pond, as a rectangle or drawn freely."},
      "Grundstück Garten Rasen Terrasse Weg Beet Teich Fläche Zaun Hof plot garden lawn terrace path bed pond area fence yard",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("Oben: „Grundstück“.", "At the top: “Plot”.")
    r.click("#tools [data-tool=plot]")
    r.wait(900)
    if r.pg.locator("#plotAround").count():
        r.say("„Grundstück um das Haus“ legt Rasen rundherum.", "“Plot around the house” puts lawn all around.")
        r.click("#plotAround")
        r.wait(1300)
    r.say("Dann eine Fläche, zum Beispiel eine Terrasse, als Rechteck aufziehen.", "Then an area, for example a terrace, dragged as a rectangle.")
    r.click("#yardSurfaces [data-surface=deck]")
    if r.pg.locator("#plotShape [data-v=rect]").count():
        r.click("#plotShape [data-v=rect]")
    r.drag(cx - 200, cy + 190, cx + 60, cy + 290, ms=1200)
    r.wait(1000)
    r.poster()
    r.say("Im 3D-Bild liegt alles im Gelände.", "In the 3D view it all lies in the ground.")
    r.click("#viewSplit")
    r.wait(2400)


def slope_view(r):
    """prep: the demo house (its basement has the garage in front) on a flat plot (the demo stands on a hillside: here it starts flat), on
    its ground floor in the 2D plan (#629)"""
    pg = r.pg
    pg.evaluate("""() => { const fp = window.__fp, L = fp.layout;
      if (L.plot) delete L.plot.terrain;
      fp.rebuild(); fp.switchFloor(L.floors.findIndex((f) => f.kind !== 'basement')); }""")
    pg.click("#view2d")
    pg.wait_for_timeout(1200)


@clip("plot-terrain", "edit",
      {"de": "Gelände am Hang", "en": "Terrain on a slope"},
      {"de": "Ist das Grundstück schräg? „Grundstück“ → „⛰ Gelände“: Höhenpunkte setzen oder „Hang in einem Schritt“. Rasen, Wege und Bäume folgen dem Boden, wo er tiefer liegt, steht der Keller frei; Höhenlinien zeigen es im Plan.",
       "en": "Is the plot on a slope? “Plot” → “⛰ Terrain”: set spot heights or “A slope in one step”. Lawn, paths and trees follow the ground, where it lies lower the basement stands free; contour lines show it in the plan."},
      "Gelände Hang schräg abfallend Gefälle Hanglage Höhenpunkt Höhe Höhenlinien Keller frei Garagentor Böschung Sockel terrain slope sloping hillside spot height contour lines basement free garage door bank plinth",
      query="mode=edit", prep=slope_view)
def _(r):
    r.say("Ist das Grundstück schräg? Oben „Grundstück“, dann „⛰ Gelände“.", "Is the plot on a slope? At the top “Plot”, then “⛰ Terrain”.")
    r.click("#tools [data-tool=plot]")
    r.wait(800)
    r.click("#plotMode [data-v=terrain]")
    r.wait(1200)
    r.say("„Hang in einem Schritt“: der Boden fällt um ein Geschoss, 3 m.", "“A slope in one step”: the ground falls by one storey, 3 m.")
    r.move("#terrainDrop")
    r.wait(900)
    r.click("#terrainSlopeGo")
    r.wait(900)
    r.say("Dann in den Plan tippen, wo der Boden tiefer liegt: hier die Straße.", "Then tap the plan where the ground lies lower: the street here.")
    x, y = r.pg.evaluate("window.__fp.plan().toClient(5, -4.5)")
    r.click(x, y)
    r.wait(2200)
    r.say("Im Plan zeigen Höhenlinien alle 50 cm, wie der Boden fällt.", "In the plan contour lines every 50 cm show how the ground falls.")
    r.wait(2400)
    r.say("Jeder Höhenpunkt hat seine Höhe zum Eintippen; ein Tipp in den Plan setzt einen weiteren, ziehen verschiebt ihn.", "Every spot height has its height to type in; a tap in the plan sets another one, dragging moves it.")
    r.loc("#terrainList").scroll_into_view_if_needed()
    r.move("#terrainList .terrainRow:nth-child(2) input")
    r.wait(2600)
    r.say("Im 3D-Bild: vorne steht der Keller frei, mit dem Garagentor auf Straßenhöhe; Rasen, Wege und Bäume folgen dem Hang.", "In 3D: in front the basement stands free, its garage door at street level; lawn, paths and trees follow the slope.")
    r.js("(() => { const s = window.__fp.settings(); s.houseFloors = 'stacked'; s.seeThrough = false; })()")
    r.click("#view3d")
    r.js("window.__fp.setHouseMode(true)")
    r.wait(1600)
    r.js("window.__fp.camAt(-13, 4, -21, 6, 2.5)")
    r.wait(3800)
    r.poster()


def balcony_view(r):
    """prep: the demo house on a slope (3 m lower in front, #629) with a balcony door in the living room and a room in front of it, not yet
    ticked; its ground floor in the 2D plan (#646)"""
    pg = r.pg
    pg.evaluate("""() => { const fp = window.__fp, L = fp.layout, gi = L.floors.findIndex((f) => f.kind !== 'basement'), eg = L.floors[gi];
      L.plot = L.plot || {}; L.plot.terrain = { points: [{ id: 'cb1', x: 5, z: 7.15, h: 0 }, { id: 'cb2', x: 5, z: -0.15, h: -3 }] };
      const w = eg.walls.find((x) => x.a[0] === 0 && x.a[1] === 0 && x.b[1] === 0);
      if (w) w.openings = [{ id: 'clipBalDoor', type: 'window', style: 'double', pos: 2.5, width: 1.8, height: 2.1, sill: 0 }];
      eg.rooms.push({ id: 'clipBal', name: 'Balkon', points: [[0.8, -1.8], [4.2, -1.8], [4.2, -0.12], [0.8, -0.12]], color: '#8a7f70' });
      fp.rebuild(); fp.switchFloor(gi); }""")
    pg.click("#view2d")
    pg.wait_for_timeout(1200)


@clip("balcony", "edit",
      {"de": "Balkon mit Geländer", "en": "A balcony with a railing"},
      {"de": "Einen Raum vor die Tür zeichnen und „Balkon / Dachterrasse“ ankreuzen: Geländer aus Metall, Glas oder Holz, auf Wunsch Stützen bis zum Boden. Ragt er hinaus oder liegt der Hang tiefer, hängt er frei auf einer Platte.",
       "en": "Draw a room in front of the door and tick “Balcony / roof terrace”: a railing of metal, glass or wood, supports down to the ground if you like. Where it reaches out or the slope lies lower, it hangs free on a plate."},
      "Balkon Geländer Balkongeländer Glasgeländer Holzgeländer Stützen Dachterrasse Hang Platte balcony railing glass railing wooden railing supports posts roof terrace slope plate",
      query="mode=edit", prep=balcony_view)
def _(r):
    r.say("Vor der Balkontür liegt schon ein Raum (Werkzeug „Raum“). Antippen.", "In front of the balcony door there is a room already (tool “Room”). Tap it.")
    x, y = r.pg.evaluate("window.__fp.plan().toClient(2.5, -1)")
    r.click(x, y)
    r.wait(1200)
    r.say("In den Eigenschaften: „Balkon / Dachterrasse“ ankreuzen.", "In its properties: tick “Balcony / roof terrace”.")
    r.click("#roomTerrace")
    r.wait(1400)
    r.say("Hier liegt der Hang vorne 3 m tiefer: der Balkon hängt frei, eine Platte trägt ihn.", "Here the slope lies 3 m lower in front: the balcony hangs free, a plate carries it.")
    r.move("#balconyHint")
    r.wait(2200)
    r.say("„Geländer“: Metall, Glas oder Holz.", "“Railing”: metal, glass or wood.")
    r.click("#roomRail")
    r.loc("#roomRail").select_option("glass")
    r.wait(1200)
    r.say("„Stützen bis zum Boden“ stellt Pfosten an die äußeren Ecken.", "“Supports down to the ground” puts posts at the outer corners.")
    r.click("#roomPosts")
    r.wait(1200)
    r.say("Im 3D-Bild: Glasgeländer, Platte und Stützen, der Hang geht darunter weiter.", "In 3D: a glass railing, the plate and the supports, the slope goes on under it.")
    r.js("(() => { const s = window.__fp.settings(); s.houseFloors = 'stacked'; s.seeThrough = false; })()")
    r.click("#view3d")
    r.js("window.__fp.setHouseMode(true)")
    r.wait(1600)
    r.js("window.__fp.camAt(-7, 1, -12, 3, -1)")
    r.wait(3800)
    r.poster()


@clip("floors-add", "edit",
      {"de": "Etagen und Keller anlegen", "en": "Add floors and a basement"},
      {"de": "„＋ Etage“ legt eine neue Etage oben drauf, „Etage verwalten“ einen Keller darunter; links stehen sie alle.",
       "en": "“＋ Floor” adds a new floor on top, “Manage floor” a basement below; they are all listed on the left."},
      "Etage Stockwerk Obergeschoss Keller neu anlegen hinzufügen Geschoss floor storey upstairs basement new add level",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    r.say("Oben: „＋ Etage“.", "At the top: “＋ Floor”.")
    r.prompt = "Obergeschoss" if r.lang == "de" else "Upstairs"
    r.click("#addFloor")
    r.wait(1500)
    r.say("Die neue Etage ist leer; links steht sie über dem Erdgeschoss.", "The new floor is empty; on the left it sits above the ground floor.")
    r.move("#floorRail")
    r.wait(1500)
    r.poster()
    r.say("Ein Keller kommt unter „Etage verwalten“ dazu.", "A basement is added under “Manage floor”.")
    r.click("#floorPanel > summary")
    r.wait(700)
    r.prompt = "Keller" if r.lang == "de" else "Basement"
    r.click("#addBasement")
    r.wait(1600)
    r.prompt = None
    r.say("So hat das Haus jetzt drei Etagen.", "Now the house has three floors.")
    r.move("#floorRail")
    r.wait(1600)


@clip("finishes", "edit",
      {"de": "Böden, Wände und Farben je Raum", "en": "Floors, walls and colours per room"},
      {"de": "Einen Raum anklicken: echter Boden (Parkett, Fliesen, Stein …), die Wände (Farbe, Putz, Tapete, Fliesen bis zu einer Höhe).",
       "en": "Click a room: a real floor (parquet, tiles, stone …), the walls (paint, plaster, wallpaper, tiles up to a height)."},
      "Boden Parkett Fliesen Stein Teppich Wand Farbe Putz Tapete Raum Material floor parquet tiles stone carpet wall colour plaster wallpaper room material",
      query="mode=edit")
def _(r):
    r.click("#viewSplit")
    r.wait(1500)
    r.say("Einen Raum anklicken, hier das Wohnzimmer.", "Click a room, here the living room.")
    p = r.js("(() => { const s = window.__fp.screenOf && window.__fp.screenOf('r1'); return s && [s.x, s.y]; })()")
    if p:
        r.move(*p)
    r.js("window.__fp.select('room', 'r1')")
    r.wait(1200)
    r.say("Rechts der Boden: zum Beispiel dunkles Parkett …", "On the right the floor: for example dark parquet …")
    r.click("#roomCovering")
    opts = r.loc("#roomCovering").evaluate("(s) => [...s.options].map((o) => o.value)")
    r.loc("#roomCovering").select_option("parquetDark" if "parquetDark" in opts else opts[2])
    r.wait(1600)
    r.poster()
    r.say("… und die Wände: Putz, Tapete oder Fliesen, in jeder Farbe.", "… and the walls: plaster, wallpaper or tiles, in any colour.")
    walls = r.loc("#roomWalls")
    if walls.count():
        r.click(walls)
        wo = walls.evaluate("(s) => [...s.options].map((o) => o.value)")
        walls.select_option("plaster" if "plaster" in wo else wo[1])
        r.wait(1200)
    r.click("#propsBody .sw", nth=3)
    r.wait(1800)


@clip("library", "edit",
      {"de": "Möbel aus der Bibliothek, Größe und Sperren", "en": "Furniture from the library, size and lock"},
      {"de": "Über 270 Möbel nach Räumen sortiert, mit Suche; ein Stück auf den Millimeter in der Größe ändern und sperren, damit es nicht verrutscht.",
       "en": "More than 270 pieces sorted by room, with a search; size a piece to the millimetre and lock it so it does not slip."},
      "Möbel Bibliothek Küche Sofa Bett Schrank Größe Breite sperren verschieben Katalog furniture library kitchen sofa bed cupboard size width lock catalogue",
      query="mode=edit", prep=empty_house(walls=True, rooms=True))
def _(r):
    cx, cy = centre(r)
    r.say("„Gerät“: rechts die Bibliothek, nach Räumen sortiert.", "“Device”: the library on the right, sorted by room.")
    r.click("#tools [data-tool=device]")
    r.wait(800)
    r.click("#paletteCats button", text="^(Küche|Kitchen)$")
    r.wait(1000)
    r.poster()
    r.say("Ein Stück wählen und in den Raum klicken.", "Pick a piece and click into the room.")
    r.click("#paletteGrid button", nth=0)
    r.click(cx - 60, cy - 90)
    r.wait(1000)
    r.say("Rechts die genaue Größe in Metern.", "On the right the exact size in metres.")
    w = r.loc("#propsBody input[type=number]", 0)
    r.click(w)
    r.pg.keyboard.press("Control+A")
    r.type("3.2")
    r.key("Enter")
    r.wait(1000)
    r.say("„Sperren“: jetzt verrutscht es nicht mehr aus Versehen.", "“Lock”: now it cannot slip by accident.")
    if r.pg.locator("#devLock").count():
        r.click("#devLock")
    r.wait(1600)


@clip("closet", "edit",
      {"de": "Schrank nach Maß, auch unter der Schräge", "en": "A made-to-measure closet, also under a slope"},
      {"de": "Der Schrank-Editor teilt einen Schrank in Fächer, Schubladen und Türen und passt ihn unter die Dachschräge an.",
       "en": "The closet editor divides a closet into shelves, drawers and doors and fits it under the slope of the roof."},
      "Schrank Kleiderschrank Maß Schräge Dachschräge Fächer Schubladen Türen Einbauschrank closet wardrobe custom slope shelves drawers doors built-in",
      query="mode=edit")
def _(r):
    r.say("Der Schrank steht im Dachgeschoss unter der Schräge.", "The closet stands in the attic under the slope.")
    i = r.js("window.__fp.layout.floors.findIndex((f) => f.devices.some((d) => d.id === 'schrank_dach'))")
    r.click(f"#floorRail .floorThumb[data-floor='{i}']")
    r.wait(1600)
    r.js("window.__fp.select('device', 'schrank_dach')")
    r.wait(1000)
    r.say("Rechts: „Schrank bearbeiten“.", "On the right: “Edit closet”.")
    r.click("#closetEdit")
    r.wait(1800)
    r.poster()
    r.say("Fächer, Schubladen und Türen je Spalte; die Schräge schneidet ihn passend ab.", "Shelves, drawers and doors per column; the slope cuts it to fit.")
    if r.pg.locator("#closetDraw [data-col='2']").count():
        r.click("#closetDraw [data-col='2']")
        r.wait(1200)
    if r.pg.locator("#closet3d").count():
        r.say("„3D“ zeigt ihn von vorn.", "“3D” shows it from the front.")
        r.click("#closet3d")
        r.wait(1800)
    r.click("#closetDialog .closetFoot button[value=cancel]")
    r.wait(700)


@clip("houses", "edit",
      {"de": "Mehrere Häuser und das Nachbarhaus", "en": "Several houses and the neighbour house"},
      {"de": "Ein Plan für jedes Haus (Haupthaus, Ferienhaus, Gartenhaus): oben umschalten; unter „Häuser“ ein neues anlegen, duplizieren, "
             "umbenennen, löschen; unter „Nachbarhaus“ ein anderes Haus daneben zeigen, verschoben und gedreht.",
       "en": "One plan per house (main house, holiday home, garden house): switch at the top; under “Houses” create a new one, duplicate, "
             "rename, delete; under “Neighbour house” show another house beside this one, moved and turned."},
      "Häuser mehrere Haus Ferienhaus Nachbarhaus wechseln anlegen duplizieren umbenennen daneben Lage Drehung "
      "houses several house holiday home neighbour house switch create duplicate rename beside position rotation",
      query="mode=edit")
def _(r):
    r.say("Oben steht, welches Haus du siehst.", "At the top it says which house you see.")
    r.click("#houseSelect")
    opts = r.loc("#houseSelect").evaluate("(s) => [...s.options].map((o) => o.value)")
    r.loc("#houseSelect").select_option(opts[-1])
    r.wait(2200)
    r.say("Ein anderes Haus, mit eigenen Etagen, Geräten und eigenem Strom.", "Another house, with its own floors, devices and power.")
    r.wait(1600)
    r.say("Rechts unter „Häuser“: „+ Neues Haus“ fängt mit einem leeren Plan an.", "On the right under “Houses”: “+ New house” starts with an empty plan.")
    r.click("#housePanel > summary")
    r.wait(700)
    r.move("#houseNew")
    r.wait(1300)
    r.say("„Duplizieren“ macht eine Kopie, „Umbenennen“ gibt ihm einen neuen Namen.", "“Duplicate” makes a copy, “Rename” gives it a new name.")
    r.move("#houseCopy")
    r.wait(900)
    r.move("#houseRename")
    r.wait(1200)
    r.say("Zurück zum ersten Haus.", "Back to the first house.")
    r.click("#houseSelect")
    r.loc("#houseSelect").select_option(opts[0])
    r.wait(2200)
    r.say("„Nachbarhaus“: ein anderes Haus der Liste steht daneben, hier rechts vorne.", "“Neighbour house”: another house of the list stands beside it, here at the front right.")
    r.move("#neighborBody .nbCard")
    r.wait(1600)
    r.poster()
    r.say("Lage, Drehung und Höhe stellst du hier ein, zum Beispiel 30° gedreht.", "Set its position, rotation and height here, for example turned by 30°.")
    rot = r.loc("#neighborBody .nbRot")
    r.click(rot)
    r.key("Control+a")
    r.type("30")
    r.key("Enter")
    r.wait(2200)
    r.say("Bearbeiten kannst du es, wenn du oben zu ihm wechselst.", "To edit it, switch to it at the top.")
    r.click(r.loc("#neighborBody .nbRot"))
    r.key("Control+a")
    r.type("0")
    r.key("Enter")
    r.wait(1200)
    r.move("#houseSelect")
    r.wait(1400)


def spot(r, sel, text=None, center=False):
    """the middle of a thing of the page, asked from the page itself (scrolled into view at once). Playwright's own way waits for
    two quiet frames, which takes seconds while a 3D room is drawn behind it (the video would wait that long), and misses a thing
    that is drawn anew with every state of Home Assistant (the check list and the sum of ⚡ Bookkeeping). center: scrolled into the
    middle of a window that scrolls (at its top edge it would hide under the window's title)."""
    x, y = r.js("""([s, t, c]) => {
      const e = [...document.querySelectorAll(s)].find((x) => !t || new RegExp(t).test(x.textContent));
      e.scrollIntoView({ block: c ? 'center' : 'nearest' });
      const b = e.getBoundingClientRect();
      return [b.x + b.width / 2, b.y + b.height / 2];
    }""", [sel, text, center])
    return x, y


def two_buildings(r):
    """prep: the demo house as two buildings in one plan (#409): the main house and the wing (Hauswirtschaft, with the garage under it)"""
    pg = r.pg
    pg.evaluate("window.__fp.switchFloor(1)")
    pg.wait_for_timeout(400)
    pg.evaluate("document.querySelector('#buildingPanel').open = true")
    pg.click("#bldAdd")
    pg.wait_for_timeout(200)
    pg.click("#bldAdd")
    pg.wait_for_timeout(300)
    for i, n in enumerate(["Haupthaus", "Anbau"] if r.lang == "de" else ["Main house", "Wing"]):
        inp = pg.locator("#buildingBody .bldName").nth(i)
        inp.fill(n)
        inp.dispatch_event("change")
        pg.wait_for_timeout(200)
    ids = pg.evaluate("window.__fp.layout.buildings.map((b) => b.id)")
    for room in ("r1", "r2", "r3", "r4", "r5"):
        pg.select_option(f"#buildingBody select[data-room={room}]", ids[0])
        pg.wait_for_timeout(100)
    pg.select_option("#buildingBody select[data-room=hw1]", ids[1])
    pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#buildingPanel').open = false")
    pg.wait_for_timeout(300)


@clip("energy-buildings", "edit",
      {"de": "⚡ Strom je Gebäude: zwei Häuser in einem Plan", "en": "⚡ Power per building: two houses in one plan"},
      {"de": "Stehen zwei Gebäude in einem Plan, bekommt jedes mit „⚡ Eigene Rechnung je Gebäude“ seinen eigenen Strom-Rechner. Oben ein Gebäude "
             "wählen zeigt nur seinen Strom, „🏘 Alle Gebäude“ jedes für sich, die Seite „Energie“ vergleicht sie.",
       "en": "With two buildings in one plan, “⚡ A calculation of its own per building” gives each its own power bookkeeping. Choosing a "
             "building at the top shows only its power, “🏘 All buildings” each one apart, the page “Energy” compares them."},
      "Strom Gebäude zwei Häuser Haupthaus Anbau Gartenhaus Rechnung je Gebäude getrennt vergleichen "
      "power building two houses main house wing bookkeeping per building apart compare",
      query="mode=edit", prep=two_buildings)
def _(r):
    ids = r.js("window.__fp.layout.buildings.map((b) => b.id)")
    r.say("Dieser Plan hat zwei Gebäude: das Haupthaus und den Anbau. Oben lässt sich umschalten.", "This plan has two buildings: the main house and the wing. You can switch at the top.")
    r.move("#buildingSelect")
    r.wait(1800)
    r.say("Im Bearbeiten: „Strom“, dann „Rechnung“.", "While editing: “Power”, then “Bookkeeping”.")
    r.click("#powerEditBtn")
    r.wait(1500)
    r.click("#energyBtn")
    r.wait(1300)
    r.say("Ganz oben: „⚡ Eigene Rechnung je Gebäude“.", "At the very top: “⚡ A calculation of its own per building”.")
    r.click("#enPerBuilding")
    r.wait(1600)
    r.say("Jedes Gebäude rechnet jetzt für sich. „Rechnung für“ wählt, welches du einstellst.", "Each building counts on its own now. “Calculation for” picks the one you set.")
    r.click(f"#energyUnits .euChip[data-building='{ids[1]}']")
    r.wait(2500)                                                      # the wing alone: the plan is built again
    r.say("Der Anbau: nur die Stromgeräte in seinen Räumen, hier Solar und Batterie.", "The wing: only the power devices in its rooms, here solar and battery.")
    r.move(*spot(r, "#energyResult .enRow.sum", center=True))
    r.poster()
    r.wait(2200)
    r.click("#energyClose")
    r.wait(600)
    r.click("[data-mode=live]")
    r.wait(1500)
    r.say("Oben „🏘 Alle Gebäude“: jedes Gebäude für sich, mit seinem eigenen Bild.", "At the top “🏘 All buildings”: each building on its own, with its own picture.")
    r.loc("#buildingSelect").select_option("")
    r.wait(800)
    if not r.js("document.getElementById('powerBtn').classList.contains('active')"):   # still on from the power editor
        r.click("#powerBtn")
    r.move(*spot(r, "#energyCard"))
    r.wait(2600)
    r.say("Ein Gebäude oben gewählt: nur sein Strom.", "One building chosen at the top: only its power.")
    r.click("#buildingSelect")
    r.loc("#buildingSelect").select_option(ids[0])
    r.wait(3500)                                                      # the main house alone: the plan is built again
    r.say("Auf der Seite „Energie“ ist jedes Gebäude wie ein eigenes Haus, mit „⚖ Vergleichen“.", "On the page “Energy” each building is like a house of its own, with “⚖ Compare”.")
    r.click("#tabBar [data-tab=energy]")
    r.wait(1800)
    r.click("[data-page=energy] [data-house=cmp]")
    r.wait(2600)


@clip("energy-calc", "edit",
      {"de": "⚡ Der Strom-Rechner: welcher Sensor ist was", "en": "⚡ The power bookkeeping: which sensor is what"},
      {"de": "Im Strom-Editor legt „Rechnung“ fest, welcher Sensor das Netz, die Solaranlage, die Batterie, das Haus und die Räume misst: "
             "aus dem Energie-Dashboard übernehmen, die Checkliste sagt, was fehlt, die Rechnung zeigt, ob alles aufgeht.",
       "en": "In the power editor “Bookkeeping” sets which sensor measures the grid, the solar panels, the battery, the house and the rooms: "
             "take it over from the energy dashboard, the check list says what is missing, the sum shows whether it adds up."},
      "Strom Rechnung Rechner Sensor Netz Solar Batterie Hausverbrauch Räume Vorzeichen Checkliste Energie-Dashboard "
      "power bookkeeping calculator sensor grid solar battery house consumption rooms sign check list energy dashboard",
      query="mode=edit")
def _(r):
    r.say("Oben im Bearbeiten: „Strom“. Jetzt siehst du nur die Stromgeräte und „Strom jetzt“.", "At the top while editing: “Power”. Now you see only the power devices and “Power now”.")
    r.click("#powerEditBtn")
    r.wait(2000)
    r.say("Daneben: „Rechnung“, der Strom-Rechner.", "Next to it: “Bookkeeping”, the power calculator.")
    r.click("#energyBtn")
    r.wait(1300)
    r.say("Hier legst du fest, welcher Sensor aus Home Assistant was misst.", "Here you set which sensor of Home Assistant measures what.")
    r.wait(1200)
    r.say("Am schnellsten: „⤵ Aus dem Energie-Dashboard übernehmen“.", "The quickest way: “⤵ Take over from the energy dashboard”.")
    r.click("#enHaLoad")
    r.wait(1600)
    r.say("Es zeigt, was es gefunden hat. „✓ Übernehmen“ trägt alles ein.", "It shows what it found. “✓ Take over” fills it all in.")
    r.move(*spot(r, "#energySetup .enHaList", center=True))
    r.wait(1500)
    r.click("#enHaApply")
    r.wait(1300)
    r.say("Die Checkliste sagt, was fertig ist und was noch fehlt.", "The check list says what is done and what is still missing.")
    r.move(*spot(r, "#enChecklist", center=True))
    r.wait(1800)
    r.poster()
    r.say("„So wird gerade gerechnet“: Solar + Netz − Batterie = was das Haus braucht.", "“How it is counted right now”: solar + grid − battery = what the house uses.")
    r.move(*spot(r, "#energyResult .enRow.sum", center=True))
    r.wait(2200)
    r.say("Darunter jeder Teil einzeln: ein Sensor oder zwei, und „Vorzeichen umdrehen“, wenn er andersherum zählt.",
          "Below, every part on its own: one sensor or two, and “turn the sign round” when it counts the other way.")
    r.move("#enGridInvert")
    r.wait(2200)
    r.say("Bei „Räume“ ordnet „Vorschlagen“ die Zwischenstecker den Räumen zu.", "Under “Rooms”, “Suggest” puts the smart plugs into their rooms.")
    r.click("#enSuggest")
    r.wait(2000)
    r.say("Oben stehen dann die Räume und der „Rest“, den kein Raum misst.", "At the top you then see the rooms and the “rest” that no room measures.")
    r.move(*spot(r, "#energyResult .enRow.room", text="Rest", center=True))
    r.wait(2000)
    r.say("Zählt ein Sensor falsch herum oder doppelt, steht dort eine Warnung, mit einem Knopf zum Umdrehen.",
          "When a sensor counts the wrong way or twice, a warning comes up there, with a button to turn it round.")
    r.wait(2000)
    r.say("Fertig: „Strom jetzt“ rechnet so, auch in der Live-Ansicht.", "Done: “Power now” counts like this, in the live view too.")
    r.click("#energyClose")
    r.wait(900)
    r.move("#energyCard")
    r.wait(2000)


# the canvas of the Nanoleaf editor: the outermost point of the panels drawn now (their cyan edges) to each side, in CSS px of the page
NANO_EDGE = """() => {
  const c = document.querySelector('#nanoCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, pts = [];
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > 90 || d[i + 1] < 190 || d[i + 2] < 230) continue;
    const p = i / 4, x = p % c.width;
    pts.push([x, (p - x) / c.width]);
  }
  if (!pts.length) return null;
  const r = c.getBoundingClientRect(), sx = r.width / c.width, sy = r.height / c.height;
  const far = (k, sign) => {                       // the pixels within 3 px of the extreme on axis k, their middle on the other axis
    const m = Math.max(...pts.map((q) => sign * q[k])), near = pts.filter((q) => sign * q[k] >= m - 3);
    const o = near.reduce((s, q) => s + q[1 - k], 0) / near.length, e = sign * m;
    return k === 0 ? [r.left + e * sx, r.top + o * sy] : [r.left + o * sx, r.top + e * sy];
  };
  return { right: far(0, 1), left: far(0, -1), bottom: far(1, 1), top: far(1, -1) };
}"""
NANO_CAM = "3.0, 2.0, 2.2, -6, -1.2"     # in the living room, the Nanoleaf on the wall in the middle, over the plant


def nano_at(r, side, gap=14):
    """a point just beyond the outermost panel on that side (right, left, top or bottom): a click there snaps a panel onto it"""
    x, y = r.js(NANO_EDGE)[side]
    dx, dy = {"right": (gap, 0), "left": (-gap, 0), "top": (0, -gap), "bottom": (0, gap)}[side]
    return x + dx, y + dy


@clip("nanoleaf-edit", "edit",
      {"de": "Nanoleaf: die Form der Panels zeichnen", "en": "Nanoleaf: draw the shape of the panels"},
      {"de": "„Layout bearbeiten“ am Nanoleaf: Dreiecke, Sechsecke, Quadrate oder Linien ins Feld klicken, sie rasten an den Nachbarn ein; "
             "drehen, löschen, zurück. An der Wand hängt dann genau deine Form und leuchtet in ihren Farben.",
       "en": "“Edit layout” on the Nanoleaf: click triangles, hexagons, squares or lines into the field, they snap onto their neighbours; "
             "rotate, erase, undo. Then your very shape hangs on the wall and glows in its colours."},
      "Nanoleaf Layout Form Panels Dreieck Sechseck Quadrat Linie zeichnen einrasten drehen Shapes "
      "Nanoleaf layout shape panels triangle hexagon square line draw snap rotate Shapes",
      query="mode=edit", sky="20:30", settings={"labelMode": "none"})
def _(r):
    r.say("Rechts unter „Objekte“ den Nanoleaf suchen und antippen.", "On the right under “Objects”, search for the Nanoleaf and tap it.")
    r.click(*spot(r, "#objList .objfilter"))
    r.type("Nanoleaf")
    r.wait(700)
    r.click(*spot(r, "#objList .obj", text="Nanoleaf"))
    r.wait(500)
    r.js(f"window.__fp.camAt({NANO_CAM})")
    r.say("Er hängt an der Wand im Wohnzimmer.", "It hangs on the wall of the living room.")
    r.wait(1800)
    r.say("Rechts: „✎ Layout bearbeiten“.", "On the right: “✎ Edit layout”.")
    r.click(*spot(r, "#nanoEdit"))
    r.wait(1300)
    r.say("Oben die Form: Dreieck, kleines Dreieck, Sechseck, Quadrat oder Linie.", "At the top the shape: triangle, small triangle, hexagon, square or line.")
    for s in ("tri2", "hex", "sq", "bar"):
        r.move(*spot(r, f"#nanoDialog [data-shape={s}]"), ms=450)
        r.wait(300)
    r.click(*spot(r, "#nanoDialog [data-shape=tri]"))
    r.wait(500)
    r.say("Ins Feld klicken: gelb zeigt, wo es hinkommt, die Kante rastet am Nachbarn ein.", "Click into the field: yellow shows where it goes, the edge snaps onto its neighbour.")
    r.move(*nano_at(r, "right"))
    r.wait(1200)
    r.click(*nano_at(r, "right"))
    r.wait(900)
    r.click(*nano_at(r, "bottom"))
    r.wait(900)
    r.say("Ein Sechseck dazu.", "Add a hexagon.")
    r.click(*spot(r, "#nanoDialog [data-shape=hex]"))
    r.wait(400)
    r.click(*nano_at(r, "left"))
    r.wait(1200)
    r.poster()
    r.say("„Drehen“ (oder die Taste R) dreht das nächste Panel, ein Rechtsklick löscht eins.", "“Rotate” (or the key R) turns the next panel, a right click erases one.")
    r.click(*spot(r, "#nanoDialog [data-shape=sq]"))
    r.click(*spot(r, "#nanoRot"))
    r.wait(400)
    r.click(*nano_at(r, "top"))
    r.wait(1100)
    r.say("„Zurück“ nimmt den letzten Schritt zurück.", "“Undo” takes the last step back.")
    r.click(*spot(r, "#nanoUndo"))
    r.wait(1100)
    r.say("Unten: wie viele Panels es sind; über der Form: wie groß sie wird.", "At the bottom: how many panels there are; above the shape: how big it gets.")
    r.move(*spot(r, "#nanoCount"))
    r.wait(1600)
    r.say("„Übernehmen“: an der Wand hängt die neue Form. Dann „Speichern“.", "“Apply”: the new shape hangs on the wall. Then “Save”.")
    r.click(*spot(r, "#nanoOk"))
    r.wait(2600)
    r.move(*spot(r, "#saveBtn"))
    r.wait(1200)


@clip("objlist", "edit",
      {"de": "Die Liste aller Objekte", "en": "The list of all objects"},
      {"de": "Rechts im Bearbeiten: alles nach Räumen, mit Suche; ein Tipp wählt es aus, der Haken davor sperrt es.",
       "en": "On the right while editing: everything by room, with a search; a tap selects it, the tick in front locks it."},
      "Objekte Liste Suche alle Geräte Raum auswählen sperren finden objects list search all devices room select lock find",
      query="mode=edit")
def _(r):
    r.click("#view2d")
    r.wait(900)
    r.say("Rechts unter „Objekte“: alles im Haus, nach Räumen.", "On the right under “Objects”: everything in the house, by room.")
    r.move("#objList")
    r.wait(1200)
    r.say("Suchen, zum Beispiel „Lampe“.", "Search, for example “lamp”.")
    r.click("#objList .objfilter")
    r.type("Lampe" if r.lang == "de" else "Lamp")
    r.wait(1200)
    r.poster()
    r.say("Ein Tipp wählt es im Plan aus.", "A tap selects it in the plan.")
    r.click("#objList .obj", nth=0)
    r.wait(1500)
    r.say("Der Haken davor sperrt es.", "The tick in front locks it.")
    r.click("#objList .objlock", nth=0)
    r.wait(1500)


@clip("toolbar", "edit",
      {"de": "Die Werkzeugleiste anpassen", "en": "Customise the tool bar"},
      {"de": "✎ neben den Werkzeugen: Werkzeuge ausblenden und umsortieren; seltene wandern ins Menü „Mehr“.",
       "en": "✎ beside the tools: hide and re-order tools; rare ones move into the “More” menu."},
      "Werkzeugleiste Werkzeuge anpassen ausblenden sortieren Reihenfolge Mehr Menü tool bar tools customise hide order more menu",
      query="mode=edit")
def _(r):
    r.say("Rechts neben den Werkzeugen: ✎.", "Right of the tools: ✎.")
    r.click("#toolsEditBtn")
    r.wait(1200)
    r.poster()
    r.say("Der Haken blendet ein Werkzeug aus, ▲ ▼ ändern die Reihenfolge.", "The tick hides a tool, ▲ ▼ change the order.")
    r.click("dialog[open] .tbRow input[type=checkbox]", nth=4)
    r.wait(900)
    r.click("dialog[open] .tbRow button", text="▲", nth=6)
    r.wait(1200)
    r.say("„Zurücksetzen“ stellt die normale Leiste wieder her.", "“Reset” brings back the normal bar.")
    r.click("dialog[open] button", text="Zurücksetzen|Reset")
    r.wait(1300)
    r.key("Escape")
    r.wait(600)


def _import_check():
    """the add-on's answer to "Prüfen" for the example house (the demo has no importer): the real importer of the add-on decides"""
    import json
    import sys
    from recorder import ROOT
    app = ROOT / "floorplan3d" / "rootfs" / "app"
    sys.path.insert(0, str(app))
    import importer
    data = json.loads((app / "examples" / "house.json").read_text())
    _, _, report, summary = importer.build_layout(data)
    return {"api/import": {"summary": summary, "warnings": report.warnings, "errors": report.errors, "ok": True, "dryRun": True,
                           "name": data.get("name", "")}}


@clip("import", "edit",
      {"de": "Ein Haus aus einer Beschreibung bauen (Import)", "en": "Build a house from a description (import)"},
      {"de": "Import: ein Haus als Text (JSON) beschreiben, z. B. von einer KI, prüfen und bauen lassen; mit Beispielen und Anleitung für die KI.",
       "en": "Import: describe a house as text (JSON), e.g. from an AI, check it and let it be built; with examples and a prompt for the AI."},
      "Import JSON KI ChatGPT beschreiben bauen Grundstück Räume Beispiel prüfen GeoJSON import AI describe build plot rooms example check",
      query="mode=edit", answers=_import_check)
def _(r):
    r.say("Unter „Häuser“: „Import“.", "Under “Houses”: “Import”.")
    r.click("#housePanel > summary")
    r.wait(600)
    r.click("#importOpen")
    r.wait(1300)
    r.say("Ein Beispiel laden, oder den Text einer KI einfügen.", "Load an example, or paste the text of an AI.")
    r.click("#importExHouse")
    r.wait(1300)
    r.poster()
    r.say("„Prüfen“ sagt, ob alles stimmt und was gebaut wird.", "“Check” says whether everything is right and what will be built.")
    r.click("#importCheck")
    r.wait(2200)
    r.say("„Importieren“ legt daraus ein neues Haus an; die anderen bleiben, wie sie sind.", "“Import” creates a new house from it; the others stay as they are.")
    r.move("#importRun")
    r.wait(1600)
    r.key("Escape")
    r.wait(500)
