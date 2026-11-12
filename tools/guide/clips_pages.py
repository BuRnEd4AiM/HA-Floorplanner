"""Clips of the group "Seiten": the pages of the tab bar at the bottom (Today, Energy, Climate, Cameras, Music, Household, Routines, Family, Log)."""
from recorder import clip


def tab(r, name):
    r.click(f"#tabBar [data-tab={name}]")
    r.wait(1300)


def scroll(r, dy, at=(700, 450), n=3):
    r.move(*at)
    for _ in range(n):
        r.pg.mouse.wheel(0, dy / n)
        r.wait(380)


def btn(page, text):
    return f"[data-page={page}] button", text


@clip("today", "pages",
      {"de": "☀ Heute: der Tag auf einen Blick", "en": "☀ Today: the day at a glance"},
      {"de": "Uhrzeit, Wetter der nächsten Tage, dein Zug, Müll, Termine und was im Haus los ist.",
       "en": "The time, the weather of the next days, your train, the bins, appointments and what is going on in the house."},
      "heute Tag Wetter Uhr Zug Bahn Müll Termine Kalender Übersicht today day weather clock train bins calendar overview")
def _(r):
    r.say("Unten in der Leiste: „Heute“.", "In the bar at the bottom: “Today”.")
    tab(r, "today")
    r.say("Uhrzeit und das Wetter der nächsten Tage.", "The time and the weather of the next days.")
    r.wait(1600)
    r.poster()
    r.say("Dein Zug zur Arbeit, mit Verspätung und Gleis.", "Your train to work, with delay and platform.")
    r.move(470, 470)
    r.wait(1800)
    r.say("Weiter unten kommt noch mehr.", "There is more further down.")
    scroll(r, 700)
    r.wait(1500)


@clip("energy", "pages",
      {"de": "⚡ Energie: Verbrauch und Solarstrom", "en": "⚡ Energy: usage and solar power"},
      {"de": "Was das Haus heute verbraucht, was vom Dach kam, was es kostet. Auch für Woche, Monat und Jahr.",
       "en": "What the house used today, what came from the roof, what it costs. Also for week, month and year."},
      "Energie Strom Verbrauch Solar PV Kosten kWh Tag Woche Monat Jahr Netz Batterie energy power usage solar cost grid battery")
def _(r):
    r.say("Tippe unten auf „Energie“.", "Tap “Energy” at the bottom.")
    tab(r, "energy")
    r.say("Oben: Verbrauch, vom Dach, aus dem Netz und die Kosten.", "At the top: usage, from the roof, from the grid and the costs.")
    r.wait(1800)
    r.say("Die Balken zeigen jede Stunde: orange vom Dach, blau aus dem Netz.", "The bars show every hour: orange from the roof, blue from the grid.")
    r.move(330, 420)
    r.wait(1600)
    r.poster()
    r.say("„Woche“, „Monat“ oder „Jahr“ zeigt längere Zeiten.", "“Week”, “Month” or “Year” shows longer times.")
    r.click("[data-page=energy] .tpChip", text="^(Woche|Week)$")
    r.wait(1500)
    r.click("[data-page=energy] .tpChip", text="^(Monat|Month)$")
    r.wait(1800)


@clip("energy-houses", "pages",
      {"de": "⚡ Strom von mehreren Häusern: eigene Zähler, vergleichen", "en": "⚡ Power of several houses: own meters, compare"},
      {"de": "Jedes Haus bekommt im Strom-Rechner seine eigenen Sensoren, Zähler und den Strompreis. Auf der Seite „Energie“ dann ein Haus, "
             "alle zusammen oder „⚖ Vergleichen“: jedes Haus in seiner Farbe, mit Verbrauch, Leistung jetzt und Kosten.",
       "en": "In the power bookkeeping every house gets its own sensors, meters and electricity price. On the page “Energy” then one house, "
             "all together or “⚖ Compare”: every house in its colour, with its use, its power now and its costs."},
      "mehrere Häuser zweites Haus Strom Zähler Strompreis vergleichen alle zusammen Ferienhaus Energie "
      "several houses second house power meters electricity price compare all together holiday home energy",
      query="mode=edit")
