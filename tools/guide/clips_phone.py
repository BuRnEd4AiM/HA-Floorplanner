"""Clips of the group "Handy und Tablet": the add-on on a phone (filmed in a phone, touched with a finger)."""
from recorder import clip


def house(r, say=True):
    """since 5.22.0 a phone starts on Start (the app view): the house is the tab 3D-Haus"""
    if say:
        r.say("Unten „3D-Haus“ zeigt dein Haus.", "“3D house” at the bottom shows your house.")
    r.click("#tabBar [data-tab=house]")
    r.wait(1200)


@clip("phone-house", "phone",
      {"de": "Am Handy: Haus, Räume und Licht", "en": "On the phone: house, rooms and light"},
      {"de": "Am Handy passt sich alles an: Räume antippen, Licht schalten, mit zwei Fingern drehen und zoomen.",
       "en": "On a phone everything fits: tap rooms, switch lights, turn and zoom with two fingers."},
      "Handy Smartphone iPhone Android unterwegs Touch Finger App phone smartphone mobile touch finger",
      device="phone", sky="18:40")
def _(r):
    house(r)
    r.say("Am Handy siehst du dein Haus wie am großen Bildschirm.", "On the phone you see your house as on a big screen.")
    r.wait(1500)
    r.say("Tippe auf einen Raum.", "Tap a room.")
    r.click("#roomLabels [data-room=r1]")
    r.wait(1800)
    r.poster()
    r.say("Tippe auf eine Lampe: ihre Karte öffnet sich.", "Tap a lamp: its card opens.")
    r.click(*r.ball("d5"))
    r.wait(1600)
    r.say("„Aus“ und „An“ wie am PC.", "“Off” and “On” as on a computer.")
    if r.pg.locator("#livePopup .actions button").count() > 1:
        r.click("#livePopup .actions button", nth=1)
        r.wait(1200)
        r.click("#livePopup .actions button", nth=0)
    r.wait(1500)


@clip("phone-room", "phone",
      {"de": "Am Handy: die Karte eines Raums", "en": "On the phone: a room's card"},
      {"de": "Ein Raum antippen: seine Karte kommt erst klein, das Haus bleibt zu sehen. Oben die Werte, darunter große Knöpfe für Licht, Szenen, Rollo und Heizung (mit dem, was der Heizplan macht). Am Griff hochziehen zeigt alles mit Reitern, herunterziehen macht sie wieder klein.",
       "en": "Tap a room: its card first comes small and the house stays in sight. The values on top, big buttons below for light, scenes, blinds and heating (with what the heating plan does). Pulling the grip up shows everything with tabs, pulling it down makes it small again."},
      "Handy Raumkarte Raum antippen klein hochziehen Griff Knöpfe Licht Szenen Rollo Heizung Heizplan phone room card tap small pull up grip buttons light scenes blinds heating schedule",
      device="phone", sky="21:30")
def _(r):
    house(r)
    r.say("Tippe auf einen Raum: seine Karte kommt erst klein, das Haus bleibt zu sehen.", "Tap a room: its card first comes small and the house stays in sight.")
    r.click("#roomLabels [data-room=r1]")
    r.wait(2000)
    r.poster()
    r.say("Oben die Werte, darunter große Knöpfe: Licht, Szenen, Rollo, Heizung.", "The values on top, big buttons below: light, scenes, blinds, heating.")
    r.move("#roomPanel .rpQuick")
    r.wait(1500)
    if r.pg.locator("#roomPanel .rpLine").count():
        r.say("Darunter steht, was der Heizplan gerade macht.", "Below it says what the heating plan does right now.")
        r.move("#roomPanel .rpLine")
        r.wait(1400)
    r.say("„Licht“ öffnet die ganze Karte mit den Lampen.", "“Light” opens the whole card with the lamps.")
    r.click("#roomPanel .rpQ[data-q=light]")
    r.wait(1600)
    r.say("Oben die Reiter: Licht, Rollo, Klima, Geräte, Fenster.", "The tabs on top: light, blinds, climate, devices, windows.")
    r.move("#roomPanel .rpTabs")
    r.wait(1300)
    r.say("Am Griff herunterziehen macht die Karte wieder klein.", "Pulling the grip down makes the card small again.")
    g = r.pg.locator("#roomPanel .rpGrip").bounding_box()
    if g:
        r.drag(g["x"] + g["width"] / 2, g["y"] + g["height"] / 2, g["x"] + g["width"] / 2, g["y"] + g["height"] / 2 + 120)
    r.wait(1800)


