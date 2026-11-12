"""Clips of the group "Bedienen" (live mode: lights, shutters, heating, scenes, the alarm, devices)."""
import sys
from pathlib import Path

from recorder import clip

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def room(r, rid="r1"):
    """tap the label of a room (the camera flies there)"""
    r.click(f"#roomLabels [data-room={rid}]")
    r.wait(1700)


@clip("light", "live",
      {"de": "Licht schalten, dimmen und färben", "en": "Switch, dim and colour a light"},
      {"de": "Die Kugel einer Lampe antippen: ihre Karte öffnet sich. An, aus, heller, dunkler und eine Farbe.",
       "en": "Tap the ball of a lamp and its card opens: on, off, brighter, darker and a colour."},
      "Lampe Licht an aus Helligkeit dimmen Farbe Karte Kugel lamp light on off brightness dim colour color card ball", sky="19:15")
def _(r):
    r.say("Tippe auf einen Raum, um näher heranzugehen.", "Tap a room to get closer.")
    room(r)
    r.say("Jede Lampe hat eine Kugel. Tippe sie an: ihre Karte öffnet sich.", "Every lamp has a ball. Tap it and its card opens.")
    r.click(*r.ball("d4"))
    r.wait(800)
    r.say("Mit der rechten Maustaste schiebst du den Raum neben die Karte.", "Drag with the right mouse button to move the room beside the card.")
    r.drag(470, 600, 150, 560, ms=1000, button="right")
    r.wait(600)
    r.say("„Aus“ schaltet sie aus, „An“ wieder an.", "“Off” turns it off, “On” on again.")
    r.click("#livePopup .actions button", nth=1)
    r.wait(1200)
    r.click("#livePopup .actions button", nth=0)
    r.wait(1000)
    r.say("Mit dem Schieber wird sie heller oder dunkler.", "The slider makes it brighter or darker.")
    r.slide("#livePopup .briRange", 0.25)
    r.wait(700)
    r.slide("#livePopup .briRange", 0.9)
    r.wait(700)
    r.poster()
    r.say("Ein Tipp auf eine Farbe färbt das Licht.", "Tap a colour to colour the light.")
    r.click("#livePopup .swatches .sw", nth=1)
    r.wait(1200)
    r.click("#livePopup .swatches .sw", nth=6)
    r.wait(1500)


@clip("lightgroups", "live",
      {"de": "Welche Lampen sind an?", "en": "Which lamps are on?"},
      {"de": "Oben zeigt „💡 an“, wie viele Lampen brennen. Ein Tipp listet sie nach Bereichen, „Aus“ schaltet einen ganzen Bereich aus.",
       "en": "“💡 on” at the top shows how many lamps are on. A tap lists them by area, “Off” turns a whole area off."},
      "Lampen an Lichter Gruppen alle aus Bereich Keller oben lamps on lights groups all off area")
def _(r):
    r.say("Oben siehst du, wie viele Lampen gerade an sind.", "At the top you see how many lamps are on right now.")
    r.move("#lightsPill")
    r.wait(800)
    r.say("Ein Tipp zeigt sie nach Bereichen.", "A tap shows them by area.")
    r.click("#lightsPill")
    r.wait(1300)
    r.poster()
    r.say("„Aus“ zweimal tippen: der ganze Bereich geht aus.", "Tap “Off” twice: the whole area goes off.")
    r.click("#lightsMenu .lgRow[data-id=g_keller] .lgOff")
    r.wait(500)
    r.click("#lightsMenu .lgRow[data-id=g_keller] .lgOff")
    r.wait(1800)
    r.say("Die Zahl oben zählt gleich mit.", "The number at the top counts along.")
    r.move("#lightsPill")
    r.wait(1500)


