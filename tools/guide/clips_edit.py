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
      {"de": "„Dach“ legt ein Dach über das Haus: Satteldach, Walmdach oder Flachdach, die Neigung, dazu Gauben.",
       "en": "“Roof” puts a roof over the house: gable, hip or flat, the pitch, and dormers."},
      "Dach Satteldach Walmdach Flachdach Neigung Gaube Dachgeschoss Dachfenster roof gable hip flat pitch dormer attic roof window",
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
    r.say("Der Schrank steht im Dach unter der Schräge.", "The closet stands in the roof under the slope.")
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
      {"de": "Mehrere Häuser", "en": "Several houses"},
      {"de": "Ein Plan für jedes Haus (Haupthaus, Ferienhaus, Nachbarhaus): oben umschalten, unter „Häuser“ anlegen, kopieren, umbenennen.",
       "en": "One plan per house (main house, holiday home, neighbour): switch at the top, create, copy and rename under “Houses”."},
      "Häuser mehrere Haus Ferienhaus Nachbarhaus wechseln anlegen kopieren houses several house holiday home neighbour switch create copy",
      query="mode=edit")
def _(r):
    r.say("Oben steht, welches Haus du siehst.", "At the top it says which house you see.")
    r.click("#houseSelect")
    opts = r.loc("#houseSelect").evaluate("(s) => [...s.options].map((o) => o.value)")
    r.loc("#houseSelect").select_option(opts[-1])
    r.wait(2200)
    r.poster()
    r.say("Ein anderes Haus, mit eigenen Etagen und Geräten.", "Another house, with its own floors and devices.")
    r.wait(1500)
    r.say("Unter „Häuser“: ein neues Haus, eine Kopie, umbenennen.", "Under “Houses”: a new house, a copy, rename.")
    r.click("#housePanel > summary")
    r.wait(1500)
    r.click("#houseSelect")
    r.loc("#houseSelect").select_option(opts[0])
    r.wait(1800)


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