@clip("phone-floors", "phone",
      {"de": "Am Handy: Etage und Zimmer wählen", "en": "On the phone: choose the floor and the room"},
      {"de": "Oben ein Knopf für Etage und Zimmer: die Liste zeigt die Etagen und darunter die Zimmer; der Knopf nennt, was offen ist.",
       "en": "One button at the top for the floor and the room: its list shows the floors and the rooms below; the button names what is open."},
      "Handy Etage Stockwerk Zimmer Raum wählen Keller Obergeschoss phone floor storey room choose basement",
      device="phone", sky="13:00")
def _(r):
    house(r)
    r.say("Oben links steht die Etage, mit grünem Punkt, wenn jemand da ist.", "Top left is the floor, with a green dot when someone is there.")
    r.move("#phoneNavBtn")
    r.wait(1500)
    r.say("Ein Tipp: oben die Etagen, darunter die Zimmer.", "One tap: the floors at the top, the rooms below.")
    r.click("#phoneNavBtn")
    r.wait(1600)
    r.poster()
    r.say("Tippe auf ein Zimmer: es öffnet sich, der Knopf nennt es.", "Tap a room: it opens, the button names it.")
    r.click("#phoneNav .pnRoom", nth=1)
    r.wait(2000)
    r.say("Eine andere Etage: wieder oben antippen.", "Another floor: tap the top again.")
    r.click("#phoneNavBtn")
    r.wait(900)
    r.click("#phoneNav .pnFloors .pill", nth=2)
    r.wait(1800)


@clip("phone-pages", "phone",
      {"de": "Am Handy: wie eine App", "en": "On the phone: like an app"},
      {"de": "Unten fünf Reiter: Start, Räume, 3D-Haus, Energie und Mehr. Start begrüßt dich mit dem Wichtigsten, oben Haus und Gebäude, die Chips öffnen ihre Liste, in der Mitte dreht sich das ganze Gebäude (ein Tipp öffnet es in 3D), darunter die Räume als Kacheln; ein Raum öffnet sich als eigene Seite. Im 3D-Haus runde Knöpfe für Farben, Ansicht und Szenen. Unter „Mehr“ alle anderen Seiten, Bearbeiten, Anleitung, Backup, die Einstellungen als Liste und die klassische Ansicht.",
       "en": "Five tabs at the bottom: home, rooms, 3D house, energy and more. Home greets you with what matters, the house and building on top, the chips open their list, the whole building turning in the middle (a tap opens it in 3D), the rooms as tiles below; a room opens as a page of its own. Round buttons for colours, view and scenes in the 3D house. Under “More” every other page, edit, guide, backup, the settings as a list and the classic view."},
      "Handy App Start Räume Kacheln Seiten Leiste unten Mehr Heute Energie Klima klassische Ansicht phone app home rooms tiles pages bar bottom more today energy climate classic view",
      device="phone", sky="19:40")