@clip("shutter", "live",
      {"de": "Rollladen auf und zu", "en": "Open and close a shutter"},
      {"de": "Die Kugel des Rollladens antippen: Öffnen, Schließen, Stopp. Im 3D-Bild fährt er mit. Rechts in der Leiste des Raums: "
             "Hoch, Stopp, Runter und 0 bis 100 % mit einem Tipp.",
       "en": "Tap the ball of the shutter: open, close, stop. It moves in the 3D view too. In the room's panel on the right: up, stop, "
             "down and 0 to 100 % with one tap."},
      "Rollladen Rolladen Jalousie Rollo öffnen schließen hoch runter Fenster Prozent halb Leiste shutter blind cover open close up down "
      "window percent half panel", sky="11:00")
def _(r):
    r.say("Tippe auf den Raum mit dem Rollladen.", "Tap the room with the shutter.")
    room(r)
    r.say("Tippe auf die Kugel des Rollladens.", "Tap the ball of the shutter.")
    r.click(*r.ball("d7c"))
    r.wait(900)
    r.say("„Schließen“ fährt ihn herunter, auch im Bild.", "“Close” lowers it, in the picture too.")
    r.click("#livePopup .actions button", nth=1)
    r.wait(2600)
    r.poster()
    r.say("„Öffnen“ fährt ihn wieder hoch.", "“Open” raises it again.")
    r.click("#livePopup .actions button", nth=0)
    r.wait(2600)
    r.say("Rechts in der Leiste des Raums geht es auch: Hoch, Stopp, Runter und feste Stufen von 0 bis 100 %.",
          "The room's panel on the right has it too: up, stop, down and fixed steps from 0 to 100 %.")
    r.move("#roomPanel .rpCoverActs button", nth=1)
    r.wait(900)
    r.say("„50 %“: er fährt halb herunter.", "“50 %”: it goes halfway down.")
    r.click("#roomPanel .rpCoverPresets button[data-pos='50']")
    r.wait(2600)


@clip("heating", "live",
      {"de": "Heizung einstellen", "en": "Set the heating"},
      {"de": "Im Raum zeigt die Karte „Heizung“ die Temperatur. Heizen, Auto oder Aus und eine Vorwahl wie Eco oder Boost.",
       "en": "In a room the card “Heating” shows the temperature. Heat, auto or off and a preset like eco or boost."},
      "Heizung Thermostat Temperatur heizen warm Eco Komfort Boost Vorwahl heating thermostat temperature heat preset comfort")
def _(r):
    r.say("Tippe auf einen Raum: oben erscheint seine Heizung.", "Tap a room: its heating shows up at the top.")
    room(r)
    r.wait(400)
    r.say("„Heizen“ schaltet das Thermostat ein.", "“Heat” turns the thermostat on.")
    r.click("#heatPanel .hp-modes button", nth=1)
    r.wait(1300)
    r.poster()
    r.say("Mit + und − stellst du die Wunsch-Temperatur.", "+ and − set the temperature you want.")
    if r.pg.locator("#heatPanel .hp-set button").count() > 1:
        r.click("#heatPanel .hp-set button", nth=1)
        r.wait(500)
        r.click("#heatPanel .hp-set button", nth=1)
        r.wait(900)
    r.say("Eine Vorwahl wie „Eco“ oder „Boost“ geht mit einem Tipp.", "A preset like “Eco” or “Boost” is one tap.")
    r.click("#heatPanel .hp-presets button[data-v=eco]")
    r.wait(1000)
    r.click("#heatPanel .hp-presets button[data-v=boost]")
    r.wait(1600)


@clip("scenes", "live",
      {"de": "Eine Szene starten", "en": "Start a scene"},
      {"de": "Unten stehen deine Szenen und Skripte. Ein Tipp startet sie, das Haus zeigt sofort das neue Licht.",
       "en": "Your scenes and scripts are at the bottom. A tap starts one and the house shows the new light at once."},
      "Szene Skript starten Stimmung Leiste unten TV-Abend Gute Nacht scene script start mood bar bottom", sky="20:30")
