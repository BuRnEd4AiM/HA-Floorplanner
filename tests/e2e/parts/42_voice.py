"""4.19.0 (#509): the voice search. A question typed into the search box gets a row "💬 …" and an answer (Enter): "Welche Fenster sind
offen?" lists the open window and marks it with a ring; a code word of the settings ("Gute Stube") goes to its room; ⚙ → 🎤 Sprachsuche
shows what the device can do and adds a code word; with "Home Assistant Assist" chosen the 🎤 records (a test tone instead of a
microphone), api/voice/stt hands it to the mock Home Assistant, and what it "heard" is answered; the lock "voice" takes the 🎤 away and the
server refuses api/voice/stt. 4.19.1 (#511): ⚙ → 🎤 → 🩺 Mikrofon-Test (the facts of the device, the level of the microphone, what Assist
heard, the result to copy); in an app's built-in browser (Android WebView) the 🎤 takes Assist; a speech recognition that never starts
gives way to Assist after 5 s. 4.20.0 (#513): where the page may not listen (http://, an app without Assist) the 🎤 takes the keyboard's
dictation: the search box with the keyboard, what is typed into it is asked by itself after a pause; the microphone test says so.
"""
st_vs = api("api/settings")
set_setting("language", "de")
set_setting("voice", {"engine": "assist", "aliases": []})
def mock_vs(path, body=None):
    return json.load(urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode() if body is not None else None,
                                                                   method="POST" if body is not None else "GET", headers={"Content-Type": "application/json"})))
mock_vs("/_extra", {"binary_sensor.v_fenster1": {"state": "on", "attributes": {"friendly_name": "Fenster Stube links", "device_class": "window"}},
                    "binary_sensor.v_fenster2": {"state": "off", "attributes": {"friendly_name": "Fenster Stube rechts", "device_class": "window"}}})
set_state_vs = lambda e, s_: urllib.request.urlopen(f"{HA}/_set?e={e}&s={s_}").read()
mock_vs("/_voice", {"assist": True, "text": "Welche Fenster sind offen"})
own_vs = []
TONE = """navigator.mediaDevices.getUserMedia = async () => {      // a test tone instead of a microphone
  const ac = new AudioContext(), o = ac.createOscillator(), g = ac.createGain(), d = ac.createMediaStreamDestination();
  g.gain.value = 0.4; o.connect(g); g.connect(d); o.start(); await ac.resume(); return d.stream; };"""
pgS = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: own_vs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_vs.append("PAGEERROR " + str(e)))
pgS.add_init_script(TONE)
pgS.goto(BASE + "?debug=1"); pgS.wait_for_timeout(1500)
room_vs = pgS.evaluate("""() => {      // a room "Stube" with two windows that have a contact sensor, the first one open
  const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.rooms.push({ id: 'rv_stube', name: 'Stube', color: '#8a7f70', points: [[30, 30], [36, 30], [36, 35], [30, 35]] });
  f.walls.push({ id: 'wv_stube', a: [30, 30], b: [36, 30], thickness: 0.2, height: 2.6, openings: [
    { id: 'ov_1', type: 'window', pos: 1.5, width: 1, height: 1.2, sill: 0.9, name: 'Fenster Stube links', entity: 'binary_sensor.v_fenster1' },
    { id: 'ov_2', type: 'window', pos: 4.5, width: 1, height: 1.2, sill: 0.9, name: 'Fenster Stube rechts', entity: 'binary_sensor.v_fenster2' }] });
  window.__fp.rebuild();
  return f.rooms.at(-1).id; }""")
pgS.wait_for_timeout(400)

pgS.click("#findBtn"); pgS.fill("#findInput", "Welche Fenster sind offen?"); pgS.wait_for_timeout(300)
check("voice search (#509): a question typed into the search box gets the row '💬 Fenster · offen'",
      pgS.locator("#findList .findAsk").count() == 1 and "Fenster · offen" in pgS.inner_text("#findList .findAsk"), pgS.inner_text("#findList"))
pgS.press("#findInput", "Enter"); pgS.wait_for_timeout(600)
ans = pgS.inner_text("#findAnswer") if pgS.is_visible("#findAnswer") else ""
lst = pgS.inner_text("#findList")
check("voice search: Enter answers it: '🪟 Fenster · offen: 1', the open window in the list (not the shut one), a ring on it",
      "Fenster · offen: 1" in ans and "Fenster Stube links" in lst and "rechts" not in lst and pgS.evaluate("window.__fp.findMarks()") >= 1, (ans, lst))