def _(r):
    r.say("Ein zweites Haus: oben wählen, hier das Nachbarhaus.", "A second house: choose it at the top, here the neighbour house.")
    r.click("#houseSelect")
    opts = r.loc("#houseSelect").evaluate("(s) => [...s.options].map((o) => o.value)")
    r.loc("#houseSelect").select_option(opts[-1])
    r.wait(2000)
    r.say("„Strom“ und „Rechnung“: jedes Haus hat seinen eigenen Strom-Rechner.", "“Power” and “Bookkeeping”: every house has its own power bookkeeping.")
    r.click("#powerEditBtn")
    r.wait(1000)
    r.click("#energyBtn")
    r.wait(1300)
    r.say("„Eigener Sensor für den Hausverbrauch“: was dieses Haus gerade braucht.", "“Own sensor for the house consumption”: what this house uses right now.")
    r.move("#enHouse")
    r.wait(2000)
    r.say("Ganz unten „Zähler für den Verlauf“: seine eigenen Zähler in kWh …", "At the very bottom “Meters for the history”: its own meters in kWh …")
    r.move("#energyBody .emKind")
    r.wait(1800)
    r.say("… und sein Strompreis. Das Energie-Dashboard von Home Assistant gibt es nur einmal, darum braucht jedes weitere Haus hier seine eigenen.",
          "… and its electricity price. Home Assistant has only one energy dashboard, so every further house needs its own ones here.")
    r.move("#emPrice_buy")
    r.wait(2600)
    r.click("#energyClose")
    r.wait(600)
    r.click("#powerEditBtn")
    r.wait(500)
    r.say("In der Live-Ansicht: unten „Energie“.", "In the live view: “Energy” at the bottom.")
    r.click("#modeSwitch [data-mode=live]")
    r.wait(1500)
    tab(r, "energy")
    r.say("Oben ein Knopf je Haus.", "At the top a button per house.")
    r.click("[data-page=energy] .tpChip[data-house=main]")
    r.wait(1500)
    r.say("„Alle zusammen“ zählt alle Häuser zusammen.", "“All together” adds up every house.")
    r.click("[data-page=energy] .tpChip[data-house='*']")
    r.wait(1800)
    r.say("„⚖ Vergleichen“: jedes Haus in seiner Farbe, daneben die Leistung jetzt.", "“⚖ Compare”: every house in its colour, beside it the power now.")
    r.click("[data-page=energy] .tpChip[data-house=cmp]")
    r.wait(2200)
    r.poster()
    r.say("Mit „Woche“, „Monat“ oder „Jahr“: ein Balken je Haus, und was jedes gekostet hat.", "With “Week”, “Month” or “Year”: a bar per house, and what each cost.")
    r.click("[data-page=energy] .tpChip", text="^(Woche|Week)$")
    r.wait(2000)
    scroll(r, 600)
    r.wait(1600)


@clip("climate", "pages",
      {"de": "🌡 Klima: alle Räume und Thermostate", "en": "🌡 Climate: every room and thermostat"},
      {"de": "Jeder Raum mit Temperatur und Luft. Am Thermostat mit − / + oder am Ring ziehen, Heizen oder Aus wählen, eine Vorwahl tippen.",
       "en": "Every room with its temperature and air. Set the thermostat with − / + or by dragging along the ring, choose heat or off, tap a preset."},
      "Klima Heizung Thermostat Temperatur Luft CO2 lüften Räume climate heating thermostat temperature air rooms")
def _(r):
    r.say("Tippe unten auf „Klima“.", "Tap “Climate” at the bottom.")
    tab(r, "climate")
    r.say("Jeder Raum zeigt seine Temperatur. Rot heißt: hier gibt es einen Hinweis.", "Every room shows its temperature. Red means: there is a hint here.")
    r.wait(1600)
    r.say("Am Büro-Thermostat: mit + wird es wärmer.", "On the office thermostat: + makes it warmer.")
    r.click("[data-page=climate] .thPlus")
    r.wait(600)
    r.click("[data-page=climate] .thPlus")
    r.wait(1000)
    r.poster()
    r.say("Oder den Punkt am Ring ziehen: der Wert folgt, beim Loslassen wird er geschickt.", "Or drag the dot along the ring: the value follows, letting go sends it.")
    kx, ky = r.js("(() => { const k = [...document.querySelectorAll('[data-page=climate] .thKnob')].find((e) => e.getBoundingClientRect().width); "
                  "const b = k.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()")
    bx = r.box("[data-page=climate] .thSvg.thDrag")
    r.drag(kx, ky, bx["x"] + bx["width"] * 0.66, bx["y"] + bx["height"] * 0.12, ms=1300)   # along the ring, a little right of the top
    r.wait(1400)
    r.say("„Heizen“, „Auto“ oder „Aus“ und eine Vorwahl wie „Eco“.", "“Heat”, “Auto” or “Off” and a preset like “Eco”.")
    r.click("[data-page=climate] .thMode.m-heat")
    r.wait(1100)
    r.click("[data-page=climate] .thChip", text="^Eco$")
    r.wait(1300)
    r.say("„Nur mit Hinweis“ zeigt nur Räume, um die du dich kümmern solltest.", "“Only those to look at” shows only rooms that need you.")
    r.click("[data-page=climate] .tpChip", text="Hinweis|look at")
    r.wait(1800)


