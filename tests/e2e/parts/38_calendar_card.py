"""4.13.0 (#495): the calendar card. In ✎ "＋ Karte" → 📅 Kalender: several of Home Assistant's calendars, each in a colour, the days,
the view (week, list, month, only the next event) and "＋ Termin", which puts a new event straight into a calendar of Home Assistant
(calendar.create_event). The events come from api/calendar/events (the add-on asks Home Assistant, kept 5 minutes, fresh after a new event).
"""
st_cc = api("api/settings")
set_setting("language", "de"); set_setting("pageLayouts", {})
urllib.request.urlopen(HA + "/_calreset").read()
own_cc = []
pgK = b.new_page(viewport={"width": 1400, "height": 1400}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgK.on("console", lambda m: own_cc.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgK.on("pageerror", lambda e: own_cc.append("PAGEERROR " + str(e)))
pgK.on("dialog", lambda d: d.accept())
lay_cc = lambda: api("api/settings").get("pageLayouts", {}).get("today", {})
cal_calls = lambda: [x for x in json.load(urllib.request.urlopen(HA + "/_calldata")) if x[0] == "create_event"]
def until_cc(fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgK.wait_for_timeout(ms)
    return fn()
card_cc = "[data-page=today] .ocCard.oc-calendar"
def set_view(view):                       # ✎ → ⚙️ of the card → the view → save → ✓ Fertig
    pgK.click("#tabBar .tbEdit"); pgK.wait_for_timeout(500)
    pgK.locator(f"[data-page=today] .bdItem.oc-calendar .bdTools .bdTool").first.click(); pgK.wait_for_timeout(600)
    pgK.click(f".ceDlg .ceSeg [data-v={view}]"); pgK.click(".ceDlg [data-act=save]"); pgK.wait_for_timeout(500)
    pgK.click("[data-page=today] [data-act=done]"); pgK.wait_for_timeout(1200)

pgK.goto(BASE + "?debug=1"); pgK.wait_for_timeout(1500)
if pgK.is_visible("#modeSwitch [data-mode=live]"): pgK.click("#modeSwitch [data-mode=live]"); pgK.wait_for_timeout(1000)
pgK.click("#tabBar [data-tab=today]"); pgK.wait_for_timeout(1200)
pgK.click("#tabBar .tbEdit"); pgK.wait_for_timeout(500)
pgK.click("[data-page=today] .bdAdd"); pgK.wait_for_timeout(400)
pgK.click(".ceDlg [data-type=calendar]"); pgK.wait_for_timeout(1000)
offered = pgK.evaluate("[...document.querySelectorAll('.ceDlg .calPick')].map((r) => r.dataset.cal)")
check("calendar card (#495): '＋ Karte' → 📅 Kalender lists Home Assistant's calendars, 'Hinzufügen' waits for one",
      offered == ["calendar.familie", "calendar.muell"] and pgK.is_disabled(".ceDlg [data-act=save]"), offered)
pgK.click(".ceDlg .calPick[data-cal='calendar.familie'] .calTick"); pgK.wait_for_timeout(200)
pgK.click(".ceDlg .calPick[data-cal='calendar.muell'] .calDot[data-color=red]"); pgK.wait_for_timeout(200)
pgK.click(".ceDlg .ceSeg [data-v=list]"); pgK.click(".ceDlg .ceSeg [data-v='14']"); pgK.wait_for_timeout(300)
check("calendar card: the preview shows both calendars in their colours", pgK.locator(".ceDlg .cePrev .calChip").count() == 2
      and "Zahnarzt" in until_cc(lambda: pgK.inner_text(".ceDlg .cePrev")), pgK.inner_text(".ceDlg .cePrev")[:200])
pgK.click(".ceDlg [data-act=save]"); pgK.wait_for_timeout(600)
cards_cc = until_cc(lambda: lay_cc().get("cards"))
check("calendar card: saved for everybody with its calendars, colours, days and view",
      cards_cc and cards_cc[0]["type"] == "calendar" and cards_cc[0]["cals"] == [{"id": "calendar.familie", "color": "blue"}, {"id": "calendar.muell", "color": "red"}]
      and cards_cc[0]["view"] == "list" and cards_cc[0]["days"] == 14 and cards_cc[0]["add"] is True, cards_cc)
pgK.click("[data-page=today] [data-act=done]"); pgK.wait_for_timeout(1200)
txt = until_cc(lambda: "Gelber Sack" in pgK.inner_text(card_cc) and pgK.inner_text(card_cc))
check("calendar card: the list shows the events of both calendars by day ('Heute' first)",
      txt and "Zahnarzt" in txt and "Gelber Sack" in txt and pgK.locator(f"{card_cc} .calGroup h4").first.inner_text() == "Heute", (txt or "")[:300])

# --- "＋ Termin"
pgK.click(f"{card_cc} [data-act=calAdd]"); pgK.wait_for_timeout(400)
pgK.click(".calDlg [data-act=calSave]"); pgK.wait_for_timeout(300)
check("＋ Termin: without a title it says so and sends nothing", "Titel" in pgK.inner_text(".calDlg .calErr") and not cal_calls(), pgK.inner_text(".calDlg .calErr"))
pgK.fill(".calDlg [data-act=calTitle]", "Elternabend"); pgK.select_option(".calDlg [data-act=calCal]", "calendar.familie")
pgK.fill(".calDlg [data-act=calFrom]", "19:00"); pgK.fill(".calDlg [data-act=calTo]", "20:30")
pgK.click(".calDlg [data-act=calSave]"); pgK.wait_for_timeout(1500)
calls = cal_calls()
check("＋ Termin: the event goes to Home Assistant (calendar.create_event with the time zone) and the window closes",
      calls and calls[-1][1] == "calendar.familie" and calls[-1][2]["summary"] == "Elternabend" and "T19:00:00" in calls[-1][2]["start_date_time"]
      and "T20:30:00" in calls[-1][2]["end_date_time"] and calls[-1][2]["start_date_time"][-6] in "+-" and not pgK.evaluate("document.querySelector('.calDlg').open"), calls)
check("＋ Termin: the card asks again and shows it", until_cc(lambda: "Elternabend" in pgK.inner_text(card_cc)), pgK.inner_text(card_cc)[:300])
pgK.click(f"{card_cc} [data-act=calAdd]"); pgK.wait_for_timeout(400)
pgK.fill(".calDlg [data-act=calTitle]", "Ferien"); pgK.check(".calDlg [data-act=calAllDay]")
day0 = pgK.input_value(".calDlg [data-act=calDay]")
pgK.evaluate("(d) => { const i = document.querySelector('.calDlg [data-act=calToDay]'); i.value = d; }",
             pgK.evaluate("(d) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + 2); return x.toISOString().slice(0, 10); }", day0))
check("＋ Termin: 'Ganztägig' hides from / to and shows the last day", not pgK.is_visible(".calDlg [data-act=calFrom]") and pgK.is_visible(".calDlg [data-act=calToDay]"))
pgK.click(".calDlg [data-act=calSave]"); pgK.wait_for_timeout(1200)
last = cal_calls()[-1][2]
check("＋ Termin: all day: start_date and the day after the last one as end_date", last.get("summary") == "Ferien" and last.get("start_date") == day0
      and last.get("end_date", "") > day0 and "start_date_time" not in last, last)

# --- the views
set_view("week")
check("calendar card: ▦ Woche: a column per day (14), today marked", pgK.locator(f"{card_cc} .calWeek .calDay").count() == 14
      and pgK.locator(f"{card_cc} .calDay.today").count() == 1 and pgK.locator(f"{card_cc} .calDay.today .calEv").count() >= 2)
set_view("month")
cells = pgK.locator(f"{card_cc} .calMonth .calCell").count()
check("calendar card: 🗓 Monat: whole weeks, today marked", cells >= 28 and cells % 7 == 0 and pgK.locator(f"{card_cc} .calCell.today").count() == 1, cells)
pgK.locator(f"{card_cc} .calCell:not(.other)").first.click(); pgK.wait_for_timeout(500)
check("calendar card: a tap on a day shows its events below", pgK.locator(f"{card_cc} .calCell.on").count() == 1 and pgK.locator(f"{card_cc} .calPicked h4").count() == 1)
set_view("next")
check("calendar card: 'Nur nächster Termin' shows one big, the others below", pgK.locator(f"{card_cc} .calNext").count() == 1
      and pgK.locator(f"{card_cc} .calNextTitle").inner_text() != "")
check("calendar card: no errors on the page", not own_cc, own_cc[:3])
pgK.close()
urllib.request.urlopen(HA + "/_calreset").read()
set_setting("pageLayouts", st_cc.get("pageLayouts", {})); set_setting("language", st_cc.get("language", ""))