def _(r):
    r.say("Unten stehen deine Szenen.", "Your scenes are at the bottom.")
    r.move("#sceneBar .sbTile[data-e='scene.tv_abend']")
    r.wait(700)
    r.say("Ein Tipp auf „TV-Abend“ startet die Szene.", "Tap “TV evening” to start the scene.")
    r.click("#sceneBar .sbTile[data-e='scene.tv_abend']")
    r.wait(2200)
    r.poster()
    r.say("Die zuletzt gestartete Szene ist markiert.", "The scene started last is marked.")
    r.wait(1200)
    r.say("„Gute Nacht“ macht alles aus.", "“Good night” turns everything off.")
    r.click("#sceneBar .sbTile", text="Gute Nacht|Good night")
    r.wait(2400)


@clip("tiles", "live",
      {"de": "Kacheln: Favoriten und Räume", "en": "Tiles: favourites and rooms"},
      {"de": "Die Kacheln unten zeigen deine Favoriten und jeden Raum mit Temperatur und Licht. Antippen schaltet oder öffnet.",
       "en": "The tiles at the bottom show your favourites and every room with its temperature and light. A tap switches or opens."},
      "Kacheln Favoriten Raum Temperatur schnell Stern tiles favourites favorites room temperature quick star")
def _(r):
    r.say("Unten stehen Kacheln für deine Favoriten und Räume.", "Tiles for your favourites and rooms are at the bottom.")
    r.move("#roomTiles .rtTile[data-fav='light.kueche']")
    r.wait(700)
    r.say("Ein Tipp auf eine Lampe schaltet sie.", "Tap a lamp to switch it.")
    r.click("#roomTiles .rtTile[data-fav='light.kueche']")
    r.wait(1500)
    r.poster()
    r.say("Ein Tipp auf einen Raum öffnet ihn.", "Tap a room to open it.")
    r.click("#roomTiles .rtTile[data-room=r4]")
    r.wait(2200)
    r.say("Mit ☆ auf einer Geräte-Karte wird etwas zum Favoriten.", "☆ on a device card makes something a favourite.")
    r.wait(1500)


@clip("devices", "live",
      {"de": "Alle Geräte, Batterien und Offline", "en": "All devices, batteries and offline"},
      {"de": "„Geräte“ listet alles nach Etage und Raum: was an ist, welche Batterie schwach ist, was nicht antwortet.",
       "en": "“Devices” lists everything by floor and room: what is on, which battery is low, what does not answer."},
      "Geräte Liste Batterie schwach leer offline nicht erreichbar Übersicht devices list battery low empty offline overview")
def _(r):
    r.say("Tippe oben auf „Geräte“.", "Tap “Devices” at the top.")
    r.click("#devicesPill")
    r.wait(1200)
    r.say("Zuerst die Geräte mit schwacher Batterie.", "First the devices with a low battery.")
    r.wait(1200)
    r.poster()
    r.say("„An / offen“ zeigt, was gerade läuft oder offen ist.", "“On / open” shows what is running or open.")
    r.click("#devicePanel .dl-filters [data-filter=on]")
    r.wait(1500)
    r.say("Ein Tipp auf ein Gerät zeigt es im Haus.", "Tap a device to see it in the house.")
    r.click("#devicePanel .dl-row", nth=1)
    r.wait(2200)


@clip("open", "live",
      {"de": "Offene Fenster und Türen", "en": "Open windows and doors"},
      {"de": "Das rote Schild oben zählt offene Fenster und Türen. Ein Tipp listet sie, noch ein Tipp zeigt sie im Plan.",
       "en": "The red badge at the top counts open windows and doors. A tap lists them, another one shows them in the plan."},
      "offen Fenster Tür geöffnet Kontakt lüften open window door contact")
def _(r):
    r.say("Rot oben: so viele Fenster und Türen sind offen.", "Red at the top: this many windows and doors are open.")
    r.click("#openPill")
    r.wait(1200)
    r.poster()
    r.say("Tippe auf ein Fenster: das Bild zeigt, wo es ist.", "Tap a window: the picture shows where it is.")
    r.click("#openList button", text="Fenster|Window")
    r.wait(2600)