pgS.click("#findList button:has-text('Fenster Stube links')"); pgS.wait_for_timeout(500)
check("voice search: a tap on a thing of the answer goes there (the box closes)", pgS.is_hidden("#findBox"))

pgS.evaluate("window.__fp.voiceAsk('Sind alle Fenster zu?')"); pgS.wait_for_timeout(500)
check("voice search: 'Sind alle Fenster zu?' lists the one that is still open", "Fenster · offen: 1" in pgS.inner_text("#findAnswer"), pgS.inner_text("#findAnswer"))
set_state_vs("binary_sensor.v_fenster1", "off"); pgS.wait_for_timeout(800)
pgS.evaluate("window.__fp.voiceAsk('Sind alle Fenster zu?')"); pgS.wait_for_timeout(500)
check("voice search: ... and says '✓ Fenster: alle zu' once it is shut", "✓ Fenster: alle zu" in pgS.inner_text("#findAnswer"), pgS.inner_text("#findAnswer"))
set_state_vs("binary_sensor.v_fenster1", "on"); pgS.wait_for_timeout(800)
pgS.evaluate("window.__fp.voiceAsk('Wie sieht es in der Stube aus?')"); pgS.wait_for_timeout(600)
check("voice search: 'Wie sieht es in der Stube aus?' opens the room 'Stube'", pgS.evaluate("window.__fp.focusedRoom()") == room_vs and "Stube" in pgS.inner_text("#findAnswer"),
      pgS.evaluate("window.__fp.focusedRoom()"))

# --- ⚙ → 🎤 Sprachsuche: what this device can do, a code word
pgS.click("#settingsBtn"); open_setting(pgS, "#vcAliases"); pgS.wait_for_timeout(1200)
status_vs = pgS.inner_text("#vcStatus")
check("voice settings: what this device can do (Home Assistant Assist can listen, 🎤 with Assist), the guide hidden while Assist works",
      "Home Assistant Assist kann Sprache erkennen" in status_vs and "🎤 mit" in status_vs and pgS.is_hidden("#vcGuide"), status_vs)
pgS.click("#vcAdd"); pgS.fill(".vcRow:last-child [data-role=say]", "Gute Stube"); pgS.press(".vcRow:last-child [data-role=say]", "Tab")
pgS.select_option(".vcRow:last-child [data-role=add]", f"r:{room_vs}"); pgS.wait_for_timeout(800)
al = api("api/settings").get("voice", {}).get("aliases", [])
check("voice settings: '＋ Codewort', a word and a room: stored as a code word for everybody, the room as a chip",
      any(a["say"] == "Gute Stube" and a["rooms"] == [room_vs] and not a["floor"] and not a["user"] for a in al)
      and "Stube" in pgS.inner_text(".vcRow:last-child .vcPlaces"), al)
pgS.click("#settingsDialog .dlgClose"); pgS.wait_for_timeout(300)
pgS.evaluate("window.__fp.focusedRoom() && window.__fp.switchFloor(window.__fp.floorIdx())")
pgS.evaluate("window.__fp.voiceAsk('Zeig mir die gute Stube')"); pgS.wait_for_timeout(600)
check("voice search: the code word 'gute Stube' goes to its room", pgS.evaluate("window.__fp.focusedRoom()") == room_vs, pgS.evaluate("window.__fp.focusedRoom()"))

# --- the 🎤 with Home Assistant's Assist: records (a test tone), the add-on sends it on, the mock "hears" a sentence
check("voice search: the 🎤 beside 🔍 shows (Assist chosen, the page may record)", pgS.is_visible("#voiceBtn"))
heard0 = len(mock_vs("/_voice", {})["heard"])
pgS.click("#voiceBtn"); pgS.wait_for_timeout(1500)
listening = pgS.evaluate("document.querySelector('#voiceBtn').classList.contains('listening')") and "Ich höre zu" in pgS.inner_text("#findAnswer")
pgS.click("#voiceBtn")                                              # a second tap: that was all
for _ in range(20):
    pgS.wait_for_timeout(300)
    if "Fenster · offen" in pgS.inner_text("#findAnswer"): break
voice_now = mock_vs("/_voice", {})
check("voice search: 🎤 listens (red, 'Ich höre zu …'), a second tap sends the sound to Home Assistant's Assist, what it heard is answered",
      listening and len(voice_now["heard"]) == heard0 + 1 and voice_now["heard"][-1] > 16000 and
      pgS.input_value("#findInput") == "Welche Fenster sind offen" and "Fenster · offen: 1" in pgS.inner_text("#findAnswer"),
      (listening, voice_now["heard"], pgS.input_value("#findInput"), pgS.inner_text("#findAnswer")))

