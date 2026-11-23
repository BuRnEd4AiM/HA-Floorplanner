"""Clips of the group "Einstellungen": language and design, finding a setting, users and tablets, backup, full screen."""
from recorder import clip


@clip("language", "settings",
      {"de": "Sprache und Design", "en": "Language and design"},
      {"de": "⚙ → Allgemein: acht Sprachen, ein dunkles oder helles Design und die Einheiten, je mit einem Tipp.",
       "en": "⚙ → General: eight languages, a dark or light design and the units, each with one tap."},
      "Sprache Deutsch Englisch Design hell dunkel Einheiten Einstellungen language german english design light dark units settings")
def _(r):
    r.say("Oben rechts: ⚙ Einstellungen.", "Top right: ⚙ settings.")
    r.click("#settingsBtn")
    r.wait(1000)
    lang = r.loc("#setLanguage")
    theme = lambda v: f".segBtns[data-for=setTheme] button[data-value={v}]"     # the design is a row of buttons (5.8.0)
    r.say("Die Sprache …", "The language …")
    r.click(lang)
    lang.select_option("en" if r.lang == "de" else "de")
    r.wait(1600)
    r.click(lang)
    lang.select_option(r.lang)
    r.wait(1200)
    r.say("… und das Design: ein Tipp auf Hell, Dunkel oder Hologramm.", "… and the design: one tap on light, dark or hologram.")
    r.click(theme("light"))
    r.wait(1500)
    r.poster()
    r.click(theme("holo"))
    r.wait(1500)
    r.click(theme("dark"))
    r.wait(1200)


@clip("settings-search", "settings",
      {"de": "Eine Einstellung finden", "en": "Find a setting"},
      {"de": "Die Einstellungen haben eine Suche: ein Wort tippen, die passenden Einstellungen erscheinen.",
       "en": "The settings have a search: type a word and the matching settings show up."},
      "Einstellungen suchen finden Schatten Leistung Option settings search find shadow performance option")
def _(r):
    r.click("#settingsBtn")
    r.wait(1000)
    r.say("Links stehen alle Bereiche der Einstellungen.", "All groups of settings are on the left.")
    r.move("#sgNav button[data-group=view]")
    r.wait(900)
    r.say("Schneller geht die Suche oben.", "The search at the top is quicker.")
    r.click("dialog[open] input[type=search]")
    r.type("Schatten" if r.lang == "de" else "shadow")
    r.wait(1600)
    r.poster()
    r.say("Jede Einstellung wirkt sofort, ohne Speichern.", "Every setting works at once, without saving.")
    r.wait(1800)