@clip("heatplan", "pages",
      {"de": "📅 Heizplan: wann welcher Raum warm ist", "en": "📅 Heating schedule: when which room is warm"},
      {"de": "Im Heizplan bekommt jeder Raum eine Woche aus farbigen Blöcken: Nacht, Eco, Komfort. Beim Ziehen einer Kante steht die Uhrzeit darüber.",
       "en": "In the heating schedule every room gets a week of coloured blocks: night, eco, comfort. Dragging an edge shows the time above it."},
      "Heizplan Zeitplan Woche Uhrzeit ziehen Kante Nacht Eco Komfort Thermostat heating schedule plan week time drag edge night comfort")
def _(r):
    tab(r, "climate")
    r.say("Unter „Klima“ oben auf „Heizplan“.", "Under “Climate” tap “Schedule” at the top.")
    r.click("[data-page=climate] [data-view=plan]")
    r.wait(1500)
    r.say("Wähle einen Raum.", "Pick a room.")
    r.click("[data-page=climate] .hpRooms [data-room]", text="Wohnzimmer|Living")
    r.wait(1600)
    r.poster()
    r.say("Jeder Tag ist eine Reihe aus Blöcken: dunkel ist Nacht, hell ist Komfort.", "Every day is a row of blocks: dark is night, bright is comfort.")
    r.wait(2200)
    r.say("Die Kante eines Blocks ziehen: darüber steht die genaue Uhrzeit.", "Drag the edge of a block: the exact time shows above it.")
    h = r.box("[data-page=climate] .hpBar[data-day='1'] .hpHandle")
    x0, y0 = h["x"] + 6, h["y"] + h["height"] / 2
    r.drag(x0, y0, x0 + 80, y0, ms=2000)
    r.wait(2000)
    r.say("Oben stellst du ein, wie warm Nacht, Eco und Komfort sind.", "At the top you set how warm night, eco and comfort are.")
    r.wait(2000)


@clip("heatrules", "pages",
      {"de": "📋 Heiz-Regeln: Fenster auf, Heizung aus", "en": "📋 Heating rules: window open, heating off"},
      {"de": "Fertige Regeln zum Einschalten: Fenster offen, niemand da, Nacht, Sommer, Boost und mehr.",
       "en": "Ready-made rules to switch on: window open, nobody home, night, summer, boost and more."},
      "Heiz-Regeln Regel Fenster offen abwesend Nacht Sommer Boost Vorrang Raumfühler heating rules window open away night summer")
def _(r):
    tab(r, "climate")
    r.say("Unter „Klima“ oben auf „Heiz-Regeln“.", "Under “Climate” tap “Heating rules” at the top.")
    r.click("[data-page=climate] [data-view=rules]")
    r.wait(1600)
    r.poster()
    r.say("Jede Regel hat einen Schalter: an oder aus.", "Every rule has a switch: on or off.")
    r.wait(1500)
    r.say("Zum Beispiel: Fenster auf, dann geht die Heizung im Raum aus.", "For example: window open, then the heating in that room goes off.")
    scroll(r, 600)
    r.wait(1800)
    scroll(r, 600)
    r.wait(1500)


@clip("cameras", "pages",
      {"de": "📷 Kameras ansehen", "en": "📷 Watch the cameras"},
      {"de": "Alle Kameras auf einer Seite, mit Bewegung. Ein Tipp zeigt eine Kamera groß.",
       "en": "All cameras on one page, with motion. A tap shows a camera big."},
      "Kamera Kameras Video Bewegung live Bild camera cameras video motion live picture")
def _(r):
    r.say("Tippe unten auf „Kameras“.", "Tap “Cameras” at the bottom.")
    tab(r, "cameras")
    r.say("Rot heißt: hier hat sich etwas bewegt.", "Red means: something moved here.")
    r.wait(1600)
    r.poster()
    r.say("Ein Tipp zeigt die Kamera groß.", "A tap shows the camera big.")
    r.click("[data-page=cameras] .tpCam", nth=0)
    r.wait(2400)
    r.key("Escape")
    r.wait(800)


@clip("media", "pages",
      {"de": "🎵 Musik und Fernseher", "en": "🎵 Music and TV"},
      {"de": "Jeder Lautsprecher und Fernseher: Pause, weiter, lauter, ein Radiosender mit einem Tipp.",
       "en": "Every speaker and TV: pause, next, louder, a radio station with one tap."},
      "Musik Fernseher TV Lautsprecher Radio Sonos Spotify Lautstärke Pause music tv speaker radio volume pause")