# --- 4.19.1 (#511): the microphone test in ⚙ → 🎤 Sprachsuche; an app's built-in browser; a speech recognition that never starts
pgS.click("#settingsBtn"); open_setting(pgS, "#vkBox"); pgS.wait_for_timeout(1000)
facts_vs = pgS.inner_text("#vcStatus")
check("microphone test (#511): what this device is: a secure page, the browser, the 🎤 with Assist",
      "Sichere Verbindung" in facts_vs and "Gerät: Chrome" in facts_vs and "🎤 mit Home Assistant Assist" in facts_vs, facts_vs)
pgS.click("#vkMic"); pgS.wait_for_timeout(1500)
bar_vs = pgS.evaluate("parseFloat(document.querySelector('#vkLevel').style.width) || 0")
for _ in range(30):
    pgS.wait_for_timeout(300)
    if "hört dich" in pgS.inner_text("#vkResult"): break
check("microphone test: '1. Mikrofon prüfen' records (a test tone), the level bar moves, after 6 s 'Das Mikrofon … hört dich', a choice of microphones",
      bar_vs > 20 and "hört dich" in pgS.inner_text("#vkResult") and pgS.is_visible("#vkDevice") and pgS.locator("#vkDevice option").count() >= 1,
      (bar_vs, pgS.inner_text("#vkResult")))
heard1 = len(mock_vs("/_voice", {})["heard"])
pgS.click("#vkRec"); pgS.wait_for_timeout(1500); pgS.click("#vkRec")
for _ in range(20):
    pgS.wait_for_timeout(300)
    if "Erkannt mit" in pgS.inner_text("#vkResult"): break
check("microphone test: '2. Erkennung prüfen' sends the sound to Home Assistant's Assist and shows what it heard",
      "Erkannt mit Home Assistant Assist: „Welche Fenster sind offen“" in pgS.inner_text("#vkResult") and len(mock_vs("/_voice", {})["heard"]) == heard1 + 1,
      pgS.inner_text("#vkResult"))
pgS.click("#vkCopy"); pgS.wait_for_timeout(400)
rep_vs = pgS.input_value("#vkReport")
check("microphone test: '📋 Ergebnis kopieren' takes it all (version, browser, the facts, both steps)",
      "3D Floorplan" in rep_vs and "HeadlessChrome" in rep_vs and "Sichere Verbindung" in rep_vs and "hört dich" in rep_vs and "Erkannt mit" in rep_vs, rep_vs)
pgS.click("#settingsDialog .dlgClose"); pgS.wait_for_timeout(300)

set_setting("voice", {"engine": "auto", "aliases": []})
WEBVIEW = "Mozilla/5.0 (Linux; Android 11; Lenovo TB-X606F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Safari/537.36"
DEAD = """window.webkitSpeechRecognition = window.SpeechRecognition = class { start() {} stop() {} abort() {} };   // as in an app's built-in browser: it does nothing"""
def voice_page(no_assist=False, **kw):
    pg = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}, permissions=["microphone"], **kw)
    pg.on("pageerror", lambda e: own_vs.append("PAGEERROR " + str(e)))
    pg.add_init_script(TONE); pg.add_init_script(DEAD)
    if no_assist:                                                   # Home Assistant without speech-to-text (the server keeps api/voice a minute)
        pg.route("**/api/voice", lambda r: r.fulfill(json={"assist": False, "locked": False}))
    pg.goto(BASE + "?debug=1"); pg.wait_for_timeout(1500)
    return pg
pgW = voice_page(user_agent=WEBVIEW)
pgW.click("#settingsBtn"); open_setting(pgW, "#vkBox"); pgW.wait_for_timeout(1200)
st_w = pgW.inner_text("#vcStatus")
check("an app's built-in browser (Android WebView: Fully Kiosk, the Home Assistant app): its speech recognition counts as not working, the 🎤 takes Assist",
      "App mit eingebautem Browser" in st_w and "tut darin nichts" in st_w and "🎤 mit Home Assistant Assist" in st_w, st_w)
pgW.close()