def _(r):
    r.say("Am Handy beginnt alles mit „Start“: oben das Wichtigste, darunter deine Räume.", "On the phone everything starts with “Home”: what matters on top, your rooms below.")
    r.wait(2200)
    r.poster()
    r.say("In der Mitte dreht sich dein ganzes Haus, live mit den Lampen, die an sind.", "In the middle your whole house turns, live with the lamps that are on.")
    r.wait(2600)
    r.say("Ein Tipp darauf öffnet es in 3D, von derselben Seite.", "A tap on it opens it in 3D, from the same side.")
    r.click("[data-page=start] [data-act=appHouse]")
    r.wait(2400)
    r.click("#tabBar [data-tab=start]")
    r.wait(1000)
    r.say("Ein Raum antippen: er öffnet sich als eigene Seite.", "Tap a room: it opens as a page of its own.")
    r.click("[data-page=start] .apRoom", nth=0)
    r.wait(2200)
    r.say("„‹ Start“ geht zurück.", "“‹ Home” goes back.")
    r.click("#appBack")
    r.wait(1000)
    r.say("Oben das Haus: ein Tipp wählt ein anderes Haus oder Gebäude.", "The house at the top: a tap chooses another house or building.")
    r.click("[data-page=start] [data-act=appPlace]")
    r.wait(1800)
    r.click(".apSheet [data-house]", nth=0)
    r.wait(1000)
    r.say("Ein Tipp auf „💡 an“ zeigt die Lampen, die brennen; „Alle aus“ macht sie aus.", "A tap on “💡 on” shows the lamps that are on; “All off” switches them off.")
    r.click("[data-page=start] [data-chip=lights]")
    r.wait(2000)
    r.key("Escape")
    r.pg.mouse.click(200, 40)
    r.wait(600)
    r.say("„Räume“ zeigt alle Räume nach Etagen.", "“Rooms” shows every room by floor.")
    r.click("#tabBar [data-tab=rooms]")
    r.wait(1800)
    r.say("Unter „Mehr“ alle anderen Seiten und die Einstellungen.", "Under “More” every other page and the settings.")
    r.click("#tabBar [data-tab=more]")
    r.wait(2000)
    r.click(".apSheet [data-tab=climate]")
    r.wait(1800)
    r.say("„3D-Haus“ zeigt dein Haus wie gewohnt; rechts die runden Knöpfe für Farben, Ansicht und Szenen.", "“3D house” shows your house as always; the round buttons on the right for colours, view and scenes.")
    r.click("#tabBar [data-tab=house]")
    r.wait(1500)
    r.click("[data-fab=colors]")
    r.wait(1600)
    r.click(".apSheet .apItem", nth=1)
    r.wait(1800)
    r.say("Die Einstellungen sind eine Liste, jede Gruppe eine eigene Seite.", "The settings are a list, every group a page of its own.")
    r.click("#tabBar [data-tab=more]")
    r.wait(800)
    r.click(".apSheet [data-act=appSettings]")
    r.wait(1500)
    r.click("#sgNav button", nth=0)
    r.wait(1800)


@clip("phone-rooms", "phone",
      {"de": "📱 Am Handy: Räume anheften, alles an oder aus, Szenen", "en": "📱 On the phone: pin rooms, all on or off, scenes"},
      {"de": "Auf Start stehen zuerst die angehefteten Räume, dann jeder Raum, in dem Licht an ist, in der Farbe seines Lichts. Der runde Knopf einer Kachel öffnet ihre Liste: alle Lichter an, alle aus, die Szenen des Raums, anheften; ein Tipp auf eine Zeile ist die Bestätigung. „📌 Anheften“ wählt die Räume, die immer oben stehen (für dieses Handy). Die Chips oben stehen in Zeilen, nichts zum Wischen; 📷 öffnet die Kameras.",
       "en": "Home shows the pinned rooms first, then every room with a light on, in the colour of its light. The round button of a tile opens its list: all lights on, all off, the room's scenes, pin; a tap on a line is the confirmation. “📌 Pin” chooses the rooms that always stand on top (for this phone). The chips on top are in lines, nothing to swipe; 📷 opens the cameras."},
      "Handy Start Räume anheften festpinnen oben Kachel Knopf alles an alles aus Szene Licht an Bestätigung Kameras Chips "
      "phone home pin rooms on top tile button all on all off scene light on confirm cameras chips",
      device="phone", sky="19:40")
