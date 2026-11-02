"""Clips of the group "Seiten gestalten": cards on a page, hiding and arranging them, the tab bar, own pages."""
from recorder import clip


def edit_today(r):
    r.click("#tabBar [data-tab=today]")
    r.wait(1100)
    r.say("Unten rechts: „Bearbeiten“.", "Bottom right: “Edit”.")
    r.click("#tabBar .tbEdit")
    r.wait(1000)


@clip("addcard", "dash",
      {"de": "Eine Karte auf eine Seite setzen", "en": "Put a card on a page"},
      {"de": "Jede Seite lässt sich bearbeiten: „＋ Karte“, die Art wählen (Thermostat, Licht, Verlauf …) und das Gerät.",
       "en": "Every page can be edited: “＋ Card”, choose the kind (thermostat, light, graph …) and the device."},
      "Karte hinzufügen Seite bearbeiten Dashboard Thermostat Licht Verlauf Gerät card add page edit dashboard thermostat light graph device")
def _(r):
    edit_today(r)
    r.say("„＋ Karte hinzufügen“.", "“＋ Add card”.")
    r.click("[data-page=today] .bdAdd")
    r.wait(900)
    r.say("Wähle, was die Karte zeigen soll: ein Thermostat.", "Choose what the card shows: a thermostat.")
    r.click(".ceDlg [data-type=thermostat]")
    r.wait(900)
    r.say("Dann welches Gerät.", "Then which device.")
    r.click(".ceDlg .ceItem[data-entity='climate.wohnzimmer']")
    r.wait(700)
    r.poster()
    r.say("„Speichern“: die Karte steht auf der Seite.", "“Save”: the card is on the page.")
    r.click(".ceDlg [data-act=save]")
    r.wait(1300)
    r.say("„Fertig“ beendet das Bearbeiten.", "“Done” ends editing.")
    r.click("[data-page=today] .bdStrip [data-act=done]")
    r.wait(1500)


@clip("arrange", "dash",
      {"de": "Karten ausblenden und frei anordnen", "en": "Hide cards and arrange them freely"},
      {"de": "Beim Bearbeiten blendet 👁 eine Karte aus, „Frei anordnen“ legt jede Karte, wohin du willst.",
       "en": "While editing, 👁 hides a card and “Arrange freely” puts every card wherever you want."},
      "Karte ausblenden verschieben anordnen frei Raster Größe Seite card hide move arrange free grid size page")
def _(r):
    edit_today(r)
    r.say("👁 blendet eine Karte aus.", "👁 hides a card.")
    r.click("[data-page=today] .bdItem .bdTool[data-act=hide]", nth=1)
    r.wait(1100)
    r.say("Sie steht dann oben unter „Ausgeblendet“; ein Tipp holt sie zurück.", "It is listed under “Hidden” at the top; a tap brings it back.")
    r.click("[data-page=today] .bdHidden .bdHidChip", nth=0)
    r.wait(1100)
    r.say("„Frei anordnen“: jede Karte liegt, wohin du sie ziehst.", "“Arrange freely”: every card goes where you drag it.")
    r.click("[data-page=today] .bdStrip [data-act=free]")
    r.wait(1500)
    r.poster()
    r.say("„Fertig“ speichert die Seite.", "“Done” saves the page.")
    r.click("[data-page=today] .bdStrip [data-act=done]")
    r.wait(1500)


@clip("tabs", "dash",
      {"de": "Die Reiter unten ordnen", "en": "Arrange the tabs at the bottom"},
      {"de": "Die Leiste unten lässt sich umsortieren, Seiten kommen dazu oder gehen weg. Wer was sieht, steht bei den Benutzern.",
       "en": "The bar at the bottom can be sorted, pages added or removed. Who sees what is set with the users."},
      "Reiter Leiste unten Seite neu sortieren umbenennen eigene Seite tabs bar bottom page new sort rename own page")