def _(r):
    r.say("Tippe unten auf „Musik & TV“.", "Tap “Music & TV” at the bottom.")
    tab(r, "media")
    r.say("Jeder Lautsprecher und Fernseher hat seine Karte.", "Every speaker and TV has its card.")
    r.wait(1200)
    r.say("Pause und weiter:", "Pause and play:")
    r.click("[data-page=media] .mpBtn.main", nth=1)
    r.wait(1000)
    r.click("[data-page=media] .mpBtn.main", nth=1)
    r.wait(900)
    r.poster()
    r.say("Mit dem Schieber wird es lauter.", "The slider makes it louder.")
    r.slide("[data-page=media] input[type=range]", 0.6, nth=1)
    r.wait(800)
    r.say("Ein Radiosender startet mit einem Tipp.", "A radio station starts with one tap.")
    r.click("[data-page=media] .mpStation", nth=0)
    r.wait(1800)


@clip("household", "pages",
      {"de": "🧺 Haushalt: Wäsche, Saugroboter, Einkauf", "en": "🧺 Household: laundry, robot vacuum, shopping"},
      {"de": "Wann die Wäsche fertig ist, der Saugroboter, der Garten, das Auto und die Einkaufsliste.",
       "en": "When the laundry is done, the robot vacuum, the garden, the car and the shopping list."},
      "Haushalt Waschmaschine Trockner Spülmaschine Saugroboter Garten Bewässerung Auto laden Einkaufsliste household washing machine dryer dishwasher vacuum garden car shopping list")
def _(r):
    r.say("Tippe unten auf „Haushalt“.", "Tap “Household” at the bottom.")
    tab(r, "household")
    r.say("Die Waschmaschine sagt, wann sie fertig ist.", "The washing machine says when it is done.")
    r.move("[data-page=household] .hhTell")
    r.wait(1200)
    r.say("„Saugen“ schickt den Saugroboter los.", "“Vacuum” sends the robot vacuum off.")
    r.click("[data-page=household] button", text="Saugen|Vacuum|Clean")
    r.wait(1500)
    r.poster()
    r.say("Auf die Einkaufsliste kommt etwas Neues …", "Something new goes on the shopping list …")
    r.click("[data-page=household] input[type=text]")
    r.type("Äpfel" if r.lang == "de" else "Apples")
    r.key("Enter")
    r.wait(800)
    r.say("… und ein Tipp hakt es ab.", "… and a tap ticks it off.")
    r.click("[data-page=household] input[type=checkbox]", nth=0)
    r.wait(1600)


@clip("cars", "pages",
      {"de": "🚗 Mehrere Autos im Haushalt", "en": "🚗 Several cars on Household"},
      {"de": "Das erste Auto findet das Programm an seinem Namen. Jedes weitere kommt über ⚙ → Reiter unten → „＋ Weiteres Auto“: "
             "Ladestand, Reichweite, Laden und einen Namen wählen, dann hat es im Haushalt eine eigene Karte.",
       "en": "The add-on finds the first car by its name. Every further car comes through ⚙ → Tabs at the bottom → “＋ Another car”: "
             "choose its charge, range, charging and a name, and it gets a card of its own on Household."},
      "Auto Autos zweites Auto Elektroauto Ladestand Reichweite Wallbox mehrere weiteres Auto car cars second car electric charge range several another car")
def _(r):
    r.say("Im Haushalt steht das erste Auto: Ladestand, Laden, Reichweite.", "Household shows the first car: charge, charging, range.")
    tab(r, "household")
    r.move("[data-page=household] .hhCar")
    r.wait(1400)
    r.say("Ein zweites Auto kommt über ⚙ → „Reiter unten“.", "A second car comes through ⚙ → “Tabs at the bottom”.")
    r.click("#settingsBtn")
    r.wait(900)
    r.click("#sgNav button[data-group=tabs]")
    r.wait(900)
    r.say("Oben ein Knopf je Seite: „Auto“.", "A button per page at the top: “Car”.")
    r.click(".sgPages button[data-sp=car]")                                 # one page at a time (5.8.0)
    r.wait(900)
    r.js("document.querySelector('#addCar').scrollIntoView({ block: 'center' })")
    r.wait(700)
    r.say("„＋ Weiteres Auto“ …", "“＋ Another car” …")
    r.click("#addCar")
    r.wait(900)
    r.say("… dort seinen Ladestand und einen Namen wählen.", "… there choose its charge and a name.")
    sel = r.loc("#setCars .odCar select[data-role=battery]")
    r.click(sel)
    sel.select_option("sensor.zweitwagen_ladestand")
    r.wait(900)
    r.click("#setCars .odCar input[data-role=name]")
    r.type("Zweitwagen" if r.lang == "de" else "Second car")
    r.key("Tab")
    r.wait(1200)
    r.key("Escape")
    r.wait(600)
    r.say("Jetzt hat jedes Auto im Haushalt seine eigene Karte.", "Now every car has a card of its own on Household.")
    tab(r, "household")
    r.move("[data-page=household] .hhCar", nth=1)
    r.poster()
    r.wait(2200)