pgD = voice_page()
heard2 = len(mock_vs("/_voice", {})["heard"])
pgD.click("#voiceBtn"); pgD.wait_for_timeout(800)
starting = "Mikrofon geht an" in pgD.inner_text("#findAnswer")
for _ in range(30):
    pgD.wait_for_timeout(300)
    if "Ich höre zu" in pgD.inner_text("#findAnswer"): break
pgD.wait_for_timeout(800); pgD.click("#voiceBtn")
for _ in range(20):
    pgD.wait_for_timeout(300)
    if pgD.input_value("#findInput") == "Welche Fenster sind offen": break
memo_vs = pgD.evaluate("JSON.parse(localStorage.getItem('fp.voiceDevice') || '{}').browser")
check("a speech recognition that never starts (#511): '🎤 Das Mikrofon geht an …', after 5 s Home Assistant's Assist listens instead and its words are answered; this device remembers it",
      starting and memo_vs == "broken" and pgD.input_value("#findInput") == "Welche Fenster sind offen" and len(mock_vs("/_voice", {})["heard"]) == heard2 + 1,
      (starting, memo_vs, pgD.input_value("#findInput"), pgD.inner_text("#findAnswer")))
pgD.close()

pgN = voice_page(no_assist=True, user_agent=WEBVIEW)
keys_btn = pgN.is_visible("#voiceBtn") and not pgN.evaluate("document.querySelector('#voiceBtn').classList.contains('cannot')")
pgN.click("#voiceBtn"); pgN.wait_for_timeout(500)
hint_vs, focus_vs = pgN.inner_text("#findAnswer"), pgN.evaluate("document.activeElement && document.activeElement.id")
pgN.keyboard.type("Welche Fenster sind offen", delay=40)          # as the keyboard's dictation types it
typed_vs = pgN.is_hidden("#findAnswer")                             # nothing asked while it is still coming
for _ in range(20):
    pgN.wait_for_timeout(300)
    if pgN.is_visible("#findAnswer"): break
ans_n = pgN.inner_text("#findAnswer") if pgN.is_visible("#findAnswer") else ""
check("the tablet without Assist (#513): the 🎤 takes the keyboard's dictation: a tap opens the search box with the keyboard and "
      "'Tippe ins Suchfeld, dann auf das 🎤 der Tastatur', what is dictated is answered by itself after a pause",
      keys_btn and "🎤 der Tastatur" in hint_vs and focus_vs == "findInput" and typed_vs and "Fenster" in ans_n and "Tastatur" not in ans_n,
      (keys_btn, hint_vs, focus_vs, typed_vs, ans_n))
pgN.click("#voiceBtn"); pgN.wait_for_timeout(300)
pgN.click("#findList button:has-text('Mikrofon-Test')"); pgN.wait_for_timeout(1200)
st_n = pgN.inner_text("#vcStatus")
check("... '🩺 Mikrofon-Test öffnen' opens ⚙ → 🎤 Sprachsuche: why the page may not listen ('Diese App … hat keine eigene Spracherkennung'), "
      "'🎤 mit dem Diktat der Tastatur', how to dictate",
      pgN.evaluate("document.querySelector('#settingsDialog').open") and pgN.evaluate("document.querySelector('#settingsDialog details[data-group=voice]').open")
      and "hat keine eigene Spracherkennung" in st_n and "🎤 mit dem Diktat der Tastatur" in st_n and "🎤 der Tastatur" in st_n, st_n)
pgN.close()
set_setting("voice", {"engine": "assist", "aliases": []})

# --- the lock "voice": no 🎤, the server refuses
set_setting("userLocks", {**api("api/settings").get("userLocks", {}), "kid_vs": ["voice"]})
pgK = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "kid_vs"})
pgK.add_init_script(TONE)
pgK.goto(BASE + "?debug=1"); pgK.wait_for_timeout(1500)
code_vs = pgK.evaluate("fetch('api/voice/stt', {method: 'POST', body: new Uint8Array(16000)}).then((r) => r.status)")
pgK.click("#findBtn"); pgK.wait_for_timeout(200)
check("voice search: the lock 'Sprachsuche' takes the 🎤 away (beside 🔍 and in the box), the search stays, api/voice/stt answers 403",
      pgK.is_hidden("#voiceBtn") and pgK.is_hidden("#findMic") and pgK.is_visible("#findInput") and code_vs == 403, code_vs)
pgK.close()

pgS.close()
check("voice search: no errors in the page", not own_vs, own_vs)
for k in ("voice", "userLocks", "language"):
    set_setting(k, st_vs.get(k))
mock_vs("/_extra", {})
