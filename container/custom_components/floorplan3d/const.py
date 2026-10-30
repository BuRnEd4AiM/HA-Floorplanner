"""Constants of the 3D Floorplan (Container) integration."""
DOMAIN = "floorplan3d"

# Where the plan is served on Home Assistant's own address. Fixed on purpose: the plan's relative URLs, the dashboard card and the
# pages this integration serves itself are all built from it, and a user-chosen prefix would break the plan's own login (it builds its
# client id from the address it is opened at, without this prefix).
PATH = "/floorplan"
SESSION_PATH = f"/api/{DOMAIN}/session"

# The dashboard card ships with the integration: it is served from here and loaded on every page by the integration itself, so
# there is no file in /config/www and no dashboard resource to register by hand. (It is a route too, so like /floorplan/ it exists
# after Home Assistant has started once with the integration.)
FRONTEND_PATH = f"/{DOMAIN}-card"
CARD_FILE = f"{DOMAIN}-container-card.js"
CARD_IMPL_FILE = f"{DOMAIN}-container-card-impl.js"

CONF_ADDRESS = "address"
# Only the prefill of the dialog: the container normally runs on another computer, so this is a hint, not a default.
DEFAULT_ADDRESS = "http://127.0.0.1:8100"

# The plan's own cookies (halogin.py in the add-on's code). The integration drives that login, it does not invent a second one;
# tests/test_container_dashboard.py checks the names against the container.
LOGIN_COOKIE = "fp3d_login"
SESSION_COOKIE = "fp3d_session"

# Seconds. A model or a backup (the container allows up to 200 MB) may take a while, a dead connection must not.
CONNECT_TIMEOUT = 15
READ_TIMEOUT = 300
HANDSHAKE_TIMEOUT = 30
# Bytes per chunk when a download is passed on: big enough for the LAN, small enough for a Raspberry Pi's memory.
CHUNK = 64 * 1024
