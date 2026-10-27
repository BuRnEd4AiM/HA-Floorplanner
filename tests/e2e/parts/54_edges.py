"""4.34.0 (#560): smoothing the edges, chosen per device in ⚙ "Kantenglättung auf diesem Gerät". A frame drawn through the picture of its own
has exactly the colours of one drawn straight; "glatt, wenn das Bild steht" draws straight while the camera turns and smooth when it stands;
"nachträglich" through the soft-edge shader; the choice is kept in the browser (the page reloads) and the performance display names it.
"""
def free_spot(pg):
    return pg.evaluate("""() => { for (let y = innerHeight * 0.45; y < innerHeight * 0.9; y += 10) for (let x = innerWidth * 0.3; x < innerWidth * 0.7; x += 10)
        if (document.elementFromPoint(x, y)?.id === 'view') return [x, y]; return null; }""")

pgE = b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgE.goto(BASE + "?debug=1&edges=still&fps=all"); pgE.wait_for_function("window.__fp?.ready()", timeout=30000); pgE.wait_for_timeout(1500)
check("edges (#560): ?edges=still starts without the canvas' own smoothing", pgE.evaluate("window.__fp.renderer.getContext().getContextAttributes().antialias") is False)
cmp = pgE.evaluate("window.__fp.edgesCompare()")
check("edges: a frame through the picture of its own has exactly the colours of one drawn straight", cmp["diff"] == 0 and cmp["pixels"] > 1000, cmp)
spot = free_spot(pgE)
pgE.mouse.move(*spot); pgE.mouse.down()
paths = []
for i in range(40):
    pgE.mouse.move(spot[0] + i * 4, spot[1]); pgE.wait_for_timeout(20)
    if i % 10 == 9: paths.append(pgE.evaluate("window.__fp.edges().path"))
pgE.mouse.up()
check("edges: while the camera turns the frames are drawn straight (fast)", paths.count("direct") >= 3, paths)
pgE.wait_for_function("window.__fp.edges().path === 'smooth'", timeout=8000)
check("edges: as soon as the picture stands it is smoothed", pgE.evaluate("window.__fp.edges().path") == "smooth")
pgE.wait_for_timeout(700)
hud = pgE.inner_text("#perfHud")
check("edges: the performance display names the smoothing", "Kanten: glatt im Stillstand" in hud or "Edges: smooth when still" in hud, hud)

pgE.goto(BASE + "?debug=1&edges=fxaa"); pgE.wait_for_function("window.__fp?.ready()", timeout=30000); pgE.wait_for_timeout(1200)
check("edges: ?edges=fxaa draws through the soft-edge shader", pgE.evaluate("window.__fp.edges()") == {"mode": "fxaa", "path": "fxaa", "weak": None})

# the choice in the settings, kept in this browser
pgE.goto(BASE + "?debug=1"); pgE.wait_for_function("window.__fp?.ready()", timeout=30000); pgE.wait_for_timeout(800)
check("edges: without a choice as before (the canvas smooths)", pgE.evaluate("window.__fp.edges().mode") == "msaa"
      and pgE.evaluate("window.__fp.renderer.getContext().getContextAttributes().antialias") is True and pgE.input_value("#setEdges") == "default")
pgE.click("#settingsBtn"); pgE.wait_for_timeout(200); open_setting(pgE, "#setEdges")
with pgE.expect_navigation():
    pgE.select_option("#setEdges", "auto")
pgE.wait_for_function("window.__fp?.ready()", timeout=30000); pgE.wait_for_timeout(800)
check("edges: the choice in ⚙ is kept in this browser and used after the reload", pgE.evaluate("localStorage.getItem('fp.edges')") == "auto"
      and pgE.evaluate("window.__fp.edges().mode") == "auto" and pgE.input_value("#setEdges") == "auto")
pgE.click("#settingsBtn"); pgE.wait_for_timeout(200); open_setting(pgE, "#setEdges")
with pgE.expect_navigation():
    pgE.select_option("#setEdges", "default")
pgE.wait_for_function("window.__fp?.ready()", timeout=30000); pgE.wait_for_timeout(500)
check("edges: back to the default", pgE.evaluate("localStorage.getItem('fp.edges')") is None and pgE.evaluate("window.__fp.edges().mode") == "msaa")
pgE.close()
