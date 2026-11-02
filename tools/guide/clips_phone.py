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
