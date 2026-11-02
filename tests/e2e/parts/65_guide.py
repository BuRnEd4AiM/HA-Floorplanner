"""4.52.0 (the owner, 2026-11-02): 🎬 the video guide. The button "Anleitung" at the top only for those who may edit, its window shows the
page of the guide from GitHub Pages (here a stand-in: the test needs no internet) with the size of the copy for without internet."""
st_vg = api("api/settings")
set_setting("language", "de")
SITE_VG = "https://burned4aim.github.io/HA-Floorplanner/guide/"
GUIDE_VG = {"version": "4.52.0", "cats": [], "clips": [{"id": "light", "cat": "live", "v": {"de": {"kb": 30000, "steps": []}}},
                                                       {"id": "rooms", "cat": "edit", "v": {"de": {"kb": 20000, "steps": []}}}]}
errs_vg = []
pgG = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgG.on("pageerror", lambda e: errs_vg.append("PAGEERROR " + str(e)))
def site_vg(route):
    if route.request.url.split("?")[0].endswith("guide.json"):
        route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=json.dumps(GUIDE_VG))
    else:
        route.fulfill(status=200, content_type="text/html", body="<!doctype html><title>guide</title><h1 id=gv>Video guide stand-in</h1>")
pgG.route(SITE_VG + "**", site_vg)
pgG.goto(BASE + "?debug=1&mode=live"); pgG.wait_for_timeout(1500)
check("guide: the button 🎬 Anleitung is at the top for who may edit", pgG.is_visible("#guideBtn") and "Anleitung" in pgG.inner_text("#guideBtn"), pgG.inner_text("#guideBtn"))
pgG.click("#guideBtn"); pgG.wait_for_timeout(1500)
check("guide: its window opens", pgG.is_visible("dialog.guideDlg[open]"))
src_vg = pgG.get_attribute("dialog.guideDlg .gvFrame", "src") or ""
check("guide: the window shows the page on the internet in German, without its big title", src_vg.startswith(SITE_VG) and "embed=1" in src_vg and "lang=de" in src_vg, src_vg)
for _ in range(20):
    if "MB" in (pgG.inner_text("dialog.guideDlg .gvSave") or ""): break
    pgG.wait_for_timeout(300)
check("guide: 📥 says how big the copy for without internet gets", "(49 MB)" in pgG.inner_text("dialog.guideDlg .gvSave") and pgG.is_enabled("dialog.guideDlg .gvSave"), pgG.inner_text("dialog.guideDlg .gvSave"))
check("guide: no saved copy yet, the videos come from the internet", "Internet" in pgG.inner_text("dialog.guideDlg .gvStatus") and not pgG.is_visible("dialog.guideDlg .gvDel"), pgG.inner_text("dialog.guideDlg .gvStatus"))
frame_vg = pgG.frame_locator("dialog.guideDlg .gvFrame")
check("guide: the page is in the window", frame_vg.locator("#gv").inner_text(timeout=5000) == "Video guide stand-in")
pgG.click("dialog.guideDlg .gvClose"); pgG.wait_for_timeout(400)
check("guide: ✕ closes the window", not pgG.is_visible("dialog.guideDlg[open]"))
check("guide: api/guide says there is no copy and nothing is loading", (lambda s: s["local"] is False and s["state"] == "idle")(api_admin("api/guide")), api_admin("api/guide"))
check("guide: no page errors", not errs_vg, errs_vg)
pgG.close()
pgR = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "tablet_wz"})
pgR.goto(BASE + "?debug=1"); pgR.wait_for_timeout(1500)
check("guide: a tablet that may not edit has no button", not pgR.is_visible("#guideBtn"))
pgR.close()
set_setting("language", st_vg.get("language", "auto"))