def _(r):
    edit_today(r)
    r.say("„Reiter“ macht die Leiste unten bearbeitbar.", "“Tabs” makes the bar at the bottom editable.")
    r.click("[data-page=today] .bdStrip [data-act=tabs]")
    r.wait(1100)
    r.poster()
    r.say("Einen Reiter ziehen, um ihn zu verschieben.", "Drag a tab to move it.")
    a = r.box("#tabBar [data-tab=energy]")
    b = r.box("#tabBar [data-tab=climate]")
    r.drag(a["x"] + a["width"] / 2, a["y"] + a["height"] / 2, b["x"] + b["width"] * 0.8, b["y"] + b["height"] / 2, ms=1100)
    r.wait(900)
    r.say("„＋ Seite“ legt eine eigene Seite an.", "“＋ Page” creates a page of your own.")
    r.move("#tabEditBar button", text="Seite|Page")
    r.wait(1200)
    r.say("„Fertig“, wenn alles passt.", "“Done” when everything fits.")
    r.click("#tabEditBar button", text="Fertig|Done")
    r.wait(1300)


@clip("scenebar-edit", "dash",
      {"de": "Die Szenen-Leiste einstellen", "en": "Set up the scene bar"},
      {"de": "Welche Szenen und Skripte unten in der Leiste stehen, mit Symbol und Farbe, für alle Seiten oder je Seite eigene.",
       "en": "Which scenes and scripts are in the bar at the bottom, with icon and colour, for all pages or different per page."},
      "Szenen-Leiste Leiste unten Szene Skript Symbol Farbe einstellen sortieren scene bar bottom scene script icon colour set up sort")
def _(r):
    edit_today(r)
    r.say("„🎬 Szenen-Leiste“.", "“🎬 Scene bar”.")
    r.click("[data-page=today] .bdStrip [data-act=sceneBar]")
    r.wait(1300)
    r.poster()
    r.say("Jede Szene mit Symbol und Farbe; ⠿ zieht sie an einen anderen Platz.", "Every scene with icon and colour; ⠿ drags it to another place.")
    r.wait(2000)
    r.say("Oben: für alle Seiten gleich oder eine eigene Leiste für diese Seite.", "At the top: the same for all pages or a bar of its own for this page.")
    r.wait(1800)
    r.click(".sbDlg [data-act=save]")
    r.wait(800)
    r.click("[data-page=today] .bdStrip [data-act=done]")
    r.wait(900)


@clip("variants", "dash",
      {"de": "Eine Seite je Person anders", "en": "A page different per person"},
      {"de": "Fassungen: dieselbe Seite sieht für die Kinder anders aus als für die Eltern; „Ansehen als …“ zeigt sie mit den Augen eines Benutzers.",
       "en": "Versions: the same page looks different for the children than for the parents; “View as …” shows it with the eyes of a user."},
      "Fassung Version je Benutzer Kinder Eltern andere Seite ansehen als wer sieht was version per user children parents view as who sees what")
def _(r):
    edit_today(r)
    r.say("Unter der Leiste: „Fassung“. „Für alle“ ist die normale Seite.", "Below the bar: “Version”. “For everyone” is the normal page.")
    r.move(".pvBar")
    r.wait(1500)
    r.say("„＋ Neue Fassung“ macht eine eigene Seite, zum Beispiel für die Kinder.", "“＋ New version” makes a page of its own, for example for the children.")
    r.click(".pvBar [data-act=newVariant]")
    r.wait(1500)
    r.poster()
    r.say("Danach wählst du, wer diese Fassung sieht, und richtest sie ein wie jede Seite.", "Then you choose who sees this version and set it up like any page.")
    r.wait(2000)
    r.key("Escape")
    r.wait(600)
    r.say("„Ansehen als …“ zeigt die Seite so, wie ein Benutzer sie sieht.", "“View as …” shows the page the way a user sees it.")
    r.move(".pvBar [data-act=viewAs]")
    r.wait(1600)
    r.click("[data-page=today] .bdStrip [data-act=done]")
    r.wait(900)