@clip("settings-easy", "settings",
      {"de": "Einstellungen mit einem Tipp", "en": "Settings with one tap"},
      {"de": "Schalter für an und aus, Knöpfe statt Listen, Schieberegler mit Prozent, „mehr …“ bei langen Texten, Anleitungen zum Aufklappen, Licht-Gruppen als Raum-Knöpfe.",
       "en": "Switches for on and off, buttons instead of lists, sliders in percent, “more …” for long texts, guides that fold open, light groups as room buttons."},
      "Schalter Knopf Knöpfe Schieberegler Prozent einfach antippen mehr Anleitung switch button slider percent easy tap more guide")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen ist an und aus ein Schalter.", "In the settings, on and off is a switch.")
    r.click("#sgNav button[data-group=view]")
    r.wait(900)
    r.click("#setShadows")
    r.wait(1100)
    r.click("#setShadows")
    r.wait(900)
    r.say("Ein Wert wie die Wand-Deckkraft hat einen Schieberegler, daneben steht er in Prozent.", "A value like the wall opacity has a slider, its percent beside it.")
    r.slide("#setWallOpacity", 0.35)
    r.wait(900)
    r.poster()
    r.slide("#setWallOpacity", 0.65)
    r.wait(900)
    if r.pg.locator("details[data-group=view] .moreBtn").count():
        r.say("Lange Erklärungen zeigen zwei Zeilen: „mehr …“ zeigt alles.", "Long explanations show two lines: “more …” shows all of it.")
        r.click("details[data-group=view] .moreBtn")
        r.wait(1400)
    r.say("Kurze Auswahlen sind Knöpfe: alle auf einen Blick, ein Tipp genügt.", "Short choices are buttons: all at a glance, one tap is enough.")
    r.click("#sgNav button[data-group=floors]")
    r.wait(800)
    r.click(".segBtns[data-for=setBelowMode] button[data-value=stacked]")
    r.wait(1200)
    r.click(".segBtns[data-for=setBelowMode] button[data-value=dim]")
    r.wait(900)
    r.say("Anleitungen, die man nur einmal braucht, sind eine Zeile zum Aufklappen.", "Guides you need only once are a line that folds open.")
    r.click("#sgNav button[data-group=tablet]")
    r.wait(800)
    r.click("details.tabletGuide > summary")
    r.wait(1500)
    r.say("Bei den Licht-Gruppen ist jeder Raum ein Knopf: gewählte leuchten gelb.", "In the light groups every room is a button: chosen ones glow yellow.")
    r.click("#sgNav button[data-group=quick]")
    r.wait(700)
    r.js("document.querySelector('#lgGroups').scrollIntoView({ block: 'center' })")
    r.wait(700)
    room = "#lgGroups .lgEdit:first-child .lgRoom:not(:has(input:checked))"
    if r.pg.locator(room).count():
        r.click(room)
        r.wait(1300)
        r.click("#lgGroups .lgEdit:first-child .lgRoom:has(input:checked)", nth=0)
    r.wait(1500)


@clip("users", "settings",
      {"de": "Benutzer und Wandtablets", "en": "Users and wall tablets"},
      {"de": "Für jeden Benutzer oder jedes Tablet: welcher Raum zuerst, welche Seiten, was gesperrt ist, was er je Geräteart schalten darf "
             "(✋ nur ansehen, 💡 nur an/aus, 🎚 alles) und eigene Werte fürs Wandtablet (Bewegungsmelder, Helligkeit mit Fully Kiosk).",
       "en": "For every user or tablet: which room first, which pages, what is locked, what it may switch per kind of device "
             "(✋ only look, 💡 only on/off, 🎚 everything) and its own wall tablet values (motion sensor, brightness with Fully Kiosk)."},
      "Benutzer Tablet Wandtablet Rechte sperren Kinder Seiten wer sieht was Admin Geräteart nur an aus Fully "
      "users tablet wall tablet rights lock children pages admin kind of device only on off Fully")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen: „Benutzer & Tablets“.", "In the settings: “Users & tablets”.")
    r.click("#sgNav button[data-group=users]")
    r.wait(1000)
    r.say("„＋ Benutzer“ legt eine Zeile für eine Person oder ein Tablet an.", "“＋ User” adds a row for a person or a tablet.")
    r.click("#addTablet")
    r.wait(1300)
    r.poster()
    r.say("Dort wählst du den Raum, die Seiten und was gesperrt ist.", "There you choose the room, the pages and what is locked.")
    r.wait(1500)
    r.click("#tabletRows .tablet:last-child .presetBtn")
    r.wait(900)
    r.js("document.querySelectorAll('#tabletRows .tablet:last-child .rtBox').forEach((d) => { d.open = true; })")
    r.say("Je Geräteart: ✋ nur ansehen, 💡 nur an und aus, 🎚 alles. Unter „📱 Wandtablet“ eigene Werte für dieses Tablet, auch die Helligkeit mit Fully Kiosk.",
          "Per kind of device: ✋ only look, 💡 only on and off, 🎚 everything. Under “📱 Wall tablet” own values for this tablet, also the brightness with Fully Kiosk.")
    r.move("#tabletRows .tablet:last-child .rtBox select[data-right=light]")
    r.wait(2600)
    r.say("„Wer sieht was“ zeigt alles in einer Tabelle.", "“Who sees what” shows everything in a table.")
    r.click("#pvTableBtn")
    r.wait(2000)