@clip("routines", "pages",
      {"de": "▶ Abläufe: Knöpfe, Szenen, Automationen", "en": "▶ Routines: buttons, scenes, automations"},
      {"de": "Große Knöpfe für „Ich gehe“ und „Gute Nacht“, deine Szenen und alle Automationen, nach Räumen sortiert.",
       "en": "Big buttons for “I am leaving” and “Good night”, your scenes and every automation, sorted by room."},
      "Abläufe Automation Szene Skript Knopf ich gehe gute Nacht Räume routines automation scene script button leaving good night rooms")
def _(r):
    r.say("Tippe unten auf „Abläufe“.", "Tap “Routines” at the bottom.")
    tab(r, "routines")
    r.say("„Ich gehe“ prüft Fenster, Türen und Licht, bevor du gehst.", "“I am leaving” checks windows, doors and lights before you go.")
    r.click("[data-page=routines] .rtCheck.leave")
    r.wait(2200)
    r.key("Escape")
    r.wait(500)
    r.poster()
    r.say("„Nach Räumen“ sortiert alles nach dem Raum.", "“By room” sorts everything by room.")
    r.click("[data-page=routines] [data-view=rooms]")
    r.wait(1500)
    r.say("Ein Tipp auf einen Raum klappt ihn auf.", "Tap a room to open it.")
    r.click("[data-page=routines] .rgHead", nth=0)
    r.wait(1800)


@clip("flow", "pages",
      {"de": "Einen eigenen Ablauf bauen", "en": "Build your own routine"},
      {"de": "„Wenn … dann …“ aus Bausteinen: links antippen, was passieren soll. In Worten steht unten, was er tut.",
       "en": "“When … then …” from blocks: tap on the left what should happen. Below it says in words what it does."},
      "Ablauf bauen eigene Automation wenn dann Baustein Uhrzeit Rollladen Regel erstellen routine build automation when then block time create")
def _(r):
    tab(r, "routines")
    r.say("Unter „Abläufe“: „＋ Neuer Ablauf“.", "Under “Routines”: “＋ New routine”.")
    r.click("[data-page=routines] .bdBtn.primary", text="Neuer|New")
    r.wait(1400)
    r.say("Links stehen die Bausteine. Zuerst: wann soll es passieren?", "The blocks are on the left. First: when should it happen?")
    r.click(".feDlg [data-add=time]")
    r.wait(1300)
    r.say("Rechts stellst du den Baustein ein.", "You set the block up on the right.")
    r.wait(1500)
    r.say("Dann: was soll passieren? Zum Beispiel den Rollladen fahren.", "Then: what should happen? For example move the shutter.")
    r.click(".feDlg [data-add=cover]")
    r.wait(1200)
    r.say("Rechts wählst du, welcher Rollladen.", "On the right you choose which shutter.")
    r.click(".feDlg label", text="Wohnzimmer|Living")
    r.wait(1200)
    r.poster()
    r.say("Unten steht in Worten, was der Ablauf tut.", "Below it says in words what the routine does.")
    r.wait(2200)
    r.say("„Jetzt ausprobieren“ testet ihn, „Speichern“ macht ihn fertig.", "“Try now” tests it, “Save” finishes it.")
    r.move(".feDlg [data-act=feSave]")
    r.wait(1600)


@clip("family", "pages",
      {"de": "👪 Familie: wer ist wo, die Pinnwand", "en": "👪 Family: who is where, the pinboard"},
      {"de": "Wer zu Hause ist und in welchem Raum, wer unterwegs ist, und eine Pinnwand für Notizen.",
       "en": "Who is home and in which room, who is out, and a pinboard for notes."},
      "Familie Personen zu Hause unterwegs wo Anwesenheit Pinnwand Notiz family people home away where presence pinboard note")
def _(r):
    r.say("Tippe unten auf „Familie“.", "Tap “Family” at the bottom.")
    tab(r, "family")
    r.say("Jede Person: zu Hause oder unterwegs, und woher das Add-on es weiß.", "Every person: home or away, and how the add-on knows.")
    r.wait(2000)
    r.say("Auf die Pinnwand kommt eine Notiz für alle.", "A note for everyone goes on the pinboard.")
    scroll(r, 400)
    r.click("[data-page=family] .pbInput")
    r.type("Pizza ist im Ofen 🍕" if r.lang == "de" else "Pizza is in the oven 🍕", ms=55)
    r.click("[data-page=family] .pbColor.pink")
    r.wait(300)
    r.click("[data-page=family] .pbPin")
    r.wait(1500)
    r.poster()
    r.wait(900)