@clip("alarm", "live",
      {"de": "Urlaubs-Alarm scharf schalten", "en": "Arm the holiday alarm"},
      {"de": "Code eingeben, das Haus verlassen: öffnet jemand eine Tür, zählt die Zeit bis zum Alarm. Mit dem Code ist er wieder aus.",
       "en": "Enter the code and leave the house: when someone opens a door the time to the alarm runs. The code turns it off again."},
      "Alarm Urlaub scharf Einbruch Code Sicherheit Tür Sirene holiday alarm arm burglar code security door siren")
def _(r):
    r.say("Tippe oben auf „Alarm aus“.", "Tap “Alarm off” at the top.")
    r.click("#guardBtn")
    r.wait(1000)
    r.say("Gib deinen Code ein (in der Demo 1234).", "Enter your code (1234 in the demo).")
    for k in "1234":
        r.click(f"#guardScreen .gdPad button[data-key='{k}']", ms=380)
        r.wait(80)
    r.say("„Scharf schalten“: jetzt hast du Zeit, das Haus zu verlassen.", "“Arm”: now you have time to leave the house.")
    r.click("#guardGo")
    r.wait(1600)
    r.poster()
    r.say("Später öffnet jemand die Bürotür …", "Later someone opens the office door …")
    r.hide()
    r.fast(10)
    r.wait(6200)
    r.normal()
    r.show()
    r.say("… die Zeit bis zum Alarm läuft. Mit dem Code ist alles wieder aus.", "… the time to the alarm runs. The code turns everything off again.")
    r.wait(800)
    if r.pg.locator("#guardScreen .gdPad").count() == 0:
        r.click("#guardBar, #guardBtn")
        r.wait(700)
    for k in "1234":
        r.click(f"#guardScreen .gdPad button[data-key='{k}']", ms=380)
        r.wait(80)
    r.click("#guardGo")
    r.wait(1800)


def _security_day():
    import make_screenshots as ms
    d = ms.timeline_day()
    return {"api/timeline": d["info"], "api/timeline/": d["day"]}


@clip("security", "live",
      {"de": "Sicherheit: den Tag zurückspulen", "en": "Security: rewind the day"},
      {"de": "„Sicherheit“ spielt einen aufgezeichneten Tag ab: wann welches Licht, Fenster und Tor an oder offen war.",
       "en": "“Security” plays back a recorded day: when which light, window and gate was on or open."},
      "Sicherheit Aufzeichnung Verlauf zurückspulen gestern Tag Zeitleiste wer war da security recording history rewind yesterday timeline",
      sky="19:35", answers=_security_day)
def _(r):
    r.say("Tippe oben auf „Sicherheit“.", "Tap “Security” at the top.")
    r.click("#timelineBtn")
    r.wait(900)
    r.say("Wähle einen Tag.", "Pick a day.")
    r.click("#tlDays .tlDay")
    r.wait(1500)
    r.say("Unten ist der Tag mit allem, was passiert ist.", "The day with everything that happened is at the bottom.")
    r.wait(800)
    r.say("Ziehe den Regler: das Haus zeigt genau diese Uhrzeit.", "Drag the slider: the house shows exactly that time.")
    r.slide("#tlBar input[type=range]", 0.72)
    r.wait(700)
    r.poster()
    r.slide("#tlBar input[type=range]", 0.82)
    r.wait(1600)


@clip("voice", "live",
      {"de": "Fragen stellen: „Welche Fenster sind offen?“", "en": "Ask: “Which windows are open?”"},
      {"de": "Mit 🎤 fragst du das Haus (am Tablet mit Mikrofon, über Assist von Home Assistant): die Antwort steht da, und das Bild zeigt die Stellen.",
       "en": "With 🎤 you ask the house (on a tablet with a microphone, through Home Assistant's Assist): the answer shows and the picture points at the places."},
      "Sprachsuche Mikrofon fragen sprechen Assist Antwort Fenster offen wie warm voice search microphone ask speak answer windows open how warm")