@clip("backup", "settings",
      {"de": "Backup: alles sichern und zurückholen", "en": "Backup: save everything and restore it"},
      {"de": "„Backup“ lädt alles als eine Datei herunter: Häuser, Einstellungen, Bilder, die Codes und auf Wunsch die Aufzeichnungen "
             "und die Schlüssel (CallMeBot, Telegram-Bot). Mit der Datei kommt alles wieder zurück.",
       "en": "“Backup” downloads everything as one file: houses, settings, pictures, the codes and, if you like, the recordings and "
             "the keys (CallMeBot, Telegram bot). With that file everything comes back."},
      "Backup Sicherung sichern wiederherstellen Datei herunterladen hochladen alles komplett Codes Schlüssel Aufzeichnung Protokoll "
      "backup save restore file download upload everything complete codes keys recordings log")
def _(r):
    r.say("Oben: „Backup“.", "At the top: “Backup”.")
    r.click("#backupBtn")
    r.wait(1300)
    r.poster()
    r.say("Herunterladen sichert alles: Häuser, Seiten, Einstellungen, Bilder und die Codes.",
          "Download saves everything: houses, pages, settings, pictures and the codes.")
    r.move("#backupExport")
    r.wait(2000)
    r.say("Die Codes nur als Fingerabdruck: niemand kann sie aus der Datei lesen.", "The codes only as a fingerprint: nobody can read them from the file.")
    r.wait(2000)
    r.say("Mit Häkchen auch die Aufzeichnungen …", "Ticked: the recordings too …")
    r.move("#setBackupRecording")
    r.wait(1700)
    r.say("… und auf Wunsch die Schlüssel von CallMeBot und vom Telegram-Bot. Die stehen lesbar drin: die Datei dann nicht weitergeben.",
          "… and, if you like, the keys of CallMeBot and of the Telegram bot. They are readable in the file: then do not pass it on.")
    r.click("#setBackupSecrets")
    r.wait(2200)
    r.click("#setBackupSecrets")
    r.wait(700)
    r.say("Mit der Datei holst du später alles zurück.", "With that file you get everything back later.")
    r.move("#backupImport")
    r.wait(1800)
    r.key("Escape")
    r.wait(600)


@clip("fullscreen", "settings",
      {"de": "Vollbild für das Wandtablet", "en": "Full screen for the wall tablet"},
      {"de": "„Vollbild“ unten rechts: keine Leisten mehr, nur dein Haus. Mit einem Code bleibt es fest.",
       "en": "“Full screen” at the bottom right: no bars any more, only your house. A code keeps it there."},
      "Vollbild Kiosk Wandtablet Tablet Bildschirm fest Code full screen kiosk wall tablet screen lock code")
def _(r):
    r.say("Unten rechts: „Vollbild“.", "Bottom right: “Full screen”.")
    r.click("#tabBar .tbFull")
    r.wait(1400)
    r.poster()
    r.say("Ideal für ein Tablet an der Wand.", "Perfect for a tablet on the wall.")
    r.wait(1800)
    r.key("Escape")
    r.wait(900)


@clip("kiosk", "settings",
      {"de": "Wandtablet: Startansicht, Bildschirmschoner, Abdunkeln", "en": "Wall tablet: start view, screen saver, dimming"},
      {"de": "⚙ → Wandtablet: wohin das Tablet nach einer Weile zurückgeht, welcher Bildschirmschoner kommt, wann und wie dunkel es wird, ein Bewegungsmelder, der es aufweckt, und der 🧽 Putz-Knopf.",
       "en": "⚙ → Wall tablet: where the tablet goes back to after a while, which screen saver comes, when and how dark it dims, a motion sensor that wakes it up, and the 🧽 cleaning button."},
      "Wandtablet Tablet Kiosk Startansicht zurück Bildschirmschoner dunkel Nacht Bewegungsmelder aufwecken wall tablet kiosk start view screen saver dim night motion sensor wake")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen: „Wandtablet“.", "In the settings: “Wall tablet”.")
    r.click("#sgNav button[data-group=tablet]")
    r.wait(1300)
    r.poster()
    r.say("Die Startansicht: dorthin geht das Tablet nach einer Weile zurück. Die Anleitung zum Einrichten ist eine Zeile zum Aufklappen.",
          "The start view: the tablet goes back there after a while. How to set it up is a line that folds open.")
    r.move("details.tabletGuide > summary")
    r.wait(2000)
    r.say("Weiter unten: der Bildschirmschoner, das Abdunkeln und das Aufwecken durch einen Bewegungsmelder.",
          "Further down: the screen saver, the dimming and waking up by a motion sensor.")
    r.move(1000, 520)
    for _ in range(4):
        r.pg.mouse.wheel(0, 300)
        r.wait(450)
    r.wait(1200)
    r.say("Und der 🧽 Putz-Knopf: am Tablet nimmt der Bildschirm dann eine halbe Minute keine Berührung an.",
          "And the 🧽 cleaning button: on the tablet the screen then ignores every touch for half a minute.")
    r.move("#setCleanBtn")
    r.wait(2200)