@clip("log", "pages",
      {"de": "📜 Protokoll: wer hat was geschaltet", "en": "📜 Log: who switched what"},
      {"de": "Alles, was die Geräte gemacht haben, mit Uhrzeit und wer es war: eine Person, eine Automation oder das Gerät selbst.",
       "en": "Everything the devices did, with the time and who it was: a person, an automation or the device itself."},
      "Protokoll Verlauf Log wer war es Automation Person Uhrzeit Filter gestern log history who automation person time filter yesterday")
def _(r):
    r.say("Tippe unten auf „Protokoll“.", "Tap “Log” at the bottom.")
    tab(r, "log")
    r.say("Jede Zeile: wann, welches Gerät, was und wer es war.", "Every row: when, which device, what and who it was.")
    r.wait(1800)
    r.poster()
    r.say("Ein Filter zeigt zum Beispiel nur das Licht.", "A filter shows for example only the light.")
    r.click("[data-page=log] .tpChip", text="Licht|Light")
    r.wait(1500)
    r.say("„Gestern“ zeigt den Tag davor.", "“Yesterday” shows the day before.")
    r.click("[data-page=log] .tpChip", text="^(Gestern|Yesterday)$")
    r.wait(1800)


@clip("buttons", "pages",
      {"de": "🔘 Eine eigene Seite mit Knöpfen", "en": "🔘 A page of your own with buttons"},
      {"de": "Eigene Seiten mit großen Knöpfen: ein Tipp schaltet, lange drücken öffnet mehr.",
       "en": "Pages of your own with big buttons: a tap switches, a long press opens more."},
      "Knöpfe eigene Seite Knopf Dashboard schalten Licht Szene buttons own page button dashboard switch light scene")
def _(r):
    r.say("Eigene Seiten stehen auch unten in der Leiste.", "Pages of your own are in the bar at the bottom too.")
    tab(r, "p_knoepfe")
    r.say("Ein Tipp auf einen Knopf schaltet.", "A tap on a button switches.")
    r.click("[data-page=p_knoepfe] .obBtn", text="Küche|Kitchen")
    r.wait(1300)
    r.poster()
    r.click("[data-page=p_knoepfe] .obBtn", text="Küche|Kitchen")
    r.wait(1000)
    r.say("Die Lichter-Karte dimmt mehrere Lampen mit einem Balken.", "The lights card dims several lamps with one bar.")
    scroll(r, 500, at=(1100, 500))
    r.wait(1800)


@clip("heatdiag", "pages",
      {"de": "🩺 Protokoll der Heizung: wer steuert was?", "en": "🩺 Heating log: who controls what?"},
      {"de": "Unter „Klima“ zeigt 🩺 je Raum Thermostat, Fenster und Türen, wer zuletzt gedreht hat und was die Regeln gemacht haben, als Bericht zum Kopieren.",
       "en": "Under “Climate”, 🩺 shows per room the thermostat, windows and doors, who turned it last and what the rules did, as a report to copy."},
      "Protokoll Heizung Diagnose wer hat gedreht Thermostat Fenster Bericht kopieren Fehler heating log diagnosis who turned thermostat window report copy")
def _(r):
    tab(r, "climate")
    r.say("Unter „Klima“ oben: „🩺 Protokoll“.", "Under “Climate” at the top: “🩺 Log”.")
    r.click("[data-page=climate] [data-view=diag]")
    r.wait(1500)
    r.say("Je Raum: das Thermostat, wer zuletzt gedreht hat, jedes Fenster und jede Tür.", "Per room: the thermostat, who turned it last, every window and every door.")
    r.wait(1800)
    r.poster()
    r.say("Ein Raum für sich: oben antippen.", "One room on its own: tap it at the top.")
    r.click("[data-page=climate] .tpChip", text="Wohnzimmer|Living")
    r.wait(1600)
    r.say("Weiter unten: was die Regeln wann gemacht haben.", "Further down: what the rules did and when.")
    scroll(r, 700)
    r.wait(1500)
    r.say("„📋 Bericht kopieren“ gibt alles als Text, zum Beispiel für eine Frage.", "“📋 Copy report” gives everything as text, for example for a question.")
    scroll(r, -1400)
    r.move("[data-page=climate] .bdBtn", text="Bericht|report")
    r.wait(1600)


@clip("specialdays", "pages",
      {"de": "📅 Besondere Tage: an Feiertagen anders", "en": "📅 Special days: different on holidays"},
      {"de": "Eine Liste besonderer Tage für alle Abläufe: Feiertage, Heiligabend, Urlaub, ein Kalender. Ein Ablauf kann an diesen Tagen etwas anderes tun.",
       "en": "One list of special days for all routines: public holidays, Christmas Eve, holidays, a calendar. A routine can do something else on those days."},
      "besondere Tage Feiertag Heiligabend Weihnachten Urlaub Ferien Kalender Ablauf anders special days public holiday christmas vacation calendar routine")
