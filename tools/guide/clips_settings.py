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
             "(✋ nur ansehen, 💡 nur an/aus, 🎚 alles) und eigene Werte fürs Wandtablet (auch die Helligkeit mit Fully Kiosk).",
       "en": "For every user or tablet: which room first, which pages, what is locked, what it may switch per kind of device "
             "(✋ only look, 💡 only on/off, 🎚 everything) and its own wall tablet values (also the brightness with Fully Kiosk)."},
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
    r.say("Je Geräteart: ✋ nur ansehen, 💡 nur an und aus, 🎚 alles. Und unter „📱 Wandtablet“ eigene Werte für dieses Tablet.",
          "Per kind of device: ✋ only look, 💡 only on and off, 🎚 everything. And under “📱 Wall tablet” own values for this tablet.")
    r.move("#tabletRows .tablet:last-child .rtBox select[data-right=light]")
    r.wait(2400)
    r.say("„Wer sieht was“ zeigt alles in einer Tabelle.", "“Who sees what” shows everything in a table.")
    r.click("#pvTableBtn")
    r.wait(2000)


@clip("backup", "settings",
      {"de": "Backup: alles sichern und zurückholen", "en": "Backup: save everything and restore it"},
      {"de": "„Backup“ lädt alles als eine Datei herunter: Häuser, Einstellungen, Bilder, die Codes und auf Wunsch die Aufzeichnungen "
             "und die CallMeBot-Schlüssel. Mit der Datei kommt alles wieder zurück.",
       "en": "“Backup” downloads everything as one file: houses, settings, pictures, the codes and, if you like, the recordings and "
             "the CallMeBot keys. With that file everything comes back."},
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
    r.say("… und auf Wunsch die CallMeBot-Schlüssel. Die stehen lesbar drin: die Datei dann nicht weitergeben.",
          "… and, if you like, the CallMeBot keys. They are readable in the file: then do not pass it on.")
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
      {"de": "Wandtablet: Bildschirmschoner, Nacht, Bewegungsmelder, Putzen", "en": "Wall tablet: screen saver, night, motion sensor, cleaning"},
      {"de": "⚙ → Wandtablet: wohin das Tablet nach einer Weile zurückgeht, welcher Bildschirmschoner (Haus dreht sich, Etagen nacheinander, "
             "große Uhr, schwarz) und wann, wie dunkel die Nacht wird, ein Bewegungsmelder weckt es, jede Nacht neu laden, 🧽 zum Putzen sperren.",
       "en": "⚙ → Wall tablet: where the tablet goes back to after a while, which screen saver (house turns, floors in turn, big clock, black) "
             "and when, how dark the night gets, a motion sensor wakes it, reload every night, 🧽 locks it for cleaning."},
      "Wandtablet Tablet Kiosk Startansicht zurück Bildschirmschoner Uhr schwarz Etagen dunkel Nacht Bewegungsmelder putzen neu laden "
      "wall tablet kiosk start view screen saver clock black floors dim night motion sensor cleaning reload", query="mode=live")
def _(r):
    r.click("#settingsBtn")
    r.wait(900)
    r.say("In den Einstellungen: „Wandtablet“.", "In the settings: “Wall tablet”.")
    r.click("#sgNav button[data-group=tablet]")
    r.wait(1300)
    r.say("Die Startansicht: dorthin geht das Tablet nach einer Weile zurück. Die Anleitung zum Einrichten ist eine Zeile zum Aufklappen.",
          "The start view: the tablet goes back there after a while. How to set it up is a line that folds open.")
    r.move("details.tabletGuide > summary")
    r.wait(1800)
    r.say("Der Bildschirmschoner: das Haus dreht sich, die Etagen nacheinander, eine große Uhr oder schwarz.",
          "The screen saver: the house turns, the floors in turn, a big clock or black.")
    r.click(".segBtns[data-for=setSaver] button[data-value=clock]")
    r.wait(1800)
    r.say("Ein Bewegungsmelder weckt das Tablet, sobald jemand davorsteht.", "A motion sensor wakes the tablet as soon as somebody stands in front of it.")
    r.move("#setWakeSensor")
    r.wait(1800)
    r.say("Nachts: wie dunkel, nach wie vielen Minuten, auf Wunsch mit Uhr.", "At night: how dark, after how many minutes, with a clock if you like.")
    r.move("#setNightLevel")
    r.wait(1800)
    r.say("Dazu: jede Nacht neu laden und der 🧽 Putz-Knopf. Jedes Tablet kann eigene Werte haben (Benutzer & Tablets).",
          "And: reload every night and the 🧽 cleaning button. Every tablet can have its own values (Users & tablets).")
    r.move("#setCleanBtn")
    r.wait(2200)
    r.key("Escape")
    r.wait(600)
    r.say("So sieht die Uhr aus: Datum und Wetter dazu. Die erste Berührung weckt nur.", "This is the clock: with the date and the weather. The first touch only wakes it.")
    r.js("Object.assign(window.__fp.settings(), { saver: 'clock', saverAfter: 1, nightDim: 'off' }); window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()")
    r.wait(1200)
    r.poster()
    r.wait(2000)
    r.click(900, 500)
    r.wait(900)


@clip("notify", "settings",
      {"de": "Nachricht aufs Handy bei Alarm", "en": "A message to your phone on an alarm"},
      {"de": "⚙ → Warnungen & Alarm → Karte „Nachricht aufs Handy“: bei Rauch, Gas, Wasser oder Alarm kommt eine Nachricht per WhatsApp, Telegram oder die Home-Assistant-App.",
       "en": "⚙ → Warnings & alarm → card “Message to your phone”: on smoke, gas, water or an alarm a message comes by WhatsApp, Telegram or the Home Assistant app."},
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