@clip("tablet-saver", "settings",
      {"de": "Bildschirmschoner und Abdunkeln am Wandtablet", "en": "Screen saver and dimming on the wall tablet"},
      {"de": "⚙ → Wandtablet: das Haus dreht sich, die Etagen nacheinander, eine große Uhr mit Wetter oder schwarz; abdunkeln nachts oder immer, so dunkel wie du willst, mit Uhr. „▶ … jetzt zeigen“ zeigt es sofort.",
       "en": "⚙ → Wall tablet: the house turns, the floors in turn, a big clock with the weather, or black; dim at night or always, as dark as you like, with a clock. “▶ … now” shows it at once."},
      "Bildschirmschoner Uhr Abdunkeln dunkel Nacht Wandtablet Tablet screen saver clock dim dark night wall tablet")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.click("#sgNav button[data-group=tablet]")
    r.wait(900)
    r.js("(() => { const s = document.getElementById('setSaver'); s.closest('.sgTile, .row').previousElementSibling?.scrollIntoView({ block: 'start' }); })()")
    r.wait(700)
    r.say("Der Bildschirmschoner: das Haus dreht sich, die Etagen nacheinander, eine große Uhr oder schwarz.", "The screen saver: the house turns, the floors in turn, a big clock or black.")
    r.click(".segBtns[data-for=setSaver] button[data-value=clock]")
    r.wait(1400)
    r.say("„Starten nach“: so viele Minuten ohne Berührung.", "“Start after”: this many minutes without a touch.")
    r.move("#setSaverAfter")
    r.wait(1600)
    r.say("Ausprobieren: „Bildschirmschoner jetzt zeigen“.", "Try it: “Show the screen saver now”.")
    r.click("#saverTry")
    r.wait(1200)
    r.poster()
    r.say("Uhrzeit, Datum und Wetter. Sie rückt jede Minute ein Stück, damit sich nichts einbrennt.",
          "Time, date and the weather. It moves a little every minute so nothing burns in.")
    r.wait(2600)
    r.say("Eine Berührung weckt den Bildschirm.", "A touch wakes the screen.")
    r.click(900, 500)
    r.wait(900)
    r.click("#settingsBtn")
    r.wait(900)
    r.js("(() => { const s = document.getElementById('setNightDim'); s.closest('.sgTile, .row').previousElementSibling?.scrollIntoView({ block: 'start' }); })()")
    r.wait(700)
    r.say("Abdunkeln: nach Sonnenstand, nach Uhrzeit oder immer, wenn niemand tippt.", "Dimming: by the sun, by the clock or always when nobody touches it.")
    r.click(".segBtns[data-for=setNightDim] button[data-value=always]")
    r.wait(1200)
    r.say("Wie dunkel, und auf Wunsch mit Uhr.", "How dark, and with a clock if you like.")
    r.slide("#setDimLevel", 0.8)
    r.wait(700)
    r.click("label[for=setDimClock]")
    r.wait(900)
    r.click("#dimTry")
    r.wait(2600)
    r.click(900, 500)
    r.wait(900)