def _(r):
    tab(r, "routines")
    r.say("Unter „Abläufe“: „📅 Besondere Tage“.", "Under “Routines”: “📅 Special days”.")
    r.click("[data-page=routines] .bdBtn", text="Besondere|Special")
    r.wait(1300)
    r.say("Hier stehen deine Tage, mit dem nächsten Termin.", "Your days are listed here, with the next date.")
    r.wait(1600)
    r.say("Unten kommen neue dazu, zum Beispiel die Feiertage.", "New ones are added at the bottom, for example the public holidays.")
    r.click("dialog[open] [data-add=holidays]")
    r.wait(1500)
    r.poster()
    r.click("dialog[open] [data-add=vacation]")
    r.wait(1300)
    r.say("In einem Ablauf sagt dann der Baustein „🎉 Besonderer Tag“, was an diesen Tagen anders ist.", "In a routine the block “🎉 Special day” then says what is different on those days.")
    r.wait(2000)
    r.click("dialog[open] [data-act=sdClose]")
    r.wait(800)


@clip("sceneedit", "pages",
      {"de": "Eine Szene anlegen", "en": "Create a scene"},
      {"de": "„＋ Neue Szene“: die Lampen nehmen, wie sie gerade sind, oder jede einstellen (an, Helligkeit, Farbe), dann speichern; sie ist eine echte Szene in Home Assistant.",
       "en": "“＋ New scene”: take the lamps as they are now or set each (on, brightness, colour), then save; it is a real scene in Home Assistant."},
      "Szene anlegen neu erstellen Lampen Helligkeit Farbe speichern Stimmung scene create new lamps brightness colour save mood")
def _(r):
    tab(r, "routines")
    r.say("Unter „Abläufe“: „＋ Neue Szene“.", "Under “Routines”: “＋ New scene”.")
    r.click("[data-page=routines] .bdBtn", text="Neue Szene|New scene")
    r.wait(1500)
    r.say("Oben bekommt sie einen Namen.", "At the top it gets a name.")
    name = r.loc("dialog[open] input[type=text]")
    if name.count():
        r.click(name)
        r.type("Leseabend" if r.lang == "de" else "Reading night")
    r.wait(700)
    r.say("Rechts eine Lampe antippen: sie kommt in die Szene, so wie sie gerade ist.", "Tap a lamp on the right: it joins the scene as it is right now.")
    r.click("dialog[open] button", text="Stehlampe")
    r.wait(1200)
    r.say("Dann für jede Lampe: an oder aus, wie hell, welche Farbe.", "Then for every lamp: on or off, how bright, which colour.")
    r.wait(1800)
    r.poster()
    r.say("„Speichern“, und die Szene steht in der Leiste und in Home Assistant.", "“Save”, and the scene is in the bar and in Home Assistant.")
    r.move("dialog[open] button", text="Speichern|Save")
    r.wait(1800)
    r.key("Escape")
    r.wait(600)


def heat_on(r):
    """prep: the living room's thermostat heats (in the demo the window rule paused it)"""
    r.js("""() => fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'climate', service: 'set_hvac_mode', entity_id: 'climate.wohnzimmer', data: { hvac_mode: 'heat' } }) })""")
    r.wait(800)


@clip("heat-pause", "pages",
      {"de": "⏸️ Heizplan aussetzen: selbst regeln", "en": "⏸️ Pause the schedule: regulate by hand"},
      {"de": "Unter − / + jedes Thermostats: gedrückt halten, dann wählen, wie lange (30 Min, 45 Min, 1 Std, bis zum nächsten Block, für heute). "
             "So lange stellt keine Regel das Thermostat zurück. „＋15 Min“, „▶ Heizplan fortsetzen“; wer den Knopf bekommt, stellt der Admin ein.",
       "en": "Under − / + of every thermostat: hold it, then choose how long (30 min, 45 min, 1 h, until the next block, for today). Meanwhile no "
             "rule turns the thermostat back. “＋15 min”, “▶ Resume the schedule”; an admin chooses who gets the button."},
      "Heizplan aussetzen Pause von Hand selbst regeln gedrückt halten pause schedule by hand hold", prep=heat_on)