def _(r):
    r.say("Unten links neben der Lupe ist das 🎤 (am Tablet mit Mikrofon).", "Bottom left beside the magnifier is the 🎤 (on a tablet with a microphone).")
    r.move("#findBtn")
    r.wait(1200)
    r.say("Du fragst: „Welche Fenster sind offen?“", "You ask: “Which windows are open?”")
    r.wait(800)
    r.js("window.__fp.voiceAsk('Welche Fenster sind offen?')" if r.lang == "de" else "window.__fp.voiceAsk('Which windows are open?')")
    r.wait(2200)
    r.poster()
    r.say("Die Antwort steht oben, das Fenster ist im Bild markiert.", "The answer is at the top, the window is marked in the picture.")
    r.wait(2200)
    r.say("Auch „Schalte das Licht im Wohnzimmer aus“ geht (mit Nachfrage beim ganzen Haus).", "“Turn off the light in the living room” works too (the whole house asks first).")
    r.wait(2200)


@clip("warnings", "live",
      {"de": "Warnungen: Regen am offenen Fenster, Rauch, Wasser", "en": "Warnings: rain at an open window, smoke, water"},
      {"de": "Regnet es und ein Fenster ist offen, steht oben ein Hinweis und der Raum leuchtet. Genauso bei Rauch, Gas, Wasser und Alarm (rot).",
       "en": "When it rains and a window is open, a note shows at the top and the room glows. The same for smoke, gas, water and alarm (red)."},
      "Warnung Regen Fenster offen Rauchmelder Rauch Gas Wasser Leck Alarm rot blinkt warning rain window open smoke detector gas water leak alarm red",
      query="mode=live&weather=rainy")
def _(r):
    r.say("Es regnet, und im Wohnzimmer ist ein Fenster offen.", "It is raining, and a window is open in the living room.")
    r.wait(1200)
    r.say("Oben steht die Warnung; ein Tipp zeigt das Fenster.", "The warning is at the top; a tap shows the window.")
    r.move("#alertBar")
    r.wait(900)
    r.poster()
    r.click("#alertBar")
    r.wait(2400)
    r.say("Rauch, Gas, Wasser und Alarm warnen genauso, nur in Rot und mit Blinken.", "Smoke, gas, water and alarm warn the same way, only in red and flashing.")
    r.wait(2200)


@clip("ledring", "live",
      {"de": "LED-Ring unter der Decke", "en": "LED ring under the ceiling"},
      {"de": "Ein LED-Streifen rund um den Raum, in Abschnitte geteilt: jeden Abschnitt einzeln oder den ganzen Ring schalten und färben.",
       "en": "An LED strip all around the room, split into sections: switch and colour every section on its own or the whole ring."},
      "LED Ring Streifen Voute indirekt Decke Abschnitt Farbe Licht LED ring strip cove indirect ceiling section colour light", sky="21:30")
def _(r):
    r.say("Im Schlafzimmer läuft ein LED-Ring unter der Decke.", "An LED ring runs under the ceiling in the bedroom.")
    room(r, "r4")
    r.wait(400)
    r.say("Tippe auf seine Kugel.", "Tap its ball.")
    r.click(*r.ball("d22"))
    r.wait(1100)
    r.say("Jeder Abschnitt lässt sich einzeln schalten …", "Every section can be switched on its own …")
    r.click("#livePopup button", text="^2$")
    r.wait(1300)
    r.click("#livePopup button", text="^2$")
    r.wait(900)
    r.poster()
    r.say("… oder der ganze Ring bekommt eine Farbe.", "… or the whole ring gets a colour.")
    r.click("#livePopup .swatches .sw", nth=6)
    r.wait(1800)


@clip("effects", "live",
      {"de": "Effekte: Nanoleaf, WLED und Co.", "en": "Effects: Nanoleaf, WLED and more"},
      {"de": "Lampen mit Effekten (Nanoleaf, WLED, Hue …) zeigen ihre Effekte in der Karte; ein Nanoleaf leuchtet im Bild in seiner Form.",
       "en": "Lamps with effects (Nanoleaf, WLED, Hue …) list their effects on their card; a Nanoleaf glows in its own shape in the picture."},
      "Effekt Nanoleaf WLED Hue Szene Lichteffekt Farbe Form Dreiecke effect light effect colour shape triangles", sky="20:30")
