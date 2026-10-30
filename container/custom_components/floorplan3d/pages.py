"""The two pages this integration answers itself, in German and English like the plan's own login pages.

* ``sign_in_page``: the browser opened /floorplan/ without a session. Following the plan's redirect would end on Home Assistant's
  /auth/callback — a page Home Assistant does not serve, because the plan is under /floorplan/ and builds its own address from Host.
  The page asks Home Assistant for a session instead (with the token Home Assistant's own frontend keeps for this address) and then
  loads the plan again.
* ``not_ready_page``: the integration is loaded but has no config entry yet, or its entry could not be set up; the Home Assistant
  log has the reason.

Pure: no aiohttp, no Home Assistant (tests/test_container_dashboard.py).
"""
import json

_STYLE = """  body { font-family: system-ui, sans-serif; margin: 2em; line-height: 1.5; text-align: center; }
  p { margin: .5em 0; }"""


def _quoted(value) -> str:
    """a JS string literal that cannot end the <script> element (the address comes from the request)"""
    return json.dumps(str(value)).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def _page(body: str, script: str = "") -> str:
    return f"""<!doctype html>
<html lang="de">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>3D Floorplan</title>
<style>
{_STYLE}
</style>
<body>
{body}
{script}
</body>
"""


def sign_in_page(target: str, session_path: str) -> str:
    """the page a browser without a session gets, going on to `target` once Home Assistant said who asks"""
    body = """<h2>3D Floorplan</h2>
<p id="de">Am Grundriss anmelden …</p>
<p id="en" lang="en">Signing in to the floor plan …</p>
<p id="home" hidden><a href="/">Home Assistant</a></p>"""
    script = f"""<script>
  const target = {_quoted(target)};
  const de = document.getElementById("de");
  const en = document.getElementById("en");
  function fail(german, english) {{
    de.textContent = german;
    en.textContent = english;
    document.getElementById("home").hidden = false;
  }}
  async function token() {{
    let tokens = null;
    try {{ tokens = JSON.parse(localStorage.getItem("hassTokens") || "null"); }} catch (e) {{ tokens = null; }}
    if (!tokens) return null;
    if (tokens.access_token && (!tokens.expires || Date.now() < tokens.expires - 30000)) return tokens.access_token;
    if (!tokens.refresh_token) return null;
    try {{
      // Home Assistant's own client id: the token was issued for this address, not for something this page invents.
      const body = new URLSearchParams({{ grant_type: "refresh_token", refresh_token: tokens.refresh_token,
                                         client_id: tokens.clientId || location.origin + "/" }});
      const answer = await fetch("/auth/token", {{ method: "POST", body }});
      if (!answer.ok) return null;
      return (await answer.json()).access_token || null;
    }} catch (e) {{ return null; }}
  }}
  (async () => {{
    const access = await token();
    if (!access) {{
      fail("Nicht bei Home Assistant angemeldet. Bitte Home Assistant öffnen und dort anmelden, dann diese Seite neu laden.",
           "Not signed in to Home Assistant. Open Home Assistant, sign in there, then reload this page.");
      return;
    }}
    let answer = null;
    try {{
      answer = await fetch({_quoted(session_path)}, {{ method: "POST", headers: {{ Authorization: "Bearer " + access }}, credentials: "same-origin" }});
    }} catch (e) {{ answer = null; }}
    if (!answer || !answer.ok) {{
      fail("Die Anmeldung am Grundriss hat nicht geklappt. Ist die Integration eingerichtet und läuft der Container? Das Home-Assistant-Protokoll nennt den Grund.",
           "Signing in to the floor plan did not work. Is the integration added and the container running? The Home Assistant log says why.");
      return;
    }}
    location.replace(target);
  }})();
</script>"""
    return _page(body, script)


def not_ready_page() -> str:
    """the integration is loaded but has no config entry yet, or the entry failed to set up: say what to do, not “restart”"""
    body = """<h2>3D Floorplan</h2>
<p id="de">Diese Integration ist noch nicht eingerichtet. Bitte unter Einstellungen → Geräte &amp; Dienste hinzufügen;
ist sie schon eingerichtet, steht der Grund im Home-Assistant-Protokoll.</p>
<p id="en" lang="en">This integration is not set up yet. Add it under Settings → Devices &amp; services; if it already is, the
Home Assistant log says why it could not start.</p>
<p><a href="/">Home Assistant</a></p>"""
    return _page(body)
