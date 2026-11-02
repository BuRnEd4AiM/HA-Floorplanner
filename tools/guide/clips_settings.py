"""Clips of the group "Einstellungen": language and design, finding a setting, users and tablets, backup, full screen."""
from recorder import clip


@clip("language", "settings",
      {"de": "Sprache und Design", "en": "Language and design"},
      {"de": "⚙ → Allgemein: acht Sprachen, ein dunkles oder helles Design und die Einheiten.",
       "en": "⚙ → General: eight languages, a dark or light design and the units."},
      "Sprache Deutsch Englisch Design hell dunkel Einheiten Einstellungen language german english design light dark units settings")
def _(r):
    r.say("Oben rechts: ⚙ Einstellungen.", "Top right: ⚙ settings.")
    r.click("#settingsBtn")
    r.wait(1000)
    lang, theme = r.loc("#setLanguage"), r.loc("#setTheme")
    r.say("Die Sprache …", "The language …")
    r.click(lang)
    lang.select_option("en" if r.lang == "de" else "de")
    r.wait(1600)
    r.click(lang)
    lang.select_option(r.lang)
    r.wait(1200)
    r.say("… und das Design: hell, dunkel oder Hologramm.", "… and the design: light, dark or hologram.")
    r.click(theme)
    theme.select_option("light")
    r.wait(1500)
    r.poster()
    theme.select_option("holo")
    r.wait(1500)
    theme.select_option("dark")
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


@clip("users", "settings",
      {"de": "Benutzer und Wandtablets", "en": "Users and wall tablets"},
      {"de": "Für jeden Benutzer oder jedes Tablet: welcher Raum zuerst, welche Seiten, was gesperrt ist.",
       "en": "For every user or tablet: which room first, which pages, what is locked."},
      "Benutzer Tablet Wandtablet Rechte sperren Kinder Seiten wer sieht was Admin users tablet wall tablet rights lock children pages admin")
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
    r.wait(1800)
    r.say("„Wer sieht was“ zeigt alles in einer Tabelle.", "“Who sees what” shows everything in a table.")
    r.click("#pvTableBtn")
    r.wait(2000)


@clip("backup", "settings",
      {"de": "Backup: alles sichern und zurückholen", "en": "Backup: save everything and restore it"},
      {"de": "„Backup“ lädt alle Pläne und Einstellungen als eine Datei herunter und spielt sie wieder ein.",
       "en": "“Backup” downloads all plans and settings as one file and restores them."},
      "Backup Sicherung sichern wiederherstellen Datei herunterladen hochladen backup save restore file download upload")
def _(r):
    r.say("Oben: „Backup“.", "At the top: “Backup”.")
    r.click("#backupBtn")
    r.wait(1300)
    r.poster()
    r.say("Herunterladen sichert alle Häuser, Seiten und Einstellungen in einer Datei.", "Download saves every house, page and setting in one file.")
    r.wait(2000)
    r.say("Mit der Datei holst du später alles zurück.", "With that file you get everything back later.")
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