def _(r):
    tab(r, "climate")
    bar = "[data-page=climate] [data-room=r1] .hpPause"
    r.say("Unter − und + jedes Thermostats: „⏸️ Heizplan aussetzen“.", "Under − and + of every thermostat: “⏸️ Pause the schedule”.")
    r.move(bar)
    r.wait(1600)
    r.say("Kurz antippen tut nichts. Gedrückt halten …", "A short tap does nothing. Hold it …")
    r.click(bar, hold=1100)
    r.wait(900)
    r.poster()
    r.say("… dann wählen, wie lange: eine halbe Stunde, eine dreiviertel, eine Stunde, bis zum nächsten Block oder für heute.",
          "… then choose how long: half an hour, three quarters, an hour, until the next block or for today.")
    r.move(".hpDlg[open] .hpOpt[data-opt='45']")
    r.wait(2200)
    r.click(".hpDlg[open] .hpOpt[data-opt='45']")
    r.wait(1800)
    r.say("Jetzt regelst du selbst, keine Regel dreht zurück. Der Knopf sagt, bis wann.", "Now you regulate it yourself, no rule turns it back. The button says until when.")
    r.move("[data-page=climate] [data-room=r1] .hpPauseBar")
    r.wait(2200)
    r.say("„＋15 Min“ macht es länger.", "“＋15 min” makes it longer.")
    r.click("[data-page=climate] [data-room=r1] .hpMore")
    r.wait(1800)
    r.say("„▶ Heizplan fortsetzen“: sofort wieder nach Plan.", "“▶ Resume the schedule”: back to the plan at once.")
    r.click("[data-page=climate] [data-room=r1] .hpPause.on")
    r.wait(1800)
    r.say("In den Heiz-Regeln: an oder aus, welche Zeiten, und was trotzdem gilt, zum Beispiel ein offenes Fenster.",
          "In the heating rules: on or off, which times, and what counts anyway, for example an open window.")
    r.click("[data-page=climate] [data-view=rules]")
    r.wait(1200)
    r.js("() => document.querySelector('[data-heat-rule=pause]')?.scrollIntoView({ block: 'center' })")
    r.wait(600)
    r.move("[data-heat-rule=pause]")
    r.wait(2600)
    r.say("Wer den Knopf bekommt: je Benutzer unter ⚙ → Benutzer & Tablets und an jeder eigenen Thermostat-Karte.",
          "Who gets the button: per user in ⚙ → Users & tablets and on every own thermostat card.")
    r.wait(2600)


def two_buildings_live(r):
    """prep: the demo house as two buildings (clips_edit.two_buildings), then the live view"""
    from clips_edit import two_buildings
    two_buildings(r)
    r.pg.click("[data-mode=live]")
    r.pg.wait_for_timeout(1500)


@clip("buildings-pages", "pages",
      {"de": "🏘 Ein Gebäude wählen: jede Seite zeigt nur seins", "en": "🏘 Choose a building: every page shows only its things"},
      {"de": "Mit zwei Gebäuden in einem Plan: oben eins wählen, dann zeigen Klima, Kameras, Musik, Haushalt, Abläufe, Protokoll und die eigenen "
             "Karten nur noch, was zu diesem Gebäude gehört. Eine eigene Seite kann einem Gebäude gehören.",
       "en": "With two buildings in one plan: choose one at the top, then climate, cameras, music, household, routines, log and the own cards "
             "show only what belongs to it. An own page can belong to a building."},
      "Gebäude wählen Anbau nur dieses Gebäude Seiten filtern building choose wing only this building pages filter",
      query="mode=edit", prep=two_buildings_live)
def _(r):
    ids = r.js("window.__fp.layout.buildings.map((b) => b.id)")
    r.say("Dieser Plan hat zwei Gebäude. Oben wählst du, welches du anschaust.", "This plan has two buildings. At the top you choose which one you look at.")
    r.click("#buildingSelect")
    r.loc("#buildingSelect").select_option(ids[1])
    r.wait(1800)
    tab(r, "climate")
    r.say("„Klima“ zeigt jetzt nur die Räume und Thermostate des Anbaus.", "“Climate” now shows only the rooms and thermostats of the wing.")
    r.poster()
    r.wait(2400)
    tab(r, "media")
    r.say("„Musik & TV“: nur seine Lautsprecher, der Fernseher im Wohnzimmer fehlt.", "“Music & TV”: only its speakers, the TV in the living room is gone.")
    r.wait(2400)
    tab(r, "p_knoepfe")
    r.say("Auch die eigenen Karten: was im anderen Gebäude steht, ist weg.", "The own cards too: what stands in the other building is gone.")
    r.wait(2400)
    r.say("Eine eigene Seite kann einem Gebäude gehören: beim Bearbeiten, „⚙️ Seite“, „Gehört zu Gebäude“.",
          "An own page can belong to a building: while editing, “⚙️ Page”, “Belongs to building”.")
    r.click("#tabBar .tbEdit")
    r.wait(1000)
    r.click("[data-page=p_knoepfe] [data-act=page]")
    r.wait(1000)
    r.move("[data-role=building]")
    r.wait(2400)
    r.key("Escape")
    r.wait(500)
    r.click("#tabBar .tbEdit")
    r.wait(800)
    r.say("„🏘 Alle Gebäude“: wieder alles.", "“🏘 All buildings”: everything again.")
    r.click("#buildingSelect")
    r.loc("#buildingSelect").select_option("")
    r.wait(2000)
