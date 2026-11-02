"""Clips of the group "Handy und Tablet": the add-on on a phone (filmed in a phone, touched with a finger)."""
from recorder import clip


@clip("phone-house", "phone",
      {"de": "Am Handy: Haus, Räume und Licht", "en": "On the phone: house, rooms and light"},
      {"de": "Am Handy passt sich alles an: Räume antippen, Licht schalten, mit zwei Fingern drehen und zoomen.",
       "en": "On a phone everything fits: tap rooms, switch lights, turn and zoom with two fingers."},
      "Handy Smartphone iPhone Android unterwegs Touch Finger App phone smartphone mobile touch finger",
      device="phone", sky="18:40")
def _(r):
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


@clip("phone-pages", "phone",
      {"de": "Am Handy: die Seiten", "en": "On the phone: the pages"},
      {"de": "Unten wechselst du die Seiten: Heute, Energie, Klima und alle anderen, zum Wischen gemacht.",
       "en": "Switch the pages at the bottom: today, energy, climate and all the others, made for swiping."},
      "Handy Seiten Leiste unten wischen Heute Energie Klima phone pages bar bottom swipe today energy climate",
      device="phone")
def _(r):
    r.say("Unten stehen die Seiten.", "The pages are at the bottom.")
    r.click("#tabBar [data-tab=today]")
    r.wait(1800)
    r.poster()
    r.say("„Energie“ zeigt Verbrauch und Solarstrom.", "“Energy” shows usage and solar power.")
    r.click("#tabBar [data-tab=energy]")
    r.wait(1800)
    r.say("„Klima“ alle Räume mit Temperatur.", "“Climate” every room with its temperature.")
    r.click("#tabBar [data-tab=climate]")
    r.wait(2000)
    r.say("„Haus“ bringt dich zurück zum 3D-Bild.", "“House” brings you back to the 3D view.")
    r.click("#tabBar [data-tab=house]")
    r.wait(1800)


@clip("phone-edit", "phone",
      {"de": "Am Handy bearbeiten", "en": "Edit on the phone"},
      {"de": "☰ → „Bearbeiten“: oben die Werkzeuge in einer Leiste zum Wischen, „2D“ zeigt den Plan. Mit dem Finger Wände zeichnen, ein Fenster antippen und unten einstellen, auch seinen Kontakt. ☰ → „Live“ geht zurück zum Haus.",
       "en": "☰ → “Edit”: the tools in a strip at the top to swipe, “2D” shows the plan. Draw walls with the finger, tap a window and set it up below, its contact too. ☰ → “Live” goes back to the house."},
      "Handy bearbeiten Bearbeiten-Modus unterwegs Wand zeichnen Finger tippen Fenster Kontakt Sensor Werkzeuge Leiste rückgängig "
      "phone edit edit mode mobile on the go draw wall finger tap window contact sensor tools strip undo",
      device="phone")
def _(r):
    r.say("Auch am Handy kannst du bearbeiten: tippe oben links auf ☰.", "You can edit on the phone too: tap ☰ at the top left.")
    r.click("#tbMenuBtn")
    r.wait(1000)
    r.say("Dann auf „Bearbeiten“.", "Then “Edit”.")
    r.click("#modeSwitch [data-mode=edit]")
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
