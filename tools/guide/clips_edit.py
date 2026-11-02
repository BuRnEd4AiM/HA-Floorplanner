"""Clips of the group "Plan zeichnen" (edit mode: walls, rooms, doors and windows, devices, moving, measuring).

Most of them start in a new, empty house of the demo ("Gartenhaus"): prepared before the recording starts (prep), so the
video begins with an empty plan in 2D. The house is drawn with the same clicks a person makes."""
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
      {"de": "Messen", "en": "Measure"},
      {"de": "„Messen“ zeigt Abstände und Winkel: zwei Punkte anklicken.",
       "en": "“Measure” shows distances and angles: click two points."},
      "messen Abstand Länge Winkel Meter Maßband measure distance length angle metre tape",
      query="mode=edit")
def _(r):
    r.click("#view2d")
    r.wait(900)
    r.say("Oben: „Messen“.", "At the top: “Measure”.")
    r.click("#tools [data-tool=measure]")
    r.wait(700)
    r.say("Klicke den Anfang und das Ende.", "Click the start and the end.")
    a = r.js("(() => { const s = window.__fp.screenOf('d2'); return s && [s.x, s.y]; })()") or (600, 400)
    r.click(a[0] - 120, a[1] - 60)
    r.wait(400)
    r.click(a[0] + 140, a[1] - 60)
    r.wait(1200)
    r.poster()
    r.say("Die Länge steht an der Linie, rechts mehr dazu.", "The length is on the line, more on the right.")
    r.wait(2200)