def _(r):
    r.say("An der Wand im Wohnzimmer hängt ein Nanoleaf.", "A Nanoleaf hangs on the wall of the living room.")
    room(r, "r1")
    r.say("Tippe auf seine Kugel.", "Tap its ball.")
    r.click(*r.ball("d21"))
    r.wait(1000)
    r.say("Unten in der Karte: die Effekte des Leuchtmittels.", "At the bottom of the card: the effects of the light.")
    sel = r.loc("#livePopup .fxsel")
    r.click(sel)
    opts = sel.evaluate("(s) => [...s.options].map((o) => o.value).filter(Boolean)")
    if opts:
        sel.select_option(opts[min(1, len(opts) - 1)])
    r.wait(1600)
    r.poster()
    r.say("Mit einem Tipp auf eine Farbe ist er wieder einfarbig.", "Tap a colour and it is one colour again.")
    r.click("#livePopup .swatches .sw", nth=4)
    r.wait(1600)


@clip("doorbell", "live",
      {"de": "Türklingel mit Kamera", "en": "Doorbell with camera"},
      {"de": "Klingelt es, zeigt jedes Wandtablet die Kamera an der Tür mit „Tür öffnen“ (es fragt noch einmal) und spielt einen Gong.",
       "en": "When someone rings, every wall tablet shows the camera at the door with “Open the door” (it asks once more) and plays a chime."},
      "Türklingel Klingel Tür öffnen Kamera Gong Besuch Wandtablet doorbell ring door open camera chime visitor wall tablet")
def _(r):
    r.say("Jemand klingelt an der Haustür …", "Someone rings at the front door …")
    r.hide()
    r.wait(600)
    r.js("window.__fp.bellTest()")
    r.wait(1800)
    r.show()
    r.poster()
    r.say("… das Tablet zeigt die Kamera an der Tür.", "… the tablet shows the camera at the door.")
    r.wait(1500)
    r.say("„Tür öffnen“ fragt noch einmal, bevor es aufmacht.", "“Open the door” asks once more before it opens.")
    r.move("#bellOpen")
    r.wait(1500)
    r.say("„Schließen“ und alles ist wie vorher.", "“Close” and everything is as before.")
    r.click("#bellClose")
    r.wait(1300)


@clip("usedby", "live",
      {"de": "🔎 Wer benutzt dieses Gerät?", "en": "🔎 What uses this device?"},
      {"de": "🔎 „Wird benutzt“ zeigt, welche Automationen, Skripte, Szenen und Regeln ein Gerät benutzen und ob sie gerade laufen.",
       "en": "🔎 “Used by” shows which automations, scripts, scenes and rules use a device and whether they run right now."},
      "wird benutzt Automation Skript Szene Regel welche benutzt Gerät used by automation script scene rule which uses device")
def _(r):
    r.say("Zum Beispiel beim Thermostat: unten „Klima“.", "For example with a thermostat: “Climate” at the bottom.")
    r.click("#tabBar [data-tab=climate]")
    r.wait(1200)
    r.say("Am Wohnzimmer: „🔎 Wird benutzt“.", "At the living room: “🔎 Used by”.")
    r.click("[data-page=climate] .ubBtn", nth=0)
    r.wait(2600)
    r.poster()
    r.say("Die Liste zeigt alles, was dieses Gerät schaltet: Automationen, Skripte, Szenen und Heiz-Regeln, und ob sie gerade laufen.",
          "The list shows everything that switches this device: automations, scripts, scenes and heating rules, and whether they run right now.")
    r.wait(2800)
    r.say("Das 🔎 gibt es auch auf der Karte jedes Geräts im Haus.", "The 🔎 is also on the card of every device in the house.")
    r.wait(1800)
    r.key("Escape")
    r.wait(600)