def _(r):
    r.say("Oben auf Start steht alles auf einen Blick, auch 📷 für die Kameras.", "Everything is at a glance on top of home, 📷 for the cameras too.")
    r.wait(2200)
    r.say("Darunter jeder Raum, in dem Licht an ist, in der Farbe seines Lichts.", "Below, every room with a light on, in the colour of its light.")
    r.js("document.querySelector('[data-page=start] .apSec').scrollIntoView({ behavior: 'smooth', block: 'start' })")
    r.wait(2200)
    r.poster()
    r.say("Der runde Knopf einer Kachel: alle Lichter an oder aus, oder eine Szene des Raums.", "The round button of a tile: all lights on or off, or one of the room's scenes.")
    r.click("[data-page=start] .apRoom[data-room=r1] .apToggle")
    r.wait(2400)
    r.say("Ein Tipp auf eine Zeile ist die Bestätigung, zum Beispiel die Szene.", "A tap on a line is the confirmation, the scene for example.")
    r.click(".apSheet [data-act=roomScene]")
    r.wait(1800)
    r.say("„📌 Anheften“ wählt Räume, die immer oben stehen.", "“📌 Pin” chooses rooms that always stand on top.")
    r.click("[data-page=start] [data-act=appPins]")
    r.wait(1600)
    r.click(".apSheet [data-pin$='/r2']")
    r.wait(1400)
    r.pg.mouse.click(200, 40)
    r.wait(800)
    r.js("document.querySelector('[data-page=start] .apSec').scrollIntoView({ behavior: 'smooth', block: 'start' })")
    r.say("Die Küche steht jetzt immer zuerst, mit 📌, auch wenn ihr Licht aus ist.", "The kitchen is now always first, with 📌, even with its light off.")
    r.wait(2600)
    r.js("localStorage.removeItem('fp.appPins')")


@clip("phone-dash", "phone",
      {"de": "📱 Am Handy die Seiten bearbeiten", "en": "📱 Edit the pages on the phone"},
      {"de": "In der App-Ansicht hat jede Seite unter „Mehr“ oben „✎ Bearbeiten“: Karten verschieben, ausblenden, „＋ Karte“, Abschnitte, wie am Tablet. „🗂 Reiter“ zeigt alle Seiten in Zeilen zum Ordnen und „＋ Seite“; „✓ Fertig“ beendet es.",
       "en": "In the app view every page under “More” has “✎ Edit” on top: move cards, hide them, “＋ Card”, sections, as on a tablet. “🗂 Tabs” shows every page in lines to order them and “＋ Page”; “✓ Done” ends it."},
      "Handy Seite bearbeiten Dashboard Karten verschieben ausblenden hinzufügen Reiter ordnen neue Seite App-Ansicht "
      "phone edit page dashboard move cards hide add tabs order new page app view",
      device="phone")
def _(r):
    r.say("Unter „Mehr“ eine Seite öffnen, zum Beispiel „Heute“.", "Open a page under “More”, “Today” for example.")
    r.click("#tabBar [data-tab=more]")
    r.wait(1200)
    r.click(".apSheet [data-tab=today]")
    r.wait(1600)
    r.say("Oben rechts „✎ Bearbeiten“.", "“✎ Edit” on the top right.")
    r.click("#appEdit")
    r.wait(2000)
    r.poster()
    r.say("Karten mit ⠿ verschieben, mit 👁 ausblenden, „＋ Karte“ fügt eine hinzu – wie am Tablet.", "Move cards with ⠿, hide them with 👁, “＋ Card” adds one – as on a tablet.")
    r.js("document.getElementById('tabPages').scrollBy({ top: 520, behavior: 'smooth' })")
    r.wait(2600)
    r.js("document.getElementById('tabPages').scrollTo({ top: 0, behavior: 'smooth' })")
    r.wait(1200)
    r.say("„🗂 Reiter“ zeigt alle Seiten zum Ordnen und „＋ Seite“.", "“🗂 Tabs” shows every page to order them and “＋ Page”.")
    r.click("[data-page=today] .bdStrip button", text="Reiter")
    r.wait(2600)
    r.say("„✓ Fertig“ – und unten ist wieder die Leiste der App.", "“✓ Done” – and the app's bar is back at the bottom.")
    r.click("#tabEditBar button.primary")
    r.wait(1200)
    r.click("[data-page=today] .bdStrip button.primary")
    r.wait(1500)