@clip("notify", "settings",
      {"de": "Nachricht aufs Handy bei Alarm", "en": "A message to your phone on an alarm"},
      {"de": "⚙ → Warnungen & Alarm → Karte „Nachricht aufs Handy“: bei Rauch, Gas, Wasser oder Alarm kommt eine Nachricht per WhatsApp, Telegram (auch mit Bild über deinen eigenen Bot) oder die Home-Assistant-App.",
       "en": "⚙ → Warnings & alarm → card “Message to your phone”: on smoke, gas, water or an alarm a message comes by WhatsApp, Telegram (also with a picture through your own bot) or the Home Assistant app."},
      "Nachricht Handy WhatsApp Telegram Benachrichtigung Alarm Rauch Wasser Gas schicken message phone notification alarm smoke water gas send")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen: „Warnungen & Alarm“. Drei Karten, oben steht, ob sie an sind.", "In the settings: “Warnings & alarm”. Three cards, each says whether it is on.")
    r.click("#sgNav button[data-group=alarm]")
    r.wait(1600)
    r.say("Tippe auf „Nachricht aufs Handy“.", "Tap “Message to your phone”.")
    r.click("details.sgCard[data-card=notify] > summary")
    r.wait(1200)
    r.say("Wähle, wobei eine Nachricht kommen soll, und wohin: WhatsApp, Telegram oder die App.", "Choose what sends a message and where to: WhatsApp, Telegram or the app.")
    r.move(1000, 520)
    r.wait(1800)
    r.poster()
    for _ in range(3):
        r.pg.mouse.wheel(0, 300)
        r.wait(450)
    r.say("Mit „Testen“ kommt sofort eine Probe-Nachricht.", "“Test” sends a sample message at once.")
    r.wait(2000)


@clip("month-report", "settings",
      {"de": "📊 Monatsbericht: Heizung und Strom je Raum", "en": "📊 Monthly report: heating and power per room"},
      {"de": "⚙ → Warnungen & Alarm → Karte „Monatsbericht“: einmal im Monat kommt eine Nachricht mit Heizung und Strom des Monats davor in Euro, je Raum, "
             "mit einem Bild vom Grundriss und dem Vergleich zum Vorjahr. „Vorschau“ zeigt den letzten Monat.",
       "en": "⚙ → Warnings & alarm → card “Monthly report”: once a month a message with last month's heating and power in euros, per room, with a "
             "picture of the plan and the change to the year before. “Preview” shows last month."},
      "Monatsbericht Bericht Monat Heizung Strom Kosten Euro Raum Vorjahr month report heating power cost euro room year",
      query="mode=edit")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen: „Warnungen & Alarm“.", "In the settings: “Warnings & alarm”.")
    r.click("#sgNav button[data-group=alarm]")
    r.wait(1400)
    r.say("Die Karte „Monatsbericht“.", "The card “Monthly report”.")
    r.click("details.sgCard[data-card=report] > summary")
    r.wait(1200)
    r.say("Einschalten, dazu Tag und Uhrzeit: dann kommt er jeden Monat.", "Switch it on, with the day and the hour: then it comes every month.")
    r.click("#setMrOn")
    r.wait(1400)
    r.say("„Vorschau“ zeigt den letzten Monat: Heizung rot, Strom gelb, je Raum.", "“Preview” shows last month: heating red, power yellow, per room.")
    r.click("#mrPreview")
    r.wait(1200)
    r.pg.evaluate("document.getElementById('monthReport').scrollIntoView({block: 'end'})")
    r.wait(800)
    r.poster()
    r.wait(2200)