@clip("phone-edit", "phone",
      {"de": "Am Handy bearbeiten", "en": "Edit on the phone"},
      {"de": "„Mehr“ → „Bearbeiten“: oben die Werkzeuge in einer Leiste zum Wischen, „2D“ zeigt den Plan. Mit dem Finger Wände zeichnen, ein Fenster antippen und unten einstellen, auch seinen Kontakt. ☰ → „Live“ geht zurück zum Haus.",
       "en": "“More” → “Edit”: the tools in a strip at the top to swipe, “2D” shows the plan. Draw walls with the finger, tap a window and set it up below, its contact too. ☰ → “Live” goes back to the house."},
      "Handy bearbeiten Bearbeiten-Modus unterwegs Wand zeichnen Finger tippen Fenster Kontakt Sensor Werkzeuge Leiste rückgängig "
      "phone edit edit mode mobile on the go draw wall finger tap window contact sensor tools strip undo",
      device="phone")
def _(r):
    r.say("Auch am Handy kannst du bearbeiten: unten „Mehr“ …", "You can edit on the phone too: “More” at the bottom …")
    r.click("#tabBar [data-tab=more]")
    r.wait(1000)
    r.say("… dann „Bearbeiten“.", "… then “Edit”.")
    r.click(".apSheet [data-act=menu-edit]")
    r.wait(1600)
    r.say("Oben stehen die Werkzeuge in einer Leiste: zur Seite wischen zeigt die anderen.", "The tools are in a strip at the top: swipe sideways for the others.")
    r.js("document.getElementById('tools').scrollTo({ left: 420, behavior: 'smooth' })")
    r.wait(1800)
    r.js("document.getElementById('tools').scrollTo({ left: 0, behavior: 'smooth' })")
    r.wait(1200)
    r.say("„2D“ zeigt den Plan zum Zeichnen.", "“2D” shows the plan for drawing.")
    r.click("#view2d")
    r.wait(1600)
    r.say("„Wand“ und Punkt für Punkt tippen; zweimal tippen beendet die Wand.", "“Wall” and tap point by point; a double tap ends the wall.")
    r.click("#tools [data-tool=wall]")
    bb = r.box("#plan2d")
    cx, cy = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2
    r.click(cx - 130, cy + 100)
    r.wait(300)
    r.click(cx + 30, cy + 100, ms=900)
    r.wait(300)
    r.click(cx + 30, cy - 10, ms=800, double=True)
    r.wait(1200)
    r.poster()
    r.say("↶ nimmt sie wieder weg.", "↶ takes them away again.")
    r.click("#undoBtn")
    r.wait(400)
    r.click("#undoBtn")
    r.wait(1000)
    r.say("„Auswählen“ und ein Fenster antippen: unten stehen seine Einstellungen.", "“Select” and tap a window: its settings are below.")
    r.click("#tools [data-tool=select]")
    x, y = r.js("window.__fp.plan().toClient(1.5, 7)")      # a window of the demo (o8): at the others a shutter or a lamp lies on top
    r.click(x, y)
    r.wait(1800)
    r.say("Weiter unten der Kontakt aus Home Assistant, für jeden Flügel einer.", "Further down the contact from Home Assistant, one for every pane.")
    r.js("document.querySelector('#propsBody .entPicker')?.scrollIntoView({ behavior: 'smooth', block: 'center' })")
    r.wait(2200)
    r.say("Fertig? ☰ und „Live“ bringen dich zurück zum Haus.", "Done? ☰ and “Live” take you back to the house.")
    r.click("#tbMenuBtn")
    r.wait(800)
    r.click("#modeSwitch [data-mode=live]")
    r.wait(2000)