@clip("vacation", "settings",
      {"de": "🏠 Urlaubs-Licht: im Urlaub sieht das Haus bewohnt aus", "en": "🏠 Holiday light: the house looks lived in on holiday"},
      {"de": "Solange der Urlaubs-Alarm scharf ist, gehen Lampen abends wie bei euch an und aus, die Rollläden runter und hoch.",
       "en": "While the holiday alarm is armed, lamps go on and off in the evening as when you are home, the shutters down and up."},
      "Urlaubs-Licht Anwesenheit Urlaub Licht Rollläden holiday light presence vacation lights shutters")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.click("#sgNav button[data-group=alarm]")
    r.wait(1200)
    r.say("Beim Urlaubs-Alarm, ganz unten: „Urlaubs-Licht“.", "In the holiday alarm, at the bottom: “Holiday light”.")
    r.pg.evaluate("document.querySelector('details.sgCard[data-card=guard]').open = true")
    r.wait(800)
    r.pg.locator("#vacOn").scroll_into_view_if_needed()
    r.wait(1200)
    r.poster()
    r.say("Einschalten und die Lampen und Rollläden ankreuzen. Ein Garagentor ist nie dabei.", "Switch it on and tick the lamps and shutters. A garage door is never among them.")
    r.click("#vacOn")
    r.wait(1600)
    r.say("Das Add-on lernt aus euren letzten 14 Abenden und spielt jeden Abend einen davon ab – jedes Mal etwas anders.",
          "The add-on learns from your last 14 evenings and plays one of them every evening – a little different each time.")
    r.wait(2400)
    r.say("Kommt jemand heim und schaltet den Alarm aus, hört es sofort auf.", "When somebody comes home and switches the alarm off, it stops at once.")
    r.wait(2000)


@clip("notify-bot", "settings",
      {"de": "📸 Alarm mit Bild über deinen Telegram-Bot", "en": "📸 Alarm with a picture through your Telegram bot"},
      {"de": "Dein eigener Telegram-Bot schickt bei Wasser, Rauch oder Alarm den Grundriss mit dem Raum in Rot und das Bild der Kamera dort.",
       "en": "Your own Telegram bot sends the floor plan with the room in red and the picture of the camera there on water, smoke or an alarm."},
      "Telegram Bot Bild Foto Grundriss Kamera Alarm Wasser BotFather Schlüssel einfügen Chat-ID Telegram bot picture photo floor plan camera alarm water paste key chat ID")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.click("#sgNav button[data-group=alarm]")
    r.wait(1200)
    r.click("details.sgCard[data-card=notify] > summary")
    r.wait(1000)
    r.say("„Wohin?“: Telegram – eigener Bot, mit Bild.", "“Where to?”: Telegram – own bot, with a picture.")
    r.pg.select_option("#anVia", "tgbot")
    r.wait(1400)
    r.poster()
    r.say("Die Anleitung: bei BotFather einen Bot anlegen und seinen Schlüssel hier einfügen.", "The steps: make a bot with BotFather and paste its key here.")
    r.click("#alarmNotify .anBot details.anStepsBox > summary")
    r.wait(2600)
    r.say("Die ganze Nachricht von BotFather darf rein – der Schlüssel wird herausgesucht.", "BotFather's whole message may go in – the key is picked out.")
    r.click("#anBotToken")
    r.pg.fill("#anBotToken", "Use this token to access the HTTP API: 7712345678:AAF" + "k" * 32)
    r.pg.dispatch_event("#anBotToken", "input")
    r.wait(2200)
    r.say("Dem Bot „Hallo“ schreiben, dann „Chat finden“: der Chat ist angekreuzt und gespeichert.", "Write “Hello” to the bot, then “Find chat”: the chat is ticked and saved.")
    r.click("#anBotFind")
    r.wait(2400)
    r.say("Findet es nichts, trägst du die Chat-ID hier von Hand ein.", "If it finds nothing, you enter the chat ID here by hand.")
    r.click("#alarmNotify .anChatHand > summary")
    r.wait(2200)
    r.say("Bei Alarm kommt der Grundriss mit dem Raum in Rot, und das Bild der Kamera dort.", "On an alarm the floor plan comes with the room in red, and the picture of the camera there.")
    r.wait(2200)


@clip("version", "settings",
      {"de": "Version und Prüfsumme: ist alles aktuell?", "en": "Version and checksum: is everything up to date?"},
      {"de": "Oben das grüne Schild mit der Version: ein Tipp zeigt, ob Add-on, Browser und GitHub denselben Stand haben.",
       "en": "The green badge with the version at the top: a tap shows whether the add-on, the browser and GitHub are the same."},
      "Version Prüfsumme Update aktuell neu laden Stand GitHub Cache version checksum update current reload cache")
def _(r):
    r.say("Oben rechts: das Schild mit der Version.", "Top right: the badge with the version.")
    r.click("#versionPill")
    r.wait(1500)
    r.poster()
    r.say("Grün heißt: Add-on, Browser und GitHub sind gleich.", "Green means: the add-on, the browser and GitHub are the same.")
    r.wait(2200)
    r.say("Sonst lädt „Neu laden“ die neuesten Dateien.", "Otherwise “Reload” loads the newest files.")
    r.wait(1800)
    r.key("Escape")
    r.wait(600)


@clip("guest", "settings",
      {"de": "👥 Gäste-Zugang: Gäste steuern ihr Zimmer mit dem Handy", "en": "👥 Guest access: guests control their room with their phone"},
      {"de": "⚙ → Benutzer & Tablets → Gäste-Zugang: Zimmer und „bis“ wählen, den QR-Code ausdrucken. Die Gäste melden sich einmal als „gast“ an "
             "und sehen nur die Karte ihres Zimmers: Licht, Rollladen, Heizung, Musik. Danach ist der Zugang von selbst zu.",
       "en": "⚙ → Users & tablets → Guest access: choose the room and “until”, print the QR code. Guests log in once as “gast” and see only "
             "the card of their room: light, shutters, heating, music. Afterwards the access closes by itself."},
      "Gäste Gast Besuch Gästezimmer QR-Code Zugang Handy Ferienwohnung guest visitors guest room QR code access phone holiday flat",
      query="mode=edit")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen: „Benutzer & Tablets“, ganz unten „Gäste-Zugang“.", "In the settings: “Users & tablets”, at the very bottom “Guest access”.")
    r.click("#sgNav button[data-group=users]")
    r.wait(900)
    r.move("#guestOn")
    r.wait(600)
    r.click("#guestOn")
    r.wait(900)
    r.say("Das Zimmer der Gäste …", "The guests' room …")
    r.click("#guestRoom")
    r.loc("#guestRoom").select_option(index=3)
    r.wait(1100)
    r.say("… und bis wann sie bleiben. Danach ist der Zugang von selbst zu.", "… and until when they stay. Afterwards the access closes by itself.")
    r.click("#guestBox [data-days='3']")
    r.wait(1500)
    r.poster()
    r.say("Den QR-Code ausdrucken und ins Gästezimmer legen. Mit dem Handy scannen, als „gast“ anmelden – fertig.",
          "Print the QR code and put it in the guest room. Scan it with the phone, log in as “gast” – done.")
    r.move("#guestBox .guQr")
    r.wait(2600)
    r.say("Wie man den Benutzer „gast“ in Home Assistant anlegt, steht hier.", "How to make the user “gast” in Home Assistant is explained here.")
    r.click("#guestBox .guHow summary")
    r.wait(2400)


@clip("guest-view", "settings",
      {"de": "👥 Was der Gast sieht", "en": "👥 What the guest sees"},
      {"de": "Der Gast sieht nur die Karte seines Zimmers, oben „Willkommen“ und bis wann. Kein Alarm, keine Kameras, keine Einstellungen. Ist die Zeit um, steht dort „Der Gäste-Zugang ist beendet“.",
       "en": "The guest sees only the card of their room, “Welcome” and until when at the top. No alarm, no cameras, no settings. When the time is up it says “The guest access has ended”."},
      "Gast Gäste Handy Karte Zimmer steuern Licht Rollladen Heizung Musik guest phone card room control light shutters heating music",
      device="phone", query="gast=1")
def _(r):
    r.say("So sieht es der Gast auf seinem Handy: nur sein Zimmer.", "This is what the guest sees on their phone: only their room.")
    r.wait(2200)
    r.poster()
    r.say("Licht an und aus, heller oder dunkler …", "Light on and off, brighter or darker …")
    r.click("#roomPanel .rpLight", nth=1)
    r.wait(1600)
    r.say("… und Rollladen, Heizung und Musik in den Reitern.", "… and shutters, heating and music in the tabs.")
    r.click("#roomPanel .rpTab[data-tab=cover]")
    r.wait(2200)

